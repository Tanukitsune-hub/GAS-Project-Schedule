'use strict';

/**
 * Post-squash validation entry point.
 *
 * The core local_validation_gate intentionally validates the current release
 * through the last commit that touched CURRENT_CONTRACT.json. After a GitHub
 * squash merge, that last commit is the materialized Work commit rather than
 * the original release-only commit, so the core gate correctly refuses to
 * call the squash commit release-only.
 *
 * This wrapper does not relax that release-scope rule. It accepts exactly one
 * known Work 0037 squash materialization only after proving:
 * - the materialized main commit has the expected parent;
 * - its tree is byte-identical to the CI-validated final branch head;
 * - the original 2.8.25 release commit is a direct child of the recorded
 *   source commit and is an ancestor of that validated head;
 * - the original release commit has the same narrow release-only scope the
 *   core gate requires; and
 * - historical frozen release paths remain unchanged on the current HEAD.
 *
 * All non-lineage checks are still executed by local_validation_gate.js. A
 * failed core report is repaired only when CURRENT_RELEASE_SCOPE_INVALID is
 * the sole failure and all proofs below pass.
 */

const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const moduleRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(moduleRoot, '..', '..');
const localGatePath = path.join(__dirname, 'local_validation_gate.js');
const work0039GatePath = path.join(__dirname, 'work_0039_validation_gate.js');
const reportPath = path.join(
  moduleRoot,
  '.local-validation',
  'local-validation-report.json'
);

const work0037MainMaterializedCommit =
  'eaa91711acd2065b1291bc6d99bc57cf3c31692a';
const work0037MainParentCommit =
  'ca70607cba047b340b8009a03448b8d8128dc68e';
const work0037ValidatedFinalHead =
  '1992641cc5055dac63c37e8a5225452281dead4a';
const work0037SourceCommit =
  '8364a2deb091d52ef322c9aa6cb67098f721d93e';
const work0037ReleaseCommit =
  '7c68f1973ddffc3d21caeaac59303687d0c62a81';

const phase8bPath =
  'implementation/GoogleSpreadsheet/release/v2.8.25-prepilot';
const phase8cPath =
  'implementation/GoogleSpreadsheet/release/v2.8.25-prepilot-phase8c';

const currentScopeStartingMain = work0037MainParentCommit;
const expectedRefBaseline =
  'a829396106cea9f8b440c62e13bc7e33bdf28a19';
const work0037Codex04HistoricalBaseline =
  '71b0ea873b179cd155df958d69d609daace454f9';

const historicalReleasePaths = Object.freeze([
  'implementation/GoogleSpreadsheet/release/v2.8.20-prepilot',
  'implementation/GoogleSpreadsheet/release/v2.8.20-prepilot-phase8c',
  'implementation/GoogleSpreadsheet/release/v2.8.21-prepilot',
  'implementation/GoogleSpreadsheet/release/v2.8.21-prepilot-phase8c',
  'implementation/GoogleSpreadsheet/release/v2.8.22-prepilot',
  'implementation/GoogleSpreadsheet/release/v2.8.22-prepilot-phase8c',
  'implementation/GoogleSpreadsheet/release/v2.8.23-prepilot',
  'implementation/GoogleSpreadsheet/release/v2.8.23-prepilot-phase8c',
  'implementation/GoogleSpreadsheet/release/v2.8.24-prepilot',
  'implementation/GoogleSpreadsheet/release/v2.8.24-prepilot-phase8c'
]);

function spawnGit(args) {
  return childProcess.spawnSync('git', ['-C', repositoryRoot].concat(args), {
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024
  });
}

function git(args) {
  const result = spawnGit(args);
  if (result.error || result.status !== 0) {
    throw new Error('GIT_COMMAND_FAILED');
  }
  return String(result.stdout || '').trim();
}

