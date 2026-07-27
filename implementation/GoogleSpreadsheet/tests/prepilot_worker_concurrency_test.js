'use strict';

/**
 * F-001 / F-007 physical Script Lock boundary tests.
 *
 * The Phase 3 in-memory Apps Script facade is reused. Every injected external
 * gateway asserts the physical Lock state at call time. No real service runs.
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
globalThis.__prepilotWorkerFixture = {
  sandbox,
  makeOperationalSpreadsheet,
  rawMessage,
  stateSheet,
  taskSheet,
  allTasks,
  scriptProperties,
  getScriptProperties: function () {
    return sandbox.PropertiesService.getScriptProperties();
  },
  setLockAvailable: function (value) {
    lockAvailable = value === true;
  },
  resetLockMetrics: function () {
    lockAttemptCount = 0;
    globalLockHeld = false;
    lockAvailable = true;
  },
  getLockAttempts: function () {
    return lockAttemptCount;
  },
  isLockHeld: function () {
    return globalLockHeld;
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
  { filename: 'phase3_prepilot_worker_fixture.js' }
);

const fixture = context.__prepilotWorkerFixture;
const sandbox = fixture.sandbox;
const Worker = sandbox.WorkOsWorker;
const State = sandbox.WorkOsMessageStateRepository;
const Config = sandbox.WorkOsConfig;
const FixtureDate = sandbox.Date;

function clockAt(iso) {
  return () => new FixtureDate(iso);
}

function clearProperties() {
  fixture.scriptProperties.clear();
  return fixture.getScriptProperties();
}

function candidateFor(message, sourceMode) {
  return {
    message_id: message.message_id,
    thread_id: message.thread_id,
    stable_thread_key: message.stable_thread_key,
    received_at: message.received_at,
    source_mode: sourceMode,
    manual_decision: 'PROCESS',
    message_refs: [{
      id: message.message_id,
      internal_date: message.received_at.getTime()
    }]
  };
}

function allStates(spreadsheet) {
  return State.createContext(
    fixture.stateSheet(spreadsheet)
  ).logicalRows;
}

function instrumentedGateway(messages, mode, hooks = {}) {
  const byId = new Map(messages.map((message) => [
    message.message_id,
    message
  ]));
  const calls = {
    list: 0,
    fetch: 0,
    refetch: 0,
    labels: 0,
    failureLabels: 0
  };
  function outsideLock(operation) {
    assert.strictEqual(
      fixture.isLockHeld(),
      false,
      `${operation} ran while physical Script Lock was held`
    );
    if (typeof hooks[operation] === 'function') {
      hooks[operation]();
    }
  }
  return {
    calls,
    createCallMeter: () => ({
      count: () => 0,
      limit: () => 100
    }),
    listManualCandidates() {
      outsideLock('manualSearch');
      calls.list += 1;
      return messages.map((message) => candidateFor(message, 'MANUAL'));
    },
    listAutomaticCandidates(settings) {
      outsideLock('automaticSearch');
      calls.list += 1;
      const known = settings.known_message_ids || {};
      return {
        candidates: messages
          .filter((message) => !known[message.message_id])
          .map((message) => candidateFor(message, 'AUTOMATIC')),
        searched_threads: messages.length,
        search_complete: true,
        search_saturated: false,
        candidate_overflow: false,
        resume_page_token: '',
        filter_counts: {}
      };
    },
    fetchSelectedContent(candidate) {
      outsideLock('messageRead');
      calls.fetch += 1;
      return byId.get(candidate.message_id);
    },
    refetchMessageContent(record) {
      outsideLock('messageRead');
      calls.refetch += 1;
      return byId.get(record.message_id);
    },
    buildLabelCache() {
      outsideLock('labelRead');
      return {};
    },
    syncAiLabels() {
      outsideLock('labelWrite');
      calls.labels += 1;
      return { added_count: 0, removed_count: 0 };
    },
    setSystemFailureLabel() {
      outsideLock('labelWrite');
      calls.failureLabels += 1;
      return { added_count: 0, removed_count: 0 };
    },
    mode
  };
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
      ).slice(0, 220)
    });
  } finally {
    fixture.setLockAvailable(true);
    fixture.scriptProperties.clear();
  }
}

test('PREP-WORKER-01_MANUAL_GMAIL_SEARCH_AND_READ_OUTSIDE_LOCK', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-manual-lock-boundary'
  });
  const result = Worker.processManualImportOnce({
    spreadsheet,
    gateway: instrumentedGateway([message], 'MANUAL'),
    properties: clearProperties(),
    now: clockAt('2026-07-25T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.status, 'COMPLETE');
  assert.strictEqual(result.processed_count, 1);
  assert.strictEqual(allStates(spreadsheet)[0].processing_status, 'PREPROCESSED');
});

test('PREP-WORKER-02_AUTO_GMAIL_AI_AND_LABEL_IO_OUTSIDE_LOCK', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-auto-lock-boundary'
  });
  const gateway = instrumentedGateway([message], 'AUTOMATIC');
  const mock = new sandbox.WorkOsAiAdapter.MockAiAdapter();
  const adapter = {
    healthCheck: () => mock.healthCheck(),
    getMetadata: () => mock.getMetadata(),
    classify(input) {
      assert.strictEqual(
        fixture.isLockHeld(),
        false,
        'AI classify ran while physical Script Lock was held'
      );
      return mock.classify(input);
    }
  };
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway,
    properties: clearProperties(),
    adapter,
    now: clockAt('2026-07-25T12:00:00.000Z'),
    budget: {
      isExhausted: () => false,
      remainingMs: () => 120000
    }
  });
  assert.strictEqual(result.status, 'COMPLETE');
  assert.strictEqual(result.processed_count, 1);
  assert.strictEqual(allStates(spreadsheet)[0].processing_status, 'DONE');
  assert.strictEqual(gateway.calls.list, 1);
  assert.strictEqual(gateway.calls.fetch + gateway.calls.refetch, 1);
});

test('PREP-WORKER-03_RELOCK_FAILURE_DOES_NOT_COMMIT_STALE_PREPROCESS', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-relock-failure'
  });
  const gateway = instrumentedGateway([message], 'MANUAL', {
    messageRead: () => fixture.setLockAvailable(false)
  });
  const result = Worker.processManualImportOnce({
    spreadsheet,
    gateway,
    properties: clearProperties(),
    now: clockAt('2026-07-25T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  const states = allStates(spreadsheet);
  assert.strictEqual(result.status, 'FAILED');
  assert.strictEqual(states.length, 1);
  assert.notStrictEqual(states[0].processing_status, 'PREPROCESSED');
  assert.strictEqual(String(states[0].preprocess_hash || ''), '');
});

const failed = tests.filter((item) => item.status === 'FAIL');
const report = {
  suite: 'prepilot_worker_concurrency',
  environment: 'LOCAL_INSTRUMENTED_FAKE',
  real_gmail: 'NOT_EXECUTED',
  real_provider: 'NOT_EXECUTED',
  real_calendar: 'NOT_EXECUTED',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  process.exitCode = 1;
}
