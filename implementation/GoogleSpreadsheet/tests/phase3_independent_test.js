'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repositoryRoot = path.resolve(__dirname, '..');
const appsScriptRoot = path.join(repositoryRoot, 'apps-script-v2');

class FakeRange {
  constructor(sheet, row, column, rowCount = 1, columnCount = 1) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.rowCount = rowCount;
    this.columnCount = columnCount;
    if (
      !Number.isInteger(row) ||
      !Number.isInteger(column) ||
      !Number.isInteger(rowCount) ||
      !Number.isInteger(columnCount) ||
      row < 1 ||
      column < 1 ||
      rowCount < 1 ||
      columnCount < 1 ||
      row + rowCount - 1 > sheet.maxRows ||
      column + columnCount - 1 > sheet.maxColumns
    ) {
      throw new Error('RANGE_OUT_OF_BOUNDS');
    }
  }

  getValues() {
    this.sheet.readLog.push({
      row: this.row,
      column: this.column,
      rowCount: this.rowCount,
      columnCount: this.columnCount
    });
    return Array.from({ length: this.rowCount }, (_, rowOffset) =>
      Array.from(
        { length: this.columnCount },
        (_, columnOffset) =>
          this.sheet.cells[this.row - 1 + rowOffset][
            this.column - 1 + columnOffset
          ]
      )
    );
  }

  setValues(values) {
    assert.strictEqual(values.length, this.rowCount);
    values.forEach((row) => assert.strictEqual(row.length, this.columnCount));
    if (typeof this.sheet.writeInterceptor === 'function') {
      this.sheet.writeInterceptor({
        sheet: this.sheet,
        row: this.row,
        column: this.column,
        rowCount: this.rowCount,
        columnCount: this.columnCount,
        values
      });
    }
    values.forEach((row, rowOffset) => {
      row.forEach((value, columnOffset) => {
        this.sheet.cells[this.row - 1 + rowOffset][
          this.column - 1 + columnOffset
        ] = value;
      });
    });
    this.sheet.writeLog.push({
      row: this.row,
      column: this.column,
      rowCount: this.rowCount,
      columnCount: this.columnCount
    });
    return this;
  }

  getSheet() {
    return this.sheet;
  }

  getRow() {
    return this.row;
  }

  getColumn() {
    return this.column;
  }

  getNumRows() {
    return this.rowCount;
  }

  getNumColumns() {
    return this.columnCount;
  }
}

class FakeSheet {
  constructor(name, rows, columns) {
    this.name = name;
    this.maxRows = rows;
    this.maxColumns = columns;
    this.cells = Array.from({ length: rows }, () =>
      Array.from({ length: columns }, () => '')
    );
    this.insertedRows = 0;
    this.readLog = [];
    this.writeLog = [];
    this.writeInterceptor = null;
    this.parent = null;
  }

  getName() {
    return this.name;
  }

  getRange(row, column, rowCount = 1, columnCount = 1) {
    return new FakeRange(this, row, column, rowCount, columnCount);
  }

  getMaxRows() {
    return this.maxRows;
  }

  getMaxColumns() {
    return this.maxColumns;
  }

  insertRowsAfter(after, count) {
    assert.strictEqual(after, this.maxRows);
    assert.strictEqual(Number.isInteger(count) && count > 0, true);
    for (let index = 0; index < count; index += 1) {
      this.cells.push(Array.from({ length: this.maxColumns }, () => ''));
    }
    this.maxRows += count;
    this.insertedRows += count;
  }

  getParent() {
    return this.parent;
  }
}

class FakeSpreadsheet {
  constructor(sheets) {
    this.sheets = sheets.slice();
    this.sheets.forEach((sheet) => {
      sheet.parent = this;
    });
  }

  getSheetByName(name) {
    return this.sheets.find((sheet) => sheet.getName() === name) || null;
  }

  getSheets() {
    return this.sheets.slice();
  }
}

let activeSpreadsheet = null;
let lockAvailable = true;
let uuidCounter = 0;
const propertyValues = new Map();
const externalCallCounters = {
  urlFetch: 0,
  calendar: 0,
  gmailModify: 0
};

function deterministicUuid() {
  uuidCounter += 1;
  const hex = uuidCounter.toString(16).padStart(32, '0').slice(-32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20)
  ].join('-');
}

function formatTokyoDate(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const index = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );
  return `${index.year}-${index.month}-${index.day}`;
}

