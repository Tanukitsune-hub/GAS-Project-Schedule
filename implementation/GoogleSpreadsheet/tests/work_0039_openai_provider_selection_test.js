'use strict';

/**
 * Work 0039 OpenAI provider-selection contract.
 *
 * Everything in this suite is synthetic and in memory.  The fake fetcher is
 * an assertion boundary and never reaches the network.
 */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'apps-script-v2');
const values = new Map();
const accessedKeys = [];
let fetchCalls = 0;
let lastFetch = null;
let responseBody = '';
let responseStatus = 200;

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
  Map,
  Set,
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
    getScriptProperties: () => propertyStore()
  },
  LockService: {
    getScriptLock: () => ({
      tryLock: () => true,
      releaseLock: () => {}
    })
  }
};

function propertyStore() {
  return {
    getProperty(key) {
      accessedKeys.push(String(key));
      return values.has(String(key)) ? values.get(String(key)) : null;
    },
    setProperty(key, value) {
      values.set(String(key), String(value));
      return this;
    },
    deleteProperty(key) {
      values.delete(String(key));
      return this;
    },
    setProperties(next) {
      Object.entries(next).forEach(([key, value]) => this.setProperty(key, value));
      return this;
    }
  };
}

vm.createContext(sandbox);
for (const name of [
  '00_Config.gs',
  '17_Utilities.gs',
  '07_AiAdapter.gs',
  '20_GeminiProvider.gs',
  '21_OpenAiProvider.gs',
  '22_AiProviderSelection.gs'
]) {
  vm.runInContext(fs.readFileSync(path.join(sourceRoot, name), 'utf8'),
    sandbox, { filename: name });
}

const Config = sandbox.WorkOsConfig;
const AI = sandbox.WorkOsAiAdapter;
const OpenAI = sandbox.WorkOsOpenAiProvider;
const Selection = sandbox.WorkOsAiProviderSelection;

function reset(valuesToSet = {}) {
  values.clear();
  accessedKeys.length = 0;
  Object.entries(valuesToSet).forEach(([key, value]) => values.set(key, String(value)));
  fetchCalls = 0;
  lastFetch = null;
  responseStatus = 200;
  responseBody = JSON.stringify(successEnvelope());
  return propertyStore();
}

