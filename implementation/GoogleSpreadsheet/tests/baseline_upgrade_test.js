'use strict';

/**
 * Regression test for upgrading an already-complete v2 installation.
 *
 * The fixture represents a Phase 4 (2.4.0 / S99 complete) spreadsheet.  The
 * upgrade path may be exposed directly as
 * WorkOsSheetBuilder.refreshVersionMetadata(spreadsheet), or it may be wired
 * into the existing S70 setup stage.  In either case it must update the three
 * version metadata values without rebuilding schemas or modifying user data.
 *
 * This suite uses an in-memory Google Apps Script facade only.  It does not
 * access a real Spreadsheet, Properties service, or external API.
 */
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repositoryRoot = path.resolve(__dirname, '..');
const appsScriptRoot = path.join(repositoryRoot, 'apps-script-v2');

function blankMatrix(rowCount, columnCount, valueFactory) {
  return Array.from({ length: rowCount }, (_unused, rowIndex) =>
    Array.from({ length: columnCount }, (_unusedColumn, columnIndex) =>
      valueFactory ? valueFactory(rowIndex, columnIndex) : ''
    )
  );
}

class FakeRange {
  constructor(sheet, row, column, rowCount, columnCount) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.rowCount = rowCount || 1;
    this.columnCount = columnCount || 1;
  }

  getValues() {
    return blankMatrix(this.rowCount, this.columnCount, (rowOffset, columnOffset) =>
      this.sheet.cells[this.row - 1 + rowOffset][this.column - 1 + columnOffset]
    );
  }

  getValue() {
    return this.getValues()[0][0];
  }

  setValues(values) {
    assert.strictEqual(values.length, this.rowCount, 'setValues row count');
    values.forEach((valuesRow, rowOffset) => {
      assert.strictEqual(
        valuesRow.length,
        this.columnCount,
        'setValues column count'
      );
      valuesRow.forEach((value, columnOffset) => {
        this.sheet.cells[this.row - 1 + rowOffset][
          this.column - 1 + columnOffset
        ] = value;
      });
    });
    this.sheet.writeCount += 1;
    return this;
  }

  setValue(value) {
    assert.strictEqual(this.rowCount, 1, 'setValue range row count');
    assert.strictEqual(this.columnCount, 1, 'setValue range column count');
    return this.setValues([[value]]);
  }

  getFormulas() {
    return blankMatrix(this.rowCount, this.columnCount);
  }

  getNotes() {
    return blankMatrix(this.rowCount, this.columnCount);
  }

  getDataValidations() {
    return blankMatrix(this.rowCount, this.columnCount, () => null);
  }

  canEdit() {
    return true;
  }
}

class FakeSheet {
  constructor(name, rows, columns) {
    this.name = name;
    this.maxRows = rows;
    this.maxColumns = columns;
    this.cells = blankMatrix(rows, columns);
    this.writeCount = 0;
  }

  getName() {
    return this.name;
  }

  getMaxRows() {
    return this.maxRows;
  }

  getMaxColumns() {
    return this.maxColumns;
  }

  getRange(row, column, rowCount, columnCount) {
    const resolvedRows = rowCount || 1;
    const resolvedColumns = columnCount || 1;
    assert(row >= 1 && column >= 1, 'range coordinates must be positive');
    assert(
      row + resolvedRows - 1 <= this.maxRows,
      `${this.name}: range exceeds row grid`
    );
    assert(
      column + resolvedColumns - 1 <= this.maxColumns,
      `${this.name}: range exceeds column grid`
    );
    return new FakeRange(
      this,
      row,
      column,
      resolvedRows,
      resolvedColumns
    );
  }

  getDataRange() {
    let lastUsedRow = 1;
    this.cells.forEach((row, rowIndex) => {
      if (row.some((value) => value !== '' && value != null)) {
        lastUsedRow = rowIndex + 1;
      }
    });
    return this.getRange(1, 1, lastUsedRow, this.maxColumns);
  }

  getProtections() {
    return [];
  }

  insertRowsAfter(afterRow, count) {
    assert.strictEqual(afterRow, this.maxRows);
    for (let index = 0; index < count; index += 1) {
      this.cells.push(Array.from({ length: this.maxColumns }, () => ''));
    }
    this.maxRows += count;
    this.writeCount += 1;
    return this;
  }
}

class FakeSpreadsheet {
  constructor(sheets) {
    this.sheets = sheets.slice();
  }

  getSheets() {
    return this.sheets.slice();
  }

  getSheetByName(name) {
    return this.sheets.find((sheet) => sheet.getName() === name) || null;
  }
}

class FakeScriptProperties {
  constructor(initialValues) {
    this.values = new Map(Object.entries(initialValues || {}));
    this.writeCount = 0;
  }