function gitObjectExists(spec, spawnGitCommand = spawnGit) {
  const result = spawnGitCommand(['cat-file', '-e', spec]);
  return !result.error && result.status === 0;
}

function splitNames(value) {
  return String(value || '').split(/\r?\n/).filter(Boolean).sort();
}

function assertAncestor(spawnGitCommand, ancestor, descendant, errorCode) {
  const result = spawnGitCommand([
    'merge-base', '--is-ancestor', ancestor, descendant
  ]);
  if (result.error || result.status !== 0) {
    throw new Error(errorCode);
  }
}

function verifyHistoricalFrozenReleases(options) {
  const gitCommand = options.git;
  const objectExists = options.objectExists;
  const head = options.head;

  if (historicalReleasePaths.slice(0, 4).some((releasePath) =>
    !objectExists(`${currentScopeStartingMain}:${releasePath}`)) ||
      historicalReleasePaths.slice(4, 8).some((releasePath) =>
        !objectExists(`${expectedRefBaseline}:${releasePath}`)) ||
      historicalReleasePaths.slice(8).some((releasePath) =>
        !objectExists(`${work0037Codex04HistoricalBaseline}:${releasePath}`))) {
    throw new Error('WORK_0037_SQUASH_HISTORICAL_RELEASE_MISSING');
  }

  if (gitCommand([
    'diff', '--name-only', currentScopeStartingMain, head, '--'
  ].concat(historicalReleasePaths.slice(0, 4))).trim()) {
    throw new Error('WORK_0037_SQUASH_HISTORICAL_2_8_20_21_CHANGED');
  }
  if (gitCommand([
    'diff', '--name-only', expectedRefBaseline, head, '--'
  ].concat(historicalReleasePaths.slice(4, 8))).trim()) {
    throw new Error('WORK_0037_SQUASH_HISTORICAL_2_8_22_23_CHANGED');
  }
  if (gitCommand([
    'diff', '--name-only', work0037Codex04HistoricalBaseline, head, '--'
  ].concat(historicalReleasePaths.slice(8))).trim()) {
    throw new Error('WORK_0037_SQUASH_HISTORICAL_2_8_24_CHANGED');
  }
}

