'use strict';

const EXECUTION_NOT_AUTHORIZED =
  'AUTH_DIAGNOSTIC_EXECUTION_NOT_AUTHORIZED';
const EVIDENCE_SCHEMA_ID =
  'WORK_OS_REMOTE_ONLY_AUTH_DIAGNOSTIC_EVIDENCE_V1';
const EVIDENCE_SOURCE_BOUNDARY = 'TRACKED_REPOSITORY_EVIDENCE_ONLY';
const MARKER_SCHEMA_ID = 'WORK_OS_AUTH_DIAGNOSTIC_ONE_USE_MARKER_V1';

const EVIDENCE_STATUSES = Object.freeze([
  'LOCALLY_ATTESTED',
  'INFERRED',
  'UNKNOWN_NOT_EXPOSED'
]);

const REQUIREMENT_DEFINITIONS = Object.freeze([
  Object.freeze({
    key: 'named_oauth_profile_usability',
    layer: 'NAMED_OAUTH_PROFILE_LAYER'
  }),
  Object.freeze({
    key: 'oauth_scope_coverage',
    layer: 'OAUTH_SCOPE_LAYER'
  }),
  Object.freeze({
    key: 'desktop_client_cloud_project_alignment',
    layer: 'OAUTH_CLIENT_PROJECT_LAYER'
  }),
  Object.freeze({
    key: 'oauth_testing_principal_eligibility',
    layer: 'OAUTH_TESTING_ELIGIBILITY_LAYER'
  }),
  Object.freeze({
    key: 'standard_cloud_project_linkage',
    layer: 'STANDARD_CLOUD_PROJECT_LAYER'
  }),
  Object.freeze({
    key: 'apps_script_api_project_enablement',
    layer: 'APPS_SCRIPT_API_ENABLEMENT_LAYER'
  }),
  Object.freeze({
    key: 'api_executable_myself_access',
    layer: 'API_EXECUTABLE_ACCESS_LAYER'
  }),
  Object.freeze({
    key: 'oauth_principal_execution_permission',
    layer: 'EXECUTION_PERMISSION_LAYER'
  }),
  Object.freeze({
    key: 'script_project_ownership_alignment',
    layer: 'SCRIPT_OWNERSHIP_LAYER'
  }),
  Object.freeze({
    key: 'bound_container_ownership_alignment',
    layer: 'CONTAINER_OWNERSHIP_LAYER'
  }),
  Object.freeze({
    key: 'runtime_function_deployment_lineage',
    layer: 'FUNCTION_AND_DEPLOYMENT_LINEAGE_LAYER'
  })
]);

const MARKER_AUTHORIZATION_STATES = Object.freeze([
  'NOT_AUTHORIZED',
  'AUTHORIZED_BY_LATER_TRACKED_INSTRUCTION'
]);
const MARKER_ATTEMPT_STATES = Object.freeze([
  'NOT_STARTED',
  'ATTEMPT_STARTED',
  'ATTEMPT_CLOSED'
]);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertOnlyKeys(value, allowedKeys, errorCode) {
  if (!isRecord(value) || Object.keys(value).some((key) => !allowedKeys.has(key))) {
    throw new Error(errorCode);
  }
}

