'use strict';

/**
 * Phase 6 Trigger management and Gmail automatic discovery tests.
 *
 * Every service is an in-memory fake. No real Trigger, Gmail request, or
 * Google Workspace resource is contacted.
 */
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const apps = path.join(root, 'apps-script-v2');

class FakeProperties {
  constructor(values = {}, failSet = null) {
    this.values = new Map(Object.entries(values));
    this.failSet = failSet;
    this.afterSet = null;
  }
  getProperty(key) {
    return this.values.has(String(key))
      ? this.values.get(String(key))
      : null;
  }
  setProperty(key, value) {
    if (this.failSet && this.failSet(String(key), String(value))) {
      throw new Error('Synthetic property write failure');
    }
    this.values.set(String(key), String(value));
    if (this.afterSet) {
      this.afterSet(String(key), String(value));
    }
    return this;
  }
  deleteProperty(key) {
    this.values.delete(String(key));
    return this;
  }
}

class FakeTrigger {
  constructor(id, handler, eventType = 'CLOCK') {
    this.id = id;
    this.handler = handler;
    this.eventType = eventType;
  }
  getUniqueId() {
    return this.id;
  }
  getHandlerFunction() {
    return this.handler;
  }
  getEventType() {
    return this.eventType;
  }
}

class FakeScriptApp {
  constructor() {
    this.triggers = [];
    this.nextId = 1;
    this.createdIntervals = [];
    this.deleteFailures = new Set();
    this.onBeforeCreate = null;
    this.AuthMode = { FULL: 'FULL' };
    this.EventType = { CLOCK: 'CLOCK', ON_EDIT: 'ON_EDIT' };
  }
  getProjectTriggers() {
    return this.triggers.slice();
  }
  newTrigger(handler) {
    const service = this;
    let interval = 0;
    return {
      timeBased() {
        return this;
      },
      everyMinutes(value) {
        interval = Number(value);
        return this;
      },
      create() {
        if (typeof service.onBeforeCreate === 'function') {
          const hook = service.onBeforeCreate;
          service.onBeforeCreate = null;
          hook();
        }
        const trigger = new FakeTrigger(
          `synthetic-trigger-${service.nextId++}`,
          handler
        );
        service.triggers.push(trigger);
        service.createdIntervals.push(interval);
        return trigger;
      }
    };
  }
  deleteTrigger(trigger) {
    if (this.deleteFailures.has(trigger.getUniqueId())) {
      throw new Error('Synthetic delete failure');
    }
    this.triggers = this.triggers.filter((item) => item !== trigger);
  }
  getAuthorizationInfo() {
    return {
      getAuthorizationStatus: () => 'NOT_REQUIRED'
    };
  }
}

let activeProperties = new FakeProperties();
let activeScriptApp = new FakeScriptApp();
let automationLockHeld = false;
let workerScriptLockHeld = false;
const gmailState = {
  labels: [],
  listHandler: () => ({ threads: [] }),
  threads: new Map(),
  listCalls: []
};

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
  isNaN,
  Utilities: {
    getUuid: () => crypto.randomUUID(),
    computeDigest: (_algorithm, value) =>
      Array.from(
        crypto.createHash('sha256').update(String(value), 'utf8').digest()
      ).map((byte) => (byte > 127 ? byte - 256 : byte)),
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    Charset: { UTF_8: 'UTF_8' }
  },
  PropertiesService: {
    getScriptProperties: () => activeProperties
  },
  LockService: {
    getDocumentLock: () => ({
      tryLock: () => {
        if (automationLockHeld) {
          return false;
        }
        automationLockHeld = true;
        return true;
      },
      releaseLock: () => {
        automationLockHeld = false;
      }
    }),
    getScriptLock: () => ({
      tryLock: () => {
        if (workerScriptLockHeld) {
          return false;
        }
        workerScriptLockHeld = true;
        return true;
      },
      releaseLock: () => {
        workerScriptLockHeld = false;
      }
    })
  },
  ScriptApp: activeScriptApp,
  WorkOsAiAdapter: {},
  Gmail: {
    Users: {
      Labels: {
        list: () => ({ labels: gmailState.labels.slice() })
      },
      Threads: {
        list: (_user, request) => {
          gmailState.listCalls.push(structuredClone(request));
          return gmailState.listHandler(request);
        },
        get: (_user, id) => {
          if (!gmailState.threads.has(String(id))) {
            throw new Error('Synthetic missing thread');
          }
          return structuredClone(gmailState.threads.get(String(id)));
        }
      },
      Messages: {}
    }
  },
  WorkOsWorker: {
    processAutomaticBatch: () => ({
      status: 'COMPLETE',
      processed_count: 0
    })
  }
};
vm.createContext(sandbox);
[
  '00_Config.gs',
  '01_TypesAndSchemas.gs',
  '17_Utilities.gs',
  '05_GmailGateway.gs',
  '12_Triggers.gs'
].forEach((name) => {
  vm.runInContext(
    fs.readFileSync(path.join(apps, name), 'utf8'),
    sandbox,
    { filename: name }
  );
});

function readyPrerequisites() {
  return {
    ready: true,
    reasons: [],
    real_provider_connection: 'LOCAL_FAKE',
    company_approval: 'SYNTHETIC_TEST_ONLY',
    credential_storage_approval: 'SYNTHETIC_TEST_ONLY'
  };
}

