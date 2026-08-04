'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const stageA = require('../tools/stage_a_direct_verification');

const moduleRoot = path.resolve(__dirname, '..');
const toolSource = fs.readFileSync(
  path.join(moduleRoot, 'tools', 'stage_a_direct_verification.js'),
  'utf8'
);
const schema = JSON.parse(fs.readFileSync(
  path.join(moduleRoot, 'schemas', 'stage-a-direct-verification-v1.schema.json'),
  'utf8'
));
const fixtures = JSON.parse(fs.readFileSync(
  path.join(moduleRoot, 'fixtures', 'stage-a-direct-verification-v1-fixtures.json'),
  'utf8'
));

const tests = [];
function test(id, body) {
  try {
    body();
    tests.push({ id, status: 'PASS' });
  } catch (error) {
    tests.push({ id, status: 'FAIL', safe_message: String(error.message).slice(0, 120) });
  }
}

function assertNoExecution(result) {
  assert.strictEqual(result.scripts_run, 'NOT_EXECUTED');
  assert.strictEqual(result.clasp_run_function, 'NOT_EXECUTED');
  assert.strictEqual(result.remote_call_performed, false);
  assert.strictEqual(result.target_mutation_performed, false);
  assert.strictEqual(result.probe_staging, 'NOT_EXECUTED');
  assert.strictEqual(result.deployment_creation, 'NOT_EXECUTED');
  assert.strictEqual(result.stage_b_attempt, 'NOT_STARTED');
  assert.strictEqual(result.function_invocation, 'NOT_EXECUTED');
}

test('STAGE-A0-01_SCHEMA_AND_MODULE_REQUIREMENTS_MATCH', () => {
  assert.deepStrictEqual(
    schema.$defs.evidenceStatus.enum,
    stageA.EVIDENCE_STATUSES
  );
  assert.deepStrictEqual(
    schema.$defs.stageA0Evidence.required,
    stageA.STAGE_A0_REQUIREMENTS
  );
});

test('STAGE-A0-02_SOURCE_HAS_NO_ACTIVE_RUNTIME_DEPENDENCIES', () => {
  [
    /process\.env/,
    /\brequire\s*\(/,
    /\bimport\s*(?:\(|[^a-z])/,
    /node:(?:fs|http|https|net|tls|child_process)/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /@google\/clasp|local_clasp_dev|run-function/i,
    /https?:\/\//,
    /googleapis|oauth2client|tokeninfo|userinfo/i
  ].forEach((pattern) => assert.doesNotMatch(toolSource, pattern));
});

test('STAGE-A0-03_OMITTED_EVIDENCE_DEFAULTS_TO_UNKNOWN', () => {
  const normalized = stageA.normalizeEvidence({});
  assert.strictEqual(Object.keys(normalized).length, 18);
  Object.values(normalized).forEach((status) => {
    assert.strictEqual(status, 'UNKNOWN_NOT_EXPOSED');
  });
});

test('STAGE-A0-04_UNKNOWN_KEYS_AND_STATUSES_ARE_REJECTED', () => {
  assert.throws(() => stageA.normalizeEvidence({ unexpected: 'DIRECTLY_VERIFIED' }));
  assert.throws(() => stageA.normalizeEvidence({ automation_off: 'PASS' }));
});

test('STAGE-A0-05_ALL_DIRECT_IS_NO_CALL_PASS', () => {
  const result = stageA.decideStageA0(fixtures.all_direct_synthetic);
  assert.strictEqual(result.outcome, 'STAGE_A0_DIRECT_VERIFICATION_PASS');
  assert.strictEqual(result.status_counts.DIRECTLY_VERIFIED, 18);
  assertNoExecution(result);
});

test('STAGE-A0-06_PLATFORM_EVIDENCE_UNEXPOSED_BLOCKS', () => {
  const result = stageA.decideStageA0(fixtures.platform_evidence_unexposed);
  assert.strictEqual(result.outcome, 'STAGE_A_BLOCKED_NEEDS_OPERATOR_OR_PLATFORM_EVIDENCE');
  assert.deepStrictEqual(result.status_counts, {
    DIRECTLY_VERIFIED: 1,
    LOCALLY_ATTESTED: 12,
    INFERRED: 0,
    UNKNOWN_NOT_EXPOSED: 5,
    CONTRADICTED: 0
  });
  assertNoExecution(result);
});

test('STAGE-A0-07_TARGET_ATTESTATION_NOT_DIRECT_BLOCKS', () => {
  const result = stageA.decideStageA0(fixtures.target_attestation_not_direct);
  assert.strictEqual(result.outcome, 'STAGE_A_BLOCKED_NEEDS_OPERATOR_OR_PLATFORM_EVIDENCE');
  assert.strictEqual(result.status_counts.LOCALLY_ATTESTED, 1);
  assert.strictEqual(result.status_counts.UNKNOWN_NOT_EXPOSED, 17);
  assertNoExecution(result);
});

test('STAGE-A0-08_CONTRADICTION_FAILS_CLOSED', () => {
  const result = stageA.decideStageA0(fixtures.contradicted);
  assert.strictEqual(result.outcome, 'STAGE_A_FAILED_CLOSED');
  assert.strictEqual(result.status_counts.CONTRADICTED, 1);
  assertNoExecution(result);
});

const failed = tests.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({ suite: 'stage_a_direct_verification', passed: tests.length - failed.length, failed: failed.length, tests: failed })}\n`);
process.exitCode = failed.length ? 1 : 0;
