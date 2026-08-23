'use strict';

/**
 * Exactly-once Work 0037 revised Phase 8C replacement lane.
 *
 * This lane has a fresh ignored state/workspace and never reuses the consumed
 * historical label-gated Work 0037 state as mutation authority. It performs
 * no Apps Script function call: only a guarded source push and one isolated
 * pull-back are exposed after all local/CI gates have passed.
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
const exactBranch = 'codex/0037-personal-shadow-pilot';
const instructionHead = 'c24ad73156031f9a273cfd1be1da48d31d5d2e7a';
const phase8cReleaseRelativeRoot =
  'implementation/GoogleSpreadsheet/release/v2.8.23-prepilot-phase8c/apps-script';
const phase8cSchema =
  'WORK_OS_AUTOMATIC_INBOX_SHADOW_PILOT_REPLACEMENT_V1';
const laneName = 'work_0037_automatic_inbox_shadow_pilot_placement';
const ciConfirmationRequiredEnv =
  'GAS_WORK_0037_AUTOMATIC_INBOX_CI_CONFIRMED';
const pushAllowedEnv = 'GAS_WORK_0037_AUTOMATIC_INBOX_PUSH_ALLOWED';
const pullAllowedEnv = 'GAS_WORK_0037_AUTOMATIC_INBOX_PULL_ALLOWED';
const workspaceName = '.clasp-work-0037-automatic-inbox-shadow-pilot';
const pullWorkspaceName =
  '.clasp-pull-verify-work-0037-automatic-inbox-shadow-pilot';
const workspaceRoot = path.join(moduleRoot, workspaceName);
const pullRoot = path.join(moduleRoot, pullWorkspaceName);
const payloadRoot = path.join(workspaceRoot, 'payload');
const configPath = path.join(workspaceRoot, '.clasp.json');
const ignorePath = path.join(workspaceRoot, '.claspignore');
const inventoryPath = path.join(workspaceRoot, 'payload-inventory.json');
const executionStatePath = path.join(
  workspaceRoot,
  'work-0037-automatic-inbox-shadow-pilot-execution-state.json'
);
const operationLockPath = path.join(
  workspaceRoot,
  'work-0037-automatic-inbox-shadow-pilot-operation.lock'
);
const sourceWorkspaceRoot = path.join(moduleRoot, '.clasp-work-0010');
const sourceConfigPath = path.join(sourceWorkspaceRoot, '.clasp.json');
const sourceTargetPath = path.join(sourceWorkspaceRoot, 'target.json');
const sourceStatePath = path.join(
  sourceWorkspaceRoot, 'work-0010-execution-state.json'
);
const historicalWork0037StatePath = path.join(
  moduleRoot,
  '.clasp-work-0037-personal-shadow-pilot',
  'work-0037-personal-shadow-pilot-execution-state.json'
);
const automationOffEvidenceRelativePath =
  'docs/handoffs/0037-automatic-inbox-shadow-pilot-addendum.md';
const automationOffEvidencePath = path.join(
  repositoryRoot, automationOffEvidenceRelativePath
);

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
    fail('WORK_0037_AUTOMATIC_INBOX_OPERATION_ALREADY_RUNNING');
  }
  return () => {
    try { fs.unlinkSync(operationLockPath); } catch (_) { /* no retry */ }
  };
}

function assertBranchCleanPublished() {
  if (String(git(['branch', '--show-current'])).trim() !== exactBranch) {
    fail('WORK_0037_AUTOMATIC_INBOX_EXACT_BRANCH_REQUIRED');
  }
  if (String(git([
    'status', '--porcelain=v1', '--untracked-files=normal'
  ])).trim()) {
    fail('WORKTREE_NOT_CLEAN');
  }
  const head = currentHead();
  const ancestor = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'merge-base', '--is-ancestor', instructionHead, head
  ], { windowsHide: true });
  if (ancestor.error || ancestor.status !== 0) {
    fail('WORK_0037_AUTOMATIC_INBOX_INSTRUCTION_ANCESTRY_INVALID');
  }
  if (String(git(['rev-parse', `origin/${exactBranch}`])).trim() !== head) {
    fail('WORK_0037_AUTOMATIC_INBOX_HEAD_NOT_PUBLISHED');
  }
  return head;
}

