'use strict';

/**
 * Work 0010-only one-use personal-synthetic placement lane.
 *
 * Historical Work 0004/0006 state and targets are outside this workspace and
 * are never read or accepted as authority. Output is restricted to closed
 * enums, counts, hashes, and non-reversible fingerprints.
 */
const childProcess = require('node:child_process');
const crypto = require('node:crypto');
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
const {
  isPersonalEmail,
  principalFingerprint,
  targetFingerprint,
  validateInspectionEvidence
} = require('./work_0003_target_bootstrap');
const { classifyRemoteContent } = require('./work_0007_remote_content_inspector');

const moduleRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(moduleRoot, '..', '..');
const sourceRoot = path.join(moduleRoot, 'apps-script-v2');
const sourceRootFromRepository = path.relative(repositoryRoot, sourceRoot)
  .split(path.sep).join('/');
const workspaceName = '.clasp-work-0010';
const pullWorkspaceName = '.clasp-pull-verify-work-0010';
const workspaceRoot = path.join(moduleRoot, workspaceName);
const payloadRoot = path.join(workspaceRoot, 'payload');
const pullRoot = path.join(moduleRoot, pullWorkspaceName);
const inventoryPath = path.join(workspaceRoot, 'payload-inventory.json');
const configPath = path.join(workspaceRoot, '.clasp.json');
const ignorePath = path.join(workspaceRoot, '.claspignore');
const targetPath = path.join(workspaceRoot, 'target.json');
const executionStateFileName = 'work-0010-execution-state.json';
const executionStatePath = path.join(workspaceRoot, executionStateFileName);
const operationLockFileName = 'work-0010-operation.lock';
const operationLockPath = path.join(workspaceRoot, operationLockFileName);
const exactBranch = 'codex/0010-fresh-controlled-remote-placement';
const startingWork0007Head =
  '3f54d2a90c38ea574db6bd20ab8341d27d82a183';
const expectedPayloadSha256 =
  '31849408d30085f117944c7161e8ca30d54fa7d8afec94ee1e91f45524358fed';
const syntheticTitle = 'Work OS Synthetic Sandbox Work 0010';
const spreadsheetMimeType = 'application/vnd.google-apps.spreadsheet';

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

function assertCandidatePreserved() {
  const protectedPaths = [
    'implementation/GoogleSpreadsheet/apps-script-v2',
    'implementation/GoogleSpreadsheet/release',
    'CURRENT_CONTRACT.json',
    'CURRENT_STATUS.md',
    'DECISIONS.md',
    'PROJECT_CONTEXT.md',
    'MASTER_PLAN.md',
    'AGENTS.md',
    'implementation/GoogleSpreadsheet/pnpm-lock.yaml',
    '.codex'
  ];
  const result = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'diff', '--quiet', startingWork0007Head, 'HEAD', '--'
  ].concat(protectedPaths), { windowsHide: true });
  if (result.error || result.status !== 0) {
    fail('WORK_0010_CANDIDATE_PRESERVATION_FAILED');
  }
}

function assertExactBranchCleanAndPublished(expectedHead) {
  const branch = String(git(['branch', '--show-current'])).trim();
  if (!isExactBranch(branch)) fail('WORK_0010_EXACT_BRANCH_REQUIRED');
  const status = String(git([
    'status', '--porcelain=v1', '--untracked-files=normal'
  ])).trim();
  if (status) fail('DIRTY_WORKTREE_REFUSED');
  const head = currentHead();
  const ancestry = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'merge-base', '--is-ancestor',
    startingWork0007Head, head
  ], { windowsHide: true });
  if (ancestry.error || ancestry.status !== 0) {
    fail('WORK_0010_STARTING_ANCESTRY_INVALID');
  }
  const remote = String(git(['rev-parse', `origin/${exactBranch}`])).trim();
  if (remote !== head) fail('WORK_0010_PRE_GOOGLE_HEAD_NOT_PUBLISHED');
  if (expectedHead && expectedHead !== head) {
    fail('WORK_0010_PRE_GOOGLE_HEAD_CHANGED');
  }
  assertCandidatePreserved();
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
    fail('WORK_0010_OPERATION_ALREADY_RUNNING');
  }
  return () => {
    try {
      fs.unlinkSync(lockPath);
    } catch (_) {
      // A missing lock at release cannot authorize another operation here.
    }
  };
}

