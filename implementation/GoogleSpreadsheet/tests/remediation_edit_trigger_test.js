'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'apps-script-v2');

class FakeProperties {
  constructor() {
    this.values = new Map();
  }
  getProperty(key) {
    return this.values.has(String(key))
      ? this.values.get(String(key))
      : null;
  }
  setProperty(key, value) {
    this.values.set(String(key), String(value));
    return this;
  }
  deleteProperty(key) {
    this.values.delete(String(key));
    return this;
  }
}

class FakeTrigger {
  constructor(id, handler, eventType, sourceId) {
    this.id = id;
    this.handler = handler;
    this.eventType = eventType;
    this.sourceId = sourceId || '';
  }
  getUniqueId() { return this.id; }
  getHandlerFunction() { return this.handler; }
  getEventType() { return this.eventType; }
  getTriggerSourceId() { return this.sourceId; }
}

class FakeScriptApp {
  constructor() {
    this.AuthMode = { FULL: 'FULL' };
    this.triggers = [];
    this.nextId = 1;
  }
  getProjectTriggers() { return this.triggers.slice(); }
  getAuthorizationInfo() {
    return { getAuthorizationStatus: () => 'NOT_REQUIRED' };
  }
  deleteTrigger(trigger) {
    this.triggers = this.triggers.filter((item) => item !== trigger);
  }
  newTrigger(handler) {
    const service = this;
    let source = null;
    let eventType = '';
    return {
      forSpreadsheet(spreadsheet) {
        source = spreadsheet;
        return this;
      },
      onEdit() {
        eventType = 'ON_EDIT';
        return this;
      },
      timeBased() {
        eventType = 'CLOCK';
        return this;
      },
      everyMinutes() { return this; },
      create() {
        const trigger = new FakeTrigger(
          `synthetic-trigger-${service.nextId++}`,
          handler,
          eventType,
          source ? source.getId() : ''
        );
        service.triggers.push(trigger);
        return trigger;
      }
    };
  }
}

function principal(email) {
  return { getEmail: () => email };
}

class FakeSpreadsheet {
  constructor(id = 'synthetic-spreadsheet') {
    this.id = id;
  }
  getId() { return this.id; }
  getOwner() { return principal('owner@example.invalid'); }
}

const properties = new FakeProperties();
const scriptApp = new FakeScriptApp();
const spreadsheet = new FakeSpreadsheet();
const sandbox = {
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
    Charset: { UTF_8: 'UTF_8' }
  },
  PropertiesService: {
    getScriptProperties: () => properties
  },
  SpreadsheetApp: {
    getActiveSpreadsheet: () => spreadsheet
  },
  ScriptApp: scriptApp,
  Session: {
    getEffectiveUser: () => principal('owner@example.invalid')
  },
  LockService: {
    getDocumentLock: () => ({
      tryLock: () => true,
      releaseLock: () => {}
    })
  },
  WorkOsSchemas: {},
  WorkOsAiAdapter: {
    getProductionReadiness: () => ({ reasons: ['SYNTHETIC_BLOCKED'] })
  }
};
vm.createContext(sandbox);
[
  '00_Config.gs',
  '17_Utilities.gs',
  '12_Triggers.gs',
  '11_EditHandler.gs'
].forEach((name) => {
  vm.runInContext(
    fs.readFileSync(path.join(sourceRoot, name), 'utf8'),
    sandbox,
    { filename: name }
  );
});

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, status: 'PASS' });
  } catch (error) {
    results.push({ name, status: 'FAIL', message: error.message });
  }
}

function reset() {
  properties.values.clear();
  scriptApp.triggers = [];
  scriptApp.nextId = 1;
}

test('R-EDIT-01_OWNER_INSTALL_CREATES_ONE_ON_EDIT_TRIGGER', () => {
  reset();
  const result = sandbox.WorkOsAutomation.ensureEditTrigger({
    properties,
    script_app: scriptApp,
    spreadsheet,
    owner_verified: true
  });
  assert.strictEqual(result.status, 'CONSISTENT');
  assert.strictEqual(result.created, true);
  assert.strictEqual(scriptApp.triggers.length, 1);
  assert.strictEqual(scriptApp.triggers[0].getEventType(), 'ON_EDIT');
  assert.strictEqual(
    scriptApp.triggers[0].getHandlerFunction(),
    'handleTaskEdit'
  );
});

test('R-EDIT-02_RERUN_IS_IDEMPOTENT', () => {
  const firstId = scriptApp.triggers[0].getUniqueId();
  const result = sandbox.WorkOsAutomation.ensureEditTrigger({
    properties,
    script_app: scriptApp,
    spreadsheet,
    owner_verified: true
  });
  assert.strictEqual(result.created, false);
  assert.strictEqual(scriptApp.triggers.length, 1);
  assert.strictEqual(scriptApp.triggers[0].getUniqueId(), firstId);
});

