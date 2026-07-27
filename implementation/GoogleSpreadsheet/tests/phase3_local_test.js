'use strict';

/**
 * Phase 3 production-code local tests.
 *
 * The Apps Script sources are evaluated in a VM with bounded, in-memory
 * Spreadsheet/Gmail/Lock/Properties fakes. No Google service or network call
 * is made by this suite.
 */
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
      row < 1 ||
      column < 1 ||
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
    values.forEach((row, rowOffset) => {
      assert.strictEqual(row.length, this.columnCount);
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

  setNote(note) {
    assert.strictEqual(this.rowCount, 1);
    assert.strictEqual(this.columnCount, 1);
    this.sheet.notes[this.row - 1][this.column - 1] = String(note || '');
    return this;
  }

  getNote() {
    assert.strictEqual(this.rowCount, 1);
    assert.strictEqual(this.columnCount, 1);
    return this.sheet.notes[this.row - 1][this.column - 1];
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
    this.insertedRows = 0;
    this.readLog = [];
    this.writeLog = [];
    this.parent = null;
    this.cells = Array.from({ length: rows }, () =>
      Array.from({ length: columns }, () => '')
    );
    this.notes = Array.from({ length: rows }, () =>
      Array.from({ length: columns }, () => '')
    );
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
    for (let index = 0; index < count; index += 1) {
      this.cells.push(Array.from({ length: this.maxColumns }, () => ''));
      this.notes.push(Array.from({ length: this.maxColumns }, () => ''));
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
    this.sheets = sheets;
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
let globalLockHeld = false;
let lockAttemptCount = 0;
const scriptProperties = new Map();
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
    getUuid: () => crypto.randomUUID(),
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
    formatDate: (date, timezone) => {
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
  },
  SpreadsheetApp: {
    getActiveSpreadsheet: () => activeSpreadsheet
  },
  LockService: {
    getScriptLock: () => {
      let heldByThisLock = false;
      return {
        tryLock: () => {
          lockAttemptCount += 1;
          if (!lockAvailable || globalLockHeld) {
            return false;
          }
          heldByThisLock = true;
          globalLockHeld = true;
          return true;
        },
        hasLock: () => heldByThisLock && globalLockHeld,
        releaseLock: () => {
          if (heldByThisLock) {
            heldByThisLock = false;
            globalLockHeld = false;
          }
        }
      };
    }
  },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: (key) =>
        scriptProperties.has(String(key))
          ? scriptProperties.get(String(key))
          : null,
      setProperty: (key, value) => {
        scriptProperties.set(String(key), String(value));
        return sandbox.PropertiesService.getScriptProperties();
      },
      deleteProperty: (key) => {
        scriptProperties.delete(String(key));
        return sandbox.PropertiesService.getScriptProperties();
      },
      getProperties: () => Object.fromEntries(scriptProperties.entries())
    })
  },
  Gmail: {
    Users: {
      Labels: {},
      Threads: {},
      Messages: {}
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
  '11_EditHandler.gs',
  '13_LogAndDeadLetter.gs',
  '18_Worker.gs'
].forEach((fileName) => {
  const source = fs.readFileSync(path.join(appsScriptRoot, fileName), 'utf8');
  vm.runInContext(source, sandbox, { filename: fileName });
});

function makeSchemaSheet(sheetName, rows = 100) {
  const schema = sandbox.WorkOsSchemas.getSheetSchema(sheetName);
  const sheet = new FakeSheet(sheetName, rows, schema.length);
  sheet.getRange(1, 1, 1, schema.length).setValues([
    Array.from(schema, (column) => column.id)
  ]);
  sheet.getRange(2, 1, 1, schema.length).setValues([
    Array.from(schema, (column) => column.header)
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

function taskSheet(spreadsheet) {
  return spreadsheet.getSheetByName(sandbox.WorkOsConfig.SHEETS.TASKS);
}

function stateSheet(spreadsheet) {
  return spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE
  );
}

function makePreprocessed(marker, overrides = {}) {
  const messageId = overrides.message_id ||
    `synthetic-message-${String(marker).toLowerCase()}`;
  const threadId = overrides.thread_id || `synthetic-thread-${messageId}`;
  const stableThreadKey = overrides.stable_thread_key ||
    `root:synthetic-root-${messageId}`;
  return {
    schema_version: sandbox.WorkOsConfig.AI_SCHEMA_VERSION,
    message_id: messageId,
    thread_id: threadId,
    stable_thread_key: stableThreadKey,
    subject: overrides.subject || `[MOCK:${marker}] Synthetic subject`,
    sender: 'noreply@example.invalid',
    received_at: '2026-07-24T00:00:00.000Z',
    body: overrides.body || 'Synthetic body used only in memory.',
    previous_messages: [],
    active_tasks: overrides.active_tasks || [],
    today: overrides.today || '2026-07-24',
    timezone: 'Asia/Tokyo',
    content_hash: sandbox.WorkOsUtilities.sha256Hex(
      overrides.body || 'Synthetic body used only in memory.'
    ),
    warnings: [],
    metadata: {
      original_char_count: 35,
      output_char_count: 35,
      source_body_bytes: 35,
      truncated: false,
      attachment_content_included: false,
      external_url_fetched: false
    }
  };
}

function classify(marker, overrides = {}, adapterOptions = {}) {
  const preprocessed = makePreprocessed(marker, overrides);
  const adapter = new sandbox.WorkOsAiAdapter.MockAiAdapter(adapterOptions);
  return {
    preprocessed,
    classification: adapter.classify(
      sandbox.WorkOsAiAdapter.buildInput(preprocessed)
    )
  };
}

function allTasks(sheet) {
  const context = sandbox.WorkOsTaskRepository.createContext(sheet);
  return context.logicalRows.map((row) =>
    sandbox.WorkOsTaskRepository.readTaskAtRow(context, row)
  );
}

function isoDate(value) {
  if (!value) {
    return '';
  }
  if (value instanceof sandbox.Date) {
    return sandbox.Utilities.formatDate(
      value,
      sandbox.WorkOsConfig.TIMEZONE,
      'yyyy-MM-dd'
    );
  }
  return String(value).slice(0, 10);
}

function activeTaskSummary(task) {
  return {
    task_id: task.task_id,
    task_title: task.task_title,
    status: task.status,
    due_date: task.due_date ? isoDate(task.due_date) : null,
    manual_fields: Array.isArray(task.manual_fields)
      ? Array.from(task.manual_fields)
      : []
  };
}

function applyClassification(sheet, preprocessed, classification) {
  return sandbox.WorkOsTaskRepository.withLockedContext(sheet, (context) => {
    const results = sandbox.WorkOsTaskReviewPolicy.applyClassification(
      classification,
      {
        task_context: context,
        preprocessed
      }
    );
    return {
      results: Array.from(results),
      tasks: context.logicalRows.map((row) =>
        sandbox.WorkOsTaskRepository.readTaskAtRow(context, row)
      )
    };
  });
}

function applyMarker(sheet, marker, overrides = {}, adapterOptions = {}) {
  const fixture = classify(marker, overrides, adapterOptions);
  return {
    ...fixture,
    ...applyClassification(
      sheet,
      fixture.preprocessed,
      fixture.classification
    )
  };
}

function insertExistingTask(sheet, options = {}) {
  const source = options.source || crypto.randomUUID();
  const stableThreadKey = options.stable_thread_key ||
    'root:synthetic-existing-thread';
  let result;
  sandbox.WorkOsTaskRepository.withLockedContext(sheet, (context) => {
    result = sandbox.WorkOsTaskRepository.upsertTask({
      origin_key: sandbox.WorkOsUtilities.makeOriginKey(source, 0),
      task_title: options.task_title || 'Synthetic existing task',
      status: options.status || 'OPEN',
      due_date: options.due_date || '2026-08-01',
      priority: options.priority || 'MEDIUM',
      stable_thread_key: stableThreadKey,
      source_message_id: `synthetic-source-${source}`,
      source_thread_id: 'synthetic-existing-thread',
      source_action_index: 0,
      ai_provider: 'MOCK',
      ai_prompt_version: 'phase3-test'
    }, context);
  });
  return sandbox.WorkOsTaskRepository.findByTaskId(
    sandbox.WorkOsTaskRepository.createContext(sheet),
    result.task_id
  );
}

function insertTaskFixture(sheet, fields = {}) {
  const source = fields.source || crypto.randomUUID();
  let result;
  sandbox.WorkOsTaskRepository.withLockedContext(sheet, (context) => {
    result = sandbox.WorkOsTaskRepository.upsertTask({
      origin_key: sandbox.WorkOsUtilities.makeOriginKey(source, 0),
      task_title: fields.task_title || 'Synthetic audit Task',
      status: fields.status || 'OPEN',
      needs_review: fields.needs_review === true,
      decision: fields.decision || 'NONE',
      review_state: fields.review_state || 'NONE',
      review_type: fields.review_type || '',
      completed: fields.completed === true,
      excluded: fields.excluded === true,
      waiting_for_reply: fields.waiting_for_reply === true,
      due_date: fields.due_date || '',
      suggested_due_date: fields.suggested_due_date || '',
      deadline_basis: fields.deadline_basis || 'NONE',
      pending_action_type: fields.pending_action_type || '',
      pending_changes_json: fields.pending_changes_json || {},
      priority: 'MEDIUM',
      source_message_id: `synthetic-source-${source}`,
      source_thread_id: `synthetic-thread-${source}`,
      stable_thread_key: `root:synthetic-${source}`,
      source_action_index: 0,
      ai_provider: 'MOCK',
      ai_model: 'deterministic-v1',
      ai_prompt_version: 'phase3-audit'
    }, context);
  });
  return readTask(sheet, result.task_id);
}

function columnMap(sheetName) {
  return sandbox.WorkOsSchemas.buildColumnMapFromIds(
    sandbox.WorkOsSchemas.getInternalIds(sheetName)
  );
}

function setTaskCell(sheet, physicalRow, columnId, value) {
  const map = columnMap(sandbox.WorkOsConfig.SHEETS.TASKS);
  sheet.getRange(physicalRow, map[columnId] + 1, 1, 1).setValues([[value]]);
}

function taskRow(sheet, taskId) {
  return sandbox.WorkOsTaskRepository.createContext(sheet).byTaskId[taskId];
}

function readTask(sheet, taskId) {
  return sandbox.WorkOsTaskRepository.findByTaskId(
    sandbox.WorkOsTaskRepository.createContext(sheet),
    taskId
  );
}

function reviewNote(sheet, taskId) {
  const row = taskRow(sheet, taskId);
  const map = columnMap(sandbox.WorkOsConfig.SHEETS.TASKS);
  return sheet.getRange(row, map.review_type + 1, 1, 1).getNote();
}

function applyDecision(sheet, taskId, decision) {
  const row = taskRow(sheet, taskId);
  setTaskCell(
    sheet,
    row,
    'decision',
    sandbox.WorkOsSchemas.toSheetEnum('Decision', decision)
  );
  sandbox.WorkOsTaskRepository.applyUserEdits(
    sheet,
    [{ row, column_ids: ['decision'] }],
    new Date('2026-07-24T02:00:00.000Z')
  );
  return readTask(sheet, taskId);
}

function applyDecisionWithResult(sheet, taskId, decision) {
  const row = taskRow(sheet, taskId);
  setTaskCell(
    sheet,
    row,
    'decision',
    sandbox.WorkOsSchemas.toSheetEnum('Decision', decision)
  );
  const results = sandbox.WorkOsTaskRepository.applyUserEdits(
    sheet,
    [{ row, column_ids: ['decision'] }],
    new Date('2026-07-24T02:00:00.000Z')
  );
  return {
    result: results[0],
    task: readTask(sheet, taskId)
  };
}

function rawMessage(marker, overrides = {}) {
  const messageId = overrides.message_id ||
    `synthetic-worker-${String(marker).toLowerCase()}`;
  return {
    message_id: messageId,
    thread_id: overrides.thread_id || `synthetic-thread-${messageId}`,
    stable_thread_key: overrides.stable_thread_key ||
      `root:synthetic-root-${messageId}`,
    subject: `[MOCK:${marker}] Synthetic worker subject`,
    sender: 'noreply@example.invalid',
    received_at: new Date('2026-07-24T00:00:00.000Z'),
    plain_body: overrides.plain_body || 'Synthetic worker body.',
    previous_messages: []
  };
}

function seedPreprocessed(spreadsheet, message) {
  const preprocessed = sandbox.WorkOsEmailPreprocessor.preprocess(
    message,
    {
      today: '2026-07-24',
      timezone: sandbox.WorkOsConfig.TIMEZONE,
      active_tasks: []
    }
  );
  sandbox.WorkOsMessageStateRepository.withLockedContext(
    stateSheet(spreadsheet),
    (context) => {
      const claim = sandbox.WorkOsMessageStateRepository.claimInContext(
        {
          message_id: message.message_id,
          thread_id: message.thread_id,
          stable_thread_key: message.stable_thread_key,
          received_at: message.received_at,
          source_mode: 'MANUAL'
        },
        'seed-phase3',
        context,
        new Date('2026-07-24T00:10:00.000Z')
      );
      assert.strictEqual(claim.claimed, true);
      sandbox.WorkOsMessageStateRepository.checkpointPreprocessedInContext(
        message.message_id,
        'seed-phase3',
        preprocessed.content_hash,
        context,
        new Date('2026-07-24T00:10:01.000Z')
      );
    }
  );
  return preprocessed;
}

function makeVerticalGateway(message, options = {}) {
  const calls = {
    refetch: 0,
    aiLabels: [],
    failureLabels: []
  };
  let aiLabelFailures = Number(options.ai_label_failures || 0);
  return {
    calls,
    refetchMessageContent: () => {
      calls.refetch += 1;
      return message;
    },
    syncAiLabels: (threadId, labels) => {
      calls.aiLabels.push({
        thread_id: threadId,
        labels: Array.from(labels)
      });
      if (aiLabelFailures > 0) {
        aiLabelFailures -= 1;
        throw new sandbox.WorkOsAppError(
          'E_GMAIL_LABEL_SYNC',
          'GMAIL_AI_LABEL_SYNC',
          true,
          'Synthetic retryable Gmail label failure'
        );
      }
      return { added_count: labels.length, removed_count: 0 };
    },
    setSystemFailureLabel: (threadId, enabled) => {
      calls.failureLabels.push({ thread_id: threadId, enabled });
      return { added_count: enabled ? 1 : 0, removed_count: enabled ? 0 : 1 };
    }
  };
}

function installLabelFake() {
  const labels = sandbox.WorkOsConfig.GMAIL_LABELS.map((name, index) => ({
    id: `LBL_${index}`,
    name
  }));
  labels.push({ id: 'USER_LABEL', name: '蛻ｩ逕ｨ閠・菫晄戟' });
  const calls = { modify: [] };
  sandbox.Gmail.Users.Labels.list = () => ({
    labels: labels.map((label) => ({ ...label }))
  });
  sandbox.Gmail.Users.Threads.modify = (resource, userId, threadId) => {
    calls.modify.push({
      resource: {
        addLabelIds: Array.from(resource.addLabelIds || []),
        removeLabelIds: Array.from(resource.removeLabelIds || [])
      },
      userId,
      threadId
    });
    return {};
  };
  return { labels, calls };
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
      safe_message: sandbox.WorkOsUtilities.redact(error.message)
    });
  } finally {
    activeSpreadsheet = null;
    lockAvailable = true;
    globalLockHeld = false;
    lockAttemptCount = 0;
    scriptProperties.clear();
  }
}

test('P3-U01_NEW_HIGH_IS_AUTOMATIC_OPEN', () => {
  const sheet = makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.TASKS);
  const applied = applyMarker(sheet, 'NEW_HIGH');
  assert.strictEqual(applied.results.length, 1);
  assert.strictEqual(applied.results[0].operation, 'INSERT');
  assert.strictEqual(applied.tasks.length, 1);
  const task = applied.tasks[0];
  assert.strictEqual(task.status, 'OPEN');
  assert.strictEqual(task.needs_review, false);
  assert.strictEqual(task.review_state, 'NONE');
  assert.strictEqual(task.decision, 'NONE');
  assert.strictEqual(task.deadline_basis, 'EXPLICIT');
  assert.strictEqual(isoDate(task.due_date), '2026-07-31');
});

