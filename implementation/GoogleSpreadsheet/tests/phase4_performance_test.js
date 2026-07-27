'use strict';

/**
 * Independent Phase 4 performance and reliability tests.
 *
 * This suite reuses only the fake Apps Script runtime declared before the
 * assertion list in phase4_independent_test.js. It performs no Google
 * Workspace call and no network request.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repositoryRoot = path.resolve(__dirname, '..');
const appsScriptRoot = path.join(repositoryRoot, 'apps-script-v2');

function loadIndependentRuntime() {
  const source = fs.readFileSync(
    path.join(__dirname, 'phase4_independent_test.js'),
    'utf8'
  );
  const marker = '\nconst tests = [];';
  const markerIndex = source.indexOf(marker);
  assert.notStrictEqual(
    markerIndex,
    -1,
    'Phase 4 independent runtime boundary was not found'
  );
  const runtimePrefix = source.slice(0, markerIndex);
  const factory = new Function(
    'require',
    '__dirname',
    'structuredClone',
    'Buffer',
    'Intl',
    `${runtimePrefix}
return {
  sandbox,
  harness,
  IndependentCalendarGateway,
  scriptProperties,
  configureCalendar,
  syncSheet,
  messageRecord,
  outboxRecords,
  seedEligibleTask,
  seedInformationMessage,
  makeCountedPipeline,
  fixedBudget,
  makeClock,
  runVertical
};`
  );
  return factory(require, __dirname, structuredClone, Buffer, Intl);
}

const runtime = loadIndependentRuntime();
const sandbox = runtime.sandbox;
const harness = runtime.harness;

function iso(value) {
  return value instanceof Date ? value.toISOString() : String(value || '');
}

function businessSnapshot(task) {
  const fields = [
    'task_id',
    'origin_key',
    'task_title',
    'status',
    'needs_review',
    'review_state',
    'completed',
    'excluded',
    'due_date',
    'suggested_due_date',
    'deadline_basis',
    'priority',
    'waiting_for_reply',
    'calendar_sync_mode',
    'calendar_category',
    'calendar_importance',
    'comment',
    'sender',
    'subject',
    'source_email',
    'source_message_id',
    'source_thread_id',
    'stable_thread_key',
    'source_action_index',
    'pending_action_type',
    'pending_changes_json',
    'manual_fields',
    'created_at'
  ];
  const result = {};
  fields.forEach((field) => {
    const value = task[field];
    result[field] = value instanceof Date
      ? value.toISOString()
      : JSON.parse(JSON.stringify(value));
  });
  return result;
}

function taskById(spreadsheet, taskId) {
  return harness.readTask(harness.taskSheet(spreadsheet), taskId);
}

function onlyCalendarManagementWrites(sheet) {
  const schema = sandbox.WorkOsSchemas.getSheetSchema(
    sandbox.WorkOsConfig.SHEETS.TASKS
  );
  const allowed = new Set([
    'calendar_event_id',
    'calendar_sync_status',
    'last_calendar_sync_at',
    'row_version',
    'updated_at'
  ]);
  return sheet.writeLog.every((write) => {
    if (write.row < sandbox.WorkOsConfig.DATA_START_ROW) {
      return true;
    }
    for (
      let column = write.column;
      column < write.column + write.columnCount;
      column += 1
    ) {
      if (!allowed.has(schema[column - 1].id)) {
        return false;
      }
    }
    return true;
  });
}

function assertRetryState(
  spreadsheet,
  messageId,
  expectedStatus,
  expectedRetryCount,
  expectedNextRetryIso
) {
  const message = runtime.messageRecord(spreadsheet, messageId);
  const outbox = runtime.outboxRecords(spreadsheet);
  assert.strictEqual(outbox.length, 1, 'Outbox must stay unique per Task');
  assert.strictEqual(message.processing_status, expectedStatus);
  assert.strictEqual(message.retry_count, expectedRetryCount);
  assert.strictEqual(outbox[0].status, expectedStatus);
  assert.strictEqual(outbox[0].retry_count, expectedRetryCount);
  assert.strictEqual(iso(message.next_retry_at), expectedNextRetryIso);
  assert.strictEqual(iso(outbox[0].next_retry_at), expectedNextRetryIso);
}

const tests = [];

function test(id, body) {
  const startedAt = Date.now();
  try {
    body();
    tests.push({
      id,
      status: 'PASS',
      duration_ms: Date.now() - startedAt
    });
  } catch (error) {
    tests.push({
      id,
      status: 'FAIL',
      duration_ms: Date.now() - startedAt,
      safe_message: sandbox.WorkOsUtilities.redact(error.message)
    });
  } finally {
    harness.reset();
  }
}

test('P4-P01_VERTICAL_RETRY_CHAIN_5_15_60_THEN_DEAD', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  harness.setActiveSpreadsheet(spreadsheet);
  const stableThreadKey = 'root:phase4-performance-retry';
  const threadId = 'synthetic-thread-performance-retry';
  const task = runtime.seedEligibleTask(spreadsheet, {
    suffix: 'performance-retry',
    stable_thread_key: stableThreadKey,
    thread_id: threadId
  });
  const message = runtime.seedInformationMessage(spreadsheet, {
    message_id: 'synthetic-message-performance-retry',
    stable_thread_key: stableThreadKey,
    thread_id: threadId
  });
  const calendarGateway = new runtime.IndependentCalendarGateway({
    fail_insert_count: 4
  });
  runtime.configureCalendar(calendarGateway);
  const clock = runtime.makeClock('2026-07-24T00:20:00.000Z');
  const pipeline = runtime.makeCountedPipeline(message);
  const taskSheet = harness.taskSheet(spreadsheet);

  const first = runtime.runVertical(
    spreadsheet,
    message,
    calendarGateway,
    clock,
    { pipeline }
  ).result;
  assert.strictEqual(first.status, 'FAILED');
  assert.strictEqual(first.calendar_job_count, 1);
  assert.strictEqual(calendarGateway.calls.eventInsert, 1);
  assertRetryState(
    spreadsheet,
    message.message_id,
    'RETRY',
    1,
    '2026-07-24T00:25:00.000Z'
  );
  const stableBusinessState = businessSnapshot(
    taskById(spreadsheet, task.task_id)
  );
  assert.deepStrictEqual(
    {
      refetch: pipeline.gateway.calls.refetch,
      preprocess: pipeline.counts.preprocess,
      classify: pipeline.counts.classify
    },
    { refetch: 1, preprocess: 1, classify: 1 }
  );

  clock.advanceMinutes(4);
  taskSheet.writeLog = [];
  const tooEarly = runtime.runVertical(
    spreadsheet,
    message,
    calendarGateway,
    clock,
    { pipeline }
  ).result;
  assert.strictEqual(tooEarly.processed_count, 0);
  assert.strictEqual(tooEarly.calendar_job_count, 0);
  assert.strictEqual(calendarGateway.calls.eventInsert, 1);
  assert.strictEqual(taskSheet.writeLog.length, 0);

  const retryCases = [
    {
      advance_minutes: 1,
      status: 'RETRY',
      retry_count: 2,
      next_retry_at: '2026-07-24T00:40:00.000Z',
      insert_calls: 2
    },
    {
      advance_minutes: 15,
      status: 'RETRY',
      retry_count: 3,
      next_retry_at: '2026-07-24T01:40:00.000Z',
      insert_calls: 3
    },
    {
      advance_minutes: 60,
      status: 'DEAD',
      retry_count: 3,
      next_retry_at: '',
      insert_calls: 4
    }
  ];

  retryCases.forEach((expected) => {
    clock.advanceMinutes(expected.advance_minutes);
    taskSheet.writeLog = [];
    const result = runtime.runVertical(
      spreadsheet,
      message,
      calendarGateway,
      clock,
      { pipeline }
    ).result;
    assert.strictEqual(result.status, 'FAILED');
    assert.strictEqual(result.calendar_job_count, 1);
    assert.strictEqual(
      calendarGateway.calls.eventInsert,
      expected.insert_calls
    );
    assertRetryState(
      spreadsheet,
      message.message_id,
      expected.status,
      expected.retry_count,
      expected.next_retry_at
    );
    assert.deepStrictEqual(
      businessSnapshot(taskById(spreadsheet, task.task_id)),
      stableBusinessState,
      'Calendar retry rewrote a Task business field'
    );
    assert.strictEqual(
      onlyCalendarManagementWrites(taskSheet),
      true,
      'Calendar retry wrote outside Calendar-owned management fields'
    );
    assert.deepStrictEqual(
      {
        refetch: pipeline.gateway.calls.refetch,
        preprocess: pipeline.counts.preprocess,
        classify: pipeline.counts.classify
      },
      { refetch: 1, preprocess: 1, classify: 1 },
      'Calendar retry reran Gmail/preprocess/AI'
    );
  });
});

test('P4-P02_EDIT_HANDLER_READS_ONLY_SELECTED_ROWS', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  harness.setActiveSpreadsheet(spreadsheet);
  const first = runtime.seedEligibleTask(spreadsheet, {
    suffix: 'bounded-edit-a',
    stable_thread_key: 'root:bounded-edit-a',
    thread_id: 'synthetic-bounded-edit-a'
  });
  runtime.seedEligibleTask(spreadsheet, {
    suffix: 'bounded-edit-b',
    stable_thread_key: 'root:bounded-edit-b',
    thread_id: 'synthetic-bounded-edit-b'
  });
  const taskSheet = harness.taskSheet(spreadsheet);
  const context = sandbox.WorkOsTaskRepository.createContext(taskSheet);
  const row = context.byTaskId[first.task_id];
  const map = sandbox.WorkOsSchemas.buildColumnMapFromIds(
    sandbox.WorkOsSchemas.getInternalIds(
      sandbox.WorkOsConfig.SHEETS.TASKS
    )
  );
  taskSheet.getRange(row, map.task_title + 1, 1, 1).setValues([
    ['Synthetic bounded edit']
  ]);
  taskSheet.readLog = [];
  taskSheet.writeLog = [];
  const lockAttemptsBefore = harness.getLockAttemptCount();

  const result = sandbox.WorkOsEditHandler.handle({
    range: taskSheet.getRange(row, map.task_title + 1, 1, 1)
  });

  assert.strictEqual(result.processed_rows, 1);
  assert.strictEqual(
    harness.getLockAttemptCount() - lockAttemptsBefore,
    3,
    'EditHandler must use three sequential, non-nested locks'
  );
  const taskDataReads = taskSheet.readLog.filter(
    (read) => read.row >= sandbox.WorkOsConfig.DATA_START_ROW
  );
  assert.strictEqual(taskDataReads.length <= 3, true);
  assert.strictEqual(
    taskDataReads.every((read) => read.row === row && read.rowCount === 1),
    true,
    'EditHandler read an unselected Task row'
  );
  assert.strictEqual(
    taskDataReads.some((read) => read.rowCount > 1),
    false,
    'EditHandler performed a full Task-table read'
  );
});

test('P4-P03_STANDALONE_USES_BOUNDED_CAS_SCANS_AND_RUNS_ONE_JOB', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  harness.setActiveSpreadsheet(spreadsheet);
  runtime.seedEligibleTask(spreadsheet, {
    suffix: 'bounded-standalone-a',
    stable_thread_key: 'root:bounded-standalone-a',
    thread_id: 'synthetic-bounded-standalone-a'
  });
  runtime.seedEligibleTask(spreadsheet, {
    suffix: 'bounded-standalone-b',
    stable_thread_key: 'root:bounded-standalone-b',
    thread_id: 'synthetic-bounded-standalone-b'
  });
  const taskSheet = harness.taskSheet(spreadsheet);
  const outboxSheet = runtime.syncSheet(spreadsheet);
  taskSheet.readLog = [];
  taskSheet.writeLog = [];
  outboxSheet.readLog = [];
  outboxSheet.writeLog = [];
  const calendarGateway = new runtime.IndependentCalendarGateway();
  runtime.configureCalendar(calendarGateway);
  const clock = runtime.makeClock('2026-07-24T00:20:00.000Z');
  const lockAttemptsBefore = harness.getLockAttemptCount();

  const result = sandbox.WorkOsWorker.syncPendingCalendarJobs({
    spreadsheet,
    calendar_gateway: calendarGateway,
    calendar_properties: runtime.scriptProperties(),
    instance_id: calendarGateway.instanceId,
    now: clock.now,
    budget: runtime.fixedBudget(false)
  });

  assert.strictEqual(result.processed_count, 1);
  assert.strictEqual(calendarGateway.calls.eventInsert, 1);
  assert.strictEqual(
    harness.getLockAttemptCount() - lockAttemptsBefore >= 3,
    true,
    'Standalone Calendar sync must use bounded claim/prepare/commit locks'
  );
  const taskFullReads = taskSheet.readLog.filter(
    (read) =>
      read.row === sandbox.WorkOsConfig.DATA_START_ROW &&
      read.rowCount > 1
  );
  const outboxFullReads = outboxSheet.readLog.filter(
    (read) =>
      read.row === sandbox.WorkOsConfig.DATA_START_ROW &&
      read.rowCount > 1
  );
  assert.strictEqual(
    taskFullReads.length <= 4,
    true,
    'Task index scans exceeded the bounded claim/prepare/commit design'
  );
  assert.strictEqual(
    outboxFullReads.length <= 3,
    true,
    'Outbox index scans exceeded the bounded claim/prepare/commit design'
  );
  assert.strictEqual(
    taskSheet.readLog
      .filter((read) => read.row >= sandbox.WorkOsConfig.DATA_START_ROW)
      .every((read) => (
        read.rowCount === 1 ||
        (read.row === sandbox.WorkOsConfig.DATA_START_ROW &&
          read.rowCount > 1)
      )),
    true
  );
  assert.strictEqual(
    outboxSheet.readLog
      .filter((read) => read.row >= sandbox.WorkOsConfig.DATA_START_ROW)
      .every((read) => (
        read.rowCount === 1 ||
        (read.row === sandbox.WorkOsConfig.DATA_START_ROW &&
          read.rowCount > 1)
      )),
    true,
    'Outbox used an unexpected read shape'
  );
});

test('P4-P04_BUDGET_STOPS_BEFORE_CALENDAR_API', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  harness.setActiveSpreadsheet(spreadsheet);
  runtime.seedEligibleTask(spreadsheet, {
    suffix: 'budget-stop',
    stable_thread_key: 'root:budget-stop',
    thread_id: 'synthetic-budget-stop'
  });
  const calendarGateway = new runtime.IndependentCalendarGateway();
  runtime.configureCalendar(calendarGateway);

  const result = sandbox.WorkOsWorker.syncPendingCalendarJobs({
    spreadsheet,
    calendar_gateway: calendarGateway,
    calendar_properties: runtime.scriptProperties(),
    instance_id: calendarGateway.instanceId,
    now: runtime.makeClock('2026-07-24T00:20:00.000Z').now,
    budget: runtime.fixedBudget(true)
  });

  assert.strictEqual(result.status, 'PAUSED');
  assert.strictEqual(result.processed_count, 0);
  assert.deepStrictEqual(
    {
      getCalendar: calendarGateway.calls.getCalendar,
      insert: calendarGateway.calls.eventInsert,
      update: calendarGateway.calls.eventUpdate,
      remove: calendarGateway.calls.eventDelete
    },
    { getCalendar: 0, insert: 0, update: 0, remove: 0 }
  );
});

test('P4-P05_EVENT_SEARCH_AND_STATIC_RUNTIME_GUARDS_ARE_BOUNDED', () => {
  let listCalls = 0;
  let capturedCalendarId = '';
  let capturedParams = null;
  const service = {
    Events: {
      list(calendarId, params) {
        listCalls += 1;
        capturedCalendarId = calendarId;
        capturedParams = structuredClone(params);
        return {
          items: [],
          nextPageToken: 'synthetic-token-that-must-not-be-followed'
        };
      }
    }
  };
  const gateway = new sandbox.WorkOsCalendarSync.AdvancedCalendarGateway(
    service
  );
  const taskId = `tsk_${'a'.repeat(32)}`;
  const events = gateway.findEventsByTaskMarker(
    'calendar_synthetic_bounded',
    taskId,
    '2026-08-20'
  );
  assert.deepStrictEqual(events, []);
  assert.strictEqual(listCalls, 1);
  assert.strictEqual(capturedCalendarId, 'calendar_synthetic_bounded');
  assert.strictEqual(capturedParams.maxResults, 10);
  assert.strictEqual(capturedParams.singleEvents, true);
  assert.deepStrictEqual(
    capturedParams.privateExtendedProperty,
    [`workosTaskId=${taskId}`]
  );
  assert.strictEqual(
    (
      new Date(capturedParams.timeMax).getTime() -
      new Date(capturedParams.timeMin).getTime()
    ) / (24 * 60 * 60 * 1000),
    sandbox.WorkOsConfig.CALENDAR_SEARCH_WINDOW_DAYS
  );

  const sources = fs.readdirSync(appsScriptRoot)
    .filter((name) => name.endsWith('.gs'))
    .map((name) => ({
      name,
      source: fs.readFileSync(path.join(appsScriptRoot, name), 'utf8')
    }));
  const allSource = sources.map((item) => item.source).join('\n');
  assert.strictEqual(/\bgetLastRow\s*\(/.test(allSource), false);
  assert.strictEqual(
    (allSource.match(/SpreadsheetApp\.flush\s*\(/g) || []).length,
    1
  );
  assert.strictEqual(sandbox.WorkOsConfig.ROW_EXPANSION_UNIT, 100);
  assert.strictEqual(sandbox.WorkOsConfig.CALENDAR_MAX_JOBS_PER_RUN, 1);

  const runtimeAndDiagnostic = [
    '11_EditHandler.gs',
    '16_Diagnostics.gs',
    '18_Worker.gs'
  ].map((name) =>
    fs.readFileSync(path.join(appsScriptRoot, name), 'utf8')
  ).join('\n');
  [
    /\bsetDataValidation\s*\(/,
    /\bsetNumberFormat\s*\(/,
    /\bhideColumns\s*\(/,
    /\bdeleteRows\s*\(/,
    /\bSpreadsheetApp\.flush\s*\(/
  ].forEach((pattern) => {
    assert.strictEqual(
      pattern.test(runtimeAndDiagnostic),
      false,
      `Runtime/Diagnostic layout mutation: ${pattern}`
    );
  });
});

test('P4-P06_HELD_LOCK_CONTEXTS_REJECT_ABSENT_LOCK', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  const taskSheet = harness.taskSheet(spreadsheet);
  const outboxSheet = runtime.syncSheet(spreadsheet);
  assert.throws(
    () => sandbox.WorkOsTaskRepository.createContextForHeldLock(
      taskSheet,
      null
    ),
    (error) => error && error.code === 'E_LOCK_REQUIRED'
  );
  assert.throws(
    () => sandbox.WorkOsCalendarSync.createOutboxContextForHeldLock(
      outboxSheet,
      { hasLock: () => false }
    ),
    (error) => error && error.code === 'E_LOCK_REQUIRED'
  );
  assert.throws(
    () => sandbox.WorkOsMessageStateRepository.createContextForHeldLock(
      harness.stateSheet(spreadsheet),
      { hasLock: () => false }
    ),
    (error) => error && error.code === 'E_LOCK_REQUIRED'
  );
});

test('P4-P07_NONACTIONABLE_TASKS_CREATE_NO_OUTBOX_OR_TASK_WRITES', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  harness.setActiveSpreadsheet(spreadsheet);
  [
    {
      suffix: 'noop-mode-none',
      calendar_sync_mode: 'NONE'
    },
    {
      suffix: 'noop-done',
      status: 'DONE',
      completed: true,
      excluded: false,
      waiting_for_reply: false
    },
    {
      suffix: 'noop-cancelled',
      status: 'CANCELLED'
    },
    {
      suffix: 'noop-auto-low',
      calendar_sync_mode: 'AUTO',
      calendar_importance: 'LOW'
    }
  ].forEach((options) => {
    runtime.seedEligibleTask(spreadsheet, {
      ...options,
      stable_thread_key: `root:${options.suffix}`,
      thread_id: `synthetic-${options.suffix}`
    });
  });
  const taskSheet = harness.taskSheet(spreadsheet);
  const outboxSheet = runtime.syncSheet(spreadsheet);
  taskSheet.readLog = [];
  taskSheet.writeLog = [];
  outboxSheet.readLog = [];
  outboxSheet.writeLog = [];
  const calendarGateway = new runtime.IndependentCalendarGateway();
  runtime.configureCalendar(calendarGateway);

  const result = sandbox.WorkOsWorker.syncPendingCalendarJobs({
    spreadsheet,
    calendar_gateway: calendarGateway,
    calendar_properties: runtime.scriptProperties(),
    instance_id: calendarGateway.instanceId,
    now: runtime.makeClock('2026-07-24T00:20:00.000Z').now,
    budget: runtime.fixedBudget(false)
  });

  assert.strictEqual(result.status, 'COMPLETE');
  assert.strictEqual(result.candidate_count, 0);
  assert.strictEqual(result.processed_count, 0);
  assert.strictEqual(result.queued_count, 0);
  assert.strictEqual(runtime.outboxRecords(spreadsheet).length, 0);
  assert.strictEqual(outboxSheet.writeLog.length, 0);
  assert.strictEqual(
    taskSheet.writeLog.length,
    0,
    'Already-NOT_REQUIRED Tasks must not receive same-value status rewrites'
  );
  assert.strictEqual(
    harness.allTasks(taskSheet).every(
      (task) => task.calendar_sync_status === 'NOT_REQUIRED'
    ),
    true
  );
  assert.strictEqual(
    Object.values(calendarGateway.calls).reduce(
      (total, count) => total + count,
      0
    ),
    0,
    'No Calendar API method may run without an actionable outbox job'
  );
});

test('P4-P08_CALENDAR_RECHECKS_BUDGET_BEFORE_MUTATING_CALL', () => {
  const gateway = new runtime.IndependentCalendarGateway();
  let checks = 0;
  assert.throws(
    () => sandbox.WorkOsCalendarSync.ensureDedicatedCalendar({
      gateway,
      properties: runtime.scriptProperties(),
      budget: {
        isExhausted() {
          checks += 1;
          return checks >= 2;
        }
      },
      reserve_ms: 1000
    }),
    (error) => error.code === 'E_BUDGET_EXHAUSTED'
  );
  assert.strictEqual(gateway.calls.createCalendar, 0);
  assert.strictEqual(checks >= 2, true);
});

const failed = tests.filter((item) => item.status === 'FAIL');
console.log(JSON.stringify({
  phase: 4,
  suite: 'performance_and_reliability',
  local_mock: failed.length ? 'FAIL' : 'PASS',
  google_workspace_duration: 'NOT_EXECUTED',
  google_workspace_lock_service: 'NOT_EXECUTED',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
}, null, 2));
if (failed.length) {
  process.exitCode = 1;
}
