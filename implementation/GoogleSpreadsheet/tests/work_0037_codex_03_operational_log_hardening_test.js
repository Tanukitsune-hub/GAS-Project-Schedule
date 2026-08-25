'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appsScriptRoot = path.resolve(__dirname, '..', 'apps-script-v2');

class FakeRange {
  constructor(sheet, row, column, rowCount = 1, columnCount = 1) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.rowCount = rowCount;
    this.columnCount = columnCount;
    if (row < 1 || column < 1 ||
        row + rowCount - 1 > sheet.maxRows ||
        column + columnCount - 1 > sheet.maxColumns) {
      throw new Error('RANGE_OUT_OF_BOUNDS');
    }
  }

  getValues() {
    return Array.from({ length: this.rowCount }, (_, rowOffset) =>
      Array.from({ length: this.columnCount }, (_, columnOffset) =>
        this.sheet.cells[this.row - 1 + rowOffset][
          this.column - 1 + columnOffset
        ]));
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
    return this;
  }
}

class FakeSheet {
  constructor(name, rows, columns) {
    this.name = name;
    this.maxRows = rows;
    this.maxColumns = columns;
    this.cells = Array.from({ length: rows }, () =>
      Array.from({ length: columns }, () => ''));
  }

  getName() { return this.name; }
  getRange(row, column, rowCount, columnCount) {
    return new FakeRange(this, row, column, rowCount, columnCount);
  }
  getMaxRows() { return this.maxRows; }
  getMaxColumns() { return this.maxColumns; }
  insertRowsAfter(after, count) {
    assert.strictEqual(after, this.maxRows);
    for (let index = 0; index < count; index += 1) {
      this.cells.push(Array.from({ length: this.maxColumns }, () => ''));
    }
    this.maxRows += count;
  }
}

class FakeSpreadsheet {
  constructor(sheets) { this.sheets = sheets; }
  getSheetByName(name) {
    return this.sheets.find((sheet) => sheet.getName() === name) || null;
  }
  getSheets() { return this.sheets.slice(); }
}

let activeSpreadsheet = null;

function makeUtilities() {
  return {
    getUuid: () => crypto.randomUUID(),
    computeDigest: (_algorithm, value) =>
      Array.from(crypto.createHash('sha256').update(String(value), 'utf8')
        .digest()).map((byte) => byte > 127 ? byte - 256 : byte),
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    Charset: { UTF_8: 'UTF_8' },
    formatDate: () => '2026-08-25'
  };
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
  ArrayBuffer,
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Uint16Array,
  Error,
  RegExp,
  Utilities: makeUtilities(),
  SpreadsheetApp: {
    getActiveSpreadsheet: () => activeSpreadsheet
  },
  LockService: {
    getScriptLock: () => ({
      tryLock: () => true,
      hasLock: () => true,
      releaseLock: () => {}
    })
  }
};
vm.createContext(sandbox);
['00_Config.gs', '01_TypesAndSchemas.gs', '17_Utilities.gs',
  '13_LogAndDeadLetter.gs'].forEach((fileName) => {
  vm.runInContext(
    fs.readFileSync(path.join(appsScriptRoot, fileName), 'utf8'),
    sandbox,
    { filename: fileName }
  );
});

function makeSchemaSheet(sheetName, rows = 40) {
  const schema = sandbox.WorkOsSchemas.getSheetSchema(sheetName);
  const sheet = new FakeSheet(sheetName, rows, schema.length);
  sheet.getRange(1, 1, 1, schema.length).setValues([
    schema.map((column) => column.id)
  ]);
  sheet.getRange(2, 1, 1, schema.length).setValues([
    schema.map((column) => column.header)
  ]);
  return sheet;
}

function makeSpreadsheet() {
  const names = [
    sandbox.WorkOsConfig.SHEETS.RUN_HISTORY,
    sandbox.WorkOsConfig.SHEETS.ERRORS,
    sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE,
    sandbox.WorkOsConfig.SHEETS.TASKS,
    sandbox.WorkOsConfig.SHEETS.TASK_AUTHORITY_LEDGER,
    sandbox.WorkOsConfig.SHEETS.SYNC_STATE
  ];
  return new FakeSpreadsheet(names.map((name) => makeSchemaSheet(name)));
}

