'use strict';

const crypto = require('node:crypto');

const SCHEMA_ID = 'GAS_STAGE_A_EVIDENCE_BRIDGE_V1';
const EVIDENCE_STATUSES = Object.freeze([
  'DIRECTLY_VERIFIED',
  'LOCALLY_ATTESTED',
  'INFERRED',
  'UNKNOWN_NOT_EXPOSED',
  'CONTRADICTED'
]);
const VERIFICATION_METHODS = Object.freeze([
  'OFFICIAL_API_CURRENT_STATE',
  'OPERATOR_UI_PROJECT_LINK',
  'FRESH_SAME_PRINCIPAL_MUTATION_PROVENANCE',
  'LOCAL_CRYPTOGRAPHIC_BINDING'
]);
const STAGE_A_REQUIREMENTS = Object.freeze([
  'target_personal_synthetic_non_company',
  'target_intended_bound_sandbox',
  'automation_off',
  'test_mode_true_where_applicable',
  'oauth_client_standard_cloud_project_equality',
  'apps_script_api_project_enablement',
  'oauth_audience_client_equality',
  'required_scope_coverage',
  'token_validity_threshold',
  'oauth_principal_myself_identity_equality',
  'immutable_api_executable_deployment_binding',
  'execution_target_is_api_executable_deployment_id',
  'execution_api_target_semantics',
  'function_and_version_lineage',
  'script_project_ownership_evidence',
  'bound_container_ownership_evidence',
  'cross_domain_transfer_shared_drive_absent',
  'prior_attempt_markers_preserved'
]);
const SOURCE_BY_METHOD = Object.freeze({
  OFFICIAL_API_CURRENT_STATE: 'SYNTHETIC_OFFICIAL_API_CURRENT_STATE',
  OPERATOR_UI_PROJECT_LINK: 'SYNTHETIC_OPERATOR_UI_PROJECT_LINK',
  FRESH_SAME_PRINCIPAL_MUTATION_PROVENANCE:
    'SYNTHETIC_FRESH_SAME_PRINCIPAL_MUTATION_PROVENANCE',
  LOCAL_CRYPTOGRAPHIC_BINDING: 'SYNTHETIC_LOCAL_CRYPTOGRAPHIC_BINDING'
});
const PHASE_BY_METHOD = Object.freeze({
  OFFICIAL_API_CURRENT_STATE: 'CURRENT_STATE',
  OPERATOR_UI_PROJECT_LINK: 'OPERATOR_PROJECT_LINK',
  FRESH_SAME_PRINCIPAL_MUTATION_PROVENANCE: 'FRESH_OPERATION_PROVENANCE',
  LOCAL_CRYPTOGRAPHIC_BINDING: 'LOCAL_CRYPTOGRAPHIC_BINDING'
});
const REQUIRED_METHOD_BY_REQUIREMENT = Object.freeze({
  target_personal_synthetic_non_company: 'LOCAL_CRYPTOGRAPHIC_BINDING',
  target_intended_bound_sandbox: 'LOCAL_CRYPTOGRAPHIC_BINDING',
  automation_off: 'LOCAL_CRYPTOGRAPHIC_BINDING',
  test_mode_true_where_applicable: 'LOCAL_CRYPTOGRAPHIC_BINDING',
  oauth_client_standard_cloud_project_equality: 'OPERATOR_UI_PROJECT_LINK',
  apps_script_api_project_enablement: 'OFFICIAL_API_CURRENT_STATE',
  oauth_audience_client_equality: 'OFFICIAL_API_CURRENT_STATE',
  required_scope_coverage: 'OFFICIAL_API_CURRENT_STATE',
  token_validity_threshold: 'OFFICIAL_API_CURRENT_STATE',
  oauth_principal_myself_identity_equality:
    'FRESH_SAME_PRINCIPAL_MUTATION_PROVENANCE',
  immutable_api_executable_deployment_binding:
    'FRESH_SAME_PRINCIPAL_MUTATION_PROVENANCE',
  execution_target_is_api_executable_deployment_id:
    'FRESH_SAME_PRINCIPAL_MUTATION_PROVENANCE',
  execution_api_target_semantics: 'LOCAL_CRYPTOGRAPHIC_BINDING',
  function_and_version_lineage: 'FRESH_SAME_PRINCIPAL_MUTATION_PROVENANCE',
  script_project_ownership_evidence: 'OFFICIAL_API_CURRENT_STATE',
  bound_container_ownership_evidence: 'OFFICIAL_API_CURRENT_STATE',
  cross_domain_transfer_shared_drive_absent: 'OFFICIAL_API_CURRENT_STATE',
  prior_attempt_markers_preserved: 'LOCAL_CRYPTOGRAPHIC_BINDING'
});
const REQUIRED_BINDING_BY_REQUIREMENT = Object.freeze({
  target_personal_synthetic_non_company: 'target_attestation_sha256',
  target_intended_bound_sandbox: 'target_attestation_sha256',
  automation_off: 'target_attestation_sha256',
  test_mode_true_where_applicable: 'target_attestation_sha256',
  oauth_client_standard_cloud_project_equality: 'operator_project_link_sha256',
  apps_script_api_project_enablement: 'oauth_current_state_sha256',
  oauth_audience_client_equality: 'oauth_current_state_sha256',
  required_scope_coverage: 'oauth_current_state_sha256',
  token_validity_threshold: 'oauth_current_state_sha256',
  oauth_principal_myself_identity_equality: 'fresh_provenance_sha256',
  immutable_api_executable_deployment_binding: 'fresh_provenance_sha256',
  execution_target_is_api_executable_deployment_id: 'fresh_provenance_sha256',
  execution_api_target_semantics: 'transport_semantics_sha256',
  function_and_version_lineage: 'fresh_provenance_sha256',
  script_project_ownership_evidence: 'ownership_current_state_sha256',
  bound_container_ownership_evidence: 'ownership_current_state_sha256',
  cross_domain_transfer_shared_drive_absent: 'ownership_current_state_sha256',
  prior_attempt_markers_preserved: 'prior_markers_sha256'
});
const BINDING_KEYS = Object.freeze([
  'target_attestation_sha256',
  'oauth_current_state_sha256',
  'transport_semantics_sha256',
  'oauth_client_project_number_sha256',
  'operator_ui_project_number_sha256',
  'operator_project_link_sha256',
  'verified_principal_sha256',
  'script_ownership_snapshot_sha256',
  'bound_container_ownership_snapshot_sha256',
  'parent_binding_sha256',
  'ownership_current_state_sha256',
  'mutation_marker_sha256',
  'deployment_identifier_sha256',
  'deployment_response_sha256',
  'deployment_reconciliation_sha256',
  'fresh_provenance_sha256',
  'prior_markers_sha256',
  'immutable_version_number'
]);
const RECORD_KEYS = Object.freeze([
  'requirement_key', 'evidence_status', 'verification_method', 'sequence',
  'evidence_fingerprint', 'binding_fingerprint', 'source_category', 'phase',
  'operator_evidence_consumed', 'raw_value_retained', 'checks'
]);
const CHECK_KEYS = Object.freeze([
  'cryptographic_equality', 'current_state_verified',
  'current_ownership_checks_complete', 'verified_principal_matches_operation',
  'deployment_after_ownership_checks', 'fresh_operation', 'stale_provenance',
  'immutable_version', 'api_executable_myself', 'shared_drive_absent',
  'pending_owner_absent', 'historical_transfer_proof_required'
]);
const OPTIONAL_BOOLEAN_CHECK_KEYS = Object.freeze([
  'script_file_owned_by_principal', 'bound_container_file_owned_by_principal',
  'single_current_owner_each_file', 'owner_domain_equal',
  'parent_binding_equal', 'permission_enumeration_complete',
  'script_drive_id_absent', 'bound_container_drive_id_absent',
  'script_owned_by_me', 'bound_container_owned_by_me',
  'script_single_current_owner', 'bound_container_single_current_owner',
  'script_current_owner_principal_equal',
  'bound_container_current_owner_principal_equal',
  'script_owner_domain_equal', 'bound_container_owner_domain_equal',
  'script_permission_enumeration_complete',
  'bound_container_permission_enumeration_complete',
  'script_shared_drive_absent', 'bound_container_shared_drive_absent',
  'script_pending_owner_absent', 'bound_container_pending_owner_absent',
  'mutation_marker_before_request', 'exactly_one_immutable_version',
  'exactly_one_myself_deployment', 'deployment_response_reconciled',
  'read_only_reconciliation_exact'
]);
const OPTIONAL_INTEGER_CHECK_KEYS = Object.freeze(['immutable_version_number']);
const OWNERSHIP_REQUIREMENTS = Object.freeze([
  'script_project_ownership_evidence',
  'bound_container_ownership_evidence',
  'cross_domain_transfer_shared_drive_absent'
]);
const OWNERSHIP_DETAIL_CHECKS = Object.freeze([
  'script_drive_id_absent', 'bound_container_drive_id_absent',
  'script_owned_by_me', 'bound_container_owned_by_me',
  'script_single_current_owner', 'bound_container_single_current_owner',
  'script_current_owner_principal_equal',
  'bound_container_current_owner_principal_equal',
  'script_owner_domain_equal', 'bound_container_owner_domain_equal',
  'parent_binding_equal', 'script_permission_enumeration_complete',
  'bound_container_permission_enumeration_complete',
  'script_shared_drive_absent', 'bound_container_shared_drive_absent',
  'script_pending_owner_absent', 'bound_container_pending_owner_absent'
]);

