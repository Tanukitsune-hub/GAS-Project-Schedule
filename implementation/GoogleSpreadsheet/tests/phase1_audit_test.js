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
      row < 1 ||
      column < 1 ||
      row + rowCount - 1 > sheet.maxRows ||
      column + columnCount - 1 > sheet.maxColumns
    ) {
      throw new Error('RANGE_OUT_OF_BOUNDS');
    }
  }

  matrixFrom(source) {
    return Array.from({ length: this.rowCount }, (_, rowOffset) =>
      Array.from(
        { length: this.columnCount },
        (_, columnOffset) =>
          source[this.row - 1 + rowOffset][this.column - 1 + columnOffset]
      )
    );
  }

  getValues() {
    return this.matrixFrom(this.sheet.cells);
  }

  getDisplayValues() {
    return this.getValues().map((row) =>
      row.map((value) => (value == null ? '' : String(value)))
    );
  }

  getFormulas() {
    return this.matrixFrom(this.sheet.formulas);
  }

  getNotes() {
    return this.matrixFrom(this.sheet.notes);
  }

  getDataValidations() {
    return this.matrixFrom(this.sheet.validations);
  }

  getDataValidation() {
    assert.strictEqual(this.rowCount, 1);
    assert.strictEqual(this.columnCount, 1);
    return this.sheet.validations[this.row - 1][this.column - 1];
  }

  setDataValidation(validation) {
    for (let rowOffset = 0; rowOffset < this.rowCount; rowOffset += 1) {
      for (
        let columnOffset = 0;
        columnOffset < this.columnCount;
        columnOffset += 1
      ) {
        this.sheet.validations[this.row - 1 + rowOffset][
          this.column - 1 + columnOffset
        ] = validation;
      }
    }
    return this;
  }

  getNumberFormats() {
    return this.matrixFrom(this.sheet.formats);
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

  canEdit() {
    return this.sheet.canEdit;
  }

  setFontWeight() {
    return this;
  }

  setBackground() {
    return this;
  }

  protect() {
    const protection = new FakeProtection('', this);
    this.sheet.rangeProtections.push(protection);
    return protection;
  }
}

class FakeSheet {
  constructor(name, rows, columns) {
    this.name = name;
    this.maxRows = rows;
    this.maxColumns = columns;
    this.canEdit = true;
    this.hidden = false;
    this.writeLog = [];
    this.insertedRows = 0;
    this.cells = this.makeMatrix('');
    this.formulas = this.makeMatrix('');
    this.notes = this.makeMatrix('');
    this.validations = this.makeMatrix(null);
    this.formats = this.makeMatrix('');
    this.rangeProtections = [];
    this.sheetProtections = [];
  }

  makeMatrix(initialValue) {
    return Array.from({ length: this.maxRows }, () =>
      Array.from({ length: this.maxColumns }, () => initialValue)
    );
  }

  getName() {
    return this.name;
  }

  getRange(row, column, rowCount, columnCount) {
    return new FakeRange(this, row, column, rowCount, columnCount);
  }

  getDataRange() {
    return new FakeRange(this, 1, 1, this.maxRows, this.maxColumns);
  }

  getMaxRows() {
    return this.maxRows;
  }

  getMaxColumns() {
    return this.maxColumns;
  }

  insertRowsAfter(after, count) {
    assert.strictEqual(after, this.maxRows);
    const append = (matrix, initialValue) => {
      for (let index = 0; index < count; index += 1) {
        matrix.push(
          Array.from({ length: this.maxColumns }, () => initialValue)
        );
      }
    };
    append(this.cells, '');
    append(this.formulas, '');
    append(this.notes, '');
    append(this.validations, null);
    append(this.formats, '');
    this.maxRows += count;
    this.insertedRows += count;
  }

  getProtections(type) {
    return type === 'RANGE'
      ? this.rangeProtections
      : this.sheetProtections;
  }

  protect() {
    const protection = new FakeProtection('');
    this.sheetProtections.push(protection);
    return protection;
  }

  setFrozenRows() {
    return this;
  }

