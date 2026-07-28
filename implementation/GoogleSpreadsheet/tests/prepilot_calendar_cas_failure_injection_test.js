'use strict';

/**
 * F-015 Calendar CAS failure-injection tests.
 *
 * This suite uses the local Phase 4 fake Apps Script runtime. It verifies that
 * a successful external Calendar mutation is not followed by stale Sheet
 * writes when Task or Outbox state changes before the commit lock is acquired.
 * No Google Workspace API or network request is made.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function loadRuntime() {
  const source = fs.readFileSync(
    path.join(__dirname, 'phase4_independent_test.js'),
    'utf8'
  );
  const marker = '\nconst tests = [];';
  const markerIndex = source.indexOf(marker);
  assert.notStrictEqual(
    markerIndex,
    -1,
    'Phase 4 independent runtime boundary was not found'
  );
  const factory = new Function(
    'require',
    '__dirname',
    'structuredClone',
    'Buffer',
    'Intl',
    `${source.slice(0, markerIndex)}
return {
  sandbox,
  harness,
  IndependentCalendarGateway,
  configureCalendar,
  syncSheet,
  outboxRecords,
  seedEligibleTask,
  fixedBudget,
  makeClock
};`
  );
  return factory(require, __dirname, structuredClone, Buffer, Intl);
}

const runtime = loadRuntime();
const sandbox = runtime.sandbox;
const harness = runtime.harness;
const tests = [];

function test(id, body) {
  const startedAt = Date.now();
  try {
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
      safe_message: sandbox.WorkOsUtilities.redact(error.message)
    });
  } finally {
    harness.reset();
  }
}

function makeScenario(suffix) {
  const spreadsheet = harness.makeOperationalSpreadsheet();
  harness.setActiveSpreadsheet(spreadsheet);
  const task = runtime.seedEligibleTask(spreadsheet, {
    suffix,
    stable_thread_key: `root:${suffix}`,
    thread_id: `synthetic-${suffix}`
  });
  const gateway = new runtime.IndependentCalendarGateway();
  runtime.configureCalendar(gateway);
  const taskSheet = harness.taskSheet(spreadsheet);
  const syncSheet = runtime.syncSheet(spreadsheet);
  const clock = runtime.makeClock('2026-07-24T00:20:00.000Z');
  const taskWrites = [];

  sandbox.WorkOsCalendarSync.enqueueTask(task, {
    sheet: syncSheet,
    now: clock.now()
  });

  function readTaskInContext(taskId, lock) {
    const context =
      sandbox.WorkOsTaskRepository.createContextForHeldLock(taskSheet, lock);
    return sandbox.WorkOsTaskRepository.findByTaskId(context, taskId);
  }

  function writeTaskInContext(taskId, patch, expectedRowVersion, lock) {
    const context =
      sandbox.WorkOsTaskRepository.createContextForHeldLock(taskSheet, lock);
    const current =
      sandbox.WorkOsTaskRepository.findByTaskId(context, taskId);
    assert.strictEqual(
      Number(current && current.row_version || 0),
      Number(expectedRowVersion || 0),
      'Task writer received a stale row_version'
    );
    taskWrites.push({ taskId, patch: { ...patch } });
    return sandbox.WorkOsTaskRepository.applyCalendarPatch(
      taskId,
      patch,
      context,
      clock.now()
    );
  }

  const options = {
    spreadsheet,
    sheet: syncSheet,
    gateway,
    properties: runtime.sandbox.PropertiesService.getScriptProperties(),
    instance_id: gateway.instanceId,
    now: clock.now,
    budget: runtime.fixedBudget(false),
    task_reader_in_context: readTaskInContext,
    task_writer_in_context: writeTaskInContext
  };
  return {
    spreadsheet,
    task,
    taskSheet,
    syncSheet,
    gateway,
    clock,
    taskWrites,
    options
  };
}

function orphanTaskAndMarkLedger(scenario) {
  const taskContext = sandbox.WorkOsTaskRepository.createContext(
    scenario.taskSheet
  );
  const row = taskContext.byTaskId[scenario.task.task_id];
  assert.ok(row, 'Task row must exist before authority-loss injection');
  scenario.taskSheet.getRange(
    row,
    1,
    1,
    scenario.taskSheet.getMaxColumns()
  ).setValues([new Array(scenario.taskSheet.getMaxColumns()).fill('')]);
  const authority = sandbox.WorkOsTaskRepository.validateAllTaskAuthorities(
    scenario.taskSheet,
    {
      mode: 'F016_FAULT_INJECTION',
      recover_prepared: true,
      recover_relocated: true,
      quarantine_invalid: true,
      mark_orphaned: true
    }
  );
  assert.ok(authority.rows.some((item) => (
    item.task_id === scenario.task.task_id && item.status === 'ORPHANED'
  )), 'Task Authority Ledger must record the injected orphan');
}

function bumpTaskRowVersion(scenario) {
  sandbox.WorkOsTaskRepository.withLockedContext(
    scenario.taskSheet,
    (context) => {
      const current = sandbox.WorkOsTaskRepository.findByTaskId(
        context,
        scenario.task.task_id
      );
      sandbox.WorkOsTaskRepository.applyCalendarPatch(
        scenario.task.task_id,
        { calendar_sync_status: 'PENDING' },
        context,
        new Date(scenario.clock.now().getTime() + 1000)
      );
      const updated = sandbox.WorkOsTaskRepository.findByTaskId(
        context,
        scenario.task.task_id
      );
      assert.strictEqual(
        Number(updated.row_version),
        Number(current.row_version) + 1
      );
    }
  );
}

function mutateOutboxAfterExternalSuccess(scenario) {
  sandbox.WorkOsCalendarSync.withLockedOutboxContext(
    scenario.syncSheet,
    (context) => {
      const row = context.byTaskId[scenario.task.task_id];
      const record = sandbox.WorkOsCalendarSync.readOutboxRow(context, row);
      record.updated_at = new Date(scenario.clock.now().getTime() + 1000);
      context.sheet.getRange(
        row,
        12,
        1,
        1
      ).setValues([[record.updated_at]]);
    }
  );
}

function excludeTaskAndEnqueueCurrentState(scenario) {
  const map = sandbox.WorkOsSchemas.buildColumnMapFromIds(
    sandbox.WorkOsSchemas.getInternalIds(
      sandbox.WorkOsConfig.SHEETS.TASKS
    )
  );
  const context =
    sandbox.WorkOsTaskRepository.createContext(scenario.taskSheet);
  const row = context.byTaskId[scenario.task.task_id];
  scenario.taskSheet.getRange(
    row,
    map.excluded + 1,
    1,
    1
  ).setValues([[true]]);
  sandbox.WorkOsTaskRepository.applyUserEdits(
    scenario.taskSheet,
    [{ row, column_ids: ['excluded'] }],
    new Date(scenario.clock.now().getTime() + 500)
  );
  const current = sandbox.WorkOsTaskRepository.findByTaskId(
    sandbox.WorkOsTaskRepository.createContext(scenario.taskSheet),
    scenario.task.task_id
  );
  assert.strictEqual(current.excluded, true);
  assert.strictEqual(current.status, 'EXCLUDED');
  sandbox.WorkOsCalendarSync.enqueueTask(current, {
    sheet: scenario.syncSheet,
    now: new Date(scenario.clock.now().getTime() + 600),
    timezone: sandbox.WorkOsConfig.TIMEZONE,
    force_enqueue: true
  });
  sandbox.WorkOsTaskRepository.withLockedContext(
    scenario.taskSheet,
    (taskContext) => {
      sandbox.WorkOsTaskRepository.applyCalendarPatch(
        scenario.task.task_id,
        {
          calendar_sync_status: current.calendar_event_id
            ? 'DELETE_PENDING'
            : 'NOT_REQUIRED'
        },
        taskContext,
        new Date(scenario.clock.now().getTime() + 700)
      );
    }
  );
  const outbox = runtime.outboxRecords(scenario.spreadsheet)[0];
  assert.strictEqual(
    outbox.status,
    (current.calendar_event_id ||
      outbox.target_type === 'DEADLINE_CALENDAR_ARMED')
      ? 'PENDING'
      : 'DONE'
  );
  assert.strictEqual(
    outbox.desired_action,
    current.calendar_event_id ? 'DELETE' : 'NOOP'
  );
}

function includeTaskAndEnqueueCurrentState(scenario) {
  const map = sandbox.WorkOsSchemas.buildColumnMapFromIds(
    sandbox.WorkOsSchemas.getInternalIds(
      sandbox.WorkOsConfig.SHEETS.TASKS
    )
  );
  const context =
    sandbox.WorkOsTaskRepository.createContext(scenario.taskSheet);
  const row = context.byTaskId[scenario.task.task_id];
  scenario.taskSheet.getRange(
    row,
    map.excluded + 1,
    1,
    1
  ).setValues([[false]]);
  scenario.taskSheet.getRange(
    row,
    map.status + 1,
    1,
    1
  ).setValues([[sandbox.WorkOsEnums.TaskStatus.OPEN]]);
  sandbox.WorkOsTaskRepository.applyUserEdits(
    scenario.taskSheet,
    [{ row, column_ids: ['excluded', 'status'] }],
    new Date(scenario.clock.now().getTime() + 1500)
  );
  const current = sandbox.WorkOsTaskRepository.findByTaskId(
    sandbox.WorkOsTaskRepository.createContext(scenario.taskSheet),
    scenario.task.task_id
  );
  assert.strictEqual(current.excluded, false);
  assert.strictEqual(current.status, 'OPEN');
  sandbox.WorkOsCalendarSync.enqueueTask(current, {
    sheet: scenario.syncSheet,
    now: new Date(scenario.clock.now().getTime() + 1600),
    timezone: sandbox.WorkOsConfig.TIMEZONE,
    force_enqueue: true
  });
  sandbox.WorkOsTaskRepository.withLockedContext(
    scenario.taskSheet,
    (taskContext) => {
      sandbox.WorkOsTaskRepository.applyCalendarPatch(
        scenario.task.task_id,
        { calendar_sync_status: 'PENDING' },
        taskContext,
        new Date(scenario.clock.now().getTime() + 1700)
      );
    }
  );
  const outbox = runtime.outboxRecords(scenario.spreadsheet)[0];
  assert.strictEqual(outbox.status, 'PENDING');
  assert.strictEqual(outbox.desired_action, 'UPDATE');
}

function runInjectedConflict(scenario, inject) {
  const prepared =
    sandbox.WorkOsCalendarSync.prepareNextJob(scenario.options);
  assert.strictEqual(prepared.status, 'READY');
  const execution =
    sandbox.WorkOsCalendarSync.executePreparedJob(
      prepared,
      scenario.options
    );
  assert.strictEqual(execution.status, 'EXECUTED');
  assert.strictEqual(execution.result.action, 'CREATE');
  assert.strictEqual(scenario.gateway.calls.eventInsert, 1);

  inject(scenario);
  const committed = sandbox.WorkOsCalendarSync.commitPreparedJob(
    prepared,
    execution,
    scenario.options
  );
  assert.strictEqual(committed.status, 'CONFLICT');
  assert.strictEqual(committed.processed_count, 0);
  assert.strictEqual(
    committed.result.error_code,
    'E_CALENDAR_CAS_CONFLICT'
  );
  assert.strictEqual(
    runtime.outboxRecords(scenario.spreadsheet)[0].status,
    'PENDING',
    'CAS conflict consumed or failed the pending outbox job'
  );
  return committed;
}

test('F015_CALENDAR_CREATE_THEN_TASK_ROW_VERSION_CONFLICT', () => {
  const scenario = makeScenario('calendar-cas-task');
  runInjectedConflict(scenario, bumpTaskRowVersion);

  const replay =
    sandbox.WorkOsCalendarSync.processNextJob(scenario.options);
  assert.strictEqual(replay.processed_count, 1);
  assert.strictEqual(replay.result.status, 'DONE');
  assert.strictEqual(
    scenario.gateway.calls.eventInsert,
    1,
    'deterministic replay inserted a duplicate Calendar Event'
  );
  assert.strictEqual(scenario.gateway.events.size, 1);
});

test('F015_CALENDAR_CREATE_THEN_OUTBOX_FINGERPRINT_CONFLICT', () => {
  const scenario = makeScenario('calendar-cas-outbox');
  runInjectedConflict(scenario, mutateOutboxAfterExternalSuccess);

  const replay =
    sandbox.WorkOsCalendarSync.processNextJob(scenario.options);
  assert.strictEqual(replay.processed_count, 1);
  assert.strictEqual(replay.result.status, 'DONE');
  assert.strictEqual(
    scenario.gateway.calls.eventInsert,
    1,
    'outbox replay inserted a duplicate Calendar Event'
  );
  assert.strictEqual(scenario.gateway.events.size, 1);
});

test('F015_CALENDAR_CREATE_THEN_TASK_BECOMES_INELIGIBLE', () => {
  const scenario = makeScenario('calendar-cas-excluded');
  const conflict = runInjectedConflict(
    scenario,
    excludeTaskAndEnqueueCurrentState
  );
  assert.strictEqual(conflict.recovery_scheduled, true);
  assert.strictEqual(conflict.recovery_action, 'DELETE');
  const recoveryOutbox =
    runtime.outboxRecords(scenario.spreadsheet)[0];
  assert.strictEqual(recoveryOutbox.status, 'PENDING');
  assert.strictEqual(recoveryOutbox.desired_action, 'DELETE');
  assert.strictEqual(
    recoveryOutbox.event_id.length > 0,
    true,
    'created Event ID was not retained for compensation'
  );
  const recoveryTask = sandbox.WorkOsTaskRepository.findByTaskId(
    sandbox.WorkOsTaskRepository.createContext(scenario.taskSheet),
    scenario.task.task_id
  );
  assert.strictEqual(recoveryTask.excluded, true);
  assert.strictEqual(recoveryTask.status, 'EXCLUDED');
  assert.strictEqual(
    recoveryTask.calendar_sync_status,
    'DELETE_PENDING'
  );

  const replay =
    sandbox.WorkOsCalendarSync.processNextJob(scenario.options);
  assert.strictEqual(replay.processed_count, 1);
  assert.strictEqual(replay.result.status, 'DONE');
  assert.strictEqual(replay.result.action, 'DELETE');
  assert.strictEqual(scenario.gateway.calls.eventInsert, 1);
  assert.strictEqual(scenario.gateway.calls.eventDelete, 1);
  assert.strictEqual(
    scenario.gateway.events.size,
    0,
    'compensation replay left an orphan Calendar Event'
  );
});

test('F015_STANDALONE_WORKER_REPORTS_REQUEUED_CONFLICT', () => {
  const scenario = makeScenario('calendar-cas-worker-report');
  const originalInsert =
    scenario.gateway.insertEvent.bind(scenario.gateway);
  let injected = false;
  scenario.gateway.insertEvent = (calendarId, resource) => {
    const result = originalInsert(calendarId, resource);
    if (!injected) {
      injected = true;
      excludeTaskAndEnqueueCurrentState(scenario);
    }
    return result;
  };

  const result = sandbox.WorkOsWorker.syncPendingCalendarJobs({
    spreadsheet: scenario.spreadsheet,
    calendar_gateway: scenario.gateway,
    calendar_properties: scenario.options.properties,
    properties: scenario.options.properties,
    instance_id: scenario.gateway.instanceId,
    now: scenario.clock.now,
    budget: runtime.fixedBudget(false)
  });
  assert.strictEqual(result.status, 'PAUSED');
  assert.strictEqual(
    result.note,
    'E_CALENDAR_CAS_CONFLICT_REQUEUED'
  );
  assert.strictEqual(result.processed_count, 0);
  assert.strictEqual(result.error_count, 0);
  assert.strictEqual(
    result.external_services.calendar,
    'ADVANCED_CALENDAR_SERVICE'
  );
  const recoveryOutbox =
    runtime.outboxRecords(scenario.spreadsheet)[0];
  assert.strictEqual(recoveryOutbox.status, 'PENDING');
  assert.strictEqual(recoveryOutbox.desired_action, 'DELETE');
  assert.strictEqual(scenario.gateway.events.size, 1);
});

test('F015_CALENDAR_DELETE_THEN_TASK_BECOMES_ELIGIBLE', () => {
  const scenario = makeScenario('calendar-cas-delete-recreate');
  const initial =
    sandbox.WorkOsCalendarSync.processNextJob(scenario.options);
  assert.strictEqual(initial.result.action, 'CREATE');
  assert.strictEqual(scenario.gateway.events.size, 1);

  excludeTaskAndEnqueueCurrentState(scenario);
  let outbox = runtime.outboxRecords(scenario.spreadsheet)[0];
  assert.strictEqual(outbox.status, 'PENDING');
  assert.strictEqual(outbox.desired_action, 'DELETE');

  const prepared =
    sandbox.WorkOsCalendarSync.prepareNextJob(scenario.options);
  const execution =
    sandbox.WorkOsCalendarSync.executePreparedJob(
      prepared,
      scenario.options
    );
  assert.strictEqual(execution.status, 'EXECUTED');
  assert.strictEqual(execution.result.action, 'DELETE');
  assert.strictEqual(scenario.gateway.events.size, 0);

  includeTaskAndEnqueueCurrentState(scenario);
  const conflict = sandbox.WorkOsCalendarSync.commitPreparedJob(
    prepared,
    execution,
    scenario.options
  );
  assert.strictEqual(conflict.status, 'CONFLICT');
  assert.strictEqual(conflict.recovery_scheduled, true);
  assert.strictEqual(conflict.recovery_action, 'CREATE');
  outbox = runtime.outboxRecords(scenario.spreadsheet)[0];
  assert.strictEqual(outbox.status, 'PENDING');
  assert.strictEqual(outbox.desired_action, 'CREATE');
  assert.strictEqual(outbox.event_id, '');

  const replay =
    sandbox.WorkOsCalendarSync.processNextJob(scenario.options);
  assert.strictEqual(replay.processed_count, 1);
  assert.strictEqual(replay.result.action, 'CREATE');
  assert.strictEqual(scenario.gateway.calls.eventInsert, 2);
  assert.strictEqual(scenario.gateway.calls.eventDelete, 1);
  assert.strictEqual(
    scenario.gateway.events.size,
    1,
    'delete/recreate reconciliation did not converge to one Event'
  );
});

test('F016_AUTHORITY_LOST_AFTER_PREPARE_BEFORE_EXECUTE_HAS_NO_EXTERNAL_IO', () => {
  const scenario = makeScenario('calendar-authority-before-execute');
  const prepared = sandbox.WorkOsCalendarSync.prepareNextJob(scenario.options);
  assert.strictEqual(prepared.status, 'READY');

  orphanTaskAndMarkLedger(scenario);
  const execution = sandbox.WorkOsCalendarSync.executePreparedJob(
    prepared,
    scenario.options
  );
  assert.strictEqual(execution.status, 'SKIPPED_AUTHORITY_EXCLUDED');
  assert.strictEqual(scenario.gateway.calls.getCalendar, 0);
  assert.strictEqual(scenario.gateway.calls.eventGet, 0);
  assert.strictEqual(scenario.gateway.calls.eventFind, 0);
  assert.strictEqual(scenario.gateway.calls.eventInsert, 0);
  assert.strictEqual(scenario.gateway.calls.eventUpdate, 0);
  assert.strictEqual(scenario.gateway.calls.eventDelete, 0);

  const committed = sandbox.WorkOsCalendarSync.commitPreparedJob(
    prepared,
    execution,
    scenario.options
  );
  assert.strictEqual(committed.status, 'CONFLICT');
  assert.strictEqual(committed.recovery_scheduled, false);
  assert.strictEqual(committed.recovery_action, '');
  const outbox = runtime.outboxRecords(scenario.spreadsheet)[0];
  assert.strictEqual(outbox.status, 'CANCELLED');
  assert.strictEqual(
    outbox.error_code,
    'E_CALENDAR_TASK_AUTHORITY_EXCLUDED'
  );
  assert.strictEqual(scenario.gateway.events.size, 0);
  assert.strictEqual(scenario.gateway.calls.eventDelete, 0);
  assert.strictEqual(scenario.taskWrites.length, 0);
});

test('F016_AUTHORITY_LOST_AFTER_FINAL_REVALIDATION_COMPENSATES_CREATE', () => {
  const scenario = makeScenario('calendar-authority-after-revalidation');
  const originalInsert = scenario.gateway.insertEvent.bind(scenario.gateway);
  let injected = false;
  scenario.gateway.insertEvent = (calendarId, resource) => {
    if (!injected) {
      injected = true;
      orphanTaskAndMarkLedger(scenario);
    }
    return originalInsert(calendarId, resource);
  };

  const prepared = sandbox.WorkOsCalendarSync.prepareNextJob(scenario.options);
  const execution = sandbox.WorkOsCalendarSync.executePreparedJob(
    prepared,
    scenario.options
  );
  assert.strictEqual(execution.status, 'EXECUTED');
  assert.strictEqual(execution.result.action, 'CREATE');
  assert.strictEqual(scenario.gateway.calls.eventInsert, 1);
  assert.strictEqual(scenario.gateway.events.size, 1);

  const committed = sandbox.WorkOsCalendarSync.commitPreparedJob(
    prepared,
    execution,
    scenario.options
  );
  assert.strictEqual(committed.status, 'CONFLICT');
  assert.strictEqual(committed.recovery_scheduled, true);
  assert.strictEqual(committed.recovery_action, 'DELETE');
  const pending = runtime.outboxRecords(scenario.spreadsheet)[0];
  assert.strictEqual(pending.status, 'PENDING');
  assert.strictEqual(pending.desired_action, 'DELETE');
  assert.strictEqual(
    pending.target_type,
    'DEADLINE_CALENDAR_AUTHORITY_COMPENSATION'
  );
  assert.strictEqual(
    pending.event_id,
    sandbox.WorkOsCalendarSync.deterministicEventId(scenario.task.task_id)
  );

  const replay = sandbox.WorkOsCalendarSync.processNextJob(scenario.options);
  assert.strictEqual(replay.processed_count, 1);
  assert.strictEqual(replay.result.status, 'CANCELLED');
  assert.strictEqual(scenario.gateway.calls.eventInsert, 1);
  assert.strictEqual(scenario.gateway.calls.eventDelete, 1);
  assert.strictEqual(
    scenario.gateway.events.size,
    0,
    'authority-excluded compensation left an orphan Calendar Event'
  );
  assert.strictEqual(scenario.taskWrites.length, 0);
});

test('F016_CRASH_AFTER_CREATE_BEFORE_COMMIT_RECOVERS_FROM_ARMED_OUTBOX', () => {
  const scenario = makeScenario('calendar-authority-crash-after-create');
  const originalInsert = scenario.gateway.insertEvent.bind(scenario.gateway);
  scenario.gateway.insertEvent = (calendarId, resource) => {
    orphanTaskAndMarkLedger(scenario);
    return originalInsert(calendarId, resource);
  };

  const prepared = sandbox.WorkOsCalendarSync.prepareNextJob(scenario.options);
  const execution = sandbox.WorkOsCalendarSync.executePreparedJob(
    prepared,
    scenario.options
  );
  assert.strictEqual(execution.status, 'EXECUTED');
  assert.strictEqual(execution.result.action, 'CREATE');
  assert.strictEqual(scenario.gateway.events.size, 1);
  assert.strictEqual(
    runtime.outboxRecords(scenario.spreadsheet)[0].target_type,
    'DEADLINE_CALENDAR_ARMED'
  );

  /* Simulate abrupt termination: no commit is allowed before claim expiry. */
  scenario.clock.advanceMinutes(11);
  const replay = sandbox.WorkOsCalendarSync.processNextJob(scenario.options);
  assert.strictEqual(replay.processed_count, 1);
  assert.strictEqual(replay.result.status, 'CANCELLED');
  assert.strictEqual(scenario.gateway.calls.eventInsert, 1);
  assert.strictEqual(scenario.gateway.calls.eventDelete, 1);
  assert.strictEqual(scenario.gateway.events.size, 0);
  assert.strictEqual(scenario.taskWrites.length, 0);
});