test('P3-U01B_RELATIVE_DEADLINE_REQUIRES_HUMAN_REVIEW', () => {
  cons…8984 tokens truncated…ng_status, 'PREPROCESSED');
    assert.strictEqual(state.resume_stage, 'CLASSIFY');
    assert.strictEqual(state.retry_count, 0);
    assert.strictEqual(state.last_error_code, '');
    assert.strictEqual(state.claim_run_id, '');
  }
  assert.strictEqual(gateway.calls.refetch, 0);
  assert.deepStrictEqual(gateway.calls.failureLabels, []);
});

test('P3-G17_SYS_FAILURE_LABEL_IS_THREAD_AGGREGATE', () => {
  const spreadsheet = makeOperationalSpreadsheet();
  activeSpreadsheet = spreadsheet;
  const threadId = 'synthetic-aggregate-thread';
  const stableThreadKey = 'root:synthetic-aggregate-root';
  const failedMessage = rawMessage('TRANSIENT_ERROR', {
    message_id: 'synthetic-aggregate-a',
    thread_id: threadId,
    stable_thread_key: stableThreadKey
  });
  seedPreprocessed(spreadsheet, failedMessage);
  const failedGateway = makeVerticalGateway(failedMessage);
  const failedResult = sandbox.WorkOsWorker.processMockVerticalOnce({
    spreadsheet,
    gateway: failedGateway,
    adapter: new sandbox.WorkOsAiAdapter.MockAiAdapter({
      transientCounter: { remaining: 1 }
    }),
    now: () => new Date('2026-07-24T01:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(failedResult.status, 'FAILED');

  const successfulMessage = rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-aggregate-b',
    thread_id: threadId,
    stable_thread_key: stableThreadKey
  });
  successfulMessage.received_at = new Date('2026-07-24T00:01:00.000Z');
  seedPreprocessed(spreadsheet, successfulMessage);
  const successfulGateway = makeVerticalGateway(successfulMessage);
  const successfulResult = sandbox.WorkOsWorker.processMockVerticalOnce({
    spreadsheet,
    gateway: successfulGateway,
    now: () => new Date('2026-07-24T01:01:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(successfulResult.status, 'COMPLETE');
  assert.strictEqual(
    successfulGateway.calls.failureLabels.some((item) =>
      item.thread_id === threadId && item.enabled === true
    ),
    true
  );
  const states = sandbox.WorkOsMessageStateRepository.createContext(
    stateSheet(spreadsheet)
  ).logicalRows;
  const failedState = states.find((item) =>
    item.message_id === failedMessage.message_id
  );
  const successfulState = states.find((item) =>
    item.message_id === successfulMessage.message_id
  );
  assert.strictEqual(failedState.processing_status, 'RETRY');
  assert.strictEqual(successfulState.processing_status, 'DONE');
});

test('P3-G18_MENU_REACHABLE_SELECTION_APPLIES_REVIEW_DECISION', () => {
  const sheet = makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.TASKS);
  new FakeSpreadsheet([
    sheet,
    makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.SYNC_STATE)
  ]);
  const applied = applyMarker(sheet, 'NEW_REVIEW', {
    message_id: 'synthetic-menu-review'
  });
  const task = applied.tasks[0];
  const row = taskRow(sheet, task.task_id);
  const map = columnMap(sandbox.WorkOsConfig.SHEETS.TASKS);
  setTaskCell(sheet, row, 'decision', '蜿怜・');
  sandbox.SpreadsheetApp.getActiveRange = () =>
    sheet.getRange(row, map.decision + 1, 1, 1);
  const result = sandbox.applySelectedTaskEdits();
  assert.strictEqual(result.status, 'COMPLETE');
  assert.strictEqual(result.processed_rows, 1);
  const accepted = readTask(sheet, task.task_id);
  assert.strictEqual(accepted.status, 'OPEN');
  assert.strictEqual(accepted.needs_review, false);
  assert.strictEqual(accepted.review_state, 'APPLIED');
  sandbox.SpreadsheetApp.getActiveRange = () =>
    sheet.getRange(
      sandbox.WorkOsConfig.DATA_START_ROW,
      map.decision + 1,
      21,
      1
    );
  assert.throws(
    () => sandbox.applySelectedTaskEdits(),
    (error) => error.code === 'E_EDIT_RANGE_LIMIT'
  );
  const menuSource = fs.readFileSync(
    path.join(appsScriptRoot, 'Menu.gs'),
    'utf8'
  );
  assert.strictEqual(
    menuSource.includes(
      ".addItem('Task邱ｨ髮・ｒ謇句虚蜿肴丐・・allback・・, " +
      "'menuApplySelectedTaskEdits')"
    ),
    true
  );
});

test('P3-A01_DECISION_REJECTS_NORMAL_TERMINAL_AND_CLOSED_TASKS', () => {
  const sheet = makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.TASKS);
  const normal = insertTaskFixture(sheet, { source: 'audit-normal-open' });
  const normalVersion = normal.row_version;
  const invalidNormal = applyDecisionWithResult(
    sheet,
    normal.task_id,
    'ACCEPT'
  );
  assert.strictEqual(invalidNormal.result.operation, 'REJECTED');
  assert.strictEqual(invalidNormal.result.error_code, 'REVIEW_NOT_OPEN');
  assert.strictEqual(invalidNormal.task.decision, 'NONE');
  assert.strictEqual(invalidNormal.task.review_state, 'NONE');
  assert.strictEqual(invalidNormal.task.status, 'OPEN');
  assert.strictEqual(invalidNormal.task.row_version, normalVersion);

  [
    {
      source: 'audit-terminal-done',
      status: 'DONE',
      completed: true
    },
    {
      source: 'audit-terminal-excluded',
      status: 'EXCLUDED',
      excluded: true
    },
    {
      source: 'audit-terminal-cancelled',
      status: 'CANCELLED'
    }
  ].forEach((fixture) => {
    const task = insertTaskFixture(sheet, fixture);
    const before = JSON.stringify(task);
    const outcome = applyDecisionWithResult(sheet, task.task_id, 'REJECT');
    assert.strictEqual(outcome.result.operation, 'REJECTED');
    assert.strictEqual(outcome.task.decision, 'NONE');
    assert.strictEqual(outcome.task.status, task.status);
    assert.strictEqual(outcome.task.row_version, task.row_version);
    assert.strictEqual(
      JSON.parse(before).pending_action_type,
      outcome.task.pending_action_type
    );
  });

  const review = applyMarker(sheet, 'NEW_REVIEW', {
    message_id: 'synthetic-audit-closed-review'
  }).tasks.find((item) => item.review_type === 'NEW_TASK');
  const accepted = applyDecisionWithResult(sheet, review.task_id, 'ACCEPT');
  assert.strictEqual(accepted.task.review_state, 'APPLIED');
  const versionAfterAccept = accepted.task.row_version;
  const replay = applyDecisionWithResult(sheet, review.task_id, 'REJECT');
  assert.strictEqual(replay.result.operation, 'REJECTED');
  assert.strictEqual(replay.task.decision, 'ACCEPT');
  assert.strictEqual(replay.task.review_state, 'APPLIED');
  assert.strictEqual(replay.task.row_version, versionAfterAccept);
});

test('P3-A02_TARGET_UNRESOLVED_ACCEPT_FAILS_CLOSED_REJECT_CLOSES', () => {
  function makeUnresolved(messageId) {
    const sheet = makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.TASKS);
    const fakeTaskId = `tsk_${'a'.repeat(32)}`;
    const review = applyMarker(sheet, 'UPDATE_DUE', {
      message_id: messageId,
      stable_thread_key: `root:${messageId}`,
      active_tasks: [{
        task_id: fakeTaskId,
        task_title: 'Synthetic unresolved target',
        status: 'OPEN',
        due_date: '2026-08-01',
        manual_fields: []
      }]
    }).tasks[0];
    return { sheet, review };
  }

  const acceptFixture = makeUnresolved('synthetic-audit-unresolved-accept');
  const unresolvedDueBefore = isoDate(acceptFixture.review.due_date);
  const accept = applyDecisionWithResult(
    acceptFixture.sheet,
    acceptFixture.review.task_id,
    'ACCEPT'
  );
  assert.strictEqual(accept.result.operation, 'REJECTED');
  assert.strictEqual(accept.result.error_code, 'REVIEW_TARGET_UNRESOLVED');
  assert.strictEqual(accept.task.status, 'REVIEW');
  assert.strictEqual(accept.task.needs_review, true);
  assert.strictEqual(accept.task.review_state, 'OPEN');
  assert.strictEqual(accept.task.decision, 'NONE');
  assert.strictEqual(isoDate(accept.task.due_date), unresolvedDueBefore);

  const rejectFixture = makeUnresolved('synthetic-audit-unresolved-reject');
  const reject = applyDecisionWithResult(
    rejectFixture.sheet,
    rejectFixture.review.task_id,
    'REJECT'
  );
  assert.strictEqual(reject.result.operation, 'UPDATE');
  assert.strictEqual(reject.task.status, 'EXCLUDED');
  assert.strictEqual(reject.task.excluded, true);
  assert.strictEqual(reject.task.review_state, 'REJECTED');
  assert.strictEqual(reject.task.pending_action_type, '');
});

