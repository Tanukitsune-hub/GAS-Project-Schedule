'use strict';

/**
 * Independent Phase 4 integration and boundary tests.
 *
 * The existing Phase 3 in-memory Sheets harness is reused only for its fake
 * Google runtime. The assertions below were designed independently against
 * V2_IMPLEMENTATION_SPEC.md and
 * CODEX_PHASE1_AUDIT_PHASE2_TO_4_INSTRUCTIONS.md. No Google Workspace API or
 * network request is made.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repositoryRoot = path.resolve(__dirname, '..');
const appsScriptRoot = path.join(repositoryRoot, 'apps-script-v2');

function loadHarness() {
  const phase3HarnessPath = path.join(__dirname, 'phase3_local_test.js');
  const source = fs.readFileSync(phase3HarnessPath, 'utf8')
    .replace(/\r\n/g, '\n');
  const marker = '\nconst tests = [];';
  const markerIndex = source.indexOf(marker);
  assert.notStrictEqual(
    markerIndex,
    -1,
    'Phase 3 in-memory harness boundary was not found'
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
  FakeRange,
  FakeSheet,
  FakeSpreadsheet,
  makeSchemaSheet,
  makeOperationalSpreadsheet,
  taskSheet,
  stateSheet,
  allTasks,
  rawMessage,
  seedPreprocessed,
  makeVerticalGateway,
  setTaskCell,
  readTask,
  scriptProperties,
  setActiveSpreadsheet(value) { activeSpreadsheet = value; },
  getLockAttemptCount() { return lockAttemptCount; },
  isLockHeld() { return globalLockHeld; },
  reset() {
    activeSpreadsheet = null;
    lockAvailable = true;
    globalLockHeld = false;
    lockAttemptCount = 0;
    scriptProperties.clear();
  }
};`
  );
  return factory(require, __dirname, structuredClone, Buffer, Intl);
}

const harness = loadHarness();
const sandbox = harness.sandbox;

class IndependentCalendarGateway {
  constructor(options = {}) {
    this.calendarId = options.calendar_id || 'calendar_phase4_fake';
    this.instanceId = options.instance_id ||
      'ins_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    this.failInsertCount = Number(options.fail_insert_count || 0);
    this.primary = Boolean(options.primary);
    this.foreignEvent = Boolean(options.foreign_event);
    this.events = new Map();
    this.calls = {
      listCalendars: 0,
      getCalendar: 0,
      createCalendar: 0,
      eventGet: 0,
      eventFind: 0,
      eventInsert: 0,
      eventUpdate: 0,
      eventDelete: 0
    };
  }

  assertExternalIoIsUnlocked() {
    assert.strictEqual(
      harness.isLockHeld(),
      false,
      'Calendar external I/O ran while Script Lock was held'
    );
  }

  listCalendarsBySummary() {
    this.assertExternalIoIsUnlocked();
    this.calls.listCalendars += 1;
    return [];
  }

  getCalendar(calendarId) {
    this.assertExternalIoIsUnlocked();
    this.calls.getCalendar += 1;
    if (String(calendarId) !== this.calendarId) {
      return null;
    }
    return {
      id: this.calendarId,
      summary: sandbox.WorkOsConfig.DEADLINE_CALENDAR_NAME,
      description: `[WORKOS_INSTANCE_ID:${this.instanceId}]`,
      accessRole: 'owner',
      primary: this.primary
    };
  }

  createCalendar(summary, instanceId) {
    this.assertExternalIoIsUnlocked();
    this.calls.createCalendar += 1;
    this.instanceId = String(instanceId);
    return {
      id: this.calendarId,
      summary,
      description: `[WORKOS_INSTANCE_ID:${this.instanceId}]`,
      accessRole: 'owner'
    };
  }

  isPrimaryCalendar(calendarId, resource) {
    return String(calendarId).toLowerCase() === 'primary' ||
      this.primary ||
      Boolean(resource && resource.primary);
  }

  getCalendarAccessRole() {
    return 'owner';
  }

  getEvent(_calendarId, eventId) {
    this.assertExternalIoIsUnlocked();
    this.calls.eventGet += 1;
    const event = this.events.get(String(eventId));
    if (!event) {
      return null;
    }
    const clone = structuredClone(event);
    if (this.foreignEvent) {
      clone.extendedProperties.private.workosInstanceId =
        'ins_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    }
    return clone;
  }

  findEventsByTaskMarker(_calendarId, taskId) {
    this.assertExternalIoIsUnlocked();
    this.calls.eventFind += 1;
    return Array.from(this.events.values())
      .filter((event) => (
        event.extendedProperties &&
        event.extendedProperties.private &&
        event.extendedProperties.private.workosTaskId === taskId
      ))
      .map((event) => {
        const clone = structuredClone(event);
        if (this.foreignEvent) {
          clone.extendedProperties.private.workosInstanceId =
            'ins_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
        }
        return clone;
      });
  }

  insertEvent(calendarId, resource) {
    this.assertExternalIoIsUnlocked();
    this.calls.eventInsert += 1;
    assert.strictEqual(calendarId, this.calendarId);
    if (this.failInsertCount > 0) {
      this.failInsertCount -= 1;
      throw new sandbox.WorkOsAppError(
        'E_CALENDAR_API_CREATE',
        'CALENDAR_SYNC',
        true,
        'Synthetic retryable Calendar failure'
      );
    }
    if (this.events.has(String(resource.id))) {
      const conflict = new Error('Synthetic deterministic ID conflict');
      conflict.status = 409;
      throw conflict;
    }
    this.events.set(String(resource.id), structuredClone(resource));
    return structuredClone(resource);
  }

  updateEvent(calendarId, eventId, resource) {
    this.assertExternalIoIsUnlocked();
    this.calls.eventUpdate += 1;
    assert.strictEqual(calendarId, this.calendarId);
    assert.strictEqual(this.events.has(String(eventId)), true);
    const updated = {
      ...structuredClone(resource),
      id: String(eventId)
    };
    this.events.set(String(eventId), updated);
    return structuredClone(updated);
  }

  deleteEvent(calendarId, eventId) {
    this.assertExternalIoIsUnlocked();
    this.calls.eventDelete += 1;
    assert.strictEqual(calendarId, this.calendarId);
    return this.events.delete(String(eventId));
  }
}

function scriptProperties() {
  return sandbox.PropertiesService.getScriptProperties();
}

function configureCalendar(gateway) {
  harness.scriptProperties.set(
    sandbox.WorkOsConfig.PROPERTIES.INSTANCE_ID,
    gateway.instanceId
  );
  harness.scriptProperties.set(
    sandbox.WorkOsConfig.PROPERTIES.DEADLINE_CALENDAR_ID,
    gateway.calendarId
  );
}

function syncSheet(spreadsheet) {
  return spreadsheet.getSheetByName(sandbox.WorkOsConfig.SHEETS.SYNC_STATE);
}

function messageRecord(spreadsheet, messageId) {
  const context = sandbox.WorkOsMessageStateRepository.createContext(
    harness.stateSheet(spreadsheet)
  );
  return sandbox.WorkOsMessageStateRepository.getByMessageId(
    context,
    messageId
  );
}

function outboxRecords(spreadsheet) {
  const context = sandbox.WorkOsCalendarSync.createOutboxContext(
    syncSheet(spreadsheet)
  );
  return context.logicalRows.map((row) =>
    sandbox.WorkOsCalendarSync.readOutboxRow(context, row)
  );
}

function seedEligibleTask(spreadsheet, options = {}) {
  const sourceMessageId = options.source_message_id ||
    `synthetic-calendar-source-${options.suffix || 'a'}`;
  let result;
  sandbox.WorkOsTaskRepository.withLockedContext(
    harness.taskSheet(spreadsheet),
    (context) => {
      result = sandbox.WorkOsTaskRepository.upsertTask({
        origin_key: sandbox.WorkOsUtilities.makeOriginKey(sourceMessageId, 0),
        task_title: options.task_title || 'Synthetic important deadline',
        status: options.status || 'OPEN',
        needs_review: false,
        review_state: 'NONE',
        completed: options.completed === true,
        excluded: options.excluded === true,
        due_date: options.due_date || '2026-08-20',
        deadline_basis: 'EXPLICIT',
        priority: 'HIGH',
        waiting_for_reply: options.waiting_for_reply === true,
        calendar_sync_mode: options.calendar_sync_mode || 'FORCE',
        calendar_category: options.calendar_category ||
          'EXTERNAL_SUBMISSION',
        calendar_importance: options.calendar_importance || 'HIGH',
        calendar_sync_status: 'NOT_REQUIRED',
        sender: 'sender@example.invalid',
        subject: 'Synthetic source subject',
        source_email: 'https://example.invalid/synthetic-reference',
        source_message_id: sourceMessageId,
        source_thread_id: options.thread_id || 'synthetic-calendar-thread',
        stable_thread_key: options.stable_thread_key ||
          'root:synthetic-calendar-thread',
        source_action_index: 0,
        ai_provider: 'MOCK',
        ai_model: 'mock-local',
        ai_prompt_version: 'phase4-independent'
      }, context);
    }
  );
  return sandbox.WorkOsTaskRepository.findByTaskId(
    sandbox.WorkOsTaskRepository.createContext(harness.taskSheet(spreadsheet)),
    result.task_id
  );
}

function seedInformationMessage(spreadsheet, options = {}) {
  const message = harness.rawMessage('INFORMATION_ONLY', {
    message_id: options.message_id || 'synthetic-phase4-message',
    thread_id: options.thread_id || 'synthetic-phase4-thread',
    stable_thread_key: options.stable_thread_key ||
      'root:synthetic-phase4-thread'
  });
  harness.seedPreprocessed(spreadsheet, message);
  return message;
}

function makeCountedPipeline(message) {
  const gateway = harness.makeVerticalGateway(message);
  const adapterImpl = new sandbox.WorkOsAiAdapter.MockAiAdapter();
  const counts = {
    classify: 0,
    preprocess: 0
  };
  return {
    gateway,
    counts,
    adapter: {
      healthCheck: () => adapterImpl.healthCheck(),
      classify: (input) => {
        counts.classify += 1;
        return adapterImpl.classify(input);
      }
    },
    preprocessor: {
      preprocess: (input, options) => {
        counts.preprocess += 1;
        return sandbox.WorkOsEmailPreprocessor.preprocess(input, options);
      }
    }
  };
}

function fixedBudget(exhausted) {
  return {
    isExhausted: () => Boolean(exhausted)
  };
}

function makeClock(initialIso) {
  let current = new Date(initialIso);
  return {
    now: () => new Date(current.getTime()),
    advanceMinutes: (minutes) => {
      current = new Date(current.getTime() + minutes * 60 * 1000);
    }
  };
}

function runVertical(spreadsheet, message, calendarGateway, clock, options = {}) {
  const pipeline = options.pipeline || makeCountedPipeline(message);
  const result = sandbox.WorkOsWorker.processMockVerticalOnce({
    spreadsheet,
    gateway: pipeline.gateway,
    preprocessor: pipeline.preprocessor,
    adapter: pipeline.adapter,
    calendar_gateway: calendarGateway,
    calendar_properties: scriptProperties(),
    instance_id: calendarGateway.instanceId,
    now: clock.now,
    budget: options.budget || fixedBudget(false)
  });
  return { result, pipeline };
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

test('P4-I01_FINALIZE_CALENDAR_DONE_VERTICAL_FLOW', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  harness.setActiveSpreadsheet(spreadsheet);
  const stableThreadKey = 'root:phase4-finalize-done';
  const threadId = 'synthetic-thread-finalize-done';
  const task = seedEligibleTask(spreadsheet, {
    suffix: 'finalize-done',
    stable_thread_key: stableThreadKey,
    thread_id: threadId
  });
  const message = seedInformationMessage(spreadsheet, {
    message_id: 'synthetic-message-finalize-done',
    stable_thread_key: stableThreadKey,
    thread_id: threadId
  });
  const calendarGateway = new IndependentCalendarGateway();
  configureCalendar(calendarGateway);
  const clock = makeClock('2026-07-24T00:20:00.000Z');

  const run = runVertical(
    spreadsheet,
    message,
    calendarGateway,
    clock
  );

  assert.strictEqual(run.result.status, 'COMPLETE');
  assert.strictEqual(run.result.checkpoint, 'DONE');
  assert.strictEqual(calendarGateway.events.size, 1);
  assert.strictEqual(calendarGateway.calls.eventInsert, 1);
  assert.strictEqual(run.pipeline.counts.classify, 1);
  assert.strictEqual(run.pipeline.gateway.calls.refetch, 1);
  assert.strictEqual(
    messageRecord(spreadsheet, message.message_id).processing_status,
    'DONE'
  );
  const synced = harness.readTask(harness.taskSheet(spreadsheet), task.task_id);
  assert.strictEqual(synced.calendar_sync_status, 'SYNCED');
  assert.match(
    String(synced.calendar_event_id),
    /^[a-v0-9]{5,1024}$/
  );
  assert.match(String(synced.calendar_event_id), /^v2d[0-9a-f]{40}$/);
  assert.deepStrictEqual(
    Array.from(outboxRecords(spreadsheet), (record) => record.status),
    ['DONE']
  );
});

test('P4-I02_CALENDAR_RETRY_SKIPS_GMAIL_AI_AND_TASK_BUSINESS_WRITE', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  harness.setActiveSpreadsheet(spreadsheet);
  const stableThreadKey = 'root:phase4-calendar-retry';
  const threadId = 'synthetic-thread-calendar-retry';
  const task = seedEligibleTask(spreadsheet, {
    suffix: 'calendar-retry',
    stable_thread_key: stableThreadKey,
    thread_id: threadId
  });
  const message = seedInformationMessage(spreadsheet, {
    message_id: 'synthetic-message-calendar-retry',
    stable_thread_key: stableThreadKey,
    thread_id: threadId
  });
  const calendarGateway = new IndependentCalendarGateway({
    fail_insert_count: 1
  });
  configureCalendar(calendarGateway);
  const clock = makeClock('2026-07-24T00:20:00.000Z');
  const pipeline = makeCountedPipeline(message);

  const first = runVertical(
    spreadsheet,
    message,
    calendarGateway,
    clock,
    { pipeline }
  ).result;
  assert.strictEqual(first.status, 'FAILED');
  let state = messageRecord(spreadsheet, message.message_id);
  assert.strictEqual(state.processing_status, 'RETRY');
  assert.strictEqual(state.resume_stage, 'CALENDAR');
  assert.strictEqual(outboxRecords(spreadsheet)[0].status, 'RETRY');
  const businessBefore = harness.readTask(
    harness.taskSheet(spreadsheet),
    task.task_id
  );
  const countsBefore = {
    refetch: pipeline.gateway.calls.refetch,
    classify: pipeline.counts.classify,
    preprocess: pipeline.counts.preprocess
  };

  clock.advanceMinutes(6);
  const second = runVertical(
    spreadsheet,
    message,
    calendarGateway,
    clock,
    { pipeline }
  ).result;

  assert.strictEqual(second.status, 'COMPLETE');
  assert.strictEqual(second.checkpoint, 'DONE');
  assert.deepStrictEqual(
    {
      refetch: pipeline.gateway.calls.refetch,
      classify: pipeline.counts.classify,
      preprocess: pipeline.counts.preprocess
    },
    countsBefore
  );
  const businessAfter = harness.readTask(
    harness.taskSheet(spreadsheet),
    task.task_id
  );
  [
    'task_title',
    'status',
    'due_date',
    'deadline_basis',
    'priority',
    'manual_fields',
    'pending_action_type',
    'pending_changes_json'
  ].forEach((field) => {
    const normalize = (value) => value instanceof Date
      ? value.toISOString()
      : JSON.stringify(value);
    assert.strictEqual(
      normalize(businessAfter[field]),
      normalize(businessBefore[field]),
      `Calendar retry changed Task business field ${field}`
    );
  });
  assert.strictEqual(calendarGateway.events.size, 1);
  assert.strictEqual(calendarGateway.calls.eventInsert, 2);
  assert.strictEqual(outboxRecords(spreadsheet)[0].status, 'DONE');
});

test('P4-I03_ZERO_TASK_MESSAGE_DOES_NOT_CONSUME_UNRELATED_OUTBOX', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  harness.setActiveSpreadsheet(spreadsheet);
  const unrelatedTask = seedEligibleTask(spreadsheet, {
    suffix: 'unrelated',
    stable_thread_key: 'root:unrelated-thread',
    thread_id: 'synthetic-unrelated-thread'
  });
  sandbox.WorkOsCalendarSync.enqueueTask(unrelatedTask, {
    sheet: syncSheet(spreadsheet),
    now: new Date('2026-07-24T00:19:00.000Z'),
    timezone: sandbox.WorkOsConfig.TIMEZONE
  });
  const message = seedInformationMessage(spreadsheet, {
    message_id: 'synthetic-message-zero-task',
    stable_thread_key: 'root:zero-task-thread',
    thread_id: 'synthetic-zero-task-thread'
  });
  const calendarGateway = new IndependentCalendarGateway();
  configureCalendar(calendarGateway);
  const clock = makeClock('2026-07-24T00:20:00.000Z');

  const run = runVertical(
    spreadsheet,
    message,
    calendarGateway,
    clock
  );

  assert.strictEqual(run.result.status, 'COMPLETE');
  assert.strictEqual(run.result.checkpoint, 'DONE');
  assert.strictEqual(calendarGateway.calls.eventInsert, 0);
  assert.strictEqual(calendarGateway.calls.eventUpdate, 0);
  assert.strictEqual(calendarGateway.calls.eventDelete, 0);
  assert.strictEqual(outboxRecords(spreadsheet)[0].status, 'PENDING');
  assert.strictEqual(
    messageRecord(spreadsheet, message.message_id).processing_status,
    'DONE'
  );
});

test('P4-I04_VERTICAL_WORKER_PROCESSES_AT_MOST_ONE_JOB_PER_RUN', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  harness.setActiveSpreadsheet(spreadsheet);
  const stableThreadKey = 'root:phase4-two-jobs';
  const threadId = 'synthetic-thread-two-jobs';
  seedEligibleTask(spreadsheet, {
    suffix: 'two-jobs-a',
    stable_thread_key: stableThreadKey,
    thread_id: threadId,
    due_date: '2026-08-20'
  });
  seedEligibleTask(spreadsheet, {
    suffix: 'two-jobs-b',
    stable_thread_key: stableThreadKey,
    thread_id: threadId,
    due_date: '2026-08-21'
  });
  const message = seedInformationMessage(spreadsheet, {
    message_id: 'synthetic-message-two-jobs',
    stable_thread_key: stableThreadKey,
    thread_id: threadId
  });
  const calendarGateway = new IndependentCalendarGateway();
  configureCalendar(calendarGateway);
  const clock = makeClock('2026-07-24T00:20:00.000Z');
  const pipeline = makeCountedPipeline(message);

  const first = runVertical(
    spreadsheet,
    message,
    calendarGateway,
    clock,
    { pipeline }
  ).result;
  assert.strictEqual(first.status, 'PAUSED');
  assert.strictEqual(first.checkpoint, 'CALENDAR');
  assert.strictEqual(calendarGateway.calls.eventInsert, 1);
  assert.deepStrictEqual(
    Array.from(outboxRecords(spreadsheet), (record) => record.status).sort(),
    ['DONE', 'PENDING']
  );

  const second = runVertical(
    spreadsheet,
    message,
    calendarGateway,
    clock,
    { pipeline }
  ).result;
  assert.strictEqual(second.status, 'COMPLETE');
  assert.strictEqual(second.checkpoint, 'DONE');
  assert.strictEqual(calendarGateway.calls.eventInsert, 2);
  assert.strictEqual(pipeline.counts.classify, 1);
  assert.strictEqual(pipeline.gateway.calls.refetch, 1);
  assert.deepStrictEqual(
    Array.from(outboxRecords(spreadsheet), (record) => record.status).sort(),
    ['DONE', 'DONE']
  );
});

test('P4-I05_STANDALONE_SYNC_CALLS_NO_GMAIL_OR_AI_AND_MAX_ONE_JOB', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  harness.setActiveSpreadsheet(spreadsheet);
  seedEligibleTask(spreadsheet, {
    suffix: 'standalone-a',
    stable_thread_key: 'root:standalone-a',
    thread_id: 'synthetic-standalone-a'
  });
  seedEligibleTask(spreadsheet, {
    suffix: 'standalone-b',
    stable_thread_key: 'root:standalone-b',
    thread_id: 'synthetic-standalone-b'
  });
  const calendarGateway = new IndependentCalendarGateway();
  configureCalendar(calendarGateway);
  const clock = makeClock('2026-07-24T00:20:00.000Z');
  const originalGmail = sandbox.WorkOsGmailGateway;
  const originalAi = sandbox.WorkOsAiAdapter;
  sandbox.WorkOsGmailGateway = new Proxy({}, {
    get() {
      throw new Error('Standalone Calendar sync accessed Gmail');
    }
  });
  sandbox.WorkOsAiAdapter = new Proxy({}, {
    get() {
      throw new Error('Standalone Calendar sync accessed AI');
    }
  });
  try {
    const first = sandbox.WorkOsWorker.syncPendingCalendarJobs({
      spreadsheet,
      calendar_gateway: calendarGateway,
      calendar_properties: scriptProperties(),
      instance_id: calendarGateway.instanceId,
      now: clock.now,
      budget: fixedBudget(false)
    });
    assert.strictEqual(first.status, 'COMPLETE');
    assert.strictEqual(first.processed_count, 1);
    assert.strictEqual(calendarGateway.calls.eventInsert, 1);
    assert.strictEqual(
      JSON.stringify(first.external_services),
      JSON.stringify({
        gmail: 'NOT_CALLED',
        ai: 'NOT_CALLED',
        calendar: 'ADVANCED_CALENDAR_SERVICE'
      })
    );
    assert.deepStrictEqual(
      Array.from(outboxRecords(spreadsheet), (record) => record.status).sort(),
      ['DONE', 'PENDING']
    );

    const second = sandbox.WorkOsWorker.syncPendingCalendarJobs({
      spreadsheet,
      calendar_gateway: calendarGateway,
      calendar_properties: scriptProperties(),
      instance_id: calendarGateway.instanceId,
      now: clock.now,
      budget: fixedBudget(false)
    });
    assert.strictEqual(second.processed_count, 1);
    assert.strictEqual(calendarGateway.calls.eventInsert, 2);
  } finally {
    sandbox.WorkOsGmailGateway = originalGmail;
    sandbox.WorkOsAiAdapter = originalAi;
  }
});

test('P4-I06_SOFT_BUDGET_PAUSES_BEFORE_CALENDAR_API', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  harness.setActiveSpreadsheet(spreadsheet);
  seedEligibleTask(spreadsheet, {
    suffix: 'budget',
    stable_thread_key: 'root:standalone-budget',
    thread_id: 'synthetic-standalone-budget'
  });
  const calendarGateway = new IndependentCalendarGateway();
  configureCalendar(calendarGateway);
  const clock = makeClock('2026-07-24T00:20:00.000Z');

  const result = sandbox.WorkOsWorker.syncPendingCalendarJobs({
    spreadsheet,
    calendar_gateway: calendarGateway,
    calendar_properties: scriptProperties(),
    instance_id: calendarGateway.instanceId,
    now: clock.now,
    budget: fixedBudget(true)
  });

  assert.strictEqual(result.status, 'PAUSED');
  assert.strictEqual(result.processed_count, 0);
  assert.strictEqual(calendarGateway.calls.eventInsert, 0);
  assert.strictEqual(calendarGateway.calls.eventUpdate, 0);
  assert.strictEqual(calendarGateway.calls.eventDelete, 0);
  assert.strictEqual(calendarGateway.calls.getCalendar, 0);
});

test('P4-I07_EDIT_HANDLER_QUEUES_ONLY_AND_USES_NON_NESTED_LOCKS', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  harness.setActiveSpreadsheet(spreadsheet);
  const task = seedEligibleTask(spreadsheet, {
    suffix: 'edit-handler',
    stable_thread_key: 'root:edit-handler',
    thread_id: 'synthetic-edit-handler'
  });
  const taskSheet = harness.taskSheet(spreadsheet);
  const taskContext = sandbox.WorkOsTaskRepository.createContext(taskSheet);
  const row = taskContext.byTaskId[task.task_id];
  const titleColumn = sandbox.WorkOsSchemas.buildColumnMapFromIds(
    sandbox.WorkOsSchemas.getInternalIds(sandbox.WorkOsConfig.SHEETS.TASKS)
  ).task_title + 1;
  taskSheet.getRange(row, titleColumn, 1, 1).setValues([
    ['Synthetic important deadline edited']
  ]);
  const lockAttemptsBefore = harness.getLockAttemptCount();

  const result = sandbox.WorkOsEditHandler.handle({
    range: taskSheet.getRange(row, titleColumn, 1, 1)
  });

  assert.strictEqual(result.status, 'COMPLETE');
  assert.strictEqual(result.calendar_outbox.pending_count, 1);
  assert.strictEqual(
    harness.getLockAttemptCount() - lockAttemptsBefore,
    3,
    'Edit handling must use three sequential locks, never a nested lock'
  );
  assert.strictEqual(outboxRecords(spreadsheet)[0].status, 'PENDING');
  const edited = harness.readTask(taskSheet, task.task_id);
  assert.strictEqual(edited.calendar_sync_status, 'PENDING');
  assert.strictEqual(edited.manual_fields.includes('task_title'), true);

  const editSource = fs.readFileSync(
    path.join(appsScriptRoot, '11_EditHandler.gs'),
    'utf8'
  );
  [
    /\bCalendar\./,
    /\bCalendarApp\b/,
    /AdvancedCalendarGateway/,
    /processNext(?:Pending)?Job/,
    /executeCalendarAction/,
    /\bGmail\./,
    /MockAiAdapter/,
    /UrlFetchApp/
  ].forEach((pattern) => {
    assert.strictEqual(pattern.test(editSource), false, String(pattern));
  });
});

test('P4-I07B_MANUAL_DEADLINE_PROVENANCE_DRIVES_CREATE_UPDATE_DELETE', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  harness.setActiveSpreadsheet(spreadsheet);
  const taskSheet = harness.taskSheet(spreadsheet);
  let inserted;
  sandbox.WorkOsTaskRepository.withLockedContext(
    taskSheet,
    (context) => {
      inserted = sandbox.WorkOsTaskRepository.upsertTask({
        origin_key: sandbox.WorkOsUtilities.makeOriginKey(
          'synthetic-manual-deadline-source',
          0
        ),
        task_title: 'Synthetic manual deadline',
        status: 'OPEN',
        needs_review: false,
        review_state: 'NONE',
        completed: false,
        excluded: false,
        due_date: '',
        suggested_due_date: '2026-08-19',
        deadline_basis: 'NONE',
        priority: 'HIGH',
        waiting_for_reply: false,
        calendar_sync_mode: 'FORCE',
        calendar_category: 'EXTERNAL_SUBMISSION',
        calendar_importance: 'HIGH',
        calendar_sync_status: 'NOT_REQUIRED',
        sender: 'sender@example.invalid',
        subject: 'Synthetic source subject',
        source_email: 'https://example.invalid/synthetic-reference',
        source_message_id: 'synthetic-manual-deadline-source',
        source_thread_id: 'synthetic-manual-deadline-thread',
        stable_thread_key: 'root:synthetic-manual-deadline',
        source_action_index: 0,
        ai_provider: 'MOCK',
        ai_model: 'mock-local',
        ai_prompt_version: 'phase4-manual-deadline'
      }, context);
    }
  );
  const taskContext =
    sandbox.WorkOsTaskRepository.createContext(taskSheet);
  const row = taskContext.byTaskId[inserted.task_id];
  const map = sandbox.WorkOsSchemas.buildColumnMapFromIds(
    sandbox.WorkOsSchemas.getInternalIds(
      sandbox.WorkOsConfig.SHEETS.TASKS
    )
  );

  harness.setTaskCell(
    taskSheet,
    row,
    'due_date',
    new Date(2026, 7, 20)
  );
  const created = sandbox.WorkOsEditHandler.handle({
    range: taskSheet.getRange(row, map.due_date + 1, 1, 1)
  });
  let task = harness.readTask(taskSheet, inserted.task_id);
  let outbox = outboxRecords(spreadsheet);
  assert.strictEqual(created.calendar_outbox.pending_count, 1);
  assert.strictEqual(task.deadline_basis, 'MANUAL_CONFIRMED');
  assert.strictEqual(task.suggested_due_date, '');
  assert.strictEqual(task.manual_fields.includes('due_date'), true);
  assert.strictEqual(outbox.length, 1);
  assert.strictEqual(outbox[0].desired_action, 'CREATE');

  sandbox.WorkOsTaskRepository.withLockedContext(
    taskSheet,
    (context) => {
      sandbox.WorkOsTaskRepository.applyCalendarPatch(
        inserted.task_id,
        {
          calendar_event_id: 'evt_synthetic_manual_deadline',
          calendar_sync_status: 'SYNCED'
        },
        context,
        new Date('2026-07-24T00:21:00.000Z')
      );
    }
  );
  harness.setTaskCell(
    taskSheet,
    row,
    'due_date',
    new Date(2026, 7, 21)
  );
  const updated = sandbox.WorkOsEditHandler.handle({
    range: taskSheet.getRange(row, map.due_date + 1, 1, 1)
  });
  task = harness.readTask(taskSheet, inserted.task_id);
  outbox = outboxRecords(spreadsheet);
  assert.strictEqual(updated.calendar_outbox.pending_count, 1);
  assert.strictEqual(task.deadline_basis, 'MANUAL_CONFIRMED');
  assert.strictEqual(outbox.length, 1);
  assert.strictEqual(outbox[0].desired_action, 'UPDATE');

  harness.setTaskCell(taskSheet, row, 'due_date', '');
  const deleted = sandbox.WorkOsEditHandler.handle({
    range: taskSheet.getRange(row, map.due_date + 1, 1, 1)
  });
  task = harness.readTask(taskSheet, inserted.task_id);
  outbox = outboxRecords(spreadsheet);
  assert.strictEqual(deleted.calendar_outbox.delete_pending_count, 1);
  assert.strictEqual(task.due_date, '');
  assert.strictEqual(task.deadline_basis, 'NONE');
  assert.strictEqual(task.suggested_due_date, '');
  assert.strictEqual(task.manual_fields.includes('due_date'), true);
  assert.strictEqual(task.calendar_sync_status, 'DELETE_PENDING');
  assert.strictEqual(outbox.length, 1);
  assert.strictEqual(outbox[0].desired_action, 'DELETE');
});

test('P4-I08_SETUP_MANIFEST_DIAGNOSTIC_AND_PHASE_BOUNDARIES', () => {
  const setupSource = fs.readFileSync(
    path.join(appsScriptRoot, '02_Setup.gs'),
    'utf8'
  );
  const diagnosticSource = fs.readFileSync(
    path.join(appsScriptRoot, '16_Diagnostics.gs'),
    'utf8'
  );
  const triggerSource = fs.readFileSync(
    path.join(appsScriptRoot, '12_Triggers.gs'),
    'utf8'
  );
  const allGs = fs.readdirSync(appsScriptRoot)
    .filter((name) => name.endsWith('.gs'))
    .map((name) => fs.readFileSync(path.join(appsScriptRoot, name), 'utf8'))
    .join('\n');
  const manifest = JSON.parse(fs.readFileSync(
    path.join(appsScriptRoot, 'appsscript.json'),
    'utf8'
  ));
  const calendarService = manifest.dependencies.enabledAdvancedServices
    .filter((service) => service.userSymbol === 'Calendar');

  assert.strictEqual(calendarService.length, 1);
  assert.deepStrictEqual(calendarService[0], {
    userSymbol: 'Calendar',
    version: 'v3',
    serviceId: 'calendar'
  });
  assert.strictEqual(
    manifest.oauthScopes.includes(
      'https://www.googleapis.com/auth/calendar.app.created'
    ),
    true
  );
  assert.strictEqual(
    manifest.oauthScopes.includes(
      'https://www.googleapis.com/auth/calendar.calendarlist.readonly'
    ),
    true
  );
  [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.events.owned',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/script.external_request'
  ].forEach((scope) => {
    assert.strictEqual(manifest.oauthScopes.includes(scope), false, scope);
  });
  assert.match(
    setupSource,
    /S60_CREATE_DEADLINE_CALENDAR[\s\S]*ensureDedicatedCalendar/
  );
  assert.match(
    setupSource,
    /S80_CREATE_EDIT_TRIGGER[\s\S]*WorkOsAutomation\.ensureEditTrigger\(\)/
  );
  assert.match(
    setupSource,
    /S99_COMPLETE[\s\S]*READY_FOR_PHASE8B_SANDBOX_RETRANSFER/
  );
  assert.strictEqual(/\bCalendar\./.test(diagnosticSource), false);
  assert.strictEqual(/\bCalendarApp\b/.test(diagnosticSource), false);
  assert.strictEqual(/ensureDedicatedCalendar/.test(diagnosticSource), false);
  assert.match(
    diagnosticSource,
    /EDIT_TRIGGER_POLICY[\s\S]*setup_creates_trigger:\s*true/
  );
  assert.match(
    diagnosticSource,
    /EDIT_TRIGGER_REAL_LIST[\s\S]*live_edit_event_execution:\s*'NOT_EXECUTED'/
  );
  assert.match(
    diagnosticSource,
    /CALENDAR_PROPERTY_CONFIGURATION[\s\S]*'PASS'/
  );
  assert.match(
    diagnosticSource,
    /CALENDAR_REMOTE_VERIFICATION[\s\S]*'WARN'[\s\S]*NOT_EXECUTED/
  );
  assert.strictEqual(/ScriptApp\.newTrigger/.test(triggerSource), false);
  assert.strictEqual(/\bUrlFetchApp\b/.test(allGs), false);
  assert.match(
    triggerSource,
    /EDIT_HANDLER_FUNCTION[\s\S]*forSpreadsheet\(spreadsheet\)\.onEdit\(\)/
  );
  const taskRepositorySource = fs.readFileSync(
    path.join(appsScriptRoot, '08_TaskRepository.gs'),
    'utf8'
  );
  const appendPath = taskRepositorySource.slice(
    taskRepositorySource.indexOf('function findLogicalEmptyRow'),
    taskRepositorySource.indexOf('function createContext')
  );
  assert.strictEqual(/\bgetLastRow\s*\(/.test(appendPath), false);
  assert.strictEqual(
    /AUTHORITY_LEDGER_MAX_DATA_ROWS/.test(taskRepositorySource),
    true
  );
  assert.strictEqual(
    /GeminiAdapter|GoogleGenAI|generativelanguage\.googleapis/.test(allGs),
    false
  );
});

test('P4-I09_OWNERSHIP_AND_IDEMPOTENCY_STOP_FOREIGN_MUTATION', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  harness.setActiveSpreadsheet(spreadsheet);
  const task = seedEligibleTask(spreadsheet, {
    suffix: 'foreign-event',
    stable_thread_key: 'root:foreign-event',
    thread_id: 'synthetic-foreign-event'
  });
  const gateway = new IndependentCalendarGateway();
  configureCalendar(gateway);
  const initial = sandbox.WorkOsCalendarSync.buildEventResource(
    task,
    gateway.instanceId,
    sandbox.WorkOsConfig.TIMEZONE
  );
  gateway.events.set(initial.id, structuredClone(initial));
  gateway.foreignEvent = true;
  const taskPatches = [];
  sandbox.WorkOsCalendarSync.enqueueTask(task, {
    sheet: syncSheet(spreadsheet),
    now: new Date('2026-07-24T00:20:00.000Z'),
    timezone: sandbox.WorkOsConfig.TIMEZONE
  });

  const result = sandbox.WorkOsCalendarSync.processNextPendingJob({
    sheet: syncSheet(spreadsheet),
    gateway,
    properties: scriptProperties(),
    instance_id: gateway.instanceId,
    now: new Date('2026-07-24T00:20:00.000Z'),
    budget: fixedBudget(false),
    task_reader: () => task,
    task_writer: (_taskId, patch) => {
      taskPatches.push({ ...patch });
    }
  });

  assert.strictEqual(result.processed_count, 1);
  assert.strictEqual(result.result.status, 'DEAD');
  assert.strictEqual(result.result.error_code, 'E_CALENDAR_EVENT_FOREIGN');
  assert.strictEqual(gateway.calls.eventUpdate, 0);
  assert.strictEqual(gateway.calls.eventDelete, 0);
  assert.strictEqual(gateway.events.size, 1);
  assert.strictEqual(
    JSON.stringify(taskPatches),
    JSON.stringify([{ calendar_sync_status: 'ERROR' }])
  );
});

test('P4-I10_ERROR_IDENTIFIERS_CANNOT_CARRY_CREDENTIAL_TEXT', () => {
  const malicious = new sandbox.WorkOsAppError(
    'token=synthetic-secret-must-not-persist',
    'stage=password=synthetic-secret-must-not-persist',
    false,
    'Safe public message'
  );
  const safe = sandbox.WorkOsUtilities.safeError(
    malicious,
    'CALENDAR_SYNC'
  );
  assert.match(String(safe.code), /^[A-Z][A-Z0-9_]{0,79}$/);
  assert.match(String(safe.stage), /^[A-Z][A-Z0-9_]{0,79}$/);
  assert.strictEqual(
    JSON.stringify(safe).includes('synthetic-secret-must-not-persist'),
    false
  );

  const invalidInstanceGateway = new IndependentCalendarGateway();
  harness.scriptProperties.set(
    sandbox.WorkOsConfig.PROPERTIES.INSTANCE_ID,
    'token=synthetic-secret-must-not-persist'
  );
  assert.throws(
    () => sandbox.WorkOsCalendarSync.ensureDedicatedCalendar({
      gateway: invalidInstanceGateway,
      properties: scriptProperties()
    }),
    (error) => error &&
      error.code === 'E_CALENDAR_INSTANCE_INVALID' &&
      !String(error.safeMessage || '').includes(
        'synthetic-secret-must-not-persist'
      )
  );
  assert.strictEqual(invalidInstanceGateway.calls.listCalendars, 0);
  assert.strictEqual(invalidInstanceGateway.calls.createCalendar, 0);

  const spreadsheet = harness.makeOperationalSpreadsheet();
  const rawMessageId = 'synthetic-message-private-log-reference';
  const rawThreadId = 'synthetic-thread-private-log-reference';
  sandbox.WorkOsLogAndDeadLetter.recordMessageError(
    new Error('Synthetic generic failure'),
    {
      message_id: rawMessageId,
      thread_id: rawThreadId,
      retry_count: 1,
      processing_status: 'RETRY'
    },
    'run_synthetic_private_log_reference',
    spreadsheet
  );
  const errorLogText = JSON.stringify(
    spreadsheet.getSheetByName(
      sandbox.WorkOsConfig.SHEETS.ERRORS
    ).cells
  );
  assert.strictEqual(errorLogText.includes(rawMessageId), false);
  assert.strictEqual(errorLogText.includes(rawThreadId), false);
  assert.match(errorLogText, /msgref_[0-9a-f]{64}/);
  assert.match(errorLogText, /thrref_[0-9a-f]{64}/);

  const outboxSheet = syncSheet(spreadsheet);
  outboxSheet.getRange(
    sandbox.WorkOsConfig.DATA_START_ROW,
    1,
    1,
    sandbox.WorkOsCalendarSync.OUTBOX_IDS.length
  ).setValues([[
    `syn_${'a'.repeat(32)}`,
    `tsk_${'b'.repeat(32)}`,
    'DEADLINE_CALENDAR',
    'CREATE',
    '',
    'DEAD',
    3,
    '',
    new Date('2026-07-24T00:00:00.000Z'),
    '',
    'token=synthetic-secret-must-not-persist',
    new Date('2026-07-24T00:00:00.000Z')
  ]]);
  assert.throws(
    () => sandbox.WorkOsCalendarSync.createOutboxContext(outboxSheet),
    (error) => error &&
      error.code === 'E_CALENDAR_OUTBOX_CORRUPT' &&
      !String(error.safeMessage || '').includes(
        'synthetic-secret-must-not-persist'
      )
  );
});

test('P4-I11_GMAIL_REFERENCE_REACHES_TASK_AND_EVENT_ONLY', () => {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  harness.setActiveSpreadsheet(spreadsheet);
  const messageId = 'synthetic-message-source-reference';
  const threadId = 'synthetic-thread-source-reference';
  const stableThreadKey = 'root:synthetic-source-reference';
  const sourceEmail = sandbox.WorkOsGmailGateway.makeSourceEmailUrl(threadId);
  const message = harness.rawMessage('NEW_HIGH', {
    message_id: messageId,
    thread_id: threadId,
    stable_thread_key: stableThreadKey
  });
  message.source_email = sourceEmail;
  harness.seedPreprocessed(spreadsheet, message);

  const calendarGateway = new IndependentCalendarGateway();
  configureCalendar(calendarGateway);
  const pipeline = makeCountedPipeline(message);
  const mockAdapter = new sandbox.WorkOsAiAdapter.MockAiAdapter();
  let aiInput = null;
  pipeline.adapter = {
    healthCheck: () => mockAdapter.healthCheck(),
    classify: (input) => {
      aiInput = structuredClone(input);
      const output = structuredClone(mockAdapter.classify(input));
      output.actions[0].calendar_category = 'EXTERNAL_SUBMISSION';
      output.actions[0].calendar_importance = 'LOW';
      return sandbox.WorkOsAiAdapter.validateOutput(output);
    }
  };

  const run = runVertical(
    spreadsheet,
    message,
    calendarGateway,
    makeClock('2026-07-24T00:20:00.000Z'),
    { pipeline }
  );

  assert.strictEqual(run.result.status, 'COMPLETE');
  assert.strictEqual(run.result.checkpoint, 'DONE');
  const taskSheet = harness.taskSheet(spreadsheet);
  let tasks = harness.allTasks(taskSheet);
  assert.strictEqual(tasks.length, 1);
  assert.strictEqual(tasks[0].source_email, sourceEmail);

  const taskContextBeforeEdit =
    sandbox.WorkOsTaskRepository.createContext(taskSheet);
  const physicalRow = taskContextBeforeEdit.byTaskId[tasks[0].task_id];
  harness.setTaskCell(
    taskSheet,
    physicalRow,
    'calendar_sync_mode',
    sandbox.WorkOsSchemas.toSheetEnum('CalendarSyncMode', 'FORCE')
  );
  sandbox.WorkOsTaskRepository.applyUserEdits(
    taskSheet,
    [{ row: physicalRow, column_ids: ['calendar_sync_mode'] }],
    new Date('2026-07-24T00:21:00.000Z')
  );
  tasks = harness.allTasks(taskSheet);

  sandbox.WorkOsUtilities.withScriptLock((lock) => {
    const outboxContext =
      sandbox.WorkOsCalendarSync.createOutboxContextForHeldLock(
        syncSheet(spreadsheet),
        lock
      );
    sandbox.WorkOsCalendarSync.enqueueTaskInContext(
      tasks[0],
      outboxContext,
      {
        now: new Date('2026-07-24T00:22:00.000Z'),
        timezone: sandbox.WorkOsConfig.TIMEZONE
      }
    );
  }, sandbox.WorkOsConfig.LOCK_WAIT_MS);
  const sync = sandbox.WorkOsCalendarSync.processNextJob({
    sheet: syncSheet(spreadsheet),
    gateway: calendarGateway,
    properties: scriptProperties(),
    instance_id: calendarGateway.instanceId,
    now: new Date('2026-07-24T00:22:00.000Z'),
    budget: fixedBudget(false),
    task_reader_in_context: (taskId, lock) => {
      const context =
        sandbox.WorkOsTaskRepository.createContextForHeldLock(
          taskSheet,
          lock
        );
      return sandbox.WorkOsTaskRepository.findByTaskId(context, taskId);
    },
    task_writer_in_context: (taskId, patch, _expected, lock) => {
      const context =
        sandbox.WorkOsTaskRepository.createContextForHeldLock(
          taskSheet,
          lock
        );
      return sandbox.WorkOsTaskRepository.applyCalendarPatch(
        taskId,
        patch,
        context,
        new Date('2026-07-24T00:22:00.000Z')
      );
    }
  });
  assert.strictEqual(sync.processed_count, 1);
  assert.strictEqual(sync.result.status, 'DONE');

  assert.strictEqual(calendarGateway.events.size, 1);
  const event = Array.from(calendarGateway.events.values())[0];
  assert.strictEqual(event.description.includes(sourceEmail), true);
  assert.strictEqual(event.description.includes(message.plain_body), false);
  assert.strictEqual(JSON.stringify(aiInput).includes(sourceEmail), false);
  assert.strictEqual(JSON.stringify(run.result).includes(sourceEmail), false);

  const logText = JSON.stringify([
    sandbox.WorkOsConfig.SHEETS.RUN_HISTORY,
    sandbox.WorkOsConfig.SHEETS.ERRORS
  ].map((sheetName) => {
    const sheet = spreadsheet.getSheetByName(sheetName);
    return sheet ? sheet.values : [];
  }));
  assert.strictEqual(logText.includes(sourceEmail), false);
});

const failed = tests.filter((item) => item.status === 'FAIL');
console.log(JSON.stringify({
  phase: 4,
  suite: 'independent_worker_integration',
  local_mock: failed.length ? 'FAIL' : 'PASS',
  google_workspace_real: 'NOT_EXECUTED',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
}, null, 2));
if (failed.length) {
  process.exitCode = 1;
}
