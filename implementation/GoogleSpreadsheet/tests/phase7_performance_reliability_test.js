'use strict';

/**
 * Phase 7 Apps Script performance/reliability architecture checks.
 *
 * Runtime latency, quotas and lock contention remain real-environment items.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const apps = path.resolve(__dirname, '..', 'apps-script-v2');
const config = fs.readFileSync(path.join(apps, '00_Config.gs'), 'utf8');
const recovery = fs.readFileSync(
  path.join(apps, '13_LogAndDeadLetter.gs'),
  'utf8'
);
const diagnostics = fs.readFileSync(
  path.join(apps, '16_Diagnostics.gs'),
  'utf8'
);
const worker = fs.readFileSync(path.join(apps, '18_Worker.gs'), 'utf8');

function between(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert(startIndex >= 0, `Missing start marker: ${start}`);
  assert(endIndex > startIndex, `Missing end marker: ${end}`);
  return source.slice(startIndex, endIndex);
}

const automaticWorker = between(
  worker,
  'function processAutomaticBatch(options)',
  'function runMockAcceptance(options)'
);
const manualRetry = between(
  recovery,
  'function retryDeadLetterById(internalId, options)',
  'function retrySelectedDeadLetters(options)'
);
const selectedRetry = between(
  recovery,
  'function retrySelectedDeadLetters(options)',
  'return Object.freeze({'
);
const quickDiagnostic = between(
  diagnostics,
  'function runQuickDiagnostic(spreadsheet, options)',
  'function runDeepDiagnostic(spreadsheet, options)'
);
const deepDiagnostic = between(
  diagnostics,
  'function runDeepDiagnostic(spreadsheet, options)',
  'return Object.freeze({'
);

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

test('P7-P01_RETRY_LIMITS_AND_SOFT_BUDGETS_ARE_EXPLICIT', () => {
  assert.match(config, /RETRY_DELAYS_MINUTES:\s*Object\.freeze\(\[5,\s*15,\s*60\]\)/);
  assert.match(config, /RETRY_MAX_ATTEMPTS:\s*4\b/);
  assert.match(config, /RETRY_MAX_ITEMS_PER_RUN:\s*10\b/);
  assert.match(config, /MANUAL_RETRY_MAX_SELECTED:\s*5\b/);
  assert.match(config, /QUICK_DIAGNOSTIC_TARGET_MS:\s*60000\b/);
  assert.match(config, /DEEP_DIAGNOSTIC_SOFT_LIMIT_MS:\s*180000\b/);
});

test('P7-P02_AUTOMATIC_WORKER_USES_LEASE_AND_SHORT_LOCK_SEGMENTS', () => {
  assert.match(automaticWorker, /acquireWorkerLease\s*\(/);
  assert.match(automaticWorker, /releaseWorkerLease\s*\(/);
  assert.strictEqual(
    (automaticWorker.match(/withScriptLock\s*\(/g) || []).length >= 5,
    true,
    'automatic worker must use short claim/checkpoint lock segments'
  );
});

test('P7-P03_DUE_AND_STALE_BACKLOG_PRECEDES_GMAIL_SEARCH', () => {
  assert(
    automaticWorker.indexOf('eligibleScheduledRecords(') <
      automaticWorker.indexOf('gateway.listAutomaticCandidates(')
  );
  assert.match(worker, /isStaleClaim\(record,\s*nowValue\)/);
  assert.match(worker, /record\.next_retry_at\.getTime\(\)\s*<=\s*nowValue\.getTime\(\)/);
  assert(
    automaticWorker.indexOf('systemRetryStatus(') <
      automaticWorker.indexOf('gateway.listAutomaticCandidates(')
  );
});

test('P7-P04_PROVIDER_SUPPRESSION_STOPS_BACKLOG_AI_AND_INBOX_SEARCH', () => {
  assert.match(automaticWorker, /providerSuppressionStatus\(/);
  assert.match(automaticWorker, /providerSuppression\.active/);
  assert.match(worker, /RESUME_STAGES\.PREPROCESS/);
  assert.match(worker, /RESUME_STAGES\.CLASSIFY/);
  assert(
    automaticWorker.indexOf('if (providerSuppression.active)') <
      automaticWorker.indexOf('gateway.listAutomaticCandidates(')
  );
  assert.match(worker, /provider_retry_suppressed/);
});

test('P7-P05_MANUAL_RETRY_HAS_ONE_LOCK_AND_CHECKPOINT_VALIDATION', () => {
  assert.strictEqual(
    (manualRetry.match(/withScriptLock\s*\(/g) || []).length,
    1
  );
  assert.match(manualRetry, /E_MESSAGE_CHECKPOINT_CONFLICT/);
  assert.match(manualRetry, /requestManualRetryInContext/);
  assert.match(manualRetry, /E_DEAD_LETTER_NON_RETRYABLE/);
  assert.match(manualRetry, /SYSTEM_RETRY_QUEUED/);
});

test('P7-P06_SELECTED_RETRY_IS_BOUNDED_BEFORE_ITERATION', () => {
  assert.match(
    selectedRetry,
    /selection\.getNumRows\(\)\s*>\s*WorkOsConfig\.MANUAL_RETRY_MAX_SELECTED/
  );
  assert(
    selectedRetry.indexOf('MANUAL_RETRY_MAX_SELECTED') <
      selectedRetry.indexOf('ids.map(function (id)')
  );
});

test('P7-P07_QUICK_DIAGNOSTIC_IS_READ_ONLY_AND_BUDGETED', () => {
  assert.match(quickDiagnostic, /createSoftBudget\(/);
  assert.match(quickDiagnostic, /QUICK_DIAGNOSTIC_TARGET_MS/);
  assert.match(quickDiagnostic, /getDiagnosticAutomationStatus\(/);
  assert.strictEqual(/\.getAutomationStatus\s*\(/.test(quickDiagnostic), false);
  [
    /\.setValue\s*\(/, /\.setValues\s*\(/, /\.appendRow\s*\(/,
    /\.insertRows/, /\.insertColumns/, /\.delete/, /\.clear\s*\(/,
    /SpreadsheetApp\.flush/, /UrlFetchApp/, /syncPendingCalendarJobs/,
    /retryDeadLetter/
  ].forEach((pattern) => assert.strictEqual(pattern.test(quickDiagnostic), false));
});

test('P7-P08_DEEP_DIAGNOSTIC_IS_SEPARATE_MANUAL_READ_ONLY', () => {
  assert.match(deepDiagnostic, /DEEP_MANUAL_READ_ONLY/);
  assert.match(deepDiagnostic, /DEEP_DIAGNOSTIC_SOFT_LIMIT_MS/);
  assert.match(deepDiagnostic, /inspectRecoveryState\(/);
  [
    /\.setValue\s*\(/, /\.setValues\s*\(/, /\.appendRow\s*\(/,
    /UrlFetchApp/, /listAutomaticCandidates/, /syncPendingCalendarJobs/,
    /retryDeadLetter/
  ].forEach((pattern) => assert.strictEqual(pattern.test(deepDiagnostic), false));
});

test('P7-P09_ERROR_SCANS_ARE_CHUNKED_AND_BOUNDED', () => {
  assert.match(recovery, /QUICK_DIAGNOSTIC_CHUNK_ROWS/);
  assert.match(diagnostics, /QUICK_DIAGNOSTIC_CHUNK_ROWS/);
  assert.match(diagnostics, /function scanLogicalRows\(/);
  assert.match(diagnostics, /DEEP_DIAGNOSTIC_SAMPLE_ROWS/);
  assert.match(recovery, /logicalErrorRow\(context\)/);
  assert.strictEqual(/\bgetLastRow\s*\(/.test(recovery + diagnostics), false);
});

test('P7-P10_RUNTIME_HAS_NO_DASHBOARD_WRITE_OR_LAYOUT_REPAIR', () => {
  assert.strictEqual(/WorkOsDashboard|refreshDashboard|updateDashboard/.test(worker), false);
  assert.strictEqual(
    /insertColumns|insertRows|hideColumns|setFrozen|setDataValidation|protect\s*\(/.test(worker),
    false
  );
});

const summary = {
  phase: 7,
  suite: 'performance_reliability_static',
  environment: 'LOCAL_STATIC',
  apps_script_runtime_performance: 'NOT_EXECUTED',
  real_google_workspace_quota_and_contention: 'NOT_EXECUTED',
  passed: results.filter((item) => item.status === 'PASS').length,
  failed: results.filter((item) => item.status === 'FAIL').length,
  tests: results
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed) {
  process.exitCode = 1;
}

