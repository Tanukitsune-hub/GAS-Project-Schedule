'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  GateError,
  canonicalPayloadFileNames,
  claspProjectConfig,
  inventoryForCommittedPayload,
  prepareWork0006PushAttempt,
  nextWork0006RemoteAttemptState,
  acquireWork0006OperationLock
} = require('../tools/local_clasp_dev');
const {
  workspaceName,
  executionStateFileName,
  assertInitialWorkspaceEntries,
  safeStateBase,
  isExactWork0006Branch,
  normalizeWork0006Command
} = require('../tools/work_0006_target_bootstrap');

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

const salt = Buffer.alloc(32, 6);
const syntheticUser = { email: 'work0006.synthetic@gmail.com', id: 'synthetic-user' };
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
  work_id: '0006',
  target_kind: 'PERSONAL_SYNTHETIC_DEV',
  expected_script_id: scriptId,
  expected_parent_id: parentId,
  principal_fingerprint: baseState.principal_fingerprint,
  target_fingerprint: baseState.target_fingerprint,
  target_disposition: 'FRESH_SYNTHETIC_CREATED'
};

test('WORK_0006_WORKSPACE_AND_STATE_ARE_DISTINCT_FROM_WORK_0004', () => {
  assert.strictEqual(workspaceName, '.clasp-work-0006');
  assert.strictEqual(executionStateFileName, 'work-0006-execution-state.json');
  assert.notStrictEqual(workspaceName, '.clasp-dev');
  assert.notStrictEqual(executionStateFileName, 'work-0004-creation-state.json');
});

test('EXTERNAL_LANE_REQUIRES_EXACT_WORK_0006_BRANCH', () => {
  assert.strictEqual(
    isExactWork0006Branch('codex/0006-fresh-controlled-remote-placement'), true
  );
  assert.strictEqual(
    isExactWork0006Branch('codex/0004-controlled-synthetic-placement'), false
  );
  assert.strictEqual(isExactWork0006Branch(''), false);
});

test('ARBITRARY_COMMAND_IS_REDUCED_TO_CLOSED_ENUM', () => {
  assert.strictEqual(normalizeWork0006Command('create-synthetic'), 'create-synthetic');
  assert.strictEqual(normalizeWork0006Command('evidence'), 'evidence');
  assert.strictEqual(normalizeWork0006Command('account@example.invalid'), 'UNKNOWN');
});

test('STAGING_USES_EXACT_COMMITTED_PRODUCT_CANDIDATE_BYTES', () => {
  const inventory = inventoryForCommittedPayload(
    canonicalPayloadFileNames.slice().sort()
  );
  assert.strictEqual(inventory.file_count, 24);
  assert.strictEqual(
    inventory.payload_sha256,
    '2559fc976dafb0bf3198342e4108886584228b7f8c127c43fb561d3639c6e550'
  );
});

test('WORK_0006_CONFIG_PRESERVES_GS_PULL_FILENAMES', () => {
  assert.deepStrictEqual(config.scriptExtensions, ['.gs', '.js']);
  assert.strictEqual(config.scriptExtensions[0], '.gs');
});

test('FRESH_WORKSPACE_ACCEPTS_ONLY_STAGING_ARTIFACTS', () => {
  assert.doesNotThrow(() => assertInitialWorkspaceEntries([
    'payload', '.claspignore', 'payload-inventory.json'
  ]));
});

test('CURRENT_OPERATION_LOCK_IS_THE_ONLY_EXTRA_INITIAL_ENTRY', () => {
  assert.doesNotThrow(() => assertInitialWorkspaceEntries([
    'payload', '.claspignore', 'payload-inventory.json',
    'work-0006-operation.lock'
  ]));
});