const sandbox = {
  console,
  Date,
  JSON,
  Math,
  Number,
  Object,
  String,
  Boolean,
  Array,
  Error,
  RegExp,
  Utilities: {
    getUuid: deterministicUuid,
    computeDigest: (_algorithm, value) =>
      Array.from(
        crypto.createHash('sha256').update(String(value), 'utf8').digest()
      ).map((byte) => (byte > 127 ? byte - 256 : byte)),
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    Charset: { UTF_8: 'UTF_8' },
    base64DecodeWebSafe: (value) =>
      Array.from(Buffer.from(String(value), 'base64url')).map((byte) =>
        byte > 127 ? byte - 256 : byte
      ),
    newBlob: (bytes) => ({
      getDataAsString: () =>
        Buffer.from(
          Array.from(bytes, (byte) => (byte < 0 ? byte + 256 : byte))
        ).toString('utf8')
    }),
    formatDate: (date, timezone) => formatTokyoDate(date, timezone)
  },
  SpreadsheetApp: {
    getActiveSpreadsheet: () => activeSpreadsheet
  },
  LockService: {
    getScriptLock: () => {
      let held = false;
      return {
        tryLock: () => {
          if (!lockAvailable) {
            return false;
          }
          held = true;
          return true;
        },
        hasLock: () => held,
        releaseLock: () => {
          held = false;
        }
      };
    }
  },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: (key) =>
        propertyValues.has(String(key))
          ? propertyValues.get(String(key))
          : null,
      setProperty: (key, value) => {
        propertyValues.set(String(key), String(value));
      },
      deleteProperty: (key) => {
        propertyValues.delete(String(key));
      },
      getProperties: () => Object.fromEntries(propertyValues.entries())
    })
  },
  Gmail: {
    Users: {
      Labels: {},
      Threads: {},
      Messages: {}
    }
  },
  UrlFetchApp: {
    fetch: () => {
      externalCallCounters.urlFetch += 1;
      throw new Error('UNEXPECTED_URL_FETCH');
    }
  },
  CalendarApp: {
    getDefaultCalendar: () => {
      externalCallCounters.calendar += 1;
      throw new Error('UNEXPECTED_CALENDAR_ACCESS');
    }
  }
};
vm.createContext(sandbox);

[
  '00_Config.gs',
  '01_TypesAndSchemas.gs',
  '17_Utilities.gs',
  '04_MessageStateRepository.gs',
  '05_GmailGateway.gs',
  '06_EmailPreprocessor.gs',
  '07_AiAdapter.gs',
  '08_TaskRepository.gs',
  '09_TaskReviewPolicy.gs',
  '10_CalendarSync.gs',
  '13_LogAndDeadLetter.gs',
  '11_EditHandler.gs',
  '18_Worker.gs'
].forEach((fileName) => {
  const source = fs.readFileSync(path.join(appsScriptRoot, fileName), 'utf8');
  vm.runInContext(source, sandbox, { filename: fileName });
});

function makeSchemaSheet(sheetName, rows = 100) {
  const schema = sandbox.WorkOsSchemas.getSheetSchema(sheetName);
  const sheet = new FakeSheet(sheetName, rows, schema.length);
  sheet.getRange(1, 1, 1, schema.length).setValues([
    schema.map((column) => column.id)
  ]);
  sheet.getRange(2, 1, 1, schema.length).setValues([
    schema.map((column) => column.header)
  ]);
  sheet.readLog = [];
  sheet.writeLog = [];
  return sheet;
}

function makeOperationalSpreadsheet() {
  return new FakeSpreadsheet([
    makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.TASKS),
    makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE),
    makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.SYNC_STATE),
    makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.RUN_HISTORY),
    makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.ERRORS)
  ]);
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function expectAppError(body, expectedCode) {
  assert.throws(
    body,
    (error) => error && error.code === expectedCode
  );
}

function mapForSheet(sheet) {
  return sandbox.WorkOsSchemas.buildColumnMapFromIds(
    sheet.cells[0].slice()
  );
}

function readTasks(sheet) {
  const context = sandbox.WorkOsTaskRepository.createContext(sheet);
  return context.logicalRows.map((row) => ({
    row,
    task: sandbox.WorkOsTaskRepository.readTaskAtRow(context, row)
  }));
}

function readMessage(spreadsheet, messageId) {
  const sheet = spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE
  );
  const context = sandbox.WorkOsMessageStateRepository.createContext(sheet);
  return sandbox.WorkOsMessageStateRepository.getByMessageId(
    context,
    messageId
  );
}

let syntheticMessageCounter = 0;
function messageInput(options = {}) {
  syntheticMessageCounter += 1;
  const messageId =
    options.messageId || `synthetic-message-${syntheticMessageCounter}`;
  const threadId =
    options.threadId || `synthetic-thread-${syntheticMessageCounter}`;
  return {
    message_id: messageId,
    thread_id: threadId,
    stable_thread_key:
      options.stableThreadKey || `root:synthetic-root-${syntheticMessageCounter}`,
    subject: options.subject || '[MOCK:NEW_HIGH] Synthetic subject',
    sender: 'fixture@example.invalid',
    received_at:
      options.receivedAt || new Date('2026-07-24T00:00:00.000Z'),
    plain_body: options.body || 'Completely synthetic test body.',
    source_body_bytes: 32,
    body_transport_truncated: false,
    previous_messages: options.previousMessages || []
  };
}

function preprocess(input, options = {}) {
  return sandbox.WorkOsEmailPreprocessor.preprocess(input, {
    today: options.today || '2026-07-24',
    timezone: 'Asia/Tokyo',
    active_tasks: options.activeTasks || []
  });
}

function classify(preprocessed, adapterOptions) {
  const adapter = new sandbox.WorkOsAiAdapter.MockAiAdapter(
    adapterOptions || {}
  );
  return adapter.classify(sandbox.WorkOsAiAdapter.buildInput(preprocessed));
}

function applyClassification(sheet, classification, preprocessed) {
  let results;
  sandbox.WorkOsTaskRepository.withLockedContext(sheet, (context) => {
    results = sandbox.WorkOsTaskReviewPolicy.applyClassification(
      classification,
      {
        task_context: context,
        preprocessed
      }
    );
  });
  return results;
}

