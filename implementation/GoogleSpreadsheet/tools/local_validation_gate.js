'use strict';

/**
 * Deterministic non-Google validation gate for the current candidate.
 *
 * The report deliberately contains only command identifiers, statuses, counts,
 * Git refs, and SHA-256 values. It never invokes clasp or reads local clasp
 * configuration.
 */
const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { canonicalPayloadFileNames } = require('./local_clasp_dev');

const moduleRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(moduleRoot, '..', '..');
const sourceRoot = path.join(moduleRoot, 'apps-script-v2');
const testsRoot = path.join(moduleRoot, 'tests');
const toolsRoot = path.join(moduleRoot, 'tools');
const reportRoot = path.join(moduleRoot, '.local-validation');
const instruction0006 = '06e5295f5c90c43964720be8598ef66ef7688318';
const sourceA11 = 'aeca148415d70df625400e53d2281378adff60b4';
const releaseB11 = '952438907e1a09092a46127dc130b3403a911db4';
const fixedT11 = 'a3b5a5d8d851bf2d15a2738c54dc6bb31e231d33';
const transferPath =
  'implementation/GoogleSpreadsheet/transfer/v2.8.11-prepilot';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function git(args) {
  const result = childProcess.spawnSync('git', ['-C', repositoryRoot].concat(args), {
    encoding: 'utf8',
    windowsHide: true
  });
  if (result.status !== 0) {
    throw new Error('GIT_COMMAND_FAILED');
  }
  return String(result.stdout || '').trim();
}

function trackedFiles(patterns) {
  const output = git(['ls-files', '-z', '--'].concat(patterns));
  return output ? output.split('\0').filter(Boolean).sort() : [];
}

function run(command, args, options = {}) {
  const result = childProcess.spawnSync(command, args, {
    cwd: options.cwd || moduleRoot,
    encoding: 'utf8',
    windowsHide: true,
    env: Object.assign({}, process.env, options.env || {})
  });
  if (result.error || result.status !== 0) {
    throw new Error(options.failureCode || 'LOCAL_COMMAND_FAILED');
  }
  return {
    output_sha256: sha256(`${result.stdout || ''}\n${result.stderr || ''}`)
  };
}

function powershellCommand() {
  return process.platform === 'win32' ? 'powershell.exe' : 'pwsh';
}

function runPowerShell(scriptName, args) {
  return run(powershellCommand(), [
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
    path.join(toolsRoot, scriptName)
  ].concat(args), { cwd: moduleRoot, failureCode: 'POWERSHELL_VERIFIER_FAILED' });
}

function statusFrom(fn) {
  const started = Date.now();
  try {
    const details = fn() || {};
    return Object.assign({ status: 'PASS', duration_ms: Date.now() - started }, details);
  } catch (error) {
    return {
      status: 'FAIL',
      duration_ms: Date.now() - started,
      safe_message: String(error && error.message || error).slice(0, 160)
    };
  }
}

function checkCleanWorktree() {
  const status = git(['status', '--porcelain=v1', '--untracked-files=normal']);
  if (status) throw new Error('WORKTREE_NOT_CLEAN');
  return { command: 'git status --porcelain=v1', changed_file_count: 0 };
}

function checkUnexpectedGeneratedFiles() {
  const untracked = git(['ls-files', '--others', '--exclude-standard']);
  if (untracked) throw new Error('UNTRACKED_GENERATED_FILE_PRESENT');
  return { command: 'git ls-files --others --exclude-standard', untracked_file_count: 0 };
}

function checkJson() {
  const files = trackedFiles(['*.json']);
  if (!files.length) throw new Error('NO_TRACKED_JSON_FILES');
  for (const file of files) {
    JSON.parse(fs.readFileSync(path.join(repositoryRoot, file), 'utf8'));
  }
  return { command: 'tracked JSON parse', file_count: files.length };
}

function checkYaml() {
  const files = trackedFiles(['*.yml', '*.yaml']);
  if (!files.length) throw new Error('NO_TRACKED_YAML_FILES');
  for (const file of files) {
    const document = YAML.parseDocument(
      fs.readFileSync(path.join(repositoryRoot, file), 'utf8')
    );
    if (document.errors.length) throw new Error('INVALID_TRACKED_YAML');
  }
  return { command: 'tracked YAML parse', file_count: files.length };
}