  getProperty(key) {
    return this.values.has(String(key)) ? this.values.get(String(key)) : null;
  }

  setProperty(key, value) {
    this.values.set(String(key), String(value));
    this.writeCount += 1;
    return this;
  }

  setProperties(values) {
    Object.keys(values).forEach((key) => {
      this.values.set(String(key), String(values[key]));
    });
    this.writeCount += 1;
    return this;
  }

  deleteProperty(key) {
    this.values.delete(String(key));
    this.writeCount += 1;
    return this;
  }

  snapshot() {
    return Object.fromEntries(
      Array.from(this.values.entries()).sort(([left], [right]) =>
        left.localeCompare(right)
      )
    );
  }
}

let activeSpreadsheet = null;
let scriptProperties = null;

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
    computeDigest: (_algorithm, value) => Array.from(
      crypto.createHash('sha256').update(String(value), 'utf8').digest()
    ).map((byte) => (byte > 127 ? byte - 256 : byte)),
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    Charset: { UTF_8: 'UTF_8' }
  },
  SpreadsheetApp: {
    getActiveSpreadsheet: () => activeSpreadsheet,
    ProtectionType: {
      RANGE: 'RANGE',
      SHEET: 'SHEET'
    }
  },
  PropertiesService: {
    getScriptProperties: () => scriptProperties
  },
  Session: {
    getEffectiveUser: () => ({
      getEmail: () => 'synthetic-owner@example.invalid'
    })
  }
};
vm.createContext(sandbox);

[
  '00_Config.gs',
  '01_TypesAndSchemas.gs',
  '17_Utilities.gs',
  '03_SheetBuilder.gs',
  '02_Setup.gs'
].forEach((fileName) => {
  vm.runInContext(
    fs.readFileSync(path.join(appsScriptRoot, fileName), 'utf8'),
    sandbox,
    { filename: fileName }
  );
});

function populateHeaders(sheet, sheetName) {
  const ids = Array.from(sandbox.WorkOsSchemas.getInternalIds(sheetName));
  const headers = Array.from(sandbox.WorkOsSchemas.getHeaders(sheetName));
  sheet.getRange(1, 1, 1, ids.length).setValues([ids]);
  sheet.getRange(2, 1, 1, headers.length).setValues([headers]);
  sheet.writeCount = 0;
}

function setRecord(sheet, sheetName, row, record) {
  const ids = Array.from(sandbox.WorkOsSchemas.getInternalIds(sheetName));
  const values = ids.map((id) =>
    Object.prototype.hasOwnProperty.call(record, id) ? record[id] : ''
  );
  sheet.getRange(row, 1, 1, values.length).setValues([values]);
}

function makeCompletedPhase4Environment() {
  const sheets = Array.from(sandbox.WorkOsSheetOrder).map((sheetName) => {
    const schema = sandbox.WorkOsSchemas.getSheetSchema(sheetName);
    const sheet = new FakeSheet(sheetName, 100, schema.length);
    populateHeaders(sheet, sheetName);
    return sheet;
  });
  const spreadsheet = new FakeSpreadsheet(sheets);

  const taskSheet = spreadsheet.getSheetByName(sandbox.WorkOsConfig.SHEETS.TASKS);
  setRecord(taskSheet, sandbox.WorkOsConfig.SHEETS.TASKS, 3, {
    task_id: 'tsk_phase4_existing_0000000000000001',
    origin_key: 'org_phase4_existing_0000000000000001',
    task_title: 'Synthetic task that must survive metadata refresh',
    comment: 'User-authored synthetic comment',
    status: '譛ｪ蟇ｾ蠢・,
    row_version: 7,
    created_at: new Date('2026-07-23T00:00:00.000Z'),
    updated_at: new Date('2026-07-23T01:00:00.000Z')
  });

  const settingsSheet = spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.SETTINGS
  );
  setRecord(settingsSheet, sandbox.WorkOsConfig.SHEETS.SETTINGS, 3, {
    setting_key: 'auto_max_messages',
    display_name: 'Synthetic user setting',
    value: '7',
    value_type: 'INTEGER',
    allowed_values: '1..10',
    description: 'Must not be replaced by setup rerun',
    editable: true,
    updated_at: new Date('2026-07-23T02:00:00.000Z')
  });
  setRecord(settingsSheet, sandbox.WorkOsConfig.SHEETS.SETTINGS, 4, {
    setting_key: 'user_custom_setting',
    display_name: 'Synthetic custom setting',
    value: 'KEEP-ME',
    value_type: 'STRING',
    allowed_values: '',
    description: 'Unrelated row must survive setup rerun',
    editable: true,
    updated_at: new Date('2026-07-23T02:00:00.000Z')
  });

  const systemSheet = spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.SYSTEM_CONFIG
  );
  [
    {
      config_key: 'code_version',
      config_value: '2.4.0-phase4',
      value_type: 'STRING',
      updated_at: new Date('2026-07-23T03:00:00.000Z'),
      note: 'Phase 4 baseline'
    },
    {
      config_key: 'schema_version',
      config_value: '2.0',
      value_type: 'STRING',
      updated_at: new Date('2026-07-23T03:00:00.000Z'),
      note: 'Existing v2 physical schema'
    },
    {
      config_key: 'migration_version',
      config_value: '0',
      value_type: 'STRING',
      updated_at: new Date('2026-07-23T03:00:00.000Z'),
      note: 'No v1 migration'
    },
    {
      config_key: 'user_custom_flag',
      config_value: 'KEEP-ME',
      value_type: 'STRING',
      updated_at: new Date('2026-07-23T03:00:00.000Z'),
      note: 'Unrelated record'
    }
  ].forEach((record, index) => {
    setRecord(
      systemSheet,
      sandbox.WorkOsConfig.SHEETS.SYSTEM_CONFIG,
      3 + index,
      record
    );
  });

  sheets.forEach((sheet) => {
    sheet.writeCount = 0;
  });

  const completedStages = JSON.stringify(
    Array.from(sandbox.WorkOsConfig.SETUP_STAGES)
  );
  const properties = new FakeScriptProperties({
    [sandbox.WorkOsConfig.PROPERTIES.INSTANCE_ID]:
      'ins_phase4existing000000000000000001',
    [sandbox.WorkOsConfig.PROPERTIES.CODE_VERSION]: '2.4.0-phase4',
    [sandbox.WorkOsConfig.PROPERTIES.SCHEMA_VERSION]: '2.0',
    [sandbox.WorkOsConfig.PROPERTIES.MIGRATION_VERSION]: '0',
    [sandbox.WorkOsConfig.PROPERTIES.SETUP_COMPLETED_STAGES]: completedStages,
    WORK_OS_V2_USER_CUSTOM_PROPERTY: 'KEEP-ME'
  });

  return {
    spreadsheet,
    properties,
    taskSheet,
    settingsSheet,
    systemSheet,
    completedStages
  };
}