function committedPayloadBuffer(name) {
  const spec = `HEAD:${sourceRootFromRepository}/${name}`;
  const result = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'show', spec
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
      inventory.file_count !== canonicalPayloadFileNames.length ||
      inventory.payload_sha256 !== expectedPayloadSha256 ||
      !Array.isArray(inventory.files) ||
      inventory.files.length !== canonicalPayloadFileNames.length) {
    fail('WORK_0010_CANONICAL_PAYLOAD_MISMATCH');
  }
  return inventory;
}

function stagePayload() {
  assertExactBranchCleanAndPublished();
  if (fs.existsSync(workspaceRoot) || fs.existsSync(pullRoot)) {
    fail('WORK_0010_LOCAL_STATE_ALREADY_EXISTS');
  }
  const names = canonicalPayloadNames();
  const committed = assertPayloadInventory(inventoryForCommittedPayload(names));
  fs.mkdirSync(payloadRoot, { recursive: true });
  for (const name of names) {
    fs.writeFileSync(path.join(payloadRoot, name), committedPayloadBuffer(name));
  }
  fs.writeFileSync(ignorePath, claspIgnoreContents(), 'utf8');
  const staged = assertPayloadInventory(inventoryFor(payloadRoot, names));
  if (JSON.stringify(staged) !== JSON.stringify(committed)) {
    fail('WORK_0010_STAGED_PAYLOAD_SOURCE_SKEW');
  }
  writeJsonAtomic(inventoryPath, staged);
  return staged;
}

function assertStagedPayload() {
  if (!fs.existsSync(payloadRoot) || !fs.existsSync(inventoryPath) ||
      !fs.existsSync(ignorePath)) fail('WORK_0010_STAGED_PAYLOAD_MISSING');
  const names = canonicalPayloadNames();
  assertExactPayloadDirectory(
    payloadRoot, 'WORK_0010_STAGED_PAYLOAD_UNEXPECTED_CONTENT'
  );
  const saved = assertPayloadInventory(readJson(
    inventoryPath, 'WORK_0010_STAGED_PAYLOAD_INVENTORY_INVALID'
  ));
  const staged = assertPayloadInventory(inventoryFor(payloadRoot, names));
  const committed = assertPayloadInventory(inventoryForCommittedPayload(names));
  if (JSON.stringify(saved) !== JSON.stringify(staged) ||
      JSON.stringify(staged) !== JSON.stringify(committed) ||
      fs.readFileSync(ignorePath, 'utf8') !== claspIgnoreContents()) {
    fail('WORK_0010_STAGED_PAYLOAD_MISMATCH');
  }
  return staged;
}