function checkAppsScriptInventory() {
  const names = fs.readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  const gs = names.filter((name) => name.endsWith('.gs'));
  const expectedPayload = canonicalPayloadFileNames.slice().sort();
  const actualPayload = gs.concat('appsscript.json').sort();
  if (actualPayload.length !== expectedPayload.length ||
      actualPayload.some((name, index) => name !== expectedPayload[index])) {
    throw new Error('APPS_SCRIPT_PAYLOAD_INVENTORY_INVALID');
  }
  const manifest = JSON.parse(fs.readFileSync(
    path.join(sourceRoot, 'appsscript.json'), 'utf8'
  ));
  if (manifest.runtimeVersion !== 'V8' || !Array.isArray(manifest.oauthScopes)) {
    throw new Error('APPS_SCRIPT_MANIFEST_INVALID');
  }
  const files = gs.concat('appsscript.json').sort().map((name) => ({
    name,
    sha256: sha256(fs.readFileSync(path.join(sourceRoot, name)))
  }));
  return {
    command: 'Apps Script payload inventory',
    gs_file_count: gs.length,
    payload_file_count: gs.length + 1,
    payload_sha256: sha256(files.map((file) => `${file.name}:${file.sha256}`).join('\n'))
  };
}

function checkAppsScriptStatic() {
  const result = run(process.execPath, [
    path.join(toolsRoot, 'validate_apps_script_v2.js')
  ], { cwd: moduleRoot, failureCode: 'APPS_SCRIPT_VALIDATOR_FAILED' });
  return Object.assign({ command: 'validate_apps_script_v2.js' }, result);
}

function checkNodeSuites() {
  const suites = fs.readdirSync(testsRoot)
    .filter((name) => name.endsWith('_test.js'))
    .sort();
  if (suites.length < 48) throw new Error('REGRESSION_SUITE_COUNT_BELOW_BASELINE');
  for (const suite of suites) {
    run(process.execPath, [path.join(testsRoot, suite)], {
      cwd: moduleRoot,
      failureCode: 'NODE_REGRESSION_SUITE_FAILED'
    });
  }
  return { command: 'all *_test.js suites', suite_count: suites.length };
}

function checkRelease() {
  const outputs = [
    runPowerShell('verify_v2_8_11_release.ps1', ['-SourceCommit', sourceA11]),
    runPowerShell('verify_v2_8_11_phase8c_release.ps1', ['-SourceCommit', sourceA11])
  ];
  return {
    command: 'v2.8.11 Phase 8B/8C package verifiers',
    verifier_count: outputs.length,
    output_sha256: sha256(outputs.map((item) => item.output_sha256).join('\n'))
  };
}

function checkTransfer() {
  const result = runPowerShell('verify_v2_8_11_company_pc_patch_manifest.ps1', [
    '-NewPayloadCommit', releaseB11
  ]);
  return {
    command: 'v2.8.11 patch-manifest and transfer-envelope verifier',
    output_sha256: result.output_sha256
  };
}

function checkFixedRefs() {
  [sourceA11, releaseB11, fixedT11].forEach((ref) =>
    git(['rev-parse', '--verify', `${ref}^{commit}`])
  );
  if (git(['rev-parse', `${releaseB11}^`]) !== sourceA11 ||
      git(['rev-parse', `${fixedT11}^`]) !== releaseB11) {
    throw new Error('A11_B11_T11_LINEAGE_INVALID');
  }
  const fixedTree = git(['rev-parse', `${fixedT11}:${transferPath}`]);
  const currentTree = git(['rev-parse', `HEAD:${transferPath}`]);
  if (fixedTree !== currentTree) throw new Error('FIXED_T11_TRANSFER_TREE_CHANGED');
  return {
    command: 'A11.1/B11/T11 lineage and fixed transfer tree',
    source_commit: sourceA11,
    release_commit: releaseB11,
    fixed_transfer: fixedT11,
    transfer_tree_sha256: sha256(fixedTree)
  };
}

function contentHasSensitivePattern(content) {
  const secretPattern = /(?:sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{20,}|ya29\.[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|https?:\/\/[^/\s:@]+:[^@\s/]+@|https:\/\/(?:docs\.google\.com\/(?:spreadsheets|document)|drive\.google\.com|script\.google\.com|calendar\.google\.com)\/|(?:[A-Za-z]:\\\\|\\\\\\\\[^\\\s]+\\\\[^\\\s]+|\/(?:home|Users)\/[^/\s]+\/))/i;
  const text = String(content);
  const backslash = String.fromCharCode(92);
  const homeSegments = ['users', 'documents and settings', 'home'];
  const hasWindowsDrivePath = Array.from(text).some((character, index) =>
    /[A-Za-z]/.test(character) && text[index + 1] === ':' &&
    text[index + 2] === backslash && homeSegments.some((segment) =>
      text.slice(index + 3, index + 3 + segment.length).toLowerCase() === segment
    )
  );
  return secretPattern.test(text) || hasWindowsDrivePath;
}

function changedTrackedFilesSinceInstruction() {
  const output = git([
    'diff', '--name-only', '--diff-filter=ACMR',
    `${instruction0006}..HEAD`, '--'
  ]);
  return output ? output.split(/\r?\n/).filter(Boolean).sort() : [];
}

function addedTextSinceInstruction() {
  const diff = git([
    'diff', '--no-ext-diff', '--unified=0', '--diff-filter=ACMR',
    `${instruction0006}..HEAD`, '--'
  ]);
  return diff.split(/\r?\n/)
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1))
    .join('\n');
}