function off() {
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

function input() {
  return {
    schema_version: Config.AI_SCHEMA_VERSION,
    message: {
      message_id: 'synthetic-work-0039-message',
      thread_id: 'synthetic-work-0039-thread',
      stable_thread_key: 'root:synthetic-work-0039-thread',
      subject: OpenAI.SYNTHETIC_SUBJECT,
      sender: 'fixture@example.invalid',
      received_at: '2026-09-02T00:00:00.000Z',
      plain_body: OpenAI.SYNTHETIC_BODY,
      prior_messages: []
    },
    active_tasks: [],
    context: { today: '2026-09-02', timezone: Config.TIMEZONE },
    constraints: {
      max_actions: Config.MAX_AI_ACTIONS,
      no_attachment_analysis: true,
      no_email_send: true
    }
  };
}

function output() {
  return {
    schema_version: Config.AI_SCHEMA_VERSION,
    overall_confidence: 0.9,
    actions: [{
      action_type: 'NEW_TASK',
      target_task_id: null,
      task_title: 'Synthetic OpenAI task',
      deadline: '2026-09-09',
      suggested_deadline: null,
      deadline_basis: 'RELATIVE',
      priority: 'MEDIUM',
      waiting_for_reply: false,
      needs_review: false,
      calendar_category: 'NONE',
      calendar_importance: 'LOW',
      confidence: 0.9,
      reason: 'Synthetic fixture',
      changes: {}
    }],
    warnings: []
  };
}

function successEnvelope() {
  return {
    status: 'completed',
    output: [{
      type: 'message',
      role: 'assistant',
      status: 'completed',
      content: [{
        type: 'output_text',
        text: JSON.stringify(output())
      }]
    }]
  };
}

function configured(props, fetchApp) {
  const components = OpenAI.createAdapterSettings({
    provider: OpenAI.PROVIDER_ID,
    model: OpenAI.MODEL,
    prompt_version: OpenAI.PROMPT_VERSION,
    credential_reference: OpenAI.CREDENTIAL_REFERENCE,
    properties: props,
    url_fetch_app: fetchApp
  });
  return new AI.ExternalAiAdapter(Object.assign({
    external_enabled: true,
    provider: OpenAI.PROVIDER_ID,
    model: OpenAI.MODEL,
    prompt_version: OpenAI.PROMPT_VERSION,
    operator_approved: true,
    company_approved: true,
    data_policy_approved: true,
    credential_storage_approved: true,
    auth_configured: true,
    credential_reference: OpenAI.CREDENTIAL_REFERENCE,
    require_opaque_reference: true,
    timeout_ms: Config.AI_REQUEST_TIMEOUT_MS,
    max_response_chars: Config.AI_RESPONSE_MAX_CHARS
  }, components));
}

function fakeFetch() {
  return {
    fetch(url, params) {
      fetchCalls += 1;
      lastFetch = { url, params };
      return {
        getResponseCode: () => responseStatus,
        getContentText: () => responseBody
      };
    }
  };
}

function testSchemaProjection() {
  const request = OpenAI.buildRequest({
    provider: OpenAI.PROVIDER_ID,
    model: OpenAI.MODEL,
    prompt_version: OpenAI.PROMPT_VERSION,
    input: input()
  });
  assert.strictEqual(request.store, false);
  assert.strictEqual(request.stream, false);
  assert.strictEqual(request.background, false);
  assert.strictEqual(request.tools.length, 0);
  assert.strictEqual(request.reasoning.effort, 'low');
  assert.strictEqual(request.text.format.type, 'json_schema');
  assert.strictEqual(request.text.format.strict, true);
  assert.strictEqual(request.text.format.name, 'work_os_ai_classification');
  assert.strictEqual(request.input.length, 2);
  assert.strictEqual(request.input[0].role, 'system');
  assert.strictEqual(request.input[1].role, 'user');

  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    ['format', 'minimum', 'maximum', 'minItems', 'maxItems'].forEach((key) => {
      assert.strictEqual(Object.prototype.hasOwnProperty.call(value, key), false, key);
    });
    if (value.type === 'object') {
      assert.strictEqual(value.additionalProperties, false);
    }
    Object.values(value).forEach(visit);
  }
  visit(request.text.format.schema);
  assert.strictEqual(
    request.text.format.schema.properties.actions.items.properties.changes.required
      .slice().sort().join(','),
    'calendar_category,calendar_importance,due_date,priority,task_title,waiting_for_reply'
  );
}

function testResponseAndCredentialBoundary() {
  const props = reset({
    [OpenAI.CREDENTIAL_REFERENCE]: 'fixture-openai-key-1234567890',
    [Config.PROPERTIES.GEMINI_API_KEY]: 'fixture-gemini-key-1234567890'
  });
  const adapter = configured(props, fakeFetch());
  const result = adapter.classify(input());
  assert.strictEqual(result.schema_version, Config.AI_SCHEMA_VERSION);
  assert.strictEqual(result.actions.length, 1);
  assert.strictEqual(fetchCalls, 1);
  assert.strictEqual(lastFetch.url, OpenAI.ENDPOINT);
  assert.strictEqual(
    lastFetch.params.headers.Authorization,
    'Bearer fixture-openai-key-1234567890'
  );
  assert.ok(accessedKeys.includes(OpenAI.CREDENTIAL_REFERENCE));
  assert.strictEqual(accessedKeys.includes(Config.PROPERTIES.GEMINI_API_KEY), false);
  assert.strictEqual(JSON.stringify(lastFetch.params).includes('fixture-gemini-key'), false);

  const extracted = OpenAI.extractResponse(JSON.stringify(successEnvelope()), 200);
  assert.strictEqual(extracted.error_kind, undefined);
  assert.deepStrictEqual(AI.parseCanonicalResponse(extracted).actions.length, 1);

  const refusal = successEnvelope();
  refusal.output[0].content[0] = { type: 'refusal', refusal: 'not available' };
  assert.strictEqual(OpenAI.extractResponse(JSON.stringify(refusal), 200).error_kind,
    'INVALID_RESPONSE');
  const incomplete = successEnvelope();
  incomplete.status = 'incomplete';
  assert.strictEqual(OpenAI.extractResponse(JSON.stringify(incomplete), 200).error_kind,
    'INVALID_RESPONSE');
  const extra = successEnvelope();
  extra.extra_field = 'reject';
  assert.strictEqual(OpenAI.extractResponse(JSON.stringify(extra), 200).error_kind,
    'INVALID_RESPONSE');
  const multiple = successEnvelope();
  multiple.output.push(multiple.output[0]);
  assert.strictEqual(OpenAI.extractResponse(JSON.stringify(multiple), 200).error_kind,
    'INVALID_RESPONSE');
}

