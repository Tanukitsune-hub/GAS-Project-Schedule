'use strict';

/**
 * Phase 7 retry, Dead Letter, manual recovery and security-boundary tests.
 *
 * The Phase 4 in-memory Apps Script runtime is reused only as a fake Google
 * runtime. All identifiers and failures are synthetic. No Google service,
 * Provider, network request, Trigger or credential is used.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const phase4Path = path.resolve(__dirname, 'phase4_independent_test.js');
const phase4Source = fs.readFileSync(phase4Path, 'utf8');
const marker = '\nconst tests = [];';
const markerIndex = phase4Source.indexOf(marker);
if (markerIndex < 0) {
  throw new Error('PHASE4_RUNTIME_MARKER_NOT_FOUND');
}
const exposure = `
globalThis.__phase7LocalFixture = {
  harness,
  sandbox,
  IndependentCalendarGateway,
  configureCalendar,
  makeClock,
  makeCountedPipeline,
  runVertical,
  seedEligibleTask,
  seedInformationMessage,
  messageRecord,
  outboxRecords
};
`;
const context = {
  require,
  __dirname,
  __filename: phase4Path,
  console,
  process: { stdout: { write: () => {} }, exitCode: 0 },
  Buffer,
  structuredClone,
  setTimeout,
  clearTimeout,
  Intl
};
vm.createContext(context);
vm.runInContext(
  phase4Source.slice(0, markerIndex) + exposure,
  context,
  { filename: 'phase7_local_fixture.js' }
);

const fixture = context.__phase7LocalFixture;
const { harness, sandbox } = fixture;
const Config = sandbox.WorkOsConfig;
const State = sandbox.WorkOsMessageStateRepository;
const Recovery = sandbox.WorkOsLogAndDeadLetter;
const AppError = sandbox.WorkOsAppError;
const FakeDate = sandbox.Date;

function sheetRecords(sheet) {
  const ids = sheet.cells[0];
  return sheet.cells.slice(Config.DATA_START_ROW - 1)
    .filter((row) => String(row[0] || ''))
    .map((row) => Object.fromEntries(
      ids.map((id, index) => [id, row[index]])
    ));
}

function errorRecords(spreadsheet) {
  return sheetRecords(
    spreadsheet.getSheetByName(Config.SHEETS.ERRORS)
  );
}

function stateRecord(spreadsheet, messageId) {
  return State.createContext(
    harness.stateSheet(spreadsheet)
  ).logicalRows.find((record) => record.message_id === messageId);
}

function failMessageFourTimes(spreadsheet, message, error) {
  const times = [
    '2026-07-24T00:00:00.000Z',
    '2026-07-24T00:05:00.000Z',
    '2026-07-24T00:20:00.000Z',
    '2026-07-24T01:20:00.000Z'
  ];
  const results = [];
  State.withLockedContext(harness.stateSheet(spreadsheet), (stateContext) => {
    times.forEach((iso, index) => {
      const now = new FakeDate(iso);
      const runId = `run_phase7_failure_${index}`;
      const claim = State.claimForResumeInContext(
        message.message_id,
        runId,
        stateContext,
        now
      );
      assert.strictEqual(claim.claimed, true);
      const failure = State.recordFailureInContext(
        message.message_id,
        runId,
        error,
        stateContext,
        now
      );
      Recovery.recordMessageError(
        error,
        {
          message_id: failure.record.message_id,
          thread_id: failure.record.thread_id,
          retry_count: failure.record.retry_count,
          next_retry_at: failure.record.next_retry_at,
          processing_status: failure.record.processing_status,
          resume_stage: State.checkpointStageForResumeStage(
            failure.record.resume_stage
          ),
          last_attempt_at: now
        },
        runId,
        spreadsheet
      );
      results.push(failure.record);
    });
  });
  return results;
}

const tests = [];
function test(id, body) {
  const startedAt = Date.now();
  try {
    harness.reset();
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

test('P7-L01_EXACT_SUBSYSTEMS_AND_CHECKPOINTS', () => {
  assert.deepStrictEqual(Array.from(Recovery.SUBSYSTEMS), [
    'GMAIL_SEARCH', 'GMAIL_READ', 'GMAIL_LABEL', 'PREPROCESS',
    'AI_REQUEST', 'AI_RESPONSE', 'TASK_UPSERT', 'REVIEW_APPLY',
    'CALENDAR_CREATE', 'CALENDAR_UPDATE', 'CALENDAR_DELETE',
    'STATE_WRITE', 'TRIGGER', 'DIAGNOSTIC'
  ]);
  assert.deepStrictEqual(Array.from(Recovery.CHECKPOINT_STAGES), [
    'CLAIMED', 'PREPROCESSED', 'CLASSIFIED', 'TASK_APPLIED',
    'CALENDAR_PENDING', 'DONE'
  ]);
});

test('P7-L02_RETRY_SCHEDULE_MAX_AND_BATCH_LIMIT', () => {
  assert.deepStrictEqual(Array.from(Config.RETRY_DELAYS_MINUTES), [5, 15, 60]);
  assert.strictEqual(Config.RETRY_MAX_ATTEMPTS, 4);
  assert.strictEqual(Config.RETRY_MAX_ITEMS_PER_RUN, 10);
  assert.strictEqual(Config.MANUAL_RETRY_MAX_SELECTED, 5);
});

test('P7-L03_ERROR_TAXONOMY_RETRYABLE_AND_NON_RETRYABLE', () => {
  [
    ['E_AI_TIMEOUT', 'AI_REQUEST', 'PROVIDER_TRANSIENT'],
    ['E_AI_RATE_LIMIT', 'AI_REQUEST', 'PROVIDER_TRANSIENT'],
    ['E_AI_UPSTREAM', 'AI_REQUEST', 'PROVIDER_TRANSIENT'],
    ['E_GMAIL_FETCH', 'GMAIL_SEARCH', 'SERVICE_TRANSIENT'],
    ['E_CALENDAR_SYNC', 'CALENDAR_CREATE', 'SERVICE_TRANSIENT'],
    ['E_LOCK_TIMEOUT', 'STATE_WRITE', 'SERVICE_TRANSIENT']
  ].forEach(([code, subsystem, category]) => {
    const policy = Recovery.retryPolicy(
      new AppError(code, subsystem, true, 'synthetic'),
      { subsystem }
    );
    assert.strictEqual(policy.retryable, true, code);
    assert.strictEqual(policy.error_category, category, code);
    assert.deepStrictEqual(
      Array.from(policy.retry_delays_minutes),
      [5, 15, 60]
    );
    assert.strictEqual(policy.max_attempts, 4);
  });
  [
    ['E_AUTH_REQUIRED', 'AI_REQUEST', 'AUTH_CONFIGURATION'],
    ['E_AI_PERMISSION', 'AI_REQUEST', 'PERMISSION_POLICY'],
    ['E_AI_SCHEMA', 'AI_RESPONSE', 'INVALID_RESPONSE'],
    ['E_SCHEMA_MISSING_COLUMN', 'STATE_WRITE', 'DATA_OR_SCHEMA']
  ].forEach(([code, subsystem, category]) => {
    const policy = Recovery.retryPolicy(
      new AppError(code, subsystem, false, 'synthetic'),
      { subsystem }
    );
    assert.strictEqual(policy.retryable, false, code);
    assert.strictEqual(policy.error_category, category, code);
  });
});

test('P7-L04_PROVIDER_WIDE_SUPPRESSION_IS_BOUNDED_AND_FAILS_CLOSED', () => {
  const props = sandbox.PropertiesService.getScriptProperties();
  const now = new FakeDate('2026-07-24T00:00:00.000Z');
  const noted = Recovery.noteProviderFailure(
    new AppError('E_AI_RATE_LIMIT', 'AI_REQUEST', true, 'synthetic'),
    props,
    now
  );
  assert.strictEqual(noted.suppressed, true);
  assert.strictEqual(
    Recovery.providerSuppressionStatus(props, now).active,
    true
  );
  assert.strictEqual(
    Recovery.providerSuppressionStatus(
      props,
      new FakeDate('2026-07-24T00:05:01.000Z')
    ).active,
    false
  );
  props.setProperty(Config.PROPERTIES.AI_PROVIDER_SUPPRESS_UNTIL, 'invalid');
  const invalid = Recovery.providerSuppressionStatus(props, now);
  assert.strictEqual(invalid.active, true);
  assert.strictEqual(invalid.invalid_state, true);
});

test('P7-L05_SYSTEM_FAILURES_UPSERT_AND_DEAD_AFTER_FOUR_ATTEMPTS', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  const failure = new AppError(
    'E_GMAIL_FETCH',
    'GMAIL_AUTOMATIC_SEARCH',
    true,
    'synthetic service detail'
  );
  const times = [
    '2026-07-24T00:00:00.000Z',
    '2026-07-24T00:05:00.000Z',
    '2026-07-24T00:20:00.000Z',
    '2026-07-24T01:20:00.000Z'
  ];
  times.forEach((iso, index) => {
    Recovery.recordOperationalError(
      failure,
      {
        subsystem: 'GMAIL_SEARCH',
        resume_stage: 'CLAIMED',
        last_attempt_at: new FakeDate(iso)
      },
      `run_system_${index}`,
      spreadsheet
    );
  });
  const records = errorRecords(spreadsheet);
  assert.strictEqual(records.length, 1);
  assert.strictEqual(records[0].status, 'DEAD');
  assert.strictEqual(records[0].attempt_count, 4);
  assert.match(records[0].dead_letter_id, /^dl_[0-9a-f]{32}$/);
  assert.match(records[0].safe_reference, /^sysref_[0-9a-f]{64}$/);
  assert.strictEqual(records[0].next_retry_at, '');
});

test('P7-L06_MESSAGE_RETRY_5_15_60_THEN_DEAD_WITH_ONE_SAFE_ROW', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  const message = fixture.seedInformationMessage(spreadsheet, {
    message_id: 'synthetic-phase7-dead-message',
    thread_id: 'synthetic-phase7-dead-thread',
    stable_thread_key: 'root:synthetic-phase7-dead-thread'
  });
  const rawId = message.message_id;
  const failure = new AppError(
    'E_AI_TIMEOUT',
    'AI_REQUEST',
    true,
    'Authorization: Bearer SYNTHETIC_SECRET_MUST_NOT_PERSIST'
  );
  const failures = failMessageFourTimes(spreadsheet, message, failure);
  assert.deepStrictEqual(
    failures.slice(0, 3).map((record) => record.retry_count),
    [1, 2, 3]
  );
  assert.deepStrictEqual(
    failures.slice(0, 3).map((record, index) => (
      record.next_retry_at.getTime() -
        new FakeDate([
          '2026-07-24T00:00:00.000Z',
          '2026-07-24T00:05:00.000Z',
          '2026-07-24T00:20:00.000Z'
        ][index]).getTime()
    ) / 60000),
    [5, 15, 60]
  );
  assert.strictEqual(failures[3].processing_status, 'DEAD');
  const records = errorRecords(spreadsheet);
  assert.strictEqual(records.length, 1);
  assert.strictEqual(records[0].status, 'DEAD');
  assert.strictEqual(records[0].attempt_count, 4);
  assert.strictEqual(records[0].resume_stage, 'PREPROCESSED');
  assert.match(records[0].source_message_id, /^msgref_[0-9a-f]{64}$/);
  assert.match(records[0].source_thread_id, /^thrref_[0-9a-f]{64}$/);
  assert.strictEqual(JSON.stringify(records).includes(rawId), false);
  assert.strictEqual(
    JSON.stringify(records).includes('SYNTHETIC_SECRET_MUST_NOT_PERSIST'),
    false
  );
});

test('P7-L07_MANUAL_RETRY_IS_IDEMPOTENT_AND_USES_INTERNAL_ID', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  const message = fixture.seedInformationMessage(spreadsheet, {
    message_id: 'synthetic-phase7-manual-message',
    thread_id: 'synthetic-phase7-manual-thread',
    stable_thread_key: 'root:synthetic-phase7-manual-thread'
  });
  failMessageFourTimes(
    spreadsheet,
    message,
    new AppError('E_AI_TIMEOUT', 'AI_REQUEST', true, 'synthetic')
  );
  const dead = errorRecords(spreadsheet)[0];
  const queued = Recovery.retryDeadLetterById(dead.dead_letter_id, {
    spreadsheet,
    readiness_checker: () => ({ ready: true, reasons: [] }),
    now: new FakeDate('2026-07-24T01:21:00.000Z')
  });
  assert.strictEqual(queued.status, 'QUEUED');
  assert.strictEqual(queued.safe_reference.includes(message.message_id), false);
  assert.strictEqual(
    stateRecord(spreadsheet, message.message_id).processing_status,
    'RETRY'
  );
  assert.strictEqual(errorRecords(spreadsheet)[0].status, 'RETRY_QUEUED');
  const replay = Recovery.retryDeadLetterById(dead.dead_letter_id, {
    spreadsheet,
    readiness_checker: () => ({ ready: true, reasons: [] }),
    now: new FakeDate('2026-07-24T01:22:00.000Z')
  });
  assert.strictEqual(replay.status, 'NOOP');
  assert.strictEqual(replay.reason, 'ALREADY_QUEUED');
});

test('P7-L08_MANUAL_RETRY_REFUSES_UNRESOLVED_CONFIGURATION', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  const message = fixture.seedInformationMessage(spreadsheet, {
    message_id: 'synthetic-phase7-refused-message'
  });
  failMessageFourTimes(
    spreadsheet,
    message,
    new AppError('E_AI_TIMEOUT', 'AI_REQUEST', true, 'synthetic')
  );
  const dead = errorRecords(spreadsheet)[0];
  const result = Recovery.retryDeadLetterById(dead.dead_letter_id, {
    spreadsheet,
    readiness_checker: () => ({
      ready: false,
      reasons: ['PROVIDER_NOT_CONFIGURED']
    }),
    now: new FakeDate('2026-07-24T01:21:00.000Z')
  });
  assert.strictEqual(result.status, 'REFUSED');
  assert.strictEqual(
    stateRecord(spreadsheet, message.message_id).processing_status,
    'DEAD'
  );
  assert.strictEqual(errorRecords(spreadsheet)[0].status, 'DEAD');
});

test('P7-L09_NON_RETRYABLE_DEAD_LETTER_CANNOT_BE_FORCED', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  const message = fixture.seedInformationMessage(spreadsheet, {
    message_id: 'synthetic-phase7-schema-message'
  });
  State.withLockedContext(harness.stateSheet(spreadsheet), (stateContext) => {
    const runId = 'run_phase7_schema';
    State.claimForResumeInContext(
      message.message_id,
      runId,
      stateContext,
      new FakeDate('2026-07-24T00:00:00.000Z')
    );
    const failure = State.recordFailureInContext(
      message.message_id,
      runId,
      new AppError(
        'E_AI_SCHEMA',
        'AI_RESPONSE',
        false,
        'synthetic'
      ),
      stateContext,
      new FakeDate('2026-07-24T00:00:01.000Z')
    );
    Recovery.recordMessageError(
      new AppError('E_AI_SCHEMA', 'AI_RESPONSE', false, 'synthetic'),
      {
        message_id: failure.record.message_id,
        thread_id: failure.record.thread_id,
        retry_count: failure.record.retry_count,
        processing_status: failure.record.processing_status,
        resume_stage: State.checkpointStageForResumeStage(
          failure.record.resume_stage
        )
      },
      runId,
      spreadsheet
    );
  });
  const dead = errorRecords(spreadsheet)[0];
  assert.throws(
    () => Recovery.retryDeadLetterById(dead.dead_letter_id, {
      spreadsheet,
      readiness_checker: () => ({ ready: true })
    }),
    (error) => error && error.code === 'E_DEAD_LETTER_NON_RETRYABLE'
  );
});

test('P7-L09B_TRANSIENT_NAMED_BUT_EXPLICITLY_NON_RETRYABLE_IS_REFUSED',
  () => {
    const spreadsheet = harness.makeOperationalSpreadsheet();
    const message = fixture.seedInformationMessage(spreadsheet, {
      message_id: 'synthetic-phase7-nonretryable-fetch'
    });
    State.withLockedContext(harness.stateSheet(spreadsheet), (stateContext) => {
      const runId = 'run_phase7_nonretryable_fetch';
      State.claimForResumeInContext(
        message.message_id,
        runId,
        stateContext,
        new FakeDate('2026-07-24T00:00:00.000Z')
      );
      const failureError = new AppError(
        'E_GMAIL_FETCH',
        'GMAIL_READ',
        false,
        'synthetic missing message'
      );
      const failure = State.recordFailureInContext(
        message.message_id,
        runId,
        failureError,
        stateContext,
        new FakeDate('2026-07-24T00:00:01.000Z')
      );
      Recovery.recordMessageError(
        failureError,
        {
          subsystem: 'GMAIL_READ',
          message_id: failure.record.message_id,
          thread_id: failure.record.thread_id,
          retry_count: failure.record.retry_count,
          processing_status: failure.record.processing_status,
          resume_stage: 'CLAIMED'
        },
        runId,
        spreadsheet
      );
    });
    const dead = errorRecords(spreadsheet)[0];
    assert.strictEqual(dead.error_category, 'SERVICE_TRANSIENT');
    assert.strictEqual(dead.next_action, 'RESOLVE_CONFIGURATION_OR_DATA');
    assert.throws(
      () => Recovery.retryDeadLetterById(dead.dead_letter_id, {
        spreadsheet,
        readiness_checker: () => ({ ready: true })
      }),
      (error) => error && error.code === 'E_DEAD_LETTER_NON_RETRYABLE'
    );
  });

test('P7-L10_RESOLUTION_AND_THREAD_AGGREGATION_ARE_IDEMPOTENT', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  const first = fixture.seedInformationMessage(spreadsheet, {
    message_id: 'synthetic-phase7-thread-a',
    thread_id: 'synthetic-phase7-shared-thread',
    stable_thread_key: 'root:synthetic-phase7-shared-thread'
  });
  const second = fixture.seedInformationMessage(spreadsheet, {
    message_id: 'synthetic-phase7-thread-b',
    thread_id: 'synthetic-phase7-shared-thread',
    stable_thread_key: 'root:synthetic-phase7-shared-thread'
  });
  [first, second].forEach((message, index) => {
    State.withLockedContext(harness.stateSheet(spreadsheet), (stateContext) => {
      const runId = `run_thread_${index}`;
      State.claimForResumeInContext(
        message.message_id,
        runId,
        stateContext,
        new FakeDate('2026-07-24T00:00:00.000Z')
      );
      const failure = State.recordFailureInContext(
        message.message_id,
        runId,
        new AppError('E_AI_TIMEOUT', 'AI_REQUEST', true, 'synthetic'),
        stateContext,
        new FakeDate('2026-07-24T00:00:01.000Z')
      );
      Recovery.recordMessageError(
        new AppError('E_AI_TIMEOUT', 'AI_REQUEST', true, 'synthetic'),
        {
          message_id: failure.record.message_id,
          thread_id: failure.record.thread_id,
          retry_count: failure.record.retry_count,
          next_retry_at: failure.record.next_retry_at,
          processing_status: failure.record.processing_status,
          resume_stage: State.checkpointStageForResumeStage(
            failure.record.resume_stage
          )
        },
        runId,
        spreadsheet
      );
    });
  });
  assert.strictEqual(
    Recovery.hasUnresolvedThreadError(
      'synthetic-phase7-shared-thread',
      spreadsheet
    ),
    true
  );
  assert.strictEqual(
    Recovery.resolveErrorsForMessage(
      first.message_id,
      spreadsheet,
      new FakeDate('2026-07-24T00:30:00.000Z')
    ).resolved_count,
    1
  );
  assert.strictEqual(
    Recovery.hasUnresolvedThreadError(
      'synthetic-phase7-shared-thread',
      spreadsheet
    ),
    true
  );
  assert.strictEqual(
    Recovery.resolveErrorsForMessage(
      second.message_id,
      spreadsheet,
      new FakeDate('2026-07-24T00:31:00.000Z')
    ).resolved_count,
    1
  );
  assert.strictEqual(
    Recovery.resolveErrorsForMessage(
      second.message_id,
      spreadsheet,
      new FakeDate('2026-07-24T00:32:00.000Z')
    ).resolved_count,
    0
  );
  assert.strictEqual(
    Recovery.hasUnresolvedThreadError(
      'synthetic-phase7-shared-thread',
      spreadsheet
    ),
    false
  );
});

test('P7-L11_ERROR_COUNTS_CONTAIN_NO_IDENTIFIERS', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  Recovery.recordOperationalError(
    new AppError('E_GMAIL_FETCH', 'GMAIL_AUTOMATIC_SEARCH', true, 'synthetic'),
    {
      subsystem: 'GMAIL_SEARCH',
      last_attempt_at: new FakeDate('2026-07-24T00:00:00.000Z')
    },
    'run_counts',
    spreadsheet
  );
  const counts = Recovery.operationalCounts(
    spreadsheet,
    new FakeDate('2026-07-24T00:06:00.000Z')
  );
  assert.deepStrictEqual(
    Object.keys(counts).sort(),
    [
      'dead_letter_count',
      'due_retry_count',
      'retry_queued_count',
      'unresolved_error_count'
    ]
  );
  assert.strictEqual(counts.unresolved_error_count, 1);
  assert.strictEqual(counts.due_retry_count, 1);
});

test('P7-L12_DEAD_LETTER_SCHEMA_HAS_ALL_REQUIRED_FIELDS', () => {
  const ids = Array.from(
    sandbox.WorkOsSchemas.getInternalIds(Config.SHEETS.ERRORS)
  );
  [
    'dead_letter_id', 'subsystem', 'error_category', 'safe_reference',
    'message_state_id', 'task_id', 'resume_stage', 'attempt_count',
    'last_attempt_at', 'next_action', 'status', 'resolved_at',
    'created_at', 'updated_at'
  ].forEach((id) => assert(ids.includes(id), id));
});

test('P7-L13_SELECTION_LIMIT_FAILS_BEFORE_RETRY', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  const errorSheet = spreadsheet.getSheetByName(Config.SHEETS.ERRORS);
  const range = {
    getSheet: () => errorSheet,
    getNumRows: () => 6,
    getRow: () => Config.DATA_START_ROW
  };
  assert.throws(
    () => Recovery.retrySelectedDeadLetters({ spreadsheet, range }),
    (error) => error && error.code === 'E_DEAD_LETTER_SELECTION_LIMIT'
  );
});

test('P7-L14_SOURCE_SECURITY_AND_SIDE_EFFECT_GUARDRAILS', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '..', 'apps-script-v2', '13_LogAndDeadLetter.gs'),
    'utf8'
  );
  const worker = fs.readFileSync(
    path.resolve(__dirname, '..', 'apps-script-v2', '18_Worker.gs'),
    'utf8'
  );
  const diagnostics = fs.readFileSync(
    path.resolve(__dirname, '..', 'apps-script-v2', '16_Diagnostics.gs'),
    'utf8'
  );
  assert.strictEqual(/\bUrlFetchApp\b/.test(source + worker + diagnostics), false);
  assert.strictEqual(
    /\.(?:setValue|setValues|clear|insert|delete|append|protect)\s*\(/.test(
      diagnostics
    ),
    false
  );
  assert.strictEqual(/Dashboard|繝繝・す繝･繝懊・繝・.test(worker), false);
});

test('P7-L15_CALENDAR_DEAD_LETTER_RESUMES_WITHOUT_AI_TASK_OR_EVENT_DUPLICATE',
  () => {
    const spreadsheet = harness.makeOperationalSpreadsheet();
    harness.setActiveSpreadsheet(spreadsheet);
    const stableThreadKey = 'root:synthetic-phase7-calendar-recovery';
    const threadId = 'synthetic-phase7-calendar-thread';
    const task = fixture.seedEligibleTask(spreadsheet, {
      suffix: 'phase7-calendar-recovery',
      stable_thread_key: stableThreadKey,
      thread_id: threadId
    });
    const message = fixture.seedInformationMessage(spreadsheet, {
      message_id: 'synthetic-phase7-calendar-message',
      stable_thread_key: stableThreadKey,
      thread_id: threadId
    });
    const gateway = new fixture.IndependentCalendarGateway({
      fail_insert_count: 4
    });
    fixture.configureCalendar(gateway);
    const clock = fixture.makeClock('2026-07-24T00:00:00.000Z');
    const pipeline = fixture.makeCountedPipeline(message);

    [0, 6, 16, 61].forEach((advanceMinutes, index) => {
      if (advanceMinutes) {
        clock.advanceMinutes(advanceMinutes);
      }
      const run = fixture.runVertical(
        spreadsheet,
        message,
        gateway,
        clock,
        { pipeline }
      ).result;
      assert.strictEqual(run.status, 'FAILED', `attempt ${index + 1}`);
    });
    assert.strictEqual(
      fixture.messageRecord(spreadsheet, message.message_id)
        .processing_status,
      'DEAD'
    );
    assert.strictEqual(fixture.outboxRecords(spreadsheet)[0].status, 'DEAD');
    const dead = errorRecords(spreadsheet);
    assert.strictEqual(dead.length, 1);
    assert.strictEqual(dead[0].status, 'DEAD');
    assert.strictEqual(dead[0].subsystem, 'CALENDAR_CREATE');
    assert.strictEqual(dead[0].error_category, 'SERVICE_TRANSIENT');
    assert.strictEqual(dead[0].task_id, task.task_id);

    const queued = Recovery.retryDeadLetterById(dead[0].dead_letter_id, {
      spreadsheet,
      readiness_checker: () => ({ ready: true, reasons: [] }),
      now: clock.now()
    });
    assert.strictEqual(queued.status, 'QUEUED');
    assert.strictEqual(
      fixture.messageRecord(spreadsheet, message.message_id)
        .processing_status,
      'RETRY'
    );
    assert.strictEqual(fixture.outboxRecords(spreadsheet)[0].status, 'RETRY');

    clock.advanceMinutes(1);
    const recovered = fixture.runVertical(
      spreadsheet,
      message,
      gateway,
      clock,
      { pipeline }
    ).result;
    assert.strictEqual(recovered.status, 'COMPLETE');
    assert.strictEqual(gateway.events.size, 1);
    assert.strictEqual(gateway.calls.eventInsert, 5);
    assert.strictEqual(pipeline.counts.classify, 1);
    assert.strictEqual(pipeline.gateway.calls.refetch, 1);
    assert.strictEqual(
      harness.allTasks(harness.taskSheet(spreadsheet)).length,
      1
    );
    assert.strictEqual(errorRecords(spreadsheet)[0].status, 'RESOLVED');
  });

test('P7-L16_SHARED_ERROR_CONTEXT_EXPANDS_FULL_SHEET_ONLY_ONCE', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  const errorSheet = spreadsheet.getSheetByName(Config.SHEETS.ERRORS);
  const ids = errorSheet.cells[0];
  const fullRows = Array.from(
    { length: errorSheet.getMaxRows() - Config.DATA_START_ROW + 1 },
    (_, index) => ids.map(
      (id) => id === 'error_id'
        ? `err_${String(index).padStart(32, '0')}`
        : ''
    )
  );
  errorSheet.getRange(
    Config.DATA_START_ROW,
    1,
    fullRows.length,
    ids.length
  ).setValues(fullRows);
  errorSheet.insertedRows = 0;
  const errorContext = Recovery.createErrorContext(spreadsheet);
  [
    ['tsk_synthetic_expansion_a', 'E_AI_TIMEOUT', 'AI_REQUEST'],
    ['tsk_synthetic_expansion_b', 'E_GMAIL_FETCH', 'GMAIL_SEARCH']
  ].forEach(([taskId, code, stage]) => {
    Recovery.recordOperationalError(
      new AppError(code, stage, true, 'synthetic'),
      {
        task_id: taskId,
        subsystem: stage,
        last_attempt_at: new FakeDate('2026-07-24T20:00:00.000Z')
      },
      'run_synthetic_expansion',
      spreadsheet,
      errorContext
    );
  });
  assert.strictEqual(errorSheet.getMaxRows(), 200);
  assert.strictEqual(errorSheet.insertedRows, Config.ROW_EXPANSION_UNIT);
  assert.strictEqual(
    String(errorSheet.cells[100][0]).startsWith('err_'),
    true
  );
  assert.strictEqual(
    String(errorSheet.cells[101][0]).startsWith('err_'),
    true
  );
});

test('P7-L17_SYSTEM_RETRY_REJECTS_NON_RETRYABLE_ROW_CONTRADICTION', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  Recovery.recordOperationalError(
    new AppError('E_GMAIL_FETCH', 'GMAIL_SEARCH', true, 'synthetic'),
    {
      subsystem: 'GMAIL_SEARCH',
      last_attempt_at: new FakeDate('2026-07-24T21:00:00.000Z')
    },
    'run_synthetic_system_contradiction',
    spreadsheet
  );
  const errorSheet = spreadsheet.getSheetByName(Config.SHEETS.ERRORS);
  const ids = errorSheet.cells[0];
  errorSheet.getRange(
    Config.DATA_START_ROW,
    ids.indexOf('next_action') + 1,
    1,
    1
  ).setValues([['RESOLVE_CONFIGURATION_OR_DATA']]);
  const status = Recovery.systemRetryStatus(
    ['GMAIL_SEARCH'],
    spreadsheet,
    new FakeDate('2026-07-24T21:06:00.000Z')
  );
  assert.strictEqual(status.allowed, false);
  assert.strictEqual(status.reason, 'SYSTEM_RETRY_STATE_INVALID');
  assert.strictEqual(status.invalid_count, 1);
});

const summary = {
  phase: 7,
  suite: 'retry_dead_letter_local',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_provider_connection: 'NOT_EXECUTED',
  google_workspace: 'NOT_EXECUTED',
  passed: tests.filter((item) => item.status === 'PASS').length,
  failed: tests.filter((item) => item.status === 'FAIL').length,
  tests
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed > 0) {
  process.exitCode = 1;
}