function automationFixture() {
  automationLockHeld = false;
  workerScriptLockHeld = false;
  activeProperties = new FakeProperties();
  activeScriptApp = new FakeScriptApp();
  sandbox.ScriptApp = activeScriptApp;
  return {
    properties: activeProperties,
    script_app: activeScriptApp,
    prerequisite_checker: readyPrerequisites
  };
}

function automationSchemaSpreadsheet(corruptSheetName = '') {
  return {
    getSheetByName: (sheetName) => {
      const schema = sandbox.WorkOsSchemas.getSheetSchema(sheetName);
      const ids = Array.from(schema, (column) => column.id);
      const headers = Array.from(schema, (column) => column.header);
      if (sheetName === corruptSheetName) {
        ids[0] = 'synthetic_corrupt_internal_id';
      }
      return {
        getRange: () => ({
          getValues: () => [ids.slice(), headers.slice()]
        })
      };
    }
  };
}

const formalNames = [
  'AI/要対応',
  'AI/期限',
  'AI/返信待',
  'AI/要確認',
  '手動/取込',
  '手動/除外',
  'SYS/失敗'
];

function resetGmail() {
  gmailState.labels = formalNames.map((name, index) => ({
    id: `LBL_${index}`,
    name
  }));
  gmailState.listHandler = () => ({ threads: [] });
  gmailState.threads = new Map();
  gmailState.listCalls = [];
}

function message(id, timestamp, labels = ['INBOX']) {
  return {
    id,
    threadId: `thread-${id}`,
    internalDate: String(new Date(timestamp).getTime()),
    labelIds: labels.slice(),
    payload: { headers: [] }
  };
}

function addThread(id, messages) {
  gmailState.threads.set(id, {
    id,
    messages: messages.map((item) => ({
      ...item,
      threadId: id
    }))
  });
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

test('P6-L01_CONFIG_LIMITS_AND_DEFAULT_DISABLED', () => {
  assert.strictEqual(sandbox.WorkOsConfig.AUTOMATION_ENABLED, false);
  assert.strictEqual(sandbox.WorkOsConfig.AUTOMATION_INTERVAL_MINUTES, 5);
  assert.strictEqual(sandbox.WorkOsConfig.AUTOMATION_OVERLAP_MS, 86400000);
  assert.strictEqual(
    sandbox.WorkOsConfig.AUTOMATION_MAX_MESSAGES_PER_RUN,
    1
  );
  assert.strictEqual(
    sandbox.WorkOsConfig.AUTOMATION_MAX_SEARCH_THREADS,
    100
  );
  assert.strictEqual(sandbox.WorkOsConfig.AUTOMATION_SEARCH_PAGE_SIZE, 25);
  assert.strictEqual(
    sandbox.WorkOsConfig.AUTOMATION_WORKER_SOFT_LIMIT_MS,
    210000
  );
  assert.strictEqual(sandbox.WorkOsConfig.LOCK_WAIT_MS, 5000);
  assert.strictEqual(
    sandbox.WorkOsConfig.MESSAGE_STALE_CLAIM_MS,
    30 * 60 * 1000
  );
});

test('P6-L02_REQUIRED_PUBLIC_API_EXISTS', () => {
  [
    'enableAutomation',
    'disableAutomation',
    'getAutomationStatus',
    'ensureSingleAutomationTrigger',
    'removeDuplicateAutomationTriggers',
    'runScheduledWorker'
  ].forEach((name) => assert.strictEqual(typeof sandbox[name], 'function'));
});

test('P6-L03_DEFAULT_ENABLE_REFUSES_WITH_ZERO_TRIGGER', () => {
  const fixture = automationFixture();
  const result = sandbox.WorkOsAutomation.enableAutomation({
    properties: fixture.properties,
    script_app: fixture.script_app
  });
  assert.strictEqual(result.status, 'REFUSED');
  assert.strictEqual(result.enabled, false);
  assert.strictEqual(fixture.script_app.triggers.length, 0);
  assert(result.reasons.includes('EXTERNAL_AI_NOT_CONFIGURED'));
  assert(result.reasons.includes('OPERATOR_APPROVAL_NOT_CONFIRMED'));
  assert(result.reasons.includes('REAL_AI_TRANSPORT_NOT_IMPLEMENTED'));
  assert.strictEqual(
    fixture.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE
    ),
    'false'
  );
  assert.strictEqual(
    sandbox.WorkOsAutomation.getAutomationStatus({
      properties: fixture.properties,
      script_app: fixture.script_app
    }).status,
    'CONSISTENT'
  );
});

test('P6-L03B_CORRUPT_SHEET_SCHEMA_REFUSES_ENABLE_WITH_ZERO_TRIGGER', () => {
  const fixture = automationFixture();
  const schemaStatus =
    sandbox.WorkOsAutomation.inspectAutomationSheetSchemas({
      spreadsheet: automationSchemaSpreadsheet(
        sandbox.WorkOsConfig.SHEETS.TASKS
      )
    });
  assert.strictEqual(schemaStatus.ok, false);
  assert.strictEqual(schemaStatus.mismatched_schema_count, 1);
  const result = sandbox.WorkOsAutomation.enableAutomation({
    ...fixture,
    prerequisite_checker: () => ({
      ready: schemaStatus.ok,
      reasons: ['SHEET_SCHEMA_MISMATCH']
    })
  });
  assert.strictEqual(result.status, 'REFUSED');
  assert(result.reasons.includes('SHEET_SCHEMA_MISMATCH'));
  assert.strictEqual(fixture.script_app.triggers.length, 0);
});

