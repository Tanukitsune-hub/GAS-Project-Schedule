'use strict';

/**
 * Work 0037 bounded Phase 8C replacement lanes.
 *
 * This lane reuses only the completed Work 0010 personal-synthetic binding and reads the consumed Work 0036 placement only as historical evidence.
 * The consumed Work 0036 placement is checked as historical evidence, never
 * as mutation authority. The payload is the audited Phase 8C release package: exactly 22
 * .gs files and appsscript.json. No runtime function is exposed here.
 */
const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  GateError: ClaspGateError,
  claspProjectConfig,
  claspSemanticPushArguments,
  assertClaspNativePayloadSelection,
  assertClaspPushSemanticEvidence,
  assertExactPayloadDirectory,
  assertTargetObjects,
  runClasp
} = require('./local_clasp_dev');

const moduleRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(moduleRoot, '..', '..');
const phase8cReleaseRelativeRoot =
  'implementation/GoogleSpreadsheet/release/v2.8.22-prepilot-phase8c/apps-script';
const phase8cReleaseRoot = path.join(
  repositoryRoot, phase8cReleaseRelativeRoot.replaceAll('/', path.sep)
);
const automationOffEvidenceRelativePath =
  'docs/handoffs/0036-live-ai-schema-failure-fix-addendum.md';
const automationOffEvidencePath = path.join(
  repositoryRoot, automationOffEvidenceRelativePath.replaceAll('/', path.sep)
);
const laneConfig = {
  laneName: 'work_0037_personal_shadow_pilot_replacement_placement',
  ciConfirmationRequiredEnv: 'GAS_WORK_0037_CI_CONFIRMED',
  pushAllowedEnv: 'GAS_WORK_0037_PUSH_ALLOWED',
  pullAllowedEnv: 'GAS_WORK_0037_PULL_ALLOWED',
  workspaceName: '.clasp-work-0037-personal-shadow-pilot',
  pullWorkspaceName: '.clasp-pull-verify-work-0037-personal-shadow-pilot',
  executionStateFileName: 'work-0037-personal-shadow-pilot-execution-state.json',
  operationLockFileName: 'work-0037-personal-shadow-pilot-operation.lock',
  previousPlacementDirectory: '.clasp-work-0036-live-ai-schema-failure-fix',
  previousPlacementFile:
    'work-0036-live-ai-schema-failure-fix-execution-state.json',
  instructionHead: '57442e9631e0d54f1f90443c6274f8d319159f1d',
  phase8cSchema: 'WORK_OS_PERSONAL_SHADOW_PILOT_REPLACEMENT_V1',
  previousPlacementWorkId: '0036-live-ai-schema-failure-fix',
  replacementTranche: 'PERSONAL_SHADOW_PILOT_REPLACEMENT',
  previousPlacementSchema:
    'WORK_OS_PERSONAL_AUTOMATION_LIVE_AI_SCHEMA_FAILURE_FIX_REPLACEMENT_V1',
  previousPreviousPlacementWorkId: '0036-runtime-preparation-fix',
  previousReplacementTranche: 'LIVE_AI_SCHEMA_FAILURE_FIX_REPLACEMENT'
};
const laneName = laneConfig.laneName;
const ciConfirmationRequiredEnv = laneConfig.ciConfirmationRequiredEnv;
const pushAllowedEnv = laneConfig.pushAllowedEnv;
const pullAllowedEnv = laneConfig.pullAllowedEnv;
const workspaceName = laneConfig.workspaceName;
const pullWorkspaceName = laneConfig.pullWorkspaceName;
const workspaceRoot = path.join(moduleRoot, workspaceName);
const payloadRoot = path.join(workspaceRoot, 'payload');
const pullRoot = path.join(moduleRoot, pullWorkspaceName);
const inventoryPath = path.join(workspaceRoot, 'payload-inventory.json');
const configPath = path.join(workspaceRoot, '.clasp.json');
const ignorePath = path.join(workspaceRoot, '.claspignore');
const executionStateFileName = laneConfig.executionStateFileName;
const executionStatePath = path.join(workspaceRoot, executionStateFileName);
const operationLockPath = path.join(
  workspaceRoot,
  laneConfig.operationLockFileName
);
const sourceWorkspaceRoot = path.join(moduleRoot, '.clasp-work-0010');
const sourceConfigPath = path.join(sourceWorkspaceRoot, '.clasp.json');
const sourceTargetPath = path.join(sourceWorkspaceRoot, 'target.json');
const sourceStatePath = path.join(
  sourceWorkspaceRoot, 'work-0010-execution-state.json'
);
const previousPlacementStatePath = path.join(
  moduleRoot,
  laneConfig.previousPlacementDirectory,
  laneConfig.previousPlacementFile
);
const exactBranch = 'codex/0037-personal-shadow-pilot';
const instructionHead = laneConfig.instructionHead;
const phase8cSchema = laneConfig.phase8cSchema;
const previousPlacementWorkId = laneConfig.previousPlacementWorkId;
const replacementTranche = laneConfig.replacementTranche;

