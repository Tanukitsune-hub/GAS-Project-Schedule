'use strict';

const assert = require('node:assert');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { checkRepositoryScope } = require('../tools/local_validation_gate');

const expectedBranch = 'codex/0002-clean-integration-candidate';
const work0003Branch = 'codex/0003-controlled-remote-placement';
const work0004Branch = 'codex/0004-controlled-synthetic-placement';

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

function scopeOptions(repositoryRoot, startingMain, environment) {
  return {
    git: (args) => git(repositoryRoot, args),
    spawnGit: (args) => spawnGit(repositoryRoot, args),
    startingMain,
    expectedBranch,
    environment
  };
}

function pullRequestEnvironment() {
  return {
    GITHUB_ACTIONS: 'true',
    GITHUB_EVENT_NAME: 'pull_request',
    GITHUB_HEAD_REF: expectedBranch,
    GITHUB_REF: 'refs/pull/99/merge'
  };
}

const repositoryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'work-os-pr-merge-scope-'));
try {
  git(repositoryRoot, ['init', '--initial-branch=main']);
  git(repositoryRoot, ['config', 'user.email', 'synthetic@example.invalid']);
  git(repositoryRoot, ['config', 'user.name', 'Synthetic Test']);
  fs.writeFileSync(path.join(repositoryRoot, 'AGENTS.md'), 'synthetic governance\n', 'utf8');
  git(repositoryRoot, ['add', 'AGENTS.md']);
  git(repositoryRoot, ['commit', '-m', 'starting main']);
  const startingMain = git(repositoryRoot, ['rev-parse', 'HEAD']);

  git(repositoryRoot, ['checkout', '-b', 'base-side']);
  fs.writeFileSync(path.join(repositoryRoot, 'base-side.txt'), 'base side\n', 'utf8');
  git(repositoryRoot, ['add', 'base-side.txt']);
  git(repositoryRoot, ['commit', '-m', 'base side change']);
  git(repositoryRoot, ['checkout', 'main']);
  git(repositoryRoot, ['merge', '--no-ff', 'base-side', '-m', 'base merge']);

  git(repositoryRoot, ['checkout', '-b', expectedBranch, startingMain]);
  fs.writeFileSync(path.join(repositoryRoot, 'candidate.txt'), 'candidate\n', 'utf8');
  git(repositoryRoot, ['add', 'candidate.txt']);
  git(repositoryRoot, ['commit', '-m', 'candidate head']);
  const cleanHead = git(repositoryRoot, ['rev-parse', 'HEAD']);

  git(repositoryRoot, ['checkout', 'main']);
  git(repositoryRoot, ['merge', '--no-ff', expectedBranch, '-m', 'synthetic PR merge']);
  const allowedSyntheticMerge = git(repositoryRoot, ['rev-parse', 'HEAD']);
  git(repositoryRoot, ['checkout', '--detach', allowedSyntheticMerge]);

  const allowed = checkRepositoryScope(
    scopeOptions(repositoryRoot, startingMain, pullRequestEnvironment())
  );
  assert.strictEqual(allowed.checkout, 'GITHUB_PULL_REQUEST_MERGE');

  const work0003Allowed = checkRepositoryScope(Object.assign(
    scopeOptions(repositoryRoot, startingMain, Object.assign(
      pullRequestEnvironment(), { GITHUB_HEAD_REF: work0003Branch }
    )),
    { allowedBranches: [expectedBranch, work0003Branch] }
  ));
  assert.strictEqual(work0003Allowed.checkout, 'GITHUB_PULL_REQUEST_MERGE');

  const work0004Allowed = checkRepositoryScope(Object.assign(
    scopeOptions(repositoryRoot, startingMain, Object.assign(
      pullRequestEnvironment(), { GITHUB_HEAD_REF: work0004Branch }
    )),
    { allowedBranches: [expectedBranch, work0003Branch, work0004Branch] }
  ));
  assert.strictEqual(work0004Allowed.checkout, 'GITHUB_PULL_REQUEST_MERGE');

  assert.throws(
    () => checkRepositoryScope(scopeOptions(repositoryRoot, startingMain, Object.assign(
      pullRequestEnvironment(), { GITHUB_HEAD_REF: 'unexpected-branch' }
    ))),
    (error) => error && error.message === 'UNEXPECTED_GITHUB_HEAD_REF'
  );

  git(repositoryRoot, ['checkout', expectedBranch]);
  git(repositoryRoot, ['checkout', '-b', 'synthetic-side']);
  fs.writeFileSync(path.join(repositoryRoot, 'side.txt'), 'side\n', 'utf8');
  git(repositoryRoot, ['add', 'side.txt']);
  git(repositoryRoot, ['commit', '-m', 'side change']);
  git(repositoryRoot, ['checkout', expectedBranch]);
  git(repositoryRoot, ['merge', '--no-ff', 'synthetic-side', '-m', 'merge in PR head']);
  const mergedHead = git(repositoryRoot, ['rev-parse', 'HEAD']);

  git(repositoryRoot, ['checkout', 'main']);
  git(repositoryRoot, ['merge', '--no-ff', expectedBranch, '-m', 'synthetic PR merge rejected head']);
  const rejectedSyntheticMerge = git(repositoryRoot, ['rev-parse', 'HEAD']);
  git(repositoryRoot, ['checkout', '--detach', rejectedSyntheticMerge]);

  assert.throws(
    () => checkRepositoryScope(
      scopeOptions(repositoryRoot, startingMain, pullRequestEnvironment())
    ),
    (error) => error && error.message === 'DONOR_MERGE_COMMIT_PRESENT'
  );
  assert.strictEqual(
    git(repositoryRoot, ['rev-parse', 'HEAD^2']),
    mergedHead,
    'the synthetic merge must select the actual PR head as its second parent'
  );
  assert.notStrictEqual(cleanHead, mergedHead);
} finally {
  fs.rmSync(repositoryRoot, { recursive: true, force: true });
}

process.stdout.write(`${JSON.stringify({
  suite: 'local_validation_gate_pr_merge_scope',
  environment: 'LOCAL_NON_GOOGLE',
  passed: 5,
  failed: 0,
  github_actions: 'SYNTHETIC_ONLY'
}, null, 2)}\n`);
