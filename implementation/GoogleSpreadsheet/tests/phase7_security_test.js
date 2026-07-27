'use strict';

/**
 * Phase 7 security and information-management checks.
 *
 * These checks are local/static. They do not assert company/provider approval.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const apps = path.resolve(__dirname, '..', 'apps-script-v2');
const gsFiles = fs.readdirSync(apps).filter((name) => name.endsWith('.gs'));
const allSource = gsFiles.map((name) => ({
  name,
  source: fs.readFileSync(path.join(apps, name), 'utf8')
}));
const byName = Object.fromEntries(allSource.map((entry) => [entry.name, entry.source]));
const manifest = JSON.parse(
  fs.readFileSync(path.join(apps, 'appsscript.json'), 'utf8')
);

function between(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert(startIndex >= 0, `Missing start marker: ${start}`);
  assert(endIndex > startIndex, `Missing end marker: ${end}`);
  return source.slice(startIndex, endIndex);
}

const recordError = between(
  byName['13_LogAndDeadLetter.gs'],
  'function recordOperationalError(',
  'function appendRunSummary('
);
const manualRetry = between(
  byName['13_LogAndDeadLetter.gs'],
  'function requestedRetryRecord(',
  'function retrySelectedDeadLetters(options)'
);
const diagnostics = byName['16_Diagnostics.gs'];

const results = [];
function test(id, body) {
  const startedAt = Date.now();
  try {
    body();
    results.push({ id, status: 'PASS', duration_ms: Date.now() - startedAt });
  } catch (error) {
    results.push({
      id,
      status: 'FAIL',
      duration_ms: Date.now() - startedAt,
      message: String(error && error.message || error)
    });
  }
}

test('P7-SEC01_NO_REAL_NETWORK_IMPLEMENTATION_OR_SCOPE', () => {
  allSource.forEach(({ name, source }) => {
    assert.strictEqual(/\bUrlFetchApp\s*\./.test(source), false, name);
  });
  assert.strictEqual(
    manifest.oauthScopes.includes(
      'https://www.googleapis.com/auth/script.external_request'
    ),
    false
  );
});

test('P7-SEC02_PROVIDER_AND_APPROVAL_DEFAULTS_FAIL_CLOSED', () => {
  const config = byName['00_Config.gs'];
  assert.match(config, /EXTERNAL_AI_ENABLED:\s*false/);
  assert.match(config, /EXTERNAL_AI_COMPANY_APPROVED:\s*false/);
  assert.match(config, /EXTERNAL_AI_DATA_POLICY_APPROVED:\s*false/);
  assert.match(config, /EXTERNAL_AI_CREDENTIAL_STORAGE_APPROVED:\s*false/);
  assert.match(config, /EXTERNAL_AI_AUTH_CONFIGURED:\s*false/);
  assert.match(config, /EXTERNAL_AI_PROVIDER:\s*''/);
  assert.match(config, /EXTERNAL_AI_MODEL:\s*''/);
});

test('P7-SEC03_NO_GUESSED_PROVIDER_ENDPOINT_OR_PRODUCTION_MODEL', () => {
  const productionSources = allSource
    .filter(({ name }) => name !== '99_TestHarness.gs')
    .map(({ source }) => source)
    .join('\n');
  assert.strictEqual(
    /https?:\/\/(?:api|generativelanguage|bedrock|vertex)[^'"\s]*/i
      .test(productionSources),
    false
  );
  assert.strictEqual(
    /\b(?:gpt-|gemini-|claude-|amazon\.nova|text-bison)/i
      .test(productionSources),
    false
  );
});

test('P7-SEC04_ERROR_RECORDS_USE_HASHED_EXTERNAL_REFERENCES', () => {
  assert.match(recordError, /safeMessageReference\(value\.message_id\)/);
  assert.match(recordError, /safeThreadReference\(value\.thread_id\)/);
  assert.match(recordError, /safeTaskReference\(value\.task_id\)/);
  assert.match(recordError, /sysref_/);
  assert.strictEqual(
    /record\.source_message_id\s*=\s*value\.message_id/.test(recordError),
    false
  );
  assert.strictEqual(
    /record\.source_thread_id\s*=\s*value\.thread_id/.test(recordError),
    false
  );
});

