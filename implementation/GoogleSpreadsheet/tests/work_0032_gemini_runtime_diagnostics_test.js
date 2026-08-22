'use strict';

/**
 * Work 0032 diagnostics, Message finalization, and exact-candidate tests.
 *
 * Every provider response, Message, and credential in this suite is synthetic
 * and in-memory. No Google service, Apps Script runtime, or network is used.
 */
const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'apps-script-v2');

function disabledAutomationStatus() {
  return {
    status: 'CONSISTENT',
    enabled: false,
    desired_enabled: false,
    trigger_count: 0,
    clock_trigger_count: 0,
    stored_trigger_id_present: false,
    canonical_trigger_present: false
  };
}

function makeProviderFixture() {
  const propertyValues = new Map();
  let responseStatus = 200;
  let responseBody = '';
  let fetchCalls = 0;
  let bodyReads = 0;
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
      computeDigest: (_algorithm, value) => Array.from(
        crypto.createHash('sha256').update(String(value), 'utf8').digest()
      ).map((byte) => (byte > 127 ? byte - 256 : byte)),
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' }
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => propertyValues.get(String(key)) || null
      })
    },
    UrlFetchApp: {
      fetch: () => {
        fetchCalls += 1;
        return {
          getResponseCode: () => responseStatus,
          getContentText: () => {
            bodyReads += 1;
            return responseBody;
          }
        };
      }
    },
    WorkOsAutomation: {
      getDiagnosticAutomationStatus: disabledAutomationStatus
    }
  };
  vm.createContext(sandbox);
  [
    '00_Config.gs',
    '17_Utilities.gs',
    '07_AiAdapter.gs',
    '20_GeminiProvider.gs'
  ].forEach((name) => vm.runInContext(
    fs.readFileSync(path.join(sourceRoot, name), 'utf8'),
    sandbox,
    { filename: name }
  ));
  return {
    sandbox,
    AI: sandbox.WorkOsAiAdapter,
    Gemini: sandbox.WorkOsGeminiProvider,
    setResponse(status, body) {
      responseStatus = status;
      responseBody = body;
      fetchCalls = 0;
      bodyReads = 0;
      propertyValues.set(
        sandbox.WorkOsGeminiProvider.CREDENTIAL_REFERENCE,
        'synthetic-work-0032-credential'
      );
    },
    metrics() {
      return { fetchCalls, bodyReads };
    }
  };
}

function providerInput() {
  return {
    schema_version: '2.0',
    message: {
      message_id: 'synthetic-provider-message',
      thread_id: 'synthetic-provider-thread',
      stable_thread_key: 'root:synthetic-provider-thread',
      subject: 'Synthetic provider input',
      sender: 'fixture@example.invalid',
      received_at: '2026-08-17T00:00:00.000Z',
      plain_body: 'Synthetic provider body only.',
      prior_messages: []
    },
    active_tasks: [],
    context: { today: '2026-08-17', timezone: 'Asia/Tokyo' },
    constraints: {
      max_actions: 10,
      no_attachment_analysis: true,
      no_email_send: true
    }
  };
}

function providerConfig(fixture) {
  return {
    external_enabled: true,
    provider: 'GEMINI',
    model: fixture.Gemini.MODEL,
    prompt_version: fixture.Gemini.PROMPT_VERSION,
    credential_reference: fixture.Gemini.CREDENTIAL_REFERENCE,
    company_approved: true,
    data_policy_approved: true,
    credential_storage_approved: true,
    auth_configured: true,
    timeout_ms: 30000,
    max_response_chars: 100000
  };
}

