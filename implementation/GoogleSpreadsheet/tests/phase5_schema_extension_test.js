'use strict';

/**
 * Phase 5 v2.0 -> v2.1 append-only schema extension tests.
 *
 * This reuses the completed-v2 in-memory fixture used by the baseline upgrade
 * suite. No real Spreadsheet, Lock service, or external API is contacted.
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
    "  '07_AiAdapter.gs',\n  '14_Migrations.gs'\n"
);
const reportMarker = '\nconst summary = {\n';
const reportIndex = baselineSource.lastIndexOf(reportMarker);
if (reportIndex < 0) {
  throw new Error('BASELINE_FIXTURE_REPORT_MARKER_NOT_FOUND');
}
const exposure = `
globalThis.__phase5SchemaFixture = {
  sandbox,
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

fixture.FakeSheet.prototype.insertColumnsAfter = function (afterColumn, count) {
  assert.strictEqual(afterColumn, this.maxColumns);
  for (let index = 0; index < count; index += 1) {
    this.cells.forEach((row) => row.push(''));
  }
  this.maxColumns += count;
  this.writeCount += 1;
  return this;
};

function validClassification() {
  const input = {
    schema_version: sandbox.WorkOsConfig.AI_SCHEMA_VERSION,
    message: {
      message_id: 'synthetic-schema-message',
      thread_id: 'synthetic-schema-thread',
      stable_thread_key: 'root:synthetic-schema-thread',
      subject: '[MOCK:INFORMATION_ONLY] Synthetic schema extension',
      sender: 'fixture@example.invalid',
      received_at: '2026-07-24T00:00:00.000Z',
      plain_body: 'Synthetic body used only for an in-memory test.',
      prior_messages: []
    },
    active_tasks: [],
    context: {
      today: '2026-07-24',
      timezone: sandbox.WorkOsConfig.TIMEZONE
    },
    constraints: {
      max_actions: sandbox.WorkOsConfig.MAX_AI_ACTIONS,
      no_attachment_analysis: true,
      no_email_send: true
    }
  };
  return new sandbox.WorkOsAiAdapter.MockAiAdapter().classify(input);
}

function legacyEnvironment(options = {}) {
  const environment = fixture.makeCompletedPhase4Environment();
  const messageSheet = environment.spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE
  );
  const classification = validClassification();
  fixture.setRecord(
    messageSheet,
    sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE,
    3,
    {
      message_id: 'synthetic-schema-message',
      thread_id: 'synthetic-schema-thread',
      stable_thread_key: 'root:synthetic-schema-thread',
      received_at: new sandbox.Date('2026-07-24T00:00:00.000Z'),
      discovered_at: new sandbox.Date('2026-07-24T00:01:00.000Z'),
      source_mode: 'MANUAL',
      processing_status: 'CLASSIFIED',
      resume_stage: 'TASK_WRITE',
      classification_json: JSON.stringify(classification),
      classification_hash: options.invalid_hash
        ? '0'.repeat(64)
        : sandbox.WorkOsAiAdapter.legacyClassificationHash(classification),
      action_count: classification.actions.length,
      retry_count: 0,
      schema_version: '2.0',
      updated_at: new sandbox.Date('2026-07-24T00:02:00.000Z')
    }
  );
  messageSheet.cells.forEach((row) => row.pop());
  messageSheet.maxColumns -= 1;
  messageSheet.writeCount = 0;
  return { environment, messageSheet, classification };
}

function rowById(sheet, internalId) {
  const ids = sheet.cells[0];
  return sheet.cells[2][ids.indexOf(internalId)];
}

function totalWrites(spreadsheet) {
  return spreadsheet.getSheets().reduce(
    (sum, sheet) => sum + sheet.writeCount,
    0
  );
}

function populateLegacyClassifications(state, messageCount) {
  const legacyIds = Array.from(sandbox.WorkOsSchemas.getInternalIds(
    sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE
  )).slice(0, -1);
  const requiredMaxRow = sandbox.WorkOsConfig.DATA_START_ROW + messageCount - 1;
  if (state.messageSheet.getMaxRows() < requiredMaxRow) {
    state.messageSheet.insertRowsAfter(
      state.messageSheet.getMaxRows(),
      requiredMaxRow - state.messageSheet.getMaxRows()
    );
  }
  const classificationText = JSON.stringify(state.classification);
  const legacyHash = sandbox.WorkOsAiAdapter.legacyClassificationHash(
    state.classification
  );
  const values = Array.from({ length: messageCount }, (_unused, index) => {
    const sequence = String(index + 1).padStart(5, '0');
    const record = {
      message_id: `synthetic-schema-message-${sequence}`,
      thread_id: `synthetic-schema-thread-${sequence}`,
      stable_thread_key: `root:synthetic-schema-thread-${sequence}`,
      received_at: new sandbox.Date('2026-07-24T00:00:00.000Z'),
      discovered_at: new sandbox.Date('2026-07-24T00:01:00.000Z'),
      source_mode: 'MANUAL',
      processing_status: 'CLASSIFIED',
      resume_stage: 'TASK_WRITE',
      classification_json: classificationText,
      classification_hash: legacyHash,
      action_count: state.classification.actions.length,
      retry_count: 0,
      schema_version: '2.0',
      updated_at: new sandbox.Date('2026-07-24T00:02:00.000Z')
    };
    return legacyIds.map((id) =>
      Object.prototype.hasOwnProperty.call(record, id) ? record[id] : ''
    );
  });
  state.messageSheet.getRange(
    sandbox.WorkOsConfig.DATA_START_ROW,
    1,
    messageCount,
    legacyIds.length
  ).setValues(values);
  state.messageSheet.writeCount = 0;
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

test('P5-S01_LEGACY_V2_EXTENSION_IS_APPEND_ONLY_AND_PRESERVES_DATA', () => {
  const state = legacyEnvironment();
  const taskBefore = fixture.snapshotCells(state.environment.taskSheet);
  const settingsBefore = fixture.snapshotCells(state.environment.settingsSheet);
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(result.status, 'UPDATED');
  assert.strictEqual(result.appended_columns, 1);
  assert.strictEqual(result.updated_message_rows, 1);
  assert.strictEqual(
    JSON.stringify(state.environment.taskSheet.cells),
    JSON.stringify(taskBefore)
  );
  assert.strictEqual(
    JSON.stringify(state.environment.settingsSheet.cells),
    JSON.stringify(settingsBefore)
  );

  const ids = Array.from(sandbox.WorkOsSchemas.getInternalIds(
    sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE
  ));
  assert.strictEqual(JSON.stringify(state.messageSheet.cells[0]), JSON.stringify(ids));
  assert.strictEqual(
    rowById(state.messageSheet, 'schema_version'),
    sandbox.WorkOsConfig.SCHEMA_VERSION
  );
  const provenance = JSON.parse(
    rowById(state.messageSheet, 'classification_provenance_json')
  );
  assert.strictEqual(
    JSON.stringify(provenance),
    JSON.stringify(sandbox.WorkOsAiAdapter.getMetadata(null))
  );
  assert.strictEqual(
    rowById(state.messageSheet, 'classification_hash'),
    sandbox.WorkOsAiAdapter.classificationHash(
      state.classification,
      provenance
    )
  );
});

test('P5-S02_SECOND_EXTENSION_RUN_IS_STRICT_NO_OP', () => {
  const state = legacyEnvironment();
  sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  const beforeCells = state.environment.spreadsheet.getSheets().map((sheet) =>
    fixture.snapshotCells(sheet)
  );
  const beforeWrites = totalWrites(state.environment.spreadsheet);
  const second = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(second.status, 'CURRENT');
  assert.strictEqual(second.changed, false);
  assert.deepStrictEqual(
    state.environment.spreadsheet.getSheets().map((sheet) =>
      fixture.snapshotCells(sheet)
    ),
    beforeCells
  );
  assert.strictEqual(
    totalWrites(state.environment.spreadsheet),
    beforeWrites
  );
});

test('P5-S02B_SCHEMA_2_2_ROW_UPGRADES_TO_2_3_WITHOUT_DATA_LOSS', () => {
  const state = legacyEnvironment();
  sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  const schemaIndex = state.messageSheet.cells[0].indexOf('schema_version');
  state.messageSheet.cells[
    sandbox.WorkOsConfig.DATA_START_ROW - 1
  ][schemaIndex] = '2.2';
  const classificationBefore = rowById(
    state.messageSheet,
    'classification_json'
  );
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(result.status, 'UPDATED');
  assert.strictEqual(result.updated_message_rows, 1);
  assert.strictEqual(
    rowById(state.messageSheet, 'schema_version'),
    '2.3'
  );
  assert.strictEqual(
    rowById(state.messageSheet, 'classification_json'),
    classificationBefore
  );
});

test('P5-S03_CORRUPT_CHECKPOINT_STOPS_BEFORE_ANY_MUTATION', () => {
  const state = legacyEnvironment({ invalid_hash: true });
  const beforeCells = state.environment.spreadsheet.getSheets().map((sheet) =>
    fixture.snapshotCells(sheet)
  );
  const beforeWidth = state.messageSheet.maxColumns;
  assert.throws(
    () => sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
      state.environment.spreadsheet
    ),
    (error) => error.code === 'E_V2_EXTENSION_STATE_INVALID'
  );
  assert.strictEqual(state.messageSheet.maxColumns, beforeWidth);
  assert.deepStrictEqual(
    state.environment.spreadsheet.getSheets().map((sheet) =>
      fixture.snapshotCells(sheet)
    ),
    beforeCells
  );
});

test('P5-S04_UNKNOWN_SCHEMA_IS_NOT_MODIFIED', () => {
  const environment = fixture.makeCompletedPhase4Environment();
  const taskSheet = environment.taskSheet;
  taskSheet.cells[0][0] = 'unknown_internal_id';
  const beforeCells = environment.spreadsheet.getSheets().map((sheet) =>
    fixture.snapshotCells(sheet)
  );
  const beforeWrites = totalWrites(environment.spreadsheet);
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    environment.spreadsheet
  );
  assert.strictEqual(result.status, 'NOT_APPLICABLE');
  assert.strictEqual(result.changed, false);
  assert.deepStrictEqual(
    environment.spreadsheet.getSheets().map((sheet) =>
      fixture.snapshotCells(sheet)
    ),
    beforeCells
  );
  assert.strictEqual(totalWrites(environment.spreadsheet), beforeWrites);
});

test('P5-S05_SOFT_BUDGET_PAUSES_BEFORE_MUTATION', () => {
  const state = legacyEnvironment();
  const beforeCells = state.environment.spreadsheet.getSheets().map((sheet) =>
    fixture.snapshotCells(sheet)
  );
  const beforeWidth = state.messageSheet.maxColumns;
  const result = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet,
    { isExhausted: () => true }
  );
  assert.strictEqual(result.status, 'PAUSED');
  assert.strictEqual(result.changed, false);
  assert.strictEqual(state.messageSheet.maxColumns, beforeWidth);
  assert.deepStrictEqual(
    state.environment.spreadsheet.getSheets().map((sheet) =>
      fixture.snapshotCells(sheet)
    ),
    beforeCells
  );
});

test('P5-S06_EXTENSION_CAP_STOPS_BEFORE_MUTATION', () => {
  const state = legacyEnvironment();
  const requiredMaxRows =
    sandbox.WorkOsConfig.DATA_START_ROW - 1 +
    sandbox.WorkOsConfig.V2_EXTENSION_MAX_ROWS + 1;
  state.messageSheet.insertRowsAfter(
    state.messageSheet.getMaxRows(),
    requiredMaxRows - state.messageSheet.getMaxRows()
  );
  const beforeWidth = state.messageSheet.maxColumns;
  const beforeWrites = totalWrites(state.environment.spreadsheet);
  assert.throws(
    () => sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
      state.environment.spreadsheet
    ),
    (error) => error.code === 'E_V2_EXTENSION_TOO_LARGE'
  );
  assert.strictEqual(state.messageSheet.maxColumns, beforeWidth);
  assert.strictEqual(totalWrites(state.environment.spreadsheet), beforeWrites);
});

test('P5-S07_MULTI_CHUNK_PARTIAL_WRITE_RESUMES_TO_CURRENT', () => {
  const state = legacyEnvironment();
  const messageCount = sandbox.WorkOsConfig.V2_EXTENSION_CHUNK_ROWS + 1;
  populateLegacyClassifications(state, messageCount);
  let budgetChecks = 0;
  const first = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet,
    {
      isExhausted: () => {
        budgetChecks += 1;
        return budgetChecks >= 5;
      }
    }
  );
  assert.strictEqual(first.status, 'PAUSED');
  assert.strictEqual(first.changed, true);
  assert.strictEqual(first.appended_columns, 1);
  assert.strictEqual(
    first.updated_message_rows,
    sandbox.WorkOsConfig.V2_EXTENSION_CHUNK_ROWS
  );
  assert.strictEqual(first.remaining_message_rows, 1);

  const resumed = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(resumed.status, 'UPDATED');
  assert.strictEqual(resumed.appended_columns, 0);
  assert.strictEqual(resumed.updated_message_rows, 1);

  const current = sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  assert.strictEqual(current.status, 'CURRENT');
  assert.strictEqual(current.changed, false);
  const schemaIndex = state.messageSheet.cells[0].indexOf('schema_version');
  const provenanceIndex = state.messageSheet.cells[0].indexOf(
    'classification_provenance_json'
  );
  for (let index = 0; index < messageCount; index += 1) {
    const row = state.messageSheet.cells[
      sandbox.WorkOsConfig.DATA_START_ROW - 1 + index
    ];
    assert.strictEqual(row[schemaIndex], sandbox.WorkOsConfig.SCHEMA_VERSION);
    assert.notStrictEqual(row[provenanceIndex], '');
  }
});

const summary = {
  phase: 5,
  suite: 'v2_schema_extension',
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