test('P3-A03_PENDING_CONFLICT_APPLIES_EXACT_TARGET_WITH_CAS_ONCE', () => {
  const sheet = makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.TASKS);
  const target = insertTaskFixture(sheet, {
    source: 'audit-conflict-target',
    due_date: '2026-08-01',
    deadline_basis: 'EXPLICIT'
  });
  const provenance = sandbox.WorkOsAiAdapter.getMetadata(
    new sandbox.WorkOsAiAdapter.MockAiAdapter()
  );
  const review = insertTaskFixture(sheet, {
    source: 'audit-conflict-proxy',
    status: 'REVIEW',
    needs_review: true,
    review_state: 'OPEN',
    review_type: 'PENDING_CONFLICT',
    pending_action_type: 'UPDATE_DUE',
    pending_changes_json: {
      origin_key: sandbox.WorkOsUtilities.makeOriginKey(
        'audit-conflict-proxy',
        0
      ),
      action_type: 'UPDATE_DUE',
      changes: {
        due_date: '2026-08-20',
        deadline_basis: 'EXPLICIT',
        suggested_due_date: ''
      },
      target_task_id: target.task_id,
      expected_target_row_version: target.row_version,
      target_resolution: 'CONFLICT',
      manual_conflicts: [],
      ai_provenance: provenance
    }
  });

  const outcome = applyDecisionWithResult(sheet, review.task_id, 'ACCEPT');
  const updatedTarget = readTask(sheet, target.task_id);
  const closedReview = readTask(sheet, review.task_id);
  assert.strictEqual(outcome.result.task_id, target.task_id);
  assert.strictEqual(outcome.result.review_task_id, review.task_id);
  assert.strictEqual(isoDate(updatedTarget.due_date), '2026-08-20');
  assert.strictEqual(updatedTarget.deadline_basis, 'EXPLICIT');
  assert.strictEqual(updatedTarget.row_version, target.row_version + 1);
  assert.strictEqual(closedReview.status, 'EXCLUDED');
  assert.strictEqual(closedReview.review_state, 'APPLIED');
  assert.strictEqual(closedReview.decision, 'ACCEPT');
  assert.strictEqual(isoDate(closedReview.due_date), '');

  const replay = applyDecisionWithResult(sheet, review.task_id, 'ACCEPT');
  assert.strictEqual(replay.result.operation, 'REJECTED');
  assert.strictEqual(replay.result.error_code, 'REVIEW_ALREADY_CLOSED');
  assert.strictEqual(
    readTask(sheet, target.task_id).row_version,
    target.row_version + 1
  );
});

