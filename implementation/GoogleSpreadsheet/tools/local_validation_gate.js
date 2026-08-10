'use strict';

/**
 * Deterministic non-Google verification gate for the Work 0002 candidate and
 * its explicitly authorized validation descendants.
 *
 * Output is limited to command identifiers, closed statuses, counts, Git SHAs,
 * and SHA-256 fingerprints. The gate never reads clasp configuration and never
 * invokes Google, OAuth, deployment, or Workspace operations.
 */
const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const YAML = require('yaml');
const { canonicalPayloadFileNames } = require('./local_clasp_dev');

const moduleRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(moduleRoot, '..', '..');
const sourceRoot = path.join(moduleRoot, 'apps-script-v2');
const testsRoot = path.join(moduleRoot, 'tests');
const toolsRoot = path.join(moduleRoot, 'tools');
const reportRoot = path.join(moduleRoot, '.local-validation');
const contractPath = path.join(repositoryRoot, 'CURRENT_CONTRACT.json');
const startingMain = 'e2a7c683a7c0f7f1a865aec89a9e24ec56f830da';
const expectedBranch = 'codex/0002-clean-integration-candidate';
const numberedWorkBranchPattern =
  /^codex\/\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const phase8bPath =
  'implementation/GoogleSpreadsheet/release/v2.8.12-prepilot';
const phase8cPath =
  'implementation/GoogleSpreadsheet/release/v2.8.12-prepilot-phase8c';
const releaseReportPath =
  'implementation/GoogleSpreadsheet/WORK_0002_RELEASE_IMPLEMENTATION_REPORT.md';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function spawnGit(args) {
  return childProcess.spawnSync('git', ['-C', repositoryRoot].concat(args), {
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024
  });
}

function git(args) {
  const result = spawnGit(args);
  if (result.error || result.status !== 0) throw new Error('GIT_COMMAND_FAILED');
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
  return { output_sha256: sha256(`${result.stdout || ''}\n${result.stderr || ''}`) };
}

function powershellCommand() {
  return process.platform === 'win32' ? 'powershell.exe' : 'pwsh';
}

