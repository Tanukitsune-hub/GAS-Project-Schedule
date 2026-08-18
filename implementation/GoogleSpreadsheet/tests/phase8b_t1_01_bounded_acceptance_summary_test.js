'use strict';

/**
 * T1-01 bounded Diagnostic acceptance-summary regression suite.
 *
 * This suite uses only the existing in-memory Apps Script double. It makes no
 * Google Workspace, Gmail, Calendar, OAuth, trigger, deployment, or provider
 * call. Synthetic warning identifiers below are test fixtures only; they do
 * not assert an unobserved sixth warning from the controlled Sandbox.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repositoryRoot = path.resolve(__dirname, '..');
const appsScriptRoot = path.join(repositoryRoot, 'apps-script-v2');
const phase1FixturePath = path.join(__dirname, 'phase1_audit_test.js');
const phase1Source = fs.readFileSync(phase1FixturePath, 'utf8')
  .replace(/\r\n/g, '\n');
const testsMarker = '\nconst tests = [];\n';
const fixtureEnd = phase1Source.indexOf(testsMarker);
if (fixtureEnd < 0) {
  throw new Error('P8B_BOUNDED_SUMMARY_FIXTURE_MARKER_NOT_FOUND');
}

const fixtureContext = {
  require,
  __dirname,
  __filename: phase1FixturePath,
  console,
  process: { stdout: { write: () => {} }, exitCode: 0 },
  Buffer,
  structuredClone
};
vm.createContext(fixtureContext);
vm.runInContext(
  phase1Source.slice(0, fixtureEnd) + `
globalThis.__phase8bBoundedSummaryFixture = { sandbox };`,
  fixtureContext,
  { filename: 'phase8b_bounded_summary_fixture.js' }
);

const sandbox = fixtureContext.__phase8bBoundedSummaryFixture.sandbox;
const tests = [];

function test(id, body) {
  const startedAt = Date.now();
  try {
    body();
    tests.push({ id, status: 'PASS', duration_ms: Date.now() - startedAt });
  } catch (error) {
    tests.push({
      id,
      status: 'FAIL',
      duration_ms: Date.now() - startedAt,
      safe_message: sandbox.WorkOsUtilities.redact(
        error && error.message || String(error)
      )
    });
  }
}

const SYNTHETIC_WARN_IDS = [
  'AI_PROVIDER_RETRY_SUPPRESSION',
  'CALENDAR_REMOTE_VERIFICATION',
  'DASHBOARD_LAYOUT_OWNERSHIP',
  'PRODUCTION_AI_AUTH_READINESS',
  'PRODUCTION_AI_CONFIGURATION',
  'PRODUCTION_AI_POLICY_APPROVAL'
];

function check(id, status, details) {
  return { id, status, safe_message: '', details: details || {} };
}

function canonicalChecks(extraWarnings) {
  return [
    check('COLUMNS_ae919285', 'PASS', { columns: 50 }),
    check('TASK_SCHEMA_IDS', 'PASS'),
    check('TASK_SCHEMA_HEADERS', 'PASS'),
    check('TASK_AUTHORITY_VALIDATOR', 'PASS'),
    check('COLUMNS_69e0d98c', 'PASS', { columns: 21 }),
    check('VISIBILITY_69e0d98c', 'PASS'),
    check('PROTECTION_69e0d98c', 'PASS')
  ].concat((extraWarnings || []).map((id) =>
    check(id, 'WARN', { synthetic_detail_marker: 'FIXTURE_ONLY' })
  ));
}

function assertReadOnlyBooleans(summary) {
  [
    'external_services_called',
    'writes_performed',
    'spreadsheet_write_performed',
    'properties_write_performed',
    'trigger_write_performed',
    'flush_performed',
    'calendar_api_called',
    'gmail_api_called',
    'external_ai_request_performed',
    'dashboard_repair_performed'
  ].forEach((name) => assert.strictEqual(summary[name], false, name));
}

test('P8B-BS-01_SIX_SYNTHETIC_WARN_IDS_ARE_SORTED_UNIQUE_AND_COMPLETE', () => {
  const summary = sandbox.WorkOsDiagnostics.buildAcceptanceSummary(
    canonicalChecks(SYNTHETIC_WARN_IDS.slice().reverse()),
    'QUICK'
  );
  assert.strictEqual(
    summary.summary_contract_id,
    'WORK_OS_V2_DIAGNOSTIC_ACCEPTANCE_SUMMARY_V1'
  );
  assert.strictEqual(summary.diagnostic_kind, 'QUICK');
  assert.strictEqual(summary.status, 'WARN');
  assert.strictEqual(summary.pass_count, 7);
  assert.strictEqual(summary.warn_count, 6);
  assert.strictEqual(summary.fail_count, 0);
  assert.deepStrictEqual(
    Array.from(summary.warn_check_ids),
    SYNTHETIC_WARN_IDS
  );
  assert.strictEqual(summary.warn_ids_complete, true);
  assert.deepStrictEqual(Array.from(summary.fail_check_ids), []);
  assert.strictEqual(summary.fail_ids_complete, true);
  assert.strictEqual(summary.acceptance_summary_status, 'COMPLETE');
});

test('P8B-BS-02_CANONICAL_TASK_AND_LEDGER_AGGREGATES_ARE_CLOSED', () => {
  const summary = sandbox.WorkOsDiagnostics.buildAcceptanceSummary(
    canonicalChecks(SYNTHETIC_WARN_IDS),
    'QUICK'
  );
  assert.strictEqual(summary.task_physical_column_count, 50);
  assert.strictEqual(summary.task_schema_ids_state, 'PASS');
  assert.strictEqual(summary.task_schema_headers_state, 'PASS');
  assert.strictEqual(summary.ledger_physical_column_count, 21);
  assert.strictEqual(summary.ledger_hidden_state, true);
  assert.strictEqual(summary.ledger_protection_state, true);
  assert.strictEqual(summary.ledger_authority_validator_state, 'PASS');
});

test('P8B-BS-03_UNKNOWN_OR_DUPLICATE_AGGREGATES_FAIL_CLOSED', () => {
  const checks = canonicalChecks(['VERSION_PROPERTIES']);
  checks.push(check('TASK_SCHEMA_IDS', 'PASS'));
  const summary = sandbox.WorkOsDiagnostics.buildAcceptanceSummary(checks, 'QUICK');
  assert.strictEqual(summary.task_schema_ids_state, 'UNKNOWN');
  assert.strictEqual(summary.ledger_hidden_state, true);
  const absent = sandbox.WorkOsDiagnostics.buildAcceptanceSummary([], 'QUICK');
  assert.strictEqual(absent.task_physical_column_count, 'UNKNOWN');
  assert.strictEqual(absent.ledger_physical_column_count, 'UNKNOWN');
  assert.strictEqual(absent.ledger_hidden_state, 'UNKNOWN');
  assert.strictEqual(absent.ledger_protection_state, 'UNKNOWN');
  assert.strictEqual(absent.ledger_authority_validator_state, 'UNKNOWN');
});

test('P8B-BS-04_STATE_DEPENDENT_WARNING_IS_REPORTED_WITHOUT_RAW_DETAILS', () => {
  const summary = sandbox.WorkOsDiagnostics.buildAcceptanceSummary(
    canonicalChecks(['AI_PROVIDER_RETRY_SUPPRESSION']),
    'QUICK'
  );
  assert.deepStrictEqual(
    Array.from(summary.warn_check_ids),
    ['AI_PROVIDER_RETRY_SUPPRESSION']
  );
  assert.strictEqual(JSON.stringify(summary).includes('FIXTURE_ONLY'), false);
});

test('P8B-BS-05_LEGACY_DASHBOARD_AND_EXISTING_WARNING_CANDIDATES_STAY_WARN', () => {
  const summary = sandbox.WorkOsDiagnostics.buildAcceptanceSummary(
    canonicalChecks([
      'DASHBOARD_LAYOUT_OWNERSHIP',
      'PRODUCTION_AI_CONFIGURATION',
      'PRODUCTION_AI_POLICY_APPROVAL',
      'PRODUCTION_AI_AUTH_READINESS',
      'CALENDAR_REMOTE_VERIFICATION'
    ]),
    'QUICK'
  );
  assert.strictEqual(summary.status, 'WARN');
  assert.strictEqual(summary.warn_count, 5);
  assert.ok(summary.warn_check_ids.includes('DASHBOARD_LAYOUT_OWNERSHIP'));
  assert.ok(summary.warn_check_ids.includes('CALENDAR_REMOTE_VERIFICATION'));
  assertReadOnlyBooleans(summary);
});

test('P8B-BS-06_OVERFLOW_OR_MALFORMED_IDS_FAIL_CLOSED', () => {
  const overflow = Array.from({ length: 97 }, (_, index) => check(
    `WARN_ITEM_${String(index).padStart(2, '0')}`,
    'WARN'
  ));
  const overflowSummary = sandbox.WorkOsDiagnostics.buildAcceptanceSummary(
    overflow,
    'QUICK'
  );
  assert.strictEqual(overflowSummary.warn_count, 97);
  assert.strictEqual(overflowSummary.warn_check_ids.length, 96);
  assert.strictEqual(overflowSummary.warn_ids_complete, false);
  assert.strictEqual(overflowSummary.acceptance_summary_status, 'REVIEW_REQUIRED');
  const malformedSummary = sandbox.WorkOsDiagnostics.buildAcceptanceSummary([
    check('SAFE_ID', 'WARN'),
    check('unsafe-id', 'WARN')
  ], 'QUICK');
  assert.strictEqual(malformedSummary.warn_ids_complete, false);
  assert.strictEqual(
    malformedSummary.acceptance_summary_status,
    'REVIEW_REQUIRED'
  );
});

test('P8B-BS-07_MENU_SUMMARY_PRECEDES_TRUNCATED_DETAILS', () => {
  const checks = canonicalChecks(SYNTHETIC_WARN_IDS);
  const result = {
    status: 'WARN',
    checks,
    acceptance_summary: sandbox.WorkOsDiagnostics.buildAcceptanceSummary(
      checks,
      'QUICK'
    ),
    detail_padding: 'x'.repeat(13000)
  };
  const alerts = [];
  const originalGetUi = sandbox.SpreadsheetApp.getUi;
  sandbox.SpreadsheetApp.getUi = () => ({
    ButtonSet: { OK: 'OK' },
    alert: (title, message) => alerts.push({ title, message })
  });
  try {
    sandbox.showSafeResult_('Quick Diagnostic', result);
  } finally {
    sandbox.SpreadsheetApp.getUi = originalGetUi;
  }
  assert.strictEqual(alerts.length, 1);
  const message = alerts[0].message;
  const summaryIndex = message.indexOf('--- Bounded Acceptance Summary ---');
  const detailsIndex = message.indexOf('--- ');
  assert.ok(summaryIndex >= 0);
  assert.ok(detailsIndex >= 0);
  assert.ok(summaryIndex < message.lastIndexOf('--- '));
  SYNTHETIC_WARN_IDS.forEach((id) => assert.ok(message.includes(id), id));
  assert.ok(message.includes('complete=true'));
  assert.ok(message.length > 10500);
});

test('P8B-BS-08_SUMMARY_EXECUTION_POLICY_AND_SOURCE_REMAIN_READ_ONLY', () => {
  const policy = sandbox.WorkOsDiagnostics.readOnlyExecutionPolicy();
  assertReadOnlyBooleans(policy);
  const source = fs.readFileSync(
    path.join(appsScriptRoot, '16_Diagnostics.gs'),
    'utf8'
  );
  assert.strictEqual(/SpreadsheetApp\.flush\s*\(/.test(source), false);
  assert.strictEqual(
    /\.(?:setValue|setValues|clear|insert|delete|append|protect)\s*\(/.test(
      source
    ),
    false
  );
});

const failed = tests.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({
  suite: 'phase8b_t1_01_bounded_acceptance_summary',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_google_workspace: 'NOT_EXECUTED',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