function isolatedNativeSelection() {
  const inventory = assertStagedPayload();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'work-0010-native-'));
  try {
    const payload = path.join(root, 'payload');
    fs.mkdirSync(payload, { recursive: true });
    for (const name of canonicalPayloadFileNames) {
      fs.copyFileSync(path.join(payloadRoot, name), path.join(payload, name));
    }
    writeJsonAtomic(path.join(root, '.clasp.json'), claspProjectConfig(
      'REPLACE_WITH_SYNTHETIC_SCRIPT_ID'
    ));
    fs.writeFileSync(path.join(root, '.claspignore'), claspIgnoreContents(), 'utf8');
    const status = assertClaspNativePayloadSelection(root);
    return {
      file_count: status.file_count,
      gs_file_count: status.names.filter((name) => name.endsWith('.gs')).length,
      manifest_file_count: status.names.filter((name) =>
        name === 'appsscript.json').length,
      missing_file_count: 0,
      extra_file_count: 0,
      payload_sha256: inventory.payload_sha256,
      preferred_pull_script_extension: claspProjectConfig('placeholder')
        .scriptExtensions[0]
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function initialAuthState(preGoogleHead, salt) {
  return {
    schema: 'WORK_OS_SYNTHETIC_TARGET_PLACEMENT_V1',
    work_id: '0010',
    pre_google_head: preGoogleHead,
    payload_sha256: expectedPayloadSha256,
    auth_preflight_attempt_count: 1,
    create_attempt_count: 0,
    inspection_attempt_count: 0,
    push_attempt_count: 0,
    content_read_attempt_count: 0,
    pull_attempt_count: 0,
    phase: 'AUTH_PREFLIGHT_ATTEMPT_STARTED',
    salt_base64: salt.toString('base64'),
    principal_fingerprint: null,
    parent_id: null,
    script_id: null,
    target_fingerprint: null
  };
}

function claimAuthPreflight(preGoogleHead, salt, statePath = executionStatePath) {
  const state = initialAuthState(preGoogleHead, salt);
  let descriptor;
  try {
    descriptor = fs.openSync(statePath, 'wx', 0o600);
    fs.writeFileSync(descriptor, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    fs.closeSync(descriptor);
  } catch (_) {
    if (Number.isInteger(descriptor)) fs.closeSync(descriptor);
    fail('WORK_0010_AUTH_PREFLIGHT_ALREADY_ATTEMPTED');
  }
  return state;
}

function assertStateBase(state) {
  const valid = state &&
    state.schema === 'WORK_OS_SYNTHETIC_TARGET_PLACEMENT_V1' &&
    state.work_id === '0010' &&
    /^[0-9a-f]{40}$/.test(String(state.pre_google_head || '')) &&
    state.payload_sha256 === expectedPayloadSha256 &&
    state.auth_preflight_attempt_count === 1 &&
    Number.isInteger(state.create_attempt_count) &&
    Number.isInteger(state.inspection_attempt_count) &&
    Number.isInteger(state.push_attempt_count) &&
    Number.isInteger(state.content_read_attempt_count) &&
    Number.isInteger(state.pull_attempt_count);
  if (!valid) fail('WORK_0010_EXECUTION_STATE_INVALID');
}

function nextAttemptState(state, command) {
  assertStateBase(state);
  const next = Object.assign({}, state);
  if (command === 'create-synthetic') {
    if (state.phase !== 'AUTH_PREFLIGHT_PASS' ||
        state.create_attempt_count !== 0 || state.inspection_attempt_count !== 0 ||
        state.push_attempt_count !== 0 || state.content_read_attempt_count !== 0 ||
        state.pull_attempt_count !== 0 || !state.principal_fingerprint) {
      fail('WORK_0010_CREATE_ALREADY_ATTEMPTED_OR_AUTH_NOT_PASSED');
    }
    next.create_attempt_count = 1;
    next.phase = 'CREATE_ATTEMPT_STARTED';
    return next;
  }
  if (command === 'inspect-synthetic') {
    if (!['LOCAL_BINDING_WRITTEN', 'INSPECTION_PASS'].includes(state.phase) ||
        state.create_attempt_count !== 1 || state.inspection_attempt_count >= 2 ||
        state.push_attempt_count !== 0 || state.content_read_attempt_count !== 0 ||
        state.pull_attempt_count !== 0) {
      fail('WORK_0010_INSPECTION_LIMIT_OR_CREATION_INVALID');
    }
    next.inspection_attempt_count += 1;
    next.phase = 'INSPECTION_ATTEMPT_STARTED';
    return next;
  }
  if (command === 'push') {
    if (state.phase !== 'INSPECTION_PASS' || state.create_attempt_count !== 1 ||
        state.inspection_attempt_count < 1 || state.inspection_attempt_count > 2 ||
        state.push_attempt_count !== 0 || state.content_read_attempt_count !== 0 ||
        state.pull_attempt_count !== 0) fail('WORK_0010_PUSH_ALREADY_ATTEMPTED');
    next.push_attempt_count = 1;
    next.phase = 'PUSH_ATTEMPT_STARTED';
    return next;
  }
  if (command === 'inspect-content') {
    if (state.phase !== 'PUSH_PASS' || state.push_attempt_count !== 1 ||
        state.content_read_attempt_count !== 0 || state.pull_attempt_count !== 0) {
      fail('WORK_0010_CONTENT_READ_ALREADY_ATTEMPTED_OR_PUSH_NOT_PASSED');
    }
    next.content_read_attempt_count = 1;
    next.phase = 'CONTENT_READ_ATTEMPT_STARTED';
    return next;
  }
  if (command === 'pull-verify') {
    if (state.phase !== 'POST_PUSH_READ_PASS' || state.push_attempt_count !== 1 ||
        state.content_read_attempt_count !== 1 || state.pull_attempt_count !== 0) {
      fail('WORK_0010_PULL_ALREADY_ATTEMPTED_OR_READ_NOT_PASSED');
    }
    next.pull_attempt_count = 1;
    next.phase = 'PULL_ATTEMPT_STARTED';
    return next;
  }
  fail('WORK_0010_REMOTE_COMMAND_INVALID');
}

function assertIdentifierNotTracked(identifier) {
  const result = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'grep', '-I', '-F', '--', identifier
  ], { encoding: 'utf8', windowsHide: true });
  if (result.status === 0) fail('WORK_0010_TARGET_IDENTIFIER_IS_TRACKED');
  if (result.status !== 1) fail('WORK_0010_TRACKED_IDENTIFIER_SCAN_FAILED');
}

async function loadExistingPersonalAuth(requireUser) {
  const authPath = path.join(
    moduleRoot, 'node_modules', '@google', 'clasp', 'build', 'src', 'auth', 'auth.js'
  );
  if (!fs.existsSync(authPath)) fail('LOCAL_CLASP_NOT_INSTALLED');
  try {
    const authModule = await import(pathToFileURL(authPath).href);
    const auth = await authModule.initAuth({});
    if (!auth || !auth.credentials) fail('USER_ACTION_REQUIRED_BLOCKER');
    if (!requireUser) return { credentials: auth.credentials };
    const user = await authModule.getUserInfo(auth.credentials);
    if (!user || !user.id || !isPersonalEmail(user.email)) {
      fail('USER_ACTION_REQUIRED_BLOCKER');
    }
    return { credentials: auth.credentials, user };
  } catch (error) {
    if (error && error.code === 'USER_ACTION_REQUIRED_BLOCKER') throw error;
    fail('USER_ACTION_REQUIRED_BLOCKER');
  }
}

async function googleRequest(credentials, options, failureCode) {
  try {
    return await credentials.request(Object.assign({
      retry: false,
      retryConfig: { retry: 0 }
    }, options));
  } catch (error) {
    const status = Number(error && error.response && error.response.status || 0);
    if (status === 401 || status === 403) fail('USER_ACTION_REQUIRED_BLOCKER');
    fail(failureCode);
  }
}

function assertTargetBinding(config, target, state) {
  try {
    assertTargetObjects(config, target, null);
  } catch (error) {
    if (error instanceof ClaspGateError) fail('WORK_0010_TARGET_BINDING_INVALID');
    throw error;
  }
  assertStateBase(state);
  const valid = target &&
    target.schema === 'WORK_OS_PERSONAL_SYNTHETIC_TARGET_V2' &&
    target.work_id === '0010' &&
    target.target_kind === 'PERSONAL_SYNTHETIC_DEV' &&
    target.target_disposition === 'FRESH_SYNTHETIC_CREATED' &&
    state.script_id === config.scriptId &&
    state.script_id === target.expected_script_id &&
    state.parent_id === target.expected_parent_id &&
    state.principal_fingerprint === target.principal_fingerprint &&
    state.target_fingerprint === target.target_fingerprint;
  if (!valid) fail('WORK_0010_TARGET_BINDING_INVALID');
  assertIdentifierNotTracked(state.script_id);
  assertIdentifierNotTracked(state.parent_id);
  return { config, target, state };
}

async function authPreflight() {
  if (process.env.GAS_WORK_0010_AUTH_PREFLIGHT_ALLOWED !== 'true' ||
      process.env.GAS_WORK_0010_PRE_GOOGLE_CI_CONFIRMED !== 'true') {
    fail('WORK_0010_AUTH_PREFLIGHT_OPT_IN_REQUIRED');
  }
  const head = assertExactBranchCleanAndPublished();
  const inventory = assertStagedPayload();
  if (fs.existsSync(executionStatePath) || fs.existsSync(configPath) ||
      fs.existsSync(targetPath)) fail('WORK_0010_AUTH_PREFLIGHT_ALREADY_ATTEMPTED');
  const state = claimAuthPreflight(head, crypto.randomBytes(32));
  const auth = await loadExistingPersonalAuth(true);
  state.principal_fingerprint = principalFingerprint(
    Buffer.from(state.salt_base64, 'base64'), auth.user
  );
  state.phase = 'AUTH_PREFLIGHT_PASS';
  writeJsonAtomic(executionStatePath, state);
  return {
    lane: 'work_0010_remote_placement', command: 'auth-preflight', status: 'PASS',
    non_interactive_auth: 'PASS', principal_kind: 'PERSONAL',
    auth_preflight_attempt_count: 1, create_attempt_count: 0,
    file_count: inventory.file_count, payload_sha256: inventory.payload_sha256,
    sensitive_output: 'SUPPRESSED'
  };
}

async function createSynthetic() {
  if (process.env.GAS_WORK_0010_CREATE_SYNTHETIC_ALLOWED !== 'true') {
    fail('WORK_0010_CREATE_OPT_IN_REQUIRED');
  }
  const state = readJson(executionStatePath, 'WORK_0010_EXECUTION_STATE_MISSING');
  assertExactBranchCleanAndPublished(state.pre_google_head);
  const inventory = assertStagedPayload();
  if (fs.existsSync(configPath) || fs.existsSync(targetPath)) {
    fail('WORK_0010_CREATE_ALREADY_ATTEMPTED_OR_AUTH_NOT_PASSED');
  }
  const auth = await loadExistingPersonalAuth(true);
  const salt = Buffer.from(state.salt_base64, 'base64');
  if (principalFingerprint(salt, auth.user) !== state.principal_fingerprint) {
    fail('WORK_0010_PRINCIPAL_MISMATCH');
  }
  const started = nextAttemptState(state, 'create-synthetic');
  writeJsonAtomic(executionStatePath, started);
  const parentResponse = await googleRequest(auth.credentials, {
    url: 'https://www.googleapis.com/drive/v3/files', method: 'POST',
    params: { fields: 'id' },
    data: { name: syntheticTitle, mimeType: spreadsheetMimeType }
  }, 'WORK_0010_SYNTHETIC_CONTAINER_CREATE_FAILED');
  const parentId = String(parentResponse && parentResponse.data &&
    parentResponse.data.id || '');
  if (!/^[A-Za-z0-9_-]{20,}$/.test(parentId)) {
    fail('WORK_0010_SYNTHETIC_CONTAINER_CREATE_RESULT_INVALID');
  }
  started.parent_id = parentId;
  started.phase = 'CONTAINER_CREATED';
  writeJsonAtomic(executionStatePath, started);
  const scriptResponse = await googleRequest(auth.credentials, {
    url: 'https://script.googleapis.com/v1/projects', method: 'POST',
    data: { title: syntheticTitle, parentId }
  }, 'WORK_0010_BOUND_SCRIPT_CREATE_FAILED');
  const scriptId = String(scriptResponse && scriptResponse.data &&
    scriptResponse.data.scriptId || '');
  if (!/^[A-Za-z0-9_-]{20,}$/.test(scriptId)) {
    fail('WORK_0010_BOUND_SCRIPT_CREATE_RESULT_INVALID');
  }
  started.script_id = scriptId;
  started.target_fingerprint = targetFingerprint(salt, scriptId, parentId);
  started.phase = 'BOUND_SCRIPT_CREATED';
  writeJsonAtomic(executionStatePath, started);
  writeJsonAtomic(configPath, claspProjectConfig(scriptId));
  writeJsonAtomic(targetPath, {
    schema: 'WORK_OS_PERSONAL_SYNTHETIC_TARGET_V2',
    work_id: '0010', target_kind: 'PERSONAL_SYNTHETIC_DEV',
    expected_script_id: scriptId, expected_parent_id: parentId,
    principal_fingerprint: started.principal_fingerprint,
    target_fingerprint: started.target_fingerprint,
    target_disposition: 'FRESH_SYNTHETIC_CREATED',
    runtime_dry_run_allowed: false, runtime_function: ''
  });
  assertIdentifierNotTracked(scriptId);
  assertIdentifierNotTracked(parentId);
  started.phase = 'LOCAL_BINDING_WRITTEN';
  writeJsonAtomic(executionStatePath, started);
  return {
    lane: 'work_0010_remote_placement', command: 'create-synthetic',
    status: 'PASS', target_disposition: 'FRESH_SYNTHETIC_CREATED',
    create_attempt_count: 1, file_count: inventory.file_count,
    payload_sha256: inventory.payload_sha256,
    principal_binding: 'PASS', target_fingerprint: started.target_fingerprint,
    sensitive_output: 'SUPPRESSED'
  };
}

async function inspectSynthetic() {
  if (process.env.GAS_WORK_0010_INSPECT_ALLOWED !== 'true') {
    fail('WORK_0010_INSPECT_OPT_IN_REQUIRED');
  }
  const state = readJson(executionStatePath, 'WORK_0010_EXECUTION_STATE_MISSING');
  assertExactBranchCleanAndPublished(state.pre_google_head);
  const inventory = assertStagedPayload();
  const config = readJson(configPath, 'WORK_0010_TARGET_NOT_CONFIGURED');
  const target = readJson(targetPath, 'WORK_0010_TARGET_NOT_CONFIGURED');
  assertTargetBinding(config, target, state);
  const started = nextAttemptState(state, 'inspect-synthetic');
  writeJsonAtomic(executionStatePath, started);
  const auth = await loadExistingPersonalAuth(true);
  const salt = Buffer.from(started.salt_base64, 'base64');
  if (principalFingerprint(salt, auth.user) !== started.principal_fingerprint) {
    fail('WORK_0010_PRINCIPAL_MISMATCH');
  }
  const parentId = started.parent_id;
  const scriptId = started.script_id;
  const driveResponse = await googleRequest(auth.credentials, {
    url: `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(parentId)}`,
    method: 'GET',
    params: { fields: 'id,mimeType,ownedByMe,driveId,owners(emailAddress,me)' }
  }, 'WORK_0010_DRIVE_METADATA_INSPECTION_FAILED');
  const permissionResponse = await googleRequest(auth.credentials, {
    url: `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(parentId)}/permissions`,
    method: 'GET',
    params: { fields: 'permissions(role,type,pendingOwner,emailAddress,deleted)' }
  }, 'WORK_0010_PERMISSION_INSPECTION_FAILED');
  const scriptResponse = await googleRequest(auth.credentials, {
    url: `https://script.googleapis.com/v1/projects/${encodeURIComponent(scriptId)}`,
    method: 'GET'
  }, 'WORK_0010_SCRIPT_METADATA_INSPECTION_FAILED');
  const ownership = validateInspectionEvidence({
    principal_email: auth.user.email,
    parent_id: parentId,
    script_id: scriptId,
    drive: driveResponse.data,
    permissions: permissionResponse.data && permissionResponse.data.permissions,
    script: scriptResponse.data
  });
  if (targetFingerprint(salt, scriptId, parentId) !== started.target_fingerprint) {
    fail('WORK_0010_TARGET_FINGERPRINT_MISMATCH');
  }
  started.phase = 'INSPECTION_PASS';
  writeJsonAtomic(executionStatePath, started);
  return {
    lane: 'work_0010_remote_placement', command: 'inspect-synthetic',
    status: 'PASS', inspection_attempt_count: started.inspection_attempt_count,
    file_count: inventory.file_count, payload_sha256: inventory.payload_sha256,
    principal_binding: 'PASS', target_binding: 'PASS', ownership,
    target_fingerprint: started.target_fingerprint,
    sensitive_output: 'SUPPRESSED'
  };
}

async function pushPayload() {
  if (process.env.GAS_WORK_0010_PUSH_ALLOWED !== 'true' ||
      process.env.GAS_DEV_CLASP_ALLOWED !== 'true') {
    fail('WORK_0010_PUSH_OPT_IN_REQUIRED');
  }
  const state = readJson(executionStatePath, 'WORK_0010_EXECUTION_STATE_MISSING');
  assertExactBranchCleanAndPublished(state.pre_google_head);
  const inventory = assertStagedPayload();
  const config = readJson(configPath, 'WORK_0010_TARGET_NOT_CONFIGURED');
  const target = readJson(targetPath, 'WORK_0010_TARGET_NOT_CONFIGURED');
  assertTargetBinding(config, target, state);
  const native = assertClaspNativePayloadSelection(workspaceRoot);
  if (native.file_count !== canonicalPayloadFileNames.length) {
    fail('CLASP_NATIVE_PAYLOAD_SELECTION_INVALID');
  }
  const started = nextAttemptState(state, 'push');
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
    lane: 'work_0010_remote_placement', command: 'push', status: 'PASS',
    push_attempt_count: 1, file_count: semantic.file_count,
    gs_file_count: semantic.gs_file_count,
    manifest_file_count: semantic.manifest_file_count,
    missing_file_count: semantic.missing_file_count,
    extra_file_count: semantic.extra_file_count,
    update_content_evidenced: semantic.update_content_evidenced,
    native_eligible_file_count: native.file_count,
    payload_sha256: inventory.payload_sha256,
    command_output_sha256: result.output_sha256,
    sensitive_output: 'SUPPRESSED'
  };
}