test('P6-L04_EXPLICIT_ENABLE_CREATES_ONE_FIVE_MINUTE_TRIGGER', () => {
  const fixture = automationFixture();
  const result = sandbox.WorkOsAutomation.enableAutomation(fixture);
  assert.strictEqual(result.status, 'ENABLED');
  assert.strictEqual(fixture.script_app.triggers.length, 1);
  assert.deepStrictEqual(fixture.script_app.createdIntervals, [5]);
  assert.strictEqual(
    fixture.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED
    ),
    'true'
  );
});

test('P6-L05_ENABLE_IS_IDEMPOTENT', () => {
  const fixture = automationFixture();
  sandbox.WorkOsAutomation.enableAutomation(fixture);
  sandbox.WorkOsAutomation.enableAutomation(fixture);
  assert.strictEqual(fixture.script_app.triggers.length, 1);
  assert.strictEqual(fixture.script_app.createdIntervals.length, 1);
});

test('P6-L05A_CONCURRENT_ENABLE_IS_SERIALIZED_BY_DOCUMENT_LOCK', () => {
  const fixture = automationFixture();
  let nestedError = null;
  fixture.script_app.onBeforeCreate = () => {
    try {
      sandbox.WorkOsAutomation.enableAutomation(fixture);
    } catch (error) {
      nestedError = error;
    }
  };
  const result = sandbox.WorkOsAutomation.enableAutomation(fixture);
  assert.strictEqual(result.status, 'ENABLED');
  assert(nestedError);
  assert.strictEqual(nestedError.code, 'E_LOCK_TIMEOUT');
  assert.strictEqual(fixture.script_app.triggers.length, 1);
  assert.strictEqual(fixture.script_app.createdIntervals.length, 1);
});

test('P6-L05A2_DISABLE_REQUEST_WINS_DURING_ENABLE_COMMIT', () => {
  const fixture = automationFixture();
  let nestedDisable = null;
  fixture.script_app.onBeforeCreate = () => {
    nestedDisable =
      sandbox.WorkOsAutomation.disableAutomation(fixture);
  };
  const result = sandbox.WorkOsAutomation.enableAutomation(fixture);
  assert(nestedDisable);
  assert.strictEqual(
    nestedDisable.status,
    'DISABLED_WITH_TRIGGER_CLEANUP_DEFERRED'
  );
  assert.strictEqual(result.status, 'REFUSED');
  assert(result.reasons.includes('DISABLE_REQUESTED_DURING_ENABLE'));
  assert.strictEqual(fixture.script_app.triggers.length, 0);
  assert.strictEqual(
    fixture.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED
    ),
    'false'
  );
  assert.strictEqual(
    fixture.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE
    ),
    'false'
  );
});

test('P6-L05A3_DISABLE_REQUEST_WINS_AFTER_ENABLED_TRUE_WRITE', () => {
  const fixture = automationFixture();
  let nestedDisable = null;
  fixture.properties.afterSet = (key, value) => {
    if (key === sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED &&
        value === 'true') {
      fixture.properties.afterSet = null;
      nestedDisable =
        sandbox.WorkOsAutomation.disableAutomation(fixture);
    }
  };
  const result = sandbox.WorkOsAutomation.enableAutomation(fixture);
  assert(nestedDisable);
  assert.strictEqual(
    nestedDisable.status,
    'DISABLED_WITH_TRIGGER_CLEANUP_DEFERRED'
  );
  assert.strictEqual(result.status, 'REFUSED');
  assert(result.reasons.includes('DISABLE_REQUESTED_DURING_ENABLE'));
  assert.strictEqual(fixture.script_app.triggers.length, 0);
  assert.strictEqual(
    fixture.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED
    ),
    'false'
  );
});

test('P6-L05B_ENABLE_COMMIT_FAILURE_ROLLS_BACK_TRIGGER_AND_FLAG', () => {
  const fixture = automationFixture();
  fixture.properties = new FakeProperties({}, (key, value) => (
    key === sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED &&
    value === 'true'
  ));
  assert.throws(
    () => sandbox.WorkOsAutomation.enableAutomation(fixture),
    (error) => error && error.code === 'E_AUTOMATION_ENABLE_COMMIT'
  );
  assert.strictEqual(
    fixture.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED
    ),
    'false'
  );
  assert.strictEqual(fixture.script_app.triggers.length, 0);
  assert.strictEqual(
    fixture.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_TRIGGER_ID
    ),
    null
  );
  assert.strictEqual(
    fixture.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE
    ),
    'false'
  );
});

test('P6-L06_DUPLICATE_REMOVAL_PRESERVES_STORED_CANONICAL', () => {
  const fixture = automationFixture();
  const first = new FakeTrigger('owned-a', 'runScheduledWorker');
  const canonical = new FakeTrigger('owned-b', 'runScheduledWorker');
  fixture.script_app.triggers.push(first, canonical);
  fixture.properties.setProperty(
    sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_TRIGGER_ID,
    'owned-b'
  );
  const result =
    sandbox.WorkOsAutomation.removeDuplicateAutomationTriggers(fixture);
  assert.strictEqual(result.removed_count, 1);
  assert.deepStrictEqual(
    fixture.script_app.triggers.map((trigger) => trigger.getUniqueId()),
    ['owned-b']
  );
});

