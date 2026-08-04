'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const architecture = require('../tools/auth_diagnostic_architecture');

const moduleRoot = path.resolve(__dirname, '..');
const architectureToolPath = path.join(
  moduleRoot,
  'tools',
  'auth_diagnostic_architecture.js'
);
const existingPlaceholderPath = path.join(
  moduleRoot,
  'tools',
  'auth_diagnostic_design.js'
);
const schemaPath = path.join(
  moduleRoot,
  'schemas',
  'auth-diagnostic-architecture-v2.schema.json'
);
const fixturesPath = path.join(
  moduleRoot,
  'fixtures',
  'auth-diagnostic-architecture-v2-fixtures.json'
);
const architectureToolSource = fs.readFileSync(architectureToolPath, 'utf8');
const existingPlaceholderSource = fs.readFileSync(existingPlaceholderPath, 'utf8');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));

function copy(value) {
  return JSON.parse(JSON.stringify(value));
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
      safe_message: String(error && error.message || error).slice(0, 160)
    });
  }
}

test('AUTH-ARCH-V2-01_SCHEMA_AND_CODE_CONTRACTS_MATCH', () => {
  assert.deepStrictEqual(
    schema.$defs.evidenceStatus.enum,
    architecture.STAGE_A_EVIDENCE_STATUSES
  );
  assert.deepStrictEqual(
    schema.$defs.stageAEvidence.required,
    architecture.STAGE_A_REQUIREMENTS.map((item) => item.key)
  );
  assert.deepStrictEqual(
    schema.$defs.safeResponse.required,
    architecture.SAFE_RESPONSE_KEYS
  );
  assert.strictEqual(schema.$defs.safeResponse.additionalProperties, false);
  assert.strictEqual(schema.$defs.stageBMarker.additionalProperties, false);
  assert.strictEqual(
    architecture.SELECTED_TRANSPORT,
    'DIRECT_REST_SCRIPTS_RUN'
  );
  assert.strictEqual(
    architecture.REJECTED_TRANSPORT,
    'CLASP_3_3_0_RUN_FUNCTION'
  );
  assert.strictEqual(
    architecture.SELECTED_PROBE,
    'IGNORED_RUNTIME_OVERLAY_CONSTANT_AUTHORIZATION_PROBE'
  );
  assert.strictEqual(architecture.REJECTED_PROBE, 'RUN_QUICK_DIAGNOSTIC');
});

test('AUTH-ARCH-V2-02_STAGE_A_DEFAULTS_TO_FAIL_CLOSED_UNKNOWN', () => {
  const normalized = architecture.normalizeStageAEvidence({});
  assert.strictEqual(
    Object.keys(normalized).length,
    architecture.STAGE_A_REQUIREMENTS.length
  );
  Object.values(normalized).forEach((status) => {
    assert.strictEqual(status, 'UNKNOWN_NOT_EXPOSED');
  });
  assert.strictEqual(
    architecture.classifyStageAPreflight({}).normalized_reason,
    'AUTH_DIAGNOSTIC_PREFLIGHT_OWNERSHIP_INCONCLUSIVE'
  );
});

test('AUTH-ARCH-V2-03_ALL_DIRECT_SYNTHETIC_CASE_REMAINS_NO_CALL', () => {
  const result = architecture.classifyStageAPreflight(
    fixtures.stage_a.all_directly_verified_structural_success
  );
  assert.strictEqual(result.preflight_state, 'PREPARED_FOR_LATER_AUTHORIZATION');
  assert.strictEqual(result.normalized_reason, 'PREPARED_FOR_LATER_AUTHORIZATION');
  assert.strictEqual(
    result.evidence.execution_api_target_semantics,
    'DIRECTLY_VERIFIED'
  );
  assert.strictEqual(result.call_authorized, false);
  assert.strictEqual(result.remote_call_performed, false);
  assert.strictEqual(
    result.diagnostic_execution,
    architecture.EXECUTION_NOT_AUTHORIZED
  );
});

test('AUTH-ARCH-V2-04_TARGET_SEMANTICS_MUST_BE_DIRECTLY_VERIFIED', () => {
  const result = architecture.classifyStageAPreflight(
    fixtures.stage_a.transport_semantics_not_directly_verified
  );
  assert.strictEqual(result.preflight_state, 'BLOCKED');
  assert.strictEqual(
    result.normalized_reason,
    'AUTH_DIAGNOSTIC_UNKNOWN_FAILED_CLOSED'
  );
  assert.strictEqual(result.call_authorized, false);
  assert.strictEqual(result.remote_call_performed, false);
});

