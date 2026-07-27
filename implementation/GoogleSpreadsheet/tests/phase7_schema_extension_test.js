'use strict';

/**
 * Phase 7 v2.1 -> v2.2 append-only Error/Dead Letter schema tests.
 *
 * The suite reuses the established in-memory Spreadsheet fixture. It never
 * contacts Google Workspace or an external provider.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const phase5Path = path.resolve(__dirname, 'phase5_schema_extension_test.js');
const source = fs.readFileSync(phase5Path, 'utf8');
const marker = '\nconst tests = [];\n';
const markerIndex = source.indexOf(marker);
if (markerIndex < 0) {
  throw new Error('PHASE5_SCHEMA_FIXTURE_MARKER_NOT_FOUND');
}
const exposure = `
globalThis.__phase7SchemaFixture = {
  fixture,
  sandbox,
  totalWrites
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

const { fixture, sandbox, totalWrites } = context.__phase7SchemaFixture;
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

function legacyEnvironment(options = {}) {
  const environment = fixture.makeCompletedPhase4Environment();
  const messageSheet = environment.spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE
  );
  const errorSheet = environment.spreadsheet.getSheetByName(errorName);

  // The reusable baseline fixture deliberately represents pre-Phase-5
  // Message State. Complete that recognized v2 extension first so this suite
  // isolates the Phase 7 Error extension.
  sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    environment.spreadsheet
  );

  errorSheet.cells.forEach((row) => row.splice(legacyErrorIds.length, 11));
  errorSheet.maxColumns -= 11;
  if (options.withRow !== false) {
    setLegacyError(errorSheet, 3, options.record || {});
  }
  environment.spreadsheet.getSheets().forEach((sheet) => {
    sheet.writeCount = 0;
  });
  return { environment, messageSheet, errorSheet };
}

function rowRecord(sheet, row) {
  const ids = sheet.cells[0];
  return Object.fromEntries(ids.map((id, index) => [id, sheet.cells[row - 1][index]]));
}

function snapshot(spreadsheet) {
  return spreadsheet.getSheets().map((sheet) => fixture.snapshotCells(sheet));
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

test('P7-S01_ERROR_EXTENSION_APPENDS_EXACT_FIELDS_AND_PRESERVES_LEGACY_DATA', () => {
  const state = legacyEnvironment();
  const before = rowRecord(state.errorSheet, 3);
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(result.status, 'UPDATED');
  assert.strictEqual(result.appended_columns, 11);
  assert.strictEqual(result.updated_error_rows, 1);
  assert.strictEqual(
    JSON.stringify(state.errorSheet.cells[0]),
    JSON.stringify(currentErrorIds)
  );
  const after = rowRecord(state.errorSheet, 3);
  legacyErrorIds
    .filter((id) => id !== 'source_thread_id')
    .forEach((id) => assert.deepStrictEqual(after[id], before[id]));
  assert.match(after.source_thread_id, /^thrref_[0-9a-f]{64}$/);
  assert.notStrictEqual(after.source_thread_id, before.source_thread_id);
  [
    'dead_letter_id', 'subsystem', 'error_category', 'safe_reference',
    'message_state_id', 'resume_stage', 'attempt_count', 'last_attempt_at',
    'next_action', 'created_at', 'updated_at'
  ].forEach((id) => assert.notStrictEqual(after[id], undefined));
  assert.match(after.dead_letter_id, /^dl_[0-9a-f]{32}$/);
  assert.strictEqual(after.subsystem, 'AI_REQUEST');
  assert.strictEqual(after.error_category, 'TRANSIENT');
  assert.strictEqual(after.resume_stage, 'PREPROCESSED');
  assert.strictEqual(after.attempt_count, 4);
});

test('P7-S02_SECOND_EXTENSION_RUN_IS_STRICT_NO_OP', () => {
  const state = legacyEnvironment();
  sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  const before = snapshot(state.environment.spreadsheet);
  const writes = totalWrites(state.environment.spreadsheet);
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(result.status, 'CURRENT');
  assert.strictEqual(result.changed, false);
  assert.deepStrictEqual(snapshot(state.environment.spreadsheet), before);
  assert.strictEqual(totalWrites(state.environment.spreadsheet), writes);
});

test('P7-S03_OPEN_ERROR_IS_BACKFILLED_WITHOUT_FAKE_DEAD_LETTER_ID', () => {
  const state = legacyEnvironment({
    record: {
      status: 'OPEN',
      stage: 'CALENDAR_CREATE',
      error_code: 'E_CALENDAR_TRANSIENT',
      retry_count: 1
    }
  });
  sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  const record = rowRecord(state.errorSheet, 3);
  assert.strictEqual(record.dead_letter_id, '');
  assert.strictEqual(record.subsystem, 'CALENDAR_CREATE');
  assert.strictEqual(record.resume_stage, 'CALENDAR_PENDING');
  assert.strictEqual(record.next_action, 'WAIT_FOR_AUTOMATIC_RETRY');
});

test('P7-S04_SOFT_BUDGET_PAUSES_BEFORE_ERROR_SCHEMA_MUTATION', () => {
  const state = legacyEnvironment();
  const before = snapshot(state.environment.spreadsheet);
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet,
    { isExhausted: () => true }
  );
  assert.strictEqual(result.status, 'PAUSED');
  assert.strictEqual(result.changed, false);
  assert.deepStrictEqual(snapshot(state.environment.spreadsheet), before);
});

test('P7-S05_UNKNOWN_SCHEMA_IS_NOT_MODIFIED', () => {
  const state = legacyEnvironment();
  state.errorSheet.cells[0][0] = 'unknown_error_id';
  const before = snapshot(state.environment.spreadsheet);
  const writes = totalWrites(state.environment.spreadsheet);
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(result.status, 'NOT_APPLICABLE');
  assert.strictEqual(result.changed, false);
  assert.deepStrictEqual(snapshot(state.environment.spreadsheet), before);
  assert.strictEqual(totalWrites(state.environment.spreadsheet), writes);
});

test('P7-S06_EMPTY_LEGACY_ERROR_SHEET_EXTENDS_WITHOUT_CREATING_DATA', () => {
  const state = legacyEnvironment({ withRow: false });
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(result.status, 'UPDATED');
  assert.strictEqual(result.appended_columns, 11);
  assert.strictEqual(result.updated_error_rows, 0);
  assert.strictEqual(
    JSON.stringify(state.errorSheet.cells[0]),
    JSON.stringify(currentErrorIds)
  );
  assert.strictEqual(
    state.errorSheet.cells.slice(2).some((row) => row.some((value) => value !== '')),
    false
  );
});

test('P7-S07_VERSION_METADATA_IS_INDEPENDENT_AND_CURRENT', () => {
  const versions = sandbox.WorkOsMigrations.getVersionState();
  assert.strictEqual(versions.code_version, '2.8.2-prepilot');
  assert.strictEqual(versions.schema_version, '2.3');
  assert.strictEqual(versions.migration_version, '0');
});

test('P7-S08_LEGACY_DEAD_WITHOUT_EXHAUSTED_RETRIES_IS_NOT_MANUALLY_RETRYABLE', () => {
  const state = legacyEnvironment({
    record: {
      status: 'DEAD',
      error_code: 'E_GMAIL_FETCH',
      retry_count: 0
    }
  });
  sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  const record = rowRecord(state.errorSheet, 3);
  assert.strictEqual(record.error_category, 'TRANSIENT');
  assert.strictEqual(record.next_action, 'RESOLVE_CONFIGURATION_OR_DATA');
});

const summary = {
  phase: 7,
  suite: 'v2_2_error_schema_extension',
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

