'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const {
  classifyClaspFailure,
  closedClaspFailureCategories,
  buildRuntimeManifestOverlay,
  assertRuntimeManifestOverlay,
  assertSafeRuntimeResult
} = require('../tools/local_clasp_dev');

const moduleRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(moduleRoot, '..', '..');
const manifestPath = path.join(moduleRoot, 'apps-script-v2', 'appsscript.json');
const canonicalManifestBytes = fs.readFileSync(manifestPath);
const canonicalManifest = JSON.parse(canonicalManifestBytes.toString('utf8'));
const packageJson = JSON.parse(fs.readFileSync(
  path.join(moduleRoot, 'package.json'),
  'utf8'
));
const claspToolSource = fs.readFileSync(
  path.join(moduleRoot, 'tools', 'local_clasp_dev.js'),
  'utf8'
);

const tests = [];
function test(id, body) {
  try {
    body();
    tests.push({ id, status: 'PASS' });
  } catch (error) {
    tests.push({
      id,
      status: 'FAIL',
      safe_message: String(error && error.message || error)
    });
  }
}

test('BOOT-01_ALL_REQUIRED_CLOSED_FAILURE_CATEGORIES_EXIST', () => {
  [
    'APPS_SCRIPT_API_DISABLED',
    'BLOCKED_BY_AUTH',
    'DEV_TARGET_NOT_FOUND_OR_NO_ACCESS',
    'DEV_TARGET_PROJECT_TYPE_OR_BINDING_INVALID',
    'REMOTE_MANIFEST_REJECTED',
    'REMOTE_PAYLOAD_REJECTED',
    'NETWORK_OR_TLS_FAILURE',
    'CLASP_REMOTE_CONFLICT',
    'UNKNOWN_CLASP_PUSH_FAILURE'
  ].forEach((value) => assert.ok(closedClaspFailureCategories.includes(value)));
});

test('BOOT-02_FAILURE_CLASSIFICATION_IS_DETERMINISTIC', () => {
  const fixtures = {
    APPS_SCRIPT_API_DISABLED: 'Apps Script API is disabled',
    BLOCKED_BY_AUTH: 'invalid_grant',
    DEV_TARGET_NOT_FOUND_OR_NO_ACCESS: 'caller does not have permission',
    DEV_TARGET_PROJECT_TYPE_OR_BINDING_INVALID: 'invalid script id',
    REMOTE_MANIFEST_REJECTED: 'manifest rejected',
    REMOTE_PAYLOAD_REJECTED: 'payload rejected',
    NETWORK_OR_TLS_FAILURE: 'ETIMEDOUT',
    CLASP_REMOTE_CONFLICT: 'remote changed; push requires --force',
    UNKNOWN_CLASP_PUSH_FAILURE: 'unrecognized synthetic failure'
  };
  Object.entries(fixtures).forEach(([expected, raw]) => {
    assert.strictEqual(classifyClaspFailure(raw, 'push'), expected);
  });
});

test('BOOT-03_CANONICAL_MANIFEST_HAS_NO_EXECUTION_API', () => {
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(canonicalManifest, 'executionApi'),
    false
  );
});

test('BOOT-04_RUNTIME_OVERLAY_PRESERVES_ALL_CANONICAL_FIELDS', () => {
  const overlay = buildRuntimeManifestOverlay(canonicalManifest);
  assert.strictEqual(overlay.executionApi.access, 'MYSELF');
  assertRuntimeManifestOverlay(canonicalManifest, overlay);
  const stripped = JSON.parse(JSON.stringify(overlay));
  delete stripped.executionApi;
  assert.deepStrictEqual(stripped, canonicalManifest);
});

test('BOOT-05_PUBLIC_RUNTIME_ACCESS_IS_REJECTED', () => {
  ['DOMAIN', 'ANYONE', 'ANYONE_ANONYMOUS'].forEach((access) => {
    const overlay = JSON.parse(JSON.stringify(canonicalManifest));
    overlay.executionApi = { access };
    assert.throws(() => assertRuntimeManifestOverlay(canonicalManifest, overlay));
  });
});

