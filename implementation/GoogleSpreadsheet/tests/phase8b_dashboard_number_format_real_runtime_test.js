'use strict';

/**
 * Phase 8B Dashboard number-format real-runtime regression.
 *
 * This suite is an in-memory Apps Script facade only. It does not contact
 * Google Workspace, OAuth, Gmail, Calendar, triggers, deployment, or a
 * provider. All format values and resource tokens are synthetic.
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
  throw new Error('PHASE8B_NUMBER_FORMAT_FIXTURE_TEST_MARKER_NOT_FOUND');
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
globalThis.__phase8bDashboardNumberFormatFixture = {
  sandbox,
  FakeRange: fixture.FakeRange,
  buildCanonicalEnvironment,
  dashboardSheet,
  runDiagnostic,
  checkById
};`,
  fixtureContext,
  { filename: 'phase8b_dashboard_number_format_fixture.js' }
);

const fixture = fixtureContext.__phase8bDashboardNumberFormatFixture;
const sandbox = fixture.sandbox;
const CANONICAL_FORMAT =
  sandbox.WorkOsConfig.DASHBOARD_SYSTEM_BLOCK_TEXT_FORMAT;
const BLOCK_ROWS = sandbox.WorkOsDashboard.METRIC_ORDER.length;
const BLOCK_COLUMNS = 3;
const SYNTHETIC_NONCANONICAL_FORMAT = 'SYNTHETIC_NONCANONICAL_FORMAT';
const SYNTHETIC_CUSTOM_FORMAT = 'SYNTHETIC_CUSTOM_FORMAT';

function installNumberFormatRuntime() {
  const originalSetNumberFormat = fixture.FakeRange.prototype.setNumberFormat;
  fixture.FakeRange.prototype.setNumberFormat = function (format) {
    const result = originalSetNumberFormat.call(this, format);
    this.sheet.numberFormatWrites = this.sheet.numberFormatWrites || [];
    this.sheet.numberFormatWrites.push({
      operation: 'setNumberFormat',
      row: this.row,
      column: this.column,
      row_count: this.rowCount,
      column_count: this.columnCount
    });
    return result;
  };
  fixture.FakeRange.prototype.setNumberFormats = function (formats) {
    assert.strictEqual(formats.length, this.rowCount);
    formats.forEach((sourceRow, rowOffset) => {
      assert.strictEqual(sourceRow.length, this.columnCount);
      sourceRow.forEach((value, columnOffset) => {
        this.sheet.formats[this.row - 1 + rowOffset][
          this.column - 1 + columnOffset
        ] = String(value == null ? '' : value);
      });
    });
    this.sheet.numberFormatWrites = this.sheet.numberFormatWrites || [];
    this.sheet.numberFormatWrites.push({
      operation: 'setNumberFormats',
      row: this.row,
      column: this.column,
      row_count: this.rowCount,
      column_count: this.columnCount
    });
    return this;
  };
  fixture.FakeRange.prototype.setNotes = function (notes) {
    assert.strictEqual(notes.length, this.rowCount);
    notes.forEach((sourceRow, rowOffset) => {
      assert.strictEqual(sourceRow.length, this.columnCount);
      sourceRow.forEach((value, columnOffset) => {
        this.sheet.notes[this.row - 1 + rowOffset][
          this.column - 1 + columnOffset
        ] = String(value == null ? '' : value);
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
}
installNumberFormatRuntime();

function environment() {
  const result = fixture.buildCanonicalEnvironment();
  const sheet = fixture.dashboardSheet(result);
  sheet.numberFormatWrites = [];
  return result;
}

function dashboardSheet(target) {
  return fixture.dashboardSheet(target);
}

function formatWrites(target) {
  return dashboardSheet(target).numberFormatWrites || [];
}

function resetFormatWrites(target) {
  dashboardSheet(target).numberFormatWrites = [];
}

function setSystemFormat(target, value) {
  const sheet = dashboardSheet(target);
  const start = sandbox.WorkOsConfig.DATA_START_ROW - 1;
  for (let row = 0; row < BLOCK_ROWS; row += 1) {
    for (let column = 0; column < BLOCK_COLUMNS; column += 1) {
      sheet.formats[start + row][column] = value;
    }
  }
}

function systemFormats(target) {
  const sheet = dashboardSheet(target);
  const start = sandbox.WorkOsConfig.DATA_START_ROW - 1;
  return sheet.formats.slice(start, start + BLOCK_ROWS).map((row) =>
    row.slice(0, BLOCK_COLUMNS)
  );
}

function assertCanonicalSystemFormat(target) {
  systemFormats(target).forEach((row) => row.forEach((value) =>
    assert.strictEqual(value, CANONICAL_FORMAT)
  ));
}

function numberFormatConflictCheck(result) {
  return fixture.checkById(result, 'DASHBOARD_LAYOUT_OWNERSHIP');
}

function assertNoFormatRepair(target, callback) {
  resetFormatWrites(target);
  assert.throws(callback, (error) =>
    error && error.code === 'E_DASHBOARD_LAYOUT_CONFLICT'
  );
  assert.deepStrictEqual(formatWrites(target), []);
}

function buildOwnedMarkerState(target) {
  const rows = sandbox.WorkOsDashboard.METRIC_ORDER.map((key) => [
    key,
    'SYNTHETIC_AGGREGATE',
    'SYNTHETIC_NOTE'
  ]);
  sandbox.WorkOsDashboard.upsertMetricRows(target.spreadsheet, rows);
  assert.strictEqual(
    sandbox.WorkOsDashboard.inspectLayout(target.spreadsheet).status,
    'OWNED'
  );
}

function makeProperties(initial) {
  const values = new Map(Object.entries(initial || {}).map(([key, value]) => [
    String(key),
    String(value)
  ]));
  return {
    getProperty: (key) => values.has(String(key)) ? values.get(String(key)) : null,
    setProperty: (key, value) => values.set(String(key), String(value)),
    setProperties: (entries) => Object.keys(entries).forEach((key) =>
      values.set(String(key), String(entries[key]))
    ),
    snapshot: () => Object.fromEntries(values.entries())
  };
}

function installCompletedResumeStubs(target) {
  const originals = {
    getActiveSpreadsheet: sandbox.SpreadsheetApp.getActiveSpreadsheet,
    propertiesService: sandbox.PropertiesService,
    WorkOsMigrations: sandbox.WorkOsMigrations,
    WorkOsGmailGateway: sandbox.WorkOsGmailGateway,
    WorkOsCalendarSync: sandbox.WorkOsCalendarSync,
    WorkOsAutomation: sandbox.WorkOsAutomation,
    WorkOsDiagnostics: sandbox.WorkOsDiagnostics
  };
  const prefix = sandbox.WorkOsConfig.SETUP_STAGES.slice(
    0,
    sandbox.WorkOsConfig.SETUP_STAGES.indexOf('S90_QUICK_DIAGNOSTIC')
  );
  const properties = makeProperties({
    [sandbox.WorkOsConfig.PROPERTIES.SETUP_COMPLETED_STAGES]:
      JSON.stringify(prefix),
    [sandbox.WorkOsConfig.PROPERTIES.INSTANCE_ID]:
      `ins_${'0'.repeat(32)}`,
    [sandbox.WorkOsConfig.PROPERTIES.CODE_VERSION]:
      sandbox.WorkOsConfig.CODE_VERSION,
    [sandbox.WorkOsConfig.PROPERTIES.SCHEMA_VERSION]:
      sandbox.WorkOsConfig.SCHEMA_VERSION,
    [sandbox.WorkOsConfig.PROPERTIES.MIGRATION_VERSION]:
      sandbox.WorkOsConfig.MIGRATION_VERSION,
    [sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED]: 'false',
    [sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE]: 'false',
    [sandbox.WorkOsConfig.PROPERTIES.DEADLINE_CALENDAR_ID]:
      'synthetic-calendar-token',
    [sandbox.WorkOsConfig.PROPERTIES.EDIT_TRIGGER_ID]:
      'synthetic-edit-trigger-token'
  });
  const resources = {
    labels: { created: 0, deleted: 0, inspected: 0 },
    calendar: { created: 0, deleted: 0, inspected: 0 },
    edit_trigger: { created: 0, deleted: 0, reused: 0 },
    five_minute_trigger_created: 0
  };
  sandbox.SpreadsheetApp.getActiveSpreadsheet = () => target.spreadsheet;
  sandbox.PropertiesService = { getScriptProperties: () => properties };
  sandbox.WorkOsMigrations = {
    ensureV2ExtensionsBeforeValidation: () => ({ status: 'NOT_APPLICABLE' })
  };
  sandbox.WorkOsGmailGateway = {
    inspectFormalLabels: () => {
      resources.labels.inspected += 1;
      return {
        complete: true,
        present_count: sandbox.WorkOsConfig.GMAIL_LABELS.length
      };
    }
  };
  sandbox.WorkOsCalendarSync = {
    inspectDedicatedCalendarConfiguration: () => {
      resources.calendar.inspected += 1;
      return {
        property_present: true,
        remotely_verified: true,
        status: 'CONFIGURED'
      };
    }
  };
  sandbox.WorkOsAutomation = {
    ensureEditTrigger: () => {
      resources.edit_trigger.reused += 1;
      return { status: 'CONFIGURED', synthetic: true };
    }
  };
  // The Setup regression below targets the pre-S90 normalization boundary.
  // Quick/Deep read-only behavior is tested through their actual module below.
  sandbox.WorkOsDiagnostics = {
    runQuickDiagnostic: () => ({ status: 'PASS', checks: [] })
  };
  return {
    properties,
    resources,
    restore: () => {
      sandbox.SpreadsheetApp.getActiveSpreadsheet =
        originals.getActiveSpreadsheet;
      sandbox.PropertiesService = originals.propertiesService;
      sandbox.WorkOsMigrations = originals.WorkOsMigrations;
      sandbox.WorkOsGmailGateway = originals.WorkOsGmailGateway;
      sandbox.WorkOsCalendarSync = originals.WorkOsCalendarSync;
      sandbox.WorkOsAutomation = originals.WorkOsAutomation;
      sandbox.WorkOsDiagnostics = originals.WorkOsDiagnostics;
    }
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

test('P8B-NF-01_STRICT_DIAGNOSTIC_COUNTS_EXACT_17_BY_3_CONFLICT', () => {
  const target = environment();
  setSystemFormat(target, SYNTHETIC_NONCANONICAL_FORMAT);
  resetFormatWrites(target);
  const result = fixture.runDiagnostic(target);
  const check = numberFormatConflictCheck(result);
  assert.strictEqual(check.status, 'FAIL');
  assert.strictEqual(
    check.details.conflict_reason_code,
    'DASHBOARD_NUMBER_FORMAT_CONFLICT'
  );
  assert.strictEqual(
    check.details.conflict_subreason_code,
    'NUMBER_FORMAT_NONCANONICAL'
  );
  assert.strictEqual(
    check.details.conflict_counts.number_format_conflict_count,
    BLOCK_ROWS * BLOCK_COLUMNS
  );
  assert.deepStrictEqual(formatWrites(target), []);
});

test('P8B-NF-02_SETUP_NORMALIZES_ONLY_THE_EXACT_SYSTEM_BLOCK', () => {
  const target = environment();
  const sheet = dashboardSheet(target);
  const outsideRow = sandbox.WorkOsConfig.DATA_START_ROW - 1 + BLOCK_ROWS;
  sheet.formats[outsideRow][1] = SYNTHETIC_CUSTOM_FORMAT;
  setSystemFormat(target, SYNTHETIC_NONCANONICAL_FORMAT);
  resetFormatWrites(target);
  const result = sandbox.WorkOsDashboard
    .normalizeSystemBlockNumberFormatForSetup(target.spreadsheet);
  assert.strictEqual(result.status, 'NORMALIZED');
  assert.strictEqual(result.write_performed, true);
  assert.deepStrictEqual(formatWrites(target), [{
    operation: 'setNumberFormat',
    row: sandbox.WorkOsConfig.DATA_START_ROW,
    column: 1,
    row_count: BLOCK_ROWS,
    column_count: BLOCK_COLUMNS
  }]);
  assertCanonicalSystemFormat(target);
  assert.strictEqual(sheet.formats[outsideRow][1], SYNTHETIC_CUSTOM_FORMAT);
  const quick = fixture.runDiagnostic(target);
  assert.notStrictEqual(numberFormatConflictCheck(quick).status, 'FAIL');
});

test('P8B-NF-03_SECOND_NORMALIZATION_IS_IDEMPOTENT', () => {
  const target = environment();
  resetFormatWrites(target);
  const result = sandbox.WorkOsDashboard
    .normalizeSystemBlockNumberFormatForSetup(target.spreadsheet);
  assert.strictEqual(result.status, 'CANONICAL');
  assert.strictEqual(result.write_performed, false);
  assert.deepStrictEqual(formatWrites(target), []);
});

test('P8B-NF-04_OWNED_MARKER_STATE_NORMALIZES_AFTER_FORMAT_DRIFT', () => {
  const target = environment();
  buildOwnedMarkerState(target);
  setSystemFormat(target, SYNTHETIC_NONCANONICAL_FORMAT);
  resetFormatWrites(target);
  const result = sandbox.WorkOsDashboard
    .normalizeSystemBlockNumberFormatForSetup(target.spreadsheet);
  assert.strictEqual(result.status, 'NORMALIZED');
  assert.strictEqual(result.layout_status, 'OWNED');
  assertCanonicalSystemFormat(target);
  assert.strictEqual(formatWrites(target).length, 1);
});

test('P8B-NF-05_QUICK_AND_DEEP_DIAGNOSTICS_NEVER_REPAIR', () => {
  const target = environment();
  setSystemFormat(target, SYNTHETIC_NONCANONICAL_FORMAT);
  resetFormatWrites(target);
  fixture.runDiagnostic(target);
  const afterQuick = formatWrites(target).slice();
  const deep = sandbox.WorkOsDiagnostics.runDeepDiagnostic(
    target.spreadsheet,
    { now: new Date('2026-07-30T00:00:00.000Z') }
  );
  assert.ok(deep && Array.isArray(deep.checks));
  assert.deepStrictEqual(afterQuick, []);
  assert.deepStrictEqual(formatWrites(target), []);
  assert.strictEqual(systemFormats(target)[0][0], SYNTHETIC_NONCANONICAL_FORMAT);
});

test('P8B-NF-06_FOREIGN_SURFACES_BLOCK_NORMALIZATION_FAIL_CLOSED', () => {
  const scenarios = [
    (target, sheet) => { sheet.formulas[2][1] = '=1+1'; },
    (target, sheet) => { sheet.notes[2][1] = 'SYNTHETIC_FOREIGN_NOTE'; },
    (target, sheet) => { sheet.validations[2][1] = { synthetic: true }; },
    (target, sheet) => { sheet.mergedRanges.push(sheet.getRange(3, 1, 1, 2)); },
    (target, sheet) => { sheet.hiddenRowsByUser.add(3); },
    (target, sheet) => { sheet.backgrounds[2][1] = '#ff0000'; },
    (target, sheet) => { sheet.fontWeights[2][1] = 'bold'; },
    (target, sheet) => {
      target.spreadsheet.namedRanges.push({
        getRange: () => sheet.getRange(3, 1, 1, 1)
      });
    },
    (target, sheet) => sheet.rangeProtections.push({
      getDescription: () => 'SYNTHETIC_FOREIGN_PROTECTION',
      getRange: () => sheet.getRange(3, 1, 1, 1),
      isWarningOnly: () => false,
      canDomainEdit: () => false,
      canEdit: () => true,
      getEditors: () => [],
      getTargetAudiences: () => [],
      getUnprotectedRanges: () => []
    })
  ];
  scenarios.forEach((mutate) => {
    const target = environment();
    setSystemFormat(target, SYNTHETIC_NONCANONICAL_FORMAT);
    mutate(target, dashboardSheet(target));
    assertNoFormatRepair(target, () => sandbox.WorkOsDashboard
      .normalizeSystemBlockNumberFormatForSetup(target.spreadsheet));
  });
});

test('P8B-NF-07_EMPTY_OR_UNSEEDED_BLOCK_IS_NOT_A_REPAIR_TARGET', () => {
  const target = environment();
  const sheet = dashboardSheet(target);
  const start = sandbox.WorkOsConfig.DATA_START_ROW - 1;
  for (let row = 0; row < BLOCK_ROWS; row += 1) {
    for (let column = 0; column < BLOCK_COLUMNS; column += 1) {
      sheet.cells[start + row][column] = '';
      sheet.notes[start + row][column] = '';
      sheet.formats[start + row][column] = SYNTHETIC_NONCANONICAL_FORMAT;
    }
  }
  assertNoFormatRepair(target, () => sandbox.WorkOsDashboard
    .normalizeSystemBlockNumberFormatForSetup(target.spreadsheet));
});

test('P8B-NF-08_EXPLICIT_DASHBOARD_REFRESH_PRESERVES_CANONICAL_FORMAT', () => {
  const target = environment();
  const originalRuntimeSettings = sandbox.WorkOsRuntimeSettings;
  const originalFormatDate = sandbox.Utilities.formatDate;
  const headerOnly = (sheetName) => [
    Array.from(sandbox.WorkOsSchemas.getInternalIds(sheetName))
  ];
  resetFormatWrites(target);
  sandbox.WorkOsRuntimeSettings = {
    summarizeHealth: () => ({ status: 'SYNTHETIC_HEALTHY', note: '' })
  };
  sandbox.Utilities.formatDate = (value, timezone, format) =>
    format === 'yyyy-MM-dd'
      ? new Date(value).toISOString().slice(0, 10)
      : new Date(value).toISOString();
  try {
    const result = sandbox.WorkOsDashboard.refresh(target.spreadsheet, {
      budget: { isExhausted: () => false },
      task_matrix: headerOnly(sandbox.WorkOsConfig.SHEETS.TASKS),
      history_matrix: headerOnly(sandbox.WorkOsConfig.SHEETS.RUN_HISTORY),
      error_matrix: headerOnly(sandbox.WorkOsConfig.SHEETS.ERRORS),
      outbox_matrix: headerOnly(sandbox.WorkOsConfig.SHEETS.SYNC_STATE),
      quick_diagnostic: { status: 'WARN', checks: [] },
      automation_status: {
        status: 'CONSISTENT',
        prerequisites: { ready: true }
      },
      ai_readiness: { provider: '', ready: false }
    });
    assert.strictEqual(result.status, 'REFRESHED');
    assertCanonicalSystemFormat(target);
    assert.deepStrictEqual(formatWrites(target), []);
  } finally {
    sandbox.WorkOsRuntimeSettings = originalRuntimeSettings;
    sandbox.Utilities.formatDate = originalFormatDate;
  }
});

test('P8B-NF-09_SETUP_RESUME_NORMALIZES_BEFORE_S90_WITHOUT_DUPLICATION', () => {
  const target = environment();
  setSystemFormat(target, SYNTHETIC_NONCANONICAL_FORMAT);
  resetFormatWrites(target);
  const runtime = installCompletedResumeStubs(target);
  try {
    const result = sandbox.WorkOsSetup.executeSetup();
    assert.strictEqual(result.status, 'COMPLETE', JSON.stringify(result));
    assert.strictEqual(
      JSON.stringify(result.stage_results.map((item) => item.stage)),
      JSON.stringify(['S90_QUICK_DIAGNOSTIC', 'S99_COMPLETE'])
    );
    assertCanonicalSystemFormat(target);
    assert.strictEqual(formatWrites(target).length, 1);
    assert.strictEqual(runtime.resources.labels.created, 0);
    assert.strictEqual(runtime.resources.labels.deleted, 0);
    assert.strictEqual(runtime.resources.calendar.created, 0);
    assert.strictEqual(runtime.resources.calendar.deleted, 0);
    assert.strictEqual(runtime.resources.edit_trigger.created, 0);
    assert.strictEqual(runtime.resources.edit_trigger.deleted, 0);
    assert.strictEqual(runtime.resources.five_minute_trigger_created, 0);
    assert.strictEqual(sandbox.WorkOsConfig.AUTOMATION_ENABLED, false);
    assert.strictEqual(
      runtime.properties.getProperty(
        sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED
      ),
      'false'
    );
  } finally {
    runtime.restore();
  }
});

test('P8B-NF-10_FAKE_RUNTIME_MODELS_MATRIX_FORMAT_WRITE_SEPARATELY', () => {
  const target = environment();
  const range = dashboardSheet(target).getRange(3, 1, 1, 3);
  resetFormatWrites(target);
  range.setNumberFormats([[CANONICAL_FORMAT, CANONICAL_FORMAT, CANONICAL_FORMAT]]);
  assert.deepStrictEqual(formatWrites(target), [{
    operation: 'setNumberFormats',
    row: 3,
    column: 1,
    row_count: 1,
    column_count: 3
  }]);
  assert.strictEqual(
    JSON.stringify(range.getNumberFormats()),
    JSON.stringify([[
      CANONICAL_FORMAT,
      CANONICAL_FORMAT,
      CANONICAL_FORMAT
    ]])
  );
});

test('P8B-NF-11_FULL_VERSIONED_SYSTEM_STATE_NORMALIZES_WITHOUT_MARKERS', () => {
  const target = environment();
  const sheet = dashboardSheet(target);
  const start = sandbox.WorkOsConfig.DATA_START_ROW - 1;
  sandbox.WorkOsDashboard.METRIC_ORDER.forEach((key, rowOffset) => {
    sheet.cells[start + rowOffset] = [
      key,
      'SYNTHETIC_AGGREGATE',
      'SYNTHETIC_NOTE'
    ];
    sheet.notes[start + rowOffset] = ['', '', ''];
  });
  setSystemFormat(target, SYNTHETIC_NONCANONICAL_FORMAT);
  resetFormatWrites(target);
  const result = sandbox.WorkOsDashboard
    .normalizeSystemBlockNumberFormatForSetup(target.spreadsheet);
  assert.strictEqual(result.status, 'NORMALIZED');
  assert.strictEqual(result.layout_status, 'LEGACY_FULL');
  assertCanonicalSystemFormat(target);
  assert.strictEqual(formatWrites(target).length, 1);
});

test('P8B-NF-12_FORMAT_API_UNAVAILABLE_FAILS_CLOSED_WITHOUT_FALLBACK', () => {
  const target = environment();
  setSystemFormat(target, SYNTHETIC_NONCANONICAL_FORMAT);
  const original = fixture.FakeRange.prototype.setNumberFormat;
  fixture.FakeRange.prototype.setNumberFormat = undefined;
  try {
    assertNoFormatRepair(target, () => sandbox.WorkOsDashboard
      .normalizeSystemBlockNumberFormatForSetup(target.spreadsheet));
  } finally {
    fixture.FakeRange.prototype.setNumberFormat = original;
  }
});

const failed = tests.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({
  suite: 'phase8b_dashboard_number_format_real_runtime',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_google_workspace: 'NOT_EXECUTED',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
