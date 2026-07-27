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
    "  '07_AiAdapter.gs',\n  '08_TaskRepository.gs',\n" +
    "  '14_Migrations.gs'\n"
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

const schema24SnapshotFields = [
  'needs_review',
  'decision',
  'status',
  'completed',
  'excluded',
  'task_title',
  'due_date',
  'suggested_due_date',
  'deadline_basis',
  'priority',
  'waiting_for_reply',
  'calendar_sync_mode',
  'comment',
  'review_state',
  'review_type',
  'calendar_category',
  'calendar_importance',
  'manual_fields',
  'pending_action_type',
  'pending_changes_json'
];

function snapshotValue(column, value) {
  if (value === '' || value == null) {
    return '';
  }
  if (value instanceof sandbox.Date) {
    return value.toISOString();
  }
  if (column.enumName) {
    return sandbox.WorkOsSchemas.toInternalEnum(
      column.enumName,
      value
    );
  }
  if (column.type === 'JsonArray' ||
      column.type === 'JsonObject') {
    return JSON.parse(String(value));
  }
  return value;
}

function schema24Environment() {
  const state = legacyEnvironment();
  const taskSheet = state.environment.taskSheet;
  const schema = sandbox.WorkOsSchemas.getSheetSchema(
    sandbox.WorkOsConfig.SHEETS.TASKS
  );
  const ids = Array.from(sandbox.WorkOsSchemas.getInternalIds(
    sandbox.WorkOsConfig.SHEETS.TASKS
  ));
  const map = sandbox.WorkOsSchemas.buildColumnMapFromIds(ids);
  const row = taskSheet.cells[sandbox.WorkOsConfig.DATA_START_ROW - 1];
  const values = {};
  schema24SnapshotFields.forEach((id) => {
    values[id] = snapshotValue(schema[map[id]], row[map[id]]);
  });
  row[map.authoritative_snapshot_json] = JSON.stringify({
    schema_version: '2.4',
    task_id: row[map.task_id],
    values
  });
  taskSheet.cells.forEach((taskRow) => {
    taskRow.splice(taskRow.length - 3, 3);
  });
  taskSheet.maxColumns -= 3;
  taskSheet.writeCount = 0;
  return state;
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
  assert.strictEqual(result.updated_task_rows, 1);
  assert.strictEqual(result.updated_message_rows, 1);
  const taskSnapshotIndex =
    state.environment.taskSheet.cells[0].indexOf(
      'authoritative_snapshot_json'
    );
  assert.ok(taskSnapshotIndex >= 0);
  state.environment.taskSheet.cells.forEach((row, index) => {
    assert.strictEqual(
      JSON.stringify(row.slice(0, taskSnapshotIndex)),
      JSON.stringify(taskBefore[index].slice(0, taskSnapshotIndex))
    );
  });
  const taskSnapshot = JSON.parse(
    state.environment.taskSheet.cells[2][taskSnapshotIndex]
  );
  assert.strictEqual(
    taskSnapshot.schema_version,
    sandbox.WorkOsConfig.SCHEMA_VERSION
  );
  assert.strictEqual(
    taskSnapshot.task_id,
    state.environment.taskSheet.cells[2][
      state.environment.taskSheet.cells[0].indexOf('task_id')
    ]
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

test('P5-S02B_SCHEMA_2_2_ROW_UPGRADES_TO_2_4_WITHOUT_DATA_LOSS', () => {
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
    sandbox.WorkOsConfig.SCHEMA_VERSION
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
        return budgetChecks >= 10;
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

test('R3-02F_SCHEMA_2_4_TO_2_5_USES_SNAPSHOT_TRUST_ANCHOR', () => {
  const state = schema24Environment();
  const taskSheet = state.environment.taskSheet;
  const titleBefore = rowById(taskSheet, 'task_title');
  const commentBefore = rowById(taskSheet, 'comment');
  const taskIdBefore = rowById(taskSheet, 'task_id');

  const result = sandbox.WorkOsMigrations
    .ensureV2ExtensionsBeforeValidation(state.environment.spreadsheet);
  assert.strictEqual(result.status, 'UPDATED');
  assert.strictEqual(result.updated_task_rows, 1);
  assert.strictEqual(result.appended_columns, 4);
  assert.strictEqual(rowById(taskSheet, 'task_title'), titleBefore);
  assert.strictEqual(rowById(taskSheet, 'comment'), commentBefore);
  assert.strictEqual(rowById(taskSheet, 'task_id'), taskIdBefore);
  assert.strictEqual(rowById(taskSheet, 'business_version'), 1);
  assert.strictEqual(
    rowById(taskSheet, 'calendar_reconcile_required'),
    false
  );
  assert.strictEqual(rowById(taskSheet, 'calendar_intent_version'), 0);
  const snapshot = JSON.parse(
    rowById(taskSheet, 'authoritative_snapshot_json')
  );
  assert.strictEqual(snapshot.format, 'FULL_ROW_V1');
  assert.strictEqual(snapshot.schema_version, '2.5');
  assert.strictEqual(snapshot.task_id, taskIdBefore);
});

test('R3-02G_SCHEMA_2_4_DRIFT_FAILS_BEFORE_ANY_MUTATION', () => {
  const state = schema24Environment();
  const taskSheet = state.environment.taskSheet;
  const titleIndex = taskSheet.cells[0].indexOf('task_title');
  taskSheet.cells[sandbox.WorkOsConfig.DATA_START_ROW - 1][titleIndex] =
    'Schema 2.4 live drift';
  const beforeCells = state.environment.spreadsheet.getSheets()
    .map((sheet) => fixture.snapshotCells(sheet));
  const beforeWrites = totalWrites(state.environment.spreadsheet);
  assert.throws(
    () => sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
      state.environment.spreadsheet
    ),
    (error) => error.code === 'E_TASK_SNAPSHOT_INVALID'
  );
  assert.deepStrictEqual(
    state.environment.spreadsheet.getSheets()
      .map((sheet) => fixture.snapshotCells(sheet)),
    beforeCells
  );
  assert.strictEqual(totalWrites(state.environment.spreadsheet), beforeWrites);
});

test('R3-02I_SCHEMA_2_4_MANAGEMENT_STATE_IS_VALIDATED_SEPARATELY', () => {
  const state = schema24Environment();
  const taskSheet = state.environment.taskSheet;
  const originIndex = taskSheet.cells[0].indexOf('origin_key');
  taskSheet.cells[sandbox.WorkOsConfig.DATA_START_ROW - 1][originIndex] =
    'invalid-origin-key';
  const beforeCells = state.environment.spreadsheet.getSheets()
    .map((sheet) => fixture.snapshotCells(sheet));
  const beforeWrites = totalWrites(state.environment.spreadsheet);
  assert.throws(
    () => sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
      state.environment.spreadsheet
    ),
    (error) => error.code === 'E_TASK_VALIDATION'
  );
  assert.deepStrictEqual(
    state.environment.spreadsheet.getSheets()
      .map((sheet) => fixture.snapshotCells(sheet)),
    beforeCells
  );
  assert.strictEqual(totalWrites(state.environment.spreadsheet), beforeWrites);
});

test('R3-02H_TASK_MIGRATION_PAUSES_RESUMES_AND_IS_IDEMPOTENT', () => {
  const state = legacyEnvironment();
  const taskSheet = state.environment.taskSheet;
  const currentIds = Array.from(sandbox.WorkOsSchemas.getInternalIds(
    sandbox.WorkOsConfig.SHEETS.TASKS
  ));
  const sourceIds = currentIds.slice(0, -4);
  const taskCount = sandbox.WorkOsConfig.V2_EXTENSION_CHUNK_ROWS + 1;
  const requiredMaxRow =
    sandbox.WorkOsConfig.DATA_START_ROW + taskCount - 1;
  if (taskSheet.getMaxRows() < requiredMaxRow) {
    taskSheet.insertRowsAfter(
      taskSheet.getMaxRows(),
      requiredMaxRow - taskSheet.getMaxRows()
    );
  }
  const base = taskSheet.cells[
    sandbox.WorkOsConfig.DATA_START_ROW - 1
  ].slice(0, sourceIds.length);
  const taskIdIndex = sourceIds.indexOf('task_id');
  const originIndex = sourceIds.indexOf('origin_key');
  const titleIndex = sourceIds.indexOf('task_title');
  const rows = Array.from({ length: taskCount }, (_unused, index) => {
    const row = base.slice();
    const suffix = (index + 1).toString(16).padStart(32, '0');
    row[taskIdIndex] = `tsk_${suffix}`;
    row[originIndex] = `org_${suffix}`;
    row[titleIndex] = `Migration Task ${index + 1}`;
    return row;
  });
  taskSheet.getRange(
    sandbox.WorkOsConfig.DATA_START_ROW,
    1,
    taskCount,
    sourceIds.length
  ).setValues(rows);
  taskSheet.cells.forEach((row) => row.splice(row.length - 4, 4));
  taskSheet.maxColumns -= 4;
  taskSheet.writeCount = 0;

  let budgetChecks = 0;
  const paused = sandbox.WorkOsMigrations
    .ensureV2ExtensionsBeforeValidation(
      state.environment.spreadsheet,
      {
        isExhausted: () => {
          budgetChecks += 1;
          return budgetChecks >= 9;
        }
      }
    );
  assert.strictEqual(paused.status, 'PAUSED');
  assert.strictEqual(paused.appended_columns, 4);
  assert.strictEqual(
    paused.updated_task_rows,
    sandbox.WorkOsConfig.V2_EXTENSION_CHUNK_ROWS
  );
  assert.strictEqual(paused.remaining_task_rows, 1);

  const resumed = sandbox.WorkOsMigrations
    .ensureV2ExtensionsBeforeValidation(state.environment.spreadsheet);
  assert.strictEqual(resumed.status, 'UPDATED');
  assert.strictEqual(resumed.updated_task_rows, 1);
  const current = sandbox.WorkOsMigrations
    .ensureV2ExtensionsBeforeValidation(state.environment.spreadsheet);
  assert.strictEqual(current.status, 'CURRENT');
  assert.strictEqual(current.changed, false);
  const snapshotIndex = taskSheet.cells[0].indexOf(
    'authoritative_snapshot_json'
  );
  for (let index = 0; index < taskCount; index += 1) {
    const snapshot = JSON.parse(
      taskSheet.cells[
        sandbox.WorkOsConfig.DATA_START_ROW - 1 + index
      ][snapshotIndex]
    );
    assert.strictEqual(snapshot.schema_version, '2.5');
  }
});

function assertCurrentTaskSnapshotFailsClosed(mutator) {
  const state = legacyEnvironment();
  sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
    state.environment.spreadsheet
  );
  const taskSheet = state.environment.taskSheet;
  const snapshotIndex = taskSheet.cells[0].indexOf(
    'authoritative_snapshot_json'
  );
  assert.ok(snapshotIndex >= 0);
  mutator(taskSheet, snapshotIndex);
  const beforeCells = state.environment.spreadsheet.getSheets().map((sheet) =>
    fixture.snapshotCells(sheet)
  );
  const beforeWrites = totalWrites(state.environment.spreadsheet);
  assert.throws(
    () => sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
      state.environment.spreadsheet
    ),
    (error) =>
      error.code === 'E_TASK_SNAPSHOT_INVALID' ||
      error.code === 'E_V2_EXTENSION_STATE_INVALID'
  );
  assert.deepStrictEqual(
    state.environment.spreadsheet.getSheets().map((sheet) =>
      fixture.snapshotCells(sheet)
    ),
    beforeCells
  );
  assert.strictEqual(totalWrites(state.environment.spreadsheet), beforeWrites);
}

