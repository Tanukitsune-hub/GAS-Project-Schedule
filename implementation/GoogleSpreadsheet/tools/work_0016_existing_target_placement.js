'use strict';

/**
 * Work 0016-only one-use repair placement lane.
 *
 * The lane reuses the consumed, locally bound Work 0010 personal-synthetic
 * target only as target identity. It never resets or mutates Work 0010 state,
 * creates no Google resource, and emits no target/account identifier.
 */
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  GateError: ClaspGateError,
  canonicalPayloadFileNames,
  canonicalPayloadNames,
  claspIgnoreContents,
  claspProjectConfig,
  claspSemanticPushArguments,
  assertClaspNativePayloadSelection,
  assertClaspPushSemanticEvidence,
  assertExactPayloadDirectory,
  assertTargetObjects,
  inventoryFor,
  inventoryForCommittedPayload,
  runClasp
} = require('./local_clasp_dev');

const moduleRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(moduleRoot, '..', '..');
const sourceRoot = path.join(moduleRoot, 'apps-script-v2');
const sourceRootFromRepository = path.relative(repositoryRoot, sourceRoot)
  .split(path.sep).join('/');
const workspaceName = '.clasp-work-0016';
const pullWorkspaceName = '.clasp-pull-verify-work-0016';
const workspaceRoot = path.join(moduleRoot, workspaceName);
const payloadRoot = path.join(workspaceRoot, 'payload');
const pullRoot = path.join(moduleRoot, pullWorkspaceName);
const inventoryPath = path.join(workspaceRoot, 'payload-inventory.json');
const configPath = path.join(workspaceRoot, '.clasp.json');
const ignorePath = path.join(workspaceRoot, '.claspignore');
const executionStateFileName = 'work-0016-execution-state.json';
const executionStatePath = path.join(workspaceRoot, executionStateFileName);
const operationLockPath = path.join(workspaceRoot, 'work-0016-operation.lock');
const sourceWorkspaceRoot = path.join(moduleRoot, '.clasp-work-0010');
const sourceConfigPath = path.join(sourceWorkspaceRoot, '.clasp.json');
const sourceTargetPath = path.join(sourceWorkspaceRoot, 'target.json');
const sourceStatePath = path.join(
  sourceWorkspaceRoot, 'work-0010-execution-state.json'
);
const exactBranch = 'codex/0016-gmail-body-decode-runtime-repair';
const instructionHead = '2621a64f44c52719f4fb721572f142b4e119c455';

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

function git(args, encoding = 'utf8') {
  const result = childProcess.spawnSync('git', ['-C', repositoryRoot].concat(args), {
    encoding,
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024
  });
  if (result.error || result.status !== 0) fail('GIT_PREFLIGHT_FAILED');
  return result.stdout;
}

function currentHead() {
  return String(git(['rev-parse', 'HEAD'])).trim();
}

function isExactBranch(branch) {
  return branch === exactBranch;
}

function assertExactBranchCleanAndPublished(expectedHead) {
  const branch = String(git(['branch', '--show-current'])).trim();
  if (!isExactBranch(branch)) fail('WORK_0016_EXACT_BRANCH_REQUIRED');
  if (String(git([
    'status', '--porcelain=v1', '--untracked-files=normal'
  ])).trim()) fail('DIRTY_WORKTREE_REFUSED');
  const head = currentHead();
  const ancestry = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'merge-base', '--is-ancestor', instructionHead, head
  ], { windowsHide: true });
  if (ancestry.error || ancestry.status !== 0) {
    fail('WORK_0016_INSTRUCTION_ANCESTRY_INVALID');
  }
  const remote = String(git(['rev-parse', `origin/${exactBranch}`])).trim();
  if (remote !== head) fail('WORK_0016_REPAIR_HEAD_NOT_PUBLISHED');
  if (expectedHead && expectedHead !== head) {
    fail('WORK_0016_REPAIR_HEAD_CHANGED');
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

function acquireOperationLock(command, lockPath = operationLockPath) {
  let descriptor;
  try {
    descriptor = fs.openSync(lockPath, 'wx', 0o600);
    fs.writeFileSync(descriptor, `${command}\n`, 'utf8');
    fs.closeSync(descriptor);
  } catch (_) {
    if (Number.isInteger(descriptor)) fs.closeSync(descriptor);
    fail('WORK_0016_OPERATION_ALREADY_RUNNING');
  }
  return () => {
    try {
      fs.unlinkSync(lockPath);
    } catch (_) {
      // A missing release lock cannot authorize another operation.
    }
  };
}

function assertIdentifierNotTracked(identifier) {
  const result = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'grep', '-I', '-F', '--', identifier
  ], { encoding: 'utf8', windowsHide: true });
  if (result.status === 0) fail('WORK_0016_TARGET_IDENTIFIER_IS_TRACKED');
  if (result.status !== 1) fail('WORK_0016_TRACKED_IDENTIFIER_SCAN_FAILED');
}

