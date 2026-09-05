'use strict';

// Real repositories, EditHandler, Calendar claim/CAS and scheduled entry point;
// only the Apps Script platform and external gateways are in-memory fakes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, 'phase4_independent_test.js'), 'utf8');
const boundary = source.indexOf('\nconst tests = [];');
assert.ok(boundary > 0);
const runtime = new Function('require', '__dirname', 'structuredClone', 'Buffer', 'Intl',
  source.slice(0, boundary) + '\nreturn { sandbox, harness, IndependentCalendarGateway, configureCalendar, seedEligibleTask, outboxRecords };'
)(require, __dirname, structuredClone, Buffer, Intl);
const { sandbox, harness, IndependentCalendarGateway, configureCalendar,
  seedEligibleTask, outboxRecords } = runtime;
const Config = sandbox.WorkOsConfig;
const Worker = sandbox.WorkOsWorker;
const Calendar = sandbox.WorkOsCalendarSync;
const Tasks = sandbox.WorkOsTaskRepository;
const State = sandbox.WorkOsMessageStateRepository;
vm.runInContext(fs.readFileSync(path.join(__dirname, '../apps-script-v2/12_Triggers.gs'), 'utf8'), sandbox);

function fixture(options = {}) {
  harness.reset();
  const spreadsheet = harness.makeOperationalSpreadsheet();
  harness.setActiveSpreadsheet(spreadsheet);
  const properties = sandbox.PropertiesService.getScriptProperties();
  const calendar = new IndependentCalendarGateway(options);
  configureCalendar(calendar);
  const now = () => new sandbox.Date('2026-09-05T00:00:00.000Z');
  properties.setProperty(Config.PROPERTIES.AUTOMATION_PILOT_STARTED_AT, '2026-07-01T00:00:00.000Z');
  properties.setProperty(Config.PROPERTIES.AUTOMATION_ENABLED, 'true');
  properties.setProperty(Config.PROPERTIES.AUTOMATION_DESIRED_STATE, 'true');
  properties.setProperty(Config.PROPERTIES.AUTOMATION_TRIGGER_ID, 'synthetic-canonical-clock');
  const trigger = {
    getUniqueId: () => 'synthetic-canonical-clock',
    getHandlerFunction: () => Config.AUTOMATION_HANDLER_FUNCTION,
    getEventType: () => 'CLOCK'
  };
  const scriptApp = { getProjectTriggers: () => [trigger] };
  const calls = { search: 0, ai: 0 };
  const gateway = {
    listAutomaticCandidates() {
      assert.equal(harness.isLockHeld(), false);
      calls.search += 1;
      return { candidates: [], search_complete: true };
    }
  };
  const adapter = new sandbox.WorkOsAiAdapter.MockAiAdapter();
  adapter.classify = () => { calls.ai += 1; throw new Error('Unexpected AI request'); };
  const workerOptions = {
    spreadsheet, properties, gateway, adapter, pilot_only: true, now,
    budget: { isExhausted: () => false }, calendar_gateway: calendar,
    calendar_properties: properties, instance_id: calendar.instanceId
  };
  return {
    spreadsheet, properties, calendar, calls, workerOptions, now,
    run(overrides = {}) {
      return sandbox.WorkOsAutomation.runScheduledWorker(
        { triggerUid: trigger.getUniqueId() }, {
          properties, script_app: scriptApp,
          prerequisite_checker: () => ({ ready: true, reasons: [] }),
          worker: Worker, worker_options: { ...workerOptions, ...overrides }
        }
      );
    }
  };
}

function edit(f, taskId, field, value) {
  const sheet = harness.taskSheet(f.spreadsheet);
  const context = Tasks.createContext(sheet);
  const row = context.byTaskId[taskId];
  const ids = sandbox.WorkOsSchemas.getInternalIds(Config.SHEETS.TASKS);
  const oldValue = sheet.getRange(row, ids.indexOf(field) + 1, 1, 1).getValues()[0][0];
  harness.setTaskCell(sheet, row, field, value);
  return sandbox.WorkOsEditHandler.handle({
    range: sheet.getRange(row, ids.indexOf(field) + 1, 1, 1), oldValue
  });
}