  hideRows() {
    return this;
  }

  hideColumns() {
    return this;
  }

  isSheetHidden() {
    return this.hidden;
  }

  isColumnHiddenByUser() {
    return false;
  }
}

class FakeSpreadsheet {
  constructor(sheets) {
    this.sheets = sheets;
  }

  getSheets() {
    return this.sheets;
  }

  getSheetByName(name) {
    return this.sheets.find((sheet) => sheet.getName() === name) || null;
  }
}

class FakeProtection {
  constructor(description, range = null, unprotectedRanges = []) {
    this.description = description;
    this.range = range;
    this.unprotectedRanges = unprotectedRanges;
    this.warningOnly = false;
    this.domainEdit = false;
    this.editorEmails = ['synthetic.user@example.invalid'];
  }

  getDescription() {
    return this.description;
  }

  setDescription(description) {
    this.description = String(description);
    return this;
  }

  setWarningOnly(value) {
    this.warningOnly = Boolean(value);
    return this;
  }

  isWarningOnly() {
    return this.warningOnly;
  }

  canDomainEdit() {
    return this.domainEdit;
  }

  getEditors() {
    return this.editorEmails.map((email) => ({
      getEmail: () => email
    }));
  }

  addEditor(user) {
    const email = user.getEmail();
    if (!this.editorEmails.includes(email)) {
      this.editorEmails.push(email);
    }
    return this;
  }

  removeEditors(editors) {
    const removed = editors.map((editor) => editor.getEmail());
    this.editorEmails = this.editorEmails.filter(
      (email) => !removed.includes(email)
    );
    return this;
  }

  setDomainEdit(value) {
    this.domainEdit = Boolean(value);
    return this;
  }

  getRange() {
    return this.range;
  }

  getUnprotectedRanges() {
    return this.unprotectedRanges;
  }

  setUnprotectedRanges(ranges) {
    this.unprotectedRanges = ranges.slice();
    return this;
  }
}

const propertyValues = new Map();
let lockAvailable = true;
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
    Charset: { UTF_8: 'UTF_8' }
  },
  SpreadsheetApp: {
    getActiveSpreadsheet: () => null,
    flush: () => {},
    ProtectionType: { RANGE: 'RANGE', SHEET: 'SHEET' },
    DataValidationCriteria: {
      CHECKBOX: 'CHECKBOX',
      VALUE_IN_LIST: 'VALUE_IN_LIST'
    }
  },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: (key) =>
        propertyValues.has(key) ? propertyValues.get(key) : null,
      setProperty: (key, value) => {
        propertyValues.set(key, String(value));
      },
      setProperties: (values) => {
        Object.keys(values).forEach((key) =>
          propertyValues.set(key, String(values[key]))
        );
      }
    })
  },
  LockService: {
    getScriptLock: () => ({
      tryLock: () => lockAvailable,
      releaseLock: () => {}
    })
  },
  Session: {
    getEffectiveUser: () => ({
      getEmail: () => 'synthetic.user@example.invalid'
    })
  }
};
vm.createContext(sandbox);

[
  '00_Config.gs',
  '01_TypesAndSchemas.gs',
  '17_Utilities.gs',
  '03_SheetBuilder.gs',
  '08_TaskRepository.gs',
  '02_Setup.gs',
  '16_Diagnostics.gs',
  '14_Migrations.gs',
  '99_TestHarness.gs',
  'Menu.gs'
].forEach((fileName) => {
  const source = fs.readFileSync(path.join(appsScriptRoot, fileName), 'utf8');
  vm.runInContext(source, sandbox, { filename: fileName });
});

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
  }
}

function taskSheet() {
  const schema = sandbox.WorkOsSchemas.getSheetSchema(
    sandbox.WorkOsConfig.SHEETS.TASKS
  );
  const sheet = new FakeSheet(
    sandbox.WorkOsConfig.SHEETS.TASKS,
    100,
    schema.length
  );
  sheet
    .getRange(1, 1, 1, schema.length)
    .setValues([schema.map((column) => column.id)]);
  return sheet;
}