function totalSheetWrites(spreadsheet) {
  return spreadsheet.getSheets().reduce(
    (sum, sheet) => sum + sheet.writeCount,
    0
  );
}

function invokeVersionRefresh(spreadsheet) {
  if (
    sandbox.WorkOsSetup &&
    typeof sandbox.WorkOsSetup.refreshCompletedVersionMetadataForTest ===
      'function'
  ) {
    return {
      route: 'WorkOsSetup.refreshCompletedVersionMetadataForTest',
      result: sandbox.WorkOsSetup.refreshCompletedVersionMetadataForTest(
        spreadsheet,
        Array.from(sandbox.WorkOsConfig.SETUP_STAGES)
      )
    };
  }

  if (
    sandbox.WorkOsSheetBuilder &&
    typeof sandbox.WorkOsSheetBuilder.refreshVersionMetadata === 'function'
  ) {
    return {
      route: 'WorkOsSheetBuilder.refreshVersionMetadata',
      result: sandbox.WorkOsSheetBuilder.refreshVersionMetadata(spreadsheet)
    };
  }

  assert(
    sandbox.WorkOsSetup &&
      typeof sandbox.WorkOsSetup.runStageForTest === 'function',
    'No version metadata refresh or testable Setup S70 path is exposed'
  );
  return {
    route: 'WorkOsSetup.runStageForTest(S70_STORE_PROPERTIES)',
    result: sandbox.WorkOsSetup.runStageForTest('S70_STORE_PROPERTIES')
  };
}

function configRecords(systemSheet) {
  const ids = Array.from(
    sandbox.WorkOsSchemas.getInternalIds(
      sandbox.WorkOsConfig.SHEETS.SYSTEM_CONFIG
    )
  );
  const keyIndex = ids.indexOf('config_key');
  const output = {};
  systemSheet.cells.slice(2).forEach((row) => {
    const key = String(row[keyIndex] || '');
    if (!key) {
      return;
    }
    if (!output[key]) {
      output[key] = [];
    }
    output[key].push(
      Object.fromEntries(ids.map((id, index) => [id, row[index]]))
    );
  });
  return output;
}

function snapshotCells(sheet) {
  return structuredClone(sheet.cells);
}

function settingRecords(settingsSheet) {
  const ids = Array.from(
    sandbox.WorkOsSchemas.getInternalIds(
      sandbox.WorkOsConfig.SHEETS.SETTINGS
    )
  );
  const keyIndex = ids.indexOf('setting_key');
  const output = {};
  settingsSheet.cells.slice(2).forEach((row) => {
    const key = String(row[keyIndex] || '');
    if (key) {
      output[key] = Object.fromEntries(
        ids.map((id, index) => [id, row[index]])
      );
    }
  });
  return output;
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
      message: error && error.message ? error.message : String(error)
    });
  }
}