function taskEditJob(f, suffix = 'a') {
  const task = seedEligibleTask(f.spreadsheet, { suffix,
    thread_id: `synthetic-task-edit-${suffix}`, stable_thread_key: `root:synthetic-task-edit-${suffix}` });
  const result = edit(f, task.task_id, 'due_date', new sandbox.Date(2026, 8, 20));
  assert.equal(result.calendar_outbox.pending_count, 1, JSON.stringify(result));
  assert.equal(outboxRecords(f.spreadsheet).find(row => row.task_id === task.task_id).status, 'PENDING');
  return task;
}

function assertNoMessages(f) {
  const rows = State.createContext(harness.stateSheet(f.spreadsheet)).logicalRows;
  assert.equal(rows.filter(row => row.processing_status !== 'DONE').length, 0);
}

function assertMeaningful(result) {
  assert.equal(result.candidate_count, 0);
  assert.equal(result.log_recorded, true, JSON.stringify(result));
}

const tests = [];
function test(id, body) {
  try { body(); tests.push({ id, status: 'PASS' }); }
  catch (error) {
    tests.push({ id, status: 'FAIL', detail: String(error.message) });
    process.exitCode = 1;
  }
}

test('TASK_EDIT_STANDALONE_OUTBOX_CANONICAL_SCHEDULED_CREATE', () => {
  const f = fixture();
  taskEditJob(f);
  assertNoMessages(f);
  assert.equal(f.calendar.calls.eventInsert, 0);
  const result = f.run();
  assert.equal(result.status, 'COMPLETE', JSON.stringify(result));
  assert.equal(result.calendar_job_count, 1,
    'Due standalone Calendar job must drain with no Gmail/Message backlog: ' + JSON.stringify(result));
  assert.equal(f.calendar.calls.eventInsert, 1);
  assert.equal(outboxRecords(f.spreadsheet)[0].status, 'DONE');
  assert.equal(f.calls.ai, 0);
  assertMeaningful(result);
});

test('HIGH_IMPACT_REVIEW_DONE_MESSAGE_ACCEPT_THEN_SCHEDULED_CREATE', () => {
  const f = fixture();
  const message = harness.rawMessage('NEW_HIGH');
  harness.seedPreprocessed(f.spreadsheet, message);
  const mock = new sandbox.WorkOsAiAdapter.MockAiAdapter();
  const result = Worker.processMockVerticalOnce({
    ...f.workerOptions, gateway: harness.makeVerticalGateway(message),
    adapter: {
      healthCheck: () => mock.healthCheck(),
      classify(input) {
        const classified = mock.classify(input);
        classified.actions[0].calendar_category = 'EXTERNAL_SUBMISSION';
        classified.actions[0].calendar_importance = 'HIGH';
        return classified;
      }
    }
  });
  assert.equal(result.status, 'COMPLETE', JSON.stringify(result));
  const task = harness.allTasks(harness.taskSheet(f.spreadsheet))[0];
  assert.equal(task.needs_review, true);
  assert.equal(task.review_state, 'OPEN');
  assertNoMessages(f);
  assert.equal(f.calendar.calls.eventInsert, 0);
  const accepted = edit(f, task.task_id, 'decision', sandbox.WorkOsSchemas.toSheetEnum('Decision', 'ACCEPT'));
  assert.equal(accepted.calendar_outbox.pending_count, 1, JSON.stringify(accepted));
  assert.equal(f.run().calendar_job_count, 1);
  assert.equal(f.calendar.calls.eventInsert, 1);
  assertNoMessages(f);
  assert.equal(f.calls.ai, 0);
});

test('SCHEDULED_UPDATE_DELETE_AND_REPLAY_NO_DUPLICATE_WRITES', () => {
  const f = fixture();
  const task = taskEditJob(f);
  assert.equal(f.run().status, 'COMPLETE');
  edit(f, task.task_id, 'due_date', new sandbox.Date(2026, 8, 22));
  assert.equal(f.run().status, 'COMPLETE');
  assert.equal(f.calendar.calls.eventUpdate, 1);
  const current = harness.readTask(harness.taskSheet(f.spreadsheet), task.task_id);
  Calendar.enqueueTask(current, {
    spreadsheet: f.spreadsheet, sheet: f.spreadsheet.getSheetByName(Config.SHEETS.SYNC_STATE),
    now: f.now(), force_enqueue: true
  });
  const noop = f.run();
  assert.equal(noop.calendar_job_count, 1);
  assert.equal(f.calendar.calls.eventInsert, 1);
  assert.equal(f.calendar.calls.eventUpdate, 1);
  edit(f, task.task_id, 'completed', true);
  assert.equal(f.run().status, 'COMPLETE');
  assert.equal(f.calendar.calls.eventDelete, 1);
  assert.equal(f.calendar.events.size, 0);
  const calls = { ...f.calendar.calls };
  assert.equal(f.run().calendar_job_count, 0);
  assert.deepEqual(f.calendar.calls, calls);
});

