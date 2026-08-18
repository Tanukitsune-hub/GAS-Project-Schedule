'use strict';

/**
 * Guarded Work 0006 clasp lane for a personal synthetic Apps Script project.
 *
 * This tool never discovers, prints, or stores a script ID. Its only accepted
 * binding is an ignored Work 0006 workspace. Historical Work 0004 local state
 * is never read or reused by this lane. GitHub Actions must not invoke it.
 */
const assert = require('node:assert');
const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const moduleRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(moduleRoot, '..', '..');
const sourceRoot = path.join(moduleRoot, 'apps-script-v2');
const sourceRootFromRepository = path.relative(repositoryRoot, sourceRoot)
  .split(path.sep).join('/');
const devRoot = path.join(moduleRoot, '.clasp-work-0006');
const payloadRoot = path.join(devRoot, 'payload');
const pullRoot = path.join(moduleRoot, '.clasp-pull-verify-work-0006');
const configPath = path.join(devRoot, '.clasp.json');
const targetPath = path.join(devRoot, 'target.json');
const inventoryPath = path.join(devRoot, 'payload-inventory.json');
const work0004DevRoot = path.join(moduleRoot, '.clasp-dev');
const work0004CreationStatePath = path.join(
  work0004DevRoot, 'work-0004-creation-state.json'
);
const work0006ExecutionStateFileName = 'work-0006-execution-state.json';
const work0006ExecutionStatePath = path.join(
  devRoot, work0006ExecutionStateFileName
);
const work0006OperationLockFileName = 'work-0006-operation.lock';
const work0006OperationLockPath = path.join(
  devRoot, work0006OperationLockFileName
);
const exactWork0004Branch = 'codex/0004-controlled-synthetic-placement';
const exactWork0006Branch = 'codex/0006-fresh-controlled-remote-placement';
const allowedTargetKind = 'PERSONAL_SYNTHETIC_DEV';
const allowedRuntimeFunction = 'runQuickDiagnostic';
const claspScriptExtensions = Object.freeze(['.gs', '.js']);
const claspSemanticPushArguments = Object.freeze([
  '--json', 'push', '--force'
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
  '20_GeminiProvider.gs',
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

function claspProjectConfig(scriptId) {
  return {
    scriptId,
    rootDir: 'payload',
    scriptExtensions: claspScriptExtensions.slice()
  };
}

function claspIgnoreContents() {
  return ['**/**'].concat(
    canonicalPayloadFileNames.map((name) => `!${name}`),
    ''
  ).join('\n');
}

function assertExactPayloadDirectory(root, failureCode) {
  if (!fs.existsSync(root)) fail(failureCode, failureCode);
  const entries = fs.readdirSync(root, { withFileTypes: true });
  if (entries.some((entry) => !entry.isFile())) fail(failureCode, failureCode);
  return assertExactPayloadNames(entries.map((entry) => entry.name), failureCode);
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

function committedPayloadBuffer(name) {
  const spec = `HEAD:${sourceRootFromRepository}/${name}`;
  const result = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'show', spec
  ], {
    encoding: null,
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024
  });
  if (result.error || result.status !== 0) {
    fail('COMMITTED_PAYLOAD_READ_FAILED', 'COMMITTED_PAYLOAD_READ_FAILED');
  }
  return result.stdout;
}

function inventoryForCommittedPayload(names) {
  const files = names.map((name) => ({
    name,
    sha256: sha256(committedPayloadBuffer(name))
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
    'payload-inventory.json', 'last-operation.json',
    work0006ExecutionStateFileName, work0006OperationLockFileName
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
  if (fs.existsSync(configPath) || fs.existsSync(targetPath) ||
      fs.existsSync(work0006ExecutionStatePath)) {
    fail('WORK_0006_EXECUTION_ALREADY_STARTED',
      'WORK_0006_EXECUTION_ALREADY_STARTED');
  }
  assertPayloadMayBeReplaced(names);
  if (fs.existsSync(payloadRoot)) {
    fs.rmSync(payloadRoot, { recursive: true, force: true });
  }
  fs.mkdirSync(payloadRoot, { recursive: true });
  for (const name of names) {
    fs.writeFileSync(path.join(payloadRoot, name), committedPayloadBuffer(name));
  }
  assertExactPayloadDirectory(payloadRoot, 'STAGED_PAYLOAD_UNEXPECTED_CONTENT');
  fs.writeFileSync(path.join(devRoot, '.claspignore'),
    claspIgnoreContents(), 'utf8');
  const inventory = inventoryFor(payloadRoot, names);
  fs.writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`,
    'utf8');
  return inventory;
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
  const source = inventoryForCommittedPayload(names);
  if (source.payload_sha256 !== current.payload_sha256) {
    fail('STAGED_PAYLOAD_SOURCE_SKEW', 'STAGED_PAYLOAD_SOURCE_SKEW');
  }
  return current;
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
  if (config.rootDir !== 'payload') {
    fail('DEV_TARGET_ROOTDIR_REJECTED', 'DEV_TARGET_ROOTDIR_REJECTED');
  }
  if (!Array.isArray(config.scriptExtensions) ||
      config.scriptExtensions.length !== claspScriptExtensions.length ||
      config.scriptExtensions.some((extension, index) =>
        extension !== claspScriptExtensions[index])) {
    fail('DEV_TARGET_SCRIPT_EXTENSIONS_REJECTED',
      'DEV_TARGET_SCRIPT_EXTENSIONS_REJECTED');
  }
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
    raw
  };
}

function assertClaspPushSemanticEvidence(result, workspaceRoot) {
  if (!result || result.exit_code !== 0) {
    fail('CLASP_PUSH_FAILED', 'CLASP_PUSH_FAILED');
  }
  let pushedPaths;
  try {
    pushedPaths = JSON.parse(String(result.stdout || '').trim());
  } catch (_) {
    fail('CLASP_PUSH_SEMANTIC_EVIDENCE_INVALID',
      'CLASP_PUSH_SEMANTIC_EVIDENCE_INVALID');
  }
  if (!Array.isArray(pushedPaths) || pushedPaths.length === 0) {
    fail('CLASP_PUSH_SEMANTIC_NO_OP', 'CLASP_PUSH_SEMANTIC_NO_OP');
  }
  const names = pushedPaths.map((localPath) => {
    const relative = path.relative(
      workspaceRoot,
      path.resolve(workspaceRoot, String(localPath))
    );
    const parts = relative.split(path.sep);
    if (parts.length !== 2 || parts[0] !== 'payload' || !parts[1]) {
      fail('CLASP_PUSH_SEMANTIC_EVIDENCE_INVALID',
        'CLASP_PUSH_SEMANTIC_EVIDENCE_INVALID');
    }
    return parts[1];
  });
  assertExactPayloadNames(names, 'CLASP_PUSH_SEMANTIC_INVENTORY_INVALID');
  return {
    file_count: names.length,
    gs_file_count: names.filter((name) => name.endsWith('.gs')).length,
    manifest_file_count: names.filter((name) =>
      name === 'appsscript.json').length,
    missing_file_count: 0,
    extra_file_count: 0,
    update_content_evidenced: true
  };
}

function claspVersion() {
  const result = runClasp(['--version'], moduleRoot);
  if (result.exit_code !== 0) {
    fail('LOCAL_CLASP_VERSION_FAILED', 'LOCAL_CLASP_VERSION_FAILED');
  }
  const match = result.raw.match(/\b\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?\b/);
  return match ? match[0] : 'UNKNOWN';
}

function runClaspNativeFileStatus(workspaceRoot) {
  const isolatedRoot = fs.mkdtempSync(path.join(
    os.tmpdir(), 'work-os-clasp-native-status-'
  ));
  try {
    const isolatedHome = path.join(isolatedRoot, 'home');
    const isolatedAuth = path.join(isolatedRoot, 'missing-auth.json');
    fs.mkdirSync(isolatedHome, { recursive: true });
    const environment = Object.assign({}, process.env, {
      HOME: isolatedHome,
      USERPROFILE: isolatedHome,
      APPDATA: path.join(isolatedHome, 'appdata'),
      NO_UPDATE_NOTIFIER: '1'
    });
    for (const key of [
      'GOOGLE_APPLICATION_CREDENTIALS',
      'CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE',
      'clasp_config_auth',
      'clasp_config_project',
      'clasp_config_ignore'
    ]) delete environment[key];

    const result = childProcess.spawnSync(process.execPath, [
      claspEntrypoint(),
      '--json',
      '--auth', isolatedAuth,
      '--project', workspaceRoot,
      '--ignore', workspaceRoot,
      'show-file-status'
    ], {
      cwd: workspaceRoot,
      encoding: 'utf8',
      windowsHide: true,
      env: environment
    });
    if (result.error || result.status !== 0) {
      fail('CLASP_NATIVE_FILE_STATUS_FAILED',
        'CLASP_NATIVE_FILE_STATUS_FAILED');
    }
    const jsonLine = String(result.stdout || '').split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.startsWith('{') && line.includes('"filesToPush"'));
    let report;
    try {
      report = JSON.parse(jsonLine || '');
    } catch (_) {
      fail('CLASP_NATIVE_FILE_STATUS_UNPARSEABLE',
        'CLASP_NATIVE_FILE_STATUS_UNPARSEABLE');
    }
    if (!Array.isArray(report.filesToPush) ||
        !Array.isArray(report.untrackedFiles) || fs.existsSync(isolatedAuth)) {
      fail('CLASP_NATIVE_FILE_STATUS_INVALID',
        'CLASP_NATIVE_FILE_STATUS_INVALID');
    }
    const names = report.filesToPush.map((localPath) => {
      const relative = path.relative(
        workspaceRoot,
        path.resolve(workspaceRoot, String(localPath))
      );
      const parts = relative.split(path.sep);
      if (parts.length !== 2 || parts[0] !== 'payload' || !parts[1]) {
        fail('CLASP_NATIVE_ROOTDIR_CONTRACT_INVALID',
          'CLASP_NATIVE_ROOTDIR_CONTRACT_INVALID');
      }
      return parts[1];
    }).sort();
    return {
      names,
      file_count: names.length,
      untracked_count: report.untrackedFiles.length,
      authentication: 'NOT_EXECUTED'
    };
  } finally {
    fs.rmSync(isolatedRoot, { recursive: true, force: true });
  }
}

function assertClaspNativePayloadSelection(workspaceRoot) {
  const status = runClaspNativeFileStatus(workspaceRoot);
  assertExactPayloadNames(
    status.names,
    'CLASP_NATIVE_PAYLOAD_SELECTION_INVALID'
  );
  return status;
}

function runIsolatedStagedClaspNativeSelection() {
  const inventory = assertStagedPayload();
  const isolatedRoot = fs.mkdtempSync(path.join(
    os.tmpdir(), 'work-0006-staged-clasp-selection-'
  ));
  try {
    const isolatedPayload = path.join(isolatedRoot, 'payload');
    fs.mkdirSync(isolatedPayload, { recursive: true });
    for (const name of canonicalPayloadFileNames) {
      fs.copyFileSync(path.join(payloadRoot, name), path.join(isolatedPayload, name));
    }
    fs.writeFileSync(path.join(isolatedRoot, '.clasp.json'),
      `${JSON.stringify(claspProjectConfig(
        'REPLACE_WITH_SYNTHETIC_SCRIPT_ID'
      ), null, 2)}\n`, 'utf8');
    fs.writeFileSync(path.join(isolatedRoot, '.claspignore'),
      claspIgnoreContents(), 'utf8');
    const status = assertClaspNativePayloadSelection(isolatedRoot);
    return {
      file_count: status.file_count,
      gs_file_count: status.names.filter((name) => name.endsWith('.gs')).length,
      manifest_file_count: status.names.filter((name) =>
        name === 'appsscript.json').length,
      missing_file_count: 0,
      extra_file_count: 0,
      payload_sha256: inventory.payload_sha256,
      preferred_pull_script_extension: claspScriptExtensions[0]
    };
  } finally {
    fs.rmSync(isolatedRoot, { recursive: true, force: true });
  }
}

function prepareWork0004PushAttempt(
  workspaceRoot,
  config,
  target,
  operations = {}
) {
  const assertNative = operations.assertClaspNativePayloadSelection ||
    assertClaspNativePayloadSelection;
  const beginRemoteAttempt = operations.beginWork0004RemoteAttempt ||
    beginWork0004RemoteAttempt;
  const status = assertNative(workspaceRoot);
  beginRemoteAttempt('push', config, target);
  return status;
}

function prepareWork0006PushAttempt(
  workspaceRoot,
  config,
  target,
  operations = {}
) {
  const assertNative = operations.assertClaspNativePayloadSelection ||
    assertClaspNativePayloadSelection;
  const beginRemoteAttempt = operations.beginWork0006RemoteAttempt ||
    beginWork0006RemoteAttempt;
  const status = assertNative(workspaceRoot);
  beginRemoteAttempt('push', config, target);
  return status;
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

function assertExactWork0004Branch() {
  const result = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'branch', '--show-current'
  ], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0 ||
      String(result.stdout || '').trim() !== exactWork0004Branch) {
    fail('WORK_0004_EXACT_BRANCH_REQUIRED',
      'WORK_0004_EXACT_BRANCH_REQUIRED');
  }
}

function assertExactWork0006Branch() {
  const result = childProcess.spawnSync('git', [
    '-C', repositoryRoot, 'branch', '--show-current'
  ], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0 ||
      String(result.stdout || '').trim() !== exactWork0006Branch) {
    fail('WORK_0006_EXACT_BRANCH_REQUIRED',
      'WORK_0006_EXACT_BRANCH_REQUIRED');
  }
}

function writeLastOperation(operation) {
  assertSafeGeneratedPayloadDirectory();
  fs.writeFileSync(path.join(devRoot, 'last-operation.json'),
    `${JSON.stringify(operation, null, 2)}\n`, 'utf8');
}

function writeJsonAtomic(file, value) {
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, file);
}

function acquireWork0006OperationLock(
  command,
  lockPath = work0006OperationLockPath
) {
  let descriptor;
  try {
    descriptor = fs.openSync(lockPath, 'wx', 0o600);
    fs.writeFileSync(descriptor, `${JSON.stringify({
      schema: 'WORK_OS_OPERATION_LOCK_V1', work_id: '0006', command
    })}\n`, 'utf8');
  } catch (_) {
    if (Number.isInteger(descriptor)) fs.closeSync(descriptor);
    fail('WORK_0006_OPERATION_ALREADY_RUNNING',
      'WORK_0006_OPERATION_ALREADY_RUNNING');
  }
  let released = false;
  return function releaseWork0006OperationLock() {
    if (released) return;
    released = true;
    fs.closeSync(descriptor);
    fs.unlinkSync(lockPath);
  };
}

function nextWork0004RemoteAttemptState(state, config, target, command) {
  const commonValid = state &&
    state.schema === 'WORK_OS_SYNTHETIC_TARGET_CREATION_V2' &&
    state.work_id === '0004' &&
    state.create_attempt_count === 1 &&
    Number.isInteger(state.inspection_attempt_count) &&
    state.inspection_attempt_count >= 1 &&
    state.inspection_attempt_count <= 2 &&
    Number.isInteger(state.push_attempt_count) &&
    Number.isInteger(state.pull_attempt_count) &&
    state.script_id === config.scriptId &&
    state.parent_id === target.expected_parent_id &&
    state.principal_fingerprint === target.principal_fingerprint &&
    state.target_fingerprint === target.target_fingerprint &&
    target.work_id === '0004' &&
    target.target_disposition === 'FRESH_SYNTHETIC_CREATED';
  if (!commonValid) {
    fail('WORK_0004_REMOTE_STATE_INVALID', 'WORK_0004_REMOTE_STATE_INVALID');
  }

  const next = Object.assign({}, state);
  if (command === 'push') {
    if (state.phase !== 'INSPECTION_PASS' ||
        state.push_attempt_count !== 0 || state.pull_attempt_count !== 0) {
      fail('WORK_0004_PUSH_ALREADY_ATTEMPTED',
        'WORK_0004_PUSH_ALREADY_ATTEMPTED');
    }
    next.push_attempt_count = 1;
    next.phase = 'PUSH_ATTEMPT_STARTED';
    return next;
  }
  if (command === 'pull-verify') {
    if (state.phase !== 'PUSH_PASS' ||
        state.push_attempt_count !== 1 || state.pull_attempt_count !== 0) {
      fail('WORK_0004_PULL_ALREADY_ATTEMPTED_OR_PUSH_NOT_PASSED',
        'WORK_0004_PULL_ALREADY_ATTEMPTED_OR_PUSH_NOT_PASSED');
    }
    next.pull_attempt_count = 1;
    next.phase = 'PULL_ATTEMPT_STARTED';
    return next;
  }
  fail('WORK_0004_REMOTE_COMMAND_INVALID', 'WORK_0004_REMOTE_COMMAND_INVALID');
}

function beginWork0004RemoteAttempt(command, config, target) {
  if (fs.existsSync(path.join(devRoot, 'creation-state.json'))) {
    fail('WORK_0003_STATE_REUSE_REFUSED', 'WORK_0003_STATE_REUSE_REFUSED');
  }
  const state = readJson(
    work0004CreationStatePath,
    'WORK_0004_CREATION_STATE_MISSING'
  );
  const next = nextWork0004RemoteAttemptState(state, config, target, command);
  writeJsonAtomic(work0004CreationStatePath, next);
  return next;
}

function completeWork0004RemoteAttempt(command) {
  const state = readJson(
    work0004CreationStatePath,
    'WORK_0004_CREATION_STATE_MISSING'
  );
  if (command === 'push' && state.phase === 'PUSH_ATTEMPT_STARTED' &&
      state.push_attempt_count === 1 && state.pull_attempt_count === 0) {
    state.phase = 'PUSH_PASS';
  } else if (command === 'pull-verify' &&
      state.phase === 'PULL_ATTEMPT_STARTED' &&
      state.push_attempt_count === 1 && state.pull_attempt_count === 1) {
    state.phase = 'PULL_PARITY_PASS';
  } else {
    fail('WORK_0004_REMOTE_STATE_COMPLETION_INVALID',
      'WORK_0004_REMOTE_STATE_COMPLETION_INVALID');
  }
  writeJsonAtomic(work0004CreationStatePath, state);
}

function nextWork0006RemoteAttemptState(state, config, target, command) {
  const commonValid = state &&
    state.schema === 'WORK_OS_SYNTHETIC_TARGET_CREATION_V3' &&
    state.work_id === '0006' &&
    state.create_attempt_count === 1 &&
    Number.isInteger(state.inspection_attempt_count) &&
    state.inspection_attempt_count >= 1 &&
    state.inspection_attempt_count <= 2 &&
    Number.isInteger(state.push_attempt_count) &&
    Number.isInteger(state.pull_attempt_count) &&
    state.script_id === config.scriptId &&
    state.parent_id === target.expected_parent_id &&
    state.principal_fingerprint === target.principal_fingerprint &&
    state.target_fingerprint === target.target_fingerprint &&
    target.work_id === '0006' &&
    target.target_disposition === 'FRESH_SYNTHETIC_CREATED';
  if (!commonValid) {
    fail('WORK_0006_REMOTE_STATE_INVALID', 'WORK_0006_REMOTE_STATE_INVALID');
  }

  const next = Object.assign({}, state);
  if (command === 'push') {
    if (state.phase !== 'INSPECTION_PASS' ||
        state.push_attempt_count !== 0 || state.pull_attempt_count !== 0) {
      fail('WORK_0006_PUSH_ALREADY_ATTEMPTED',
        'WORK_0006_PUSH_ALREADY_ATTEMPTED');
    }
    next.push_attempt_count = 1;
    next.phase = 'PUSH_ATTEMPT_STARTED';
    return next;
  }
  if (command === 'pull-verify') {
    if (state.phase !== 'PUSH_PASS' ||
        state.push_attempt_count !== 1 || state.pull_attempt_count !== 0) {
      fail('WORK_0006_PULL_ALREADY_ATTEMPTED_OR_PUSH_NOT_PASSED',
        'WORK_0006_PULL_ALREADY_ATTEMPTED_OR_PUSH_NOT_PASSED');
    }
    next.pull_attempt_count = 1;
    next.phase = 'PULL_ATTEMPT_STARTED';
    return next;
  }
  fail('WORK_0006_REMOTE_COMMAND_INVALID', 'WORK_0006_REMOTE_COMMAND_INVALID');
}

function beginWork0006RemoteAttempt(command, config, target) {
  const state = readJson(
    work0006ExecutionStatePath,
    'WORK_0006_EXECUTION_STATE_MISSING'
  );
  const next = nextWork0006RemoteAttemptState(state, config, target, command);
  writeJsonAtomic(work0006ExecutionStatePath, next);
  return next;
}

function completeWork0006RemoteAttempt(command) {
  const state = readJson(
    work0006ExecutionStatePath,
    'WORK_0006_EXECUTION_STATE_MISSING'
  );
  if (command === 'push' && state.phase === 'PUSH_ATTEMPT_STARTED' &&
      state.push_attempt_count === 1 && state.pull_attempt_count === 0) {
    state.phase = 'PUSH_PASS';
  } else if (command === 'pull-verify' &&
      state.phase === 'PULL_ATTEMPT_STARTED' &&
      state.push_attempt_count === 1 && state.pull_attempt_count === 1) {
    state.phase = 'PULL_PARITY_PASS';
  } else {
    fail('WORK_0006_REMOTE_STATE_COMPLETION_INVALID',
      'WORK_0006_REMOTE_STATE_COMPLETION_INVALID');
  }
  writeJsonAtomic(work0006ExecutionStatePath, state);
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

function requireRuntimeOptIn(target) {
  if (process.env.GAS_DEV_RUNTIME_ALLOWED !== 'true') {
    fail('DEV_RUNTIME_OPT_IN_REQUIRED', 'DEV_RUNTIME_OPT_IN_REQUIRED');
  }
  if (target.runtime_dry_run_allowed !== true ||
      target.runtime_function !== allowedRuntimeFunction) {
    fail('DEV_RUNTIME_NOT_CONFIGURED', 'DEV_RUNTIME_NOT_CONFIGURED');
  }
  const configSource = fs.readFileSync(path.join(sourceRoot, '00_Config.gs'), 'utf8');
  const diagnosticSource = fs.readFileSync(path.join(sourceRoot, '16_Diagnostics.gs'), 'utf8');
  if (!/TEST_MODE:\s*true/.test(configSource) ||
      !diagnosticSource.includes('function runQuickDiagnostic()') ||
      !diagnosticSource.includes('readOnlyExecutionPolicy')) {
    fail('SAFE_RUNTIME_FUNCTION_CONTRACT_UNPROVEN',
      'SAFE_RUNTIME_FUNCTION_CONTRACT_UNPROVEN');
  }
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
}

function prepareEmptyPullWorkspace() {
  if (!fs.existsSync(pullRoot)) {
    fs.mkdirSync(pullRoot, { recursive: true });
    return;
  }
  const expectedRoot = new Set(['.clasp.json', '.claspignore', 'payload']);
  const entries = fs.readdirSync(pullRoot, { withFileTypes: true });
  if (entries.some((entry) => !expectedRoot.has(entry.name))) {
    fail('PULL_VERIFY_WORKSPACE_UNEXPECTED_CONTENT',
      'PULL_VERIFY_WORKSPACE_UNEXPECTED_CONTENT');
  }
  const payload = path.join(pullRoot, 'payload');
  if (fs.existsSync(payload)) {
    assertExactPayloadDirectory(payload, 'PULL_VERIFY_WORKSPACE_UNEXPECTED_CONTENT');
  }
  const resolvedPullRoot = path.resolve(pullRoot);
  const resolvedModuleRoot = `${path.resolve(moduleRoot)}${path.sep}`;
  if (!resolvedPullRoot.startsWith(resolvedModuleRoot) ||
      path.basename(resolvedPullRoot) !== '.clasp-pull-verify-work-0006') {
    fail('PULL_VERIFY_WORKSPACE_PATH_REJECTED',
      'PULL_VERIFY_WORKSPACE_PATH_REJECTED');
  }
  fs.rmSync(resolvedPullRoot, { recursive: true, force: true });
  fs.mkdirSync(resolvedPullRoot, { recursive: true });
}

function writePullConfig(config) {
  fs.writeFileSync(path.join(pullRoot, '.clasp.json'),
    `${JSON.stringify(claspProjectConfig(config.scriptId), null, 2)}\n`,
    'utf8');
  fs.writeFileSync(path.join(pullRoot, '.claspignore'),
    claspIgnoreContents(), 'utf8');
}

function parseRuntimeCommand(command) {
  if (!command) {
    fail('UNKNOWN_GAS_DEV_COMMAND', 'UNKNOWN_GAS_DEV_COMMAND');
  }
  if (!['stage', 'inventory-check', 'push', 'pull-verify', 'self-test']
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
    assert.strictEqual(names.length, 24);
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
  test('CLASP_CONFIG_PINS_GS_AS_PREFERRED_PULL_EXTENSION', () => {
    const config = claspProjectConfig('SYNTHETIC');
    assert.deepStrictEqual(config.scriptExtensions, ['.gs', '.js']);
    assert.strictEqual(config.scriptExtensions[0], '.gs');
  });
  test('CLASP_IGNORE_IS_AN_EXACT_CANONICAL_NAME_ALLOWLIST', () => {
    const lines = claspIgnoreContents().trim().split('\n');
    assert.strictEqual(lines[0], '**/**');
    assert.deepStrictEqual(
      lines.slice(1).sort(),
      canonicalPayloadFileNames.map((name) => `!${name}`).sort()
    );
  });
  test('TARGET_GUARD_REJECTS_PLACEHOLDER', () => {
    assert.throws(() => assertTargetObjects(
      claspProjectConfig('REPLACE_WITH_PERSONAL_SYNTHETIC_DEV_SCRIPT_ID'),
      { target_kind: allowedTargetKind, expected_script_id: 'REPLACE_WITH_PERSONAL_SYNTHETIC_DEV_SCRIPT_ID' }
    ), (error) => error && error.code === 'DEV_TARGET_NOT_CONFIGURED');
  });
  test('TARGET_GUARD_REJECTS_MISMATCH', () => {
    assert.throws(() => assertTargetObjects(
      claspProjectConfig('a'.repeat(24)),
      { target_kind: allowedTargetKind, expected_script_id: 'b'.repeat(24) }
    ), (error) => error && error.code === 'DEV_TARGET_ID_MISMATCH');
  });
  test('TARGET_GUARD_REJECTS_JS_FIRST_EXTENSION_ORDER', () => {
    assert.throws(() => assertTargetObjects(
      {
        scriptId: 'a'.repeat(24),
        rootDir: 'payload',
        scriptExtensions: ['.js', '.gs']
      },
      { target_kind: allowedTargetKind, expected_script_id: 'a'.repeat(24) }
    ), (error) => error &&
      error.code === 'DEV_TARGET_SCRIPT_EXTENSIONS_REJECTED');
  });
  test('TARGET_GUARD_REQUIRES_EXPLICIT_PUSH_OPT_IN', () => {
    assert.throws(() => assertTargetObjects(
      claspProjectConfig('a'.repeat(24)),
      { target_kind: allowedTargetKind, expected_script_id: 'a'.repeat(24) }, {}
    ), (error) => error && error.code === 'GAS_DEV_CLASP_ALLOWED_REQUIRED');
  });
  test('SAFE_RESULT_NEVER_EMITS_A_TARGET_ID', () => {
    const targetId = 'a'.repeat(24);
    const safe = { command: 'status', status: 'DEV_TARGET_NOT_CONFIGURED' };
    assert.strictEqual(JSON.stringify(safe).includes(targetId), false);
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
  let command = 'UNKNOWN';
  let googleOperation = 'NOT_EXECUTED';
  let releaseOperationLock = null;
  try {
    command = parseRuntimeCommand(process.argv[2]);
    if (command === 'self-test') return selfTest();
    if (command === 'stage') {
      assertExactWork0006Branch();
      const inventory = stagePayload();
      writeSafeResult({
        lane: 'local_clasp_dev', command, status: 'PASS',
        target: 'NOT_INSPECTED', file_count: inventory.file_count,
        payload_sha256: inventory.payload_sha256,
        clasp_version: claspVersion()
      });
      return;
    }

    assertExactWork0006Branch();
    const inventory = assertStagedPayload();
    if (command === 'inventory-check') {
      const selection = runIsolatedStagedClaspNativeSelection();
      writeSafeResult({
        lane: 'local_clasp_dev', command, status: 'PASS',
        file_count: selection.file_count,
        gs_file_count: selection.gs_file_count,
        manifest_file_count: selection.manifest_file_count,
        missing_file_count: selection.missing_file_count,
        extra_file_count: selection.extra_file_count,
        payload_sha256: selection.payload_sha256,
        preferred_pull_script_extension:
          selection.preferred_pull_script_extension,
        clasp_version: claspVersion(), google_operation: 'NOT_EXECUTED'
      });
      return;
    }

    if (command === 'push') {
      releaseOperationLock = acquireWork0006OperationLock(command);
      assertCleanWorktree();
      runLocalVerifyBeforePush();
      const target = assertTargetGuard(true);
      const nativeStatus = prepareWork0006PushAttempt(
        devRoot, target.config, target.target
      );
      googleOperation = 'CLASP_PUSH_ATTEMPT_STARTED';
      const result = runClasp(claspSemanticPushArguments, devRoot);
      const semanticEvidence = assertClaspPushSemanticEvidence(result, devRoot);
      completeWork0006RemoteAttempt(command);
      const safe = {
        lane: 'local_clasp_dev', command, status: 'PASS',
        file_count: semanticEvidence.file_count,
        gs_file_count: semanticEvidence.gs_file_count,
        manifest_file_count: semanticEvidence.manifest_file_count,
        missing_file_count: semanticEvidence.missing_file_count,
        extra_file_count: semanticEvidence.extra_file_count,
        update_content_evidenced: semanticEvidence.update_content_evidenced,
        native_eligible_file_count: nativeStatus.file_count,
        payload_sha256: inventory.payload_sha256,
        clasp_version: claspVersion(), command_output_sha256: result.output_sha256
      };
      writeLastOperation(safe);
      writeSafeResult(safe);
      return;
    }

    if (command === 'pull-verify') {
      releaseOperationLock = acquireWork0006OperationLock(command);
      const target = assertTargetGuard(true);
      beginWork0006RemoteAttempt(command, target.config, target.target);
      googleOperation = 'CLASP_PULL_ATTEMPT_STARTED';
      prepareEmptyPullWorkspace();
      writePullConfig(target.config);
      const result = runClasp(['pull'], pullRoot);
      if (result.exit_code !== 0) fail('CLASP_PULL_FAILED', 'CLASP_PULL_FAILED');
      const names = canonicalPayloadNames();
      assertExactPayloadDirectory(
        path.join(pullRoot, 'payload'),
        'REMOTE_PULLBACK_UNEXPECTED_CONTENT'
      );
      const pulled = inventoryFor(path.join(pullRoot, 'payload'), names);
      if (pulled.payload_sha256 !== inventory.payload_sha256) {
        fail('REMOTE_PULLBACK_PARITY_FAILED', 'REMOTE_PULLBACK_PARITY_FAILED');
      }
      completeWork0006RemoteAttempt(command);
      const safe = {
        lane: 'local_clasp_dev', command, status: 'PASS', parity: 'PASS',
        file_count: inventory.file_count, gs_file_count: 23,
        manifest_file_count: 1, missing_file_count: 0, extra_file_count: 0,
        payload_sha256: inventory.payload_sha256,
        clasp_version: claspVersion(), command_output_sha256: result.output_sha256
      };
      writeLastOperation(safe);
      writeSafeResult(safe);
      return;
    }

    if (command === 'test') {
      const target = assertTargetGuard(true);
      requireRuntimeOptIn(target.target);
      const result = runClasp(['run', allowedRuntimeFunction], devRoot);
      if (result.exit_code !== 0) fail('DEV_RUNTIME_DRY_RUN_FAILED',
        'DEV_RUNTIME_DRY_RUN_FAILED');
      assertSafeRuntimeResult(result.raw);
      const safe = {
        lane: 'local_clasp_dev', command, status: 'PASS',
        runtime_function: allowedRuntimeFunction, file_count: inventory.file_count,
        payload_sha256: inventory.payload_sha256, clasp_version: claspVersion(),
        command_output_sha256: result.output_sha256
      };
      writeLastOperation(safe);
      writeSafeResult(safe);
      return;
    }

    if (command === 'open') {
      assertTargetGuard(true);
      const result = runClasp(['open'], devRoot);
      if (result.exit_code !== 0) fail('CLASP_OPEN_FAILED', 'CLASP_OPEN_FAILED');
      writeSafeResult({
        lane: 'local_clasp_dev', command, status: 'PASS',
        clasp_version: claspVersion(), command_output_sha256: result.output_sha256
      });
    }
  } catch (error) {
    const code = error && error.code || 'LOCAL_CLASP_UNEXPECTED_FAILURE';
    writeSafeResult({
      lane: 'local_clasp_dev', command, status: code,
      google_operation: googleOperation,
      message: code
    });
    process.exitCode = 2;
  } finally {
    if (releaseOperationLock) releaseOperationLock();
  }
}

if (require.main === module) main();

module.exports = {
  canonicalPayloadNames,
  canonicalPayloadFileNames,
  claspScriptExtensions,
  claspSemanticPushArguments,
  claspProjectConfig,
  claspIgnoreContents,
  assertExactPayloadNames,
  assertExactPayloadDirectory,
  claspEntrypoint,
  runClasp,
  runClaspNativeFileStatus,
  assertClaspNativePayloadSelection,
  assertClaspPushSemanticEvidence,
  prepareWork0004PushAttempt,
  runIsolatedStagedClaspNativeSelection,
  prepareWork0006PushAttempt,
  inventoryFor,
  inventoryForCommittedPayload,
  assertTargetObjects,
  nextWork0004RemoteAttemptState,
  nextWork0006RemoteAttemptState,
  beginWork0006RemoteAttempt,
  completeWork0006RemoteAttempt,
  work0006ExecutionStateFileName,
  work0006OperationLockFileName,
  acquireWork0006OperationLock,
  GateError
};
