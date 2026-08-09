'use strict';

/**
 * Work 0003-only privacy-safe bootstrap and metadata inspection lane.
 *
 * Actual Google identifiers and the local HMAC salt are written only below
 * the ignored `.clasp-dev` directory. Stdout is restricted to closed states,
 * counts, and an HMAC fingerprint that cannot be reversed without the ignored
 * local salt.
 */
const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  canonicalPayloadNames,
  assertExactPayloadDirectory,
  inventoryFor,
  assertTargetObjects
} = require('./local_clasp_dev');

const moduleRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(moduleRoot, '..', '..');
const sourceRoot = path.join(moduleRoot, 'apps-script-v2');
const devRoot = path.join(moduleRoot, '.clasp-dev');
const payloadRoot = path.join(devRoot, 'payload');
const inventoryPath = path.join(devRoot, 'payload-inventory.json');
const configPath = path.join(devRoot, '.clasp.json');
const targetPath = path.join(devRoot, 'target.json');
const creationStatePath = path.join(devRoot, 'creation-state.json');
const syntheticTitle = 'Work OS Synthetic Sandbox Work 0003';
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

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function hmacSha256(salt, value) {
  return crypto.createHmac('sha256', salt).update(String(value)).digest('hex');
}

function safeWrite(result) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function readJson(file, failureCode) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    fail(failureCode);
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, file);
}

function assertCleanWorktree() {
  const result = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'status', '--porcelain=v1', '--untracked-files=normal'
  ], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) fail('GIT_STATUS_FAILED');
  if (String(result.stdout || '').trim()) fail('DIRTY_WORKTREE_REFUSED');
}

function assertIdentifierNotTracked(identifier) {
  const result = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'grep', '-I', '-F', '--', identifier
  ], { encoding: 'utf8', windowsHide: true });
  if (result.status === 0) fail('TARGET_IDENTIFIER_IS_TRACKED');
  if (result.status !== 1) fail('TRACKED_IDENTIFIER_SCAN_FAILED');
}

function assertStagedPayload() {
  if (!fs.existsSync(inventoryPath) || !fs.existsSync(payloadRoot)) {
    fail('STAGED_PAYLOAD_MISSING');
  }
  const saved = readJson(inventoryPath, 'STAGED_PAYLOAD_INVENTORY_INVALID');
  const names = canonicalPayloadNames();
  assertExactPayloadDirectory(payloadRoot, 'STAGED_PAYLOAD_UNEXPECTED_CONTENT');
  const staged = inventoryFor(payloadRoot, names);
  const source = inventoryFor(sourceRoot, names);
  if (saved.schema !== staged.schema || saved.file_count !== staged.file_count ||
      saved.payload_sha256 !== staged.payload_sha256 ||
      JSON.stringify(saved.files) !== JSON.stringify(staged.files)) {
    fail('STAGED_PAYLOAD_MISMATCH');
  }
  if (source.payload_sha256 !== staged.payload_sha256) {
    fail('STAGED_PAYLOAD_SOURCE_SKEW');
  }
  return staged;
}

function isPersonalEmail(email) {
  return /^[^@\s]+@(gmail\.com|googlemail\.com)$/i.test(String(email || ''));
}

function principalFingerprint(salt, user) {
  return hmacSha256(
    salt,
    `principal:${String(user.email || '').trim().toLowerCase()}:${String(user.id || '')}`
  );
}

function targetFingerprint(salt, scriptId, parentId) {
  return hmacSha256(salt, `target:${scriptId}:${parentId}`);
}

function assertInitialWorkspace() {
  const allowed = new Set(['payload', '.claspignore', 'payload-inventory.json']);
  for (const entry of fs.readdirSync(devRoot, { withFileTypes: true })) {
    if (!allowed.has(entry.name)) fail('SYNTHETIC_TARGET_CREATE_ALREADY_ATTEMPTED');
  }
  if (fs.existsSync(configPath) || fs.existsSync(targetPath) ||
      fs.existsSync(creationStatePath)) {
    fail('SYNTHETIC_TARGET_CREATE_ALREADY_ATTEMPTED');
  }
}