function assertPlainObject(value, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(code);
  }
}

function assertExactKeys(value, allowedKeys, code) {
  assertPlainObject(value, code);
  const actual = Object.keys(value);
  if (actual.length !== allowedKeys.length || actual.some((key) => !allowedKeys.includes(key))) {
    throw new Error(code);
  }
}

function assertFingerprint(value) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) {
    throw new Error('STAGE_A_BRIDGE_FINGERPRINT_INVALID');
  }
}

function hashCanonical(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function assertBindings(bindings) {
  assertExactKeys(bindings, BINDING_KEYS, 'STAGE_A_BRIDGE_BINDINGS_INVALID');
  BINDING_KEYS.filter((key) => key !== 'immutable_version_number').forEach((key) => {
    assertFingerprint(bindings[key]);
  });
  if (!Number.isSafeInteger(bindings.immutable_version_number) || bindings.immutable_version_number < 1) {
    throw new Error('STAGE_A_BRIDGE_BINDINGS_INVALID');
  }
  if (bindings.oauth_client_project_number_sha256 !== bindings.operator_ui_project_number_sha256) {
    throw new Error('STAGE_A_BRIDGE_OPERATOR_PROJECT_FINGERPRINT_MISMATCH');
  }
  const expectedProjectLink = hashCanonical({
    oauth_client_project_number_sha256: bindings.oauth_client_project_number_sha256,
    operator_ui_project_number_sha256: bindings.operator_ui_project_number_sha256
  });
  if (bindings.operator_project_link_sha256 !== expectedProjectLink) {
    throw new Error('STAGE_A_BRIDGE_OPERATOR_PROJECT_BINDING_INVALID');
  }
  const expectedOwnership = hashCanonical({
    verified_principal_sha256: bindings.verified_principal_sha256,
    script_ownership_snapshot_sha256: bindings.script_ownership_snapshot_sha256,
    bound_container_ownership_snapshot_sha256: bindings.bound_container_ownership_snapshot_sha256,
    parent_binding_sha256: bindings.parent_binding_sha256
  });
  if (bindings.ownership_current_state_sha256 !== expectedOwnership) {
    throw new Error('STAGE_A_BRIDGE_OWNERSHIP_BINDING_INVALID');
  }
  const expectedFreshProvenance = hashCanonical({
    verified_principal_sha256: bindings.verified_principal_sha256,
    ownership_current_state_sha256: bindings.ownership_current_state_sha256,
    mutation_marker_sha256: bindings.mutation_marker_sha256,
    deployment_identifier_sha256: bindings.deployment_identifier_sha256,
    deployment_response_sha256: bindings.deployment_response_sha256,
    deployment_reconciliation_sha256: bindings.deployment_reconciliation_sha256,
    immutable_version_number: bindings.immutable_version_number
  });
  if (bindings.fresh_provenance_sha256 !== expectedFreshProvenance) {
    throw new Error('STAGE_A_BRIDGE_FRESH_PROVENANCE_BINDING_INVALID');
  }
  return Object.freeze({ ...bindings });
}

function assertChecks(checks) {
  assertPlainObject(checks, 'STAGE_A_BRIDGE_CHECKS_INVALID');
  const actualKeys = Object.keys(checks);
  if (CHECK_KEYS.some((key) => !Object.prototype.hasOwnProperty.call(checks, key)) ||
      actualKeys.some((key) => !CHECK_KEYS.includes(key) &&
        !OPTIONAL_BOOLEAN_CHECK_KEYS.includes(key) &&
        !OPTIONAL_INTEGER_CHECK_KEYS.includes(key))) {
    throw new Error('STAGE_A_BRIDGE_CHECKS_INVALID');
  }
  CHECK_KEYS.forEach((key) => {
    if (typeof checks[key] !== 'boolean') {
      throw new Error('STAGE_A_BRIDGE_CHECKS_INVALID');
    }
  });
  OPTIONAL_BOOLEAN_CHECK_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(checks, key) && typeof checks[key] !== 'boolean') {
      throw new Error('STAGE_A_BRIDGE_CHECKS_INVALID');
    }
  });
  if (Object.prototype.hasOwnProperty.call(checks, 'immutable_version_number') &&
      (!Number.isSafeInteger(checks.immutable_version_number) || checks.immutable_version_number < 1)) {
    throw new Error('STAGE_A_BRIDGE_CHECKS_INVALID');
  }
}

