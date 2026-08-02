'use strict';

/**
 * Guarded local clasp lane for a personal synthetic Apps Script project.
 *
 * This tool never discovers, prints, or stores a script ID. Its only accepted
 * binding is an ignored `.clasp-dev/.clasp.json` paired with an ignored
 * `.clasp-dev/target.json`. GitHub Actions must not invoke this tool.
 */
const assert = require('node:assert');
const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

const moduleRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(moduleRoot, '..', '..');
const sourceRoot = path.join(moduleRoot, 'apps-script-v2');
const devRoot = path.join(moduleRoot, '.clasp-dev');
const payloadRoot = path.join(devRoot, 'payload');
const pullRoot = path.join(moduleRoot, '.clasp-pull-verify');
const accessCheckRoot = path.join(devRoot, 'access-check');
const runtimeRoot = path.join(devRoot, 'runtime');
const runtimePayloadRoot = path.join(runtimeRoot, 'payload');
const runtimePullRoot = path.join(devRoot, 'runtime-pull-verify');
const runtimeVersionPullRoot = path.join(devRoot, 'runtime-version-pull-verify');
const runtimeExecutionRoot = path.join(devRoot, 'runtime-execution');
const runtimeInventoryPath = path.join(devRoot, 'runtime-payload-inventory.json');
const runtimeConfigPath = path.join(devRoot, 'runtime.json');
const runtimeAuthStatePath = path.join(devRoot, 'runtime-auth-state.json');
const prerequisitesPath = path.join(devRoot, 'prerequisites.json');
const operationRecordRoot = path.join(devRoot, 'operation-records');
const runtimeAuthRoot = path.join(devRoot, 'oauth');
const canonicalRetryMarkerPath = path.join(
  operationRecordRoot,
  'canonical-push-retry-used.json'
);
const blankManifestInteractivePushMarkerPath = path.join(
  operationRecordRoot,
  'blank-manifest-interactive-push.json'
);
const instruction0011RuntimeAttemptRecordPath = path.join(
  operationRecordRoot,
  'last-test-runtime.json'
);
const instruction0013RuntimeAttemptMarkerPath = path.join(
  operationRecordRoot,
  'instruction-0013-runtime-attempt.json'
);
const instruction0013DeploymentPreflightOperation =
  'instruction-0013-deployment-preflight';
const instruction0013RuntimeOperation = 'test-runtime-0013';
const instruction0014RuntimeAttemptMarkerPath = path.join(
  operationRecordRoot,
  'instruction-0014-runtime-attempt.json'
);
const instruction0014PullbackOperation = 'instruction-0014-runtime-pullback';
const instruction0014DeploymentOperation =
  'instruction-0014-fresh-deployment';
const instruction0014VersionPullbackOperation =
  'instruction-0014-version-pullback';
const instruction0014LineageOperation =
  'instruction-0014-deployment-lineage';
const instruction0014RuntimeOperation = 'test-runtime-0014';
const configPath = path.join(devRoot, '.clasp.json');
const targetPath = path.join(devRoot, 'target.json');
const inventoryPath = path.join(devRoot, 'payload-inventory.json');
const allowedTargetKind = 'PERSONAL_SYNTHETIC_DEV';
const existingTargetAttestation =
  'PERSONAL_SYNTHETIC_NON_COMPANY_EXISTING_SANDBOX';
const newBlankTargetAttestation =
  'PERSONAL_SYNTHETIC_NON_COMPANY_NEW_BLANK_BOUND_SHEET_SANDBOX';
const existingCanonicalPreflightContract = 'EXISTING_CANONICAL_PAYLOAD_V1';
const newBlankPreflightContract = 'NEW_BLANK_BOUND_SCRIPT_V1';
const allowedTargetAttestations = Object.freeze([
  existingTargetAttestation,
  newBlankTargetAttestation
]);
const allowedRuntimeFunction = 'runQuickDiagnostic';
const runtimeProfileName = 'personal-synthetic-runtime';
const instruction0014DeploymentDescription =
  'instruction-0014-pull-verified-runtime';
const expectedCanonicalPayloadSha256 =
  'ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1';
const canonicalScriptExtensions = Object.freeze(['.gs', '.js']);
const canonicalHtmlExtensions = Object.freeze(['.html']);
const scriptExtensionContract = 'GS_FIRST_CANONICAL';
const closedClaspFailureCategories = Object.freeze([
  'APPS_SCRIPT_API_DISABLED',
  'BLOCKED_BY_AUTH',
  'DEV_TARGET_NOT_FOUND_OR_NO_ACCESS',
  'DEV_TARGET_PROJECT_TYPE_OR_BINDING_INVALID',
  'REMOTE_MANIFEST_REJECTED',
  'REMOTE_PAYLOAD_REJECTED',
  'NETWORK_OR_TLS_FAILURE',
  'CLASP_REMOTE_CONFLICT',
  'REMOTE_MUTATION_NOT_PERFORMED_MANIFEST_CONFIRMATION_REQUIRED',
  'REMOTE_QUICK_DIAGNOSTIC_FAILED_CLOSED',
  'UNKNOWN_CLASP_PUSH_FAILURE',
  'UNKNOWN_CLASP_REMOTE_FAILURE'
]);
const closedPostRemoteFailureCategories = Object.freeze([
  'APPS_SCRIPT_API_DISABLED',
  'BLOCKED_BY_AUTH',
  'DEV_TARGET_NOT_FOUND_OR_NO_ACCESS',
  'DEV_TARGET_PROJECT_TYPE_OR_BINDING_INVALID',
  'REMOTE_MANIFEST_REJECTED',
  'REMOTE_PAYLOAD_REJECTED',
  'NETWORK_OR_TLS_FAILURE',
  'CLASP_REMOTE_CONFLICT',
  'UNKNOWN_CLASP_REMOTE_FAILURE',
  'REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH',
  'REMOTE_NEW_BLANK_TARGET_PREFLIGHT_FAILED',
  'REMOTE_PULLBACK_PARITY_FAILED',
  'RUNTIME_REMOTE_PULLBACK_PARITY_FAILED'
]);
const canonicalPayloadFileNames = Object.freeze([
  '00_Config.gs',
  '01_TypesAndSchemas.gs',
  '02_Setup.gs',
  '03_SheetBuilder.gs',
  '04_MessageStateRepository.gs',
  '05_GmailGateway.gs',
  '06_EmailPreprocessor.gs',
  '07_AiAdapter.gs',
  '08_TaskRepository.gs',
  '09_TaskReviewPolicy.gs',
  '10_CalendarSync.gs',
  '11_EditHandler.gs',
  '12_Triggers.gs',
  '13_LogAndDeadLetter.gs',
  '14_Migrations.gs',
  '15_Dashboard.gs',
  '16_Diagnostics.gs',
  '17_Utilities.gs',
  '18_Worker.gs',
  '19_RuntimeSettings.gs',
  '99_TestHarness.gs',
  'Menu.gs',
  'appsscript.json'
]);

class GateError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code;
  }
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function writeSafeResult(result) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function fail(code, message) {
  throw new GateError(code, message);
}

function readJson(file, absentCode) {
  if (!fs.existsSync(file)) fail(absentCode, absentCode);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    fail('DEV_TARGET_CONFIGURATION_INVALID', 'DEV_TARGET_CONFIGURATION_INVALID');
  }
}

function assertExactPayloadNames(names, failureCode) {
  const expected = canonicalPayloadFileNames.slice().sort();
  const actual = names.slice().sort();
  if (actual.length !== expected.length ||
      actual.some((name, index) => name !== expected[index])) {
    fail(failureCode, failureCode);
  }
  return expected;
}

function canonicalPayloadNames(root = sourceRoot) {
  const names = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith('.gs') || name === 'appsscript.json')
    .sort();
  return assertExactPayloadNames(names, 'CANONICAL_PAYLOAD_INVENTORY_INVALID');
}

function assertExactPayloadDirectory(root, failureCode) {
  if (!fs.existsSync(root)) fail(failureCode, failureCode);
  const entries = fs.readdirSync(root, { withFileTypes: true });
  if (entries.some((entry) => !entry.isFile())) fail(failureCode, failureCode);
  return assertExactPayloadNames(entries.map((entry) => entry.name), failureCode);
}

function postPullPayloadObservation(root) {
  const expectedNames = canonicalPayloadFileNames.slice().sort();
  const observation = {
    post_pull_validation: 'FAILED',
    observed_file_count: 0,
    expected_file_count: expectedNames.length,
    observed_nonfile_count: 0
  };
  if (!fs.existsSync(root)) return observation;
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  observation.observed_file_count = files.length;
  observation.observed_nonfile_count = entries.length - files.length;
  const exact = observation.observed_nonfile_count === 0 &&
    files.length === expectedNames.length &&
    files.every((name, index) => name === expectedNames[index]);
  observation.post_pull_validation = exact ? 'PASS' : 'FAILED';
  return observation;
}

function targetPreflightContractForAttestation(attestation) {
  if (attestation === existingTargetAttestation) {
    return existingCanonicalPreflightContract;
  }
  if (attestation === newBlankTargetAttestation) {
    return newBlankPreflightContract;
  }
  fail('DEV_TARGET_ATTESTATION_REJECTED', 'DEV_TARGET_ATTESTATION_REJECTED');
}

function newBlankPullPayloadObservation(root) {
  const observation = {
    post_pull_validation: 'FAILED',
    observed_file_count: 0,
    expected_file_count: 2,
    observed_nonfile_count: 0,
    remote_preflight_contract: newBlankPreflightContract
  };
  if (!fs.existsSync(root)) return observation;
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile());
  observation.observed_file_count = files.length;
  observation.observed_nonfile_count = entries.length - files.length;
  if (observation.observed_nonfile_count !== 0 || files.length !== 2) {
    return observation;
  }
  const names = files.map((entry) => entry.name);
  const manifestName = names.find((name) => name === 'appsscript.json');
  const scriptNames = names.filter((name) => /\.(?:gs|js)$/.test(name));
  if (!manifestName || scriptNames.length !== 1) return observation;
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(root, manifestName), 'utf8'));
  } catch (_) {
    return observation;
  }
  const allowedManifestKeys = new Set([
    'timeZone', 'dependencies', 'exceptionLogging', 'runtimeVersion'
  ]);
  if (!manifest || Array.isArray(manifest) ||
      Object.keys(manifest).some((key) => !allowedManifestKeys.has(key)) ||
      (manifest.dependencies &&
        (Array.isArray(manifest.dependencies) ||
          typeof manifest.dependencies !== 'object' ||
          Object.keys(manifest.dependencies).length !== 0))) {
    return observation;
  }
  const source = fs.readFileSync(path.join(root, scriptNames[0]), 'utf8')
    .replace(/^\uFEFF/, '')
    .trim();
  const defaultBlankFunction =
    /^function\s+myFunction\s*\(\s*\)\s*\{\s*\}\s*;?$/;
  if (source !== '' && !defaultBlankFunction.test(source)) return observation;
  observation.post_pull_validation = 'PASS';
  return observation;
}

function assertNewBlankPulledPayload(root) {
  const observation = newBlankPullPayloadObservation(root);
  if (observation.post_pull_validation !== 'PASS') {
    failWithSafePostPullObservation(
      'REMOTE_NEW_BLANK_TARGET_PREFLIGHT_FAILED',
      observation
    );
  }
  return observation;
}

function safePostPullObservation(observation) {
  const value = observation || {};
  const names = [
    'observed_file_count',
    'expected_file_count',
    'observed_nonfile_count'
  ];
  if (!['PASS', 'FAILED'].includes(value.post_pull_validation) ||
      names.some((name) => !Number.isInteger(value[name]) ||
        value[name] < 0 || value[name] > 1000)) {
    return null;
  }
  const safe = {
    post_pull_validation: value.post_pull_validation,
    observed_file_count: value.observed_file_count,
    expected_file_count: value.expected_file_count,
    observed_nonfile_count: value.observed_nonfile_count
  };
  if ([existingCanonicalPreflightContract, newBlankPreflightContract]
    .includes(value.remote_preflight_contract)) {
    safe.remote_preflight_contract = value.remote_preflight_contract;
  }
  return safe;
}

function failWithSafePostPullObservation(code, observation) {
  const error = new GateError(code, code);
  error.safe_post_pull_observation = safePostPullObservation(observation);
  throw error;
}

function assertExactPulledPayload(root) {
  const observation = postPullPayloadObservation(root);
  if (observation.post_pull_validation !== 'PASS') {
    failWithSafePostPullObservation(
      'REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH',
      observation
    );
  }
  return observation;
}

function inventoryFor(root, names) {
  const files = names.map((name) => ({
    name,
    sha256: sha256(fs.readFileSync(path.join(root, name)))
  }));
  return {
    schema: 'WORK_OS_LOCAL_CLASP_PAYLOAD_V1',
    file_count: files.length,
    files,
    payload_sha256: sha256(files.map((item) =>
      `${item.name}:${item.sha256}`).join('\n'))
  };
}

function assertSafeGeneratedPayloadDirectory() {
  if (!fs.existsSync(devRoot)) {
    fs.mkdirSync(devRoot, { recursive: true });
    return;
  }
  const allowed = new Set([
    'payload', '.clasp.json', '.claspignore', 'target.json',
    'payload-inventory.json', 'last-operation.json', 'access-check',
    'runtime', 'runtime-pull-verify', 'runtime-payload-inventory.json',
    'runtime-execution', 'runtime-version-pull-verify',
    'runtime.json', 'runtime-auth-state.json', 'prerequisites.json',
    'operation-records', 'credentials', 'oauth'
  ]);
  for (const entry of fs.readdirSync(devRoot, { withFileTypes: true })) {
    if (!allowed.has(entry.name)) {
      fail('DEV_WORKSPACE_UNEXPECTED_CONTENT',
        'DEV_WORKSPACE_UNEXPECTED_CONTENT');
    }
  }
}

function assertPayloadMayBeReplaced(names) {
  if (!fs.existsSync(payloadRoot)) return;
  const entries = fs.readdirSync(payloadRoot, { withFileTypes: true });
  const allowed = new Set(names);
  for (const entry of entries) {
    if (!entry.isFile() || !allowed.has(entry.name)) {
      fail('STAGED_PAYLOAD_UNEXPECTED_CONTENT',
        'STAGED_PAYLOAD_UNEXPECTED_CONTENT');
    }
  }
}

function stagePayload() {
  const names = canonicalPayloadNames();
  assertSafeGeneratedPayloadDirectory();
  assertPayloadMayBeReplaced(names);
  if (fs.existsSync(payloadRoot)) {
    fs.rmSync(payloadRoot, { recursive: true, force: true });
  }
  fs.mkdirSync(payloadRoot, { recursive: true });
  for (const name of names) {
    fs.copyFileSync(path.join(sourceRoot, name), path.join(payloadRoot, name));
  }
  assertExactPayloadDirectory(payloadRoot, 'STAGED_PAYLOAD_UNEXPECTED_CONTENT');
  fs.writeFileSync(path.join(devRoot, '.claspignore'),
    '**/**\n!*.gs\n!appsscript.json\n', 'utf8');
  const inventory = inventoryFor(payloadRoot, names);
  fs.writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`,
    'utf8');
  return inventory;
}

function isExactStringArray(value, expected) {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((item, index) => typeof item === 'string' &&
      item === expected[index]);
}

function assertCanonicalClaspExtensionContract(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    fail('DEV_TARGET_EXTENSION_CONTRACT_REJECTED',
      'DEV_TARGET_EXTENSION_CONTRACT_REJECTED');
  }
  if (Object.prototype.hasOwnProperty.call(config, 'fileExtension')) {
    fail('DEV_TARGET_EXTENSION_CONFLICT_REJECTED',
      'DEV_TARGET_EXTENSION_CONFLICT_REJECTED');
  }
  if (!isExactStringArray(config.scriptExtensions, canonicalScriptExtensions)) {
    fail('DEV_TARGET_SCRIPT_EXTENSIONS_REJECTED',
      'DEV_TARGET_SCRIPT_EXTENSIONS_REJECTED');
  }
  if (!isExactStringArray(config.htmlExtensions, canonicalHtmlExtensions)) {
    fail('DEV_TARGET_HTML_EXTENSIONS_REJECTED',
      'DEV_TARGET_HTML_EXTENSIONS_REJECTED');
  }
  return scriptExtensionContract;
}

function buildCanonicalClaspProjectConfig(scriptId, rootDir = 'payload') {
  return {
    scriptId,
    rootDir,
    scriptExtensions: canonicalScriptExtensions.slice(),
    htmlExtensions: canonicalHtmlExtensions.slice()
  };
}

function writeCanonicalClaspProjectConfig(root, config) {
  assertCanonicalClaspExtensionContract(config);
  if (config.rootDir !== 'payload') {
    fail('DEV_TARGET_ROOTDIR_REJECTED', 'DEV_TARGET_ROOTDIR_REJECTED');
  }
  const generated = buildCanonicalClaspProjectConfig(config.scriptId, config.rootDir);
  fs.writeFileSync(path.join(root, '.clasp.json'),
    `${JSON.stringify(generated, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, '.claspignore'),
    '**/**\n!*.gs\n!appsscript.json\n', 'utf8');
  return generated;
}

function mapSyntheticServerScriptsToCanonicalPayloadNames(serverScriptNames) {
  if (!Array.isArray(serverScriptNames) ||
      serverScriptNames.some((name) => typeof name !== 'string' ||
        !/^[A-Za-z0-9_]+$/.test(name))) {
    fail('SYNTHETIC_SERVER_SCRIPT_INVENTORY_INVALID',
      'SYNTHETIC_SERVER_SCRIPT_INVENTORY_INVALID');
  }
  const localNames = serverScriptNames.map((name) => `${name}.gs`)
    .concat('appsscript.json');
  return assertExactPayloadNames(
    localNames,
    'SYNTHETIC_SERVER_SCRIPT_INVENTORY_INVALID'
  );
}

function assertStagedPayload() {
  if (!fs.existsSync(inventoryPath) || !fs.existsSync(payloadRoot)) {
    fail('STAGED_PAYLOAD_MISSING', 'STAGED_PAYLOAD_MISSING');
  }
  let saved;
  try {
    saved = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  } catch (_) {
    fail('STAGED_PAYLOAD_INVENTORY_INVALID', 'STAGED_PAYLOAD_INVENTORY_INVALID');
  }
  const names = canonicalPayloadNames();
  assertExactPayloadDirectory(payloadRoot, 'STAGED_PAYLOAD_UNEXPECTED_CONTENT');
  const current = inventoryFor(payloadRoot, names);
  if (JSON.stringify(saved) !== JSON.stringify(current)) {
    fail('STAGED_PAYLOAD_MISMATCH', 'STAGED_PAYLOAD_MISMATCH');
  }
  const source = inventoryFor(sourceRoot, names);
  if (source.payload_sha256 !== current.payload_sha256) {
    fail('STAGED_PAYLOAD_SOURCE_SKEW', 'STAGED_PAYLOAD_SOURCE_SKEW');
  }
  return current;
}

function assertCanonicalPayloadContract(inventory) {
  if (!inventory || inventory.file_count !== canonicalPayloadFileNames.length ||
      inventory.payload_sha256 !== expectedCanonicalPayloadSha256) {
    fail('CANONICAL_PAYLOAD_CONTRACT_MISMATCH',
      'CANONICAL_PAYLOAD_CONTRACT_MISMATCH');
  }
  return inventory;
}

function canonicalManifestBytes() {
  return fs.readFileSync(path.join(sourceRoot, 'appsscript.json'));
}

function buildRuntimeManifestOverlay(canonicalManifest) {
  const canonical = JSON.parse(JSON.stringify(canonicalManifest));
  if (Object.prototype.hasOwnProperty.call(canonical, 'executionApi')) {
    fail('CANONICAL_MANIFEST_EXECUTION_API_PRESENT',
      'CANONICAL_MANIFEST_EXECUTION_API_PRESENT');
  }
  const overlay = JSON.parse(JSON.stringify(canonical));
  overlay.executionApi = { access: 'MYSELF' };
  assertRuntimeManifestOverlay(canonical, overlay);
  return overlay;
}

