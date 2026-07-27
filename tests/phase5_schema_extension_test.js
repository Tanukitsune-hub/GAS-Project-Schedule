'use strict';

/**
 * Schema 2.5 -> 2.6 authority-ledger migration regression tests.
 *
 * These tests deliberately use only the in-memory Apps Script facade from the
 * baseline suite.  They do not contact Google Workspace.  The historical
 * snapshot-cell migration assertions were replaced with fail-closed coverage:
 * Schema 2.6 may seed authority exactly once from the independent Schema 2.5
 * note anchor, never from the editable snapshot cell or a live Task row.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const baselinePath = path.resolve(__dirname, 'baseline_upgrade_test.js');
let baselineSource = fs.readFileSync(baselinePath, 'utf8');
baselineSource = baselineSource.replace(
  "  '03_SheetBuilder.gs',\n  '02_Setup.gs'\n",
  "  '03_SheetBuilder.gs',\n  '02_Setup.gs',\n" +
    "  '07_AiAdapter.gs',\n  '08_TaskRepository.gs',\n" +
    "  '14_Migrations.gs'\n"
);
const reportMarker = '\nconst summary = {\n';
const reportIndex = baselineSource.lastIndexOf(reportMarker);
if (reportIndex < 0) {
  throw new Error('BASELINE_FIXTURE_REPORT_MARKER_NOT_FOUND');
}
const exposure = `
globalThis.__phase5SchemaFixture = {
  sandbox,
  FakeRange,
  FakeSheet,
  FakeSpreadsheet,
  makeCompletedPhase4Environment,
  setRecord,
  snapshotCells
};
`;
const context = {
  require,
  __dirname,
  __filename: baselinePath,
  console,
  process: { stdout: { write: () => {} }, exitCode: 0 },
  Buffer,
  structuredClone
};
vm.createContext(context);
vm.runInContext(
  baselineSource.slice(0, reportIndex) + exposure,
  context,
  { filename: 'baseline_upgrade_fixture.js' }
);

const fixture = context.__phase5SchemaFixture;
const sandbox = fixture.sandbox;
let lockHeld = false;
sandbox.LockService = {
  getScriptLock: () => {
    let heldByThisLock = false;
    return {
      tryLock: () => {
        if (lockHeld) {
          return false;
        }
        lockHeld = true;
        heldByThisLock = true;
        return true;
      },
      hasLock: () => heldByThisLock && lockHeld,
      releaseLock: () => {
        if (heldByThisLock) {
          heldByThisLock = false;
          lockHeld = false;
        }
      }
    };
  }
};

/*
 * The baseline fixture intentionally models only the APIs needed by the
 * earlier version refresh.  Schema 2.6 correctly hardens the new authority
 * ledger before converting any row, so this suite supplies no-op layout and
 * protection facades while retaining real cell/note mutations and write
 * counts.  The fake protection is intentionally stateful enough to validate
 * that the ledger is hidden before a budget pause is returned.
 */
class FakeProtection {
  constructor(sheet, type, range) {
    this.sheet = sheet;
    this.type = type;
    this.range = range || null;
    this.description = '';
    this.editors = [];
    this.unprotectedRanges = [];
  }

  setDescription(value) {
    this.description = String(value || '');
    return this;
  }

  getDescription() {
    return this.description;
  }

  setRange(range) {
    this.range = range;
    return this;
  }

  setWarningOnly() { return this; }

  addEditor(editor) {
    if (this.editors.indexOf(editor) < 0) {
      this.editors.push(editor);
    }
    return this;
  }

  getEditors() { return this.editors.slice(); }

  removeEditors(editors) {
    this.editors = this.editors.filter((editor) => editors.indexOf(editor) < 0);
    return this;
  }

  canDomainEdit() { return false; }

  setDomainEdit() { return this; }

  setUnprotectedRanges(ranges) {
    this.unprotectedRanges = ranges.slice();
    return this;
  }
}

function ensureNotes(sheet) {
  if (!sheet.notes) {
    sheet.notes = Array.from({ length: sheet.maxRows }, () =>
      Array.from({ length: sheet.maxColumns }, () => '')
    );
  }
  return sheet.notes;
}

const originalInsertRowsAfter = fixture.FakeSheet.prototype.insertRowsAfter;
fixture.FakeSheet.prototype.insertRowsAfter = function (afterRow, count) {
  const notes = ensureNotes(this);
  const result = originalInsertRowsAfter.call(this, afterRow, count);
  for (let index = 0; index < count; index += 1) {
    notes.push(Array.from({ length: this.maxColumns }, () => ''));
  }
  return result;
};