let seedCounter = 0;
function seedTask(sheet, options = {}) {
  seedCounter += 1;
  let result;
  const stableThreadKey =
    options.stableThreadKey || `root:seed-${seedCounter}`;
  sandbox.WorkOsTaskRepository.withLockedContext(sheet, (context) => {
    result = sandbox.WorkOsTaskRepository.upsertTask(
      {
        origin_key: sandbox.WorkOsUtilities.makeOriginKey(
          `seed-message-${seedCounter}`,
          0
        ),
        task_title: options.taskTitle || `Seed task ${seedCounter}`,
        status: options.status || 'OPEN',
        completed: options.completed === true,
        excluded: options.excluded === true,
        waiting_for_reply: options.waitingForReply === true,
        due_date: options.dueDate || '2026-07-25',
        deadline_basis: 'EXPLICIT',
        priority: 'MEDIUM',
        stable_thread_key: stableThreadKey,
        source_message_id: `seed-message-${seedCounter}`,
        source_thread_id: `seed-thread-${seedCounter}`,
        source_action_index: 0,
        comment: options.comment || ''
      },
      context
    );
  });
  return {
    ...result,
    stableThreadKey
  };
}

function taskSummary(task) {
  return {
    task_id: task.task_id,
    task_title: task.task_title,
    status: task.status,
    due_date: task.due_date,
    manual_fields: task.manual_fields
  };
}

function applyMarkerToExisting(marker, options = {}) {
  const spreadsheet = makeOperationalSpreadsheet();
  const taskSheet = spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.TASKS
  );
  const seed = seedTask(taskSheet, {
    stableThreadKey: options.stableThreadKey,
    status: options.status,
    waitingForReply: options.waitingForReply,
    dueDate: options.dueDate,
    comment: options.comment
  });
  const before = readTasks(taskSheet)[0].task;
  const input = messageInput({
    messageId: options.messageId,
    stableThreadKey: seed.stableThreadKey,
    subject: `[MOCK:${marker}] Synthetic existing-task action`
  });
  const preprocessed = preprocess(input, {
    activeTasks: [taskSummary(before)]
  });
  const classification = classify(preprocessed);
  const results = applyClassification(
    taskSheet,
    classification,
    preprocessed
  );
  const after = readTasks(taskSheet).find(
    (entry) => entry.task.task_id === seed.task_id
  ).task;
  return {
    spreadsheet,
    taskSheet,
    seed,
    before,
    after,
    input,
    preprocessed,
    classification,
    results
  };
}

function setTaskCell(sheet, row, columnId, value) {
  const map = mapForSheet(sheet);
  sheet.cells[row - 1][map[columnId]] = value;
}

function runEdit(sheet, row, columnId) {
  const map = mapForSheet(sheet);
  return sandbox.WorkOsEditHandler.handle({
    range: new FakeRange(sheet, row, map[columnId] + 1, 1, 1)
  });
}

function seedPreprocessedMessage(spreadsheet, input, nowValue) {
  const preprocessed = preprocess(input);
  const stateSheet = spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE
  );
  sandbox.WorkOsMessageStateRepository.withLockedContext(
    stateSheet,
    (context) => {
      const claim = sandbox.WorkOsMessageStateRepository.claimInContext(
        {
          message_id: input.message_id,
          thread_id: input.thread_id,
          stable_thread_key: input.stable_thread_key,
          received_at: input.received_at,
          source_mode: 'MANUAL'
        },
        'run_seed_phase3',
        context,
        nowValue
      );
      assert.strictEqual(claim.claimed, true);
      sandbox.WorkOsMessageStateRepository.checkpointPreprocessedInContext(
        input.message_id,
        'run_seed_phase3',
        preprocessed.content_hash,
        context,
        nowValue
      );
    }
  );
  return preprocessed;
}

function alwaysAvailableBudget() {
  return {
    isExhausted: () => false
  };
}

function workerGateway(input, counters = {}) {
  return {
    refetchMessageContent: () => {
      counters.refetch = Number(counters.refetch || 0) + 1;
      return input;
    },
    syncAiLabels: (_threadId, labels) => {
      counters.aiLabelSync = Number(counters.aiLabelSync || 0) + 1;
      counters.lastAiLabels = Array.from(labels || []);
      return { added_count: labels.length, removed_count: 0 };
    },
    setSystemFailureLabel: (_threadId, enabled) => {
      counters.systemFailure = Number(counters.systemFailure || 0) + 1;
      counters.lastSystemFailure = enabled;
      return { added_count: enabled ? 1 : 0, removed_count: enabled ? 0 : 1 };
    }
  };
}

function allFormalLabels() {
  return Array.from(sandbox.WorkOsConfig.GMAIL_LABELS, (name, index) => ({
    id: `LABEL_${index + 1}`,
    name
  }));
}

function installLabelFake() {
  const labels = allFormalLabels();
  const calls = [];
  sandbox.Gmail.Users.Labels.list = () => ({
    labels: labels.map((label) => ({ ...label }))
  });
  sandbox.Gmail.Users.Threads.modify = (resource, user, threadId) => {
    externalCallCounters.gmailModify += 1;
    calls.push({
      resource: clone(resource),
      user,
      threadId
    });
    return {};
  };
  sandbox.Gmail.Users.Messages.get = () => {
    throw new Error('UNEXPECTED_MESSAGE_FETCH');
  };
  return { labels, calls };
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
      safe_message: sandbox.WorkOsUtilities.redact(
        error && error.message ? error.message : String(error)
      )
    });
  } finally {
    activeSpreadsheet = null;
    lockAvailable = true;
    propertyValues.clear();
  }
}