test('F016_ARMED_CONCURRENT_INELIGIBILITY_CRASH_RECONCILES_EVENT', () => {
  const scenario = makeScenario('calendar-armed-concurrent-ineligibility');
  const originalInsert = scenario.gateway.insertEvent.bind(scenario.gateway);
  let injected = false;
  scenario.gateway.insertEvent = (calendarId, resource) => {
    const result = originalInsert(calendarId, resource);
    if (!injected) {
      injected = true;
      excludeTaskAndEnqueueCurrentState(scenario);
    }
    return result;
  };

  const prepared = sandbox.WorkOsCalendarSync.prepareNextJob(scenario.options);
  const execution = sandbox.WorkOsCalendarSync.executePreparedJob(
    prepared,
    scenario.options
  );
  assert.strictEqual(execution.status, 'EXECUTED');
  assert.strictEqual(execution.result.action, 'CREATE');
  const armed = runtime.outboxRecords(scenario.spreadsheet)[0];
  assert.strictEqual(armed.status, 'PENDING');
  assert.strictEqual(armed.desired_action, 'NOOP');
  assert.strictEqual(armed.target_type, 'DEADLINE_CALENDAR_ARMED');
  assert.strictEqual(
    armed.event_id,
    sandbox.WorkOsCalendarSync.deterministicEventId(scenario.task.task_id)
  );

  /* Simulate abrupt termination after concurrent re-enqueue, before commit. */
  scenario.clock.advanceMinutes(11);
  const replay = sandbox.WorkOsCalendarSync.processNextJob(scenario.options);
  assert.strictEqual(replay.processed_count, 1);
  assert.strictEqual(replay.result.status, 'DONE');
  assert.strictEqual(replay.result.action, 'DELETE');
  assert.strictEqual(scenario.gateway.calls.eventInsert, 1);
  assert.strictEqual(scenario.gateway.calls.eventDelete, 1);
  assert.strictEqual(scenario.gateway.events.size, 0);
  const completed = runtime.outboxRecords(scenario.spreadsheet)[0];
  assert.strictEqual(completed.target_type, 'DEADLINE_CALENDAR');
  assert.strictEqual(completed.status, 'DONE');
});

