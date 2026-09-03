'use strict';

/**
 * Complete non-Google Work 0039 validation gate.
 *
 * The gate is deliberately separate from the historical Work 0037 gate so
 * that older release/lineage rules remain executable as historical evidence.
 * It validates only local files, synthetic fixtures, Git metadata, and
 * deterministic builders.  No credential, Provider, Google, OAuth, clasp, or
 * deployment operation is performed.
 */
const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const {
  contentHasSensitivePattern,
  isForbiddenCredentialPath,
  readTestInventory,
  compareTestInventory
} = require('./local_validation_gate');
const releaseVerifier = require('./verify_work_0039_release');

const moduleRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(moduleRoot, '..', '..');
const sourceRoot = path.join(moduleRoot, 'apps-script-v2');
const testsRoot = path.join(moduleRoot, 'tests');
const toolsRoot = path.join(moduleRoot, 'tools');
const reportRoot = path.join(moduleRoot, '.local-validation');
const reportPath = path.join(reportRoot, 'local-validation-report.json');
const contractPath = path.join(repositoryRoot, 'CURRENT_CONTRACT.json');
const expectedBranch = 'codex/0039-openai-provider-selection';
const startingMain = '3e302c2bc1e13c9482b208b754bc893e9a73fc70';
const acceptedProductHead = '959690d0863b268dda4f707ef213c5c353653f54';
const acceptedSourceCommit = '7c8b4c7709ab00b4d315f910b9271f3c4945b702';
const gate = 'READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT';
const candidateImmutablePaths = Object.freeze([
  'CURRENT_CONTRACT.json',
  'implementation/GoogleSpreadsheet/apps-script-v2',
  'implementation/GoogleSpreadsheet/release/v2.8.26-prepilot',
  'implementation/GoogleSpreadsheet/release/v2.8.26-prepilot-phase8c',
  'implementation/GoogleSpreadsheet/release/work-0039-single-file-company-install',
  'implementation/GoogleSpreadsheet/tools/build_work_0039_release.js',
  'implementation/GoogleSpreadsheet/tools/verify_work_0039_release.js',
  'implementation/GoogleSpreadsheet/tools/v2_8_26'
]);
const integrationPreservedPaths = Object.freeze(
  candidateImmutablePaths.concat(['CURRENT_STATUS.md'])
);
const work0038ArchiveRefs = Object.freeze({
  'refs/remotes/origin/archive/0038-gemini-source-baseline':
    '272612831c4a46e45fdf166c65e3075ffee7dfef',
  'refs/remotes/origin/archive/0038-gemini-company-delivery':
    'eccf27ec9f6b6fd023eca7b69279cc88741ecd9b'
});
const work0038FrozenPaths = Object.freeze([
  'implementation/GoogleSpreadsheet/release/v2.8.25-prepilot',
  'implementation/GoogleSpreadsheet/release/v2.8.25-prepilot-phase8c',
  'implementation/GoogleSpreadsheet/release/work-0038-single-file-company-install'
]);
const work0038BundleBlobExpectations = Object.freeze({
  'implementation/GoogleSpreadsheet/release/work-0038-single-file-company-install/Code.gs':
    '3ee8b512a0ef63caabee6c9082624889e7fc184b',
  'implementation/GoogleSpreadsheet/release/work-0038-single-file-company-install/appsscript.json':
    '86c8cb4e82aa8bcdfb09466fb3f23594c2342116',
  'implementation/GoogleSpreadsheet/release/work-0038-single-file-company-install/BUNDLE_PROVENANCE.json':
    'f3927bd92e671235c75dee0263af70901863f4cb',
  'implementation/GoogleSpreadsheet/release/work-0038-single-file-company-install/CHECKSUMS.sha256':
    'f2d7300ecf6b66919054794110a03867a6645441'
});

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