test('P6-L07_UNRELATED_TRIGGER_IS_NEVER_DELETED', () => {
  const fixture = automationFixture();
  const unrelated = new FakeTrigger('unrelated', 'otherHandler');
  fixture.script_app.triggers.push(
    unrelated,
    new FakeTrigger('owned-a', 'runScheduledWorker'),
    new FakeTrigger('owned-b', 'runScheduledWorker')
  );
  sandbox.WorkOsAutomation.removeDuplicateAutomationTriggers(fixture);
  assert(fixture.script_app.triggers.includes(unrelated));
  assert.strictEqual(
    fixture.script_app.triggers.filter(
      (trigger) => trigger.getHandlerFunction() === 'otherHandler'
    ).length,
    1
  );
});

test('P6-L07B_WRONG_EVENT_TYPE_IS_REPLACED_BY_CLOCK_TRIGGER', () => {
  const fixture = automationFixture();
  fixture.script_app.triggers.push(
    new FakeTrigger('synthetic-on-edit', 'runScheduledWorker', 'ON_EDIT')
  );
  const result = sandbox.WorkOsAutomation.enableAutomation(fixture);
  assert.strictEqual(result.status, 'ENABLED');
  assert.strictEqual(fixture.script_app.triggers.length, 1);
  assert.strictEqual(
    fixture.script_app.triggers[0].getEventType(),
    'CLOCK'
  );
  assert.notStrictEqual(
    fixture.script_app.triggers[0].getUniqueId(),
    'synthetic-on-edit'
  );
});

test('P6-L07C_DISABLED_STALE_TRIGGER_ID_IS_INCONSISTENT_AND_REMOVED', () => {
  const fixture = automationFixture();
  fixture.properties.setProperty(
    sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_TRIGGER_ID,
    'stale-id'
  );
  const before = sandbox.WorkOsAutomation.getAutomationStatus(fixture);
  assert.strictEqual(before.status, 'INCONSISTENT');
  const cleanup =
    sandbox.WorkOsAutomation.removeDuplicateAutomationTriggers(fixture);
  assert.strictEqual(cleanup.status, 'RECREATE_REQUIRED');
  assert.strictEqual(
    fixture.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_TRIGGER_ID
    ),
    null
  );
});

test('P6-L08_DISABLE_DELETES_ONLY_OWNED_AND_CLEARS_ID', () => {
  const fixture = automationFixture();
  sandbox.WorkOsAutomation.enableAutomation(fixture);
  const unrelated = new FakeTrigger('unrelated', 'otherHandler');
  fixture.script_app.triggers.push(unrelated);
  const result = sandbox.WorkOsAutomation.disableAutomation(fixture);
  assert.strictEqual(result.status, 'DISABLED');
  assert.deepStrictEqual(fixture.script_app.triggers, [unrelated]);
  assert.strictEqual(
    fixture.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_TRIGGER_ID
    ),
    null
  );
});

test('P6-L09_DELETE_FAILURE_STILL_DISables_WORKER', () => {
  const fixture = automationFixture();
  sandbox.WorkOsAutomation.enableAutomation(fixture);
  fixture.script_app.deleteFailures.add(
    fixture.script_app.triggers[0].getUniqueId()
  );
  const result = sandbox.WorkOsAutomation.disableAutomation(fixture);
  assert.strictEqual(result.status, 'DISABLED_WITH_TRIGGER_CLEANUP_ERROR');
  let workerCalls = 0;
  const run = sandbox.WorkOsAutomation.runScheduledWorker(null, {
    ...fixture,
    worker: {
      processAutomaticBatch: () => {
        workerCalls += 1;
        return { status: 'COMPLETE' };
      }
    }
  });
  assert.strictEqual(run.status, 'DISABLED');
  assert.strictEqual(workerCalls, 0);
});

test('P6-L09A_DISABLE_IS_NOT_BLOCKED_BY_RUNNING_WORKER_SCRIPT_LOCK', () => {
  const fixture = automationFixture();
  sandbox.WorkOsAutomation.enableAutomation(fixture);
  workerScriptLockHeld = true;
  const result = sandbox.WorkOsAutomation.disableAutomation(fixture);
  assert.strictEqual(result.status, 'DISABLED');
  assert.strictEqual(fixture.script_app.triggers.length, 0);
  assert.strictEqual(
    fixture.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED
    ),
    'false'
  );
  workerScriptLockHeld = false;
});

test('P6-L09A2_DISABLE_FLAG_WINS_WHEN_LIFECYCLE_LOCK_IS_BUSY', () => {
  const fixture = automationFixture();
  sandbox.WorkOsAutomation.enableAutomation(fixture);
  automationLockHeld = true;
  const result = sandbox.WorkOsAutomation.disableAutomation(fixture);
  assert.strictEqual(
    result.status,
    'DISABLED_WITH_TRIGGER_CLEANUP_DEFERRED'
  );
  assert.strictEqual(result.effective_running, false);
  assert.strictEqual(
    fixture.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED
    ),
    'false'
  );
  assert.strictEqual(fixture.script_app.triggers.length, 1);
  let workerCalls = 0;
  const run = sandbox.WorkOsAutomation.runScheduledWorker(
    { triggerUid: fixture.script_app.triggers[0].getUniqueId() },
    {
      ...fixture,
      worker: {
        processAutomaticBatch: () => {
          workerCalls += 1;
          return { status: 'COMPLETE' };
        }
      }
    }
  );
  assert.strictEqual(run.status, 'DISABLED');
  assert.strictEqual(workerCalls, 0);
  automationLockHeld = false;
});

