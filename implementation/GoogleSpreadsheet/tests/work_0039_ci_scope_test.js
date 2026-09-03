'use strict';

const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { checkScope } = require('../tools/work_0039_validation_gate');

const expectedBranch = 'codex/0039-openai-provider-selection';
const immutablePaths = [
  'CURRENT_CONTRACT.json',
  'candidate/product.txt',
  'candidate/release.txt'
];
const preservedPaths = immutablePaths.concat(['CURRENT_STATUS.md']);

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

function write(repositoryRoot, relativePath, content) {
  const target = path.join(repositoryRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

function commitFile(repositoryRoot, relativePath, content, message) {
  write(repositoryRoot, relativePath, content);
  git(repositoryRoot, ['add', '--', relativePath]);
  git(repositoryRoot, ['commit', '-m', message]);
  return git(repositoryRoot, ['rev-parse', 'HEAD']);
}

function createRepository() {
  const repositoryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'work-0039-main-scope-')
  );
  git(repositoryRoot, ['init', '--initial-branch=main']);
  git(repositoryRoot, ['config', 'user.email', 'synthetic@example.invalid']);
  git(repositoryRoot, ['config', 'user.name', 'Synthetic Test']);
  commitFile(repositoryRoot, 'baseline.txt', 'baseline\n', 'starting main');
  const startingMain = git(repositoryRoot, ['rev-parse', 'HEAD']);

  git(repositoryRoot, ['checkout', '-b', expectedBranch]);
  write(repositoryRoot, 'CURRENT_CONTRACT.json', '{"synthetic":true}\n');
  write(repositoryRoot, 'candidate/product.txt', 'accepted product\n');
  git(repositoryRoot, [
    'add', '--', 'CURRENT_CONTRACT.json', 'candidate/product.txt'
  ]);
  git(repositoryRoot, ['commit', '-m', 'accepted source']);
  const sourceCommit = git(repositoryRoot, ['rev-parse', 'HEAD']);
  write(repositoryRoot, 'CURRENT_STATUS.md', 'accepted candidate\n');
  write(repositoryRoot, 'candidate/release.txt', 'accepted release\n');
  git(repositoryRoot, [
    'add', '--', 'CURRENT_STATUS.md', 'candidate/release.txt'
  ]);
  git(repositoryRoot, ['commit', '-m', 'accepted release']);
  const acceptedHead = git(repositoryRoot, ['rev-parse', 'HEAD']);
  const workHead = commitFile(
    repositoryRoot,
    'integration-gate.txt',
    'integration tooling only\n',
    'integration gate tooling'
  );
  return { repositoryRoot, startingMain, sourceCommit, acceptedHead, workHead };
}