function normalizeAuthDiagnosticEvidence(input = {}) {
  assertOnlyKeys(
    input,
    new Set(['schema_id', 'source_boundary', 'evidence']),
    'AUTH_DIAGNOSTIC_EVIDENCE_ENVELOPE_INVALID'
  );
  if (input.schema_id !== undefined && input.schema_id !== EVIDENCE_SCHEMA_ID) {
    throw new Error('AUTH_DIAGNOSTIC_EVIDENCE_SCHEMA_INVALID');
  }
  if (input.source_boundary !== undefined &&
      input.source_boundary !== EVIDENCE_SOURCE_BOUNDARY) {
    throw new Error('AUTH_DIAGNOSTIC_EVIDENCE_SOURCE_BOUNDARY_INVALID');
  }

  const evidenceInput = input.evidence === undefined ? {} : input.evidence;
  const requirementKeys = new Set(REQUIREMENT_DEFINITIONS.map((item) => item.key));
  assertOnlyKeys(
    evidenceInput,
    requirementKeys,
    'AUTH_DIAGNOSTIC_EVIDENCE_FIELD_NOT_ALLOWED'
  );

  const evidence = {};
  REQUIREMENT_DEFINITIONS.forEach(({ key }) => {
    const status = Object.prototype.hasOwnProperty.call(evidenceInput, key)
      ? evidenceInput[key]
      : 'UNKNOWN_NOT_EXPOSED';
    if (!EVIDENCE_STATUSES.includes(status)) {
      throw new Error('AUTH_DIAGNOSTIC_EVIDENCE_STATUS_INVALID');
    }
    evidence[key] = status;
  });

  return Object.freeze({
    schema_id: EVIDENCE_SCHEMA_ID,
    source_boundary: EVIDENCE_SOURCE_BOUNDARY,
    evidence: Object.freeze(evidence)
  });
}

function classifyAuthDiagnosticEvidence(input) {
  const normalized = normalizeAuthDiagnosticEvidence(input);
  const counts = Object.fromEntries(EVIDENCE_STATUSES.map((status) => [status, 0]));
  const unresolvedLayers = [];

  REQUIREMENT_DEFINITIONS.forEach(({ key, layer }) => {
    const status = normalized.evidence[key];
    counts[status] += 1;
    if (status !== 'LOCALLY_ATTESTED') {
      unresolvedLayers.push(layer);
    }
  });

  let classification = 'NO_REMOTE_ROOT_CAUSE_IDENTIFIED';
  if (counts.UNKNOWN_NOT_EXPOSED > 0) {
    classification = 'REMOTE_AUTHORIZATION_LAYER_UNRESOLVED';
  } else if (counts.INFERRED > 0) {
    classification = 'REMOTE_AUTHORIZATION_LAYER_INFERRED_ONLY';
  }

  return Object.freeze({
    schema_id: 'WORK_OS_REMOTE_ONLY_AUTH_DIAGNOSTIC_CLASSIFICATION_V1',
    classification,
    root_cause: 'NOT_PROVEN_BY_REPOSITORY_EVIDENCE',
    counts: Object.freeze(counts),
    unresolved_layers: Object.freeze(unresolvedLayers),
    diagnostic_execution: EXECUTION_NOT_AUTHORIZED
  });
}

function decideAuthDiagnosticDesign(input) {
  const classification = classifyAuthDiagnosticEvidence(input);
  const hasUnresolvedEvidence =
    classification.counts.INFERRED > 0 ||
    classification.counts.UNKNOWN_NOT_EXPOSED > 0;

  return Object.freeze({
    outcome: 'REMOTE_ONLY_AUTH_DIAGNOSTIC_DESIGN_COMPLETE',
    evidence_decision: hasUnresolvedEvidence
      ? 'REAL_ENVIRONMENT_VERIFICATION_DEFERRED_TO_LATER_WORK_ID'
      : 'EXECUTION_AUTHORITY_STILL_REQUIRES_LATER_WORK_ID',
    operator_action_now: 'NOT_REQUIRED',
    diagnostic_execution: EXECUTION_NOT_AUTHORIZED
  });
}

