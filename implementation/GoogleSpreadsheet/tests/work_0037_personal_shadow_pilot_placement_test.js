'use strict';

/**
 * Work 0037 replacement-lane contract tests. This suite is local only and
 * uses placeholder binding metadata; it never invokes Google APIs.
 */
const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const placement = require('../tools/work_0037_personal_shadow_pilot_placement');
const {
  claspProjectConfig,
  assertClaspNativePayloadSelection
} = require('../tools/local_clasp_dev');

const phase8cRoot = path.resolve(
  __dirname, '..', 'release', 'v2.8.22-prepilot-phase8c', 'apps-script'
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
  schema:
    'WORK_OS_PERSONAL_AUTOMATION_LIVE_AI_SCHEMA_FAILURE_FIX_REPLACEMENT_V1',
  work_id: '0036',
  source_binding_work_id: '0010',
  previous_placement_work_id: '0036-runtime-preparation-fix',
  replacement_tranche: 'LIVE_AI_SCHEMA_FAILURE_FIX_REPLACEMENT',
  repair_head: repairHead,
  payload_sha256: previousPayload,
  target_fingerprint: fingerprint,
  push_attempt_count: 1,
  pull_attempt_count: 1,
  pull_parity: 'PASS',
  phase: 'PULL_PARITY_PASS'
};

assert.strictEqual(
  placement.workspaceName, '.clasp-work-0037-personal-shadow-pilot'
);
assert.strictEqual(
  placement.pullWorkspaceName,
  '.clasp-pull-verify-work-0037-personal-shadow-pilot'
);
assert.strictEqual(
  placement.executionStateFileName,
  'work-0037-personal-shadow-pilot-execution-state.json'
);
assert.strictEqual(
  placement.exactBranch, 'codex/0037-personal-shadow-pilot'
);
assert.strictEqual(
  placement.instructionHead,
  '57442e9631e0d54f1f90443c6274f8d319159f1d'
);
assert.strictEqual(placement.isExactBranch(placement.exactBranch), true);
assert.strictEqual(placement.isExactBranch('main'), false);

assert.strictEqual(names.length, 23);
assert.strictEqual(names.filter((name) => name.endsWith('.gs')).length, 22);
assert.deepStrictEqual(names.filter((name) => name === 'appsscript.json'), [
  'appsscript.json'
]);
assert.strictEqual(names.includes('99_TestHarness.gs'), false);
assert.deepStrictEqual(placement.assertPayloadInventory(inventory), inventory);

const ignoreLines = placement.phase8cIgnoreContents(names)
  .trim().split(/\r?\n/);
assert.strictEqual(ignoreLines[0], '**/**');
assert.deepStrictEqual(
  ignoreLines.slice(1).sort(), names.map((name) => `!${name}`).sort()
);
assert.deepStrictEqual(config.scriptExtensions, ['.gs', '.js']);
assert.strictEqual(config.rootDir, 'payload');

assert.deepStrictEqual(
  placement.assertExistingBindingObjects(config, target, sourceState),
  { config, target, state: sourceState }
);
assert.deepStrictEqual(
  placement.assertPreviousPlacement({ state: sourceState }, previousPlacement),
  previousPlacement
);
assert.throws(
  () => placement.assertPreviousPlacement(
    { state: sourceState }, Object.assign({}, previousPlacement, {
      previous_placement_work_id: '0035'
    })
  ),
  (error) => error instanceof placement.GateError &&
    error.code === 'WORK_0037_PREVIOUS_PLACEMENT_STATE_INVALID'
);

const staged = placement.initialExecutionState(repairHead, inventory, {
  state: sourceState
});
const serialized = JSON.stringify(staged);
assert.strictEqual(serialized.includes(scriptId), false);
assert.strictEqual(serialized.includes(parentId), false);
assert.strictEqual(serialized.includes(principal), false);
assert.strictEqual(
  staged.schema, 'WORK_OS_PERSONAL_SHADOW_PILOT_REPLACEMENT_V1'
);
assert.strictEqual(staged.previous_placement_work_id, '0036-live-ai-schema-failure-fix');
assert.strictEqual(staged.replacement_tranche, 'PERSONAL_SHADOW_PILOT_REPLACEMENT');
assert.strictEqual(staged.payload_path,
  'implementation/GoogleSpreadsheet/release/v2.8.22-prepilot-phase8c/apps-script');
assert.strictEqual(staged.push_attempt_count, 0);
assert.strictEqual(staged.pull_attempt_count, 0);