function requireCanonicalRemoteContent(evidence) {
  if (!evidence || evidence.classification !== 'REMOTE_HAS_23_CANONICAL_FILES' ||
      evidence.total_file_count !== 23 || evidence.server_js_file_count !== 22 ||
      evidence.manifest_file_count !== 1 || evidence.html_file_count !== 0 ||
      evidence.invalid_file_count !== 0 || evidence.missing_file_count !== 0 ||
      evidence.extra_file_count !== 0) {
    fail('WORK_0010_POST_PUSH_REMOTE_CONTENT_INVALID');
  }
  return evidence;
}

async function inspectContent() {
  if (process.env.GAS_WORK_0010_CONTENT_READ_ALLOWED !== 'true') {
    fail('WORK_0010_CONTENT_READ_OPT_IN_REQUIRED');
  }
  const state = readJson(executionStatePath, 'WORK_0010_EXECUTION_STATE_MISSING');
  assertExactBranchCleanAndPublished(state.pre_google_head);
  assertStagedPayload();
  const config = readJson(configPath, 'WORK_0010_TARGET_NOT_CONFIGURED');
  const target = readJson(targetPath, 'WORK_0010_TARGET_NOT_CONFIGURED');
  assertTargetBinding(config, target, state);
  const auth = await loadExistingPersonalAuth(false);
  const started = nextAttemptState(state, 'inspect-content');
  writeJsonAtomic(executionStatePath, started);
  const response = await googleRequest(auth.credentials, {
    url: `https://script.googleapis.com/v1/projects/${encodeURIComponent(
      started.script_id
    )}/content`,
    method: 'GET'
  }, 'WORK_0010_REMOTE_CONTENT_READ_FAILED');
  const evidence = classifyRemoteContent(
    response && response.data && response.data.files
  );
  Object.assign(started, evidence);
  if (evidence.classification !== 'REMOTE_HAS_23_CANONICAL_FILES') {
    started.phase = 'POST_PUSH_READ_FAILED';
    writeJsonAtomic(executionStatePath, started);
    requireCanonicalRemoteContent(evidence);
  }
  requireCanonicalRemoteContent(evidence);
  started.phase = 'POST_PUSH_READ_PASS';
  writeJsonAtomic(executionStatePath, started);
  return Object.assign({
    lane: 'work_0010_remote_placement', command: 'inspect-content',
    status: 'PASS', content_read_attempt_count: 1,
    sensitive_output: 'SUPPRESSED'
  }, evidence);
}

