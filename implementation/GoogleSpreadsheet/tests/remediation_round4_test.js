'use strict';

/*
 * Round 4 authority-protocol fault-injection tests.  This file evaluates the
 * existing Phase 3 in-memory Apps Script fixture only: no Google service,
 * browser, or network operation is performed here.
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
globalThis.__round4Fixture = {
  sandbox, FakeSheet, FakeSpreadsheet, makeSchemaSheet,
  makeOperationalSpreadsheet, taskSheet, insertTaskFixture, setTaskCell,
  taskRow, readTask, columnMap,
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
  filename: 'phase3_round4_fixture.js'
});

const fixture = host.__round4Fixture;
const sandbox = fixture.sandbox;
const taskName = sandbox.WorkOsConfig.SHEETS.TASKS;
const ledgerName = sandbox.WorkOsConfig.SHEETS.TASK_AUTHORITY_LEDGER;
const taskSchema = sandbox.WorkOsSchemas.getSheetSchema(taskName);
const ledgerSchema = sandbox.WorkOsSchemas.getSheetSchema(ledgerName);
const taskMap = fixture.columnMap(taskName);
const ledgerMap = fixture.columnMap(ledgerName);

// These modules are needed only for direct canonical-header and migration
// boundary tests. They execute in the same in-memory Apps Script context.
['03_SheetBuilder.gs', '14_Migrations.gs'].forEach((name) => {
  vm.runInContext(fs.readFileSync(path.join(appsRoot, name), 'utf8'), sandbox, {
    filename: name
  });
});

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

function clearLedgerEntry(sheet, taskId) {
  const entry = ledgerEntry(sheet, taskId);
  assert.ok(entry, `expected ledger record for ${taskId}`);
  ledger(sheet).getRange(entry.row, 1, 1, ledgerSchema.length)
    .setValues([new Array(ledgerSchema.length).fill('')]);
}

function authority(sheet, row) {
  return sandbox.WorkOsTaskRepository.validateAuthority(rowValues(sheet, row), {
    sheet,
    physical_row: row,
    schema: taskSchema,
    column_map: taskMap,
    mode: 'ROUND4_FAULT_TEST'
  });
}

function candidateWithTitle(sheet, row, title) {
  const result = rowValues(sheet, row);
  result[taskMap.task_title] = title;
  return result;
}

function isFullTaskWrite(args) {
  return Number(args[1]) === 1 && Number(args[2] || 1) === 1 &&
    Number(args[3] || 1) === taskSchema.length;
}

/* Inject exactly one pre- or post-persist setValues failure. */
function injectWriteFault(sheet, matches, phase) {
  const original = sheet.getRange.bind(sheet);
  let count = 0;
  sheet.getRange = (...args) => {
    const range = original(...args);
    const setValues = range.setValues.bind(range);
    range.setValues = (values) => {
      if (count === 0 && matches(args, values)) {
        count += 1;
        if (phase === 'BEFORE') throw new Error('R4_FAULT_BEFORE_PERSIST');
        const result = setValues(values);
        throw new Error('R4_FAULT_AFTER_PERSIST');
      }
      return setValues(values);
    };
    return range;
  };
  return {
    restore: () => { sheet.getRange = original; },
    count: () => count
  };
}

