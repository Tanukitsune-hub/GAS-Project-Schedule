'use strict';

/**
 * Phase 4 Calendar policy/outbox local tests.
 *
 * Production Apps Script is evaluated in a VM with in-memory Sheets,
 * Properties, Lock and Calendar fakes. No Google Workspace API is called.
 */
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repositoryRoot = path.resolve(__dirname, '..');
const appsScriptRoot = path.join(repositoryRoot, 'apps-script-v2');

class FakeRange {
  constructor(sheet, row, column, rowCount = 1, columnCount = 1) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.rowCount = rowCount;
    this.columnCount = columnCount;
    if (
      row < 1 ||
      column < 1 ||
      row + rowCount - 1 > sheet.maxRows ||
      column + columnCount - 1 > sheet.maxColumns
    ) {
      throw new Error('RANGE_OUT_OF_BOUNDS');
    }
  }

  getValues() {
    return Array.from({ length: this.rowCount }, (_, rowOffset) =>
      Array.from({ length: this.columnCount }, (_, columnOffset) =>
        this.sheet.cells[this.row - 1 + rowOffset][
          this.column - 1 + columnOffset
        ]
      )
    );
  }

  setValues(values) {
    assert.strictEqual(values.length, this.rowCount);
    values.forEach((row, rowOffset) => {
      assert.strictEqual(row.length, this.columnCount);
      row.forEach((value, columnOffset) => {
        this.sheet.cells[this.row - 1 + rowOffset][
          this.column - 1 + columnOffset
        ] = value;
      });
    });
    return this;
  }
}

class FakeSheet {
  constructor(name, rows, columns) {
    this.name = name;
    this.maxRows = rows;
    this.maxColumns = columns;
    this.insertedRows = 0;
    this.cells = Array.from({ length: rows }, () =>
      Array.from({ length: columns }, () => '')
    );
  }

  getName() {
    return this.name;
  }

  getRange(row, column, rowCount = 1, columnCount = 1) {
    return new FakeRange(this, row, column, rowCount, columnCount);
  }

  getMaxRows() {
    return this.maxRows;
  }

  getMaxColumns() {
    return this.maxColumns;
  }

  insertRowsAfter(after, count) {
    assert.strictEqual(after, this.maxRows);
    for (let index = 0; index < count; index += 1) {
      this.cells.push(Array.from({ length: this.maxColumns }, () => ''));
    }
    this.maxRows += count;
    this.insertedRows += count;
  }
}

let globalLockHeld = false;
let lockAvailable = true;
const scriptProperties = new Map();
const sandbox = {
  console,
  Date,
  JSON,
  Math,
  Number,
  Object,
  String,
  Boolean,
  Array,
  Error,
  RegExp,
  Utilities: {
    getUuid: () => crypto.randomUUID(),
    computeDigest: (_algorithm, value) =>
      Array.from(
        crypto.createHash('sha256').update(String(value), 'utf8').digest()
      ).map((byte) => (byte > 127 ? byte - 256 : byte)),
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    Charset: { UTF_8: 'UTF_8' },
    formatDate: (date, timezone) => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(date);
      const fields = Object.fromEntries(
        parts.map((part) => [part.type, part.value])
      );
      return `${fields.year}-${fields.month}-${fields.day}`;
    }
  },
  LockService: {
    getScriptLock: () => {
      let owned = false;
      return {
        tryLock: () => {
          if (!lockAvailable || globalLockHeld) {
            return false;
          }
          owned = true;
          globalLockHeld = true;
          return true;
        },
        hasLock: () => owned && globalLockHeld,
        releaseLock: () => {
          if (owned) {
            owned = false;
            globalLockHeld = false;
          }
        }
      };
    }
  },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: (key) =>
        scriptProperties.has(String(key))
          ? scriptProperties.get(String(key))
          : null,
      setProperty: (key, value) => {
        scriptProperties.set(String(key), String(value));
        return sandbox.PropertiesService.getScriptProperties();
      },
      deleteProperty: (key) => {
        scriptProperties.delete(String(key));
        return sandbox.PropertiesService.getScriptProperties();
      }
    })
  }
};
vm.createContext(sandbox);

[
  '00_Config.gs',
  '01_TypesAndSchemas.gs',
  '17_Utilities.gs',
  '10_CalendarSync.gs'
].forEach((fileName) => {
  vm.runInContext(
    fs.readFileSync(path.join(appsScriptRoot, fileName), 'utf8'),
    sandbox,
    { filename: fileName }
  );
});

function makeOutboxSheet(rows = 100) {
  const ids = Array.from(sandbox.WorkOsCalendarSync.OUTBOX_IDS);
  const sheet = new FakeSheet(
    sandbox.WorkOsConfig.SHEETS.SYNC_STATE,
    rows,
    ids.length
  );
  const schema = sandbox.WorkOsSchemas.getSheetSchema(
    sandbox.WorkOsConfig.SHEETS.SYNC_STATE
  );
  sheet.getRange(1, 1, 1, ids.length).setValues([ids]);
  sheet.getRange(2, 1, 1, ids.length).setValues([
    Array.from(schema, (column) => column.header)
  ]);
  return sheet;
}

