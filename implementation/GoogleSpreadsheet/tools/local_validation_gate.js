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
const contractStartingMain = '4c28231dc08dc89ee7a529cb0a6192325263c810';
const currentScopeStartingMain = contractStartingMain;
const sourceParentRef = 'ea484cf3e7cef3b5e67d15eebd7b2aac03c1ec6a';
const a21SourceCommit = '6d039189e67515c1d67f1efc11d6303827293f5a';
const b21ReleaseCommit = 'f8a77afa3af9c0b68d77b71c9460f0da229052ca';
const inventoryContractCommit = 'd779bee2bdf7015a951bba16aff6b869d4d45aad';
// Retained only for the historical Work 0035 materialization regression;
// current Work 0036 scope uses currentScopeStartingMain above.
const integrationStartingMain = 'ee2e4a06e21f1755d6c735ef8dbfb25a698ecf2e';
const canonicalBranch = 'main';
const materializedSourceCommit = '0c0304f6a63a08796c7ea788b4e3bc8de077aec8';
const materializedReleaseCommit = 'b321d83e29ba04557cbed87b75accc746144da6c';
const expectedBranch = 'codex/0036-personal-automation-qualification';
const numberedWorkBranchPattern =
  /^codex\/\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const phase8bPath =
  'implementation/GoogleSpreadsheet/release/v2.8.21-prepilot';
const phase8cPath =
  'implementation/GoogleSpreadsheet/release/v2.8.21-prepilot-phase8c';
const releaseReportPath =
  'docs/handoffs/0036-report.md';
const testInventoryPath = path.join(
  testsRoot,
  'expected_test_inventory.json'
);

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
  return {
    output_sha256: sha256(`${result.stdout || ''}\n${result.stderr || ''}`)
  };
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
    return Object.assign({
      status: 'PASS',
      duration_ms: Date.now() - started
    }, details);
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
    starting_main: contractStartingMain,
    branch: expectedBranch,
    code_version: '2.8.21-prepilot',
    schema_version: '2.6',
    ai_schema_version: '2.0',
    migration_version: '3',
    highest_gate: 'READY_FOR_USER_PERSONAL_AUTOMATION_E2E',
    automation: false,
    active_transfer: null,
    active_deployment: null,
    release_commit: 'SELF'
  };
  for (const [key, value] of Object.entries(expected)) {
    if (contract[key] !== value) {
      throw new Error(`CURRENT_CONTRACT_${key.toUpperCase()}_INVALID`);
    }
  }
  if (!/^[0-9a-f]{40}$/.test(String(contract.source_commit || ''))) {
    throw new Error('CURRENT_CONTRACT_SOURCE_COMMIT_INVALID');
  }
  if (!contract.phase8b || contract.phase8b.path !== phase8bPath ||
      contract.phase8b.test_mode !== true ||
      contract.phase8b.test_harness !== true) {
    throw new Error('CURRENT_CONTRACT_PHASE8B_INVALID');
  }
  if (!contract.phase8c || contract.phase8c.path !== phase8cPath ||
      contract.phase8c.test_mode !== false ||
      contract.phase8c.test_harness !== false ||
      contract.phase8c.transform !== 'TEST_MODE_AND_APPROVED_PROVIDER_READINESS_FLAGS') {
    throw new Error('CURRENT_CONTRACT_PHASE8C_INVALID');
  }
  return contract;
}

function checkCleanWorktree() {
  const status = git(['status', '--porcelain=v1', '--untracked-files=normal']);
  if (status) throw new Error('WORKTREE_NOT_CLEAN');
  return {
    command: 'git status --porcelain=v1',
    changed_file_count: 0
  };
}

function checkUnexpectedGeneratedFiles() {
  const untracked = git(['ls-files', '--others', '--exclude-standard']);
  if (untracked) throw new Error('UNTRACKED_GENERATED_FILE_PRESENT');
  return {
    command: 'git ls-files --others --exclude-standard',
    untracked_file_count: 0
  };
}

function isAllowedScopeBranch(branch) {
  return branch === canonicalBranch ||
    branch === expectedBranch ||
    numberedWorkBranchPattern.test(branch);
}