test('P6-L09B_FLAG_WRITE_FAILURE_STILL_REMOVES_OWNED_TRIGGER', () => {
  const fixture = automationFixture();
  fixture.properties.setProperty(
    sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED,
    'true'
  );
  fixture.script_app.triggers.push(
    new FakeTrigger('owned-a', 'runScheduledWorker')
  );
  fixture.properties.failSet = (key, value) => (
    key === sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED &&
    value === 'false'
  );
  const result = sandbox.WorkOsAutomation.disableAutomation(fixture);
  assert.strictEqual(result.status, 'DISABLED_WITH_FLAG_WRITE_ERROR');
  assert.strictEqual(result.effective_running, false);
  assert.strictEqual(result.removed_count, 1);
  assert.strictEqual(fixture.script_app.triggers.length, 0);
});

test('P6-L09C_OAUTH_STATUS_MUST_BE_EXPLICITLY_AVAILABLE', () => {
  const fixture = automationFixture();
  fixture.script_app.getAuthorizationInfo = undefined;
  const result = sandbox.WorkOsAutomation.enableAutomation({
    properties: fixture.properties,
    script_app: fixture.script_app
  });
  assert.strictEqual(result.status, 'REFUSED');
  assert(result.reasons.includes('OAUTH_STATUS_UNAVAILABLE'));
  assert.strictEqual(fixture.script_app.triggers.length, 0);
});

test('P6-L10_DISABLED_SCHEDULED_RUN_CALLS_NO_WORKER', () => {
  const fixture = automationFixture();
  let calls = 0;
  const result = sandbox.WorkOsAutomation.runScheduledWorker(null, {
    ...fixture,
    worker: {
      processAutomaticBatch: () => {
        calls += 1;
        return { status: 'COMPLETE' };
      }
    }
  });
  assert.strictEqual(result.status, 'DISABLED');
  assert.strictEqual(calls, 0);
});

test('P6-L10B_DESIRED_FALSE_IS_IMMEDIATE_WORKER_KILL_SWITCH', () => {
  const fixture = automationFixture();
  sandbox.WorkOsAutomation.enableAutomation(fixture);
  fixture.properties.setProperty(
    sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE,
    'false'
  );
  let calls = 0;
  const result = sandbox.WorkOsAutomation.runScheduledWorker(
    { triggerUid: fixture.script_app.triggers[0].getUniqueId() },
    {
      ...fixture,
      worker: {
        processAutomaticBatch: () => {
          calls += 1;
          return { status: 'COMPLETE' };
        }
      }
    }
  );
  assert.strictEqual(result.status, 'DISABLED');
  assert.strictEqual(calls, 0);
});

test('P6-L11_NON_CANONICAL_TRIGGER_CALLS_NO_WORKER', () => {
  const fixture = automationFixture();
  sandbox.WorkOsAutomation.enableAutomation(fixture);
  let calls = 0;
  const result = sandbox.WorkOsAutomation.runScheduledWorker(
    { triggerUid: 'synthetic-other-trigger' },
    {
      ...fixture,
      worker: {
        processAutomaticBatch: () => {
          calls += 1;
          return { status: 'COMPLETE' };
        }
      }
    }
  );
  assert.strictEqual(result.status, 'NON_CANONICAL_TRIGGER');
  assert.strictEqual(calls, 0);
});

test('P6-L12_CANONICAL_TRIGGER_CALLS_WORKER_ONCE', () => {
  const fixture = automationFixture();
  sandbox.WorkOsAutomation.enableAutomation(fixture);
  const id = fixture.properties.getProperty(
    sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_TRIGGER_ID
  );
  let calls = 0;
  const result = sandbox.WorkOsAutomation.runScheduledWorker(
    { triggerUid: id },
    {
      ...fixture,
      worker: {
        processAutomaticBatch: () => {
          calls += 1;
          return { status: 'COMPLETE', processed_count: 2 };
        }
      }
    }
  );
  assert.strictEqual(result.status, 'COMPLETE');
  assert.strictEqual(result.processed_count, 2);
  assert.strictEqual(calls, 1);
});

test('P6-L12B_MISSING_TRIGGER_UID_CALLS_NO_WORKER', () => {
  const fixture = automationFixture();
  sandbox.WorkOsAutomation.enableAutomation(fixture);
  let calls = 0;
  const result = sandbox.WorkOsAutomation.runScheduledWorker(
    {},
    {
      ...fixture,
      worker: {
        processAutomaticBatch: () => {
          calls += 1;
          return { status: 'COMPLETE' };
        }
      }
    }
  );
  assert.strictEqual(result.status, 'NON_CANONICAL_TRIGGER');
  assert.strictEqual(calls, 0);
});

