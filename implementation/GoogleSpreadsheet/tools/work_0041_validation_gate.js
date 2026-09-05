'use strict';

// Successor contract; reuse the standard deterministic checks without changing
// the historical Work 0037/0039 acceptance rules or their release verifiers.
const cp = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const shared = require('./work_0039_validation_gate');
const verifier = require('./verify_work_0041_release');
const builder = require('./build_work_0041_release');
const { contentHasSensitivePattern } = require('./local_validation_gate');
const moduleRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(moduleRoot, '../..');
const startingMain = 'baddbd9dc728599dc095526e69ce7531b0f16bea';
const expectedBranch = 'codex/0041-calendar-runtime-remediation';
const sourceRoot = 'implementation/GoogleSpreadsheet/apps-script-v2';
const gate = 'READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT';
const packages = [builder.phase8bPackage, builder.phase8cPackage, builder.bundlePackage];
const protectedPaths = [sourceRoot, 'CURRENT_CONTRACT.json',
  ...packages.map(p => `implementation/GoogleSpreadsheet/release/${p}`)];

function git(args) {
  return cp.execFileSync('git', ['-C', repositoryRoot, ...args], {
    encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024
  }).trim();
}
function names(value) { return String(value || '').split(/\r?\n/).filter(Boolean); }
function readContract() {
  const value = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'CURRENT_CONTRACT.json'), 'utf8'));
  if (value.schema !== 'WORK_OS_CURRENT_CONTRACT_V1' ||
      value.repository !== 'Tanukitsune-hub/GAS-Project-Schedule' ||
      value.branch !== expectedBranch || value.starting_main !== startingMain ||
      value.code_version !== '2.8.27-prepilot' || value.schema_version !== '2.6' ||
      value.ai_schema_version !== '2.0' || value.migration_version !== '3' ||
      value.highest_gate !== gate || value.automation !== false ||
      value.active_transfer !== null || value.active_deployment !== null ||
      value.release_commit !== 'SELF' || !/^[0-9a-f]{40}$/.test(value.source_commit) ||
      !value.work_0041 || value.work_0041.live_runtime !== 'NOT_EXECUTED' ||
      value.work_0041.dispatch_id !== '0041-CODEX-01' ||
      !value.work_0039 || value.work_0039.openai_data_governance_status !== 'NOT_APPROVED_OR_UNKNOWN') {
    throw new Error('CURRENT_CONTRACT_WORK_0041_INVALID');
  }
  for (const [name, pkg, testMode, count] of [
    ['phase8b', packages[0], true, 26], ['phase8c', packages[1], false, 25]
  ]) {
    const p = value[name];
    if (!p || p.path !== `implementation/GoogleSpreadsheet/release/${pkg}` ||
        p.test_mode !== testMode || p.test_harness !== testMode ||
        p.payload_files !== count || p.package_files !== count + 4) {
      throw new Error('CURRENT_RELEASE_CONTRACT_INVALID');
    }
  }
  if (value.bundle.path !== `implementation/GoogleSpreadsheet/release/${packages[2]}` ||
      value.bundle.paste_count !== 2 || value.bundle.txt_transport !== 'BYTE_IDENTICAL') {
    throw new Error('CURRENT_BUNDLE_CONTRACT_INVALID');
  }
  return value;
}