function historySheet(spreadsheet) {
  return spreadsheet.getSheetByName(sandbox.WorkOsConfig.SHEETS.RUN_HISTORY);
}

function historyIds() {
  return sandbox.WorkOsSchemas.getInternalIds(
    sandbox.WorkOsConfig.SHEETS.RUN_HISTORY
  );
}

function historyMap() {
  return sandbox.WorkOsSchemas.buildColumnMapFromIds(historyIds());
}

function historyRecords(spreadsheet) {
  const sheet = historySheet(spreadsheet);
  const map = historyMap();
  return sheet.getRange(
    sandbox.WorkOsConfig.DATA_START_ROW,
    1,
    sheet.getMaxRows() - sandbox.WorkOsConfig.DATA_START_ROW + 1,
    historyIds().length
  ).getValues().filter((row) => String(row[map.run_id] || '') !== '')
    .map((row) => Object.fromEntries(
      historyIds().map((id, index) => [id, row[index]])
    ));
}

function baseSummary(id, overrides = {}) {
  return Object.assign({
    run_id: id,
    mode: 'AUTO_PILOT',
    run_status: 'COMPLETE',
    started_at: new Date('2026-08-25T00:00:00.000Z'),
    finished_at: new Date('2026-08-25T00:01:00.000Z'),
    duration_ms: 60000,
    candidate_count: 0,
    processed_count: 0,
    backlog_processed_count: 0,
    inbox_processed_count: 0,
    created_task_count: 0,
    updated_task_count: 0,
    review_count: 0,
    calendar_job_count: 0,
    skipped_count: 0,
    error_count: 0,
    note: '',
    retention_reference_at: new Date('2026-08-25T00:01:00.000Z')
  }, overrides);
}

function append(spreadsheet, id, overrides = {}, deferredError) {
  return sandbox.WorkOsLogAndDeadLetter.appendRunSummary(
    baseSummary(id, overrides),
    spreadsheet,
    deferredError
  );
}

function setHistoryRecord(spreadsheet, record) {
  const ids = historyIds();
  const map = historyMap();
  const row = new Array(ids.length).fill('');
  Object.keys(record).forEach((key) => {
    row[map[key]] = record[key];
  });
  const sheet = historySheet(spreadsheet);
  const next = sandbox.WorkOsConfig.DATA_START_ROW +
    historyRecords(spreadsheet).length;
  sheet.getRange(next, 1, 1, ids.length).setValues([row]);
}

function snapshotSheets(spreadsheet, names) {
  return names.map((name) => {
    const sheet = spreadsheet.getSheetByName(name);
    return {
      name,
      rows: sheet.getMaxRows(),
      columns: sheet.getMaxColumns(),
      values: sheet.getRange(
        1, 1, sheet.getMaxRows(), sheet.getMaxColumns()
      ).getValues()
    };
  });
}

function assertSnapshotsEqual(before, after) {
  assert.deepStrictEqual(after, before);
}

function testModesAndManualCompatibility() {
  const spreadsheet = makeSpreadsheet();
  append(spreadsheet, 'auto-pilot-detail', { candidate_count: 1 });
  append(spreadsheet, 'auto-phase6-detail', {
    mode: 'AUTO_PHASE6', candidate_count: 1
  });
  append(spreadsheet, 'manual-detail', {
    mode: 'MANUAL_EDIT', candidate_count: 1
  });
  append(spreadsheet, 'unknown-detail', {
    mode: 'UNKNOWN_FUTURE_MODE', candidate_count: 1
  });
  append(spreadsheet, 'constructor-detail', {
    mode: 'constructor', candidate_count: 1
  });
  append(spreadsheet, 'proto-detail', {
    mode: '__proto__', candidate_count: 1
  });
  const records = historyRecords(spreadsheet);
  assert.strictEqual(records[0].trigger_type, 'TIME_DRIVEN');
  assert.strictEqual(records[0].mode, 'AUTO_PILOT');
  assert.strictEqual(records[1].trigger_type, 'TIME_DRIVEN');
  assert.strictEqual(records[1].mode, 'AUTO_PHASE6');
  assert.strictEqual(records[2].trigger_type, 'MANUAL');
  assert.strictEqual(records[2].mode, 'MANUAL_EDIT');
  assert.strictEqual(records[3].trigger_type, 'MANUAL');
  assert.strictEqual(records[3].mode, 'GMAIL_PHASE2');
  assert.strictEqual(records[4].trigger_type, 'MANUAL');
  assert.strictEqual(records[4].mode, 'GMAIL_PHASE2');
  assert.strictEqual(records[5].trigger_type, 'MANUAL');
  assert.strictEqual(records[5].mode, 'GMAIL_PHASE2');
}