function git(args, failureCode) {
  const result = spawnGit(args);
  if (result.error || result.status !== 0) {
    throw new Error(failureCode || 'GIT_COMMAND_FAILED');
  }
  return String(result.stdout || '').trim();
}

function run(command, args, options = {}) {
  const result = childProcess.spawnSync(command, args, {
    cwd: options.cwd || moduleRoot,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
    env: Object.assign({}, process.env, options.env || {})
  });
  if (result.error || result.status !== 0) {
    throw new Error(options.failureCode || 'LOCAL_COMMAND_FAILED');
  }
  return {
    stdout_sha256: sha256(String(result.stdout || '')),
    stderr_sha256: sha256(String(result.stderr || ''))
  };
}

function statusFrom(fn) {
  const started = Date.now();
  try {
    return Object.assign({
      status: 'PASS',
      duration_ms: Date.now() - started
    }, fn() || {});
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
  const value = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  if (value.schema !== 'WORK_OS_CURRENT_CONTRACT_V1' ||
      value.repository !== 'Tanukitsune-hub/GAS-Project-Schedule' ||
      value.starting_main !== startingMain ||
      value.branch !== expectedBranch ||
      value.code_version !== '2.8.26-prepilot' ||
      value.schema_version !== '2.6' ||
      value.ai_schema_version !== '2.0' ||
      value.migration_version !== '3' ||
      value.highest_gate !== gate || value.automation !== false ||
      value.active_transfer !== null || value.active_deployment !== null ||
      value.release_commit !== 'SELF' ||
      value.source_commit !== acceptedSourceCommit ||
      !value.phase8b || value.phase8b.path !==
        'implementation/GoogleSpreadsheet/release/v2.8.26-prepilot' ||
      value.phase8b.test_mode !== true || value.phase8b.test_harness !== true ||
      value.phase8b.payload_files !== 26 ||
      value.phase8b.package_files !== 30 ||
      !value.phase8c || value.phase8c.path !==
        'implementation/GoogleSpreadsheet/release/v2.8.26-prepilot-phase8c' ||
      value.phase8c.test_mode !== false || value.phase8c.test_harness !== false ||
      value.phase8c.payload_files !== 25 || value.phase8c.package_files !== 29 ||
      value.phase8c.transform !==
        'TEST_MODE_AND_APPROVED_PROVIDER_READINESS_FLAGS' ||
      !value.bundle || value.bundle.path !==
        'implementation/GoogleSpreadsheet/release/work-0039-single-file-company-install' ||
      value.bundle.paste_count !== 2 ||
      JSON.stringify(value.bundle.paste_order) !==
        JSON.stringify(['Code.gs', 'appsscript.json']) ||
      value.bundle.txt_transport !== 'BYTE_IDENTICAL' ||
      !value.work_0039 || value.work_0039.active_provider_property !==
        'WORK_OS_V2_ACTIVE_AI_PROVIDER' ||
      value.work_0039.openai_model !== 'gpt-5.6-luna' ||
      value.work_0039.openai_data_governance_status !==
        'NOT_APPROVED_OR_UNKNOWN' ||
      value.work_0039.live_runtime !== 'NOT_EXECUTED') {
    throw new Error('CURRENT_CONTRACT_WORK_0039_INVALID');
  }
  return value;
}

function checkWorktree() {
  const status = git(['status', '--porcelain=v1', '--untracked-files=normal']);
  if (status) throw new Error('WORKTREE_NOT_CLEAN');
  return { command: 'git status --porcelain=v1', changed_file_count: 0 };
}

function checkGeneratedFiles() {
  const untracked = git(['ls-files', '--others', '--exclude-standard']);
  if (untracked) throw new Error('UNTRACKED_GENERATED_FILE_PRESENT');
  return { command: 'git ls-files --others --exclude-standard', untracked_file_count: 0 };
}

function checkScope(options = {}) {
  const gitCommand = options.git || git;
  const spawnGitCommand = options.spawnGit || spawnGit;
  const environment = options.environment || process.env;
  const expected = options.expectedBranch || expectedBranch;
  const base = options.startingMain || startingMain;
  const acceptedHead = options.acceptedProductHead || acceptedProductHead;
  const immutablePaths = options.candidateImmutablePaths ||
    candidateImmutablePaths;
  const preservedPaths = options.integrationPreservedPaths ||
    integrationPreservedPaths;
  const contractCheck = options.readContract || readContract;
  const branch = gitCommand(['branch', '--show-current']);
  const contract = contractCheck();
  const sourceCommit = options.sourceCommit || contract.source_commit;
  let scopeHead = 'HEAD';
  let checkout = 'BRANCH';
  let integrationMerge = null;
  let mainFirstParent = null;
  let workSecondParent = null;
  let mainHistoryMergeCount = null;
  const pullRequestContext = !branch &&
    String(environment.GITHUB_ACTIONS || '') === 'true' &&
    String(environment.GITHUB_EVENT_NAME || '') === 'pull_request' &&
    String(environment.GITHUB_HEAD_REF || '') === expected &&
    /^refs\/pull\/\d+\/merge$/.test(String(environment.GITHUB_REF || ''));
  const mainPushContext = !branch &&
    String(environment.GITHUB_ACTIONS || '') === 'true' &&
    String(environment.GITHUB_EVENT_NAME || '') === 'push' &&
    String(environment.GITHUB_REF || '') === 'refs/heads/main';

  if (branch === expected) {
    checkout = 'BRANCH';
  } else if (branch === 'main' || mainPushContext) {
    checkout = branch === 'main' ? 'MAIN' : 'GITHUB_MAIN_PUSH';
    const allMerges = gitCommand([
      'rev-list', '--merges', '--reverse', `${base}..HEAD`
    ]).split(/\r?\n/).filter(Boolean);
    const firstParentMerges = gitCommand([
      'rev-list', '--first-parent', '--merges', '--reverse', `${base}..HEAD`
    ]).split(/\r?\n/).filter(Boolean);
    if (firstParentMerges.length !== 1) {
      throw new Error('MAIN_INTEGRATION_MERGE_NOT_UNIQUE');
    }
    integrationMerge = firstParentMerges[0];
    mainHistoryMergeCount = allMerges.length;
    const parents = gitCommand([
      'rev-list', '--parents', '-n', '1', integrationMerge
    ]).split(/\s+/).filter(Boolean);
    if (parents.length !== 3) {
      throw new Error('MAIN_INTEGRATION_MERGE_SHAPE_INVALID');
    }
    mainFirstParent = parents[1];
    workSecondParent = parents[2];
    const mainAncestry = spawnGitCommand([
      'merge-base', '--is-ancestor', base, mainFirstParent
    ]);
    if (mainAncestry.error || mainAncestry.status !== 0) {
      throw new Error('MAIN_FIRST_PARENT_LINEAGE_INVALID');
    }
    scopeHead = workSecondParent;
    if (gitCommand([
      'diff', '--name-only', workSecondParent, integrationMerge, '--'
    ].concat(preservedPaths))) {
      throw new Error('MAIN_INTEGRATION_PRODUCT_DRIFT');
    }
    if (gitCommand([
      'diff', '--name-only', integrationMerge, 'HEAD', '--',
      'AGENTS.md', '.codex'
    ])) {
      throw new Error('MAIN_DESCENDANT_GOVERNANCE_DRIFT');
    }
  } else if (pullRequestContext) {
    const parents = gitCommand(['rev-list', '--parents', '-n', '1', 'HEAD'])
      .split(/\s+/).filter(Boolean);
    if (parents.length !== 3) throw new Error('INVALID_PULL_REQUEST_MERGE_SHAPE');
    const baseParent = parents[1];
    scopeHead = parents[2];
    const baseAncestry = spawnGitCommand([
      'merge-base', '--is-ancestor', base, baseParent
    ]);
    if (baseAncestry.error || baseAncestry.status !== 0) {
      throw new Error('PULL_REQUEST_BASE_NOT_DESCENDED_FROM_STARTING_MAIN');
    }
    checkout = 'GITHUB_PULL_REQUEST_MERGE';
  } else if (branch) {
    throw new Error('UNEXPECTED_BRANCH');
  } else {
    throw new Error('UNEXPECTED_DETACHED_SCOPE');
  }
  const ancestry = spawnGitCommand(['merge-base', '--is-ancestor', base, scopeHead]);
  if (ancestry.error || ancestry.status !== 0) throw new Error('STARTING_MAIN_NOT_ANCESTOR');
  const acceptedAncestry = spawnGitCommand([
    'merge-base', '--is-ancestor', acceptedHead, scopeHead
  ]);
  if (acceptedAncestry.error || acceptedAncestry.status !== 0) {
    throw new Error('WORK_0039_ACCEPTED_HEAD_NOT_ANCESTOR');
  }
  const sourceAncestry = spawnGitCommand([
    'merge-base', '--is-ancestor', sourceCommit, scopeHead
  ]);
  if (sourceAncestry.error || sourceAncestry.status !== 0) {
    throw new Error('WORK_0039_SOURCE_NOT_ANCESTOR');
  }
  if (gitCommand(['rev-list', '--merges', `${base}..${scopeHead}`])) {
    throw new Error('DONOR_MERGE_COMMIT_PRESENT');
  }
  if ((checkout === 'MAIN' || checkout === 'GITHUB_MAIN_PUSH') &&
      mainHistoryMergeCount !== 1) {
    throw new Error('MAIN_INTEGRATION_MERGE_NOT_UNIQUE');
  }
  if (gitCommand(['diff', '--name-only', base, scopeHead, '--', 'AGENTS.md', '.codex'])) {
    throw new Error('GOVERNANCE_SCOPE_CHANGED');
  }
  if (gitCommand([
    'diff', '--name-only', acceptedHead, scopeHead, '--'
  ].concat(immutablePaths))) {
    throw new Error('WORK_0039_ACCEPTED_PRODUCT_DRIFT');
  }
  if ((checkout === 'MAIN' || checkout === 'GITHUB_MAIN_PUSH') &&
      gitCommand([
        'diff', '--name-only', acceptedHead, 'HEAD', '--'
      ].concat(immutablePaths))) {
    throw new Error('MAIN_CURRENT_PRODUCT_DRIFT');
  }
  return {
    command: 'Work 0039 branch, PR synthetic merge, or authenticated main integration scope',
    branch: branch || (checkout === 'GITHUB_MAIN_PUSH'
      ? 'GITHUB_MAIN_PUSH' : 'GITHUB_PULL_REQUEST_MERGE'),
    checkout,
    scope_head: scopeHead,
    starting_main: base,
    accepted_product_head: acceptedHead,
    accepted_source_commit: sourceCommit,
    donor_merge_commit_count: 0,
    integration_merge: integrationMerge,
    main_first_parent: mainFirstParent,
    work_second_parent: workSecondParent,
    protected_product_drift_count: 0
  };
}

function trackedFiles(patterns) {
  const output = git(['ls-files', '-z', '--'].concat(patterns));
  return output ? output.split('\0').filter(Boolean).sort() : [];
}

function checkJson() {
  const files = trackedFiles(['*.json']);
  files.forEach((file) => JSON.parse(fs.readFileSync(path.join(repositoryRoot, file), 'utf8')));
  return { command: 'tracked JSON parse', file_count: files.length };
}

function checkYaml() {
  const files = trackedFiles(['*.yml', '*.yaml']);
  files.forEach((file) => {
    const document = YAML.parseDocument(fs.readFileSync(path.join(repositoryRoot, file), 'utf8'));
    if (document.errors.length) throw new Error('INVALID_TRACKED_YAML');
  });
  return { command: 'tracked YAML parse', file_count: files.length };
}

function checkAppsScriptInventory() {
  const names = fs.readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
  const gs = names.filter((name) => name.endsWith('.gs'));
  const expected = [
    ...builderNames(),
    'appsscript.json'
  ].sort();
  const actual = gs.concat('appsscript.json').sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error('APPS_SCRIPT_PAYLOAD_INVENTORY_INVALID');
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'appsscript.json'), 'utf8'));
  if (manifest.runtimeVersion !== 'V8' || !Array.isArray(manifest.oauthScopes)) {
    throw new Error('APPS_SCRIPT_MANIFEST_INVALID');
  }
  return {
    command: 'Apps Script payload inventory',
    gs_file_count: gs.length,
    payload_file_count: actual.length,
    payload_sha256: sha256(actual.map((name) =>
      `${name}:${sha256(fs.readFileSync(path.join(sourceRoot, name)))}\n`
    ).join(''))
  };
}

