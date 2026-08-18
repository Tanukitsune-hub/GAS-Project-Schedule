'use strict';

/**
 * Work 0036 synthetic-only Automation qualification contract.
 *
 * This suite uses the existing Phase 3 in-memory Apps Script facade. It never
 * calls Gmail, Calendar, UrlFetchApp, ScriptApp mutation, or a real provider.
 */
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const phase3Path = path.resolve(__dirname, 'phase3_local_test.js');
const source = fs.readFileSync(phase3Path, 'utf8').replace(/\r\n/g, '\n');
const marker = '\nconst summary = {\n';
const markerIndex = source.lastIndexOf(marker);
if (markerIndex < 0) throw new Error('PHASE3_FIXTURE_REPORT_MARKER_MISSING');

const exposure = `
globalThis.__work0036 = {
  sandbox,
  scriptProperties,
  getScriptProperties: () => sandbox.PropertiesService.getScriptProperties(),
  makeOperationalSpreadsheet: () => {
    activeSpreadsheet = makeOperationalSpreadsheet();
    return activeSpreadsheet;
  },
  getActiveSpreadsheet: () => activeSpreadsheet
};
`;
const context = {
  require,
  __dirname,
  __filename: phase3Path,
  console,
  process: { stdout: { write: () => {} }, exitCode: 0 },
  Buffer,
  structuredClone,
  setTimeout,
  clearTimeout
};
vm.createContext(context);
vm.runInContext(source.slice(0, markerIndex) + exposure, context, {
  filename: 'work_0036_phase3_fixture.js'
});

for (const fileName of [
  '20_GeminiProvider.gs',
  '12_Triggers.gs',
  '02_Setup.gs'
]) {
  vm.runInContext(
    fs.readFileSync(
      path.join(__dirname, '..', 'apps-script-v2', fileName),
      'utf8'
    ),
    context.__work0036.sandbox,
    { filename: `work_0036_${fileName}` }
  );
}

const { sandbox, scriptProperties } = context.__work0036;
const Config = sandbox.WorkOsConfig;
const Gateway = sandbox.WorkOsGmailGateway;
const Provider = sandbox.WorkOsGeminiProvider;

function headerMessage(subject, labels = ['INBOX']) {
  return {
    id: 'synthetic-work-0036-message',
    labelIds: labels,
    payload: {
      headers: [{ name: 'Subject', value: subject }]
    }
  };
}

function exactBody() {
  return Config.AUTOMATION_SYNTHETIC_BODY;
}

const tests = [];
function test(id, body) {
  try {
    body();
    tests.push({ id, status: 'PASS' });
  } catch (error) {
    tests.push({
      id,
      status: 'FAIL',
      safe_message: String(error && error.message || error).slice(0, 160)
    });
  }
}

test('WORK_0036_CANDIDATE_VERSION_AND_DEFAULT_OFF', () => {
  assert.strictEqual(Config.CODE_VERSION, '2.8.21-prepilot');
  assert.strictEqual(Config.SCHEMA_VERSION, '2.6');
  assert.strictEqual(Config.AI_SCHEMA_VERSION, '2.0');
  assert.strictEqual(Config.MIGRATION_VERSION, '3');
  assert.strictEqual(Config.AUTOMATION_ENABLED, false);
  assert.strictEqual(Config.AUTOMATION_MAX_MESSAGES_PER_RUN, 1);
  assert.strictEqual(
    Config.AUTOMATION_QUALIFICATION_SCOPE,
    'SYNTHETIC_AUTOMATION_QUALIFICATION_ONLY'
  );
});

test('WORK_0036_QUERY_IS_EXACT_SUBJECT_AND_BOUNDARY_IS_RECHECKED', () => {
  const gatewaySource = fs.readFileSync(
    path.join(__dirname, '..', 'apps-script-v2', '05_GmailGateway.gs'),
    'utf8'
  );
  const query = Gateway.automaticQuery(
    new Date('2026-07-24T00:00:00.000Z'),
    new Date('2026-07-24T01:00:00.000Z'),
    { qualification_only: true }
  ).query;
  assert.ok(query.includes('subject:"[WORK_OS_AUTOMATION_SYNTHETIC_0036]"'));
  assert.ok(query.includes('in:inbox'));
  assert.ok(query.includes('-in:spam'));
  assert.ok(query.includes('-in:trash'));
  assert.ok(query.includes('-label:手動/除外'));
  const exact = Gateway.automationQualificationCandidatePolicy(
    [],
    headerMessage(Config.AUTOMATION_SYNTHETIC_SUBJECT)
  );
  assert.strictEqual(exact.process, true);
  assert.strictEqual(exact.reason, 'AUTOMATION_SYNTHETIC_EXACT');
  assert.strictEqual(exact.priority, 10);
  assert.strictEqual(
    Gateway.automationQualificationCandidatePolicy(
      [],
      headerMessage('[WORK_OS_AUTOMATION_SYNTHETIC_0036] near')
    ).process,
    false
  );
  assert.match(
    gatewaySource,
    /var qualificationOnly = WorkOsConfig\.TEST_MODE !== true \|\|/
  );
  assert.match(
    gatewaySource,
    /qualificationOnly \? WorkOsConfig\.AUTOMATION_GMAIL_QUERY/
  );
});