const expectedTaskIds = [
  'needs_review', 'decision', 'status', 'completed', 'excluded',
  'task_title', 'due_date', 'suggested_due_date', 'deadline_basis',
  'priority', 'waiting_for_reply', 'calendar_sync_mode', 'comment', 'sender',
  'subject', 'received_at', 'source_email', 'review_state', 'review_type',
  'task_id', 'origin_key', 'source_message_id', 'source_thread_id',
  'stable_thread_key', 'source_action_index', 'ai_action_type', 'ai_reason',
  'ai_confidence', 'ai_provider', 'ai_model', 'ai_prompt_version',
  'calendar_category', 'calendar_importance', 'calendar_event_id',
  'calendar_sync_status', 'schedule_state', 'manual_fields', 'row_version',
  'pending_action_type', 'pending_changes_json', 'created_at', 'updated_at',
  'last_calendar_sync_at'
];

const expectedTaskHeaders = [
  '隕∫｢ｺ隱・, '蛻､譁ｭ', '蟇ｾ蠢懃憾豕・, '螳御ｺ・, '蟇ｾ雎｡螟・, '繧ｿ繧ｹ繧ｯ蜀・ｮｹ', '譛滄剞',
  '謗ｨ螂ｨ譛滄剞', '譛滄剞譬ｹ諡', '蜆ｪ蜈亥ｺｦ', '霑比ｿ｡蠕・■', 'Calendar逋ｻ骭ｲ', '繧ｳ繝｡繝ｳ繝・,
  '騾∽ｿ｡閠・, '莉ｶ蜷・, '蜿嶺ｿ｡譌･譎・, '蜈・Γ繝ｼ繝ｫ', '遒ｺ隱咲憾諷・, '遒ｺ隱咲ｨｮ蛻･',
  'task_id', 'origin_key', 'source_message_id', 'source_thread_id',
  'stable_thread_key', 'source_action_index', 'ai_action_type', 'ai_reason',
  'ai_confidence', 'ai_provider', 'ai_model', 'ai_prompt_version',
  'calendar_category', 'calendar_importance', 'calendar_event_id',
  'calendar_sync_status', 'schedule_state', 'manual_fields', 'row_version',
  'pending_action_type', 'pending_changes_json', 'created_at', 'updated_at',
  'last_calendar_sync_at'
];

test('P1-AUD-01_LITERAL_SCHEMA_CONTRACT', () => {
  assert.deepStrictEqual(
    Array.from(
      sandbox.WorkOsSchemas.getInternalIds(
        sandbox.WorkOsConfig.SHEETS.TASKS
      )
    ),
    expectedTaskIds
  );
  assert.deepStrictEqual(
    Array.from(
      sandbox.WorkOsSchemas.getHeaders(sandbox.WorkOsConfig.SHEETS.TASKS)
    ),
    expectedTaskHeaders
  );
});

test('P1-AUD-02_FORMULA_EMPTY_IS_NOT_EMPTY', () => {
  const sheet = new FakeSheet('繧ｷ繝ｼ繝・', 100, 26);
  sheet.formulas[0][0] = '=""';
  const snapshot = sandbox.WorkOsSetup.snapshotEnvironment(
    new FakeSpreadsheet([sheet])
  );
  assert.strictEqual(snapshot[0].isEmpty, false);
  assert.strictEqual(
    sandbox.WorkOsSetup.classifyEnvironmentDescriptors(snapshot).allowed,
    false
  );
});

test('P1-AUD-03_NOTE_VALIDATION_PROTECTION_NOT_EMPTY', () => {
  ['note', 'validation', 'protection'].forEach((kind) => {
    const sheet = new FakeSheet('繧ｷ繝ｼ繝・', 100, 26);
    if (kind === 'note') sheet.notes[0][0] = 'synthetic note';
    if (kind === 'validation') sheet.validations[0][0] = {};
    if (kind === 'protection') sheet.getProtections = () => [{}];
    const snapshot = sandbox.WorkOsSetup.snapshotEnvironment(
      new FakeSpreadsheet([sheet])
    );
    assert.strictEqual(snapshot[0].isEmpty, false, kind);
  });
});

