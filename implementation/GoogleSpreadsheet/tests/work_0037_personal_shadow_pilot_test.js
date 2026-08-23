/**
 * Work 0037 label-gated Personal Shadow Pilot contract.
 *
 * All provider/Gmail/trigger objects are in-memory fakes. No Google service,
 * credential, runtime function, or external provider request is performed.
 */
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const phase6Path = path.resolve(__dirname, 'phase6_local_test.js');
const phase6Source = fs.readFileSync(phase6Path, 'utf8')
  .replace(/\r\n/g, '\n');
const marker = '\nconst summary = {\n';
const markerIndex = phase6Source.lastIndexOf(marker);
if (markerIndex < 0) throw new Error('PHASE6_FIXTURE_REPORT_MARKER_MISSING');

const exposure = `
globalThis.__work0037 = {
  sandbox,
  gmailState,
  resetGmail,
  addThread,
  message,
  FakeProperties,
  FakeScriptApp
};
`;
const context = {
  require,
  __dirname,
  __filename: phase6Path,
  console,
  process: { stdout: { write: () => {} }, exitCode: 0 },
  Buffer,
  structuredClone,
  setTimeout,
  clearTimeout
};
vm.createContext(context);
vm.runInContext(phase6Source.slice(0, markerIndex) + exposure, context, {
  filename: 'work_0037_phase6_fixture.js'
});

const fixture = context.__work0037;
const { sandbox, gmailState } = fixture;
const Config = sandbox.WorkOsConfig;
const Gateway = sandbox.WorkOsGmailGateway;

const tests = [];
function test(id, body) {
  try {
    body();
    tests.push({ id, status: 'PASS' });
  } catch (error) {
    tests.push({
      id,
      status: 'FAIL',
      safe_message: String(error && error.message || error).slice(0, 180)
    });
  }
}

function pilotOptions() {
  return {
    pilot_only: true,
    watermark_at: new sandbox.Date('2026-08-23T00:00:00.000Z'),
    upper_bound_at: new sandbox.Date('2026-08-23T12:00:00.000Z')
  };
}

function runCandidate(messages, known = {}) {
  fixture.resetGmail();
  fixture.addThread('pilot-thread', messages);
  gmailState.listHandler = (request) => ({ threads: [{ id: 'pilot-thread' }] });
  const result = Gateway.listAutomaticCandidates({
    ...pilotOptions(),
    known_message_ids: known
  });
  return result;
}

test('WORK_0037_CONFIG_IS_LABEL_GATED_AND_BOUNDED', () => {
  assert.strictEqual(Config.CODE_VERSION, '2.8.22-prepilot');
  assert.strictEqual(Config.AUTOMATION_ENABLED, false);
  assert.strictEqual(Config.AUTOMATION_PILOT_SCOPE,
    'LABEL_GATED_PERSONAL_SHADOW_PILOT');
  assert.strictEqual(Config.AUTOMATION_PILOT_ADMISSION_MODE, 'LABEL_GATED');
  assert.strictEqual(Config.AUTOMATION_PILOT_SOURCE_MODE, 'AUTOMATIC_PILOT');
  assert.strictEqual(Config.AUTOMATION_PILOT_MAX_MESSAGES_PER_RUN, 1);
  assert.strictEqual(Config.AUTOMATION_PILOT_GMAIL_QUERY,
    'in:inbox -in:spam -in:trash label:手動/取込 -label:手動/除外');
});

test('WORK_0037_LABELED_INBOX_MESSAGE_IS_ADMITTED_WITH_PILOT_SOURCE', () => {
  const result = runCandidate([
    fixture.message('pilot-eligible', '2026-08-23T10:00:00.000Z', [
      'INBOX', 'LBL_4'
    ])
  ]);
  assert.strictEqual(result.candidates.length, 1);
  assert.strictEqual(result.candidates[0].message_id, 'pilot-eligible');
  assert.strictEqual(result.candidates[0].source_mode,
    Config.AUTOMATION_PILOT_SOURCE_MODE);
  assert.strictEqual(result.candidates[0].selection_reason,
    'PILOT_MANUAL_IMPORT');
  assert.strictEqual(result.query,
    `${Config.AUTOMATION_PILOT_GMAIL_QUERY} after:${Math.floor(
      new Date('2026-08-22T00:00:00.000Z').getTime() / 1000
    )} before:${Math.floor(
      new Date('2026-08-23T12:00:00.000Z').getTime() / 1000
    ) + 1}`);
});

test('WORK_0037_UNLABELED_INBOX_MESSAGE_IS_REJECTED', () => {
  const result = runCandidate([
    fixture.message('pilot-unlabeled', '2026-08-23T10:00:00.000Z')
  ]);
  assert.strictEqual(result.candidates.length, 0);
  assert.strictEqual(result.filter_counts.PILOT_LABEL_REQUIRED, 1);
});

test('WORK_0037_EXCLUDE_WINS_OVER_IMPORT_LABEL', () => {
  const result = runCandidate([
    fixture.message('pilot-excluded', '2026-08-23T10:00:00.000Z', [
      'INBOX', 'LBL_4', 'LBL_5'
    ])
  ]);
  assert.strictEqual(result.candidates.length, 0);
  assert.strictEqual(result.filter_counts.MANUAL_EXCLUDE, 1);
});