class GateError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function fail(code) {
  throw new GateError(code);
}

function safeWrite(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function git(args, encoding = 'utf8') {
  const result = childProcess.spawnSync(
    'git', ['-C', repositoryRoot].concat(args), {
      encoding,
      windowsHide: true,
      maxBuffer: 64 * 1024 * 1024
    }
  );
  if (result.error || result.status !== 0) fail('GIT_PREFLIGHT_FAILED');
  return result.stdout;
}

function currentHead() {
  return String(git(['rev-parse', 'HEAD'])).trim();
}

function assertExactBranchCleanAndPublished(expectedHead) {
  if (String(git(['branch', '--show-current'])).trim() !== exactBranch) {
    fail('WORK_0037_EXACT_BRANCH_REQUIRED');
  }
  if (String(git([
    'status', '--porcelain=v1', '--untracked-files=normal'
  ])).trim()) {
    fail('DIRTY_WORKTREE_REFUSED');
  }
  const head = currentHead();
  const ancestry = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'merge-base', '--is-ancestor', instructionHead, head
  ], { windowsHide: true });
  if (ancestry.error || ancestry.status !== 0) {
    fail('WORK_0037_INSTRUCTION_ANCESTRY_INVALID');
  }
  const remote = String(git(['rev-parse', `origin/${exactBranch}`])).trim();
  if (remote !== head) fail('WORK_0037_REPAIR_HEAD_NOT_PUBLISHED');
  if (expectedHead && expectedHead !== head) {
    fail('WORK_0037_REPAIR_HEAD_CHANGED');
  }
  return head;
}

function readJson(file, code) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    fail(code);
  }
}

function writeJsonAtomic(file, value) {
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, file);
}

function acquireOperationLock(command) {
  let descriptor;
  try {
    descriptor = fs.openSync(operationLockPath, 'wx', 0o600);
    fs.writeFileSync(descriptor, `${command}\n`, 'utf8');
    fs.closeSync(descriptor);
  } catch (_) {
    if (Number.isInteger(descriptor)) fs.closeSync(descriptor);
    fail('WORK_0037_OPERATION_ALREADY_RUNNING');
  }
  return () => {
    try {
      fs.unlinkSync(operationLockPath);
    } catch (_) {
      // A missing lock cannot authorize another operation.
    }
  };
}

function phase8cPayloadNames() {
  const prefix = `${phase8cReleaseRelativeRoot}/`;
  const names = String(git([
    'ls-tree', '-r', '--name-only', 'HEAD', `${phase8cReleaseRelativeRoot}/`
  ])).trim().split(/\r?\n/).filter(Boolean)
    .filter((name) => name.startsWith(prefix))
    .map((name) => name.slice(prefix.length)).sort();
  const valid = names.length === 23 &&
    names.filter((name) => name.endsWith('.gs')).length === 22 &&
    names.filter((name) => name === 'appsscript.json').length === 1 &&
    names.every((name) => name.endsWith('.gs') || name === 'appsscript.json');
  if (!valid) fail('WORK_0037_PHASE8C_PAYLOAD_INVENTORY_INVALID');
  return names;
}

function committedPhase8cBuffer(name) {
  const result = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'show',
    `HEAD:${phase8cReleaseRelativeRoot}/${name}`
  ], {
    encoding: null,
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024
  });
  if (result.error || result.status !== 0) {
    fail('WORK_0037_COMMITTED_PHASE8C_READ_FAILED');
  }
  return result.stdout;
}

function inventoryFromBuffers(names, bufferFor) {
  const files = names.map((name) => ({
    name,
    sha256: sha256(bufferFor(name))
  }));
  return {
    schema: 'WORK_OS_LOCAL_CLASP_PAYLOAD_V1',
    file_count: files.length,
    files,
    payload_sha256: sha256(files.map((item) =>
      `${item.name}:${item.sha256}`).join('\n'))
  };
}

