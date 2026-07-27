'use strict';

/**
 * Phase 7 Worker recovery integration tests.
 *
 * Reuses the Phase 6 in-memory Worker fixture. No real Gmail, Calendar,
 * Trigger, provider, credential, or Spreadsheet is contacted.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const phase6Path = path.resolve(__dirname, 'phase6_worker_integration_test.js');
const source = fs.readFileSync(phase6Path, 'utf8');
const marker = '\nconst tests = [];\n';
const markerIndex = source.indexOf(marker);
if (markerIndex < 0) {
  throw new Error('PHASE6_WORKER_FIXTURE_MARKER_NOT_FOUND');
}
const exposure = `
globalThis.__phase7RecoveryFixture = {
  fixture,
  sandbox,
  Worker,
  State,
  Config,
  automaticGateway,
  allStates,
  properties,
  clockAt,
  runHistoryValues
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
  clearTimeout,
  Intl
};
vm.createContext(context);
vm.runInContext(source.slice(0, markerIndex) + exposure, context, {
  filename: 'phase6_worker_fixture.js'
});

const {
  fixture,
  sandbox,
  Worker,
  State,
  Config,
  automaticGateway,
  allStates,
  properties,
  clockAt,
  runHistoryValues
} = context.__phase7RecoveryFixture;
const Recovery = sandbox.WorkOsLogAndDeadLetter;
const FakeDate = sandbox.Date;
if (!sandbox.WorkOsDiagnostics) {
  sandbox.ScriptApp = {
    getProjectTriggers: () => [],
    getAuthorizationInfo: () => ({
      getAuthorizationStatus: () => 'NOT_REQUIRED'
    }),
    AuthMode: { FULL: 'FULL' }
  };
  sandbox.Session = {
    getEffectiveUser: () => ({
      getEmail: () => 'synthetic-diagnostic@example.invalid'
    })
  };
  ['03_SheetBuilder.gs', '12_Triggers.gs', '16_Diagnostics.gs']
    .forEach((fileName) => {
      vm.runInContext(
        fs.readFileSync(
          path.resolve(__dirname, '..', 'apps-script-v2', fileName),
          'utf8'
        ),
        sandbox,
        { filename: fileName }
      );
    });
}

function recordsFromSheet(sheet) {
  const ids = sheet.cells[0];
  return sheet.cells.slice(Config.DATA_START_ROW - 1)
    .filter((row) => String(row[0] || ''))
    .map((row) => Object.fromEntries(
      ids.map((id, index) => [id, row[index]])
    ));
}

function errorRecords(spreadsheet) {
  return recordsFromSheet(
    spreadsheet.getSheetByName(Config.SHEETS.ERRORS)
  );
}

function settings(spreadsheet, gateway, props, iso) {
  return {
    spreadsheet,
    gateway,
    properties: props,
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt(iso),
    budget: { isExhausted: () => false }
  };
}

function stateFor(spreadsheet, messageId) {
  return allStates(spreadsheet).find(
    (record) => record.message_id === messageId
  );
}

const tests = [];
function test(id, body) {
  const startedAt = Date.now();
  try {
    fixture.resetLockMetrics();
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
  } finally {
    fixture.setLockAvailable(true);
    fixture.scriptProperties.clear();
  }
}

test('P7-I01_AUTOMATIC_RETRY_RESUMES_AND_RESOLVES_ONE_ERROR', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const props = properties();
  const failedMessage = fixture.rawMessage('TRANSIENT_ERROR', {
    message_id: 'synthetic-phase7-auto-retry',
    thread_id: 'synthetic-phase7-auto-thread'
  });
  const failed = Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      automaticGateway([failedMessage]),
      props,
      '2026-07-24T10:00:00.000Z'
    )
  );
  assert.strictEqual(failed.status, 'FAILED');
  assert.strictEqual(stateFor(
    spreadsheet,
    failedMessage.message_id
  ).processing_status, 'RETRY');
  assert.strictEqual(errorRecords(spreadsheet).length, 1);
  assert.strictEqual(errorRecords(spreadsheet)[0].status, 'OPEN');

  const recoveredMessage = {
    ...failedMessage,
    subject: '[MOCK:NEW_HIGH] Synthetic recovered task'
  };
  const recoveredGateway = automaticGateway([recoveredMessage]);
  const recovered = Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      recoveredGateway,
      props,
      '2026-07-24T10:06:00.000Z'
    )
  );
  assert.strictEqual(recovered.status, 'COMPLETE');
  assert.strictEqual(recovered.backlog_processed_count, 1);
  assert.strictEqual(
    stateFor(spreadsheet, failedMessage.message_id).processing_status,
    'DONE'
  );
  assert.strictEqual(
    fixture.allTasks(fixture.taskSheet(spreadsheet)).length,
    1
  );
  assert.strictEqual(errorRecords(spreadsheet)[0].status, 'RESOLVED');
  assert.strictEqual(
    JSON.stringify(recoveredGateway.calls.refetch),
    JSON.stringify([failedMessage.message_id])
  );
});

test('P7-I02_FOUR_FAILURES_MANUAL_RETRY_RECOVERS_WITHOUT_DUPLICATES', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const props = properties();
  const failedMessage = fixture.rawMessage('TRANSIENT_ERROR', {
    message_id: 'synthetic-phase7-manual-recovery',
    thread_id: 'synthetic-phase7-manual-thread',
    stable_thread_key: 'root:synthetic-phase7-manual-root'
  });
  fixture.seedPreprocessed(spreadsheet, failedMessage);
  const failureGateway = automaticGateway([failedMessage]);
  [
    '2026-07-24T00:00:00.000Z',
    '2026-07-24T00:05:00.000Z',
    '2026-07-24T00:20:00.000Z',
    '2026-07-24T01:20:00.000Z'
  ].forEach((iso) => {
    const result = Worker.processMockVerticalOnce(
      settings(spreadsheet, failureGateway, props, iso)
    );
    assert.strictEqual(result.status, 'FAILED');
  });
  assert.strictEqual(
    stateFor(spreadsheet, failedMessage.message_id).processing_status,
    'DEAD'
  );
  const dead = errorRecords(spreadsheet);
  assert.strictEqual(dead.length, 1);
  assert.strictEqual(dead[0].status, 'DEAD');
  assert.strictEqual(dead[0].attempt_count, 4);

  const queued = Recovery.retryDeadLetterById(dead[0].dead_letter_id, {
    spreadsheet,
    readiness_checker: () => ({ ready: true, reasons: [] }),
    now: new FakeDate('2026-07-24T01:21:00.000Z')
  });
  assert.strictEqual(queued.status, 'QUEUED');
  assert.strictEqual(
    stateFor(spreadsheet, failedMessage.message_id).processing_status,
    'RETRY'
  );

  const recoveredMessage = {
    ...failedMessage,
    subject: '[MOCK:NEW_HIGH] Synthetic manual recovery'
  };
  const recoveredGateway = automaticGateway([recoveredMessage]);
  const recovered = Worker.processMockVerticalOnce(
    settings(
      spreadsheet,
      recoveredGateway,
      props,
      '2026-07-24T01:21:01.000Z'
    )
  );
  assert.strictEqual(recovered.status, 'COMPLETE');
  assert.strictEqual(recovered.created_task_count, 1);
  assert.strictEqual(
    fixture.allTasks(fixture.taskSheet(spreadsheet)).length,
    1
  );
  assert.strictEqual(errorRecords(spreadsheet)[0].status, 'RESOLVED');

  Worker.processMockVerticalOnce(
    settings(
      spreadsheet,
      recoveredGateway,
      props,
      '2026-07-24T01:22:00.000Z'
    )
  );
  assert.strictEqual(
    fixture.allTasks(fixture.taskSheet(spreadsheet)).length,
    1
  );
});

test('P7-I03_PROVIDER_SUPPRESSION_STOPS_BACKLOG_AND_INBOX_STORM', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const props = properties();
  const failedMessage = fixture.rawMessage('TRANSIENT_ERROR', {
    message_id: 'synthetic-phase7-provider-suppression'
  });
  Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      automaticGateway([failedMessage]),
      props,
      '2026-07-24T12:00:00.000Z'
    )
  );
  const newInbox = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-phase7-suppressed-inbox'
  });
  const suppressedGateway = automaticGateway([failedMessage, newInbox]);
  const suppressed = Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      suppressedGateway,
      props,
      '2026-07-24T12:01:00.000Z'
    )
  );
  assert.strictEqual(suppressed.provider_retry_suppressed, true);
  assert.strictEqual(suppressedGateway.calls.list, 0);
  assert.strictEqual(suppressedGateway.calls.fetch.length, 0);
  assert.strictEqual(suppressedGateway.calls.refetch.length, 0);
  assert.strictEqual(allStates(spreadsheet).length, 1);
  assert.strictEqual(
    stateFor(spreadsheet, failedMessage.message_id).processing_status,
    'RETRY'
  );
});

test('P7-I04_GMAIL_LABEL_FAILURE_IS_RETRYABLE_AND_LATER_RESOLVED', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const props = properties();
  const failedMessage = fixture.rawMessage('TRANSIENT_ERROR', {
    message_id: 'synthetic-phase7-label-failure',
    thread_id: 'synthetic-phase7-label-thread'
  });
  const failingGateway = automaticGateway([failedMessage]);
  failingGateway.setSystemFailureLabel = () => {
    throw new sandbox.WorkOsAppError(
      'E_GMAIL_LABEL_TEMPORARY',
      'GMAIL_LABEL',
      true,
      'Synthetic label service failure'
    );
  };
  const failed = Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      failingGateway,
      props,
      '2026-07-24T14:00:00.000Z'
    )
  );
  assert.strictEqual(failed.status, 'FAILED');
  assert.strictEqual(errorRecords(spreadsheet).length, 2);
  assert.strictEqual(
    JSON.stringify(
      errorRecords(spreadsheet).map((record) => record.subsystem).sort()
    ),
    JSON.stringify(['AI_REQUEST', 'GMAIL_LABEL'])
  );

  const recoveredMessage = {
    ...failedMessage,
    subject: '[MOCK:INFORMATION_ONLY] Synthetic label recovery'
  };
  Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      automaticGateway([recoveredMessage]),
      props,
      '2026-07-24T14:06:00.000Z'
    )
  );
  assert.strictEqual(
    JSON.stringify(errorRecords(spreadsheet).map((record) => record.status)),
    JSON.stringify(['RESOLVED', 'RESOLVED'])
  );
});

test('P7-I05_ERROR_AND_RUN_LOGS_NEVER_PERSIST_RAW_PAYLOAD_OR_TOKEN', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const props = properties();
  const message = fixture.rawMessage('TRANSIENT_ERROR', {
    message_id: 'synthetic-sensitive-message-id',
    thread_id: 'synthetic-sensitive-thread-id',
    plain_body: 'Authorization: Bearer SYNTHETIC_TOKEN_MUST_NOT_PERSIST'
  });
  message.subject = '[MOCK:TRANSIENT_ERROR] SYNTHETIC_SUBJECT_SECRET';
  message.sender = 'sensitive-sender@example.invalid';
  Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      automaticGateway([message]),
      props,
      '2026-07-24T16:00:00.000Z'
    )
  );
  const persisted = JSON.stringify({
    errors: errorRecords(spreadsheet),
    history: runHistoryValues(spreadsheet)
  });
  [
    'synthetic-sensitive-message-id',
    'synthetic-sensitive-thread-id',
    'SYNTHETIC_TOKEN_MUST_NOT_PERSIST',
    'SYNTHETIC_SUBJECT_SECRET',
    'sensitive-sender@example.invalid'
  ].forEach((secret) => assert.strictEqual(persisted.includes(secret), false));
});

test('P7-I06_RECOVERY_INSPECTOR_AND_DEEP_DIAGNOSTIC_ARE_READ_ONLY', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const props = properties();
  const message = fixture.rawMessage('TRANSIENT_ERROR', {
    message_id: 'synthetic-phase7-diagnostic-retry'
  });
  Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      automaticGateway([message]),
      props,
      '2026-07-24T18:00:00.000Z'
    )
  );
  const cellsBefore = JSON.stringify(
    spreadsheet.getSheets().map((sheet) => sheet.cells)
  );
  const propertiesBefore = JSON.stringify(
    Array.from(fixture.scriptProperties.entries()).sort()
  );
  const recovery = sandbox.WorkOsDiagnostics.inspectRecoveryState(
    spreadsheet,
    { isExhausted: () => false },
    new FakeDate('2026-07-24T18:01:00.000Z')
  );
  assert.strictEqual(recovery.messages.due_retry_count, 0);
  assert.strictEqual(recovery.errors.unresolved_error_count, 1);
  assert.strictEqual(recovery.provider_suppression.active, true);

  const deep = sandbox.WorkOsDiagnostics.runDeepDiagnostic(spreadsheet, {
    now: new FakeDate('2026-07-24T18:01:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(deep.diagnostic_type, 'DEEP_MANUAL_READ_ONLY');
  const sample = deep.checks.find(
    (item) => item.id === 'DEEP_RECOVERY_SAMPLE'
  );
  assert(sample);
  assert.strictEqual(
    sample.details.recovery.scan.row_limit,
    Config.DEEP_DIAGNOSTIC_SAMPLE_ROWS
  );
  assert(
    sample.details.recovery.scan.message_state.physical_rows_scanned <=
      Config.DEEP_DIAGNOSTIC_SAMPLE_ROWS
  );
  assert.strictEqual(
    JSON.stringify(spreadsheet.getSheets().map((sheet) => sheet.cells)),
    cellsBefore
  );
  assert.strictEqual(
    JSON.stringify(Array.from(fixture.scriptProperties.entries()).sort()),
    propertiesBefore
  );
});

test('P7-I07_PROVIDER_SUPPRESSION_DEFERS_STALE_PREPROCESS_WITHOUT_GMAIL_OR_AI', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const props = properties();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-phase7-stale-preprocess',
    thread_id: 'synthetic-phase7-stale-preprocess-thread'
  });
  sandbox.WorkOsUtilities.withScriptLock((lock) => {
    const context = State.createContextForHeldLock(
      fixture.stateSheet(spreadsheet),
      lock
    );
    const claim = State.claimInContext(
      {
        message_id: message.message_id,
        thread_id: message.thread_id,
        stable_thread_key: message.stable_thread_key,
        received_at: message.received_at,
        source_mode: 'AUTOMATIC'
      },
      'run_synthetic_stale_preprocess',
      context,
      new FakeDate('2026-07-24T12:00:00.000Z')
    );
    assert.strictEqual(claim.claimed, true);
  }, Config.LOCK_WAIT_MS);
  props.setProperty(
    Config.PROPERTIES.AI_PROVIDER_SUPPRESS_UNTIL,
    '2026-07-24T13:05:00.000Z'
  );
  const gateway = automaticGateway([message]);
  const result = Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      gateway,
      props,
      '2026-07-24T13:00:00.000Z'
    )
  );
  assert.strictEqual(result.provider_retry_suppressed, true);
  assert.strictEqual(gateway.calls.list, 0);
  assert.strictEqual(gateway.calls.fetch.length, 0);
  assert.strictEqual(gateway.calls.refetch.length, 0);
  assert.strictEqual(
    stateFor(spreadsheet, message.message_id).processing_status,
    State.STATUSES.CLAIMED
  );
  assert.strictEqual(
    stateFor(spreadsheet, message.message_id).resume_stage,
    State.RESUME_STAGES.PREPROCESS
  );
});

test('P7-I08_AUTOMATIC_BATCH_READS_ERROR_CONTEXT_ONCE', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const props = properties();
  const messages = Array.from({ length: 10 }, (_, index) =>
    fixture.rawMessage('INFORMATION_ONLY', {
      message_id: `synthetic-phase7-context-${index}`,
      thread_id: `synthetic-phase7-context-thread-${index}`
    })
  );
  const errorSheet = spreadsheet.getSheetByName(Config.SHEETS.ERRORS);
  errorSheet.readLog = [];
  const result = Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      automaticGateway(messages),
      props,
      '2026-07-24T19:00:00.000Z'
    )
  );
  assert.strictEqual(result.status, 'COMPLETE');
  assert.strictEqual(result.processed_count, 10);
  assert(
    errorSheet.readLog.length <= 2,
    `Error context was read ${errorSheet.readLog.length} times`
  );
});

test('P7-I09_SYSTEM_SEARCH_RETRY_OBEYS_DUE_TIME_AND_RESOLVES_ON_SUCCESS', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const props = properties();
  const firstGateway = automaticGateway([], { list_error: true });
  const first = Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      firstGateway,
      props,
      '2026-07-24T20:00:00.000Z'
    )
  );
  assert.strictEqual(first.status, 'FAILED');
  assert.strictEqual(firstGateway.calls.list, 1);
  assert.strictEqual(errorRecords(spreadsheet).length, 1);
  assert.strictEqual(errorRecords(spreadsheet)[0].status, 'OPEN');
  assert.strictEqual(
    errorRecords(spreadsheet)[0].next_retry_at.toISOString(),
    '2026-07-24T20:05:00.000Z'
  );

  const earlyGateway = automaticGateway([]);
  const early = Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      earlyGateway,
      props,
      '2026-07-24T20:01:00.000Z'
    )
  );
  assert.strictEqual(early.status, 'PAUSED');
  assert.strictEqual(early.system_retry_deferred, true);
  assert.strictEqual(earlyGateway.calls.list, 0);
  assert.strictEqual(errorRecords(spreadsheet)[0].status, 'OPEN');

  const dueGateway = automaticGateway([]);
  const due = Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      dueGateway,
      props,
      '2026-07-24T20:05:00.000Z'
    )
  );
  assert.strictEqual(due.status, 'COMPLETE');
  assert.strictEqual(dueGateway.calls.list, 1);
  assert.strictEqual(errorRecords(spreadsheet)[0].status, 'RESOLVED');
});

test('P7-I10_SYSTEM_DEAD_LETTER_MANUAL_RETRY_RECOVERS_WITHOUT_MESSAGE', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const props = properties();
  [
    '2026-07-24T21:00:00.000Z',
    '2026-07-24T21:05:00.000Z',
    '2026-07-24T21:20:00.000Z',
    '2026-07-24T22:20:00.000Z'
  ].forEach((iso) => {
    const result = Worker.processAutomaticBatch(
      settings(
        spreadsheet,
        automaticGateway([], { list_error: true }),
        props,
        iso
      )
    );
    assert.strictEqual(result.status, 'FAILED');
  });
  const dead = errorRecords(spreadsheet);
  assert.strictEqual(dead.length, 1);
  assert.strictEqual(dead[0].status, 'DEAD');
  assert.strictEqual(dead[0].attempt_count, 4);
  assert.strictEqual(dead[0].subsystem, 'GMAIL_SEARCH');
  assert.match(dead[0].safe_reference, /^sysref_[0-9a-f]{64}$/);

  const blockedGateway = automaticGateway([]);
  const blocked = Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      blockedGateway,
      props,
      '2026-07-24T22:21:00.000Z'
    )
  );
  assert.strictEqual(blocked.status, 'PAUSED');
  assert.strictEqual(blocked.system_retry_deferred, true);
  assert.strictEqual(blockedGateway.calls.list, 0);

  const queued = Recovery.retryDeadLetterById(dead[0].dead_letter_id, {
    spreadsheet,
    readiness_checker: () => ({ ready: true, reasons: [] }),
    now: new FakeDate('2026-07-24T22:22:00.000Z')
  });
  assert.strictEqual(queued.status, 'QUEUED');
  assert.strictEqual(queued.repository_operation, 'SYSTEM_RETRY_QUEUED');
  assert.strictEqual(allStates(spreadsheet).length, 0);

  const recoveredGateway = automaticGateway([]);
  const recovered = Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      recoveredGateway,
      props,
      '2026-07-24T22:22:01.000Z'
    )
  );
  assert.strictEqual(recovered.status, 'COMPLETE');
  assert.strictEqual(recoveredGateway.calls.list, 1);
  assert.strictEqual(errorRecords(spreadsheet)[0].status, 'RESOLVED');
  assert.strictEqual(allStates(spreadsheet).length, 0);
  assert.strictEqual(
    fixture.allTasks(fixture.taskSheet(spreadsheet)).length,
    0
  );
});

test('P7-I11_POST_SEARCH_STATE_FAILURE_RETAINS_ATTEMPTS_UNTIL_STATE_SUCCESS', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const baseProps = properties();
  let failStateWrite = true;
  const props = {
    getProperty: (key) => baseProps.getProperty(key),
    getProperties: () => baseProps.getProperties(),
    deleteProperty: (key) => baseProps.deleteProperty(key),
    setProperty: (key, value) => {
      if (failStateWrite &&
          key === Config.PROPERTIES.AUTOMATION_WATERMARK_AT) {
        throw new sandbox.WorkOsAppError(
          'E_STATE_WRITE_SERVICE',
          'AUTOMATIC_STATE_WRITE',
          true,
          'Synthetic state write failure'
        );
      }
      return baseProps.setProperty(key, value);
    }
  };
  [
    '2026-07-24T23:00:00.000Z',
    '2026-07-24T23:05:00.000Z',
    '2026-07-24T23:20:00.000Z',
    '2026-07-25T00:20:00.000Z'
  ].forEach((iso, index) => {
    const gateway = automaticGateway([]);
    const result = Worker.processAutomaticBatch(
      settings(spreadsheet, gateway, props, iso)
    );
    assert.strictEqual(result.status, 'FAILED');
    assert.strictEqual(gateway.calls.list, 1);
    const current = errorRecords(spreadsheet)[0];
    assert.strictEqual(current.subsystem, 'STATE_WRITE');
    assert.strictEqual(current.attempt_count, index + 1);
    assert.strictEqual(
      current.status,
      index === 3 ? 'DEAD' : 'OPEN'
    );
  });
  const dead = errorRecords(spreadsheet)[0];
  assert.strictEqual(dead.status, 'DEAD');

  const blockedGateway = automaticGateway([]);
  const blocked = Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      blockedGateway,
      props,
      '2026-07-25T00:21:00.000Z'
    )
  );
  assert.strictEqual(blocked.status, 'PAUSED');
  assert.strictEqual(blockedGateway.calls.list, 0);

  Recovery.retryDeadLetterById(dead.dead_letter_id, {
    spreadsheet,
    readiness_checker: () => ({ ready: true, reasons: [] }),
    now: new FakeDate('2026-07-25T00:22:00.000Z')
  });
  failStateWrite = false;
  const recoveredGateway = automaticGateway([]);
  const recovered = Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      recoveredGateway,
      props,
      '2026-07-25T00:22:01.000Z'
    )
  );
  assert.strictEqual(recovered.status, 'COMPLETE');
  assert.strictEqual(recoveredGateway.calls.list, 1);
  assert.strictEqual(errorRecords(spreadsheet)[0].status, 'RESOLVED');
});

const summary = {
  phase: 7,
  suite: 'worker_recovery_integration',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_trigger: 'NOT_EXECUTED',
  real_gmail: 'NOT_EXECUTED',
  real_calendar: 'NOT_EXECUTED',
  real_provider_connection: 'NOT_EXECUTED',
  passed: tests.filter((item) => item.status === 'PASS').length,
  failed: tests.filter((item) => item.status === 'FAIL').length,
  tests
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed) {
  process.exitCode = 1;
}

