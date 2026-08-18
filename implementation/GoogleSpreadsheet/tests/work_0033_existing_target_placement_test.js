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
  instructionHead,
  isExactBranch,
  assertExistingBindingObjects,
  assertPreviousPlacement,
  assertPayloadInventory,
  initialExecutionState,
  nextAttemptState,
  acquireOperationLock,
  safeAttemptEvidence,
  normalizeCommand
} = require('../tools/work_0033_existing_target_placement');

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

const repairHead = 'a'.repeat(40);
const principal = 'b'.repeat(64);
const scriptId = 's'.repeat(32);
const parentId = 'p'.repeat(32);
const fingerprint = 'f'.repeat(64);
const config = claspProjectConfig(scriptId);
const target = {
  schema: 'WORK_OS_PERSONAL_SYNTHETIC_TARGET_V2',
  work_id: '0010',
  target_kind: 'PERSONAL_SYNTHETIC_DEV',
  expected_script_id: scriptId,
  expected_parent_id: parentId,
  principal_fingerprint: principal,
  target_fingerprint: fingerprint,
  target_disposition: 'FRESH_SYNTHETIC_CREATED',
  runtime_dry_run_allowed: false,
  runtime_function: ''
};
const sourceState = {
  schema: 'WORK_OS_SYNTHETIC_TARGET_PLACEMENT_V1',
  work_id: '0010',
  phase: 'PULL_PARITY_PASS',
  create_attempt_count: 1,
  push_attempt_count: 1,
  content_read_attempt_count: 1,
  pull_attempt_count: 1,
  script_id: scriptId,
  parent_id: parentId,
  principal_fingerprint: principal,
  target_fingerprint: fingerprint
};
const previousPlacement = {
  schema: 'WORK_OS_GEMINI_RUNTIME_DIAGNOSTICS_PLACEMENT_V1',
  work_id: '0032',
  source_binding_work_id: '0010',
  previous_placement_work_id: '0031',
  repair_head: repairHead,
  payload_sha256: 'a'.repeat(64),
  target_fingerprint: fingerprint,
  push_attempt_count: 1,
  pull_attempt_count: 1,
  pull_parity: 'PASS',
  phase: 'PULL_PARITY_PASS'
};
const inventory = assertPayloadInventory(inventoryForCommittedPayload(
  canonicalPayloadFileNames.slice().sort()
));

function stagedState() {
  return initialExecutionState(repairHead, inventory, { state: sourceState });
}

function pushedState() {
  return Object.assign(nextAttemptState(stagedState(), 'push'), {
    phase: 'PUSH_PASS',
    push_semantic_file_count: 24
  });
}

test('WORK_0033_HAS_DISTINCT_ONE_USE_LOCAL_STATE', () => {
  assert.strictEqual(workspaceName, '.clasp-work-0033');
  assert.strictEqual(pullWorkspaceName, '.clasp-pull-verify-work-0033');
  assert.strictEqual(executionStateFileName, 'work-0033-execution-state.json');
  assert.notStrictEqual(workspaceName, '.clasp-work-0010');
  assert.notStrictEqual(workspaceName, '.clasp-work-0028');
  assert.notStrictEqual(workspaceName, '.clasp-work-0030');
});

test('EXACT_BRANCH_AND_INSTRUCTION_HEAD_ARE_PINNED', () => {
  assert.strictEqual(exactBranch, 'codex/0033-gemini-runtime-diagnostics-hardening');
  assert.strictEqual(instructionHead, '020c20997288457e03fedc4a4c9aaed41886b8a4');
  assert.strictEqual(isExactBranch(exactBranch), true);
  assert.strictEqual(isExactBranch('codex/0015-synthetic-gmail-mock-task-e2e'), false);
});

test('EXACT_COMMITTED_CANDIDATE_IS_23_GS_PLUS_MANIFEST', () => {
  assert.strictEqual(inventory.file_count, 24);
  assert.strictEqual(
    inventory.files.filter((file) => file.name.endsWith('.gs')).length,
    23
  );
  assert.strictEqual(
    inventory.files.filter((file) => file.name === 'appsscript.json').length,
    1
  );
});

