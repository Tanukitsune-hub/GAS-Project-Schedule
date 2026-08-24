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
const work0036MainMaterializedCommit =
  'ca70607cba047b340b8009a03448b8d8128dc68e';
const work0036MainParentCommit =
  '4c28231dc08dc89ee7a529cb0a6192325263c810';
const work0036ValidatedFinalHead =
  '1b4c6d9fbdb3bc8fea96f07c5b0ff456a4010a90';
const work0036MaterializedSourceCommit =
  '25e32a0a4a2c51a7d347534659299d5523b3477f';
const work0036MaterializedReleaseCommit =
  'bda4df2ec8a21b5e4ece64609e2e50b7be12dcb5';
const contractStartingMain = work0036MainMaterializedCommit;
const currentScopeStartingMain = work0036MainMaterializedCommit;
const work0037SourceParentRef =
  'a1fbad8c193a4be104e2064f753fe0a6d95091af';
const work0037ReleaseToolCorrectionParentRef =
  'b24e2297250d518dc634e270f5fe3236b871d091';
const work0037TemplatePathCorrectionParentRef =
  '4dfaa8b7ec90775b6feba0ea9b215440499b9a5b';
const work0037ValidationRepairParentRef =
  'bfc023a15e6ee0ceeda0fb9c8ca9198542ce9055';
const sourceParentRef = 'ea484cf3e7cef3b5e67d15eebd7b2aac03c1ec6a';
const a21SourceCommit = '6d039189e67515c1d67f1efc11d6303827293f5a';
const b21ReleaseCommit = 'f8a77afa3af9c0b68d77b71c9460f0da229052ca';
const inventoryContractCommit = 'd779bee2bdf7015a951bba16aff6b869d4d45aad';
const sourceCorrectionCommit = 'c470ff80ab39c5d0c70d83a79b933040b7456cf8';
const reviewFixParentRef =
  '41e0173ee81d36b786ca0d3ede8513c8c76ecd73';
const runtimePreparationFixParentRef =
  '90ad3a65155cc2f765de439f9b31e73707c0613d';
const liveAiSchemaFailureFixParentRef =
  'd330d94f9202d3a8bbb13cf2536fadb8cd031293';
const work0037AutomaticInboxParentRef =
  'c24ad73156031f9a273cfd1be1da48d31d5d2e7a';
const work0037Codex03ParentRef =
  'a829396106cea9f8b440c62e13bc7e33bdf28a19';
// Retained only for the historical Work 0035 materialization regression;
// current Work 0036 scope uses currentScopeStartingMain above.
const integrationStartingMain = 'ee2e4a06e21f1755d6c735ef8dbfb25a698ecf2e';
const canonicalBranch = 'main';
const materializedSourceCommit = '0c0304f6a63a08796c7ea788b4e3bc8de077aec8';
const materializedReleaseCommit = 'b321d83e29ba04557cbed87b75accc746144da6c';
const expectedBranch = 'codex/0037-personal-shadow-pilot';
const expectedRefBaseline =
  'a829396106cea9f8b440c62e13bc7e33bdf28a19';
const numberedWorkBranchPattern =
  /^codex\/\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const phase8bPath =
  'implementation/GoogleSpreadsheet/release/v2.8.24-prepilot';
const phase8cPath =
  'implementation/GoogleSpreadsheet/release/v2.8.24-prepilot-phase8c';
const historicalWork0036Phase8bPath =
  'implementation/GoogleSpreadsheet/release/v2.8.21-prepilot';
const historicalWork0036Phase8cPath =
  'implementation/GoogleSpreadsheet/release/v2.8.21-prepilot-phase8c';