function requireTrue(checks, keys, code) {
  if (keys.some((key) => checks[key] !== true)) {
    throw new Error(code);
  }
}

function assertMethodSpecificChecks(record, bindings) {
  const { verification_method: method, checks } = record;
  if (method === 'OFFICIAL_API_CURRENT_STATE') {
    requireTrue(checks, [
      'cryptographic_equality', 'current_state_verified', 'shared_drive_absent',
      'pending_owner_absent'
    ], 'STAGE_A_BRIDGE_CURRENT_STATE_NOT_DIRECT');
    if (OWNERSHIP_REQUIREMENTS.includes(record.requirement_key)) {
      requireTrue(checks, [
        'current_ownership_checks_complete', ...OWNERSHIP_DETAIL_CHECKS
      ], 'STAGE_A_BRIDGE_CURRENT_STATE_NOT_DIRECT');
    }
  } else if (method === 'OPERATOR_UI_PROJECT_LINK') {
    if (!record.operator_evidence_consumed || !checks.cryptographic_equality ||
        record.evidence_fingerprint !== bindings.operator_project_link_sha256) {
      throw new Error('STAGE_A_BRIDGE_OPERATOR_UI_MATCH_REQUIRED');
    }
  } else if (method === 'FRESH_SAME_PRINCIPAL_MUTATION_PROVENANCE') {
    requireTrue(checks, [
      'cryptographic_equality', 'current_ownership_checks_complete',
      'verified_principal_matches_operation', 'deployment_after_ownership_checks',
      'fresh_operation', 'immutable_version', 'api_executable_myself',
      'shared_drive_absent', 'pending_owner_absent',
      'mutation_marker_before_request', 'exactly_one_immutable_version',
      'exactly_one_myself_deployment', 'deployment_response_reconciled',
      'read_only_reconciliation_exact'
    ], 'STAGE_A_BRIDGE_FRESH_PROVENANCE_INVALID');
    if (checks.stale_provenance || checks.historical_transfer_proof_required ||
        checks.immutable_version_number !== bindings.immutable_version_number ||
        record.evidence_fingerprint !== bindings.deployment_reconciliation_sha256) {
      throw new Error('STAGE_A_BRIDGE_FRESH_PROVENANCE_INVALID');
    }
  } else if (method === 'LOCAL_CRYPTOGRAPHIC_BINDING' && !checks.cryptographic_equality) {
    throw new Error('STAGE_A_BRIDGE_LOCAL_BINDING_REQUIRED');
  }
}

