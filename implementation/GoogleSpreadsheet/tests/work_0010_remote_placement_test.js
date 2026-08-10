'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  canonicalPayloadFileNames,
  claspIgnoreContents,
  claspProjectConfig,
  claspSemanticPushArguments,
  inventoryForCommittedPayload
} = require('../tools/local_clasp_dev');
const {
  GateError,
  workspaceName,
  pullWorkspaceName,
  executionStateFileName,
  exactBranch,
  startingWork0007Head,
  expectedPayloadSha256,
  isExactBranch,
  assertPayloadInventory,
  initialAuthState,
  claimAuthPreflight,
  nextAttemptState,
  requireCanonicalRemoteContent,
  acquireOperationLock,
  safeAttemptEvidence,
  normalizeCommand
} = require('../tools/work_0010_remote_placement');

const tests = [];
function test(id, body) {
  try {
    body();
    tests.push({ id, status: 'PASS' });
  } catch (error) {
    tests.push({
      id, status: 'FAIL',
      safe_message: String(error && (error.code || error.message) || error)
    });
  }
}

const preGoogleHead = 'a'.repeat(40);
const salt = Buffer.alloc(32, 10);
const principal = 'b'.repeat(64);
const scriptId = 's'.repeat(32);
const parentId = 'p'.repeat(32);
const fingerprint = 'f'.repeat(64);

function authPassedState() {
  return Object.assign(initialAuthState(preGoogleHead, salt), {
    phase: 'AUTH_PREFLIGHT_PASS', principal_fingerprint: principal
  });
}

function bindingWrittenState() {
  return Object.assign(nextAttemptState(authPassedState(), 'create-synthetic'), {
    phase: 'LOCAL_BINDING_WRITTEN', parent_id: parentId,
    script_id: scriptId, target_fingerprint: fingerprint
  });
}

function inspectedState() {
  return Object.assign(
    nextAttemptState(bindingWrittenState(), 'inspect-synthetic'),
    { phase: 'INSPECTION_PASS' }
  );
}

function pushedState() {
  return Object.assign(nextAttemptState(inspectedState(), 'push'), {
    phase: 'PUSH_PASS', push_semantic_file_count: 23
  });
}

function readPassedState() {
  return Object.assign(nextAttemptState(pushedState(), 'inspect-content'), {
    phase: 'POST_PUSH_READ_PASS',
    classification: 'REMOTE_HAS_23_CANONICAL_FILES', total_file_count: 23
  });
}

function canonicalRemoteEvidence() {
  return {
    classification: 'REMOTE_HAS_23_CANONICAL_FILES',
    total_file_count: 23, server_js_file_count: 22,
    manifest_file_count: 1, html_file_count: 0, invalid_file_count: 0,
    missing_file_count: 0, extra_file_count: 0
  };
}

test('WORK_0010_HAS_DISTINCT_LOCAL_STATE', () => {
  assert.strictEqual(workspaceName, '.clasp-work-0010');
  assert.strictEqual(pullWorkspaceName, '.clasp-pull-verify-work-0010');
  assert.strictEqual(executionStateFileName, 'work-0010-execution-state.json');
  assert.notStrictEqual(workspaceName, '.clasp-dev');
  assert.notStrictEqual(workspaceName, '.clasp-work-0006');
});

test('EXACT_BRANCH_AND_STARTING_HEAD_ARE_PINNED', () => {
  assert.strictEqual(exactBranch, 'codex/0010-fresh-controlled-remote-placement');
  assert.strictEqual(
    startingWork0007Head, '3f54d2a90c38ea574db6bd20ab8341d27d82a183'
  );
  assert.strictEqual(isExactBranch(exactBranch), true);
  assert.strictEqual(isExactBranch('codex/0006-fresh-controlled-remote-placement'), false);
});

test('EXACT_COMMITTED_CANDIDATE_IS_23_FILES', () => {
  const inventory = assertPayloadInventory(inventoryForCommittedPayload(
    canonicalPayloadFileNames.slice().sort()
  ));
  assert.strictEqual(inventory.file_count, 23);
  assert.strictEqual(inventory.payload_sha256, expectedPayloadSha256);
  assert.strictEqual(
    inventory.files.filter((file) => file.name.endsWith('.gs')).length, 22
  );
});

test('CONFIG_AND_IGNORE_PRESERVE_EXACT_CLASP_CONTRACT', () => {
  const config = claspProjectConfig('placeholder');
  assert.strictEqual(config.rootDir, 'payload');
  assert.deepStrictEqual(config.scriptExtensions, ['.gs', '.js']);
  assert.deepStrictEqual(claspSemanticPushArguments, ['--json', 'push', '--force']);
  const ignoreLines = claspIgnoreContents().trim().split(/\r?\n/);
  assert.strictEqual(ignoreLines[0], '**/**');
  assert.deepStrictEqual(
    ignoreLines.slice(1).sort(),
    canonicalPayloadFileNames.map((name) => `!${name}`).sort()
  );
});