fixture.FakeSheet.prototype.insertColumnsAfter = function (afterColumn, count) {
  assert.strictEqual(afterColumn, this.maxColumns);
  const notes = ensureNotes(this);
  for (let index = 0; index < count; index += 1) {
    this.cells.forEach((row) => row.push(''));
    notes.forEach((row) => row.push(''));
  }
  this.maxColumns += count;
  this.writeCount += 1;
  return this;
};

fixture.FakeSheet.prototype.deleteColumns = function (startColumn, count) {
  assert(startColumn >= 1 && count >= 0, 'deleteColumns bounds');
  assert(startColumn + count - 1 <= this.maxColumns, 'deleteColumns range');
  const notes = ensureNotes(this);
  this.cells.forEach((row) => row.splice(startColumn - 1, count));
  notes.forEach((row) => row.splice(startColumn - 1, count));
  this.maxColumns -= count;
  this.writeCount += 1;
  return this;
};

fixture.FakeRange.prototype.getNotes = function () {
  const notes = ensureNotes(this.sheet);
  return Array.from({ length: this.rowCount }, (_unused, rowOffset) =>
    Array.from({ length: this.columnCount }, (_unusedColumn, columnOffset) =>
      notes[this.row - 1 + rowOffset][this.column - 1 + columnOffset]
    )
  );
};

fixture.FakeRange.prototype.getNote = function () {
  return this.getNotes()[0][0];
};

fixture.FakeRange.prototype.setNote = function (value) {
  const notes = ensureNotes(this.sheet);
  for (let rowOffset = 0; rowOffset < this.rowCount; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < this.columnCount; columnOffset += 1) {
      notes[this.row - 1 + rowOffset][this.column - 1 + columnOffset] =
        String(value || '');
    }
  }
  this.sheet.writeCount += 1;
  return this;
};

['setFontWeight', 'setBackground', 'setDataValidation', 'setNumberFormat'].forEach(
  (method) => {
    fixture.FakeRange.prototype[method] = function () { return this; };
  }
);

fixture.FakeRange.prototype.protect = function () {
  this.sheet._protections = this.sheet._protections || [];
  const protection = new FakeProtection(this.sheet, 'RANGE', this);
  this.sheet._protections.push(protection);
  return protection;
};

fixture.FakeSheet.prototype.getProtections = function (type) {
  const protections = this._protections || [];
  if (!type) {
    return protections.slice();
  }
  const expected = type === sandbox.SpreadsheetApp.ProtectionType.RANGE
    ? 'RANGE'
    : 'SHEET';
  return protections.filter((protection) => protection.type === expected);
};

fixture.FakeSheet.prototype.protect = function () {
  this._protections = this._protections || [];
  const protection = new FakeProtection(this, 'SHEET', null);
  this._protections.push(protection);
  return protection;
};

fixture.FakeSheet.prototype.setFrozenRows = function () { return this; };
fixture.FakeSheet.prototype.hideRows = function () { return this; };
fixture.FakeSheet.prototype.hideColumns = function () { return this; };
fixture.FakeSheet.prototype.hideSheet = function () {
  this.hidden = true;
  return this;
};
fixture.FakeSheet.prototype.showSheet = function () {
  this.hidden = false;
  return this;
};
fixture.FakeSheet.prototype.isSheetHidden = function () {
  return this.hidden === true;
};
fixture.FakeSheet.prototype.getParent = function () {
  return this.parent || null;
};

fixture.FakeSpreadsheet.prototype.insertSheet = function (name, index) {
  const sheet = new fixture.FakeSheet(name, 100, 1);
  sheet.parent = this;
  const targetIndex = Number.isInteger(index) ? index : this.sheets.length;
  this.sheets.splice(targetIndex, 0, sheet);
  return sheet;
};
fixture.FakeSpreadsheet.prototype.setActiveSheet = function (sheet) {
  this.activeSheet = sheet;
  return this;
};
fixture.FakeSpreadsheet.prototype.getActiveSheet = function () {
  return this.activeSheet || this.sheets[0] || null;
};
fixture.FakeSpreadsheet.prototype.moveActiveSheet = function (position) {
  const active = this.getActiveSheet();
  const prior = this.sheets.indexOf(active);
  if (prior < 0) {
    return this;
  }
  this.sheets.splice(prior, 1);
  this.sheets.splice(Math.max(0, position - 1), 0, active);
  return this;
};

