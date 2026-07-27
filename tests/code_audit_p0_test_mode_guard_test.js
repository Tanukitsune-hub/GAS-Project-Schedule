'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'apps-script-v2');
const results = [];

function test(id, body) {
  const startedAt = Date.now();
  try {
    body();
    results.push({ id, status: 'PASS', duration_ms: Date.now() - startedAt });
  } catch (error) {
    results.push({
      id,
      status: 'FAIL',
      duration_ms: Date.now() - startedAt,
      safe_message: String(error && error.message || error)
    });
  }
}

function makeSandbox(testMode) {
  const effects = {
    spreadsheet: 0,
    repository: 0,
    ui: 0
  };
  const menuItems = [];
  const menu = {
    addItem(label) {
      menuItems.push(String(label));
      return this;
    },
    addSeparator() {
      return this;
    },
    addToUi() {
      return this;
    }
  };
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
    console,
    Utilities: {
      getUuid: () => crypto.randomUUID(),
      computeDigest: (_algorithm, value) =>
        Array.from(
          crypto.createHash('sha256').update(String(value), 'utf8').digest()
        ).map((byte) => (byte > 127 ? byte - 256 : byte)),
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' }
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => true,
        hasLock: () => true,
        releaseLock: () => {}
      })
    },
    SpreadsheetApp: {
      getActiveSpreadsheet() {
        effects.spreadsheet += 1;
        return {
          getSheetByName: () => null
        };
      },
      getUi() {
        effects.ui += 1;
        return {
          createMenu: () => menu
        };
      }
    },
    WorkOsTaskRepository: {
      upsertPhase1MockTask() {
        effects.repository += 1;
        return {};
      }
    }
  };
  vm.createContext(sandbox);
  let configSource = fs.readFileSync(
    path.join(sourceRoot, '00_Config.gs'),
    'utf8'
  );
  if (!testMode) {
    configSource = configSource.replace('TEST_MODE: true', 'TEST_MODE: false');
  }
  vm.runInContext(configSource, sandbox, { filename: '00_Config.gs' });
  vm.runInContext(
    fs.readFileSync(path.join(sourceRoot, '17_Utilities.gs'), 'utf8'),
    sandbox,
    { filename: '17_Utilities.gs' }
  );
  return { sandbox, effects, menuItems };
}

function load(target, name) {
  vm.runInContext(
    fs.readFileSync(path.join(sourceRoot, name), 'utf8'),
    target,
    { filename: name }
  );
}

function expectDisabled(callback) {
  assert.throws(
    callback,
    (error) =>
      error &&
      error.code === 'E_TEST_MODE_DISABLED' &&
      !/token|password|credential|secret/i.test(String(error.message || ''))
  );
}

test('P0-F09-01_TEST_MODE_TRUE_ALLOWS_MOCK_ADAPTER', () => {
  const fixture = makeSandbox(true);
  load(fixture.sandbox, '07_AiAdapter.gs');
  const adapter = new fixture.sandbox.WorkOsAiAdapter.MockAiAdapter();
  assert.strictEqual(adapter.healthCheck().provider, 'MOCK');
});

test('P0-F09-02_FALSE_REJECTS_MOCK_ADAPTER_AND_FALLBACK', () => {
  const fixture = makeSandbox(false);
  load(fixture.sandbox, '07_AiAdapter.gs');
  expectDisabled(() =>
    new fixture.sandbox.WorkOsAiAdapter.MockAiAdapter()
  );
  expectDisabled(() =>
    fixture.sandbox.WorkOsAiAdapter.createAdapter({ mode: 'MOCK' })
  );
  assert.throws(
    () => fixture.sandbox.WorkOsAiAdapter.createAdapter(),
    (error) => error && error.code !== undefined && error.code !== ''
  );
  assert.throws(
    () => fixture.sandbox.WorkOsAiAdapter.getMetadata(null),
    (error) => error && error.code !== undefined && error.code !== ''
  );
});

test('P0-F09-03_ZERO_ARG_MOCK_WORKER_REJECTS_BEFORE_IO', () => {
  const fixture = makeSandbox(false);
  load(fixture.sandbox, '18_Worker.gs');
  expectDisabled(() =>
    fixture.sandbox.WorkOsWorker.processMockVerticalOnce()
  );
  expectDisabled(() =>
    fixture.sandbox.WorkOsWorker.runMockAcceptance()
  );
  expectDisabled(() => fixture.sandbox.processMockVerticalOnce());
  expectDisabled(() => fixture.sandbox.runMockAcceptance());
  assert.strictEqual(fixture.effects.spreadsheet, 0);
});

test('P0-F09-04_MOCK_TASK_REJECTS_BEFORE_SPREADSHEET_IO', () => {
  const fixture = makeSandbox(false);
  load(fixture.sandbox, '08_TaskRepository.gs');
  expectDisabled(() =>
    fixture.sandbox.WorkOsTaskRepository.upsertPhase1MockTask()
  );
  assert.strictEqual(fixture.effects.spreadsheet, 0);
});

test('P0-F09-05_PRODUCTION_MENU_OMITS_MOCK_AND_TEST_ITEMS', () => {
  const fixture = makeSandbox(false);
  load(fixture.sandbox, 'Menu.gs');
  fixture.sandbox.onOpen();
  const serialized = fixture.menuItems.join('\n');
  [
    'Mock',
    'Phase 1テスト',
    'Phase 2テスト',
    'Phase 3テスト',
    'Phase 4テスト',
    'Phase 5テスト',
    'Phase 6テスト',
    'Phase 7テスト'
  ].forEach((label) => {
    assert.strictEqual(serialized.includes(label), false);
  });
  expectDisabled(() => fixture.sandbox.menuUpsertPhase1MockTask());
  expectDisabled(() => fixture.sandbox.menuRunPhase1Tests());
  assert.strictEqual(fixture.effects.repository, 0);
});

test('P0-F09-06_TEST_HARNESS_PUBLIC_RUNNERS_HAVE_CENTRAL_GUARD', () => {
  const source = fs.readFileSync(
    path.join(sourceRoot, '99_TestHarness.gs'),
    'utf8'
  );
  [
    'runPhase1AcceptanceTests',
    'runPhase2AcceptanceTests',
    'runPhase3AcceptanceTests',
    'runPhase4AcceptanceTests',
    'runPhase5AcceptanceTests',
    'runPhase6AcceptanceTests',
    'runPhase7AcceptanceTests'
  ].forEach((name) => {
    const start = source.indexOf(`function ${name}()`);
    assert.ok(start !== -1, `${name} missing`);
    const body = source.slice(start, start + 220);
    assert.ok(
      body.includes('assertTestMode'),
      `${name} is missing assertTestMode`
    );
  });
});

const failed = results.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({
  suite: 'code_audit_p0_test_mode_guard',
  passed: results.length - failed.length,
  failed: failed.length,
  tests: results
}, null, 2)}\n`);
if (failed.length) {
  process.exitCode = 1;
}