function checkRepositoryScope(options = {}) {
  const gitCommand = options.git || git;
  const spawnGitCommand = options.spawnGit || spawnGit;
  const scopeStartingMain = options.startingMain || currentScopeStartingMain;
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
    if (parents.length !== 2) {
      throw new Error('PULL_REQUEST_MERGE_REF_INVALID');
    }
    const baseAncestry = spawnGitCommand([
      'merge-base', '--is-ancestor', scopeStartingMain, parents[0]
    ]);
    if (baseAncestry.status !== 0) {
      throw new Error('PULL_REQUEST_MERGE_BASE_INVALID');
    }
    scopeHead = parents[1];
    checkout = 'GITHUB_PULL_REQUEST_MERGE';
  } else if (!branch) {
    const parents = gitCommand(['show', '-s', '--format=%P', 'HEAD'])
      .split(/\s+/).filter(Boolean);
    if (parents.length > 1) throw new Error('UNEXPECTED_DETACHED_MERGE');
  }
  const ancestry = spawnGitCommand([
    'merge-base', '--is-ancestor', scopeStartingMain, scopeHead
  ]);
  if (ancestry.status !== 0) throw new Error('STARTING_MAIN_NOT_ANCESTOR');
  const governance = gitCommand([
    'diff', '--name-only', scopeStartingMain, scopeHead,
    '--', 'AGENTS.md', '.codex'
  ]);
  if (governance) throw new Error('MAIN_GOVERNANCE_CHANGED');
  const merges = gitCommand([
    'rev-list', '--merges', `${scopeStartingMain}..${scopeHead}`
  ]);
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
  const expected = canonicalPayloadFileNames.slice().sort();
  const actual = gs.concat('appsscript.json').sort();
  if (actual.length !== expected.length ||
      actual.some((name, index) => name !== expected[index])) {
    throw new Error('APPS_SCRIPT_PAYLOAD_INVENTORY_INVALID');
  }
  const manifest = JSON.parse(
    fs.readFileSync(path.join(sourceRoot, 'appsscript.json'), 'utf8')
  );
  if (manifest.runtimeVersion !== 'V8' ||
      !Array.isArray(manifest.oauthScopes)) {
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
    payload_sha256: sha256(
      inventory.map((file) => `${file.name}:${file.sha256}`).join('\n')
    )
  };
}

function checkAppsScriptStatic() {
  return Object.assign({
    command: 'validate_apps_script_v2.js'
  }, run(process.execPath, [
    path.join(toolsRoot, 'validate_apps_script_v2.js')
  ], {
    failureCode: 'APPS_SCRIPT_VALIDATOR_FAILED'
  }));
}

function normalizeTestInventory(value) {
  var names = Array.isArray(value)
    ? value
    : value && Array.isArray(value.suites)
      ? value.suites
      : null;
  if (!names || names.some(function (name) {
    return typeof name !== 'string' || !name.endsWith('_test.js');
  })) {
    throw new Error('REGRESSION_SUITE_INVENTORY_INVALID');
  }
  var sorted = names.slice().sort();
  if (sorted.some(function (name, index) {
    return index > 0 && sorted[index - 1] === name;
  })) {
    throw new Error('REGRESSION_SUITE_INVENTORY_DUPLICATE');
  }
  return sorted;
}

function testInventoryFingerprint(names) {
  return sha256(normalizeTestInventory(names).join('\n'));
}

function readTestInventory(file = testInventoryPath) {
  var value;
  try {
    value = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error('REGRESSION_SUITE_INVENTORY_MISSING');
  }
  var names = normalizeTestInventory(value);
  if (value.schema !== 'WORK_OS_TEST_INVENTORY_V1' ||
      value.suite_count !== names.length ||
      value.fingerprint !== testInventoryFingerprint(names)) {
    throw new Error('REGRESSION_SUITE_INVENTORY_FINGERPRINT_INVALID');
  }
  return { schema: value.schema, suite_count: names.length, suites: names,
    fingerprint: value.fingerprint };
}

function compareTestInventory(actual, expected) {
  var actualNames = normalizeTestInventory(actual);
  var expectedNames = normalizeTestInventory(expected);
  var expectedSet = new Set(expectedNames);
  var actualSet = new Set(actualNames);
  var missing = expectedNames.filter(function (name) {
    return !actualSet.has(name);
  });
  var extra = actualNames.filter(function (name) {
    return !expectedSet.has(name);
  });
  return {
    pass: missing.length === 0 && extra.length === 0,
    missing: missing,
    extra: extra,
    actual_count: actualNames.length,
    expected_count: expectedNames.length,
    actual_fingerprint: testInventoryFingerprint(actualNames),
    expected_fingerprint: testInventoryFingerprint(expectedNames)
  };
}

