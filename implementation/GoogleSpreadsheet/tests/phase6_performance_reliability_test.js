'use strict';

/**
 * Phase 6 Apps Script performance and reliability architecture checks.
 *
 * These tests inspect the production source and do not call Google Workspace.
 * Runtime latency, quotas, and contention remain external acceptance items.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const apps = path.join(root, 'apps-script-v2');
const config = fs.readFileSync(path.join(apps, '00_Config.gs'), 'utf8');
const setup = fs.readFileSync(path.join(apps, '02_Setup.gs'), 'utf8');
const gateway = fs.readFileSync(path.join(apps, '05_GmailGateway.gs'), 'utf8');
const triggers = fs.readFileSync(path.join(apps, '12_Triggers.gs'), 'utf8');
const worker = fs.readFileSync(path.join(apps, '18_Worker.gs'), 'utf8');
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

const automaticWorker = between(
  worker,
  'function processAutomaticBatch(options)',
  'function runMockAcceptance(options)'
);
const automaticGateway = between(
  gateway,
  'function listAutomaticCandidates(options)',
  'function decodeBodyData(data, byteLimit)'
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

test('P6-P01_EXACT_AUTOMATION_LIMITS_ARE_CONFIGURED', () => {
  assert.match(config, /AUTOMATION_INTERVAL_MINUTES:\s*5\b/);
    assert.match(config, /AUTOMATION_MAX_MESSAGES_PER_RUN:\s*1\b/);
  assert.match(config, /AUTOMATION_MAX_SEARCH_THREADS:\s*100\b/);
  assert.match(config, /AUTOMATION_SEARCH_PAGE_SIZE:\s*25\b/);
  assert.match(config, /AUTOMATION_WORKER_SOFT_LIMIT_MS:\s*210000\b/);
  assert.match(config, /MESSAGE_STALE_CLAIM_MS:\s*30\s*\*\s*60\s*\*\s*1000/);
});

test('P6-P02_LOGICAL_LEASE_AND_SEGMENTED_SHORT_LOCKS', () => {
  assert.match(automaticWorker, /acquireWorkerLease\s*\(/);
  assert.match(automaticWorker, /releaseWorkerLease\s*\(/);
  assert.strictEqual(
    (automaticWorker.match(/withScriptLock\s*\(/g) || []).length >= 5,
    true,
    'automatic worker must separate claim/checkpoint commits into short locks'
  );
  assert.match(
    automaticWorker,
    /gateway\.listAutomaticCandidates\s*\(/
  );
});

test('P6-P03_DUE_BACKLOG_PRECEDES_INBOX_SEARCH', () => {
  assert(
    automaticWorker.indexOf('eligibleScheduledRecords(') <
    automaticWorker.indexOf('gateway.listAutomaticCandidates(')
  );
});

test('P6-P04_GMAIL_PAGES_HAVE_EXPLICIT_CEILING_AND_LOOP_GUARD', () => {
  assert.match(automaticGateway, /Math\.ceil\(maxThreads\s*\/\s*pageSize\)/);
  assert.match(automaticGateway, /pageCalls\s*<\s*maxPageCalls/);
  assert.match(automaticGateway, /E_GMAIL_PAGINATION_LOOP/);
});

test('P6-P05_METADATA_BUDGET_RETURNS_REPLAYABLE_PARTIAL_STATE', () => {
  assert.match(automaticGateway, /metadataComplete\s*=\s*false/);
  assert.match(automaticGateway, /replayCurrentPage/);
  assert.match(
    automaticGateway,
    /metadataComplete\s*&&\s*!pageToken\s*&&\s*!candidateOverflow/
  );
});

test('P6-P06_MESSAGE_BOUNDARIES_REAPPLY_FIXED_UPPER_BOUND', () => {
  assert.match(
    automaticGateway,
    /timestamp\s*>=\s*queryState\.upper_bound\.getTime\(\)/
  );
});

test('P6-P07_NEW_MESSAGE_CANDIDATE_AND_PREPROCESS_ARE_REUSED', () => {
  assert.match(
    automaticWorker,
    /candidate:\s*candidate\s*\|\|\s*null/
  );
  assert.match(
    worker,
    /var cachedPreprocessed\s*=\s*settings\.preprocessed_result\s*\|\|\s*null/
  );
  assert.match(worker, /if\s*\(cachedPreprocessed\)\s*\{/);
});

test('P6-P08_LABEL_INDEX_IS_RUN_SCOPED', () => {
  assert.match(automaticWorker, /gmailLabelCacheLoaded/);
  assert.match(automaticWorker, /getGmailLabelCache\(\)/);
  assert.match(
    gateway,
    /settings\.label_cache\s*\|\|\s*loadLabelCache\(callMeter\)/
  );
});

test('P6-P09_CALENDAR_AND_LAYOUT_SIDE_EFFECTS_ARE_BOUNDED', () => {
  assert.match(
    worker,
    /function configuredCalendarJobLimit\(\)/
  );
  assert.match(
    worker,
    /WorkOsConfig\.CALENDAR_MAX_JOBS_PER_RUN/
  );
  assert.match(automaticWorker, /configuredCalendarJobLimit\(\)/);
  assert.strictEqual(
    /WorkOsConfig\.AUTOMATION_MAX_CALENDAR_JOBS_PER_RUN/.test(worker),
    false,
    'automatic worker must not reference an undefined Calendar limit'
  );
  assert.match(worker, /E_CALENDAR_JOB_LIMIT_CONFIG/);
  assert.strictEqual(/\bgetLastRow\s*\(/.test(worker + gateway + triggers), false);
  assert.strictEqual(/SpreadsheetApp\.flush\s*\(/.test(worker + gateway + triggers), false);
});

test('P6-P10_AUTOMATION_STAYS_EXPLICIT_AND_EXTERNAL_SCOPE_IS_NARROW', () => {
  assert.strictEqual(/\bnewTrigger\s*\(/.test(setup), false);
  assert.match(triggers, /E_REAL_AI_TRANSPORT_NOT_IMPLEMENTED|REAL_AI_TRANSPORT_NOT_IMPLEMENTED/);
  assert(manifest.oauthScopes.includes(
    'https://www.googleapis.com/auth/script.external_request'
  ));
});

const summary = {
  phase: 6,
  suite: 'performance_reliability_static',
  environment: 'LOCAL_STATIC',
  apps_script_runtime_performance: 'NOT_EXECUTED',
  real_gmail_latency_and_quota: 'NOT_EXECUTED',
  passed: results.filter((item) => item.status === 'PASS').length,
  failed: results.filter((item) => item.status === 'FAIL').length,
  tests: results
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed) {
  process.exitCode = 1;
}