test('P7-SEC05_ERROR_SUMMARY_IS_ALLOWLISTED_NOT_EXCEPTION_TEXT', () => {
  assert.match(recordError, /record\.error_summary\s*=\s*requestedDead/);
  [
    /error\.message/, /safe\.safe_message/, /stack/,
    /subject/, /sender/, /plain_body/, /attachment/,
    /request_payload/, /response_body/
  ].forEach((pattern) => assert.strictEqual(pattern.test(recordError), false));
});

test('P7-SEC06_MANUAL_RETRY_ACCEPTS_ONLY_INTERNAL_IDS', () => {
  assert.match(manualRetry, /\^\(\?:err\|dl\)_\[0-9a-f\]\{32\}\$/);
  assert.match(manualRetry, /E_DEAD_LETTER_ID_INVALID/);
  assert.match(manualRetry, /safeMessageReference\(messageRecord\.message_id\)/);
  assert.strictEqual(/source_message_id\s*===\s*normalized/.test(manualRetry), false);
});

test('P7-SEC07_NON_RETRYABLE_AND_UNREADY_ITEMS_FAIL_CLOSED', () => {
  assert.match(manualRetry, /E_DEAD_LETTER_NON_RETRYABLE/);
  assert.match(manualRetry, /PREREQUISITES_NOT_READY/);
  assert.match(manualRetry, /E_MESSAGE_CHECKPOINT_CONFLICT/);
  assert.match(manualRetry, /status\s*\|\|\s*''\)\s*!==\s*'DEAD'/);
});

test('P7-SEC08_DIAGNOSTICS_HAVE_NO_EXTERNAL_OR_MUTATING_CALLS', () => {
  [
    /UrlFetchApp/, /Gmail\.Users/, /\bCalendar\./,
    /\.setValue\s*\(/, /\.setValues\s*\(/, /\.appendRow\s*\(/,
    /retryDeadLetterById\s*\(/, /processAutomaticBatch\s*\(/,
    /syncPendingCalendarJobs\s*\(/
  ].forEach((pattern) => assert.strictEqual(pattern.test(diagnostics), false));
});

test('P7-SEC09_MANIFEST_ADDS_NO_BROAD_DRIVE_OR_NETWORK_SCOPE', () => {
  [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/calendar'
  ].forEach((scope) => assert.strictEqual(manifest.oauthScopes.includes(scope), false));
});

test('P7-SEC10_NO_CREDENTIAL_PROPERTY_OR_LITERAL_SECRET', () => {
  const productionSources = allSource
    .filter(({ name }) => name !== '99_TestHarness.gs')
    .map(({ source }) => source)
    .join('\n');
  assert.strictEqual(
    /PROPERTIES\.[A-Z_]*(?:CREDENTIAL|API_KEY|PASSWORD|AUTH_TOKEN)/
      .test(productionSources),
    false
  );
  assert.strictEqual(/\bsk-[A-Za-z0-9_-]{16,}/.test(productionSources), false);
  assert.strictEqual(
    /Authorization\s*:\s*Bearer\s+[A-Za-z0-9._-]{12,}/i.test(productionSources),
    false
  );
});

const summary = {
  phase: 7,
  suite: 'security_static',
  environment: 'LOCAL_STATIC',
  real_provider_connection: 'NOT_EXECUTED',
  company_approval: 'NOT_CONFIRMED',
  credential_storage_approval: 'NOT_CONFIRMED',
  passed: results.filter((item) => item.status === 'PASS').length,
  failed: results.filter((item) => item.status === 'FAIL').length,
  tests: results
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed) {
  process.exitCode = 1;
}