function assertExistingBindingObjects(config, target, state) {
  try {
    assertTargetObjects(config, target, null);
  } catch (error) {
    if (error instanceof ClaspGateError) {
      fail('WORK_0016_EXISTING_TARGET_BINDING_INVALID');
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
    typeof state.target_fingerprint === 'string' &&
    state.target_fingerprint.length === 64;
  if (!valid) fail('WORK_0016_EXISTING_TARGET_BINDING_INVALID');
  return { config, target, state };
}

function loadExistingBinding() {
  const binding = assertExistingBindingObjects(
    readJson(sourceConfigPath, 'WORK_0016_EXISTING_TARGET_CONFIG_MISSING'),
    readJson(sourceTargetPath, 'WORK_0016_EXISTING_TARGET_METADATA_MISSING'),
    readJson(sourceStatePath, 'WORK_0016_EXISTING_TARGET_STATE_MISSING')
  );
  assertIdentifierNotTracked(binding.state.script_id);
  assertIdentifierNotTracked(binding.state.parent_id);
  return binding;
}

function committedPayloadBuffer(name) {
  const result = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'show', `HEAD:${sourceRootFromRepository}/${name}`
  ], {
    encoding: null,
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024
  });
  if (result.error || result.status !== 0) fail('COMMITTED_PAYLOAD_READ_FAILED');
  return result.stdout;
}

function assertPayloadInventory(inventory) {
  if (!inventory || inventory.schema !== 'WORK_OS_LOCAL_CLASP_PAYLOAD_V1' ||
      inventory.file_count !== 23 || !Array.isArray(inventory.files) ||
      inventory.files.length !== 23 ||
      inventory.files.filter((file) => file.name.endsWith('.gs')).length !== 22 ||
      inventory.files.filter((file) => file.name === 'appsscript.json').length !== 1 ||
      typeof inventory.payload_sha256 !== 'string' ||
      !/^[0-9a-f]{64}$/.test(inventory.payload_sha256)) {
    fail('WORK_0016_CANONICAL_PAYLOAD_MISMATCH');
  }
  return inventory;
}

function initialExecutionState(repairHead, inventory, binding) {
  return {
    schema: 'WORK_OS_EXISTING_TARGET_REPAIR_PLACEMENT_V1',
    work_id: '0016',
    source_binding_work_id: '0010',
    repair_head: repairHead,
    payload_sha256: inventory.payload_sha256,
    target_fingerprint: binding.state.target_fingerprint,
    push_attempt_count: 0,
    pull_attempt_count: 0,
    phase: 'STAGED'
  };
}

function assertStateBase(state) {
  const valid = state &&
    state.schema === 'WORK_OS_EXISTING_TARGET_REPAIR_PLACEMENT_V1' &&
    state.work_id === '0016' && state.source_binding_work_id === '0010' &&
    /^[0-9a-f]{40}$/.test(String(state.repair_head || '')) &&
    /^[0-9a-f]{64}$/.test(String(state.payload_sha256 || '')) &&
    /^[0-9a-f]{64}$/.test(String(state.target_fingerprint || '')) &&
    Number.isInteger(state.push_attempt_count) &&
    Number.isInteger(state.pull_attempt_count);
  if (!valid) fail('WORK_0016_EXECUTION_STATE_INVALID');
}