test('R3-02A_LIVE_BUSINESS_DRIFT_IS_NOT_SILENTLY_REBASELINED', () => {
  assertCurrentTaskSnapshotFailsClosed((taskSheet) => {
    const titleIndex = taskSheet.cells[0].indexOf('task_title');
    taskSheet.cells[2][titleIndex] = 'Untriggered raw drift';
  });
});

test('R3-02B_MISSING_CURRENT_SNAPSHOT_FAILS_CLOSED', () => {
  assertCurrentTaskSnapshotFailsClosed((taskSheet, snapshotIndex) => {
    taskSheet.cells[2][snapshotIndex] = '';
  });
});

test('R3-02C_MALFORMED_CURRENT_SNAPSHOT_FAILS_CLOSED', () => {
  assertCurrentTaskSnapshotFailsClosed((taskSheet, snapshotIndex) => {
    taskSheet.cells[2][snapshotIndex] = '{malformed';
  });
});

test('R3-02D_SNAPSHOT_TASK_ID_MISMATCH_FAILS_CLOSED', () => {
  assertCurrentTaskSnapshotFailsClosed((taskSheet, snapshotIndex) => {
    const snapshot = JSON.parse(taskSheet.cells[2][snapshotIndex]);
    snapshot.task_id = `tsk_${'f'.repeat(32)}`;
    taskSheet.cells[2][snapshotIndex] = JSON.stringify(snapshot);
  });
});

test('R3-02E_SNAPSHOT_SCHEMA_MISMATCH_FAILS_CLOSED', () => {
  assertCurrentTaskSnapshotFailsClosed((taskSheet, snapshotIndex) => {
    const snapshot = JSON.parse(taskSheet.cells[2][snapshotIndex]);
    snapshot.schema_version = '0.0';
    taskSheet.cells[2][snapshotIndex] = JSON.stringify(snapshot);
  });
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