test('P6-L13_SETUP_NEVER_CREATES_OR_ENSURES_TRIGGER', () => {
  const source = fs.readFileSync(
    path.join(apps, '02_Setup.gs'),
    'utf8'
  );
  assert.strictEqual(/newTrigger\s*\(/.test(source), false);
  assert.strictEqual(/ensureSingleAutomationTrigger\s*\(/.test(source), false);
  assert.match(
    source,
    /phase_boundary:[\s\S]*READY_FOR_PHASE8B_SANDBOX_RETRANSFER/
  );
});

test('P6-L14_MANIFEST_SCOPE_IS_MINIMAL_FOR_TRIGGER_MANAGEMENT', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(apps, 'appsscript.json'), 'utf8')
  );
  assert(manifest.oauthScopes.includes(
    'https://www.googleapis.com/auth/script.scriptapp'
  ));
  assert(!manifest.oauthScopes.includes(
    'https://mail.google.com/'
  ));
  assert(manifest.oauthScopes.includes(
    'https://www.googleapis.com/auth/script.external_request'
  ));
  assert.strictEqual(Object.prototype.hasOwnProperty.call(
    manifest,
    'triggers'
  ), false);
});

test('P6-L15_WATERMARK_QUERY_USES_ONE_DAY_OVERLAP_AND_FIXED_UPPER', () => {
  const state = sandbox.WorkOsGmailGateway.automaticQuery(
    new Date('2026-07-24T12:00:00.000Z'),
    new Date('2026-07-24T13:00:00.000Z')
  );
  assert(state.query.includes('in:inbox'));
  assert(!/is:(?:unread|read)/.test(state.query));
  assert(state.query.includes(
    `after:${Math.floor(new Date('2026-07-23T12:00:00.000Z').getTime() / 1000)}`
  ));
  assert(state.query.includes(
    `before:${Math.floor(new Date('2026-07-24T13:00:00.000Z').getTime() / 1000) + 1}`
  ));
});

test('P6-L16_READ_STATE_UNUSED_AND_SAME_THREAD_MESSAGES_ARE_SEPARATE', () => {
  resetGmail();
  addThread('thread-a', [
    message('message-read', '2026-07-24T10:00:00.000Z', ['INBOX']),
    message('message-unread', '2026-07-24T11:00:00.000Z', [
      'INBOX',
      'UNREAD'
    ])
  ]);
  gmailState.listHandler = () => ({
    threads: [{ id: 'thread-a' }]
  });
  const result = sandbox.WorkOsGmailGateway.listAutomaticCandidates({
    watermark_at: new Date('2026-07-24T00:00:00.000Z'),
    upper_bound_at: new Date('2026-07-24T12:00:00.000Z')
  });
  assert.deepStrictEqual(
    Array.from(result.candidates, (candidate) => candidate.message_id),
    ['message-read', 'message-unread']
  );
  assert.strictEqual(result.read_state_used, false);
  assert.strictEqual(
    result.candidates[0].stable_thread_key,
    result.candidates[1].stable_thread_key
  );
});

test('P6-L16B_MESSAGE_AT_OR_AFTER_FIXED_UPPER_BOUND_IS_EXCLUDED', () => {
  resetGmail();
  addThread('thread-upper', [
    message('message-before-upper', '2026-07-24T11:59:59.999Z'),
    message('message-at-upper', '2026-07-24T12:00:00.000Z'),
    message('message-after-upper', '2026-07-24T12:00:01.000Z')
  ]);
  gmailState.listHandler = () => ({
    threads: [{ id: 'thread-upper' }]
  });
  const result = sandbox.WorkOsGmailGateway.listAutomaticCandidates({
    watermark_at: new Date('2026-07-24T00:00:00.000Z'),
    upper_bound_at: new Date('2026-07-24T12:00:00.000Z')
  });
  assert.deepStrictEqual(
    Array.from(result.candidates, (candidate) => candidate.message_id),
    ['message-before-upper']
  );
});

test('P6-L16C_MANUAL_IMPORT_IS_MESSAGE_SCOPED_WITHIN_THREAD', () => {
  resetGmail();
  addThread('thread-mixed-manual', [
    message('older-manual', '2026-07-24T10:00:00.000Z', [
      'INBOX',
      'LBL_4'
    ]),
    message('newer-promotion', '2026-07-24T11:00:00.000Z', [
      'INBOX',
      'CATEGORY_PROMOTIONS'
    ])
  ]);
  gmailState.listHandler = () => ({
    threads: [{ id: 'thread-mixed-manual' }]
  });
  const result = sandbox.WorkOsGmailGateway.listAutomaticCandidates({
    watermark_at: new Date('2026-07-24T00:00:00.000Z'),
    upper_bound_at: new Date('2026-07-24T12:00:00.000Z')
  });
  assert.deepStrictEqual(
    Array.from(result.candidates, (candidate) => ({
      id: candidate.message_id,
      reason: candidate.selection_reason
    })),
    [{ id: 'older-manual', reason: 'MANUAL_IMPORT' }]
  );
  assert.strictEqual(result.filter_counts.CATEGORY_PROMOTIONS, 1);
});