function builderNames() {
  return releaseVerifier ? require('./build_work_0039_release').allSourceOrder : [];
}

function checkAppsScriptStatic() {
  return Object.assign({ command: 'validate_apps_script_v2.js' }, run(
    process.execPath,
    [path.join(toolsRoot, 'validate_apps_script_v2.js')],
    { failureCode: 'APPS_SCRIPT_VALIDATOR_FAILED' }
  ));
}

function checkPackageInstall() {
  const command = process.platform === 'win32'
    ? (process.env.ComSpec || 'cmd.exe')
    : 'pnpm';
  const args = process.platform === 'win32'
    ? ['/d', '/s', '/c', 'pnpm install --frozen-lockfile']
    : ['install', '--frozen-lockfile'];
  return Object.assign({ command: 'pnpm install --frozen-lockfile' }, run(
    command, args,
    { cwd: moduleRoot, failureCode: 'PNPM_FROZEN_INSTALL_FAILED' }
  ));
}

function checkTests() {
  const inventory = readTestInventory();
  const actualSuites = fs.readdirSync(testsRoot)
    .filter((name) => name.endsWith('_test.js')).sort();
  const comparison = compareTestInventory(actualSuites, inventory.suites);
  if (!comparison.pass) throw new Error('REGRESSION_SUITE_INVENTORY_MISMATCH');
  const outputFingerprints = [];
  for (const suite of inventory.suites) {
    const result = run(process.execPath, [path.join(testsRoot, suite)], {
      failureCode: `NODE_REGRESSION_SUITE_FAILED_${suite}`
    });
    outputFingerprints.push(`${suite}:${result.stdout_sha256}:${result.stderr_sha256}`);
  }
  return {
    command: 'all current *_test.js suites',
    suite_count: inventory.suite_count,
    inventory_fingerprint: inventory.fingerprint,
    missing_suite_count: comparison.missing.length,
    extra_suite_count: comparison.extra.length,
    output_sha256: sha256(outputFingerprints.join('\n'))
  };
}

