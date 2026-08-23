'use strict';

const assert = require('node:assert');
const {
  isAllowedScopeBranch,
  verifyWork0036SquashMaterialization
} = require('../tools/local_validation_gate');

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

process.stdout.write(`${JSON.stringify({
  suite: 'work_0037_lineage_materialization',
  environment: 'LOCAL_NON_GOOGLE',
  passed: 8,
  failed: 0,
  false_positive_cases: ['tree_mismatch', 'parent_mismatch']
}, null, 2)}\n`);