function testUnsupportedModelAndNoFallback() {
  const props = reset({
    [OpenAI.CREDENTIAL_REFERENCE]: 'fixture-openai-key-1234567890'
  });
  responseStatus = 404;
  responseBody = JSON.stringify({ error: { code: 'model_not_found' } });
  const adapter = configured(props, fakeFetch());
  assert.throws(
    () => adapter.classify(input()),
    (error) => error && error.code === 'E_AI_MODEL_UNSUPPORTED'
  );
  assert.strictEqual(fetchCalls, 1);
}

function testFailureMatrixAndFailClosedHandling() {
  reset();
  const missingCredentialAdapter = configured(propertyStore(), fakeFetch());
  assert.throws(
    () => missingCredentialAdapter.classify(input()),
    (error) => error && error.code === 'E_AI_CREDENTIAL_NOT_CONFIGURED'
  );
  assert.strictEqual(fetchCalls, 0);

  [
    [408, 'timeout', 'E_AI_TIMEOUT'],
    [429, 'rate_limit', 'E_AI_RATE_LIMIT'],
    [401, 'invalid_api_key', 'E_AI_AUTH'],
    [403, 'insufficient_quota', 'E_AI_PERMISSION'],
    [500, 'server_error', 'E_AI_UPSTREAM']
  ].forEach(([status, providerCode, expectedCode]) => {
    const rawProviderMessage = 'OPENAI_PRIVATE_RAW_ERROR_0039';
    const props = reset({
      [OpenAI.CREDENTIAL_REFERENCE]: 'fixture-openai-key-1234567890'
    });
    responseStatus = status;
    responseBody = JSON.stringify({
      error: { code: providerCode, message: rawProviderMessage }
    });
    const adapter = configured(props, fakeFetch());
    assert.throws(
      () => adapter.classify(input()),
      (error) => {
        assert.strictEqual(error.code, expectedCode);
        assert.strictEqual(String(error.message).includes(rawProviderMessage), false);
        assert.strictEqual(JSON.stringify(error).includes(rawProviderMessage), false);
        return true;
      }
    );
    assert.strictEqual(fetchCalls, 1);
  });

  const malformedProps = reset({
    [OpenAI.CREDENTIAL_REFERENCE]: 'fixture-openai-key-1234567890'
  });
  responseStatus = 200;
  responseBody = JSON.stringify({ status: 'completed', output: [] });
  assert.throws(
    () => configured(malformedProps, fakeFetch()).classify(input()),
    (error) => error && error.code === 'E_AI_PROVIDER_RESPONSE'
  );
  assert.strictEqual(fetchCalls, 1);

  const oversizedProps = reset({
    [OpenAI.CREDENTIAL_REFERENCE]: 'fixture-openai-key-1234567890'
  });
  const oversizedAdapter = configured(oversizedProps, fakeFetch());
  oversizedAdapter.settings.max_response_chars = 8;
  assert.throws(
    () => oversizedAdapter.classify(input()),
    (error) => error && error.code === 'E_AI_RESPONSE_TOO_LARGE'
  );
  assert.strictEqual(fetchCalls, 1);
}