test('P3-I01_AI_INPUT_REJECTS_EXTRA_FIELDS', () => {
  const valid = sandbox.WorkOsAiAdapter.buildInput(
    preprocess(messageInput({ subject: '[MOCK:INFO] Strict input' }))
  );
  const invalid = clone(valid);
  invalid.unexpected = true;
  expectAppError(
    () => sandbox.WorkOsAiAdapter.validateInput(invalid),
    'E_AI_SCHEMA'
  );
  const nested = clone(valid);
  nested.message.unexpected = 'extra';
  expectAppError(
    () => sandbox.WorkOsAiAdapter.validateInput(nested),
    'E_AI_SCHEMA'
  );
});

test('P3-I02_AI_INPUT_REJECTS_MISSING_FIELDS', () => {
  const valid = sandbox.WorkOsAiAdapter.buildInput(
    preprocess(messageInput({ subject: '[MOCK:INFO] Strict input' }))
  );
  const missingTop = clone(valid);
  delete missingTop.constraints;
  expectAppError(
    () => sandbox.WorkOsAiAdapter.validateInput(missingTop),
    'E_AI_SCHEMA'
  );
  const missingNested = clone(valid);
  delete missingNested.message.sender;
  expectAppError(
    () => sandbox.WorkOsAiAdapter.validateInput(missingNested),
    'E_AI_SCHEMA'
  );
});

test('P3-I03_AI_INPUT_REJECTS_INVALID_DATES', () => {
  const valid = sandbox.WorkOsAiAdapter.buildInput(
    preprocess(messageInput({ subject: '[MOCK:INFO] Strict input' }))
  );
  const invalidReceived = clone(valid);
  invalidReceived.message.received_at = 'not-a-date';
  expectAppError(
    () => sandbox.WorkOsAiAdapter.validateInput(invalidReceived),
    'E_AI_SCHEMA'
  );
  const invalidToday = clone(valid);
  invalidToday.context.today = '2026-02-30';
  expectAppError(
    () => sandbox.WorkOsAiAdapter.validateInput(invalidToday),
    'E_AI_SCHEMA'
  );
});

test('P3-I04_AI_OUTPUT_REJECTS_EXTRA_FIELDS', () => {
  const preprocessed = preprocess(
    messageInput({ subject: '[MOCK:NEW_HIGH] Strict output' })
  );
  const valid = classify(preprocessed);
  const topExtra = clone(valid);
  topExtra.unexpected = true;
  expectAppError(
    () => sandbox.WorkOsAiAdapter.validateOutput(topExtra),
    'E_AI_SCHEMA'
  );
  const actionExtra = clone(valid);
  actionExtra.actions[0].unexpected = true;
  expectAppError(
    () => sandbox.WorkOsAiAdapter.validateOutput(actionExtra),
    'E_AI_SCHEMA'
  );
  const changesExtra = clone(valid);
  changesExtra.actions[0].changes.comment = 'must not be accepted';
  expectAppError(
    () => sandbox.WorkOsAiAdapter.validateOutput(changesExtra),
    'E_AI_SCHEMA'
  );
});

test('P3-I05_AI_OUTPUT_REJECTS_MISSING_FIELDS', () => {
  const valid = classify(
    preprocess(messageInput({ subject: '[MOCK:NEW_HIGH] Strict output' }))
  );
  const missingTop = clone(valid);
  delete missingTop.overall_confidence;
  expectAppError(
    () => sandbox.WorkOsAiAdapter.validateOutput(missingTop),
    'E_AI_SCHEMA'
  );
  const missingAction = clone(valid);
  delete missingAction.actions[0].reason;
  expectAppError(
    () => sandbox.WorkOsAiAdapter.validateOutput(missingAction),
    'E_AI_SCHEMA'
  );
});

test('P3-I06_AI_OUTPUT_REJECTS_INVALID_DATES', () => {
  const invalid = clone(classify(
    preprocess(messageInput({ subject: '[MOCK:NEW_HIGH] Strict output' }))
  ));
  invalid.actions[0].deadline = '2026-02-30';
  expectAppError(
    () => sandbox.WorkOsAiAdapter.validateOutput(invalid),
    'E_AI_SCHEMA'
  );
});

test('P3-I07_AI_OUTPUT_REJECTS_ELEVEN_ACTIONS', () => {
  const preprocessed = preprocess(
    messageInput({ subject: '[MOCK:TOO_MANY] Strict output' })
  );
  const adapter = new sandbox.WorkOsAiAdapter.MockAiAdapter();
  expectAppError(
    () => adapter.classify(sandbox.WorkOsAiAdapter.buildInput(preprocessed)),
    'E_AI_SCHEMA'
  );
});