function inventoryForDirectory(root, names) {
  return inventoryFromBuffers(names, (name) =>
    fs.readFileSync(path.join(root, name))
  );
}

function assertPayloadInventory(inventory) {
  const names = phase8cPayloadNames();
  const actual = inventory && Array.isArray(inventory.files) ?
    inventory.files.map((file) => file.name).sort() : [];
  const valid = inventory &&
    inventory.schema === 'WORK_OS_LOCAL_CLASP_PAYLOAD_V1' &&
    inventory.file_count === 23 &&
    actual.length === names.length &&
    actual.every((name, index) => name === names[index]) &&
    inventory.files.filter((file) => file.name.endsWith('.gs')).length === 22 &&
    inventory.files.filter((file) => file.name === 'appsscript.json').length === 1 &&
    typeof inventory.payload_sha256 === 'string' &&
    /^[0-9a-f]{64}$/.test(inventory.payload_sha256);
  if (!valid) fail('WORK_0037_PHASE8C_PAYLOAD_INVENTORY_INVALID');
  return inventory;
}

function phase8cIgnoreContents(names = phase8cPayloadNames()) {
  return ['**/**'].concat(names.map((name) => `!${name}`), '').join('\n');
}

function assertIdentifierNotTracked(identifier) {
  const result = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'grep', '-I', '-F', '--', identifier
  ], { encoding: 'utf8', windowsHide: true });
  if (result.status === 0) fail('WORK_0037_TARGET_IDENTIFIER_IS_TRACKED');
  if (result.status !== 1) fail('WORK_0037_TRACKED_IDENTIFIER_SCAN_FAILED');
}

function assertAutomationOffEvidence() {
  if (process.env.GAS_WORK_0037_AUTOMATION_OFF_CONFIRMED !== 'true') {
    fail('AUTOMATION_OFF_CONFIRMATION_REQUIRED');
  }
  let evidence;
  try {
    evidence = fs.readFileSync(automationOffEvidencePath, 'utf8');
  } catch (_) {
    fail('AUTOMATION_OFF_EVIDENCE_MISSING');
  }
  const required = [
    /status: `CONSISTENT`/,
    /enabled: `false`/,
    /desired enabled: `false`/,
    /clock trigger count: `0`/,
    /stored trigger ID present: `false`/,
    /canonical trigger present: `false`/,
    /duplicate trigger count: `0`/
  ];
  if (required.some((pattern) => !pattern.test(evidence))) {
    fail('AUTOMATION_OFF_EVIDENCE_INVALID');
  }
  return {
    status: 'CONFIRMED_FROM_COMMITTED_BOUNDED_EVIDENCE',
    evidence_path: automationOffEvidenceRelativePath,
    runtime_function: 'NOT_EXECUTED',
    automation_mutation: 'NOT_EXECUTED'
  };
}

function assertExistingBindingObjects(config, target, state) {
  try {
    assertTargetObjects(config, target, null);
  } catch (error) {
    if (error instanceof ClaspGateError) {
      fail('WORK_0037_EXISTING_TARGET_BINDING_INVALID');
    }
    throw error;
  }
  const valid = target && state &&
    target.schema === 'WORK_OS_PERSONAL_SYNTHETIC_TARGET_V2' &&
    target.work_id === '0010' &&
    target.target_kind === 'PERSONAL_SYNTHETIC_DEV' &&
    target.target_disposition === 'FRESH_SYNTHETIC_CREATED' &&
    state.schema === 'WORK_OS_SYNTHETIC_TARGET_PLACEMENT_V1' &&
    state.work_id === '0010' &&
    state.phase === 'PULL_PARITY_PASS' &&
    state.create_attempt_count === 1 &&
    state.push_attempt_count === 1 &&
    state.content_read_attempt_count === 1 &&
    state.pull_attempt_count === 1 &&
    state.script_id === config.scriptId &&
    state.script_id === target.expected_script_id &&
    state.parent_id === target.expected_parent_id &&
    state.principal_fingerprint === target.principal_fingerprint &&
    state.target_fingerprint === target.target_fingerprint &&
    /^[0-9a-f]{64}$/.test(String(state.target_fingerprint || ''));
  if (!valid) fail('WORK_0037_EXISTING_TARGET_BINDING_INVALID');
  return { config, target, state };
}