sandbox.SpreadsheetApp.flush = () => {};
sandbox.SpreadsheetApp.newDataValidation = () => ({
  requireCheckbox() { return this; },
  requireValueInList() { return this; },
  setAllowInvalid() { return this; },
  build() { return { fake_rule: true }; }
});

function attachSpreadsheetParents(spreadsheet) {
  spreadsheet.getSheets().forEach((sheet) => {
    sheet.parent = spreadsheet;
    ensureNotes(sheet);
  });
}

function activateEnvironment(environment) {
  attachSpreadsheetParents(environment.spreadsheet);
  sandbox.SpreadsheetApp.getActiveSpreadsheet = () => environment.spreadsheet;
  sandbox.PropertiesService.getScriptProperties = () => environment.properties;
}

function resetWriteCounts(environment) {
  environment.spreadsheet.getSheets().forEach((sheet) => {
    sheet.writeCount = 0;
  });
  environment.properties.writeCount = 0;
}

function snapshotValue(column, value) {
  if (value === '' || value == null) {
    return '';
  }
  if (value instanceof sandbox.Date) {
    return value.toISOString();
  }
  if (column.enumName) {
    return sandbox.WorkOsSchemas.toInternalEnum(column.enumName, value);
  }
  if (column.type === 'JsonArray' || column.type === 'JsonObject') {
    return JSON.parse(String(value));
  }
  return value;
}

function taskSchemaDetails() {
  const taskName = sandbox.WorkOsConfig.SHEETS.TASKS;
  const ids = Array.from(sandbox.WorkOsSchemas.getInternalIds(taskName));
  return {
    taskName,
    ids,
    legacyIds: ids.slice(0, -3),
    schema: sandbox.WorkOsSchemas.getSheetSchema(taskName),
    map: sandbox.WorkOsSchemas.buildColumnMapFromIds(ids)
  };
}

function trimTaskToSchema25(taskSheet) {
  const details = taskSchemaDetails();
  const removed = details.ids.length - details.legacyIds.length;
  const notes = ensureNotes(taskSheet);
  taskSheet.cells.forEach((row) => row.splice(details.legacyIds.length, removed));
  notes.forEach((row) => row.splice(details.legacyIds.length, removed));
  taskSheet.maxColumns = details.legacyIds.length;
  return details;
}

function snapshotForLegacyTaskRow(taskSheet, rowNumber, details) {
  const row = taskSheet.cells[rowNumber - 1];
  const values = {};
  details.legacyIds.forEach((id) => {
    if (id === 'authoritative_snapshot_json') {
      return;
    }
    values[id] = snapshotValue(
      details.schema[details.map[id]],
      row[details.legacyIds.indexOf(id)]
    );
  });
  return {
    format: 'FULL_ROW_V1',
    schema_version: '2.5',
    task_id: String(row[details.legacyIds.indexOf('task_id')] || ''),
    values
  };
}

function setLegacyAuthorityNote(taskSheet, rowNumber, details, noteMode) {
  const snapshotColumn = details.legacyIds.indexOf('authoritative_snapshot_json') + 1;
  let note;
  if (noteMode === 'MISSING') {
    note = '';
  } else if (noteMode === 'MALFORMED') {
    note = 'WORK_OS_TASK_AUTHORITY_V2:{malformed';
  } else {
    note = 'WORK_OS_TASK_AUTHORITY_V2:' + JSON.stringify(
      snapshotForLegacyTaskRow(taskSheet, rowNumber, details)
    );
  }
  taskSheet.getRange(rowNumber, snapshotColumn, 1, 1).setNote(note);
}

