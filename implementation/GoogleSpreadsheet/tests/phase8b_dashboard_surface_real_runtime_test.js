'use strict';

/**
 * Phase 8B Dashboard native Protection/surface regression.
 *
 * This suite executes only an in-memory Apps Script facade. It never calls
 * Google Workspace, OAuth, Gmail, Calendar, Dashboard refresh in a real
 * Spreadsheet, a trigger, deployment, or a Provider.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const quickSuitePath = path.join(
  __dirname,
  'phase8b_quick_diagnostic_real_runtime_test.js'
);
const quickSuiteSource = fs.readFileSync(quickSuitePath, 'utf8')
  .replace(/\r\n/g, '\n');
const quickTestsMarker = '\nconst tests = [];\n';
const quickFixtureEnd = quickSuiteSource.lastIndexOf(quickTestsMarker);
if (quickFixtureEnd < 0) {
  throw new Error('PHASE8B_QUICK_FIXTURE_TEST_MARKER_NOT_FOUND');
}

const fixtureContext = {
  require,
  __dirname,
  __filename: quickSuitePath,
  console,
  process: { stdout: { write: () => {} }, exitCode: 0 },
  Buffer,
  structuredClone
};
vm.createContext(fixtureContext);
vm.runInContext(
  quickSuiteSource.slice(0, quickFixtureEnd) + `
globalThis.__phase8bDashboardSurfaceFixture = {
  sandbox,
  FakeRange: fixture.FakeRange,
  buildCanonicalEnvironment,
  dashboardSheet,
  runDiagnostic,
  checkById,
  ensureSurfaceMatrices
};`,
  fixtureContext,
  { filename: 'phase8b_dashboard_surface_fixture.js' }
);

const fixture = fixtureContext.__phase8bDashboardSurfaceFixture;
const sandbox = fixture.sandbox;
const OWNER_EMAIL = 'synthetic.user@example.invalid';
const FOREIGN_EMAIL = 'foreign.user@example.invalid';

fixture.FakeRange.prototype.setNotes = function (incoming) {
  incoming.forEach((row, rowOffset) => {
    row.forEach((value, columnOffset) => {
      this.sheet.notes[this.row - 1 + rowOffset][
        this.column - 1 + columnOffset
      ] = value;
    });
  });
  this.sheet.writeLog.push({
    row: this.row,
    column: this.column,
    rowCount: this.rowCount,
    columnCount: this.columnCount,
    notes: true
  });
  return this;
};

function environment() {
  const result = fixture.buildCanonicalEnvironment();
  result.spreadsheet.owner = { getEmail: () => OWNER_EMAIL };
  return result;
}

function dashboardProtections(target) {
  const sheet = fixture.dashboardSheet(target);
  return {
    sheet,
    sheetProtection: sheet.sheetProtections[0],
    headerProtection: sheet.rangeProtections[0]
  };
}

function setEffectiveEmail(email) {
  sandbox.Session.getEffectiveUser = () => ({
    getEmail: () => email
  });
}

function inspect(target) {
  return sandbox.WorkOsDashboard.inspectLayout(target.spreadsheet);
}

function conflict(target) {
  try {
    const result = inspect(target);
    if (result && result.writable === false) {
      return {
        reason: result.conflict_reason_code,
        subreason: result.conflict_subreason_code,
        counts: result.conflict_counts || {}
      };
    }
    assert.fail('Expected Dashboard layout conflict');
  } catch (error) {
    assert.strictEqual(error && error.code, 'E_DASHBOARD_LAYOUT_CONFLICT');
    return {
      reason: error.dashboard_conflict_reason,
      subreason: error.dashboard_conflict_subreason,
      counts: error.dashboard_conflict_counts || {}
    };
  }
}

function clearDashboardSeed(target) {
  const sheet = fixture.dashboardSheet(target);
  for (let row = sandbox.WorkOsConfig.DATA_START_ROW - 1;
      row < sheet.maxRows;
      row += 1) {
    for (let column = 0; column < sheet.maxColumns; column += 1) {
      sheet.cells[row][column] = '';
      sheet.formulas[row][column] = '';
      sheet.notes[row][column] = '';
      sheet.validations[row][column] = null;
      sheet.backgrounds[row][column] = '#ffffff';
      sheet.fontWeights[row][column] = 'normal';
      sheet.fontStyles[row][column] = 'normal';
      sheet.formats[row][column] =
        sandbox.WorkOsConfig.DASHBOARD_SYSTEM_BLOCK_TEXT_FORMAT;
    }
  }
  sheet.mergedRanges = [];
  sheet.hiddenRowsByUser.clear();
  sheet.hiddenRowsByFilter.clear();
  sheet.hiddenColumnsByUser.clear();
  target.spreadsheet.namedRanges = [];
}

function eachPotentialBlock(target, mutate) {
  const sheet = fixture.dashboardSheet(target);
  const dataRows = sheet.maxRows - sandbox.WorkOsConfig.DATA_START_ROW + 1;
  const blockRows = sandbox.WorkOsDashboard.METRIC_ORDER.length;
  for (let start = 0; start < dataRows; start += blockRows) {
    mutate(
      sheet,
      sandbox.WorkOsConfig.DATA_START_ROW - 1 + start,
      sandbox.WorkOsConfig.DATA_START_ROW + start
    );
  }
}

function rangeState(range) {
  if (!range) return null;
  return [
    range.getRow(),
    range.getColumn(),
    range.getNumRows(),
    range.getNumColumns()
  ];
}

function validationState(rule) {
  return rule && typeof rule.getCriteriaType === 'function'
    ? String(rule.getCriteriaType())
    : (rule == null ? null : 'NONCANONICAL');
}

function dashboardFingerprint(target) {
  const sheet = fixture.dashboardSheet(target);
  const properties = sandbox.PropertiesService.getScriptProperties();
  const propertyState = {};
  Object.keys(sandbox.WorkOsConfig.PROPERTIES).sort().forEach((key) => {
    const propertyKey = sandbox.WorkOsConfig.PROPERTIES[key];
    propertyState[propertyKey] = properties.getProperty(propertyKey);
  });
  const protectionState = (protections) => protections.map((item) => ({
    description: item.getDescription(),
    range: rangeState(item.getRange && item.getRange()),
    warning_only: item.isWarningOnly(),
    domain_edit: item.canDomainEdit(),
    can_edit: item.canEdit(),
    explicit_editor_count: item.getEditors().length,
    target_audience_count: item.getTargetAudiences().length,
    unprotected_ranges: item.getUnprotectedRanges().map(rangeState)
  }));
  return JSON.stringify({
    values: sheet.cells,
    formulas: sheet.formulas,
    notes: sheet.notes,
    validations: sheet.validations.map((row) =>
      row.map(validationState)
    ),
    backgrounds: sheet.backgrounds,
    font_weights: sheet.fontWeights,
    font_styles: sheet.fontStyles,
    number_formats: sheet.formats,
    merges: sheet.mergedRanges.map(rangeState),
    hidden_rows_user: Array.from(sheet.hiddenRowsByUser).sort(),
    hidden_rows_filter: Array.from(sheet.hiddenRowsByFilter).sort(),
    hidden_columns: Array.from(sheet.hiddenColumnsByUser).sort(),
    sheet_protections: protectionState(sheet.sheetProtections),
    range_protections: protectionState(sheet.rangeProtections),
    named_ranges: (target.spreadsheet.namedRanges || []).map((item) =>
      rangeState(item.getRange())
    ),
    properties: propertyState,
    write_log: sheet.writeLog
  });
}

const tests = [];
function test(id, body) {
  const startedAt = Date.now();
  try {
    setEffectiveEmail(OWNER_EMAIL);
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
        error && error.message || String(error)
      )
    });
  }
}

test('P8B-DS-01_OWNER_EXPLICIT_EDITOR_IS_CANONICAL', () => {
  const target = environment();
  const result = inspect(target);
  assert.strictEqual(result.status, 'LEGACY_SEED');
  assert.strictEqual(result.protection_access_mode, 'OWNER_EXPLICIT_EDITOR');
});

test('P8B-DS-02_OWNER_IMPLICIT_CAN_EDIT_IS_CANONICAL', () => {
  const target = environment();
  const protections = dashboardProtections(target);
  protections.sheetProtection.editorEmails = [];
  protections.headerProtection.editorEmails = [];
  const result = inspect(target);
  assert.strictEqual(result.status, 'LEGACY_SEED');
  assert.strictEqual(result.protection_access_mode, 'OWNER_IMPLICIT_CAN_EDIT');
});

test('P8B-DS-03_DIFFERENT_EFFECTIVE_USER_FAILS_CLOSED', () => {
  const target = environment();
  setEffectiveEmail(FOREIGN_EMAIL);
  const result = conflict(target);
  assert.strictEqual(
    result.reason,
    'DASHBOARD_SHEET_PROTECTION_CONTRACT'
  );
  assert.strictEqual(
    result.subreason,
    'PROTECTION_EFFECTIVE_USER_NOT_OWNER'
  );
  assert.strictEqual(result.counts.sheet_protection_count, 1);
  assert.strictEqual(result.counts.explicit_editor_count, 0);
  assert.strictEqual(result.counts.target_audience_count, 0);
});

test('P8B-DS-04_SHARED_DRIVE_OWNER_NULL_FAILS_CLOSED', () => {
  const target = environment();
  target.spreadsheet.owner = null;
  const result = conflict(target);
  assert.strictEqual(result.reason, 'DASHBOARD_SHEET_PROTECTION_CONTRACT');
  assert.strictEqual(
    result.subreason,
    'PROTECTION_OWNER_UNAVAILABLE_SHARED_DRIVE'
  );
});

test('P8B-DS-05_CAN_EDIT_FALSE_FAILS_CLOSED', () => {
  const target = environment();
  dashboardProtections(target).sheetProtection.canEdit = () => false;
  assert.strictEqual(
    conflict(target).subreason,
    'PROTECTION_CAN_EDIT_FALSE'
  );
});

test('P8B-DS-06_FOREIGN_EDITOR_FAILS_CLOSED', () => {
  const target = environment();
  dashboardProtections(target).sheetProtection.editorEmails.push(
    FOREIGN_EMAIL
  );
  const result = conflict(target);
  assert.strictEqual(result.reason, 'DASHBOARD_SHEET_PROTECTION_CONTRACT');
  assert.strictEqual(result.subreason, 'PROTECTION_FOREIGN_EDITOR');
  assert.strictEqual(result.counts.explicit_editor_count, 2);
});

test('P8B-DS-07_DOMAIN_EDIT_FAILS_CLOSED', () => {
  const target = environment();
  dashboardProtections(target).sheetProtection.setDomainEdit(true);
  assert.strictEqual(
    conflict(target).subreason,
    'PROTECTION_DOMAIN_EDIT_ENABLED'
  );
});

test('P8B-DS-08_TARGET_AUDIENCE_FAILS_CLOSED', () => {
  const target = environment();
  dashboardProtections(target).sheetProtection.getTargetAudiences =
    () => [{ synthetic: true }];
  const result = conflict(target);
  assert.strictEqual(
    result.subreason,
    'PROTECTION_TARGET_AUDIENCE_PRESENT'
  );
  assert.strictEqual(result.counts.target_audience_count, 1);
});

test('P8B-DS-09_WARNING_ONLY_FAILS_CLOSED', () => {
  const target = environment();
  dashboardProtections(target).sheetProtection.setWarningOnly(true);
  assert.strictEqual(
    conflict(target).subreason,
    'PROTECTION_WARNING_ONLY'
  );
});

test('P8B-DS-10_DUPLICATE_SHEET_AND_HEADER_PROTECTIONS_FAIL_CLOSED', () => {
  const sheetDuplicate = environment();
  const first = dashboardProtections(sheetDuplicate);
  first.sheet.sheetProtections.push(first.sheetProtection);
  assert.strictEqual(
    conflict(sheetDuplicate).subreason,
    'SHEET_PROTECTION_DUPLICATE'
  );

  const headerDuplicate = environment();
  const second = dashboardProtections(headerDuplicate);
  second.sheet.rangeProtections.push(second.headerProtection);
  assert.strictEqual(
    conflict(headerDuplicate).subreason,
    'HEADER_PROTECTION_DUPLICATE'
  );
});

test('P8B-DS-11_PROTECTION_DESCRIPTION_GEOMETRY_AND_UNPROTECTED_FAIL', () => {
  const wrongDescription = environment();
  dashboardProtections(wrongDescription).sheetProtection.setDescription(
    'SYNTHETIC_FOREIGN_DESCRIPTION'
  );
  assert.strictEqual(
    conflict(wrongDescription).subreason,
    'SHEET_PROTECTION_DESCRIPTION_MISMATCH'
  );

  const wrongGeometry = environment();
  const geometry = dashboardProtections(wrongGeometry);
  geometry.headerProtection.setRange(geometry.sheet.getRange(1, 1, 1, 3));
  assert.strictEqual(
    conflict(wrongGeometry).subreason,
    'HEADER_PROTECTION_GEOMETRY_MISMATCH'
  );

  const unprotected = environment();
  const unprotectedParts = dashboardProtections(unprotected);
  unprotectedParts.sheetProtection.setUnprotectedRanges([
    unprotectedParts.sheet.getRange(3, 1, 1, 1)
  ]);
  assert.strictEqual(
    conflict(unprotected).subreason,
    'PROTECTION_UNPROTECTED_RANGE_PRESENT'
  );
});

test('P8B-DS-12_FOREIGN_RANGE_PROTECTION_FAILS_CLOSED', () => {
  const target = environment();
  const parts = dashboardProtections(target);
  parts.sheet.rangeProtections.push({
    getDescription: () => 'SYNTHETIC_FOREIGN_RANGE',
    getRange: () => parts.sheet.getRange(3, 1, 1, 3)
  });
  const result = conflict(target);
  assert.strictEqual(
    result.reason,
    'DASHBOARD_FOREIGN_OR_OVERLAPPING_RANGE_PROTECTION'
  );
  assert.strictEqual(result.subreason, 'FOREIGN_RANGE_PROTECTION_PRESENT');
});

test('P8B-DS-13_SURFACE_CONFLICTS_HAVE_CLOSED_REASON_ENUMS', () => {
  const scenarios = [
    ['DASHBOARD_FOREIGN_NAMED_RANGE', (target, sheet, row, physicalRow) => {
      target.spreadsheet.namedRanges.push({
        getRange: () => sheet.getRange(physicalRow, 1, 1, 1)
      });
    }],
    ['DASHBOARD_VALUE_CONFLICT', (target, sheet, row) => {
      sheet.cells[row][1] = 'synthetic';
    }],
    ['DASHBOARD_FORMULA_CONFLICT', (target, sheet, row) => {
      sheet.formulas[row][1] = '=1+1';
    }],
    ['DASHBOARD_VALIDATION_CONFLICT', (target, sheet, row) => {
      sheet.validations[row][1] = { synthetic: true };
    }],
    ['DASHBOARD_NOTE_CONFLICT', (target, sheet, row) => {
      sheet.notes[row][1] = 'synthetic';
    }],
    ['DASHBOARD_MERGE_CONFLICT', (target, sheet, row, physicalRow) => {
      sheet.mergedRanges.push(sheet.getRange(physicalRow, 1, 1, 2));
    }],
    ['DASHBOARD_HIDDEN_ROW_OR_COLUMN', (target, sheet, row, physicalRow) => {
      sheet.hiddenRowsByUser.add(physicalRow);
    }],
    ['DASHBOARD_BACKGROUND_CONFLICT', (target, sheet, row) => {
      sheet.backgrounds[row][1] = '#ff0000';
    }],
    ['DASHBOARD_FONT_CONFLICT', (target, sheet, row) => {
      sheet.fontWeights[row][1] = 'bold';
    }],
    ['DASHBOARD_NUMBER_FORMAT_CONFLICT', (target, sheet, row) => {
      sheet.formats[row][1] = '0.00';
    }]
  ];
  scenarios.forEach(([expected, mutate]) => {
    const target = environment();
    clearDashboardSeed(target);
    eachPotentialBlock(target, (sheet, row, physicalRow) => {
      mutate(target, sheet, row, physicalRow);
    });
    assert.strictEqual(conflict(target).reason, expected);
  });

  const hiddenColumn = environment();
  clearDashboardSeed(hiddenColumn);
  fixture.dashboardSheet(hiddenColumn).hiddenColumnsByUser.add(2);
  assert.strictEqual(
    conflict(hiddenColumn).reason,
    'DASHBOARD_HIDDEN_ROW_OR_COLUMN'
  );
});

test('P8B-DS-14_EXACT_THREE_ROW_SEED_IS_ACCEPTED', () => {
  const target = environment();
  const result = inspect(target);
  assert.strictEqual(result.status, 'LEGACY_SEED');
  assert.strictEqual(result.writable, true);
});

test('P8B-DS-15_EXACT_OWNED_MARKER_STATE_IS_ACCEPTED', () => {
  const target = environment();
  const desired = sandbox.WorkOsDashboard.METRIC_ORDER.map((key) => [
    key,
    'SYNTHETIC',
    'SYNTHETIC'
  ]);
  const writeResult = sandbox.WorkOsDashboard.upsertMetricRows(
    target.spreadsheet,
    desired
  );
  assert.strictEqual(writeResult.updated_count, desired.length);
  const result = inspect(target);
  assert.strictEqual(result.status, 'OWNED');
  assert.strictEqual(result.writable, true);
});

test('P8B-DS-16_SEED_AND_MARKER_CORRUPTION_HAVE_CLOSED_REASON', () => {
  const seed = environment();
  fixture.dashboardSheet(seed).cells[
    sandbox.WorkOsConfig.DATA_START_ROW - 1
  ][2] = 'synthetic-drift';
  assert.strictEqual(
    conflict(seed).reason,
    'DASHBOARD_SEED_OR_MARKER_CONTRACT'
  );

  const marker = environment();
  fixture.dashboardSheet(marker).notes[
    sandbox.WorkOsConfig.DATA_START_ROW - 1
  ][0] = 'WORK_OS_V2_DASHBOARD_BLOCK:{"owner":"SYNTHETIC"}';
  const markerConflict = conflict(marker);
  assert.strictEqual(
    markerConflict.reason,
    'DASHBOARD_SEED_OR_MARKER_CONTRACT'
  );
  assert.strictEqual(markerConflict.subreason, 'MARKER_NONCANONICAL');
});

test('P8B-DS-17_QUICK_DIAGNOSTIC_IS_BYTE_STABLE_AND_NON_SENSITIVE', () => {
  const target = environment();
  const before = dashboardFingerprint(target);
  const result = fixture.runDiagnostic(target);
  const after = dashboardFingerprint(target);
  assert.strictEqual(after, before);
  const dashboardCheck = fixture.checkById(
    result,
    'DASHBOARD_LAYOUT_OWNERSHIP'
  );
  assert.strictEqual(dashboardCheck.status, 'WARN');
  assert.strictEqual(
    dashboardCheck.details.protection_access_mode,
    'OWNER_EXPLICIT_EDITOR'
  );
  const serialized = JSON.stringify(dashboardCheck.details);
  assert.strictEqual(serialized.includes(OWNER_EMAIL), false);
  assert.strictEqual(serialized.includes(FOREIGN_EMAIL), false);
  assert.strictEqual(serialized.includes('getA1Notation'), false);
});

const failed = tests.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({
  suite: 'phase8b_dashboard_surface_real_runtime',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_google_workspace: 'NOT_EXECUTED',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