function nextAttemptState(state, command) {
  assertStateBase(state);
  const next = Object.assign({}, state);
  if (command === 'push') {
    if (state.phase !== 'STAGED' || state.push_attempt_count !== 0 ||
        state.pull_attempt_count !== 0) fail('WORK_0016_PUSH_ALREADY_ATTEMPTED');
    next.push_attempt_count = 1;
    next.phase = 'PUSH_ATTEMPT_STARTED';
    return next;
  }
  if (command === 'pull-verify') {
    if (state.phase !== 'PUSH_PASS' || state.push_attempt_count !== 1 ||
        state.pull_attempt_count !== 0) fail('WORK_0016_PULL_ALREADY_ATTEMPTED');
    next.pull_attempt_count = 1;
    next.phase = 'PULL_ATTEMPT_STARTED';
    return next;
  }
  fail('WORK_0016_REMOTE_COMMAND_INVALID');
}

function stagePayload() {
  if (process.env.GAS_WORK_0016_REPAIR_CI_CONFIRMED !== 'true') {
    fail('WORK_0016_REPAIR_CI_CONFIRMATION_REQUIRED');
  }
  const head = assertExactBranchCleanAndPublished();
  if (fs.existsSync(workspaceRoot) || fs.existsSync(pullRoot)) {
    fail('WORK_0016_LOCAL_STATE_ALREADY_EXISTS');
  }
  const binding = loadExistingBinding();
  const names = canonicalPayloadNames();
  const committed = assertPayloadInventory(inventoryForCommittedPayload(names));
  fs.mkdirSync(payloadRoot, { recursive: true });
  for (const name of names) {
    fs.writeFileSync(path.join(payloadRoot, name), committedPayloadBuffer(name));
  }
  fs.writeFileSync(ignorePath, claspIgnoreContents(), 'utf8');
  writeJsonAtomic(configPath, claspProjectConfig(binding.config.scriptId));
  const staged = assertPayloadInventory(inventoryFor(payloadRoot, names));
  if (JSON.stringify(staged) !== JSON.stringify(committed)) {
    fail('WORK_0016_STAGED_PAYLOAD_SOURCE_SKEW');
  }
  writeJsonAtomic(inventoryPath, staged);
  writeJsonAtomic(
    executionStatePath,
    initialExecutionState(head, staged, binding)
  );
  return staged;
}

function assertStagedPayload() {
  if (!fs.existsSync(payloadRoot) || !fs.existsSync(inventoryPath) ||
      !fs.existsSync(ignorePath) || !fs.existsSync(configPath) ||
      !fs.existsSync(executionStatePath)) {
    fail('WORK_0016_STAGED_PAYLOAD_MISSING');
  }
  const state = readJson(executionStatePath, 'WORK_0016_EXECUTION_STATE_INVALID');
  assertStateBase(state);
  assertExactBranchCleanAndPublished(state.repair_head);
  const binding = loadExistingBinding();
  const config = readJson(configPath, 'WORK_0016_TARGET_CONFIG_MISSING');
  if (config.scriptId !== binding.config.scriptId ||
      state.target_fingerprint !== binding.state.target_fingerprint) {
    fail('WORK_0016_EXISTING_TARGET_CHANGED');
  }
  try {
    assertTargetObjects(config, binding.target, null);
  } catch (error) {
    if (error instanceof ClaspGateError) {
      fail('WORK_0016_EXISTING_TARGET_BINDING_INVALID');
    }
    throw error;
  }
  assertExactPayloadDirectory(
    payloadRoot, 'WORK_0016_STAGED_PAYLOAD_UNEXPECTED_CONTENT'
  );
  const names = canonicalPayloadNames();
  const saved = assertPayloadInventory(readJson(
    inventoryPath, 'WORK_0016_STAGED_PAYLOAD_INVENTORY_INVALID'
  ));
  const staged = assertPayloadInventory(inventoryFor(payloadRoot, names));
  const committed = assertPayloadInventory(inventoryForCommittedPayload(names));
  if (JSON.stringify(saved) !== JSON.stringify(staged) ||
      JSON.stringify(staged) !== JSON.stringify(committed) ||
      state.payload_sha256 !== staged.payload_sha256 ||
      fs.readFileSync(ignorePath, 'utf8') !== claspIgnoreContents()) {
    fail('WORK_0016_STAGED_PAYLOAD_MISMATCH');
  }
  return { inventory: staged, config, state };
}