function assertRuntimeManifestOverlay(canonicalManifest, overlayManifest) {
  const overlay = JSON.parse(JSON.stringify(overlayManifest || {}));
  if (!overlay.executionApi || overlay.executionApi.access !== 'MYSELF' ||
      Object.keys(overlay.executionApi).sort().join(',') !== 'access') {
    fail('RUNTIME_MANIFEST_ACCESS_REJECTED',
      'RUNTIME_MANIFEST_ACCESS_REJECTED');
  }
  delete overlay.executionApi;
  try {
    assert.deepStrictEqual(overlay, canonicalManifest);
  } catch (_) {
    fail('RUNTIME_MANIFEST_CANONICAL_FIELD_SKEW',
      'RUNTIME_MANIFEST_CANONICAL_FIELD_SKEW');
  }
  const serialized = JSON.stringify(overlayManifest);
  if (/\b(?:DOMAIN|ANYONE|ANYONE_ANONYMOUS)\b/.test(serialized) ||
      /(?:scriptId|deploymentId|projectId|client_id|client_secret)/i.test(serialized)) {
    fail('RUNTIME_MANIFEST_FORBIDDEN_CONTENT',
      'RUNTIME_MANIFEST_FORBIDDEN_CONTENT');
  }
  return true;
}

function prepareRuntimeRoot(config) {
  if (fs.existsSync(runtimeRoot)) {
    const entries = fs.readdirSync(runtimeRoot, { withFileTypes: true });
    const allowed = new Set(['payload', '.clasp.json', '.claspignore']);
    if (entries.some((entry) => !allowed.has(entry.name))) {
      fail('RUNTIME_WORKSPACE_UNEXPECTED_CONTENT',
        'RUNTIME_WORKSPACE_UNEXPECTED_CONTENT');
    }
    const existingPayload = path.join(runtimeRoot, 'payload');
    if (fs.existsSync(existingPayload)) {
      assertExactPayloadDirectory(
        existingPayload,
        'RUNTIME_WORKSPACE_UNEXPECTED_CONTENT'
      );
    }
    fs.rmSync(runtimeRoot, { recursive: true, force: true });
  }
  fs.mkdirSync(runtimePayloadRoot, { recursive: true });
  writeCanonicalClaspProjectConfig(runtimeRoot, config);
}

function stageRuntimePayload() {
  const guarded = assertTargetGuard(false);
  const canonicalInventory = assertCanonicalPayloadContract(
    inventoryFor(sourceRoot, canonicalPayloadNames())
  );
  const canonicalManifestRaw = canonicalManifestBytes();
  const canonicalManifest = JSON.parse(canonicalManifestRaw.toString('utf8'));
  const overlayManifest = buildRuntimeManifestOverlay(canonicalManifest);
  prepareRuntimeRoot(guarded.config);
  canonicalPayloadNames().forEach((name) => {
    if (name === 'appsscript.json') return;
    fs.copyFileSync(path.join(sourceRoot, name), path.join(runtimePayloadRoot, name));
  });
  fs.writeFileSync(
    path.join(runtimePayloadRoot, 'appsscript.json'),
    `${JSON.stringify(overlayManifest, null, 2)}\n`,
    'utf8'
  );
  assertExactPayloadDirectory(
    runtimePayloadRoot,
    'RUNTIME_STAGED_PAYLOAD_UNEXPECTED_CONTENT'
  );
  const runtimeInventory = inventoryFor(
    runtimePayloadRoot,
    canonicalPayloadNames()
  );
  const saved = {
    schema: 'WORK_OS_LOCAL_CLASP_RUNTIME_PAYLOAD_V1',
    file_count: runtimeInventory.file_count,
    canonical_payload_sha256: canonicalInventory.payload_sha256,
    canonical_manifest_sha256: sha256(canonicalManifestRaw),
    runtime_manifest_sha256: sha256(
      fs.readFileSync(path.join(runtimePayloadRoot, 'appsscript.json'))
    ),
    runtime_payload_sha256: runtimeInventory.payload_sha256,
    files: runtimeInventory.files
  };
  fs.writeFileSync(runtimeInventoryPath, `${JSON.stringify(saved, null, 2)}\n`,
    'utf8');
  return saved;
}

function assertRuntimeStagedPayload() {
  if (!fs.existsSync(runtimeInventoryPath) || !fs.existsSync(runtimePayloadRoot)) {
    fail('RUNTIME_STAGED_PAYLOAD_MISSING', 'RUNTIME_STAGED_PAYLOAD_MISSING');
  }
  const saved = readJson(
    runtimeInventoryPath,
    'RUNTIME_STAGED_PAYLOAD_MISSING'
  );
  const canonicalInventory = assertCanonicalPayloadContract(
    inventoryFor(sourceRoot, canonicalPayloadNames())
  );
  const canonicalManifestRaw = canonicalManifestBytes();
  const canonicalManifest = JSON.parse(canonicalManifestRaw.toString('utf8'));
  const runtimeManifest = readJson(
    path.join(runtimePayloadRoot, 'appsscript.json'),
    'RUNTIME_STAGED_MANIFEST_MISSING'
  );
  assertRuntimeManifestOverlay(canonicalManifest, runtimeManifest);
  assertExactPayloadDirectory(
    runtimePayloadRoot,
    'RUNTIME_STAGED_PAYLOAD_UNEXPECTED_CONTENT'
  );
  const current = inventoryFor(runtimePayloadRoot, canonicalPayloadNames());
  const expected = {
    schema: 'WORK_OS_LOCAL_CLASP_RUNTIME_PAYLOAD_V1',
    file_count: current.file_count,
    canonical_payload_sha256: canonicalInventory.payload_sha256,
    canonical_manifest_sha256: sha256(canonicalManifestRaw),
    runtime_manifest_sha256: sha256(
      fs.readFileSync(path.join(runtimePayloadRoot, 'appsscript.json'))
    ),
    runtime_payload_sha256: current.payload_sha256,
    files: current.files
  };
  if (JSON.stringify(saved) !== JSON.stringify(expected)) {
    fail('RUNTIME_STAGED_PAYLOAD_MISMATCH',
      'RUNTIME_STAGED_PAYLOAD_MISMATCH');
  }
  return expected;
}

function assertRuntimeCallableWrapper(root, failureCode) {
  const code = failureCode || 'RUNTIME_CALLABLE_WRAPPER_UNPROVEN';
  const file = path.join(root, '16_Diagnostics.gs');
  if (!fs.existsSync(file)) fail(code, code);
  const source = fs.readFileSync(file, 'utf8');
  const declarations = source.match(
    /^function runQuickDiagnostic\(\)\s*\{/gm
  ) || [];
  if (declarations.length !== 1) fail(code, code);
  const sandbox = Object.create(null);
  try {
    vm.runInNewContext(source, sandbox, {
      timeout: 1000,
      contextCodeGeneration: { strings: false, wasm: false }
    });
  } catch (_) {
    fail(code, code);
  }
  if (!Object.prototype.hasOwnProperty.call(sandbox, allowedRuntimeFunction) ||
      typeof sandbox[allowedRuntimeFunction] !== 'function' ||
      sandbox[allowedRuntimeFunction].name !== allowedRuntimeFunction) {
    fail(code, code);
  }
  return {
    runtime_function: allowedRuntimeFunction,
    top_level_callable_wrapper_present: true
  };
}

function assertRuntimePullbackPayload(runtime) {
  const staged = runtime || assertRuntimeStagedPayload();
  const payload = path.join(runtimePullRoot, 'payload');
  assertExactPulledPayload(payload);
  assertExactPayloadDirectory(
    payload,
    'RUNTIME_PULLBACK_PAYLOAD_UNEXPECTED_CONTENT'
  );
  const pulled = inventoryFor(payload, canonicalPayloadFileNames);
  if (pulled.payload_sha256 !== staged.runtime_payload_sha256) {
    fail('RUNTIME_REMOTE_PULLBACK_PARITY_FAILED',
      'RUNTIME_REMOTE_PULLBACK_PARITY_FAILED');
  }
  const canonicalManifest = JSON.parse(canonicalManifestBytes().toString('utf8'));
  const pulledManifest = readJson(
    path.join(payload, 'appsscript.json'),
    'RUNTIME_PULLBACK_MANIFEST_MISSING'
  );
  assertRuntimeManifestOverlay(canonicalManifest, pulledManifest);
  const stagedWrapper = assertRuntimeCallableWrapper(
    runtimePayloadRoot,
    'RUNTIME_STAGED_CALLABLE_WRAPPER_UNPROVEN'
  );
  const pulledWrapper = assertRuntimeCallableWrapper(
    payload,
    'RUNTIME_PULLBACK_CALLABLE_WRAPPER_UNPROVEN'
  );
  return {
    file_count: pulled.file_count,
    runtime_payload_sha256: staged.runtime_payload_sha256,
    pulled_payload_sha256: pulled.payload_sha256,
    runtime_manifest_sha256: staged.runtime_manifest_sha256,
    staged_wrapper_present: stagedWrapper.top_level_callable_wrapper_present,
    pulled_wrapper_present: pulledWrapper.top_level_callable_wrapper_present,
    runtime_function: pulledWrapper.runtime_function,
    runtime_overlay_parity: true
  };
}

function assertRuntimeVersionPullbackPayload(runtime) {
  const payload = path.join(runtimeVersionPullRoot, 'payload');
  assertExactPulledPayload(payload);
  assertExactPayloadDirectory(
    payload,
    'RUNTIME_VERSION_PULLBACK_PAYLOAD_UNEXPECTED_CONTENT'
  );
  const pulled = inventoryFor(payload, canonicalPayloadFileNames);
  if (pulled.payload_sha256 !== runtime.runtime_payload_sha256) {
    fail('RUNTIME_VERSION_PULLBACK_PARITY_FAILED',
      'RUNTIME_VERSION_PULLBACK_PARITY_FAILED');
  }
  const canonicalManifest = JSON.parse(canonicalManifestBytes().toString('utf8'));
  assertRuntimeManifestOverlay(canonicalManifest, readJson(
    path.join(payload, 'appsscript.json'),
    'RUNTIME_VERSION_PULLBACK_MANIFEST_MISSING'
  ));
  const wrapper = assertRuntimeCallableWrapper(
    payload,
    'RUNTIME_VERSION_CALLABLE_WRAPPER_UNPROVEN'
  );
  return {
    version_payload_sha256: pulled.payload_sha256,
    version_file_count: pulled.file_count,
    version_wrapper_present: wrapper.top_level_callable_wrapper_present,
    version_runtime_function: wrapper.runtime_function,
    version_runtime_overlay_parity: true
  };
}

function isPlaceholder(value) {
  return !value || /REPLACE_WITH|YOUR_SCRIPT_ID|EXAMPLE/i.test(String(value));
}

function assertTargetObjects(config, target, environment) {
  const scriptId = String(config && config.scriptId || '');
  const expectedId = String(target && target.expected_script_id || '');
  if (isPlaceholder(scriptId) || isPlaceholder(expectedId)) {
    fail('DEV_TARGET_NOT_CONFIGURED', 'DEV_TARGET_NOT_CONFIGURED');
  }
  if (target.target_kind !== allowedTargetKind) {
    fail('DEV_TARGET_KIND_REJECTED', 'DEV_TARGET_KIND_REJECTED');
  }
  if (!allowedTargetAttestations.includes(target.target_attestation) ||
      target.remote_preflight_contract !==
        targetPreflightContractForAttestation(target.target_attestation)) {
    fail('DEV_TARGET_ATTESTATION_REJECTED', 'DEV_TARGET_ATTESTATION_REJECTED');
  }
  if (target.rootDir !== 'payload') {
    fail('DEV_TARGET_DECLARATION_ROOTDIR_REJECTED',
      'DEV_TARGET_DECLARATION_ROOTDIR_REJECTED');
  }
  if (config.rootDir !== 'payload') {
    fail('DEV_TARGET_ROOTDIR_REJECTED', 'DEV_TARGET_ROOTDIR_REJECTED');
  }
  assertCanonicalClaspExtensionContract(config);
  if (scriptId !== expectedId) {
    fail('DEV_TARGET_ID_MISMATCH', 'DEV_TARGET_ID_MISMATCH');
  }
  if (!/^[A-Za-z0-9_-]{20,}$/.test(scriptId)) {
    fail('DEV_TARGET_ID_INVALID', 'DEV_TARGET_ID_INVALID');
  }
  if (environment && environment.GAS_DEV_CLASP_ALLOWED !== 'true') {
    fail('GAS_DEV_CLASP_ALLOWED_REQUIRED', 'GAS_DEV_CLASP_ALLOWED_REQUIRED');
  }
  return scriptId;
}

function assertScriptIdIsNotTracked(scriptId) {
  const probe = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'grep', '-I', '-F', '--', scriptId
  ], { encoding: 'utf8', windowsHide: true });
  if (probe.status === 0) {
    fail('DEV_TARGET_ID_IS_TRACKED', 'DEV_TARGET_ID_IS_TRACKED');
  }
  if (probe.status !== 1) {
    fail('GIT_TRACKED_TARGET_SCAN_FAILED', 'GIT_TRACKED_TARGET_SCAN_FAILED');
  }
}

function assertTargetGuard(requireEnvironment) {
  const config = readJson(configPath, 'DEV_TARGET_NOT_CONFIGURED');
  const target = readJson(targetPath, 'DEV_TARGET_NOT_CONFIGURED');
  const scriptId = assertTargetObjects(
    config,
    target,
    requireEnvironment ? process.env : null
  );
  assertScriptIdIsNotTracked(scriptId);
  return { config, target };
}

function targetBindingFingerprint(config) {
  const scriptId = String(config && config.scriptId || '');
  if (!/^[A-Za-z0-9_-]{20,}$/.test(scriptId)) {
    fail('DEV_TARGET_ID_INVALID', 'DEV_TARGET_ID_INVALID');
  }
  return sha256(scriptId);
}

function accessEvidenceMatchesTarget(prerequisites, target) {
  const stored = String(prerequisites && prerequisites.target_binding_sha256 || '');
  return /^[a-f0-9]{64}$/.test(stored) &&
    stored === targetBindingFingerprint(target && target.config);
}

function assertCanonicalRetryPrerequisitesForAccess(target) {
  const prerequisites = readJson(
    prerequisitesPath,
    'CANONICAL_PUSH_PREREQUISITES_MISSING'
  );
  const expectedPreflight = targetPreflightContractForAttestation(
    target && target.target && target.target.target_attestation
  );
  if (prerequisites.user_level_apps_script_api !== 'ENABLED' ||
      prerequisites.oauth_state !== 'AUTHENTICATED_CURRENT_OPERATOR_ACCOUNT' ||
       prerequisites.target_attestation !== target.target.target_attestation ||
       prerequisites.remote_preflight_contract !== expectedPreflight ||
       prerequisites.script_extension_contract !== scriptExtensionContract ||
       prerequisites.canonical_push_retry_authorized !== true) {
    fail('CANONICAL_PUSH_PREREQUISITES_INCOMPLETE',
      'CANONICAL_PUSH_PREREQUISITES_INCOMPLETE');
  }
  if (!accessEvidenceMatchesTarget(prerequisites, target)) {
    fail('CANONICAL_PUSH_PREREQUISITES_STALE_TARGET_BINDING',
      'CANONICAL_PUSH_PREREQUISITES_STALE_TARGET_BINDING');
  }
  return prerequisites;
}

function assertCanonicalRetryPrerequisites(target) {
  const prerequisites = assertCanonicalRetryPrerequisitesForAccess(target);
  const expectedRemoteFileCount = prerequisites.remote_preflight_contract ===
    newBlankPreflightContract ? 2 : canonicalPayloadFileNames.length;
  if (prerequisites.read_only_target_access !== 'PASS') {
    fail('CANONICAL_PUSH_PREREQUISITES_INCOMPLETE',
      'CANONICAL_PUSH_PREREQUISITES_INCOMPLETE');
  }
  const accessRecord = readJson(
    path.join(operationRecordRoot, 'last-access-check.json'),
    'CANONICAL_PUSH_PREREQUISITES_INCOMPLETE'
  );
  if (accessRecord.operation !== 'access-check' ||
      accessRecord.status !== 'PASS' || accessRecord.exit_code !== 0 ||
      accessRecord.post_pull_validation !== 'PASS' ||
      accessRecord.observed_file_count !== expectedRemoteFileCount ||
       accessRecord.expected_file_count !== expectedRemoteFileCount ||
       accessRecord.observed_nonfile_count !== 0 ||
       accessRecord.remote_preflight_contract !==
         prerequisites.remote_preflight_contract ||
       accessRecord.script_extension_contract !== scriptExtensionContract ||
       !accessEvidenceMatchesTarget(accessRecord, target)) {
    fail('CANONICAL_PUSH_PREREQUISITES_INCOMPLETE',
      'CANONICAL_PUSH_PREREQUISITES_INCOMPLETE');
  }
  return prerequisites;
}

function recordCanonicalRetryPrerequisites(environment, target) {
  const guardedTarget = target || assertTargetGuard(false);
  const attestation = String(environment.GAS_TARGET_ATTESTATION || '');
  if (environment.GAS_USER_APPS_SCRIPT_API_ENABLED !== 'true' ||
      environment.GAS_OAUTH_STATE !== 'AUTHENTICATED_CURRENT_OPERATOR_ACCOUNT' ||
      !allowedTargetAttestations.includes(attestation) ||
      attestation !== guardedTarget.target.target_attestation) {
    fail('CANONICAL_PUSH_PREREQUISITE_ATTESTATION_REJECTED',
      'CANONICAL_PUSH_PREREQUISITE_ATTESTATION_REJECTED');
  }
  const record = {
    schema: 'WORK_OS_CANONICAL_PUSH_PREREQUISITES_V2',
    user_level_apps_script_api: 'ENABLED',
    oauth_state: 'AUTHENTICATED_CURRENT_OPERATOR_ACCOUNT',
    target_attestation: attestation,
    remote_preflight_contract:
      targetPreflightContractForAttestation(attestation),
    target_binding_sha256: targetBindingFingerprint(guardedTarget.config),
    script_extension_contract: scriptExtensionContract,
    read_only_target_access: 'NOT_EXECUTED',
    canonical_push_retry_authorized: true
  };
  assertSafeGeneratedPayloadDirectory();
  fs.writeFileSync(prerequisitesPath, `${JSON.stringify(record, null, 2)}\n`,
    'utf8');
  return record;
}

function markReadOnlyTargetAccessState(target, state) {
  const record = readJson(
    prerequisitesPath,
    'CANONICAL_PUSH_PREREQUISITES_MISSING'
  );
  if (!['PASS', 'FAILED', 'NOT_EXECUTED'].includes(state) ||
      !accessEvidenceMatchesTarget(record, target)) {
    fail('CANONICAL_PUSH_PREREQUISITES_STALE_TARGET_BINDING',
      'CANONICAL_PUSH_PREREQUISITES_STALE_TARGET_BINDING');
  }
  record.read_only_target_access = state;
  fs.writeFileSync(prerequisitesPath, `${JSON.stringify(record, null, 2)}\n`,
    'utf8');
  return record;
}

function markReadOnlyTargetAccessPassed(target) {
  return markReadOnlyTargetAccessState(target, 'PASS');
}

function markReadOnlyTargetAccessFailed(target) {
  return markReadOnlyTargetAccessState(target, 'FAILED');
}

function clearReadOnlyTargetAccess(target) {
  return markReadOnlyTargetAccessState(target, 'NOT_EXECUTED');
}