function checkScope(options = {}) {
  const command = options.git || git;
  // Injection is restricted to local unit-test callers, never environment input.
  const base = options.startingMain || startingMain;
  const contract = (options.readContract || readContract)();
  const env = options.env || process.env;
  const branch = command(['branch', '--show-current']);
  const head = command(['rev-parse', 'HEAD']);
  let scopeHead = head;
  let context = 'WORK_BRANCH';
  const ancestor = (a, b) => command(['merge-base', '--is-ancestor', a, b]);
  if (branch !== expectedBranch) {
    if (!branch && env.GITHUB_ACTIONS === 'true' && env.GITHUB_EVENT_NAME === 'pull_request' &&
        /^refs\/pull\/[1-9][0-9]*\/merge$/.test(env.GITHUB_REF || '') &&
        env.GITHUB_HEAD_REF === expectedBranch && env.GITHUB_BASE_REF === 'main') {
      const parents = command(['show', '-s', '--format=%P', head]).split(' ');
      if (parents.length !== 2) throw new Error('PR_MERGE_SHAPE_INVALID');
      ancestor(base, parents[0]);
      scopeHead = parents[1];
      context = 'GITHUB_PR_SYNTHETIC_MERGE';
    } else if (branch === 'main' || (!branch && env.GITHUB_ACTIONS === 'true' &&
        env.GITHUB_EVENT_NAME === 'push' && env.GITHUB_REF === 'refs/heads/main')) {
      const merges = names(command(['rev-list', '--first-parent', '--merges', `${base}..${head}`]));
      if (merges.length !== 1) throw new Error('MAIN_INTEGRATION_MERGE_NOT_UNIQUE');
      const parents = command(['show', '-s', '--format=%P', merges[0]]).split(' ');
      if (parents.length !== 2) throw new Error('MAIN_MERGE_SHAPE_INVALID');
      ancestor(base, parents[0]);
      scopeHead = parents[1];
      if (names(command(['rev-list', '--merges', `${base}..${head}`])).length !== 1 ||
          command(['diff', '--name-only', scopeHead, merges[0], '--', ...protectedPaths]) ||
          command(['diff', '--name-only', scopeHead, head, '--', ...protectedPaths])) {
        throw new Error('MAIN_PRODUCT_OR_HISTORY_DRIFT');
      }
      context = 'MAIN_INTEGRATION';
    } else throw new Error('WORK_0041_SCOPE_INVALID');
  }
  ancestor(base, scopeHead);
  ancestor(base, contract.source_commit);
  ancestor(contract.source_commit, scopeHead);
  if (command(['rev-list', '--merges', `${base}..${scopeHead}`])) {
    throw new Error('DONOR_MERGE_COMMIT_PRESENT');
  }
  if (command(['diff', '--name-only', base, head, '--', 'AGENTS.md',
    'implementation/GoogleSpreadsheet/AGENTS.md', 'docs/handoffs/AGENTS.md', '.codex'])) {
    throw new Error('GOVERNANCE_DRIFT');
  }
  if (command(['diff', '--name-only', scopeHead, head, '--', ...protectedPaths])) {
    throw new Error('PR_PRODUCT_DRIFT');
  }
  return { context, head, scope_head: scopeHead, starting_main: base, donor_merge_count: 0 };
}

function checkRelease() {
  const contract = readContract();
  const result = verifier.verifyRelease();
  for (const phase of ['phase8b', 'phase8c']) {
    if (contract[phase].payload_sha256 !== result[phase].payload_sha256 ||
        contract[phase].package_sha256 !== result[phase].package_sha256) {
      throw new Error('CONTRACT_PAYLOAD_HASH_MISMATCH');
    }
  }
  for (const key of ['code_gs_sha256', 'manifest_sha256', 'checksums_sha256']) {
    if (contract.bundle[key] !== result.bundle[key]) throw new Error('CONTRACT_BUNDLE_HASH_MISMATCH');
  }
  return result;
}

function checkLineage() {
  const contract = readContract();
  git(['merge-base', '--is-ancestor', startingMain, contract.source_commit]);
  git(['merge-base', '--is-ancestor', contract.source_commit, 'HEAD']);
  if (git(['diff', '--name-only', contract.source_commit, 'HEAD', '--', sourceRoot])) {
    throw new Error('CURRENT_SOURCE_PARITY_INVALID');
  }
  const frozenRoots = names(git(['ls-tree', '--name-only', startingMain,
    'implementation/GoogleSpreadsheet/release/']));
  frozenRoots.push('implementation/GoogleSpreadsheet/tools/build_work_0039_release.js',
    'implementation/GoogleSpreadsheet/tools/verify_work_0039_release.js',
    'implementation/GoogleSpreadsheet/tools/v2_8_26');
  if (git(['diff', '--name-only', startingMain, 'HEAD', '--', ...frozenRoots])) {
    throw new Error('HISTORICAL_FROZEN_ARTIFACT_CHANGED');
  }
  const archives = {
    'archive/0038-gemini-source-baseline': '272612831c4a46e45fdf166c65e3075ffee7dfef',
    'archive/0038-gemini-company-delivery': 'eccf27ec9f6b6fd023eca7b69279cc88741ecd9b'
  };
  for (const [ref, sha] of Object.entries(archives)) {
    if (git(['rev-parse', `refs/remotes/origin/${ref}`]) !== sha) throw new Error('ARCHIVE_REF_CHANGED');
  }
  const allowed = ['00_Config.gs', '10_CalendarSync.gs', '18_Worker.gs', 'README.md', 'CHANGELOG.md'];
  const sourceChanges = names(git(['diff', '--name-only', startingMain, 'HEAD', '--', sourceRoot]));
  if (sourceChanges.some(p => !allowed.includes(path.posix.basename(p)))) {
    throw new Error('SOURCE_DISPATCH_SCOPE_INVALID');
  }
  const previousConfig = git(['show', `${startingMain}:${sourceRoot}/00_Config.gs`]);
  const currentConfig = git(['show', `HEAD:${sourceRoot}/00_Config.gs`]);
  if (previousConfig.replace("CODE_VERSION: '2.8.26-prepilot'", "CODE_VERSION: '2.8.27-prepilot'") !== currentConfig) {
    throw new Error('CONFIG_BEHAVIOR_DRIFT');
  }
  return { source_commit: contract.source_commit, frozen_root_count: frozenRoots.length,
    changed_frozen_path_count: 0, archive_refs: archives, provider_schema_migration: 'UNCHANGED' };
}