test('WORK_0037_SPAM_TRASH_AND_NON_INBOX_ARE_REJECTED', () => {
  const result = runCandidate([
    fixture.message('pilot-spam', '2026-08-23T09:00:00.000Z', [
      'INBOX', 'SPAM', 'LBL_4'
    ]),
    fixture.message('pilot-trash', '2026-08-23T10:00:00.000Z', [
      'INBOX', 'TRASH', 'LBL_4'
    ]),
    fixture.message('pilot-archive', '2026-08-23T11:00:00.000Z', [
      'LBL_4'
    ])
  ]);
  assert.strictEqual(result.candidates.length, 0);
  assert.strictEqual(result.filter_counts.SYSTEM_SCOPE, 3);
});

test('WORK_0037_KNOWN_ID_IS_NOT_REDISCOVERED_AND_RUN_IS_ONE_MESSAGE', () => {
  const result = runCandidate([
    fixture.message('pilot-known', '2026-08-23T09:00:00.000Z', [
      'INBOX', 'LBL_4'
    ]),
    fixture.message('pilot-new', '2026-08-23T10:00:00.000Z', [
      'INBOX', 'LBL_4'
    ])
  ], { 'pilot-known': true });
  assert.strictEqual(result.candidates.length, 1);
  assert.strictEqual(result.candidates[0].message_id, 'pilot-new');
  assert.strictEqual(result.candidate_overflow, false);
});

test('WORK_0037_SOURCE_MODE_IS_DISTINCT_FROM_MANUAL_AND_QUALIFICATION', () => {
  assert.notStrictEqual(Config.AUTOMATION_PILOT_SOURCE_MODE, 'MANUAL');
  assert.notStrictEqual(
    Config.AUTOMATION_PILOT_SOURCE_MODE,
    Config.AUTOMATION_QUALIFICATION_SOURCE_MODE
  );
});

test('WORK_0037_PILOT_READINESS_SURFACE_IS_SAFE_AND_OFF', () => {
  const props = new fixture.FakeProperties();
  const scriptApp = new fixture.FakeScriptApp();
  const result = sandbox.WorkOsAutomation.getPersonalShadowPilotStatus({
    properties: props,
    script_app: scriptApp
  });
  assert.strictEqual(result.status, 'BLOCKED');
  assert.strictEqual(result.pilot_scope, Config.AUTOMATION_PILOT_SCOPE);
  assert.strictEqual(result.admission_mode, 'LABEL_GATED');
  assert.strictEqual(result.candidate_mode,
    Config.AUTOMATION_PILOT_SOURCE_MODE);
  assert.strictEqual(result.automation.clock_trigger_count, 0);
  assert.strictEqual(result.external_request_performed, false);
  assert(!JSON.stringify(result).includes('GEMINI_API_KEY'));
});

test('WORK_0037_MANUAL_WORKER_HAS_ACTIVE_PILOT_FAIL_CLOSED_GUARD', () => {
  const workerSource = fs.readFileSync(
    path.join(__dirname, '..', 'apps-script-v2', '18_Worker.gs'),
    'utf8'
  );
  const productionConfig = Object.assign({}, Config, { TEST_MODE: false });
  function FakeWorkOsAppError(code) {
    this.code = code;
  }
  const guardContext = {
    WorkOsConfig: productionConfig,
    WorkOsAutomation: {
      getDiagnosticAutomationStatus: () => ({
        status: 'CONSISTENT',
        enabled: true,
        desired_enabled: true,
        clock_trigger_count: 1,
        stored_trigger_id_present: true,
        canonical_trigger_present: true
      })
    },
    WorkOsAppError: FakeWorkOsAppError,
    SpreadsheetApp: { getActiveSpreadsheet: () => ({}) },
    WorkOsRuntimeSettings: {
      readSnapshot: () => ({
        manual_worker_soft_limit_ms: 120000,
        automation_worker_soft_limit_ms: 210000
      })
    },
    console
  };
  vm.createContext(guardContext);
  vm.runInContext(workerSource, guardContext, {
    filename: 'work_0037_worker_guard.gs'
  });
  assert.throws(
    () => guardContext.WorkOsWorker.processManualImportOnce(),
    (error) => error && error.code === 'E_MANUAL_PILOT_AUTOMATION_ACTIVE'
  );
});

test('WORK_0037_CANDIDATE_AND_QUERY_ARE_PRIVACY_SAFE', () => {
  const result = runCandidate([
    fixture.message('pilot-private', '2026-08-23T10:00:00.000Z', [
      'INBOX', 'LBL_4'
    ])
  ]);
  const serialized = JSON.stringify(result);
  assert(!/plain_body|body_data|credential|authorization|GEMINI_API_KEY/i
    .test(serialized));
});

const summary = {
  suite: 'work_0037_personal_shadow_pilot',
  environment: 'LOCAL_FAKE_APPS_SCRIPT_NO_GOOGLE',
  passed: tests.filter((item) => item.status === 'PASS').length,
  failed: tests.filter((item) => item.status === 'FAIL').length,
  tests,
  real_gmail: 'NOT_EXECUTED',
  real_gemini: 'NOT_EXECUTED',
  runtime_function: 'NOT_EXECUTED',
  trigger_mutation: 'NOT_EXECUTED'
};
console.log(JSON.stringify(summary, null, 2));
if (summary.failed) process.exitCode = 1;
