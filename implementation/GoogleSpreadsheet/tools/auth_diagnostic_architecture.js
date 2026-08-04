'use strict';

const crypto = require('node:crypto');

const EXECUTION_NOT_AUTHORIZED = 'AUTH_DIAGNOSTIC_EXECUTION_NOT_AUTHORIZED';
const ARCHITECTURE_CONTRACT_VERSION = 'AUTH_DIAGNOSTIC_ARCHITECTURE_V2';
const STAGE_B_MARKER_CONTRACT_VERSION = 'AUTH_DIAGNOSTIC_STAGE_B_MARKER_V2';
const SAFE_RESPONSE_CONTRACT_VERSION = 'AUTH_DIAGNOSTIC_SAFE_RESPONSE_V2';

const SELECTED_TRANSPORT = 'DIRECT_REST_SCRIPTS_RUN';
const REJECTED_TRANSPORT = 'CLASP_3_3_0_RUN_FUNCTION';
const SELECTED_PROBE = 'IGNORED_RUNTIME_OVERLAY_CONSTANT_AUTHORIZATION_PROBE';
const REJECTED_PROBE = 'RUN_QUICK_DIAGNOSTIC';

const STAGE_A_EVIDENCE_STATUSES = Object.freeze([
  'DIRECTLY_VERIFIED',
  'LOCALLY_ATTESTED',
  'INFERRED',
  'UNKNOWN_NOT_EXPOSED',
  'CONTRADICTED'
]);

const STAGE_A_REQUIREMENTS = Object.freeze([
  Object.freeze({ key: 'oauth_client_standard_cloud_project_equality' }),
  Object.freeze({ key: 'apps_script_api_project_enablement' }),
  Object.freeze({ key: 'oauth_audience_client_equality' }),
  Object.freeze({ key: 'required_scope_coverage' }),
  Object.freeze({ key: 'token_validity_threshold' }),
  Object.freeze({ key: 'oauth_principal_myself_identity_equality' }),
  Object.freeze({ key: 'immutable_api_executable_deployment_binding' }),
  Object.freeze({ key: 'execution_target_is_api_executable_deployment_id' }),
  Object.freeze({ key: 'execution_api_target_semantics' }),
  Object.freeze({ key: 'function_and_version_lineage' }),
  Object.freeze({ key: 'script_project_ownership_evidence' }),
  Object.freeze({ key: 'bound_container_ownership_evidence' }),
  Object.freeze({ key: 'cross_domain_transfer_shared_drive_absent' }),
  Object.freeze({ key: 'prior_attempt_markers_preserved' })
]);

const STAGE_A_REASONS = Object.freeze([
  'AUTH_DIAGNOSTIC_PREFLIGHT_PROJECT_MISMATCH',
  'AUTH_DIAGNOSTIC_PREFLIGHT_PRINCIPAL_MISMATCH',
  'AUTH_DIAGNOSTIC_PREFLIGHT_OWNERSHIP_INCONCLUSIVE',
  'AUTH_DIAGNOSTIC_TOKEN_INVALID_OR_EXPIRED',
  'AUTH_DIAGNOSTIC_COMMON_CLOUD_PROJECT_REJECTED',
  'AUTH_DIAGNOSTIC_PREFLIGHT_DEPLOYMENT_TARGET_INVALID',
  'AUTH_DIAGNOSTIC_UNKNOWN_FAILED_CLOSED'
]);

const SAFE_RESPONSE_REASONS = Object.freeze([
  'AUTH_DIAGNOSTIC_CALLER_NOT_PERMITTED',
  'AUTH_DIAGNOSTIC_DEPLOYMENT_NOT_FOUND',
  'AUTH_DIAGNOSTIC_SCRIPT_NOT_STARTED',
  'AUTH_DIAGNOSTIC_SCRIPT_RUNTIME_ERROR',
  'AUTH_DIAGNOSTIC_PROBE_PASS_NOT_FUNCTIONAL_ACCEPTANCE',
  'AUTH_DIAGNOSTIC_UNKNOWN_FAILED_CLOSED'
]);