function checkRelease() {
  const result = releaseVerifier.verifyRelease();
  return {
    command: 'Work 0039 versioned Phase 8B/8C and bundle verifier',
    source_commit: result.source_commit,
    phase8b_payload_files: result.phase8b.payload_file_count,
    phase8c_payload_files: result.phase8c.payload_file_count,
    bundle_source_files: result.bundle.source_file_count,
    txt_transport: 'BYTE_IDENTICAL',
    deterministic_rebuild: result.reproducibility.deterministic_rebuild
  };
}

function checkLineageAndFrozenWork0038() {
  const contract = readContract();
  const sourceAncestry = spawnGit([
    'merge-base', '--is-ancestor', contract.source_commit, 'HEAD'
  ]);
  if (git(['rev-parse', 'HEAD']) !== contract.source_commit &&
      (sourceAncestry.error || sourceAncestry.status !== 0)) {
    throw new Error('CURRENT_SOURCE_COMMIT_NOT_ANCESTOR');
  }
  if (git(['rev-parse', `${contract.source_commit}^{commit}`]) !== contract.source_commit) {
    throw new Error('CURRENT_SOURCE_COMMIT_MISSING');
  }
  Object.entries(work0038ArchiveRefs).forEach(([ref, expected]) => {
    if (git(['rev-parse', ref]) !== expected) throw new Error('WORK_0038_ARCHIVE_REF_CHANGED');
  });
  const changed = git(['diff', '--name-only', startingMain, 'HEAD', '--'])
    .split(/\r?\n/).filter(Boolean);
  const frozenChanges = changed.filter((file) => work0038FrozenPaths.some((prefix) =>
    file === prefix || file.startsWith(`${prefix}/`)
  ));
  if (frozenChanges.length) throw new Error('WORK_0038_RELEASE_OR_DELIVERY_CHANGED');
  Object.entries(work0038BundleBlobExpectations).forEach(([file, expected]) => {
    const actual = git(['rev-parse', `HEAD:${file}`]);
    if (actual !== expected) throw new Error('WORK_0038_BUNDLE_BLOB_CHANGED');
  });
  const frozenFiles = git(['ls-tree', '-r', '--name-only', 'HEAD', '--']
  ).split(/\r?\n/).filter((file) => work0038FrozenPaths.some((prefix) =>
    file === prefix || file.startsWith(`${prefix}/`)
  ));
  return {
    command: 'Work 0039 source/release lineage and Work 0038 frozen preservation',
    source_commit: contract.source_commit,
    starting_main: startingMain,
    work0038_archive_refs_unchanged: true,
    work0038_frozen_path_count: frozenFiles.length,
    work0038_bundle_blob_hashes_unchanged: true,
    changed_frozen_path_count: 0
  };
}