test('P3-A04_PENDING_CONFLICT_GUARDS_TARGET_ID_VERSION_AND_PENDING', () => {
  const provenance = sandbox.WorkOsAiAdapter.getMetadata(
    new sandbox.WorkOsAiAdapter.MockAiAdapter()
  );
  function fixture(mode) {
    const sheet = makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.TASKS);
    const target = insertTaskFixture(sheet, {
      source: `audit-conflict-${mode}-target`,
      due_date: '2026-08-01',
      deadline_basis: 'EXPLICIT'
    });
    if (mode === 'PENDING') {
      sandbox.WorkOsTaskRepository.withLockedContext(sheet, (context) => {
        sandbox.WorkOsTaskRepository.stagePendingChange(
          target.task_id,
          'UPDATE_DUE',
          {
            origin_key: sandbox.WorkOsUtilities.makeOriginKey(
              'audit-existing-pending',
              0
            ),
            changes: {
              due_date: '2026-08-05',
              deadline_basis: 'EXPLICIT',
              suggested_due_date: ''
            },
            ai_provenance: provenance
          },
          context
        );
      });
    }
    const currentTarget = readTask(sheet, target.task_id);
    const review = insertTaskFixture(sheet, {
      source: `audit-conflict-${mode}-proxy`,
      status: 'REVIEW',
      needs_review: true,
      review_state: 'OPEN',
      review_type: 'PENDING_CONFLICT',
      pending_action_type: 'UPDATE_DUE',
      pending_changes_json: {
        origin_key: sandbox.WorkOsUtilities.makeOriginKey(
          `audit-conflict-${mode}-proxy`,
          0
        ),
        action_type: 'UPDATE_DUE',
        changes: { priority: 'HIGH' },
        target_task_id: mode === 'MISSING'
          ? `tsk_${'f'.repeat(32)}`
          : target.task_id,
        expected_target_row_version: mode === 'VERSION'
          ? currentTarget.row_version + 1
          : currentTarget.row_version,
        target_resolution: 'CONFLICT',
        manual_conflicts: [],
        ai_provenance: provenance
      }
    });
    return { sheet, target: currentTarget, review };
  }

  ['MISSING', 'VERSION', 'PENDING'].forEach((mode) => {
    const item = fixture(mode);
    const before = readTask(item.sheet, item.target.task_id);
    const outcome = applyDecisionWithResult(
      item.sheet,
      item.review.task_id,
      'ACCEPT'
    );
    const after = readTask(item.sheet, item.target.task_id);
    const proxy = readTask(item.sheet, item.review.task_id);
    assert.strictEqual(outcome.result.operation, 'REJECTED');
    assert.strictEqual(outcome.result.error_code, 'REVIEW_TARGET_CONFLICT');
    assert.strictEqual(after.row_version, before.row_version);
    assert.strictEqual(after.priority, before.priority);
    assert.strictEqual(proxy.review_state, 'OPEN');
    assert.strictEqual(proxy.decision, 'NONE');
  });
});