function scopeOptions(state, environment = {}) {
  return {
    git: (args) => git(state.repositoryRoot, args),
    spawnGit: (args) => spawnGit(state.repositoryRoot, args),
    startingMain: state.startingMain,
    expectedBranch,
    environment,
    acceptedProductHead: state.acceptedHead,
    sourceCommit: state.sourceCommit,
    candidateImmutablePaths: immutablePaths,
    integrationPreservedPaths: preservedPaths,
    readContract: () => ({ source_commit: state.sourceCommit })
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

function mainPushEnvironment() {
  return {
    GITHUB_ACTIONS: 'true',
    GITHUB_EVENT_NAME: 'push',
    GITHUB_REF: 'refs/heads/main'
  };
}

function assertError(fn, code) {
  assert.throws(fn, (error) => error && error.message === code);
}

function mergeWorkIntoMain(state, strategy) {
  git(state.repositoryRoot, ['checkout', 'main']);
  commitFile(
    state.repositoryRoot,
    'docs/main-evidence.md',
    'main-side evidence\n',
    'main-side documentation'
  );
  const args = ['merge', '--no-ff'];
  if (strategy) args.push('-s', strategy);
  args.push(expectedBranch, '-m', 'integrate Work 0039');
  git(state.repositoryRoot, args);
  return git(state.repositoryRoot, ['rev-parse', 'HEAD']);
}

function withRepository(callback) {
  const state = createRepository();
  try {
    callback(state);
  } finally {
    fs.rmSync(state.repositoryRoot, { recursive: true, force: true });
  }
}

withRepository((state) => {
  const normal = checkScope(scopeOptions(state));
  assert.strictEqual(normal.checkout, 'BRANCH');
  assert.strictEqual(normal.scope_head, 'HEAD');
  assert.strictEqual(normal.accepted_product_head, state.acceptedHead);
});

withRepository((state) => {
  git(state.repositoryRoot, ['checkout', '-b', 'synthetic-donor']);
  commitFile(state.repositoryRoot, 'donor.txt', 'donor\n', 'donor change');
  git(state.repositoryRoot, ['checkout', expectedBranch]);
  git(state.repositoryRoot, [
    'merge', '--no-ff', 'synthetic-donor', '-m', 'donor merge'
  ]);
  assertError(
    () => checkScope(scopeOptions(state)),
    'DONOR_MERGE_COMMIT_PRESENT'
  );
});

withRepository((state) => {
  const integration = mergeWorkIntoMain(state);
  git(state.repositoryRoot, ['checkout', '--detach', integration]);
  const pullRequest = checkScope(scopeOptions(
    state,
    pullRequestEnvironment()
  ));
  assert.strictEqual(pullRequest.checkout, 'GITHUB_PULL_REQUEST_MERGE');
  assert.strictEqual(pullRequest.scope_head, state.workHead);

  git(state.repositoryRoot, ['checkout', '--detach', state.workHead]);
  assertError(
    () => checkScope(scopeOptions(state, pullRequestEnvironment())),
    'INVALID_PULL_REQUEST_MERGE_SHAPE'
  );
  assertError(
    () => checkScope(scopeOptions(state, pullRequestEnvironment({
      GITHUB_REF: 'refs/heads/main'
    }))),
    'UNEXPECTED_DETACHED_SCOPE'
  );
});

withRepository((state) => {
  const integration = mergeWorkIntoMain(state);
  const main = checkScope(scopeOptions(state));
  assert.strictEqual(main.checkout, 'MAIN');
  assert.strictEqual(main.integration_merge, integration);
  assert.strictEqual(main.work_second_parent, state.workHead);

  git(state.repositoryRoot, ['checkout', '--detach', integration]);
  const githubMain = checkScope(scopeOptions(state, mainPushEnvironment()));
  assert.strictEqual(githubMain.checkout, 'GITHUB_MAIN_PUSH');
  git(state.repositoryRoot, ['checkout', 'main']);

  write(state.repositoryRoot, 'CURRENT_STATUS.md', 'accepted on main\n');
  write(state.repositoryRoot, 'docs/final-status.md', 'final status\n');
  git(state.repositoryRoot, [
    'add', '--', 'CURRENT_STATUS.md', 'docs/final-status.md'
  ]);
  git(state.repositoryRoot, ['commit', '-m', 'document main acceptance']);
  const descendant = checkScope(scopeOptions(state));
  assert.strictEqual(descendant.integration_merge, integration);

  git(state.repositoryRoot, ['checkout', '-b', 'extra-main-side']);
  commitFile(state.repositoryRoot, 'extra.txt', 'extra\n', 'extra side change');
  git(state.repositoryRoot, ['checkout', 'main']);
  git(state.repositoryRoot, [
    'merge', '--no-ff', 'extra-main-side', '-m', 'unexpected extra merge'
  ]);
  assertError(
    () => checkScope(scopeOptions(state)),
    'MAIN_INTEGRATION_MERGE_NOT_UNIQUE'
  );
});

withRepository((state) => {
  git(state.repositoryRoot, ['checkout', '-b', 'synthetic-donor']);
  commitFile(state.repositoryRoot, 'donor.txt', 'donor\n', 'donor change');
  git(state.repositoryRoot, ['checkout', expectedBranch]);
  git(state.repositoryRoot, [
    'merge', '--no-ff', 'synthetic-donor', '-m', 'donor in Work history'
  ]);
  mergeWorkIntoMain(state);
  assertError(
    () => checkScope(scopeOptions(state)),
    'DONOR_MERGE_COMMIT_PRESENT'
  );
});

withRepository((state) => {
  mergeWorkIntoMain(state, 'ours');
  assertError(
    () => checkScope(scopeOptions(state)),
    'MAIN_INTEGRATION_PRODUCT_DRIFT'
  );
});

withRepository((state) => {
  git(state.repositoryRoot, ['checkout', 'main']);
  commitFile(
    state.repositoryRoot,
    'docs/no-integration.md',
    'not integrated\n',
    'documentation without integration'
  );
  assertError(
    () => checkScope(scopeOptions(state)),
    'MAIN_INTEGRATION_MERGE_NOT_UNIQUE'
  );
});

withRepository((state) => {
  mergeWorkIntoMain(state);
  commitFile(
    state.repositoryRoot,
    'candidate/product.txt',
    'drifted product\n',
    'unauthorized product drift'
  );
  assertError(
    () => checkScope(scopeOptions(state)),
    'MAIN_CURRENT_PRODUCT_DRIFT'
  );
});

process.stdout.write(`${JSON.stringify({
  suite: 'work_0039_ci_scope',
  status: 'PASS',
  cases: 12,
  github_actions: 'SYNTHETIC_ONLY',
  main_integration: 'SYNTHETIC_ONLY'
}, null, 2)}\n`);