function checkNodeSuites() {
  const inventory = readTestInventory();
  const actualSuites = fs.readdirSync(testsRoot)
    .filter((name) => name.endsWith('_test.js'))
    .sort();
  const comparison = compareTestInventory(actualSuites, inventory.suites);
  if (!comparison.pass) {
    throw new Error('REGRESSION_SUITE_INVENTORY_MISMATCH');
  }
  for (const suite of inventory.suites) {
    run(process.execPath, [path.join(testsRoot, suite)], {
      failureCode: `NODE_REGRESSION_SUITE_FAILED_${suite}`
    });
  }
  return {
    command: 'all current *_test.js suites',
    suite_count: inventory.suite_count,
    inventory_fingerprint: inventory.fingerprint,
    missing_suite_count: comparison.missing.length,
    extra_suite_count: comparison.extra.length
  };
}

function checkRelease() {
  const contract = readContract();
  const temporaryCheckout = fs.mkdtempSync(
    path.join(os.tmpdir(), 'work-os-release-verify-')
  );
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
      '-C', resolvedTemporaryCheckout,
      'config', 'core.autocrlf', 'false'
    ], {
      failureCode: 'TEMP_LF_CONFIG_FAILED'
    });
    run('git', [
      '-C', resolvedTemporaryCheckout,
      'checkout', '--detach', head
    ], {
      failureCode: 'TEMP_LF_CHECKOUT_FAILED'
    });
    const verificationModuleRoot = path.join(
      resolvedTemporaryCheckout,
      'implementation', 'GoogleSpreadsheet'
    );
    const outputs = [
      runPowerShell('verify_v2_8_21_release.ps1', [
        '-SourceCommit', contract.source_commit
      ], verificationModuleRoot),
      runPowerShell('verify_v2_8_21_phase8c_release.ps1', [
        '-SourceCommit', contract.source_commit
      ], verificationModuleRoot)
    ];
    return {
      command: 'v2.8.21 Phase 8B/8C package verifiers in committed LF checkout',
      verifier_count: outputs.length,
      checkout: 'TEMP_LF_COMMITTED_HEAD',
      output_sha256: sha256(
        outputs.map((item) => item.output_sha256).join('\n')
      )
    };
  } finally {
    fs.rmSync(resolvedTemporaryCheckout, {
      recursive: true,
      force: true
    });
  }
}

function gitObjectExists(spec) {
  const result = spawnGit(['cat-file', '-e', spec]);
  return result.status === 0;
}

function isCleanTreeMaterialization(options = {}) {
  const spawnGitCommand = options.spawnGit || spawnGit;
  const releaseAncestry = spawnGitCommand([
    'merge-base', '--is-ancestor', materializedReleaseCommit, 'HEAD'
  ]);
  if (releaseAncestry.error ||
      (releaseAncestry.status !== 0 && releaseAncestry.status !== 1)) {
    throw new Error('HISTORICAL_RELEASE_ANCESTRY_UNAVAILABLE');
  }
  if (releaseAncestry.status === 0) return false;

  const integrationAncestry = spawnGitCommand([
    'merge-base', '--is-ancestor', integrationStartingMain, 'HEAD'
  ]);
  if (integrationAncestry.error ||
      (integrationAncestry.status !== 0 && integrationAncestry.status !== 1)) {
    throw new Error('CLEAN_INTEGRATION_ANCESTRY_UNAVAILABLE');
  }
  return integrationAncestry.status === 0;
}

