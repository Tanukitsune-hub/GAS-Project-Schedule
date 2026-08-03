'use strict';

const assert = require('node:assert');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const design = require('../tools/auth_diagnostic_design');

const moduleRoot = path.resolve(__dirname, '..');
const toolPath = path.join(moduleRoot, 'tools', 'auth_diagnostic_design.js');
const schemaPath = path.join(
  moduleRoot,
  'schemas',
  'auth-diagnostic-design-v1.schema.json'
);
const packagePath = path.join(moduleRoot, 'package.json');
const toolSource = fs.readFileSync(toolPath, 'utf8');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const syntheticHistoricalEvidence = {
  schema_id: design.EVIDENCE_SCHEMA_ID,
  source_boundary: design.EVIDENCE_SOURCE_BOUNDARY,
  evidence: {
    named_oauth_profile_usability: 'LOCALLY_ATTESTED',
    oauth_scope_coverage: 'LOCALLY_ATTESTED',
    desktop_client_cloud_project_alignment: 'LOCALLY_ATTESTED',
    oauth_testing_principal_eligibility: 'LOCALLY_ATTESTED',
    standard_cloud_project_linkage: 'LOCALLY_ATTESTED',
    apps_script_api_project_enablement: 'LOCALLY_ATTESTED',
    api_executable_myself_access: 'LOCALLY_ATTESTED',
    oauth_principal_execution_permission: 'INFERRED',
    script_project_ownership_alignment: 'UNKNOWN_NOT_EXPOSED',
    bound_container_ownership_alignment: 'UNKNOWN_NOT_EXPOSED',
    runtime_function_deployment_lineage: 'LOCALLY_ATTESTED'
  }
};

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

test('AUTH-DESIGN-01_SCHEMA_AND_CODE_REQUIREMENTS_MATCH', () => {
  assert.deepStrictEqual(
    schema.$defs.evidenceStatus.enum,
    design.EVIDENCE_STATUSES
  );
  assert.deepStrictEqual(
    schema.$defs.evidence.required,
    design.REQUIREMENT_DEFINITIONS.map((item) => item.key)
  );
  assert.strictEqual(
    schema.properties.schema_id.const,
    design.EVIDENCE_SCHEMA_ID
  );
});

test('AUTH-DESIGN-02_NORMALIZER_FILLS_ONLY_CLOSED_UNKNOWN_STATUS', () => {
  const normalized = design.normalizeAuthDiagnosticEvidence({});
  assert.strictEqual(Object.keys(normalized.evidence).length, 11);
  Object.values(normalized.evidence).forEach((status) => {
    assert.strictEqual(status, 'UNKNOWN_NOT_EXPOSED');
  });
});

test('AUTH-DESIGN-03_NORMALIZER_REJECTS_UNDECLARED_FIELDS_AND_VALUES', () => {
  assert.throws(
    () => design.normalizeAuthDiagnosticEvidence({ account: 'synthetic' }),
    /AUTH_DIAGNOSTIC_EVIDENCE_ENVELOPE_INVALID/
  );
  assert.throws(
    () => design.normalizeAuthDiagnosticEvidence({
      evidence: { deployment_identifier: 'synthetic' }
    }),
    /AUTH_DIAGNOSTIC_EVIDENCE_FIELD_NOT_ALLOWED/
  );
  assert.throws(
    () => design.normalizeAuthDiagnosticEvidence({
      evidence: { oauth_scope_coverage: { status: 'LOCALLY_ATTESTED' } }
    }),
    /AUTH_DIAGNOSTIC_EVIDENCE_STATUS_INVALID/
  );
});

test('AUTH-DESIGN-04_CLASSIFIER_PRESERVES_FACT_INFERENCE_UNKNOWN_BOUNDARY', () => {
  const result = design.classifyAuthDiagnosticEvidence(syntheticHistoricalEvidence);
  assert.strictEqual(result.counts.LOCALLY_ATTESTED, 8);
  assert.strictEqual(result.counts.INFERRED, 1);
  assert.strictEqual(result.counts.UNKNOWN_NOT_EXPOSED, 2);
  assert.strictEqual(result.classification, 'REMOTE_AUTHORIZATION_LAYER_UNRESOLVED');
  assert.strictEqual(result.root_cause, 'NOT_PROVEN_BY_REPOSITORY_EVIDENCE');
  assert.strictEqual(
    result.diagnostic_execution,
    design.EXECUTION_NOT_AUTHORIZED
  );
});

test('AUTH-DESIGN-05_DECISION_TREE_DEFERS_REAL_ENVIRONMENT', () => {
  const result = design.decideAuthDiagnosticDesign(syntheticHistoricalEvidence);
  assert.deepStrictEqual(result, {
    outcome: 'REMOTE_ONLY_AUTH_DIAGNOSTIC_DESIGN_COMPLETE',
    evidence_decision: 'REAL_ENVIRONMENT_VERIFICATION_DEFERRED_TO_LATER_WORK_ID',
    operator_action_now: 'NOT_REQUIRED',
    diagnostic_execution: design.EXECUTION_NOT_AUTHORIZED
  });
});