function checkSecrets() {
  const result = shared.checkSecrets();
  let count = 0;
  function visit(root) {
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      const file = path.join(root, entry.name);
      if (entry.isDirectory()) visit(file);
      else {
        count += 1;
        if (contentHasSensitivePattern(fs.readFileSync(file, 'utf8'))) throw new Error('SENSITIVE_CURRENT_RELEASE');
      }
    }
  }
  packages.forEach(p => visit(path.join(moduleRoot, 'release', p)));
  return { ...result, active_package_file_count: count };
}

function main() {
  const argv = process.argv.slice(2);
  let mode = 'local';
  let section = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--mode') mode = argv[++i];
    else if (argv[i] === '--section') section = argv[++i];
    else throw new Error('INVALID_ARGUMENTS');
  }
  const sections = ['scope', 'json', 'yaml', 'apps-script', 'tests', 'release',
    'lineage', 'secret-scan', 'package-install', 'diff-check'];
  if (!['local', 'ci'].includes(mode) || (section !== null && !sections.includes(section))) {
    throw new Error('INVALID_ARGUMENTS');
  }
  const checks = [
    ['worktree', shared.checkWorktree], ['generated-files', shared.checkGeneratedFiles],
    ['scope', checkScope], ['json', shared.checkJson], ['yaml', shared.checkYaml],
    ['apps-script-inventory', shared.checkAppsScriptInventory], ['apps-script-static', shared.checkAppsScriptStatic],
    ['package-install', shared.checkPackageInstall], ['tests', shared.checkTests],
    ['release', checkRelease], ['lineage', checkLineage], ['secret-scan', checkSecrets], ['diff-check', shared.checkDiff]
  ].filter(([name]) => !section || name === section ||
    (section === 'apps-script' && name.startsWith('apps-script-'))
  ).map(([name, check]) => {
    try { return { name, status: 'PASS', ...check() }; }
    catch (error) { return { name, status: 'FAIL', code: String(error.message).slice(0, 160) }; }
  });
  const report = {
    schema: 'WORK_OS_LOCAL_VERIFICATION_REPORT_V3', work_id: '0041', dispatch_id: '0041-CODEX-01',
    environment: 'LOCAL_NON_GOOGLE', mode, section, head: git(['rev-parse', 'HEAD']), checks,
    passed: checks.filter(c => c.status === 'PASS').length,
    failed: checks.filter(c => c.status !== 'PASS').length,
    live_workspace_provider_actions: 'NOT_EXECUTED', company_calendar_e2e: 'NOT_ACCEPTED'
  };
  fs.mkdirSync(path.join(moduleRoot, '.local-validation'), { recursive: true });
  fs.writeFileSync(path.join(moduleRoot, '.local-validation/local-validation-report.json'), JSON.stringify(report, null, 2) + '\n');
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (report.failed) process.exitCode = 1;
}
if (require.main === module) main();
module.exports = { startingMain, expectedBranch, readContract, checkScope, checkLineage, checkRelease, checkSecrets };