test('AUTH-ARCH-V2-05_SCRIPT_ID_TYPED_SUBSTITUTE_BLOCKS', () => {
  const result = architecture.classifyStageAPreflight(
    fixtures.stage_a.script_id_typed_substitute_contradicted
  );
  assert.strictEqual(result.preflight_state, 'BLOCKED');
  assert.strictEqual(
    result.normalized_reason,
    'AUTH_DIAGNOSTIC_PREFLIGHT_DEPLOYMENT_TARGET_INVALID'
  );
});

test('AUTH-ARCH-V2-05A_CONTRADICTED_TARGET_SEMANTICS_BLOCKS', () => {
  const result = architecture.classifyStageAPreflight(
    fixtures.stage_a.target_semantics_contradicted
  );
  assert.strictEqual(result.preflight_state, 'BLOCKED');
  assert.strictEqual(
    result.normalized_reason,
    'AUTH_DIAGNOSTIC_PREFLIGHT_DEPLOYMENT_TARGET_INVALID'
  );
  assert.strictEqual(result.call_authorized, false);
  assert.strictEqual(result.remote_call_performed, false);
});

test('AUTH-ARCH-V2-06_STAGE_A_REQUIRED_FAILURE_CLASSIFICATIONS', () => {
  const expected = {
    project_mismatch: 'AUTH_DIAGNOSTIC_PREFLIGHT_PROJECT_MISMATCH',
    principal_mismatch: 'AUTH_DIAGNOSTIC_PREFLIGHT_PRINCIPAL_MISMATCH',
    token_invalid: 'AUTH_DIAGNOSTIC_TOKEN_INVALID_OR_EXPIRED',
    common_cloud_project_rejected:
      'AUTH_DIAGNOSTIC_COMMON_CLOUD_PROJECT_REJECTED',
    unknown_bound_container_ownership:
      'AUTH_DIAGNOSTIC_PREFLIGHT_OWNERSHIP_INCONCLUSIVE'
  };
  Object.entries(expected).forEach(([fixtureName, reason]) => {
    const result = architecture.classifyStageAPreflight(
      fixtures.stage_a[fixtureName]
    );
    assert.strictEqual(result.normalized_reason, reason);
    assert.strictEqual(result.call_authorized, false);
    assert.strictEqual(result.remote_call_performed, false);
  });
});

test('AUTH-ARCH-V2-07_STAGE_B_REQUIRES_SEPARATE_AUTHORIZATION_AND_START_MARKER', () => {
  const planned = architecture.planStageBAttempt(
    fixtures.stage_b.separately_authorized_pristine
  );
  assert.strictEqual(planned.decision, 'MARK_ATTEMPT_STARTED_BEFORE_REMOTE_CALL');
  assert.strictEqual(planned.remote_call_performed, false);
  assert.strictEqual(planned.call_authorized, false);
  assert.strictEqual(planned.retry_permitted, false);
  assert.strictEqual(planned.follow_up_call_planned, false);
  assert.strictEqual(planned.next_marker.attempt_state, 'ATTEMPT_STARTED');
  assert.strictEqual(planned.next_marker.invocation_count, 1);
  assert.strictEqual(planned.next_marker.target_kind, 'API_EXECUTABLE_DEPLOYMENT_ID');
  assert.match(planned.next_marker.work_marker_sha256, /^[a-f0-9]{64}$/);
  assert.match(planned.next_marker.stage_a_preflight_sha256, /^[a-f0-9]{64}$/);
  assert.match(planned.next_marker.deployment_binding_sha256, /^[a-f0-9]{64}$/);
  Object.values(planned.next_marker.stage_a_preflight).forEach((status) => {
    assert.strictEqual(status, 'DIRECTLY_VERIFIED');
  });
  assert.strictEqual(planned.next_marker.transport, architecture.SELECTED_TRANSPORT);
  assert.strictEqual(planned.next_marker.probe_function, architecture.SELECTED_PROBE);
  assert.strictEqual(planned.next_marker.execution_api_access, 'MYSELF');
  assert.strictEqual(planned.next_marker.target_fallback_allowed, false);
});