function schema25Environment(options = {}) {
  const environment = fixture.makeCompletedPhase4Environment();
  activateEnvironment(environment);
  const details = taskSchemaDetails();
  const taskSheet = environment.spreadsheet.getSheetByName(details.taskName);
  const ledgerName = sandbox.WorkOsConfig.SHEETS.TASK_AUTHORITY_LEDGER;
  const ledgerIndex = environment.spreadsheet.sheets.findIndex(
    (sheet) => sheet.getName() === ledgerName
  );
  if (ledgerIndex >= 0) {
    environment.spreadsheet.sheets.splice(ledgerIndex, 1);
  }
  trimTaskToSchema25(taskSheet);
  const count = Math.max(1, Number(options.taskCount || 1));
  const requiredMaxRow = sandbox.WorkOsConfig.DATA_START_ROW + count - 1;
  if (taskSheet.getMaxRows() < requiredMaxRow) {
    taskSheet.insertRowsAfter(
      taskSheet.getMaxRows(),
      requiredMaxRow - taskSheet.getMaxRows()
    );
  }
  const sourceMap = sandbox.WorkOsSchemas.buildColumnMapFromIds(details.legacyIds);
  const base = taskSheet.cells[sandbox.WorkOsConfig.DATA_START_ROW - 1].slice();
  for (let index = 0; index < count; index += 1) {
    const rowNumber = sandbox.WorkOsConfig.DATA_START_ROW + index;
    const row = base.slice();
    const suffix = (index + 1).toString(16).padStart(32, '0');
    row[sourceMap.task_id] = `tsk_${suffix}`;
    row[sourceMap.origin_key] = `org_${suffix}`;
    row[sourceMap.task_title] = `Schema 2.5 migration task ${index + 1}`;
    // These Schema 2.5 control fields predate the three Schema 2.6 authority
    // columns.  The Phase-4 baseline intentionally leaves them blank, but a
    // real 2.5 row must already satisfy the Task write contract before it can
    // become a ledger-backed 2.6 record.
    row[sourceMap.business_version] = 1;
    row[sourceMap.calendar_reconcile_required] = false;
    row[sourceMap.calendar_intent_version] = 0;
    taskSheet.cells[rowNumber - 1] = row;
    setLegacyAuthorityNote(
      taskSheet,
      rowNumber,
      details,
      options.noteMode || 'VALID'
    );
  }
  if (typeof options.mutateTask === 'function') {
    options.mutateTask(taskSheet, details);
  }
  resetWriteCounts(environment);
  return { environment, taskSheet, details };
}

function pre25Environment() {
  const environment = fixture.makeCompletedPhase4Environment();
  activateEnvironment(environment);
  const details = taskSchemaDetails();
  const taskSheet = environment.spreadsheet.getSheetByName(details.taskName);
  const legacy23Width = details.ids.length - 4;
  const notes = ensureNotes(taskSheet);
  taskSheet.cells.forEach((row) => row.splice(legacy23Width, 4));
  notes.forEach((row) => row.splice(legacy23Width, 4));
  taskSheet.maxColumns = legacy23Width;
  resetWriteCounts(environment);
  return { environment, taskSheet, details };
}

function current26Environment() {
  const state = schema25Environment();
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(result.status, 'UPDATED');
  resetWriteCounts(state.environment);
  return state;
}

function taskCell(sheet, rowNumber, id) {
  return sheet.cells[rowNumber - 1][sheet.cells[0].indexOf(id)];
}

function ledgerRecord(state, taskId) {
  const ledger = state.environment.spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.TASK_AUTHORITY_LEDGER
  );
  assert(ledger, 'Task Authority Ledger must exist');
  const taskIdIndex = ledger.cells[0].indexOf('task_id');
  const row = ledger.cells.slice(2).find((candidate) =>
    String(candidate[taskIdIndex] || '') === String(taskId)
  );
  assert(row, `ledger record missing for ${taskId}`);
  return Object.fromEntries(ledger.cells[0].map((id, index) => [id, row[index]]));
}

function workbookSnapshot(spreadsheet) {
  return spreadsheet.getSheets().map((sheet) => ({
    name: sheet.getName(),
    cells: structuredClone(sheet.cells),
    notes: structuredClone(ensureNotes(sheet)),
    hidden: sheet.isSheetHidden()
  }));
}

function totalWrites(spreadsheet) {
  return spreadsheet.getSheets().reduce(
    (sum, sheet) => sum + sheet.writeCount,
    0
  );
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
    lockHeld = false;
  }
}

