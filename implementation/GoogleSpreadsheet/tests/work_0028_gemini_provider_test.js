'use strict';

const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'apps-script-v2');
const propertyValues = new Map();
let fetchCalls = 0;
let fetchRequest = null;
let responseBody = null;
let responseStatus = 200;
const syntheticCredential = 'synthetic-gemini-key-1234567890';

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
    fetch: (url, params) => {
      fetchCalls += 1;
      fetchRequest = { url, params };
      return {
        getResponseCode: () => responseStatus,
        getContentText: () => responseBody
      };
    }
  }
};
vm.createContext(sandbox);
for (const name of [
  '00_Config.gs',
  '17_Utilities.gs',
  '07_AiAdapter.gs',
  '20_GeminiProvider.gs'
]) {
  vm.runInContext(fs.readFileSync(path.join(sourceRoot, name), 'utf8'),
    sandbox, { filename: name });
}

const AI = sandbox.WorkOsAiAdapter;
const Gemini = sandbox.WorkOsGeminiProvider;
const tests = [];
function test(name, fn) {
  try {
    fn();
    tests.push({ name, status: 'PASS' });
  } catch (error) {
    tests.push({
      name,
      status: 'FAIL',
      safe_message: String(error && error.code || error && error.message || error)
        .slice(0, 160)
    });
  }
}

function validInput() {
  return {
    schema_version: sandbox.WorkOsConfig.AI_SCHEMA_VERSION,
    message: {
      message_id: 'synthetic-gemini-message',
      thread_id: 'synthetic-gemini-thread',
      stable_thread_key: 'root:synthetic-gemini-thread',
      subject: 'Synthetic Gemini request',
      sender: 'fixture@example.invalid',
      received_at: '2026-08-11T00:00:00.000Z',
      plain_body: 'Synthetic body only.',
      prior_messages: []
    },
    active_tasks: [],
    context: { today: '2026-08-11', timezone: 'Asia/Tokyo' },
    constraints: {
      max_actions: sandbox.WorkOsConfig.MAX_AI_ACTIONS,
      no_attachment_analysis: true,
      no_email_send: true
    }
  };
}