test('STANDALONE_JOBS_SHARE_CONFIGURED_PER_RUN_BOUND', () => {
  const f = fixture();
  taskEditJob(f, 'first');
  taskEditJob(f, 'second');
  const first = f.run();
  assert.equal(first.calendar_job_count, Config.CALENDAR_MAX_JOBS_PER_RUN);
  assert.equal(first.status, 'PAUSED');
  assert.equal(first.note, 'CALENDAR_JOB_LIMIT_REACHED');
  assert.equal(f.calendar.calls.eventInsert, 1);
  assertMeaningful(first);
  const second = f.run();
  assert.equal(second.calendar_job_count, 1);
  assert.equal(second.status, 'COMPLETE');
  assert.equal(f.calendar.calls.eventInsert, 2);
});

test('MESSAGE_CALENDAR_AND_STANDALONE_SHARE_ONE_JOB_ALLOWANCE', () => {
  const f = fixture();
  const message = harness.rawMessage('NEW_HIGH');
  harness.seedPreprocessed(f.spreadsheet, message);
  const gateway = harness.makeVerticalGateway(message);
  assert.equal(Worker.processMockVerticalOnce({ ...f.workerOptions, gateway,
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter() }).status, 'COMPLETE');
  const task = harness.allTasks(harness.taskSheet(f.spreadsheet))[0];
  edit(f, task.task_id, 'decision', sandbox.WorkOsSchemas.toSheetEnum('Decision', 'ACCEPT'));
  edit(f, task.task_id, 'calendar_sync_mode', sandbox.WorkOsSchemas.toSheetEnum('CalendarSyncMode', 'FORCE'));
  // Seed a valid persisted CALENDAR_PENDING checkpoint from the completed
  // classification. This covers coexistence with the separate post-edit job.
  const sheet = harness.stateSheet(f.spreadsheet);
  const ids = sandbox.WorkOsSchemas.getInternalIds(Config.SHEETS.MESSAGE_STATE);
  for (const [key, value] of Object.entries({ processing_status: 'CALENDAR_PENDING', resume_stage: 'CALENDAR', completed_at: '' })) {
    sheet.getRange(Config.DATA_START_ROW, ids.indexOf(key) + 1, 1, 1).setValues([[value]]);
  }
  assert.equal(State.createContext(sheet).logicalRows[0].processing_status, 'CALENDAR_PENDING');
  taskEditJob(f, 'standalone');
  assert.equal(outboxRecords(f.spreadsheet).filter(row => row.status === 'PENDING').length, 2);
  gateway.listAutomaticCandidates = f.workerOptions.gateway.listAutomaticCandidates;
  const result = f.run({ gateway, pilot_only: false });
  assert.equal(result.calendar_job_count, 1, JSON.stringify(result));
  assert.equal(f.calendar.calls.eventInsert, 1, JSON.stringify({ result, outbox: outboxRecords(f.spreadsheet) }));
  assert.equal(outboxRecords(f.spreadsheet).filter(row => row.status === 'PENDING').length, 1,
    JSON.stringify({ result, outbox: outboxRecords(f.spreadsheet) }));
  const next = f.run();
  assert.equal(next.calendar_job_count, 1, JSON.stringify(next));
  assert.equal(f.calendar.calls.eventInsert, 2);
});

test('RETRY_FAILURE_AND_DEFERRED_RETRY_ARE_NOT_HEALTHY_IDLE', () => {
  const f = fixture({ fail_insert_count: 1 });
  taskEditJob(f);
  const first = f.run();
  assert.equal(first.status, 'FAILED');
  assert.equal(first.error_count, 1);
  assert.equal(outboxRecords(f.spreadsheet)[0].status, 'RETRY');
  assert.equal(outboxRecords(f.spreadsheet)[0].retry_count, 1);
  assertMeaningful(first);
  const next = f.run();
  assert.equal(next.status, 'PAUSED');
  assert.equal(next.note, 'CALENDAR_RETRY_DEFERRED');
  assert.equal(f.calendar.calls.eventInsert, 1);
  assertMeaningful(next);
  assert.equal(f.run({ now: () => new sandbox.Date('2026-09-05T00:05:00Z') }).status, 'COMPLETE');
  assert.equal(f.calendar.events.size, 1);
});