test('AUTH-ARCH-V2-08_STAGE_B_NO_RETRY_OR_FOLLOW_UP_AFTER_START_OR_CLOSE', () => {
  const planned = architecture.planStageBAttempt(
    fixtures.stage_b.separately_authorized_pristine
  );
  assert.strictEqual(
    architecture.planStageBAttempt(planned.next_marker).decision,
    'AUTH_DIAGNOSTIC_ATTEMPT_ALREADY_CONSUMED'
  );
  const closed = architecture.closeStageBAttempt(planned.next_marker);
  assert.strictEqual(closed.decision, 'MARK_ATTEMPT_CLOSED_NO_RETRY');
  assert.strictEqual(closed.remote_call_performed, false);
  assert.strictEqual(closed.retry_permitted, false);
  assert.strictEqual(closed.follow_up_call_planned, false);
  assert.strictEqual(closed.next_marker.attempt_state, 'ATTEMPT_CLOSED');
  assert.strictEqual(
    architecture.planStageBAttempt(closed.next_marker).decision,
    'AUTH_DIAGNOSTIC_ATTEMPT_ALREADY_CONSUMED'
  );
});

test('AUTH-ARCH-V2-09_STAGE_B_REJECTS_UNAUTHORIZED_OR_INVALID_CONTRACTS', () => {
  const unauthorized = copy(fixtures.stage_b.separately_authorized_pristine);
  unauthorized.authorization_state = 'NOT_AUTHORIZED';
  unauthorized.separately_authorized_work_marker = false;
  assert.strictEqual(
    architecture.planStageBAttempt(unauthorized).decision,
    architecture.EXECUTION_NOT_AUTHORIZED
  );

  const invalidTarget = copy(fixtures.stage_b.separately_authorized_pristine);
  invalidTarget.target_kind = 'SCRIPT_ID';
  assert.throws(
    () => architecture.planStageBAttempt(invalidTarget),
    /AUTH_DIAGNOSTIC_STAGE_B_MARKER_INVALID/
  );

  const incompletePreflight = copy(fixtures.stage_b.separately_authorized_pristine);
  incompletePreflight.stage_a_preflight.bound_container_ownership_evidence =
    'UNKNOWN_NOT_EXPOSED';
  assert.throws(
    () => architecture.planStageBAttempt(incompletePreflight),
    /AUTH_DIAGNOSTIC_STAGE_B_PREFLIGHT_NOT_DIRECTLY_VERIFIED/
  );

  const mismatchedFingerprint = copy(fixtures.stage_b.separately_authorized_pristine);
  mismatchedFingerprint.stage_a_preflight_sha256 =
    '4444444444444444444444444444444444444444444444444444444444444444';
  assert.throws(
    () => architecture.planStageBAttempt(mismatchedFingerprint),
    /AUTH_DIAGNOSTIC_STAGE_B_PREFLIGHT_FINGERPRINT_MISMATCH/
  );
});

test('AUTH-ARCH-V2-10_SAFE_RESPONSE_REJECTS_RAW_AND_IDENTIFIER_FIELDS', () => {
  const response = fixtures.responses.probe_pass_not_functional_acceptance;
  [
    'raw_response_body',
    'raw_error_text',
    'stack_trace',
    'script_id',
    'deployment_id',
    'project',
    'url',
    'email',
    'token',
    'local_path'
  ].forEach((forbiddenField) => {
    const invalid = copy(response);
    invalid[forbiddenField] = 'synthetic';
    assert.throws(
      () => architecture.normalizeSafeResponse(invalid),
      /AUTH_DIAGNOSTIC_RESPONSE_FIELD_NOT_ALLOWED/
    );
  });
});

test('AUTH-ARCH-V2-11_SAFE_RESPONSE_CLASSIFIES_ALL_CLOSED_BRANCHES', () => {
  Object.values(fixtures.responses).forEach((fixture) => {
    const result = architecture.classifySafeResponse(fixture);
    assert.strictEqual(result.normalized_reason, fixture.normalized_reason);
    assert.strictEqual(result.retry_permitted, false);
    assert.deepStrictEqual(
      Object.keys(result).sort(),
      architecture.SAFE_RESPONSE_KEYS.slice().sort()
    );
  });
  const success = architecture.classifySafeResponse(
    fixtures.responses.probe_pass_not_functional_acceptance
  );
  assert.strictEqual(
    success.normalized_reason,
    'AUTH_DIAGNOSTIC_PROBE_PASS_NOT_FUNCTIONAL_ACCEPTANCE'
  );
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(success, 'functional_runtime_acceptance'),
    false
  );
});