function testHealthyIdleSuppressionAndHeartbeatBoundary() {
  const spreadsheet = makeSpreadsheet();
  assert.strictEqual(append(spreadsheet, 'idle-noop'), null);
  append(spreadsheet, 'idle-watermark', { watermark_advanced: true });
  append(spreadsheet, 'idle-filters', {
    gmail_filter_counts: { CATEGORY_SOCIAL: 3 }
  });
  assert.deepStrictEqual(historyRecords(spreadsheet), []);
  const trigger = fs.readFileSync(
    path.join(appsScriptRoot, '12_Triggers.gs'), 'utf8'
  );
  const workerCall = trigger.indexOf('worker.processAutomaticBatch');
  const heartbeat = trigger.indexOf('AUTOMATION_LAST_RUN_AT', workerCall);
  assert.ok(workerCall >= 0, 'scheduled worker call must remain present');
  assert.ok(heartbeat > workerCall,
    'heartbeat must remain after the scheduled worker invocation');
  assert.strictEqual(
    trigger.slice(workerCall, heartbeat).includes('appendRunSummary'),
    false,
    'heartbeat must not depend on detail-row append'
  );
}

function testMeaningfulRunsAreNeverSuppressed() {
  const cases = [
    ['candidate', { candidate_count: 1 }],
    ['processed', { processed_count: 1 }],
    ['backlog', { backlog_processed_count: 1 }],
    ['inbox', { inbox_processed_count: 1 }],
    ['task-created', { created_task_count: 1 }],
    ['task-updated', { updated_task_count: 1 }],
    ['review', { review_count: 1 }],
    ['calendar', { calendar_job_count: 1 }],
    ['skipped', { skipped_count: 1 }],
    ['error', { error_count: 1 }],
    ['paused', { run_status: 'PAUSED' }],
    ['failed', { run_status: 'FAILED' }],
    ['provider-suppressed', { provider_retry_suppressed: true }],
    ['system-deferred', { system_retry_deferred: true }],
    ['cursor-recovery', { scan_cursor_reset: true }],
    ['search-saturated', { search_saturated: true }],
    ['warning-note', { note: 'bounded-warning' }],
    ['provider-error', { provider_error_code: 'invalid_request' }],
    ['finalization', { failure_finalization: true }]
  ];
  const spreadsheet = makeSpreadsheet();
  cases.forEach(([id, overrides]) => append(spreadsheet, id, overrides));
  assert.strictEqual(historyRecords(spreadsheet).length, cases.length);
  const deferredSpreadsheet = makeSpreadsheet();
  const errorContext = sandbox.WorkOsLogAndDeadLetter.createErrorContext(
    deferredSpreadsheet
  );
  append(deferredSpreadsheet, 'deferred-error', {}, {
    error: new sandbox.WorkOsAppError(
      'E_DEFERRED', 'AI_REQUEST', false, '安全なテストエラー'
    ),
    metadata: { subsystem: 'AI_REQUEST' },
    error_context: errorContext
  });
  assert.strictEqual(historyRecords(deferredSpreadsheet).length, 1);
}