function makePre25Candidate() {
  const ids = sandbox.WorkOsSchemas.getInternalIds(taskName);
  const headers = sandbox.WorkOsSchemas.getHeaders(taskName);
  const width = ids.length - 4;
  const task = new fixture.FakeSheet(taskName, 100, width);
  task.getRange(1, 1, 1, width).setValues([ids.slice(0, width)]);
  task.getRange(2, 1, 1, width).setValues([headers.slice(0, width)]);
  const sheets = [task];
  sandbox.WorkOsSheetOrder.forEach((name) => {
    if (name !== taskName) sheets.push(fixture.makeSchemaSheet(name));
  });
  const spreadsheet = new fixture.FakeSpreadsheet(sheets);
  sheets.forEach((sheet) => { sheet.writeLog = []; });
  return { spreadsheet, sheets };
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

test('R4-01_NORMAL_COMMIT_HAS_ONE_TASK_WRITE_AND_NO_AUTHORITY_NOTE', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round4-normal-write', task_title: 'Before normal commit'
  });
  const row = fixture.taskRow(sheet, task.task_id);
  const original = sheet.getRange.bind(sheet);
  let notes = 0;
  sheet.getRange = (...args) => {
    const range = original(...args);
    const setNote = range.setNote.bind(range);
    range.setNote = (...noteArgs) => {
      notes += 1;
      return setNote(...noteArgs);
    };
    return range;
  };
  sheet.writeLog = [];
  try {
    sandbox.WorkOsTaskRepository.commitAuthorityRow(sheet, row,
      candidateWithTitle(sheet, row, 'After normal commit'), {
        schema: taskSchema, column_map: taskMap, mode: 'ROUND4_NORMAL'
      });
  } finally {
    sheet.getRange = original;
  }
  const writes = sheet.writeLog.filter((entry) => entry.row === row &&
    entry.column === 1 && entry.rowCount === 1 &&
    entry.columnCount === taskSchema.length);
  assert.strictEqual(writes.length, 1);
  assert.strictEqual(notes, 0);
  assert.strictEqual(authority(sheet, row).status, 'VALID');
  assert.strictEqual(Number(ledgerEntry(sheet, task.task_id).record
    .committed_generation), 2);
});

[
  {
    id: 'R4-02A_TASK_WRITE_BEFORE_PERSIST_ROLLS_BACK_AND_PROPAGATES_FAILURE',
    target: 'TASK', phase: 'BEFORE', expectedTitle: 'Before fault', delta: 0,
    expectThrow: true
  },
  {
    id: 'R4-02B_PREPARED_PROMOTION_ON_TASK_WRITE_POST_PERSIST_FAILURE',
    target: 'TASK', phase: 'AFTER', expectedTitle: 'After fault', delta: 1
  },
  {
    id: 'R4-02E_COMMITTED_PROMOTION_RECOVERS_BEFORE_PERSIST_FAILURE',
    target: 'LEDGER', phase: 'BEFORE', expectedTitle: 'After fault', delta: 1
  },
  {
    id: 'R4-02F_COMMITTED_PROMOTION_RECOVERS_AFTER_PERSIST_FAILURE',
    target: 'LEDGER', phase: 'AFTER', expectedTitle: 'After fault', delta: 1
  }
].forEach((caseSpec) => {
  test(caseSpec.id, () => {
    const spreadsheet = fixture.makeOperationalSpreadsheet();
    const sheet = fixture.taskSheet(spreadsheet);
    const task = fixture.insertTaskFixture(sheet, {
      source: `round4-${caseSpec.id}`, task_title: 'Before fault'
    });
    const row = fixture.taskRow(sheet, task.task_id);
    const baseline = ledgerEntry(sheet, task.task_id).record;
    const expectedGeneration = Number(baseline.committed_generation) +
      caseSpec.delta;
    const target = caseSpec.target === 'TASK' ? sheet : ledger(sheet);
    const fault = injectWriteFault(target, (args, values) => {
      if (caseSpec.target === 'TASK') {
        return Number(args[0]) === row && isFullTaskWrite(args) &&
          String(values[0][taskMap.task_title] || '') === 'After fault';
      }
      return Number(args[0]) >= sandbox.WorkOsConfig.DATA_START_ROW &&
        Number(args[1]) === 1 && Number(args[2] || 1) === 1 &&
        Number(args[3] || 1) === ledgerSchema.length &&
        String(values[0][ledgerMap.transaction_state] || '') === 'IDLE' &&
        Number(values[0][ledgerMap.committed_generation] || 0) ===
          Number(baseline.committed_generation) + 1;
    }, caseSpec.phase);
    try {
      const commit = () => sandbox.WorkOsTaskRepository.commitAuthorityRow(
        sheet,
        row,
        candidateWithTitle(sheet, row, 'After fault'),
        { schema: taskSchema, column_map: taskMap, mode: 'ROUND4_FAULT' }
      );
      if (caseSpec.expectThrow) {
        assert.throws(commit, /R4_FAULT_BEFORE_PERSIST/);
      } else {
        commit();
      }
    } finally {
      fault.restore();
    }
    assert.strictEqual(fault.count(), 1, 'the intended failure point ran');
    assert.strictEqual(authority(sheet, row).status, 'VALID');
    assert.strictEqual(rowValues(sheet, row)[taskMap.task_title],
      caseSpec.expectedTitle);
    const record = ledgerEntry(sheet, task.task_id).record;
    assert.strictEqual(record.control_state, 'ACTIVE');
    assert.strictEqual(record.transaction_state, 'IDLE');
    assert.strictEqual(Number(record.committed_generation), expectedGeneration);
    assert.strictEqual(Number(rowValues(sheet, row)[
      taskMap.authority_generation
    ]), expectedGeneration);
  });
});

