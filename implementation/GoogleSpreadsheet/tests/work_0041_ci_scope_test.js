'use strict';

const assert = require('node:assert/strict');
const cp = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { checkScope, expectedBranch } = require('../tools/work_0041_validation_gate');
const product = 'implementation/GoogleSpreadsheet/apps-script-v2/18_Worker.gs';
let cases = 0;

function fixture(body) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'work-0041-scope-'));
  const git = args => cp.execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
  const commit = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), text + '\n');
    git(['add', '--', file]);
    git(['commit', '-m', 'synthetic fixture']);
    return git(['rev-parse', 'HEAD']);
  };
  try {
    git(['init', '--initial-branch=main']);
    git(['config', 'user.name', 'Synthetic']);
    git(['config', 'user.email', 'synthetic@example.invalid']);
    const base = commit('baseline.txt', 'baseline');
    git(['checkout', '-b', expectedBranch]);
    const source = commit(product, 'synthetic source');
    const work = commit('CURRENT_CONTRACT.json', '{"synthetic":true}');
    const check = (env = {}, sourceCommit = source) => checkScope({
      git, startingMain: base, readContract: () => ({ source_commit: sourceCommit }), env
    });
    const integrate = (strategy = []) => {
      git(['checkout', 'main']);
      commit('docs/main.md', 'synthetic main documentation');
      git(['merge', '--no-ff', ...strategy, expectedBranch, '-m', 'synthetic integration']);
      return git(['rev-parse', 'HEAD']);
    };
    const donor = () => {
      git(['checkout', '-b', 'synthetic-donor']);
      commit('donor.txt', 'donor');
      git(['checkout', expectedBranch]);
      git(['merge', '--no-ff', 'synthetic-donor', '-m', 'donor']);
    };
    body({ git, commit, check, integrate, donor, source, work });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
function pass(body) { body(); cases += 1; }
function rejects(body, pattern) { assert.throws(body, pattern); cases += 1; }
const pr = {
  GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'pull_request',
  GITHUB_REF: 'refs/pull/999/merge', GITHUB_BASE_REF: 'main', GITHUB_HEAD_REF: expectedBranch
};
const main = { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/heads/main' };

fixture(f => {
  pass(() => assert.equal(f.check().context, 'WORK_BRANCH'));
  f.git(['checkout', '--detach', f.work]);
  rejects(() => f.check(), /WORK_0041_SCOPE_INVALID/);
  rejects(() => f.check(pr), /PR_MERGE_SHAPE_INVALID/);
  const merge = f.integrate();
  pass(() => assert.equal(f.check().context, 'MAIN_INTEGRATION'));
  f.git(['checkout', '--detach', merge]);
  pass(() => assert.equal(f.check(pr).scope_head, f.work));
  pass(() => assert.equal(f.check(main).scope_head, f.work));
  rejects(() => f.check({ ...pr, GITHUB_BASE_REF: 'other' }), /WORK_0041_SCOPE_INVALID/);
  rejects(() => f.check({ ...pr, GITHUB_REF: 'refs/heads/main' }), /WORK_0041_SCOPE_INVALID/);
  rejects(() => f.check({ ...pr, GITHUB_HEAD_REF: 'wrong' }), /WORK_0041_SCOPE_INVALID/);
  f.git(['checkout', 'main']);
  f.commit('docs/after.md', 'documentation-only descendant');
  pass(() => assert.equal(f.check().scope_head, f.work));
  f.git(['checkout', '-b', 'extra']);
  f.commit('extra.txt', 'extra');
  f.git(['checkout', 'main']);
  f.git(['merge', '--no-ff', 'extra', '-m', 'extra merge']);
  rejects(() => f.check(), /MAIN_INTEGRATION_MERGE_NOT_UNIQUE/);
});
fixture(f => {
  f.donor();
  rejects(() => f.check(), /DONOR_MERGE_COMMIT_PRESENT/);
  const merge = f.integrate();
  rejects(() => f.check(), /MAIN_PRODUCT_OR_HISTORY_DRIFT/);
  f.git(['checkout', '--detach', merge]);
  rejects(() => f.check(pr), /DONOR_MERGE_COMMIT_PRESENT/);
});
fixture(f => {
  const merge = f.integrate(['-s', 'ours']);
  rejects(() => f.check(), /MAIN_PRODUCT_OR_HISTORY_DRIFT/);
  f.git(['checkout', '--detach', merge]);
  rejects(() => f.check(pr), /PR_PRODUCT_DRIFT/);
});
fixture(f => {
  f.integrate();
  f.commit(product, 'product drift');
  rejects(() => f.check(), /MAIN_PRODUCT_OR_HISTORY_DRIFT/);
});
fixture(f => {
  f.commit('AGENTS.md', 'unexpected governance change');
  rejects(() => f.check(), /GOVERNANCE_DRIFT/);
});
fixture(f => {
  f.git(['checkout', 'main']);
  const unrelatedSource = f.commit('main-source.txt', 'not Work source');
  f.git(['checkout', expectedBranch]);
  rejects(() => f.check({}, unrelatedSource));
});

process.stdout.write(JSON.stringify({ suite: 'work_0041_ci_scope', passed: cases, failed: 0,
  github_actions: 'SYNTHETIC_ONLY', main_integration: 'SYNTHETIC_ONLY' }, null, 2) + '\n');