test('NON_RETRYABLE_CALENDAR_FAILURE_IS_DEAD_AND_VISIBLE', () => {
  const f = fixture({ primary: true });
  taskEditJob(f);
  const first = f.run();
  assert.equal(first.status, 'FAILED');
  assert.equal(outboxRecords(f.spreadsheet)[0].status, 'DEAD');
  assert.equal(f.calendar.calls.eventInsert, 0);
  assertMeaningful(first);
  const next = f.run();
  assert.equal(next.status, 'FAILED');
  assert.equal(next.note, 'CALENDAR_DEAD_REQUIRES_REVIEW');
  assertMeaningful(next);
});

test('POST_IO_TASK_CAS_CONFLICT_REQUEUES_AND_CONVERGES_WITHOUT_DUPLICATE', () => {
  const f = fixture();
  const task = taskEditJob(f);
  const insert = f.calendar.insertEvent.bind(f.calendar);
  f.calendar.insertEvent = (...args) => {
    const result = insert(...args);
    edit(f, task.task_id, 'due_date', new sandbox.Date(2026, 8, 24));
    return result;
  };
  const first = f.run();
  assert.equal(first.status, 'PAUSED', JSON.stringify(first));
  assert.equal(first.note, 'E_CALENDAR_CAS_CONFLICT_REQUEUED');
  assert.equal(first.external_services.calendar, 'ADVANCED_CALENDAR_SERVICE');
  assert.equal(outboxRecords(f.spreadsheet)[0].retry_count, 0);
  assertMeaningful(first);
  assert.equal(f.run().status, 'COMPLETE');
  assert.equal(f.calendar.calls.eventInsert, 1);
  assert.equal(f.calendar.events.size, 1);
});

test('WORKER_LEASE_BUSY_AND_LOST_FAIL_CLOSED', () => {
  const f = fixture();
  taskEditJob(f);
  const key = 'WORK_OS_V2_ACTIVE_WORKER_LEASE';
  f.properties.setProperty(key, JSON.stringify({ owner_token: 'synthetic-owner', expires_at: '2026-09-05T00:20:00Z' }));
  const busy = f.run();
  assert.equal(busy.status, 'BUSY');
  assert.equal(f.calls.search, 0);
  assert.equal(f.calendar.calls.eventInsert, 0);
  f.properties.deleteProperty(key);
  const search = f.workerOptions.gateway.listAutomaticCandidates;
  f.workerOptions.gateway.listAutomaticCandidates = () => {
    f.properties.deleteProperty(key);
    return search();
  };
  const lost = f.run();
  assert.equal(lost.status, 'FAILED');
  assert.equal(lost.note, 'E_WORKER_LEASE_LOST');
  assert.equal(f.calendar.calls.eventInsert, 0);
  assertMeaningful(lost);
});

test('SHARED_BUDGET_EXHAUSTED_AFTER_SEARCH_STOPS_BEFORE_CALENDAR', () => {
  const f = fixture();
  taskEditJob(f);
  const result = f.run({ budget: { isExhausted: () => f.calls.search > 0 } });
  assert.equal(result.status, 'PAUSED');
  assert.equal(f.calendar.calls.eventInsert, 0);
  assert.equal(outboxRecords(f.spreadsheet)[0].status, 'PENDING');
  assertMeaningful(result);
});

function claimOptions(f) {
  return {
    spreadsheet: f.spreadsheet, properties: f.properties, now: f.now,
    budget: f.workerOptions.budget,
    task_reader_in_context: (id, lock) => Tasks.findByTaskId(
      Tasks.createContextForHeldLock(harness.taskSheet(f.spreadsheet), lock), id),
    task_writer_in_context: () => { throw new Error('Preparation must not write Task'); }
  };
}