function checkSecrets() {
  const files = trackedFiles(['.']);
  const forbiddenPaths = files.filter((file) => isForbiddenCredentialPath(file));
  if (forbiddenPaths.length) throw new Error('FORBIDDEN_TRACKED_CREDENTIAL_PATH');
  const added = git(['diff', '--no-ext-diff', '--unified=0', startingMain, 'HEAD', '--'])
    .split(/\r?\n/).filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1)).join('\n')
    .replaceAll('https://user:password@example.invalid/?api_key=hidden', '');
  if (contentHasSensitivePattern(added)) throw new Error('SENSITIVE_ADDED_CONTENT');
  const packageFiles = [];
  for (const packageName of [
    'v2.8.26-prepilot',
    'v2.8.26-prepilot-phase8c',
    'work-0039-single-file-company-install'
  ]) {
    const root = path.join(moduleRoot, 'release', packageName);
    if (!fs.existsSync(root)) throw new Error('WORK_0039_RELEASE_MISSING_FOR_SECRET_SCAN');
    const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else packageFiles.push(absolute);
    });
    walk(root);
  }
  packageFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8')
      .replaceAll('https://user:password@example.invalid/?api_key=hidden', '');
    if (contentHasSensitivePattern(content)) throw new Error('SENSITIVE_RELEASE_CONTENT');
  });
  return {
    command: 'tracked secret, credential, real-ID, local-state, and release scan',
    tracked_file_count: files.length,
    package_file_count: packageFiles.length,
    added_content_line_count: added ? added.split('\n').length : 0,
    hit_count: 0
  };
}

