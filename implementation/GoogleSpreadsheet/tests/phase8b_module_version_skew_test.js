'use strict';

/**
 * Phase 8B S90 module-contract regression.
 *
 * This suite uses a synthetic in-memory Apps Script facade. It performs no
 * Google Workspace, OAuth, Gmail, Calendar, trigger, deployment, or provider
 * operation.
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
const marker = '\nconst tests = [];\n';
const fixtureEnd = quickSuiteSource.lastIndexOf(marker);
if (fixtureEnd < 0) {
  throw new Error('PHASE8B_MODULE_SKEW_FIXTURE_MARKER_NOT_FOUND');
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
  quickSuiteSource.slice(0, fixtureEnd) + `
globalThis.__phase8bModuleSkewFixture = {
  sandbox,
  FakeRange: fixture.FakeRange,
  buildCanonicalEnvironment,
  dashboardSheet
};`,
  fixtureContext,
  { filename: 'phase8b_module_version_skew_fixture.js' }
);

const fixture = fixtureContext.__phase8bModuleSkewFixture;
const sandbox = fixture.sandbox;
const BLOCK_ROWS = sandbox.WorkOsDashboard.METRIC_ORDER.length;
const BLOCK_COLUMNS = 3;
const SYNTHETIC_NONCANONICAL_FORMAT = 'SYNTHETIC_NONCANONICAL_FORMAT';

const originalSetNumberFormat = fixture.FakeRange.prototype.setNumberFormat;
fixture.FakeRange.prototype.setNumberFormat = function (format) {
  this.sheet.moduleSkewFormatWrites =
    Number(this.sheet.moduleSkewFormatWrites || 0) + 1;
  return originalSetNumberFormat.call(this, format);
};
const originalFlush = sandbox.SpreadsheetApp.flush;
let moduleSkewFlushCount = 0;
sandbox.SpreadsheetApp.flush = function () {
  moduleSkewFlushCount += 1;
  return originalFlush();
};

function environment() {
  const target = fixture.buildCanonicalEnvironment();
  const sheet = fixture.dashboardSheet(target);
  sheet.moduleSkewFormatWrites = 0;
  moduleSkewFlushCount = 0;
  sandbox.SpreadsheetApp.getActiveSpreadsheet = () => target.spreadsheet;
  return target;
}

function setSystemFormat(target, value) {
  const sheet = fixture.dashboardSheet(target);
  const start = sandbox.WorkOsConfig.DATA_START_ROW - 1;
  for (let row = 0; row < BLOCK_ROWS; row += 1) {
    for (let column = 0; column < BLOCK_COLUMNS; column += 1) {
      sheet.formats[start + row][column] = value;
    }
  }
}

function formatWriteCount(target) {
  return Number(fixture.dashboardSheet(target).moduleSkewFormatWrites || 0);
}

function assertSkew(callback) {
  let captured;
  assert.throws(callback, (error) => {
    captured = error;
    return error && error.code === 'E_MODULE_VERSION_SKEW';
  });
  assert.strictEqual(captured.module_contract_status, 'MISMATCH');
  assert.ok(!/[a-f0-9]{40,64}/i.test(String(captured.safeMessage || '')));
  return captured;
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

test('P8B-MS-01_THREE_MODULES_EXPOSE_ONE_INDEPENDENT_CONTRACT', () => {
  assert.strictEqual(
    sandbox.WorkOsConfig.S90_MODULE_CONTRACT_ID,
    'WORK_OS_V2_S90_CONTRACT_2_8_10'
  );
  assert.strictEqual(
    sandbox.WorkOsSetup.MODULE_CONTRACT_ID,
    sandbox.WorkOsConfig.S90_MODULE_CONTRACT_ID
  );
  assert.strictEqual(
    sandbox.WorkOsDashboard.MODULE_CONTRACT_ID,
    sandbox.WorkOsConfig.S90_MODULE_CONTRACT_ID
  );
});

test('P8B-MS-02_STALE_CONFIG_FAILS_BEFORE_DASHBOARD_WRITE', () => {
  const target = environment();
  setSystemFormat(target, SYNTHETIC_NONCANONICAL_FORMAT);
  const originalConfig = sandbox.WorkOsConfig;
  sandbox.WorkOsConfig = Object.freeze(Object.assign({}, originalConfig, {
    S90_MODULE_CONTRACT_ID: 'WORK_OS_V2_S90_CONTRACT_STALE'
  }));
  try {
    assertSkew(() => sandbox.WorkOsDashboard
      .normalizeSystemBlockNumberFormatForSetup(target.spreadsheet));
    assert.strictEqual(formatWriteCount(target), 0);
    assert.strictEqual(moduleSkewFlushCount, 0);
  } finally {
    sandbox.WorkOsConfig = originalConfig;
  }
});

test('P8B-MS-03_STALE_SETUP_FAILS_DASHBOARD_GUARD_BEFORE_WRITE', () => {
  const target = environment();
  setSystemFormat(target, SYNTHETIC_NONCANONICAL_FORMAT);
  const originalSetup = sandbox.WorkOsSetup;
  sandbox.WorkOsSetup = Object.freeze(Object.assign({}, originalSetup, {
    MODULE_CONTRACT_ID: 'WORK_OS_V2_S90_CONTRACT_STALE'
  }));
  try {
    assertSkew(() => sandbox.WorkOsDashboard
      .normalizeSystemBlockNumberFormatForSetup(target.spreadsheet));
    assert.strictEqual(formatWriteCount(target), 0);
    assert.strictEqual(moduleSkewFlushCount, 0);
  } finally {
    sandbox.WorkOsSetup = originalSetup;
  }
});

test('P8B-MS-04_STALE_DASHBOARD_FAILS_SETUP_GUARD_BEFORE_CALL', () => {
  const target = environment();
  setSystemFormat(target, SYNTHETIC_NONCANONICAL_FORMAT);
  const originalDashboard = sandbox.WorkOsDashboard;
  let normalizerCalls = 0;
  sandbox.WorkOsDashboard = Object.freeze(Object.assign({}, originalDashboard, {
    MODULE_CONTRACT_ID: 'WORK_OS_V2_S90_CONTRACT_STALE',
    normalizeSystemBlockNumberFormatForSetup: () => {
      normalizerCalls += 1;
      return { status: 'NORMALIZED' };
    }
  }));
  try {
    assertSkew(() => sandbox.WorkOsSetup
      .runStageForTest('S90_QUICK_DIAGNOSTIC'));
    assert.strictEqual(normalizerCalls, 0);
    assert.strictEqual(formatWriteCount(target), 0);
    assert.strictEqual(moduleSkewFlushCount, 0);
  } finally {
    sandbox.WorkOsDashboard = originalDashboard;
  }
});

test('P8B-MS-05_ALIGNED_MODULES_COMPLETE_S90_WITH_SAFE_EVIDENCE', () => {
  const target = environment();
  setSystemFormat(target, SYNTHETIC_NONCANONICAL_FORMAT);
  const result = sandbox.WorkOsSetup
    .runStageForTest('S90_QUICK_DIAGNOSTIC');
  assert.ok(['PASS', 'WARN'].includes(result.status));
  assert.strictEqual(result.module_contract_status, 'ALIGNED');
  assert.strictEqual(
    result.dashboard_number_format_normalization.normalization_status,
    'NORMALIZED'
  );
  assert.strictEqual(
    result.dashboard_number_format_normalization.checked_cell_count,
    BLOCK_ROWS * BLOCK_COLUMNS
  );
  assert.strictEqual(
    result.dashboard_number_format_normalization.postcondition_verified,
    true
  );
  assert.strictEqual(formatWriteCount(target), 1);
  assert.strictEqual(moduleSkewFlushCount, 1);
});

const failed = tests.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({
  suite: 'phase8b_module_version_skew',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_google_workspace: 'NOT_EXECUTED',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
