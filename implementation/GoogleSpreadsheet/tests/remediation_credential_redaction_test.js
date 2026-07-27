'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'apps-script-v2');
const sandbox = {
  Date,
  JSON,
  Math,
  Number,
  Object,
  String,
  Boolean,
  Array,
  Error,
  RegExp,
  Utilities: {
    getUuid: () => crypto.randomUUID(),
    computeDigest: (_algorithm, value) =>
      Array.from(
        crypto.createHash('sha256').update(String(value), 'utf8').digest()
      ).map((byte) => (byte > 127 ? byte - 256 : byte)),
    formatDate: (date) => date.toISOString().slice(0, 10),
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    Charset: { UTF_8: 'UTF_8' }
  }
};
vm.createContext(sandbox);
[
  '00_Config.gs',
  '01_TypesAndSchemas.gs',
  '17_Utilities.gs',
  '07_AiAdapter.gs',
  '08_TaskRepository.gs',
  '10_CalendarSync.gs'
].forEach((name) => {
  vm.runInContext(
    fs.readFileSync(path.join(sourceRoot, name), 'utf8'),
    sandbox,
    { filename: name }
  );
});

const UtilitiesModule = sandbox.WorkOsUtilities;
const AI = sandbox.WorkOsAiAdapter;
const Repository = sandbox.WorkOsTaskRepository;
const Calendar = sandbox.WorkOsCalendarSync;
const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, status: 'PASS' });
  } catch (error) {
    results.push({ name, status: 'FAIL', message: error.message });
  }
}

function syntheticSecrets() {
  return [
    ['sk', 'proj', 'A'.repeat(30)].join('-'),
    `AIza${'B'.repeat(35)}`,
    `eyJ${'C'.repeat(18)}.${'D'.repeat(18)}.${'E'.repeat(18)}`,
    `ghp_${'F'.repeat(30)}`,
    `xoxb-${'1'.repeat(12)}-${'G'.repeat(24)}`,
    `ya29.${'H'.repeat(30)}`,
    [
      '-----BEGIN PRIVATE KEY-----',
      'SYNTHETIC_NOT_A_REAL_KEY',
      '-----END PRIVATE KEY-----'
    ].join('\n')
  ];
}

function validOutput(taskTitle) {
  return {
    schema_version: sandbox.WorkOsConfig.AI_SCHEMA_VERSION,
    overall_confidence: 0.95,
    actions: [{
      action_type: 'NEW_TASK',
      target_task_id: null,
      task_title: taskTitle,
      deadline: '2026-07-31',
      suggested_deadline: null,
      deadline_basis: 'EXPLICIT',
      priority: 'MEDIUM',
      waiting_for_reply: false,
      needs_review: false,
      calendar_category: 'NONE',
      calendar_importance: 'LOW',
      confidence: 0.95,
      reason: 'Synthetic fixture',
      changes: {}
    }],
    warnings: []
  };
}

test('R-SECRET-01_HIGH_CONFIDENCE_CORPUS_IS_DETECTED_AND_REDACTED', () => {
  syntheticSecrets().forEach((secret) => {
    assert.strictEqual(
      UtilitiesModule.containsHighConfidenceSecret(secret),
      true
    );
    const redacted = UtilitiesModule.redact(`prefix ${secret} suffix`);
    assert.strictEqual(redacted.includes(secret), false);
    assert.ok(redacted.includes('[REDACTED_'));
  });
});

test('R-SECRET-02_BENIGN_CORPUS_IS_PRESERVED', () => {
  [
    '550e8400-e29b-41d4-a716-446655440000',
    '2026-07-25',
    'TASK-2026-0042',
    'secret sauce recipe',
    'API key rotation policy',
    'https://example.invalid/tasks/42'
  ].forEach((value) => {
    assert.strictEqual(
      UtilitiesModule.containsHighConfidenceSecret(value),
      false
    );
    assert.strictEqual(UtilitiesModule.redact(value), value);
  });
});

test('R-SECRET-03_TASK_AND_PENDING_SINKS_ARE_SANITIZED', () => {
  const secret = syntheticSecrets()[0];
  const sanitized = Repository.sanitizeTaskForPersistence({
    task_title: `Review ${secret}`,
    sender: `Fixture ${secret}`,
    subject: `Subject ${secret}`,
    pending_changes_json: {
      changes: { task_title: `Pending ${secret}` }
    }
  });
  const serialized = JSON.stringify(sanitized);
  assert.strictEqual(serialized.includes(secret), false);
  assert.ok(serialized.includes('[REDACTED_SECRET]'));
});

test('R-SECRET-04_TASK_FORMULA_PREFIX_IS_NEUTRALIZED', () => {
  const secret = syntheticSecrets()[1];
  const sanitized = Repository.sanitizeTaskForPersistence({
    task_title: `=HYPERLINK("https://example.invalid/?token=${secret}")`
  });
  assert.ok(sanitized.task_title.startsWith('\u200B='));
  assert.strictEqual(sanitized.task_title.includes(secret), false);
});

test('R-SECRET-05_EXTERNAL_AI_OUTPUT_IS_REVIEW_ONLY_AFTER_REDACTION', () => {
  const secret = syntheticSecrets()[2];
  const output = AI.parseCanonicalResponse({
    status: 200,
    body: JSON.stringify(validOutput(`Review ${secret}`))
  }, { max_response_chars: 100000 });
  assert.strictEqual(JSON.stringify(output).includes(secret), false);
  assert.strictEqual(output.actions[0].needs_review, true);
  assert.ok(output.warnings.includes(
    'SENSITIVE_OUTPUT_REDACTED_REVIEW_REQUIRED'
  ));
});

test('R-SECRET-06_CALENDAR_SUMMARY_AND_DESCRIPTION_ARE_SANITIZED', () => {
  const secret = syntheticSecrets()[3];
  const resource = Calendar.buildEventResource({
    task_id: `tsk_${'a'.repeat(32)}`,
    task_title: `Synthetic ${secret}`,
    sender: `Sender ${secret}`,
    due_date: '2026-07-31',
    deadline_basis: 'EXPLICIT',
    source_email: `https://example.invalid/?token=${secret}`,
    calendar_category: 'EXTERNAL_SUBMISSION',
    calendar_importance: 'MEDIUM'
  }, `ins_${'b'.repeat(32)}`);
  const serialized = JSON.stringify(resource);
  assert.strictEqual(serialized.includes(secret), false);
  assert.ok(serialized.includes('[REDACTED'));
});

test('R-SECRET-07_SAFE_ERROR_NEVER_RETURNS_RAW_SECRET', () => {
  const secret = syntheticSecrets()[4];
  const safe = UtilitiesModule.safeError(
    new sandbox.WorkOsAppError(
      'E_SYNTHETIC',
      'SECURITY_TEST',
      false,
      `Synthetic failure ${secret}`
    ),
    'SECURITY_TEST'
  );
  assert.strictEqual(JSON.stringify(safe).includes(secret), false);
  assert.ok(safe.safe_message.includes('[REDACTED_SECRET]'));
});

const failed = results.filter((item) => item.status === 'FAIL');
console.log(JSON.stringify({
  suite: 'remediation_credential_redaction',
  environment: 'LOCAL_SYNTHETIC_ONLY',
  real_credentials: 'NOT_USED',
  passed: results.length - failed.length,
  failed: failed.length,
  tests: results
}, null, 2));
if (failed.length) {
  process.exitCode = 1;
}
