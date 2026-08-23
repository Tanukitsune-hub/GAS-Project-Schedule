'use strict';

/**
 * Work 0036 placement-lane contract tests. These tests are local-only: the
 * native clasp check runs in a temporary workspace with a placeholder ID and
 * an isolated auth home, and no Google command is invoked.
 */
const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const placement = require('../tools/work_0036_existing_target_placement');
const {
  claspProjectConfig,
  assertClaspNativePayloadSelection
} = require('../tools/local_clasp_dev');

const phase8cRoot = path.resolve(
  __dirname, '..', 'release', 'v2.8.21-prepilot-phase8c', 'apps-script'
);
const names = placement.phase8cPayloadNames();
const files = names.map((name) => ({
  name,
  sha256: crypto.createHash('sha256').update(
    fs.readFileSync(path.join(phase8cRoot, name))
  ).digest('hex')
}));
const inventory = {
  schema: 'WORK_OS_LOCAL_CLASP_PAYLOAD_V1',
  file_count: files.length,
  files,
  payload_sha256: crypto.createHash('sha256').update(
    files.map((file) => `${file.name}:${file.sha256}`).join('\n')
  ).digest('hex')
};

const scriptId = '1'.repeat(30);
const parentId = '2'.repeat(30);
const principal = '3'.repeat(64);
const fingerprint = '4'.repeat(64);
const repairHead = '5'.repeat(40);
const previousPayload = '6'.repeat(64);
const config = claspProjectConfig(scriptId);
const target = {
  schema: 'WORK_OS_PERSONAL_SYNTHETIC_TARGET_V2',
  work_id: '0010',
  target_kind: 'PERSONAL_SYNTHETIC_DEV',
  expected_script_id: scriptId,
  expected_parent_id: parentId,
  principal_fingerprint: principal,
  target_fingerprint: fingerprint,
  target_disposition: 'FRESH_SYNTHETIC_CREATED'
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
  schema: 'WORK_OS_GEMINI_SCHEMA_COMPATIBILITY_PLACEMENT_V1',
  work_id: '0033',
  source_binding_work_id: '0010',
  previous_placement_work_id: '0032',
  repair_head: repairHead,
  payload_sha256: previousPayload,
  target_fingerprint: fingerprint,
  push_attempt_count: 1,
  pull_attempt_count: 1,
  pull_parity: 'PASS',
  phase: 'PULL_PARITY_PASS'
};

assert.strictEqual(placement.workspaceName, '.clasp-work-0036');
assert.strictEqual(placement.pullWorkspaceName, '.clasp-pull-verify-work-0036');
assert.strictEqual(
  placement.executionStateFileName, 'work-0036-execution-state.json'
);
assert.strictEqual(
  placement.exactBranch, 'codex/0036-personal-automation-qualification'
);
assert.strictEqual(
  placement.instructionHead,
  'ea484cf3e7cef3b5e67d15eebd7b2aac03c1ec6a'
);
assert.strictEqual(placement.isExactBranch(placement.exactBranch), true);
assert.strictEqual(placement.isExactBranch('main'), false);

assert.strictEqual(names.length, 23);
assert.strictEqual(names.filter((name) => name.endsWith('.gs')).length, 22);
assert.deepStrictEqual(names.filter((name) => name === 'appsscript.json'), [
  'appsscript.json'
]);
assert.strictEqual(names.includes('99_TestHarness.gs'), false);
assert.deepStrictEqual(
  placement.assertPayloadInventory(inventory),
  inventory
);

const ignoreLines = placement.phase8cIgnoreContents(names).trim().split(/\r?\n/);
assert.strictEqual(ignoreLines[0], '**/**');
assert.deepStrictEqual(ignoreLines.slice(1).sort(),
  names.map((name) => `!${name}`).sort());
assert.deepStrictEqual(config.scriptExtensions, ['.gs', '.js']);
assert.strictEqual(config.rootDir, 'payload');

assert.deepStrictEqual(
  placement.assertExistingBindingObjects(config, target, sourceState),
  { config, target, state: sourceState }
);
assert.throws(
  () => placement.assertExistingBindingObjects(
    config, target, Object.assign({}, sourceState, { phase: 'PUSH_PASS' })
  ),
  (error) => error instanceof placement.GateError &&
    error.code === 'WORK_0036_EXISTING_TARGET_BINDING_INVALID'
);
assert.deepStrictEqual(
  placement.assertPreviousPlacement({ state: sourceState }, previousPlacement),
  previousPlacement
);
assert.throws(
  () => placement.assertPreviousPlacement(
    { state: sourceState }, Object.assign({}, previousPlacement, { work_id: '0032' })
  ),
  (error) => error instanceof placement.GateError &&
    error.code === 'WORK_0036_PREVIOUS_PLACEMENT_STATE_INVALID'
);