function normalizeRecord(record, bindings) {
  assertExactKeys(record, RECORD_KEYS, 'STAGE_A_BRIDGE_RECORD_FIELDS_INVALID');
  if (!STAGE_A_REQUIREMENTS.includes(record.requirement_key) ||
      !EVIDENCE_STATUSES.includes(record.evidence_status) ||
      !Number.isInteger(record.sequence) || record.sequence < 1 ||
      typeof record.operator_evidence_consumed !== 'boolean' ||
      record.raw_value_retained !== false) {
    throw new Error('STAGE_A_BRIDGE_RECORD_INVALID');
  }
  assertFingerprint(record.evidence_fingerprint);
  assertFingerprint(record.binding_fingerprint);
  assertChecks(record.checks);

  const isDirect = record.evidence_status === 'DIRECTLY_VERIFIED';
  if (!isDirect) {
    if (record.verification_method !== null ||
        record.source_category !== 'SYNTHETIC_UNRESOLVED' ||
        record.phase !== 'NOT_VERIFIED' || record.operator_evidence_consumed) {
      throw new Error('STAGE_A_BRIDGE_NON_DIRECT_RECORD_INVALID');
    }
  } else {
    const requiredMethod = REQUIRED_METHOD_BY_REQUIREMENT[record.requirement_key];
    const bindingKey = REQUIRED_BINDING_BY_REQUIREMENT[record.requirement_key];
    if (record.verification_method !== requiredMethod ||
        record.source_category !== SOURCE_BY_METHOD[requiredMethod] ||
        record.phase !== PHASE_BY_METHOD[requiredMethod]) {
      throw new Error('STAGE_A_BRIDGE_DIRECT_METHOD_INVALID');
    }
    if (record.binding_fingerprint !== bindings[bindingKey]) {
      throw new Error('STAGE_A_BRIDGE_REQUIREMENT_BINDING_INVALID');
    }
    if ((record.verification_method === 'OPERATOR_UI_PROJECT_LINK') !==
        record.operator_evidence_consumed) {
      throw new Error('STAGE_A_BRIDGE_OPERATOR_EVIDENCE_SCOPE_INVALID');
    }
    assertMethodSpecificChecks(record, bindings);
  }
  return Object.freeze({ ...record, checks: Object.freeze({ ...record.checks }) });
}