function properties() {
  return sandbox.PropertiesService.getScriptProperties();
}

function task(overrides = {}) {
  return {
    task_id: overrides.task_id || `tsk_${'1'.repeat(32)}`,
    task_title: 'Synthetic formal deadline',
    status: 'OPEN',
    needs_review: false,
    review_state: 'NONE',
    completed: false,
    excluded: false,
    due_date: '2026-08-15',
    suggested_due_date: '',
    deadline_basis: 'EXPLICIT',
    calendar_sync_mode: 'AUTO',
    calendar_category: 'EXTERNAL_SUBMISSION',
    calendar_importance: 'HIGH',
    calendar_event_id: '',
    calendar_sync_status: 'NOT_REQUIRED',
    sender: 'sender@example.invalid',
    subject: 'Synthetic source subject',
    source_email: 'https://example.invalid/synthetic-reference',
    ...overrides
  };
}

class FakeCalendarGateway {
  constructor(options = {}) {
    this.calendarId = options.calendar_id || 'cal_synthetic_dedicated';
    this.calendars = new Map();
    this.calendars.set(this.calendarId, {
      id: this.calendarId,
      summary: sandbox.WorkOsConfig.DEADLINE_CALENDAR_NAME,
      accessRole: 'owner',
      description: '[WORKOS_INSTANCE_ID:ins_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa]'
    });
    this.matches = options.matches || [];
    this.primaryIds = new Set(options.primary_ids || []);
    this.events = new Map();
    this.calls = {
      listCalendars: 0,
      calendarGet: 0,
      calendarCreate: 0,
      eventGet: 0,
      eventFind: 0,
      eventInsert: 0,
      eventUpdate: 0,
      eventDelete: 0
    };
    this.insertFailures = Number(options.insert_failures || 0);
  }

  listCalendarsBySummary() {
    this.calls.listCalendars += 1;
    return this.matches.map((item) => ({ ...item }));
  }

  getCalendar(id) {
    this.calls.calendarGet += 1;
    const item = this.calendars.get(String(id));
    return item ? { ...item } : null;
  }

  createCalendar(summary, instanceId) {
    this.calls.calendarCreate += 1;
    const resource = {
      id: this.calendarId,
      summary,
      timeZone: 'Asia/Tokyo',
      accessRole: 'owner',
      description: `[WORKOS_INSTANCE_ID:${instanceId}]`
    };
    this.calendars.set(this.calendarId, resource);
    return { ...resource };
  }

  isPrimaryCalendar(id, resource) {
    return (
      String(id).toLowerCase() === 'primary' ||
      this.primaryIds.has(String(id)) ||
      Boolean(resource && resource.primary)
    );
  }

  getCalendarAccessRole(id) {
    const item = this.calendars.get(String(id));
    return item && item.accessRole || '';
  }

  getEvent(_calendarId, eventId) {
    this.calls.eventGet += 1;
    const event = this.events.get(String(eventId));
    return event ? structuredClone(event) : null;
  }

  findEventsByTaskMarker(_calendarId, taskId, dueDate) {
    this.calls.eventFind += 1;
    assert.match(dueDate, /^\d{4}-\d{2}-\d{2}$/);
    return Array.from(this.events.values())
      .filter((event) => {
        const privateFields =
          event.extendedProperties &&
          event.extendedProperties.private || {};
        return privateFields.workosTaskId === taskId;
      })
      .map((event) => structuredClone(event));
  }

  insertEvent(calendarId, resource) {
    this.calls.eventInsert += 1;
    assert.strictEqual(calendarId, this.calendarId);
    if (this.insertFailures > 0) {
      this.insertFailures -= 1;
      throw new sandbox.WorkOsAppError(
        'E_CALENDAR_API_CREATE',
        'CALENDAR_SYNC',
        true,
        'Synthetic retryable Calendar failure'
      );
    }
    if (this.events.has(resource.id)) {
      const conflict = new Error('Synthetic conflict');
      conflict.status = 409;
      throw conflict;
    }
    this.events.set(resource.id, structuredClone(resource));
    return structuredClone(resource);
  }

  updateEvent(calendarId, eventId, resource) {
    this.calls.eventUpdate += 1;
    assert.strictEqual(calendarId, this.calendarId);
    assert.strictEqual(this.events.has(String(eventId)), true);
    const output = { ...structuredClone(resource), id: String(eventId) };
    this.events.set(String(eventId), output);
    return structuredClone(output);
  }

  deleteEvent(calendarId, eventId) {
    this.calls.eventDelete += 1;
    assert.strictEqual(calendarId, this.calendarId);
    return this.events.delete(String(eventId));
  }
}