test('F016_COMPENSATION_REFUSES_FOREIGN_EVENT', () => {
  const scenario = makeScenario('calendar-authority-foreign-event');
  const originalInsert = scenario.gateway.insertEvent.bind(scenario.gateway);
  scenario.gateway.insertEvent = (calendarId, resource) => {
    orphanTaskAndMarkLedger(scenario);
    return originalInsert(calendarId, resource);
  };

  const prepared = sandbox.WorkOsCalendarSync.prepareNextJob(scenario.options);
  const execution = sandbox.WorkOsCalendarSync.executePreparedJob(
    prepared,
    scenario.options
  );
  sandbox.WorkOsCalendarSync.commitPreparedJob(
    prepared,
    execution,
    scenario.options
  );
  scenario.gateway.foreignEvent = true;

  const replay = sandbox.WorkOsCalendarSync.processNextJob(scenario.options);
  assert.strictEqual(replay.processed_count, 1);
  assert.strictEqual(replay.result.status, 'DEAD');
  assert.strictEqual(scenario.gateway.calls.eventDelete, 0);
  assert.strictEqual(scenario.gateway.events.size, 1);
  assert.strictEqual(scenario.taskWrites.length, 0);
  assert.strictEqual(
    runtime.outboxRecords(scenario.spreadsheet)[0].error_code,
    'E_CALENDAR_EVENT_FOREIGN'
  );
  assert.strictEqual(
    runtime.outboxRecords(scenario.spreadsheet)[0].target_type,
    'DEADLINE_CALENDAR_AUTHORITY_COMPENSATION'
  );
});