function checkReleaseLineage() {
  const contract = readContract();
  if (git(['rev-parse', `${a21SourceCommit}^`]) !== sourceParentRef) {
    throw new Error('A21_NOT_DIRECT_CHILD_OF_WORK_0036_REF');
  }
  if (git(['rev-parse', `${b21ReleaseCommit}^`]) !== a21SourceCommit) {
    throw new Error('B21_NOT_DIRECT_CHILD_OF_A21');
  }
  if (gitObjectExists(`${a21SourceCommit}:${phase8bPath}`) ||
      gitObjectExists(`${a21SourceCommit}:${phase8cPath}`)) {
    throw new Error('A21_CONTAINS_GENERATED_RELEASE');
  }
  const b21Changed = git([
    'diff-tree', '--no-commit-id', '--name-only', '-r', b21ReleaseCommit
  ]).split(/\r?\n/).filter(Boolean).sort();
  const invalidB21 = b21Changed.filter((file) =>
    file !== 'CURRENT_CONTRACT.json' &&
    !file.startsWith(`${phase8bPath}/`) &&
    !file.startsWith(`${phase8cPath}/`)
  );
  if (invalidB21.length ||
      !b21Changed.includes('CURRENT_CONTRACT.json') ||
      !b21Changed.some((file) => file.startsWith(`${phase8bPath}/`)) ||
      !b21Changed.some((file) => file.startsWith(`${phase8cPath}/`))) {
    throw new Error('B21_SCOPE_INVALID');
  }
  const releaseCommit = git([
    'log', '-1', '--format=%H', '--', 'CURRENT_CONTRACT.json'
  ]);
  if (!/^[0-9a-f]{40}$/.test(releaseCommit)) {
    throw new Error('RELEASE_COMMIT_NOT_FOUND');
  }
  const sourceParent = git(['rev-parse', `${contract.source_commit}^`]);
  const sourceCorrectionChanged = git([
    'diff-tree', '--no-commit-id', '--name-only', '-r', contract.source_commit
  ]).split(/\r?\n/).filter(Boolean).sort();
  if (contract.source_commit === a21SourceCommit) {
    if (sourceParent !== sourceParentRef) {
      throw new Error('A21_NOT_DIRECT_CHILD_OF_WORK_0036_REF');
    }
  } else if (
    sourceParent !== inventoryContractCommit ||
    sourceCorrectionChanged.length !== 1 ||
    sourceCorrectionChanged[0] !==
      'implementation/GoogleSpreadsheet/apps-script-v2/99_TestHarness.gs'
  ) {
    throw new Error('WORK_0036_SOURCE_CORRECTION_SCOPE_INVALID');
  }
  if (git(['rev-parse', `${releaseCommit}^`]) !== contract.source_commit) {
    throw new Error('CURRENT_RELEASE_NOT_DIRECT_CHILD_OF_SOURCE');
  }
  if (!gitObjectExists(`${a21SourceCommit}^{commit}`) ||
      !gitObjectExists(`${b21ReleaseCommit}^{commit}`) ||
      !gitObjectExists(`${contract.source_commit}^{commit}`) ||
      !gitObjectExists(`${releaseCommit}^{commit}`)) {
    throw new Error('A21_OR_B21_COMMIT_MISSING');
  }
  const ancestor = spawnGit([
    'merge-base', '--is-ancestor', releaseCommit, 'HEAD'
  ]);
  if (ancestor.status !== 0) throw new Error('B21_NOT_ANCESTOR_OF_HEAD');
  const changed = git([
    'diff-tree', '--no-commit-id', '--name-only', '-r', releaseCommit
  ]).split(/\r?\n/).filter(Boolean).sort();
  const invalid = changed.filter((file) =>
    file !== 'CURRENT_CONTRACT.json' &&
    !file.startsWith(`${phase8bPath}/`) &&
    !file.startsWith(`${phase8cPath}/`)
  );
  if (invalid.length) throw new Error('CURRENT_RELEASE_SCOPE_INVALID');
  if (!changed.includes('CURRENT_CONTRACT.json') ||
      !changed.some((file) => file.startsWith(`${phase8bPath}/`)) ||
      !changed.some((file) => file.startsWith(`${phase8cPath}/`))) {
    throw new Error('CURRENT_RELEASE_REQUIRED_SCOPE_MISSING');
  }
  const historicalReleasePaths = [
    'implementation/GoogleSpreadsheet/release/v2.8.20-prepilot',
    'implementation/GoogleSpreadsheet/release/v2.8.20-prepilot-phase8c'
  ];
  if (historicalReleasePaths.some((releasePath) =>
    !gitObjectExists(`${currentScopeStartingMain}:${releasePath}`))) {
    throw new Error('HISTORICAL_2_8_20_RELEASE_MISSING');
  }
  if (git([
    'diff', '--name-only', currentScopeStartingMain, 'HEAD', '--'
  ].concat(historicalReleasePaths)).trim()) {
    throw new Error('HISTORICAL_2_8_20_RELEASE_CHANGED');
  }
  return {
    command: 'A21/B21 direct ancestry, bounded Work 0036 source correction, current release-only scope, and historical 2.8.20 preservation',
    a21_source_commit: a21SourceCommit,
    b21_release_commit: b21ReleaseCommit,
    source_correction_commit: contract.source_commit === a21SourceCommit
      ? null
      : contract.source_commit,
    source_parent_ref: sourceParentRef,
    source_commit: contract.source_commit,
    release_commit: releaseCommit,
    b21_changed_file_count: b21Changed.length,
    current_release_changed_file_count: changed.length,
    historical_release_changed_file_count: 0
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
    '.clasp-dev', '.clasp-pull-verify',
    '.clasp-work-0006', '.clasp-pull-verify-work-0006',
    '.work-0007-read-state',
    '.clasp-work-0010', '.clasp-pull-verify-work-0010',
    '.clasp-work-0016', '.clasp-pull-verify-work-0016',
    '.clasp-work-0018', '.clasp-pull-verify-work-0018',
    '.clasp-work-0028', '.clasp-pull-verify-work-0028',
    '.clasp-work-0029', '.clasp-pull-verify-work-0029',
    '.clasp-work-0030', '.clasp-pull-verify-work-0030',
    '.clasp-work-0031', '.clasp-pull-verify-work-0031',
    '.clasp-work-0032', '.clasp-pull-verify-work-0032',
    '.clasp-work-0033', '.clasp-pull-verify-work-0033',
    '.local-validation'
  ].includes(segment))) return true;
  if (['.clasp.json', '.clasprc', '.clasprc.json'].includes(base)) {
    return true;
  }
  if (/^(?:creds|credentials|client_secret)(?:[._-][A-Za-z0-9_-]+)?\.json$/i
    .test(base)) return true;
  if (/^\.env(?:\.[A-Za-z0-9_-]+)?$/i.test(base) &&
      !/\.example$/i.test(base)) return true;
  return /\.(?:key|pem|p12|pfx)$/i.test(base);
}