test('P1-AUD-03B_VISIBLE_CONTENT_SHORT_CIRCUITS_SETUP_READS', () => {
  const sheet = new FakeSheet('繧ｷ繝ｼ繝・', 100, 26);
  sheet.cells[0][0] = 'occupied';
  const baseRange = sheet.getDataRange();
  const reads = { values: 0, formulas: 0, notes: 0, validations: 0 };
  sheet.getDataRange = () => ({
    getValues: () => {
      reads.values += 1;
      return baseRange.getValues();
    },
    getFormulas: () => {
      reads.formulas += 1;
      return baseRange.getFormulas();
    },
    getNotes: () => {
      reads.notes += 1;
      return baseRange.getNotes();
    },
    getDataValidations: () => {
      reads.validations += 1;
      return baseRange.getDataValidations();
    }
  });
  const snapshot = sandbox.WorkOsSetup.snapshotEnvironment(
    new FakeSpreadsheet([sheet])
  );
  assert.strictEqual(snapshot[0].isEmpty, false);
  assert.deepStrictEqual(reads, {
    values: 1,
    formulas: 0,
    notes: 0,
    validations: 0
  });
});

test('P1-AUD-04_EXTRA_SCHEMA_COLUMN_STOPS', () => {
  const result = sandbox.WorkOsSetup.classifyEnvironmentDescriptors([
    {
      name: sandbox.WorkOsConfig.SHEETS.TASKS,
      isEmpty: false,
      firstRow: expectedTaskIds.concat(['unknown_column']),
      secondRow: expectedTaskHeaders.concat(['譛ｪ遏･']),
      maxColumns: 44
    }
  ]);
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.code, 'E_SCHEMA_CONFLICT');
});

test('P1-AUD-05_INVALID_CALENDAR_DATES_REJECTED', () => {
  const validation = sandbox.WorkOsSchemas.validateTaskForWrite(
    {
      origin_key: 'org_00000000000000000000000000000011',
      task_title: '譫ｶ遨ｺ繧ｿ繧ｹ繧ｯ',
      due_date: '2026-02-30'
    },
    true
  );
  assert.strictEqual(validation.ok, false);
});

test('P1-AUD-06_STRICT_TYPED_READ', () => {
  const sheet = taskSheet();
  const schema = sandbox.WorkOsSchemas.getSheetSchema(
    sandbox.WorkOsConfig.SHEETS.TASKS
  );
  const map = sandbox.WorkOsSchemas.buildColumnMapFromIds(expectedTaskIds);
  const row = Array.from({ length: schema.length }, () => '');
  row[map.task_id] = 'tsk_00000000000000000000000000000011';
  row[map.origin_key] = 'org_00000000000000000000000000000011';
  row[map.task_title] = '譫ｶ遨ｺ繧ｿ繧ｹ繧ｯ';
  row[map.needs_review] = 'FALSE';
  row[map.row_version] = 'not-a-number';
  sheet.getRange(3, 1, 1, schema.length).setValues([row]);
  const context = sandbox.WorkOsTaskRepository.createContext(sheet);
  assert.throws(
    () => sandbox.WorkOsTaskRepository.readTaskAtRow(context, 3),
    (error) => error.code === 'E_TASK_TYPE'
  );
});

test('P1-AUD-06B_INVALID_ENUM_READ_IS_REJECTED', () => {
  const sheet = taskSheet();
  const schema = sandbox.WorkOsSchemas.getSheetSchema(
    sandbox.WorkOsConfig.SHEETS.TASKS
  );
  const map = sandbox.WorkOsSchemas.buildColumnMapFromIds(expectedTaskIds);
  const row = Array.from({ length: schema.length }, () => '');
  row[map.task_id] = 'tsk_00000000000000000000000000000018';
  row[map.origin_key] = 'org_00000000000000000000000000000018';
  row[map.ai_action_type] = 'NOT_A_REAL_ACTION';
  sheet.getRange(3, 1, 1, schema.length).setValues([row]);
  const context = sandbox.WorkOsTaskRepository.createContext(sheet);
  assert.throws(
    () => sandbox.WorkOsTaskRepository.readTaskAtRow(context, 3),
    (error) => error.code === 'E_INVALID_ENUM'
  );
});

