'use strict';

const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { checkScope } = require('../tools/work_0039_validation_gate');

const expectedBranch = 'codex/0039-openai-provider-selection';

function spawnGit(repositoryRoot, args) {
  return childProcess.spawnSync('git', ['-C', repositoryRoot].concat(args), {
    encoding: 'utf8',
    windowsHide: true
  });
}

function git(repositoryRoot, args) {
  const result = spawnGit(repositoryRoot, args);
  assert.strictEqual(result.status, 0, result.stderr || result.stdout);
  return String(result.stdout || '').trim();
}

function options(repositoryRoot, startingMain, environment = {}) {
  return {
    git: (args) => git(repositoryRoot, args),
    spawnGit: (args) => spawnGit(repositoryRoot, args),
    startingMain,
    expectedBranch,
    environment,
    readContract: () => ({})
  };
}

function pullRequestEnvironment(overrides = {}) {
  return Object.assign({
    GITHUB_ACTIONS: 'true',
    GITHUB_EVENT_NAME: 'pull_request',
    GITHUB_HEAD_REF: expectedBranch,
    GITHUB_REF: 'refs/pull/55/merge'
  }, overrides);
}

const repositoryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'work-0039-ci-scope-'));
try {
  git(repositoryRoot, ['init', '--initial-branch=main']);
  git(repositoryRoot, ['config', 'user.email', 'synthetic@example.invalid']);
  git(repositoryRoot, ['config', 'user.name', 'Synthetic Test']);
  fs.writeFileSync(path.join(repositoryRoot, 'baseline.txt'), 'baseline\n', 'utf8');
  git(repositoryRoot, ['add', 'baseline.txt']);
  git(repositoryRoot, ['commit', '-m', 'starting main']);
  const startingMain = git(repositoryRoot, ['rev-parse', 'HEAD']);

  git(repositoryRoot, ['checkout', '-b', expectedBranch]);
  fs.writeFileSync(path.join(repositoryRoot, 'candidate.txt'), 'candidate\n', 'utf8');
  git(repositoryRoot, ['add', 'candidate.txt']);
  git(repositoryRoot, ['commit', '-m', 'candidate head']);
  const cleanHead = git(repositoryRoot, ['rev-parse', 'HEAD']);
  const normal = checkScope(options(repositoryRoot, startingMain));
  assert.strictEqual(normal.checkout, 'BRANCH');
  assert.strictEqual(normal.scope_head, 'HEAD');

  git(repositoryRoot, ['checkout', 'main']);
  fs.writeFileSync(path.join(repositoryRoot, 'base.txt'), 'base update\n', 'utf8');
  git(repositoryRoot, ['add', 'base.txt']);
  git(repositoryRoot, ['commit', '-m', 'base update']);
  git(repositoryRoot, ['merge', '--no-ff', cleanHead, '-m', 'synthetic PR merge']);
  const syntheticMerge = git(repositoryRoot, ['rev-parse', 'HEAD']);
  git(repositoryRoot, ['checkout', '--detach', syntheticMerge]);
  const synthetic = checkScope(options(
    repositoryRoot,
    startingMain,
    pullRequestEnvironment()
  ));
  assert.strictEqual(synthetic.checkout, 'GITHUB_PULL_REQUEST_MERGE');
  assert.strictEqual(synthetic.scope_head, cleanHead);

  git(repositoryRoot, ['checkout', '--detach', cleanHead]);
  assert.throws(
    () => checkScope(options(
      repositoryRoot,
      startingMain,
      pullRequestEnvironment()
    )),
    (error) => error && error.message === 'INVALID_PULL_REQUEST_MERGE_SHAPE'
  );
  assert.throws(
    () => checkScope(options(
      repositoryRoot,
      startingMain,
      pullRequestEnvironment({ GITHUB_REF: 'refs/heads/main' })
    )),
    (error) => error && error.message === 'UNEXPECTED_DETACHED_SCOPE'
  );

  git(repositoryRoot, ['checkout', expectedBranch]);
  git(repositoryRoot, ['checkout', '-b', 'synthetic-donor']);
  fs.writeFileSync(path.join(repositoryRoot, 'donor.txt'), 'donor\n', 'utf8');
  git(repositoryRoot, ['add', 'donor.txt']);
  git(repositoryRoot, ['commit', '-m', 'donor change']);
  git(repositoryRoot, ['checkout', expectedBranch]);
  git(repositoryRoot, ['merge', '--no-ff', 'synthetic-donor', '-m', 'donor merge']);
  assert.throws(
    () => checkScope(options(repositoryRoot, startingMain)),
    (error) => error && error.message === 'DONOR_MERGE_COMMIT_PRESENT'
  );
} finally {
  fs.rmSync(repositoryRoot, { recursive: true, force: true });
}

process.stdout.write(`${JSON.stringify({
  suite: 'work_0039_ci_scope',
  status: 'PASS',
  cases: 4,
  github_actions: 'SYNTHETIC_ONLY'
}, null, 2)}\n`);