const staged = placement.initialExecutionState(repairHead, inventory, {
  state: sourceState
});
const serialized = JSON.stringify(staged);
assert.strictEqual(serialized.includes(scriptId), false);
assert.strictEqual(serialized.includes(parentId), false);
assert.strictEqual(serialized.includes(principal), false);
assert.strictEqual(staged.payload_path, placement.phase8cReleaseRelativeRoot);
assert.strictEqual(staged.previous_placement_work_id, '0033');
const refreshed = placement.restagedExecutionState(
  staged, '7'.repeat(40), inventory, { state: sourceState }
);
assert.strictEqual(refreshed.repair_head, '7'.repeat(40));
assert.strictEqual(refreshed.push_attempt_count, 0);
assert.strictEqual(refreshed.pull_attempt_count, 0);
assert.throws(
  () => placement.restagedExecutionState(
    Object.assign({}, staged, { phase: 'PUSH_ATTEMPT_STARTED', push_attempt_count: 1 }),
    '7'.repeat(40), inventory, { state: sourceState }
  ),
  (error) => error instanceof placement.GateError &&
    error.code === 'WORK_0036_EXECUTION_ALREADY_STARTED'
);

const pushStarted = placement.nextAttemptState(staged, 'push');
assert.strictEqual(pushStarted.push_attempt_count, 1);
assert.strictEqual(pushStarted.phase, 'PUSH_ATTEMPT_STARTED');
assert.throws(
  () => placement.nextAttemptState(pushStarted, 'push'),
  (error) => error instanceof placement.GateError &&
    error.code === 'WORK_0036_PUSH_ALREADY_ATTEMPTED'
);
const pullStarted = placement.nextAttemptState(
  Object.assign({}, pushStarted, { phase: 'PUSH_PASS' }), 'pull-verify'
);
assert.strictEqual(pullStarted.pull_attempt_count, 1);
assert.strictEqual(pullStarted.phase, 'PULL_ATTEMPT_STARTED');
assert.throws(
  () => placement.nextAttemptState(pullStarted, 'pull-verify'),
  (error) => error instanceof placement.GateError &&
    error.code === 'WORK_0036_PULL_ALREADY_ATTEMPTED'
);

const toolSource = fs.readFileSync(
  path.join(__dirname, '..', 'tools', 'work_0036_existing_target_placement.js'),
  'utf8'
);
const pullStart = toolSource.indexOf('function pullVerify()');
const pullWorkspaceStart = toolSource.indexOf(
  'preparePullWorkspace(staged.config, staged.names)', pullStart
);
const pullMarker = toolSource.indexOf(
  'writeJsonAtomic(executionStatePath, started)', pullStart
);
assert.ok(pullStart >= 0 && pullWorkspaceStart > pullStart);
assert.ok(pullMarker >= 0 && pullMarker < pullWorkspaceStart);
assert.strictEqual(toolSource.includes("['run'"), false);
assert.strictEqual(toolSource.includes("['functions"), false);
assert.strictEqual(placement.normalizeCommand('run'), 'UNKNOWN');
assert.strictEqual(placement.normalizeCommand('restage'), 'restage');

const nativeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'work-0036-native-test-'));
try {
  const nativePayload = path.join(nativeRoot, 'payload');
  fs.mkdirSync(nativePayload, { recursive: true });
  for (const name of names) {
    fs.copyFileSync(path.join(phase8cRoot, name), path.join(nativePayload, name));
  }
  fs.writeFileSync(path.join(nativeRoot, '.clasp.json'),
    `${JSON.stringify(claspProjectConfig(
      'REPLACE_WITH_PERSONAL_SYNTHETIC_SCRIPT_ID'
    ), null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(nativeRoot, '.claspignore'),
    placement.phase8cIgnoreContents(names), 'utf8');
  const native = assertClaspNativePayloadSelection(nativeRoot, names);
  assert.strictEqual(native.file_count, 23);
  assert.strictEqual(native.names.filter((name) => name.endsWith('.gs')).length, 22);
  assert.strictEqual(native.names.includes('appsscript.json'), true);
} finally {
  fs.rmSync(nativeRoot, { recursive: true, force: true });
}

const evidenceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'work-0036-evidence-'));
try {
  const statePath = path.join(evidenceRoot, 'state.json');
  fs.writeFileSync(statePath, JSON.stringify(Object.assign({}, staged, {
    phase: 'PUSH_PASS',
    push_attempt_count: 1,
    pull_attempt_count: 0,
    push_semantic_file_count: 23
  })), 'utf8');
  const evidence = placement.safeAttemptEvidence(statePath);
  assert.strictEqual(evidence.push_attempt_count, 1);
  assert.strictEqual(evidence.push_semantic_file_count, 23);
  assert.strictEqual(JSON.stringify(evidence).includes(fingerprint), false);
} finally {
  fs.rmSync(evidenceRoot, { recursive: true, force: true });
}

process.stdout.write(`${JSON.stringify({
  suite: 'work_0036_existing_target_placement',
  environment: 'LOCAL_NON_GOOGLE_SYNTHETIC_ONLY',
  passed: 14,
  failed: 0,
  phase8c_file_count: 23,
  phase8c_gs_file_count: 22,
  phase8c_manifest_file_count: 1,
  native_missing_file_count: 0,
  native_extra_file_count: 0,
  google_operation: 'NOT_EXECUTED',
  runtime_function: 'NOT_AVAILABLE'
}, null, 2)}\n`);
