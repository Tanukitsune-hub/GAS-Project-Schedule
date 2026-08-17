'use strict';

const assert = require('node:assert');
const {
  GateError,
  canonicalPayloadFileNames,
  claspProjectConfig,
  inventoryForCommittedPayload,
  prepareWork0004PushAttempt,
  nextWork0004RemoteAttemptState
} = require('../tools/local_clasp_dev');
const {
  creationStateFileName,
  assertInitialWorkspaceEntries,
  safeStateBase,
  isExactWork0004Branch,
  normalizeWork0004Command
} = require('../tools/work_0004_target_bootstrap');

const tests = [];
function test(id, body) {
  try {
    body();
    tests.push({ id, status: 'PASS' });
  } catch (error) {
    tests.push({
      id,
      status: 'FAIL',
      safe_message: String(error && (error.code || error.message) || error)
    });
  }
}

const salt = Buffer.alloc(32, 4);
const syntheticUser = { email: 'work0004.synthetic@gmail.com', id: 'synthetic-user' };
const scriptId = 's'.repeat(32);
const parentId = 'p'.repeat(32);
const baseState = Object.assign(safeStateBase(salt, syntheticUser), {
  phase: 'INSPECTION_PASS',
  inspection_attempt_count: 1,
  parent_id: parentId,
  script_id: scriptId,
  target_fingerprint: 'f'.repeat(64)
});
const config = claspProjectConfig(scriptId);
const target = {
  work_id: '0004',
  target_kind: 'PERSONAL_SYNTHETIC_DEV',
  expected_script_id: scriptId,
  expected_parent_id: parentId,
  principal_fingerprint: baseState.principal_fingerprint,
  target_fingerprint: baseState.target_fingerprint,
  target_disposition: 'FRESH_SYNTHETIC_CREATED'
};

test('WORK_0004_STATE_FILE_IS_DISTINCT_FROM_WORK_0003', () => {
  assert.strictEqual(creationStateFileName, 'work-0004-creation-state.json');
  assert.notStrictEqual(creationStateFileName, 'creation-state.json');
});

test('EXTERNAL_LANE_REQUIRES_EXACT_WORK_0004_BRANCH', () => {
  assert.strictEqual(
    isExactWork0004Branch('codex/0004-controlled-synthetic-placement'), true
  );
  assert.strictEqual(
    isExactWork0004Branch('codex/0003-controlled-remote-placement'), false
  );
  assert.strictEqual(isExactWork0004Branch(''), false);
});

test('ARBITRARY_COMMAND_IS_REDUCED_TO_CLOSED_ENUM', () => {
  assert.strictEqual(normalizeWork0004Command('create-synthetic'), 'create-synthetic');
  assert.strictEqual(normalizeWork0004Command('account@example.invalid'), 'UNKNOWN');
});

test('STAGING_USES_EXACT_COMMITTED_CURRENT_PAYLOAD_BYTES', () => {
  const inventory = inventoryForCommittedPayload(
    canonicalPayloadFileNames.slice().sort()
  );
  assert.strictEqual(inventory.file_count, 24);
  assert.strictEqual(
    inventory.payload_sha256,
    '8eb098ef779ffb5ac86724c65d9ac60f3634baf603a83dc478e638a6d048072c'
  );
});

test('WORK_0004_CONFIG_PRESERVES_GS_PULL_FILENAMES', () => {
  assert.deepStrictEqual(config.scriptExtensions, ['.gs', '.js']);
  assert.strictEqual(config.scriptExtensions[0], '.gs');
});

test('FRESH_WORKSPACE_ACCEPTS_ONLY_STAGING_ARTIFACTS', () => {
  assert.doesNotThrow(() => assertInitialWorkspaceEntries([
    'payload', '.claspignore', 'payload-inventory.json'
  ]));
});

test('FRESH_WORKSPACE_REJECTS_WORK_0003_STATE', () => {
  assert.throws(
    () => assertInitialWorkspaceEntries(['payload', 'creation-state.json']),
    (error) => error && error.code ===
      'WORK_0004_SYNTHETIC_TARGET_CREATE_ALREADY_ATTEMPTED'
  );
});

test('FRESH_WORKSPACE_REJECTS_EXISTING_WORK_0004_STATE', () => {
  assert.throws(
    () => assertInitialWorkspaceEntries(['payload', creationStateFileName]),
    (error) => error && error.code ===
      'WORK_0004_SYNTHETIC_TARGET_CREATE_ALREADY_ATTEMPTED'
  );
});

test('WORK_0004_STATE_STARTS_EXACTLY_ONE_CREATION_TRANCHE', () => {
  const state = safeStateBase(salt, syntheticUser);
  assert.strictEqual(state.work_id, '0004');
  assert.strictEqual(state.create_attempt_count, 1);
  assert.strictEqual(state.inspection_attempt_count, 0);
  assert.strictEqual(state.push_attempt_count, 0);
  assert.strictEqual(state.pull_attempt_count, 0);
  assert.strictEqual(state.phase, 'ATTEMPT_STARTED');
});