test('P3-A05_TASK_STATE_INVARIANT_REJECTS_CORRUPT_WRITES', () => {
  const valid = insertTaskFixture(
    makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.TASKS),
    { source: 'audit-valid-invariant' }
  );
  [
    { status: 'DONE', completed: false },
    { status: 'REVIEW', needs_review: false },
    { pending_action_type: 'UPDATE_DUE', pending_changes_json: {} },
    { review_state: 'APPLIED', decision: 'REJECT' },
    {
      status: 'CANCELLED',
      pending_action_type: 'UPDATE_DUE',
      pending_changes_json: { changes: { priority: 'HIGH' } }
    }
  ].forEach((patch) => {
    const candidate = { ...valid, ...patch };
    const invariant =
      sandbox.WorkOsSchemas.validateTaskStateInvariant(candidate);
    assert.strictEqual(invariant.ok, false);
    assert.ok(invariant.errors.length > 0);
    assert.strictEqual(
      sandbox.WorkOsSchemas.validateTaskForWrite(candidate, false).ok,
      false
    );
  });

  const sheet = makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.TASKS);
  const terminal = insertTaskFixture(sheet, {
    source: 'audit-terminal-pending',
    status: 'DONE',
    completed: true
  });
  const before = JSON.stringify(readTask(sheet, terminal.task_id));
  assert.throws(
    () => sandbox.WorkOsTaskRepository.withLockedContext(sheet, (context) =>
      sandbox.WorkOsTaskRepository.stagePendingChange(
        terminal.task_id,
        'UPDATE_DUE',
        {
          origin_key: sandbox.WorkOsUtilities.makeOriginKey(
            'audit-terminal-pending-change',
            0
          ),
          changes: {
            due_date: '2026-09-01',
            deadline_basis: 'EXPLICIT',
            suggested_due_date: ''
          },
          ai_provenance: sandbox.WorkOsAiAdapter.getMetadata(
            new sandbox.WorkOsAiAdapter.MockAiAdapter()
          )
        },
        context
      )
    ),
    (error) => error.code === 'E_TASK_VALIDATION'
  );
  assert.strictEqual(
    JSON.stringify(readTask(sheet, terminal.task_id)),
    before
  );
});