test('P5-S01_SCHEMA_2_5_TO_2_6_IS_APPEND_ONLY_AND_SEEDS_LEDGER_FROM_NOTE', () => {
  const state = schema25Environment();
  const rowNumber = sandbox.WorkOsConfig.DATA_START_ROW;
  const taskId = taskCell(state.taskSheet, rowNumber, 'task_id');
  const titleBefore = taskCell(state.taskSheet, rowNumber, 'task_title');
  const commentBefore = taskCell(state.taskSheet, rowNumber, 'comment');
  const settingsBefore = structuredClone(
    state.environment.spreadsheet.getSheetByName(
      sandbox.WorkOsConfig.SHEETS.SETTINGS
    ).cells
  );

  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(result.status, 'UPDATED');
  assert.strictEqual(result.appended_columns, 3);
  assert.strictEqual(result.updated_task_rows, 1);
  assert.strictEqual(result.quarantined_task_rows, 0);
  assert.strictEqual(
    JSON.stringify(state.taskSheet.cells[0]),
    JSON.stringify(state.details.ids)
  );
  assert.strictEqual(
    JSON.stringify(state.taskSheet.cells[1]),
    JSON.stringify(sandbox.WorkOsSchemas.getHeaders(state.details.taskName))
  );
  assert.strictEqual(taskCell(state.taskSheet, rowNumber, 'task_title'), titleBefore);
  assert.strictEqual(taskCell(state.taskSheet, rowNumber, 'comment'), commentBefore);
  assert.strictEqual(taskCell(state.taskSheet, rowNumber, 'authority_generation'), 1);
  assert.strictEqual(taskCell(state.taskSheet, rowNumber, 'authority_state'), 'COMMITTED');
  assert.notStrictEqual(taskCell(state.taskSheet, rowNumber, 'authoritative_snapshot_json'), '');

  const record = ledgerRecord(state, taskId);
  assert.strictEqual(record.control_state, 'ACTIVE');
  assert.strictEqual(record.active_slot, 'A');
  assert.strictEqual(record.committed_generation, 1);
  assert.strictEqual(record.transaction_state, 'IDLE');
  assert.strictEqual(record.physical_row_hint, rowNumber);
  const ledger = state.environment.spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.TASK_AUTHORITY_LEDGER
  );
  assert.strictEqual(ledger.isSheetHidden(), true);
  assert.strictEqual(
    JSON.stringify(state.environment.spreadsheet.getSheetByName(
      sandbox.WorkOsConfig.SHEETS.SETTINGS
    ).cells),
    JSON.stringify(settingsBefore)
  );
});

test('P5-S02_SECOND_SCHEMA_2_6_RUN_IS_STATE_NO_OP_AFTER_HEADER_REASSERTION', () => {
  const state = current26Environment();
  const before = workbookSnapshot(state.environment.spreadsheet);
  const writes = totalWrites(state.environment.spreadsheet);
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(result.status, 'CURRENT');
  assert.strictEqual(result.changed, false);
  assert.strictEqual(
    JSON.stringify(workbookSnapshot(state.environment.spreadsheet)),
    JSON.stringify(before)
  );
  // The migration intentionally reasserts the two canonical Task header rows
  // on every invocation.  Those two idempotent writes are control-plane only;
  // the workbook state and every authority record remain unchanged.
  assert.strictEqual(totalWrites(state.environment.spreadsheet), writes + 2);
});

test('P5-S02B_CURRENT_TASK_HEADER_ROWS_ARE_RESTORED_CANONICALLY_WITHOUT_REBASELINE', () => {
  const state = current26Environment();
  const rowNumber = sandbox.WorkOsConfig.DATA_START_ROW;
  const titleBefore = taskCell(state.taskSheet, rowNumber, 'task_title');
  state.taskSheet.cells[0][0] = 'owner_changed_internal_id';
  state.taskSheet.cells[1][0] = 'owner changed header';
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(result.status, 'CURRENT');
  assert.strictEqual(
    JSON.stringify(state.taskSheet.cells[0]),
    JSON.stringify(state.details.ids)
  );
  assert.strictEqual(
    JSON.stringify(state.taskSheet.cells[1]),
    JSON.stringify(sandbox.WorkOsSchemas.getHeaders(state.details.taskName))
  );
  assert.strictEqual(taskCell(state.taskSheet, rowNumber, 'task_title'), titleBefore);
  assert.strictEqual(taskCell(state.taskSheet, rowNumber, 'authority_generation'), 1);
});

test('P5-S03_CORRUPT_LEGACY_NOTE_QUARANTINES_WITHOUT_SNAPSHOT_CELL_FALLBACK', () => {
  const state = schema25Environment({ noteMode: 'MALFORMED' });
  const rowNumber = sandbox.WorkOsConfig.DATA_START_ROW;
  const taskId = taskCell(state.taskSheet, rowNumber, 'task_id');
  const titleBefore = taskCell(state.taskSheet, rowNumber, 'task_title');
  const snapshotIndex = state.details.legacyIds.indexOf('authoritative_snapshot_json');
  state.taskSheet.cells[rowNumber - 1][snapshotIndex] = JSON.stringify({
    task_id: taskId,
    values: { task_title: 'must never become authority' }
  });
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(result.status, 'UPDATED');
  assert.strictEqual(result.updated_task_rows, 0);
  assert.strictEqual(result.quarantined_task_rows, 1);
  assert.strictEqual(taskCell(state.taskSheet, rowNumber, 'task_title'), titleBefore);
  assert.strictEqual(taskCell(state.taskSheet, rowNumber, 'authority_state'), 'QUARANTINED');
  const record = ledgerRecord(state, taskId);
  assert.strictEqual(record.control_state, 'QUARANTINED');
  assert.strictEqual(record.quarantine_reason_code, 'E_TASK_AUTHORITY_LEGACY_NOTE_INVALID');
});