function normalizeOneUseMarker(input) {
  assertOnlyKeys(
    input,
    new Set([
      'schema_id',
      'authorization_state',
      'attempt_state',
      'invocation_count',
      'prior_attempt_markers_preserved'
    ]),
    'AUTH_DIAGNOSTIC_MARKER_ENVELOPE_INVALID'
  );
  if (input.schema_id !== MARKER_SCHEMA_ID ||
      !MARKER_AUTHORIZATION_STATES.includes(input.authorization_state) ||
      !MARKER_ATTEMPT_STATES.includes(input.attempt_state) ||
      ![0, 1].includes(input.invocation_count) ||
      typeof input.prior_attempt_markers_preserved !== 'boolean') {
    throw new Error('AUTH_DIAGNOSTIC_MARKER_INVALID');
  }
  if (input.authorization_state === 'NOT_AUTHORIZED' &&
      (input.attempt_state !== 'NOT_STARTED' || input.invocation_count !== 0)) {
    throw new Error('AUTH_DIAGNOSTIC_MARKER_INVALID');
  }
  if (input.attempt_state === 'NOT_STARTED' && input.invocation_count !== 0) {
    throw new Error('AUTH_DIAGNOSTIC_MARKER_INVALID');
  }
  if (input.attempt_state !== 'NOT_STARTED' && input.invocation_count !== 1) {
    throw new Error('AUTH_DIAGNOSTIC_MARKER_INVALID');
  }
  return Object.freeze({
    schema_id: MARKER_SCHEMA_ID,
    authorization_state: input.authorization_state,
    attempt_state: input.attempt_state,
    invocation_count: input.invocation_count,
    prior_attempt_markers_preserved: input.prior_attempt_markers_preserved
  });
}

function createInstruction0019DesignMarker() {
  return normalizeOneUseMarker({
    schema_id: MARKER_SCHEMA_ID,
    authorization_state: 'NOT_AUTHORIZED',
    attempt_state: 'NOT_STARTED',
    invocation_count: 0,
    prior_attempt_markers_preserved: true
  });
}

function planOneUseAttemptStart(input) {
  const marker = normalizeOneUseMarker(input);
  if (marker.authorization_state !==
      'AUTHORIZED_BY_LATER_TRACKED_INSTRUCTION') {
    return Object.freeze({
      decision: EXECUTION_NOT_AUTHORIZED,
      remote_call_performed: false
    });
  }
  if (!marker.prior_attempt_markers_preserved) {
    return Object.freeze({
      decision: 'AUTH_DIAGNOSTIC_PRIOR_MARKERS_NOT_PRESERVED',
      remote_call_performed: false
    });
  }
  if (marker.attempt_state !== 'NOT_STARTED' || marker.invocation_count !== 0) {
    return Object.freeze({
      decision: 'AUTH_DIAGNOSTIC_ATTEMPT_ALREADY_CONSUMED',
      remote_call_performed: false
    });
  }

  return Object.freeze({
    decision: 'MARK_ATTEMPT_STARTED_BEFORE_REMOTE_CALL',
    remote_call_performed: false,
    next_marker: normalizeOneUseMarker({
      schema_id: MARKER_SCHEMA_ID,
      authorization_state: marker.authorization_state,
      attempt_state: 'ATTEMPT_STARTED',
      invocation_count: 1,
      prior_attempt_markers_preserved: true
    })
  });
}

function closeOneUseAttempt(input) {
  const marker = normalizeOneUseMarker(input);
  if (marker.attempt_state !== 'ATTEMPT_STARTED' ||
      marker.invocation_count !== 1) {
    throw new Error('AUTH_DIAGNOSTIC_ATTEMPT_NOT_STARTED');
  }
  return normalizeOneUseMarker({
    schema_id: MARKER_SCHEMA_ID,
    authorization_state: marker.authorization_state,
    attempt_state: 'ATTEMPT_CLOSED',
    invocation_count: 1,
    prior_attempt_markers_preserved: marker.prior_attempt_markers_preserved
  });
}

function runDisabledPlaceholder() {
  process.stdout.write(`${EXECUTION_NOT_AUTHORIZED}\n`);
  process.exitCode = 1;
}

if (require.main === module) {
  runDisabledPlaceholder();
}

module.exports = {
  EXECUTION_NOT_AUTHORIZED,
  EVIDENCE_SCHEMA_ID,
  EVIDENCE_SOURCE_BOUNDARY,
  MARKER_SCHEMA_ID,
  EVIDENCE_STATUSES,
  REQUIREMENT_DEFINITIONS,
  normalizeAuthDiagnosticEvidence,
  classifyAuthDiagnosticEvidence,
  decideAuthDiagnosticDesign,
  normalizeOneUseMarker,
  createInstruction0019DesignMarker,
  planOneUseAttemptStart,
  closeOneUseAttempt
};