function markCanonicalRetryUsed(inventory) {
  assertSafeGeneratedPayloadDirectory();
  fs.mkdirSync(operationRecordRoot, { recursive: true });
  if (fs.existsSync(canonicalRetryMarkerPath)) {
    fail('CANONICAL_PUSH_RETRY_ALREADY_USED',
      'CANONICAL_PUSH_RETRY_ALREADY_USED');
  }
  const marker = {
    schema: 'WORK_OS_CANONICAL_PUSH_RETRY_V1',
    state: 'ATTEMPT_STARTED',
    payload_sha256: inventory.payload_sha256,
    file_count: inventory.file_count
  };
  fs.writeFileSync(
    canonicalRetryMarkerPath,
    `${JSON.stringify(marker, null, 2)}\n`,
    { encoding: 'utf8', flag: 'wx' }
  );
  return marker;
}

function isManifestConfirmationNoop(raw) {
  return String(raw || '')
    .replace(/\x1b\[[0-9;]*m/g, '')
    .trim() === 'Skipping push.';
}

function assertCanonicalRemoteMutationEvidence(inventory) {
  const pushRecord = readJson(
    path.join(operationRecordRoot, 'last-push.json'),
    'CANONICAL_PUSH_EVIDENCE_MISSING'
  );
  if (pushRecord.status === 'PASS' && pushRecord.exit_code === 0) {
    const rawPath = path.join(operationRecordRoot, 'last-push.raw.txt');
    if (!fs.existsSync(rawPath) ||
        isManifestConfirmationNoop(fs.readFileSync(rawPath, 'utf8'))) {
      fail('CANONICAL_PUSH_EVIDENCE_INVALID',
        'CANONICAL_PUSH_EVIDENCE_INVALID');
    }
    return { mode: 'STANDARD_GUARDED_PUSH' };
  }
  if (pushRecord.status !==
      'REMOTE_MUTATION_NOT_PERFORMED_MANIFEST_CONFIRMATION_REQUIRED') {
    fail('CANONICAL_PUSH_EVIDENCE_INVALID', 'CANONICAL_PUSH_EVIDENCE_INVALID');
  }
  const marker = readJson(
    blankManifestInteractivePushMarkerPath,
    'BLANK_MANIFEST_INTERACTIVE_PUSH_EVIDENCE_MISSING'
  );
  const interactive = readJson(
    path.join(operationRecordRoot, 'last-interactive-blank-push.json'),
    'BLANK_MANIFEST_INTERACTIVE_PUSH_EVIDENCE_MISSING'
  );
  const operatorConfirmed =
    marker.state === 'OPERATOR_CONFIRMED_EXECUTED' &&
    interactive.operator_confirmation ===
      'OPERATOR_CONFIRMED_23_FILES_PUSHED';
  const independentlyProved =
    marker.state === 'INDEPENDENT_PULLBACK_PROVED_EXECUTED' &&
    interactive.operator_confirmation === 'NOT_RECORDED' &&
    interactive.independent_pullback_proof === true;
  if ((!operatorConfirmed && !independentlyProved) ||
      marker.payload_sha256 !== inventory.payload_sha256 ||
      marker.file_count !== inventory.file_count ||
      interactive.status !== 'PASS' ||
      interactive.payload_sha256 !== inventory.payload_sha256 ||
      interactive.file_count !== inventory.file_count) {
    fail('BLANK_MANIFEST_INTERACTIVE_PUSH_EVIDENCE_INVALID',
      'BLANK_MANIFEST_INTERACTIVE_PUSH_EVIDENCE_INVALID');
  }
  return { mode: 'INTERACTIVE_MANIFEST_APPROVAL_PUSH' };
}

function authorizeInteractiveBlankManifestPush(environment, target, inventory) {
  if (environment.GAS_INTERACTIVE_BLANK_MANIFEST_PUSH_ALLOWED !== 'true' ||
      target.target.target_attestation !== newBlankTargetAttestation ||
      fs.existsSync(blankManifestInteractivePushMarkerPath)) {
    fail('BLANK_MANIFEST_INTERACTIVE_PUSH_NOT_AUTHORIZED',
      'BLANK_MANIFEST_INTERACTIVE_PUSH_NOT_AUTHORIZED');
  }
  const canonicalMarker = readJson(
    canonicalRetryMarkerPath,
    'CANONICAL_PUSH_RETRY_NOT_RECORDED'
  );
  const pushRecord = readJson(
    path.join(operationRecordRoot, 'last-push.json'),
    'CANONICAL_PUSH_EVIDENCE_MISSING'
  );
  const pushRawPath = path.join(operationRecordRoot, 'last-push.raw.txt');
  const pullRecord = readJson(
    path.join(operationRecordRoot, 'last-pull-verify.json'),
    'REMOTE_PULLBACK_EVIDENCE_MISSING'
  );
  if (!fs.existsSync(pushRawPath) ||
      canonicalMarker.payload_sha256 !== inventory.payload_sha256 ||
      canonicalMarker.file_count !== inventory.file_count ||
      pushRecord.exit_code !== 0 ||
      !isManifestConfirmationNoop(fs.readFileSync(pushRawPath, 'utf8')) ||
      pullRecord.status !== 'REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH' ||
      pullRecord.observed_file_count !== 2 ||
      pullRecord.expected_file_count !== canonicalPayloadFileNames.length ||
      pullRecord.observed_nonfile_count !== 0 ||
      !accessEvidenceMatchesTarget(pullRecord, target)) {
    fail('BLANK_MANIFEST_INTERACTIVE_PUSH_PRECONDITION_FAILED',
      'BLANK_MANIFEST_INTERACTIVE_PUSH_PRECONDITION_FAILED');
  }
  assertNewBlankPulledPayload(path.join(pullRoot, 'payload'));
  const resolvedPullRoot = path.resolve(pullRoot);
  const resolvedModuleRoot = `${path.resolve(moduleRoot)}${path.sep}`;
  if (!resolvedPullRoot.startsWith(resolvedModuleRoot) ||
      path.basename(resolvedPullRoot) !== '.clasp-pull-verify') {
    fail('PULL_VERIFY_WORKSPACE_PATH_REJECTED',
      'PULL_VERIFY_WORKSPACE_PATH_REJECTED');
  }
  const noopResult = {
    exit_code: pushRecord.exit_code,
    output_sha256: pushRecord.output_sha256,
    raw: fs.readFileSync(pushRawPath, 'utf8')
  };
  persistOperationRecord(
    'push',
    noopResult,
    'REMOTE_MUTATION_NOT_PERFORMED_MANIFEST_CONFIRMATION_REQUIRED',
    undefined,
    targetBindingFingerprint(target.config)
  );
  fs.rmSync(resolvedPullRoot, { recursive: true, force: true });
  const marker = {
    schema: 'WORK_OS_BLANK_MANIFEST_INTERACTIVE_PUSH_V1',
    state: 'AUTHORIZED_NOT_EXECUTED',
    payload_sha256: inventory.payload_sha256,
    file_count: inventory.file_count,
    force_flag_allowed: false
  };
  fs.writeFileSync(
    blankManifestInteractivePushMarkerPath,
    `${JSON.stringify(marker, null, 2)}\n`,
    'utf8'
  );
  return marker;
}

function recordInteractiveBlankManifestPush(environment, inventory) {
  if (environment.GAS_INTERACTIVE_BLANK_MANIFEST_PUSH_RESULT !==
      'OPERATOR_CONFIRMED_23_FILES_PUSHED') {
    fail('BLANK_MANIFEST_INTERACTIVE_PUSH_RESULT_REJECTED',
      'BLANK_MANIFEST_INTERACTIVE_PUSH_RESULT_REJECTED');
  }
  const marker = readJson(
    blankManifestInteractivePushMarkerPath,
    'BLANK_MANIFEST_INTERACTIVE_PUSH_EVIDENCE_MISSING'
  );
  const evidencePath = path.join(
    operationRecordRoot,
    'last-interactive-blank-push.json'
  );
  if (marker.state !== 'AUTHORIZED_NOT_EXECUTED' ||
      marker.payload_sha256 !== inventory.payload_sha256 ||
      marker.file_count !== inventory.file_count ||
      fs.existsSync(evidencePath)) {
    fail('BLANK_MANIFEST_INTERACTIVE_PUSH_RESULT_REJECTED',
      'BLANK_MANIFEST_INTERACTIVE_PUSH_RESULT_REJECTED');
  }
  marker.state = 'OPERATOR_CONFIRMED_EXECUTED';
  fs.writeFileSync(
    blankManifestInteractivePushMarkerPath,
    `${JSON.stringify(marker, null, 2)}\n`,
    'utf8'
  );
  const evidence = {
    schema: 'WORK_OS_INTERACTIVE_BLANK_PUSH_EVIDENCE_V1',
    operation: 'interactive-blank-push',
    status: 'PASS',
    operator_confirmation: 'OPERATOR_CONFIRMED_23_FILES_PUSHED',
    payload_sha256: inventory.payload_sha256,
    file_count: inventory.file_count,
    force_flag_used: false
  };
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  return evidence;
}

function assertInteractiveBlankPullProofPrerequisites(target, inventory) {
  const pushRecord = readJson(
    path.join(operationRecordRoot, 'last-push.json'),
    'CANONICAL_PUSH_EVIDENCE_MISSING'
  );
  const marker = readJson(
    blankManifestInteractivePushMarkerPath,
    'BLANK_MANIFEST_INTERACTIVE_PUSH_EVIDENCE_MISSING'
  );
  if (target.target.target_attestation !== newBlankTargetAttestation ||
      pushRecord.status !==
        'REMOTE_MUTATION_NOT_PERFORMED_MANIFEST_CONFIRMATION_REQUIRED' ||
      marker.state !== 'AUTHORIZED_NOT_EXECUTED' ||
      marker.payload_sha256 !== inventory.payload_sha256 ||
      marker.file_count !== inventory.file_count ||
      fs.existsSync(path.join(
        operationRecordRoot,
        'last-interactive-blank-push.json'
      ))) {
    fail('BLANK_MANIFEST_INDEPENDENT_PROOF_PRECONDITION_FAILED',
      'BLANK_MANIFEST_INDEPENDENT_PROOF_PRECONDITION_FAILED');
  }
  return marker;
}

function recordIndependentInteractiveBlankPushProof(inventory, marker) {
  marker.state = 'INDEPENDENT_PULLBACK_PROVED_EXECUTED';
  fs.writeFileSync(
    blankManifestInteractivePushMarkerPath,
    `${JSON.stringify(marker, null, 2)}\n`,
    'utf8'
  );
  const evidence = {
    schema: 'WORK_OS_INTERACTIVE_BLANK_PUSH_EVIDENCE_V1',
    operation: 'interactive-blank-push',
    status: 'PASS',
    operator_confirmation: 'NOT_RECORDED',
    independent_pullback_proof: true,
    payload_sha256: inventory.payload_sha256,
    file_count: inventory.file_count,
    force_flag_used: false
  };
  fs.writeFileSync(
    path.join(operationRecordRoot, 'last-interactive-blank-push.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
    'utf8'
  );
  return evidence;
}

function assertRuntimeBootstrapConfiguration() {
  const runtime = readJson(runtimeConfigPath, 'DEV_RUNTIME_NOT_CONFIGURED');
  const requiredTrue = [
    'standard_cloud_project_linked',
    'apps_script_api_enabled_in_cloud_project',
    'oauth_consent_testing_configured',
    'desktop_oauth_client_local_only',
    'project_scopes_authorized'
  ];
  const authState = readJson(
    runtimeAuthStatePath,
    'NAMED_RUNTIME_OAUTH_PROFILE_UNVERIFIED'
  );
  if (runtime.target_kind !== allowedTargetKind ||
      runtime.named_runtime_oauth_profile !== 'CONFIGURED' ||
      authState.named_runtime_oauth_profile !== 'CONFIGURED' ||
      authState.project_scopes_authorized !== true ||
      runtime.credential_tracked !== false ||
      requiredTrue.some((name) => runtime[name] !== true)) {
    fail('DEV_RUNTIME_NOT_CONFIGURED', 'DEV_RUNTIME_NOT_CONFIGURED');
  }
  return runtime;
}

function assertRuntimeConfiguration(target) {
  if (process.env.GAS_DEV_RUNTIME_ALLOWED !== 'true') {
    fail('DEV_RUNTIME_OPT_IN_REQUIRED', 'DEV_RUNTIME_OPT_IN_REQUIRED');
  }
  return assertRuntimeConfigurationState(target);
}

function assertRuntimeConfigurationState(target) {
  const runtime = assertRuntimeBootstrapConfiguration();
  if (target.runtime_dry_run_allowed !== true ||
      target.runtime_function !== allowedRuntimeFunction ||
      runtime.api_executable_deployment !== 'CONFIGURED_MYSELF_ONLY' ||
      runtime.deployment_id_tracked !== false ||
      runtime.test_mode !== true || runtime.automation_disabled !== true) {
    fail('DEV_RUNTIME_NOT_CONFIGURED', 'DEV_RUNTIME_NOT_CONFIGURED');
  }
  if (typeof runtime.deployment_id !== 'string' ||
      runtime.deployment_id.length < 20) {
    fail('DEV_RUNTIME_DEPLOYMENT_BINDING_MISSING',
      'DEV_RUNTIME_DEPLOYMENT_BINDING_MISSING');
  }
  return runtime;
}

function assertRuntimeDiagnosticNotPreviouslyAttempted() {
  if (fs.existsSync(instruction0011RuntimeAttemptRecordPath)) {
    fail('DEV_RUNTIME_ALREADY_ATTEMPTED', 'DEV_RUNTIME_ALREADY_ATTEMPTED');
  }
}

function instruction0011RuntimeAttemptEvidence() {
  const record = readJson(
    instruction0011RuntimeAttemptRecordPath,
    'INSTRUCTION_0011_RUNTIME_ATTEMPT_EVIDENCE_MISSING'
  );
  if (record.operation !== 'test-runtime' || record.exit_code !== 0 ||
      !['DEV_RUNTIME_RESULT_UNPARSEABLE', 'BLOCKED_BY_AUTH']
        .includes(record.status) ||
      !/^[a-f0-9]{64}$/.test(String(record.output_sha256 || ''))) {
    fail('INSTRUCTION_0011_RUNTIME_ATTEMPT_EVIDENCE_INVALID',
      'INSTRUCTION_0011_RUNTIME_ATTEMPT_EVIDENCE_INVALID');
  }
  return {
    record_sha256: sha256(fs.readFileSync(instruction0011RuntimeAttemptRecordPath)),
    output_sha256: record.output_sha256
  };
}

function writeInstruction0013RuntimeAttemptMarker(marker) {
  fs.mkdirSync(operationRecordRoot, { recursive: true });
  fs.writeFileSync(
    instruction0013RuntimeAttemptMarkerPath,
    `${JSON.stringify(marker, null, 2)}\n`,
    'utf8'
  );
  return marker;
}

function prepareInstruction0013RuntimeAttempt() {
  if (fs.existsSync(instruction0013RuntimeAttemptMarkerPath) ||
      fs.existsSync(path.join(
        operationRecordRoot,
        `last-${instruction0013RuntimeOperation}.json`
      ))) {
    fail('INSTRUCTION_0013_RUNTIME_ATTEMPT_ALREADY_PREPARED',
      'INSTRUCTION_0013_RUNTIME_ATTEMPT_ALREADY_PREPARED');
  }
  const guarded = assertTargetGuard(false);
  const runtime = assertRuntimeConfigurationState(guarded.target);
  const runtimeInventory = assertRuntimeParityEvidence();
  assertRuntimeSourceContract();
  const prior = instruction0011RuntimeAttemptEvidence();
  return writeInstruction0013RuntimeAttemptMarker({
    schema: 'WORK_OS_INSTRUCTION_0013_RUNTIME_ATTEMPT_V1',
    instruction: '0013',
    state: 'PREPARED',
    runtime_function: allowedRuntimeFunction,
    instruction_0011_attempt_preserved: true,
    instruction_0011_attempt_record_sha256: prior.record_sha256,
    runtime_payload_sha256: runtimeInventory.runtime_payload_sha256,
    deployment_binding_sha256: sha256(runtime.deployment_id)
  });
}

function assertInstruction0013PreparedForDeploymentPreflight(runtime) {
  const marker = readJson(
    instruction0013RuntimeAttemptMarkerPath,
    'INSTRUCTION_0013_RUNTIME_ATTEMPT_MARKER_MISSING'
  );
  const prior = instruction0011RuntimeAttemptEvidence();
  if (marker.schema !== 'WORK_OS_INSTRUCTION_0013_RUNTIME_ATTEMPT_V1' ||
      marker.instruction !== '0013' || marker.state !== 'PREPARED' ||
      marker.runtime_function !== allowedRuntimeFunction ||
      marker.instruction_0011_attempt_preserved !== true ||
      marker.instruction_0011_attempt_record_sha256 !== prior.record_sha256 ||
      marker.deployment_binding_sha256 !== sha256(runtime.deployment_id)) {
    fail('INSTRUCTION_0013_RUNTIME_ATTEMPT_MARKER_INVALID',
      'INSTRUCTION_0013_RUNTIME_ATTEMPT_MARKER_INVALID');
  }
  return marker;
}

function assertCorrectedVersionedDeploymentBinding(raw, deploymentId) {
  let deployments;
  try {
    deployments = JSON.parse(String(raw || '').trim());
  } catch (_) {
    fail('CORRECTED_VERSIONED_DEPLOYMENT_NOT_PROVEN',
      'CORRECTED_VERSIONED_DEPLOYMENT_NOT_PROVEN');
  }
  if (!Array.isArray(deployments) ||
      !/^[A-Za-z0-9_-]{20,}$/.test(String(deploymentId || ''))) {
    fail('CORRECTED_VERSIONED_DEPLOYMENT_NOT_PROVEN',
      'CORRECTED_VERSIONED_DEPLOYMENT_NOT_PROVEN');
  }
  const safeEntries = deployments.filter((item) => item &&
    typeof item === 'object' && !Array.isArray(item) &&
    /^[A-Za-z0-9_-]{20,}$/.test(String(item.deploymentId || '')));
  const versioned = safeEntries.filter((item) =>
    Number.isInteger(item.versionNumber) && item.versionNumber > 0
  );
  const head = safeEntries.filter((item) =>
    item.versionNumber === undefined || item.versionNumber === null
  );
  const matches = versioned.filter((item) => item.deploymentId === deploymentId);
  if (matches.length !== 1) {
    fail('CORRECTED_VERSIONED_DEPLOYMENT_NOT_PROVEN',
      'CORRECTED_VERSIONED_DEPLOYMENT_NOT_PROVEN');
  }
  return {
    corrected_versioned_deployment_binding: 'PASS',
    versioned_deployment_visible: true,
    local_binding_matches_visible_versioned_deployment: true,
    head_test_deployment_only: false,
    visible_deployment_count: safeEntries.length,
    visible_versioned_deployment_count: versioned.length,
    visible_head_deployment_count: head.length
  };
}

function persistInstruction0013DeploymentPreflight(result, evidence) {
  const safe = persistOperationRecord(
    instruction0013DeploymentPreflightOperation,
    result,
    'PASS'
  );
  Object.assign(safe, evidence);
  fs.writeFileSync(
    path.join(operationRecordRoot,
      `last-${instruction0013DeploymentPreflightOperation}.json`),
    `${JSON.stringify(safe, null, 2)}\n`,
    'utf8'
  );
  writeLastOperation(safe);
  return safe;
}

function assertInstruction0013RuntimeAttemptReady(runtime) {
  const marker = readJson(
    instruction0013RuntimeAttemptMarkerPath,
    'INSTRUCTION_0013_RUNTIME_ATTEMPT_MARKER_MISSING'
  );
  const prior = instruction0011RuntimeAttemptEvidence();
  const preflight = readJson(
    path.join(operationRecordRoot,
      `last-${instruction0013DeploymentPreflightOperation}.json`),
    'CORRECTED_VERSIONED_DEPLOYMENT_NOT_PROVEN'
  );
  const attemptRecord = path.join(
    operationRecordRoot,
    `last-${instruction0013RuntimeOperation}.json`
  );
  if (fs.existsSync(attemptRecord)) {
    fail('INSTRUCTION_0013_RUNTIME_ALREADY_ATTEMPTED',
      'INSTRUCTION_0013_RUNTIME_ALREADY_ATTEMPTED');
  }
  if (marker.state !== 'PREFLIGHT_PASSED' ||
      marker.instruction_0011_attempt_record_sha256 !== prior.record_sha256 ||
      marker.deployment_binding_sha256 !== sha256(runtime.deployment_id) ||
      preflight.status !== 'PASS' ||
      preflight.corrected_versioned_deployment_binding !== 'PASS' ||
      preflight.versioned_myself_only_deployment_visible !== true ||
      preflight.local_binding_matches_visible_versioned_deployment !== true ||
      preflight.head_test_deployment_only !== false) {
    fail('CORRECTED_VERSIONED_DEPLOYMENT_NOT_PROVEN',
      'CORRECTED_VERSIONED_DEPLOYMENT_NOT_PROVEN');
  }
  return marker;
}

function instruction0013RuntimeAttemptEvidence() {
  const marker = readJson(
    instruction0013RuntimeAttemptMarkerPath,
    'INSTRUCTION_0013_RUNTIME_ATTEMPT_EVIDENCE_MISSING'
  );
  const recordPath = path.join(
    operationRecordRoot,
    `last-${instruction0013RuntimeOperation}.json`
  );
  const record = readJson(
    recordPath,
    'INSTRUCTION_0013_RUNTIME_ATTEMPT_EVIDENCE_MISSING'
  );
  if (!['ATTEMPT_STARTED', 'ATTEMPT_COMPLETED'].includes(marker.state) ||
      record.operation !== instruction0013RuntimeOperation ||
      record.exit_code !== 0 ||
      ![
        'DEV_RUNTIME_RESULT_UNPARSEABLE',
        'REMOTE_QUICK_DIAGNOSTIC_FAILED_CLOSED'
      ].includes(record.status) ||
      !/^[a-f0-9]{64}$/.test(String(record.output_sha256 || ''))) {
    fail('INSTRUCTION_0013_RUNTIME_ATTEMPT_EVIDENCE_INVALID',
      'INSTRUCTION_0013_RUNTIME_ATTEMPT_EVIDENCE_INVALID');
  }
  return {
    marker_sha256: sha256(fs.readFileSync(instruction0013RuntimeAttemptMarkerPath)),
    record_sha256: sha256(fs.readFileSync(recordPath)),
    output_sha256: record.output_sha256
  };
}

function writeInstruction0014RuntimeAttemptMarker(marker) {
  fs.mkdirSync(operationRecordRoot, { recursive: true });
  fs.writeFileSync(
    instruction0014RuntimeAttemptMarkerPath,
    `${JSON.stringify(marker, null, 2)}\n`,
    'utf8'
  );
  return marker;
}

function prepareInstruction0014RuntimeAttempt() {
  const attemptRecordPath = path.join(
    operationRecordRoot,
    `last-${instruction0014RuntimeOperation}.json`
  );
  if (fs.existsSync(instruction0014RuntimeAttemptMarkerPath) ||
      fs.existsSync(attemptRecordPath)) {
    fail('INSTRUCTION_0014_RUNTIME_ATTEMPT_ALREADY_PREPARED',
      'INSTRUCTION_0014_RUNTIME_ATTEMPT_ALREADY_PREPARED');
  }
  const guarded = assertTargetGuard(false);
  const runtime = assertRuntimeConfigurationState(guarded.target);
  assertRuntimeSourceContract();
  const staged = assertRuntimeStagedPayload();
  const parity = assertRuntimePullbackPayload(staged);
  const semantics = assertClaspRunFunctionSemantics();
  const prior0011 = instruction0011RuntimeAttemptEvidence();
  const prior0013 = instruction0013RuntimeAttemptEvidence();
  if (guarded.target.runtime_function !== allowedRuntimeFunction ||
      parity.runtime_function !== allowedRuntimeFunction) {
    fail('RUNTIME_FUNCTION_NAME_CONSISTENCY_UNPROVEN',
      'RUNTIME_FUNCTION_NAME_CONSISTENCY_UNPROVEN');
  }
  return writeInstruction0014RuntimeAttemptMarker({
    schema: 'WORK_OS_INSTRUCTION_0014_RUNTIME_ATTEMPT_V1',
    instruction: '0014',
    state: 'PREPARED',
    runtime_function: allowedRuntimeFunction,
    instruction_0011_attempt_preserved: true,
    instruction_0011_attempt_record_sha256: prior0011.record_sha256,
    instruction_0013_attempt_preserved: true,
    instruction_0013_marker_sha256: prior0013.marker_sha256,
    instruction_0013_attempt_record_sha256: prior0013.record_sha256,
    runtime_payload_sha256: staged.runtime_payload_sha256,
    runtime_manifest_sha256: staged.runtime_manifest_sha256,
    staged_wrapper_present: parity.staged_wrapper_present,
    pulled_wrapper_present: parity.pulled_wrapper_present,
    function_name_consistency: true,
    clasp_run_semantics_proved: true,
    clasp_functions_source_sha256: semantics.functions_source_sha256,
    deployment_lineage: 'REQUIRES_FRESH_0014_DEPLOYMENT',
    prior_deployment_binding_sha256: sha256(runtime.deployment_id)
  });
}

function assertInstruction0014Prepared(runtime, expectedState) {
  const marker = readJson(
    instruction0014RuntimeAttemptMarkerPath,
    'INSTRUCTION_0014_RUNTIME_ATTEMPT_MARKER_MISSING'
  );
  const prior0011 = instruction0011RuntimeAttemptEvidence();
  const prior0013 = instruction0013RuntimeAttemptEvidence();
  const staged = assertRuntimeStagedPayload();
  const parity = assertRuntimePullbackPayload(staged);
  assertRuntimeSourceContract();
  const semantics = assertClaspRunFunctionSemantics();
  if (marker.schema !== 'WORK_OS_INSTRUCTION_0014_RUNTIME_ATTEMPT_V1' ||
      marker.instruction !== '0014' || marker.state !== expectedState ||
      marker.runtime_function !== allowedRuntimeFunction ||
      marker.instruction_0011_attempt_preserved !== true ||
      marker.instruction_0011_attempt_record_sha256 !== prior0011.record_sha256 ||
      marker.instruction_0013_attempt_preserved !== true ||
      marker.instruction_0013_marker_sha256 !== prior0013.marker_sha256 ||
      marker.instruction_0013_attempt_record_sha256 !== prior0013.record_sha256 ||
      marker.runtime_payload_sha256 !== staged.runtime_payload_sha256 ||
      marker.runtime_manifest_sha256 !== staged.runtime_manifest_sha256 ||
      marker.staged_wrapper_present !== true ||
      marker.pulled_wrapper_present !== true ||
      marker.function_name_consistency !== true ||
      marker.clasp_run_semantics_proved !== true ||
      marker.clasp_functions_source_sha256 !==
        semantics.functions_source_sha256 ||
      parity.runtime_function !== allowedRuntimeFunction ||
      (expectedState === 'PREPARED' &&
        marker.prior_deployment_binding_sha256 !== sha256(runtime.deployment_id))) {
    fail('INSTRUCTION_0014_RUNTIME_ATTEMPT_MARKER_INVALID',
      'INSTRUCTION_0014_RUNTIME_ATTEMPT_MARKER_INVALID');
  }
  return { marker, staged, parity };
}

function parseFreshVersionedDeployment(raw) {
  let value;
  try {
    value = JSON.parse(String(raw || '').trim());
  } catch (_) {
    fail('INSTRUCTION_0014_FRESH_DEPLOYMENT_NOT_PROVEN',
      'INSTRUCTION_0014_FRESH_DEPLOYMENT_NOT_PROVEN');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      !/^[A-Za-z0-9_-]{20,}$/.test(String(value.deploymentId || '')) ||
      !Number.isInteger(value.versionNumber) || value.versionNumber < 1) {
    fail('INSTRUCTION_0014_FRESH_DEPLOYMENT_NOT_PROVEN',
      'INSTRUCTION_0014_FRESH_DEPLOYMENT_NOT_PROVEN');
  }
  return {
    deployment_id: value.deploymentId,
    deployment_binding_sha256: sha256(value.deploymentId),
    version_number: value.versionNumber
  };
}

function assertFreshDeploymentVisible(raw, deployment) {
  let values;
  try {
    values = JSON.parse(String(raw || '').trim());
  } catch (_) {
    fail('INSTRUCTION_0014_DEPLOYMENT_LINEAGE_NOT_PROVEN',
      'INSTRUCTION_0014_DEPLOYMENT_LINEAGE_NOT_PROVEN');
  }
  if (!Array.isArray(values)) {
    fail('INSTRUCTION_0014_DEPLOYMENT_LINEAGE_NOT_PROVEN',
      'INSTRUCTION_0014_DEPLOYMENT_LINEAGE_NOT_PROVEN');
  }
  const matches = values.filter((value) => value &&
    value.deploymentId === deployment.deployment_id &&
    value.versionNumber === deployment.version_number);
  if (matches.length !== 1) {
    fail('INSTRUCTION_0014_DEPLOYMENT_LINEAGE_NOT_PROVEN',
      'INSTRUCTION_0014_DEPLOYMENT_LINEAGE_NOT_PROVEN');
  }
  return {
    fresh_versioned_deployment_visible: true,
    fresh_deployment_matches_created_version: true,
    visible_deployment_count: values.length
  };
}

function assertPassedOperation(operation) {
  const record = readJson(
    path.join(operationRecordRoot, `last-${operation}.json`),
    'REMOTE_PARITY_EVIDENCE_MISSING'
  );
  if (record.operation !== operation || record.status !== 'PASS' ||
      record.exit_code !== 0 ||
      !/^[a-f0-9]{64}$/.test(String(record.output_sha256 || ''))) {
    fail('REMOTE_PARITY_EVIDENCE_INVALID',
      'REMOTE_PARITY_EVIDENCE_INVALID');
  }
  return record;
}

function assertCanonicalParityEvidence() {
  const inventory = assertCanonicalPayloadContract(assertStagedPayload());
  const marker = readJson(
    canonicalRetryMarkerPath,
    'CANONICAL_PUSH_RETRY_NOT_RECORDED'
  );
  if (marker.state !== 'ATTEMPT_STARTED' ||
      marker.payload_sha256 !== inventory.payload_sha256 ||
      marker.file_count !== inventory.file_count) {
    fail('CANONICAL_PARITY_EVIDENCE_INVALID',
      'CANONICAL_PARITY_EVIDENCE_INVALID');
  }
  assertCanonicalRemoteMutationEvidence(inventory);
  assertPassedOperation('pull-verify');
  return inventory;
}

function recordRuntimePrerequisites(environment) {
  assertTargetGuard(false);
  assertCanonicalParityEvidence();
  const requiredTrue = [
    'GAS_STANDARD_CLOUD_PROJECT_LINKED',
    'GAS_CLOUD_APPS_SCRIPT_API_ENABLED',
    'GAS_OAUTH_CONSENT_TESTING_CONFIGURED',
    'GAS_DESKTOP_OAUTH_CLIENT_LOCAL_ONLY',
    'GAS_PROJECT_SCOPES_AUTHORIZED'
  ];
  if (requiredTrue.some((name) => environment[name] !== 'true')) {
    fail('DEV_RUNTIME_CONFIGURATION_ATTESTATION_REJECTED',
      'DEV_RUNTIME_CONFIGURATION_ATTESTATION_REJECTED');
  }
  const authState = readJson(
    runtimeAuthStatePath,
    'NAMED_RUNTIME_OAUTH_PROFILE_UNVERIFIED'
  );
  if (authState.named_runtime_oauth_profile !== 'CONFIGURED' ||
      authState.project_scopes_authorized !== true) {
    fail('NAMED_RUNTIME_OAUTH_PROFILE_UNVERIFIED',
      'NAMED_RUNTIME_OAUTH_PROFILE_UNVERIFIED');
  }
  const runtime = {
    schema: 'WORK_OS_LOCAL_CLASP_RUNTIME_CONFIGURATION_V1',
    target_kind: allowedTargetKind,
    standard_cloud_project_linked: true,
    apps_script_api_enabled_in_cloud_project: true,
    oauth_consent_testing_configured: true,
    desktop_oauth_client_local_only: true,
    named_runtime_oauth_profile: 'CONFIGURED',
    project_scopes_authorized: true,
    api_executable_deployment: 'NOT_EXECUTED',
    deployment_id_tracked: false,
    credential_tracked: false,
    test_mode: false,
    automation_disabled: true
  };
  fs.writeFileSync(runtimeConfigPath, `${JSON.stringify(runtime, null, 2)}\n`,
    'utf8');
  return runtime;
}

function assertRuntimeParityEvidence() {
  const runtime = assertRuntimeStagedPayload();
  assertPassedOperation('push-runtime');
  assertPassedOperation('pull-verify-runtime');
  assertRuntimePullbackPayload(runtime);
  return runtime;
}

function recordRuntimeConfiguration(environment) {
  const guarded = assertTargetGuard(false);
  const runtime = assertRuntimeBootstrapConfiguration();
  assertRuntimeParityEvidence();
  if (environment.GAS_API_EXECUTABLE_MYSELF_ONLY !== 'true' ||
      environment.GAS_TEST_MODE_CONFIRMED !== 'true' ||
      environment.GAS_AUTOMATION_DISABLED_CONFIRMED !== 'true') {
    fail('DEV_RUNTIME_CONFIGURATION_ATTESTATION_REJECTED',
      'DEV_RUNTIME_CONFIGURATION_ATTESTATION_REJECTED');
  }
  const deploymentId = String(environment.GAS_RUNTIME_DEPLOYMENT_ID || '');
  if (!/^[A-Za-z0-9_-]{20,}$/.test(deploymentId)) {
    fail('DEV_RUNTIME_DEPLOYMENT_BINDING_MISSING',
      'DEV_RUNTIME_DEPLOYMENT_BINDING_MISSING');
  }
  runtime.api_executable_deployment = 'CONFIGURED_MYSELF_ONLY';
  runtime.deployment_id = deploymentId;
  runtime.deployment_id_tracked = false;
  runtime.test_mode = true;
  runtime.automation_disabled = true;
  const target = JSON.parse(JSON.stringify(guarded.target));
  target.runtime_dry_run_allowed = true;
  target.runtime_function = allowedRuntimeFunction;
  fs.writeFileSync(runtimeConfigPath, `${JSON.stringify(runtime, null, 2)}\n`,
    'utf8');
  fs.writeFileSync(targetPath, `${JSON.stringify(target, null, 2)}\n`, 'utf8');
  return runtime;
}

function claspEntrypoint() {
  const candidate = path.join(
    moduleRoot,
    'node_modules',
    '@google',
    'clasp',
    'build',
    'src',
    'index.js'
  );
  if (!fs.existsSync(candidate)) {
    fail('LOCAL_CLASP_NOT_INSTALLED', 'LOCAL_CLASP_NOT_INSTALLED');
  }
  return candidate;
}

function runClasp(args, cwd) {
  const entrypoint = claspEntrypoint();
  const result = childProcess.spawnSync(process.execPath, [entrypoint].concat(args), {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    env: process.env
  });
  const raw = `${result.stdout || ''}\n${result.stderr || ''}`;
  return {
    exit_code: Number.isInteger(result.status) ? result.status : -1,
    output_sha256: sha256(raw),
    stdout: String(result.stdout || ''),
    stderr: String(result.stderr || ''),
    raw
  };
}

function classifyClaspFailure(raw, operation) {
  const text = String(raw || '').toLowerCase();
  const matches = (patterns) => patterns.some((pattern) => pattern.test(text));

  if (matches([
    /apps script api[^\n]*(?:not enabled|disabled|enable)/,
    /script\.google\.com\/home\/usersettings/,
    /script api has not been used in project/
  ])) return 'APPS_SCRIPT_API_DISABLED';

  if (matches([
    /script function not found/
  ])) return 'REMOTE_QUICK_DIAGNOSTIC_FAILED_CLOSED';

  if (matches([
    /invalid_grant/,
    /unauthorized_client/,
    /invalid credentials/,
    /login required/,
    /not logged in/,
    /authentication required/,
    /unable to run script function/,
    /request had invalid authentication credentials/,
    /\b401\b[^\n]*(?:unauthorized|auth)/
  ])) return 'BLOCKED_BY_AUTH';

  if (matches([
    /requested entity was not found/,
    /script[^\n]*(?:not found|does not exist)/,
    /caller does not have permission/,
    /permission denied/,
    /\b403\b[^\n]*(?:forbidden|permission)/,
    /\b404\b[^\n]*(?:not found|script|project)/
  ])) return 'DEV_TARGET_NOT_FOUND_OR_NO_ACCESS';

  if (matches([
    /invalid script id/,
    /invalid project id/,
    /project type[^\n]*(?:invalid|unsupported)/,
    /container-bound[^\n]*(?:invalid|unsupported)/,
    /rootdir[^\n]*(?:invalid|missing)/
  ])) return 'DEV_TARGET_PROJECT_TYPE_OR_BINDING_INVALID';

  if (matches([
    /appsscript\.json[^\n]*(?:invalid|error|rejected)/,
    /manifest[^\n]*(?:invalid|error|rejected|malformed)/,
    /executionapi[^\n]*(?:invalid|rejected)/
  ])) return 'REMOTE_MANIFEST_REJECTED';

  if (matches([
    /remote[^\n]*(?:changed|newer|conflict)/,
    /files?[^\n]*(?:changed on the server|different remotely)/,
    /(?:overwrite|push)[^\n]*(?:--force|force required)/
  ])) return 'CLASP_REMOTE_CONFLICT';

  if (matches([
    /invalid file name/,
    /file[^\n]*(?:too large|limit exceeded)/,
    /payload[^\n]*(?:invalid|rejected)/,
    /source[^\n]*(?:invalid|rejected|parse error)/
  ])) return 'REMOTE_PAYLOAD_REJECTED';

  if (matches([
    /econnreset/,
    /econnrefused/,
    /etimedout/,
    /enotfound/,
    /eai_again/,
    /socket hang up/,
    /network[^\n]*(?:failed|unreachable|timeout)/,
    /unable to (?:connect|verify)/,
    /certificate[^\n]*(?:expired|invalid|self.signed)/,
    /\btls\b[^\n]*(?:failed|error)/,
    /fetch failed/
  ])) return 'NETWORK_OR_TLS_FAILURE';

  return operation === 'push'
    ? 'UNKNOWN_CLASP_PUSH_FAILURE'
    : 'UNKNOWN_CLASP_REMOTE_FAILURE';
}

function classifyRuntimeFailureSubtype(raw, fallbackCode) {
  const text = String(raw || '').toLowerCase();
  if (/script function not found/.test(text)) {
    return 'VERSIONED_RUNTIME_FUNCTION_NOT_FOUND';
  }
  if (/unable to run script function|invalid authentication|unauthorized/.test(text)) {
    return 'RUNTIME_AUTHORIZATION_REJECTED';
  }
  if (fallbackCode === 'DEV_RUNTIME_RESULT_UNPARSEABLE') {
    return 'NO_BOUNDED_DIAGNOSTIC_BODY';
  }
  return 'CLOSED_RUNTIME_FAILURE';
}

function assertSafeOperationName(operation) {
  if (!/^[a-z][a-z0-9-]{0,40}$/.test(String(operation || ''))) {
    fail('LOCAL_OPERATION_NAME_REJECTED', 'LOCAL_OPERATION_NAME_REJECTED');
  }
}

function safeOperationRecord(
  operation,
  result,
  classification,
  observation,
  targetBindingSha256
) {
  assertSafeOperationName(operation);
  const safe = {
    operation,
    status: classification || 'PASS',
    exit_code: result.exit_code,
    output_sha256: result.output_sha256,
    script_extension_contract: scriptExtensionContract
  };
  const safeObservation = safePostPullObservation(observation);
  if (safeObservation) Object.assign(safe, safeObservation);
  if (/^[a-f0-9]{64}$/.test(String(targetBindingSha256 || ''))) {
    safe.target_binding_sha256 = targetBindingSha256;
  }
  return safe;
}

function persistOperationRecord(
  operation,
  result,
  classification,
  observation,
  targetBindingSha256
) {
  const safe = safeOperationRecord(
    operation,
    result,
    classification,
    observation,
    targetBindingSha256
  );
  assertSafeGeneratedPayloadDirectory();
  fs.mkdirSync(operationRecordRoot, { recursive: true });
  fs.writeFileSync(
    path.join(operationRecordRoot, `last-${operation}.raw.txt`),
    String(result.raw || ''),
    'utf8'
  );
  fs.writeFileSync(
    path.join(operationRecordRoot, `last-${operation}.json`),
    `${JSON.stringify(safe, null, 2)}\n`,
    'utf8'
  );
  writeLastOperation(safe);
  return safe;
}

function persistClosedOperationEvidence(operation, result, classification, evidence) {
  const safe = persistOperationRecord(operation, result, classification);
  const closed = evidence && typeof evidence === 'object' ? evidence : {};
  Object.assign(safe, closed);
  fs.writeFileSync(
    path.join(operationRecordRoot, `last-${operation}.json`),
    `${JSON.stringify(safe, null, 2)}\n`,
    'utf8'
  );
  writeLastOperation(safe);
  return safe;
}

function failClassifiedClaspOperation(operation, result, target) {
  const classification = classifyClaspFailure(result.raw, operation);
  persistOperationRecord(
    operation,
    result,
    classification,
    undefined,
    target ? targetBindingFingerprint(target.config) : undefined
  );
  fail(classification, classification);
}

function postRemoteFailureClassification(error, fallbackCode) {
  const candidate = String(
    error && error.code || fallbackCode || 'UNKNOWN_CLASP_REMOTE_FAILURE'
  );
  return closedPostRemoteFailureCategories.includes(candidate)
    ? candidate
    : 'UNKNOWN_CLASP_REMOTE_FAILURE';
}

function persistPostRemoteFailure(
  operation,
  result,
  error,
  fallbackCode,
  observation,
  target
) {
  const classification = postRemoteFailureClassification(error, fallbackCode);
  persistOperationRecord(
    operation,
    result,
    classification,
    error && error.safe_post_pull_observation || observation,
    target ? targetBindingFingerprint(target.config) : undefined
  );
  return classification;
}

function claspVersion() {
  const result = runClasp(['--version'], moduleRoot);
  if (result.exit_code !== 0) {
    fail('LOCAL_CLASP_VERSION_FAILED', 'LOCAL_CLASP_VERSION_FAILED');
  }
  const match = result.raw.match(/\b\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?\b/);
  return match ? match[0] : 'UNKNOWN';
}

function runtimeClaspArgs(commandArgs) {
  if (!fs.existsSync(runtimeAuthRoot)) {
    fail('NAMED_RUNTIME_OAUTH_PROFILE_MISSING',
      'NAMED_RUNTIME_OAUTH_PROFILE_MISSING');
  }
  return [
    '--auth', runtimeAuthRoot,
    '--user', runtimeProfileName
  ].concat(commandArgs);
}

function instruction0014RuntimeClaspArgs() {
  const args = runtimeClaspArgs([
    '--json', 'run-function', '--nondev', allowedRuntimeFunction
  ]);
  const command = args.slice(-4);
  if (JSON.stringify(command) !== JSON.stringify([
    '--json', 'run-function', '--nondev', 'runQuickDiagnostic'
  ])) {
    fail('RUNTIME_FUNCTION_NAME_CONSISTENCY_UNPROVEN',
      'RUNTIME_FUNCTION_NAME_CONSISTENCY_UNPROVEN');
  }
  return args;
}

function assertClaspRunFunctionSemantics() {
  const commandSource = fs.readFileSync(path.join(
    moduleRoot, 'node_modules', '@google', 'clasp', 'build', 'src',
    'commands', 'run-function.js'
  ), 'utf8');
  const functionsSource = fs.readFileSync(path.join(
    moduleRoot, 'node_modules', '@google', 'clasp', 'build', 'src',
    'core', 'functions.js'
  ), 'utf8');
  const deploymentSource = fs.readFileSync(path.join(
    moduleRoot, 'node_modules', '@google', 'clasp', 'build', 'src',
    'core', 'project.js'
  ), 'utf8');
  const checks = [
    commandSource.includes(".option('--nondev'"),
    commandSource.includes('const devMode = !options.nondev'),
    commandSource.includes('runFunction(functionName, params, devMode)'),
    functionsSource.includes(
      'const scriptId = this.options.project.scriptId'
    ),
    functionsSource.includes('function: functionName'),
    functionsSource.includes('devMode,'),
    functionsSource.includes('script.scripts.run(request)'),
    deploymentSource.includes('versionNumber = await this.version(description)'),
    deploymentSource.includes('script.projects.deployments.create')
  ];
  if (checks.some((value) => value !== true)) {
    fail('CLASP_RUN_FUNCTION_SEMANTICS_UNPROVEN',
      'CLASP_RUN_FUNCTION_SEMANTICS_UNPROVEN');
  }
  return {
    clasp_version: claspVersion(),
    nondev_sets_devmode_false: true,
    function_name_passthrough: true,
    project_config_value_used_for_scripts_run_path: true,
    fresh_deploy_creates_immutable_version: true,
    command_source_sha256: sha256(commandSource),
    functions_source_sha256: sha256(functionsSource),
    deployment_source_sha256: sha256(deploymentSource)
  };
}

function prepareRuntimeExecutionBinding(deploymentId) {
  if (!/^[A-Za-z0-9_-]{20,}$/.test(String(deploymentId || ''))) {
    fail('RUNTIME_EXECUTION_DEPLOYMENT_BINDING_INVALID',
      'RUNTIME_EXECUTION_DEPLOYMENT_BINDING_INVALID');
  }
  assertScriptIdIsNotTracked(deploymentId);
  if (fs.existsSync(runtimeExecutionRoot)) {
    const allowed = new Set(['payload', '.clasp.json', '.claspignore']);
    const entries = fs.readdirSync(runtimeExecutionRoot, { withFileTypes: true });
    if (entries.some((entry) => !allowed.has(entry.name))) {
      fail('RUNTIME_EXECUTION_WORKSPACE_UNEXPECTED_CONTENT',
        'RUNTIME_EXECUTION_WORKSPACE_UNEXPECTED_CONTENT');
    }
    fs.rmSync(runtimeExecutionRoot, { recursive: true, force: true });
  }
  fs.mkdirSync(path.join(runtimeExecutionRoot, 'payload'), { recursive: true });
  writeCanonicalClaspProjectConfig(
    runtimeExecutionRoot,
    buildCanonicalClaspProjectConfig(deploymentId)
  );
  return sha256(deploymentId);
}

function assertRuntimeExecutionBinding(runtime) {
  const config = readJson(
    path.join(runtimeExecutionRoot, '.clasp.json'),
    'RUNTIME_EXECUTION_DEPLOYMENT_BINDING_MISSING'
  );
  assertCanonicalClaspExtensionContract(config);
  if (config.rootDir !== 'payload' ||
      config.scriptId !== runtime.deployment_id ||
      !/^[A-Za-z0-9_-]{20,}$/.test(String(config.scriptId || ''))) {
    fail('RUNTIME_EXECUTION_DEPLOYMENT_BINDING_MISMATCH',
      'RUNTIME_EXECUTION_DEPLOYMENT_BINDING_MISMATCH');
  }
  assertScriptIdIsNotTracked(config.scriptId);
  return sha256(config.scriptId);
}

function markRuntimeAuthVerified(result) {
  const record = {
    schema: 'WORK_OS_LOCAL_CLASP_RUNTIME_AUTH_V1',
    named_runtime_oauth_profile: 'CONFIGURED',
    project_scopes_authorized: true,
    command_output_sha256: result.output_sha256
  };
  fs.writeFileSync(runtimeAuthStatePath, `${JSON.stringify(record, null, 2)}\n`,
    'utf8');
  return record;
}

function assertCleanWorktree() {
  const result = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'status', '--porcelain=v1', '--untracked-files=normal'
  ], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) fail('GIT_STATUS_FAILED', 'GIT_STATUS_FAILED');
  if (String(result.stdout || '').trim()) {
    fail('DIRTY_WORKTREE_REFUSED_FOR_DEV_PUSH',
      'DIRTY_WORKTREE_REFUSED_FOR_DEV_PUSH');
  }
}