function runPowerShell(scriptName, args, executionModuleRoot = moduleRoot) {
  return run(powershellCommand(), [
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
    path.join(executionModuleRoot, 'tools', scriptName)
  ].concat(args), {
    cwd: executionModuleRoot,
    failureCode: 'POWERSHELL_VERIFIER_FAILED'
  });
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

function readContract() {
  if (!fs.existsSync(contractPath)) throw new Error('CURRENT_CONTRACT_MISSING');
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const expected = {
    schema: 'WORK_OS_CURRENT_CONTRACT_V1',
    repository: 'Tanukitsune-hub/GAS-Project-Schedule',
    starting_main: startingMain,
    branch: expectedBranch,
    code_version: '2.8.12-prepilot',
    schema_version: '2.6',
    ai_schema_version: '2.0',
    migration_version: '3',
    highest_gate: 'READY_FOR_CONTROLLED_SANDBOX_VALIDATION',
    automation: false,
    active_transfer: null,
    active_deployment: null,
    release_commit: 'SELF'
  };
  for (const [key, value] of Object.entries(expected)) {
    if (contract[key] !== value) throw new Error(`CURRENT_CONTRACT_${key.toUpperCase()}_INVALID`);
  }
  if (!/^[0-9a-f]{40}$/.test(String(contract.source_commit || ''))) {
    throw new Error('CURRENT_CONTRACT_SOURCE_COMMIT_INVALID');
  }
  if (!contract.phase8b || contract.phase8b.path !== phase8bPath ||
      contract.phase8b.test_mode !== true || contract.phase8b.test_harness !== true) {
    throw new Error('CURRENT_CONTRACT_PHASE8B_INVALID');
  }
  if (!contract.phase8c || contract.phase8c.path !== phase8cPath ||
      contract.phase8c.test_mode !== false || contract.phase8c.test_harness !== false ||
      contract.phase8c.transform !== 'TEST_MODE_ONLY') {
    throw new Error('CURRENT_CONTRACT_PHASE8C_INVALID');
  }
  return contract;
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

function isAllowedScopeBranch(branch) {
  return branch === expectedBranch || numberedWorkBranchPattern.test(branch);
}

function checkRepositoryScope(options = {}) {
  const gitCommand = options.git || git;
  const spawnGitCommand = options.spawnGit || spawnGit;
  const scopeStartingMain = options.startingMain || startingMain;
  const branchPolicy = options.branchPolicy || isAllowedScopeBranch;
  const environment = options.environment || process.env;
  const branch = gitCommand(['branch', '--show-current']);
  if (branch && !branchPolicy(branch)) {
    throw new Error('UNEXPECTED_BRANCH');
  }
  let scopeHead = 'HEAD';
  let checkout = branch || 'DETACHED';
  if (!branch && environment.GITHUB_EVENT_NAME === 'pull_request') {
    if (environment.GITHUB_ACTIONS !== 'true' ||
        !/^refs\/pull\/\d+\/merge$/.test(String(environment.GITHUB_REF || ''))) {
      throw new Error('UNEXPECTED_GITHUB_PULL_REQUEST_CONTEXT');
    }
    if (!branchPolicy(String(environment.GITHUB_HEAD_REF || ''))) {
      throw new Error('UNEXPECTED_GITHUB_HEAD_REF');
    }
    const parents = gitCommand(['show', '-s', '--format=%P', 'HEAD'])
      .split(/\s+/).filter(Boolean);
    if (parents.length !== 2) throw new Error('PULL_REQUEST_MERGE_REF_INVALID');
    const baseAncestry = spawnGitCommand([
      'merge-base', '--is-ancestor', scopeStartingMain, parents[0]
    ]);
    if (baseAncestry.status !== 0) throw new Error('PULL_REQUEST_MERGE_BASE_INVALID');
    scopeHead = parents[1];
    checkout = 'GITHUB_PULL_REQUEST_MERGE';
  } else if (!branch) {
    const parents = gitCommand(['show', '-s', '--format=%P', 'HEAD'])
      .split(/\s+/).filter(Boolean);
    if (parents.length > 1) throw new Error('UNEXPECTED_DETACHED_MERGE');
  }
  const ancestry = spawnGitCommand(['merge-base', '--is-ancestor', scopeStartingMain, scopeHead]);
  if (ancestry.status !== 0) throw new Error('STARTING_MAIN_NOT_ANCESTOR');
  const governance = gitCommand([
    'diff', '--name-only', scopeStartingMain, scopeHead, '--', 'AGENTS.md', '.codex'
  ]);
  if (governance) throw new Error('MAIN_GOVERNANCE_CHANGED');
  const merges = gitCommand(['rev-list', '--merges', `${scopeStartingMain}..${scopeHead}`]);
  if (merges) throw new Error('DONOR_MERGE_COMMIT_PRESENT');
  return {
    command: 'starting-main ancestry, governance identity, and no-merge PR-head scope',
    checkout,
    starting_main: scopeStartingMain,
    governance_changed_file_count: 0,
    donor_merge_commit_count: 0
  };
}

function checkJson() {
  const files = trackedFiles(['*.json']);
  if (!files.length) throw new Error('NO_TRACKED_JSON_FILES');
  for (const file of files) JSON.parse(fs.readFileSync(path.join(repositoryRoot, file), 'utf8'));
  return { command: 'tracked JSON parse', file_count: files.length };
}

function checkYaml() {
  const files = trackedFiles(['*.yml', '*.yaml']);
  if (!files.length) throw new Error('NO_TRACKED_YAML_FILES');
  for (const file of files) {
    const document = YAML.parseDocument(fs.readFileSync(path.join(repositoryRoot, file), 'utf8'));
    if (document.errors.length) throw new Error('INVALID_TRACKED_YAML');
  }
  return { command: 'tracked YAML parse', file_count: files.length };
}

function checkAppsScriptInventory() {
  const names = fs.readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
  const gs = names.filter((name) => name.endsWith('.gs'));
  const expected = canonicalPayloadFileNames.slice().sort();
  const actual = gs.concat('appsscript.json').sort();
  if (actual.length !== expected.length ||
      actual.some((name, index) => name !== expected[index])) {
    throw new Error('APPS_SCRIPT_PAYLOAD_INVENTORY_INVALID');
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'appsscript.json'), 'utf8'));
  if (manifest.runtimeVersion !== 'V8' || !Array.isArray(manifest.oauthScopes)) {
    throw new Error('APPS_SCRIPT_MANIFEST_INVALID');
  }
  const inventory = actual.map((name) => ({
    name,
    sha256: sha256(fs.readFileSync(path.join(sourceRoot, name)))
  }));
  return {
    command: 'Apps Script payload inventory',
    gs_file_count: gs.length,
    payload_file_count: actual.length,
    payload_sha256: sha256(inventory.map((file) => `${file.name}:${file.sha256}`).join('\n'))
  };
}

