'use strict';

/**
 * Phase 6 scheduled Worker integration tests.
 *
 * Reuses the Phase 3 in-memory Apps Script facade. No real Gmail, Trigger,
 * Calendar, AI provider, Spreadsheet, or LockService is contacted.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const phase3Path = path.resolve(__dirname, 'phase3_local_test.js');
const source = fs.readFileSync(phase3Path, 'utf8').replace(/\r\n/g, '\n');
const marker = '\nconst summary = {\n';
const markerIndex = source.lastIndexOf(marker);
if (markerIndex < 0) {
  throw new Error('PHASE3_FIXTURE_REPORT_MARKER_NOT_FOUND');
}

const exposure = `
globalThis.__phase6WorkerFixture = {
  sandbox,
  makeOperationalSpreadsheet,
  rawMessage,
  seedPreprocessed,
  taskSheet,
  stateSheet,
  allTasks,
  scriptProperties,
  getScriptProperties: function () {
    return sandbox.PropertiesService.getScriptProperties();
  },
  setLockAvailable: function (value) {
    lockAvailable = value === true;
  },
  getLockAttempts: function () {
    return lockAttemptCount;
  },
  isLockHeld: function () {
    return globalLockHeld;
  },
  resetLockMetrics: function () {
    lockAttemptCount = 0;
    globalLockHeld = false;
    lockAvailable = true;
  }
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
vm.runInContext(
  source.slice(0, markerIndex) + exposure,
  context,
  { filename: 'phase3_phase6_fixture.js' }
);

const fixture = context.__phase6WorkerFixture;
const sandbox = fixture.sandbox;
const Worker = sandbox.WorkOsWorker;
const State = sandbox.WorkOsMessageStateRepository;
const Config = sandbox.WorkOsConfig;
const FixtureDate = sandbox.Date;

function candidateFor(message) {
  return {
    message_id: message.message_id,
    thread_id: message.thread_id,
    stable_thread_key: message.stable_thread_key,
    received_at: message.received_at,
    source_mode: 'AUTOMATIC',
    manual_decision: 'PROCESS',
    message_refs: [{
      id: message.message_id,
      internal_date: message.received_at.getTime()
    }]
  };
}

function automaticGateway(messages, options = {}) {
  const byId = new Map(messages.map((item) => [item.message_id, item]));
  const calls = {
    list: 0,
    fetch: [],
    refetch: [],
    aiLabels: [],
    failureLabels: []
  };
  return {
    calls,
    listAutomaticCandidates(settings) {
      calls.list += 1;
      if (options.list_error) {
        throw new sandbox.WorkOsAppError(
          'E_GMAIL_FETCH',
          'GMAIL_AUTOMATIC_SEARCH',
          true,
          'Synthetic Gmail search failure'
        );
      }
      const known = settings.known_message_ids || {};
      const candidates = messages
        .filter((item) => !known[item.message_id])
        .map(candidateFor)
        .slice(0, Config.AUTOMATION_MAX_MESSAGES_PER_RUN);
      return {
        candidates,
        searched_threads: messages.length,
        search_saturated: options.search_saturated === true,
        candidate_overflow: options.candidate_overflow === true,
        search_complete: options.search_complete !== false,
        resume_page_token: options.resume_page_token || ''
      };
    },
    fetchSelectedContent(candidate) {
      calls.fetch.push(candidate.message_id);
      return byId.get(candidate.message_id);
    },
    refetchMessageContent(record) {
      calls.refetch.push(record.message_id);
      return byId.get(record.message_id);
    },
    syncAiLabels(threadId, labels) {
      calls.aiLabels.push({
        thread_id: threadId,
        labels: Array.from(labels)
      });
      return { added_count: labels.length, removed_count: 0 };
    },
    setSystemFailureLabel(threadId, enabled) {
      calls.failureLabels.push({ thread_id: threadId, enabled });
      return { added_count: enabled ? 1 : 0, removed_count: enabled ? 0 : 1 };
    }
  };
}

function allStates(spreadsheet) {
  return State.createContext(fixture.stateSheet(spreadsheet)).logicalRows;
}

function runHistoryValues(spreadsheet) {
  return spreadsheet.getSheetByName(Config.SHEETS.RUN_HISTORY).cells;
}

function properties() {
  fixture.scriptProperties.clear();
  return fixture.getScriptProperties();
}

function clockAt(iso) {
  return () => new FixtureDate(iso);
}

class AutomaticCalendarGateway {
  constructor() {
    this.calendarId = 'calendar_synthetic_automatic';
    this.instanceId = 'ins_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
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

  assertUnlocked() {
    assert.strictEqual(
      fixture.isLockHeld(),
      false,
      'Calendar external I/O ran while Script Lock was held'
    );
  }

  listCalendarsBySummary() {
    this.assertUnlocked();
    this.calls.listCalendars += 1;
    return [];
  }

  getCalendar(calendarId) {
    this.assertUnlocked();
    this.calls.getCalendar += 1;
    if (String(calendarId) !== this.calendarId) {
      return null;
    }
    return {
      id: this.calendarId,
      summary: Config.DEADLINE_CALENDAR_NAME,
      description: `[WORKOS_INSTANCE_ID:${this.instanceId}]`,
      accessRole: 'owner',
      primary: false
    };
  }

  createCalendar(summary, instanceId) {
    this.assertUnlocked();
    this.calls.createCalendar += 1;
    this.instanceId = String(instanceId);
    return {
      id: this.calendarId,
      summary,
      description: `[WORKOS_INSTANCE_ID:${this.instanceId}]`,
      accessRole: 'owner'
    };
  }

  isPrimaryCalendar() {
    return false;
  }

  getCalendarAccessRole() {
    return 'owner';
  }

  getEvent(_calendarId, eventId) {
    this.assertUnlocked();
    this.calls.eventGet += 1;
    const event = this.events.get(String(eventId));
    return event ? structuredClone(event) : null;
  }

  findEventsByTaskMarker(_calendarId, taskId) {
    this.assertUnlocked();
    this.calls.eventFind += 1;
    return Array.from(this.events.values())
      .filter((event) => (
        event.extendedProperties &&
        event.extendedProperties.private &&
        event.extendedProperties.private.workosTaskId === taskId
      ))
      .map((event) => structuredClone(event));
  }

  insertEvent(calendarId, resource) {
    this.assertUnlocked();
    this.calls.eventInsert += 1;
    assert.strictEqual(calendarId, this.calendarId);
    if (this.events.has(String(resource.id))) {
      const conflict = new Error('Synthetic deterministic ID conflict');
      conflict.status = 409;
      throw conflict;
    }
    this.events.set(String(resource.id), structuredClone(resource));
    return structuredClone(resource);
  }

  updateEvent(calendarId, eventId, resource) {
    this.assertUnlocked();
    this.calls.eventUpdate += 1;
    assert.strictEqual(calendarId, this.calendarId);
    const updated = {
      ...structuredClone(resource),
      id: String(eventId)
    };
    this.events.set(String(eventId), updated);
    return structuredClone(updated);
  }

  deleteEvent(calendarId, eventId) {
    this.assertUnlocked();
    this.calls.eventDelete += 1;
    assert.strictEqual(calendarId, this.calendarId);
    return this.events.delete(String(eventId));
  }
}

function configuredAutomaticCalendar(propertiesStore, gateway) {
  propertiesStore.setProperty(
    Config.PROPERTIES.INSTANCE_ID,
    gateway.instanceId
  );
  propertiesStore.setProperty(
    Config.PROPERTIES.DEADLINE_CALENDAR_ID,
    gateway.calendarId
  );
}

function seedEligibleCalendarTask(spreadsheet, options = {}) {
  const sourceMessageId = options.source_message_id ||
    'synthetic-calendar-source';
  let result;
  sandbox.WorkOsTaskRepository.withLockedContext(
    fixture.taskSheet(spreadsheet),
    (context) => {
      result = sandbox.WorkOsTaskRepository.upsertTask({
        origin_key: sandbox.WorkOsUtilities.makeOriginKey(sourceMessageId, 0),
        task_title: 'Synthetic important deadline',
        status: 'OPEN',
        needs_review: false,
        review_state: 'NONE',
        completed: false,
        excluded: false,
        due_date: '2026-08-20',
        deadline_basis: 'EXPLICIT',
        priority: 'HIGH',
        waiting_for_reply: false,
        calendar_sync_mode: 'FORCE',
        calendar_category: 'EXTERNAL_SUBMISSION',
        calendar_importance: 'HIGH',
        calendar_sync_status: 'NOT_REQUIRED',
        sender: 'sender@example.invalid',
        subject: 'Synthetic source subject',
        source_email: 'https://example.invalid/synthetic-reference',
        source_message_id: sourceMessageId,
        source_thread_id: options.thread_id,
        stable_thread_key: options.stable_thread_key,
        source_action_index: 0,
        ai_provider: 'MOCK',
        ai_model: 'mock-local',
        ai_prompt_version: 'phase6-calendar-regression'
      }, context);
    }
  );
  return result;
}

function workerWithCalendarLimit(limitValue, omitLimit) {
  const workerContext = {};
  Object.getOwnPropertyNames(sandbox).forEach((key) => {
    workerContext[key] = sandbox[key];
  });
  const configOverride = { ...Config };
  if (omitLimit) {
    delete configOverride.CALENDAR_MAX_JOBS_PER_RUN;
  } else {
    configOverride.CALENDAR_MAX_JOBS_PER_RUN = limitValue;
  }
  workerContext.WorkOsConfig = Object.freeze(configOverride);
  vm.createContext(workerContext);
  vm.runInContext(
    fs.readFileSync(
      path.join(path.resolve(__dirname, '..'), 'apps-script-v2', '18_Worker.gs'),
      'utf8'
    ),
    workerContext,
    { filename: '18_Worker.calendar-limit.gs' }
  );
  return workerContext.WorkOsWorker;
}

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
  } finally {
    fixture.setLockAvailable(true);
    fixture.scriptProperties.clear();
  }
}

test('P6-I00_PRODUCTION_PATH_NEVER_FALLS_BACK_TO_MOCK', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const gateway = automaticGateway([]);
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway,
    properties: properties(),
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.status, 'FAILED');
  assert.strictEqual(result.note, 'E_AI_ADAPTER_REQUIRED');
  assert.strictEqual(result.log_recorded, true);
  assert.strictEqual(gateway.calls.list, 0);
});

test('P6-I00B_PRODUCTION_SHAPED_INTERNAL_VERTICAL_BYPASSES_ONLY_PRIVATE_GUARD', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-production-shaped'
  });
  const gateway = automaticGateway([message]);
  const props = properties();
  props.setProperty(
    Config.PROPERTIES.AUTOMATION_PILOT_STARTED_AT,
    '2026-07-24T00:00:00.000Z'
  );
  const mockClassifier = new sandbox.WorkOsAiAdapter.MockAiAdapter();
  const productionAdapter = {
    healthCheck: () => ({
      provider: 'SYNTHETIC_APPROVED_PROVIDER',
      model: 'synthetic-model',
      prompt_version: 'synthetic-prompt-v1',
      status: 'READY',
      credential_configured: true,
      external_request: false
    }),
    getMetadata: () => ({
      provider: 'SYNTHETIC_APPROVED_PROVIDER',
      model: 'synthetic-model',
      prompt_version: 'synthetic-prompt-v1'
    }),
    classify: (input) => mockClassifier.classify(input)
  };
  const productionContext = {};
  Object.getOwnPropertyNames(sandbox).forEach((key) => {
    productionContext[key] = sandbox[key];
  });
  productionContext.WorkOsConfig = Object.freeze({
    ...Config,
    TEST_MODE: false
  });
  productionContext.WorkOsAiAdapter = Object.freeze({
    ...sandbox.WorkOsAiAdapter,
    createProductionExternalAdapter: () => productionAdapter
  });
  productionContext.WorkOsGmailGateway = gateway;
  productionContext.WorkOsRuntimeSettings = Object.freeze({
    readSnapshot: () => Object.freeze({
      source: 'SYNTHETIC_SETTINGS_SHEET',
      settings_read_count: 1,
      manual_max_messages: Config.MANUAL_MAX_MESSAGES,
      automation_max_messages_per_run:
        Config.AUTOMATION_MAX_MESSAGES_PER_RUN,
      manual_worker_soft_limit_ms:
        Config.MANUAL_WORKER_SOFT_LIMIT_MS,
      automation_worker_soft_limit_ms:
        Config.AUTOMATION_WORKER_SOFT_LIMIT_MS
    })
  });
  productionContext.SpreadsheetApp = {
    getActiveSpreadsheet: () => spreadsheet
  };
  productionContext.PropertiesService = {
    getScriptProperties: () => props
  };
  vm.createContext(productionContext);
  vm.runInContext(
    fs.readFileSync(
      path.join(path.resolve(__dirname, '..'), 'apps-script-v2', '18_Worker.gs'),
      'utf8'
    ),
    productionContext,
    { filename: '18_Worker.production-shaped.gs' }
  );
  const result =
    productionContext.WorkOsWorker.processAutomaticBatch();
  assert.strictEqual(result.status, 'COMPLETE');
  assert.strictEqual(result.processed_count, 1);
  assert.deepStrictEqual(gateway.calls.fetch, [
    'synthetic-production-shaped'
  ]);
  assert.deepStrictEqual(gateway.calls.refetch, []);
  assert.strictEqual(allStates(spreadsheet)[0].processing_status, 'DONE');
});

test('P6-I00C_PRODUCTION_AI_TRANSPORT_RUNS_OUTSIDE_LOCK_WITH_CAS_COMMIT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-lock-free-production-ai'
  });
  fixture.seedPreprocessed(spreadsheet, message);
  const gateway = automaticGateway([message]);
  const mockClassifier = new sandbox.WorkOsAiAdapter.MockAiAdapter();
  let classifyCalls = 0;
  const productionAdapter = {
    healthCheck: () => ({
      status: 'READY',
      credential_configured: true,
      external_request: false
    }),
    getMetadata: () => ({
      provider: 'SYNTHETIC_APPROVED_PROVIDER',
      model: 'synthetic-model',
      prompt_version: 'synthetic-prompt-v1'
    }),
    classify(input) {
      classifyCalls += 1;
      assert.strictEqual(fixture.isLockHeld(), false);
      return mockClassifier.classify(input);
    }
  };
  fixture.resetLockMetrics();
  const result = Worker.processProductionClassificationOnce({
    spreadsheet,
    gateway,
    adapter: productionAdapter,
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: {
      isExhausted: () => false,
      remainingMs: () => 120000
    }
  });
  assert.strictEqual(result.status, 'CLASSIFIED');
  assert.strictEqual(result.external_transport_outside_lock, true);
  assert.strictEqual(classifyCalls, 1);
  assert.deepStrictEqual(gateway.calls.refetch, [
    'synthetic-lock-free-production-ai'
  ]);
  assert.strictEqual(allStates(spreadsheet)[0].processing_status, 'CLASSIFIED');
  assert.strictEqual(allStates(spreadsheet)[0].resume_stage, 'TASK_WRITE');
  assert.strictEqual(fixture.isLockHeld(), false);
  assert.ok(fixture.getLockAttempts() >= 2);
});

test('P6-I00D_AUTOMATIC_PILOT_REQUIRES_START_BOUNDARY_BEFORE_SERVICES', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-pilot-missing-start'
  });
  const gateway = automaticGateway([message]);
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway,
    properties: properties(),
    pilot_only: true,
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.status, 'FAILED');
  assert.strictEqual(result.note, 'E_AUTOMATION_PILOT_START_BOUNDARY_MISSING');
  assert.strictEqual(gateway.calls.list, 0);
  assert.deepStrictEqual(gateway.calls.fetch, []);
  assert.deepStrictEqual(gateway.calls.refetch, []);
});

test('P6-I01_NEW_INBOX_MESSAGE_REACHES_DONE_AND_ADVANCES_WATERMARK', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-auto-success'
  });
  const gateway = automaticGateway([message]);
  const props = properties();
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway,
    properties: props,
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.status, 'COMPLETE');
  assert.strictEqual(result.processed_count, 1);
  assert.strictEqual(result.inbox_processed_count, 1);
  assert.strictEqual(result.watermark_advanced, true);
  assert.strictEqual(allStates(spreadsheet).length, 1);
  assert.strictEqual(allStates(spreadsheet)[0].processing_status, 'DONE');
  assert.strictEqual(
    props.getProperty(Config.PROPERTIES.AUTOMATION_WATERMARK_AT),
    '2026-07-24T12:00:00.000Z'
  );
  assert.deepStrictEqual(gateway.calls.fetch, ['synthetic-auto-success']);
  assert.deepStrictEqual(gateway.calls.refetch, []);
});

test('P6-I02_REPLAY_IS_MESSAGE_ID_IDEMPOTENT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-auto-replay'
  });
  const gateway = automaticGateway([message]);
  const props = properties();
  const settings = {
    spreadsheet,
    gateway,
    properties: props,
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  };
  const first = Worker.processAutomaticBatch(settings);
  const second = Worker.processAutomaticBatch({
    ...settings,
    now: clockAt('2026-07-24T12:05:00.000Z')
  });
  assert.strictEqual(first.processed_count, 1);
  assert.strictEqual(second.processed_count, 0);
  assert.strictEqual(allStates(spreadsheet).length, 1);
  assert.strictEqual(gateway.calls.fetch.length, 1);
  assert.strictEqual(fixture.allTasks(fixture.taskSheet(spreadsheet)).length, 0);
});

test('P6-I02A_HISTORICAL_AUTOMATIC_PILOT_BACKLOG_IS_NOT_CONSUMED', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-historical-pilot',
    source_mode: 'AUTOMATIC_PILOT',
    received_at: '2026-07-24T00:30:00.000Z'
  });
  fixture.seedPreprocessed(spreadsheet, message);
  const gateway = automaticGateway([message]);
  const props = properties();
  props.setProperty(
    Config.PROPERTIES.AUTOMATION_PILOT_STARTED_AT,
    '2026-07-24T01:00:00.000Z'
  );
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway,
    properties: props,
    pilot_only: true,
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.status, 'COMPLETE');
  assert.strictEqual(result.processed_count, 0);
  assert.deepStrictEqual(gateway.calls.refetch, []);
  assert.strictEqual(
    allStates(spreadsheet)[0].processing_status,
    'PREPROCESSED'
  );
});

test('P6-I02B_INFORMATION_ONLY_HAS_NO_TASK_OR_CALENDAR_SIDE_EFFECT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const stableThreadKey = 'root:synthetic-auto-calendar-success';
  const threadId = 'synthetic-thread-auto-calendar-success';
  seedEligibleCalendarTask(spreadsheet, {
    source_message_id: 'synthetic-source-auto-calendar-success',
    thread_id: threadId,
    stable_thread_key: stableThreadKey
  });
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-auto-calendar-success',
    thread_id: threadId,
    stable_thread_key: stableThreadKey
  });
  fixture.seedPreprocessed(spreadsheet, message);
  const gateway = automaticGateway([message]);
  const calendarGateway = new AutomaticCalendarGateway();
  const props = properties();
  configuredAutomaticCalendar(props, calendarGateway);
  const settings = {
    spreadsheet,
    gateway,
    properties: props,
    calendar_properties: props,
    calendar_gateway: calendarGateway,
    instance_id: calendarGateway.instanceId,
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  };
  const first = Worker.processAutomaticBatch(settings);
  const second = Worker.processAutomaticBatch({
    ...settings,
    now: clockAt('2026-07-24T12:05:00.000Z')
  });
  assert.strictEqual(first.status, 'COMPLETE');
  assert.strictEqual(first.processed_count, 1);
  assert.strictEqual(first.calendar_job_count, 0,
    `information-only calendar_job_count=${first.calendar_job_count}`);
  assert.strictEqual(allStates(spreadsheet)[0].processing_status, 'DONE');
  assert.strictEqual(
    fixture.allTasks(fixture.taskSheet(spreadsheet)).length,
    1
  );
  assert.strictEqual(
    fixture.allTasks(fixture.taskSheet(spreadsheet))[0].calendar_sync_status,
    'NOT_REQUIRED',
    `information-only task calendar status=${fixture.allTasks(
      fixture.taskSheet(spreadsheet)
    )[0].calendar_sync_status}`
  );
  assert.strictEqual(second.processed_count, 0);
  assert.strictEqual(calendarGateway.calls.eventInsert, 0,
    `information-only eventInsert=${calendarGateway.calls.eventInsert}`);
  assert.strictEqual(calendarGateway.calls.eventUpdate, 0);
  assert.strictEqual(calendarGateway.calls.eventDelete, 0);
  assert.strictEqual(calendarGateway.events.size, 0);
});

test('P6-I02C_UNCLEAR_FOLLOWS_GOVERNED_REVIEW_WITHOUT_CALENDAR', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('UNCLEAR', {
    message_id: 'synthetic-auto-unclear'
  });
  const calendarGateway = new AutomaticCalendarGateway();
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway: automaticGateway([message]),
    properties: properties(),
    calendar_gateway: calendarGateway,
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  const tasks = fixture.allTasks(fixture.taskSheet(spreadsheet));
  assert.strictEqual(result.status, 'COMPLETE');
  assert.strictEqual(result.processed_count, 1);
  assert.strictEqual(result.review_count, 1);
  assert.strictEqual(result.calendar_job_count, 0);
  assert.strictEqual(tasks.length, 1);
  assert.strictEqual(tasks[0].status, 'REVIEW');
  assert.strictEqual(tasks[0].needs_review, true);
  assert.strictEqual(calendarGateway.calls.eventInsert, 0);
});

test('P6-I02D_INVALID_CALENDAR_LIMIT_FAILS_CLOSED_WITHOUT_WORK_MUTATION', () => {
  [
    { value: undefined, omit: true },
    { value: '1', omit: false },
    { value: -1, omit: false },
    { value: Number.NaN, omit: false }
  ].forEach((invalid) => {
    const spreadsheet = fixture.makeOperationalSpreadsheet();
    const gateway = automaticGateway([]);
    const isolatedWorker = workerWithCalendarLimit(
      invalid.value,
      invalid.omit
    );
    const result = isolatedWorker.processAutomaticBatch({
      spreadsheet,
      gateway,
      properties: properties(),
      adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
      now: clockAt('2026-07-24T12:00:00.000Z'),
      budget: { isExhausted: () => false }
    });
    assert.strictEqual(result.status, 'FAILED');
    assert.strictEqual(result.note, 'E_CALENDAR_JOB_LIMIT_CONFIG');
    assert.strictEqual(gateway.calls.list, 0);
    assert.strictEqual(allStates(spreadsheet).length, 0);
    assert.strictEqual(
      fixture.allTasks(fixture.taskSheet(spreadsheet)).length,
      0
    );
  });
});

test('P6-I03_DUE_BACKLOG_RUNS_BEFORE_NEW_INBOX_SEARCH', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const backlogMessage = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-auto-backlog'
  });
  fixture.seedPreprocessed(spreadsheet, backlogMessage);
  const newMessage = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-auto-newer'
  });
  const sequence = [];
  const gateway = automaticGateway([backlogMessage, newMessage]);
  const originalList = gateway.listAutomaticCandidates;
  gateway.listAutomaticCandidates = (settings) => {
    sequence.push('SEARCH');
    return originalList(settings);
  };
  const mock = new sandbox.WorkOsAiAdapter.MockAiAdapter();
  const adapter = {
    healthCheck: () => mock.healthCheck(),
    getMetadata: () => mock.getMetadata(),
    classify(input) {
      sequence.push(`AI:${input.message.message_id}`);
      return mock.classify(input);
    }
  };
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway,
    properties: properties(),
    adapter,
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.processed_count, 2);
  assert.strictEqual(result.backlog_processed_count, 1);
  assert.strictEqual(result.inbox_processed_count, 1);
  assert(sequence.indexOf('AI:synthetic-auto-backlog') <
    sequence.indexOf('SEARCH'));
});

test('P6-I04_SAME_THREAD_DIFFERENT_MESSAGE_IDS_STAY_SEPARATE', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const first = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-thread-message-a',
    thread_id: 'synthetic-shared-thread',
    stable_thread_key: 'root:synthetic-shared-root'
  });
  const second = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-thread-message-b',
    thread_id: 'synthetic-shared-thread',
    stable_thread_key: 'root:synthetic-shared-root'
  });
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway: automaticGateway([first, second]),
    properties: properties(),
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.processed_count, 1);
  assert.strictEqual(
    JSON.stringify(
      Array.from(
        allStates(spreadsheet),
        (state) => state.message_id
      ).sort()
    ),
    JSON.stringify(['synthetic-thread-message-a'])
  );
});

test('P6-I05_BATCH_NEVER_PROCESSES_MORE_THAN_TEN', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const messages = Array.from({ length: 12 }, (_unused, index) =>
    fixture.rawMessage('INFORMATION_ONLY', {
      message_id: `synthetic-auto-limit-${index}`
    })
  );
  const gateway = automaticGateway(messages);
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway,
    properties: properties(),
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.processed_count, 1);
  assert.strictEqual(allStates(spreadsheet).length, 1);
  assert.strictEqual(gateway.calls.fetch.length, 1);
});

test('P6-I06_SOFT_BUDGET_STOPS_BEFORE_GMAIL_SEARCH', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const gateway = automaticGateway([
    fixture.rawMessage('INFORMATION_ONLY', {
      message_id: 'synthetic-auto-budget'
    })
  ]);
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway,
    properties: properties(),
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => true }
  });
  assert.strictEqual(result.status, 'PAUSED');
  assert.strictEqual(result.processed_count, 0);
  assert.strictEqual(gateway.calls.list, 0);
  assert.strictEqual(allStates(spreadsheet).length, 0);
});

test('P6-I07_PARTIAL_FAILURE_DOES_NOT_ADVANCE_SCAN_OR_WATERMARK', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('TRANSIENT_ERROR', {
    message_id: 'synthetic-auto-failure'
  });
  const gateway = automaticGateway([message], {
    search_complete: false,
    resume_page_token: 'synthetic-next-page'
  });
  const props = properties();
  props.setProperty(
    Config.PROPERTIES.AUTOMATION_SCAN_PAGE_TOKEN,
    'synthetic-current-page'
  );
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway,
    properties: props,
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.status, 'FAILED');
  assert.strictEqual(result.watermark_advanced, false);
  assert.strictEqual(
    props.getProperty(Config.PROPERTIES.AUTOMATION_WATERMARK_AT),
    null
  );
  assert.strictEqual(
    props.getProperty(Config.PROPERTIES.AUTOMATION_SCAN_PAGE_TOKEN),
    'synthetic-current-page'
  );
  assert.strictEqual(allStates(spreadsheet)[0].processing_status, 'RETRY');
});

test('P6-I07B_EXPIRED_SCAN_CURSOR_RESTARTS_FIXED_CYCLE_SAFELY', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const gateway = automaticGateway([], { list_error: true });
  const props = properties();
  props.setProperty(
    Config.PROPERTIES.AUTOMATION_SCAN_UPPER_AT,
    '2026-07-24T11:00:00.000Z'
  );
  props.setProperty(
    Config.PROPERTIES.AUTOMATION_SCAN_PAGE_TOKEN,
    'synthetic-expired-page'
  );
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway,
    properties: props,
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.status, 'FAILED');
  assert.strictEqual(result.watermark_advanced, false);
  assert.strictEqual(result.scan_cursor_reset, true);
  assert.strictEqual(
    props.getProperty(Config.PROPERTIES.AUTOMATION_SCAN_PAGE_TOKEN),
    null
  );
  assert.strictEqual(
    props.getProperty(Config.PROPERTIES.AUTOMATION_SCAN_UPPER_AT),
    '2026-07-24T11:00:00.000Z'
  );
});

test('P6-I07C_MALFORMED_DURABLE_DATE_FAILS_CLOSED_BEFORE_GMAIL', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const gateway = automaticGateway([]);
  const props = properties();
  props.setProperty(
    Config.PROPERTIES.AUTOMATION_WATERMARK_AT,
    'not-a-valid-date'
  );
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway,
    properties: props,
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.status, 'FAILED');
  assert.strictEqual(result.watermark_advanced, false);
  assert.strictEqual(gateway.calls.list, 0);
});

test('P6-I08_DUE_RETRY_RESUMES_BEFORE_SEARCH', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('TRANSIENT_ERROR', {
    message_id: 'synthetic-auto-due-retry'
  });
  fixture.seedPreprocessed(spreadsheet, message);
  const failureGateway = automaticGateway([message]);
  Worker.processMockVerticalOnce({
    spreadsheet,
    gateway: failureGateway,
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt('2026-07-24T10:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  const retryMessage = {
    ...message,
    subject: '[MOCK:INFORMATION_ONLY] Synthetic retry success'
  };
  const gateway = automaticGateway([retryMessage]);
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway,
    properties: properties(),
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt('2026-07-24T10:06:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.backlog_processed_count, 1);
  assert.strictEqual(gateway.calls.list, 1);
  assert.strictEqual(allStates(spreadsheet)[0].processing_status, 'DONE');
});

test('P6-I09_LOCK_CONTENTION_CALLS_NO_GMAIL_AI_OR_CALENDAR', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const gateway = automaticGateway([
    fixture.rawMessage('INFORMATION_ONLY', {
      message_id: 'synthetic-auto-lock'
    })
  ]);
  fixture.setLockAvailable(false);
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway,
    properties: properties(),
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.status, 'FAILED');
  assert.strictEqual(gateway.calls.list, 0);
  assert.strictEqual(gateway.calls.fetch.length, 0);
  assert.strictEqual(result.calendar_job_count, 0);
});

test('P6-I10_EXTERNAL_IO_RUNS_OUTSIDE_SHORT_PROCESSING_LOCKS', () => {
  fixture.resetLockMetrics();
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const gateway = automaticGateway([
    fixture.rawMessage('INFORMATION_ONLY', {
      message_id: 'synthetic-auto-lock-count'
    })
  ]);
  ['listAutomaticCandidates', 'fetchSelectedContent',
    'refetchMessageContent', 'syncAiLabels', 'setSystemFailureLabel']
    .forEach((method) => {
      const original = gateway[method];
      if (typeof original !== 'function') {
        return;
      }
      gateway[method] = (...args) => {
        assert.strictEqual(fixture.isLockHeld(), false);
        return original(...args);
      };
    });
  const adapter = new sandbox.WorkOsAiAdapter.MockAiAdapter();
  const classify = adapter.classify.bind(adapter);
  adapter.classify = (...args) => {
    assert.strictEqual(fixture.isLockHeld(), false);
    return classify(...args);
  };
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway,
    properties: properties(),
    adapter,
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.status, 'COMPLETE');
  assert.strictEqual(result.log_recorded, true);
  assert.ok(fixture.getLockAttempts() >= 4);
  assert.strictEqual(fixture.isLockHeld(), false);
});

test('P6-I11_RUN_LOG_CONTAINS_NO_BODY_SUBJECT_OR_SENDER', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-auto-log',
    plain_body: 'SYNTHETIC_SECRET_BODY_MUST_NOT_PERSIST'
  });
  message.subject = 'SYNTHETIC_SUBJECT_MUST_NOT_PERSIST';
  message.sender = 'private-sender@example.invalid';
  Worker.processAutomaticBatch({
    spreadsheet,
    gateway: automaticGateway([message]),
    properties: properties(),
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  const serialized = JSON.stringify(runHistoryValues(spreadsheet));
  assert(!serialized.includes('SYNTHETIC_SECRET_BODY_MUST_NOT_PERSIST'));
  assert(!serialized.includes('SYNTHETIC_SUBJECT_MUST_NOT_PERSIST'));
  assert(!serialized.includes('private-sender@example.invalid'));
});

test('P6-I12_INCOMPLETE_SCAN_STORES_CURSOR_BUT_NOT_WATERMARK', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-auto-cursor'
  });
  const props = properties();
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway: automaticGateway([message], {
      search_complete: false,
      search_saturated: true,
      resume_page_token: 'synthetic-page-two'
    }),
    properties: props,
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter(),
    now: clockAt('2026-07-24T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.status, 'COMPLETE');
  assert.strictEqual(result.search_saturated, true);
  assert.strictEqual(result.watermark_advanced, false);
  assert.strictEqual(
    props.getProperty(Config.PROPERTIES.AUTOMATION_SCAN_PAGE_TOKEN),
    'synthetic-page-two'
  );
  assert.strictEqual(
    props.getProperty(Config.PROPERTIES.AUTOMATION_WATERMARK_AT),
    null
  );
  assert.strictEqual(
    props.getProperty(Config.PROPERTIES.AUTOMATION_SCAN_UPPER_AT),
    '2026-07-24T12:00:00.000Z'
  );
});

const summary = {
  phase: 6,
  suite: 'scheduled_worker_integration',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_trigger: 'NOT_EXECUTED',
  real_gmail: 'NOT_EXECUTED',
  real_provider_connection: 'NOT_EXECUTED',
  passed: tests.filter((item) => item.status === 'PASS').length,
  failed: tests.filter((item) => item.status === 'FAIL').length,
  tests
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed) {
  process.exitCode = 1;
}