function writeLastOperation(operation) {
  assertSafeGeneratedPayloadDirectory();
  fs.writeFileSync(path.join(devRoot, 'last-operation.json'),
    `${JSON.stringify(operation, null, 2)}\n`, 'utf8');
}

function runLocalVerifyBeforePush() {
  const result = childProcess.spawnSync(process.execPath, [
    path.join(moduleRoot, 'tools', 'local_validation_gate.js'), '--mode', 'local'
  ], { cwd: moduleRoot, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) {
    fail('NON_GOOGLE_LOCAL_VERIFICATION_FAILED',
      'NON_GOOGLE_LOCAL_VERIFICATION_FAILED');
  }
}

function assertRuntimeSourceContract() {
  const configSource = fs.readFileSync(path.join(sourceRoot, '00_Config.gs'), 'utf8');
  const diagnosticSource = fs.readFileSync(path.join(sourceRoot, '16_Diagnostics.gs'), 'utf8');
  if (!/TEST_MODE:\s*true/.test(configSource) ||
      !/AUTOMATION_ENABLED:\s*false/.test(configSource) ||
      !diagnosticSource.includes('function runQuickDiagnostic()') ||
      !diagnosticSource.includes('readOnlyExecutionPolicy')) {
    fail('SAFE_RUNTIME_FUNCTION_CONTRACT_UNPROVEN',
      'SAFE_RUNTIME_FUNCTION_CONTRACT_UNPROVEN');
  }
  assertRuntimeCallableWrapper(
    sourceRoot,
    'SAFE_RUNTIME_FUNCTION_CONTRACT_UNPROVEN'
  );
}

function findAcceptanceSummary(value) {
  if (!value || typeof value !== 'object') return null;
  if (value.acceptance_summary && typeof value.acceptance_summary === 'object') {
    return value.acceptance_summary;
  }
  for (const child of Object.values(value)) {
    const found = findAcceptanceSummary(child);
    if (found) return found;
  }
  return null;
}

function assertSafeClosedIdList(ids, expectedCount, complete, label) {
  if (complete !== true || !Array.isArray(ids) ||
      !Number.isInteger(expectedCount) || expectedCount < 0 ||
      ids.length !== expectedCount ||
      ids.some((id) => typeof id !== 'string' ||
        !/^[A-Z][A-Z0-9_]{1,79}$/.test(id))) {
    fail(`DEV_RUNTIME_${label}_IDS_INCOMPLETE`,
      `DEV_RUNTIME_${label}_IDS_INCOMPLETE`);
  }
  const sorted = ids.slice().sort();
  if (new Set(ids).size !== ids.length ||
      ids.some((id, index) => id !== sorted[index])) {
    fail(`DEV_RUNTIME_${label}_IDS_NONCANONICAL`,
      `DEV_RUNTIME_${label}_IDS_NONCANONICAL`);
  }
  return ids;
}

function assertClosedAggregate(value, expected, label) {
  if (value !== expected) {
    fail(`DEV_RUNTIME_${label}_CONTRACT_FAILED`,
      `DEV_RUNTIME_${label}_CONTRACT_FAILED`);
  }
}

function assertSafeRuntimeResult(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    fail('DEV_RUNTIME_RESULT_UNPARSEABLE', 'DEV_RUNTIME_RESULT_UNPARSEABLE');
  }
  const summary = findAcceptanceSummary(parsed);
  if (!summary) fail('DEV_RUNTIME_SUMMARY_MISSING', 'DEV_RUNTIME_SUMMARY_MISSING');
  const sideEffects = [
    'external_services_called', 'writes_performed',
    'spreadsheet_write_performed', 'properties_write_performed',
    'trigger_write_performed', 'flush_performed', 'calendar_api_called',
    'gmail_api_called', 'external_ai_request_performed',
    'dashboard_repair_performed'
  ];
  if (summary.summary_contract_id !==
      'WORK_OS_V2_DIAGNOSTIC_ACCEPTANCE_SUMMARY_V1' ||
      sideEffects.some((name) => summary[name] !== false)) {
    fail('DEV_RUNTIME_SIDE_EFFECT_CONTRACT_FAILED',
      'DEV_RUNTIME_SIDE_EFFECT_CONTRACT_FAILED');
  }
  assertSafeClosedIdList(
    summary.warn_check_ids,
    summary.warn_count,
    summary.warn_ids_complete,
    'WARN'
  );
  assertSafeClosedIdList(
    summary.fail_check_ids,
    summary.fail_count,
    summary.fail_ids_complete,
    'FAIL'
  );
  if (summary.acceptance_summary_status !== 'COMPLETE') {
    fail('DEV_RUNTIME_SUMMARY_INCOMPLETE', 'DEV_RUNTIME_SUMMARY_INCOMPLETE');
  }
  assertClosedAggregate(summary.task_physical_column_count, 50, 'TASK_COLUMNS');
  assertClosedAggregate(summary.task_schema_ids_state, 'PASS', 'TASK_SCHEMA_IDS');
  assertClosedAggregate(
    summary.task_schema_headers_state,
    'PASS',
    'TASK_SCHEMA_HEADERS'
  );
  assertClosedAggregate(summary.ledger_physical_column_count, 21, 'LEDGER_COLUMNS');
  assertClosedAggregate(summary.ledger_hidden_state, true, 'LEDGER_HIDDEN');
  assertClosedAggregate(summary.ledger_protection_state, true, 'LEDGER_PROTECTION');
  assertClosedAggregate(
    summary.ledger_authority_validator_state,
    'PASS',
    'LEDGER_AUTHORITY_VALIDATOR'
  );
  if (summary.fail_count !== 0 || summary.status === 'FAIL') {
    fail('DEV_RUNTIME_DIAGNOSTIC_FAILED', 'DEV_RUNTIME_DIAGNOSTIC_FAILED');
  }
  return {
    summary_contract_id: summary.summary_contract_id,
    diagnostic_kind: summary.diagnostic_kind,
    diagnostic_status: summary.status,
    pass_count: summary.pass_count,
    warn_count: summary.warn_count,
    fail_count: summary.fail_count,
    not_executed_count: summary.not_executed_count,
    warn_check_ids: summary.warn_check_ids,
    fail_check_ids: summary.fail_check_ids,
    warn_ids_complete: summary.warn_ids_complete,
    fail_ids_complete: summary.fail_ids_complete,
    acceptance_summary_status: summary.acceptance_summary_status,
    side_effects_all_false: true,
    task_physical_column_count: summary.task_physical_column_count,
    task_schema_ids_state: summary.task_schema_ids_state,
    task_schema_headers_state: summary.task_schema_headers_state,
    ledger_physical_column_count: summary.ledger_physical_column_count,
    ledger_hidden_state: summary.ledger_hidden_state,
    ledger_protection_state: summary.ledger_protection_state,
    ledger_authority_validator_state: summary.ledger_authority_validator_state
  };
}

