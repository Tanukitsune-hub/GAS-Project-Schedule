'use strict';

/**
 * Historic Round 3 provenance and current Round 4 authority-protocol
 * regression.
 *
 * This suite is local/static only. GitHub commit existence and real Google
 * Workspace behavior are verified separately and are not promoted to PASS
 * here.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');
const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, status: 'PASS' });
  } catch (error) {
    results.push({ name, status: 'FAIL', message: error.message });
  }
}

test('R4-06A_CURRENT_CONFIG_USES_2_8_16_SCHEMA_2_6_MIGRATION_3', () => {
  const source = read('apps-script-v2/00_Config.gs');
  assert.match(source, /CODE_VERSION:\s*'2\.8\.16-prepilot'/);
  assert.match(source, /SCHEMA_VERSION:\s*'2\.6'/);
  assert.match(source, /AI_SCHEMA_VERSION:\s*'2\.0'/);
  assert.match(source, /MIGRATION_VERSION:\s*'3'/);
  assert.match(source, /AUTOMATION_ENABLED:\s*false/);
});

test('R3-06B_TRACEABILITY_NAMES_ONLY_GAS_REPOSITORY_AS_CURRENT', () => {
  const source = read('docs/V2_REQUIREMENTS_TRACEABILITY.md');
  assert.ok(source.includes(
    'Repository: `Tanukitsune-hub/GAS-Project-Schedule`'
  ));
  assert.ok(source.includes('| D-033 | Raw edit values'));
  assert.ok(source.includes('| D-038 | Legacy v2 Error rows'));
  assert.ok(!source.includes('`context-hub`'));
  assert.ok(!source.includes('Repository: `GoogleSpreadsheet`'));
});

test('R4-06C_CURRENT_README_AND_CHANGELOG_PRESERVE_R4_01_TO_R4_06', () => {
  const readme = read('apps-script-v2/README.md');
  const changelog = read('apps-script-v2/CHANGELOG.md');
  assert.ok(readme.includes('2.8.16-prepilot'));
  assert.ok(readme.includes('Tanukitsune-hub/GAS-Project-Schedule'));
  for (let finding = 1; finding <= 6; finding += 1) {
    assert.ok(
      changelog.includes(`R4-0${finding}:`),
      `CHANGELOG_MISSING_R4_0${finding}`
    );
  }
});

test('R4-06D_MANUAL_GUIDE_USES_CURRENT_VERSION_AND_NO_GO_STATUS_CAP', () => {
  const guide = read('docs/V2_MANUAL_ACCEPTANCE_GUIDE.md');
  assert.ok(guide.includes('2.8.16-prepilot'));
  assert.ok(guide.includes('Schema Version: `2.6`'));
  assert.ok(guide.includes('Migration Version: `3`'));
  assert.ok(guide.includes('50'));
  assert.ok(guide.includes(
    '`READY_FOR_CONTROLLED_SANDBOX_VALIDATION`'
  ));
  assert.ok(!guide.includes('`READY_FOR_INDEPENDENT_REAUDIT`'));
  assert.ok(!/\|\s*Phase 8B[^|]*\|\s*(?:GO|PASS|GO\/PASS)\s*\|/.test(
    guide
  ));
  assert.ok(!/\|\s*Phase 8C[^|]*\|\s*GO\s*\|/.test(guide));
});

test('R4-01A_TWO_SLOT_LEDGER_COMMITS_AROUND_ONE_TASK_ROW_WRITE', () => {
  const repository = read('apps-script-v2/08_TaskRepository.gs');
  const commitStart = repository.indexOf('function commitAuthorityRow(');
  const commitEnd = repository.indexOf('\n  function restoreAuthorityRow(', commitStart);
  const commit = repository.slice(commitStart, commitEnd);
  const mirrorStart = repository.indexOf('function syncAuthoritativeMirror(');
  const mirrorEnd = repository.indexOf('\n  function migrateLegacyRowToSnapshot(', mirrorStart);
  const mirror = repository.slice(mirrorStart, mirrorEnd);

  assert.ok(commitStart >= 0 && commitEnd > commitStart);
  assert.ok(mirrorStart >= 0 && mirrorEnd > mirrorStart);
  assert.ok(commit.indexOf('prepareAuthorityLedgerCommit(') <
    commit.indexOf('.setValues([output])'));
  assert.match(commit, /recoverPreparedAuthority\(/);
  assert.match(commit, /promotePreparedLedgerRecord\(/);
  assert.doesNotMatch(commit, /setNote\(|setNotes\(/);
  assert.doesNotMatch(mirror, /setValues\(|setNote\(|setNotes\(/);
  assert.match(mirror, /deprecated: true/);
  assert.match(repository, /rollbackPreparedLedgerRecord\(/);
});

test('R4-02A_SHARED_VALIDATOR_FAILS_CLOSED_WITHOUT_SNAPSHOT_FALLBACK', () => {
  const repository = read('apps-script-v2/08_TaskRepository.gs');
  const setup = read('apps-script-v2/02_Setup.gs');
  const diagnostics = read('apps-script-v2/16_Diagnostics.gs');
  const migration = read('apps-script-v2/14_Migrations.gs');

  assert.match(repository, /function validateAuthority\(row, options\)/);
  assert.match(repository, /E_TASK_AUTHORITY_SNAPSHOT_FALLBACK_FORBIDDEN/);
  assert.match(
    repository,
    /does not[\s\S]*?inspect authoritative_snapshot_json or a cell note/i
  );
  assert.match(setup, /validateAllTaskAuthorities\(taskSheet/);
  assert.match(diagnostics, /validateAllTaskAuthorities\(/);
  assert.match(migration, /WorkOsTaskRepository\.validateAuthority\(raw/);
  assert.match(repository, /function restoreUserEditRows\([\s\S]*?validateAuthority\(/);
});

test('R4-03A_INVALID_EDIT_ROWS_ARE_QUARANTINED_AND_WORKERS_USE_OPERATIONAL_TASKS', () => {
  const repository = read('apps-script-v2/08_TaskRepository.gs');
  const editHandler = read('apps-script-v2/11_EditHandler.gs');
  const worker = read('apps-script-v2/18_Worker.gs');
  const calendar = read('apps-script-v2/10_CalendarSync.gs');

  assert.match(repository, /function quarantineAuthorityRow\(/);
  assert.match(repository, /function restoreUserEditRows\(/);
  assert.match(editHandler, /restoreCanonicalTaskHeaders\(sheet\)/);
  assert.match(editHandler, /restoreUserEditRows\(\s*sheet,\s*rowEdits\)/);
  assert.match(worker, /operationalTasks\(/);
  assert.match(calendar, /operationalTasks\(/);
});

test('R4-04A_TASK_HEADERS_AND_AUTHORITY_LEDGER_ARE_CANONICAL_CONTROL_PLANE', () => {
  const config = read('apps-script-v2/00_Config.gs');
  const builder = read('apps-script-v2/03_SheetBuilder.gs');
  const migration = read('apps-script-v2/14_Migrations.gs');
  const schemas = read('apps-script-v2/01_TypesAndSchemas.gs');

  assert.match(config, /HEADER_ID_ROW:\s*1/);
  assert.match(config, /HEADER_LABEL_ROW:\s*2/);
  assert.match(config, /TASK_AUTHORITY_LEDGER:\s*'Task Authority Ledger'/);
  assert.match(builder, /function restoreCanonicalTaskHeaders\(/);
  assert.match(migration, /ensureR4AuthorityLedgerSheet\(/);
  assert.match(migration, /restoreCanonicalTaskHeaders\(taskSheet\)/);
  assert.match(schemas, /authority_generation/);
  assert.match(schemas, /authority_hash/);
  assert.match(schemas, /authority_state/);
});

test('R3-07A_BUILD_SCRIPTS_REQUIRE_EXACT_SOURCE_COMMIT', () => {
  for (const relativePath of [
    'tools/build_v2_8_4_release.ps1',
    'tools/build_v2_8_4_phase8c_release.ps1'
  ]) {
    const source = read(relativePath);
    assert.match(source, /\[Parameter\(Mandatory = \$true\)\][\s\S]*SourceCommit/);
    assert.ok(source.includes("ValidatePattern('^[0-9a-f]{40}$')"));
    assert.ok(source.includes(
      "Repository = 'Tanukitsune-hub/GAS-Project-Schedule'"
    ));
    assert.ok(!source.includes('NOT AVAILABLE'));
    assert.ok(!source.includes('SourceTreeStatus'));
  }
});

test('R3-07B_RELEASE_MANIFEST_HAS_COMPLETE_PROVENANCE', () => {
  const template = read('tools/v2_8_4/DEPLOYMENT_MANIFEST.template.md');
  for (const literal of [
    '| Repository | {{REPOSITORY}} |',
    '| Source commit | {{SOURCE_COMMIT}} |',
    '| Release content commit | {{RELEASE_COMMIT}} |',
    '| Package prepared at | `{{PREPARED_AT}}` |',
    '| TEST_MODE | `true` |',
    '| Automation default | `OFF` |',
    '| Highest local status | `READY_FOR_INDEPENDENT_REAUDIT` |'
  ]) {
    assert.ok(template.includes(literal), `MANIFEST_MISSING_${literal}`);
  }
});

test('R3-07C_RELEASE_COMMIT_SELF_REFERENCE_IS_EXPLICIT', () => {
  const files = [
    'tools/build_v2_8_4_release.ps1',
    'tools/build_v2_8_4_phase8c_release.ps1',
    'tools/verify_v2_8_4_release.ps1',
    'tools/verify_v2_8_4_phase8c_release.ps1'
  ];
  for (const relativePath of files) {
    assert.ok(
      read(relativePath).includes(
        'SELF (the Git commit containing this manifest)'
      ),
      `SELF_REFERENCE_MISSING_${relativePath}`
    );
  }
});

test('R3-07D_VERIFY_SCRIPTS_BIND_EXPECTED_SOURCE_SHA', () => {
  for (const relativePath of [
    'tools/verify_v2_8_4_release.ps1',
    'tools/verify_v2_8_4_phase8c_release.ps1'
  ]) {
    const source = read(relativePath);
    assert.ok(source.includes("ValidatePattern('^[0-9a-f]{40}$')"));
    assert.ok(source.includes("| Source commit | ``$SourceCommit`` |"));
    assert.ok(source.includes('| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |'));
  }
});

test('R3-07E_PHASE8C_IS_TEST_MODE_ONLY_AND_EXCLUDES_HARNESS', () => {
  const build = read('tools/build_v2_8_4_phase8c_release.ps1');
  const verify = read('tools/verify_v2_8_4_phase8c_release.ps1');
  assert.ok(build.includes("'TEST_MODE:\\s*true'"));
  assert.ok(build.includes("'TEST_MODE: false'"));
  assert.ok(build.includes("$_ -ne '99_TestHarness.gs'"));
  assert.ok(verify.includes('SourceParityExceptAuditedTestModeTransform'));
  assert.ok(verify.includes('TestHarnessExcluded'));
});

test('R3-07F_RELEASE_TOOLS_DECLARE_ONLY_REAUDIT_READY_STATUS', () => {
  const sources = [
    read('tools/build_v2_8_4_release.ps1'),
    read('tools/build_v2_8_4_phase8c_release.ps1'),
    read('tools/v2_8_4/DEPLOYMENT_MANIFEST.template.md')
  ].join('\n');
  assert.ok(sources.includes('READY_FOR_INDEPENDENT_REAUDIT'));
  assert.ok(!sources.includes('Production ready'));
  assert.ok(!sources.includes('Pilot ready'));
  assert.ok(!/\|\s*Phase 8B[^|]*\|\s*(GO|PASS)\s*\|/.test(sources));
  assert.ok(!/\|\s*Phase 8C[^|]*\|\s*GO\s*\|/.test(sources));
});

test('R3-07G_RELEASE_GUIDES_HAVE_NO_STALE_VERSION_OR_COLUMN_COUNT', () => {
  const sources = [
    read('tools/v2_8_4/SANDBOX_QUICKSTART.md'),
    read('tools/v2_8_4/MANUAL_ACCEPTANCE_GUIDE.md')
  ].join('\n');
  assert.ok(!sources.includes('2.8.3-prepilot'));
  assert.ok(!sources.includes('Schema Version: `2.4`'));
  assert.ok(!sources.includes('Migration Version: `1`'));
  assert.ok(!sources.includes('43 columns'));
});

const failed = results.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({
  suite: 'remediation_round3_provenance',
  environment: 'LOCAL_STATIC',
  github_commit_existence: 'VERIFIED_SEPARATELY',
  real_google_workspace: 'NOT_EXECUTED',
  passed: results.length - failed.length,
  failed: failed.length,
  tests: results
}, null, 2)}\n`);
if (failed.length) {
  process.exitCode = 1;
}