function preparePullWorkspace(config) {
  if (fs.existsSync(pullRoot)) fail('WORK_0010_PULL_WORKSPACE_ALREADY_EXISTS');
  fs.mkdirSync(path.join(pullRoot, 'payload'), { recursive: true });
  writeJsonAtomic(path.join(pullRoot, '.clasp.json'), claspProjectConfig(
    config.scriptId
  ));
  fs.writeFileSync(path.join(pullRoot, '.claspignore'), claspIgnoreContents(), 'utf8');
}

async function pullVerify() {
  if (process.env.GAS_WORK_0010_PULL_ALLOWED !== 'true' ||
      process.env.GAS_DEV_CLASP_ALLOWED !== 'true') {
    fail('WORK_0010_PULL_OPT_IN_REQUIRED');
  }
  const state = readJson(executionStatePath, 'WORK_0010_EXECUTION_STATE_MISSING');
  assertExactBranchCleanAndPublished(state.pre_google_head);
  const inventory = assertStagedPayload();
  const config = readJson(configPath, 'WORK_0010_TARGET_NOT_CONFIGURED');
  const target = readJson(targetPath, 'WORK_0010_TARGET_NOT_CONFIGURED');
  assertTargetBinding(config, target, state);
  preparePullWorkspace(config);
  const started = nextAttemptState(state, 'pull-verify');
  writeJsonAtomic(executionStatePath, started);
  const result = runClasp(['pull'], pullRoot);
  if (result.exit_code !== 0) fail('WORK_0010_CLASP_PULL_FAILED');
  assertExactPayloadDirectory(
    path.join(pullRoot, 'payload'),
    'WORK_0010_PULLBACK_UNEXPECTED_CONTENT'
  );
  const pulled = inventoryFor(
    path.join(pullRoot, 'payload'), canonicalPayloadNames()
  );
  if (JSON.stringify(pulled) !== JSON.stringify(inventory)) {
    fail('WORK_0010_PULLBACK_PARITY_FAILED');
  }
  started.phase = 'PULL_PARITY_PASS';
  started.pull_file_count = pulled.file_count;
  started.pull_parity = 'PASS';
  writeJsonAtomic(executionStatePath, started);
  return {
    lane: 'work_0010_remote_placement', command: 'pull-verify', status: 'PASS',
    pull_attempt_count: 1, parity: 'PASS', file_count: pulled.file_count,
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
    return {
      auth_preflight_attempt_count: 0, create_attempt_count: 0,
      inspection_attempt_count: 0, push_attempt_count: 0,
      content_read_attempt_count: 0, pull_attempt_count: 0,
      phase: 'NOT_STARTED'
    };
  }
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    assertStateBase(state);
    return {
      auth_preflight_attempt_count: state.auth_preflight_attempt_count,
      create_attempt_count: state.create_attempt_count,
      inspection_attempt_count: state.inspection_attempt_count,
      push_attempt_count: state.push_attempt_count,
      content_read_attempt_count: state.content_read_attempt_count,
      pull_attempt_count: state.pull_attempt_count,
      phase: String(state.phase || 'UNKNOWN'),
      push_semantic_file_count: Number.isInteger(state.push_semantic_file_count) ?
        state.push_semantic_file_count : 0,
      remote_classification: typeof state.classification === 'string' ?
        state.classification : 'NOT_AVAILABLE',
      remote_total_file_count: Number.isInteger(state.total_file_count) ?
        state.total_file_count : 0,
      pull_file_count: Number.isInteger(state.pull_file_count) ?
        state.pull_file_count : 0,
      pull_parity: state.pull_parity === 'PASS' ? 'PASS' : 'NOT_AVAILABLE'
    };
  } catch (_) {
    return {
      auth_preflight_attempt_count: 'UNKNOWN', create_attempt_count: 'UNKNOWN',
      inspection_attempt_count: 'UNKNOWN', push_attempt_count: 'UNKNOWN',
      content_read_attempt_count: 'UNKNOWN', pull_attempt_count: 'UNKNOWN',
      phase: 'UNKNOWN'
    };
  }
}