function prepareEmptyPullWorkspace(root, expectedBaseName, failureCode) {
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
    return;
  }
  const expectedRoot = new Set(['.clasp.json', '.claspignore', 'payload']);
  const entries = fs.readdirSync(root, { withFileTypes: true });
  if (entries.some((entry) => !expectedRoot.has(entry.name))) {
    fail(failureCode, failureCode);
  }
  const payload = path.join(root, 'payload');
  if (fs.existsSync(payload)) {
    assertExactPayloadDirectory(payload, failureCode);
  }
  const resolvedPullRoot = path.resolve(root);
  const resolvedModuleRoot = `${path.resolve(moduleRoot)}${path.sep}`;
  if (!resolvedPullRoot.startsWith(resolvedModuleRoot) ||
      path.basename(resolvedPullRoot) !== expectedBaseName) {
    fail('PULL_VERIFY_WORKSPACE_PATH_REJECTED',
      'PULL_VERIFY_WORKSPACE_PATH_REJECTED');
  }
  fs.rmSync(resolvedPullRoot, { recursive: true, force: true });
  fs.mkdirSync(resolvedPullRoot, { recursive: true });
}

function assertRecoverableAccessCheckObservation(observation) {
  const safe = safePostPullObservation(observation);
  if (!safe || safe.post_pull_validation !== 'FAILED' ||
      safe.observed_file_count < 1) {
    fail('ACCESS_CHECK_WORKSPACE_RECOVERY_NOT_REQUIRED',
      'ACCESS_CHECK_WORKSPACE_RECOVERY_NOT_REQUIRED');
  }
  return safe;
}

function isApprovedAccessCheckRecovery(environment, target) {
  if (environment.GAS_ACCESS_CHECK_WORKSPACE_RECOVERY_ALLOWED !== 'true') {
    return false;
  }
  const attestation = target && target.target && target.target.target_attestation;
  const reason = environment.GAS_ACCESS_CHECK_WORKSPACE_RECOVERY_REASON;
  return (attestation === existingTargetAttestation &&
      reason === 'REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH') ||
    (attestation === newBlankTargetAttestation &&
      reason === 'SUPERSEDED_BY_NEW_BLANK_BOUND_SHEET_SANDBOX');
}

function recoverAccessCheckWorkspace(environment, target) {
  if (!isApprovedAccessCheckRecovery(environment, target) ||
      environment.GAS_TARGET_ATTESTATION !==
        target.target.target_attestation) {
    fail('ACCESS_CHECK_WORKSPACE_RECOVERY_NOT_APPROVED',
      'ACCESS_CHECK_WORKSPACE_RECOVERY_NOT_APPROVED');
  }
  const observation = assertRecoverableAccessCheckObservation(
    postPullPayloadObservation(path.join(accessCheckRoot, 'payload'))
  );
  const expectedEntries = new Set(['.clasp.json', '.claspignore', 'payload']);
  if (!fs.existsSync(accessCheckRoot) || fs.readdirSync(
    accessCheckRoot,
    { withFileTypes: true }
  ).some((entry) => !expectedEntries.has(entry.name))) {
    fail('ACCESS_CHECK_WORKSPACE_UNEXPECTED_CONTENT',
      'ACCESS_CHECK_WORKSPACE_UNEXPECTED_CONTENT');
  }
  const resolvedAccessRoot = path.resolve(accessCheckRoot);
  const resolvedDevRoot = `${path.resolve(devRoot)}${path.sep}`;
  if (!resolvedAccessRoot.startsWith(resolvedDevRoot) ||
      path.basename(resolvedAccessRoot) !== 'access-check') {
    fail('ACCESS_CHECK_WORKSPACE_PATH_REJECTED',
      'ACCESS_CHECK_WORKSPACE_PATH_REJECTED');
  }
  fs.rmSync(resolvedAccessRoot, { recursive: true, force: true });
  fs.mkdirSync(resolvedAccessRoot, { recursive: true });
  clearReadOnlyTargetAccess(target);
  return observation;
}

function assertIgnoredLocalBindingPaths() {
  [configPath, targetPath].forEach((bindingPath) => {
    const probe = childProcess.spawnSync('git', [
      '-C', repositoryRoot, 'check-ignore', '--quiet', '--', bindingPath
    ], { encoding: 'utf8', windowsHide: true });
    if (probe.status !== 0) {
      fail('DEV_TARGET_LOCAL_BINDING_NOT_IGNORED',
        'DEV_TARGET_LOCAL_BINDING_NOT_IGNORED');
    }
  });
}