function checkAppsScriptStatic() {
  return Object.assign({ command: 'validate_apps_script_v2.js' }, run(process.execPath, [
    path.join(toolsRoot, 'validate_apps_script_v2.js')
  ], { failureCode: 'APPS_SCRIPT_VALIDATOR_FAILED' }));
}

function checkNodeSuites() {
  const suites = fs.readdirSync(testsRoot).filter((name) => name.endsWith('_test.js')).sort();
  if (suites.length < 49) throw new Error('REGRESSION_SUITE_COUNT_BELOW_BASELINE');
  for (const suite of suites) {
    run(process.execPath, [path.join(testsRoot, suite)], {
      failureCode: `NODE_REGRESSION_SUITE_FAILED_${suite}`
    });
  }
  return { command: 'all current *_test.js suites', suite_count: suites.length };
}

function checkRelease() {
  const contract = readContract();
  const temporaryCheckout = fs.mkdtempSync(path.join(
    os.tmpdir(), 'work-os-release-verify-'
  ));
  const resolvedTemporaryCheckout = path.resolve(temporaryCheckout);
  const resolvedTemporaryRoot = `${path.resolve(os.tmpdir())}${path.sep}`;
  const safeTemporaryCheckout =
    resolvedTemporaryCheckout.startsWith(resolvedTemporaryRoot) &&
    path.basename(resolvedTemporaryCheckout).startsWith(
      'work-os-release-verify-'
    );
  if (!safeTemporaryCheckout) throw new Error('TEMP_CHECKOUT_PATH_REJECTED');
  try {
    const head = git(['rev-parse', 'HEAD']);
    run('git', [
      'clone', '--no-checkout', '--no-hardlinks',
      repositoryRoot, resolvedTemporaryCheckout
    ], {
      cwd: os.tmpdir(),
      failureCode: 'TEMP_LF_CLONE_FAILED'
    });
    run('git', [
      '-C', resolvedTemporaryCheckout, 'config', 'core.autocrlf', 'false'
    ], { failureCode: 'TEMP_LF_CONFIG_FAILED' });
    run('git', [
      '-C', resolvedTemporaryCheckout, 'checkout', '--detach', head
    ], { failureCode: 'TEMP_LF_CHECKOUT_FAILED' });
    const verificationModuleRoot = path.join(
      resolvedTemporaryCheckout, 'implementation', 'GoogleSpreadsheet'
    );
    const outputs = [
      runPowerShell('verify_v2_8_12_release.ps1', [
        '-SourceCommit', contract.source_commit
      ], verificationModuleRoot),
      runPowerShell('verify_v2_8_12_phase8c_release.ps1', [
        '-SourceCommit', contract.source_commit
      ], verificationModuleRoot)
    ];
    return {
      command: 'v2.8.12 Phase 8B/8C package verifiers in committed LF checkout',
      verifier_count: outputs.length,
      checkout: 'TEMP_LF_COMMITTED_HEAD',
      output_sha256: sha256(outputs.map((item) => item.output_sha256).join('\n'))
    };
  } finally {
    fs.rmSync(resolvedTemporaryCheckout, { recursive: true, force: true });
  }
}

