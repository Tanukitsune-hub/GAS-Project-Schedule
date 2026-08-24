'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const placement = require('../tools/work_0037_codex_03_operational_log_hardening_placement');

const toolSource = fs.readFileSync(
  path.join(__dirname, '..', 'tools',
    'work_0037_codex_03_operational_log_hardening_placement.js'),
  'utf8'
);

assert.strictEqual(
  placement.phase8cReleaseRelativeRoot,
  'implementation/GoogleSpreadsheet/release/v2.8.24-prepilot-phase8c/apps-script'
);
assert.strictEqual(
  placement.normalizeCommand('push'),
  'push'
);
assert.strictEqual(
  placement.normalizeCommand('run-function'),
  'UNKNOWN'
);
assert.match(toolSource, /WORK_OS_CODEX_03_OPERATIONAL_LOG_HARDENING_REPLACEMENT_V1/);
assert.match(toolSource, /CODEX_03_LOG_HARDENING_AUTOMATION_OFF_CONFIRMED/);
assert.match(toolSource, /scriptExtensions\) !== JSON\.stringify\(\['\.gs', '\.js'\]\)/);
assert.match(toolSource, /assertClaspNativePayloadSelection/);
assert.match(toolSource, /assertClaspPushSemanticEvidence/);
assert.match(toolSource, /PULL_PARITY_PASS/);
assert.doesNotMatch(toolSource, /runQuickDiagnostic|processAutomaticBatch|runGemini/);

const names = ['00_Config.gs', 'appsscript.json'];
assert.strictEqual(
  placement.ignoreContents(names),
  '**/**\n!00_Config.gs\n!appsscript.json\n'
);

const valid = {
  schema: 'WORK_OS_CODEX_03_OPERATIONAL_LOG_HARDENING_REPLACEMENT_V1',
  work_id: '0037',
  source_binding_work_id: '0010',
  historical_placement_work_id: '0037-label-gated',
  payload_path: placement.phase8cReleaseRelativeRoot,
  repair_head: 'a'.repeat(40),
  payload_sha256: 'b'.repeat(64),
  target_fingerprint: 'c'.repeat(64),
  push_attempt_count: 0,
  pull_attempt_count: 0,
  phase: 'STAGED'
};
assert.doesNotThrow(() => placement.assertState(valid));
assert.throws(
  () => placement.assertState(Object.assign({}, valid, {
    source_binding_work_id: '0036'
  })),
  (error) => error && error.code ===
    'WORK_0037_CODEX_03_LOG_HARDENING_EXECUTION_STATE_INVALID'
);

process.stdout.write(`${JSON.stringify({
  suite: 'work_0037_codex_03_operational_log_hardening_placement',
  environment: 'LOCAL_NON_GOOGLE',
  passed: 12,
  failed: 0,
  push_attempts: 'NOT_EXECUTED',
  pull_attempts: 'NOT_EXECUTED',
  target_mutation: 'NOT_EXECUTED'
}, null, 2)}\n`);