function checkDiff() {
  const result = spawnGit(['diff', '--check', startingMain, 'HEAD']);
  if (result.error || result.status !== 0) throw new Error('GIT_DIFF_CHECK_FAILED');
  return { command: `git diff --check ${startingMain}..HEAD`, whitespace_error_count: 0 };
}

function parseArgs(argv) {
  const result = { mode: 'local', section: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--mode') result.mode = argv[++index];
    else if (argv[index] === '--section') result.section = argv[++index];
    else throw new Error('UNKNOWN_ARGUMENT');
  }
  if (!['local', 'ci'].includes(result.mode)) throw new Error('INVALID_MODE');
  const valid = [
    'scope', 'json', 'yaml', 'apps-script', 'tests', 'release', 'lineage',
    'secret-scan', 'package-install', 'diff-check'
  ];
  if (result.section && !valid.includes(result.section)) throw new Error('INVALID_SECTION');
  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const sections = [
    ['worktree', checkWorktree],
    ['generated-files', checkGeneratedFiles],
    ['scope', checkScope],
    ['json', checkJson],
    ['yaml', checkYaml],
    ['apps-script-inventory', checkAppsScriptInventory],
    ['apps-script-static', checkAppsScriptStatic],
    ['package-install', checkPackageInstall],
    ['tests', checkTests],
    ['release', checkRelease],
    ['lineage', checkLineageAndFrozenWork0038],
    ['secret-scan', checkSecrets],
    ['diff-check', checkDiff]
  ];
  let selected;
  if (!args.section) selected = sections;
  else if (args.section === 'apps-script') {
    selected = sections.filter(([name]) =>
      name === 'apps-script-inventory' || name === 'apps-script-static'
    );
  } else {
    selected = sections.filter(([name]) => name === args.section);
  }
  const checks = selected.map(([name, fn]) => Object.assign(
    { name }, statusFrom(fn)
  ));
  const failed = checks.filter((check) => check.status !== 'PASS');
  let branch = '';
  let head = '';
  try {
    head = git(['rev-parse', 'HEAD']);
    branch = git(['branch', '--show-current']);
  } catch (error) {
    head = '';
    branch = '';
  }
  const report = {
    schema: 'WORK_OS_LOCAL_VERIFICATION_REPORT_V3',
    work_id: '0039',
    dispatch_id: '0039-CODEX-04',
    environment: 'LOCAL_NON_GOOGLE',
    mode: args.mode,
    git: { head, branch },
    checks,
    passed: checks.length - failed.length,
    failed: failed.length,
    live_google_workspace: 'NOT_EXECUTED',
    real_gemini_provider: 'NOT_EXECUTED',
    real_openai_provider: 'NOT_EXECUTED',
    oauth: 'NOT_EXECUTED',
    clasp_push: 'NOT_EXECUTED',
    clasp_pullback_parity: 'NOT_EXECUTED',
    deployment: 'NOT_EXECUTED',
    automation: 'OFF / NOT_EXECUTED',
    openai_data_governance: 'NOT_APPROVED_OR_UNKNOWN'
  };
  fs.mkdirSync(reportRoot, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (failed.length) process.exitCode = 1;
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    const report = {
      schema: 'WORK_OS_LOCAL_VERIFICATION_REPORT_V3',
      work_id: '0039',
      dispatch_id: '0039-CODEX-04',
      environment: 'LOCAL_NON_GOOGLE',
      status: 'FAIL',
      safe_message: String(error && error.message || error).slice(0, 160),
      live_google_workspace: 'NOT_EXECUTED',
      real_gemini_provider: 'NOT_EXECUTED',
      real_openai_provider: 'NOT_EXECUTED'
    };
    fs.mkdirSync(reportRoot, { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  acceptedProductHead,
  acceptedSourceCommit,
  candidateImmutablePaths,
  integrationPreservedPaths,
  checkWorktree,
  checkGeneratedFiles,
  checkScope,
  checkJson,
  checkYaml,
  checkAppsScriptInventory,
  checkAppsScriptStatic,
  checkPackageInstall,
  checkTests,
  checkRelease,
  checkLineageAndFrozenWork0038,
  checkSecrets,
  checkDiff
};