function assertPreviousPlacement(binding, previousPlacement) {
  const valid = previousPlacement &&
    previousPlacement.schema === laneConfig.previousPlacementSchema &&
    previousPlacement.work_id === '0036' &&
    previousPlacement.source_binding_work_id === '0010' &&
    previousPlacement.previous_placement_work_id ===
      laneConfig.previousPreviousPlacementWorkId &&
    (!laneConfig.previousReplacementTranche ||
      previousPlacement.replacement_tranche ===
        laneConfig.previousReplacementTranche) &&
    previousPlacement.phase === 'PULL_PARITY_PASS' &&
    previousPlacement.push_attempt_count === 1 &&
    previousPlacement.pull_attempt_count === 1 &&
    previousPlacement.pull_parity === 'PASS' &&
    previousPlacement.target_fingerprint === binding.state.target_fingerprint &&
    /^[0-9a-f]{40}$/.test(String(previousPlacement.repair_head || '')) &&
    /^[0-9a-f]{64}$/.test(String(previousPlacement.payload_sha256 || ''));
  if (!valid) fail('WORK_0037_PREVIOUS_PLACEMENT_STATE_INVALID');
  return previousPlacement;
}

function loadExistingBinding() {
  const binding = assertExistingBindingObjects(
    readJson(sourceConfigPath, 'WORK_0037_EXISTING_TARGET_CONFIG_MISSING'),
    readJson(sourceTargetPath, 'WORK_0037_EXISTING_TARGET_METADATA_MISSING'),
    readJson(sourceStatePath, 'WORK_0037_EXISTING_TARGET_STATE_MISSING')
  );
  assertIdentifierNotTracked(binding.state.script_id);
  assertIdentifierNotTracked(binding.state.parent_id);
  binding.previousPlacement = assertPreviousPlacement(binding, readJson(
    previousPlacementStatePath,
    'WORK_0037_PREVIOUS_PLACEMENT_STATE_MISSING'
  ));
  return binding;
}

function initialExecutionState(repairHead, inventory, binding) {
  return {
    schema: phase8cSchema,
    work_id: '0037',
    source_binding_work_id: '0010',
    previous_placement_work_id: previousPlacementWorkId,
    replacement_tranche: replacementTranche,
    payload_path: phase8cReleaseRelativeRoot,
    repair_head: repairHead,
    payload_sha256: inventory.payload_sha256,
    target_fingerprint: binding.state.target_fingerprint,
    push_attempt_count: 0,
    pull_attempt_count: 0,
    phase: 'STAGED'
  };
}

function restagedExecutionState(state, repairHead, inventory, binding) {
  assertStateBase(state);
  if (state.phase !== 'STAGED' || state.push_attempt_count !== 0 ||
      state.pull_attempt_count !== 0) {
    fail('WORK_0037_EXECUTION_ALREADY_STARTED');
  }
  return initialExecutionState(repairHead, inventory, binding);
}

function assertStateBase(state) {
  const valid = state && state.schema === phase8cSchema &&
    state.work_id === '0037' && state.source_binding_work_id === '0010' &&
    state.previous_placement_work_id === previousPlacementWorkId &&
    state.replacement_tranche === replacementTranche &&
    state.payload_path === phase8cReleaseRelativeRoot &&
    /^[0-9a-f]{40}$/.test(String(state.repair_head || '')) &&
    /^[0-9a-f]{64}$/.test(String(state.payload_sha256 || '')) &&
    /^[0-9a-f]{64}$/.test(String(state.target_fingerprint || '')) &&
    Number.isInteger(state.push_attempt_count) &&
    Number.isInteger(state.pull_attempt_count);
  if (!valid) fail('WORK_0037_EXECUTION_STATE_INVALID');
}

function nextAttemptState(state, command) {
  assertStateBase(state);
  const next = Object.assign({}, state);
  if (command === 'push') {
    if (state.phase !== 'STAGED' || state.push_attempt_count !== 0 ||
        state.pull_attempt_count !== 0) {
      fail('WORK_0037_PUSH_ALREADY_ATTEMPTED');
    }
    next.push_attempt_count = 1;
    next.phase = 'PUSH_ATTEMPT_STARTED';
    return next;
  }
  if (command === 'pull-verify') {
    if (state.phase !== 'PUSH_PASS' || state.push_attempt_count !== 1 ||
        state.pull_attempt_count !== 0) {
      fail('WORK_0037_PULL_ALREADY_ATTEMPTED');
    }
    next.pull_attempt_count = 1;
    next.phase = 'PULL_ATTEMPT_STARTED';
    return next;
  }
  fail('WORK_0037_REMOTE_COMMAND_INVALID');
}