function normalizeCommand(command) {
  return [
    'stage', 'inventory-check', 'auth-preflight', 'create-synthetic',
    'inspect-synthetic', 'push', 'inspect-content', 'pull-verify', 'evidence'
  ].includes(command) ? command : 'UNKNOWN';
}

async function main() {
  const command = normalizeCommand(process.argv[2]);
  let releaseLock = null;
  try {
    if (!['stage', 'inventory-check', 'evidence', 'UNKNOWN'].includes(command)) {
      releaseLock = acquireOperationLock(command);
    }
    if (command === 'stage') safeWrite(Object.assign({
      lane: 'work_0010_remote_placement', command, status: 'PASS',
      google_operation: 'NOT_EXECUTED'
    }, stagePayload()));
    else if (command === 'inventory-check') safeWrite(Object.assign({
      lane: 'work_0010_remote_placement', command, status: 'PASS',
      google_operation: 'NOT_EXECUTED'
    }, isolatedNativeSelection()));
    else if (command === 'auth-preflight') safeWrite(await authPreflight());
    else if (command === 'create-synthetic') safeWrite(await createSynthetic());
    else if (command === 'inspect-synthetic') safeWrite(await inspectSynthetic());
    else if (command === 'push') safeWrite(await pushPayload());
    else if (command === 'inspect-content') safeWrite(await inspectContent());
    else if (command === 'pull-verify') safeWrite(await pullVerify());
    else if (command === 'evidence') safeWrite({
      lane: 'work_0010_remote_placement', command, status: 'PASS',
      sensitive_output: 'SUPPRESSED', attempts: safeAttemptEvidence()
    });
    else fail('UNKNOWN_WORK_0010_COMMAND');
  } catch (error) {
    const code = error && error.code || 'WORK_0010_OPERATION_FAILED';
    safeWrite({
      lane: 'work_0010_remote_placement', command, status: code,
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
  startingWork0007Head,
  expectedPayloadSha256,
  isExactBranch,
  assertPayloadInventory,
  initialAuthState,
  claimAuthPreflight,
  nextAttemptState,
  requireCanonicalRemoteContent,
  acquireOperationLock,
  safeAttemptEvidence,
  normalizeCommand
};
