'use strict';

/**
 * F-005 / F-013 Dashboard layout ownership and fail-closed tests.
 *
 * Local fake only. No Google Workspace service is contacted.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const app = path.join(root, 'apps-script-v2');
const dashboardSource = fs.readFileSync(
  path.join(app, '15_Dashboard.gs'),
  'utf8'
);

const METRICS = [
  'AUTOMATION_STATUS',
  'LAST_SUCCESS_AT',
  'LAST_FAILURE_AT',
  'PROCESSED_TODAY',
  'REVIEW_OPEN',
  'OVERDUE',
  'DUE_TODAY',
  'DUE_NEXT_7_DAYS',
  'WAITING_REPLY',
  'RETRY_WAITING',
  'DEAD_LETTER',
  'CALENDAR_PENDING',
  'UNRESOLVED_ERRORS',
  'SYSTEM_HEALTH',
  'AI_PROVIDER',
  'QUICK_DIAGNOSTIC',
  'LAST_REFRESHED_AT'
];
const INSTANCE_ID = `ins_${'a'.repeat(32)}`;

function blankMatrix(rows, columns, value) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => value)
  );
}

function makeGrid(options = {}) {
  const rows = options.rows || 100;
  const columns = 3;
  const values = blankMatrix(rows, columns, '');
  const formulas = blankMatrix(rows, columns, '');
  const notes = blankMatrix(rows, columns, '');
  const validations = blankMatrix(rows, columns, null);
  const backgrounds = blankMatrix(rows, columns, '#ffffff');
  const fontWeights = blankMatrix(rows, columns, 'normal');
  const fontStyles = blankMatrix(rows, columns, 'normal');
  const numberFormats = blankMatrix(rows, columns, 'General');
  values[0] = ['metric_key', 'metric_value', 'note'];
  values[1] = ['項目', '値', '注記'];
  const merged = new Set();
  const hiddenRows = new Set();
  const hiddenColumns = new Set();
  const protections = [];
  const namedRanges = [];
  const writes = { values: 0, notes: 0, insert: 0 };
  const reads = {
    values: 0,
    formulas: 0,
    notes: 0,
    validations: 0,
    backgrounds: 0,
    fontWeights: 0,
    fontStyles: 0,
    numberFormats: 0,
    mergedRanges: 0,
    protections: 0,
    namedRanges: 0,
    hiddenRows: 0,
    hiddenColumns: 0
  };

  function slice(matrix, row, column, rowCount, columnCount) {
    return matrix.slice(row - 1, row - 1 + rowCount).map((sourceRow) =>
      sourceRow.slice(column - 1, column - 1 + columnCount)
    );
  }

  function write(matrix, row, column, incoming) {
    incoming.forEach((sourceRow, rowOffset) => {
      sourceRow.forEach((value, columnOffset) => {
        matrix[row - 1 + rowOffset][column - 1 + columnOffset] = value;
      });
    });
  }

  function rangeFromKey(rangeKey) {
    const [rangeRow, rangeColumn, rangeRows, rangeColumns] =
      rangeKey.split(':').map(Number);
    return {
      getRow: () => rangeRow,
      getColumn: () => rangeColumn,
      getNumRows: () => rangeRows,
      getNumColumns: () => rangeColumns,
      getSheet: () => sheet,
      getA1Notation: () => rangeKey
    };
  }

  function rangesOverlap(left, right) {
    return left.getRow() <= right.getRow() + right.getNumRows() - 1 &&
      right.getRow() <= left.getRow() + left.getNumRows() - 1 &&
      left.getColumn() <= right.getColumn() + right.getNumColumns() - 1 &&
      right.getColumn() <= left.getColumn() + left.getNumColumns() - 1;
  }

  const sheet = {
    getDataRange() {
      return {
        getValues: () => {
          reads.values += 1;
          return values.map((row) => row.slice());
        }
      };
    },
    getMaxRows: () => values.length,
    getMaxColumns: () => columns,
    getRange(row, column, rowCount = 1, columnCount = 1) {
      const key = `${row}:${column}:${rowCount}:${columnCount}`;
      return {
        getRow: () => row,
        getColumn: () => column,
        getNumRows: () => rowCount,
        getNumColumns: () => columnCount,
        getValues: () => {
          reads.values += 1;
          return slice(values, row, column, rowCount, columnCount);
        },
        getFormulas: () => {
          reads.formulas += 1;
          return slice(formulas, row, column, rowCount, columnCount);
        },
        getNotes: () => {
          reads.notes += 1;
          return slice(notes, row, column, rowCount, columnCount);
        },
        getDataValidations: () => {
          reads.validations += 1;
          return slice(validations, row, column, rowCount, columnCount);
        },
        getBackgrounds: () => {
          reads.backgrounds += 1;
          return slice(backgrounds, row, column, rowCount, columnCount);
        },
        getFontWeights: () => {
          reads.fontWeights += 1;
          return slice(fontWeights, row, column, rowCount, columnCount);
        },
        getFontStyles: () => {
          reads.fontStyles += 1;
          return slice(fontStyles, row, column, rowCount, columnCount);
        },
        getNumberFormats: () => {
          reads.numberFormats += 1;
          return slice(numberFormats, row, column, rowCount, columnCount);
        },
        getHorizontalAlignments: () =>
          blankMatrix(rowCount, columnCount, 'general'),
        getWrapStrategies: () =>
          blankMatrix(rowCount, columnCount, null),
        getTextRotations: () =>
          blankMatrix(rowCount, columnCount, 0),
        getMergedRanges: () => {
          reads.mergedRanges += 1;
          const requested = rangeFromKey(key);
          return Array.from(merged)
            .map(rangeFromKey)
            .filter((candidate) => rangesOverlap(requested, candidate));
        },
        isPartOfMerge: () => merged.has(key),
        setValues(incoming) {
          writes.values += 1;
          write(values, row, column, incoming);
          return this;
        },
        setNotes(incoming) {
          writes.notes += 1;
          write(notes, row, column, incoming);
          return this;
        }
      };
    },
    getProtections: (type) => {
      reads.protections += 1;
      return protections.filter((item) => item.type === type);
    },
    isRowHiddenByUser: (row) => {
      reads.hiddenRows += 1;
      return hiddenRows.has(row);
    },
    isRowHiddenByFilter: (row) => {
      reads.hiddenRows += 1;
      return hiddenRows.has(row);
    },
    isColumnHiddenByUser: (column) => {
      reads.hiddenColumns += 1;
      return hiddenColumns.has(column);
    },
    getBandings: () => [],
    getConditionalFormatRules: () => [],
    insertRowsAfter(after, count) {
      writes.insert += 1;
      for (let index = 0; index < count; index += 1) {
        values.splice(after, 0, ['', '', '']);
        formulas.splice(after, 0, ['', '', '']);
        notes.splice(after, 0, ['', '', '']);
        validations.splice(after, 0, [null, null, null]);
      }
    }
  };
  const owner = { getEmail: () => 'owner@example.invalid' };
  const canonicalProtectionAccess = {
    isWarningOnly: () => false,
    canDomainEdit: () => false,
    canEdit: () => true,
    getTargetAudiences: () => [],
    getUnprotectedRanges: () => [],
    getEditors: () => [owner],
    getRangeName: () => null
  };
  protections.push(Object.assign({
    type: context.SpreadsheetApp.ProtectionType.SHEET,
    getDescription: () => `WORK_OS_V2_PHASE1_${
      context.WorkOsConfig.SHEETS.DASHBOARD
    }_SYSTEM_OWNED_EDIT_POLICY`
  }, canonicalProtectionAccess));
  protections.push(Object.assign({
    type: context.SpreadsheetApp.ProtectionType.RANGE,
    getDescription: () => `WORK_OS_V2_PHASE1_${
      context.WorkOsConfig.SHEETS.DASHBOARD
    }_HEADER_IDS`,
    getRange: () => rangeFromKey('1:1:2:3')
  }, canonicalProtectionAccess));
  const spreadsheet = {
    getSheetByName: () => sheet,
    getOwner: () => owner,
    getNamedRanges: () => {
      reads.namedRanges += 1;
      return namedRanges.slice();
    }
  };
  return {
    sheet,
    spreadsheet,
    values,
    formulas,
    notes,
    validations,
    backgrounds,
    fontWeights,
    fontStyles,
    numberFormats,
    merged,
    protections,
    namedRanges,
    hiddenRows,
    hiddenColumns,
    writes,
    reads
  };
}

const context = {
  console,
  Date,
  JSON,
  WorkOsConfig: {
    TIMEZONE: 'Asia/Tokyo',
    HEADER_ID_ROW: 1,
    HEADER_LABEL_ROW: 2,
    DATA_START_ROW: 3,
    ROW_EXPANSION_UNIT: 100,
    LOCK_WAIT_MS: 5000,
    DASHBOARD_RESERVE_MS: 5000,
    DASHBOARD_SOFT_LIMIT_MS: 60000,
    TEST_MODE: true,
    PROPERTIES: { INSTANCE_ID: 'WORK_OS_V2_INSTANCE_ID' },
    SHEETS: {
      DASHBOARD: 'ダッシュボード',
      TASKS: 'タスク一覧',
      RUN_HISTORY: '処理履歴',
      ERRORS: 'エラー・再実行',
      SYNC_STATE: '同期状態'
    }
  },
  WorkOsEnums: {
    TaskStatus: {},
    ReviewState: {}
  },
  WorkOsSchemas: {
    getSheetSchema: () => [
      { id: 'metric_key' },
      { id: 'metric_value' },
      { id: 'note' }
    ],
    getInternalIds: () => ['metric_key', 'metric_value', 'note'],
    buildColumnMapFromIds: (ids) =>
      Object.fromEntries(ids.map((id, index) => [id, index]))
  },
  WorkOsUtilities: {
    now: () => new Date('2026-07-25T03:00:00.000Z'),
    redact: (value) => String(value),
    sha256Hex: (value) => require('crypto')
      .createHash('sha256')
      .update(String(value))
      .digest('hex'),
    withScriptLock: (callback) => callback({ hasLock: () => true }),
    createSoftBudget: () => ({ isExhausted: () => false })
  },
  WorkOsRuntimeSettings: {
    summarizeHealth: () => ({ status: 'HEALTHY', note: '' })
  },
  WorkOsAppError: class WorkOsAppError extends Error {
    constructor(code, stage, retryable, message) {
      super(message);
      this.code = code;
      this.stage = stage;
      this.retryable = retryable;
    }
  },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: (key) =>
        key === 'WORK_OS_V2_INSTANCE_ID' ? INSTANCE_ID : null
    })
  },
  SpreadsheetApp: {
    ProtectionType: { RANGE: 'RANGE', SHEET: 'SHEET' }
  },
  Session: {
    getEffectiveUser: () => ({
      getEmail: () => 'owner@example.invalid'
    })
  },
  Utilities: {
    formatDate: (value, timezone, format) =>
      format === 'yyyy-MM-dd'
        ? new Date(value).toISOString().slice(0, 10)
        : new Date(value).toISOString()
  }
};
vm.createContext(context);
vm.runInContext(dashboardSource, context, { filename: '15_Dashboard.gs' });

function desiredRows() {
  return METRICS.map((key) => [key, 'safe aggregate', 'safe note']);
}

function assertConflict(grid) {
  const before = JSON.stringify({
    values: grid.values,
    formulas: grid.formulas,
    notes: grid.notes,
    validations: grid.validations
  });
  assert.throws(
    () => context.WorkOsDashboard.upsertMetricRows(
      grid.spreadsheet,
      desiredRows()
    ),
    (error) => error && error.code === 'E_DASHBOARD_LAYOUT_CONFLICT'
  );
  assert.deepStrictEqual(grid.writes, { values: 0, notes: 0, insert: 0 });
  assert.strictEqual(JSON.stringify({
    values: grid.values,
    formulas: grid.formulas,
    notes: grid.notes,
    validations: grid.validations
  }), before);
}

function occupyEveryPotentialBlock(grid, kind) {
  for (let rowIndex = 2; rowIndex < grid.values.length; rowIndex += 17) {
    if (kind === 'value') {
      grid.values[rowIndex][1] = 'user value';
    } else if (kind === 'formula') {
      grid.formulas[rowIndex][2] = '=ROW()';
    } else if (kind === 'note') {
      grid.notes[rowIndex][2] = 'user note';
    } else if (kind === 'validation') {
      grid.validations[rowIndex][1] = { type: 'LIST' };
    } else if (kind === 'merge') {
      grid.merged.add(`${rowIndex + 1}:1:1:3`);
    } else if (kind === 'protection') {
      const rangeKey = `${rowIndex + 1}:1:1:3`;
      grid.protections.push({
        type: context.SpreadsheetApp.ProtectionType.RANGE,
        getRange: () => ({
          getRow: () => rowIndex + 1,
          getColumn: () => 1,
          getNumRows: () => 1,
          getNumColumns: () => 3
        })
      });
    } else if (kind === 'named_range') {
      grid.namedRanges.push({
        getRange: () => ({
          getRow: () => rowIndex + 1,
          getColumn: () => 1,
          getNumRows: () => 1,
          getNumColumns: () => 3,
          getSheet: () => grid.sheet
        })
      });
    }
  }
}

const tests = [];
function test(id, body) {
  try {
    body();
    tests.push({ id, status: 'PASS' });
  } catch (error) {
    tests.push({
      id,
      status: 'FAIL',
      safe_message: String(error && error.message || error).slice(0, 200)
    });
  }
}

test('PREP-DASH-01_BLANK_KEY_WITH_VALUE_FAILS_CLOSED', () => {
  const grid = makeGrid();
  occupyEveryPotentialBlock(grid, 'value');
  assertConflict(grid);
});

test('PREP-DASH-02_BLANK_KEY_WITH_FORMULA_FAILS_CLOSED', () => {
  const grid = makeGrid();
  occupyEveryPotentialBlock(grid, 'formula');
  assertConflict(grid);
});

test('PREP-DASH-03_METADATA_SURFACES_FAIL_CLOSED', () => {
  [
    'note',
    'validation',
    'merge',
    'protection',
    'named_range'
  ].forEach((kind) => {
    const grid = makeGrid();
    occupyEveryPotentialBlock(grid, kind);
    assertConflict(grid);
  });
});

test('PREP-DASH-04_FOREIGN_OR_PARTIAL_MARKER_FAILS_CLOSED', () => {
  ['foreign', 'partial'].forEach((kind) => {
    const grid = makeGrid();
    grid.values[2] = desiredRows()[0].slice();
    grid.notes[2][0] = kind === 'foreign'
      ? 'WORK_OS_V2_DASHBOARD_BLOCK:{"owner":"FOREIGN"}'
      : 'WORK_OS_V2_DASHBOARD_BLOCK:{"owner":"WORK_OS_V2_DASHBOARD","edge":"START"}';
    assertConflict(grid);
  });
});

test('PREP-DASH-05_EMPTY_CREATE_AND_OWNED_UPDATE_ARE_IDEMPOTENT', () => {
  const grid = makeGrid();
  const first = context.WorkOsDashboard.upsertMetricRows(
    grid.spreadsheet,
    desiredRows()
  );
  const snapshot = JSON.stringify(grid.values);
  const second = context.WorkOsDashboard.upsertMetricRows(
    grid.spreadsheet,
    desiredRows()
  );
  assert.strictEqual(first.updated_count, 17);
  assert.strictEqual(second.updated_count, 17);
  assert.strictEqual(JSON.stringify(grid.values), snapshot);
  assert.strictEqual(grid.writes.insert, 0);
  assert.strictEqual(grid.notes[2][0].startsWith(
    'WORK_OS_V2_DASHBOARD_BLOCK:'
  ), true);
  assert.strictEqual(grid.notes[18][0].startsWith(
    'WORK_OS_V2_DASHBOARD_BLOCK:'
  ), true);
});

test('PREP-DASH-05B_SYSTEM_OWNED_SHEET_PROTECTION_ALLOWS_REFRESH', () => {
  const grid = makeGrid();
  const result = context.WorkOsDashboard.upsertMetricRows(
    grid.spreadsheet,
    desiredRows()
  );
  assert.strictEqual(result.updated_count, 17);
  assert.strictEqual(grid.values[2][0], 'AUTOMATION_STATUS');
});

test('PREP-DASH-05C_NATIVE_WHITE_BACKGROUND_VARIANTS_ARE_CANONICAL', () => {
  const grid = makeGrid();
  grid.backgrounds[2][0] = 'rgb(255, 255, 255)';
  grid.backgrounds[3][1] = '#FFF';
  const result = context.WorkOsDashboard.upsertMetricRows(
    grid.spreadsheet,
    desiredRows()
  );
  assert.strictEqual(result.updated_count, 17);
  assert.strictEqual(grid.values[2][0], 'AUTOMATION_STATUS');
});

test('PREP-DASH-05D_NONDEFAULT_FORMATTING_REMAINS_FAIL_CLOSED', () => {
  const grid = makeGrid();
  for (let rowIndex = 2; rowIndex < grid.backgrounds.length; rowIndex += 17) {
    grid.backgrounds[rowIndex][1] = '#ff0000';
  }
  assertConflict(grid);
});

test('PREP-DASH-06_QUICK_DIAGNOSTIC_FAIL_REJECTS_BEFORE_WRITE', () => {
  const grid = makeGrid();
  let lockCalls = 0;
  const originalLock = context.WorkOsUtilities.withScriptLock;
  context.WorkOsUtilities.withScriptLock = (callback) => {
    lockCalls += 1;
    return callback({ hasLock: () => true });
  };
  try {
    assert.throws(
      () => context.WorkOsDashboard.refresh(grid.spreadsheet, {
        budget: { isExhausted: () => false },
        task_matrix: [['task_id']],
        history_matrix: [['run_id']],
        error_matrix: [['error_id']],
        outbox_matrix: [['sync_id']],
        quick_diagnostic: { status: 'FAIL', checks: [] },
        automation_status: {
          status: 'CONSISTENT',
          prerequisites: { ready: true }
        },
        ai_readiness: { provider: '', ready: false }
      }),
      (error) => error &&
        (error.code === 'E_DASHBOARD_LAYOUT_CONFLICT' ||
          error.code === 'E_DASHBOARD_DIAGNOSTIC_FAILED')
    );
  } finally {
    context.WorkOsUtilities.withScriptLock = originalLock;
  }
  assert.strictEqual(lockCalls, 0);
  assert.deepStrictEqual(grid.writes, { values: 0, notes: 0, insert: 0 });
});

test('PREP-DASH-07_LAYOUT_SCAN_USES_ONE_SURFACE_SNAPSHOT', () => {
  const grid = makeGrid({ rows: 1000 });
  for (let rowIndex = 2; rowIndex < 500; rowIndex += 1) {
    grid.values[rowIndex][1] = 'user value';
  }
  const result = context.WorkOsDashboard.upsertMetricRows(
    grid.spreadsheet,
    desiredRows()
  );
  assert.strictEqual(result.updated_count, 17);
  [
    'values',
    'formulas',
    'notes',
    'validations',
    'backgrounds',
    'fontWeights',
    'fontStyles',
    'numberFormats',
    'mergedRanges',
    'namedRanges'
  ].forEach((key) => {
    assert.strictEqual(
      grid.reads[key],
      1,
      `${key} must be read exactly once`
    );
  });
  assert.strictEqual(grid.reads.protections, 2);
  assert.strictEqual(grid.reads.hiddenColumns, 3);
  assert.strictEqual(grid.reads.hiddenRows, 34);
});

test('PREP-DASH-08_BLANK_KEY_USER_ROWS_ARE_PRESERVED', () => {
  const grid = makeGrid();
  grid.values[2][1] = 'user value';
  grid.formulas[3][2] = '=ROW()';
  const result = context.WorkOsDashboard.upsertMetricRows(
    grid.spreadsheet,
    desiredRows()
  );
  assert.strictEqual(result.updated_count, 17);
  assert.strictEqual(grid.values[2][1], 'user value');
  assert.strictEqual(grid.formulas[3][2], '=ROW()');
  assert.strictEqual(grid.values[4][0], 'AUTOMATION_STATUS');
  assert.strictEqual(grid.writes.insert, 0);
});

const failed = tests.filter((item) => item.status === 'FAIL');
const report = {
  suite: 'prepilot_dashboard_safety',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_google_workspace: 'NOT_EXECUTED',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  process.exitCode = 1;
}