test('P5-S04_UNKNOWN_PHYSICAL_TASK_SCHEMA_IS_NOT_MODIFIED', () => {
  const state = schema25Environment();
  state.taskSheet.cells.forEach((row) => row.pop());
  ensureNotes(state.taskSheet).forEach((row) => row.pop());
  state.taskSheet.maxColumns -= 1;
  const before = workbookSnapshot(state.environment.spreadsheet);
  const writes = totalWrites(state.environment.spreadsheet);
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(result.status, 'NOT_APPLICABLE');
  assert.strictEqual(result.changed, false);
  assert.strictEqual(
    JSON.stringify(workbookSnapshot(state.environment.spreadsheet)),
    JSON.stringify(before)
  );
  assert.strictEqual(totalWrites(state.environment.spreadsheet), writes);
});

test('P5-S05_BUDGET_PAUSE_HARDENS_CONTROL_PLANE_BEFORE_ANY_TASK_CONVERSION', () => {
  const state = schema25Environment();
  const rowNumber = sandbox.WorkOsConfig.DATA_START_ROW;
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet,
    { isExhausted: () => true }
  );
  assert.strictEqual(result.status, 'PAUSED');
  assert.strictEqual(result.appended_columns, 3);
  assert.strictEqual(result.updated_task_rows, 0);
  assert.strictEqual(result.quarantined_task_rows, 0);
  assert.strictEqual(state.taskSheet.getMaxColumns(), state.details.ids.length);
  assert.strictEqual(taskCell(state.taskSheet, rowNumber, 'authority_generation'), '');
  const ledger = state.environment.spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.TASK_AUTHORITY_LEDGER
  );
  assert(ledger, 'ledger must exist before pause is returned');
  assert.strictEqual(ledger.isSheetHidden(), true);
  const persisted = JSON.parse(state.environment.properties.getProperty(
    sandbox.WorkOsConfig.PROPERTIES.AUTHORITY_MIGRATION_STATE
  ));
  assert.strictEqual(persisted.state, 'PREPARED');
  assert.strictEqual(persisted.next_row, rowNumber);

  const resumed = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(resumed.status, 'UPDATED');
  assert.strictEqual(resumed.updated_task_rows, 1);
});

test('P5-S06_CORRUPT_AUTHORITY_MIGRATION_CHECKPOINT_STOPS_BEFORE_ANY_MUTATION', () => {
  const state = schema25Environment();
  state.environment.properties.setProperty(
    sandbox.WorkOsConfig.PROPERTIES.AUTHORITY_MIGRATION_STATE,
    '{not-json'
  );
  const before = workbookSnapshot(state.environment.spreadsheet);
  const writes = totalWrites(state.environment.spreadsheet);
  assert.throws(
    () => sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
      state.environment.spreadsheet
    ),
    (error) => error.code === 'E_TASK_AUTHORITY_MIGRATION_STATE'
  );
  assert.strictEqual(
    JSON.stringify(workbookSnapshot(state.environment.spreadsheet)),
    JSON.stringify(before)
  );
  assert.strictEqual(totalWrites(state.environment.spreadsheet), writes);
});

test('P5-S07_MULTI_CHUNK_TASK_MIGRATION_PAUSES_RESUMES_AND_BECOMES_IDEMPOTENT', () => {
  const taskCount = sandbox.WorkOsConfig.AUTHORITY_LEDGER_CHUNK_ROWS + 1;
  const state = schema25Environment({ taskCount });
  let budgetChecks = 0;
  const paused = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet,
    {
      isExhausted: () => {
        budgetChecks += 1;
        return budgetChecks > 1;
      }
    }
  );
  assert.strictEqual(paused.status, 'PAUSED');
  assert.strictEqual(paused.updated_task_rows, sandbox.WorkOsConfig.AUTHORITY_LEDGER_CHUNK_ROWS);
  assert.strictEqual(paused.quarantined_task_rows, 0);
  assert.strictEqual(
    JSON.parse(state.environment.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.AUTHORITY_MIGRATION_STATE
    )).next_row,
    sandbox.WorkOsConfig.DATA_START_ROW + sandbox.WorkOsConfig.AUTHORITY_LEDGER_CHUNK_ROWS
  );

  const resumed = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(resumed.status, 'UPDATED');
  assert.strictEqual(resumed.updated_task_rows, 1);
  assert.strictEqual(resumed.quarantined_task_rows, 0);
  assert.strictEqual(
    state.environment.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.AUTHORITY_MIGRATION_STATE
    ),
    null
  );
  const current = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(current.status, 'CURRENT');
  for (let index = 0; index < taskCount; index += 1) {
    const rowNumber = sandbox.WorkOsConfig.DATA_START_ROW + index;
    assert.strictEqual(taskCell(state.taskSheet, rowNumber, 'authority_generation'), 1);
    assert.strictEqual(taskCell(state.taskSheet, rowNumber, 'authority_state'), 'COMMITTED');
  }
});