function prepare(gateway = new FakeCalendarGateway()) {
  const sheet = makeOutboxSheet();
  const mutableTask = task();
  scriptProperties.set(
    sandbox.WorkOsConfig.PROPERTIES.INSTANCE_ID,
    'ins_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  );
  scriptProperties.set(
    sandbox.WorkOsConfig.PROPERTIES.DEADLINE_CALENDAR_ID,
    gateway.calendarId
  );
  const taskWrites = [];
  const options = {
    sheet,
    gateway,
    properties: properties(),
    instance_id: 'ins_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    timezone: sandbox.WorkOsConfig.TIMEZONE,
    task_reader: () => ({ ...mutableTask }),
    task_writer: (_taskId, patch) => {
      taskWrites.push({ ...patch });
      Object.assign(mutableTask, patch);
    },
    now: new Date('2026-07-24T00:00:00.000Z'),
    budget: { isExhausted: () => false }
  };
  return { sheet, gateway, mutableTask, taskWrites, options };
}

function enqueue(state, force = false) {
  return sandbox.WorkOsCalendarSync.enqueueTask(state.mutableTask, {
    sheet: state.sheet,
    now: state.options.now,
    timezone: state.options.timezone,
    force_enqueue: force
  });
}

function processJob(state, now) {
  return sandbox.WorkOsCalendarSync.processNextPendingJob({
    ...state.options,
    now: now || state.options.now
  });
}

function outboxRecord(state) {
  const context = sandbox.WorkOsCalendarSync.createOutboxContext(state.sheet);
  return sandbox.WorkOsCalendarSync.readOutboxRow(
    context,
    context.logicalRows[0]
  );
}

function managedEvent(state) {
  return Array.from(state.gateway.events.values())[0] || null;
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
      safe_message: sandbox.WorkOsUtilities.redact(error.message)
    });
  } finally {
    scriptProperties.clear();
    globalLockHeld = false;
    lockAvailable = true;
  }
}

test('P4-U01_ELIGIBLE_TASK_CREATES_ONE_EVENT', () => {
  const state = prepare();
  assert.strictEqual(enqueue(state).desired_action, 'CREATE');
  const result = processJob(state);
  assert.strictEqual(result.result.action, 'CREATE');
  assert.strictEqual(state.gateway.events.size, 1);
  assert.strictEqual(state.mutableTask.calendar_sync_status, 'SYNCED');
  assert.match(
    state.mutableTask.calendar_event_id,
    /^[a-v0-9]{5,1024}$/
  );
  assert.match(state.mutableTask.calendar_event_id, /^v2d[0-9a-f]{40}$/);
  assert.strictEqual(state.mutableTask.calendar_event_id.includes('w'), false);
});

test('P4-U02_AI_SUGGESTED_ONLY_IS_NOT_ELIGIBLE', () => {
  const value = task({
    due_date: '',
    suggested_due_date: '2026-08-15',
    deadline_basis: 'INFERRED'
  });
  assert.strictEqual(
    sandbox.WorkOsCalendarSync.isEligibleTask(value, 'Asia/Tokyo'),
    false
  );
  assert.strictEqual(
    sandbox.WorkOsCalendarSync.initialDesiredActionForTask(
      value,
      'Asia/Tokyo'
    ),
    'NOOP'
  );
});

test('P4-U03_REVIEW_TASK_IS_NOT_CREATED', () => {
  [
    task({ needs_review: true }),
    task({ review_state: 'OPEN' }),
    task({ status: 'REVIEW' })
  ].forEach((value) => {
    assert.strictEqual(
      sandbox.WorkOsCalendarSync.isEligibleTask(value, 'Asia/Tokyo'),
      false
    );
  });
});

test('P4-U03B_RELATIVE_DEADLINE_REQUIRES_ACCEPTED_DECISION', () => {
  const unresolved = task({
    deadline_basis: 'RELATIVE',
    calendar_sync_mode: 'FORCE',
    review_state: 'NONE',
    decision: 'NONE'
  });
  assert.strictEqual(
    sandbox.WorkOsCalendarSync.isEligibleTask(unresolved, 'Asia/Tokyo'),
    false
  );
  assert.strictEqual(
    sandbox.WorkOsCalendarSync.initialDesiredActionForTask(
      unresolved,
      'Asia/Tokyo'
    ),
    'NOOP'
  );

  const accepted = task({
    deadline_basis: 'RELATIVE',
    calendar_sync_mode: 'FORCE',
    review_state: 'APPLIED',
    decision: 'ACCEPT'
  });
  assert.strictEqual(
    sandbox.WorkOsCalendarSync.isEligibleTask(accepted, 'Asia/Tokyo'),
    true
  );

  const rejected = task({
    status: 'EXCLUDED',
    excluded: true,
    deadline_basis: 'RELATIVE',
    calendar_sync_mode: 'FORCE',
    review_state: 'REJECTED',
    decision: 'REJECT'
  });
  assert.strictEqual(
    sandbox.WorkOsCalendarSync.isEligibleTask(rejected, 'Asia/Tokyo'),
    false
  );
});