function stagePayload() {
  if (process.env[ciConfirmationRequiredEnv] !== 'true') {
    fail('WORK_0037_REPAIR_CI_CONFIRMATION_REQUIRED');
  }
  const head = assertExactBranchCleanAndPublished();
  const automationOff = assertAutomationOffEvidence();
  if (fs.existsSync(workspaceRoot) || fs.existsSync(pullRoot)) {
    fail('WORK_0037_LOCAL_STATE_ALREADY_EXISTS');
  }
  const binding = loadExistingBinding();
  const names = phase8cPayloadNames();
  const committed = assertPayloadInventory(
    inventoryFromBuffers(names, committedPhase8cBuffer)
  );
  fs.mkdirSync(payloadRoot, { recursive: true });
  for (const name of names) {
    fs.writeFileSync(path.join(payloadRoot, name), committedPhase8cBuffer(name));
  }
  assertExactPayloadDirectory(
    payloadRoot, 'WORK_0037_STAGED_PAYLOAD_UNEXPECTED_CONTENT', names
  );
  fs.writeFileSync(ignorePath, phase8cIgnoreContents(names), 'utf8');
  writeJsonAtomic(configPath, claspProjectConfig(binding.config.scriptId));
  const staged = assertPayloadInventory(inventoryForDirectory(payloadRoot, names));
  if (JSON.stringify(staged) !== JSON.stringify(committed)) {
    fail('WORK_0037_STAGED_PAYLOAD_SOURCE_SKEW');
  }
  writeJsonAtomic(inventoryPath, staged);
  writeJsonAtomic(
    executionStatePath,
    initialExecutionState(head, staged, binding)
  );
  return {
    file_count: staged.file_count,
    gs_file_count: 22,
    manifest_file_count: 1,
    missing_file_count: 0,
    extra_file_count: 0,
    payload_sha256: staged.payload_sha256,
    automation_off: automationOff
  };
}

function restagePayload() {
  if (process.env[ciConfirmationRequiredEnv] !== 'true') {
    fail('WORK_0037_REPAIR_CI_CONFIRMATION_REQUIRED');
  }
  const head = assertExactBranchCleanAndPublished();
  if (!fs.existsSync(workspaceRoot) || fs.existsSync(pullRoot)) {
    fail('WORK_0037_RESTAGE_STATE_MISSING');
  }
  const automationOff = assertAutomationOffEvidence();
  const state = readJson(executionStatePath, 'WORK_0037_EXECUTION_STATE_INVALID');
  assertStateBase(state);
  const ancestry = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'merge-base', '--is-ancestor',
    state.repair_head, head
  ], { windowsHide: true });
  if (ancestry.error || ancestry.status !== 0) {
    fail('WORK_0037_STALE_STATE_ANCESTRY_INVALID');
  }
  const binding = loadExistingBinding();
  const names = phase8cPayloadNames();
  const committed = assertPayloadInventory(
    inventoryFromBuffers(names, committedPhase8cBuffer)
  );
  assertExactPayloadDirectory(
    payloadRoot, 'WORK_0037_STAGED_PAYLOAD_UNEXPECTED_CONTENT', names
  );
  const staged = assertPayloadInventory(inventoryForDirectory(payloadRoot, names));
  const saved = assertPayloadInventory(readJson(
    inventoryPath, 'WORK_0037_STAGED_PAYLOAD_INVENTORY_INVALID'
  ));
  const config = readJson(configPath, 'WORK_0037_TARGET_CONFIG_MISSING');
  if (JSON.stringify(saved) !== JSON.stringify(staged) ||
      JSON.stringify(staged) !== JSON.stringify(committed) ||
      state.payload_sha256 !== staged.payload_sha256 ||
      config.scriptId !== binding.config.scriptId ||
      config.rootDir !== 'payload' ||
      JSON.stringify(config.scriptExtensions) !== JSON.stringify(['.gs', '.js']) ||
      fs.readFileSync(ignorePath, 'utf8') !== phase8cIgnoreContents(names)) {
    fail('WORK_0037_STAGED_PAYLOAD_MISMATCH');
  }
  try {
    assertTargetObjects(config, binding.target, null);
  } catch (error) {
    if (error instanceof ClaspGateError) {
      fail('WORK_0037_EXISTING_TARGET_BINDING_INVALID');
    }
    throw error;
  }
  const refreshed = restagedExecutionState(state, head, staged, binding);
  writeJsonAtomic(inventoryPath, staged);
  writeJsonAtomic(executionStatePath, refreshed);
  return {
    file_count: staged.file_count,
    gs_file_count: 22,
    manifest_file_count: 1,
    missing_file_count: 0,
    extra_file_count: 0,
    payload_sha256: staged.payload_sha256,
    automation_off: automationOff,
    restaged: true
  };
}