test('BOOT-06_RUNTIME_SUMMARY_IS_BOUNDED_COMPLETE_AND_READ_ONLY', () => {
  const raw = JSON.stringify({ acceptance_summary: {
    summary_contract_id: 'WORK_OS_V2_DIAGNOSTIC_ACCEPTANCE_SUMMARY_V1',
    diagnostic_kind: 'QUICK', status: 'WARN',
    pass_count: 77, warn_count: 2, fail_count: 0, not_executed_count: 0,
    warn_check_ids: ['EXPECTED_ALPHA', 'EXPECTED_BETA'], fail_check_ids: [],
    warn_ids_complete: true, fail_ids_complete: true,
    acceptance_summary_status: 'COMPLETE',
    external_services_called: false, writes_performed: false,
    spreadsheet_write_performed: false, properties_write_performed: false,
    trigger_write_performed: false, flush_performed: false,
    calendar_api_called: false, gmail_api_called: false,
    external_ai_request_performed: false, dashboard_repair_performed: false,
    task_physical_column_count: 50, task_schema_ids_state: 'PASS',
    task_schema_headers_state: 'PASS', ledger_physical_column_count: 21,
    ledger_hidden_state: true, ledger_protection_state: true,
    ledger_authority_validator_state: 'PASS'
  }});
  const summary = assertSafeRuntimeResult(raw);
  assert.strictEqual(summary.side_effects_all_false, true);
  assert.deepStrictEqual(summary.warn_check_ids, ['EXPECTED_ALPHA', 'EXPECTED_BETA']);
});

test('BOOT-07_RUNTIME_SUMMARY_REJECTS_SIDE_EFFECTS', () => {
  const unsafe = JSON.stringify({ acceptance_summary: {
    summary_contract_id: 'WORK_OS_V2_DIAGNOSTIC_ACCEPTANCE_SUMMARY_V1',
    writes_performed: true
  }});
  assert.throws(() => assertSafeRuntimeResult(unsafe),
    /DEV_RUNTIME_SIDE_EFFECT_CONTRACT_FAILED/);
});

test('BOOT-08_PACKAGE_SCRIPTS_EXPOSE_CANONICAL_AND_RUNTIME_LANES', () => {
  [
    'gas:prerequisites:dev',
    'gas:access-check:dev',
    'gas:stage:dev',
    'gas:push:dev',
    'gas:pull-verify:dev',
    'gas:runtime-auth-check:dev',
    'gas:runtime-prerequisites:dev',
    'gas:runtime-config:dev',
    'gas:stage:runtime-dev',
    'gas:push:runtime-dev',
    'gas:pull-verify:runtime-dev',
    'gas:test:runtime-dev'
  ].forEach((name) => assert.strictEqual(typeof packageJson.scripts[name], 'string'));
});

test('BOOT-09_LOCAL_SECRET_DIRECTORIES_REMAIN_IGNORED', () => {
  const rootIgnore = fs.readFileSync(path.join(repositoryRoot, '.gitignore'), 'utf8');
  const moduleIgnore = fs.readFileSync(path.join(moduleRoot, '.gitignore'), 'utf8');
  assert.match(rootIgnore, /\*\*\/\.clasp-dev\//);
  assert.match(moduleIgnore, /^\.clasp-dev\/$/m);
});

test('BOOT-10_CANONICAL_MANIFEST_BYTES_ARE_NOT_REWRITTEN_BY_GENERATOR', () => {
  buildRuntimeManifestOverlay(canonicalManifest);
  assert.deepStrictEqual(fs.readFileSync(manifestPath), canonicalManifestBytes);
});

test('BOOT-11_CANONICAL_ATTEMPT_MARKER_PRECEDES_REMOTE_PUSH', () => {
  const marker = claspToolSource.indexOf('markCanonicalRetryUsed(inventory);');
  const push = claspToolSource.indexOf("runClasp(['push'], devRoot)");
  assert.ok(marker >= 0 && push > marker);
});

test('BOOT-12_FORCE_PUSH_IS_NEVER_INVOKED', () => {
  assert.doesNotMatch(claspToolSource, /runClasp\(\[[^\]]*['"]--force['"]/);
});

test('BOOT-13_RUNTIME_GUARD_REQUIRES_TEST_AND_AUTOMATION_CONTRACTS', () => {
  assert.ok(claspToolSource.includes('TEST_MODE' + ':\\s*true'));
  assert.ok(claspToolSource.includes('AUTOMATION_ENABLED' + ':\\s*false'));
  assert.match(claspToolSource, /\btest_mode\b/);
  assert.match(claspToolSource, /\bautomation_disabled\b/);
});

const failed = tests.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({
  suite: 'remote_gas_development_bootstrap',
  environment: 'LOCAL_NON_GOOGLE',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