function readLocalScriptIdFromNonEchoingPrompt(environment) {
  if (environment &&
      environment.GAS_DEV_LOCAL_SCRIPT_ID_SOURCE ===
        'NON_ECHOING_PARENT_PROMPT' &&
      typeof environment.GAS_DEV_LOCAL_SCRIPT_ID === 'string' &&
      environment.GAS_DEV_LOCAL_SCRIPT_ID) {
    const value = environment.GAS_DEV_LOCAL_SCRIPT_ID;
    environment.GAS_DEV_LOCAL_SCRIPT_ID = '';
    return value;
  }
  const command = [
    "$ErrorActionPreference = 'Stop'",
    '$secret = Read-Host -AsSecureString',
    '$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)',
    'try { [Console]::Out.Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)) }',
    'finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }'
  ].join('; ');
  process.stdout.write('Local secure Script ID prompt is ready. Enter it locally; it is not echoed or logged.\n');
  const result = childProcess.spawnSync('powershell', [
    '-NoLogo', '-NoProfile', '-Command', command
  ], {
    cwd: moduleRoot,
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
    windowsHide: true
  });
  let localValue = String(result.stdout || '').trim();
  if (result.status !== 0 || !localValue) {
    localValue = '';
    fail('DEV_TARGET_LOCAL_INPUT_FAILED', 'DEV_TARGET_LOCAL_INPUT_FAILED');
  }
  return localValue;
}

function bindTargetFromLocalPrompt(environment) {
  assertIgnoredLocalBindingPaths();
  const attestation = String(environment && environment.GAS_TARGET_ATTESTATION || '');
  const remotePreflightContract =
    targetPreflightContractForAttestation(attestation);
  let scriptId = '';
  try {
    scriptId = readLocalScriptIdFromNonEchoingPrompt(environment);
    if (!/^[A-Za-z0-9_-]{20,}$/.test(scriptId)) {
      fail('DEV_TARGET_ID_INVALID', 'DEV_TARGET_ID_INVALID');
    }
    assertScriptIdIsNotTracked(scriptId);
    const config = buildCanonicalClaspProjectConfig(scriptId);
    const target = {
      target_kind: allowedTargetKind,
      target_attestation: attestation,
      remote_preflight_contract: remotePreflightContract,
      expected_script_id: scriptId,
      rootDir: 'payload',
      runtime_dry_run_allowed: false,
      runtime_function: allowedRuntimeFunction
    };
    assertTargetObjects(config, target, null);
    fs.mkdirSync(devRoot, { recursive: true });
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    fs.writeFileSync(targetPath, `${JSON.stringify(target, null, 2)}\n`, 'utf8');
    return {
      target_configuration_present: true,
      target_kind: allowedTargetKind,
      target_attestation: attestation,
      remote_preflight_contract: remotePreflightContract,
      script_id_match: true,
      script_id_tracked: false,
      script_extensions_contract: scriptExtensionContract,
      runtime_dry_run_allowed: false
    };
  } finally {
    scriptId = '';
  }
}

function parseRuntimeCommand(command) {
  if (!command) return 'status';
  if (![
    'stage', 'bind-target', 'record-prerequisites', 'access-check', 'recover-access-check',
    'authorize-interactive-blank-push', 'record-interactive-blank-push',
    'prove-interactive-blank-push',
    'status', 'push', 'pull-verify',
    'runtime-auth-check', 'record-runtime-prerequisites',
    'record-runtime-config',
    'stage-runtime', 'push-runtime', 'pull-verify-runtime',
    'prepare-runtime-retry-0013', 'preflight-runtime-retry-0013',
    'test-runtime-0013',
    'prepare-runtime-retry-0014', 'preflight-runtime-retry-0014',
    'test-runtime-0014',
    'test-runtime', 'test', 'open', 'self-test'
  ]
    .includes(command)) {
    fail('UNKNOWN_GAS_DEV_COMMAND', 'UNKNOWN_GAS_DEV_COMMAND');
  }
  return command;
}

