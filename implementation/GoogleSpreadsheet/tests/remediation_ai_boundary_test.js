'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'apps-script-v2');
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
  }
};
vm.createContext(sandbox);
['00_Config.gs', '17_Utilities.gs', '07_AiAdapter.gs'].forEach((name) => {
  vm.runInContext(
    fs.readFileSync(path.join(sourceRoot, name), 'utf8'),
    sandbox,
    { filename: name }
  );
});

const AI = sandbox.WorkOsAiAdapter;
const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, status: 'PASS' });
  } catch (error) {
    results.push({ name, status: 'FAIL', message: error.message });
  }
}

function validInput() {
  return {
    schema_version: sandbox.WorkOsConfig.AI_SCHEMA_VERSION,
    message: {
      message_id: 'synthetic-remediation-message',
      thread_id: 'synthetic-remediation-thread',
      stable_thread_key: 'root:synthetic-remediation-thread',
      subject: 'Synthetic remediation request',
      sender: 'fixture@example.invalid',
      received_at: '2026-07-25T00:00:00.000Z',
      plain_body: 'Completely synthetic input.',
      prior_messages: []
    },
    active_tasks: [],
    context: {
      today: '2026-07-25',
      timezone: 'Asia/Tokyo'
    },
    constraints: {
      max_actions: sandbox.WorkOsConfig.MAX_AI_ACTIONS,
      no_attachment_analysis: true,
      no_email_send: true
    }
  };
}