test('R4-02K_INITIAL_INSERT_ROLLBACK_DISCARDS_PREPARED_AND_RETRIES', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const template = fixture.insertTaskFixture(sheet, {
    source: 'round4-initial-rollback-template',
    task_title: 'Template task'
  });
  const templateRow = fixture.taskRow(sheet, template.task_id);
  const row = templateRow + 1;
  const candidate = rowValues(sheet, templateRow);
  candidate[taskMap.task_id] = 'tsk_round4_initial_rollback';
  candidate[taskMap.origin_key] = 'round4:initial-rollback';
  candidate[taskMap.task_title] = 'Initial insert candidate';
  const fault = injectWriteFault(sheet, (args, values) =>
    Number(args[0]) === row && isFullTaskWrite(args) &&
    String(values[0][taskMap.task_id] || '') === candidate[taskMap.task_id],
  'BEFORE');
  try {
    assert.throws(() => sandbox.WorkOsTaskRepository.commitAuthorityRow(
      sheet, row, candidate, {
        schema: taskSchema, column_map: taskMap, mode: 'ROUND4_INITIAL_INSERT'
      }
    ), /R4_FAULT_BEFORE_PERSIST/);
  } finally {
    fault.restore();
  }
  assert.strictEqual(fault.count(), 1);
  assert.strictEqual(authority(sheet, row).status, 'EMPTY');
  assert.strictEqual(ledgerEntry(sheet, candidate[taskMap.task_id]), null);
  assert.strictEqual(
    rowValues(sheet, row).every((value) => value === ''),
    true,
    'the interrupted initial insert must leave the Task row blank'
  );

  const committed = sandbox.WorkOsTaskRepository.commitAuthorityRow(
    sheet, row, candidate, {
      schema: taskSchema, column_map: taskMap, mode: 'ROUND4_INITIAL_INSERT_RETRY'
    }
  );
  assert.strictEqual(committed.row, row);
  assert.strictEqual(authority(sheet, row).status, 'VALID');
  const record = ledgerEntry(sheet, candidate[taskMap.task_id]).record;
  assert.strictEqual(record.control_state, 'ACTIVE');
  assert.strictEqual(record.transaction_state, 'IDLE');
  assert.strictEqual(Number(record.committed_generation), 1);
});

