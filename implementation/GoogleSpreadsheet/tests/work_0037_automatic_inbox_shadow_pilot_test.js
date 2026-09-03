'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const sourceRoot = path.join(__dirname, '..', 'apps-script-v2');
const read = (name) => fs.readFileSync(path.join(sourceRoot, name), 'utf8');
const config = read('00_Config.gs');
const gateway = read('05_GmailGateway.gs');
const triggers = read('12_Triggers.gs');
const worker = read('18_Worker.gs');

const checks = [
  ['A24_CODE_AND_AUTOMATIC_SCOPE', () => {
    assert.match(config, /CODE_VERSION:\s*'2\.8\.26-prepilot'/);
    assert.match(config, /AUTOMATION_PILOT_SCOPE:\s*'AUTOMATIC_PERSONAL_INBOX_SHADOW_PILOT'/);
    assert.match(config, /AUTOMATION_PILOT_ADMISSION_MODE:\s*'AUTOMATIC_INBOX'/);
    assert.match(config, /AUTOMATION_PILOT_SOURCE_MODE:\s*'AUTOMATIC_INBOX_PILOT'/);
    assert.match(config, /AUTOMATION_PILOT_STARTED_AT:/);
    assert.match(config, /AUTOMATION_ENABLED:\s*false/);
  }],
  ['INBOX_QUERY_HAS_HARD_SYSTEM_AND_CATEGORY_BOUNDS', () => {
    assert.match(config, /in:inbox -in:spam -in:trash -category:promotions -category:social/);
    assert.doesNotMatch(config, /label:\$manualImportLabel/);
  }],
  ['HARD_EXCLUSIONS_PRECEDE_OPTIONAL_MANUAL_PRIORITY', () => {
    const policyStart = gateway.indexOf('function automaticCandidatePolicy(');
    const policyEnd = gateway.indexOf('\n  function ', policyStart + 10);
    assert.ok(policyStart >= 0 && policyEnd > policyStart);
    const policy = gateway.slice(policyStart, policyEnd);
    const veto = policy.indexOf('手動/除外');
    const priority = policy.indexOf('手動/取込');
    assert.ok(veto >= 0 && priority >= 0 && veto < priority);
    assert.match(policy, /PROMOTIONS|promotion/i);
    assert.match(policy, /SOCIAL|social/i);
    assert.match(policy, /NEWSLETTER|newsletter/i);
    assert.match(policy, /CALENDAR|calendar/i);
  }],
  ['START_BOUNDARY_IS_REQUIRED_BEFORE_AUTOMATIC_SERVICES', () => {
    assert.match(gateway, /E_AUTOMATION_PILOT_START_BOUNDARY_MISSING/);
    assert.match(gateway, /pilot_start_at/);
    assert.match(worker, /function automaticPilotStartBoundary\(/);
    assert.match(worker, /E_AUTOMATION_PILOT_START_BOUNDARY_INVALID/);
    assert.match(worker, /isAutomationPilotRecord/);
  }],
  ['ENABLE_ESTABLISHES_BOUNDARY_AND_ROLLS_BACK_FAILURE', () => {
    assert.match(triggers, /function establishAutomaticPilotStartBoundary\(/);
    assert.match(triggers, /function rollbackPilotEnable\(/);
    assert.match(triggers, /AUTOMATION_PILOT_STARTED_AT/);
    assert.match(triggers, /cancelled/);
  }],
  ['AUTOMATIC_SOURCE_MODE_IS_NOT_HISTORICAL_MODE', () => {
    assert.match(config, /AUTOMATION_PILOT_SOURCE_MODE:\s*'AUTOMATIC_INBOX_PILOT'/);
    assert.match(worker, /AUTOMATIC_PERSONAL_INBOX_SHADOW_PILOT/);
    assert.doesNotMatch(config, /AUTOMATION_PILOT_SOURCE_MODE:\s*'AUTOMATIC_PILOT'/);
  }]
];

let passed = 0;
const failures = [];
for (const [name, fn] of checks) {
  try {
    fn();
    passed += 1;
  } catch (error) {
    failures.push({ name, message: error.message });
  }
}

process.stdout.write(`${JSON.stringify({
  suite: 'work_0037_automatic_inbox_shadow_pilot',
  passed,
  failed: failures.length,
  failures
}, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