test('AUTH-ARCH-V2-12_FIXTURES_ARE_SYNTHETIC_AND_FORBIDDEN_KEYS_ABSENT', () => {
  assert.strictEqual(fixtures.source_boundary, 'SYNTHETIC_ONLY');
  const forbiddenKeys = new Set([
    'raw_response_body',
    'raw_error_text',
    'stack_trace',
    'script_id',
    'deployment_id',
    'project_id',
    'url',
    'email',
    'token',
    'local_path'
  ]);
  function inspect(value) {
    if (!value || typeof value !== 'object') {
      return;
    }
    Object.entries(value).forEach(([key, nestedValue]) => {
      assert.strictEqual(forbiddenKeys.has(key), false, `forbidden fixture key: ${key}`);
      inspect(nestedValue);
    });
  }
  inspect(fixtures);
});

test('AUTH-ARCH-V2-13_ARCHITECTURE_TOOL_HAS_NO_ACTIVE_REMOTE_OR_CREDENTIAL_PATH', () => {
  assert.match(architectureToolSource, /require\('node:crypto'\)/);
  assert.doesNotMatch(
    architectureToolSource.replace(/require\('node:crypto'\)/g, ''),
    /\brequire\s*\(/
  );
  assert.doesNotMatch(architectureToolSource, /\bimport\s+(?:[\w{*]|\()/);
  assert.doesNotMatch(architectureToolSource, /\bprocess\b/);
  assert.doesNotMatch(architectureToolSource, /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/);
  assert.doesNotMatch(
    architectureToolSource,
    /node:(?:fs|http|https|net|tls|dns|child_process)/
  );
  assert.doesNotMatch(
    architectureToolSource,
    /\b(?:fs|http|https|net|tls|dns|child_process)\s*\./
  );
  assert.doesNotMatch(
    architectureToolSource,
    /@google\/clasp|googleapis|local_clasp_dev|https?:\/\//
  );
});

test('AUTH-ARCH-V2-14_EXISTING_PLACEHOLDER_REMAINS_PRE_IMPORT_AND_ENVIRONMENT_SAFE', () => {
  assert.doesNotMatch(existingPlaceholderSource, /\bprocess\s*\.\s*env\b/);
  assert.doesNotMatch(existingPlaceholderSource, /\brequire\s*\(/);
  assert.doesNotMatch(
    existingPlaceholderSource,
    /node:(?:fs|http|https|net|tls|dns|child_process)|@google\/clasp|googleapis/
  );
  let requireCalls = 0;
  let stdout = '';
  let exitCode = null;
  const moduleStub = { exports: {} };
  function deniedRequire() {
    requireCalls += 1;
    throw new Error('SYNTHETIC_REQUIRE_DENIED');
  }
  deniedRequire.main = moduleStub;
  const processStub = new Proxy({}, {
    get(_target, property) {
      if (property === 'stdout') {
        return { write: (value) => { stdout += String(value); } };
      }
      throw new Error('SYNTHETIC_PROCESS_READ_DENIED');
    },
    set(_target, property, value) {
      if (property !== 'exitCode') {
        throw new Error('SYNTHETIC_PROCESS_WRITE_DENIED');
      }
      exitCode = value;
      return true;
    }
  });
  vm.runInNewContext(existingPlaceholderSource, {
    module: moduleStub,
    exports: moduleStub.exports,
    require: deniedRequire,
    process: processStub
  }, { filename: 'synthetic-existing-placeholder.js' });
  assert.strictEqual(requireCalls, 0);
  assert.strictEqual(
    stdout,
    `${architecture.EXECUTION_NOT_AUTHORIZED}\n`
  );
  assert.strictEqual(exitCode, 1);
});

const summary = {
  suite: 'remote_only_auth_diagnostic_architecture_v2',
  environment: 'LOCAL_SYNTHETIC_ONLY',
  google_network: 'NOT_EXECUTED',
  oauth_or_credential_read: 'NOT_EXECUTED',
  passed: tests.filter((item) => item.status === 'PASS').length,
  failed: tests.filter((item) => item.status === 'FAIL').length,
  tests
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed > 0) {
  process.exitCode = 1;
}