[
  {
    id: 'R4-02C_PREPARED_LEDGER_WRITE_BEFORE_PERSIST_ABORTS_WITHOUT_TASK_WRITE',
    phase: 'BEFORE', durablePrepared: false
  },
  {
    id: 'R4-02D_PREPARED_LEDGER_WRITE_AFTER_PERSIST_ROLLS_BACK_ON_RECOVERY',
    phase: 'AFTER', durablePrepared: true
  }
].forEach((caseSpec) => {
  test(caseSpec.id, () => {
    const spreadsheet = fixture.makeOperationalSpreadsheet();
    const sheet = fixture.taskSheet(spreadsheet);
    const task = fixture.insertTaskFixture(sheet, {
      source: `round4-${caseSpec.id}`, task_title: 'Before prepared fault'
    });
    const row = fixture.taskRow(sheet, task.task_id);
    const baseline = ledgerEntry(sheet, task.task_id).record;
    const before = JSON.stringify(rowValues(sheet, row));
    const fault = injectWriteFault(ledger(sheet), (args, values) =>
      Number(args[0]) >= sandbox.WorkOsConfig.DATA_START_ROW &&
      Number(args[1]) === 1 && Number(args[2] || 1) === 1 &&
      Number(args[3] || 1) === ledgerSchema.length &&
      String(values[0][ledgerMap.transaction_state] || '') === 'PREPARED' &&
      Number(values[0][ledgerMap.prepared_generation] || 0) ===
        Number(baseline.committed_generation) + 1,
    caseSpec.phase);
    try {
      assert.throws(
        () => sandbox.WorkOsTaskRepository.commitAuthorityRow(sheet, row,
          candidateWithTitle(sheet, row, 'After prepared fault'), {
            schema: taskSchema, column_map: taskMap, mode: 'ROUND4_FAULT'
          }),
        /R4_FAULT_(BEFORE|AFTER)_PERSIST/
      );
    } finally {
      fault.restore();
    }
    assert.strictEqual(fault.count(), 1, 'the prepared failure point ran');
    assert.strictEqual(JSON.stringify(rowValues(sheet, row)), before);
    const afterFault = ledgerEntry(sheet, task.task_id).record;
    if (!caseSpec.durablePrepared) {
      assert.strictEqual(afterFault.transaction_state, 'IDLE');
      assert.strictEqual(Number(afterFault.committed_generation),
        Number(baseline.committed_generation));
      assert.strictEqual(authority(sheet, row).status, 'VALID');
      return;
    }
    assert.strictEqual(afterFault.transaction_state, 'PREPARED');
    const recovery = sandbox.WorkOsTaskRepository.restoreAuthorityRow(
      sheet, row, rowValues(sheet, row), {
        schema: taskSchema, column_map: taskMap, mode: 'ROUND4_RECOVERY'
      }
    );
    assert.strictEqual(recovery.status, 'RESTORED');
    const afterRecovery = ledgerEntry(sheet, task.task_id).record;
    assert.strictEqual(afterRecovery.transaction_state, 'IDLE');
    assert.strictEqual(Number(afterRecovery.committed_generation),
      Number(baseline.committed_generation));
    assert.strictEqual(authority(sheet, row).status, 'VALID');
  });
});

[
  {
    id: 'R4-02G_RECOVERY_PROMOTION_RETRIES_AFTER_BEFORE_PERSIST_FAILURE',
    phase: 'BEFORE'
  },
  {
    id: 'R4-02H_RECOVERY_PROMOTION_REVALIDATES_AFTER_POST_PERSIST_FAILURE',
    phase: 'AFTER'
  }
].forEach((caseSpec) => {
  test(caseSpec.id, () => {
    const spreadsheet = fixture.makeOperationalSpreadsheet();
    const sheet = fixture.taskSheet(spreadsheet);
    const task = fixture.insertTaskFixture(sheet, {
      source: `round4-${caseSpec.id}`, task_title: 'Before recovery promotion'
    });
    const row = fixture.taskRow(sheet, task.task_id);
    const baseline = ledgerEntry(sheet, task.task_id).record;
    const taskFault = injectWriteFault(sheet, (args, values) =>
      Number(args[0]) === row && isFullTaskWrite(args) &&
      String(values[0][taskMap.task_title] || '') === 'After recovery promotion',
    'AFTER');
    const ledgerFault = injectWriteFault(ledger(sheet), (args, values) =>
      Number(args[0]) >= sandbox.WorkOsConfig.DATA_START_ROW &&
      Number(args[1]) === 1 && Number(args[2] || 1) === 1 &&
      Number(args[3] || 1) === ledgerSchema.length &&
      String(values[0][ledgerMap.transaction_state] || '') === 'IDLE' &&
      Number(values[0][ledgerMap.committed_generation] || 0) ===
        Number(baseline.committed_generation) + 1,
    caseSpec.phase);
    let result;
    try {
      result = sandbox.WorkOsTaskRepository.commitAuthorityRow(sheet, row,
        candidateWithTitle(sheet, row, 'After recovery promotion'), {
          schema: taskSchema, column_map: taskMap, mode: 'ROUND4_RECOVERY'
        });
    } finally {
      ledgerFault.restore();
      taskFault.restore();
    }
    assert.strictEqual(taskFault.count(), 1);
    assert.strictEqual(ledgerFault.count(), 1);
    assert.strictEqual(result.recovered, true);
    assert.strictEqual(authority(sheet, row).status, 'VALID');
    assert.strictEqual(rowValues(sheet, row)[taskMap.task_title],
      'After recovery promotion');
    assert.strictEqual(Number(ledgerEntry(sheet, task.task_id).record
      .committed_generation), Number(baseline.committed_generation) + 1);
  });
});