const STAGE_B_MARKER_KEYS = Object.freeze([
  'contract_version',
  'authorization_state',
  'separately_authorized_work_marker',
  'work_marker_sha256',
  'stage_a_preflight',
  'stage_a_preflight_sha256',
  'attempt_state',
  'invocation_count',
  'target_kind',
  'deployment_binding_sha256',
  'transport',
  'probe_function',
  'execution_api_access',
  'head_fallback_allowed',
  'target_fallback_allowed',
  'function_fallback_allowed',
  'follow_up_run_quick_diagnostic_allowed',
  'retry_permitted',
  'prior_attempt_markers_preserved'
]);

const SAFE_RESPONSE_KEYS = Object.freeze([
  'contract_version',
  'attempt_state',
  'http_status',
  'google_api_status',
  'normalized_reason',
  'operation_object_returned',
  'script_started',
  'probe_contract_returned',
  'all_side_effects_false',
  'response_sha256',
  'elapsed_time_bucket',
  'retry_permitted'
]);

const GOOGLE_API_STATUSES = Object.freeze([
  'NO_RESPONSE',
  'OK',
  'UNAUTHENTICATED',
  'PERMISSION_DENIED',
  'NOT_FOUND',
  'INTERNAL',
  'UNKNOWN'
]);

const ELAPSED_TIME_BUCKETS = Object.freeze([
  'LT_1S',
  'ONE_TO_FIVE_S',
  'GT_FIVE_S',
  'UNKNOWN'
]);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertOnlyKeys(value, allowedKeys, errorCode) {
  if (!isRecord(value) || Object.keys(value).some((key) => !allowedKeys.has(key))) {
    throw new Error(errorCode);
  }
}

function assertExactKeys(value, expectedKeys, errorCode) {
  assertOnlyKeys(value, new Set(expectedKeys), errorCode);
  if (Object.keys(value).length !== expectedKeys.length ||
      expectedKeys.some((key) => !Object.prototype.hasOwnProperty.call(value, key))) {
    throw new Error(errorCode);
  }
}

function normalizeStageAEvidence(input = {}) {
  const requirementKeys = new Set(STAGE_A_REQUIREMENTS.map((item) => item.key));
  assertOnlyKeys(input, requirementKeys, 'AUTH_DIAGNOSTIC_STAGE_A_FIELD_NOT_ALLOWED');

  const evidence = {};
  STAGE_A_REQUIREMENTS.forEach(({ key }) => {
    const status = Object.prototype.hasOwnProperty.call(input, key)
      ? input[key]
      : 'UNKNOWN_NOT_EXPOSED';
    if (!STAGE_A_EVIDENCE_STATUSES.includes(status)) {
      throw new Error('AUTH_DIAGNOSTIC_STAGE_A_STATUS_INVALID');
    }
    evidence[key] = status;
  });
  return Object.freeze(evidence);
}

