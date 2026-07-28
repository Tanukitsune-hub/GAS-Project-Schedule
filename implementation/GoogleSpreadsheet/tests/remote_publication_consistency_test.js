'use strict';

/*
 * Publication-candidate static consistency check. It intentionally reads only
 * repository files and invokes no Google Workspace, browser, or network API.
 */
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const moduleRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(moduleRoot, '..', '..');
const appsRoot = path.join(moduleRoot, 'apps-script-v2');

function read(relative) {
  return fs.readFileSync(path.join(repoRoot, relative), 'utf8');
}
function exists(relative) {
  return fs.existsSync(path.join(repoRoot, relative));
}
function source(relative) {
  return fs.readFileSync(path.join(moduleRoot, relative), 'utf8');
}
function git(args) {
  return childProcess.execFileSync('git', ['-C', repoRoot].concat(args), {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}

const tests = [];
function test(id, fn) {
  const started = Date.now();
  try {
    fn();
    tests.push({ id, status: 'PASS', duration_ms: Date.now() - started });
  } catch (error) {
    tests.push({
      id,
      status: 'FAIL',
      duration_ms: Date.now() - started,
      safe_message: String(error && error.message || error).slice(0, 300)
    });
  }
}

const rootDocs = [
  'PROJECT_CONTEXT.md',
  'MASTER_PLAN.md',
  'DECISIONS.md',
  'CURRENT_STATUS.md',
  'README.md',
  'docs/TASK_AUTHORITY_PROTOCOL.md',
  'docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md',
  'docs/R4_VERIFICATION_MATRIX.md',
  'docs/visualizations/index.html',
  'docs/visualizations/GoogleWorkspace_v2_Workflow_Overview.html'
];
const moduleDocs = [
  'V2_IMPLEMENTATION_SPEC.md',
  'V2_CODEX_IMPLEMENTATION_PLAN.md',
  'docs/TASK_AUTHORITY_PROTOCOL.md',
  'docs/V2_REQUIREMENTS_TRACEABILITY.md',
  'docs/V2_MANUAL_ACCEPTANCE_GUIDE.md',
  'visualizations/task_authority_protocol_v2_8_5.html'
];

test('RPC-01_CANONICAL_PATHS_EXIST_AND_ROOT_SOURCE_DUPLICATES_ARE_ABSENT', () => {
  rootDocs.forEach((relative) => assert.ok(exists(relative), relative));
  moduleDocs.forEach((relative) => assert.ok(
    fs.existsSync(path.join(moduleRoot, relative)), relative
  ));
  assert.ok(fs.existsSync(appsRoot), 'canonical apps-script root missing');
});

test('RPC-02_VERSION_GATE_AND_AUTHORITY_DOCUMENTS_AGREE', () => {
  const config = source('apps-script-v2/00_Config.gs');
  [
    "CODE_VERSION: '2.8.5-prepilot'",
    "SCHEMA_VERSION: '2.6'",
    "AI_SCHEMA_VERSION: '2.0'",
    "MIGRATION_VERSION: '3'",
    'AUTOMATION_ENABLED: false'
  ].forEach((literal) => assert.ok(config.includes(literal), literal));
  const current = rootDocs.map(read).concat(moduleDocs.map((relative) =>
    source(relative)
  )).join('\n');
  const gateMatch = read('CURRENT_STATUS.md').match(
    /^Overall status:\s+`([^`]+)`/m
  );
  assert.ok(gateMatch, 'CURRENT_STATUS overall gate missing');
  const declaredGate = gateMatch[1];
  assert.ok([
    'NO-GO_REMOTE_PUBLICATION',
    'READY_FOR_PHASE8B_SANDBOX_TRANSFER'
  ].includes(declaredGate), 'unexpected canonical gate: ' + declaredGate);
  [
    '2.8.5-prepilot',
    '2.6',
    declaredGate,
    'Task Authority Ledger',
    'PREPARED',
    'ORPHANED'
  ].forEach((literal) => assert.ok(current.includes(literal), literal));
  assert.ok(!current.includes(
    'data-release-status="READY_FOR_INDEPENDENT_REAUDIT"'
  ));
});

test('RPC-03_SCHEMA_COUNTS_AND_MATRIX_TRACEABILITY_ARE_CANONICAL', () => {
  const types = source('apps-script-v2/01_TypesAndSchemas.gs');
  const taskMatch = types.match(/var taskColumns = \[([\s\S]*?)\n  \];/);
  assert.ok(taskMatch, 'Task schema block missing');
  assert.strictEqual((taskMatch[1].match(/^\s*column\(/gm) || []).length, 50);
  const ledgerMatch = types.match(
    /TASK_AUTHORITY_LEDGER\] = \[([\s\S]*?)\n  \];/
  );
  assert.ok(ledgerMatch, 'ledger schema block missing');
  assert.strictEqual((ledgerMatch[1].match(/^\s*column\(/gm) || []).length, 21);
  const config = source('apps-script-v2/00_Config.gs');
  const orderMatch = config.match(
    /var WorkOsSheetOrder = Object\.freeze\(\[([\s\S]*?)\]\);/
  );
  const hiddenMatch = config.match(
    /var WorkOsHiddenSheets = Object\.freeze\(\[([\s\S]*?)\]\);/
  );
  assert.ok(orderMatch && hiddenMatch, 'sheet contracts missing');
  assert.strictEqual((orderMatch[1].match(/WorkOsConfig\.SHEETS\./g) || []).length, 11);
  assert.strictEqual((hiddenMatch[1].match(/WorkOsConfig\.SHEETS\./g) || []).length, 5);
  const matrix = read('docs/R4_VERIFICATION_MATRIX.md');
  assert.strictEqual((matrix.match(/^\| R4-\d{2} \|/gm) || []).length, 33);
  assert.strictEqual((matrix.match(/^\| W-\d{2} \|/gm) || []).length, 13);
});

test('RPC-04_SHARED_AUTHORITY_AND_FAILURE_RECOVERY_WIRING_EXISTS', () => {
  const repository = source('apps-script-v2/08_TaskRepository.gs');
  const migration = source('apps-script-v2/14_Migrations.gs');
  const setup = source('apps-script-v2/02_Setup.gs');
  const diagnostics = source('apps-script-v2/16_Diagnostics.gs');
  const calendar = source('apps-script-v2/10_CalendarSync.gs');
  [
    'function validateAuthority',
    'function reconcileMissingAuthorityRecords',
    'function canonicalSnapshotFieldValue',
    'function markAuthorityRecordOrphaned',
    'AUTHORITY_LEDGER_MAX_DATA_ROWS'
  ].forEach((literal) => assert.ok(repository.includes(literal), literal));
  assert.ok(migration.includes('reconcileMissingAuthorityRecords'));
  assert.ok(migration.includes('reconciliation_pending'));
  assert.ok(setup.includes('mark_orphaned: true'));
  assert.ok(diagnostics.includes('recover_relocated: false'));
  assert.ok(diagnostics.includes('mark_orphaned: false'));
  [
    'DEADLINE_CALENDAR_ARMED',
    'DEADLINE_CALENDAR_AUTHORITY_COMPENSATION',
    'function revalidatePreparedExecution',
    'function executeAuthorityCompensation',
    'E_CALENDAR_TASK_AUTHORITY_EXCLUDED'
  ].forEach((literal) => assert.ok(calendar.includes(literal), literal));
});

test('RPC-04B_CANONICAL_RELEASE_TOOLS_USE_MODULE_SOURCE_AND_MODULE_RELEASE', () => {
  const toolNames = [
    'build_v2_8_5_release.ps1',
    'build_v2_8_5_phase8c_release.ps1',
    'verify_v2_8_5_release.ps1',
    'verify_v2_8_5_phase8c_release.ps1'
  ];
  toolNames.forEach((name) => {
    const text = source(path.join('tools', name));
    assert.ok(text.includes("$moduleRoot = [System.IO.Path]::GetFullPath"),
      name + ': module root');
    assert.ok(text.includes("Join-Path $moduleRoot '../..'"),
      name + ': repository root must be two levels above module');
    assert.ok(text.includes("$sourceRoot = Join-Path $moduleRoot 'apps-script-v2'"),
      name + ': canonical source root');
    assert.ok(text.includes('Join-Path $moduleRoot "release\\$'),
      name + ': release must be rooted at canonical module path');
  });
  ['build_v2_8_5_release.ps1', 'build_v2_8_5_phase8c_release.ps1']
    .forEach((name) => {
      const text = source(path.join('tools', name));
      assert.ok(text.includes('function Assert-CleanCanonicalSourceInputs'),
        name + ': source cleanliness guard');
      assert.ok(text.includes('Assert-CleanCanonicalSourceInputs'),
        name + ': source cleanliness guard invocation');
      assert.ok(text.includes("'implementation/GoogleSpreadsheet/apps-script-v2'"),
        name + ': Apps Script source must be guarded');
      assert.ok(text.includes("'implementation/GoogleSpreadsheet/tools'"),
        name + ': release tools/templates must be guarded');
      assert.ok(!text.includes(
        "'status', '--porcelain', '--', 'implementation/GoogleSpreadsheet'"
      ), name + ': generated release output must not block the companion package build');
    });
});

test('RPC-05_SOURCE_COMMIT_TREE_EXCLUDES_RELEASE_PAYLOADS', () => {
  const target = process.env.SOURCE_COMMIT || 'HEAD';
  const names = git(['ls-tree', '--name-only', target]).split(/\r?\n/);
  if (!process.env.SOURCE_COMMIT) return;
  const allNames = git(['ls-tree', '-r', '--name-only', target]).split(/\r?\n/);
  assert.ok(names.includes('implementation'), 'implementation root absent');
  // A local review worktree can inherit historical B5 artifacts. A supplied
  // SOURCE_COMMIT is the authoritative source-boundary verification.
  assert.ok(!names.includes('release'), 'Source commit must not contain release/');
  assert.ok(!names.includes('AUDIT_REMEDIATION_ROUND4_IMPLEMENTATION_REPORT.md'));
  assert.ok(!names.includes(
    'AUDIT_REMEDIATION_ROUND5_CALENDAR_OUTBOX_AUTHORITY_IMPLEMENTATION_REPORT.md'
  ));
  ['apps-script-v2', 'tests', 'tools'].forEach((name) => {
    assert.ok(!names.includes(name), 'root duplicate forbidden: ' + name);
  });
  assert.ok(!allNames.includes(
    'implementation/GoogleSpreadsheet/AUDIT_REMEDIATION_ROUND4_IMPLEMENTATION_REPORT.md'
  ), 'Source commit must not contain the Round 4 release report');
  assert.ok(!allNames.includes(
    'implementation/GoogleSpreadsheet/AUDIT_REMEDIATION_ROUND5_CALENDAR_OUTBOX_AUTHORITY_IMPLEMENTATION_REPORT.md'
  ), 'Source commit must not contain the Round 5 release report');
  [
    'implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/',
    'implementation/GoogleSpreadsheet/release/v2.8.5-prepilot-phase8c/'
  ].forEach((prefix) => assert.ok(!allNames.some((name) => name.startsWith(prefix)),
    'Source commit must not contain current release payload: ' + prefix));
});

test('RPC-05B_RELEASE_DIFF_IS_LIMITED_TO_CANONICAL_PACKAGES_AND_REPORT', () => {
  const sourceCommit = process.env.SOURCE_COMMIT;
  const releaseCommit = process.env.RELEASE_COMMIT;
  if (!sourceCommit || !releaseCommit) return;
  const changed = git(['diff', '--name-only', sourceCommit, releaseCommit])
    .split(/\r?\n/).filter(Boolean);
  const allowedPrefixes = [
    'implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/',
    'implementation/GoogleSpreadsheet/release/v2.8.5-prepilot-phase8c/'
  ];
  const report = 'implementation/GoogleSpreadsheet/AUDIT_REMEDIATION_ROUND5_CALENDAR_OUTBOX_AUTHORITY_IMPLEMENTATION_REPORT.md';
  assert.ok(changed.includes(report), 'Round 5 report missing from Release commit');
  assert.ok(changed.some((name) => name.startsWith(allowedPrefixes[0])),
    'Phase 8B package missing from Release commit');
  assert.ok(changed.some((name) => name.startsWith(allowedPrefixes[1])),
    'Phase 8C package missing from Release commit');
  changed.forEach((name) => assert.ok(name === report ||
    allowedPrefixes.some((prefix) => name.startsWith(prefix)),
  'Release boundary violation: ' + name));
});

test('RPC-06_CURRENT_CANONICAL_DOCS_AND_SOURCE_HAVE_NO_SECRET_OR_LOCAL_PATH', () => {
  const records = rootDocs.map((relative) => ({ relative, text: read(relative) }))
    .concat(moduleDocs.map((relative) => ({ relative, text: source(relative) })))
    .concat(fs.readdirSync(appsRoot).filter((name) => name.endsWith('.gs'))
      .map((name) => ({
        relative: name,
        text: fs.readFileSync(path.join(appsRoot, name), 'utf8')
      })));
  const forbidden = [
    /sk-[A-Za-z0-9_-]{20,}/,
    /AIza[0-9A-Za-z_-]{20,}/,
    /ya29\.[A-Za-z0-9_-]{20,}/,
    /gh[pousr]_[A-Za-z0-9]{20,}/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /https?:\/\/[^/\s:@]+:[^@\s/]+@/,
    /(?:^|[^A-Za-z])C:\\Users\\/i,
    /OneDrive\\/i
  ];
  records.forEach((record) => forbidden.forEach((pattern) => {
    let scan = record.text;
    if (record.relative === '99_TestHarness.gs') {
      [
        'Authorization: Bearer abc.def token=secret-value API_KEY=top-secret',
        'Authorization: Bearer synthetic-secret-token',
        'https://user:password@example.invalid/?api_key=hidden'
      ].forEach((fixture) => { scan = scan.split(fixture).join(''); });
    }
    assert.ok(!pattern.test(scan), record.relative + ': ' + pattern);
  }));
});

const failed = tests.filter((item) => item.status === 'FAIL');
process.stdout.write(JSON.stringify({
  suite: 'remote_publication_consistency',
  environment: 'LOCAL_STATIC',
  real_google_workspace: 'NOT_EXECUTED',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
}, null, 2) + '\n');
if (failed.length) process.exitCode = 1;