function providerFailure(fixture, status, code, bodyExtras) {
  const body = Object.assign({
    error: {
      code,
      message: 'SENSITIVE provider message must never surface',
      details: [{ interaction_id: 'synthetic-private-interaction' }]
    },
    extra: bodyExtras || 'synthetic-extra'
  });
  fixture.setResponse(status, JSON.stringify(body));
  const adapter = fixture.AI.createProductionExternalAdapter({
    config: providerConfig(fixture),
    registry: fixture.AI.getProductionProviderRegistry()
  });
  let error = null;
  try {
    adapter.classify(providerInput());
  } catch (caught) {
    error = caught;
  }
  assert.ok(error);
  return error;
}

const provider = makeProviderFixture();

const phase3Path = path.join(root, 'tests', 'phase3_local_test.js');
const phase3Source = fs.readFileSync(phase3Path, 'utf8').replace(/\r\n/g, '\n');
const reportMarker = '\nconst summary = {\n';
const reportIndex = phase3Source.lastIndexOf(reportMarker);
if (reportIndex < 0) {
  throw new Error('PHASE3_FIXTURE_REPORT_MARKER_NOT_FOUND');
}
const fixtureContext = {
  require,
  __dirname: path.dirname(phase3Path),
  __filename: phase3Path,
  console,
  process: { stdout: { write: () => {} }, exitCode: 0 },
  Buffer,
  structuredClone,
  setTimeout,
  clearTimeout
};
vm.createContext(fixtureContext);
const workerExposure = `
globalThis.__work0032Fixture = {
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
vm.runInContext(
  phase3Source.slice(0, reportIndex) +
    workerExposure,
  fixtureContext,
  { filename: 'work_0032_phase3_fixture.js' }
);
vm.runInContext(
  fs.readFileSync(path.join(sourceRoot, '20_GeminiProvider.gs'), 'utf8'),
  fixtureContext.__work0032Fixture.sandbox,
  { filename: '20_GeminiProvider.gs' }
);
const fixture = fixtureContext.__work0032Fixture;
const Worker = fixture.sandbox.WorkOsWorker;
const State = fixture.sandbox.WorkOsMessageStateRepository;
const AI = fixture.sandbox.WorkOsAiAdapter;
const Gemini = fixture.sandbox.WorkOsGeminiProvider;
const FixtureDate = fixture.sandbox.Date;
const SYNTHETIC_BODY = [
  'WORK_OS_SYNTHETIC_GEMINI_BODY_0029',
  'これは架空の検証用メールです。個人情報、機密情報、実在の本番データを含みません。',
  '架空の社内タスクとして、Gemini連携の動作確認メモを確認してください。',
  '処理日から7日後までに確認してください。',
  '外部提出、法律、税務、規制、契約、入札、その他の高影響なカレンダー予定ではありません。'
].join('\n');

function makeSyntheticMessage(id, subject = Gemini.SYNTHETIC_SUBJECT) {
  return {
    message_id: id,
    thread_id: `synthetic-thread-${id}`,
    stable_thread_key: `root:synthetic-${id}`,
    subject,
    sender: 'synthetic@example.invalid',
    received_at: new FixtureDate('2026-08-17T00:00:00.000Z'),
    plain_body: subject === Gemini.SYNTHETIC_SUBJECT
      ? SYNTHETIC_BODY
      : 'Historical synthetic fixture only.',
    previous_messages: []
  };
}

function makeCandidate(message) {
  return {
    message_id: message.message_id,
    thread_id: message.thread_id,
    stable_thread_key: message.stable_thread_key,
    subject: message.subject,
    received_at: message.received_at,
    source_mode: 'MANUAL',
    manual_decision: 'PROCESS'
  };
}

function makeBundle(id) {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const message = makeSyntheticMessage(id);
  const preprocessed = fixture.seedPreprocessed(spreadsheet, message);
  return {
    spreadsheet,
    message,
    candidate: makeCandidate(message),
    preprocessed
  };
}

function externalAdapter(responses) {
  const transport = new AI.MockHttpTransport(responses || []);
  const adapter = new AI.ExternalAiAdapter({
    provider: Gemini.PROVIDER_ID,
    model: Gemini.MODEL,
    prompt_version: Gemini.PROMPT_VERSION,
    external_enabled: true,
    company_approved: true,
    data_policy_approved: true,
    credential_storage_approved: true,
    auth_configured: true,
    credential_provider: {
      isConfigured: () => true,
      getCredential: () => 'synthetic-work-0032-credential'
    },
    transport,
    timeout_ms: 30000,
    max_response_chars: 100000
  });
  return { adapter, transport };
}

function successfulResponse(preprocessed) {
  const output = new AI.MockAiAdapter().classify(
    AI.buildInput(preprocessed)
  );
  return { status: 200, body: JSON.stringify(output) };
}

function syntheticOptions(bundle, adapter, gateway) {
  return {
    spreadsheet: bundle.spreadsheet,
    candidate: bundle.candidate,
    preprocessed_result: bundle.preprocessed,
    adapter,
    gateway: gateway || fixture.makeVerticalGateway(bundle.message),
    now: () => new FixtureDate('2026-08-17T01:00:00.000Z'),
    automation_status: disabledAutomationStatus(),
    budget: { isExhausted: () => false }
  };
}

function stateFor(bundle, id) {
  return State.createContext(fixture.stateSheet(bundle.spreadsheet))
    .byMessageId[id];
}

const tests = [];
function test(name, body) {
  try {
    body();
    tests.push({ name, status: 'PASS' });
  } catch (error) {
    tests.push({
      name,
      status: 'FAIL',
      safe_message: String(error && error.message || error).slice(0, 180)
    });
  }
}

test('NON_2XX_INVALID_REQUEST_RETAINS_ONLY_STATUS_AND_SAFE_CODE', () => {
  const error = providerFailure(provider, 400, 'invalid_request');
  const safe = provider.sandbox.WorkOsUtilities.safeError(error);
  assert.strictEqual(error.code, 'E_AI_INVALID_REQUEST');
  assert.strictEqual(safe.diagnostic.provider_http_status, 400);
  assert.strictEqual(safe.diagnostic.provider_error_code, 'invalid_request');
  assert.ok(!JSON.stringify(safe).includes('SENSITIVE'));
  assert.strictEqual(provider.metrics().bodyReads, 1);
});

test('PARAMETER_UNKNOWN_REMAINS_DISTINGUISHABLE_WITH_FAIL_CLOSED_MAPPING', () => {
  const error = providerFailure(provider, 400, 'parameter_unknown');
  const safe = provider.sandbox.WorkOsUtilities.safeError(error);
  assert.strictEqual(error.code, 'E_AI_INVALID_REQUEST');
  assert.strictEqual(safe.diagnostic.provider_error_code, 'parameter_unknown');
});

test('MALICIOUS_OR_OVERLONG_PROVIDER_CODE_COLLAPSES_TO_FIXED_SENTINEL', () => {
  const malicious = providerFailure(
    provider,
    400,
    'bad code with sensitive provider message and private id'
  );
  const overlong = providerFailure(provider, 400, 'a'.repeat(65));
  assert.strictEqual(
    provider.sandbox.WorkOsUtilities.safeError(malicious)
      .diagnostic.provider_error_code,
    'UNSAFE_PROVIDER_ERROR_CODE'
  );
  assert.strictEqual(
    provider.sandbox.WorkOsUtilities.safeError(overlong)
      .diagnostic.provider_error_code,
    'UNSAFE_PROVIDER_ERROR_CODE'
  );
  assert.ok(!String(malicious.message).includes('provider message'));
});

test('EXISTING_HTTP_TO_WORK_OS_MAPPINGS_REMAIN_UNCHANGED', () => {
  [
    [401, 'authentication', 'E_AI_AUTH', false],
    [403, 'permission_denied', 'E_AI_PERMISSION', false],
    [429, 'rate_limited', 'E_AI_RATE_LIMIT', true],
    [500, 'internal_error', 'E_AI_UPSTREAM', true]
  ].forEach(([status, code, expected, retryable]) => {
    const error = providerFailure(provider, status, code);
    assert.strictEqual(error.code, expected);
    assert.strictEqual(error.retryable, retryable);
    assert.strictEqual(
      provider.sandbox.WorkOsUtilities.safeError(error)
        .diagnostic.provider_http_status,
      status
    );
  });
});

test('VALID_THOUGHT_SEQUENCE_REMAINS_ACCEPTED', () => {
  const output = {
    schema_version: '2.0',
    overall_confidence: 0.9,
    actions: [],
    warnings: []
  };
  provider.setResponse(200, JSON.stringify({
    status: 'completed',
    steps: [
      { type: 'thought', summary: 'opaque synthetic thought' },
      { type: 'model_output', content: [{
        type: 'text',
        text: JSON.stringify(output)
      }] }
    ]
  }));
  const adapter = provider.AI.createProductionExternalAdapter({
    config: providerConfig(provider),
    registry: provider.AI.getProductionProviderRegistry()
  });
  assert.deepStrictEqual(adapter.classify(providerInput()), output);
});

test('INVALID_2XX_EXPOSES_ONLY_ALLOWLISTED_INTERACTION_STATUS', () => {
  provider.setResponse(200, JSON.stringify({
    status: 'in_progress',
    steps: [],
    message: 'sensitive invalid response message'
  }));
  const adapter = provider.AI.createProductionExternalAdapter({
    config: providerConfig(provider),
    registry: provider.AI.getProductionProviderRegistry()
  });
  let error = null;
  try {
    adapter.classify(providerInput());
  } catch (caught) {
    error = caught;
  }
  assert.strictEqual(error.code, 'E_AI_PROVIDER_RESPONSE');
  const safe = provider.sandbox.WorkOsUtilities.safeError(error);
  assert.strictEqual(safe.diagnostic.provider_http_status, 200);
  assert.strictEqual(
    safe.diagnostic.provider_interaction_status,
    'in_progress'
  );
  assert.ok(!JSON.stringify(safe).includes('sensitive invalid response'));
});

test('FAILURE_FINALIZATION_USES_MESSAGE_CONTEXT_ONLY', () => {
  const bundle = makeBundle('synthetic-work-0032-finalize');
  const external = externalAdapter([{ error_kind: 'TIMEOUT' }]);
  const taskSheet = fixture.taskSheet(bundle.spreadsheet);
  const originalGetRange = taskSheet.getRange;
  let taskContextCalls = 0;
  taskSheet.getRange = function () {
    taskContextCalls += 1;
    if (taskContextCalls > 4) {
      throw new Error('synthetic task context unavailable after provider failure');
    }
    return originalGetRange.apply(this, arguments);
  };
  try {
    const result = Worker.runGeminiSyntheticValidation(
      syntheticOptions(bundle, external.adapter)
    );
    assert.strictEqual(result.status, 'FAILED');
    assert.strictEqual(result.failure_finalization, 'RECORDED');
    assert.strictEqual(result.error_code, 'E_AI_TIMEOUT');
    assert.strictEqual(stateFor(bundle, bundle.message.message_id).processing_status,
      State.STATUSES.RETRY);
    assert.strictEqual(fixture.allTasks(fixture.taskSheet(bundle.spreadsheet)).length, 0);
    assert.strictEqual(taskContextCalls, 4);
  } finally {
    taskSheet.getRange = originalGetRange;
  }
});

test('CANONICAL_SCHEMA_FAILURE_FINALIZES_MESSAGE_WITH_ONE_CALL_AND_NO_DOWNSTREAM_WRITES', () => {
  const bundle = makeBundle('synthetic-work-0036-schema-rule');
  const canonicalResponse = successfulResponse(bundle.preprocessed);
  const invalidOutput = JSON.parse(canonicalResponse.body);
  invalidOutput.actions[0].changes = {
    task_title: 'private provider output marker-0036-schema-failure'
  };
  const external = externalAdapter([{
    status: 200,
    body: JSON.stringify(invalidOutput)
  }]);
  const gateway = fixture.makeVerticalGateway(bundle.message);
  const result = Worker.runGeminiSyntheticValidation(
    syntheticOptions(bundle, external.adapter, gateway)
  );
  const state = stateFor(bundle, bundle.message.message_id);
  const serialized = JSON.stringify(result);
  assert.strictEqual(result.status, 'FAILED');
  assert.strictEqual(result.error_code, 'E_AI_SCHEMA');
  assert.strictEqual(result.error_stage, 'AI_RESPONSE');
  assert.strictEqual(result.failure_finalization, 'RECORDED');
  assert.strictEqual(result.canonical_schema_rule, 'CHANGES_FIELDS');
  assert.strictEqual(state.processing_status, State.STATUSES.DEAD);
  assert.strictEqual(Number(state.retry_count), 0);
  assert.strictEqual(String(state.next_retry_at || ''), '');
  assert.strictEqual(fixture.allTasks(fixture.taskSheet(bundle.spreadsheet)).length, 0);
  assert.strictEqual(Number(result.created_task_count || 0), 0);
  assert.strictEqual(Number(result.updated_task_count || 0), 0);
  assert.strictEqual(Number(result.review_count || 0), 0);
  assert.strictEqual(Number(result.calendar_job_count || 0), 0);
  assert.strictEqual(external.transport.calls.length, 1);
  assert.strictEqual(serialized.includes('marker-0036-schema-failure'), false);
  assert.strictEqual(serialized.includes('private provider output'), false);
});

test('FAILURE_FINALIZATION_FAULT_IS_EXPLICIT_PENDING', () => {
  const bundle = makeBundle('synthetic-work-0032-pending');
  const external = externalAdapter([{ error_kind: 'TIMEOUT' }]);
  const messageSheet = fixture.stateSheet(bundle.spreadsheet);
  const originalGetRange = messageSheet.getRange;
  let writes = 0;
  messageSheet.getRange = function () {
    const range = originalGetRange.apply(this, arguments);
    const originalSetValues = range.setValues;
    range.setValues = function (values) {
      writes += 1;
      if (writes >= 2) {
        throw new Error('synthetic message write unavailable');
      }
      return originalSetValues.call(this, values);
    };
    return range;
  };
  try {
    const result = Worker.runGeminiSyntheticValidation(
      syntheticOptions(bundle, external.adapter)
    );
    assert.strictEqual(result.status, 'FAILED');
    assert.strictEqual(result.failure_finalization, 'PENDING');
    assert.strictEqual(
      result.failure_finalization_code,
      'E_MESSAGE_FAILURE_CHECKPOINT_PENDING'
    );
    assert.strictEqual(stateFor(bundle, bundle.message.message_id).processing_status,
      State.STATUSES.CLAIMED);
  } finally {
    messageSheet.getRange = originalGetRange;
  }
});

test('SYNTHETIC_RESULT_IS_PRIVACY_SAFE_AND_DIAGNOSTICALLY_BOUNDED', () => {
  const bundle = makeBundle('synthetic-work-0032-ui');
  const external = externalAdapter([{ error_kind: 'TIMEOUT' }]);
  const result = Worker.runGeminiSyntheticValidation(
    syntheticOptions(bundle, external.adapter)
  );
  const serialized = JSON.stringify(result);
  assert.strictEqual(result.error_code, 'E_AI_TIMEOUT');
  assert.strictEqual(result.error_stage, 'AI_REQUEST');
  assert.strictEqual(result.failure_finalization, 'RECORDED');
  assert.ok(!serialized.includes(bundle.message.message_id));
  assert.ok(!serialized.includes(bundle.message.thread_id));
  assert.ok(!serialized.includes(SYNTHETIC_BODY));
  assert.ok(!serialized.includes('synthetic-work-0032-credential'));
  assert.ok(!serialized.includes('SENSITIVE provider message'));
  assert.ok(!Object.prototype.hasOwnProperty.call(result, 'run_id'));
});

test('EXACT_SYNTHETIC_CANDIDATE_WINS_OVER_HISTORICAL_RESUMABLE_ROW', () => {
  const stale = makeBundle('synthetic-work-0032-stale');
  const bundle = makeBundle('synthetic-work-0032-selected');
  const external = externalAdapter([successfulResponse(bundle.preprocessed)]);
  const gateway = fixture.makeVerticalGateway(bundle.message);
  const result = Worker.runGeminiSyntheticValidation(
    syntheticOptions(bundle, external.adapter, gateway)
  );
  assert.strictEqual(result.status, 'COMPLETE');
  assert.strictEqual(stateFor(bundle, bundle.message.message_id).processing_status,
    State.STATUSES.DONE);
  assert.strictEqual(stateFor(stale, stale.message.message_id).processing_status,
    State.STATUSES.PREPROCESSED);
  assert.strictEqual(gateway.calls.aiLabels.length, 1);
  assert.strictEqual(gateway.calls.aiLabels[0].thread_id, bundle.message.thread_id);
  assert.strictEqual(external.transport.calls.length, 1);
});

test('TERMINAL_EXACT_CANDIDATE_FAILS_CLOSED_WITHOUT_FALLBACK', () => {
  const stale = makeBundle('synthetic-work-0032-terminal-stale');
  const bundle = makeBundle('synthetic-work-0032-terminal');
  const setup = externalAdapter([successfulResponse(bundle.preprocessed)]);
  const setupResult = Worker.runGeminiSyntheticValidation(
    syntheticOptions(bundle, setup.adapter)
  );
  assert.strictEqual(setupResult.status, 'COMPLETE');
  const external = externalAdapter([{ error_kind: 'TIMEOUT' }]);
  const result = Worker.runGeminiSyntheticValidation(
    syntheticOptions(bundle, external.adapter)
  );
  assert.strictEqual(result.status, 'FAILED');
  assert.strictEqual(result.error_code, 'E_GEMINI_SYNTHETIC_CANDIDATE_CONFLICT');
  assert.strictEqual(external.transport.calls.length, 0);
  assert.strictEqual(stateFor(stale, stale.message.message_id).processing_status,
    State.STATUSES.PREPROCESSED);
  assert.strictEqual(stateFor(bundle, bundle.message.message_id).processing_status,
    State.STATUSES.DONE);
});

test('WORK_0029_0030_0031_GUARDS_AND_ENDPOINT_REGRESSIONS_REMAIN_PRESENT', () => {
  const workerSource = fs.readFileSync(
    path.join(sourceRoot, '18_Worker.gs'),
    'utf8'
  );
  const providerSource = fs.readFileSync(
    path.join(sourceRoot, '20_GeminiProvider.gs'),
    'utf8'
  );
  assert.ok(workerSource.includes('INTERNAL_GEMINI_SYNTHETIC_CAPABILITY'));
  assert.ok(workerSource.includes('assertAutomationOff'));
  assert.ok(providerSource.includes('/v1beta/interactions'));
  assert.ok(providerSource.includes("type === 'thought'"));
  assert.ok(providerSource.includes("type !== 'model_output'"));
});

const failed = tests.filter((item) => item.status !== 'PASS');
process.stdout.write(`${JSON.stringify({
  suite: 'work_0032_gemini_runtime_diagnostics',
  environment: 'LOCAL_SYNTHETIC_PROVIDER_AND_SPREADSHEET_FAKES_ONLY',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
  real_gemini_request: 'NOT_EXECUTED',
  google_runtime: 'NOT_EXECUTED',
  credential_inspected_or_modified: false,
  status: failed.length ? 'FAIL' : 'PASS'
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