const releaseReportPath =
  'docs/handoffs/0037-report.md';
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
    code_version: '2.8.24-prepilot',
    schema_version: '2.6',
    ai_schema_version: '2.0',
    migration_version: '3',
    highest_gate: 'READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT',
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
      runPowerShell('verify_v2_8_24_release.ps1', [
        '-SourceCommit', contract.source_commit
      ], verificationModuleRoot),
      runPowerShell('verify_v2_8_24_phase8c_release.ps1', [
        '-SourceCommit', contract.source_commit
      ], verificationModuleRoot)
    ];
    return {
      command: 'v2.8.24 Phase 8B/8C package verifiers in committed LF checkout',
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

function verifyWork0036SquashMaterialization(options = {}) {
  const gitCommand = options.git || git;
  const spawnGitCommand = options.spawnGit || spawnGit;
  const mainCommit = options.mainCommit || work0036MainMaterializedCommit;
  const validatedHead = options.validatedHead || work0036ValidatedFinalHead;
  const expectedParent = options.expectedParent || work0036MainParentCommit;
  const historicalReleaseCommit =
    options.historicalReleaseCommit || work0036MaterializedReleaseCommit;
  const mainParent = gitCommand(['rev-parse', `${mainCommit}^`]);
  if (mainParent !== expectedParent) {
    throw new Error('WORK_0036_SQUASH_MAIN_PARENT_INVALID');
  }
  const materializedTree = gitCommand([
    'rev-parse', `${mainCommit}^{tree}`
  ]);
  const validatedTree = gitCommand([
    'rev-parse', `${validatedHead}^{tree}`
  ]);
  if (materializedTree !== validatedTree) {
    throw new Error('WORK_0036_SQUASH_TREE_MISMATCH');
  }
  const historicalReleaseAncestry = spawnGitCommand([
    'merge-base', '--is-ancestor',
    historicalReleaseCommit, validatedHead
  ]);
  if (historicalReleaseAncestry.error ||
      historicalReleaseAncestry.status !== 0) {
    throw new Error('WORK_0036_SQUASH_HISTORICAL_RELEASE_INVALID');
  }
  return {
    materialized_main_commit: mainCommit,
    validated_final_head: validatedHead,
    main_parent: mainParent,
    exact_tree_equality: true,
    historical_release_commit: historicalReleaseCommit,
    historical_release_is_ancestor: true
  };
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
  if (gitObjectExists(`${a21SourceCommit}:${historicalWork0036Phase8bPath}`) ||
      gitObjectExists(`${a21SourceCommit}:${historicalWork0036Phase8cPath}`)) {
    throw new Error('A21_CONTAINS_GENERATED_RELEASE');
  }
  const b21Changed = git([
    'diff-tree', '--no-commit-id', '--name-only', '-r', b21ReleaseCommit
  ]).split(/\r?\n/).filter(Boolean).sort();
  const invalidB21 = b21Changed.filter((file) =>
    file !== 'CURRENT_CONTRACT.json' &&
    !file.startsWith(`${historicalWork0036Phase8bPath}/`) &&
    !file.startsWith(`${historicalWork0036Phase8cPath}/`)
  );
  if (invalidB21.length ||
      !b21Changed.includes('CURRENT_CONTRACT.json') ||
      !b21Changed.some((file) => file.startsWith(`${historicalWork0036Phase8bPath}/`)) ||
      !b21Changed.some((file) => file.startsWith(`${historicalWork0036Phase8cPath}/`))) {
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
  } else if (contract.source_commit === sourceCorrectionCommit) {
    if (
      sourceParent !== inventoryContractCommit ||
      sourceCorrectionChanged.length !== 1 ||
      sourceCorrectionChanged[0] !==
        'implementation/GoogleSpreadsheet/apps-script-v2/99_TestHarness.gs'
    ) {
      throw new Error('WORK_0036_SOURCE_CORRECTION_SCOPE_INVALID');
    }
  } else if (sourceParent === reviewFixParentRef) {
    const expectedReviewFixFiles = [
      'implementation/GoogleSpreadsheet/apps-script-v2/12_Triggers.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/Menu.gs',
      'implementation/GoogleSpreadsheet/tests/work_0036_personal_automation_qualification_test.js',
      'implementation/GoogleSpreadsheet/tools/local_validation_gate.js'
    ];
    if (
      JSON.stringify(sourceCorrectionChanged) !==
        JSON.stringify(expectedReviewFixFiles)
    ) {
      throw new Error('WORK_0036_REVIEW_FIX_SOURCE_SCOPE_INVALID');
    }
  } else if (sourceParent === runtimePreparationFixParentRef) {
    const expectedRuntimePreparationFixFiles = [
      'implementation/GoogleSpreadsheet/apps-script-v2/02_Setup.gs',
      'implementation/GoogleSpreadsheet/tests/work_0036_personal_automation_qualification_test.js',
      'implementation/GoogleSpreadsheet/tools/local_validation_gate.js'
    ];
    if (
      JSON.stringify(sourceCorrectionChanged) !==
        JSON.stringify(expectedRuntimePreparationFixFiles)
    ) {
      throw new Error('WORK_0036_RUNTIME_PREPARATION_FIX_SOURCE_SCOPE_INVALID');
    }
  } else if (sourceParent === liveAiSchemaFailureFixParentRef) {
    const expectedLiveAiSchemaFailureFixFiles = [
      '.gitignore',
      'implementation/GoogleSpreadsheet/apps-script-v2/00_Config.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/07_AiAdapter.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/13_LogAndDeadLetter.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/17_Utilities.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/18_Worker.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/20_GeminiProvider.gs',
      'implementation/GoogleSpreadsheet/tests/work_0028_gemini_provider_test.js',
      'implementation/GoogleSpreadsheet/tests/work_0032_gemini_runtime_diagnostics_test.js',
      'implementation/GoogleSpreadsheet/tests/work_0033_gemini_schema_compatibility_test.js',
      'implementation/GoogleSpreadsheet/tests/work_0036_personal_automation_qualification_test.js',
      'implementation/GoogleSpreadsheet/tools/local_validation_gate.js',
      'implementation/GoogleSpreadsheet/tools/work_0036_review_fix_placement.js'
    ];
    if (
      JSON.stringify(sourceCorrectionChanged) !==
        JSON.stringify(expectedLiveAiSchemaFailureFixFiles)
    ) {
      throw new Error(
        'WORK_0036_LIVE_AI_SCHEMA_FAILURE_FIX_SOURCE_SCOPE_INVALID'
      );
    }
  } else if (sourceParent === work0037Codex03ParentRef) {
    const expectedWork0037Codex03Files = [
      '.gitignore',
      'CURRENT_STATUS.md',
      'DECISIONS.md',
      'MASTER_PLAN.md',
      'PROJECT_CONTEXT.md',
      'README.md',
      'docs/R4_VERIFICATION_MATRIX.md',
      'docs/TASK_AUTHORITY_PROTOCOL.md',
      'docs/handoffs/0037-automatic-inbox-shadow-pilot-runbook.md',
      'implementation/GoogleSpreadsheet/apps-script-v2/00_Config.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/13_LogAndDeadLetter.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/README.md',
      'implementation/GoogleSpreadsheet/docs/V2_MANUAL_ACCEPTANCE_GUIDE.md',
      'implementation/GoogleSpreadsheet/tests/expected_test_inventory.json',
      'implementation/GoogleSpreadsheet/tests/work_0037_codex_03_operational_log_hardening_placement_test.js',
      'implementation/GoogleSpreadsheet/tests/work_0037_codex_03_operational_log_hardening_test.js',
      'implementation/GoogleSpreadsheet/tools/build_v2_8_24_phase8c_release.ps1',
      'implementation/GoogleSpreadsheet/tools/build_v2_8_24_release.ps1',
      'implementation/GoogleSpreadsheet/tools/local_validation_gate.js',
      'implementation/GoogleSpreadsheet/tools/v2_8_24/DEPLOYMENT_MANIFEST.template.md',
      'implementation/GoogleSpreadsheet/tools/v2_8_24/MANUAL_ACCEPTANCE_GUIDE.md',
      'implementation/GoogleSpreadsheet/tools/v2_8_24/SANDBOX_QUICKSTART.md',
      'implementation/GoogleSpreadsheet/tools/verify_v2_8_24_phase8c_release.ps1',
      'implementation/GoogleSpreadsheet/tools/verify_v2_8_24_release.ps1',
      'implementation/GoogleSpreadsheet/tools/work_0037_codex_03_operational_log_hardening_placement.js'
    ];
    if (
      JSON.stringify(sourceCorrectionChanged) !==
        JSON.stringify(expectedWork0037Codex03Files)
    ) {
      throw new Error('WORK_0037_CODEX_03_SOURCE_SCOPE_INVALID');
    }
  } else if (sourceParent === work0037SourceParentRef) {
    const expectedWork0037SourceFiles = [
      'CURRENT_STATUS.md',
      'DECISIONS.md',
      'MASTER_PLAN.md',
      'PROJECT_CONTEXT.md',
      'README.md',
      'docs/R4_VERIFICATION_MATRIX.md',
      'docs/TASK_AUTHORITY_PROTOCOL.md',
      'docs/handoffs/0037-personal-shadow-pilot-runbook.md',
      'docs/visualizations/GoogleWorkspace_v2_Workflow_Overview.html',
      'docs/visualizations/index.html',
      'implementation/GoogleSpreadsheet/apps-script-v2/00_Config.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/02_Setup.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/05_GmailGateway.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/12_Triggers.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/18_Worker.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/Menu.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/README.md',
      'implementation/GoogleSpreadsheet/docs/V2_MANUAL_ACCEPTANCE_GUIDE.md',
      'implementation/GoogleSpreadsheet/tests/canonical_document_consistency_test.js',
      'implementation/GoogleSpreadsheet/tests/expected_test_inventory.json',
      'implementation/GoogleSpreadsheet/tests/phase7_schema_extension_test.js',
      'implementation/GoogleSpreadsheet/tests/remediation_gmail_policy_test.js',
      'implementation/GoogleSpreadsheet/tests/remediation_runtime_dashboard_reliability_test.js',
      'implementation/GoogleSpreadsheet/tests/remediation_round3_provenance_test.js',
      'implementation/GoogleSpreadsheet/tests/remediation_round4_test.js',
      'implementation/GoogleSpreadsheet/tests/remediation_runtime_dashboard_reliability_test.js',
      'implementation/GoogleSpreadsheet/tests/work_0036_personal_automation_qualification_test.js',
      'implementation/GoogleSpreadsheet/tests/work_0037_lineage_materialization_test.js',
      'implementation/GoogleSpreadsheet/tests/work_0037_personal_shadow_pilot_test.js',
      'implementation/GoogleSpreadsheet/tools/build_v2_8_22_phase8c_release.ps1',
      'implementation/GoogleSpreadsheet/tools/build_v2_8_22_release.ps1',
      'implementation/GoogleSpreadsheet/tools/local_validation_gate.js',
      'implementation/GoogleSpreadsheet/tools/v2_8_22/DEPLOYMENT_MANIFEST.template.md',
      'implementation/GoogleSpreadsheet/tools/v2_8_22/MANUAL_ACCEPTANCE_GUIDE.md',
      'implementation/GoogleSpreadsheet/tools/v2_8_22/SANDBOX_QUICKSTART.md',
      'implementation/GoogleSpreadsheet/tools/verify_v2_8_22_phase8c_release.ps1',
      'implementation/GoogleSpreadsheet/tools/verify_v2_8_22_release.ps1',
      'implementation/GoogleSpreadsheet/visualizations/task_authority_protocol_v2_8_22.html'
    ];
    if (
      JSON.stringify(sourceCorrectionChanged) !==
        JSON.stringify(expectedWork0037SourceFiles)
    ) {
      throw new Error('WORK_0037_SOURCE_SCOPE_INVALID');
    }
  } else if (sourceParent === work0037ReleaseToolCorrectionParentRef) {
    const expectedWork0037ReleaseToolCorrectionFiles = [
      'implementation/GoogleSpreadsheet/tools/build_v2_8_22_phase8c_release.ps1',
      'implementation/GoogleSpreadsheet/tools/build_v2_8_22_release.ps1',
      'implementation/GoogleSpreadsheet/tools/local_validation_gate.js',
      'implementation/GoogleSpreadsheet/tools/verify_v2_8_22_phase8c_release.ps1',
      'implementation/GoogleSpreadsheet/tools/verify_v2_8_22_release.ps1'
    ];
    if (
      JSON.stringify(sourceCorrectionChanged) !==
        JSON.stringify(expectedWork0037ReleaseToolCorrectionFiles)
    ) {
      throw new Error('WORK_0037_RELEASE_TOOL_SCOPE_INVALID');
    }
  } else if (sourceParent === work0037TemplatePathCorrectionParentRef) {
    const expectedWork0037TemplatePathCorrectionFiles = [
      'implementation/GoogleSpreadsheet/tools/build_v2_8_22_release.ps1',
      'implementation/GoogleSpreadsheet/tools/local_validation_gate.js'
    ];
    if (
      JSON.stringify(sourceCorrectionChanged) !==
        JSON.stringify(expectedWork0037TemplatePathCorrectionFiles)
    ) {
      throw new Error('WORK_0037_TEMPLATE_PATH_SCOPE_INVALID');
    }
  } else if (sourceParent === work0037ValidationRepairParentRef) {
    const expectedWork0037ValidationRepairFiles = [
      'implementation/GoogleSpreadsheet/tests/work_0004_target_bootstrap_test.js',
      'implementation/GoogleSpreadsheet/tools/local_validation_gate.js'
    ];
    if (
      JSON.stringify(sourceCorrectionChanged) !==
        JSON.stringify(expectedWork0037ValidationRepairFiles)
    ) {
      throw new Error('WORK_0037_VALIDATION_REPAIR_SCOPE_INVALID');
    }
  } else if (sourceParent === work0037AutomaticInboxParentRef) {
    const expectedWork0037AutomaticInboxFiles = [
      '.gitignore',
      'CURRENT_STATUS.md',
      'DECISIONS.md',
      'MASTER_PLAN.md',
      'PROJECT_CONTEXT.md',
      'README.md',
      'docs/R4_VERIFICATION_MATRIX.md',
      'docs/TASK_AUTHORITY_PROTOCOL.md',
      'docs/visualizations/GoogleWorkspace_v2_Workflow_Overview.html',
      'docs/visualizations/index.html',
      'implementation/GoogleSpreadsheet/apps-script-v2/00_Config.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/02_Setup.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/05_GmailGateway.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/12_Triggers.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/18_Worker.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/Menu.gs',
      'implementation/GoogleSpreadsheet/apps-script-v2/README.md',
      'implementation/GoogleSpreadsheet/docs/V2_MANUAL_ACCEPTANCE_GUIDE.md',
      'implementation/GoogleSpreadsheet/tests/canonical_document_consistency_test.js',
      'implementation/GoogleSpreadsheet/tests/expected_test_inventory.json',
      'implementation/GoogleSpreadsheet/tests/phase3_local_test.js',
      'implementation/GoogleSpreadsheet/tests/phase4_independent_test.js',
      'implementation/GoogleSpreadsheet/tests/phase4_performance_test.js',
      'implementation/GoogleSpreadsheet/tests/phase6_worker_integration_test.js',
      'implementation/GoogleSpreadsheet/tests/phase7_local_test.js',
      'implementation/GoogleSpreadsheet/tests/phase7_schema_extension_test.js',
      'implementation/GoogleSpreadsheet/tests/remediation_gmail_policy_test.js',
      'implementation/GoogleSpreadsheet/tests/remediation_round3_provenance_test.js',
      'implementation/GoogleSpreadsheet/tests/remediation_round4_test.js',
      'implementation/GoogleSpreadsheet/tests/remediation_runtime_dashboard_reliability_test.js',
      'implementation/GoogleSpreadsheet/tests/work_0036_personal_automation_qualification_test.js',
      'implementation/GoogleSpreadsheet/tests/work_0037_automatic_inbox_shadow_pilot_placement_test.js',
      'implementation/GoogleSpreadsheet/tests/work_0037_automatic_inbox_shadow_pilot_test.js',
      'implementation/GoogleSpreadsheet/tests/work_0037_personal_shadow_pilot_test.js',
      'implementation/GoogleSpreadsheet/tools/build_v2_8_24_phase8c_release.ps1',
      'implementation/GoogleSpreadsheet/tools/build_v2_8_24_release.ps1',
      'implementation/GoogleSpreadsheet/tools/local_validation_gate.js',
      'implementation/GoogleSpreadsheet/tools/v2_8_24/DEPLOYMENT_MANIFEST.template.md',
      'implementation/GoogleSpreadsheet/tools/v2_8_24/MANUAL_ACCEPTANCE_GUIDE.md',
      'implementation/GoogleSpreadsheet/tools/v2_8_24/SANDBOX_QUICKSTART.md',
      'implementation/GoogleSpreadsheet/tools/verify_v2_8_24_phase8c_release.ps1',
      'implementation/GoogleSpreadsheet/tools/verify_v2_8_24_release.ps1',
      'implementation/GoogleSpreadsheet/tools/work_0037_automatic_inbox_shadow_pilot_placement.js',
      'implementation/GoogleSpreadsheet/visualizations/task_authority_protocol_v2_8_22.html'
    ];
    if (JSON.stringify(sourceCorrectionChanged) !==
        JSON.stringify(expectedWork0037AutomaticInboxFiles)) {
      throw new Error('WORK_0037_AUTOMATIC_INBOX_SOURCE_SCOPE_INVALID');
    }
  } else {
    throw new Error('WORK_0037_SOURCE_SCOPE_INVALID');
  }
  if (contract.code_version !== '2.8.24-prepilot' ||
      contract.schema_version !== '2.6' ||
      contract.ai_schema_version !== '2.0' ||
      contract.migration_version !== '3') {
    throw new Error('CURRENT_RELEASE_IDENTITY_INVALID');
  }
  const squashMaterialization = verifyWork0036SquashMaterialization();
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
  if (releaseCommit !== work0036MainMaterializedCommit) {
    const invalid = changed.filter((file) =>
      file !== 'CURRENT_CONTRACT.json' &&
      file !== 'implementation/GoogleSpreadsheet/tools/local_validation_gate.js' &&
      !file.startsWith(`${phase8bPath}/`) &&
      !file.startsWith(`${phase8cPath}/`)
    );
    if (invalid.length) throw new Error('CURRENT_RELEASE_SCOPE_INVALID');
    if (!changed.includes('CURRENT_CONTRACT.json') ||
        !changed.some((file) => file.startsWith(`${phase8bPath}/`)) ||
        !changed.some((file) => file.startsWith(`${phase8cPath}/`))) {
      throw new Error('CURRENT_RELEASE_REQUIRED_SCOPE_MISSING');
    }
  }
  const historicalReleasePaths = [
    'implementation/GoogleSpreadsheet/release/v2.8.20-prepilot',
    'implementation/GoogleSpreadsheet/release/v2.8.20-prepilot-phase8c',
    'implementation/GoogleSpreadsheet/release/v2.8.21-prepilot',
    'implementation/GoogleSpreadsheet/release/v2.8.21-prepilot-phase8c',
    'implementation/GoogleSpreadsheet/release/v2.8.22-prepilot',
    'implementation/GoogleSpreadsheet/release/v2.8.22-prepilot-phase8c',
    'implementation/GoogleSpreadsheet/release/v2.8.23-prepilot',
    'implementation/GoogleSpreadsheet/release/v2.8.23-prepilot-phase8c'
  ];
  if (historicalReleasePaths.slice(0, 4).some((releasePath) =>
    !gitObjectExists(`${currentScopeStartingMain}:${releasePath}`)) ||
      historicalReleasePaths.slice(4).some((releasePath) =>
        !gitObjectExists(`${expectedRefBaseline}:${releasePath}`))) {
    throw new Error('HISTORICAL_2_8_20_RELEASE_MISSING');
  }
  if (git([
    'diff', '--name-only', currentScopeStartingMain, 'HEAD', '--'
  ].concat(historicalReleasePaths.slice(0, 4))).trim()) {
    throw new Error('HISTORICAL_2_8_20_RELEASE_CHANGED');
  }
  if (git([
    'diff', '--name-only', expectedRefBaseline, 'HEAD', '--'
  ].concat(historicalReleasePaths.slice(4))).trim()) {
    throw new Error('HISTORICAL_2_8_22_RELEASE_CHANGED');
  }
  return {
    command: 'Work 0036 squash proof, bounded Work 0037 source scope, current release-only scope, and historical 2.8.20/2.8.21/2.8.22 preservation',
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
    historical_release_changed_file_count: 0,
    squash_materialization: squashMaterialization
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
    '.clasp-work-0037-automatic-inbox-shadow-pilot',
    '.clasp-pull-verify-work-0037-automatic-inbox-shadow-pilot',
    '.clasp-work-0037-codex-03-operational-log-hardening',
    '.clasp-pull-verify-work-0037-codex-03-operational-log-hardening',
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
  verifyWork0036SquashMaterialization,
  readTestInventory,
  compareTestInventory,
  testInventoryFingerprint,
  contentHasSensitivePattern,
  isForbiddenCredentialPath
};