test('AUTH-DESIGN-06_INSTRUCTION_0019_MARKER_CANNOT_START', () => {
  const marker = design.createInstruction0019DesignMarker();
  const result = design.planOneUseAttemptStart(marker);
  assert.deepStrictEqual(result, {
    decision: design.EXECUTION_NOT_AUTHORIZED,
    remote_call_performed: false
  });
});

test('AUTH-DESIGN-07_SYNTHETIC_FUTURE_MARKER_IS_ONE_USE_ONLY', () => {
  const planned = design.planOneUseAttemptStart({
    schema_id: design.MARKER_SCHEMA_ID,
    authorization_state: 'AUTHORIZED_BY_LATER_TRACKED_INSTRUCTION',
    attempt_state: 'NOT_STARTED',
    invocation_count: 0,
    prior_attempt_markers_preserved: true
  });
  assert.strictEqual(planned.decision, 'MARK_ATTEMPT_STARTED_BEFORE_REMOTE_CALL');
  assert.strictEqual(planned.remote_call_performed, false);
  assert.strictEqual(planned.next_marker.attempt_state, 'ATTEMPT_STARTED');
  assert.strictEqual(planned.next_marker.invocation_count, 1);
  assert.strictEqual(
    design.planOneUseAttemptStart(planned.next_marker).decision,
    'AUTH_DIAGNOSTIC_ATTEMPT_ALREADY_CONSUMED'
  );
  const closed = design.closeOneUseAttempt(planned.next_marker);
  assert.strictEqual(closed.attempt_state, 'ATTEMPT_CLOSED');
  assert.strictEqual(closed.invocation_count, 1);
});

test('AUTH-DESIGN-08_PRIOR_ATTEMPT_MARKERS_ARE_MANDATORY', () => {
  const result = design.planOneUseAttemptStart({
    schema_id: design.MARKER_SCHEMA_ID,
    authorization_state: 'AUTHORIZED_BY_LATER_TRACKED_INSTRUCTION',
    attempt_state: 'NOT_STARTED',
    invocation_count: 0,
    prior_attempt_markers_preserved: false
  });
  assert.deepStrictEqual(result, {
    decision: 'AUTH_DIAGNOSTIC_PRIOR_MARKERS_NOT_PRESERVED',
    remote_call_performed: false
  });
});

test('AUTH-DESIGN-09_PLACEHOLDER_OUTPUT_IS_EXACT_AND_FAIL_CLOSED', () => {
  const result = childProcess.spawnSync(process.execPath, [toolPath], {
    cwd: moduleRoot,
    encoding: 'utf8',
    windowsHide: true,
    env: {}
  });
  assert.strictEqual(result.status, 1);
  assert.strictEqual(result.stdout, `${design.EXECUTION_NOT_AUTHORIZED}\n`);
  assert.strictEqual(result.stderr, '');
});

test('AUTH-DESIGN-10_PLACEHOLDER_PERFORMS_NO_IMPORT_OR_ENVIRONMENT_READ', () => {
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
  vm.runInNewContext(toolSource, {
    module: moduleStub,
    exports: moduleStub.exports,
    require: deniedRequire,
    process: processStub
  }, { filename: 'synthetic-auth-diagnostic-placeholder.js' });
  assert.strictEqual(requireCalls, 0);
  assert.strictEqual(stdout, `${design.EXECUTION_NOT_AUTHORIZED}\n`);
  assert.strictEqual(exitCode, 1);
});

test('AUTH-DESIGN-11_SOURCE_HAS_NO_REMOTE_OR_LOCAL_SECRET_READER', () => {
  assert.doesNotMatch(toolSource, /\bprocess\s*\.\s*env\b/);
  assert.doesNotMatch(toolSource, /\brequire\s*\(/);
  assert.doesNotMatch(
    toolSource,
    /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(|@google\/clasp|googleapis|local_clasp_dev/
  );
  assert.doesNotMatch(
    toolSource,
    /node:(?:fs|http|https|net|tls|dns|child_process)|https?:\/\//
  );
});

test('AUTH-DESIGN-12_PACKAGE_COMMAND_IS_STANDALONE_PLACEHOLDER', () => {
  assert.strictEqual(
    packageJson.scripts['auth:diagnostic:placeholder:0019'],
    'node tools/auth_diagnostic_design.js'
  );
  assert.doesNotMatch(
    packageJson.scripts['auth:diagnostic:placeholder:0019'],
    /clasp|local_clasp_dev|oauth|google/i
  );
});

const summary = {
  suite: 'remote_only_auth_diagnostic_design',
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