test('P3-A06_REVIEW_NOTE_SUMMARIZES_PENDING_AND_CLEARS_ON_DECISION', () => {
  const sheet = makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.TASKS);
  const existing = insertTaskFixture(sheet, {
    source: 'audit-review-note-target',
    task_title:
      'Synthetic deadline task https://private.example.invalid/item',
    due_date: '2026-08-01',
    deadline_basis: 'EXPLICIT'
  });
  setTaskCell(
    sheet,
    taskRow(sheet, existing.task_id),
    'manual_fields',
    '["due_date"]'
  );
  const fixture = classify('UPDATE_DUE', {
    message_id: 'synthetic-review-note-message',
    stable_thread_key: existing.stable_thread_key,
    today: '2026-08-10',
    active_tasks: [activeTaskSummary(existing)]
  });
  fixture.classification.actions[0].deadline = '2026-08-05';
  fixture.classification.actions[0].changes.due_date = '2026-08-05';
  fixture.classification.actions[0].deadline_basis = 'EXPLICIT';
  applyClassification(sheet, fixture.preprocessed, fixture.classification);

  const pending = readTask(sheet, existing.task_id);
  const note = reviewNote(sheet, existing.task_id);
  assert.ok(note.includes('UPDATE_DUE'));
  assert.ok(note.includes('迴ｾ蝨ｨ蛟､'));
  assert.ok(note.includes('2026-08-01'), note);
  assert.ok(note.includes('螟画峩蠕・));
  assert.ok(note.includes('2026-08-05'));
  assert.ok(note.includes('譛滄剞譬ｹ諡'));
  assert.ok(note.includes('驕主悉譌･'));
  assert.ok(note.includes('謇句虚遶ｶ蜷・ 縺ゅｊ'));
  assert.ok(note.includes('[繝ｪ繝ｳ繧ｯ]'));
  assert.strictEqual(note.includes('https://'), false);
  assert.strictEqual(note.includes('synthetic-review-note-message'), false);
  assert.strictEqual(note.includes(pending.task_id), false);
  assert.strictEqual(note.includes('pending_changes_json'), false);
  assert.strictEqual(note.includes('{'), false);

  applyDecision(sheet, existing.task_id, 'ACCEPT');
  assert.strictEqual(reviewNote(sheet, existing.task_id), '');
});

test('P3-A07_REVIEW_NOTE_COVERS_NON_DEADLINE_ACTION_TYPES', () => {
  [
    ['MARK_COMPLETE', 'MARK_COMPLETE'],
    ['CANCEL', 'CANCEL_TASK'],
    ['WAITING', 'SET_WAITING']
  ].forEach(([marker, expectedAction], index) => {
    const sheet = makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.TASKS);
    const existing = insertTaskFixture(sheet, {
      source: `audit-review-note-action-${index}`,
      stable_thread_key: `root:audit-review-note-action-${index}`
    });
    applyMarker(sheet, marker, {
      message_id: `audit-review-note-message-${index}`,
      stable_thread_key: existing.stable_thread_key,
      active_tasks: [activeTaskSummary(existing)]
    });
    const note = reviewNote(sheet, existing.task_id);
    assert.ok(note.includes(expectedAction), note);
    assert.ok(note.includes('迴ｾ蝨ｨ蛟､'), note);
    assert.ok(note.includes('螟画峩蠕・), note);
  });
});

test('P3-G19_MOCK_ACCEPTANCE_USES_ONE_SHARED_120_SECOND_BUDGET', () => {
  const spreadsheet = makeOperationalSpreadsheet();
  activeSpreadsheet = spreadsheet;
  const message = rawMessage('NEW_HIGH', {
    message_id: 'synthetic-shared-budget'
  });
  const candidate = {
    message_id: message.message_id,
    thread_id: message.thread_id,
    stable_thread_key: message.stable_thread_key,
    received_at: message.received_at,
    source_mode: 'MANUAL',
    manual_decision: 'PROCESS'
  };
  const gateway = makeVerticalGateway(message);
  gateway.listManualCandidates = () => [candidate];
  gateway.fetchSelectedContent = () => message;
  const originalGateway = sandbox.WorkOsGmailGateway;
  const originalUtilities = sandbox.WorkOsUtilities;
  let createBudgetCalls = 0;
  let budgetChecks = 0;
  const sharedBudget = {
    isExhausted: () => {
      budgetChecks += 1;
      return budgetChecks >= 5;
    }
  };
  sandbox.WorkOsGmailGateway = gateway;
  sandbox.WorkOsUtilities = Object.freeze({
    ...originalUtilities,
    createSoftBudget: () => {
      createBudgetCalls += 1;
      return sharedBudget;
    }
  });
  try {
    const result = sandbox.WorkOsWorker.runMockAcceptance();
    assert.strictEqual(result.status, 'PAUSED');
    assert.strictEqual(result.phase2.status, 'COMPLETE');
    assert.strictEqual(result.phase2.processed_count, 1);
    assert.strictEqual(result.phase3.status, 'PAUSED');
    assert.strictEqual(createBudgetCalls, 1);
    assert.strictEqual(budgetChecks, 5);
  } finally {
    sandbox.WorkOsGmailGateway = originalGateway;
    sandbox.WorkOsUtilities = originalUtilities;
  }
});

const summary = {
  phase: 3,
  suite: 'production_code_local',
  passed: tests.filter((item) => item.status === 'PASS').length,
  failed: tests.filter((item) => item.status === 'FAIL').length,
  local_mock: tests.every((item) => item.status === 'PASS')
    ? 'PASS'
    : 'FAIL',
  google_workspace_real: 'NOT_EXECUTED',
  tests
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed > 0) {
  process.exitCode = 1;
}