function providerEnvelopeForAction(action) {
  const envelope = successEnvelope();
  envelope.output[0].content[0].text = JSON.stringify({
    schema_version: Config.AI_SCHEMA_VERSION,
    overall_confidence: 0.9,
    actions: [action],
    warnings: []
  });
  return envelope;
}

function canonicalAction(actionType, overrides = {}) {
  return Object.assign({
    action_type: actionType,
    target_task_id: null,
    task_title: null,
    deadline: null,
    suggested_deadline: null,
    deadline_basis: 'NONE',
    priority: 'MEDIUM',
    waiting_for_reply: false,
    needs_review: false,
    calendar_category: 'NONE',
    calendar_importance: 'LOW',
    confidence: 0.9,
    reason: 'Synthetic representative action',
    changes: {
      task_title: null,
      due_date: null,
      priority: null,
      waiting_for_reply: null,
      calendar_category: null,
      calendar_importance: null
    }
  }, overrides);
}

function testRepresentativeCanonicalActions() {
  const target = `tsk_${'a'.repeat(32)}`;
  const updateDue = canonicalAction('UPDATE_DUE', {
    target_task_id: target,
    deadline: '2026-09-12',
    deadline_basis: 'EXPLICIT',
    changes: {
      task_title: null,
      due_date: '2026-09-12',
      priority: null,
      waiting_for_reply: null,
      calendar_category: null,
      calendar_importance: null
    }
  });
  const setWaiting = canonicalAction('SET_WAITING', {
    target_task_id: target,
    waiting_for_reply: true,
    changes: {
      task_title: null,
      due_date: null,
      priority: null,
      waiting_for_reply: true,
      calendar_category: null,
      calendar_importance: null
    }
  });
  const clearWaiting = canonicalAction('CLEAR_WAITING', {
    target_task_id: target,
    waiting_for_reply: false,
    changes: {
      task_title: null,
      due_date: null,
      priority: null,
      waiting_for_reply: false,
      calendar_category: null,
      calendar_importance: null
    }
  });
  const representatives = [
    canonicalAction('NEW_TASK', {
      task_title: 'Synthetic new task',
      deadline: '2026-09-09',
      deadline_basis: 'RELATIVE'
    }),
    updateDue,
    canonicalAction('MARK_COMPLETE', { target_task_id: target }),
    canonicalAction('CANCEL_TASK', { target_task_id: target }),
    setWaiting,
    clearWaiting,
    canonicalAction('INFORMATION_ONLY'),
    canonicalAction('UNCLEAR', { reason: 'Synthetic ambiguity requires review' })
  ];

  representatives.forEach((action) => {
    const extracted = OpenAI.extractResponse(
      JSON.stringify(providerEnvelopeForAction(action)),
      200
    );
    assert.strictEqual(extracted.error_kind, undefined, action.action_type);
    const parsed = AI.parseCanonicalResponse(extracted);
    assert.strictEqual(parsed.actions[0].action_type, action.action_type);
  });
}

function testSelectionGuardsAndRollback() {
  const props = reset();
  assert.strictEqual(Selection.getSelectionSnapshot({ properties: props }).provider,
    'GEMINI');
  const switched = Selection.switchProvider('OPENAI', {
    properties: props,
    automation_status: off()
  });
  assert.strictEqual(switched.status, 'SWITCHED');
  assert.strictEqual(props.getProperty(Config.PROPERTIES.ACTIVE_AI_PROVIDER), 'OPENAI');
  assert.strictEqual(switched.external_request_performed, false);

  [
    { automation_status: Object.assign(off(), { enabled: true }) },
    { automation_status: Object.assign(off(), { trigger_count: 1 }) },
    { properties: props, automation_status: off(), active_worker_lease: true },
    { properties: props, automation_status: off(), in_flight_count: 1 },
    { properties: props, automation_status: off(), pending_retry_count: 1 }
  ].forEach((overrides) => {
    const settings = Object.assign({ properties: props }, overrides);
    assert.throws(
      () => Selection.switchProvider('GEMINI', settings),
      (error) => error && error.code === 'E_AI_PROVIDER_SWITCH_BLOCKED'
    );
    assert.strictEqual(props.getProperty(Config.PROPERTIES.ACTIVE_AI_PROVIDER), 'OPENAI');
  });

  assert.throws(
    () => Selection.switchProvider('GEMINI', {
      properties: props,
      automation_status: off(),
      dependent_update: () => { throw new Error('synthetic dependent failure'); }
    }),
    (error) => error && error.code === 'E_AI_PROVIDER_SWITCH_ROLLED_BACK'
  );
  assert.strictEqual(props.getProperty(Config.PROPERTIES.ACTIVE_AI_PROVIDER), 'OPENAI');
}

