'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  classifyClaspFailure,
  closedClaspFailureCategories,
  closedPostRemoteFailureCategories,
  buildRuntimeManifestOverlay,
  assertRuntimeManifestOverlay,
  assertSafeRuntimeResult,
  assertCorrectedVersionedDeploymentBinding,
  postPullPayloadObservation,
  newBlankPullPayloadObservation,
  assertNewBlankPulledPayload,
  targetPreflightContractForAttestation,
  safePostPullObservation,
  assertRecoverableAccessCheckObservation,
  isApprovedAccessCheckRecovery,
  isManifestConfirmationNoop,
  expectedCanonicalPayloadSha256,
  canonicalPayloadFileNames,
  canonicalScriptExtensions,
  canonicalHtmlExtensions,
  scriptExtensionContract,
  existingTargetAttestation,
  newBlankTargetAttestation,
  existingCanonicalPreflightContract,
  newBlankPreflightContract,
  assertCanonicalClaspExtensionContract,
  buildCanonicalClaspProjectConfig,
  writeCanonicalClaspProjectConfig,
  mapSyntheticServerScriptsToCanonicalPayloadNames,
  assertTargetObjects,
  inventoryFor,
  targetBindingFingerprint,
  accessEvidenceMatchesTarget,
  safeOperationRecord,
  postRemoteFailureClassification
} = require('../tools/local_clasp_dev');

const moduleRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(moduleRoot, '..', '..');
const manifestPath = path.join(moduleRoot, 'apps-script-v2', 'appsscript.json');
const canonicalManifestBytes = fs.readFileSync(manifestPath);
const canonicalManifest = JSON.parse(canonicalManifestBytes.toString('utf8'));
const packageJson = JSON.parse(fs.readFileSync(
  path.join(moduleRoot, 'package.json'),
  'utf8'
));
const claspToolSource = fs.readFileSync(
  path.join(moduleRoot, 'tools', 'local_clasp_dev.js'),
  'utf8'
);
const localClaspExample = JSON.parse(fs.readFileSync(
  path.join(moduleRoot, '.clasp.example.json'),
  'utf8'
));
const sourceClaspExample = JSON.parse(fs.readFileSync(
  path.join(moduleRoot, 'apps-script-v2', '.clasp.json.example'),
  'utf8'
));

const tests = [];
function test(id, body) {
  try {
    body();
    tests.push({ id, status: 'PASS' });
  } catch (error) {
    tests.push({
      id,
      status: 'FAIL',
      safe_message: String(error && error.message || error)
    });
  }
}

test('BOOT-01_ALL_REQUIRED_CLOSED_FAILURE_CATEGORIES_EXIST', () => {
  [
    'APPS_SCRIPT_API_DISABLED',
    'BLOCKED_BY_AUTH',
    'DEV_TARGET_NOT_FOUND_OR_NO_ACCESS',
    'DEV_TARGET_PROJECT_TYPE_OR_BINDING_INVALID',
    'REMOTE_MANIFEST_REJECTED',
    'REMOTE_PAYLOAD_REJECTED',
    'NETWORK_OR_TLS_FAILURE',
    'CLASP_REMOTE_CONFLICT',
    'REMOTE_QUICK_DIAGNOSTIC_FAILED_CLOSED',
    'UNKNOWN_CLASP_PUSH_FAILURE'
  ].forEach((value) => assert.ok(closedClaspFailureCategories.includes(value)));
});

