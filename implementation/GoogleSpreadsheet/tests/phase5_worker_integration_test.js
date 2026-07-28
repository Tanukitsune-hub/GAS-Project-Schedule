'use strict';

/**
 * Phase 5 ExternalAiAdapter-to-Worker integration tests.
 *
 * The existing Phase 3 local fixture is evaluated without its report footer so
 * this suite can reuse the same in-memory Apps Script facade. All provider
 * responses and identifiers are synthetic. No network or Google service is
 * contacted.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const phase3Path = path.resolve(__dirname, 'phase3_local_test.js');
const phase3Source = fs.readFileSync(phase3Path, 'utf8')
  .replace(/\r\n/g, '\n');
const reportMarker = '\nconst summary = {\n';
const reportIndex = phase3Source.lastIndexOf(reportMarker);
if (reportIndex < 0) {
  throw new Error('PHASE3_FIXTURE_REPORT_MARKER_NOT_FOUND');
}

const fixtureExposure = `
globalThis.__phase5WorkerFixture = {
  sandbox,
  makeOperationalSpreadsheet,
  rawMessage,
  seedPreprocessed,
  makeVerticalGateway,
  taskSheet,
  stateSheet,
  allTasks
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
  phase3Source.slice(0, reportIndex) + fixtureExposure,
  context,
  { filename: 'phase3_local_fixture.js' }
);

const fixture = context.__phase5WorkerFixture;
const AI = fixture.sandbox.WorkOsAiAdapter;
const State = fixture.sandbox.WorkOsMessageStateRepository;
const Worker = fixture.sandbox.WorkOsWorker;
const FixtureDate = fixture.sandbox.Date;
const EXTERNAL_METADATA = Object.freeze({
  provider: 'SYNTHETIC_APPROVED_PROVIDER',
  model: 'synthetic-model-v1',
  prompt_version: 'synthetic-prompt-v1'
});
const SYNTHETIC_CREDENTIAL = 'SYNTHETIC_TEST_CREDENTIAL_NOT_REAL';

function externalAdapter(responses) {
  const transport = new AI.MockHttpTransport(responses || []);
  const adapter = new AI.ExternalAiAdapter({
    provider: EXTERNAL_METADATA.provider,
    model: EXTERNAL_METADATA.model,
    prompt_version: EXTERNAL_METADATA.prompt_version,
    external_enabled: true,
    company_approved: true,
    data_policy_approved: true,
    credential_storage_approved: true,
    auth_configured: true,
    credential_provider: {
      isConfigured: () => true,
      getCredential: () => SYNTHETIC_CREDENTIAL
    },
    transport,
    timeout_ms: 30000,
    max_response_chars: 100000
  });
  return { adapter, transport };
}

function responseFor(preprocessed) {
  const output = new AI.MockAiAdapter().classify(
    AI.buildInput(preprocessed)
  );
  return { status: 200, body: JSON.stringify(output) };
}

function readOnlyState(spreadsheet) {
  return State.createContext(fixture.stateSheet(spreadsheet)).logicalRows;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
      safe_message: fixture.sandbox.WorkOsUtilities.redact(
        error && error.message || String(error)
      )
    });
  }
}

test('P5-I01_EXTERNAL_MOCK_HTTP_WORKER_PERSISTS_PROVENANCE', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('NEW_HIGH', {
    message_id: 'synthetic-phase5-worker-success'
  });
  const preprocessed = fixture.seedPreprocessed(spreadsheet, message);
  const gateway = fixture.makeVerticalGateway(message);
  const external = externalAdapter([responseFor(preprocessed)]);

  const first = Worker.processMockVerticalOnce({
    spreadsheet,
    gateway,
    adapter: external.adapter,
    now: () => new FixtureDate('2026-07-24T01:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(first.status, 'COMPLETE');
  assert.strictEqual(first.external_services.ai, 'EXTERNAL_ADAPTER');
  assert.strictEqual(external.transport.calls.length, 1);

  const states = readOnlyState(spreadsheet);
  assert.strictEqual(states.length, 1);
  assert.deepStrictEqual(
    clone(states[0].classification_provenance_json),
    EXTERNAL_METADATA
  );
  assert.strictEqual(
    states[0].classification_hash,
    AI.classificationHash(
      states[0].classification_json,
      states[0].classification_provenance_json
    )
  );

  const tasks = fixture.allTasks(fixture.taskSheet(spreadsheet));
  assert.strictEqual(tasks.length, 1);
  assert.strictEqual(tasks[0].ai_provider, EXTERNAL_METADATA.provider);
  assert.strictEqual(tasks[0].ai_model, EXTERNAL_METADATA.model);
  assert.strictEqual(
    tasks[0].ai_prompt_version,
    EXTERNAL_METADATA.prompt_version
  );

  const replay = Worker.processMockVerticalOnce({
    spreadsheet,
    gateway,
    adapter: external.adapter,
    now: () => new FixtureDate('2026-07-24T02:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(replay.processed_count, 0);
  assert.strictEqual(external.transport.calls.length, 1);
  assert.strictEqual(
    fixture.allTasks(fixture.taskSheet(spreadsheet)).length,
    1
  );
});

test('P5-I02_AI_FAILURE_HAS_ZERO_TASK_AND_CALENDAR_SIDE_EFFECT', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('NEW_HIGH', {
    message_id: 'synthetic-phase5-worker-timeout'
  });
  fixture.seedPreprocessed(spreadsheet, message);
  const gateway = fixture.makeVerticalGateway(message);
  const external = externalAdapter([{ error_kind: 'TIMEOUT' }]);

  const result = Worker.processMockVerticalOnce({
    spreadsheet,
    gateway,
    adapter: external.adapter,
    now: () => new FixtureDate('2026-07-24T01:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.status, 'FAILED');
  assert.strictEqual(result.calendar_job_count, 0);
  assert.strictEqual(
    fixture.allTasks(fixture.taskSheet(spreadsheet)).length,
    0
  );
  const state = readOnlyState(spreadsheet)[0];
  assert.strictEqual(state.resume_stage, 'CLASSIFY');
  assert.strictEqual(state.last_error_code, 'E_AI_TIMEOUT');
  assert.strictEqual(state.classification_json, null);
  assert.strictEqual(state.classification_provenance_json, null);
});

test('P5-I03_SAVED_EXTERNAL_CLASSIFICATION_RESUMES_WITHOUT_AI', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = fixture.rawMessage('NEW_HIGH', {
    message_id: 'synthetic-phase5-saved-classification'
  });
  const preprocessed = fixture.seedPreprocessed(spreadsheet, message);
  const external = externalAdapter([]);
  const classification = new AI.MockAiAdapter().classify(
    AI.buildInput(preprocessed)
  );

  State.withLockedContext(fixture.stateSheet(spreadsheet), (stateContext) => {
    const claim = State.claimForResumeInContext(
      message.message_id,
      'synthetic-phase5-checkpoint-run',
      stateContext,
      new FixtureDate('2026-07-24T00:20:00.000Z')
    );
    assert.strictEqual(claim.claimed, true);
    State.checkpointClassificationInContext(
      message.message_id,
      'synthetic-phase5-checkpoint-run',
      classification,
      stateContext,
      new FixtureDate('2026-07-24T00:20:01.000Z'),
      EXTERNAL_METADATA
    );
  });

  const gateway = fixture.makeVerticalGateway(message);
  const result = Worker.processMockVerticalOnce({
    spreadsheet,
    gateway,
    adapter: external.adapter,
    now: () => new FixtureDate('2026-07-24T01:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.status, 'COMPLETE');
  assert.strictEqual(result.classification_reused, true);
  assert.strictEqual(result.external_services.ai, 'NOT_CALLED_CHECKPOINT_REUSE');
  assert.strictEqual(external.transport.calls.length, 0);
  assert.strictEqual(
    fixture.allTasks(fixture.taskSheet(spreadsheet)).length,
    1
  );
  const state = readOnlyState(spreadsheet)[0];
  assert.strictEqual(state.processing_status, 'DONE');
  assert.deepStrictEqual(
    clone(state.classification_provenance_json),
    EXTERNAL_METADATA
  );
});

test('P5-I04_REAL_TRANSPORT_WORKER_PATH_IS_DISABLED', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  let transportCalls = 0;
  const adapter = new AI.ExternalAiAdapter({
    provider: EXTERNAL_METADATA.provider,
    model: EXTERNAL_METADATA.model,
    prompt_version: EXTERNAL_METADATA.prompt_version,
    external_enabled: true,
    company_approved: true,
    data_policy_approved: true,
    credential_storage_approved: true,
    auth_configured: true,
    credential_provider: {
      isConfigured: () => true,
      getCredential: () => SYNTHETIC_CREDENTIAL
    },
    transport: {
      send: () => {
        transportCalls += 1;
        return { status: 200, body: '{}' };
      }
    }
  });
  assert.throws(
    () => Worker.processMockVerticalOnce({
      spreadsheet,
      adapter,
      now: () => new FixtureDate('2026-07-24T01:00:00.000Z'),
      budget: { isExhausted: () => false }
    }),
    (error) => error.code === 'E_AI_EXTERNAL_WORKER_DISABLED'
  );
  assert.strictEqual(transportCalls, 0);
});

const summary = {
  phase: 5,
  suite: 'external_ai_worker_integration',
  environment: 'LOCAL_VM_MOCK_HTTP',
  real_provider_connection: 'NOT_EXECUTED',
  google_workspace: 'NOT_EXECUTED',
  passed: tests.filter((item) => item.status === 'PASS').length,
  failed: tests.filter((item) => item.status === 'FAIL').length,
  tests
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed > 0) {
  process.exitCode = 1;
}