test('CONFIG_AND_IGNORE_PRESERVE_REPAIRED_CLASP_CONTRACT', () => {
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

test('ONLY_COMPLETED_WORK_0010_BINDING_IS_ACCEPTED', () => {
  assert.deepStrictEqual(
    assertExistingBindingObjects(config, target, sourceState),
    { config, target, state: sourceState }
  );
  assert.throws(
    () => assertExistingBindingObjects(config, target, Object.assign(
      {}, sourceState, { phase: 'PUSH_PASS' }
    )),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0033_EXISTING_TARGET_BINDING_INVALID'
  );
  assert.throws(
    () => assertExistingBindingObjects(config, Object.assign(
      {}, target, { work_id: '0006' }
    ), sourceState),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0033_EXISTING_TARGET_BINDING_INVALID'
  );
});

test('ONLY_COMPLETED_WORK_0032_PLACEMENT_CAN_AUTHORIZE_THIS_LANE', () => {
  assert.deepStrictEqual(
    assertPreviousPlacement({ state: sourceState }, previousPlacement),
    previousPlacement
  );
  assert.throws(
    () => assertPreviousPlacement({ state: sourceState }, Object.assign(
      {}, previousPlacement, { work_id: '0028' }
    )),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0033_PREVIOUS_PLACEMENT_STATE_INVALID'
  );
  assert.throws(
    () => assertPreviousPlacement({ state: sourceState }, Object.assign(
      {}, previousPlacement, { previous_placement_work_id: '0018' }
    )),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0033_PREVIOUS_PLACEMENT_STATE_INVALID'
  );
  assert.throws(
    () => assertPreviousPlacement({ state: sourceState }, Object.assign(
      {}, previousPlacement, { phase: 'PUSH_PASS' }
    )),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0033_PREVIOUS_PLACEMENT_STATE_INVALID'
  );
});

test('WORK_0033_STATE_CONTAINS_NO_TARGET_OR_ACCOUNT_IDENTIFIER', () => {
  assert.strictEqual(stagedState().previous_placement_work_id, '0032');
  const serialized = JSON.stringify(stagedState());
  assert.strictEqual(serialized.includes(scriptId), false);
  assert.strictEqual(serialized.includes(parentId), false);
  assert.strictEqual(serialized.includes(principal), false);
  assert.strictEqual(serialized.includes('@'), false);
});

test('PUSH_MARKER_IS_ATOMIC_AND_ONE_USE', () => {
  const started = nextAttemptState(stagedState(), 'push');
  assert.strictEqual(started.push_attempt_count, 1);
  assert.strictEqual(started.phase, 'PUSH_ATTEMPT_STARTED');
  assert.throws(
    () => nextAttemptState(started, 'push'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0033_PUSH_ALREADY_ATTEMPTED'
  );
});

test('OPTIONAL_PULL_REQUIRES_PUSH_PASS_AND_IS_ONE_USE', () => {
  assert.throws(
    () => nextAttemptState(stagedState(), 'pull-verify'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0033_PULL_ALREADY_ATTEMPTED'
  );
  const started = nextAttemptState(pushedState(), 'pull-verify');
  assert.strictEqual(started.pull_attempt_count, 1);
  assert.strictEqual(started.phase, 'PULL_ATTEMPT_STARTED');
  assert.throws(
    () => nextAttemptState(started, 'pull-verify'),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0033_PULL_ALREADY_ATTEMPTED'
  );
});

test('PULL_ATTEMPT_IS_RECORDED_BEFORE_PERSISTENT_PULL_WORKSPACE_CREATION', () => {
  const source = fs.readFileSync(path.join(
    __dirname, '..', 'tools', 'work_0033_existing_target_placement.js'
  ), 'utf8');
  const start = source.indexOf('function pullVerify()');
  const end = source.indexOf('\nfunction safeAttemptEvidence', start);
  const pullVerifySource = source.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.ok(
    pullVerifySource.indexOf('writeJsonAtomic(executionStatePath, started)') <
      pullVerifySource.indexOf('preparePullWorkspace(staged.config)')
  );
});

test('OPERATION_LOCK_REFUSES_CONCURRENCY', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'work-0033-lock-'));
  const lockPath = path.join(root, 'operation.lock');
  try {
    const release = acquireOperationLock('push', lockPath);
    assert.throws(
      () => acquireOperationLock('push', lockPath),
      (error) => error instanceof GateError &&
        error.code === 'WORK_0033_OPERATION_ALREADY_RUNNING'
    );
    release();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('SAFE_EVIDENCE_EXCLUDES_BINDING_IDENTIFIERS', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'work-0033-evidence-'));
  const statePath = path.join(root, 'state.json');
  try {
    fs.writeFileSync(statePath, JSON.stringify(pushedState()), 'utf8');
    const serialized = JSON.stringify(safeAttemptEvidence(statePath));
    assert.strictEqual(serialized.includes(scriptId), false);
    assert.strictEqual(serialized.includes(parentId), false);
    assert.strictEqual(serialized.includes(principal), false);
    assert.strictEqual(serialized.includes(fingerprint), false);
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
  suite: 'work_0033_existing_target_placement',
  environment: 'LOCAL_NON_GOOGLE_SYNTHETIC_ONLY',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
  google_operation: 'NOT_EXECUTED'
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