[
  {
    id: 'R4-02I_RECOVERY_ROLLBACK_RETRIES_AFTER_BEFORE_PERSIST_FAILURE',
    phase: 'BEFORE'
  },
  {
    id: 'R4-02J_RECOVERY_ROLLBACK_REVALIDATES_AFTER_POST_PERSIST_FAILURE',
    phase: 'AFTER'
  }
].forEach((caseSpec) => {
  test(caseSpec.id, () => {
    const spreadsheet = fixture.makeOperationalSpreadsheet();
    const sheet = fixture.taskSheet(spreadsheet);
    const task = fixture.insertTaskFixture(sheet, {
      source: `round4-${caseSpec.id}`, task_title: 'Before recovery rollback'
    });
    const row = fixture.taskRow(sheet, task.task_id);
    const baseline = ledgerEntry(sheet, task.task_id).record;
    const prepareFault = injectWriteFault(ledger(sheet), (args, values) =>
      Number(args[0]) >= sandbox.WorkOsConfig.DATA_START_ROW &&
      Number(args[1]) === 1 && Number(args[2] || 1) === 1 &&
      Number(args[3] || 1) === ledgerSchema.length &&
      String(values[0][ledgerMap.transaction_state] || '') === 'PREPARED',
    'AFTER');
    try {
      assert.throws(
        () => sandbox.WorkOsTaskRepository.commitAuthorityRow(sheet, row,
          candidateWithTitle(sheet, row, 'After recovery rollback'), {
            schema: taskSchema, column_map: taskMap, mode: 'ROUND4_FAULT'
          }),
        /R4_FAULT_AFTER_PERSIST/
      );
    } finally {
      prepareFault.restore();
    }
    assert.strictEqual(prepareFault.count(), 1);
    assert.strictEqual(ledgerEntry(sheet, task.task_id).record
      .transaction_state, 'PREPARED');
    const rollbackFault = injectWriteFault(ledger(sheet), (args, values) =>
      Number(args[0]) >= sandbox.WorkOsConfig.DATA_START_ROW &&
      Number(args[1]) === 1 && Number(args[2] || 1) === 1 &&
      Number(args[3] || 1) === ledgerSchema.length &&
      String(values[0][ledgerMap.transaction_state] || '') === 'IDLE' &&
      Number(values[0][ledgerMap.committed_generation] || 0) ===
        Number(baseline.committed_generation),
    caseSpec.phase);
    let result;
    try {
      result = sandbox.WorkOsTaskRepository.recoverPreparedAuthority(sheet, row, {
        schema: taskSchema, column_map: taskMap, mode: 'ROUND4_RECOVERY'
      });
    } finally {
      rollbackFault.restore();
    }
    assert.strictEqual(rollbackFault.count(), 1);
    assert.strictEqual(result.status, 'VALID');
    assert.strictEqual(authority(sheet, row).status, 'VALID');
    assert.strictEqual(rowValues(sheet, row)[taskMap.task_title],
      'Before recovery rollback');
    assert.strictEqual(ledgerEntry(sheet, task.task_id).record
      .transaction_state, 'IDLE');
  });
});

