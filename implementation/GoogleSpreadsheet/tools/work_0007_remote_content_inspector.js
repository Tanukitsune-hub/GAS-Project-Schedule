'use strict';

/**
 * One-use Work 0007 read-only classifier for the exact Work 0006 target.
 * It never emits identifiers, credentials, paths, raw responses, or source.
 */
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  canonicalPayloadFileNames,
  assertTargetObjects
} = require('./local_clasp_dev');

const moduleRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(moduleRoot, '..', '..');
const work0006Root = path.join(moduleRoot, '.clasp-work-0006');
const work0006ConfigPath = path.join(work0006Root, '.clasp.json');
const work0006TargetPath = path.join(work0006Root, 'target.json');
const work0006StatePath = path.join(
  work0006Root, 'work-0006-execution-state.json'
);
const work0007Root = path.join(moduleRoot, '.work-0007-read-state');
const work0007StatePath = path.join(
  work0007Root, 'work-0007-content-read-state.json'
);
const exactWork0007Branch = 'codex/0007-remote-content-diagnosis-ci-scope';
const expectedWork0006Fingerprint =
  '754e21bfc1fd61755fb12d3156c5729a17e946c4a436eeb00b0aa91d55238a18';

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

function isExactWork0007Branch(branch) {
  return branch === exactWork0007Branch;
}

function assertExactBranchAndCleanWorktree() {
  const branch = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'branch', '--show-current'
  ], { encoding: 'utf8', windowsHide: true });
  if (branch.status !== 0 ||
      !isExactWork0007Branch(String(branch.stdout || '').trim())) {
    fail('WORK_0007_EXACT_BRANCH_REQUIRED');
  }
  const status = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'status', '--porcelain=v1', '--untracked-files=normal'
  ], { encoding: 'utf8', windowsHide: true });
  if (status.status !== 0) fail('GIT_STATUS_FAILED');
  if (String(status.stdout || '').trim()) fail('DIRTY_WORKTREE_REFUSED');
}

function validateWork0006Evidence(config, target, state) {
  try {
    assertTargetObjects(config, target, null);
  } catch (_) {
    fail('WORK_0006_TARGET_EVIDENCE_INVALID');
  }
  const valid = target && state &&
    target.schema === 'WORK_OS_PERSONAL_SYNTHETIC_TARGET_V2' &&
    target.work_id === '0006' &&
    target.target_kind === 'PERSONAL_SYNTHETIC_DEV' &&
    target.target_disposition === 'FRESH_SYNTHETIC_CREATED' &&
    target.target_fingerprint === expectedWork0006Fingerprint &&
    state.schema === 'WORK_OS_SYNTHETIC_TARGET_CREATION_V3' &&
    state.work_id === '0006' &&
    state.create_attempt_count === 1 &&
    state.inspection_attempt_count === 1 &&
    state.push_attempt_count === 1 &&
    state.pull_attempt_count === 1 &&
    state.phase === 'PULL_ATTEMPT_STARTED' &&
    state.script_id === config.scriptId &&
    state.script_id === target.expected_script_id &&
    state.parent_id === target.expected_parent_id &&
    state.principal_fingerprint === target.principal_fingerprint &&
    state.target_fingerprint === target.target_fingerprint;
  if (!valid) fail('WORK_0006_TARGET_EVIDENCE_INVALID');
  return {
    scriptId: config.scriptId,
    targetFingerprint: target.target_fingerprint
  };
}

function initialReadState(targetFingerprint) {
  return {
    schema: 'WORK_OS_REMOTE_CONTENT_READ_V1',
    work_id: '0007',
    source_work_id: '0006',
    read_attempt_count: 1,
    phase: 'READ_ATTEMPT_STARTED',
    target_fingerprint: targetFingerprint
  };
}

function claimReadAttempt(
  targetFingerprint,
  statePath = work0007StatePath
) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  const state = initialReadState(targetFingerprint);
  let descriptor;
  try {
    descriptor = fs.openSync(statePath, 'wx', 0o600);
    fs.writeFileSync(descriptor, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    fs.closeSync(descriptor);
  } catch (_) {
    if (Number.isInteger(descriptor)) fs.closeSync(descriptor);
    fail('WORK_0007_CONTENT_READ_ALREADY_ATTEMPTED');
  }
  return state;
}

function normalizeRemoteFile(file) {
  const name = String(file && file.name || '');
  const type = String(file && file.type || '');
  if (!/^[A-Za-z0-9_-]+$/.test(name)) return null;
  if (type === 'SERVER_JS') return `${name}.gs`;
  if (type === 'JSON' && name === 'appsscript') return 'appsscript.json';
  if (type === 'HTML') return `${name}.html`;
  return null;
}

function classifyRemoteContent(files) {
  if (!Array.isArray(files)) fail('REMOTE_CONTENT_RESULT_INVALID');
  const normalized = files.map(normalizeRemoteFile);
  const validNames = normalized.filter(Boolean);
  const expected = canonicalPayloadFileNames.slice().sort();
  const actual = validNames.slice().sort();
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = expected.filter((name) => !actualSet.has(name));
  const extra = actual.filter((name) => !expectedSet.has(name));
  const serverCount = files.filter((file) =>
    file && file.type === 'SERVER_JS').length;
  const manifestCount = files.filter((file) =>
    file && file.type === 'JSON' && file.name === 'appsscript').length;
  const htmlCount = files.filter((file) => file && file.type === 'HTML').length;
  let classification = 'REMOTE_CONTENT_OTHER';
  if (files.length === 1 && serverCount === 0 && manifestCount === 1 &&
      htmlCount === 0 && actual[0] === 'appsscript.json') {
    classification = 'REMOTE_HAS_MANIFEST_ONLY';
  } else if (files.length === 24 && serverCount === 23 &&
      manifestCount === 1 && htmlCount === 0 &&
      normalized.every(Boolean) && missing.length === 0 && extra.length === 0) {
    classification = 'REMOTE_HAS_24_CANONICAL_FILES';
  }
  return {
    classification,
    total_file_count: files.length,
    server_js_file_count: serverCount,
    manifest_file_count: manifestCount,
    html_file_count: htmlCount,
    invalid_file_count: normalized.length - validNames.length,
    missing_file_count: missing.length,
    extra_file_count: extra.length
  };
}