test('P4-U04_DUE_CHANGE_UPDATES_SAME_EVENT', () => {
  const state = prepare();
  enqueue(state);
  processJob(state);
  const firstId = state.mutableTask.calendar_event_id;
  state.mutableTask.due_date = '2026-08-20';
  enqueue(state, true);
  const result = processJob(state, new Date('2026-07-24T00:01:00.000Z'));
  assert.strictEqual(result.result.action, 'UPDATE');
  assert.strictEqual(state.gateway.events.size, 1);
  assert.strictEqual(state.mutableTask.calendar_event_id, firstId);
  assert.strictEqual(managedEvent(state).start.date, '2026-08-20');
});

test('P4-U05_DONE_DELETES_EVENT', () => {
  const state = prepare();
  enqueue(state);
  processJob(state);
  state.mutableTask.status = 'DONE';
  state.mutableTask.completed = true;
  enqueue(state, true);
  const result = processJob(state, new Date('2026-07-24T00:02:00.000Z'));
  assert.strictEqual(result.result.action, 'DELETE');
  assert.strictEqual(state.gateway.events.size, 0);
  assert.strictEqual(state.mutableTask.calendar_event_id, '');
  assert.strictEqual(state.mutableTask.calendar_sync_status, 'NOT_REQUIRED');
});

test('P4-U06_EXCLUDED_DELETES_EVENT', () => {
  const state = prepare();
  enqueue(state);
  processJob(state);
  state.mutableTask.status = 'EXCLUDED';
  state.mutableTask.excluded = true;
  enqueue(state, true);
  processJob(state, new Date('2026-07-24T00:02:00.000Z'));
  assert.strictEqual(state.gateway.calls.eventDelete, 1);
  assert.strictEqual(state.gateway.events.size, 0);
});

test('P4-U07_CANCELLED_OR_MODE_NONE_DELETES_EVENT', () => {
  ['CANCELLED', 'NONE'].forEach((condition, index) => {
    const state = prepare();
    state.mutableTask.task_id = `tsk_${String(index + 2).repeat(32)}`;
    enqueue(state);
    processJob(state);
    if (condition === 'CANCELLED') {
      state.mutableTask.status = 'CANCELLED';
    } else {
      state.mutableTask.calendar_sync_mode = 'NONE';
    }
    enqueue(state, true);
    processJob(state, new Date('2026-07-24T00:03:00.000Z'));
    assert.strictEqual(state.gateway.events.size, 0);
  });
});

test('P4-U08_CREATE_REPLAY_DOES_NOT_DUPLICATE', () => {
  const state = prepare();
  enqueue(state);
  processJob(state);
  const firstId = state.mutableTask.calendar_event_id;
  const steadyReplay = enqueue(state);
  assert.strictEqual(steadyReplay.operation, 'NOOP');
  assert.strictEqual(steadyReplay.status, 'DONE');
  assert.strictEqual(processJob(state).status, 'IDLE');
  enqueue(state, true);
  const replay = processJob(state, new Date('2026-07-24T00:04:00.000Z'));
  assert.strictEqual(replay.result.action, 'NOOP');
  assert.strictEqual(state.gateway.calls.eventInsert, 1);
  assert.strictEqual(state.gateway.events.size, 1);
  assert.strictEqual(state.mutableTask.calendar_event_id, firstId);
});

test('P4-U09_FAILURE_USES_THREE_DELAYS_THEN_DEAD', () => {
  const state = prepare(new FakeCalendarGateway({ insert_failures: 4 }));
  let aiCalls = 0;
  state.options.ai_adapter = { classify: () => { aiCalls += 1; } };
  enqueue(state);
  let result = processJob(state);
  assert.strictEqual(result.result.status, 'RETRY');
  assert.strictEqual(result.result.retry_count, 1);
  let record = outboxRecord(state);
  assert.strictEqual(record.status, 'RETRY');
  assert.strictEqual(
    new Date(record.next_retry_at).toISOString(),
    '2026-07-24T00:05:00.000Z'
  );
  result = processJob(state, new Date('2026-07-24T00:05:00.001Z'));
  assert.strictEqual(result.result.status, 'RETRY');
  assert.strictEqual(result.result.retry_count, 2);
  result = processJob(state, new Date('2026-07-24T00:20:00.002Z'));
  assert.strictEqual(result.result.status, 'RETRY');
  assert.strictEqual(result.result.retry_count, 3);
  record = outboxRecord(state);
  assert.strictEqual(
    new Date(record.next_retry_at).toISOString(),
    '2026-07-24T01:20:00.002Z'
  );
  result = processJob(state, new Date('2026-07-24T01:20:00.003Z'));
  assert.strictEqual(result.result.status, 'DEAD');
  assert.strictEqual(result.result.retry_count, 3);
  assert.strictEqual(aiCalls, 0);
  assert.strictEqual(state.gateway.calls.eventInsert, 4);
  const automaticReplay = enqueue(state);
  assert.strictEqual(automaticReplay.operation, 'NOOP');
  assert.strictEqual(automaticReplay.status, 'DEAD');
});