test('R4-03_AUTHORITY_MISSING_NEVER_FALLS_BACK_TO_EDITABLE_SNAPSHOT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round4-no-snapshot-fallback', task_title: 'Ledger title'
  });
  const row = fixture.taskRow(sheet, task.task_id);
  assert.ok(String(rowValues(sheet, row)[taskMap.authoritative_snapshot_json])
    .includes(task.task_id));
  clearLedgerEntry(sheet, task.task_id);
  fixture.setTaskCell(sheet, row, 'task_title', 'Untrusted live title');
  assert.strictEqual(authority(sheet, row).status, 'QUARANTINED');
  assert.strictEqual(authority(sheet, row).code, 'E_TASK_AUTHORITY_MISSING');
  const outcome = sandbox.WorkOsTaskRepository.restoreAuthorityRow(sheet, row,
    rowValues(sheet, row), { schema: taskSchema, column_map: taskMap });
  assert.strictEqual(outcome.status, 'QUARANTINED');
  assert.strictEqual(rowValues(sheet, row)[taskMap.task_title],
    'Untrusted live title');
  assert.strictEqual(rowValues(sheet, row)[taskMap.authority_state],
    'QUARANTINED');
  ['SETUP', 'QUICK_DIAGNOSTIC', 'DEEP_DIAGNOSTIC', 'MIGRATION_25_TO_26']
    .forEach((mode) => {
      const report = sandbox.WorkOsTaskRepository.validateAllTaskAuthorities(
        sheet, { mode, recover_prepared: false, quarantine_invalid: false }
      );
      const item = report.rows.find((entry) => entry.row === row);
      assert.ok(item, `${mode} must inspect the authority-invalid row`);
      assert.strictEqual(item.status, 'QUARANTINED');
    });
});

test('R4-04_MULTI_ROW_EDIT_RESTORES_VALID_PEER_AND_EXCLUDES_BAD_PEER', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const healthy = fixture.insertTaskFixture(sheet, {
    source: 'round4-healthy', task_title: 'Healthy before'
  });
  const unsafe = fixture.insertTaskFixture(sheet, {
    source: 'round4-unsafe', task_title: 'Unsafe before'
  });
  const healthyRow = fixture.taskRow(sheet, healthy.task_id);
  const unsafeRow = fixture.taskRow(sheet, unsafe.task_id);
  const healthyBefore = JSON.stringify(rowValues(sheet, healthyRow));
  clearLedgerEntry(sheet, unsafe.task_id);
  fixture.setTaskCell(sheet, healthyRow, 'task_title', 'Tampered healthy');
  fixture.setTaskCell(sheet, unsafeRow, 'task_title', 'Tampered unsafe');
  const results = sandbox.WorkOsTaskRepository.applyUserEdits(sheet, [
    { row: healthyRow, column_ids: ['task_title'] },
    { row: unsafeRow, column_ids: ['task_title'] }
  ], new sandbox.Date('2026-07-28T00:00:00.000Z'));
  assert.strictEqual(results.length, 2);
  assert.strictEqual(results.every((item) => item.operation === 'REJECTED'),
    true);
  assert.strictEqual(JSON.stringify(rowValues(sheet, healthyRow)), healthyBefore);
  assert.strictEqual(rowValues(sheet, unsafeRow)[taskMap.authority_state],
    'QUARANTINED');
  assert.strictEqual(authority(sheet, healthyRow).status, 'VALID');
  assert.strictEqual(authority(sheet, unsafeRow).status, 'QUARANTINED');
  const operational = sandbox.WorkOsTaskRepository.operationalTasks(
    sandbox.WorkOsTaskRepository.createContext(sheet)
  );
  assert.strictEqual(JSON.stringify(operational.map((item) => item.task_id)),
    JSON.stringify([healthy.task_id]));
  assert.strictEqual(sandbox.WorkOsTaskRepository.findByTaskId(
    sandbox.WorkOsTaskRepository.createContext(sheet), unsafe.task_id
  ), null);
});

test('R4-05_HEADER_SPANNING_PASTE_RESTORES_HEADERS_AND_TASK_DATA', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round4-header-paste', task_title: 'Before header paste'
  });
  const row = fixture.taskRow(sheet, task.task_id);
  const before = JSON.stringify(rowValues(sheet, row));
  const poison = new Array(taskSchema.length).fill('HEADER_TAMPERED');
  sheet.getRange(1, 1, 2, taskSchema.length).setValues([
    poison, poison.slice()
  ]);
  fixture.setTaskCell(sheet, row, 'task_title', 'Payload in header paste');
  const result = sandbox.WorkOsEditHandler.handle({
    range: sheet.getRange(1, 1, row, taskSchema.length)
  });
  assert.strictEqual(result.status, 'REJECTED');
  assert.strictEqual(result.reason, 'HEADER_EDIT_RESTORED');
  assert.strictEqual(JSON.stringify(rowValues(sheet, 1)),
    JSON.stringify(sandbox.WorkOsSchemas.getInternalIds(taskName)));
  assert.strictEqual(JSON.stringify(rowValues(sheet, 2)),
    JSON.stringify(sandbox.WorkOsSchemas.getHeaders(taskName)));
  assert.strictEqual(JSON.stringify(rowValues(sheet, row)), before);
  assert.strictEqual(authority(sheet, row).status, 'VALID');
});