function isolatedNativeSelection() {
  const staged = assertStagedPayload();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'work-0016-native-'));
  try {
    const isolatedPayload = path.join(root, 'payload');
    fs.mkdirSync(isolatedPayload, { recursive: true });
    for (const name of canonicalPayloadFileNames) {
      fs.copyFileSync(path.join(payloadRoot, name), path.join(isolatedPayload, name));
    }
    writeJsonAtomic(path.join(root, '.clasp.json'), claspProjectConfig(
      'REPLACE_WITH_PERSONAL_SYNTHETIC_SCRIPT_ID'
    ));
    fs.writeFileSync(path.join(root, '.claspignore'), claspIgnoreContents(), 'utf8');
    const native = assertClaspNativePayloadSelection(root);
    if (native.file_count !== 23) fail('CLASP_NATIVE_PAYLOAD_SELECTION_INVALID');
    return {
      file_count: native.file_count,
      gs_file_count: native.names.filter((name) => name.endsWith('.gs')).length,
      manifest_file_count: native.names.filter((name) =>
        name === 'appsscript.json').length,
      missing_file_count: 0,
      extra_file_count: 0,
      payload_sha256: staged.inventory.payload_sha256,
      preferred_pull_script_extension: claspProjectConfig('placeholder')
        .scriptExtensions[0]
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function existingAuthStatus() {
  const authPath = path.join(
    moduleRoot, 'node_modules', '@google', 'clasp', 'build', 'src', 'auth', 'auth.js'
  );
  if (!fs.existsSync(authPath)) fail('LOCAL_CLASP_NOT_INSTALLED');
  try {
    const authModule = await import(pathToFileURL(authPath).href);
    const auth = await authModule.initAuth({});
    if (!auth || !auth.credentials) fail('USER_ACTION_REQUIRED_BLOCKER');
    return {
      lane: 'work_0016_existing_target_placement',
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
  if (process.env.GAS_WORK_0016_PUSH_ALLOWED !== 'true' ||
      process.env.GAS_DEV_CLASP_ALLOWED !== 'true') {
    fail('WORK_0016_PUSH_OPT_IN_REQUIRED');
  }
  const staged = assertStagedPayload();
  const native = assertClaspNativePayloadSelection(workspaceRoot);
  if (native.file_count !== 23) fail('CLASP_NATIVE_PAYLOAD_SELECTION_INVALID');
  const started = nextAttemptState(staged.state, 'push');
  writeJsonAtomic(executionStatePath, started);
  const result = runClasp(claspSemanticPushArguments, workspaceRoot);
  let semantic;
  try {
    semantic = assertClaspPushSemanticEvidence(result, workspaceRoot);
  } catch (error) {
    if (error instanceof ClaspGateError) fail(error.code);
    throw error;
  }
  Object.assign(started, {
    phase: 'PUSH_PASS',
    push_semantic_file_count: semantic.file_count,
    push_semantic_gs_file_count: semantic.gs_file_count,
    push_semantic_manifest_file_count: semantic.manifest_file_count
  });
  writeJsonAtomic(executionStatePath, started);
  return {
    lane: 'work_0016_existing_target_placement', command: 'push', status: 'PASS',
    push_attempt_count: 1, file_count: semantic.file_count,
    gs_file_count: semantic.gs_file_count,
    manifest_file_count: semantic.manifest_file_count,
    missing_file_count: semantic.missing_file_count,
    extra_file_count: semantic.extra_file_count,
    update_content_evidenced: semantic.update_content_evidenced,
    native_eligible_file_count: native.file_count,
    payload_sha256: staged.inventory.payload_sha256,
    command_output_sha256: result.output_sha256,
    sensitive_output: 'SUPPRESSED'
  };
}

function preparePullWorkspace(config) {
  if (fs.existsSync(pullRoot)) fail('WORK_0016_PULL_WORKSPACE_ALREADY_EXISTS');
  fs.mkdirSync(path.join(pullRoot, 'payload'), { recursive: true });
  writeJsonAtomic(path.join(pullRoot, '.clasp.json'), claspProjectConfig(
    config.scriptId
  ));
  fs.writeFileSync(path.join(pullRoot, '.claspignore'), claspIgnoreContents(), 'utf8');
}

function pullVerify() {
  if (process.env.GAS_WORK_0016_PULL_ALLOWED !== 'true' ||
      process.env.GAS_DEV_CLASP_ALLOWED !== 'true') {
    fail('WORK_0016_PULL_OPT_IN_REQUIRED');
  }
  const staged = assertStagedPayload();
  preparePullWorkspace(staged.config);
  const started = nextAttemptState(staged.state, 'pull-verify');
  writeJsonAtomic(executionStatePath, started);
  const result = runClasp(['pull'], pullRoot);
  if (result.exit_code !== 0) fail('WORK_0016_CLASP_PULL_FAILED');
  const pulledRoot = path.join(pullRoot, 'payload');
  assertExactPayloadDirectory(
    pulledRoot, 'WORK_0016_PULLBACK_UNEXPECTED_CONTENT'
  );
  const pulled = assertPayloadInventory(
    inventoryFor(pulledRoot, canonicalPayloadNames())
  );
  if (JSON.stringify(pulled) !== JSON.stringify(staged.inventory)) {
    fail('WORK_0016_PULLBACK_PARITY_FAILED');
  }
  Object.assign(started, {
    phase: 'PULL_PARITY_PASS',
    pull_file_count: pulled.file_count,
    pull_parity: 'PASS'
  });
  writeJsonAtomic(executionStatePath, started);
  return {
    lane: 'work_0016_existing_target_placement',
    command: 'pull-verify', status: 'PASS', pull_attempt_count: 1,
    parity: 'PASS', file_count: pulled.file_count,
    gs_file_count: pulled.files.filter((file) => file.name.endsWith('.gs')).length,
    manifest_file_count: pulled.files.filter((file) =>
      file.name === 'appsscript.json').length,
    missing_file_count: 0, extra_file_count: 0,
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
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
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
      push_attempt_count: 'UNKNOWN', pull_attempt_count: 'UNKNOWN', phase: 'UNKNOWN'
    };
  }
}

function normalizeCommand(command) {
  return [
    'auth-status', 'stage', 'inventory-check', 'push', 'pull-verify', 'evidence'
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
      lane: 'work_0016_existing_target_placement', command, status: 'PASS',
      google_operation: 'NOT_EXECUTED'
    }, stagePayload()));
    else if (command === 'inventory-check') safeWrite(Object.assign({
      lane: 'work_0016_existing_target_placement', command, status: 'PASS',
      google_operation: 'NOT_EXECUTED'
    }, isolatedNativeSelection()));
    else if (command === 'push') safeWrite(pushPayload());
    else if (command === 'pull-verify') safeWrite(pullVerify());
    else if (command === 'evidence') safeWrite({
      lane: 'work_0016_existing_target_placement', command, status: 'PASS',
      sensitive_output: 'SUPPRESSED', attempts: safeAttemptEvidence()
    });
    else fail('UNKNOWN_WORK_0016_COMMAND');
  } catch (error) {
    const code = error && error.code || 'WORK_0016_OPERATION_FAILED';
    safeWrite({
      lane: 'work_0016_existing_target_placement', command, status: code,
      sensitive_output: 'SUPPRESSED', attempts: safeAttemptEvidence(),
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
  workspaceName,
  pullWorkspaceName,
  executionStateFileName,
  exactBranch,
  instructionHead,
  isExactBranch,
  assertExistingBindingObjects,
  assertPayloadInventory,
  initialExecutionState,
  nextAttemptState,
  acquireOperationLock,
  safeAttemptEvidence,
  normalizeCommand
};