test('BASELINE-UPGRADE-01_METADATA_REFRESH_AND_DATA_PRESERVATION', () => {
  const fixture = makeCompletedPhase4Environment();
  activeSpreadsheet = fixture.spreadsheet;
  scriptProperties = fixture.properties;

  const taskBefore = snapshotCells(fixture.taskSheet);
  const customSettingBefore =
    settingRecords(fixture.settingsSheet).user_custom_setting;
  const completedBefore = fixture.properties.getProperty(
    sandbox.WorkOsConfig.PROPERTIES.SETUP_COMPLETED_STAGES
  );

  const invocation = invokeVersionRefresh(fixture.spreadsheet);
  assert(invocation.route, 'refresh route should be reported');

  const records = configRecords(fixture.systemSheet);
  const expectedMetadata = {
    code_version: String(sandbox.WorkOsConfig.CODE_VERSION),
    schema_version: String(sandbox.WorkOsConfig.SCHEMA_VERSION),
    migration_version: String(sandbox.WorkOsConfig.MIGRATION_VERSION)
  };
  Object.keys(expectedMetadata).forEach((key) => {
    assert(records[key], `missing System Config metadata row: ${key}`);
    assert.strictEqual(records[key].length, 1, `duplicate metadata row: ${key}`);
    assert.strictEqual(
      String(records[key][0].config_value),
      expectedMetadata[key],
      `${key} was not refreshed to WorkOsConfig`
    );
  });

  assert.strictEqual(
    fixture.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.CODE_VERSION
    ),
    expectedMetadata.code_version
  );
  assert.strictEqual(
    fixture.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.SCHEMA_VERSION
    ),
    expectedMetadata.schema_version
  );
  assert.strictEqual(
    fixture.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.MIGRATION_VERSION
    ),
    expectedMetadata.migration_version
  );
  assert.deepStrictEqual(fixture.taskSheet.cells, taskBefore);
  const settingsAfter = settingRecords(fixture.settingsSheet);
  assert.strictEqual(
    String(settingsAfter.auto_max_messages.value),
    '7',
    'editable runtime value was not preserved'
  );
  assert.deepStrictEqual(
    settingsAfter.user_custom_setting,
    customSettingBefore,
    'unrelated Settings row changed'
  );
  assert.strictEqual(
    records.user_custom_flag[0].config_value,
    'KEEP-ME',
    'unrelated System Config row changed'
  );
  assert.strictEqual(
    fixture.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.SETUP_COMPLETED_STAGES
    ),
    completedBefore,
    'S99-complete stage history changed'
  );
  assert.strictEqual(
    fixture.properties.getProperty('WORK_OS_V2_USER_CUSTOM_PROPERTY'),
    'KEEP-ME',
    'unrelated Script Property changed'
  );
});

test('BASELINE-UPGRADE-02_SECOND_REFRESH_IS_A_STRICT_NO_OP', () => {
  const fixture = makeCompletedPhase4Environment();
  activeSpreadsheet = fixture.spreadsheet;
  scriptProperties = fixture.properties;

  invokeVersionRefresh(fixture.spreadsheet);
  const sheetsAfterFirst = fixture.spreadsheet.getSheets().map((sheet) => ({
    name: sheet.getName(),
    cells: snapshotCells(sheet)
  }));
  const propertiesAfterFirst = fixture.properties.snapshot();
  const sheetWritesAfterFirst = totalSheetWrites(fixture.spreadsheet);
  const propertyWritesAfterFirst = fixture.properties.writeCount;

  invokeVersionRefresh(fixture.spreadsheet);

  assert.deepStrictEqual(
    fixture.spreadsheet.getSheets().map((sheet) => ({
      name: sheet.getName(),
      cells: snapshotCells(sheet)
    })),
    sheetsAfterFirst,
    'second refresh changed Sheet values or metadata timestamps'
  );
  assert.deepStrictEqual(
    fixture.properties.snapshot(),
    propertiesAfterFirst,
    'second refresh changed Script Properties'
  );
  assert.strictEqual(
    totalSheetWrites(fixture.spreadsheet),
    sheetWritesAfterFirst,
    'second refresh performed a Sheet write'
  );
  assert.strictEqual(
    fixture.properties.writeCount,
    propertyWritesAfterFirst,
    'second refresh performed a Script Properties write'
  );
});

const summary = {
  suite: 'baseline_upgrade_existing_v2',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  passed: tests.filter((item) => item.status === 'PASS').length,
  failed: tests.filter((item) => item.status === 'FAIL').length,
  tests
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed > 0) {
  process.exitCode = 1;
}