test('P3-I08_AI_OUTPUT_REJECTS_UNKNOWN_ACTION', () => {
  const preprocessed = …6964 tokens truncated…ert.strictEqual(task.status, 'DONE');
  assert.strictEqual(task.completed, true);
  assert.strictEqual(task.excluded, false);
  assert.strictEqual(task.waiting_for_reply, false);

  current = fixture();
  setTaskCell(current.taskSheet, current.entry.row, 'completed', true);
  setTaskCell(
    current.taskSheet,
    current.entry.row,
    'waiting_for_reply',
    true
  );
  setTaskCell(current.taskSheet, current.entry.row, 'excluded', true);
  runEdit(current.taskSheet, current.entry.row, 'excluded');
  task = readTasks(current.taskSheet)[0].task;
  assert.strictEqual(task.status, 'EXCLUDED');
  assert.strictEqual(task.excluded, true);
  assert.strictEqual(task.completed, false);
  assert.strictEqual(task.waiting_for_reply, false);

  current = fixture();
  setTaskCell(current.taskSheet, current.entry.row, 'waiting_for_reply', true);
  runEdit(current.taskSheet, current.entry.row, 'waiting_for_reply');
  task = readTasks(current.taskSheet)[0].task;
  assert.strictEqual(task.status, 'WAITING');
  assert.strictEqual(task.waiting_for_reply, true);

  current = fixture({ status: 'WAITING', waitingForReply: true });
  setTaskCell(current.taskSheet, current.entry.row, 'waiting_for_reply', false);
  runEdit(current.taskSheet, current.entry.row, 'waiting_for_reply');
  task = readTasks(current.taskSheet)[0].task;
  assert.strictEqual(task.status, 'OPEN');
  assert.strictEqual(task.waiting_for_reply, false);

  current = fixture();
  setTaskCell(current.taskSheet, current.entry.row, 'status', '蜿匁ｶ・);
  runEdit(current.taskSheet, current.entry.row, 'status');
  task = readTasks(current.taskSheet)[0].task;
  assert.strictEqual(task.status, 'CANCELLED');
  assert.strictEqual(task.completed, false);
  assert.strictEqual(task.excluded, false);
  assert.strictEqual(task.waiting_for_reply, false);

  [
    {
      sheetValue: '螳御ｺ・,
      status: 'DONE',
      completed: true,
      excluded: false,
      waiting: false
    },
    {
      sheetValue: '蟇ｾ雎｡螟・,
      status: 'EXCLUDED',
      completed: false,
      excluded: true,
      waiting: false
    },
    {
      sheetValue: '霑比ｿ｡蠕・■',
      status: 'WAITING',
      completed: false,
      excluded: false,
      waiting: true
    }
  ].forEach((expected) => {
    const statusFixture = fixture();
    setTaskCell(
      statusFixture.taskSheet,
      statusFixture.entry.row,
      'status',
      expected.sheetValue
    );
    runEdit(statusFixture.taskSheet, statusFixture.entry.row, 'status');
    const normalized = readTasks(statusFixture.taskSheet)[0].task;
    assert.strictEqual(normalized.status, expected.status);
    assert.strictEqual(normalized.completed, expected.completed);
    assert.strictEqual(normalized.excluded, expected.excluded);
    assert.strictEqual(normalized.waiting_for_reply, expected.waiting);
  });
});

test('P3-I29_FINALIZE_RETRY_SKIPS_REFETCH_PREPROCESS_AI_AND_TASK_WRITE', () => {
  const spreadsheet = makeOperationalSpreadsheet();
  const taskSheet = spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.TASKS
  );
  const input = messageInput({
    messageId: 'finalize-retry-message',
    stableThreadKey: 'root:finalize-retry',
    subject: '[MOCK:NEW_HIGH] Finalize retry'
  });
  const firstNow = new Date('2026-07-24T03:00:00.000Z');
  seedPreprocessedMessage(spreadsheet, input, firstNow);
  let adapterCalls = 0;
  let firstRefetchCalls = 0;
  let firstPreprocessCalls = 0;
  const firstGateway = {
    refetchMessageContent: () => {
      firstRefetchCalls += 1;
      return input;
    },
    syncAiLabels: () => {
      throw new sandbox.WorkOsAppError(
        'E_SYNTHETIC_LABEL_SYNC',
        'FINALIZE',
        true,
        'Synthetic retryable finalize failure'
      );
    },
    setSystemFailureLabel: () => ({})
  };
  const first = sandbox.WorkOsWorker.processMockVerticalOnce({
    spreadsheet,
    adapter: {
      classify: (aiInput) => {
        adapterCalls += 1;
        return new sandbox.WorkOsAiAdapter.MockAiAdapter().classify(aiInput);
      }
    },
    gateway: firstGateway,
    preprocessor: {
      preprocess: (raw, options) => {
        firstPreprocessCalls += 1;
        return sandbox.WorkOsEmailPreprocessor.preprocess(raw, options);
      }
    },
    budget: alwaysAvailableBudget(),
    now: () => new Date(firstNow.getTime())
  });
  assert.strictEqual(first.status, 'FAILED');
  assert.strictEqual(adapterCalls, 1);
  assert.strictEqual(firstRefetchCalls, 1);
  assert.strictEqual(firstPreprocessCalls, 1);
  const retryState = readMessage(spreadsheet, input.message_id);
  assert.strictEqual(retryState.processing_status, 'RETRY');
  assert.strictEqual(retryState.resume_stage, 'FINALIZE');
  const taskBeforeRetry = readTasks(taskSheet)[0].task;
  const taskWritesBeforeRetry = taskSheet.writeLog.length;

  taskSheet.writeInterceptor = () => {
    throw new Error('TASK_WRITE_MUST_NOT_RUN_DURING_FINALIZE_RETRY');
  };
  const secondNow = new Date(firstNow.getTime() + 6 * 60 * 1000);
  let finalLabelCalls = 0;
  const second = sandbox.WorkOsWorker.processMockVerticalOnce({
    spreadsheet,
    adapter: {
      classify: () => {
        throw new Error('AI_MUST_NOT_RUN_DURING_FINALIZE_RETRY');
      }
    },
    gateway: {
      refetchMessageContent: () => {
        throw new Error('REFETCH_MUST_NOT_RUN_DURING_FINALIZE_RETRY');
      },
      syncAiLabels: () => {
        finalLabelCalls += 1;
        return {};
      },
      setSystemFailureLabel: () => ({})
    },
    preprocessor: {
      preprocess: () => {
        throw new Error('PREPROCESS_MUST_NOT_RUN_DURING_FINALIZE_RETRY');
      }
    },
    budget: alwaysAvailableBudget(),
    now: () => new Date(secondNow.getTime())
  });
  assert.strictEqual(second.status, 'COMPLETE');
  assert.strictEqual(second.classification_reused, true);
  assert.strictEqual(finalLabelCalls, 1);
  assert.strictEqual(taskSheet.writeLog.length, taskWritesBeforeRetry);
  const taskAfterRetry = readTasks(taskSheet)[0].task;
  assert.strictEqual(taskAfterRetry.task_id, taskBeforeRetry.task_id);
  assert.strictEqual(taskAfterRetry.row_version, taskBeforeRetry.row_version);
  assert.strictEqual(readTasks(taskSheet).length, 1);
  const done = readMessage(spreadsheet, input.message_id);
  assert.strictEqual(done.processing_status, 'DONE');
  assert.strictEqual(done.resume_stage, 'DONE');
});