test('R-EDIT-03_DUPLICATE_CLEANUP_PRESERVES_UNRELATED_TRIGGER', () => {
  scriptApp.triggers.push(
    new FakeTrigger(
      'duplicate-edit',
      'handleTaskEdit',
      'ON_EDIT',
      spreadsheet.getId()
    ),
    new FakeTrigger('unrelated', 'anotherHandler', 'CLOCK', '')
  );
  const result = sandbox.WorkOsAutomation.ensureEditTrigger({
    properties,
    script_app: scriptApp,
    spreadsheet,
    owner_verified: true
  });
  assert.strictEqual(result.removed_count, 1);
  assert.strictEqual(
    scriptApp.triggers.some((item) =>
      item.getUniqueId() === 'unrelated'
    ),
    true
  );
});

test('R-EDIT-04_WRONG_SOURCE_OR_EVENT_IS_REPLACED', () => {
  reset();
  scriptApp.triggers.push(
    new FakeTrigger('wrong-source', 'handleTaskEdit', 'ON_EDIT', 'foreign'),
    new FakeTrigger('wrong-event', 'handleTaskEdit', 'CLOCK', '')
  );
  const result = sandbox.WorkOsAutomation.ensureEditTrigger({
    properties,
    script_app: scriptApp,
    spreadsheet,
    owner_verified: true
  });
  assert.strictEqual(result.created, true);
  assert.strictEqual(result.removed_count, 2);
  assert.strictEqual(scriptApp.triggers.length, 1);
  assert.strictEqual(
    scriptApp.triggers[0].getTriggerSourceId(),
    spreadsheet.getId()
  );
});

test('R-EDIT-05_OWNER_MISMATCH_FAILS_BEFORE_TRIGGER_MUTATION', () => {
  reset();
  assert.throws(
    () => sandbox.WorkOsAutomation.ensureEditTrigger({
      properties,
      script_app: scriptApp,
      spreadsheet,
      session: {
        getEffectiveUser: () => principal('different@example.invalid')
      }
    }),
    (error) => error.code === 'E_EDIT_TRIGGER_OWNER_REQUIRED'
  );
  assert.strictEqual(scriptApp.triggers.length, 0);
});

test('R-EDIT-06_CANONICAL_EVENT_UID_IS_REQUIRED', () => {
  reset();
  sandbox.WorkOsAutomation.ensureEditTrigger({
    properties,
    script_app: scriptApp,
    spreadsheet,
    owner_verified: true
  });
  const id = scriptApp.triggers[0].getUniqueId();
  assert.strictEqual(
    sandbox.WorkOsEditHandler.assertCanonicalInstallableEvent({
      triggerUid: id
    }),
    true
  );
  assert.throws(
    () => sandbox.WorkOsEditHandler.assertCanonicalInstallableEvent({
      triggerUid: 'foreign-trigger'
    }),
    (error) => error.code === 'E_EDIT_TRIGGER_NON_CANONICAL'
  );
  assert.strictEqual(
    sandbox.WorkOsEditHandler.assertCanonicalInstallableEvent({}),
    false
  );
});

test('R-EDIT-07_TIME_DRIVEN_AUTOMATION_REMAINS_DISABLED', () => {
  assert.strictEqual(sandbox.WorkOsConfig.AUTOMATION_ENABLED, false);
  assert.strictEqual(
    scriptApp.triggers.some((item) => item.getEventType() === 'CLOCK'),
    false
  );
});

test('R-EDIT-08_HANDLER_HAS_NO_EXTERNAL_SERVICE_CALL', () => {
  const source = fs.readFileSync(
    path.join(sourceRoot, '11_EditHandler.gs'),
    'utf8'
  );
  [
    'Gmail.Users',
    'Calendar.Events',
    'CalendarApp',
    'UrlFetchApp'
  ].forEach((forbidden) => {
    assert.strictEqual(source.includes(forbidden), false);
  });
});

test('R-EDIT-09_EMPTY_TRIGGER_SOURCE_ID_IS_NEVER_ACCEPTED', () => {
  reset();
  scriptApp.triggers.push(
    new FakeTrigger('source-unavailable', 'handleTaskEdit', 'ON_EDIT', '')
  );
  const result = sandbox.WorkOsAutomation.ensureEditTrigger({
    properties,
    script_app: scriptApp,
    spreadsheet,
    owner_verified: true
  });
  assert.strictEqual(result.created, true);
  assert.strictEqual(result.removed_count, 1);
  assert.strictEqual(scriptApp.triggers.length, 1);
  assert.notStrictEqual(
    scriptApp.triggers[0].getUniqueId(),
    'source-unavailable'
  );
  assert.strictEqual(
    scriptApp.triggers[0].getTriggerSourceId(),
    spreadsheet.getId()
  );
});

test('R-EDIT-10_TEST_MODE_BLOCKS_PRODUCTION_AUTOMATION_GATE', () => {
  const status = sandbox.WorkOsAutomation.getAutomationStatus({
    properties,
    script_app: scriptApp,
    spreadsheet
  });
  assert.strictEqual(status.prerequisites.ready, false);
  assert.strictEqual(
    status.prerequisites.reasons.includes('TEST_MODE_ENABLED'),
    true
  );
});

const failed = results.filter((item) => item.status === 'FAIL');
console.log(JSON.stringify({
  suite: 'remediation_edit_trigger',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_installable_edit_event: 'NOT_EXECUTED',
  passed: results.length - failed.length,
  failed: failed.length,
  tests: results
}, null, 2));
if (failed.length) {
  process.exitCode = 1;
}