test('R4-06_PRE25_MIGRATION_FAILS_CLOSED_WITHOUT_REBASELINE', () => {
  const candidate = makePre25Candidate();
  assert.throws(
    () => sandbox.WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
      candidate.spreadsheet, { isExhausted: () => false }
    ),
    (error) => error && error.code ===
      'E_TASK_AUTHORITY_LEGACY_SCHEMA_UNSUPPORTED'
  );
  assert.strictEqual(candidate.sheets.every((sheet) =>
    sheet.writeLog.length === 0), true);
});

test('R4-07_SHARED_VALIDATOR_AND_OPERATIONAL_EXCLUSION_WIRING', () => {
  const source = (name) => fs.readFileSync(path.join(appsRoot, name), 'utf8');
  const setup = source('02_Setup.gs');
  const diagnostics = source('16_Diagnostics.gs');
  const migrations = source('14_Migrations.gs');
  assert.ok(setup.includes('validateAllTaskAuthorities(taskSheet'));
  assert.ok((diagnostics.match(/validateAllTaskAuthorities\(/g) || []).length >= 2);
  assert.ok(migrations.includes('WorkOsTaskRepository.validateAuthority(raw'));
  assert.ok(source('18_Worker.gs').includes('WorkOsTaskRepository.operationalTasks'));
  assert.ok(source('10_CalendarSync.gs').includes('WorkOsTaskRepository.operationalTasks'));
  assert.ok(source('11_EditHandler.gs').includes('WorkOsTaskRepository.operationalTasks'));
});

test('R4-07B_CALENDAR_INTENT_RECOVERY_SKIPS_ISOLATED_ROW_AND_CONTINUES', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const healthy = fixture.insertTaskFixture(sheet, {
    source: 'round4-calendar-healthy',
    due_date: '2026-08-01',
    deadline_basis: 'EXPLICIT',
    calendar_sync_mode: 'FORCE'
  });
  const unsafe = fixture.insertTaskFixture(sheet, {
    source: 'round4-calendar-isolated', task_title: 'Must not block peer'
  });
  const healthyRow = fixture.taskRow(sheet, healthy.task_id);
  const unsafeRow = fixture.taskRow(sheet, unsafe.task_id);
  const candidate = rowValues(sheet, healthyRow);
  candidate[taskMap.calendar_reconcile_required] = true;
  candidate[taskMap.calendar_intent_version] = 1;
  sandbox.WorkOsTaskRepository.commitAuthorityRow(sheet, healthyRow, candidate, {
    schema: taskSchema, column_map: taskMap, mode: 'ROUND4_CALENDAR_RECOVERY'
  });
  clearLedgerEntry(sheet, unsafe.task_id);
  const isolated = sandbox.WorkOsTaskRepository.restoreAuthorityRow(
    sheet, unsafeRow, rowValues(sheet, unsafeRow), {
      schema: taskSchema, column_map: taskMap
    }
  );
  assert.strictEqual(isolated.status, 'QUARANTINED');
  const result = sandbox.WorkOsEditHandler.recoverPendingCalendarIntents({
    spreadsheet
  });
  assert.strictEqual(result.inspected_count, 1);
  assert.strictEqual(result.pending_intent_count, 1);
  assert.strictEqual(
    fixture.readTask(sheet, healthy.task_id).calendar_reconcile_required,
    false
  );
  assert.strictEqual(
    sandbox.WorkOsTaskRepository.operationalTasks(
      sandbox.WorkOsTaskRepository.createContext(sheet)
    ).some((task) => task.task_id === unsafe.task_id),
    false
  );
});