test('P3-I30_MANAGEMENT_EDIT_WARNING_IS_NON_SENSITIVE_AND_IDEMPOTENT', () => {
  const spreadsheet = makeOperationalSpreadsheet();
  const taskSheet = spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.TASKS
  );
  seedTask(taskSheet, {
    taskTitle: 'SYNTHETIC_PRIVATE_TITLE_MUST_NOT_BE_LOGGED',
    comment: 'SYNTHETIC_PRIVATE_COMMENT_MUST_NOT_BE_LOGGED'
  });
  const entry = readTasks(taskSheet)[0];
  const beforeExternal = { ...externalCallCounters };
  const first = runEdit(taskSheet, entry.row, 'task_id');
  assert.strictEqual(first.status, 'IGNORED');
  assert.strictEqual(first.reason, 'MANAGEMENT_COLUMN_EDIT');
  assert.strictEqual(first.management_warning.recorded, true);
  const propertyKey =
    sandbox.WorkOsConfig.PROPERTIES.MANAGEMENT_EDIT_WARNING;
  const firstMarker = JSON.parse(propertyValues.get(propertyKey));
  assert.strictEqual(firstMarker.count, 1);
  assert.strictEqual(firstMarker.management_column_count, 1);
  assert.match(firstMarker.last_detected_at, /^\d{4}-\d{2}-\d{2}T/);

  const second = runEdit(taskSheet, entry.row, 'task_id');
  assert.strictEqual(second.management_warning.recorded, true);
  const secondMarker = JSON.parse(propertyValues.get(propertyKey));
  assert.strictEqual(secondMarker.count, 2);

  const errorSheet = spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.ERRORS
  );
  const errorMap = mapForSheet(errorSheet);
  const errorRows = errorSheet.cells
    .slice(sandbox.WorkOsConfig.DATA_START_ROW - 1)
    .filter((row) => String(row[errorMap.error_id] || ''));
  assert.strictEqual(errorRows.length, 2);
  errorRows.forEach((row) => {
    assert.strictEqual(row[errorMap.status], 'OPEN');
    assert.strictEqual(row[errorMap.stage], 'EDIT_HANDLER');
    assert.strictEqual(
      row[errorMap.error_code],
      'E_MANAGEMENT_COLUMN_EDIT'
    );
    assert.strictEqual(row[errorMap.source_message_id], '');
    assert.strictEqual(row[errorMap.source_thread_id], '');
    assert.strictEqual(row[errorMap.task_id], '');
  });
  const persisted = JSON.stringify({
    property: secondMarker,
    errors: errorRows
  });
  assert.strictEqual(
    persisted.includes('SYNTHETIC_PRIVATE_TITLE_MUST_NOT_BE_LOGGED'),
    false
  );
  assert.strictEqual(
    persisted.includes('SYNTHETIC_PRIVATE_COMMENT_MUST_NOT_BE_LOGGED'),
    false
  );
  assert.deepStrictEqual(externalCallCounters, beforeExternal);
});