test('F016_MANUAL_RETRY_PRESERVES_COMPENSATION_TARGET', () => {
  const scenario = makeScenario('calendar-authority-manual-retry');
  const originalInsert = scenario.gateway.insertEvent.bind(scenario.gateway);
  scenario.gateway.insertEvent = (calendarId, resource) => {
    orphanTaskAndMarkLedger(scenario);
    return originalInsert(calendarId, resource);
  };

  const prepared = sandbox.WorkOsCalendarSync.prepareNextJob(scenario.options);
  const execution = sandbox.WorkOsCalendarSync.executePreparedJob(
    prepared,
    scenario.options
  );
  sandbox.WorkOsCalendarSync.commitPreparedJob(
    prepared,
    execution,
    scenario.options
  );
  scenario.gateway.foreignEvent = true;
  const failed = sandbox.WorkOsCalendarSync.processNextJob(scenario.options);
  assert.strictEqual(failed.result.status, 'DEAD');

  sandbox.WorkOsCalendarSync.withLockedOutboxContext(
    scenario.syncSheet,
    (context) => sandbox.WorkOsCalendarSync.requestManualRetryInContext(
      scenario.task.task_id,
      context,
      scenario.clock.now()
    )
  );
  const retried = runtime.outboxRecords(scenario.spreadsheet)[0];
  assert.strictEqual(retried.status, 'RETRY');
  assert.strictEqual(
    retried.target_type,
    'DEADLINE_CALENDAR_AUTHORITY_COMPENSATION'
  );
  assert.strictEqual(retried.error_code, '');
});

const summary = {
  suite: 'prepilot_calendar_cas_failure_injection',
  local_mock: tests.some((item) => item.status === 'FAIL') ? 'FAIL' : 'PASS',
  google_workspace_real: 'NOT_EXECUTED',
  passed: tests.filter((item) => item.status === 'PASS').length,
  failed: tests.filter((item) => item.status === 'FAIL').length,
  tests
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed > 0) {
  process.exitCode = 1;
}