function testQualificationBinding() {
  const props = reset({
    [Config.PROPERTIES.ACTIVE_AI_PROVIDER]: 'OPENAI',
    [Config.PROPERTIES.INSTANCE_ID]: 'synthetic-instance-0039',
    [OpenAI.CREDENTIAL_REFERENCE]: 'fixture-openai-key-1234567890'
  });
  const adapter = configured(props, fakeFetch());
  const result = Selection.runSyntheticQualification({
    properties: props,
    automation_status: off(),
    adapter
  });
  assert.strictEqual(result.status, 'QUALIFIED');
  assert.strictEqual(result.provider, 'OPENAI');
  assert.strictEqual(result.real_data_used, false);
  assert.strictEqual(result.stored_response, false);
  assert.strictEqual(result.external_request_performed, true);
  assert.strictEqual(fetchCalls, 1);
  assert.strictEqual(
    Selection.isCurrentQualificationValid({ properties: props }).valid,
    true
  );
  const stored = values.get(Config.PROPERTIES.AI_QUALIFICATION_STATUS);
  assert.ok(stored);
  assert.strictEqual(stored.includes('fixture-openai-key'), false);
  assert.strictEqual(stored.includes(OpenAI.SYNTHETIC_BODY), false);
  assert.strictEqual(stored.includes('synthetic-instance-0039'), false);

  props.setProperty(Config.PROPERTIES.ACTIVE_AI_PROVIDER, 'GEMINI');
  assert.strictEqual(
    Selection.isCurrentQualificationValid({ properties: props }).valid,
    false
  );
}

const tests = [
  ['OPENAI_SCHEMA_PROJECTION_IS_STRICT_AND_SIDE_EFFECT_FREE', testSchemaProjection],
  ['OPENAI_RESPONSE_AND_CREDENTIAL_BOUNDARY', testResponseAndCredentialBoundary],
  ['OPENAI_UNSUPPORTED_MODEL_DOES_NOT_FALL_BACK', testUnsupportedModelAndNoFallback],
  ['OPENAI_FAILURE_MATRIX_FAILS_CLOSED', testFailureMatrixAndFailClosedHandling],
  ['OPENAI_REPRESENTATIVE_CANONICAL_ACTIONS', testRepresentativeCanonicalActions],
  ['PROVIDER_SELECTION_GUARDS_AND_ROLLBACK', testSelectionGuardsAndRollback],
  ['QUALIFICATION_IS_BOUND_TO_PROVIDER_MODEL_PROMPT_AND_INSTANCE', testQualificationBinding]
];
const failures = [];
tests.forEach(([name, fn]) => {
  try {
    fn();
  } catch (error) {
    failures.push({ name, message: String(error && error.message || error).slice(0, 160) });
  }
});
if (failures.length) {
  process.stdout.write(`${JSON.stringify({
    suite: 'work_0039_openai_provider_selection',
    status: 'FAIL',
    failures
  }, null, 2)}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`${JSON.stringify({
    suite: 'work_0039_openai_provider_selection',
    status: 'PASS',
    test_count: tests.length,
    network_calls_observed: 0
  }, null, 2)}\n`);
}