test('R3-02F_PRE_2_5_TASK_SCHEMA_IS_FAIL_CLOSED_WITHOUT_ANY_LEGACY_SNAPSHOT_UPGRADE', () => {
  const state = pre25Environment();
  const before = workbookSnapshot(state.environment.spreadsheet);
  assert.throws(
    () => sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
      state.environment.spreadsheet
    ),
    (error) => error.code === 'E_TASK_AUTHORITY_LEGACY_SCHEMA_UNSUPPORTED'
  );
  assert.strictEqual(
    JSON.stringify(workbookSnapshot(state.environment.spreadsheet)),
    JSON.stringify(before)
  );
});

test('R3-02G_SCHEMA_2_5_LIVE_BUSINESS_DRIFT_IS_QUARANTINED_NOT_REBASELINED', () => {
  const state = schema25Environment({
    mutateTask: (sheet, details) => {
      sheet.cells[sandbox.WorkOsConfig.DATA_START_ROW - 1][details.legacyIds.indexOf('task_title')] =
        'live drift must not become authority';
    }
  });
  const rowNumber = sandbox.WorkOsConfig.DATA_START_ROW;
  const taskId = taskCell(state.taskSheet, rowNumber, 'task_id');
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(result.status, 'UPDATED');
  assert.strictEqual(result.updated_task_rows, 0);
  assert.strictEqual(result.quarantined_task_rows, 1);
  assert.strictEqual(taskCell(state.taskSheet, rowNumber, 'task_title'), 'live drift must not become authority');
  const record = ledgerRecord(state, taskId);
  assert.strictEqual(record.control_state, 'QUARANTINED');
  assert.strictEqual(record.quarantine_reason_code, 'E_TASK_AUTHORITY_LEGACY_LIVE_DRIFT');
});

test('R3-02I_SCHEMA_2_5_MANAGEMENT_DRIFT_IS_VALIDATED_BY_THE_SAME_ANCHOR', () => {
  const state = schema25Environment({
    mutateTask: (sheet, details) => {
      sheet.cells[sandbox.WorkOsConfig.DATA_START_ROW - 1][details.legacyIds.indexOf('origin_key')] =
        `org_${'f'.repeat(32)}`;
    }
  });
  const rowNumber = sandbox.WorkOsConfig.DATA_START_ROW;
  const taskId = taskCell(state.taskSheet, rowNumber, 'task_id');
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(result.status, 'UPDATED');
  assert.strictEqual(result.quarantined_task_rows, 1);
  assert.strictEqual(taskCell(state.taskSheet, rowNumber, 'authority_state'), 'QUARANTINED');
  const record = ledgerRecord(state, taskId);
  assert.strictEqual(record.quarantine_reason_code, 'E_TASK_AUTHORITY_LEGACY_LIVE_DRIFT');
});

test('R3-02H_PAUSED_SCHEMA_2_5_RUN_RESUMES_FROM_PERSISTED_ROW_WITHOUT_DUPLICATE_AUTHORITY', () => {
  const state = schema25Environment({ taskCount: 2 });
  let checks = 0;
  const paused = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet,
    { isExhausted: () => ++checks > 1 }
  );
  /* The full physical grid is scanned in 50-row chunks, including blank rows. */
  assert.strictEqual(paused.status, 'PAUSED');
  assert.strictEqual(paused.updated_task_rows, 2);
  assert.strictEqual(paused.remaining_from_row, 53);
  const resumed = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(resumed.status, 'CURRENT');
  for (let index = 0; index < 2; index += 1) {
    const taskId = taskCell(
      state.taskSheet,
      sandbox.WorkOsConfig.DATA_START_ROW + index,
      'task_id'
    );
    assert.strictEqual(ledgerRecord(state, taskId).committed_generation, 1);
  }
});

