'use strict';

/**
 * F-12 Quick Diagnostic AI readiness separation.
 *
 * Local VM only. No AI provider or Google Workspace service is contacted.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(
  path.join(root, 'apps-script-v2', '16_Diagnostics.gs'),
  'utf8'
);

function readiness(overrides = {}) {
  return {
    ready: false,
    reasons: [
      'EXTERNAL_AI_NOT_CONFIGURED',
      'COMPANY_APPROVAL_NOT_CONFIRMED',
      'DATA_POLICY_APPROVAL_NOT_CONFIRMED',
      'CREDENTIAL_STORAGE_APPROVAL_NOT_CONFIRMED',
      'AI_AUTH_NOT_CONFIGURED',
      'AI_CREDENTIAL_REFERENCE_NOT_CONFIGURED',
      'AI_PROVIDER_NOT_REGISTERED'
    ],
    provider: '',
    model_configured: false,
    prompt_version_configured: false,
    registry_entry_present: false,
    credential_reference_present: false,
    external_request_performed: false,
    ...overrides
  };
}

function loadDiagnostic(options = {}) {
  let mockConstructed = 0;
  const context = {
    console,
    WorkOsConfig: { TEST_MODE: options.test_mode === true },
    WorkOsAiAdapter: {
      getProductionReadiness: () =>
        readiness(options.production_readiness || {}),
      MockAiAdapter: function MockAiAdapter() {
        mockConstructed += 1;
        if (options.mock_must_not_run) {
          throw new Error('Mock AI ran with TEST_MODE=false');
        }
        this.healthCheck = () => ({
          provider: 'MOCK',
          status: 'READY'
        });
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: '16_Diagnostics.gs' });
  return {
    checks: Array.from(
      context.WorkOsDiagnostics.buildAiReadinessChecks(),
      (item) => JSON.parse(JSON.stringify(item))
    ),
    getMockConstructed: () => mockConstructed
  };
}

function byId(checks, id) {
  return checks.find((item) => item.id === id);
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
      safe_message: String(error && error.message || error).slice(0, 200)
    });
  }
}

test('F12-01_MOCK_READY_IS_LOCAL_ONLY_AND_PRODUCTION_WARNS', () => {
  const result = loadDiagnostic({ test_mode: true });
  assert.strictEqual(result.getMockConstructed(), 1);
  assert.strictEqual(
    byId(result.checks, 'MOCK_AI_LOCAL_READINESS').status,
    'PASS'
  );
  assert.strictEqual(
    byId(
      result.checks,
      'MOCK_AI_LOCAL_READINESS'
    ).details.production_readiness,
    false
  );
  [
    'PRODUCTION_AI_CONFIGURATION',
    'PRODUCTION_AI_POLICY_APPROVAL',
    'PRODUCTION_AI_AUTH_READINESS'
  ].forEach((id) => {
    assert.strictEqual(byId(result.checks, id).status, 'WARN');
  });
});

test('F12-02_TEST_MODE_FALSE_NEVER_CONSTRUCTS_MOCK', () => {
  const result = loadDiagnostic({
    test_mode: false,
    mock_must_not_run: true
  });
  assert.strictEqual(result.getMockConstructed(), 0);
  assert.strictEqual(
    byId(result.checks, 'MOCK_AI_LOCAL_READINESS').status,
    'NOT_EXECUTED'
  );
});

test('F12-03_PRODUCTION_READY_HAS_THREE_EXPLICIT_PASSES', () => {
  const result = loadDiagnostic({
    test_mode: false,
    mock_must_not_run: true,
    production_readiness: {
      ready: true,
      reasons: [],
      provider: 'SYNTHETIC_PROVIDER',
      model_configured: true,
      prompt_version_configured: true,
      registry_entry_present: true,
      credential_reference_present: true
    }
  });
  [
    'PRODUCTION_AI_CONFIGURATION',
    'PRODUCTION_AI_POLICY_APPROVAL',
    'PRODUCTION_AI_AUTH_READINESS'
  ].forEach((id) => {
    assert.strictEqual(byId(result.checks, id).status, 'PASS');
  });
  assert.strictEqual(result.getMockConstructed(), 0);
});

test('F12-04_LEGACY_COMBINED_READY_CHECK_IS_REMOVED', () => {
  assert.strictEqual(source.includes("'AI_ADAPTER_CONFIGURATION'"), false);
  assert.strictEqual(
    /createAdapter\(\)\.healthCheck\(\)/.test(source),
    false
  );
});

const failed = tests.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({
  suite: 'code_audit_p1_diagnostic_ai',
  environment: 'LOCAL_VM',
  real_ai_provider: 'NOT_EXECUTED',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
}, null, 2)}\n`);
if (failed.length) {
  process.exitCode = 1;
}