test('P3-I31_EXPLICIT_TARGET_MUST_BE_IN_ACTIVE_INPUT_AND_SAME_THREAD', () => {
  const spreadsheet = makeOperationalSpreadsheet();
  const taskSheet = spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.TASKS
  );
  const contextualSeed = seedTask(taskSheet, {
    stableThreadKey: 'root:target-context',
    taskTitle: 'Contextual task'
  });
  const unrelatedSeed = seedTask(taskSheet, {
    stableThreadKey: contextualSeed.stableThreadKey,
    taskTitle: 'Same-thread task omitted from AI input'
  });
  const beforeTasks = readTasks(taskSheet);
  const contextualTask = beforeTasks.find(
    (entry) => entry.task.task_id === contextualSeed.task_id
  ).task;
  const unrelatedTask = beforeTasks.find(
    (entry) => entry.task.task_id === unrelatedSeed.task_id
  ).task;
  const preprocessed = preprocess(
    messageInput({
      messageId: 'outside-active-input-target',
      stableThreadKey: contextualSeed.stableThreadKey,
      subject: '[MOCK:UPDATE_DUE] Outside active input target'
    }),
    { activeTasks: [taskSummary(contextualTask)] }
  );
  const classification = clone(classify(preprocessed));
  classification.actions[0].target_task_id = unrelatedTask.task_id;
  sandbox.WorkOsAiAdapter.validateOutput(classification);

  const results = applyClassification(
    taskSheet,
    classification,
    preprocessed
  );
  const afterTasks = readTasks(taskSheet);
  const contextualAfter = afterTasks.find(
    (entry) => entry.task.task_id === contextualSeed.task_id
  ).task;
  const unrelatedAfter = afterTasks.find(
    (entry) => entry.task.task_id === unrelatedSeed.task_id
  ).task;
  const review = afterTasks.find(
    (entry) =>
      entry.task.task_id !== contextualSeed.task_id &&
      entry.task.task_id !== unrelatedSeed.task_id
  ).task;
  assert.strictEqual(results[0].target_unresolved, true);
  assert.strictEqual(results[0].fabricated_target, true);
  assert.strictEqual(results[0].target_outside_active_input, true);
  assert.strictEqual(results[0].target_repository_missing, false);
  assert.strictEqual(results[0].target_thread_mismatch, false);
  assert.strictEqual(afterTasks.length, 3);
  assert.strictEqual(contextualAfter.pending_action_type, '');
  assert.strictEqual(contextualAfter.needs_review, false);
  assert.strictEqual(unrelatedAfter.pending_action_type, '');
  assert.strictEqual(unrelatedAfter.needs_review, false);
  assert.strictEqual(review.status, 'REVIEW');
  assert.strictEqual(review.review_type, 'TARGET_UNRESOLVED');

  const mismatchSpreadsheet = makeOperationalSpreadsheet();
  const mismatchSheet = mismatchSpreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.TASKS
  );
  const mismatchSeed = seedTask(mismatchSheet, {
    stableThreadKey: 'root:repository-thread',
    taskTitle: 'Repository thread task'
  });
  const mismatchTask = readTasks(mismatchSheet)[0].task;
  const mismatchPreprocessed = preprocess(
    messageInput({
      messageId: 'same-input-different-thread',
      stableThreadKey: 'root:message-thread',
      subject: '[MOCK:UPDATE_DUE] Thread mismatch'
    }),
    { activeTasks: [taskSummary(mismatchTask)] }
  );
  const mismatchResults = applyClassification(
    mismatchSheet,
    classify(mismatchPreprocessed),
    mismatchPreprocessed
  );
  const mismatchAfter = readTasks(mismatchSheet);
  const untouchedMismatch = mismatchAfter.find(
    (entry) => entry.task.task_id === mismatchSeed.task_id
  ).task;
  assert.strictEqual(mismatchResults[0].target_unresolved, true);
  assert.strictEqual(mismatchResults[0].target_outside_active_input, false);
  assert.strictEqual(mismatchResults[0].target_thread_mismatch, true);
  assert.strictEqual(untouchedMismatch.pending_action_type, '');
  assert.strictEqual(untouchedMismatch.needs_review, false);
  assert.strictEqual(mismatchAfter.length, 2);
});

test('P3-I32_ACTION_TOP_LEVEL_FIELDS_ARE_ACTION_SPECIFIC', () => {
  const activeTask = {
    task_id: 'tsk_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    task_title: 'Synthetic semantic target',
    status: 'OPEN',
    due_date: '2026-07-25',
    manual_fields: []
  };
  function validFor(marker) {
    return clone(classify(preprocess(
      messageInput({
        subject: `[MOCK:${marker}] Top-level semantic validation`
      }),
      { activeTasks: [activeTask] }
    )));
  }
  function rejects(marker, mutate) {
    const output = validFor(marker);
    mutate(output.actions[0]);
    expectAppError(
      () => sandbox.WorkOsAiAdapter.validateOutput(output),
      'E_AI_SCHEMA'
    );
  }

  [
    (action) => { action.task_title = 'Forbidden update title'; },
    (action) => { action.suggested_deadline = '2026-08-02'; },
    (action) => { action.waiting_for_reply = true; },
    (action) => { action.priority = 'HIGH'; },
    (action) => {
      action.calendar_category = 'EXTERNAL_SUBMISSION';
    },
    (action) => { action.calendar_importance = 'HIGH'; }
  ].forEach((mutate) => rejects('UPDATE_DUE', mutate));

  ['CANCEL', 'MARK_COMPLETE'].forEach((marker) => {
    [
      (action) => { action.task_title = 'Forbidden task title'; },
      (action) => {
        action.deadline = '2026-08-02';
        action.deadline_basis = 'EXPLICIT';
      },
      (action) => { action.suggested_deadline = '2026-08-02'; },
      (action) => { action.deadline_basis = 'AMBIGUOUS'; },
      (action) => { action.waiting_for_reply = true; },
      (action) => { action.priority = 'HIGH'; },
      (action) => {
        action.calendar_category = 'FINAL_MATERIAL';
      },
      (action) => { action.calendar_importance = 'HIGH'; }
    ].forEach((mutate) => rejects(marker, mutate));
  });

  ['WAITING', 'CLEAR_WAITING'].forEach((marker) => {
    [
      (action) => { action.task_title = 'Forbidden waiting title'; },
      (action) => {
        action.deadline = '2026-08-02';
        action.deadline_basis = 'EXPLICIT';
      },
      (action) => { action.suggested_deadline = '2026-08-02'; },
      (action) => { action.deadline_basis = 'AMBIGUOUS'; },
      (action) => { action.priority = 'HIGH'; },
      (action) => {
        action.calendar_category = 'CONTRACT_APPLICATION';
      },
      (action) => { action.calendar_importance = 'HIGH'; }
    ].forEach((mutate) => rejects(marker, mutate));
  });

  [
    (action) => { action.task_title = 'Forbidden information title'; },
    (action) => {
      action.deadline = '2026-08-02';
      action.deadline_basis = 'EXPLICIT';
    },
    (action) => { action.suggested_deadline = '2026-08-02'; },
    (action) => { action.deadline_basis = 'AMBIGUOUS'; },
    (action) => { action.waiting_for_reply = true; },
    (action) => { action.priority = 'HIGH'; },
    (action) => {
      action.calendar_category = 'BID';
    },
    (action) => { action.calendar_importance = 'HIGH'; }
  ].forEach((mutate) => rejects('INFO', mutate));

  const spreadsheet = makeOperationalSpreadsheet();
  const taskSheet = spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.TASKS
  );
  const seed = seedTask(taskSheet, {
    stableThreadKey: 'root:semantic-side-effect'
  });
  const target = readTasks(taskSheet)[0].task;
  const preprocessed = preprocess(
    messageInput({
      messageId: 'semantic-pre-side-effect',
      stableThreadKey: seed.stableThreadKey,
      subject: '[MOCK:CANCEL] Forbidden top-level field'
    }),
    { activeTasks: [taskSummary(target)] }
  );
  const invalid = clone(classify(preprocessed));
  invalid.actions[0].priority = 'HIGH';
  const writesBefore = taskSheet.writeLog.length;
  expectAppError(
    () => applyClassification(taskSheet, invalid, preprocessed),
    'E_AI_SCHEMA'
  );
  const untouched = readTasks(taskSheet)[0].task;
  assert.strictEqual(taskSheet.writeLog.length, writesBefore);
  assert.strictEqual(untouched.pending_action_type, '');
  assert.strictEqual(untouched.needs_review, false);
});

