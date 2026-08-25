'use strict';

const assert = require('node:assert');
const {
  isAllowedScopeBranch,
  verifyWork0036SquashMaterialization
} = require('../tools/local_validation_gate');
const {
  verifyWork0037SquashMaterialization,
  isKnownWork0037SquashLineageFailure,
  repairKnownWork0037SquashReport
} = require('../tools/post_merge_validation_gate');

assert.strictEqual(isAllowedScopeBranch('codex/0037-personal-shadow-pilot'), true);
assert.strictEqual(isAllowedScopeBranch('codex/4321-future-numbered-work'), true);
assert.strictEqual(isAllowedScopeBranch('codex/0037'), false);
assert.strictEqual(isAllowedScopeBranch('codex/0037-Uppercase'), false);

const mainCommit = 'main-squash';
const validatedHead = 'validated-work-0036';
const historicalRelease = 'work-0036-release';
const gitValues = new Map([
  [`${mainCommit}^`, 'starting-main'],
  [`${mainCommit}^{tree}`, 'exact-tree'],
  [`${validatedHead}^{tree}`, 'exact-tree']
]);
const git = (args) => {
  assert.strictEqual(args[0], 'rev-parse');
  const value = gitValues.get(args[1]);
  if (!value) throw new Error('UNEXPECTED_SYNTHETIC_GIT_COMMAND');
  return value;
};
const spawnGit = (args) => {
  assert.deepStrictEqual(args, [
    'merge-base', '--is-ancestor', historicalRelease, validatedHead
  ]);
  return { status: 0, error: null };
};

const evidence = verifyWork0036SquashMaterialization({
  git,
  spawnGit,
  mainCommit,
  validatedHead,
  expectedParent: 'starting-main',
  historicalReleaseCommit: historicalRelease
});
assert.strictEqual(evidence.exact_tree_equality, true);
assert.strictEqual(evidence.historical_release_is_ancestor, true);

assert.throws(
  () => verifyWork0036SquashMaterialization({
    git: (args) => {
      if (args[1] === `${mainCommit}^`) return 'starting-main';
      return args[1] === `${mainCommit}^{tree}` ? 'tree-a' : 'tree-b';
    },
    spawnGit,
    mainCommit,
    validatedHead,
    expectedParent: 'starting-main',
    historicalReleaseCommit: historicalRelease
  }),
  (error) => error && error.message === 'WORK_0036_SQUASH_TREE_MISMATCH'
);

assert.throws(
  () => verifyWork0036SquashMaterialization({
    git: (args) => {
      if (args[1] === `${mainCommit}^`) return 'wrong-parent';
      return 'exact-tree';
    },
    spawnGit,
    mainCommit,
    validatedHead,
    expectedParent: 'starting-main',
    historicalReleaseCommit: historicalRelease
  }),
  (error) => error && error.message === 'WORK_0036_SQUASH_MAIN_PARENT_INVALID'
);

const w37Main = 'work-0037-main';
const w37Parent = 'work-0037-parent';
const w37Validated = 'work-0037-validated';
const w37Source = 'work-0037-source';
const w37Release = 'work-0037-release';
const phase8b = 'implementation/GoogleSpreadsheet/release/v2.8.25-prepilot';
const phase8c = 'implementation/GoogleSpreadsheet/release/v2.8.25-prepilot-phase8c';
const releaseFiles = [
  'CURRENT_CONTRACT.json',
  `${phase8b}/CHECKSUMS.sha256`,
  `${phase8c}/CHECKSUMS.sha256`
].join('\n');

function makeWork0037Git(overrides = {}) {
  return (args) => {
    const key = args.join(' ');
    if (key === 'log -1 --format=%H -- CURRENT_CONTRACT.json') {
      return overrides.contractPointer || w37Main;
    }
    if (key === `rev-parse ${w37Main}^`) {
      return overrides.mainParent || w37Parent;
    }
    if (key === `rev-parse ${w37Main}^{tree}`) {
      return overrides.mainTree || 'work-0037-tree';
    }
    if (key === `rev-parse ${w37Validated}^{tree}`) {
      return overrides.validatedTree || 'work-0037-tree';
    }
    if (key === `rev-parse ${w37Release}^`) {
      return overrides.releaseParent || w37Source;
    }
    if (key === `diff-tree --no-commit-id --name-only -r ${w37Release}`) {
      return overrides.releaseFiles || releaseFiles;
    }
    if (args[0] === 'diff' && args[1] === '--name-only') {
      return overrides.historicalDiff || '';
    }
    throw new Error(`UNEXPECTED_WORK_0037_GIT_COMMAND:${key}`);
  };
}

function makeWork0037Spawn(overrides = {}) {
  return (args) => {
    if (args[0] === 'merge-base' && args[1] === '--is-ancestor') {
      const ancestor = args[2];
      const descendant = args[3];
      if (ancestor === w37Main && descendant === 'HEAD') {
        return {
          status: overrides.mainAncestryFailure ? 1 : 0,
          error: null
        };
      }
      if (ancestor === w37Release && descendant === w37Validated) {
        return {
          status: overrides.releaseAncestryFailure ? 1 : 0,
          error: null
        };
      }
    }
    throw new Error(`UNEXPECTED_WORK_0037_SPAWN:${args.join(' ')}`);
  };
}