test('P6-L17_KNOWN_MESSAGE_ID_IS_DEDUPED', () => {
  resetGmail();
  addThread('thread-a', [
    message('known-message', '2026-07-24T10:00:00.000Z'),
    message('new-message', '2026-07-24T11:00:00.000Z')
  ]);
  gmailState.listHandler = () => ({ threads: [{ id: 'thread-a' }] });
  const result = sandbox.WorkOsGmailGateway.listAutomaticCandidates({
    watermark_at: new Date('2026-07-24T00:00:00.000Z'),
    upper_bound_at: new Date('2026-07-24T12:00:00.000Z'),
    known_message_ids: { 'known-message': true }
  });
  assert.deepStrictEqual(
    Array.from(result.candidates, (candidate) => candidate.message_id),
    ['new-message']
  );
});

test('P6-L18_MANUAL_EXCLUDE_WINS_FOR_WHOLE_THREAD', () => {
  resetGmail();
  addThread('thread-a', [
    message('excluded-root', '2026-07-24T10:00:00.000Z', [
      'INBOX',
      'LBL_5'
    ]),
    message('excluded-latest', '2026-07-24T11:00:00.000Z', ['INBOX'])
  ]);
  gmailState.listHandler = () => ({ threads: [{ id: 'thread-a' }] });
  const result = sandbox.WorkOsGmailGateway.listAutomaticCandidates({
    watermark_at: new Date('2026-07-24T00:00:00.000Z'),
    upper_bound_at: new Date('2026-07-24T12:00:00.000Z')
  });
  assert.strictEqual(result.candidates.length, 0);
});

test('P6-L19_SPAM_TRASH_AND_NON_INBOX_MESSAGES_ARE_EXCLUDED', () => {
  resetGmail();
  addThread('thread-a', [
    message('spam', '2026-07-24T09:00:00.000Z', ['INBOX', 'SPAM']),
    message('trash', '2026-07-24T10:00:00.000Z', ['INBOX', 'TRASH']),
    message('archive', '2026-07-24T11:00:00.000Z', [])
  ]);
  gmailState.listHandler = () => ({ threads: [{ id: 'thread-a' }] });
  const result = sandbox.WorkOsGmailGateway.listAutomaticCandidates({
    watermark_at: new Date('2026-07-24T00:00:00.000Z'),
    upper_bound_at: new Date('2026-07-24T12:00:00.000Z')
  });
  assert.strictEqual(result.candidates.length, 0);
});

test('P6-L20_PAGINATION_IS_25_PER_PAGE_AND_100_THREADS_MAX', () => {
  resetGmail();
  for (let index = 0; index < 100; index += 1) {
    const id = `thread-${String(index).padStart(3, '0')}`;
    addThread(id, [
      message(`message-${index}`, '2026-07-24T10:00:00.000Z')
    ]);
  }
  gmailState.listHandler = (request) => {
    const page = request.pageToken ? Number(request.pageToken) : 0;
    const start = page * 25;
    return {
      threads: Array.from({ length: 25 }, (_unused, offset) => ({
        id: `thread-${String(start + offset).padStart(3, '0')}`
      })),
      nextPageToken: page < 3 ? String(page + 1) : '4'
    };
  };
  const result = sandbox.WorkOsGmailGateway.listAutomaticCandidates({
    watermark_at: new Date('2026-07-24T00:00:00.000Z'),
    upper_bound_at: new Date('2026-07-24T12:00:00.000Z')
  });
  assert.strictEqual(gmailState.listCalls.length, 4);
  assert(gmailState.listCalls.every((request) => request.maxResults === 25));
  assert.strictEqual(result.searched_threads, 100);
  assert.strictEqual(result.candidates.length, 10);
  assert.strictEqual(result.search_saturated, true);
  assert.strictEqual(result.candidate_overflow, true);
});

test('P6-L21_CANDIDATE_OVERFLOW_REPEATS_CURRENT_SCAN_PAGE', () => {
  resetGmail();
  for (let index = 0; index < 11; index += 1) {
    const id = `overflow-thread-${index}`;
    addThread(id, [
      message(`overflow-message-${index}`, '2026-07-24T10:00:00.000Z')
    ]);
  }
  gmailState.listHandler = (request) => request.pageToken === 'next-page'
    ? { threads: [] }
    : {
      threads: Array.from({ length: 11 }, (_unused, index) => ({
        id: `overflow-thread-${index}`
      })),
      nextPageToken: 'next-page'
    };
  const result = sandbox.WorkOsGmailGateway.listAutomaticCandidates({
    watermark_at: new Date('2026-07-24T00:00:00.000Z'),
    upper_bound_at: new Date('2026-07-24T12:00:00.000Z'),
    page_token: 'current-page'
  });
  assert.strictEqual(result.candidate_overflow, true);
  assert.strictEqual(result.resume_page_token, 'current-page');
  assert.strictEqual(result.search_complete, false);
});

test('P6-L21B_REPEATED_PAGE_TOKEN_FAILS_CLOSED', () => {
  resetGmail();
  gmailState.listHandler = () => ({
    threads: [],
    nextPageToken: 'same-page'
  });
  assert.throws(
    () => sandbox.WorkOsGmailGateway.listAutomaticCandidates({
      watermark_at: new Date('2026-07-24T00:00:00.000Z'),
      upper_bound_at: new Date('2026-07-24T12:00:00.000Z'),
      page_token: 'same-page'
    }),
    (error) => error && error.code === 'E_GMAIL_PAGINATION_LOOP'
  );
  assert.strictEqual(gmailState.listCalls.length, 1);
});