test('AUTH_ATTEMPT_CLAIM_IS_ATOMIC_AND_ONE_USE', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'work-0010-auth-'));
  const statePath = path.join(root, 'state.json');
  try {
    claimAuthPreflight(preGoogleHead, salt, statePath);
    assert.throws(
      () => claimAuthPreflight(preGoogleHead, salt, statePath),
      (error) => error instanceof GateError &&
        error.code === 'WORK_0010_AUTH_PREFLIGHT_ALREADY_ATTEMPTED'
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('STATE_RECORDS_NO_ACCOUNT_IDENTITY', () => {
  const serialized = JSON.stringify(initialAuthState(preGoogleHead, salt));
  assert.strictEqual(serialized.includes('@'), false);
  assert.strictEqual(serialized.includes('gmail'), false);
});

test('CREATE_ATTEMPT_IS_ONE_USE', () => {
  const started = nextAttemptState(authPassedState(), 'create-synthetic');
  assert.strictEqual(started.create_attempt_count, 1);
  assert.strictEqual(started.phase, 'CREATE_ATTEMPT_STARTED');
  assert.throws(
    () => nextAttemptState(started, 'create-synthetic'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0010_CREATE_ALREADY_ATTEMPTED_OR_AUTH_NOT_PASSED'
  );
});

test('INSPECTION_IS_BOUNDED_TO_TWO', () => {
  const first = nextAttemptState(bindingWrittenState(), 'inspect-synthetic');
  const firstPass = Object.assign(first, { phase: 'INSPECTION_PASS' });
  const second = nextAttemptState(firstPass, 'inspect-synthetic');
  assert.strictEqual(second.inspection_attempt_count, 2);
  assert.throws(
    () => nextAttemptState(
      Object.assign(second, { phase: 'INSPECTION_PASS' }), 'inspect-synthetic'
    ),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0010_INSPECTION_LIMIT_OR_CREATION_INVALID'
  );
});

test('PUSH_REQUIRES_INSPECTION_AND_IS_ONE_USE', () => {
  assert.throws(
    () => nextAttemptState(bindingWrittenState(), 'push'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0010_PUSH_ALREADY_ATTEMPTED'
  );
  const started = nextAttemptState(inspectedState(), 'push');
  assert.strictEqual(started.push_attempt_count, 1);
  assert.strictEqual(started.phase, 'PUSH_ATTEMPT_STARTED');
  assert.throws(
    () => nextAttemptState(started, 'push'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0010_PUSH_ALREADY_ATTEMPTED'
  );
});

test('CONTENT_READ_REQUIRES_PUSH_AND_IS_ONE_USE', () => {
  const started = nextAttemptState(pushedState(), 'inspect-content');
  assert.strictEqual(started.content_read_attempt_count, 1);
  assert.strictEqual(started.phase, 'CONTENT_READ_ATTEMPT_STARTED');
  assert.throws(
    () => nextAttemptState(started, 'inspect-content'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0010_CONTENT_READ_ALREADY_ATTEMPTED_OR_PUSH_NOT_PASSED'
  );
});

test('POST_PUSH_REMOTE_CONTENT_MUST_BE_EXACT', () => {
  assert.deepStrictEqual(
    requireCanonicalRemoteContent(canonicalRemoteEvidence()),
    canonicalRemoteEvidence()
  );
  assert.throws(
    () => requireCanonicalRemoteContent(Object.assign(
      canonicalRemoteEvidence(), { server_js_file_count: 21 }
    )),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0010_POST_PUSH_REMOTE_CONTENT_INVALID'
  );
});

test('PULL_REQUIRES_READ_PASS_AND_IS_ONE_USE', () => {
  assert.throws(
    () => nextAttemptState(pushedState(), 'pull-verify'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0010_PULL_ALREADY_ATTEMPTED_OR_READ_NOT_PASSED'
  );
  const started = nextAttemptState(readPassedState(), 'pull-verify');
  assert.strictEqual(started.pull_attempt_count, 1);
  assert.strictEqual(started.phase, 'PULL_ATTEMPT_STARTED');
  assert.throws(
    () => nextAttemptState(started, 'pull-verify'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0010_PULL_ALREADY_ATTEMPTED_OR_READ_NOT_PASSED'
  );
});

test('OPERATION_LOCK_REFUSES_CONCURRENCY', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'work-0010-lock-'));
  const lockPath = path.join(root, 'operation.lock');
  try {
    const release = acquireOperationLock('push', lockPath);
    assert.throws(
      () => acquireOperationLock('push', lockPath),
      (error) => error instanceof GateError &&
        error.code === 'WORK_0010_OPERATION_ALREADY_RUNNING'
    );
    release();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('SAFE_EVIDENCE_EXCLUDES_BINDING_IDENTIFIERS', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'work-0010-evidence-'));
  const statePath = path.join(root, 'state.json');
  try {
    const state = readPassedState();
    fs.writeFileSync(statePath, JSON.stringify(state), 'utf8');
    const serialized = JSON.stringify(safeAttemptEvidence(statePath));
    assert.strictEqual(serialized.includes(scriptId), false);
    assert.strictEqual(serialized.includes(parentId), false);
    assert.strictEqual(serialized.includes(principal), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('ARBITRARY_COMMAND_FAILS_CLOSED', () => {
  assert.strictEqual(normalizeCommand('push'), 'push');
  assert.strictEqual(normalizeCommand('pull-verify'), 'pull-verify');
  assert.strictEqual(normalizeCommand('account@example.invalid'), 'UNKNOWN');
});

const failed = tests.filter((item) => item.status !== 'PASS');
process.stdout.write(`${JSON.stringify({
  suite: 'work_0010_remote_placement',
  environment: 'LOCAL_NON_GOOGLE_SYNTHETIC_ONLY',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
  google_operation: 'NOT_EXECUTED'
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