function assertStagedPayload() {
  if (!fs.existsSync(payloadRoot) || !fs.existsSync(inventoryPath) ||
      !fs.existsSync(ignorePath) || !fs.existsSync(configPath) ||
      !fs.existsSync(executionStatePath)) {
    fail('WORK_0037_STAGED_PAYLOAD_MISSING');
  }
  const state = readJson(executionStatePath, 'WORK_0037_EXECUTION_STATE_INVALID');
  assertStateBase(state);
  assertExactBranchCleanAndPublished(state.repair_head);
  const binding = loadExistingBinding();
  const config = readJson(configPath, 'WORK_0037_TARGET_CONFIG_MISSING');
  if (config.scriptId !== binding.config.scriptId ||
      state.target_fingerprint !== binding.state.target_fingerprint ||
      JSON.stringify(config.scriptExtensions) !== JSON.stringify(['.gs', '.js']) ||
      config.rootDir !== 'payload') {
    fail('WORK_0037_EXISTING_TARGET_CHANGED');
  }
  try {
    assertTargetObjects(config, binding.target, null);
  } catch (error) {
    if (error instanceof ClaspGateError) {
      fail('WORK_0037_EXISTING_TARGET_BINDING_INVALID');
    }
    throw error;
  }
  const names = phase8cPayloadNames();
  assertExactPayloadDirectory(
    payloadRoot, 'WORK_0037_STAGED_PAYLOAD_UNEXPECTED_CONTENT', names
  );
  const saved = assertPayloadInventory(readJson(
    inventoryPath, 'WORK_0037_STAGED_PAYLOAD_INVENTORY_INVALID'
  ));
  const staged = assertPayloadInventory(inventoryForDirectory(payloadRoot, names));
  const committed = assertPayloadInventory(
    inventoryFromBuffers(names, committedPhase8cBuffer)
  );
  if (JSON.stringify(saved) !== JSON.stringify(staged) ||
      JSON.stringify(staged) !== JSON.stringify(committed) ||
      state.payload_sha256 !== staged.payload_sha256 ||
      fs.readFileSync(ignorePath, 'utf8') !== phase8cIgnoreContents(names)) {
    fail('WORK_0037_STAGED_PAYLOAD_MISMATCH');
  }
  return { inventory: staged, config, state, names };
}