test('WORK_0004_STATE_DOES_NOT_CONTAIN_PRINCIPAL_IDENTIFIER', () => {
  const serialized = JSON.stringify(safeStateBase(salt, syntheticUser));
  assert.strictEqual(serialized.includes(syntheticUser.email), false);
  assert.strictEqual(serialized.includes(syntheticUser.id), false);
});

test('PUSH_ATTEMPT_IS_RECORDED_BEFORE_REMOTE_CALL', () => {
  const next = nextWork0004RemoteAttemptState(baseState, config, target, 'push');
  assert.strictEqual(next.push_attempt_count, 1);
  assert.strictEqual(next.pull_attempt_count, 0);
  assert.strictEqual(next.phase, 'PUSH_ATTEMPT_STARTED');
  assert.strictEqual(baseState.push_attempt_count, 0);
});

test('NATIVE_INVENTORY_FAILURE_PREVENTS_PUSH_ATTEMPT_RECORD', () => {
  const calls = [];
  assert.throws(() => prepareWork0004PushAttempt(
    'synthetic-workspace', config, target, {
      assertClaspNativePayloadSelection: () => {
        calls.push('native-inventory');
        throw new GateError('CLASP_NATIVE_PAYLOAD_SELECTION_INVALID');
      },
      beginWork0004RemoteAttempt: () => calls.push('begin-attempt')
    }
  ), (error) => error instanceof GateError &&
    error.code === 'CLASP_NATIVE_PAYLOAD_SELECTION_INVALID');
  assert.deepStrictEqual(calls, ['native-inventory']);
});

test('NATIVE_INVENTORY_PASSES_BEFORE_PUSH_ATTEMPT_RECORD', () => {
  const calls = [];
  const status = prepareWork0004PushAttempt(
    'synthetic-workspace', config, target, {
      assertClaspNativePayloadSelection: () => {
        calls.push('native-inventory');
        return { file_count: 24 };
      },
      beginWork0004RemoteAttempt: () => calls.push('begin-attempt')
    }
  );
  assert.deepStrictEqual(calls, ['native-inventory', 'begin-attempt']);
  assert.strictEqual(status.file_count, 24);
});

test('SECOND_PUSH_ATTEMPT_IS_REFUSED', () => {
  const started = nextWork0004RemoteAttemptState(baseState, config, target, 'push');
  assert.throws(
    () => nextWork0004RemoteAttemptState(started, config, target, 'push'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0004_PUSH_ALREADY_ATTEMPTED'
  );
});

test('PULL_REQUIRES_ONE_SUCCESSFUL_PUSH', () => {
  assert.throws(
    () => nextWork0004RemoteAttemptState(baseState, config, target, 'pull-verify'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0004_PULL_ALREADY_ATTEMPTED_OR_PUSH_NOT_PASSED'
  );
});

test('PULL_ATTEMPT_IS_RECORDED_BEFORE_REMOTE_CALL', () => {
  const pushed = Object.assign({}, baseState, {
    phase: 'PUSH_PASS',
    push_attempt_count: 1
  });
  const next = nextWork0004RemoteAttemptState(
    pushed, config, target, 'pull-verify'
  );
  assert.strictEqual(next.push_attempt_count, 1);
  assert.strictEqual(next.pull_attempt_count, 1);
  assert.strictEqual(next.phase, 'PULL_ATTEMPT_STARTED');
});

test('SECOND_PULL_ATTEMPT_IS_REFUSED', () => {
  const pulled = Object.assign({}, baseState, {
    phase: 'PULL_ATTEMPT_STARTED',
    push_attempt_count: 1,
    pull_attempt_count: 1
  });
  assert.throws(
    () => nextWork0004RemoteAttemptState(pulled, config, target, 'pull-verify'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0004_PULL_ALREADY_ATTEMPTED_OR_PUSH_NOT_PASSED'
  );
});

test('WORK_0003_STATE_CANNOT_AUTHORIZE_WORK_0004_REMOTE_ACTION', () => {
  const work0003State = Object.assign({}, baseState, { work_id: '0003' });
  assert.throws(
    () => nextWork0004RemoteAttemptState(work0003State, config, target, 'push'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0004_REMOTE_STATE_INVALID'
  );
});

test('UNINSPECTED_TARGET_CANNOT_AUTHORIZE_PUSH', () => {
  const uninspected = Object.assign({}, baseState, {
    phase: 'LOCAL_BINDING_WRITTEN',
    inspection_attempt_count: 0
  });
  assert.throws(
    () => nextWork0004RemoteAttemptState(uninspected, config, target, 'push'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0004_REMOTE_STATE_INVALID'
  );
});

test('MISMATCHED_TARGET_BINDING_CANNOT_AUTHORIZE_PUSH', () => {
  const mismatchedTarget = Object.assign({}, target, {
    target_fingerprint: '0'.repeat(64)
  });
  assert.throws(
    () => nextWork0004RemoteAttemptState(
      baseState, config, mismatchedTarget, 'push'
    ),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0004_REMOTE_STATE_INVALID'
  );
});

const failed = tests.filter((item) => item.status !== 'PASS');
process.stdout.write(`${JSON.stringify({
  suite: 'work_0004_target_bootstrap',
  environment: 'LOCAL_NON_GOOGLE_SYNTHETIC_ONLY',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
  google_operation: 'NOT_EXECUTED'
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
