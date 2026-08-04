'use strict';

const assert = require('node:assert');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const bridge = require('../tools/stage_a_evidence_bridge');

const root = path.resolve(__dirname, '..');
const bridgeSource = fs.readFileSync(path.join(root, 'tools', 'stage_a_evidence_bridge.js'), 'utf8');
const placeholderPath = path.join(root, 'tools', 'stage_a_operator_evidence_capture.js');
const placeholderSource = fs.readFileSync(placeholderPath, 'utf8');
const schema = JSON.parse(fs.readFileSync(path.join(root, 'schemas', 'stage-a-evidence-bridge-v1.schema.json'), 'utf8'));
const fixtures = JSON.parse(fs.readFileSync(path.join(root, 'fixtures', 'stage-a-evidence-bridge-v1-fixtures.json'), 'utf8'));

const tests = [];
function test(id, body) {
  try { body(); tests.push({ id, status: 'PASS' }); }
  catch (error) { tests.push({ id, status: 'FAIL', safe_message: String(error.message).slice(0, 120) }); }
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function byKey(input, key) { return input.records.find((record) => record.requirement_key === key); }
function directSnapshot(input) { return bridge.constructAllDirectStageASnapshot(input); }

test('BRIDGE-01_SCHEMA_AND_EXACT_18_REQUIREMENTS_MATCH', () => {
  assert.deepStrictEqual(schema.$defs.requirementKey.enum, bridge.STAGE_A_REQUIREMENTS);
  assert.strictEqual(bridge.STAGE_A_REQUIREMENTS.length, 18);
});
test('BRIDGE-02_PROJECT_UI_REQUIRES_CRYPTOGRAPHIC_MATCH', () => {
  const input = clone(fixtures.all_direct_synthetic);
  byKey(input, 'oauth_client_standard_cloud_project_equality').checks.cryptographic_equality = false;
  assert.throws(() => directSnapshot(input), /OPERATOR_UI_MATCH_REQUIRED/);
});
test('BRIDGE-03_RAW_PROJECT_OR_IDENTIFIER_VALUES_ARE_REJECTED', () => {
  [
    ['project_number', '123456'],
    ['project_id', 'synthetic-project'],
    ['deployment_id', 'synthetic-deployment'],
    ['owner_email', 'synthetic@example.invalid'],
    ['source_url', 'https://example.invalid'],
    ['screenshot', 'synthetic-image'],
    ['local_path', 'synthetic-path'],
    ['free_form_note', 'not-retained']
  ].forEach(([key, value]) => {
    const input = clone(fixtures.all_direct_synthetic);
    byKey(input, 'oauth_client_standard_cloud_project_equality')[key] = value;
    assert.throws(() => bridge.normalizeEvidenceBridge(input), /RECORD_FIELDS_INVALID/);
  });
});
test('BRIDGE-04_DEPLOYMENT_PROVENANCE_REQUIRES_SAME_VERIFIED_PRINCIPAL', () => {
  const input = clone(fixtures.all_direct_synthetic);
  byKey(input, 'immutable_api_executable_deployment_binding').checks.verified_principal_matches_operation = false;
  assert.throws(() => directSnapshot(input), /FRESH_PROVENANCE_INVALID/);
  const missingVersion = clone(fixtures.all_direct_synthetic);
  delete byKey(missingVersion, 'immutable_api_executable_deployment_binding').checks.immutable_version_number;
  assert.throws(() => directSnapshot(missingVersion), /FRESH_PROVENANCE_INVALID/);
});
test('BRIDGE-05_DEPLOYMENT_MUST_FOLLOW_OWNERSHIP_CHECKS', () => {
  const input = clone(fixtures.all_direct_synthetic);
  byKey(input, 'function_and_version_lineage').checks.deployment_after_ownership_checks = false;
  assert.throws(() => directSnapshot(input), /FRESH_PROVENANCE_INVALID/);
  const outOfOrder = clone(fixtures.all_direct_synthetic);
  byKey(outOfOrder, 'cross_domain_transfer_shared_drive_absent').sequence = 23;
  assert.throws(() => directSnapshot(outOfOrder), /DEPLOYMENT_ORDER_INVALID/);
});
test('BRIDGE-06_SHARED_DRIVE_BLOCKS_NON_SHARED_DRIVE_CONTRACT', () => {
  const sharedDrive = clone(fixtures.all_direct_synthetic);
  byKey(sharedDrive, 'script_project_ownership_evidence').checks.shared_drive_absent = false;
  assert.throws(() => directSnapshot(sharedDrive), /CURRENT_STATE_NOT_DIRECT/);
  const ownerOrParentMismatch = clone(fixtures.all_direct_synthetic);
  byKey(ownerOrParentMismatch, 'cross_domain_transfer_shared_drive_absent').checks.parent_binding_equal = false;
  assert.throws(() => directSnapshot(ownerOrParentMismatch), /CURRENT_STATE_NOT_DIRECT/);
});
test('BRIDGE-07_PENDING_OWNER_BLOCKS_NON_SHARED_DRIVE_CONTRACT', () => {
  const pendingOwner = clone(fixtures.all_direct_synthetic);
  byKey(pendingOwner, 'bound_container_ownership_evidence').checks.pending_owner_absent = false;
  assert.throws(() => directSnapshot(pendingOwner), /CURRENT_STATE_NOT_DIRECT/);
});
test('BRIDGE-08_FRESH_REDEPLOYMENT_DOES_NOT_REQUIRE_FULL_TRANSFER_HISTORY', () => {
  const result = directSnapshot(clone(fixtures.all_direct_synthetic));
  assert.strictEqual(result.outcome, 'STAGE_A_EVIDENCE_BRIDGE_SYNTHETIC_SNAPSHOT_READY_ONLY');
  assert.strictEqual(byKey(fixtures.all_direct_synthetic, 'immutable_api_executable_deployment_binding').checks.historical_transfer_proof_required, false);
  const requiresHistory = clone(fixtures.all_direct_synthetic);
  byKey(requiresHistory, 'immutable_api_executable_deployment_binding').checks.historical_transfer_proof_required = true;
  assert.throws(() => directSnapshot(requiresHistory), /FRESH_PROVENANCE_INVALID/);
});
test('BRIDGE-09_STALE_DEPLOYMENT_PROVENANCE_BLOCKS', () => {
  const input = clone(fixtures.all_direct_synthetic);
  byKey(input, 'execution_target_is_api_executable_deployment_id').checks.stale_provenance = true;
  assert.throws(() => directSnapshot(input), /FRESH_PROVENANCE_INVALID/);
});
test('BRIDGE-10_NON_DIRECT_OR_CONTRADICTED_FIELD_BLOCKS_SNAPSHOT', () => {
  const nonDirect = clone(fixtures.all_direct_synthetic);
  const record = byKey(nonDirect, 'automation_off');
  record.evidence_status = 'LOCALLY_ATTESTED'; record.verification_method = null;
  record.source_category = 'SYNTHETIC_UNRESOLVED'; record.phase = 'NOT_VERIFIED';
  record.operator_evidence_consumed = false;
  assert.throws(() => directSnapshot(nonDirect), /ALL_DIRECT_REQUIRED/);
  const contradicted = clone(nonDirect);
  byKey(contradicted, 'automation_off').evidence_status = 'CONTRADICTED';
  assert.throws(() => directSnapshot(contradicted), /ALL_DIRECT_REQUIRED/);
});
test('BRIDGE-11_DIRECT_RECORD_REQUIRES_AN_APPROVED_METHOD', () => {
  const missingMethod = clone(fixtures.all_direct_synthetic);
  byKey(missingMethod, 'automation_off').verification_method = null;
  assert.throws(() => bridge.normalizeEvidenceBridge(missingMethod), /DIRECT_METHOD_INVALID/);
  const unknownMethod = clone(fixtures.all_direct_synthetic);
  byKey(unknownMethod, 'automation_off').verification_method = 'UNAPPROVED_METHOD';
  assert.throws(() => bridge.normalizeEvidenceBridge(unknownMethod), /DIRECT_METHOD_INVALID/);
});
test('BRIDGE-12_OPERATOR_PLACEHOLDER_IS_EXACT_AND_HAS_NO_INPUT_OR_IMPORT', () => {
  const result = childProcess.spawnSync(process.execPath, [placeholderPath], { cwd: root, encoding: 'utf8', env: {}, windowsHide: true });
  assert.strictEqual(result.status, 1);
  assert.strictEqual(result.stdout, 'STAGE_A_OPERATOR_EVIDENCE_CAPTURE_NOT_AUTHORIZED\n');
  assert.strictEqual(result.stderr, '');
  assert.doesNotMatch(placeholderSource, /\brequire\s*\(|\bimport\b|process\.(?:env|stdin)|readFile|prompt|readline|fetch|https?:\/\/|oauth|clasp|google|browser|child_process/i);
});
test('BRIDGE-13_SUCCESS_IS_READINESS_ONLY_NEVER_STAGE_B_AUTHORIZATION', () => {
  const result = directSnapshot(clone(fixtures.all_direct_synthetic));
  assert.strictEqual(result.stage_b_authorized, false);
  assert.strictEqual(result.remote_call_performed, false);
  assert.match(result.snapshot_sha256, /^[a-f0-9]{64}$/);
});
test('BRIDGE-14_STAGE_B_UNSTARTED_AND_NO_FUNCTION_OR_REMOTE_PATH', () => {
  const result = directSnapshot(clone(fixtures.all_direct_synthetic));
  assert.strictEqual(result.stage_b_attempt, 'NOT_STARTED');
  assert.strictEqual(result.scripts_run, 'NOT_EXECUTED');
  assert.strictEqual(result.clasp_run_function, 'NOT_EXECUTED');
  assert.strictEqual(result.function_invocation, 'NOT_EXECUTED');
  [
    /process\.env/,
    /node:(?:fs|http|https|net|tls|dns|child_process)/,
    /\bfetch\s*\(/,
    /require\s*\(\s*['"](?:@google\/clasp|googleapis)['"]\s*\)/,
    /https?:\/\//
  ].forEach((pattern) => assert.doesNotMatch(bridgeSource, pattern));
});
test('BRIDGE-15_REQUIREMENT_METHOD_AND_OPERATOR_SCOPE_ARE_FIXED', () => {
  const wrongCloudMethod = clone(fixtures.all_direct_synthetic);
  const cloudRecord = byKey(wrongCloudMethod, 'oauth_client_standard_cloud_project_equality');
  cloudRecord.verification_method = 'LOCAL_CRYPTOGRAPHIC_BINDING';
  cloudRecord.source_category = 'SYNTHETIC_LOCAL_CRYPTOGRAPHIC_BINDING';
  cloudRecord.phase = 'LOCAL_CRYPTOGRAPHIC_BINDING';
  cloudRecord.operator_evidence_consumed = false;
  assert.throws(() => directSnapshot(wrongCloudMethod), /DIRECT_METHOD_INVALID/);
  const nonOperatorConsumesUi = clone(fixtures.all_direct_synthetic);
  byKey(nonOperatorConsumesUi, 'automation_off').operator_evidence_consumed = true;
  assert.throws(() => directSnapshot(nonOperatorConsumesUi), /OPERATOR_EVIDENCE_SCOPE_INVALID/);
});
test('BRIDGE-16_EVERY_REQUIREMENT_HAS_A_FIXED_METHOD_AND_BINDING', () => {
  const wrongScopeMethod = clone(fixtures.all_direct_synthetic);
  const scopeRecord = byKey(wrongScopeMethod, 'required_scope_coverage');
  scopeRecord.verification_method = 'LOCAL_CRYPTOGRAPHIC_BINDING';
  scopeRecord.source_category = 'SYNTHETIC_LOCAL_CRYPTOGRAPHIC_BINDING';
  scopeRecord.phase = 'LOCAL_CRYPTOGRAPHIC_BINDING';
  assert.throws(() => directSnapshot(wrongScopeMethod), /DIRECT_METHOD_INVALID/);
  const wrongBinding = clone(fixtures.all_direct_synthetic);
  byKey(wrongBinding, 'required_scope_coverage').binding_fingerprint =
    wrongBinding.bindings.target_attestation_sha256;
  assert.throws(() => directSnapshot(wrongBinding), /REQUIREMENT_BINDING_INVALID/);
});
test('BRIDGE-17_OPERATOR_AND_FRESH_BINDINGS_ARE_CRYPTOGRAPHICALLY_LINKED', () => {
  const operatorMismatch = clone(fixtures.all_direct_synthetic);
  operatorMismatch.bindings.operator_ui_project_number_sha256 =
    'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
  assert.throws(() => directSnapshot(operatorMismatch), /OPERATOR_PROJECT_FINGERPRINT_MISMATCH/);
  const staleMarkerBinding = clone(fixtures.all_direct_synthetic);
  staleMarkerBinding.bindings.mutation_marker_sha256 =
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  assert.throws(() => directSnapshot(staleMarkerBinding), /FRESH_PROVENANCE_BINDING_INVALID/);
});
test('BRIDGE-18_FRESH_OPERATION_AND_OWNERSHIP_DETAILS_ARE_NOT_SELF_ATTESTED', () => {
  const missingMarker = clone(fixtures.all_direct_synthetic);
  byKey(missingMarker, 'immutable_api_executable_deployment_binding').checks.mutation_marker_before_request = false;
  assert.throws(() => directSnapshot(missingMarker), /FRESH_PROVENANCE_INVALID/);
  const incompleteReconciliation = clone(fixtures.all_direct_synthetic);
  byKey(incompleteReconciliation, 'function_and_version_lineage').checks.read_only_reconciliation_exact = false;
  assert.throws(() => directSnapshot(incompleteReconciliation), /FRESH_PROVENANCE_INVALID/);
  const missingPermissionPage = clone(fixtures.all_direct_synthetic);
  byKey(missingPermissionPage, 'bound_container_ownership_evidence').checks.bound_container_permission_enumeration_complete = false;
  assert.throws(() => directSnapshot(missingPermissionPage), /CURRENT_STATE_NOT_DIRECT/);
  const scriptNotOwnedByMe = clone(fixtures.all_direct_synthetic);
  byKey(scriptNotOwnedByMe, 'script_project_ownership_evidence').checks.script_owned_by_me = false;
  assert.throws(() => directSnapshot(scriptNotOwnedByMe), /CURRENT_STATE_NOT_DIRECT/);
  const containerSharedDrive = clone(fixtures.all_direct_synthetic);
  byKey(containerSharedDrive, 'cross_domain_transfer_shared_drive_absent').checks.bound_container_shared_drive_absent = false;
  assert.throws(() => directSnapshot(containerSharedDrive), /CURRENT_STATE_NOT_DIRECT/);
  const scriptPendingOwner = clone(fixtures.all_direct_synthetic);
  byKey(scriptPendingOwner, 'script_project_ownership_evidence').checks.script_pending_owner_absent = false;
  assert.throws(() => directSnapshot(scriptPendingOwner), /CURRENT_STATE_NOT_DIRECT/);
});

const failed = tests.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({ suite: 'stage_a_evidence_bridge', environment: 'LOCAL_SYNTHETIC_ONLY', passed: tests.length - failed.length, failed: failed.length, tests: failed })}\n`);
process.exitCode = failed.length ? 1 : 0;