function gitObjectExists(spec) {
  const result = spawnGit(['cat-file', '-e', spec]);
  return result.status === 0;
}

function checkReleaseLineage() {
  const contract = readContract();
  const releaseCommit = git(['log', '-1', '--format=%H', '--', 'CURRENT_CONTRACT.json']);
  if (!/^[0-9a-f]{40}$/.test(releaseCommit)) throw new Error('RELEASE_COMMIT_NOT_FOUND');
  if (git(['rev-parse', `${releaseCommit}^`]) !== contract.source_commit) {
    throw new Error('B12_NOT_DIRECT_CHILD_OF_A12');
  }
  if (!gitObjectExists(`${contract.source_commit}^{commit}`) ||
      !gitObjectExists(`${releaseCommit}^{commit}`)) {
    throw new Error('A12_OR_B12_COMMIT_MISSING');
  }
  const ancestor = spawnGit(['merge-base', '--is-ancestor', releaseCommit, 'HEAD']);
  if (ancestor.status !== 0) throw new Error('B12_NOT_ANCESTOR_OF_HEAD');
  if (gitObjectExists(`${contract.source_commit}:${phase8bPath}`) ||
      gitObjectExists(`${contract.source_commit}:${phase8cPath}`)) {
    throw new Error('A12_CONTAINS_GENERATED_RELEASE');
  }
  const changed = git(['diff-tree', '--no-commit-id', '--name-only', '-r', releaseCommit])
    .split(/\r?\n/).filter(Boolean).sort();
  const invalid = changed.filter((file) => file !== 'CURRENT_CONTRACT.json' &&
    file !== releaseReportPath && !file.startsWith(`${phase8bPath}/`) &&
    !file.startsWith(`${phase8cPath}/`));
  if (invalid.length) throw new Error('B12_SCOPE_INVALID');
  if (!changed.includes('CURRENT_CONTRACT.json') || !changed.includes(releaseReportPath) ||
      !changed.some((file) => file.startsWith(`${phase8bPath}/`)) ||
      !changed.some((file) => file.startsWith(`${phase8cPath}/`))) {
    throw new Error('B12_REQUIRED_SCOPE_MISSING');
  }
  return {
    command: 'A12/B12 ancestry, release-only B12 scope, and source-stage absence',
    source_commit: contract.source_commit,
    release_commit: releaseCommit,
    b12_changed_file_count: changed.length
  };
}