const refreshed = placement.restagedExecutionState(
  staged, '7'.repeat(40), inventory, { state: sourceState }
);
assert.strictEqual(refreshed.repair_head, '7'.repeat(40));
assert.strictEqual(refreshed.push_attempt_count, 0);
assert.strictEqual(refreshed.pull_attempt_count, 0);
assert.throws(
  () => placement.restagedExecutionState(
    Object.assign({}, staged, {
      phase: 'PUSH_ATTEMPT_STARTED', push_attempt_count: 1
    }),
    '7'.repeat(40), inventory, { state: sourceState }
  ),
  (error) => error instanceof placement.GateError &&
    error.code === 'WORK_0037_EXECUTION_ALREADY_STARTED'
);

const pushStarted = placement.nextAttemptState(staged, 'push');
assert.strictEqual(pushStarted.push_attempt_count, 1);
assert.strictEqual(pushStarted.phase, 'PUSH_ATTEMPT_STARTED');
assert.throws(
  () => placement.nextAttemptState(pushStarted, 'push'),
  (error) => error instanceof placement.GateError &&
    error.code === 'WORK_0037_PUSH_ALREADY_ATTEMPTED'
);
const pullStarted = placement.nextAttemptState(
  Object.assign({}, pushStarted, { phase: 'PUSH_PASS' }), 'pull-verify'
);
assert.strictEqual(pullStarted.pull_attempt_count, 1);
assert.strictEqual(pullStarted.phase, 'PULL_ATTEMPT_STARTED');

const toolSource = fs.readFileSync(
  path.join(__dirname, '..', 'tools',
    'work_0037_personal_shadow_pilot_placement.js'), 'utf8'
);
assert.ok(toolSource.includes('GAS_WORK_0037_AUTOMATION_OFF_CONFIRMED'));
assert.ok(toolSource.includes('GAS_WORK_0037_PUSH_ALLOWED'));
assert.strictEqual(toolSource.includes("['run'"), false);
assert.strictEqual(toolSource.includes("['functions"), false);
assert.strictEqual(placement.normalizeCommand('run'), 'UNKNOWN');
assert.strictEqual(placement.normalizeCommand('restage'), 'restage');

const previousAutomationConfirmation =
  process.env.GAS_WORK_0037_AUTOMATION_OFF_CONFIRMED;
try {
  process.env.GAS_WORK_0037_AUTOMATION_OFF_CONFIRMED = 'true';
  const automationOff = placement.assertAutomationOffEvidence();
  assert.strictEqual(
    automationOff.status, 'CONFIRMED_FROM_COMMITTED_BOUNDED_EVIDENCE'
  );
  assert.strictEqual(automationOff.runtime_function, 'NOT_EXECUTED');
  assert.strictEqual(automationOff.automation_mutation, 'NOT_EXECUTED');
  assert.strictEqual(JSON.stringify(automationOff).includes('false'), false);
} finally {
  if (previousAutomationConfirmation === undefined) {
    delete process.env.GAS_WORK_0037_AUTOMATION_OFF_CONFIRMED;
  } else {
    process.env.GAS_WORK_0037_AUTOMATION_OFF_CONFIRMED =
      previousAutomationConfirmation;
  }
}

const nativeRoot = fs.mkdtempSync(path.join(
  os.tmpdir(), 'work-0037-personal-shadow-pilot-native-test-'
));
try {
  const nativePayload = path.join(nativeRoot, 'payload');
  fs.mkdirSync(nativePayload, { recursive: true });
  for (const name of names) {
    fs.copyFileSync(
      path.join(phase8cRoot, name), path.join(nativePayload, name)
    );
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

const evidenceRoot = fs.mkdtempSync(path.join(
  os.tmpdir(), 'work-0037-personal-shadow-pilot-evidence-'
));
try {
  const statePath = path.join(evidenceRoot, 'state.json');
  fs.writeFileSync(statePath, JSON.stringify(Object.assign({}, staged, {
    phase: 'PUSH_PASS', push_attempt_count: 1,
    pull_attempt_count: 0, push_semantic_file_count: 23
  })), 'utf8');
  const evidence = placement.safeAttemptEvidence(statePath);
  assert.strictEqual(evidence.push_attempt_count, 1);
  assert.strictEqual(evidence.push_semantic_file_count, 23);
  assert.strictEqual(JSON.stringify(evidence).includes(fingerprint), false);
} finally {
  fs.rmSync(evidenceRoot, { recursive: true, force: true });
}

process.stdout.write(`${JSON.stringify({
  suite: 'work_0037_personal_shadow_pilot_placement',
  environment: 'LOCAL_NON_GOOGLE_SYNTHETIC_ONLY',
  passed: 31,
  failed: 0,
  google_operation: 'NOT_EXECUTED'
}, null, 2)}\n`);