function phase8cPayloadNames() {
  const prefix = `${phase8cReleaseRelativeRoot}/`;
  const names = String(git([
    'ls-tree', '-r', '--name-only', 'HEAD', `${phase8cReleaseRelativeRoot}/`
  ])).trim().split(/\r?\n/).filter(Boolean)
    .filter((name) => name.startsWith(prefix))
    .map((name) => name.slice(prefix.length)).sort();
  if (names.length !== 23 ||
      names.filter((name) => name.endsWith('.gs')).length !== 22 ||
      names.filter((name) => name === 'appsscript.json').length !== 1 ||
      names.some((name) => !name.endsWith('.gs') && name !== 'appsscript.json')) {
    fail('WORK_0037_AUTOMATIC_INBOX_PHASE8C_INVENTORY_INVALID');
  }
  return names;
}

function committedBuffer(name) {
  const result = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'show',
    `HEAD:${phase8cReleaseRelativeRoot}/${name}`
  ], { encoding: null, windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (result.error || result.status !== 0) {
    fail('WORK_0037_AUTOMATIC_INBOX_RELEASE_READ_FAILED');
  }
  return result.stdout;
}

function inventoryFromDirectory(root, names) {
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

function inventoryFromCommitted(names) {
  const files = names.map((name) => ({
    name,
    sha256: sha256(committedBuffer(name))
  }));
  return {
    schema: 'WORK_OS_LOCAL_CLASP_PAYLOAD_V1',
    file_count: files.length,
    files,
    payload_sha256: sha256(files.map((item) =>
      `${item.name}:${item.sha256}`).join('\n'))
  };
}

function assertInventory(inventory, names, code) {
  const actual = inventory && Array.isArray(inventory.files) ?
    inventory.files.map((item) => item.name).sort() : [];
  const expected = names.slice().sort();
  if (!inventory || inventory.schema !== 'WORK_OS_LOCAL_CLASP_PAYLOAD_V1' ||
      inventory.file_count !== 23 ||
      JSON.stringify(actual) !== JSON.stringify(expected) ||
      inventory.files.filter((item) => item.name.endsWith('.gs')).length !== 22 ||
      inventory.files.filter((item) => item.name === 'appsscript.json').length !== 1 ||
      !/^[0-9a-f]{64}$/.test(String(inventory.payload_sha256 || ''))) {
    fail(code);
  }
  return inventory;
}

function ignoreContents(names) {
  return ['**/**'].concat(names.map((name) => `!${name}`), '').join('\n');
}

function assertAutomationOffEvidence() {
  if (process.env.GAS_WORK_0037_AUTOMATIC_INBOX_AUTOMATION_OFF_CONFIRMED !== 'true') {
    fail('AUTOMATION_OFF_CONFIRMATION_REQUIRED');
  }
  let evidence;
  try { evidence = fs.readFileSync(automationOffEvidencePath, 'utf8'); } catch (_) {
    fail('AUTOMATION_OFF_EVIDENCE_MISSING');
  }
  const required = [
    /status: `CONSISTENT`/,
    /enabled: `false`/,
    /desired enabled: `false`/,
    /configured default enabled: `false`/,
    /owned clock trigger count: `0`/,
    /stored trigger ID present: `false`/,
    /canonical trigger present: `false`/,
    /duplicate trigger count: `0`/,
    /external request performed by status read: `false`/
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

function assertHistoricalStateUnchangedEvidence(binding) {
  const state = readJson(
    historicalWork0037StatePath,
    'WORK_0037_HISTORICAL_LABEL_GATED_STATE_MISSING'
  );
  if (state.schema !== 'WORK_OS_PERSONAL_SHADOW_PILOT_REPLACEMENT_V1' ||
      state.work_id !== '0037' || state.phase !== 'PULL_PARITY_PASS' ||
      state.push_attempt_count !== 1 || state.pull_attempt_count !== 1 ||
      state.pull_parity !== 'PASS' ||
      state.target_fingerprint !== binding.state.target_fingerprint) {
    fail('WORK_0037_HISTORICAL_LABEL_GATED_STATE_INVALID');
  }
  return { historical_state: 'PRESERVED_AND_NOT_REUSED_AS_AUTHORITY' };
}

function loadBinding() {
  const config = readJson(sourceConfigPath, 'WORK_0037_SOURCE_CONFIG_MISSING');
  const target = readJson(sourceTargetPath, 'WORK_0037_SOURCE_TARGET_MISSING');
  const state = readJson(sourceStatePath, 'WORK_0037_SOURCE_STATE_MISSING');
  try { assertTargetObjects(config, target, null); } catch (error) {
    if (error instanceof ClaspGateError) fail('WORK_0037_EXISTING_BINDING_INVALID');
    throw error;
  }
  if (state.schema !== 'WORK_OS_SYNTHETIC_TARGET_PLACEMENT_V1' ||
      state.work_id !== '0010' || state.phase !== 'PULL_PARITY_PASS' ||
      state.push_attempt_count !== 1 || state.pull_attempt_count !== 1 ||
      state.pull_parity !== 'PASS' || state.script_id !== config.scriptId ||
      state.script_id !== target.expected_script_id ||
      state.parent_id !== target.expected_parent_id ||
      !/^[0-9a-f]{64}$/.test(String(state.target_fingerprint || ''))) {
    fail('WORK_0037_EXISTING_BINDING_INVALID');
  }
  return { config, target, state };
}

function initialState(head, inventory, binding) {
  return {
    schema: phase8cSchema,
    work_id: '0037',
    source_binding_work_id: '0010',
    historical_placement_work_id: '0037-label-gated',
    payload_path: phase8cReleaseRelativeRoot,
    repair_head: head,
    payload_sha256: inventory.payload_sha256,
    target_fingerprint: binding.state.target_fingerprint,
    push_attempt_count: 0,
    pull_attempt_count: 0,
    phase: 'STAGED'
  };
}

function assertState(state) {
  if (!state || state.schema !== phase8cSchema || state.work_id !== '0037' ||
      state.source_binding_work_id !== '0010' ||
      state.historical_placement_work_id !== '0037-label-gated' ||
      state.payload_path !== phase8cReleaseRelativeRoot ||
      !/^[0-9a-f]{40}$/.test(String(state.repair_head || '')) ||
      !/^[0-9a-f]{64}$/.test(String(state.payload_sha256 || '')) ||
      !/^[0-9a-f]{64}$/.test(String(state.target_fingerprint || '')) ||
      !Number.isInteger(state.push_attempt_count) ||
      !Number.isInteger(state.pull_attempt_count)) {
    fail('WORK_0037_AUTOMATIC_INBOX_EXECUTION_STATE_INVALID');
  }
}

function stagedPayload() {
  if (process.env[ciConfirmationRequiredEnv] !== 'true') {
    fail('WORK_0037_AUTOMATIC_INBOX_CI_CONFIRMATION_REQUIRED');
  }
  const head = assertBranchCleanPublished();
  const automationOff = assertAutomationOffEvidence();
  if (fs.existsSync(workspaceRoot) || fs.existsSync(pullRoot)) {
    fail('WORK_0037_AUTOMATIC_INBOX_LOCAL_STATE_ALREADY_EXISTS');
  }
  const binding = loadBinding();
  assertHistoricalStateUnchangedEvidence(binding);
  const names = phase8cPayloadNames();
  const committed = assertInventory(
    inventoryFromCommitted(names), names,
    'WORK_0037_AUTOMATIC_INBOX_COMMITTED_INVENTORY_INVALID'
  );
  fs.mkdirSync(payloadRoot, { recursive: true });
  for (const name of names) {
    fs.writeFileSync(path.join(payloadRoot, name), committedBuffer(name));
  }
  assertExactPayloadDirectory(payloadRoot, 'WORK_0037_AUTOMATIC_INBOX_PAYLOAD_INVALID', names);
  fs.writeFileSync(ignorePath, ignoreContents(names), 'utf8');
  writeJsonAtomic(configPath, claspProjectConfig(binding.config.scriptId));
  const staged = assertInventory(
    inventoryFromDirectory(payloadRoot, names), names,
    'WORK_0037_AUTOMATIC_INBOX_STAGED_INVENTORY_INVALID'
  );
  if (JSON.stringify(staged) !== JSON.stringify(committed)) {
    fail('WORK_0037_AUTOMATIC_INBOX_SOURCE_SKEW');
  }
  writeJsonAtomic(inventoryPath, staged);
  writeJsonAtomic(executionStatePath, initialState(head, staged, binding));
  return {
    file_count: 23,
    gs_file_count: 22,
    manifest_file_count: 1,
    missing_file_count: 0,
    extra_file_count: 0,
    payload_sha256: staged.payload_sha256,
    automation_off: automationOff
  };
}

function assertStaged() {
  if (!fs.existsSync(workspaceRoot) || !fs.existsSync(payloadRoot) ||
      !fs.existsSync(configPath) || !fs.existsSync(ignorePath) ||
      !fs.existsSync(inventoryPath) || !fs.existsSync(executionStatePath)) {
    fail('WORK_0037_AUTOMATIC_INBOX_STAGED_STATE_MISSING');
  }
  const state = readJson(executionStatePath, 'WORK_0037_AUTOMATIC_INBOX_EXECUTION_STATE_INVALID');
  assertState(state);
  const head = assertBranchCleanPublished();
  if (state.repair_head !== head) fail('WORK_0037_AUTOMATIC_INBOX_STALE_HEAD');
  const binding = loadBinding();
  assertHistoricalStateUnchangedEvidence(binding);
  const names = phase8cPayloadNames();
  const saved = assertInventory(
    readJson(inventoryPath, 'WORK_0037_AUTOMATIC_INBOX_INVENTORY_INVALID'), names,
    'WORK_0037_AUTOMATIC_INBOX_INVENTORY_INVALID'
  );
  const staged = assertInventory(
    inventoryFromDirectory(payloadRoot, names), names,
    'WORK_0037_AUTOMATIC_INBOX_STAGED_INVENTORY_INVALID'
  );
  const committed = assertInventory(
    inventoryFromCommitted(names), names,
    'WORK_0037_AUTOMATIC_INBOX_COMMITTED_INVENTORY_INVALID'
  );
  const config = readJson(configPath, 'WORK_0037_AUTOMATIC_INBOX_CONFIG_INVALID');
  if (JSON.stringify(saved) !== JSON.stringify(staged) ||
      JSON.stringify(staged) !== JSON.stringify(committed) ||
      config.scriptId !== binding.config.scriptId || config.rootDir !== 'payload' ||
      JSON.stringify(config.scriptExtensions) !== JSON.stringify(['.gs', '.js']) ||
      fs.readFileSync(ignorePath, 'utf8') !== ignoreContents(names) ||
      state.target_fingerprint !== binding.state.target_fingerprint) {
    fail('WORK_0037_AUTOMATIC_INBOX_STAGED_PAYLOAD_MISMATCH');
  }
  return { state, binding, config, names, inventory: staged };
}

function isolatedNativeInventory() {
  const staged = assertStaged();
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'work-0037-auto-native-'));
  try {
    const payload = path.join(temp, 'payload');
    fs.mkdirSync(payload, { recursive: true });
    for (const name of staged.names) {
      fs.copyFileSync(path.join(payloadRoot, name), path.join(payload, name));
    }
    writeJsonAtomic(path.join(temp, '.clasp.json'),
      claspProjectConfig('REPLACE_WITH_PERSONAL_SYNTHETIC_SCRIPT_ID'));
    fs.writeFileSync(path.join(temp, '.claspignore'),
      ignoreContents(staged.names), 'utf8');
    const native = assertClaspNativePayloadSelection(temp, staged.names);
    if (native.file_count !== 23 || native.names.filter((name) => name.endsWith('.gs')).length !== 22 ||
        native.names.filter((name) => name === 'appsscript.json').length !== 1) {
      fail('WORK_0037_AUTOMATIC_INBOX_NATIVE_INVENTORY_INVALID');
    }
    return {
      file_count: 23,
      gs_file_count: 22,
      manifest_file_count: 1,
      missing_file_count: 0,
      extra_file_count: 0,
      payload_sha256: staged.inventory.payload_sha256,
      script_extensions: ['.gs', '.js'],
      preferred_pull_script_extension: '.gs'
    };
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
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
    fail('WORK_0037_AUTOMATIC_INBOX_PUSH_OPT_IN_REQUIRED');
  }
  const staged = assertStaged();
  const automationOff = assertAutomationOffEvidence();
  const native = assertClaspNativePayloadSelection(workspaceRoot, staged.names);
  if (native.file_count !== 23) fail('WORK_0037_AUTOMATIC_INBOX_NATIVE_INVENTORY_INVALID');
  if (staged.state.phase !== 'STAGED' || staged.state.push_attempt_count !== 0 ||
      staged.state.pull_attempt_count !== 0) {
    fail('WORK_0037_AUTOMATIC_INBOX_PUSH_ALREADY_ATTEMPTED');
  }
  const started = Object.assign({}, staged.state, {
    push_attempt_count: 1,
    phase: 'PUSH_ATTEMPT_STARTED'
  });
  writeJsonAtomic(executionStatePath, started);
  const result = runClasp(claspSemanticPushArguments, workspaceRoot);
  let semantic;
  try {
    semantic = assertClaspPushSemanticEvidence(result, workspaceRoot, staged.names);
  } catch (error) {
    if (error instanceof ClaspGateError) fail(error.code);
    throw error;
  }
  if (semantic.file_count !== 23 || semantic.gs_file_count !== 22 ||
      semantic.manifest_file_count !== 1) {
    fail('WORK_0037_AUTOMATIC_INBOX_PUSH_INVENTORY_INVALID');
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

function pullVerify() {
  if (process.env[pullAllowedEnv] !== 'true' ||
      process.env.GAS_DEV_CLASP_ALLOWED !== 'true') {
    fail('WORK_0037_AUTOMATIC_INBOX_PULL_OPT_IN_REQUIRED');
  }
  const staged = assertStaged();
  if (staged.state.phase !== 'PUSH_PASS' || staged.state.push_attempt_count !== 1 ||
      staged.state.pull_attempt_count !== 0) {
    fail('WORK_0037_AUTOMATIC_INBOX_PULL_ALREADY_ATTEMPTED');
  }
  const started = Object.assign({}, staged.state, {
    pull_attempt_count: 1,
    phase: 'PULL_ATTEMPT_STARTED'
  });
  writeJsonAtomic(executionStatePath, started);
  if (fs.existsSync(pullRoot)) fail('WORK_0037_AUTOMATIC_INBOX_PULL_WORKSPACE_EXISTS');
  fs.mkdirSync(path.join(pullRoot, 'payload'), { recursive: true });
  writeJsonAtomic(path.join(pullRoot, '.clasp.json'),
    claspProjectConfig(staged.config.scriptId));
  fs.writeFileSync(path.join(pullRoot, '.claspignore'),
    ignoreContents(staged.names), 'utf8');
  const result = runClasp(['pull'], pullRoot);
  if (result.exit_code !== 0) fail('WORK_0037_AUTOMATIC_INBOX_CLASP_PULL_FAILED');
  const pulledRoot = path.join(pullRoot, 'payload');
  assertExactPayloadDirectory(
    pulledRoot, 'WORK_0037_AUTOMATIC_INBOX_PULLBACK_INVENTORY_INVALID', staged.names
  );
  const pulled = assertInventory(
    inventoryFromDirectory(pulledRoot, staged.names), staged.names,
    'WORK_0037_AUTOMATIC_INBOX_PULLBACK_INVENTORY_INVALID'
  );
  if (JSON.stringify(pulled) !== JSON.stringify(staged.inventory)) {
    fail('WORK_0037_AUTOMATIC_INBOX_PULLBACK_PARITY_FAILED');
  }
  Object.assign(started, {
    phase: 'PULL_PARITY_PASS',
    pull_file_count: 23,
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
    file_count: 23,
    gs_file_count: 22,
    manifest_file_count: 1,
    missing_file_count: 0,
    extra_file_count: 0,
    payload_sha256: pulled.payload_sha256,
    command_output_sha256: result.output_sha256,
    sensitive_output: 'SUPPRESSED'
  };
}

function evidence() {
  const state = fs.existsSync(executionStatePath) ?
    readJson(executionStatePath, 'WORK_0037_AUTOMATIC_INBOX_EXECUTION_STATE_INVALID') : null;
  if (state) assertState(state);
  return {
    lane: laneName,
    command: 'evidence',
    status: 'PASS',
    attempts: state ? {
      push_attempt_count: state.push_attempt_count,
      pull_attempt_count: state.pull_attempt_count,
      phase: state.phase,
      pull_parity: state.pull_parity || 'NOT_AVAILABLE'
    } : { push_attempt_count: 0, pull_attempt_count: 0, phase: 'NOT_STARTED' },
    sensitive_output: 'SUPPRESSED'
  };
}

function normalizeCommand(command) {
  return ['auth-status', 'stage', 'inventory-check', 'push', 'pull-verify', 'evidence']
    .includes(command) ? command : 'UNKNOWN';
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
      lane: laneName, command, status: 'PASS', google_operation: 'NOT_EXECUTED'
    }, stagedPayload()));
    else if (command === 'inventory-check') safeWrite(Object.assign({
      lane: laneName, command, status: 'PASS', google_operation: 'NOT_EXECUTED'
    }, isolatedNativeInventory()));
    else if (command === 'push') safeWrite(pushPayload());
    else if (command === 'pull-verify') safeWrite(pullVerify());
    else if (command === 'evidence') safeWrite(evidence());
    else fail('UNKNOWN_WORK_0037_AUTOMATIC_INBOX_COMMAND');
  } catch (error) {
    const code = error && error.code || 'WORK_0037_AUTOMATIC_INBOX_OPERATION_FAILED';
    safeWrite({
      lane: laneName,
      command,
      status: code,
      attempts: fs.existsSync(executionStatePath) ? (() => {
        try {
          const state = readJson(executionStatePath, code);
          return {
            push_attempt_count: state.push_attempt_count,
            pull_attempt_count: state.pull_attempt_count,
            phase: state.phase
          };
        } catch (_) { return { phase: 'UNKNOWN' }; }
      })() : { push_attempt_count: 0, pull_attempt_count: 0, phase: 'NOT_STARTED' },
      sensitive_output: 'SUPPRESSED',
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
  workspaceName,
  pullWorkspaceName,
  phase8cReleaseRelativeRoot,
  phase8cPayloadNames,
  ignoreContents,
  assertState,
  normalizeCommand
};