function contentHasSensitivePattern(content) {
  const pattern = /(?:sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{20,}|ya29\.[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|https?:\/\/[^/\s:@]+:[^@\s/]+@|https:\/\/(?:docs\.google\.com\/(?:spreadsheets|document)|drive\.google\.com|script\.google\.com|calendar\.google\.com)\/|(?:[A-Za-z]:\\(?:Users|Documents and Settings)\\|\/(?:home|Users)\/)[^\s]+)/i;
  return pattern.test(String(content));
}

function isForbiddenCredentialPath(file) {
  const segments = String(file).split('/');
  const base = segments[segments.length - 1];
  if (segments.some((segment) => [
    '.clasp-dev', '.clasp-pull-verify', '.clasp-work-0006',
    '.clasp-pull-verify-work-0006', '.work-0007-read-state',
    '.local-validation'
  ].includes(segment))) return true;
  if (['.clasp.json', '.clasprc', '.clasprc.json'].includes(base)) return true;
  if (/^(?:creds|credentials|client_secret)(?:[._-][A-Za-z0-9_-]+)?\.json$/i.test(base)) return true;
  if (/^\.env(?:\.[A-Za-z0-9_-]+)?$/i.test(base) && !/\.example$/i.test(base)) return true;
  return /\.(?:key|pem|p12|pfx)$/i.test(base);
}

function checkTrackedSecretsAndLocalArtifacts() {
  const files = trackedFiles(['.']);
  const actualScriptId = /"scriptId"\s*:\s*"(?!REPLACE_WITH)[^"]+"/i;
  const hits = [];
  for (const file of files) {
    if (isForbiddenCredentialPath(file)) hits.push({ file, kind: 'forbidden_path' });
    const content = fs.readFileSync(path.join(repositoryRoot, file));
    if (actualScriptId.test(content)) hits.push({ file, kind: 'tracked_script_id' });
  }
  const diff = git(['diff', '--no-ext-diff', '--unified=0', startingMain, 'HEAD', '--']);
  const added = diff.split(/\r?\n/).filter((line) =>
    line.startsWith('+') && !line.startsWith('+++')
  ).map((line) => line.slice(1)).join('\n');
  const scannedAdded = added.replaceAll(
    'https://user:password@example.invalid/?api_key=hidden',
    ''
  );
  if (contentHasSensitivePattern(scannedAdded)) {
    hits.push({ kind: 'sensitive_added_content' });
  }
  const activeTransfer = git(['ls-files', '--', `${phase8bPath.replace('/release/', '/transfer/')}*`]);
  if (activeTransfer) hits.push({ kind: 'active_transfer_present' });
  if (hits.length) throw new Error('TRACKED_SECRET_REAL_ID_LOCAL_STATE_OR_TRANSFER_FOUND');
  return {
    command: 'tracked secret/credential/real-ID/local-path/clasp-state/transfer scan',
    file_count: files.length,
    added_content_line_count: added ? added.split('\n').length : 0,
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
    'scope', 'json', 'yaml', 'apps-script', 'tests', 'release', 'lineage',
    'secret-scan'
  ].includes(parsed.section)) throw new Error('INVALID_SECTION');
  return parsed;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const sections = [
    ['worktree', checkCleanWorktree],
    ['generated-files', checkUnexpectedGeneratedFiles],
    ['scope', checkRepositoryScope],
    ['json', checkJson],
    ['yaml', checkYaml],
    ['apps-script-inventory', checkAppsScriptInventory],
    ['apps-script', checkAppsScriptStatic],
    ['tests', checkNodeSuites],
    ['release', checkRelease],
    ['lineage', checkReleaseLineage],
    ['secret-scan', checkTrackedSecretsAndLocalArtifacts]
  ];
  const selected = args.section ? sections.filter(([name]) =>
    name === args.section || (args.section === 'apps-script' && name === 'apps-script-inventory')
  ) : sections;
  const checks = selected.map(([name, body]) => Object.assign({ name }, statusFrom(body)));
  const failed = checks.filter((check) => check.status !== 'PASS');
  const report = {
    schema: 'WORK_OS_LOCAL_VERIFICATION_REPORT_V2',
    environment: 'LOCAL_NON_GOOGLE',
    mode: args.mode,
    git: { head: git(['rev-parse', 'HEAD']), branch: git(['branch', '--show-current']) },
    checks,
    passed: checks.length - failed.length,
    failed: failed.length,
    clasp_push: 'NOT_EXECUTED',
    clasp_pullback_parity: 'NOT_EXECUTED',
    runtime_dry_run: 'NOT_EXECUTED',
    live_google_workspace: 'NOT_EXECUTED',
    real_ai_provider: 'NOT_EXECUTED'
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
      schema: 'WORK_OS_LOCAL_VERIFICATION_REPORT_V2',
      environment: 'LOCAL_NON_GOOGLE',
      status: 'FAIL',
      safe_message: String(error && error.message || error).slice(0, 160)
    }, null, 2)}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  checkRepositoryScope,
  isAllowedScopeBranch,
  contentHasSensitivePattern,
  isForbiddenCredentialPath
};