function fingerprintStageAPreflight(evidence) {
  const normalized = normalizeStageAEvidence(evidence);
  const canonical = JSON.stringify(
    STAGE_A_REQUIREMENTS.map(({ key }) => [key, normalized[key]])
  );
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

function buildStageAResult(evidence, preflightState, normalizedReason) {
  return Object.freeze({
    contract_version: ARCHITECTURE_CONTRACT_VERSION,
    stage: 'STAGE_A_NO_CALL_PREFLIGHT',
    preflight_state: preflightState,
    normalized_reason: normalizedReason,
    call_authorized: false,
    remote_call_performed: false,
    diagnostic_execution: EXECUTION_NOT_AUTHORIZED,
    evidence
  });
}

function classifyStageAPreflight(input) {
  const evidence = normalizeStageAEvidence(input);
  const ownershipIsNotDirectlyVerified =
    evidence.script_project_ownership_evidence !== 'DIRECTLY_VERIFIED' ||
    evidence.bound_container_ownership_evidence !== 'DIRECTLY_VERIFIED';
  const allDirectlyVerified = STAGE_A_REQUIREMENTS.every(
    ({ key }) => evidence[key] === 'DIRECTLY_VERIFIED'
  );

  if (evidence.oauth_client_standard_cloud_project_equality === 'CONTRADICTED' ||
      evidence.oauth_audience_client_equality === 'CONTRADICTED') {
    return buildStageAResult(
      evidence,
      'BLOCKED',
      'AUTH_DIAGNOSTIC_PREFLIGHT_PROJECT_MISMATCH'
    );
  }
  if (evidence.apps_script_api_project_enablement === 'CONTRADICTED') {
    return buildStageAResult(
      evidence,
      'BLOCKED',
      'AUTH_DIAGNOSTIC_COMMON_CLOUD_PROJECT_REJECTED'
    );
  }
  if (evidence.oauth_principal_myself_identity_equality === 'CONTRADICTED') {
    return buildStageAResult(
      evidence,
      'BLOCKED',
      'AUTH_DIAGNOSTIC_PREFLIGHT_PRINCIPAL_MISMATCH'
    );
  }
  if (evidence.token_validity_threshold === 'CONTRADICTED') {
    return buildStageAResult(
      evidence,
      'BLOCKED',
      'AUTH_DIAGNOSTIC_TOKEN_INVALID_OR_EXPIRED'
    );
  }
  if (evidence.execution_target_is_api_executable_deployment_id === 'CONTRADICTED' ||
      evidence.execution_api_target_semantics === 'CONTRADICTED') {
    return buildStageAResult(
      evidence,
      'BLOCKED',
      'AUTH_DIAGNOSTIC_PREFLIGHT_DEPLOYMENT_TARGET_INVALID'
    );
  }
  if (ownershipIsNotDirectlyVerified) {
    return buildStageAResult(
      evidence,
      'BLOCKED',
      'AUTH_DIAGNOSTIC_PREFLIGHT_OWNERSHIP_INCONCLUSIVE'
    );
  }
  if (allDirectlyVerified) {
    return buildStageAResult(
      evidence,
      'PREPARED_FOR_LATER_AUTHORIZATION',
      'PREPARED_FOR_LATER_AUTHORIZATION'
    );
  }
  return buildStageAResult(
    evidence,
    'BLOCKED',
    'AUTH_DIAGNOSTIC_UNKNOWN_FAILED_CLOSED'
  );
}

function normalizeStageBMarker(input) {
  assertExactKeys(
    input,
    STAGE_B_MARKER_KEYS,
    'AUTH_DIAGNOSTIC_STAGE_B_MARKER_INVALID'
  );
  if (input.contract_version !== STAGE_B_MARKER_CONTRACT_VERSION ||
      !['NOT_AUTHORIZED', 'AUTHORIZED_BY_SEPARATE_WORK_ID'].includes(input.authorization_state) ||
      typeof input.separately_authorized_work_marker !== 'boolean' ||
      typeof input.work_marker_sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(input.work_marker_sha256) ||
      typeof input.stage_a_preflight_sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(input.stage_a_preflight_sha256) ||
      !['NOT_STARTED', 'ATTEMPT_STARTED', 'ATTEMPT_CLOSED'].includes(input.attempt_state) ||
      ![0, 1].includes(input.invocation_count) ||
      input.target_kind !== 'API_EXECUTABLE_DEPLOYMENT_ID' ||
      typeof input.deployment_binding_sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(input.deployment_binding_sha256) ||
      input.transport !== SELECTED_TRANSPORT ||
      input.probe_function !== SELECTED_PROBE ||
      input.execution_api_access !== 'MYSELF' ||
      input.head_fallback_allowed !== false ||
      input.target_fallback_allowed !== false ||
      input.function_fallback_allowed !== false ||
      input.follow_up_run_quick_diagnostic_allowed !== false ||
      input.retry_permitted !== false ||
      typeof input.prior_attempt_markers_preserved !== 'boolean') {
    throw new Error('AUTH_DIAGNOSTIC_STAGE_B_MARKER_INVALID');
  }
  const stageAPreflight = normalizeStageAEvidence(input.stage_a_preflight);
  if (!STAGE_A_REQUIREMENTS.every(
    ({ key }) => stageAPreflight[key] === 'DIRECTLY_VERIFIED'
  )) {
    throw new Error('AUTH_DIAGNOSTIC_STAGE_B_PREFLIGHT_NOT_DIRECTLY_VERIFIED');
  }
  if (input.stage_a_preflight_sha256 !== fingerprintStageAPreflight(stageAPreflight)) {
    throw new Error('AUTH_DIAGNOSTIC_STAGE_B_PREFLIGHT_FINGERPRINT_MISMATCH');
  }
  if (input.authorization_state === 'NOT_AUTHORIZED' &&
      (input.separately_authorized_work_marker ||
       input.attempt_state !== 'NOT_STARTED' ||
       input.invocation_count !== 0)) {
    throw new Error('AUTH_DIAGNOSTIC_STAGE_B_MARKER_INVALID');
  }
  if (input.authorization_state === 'AUTHORIZED_BY_SEPARATE_WORK_ID' &&
      !input.separately_authorized_work_marker) {
    throw new Error('AUTH_DIAGNOSTIC_STAGE_B_MARKER_INVALID');
  }
  if (input.attempt_state === 'NOT_STARTED' && input.invocation_count !== 0) {
    throw new Error('AUTH_DIAGNOSTIC_STAGE_B_MARKER_INVALID');
  }
  if (input.attempt_state !== 'NOT_STARTED' && input.invocation_count !== 1) {
    throw new Error('AUTH_DIAGNOSTIC_STAGE_B_MARKER_INVALID');
  }
  return Object.freeze({ ...input, stage_a_preflight: stageAPreflight });
}

function nextStageBMarker(marker, attemptState, invocationCount) {
  return normalizeStageBMarker({
    contract_version: marker.contract_version,
    authorization_state: marker.authorization_state,
    separately_authorized_work_marker: marker.separately_authorized_work_marker,
    work_marker_sha256: marker.work_marker_sha256,
    stage_a_preflight: marker.stage_a_preflight,
    stage_a_preflight_sha256: marker.stage_a_preflight_sha256,
    attempt_state: attemptState,
    invocation_count: invocationCount,
    target_kind: marker.target_kind,
    deployment_binding_sha256: marker.deployment_binding_sha256,
    transport: marker.transport,
    probe_function: marker.probe_function,
    execution_api_access: marker.execution_api_access,
    head_fallback_allowed: false,
    target_fallback_allowed: false,
    function_fallback_allowed: false,
    follow_up_run_quick_diagnostic_allowed: false,
    retry_permitted: false,
    prior_attempt_markers_preserved: marker.prior_attempt_markers_preserved
  });
}

function planStageBAttempt(input) {
  const marker = normalizeStageBMarker(input);
  if (!marker.prior_attempt_markers_preserved) {
    return Object.freeze({
      decision: 'AUTH_DIAGNOSTIC_PRIOR_MARKERS_NOT_PRESERVED',
      call_authorized: false,
      remote_call_performed: false,
      retry_permitted: false,
      diagnostic_execution: EXECUTION_NOT_AUTHORIZED
    });
  }
  if (marker.authorization_state !== 'AUTHORIZED_BY_SEPARATE_WORK_ID' ||
      !marker.separately_authorized_work_marker) {
    return Object.freeze({
      decision: EXECUTION_NOT_AUTHORIZED,
      call_authorized: false,
      remote_call_performed: false,
      retry_permitted: false,
      diagnostic_execution: EXECUTION_NOT_AUTHORIZED
    });
  }
  if (marker.attempt_state !== 'NOT_STARTED' || marker.invocation_count !== 0) {
    return Object.freeze({
      decision: 'AUTH_DIAGNOSTIC_ATTEMPT_ALREADY_CONSUMED',
      call_authorized: false,
      remote_call_performed: false,
      retry_permitted: false,
      diagnostic_execution: EXECUTION_NOT_AUTHORIZED
    });
  }
  return Object.freeze({
    decision: 'MARK_ATTEMPT_STARTED_BEFORE_REMOTE_CALL',
    call_authorized: false,
    remote_call_performed: false,
    retry_permitted: false,
    follow_up_call_planned: false,
    diagnostic_execution: EXECUTION_NOT_AUTHORIZED,
    next_marker: nextStageBMarker(marker, 'ATTEMPT_STARTED', 1)
  });
}

function closeStageBAttempt(input) {
  const marker = normalizeStageBMarker(input);
  if (marker.attempt_state !== 'ATTEMPT_STARTED' || marker.invocation_count !== 1) {
    throw new Error('AUTH_DIAGNOSTIC_ATTEMPT_NOT_STARTED');
  }
  return Object.freeze({
    decision: 'MARK_ATTEMPT_CLOSED_NO_RETRY',
    remote_call_performed: false,
    retry_permitted: false,
    follow_up_call_planned: false,
    diagnostic_execution: EXECUTION_NOT_AUTHORIZED,
    next_marker: nextStageBMarker(marker, 'ATTEMPT_CLOSED', 1)
  });
}

function normalizeSafeResponse(input) {
  assertExactKeys(
    input,
    SAFE_RESPONSE_KEYS,
    'AUTH_DIAGNOSTIC_RESPONSE_FIELD_NOT_ALLOWED'
  );
  if (input.contract_version !== SAFE_RESPONSE_CONTRACT_VERSION ||
      input.attempt_state !== 'ATTEMPT_CLOSED' ||
      !Number.isInteger(input.http_status) ||
      input.http_status < 0 ||
      input.http_status > 599 ||
      !GOOGLE_API_STATUSES.includes(input.google_api_status) ||
      !SAFE_RESPONSE_REASONS.includes(input.normalized_reason) ||
      typeof input.operation_object_returned !== 'boolean' ||
      typeof input.script_started !== 'boolean' ||
      typeof input.probe_contract_returned !== 'boolean' ||
      typeof input.all_side_effects_false !== 'boolean' ||
      typeof input.response_sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(input.response_sha256) ||
      !ELAPSED_TIME_BUCKETS.includes(input.elapsed_time_bucket) ||
      input.retry_permitted !== false) {
    throw new Error('AUTH_DIAGNOSTIC_RESPONSE_INVALID');
  }
  return Object.freeze({ ...input });
}

function deriveSafeResponseReason(response) {
  if ([401, 403].includes(response.http_status) ||
      ['UNAUTHENTICATED', 'PERMISSION_DENIED'].includes(response.google_api_status)) {
    return 'AUTH_DIAGNOSTIC_CALLER_NOT_PERMITTED';
  }
  if (response.http_status === 404 || response.google_api_status === 'NOT_FOUND') {
    return 'AUTH_DIAGNOSTIC_DEPLOYMENT_NOT_FOUND';
  }
  if (response.http_status === 0 ||
      ['NO_RESPONSE', 'UNKNOWN'].includes(response.google_api_status)) {
    return 'AUTH_DIAGNOSTIC_UNKNOWN_FAILED_CLOSED';
  }
  if (!response.script_started) {
    return 'AUTH_DIAGNOSTIC_SCRIPT_NOT_STARTED';
  }
  if (response.http_status >= 500 ||
      response.google_api_status === 'INTERNAL' ||
      !response.operation_object_returned ||
      !response.probe_contract_returned ||
      !response.all_side_effects_false) {
    return 'AUTH_DIAGNOSTIC_SCRIPT_RUNTIME_ERROR';
  }
  if (response.http_status >= 200 &&
      response.http_status < 300 &&
      response.google_api_status === 'OK' &&
      response.operation_object_returned &&
      response.script_started &&
      response.probe_contract_returned &&
      response.all_side_effects_false) {
    return 'AUTH_DIAGNOSTIC_PROBE_PASS_NOT_FUNCTIONAL_ACCEPTANCE';
  }
  return 'AUTH_DIAGNOSTIC_UNKNOWN_FAILED_CLOSED';
}

function classifySafeResponse(input) {
  const response = normalizeSafeResponse(input);
  const derivedReason = deriveSafeResponseReason(response);
  if (response.normalized_reason !== derivedReason) {
    throw new Error('AUTH_DIAGNOSTIC_RESPONSE_CLASSIFICATION_INCONSISTENT');
  }
  return response;
}

module.exports = {
  EXECUTION_NOT_AUTHORIZED,
  ARCHITECTURE_CONTRACT_VERSION,
  STAGE_B_MARKER_CONTRACT_VERSION,
  SAFE_RESPONSE_CONTRACT_VERSION,
  SELECTED_TRANSPORT,
  REJECTED_TRANSPORT,
  SELECTED_PROBE,
  REJECTED_PROBE,
  STAGE_A_EVIDENCE_STATUSES,
  STAGE_A_REQUIREMENTS,
  STAGE_A_REASONS,
  SAFE_RESPONSE_REASONS,
  STAGE_B_MARKER_KEYS,
  SAFE_RESPONSE_KEYS,
  normalizeStageAEvidence,
  fingerprintStageAPreflight,
  classifyStageAPreflight,
  normalizeStageBMarker,
  planStageBAttempt,
  closeStageBAttempt,
  normalizeSafeResponse,
  classifySafeResponse
};