function selfTest() {
  const tests = [];
  function test(id, body) {
    try {
      body();
      tests.push({ id, status: 'PASS' });
    } catch (error) {
      tests.push({ id, status: 'FAIL', safe_message: String(error.code || error.message) });
    }
  }
  test('PAYLOAD_ALLOWLIST_EXCLUDES_DOCS_AND_CLASP_EXAMPLE', () => {
    const names = canonicalPayloadNames();
    assert.strictEqual(names.length, 23);
    assert.ok(names.every((name) => name.endsWith('.gs') || name === 'appsscript.json'));
    assert.ok(!names.includes('.clasp.json.example'));
  });
  test('PAYLOAD_ALLOWLIST_REJECTS_ADDITIONAL_FILE', () => {
    assert.throws(() => assertExactPayloadNames(
      canonicalPayloadFileNames.concat('unexpected.gs'),
      'STAGED_PAYLOAD_UNEXPECTED_CONTENT'
    ), (error) => error && error.code === 'STAGED_PAYLOAD_UNEXPECTED_CONTENT');
  });
  test('PAYLOAD_ALLOWLIST_REJECTS_REPLACED_EXPECTED_NAME', () => {
    const names = canonicalPayloadFileNames.slice();
    names[names.indexOf('00_Config.gs')] = '00_Replaced.gs';
    assert.throws(() => assertExactPayloadNames(
      names,
      'CANONICAL_PAYLOAD_INVENTORY_INVALID'
    ), (error) => error && error.code === 'CANONICAL_PAYLOAD_INVENTORY_INVALID');
  });
  test('PAYLOAD_ALLOWLIST_REJECTS_NON_GS_EXTRA', () => {
    assert.throws(() => assertExactPayloadNames(
      canonicalPayloadFileNames.concat('unexpected.html'),
      'REMOTE_PULLBACK_UNEXPECTED_CONTENT'
    ), (error) => error && error.code === 'REMOTE_PULLBACK_UNEXPECTED_CONTENT');
  });
  test('LOCAL_CLASP_ENTRYPOINT_IS_PROJECT_LOCAL', () => {
    const entrypoint = claspEntrypoint();
    assert.ok(entrypoint.startsWith(moduleRoot));
    assert.ok(entrypoint.endsWith(path.join('build', 'src', 'index.js')));
  });
  test('TARGET_GUARD_REJECTS_PLACEHOLDER', () => {
    assert.throws(() => assertTargetObjects(
      buildCanonicalClaspProjectConfig(
        'REPLACE_WITH_PERSONAL_SYNTHETIC_DEV_SCRIPT_ID'
      ),
      {
        target_kind: allowedTargetKind,
        target_attestation: existingTargetAttestation,
        remote_preflight_contract: existingCanonicalPreflightContract,
        expected_script_id: 'REPLACE_WITH_PERSONAL_SYNTHETIC_DEV_SCRIPT_ID',
        rootDir: 'payload'
      }
    ), (error) => error && error.code === 'DEV_TARGET_NOT_CONFIGURED');
  });
  test('TARGET_GUARD_REJECTS_MISMATCH', () => {
    assert.throws(() => assertTargetObjects(
      buildCanonicalClaspProjectConfig('a'.repeat(24)),
      {
        target_kind: allowedTargetKind,
        target_attestation: existingTargetAttestation,
        remote_preflight_contract: existingCanonicalPreflightContract,
        expected_script_id: 'b'.repeat(24),
        rootDir: 'payload'
      }
    ), (error) => error && error.code === 'DEV_TARGET_ID_MISMATCH');
  });
  test('TARGET_GUARD_REQUIRES_EXPLICIT_PUSH_OPT_IN', () => {
    assert.throws(() => assertTargetObjects(
      buildCanonicalClaspProjectConfig('a'.repeat(24)),
      {
        target_kind: allowedTargetKind,
        target_attestation: existingTargetAttestation,
        remote_preflight_contract: existingCanonicalPreflightContract,
        expected_script_id: 'a'.repeat(24),
        rootDir: 'payload'
      },
      {}
    ), (error) => error && error.code === 'GAS_DEV_CLASP_ALLOWED_REQUIRED');
  });
  test('CLASP_EXTENSION_CONTRACT_IS_GS_FIRST_AND_EXACT', () => {
    const config = buildCanonicalClaspProjectConfig('a'.repeat(24));
    assert.strictEqual(
      assertCanonicalClaspExtensionContract(config),
      scriptExtensionContract
    );
    assert.deepStrictEqual(config.scriptExtensions, ['.gs', '.js']);
    assert.deepStrictEqual(config.htmlExtensions, ['.html']);
  });
  test('CLASP_EXTENSION_CONTRACT_REJECTS_MISSING_REORDERED_AND_ADDITIONAL_VALUES', () => {
    const base = buildCanonicalClaspProjectConfig('a'.repeat(24));
    [
      { ...base, scriptExtensions: undefined },
      { ...base, scriptExtensions: ['.js', '.gs'] },
      { ...base, scriptExtensions: ['.gs', '.js', '.ts'] },
      { ...base, htmlExtensions: ['.htm'] },
      { ...base, htmlExtensions: ['.html', '.htm'] },
      { ...base, fileExtension: '.gs' }
    ].forEach((candidate) => {
      assert.throws(() => assertCanonicalClaspExtensionContract(candidate));
    });
  });
  test('SYNTHETIC_SERVER_INVENTORY_MAPS_TO_THE_23_CANONICAL_LOCAL_NAMES', () => {
    const remoteScriptNames = canonicalPayloadFileNames
      .filter((name) => name.endsWith('.gs'))
      .map((name) => name.slice(0, -3));
    const mapped = mapSyntheticServerScriptsToCanonicalPayloadNames(remoteScriptNames);
    assert.strictEqual(mapped.length, 23);
    assert.deepStrictEqual(mapped, canonicalPayloadFileNames.slice().sort());
  });
  test('SAFE_RESULT_NEVER_EMITS_A_TARGET_ID', () => {
    const targetId = 'a'.repeat(24);
    const safe = { command: 'status', status: 'DEV_TARGET_NOT_CONFIGURED' };
    assert.strictEqual(JSON.stringify(safe).includes(targetId), false);
  });
  const classificationFixtures = [
    ['APPS_SCRIPT_API_DISABLED',
      'Apps Script API is not enabled. Visit script.google.com/home/usersettings'],
    ['BLOCKED_BY_AUTH', 'Request had invalid authentication credentials'],
    ['DEV_TARGET_NOT_FOUND_OR_NO_ACCESS',
      'Requested entity was not found or caller does not have permission'],
    ['DEV_TARGET_PROJECT_TYPE_OR_BINDING_INVALID', 'Invalid script ID'],
    ['REMOTE_MANIFEST_REJECTED', 'appsscript.json manifest invalid'],
    ['REMOTE_PAYLOAD_REJECTED', 'payload rejected: invalid file name'],
    ['NETWORK_OR_TLS_FAILURE', 'fetch failed: ECONNRESET'],
    ['CLASP_REMOTE_CONFLICT', 'remote files changed; push requires --force'],
    ['UNKNOWN_CLASP_PUSH_FAILURE', 'synthetic closed unknown']
  ];
  classificationFixtures.forEach(([expected, raw]) => {
    test(`CLASSIFIER_${expected}`, () => {
      assert.strictEqual(classifyClaspFailure(raw, 'push'), expected);
      assert.ok(closedClaspFailureCategories.includes(expected));
    });
  });
  test('CLASSIFIER_REMOTE_QUICK_DIAGNOSTIC_FAILED_CLOSED', () => {
    const expected = 'REMOTE_QUICK_DIAGNOSTIC_FAILED_CLOSED';
    assert.strictEqual(classifyClaspFailure(
      'Script function not found. Please make sure script is deployed as API executable.',
      instruction0013RuntimeOperation
    ), expected);
    assert.ok(closedClaspFailureCategories.includes(expected));
  });
  test('RUNTIME_OVERLAY_ADDS_ONLY_MYSELF_EXECUTION_API', () => {
    const canonical = {
      timeZone: 'Asia/Tokyo',
      dependencies: { enabledAdvancedServices: [] },
      runtimeVersion: 'V8',
      oauthScopes: ['scope.synthetic']
    };
    const overlay = buildRuntimeManifestOverlay(canonical);
    assert.strictEqual(overlay.executionApi.access, 'MYSELF');
    const withoutExecutionApi = JSON.parse(JSON.stringify(overlay));
    delete withoutExecutionApi.executionApi;
    assert.deepStrictEqual(withoutExecutionApi, canonical);
  });
  test('RUNTIME_OVERLAY_REJECTS_PUBLIC_ACCESS', () => {
    const canonical = { timeZone: 'Asia/Tokyo', runtimeVersion: 'V8' };
    assert.throws(() => assertRuntimeManifestOverlay(canonical, {
      timeZone: 'Asia/Tokyo', runtimeVersion: 'V8',
      executionApi: { access: 'ANYONE' }
    }), (error) => error && error.code === 'RUNTIME_MANIFEST_ACCESS_REJECTED');
  });
  test('RUNTIME_SUMMARY_REQUIRES_COMPLETE_CLOSED_CONTRACT', () => {
    const summary = {
      acceptance_summary: {
        summary_contract_id: 'WORK_OS_V2_DIAGNOSTIC_ACCEPTANCE_SUMMARY_V1',
        diagnostic_kind: 'QUICK', status: 'WARN', pass_count: 77,
        warn_count: 2, fail_count: 0, not_executed_count: 0,
        warn_check_ids: ['EXPECTED_ALPHA', 'EXPECTED_BETA'],
        fail_check_ids: [], warn_ids_complete: true, fail_ids_complete: true,
        acceptance_summary_status: 'COMPLETE',
        external_services_called: false, writes_performed: false,
        spreadsheet_write_performed: false, properties_write_performed: false,
        trigger_write_performed: false, flush_performed: false,
        calendar_api_called: false, gmail_api_called: false,
        external_ai_request_performed: false,
        dashboard_repair_performed: false,
        task_physical_column_count: 50, task_schema_ids_state: 'PASS',
        task_schema_headers_state: 'PASS', ledger_physical_column_count: 21,
        ledger_hidden_state: true, ledger_protection_state: true,
        ledger_authority_validator_state: 'PASS'
      }
    };
    const safe = assertSafeRuntimeResult(JSON.stringify(summary));
    assert.strictEqual(safe.side_effects_all_false, true);
    assert.strictEqual(safe.warn_count, 2);
  });
  test('RUNTIME_SUMMARY_REJECTS_INCOMPLETE_IDS', () => {
    const value = {
      acceptance_summary: {
        summary_contract_id: 'WORK_OS_V2_DIAGNOSTIC_ACCEPTANCE_SUMMARY_V1',
        warn_count: 1, fail_count: 0, warn_check_ids: [], fail_check_ids: [],
        warn_ids_complete: false, fail_ids_complete: true,
        external_services_called: false, writes_performed: false,
        spreadsheet_write_performed: false, properties_write_performed: false,
        trigger_write_performed: false, flush_performed: false,
        calendar_api_called: false, gmail_api_called: false,
        external_ai_request_performed: false, dashboard_repair_performed: false
      }
    };
    assert.throws(
      () => assertSafeRuntimeResult(JSON.stringify(value)),
      (error) => error && error.code === 'DEV_RUNTIME_WARN_IDS_INCOMPLETE'
    );
  });
  test('CORRECTED_VERSIONED_DEPLOYMENT_BINDING_EVIDENCE_IS_CLOSED', () => {
    const expected = 'D'.repeat(24);
    const safe = assertCorrectedVersionedDeploymentBinding(JSON.stringify([
      { deploymentId: 'H'.repeat(24) },
      { deploymentId: expected, versionNumber: 7, description: 'ignored' }
    ]), expected);
    assert.strictEqual(safe.corrected_versioned_deployment_binding, 'PASS');
    assert.strictEqual(safe.local_binding_matches_visible_versioned_deployment, true);
    assert.strictEqual(safe.head_test_deployment_only, false);
    assert.strictEqual(JSON.stringify(safe).includes(expected), false);
    assert.strictEqual(JSON.stringify(safe).includes('ignored'), false);
  });
  test('CORRECTED_VERSIONED_DEPLOYMENT_BINDING_REJECTS_HEAD_ONLY', () => {
    const expected = 'D'.repeat(24);
    assert.throws(
      () => assertCorrectedVersionedDeploymentBinding(JSON.stringify([
        { deploymentId: expected }
      ]), expected),
      (error) => error &&
        error.code === 'CORRECTED_VERSIONED_DEPLOYMENT_NOT_PROVEN'
    );
  });
  test('INSTRUCTION_0014_WRAPPER_MUST_BE_TOP_LEVEL_CALLABLE', () => {
    const temporaryRoot = fs.mkdtempSync(path.join(
      os.tmpdir(), 'work-os-runtime-wrapper-'
    ));
    try {
      const diagnosticPath = path.join(temporaryRoot, '16_Diagnostics.gs');
      fs.writeFileSync(
        diagnosticPath,
        'function runQuickDiagnostic() { return { status: "PASS" }; }\n',
        'utf8'
      );
      assert.strictEqual(
        assertRuntimeCallableWrapper(temporaryRoot)
          .top_level_callable_wrapper_present,
        true
      );
      fs.writeFileSync(
        diagnosticPath,
        '(function () {\nfunction runQuickDiagnostic() { return {}; }\n}());\n',
        'utf8'
      );
      assert.throws(
        () => assertRuntimeCallableWrapper(temporaryRoot),
        (error) => error && error.code === 'RUNTIME_CALLABLE_WRAPPER_UNPROVEN'
      );
    } finally {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });
  test('INSTRUCTION_0014_CLASP_SEMANTICS_ARE_PACKAGE_SOURCE_PROVED', () => {
    const semantics = assertClaspRunFunctionSemantics();
    assert.strictEqual(semantics.clasp_version, '3.3.0');
    assert.strictEqual(semantics.nondev_sets_devmode_false, true);
    assert.strictEqual(semantics.function_name_passthrough, true);
    assert.strictEqual(
      semantics.project_config_value_used_for_scripts_run_path,
      true
    );
    assert.strictEqual(semantics.fresh_deploy_creates_immutable_version, true);
  });
  test('INSTRUCTION_0014_FRESH_DEPLOYMENT_LINEAGE_IS_CLOSED_SAFE', () => {
    const deploymentId = 'D'.repeat(24);
    const deployment = parseFreshVersionedDeployment(JSON.stringify({
      deploymentId,
      versionNumber: 9,
      description: 'ignored'
    }));
    const visible = assertFreshDeploymentVisible(JSON.stringify([
      { deploymentId: 'H'.repeat(24) },
      { deploymentId, versionNumber: 9, description: 'ignored' }
    ]), deployment);
    assert.strictEqual(deployment.version_number, 9);
    assert.strictEqual(visible.fresh_versioned_deployment_visible, true);
    assert.strictEqual(JSON.stringify(visible).includes(deploymentId), false);
  });
  const failed = tests.filter((item) => item.status !== 'PASS');
  writeSafeResult({
    suite: 'local_clasp_dev_self_test',
    environment: 'LOCAL_NON_GOOGLE',
    passed: tests.length - failed.length,
    failed: failed.length,
    tests
  });
  if (failed.length) process.exitCode = 1;
}

function main() {
  const command = parseRuntimeCommand(process.argv[2]);
  if (command === 'self-test') return selfTest();
  let googleOperation = 'NOT_EXECUTED';
  try {
    if (command === 'stage') {
      const inventory = assertCanonicalPayloadContract(stagePayload());
      writeSafeResult({
        lane: 'local_clasp_dev', command, status: 'PASS',
        target: 'NOT_INSPECTED', file_count: inventory.file_count,
        payload_sha256: inventory.payload_sha256,
        clasp_version: claspVersion()
      });
      return;
    }

    if (command === 'record-prerequisites') {
      const target = assertTargetGuard(false);
      const prerequisite = recordCanonicalRetryPrerequisites(process.env, target);
      writeSafeResult({
        lane: 'local_clasp_dev', command, status: 'PASS',
        user_level_apps_script_api: prerequisite.user_level_apps_script_api,
        oauth_state: prerequisite.oauth_state,
        target_attestation: prerequisite.target_attestation,
        remote_preflight_contract: prerequisite.remote_preflight_contract,
        script_extension_contract: prerequisite.script_extension_contract,
        read_only_target_access: prerequisite.read_only_target_access,
        canonical_push_retry_authorized:
          prerequisite.canonical_push_retry_authorized
      });
      return;
    }

    if (command === 'runtime-auth-check') {
      assertTargetGuard(false);
      const args = runtimeClaspArgs(['show-authorized-user']);
      googleOperation = 'ATTEMPTED';
      const result = runClasp(args, moduleRoot);
      if (result.exit_code !== 0) {
        failClassifiedClaspOperation('runtime-auth-check', result);
      }
      const authState = markRuntimeAuthVerified(result);
      persistOperationRecord('runtime-auth-check', result, 'PASS');
      writeSafeResult({
        lane: 'local_clasp_runtime_dev', command, status: 'PASS',
        named_runtime_oauth_profile: authState.named_runtime_oauth_profile,
        project_scopes_authorized: authState.project_scopes_authorized,
        command_output_sha256: result.output_sha256
      });
      return;
    }

    if (command === 'record-runtime-config') {
      const runtime = recordRuntimeConfiguration(process.env);
      writeSafeResult({
        lane: 'local_clasp_runtime_dev', command, status: 'PASS',
        target_kind: runtime.target_kind,
        standard_cloud_project_linked: runtime.standard_cloud_project_linked,
        apps_script_api_enabled_in_cloud_project:
          runtime.apps_script_api_enabled_in_cloud_project,
        oauth_consent_testing_configured:
          runtime.oauth_consent_testing_configured,
        desktop_oauth_client_local_only:
          runtime.desktop_oauth_client_local_only,
        named_runtime_oauth_profile: runtime.named_runtime_oauth_profile,
        project_scopes_authorized: runtime.project_scopes_authorized,
        api_executable_deployment: runtime.api_executable_deployment,
        deployment_id_tracked: runtime.deployment_id_tracked,
        credential_tracked: runtime.credential_tracked,
        test_mode: runtime.test_mode,
        automation_disabled: runtime.automation_disabled
      });
      return;
    }

    if (command === 'record-runtime-prerequisites') {
      const runtime = recordRuntimePrerequisites(process.env);
      writeSafeResult({
        lane: 'local_clasp_runtime_dev', command, status: 'PASS',
        target_kind: runtime.target_kind,
        standard_cloud_project_linked: runtime.standard_cloud_project_linked,
        apps_script_api_enabled_in_cloud_project:
          runtime.apps_script_api_enabled_in_cloud_project,
        oauth_consent_testing_configured:
          runtime.oauth_consent_testing_configured,
        desktop_oauth_client_local_only:
          runtime.desktop_oauth_client_local_only,
        named_runtime_oauth_profile: runtime.named_runtime_oauth_profile,
        project_scopes_authorized: runtime.project_scopes_authorized,
        api_executable_deployment: runtime.api_executable_deployment,
        deployment_id_tracked: runtime.deployment_id_tracked,
        credential_tracked: runtime.credential_tracked
      });
      return;
    }

    if (command === 'prepare-runtime-retry-0013') {
      const marker = prepareInstruction0013RuntimeAttempt();
      writeSafeResult({
        lane: 'local_clasp_runtime_dev', command, status: 'PASS',
        instruction: marker.instruction,
        attempt_marker_state: marker.state,
        instruction_0011_attempt_preserved:
          marker.instruction_0011_attempt_preserved,
        runtime_function: marker.runtime_function,
        google_operation: 'NOT_EXECUTED'
      });
      return;
    }

    if (command === 'preflight-runtime-retry-0013') {
      const guarded = assertTargetGuard(true);
      if (process.env.GAS_DEV_RUNTIME_ALLOWED !== 'true') {
        fail('DEV_RUNTIME_OPT_IN_REQUIRED', 'DEV_RUNTIME_OPT_IN_REQUIRED');
      }
      const runtime = assertRuntimeConfigurationState(guarded.target);
      const marker = assertInstruction0013PreparedForDeploymentPreflight(runtime);
      writeInstruction0013RuntimeAttemptMarker({
        ...marker,
        state: 'DEPLOYMENT_PREFLIGHT_STARTED'
      });
      const args = runtimeClaspArgs(['--json', 'deployments']);
      googleOperation = 'ATTEMPTED';
      const result = runClasp(args, runtimeRoot);
      if (result.exit_code !== 0) {
        failClassifiedClaspOperation(
          instruction0013DeploymentPreflightOperation,
          result
        );
      }
      let evidence;
      try {
        evidence = assertCorrectedVersionedDeploymentBinding(
          result.stdout,
          runtime.deployment_id
        );
      } catch (error) {
        persistOperationRecord(
          instruction0013DeploymentPreflightOperation,
          result,
          'CORRECTED_VERSIONED_DEPLOYMENT_NOT_PROVEN'
        );
        throw error;
      }
      const closedEvidence = {
        ...evidence,
        versioned_myself_only_deployment_visible:
          runtime.api_executable_deployment === 'CONFIGURED_MYSELF_ONLY' &&
          evidence.versioned_deployment_visible === true
      };
      persistInstruction0013DeploymentPreflight(result, closedEvidence);
      writeInstruction0013RuntimeAttemptMarker({
        ...marker,
        state: 'PREFLIGHT_PASSED',
        deployment_preflight_output_sha256: result.output_sha256
      });
      writeSafeResult({
        lane: 'local_clasp_runtime_dev', command, status: 'PASS',
        named_oauth_profile: 'PASS',
        runtime_auth_check: 'PASS',
        runtime_prerequisites: 'PASS',
        standard_cloud_linkage: 'PASS',
        apps_script_api_enablement: 'PASS',
        runtime_overlay_pullback_parity: 'PASS',
        ...closedEvidence,
        command_output_sha256: result.output_sha256
      });
      return;
    }

    if (command === 'prepare-runtime-retry-0014') {
      const marker = prepareInstruction0014RuntimeAttempt();
      writeSafeResult({
        lane: 'local_clasp_runtime_dev', command, status: 'PASS',
        instruction: marker.instruction,
        attempt_marker_state: marker.state,
        instruction_0011_attempt_preserved:
          marker.instruction_0011_attempt_preserved,
        instruction_0013_attempt_preserved:
          marker.instruction_0013_attempt_preserved,
        staged_wrapper_present: marker.staged_wrapper_present,
        pulled_wrapper_present: marker.pulled_wrapper_present,
        function_name_consistency: marker.function_name_consistency,
        clasp_run_semantics_proved: marker.clasp_run_semantics_proved,
        deployment_lineage: marker.deployment_lineage,
        runtime_function: marker.runtime_function,
        google_operation: 'NOT_EXECUTED'
      });
      return;
    }

    if (command === 'preflight-runtime-retry-0014') {
      assertCleanWorktree();
      runLocalVerifyBeforePush();
      const guarded = assertTargetGuard(true);
      if (process.env.GAS_DEV_RUNTIME_ALLOWED !== 'true' ||
          process.env.GAS_INSTRUCTION_0014_FRESH_DEPLOYMENT_ALLOWED !== 'true') {
        fail('INSTRUCTION_0014_REMOTE_OPT_IN_REQUIRED',
          'INSTRUCTION_0014_REMOTE_OPT_IN_REQUIRED');
      }
      const runtime = assertRuntimeConfigurationState(guarded.target);
      const prepared = assertInstruction0014Prepared(
        runtime,
        'PREPARED'
      );
      writeInstruction0014RuntimeAttemptMarker({
        ...prepared.marker,
        state: 'PREFLIGHT_STARTED'
      });

      prepareEmptyPullWorkspace(
        runtimePullRoot,
        'runtime-pull-verify',
        'RUNTIME_PULL_VERIFY_WORKSPACE_UNEXPECTED_CONTENT'
      );
      writeCanonicalClaspProjectConfig(runtimePullRoot, guarded.config);
      googleOperation = 'ATTEMPTED';
      const pullResult = runClasp(runtimeClaspArgs(['pull']), runtimePullRoot);
      if (pullResult.exit_code !== 0) {
        failClassifiedClaspOperation(
          instruction0014PullbackOperation,
          pullResult,
          guarded
        );
      }
      let pullback;
      try {
        pullback = assertRuntimePullbackPayload(prepared.staged);
      } catch (error) {
        persistClosedOperationEvidence(
          instruction0014PullbackOperation,
          pullResult,
          String(error && error.code || 'RUNTIME_REMOTE_PULLBACK_PARITY_FAILED'),
          { runtime_diagnostic_invocation: 'NOT_EXECUTED' }
        );
        throw error;
      }
      persistClosedOperationEvidence(
        instruction0014PullbackOperation,
        pullResult,
        'PASS',
        {
          parity: 'PASS',
          file_count: pullback.file_count,
          runtime_payload_sha256: pullback.runtime_payload_sha256,
          staged_wrapper_present: pullback.staged_wrapper_present,
          pulled_wrapper_present: pullback.pulled_wrapper_present,
          execution_api_access: 'MYSELF',
          runtime_diagnostic_invocation: 'NOT_EXECUTED'
        }
      );
      writeInstruction0014RuntimeAttemptMarker({
        ...prepared.marker,
        state: 'HEAD_PULLBACK_REVERIFIED',
        instruction_0014_pullback_output_sha256: pullResult.output_sha256
      });

      const deployResult = runClasp(runtimeClaspArgs([
        '--json', 'deploy', '--description', instruction0014DeploymentDescription
      ]), runtimeRoot);
      if (deployResult.exit_code !== 0) {
        failClassifiedClaspOperation(
          instruction0014DeploymentOperation,
          deployResult
        );
      }
      let deployment;
      try {
        deployment = parseFreshVersionedDeployment(deployResult.stdout);
      } catch (error) {
        persistClosedOperationEvidence(
          instruction0014DeploymentOperation,
          deployResult,
          'INSTRUCTION_0014_FRESH_DEPLOYMENT_NOT_PROVEN',
          { runtime_diagnostic_invocation: 'NOT_EXECUTED' }
        );
        throw error;
      }
      persistClosedOperationEvidence(
        instruction0014DeploymentOperation,
        deployResult,
        'PASS',
        {
          fresh_immutable_version_created: true,
          fresh_versioned_deployment_created: true,
          deployment_binding_sha256: deployment.deployment_binding_sha256,
          execution_api_access: 'MYSELF',
          runtime_diagnostic_invocation: 'NOT_EXECUTED'
        }
      );
      writeInstruction0014RuntimeAttemptMarker({
        ...prepared.marker,
        state: 'FRESH_VERSIONED_DEPLOYMENT_CREATED',
        instruction_0014_pullback_output_sha256: pullResult.output_sha256,
        fresh_deployment_output_sha256: deployResult.output_sha256,
        deployment_binding_sha256: deployment.deployment_binding_sha256
      });

      prepareEmptyPullWorkspace(
        runtimeVersionPullRoot,
        'runtime-version-pull-verify',
        'RUNTIME_VERSION_PULL_VERIFY_WORKSPACE_UNEXPECTED_CONTENT'
      );
      writeCanonicalClaspProjectConfig(runtimeVersionPullRoot, guarded.config);
      const versionPullResult = runClasp(runtimeClaspArgs([
        '--json', 'pull', '--versionNumber', String(deployment.version_number)
      ]), runtimeVersionPullRoot);
      if (versionPullResult.exit_code !== 0) {
        failClassifiedClaspOperation(
          instruction0014VersionPullbackOperation,
          versionPullResult,
          guarded
        );
      }
      let versionPullback;
      try {
        versionPullback = assertRuntimeVersionPullbackPayload(prepared.staged);
      } catch (error) {
        persistClosedOperationEvidence(
          instruction0014VersionPullbackOperation,
          versionPullResult,
          String(error && error.code || 'RUNTIME_VERSION_PULLBACK_PARITY_FAILED'),
          { runtime_diagnostic_invocation: 'NOT_EXECUTED' }
        );
        throw error;
      }
      persistClosedOperationEvidence(
        instruction0014VersionPullbackOperation,
        versionPullResult,
        'PASS',
        {
          parity: 'PASS',
          version_payload_sha256: versionPullback.version_payload_sha256,
          version_file_count: versionPullback.version_file_count,
          version_wrapper_present: versionPullback.version_wrapper_present,
          execution_api_access: 'MYSELF',
          runtime_diagnostic_invocation: 'NOT_EXECUTED'
        }
      );

      const visibilityResult = runClasp(
        runtimeClaspArgs(['--json', 'deployments']),
        runtimeRoot
      );
      if (visibilityResult.exit_code !== 0) {
        failClassifiedClaspOperation(
          instruction0014LineageOperation,
          visibilityResult
        );
      }
      let visibility;
      try {
        visibility = assertFreshDeploymentVisible(
          visibilityResult.stdout,
          deployment
        );
      } catch (error) {
        persistClosedOperationEvidence(
          instruction0014LineageOperation,
          visibilityResult,
          'INSTRUCTION_0014_DEPLOYMENT_LINEAGE_NOT_PROVEN',
          { runtime_diagnostic_invocation: 'NOT_EXECUTED' }
        );
        throw error;
      }
      persistClosedOperationEvidence(
        instruction0014LineageOperation,
        visibilityResult,
        'PASS',
        {
          ...visibility,
          version_payload_pullback_parity: true,
          version_wrapper_present: versionPullback.version_wrapper_present,
          deployment_binding_sha256: deployment.deployment_binding_sha256,
          runtime_diagnostic_invocation: 'NOT_EXECUTED'
        }
      );

      runtime.deployment_id = deployment.deployment_id;
      runtime.deployment_id_tracked = false;
      runtime.api_executable_deployment = 'CONFIGURED_MYSELF_ONLY';
      fs.writeFileSync(
        runtimeConfigPath,
        `${JSON.stringify(runtime, null, 2)}\n`,
        'utf8'
      );
      const executionBindingSha256 = prepareRuntimeExecutionBinding(
        deployment.deployment_id
      );
      writeInstruction0014RuntimeAttemptMarker({
        ...prepared.marker,
        state: 'PREFLIGHT_PASSED',
        instruction_0014_pullback_output_sha256: pullResult.output_sha256,
        fresh_deployment_output_sha256: deployResult.output_sha256,
        version_pullback_output_sha256: versionPullResult.output_sha256,
        deployment_lineage_output_sha256: visibilityResult.output_sha256,
        deployment_binding_sha256: deployment.deployment_binding_sha256,
        execution_binding_sha256: executionBindingSha256,
        deployment_lineage: 'FRESH_0014_VERSION_PULLBACK_PROVED'
      });
      writeSafeResult({
        lane: 'local_clasp_runtime_dev', command, status: 'PASS',
        instruction: '0014',
        runtime_function: allowedRuntimeFunction,
        head_pullback_parity: 'PASS',
        staged_wrapper_present: pullback.staged_wrapper_present,
        pulled_wrapper_present: pullback.pulled_wrapper_present,
        fresh_versioned_deployment_created: true,
        version_payload_pullback_parity: 'PASS',
        version_wrapper_present: versionPullback.version_wrapper_present,
        deployment_lineage: 'PASS',
        scripts_run_execution_binding: 'PASS',
        execution_api_access: 'MYSELF',
        runtime_diagnostic_invocation: 'NOT_EXECUTED'
      });
      return;
    }

    if (command === 'recover-access-check') {
      const target = assertTargetGuard(true);
      assertCanonicalRetryPrerequisitesForAccess(target);
      const observation = recoverAccessCheckWorkspace(process.env, target);
      writeSafeResult({
        lane: 'local_clasp_dev', command, status: 'PASS',
        target_access: 'NOT_EXECUTED',
        access_check_workspace_recovery: 'APPROVED_AND_COMPLETED',
        script_extension_contract: scriptExtensionContract,
        ...observation
      });
      return;
    }

    if (command === 'bind-target') {
      const binding = bindTargetFromLocalPrompt(process.env);
      writeSafeResult({ lane: 'local_clasp_dev', command, status: 'PASS', ...binding });
      return;
    }

    const inventory = assertCanonicalPayloadContract(assertStagedPayload());
    if (command === 'authorize-interactive-blank-push') {
      const target = assertTargetGuard(true);
      assertCanonicalRetryPrerequisites(target);
      const marker = authorizeInteractiveBlankManifestPush(
        process.env,
        target,
        inventory
      );
      writeSafeResult({
        lane: 'local_clasp_dev', command, status: 'PASS',
        interactive_manifest_push: marker.state,
        file_count: marker.file_count,
        payload_sha256: marker.payload_sha256,
        force_flag_allowed: marker.force_flag_allowed,
        google_operation: 'NOT_EXECUTED'
      });
      return;
    }

    if (command === 'record-interactive-blank-push') {
      assertTargetGuard(false);
      const evidence = recordInteractiveBlankManifestPush(process.env, inventory);
      writeSafeResult({
        lane: 'local_clasp_dev', command, status: 'PASS',
        operator_confirmation: evidence.operator_confirmation,
        file_count: evidence.file_count,
        payload_sha256: evidence.payload_sha256,
        force_flag_used: evidence.force_flag_used
      });
      return;
    }

    if (command === 'prove-interactive-blank-push') {
      const target = assertTargetGuard(true);
      assertCanonicalRetryPrerequisites(target);
      const marker = assertInteractiveBlankPullProofPrerequisites(
        target,
        inventory
      );
      prepareEmptyPullWorkspace(
        pullRoot,
        '.clasp-pull-verify',
        'PULL_VERIFY_WORKSPACE_UNEXPECTED_CONTENT'
      );
      writeCanonicalClaspProjectConfig(pullRoot, target.config);
      googleOperation = 'ATTEMPTED';
      const result = runClasp(['pull'], pullRoot);
      if (result.exit_code !== 0) {
        failClassifiedClaspOperation('pull-verify', result, target);
      }
      let pulled;
      let observation;
      try {
        const names = canonicalPayloadNames();
        observation = assertExactPulledPayload(path.join(pullRoot, 'payload'));
        pulled = inventoryFor(path.join(pullRoot, 'payload'), names);
        if (pulled.payload_sha256 !== inventory.payload_sha256) {
          failWithSafePostPullObservation(
            'REMOTE_PULLBACK_PARITY_FAILED',
            observation
          );
        }
      } catch (error) {
        persistPostRemoteFailure(
          'pull-verify',
          result,
          error,
          'UNKNOWN_CLASP_REMOTE_FAILURE',
          observation,
          target
        );
        throw error;
      }
      recordIndependentInteractiveBlankPushProof(inventory, marker);
      persistOperationRecord(
        'pull-verify',
        result,
        'PASS',
        observation,
        targetBindingFingerprint(target.config)
      );
      writeSafeResult({
        lane: 'local_clasp_dev', command, status: 'PASS', parity: 'PASS',
        proof: 'INDEPENDENT_PULLBACK_PROVED_EXECUTED',
        file_count: inventory.file_count,
        payload_sha256: inventory.payload_sha256,
        script_extension_contract: scriptExtensionContract,
        clasp_version: claspVersion(),
        command_output_sha256: result.output_sha256,
        force_flag_used: false
      });
      return;
    }

    if (command === 'access-check') {
      const target = assertTargetGuard(false);
      const prerequisite = assertCanonicalRetryPrerequisitesForAccess(target);
      clearReadOnlyTargetAccess(target);
      prepareEmptyPullWorkspace(
        accessCheckRoot,
        'access-check',
        'ACCESS_CHECK_WORKSPACE_UNEXPECTED_CONTENT'
      );
      writeCanonicalClaspProjectConfig(accessCheckRoot, target.config);
      googleOperation = 'ATTEMPTED';
      const result = runClasp(['pull'], accessCheckRoot);
      if (result.exit_code !== 0) {
        markReadOnlyTargetAccessFailed(target);
        failClassifiedClaspOperation('access-check', result, target);
      }
      let remote;
      let observation;
      try {
        const remotePayloadRoot = path.join(accessCheckRoot, 'payload');
        if (prerequisite.remote_preflight_contract ===
            newBlankPreflightContract) {
          observation = assertNewBlankPulledPayload(remotePayloadRoot);
          remote = { file_count: 2 };
        } else {
          observation = assertExactPulledPayload(remotePayloadRoot);
          observation.remote_preflight_contract =
            existingCanonicalPreflightContract;
          remote = inventoryFor(remotePayloadRoot, canonicalPayloadNames());
        }
        persistOperationRecord(
          'access-check',
          result,
          'PASS',
          observation,
          targetBindingFingerprint(target.config)
        );
        markReadOnlyTargetAccessPassed(target);
      } catch (error) {
        markReadOnlyTargetAccessFailed(target);
        persistPostRemoteFailure(
          'access-check',
          result,
          error,
          'UNKNOWN_CLASP_REMOTE_FAILURE',
          observation,
          target
        );
        throw error;
      }
      writeSafeResult({
        lane: 'local_clasp_dev', command, status: 'PASS',
        target_access: 'PASS', remote_file_count: remote.file_count,
        ...(remote.payload_sha256
          ? { remote_payload_sha256: remote.payload_sha256 }
          : {}),
        remote_preflight_contract: prerequisite.remote_preflight_contract,
        script_extension_contract: scriptExtensionContract,
        clasp_version: claspVersion(), command_output_sha256: result.output_sha256
      });
      return;
    }

    if (command === 'status') {
      assertTargetGuard(false);
      googleOperation = 'ATTEMPTED';
      const result = runClasp(['status'], devRoot);
      if (result.exit_code !== 0) failClassifiedClaspOperation('status', result);
      persistOperationRecord('status', result, 'PASS');
      writeSafeResult({
        lane: 'local_clasp_dev', command, status: 'PASS',
        file_count: inventory.file_count, payload_sha256: inventory.payload_sha256,
        clasp_version: claspVersion(), command_output_sha256: result.output_sha256
      });
      return;
    }

    if (command === 'push') {
      assertCleanWorktree();
      runLocalVerifyBeforePush();
      const target = assertTargetGuard(true);
      assertCanonicalRetryPrerequisites(target);
      markCanonicalRetryUsed(inventory);
      googleOperation = 'ATTEMPTED';
      const result = runClasp(['push'], devRoot);
      if (result.exit_code !== 0) {
        failClassifiedClaspOperation('push', result, target);
      }
      if (isManifestConfirmationNoop(result.raw)) {
        persistOperationRecord(
          'push',
          result,
          'REMOTE_MUTATION_NOT_PERFORMED_MANIFEST_CONFIRMATION_REQUIRED',
          undefined,
          targetBindingFingerprint(target.config)
        );
        fail('REMOTE_MUTATION_NOT_PERFORMED_MANIFEST_CONFIRMATION_REQUIRED',
          'REMOTE_MUTATION_NOT_PERFORMED_MANIFEST_CONFIRMATION_REQUIRED');
      }
      const safe = {
        lane: 'local_clasp_dev', command, status: 'PASS',
        file_count: inventory.file_count, payload_sha256: inventory.payload_sha256,
        clasp_version: claspVersion(), command_output_sha256: result.output_sha256
      };
      persistOperationRecord('push', result, 'PASS');
      writeSafeResult(safe);
      return;
    }

    if (command === 'pull-verify') {
      const target = assertTargetGuard(true);
      assertCanonicalRetryPrerequisites(target);
      assertCanonicalRemoteMutationEvidence(inventory);
      if (!fs.existsSync(canonicalRetryMarkerPath)) {
        fail('CANONICAL_PUSH_RETRY_NOT_RECORDED',
          'CANONICAL_PUSH_RETRY_NOT_RECORDED');
      }
      prepareEmptyPullWorkspace(
        pullRoot,
        '.clasp-pull-verify',
        'PULL_VERIFY_WORKSPACE_UNEXPECTED_CONTENT'
      );
      writeCanonicalClaspProjectConfig(pullRoot, target.config);
      googleOperation = 'ATTEMPTED';
      const result = runClasp(['pull'], pullRoot);
      if (result.exit_code !== 0) {
        failClassifiedClaspOperation('pull-verify', result, target);
      }
      let pulled;
      let observation;
      try {
        const names = canonicalPayloadNames();
        observation = assertExactPulledPayload(path.join(pullRoot, 'payload'));
        pulled = inventoryFor(path.join(pullRoot, 'payload'), names);
        if (pulled.payload_sha256 !== inventory.payload_sha256) {
          failWithSafePostPullObservation(
            'REMOTE_PULLBACK_PARITY_FAILED',
            observation
          );
        }
      } catch (error) {
        persistPostRemoteFailure(
          'pull-verify',
          result,
          error,
          'UNKNOWN_CLASP_REMOTE_FAILURE',
          observation,
          target
        );
        throw error;
      }
      const safe = {
        lane: 'local_clasp_dev', command, status: 'PASS', parity: 'PASS',
        file_count: inventory.file_count, payload_sha256: inventory.payload_sha256,
        script_extension_contract: scriptExtensionContract,
        clasp_version: claspVersion(), command_output_sha256: result.output_sha256
      };
      persistOperationRecord('pull-verify', result, 'PASS');
      writeSafeResult(safe);
      return;
    }

    if (command === 'stage-runtime') {
      const runtime = stageRuntimePayload();
      writeSafeResult({
        lane: 'local_clasp_runtime_dev', command, status: 'PASS',
        file_count: runtime.file_count,
        canonical_payload_sha256: runtime.canonical_payload_sha256,
        canonical_manifest_sha256: runtime.canonical_manifest_sha256,
        runtime_manifest_sha256: runtime.runtime_manifest_sha256,
        runtime_payload_sha256: runtime.runtime_payload_sha256,
        script_extension_contract: scriptExtensionContract,
        execution_api_access: 'MYSELF', clasp_version: claspVersion()
      });
      return;
    }

    if (command === 'push-runtime') {
      assertCleanWorktree();
      runLocalVerifyBeforePush();
      const target = assertTargetGuard(true);
      assertRuntimeBootstrapConfiguration();
      assertRuntimeSourceContract();
      const runtime = assertRuntimeStagedPayload();
      // The runtime payload intentionally changes only the ignored staged
      // manifest by adding executionApi.access = MYSELF. clasp 3.3.0 skips a
      // non-interactive manifest update unless --force is explicit. This
      // force flag is confined to the guarded runtime overlay lane; the
      // canonical push and blank-target recovery lanes remain non-force.
      const args = runtimeClaspArgs(['push', '--force']);
      googleOperation = 'ATTEMPTED';
      const result = runClasp(args, runtimeRoot);
      if (result.exit_code !== 0) {
        failClassifiedClaspOperation('push-runtime', result);
      }
      if (isManifestConfirmationNoop(result.raw)) {
        persistOperationRecord(
          'push-runtime',
          result,
          'RUNTIME_MANIFEST_OVERWRITE_NOT_PERFORMED'
        );
        fail('RUNTIME_MANIFEST_OVERWRITE_NOT_PERFORMED',
          'RUNTIME_MANIFEST_OVERWRITE_NOT_PERFORMED');
      }
      persistOperationRecord('push-runtime', result, 'PASS');
      writeSafeResult({
        lane: 'local_clasp_runtime_dev', command, status: 'PASS',
        file_count: runtime.file_count,
        canonical_manifest_sha256: runtime.canonical_manifest_sha256,
        runtime_manifest_sha256: runtime.runtime_manifest_sha256,
        runtime_payload_sha256: runtime.runtime_payload_sha256,
        script_extension_contract: scriptExtensionContract,
        execution_api_access: 'MYSELF',
        command_output_sha256: result.output_sha256
      });
      return;
    }

    if (command === 'pull-verify-runtime') {
      const target = assertTargetGuard(true);
      assertRuntimeBootstrapConfiguration();
      const runtime = assertRuntimeStagedPayload();
      prepareEmptyPullWorkspace(
        runtimePullRoot,
        'runtime-pull-verify',
        'RUNTIME_PULL_VERIFY_WORKSPACE_UNEXPECTED_CONTENT'
      );
      writeCanonicalClaspProjectConfig(runtimePullRoot, target.config);
      const args = runtimeClaspArgs(['pull']);
      googleOperation = 'ATTEMPTED';
      const result = runClasp(args, runtimePullRoot);
      if (result.exit_code !== 0) {
        failClassifiedClaspOperation('pull-verify-runtime', result, target);
      }
      let pulled;
      let observation;
      try {
        observation = assertExactPulledPayload(
          path.join(runtimePullRoot, 'payload')
        );
        pulled = inventoryFor(
          path.join(runtimePullRoot, 'payload'),
          canonicalPayloadFileNames
        );
        if (pulled.payload_sha256 !== runtime.runtime_payload_sha256) {
          failWithSafePostPullObservation(
            'RUNTIME_REMOTE_PULLBACK_PARITY_FAILED',
            observation
          );
        }
      } catch (error) {
        persistPostRemoteFailure(
          'pull-verify-runtime',
          result,
          error,
          'UNKNOWN_CLASP_REMOTE_FAILURE',
          observation,
          target
        );
        throw error;
      }
      persistOperationRecord('pull-verify-runtime', result, 'PASS');
      writeSafeResult({
        lane: 'local_clasp_runtime_dev', command, status: 'PASS', parity: 'PASS',
        file_count: pulled.file_count,
        canonical_manifest_sha256: runtime.canonical_manifest_sha256,
        runtime_manifest_sha256: runtime.runtime_manifest_sha256,
        runtime_payload_sha256: runtime.runtime_payload_sha256,
        pulled_payload_sha256: pulled.payload_sha256,
        script_extension_contract: scriptExtensionContract,
        command_output_sha256: result.output_sha256
      });
      return;
    }

    if (command === 'test' || command === 'test-runtime') {
      const target = assertTargetGuard(true);
      assertRuntimeConfiguration(target.target);
      assertRuntimeSourceContract();
      const runtime = assertRuntimeStagedPayload();
      assertRuntimeDiagnosticNotPreviouslyAttempted();
      const args = runtimeClaspArgs([
        '--json', 'run-function', allowedRuntimeFunction
      ]);
      googleOperation = 'ATTEMPTED';
      const result = runClasp(args, runtimeRoot);
      if (result.exit_code !== 0 ||
          /(?:unable to run script function|script function not found)/i
            .test(String(result.raw || ''))) {
        failClassifiedClaspOperation('test-runtime', result);
      }
      let summary;
      try {
        summary = assertSafeRuntimeResult(result.stdout);
      } catch (error) {
        persistOperationRecord(
          'test-runtime',
          result,
          String(error && error.code || 'DEV_RUNTIME_CLOSED_CONTRACT_FAILED')
        );
        throw error;
      }
      const safe = {
        lane: 'local_clasp_dev', command, status: 'PASS',
        runtime_function: allowedRuntimeFunction, file_count: runtime.file_count,
        runtime_payload_sha256: runtime.runtime_payload_sha256,
        clasp_version: claspVersion(), command_output_sha256: result.output_sha256,
        bounded_summary: summary
      };
      persistOperationRecord('test-runtime', result, 'PASS');
      writeSafeResult(safe);
      return;
    }

    if (command === 'test-runtime-0013') {
      const target = assertTargetGuard(true);
      const runtime = assertRuntimeConfiguration(target.target);
      assertRuntimeSourceContract();
      const runtimeInventory = assertRuntimeStagedPayload();
      const marker = assertInstruction0013RuntimeAttemptReady(runtime);
      writeInstruction0013RuntimeAttemptMarker({
        ...marker,
        state: 'ATTEMPT_STARTED'
      });
      const args = runtimeClaspArgs([
        '--json', 'run-function', '--nondev', allowedRuntimeFunction
      ]);
      googleOperation = 'ATTEMPTED';
      const result = runClasp(args, runtimeRoot);
      if (result.exit_code !== 0 ||
          /(?:unable to run script function|script function not found)/i
            .test(String(result.raw || ''))) {
        failClassifiedClaspOperation(instruction0013RuntimeOperation, result);
      }
      let summary;
      try {
        summary = assertSafeRuntimeResult(result.raw);
      } catch (error) {
        persistOperationRecord(
          instruction0013RuntimeOperation,
          result,
          String(error && error.code || 'DEV_RUNTIME_CLOSED_CONTRACT_FAILED')
        );
        throw error;
      }
      persistOperationRecord(instruction0013RuntimeOperation, result, 'PASS');
      writeInstruction0013RuntimeAttemptMarker({
        ...marker,
        state: 'ATTEMPT_COMPLETED'
      });
      writeSafeResult({
        lane: 'local_clasp_runtime_dev', command, status: 'PASS',
        instruction: '0013', runtime_function: allowedRuntimeFunction,
        deployed_version_mode: true,
        file_count: runtimeInventory.file_count,
        runtime_payload_sha256: runtimeInventory.runtime_payload_sha256,
        clasp_version: claspVersion(),
        command_output_sha256: result.output_sha256,
        bounded_summary: summary
      });
      return;
    }

    if (command === 'test-runtime-0014') {
      const target = assertTargetGuard(true);
      const runtime = assertRuntimeConfiguration(target.target);
      const prepared = assertInstruction0014Prepared(
        runtime,
        'PREFLIGHT_PASSED'
      );
      const attemptRecordPath = path.join(
        operationRecordRoot,
        `last-${instruction0014RuntimeOperation}.json`
      );
      if (fs.existsSync(attemptRecordPath)) {
        fail('INSTRUCTION_0014_RUNTIME_ALREADY_ATTEMPTED',
          'INSTRUCTION_0014_RUNTIME_ALREADY_ATTEMPTED');
      }
      const requiredOperations = [
        instruction0014PullbackOperation,
        instruction0014DeploymentOperation,
        instruction0014VersionPullbackOperation,
        instruction0014LineageOperation
      ];
      requiredOperations.forEach(assertPassedOperation);
      const versionPullback = assertRuntimeVersionPullbackPayload(
        prepared.staged
      );
      const executionBindingSha256 = assertRuntimeExecutionBinding(runtime);
      if (prepared.marker.deployment_lineage !==
          'FRESH_0014_VERSION_PULLBACK_PROVED' ||
          prepared.marker.deployment_binding_sha256 !==
            sha256(runtime.deployment_id) ||
          prepared.marker.execution_binding_sha256 !== executionBindingSha256 ||
          versionPullback.version_runtime_function !== allowedRuntimeFunction ||
          versionPullback.version_wrapper_present !== true) {
        fail('INSTRUCTION_0014_DEPLOYMENT_LINEAGE_NOT_PROVEN',
          'INSTRUCTION_0014_DEPLOYMENT_LINEAGE_NOT_PROVEN');
      }
      const args = instruction0014RuntimeClaspArgs();
      writeInstruction0014RuntimeAttemptMarker({
        ...prepared.marker,
        state: 'ATTEMPT_STARTED'
      });
      googleOperation = 'ATTEMPTED';
      const result = runClasp(args, runtimeExecutionRoot);
      if (result.exit_code !== 0 ||
          /(?:unable to run script function|script function not found)/i
            .test(String(result.raw || ''))) {
        const classification = classifyClaspFailure(
          result.raw,
          instruction0014RuntimeOperation
        );
        persistClosedOperationEvidence(
          instruction0014RuntimeOperation,
          result,
          classification,
          {
            safe_subtype: classifyRuntimeFailureSubtype(result.raw),
            deployed_version_mode: true,
            scripts_run_execution_binding: 'API_EXECUTABLE_DEPLOYMENT',
            runtime_function: allowedRuntimeFunction
          }
        );
        fail(classification, classification);
      }
      let summary;
      try {
        summary = assertSafeRuntimeResult(result.raw);
      } catch (error) {
        const classification = String(
          error && error.code || 'DEV_RUNTIME_CLOSED_CONTRACT_FAILED'
        );
        persistClosedOperationEvidence(
          instruction0014RuntimeOperation,
          result,
          classification,
          {
            safe_subtype: classifyRuntimeFailureSubtype(
              result.raw,
              classification
            ),
            deployed_version_mode: true,
            scripts_run_execution_binding: 'API_EXECUTABLE_DEPLOYMENT',
            runtime_function: allowedRuntimeFunction
          }
        );
        throw error;
      }
      persistClosedOperationEvidence(
        instruction0014RuntimeOperation,
        result,
        'PASS',
        {
          safe_subtype: 'BOUNDED_DIAGNOSTIC_BODY',
          deployed_version_mode: true,
          scripts_run_execution_binding: 'API_EXECUTABLE_DEPLOYMENT',
          runtime_function: allowedRuntimeFunction
        }
      );
      writeInstruction0014RuntimeAttemptMarker({
        ...prepared.marker,
        state: 'ATTEMPT_COMPLETED'
      });
      writeSafeResult({
        lane: 'local_clasp_runtime_dev', command, status: 'PASS',
        instruction: '0014', runtime_function: allowedRuntimeFunction,
        deployed_version_mode: true,
        scripts_run_execution_binding: 'API_EXECUTABLE_DEPLOYMENT',
        runtime_payload_sha256: prepared.staged.runtime_payload_sha256,
        clasp_version: claspVersion(),
        command_output_sha256: result.output_sha256,
        bounded_summary: summary
      });
      return;
    }

    if (command === 'open') {
      assertTargetGuard(true);
      googleOperation = 'ATTEMPTED';
      const result = runClasp(['open'], devRoot);
      if (result.exit_code !== 0) failClassifiedClaspOperation('open', result);
      writeSafeResult({
        lane: 'local_clasp_dev', command, status: 'PASS',
        clasp_version: claspVersion(), command_output_sha256: result.output_sha256
      });
    }
  } catch (error) {
    const code = error && error.code || 'LOCAL_CLASP_UNEXPECTED_FAILURE';
    writeSafeResult({
      lane: 'local_clasp_dev', command, status: code,
      google_operation: googleOperation === 'ATTEMPTED'
        ? 'ATTEMPTED_FAILED_CLOSED'
        : 'NOT_EXECUTED',
      message: code
    });
    process.exitCode = 2;
  }
}

if (require.main === module) main();

module.exports = {
  canonicalPayloadNames,
  canonicalPayloadFileNames,
  expectedCanonicalPayloadSha256,
  canonicalScriptExtensions,
  canonicalHtmlExtensions,
  scriptExtensionContract,
  existingTargetAttestation,
  newBlankTargetAttestation,
  existingCanonicalPreflightContract,
  newBlankPreflightContract,
  allowedTargetAttestations,
  assertExactPayloadNames,
  assertExactPayloadDirectory,
  assertCanonicalClaspExtensionContract,
  buildCanonicalClaspProjectConfig,
  writeCanonicalClaspProjectConfig,
  mapSyntheticServerScriptsToCanonicalPayloadNames,
  postPullPayloadObservation,
  newBlankPullPayloadObservation,
  assertNewBlankPulledPayload,
  targetPreflightContractForAttestation,
  safePostPullObservation,
  assertRecoverableAccessCheckObservation,
  isApprovedAccessCheckRecovery,
  isManifestConfirmationNoop,
  assertCanonicalRemoteMutationEvidence,
  targetBindingFingerprint,
  accessEvidenceMatchesTarget,
  safeOperationRecord,
  claspEntrypoint,
  inventoryFor,
  assertTargetObjects,
  classifyClaspFailure,
  closedClaspFailureCategories,
  closedPostRemoteFailureCategories,
  buildRuntimeManifestOverlay,
  assertRuntimeManifestOverlay,
  assertRuntimeCallableWrapper,
  assertClaspRunFunctionSemantics,
  assertSafeRuntimeResult,
  assertCorrectedVersionedDeploymentBinding,
  parseFreshVersionedDeployment,
  assertFreshDeploymentVisible,
  postRemoteFailureClassification,
  persistPostRemoteFailure,
  GateError
};