test('WORK_0036_BODY_NORMALIZATION_IS_EXACT_AND_ATTACHMENT_FREE', () => {
  assert.strictEqual(Provider.isAutomationSyntheticBody(exactBody()), true);
  assert.strictEqual(
    Provider.isAutomationSyntheticBody(exactBody().replace(/\n/g, '\r\n')),
    true
  );
  assert.strictEqual(
    Provider.isAutomationSyntheticBody(`${exactBody()}\nnear-match`),
    false
  );
  assert.strictEqual(
    Provider.isAutomationSyntheticBody(exactBody().slice(0, -1)),
    false
  );
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'apps-script-v2', '05_GmailGateway.gs'),
    'utf8'
  );
  assert.ok(source.includes('if (filename || body.attachmentId)'));
  assert.ok(source.includes('body_transport_truncated'));
});

test('WORK_0036_CANDIDATE_REQUIRES_EXACT_SOURCE_AND_PROCESS_DECISION', () => {
  assert.strictEqual(Provider.isAutomationSyntheticCandidate({
    subject: Config.AUTOMATION_SYNTHETIC_SUBJECT,
    source_mode: Config.AUTOMATION_QUALIFICATION_SOURCE_MODE,
    manual_decision: 'PROCESS'
  }), true);
  assert.strictEqual(Provider.isAutomationSyntheticCandidate({
    subject: Config.AUTOMATION_SYNTHETIC_SUBJECT,
    source_mode: 'AUTOMATIC',
    manual_decision: 'PROCESS'
  }), false);
  assert.strictEqual(Provider.isAutomationSyntheticCandidate({
    subject: Config.AUTOMATION_SYNTHETIC_SUBJECT,
    source_mode: Config.AUTOMATION_QUALIFICATION_SOURCE_MODE,
    manual_decision: 'SKIP'
  }), false);
});

test('WORK_0036_READINESS_IS_BOUNDED_AND_NON_MUTATING', () => {
  const fixture = sandbox.PropertiesService.getScriptProperties();
  const scriptApp = {
    triggers: [],
    getProjectTriggers() { return this.triggers.slice(); }
  };
  const before = scriptApp.triggers.length;
  const result = sandbox.WorkOsAutomation
    .getPersonalAutomationQualificationStatus({
      properties: fixture,
      script_app: scriptApp
    });
  assert.strictEqual(result.qualification_scope,
    'SYNTHETIC_AUTOMATION_QUALIFICATION_ONLY');
  assert.strictEqual(result.exact_body_guard_active, true);
  assert.strictEqual(result.exact_query_active, true);
  assert.strictEqual(result.external_request_performed, false);
  assert.strictEqual(result.automation.clock_trigger_count, 0);
  assert.strictEqual(scriptApp.triggers.length, before);
  assert.ok(!JSON.stringify(result).includes('GEMINI_API_KEY'));
});

test('WORK_0036_PREPARATION_IS_OFF_ONLY_IDEMPOTENT_AND_VERSION_ALIGNED', () => {
  const props = sandbox.PropertiesService.getScriptProperties();
  scriptProperties.clear();
  props.setProperty(Config.PROPERTIES.SETUP_COMPLETED_STAGES,
    JSON.stringify(['S99_COMPLETE']));
  props.setProperty(Config.PROPERTIES.SCHEMA_VERSION, Config.SCHEMA_VERSION);
  props.setProperty(Config.PROPERTIES.MIGRATION_VERSION,
    Config.MIGRATION_VERSION);
  const scriptApp = { getProjectTriggers: () => [] };
  const options = {
    properties: props,
    script_app: scriptApp,
    completed_stages: ['S99_COMPLETE'],
    spreadsheet: context.__work0036.makeOperationalSpreadsheet()
  };
  const first = sandbox.WorkOsSetup.preparePersonalAutomationQualification(
    options
  );
  const second = sandbox.WorkOsSetup.preparePersonalAutomationQualification(
    options
  );
  assert.strictEqual(first.status,
    'READY_FOR_PERSONAL_AUTOMATION_QUALIFICATION');
  assert.strictEqual(second.property_keys_changed.length, 0);
  assert.strictEqual(props.getProperty(Config.PROPERTIES.AUTOMATION_ENABLED),
    null);
  assert.strictEqual(first.external_request_performed, false);
  assert.strictEqual(first.credential_value_read, false);
});

const failed = tests.filter((item) => item.status !== 'PASS');
process.stdout.write(`${JSON.stringify({
  suite: 'work_0036_personal_automation_qualification',
  environment: 'LOCAL_NON_GOOGLE_SYNTHETIC_ONLY',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
  real_gmail: 'NOT_EXECUTED',
  real_gemini: 'NOT_EXECUTED',
  trigger_mutation: 'NOT_EXECUTED'
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
