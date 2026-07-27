'use strict';

/**
 * Round 3 remediation regression tests.
 *
 * This suite reuses the Phase 3 in-memory Apps Script fixture. It performs no
 * Google Workspace or network I/O.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const phase3Path = path.resolve(__dirname, 'phase3_local_test.js');
const phase3Source = fs.readFileSync(phase3Path, 'utf8');
const fixtureMarker = '\nconst tests = [];\n';
const fixtureIndex = phase3Source.indexOf(fixtureMarker);
if (fixtureIndex < 0) {
  throw new Error('PHASE3_FIXTURE_MARKER_NOT_FOUND');
}

const exposure = `
globalThis.__round3Fixture = {
  sandbox,
  FakeSheet,
  FakeSpreadsheet,
  makeSchemaSheet,
  makeOperationalSpreadsheet,
  taskSheet,
  insertTaskFixture,
  setTaskCell,
  taskRow,
  readTask,
  reviewNote,
  applyDecisionWithResult,
  columnMap,
  isoDate,
  setLockAvailable(value) {
    lockAvailable = value;
  },
  setLockAvailabilitySequence(values) {
    lockAvailabilitySequence = Array.from(values || []);
  },
  resetLockState() {
    lockAvailable = true;
    globalLockHeld = false;
    lockAttemptCount = 0;
    lockAvailabilitySequence = null;
  }
};
`;
const context = {
  require,
  __dirname,
  __filename: phase3Path,
  console,
  process: { stdout: { write: () => {} }, exitCode: 0 },
  Buffer,
  structuredClone
};
vm.createContext(context);
vm.runInContext(
  phase3Source.slice(0, fixtureIndex) + exposure,
  context,
  { filename: 'phase3_round3_fixture.js' }
);

const fixture = context.__round3Fixture;
const sandbox = fixture.sandbox;
const taskSheetName = sandbox.WorkOsConfig.SHEETS.TASKS;
const syncSheetName = sandbox.WorkOsConfig.SHEETS.SYNC_STATE;

function rowValues(sheet, row) {
  return sheet.getRange(row, 1, 1, sheet.getMaxColumns()).getValues()[0];
}

function exactRowJson(sheet, row) {
  return JSON.stringify(rowValues(sheet, row));
}

function rangeForIds(sheet, row, rowCount, firstId, lastId = firstId) {
  const map = fixture.columnMap(taskSheetName);
  const first = Math.min(map[firstId], map[lastId]);
  const last = Math.max(map[firstId], map[lastId]);
  return sheet.getRange(row, first + 1, rowCount, last - first + 1);
}

function handleRange(range) {
  return sandbox.WorkOsEditHandler.handle({ range });
}

function assertManagementFieldRestored(fieldId, replacement) {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const task = fixture.insertTaskFixture(sheet, {
    source: `round3-management-${fieldId}`,
    task_title: `Round 3 ${fieldId}`
  });
  const row = fixture.taskRow(sheet, task.task_id);
  const before = exactRowJson(sheet, row);
  const outbox = spreadsheet.getSheetByName(syncSheetName);
  const outboxBefore = JSON.stringify(outbox.cells);
  fixture.setTaskCell(sheet, row, fieldId, replacement);

  const result = handleRange(rangeForIds(sheet, row, 1, fieldId));

  assert.strictEqual(result.status, 'REJECTED');
  assert.strictEqual(result.reason, 'MANAGEMENT_COLUMN_EDIT');
  assert.strictEqual(exactRowJson(sheet, row), before);
  assert.strictEqual(JSON.stringify(outbox.cells), outboxBefore);
}

function stageDueDateReview(sheet, taskId, suffix = 'default') {
  sandbox.WorkOsTaskRepository.withLockedContext(sheet, (taskContext) => {
    sandbox.WorkOsTaskRepository.stagePendingChange(
      taskId,
      'UPDATE_DUE',
      {
        origin_key: `round3-review-${suffix}`,
        changes: {
          due_date: '2026-08-05',
          deadline_basis: 'EXPLICIT',
          suggested_due_date: ''
        },
        ai_provenance: sandbox.WorkOsAiAdapter.getMetadata(
          new sandbox.WorkOsAiAdapter.MockAiAdapter()
        )
      },
      taskContext
    );
  });
}

function outboxLogicalRows(sheet) {
  return sheet.cells.slice(sandbox.WorkOsConfig.DATA_START_ROW - 1)
    .filter((row) => String(row[0] || '') || String(row[1] || ''));
}

function outboxActions(sheet) {
  const ids = sandbox.WorkOsSchemas.getInternalIds(syncSheetName);
  const actionIndex = Array.from(ids).indexOf('desired_action');
  return outboxLogicalRows(sheet).map((row) => row[actionIndex]);
}

const tests = [];
function test(id, body) {
  const startedAt = Date.now();
  fixture.resetLockState();
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
    fixture.resetLockState();
  }
}

test('R3-01A_MANAGEMENT_TASK_ID_RESTORES_COMPLETE_ROW', () => {
  assertManagementFieldRestored(
    'task_id',
    `tsk_${'f'.repeat(32)}`
  );
});

test('R3-01B_MANAGEMENT_ORIGIN_KEY_RESTORES_COMPLETE_ROW', () => {
  assertManagementFieldRestored(
    'origin_key',
    `org_${'e'.repeat(32)}`
  );
});

test('R3-01C_MANAGEMENT_ROW_VERSION_RESTORES_COMPLETE_ROW', () => {
  assertManagementFieldRestored('row_version', 999);
});

test('R3-01D_MANAGEMENT_SNAPSHOT_RESTORES_COMPLETE_ROW', () => {
  assertManagementFieldRestored(
    'authoritative_snapshot_json',
    '{"schema_version":"tampered"}'
  );
});

test('R3-01E_MANAGEMENT_CALENDAR_METADATA_RESTORES_COMPLETE_ROW', () => {
  assertManagementFieldRestored('calendar_sync_status', 'ERROR');
});

test('R3-01F_BUSINESS_AND_MANAGEMENT_MIXED_PASTE_REJECTS_WHOLE_EVENT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round3-mixed-single',
    task_title: 'Before mixed edit'
  });
  const row = fixture.taskRow(sheet, task.task_id);
  const before = exactRowJson(sheet, row);
  fixture.setTaskCell(sheet, row, 'task_title', 'After mixed edit');
  fixture.setTaskCell(sheet, row, 'row_version', 500);

  const result = handleRange(
    rangeForIds(sheet, row, 1, 'task_title', 'row_version')
  );

  assert.strictEqual(result.status, 'REJECTED');
  assert.strictEqual(result.reason, 'MANAGEMENT_COLUMN_EDIT');
  assert.strictEqual(exactRowJson(sheet, row), before);
});

test('R3-01G_MULTI_ROW_MIXED_PASTE_RESTORES_EVERY_ROW', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const first = fixture.insertTaskFixture(sheet, {
    source: 'round3-mixed-row-a',
    task_title: 'Before A'
  });
  const second = fixture.insertTaskFixture(sheet, {
    source: 'round3-mixed-row-b',
    task_title: 'Before B'
  });
  const firstRow = fixture.taskRow(sheet, first.task_id);
  const secondRow = fixture.taskRow(sheet, second.task_id);
  assert.strictEqual(secondRow, firstRow + 1);
  const before = [
    exactRowJson(sheet, firstRow),
    exactRowJson(sheet, secondRow)
  ];
  [
    [firstRow, 'After A', 700],
    [secondRow, 'After B', 800]
  ].forEach(([row, title, version]) => {
    fixture.setTaskCell(sheet, row, 'task_title', title);
    fixture.setTaskCell(sheet, row, 'row_version', version);
  });

  const result = handleRange(
    rangeForIds(sheet, firstRow, 2, 'task_title', 'row_version')
  );

  assert.strictEqual(result.status, 'REJECTED');
  assert.strictEqual(result.reason, 'MANAGEMENT_COLUMN_EDIT');
  assert.deepStrictEqual(
    [
      exactRowJson(sheet, firstRow),
      exactRowJson(sheet, secondRow)
    ],
    before
  );
});

test('R3-01H_OVER_20_ROW_PASTE_RESTORES_WITHOUT_PARTIAL_WRITE', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const rows = [];
  for (let index = 0; index < 21; index += 1) {
    const task = fixture.insertTaskFixture(sheet, {
      source: `round3-over-limit-${index}`,
      task_title: `Before ${index}`
    });
    rows.push(fixture.taskRow(sheet, task.task_id));
  }
  const before = rows.map((row) => exactRowJson(sheet, row));
  rows.forEach((row, index) => {
    fixture.setTaskCell(sheet, row, 'task_title', `After ${index}`);
  });

  const result = handleRange(
    rangeForIds(sheet, rows[0], rows.length, 'task_title')
  );

  assert.strictEqual(result.status, 'REJECTED');
  assert.strictEqual(result.reason, 'E_EDIT_RANGE_LIMIT');
  assert.deepStrictEqual(
    rows.map((row) => exactRowJson(sheet, row)),
    before
  );
});

test('R3-01I_BLANK_ROW_MANAGEMENT_PASTE_IS_CLEARED', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const row = sandbox.WorkOsConfig.DATA_START_ROW;
  fixture.setTaskCell(sheet, row, 'task_id', `tsk_${'d'.repeat(32)}`);
  fixture.setTaskCell(sheet, row, 'task_title', 'Illicit direct row');

  const result = handleRange(
    rangeForIds(sheet, row, 1, 'task_title', 'task_id')
  );

  assert.strictEqual(result.status, 'REJECTED');
  assert.strictEqual(
    rowValues(sheet, row).every((value) => value === ''),
    true
  );
});

test('R3-01J_CORRUPT_TRUSTED_ROW_CAUSES_NO_PARTIAL_BATCH_WRITE', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const first = fixture.insertTaskFixture(sheet, {
    source: 'round3-corrupt-batch-a'
  });
  const second = fixture.insertTaskFixture(sheet, {
    source: 'round3-corrupt-batch-b'
  });
  const firstRow = fixture.taskRow(sheet, first.task_id);
  const secondRow = fixture.taskRow(sheet, second.task_id);
  fixture.setTaskCell(sheet, firstRow, 'row_version', 700);
  fixture.setTaskCell(sheet, secondRow, 'row_version', 800);
  const snapshotColumn = fixture.columnMap(taskSheetName)
    .authoritative_snapshot_json + 1;
  sheet.getRange(secondRow, snapshotColumn, 1, 1)
    .setNote('CORRUPT_TRUSTED_MIRROR');
  const firstTampered = exactRowJson(sheet, firstRow);
  const secondTampered = exactRowJson(sheet, secondRow);

  assert.throws(
    () => handleRange(
      rangeForIds(sheet, firstRow, 2, 'row_version')
    ),
    (error) => error.code === 'E_TASK_SNAPSHOT_INVALID'
  );
  assert.strictEqual(exactRowJson(sheet, firstRow), firstTampered);
  assert.strictEqual(exactRowJson(sheet, secondRow), secondTampered);
});

test('R3-01K_SOURCE_AI_AND_INTENT_MANAGEMENT_FIELDS_RESTORE', () => {
  [
    ['source_message_id', 'tampered-source-message'],
    ['source_thread_id', 'tampered-source-thread'],
    ['ai_provider', 'TAMPERED_PROVIDER'],
    ['ai_model', 'TAMPERED_MODEL'],
    ['business_version', 99],
    ['calendar_reconcile_required', true],
    ['calendar_intent_version', 99],
    [
      'last_calendar_sync_at',
      new sandbox.Date('2030-01-01T00:00:00.000Z')
    ]
  ].forEach(([field, replacement]) => {
    assertManagementFieldRestored(field, replacement);
  });
});

test('R3-03A_CALENDAR_METADATA_DRIFT_DOES_NOT_BLOCK_ACCEPT', () => {
  const sheet = fixture.makeSchemaSheet(taskSheetName);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round3-calendar-metadata',
    due_date: '2026-08-01',
    deadline_basis: 'EXPLICIT'
  });
  stageDueDateReview(sheet, task.task_id, 'calendar-metadata');
  sandbox.WorkOsTaskRepository.withLockedContext(sheet, (taskContext) => {
    sandbox.WorkOsTaskRepository.applyCalendarPatch(
      task.task_id,
      { calendar_sync_status: 'PENDING' },
      taskContext,
      new sandbox.Date('2026-07-27T04:00:00.000Z')
    );
  });

  const accepted = fixture.applyDecisionWithResult(
    sheet,
    task.task_id,
    'ACCEPT'
  );
  assert.strictEqual(accepted.result.operation, 'UPDATE');
  assert.strictEqual(fixture.isoDate(accepted.task.due_date), '2026-08-05');
  assert.strictEqual(accepted.task.review_state, 'APPLIED');
});

test('R3-03B_SYNC_TIMESTAMP_DRIFT_DOES_NOT_BLOCK_ACCEPT', () => {
  const sheet = fixture.makeSchemaSheet(taskSheetName);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round3-calendar-timestamp',
    due_date: '2026-08-01',
    deadline_basis: 'EXPLICIT'
  });
  stageDueDateReview(sheet, task.task_id, 'calendar-timestamp');
  sandbox.WorkOsTaskRepository.withLockedContext(sheet, (taskContext) => {
    sandbox.WorkOsTaskRepository.applyCalendarPatch(
      task.task_id,
      {
        calendar_sync_status: 'SYNCED',
        last_calendar_sync_at:
          new sandbox.Date('2026-07-27T04:01:00.000Z')
      },
      taskContext,
      new sandbox.Date('2026-07-27T04:01:00.000Z')
    );
  });

  const accepted = fixture.applyDecisionWithResult(
    sheet,
    task.task_id,
    'ACCEPT'
  );
  assert.strictEqual(accepted.result.operation, 'UPDATE');
  assert.strictEqual(fixture.isoDate(accepted.task.due_date), '2026-08-05');
});

test('R3-03C_HUMAN_BUSINESS_DRIFT_STILL_REJECTS_ACCEPT', () => {
  const sheet = fixture.makeSchemaSheet(taskSheetName);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round3-human-drift',
    due_date: '2026-08-01',
    deadline_basis: 'EXPLICIT'
  });
  stageDueDateReview(sheet, task.task_id, 'human-drift');
  const row = fixture.taskRow(sheet, task.task_id);
  fixture.setTaskCell(
    sheet,
    row,
    'due_date',
    new sandbox.Date('2026-08-10T00:00:00.000Z')
  );
  sandbox.WorkOsTaskRepository.applyUserEdits(
    sheet,
    [{ row, column_ids: ['due_date'] }],
    new sandbox.Date('2026-07-27T04:02:00.000Z')
  );

  const rejected = fixture.applyDecisionWithResult(
    sheet,
    task.task_id,
    'ACCEPT'
  );
  assert.strictEqual(rejected.result.operation, 'REJECTED');
  assert.strictEqual(rejected.result.error_code, 'REVIEW_SAME_ROW_CONFLICT');
  assert.strictEqual(rejected.task.decision, 'NONE');
  assert.strictEqual(fixture.isoDate(rejected.task.due_date), '2026-08-10');
});

test('R3-04A_MISSING_OUTBOX_RETAINS_DURABLE_INTENT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  spreadsheet.sheets = spreadsheet.sheets.filter(
    (sheet) => sheet.getName() !== syncSheetName
  );
  const sheet = fixture.taskSheet(spreadsheet);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round3-missing-outbox',
    task_title: 'Before missing Outbox'
  });
  const row = fixture.taskRow(sheet, task.task_id);
  fixture.setTaskCell(sheet, row, 'task_title', 'After missing Outbox');

  assert.throws(
    () => handleRange(rangeForIds(sheet, row, 1, 'task_title')),
    (error) => error.code === 'E_CALENDAR_OUTBOX_MISSING'
  );
  const after = fixture.readTask(sheet, task.task_id);
  assert.strictEqual(after.task_title, 'After missing Outbox');
  assert.strictEqual(after.calendar_reconcile_required, true);
  assert.ok(after.calendar_intent_version >= 1);
});

test('R3-04B_NOOP_RETRY_RECOVERS_UNRESOLVED_INTENT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const syncSheet = spreadsheet.getSheetByName(syncSheetName);
  spreadsheet.sheets = spreadsheet.sheets.filter(
    (sheet) => sheet !== syncSheet
  );
  const sheet = fixture.taskSheet(spreadsheet);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round3-noop-recovery',
    task_title: 'Before recovery',
    due_date: '2026-08-01',
    deadline_basis: 'EXPLICIT',
    calendar_sync_mode: 'FORCE'
  });
  const row = fixture.taskRow(sheet, task.task_id);
  fixture.setTaskCell(sheet, row, 'task_title', 'After recovery');
  assert.throws(
    () => handleRange(rangeForIds(sheet, row, 1, 'task_title')),
    (error) => error.code === 'E_CALENDAR_OUTBOX_MISSING'
  );
  spreadsheet.sheets.push(syncSheet);
  syncSheet.parent = spreadsheet;

  const result = handleRange(rangeForIds(sheet, row, 1, 'task_title'));
  const after = fixture.readTask(sheet, task.task_id);
  assert.strictEqual(result.results[0].operation, 'NOOP');
  assert.strictEqual(result.calendar_outbox.inspected_count, 1);
  assert.strictEqual(after.calendar_reconcile_required, false);
  assert.strictEqual(outboxLogicalRows(syncSheet).length, 1);
});

test('R3-04C_DUPLICATE_RECOVERY_IS_IDEMPOTENT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const syncSheet = spreadsheet.getSheetByName(syncSheetName);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round3-duplicate-recovery',
    due_date: '2026-08-01',
    deadline_basis: 'EXPLICIT'
  });
  const row = fixture.taskRow(sheet, task.task_id);
  fixture.setTaskCell(sheet, row, 'task_title', 'Changed once');
  handleRange(rangeForIds(sheet, row, 1, 'task_title'));
  const firstRows = outboxLogicalRows(syncSheet).length;

  const first = sandbox.WorkOsEditHandler.recoverPendingCalendarIntents({
    spreadsheet
  });
  const second = sandbox.WorkOsEditHandler.recoverPendingCalendarIntents({
    spreadsheet
  });

  assert.strictEqual(first.pending_intent_count, 0);
  assert.strictEqual(second.pending_intent_count, 0);
  assert.strictEqual(outboxLogicalRows(syncSheet).length, firstRows);
});

test('R3-04D_OUTBOX_APPEND_FAILURE_RETAINS_AND_RECOVERS_INTENT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const syncSheet = spreadsheet.getSheetByName(syncSheetName);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round3-outbox-append-failure',
    due_date: '2026-08-01',
    deadline_basis: 'EXPLICIT',
    calendar_sync_mode: 'FORCE'
  });
  const row = fixture.taskRow(sheet, task.task_id);
  fixture.setTaskCell(sheet, row, 'task_title', 'Append must fail once');
  const originalGetRange = syncSheet.getRange.bind(syncSheet);
  let injected = false;
  syncSheet.getRange = (...args) => {
    const range = originalGetRange(...args);
    if (!injected &&
        Number(args[0]) >= sandbox.WorkOsConfig.DATA_START_ROW) {
      range.setValues = () => {
        injected = true;
        throw new Error('SYNTHETIC_OUTBOX_APPEND_FAILURE');
      };
    }
    return range;
  };
  assert.throws(
    () => handleRange(rangeForIds(sheet, row, 1, 'task_title')),
    /SYNTHETIC_OUTBOX_APPEND_FAILURE/
  );
  syncSheet.getRange = originalGetRange;
  assert.strictEqual(
    fixture.readTask(sheet, task.task_id).calendar_reconcile_required,
    true
  );

  const recovered = sandbox.WorkOsEditHandler
    .recoverPendingCalendarIntents({ spreadsheet });
  assert.strictEqual(recovered.inspected_count, 1);
  assert.strictEqual(
    fixture.readTask(sheet, task.task_id).calendar_reconcile_required,
    false
  );
  assert.strictEqual(
    JSON.stringify(outboxActions(syncSheet)),
    JSON.stringify(['CREATE'])
  );
});

test('R3-04E_LOCK_TIMEOUT_AFTER_TASK_COMMIT_RETAINS_INTENT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round3-lock-timeout',
    due_date: '2026-08-01',
    deadline_basis: 'EXPLICIT',
    calendar_sync_mode: 'FORCE'
  });
  const row = fixture.taskRow(sheet, task.task_id);
  fixture.setTaskCell(sheet, row, 'task_title', 'Committed before timeout');
  fixture.setLockAvailabilitySequence([true, true, false]);

  assert.throws(
    () => handleRange(rangeForIds(sheet, row, 1, 'task_title')),
    (error) => error.code === 'E_LOCK_TIMEOUT'
  );
  const afterFailure = fixture.readTask(sheet, task.task_id);
  assert.strictEqual(afterFailure.task_title, 'Committed before timeout');
  assert.strictEqual(afterFailure.calendar_reconcile_required, true);

  fixture.resetLockState();
  const recovered = sandbox.WorkOsEditHandler
    .recoverPendingCalendarIntents({ spreadsheet });
  assert.strictEqual(recovered.inspected_count, 1);
  assert.strictEqual(
    fixture.readTask(sheet, task.task_id).calendar_reconcile_required,
    false
  );
});

test('R3-04F_CRASH_AFTER_ENQUEUE_IS_IDEMPOTENT_ON_RECOVERY', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const syncSheet = spreadsheet.getSheetByName(syncSheetName);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round3-after-enqueue-crash',
    due_date: '2026-08-01',
    deadline_basis: 'EXPLICIT',
    calendar_sync_mode: 'FORCE'
  });
  const row = fixture.taskRow(sheet, task.task_id);
  fixture.setTaskCell(sheet, row, 'task_title', 'Crash after enqueue');
  const originalGetRange = sheet.getRange.bind(sheet);
  let injected = false;
  sheet.getRange = (...args) => {
    const range = originalGetRange(...args);
    if (Number(args[0]) === row &&
        Number(args[1]) === 1 &&
        Number(args[3]) === sheet.getMaxColumns()) {
      const originalSetValues = range.setValues.bind(range);
      range.setValues = (values) => {
        if (!injected && outboxLogicalRows(syncSheet).length > 0) {
          injected = true;
          throw new Error('SYNTHETIC_AFTER_ENQUEUE_CRASH');
        }
        return originalSetValues(values);
      };
    }
    return range;
  };
  assert.throws(
    () => handleRange(rangeForIds(sheet, row, 1, 'task_title')),
    /SYNTHETIC_AFTER_ENQUEUE_CRASH/
  );
  sheet.getRange = originalGetRange;
  assert.strictEqual(outboxLogicalRows(syncSheet).length, 1);
  assert.strictEqual(
    fixture.readTask(sheet, task.task_id).calendar_reconcile_required,
    true
  );

  sandbox.WorkOsEditHandler.recoverPendingCalendarIntents({
    spreadsheet
  });
  sandbox.WorkOsEditHandler.recoverPendingCalendarIntents({
    spreadsheet
  });
  assert.strictEqual(outboxLogicalRows(syncSheet).length, 1);
  assert.strictEqual(
    fixture.readTask(sheet, task.task_id).calendar_reconcile_required,
    false
  );
});

test('R3-04G_CREATE_UPDATE_DELETE_AND_NOOP_INTENTS', () => {
  function runCase(action, taskFields, prepare, fieldId, cellValue) {
    const spreadsheet = fixture.makeOperationalSpreadsheet();
    const sheet = fixture.taskSheet(spreadsheet);
    const syncSheet = spreadsheet.getSheetByName(syncSheetName);
    const task = fixture.insertTaskFixture(
      sheet,
      Object.assign({
        source: `round3-intent-${action}`,
        task_title: `Before ${action}`
      }, taskFields)
    );
    if (prepare) {
      prepare(sheet, task);
    }
    const row = fixture.taskRow(sheet, task.task_id);
    fixture.setTaskCell(sheet, row, fieldId, cellValue);
    const result = handleRange(rangeForIds(sheet, row, 1, fieldId));
    return {
      result,
      task: fixture.readTask(sheet, task.task_id),
      actions: outboxActions(syncSheet)
    };
  }

  const eligible = {
    due_date: '2026-08-01',
    deadline_basis: 'EXPLICIT',
    calendar_sync_mode: 'FORCE'
  };
  const create = runCase(
    'CREATE',
    eligible,
    null,
    'task_title',
    'Create edited'
  );
  assert.strictEqual(
    JSON.stringify(create.actions),
    JSON.stringify(['CREATE'])
  );

  function addOwnedEvent(sheet, task) {
    sandbox.WorkOsTaskRepository.withLockedContext(
      sheet,
      (context) => sandbox.WorkOsTaskRepository.applyCalendarPatch(
        task.task_id,
        {
          calendar_event_id: 'synthetic-owned-event',
          calendar_sync_status: 'SYNCED'
        },
        context,
        new sandbox.Date('2026-07-27T05:00:00.000Z')
      )
    );
  }
  const update = runCase(
    'UPDATE',
    eligible,
    addOwnedEvent,
    'task_title',
    'Update edited'
  );
  assert.strictEqual(
    JSON.stringify(update.actions),
    JSON.stringify(['UPDATE'])
  );

  const cancelledCell = sandbox.WorkOsSchemas.toSheetEnum(
    'TaskStatus',
    'CANCELLED'
  );
  const remove = runCase(
    'DELETE',
    eligible,
    addOwnedEvent,
    'status',
    cancelledCell
  );
  assert.strictEqual(
    JSON.stringify(remove.actions),
    JSON.stringify(['DELETE'])
  );

  const noop = runCase(
    'NOOP',
    {},
    null,
    'task_title',
    'Noop edited'
  );
  assert.strictEqual(JSON.stringify(noop.actions), JSON.stringify([]));
  assert.strictEqual(noop.result.calendar_outbox.noop_count, 1);
  [create, update, remove, noop].forEach((item) => {
    assert.strictEqual(item.task.calendar_reconcile_required, false);
  });
});

test('R3-05A_RESTAGE_RANGE_API_REJECTS_MULTI_ROW_SELECTION', () => {
  assert.strictEqual(
    typeof sandbox.WorkOsEditHandler.restageSelectedReviewRange,
    'function'
  );
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  assert.throws(
    () => sandbox.WorkOsEditHandler.restageSelectedReviewRange(
      sheet.getRange(3, 1, 2, 1)
    ),
    (error) => error.code === 'REVIEW_RESTAGE_SELECTION'
  );
});

test('R3-05B_RESTAGE_REFRESHES_GUARD_AND_ACCEPTS_ONCE', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round3-restage-success',
    due_date: '2026-08-01',
    deadline_basis: 'EXPLICIT'
  });
  stageDueDateReview(sheet, task.task_id, 'restage-success');
  const row = fixture.taskRow(sheet, task.task_id);
  fixture.setTaskCell(
    sheet,
    row,
    'priority',
    sandbox.WorkOsSchemas.toSheetEnum('Priority', 'HIGH')
  );
  sandbox.WorkOsTaskRepository.applyUserEdits(
    sheet,
    [{ row, column_ids: ['priority'] }],
    new sandbox.Date('2026-07-27T05:10:00.000Z')
  );
  const beforeRestage = fixture.applyDecisionWithResult(
    sheet,
    task.task_id,
    'ACCEPT'
  );
  assert.strictEqual(beforeRestage.result.operation, 'REJECTED');
  assert.strictEqual(
    beforeRestage.result.error_code,
    'REVIEW_SAME_ROW_CONFLICT'
  );

  const range = sheet.getRange(row, 1, 1, 1);
  const restaged = sandbox.WorkOsEditHandler.restageSelectedReviewRange(
    range,
    new sandbox.Date('2026-07-27T05:11:00.000Z')
  );
  assert.strictEqual(restaged.operation, 'UPDATE');
  const accepted = fixture.applyDecisionWithResult(
    sheet,
    task.task_id,
    'ACCEPT'
  );
  assert.strictEqual(accepted.result.operation, 'UPDATE');
  assert.strictEqual(fixture.isoDate(accepted.task.due_date), '2026-08-05');
  assert.strictEqual(accepted.task.priority, 'HIGH');
});

test('R3-05C_RESTAGE_REJECTS_NON_OPEN_REVIEW', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round3-restage-closed'
  });
  const row = fixture.taskRow(sheet, task.task_id);
  assert.throws(
    () => sandbox.WorkOsEditHandler.restageSelectedReviewRange(
      sheet.getRange(row, 1, 1, 1)
    ),
    (error) => error.code === 'REVIEW_RESTAGE_NOT_AVAILABLE'
  );
});

test('R3-05D_MENU_EXPOSES_EXPLICIT_RESTAGE_WITH_CONFIRMATION', () => {
  const menuSource = fs.readFileSync(
    path.join(path.resolve(__dirname, '..'), 'apps-script-v2', 'Menu.gs'),
    'utf8'
  );
  assert.ok(menuSource.includes('選択したReviewを再stage'));
  assert.ok(menuSource.includes('menuRestageSelectedReview'));
  assert.ok(menuSource.includes('ButtonSet.OK_CANCEL'));
});

const failed = tests.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({
  suite: 'remediation_round3',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_google_workspace: 'NOT_EXECUTED',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
}, null, 2)}\n`);
if (failed.length) {
  process.exitCode = 1;
}