async function loadExistingPersonalAuth() {
  const authPath = path.join(
    moduleRoot, 'node_modules', '@google', 'clasp', 'build', 'src', 'auth', 'auth.js'
  );
  if (!fs.existsSync(authPath)) fail('LOCAL_CLASP_NOT_INSTALLED');
  let authModule;
  let auth;
  try {
    authModule = await import(pathToFileURL(authPath).href);
    auth = await authModule.initAuth({});
  } catch (_) {
    fail('USER_ACTION_REQUIRED_BLOCKER');
  }
  if (!auth || !auth.credentials) fail('USER_ACTION_REQUIRED_BLOCKER');
  const user = await authModule.getUserInfo(auth.credentials);
  if (!user || !user.id || !isPersonalEmail(user.email)) {
    fail('USER_ACTION_REQUIRED_BLOCKER');
  }
  return { credentials: auth.credentials, user };
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

function safeStateBase(salt, user) {
  return {
    schema: 'WORK_OS_SYNTHETIC_TARGET_CREATION_V1',
    work_id: '0003',
    create_attempt_count: 1,
    inspection_attempt_count: 0,
    phase: 'ATTEMPT_STARTED',
    target_kind: 'PERSONAL_SYNTHETIC_DEV',
    salt_base64: salt.toString('base64'),
    principal_fingerprint: principalFingerprint(salt, user),
    parent_id: null,
    script_id: null,
    target_fingerprint: null
  };
}

async function createSynthetic() {
  if (process.env.GAS_WORK_0003_CREATE_SYNTHETIC_ALLOWED !== 'true') {
    fail('SYNTHETIC_TARGET_CREATE_OPT_IN_REQUIRED');
  }
  assertCleanWorktree();
  const inventory = assertStagedPayload();
  assertInitialWorkspace();
  const auth = await loadExistingPersonalAuth();
  const salt = crypto.randomBytes(32);
  const state = safeStateBase(salt, auth.user);
  writeJson(creationStatePath, state);

  const parentResponse = await googleRequest(auth.credentials, {
    url: 'https://www.googleapis.com/drive/v3/files',
    method: 'POST',
    params: { fields: 'id' },
    data: { name: syntheticTitle, mimeType: spreadsheetMimeType }
  }, 'SYNTHETIC_CONTAINER_CREATE_FAILED');
  const parentId = String(parentResponse && parentResponse.data &&
    parentResponse.data.id || '');
  if (!/^[A-Za-z0-9_-]{20,}$/.test(parentId)) {
    fail('SYNTHETIC_CONTAINER_CREATE_RESULT_INVALID');
  }
  state.parent_id = parentId;
  state.phase = 'CONTAINER_CREATED';
  writeJson(creationStatePath, state);

  const scriptResponse = await googleRequest(auth.credentials, {
    url: 'https://script.googleapis.com/v1/projects',
    method: 'POST',
    data: { title: syntheticTitle, parentId }
  }, 'BOUND_SCRIPT_CREATE_FAILED');
  const scriptId = String(scriptResponse && scriptResponse.data &&
    scriptResponse.data.scriptId || '');
  if (!/^[A-Za-z0-9_-]{20,}$/.test(scriptId)) {
    fail('BOUND_SCRIPT_CREATE_RESULT_INVALID');
  }
  state.script_id = scriptId;
  state.target_fingerprint = targetFingerprint(salt, scriptId, parentId);
  state.phase = 'BOUND_SCRIPT_CREATED';
  writeJson(creationStatePath, state);

  writeJson(configPath, { scriptId, rootDir: 'payload' });
  writeJson(targetPath, {
    schema: 'WORK_OS_PERSONAL_SYNTHETIC_TARGET_V1',
    work_id: '0003',
    target_kind: 'PERSONAL_SYNTHETIC_DEV',
    expected_script_id: scriptId,
    expected_parent_id: parentId,
    principal_fingerprint: state.principal_fingerprint,
    target_fingerprint: state.target_fingerprint,
    target_disposition: 'FRESH_SYNTHETIC_CREATED',
    runtime_dry_run_allowed: false,
    runtime_function: ''
  });
  assertIdentifierNotTracked(scriptId);
  assertIdentifierNotTracked(parentId);
  state.phase = 'LOCAL_BINDING_WRITTEN';
  writeJson(creationStatePath, state);

  return {
    lane: 'work_0003_target_bootstrap',
    command: 'create-synthetic',
    status: 'PASS',
    target_disposition: 'FRESH_SYNTHETIC_CREATED',
    create_attempt_count: 1,
    file_count: inventory.file_count,
    payload_sha256: inventory.payload_sha256,
    principal_binding: 'PASS',
    target_fingerprint: state.target_fingerprint
  };
}

function validateInspectionEvidence(evidence) {
  const drive = evidence.drive || {};
  const script = evidence.script || {};
  const permissions = Array.isArray(evidence.permissions) ? evidence.permissions : [];
  const owners = Array.isArray(drive.owners) ? drive.owners : [];
  const ownerPermissions = permissions.filter((item) => item && item.role === 'owner');
  const principalEmail = String(evidence.principal_email || '').toLowerCase();
  const ownerEmail = String(owners[0] && owners[0].emailAddress || '').toLowerCase();
  const permissionOwnerEmail = String(ownerPermissions[0] &&
    ownerPermissions[0].emailAddress || '').toLowerCase();
  if (drive.id !== evidence.parent_id || drive.mimeType !== spreadsheetMimeType ||
      drive.ownedByMe !== true || owners.length !== 1 || drive.driveId ||
      ownerPermissions.length !== 1 ||
      permissions.some((item) => item && item.pendingOwner === true) ||
      ownerEmail !== principalEmail || permissionOwnerEmail !== principalEmail ||
      script.scriptId !== evidence.script_id || script.parentId !== evidence.parent_id) {
    fail('SYNTHETIC_TARGET_BINDING_INSPECTION_FAILED');
  }
  return {
    owned_by_me: true,
    owner_count: 1,
    shared_drive: false,
    pending_owner: false,
    bound_container: true
  };
}

async function inspectSynthetic() {
  if (process.env.GAS_WORK_0003_INSPECT_ALLOWED !== 'true') {
    fail('SYNTHETIC_TARGET_INSPECT_OPT_IN_REQUIRED');
  }
  assertCleanWorktree();
  const inventory = assertStagedPayload();
  const config = readJson(configPath, 'DEV_TARGET_NOT_CONFIGURED');
  const target = readJson(targetPath, 'DEV_TARGET_NOT_CONFIGURED');
  assertTargetObjects(config, target, null);
  const state = readJson(creationStatePath, 'SYNTHETIC_CREATION_STATE_MISSING');
  if (state.create_attempt_count !== 1 || !state.salt_base64 ||
      state.script_id !== config.scriptId ||
      state.parent_id !== target.expected_parent_id ||
      state.target_fingerprint !== target.target_fingerprint ||
      state.inspection_attempt_count >= 2) {
    fail('SYNTHETIC_CREATION_STATE_INVALID');
  }
  state.inspection_attempt_count += 1;
  state.phase = 'INSPECTION_ATTEMPT_STARTED';
  writeJson(creationStatePath, state);

  const auth = await loadExistingPersonalAuth();
  const salt = Buffer.from(state.salt_base64, 'base64');
  if (principalFingerprint(salt, auth.user) !== state.principal_fingerprint) {
    fail('SYNTHETIC_TARGET_PRINCIPAL_MISMATCH');
  }
  const parentId = state.parent_id;
  const scriptId = state.script_id;
  const driveResponse = await googleRequest(auth.credentials, {
    url: `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(parentId)}`,
    method: 'GET',
    params: { fields: 'id,mimeType,ownedByMe,driveId,owners(emailAddress,me)' }
  }, 'SYNTHETIC_DRIVE_METADATA_INSPECTION_FAILED');
  const permissionResponse = await googleRequest(auth.credentials, {
    url: `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(parentId)}/permissions`,
    method: 'GET',
    params: { fields: 'permissions(role,type,pendingOwner,emailAddress,deleted)' }
  }, 'SYNTHETIC_PERMISSION_INSPECTION_FAILED');
  const scriptResponse = await googleRequest(auth.credentials, {
    url: `https://script.googleapis.com/v1/projects/${encodeURIComponent(scriptId)}`,
    method: 'GET'
  }, 'SYNTHETIC_SCRIPT_METADATA_INSPECTION_FAILED');
  const closed = validateInspectionEvidence({
    principal_email: auth.user.email,
    parent_id: parentId,
    script_id: scriptId,
    drive: driveResponse.data,
    permissions: permissionResponse.data && permissionResponse.data.permissions,
    script: scriptResponse.data
  });
  if (targetFingerprint(salt, scriptId, parentId) !== state.target_fingerprint) {
    fail('SYNTHETIC_TARGET_FINGERPRINT_MISMATCH');
  }
  assertIdentifierNotTracked(scriptId);
  assertIdentifierNotTracked(parentId);
  state.phase = 'INSPECTION_PASS';
  writeJson(creationStatePath, state);
  return {
    lane: 'work_0003_target_bootstrap',
    command: 'inspect-synthetic',
    status: 'PASS',
    target_disposition: 'FRESH_SYNTHETIC_CREATED',
    inspection_attempt_count: state.inspection_attempt_count,
    file_count: inventory.file_count,
    payload_sha256: inventory.payload_sha256,
    principal_binding: 'PASS',
    target_binding: 'PASS',
    target_fingerprint: state.target_fingerprint,
    ownership: closed
  };
}

async function main() {
  const command = process.argv[2];
  try {
    if (command === 'create-synthetic') safeWrite(await createSynthetic());
    else if (command === 'inspect-synthetic') safeWrite(await inspectSynthetic());
    else fail('UNKNOWN_WORK_0003_TARGET_COMMAND');
  } catch (error) {
    const code = error && error.code || 'WORK_0003_TARGET_OPERATION_FAILED';
    safeWrite({
      lane: 'work_0003_target_bootstrap',
      command: command || 'UNKNOWN',
      status: code,
      sensitive_output: 'SUPPRESSED',
      message: code
    });
    process.exitCode = 2;
  }
}

if (require.main === module) main();

module.exports = {
  GateError,
  isPersonalEmail,
  principalFingerprint,
  targetFingerprint,
  validateInspectionEvidence,
  sha256
};