test('CALENDAR_CLAIM_BUSY_THEN_EXPIRY_IS_RECLAIMABLE', () => {
  const f = fixture();
  taskEditJob(f);
  assert.equal(Calendar.prepareNextJob(claimOptions(f)).status, 'READY');
  const busy = f.run();
  assert.equal(busy.status, 'PAUSED');
  assert.equal(busy.note, 'CALENDAR_JOB_CLAIM_ACTIVE');
  assert.equal(f.calendar.calls.eventInsert, 0);
  assertMeaningful(busy);
  const later = f.run({ now: () => new sandbox.Date('2026-09-05T00:11:00Z') });
  assert.equal(later.status, 'COMPLETE');
  assert.equal(f.calendar.calls.eventInsert, 1);
});

test('CALENDAR_CLAIM_OWNERSHIP_CHANGED_AFTER_IO_FAILS_CLOSED', () => {
  const f = fixture();
  taskEditJob(f);
  const insert = f.calendar.insertEvent.bind(f.calendar);
  f.calendar.insertEvent = (...args) => {
    const result = insert(...args);
    f.properties.deleteProperty('WORK_OS_V2_CALENDAR_JOB_CLAIM');
    return result;
  };
  const result = f.run();
  assert.equal(result.status, 'FAILED');
  assert.equal(result.note, 'E_CALENDAR_JOB_CLAIM_CONFLICT');
  assert.equal(outboxRecords(f.spreadsheet)[0].status, 'PENDING');
  assertMeaningful(result);
});

test('UNTRUSTED_TASK_AUTHORITY_CANNOT_CREATE_EVENT', () => {
  const f = fixture();
  const task = taskEditJob(f);
  const sheet = harness.taskSheet(f.spreadsheet);
  const row = Tasks.createContext(sheet).byTaskId[task.task_id];
  // A direct ungoverned business-cell mutation must not acquire authority.
  harness.setTaskCell(sheet, row, 'task_title', 'Synthetic uncommitted change');
  const result = f.run();
  assert.equal(f.calendar.calls.eventInsert, 0);
  assert.notEqual(result.status, 'COMPLETE');
  assertMeaningful(result);
});

test('TRUE_ZERO_WORK_SUPPRESSES_DETAIL_BUT_UPDATES_HEARTBEAT', () => {
  const f = fixture();
  const history = f.spreadsheet.getSheetByName(Config.SHEETS.RUN_HISTORY);
  let reads = 0;
  const getRange = history.getRange.bind(history);
  history.getRange = (...args) => { reads += 1; return getRange(...args); };
  const result = f.run();
  assert.equal(result.status, 'COMPLETE');
  assert.equal(result.error_count, 0);
  assert.equal(result.log_recorded, false);
  assert.equal(reads, 0);
  assert.equal(Object.values(f.calendar.calls).reduce((a, b) => a + b, 0), 0);
  assert.ok(f.properties.getProperty(Config.PROPERTIES.AUTOMATION_LAST_RUN_AT));
  assert.equal(f.calls.ai, 0);
});

test('NO_NEW_MAIL_WITH_GMAIL_SYSTEM_FAILURE_IS_NOT_HEALTHY', () => {
  const f = fixture();
  f.workerOptions.gateway.listAutomaticCandidates = () => {
    throw new sandbox.WorkOsAppError('E_GMAIL_FETCH', 'GMAIL_AUTOMATIC_SEARCH', true, 'Synthetic search failure');
  };
  const result = f.run();
  assert.equal(result.candidate_count, 0);
  assert.equal(result.status, 'FAILED');
  assert.equal(result.error_count, 1);
  assertMeaningful(result);
});

test('MANUAL_ONE_CALENDAR_JOB_FALLBACK_REMAINS_COMPATIBLE', () => {
  const f = fixture();
  taskEditJob(f);
  const result = Worker.syncPendingCalendarJobs(f.workerOptions);
  assert.equal(result.status, 'COMPLETE');
  assert.equal(result.processed_count, 1);
  assert.equal(result.action, 'CREATE');
  assert.equal(f.calendar.calls.eventInsert, 1);
});

process.stdout.write(JSON.stringify({
  suite: 'work_0041_calendar_scheduled_drain', environment: 'LOCAL_NON_GOOGLE',
  passed: tests.filter(t => t.status === 'PASS').length,
  failed: tests.filter(t => t.status === 'FAIL').length, tests
}, null, 2) + '\n');
