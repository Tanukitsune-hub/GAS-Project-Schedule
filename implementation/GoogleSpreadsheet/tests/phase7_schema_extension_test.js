'use strict';

/**
 * Historical Error/Dead Letter schema compatibility tests.
 *
 * Schema 2.6 deliberately refuses the old pre-2.5 Task migration path.  This
 * suite keeps the former Error-extension cases as a compatibility firewall:
 * an older Task plus older Error sheet must be left byte-for-byte intact until
 * an explicit audited repair package is supplied.  It never contacts Google
 * Workspace or an external provider.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const phase5Path = path.resolve(__dirname, 'phase5_schema_extension_test.js');
const source = fs.readFileSync(phase5Path, 'utf8').replace(/\r\n/g, '\n');
const marker = '\nconst tests = [];\n';
const markerIndex = source.indexOf(marker);
if (markerIndex < 0) {
  throw new Error('PHASE5_SCHEMA_FIXTURE_MARKER_NOT_FOUND');
}
const exposure = `
globalThis.__phase7SchemaFixture = {
  fixture,
  sandbox,
  totalWrites,
  pre25Environment,
  workbookSnapshot,
  resetWriteCounts
};
`;
const context = {
  require,
  __dirname,
  __filename: phase5Path,
  console,
  process: { stdout: { write: () => {} }, exitCode: 0 },
  Buffer,
  structuredClone
};
vm.createContext(context);
vm.runInContext(source.slice(0, markerIndex) + exposure, context, {
  filename: 'phase5_schema_fixture.js'
});

const {
  sandbox,
  totalWrites,
  pre25Environment,
  workbookSnapshot,
  resetWriteCounts
} = context.__phase7SchemaFixture;
const errorName = sandbox.WorkOsConfig.SHEETS.ERRORS;
const currentErrorIds = Array.from(sandbox.WorkOsSchemas.getInternalIds(errorName));
const legacyErrorIds = currentErrorIds.slice(0, -11);

function setLegacyError(sheet, row, overrides = {}) {
  const record = {
    error_id: 'err_synthetic_phase7',
    status: 'DEAD',
    retry_requested: false,
    stage: 'AI_CALL',
    error_code: 'E_AI_RATE_LIMIT',
    error_summary: 'Synthetic safe summary.',
    source_message_id: `msgref_${'a'.repeat(64)}`,
    source_thread_id: 'synthetic-legacy-thread-id',
    task_id: '',
    retry_count: 3,
    next_retry_at: '',
    first_failed_at: new sandbox.Date('2026-07-24T00:00:00.000Z'),
    last_failed_at: new sandbox.Date('2026-07-24T00:03:00.000Z'),
    resolved_at: '',
    last_run_id: 'run_synthetic'
  };
  Object.assign(record, overrides);
  sheet.getRange(row, 1, 1, legacyErrorIds.length).setValues([
    legacyErrorIds.map((id) =>
      Object.prototype.hasOwnProperty.call(record, id) ? record[id] : ''
    )
  ]);
}

function legacyCompatibilityEnvironment(options = {}) {
  const state = pre25Environment();
  const errorSheet = state.environment.spreadsheet.getSheetByName(errorName);
  errorSheet.cells.forEach((row) => row.splice(legacyErrorIds.length, 11));
  if (errorSheet.notes) {
    errorSheet.notes.forEach((row) => row.splice(legacyErrorIds.length, 11));
  }
  errorSheet.maxColumns -= 11;
  if (options.withRow !== false) {
    setLegacyError(errorSheet, sandbox.WorkOsConfig.DATA_START_ROW, options.record || {});
  }
  resetWriteCounts(state.environment);
  return { ...state, errorSheet };
}

function rowRecord(sheet, row) {
  const ids = sheet.cells[0];
  return Object.fromEntries(ids.map((id, index) => [id, sheet.cells[row - 1][index]]));
}

function assertLegacyMigrationRejected(spreadsheet) {
  assert.throws(
    () => sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(spreadsheet),
    (error) => error.code === 'E_TASK_AUTHORITY_LEGACY_SCHEMA_UNSUPPORTED'
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
  }
}

test('P7-S01_PRE_2_5_TASK_AND_LEGACY_ERROR_SCHEMA_FAIL_CLOSED_WITHOUT_DATA_LOSS', () => {
  const state = legacyCompatibilityEnvironment();
  const before = workbookSnapshot(state.environment.spreadsheet);
  const errorBefore = rowRecord(state.errorSheet, sandbox.WorkOsConfig.DATA_START_ROW);
  assertLegacyMigrationRejected(state.environment.spreadsheet);
  assert.strictEqual(
    JSON.stringify(workbookSnapshot(state.environment.spreadsheet)),
    JSON.stringify(before)
  );
  assert.strictEqual(
    JSON.stringify(rowRecord(state.errorSheet, sandbox.WorkOsConfig.DATA_START_ROW)),
    JSON.stringify(errorBefore)
  );
  assert.strictEqual(state.errorSheet.getMaxColumns(), legacyErrorIds.length);
});

test('P7-S02_REPEATED_LEGACY_ATTEMPTS_ARE_IDEMPOTENT_FAIL_CLOSED', () => {
  const state = legacyCompatibilityEnvironment();
  const before = workbookSnapshot(state.environment.spreadsheet);
  const writes = totalWrites(state.environment.spreadsheet);
  assertLegacyMigrationRejected(state.environment.spreadsheet);
  assertLegacyMigrationRejected(state.environment.spreadsheet);
  assert.strictEqual(
    JSON.stringify(workbookSnapshot(state.environment.spreadsheet)),
    JSON.stringify(before)
  );
  assert.strictEqual(totalWrites(state.environment.spreadsheet), writes);
});

test('P7-S03_OPEN_LEGACY_ERROR_IS_NOT_BACKFILLED_WITH_A_FAKE_DEAD_LETTER_ID', () => {
  const state = legacyCompatibilityEnvironment({
    record: {
      status: 'OPEN',
      stage: 'CALENDAR_CREATE',
      error_code: 'E_CALENDAR_TRANSIENT',
      retry_count: 1
    }
  });
  const before = rowRecord(state.errorSheet, sandbox.WorkOsConfig.DATA_START_ROW);
  assertLegacyMigrationRejected(state.environment.spreadsheet);
  const after = rowRecord(state.errorSheet, sandbox.WorkOsConfig.DATA_START_ROW);
  assert.strictEqual(JSON.stringify(after), JSON.stringify(before));
  assert.strictEqual(Object.prototype.hasOwnProperty.call(after, 'dead_letter_id'), false);
  assert.strictEqual(after.status, 'OPEN');
  assert.strictEqual(after.retry_count, 1);
});

test('P7-S04_SOFT_BUDGET_CANNOT_BYPASS_THE_LEGACY_COMPATIBILITY_FIREWALL', () => {
  const state = legacyCompatibilityEnvironment();
  const before = workbookSnapshot(state.environment.spreadsheet);
  assert.throws(
    () => sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
      state.environment.spreadsheet,
      { isExhausted: () => true }
    ),
    (error) => error.code === 'E_TASK_AUTHORITY_LEGACY_SCHEMA_UNSUPPORTED'
  );
  assert.strictEqual(
    JSON.stringify(workbookSnapshot(state.environment.spreadsheet)),
    JSON.stringify(before)
  );
});

test('P7-S05_UNKNOWN_LEGACY_ERROR_SCHEMA_IS_NOT_MODIFIED', () => {
  const state = legacyCompatibilityEnvironment();
  state.errorSheet.cells[0][0] = 'unknown_error_id';
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

test('P7-S06_EMPTY_LEGACY_ERROR_SHEET_IS_NOT_EXTENDED_WITHOUT_AUDITED_TASK_REPAIR', () => {
  const state = legacyCompatibilityEnvironment({ withRow: false });
  const before = workbookSnapshot(state.environment.spreadsheet);
  assertLegacyMigrationRejected(state.environment.spreadsheet);
  assert.strictEqual(state.errorSheet.getMaxColumns(), legacyErrorIds.length);
  assert.strictEqual(
    state.errorSheet.cells.slice(2).some((row) => row.some((value) => value !== '')),
    false
  );
  assert.strictEqual(
    JSON.stringify(workbookSnapshot(state.environment.spreadsheet)),
    JSON.stringify(before)
  );
});

test('P7-S07_VERSION_METADATA_IS_INDEPENDENT_AND_CURRENT', () => {
  const versions = sandbox.WorkOsMigrations.getVersionState();
  assert.strictEqual(versions.code_version, '2.8.21-prepilot');
  assert.strictEqual(versions.schema_version, '2.6');
  assert.strictEqual(versions.migration_version, '3');
  assert.strictEqual(sandbox.WorkOsConfig.AI_SCHEMA_VERSION, '2.0');
  assert.strictEqual(sandbox.WorkOsConfig.AUTOMATION_ENABLED, false);
});

test('P7-S08_LEGACY_DEAD_ROW_REMAINS_UNTOUCHED_AND_NOT_MANUALLY_RETRYABLE', () => {
  const state = legacyCompatibilityEnvironment({
    record: {
      status: 'DEAD',
      error_code: 'E_GMAIL_FETCH',
      retry_count: 0,
      retry_requested: false
    }
  });
  const before = rowRecord(state.errorSheet, sandbox.WorkOsConfig.DATA_START_ROW);
  assertLegacyMigrationRejected(state.environment.spreadsheet);
  const after = rowRecord(state.errorSheet, sandbox.WorkOsConfig.DATA_START_ROW);
  assert.strictEqual(JSON.stringify(after), JSON.stringify(before));
  assert.strictEqual(after.status, 'DEAD');
  assert.strictEqual(after.retry_requested, false);
  assert.strictEqual(after.retry_count, 0);
});

const summary = {
  phase: 7,
  suite: 'legacy_error_schema_compatibility_firewall',
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