test('P6-L21C_METADATA_BUDGET_RETURNS_REPLAYABLE_PARTIAL_RESULT', () => {
  resetGmail();
  ['partial-a', 'partial-b'].forEach((id) => {
    addThread(id, [
      message(`${id}-message`, '2026-07-24T10:00:00.000Z')
    ]);
  });
  gmailState.listHandler = () => ({
    threads: [{ id: 'partial-a' }, { id: 'partial-b' }]
  });
  let budgetChecks = 0;
  const result = sandbox.WorkOsGmailGateway.listAutomaticCandidates({
    watermark_at: new Date('2026-07-24T00:00:00.000Z'),
    upper_bound_at: new Date('2026-07-24T12:00:00.000Z'),
    page_token: 'current-partial-page',
    budget: {
      isExhausted: () => {
        budgetChecks += 1;
        return budgetChecks >= 3;
      }
    }
  });
  assert.strictEqual(result.metadata_complete, false);
  assert.strictEqual(result.expanded_threads, 1);
  assert.strictEqual(result.candidates.length, 1);
  assert.strictEqual(result.resume_page_token, 'current-partial-page');
  assert.strictEqual(result.search_complete, false);
});

test('P6-L22_SATURATED_SCAN_ADVANCES_ONLY_TO_PROVIDER_NEXT_PAGE', () => {
  resetGmail();
  for (let index = 0; index < 100; index += 1) {
    const id = `known-thread-${index}`;
    addThread(id, [
      message(`known-message-${index}`, '2026-07-24T10:00:00.000Z')
    ]);
  }
  gmailState.listHandler = (request) => {
    const page = request.pageToken ? Number(request.pageToken) : 0;
    const start = page * 25;
    return {
      threads: Array.from({ length: 25 }, (_unused, offset) => ({
        id: `known-thread-${start + offset}`
      })),
      nextPageToken: page < 3 ? String(page + 1) : 'page-five'
    };
  };
  const known = Object.fromEntries(
    Array.from({ length: 99 }, (_unused, index) => [
      `known-message-${index}`,
      true
    ])
  );
  const result = sandbox.WorkOsGmailGateway.listAutomaticCandidates({
    watermark_at: new Date('2026-07-24T00:00:00.000Z'),
    upper_bound_at: new Date('2026-07-24T12:00:00.000Z'),
    known_message_ids: known
  });
  assert.strictEqual(result.candidates.length, 1);
  assert.strictEqual(result.search_saturated, true);
  assert.strictEqual(result.resume_page_token, 'page-five');
  assert.strictEqual(result.search_complete, false);
});

test('P6-L23_GATEWAY_NEVER_RETURNS_MORE_THAN_TEN_MESSAGES', () => {
  resetGmail();
  for (let index = 0; index < 20; index += 1) {
    const id = `limit-thread-${index}`;
    addThread(id, [
      message(`limit-message-${index}`, '2026-07-24T10:00:00.000Z')
    ]);
  }
  gmailState.listHandler = () => ({
    threads: Array.from({ length: 20 }, (_unused, index) => ({
      id: `limit-thread-${index}`
    }))
  });
  const result = sandbox.WorkOsGmailGateway.listAutomaticCandidates({
    watermark_at: new Date('2026-07-24T00:00:00.000Z'),
    upper_bound_at: new Date('2026-07-24T12:00:00.000Z')
  });
  assert.strictEqual(result.candidates.length, 10);
});

test('P6-L24_QUERY_AND_RESULTS_CONTAIN_NO_BODY_OR_CREDENTIAL', () => {
  resetGmail();
  addThread('thread-a', [
    message('safe-message', '2026-07-24T10:00:00.000Z')
  ]);
  gmailState.listHandler = () => ({ threads: [{ id: 'thread-a' }] });
  const result = sandbox.WorkOsGmailGateway.listAutomaticCandidates({
    watermark_at: new Date('2026-07-24T00:00:00.000Z'),
    upper_bound_at: new Date('2026-07-24T12:00:00.000Z')
  });
  const serialized = JSON.stringify(result);
  assert(!/plain_body|body_data|credential|authorization|token_value/i.test(
    serialized
  ));
});

test('P6-L25_SOURCE_HAS_NO_REAL_TRIGGER_OR_GMAIL_EXECUTION_FIXTURE', () => {
  const source = [
    '05_GmailGateway.gs',
    '12_Triggers.gs',
    '18_Worker.gs'
  ].map((name) => fs.readFileSync(path.join(apps, name), 'utf8')).join('\n');
  assert.strictEqual(/\bGmailApp\b/.test(source), false);
  assert.strictEqual(/\bUrlFetchApp\b/.test(source), false);
  assert.strictEqual(/is:(?:unread|read)/.test(
    sandbox.WorkOsConfig.AUTOMATION_GMAIL_QUERY
  ), false);
});

const summary = {
  phase: 6,
  suite: 'automation_and_gmail_local',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_trigger: 'NOT_EXECUTED',
  real_gmail: 'NOT_EXECUTED',
  real_provider_connection: 'NOT_EXECUTED',
  passed: tests.filter((item) => item.status === 'PASS').length,
  failed: tests.filter((item) => item.status === 'FAIL').length,
  tests
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed) {
  process.exitCode = 1;
}