test('P4-U10_RETRY_DOES_NOT_CALL_AI_OR_REWRITE_BUSINESS_FIELDS', () => {
  const state = prepare(new FakeCalendarGateway({ insert_failures: 1 }));
  const originalTitle = state.mutableTask.task_title;
  enqueue(state);
  processJob(state);
  processJob(state, new Date('2026-07-24T00:05:00.001Z'));
  assert.strictEqual(state.mutableTask.task_title, originalTitle);
  assert.strictEqual(state.gateway.events.size, 1);
  state.taskWrites.forEach((patch) => {
    Object.keys(patch).forEach((field) => {
      assert.strictEqual(
        [
          'calendar_event_id',
          'calendar_sync_status',
          'last_calendar_sync_at'
        ].includes(field),
        true
      );
    });
  });
  assert.strictEqual(state.taskWrites[0].calendar_sync_status, 'PENDING');
  assert.strictEqual(
    Object.hasOwn(state.taskWrites[0], 'last_calendar_sync_at'),
    false
  );
});

test('P4-U11_DUPLICATE_CALENDAR_NAME_STOPS_WITHOUT_CREATION', () => {
  const gateway = new FakeCalendarGateway({
    matches: [
      { id: 'cal_duplicate_a', summary: '閾ｪ蜍墓悄譌･邂｡逅・ },
      { id: 'cal_duplicate_b', summary: '閾ｪ蜍墓悄譌･邂｡逅・ }
    ]
  });
  scriptProperties.set(
    sandbox.WorkOsConfig.PROPERTIES.INSTANCE_ID,
    'ins_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  );
  assert.throws(
    () => sandbox.WorkOsCalendarSync.ensureDedicatedCalendar({
      gateway,
      properties: properties()
    }),
    (error) => error.code === 'E_CALENDAR_DUPLICATE_NAME'
  );
  assert.strictEqual(gateway.calls.calendarCreate, 0);
});

test('P4-U12_PRIMARY_AND_FOREIGN_EVENT_ARE_NEVER_MODIFIED', () => {
  const primary = new FakeCalendarGateway({
    matches: [{ id: 'primary', summary: '閾ｪ蜍墓悄譌･邂｡逅・, primary: true }],
    primary_ids: ['primary']
  });
  scriptProperties.set(
    sandbox.WorkOsConfig.PROPERTIES.INSTANCE_ID,
    'ins_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  );
  assert.throws(
    () => sandbox.WorkOsCalendarSync.ensureDedicatedCalendar({
      gateway: primary,
      properties: properties()
    }),
    (error) => error.code === 'E_CALENDAR_PRIMARY_FORBIDDEN'
  );
  assert.strictEqual(primary.calls.calendarCreate, 0);

  const state = prepare();
  const foreign = sandbox.WorkOsCalendarSync.buildEventResource(
    state.mutableTask,
    'ins_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    'Asia/Tokyo'
  );
  state.gateway.events.set(foreign.id, foreign);
  state.mutableTask.calendar_event_id = foreign.id;
  enqueue(state);
  const outcome = processJob(state);
  assert.strictEqual(outcome.result.status, 'DEAD');
  assert.strictEqual(outcome.result.error_code, 'E_CALENDAR_EVENT_FOREIGN');
  assert.strictEqual(state.gateway.calls.eventUpdate, 0);
  assert.strictEqual(state.gateway.calls.eventDelete, 0);
});

test('P4-U13_DESCRIPTION_AND_SOURCE_CONTAIN_NO_BODY_OR_CREDENTIAL', () => {
  const value = task({
    sender: '<b>sender</b> password=super-secret',
    subject: '<script>private body</script>',
    source_email:
      'https://example.invalid/ref?access_token=top-secret-value'
  });
  const event = sandbox.WorkOsCalendarSync.buildEventResource(
    value,
    'ins_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'Asia/Tokyo'
  );
  const text = JSON.stringify(event);
  [
    '<script>',
    '<b>',
    'super-secret',
    'top-secret-value',
    'password='
  ].forEach((forbidden) => {
    assert.strictEqual(text.includes(forbidden), false);
  });
  assert.strictEqual(Object.hasOwn(event, 'attendees'), false);
  assert.strictEqual(event.visibility, 'private');
  assert.strictEqual(event.transparency, 'transparent');
  assert.match(event.description, /\[WORKOS_TASK_ID:tsk_/);
  assert.match(
    event.description,
    /\[WORKOS_INSTANCE_ID:ins_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\]/
  );
});

test('P4-U13B_DEADLINE_BASIS_IS_LOCALIZED_IN_EVENT_DESCRIPTION', () => {
  [
    ['EXPLICIT', '譏守､ｺ'],
    ['RELATIVE', '逶ｸ蟇ｾ'],
    ['MANUAL_CONFIRMED', '謇句虚遒ｺ隱・]
  ].forEach(([basis, label]) => {
    const event = sandbox.WorkOsCalendarSync.buildEventResource(
      task({ deadline_basis: basis }),
      'ins_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'Asia/Tokyo'
    );
    assert.match(event.description, new RegExp(`譛滄剞譬ｹ諡: ${label}`));
    assert.strictEqual(event.description.includes(`譛滄剞譬ｹ諡: ${basis}`), false);
  });
});

test('P4-U14_TIMEZONE_AND_EXCLUSIVE_END_DATE_ARE_CORRECT', () => {
  const instant = new Date('2026-07-24T15:30:00.000Z');
  assert.strictEqual(
    sandbox.WorkOsCalendarSync.isoDate(instant, 'Asia/Tokyo'),
    '2026-07-25'
  );
  const event = sandbox.WorkOsCalendarSync.buildEventResource(
    task({ due_date: instant }),
    'ins_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'Asia/Tokyo'
  );
  assert.strictEqual(event.start.date, '2026-07-25');
  assert.strictEqual(event.end.date, '2026-07-26');
});

test('P4-G01_OUTBOX_SCHEMA_LOCK_UNIQUENESS_AND_100_ROW_EXPANSION', () => {
  const sheet = makeOutboxSheet();
  assert.deepStrictEqual(
    JSON.stringify(Array.from(sandbox.WorkOsCalendarSync.OUTBOX_IDS)),
    JSON.stringify(sandbox.WorkOsSchemas.getInternalIds(
      sandbox.WorkOsConfig.SHEETS.SYNC_STATE
    ))
  );
  assert.throws(
    () => sandbox.WorkOsCalendarSync.enqueueTaskInContext(
      task(),
      sandbox.WorkOsCalendarSync.createOutboxContext(sheet),
      {}
    ),
    (error) => error.code === 'E_LOCK_REQUIRED'
  );
  assert.throws(
    () => sandbox.WorkOsCalendarSync.createOutboxContextForHeldLock(
      sheet,
      {}
    ),
    (error) => error.code === 'E_LOCK_REQUIRED'
  );
  sandbox.WorkOsCalendarSync.withLockedOutboxContext(sheet, (context) => {
    for (let index = 0; index < 99; index += 1) {
      const value = task({
        task_id: `tsk_${index.toString(16).padStart(32, '0')}`
      });
      sandbox.WorkOsCalendarSync.enqueueTaskInContext(value, context, {
        now: new Date('2026-07-24T00:00:00.000Z')
      });
    }
  });
  assert.strictEqual(sheet.getMaxRows(), 200);
  assert.strictEqual(sheet.insertedRows, 100);
  const context = sandbox.WorkOsCalendarSync.createOutboxContext(sheet);
  assert.strictEqual(context.logicalRows.length, 99);
  assert.strictEqual(Object.keys(context.byTaskId).length, 99);
});

test('P4-G02_ADVANCED_GATEWAY_IS_BOUNDED_AND_SENDS_NO_INVITES', () => {
  const source = fs.readFileSync(
    path.join(appsScriptRoot, '10_CalendarSync.gs'),
    'utf8'
  );
  assert.strictEqual(/\bCalendarApp\b/.test(source), false);
  assert.strictEqual(/getDefaultCalendar|getCalendarById/.test(source), false);
  assert.match(source, /privateExtendedProperty/);
  assert.match(source, /maxResults:\s*10/);
  assert.match(source, /sendUpdates:\s*'none'/);
  assert.match(source, /visibility:\s*'private'/);
  assert.match(source, /transparency:\s*'transparent'/);
});

test('P4-G03_INSPECTION_AND_PUBLIC_RESULTS_NEVER_EXPOSE_CALENDAR_ID', () => {
  const gateway = new FakeCalendarGateway();
  scriptProperties.set(
    sandbox.WorkOsConfig.PROPERTIES.INSTANCE_ID,
    'ins_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  );
  const ensured = sandbox.WorkOsCalendarSync.ensureDedicatedCalendar({
    gateway,
    properties: properties()
  });
  const inspected =
    sandbox.WorkOsCalendarSync.inspectDedicatedCalendarConfiguration({
      gateway,
      properties: properties(),
      verify_remote: true
    });
  assert.strictEqual(inspected.status, 'CONFIGURED');
  assert.strictEqual(inspected.remotely_verified, true);
  [ensured, inspected].forEach((result) => {
    assert.strictEqual(JSON.stringify(result).includes(gateway.calendarId), false);
    assert.strictEqual(Object.keys(result).some((key) => /id/i.test(key)), false);
  });
});

test('P4-G04_S60_LOCK_INSTANCE_OWNER_AND_INSTANCE_MARKER_GUARDS', () => {
  const createdGateway = new FakeCalendarGateway();
  const created = sandbox.WorkOsCalendarSync.ensureDedicatedCalendar({
    gateway: createdGateway,
    properties: properties()
  });
  assert.strictEqual(created.status, 'CREATED');
  assert.match(
    properties().getProperty(sandbox.WorkOsConfig.PROPERTIES.INSTANCE_ID),
    /^ins_[0-9a-f]{32}$/
  );
  assert.strictEqual(
    createdGateway.calendars.get(createdGateway.calendarId).timeZone,
    'Asia/Tokyo'
  );

  scriptProperties.clear();
  scriptProperties.set(
    sandbox.WorkOsConfig.PROPERTIES.INSTANCE_ID,
    'ins_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  );
  const adoptedGateway = new FakeCalendarGateway();
  adoptedGateway.matches = [{
    id: adoptedGateway.calendarId,
    summary: '閾ｪ蜍墓悄譌･邂｡逅・,
    accessRole: 'owner'
  }];
  const adopted = sandbox.WorkOsCalendarSync.ensureDedicatedCalendar({
    gateway: adoptedGateway,
    properties: properties()
  });
  assert.strictEqual(adopted.status, 'RESOLVED_PROVEN');
  assert.strictEqual(adoptedGateway.calls.calendarCreate, 0);

  scriptProperties.delete(
    sandbox.WorkOsConfig.PROPERTIES.DEADLINE_CALENDAR_ID
  );
  const foreignGateway = new FakeCalendarGateway();
  foreignGateway.matches = [{
    id: foreignGateway.calendarId,
    summary: '閾ｪ蜍墓悄譌･邂｡逅・,
    accessRole: 'owner'
  }];
  foreignGateway.calendars.get(foreignGateway.calendarId).description =
    '[WORKOS_INSTANCE_ID:ins_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb]';
  assert.throws(
    () => sandbox.WorkOsCalendarSync.ensureDedicatedCalendar({
      gateway: foreignGateway,
      properties: properties()
    }),
    (error) => error.code === 'E_CALENDAR_INSTANCE_MISMATCH'
  );
  assert.strictEqual(foreignGateway.calls.calendarCreate, 0);

  scriptProperties.delete(
    sandbox.WorkOsConfig.PROPERTIES.DEADLINE_CALENDAR_ID
  );
  const readOnlyGateway = new FakeCalendarGateway();
  readOnlyGateway.matches = [{
    id: readOnlyGateway.calendarId,
    summary: '閾ｪ蜍墓悄譌･邂｡逅・,
    accessRole: 'reader'
  }];
  assert.throws(
    () => sandbox.WorkOsCalendarSync.ensureDedicatedCalendar({
      gateway: readOnlyGateway,
      properties: properties()
    }),
    (error) => error.code === 'E_CALENDAR_OWNER_REQUIRED'
  );
  assert.strictEqual(readOnlyGateway.calls.calendarCreate, 0);

  lockAvailable = false;
  assert.throws(
    () => sandbox.WorkOsCalendarSync.ensureDedicatedCalendar({
      gateway: new FakeCalendarGateway(),
      properties: properties()
    }),
    (error) => error.code === 'E_LOCK_TIMEOUT'
  );
});

test('P4-G05_MISSING_EVENT_ID_AND_DATE_STOPS_UNBOUNDED_RECOVERY', () => {
  const state = prepare();
  Object.assign(state.mutableTask, {
    status: 'DONE',
    completed: true,
    due_date: '',
    calendar_event_id: '',
    calendar_sync_status: 'DELETE_PENDING'
  });
  sandbox.WorkOsCalendarSync.enqueueTask(state.mutableTask, {
    sheet: state.sheet,
    desired_action: 'DELETE',
    now: state.options.now
  });
  const result = processJob(state);
  assert.strictEqual(result.result.status, 'DEAD');
  assert.strictEqual(
    result.result.error_code,
    'E_CALENDAR_EVENT_ID_MISSING'
  );
  assert.strictEqual(state.gateway.calls.eventFind, 0);
  assert.strictEqual(state.gateway.calls.eventDelete, 0);
});

test('P4-G06_RATE_LIMIT_403_IS_RETRYABLE_BUT_AUTH_403_IS_NOT', () => {
  function makeService(error) {
    return {
      CalendarList: {
        list: () => { throw error; },
        get: () => ({ primary: false, accessRole: 'owner' })
      },
      Calendars: {},
      Events: {}
    };
  }
  const quota = new Error('rateLimitExceeded');
  quota.status = 403;
  const quotaGateway = new sandbox.WorkOsCalendarSync.AdvancedCalendarGateway(
    makeService(quota)
  );
  assert.throws(
    () => quotaGateway.listCalendarsBySummary('閾ｪ蜍墓悄譌･邂｡逅・),
    (error) => error.retryable === true
  );
  const auth = new Error('forbidden');
  auth.status = 403;
  const authGateway = new sandbox.WorkOsCalendarSync.AdvancedCalendarGateway(
    makeService(auth)
  );
  assert.throws(
    () => authGateway.listCalendarsBySummary('閾ｪ蜍墓悄譌･邂｡逅・),
    (error) => error.retryable === false
  );
});

test('P4-G07_RUNTIME_NEVER_PROVISIONS_MISSING_CALENDAR_CONFIGURATION', () => {
  const state = prepare();
  enqueue(state);
  properties().deleteProperty(
    sandbox.WorkOsConfig.PROPERTIES.DEADLINE_CALENDAR_ID
  );
  const result = processJob(state);
  assert.strictEqual(result.result.status, 'DEAD');
  assert.strictEqual(
    result.result.error_code,
    'E_CALENDAR_NOT_CONFIGURED'
  );
  assert.strictEqual(state.gateway.calls.calendarCreate, 0);
  assert.strictEqual(state.gateway.calls.listCalendars, 0);

  const instanceState = prepare();
  enqueue(instanceState);
  properties().deleteProperty(
    sandbox.WorkOsConfig.PROPERTIES.INSTANCE_ID
  );
  instanceState.options.instance_id = '';
  const instanceResult = processJob(instanceState);
  assert.strictEqual(instanceResult.result.status, 'DEAD');
  assert.strictEqual(
    instanceResult.result.error_code,
    'E_CALENDAR_INSTANCE_NOT_CONFIGURED'
  );
  assert.strictEqual(instanceState.gateway.calls.calendarCreate, 0);

  const corruptInstanceState = prepare();
  enqueue(corruptInstanceState);
  properties().setProperty(
    sandbox.WorkOsConfig.PROPERTIES.INSTANCE_ID,
    'token=synthetic-secret-must-not-enter-calendar'
  );
  corruptInstanceState.options.instance_id = '';
  const corruptInstanceResult = processJob(corruptInstanceState);
  assert.strictEqual(corruptInstanceResult.result.status, 'DEAD');
  assert.strictEqual(
    corruptInstanceResult.result.error_code,
    'E_CALENDAR_INSTANCE_INVALID'
  );
  assert.strictEqual(corruptInstanceState.gateway.calls.calendarGet, 0);
  assert.strictEqual(corruptInstanceState.gateway.calls.listCalendars, 0);
  assert.strictEqual(corruptInstanceState.gateway.calls.calendarCreate, 0);
  assert.strictEqual(corruptInstanceState.gateway.calls.eventInsert, 0);
});

test('P4-G08_TAMPERED_ERROR_CODE_AND_MISSING_TASK_WRITER_FAIL_CLOSED', () => {
  const corruptState = prepare();
  enqueue(corruptState);
  corruptState.sheet.getRange(
    sandbox.WorkOsConfig.DATA_START_ROW,
    11,
    1,
    1
  ).setValues([['token=synthetic-secret']]);
  assert.throws(
    () => sandbox.WorkOsCalendarSync.createOutboxContext(
      corruptState.sheet
    ),
    (error) => error.code === 'E_CALENDAR_OUTBOX_CORRUPT'
  );

  const writerState = prepare();
  enqueue(writerState);
  assert.throws(
    () => sandbox.WorkOsCalendarSync.processNextPendingJob({
      ...writerState.options,
      task_writer: null
    }),
    (error) => error.code === 'E_CALENDAR_TASK_WRITER'
  );
  assert.strictEqual(writerState.gateway.calls.eventInsert, 0);
  assert.strictEqual(outboxRecord(writerState).status, 'PENDING');

  const missingTaskState = prepare();
  enqueue(missingTaskState);
  missingTaskState.options.task_reader = () => null;
  const missingTaskResult = processJob(missingTaskState);
  assert.strictEqual(missingTaskResult.processed_count, 1);
  assert.strictEqual(missingTaskResult.result.status, 'DEAD');
  assert.strictEqual(
    missingTaskResult.result.error_code,
    'E_CALENDAR_TASK_NOT_FOUND'
  );
  assert.strictEqual(missingTaskState.taskWrites.length, 0);
  assert.strictEqual(missingTaskState.gateway.calls.eventInsert, 0);
  assert.strictEqual(outboxRecord(missingTaskState).status, 'DEAD');
});

const summary = {
  phase: 4,
  suite: 'calendar_core_local',
  real_google_workspace: 'NOT_EXECUTED',
  passed: tests.filter((item) => item.status === 'PASS').length,
  failed: tests.filter((item) => item.status === 'FAIL').length,
  tests
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed > 0) {
  process.exitCode = 1;
}