test('R3-02A_CURRENT_LIVE_DRIFT_IS_RESTORED_FROM_COMMITTED_LEDGER_NOT_REBASELINED', () => {
  const state = current26Environment();
  const rowNumber = sandbox.WorkOsConfig.DATA_START_ROW;
  const taskId = taskCell(state.taskSheet, rowNumber, 'task_id');
  const titleBefore = taskCell(state.taskSheet, rowNumber, 'task_title');
  const generationBefore = ledgerRecord(state, taskId).committed_generation;
  state.taskSheet.cells[rowNumber - 1][state.taskSheet.cells[0].indexOf('task_title')] =
    'untrusted current-row drift';
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(result.status, 'UPDATED');
  assert.strictEqual(result.updated_task_rows, 1);
  assert.strictEqual(taskCell(state.taskSheet, rowNumber, 'task_title'), titleBefore);
  assert.strictEqual(ledgerRecord(state, taskId).committed_generation, generationBefore);
});

test('R3-02B_MISSING_LEDGER_RECORD_QUARANTINES_EVEN_WHEN_EDITABLE_SNAPSHOT_EXISTS', () => {
  const state = current26Environment();
  const rowNumber = sandbox.WorkOsConfig.DATA_START_ROW;
  const taskId = taskCell(state.taskSheet, rowNumber, 'task_id');
  const ledger = state.environment.spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.TASK_AUTHORITY_LEDGER
  );
  ledger.cells[sandbox.WorkOsConfig.DATA_START_ROW - 1].fill('');
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(result.status, 'UPDATED');
  assert.strictEqual(result.quarantined_task_rows, 1);
  assert.strictEqual(taskCell(state.taskSheet, rowNumber, 'authority_state'), 'QUARANTINED');
  const record = ledgerRecord(state, taskId);
  assert.strictEqual(record.control_state, 'QUARANTINED');
  assert.strictEqual(record.quarantine_reason_code, 'E_TASK_AUTHORITY_MISSING');
});

function assertEditableSnapshotProjectionIsRestored(mutator) {
  const state = current26Environment();
  const rowNumber = sandbox.WorkOsConfig.DATA_START_ROW;
  const snapshotIndex = state.taskSheet.cells[0].indexOf('authoritative_snapshot_json');
  const original = taskCell(state.taskSheet, rowNumber, 'authoritative_snapshot_json');
  mutator(state.taskSheet, rowNumber, snapshotIndex);
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(result.status, 'UPDATED');
  assert.strictEqual(result.updated_task_rows, 1);
  assert.strictEqual(taskCell(state.taskSheet, rowNumber, 'authoritative_snapshot_json'), original);
  assert.strictEqual(taskCell(state.taskSheet, rowNumber, 'authority_state'), 'COMMITTED');
}

test('R3-02C_MALFORMED_EDITABLE_SNAPSHOT_IS_REPAIRED_FROM_LEDGER', () => {
  assertEditableSnapshotProjectionIsRestored((sheet, rowNumber, index) => {
    sheet.cells[rowNumber - 1][index] = '{malformed';
  });
});

test('R3-02D_EDITABLE_SNAPSHOT_TASK_ID_MISMATCH_IS_REPAIRED_FROM_LEDGER', () => {
  assertEditableSnapshotProjectionIsRestored((sheet, rowNumber, index) => {
    const value = JSON.parse(sheet.cells[rowNumber - 1][index]);
    value.task_id = `tsk_${'f'.repeat(32)}`;
    sheet.cells[rowNumber - 1][index] = JSON.stringify(value);
  });
});

test('R3-02E_EDITABLE_SNAPSHOT_SCHEMA_MISMATCH_IS_REPAIRED_FROM_LEDGER', () => {
  assertEditableSnapshotProjectionIsRestored((sheet, rowNumber, index) => {
    const value = JSON.parse(sheet.cells[rowNumber - 1][index]);
    value.schema_version = '0.0';
    sheet.cells[rowNumber - 1][index] = JSON.stringify(value);
  });
});

const summary = {
  phase: 5,
  suite: 'schema_2_5_to_2_6_authority_migration',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_google_workspace: 'NOT_EXECUTED',
  passed: tests.filter((item) => item.status === 'PASS').length,
  failed: tests.filter((item) => item.status === 'FAIL').length,
  tests
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed > 0) {
  process.exitCode = 1;
}
