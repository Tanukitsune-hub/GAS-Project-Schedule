'use strict';

/**
 * Phase 8B Quick Diagnostic regression suite for the four real-runtime
 * findings.  It uses only an in-memory Apps Script double: no Workspace,
 * Gmail, Calendar, OAuth, trigger, or deployment call is made.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repositoryRoot = path.resolve(__dirname, '..');
const appsScriptRoot = path.join(repositoryRoot, 'apps-script-v2');
const phase1FixturePath = path.join(__dirname, 'phase1_audit_test.js');
const phase1Source = fs.readFileSync(phase1FixturePath, 'utf8')
  .replace(/\r\n/g, '\n');
const testsMarker = '\nconst tests = [];\n';
const fixtureEnd = phase1Source.indexOf(testsMarker);
if (fixtureEnd < 0) {
  throw new Error('PHASE1_FIXTURE_TEST_MARKER_NOT_FOUND');
}

const fixtureContext = {
  require,
  __dirname,
  __filename: phase1FixturePath,
  console,
  process: { stdout: { write: () => {} }, exitCode: 0 },
  Buffer,
  structuredClone
};
vm.createContext(fixtureContext);
vm.runInContext(
  phase1Source.slice(0, fixtureEnd) + `
globalThis.__phase8bQuickDiagnosticFixture = {
  sandbox,
  FakeRange,
  FakeSheet,
  FakeSpreadsheet
};`,
  fixtureContext,
  { filename: 'phase1_authority_fixture.js' }
);

const fixture = fixtureContext.__phase8bQuickDiagnosticFixture;
const sandbox = fixture.sandbox;
vm.runInContext(
  fs.readFileSync(path.join(appsScriptRoot, '15_Dashboard.gs'), 'utf8'),
  sandbox,
  { filename: '15_Dashboard.gs' }
);

function matrix(rows, columns, value) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => value)
  );
}

function ensureSurfaceMatrices(sheet) {
  if (!sheet.backgrounds) {
    sheet.backgrounds = matrix(sheet.maxRows, sheet.maxColumns, '#ffffff');
    sheet.fontWeights = matrix(sheet.maxRows, sheet.maxColumns, 'normal');
    sheet.fontStyles = matrix(sheet.maxRows, sheet.maxColumns, 'normal');
    sheet.mergedRanges = [];
    sheet.hiddenRowsByUser = new Set();
    sheet.hiddenRowsByFilter = new Set();
    sheet.hiddenColumnsByUser = new Set();
  }
}

function rangesOverlap(left, right) {
  return left.getRow() <= right.getRow() + right.getNumRows() - 1 &&
    right.getRow() <= left.getRow() + left.getNumRows() - 1 &&
    left.getColumn() <= right.getColumn() + right.getNumColumns() - 1 &&
    right.getColumn() <= left.getColumn() + left.getNumColumns() - 1;
}

function extendFakeRuntime() {
  const originalSetDataValidation = fixture.FakeRange.prototype.setDataValidation;
  fixture.FakeRange.prototype.setDataValidation = function (validation) {
    originalSetDataValidation.call(this, validation);
    const isCheckbox = validation &&
      validation.getCriteriaType &&
      validation.getCriteriaType() === sandbox.SpreadsheetApp
        .DataValidationCriteria.CHECKBOX;
    if (!isCheckbox || !this.sheet.materializeTaskCheckboxFalse ||
        this.row < sandbox.WorkOsConfig.DATA_START_ROW) {
      return this;
    }
    for (let rowOffset = 0; rowOffset < this.rowCount; rowOffset += 1) {
      for (let columnOffset = 0;
          columnOffset < this.columnCount;
          columnOffset += 1) {
        const row = this.row - 1 + rowOffset;
        const column = this.column - 1 + columnOffset;
        if (this.sheet.cells[row][column] === '' &&
            this.sheet.formulas[row][column] === '') {
          this.sheet.cells[row][column] = false;
        }
      }
    }
    return this;
  };

  fixture.FakeRange.prototype.getBackgrounds = function () {
    ensureSurfaceMatrices(this.sheet);
    return this.matrixFrom(this.sheet.backgrounds);
  };
  fixture.FakeRange.prototype.getFontWeights = function () {
    ensureSurfaceMatrices(this.sheet);
    return this.matrixFrom(this.sheet.fontWeights);
  };
  fixture.FakeRange.prototype.getFontStyles = function () {
    ensureSurfaceMatrices(this.sheet);
    return this.matrixFrom(this.sheet.fontStyles);
  };
  fixture.FakeRange.prototype.setBackground = function (value) {
    ensureSurfaceMatrices(this.sheet);
    for (let rowOffset = 0; rowOffset < this.rowCount; rowOffset += 1) {
      for (let columnOffset = 0;
          columnOffset < this.columnCount;
          columnOffset += 1) {
        this.sheet.backgrounds[this.row - 1 + rowOffset][
          this.column - 1 + columnOffset
        ] = String(value || '');
      }
    }
    return this;
  };
  fixture.FakeRange.prototype.setFontWeight = function (value) {
    ensureSurfaceMatrices(this.sheet);
    for (let rowOffset = 0; rowOffset < this.rowCount; rowOffset += 1) {
      for (let columnOffset = 0;
          columnOffset < this.columnCount;
          columnOffset += 1) {
        this.sheet.fontWeights[this.row - 1 + rowOffset][
          this.column - 1 + columnOffset
        ] = String(value || 'normal');
      }
    }
    return this;
  };
  fixture.FakeRange.prototype.getMergedRanges = function () {
    ensureSurfaceMatrices(this.sheet);
    return this.sheet.mergedRanges.filter((candidate) =>
      rangesOverlap(this, candidate)
    );
  };

  fixture.FakeSheet.prototype.isRowHiddenByUser = function (row) {
    ensureSurfaceMatrices(this);
    return this.hiddenRowsByUser.has(row);
  };
  fixture.FakeSheet.prototype.isRowHiddenByFilter = function (row) {
    ensureSurfaceMatrices(this);
    return this.hiddenRowsByFilter.has(row);
  };
  fixture.FakeSheet.prototype.isColumnHiddenByUser = function (column) {
    ensureSurfaceMatrices(this);
    return this.hiddenColumnsByUser.has(column);
  };
  fixture.FakeSheet.prototype.hideRows = function (start, count) {
    ensureSurfaceMatrices(this);
    for (let row = start; row < start + count; row += 1) {
      this.hiddenRowsByUser.add(row);
    }
    return this;
  };
  fixture.FakeSheet.prototype.hideColumns = function (start, count) {
    ensureSurfaceMatrices(this);
    for (let column = start; column < start + count; column += 1) {
      this.hiddenColumnsByUser.add(column);
    }
    return this;
  };

  fixture.FakeSpreadsheet.prototype.getNamedRanges = function () {
    return (this.namedRanges || []).slice();
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
    const currentIndex = this.sheets.indexOf(active);
    if (currentIndex < 0) return this;
    this.sheets.splice(currentIndex, 1);
    this.sheets.splice(Math.max(0, Number(position) - 1), 0, active);
    return this;
  };
}
extendFakeRuntime();

function fakeProtection(description, range) {
  return {
    getDescription: () => description,
    getRange: () => range,
    isWarningOnly: () => false,
    canDomainEdit: () => false,
    getUnprotectedRanges: () => [],
    getEditors: () => [{ getEmail: () => 'synthetic.user@example.invalid' }]
  };
}

function buildCanonicalEnvironment() {
  const sheets = Array.from(sandbox.WorkOsSheetOrder, (name) => {
    const sheet = new fixture.FakeSheet(
      name,
      sandbox.WorkOsSheetBuilder.initialRowsForSheet(name),
      sandbox.WorkOsSchemas.getSheetSchema(name).length
    );
    ensureSurfaceMatrices(sheet);
    sheet.materializeTaskCheckboxFalse =
      name === sandbox.WorkOsConfig.SHEETS.TASKS;
    return sheet;
  });
  const spreadsheet = new fixture.FakeSpreadsheet(sheets);
  spreadsheet.namedRanges = [];
  sandbox.WorkOsSheetBuilder.applyAllSchemas(spreadsheet);
  sandbox.WorkOsSheetBuilder.applyValidationsAndFormats(spreadsheet);
  sandbox.WorkOsSheetBuilder.applyVisibility(spreadsheet);
  sandbox.WorkOsSheetBuilder.seedSafeSettings(spreadsheet);
  sandbox.WorkOsDashboard.normalizeSystemBlockNumberFormatForSetup(
    spreadsheet
  );
  return { spreadsheet, sheets };
}

function taskSheet(environment) {
  return environment.spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.TASKS
  );
}

function dashboardSheet(environment) {
  return environment.spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.DASHBOARD
  );
}

function taskColumnMap() {
  return sandbox.WorkOsSchemas.buildColumnMapFromIds(
    sandbox.WorkOsSchemas.getInternalIds(sandbox.WorkOsConfig.SHEETS.TASKS)
  );
}

function checkById(result, id) {
  const check = result.checks.find((item) => item.id === id);
  assert.ok(check, `Quick Diagnostic omitted ${id}`);
  return check;
}

function runDiagnostic(environment) {
  return sandbox.WorkOsDiagnostics.runQuickDiagnostic(environment.spreadsheet);
}

function writeCount(environment) {
  return environment.sheets.reduce(
    (total, sheet) => total + sheet.writeLog.length,
    0
  );
}

function expectedDashboardHeaderGeometry() {
  return {
    row: sandbox.WorkOsConfig.HEADER_ID_ROW,
    column: 1,
    rows: sandbox.WorkOsConfig.HEADER_LABEL_ROW -
      sandbox.WorkOsConfig.HEADER_ID_ROW + 1,
    columns: 3
  };
}

function geometry(range) {
  return {
    row: range.getRow(),
    column: range.getColumn(),
    rows: range.getNumRows(),
    columns: range.getNumColumns()
  };
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
  }
}

test('P8B-QD-01_S20_S30_S40_CANONICAL_RUNTIME_CLEARS_FOUR_FINDINGS_READ_ONLY', () => {
  const environment = buildCanonicalEnvironment();
  const dashboard = dashboardSheet(environment);
  const headerDescription = `WORK_OS_V2_PHASE1_${
    sandbox.WorkOsConfig.SHEETS.DASHBOARD
  }_HEADER_IDS`;
  const systemDescription = `WORK_OS_V2_PHASE1_${
    sandbox.WorkOsConfig.SHEETS.DASHBOARD
  }_SYSTEM_OWNED_EDIT_POLICY`;
  const headerProtection = dashboard.getProtections(
    sandbox.SpreadsheetApp.ProtectionType.RANGE
  ).filter((item) => item.getDescription() === headerDescription);
  const systemProtection = dashboard.getProtections(
    sandbox.SpreadsheetApp.ProtectionType.SHEET
  ).filter((item) => item.getDescription() === systemDescription);
  assert.strictEqual(headerProtection.length, 1);
  assert.deepStrictEqual(
    geometry(headerProtection[0].getRange()),
    expectedDashboardHeaderGeometry()
  );
  assert.strictEqual(systemProtection.length, 1);
  assert.strictEqual(systemProtection[0].isWarningOnly(), false);
  assert.strictEqual(systemProtection[0].canDomainEdit(), false);
  assert.strictEqual(systemProtection[0].getUnprotectedRanges().length, 0);
  assert.strictEqual(systemProtection[0].getEditors().length, 1);

  const writesBefore = writeCount(environment);
  const result = runDiagnostic(environment);
  assert.notStrictEqual(result.status, 'FAIL', JSON.stringify(result));
  assert.strictEqual(
    checkById(result, 'DASHBOARD_LAYOUT_OWNERSHIP').status,
    'WARN'
  );
  assert.strictEqual(
    checkById(result, 'DASHBOARD_LAYOUT_OWNERSHIP').details.layout_status,
    'LEGACY_SEED'
  );
  [
    'TASK_PROTECTIONS',
    'BLANK_ROW_BOOLEAN_VALUES',
    'TASK_VALIDATION_TYPES'
  ].forEach((id) => assert.strictEqual(checkById(result, id).status, 'PASS'));
  assert.strictEqual(writeCount(environment), writesBefore);
});

test('P8B-QD-02_CANONICAL_LEGACY_SEED_REQUIRES_EXACT_THREE_VALUES', () => {
  const environment = buildCanonicalEnvironment();
  dashboardSheet(environment).cells[
    sandbox.WorkOsConfig.DATA_START_ROW - 1
  ][2] = 'tampered-safe-looking-text';
  const result = runDiagnostic(environment);
  assert.strictEqual(
    checkById(result, 'DASHBOARD_LAYOUT_OWNERSHIP').status,
    'FAIL'
  );
});

test('P8B-QD-03_VALIDATION_AND_BLANK_ROW_FALSE_CONTRACT_IS_NARROW', () => {
  const environment = buildCanonicalEnvironment();
  const task = taskSheet(environment);
  const map = taskColumnMap();
  const row = sandbox.WorkOsConfig.DATA_START_ROW - 1;
  task.validations[row][map.calendar_reconcile_required] = null;
  task.validations[row][map.comment] = task.validations[row][map.completed];
  task.cells[row][map.needs_review] = true;
  task.cells[row + 1][map.completed] = 'false';
  task.cells[row + 2][map.comment] = false;
  const result = runDiagnostic(environment);
  assert.strictEqual(checkById(result, 'TASK_VALIDATION_TYPES').status, 'FAIL');
  assert.strictEqual(checkById(result, 'BLANK_ROW_BOOLEAN_VALUES').status, 'FAIL');
});

test('P8B-QD-04_PARTIAL_TASK_IDENTITY_REMAINS_FAIL_CLOSED', () => {
  const environment = buildCanonicalEnvironment();
  const task = taskSheet(environment);
  const map = taskColumnMap();
  task.cells[sandbox.WorkOsConfig.DATA_START_ROW - 1][map.task_id] =
    `tsk_${'1'.repeat(32)}`;
  const result = runDiagnostic(environment);
  assert.strictEqual(
    checkById(result, 'TASK_PRIMARY_KEY_COMPLETENESS').status,
    'FAIL'
  );
});

test('P8B-QD-05_TASK_HEADER_CONTROL_PLANE_FAILURES_REMAIN_FAIL_CLOSED', () => {
  const scenarios = [
    (task) => task.rangeProtections[0].setRange(
      task.getRange(1, 1, 1, task.getMaxColumns())
    ),
    (task) => task.rangeProtections[0].setRange(
      task.getRange(1, 1, 2, task.getMaxColumns() - 1)
    ),
    (task) => { task.rangeProtections[0].setDomainEdit(true); },
    (task) => { task.rangeProtections[0].editorEmails.push('extra@example.invalid'); },
    (task) => task.rangeProtections.push(fakeProtection(
      task.rangeProtections[0].getDescription(),
      task.getRange(1, 1, 2, task.getMaxColumns())
    ))
  ];
  scenarios.forEach((mutate) => {
    const environment = buildCanonicalEnvironment();
    mutate(taskSheet(environment));
    assert.strictEqual(
      checkById(runDiagnostic(environment), 'TASK_PROTECTIONS').status,
      'FAIL'
    );
  });
});

test('P8B-QD-06_DASHBOARD_FOREIGN_OR_UNSAFE_SURFACES_REMAIN_FAIL_CLOSED', () => {
  const scenarios = [
    (environment, sheet) => sheet.sheetProtections.push(fakeProtection(
      'FOREIGN_DASHBOARD_SHEET_PROTECTION', null
    )),
    (environment, sheet) => sheet.rangeProtections.push(fakeProtection(
      'FOREIGN_DASHBOARD_RANGE_PROTECTION', sheet.getRange(3, 1, 1, 3)
    )),
    (environment, sheet) => { sheet.formulas[2][1] = '=1+1'; },
    (environment, sheet) => { sheet.notes[2][1] = 'foreign note'; },
    (environment, sheet) => {
      environment.spreadsheet.namedRanges.push({
        getRange: () => sheet.getRange(3, 1, 1, 1)
      });
    },
    (environment, sheet) => { sheet.mergedRanges.push(sheet.getRange(3, 1, 1, 2)); },
    (environment, sheet) => { sheet.hiddenRowsByUser.add(3); },
    (environment, sheet) => { sheet.hiddenColumnsByUser.add(2); },
    (environment, sheet) => { sheet.cells[5][0] = 'AUTOMATION_STATUS'; },
    (environment, sheet) => {
      sheet.notes[2][0] = 'WORK_OS_V2_DASHBOARD_BLOCK:{"owner":"FOREIGN"}';
    },
    (environment, sheet) => { sheet.backgrounds[2][1] = '#ff0000'; },
    (environment, sheet) => { sheet.fontWeights[2][1] = 'bold'; },
    (environment, sheet) => { sheet.fontStyles[2][1] = 'italic'; },
    (environment, sheet) => { sheet.formats[2][1] = 'yyyy/mm/dd'; }
  ];
  scenarios.forEach((mutate) => {
    const environment = buildCanonicalEnvironment();
    mutate(environment, dashboardSheet(environment));
    assert.strictEqual(
      checkById(runDiagnostic(environment), 'DASHBOARD_LAYOUT_OWNERSHIP').status,
      'FAIL'
    );
  });
});

const failed = tests.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({
  suite: 'phase8b_quick_diagnostic_real_runtime',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_google_workspace: 'NOT_EXECUTED',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