function verifyWork0037SquashMaterialization(options = {}) {
  const gitCommand = options.git || git;
  const spawnGitCommand = options.spawnGit || spawnGit;
  const objectExists = options.objectExists ||
    ((spec) => gitObjectExists(spec, spawnGitCommand));
  const mainCommit = options.mainCommit || work0037MainMaterializedCommit;
  const expectedParent = options.expectedParent || work0037MainParentCommit;
  const validatedHead = options.validatedHead || work0037ValidatedFinalHead;
  const sourceCommit = options.sourceCommit || work0037SourceCommit;
  const releaseCommit = options.releaseCommit || work0037ReleaseCommit;
  const head = options.head || 'HEAD';

  [mainCommit, expectedParent, validatedHead, sourceCommit, releaseCommit].forEach(
    (commit) => {
      if (!objectExists(`${commit}^{commit}`)) {
        throw new Error('WORK_0037_SQUASH_REQUIRED_COMMIT_MISSING');
      }
    }
  );

  const observedContractCommit = gitCommand([
    'log', '-1', '--format=%H', '--', 'CURRENT_CONTRACT.json'
  ]);
  if (observedContractCommit !== mainCommit) {
    throw new Error('WORK_0037_SQUASH_CONTRACT_POINTER_INVALID');
  }

  const mainParent = gitCommand(['rev-parse', `${mainCommit}^`]);
  if (mainParent !== expectedParent) {
    throw new Error('WORK_0037_SQUASH_MAIN_PARENT_INVALID');
  }

  const materializedTree = gitCommand([
    'rev-parse', `${mainCommit}^{tree}`
  ]);
  const validatedTree = gitCommand([
    'rev-parse', `${validatedHead}^{tree}`
  ]);
  if (materializedTree !== validatedTree) {
    throw new Error('WORK_0037_SQUASH_TREE_MISMATCH');
  }

  const releaseParent = gitCommand(['rev-parse', `${releaseCommit}^`]);
  if (releaseParent !== sourceCommit) {
    throw new Error('WORK_0037_SQUASH_RELEASE_PARENT_INVALID');
  }

  assertAncestor(
    spawnGitCommand,
    mainCommit,
    head,
    'WORK_0037_SQUASH_MAIN_NOT_ANCESTOR_OF_HEAD'
  );
  assertAncestor(
    spawnGitCommand,
    releaseCommit,
    validatedHead,
    'WORK_0037_SQUASH_RELEASE_NOT_ANCESTOR_OF_VALIDATED_HEAD'
  );

  const changed = splitNames(gitCommand([
    'diff-tree', '--no-commit-id', '--name-only', '-r', releaseCommit
  ]));
  const invalid = changed.filter((file) =>
    file !== 'CURRENT_CONTRACT.json' &&
    file !== 'implementation/GoogleSpreadsheet/tools/local_validation_gate.js' &&
    !file.startsWith(`${phase8bPath}/`) &&
    !file.startsWith(`${phase8cPath}/`)
  );
  if (invalid.length) {
    throw new Error('WORK_0037_SQUASH_RELEASE_SCOPE_INVALID');
  }
  if (!changed.includes('CURRENT_CONTRACT.json') ||
      !changed.some((file) => file.startsWith(`${phase8bPath}/`)) ||
      !changed.some((file) => file.startsWith(`${phase8cPath}/`))) {
    throw new Error('WORK_0037_SQUASH_RELEASE_REQUIRED_SCOPE_MISSING');
  }

  verifyHistoricalFrozenReleases({
    git: gitCommand,
    objectExists,
    head
  });

  return {
    materialized_main_commit: mainCommit,
    validated_final_head: validatedHead,
    main_parent: mainParent,
    exact_tree_equality: true,
    source_commit: sourceCommit,
    release_commit: releaseCommit,
    release_parent: releaseParent,
    release_is_ancestor_of_validated_head: true,
    current_release_changed_file_count: changed.length,
    historical_release_changed_file_count: 0
  };
}

function findLineageCheck(report) {
  return report && Array.isArray(report.checks)
    ? report.checks.find((check) => check && check.name === 'lineage')
    : null;
}

function isKnownWork0037SquashLineageFailure(report) {
  const lineage = findLineageCheck(report);
  if (!report || !lineage ||
      Number(report.failed) !== 1 ||
      lineage.status !== 'FAIL' ||
      lineage.safe_message !== 'CURRENT_RELEASE_SCOPE_INVALID') {
    return false;
  }
  return report.checks.every((check) =>
    check.name === 'lineage' || check.status === 'PASS'
  );
}

function repairKnownWork0037SquashReport(report, evidence) {
  if (!isKnownWork0037SquashLineageFailure(report)) {
    throw new Error('WORK_0037_SQUASH_REPORT_NOT_REPAIRABLE');
  }
  const lineageIndex = report.checks.findIndex(
    (check) => check && check.name === 'lineage'
  );
  const prior = report.checks[lineageIndex];
  report.checks[lineageIndex] = {
    name: 'lineage',
    status: 'PASS',
    duration_ms: Number(prior.duration_ms || 0),
    command: 'Work 0037 exact squash materialization plus original release-only scope and frozen-release preservation',
    work_0037_squash_materialization: evidence,
    release_commit: evidence.release_commit,
    current_release_changed_file_count:
      evidence.current_release_changed_file_count,
    historical_release_changed_file_count: 0
  };
  report.passed = report.checks.length;
  report.failed = 0;
  return report;
}

function parseGateReport(stdout) {
  try {
    return JSON.parse(String(stdout || '').trim());
  } catch (error) {
    return null;
  }
}