function isForbiddenCredentialPath(file) {
  const segments = String(file).split('/');
  const base = segments[segments.length - 1];
  if (segments.some((segment) =>
    ['.clasp-dev', '.clasp-pull-verify'].includes(segment))) return true;
  if (['.clasp.json', '.clasprc', '.clasprc.json'].includes(base)) return true;
  if (/^(?:creds|credentials|client_secret)(?:[._-][A-Za-z0-9_-]+)?\.json$/i.test(base)) {
    return true;
  }
  if (/^\.env(?:\.[A-Za-z0-9_-]+)?$/i.test(base) &&
      !/^\.env\.example$/i.test(base)) return true;
  return /\.(?:key|pem|p12|pfx)$/i.test(base);
}

function checkTrackedSecretsAndLocalArtifacts() {
  const files = trackedFiles(['.']);
  const actualScriptIdPattern = /"scriptId"\s*:\s*"(?!REPLACE_WITH)[^"]+"/i;
  const changedFiles = changedTrackedFilesSinceInstruction();
  const addedText = addedTextSinceInstruction();
  const hits = [];
  for (const file of files) {
    if (isForbiddenCredentialPath(file)) hits.push({ file, kind: 'forbidden_path' });
    const full = path.join(repositoryRoot, file);
    const content = fs.readFileSync(full);
    if (actualScriptIdPattern.test(content)) hits.push({ file, kind: 'tracked_script_id' });
  }
  if (contentHasSensitivePattern(addedText)) {
    hits.push({ kind: 'secret_or_local_path_in_added_content' });
  }
  if (hits.length) throw new Error('TRACKED_SECRET_OR_LOCAL_ARTIFACT_FOUND');
  return {
    command: 'tracked secret/credential/local-path/clasp scan',
    file_count: files.length,
    changed_content_scan_file_count: changedFiles.length,
    added_content_line_count: addedText ? addedText.split('\n').length : 0,
    content_scan_baseline: 'instruction_0006',
    canonical_source_doc_scan: 'RPC-06 regression suite',
    hit_count: 0
  };
}

function parseArgs(argv) {
  const parsed = { mode: 'local', section: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--mode') parsed.mode = argv[++index];
    else if (argv[index] === '--section') parsed.section = argv[++index];
    else throw new Error('UNKNOWN_ARGUMENT');
  }
  if (!['local', 'ci'].includes(parsed.mode)) throw new Error('INVALID_MODE');
  if (parsed.section && ![
    'json', 'yaml', 'apps-script', 'tests', 'release', 'transfer', 'secret-scan'
  ].includes(parsed.section)) throw new Error('INVALID_SECTION');
  return parsed;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const sections = [
    ['worktree', checkCleanWorktree],
    ['generated-files', checkUnexpectedGeneratedFiles],
    ['json', checkJson],
    ['yaml', checkYaml],
    ['apps-script-inventory', checkAppsScriptInventory],
    ['apps-script', checkAppsScriptStatic],
    ['tests', checkNodeSuites],
    ['release', checkRelease],
    ['transfer', checkTransfer],
    ['fixed-refs', checkFixedRefs],
    ['secret-scan', checkTrackedSecretsAndLocalArtifacts]
  ];
  const selected = args.section
    ? sections.filter(([name]) => name === args.section ||
      (args.section === 'apps-script' && name === 'apps-script-inventory'))
    : sections;
  const checks = selected.map(([name, body]) => Object.assign({ name }, statusFrom(body)));
  const failed = checks.filter((check) => check.status !== 'PASS');
  const report = {
    schema: 'WORK_OS_LOCAL_VERIFICATION_REPORT_V1',
    environment: 'LOCAL_NON_GOOGLE',
    mode: args.mode,
    git: {
      head: git(['rev-parse', 'HEAD']),
      branch: git(['branch', '--show-current'])
    },
    checks,
    passed: checks.length - failed.length,
    failed: failed.length,
    clasp_push: 'NOT_EXECUTED',
    clasp_pullback_parity: 'NOT_EXECUTED',
    runtime_dry_run: 'NOT_EXECUTED'
  };
  fs.mkdirSync(reportRoot, { recursive: true });
  fs.writeFileSync(path.join(reportRoot, 'local-validation-report.json'),
    `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (failed.length) process.exitCode = 1;
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stdout.write(`${JSON.stringify({
      schema: 'WORK_OS_LOCAL_VERIFICATION_REPORT_V1',
      environment: 'LOCAL_NON_GOOGLE',
      status: 'FAIL',
      safe_message: String(error && error.message || error).slice(0, 160)
    }, null, 2)}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  contentHasSensitivePattern,
  isForbiddenCredentialPath
};
