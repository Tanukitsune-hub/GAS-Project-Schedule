'use strict';

const assert = require('node:assert');
const {
  isAllowedScopeBranch,
  isCleanTreeMaterialization
} = require('../tools/local_validation_gate');

assert.strictEqual(isAllowedScopeBranch('main'), true);
assert.strictEqual(
  isAllowedScopeBranch('codex/0036-personal-automation-qualification'),
  true
);
assert.strictEqual(isAllowedScopeBranch('feature/arbitrary'), false);

const cleanTree = isCleanTreeMaterialization({
  spawnGit: (args) => {
    const candidate = args.join(' ');
    if (candidate.includes('b321d83e29ba04557cbed87b75accc746144da6c')) {
      return { status: 1, error: null };
    }
    if (candidate.includes('ee2e4a06e21f1755d6c735ef8dbfb25a698ecf2e')) {
      return { status: 0, error: null };
    }
    throw new Error('UNEXPECTED_SYNTHETIC_GIT_COMMAND');
  }
});
assert.strictEqual(cleanTree, true);

const historicalStack = isCleanTreeMaterialization({
  spawnGit: (args) => {
    const candidate = args.join(' ');
    if (candidate.includes('b321d83e29ba04557cbed87b75accc746144da6c')) {
      return { status: 0, error: null };
    }
    throw new Error('INTEGRATION_ANCESTRY_MUST_NOT_RUN');
  }
});
assert.strictEqual(historicalStack, false);

const unrelatedTree = isCleanTreeMaterialization({
  spawnGit: (args) => {
    const candidate = args.join(' ');
    if (candidate.includes('b321d83e29ba04557cbed87b75accc746144da6c')) {
      return { status: 1, error: null };
    }
    if (candidate.includes('ee2e4a06e21f1755d6c735ef8dbfb25a698ecf2e')) {
      return { status: 1, error: null };
    }
    throw new Error('UNEXPECTED_SYNTHETIC_GIT_COMMAND');
  }
});
assert.strictEqual(unrelatedTree, false);

assert.throws(
  () => isCleanTreeMaterialization({
    spawnGit: () => ({ status: 2, error: null })
  }),
  (error) => error &&
    error.message === 'HISTORICAL_RELEASE_ANCESTRY_UNAVAILABLE'
);

process.stdout.write(`${JSON.stringify({
  suite: 'work_0035_main_post_merge_gate',
  environment: 'LOCAL_NON_GOOGLE',
  passed: 7,
  failed: 0
}, null, 2)}\n`);