function checkTrackedSecretsAndLocalArtifacts() {
  const files = trackedFiles(['.']);
  const actualScriptId = /"scriptId"\s*:\s*"(?!REPLACE_WITH)[^"]+"/i;
  const hits = [];
  for (const file of files) {
    if (isForbiddenCredentialPath(file)) {
      hits.push({ file, kind: 'forbidden_path' });
    }
    const content = fs.readFileSync(path.join(repositoryRoot, file));
    if (actualScriptId.test(content)) {
      hits.push({ file, kind: 'tracked_script_id' });
    }
  }
  const diff = git([
    'diff', '--no-ext-diff', '--unified=0',
    currentScopeStartingMain, 'HEAD', '--'
  ]);
  const added = diff.split(/\r?\n/)
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1))
    .join('\n');
  const scannedAdded = added.replaceAll(
    'https://user:password@example.invalid/?api_key=hidden',
    ''
  );
  if (contentHasSensitivePattern(scannedAdded)) {
    hits.push({ kind: 'sensitive_added_content' });
  }
  const activeTransfer = git([
    'ls-files', '--', `${phase8bPath.replace('/release/', '/transfer/')}*`
  ]);
  if (activeTransfer) hits.push({ kind: 'active_transfer_present' });
  if (hits.length) {
    throw new Error('TRACKED_SECRET_REAL_ID_LOCAL_STATE_OR_TRANSFER_FOUND');
  }
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
  if (!['local', 'ci'].includes(parsed.mode)) {
    throw new Error('INVALID_MODE');
  }
  if (parsed.section && ![
    'scope', 'json', 'yaml', 'apps-script', 'tests', 'release', 'lineage',
    'secret-scan'
  ].includes(parsed.section)) {
    throw new Error('INVALID_SECTION');
  }
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
  const selected = args.section
    ? sections.filter(([name]) =>
      name === args.section ||
      (args.section === 'apps-script' && name === 'apps-script-inventory')
    )
    : sections;
  const checks = selected.map(([name, body]) =>
    Object.assign({ name }, statusFrom(body))
  );
  const failed = checks.filter((check) => check.status !== 'PASS');
  const report = {
    schema: 'WORK_OS_LOCAL_VERIFICATION_REPORT_V2',
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
    runtime_dry_run: 'NOT_EXECUTED',
    live_google_workspace: 'NOT_EXECUTED',
    real_ai_provider: 'NOT_EXECUTED'
  };
  fs.mkdirSync(reportRoot, { recursive: true });
  fs.writeFileSync(
    path.join(reportRoot, 'local-validation-report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
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
  isCleanTreeMaterialization,
  readTestInventory,
  compareTestInventory,
  testInventoryFingerprint,
  contentHasSensitivePattern,
  isForbiddenCredentialPath
};
