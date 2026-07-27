'use strict';

/**
 * F-015 CAS failure-injection tests.
 *
 * These tests deliberately change durable ownership, checkpoint stage,
 * preprocess input and Task row_version while AI classification is running
 * outside Script Lock. No real Google Workspace or provider is contacted.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const phase3Path = path.resolve(__dirname, 'phase3_local_test.js');
const phase3Source = fs.readFileSync(phase3Path, 'utf8');
const reportMarker = '\nconst summary = {\n';
const markerIndex = phase3Source.lastIndexOf(reportMarker);
if (markerIndex < 0) {
  throw new Error('PHASE3_FIXTURE_REPORT_MARKER_NOT_FOUND');
}

const exposure = `
globalThis.__prepilotCasFixture = {
  sandbox,
  makeOperationalSpreadsheet,
  rawMessage,
  seedPreprocessed,
  insertExistingTask,
  stateSheet,
  taskSheet,
  taskRow,
  setTaskCell,
  columnMap,
  scriptProperties,
  getScriptProperties: function () {
    return sandbox.PropertiesService.getScriptProperties();
  },
  isLockHeld: function () {
    return globalLockHeld;
  },
  reset: function () {
    activeSpreadsheet = null;
    lockAvailable = true;
    globalLockHeld = false;
    lockAttemptCount = 0;
    scriptProperties.clear();
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
  structuredClone,
  setTimeout,
  clearTimeout
};
vm.createContext(context);
vm.runInContext(
  phase3Source.slice(0, markerIndex) + exposure,
  context,
  { filename: 'phase3_prepilot_cas_fixture.js' }
);

const fixture = context.__prepilotCasFixture;
const sandbox = fixture.sandbox;
const Worker = sandbox.WorkOsWorker;
const State = sandbox.WorkOsMessageStateRepository;
const Config = sandbox.WorkOsConfig;
const FixtureDate = sandbox.Date;

function clockAt(iso) {
  return () => new FixtureDate(iso);
}

function candidateFor(message) {
  return {
    message_id: message.message_id,
    thread_id: message.thread_id,
    stable_thread_key: message.stable_thread_key,
    received_at: message.received_at,
    source_mode: 'AUTOMATIC',
    manual_decision: 'PROCESS',
    message_refs: [{
      id: message.message_id,
      internal_date: message.received_at.getTime()
    }]
  };
}

function gatewayFor(message) {
  return {
    createCallMeter: () => ({
      count: () => 0,
      limit: () => 100
    }),
    refetchMessageContent() {
      assert.strictEqual(fixture.isLockHeld(), false);
      return message;
    }
  };
}

function productionAdapter(onClassify) {
  const mock = new sandbox.WorkOsAiAdapter.MockAiAdapter();
  return {
    healthCheck: () => ({
      status: 'READY',
      credential_configured: true,
      external_request: false
    }),
    getMetadata: () => ({
      provider: 'SYNTHETIC_APPROVED_PROVIDER',
      model: 'synthetic-model',
      prompt_version: 'synthetic-prompt-v1'
    }),
    classify(input) {
      assert.strictEqual(fixture.isLockHeld(), false);
      const result = mock.classify(input);
      if (typeof onClassify === 'function') {
        onClassify(result, input);
      }
      return result;
    }
  };
}

function classificationOptions(spreadsheet, message, adapter) {
  return {
    spreadsheet,
    gateway: gatewayFor(message),
    adapter,
    properties: fixture.getScriptProperties(),
    selected_message_id: message.message_id,
    now: clockAt('2026-07-25T12:00:00.000Z'),
    budget: {
      isExhausted: () => false,
      remainingMs: () => 120000
    }
  };
}

function stateRecord(spreadsheet, messageId) {
  return State.createContext(
    fixture.stateSheet(spreadsheet)
  ).byMessageId[messageId];
}

function setStateCell(spreadsheet, messageId, columnId, value) {
  const sheet = fixture.stateSheet(spreadsheet);
  const record = stateRecord(spreadsheet, messageId);
  const map = fixture.columnMap(Config.SHEETS.MESSAGE_STATE);
  sheet.getRange(record.row, map[columnId] + 1, 1, 1)
    .setValues([[value]]);
}

function assertNoClassification(spreadsheet, messageId) {
  const record = stateRecord(spreadsheet, messageId);
  assert.strictEqual(record.classification_hash, '');
  assert.strictEqual(record.action_count, 0);
}

function expectErrorCode(callback, expectedCode) {
  let caught = null;
  try {
    callback();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught, `Expected ${expectedCode} but no error was thrown`);
  assert.strictEqual(caught.code, expectedCode);
}

const tests = [];
function test(id, body) {
  try {
    body();
    tests.push({ id, status: 'PASS' });
  } catch (error) {
    tests.push({
      id,
      status: 'FAIL',
      safe_message: sandbox.WorkOsUtilities.redact(
        String(error && error.message || error)
      ).slice(0, 240)
    });
  } finally {
    fixture.reset();
  }
}

test('PREP-CAS-01_OWNER_LOSS_REJECTS_STALE_AI_RESULT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-cas-owner-loss'
  });
  fixture.seedPreprocessed(spreadsheet, message);
  const adapter = productionAdapter(() => {
    State.withLockedContext(
      fixture.stateSheet(spreadsheet),
      (messageContext) => {
        State.markSkippedInContext(
          candidateFor(message),
          'competing-run',
          messageContext,
          new FixtureDate('2026-07-25T12:00:01.000Z')
        );
      }
    );
  });
  expectErrorCode(
    () => Worker.processProductionClassificationOnce(
      classificationOptions(spreadsheet, message, adapter)
    ),
    'E_AI_STALE_RESULT'
  );
  assertNoClassification(spreadsheet, message.message_id);
});

test('PREP-CAS-02_STAGE_ADVANCE_REJECTS_STALE_AI_RESULT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-cas-stage-advance'
  });
  fixture.seedPreprocessed(spreadsheet, message);
  const adapter = productionAdapter((competingClassification) => {
    State.withLockedContext(
      fixture.stateSheet(spreadsheet),
      (messageContext) => {
        const current = State.getByMessageId(
          messageContext,
          message.message_id
        );
        State.checkpointClassificationInContext(
          message.message_id,
          current.claim_run_id,
          competingClassification,
          messageContext,
          new FixtureDate('2026-07-25T12:00:01.000Z'),
          {
            provider: 'SYNTHETIC_COMPETING_PROVIDER',
            model: 'synthetic-competing-model',
            prompt_version: 'synthetic-competing-prompt'
          }
        );
      }
    );
  });
  expectErrorCode(
    () => Worker.processProductionClassificationOnce(
      classificationOptions(spreadsheet, message, adapter)
    ),
    'E_AI_STALE_RESULT'
  );
  const committed = stateRecord(spreadsheet, message.message_id);
  assert.strictEqual(committed.processing_status, 'CLASSIFIED');
  assert.strictEqual(
    committed.classification_provenance_json.provider,
    'SYNTHETIC_COMPETING_PROVIDER'
  );
});

test('PREP-CAS-03_TASK_ROW_VERSION_CHANGE_REJECTS_AI_RESULT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-cas-task-version'
  });
  fixture.seedPreprocessed(spreadsheet, message);
  const taskSheet = fixture.taskSheet(spreadsheet);
  const task = fixture.insertExistingTask(taskSheet, {
    stable_thread_key: message.stable_thread_key
  });
  const adapter = productionAdapter(() => {
    const row = fixture.taskRow(taskSheet, task.task_id);
    fixture.setTaskCell(
      taskSheet,
      row,
      'row_version',
      Number(task.row_version) + 1
    );
  });
  expectErrorCode(
    () => Worker.processProductionClassificationOnce(
      classificationOptions(spreadsheet, message, adapter)
    ),
    'E_AI_INPUT_CONFLICT'
  );
  assertNoClassification(spreadsheet, message.message_id);
  assert.strictEqual(
    Number(
      taskSheet.cells[
        fixture.taskRow(taskSheet, task.task_id) - 1
      ][fixture.columnMap(Config.SHEETS.TASKS).row_version]
    ),
    Number(task.row_version) + 1
  );
});

test('PREP-CAS-04_INPUT_HASH_CHANGE_REJECTS_AI_RESULT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-cas-input-change'
  });
  fixture.seedPreprocessed(spreadsheet, message);
  const adapter = productionAdapter(() => {
    setStateCell(
      spreadsheet,
      message.message_id,
      'preprocess_hash',
      'b'.repeat(64)
    );
  });
  expectErrorCode(
    () => Worker.processProductionClassificationOnce(
      classificationOptions(spreadsheet, message, adapter)
    ),
    'E_AI_INPUT_CONFLICT'
  );
  assertNoClassification(spreadsheet, message.message_id);
});

test('PREP-CAS-05_SECOND_WORKER_CANNOT_COMMIT_SAME_MESSAGE', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-cas-two-workers'
  });
  fixture.seedPreprocessed(spreadsheet, message);
  let secondResult = null;
  const secondAdapter = productionAdapter();
  const firstAdapter = productionAdapter(() => {
    secondResult = Worker.processProductionClassificationOnce(
      classificationOptions(spreadsheet, message, secondAdapter)
    );
  });
  const firstResult = Worker.processProductionClassificationOnce(
    classificationOptions(spreadsheet, message, firstAdapter)
  );
  assert.strictEqual(firstResult.status, 'CLASSIFIED');
  assert.strictEqual(secondResult.status, 'NOOP');
  const record = stateRecord(spreadsheet, message.message_id);
  assert.strictEqual(record.processing_status, 'CLASSIFIED');
  assert.strictEqual(record.action_count, 1);
});

const passed = tests.filter((item) => item.status === 'PASS').length;
const failed = tests.length - passed;
process.stdout.write(`${JSON.stringify({
  suite: 'prepilot_cas_failure_injection',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_provider_connection: 'NOT_EXECUTED',
  google_workspace: 'NOT_EXECUTED',
  passed,
  failed,
  tests
}, null, 2)}\n`);
if (failed) {
  process.exitCode = 1;
}