function runCoreGate(argv) {
  return childProcess.spawnSync(
    process.execPath,
    [localGatePath].concat(argv),
    {
      cwd: moduleRoot,
      encoding: 'utf8',
      windowsHide: true,
      maxBuffer: 64 * 1024 * 1024
    }
  );
}

function shouldUseWork0039Gate() {
  const branchResult = spawnGit(['branch', '--show-current']);
  const branch = String(branchResult.stdout || '').trim();
  if (branch === 'codex/0039-openai-provider-selection' ||
      String(process.env.GITHUB_HEAD_REF || '') ===
        'codex/0039-openai-provider-selection') {
    return true;
  }
  try {
    const contract = JSON.parse(fs.readFileSync(
      path.join(repositoryRoot, 'CURRENT_CONTRACT.json'), 'utf8'
    ));
    return contract && contract.branch ===
      'codex/0039-openai-provider-selection' &&
      contract.code_version === '2.8.26-prepilot';
  } catch (error) {
    return false;
  }
}

function runWork0039Gate(argv) {
  return childProcess.spawnSync(
    process.execPath,
    [work0039GatePath].concat(argv),
    {
      cwd: moduleRoot,
      encoding: 'utf8',
      windowsHide: true,
      maxBuffer: 64 * 1024 * 1024
    }
  );
}

function writeReport(report) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

function main() {
  const activeContractPath = path.join(repositoryRoot, 'CURRENT_CONTRACT.json');
  const activeContract = fs.existsSync(activeContractPath)
    ? JSON.parse(fs.readFileSync(activeContractPath, 'utf8')) : null;
  if (git(['branch', '--show-current']) === 'codex/0041-calendar-runtime-remediation' ||
      process.env.GITHUB_HEAD_REF === 'codex/0041-calendar-runtime-remediation' ||
      (activeContract && activeContract.branch === 'codex/0041-calendar-runtime-remediation')) {
    const result = childProcess.spawnSync(process.execPath,
      [path.join(__dirname, 'work_0041_validation_gate.js')].concat(process.argv.slice(2)),
      { cwd: moduleRoot, encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
    process.stdout.write(String(result.stdout || ''));
    process.stderr.write(String(result.stderr || ''));
    process.exitCode = result.error || result.status === null ? 1 : result.status;
    return;
  }
  const argv = process.argv.slice(2);
  if (shouldUseWork0039Gate()) {
    const result = runWork0039Gate(argv);
    process.stdout.write(String(result.stdout || ''));
    if (result.stderr) process.stderr.write(String(result.stderr));
    if (result.error || result.status !== 0) {
      process.exitCode = typeof result.status === 'number'
        ? result.status : 1;
    }
    return;
  }
  const result = runCoreGate(argv);
  if (!result.error && result.status === 0) {
    process.stdout.write(String(result.stdout || ''));
    if (result.stderr) process.stderr.write(String(result.stderr));
    return;
  }

  const report = parseGateReport(result.stdout);
  if (!isKnownWork0037SquashLineageFailure(report)) {
    process.stdout.write(String(result.stdout || ''));
    if (result.stderr) process.stderr.write(String(result.stderr));
    process.exitCode = typeof result.status === 'number' ? result.status : 1;
    return;
  }

  try {
    const evidence = verifyWork0037SquashMaterialization();
    const repaired = repairKnownWork0037SquashReport(report, evidence);
    writeReport(repaired);
    process.stdout.write(`${JSON.stringify(repaired, null, 2)}\n`);
  } catch (error) {
    const failed = Object.assign({}, report, {
      post_merge_lineage_repair: {
        status: 'FAIL',
        safe_message: String(error && error.message || error).slice(0, 160)
      }
    });
    writeReport(failed);
    process.stdout.write(`${JSON.stringify(failed, null, 2)}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  verifyWork0037SquashMaterialization,
  isKnownWork0037SquashLineageFailure,
  repairKnownWork0037SquashReport
};