function testRetentionIsRunHistoryOnlyAndAppendable() {
  const spreadsheet = makeSpreadsheet();
  const otherNames = [
    sandbox.WorkOsConfig.SHEETS.ERRORS,
    sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE,
    sandbox.WorkOsConfig.SHEETS.TASKS,
    sandbox.WorkOsConfig.SHEETS.TASK_AUTHORITY_LEDGER,
    sandbox.WorkOsConfig.SHEETS.SYNC_STATE
  ];
  const before = snapshotSheets(spreadsheet, otherNames);
  const now = new Date('2026-08-25T00:01:00.000Z');
  const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  setHistoryRecord(spreadsheet, {
    run_id: 'too-old',
    started_at: new Date(cutoff.getTime() - 60000),
    finished_at: new Date(cutoff.getTime() - 1),
    run_status: 'COMPLETE'
  });
  setHistoryRecord(spreadsheet, {
    run_id: 'exact-cutoff',
    started_at: new Date(cutoff.getTime()),
    finished_at: new Date(cutoff.getTime()),
    run_status: 'COMPLETE'
  });
  setHistoryRecord(spreadsheet, {
    run_id: 'newer',
    started_at: new Date(cutoff.getTime() + 1),
    finished_at: new Date(cutoff.getTime() + 1),
    run_status: 'COMPLETE'
  });
  setHistoryRecord(spreadsheet, {
    run_id: 'invalid-date',
    started_at: new Date(cutoff.getTime() + 2),
    finished_at: 'not-a-date',
    run_status: 'COMPLETE'
  });
  setHistoryRecord(spreadsheet, {
    run_id: 'missing-date',
    started_at: new Date(cutoff.getTime() + 3),
    finished_at: '',
    run_status: 'COMPLETE'
  });
  const sheet = historySheet(spreadsheet);
  const headerBefore = sheet.getRange(1, 1, 2, sheet.getMaxColumns())
    .getValues();
  append(spreadsheet, 'retained-new', {
    retention_reference_at: now,
    finished_at: new Date(now.getTime() - 1000),
    candidate_count: 1
  });
  const records = historyRecords(spreadsheet);
  assert.deepStrictEqual(records.map((record) => record.run_id), [
    'exact-cutoff', 'newer', 'invalid-date', 'missing-date', 'retained-new'
  ]);
  assert.strictEqual(sheet.getMaxColumns(), historyIds().length);
  assert.deepStrictEqual(
    sheet.getRange(1, 1, 2, sheet.getMaxColumns()).getValues(),
    headerBefore,
    'retention must preserve schema and display headers'
  );
  const data = sheet.getRange(
    sandbox.WorkOsConfig.DATA_START_ROW,
    1,
    sheet.getMaxRows() - sandbox.WorkOsConfig.DATA_START_ROW + 1,
    sheet.getMaxColumns()
  ).getValues();
  const firstBlank = data.findIndex((row) =>
    String(row[historyMap().run_id] || '') === '');
  assert.ok(firstBlank >= 0, 'compaction must leave appendable capacity');
  assert.strictEqual(data.slice(firstBlank).some((row) =>
    String(row[historyMap().run_id] || '') !== ''), false);
  assertSnapshotsEqual(before, snapshotSheets(spreadsheet, otherNames));
}

function testHealthyIdleSkipsRunHistoryMaintenance() {
  const spreadsheet = makeSpreadsheet();
  const now = new Date('2026-08-25T00:01:00.000Z');
  const old = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000 - 1);
  setHistoryRecord(spreadsheet, {
    run_id: 'idle-retention-old',
    finished_at: old,
    run_status: 'COMPLETE'
  });
  append(spreadsheet, 'healthy-idle-after-retention', {
    retention_reference_at: now
  });
  assert.deepStrictEqual(historyRecords(spreadsheet).map((record) =>
    record.run_id
  ), ['idle-retention-old'],
  'healthy idle suppression must not perform Run History maintenance');
}

testModesAndManualCompatibility();
testHealthyIdleSuppressionAndHeartbeatBoundary();
testMeaningfulRunsAreNeverSuppressed();
testRetentionIsRunHistoryOnlyAndAppendable();
testHealthyIdleSkipsRunHistoryMaintenance();
console.log('work_0037_codex_03_operational_log_hardening_test: PASS');