test('P3-I33_UPDATE_DUE_DELETION_IS_VALID_BUT_ALWAYS_PENDING', () => {
  const spreadsheet = makeOperationalSpreadsheet();
  const taskSheet = spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.TASKS
  );
  const seed = seedTask(taskSheet, {
    stableThreadKey: 'root:due-deletion',
    dueDate: '2026-07-25'
  });
  const before = readTasks(taskSheet)[0].task;
  const preprocessed = preprocess(
    messageInput({
      messageId: 'due-deletion-message',
      stableThreadKey: seed.stableThreadKey,
      subject: '[MOCK:UPDATE_DUE] Delete due date'
    }),
    { activeTasks: [taskSummary(before)] }
  );
  const classification = clone(classify(preprocessed));
  classification.actions[0].deadline = null;
  classification.actions[0].suggested_deadline = null;
  classification.actions[0].deadline_basis = 'NONE';
  classification.actions[0].changes = { due_date: null };
  sandbox.WorkOsAiAdapter.validateOutput(classification);
  const results = applyClassification(
    taskSheet,
    classification,
    preprocessed
  );
  const after = readTasks(taskSheet)[0].task;
  assert.strictEqual(results[0].pending, true);
  assert.strictEqual(after.pending_action_type, 'UPDATE_DUE');
  assert.deepStrictEqual(
    after.pending_changes_json.changes,
    {
      due_date: '',
      deadline_basis: 'NONE',
      suggested_due_date: ''
    }
  );
  assert.strictEqual(after.needs_review, true);
  assert.strictEqual(
    formatTokyoDate(after.due_date, 'Asia/Tokyo'),
    '2026-07-25'
  );
});

test('P3-I34_INVALID_JSON_MOCK_IS_NONRETRYABLE_WITH_NO_TASK_EFFECT', () => {
  const directInput = preprocess(messageInput({
    subject: '[MOCK:INVALID_JSON] Malformed JSON fixture'
  }));
  expectAppError(
    () => classify(directInput),
    'E_AI_INVALID_JSON'
  );

  const spreadsheet = makeOperationalSpreadsheet();
  const taskSheet = spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.TASKS
  );
  const input = messageInput({
    messageId: 'invalid-json-message',
    stableThreadKey: 'root:invalid-json',
    subject: '[MOCK:INVALID_JSON] Malformed JSON worker fixture'
  });
  const now = new Date('2026-07-24T04:00:00.000Z');
  seedPreprocessedMessage(spreadsheet, input, now);
  const beforeExternal = { ...externalCallCounters };
  const result = sandbox.WorkOsWorker.processMockVerticalOnce({
    spreadsheet,
    gateway: workerGateway(input),
    preprocessor: sandbox.WorkOsEmailPreprocessor,
    budget: alwaysAvailableBudget(),
    now: () => new Date(now.getTime())
  });
  assert.strictEqual(result.status, 'FAILED');
  assert.strictEqual(readTasks(taskSheet).length, 0);
  const state = readMessage(spreadsheet, input.message_id);
  assert.strictEqual(state.processing_status, 'DEAD');
  assert.strictEqual(state.resume_stage, 'CLASSIFY');
  assert.strictEqual(state.classification_json, null);
  assert.strictEqual(state.last_error_code, 'E_AI_INVALID_JSON');
  assert.deepStrictEqual(externalCallCounters, beforeExternal);
});

const failed = tests.filter((result) => result.status === 'FAIL');
tests.forEach((result) => {
  const suffix = result.safe_message ? ` - ${result.safe_message}` : '';
  console.log(`${result.status} ${result.id} (${result.duration_ms}ms)${suffix}`);
});
console.log(JSON.stringify({
  suite: 'phase3_independent',
  passed: tests.length - failed.length,
  failed: failed.length,
  total: tests.length
}));

if (failed.length) {
  process.exitCode = 1;
}