test('P1-AUD-07_STALE_CONTEXT_PRESERVES_USER_EDIT', () => {
  const sheet = taskSheet();
  const originKey = 'org_00000000000000000000000000000012';
  sandbox.WorkOsTaskRepository.upsertTask(
    {
      origin_key: originKey,
      task_title: '譫ｶ遨ｺ繧ｿ繧ｹ繧ｯ',
      ai_confidence: 0.5
    },
    { sheet }
  );
  const map = sandbox.WorkOsSchemas.buildColumnMapFromIds(expectedTaskIds);
  sandbox.WorkOsTaskRepository.withLockedContext(sheet, (context) => {
    sheet.cells[2][map.comment] = '蛻ｩ逕ｨ閠・・蜷梧凾邱ｨ髮・;
    assert.throws(
      () =>
        sandbox.WorkOsTaskRepository.upsertTask(
          {
            origin_key: originKey,
            task_title: '譫ｶ遨ｺ繧ｿ繧ｹ繧ｯ',
            ai_confidence: 0.9
          },
          context
        ),
      (error) => error.code === 'E_TASK_CONFLICT'
    );
  });
  assert.strictEqual(sheet.cells[2][map.comment], '蛻ｩ逕ｨ閠・・蜷梧凾邱ｨ髮・);
});

test('P1-AUD-08_UPDATE_WRITES_CHANGED_CELLS_ONLY', () => {
  const sheet = taskSheet();
  const originKey = 'org_00000000000000000000000000000013';
  sandbox.WorkOsTaskRepository.upsertTask(
    {
      origin_key: originKey,
      task_title: '譫ｶ遨ｺ繧ｿ繧ｹ繧ｯ',
      ai_confidence: 0.5
    },
    { sheet }
  );
  sheet.writeLog = [];
  sandbox.WorkOsTaskRepository.upsertTask(
    {
      origin_key: originKey,
      task_title: '譫ｶ遨ｺ繧ｿ繧ｹ繧ｯ',
      ai_confidence: 0.9
    },
    { sheet }
  );
  assert.ok(sheet.writeLog.length >= 1);
  assert.ok(sheet.writeLog.every((entry) => entry.columnCount < 43));
});

test('P1-AUD-09_NEW_TASK_ID_IS_REPOSITORY_OWNED', () => {
  const sheet = taskSheet();
  assert.throws(
    () =>
      sandbox.WorkOsTaskRepository.upsertTask(
        {
          origin_key: 'org_00000000000000000000000000000014',
          task_id: 'tsk_00000000000000000000000000000014',
          task_title: '譫ｶ遨ｺ繧ｿ繧ｹ繧ｯ'
        },
        { sheet }
      ),
    (error) => error.code === 'E_TASK_ID_SUPPLIED'
  );
});

test('P1-AUD-10_USER_FIELD_REPLAY_REJECTED', () => {
  const sheet = taskSheet();
  const originKey = 'org_00000000000000000000000000000015';
  sandbox.WorkOsTaskRepository.upsertTask(
    { origin_key: originKey, task_title: '螟画峩蜑・ },
    { sheet }
  );
  assert.throws(
    () =>
      sandbox.WorkOsTaskRepository.upsertTask(
        { origin_key: originKey, task_title: '螟画峩蠕・ },
        { sheet }
      ),
    (error) => error.code === 'E_TASK_FIELD_NOT_UPDATABLE'
  );
});

test('P1-AUD-10B_SOURCE_IDENTITY_REPLAY_REJECTED', () => {
  const sheet = taskSheet();
  const originKey = 'org_00000000000000000000000000000019';
  sandbox.WorkOsTaskRepository.upsertTask(
    {
      origin_key: originKey,
      task_title: '譫ｶ遨ｺ繧ｿ繧ｹ繧ｯ',
      source_message_id: 'synthetic-message-a',
      source_thread_id: 'synthetic-thread-a',
      stable_thread_key: 'root:synthetic-message-a',
      source_action_index: 0
    },
    { sheet }
  );
  assert.throws(
    () =>
      sandbox.WorkOsTaskRepository.upsertTask(
        {
          origin_key: originKey,
          task_title: '譫ｶ遨ｺ繧ｿ繧ｹ繧ｯ',
          source_message_id: 'synthetic-message-b'
        },
        { sheet }
      ),
    (error) => error.code === 'E_TASK_IMMUTABLE_FIELD'
  );
});

test('P1-AUD-11_LOCK_CONTENTION_STOPS_WRITE', () => {
  const sheet = taskSheet();
  lockAvailable = false;
  try {
    assert.throws(
      () =>
        sandbox.WorkOsTaskRepository.upsertTask(
          {
            origin_key: 'org_00000000000000000000000000000016',
            task_title: '譫ｶ遨ｺ繧ｿ繧ｹ繧ｯ'
          },
          { sheet }
        ),
      (error) => error.code === 'E_LOCK_TIMEOUT'
    );
  } finally {
    lockAvailable = true;
  }
});

test('P1-AUD-12_STABLE_THREAD_INDEX', () => {
  const sheet = taskSheet();
  sandbox.WorkOsTaskRepository.upsertTask(
    {
      origin_key: 'org_00000000000000000000000000000017',
      task_title: '譫ｶ遨ｺ繧ｿ繧ｹ繧ｯ',
      stable_thread_key: 'root:synthetic-root'
    },
    { sheet }
  );
  const context = sandbox.WorkOsTaskRepository.createContext(sheet);
  assert.strictEqual(
    sandbox.WorkOsTaskRepository.findByStableThreadKey(
      context,
      'root:synthetic-root'
    ).length,
    1
  );
});

test('P1-AUD-13_REDACTION_ADVERSARIAL_CASES', () => {
  const unsafe = [
    '{"access_token":"abc123","client_secret":"def456"}',
    'refresh_token: ghi789',
    'id_token=id-secret',
    'auth_token=auth-secret',
    'credential=credential-secret',
    'password = secret with spaces',
    'client_secret="quoted-secret"',
    'https://user:pass@example.invalid/path',
    'Cookie: SID=cookie-secret',
    'Authorization: Digest digest-secret'
  ].join('\n');
  const safe = sandbox.WorkOsUtilities.redact(unsafe);
  [
    'abc123',
    'def456',
    'ghi789',
    'id-secret',
    'auth-secret',
    'credential-secret',
    'secret with spaces',
    'quoted-secret',
    'user:pass',
    'cookie-secret',
    'digest-secret'
  ].forEach((secret) => assert.strictEqual(safe.includes(secret), false));
});

test('P1-AUD-13B_INVALID_SETUP_STAGE_STATE_IS_REJECTED', () => {
  propertyValues.set(
    sandbox.WorkOsConfig.PROPERTIES.SETUP_COMPLETED_STAGES,
    JSON.stringify(['S00_VALIDATE_ENV', 'S20_CREATE_SCHEMAS'])
  );
  try {
    assert.throws(
      () => sandbox.WorkOsSetup.getCompletedStages(),
      (error) => error.code === 'E_SETUP_STATE_INVALID'
    );
  } finally {
    propertyValues.delete(
      sandbox.WorkOsConfig.PROPERTIES.SETUP_COMPLETED_STAGES
    );
  }
});

test('P1-AUD-13C_SETUP_STAGE_POSTCONDITION_IS_VERIFIED', () => {
  assert.throws(
    () =>
      sandbox.WorkOsSetup.assertCompletedStageIntegrity(
        ['S00_VALIDATE_ENV', 'S10_CREATE_SHEETS'],
        new FakeSpreadsheet([])
      ),
    (error) => error.code === 'E_SETUP_STATE_CONFLICT'
  );
});

test('P1-AUD-14_SMALL_GRID_DIAGNOSTIC_IS_STRUCTURED', () => {
  const smallTaskSheet = new FakeSheet(
    sandbox.WorkOsConfig.SHEETS.TASKS,
    1,
    2
  );
  const result = sandbox.WorkOsDiagnostics.runQuickDiagnostic(
    new FakeSpreadsheet([smallTaskSheet])
  );
  assert.strictEqual(result.status, 'FAIL');
  assert.ok(Array.isArray(result.checks));
  assert.ok(
    result.checks.some(
      (check) =>
        check.id.startsWith('READABLE_') && check.status === 'FAIL'
    )
  );
});

test('P1-AUD-14B_DIAGNOSTIC_HAS_CHUNK_AND_BUDGET_GUARDS', () => {
  const source = fs.readFileSync(
    path.join(appsScriptRoot, '16_Diagnostics.gs'),
    'utf8'
  );
  assert.ok(source.includes('createSoftBudget'));
  assert.ok(source.includes('QUICK_DIAGNOSTIC_CHUNK_ROWS'));
  assert.ok(source.includes('QUICK_DIAGNOSTIC_RESERVE_MS'));
  assert.ok(source.includes('E_DIAGNOSTIC_BUDGET'));
});

test('P1-AUD-15_DIAGNOSTIC_SOURCE_HAS_NO_WRITES', () => {
  const source = fs.readFileSync(
    path.join(appsScriptRoot, '16_Diagnostics.gs'),
    'utf8'
  );
  assert.strictEqual(
    /\.(?:setValue|setValues|clear|insert|delete|append|protect)\s*\(/.test(
      source
    ),
    false
  );
});

test('P1-AUD-16_PROTECTION_POLICY_IS_ENFORCED_IN_SOURCE', () => {
  const source = fs.readFileSync(
    path.join(appsScriptRoot, '03_SheetBuilder.gs'),
    'utf8'
  );
  assert.ok(source.includes('_EDIT_POLICY'));
  assert.ok(source.includes('setUnprotectedRanges'));
  assert.ok(source.includes('setWarningOnly(false)'));
  assert.strictEqual(source.includes('setWarningOnly(true)'), false);
  const manifest = JSON.parse(
    fs.readFileSync(path.join(appsScriptRoot, 'appsscript.json'), 'utf8')
  );
  assert.ok(
    manifest.oauthScopes.includes(
      'https://www.googleapis.com/auth/userinfo.email'
    )
  );
});

test('P1-AUD-16B_PROTECTION_POLICY_CHECKS_GEOMETRY_AND_ACCESS', () => {
  const sheet = taskSheet();
  const schema = sandbox.WorkOsSchemas.getSheetSchema(
    sandbox.WorkOsConfig.SHEETS.TASKS
  );
  const firstManagementIndex = schema.findIndex(
    (column) => column.visible === false
  );
  const prefix = `WORK_OS_V2_PHASE1_${sandbox.WorkOsConfig.SHEETS.TASKS}`;
  const rangeProtections = [
    new FakeProtection(
      `${prefix}_HEADER_IDS`,
      sheet.getRange(1, 1, 1, schema.length)
    ),
    new FakeProtection(
      `${prefix}_MANAGEMENT_COLUMNS`,
      sheet.getRange(
        1,
        firstManagementIndex + 1,
        sheet.getMaxRows(),
        schema.length - firstManagementIndex
      )
    )
  ];
  const editableRanges = schema
    .map((column, index) =>
      column.editable
        ? sheet.getRange(
            sandbox.WorkOsConfig.DATA_START_ROW,
            index + 1,
            sheet.getMaxRows() - sandbox.WorkOsConfig.DATA_START_ROW + 1,
            1
          )
        : null
    )
    .filter(Boolean);
  const taskPolicy = new FakeProtection(
    `${prefix}_EDIT_POLICY`,
    null,
    editableRanges
  );
  sheet.getProtections = (type) =>
    type === sandbox.SpreadsheetApp.ProtectionType.RANGE
      ? rangeProtections
      : [taskPolicy];
  let result = sandbox.WorkOsDiagnostics.runQuickDiagnostic(
    new FakeSpreadsheet([sheet])
  );
  assert.strictEqual(
    result.checks.find((item) => item.id === 'TASK_PROTECTIONS').status,
    'PASS'
  );
  assert.strictEqual(
    result.checks.find((item) => item.id === 'TASK_EDIT_POLICY').status,
    'PASS'
  );

  taskPolicy.editorEmails.push('unexpected.editor@example.invalid');
  result = sandbox.WorkOsDiagnostics.runQuickDiagnostic(
    new FakeSpreadsheet([sheet])
  );
  assert.strictEqual(
    result.checks.find((item) => item.id === 'TASK_EDIT_POLICY').status,
    'FAIL'
  );
});

test('P1-AUD-17_VISIBLE_SYSTEM_SHEETS_ARE_OWNER_PROTECTED', () => {
  const sheets = Array.from(sandbox.WorkOsSheetOrder, (name) => {
    const schema = sandbox.WorkOsSchemas.getSheetSchema(name);
    return new FakeSheet(name, 125, schema.length);
  });
  const spreadsheet = new FakeSpreadsheet(sheets);
  sandbox.WorkOsSheetBuilder.applyAllSchemas(spreadsheet);
  [
    sandbox.WorkOsConfig.SHEETS.DASHBOARD,
    sandbox.WorkOsConfig.SHEETS.RUN_HISTORY,
    sandbox.WorkOsConfig.SHEETS.GUIDE,
    sandbox.WorkOsConfig.SHEETS.ERRORS
  ].forEach((name) => {
    const sheet = spreadsheet.getSheetByName(name);
    const expectedDescription =
      `WORK_OS_V2_PHASE1_${name}_SYSTEM_OWNED_EDIT_POLICY`;
    const protection = sheet.sheetProtections.find(
      (item) => item.getDescription() === expectedDescription
    );
    assert.ok(protection, `${name} system protection missing`);
    assert.strictEqual(protection.isWarningOnly(), false);
    assert.deepStrictEqual(
      protection.getEditors().map((editor) => editor.getEmail()),
      ['synthetic.user@example.invalid']
    );
    if (name === sandbox.WorkOsConfig.SHEETS.ERRORS) {
      const ranges = protection.getUnprotectedRanges();
      const map = sandbox.WorkOsSchemas.buildColumnMapFromIds(
        sandbox.WorkOsSchemas.getInternalIds(name)
      );
      assert.strictEqual(ranges.length, 1);
      assert.strictEqual(ranges[0].getRow(), sandbox.WorkOsConfig.DATA_START_ROW);
      assert.strictEqual(ranges[0].getColumn(), map.retry_requested + 1);
      assert.strictEqual(
        ranges[0].getNumRows(),
        sheet.getMaxRows() - sandbox.WorkOsConfig.DATA_START_ROW + 1
      );
      assert.strictEqual(ranges[0].getNumColumns(), 1);
    } else {
      assert.strictEqual(protection.getUnprotectedRanges().length, 0);
    }
  });
});

test('P1-AUD-18_ERROR_ROW_EXPANSION_EXTENDS_ONLY_OPERATOR_SURFACE', () => {
  const source = fs.readFileSync(
    path.join(appsScriptRoot, '13_LogAndDeadLetter.gs'),
    'utf8'
  );
  assert.ok(source.includes('extendErrorOperatorCellsAfterExpansion'));
  assert.ok(source.includes('errorOperatorProtection'));
  assert.ok(source.includes('setUnprotectedRanges([operatorRange])'));
  assert.ok(source.includes('setDataValidation(validation)'));
  assert.ok(source.includes('E_ERROR_PROTECTION_MISSING'));
});

const summary = {
  phase: 1,
  suite: 'independent_audit',
  passed: tests.filter((item) => item.status === 'PASS').length,
  failed: tests.filter((item) => item.status === 'FAIL').length,
  tests
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed > 0) {
  process.exitCode = 1;
}

