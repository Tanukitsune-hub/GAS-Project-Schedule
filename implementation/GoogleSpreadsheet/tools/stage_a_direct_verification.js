'use strict';

const EVIDENCE_STATUSES = Object.freeze([
  'DIRECTLY_VERIFIED',
  'LOCALLY_ATTESTED',
  'INFERRED',
  'UNKNOWN_NOT_EXPOSED',
  'CONTRADICTED'
]);

const STAGE_A0_REQUIREMENTS = Object.freeze([
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

function assertPlainObject(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(message);
  }
}

function normalizeEvidence(evidence) {
  const input = evidence === undefined ? {} : evidence;
  assertPlainObject(input, 'STAGE_A0_EVIDENCE_MUST_BE_AN_OBJECT');

  Object.keys(input).forEach((key) => {
    if (!STAGE_A0_REQUIREMENTS.includes(key)) {
      throw new Error('STAGE_A0_UNKNOWN_REQUIREMENT');
    }
  });

  return STAGE_A0_REQUIREMENTS.reduce((normalized, key) => {
    const status = Object.prototype.hasOwnProperty.call(input, key)
      ? input[key]
      : 'UNKNOWN_NOT_EXPOSED';
    if (!EVIDENCE_STATUSES.includes(status)) {
      throw new Error('STAGE_A0_INVALID_STATUS');
    }
    normalized[key] = status;
    return normalized;
  }, {});
}

function countStatuses(normalizedEvidence) {
  const counts = EVIDENCE_STATUSES.reduce((result, status) => {
    result[status] = 0;
    return result;
  }, {});
  Object.values(normalizedEvidence).forEach((status) => {
    counts[status] += 1;
  });
  return counts;
}

function decideStageA0(evidence) {
  const normalizedEvidence = normalizeEvidence(evidence);
  const status_counts = countStatuses(normalizedEvidence);
  let outcome = 'STAGE_A_BLOCKED_NEEDS_OPERATOR_OR_PLATFORM_EVIDENCE';
  if (status_counts.CONTRADICTED > 0) {
    outcome = 'STAGE_A_FAILED_CLOSED';
  } else if (status_counts.DIRECTLY_VERIFIED === STAGE_A0_REQUIREMENTS.length) {
    outcome = 'STAGE_A0_DIRECT_VERIFICATION_PASS';
  }

  return Object.freeze({
    contract_version: 'GAS_STAGE_A_DIRECT_VERIFICATION_V1',
    outcome,
    status_counts: Object.freeze(status_counts),
    scripts_run: 'NOT_EXECUTED',
    clasp_run_function: 'NOT_EXECUTED',
    remote_call_performed: false,
    target_mutation_performed: false,
    probe_staging: 'NOT_EXECUTED',
    deployment_creation: 'NOT_EXECUTED',
    stage_b_attempt: 'NOT_STARTED',
    function_invocation: 'NOT_EXECUTED'
  });
}

module.exports = Object.freeze({
  EVIDENCE_STATUSES,
  STAGE_A0_REQUIREMENTS,
  normalizeEvidence,
  countStatuses,
  decideStageA0
});
