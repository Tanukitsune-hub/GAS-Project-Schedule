'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  canonicalPayloadFileNames,
  claspProjectConfig
} = require('../tools/local_clasp_dev');
const {
  GateError,
  expectedWork0006Fingerprint,
  isExactWork0007Branch,
  validateWork0006Evidence,
  initialReadState,
  claimReadAttempt,
  classifyRemoteContent,
  normalizeCommand
} = require('../tools/work_0007_remote_content_inspector');

const tests = [];
function test(id, body) {
  try {
    body();
    tests.push({ id, status: 'PASS' });
  } catch (error) {
    tests.push({
      id, status: 'FAIL',
      safe_message: String(error && (error.code || error.message) || error)
    });
  }
}

const scriptId = 's'.repeat(32);
const parentId = 'p'.repeat(32);
const principalFingerprint = 'a'.repeat(64);
const config = claspProjectConfig(scriptId);
const target = {
  schema: 'WORK_OS_PERSONAL_SYNTHETIC_TARGET_V2',
  work_id: '0006',
  target_kind: 'PERSONAL_SYNTHETIC_DEV',
  target_disposition: 'FRESH_SYNTHETIC_CREATED',
  expected_script_id: scriptId,
  expected_parent_id: parentId,
  principal_fingerprint: principalFingerprint,
  target_fingerprint: expectedWork0006Fingerprint
};
const state = {
  schema: 'WORK_OS_SYNTHETIC_TARGET_CREATION_V3',
  work_id: '0006',
  create_attempt_count: 1,
  inspection_attempt_count: 1,
  push_attempt_count: 1,
  pull_attempt_count: 1,
  phase: 'PULL_ATTEMPT_STARTED',
  script_id: scriptId,
  parent_id: parentId,
  principal_fingerprint: principalFingerprint,
  target_fingerprint: expectedWork0006Fingerprint
};

function canonicalRemoteFiles() {
  return canonicalPayloadFileNames.map((name) => {
    if (name === 'appsscript.json') {
      return { name: 'appsscript', type: 'JSON', source: '{}' };
    }
    return {
      name: path.parse(name).name,
      type: 'SERVER_JS',
      source: 'function synthetic() {}\n'
    };
  });
}

test('EXACT_WORK_0007_BRANCH_ONLY', () => {
  assert.strictEqual(isExactWork0007Branch(
    'codex/0007-remote-content-diagnosis-ci-scope'
  ), true);
  assert.strictEqual(isExactWork0007Branch(
    'codex/0006-fresh-controlled-remote-placement'
  ), false);
});

test('WORK_0006_CONSUMED_EVIDENCE_BINDS_EXACT_TARGET', () => {
  assert.deepStrictEqual(validateWork0006Evidence(config, target, state), {
    scriptId,
    targetFingerprint: expectedWork0006Fingerprint
  });
});

test('WRONG_WORK_OR_FINGERPRINT_IS_REJECTED', () => {
  assert.throws(
    () => validateWork0006Evidence(
      config, Object.assign({}, target, { work_id: '0004' }), state
    ),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0006_TARGET_EVIDENCE_INVALID'
  );
  assert.throws(
    () => validateWork0006Evidence(
      config, Object.assign({}, target, {
        target_fingerprint: '0'.repeat(64)
      }), state
    ),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0006_TARGET_EVIDENCE_INVALID'
  );
});

test('UNCONSUMED_OR_COMPLETED_MUTATION_STATE_IS_REJECTED', () => {
  assert.throws(
    () => validateWork0006Evidence(
      config, target, Object.assign({}, state, { phase: 'PULL_PARITY_PASS' })
    ),
    (error) => error instanceof GateError &&
      error.code === 'WORK_0006_TARGET_EVIDENCE_INVALID'
  );
});

test('READ_STATE_CONTAINS_NO_TARGET_IDENTIFIER', () => {
  const readState = initialReadState(expectedWork0006Fingerprint);
  const serialized = JSON.stringify(readState);
  assert.strictEqual(readState.read_attempt_count, 1);
  assert.strictEqual(readState.phase, 'READ_ATTEMPT_STARTED');
  assert.strictEqual(serialized.includes(scriptId), false);
  assert.strictEqual(serialized.includes(parentId), false);
});

test('READ_ATTEMPT_CLAIM_IS_ATOMIC_AND_ONE_USE', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'work-0007-read-claim-'));
  const readStatePath = path.join(root, 'state.json');
  try {
    claimReadAttempt(expectedWork0006Fingerprint, readStatePath);
    assert.throws(
      () => claimReadAttempt(expectedWork0006Fingerprint, readStatePath),
      (error) => error instanceof GateError &&
        error.code === 'WORK_0007_CONTENT_READ_ALREADY_ATTEMPTED'
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('MANIFEST_ONLY_REMOTE_CONTENT_IS_CLOSED_CLASSIFICATION', () => {
  assert.deepStrictEqual(classifyRemoteContent([{
    name: 'appsscript', type: 'JSON', source: '{}'
  }]), {
    classification: 'REMOTE_HAS_MANIFEST_ONLY',
    total_file_count: 1,
    server_js_file_count: 0,
    manifest_file_count: 1,
    html_file_count: 0,
    invalid_file_count: 0,
    missing_file_count: 22,
    extra_file_count: 0
  });
});

test('CANONICAL_REMOTE_CONTENT_IS_CLOSED_CLASSIFICATION', () => {
  assert.deepStrictEqual(classifyRemoteContent(canonicalRemoteFiles()), {
    classification: 'REMOTE_HAS_23_CANONICAL_FILES',
    total_file_count: 23,
    server_js_file_count: 22,
    manifest_file_count: 1,
    html_file_count: 0,
    invalid_file_count: 0,
    missing_file_count: 0,
    extra_file_count: 0
  });
});

test('UNEXPECTED_REMOTE_SHAPE_FAILS_CLOSED', () => {
  const result = classifyRemoteContent([
    { name: 'appsscript', type: 'JSON', source: '{}' },
    { name: '../unsafe', type: 'SERVER_JS', source: '' }
  ]);
  assert.strictEqual(result.classification, 'REMOTE_CONTENT_OTHER');
  assert.strictEqual(result.invalid_file_count, 1);
});

test('ARBITRARY_COMMAND_IS_REDUCED_TO_CLOSED_ENUM', () => {
  assert.strictEqual(normalizeCommand('inspect-content'), 'inspect-content');
  assert.strictEqual(normalizeCommand('evidence'), 'evidence');
  assert.strictEqual(normalizeCommand('account@example.invalid'), 'UNKNOWN');
});

const failed = tests.filter((item) => item.status !== 'PASS');
process.stdout.write(`${JSON.stringify({
  suite: 'work_0007_remote_content_inspector',
  environment: 'LOCAL_NON_GOOGLE_SYNTHETIC_ONLY',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
  google_operation: 'NOT_EXECUTED'
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