test('OPERATION_LOCK_ATOMICALLY_REFUSES_CONCURRENT_PROCESS', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'work-0006-lock-test-'));
  const lockPath = path.join(root, 'operation.lock');
  try {
    const releaseFirst = acquireWork0006OperationLock('create-synthetic', lockPath);
    assert.throws(
      () => acquireWork0006OperationLock('create-synthetic', lockPath),
      (error) => error instanceof GateError &&
        error.code === 'WORK_0006_OPERATION_ALREADY_RUNNING'
    );
    releaseFirst();
    const releaseSecond = acquireWork0006OperationLock('create-synthetic', lockPath);
    releaseSecond();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('FRESH_WORKSPACE_REJECTS_WORK_0004_STATE', () => {
  assert.throws(
    () => assertInitialWorkspaceEntries([
      'payload', 'work-0004-creation-state.json'
    ]),
    (error) => error && error.code ===
      'WORK_0006_SYNTHETIC_TARGET_CREATE_ALREADY_ATTEMPTED'
  );
});

test('FRESH_WORKSPACE_REJECTS_EXISTING_WORK_0006_STATE', () => {
  assert.throws(
    () => assertInitialWorkspaceEntries(['payload', executionStateFileName]),
    (error) => error && error.code ===
      'WORK_0006_SYNTHETIC_TARGET_CREATE_ALREADY_ATTEMPTED'
  );
});

test('WORK_0006_STATE_STARTS_EXACTLY_ONE_CREATION_TRANCHE', () => {
  const state = safeStateBase(salt, syntheticUser);
  assert.strictEqual(state.schema, 'WORK_OS_SYNTHETIC_TARGET_CREATION_V3');
  assert.strictEqual(state.work_id, '0006');
  assert.strictEqual(state.create_attempt_count, 1);
  assert.strictEqual(state.inspection_attempt_count, 0);
  assert.strictEqual(state.push_attempt_count, 0);
  assert.strictEqual(state.pull_attempt_count, 0);
  assert.strictEqual(state.phase, 'ATTEMPT_STARTED');
});

test('WORK_0006_STATE_DOES_NOT_CONTAIN_PRINCIPAL_IDENTIFIER', () => {
  const serialized = JSON.stringify(safeStateBase(salt, syntheticUser));
  assert.strictEqual(serialized.includes(syntheticUser.email), false);
  assert.strictEqual(serialized.includes(syntheticUser.id), false);
});

test('PUSH_ATTEMPT_IS_RECORDED_BEFORE_REMOTE_CALL', () => {
  const next = nextWork0006RemoteAttemptState(baseState, config, target, 'push');
  assert.strictEqual(next.push_attempt_count, 1);
  assert.strictEqual(next.pull_attempt_count, 0);
  assert.strictEqual(next.phase, 'PUSH_ATTEMPT_STARTED');
  assert.strictEqual(baseState.push_attempt_count, 0);
});

test('NATIVE_INVENTORY_FAILURE_PREVENTS_PUSH_ATTEMPT_RECORD', () => {
  const calls = [];
  assert.throws(() => prepareWork0006PushAttempt(
    'synthetic-workspace', config, target, {
      assertClaspNativePayloadSelection: () => {
        calls.push('native-inventory');
        throw new GateError('CLASP_NATIVE_PAYLOAD_SELECTION_INVALID');
      },
      beginWork0006RemoteAttempt: () => calls.push('begin-attempt')
    }
  ), (error) => error instanceof GateError &&
    error.code === 'CLASP_NATIVE_PAYLOAD_SELECTION_INVALID');
  assert.deepStrictEqual(calls, ['native-inventory']);
});

test('NATIVE_INVENTORY_PASSES_BEFORE_PUSH_ATTEMPT_RECORD', () => {
  const calls = [];
  const status = prepareWork0006PushAttempt(
    'synthetic-workspace', config, target, {
      assertClaspNativePayloadSelection: () => {
        calls.push('native-inventory');
        return { file_count: 24 };
      },
      beginWork0006RemoteAttempt: () => calls.push('begin-attempt')
    }
  );
  assert.deepStrictEqual(calls, ['native-inventory', 'begin-attempt']);
  assert.strictEqual(status.file_count, 24);
});

test('SECOND_PUSH_ATTEMPT_IS_REFUSED', () => {
  const started = nextWork0006RemoteAttemptState(baseState, config, target, 'push');
  assert.throws(
    () => nextWork0006RemoteAttemptState(started, config, target, 'push'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0006_PUSH_ALREADY_ATTEMPTED'
  );
});

test('PULL_REQUIRES_ONE_SUCCESSFUL_PUSH', () => {
  assert.throws(
    () => nextWork0006RemoteAttemptState(baseState, config, target, 'pull-verify'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0006_PULL_ALREADY_ATTEMPTED_OR_PUSH_NOT_PASSED'
  );
});

test('PULL_ATTEMPT_IS_RECORDED_BEFORE_REMOTE_CALL', () => {
  const pushed = Object.assign({}, baseState, {
    phase: 'PUSH_PASS', push_attempt_count: 1
  });
  const next = nextWork0006RemoteAttemptState(
    pushed, config, target, 'pull-verify'
  );
  assert.strictEqual(next.push_attempt_count, 1);
  assert.strictEqual(next.pull_attempt_count, 1);
  assert.strictEqual(next.phase, 'PULL_ATTEMPT_STARTED');
});

test('SECOND_PULL_ATTEMPT_IS_REFUSED', () => {
  const pulled = Object.assign({}, baseState, {
    phase: 'PULL_ATTEMPT_STARTED', push_attempt_count: 1,
    pull_attempt_count: 1
  });
  assert.throws(
    () => nextWork0006RemoteAttemptState(pulled, config, target, 'pull-verify'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0006_PULL_ALREADY_ATTEMPTED_OR_PUSH_NOT_PASSED'
  );
});

test('WORK_0004_STATE_CANNOT_AUTHORIZE_WORK_0006_REMOTE_ACTION', () => {
  const work0004State = Object.assign({}, baseState, {
    schema: 'WORK_OS_SYNTHETIC_TARGET_CREATION_V2', work_id: '0004'
  });
  assert.throws(
    () => nextWork0006RemoteAttemptState(work0004State, config, target, 'push'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0006_REMOTE_STATE_INVALID'
  );
});

test('UNINSPECTED_TARGET_CANNOT_AUTHORIZE_PUSH', () => {
  const uninspected = Object.assign({}, baseState, {
    phase: 'LOCAL_BINDING_WRITTEN', inspection_attempt_count: 0
  });
  assert.throws(
    () => nextWork0006RemoteAttemptState(uninspected, config, target, 'push'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0006_REMOTE_STATE_INVALID'
  );
});

test('MISMATCHED_TARGET_BINDING_CANNOT_AUTHORIZE_PUSH', () => {
  const mismatchedTarget = Object.assign({}, target, {
    target_fingerprint: '0'.repeat(64)
  });
  assert.throws(
    () => nextWork0006RemoteAttemptState(
      baseState, config, mismatchedTarget, 'push'
    ),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0006_REMOTE_STATE_INVALID'
  );
});

const failed = tests.filter((item) => item.status !== 'PASS');
process.stdout.write(`${JSON.stringify({
  suite: 'work_0006_target_bootstrap',
  environment: 'LOCAL_NON_GOOGLE_SYNTHETIC_ONLY',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
  google_operation: 'NOT_EXECUTED'
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
