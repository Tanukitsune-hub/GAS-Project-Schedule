'use strict';

const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'apps-script-v2');
let gmailCalls = 0;
let fetchCalls = 0;
let credentialReads = 0;
let lastPayload = '';
let responseBody = '';
const properties = new Map();

const disabledAutomation = {
  status: 'CONSISTENT',
  enabled: false,
  desired_enabled: false,
  trigger_count: 0,
  clock_trigger_count: 0,
  stored_trigger_id_present: false,
  canonical_trigger_present: false
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
  isFinite,
  parseInt,
  encodeURIComponent,
  decodeURIComponent,
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
      getProperty: (key) => {
        const normalized = String(key);
        if (normalized === 'WORK_OS_V2_GEMINI_API_KEY') credentialReads += 1;
        return properties.get(normalized) || null;
      }
    })
  },
  WorkOsAutomation: {
    getDiagnosticAutomationStatus: () => Object.assign({}, disabledAutomation)
  },
  WorkOsGmailGateway: {
    createCallMeter: () => ({
      consume: () => { gmailCalls += 1; },
      count: () => gmailCalls,
      limit: () => 20
    }),
    listManualCandidates: () => {
      gmailCalls += 1;
      return [];
    }
  },
  UrlFetchApp: {
    fetch: (_url, params) => {
      fetchCalls += 1;
      lastPayload = String(params && params.payload || '');
      return {
        getResponseCode: () => 200,
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
  '20_GeminiProvider.gs',
  '18_Worker.gs'
]) {
  vm.runInContext(fs.readFileSync(path.join(sourceRoot, name), 'utf8'),
    sandbox, { filename: name });
}

const AI = sandbox.WorkOsAiAdapter;
const Gemini = sandbox.WorkOsGeminiProvider;
const Worker = sandbox.WorkOsWorker;
const tests = [];

function test(name, fn) {
  try {
    fn();
    tests.push({ name, status: 'PASS' });
  } catch (error) {
    tests.push({
      name,
      status: 'FAIL',
      safe_message: String(error && error.message || error && error.code || error)
        .slice(0, 160)
    });
  }
}

function resetCounters() {
  gmailCalls = 0;
  fetchCalls = 0;
  credentialReads = 0;
  lastPayload = '';
  properties.clear();
}

function validInput() {
  return {
    schema_version: sandbox.WorkOsConfig.AI_SCHEMA_VERSION,
    message: {
      message_id: 'synthetic-gemini-message',
      thread_id: 'synthetic-gemini-thread',
      stable_thread_key: 'root:synthetic-gemini-thread',
      subject: Gemini.SYNTHETIC_SUBJECT,
      sender: 'fixture@example.invalid',
      received_at: '2026-08-11T00:00:00.000Z',
      plain_body: Gemini.SYNTHETIC_BODY,
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
      task_title: '架空Gemini動作確認メモ',
      deadline: '2026-08-18',
      suggested_deadline: null,
      deadline_basis: 'RELATIVE',
      priority: 'MEDIUM',
      waiting_for_reply: false,
      needs_review: true,
      calendar_category: 'NONE',
      calendar_importance: 'LOW',
      confidence: 0.9,
      reason: 'Synthetic fixture only',
      changes: {}
    }],
    warnings: []
  };
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

test('WORK_0029_TOP_LEVEL_ENTRYPOINTS_ARE_NO_ARGUMENT_MENU_CALLABLE', () => {
  assert.strictEqual(typeof sandbox.checkGeminiSyntheticReadiness, 'function');
  assert.strictEqual(typeof sandbox.runGeminiSyntheticValidationOnce, 'function');
  const menu = fs.readFileSync(path.join(sourceRoot, 'Menu.gs'), 'utf8');
  assert.match(menu, /menuCheckGeminiSyntheticReadiness/);
  assert.match(menu, /menuRunGeminiSyntheticValidation/);
  assert.match(fs.readFileSync(path.join(sourceRoot, '18_Worker.gs'), 'utf8'),
    /function runGeminiSyntheticValidationOnce\(\)/);
  assert.match(fs.readFileSync(path.join(sourceRoot, '20_GeminiProvider.gs'), 'utf8'),
    /function checkGeminiSyntheticReadiness\(\)/);
});

test('WORK_0029_READINESS_IS_NETWORK_FREE_AND_REPORTS_RUNTIME_AUTOMATION', () => {
  resetCounters();
  const result = sandbox.checkGeminiSyntheticReadiness();
  assert.strictEqual(result.automation_status, 'CONSISTENT');
  assert.strictEqual(result.automation_enabled, false);
  assert.strictEqual(result.automation_desired_enabled, false);
  assert.strictEqual(result.scheduled_trigger_count, 0);
  assert.strictEqual(result.clock_trigger_count, 0);
  assert.strictEqual(result.external_request_performed, false);
  assert.strictEqual(gmailCalls, 0);
  assert.strictEqual(fetchCalls, 0);
});

test('WORK_0029_AUTOMATION_GUARD_REJECTS_EVERY_UNSAFE_RUNTIME_STATE', () => {
  const unsafeStates = [
    { enabled: true },
    { desired_enabled: true },
    { status: 'INCONSISTENT' },
    { trigger_count: 1, clock_trigger_count: 1 },
    { trigger_count: 2, clock_trigger_count: 2 },
    { stored_trigger_id_present: true },
    { canonical_trigger_present: true }
  ];
  for (const unsafe of unsafeStates) {
    resetCounters();
    assert.throws(
      () => Worker.runGeminiSyntheticValidation({
        automation_status: Object.assign({}, disabledAutomation, unsafe),
        gateway: sandbox.WorkOsGmailGateway
      }),
      (error) => error.code === 'E_GEMINI_AUTOMATION_GUARD'
    );
    assert.strictEqual(gmailCalls, 0);
    assert.strictEqual(credentialReads, 0);
    assert.strictEqual(fetchCalls, 0);
  }
});

test('WORK_0029_SYNTHETIC_GUARD_REJECTS_BEFORE_CREDENTIAL_OR_AI', () => {
  resetCounters();
  assert.throws(
    () => Worker.runGeminiSyntheticValidation({
      automation_status: disabledAutomation,
      candidate: { subject: '[not-approved]' },
      gateway: sandbox.WorkOsGmailGateway
    }),
    (error) => error.code === 'E_GEMINI_SYNTHETIC_GUARD'
  );
  assert.strictEqual(gmailCalls, 0);
  assert.strictEqual(credentialReads, 0);
  assert.strictEqual(fetchCalls, 0);
});

test('WORK_0029_FIXTURE_IS_EXACT_UTF8_AND_NORMALIZES_ONLY_TRANSPORT_WHITESPACE', () => {
  assert.strictEqual(Gemini.SYNTHETIC_SUBJECT,
    '[WORK_OS_SYNTHETIC_GEMINI_0029]');
  assert.strictEqual(Gemini.isSyntheticBody(Gemini.SYNTHETIC_BODY), true);
  assert.strictEqual(Gemini.isSyntheticBody(
    Gemini.SYNTHETIC_BODY.replace(/\n/g, '\r\n') + ' \n'
  ), true);
  assert.strictEqual(Gemini.SYNTHETIC_BODY.includes('個人情報、機密情報'), true);
  assert.strictEqual(Gemini.SYNTHETIC_BODY.includes('7日後'), true);
  assert.strictEqual(Gemini.SYNTHETIC_BODY.includes('高影響なカレンダー'), true);
  assert.strictEqual(Gemini.isSyntheticBody(
    Gemini.SYNTHETIC_BODY.replace('7日後', '8日後')
  ), false);
  return;
  assert.strictEqual(Gemini.SYNTHETIC_BODY.includes('個人情報'), true);
  assert.strictEqual(Gemini.SYNTHETIC_BODY.includes('7日後'), true);
  assert.strictEqual(Gemini.SYNTHETIC_BODY.includes('高影響なカレンダー'), true);
  assert.strictEqual(Gemini.isSyntheticBody(
    Gemini.SYNTHETIC_BODY.replace('7日後', '8日後')
  ), false);
});

test('WORK_0029_FAKE_GEMINI_CLASSIFICATION_IS_ONE_CALL_RELATIVE_DATE_REVIEW', () => {
  resetCounters();
  properties.set(Gemini.CREDENTIAL_REFERENCE, 'synthetic-gemini-key-1234567890');
  const output = validOutput();
  responseBody = JSON.stringify({
    status: 'completed',
    steps: [{
      type: 'model_output',
      content: [{ type: 'text', text: JSON.stringify(output) }]
    }]
  });
  const adapter = AI.createProductionExternalAdapter({
    config: configured(),
    registry: AI.getProductionProviderRegistry()
  });
  const result = adapter.classify(validInput(), {
    remaining_ms: 60000,
    reserve_ms: 5000
  });
  assert.strictEqual(result.actions[0].deadline, '2026-08-18');
  assert.strictEqual(result.actions[0].deadline_basis, 'RELATIVE');
  assert.strictEqual(result.actions[0].needs_review, true);
  assert.strictEqual(fetchCalls, 1);
  const request = JSON.parse(lastPayload);
  assert.deepStrictEqual(request.generation_config, {
    thinking_level: 'low',
    thinking_summaries: 'none',
    max_output_tokens: 4096
  });
});

test('WORK_0029_PROVIDER_CALL_LIMIT_PREVENTS_RETRY_AND_MOCK_FALLBACK', () => {
  resetCounters();
  properties.set(Gemini.CREDENTIAL_REFERENCE, 'synthetic-gemini-key-1234567890');
  responseBody = JSON.stringify({
    status: 'completed',
    steps: [{
      type: 'model_output',
      content: [{ type: 'text', text: JSON.stringify(validOutput()) }]
    }]
  });
  const adapter = AI.createProductionExternalAdapter({
    config: configured(),
    registry: AI.getProductionProviderRegistry()
  });
  adapter.settings.max_classify_calls = 1;
  adapter.classify(validInput());
  assert.throws(
    () => adapter.classify(validInput()),
    (error) => error.code === 'E_AI_CALL_LIMIT'
  );
  assert.strictEqual(fetchCalls, 1);
  assert.notStrictEqual(AI.getMetadata(adapter).provider, 'MOCK');
});

const failed = tests.filter((item) => item.status !== 'PASS');
process.stdout.write(`${JSON.stringify({
  suite: 'work_0029_gemini_runtime_activation',
  environment: 'LOCAL_FAKE_AUTOMATION_GMAIL_AND_URLFETCH_ONLY',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
  real_gemini_request: 'NOT_EXECUTED',
  real_gmail_runtime: 'NOT_EXECUTED',
  apps_script_function_invocations: 0,
  credential_created_or_inspected: false,
  status: failed.length ? 'FAIL' : 'PASS'
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