test('BOOT-02_FAILURE_CLASSIFICATION_IS_DETERMINISTIC', () => {
  const fixtures = {
    APPS_SCRIPT_API_DISABLED: 'Apps Script API is disabled',
    BLOCKED_BY_AUTH: 'invalid_grant',
    DEV_TARGET_NOT_FOUND_OR_NO_ACCESS: 'caller does not have permission',
    DEV_TARGET_PROJECT_TYPE_OR_BINDING_INVALID: 'invalid script id',
    REMOTE_MANIFEST_REJECTED: 'manifest rejected',
    REMOTE_PAYLOAD_REJECTED: 'payload rejected',
    NETWORK_OR_TLS_FAILURE: 'ETIMEDOUT',
    CLASP_REMOTE_CONFLICT: 'remote changed; push requires --force',
    REMOTE_QUICK_DIAGNOSTIC_FAILED_CLOSED:
      'Script function not found. Please make sure script is deployed as API executable.',
    UNKNOWN_CLASP_PUSH_FAILURE: 'unrecognized synthetic failure'
  };
  Object.entries(fixtures).forEach(([expected, raw]) => {
    assert.strictEqual(classifyClaspFailure(raw, 'push'), expected);
  });
});

test('BOOT-03_CANONICAL_MANIFEST_HAS_NO_EXECUTION_API', () => {
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(canonicalManifest, 'executionApi'),
    false
  );
});

test('BOOT-04_RUNTIME_OVERLAY_PRESERVES_ALL_CANONICAL_FIELDS', () => {
  const overlay = buildRuntimeManifestOverlay(canonicalManifest);
  assert.strictEqual(overlay.executionApi.access, 'MYSELF');
  assertRuntimeManifestOverlay(canonicalManifest, overlay);
  const stripped = JSON.parse(JSON.stringify(overlay));
  delete stripped.executionApi;
  assert.deepStrictEqual(stripped, canonicalManifest);
});

test('BOOT-05_PUBLIC_RUNTIME_ACCESS_IS_REJECTED', () => {
  ['DOMAIN', 'ANYONE', 'ANYONE_ANONYMOUS'].forEach((access) => {
    const overlay = JSON.parse(JSON.stringify(canonicalManifest));
    overlay.executionApi = { access };
    assert.throws(() => assertRuntimeManifestOverlay(canonicalManifest, overlay));
  });
});

test('BOOT-06_RUNTIME_SUMMARY_IS_BOUNDED_COMPLETE_AND_READ_ONLY', () => {
  const raw = JSON.stringify({ acceptance_summary: {
    summary_contract_id: 'WORK_OS_V2_DIAGNOSTIC_ACCEPTANCE_SUMMARY_V1',
    diagnostic_kind: 'QUICK', status: 'WARN',
    pass_count: 77, warn_count: 2, fail_count: 0, not_executed_count: 0,
    warn_check_ids: ['EXPECTED_ALPHA', 'EXPECTED_BETA'], fail_check_ids: [],
    warn_ids_complete: true, fail_ids_complete: true,
    acceptance_summary_status: 'COMPLETE',
    external_services_called: false, writes_performed: false,
    spreadsheet_write_performed: false, properties_write_performed: false,
    trigger_write_performed: false, flush_performed: false,
    calendar_api_called: false, gmail_api_called: false,
    external_ai_request_performed: false, dashboard_repair_performed: false,
    task_physical_column_count: 50, task_schema_ids_state: 'PASS',
    task_schema_headers_state: 'PASS', ledger_physical_column_count: 21,
    ledger_hidden_state: true, ledger_protection_state: true,
    ledger_authority_validator_state: 'PASS'
  }});
  const summary = assertSafeRuntimeResult(raw);
  assert.strictEqual(summary.side_effects_all_false, true);
  assert.deepStrictEqual(summary.warn_check_ids, ['EXPECTED_ALPHA', 'EXPECTED_BETA']);
});

test('BOOT-07_RUNTIME_SUMMARY_REJECTS_SIDE_EFFECTS', () => {
  const unsafe = JSON.stringify({ acceptance_summary: {
    summary_contract_id: 'WORK_OS_V2_DIAGNOSTIC_ACCEPTANCE_SUMMARY_V1',
    writes_performed: true
  }});
  assert.throws(() => assertSafeRuntimeResult(unsafe),
    /DEV_RUNTIME_SIDE_EFFECT_CONTRACT_FAILED/);
});