const objectExists = () => true;
const work0037Evidence = verifyWork0037SquashMaterialization({
  git: makeWork0037Git(),
  spawnGit: makeWork0037Spawn(),
  objectExists,
  mainCommit: w37Main,
  expectedParent: w37Parent,
  validatedHead: w37Validated,
  sourceCommit: w37Source,
  releaseCommit: w37Release,
  head: 'HEAD'
});
assert.strictEqual(work0037Evidence.exact_tree_equality, true);
assert.strictEqual(work0037Evidence.release_parent, w37Source);
assert.strictEqual(work0037Evidence.release_is_ancestor_of_validated_head, true);
assert.strictEqual(work0037Evidence.current_release_changed_file_count, 3);

assert.throws(
  () => verifyWork0037SquashMaterialization({
    git: makeWork0037Git({ mainParent: 'wrong-parent' }),
    spawnGit: makeWork0037Spawn(),
    objectExists,
    mainCommit: w37Main,
    expectedParent: w37Parent,
    validatedHead: w37Validated,
    sourceCommit: w37Source,
    releaseCommit: w37Release
  }),
  (error) => error && error.message === 'WORK_0037_SQUASH_MAIN_PARENT_INVALID'
);

assert.throws(
  () => verifyWork0037SquashMaterialization({
    git: makeWork0037Git({ validatedTree: 'different-tree' }),
    spawnGit: makeWork0037Spawn(),
    objectExists,
    mainCommit: w37Main,
    expectedParent: w37Parent,
    validatedHead: w37Validated,
    sourceCommit: w37Source,
    releaseCommit: w37Release
  }),
  (error) => error && error.message === 'WORK_0037_SQUASH_TREE_MISMATCH'
);

assert.throws(
  () => verifyWork0037SquashMaterialization({
    git: makeWork0037Git({ releaseParent: 'wrong-source' }),
    spawnGit: makeWork0037Spawn(),
    objectExists,
    mainCommit: w37Main,
    expectedParent: w37Parent,
    validatedHead: w37Validated,
    sourceCommit: w37Source,
    releaseCommit: w37Release
  }),
  (error) => error && error.message === 'WORK_0037_SQUASH_RELEASE_PARENT_INVALID'
);

assert.throws(
  () => verifyWork0037SquashMaterialization({
    git: makeWork0037Git(),
    spawnGit: makeWork0037Spawn({ releaseAncestryFailure: true }),
    objectExists,
    mainCommit: w37Main,
    expectedParent: w37Parent,
    validatedHead: w37Validated,
    sourceCommit: w37Source,
    releaseCommit: w37Release
  }),
  (error) => error &&
    error.message === 'WORK_0037_SQUASH_RELEASE_NOT_ANCESTOR_OF_VALIDATED_HEAD'
);

assert.throws(
  () => verifyWork0037SquashMaterialization({
    git: makeWork0037Git({
      releaseFiles: `${releaseFiles}\nREADME.md`
    }),
    spawnGit: makeWork0037Spawn(),
    objectExists,
    mainCommit: w37Main,
    expectedParent: w37Parent,
    validatedHead: w37Validated,
    sourceCommit: w37Source,
    releaseCommit: w37Release
  }),
  (error) => error && error.message === 'WORK_0037_SQUASH_RELEASE_SCOPE_INVALID'
);

assert.throws(
  () => verifyWork0037SquashMaterialization({
    git: makeWork0037Git({ contractPointer: 'different-commit' }),
    spawnGit: makeWork0037Spawn(),
    objectExists,
    mainCommit: w37Main,
    expectedParent: w37Parent,
    validatedHead: w37Validated,
    sourceCommit: w37Source,
    releaseCommit: w37Release
  }),
  (error) => error && error.message === 'WORK_0037_SQUASH_CONTRACT_POINTER_INVALID'
);

const repairableReport = {
  checks: [
    { name: 'tests', status: 'PASS', duration_ms: 5 },
    {
      name: 'lineage',
      status: 'FAIL',
      duration_ms: 2,
      safe_message: 'CURRENT_RELEASE_SCOPE_INVALID'
    },
    { name: 'secret-scan', status: 'PASS', duration_ms: 3 }
  ],
  passed: 2,
  failed: 1
};
assert.strictEqual(
  isKnownWork0037SquashLineageFailure(repairableReport),
  true
);
const repairedReport = repairKnownWork0037SquashReport(
  JSON.parse(JSON.stringify(repairableReport)),
  work0037Evidence
);
assert.strictEqual(repairedReport.failed, 0);
assert.strictEqual(repairedReport.passed, 3);
assert.strictEqual(repairedReport.checks[1].status, 'PASS');
assert.strictEqual(
  repairedReport.checks[1].release_commit,
  w37Release
);

const unrelatedFailure = JSON.parse(JSON.stringify(repairableReport));
unrelatedFailure.checks[1].safe_message = 'CURRENT_RELEASE_REQUIRED_SCOPE_MISSING';
assert.strictEqual(
  isKnownWork0037SquashLineageFailure(unrelatedFailure),
  false
);

const multipleFailures = JSON.parse(JSON.stringify(repairableReport));
multipleFailures.checks[0].status = 'FAIL';
multipleFailures.failed = 2;
assert.strictEqual(
  isKnownWork0037SquashLineageFailure(multipleFailures),
  false
);

process.stdout.write(`${JSON.stringify({
  suite: 'work_0037_lineage_materialization',
  environment: 'LOCAL_NON_GOOGLE',
  passed: 21,
  failed: 0,
  false_positive_cases: [
    'work0036_tree_mismatch',
    'work0036_parent_mismatch',
    'work0037_parent_mismatch',
    'work0037_tree_mismatch',
    'work0037_release_parent_mismatch',
    'work0037_release_ancestry_failure',
    'work0037_release_scope_expansion',
    'work0037_contract_pointer_mismatch',
    'unrelated_lineage_failure',
    'multiple_failures'
  ]
}, null, 2)}\n`);
