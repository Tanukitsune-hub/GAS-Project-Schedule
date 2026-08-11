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
let responseBody = '';
const syntheticCredential = 'synthetic-work-0030-credential';
const thoughtSignature = 'synthetic-thought-signature';
const thoughtSummary = 'synthetic-thought-summary';
const syntheticMessage = 'synthetic-message-content';
const providerBodyMarker = 'synthetic-provider-body-marker';

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
        getResponseCode: () => 200,
        getContentText: () => responseBody
      };
    }
  },
  WorkOsAutomation: {
    getDiagnosticAutomationStatus: () => disabledAutomationStatus()
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
function test(id, body) {
  try {
    body();
    tests.push({ id, status: 'PASS' });
  } catch (error) {
    tests.push({
      id,
      status: 'FAIL',
      safe_message: String(error && (error.code || error.message) || error)
        .slice(0, 160)
    });
  }
}

function validOutput() {
  return {
    schema_version: '2.0',
    overall_confidence: 0.9,
    actions: [{
      action_type: 'NEW_TASK',
      target_task_id: null,
      task_title: 'Synthetic parser task',
      deadline: '2026-08-19',
      suggested_deadline: null,
      deadline_basis: 'EXPLICIT',
      priority: 'MEDIUM',
      waiting_for_reply: false,
      needs_review: false,
      calendar_category: 'NONE',
      calendar_importance: 'LOW',
      confidence: 0.9,
      reason: 'Synthetic parser fixture',
      changes: {}
    }],
    warnings: []
  };
}

function modelOutput(text) {
  return {
    type: 'model_output',
    content: [{ type: 'text', text: text || JSON.stringify(validOutput()) }]
  };
}

function response(steps, status) {
  return JSON.stringify({
    status: status === undefined ? 'completed' : status,
    steps
  });
}

function extract(steps, status) {
  return Gemini.extractResponse(response(steps, status), 200);
}

function configured() {
  return {
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
  };
}

function validInput() {
  return {
    schema_version: sandbox.WorkOsConfig.AI_SCHEMA_VERSION,
    message: {
      message_id: 'synthetic-work-0030-message',
      thread_id: 'synthetic-work-0030-thread',
      stable_thread_key: 'root:synthetic-work-0030-thread',
      subject: 'Synthetic parser request',
      sender: 'fixture@example.invalid',
      received_at: '2026-08-12T00:00:00.000Z',
      plain_body: syntheticMessage,
      prior_messages: []
    },
    active_tasks: [],
    context: { today: '2026-08-12', timezone: 'Asia/Tokyo' },
    constraints: {
      max_actions: sandbox.WorkOsConfig.MAX_AI_ACTIONS,
      no_attachment_analysis: true,
      no_email_send: true
    }
  };
}

function assertInvalid(steps, status) {
  const result = extract(steps, status);
  assert.strictEqual(result.error_kind, 'INVALID_RESPONSE');
  assert.strictEqual(Object.prototype.hasOwnProperty.call(result, 'body'), false);
}

test('MODEL_OUTPUT_ONLY_REMAINS_ACCEPTED', () => {
  const result = extract([modelOutput()]);
  assert.strictEqual(result.status, 200);
  assert.deepStrictEqual(JSON.parse(result.body), validOutput());
});

test('SIGNATURE_ONLY_THOUGHT_BEFORE_FINAL_OUTPUT_IS_ACCEPTED', () => {
  const result = extract([
    { type: 'thought', signature: thoughtSignature },
    modelOutput()
  ]);
  assert.deepStrictEqual(JSON.parse(result.body), validOutput());
});

test('MULTIPLE_THOUGHTS_BEFORE_FINAL_OUTPUT_ARE_ACCEPTED', () => {
  const result = extract([
    { type: 'thought', signature: 'synthetic-thought-one' },
    { type: 'thought', signature: 'synthetic-thought-two' },
    modelOutput()
  ]);
  assert.deepStrictEqual(JSON.parse(result.body), validOutput());
});

test('THOUGHT_SUMMARY_IS_IGNORED_AND_FINAL_OUTPUT_REACHES_STRICT_VALIDATOR', () => {
  responseBody = response([
    { type: 'thought', signature: thoughtSignature, summary: thoughtSummary },
    modelOutput()
  ]);
  fetchCalls = 0;
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
});

test('UNEXPECTED_FUNCTION_TOOL_OR_USER_STEPS_FAIL_CLOSED', () => {
  for (const type of ['function_call', 'tool', 'user']) {
    assertInvalid([{ type }, modelOutput()]);
  }
});

test('MULTIPLE_OUTPUTS_OR_OUTPUT_FOLLOWED_BY_THOUGHT_FAIL_CLOSED', () => {
  assertInvalid([modelOutput(), modelOutput()]);
  assertInvalid([modelOutput(), { type: 'thought', signature: thoughtSignature }]);
});

test('MISSING_OUTPUT_AND_MALFORMED_STEP_SHAPES_FAIL_CLOSED', () => {
  assertInvalid([]);
  assertInvalid([{ type: 'thought', signature: thoughtSignature }]);
  assertInvalid([null]);
  assertInvalid([[]]);
});

test('OUTPUT_CONTENT_MUST_BE_ONE_NONEMPTY_TEXT_BLOCK', () => {
  assertInvalid([{ type: 'model_output', content: [] }]);
  assertInvalid([{ type: 'model_output', content: [
    { type: 'text', text: '{}' }, { type: 'text', text: '{}' }
  ] }]);
  assertInvalid([{ type: 'model_output', content: [{ type: 'image', text: '{}' }] }]);
  assertInvalid([{ type: 'model_output', content: [{ type: 'text', text: '   ' }] }]);
  assertInvalid([{ type: 'model_output', content: [null] }]);
});

test('INCOMPLETE_FAILED_OR_NONSTRING_COMPLETED_STATUS_FAIL_CLOSED', () => {
  assertInvalid([modelOutput()], 'in_progress');
  assertInvalid([modelOutput()], 'failed');
  assertInvalid([modelOutput()], ['completed']);
  assertInvalid([modelOutput()], { value: 'completed' });
});

test('INVALID_RESPONSE_ERROR_NEVER_ECHOES_PROVIDER_OR_THOUGHT_CONTENT', () => {
  responseBody = response([
    { type: 'thought', signature: thoughtSignature, summary: thoughtSummary },
    { type: 'unexpected', body: providerBodyMarker }
  ]);
  propertyValues.set(Gemini.CREDENTIAL_REFERENCE, syntheticCredential);
  const adapter = AI.createProductionExternalAdapter({
    config: configured(),
    registry: AI.getProductionProviderRegistry()
  });
  let error;
  try {
    adapter.classify(validInput(), { remaining_ms: 60000, reserve_ms: 5000 });
  } catch (caught) {
    error = caught;
  }
  assert.ok(error);
  assert.strictEqual(error.code, 'E_AI_PROVIDER_RESPONSE');
  const evidence = JSON.stringify({
    code: error.code,
    message: error.message,
    extract: extract([{ type: 'unexpected', body: providerBodyMarker }])
  });
  for (const value of [
    thoughtSignature, thoughtSummary, providerBodyMarker,
    syntheticCredential, syntheticMessage
  ]) {
    assert.strictEqual(evidence.includes(value), false);
  }
});

const failed = tests.filter((item) => item.status !== 'PASS');
process.stdout.write(`${JSON.stringify({
  suite: 'work_0030_gemini_thought_step_parser',
  environment: 'LOCAL_FAKE_URLFETCH_AND_SCRIPT_PROPERTIES_ONLY',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
  real_gemini_request: 'NOT_EXECUTED',
  credential_created_or_inspected: false,
  status: failed.length ? 'FAIL' : 'PASS'
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
