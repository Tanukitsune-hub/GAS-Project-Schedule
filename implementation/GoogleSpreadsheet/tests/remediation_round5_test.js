'use strict';

/*
 * Round 5 independent re-audit regression tests. These tests intentionally
 * reuse only the local Phase 3 in-memory Apps Script fixture; no Google
 * Workspace, Calendar, browser, network, or credential operation is run.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const appsRoot = path.join(root, 'apps-script-v2');
const phase3Path = path.resolve(__dirname, 'phase3_local_test.js');
const phase3Source = fs.readFileSync(phase3Path, 'utf8').replace(/\r\n/g, '\n');
const marker = '\nconst tests = [];\n';
const markerIndex = phase3Source.indexOf(marker);
if (markerIndex < 0) throw new Error('PHASE3_FIXTURE_MARKER_NOT_FOUND');

const exposure = `
globalThis.__round5Fixture = {
  sandbox, FakeSheet, FakeSpreadsheet, makeOperationalSpreadsheet,
  taskSheet, insertTaskFixture, setTaskCell, taskRow, readTask, columnMap,
  applyMarker,
  resetLockState() {
    lockAvailable = true;
    globalLockHeld = false;
    lockAttemptCount = 0;
    lockAvailabilitySequence = null;
    scriptProperties.clear();
  }
};
`;
const host = {
  require, __dirname, __filename: phase3Path, console,
  process: { stdout: { write: () => {} }, exitCode: 0 }, Buffer,
  structuredClone
};
vm.createContext(host);
vm.runInContext(phase3Source.slice(0, markerIndex) + exposure, host, {
  filename: 'phase3_round5_fixture.js'
});

const fixture = host.__round5Fixture;
const sandbox = fixture.sandbox;
const taskName = sandbox.WorkOsConfig.SHEETS.TASKS;
const ledgerName = sandbox.WorkOsConfig.SHEETS.TASK_AUTHORITY_LEDGER;
const syncName = sandbox.WorkOsConfig.SHEETS.SYNC_STATE;
const taskSchema = sandbox.WorkOsSchemas.getSheetSchema(taskName);
const ledgerSchema = sandbox.WorkOsSchemas.getSheetSchema(ledgerName);
const taskMap = fixture.columnMap(taskName);
const ledgerMap = fixture.columnMap(ledgerName);

function rowValues(sheet, row) {
  return sheet.getRange(row, 1, 1, sheet.getMaxColumns()).getValues()[0];
}

function ledger(sheet) {
  const result = sheet.getParent().getSheetByName(ledgerName);
  assert.ok(result, 'Task Authority Ledger must be present');
  return result;
}

function ledgerEntry(sheet, taskId) {
  const target = ledger(sheet);
  for (let row = sandbox.WorkOsConfig.DATA_START_ROW;
       row <= target.getMaxRows(); row += 1) {
    const values = rowValues(target, row);
    if (String(values[ledgerMap.task_id] || '') !== String(taskId)) continue;
    return {
      row,
      record: Object.fromEntries(
        ledgerSchema.map((column, index) => [column.id, values[index]])
      )
    };
  }
  return null;
}

function ledgerEntryAtPhysicalRow(sheet, physicalRow) {
  const target = ledger(sheet);
  for (let row = sandbox.WorkOsConfig.DATA_START_ROW;
       row <= target.getMaxRows(); row += 1) {
    const values = rowValues(target, row);
    if (Number(values[ledgerMap.physical_row_hint]) !== Number(physicalRow)) {
      continue;
    }
    return {
      row,
      record: Object.fromEntries(
        ledgerSchema.map((column, index) => [column.id, values[index]])
      )
    };
  }
  return null;
}

function ledgerEntries(sheet, predicate) {
  const target = ledger(sheet);
  const entries = [];
  for (let row = sandbox.WorkOsConfig.DATA_START_ROW;
       row <= target.getMaxRows(); row += 1) {
    const values = rowValues(target, row);
    const record = Object.fromEntries(
      ledgerSchema.map((column, index) => [column.id, values[index]])
    );
    if (predicate(record, row)) entries.push({ row, record });
  }
  return entries;
}

function writeLedgerRecord(sheet, entry) {
  ledger(sheet).getRange(entry.row, 1, 1, ledgerSchema.length).setValues([[
    ...ledgerSchema.map((column) => entry.record[column.id])
  ]]);
}

function clearLedgerEntry(sheet, taskId) {
  const entry = ledgerEntry(sheet, taskId);
  assert.ok(entry, `missing ledger record for ${taskId}`);
  ledger(sheet).getRange(entry.row, 1, 1, ledgerSchema.length)
    .setValues([new Array(ledgerSchema.length).fill('')]);
}

function authority(sheet, row) {
  return sandbox.WorkOsTaskRepository.validateAuthority(rowValues(sheet, row), {
    sheet,
    physical_row: row,
    schema: taskSchema,
    column_map: taskMap,
    mode: 'ROUND5_FAULT_TEST'
  });
}

function commit(sheet, row, candidate, mode) {
  return sandbox.WorkOsTaskRepository.commitAuthorityRow(sheet, row, candidate, {
    schema: taskSchema,
    column_map: taskMap,
    mode: mode || 'ROUND5_TEST'
  });
}

const tests = [];
function test(id, body) {
  const started = Date.now();
  fixture.resetLockState();
  try {
    body();
    tests.push({ id, status: 'PASS', duration_ms: Date.now() - started });
  } catch (error) {
    tests.push({
      id,
      status: 'FAIL',
      duration_ms: Date.now() - started,
      safe_message: sandbox.WorkOsUtilities.redact(
        error && error.message || String(error)
      )
    });
  } finally {
    fixture.resetLockState();
  }
}

test('R5-01_CANONICAL_HASH_SORTS_KEYS_AND_EXCLUDES_SELF_FIELDS', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round5-hash', task_title: 'Formula normalized hash'
  });
  const row = fixture.taskRow(sheet, task.task_id);
  const first = rowValues(sheet, row);
  first[taskMap.pending_changes_json] = JSON.stringify({
    b: { z: 1, a: [ { y: 2, x: 1 } ] }, a: true
  });
  first[taskMap.task_title] = '=SUM(1,1)';
  commit(sheet, row, first, 'ROUND5_HASH_FIRST');
  const firstEntry = ledgerEntry(sheet, task.task_id).record;
  const firstHash = firstEntry[firstEntry.active_slot === 'A'
    ? 'slot_a_hash' : 'slot_b_hash'];
  const second = rowValues(sheet, row);
  second[taskMap.pending_changes_json] = JSON.stringify({
    a: true, b: { a: [ { x: 1, y: 2 } ], z: 1 }
  });
  second[taskMap.authoritative_snapshot_json] = '{"untrusted":true}';
  second[taskMap.authority_generation] = 999;
  second[taskMap.authority_hash] = 'untrusted';
  second[taskMap.authority_state] = 'QUARANTINED';
  commit(sheet, row, second, 'ROUND5_HASH_SECOND');
  const secondEntry = ledgerEntry(sheet, task.task_id).record;
  const secondHash = secondEntry[secondEntry.active_slot === 'A'
    ? 'slot_a_hash' : 'slot_b_hash'];
  assert.strictEqual(secondHash, firstHash);
  const activeSnapshot = JSON.parse(String(secondEntry[
    secondEntry.active_slot === 'A'
      ? 'slot_a_snapshot_json'
      : 'slot_b_snapshot_json'
  ]));
  ['authoritative_snapshot_json', 'authority_generation', 'authority_hash',
    'authority_state'].forEach((field) => {
    assert.strictEqual(Object.prototype.hasOwnProperty.call(
      activeSnapshot.values, field), false, `${field} must be self-excluded`);
  });
  assert.strictEqual(rowValues(sheet, row)[taskMap.task_title], '\u200B=SUM(1,1)');
  assert.strictEqual(authority(sheet, row).status, 'VALID');
});

test('R5-01B_LEGACY_LEDGER_HASH_REMAINS_LEDGER_VERIFIED_AND_UPGRADES_ON_WRITE', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round5-legacy-hash', task_title: 'Legacy ledger hash'
  });
  const row = fixture.taskRow(sheet, task.task_id);
  const entry = ledgerEntry(sheet, task.task_id);
  const activeSuffix = entry.record.active_slot === 'A' ? 'a' : 'b';
  const snapshot = entry.record[`slot_${activeSuffix}_snapshot_json`];
  const legacyHash = sandbox.WorkOsUtilities.sha256Hex(
    sandbox.WorkOsUtilities.serializeJson(snapshot, 'object')
  );
  const canonicalHash = sandbox.WorkOsUtilities.sha256Hex(
    sandbox.WorkOsUtilities.canonicalJsonString(snapshot, 'object')
  );
  assert.notStrictEqual(legacyHash, canonicalHash,
    'fixture must preserve the historic insertion-order distinction');
  entry.record[`slot_${activeSuffix}_hash`] = legacyHash;
  entry.record.committed_hash = legacyHash;
  writeLedgerRecord(sheet, entry);
  fixture.setTaskCell(sheet, row, 'authority_hash', legacyHash);
  assert.strictEqual(authority(sheet, row).status, 'VALID');

  const candidate = rowValues(sheet, row);
  candidate[taskMap.task_title] = 'Canonical next generation';
  commit(sheet, row, candidate, 'ROUND5_LEGACY_TO_CANONICAL');
  const promoted = ledgerEntry(sheet, task.task_id).record;
  const promotedSuffix = promoted.active_slot === 'A' ? 'a' : 'b';
  const promotedSnapshot = promoted[`slot_${promotedSuffix}_snapshot_json`];
  assert.strictEqual(promoted[`slot_${promotedSuffix}_hash`],
    sandbox.WorkOsUtilities.sha256Hex(
      sandbox.WorkOsUtilities.canonicalJsonString(promotedSnapshot, 'object')
    ));
  assert.strictEqual(authority(sheet, row).status, 'VALID');
});

test('R5-02_CONTEXT_INDEXES_EXCLUDE_UNVALIDATED_RAW_DUPLICATES', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const healthy = fixture.insertTaskFixture(sheet, {
    source: 'round5-index-healthy', task_title: 'Healthy authority'
  });
  const poison = fixture.insertTaskFixture(sheet, {
    source: 'round5-index-poison', task_title: 'Untrusted duplicate'
  });
  const healthyRow = fixture.taskRow(sheet, healthy.task_id);
  const poisonRow = fixture.taskRow(sheet, poison.task_id);
  clearLedgerEntry(sheet, poison.task_id);
  fixture.setTaskCell(sheet, poisonRow, 'task_id', healthy.task_id);
  fixture.setTaskCell(sheet, poisonRow, 'origin_key', healthy.origin_key);
  const context = sandbox.WorkOsTaskRepository.createContext(sheet);
  assert.strictEqual(context.byTaskId[healthy.task_id], healthyRow);
  assert.strictEqual(context.byOriginKey[healthy.origin_key], healthyRow);
  assert.strictEqual(context.logicalRows.includes(poisonRow), false);
  assert.ok(['RESTORABLE', 'UNRECOVERABLE', 'QUARANTINED'].includes(
    context.authority_by_physical_row[poisonRow].status
  ));
});

test('R5-02B_REVIEW_DECISION_USES_ONLY_CONTROLLED_EVENT_INPUT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const acceptedReview = fixture.applyMarker(sheet, 'NEW_REVIEW', {
    message_id: 'round5-controlled-decision-accept'
  }).tasks.find((task) => task.review_type === 'NEW_TASK');
  assert.ok(acceptedReview, 'a review Task is required for the decision path');
  const acceptedRow = fixture.taskRow(sheet, acceptedReview.task_id);
  fixture.setTaskCell(sheet, acceptedRow, 'decision',
    sandbox.WorkOsSchemas.toSheetEnum('Decision', 'ACCEPT'));
  const accepted = sandbox.WorkOsTaskRepository.applyUserEdits(sheet, [{
    row: acceptedRow,
    column_ids: ['decision']
  }], new sandbox.Date('2026-07-28T00:00:00.000Z'));
  assert.strictEqual(accepted[0].operation, 'UPDATE');
  assert.strictEqual(fixture.readTask(sheet, acceptedReview.task_id).decision,
    'ACCEPT');
  assert.strictEqual(authority(sheet, acceptedRow).status, 'VALID');

  const rejectedReview = fixture.applyMarker(sheet, 'NEW_REVIEW', {
    message_id: 'round5-controlled-decision-mixed-raw'
  }).tasks.find((task) => task.review_type === 'NEW_TASK');
  assert.ok(rejectedReview, 'a second review Task is required for restoration');
  const rejectedRow = fixture.taskRow(sheet, rejectedReview.task_id);
  const before = JSON.stringify(rowValues(sheet, rejectedRow));
  fixture.setTaskCell(sheet, rejectedRow, 'decision',
    sandbox.WorkOsSchemas.toSheetEnum('Decision', 'ACCEPT'));
  fixture.setTaskCell(sheet, rejectedRow, 'task_title', 'untrusted mixed edit');
  const rejected = sandbox.WorkOsTaskRepository.applyUserEdits(sheet, [{
    row: rejectedRow,
    column_ids: ['decision', 'task_title']
  }], new sandbox.Date('2026-07-28T00:01:00.000Z'));
  assert.strictEqual(rejected[0].operation, 'REJECTED');
  assert.strictEqual(rejected[0].error_code, 'REVIEW_EDIT_AMBIGUOUS');
  assert.strictEqual(JSON.stringify(rowValues(sheet, rejectedRow)), before);
  assert.strictEqual(authority(sheet, rejectedRow).status, 'VALID');
});

test('R5-02C_DECISION_BATCH_RESTORES_VALID_PEER_AND_ISOLATES_INVALID_AUTHORITY', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const review = fixture.applyMarker(sheet, 'NEW_REVIEW', {
    message_id: 'round5-decision-batch-review'
  }).tasks.find((task) => task.review_type === 'NEW_TASK');
  const invalid = fixture.insertTaskFixture(sheet, {
    source: 'round5-decision-batch-invalid', task_title: 'Invalid authority row'
  });
  const reviewRow = fixture.taskRow(sheet, review.task_id);
  const invalidRow = fixture.taskRow(sheet, invalid.task_id);
  const reviewBefore = JSON.stringify(rowValues(sheet, reviewRow));
  fixture.setTaskCell(sheet, reviewRow, 'decision',
    sandbox.WorkOsSchemas.toSheetEnum('Decision', 'ACCEPT'));
  fixture.setTaskCell(sheet, invalidRow, 'task_title', 'untrusted peer edit');
  clearLedgerEntry(sheet, invalid.task_id);
  const results = sandbox.WorkOsTaskRepository.applyUserEdits(sheet, [
    { row: reviewRow, column_ids: ['decision'] },
    { row: invalidRow, column_ids: ['task_title'] }
  ], new sandbox.Date('2026-07-28T00:02:00.000Z'));
  assert.strictEqual(results.every((result) => result.operation === 'REJECTED'),
    true);
  assert.strictEqual(JSON.stringify(rowValues(sheet, reviewRow)), reviewBefore,
    'valid peer raw decision must be restored when the batch is rejected');
  assert.strictEqual(authority(sheet, reviewRow).status, 'VALID');
  assert.strictEqual(rowValues(sheet, invalidRow)[taskMap.authority_state],
    'QUARANTINED');
  assert.strictEqual(authority(sheet, invalidRow).status, 'QUARANTINED');
});

test('R5-03_ORPHAN_DIAGNOSTIC_IS_READ_ONLY_AND_SETUP_PERSISTS_ORPHANED', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const orphan = fixture.insertTaskFixture(sheet, {
    source: 'round5-orphan', task_title: 'Deleted physical row'
  });
  const healthy = fixture.insertTaskFixture(sheet, {
    source: 'round5-orphan-peer', task_title: 'Healthy peer'
  });
  const orphanRow = fixture.taskRow(sheet, orphan.task_id);
  sheet.getRange(orphanRow, 1, 1, taskSchema.length)
    .setValues([new Array(taskSchema.length).fill('')]);
  const before = ledgerEntry(sheet, orphan.task_id).record.control_state;
  const diagnostic = sandbox.WorkOsTaskRepository.validateAllTaskAuthorities(sheet, {
    mode: 'QUICK_DIAGNOSTIC',
    recover_prepared: false,
    quarantine_invalid: false,
    mark_orphaned: false
  });
  assert.ok(diagnostic.rows.some((item) => item.task_id === orphan.task_id &&
    item.status === 'ORPHANED' && item.code === 'E_TASK_AUTHORITY_ORPHANED'));
  assert.strictEqual(ledgerEntry(sheet, orphan.task_id).record.control_state, before);
  const setup = sandbox.WorkOsTaskRepository.validateAllTaskAuthorities(sheet, {
    mode: 'SETUP',
    recover_prepared: true,
    recover_relocated: true,
    quarantine_invalid: true,
    mark_orphaned: true
  });
  assert.ok(setup.rows.some((item) => item.task_id === orphan.task_id &&
    item.status === 'ORPHANED'));
  assert.strictEqual(ledgerEntry(sheet, orphan.task_id).record.control_state,
    'ORPHANED');
  const context = sandbox.WorkOsTaskRepository.createContext(sheet);
  assert.strictEqual(sandbox.WorkOsTaskRepository.findByTaskId(context, orphan.task_id),
    null);
  assert.strictEqual(sandbox.WorkOsTaskRepository.findByTaskId(context, healthy.task_id)
    .task_id, healthy.task_id);
});

test('R5-03_ROW_MOVE_REBINDS_AND_COPIED_ROW_CANNOT_STEAL_AUTHORITY', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const first = fixture.insertTaskFixture(sheet, {
    source: 'round5-move-first', task_title: 'First movable Task'
  });
  const second = fixture.insertTaskFixture(sheet, {
    source: 'round5-move-second', task_title: 'Second movable Task'
  });
  const firstRow = fixture.taskRow(sheet, first.task_id);
  const secondRow = fixture.taskRow(sheet, second.task_id);
  const firstRaw = rowValues(sheet, firstRow);
  const secondRaw = rowValues(sheet, secondRow);
  const firstAuthorityBefore = ledgerEntry(sheet, first.task_id).record;
  const secondAuthorityBefore = ledgerEntry(sheet, second.task_id).record;
  // A sort/move changes physical positions without changing either business
  // payload. Recovery may rebind only the durable ledger hint.
  sheet.getRange(firstRow, 1, 1, taskSchema.length).setValues([secondRaw]);
  sheet.getRange(secondRow, 1, 1, taskSchema.length).setValues([firstRaw]);
  const writesBeforeRebind = sheet.writeLog.length;
  const recovered = sandbox.WorkOsTaskRepository.validateAllTaskAuthorities(sheet, {
    mode: 'SETUP',
    recover_prepared: true,
    recover_relocated: true,
    quarantine_invalid: true,
    mark_orphaned: true
  });
  assert.strictEqual(recovered.counts.RELOCATABLE, undefined,
    'successful rebinding must end in VALID, not a lingering relocatable state');
  assert.strictEqual(ledgerEntry(sheet, first.task_id).record.physical_row_hint,
    secondRow);
  assert.strictEqual(ledgerEntry(sheet, second.task_id).record.physical_row_hint,
    firstRow);
  assert.strictEqual(sheet.writeLog.length, writesBeforeRebind,
    'a relocated, already-valid Task must rebind only the ledger hint');
  ['committed_generation', 'committed_hash'].forEach((field) => {
    assert.strictEqual(ledgerEntry(sheet, first.task_id).record[field],
      firstAuthorityBefore[field]);
    assert.strictEqual(ledgerEntry(sheet, second.task_id).record[field],
      secondAuthorityBefore[field]);
  });
  let context = sandbox.WorkOsTaskRepository.createContext(sheet);
  assert.strictEqual(sandbox.WorkOsTaskRepository.findByTaskId(context, first.task_id)
    .task_id, first.task_id);
  assert.strictEqual(sandbox.WorkOsTaskRepository.findByTaskId(context, second.task_id)
    .task_id, second.task_id);

  const copiedRow = secondRow + 10;
  sheet.getRange(copiedRow, 1, 1, taskSchema.length)
    .setValues([rowValues(sheet, secondRow)]);
  context = sandbox.WorkOsTaskRepository.createContext(sheet);
  assert.strictEqual(context.logicalRows.includes(copiedRow), false);
  assert.strictEqual(context.authority_by_physical_row[copiedRow].status,
    'UNRECOVERABLE');
  assert.strictEqual(context.authority_by_physical_row[copiedRow].code,
    'E_TASK_AUTHORITY_DUPLICATE_ROW');
  assert.strictEqual(ledgerEntry(sheet, second.task_id).record.physical_row_hint,
    firstRow, 'copy must not alter the original authority record');
  const isolated = sandbox.WorkOsTaskRepository.validateAllTaskAuthorities(sheet, {
    mode: 'SETUP', recover_prepared: true, recover_relocated: true,
    quarantine_invalid: true, mark_orphaned: true
  });
  assert.ok(isolated.rows.some((item) => item.row === copiedRow &&
    item.status === 'UNRECOVERABLE' &&
    item.code === 'E_TASK_AUTHORITY_DUPLICATE_ROW'));
  assert.strictEqual(rowValues(sheet, copiedRow)[taskMap.authority_state],
    'UNRECOVERABLE');
  const detached = ledgerEntryAtPhysicalRow(sheet, copiedRow);
  assert.ok(detached, 'copy isolation needs a detached physical ledger record');
  assert.ok(String(detached.record.task_id).startsWith('qrow_'));
  assert.strictEqual(detached.record.control_state, 'UNRECOVERABLE');
  assert.strictEqual(ledgerEntry(sheet, second.task_id).record.control_state,
    'ACTIVE');
  assert.strictEqual(ledgerEntry(sheet, second.task_id).record.physical_row_hint,
    firstRow);

  const repeatedIsolation = sandbox.WorkOsTaskRepository.validateAllTaskAuthorities(
    sheet,
    {
      mode: 'SETUP', recover_prepared: true, recover_relocated: true,
      quarantine_invalid: true, mark_orphaned: true
    }
  );
  assert.ok(repeatedIsolation.rows.some((item) => item.row === copiedRow &&
    item.status === 'UNRECOVERABLE'));
  const detachedRecords = ledgerEntries(sheet, (record) =>
    Number(record.physical_row_hint) === copiedRow &&
    /^qrow_[0-9a-f]{24}$/.test(String(record.task_id || ''))
  );
  assert.strictEqual(detachedRecords.length, 1,
    'repeated copied-row isolation must reuse its detached ledger record');
  assert.strictEqual(ledgerEntry(sheet, second.task_id).record.control_state,
    'ACTIVE');
});

test('R5-04_LEDGER_READS_ARE_CHUNKED_AND_CAPACITY_FAILS_CLOSED', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round5-capacity', task_title: 'Bounded ledger'
  });
  const row = fixture.taskRow(sheet, task.task_id);
  const target = ledger(sheet);
  target.readLog.length = 0;
  assert.strictEqual(authority(sheet, row).status, 'VALID');
  const dataReads = target.readLog.filter((entry) =>
    entry.row >= sandbox.WorkOsConfig.DATA_START_ROW &&
    entry.column === 1 && entry.columnCount === ledgerSchema.length
  );
  assert.ok(dataReads.length >= 1, 'authority validation must read ledger data');
  dataReads.forEach((entry) => {
    assert.ok(entry.rowCount <= sandbox.WorkOsConfig.AUTHORITY_LEDGER_CHUNK_ROWS,
      'ledger data reads must not exceed the configured chunk budget');
  });
  target.getLastRow = () => sandbox.WorkOsConfig.DATA_START_ROW +
    sandbox.WorkOsConfig.AUTHORITY_LEDGER_MAX_DATA_ROWS;
  const before = JSON.stringify(rowValues(sheet, row));
  const result = authority(sheet, row);
  assert.strictEqual(result.status, 'QUARANTINED');
  assert.strictEqual(result.code, 'E_TASK_AUTHORITY_LEDGER_CAPACITY');
  assert.strictEqual(JSON.stringify(rowValues(sheet, row)), before);
});

test('R5-05_LEDGER_HEADER_HIDDEN_AND_PROTECTION_CONTRACT_FAIL_CLOSED', () => {
  const make = () => {
    const spreadsheet = fixture.makeOperationalSpreadsheet();
    const sheet = fixture.taskSheet(spreadsheet);
    const task = fixture.insertTaskFixture(sheet, { source: 'round5-contract' });
    return { sheet, row: fixture.taskRow(sheet, task.task_id), target: ledger(sheet) };
  };
  let scenario = make();
  scenario.target.getRange(2, 1, 1, ledgerSchema.length)
    .setValues([new Array(ledgerSchema.length).fill('tampered')]);
  assert.strictEqual(authority(scenario.sheet, scenario.row).code,
    'E_TASK_AUTHORITY_LEDGER_SCHEMA');

  scenario = make();
  scenario.target.isSheetHidden = () => false;
  assert.strictEqual(authority(scenario.sheet, scenario.row).code,
    'E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN');

  scenario = make();
  scenario.target.getProtections = () => [];
  assert.strictEqual(authority(scenario.sheet, scenario.row).code,
    'E_TASK_AUTHORITY_LEDGER_UNPROTECTED');

  scenario = make();
  scenario.target.getProtections = () => [{
    isWarningOnly: () => false,
    getDescription: () => 'unrelated protection',
    canDomainEdit: () => false,
    getUnprotectedRanges: () => []
  }];
  assert.strictEqual(authority(scenario.sheet, scenario.row).code,
    'E_TASK_AUTHORITY_LEDGER_UNPROTECTED');

  scenario = make();
  const priorSession = sandbox.Session;
  sandbox.Session = {
    getEffectiveUser: () => ({ getEmail: () => 'owner@example.invalid' })
  };
  try {
    scenario.target.getProtections = () => [{
      isWarningOnly: () => false,
      getDescription: () => 'WORK_OS_V2_PHASE1_Task Authority Ledger_MANAGEMENT_SHEET',
      canDomainEdit: () => false,
      getUnprotectedRanges: () => [],
      getEditors: () => [
        { getEmail: () => 'owner@example.invalid' },
        { getEmail: () => 'unexpected@example.invalid' }
      ]
    }];
    assert.strictEqual(authority(scenario.sheet, scenario.row).code,
      'E_TASK_AUTHORITY_LEDGER_UNPROTECTED');
  } finally {
    if (priorSession === undefined) delete sandbox.Session;
    else sandbox.Session = priorSession;
  }
});

test('R5-06_CALENDAR_PREPARE_CANCELS_AUTHORITY_EXCLUDED_OUTBOX_AND_CONTINUES', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const unsafe = fixture.insertTaskFixture(sheet, {
    source: 'round5-calendar-unsafe',
    due_date: '2026-08-01', deadline_basis: 'EXPLICIT',
    calendar_sync_mode: 'FORCE'
  });
  const healthy = fixture.insertTaskFixture(sheet, {
    source: 'round5-calendar-healthy',
    due_date: '2026-08-02', deadline_basis: 'EXPLICIT',
    calendar_sync_mode: 'FORCE'
  });
  const syncSheet = spreadsheet.getSheetByName(syncName);
  const taskReader = (taskId) => sandbox.WorkOsTaskRepository.findByTaskId(
    sandbox.WorkOsTaskRepository.createContext(sheet), taskId
  );
  const unsafeEnqueue = sandbox.WorkOsCalendarSync.enqueueTask(
    sandbox.WorkOsTaskRepository.findByTaskId(
      sandbox.WorkOsTaskRepository.createContext(sheet), unsafe.task_id
    ), { sheet: syncSheet, desired_action: 'CREATE', force_enqueue: true }
  );
  const healthyEnqueue = sandbox.WorkOsCalendarSync.enqueueTask(
    sandbox.WorkOsTaskRepository.findByTaskId(
      sandbox.WorkOsTaskRepository.createContext(sheet), healthy.task_id
    ), { sheet: syncSheet, desired_action: 'CREATE', force_enqueue: true }
  );
  assert.strictEqual(unsafeEnqueue.status, 'PENDING');
  assert.strictEqual(healthyEnqueue.status, 'PENDING');
  assert.ok(sandbox.WorkOsTaskRepository.findByTaskId(
    sandbox.WorkOsTaskRepository.createContext(sheet), healthy.task_id
  ), 'healthy Task must be authority-resolvable before isolation');
  clearLedgerEntry(sheet, unsafe.task_id);
  assert.ok(sandbox.WorkOsTaskRepository.findByTaskId(
    sandbox.WorkOsTaskRepository.createContext(sheet), healthy.task_id
  ), 'healthy Task must remain authority-resolvable after peer isolation');
  const prepared = sandbox.WorkOsCalendarSync.prepareNextJob({
    sheet: syncSheet,
    task_reader: taskReader,
    task_writer: () => {},
    now: new sandbox.Date('2026-07-28T00:00:00.000Z')
  });
  assert.strictEqual(prepared.status, 'READY', JSON.stringify(prepared));
  assert.strictEqual(prepared.task_id, healthy.task_id);
  assert.strictEqual(prepared.authority_excluded_count, 1);
  const outboxRows = syncSheet.getRange(
    sandbox.WorkOsConfig.DATA_START_ROW, 1,
    syncSheet.getMaxRows() - sandbox.WorkOsConfig.DATA_START_ROW + 1,
    sandbox.WorkOsSchemas.getSheetSchema(syncName).length
  ).getValues();
  const unsafeOutbox = outboxRows.find((row) => String(row[1] || '') === unsafe.task_id);
  assert.strictEqual(String(unsafeOutbox[5]), 'CANCELLED');
  assert.strictEqual(String(unsafeOutbox[10]), 'E_CALENDAR_TASK_AUTHORITY_EXCLUDED');
});

test('R5-06B_CALENDAR_PREPARE_CANCELS_ORPHANED_OUTBOX_WITHOUT_EXTERNAL_INTENT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const orphan = fixture.insertTaskFixture(sheet, {
    source: 'round5-calendar-orphan',
    due_date: '2026-08-03', deadline_basis: 'EXPLICIT',
    calendar_sync_mode: 'FORCE'
  });
  const healthy = fixture.insertTaskFixture(sheet, {
    source: 'round5-calendar-orphan-peer',
    due_date: '2026-08-04', deadline_basis: 'EXPLICIT',
    calendar_sync_mode: 'FORCE'
  });
  const syncSheet = spreadsheet.getSheetByName(syncName);
  const taskReader = (taskId) => sandbox.WorkOsTaskRepository.findByTaskId(
    sandbox.WorkOsTaskRepository.createContext(sheet), taskId
  );
  [orphan.task_id, healthy.task_id].forEach((taskId) => {
    const task = sandbox.WorkOsTaskRepository.findByTaskId(
      sandbox.WorkOsTaskRepository.createContext(sheet), taskId
    );
    assert.strictEqual(sandbox.WorkOsCalendarSync.enqueueTask(task, {
      sheet: syncSheet, desired_action: 'CREATE', force_enqueue: true
    }).status, 'PENDING');
  });
  const orphanRow = fixture.taskRow(sheet, orphan.task_id);
  sheet.getRange(orphanRow, 1, 1, taskSchema.length)
    .setValues([new Array(taskSchema.length).fill('')]);
  const setup = sandbox.WorkOsTaskRepository.validateAllTaskAuthorities(sheet, {
    mode: 'SETUP', recover_prepared: true, recover_relocated: true,
    quarantine_invalid: true, mark_orphaned: true
  });
  assert.ok(setup.rows.some((item) => item.task_id === orphan.task_id &&
    item.status === 'ORPHANED'));
  assert.strictEqual(ledgerEntry(sheet, orphan.task_id).record.control_state,
    'ORPHANED');
  const prepared = sandbox.WorkOsCalendarSync.prepareNextJob({
    sheet: syncSheet,
    task_reader: taskReader,
    task_writer: () => { throw new Error('orphan must not reach task writer'); },
    now: new sandbox.Date('2026-07-28T00:00:00.000Z')
  });
  assert.strictEqual(prepared.status, 'READY', JSON.stringify(prepared));
  assert.strictEqual(prepared.task_id, healthy.task_id);
  const rows = syncSheet.getRange(
    sandbox.WorkOsConfig.DATA_START_ROW, 1,
    syncSheet.getMaxRows() - sandbox.WorkOsConfig.DATA_START_ROW + 1,
    sandbox.WorkOsSchemas.getSheetSchema(syncName).length
  ).getValues();
  const orphanOutbox = rows.find((row) => String(row[1] || '') === orphan.task_id);
  assert.strictEqual(String(orphanOutbox[5]), 'CANCELLED');
  assert.strictEqual(String(orphanOutbox[10]), 'E_CALENDAR_TASK_AUTHORITY_EXCLUDED');
});

const failed = tests.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({
  suite: 'remediation_round5',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_google_workspace: 'NOT_EXECUTED',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