test('R4-08_QUARANTINE_WRITES_SAFE_ERROR_AUDIT_WITHOUT_RAW_TASK_CONTENT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const sheet = fixture.taskSheet(spreadsheet);
  const task = fixture.insertTaskFixture(sheet, {
    source: 'round4-safe-audit', task_title: 'Sensitive operator-facing title'
  });
  const row = fixture.taskRow(sheet, task.task_id);
  clearLedgerEntry(sheet, task.task_id);
  const result = sandbox.WorkOsTaskRepository.restoreAuthorityRow(sheet, row,
    rowValues(sheet, row), { schema: taskSchema, column_map: taskMap });
  assert.strictEqual(result.status, 'QUARANTINED');
  assert.strictEqual(result.isolation_logged, true);
  assert.match(result.safe_task_reference, /^taskref_[0-9a-f]{64}$/);
  const errors = spreadsheet.getSheetByName(sandbox.WorkOsConfig.SHEETS.ERRORS);
  const errorSchema = sandbox.WorkOsSchemas.getSheetSchema(
    sandbox.WorkOsConfig.SHEETS.ERRORS
  );
  const errorMap = fixture.columnMap(sandbox.WorkOsConfig.SHEETS.ERRORS);
  const records = errors.getRange(sandbox.WorkOsConfig.DATA_START_ROW, 1,
    errors.getMaxRows() - sandbox.WorkOsConfig.DATA_START_ROW + 1,
    errorSchema.length).getValues().filter((values) =>
    String(values[errorMap.error_code] || '') === 'E_TASK_AUTHORITY_MISSING'
  );
  assert.strictEqual(records.length, 1);
  const record = records[0];
  assert.match(String(record[errorMap.task_id] || ''), /^taskref_[0-9a-f]{64}$/);
  assert.strictEqual(String(record[errorMap.task_id] || '').includes(task.task_id), false);
  assert.strictEqual(JSON.stringify(record).includes('Sensitive operator-facing title'), false);
});

test('R4-09_CURRENT_WORKFLOW_VISUALIZATION_METADATA_MATCHES_CANONICAL_CONFIG', () => {
  const config = fs.readFileSync(path.join(appsRoot, '00_Config.gs'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'visualizations',
    'task_authority_protocol_v2_8_13.html'), 'utf8');
  const currentStatus = fs.readFileSync(
    path.resolve(root, '..', '..', 'CURRENT_STATUS.md'), 'utf8'
  );
  const values = {};
  [
    ['code', 'CODE_VERSION'],
    ['schema', 'SCHEMA_VERSION'],
    ['ai', 'AI_SCHEMA_VERSION'],
    ['migration', 'MIGRATION_VERSION']
  ].forEach(([key, name]) => {
    const match = config.match(new RegExp(`${name}:\\s*'([^']+)'`));
    assert.ok(match, `CONFIG_MISSING_${name}`);
    values[key] = match[1];
  });
  assert.ok(html.includes(`data-code-version="${values.code}"`));
  assert.ok(html.includes(`data-schema-version="${values.schema}"`));
  assert.ok(html.includes(`data-ai-schema-version="${values.ai}"`));
  assert.ok(html.includes(`data-migration-version="${values.migration}"`));
  const gateMatch = currentStatus.match(/^Overall status:\s+`([^`]+)`/m);
  assert.ok(gateMatch, 'CURRENT_STATUS overall gate missing');
  assert.strictEqual(gateMatch[1], 'READY_FOR_CONTROLLED_SANDBOX_VALIDATION');
  assert.ok(html.includes(`data-release-status="${gateMatch[1]}"`));
  assert.ok(html.includes('Task Authority Ledger'));
  assert.ok(html.includes('PHASE8B-SETUP-01'));
  assert.ok(html.includes('S20_CREATE_SCHEMAS'));
  assert.ok(html.includes('PREPARED'));
  assert.ok(html.includes('COMMITTED'));
  assert.ok(html.includes('PHASE8B-QUICK-DIAGNOSTIC-01'));
  assert.ok(html.includes('PHASE8B-DASHBOARD-01'));
  assert.ok(html.includes('calendar_reconcile_required'));
});

const failed = tests.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({
  suite: 'remediation_round4',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_google_workspace: 'NOT_EXECUTED',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