async function loadExistingAuth() {
  const authPath = path.join(
    moduleRoot, 'node_modules', '@google', 'clasp', 'build', 'src', 'auth',
    'auth.js'
  );
  if (!fs.existsSync(authPath)) fail('LOCAL_CLASP_NOT_INSTALLED');
  try {
    const authModule = await import(pathToFileURL(authPath).href);
    const auth = await authModule.initAuth({});
    if (!auth || !auth.credentials) fail('USER_ACTION_REQUIRED_BLOCKER');
    return auth.credentials;
  } catch (error) {
    if (error && error.code === 'USER_ACTION_REQUIRED_BLOCKER') throw error;
    fail('USER_ACTION_REQUIRED_BLOCKER');
  }
}

async function inspectContent() {
  if (process.env.GAS_WORK_0007_CONTENT_READ_ALLOWED !== 'true') {
    fail('WORK_0007_CONTENT_READ_OPT_IN_REQUIRED');
  }
  assertExactBranchAndCleanWorktree();
  const config = readJson(
    work0006ConfigPath, 'WORK_0006_TARGET_EVIDENCE_MISSING'
  );
  const target = readJson(
    work0006TargetPath, 'WORK_0006_TARGET_EVIDENCE_MISSING'
  );
  const prior = readJson(
    work0006StatePath, 'WORK_0006_TARGET_EVIDENCE_MISSING'
  );
  const binding = validateWork0006Evidence(config, target, prior);
  const state = claimReadAttempt(binding.targetFingerprint);
  const credentials = await loadExistingAuth();
  let response;
  try {
    response = await credentials.request({
      url: `https://script.googleapis.com/v1/projects/${encodeURIComponent(
        binding.scriptId
      )}/content`,
      method: 'GET',
      retry: false,
      retryConfig: { retry: 0 }
    });
  } catch (error) {
    const status = Number(error && error.response && error.response.status || 0);
    if (status === 401 || status === 403) fail('USER_ACTION_REQUIRED_BLOCKER');
    fail('WORK_0007_REMOTE_CONTENT_READ_FAILED');
  }
  const evidence = classifyRemoteContent(
    response && response.data && response.data.files
  );
  Object.assign(state, evidence, { phase: 'READ_PASS' });
  writeJsonAtomic(work0007StatePath, state);
  return Object.assign({
    lane: 'work_0007_remote_content_inspector',
    command: 'inspect-content',
    status: 'PASS',
    read_attempt_count: 1,
    target_fingerprint: binding.targetFingerprint,
    sensitive_output: 'SUPPRESSED'
  }, evidence);
}

function safeAttemptEvidence() {
  if (!fs.existsSync(work0007StatePath)) {
    return { read_attempt_count: 0, phase: 'NOT_STARTED' };
  }
  try {
    const state = JSON.parse(fs.readFileSync(work0007StatePath, 'utf8'));
    if (state.schema !== 'WORK_OS_REMOTE_CONTENT_READ_V1' ||
        state.work_id !== '0007') throw new Error('INVALID');
    return {
      read_attempt_count: state.read_attempt_count === 1 ? 1 : 'UNKNOWN',
      phase: ['READ_ATTEMPT_STARTED', 'READ_PASS'].includes(state.phase) ?
        state.phase : 'UNKNOWN',
      classification: typeof state.classification === 'string' ?
        state.classification : 'NOT_AVAILABLE'
    };
  } catch (_) {
    return { read_attempt_count: 'UNKNOWN', phase: 'UNKNOWN' };
  }
}

function normalizeCommand(command) {
  return ['inspect-content', 'evidence'].includes(command) ? command : 'UNKNOWN';
}

async function main() {
  const command = normalizeCommand(process.argv[2]);
  try {
    if (command === 'inspect-content') safeWrite(await inspectContent());
    else if (command === 'evidence') safeWrite({
      lane: 'work_0007_remote_content_inspector', command, status: 'PASS',
      sensitive_output: 'SUPPRESSED', attempts: safeAttemptEvidence()
    });
    else fail('UNKNOWN_WORK_0007_CONTENT_COMMAND');
  } catch (error) {
    const code = error && error.code || 'WORK_0007_CONTENT_INSPECTION_FAILED';
    safeWrite({
      lane: 'work_0007_remote_content_inspector', command, status: code,
      sensitive_output: 'SUPPRESSED', attempts: safeAttemptEvidence(),
      message: code
    });
    process.exitCode = 2;
  }
}

if (require.main === module) main();

module.exports = {
  GateError,
  expectedWork0006Fingerprint,
  isExactWork0007Branch,
  validateWork0006Evidence,
  initialReadState,
  claimReadAttempt,
  classifyRemoteContent,
  normalizeCommand
};