test('BOOT-08_PACKAGE_SCRIPTS_EXPOSE_CANONICAL_AND_RUNTIME_LANES', () => {
  [
    'gas:prerequisites:dev',
    'gas:access-check:dev',
    'gas:access-recover:dev',
    'gas:authorize-interactive-blank-push:dev',
    'gas:record-interactive-blank-push:dev',
    'gas:prove-interactive-blank-push:dev',
    'gas:stage:dev',
    'gas:push:dev',
    'gas:pull-verify:dev',
    'gas:runtime-auth-check:dev',
    'gas:runtime-prerequisites:dev',
    'gas:runtime-config:dev',
    'gas:stage:runtime-dev',
    'gas:push:runtime-dev',
    'gas:pull-verify:runtime-dev',
    'gas:prepare-runtime-retry:0013',
    'gas:preflight-runtime-retry:0013',
    'gas:test:runtime-dev:0013',
    'gas:test:runtime-dev'
  ].forEach((name) => assert.strictEqual(typeof packageJson.scripts[name], 'string'));
});

test('BOOT-09_LOCAL_SECRET_DIRECTORIES_REMAIN_IGNORED', () => {
  const rootIgnore = fs.readFileSync(path.join(repositoryRoot, '.gitignore'), 'utf8');
  const moduleIgnore = fs.readFileSync(path.join(moduleRoot, '.gitignore'), 'utf8');
  assert.match(rootIgnore, /\*\*\/\.clasp-dev\//);
  assert.match(moduleIgnore, /^\.clasp-dev\/$/m);
});

test('BOOT-10_CANONICAL_MANIFEST_BYTES_ARE_NOT_REWRITTEN_BY_GENERATOR', () => {
  buildRuntimeManifestOverlay(canonicalManifest);
  assert.deepStrictEqual(fs.readFileSync(manifestPath), canonicalManifestBytes);
});

test('BOOT-11_CANONICAL_ATTEMPT_MARKER_PRECEDES_REMOTE_PUSH', () => {
  const marker = claspToolSource.indexOf('markCanonicalRetryUsed(inventory);');
  const push = claspToolSource.indexOf("runClasp(['push'], devRoot)");
  assert.ok(marker >= 0 && push > marker);
});

test('BOOT-12_CANONICAL_FORCE_PUSH_IS_NEVER_INVOKED', () => {
  assert.doesNotMatch(claspToolSource, /runClasp\(\[[^\]]*['"]--force['"]/);
});

test('BOOT-13_RUNTIME_GUARD_REQUIRES_TEST_AND_AUTOMATION_CONTRACTS', () => {
  assert.ok(claspToolSource.includes('TEST_MODE' + ':\\s*true'));
  assert.ok(claspToolSource.includes('AUTOMATION_ENABLED' + ':\\s*false'));
  assert.match(claspToolSource, /\btest_mode\b/);
  assert.match(claspToolSource, /\bautomation_disabled\b/);
});

test('BOOT-14_POST_PULL_FAILURE_PERSISTS_A_CLOSED_SAFE_CATEGORY', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(),
    'work-os-post-pull-shape-'));
  try {
    fs.writeFileSync(path.join(temporaryRoot, 'first.gs'), '', 'utf8');
    fs.writeFileSync(path.join(temporaryRoot, 'second.json'), '{}', 'utf8');
    const observation = postPullPayloadObservation(temporaryRoot);
    assert.deepStrictEqual(observation, {
      post_pull_validation: 'FAILED',
      observed_file_count: 2,
      expected_file_count: 23,
      observed_nonfile_count: 0
    });
    const safe = safePostPullObservation(observation);
    assert.deepStrictEqual(safe, observation);
    assert.strictEqual(JSON.stringify(safe).includes('first.gs'), false);
    assert.strictEqual(JSON.stringify(safe).includes('second.json'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(safe, 'files'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(safe, 'payload_sha256'), false);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
  assert.strictEqual(
    postRemoteFailureClassification(
      { code: 'REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH' },
      'UNKNOWN_CLASP_REMOTE_FAILURE'
    ),
    'REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH'
  );
  assert.strictEqual(
    postRemoteFailureClassification(
      { code: 'unsafe punctuation!' },
      'UNKNOWN_CLASP_REMOTE_FAILURE'
    ),
    'UNKNOWN_CLASP_REMOTE_FAILURE'
  );
  assert.ok(closedPostRemoteFailureCategories.includes(
    'REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH'
  ));
  const accessCheck = claspToolSource.indexOf("persistPostRemoteFailure(\n          'access-check'");
  const accessCheckSuccess = claspToolSource.indexOf("persistOperationRecord('access-check', result, 'PASS')");
  const canonicalPull = claspToolSource.indexOf(
    "persistPostRemoteFailure(\n          'pull-verify'",
    accessCheck + 1
  );
  const runtimePull = claspToolSource.indexOf("persistPostRemoteFailure(\n          'pull-verify-runtime'");
  assert.ok(accessCheck > accessCheckSuccess);
  assert.ok(canonicalPull > accessCheck);
  assert.ok(runtimePull > canonicalPull);
});

test('BOOT-15_ACCESS_EVIDENCE_IS_TARGET_BOUND_AND_SAFE', () => {
  const scriptId = 'A'.repeat(24);
  const target = { config: { scriptId } };
  const matchingFingerprint = targetBindingFingerprint(target.config);
  const prerequisite = { target_binding_sha256: matchingFingerprint };
  assert.strictEqual(accessEvidenceMatchesTarget(prerequisite, target), true);
  assert.strictEqual(accessEvidenceMatchesTarget(prerequisite, {
    config: { scriptId: 'B'.repeat(24) }
  }), false);

  const observation = {
    post_pull_validation: 'FAILED',
    observed_file_count: 2,
    expected_file_count: 23,
    observed_nonfile_count: 0
  };
  assert.deepStrictEqual(assertRecoverableAccessCheckObservation(observation),
    observation);
  assert.throws(
    () => assertRecoverableAccessCheckObservation({
      ...observation,
      observed_file_count: 0
    }),
    /ACCESS_CHECK_WORKSPACE_RECOVERY_NOT_REQUIRED/
  );

  const raw = `sensitive-script-id:${scriptId}`;
  const record = safeOperationRecord(
    'access-check',
    { exit_code: 0, output_sha256: 'f'.repeat(64), raw },
    'REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH',
    observation,
    matchingFingerprint
  );
  const serialized = JSON.stringify(record);
  assert.strictEqual(serialized.includes(scriptId), false);
  assert.strictEqual(serialized.includes(raw), false);
  assert.deepStrictEqual(Object.keys(record).sort(), [
    'exit_code',
    'expected_file_count',
    'observed_file_count',
    'observed_nonfile_count',
    'operation',
    'output_sha256',
    'post_pull_validation',
    'script_extension_contract',
    'status',
    'target_binding_sha256'
  ]);
  assert.doesNotMatch(claspToolSource,
    /closedPostRemoteFailureCategories\s*=\s*Object\.freeze\(\s*closedClaspFailureCategories/);
});

test('BOOT-16_CLASP_EXTENSION_CONTRACT_IS_EXACT_IN_BOTH_TRACKED_EXAMPLES', () => {
  [localClaspExample, sourceClaspExample].forEach((config) => {
    assert.strictEqual(
      assertCanonicalClaspExtensionContract(config),
      scriptExtensionContract
    );
    assert.deepStrictEqual(config.scriptExtensions, ['.gs', '.js']);
    assert.deepStrictEqual(config.htmlExtensions, ['.html']);
  });
  assert.deepStrictEqual(canonicalScriptExtensions, ['.gs', '.js']);
  assert.deepStrictEqual(canonicalHtmlExtensions, ['.html']);
});

test('BOOT-17_EXTENSION_CONTRACT_FAILS_CLOSED_BEFORE_REMOTE_CALLS', () => {
  const id = 'A'.repeat(24);
  const target = {
    target_kind: 'PERSONAL_SYNTHETIC_DEV',
    target_attestation: existingTargetAttestation,
    remote_preflight_contract: existingCanonicalPreflightContract,
    expected_script_id: id,
    rootDir: 'payload'
  };
  const valid = buildCanonicalClaspProjectConfig(id);
  assert.strictEqual(assertTargetObjects(valid, target, null), id);
  [
    { ...valid, scriptExtensions: undefined },
    { ...valid, scriptExtensions: ['.js', '.gs'] },
    { ...valid, scriptExtensions: ['.gs', '.js', '.ts'] },
    { ...valid, htmlExtensions: ['.html', '.htm'] },
    { ...valid, htmlExtensions: '.html' },
    { ...valid, fileExtension: '.gs' }
  ].forEach((config) => {
    assert.throws(() => assertTargetObjects(config, target, null));
  });
});

test('BOOT-18_ALL_GENERATED_CLASP_PROJECT_CONFIGS_USE_THE_SHARED_GS_FIRST_HELPER', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(),
    'work-os-clasp-contract-'));
  try {
    const id = 'A'.repeat(24);
    const config = buildCanonicalClaspProjectConfig(id);
    writeCanonicalClaspProjectConfig(temporaryRoot, config);
    const generated = JSON.parse(fs.readFileSync(
      path.join(temporaryRoot, '.clasp.json'), 'utf8'
    ));
    assert.deepStrictEqual(generated, config);
    assert.strictEqual(fs.readFileSync(
      path.join(temporaryRoot, '.claspignore'), 'utf8'
    ), '**/**\n!*.gs\n!appsscript.json\n');
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
  assert.doesNotMatch(claspToolSource, /function writePullConfig/);
  assert.strictEqual(
    (claspToolSource.match(/writeCanonicalClaspProjectConfig\(/g) || []).length,
    6
  );
});

test('BOOT-19_SYNTHETIC_SERVER_SCRIPT_INVENTORY_AND_CANONICAL_HASH_REMAIN_FIXED', () => {
  const remoteScriptNames = canonicalPayloadFileNames
    .filter((name) => name.endsWith('.gs'))
    .map((name) => name.slice(0, -3));
  assert.deepStrictEqual(
    mapSyntheticServerScriptsToCanonicalPayloadNames(remoteScriptNames),
    canonicalPayloadFileNames.slice().sort()
  );
  const sourceRoot = path.join(moduleRoot, 'apps-script-v2');
  const inventory = inventoryFor(sourceRoot, canonicalPayloadFileNames.slice().sort());
  assert.strictEqual(inventory.file_count, 23);
  assert.strictEqual(inventory.payload_sha256, expectedCanonicalPayloadSha256);
});

test('BOOT-20_NEW_BLANK_BOUND_TARGET_PREFLIGHT_IS_EXACT_AND_FAILS_CLOSED', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(),
    'work-os-new-blank-target-'));
  try {
    fs.writeFileSync(path.join(temporaryRoot, 'Code.gs'),
      'function myFunction() {\n}\n', 'utf8');
    fs.writeFileSync(path.join(temporaryRoot, 'appsscript.json'), JSON.stringify({
      timeZone: 'Etc/UTC',
      dependencies: {},
      exceptionLogging: 'STACKDRIVER',
      runtimeVersion: 'V8'
    }), 'utf8');
    assert.deepStrictEqual(newBlankPullPayloadObservation(temporaryRoot), {
      post_pull_validation: 'PASS',
      observed_file_count: 2,
      expected_file_count: 2,
      observed_nonfile_count: 0,
      remote_preflight_contract: newBlankPreflightContract
    });
    assert.strictEqual(
      assertNewBlankPulledPayload(temporaryRoot).post_pull_validation,
      'PASS'
    );
    fs.writeFileSync(path.join(temporaryRoot, 'Code.gs'),
      'function unknownExistingWorkload() {}\n', 'utf8');
    assert.throws(() => assertNewBlankPulledPayload(temporaryRoot),
      /REMOTE_NEW_BLANK_TARGET_PREFLIGHT_FAILED/);
    fs.writeFileSync(path.join(temporaryRoot, 'Code.gs'), '', 'utf8');
    fs.writeFileSync(path.join(temporaryRoot, 'appsscript.json'), JSON.stringify({
      dependencies: { enabledAdvancedServices: [{ userSymbol: 'Unsafe' }] }
    }), 'utf8');
    assert.throws(() => assertNewBlankPulledPayload(temporaryRoot),
      /REMOTE_NEW_BLANK_TARGET_PREFLIGHT_FAILED/);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test('BOOT-21_TARGET_ATTESTATION_SELECTS_ONE_CLOSED_PREFLIGHT_CONTRACT', () => {
  assert.strictEqual(
    targetPreflightContractForAttestation(existingTargetAttestation),
    existingCanonicalPreflightContract
  );
  assert.strictEqual(
    targetPreflightContractForAttestation(newBlankTargetAttestation),
    newBlankPreflightContract
  );
  assert.throws(() => targetPreflightContractForAttestation('UNKNOWN_TARGET'),
    /DEV_TARGET_ATTESTATION_REJECTED/);
  const id = 'A'.repeat(24);
  const config = buildCanonicalClaspProjectConfig(id);
  const target = {
    target_kind: 'PERSONAL_SYNTHETIC_DEV',
    target_attestation: newBlankTargetAttestation,
    remote_preflight_contract: newBlankPreflightContract,
    expected_script_id: id,
    rootDir: 'payload'
  };
  assert.strictEqual(assertTargetObjects(config, target, null), id);
  assert.throws(() => assertTargetObjects(config, {
    ...target,
    remote_preflight_contract: existingCanonicalPreflightContract
  }, null), /DEV_TARGET_ATTESTATION_REJECTED/);
});

test('BOOT-22_SUPERSEDED_ACCESS_WORKSPACE_RECOVERY_REQUIRES_NEW_TARGET_ATTESTATION', () => {
  const newTarget = { target: { target_attestation: newBlankTargetAttestation } };
  assert.strictEqual(isApprovedAccessCheckRecovery({
    GAS_ACCESS_CHECK_WORKSPACE_RECOVERY_ALLOWED: 'true',
    GAS_ACCESS_CHECK_WORKSPACE_RECOVERY_REASON:
      'SUPERSEDED_BY_NEW_BLANK_BOUND_SHEET_SANDBOX'
  }, newTarget), true);
  assert.strictEqual(isApprovedAccessCheckRecovery({
    GAS_ACCESS_CHECK_WORKSPACE_RECOVERY_ALLOWED: 'true',
    GAS_ACCESS_CHECK_WORKSPACE_RECOVERY_REASON: 'REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH'
  }, newTarget), false);
  assert.strictEqual(isApprovedAccessCheckRecovery({
    GAS_ACCESS_CHECK_WORKSPACE_RECOVERY_ALLOWED: 'false',
    GAS_ACCESS_CHECK_WORKSPACE_RECOVERY_REASON:
      'SUPERSEDED_BY_NEW_BLANK_BOUND_SHEET_SANDBOX'
  }, newTarget), false);
});

test('BOOT-23_PARENT_NON_ECHOING_PROMPT_HANDOFF_IS_EPHEMERAL', () => {
  assert.match(claspToolSource,
    /GAS_DEV_LOCAL_SCRIPT_ID_SOURCE\s*===\s*\n\s*'NON_ECHOING_PARENT_PROMPT'/);
  assert.match(claspToolSource,
    /environment\.GAS_DEV_LOCAL_SCRIPT_ID\s*=\s*''/);
  assert.doesNotMatch(claspToolSource,
    /writeSafeResult\([^)]*GAS_DEV_LOCAL_SCRIPT_ID/);
});

test('BOOT-24_MANIFEST_CONFIRMATION_NOOP_IS_NOT_A_SUCCESSFUL_PUSH', () => {
  assert.strictEqual(isManifestConfirmationNoop('Skipping push.\n'), true);
  assert.strictEqual(isManifestConfirmationNoop('Pushed 23 files.'), false);
  const detection = claspToolSource.indexOf(
    'if (isManifestConfirmationNoop(result.raw))'
  );
  const success = claspToolSource.indexOf(
    "persistOperationRecord('push', result, 'PASS')"
  );
  assert.ok(detection >= 0 && success > detection);
  assert.match(claspToolSource,
    /REMOTE_MUTATION_NOT_PERFORMED_MANIFEST_CONFIRMATION_REQUIRED/);
});

test('BOOT-25_BLANK_MANIFEST_RECOVERY_NEVER_USES_FORCE_FLAG', () => {
  assert.doesNotMatch(claspToolSource,
    /runClasp\(\[[^\]]*['"]--force['"]/);
  assert.match(claspToolSource, /force_flag_allowed:\s*false/);
  assert.match(claspToolSource, /force_flag_used:\s*false/);
  assert.match(claspToolSource,
    /OPERATOR_CONFIRMED_23_FILES_PUSHED/);
});

test('BOOT-26_MISSED_OPERATOR_CONFIRMATION_REQUIRES_INDEPENDENT_BYTE_PARITY', () => {
  const proofCommand = claspToolSource.indexOf(
    "if (command === 'prove-interactive-blank-push')"
  );
  const exactShape = claspToolSource.indexOf(
    'observation = assertExactPulledPayload',
    proofCommand
  );
  const hashParity = claspToolSource.indexOf(
    'pulled.payload_sha256 !== inventory.payload_sha256',
    proofCommand
  );
  const proofRecord = claspToolSource.indexOf(
    'recordIndependentInteractiveBlankPushProof',
    proofCommand
  );
  assert.ok(proofCommand >= 0 && exactShape > proofCommand);
  assert.ok(hashParity > exactShape && proofRecord > hashParity);
  assert.match(claspToolSource, /INDEPENDENT_PULLBACK_PROVED_EXECUTED/);
  assert.match(claspToolSource, /operator_confirmation:\s*'NOT_RECORDED'/);
});

test('BOOT-27_RUNTIME_MANIFEST_FORCE_IS_SCOPED_AND_NOOP_FAILS_CLOSED', () => {
  const runtimePush = claspToolSource.indexOf("if (command === 'push-runtime')");
  const force = claspToolSource.indexOf(
    "runtimeClaspArgs(['push', '--force'])",
    runtimePush
  );
  const noop = claspToolSource.indexOf(
    'if (isManifestConfirmationNoop(result.raw))',
    force
  );
  const failure = claspToolSource.indexOf(
    'RUNTIME_MANIFEST_OVERWRITE_NOT_PERFORMED',
    noop
  );
  const success = claspToolSource.indexOf(
    "persistOperationRecord('push-runtime', result, 'PASS')",
    failure
  );
  assert.ok(runtimePush >= 0 && force > runtimePush);
  assert.ok(noop > force && failure > noop && success > failure);
  assert.match(claspToolSource, /runClasp\(\['push'\], devRoot\)/);
  assert.doesNotMatch(claspToolSource,
    /runClasp\(\['push',\s*['"]--force['"]\],\s*devRoot\)/);
});

test('BOOT-28_RUNTIME_AUTH_NORESULT_IS_CLOSED_AND_SECOND_ATTEMPT_IS_BLOCKED', () => {
  assert.strictEqual(
    classifyClaspFailure(
      'Unable to run script function. Please make sure you have permission.',
      'test-runtime'
    ),
    'BLOCKED_BY_AUTH'
  );
  const runtimeCommand = claspToolSource.indexOf("if (command === 'test' || command === 'test-runtime')");
  const priorAttemptGuard = claspToolSource.indexOf(
    'assertRuntimeDiagnosticNotPreviouslyAttempted();',
    runtimeCommand
  );
  const googleAttempt = claspToolSource.indexOf(
    "googleOperation = 'ATTEMPTED';",
    priorAttemptGuard
  );
  const remoteCall = claspToolSource.indexOf(
    'runClasp(args, runtimeRoot)',
    googleAttempt
  );
  assert.ok(runtimeCommand >= 0 && priorAttemptGuard > runtimeCommand);
  assert.ok(googleAttempt > priorAttemptGuard && remoteCall > googleAttempt);
  assert.match(claspToolSource, /DEV_RUNTIME_ALREADY_ATTEMPTED/);
  assert.match(claspToolSource, /last-test-runtime\.json/);
});

test('BOOT-29_INSTRUCTION_0013_MARKER_IS_SEPARATE_AND_PRECEDES_GOOGLE_CALLS', () => {
  assert.match(claspToolSource, /instruction-0013-runtime-attempt\.json/);
  assert.match(claspToolSource, /last-test-runtime\.json/);
  const preflight = claspToolSource.indexOf(
    "if (command === 'preflight-runtime-retry-0013')"
  );
  const preflightMarker = claspToolSource.indexOf(
    "state: 'DEPLOYMENT_PREFLIGHT_STARTED'",
    preflight
  );
  const deploymentCall = claspToolSource.indexOf(
    'runClasp(args, runtimeRoot)',
    preflightMarker
  );
  const runtime = claspToolSource.indexOf(
    "if (command === 'test-runtime-0013')"
  );
  const attemptMarker = claspToolSource.indexOf(
    "state: 'ATTEMPT_STARTED'",
    runtime
  );
  const runtimeCall = claspToolSource.indexOf(
    'runClasp(args, runtimeRoot)',
    attemptMarker
  );
  assert.ok(preflight >= 0 && preflightMarker > preflight);
  assert.ok(deploymentCall > preflightMarker);
  assert.ok(runtime >= 0 && attemptMarker > runtime);
  assert.ok(runtimeCall > attemptMarker);
  assert.match(claspToolSource, /INSTRUCTION_0013_RUNTIME_ALREADY_ATTEMPTED/);
});

test('BOOT-30_CORRECTED_VERSIONED_BINDING_PREFLIGHT_IS_CLOSED_SAFE', () => {
  const expected = 'D'.repeat(24);
  const result = assertCorrectedVersionedDeploymentBinding(JSON.stringify([
    { deploymentId: 'H'.repeat(24) },
    { deploymentId: expected, versionNumber: 3, description: 'not retained' }
  ]), expected);
  assert.deepStrictEqual(result, {
    corrected_versioned_deployment_binding: 'PASS',
    versioned_deployment_visible: true,
    local_binding_matches_visible_versioned_deployment: true,
    head_test_deployment_only: false,
    visible_deployment_count: 2,
    visible_versioned_deployment_count: 1,
    visible_head_deployment_count: 1
  });
  assert.strictEqual(JSON.stringify(result).includes(expected), false);
  assert.throws(
    () => assertCorrectedVersionedDeploymentBinding(JSON.stringify([
      { deploymentId: expected }
    ]), expected),
    /CORRECTED_VERSIONED_DEPLOYMENT_NOT_PROVEN/
  );
});

test('BOOT-31_INSTRUCTION_0013_RUNTIME_USES_DEPLOYED_VERSION_MODE', () => {
  const runtime = claspToolSource.indexOf(
    "if (command === 'test-runtime-0013')"
  );
  const nondev = claspToolSource.indexOf(
    "'--json', 'run-function', '--nondev', allowedRuntimeFunction",
    runtime
  );
  assert.ok(runtime >= 0 && nondev > runtime);
});

test('BOOT-32_VERSIONED_FUNCTION_NOT_FOUND_IS_A_CLOSED_RUNTIME_RESULT', () => {
  assert.strictEqual(classifyClaspFailure(
    'Script function not found. Please make sure script is deployed as API executable.',
    'test-runtime-0013'
  ), 'REMOTE_QUICK_DIAGNOSTIC_FAILED_CLOSED');
  const runtime = claspToolSource.indexOf(
    "if (command === 'test-runtime-0013')"
  );
  assert.ok(claspToolSource.indexOf(
    'script function not found',
    runtime
  ) > runtime);
});

const failed = tests.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({
  suite: 'remote_gas_development_bootstrap',
  environment: 'LOCAL_NON_GOOGLE',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