function isolatedNativeSelection() {
  const staged = assertStagedPayload();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'work-0037-native-'));
  try {
    const isolatedPayload = path.join(root, 'payload');
    fs.mkdirSync(isolatedPayload, { recursive: true });
    for (const name of staged.names) {
      fs.copyFileSync(path.join(payloadRoot, name), path.join(isolatedPayload, name));
    }
    writeJsonAtomic(path.join(root, '.clasp.json'), claspProjectConfig(
      'REPLACE_WITH_PERSONAL_SYNTHETIC_SCRIPT_ID'
    ));
    fs.writeFileSync(path.join(root, '.claspignore'),
      phase8cIgnoreContents(staged.names), 'utf8');
    const native = assertClaspNativePayloadSelection(root, staged.names);
    if (native.file_count !== 23 || native.names.filter((name) =>
      name.endsWith('.gs')).length !== 22 ||
        native.names.filter((name) => name === 'appsscript.json').length !== 1) {
      fail('CLASP_NATIVE_PAYLOAD_SELECTION_INVALID');
    }
    return {
      file_count: native.file_count,
      gs_file_count: 22,
      manifest_file_count: 1,
      missing_file_count: 0,
      extra_file_count: 0,
      payload_sha256: staged.inventory.payload_sha256,
      preferred_pull_script_extension: '.gs',
      script_extensions: ['.gs', '.js']
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function existingAuthStatus() {
  const authPath = path.join(
    moduleRoot, 'node_modules', '@google', 'clasp', 'build', 'src',
    'auth', 'auth.js'
  );
  if (!fs.existsSync(authPath)) fail('LOCAL_CLASP_NOT_INSTALLED');
  try {
    const authModule = await import(pathToFileURL(authPath).href);
    const auth = await authModule.initAuth({});
    if (!auth || !auth.credentials) fail('USER_ACTION_REQUIRED_BLOCKER');
    return {
      lane: laneName,
      command: 'auth-status',
      status: 'PASS',
      existing_clasp_auth: 'READY',
      account_identity: 'SUPPRESSED',
      google_operation: 'NOT_EXECUTED'
    };
  } catch (error) {
    if (error && error.code === 'USER_ACTION_REQUIRED_BLOCKER') throw error;
    fail('USER_ACTION_REQUIRED_BLOCKER');
  }
}

function pushPayload() {
  if (process.env[pushAllowedEnv] !== 'true' ||
      process.env.GAS_DEV_CLASP_ALLOWED !== 'true') {
    fail('WORK_0037_PUSH_OPT_IN_REQUIRED');
  }
  const staged = assertStagedPayload();
  const automationOff = assertAutomationOffEvidence();
  const native = assertClaspNativePayloadSelection(workspaceRoot, staged.names);
  if (native.file_count !== 23) fail('CLASP_NATIVE_PAYLOAD_SELECTION_INVALID');
  const started = nextAttemptState(staged.state, 'push');
  writeJsonAtomic(executionStatePath, started);
  const result = runClasp(claspSemanticPushArguments, workspaceRoot);
  let semantic;
  try {
    semantic = assertClaspPushSemanticEvidence(
      result, workspaceRoot, staged.names
    );
  } catch (error) {
    if (error instanceof ClaspGateError) fail(error.code);
    throw error;
  }
  if (semantic.file_count !== 23 || semantic.gs_file_count !== 22 ||
      semantic.manifest_file_count !== 1) {
    fail('WORK_0037_PUSH_SEMANTIC_INVENTORY_INVALID');
  }
  Object.assign(started, {
    phase: 'PUSH_PASS',
    push_semantic_file_count: semantic.file_count,
    push_semantic_gs_file_count: semantic.gs_file_count,
    push_semantic_manifest_file_count: semantic.manifest_file_count
  });
  writeJsonAtomic(executionStatePath, started);
  return {
    lane: laneName,
    command: 'push',
    status: 'PASS',
    push_attempt_count: 1,
    file_count: semantic.file_count,
    gs_file_count: semantic.gs_file_count,
    manifest_file_count: semantic.manifest_file_count,
    missing_file_count: semantic.missing_file_count,
    extra_file_count: semantic.extra_file_count,
    update_content_evidenced: semantic.update_content_evidenced,
    native_eligible_file_count: native.file_count,
    payload_sha256: staged.inventory.payload_sha256,
    automation_off: automationOff,
    command_output_sha256: result.output_sha256,
    sensitive_output: 'SUPPRESSED'
  };
}

function preparePullWorkspace(config, names) {
  if (fs.existsSync(pullRoot)) fail('WORK_0037_PULL_WORKSPACE_ALREADY_EXISTS');
  fs.mkdirSync(path.join(pullRoot, 'payload'), { recursive: true });
  writeJsonAtomic(path.join(pullRoot, '.clasp.json'), claspProjectConfig(
    config.scriptId
  ));
  fs.writeFileSync(path.join(pullRoot, '.claspignore'),
    phase8cIgnoreContents(names), 'utf8');
}

function pullVerify() {
  if (process.env[pullAllowedEnv] !== 'true' ||
      process.env.GAS_DEV_CLASP_ALLOWED !== 'true') {
    fail('WORK_0037_PULL_OPT_IN_REQUIRED');
  }
  const staged = assertStagedPayload();
  const started = nextAttemptState(staged.state, 'pull-verify');
  writeJsonAtomic(executionStatePath, started);
  preparePullWorkspace(staged.config, staged.names);
  const result = runClasp(['pull'], pullRoot);
  if (result.exit_code !== 0) fail('WORK_0037_CLASP_PULL_FAILED');
  const pulledRoot = path.join(pullRoot, 'payload');
  assertExactPayloadDirectory(
    pulledRoot, 'WORK_0037_PULLBACK_UNEXPECTED_CONTENT', staged.names
  );
  const pulled = assertPayloadInventory(
    inventoryForDirectory(pulledRoot, staged.names)
  );
  if (JSON.stringify(pulled) !== JSON.stringify(staged.inventory)) {
    fail('WORK_0037_PULLBACK_PARITY_FAILED');
  }
  Object.assign(started, {
    phase: 'PULL_PARITY_PASS',
    pull_file_count: pulled.file_count,
    pull_gs_file_count: 22,
    pull_manifest_file_count: 1,
    pull_parity: 'PASS'
  });
  writeJsonAtomic(executionStatePath, started);
  return {
    lane: laneName,
    command: 'pull-verify',
    status: 'PASS',
    pull_attempt_count: 1,
    parity: 'PASS',
    file_count: pulled.file_count,
    gs_file_count: 22,
    manifest_file_count: 1,
    missing_file_count: 0,
    extra_file_count: 0,
    payload_sha256: pulled.payload_sha256,
    command_output_sha256: result.output_sha256,
    sensitive_output: 'SUPPRESSED'
  };
}

function safeAttemptEvidence(statePath = executionStatePath) {
  if (!fs.existsSync(statePath)) {
    return { push_attempt_count: 0, pull_attempt_count: 0, phase: 'NOT_STARTED' };
  }
  try {
    const state = readJson(statePath, 'WORK_0037_EXECUTION_STATE_INVALID');
    assertStateBase(state);
    return {
      push_attempt_count: state.push_attempt_count,
      pull_attempt_count: state.pull_attempt_count,
      phase: String(state.phase || 'UNKNOWN'),
      push_semantic_file_count: Number.isInteger(state.push_semantic_file_count) ?
        state.push_semantic_file_count : 0,
      pull_file_count: Number.isInteger(state.pull_file_count) ?
        state.pull_file_count : 0,
      pull_parity: state.pull_parity === 'PASS' ? 'PASS' : 'NOT_AVAILABLE'
    };
  } catch (_) {
    return {
      push_attempt_count: 'UNKNOWN',
      pull_attempt_count: 'UNKNOWN',
      phase: 'UNKNOWN'
    };
  }
}

function normalizeCommand(command) {
  return [
    'auth-status', 'stage', 'restage', 'inventory-check', 'push', 'pull-verify',
    'evidence'
  ].includes(command) ? command : 'UNKNOWN';
}

async function main() {
  const command = normalizeCommand(process.argv[2]);
  let releaseLock = null;
  try {
    if (['push', 'pull-verify'].includes(command)) {
      releaseLock = acquireOperationLock(command);
    }
    if (command === 'auth-status') safeWrite(await existingAuthStatus());
    else if (command === 'stage') safeWrite(Object.assign({
      lane: laneName,
      command,
      status: 'PASS',
      google_operation: 'NOT_EXECUTED'
    }, stagePayload()));
    else if (command === 'restage') safeWrite(Object.assign({
      lane: laneName,
      command,
      status: 'PASS',
      google_operation: 'NOT_EXECUTED'
    }, restagePayload()));
    else if (command === 'inventory-check') safeWrite(Object.assign({
      lane: laneName,
      command,
      status: 'PASS',
      google_operation: 'NOT_EXECUTED'
    }, isolatedNativeSelection()));
    else if (command === 'push') safeWrite(pushPayload());
    else if (command === 'pull-verify') safeWrite(pullVerify());
    else if (command === 'evidence') safeWrite({
      lane: laneName,
      command,
      status: 'PASS',
      sensitive_output: 'SUPPRESSED',
      attempts: safeAttemptEvidence()
    });
    else fail('UNKNOWN_WORK_0037_COMMAND');
  } catch (error) {
    const code = error && error.code || 'WORK_0037_OPERATION_FAILED';
    safeWrite({
      lane: laneName,
      command,
      status: code,
      sensitive_output: 'SUPPRESSED',
      attempts: safeAttemptEvidence(),
      message: code
    });
    process.exitCode = 2;
  } finally {
    if (releaseLock) releaseLock();
  }
}

if (require.main === module) main();

module.exports = {
  GateError,
  laneName,
  replacementTranche,
  workspaceName,
  pullWorkspaceName,
  executionStateFileName,
  phase8cReleaseRelativeRoot,
  phase8cPayloadNames,
  phase8cIgnoreContents,
  exactBranch,
  instructionHead,
  isExactBranch: (branch) => branch === exactBranch,
  assertExistingBindingObjects,
  assertPreviousPlacement,
  assertPayloadInventory,
  assertAutomationOffEvidence,
  initialExecutionState,
  restagedExecutionState,
  assertStateBase,
  nextAttemptState,
  acquireOperationLock,
  safeAttemptEvidence,
  normalizeCommand
};