function validOutput() {
  return {
    schema_version: sandbox.WorkOsConfig.AI_SCHEMA_VERSION,
    overall_confidence: 0.9,
    actions: [{
      action_type: 'NEW_TASK',
      target_task_id: null,
      task_title: 'Synthetic remediation task',
      deadline: '2026-07-31',
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
    provider: 'SYNTHETIC_PROVIDER',
    model: 'SYNTHETIC_MODEL_V1',
    prompt_version: 'SYNTHETIC_PROMPT_V1',
    credential_reference: 'approved:synthetic-alias',
    company_approved: true,
    data_policy_approved: true,
    credential_storage_approved: true,
    auth_configured: true,
    timeout_ms: 60000,
    max_response_chars: 100000
  }, overrides);
}

test('R-AI-01_EMPTY_REGISTRY_FAILS_CLOSED', () => {
  const readiness = AI.getProductionReadiness({ config: configured() });
  assert.strictEqual(readiness.ready, false);
  assert.ok(readiness.reasons.includes('AI_PROVIDER_NOT_REGISTERED'));
  assert.throws(
    () => AI.createProductionExternalAdapter({ config: configured() }),
    (error) => error.code === 'E_AI_PROVIDER_NOT_REGISTERED'
  );
});

test('R-AI-02_REGISTRY_REJECTS_MOCK_AND_DUPLICATE_PROVIDER', () => {
  assert.throws(() => AI.createProviderRegistry([{
    provider_id: 'MOCK',
    create_adapter_settings: () => ({})
  }]));
  assert.throws(() => AI.createProviderRegistry([
    {
      provider_id: 'SYNTHETIC_PROVIDER',
      create_adapter_settings: () => ({})
    },
    {
      provider_id: 'SYNTHETIC_PROVIDER',
      create_adapter_settings: () => ({})
    }
  ]));
});

test('R-AI-03_READINESS_IS_PURE', () => {
  let factoryCalls = 0;
  const registry = AI.createProviderRegistry([{
    provider_id: 'SYNTHETIC_PROVIDER',
    create_adapter_settings: () => {
      factoryCalls += 1;
      throw new Error('factory must not run during readiness');
    }
  }]);
  const readiness = AI.getProductionReadiness({
    config: configured(),
    registry
  });
  assert.strictEqual(readiness.ready, true);
  assert.strictEqual(factoryCalls, 0);
  assert.strictEqual(readiness.external_request_performed, false);
});

test('R-AI-04_OPAQUE_REFERENCE_REJECTS_SECRET_SHAPES', () => {
  const secretShaped = ['sk', 'proj', 'A'.repeat(30)].join('-');
  assert.throws(
    () => AI.validateOpaqueCredentialReference(secretShaped),
    (error) => error.code === 'E_AI_CREDENTIAL_REFERENCE_INVALID'
  );
  assert.strictEqual(
    AI.validateOpaqueCredentialReference('approved:synthetic-alias'),
    'approved:synthetic-alias'
  );
});

test('R-AI-05_FACTORY_NEVER_FALLS_BACK_TO_MOCK', () => {
  const registry = AI.createProviderRegistry([{
    provider_id: 'SYNTHETIC_PROVIDER',
    create_adapter_settings: () => ({
      transport: new AI.MockHttpTransport([]),
      credential_provider: {
        isConfigured: () => true,
        getCredential: () => 'SYNTHETIC_TEST_VALUE'
      }
    })
  }]);
  const adapter = AI.createProductionExternalAdapter({
    config: configured(),
    registry
  });
  assert.strictEqual(AI.getMetadata(adapter).provider, 'SYNTHETIC_PROVIDER');
  assert.notStrictEqual(AI.getMetadata(adapter).provider, 'MOCK');
});

test('R-AI-06_TIMEOUT_USES_REMAINING_BUDGET', () => {
  let credentialReads = 0;
  const transport = new AI.MockHttpTransport([{
    status: 200,
    body: JSON.stringify(validOutput())
  }]);
  const registry = AI.createProviderRegistry([{
    provider_id: 'SYNTHETIC_PROVIDER',
    create_adapter_settings: () => ({
      transport,
      credential_provider: {
        isConfigured: () => true,
        getCredential: () => {
          credentialReads += 1;
          return 'SYNTHETIC_TEST_VALUE';
        }
      }
    })
  }]);
  const adapter = AI.createProductionExternalAdapter({
    config: configured(),
    registry
  });
  adapter.classify(validInput(), { remaining_ms: 5000, reserve_ms: 1000 });
  assert.strictEqual(credentialReads, 1);
  assert.strictEqual(transport.calls[0].request.timeout_ms, 4000);
  assert.strictEqual(transport.calls[0].credential_present, true);
});

test('R-AI-07_INSUFFICIENT_BUDGET_READS_NO_CREDENTIAL', () => {
  let credentialReads = 0;
  const transport = new AI.MockHttpTransport([]);
  const registry = AI.createProviderRegistry([{
    provider_id: 'SYNTHETIC_PROVIDER',
    create_adapter_settings: () => ({
      transport,
      credential_provider: {
        isConfigured: () => true,
        getCredential: () => {
          credentialReads += 1;
          return 'SYNTHETIC_TEST_VALUE';
        }
      }
    })
  }]);
  const adapter = AI.createProductionExternalAdapter({
    config: configured(),
    registry
  });
  assert.throws(
    () => adapter.classify(validInput(), {
      remaining_ms: 1500,
      reserve_ms: 1000
    }),
    (error) => error.code === 'E_AI_BUDGET_INSUFFICIENT'
  );
  assert.strictEqual(credentialReads, 0);
  assert.strictEqual(transport.calls.length, 0);
});

test('R-AI-08_PRODUCTION_SOURCE_HAS_NO_REAL_TRANSPORT_OR_ENDPOINT', () => {
  const source = fs.readFileSync(
    path.join(sourceRoot, '07_AiAdapter.gs'),
    'utf8'
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(sourceRoot, 'appsscript.json'), 'utf8')
  );
  assert.strictEqual(/\bUrlFetchApp\b/.test(source), false);
  assert.strictEqual(/https?:\/\//.test(source), false);
  assert.strictEqual(
    manifest.oauthScopes.includes(
      'https://www.googleapis.com/auth/script.external_request'
    ),
    true
  );
});

const summary = {
  suite: 'remediation_ai_boundary',
  environment: 'LOCAL_MOCK_ONLY',
  code_remediable_portion: results.some((item) => item.status === 'FAIL')
    ? 'OPEN'
    : 'CLOSED',
  external_decision_portion: 'BLOCKED',
  real_provider_test: 'NOT_EXECUTED',
  passed: results.filter((item) => item.status === 'PASS').length,
  failed: results.filter((item) => item.status === 'FAIL').length,
  tests: results
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed) {
  process.exitCode = 1;
}