function normalizeEvidenceBridge(input) {
  assertExactKeys(input, ['schema_id', 'bindings', 'records'], 'STAGE_A_BRIDGE_ENVELOPE_INVALID');
  if (input.schema_id !== SCHEMA_ID || !Array.isArray(input.records) ||
      input.records.length !== STAGE_A_REQUIREMENTS.length) {
    throw new Error('STAGE_A_BRIDGE_ENVELOPE_INVALID');
  }
  const bindings = assertBindings(input.bindings);
  const records = input.records.map((record) => normalizeRecord(record, bindings));
  const keys = records.map((record) => record.requirement_key);
  const sequences = records.map((record) => record.sequence);
  if (new Set(keys).size !== STAGE_A_REQUIREMENTS.length ||
      STAGE_A_REQUIREMENTS.some((key) => !keys.includes(key)) ||
      new Set(sequences).size !== sequences.length) {
    throw new Error('STAGE_A_BRIDGE_REQUIREMENTS_OR_SEQUENCE_INVALID');
  }
  const ownershipSequences = OWNERSHIP_REQUIREMENTS.map((key) =>
    records.find((record) => record.requirement_key === key).sequence
  );
  const latestOwnershipSequence = Math.max(...ownershipSequences);
  records.filter((record) =>
    record.verification_method === 'FRESH_SAME_PRINCIPAL_MUTATION_PROVENANCE'
  ).forEach((record) => {
    if (record.sequence <= latestOwnershipSequence) {
      throw new Error('STAGE_A_BRIDGE_DEPLOYMENT_ORDER_INVALID');
    }
  });
  return Object.freeze({ schema_id: SCHEMA_ID, bindings, records: Object.freeze(records) });
}

function createSnapshotFingerprint(records, bindings) {
  const canonical = {
    bindings,
    records: records.map((record) => ({
      requirement_key: record.requirement_key,
      evidence_status: record.evidence_status,
      verification_method: record.verification_method,
      sequence: record.sequence,
      evidence_fingerprint: record.evidence_fingerprint,
      binding_fingerprint: record.binding_fingerprint,
      source_category: record.source_category,
      phase: record.phase,
      operator_evidence_consumed: record.operator_evidence_consumed,
      raw_value_retained: false,
      checks: record.checks
    })).sort((left, right) => left.requirement_key.localeCompare(right.requirement_key))
  };
  return hashCanonical(canonical);
}

function constructAllDirectStageASnapshot(input) {
  const normalized = normalizeEvidenceBridge(input);
  if (normalized.records.some((record) => record.evidence_status !== 'DIRECTLY_VERIFIED')) {
    throw new Error('STAGE_A_BRIDGE_ALL_DIRECT_REQUIRED');
  }
  return Object.freeze({
    contract_version: SCHEMA_ID,
    outcome: 'STAGE_A_EVIDENCE_BRIDGE_SYNTHETIC_SNAPSHOT_READY_ONLY',
    snapshot_sha256: createSnapshotFingerprint(normalized.records, normalized.bindings),
    direct_requirement_count: STAGE_A_REQUIREMENTS.length,
    operator_evidence_consumed: normalized.records.some((record) => record.operator_evidence_consumed),
    stage_b_authorized: false,
    stage_b_attempt: 'NOT_STARTED',
    scripts_run: 'NOT_EXECUTED',
    clasp_run_function: 'NOT_EXECUTED',
    function_invocation: 'NOT_EXECUTED',
    remote_call_performed: false
  });
}

module.exports = Object.freeze({
  SCHEMA_ID,
  EVIDENCE_STATUSES,
  VERIFICATION_METHODS,
  STAGE_A_REQUIREMENTS,
  normalizeEvidenceBridge,
  createSnapshotFingerprint,
  constructAllDirectStageASnapshot
});