function validOutput() {
  return {
    schema_version: '2.0',
    overall_confidence: 0.9,
    actions: [{
      action_type: 'NEW_TASK',
      target_task_id: null,
      task_title: 'Synthetic Gemini task',
      deadline: '2026-08-18',
      suggested_deadline: null,
      deadline_basis: 'EXPLICIT',
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

function configured(overrides = {}) {
  return Object.assign({
    external_enabled: true,
    provider: 'GEMINI',
    model: Gemini.MODEL,
    prompt_version: Gemini.PROMPT_VERSION,
    credential_reference: Gemini.CREDENTIAL_REFERENCE,
    company_approved: true,
    data_policy_approved: true,
    credential_storage_approved: true,
    auth_configured: true,
    timeout_ms: 60000,
    max_response_chars: 100000
  }, overrides);
}

function resetResponse() {
  fetchCalls = 0;
  fetchRequest = null;
  responseStatus = 200;
  responseBody = JSON.stringify({
    status: 'completed',
    steps: [{
      type: 'model_output',
      content: [{ type: 'text', text: JSON.stringify(validOutput()) }]
    }]
  });
}

test('GEMINI_REGISTRY_AND_READINESS_ARE_PROVIDER_SPECIFIC_BUT_SAFE', () => {
  const registry = AI.getProductionProviderRegistry();
  assert.strictEqual(registry.has('GEMINI'), true);
  propertyValues.clear();
  const readiness = Gemini.readiness();
  assert.deepStrictEqual({
    provider: readiness.provider,
    model: readiness.model,
    prompt_version: readiness.prompt_version,
    credential_configured: readiness.credential_configured,
    provider_registered: readiness.provider_registered,
    external_request_performed: readiness.external_request_performed,
    automation_enabled: readiness.automation_enabled
  }, {
    provider: 'GEMINI',
    model: 'gemini-3.6-flash',
    prompt_version: 'gemini-interactions-v1-work-os-v1',
    credential_configured: false,
    provider_registered: true,
    external_request_performed: false,
    automation_enabled: false
  });
});

test('GEMINI_INTERACTIONS_REQUEST_IS_ONE_POST_AND_STRUCTURED', () => {
  resetResponse();
  propertyValues.set(Gemini.CREDENTIAL_REFERENCE, syntheticCredential);
  const adapter = AI.createProductionExternalAdapter({
    config: configured(),
    registry: AI.getProductionProviderRegistry()
  });
  const result = adapter.classify(validInput(), {
    remaining_ms: 60000,
    reserve_ms: 5000
  });
  assert.strictEqual(result.schema_version, '2.0');
  assert.strictEqual(fetchCalls, 1);
  assert.strictEqual(fetchRequest.url, Gemini.ENDPOINT);
  assert.strictEqual(fetchRequest.params.method, 'post');
  assert.strictEqual(fetchRequest.params.contentType, 'application/json');
  assert.deepStrictEqual(Object.keys(fetchRequest.params.headers), [
    'x-goog-api-key'
  ]);
  const body = JSON.parse(fetchRequest.params.payload);
  assert.strictEqual(body.model, 'gemini-3.6-flash');
  assert.strictEqual(body.store, false);
  assert.strictEqual(body.stream, false);
  assert.strictEqual(body.background, false);
  assert.strictEqual(body.response_format.type, 'text');
  assert.strictEqual(body.response_format.mime_type, 'application/json');
  assert.strictEqual(body.response_format.schema.additionalProperties, false);
  assert.strictEqual(body.tools, undefined);
  assert.strictEqual(body.generation_config, undefined);
  assert.strictEqual(body.input.includes('untrusted email/task data'), true);
});

test('GEMINI_MISSING_CREDENTIAL_FAILS_CLOSED_WITHOUT_NETWORK', () => {
  resetResponse();
  propertyValues.clear();
  const adapter = AI.createProductionExternalAdapter({
    config: configured(),
    registry: AI.getProductionProviderRegistry()
  });
  assert.throws(
    () => adapter.classify(validInput()),
    (error) => error.code === 'E_AI_CREDENTIAL_NOT_CONFIGURED'
  );
  assert.strictEqual(fetchCalls, 0);
});

test('GEMINI_MALFORMED_SUCCESS_ENVELOPE_IS_SAFE_ERROR', () => {
  resetResponse();
  propertyValues.set(Gemini.CREDENTIAL_REFERENCE, syntheticCredential);
  responseBody = '{"status":"completed","steps":[]}';
  const adapter = AI.createProductionExternalAdapter({
    config: configured(),
    registry: AI.getProductionProviderRegistry()
  });
  assert.throws(
    () => adapter.classify(validInput()),
    (error) => error.code === 'E_AI_PROVIDER_RESPONSE' &&
      !String(error.message).includes('completed')
  );
  assert.strictEqual(fetchCalls, 1);
});

test('GEMINI_NON_2XX_DOES_NOT_READ_PROVIDER_BODY', () => {
  resetResponse();
  propertyValues.set(Gemini.CREDENTIAL_REFERENCE, syntheticCredential);
  responseStatus = 401;
  const original = sandbox.UrlFetchApp.fetch;
  sandbox.UrlFetchApp.fetch = (url, params) => {
    fetchCalls += 1;
    fetchRequest = { url, params };
    return {
      getResponseCode: () => 401,
      getContentText: () => { throw new Error('raw provider body read'); }
    };
  };
  try {
    const adapter = AI.createProductionExternalAdapter({
      config: configured(),
      registry: AI.getProductionProviderRegistry()
    });
    assert.throws(
      () => adapter.classify(validInput()),
      (error) => error.code === 'E_AI_AUTH'
    );
  } finally {
    sandbox.UrlFetchApp.fetch = original;
  }
  assert.strictEqual(fetchCalls, 1);
});

const failed = tests.filter((item) => item.status !== 'PASS');
process.stdout.write(`${JSON.stringify({
  suite: 'work_0028_gemini_provider',
  environment: 'LOCAL_FAKE_URLFETCH_AND_SCRIPT_PROPERTIES_ONLY',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
  real_gemini_request: 'NOT_EXECUTED',
  credential_created_or_inspected: false,
  status: failed.length ? 'FAIL' : 'PASS'
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
