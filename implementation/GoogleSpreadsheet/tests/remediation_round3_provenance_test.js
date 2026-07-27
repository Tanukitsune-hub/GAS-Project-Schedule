'use strict';

/**
 * Round 3 canonical-document and release-provenance regression.
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

test('R3-06A_CONFIG_USES_2_8_4_SCHEMA_2_5_MIGRATION_2', () => {
  const source = read('apps-script-v2/00_Config.gs');
  assert.match(source, /CODE_VERSION:\s*'2\.8\.4-prepilot'/);
  assert.match(source, /SCHEMA_VERSION:\s*'2\.5'/);
  assert.match(source, /AI_SCHEMA_VERSION:\s*'2\.0'/);
  assert.match(source, /MIGRATION_VERSION:\s*'2'/);
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

test('R3-06C_CURRENT_README_AND_CHANGELOG_COVER_R3_01_TO_R3_07', () => {
  const readme = read('apps-script-v2/README.md');
  const changelog = read('apps-script-v2/CHANGELOG.md');
  assert.ok(readme.includes('2.8.4-prepilot / Round 3 Remediation'));
  assert.ok(readme.includes('Tanukitsune-hub/GAS-Project-Schedule'));
  for (let finding = 1; finding <= 7; finding += 1) {
    assert.ok(
      changelog.includes(`R3-0${finding}:`),
      `CHANGELOG_MISSING_R3_0${finding}`
    );
  }
});

test('R3-06D_MANUAL_GUIDE_USES_47_COLUMNS_AND_STATUS_CAP', () => {
  const guide = read('docs/V2_MANUAL_ACCEPTANCE_GUIDE.md');
  assert.ok(guide.includes('対象version: `2.8.4-prepilot`'));
  assert.ok(guide.includes('Schema Version: `2.5`'));
  assert.ok(guide.includes('Migration Version: `2`'));
  assert.ok(guide.includes('`タスク一覧`が47列'));
  assert.ok(guide.includes('`READY_FOR_INDEPENDENT_REAUDIT`'));
  assert.ok(guide.includes('Phase 8B | GO/PASSを宣言しない'));
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
  assert.ok(!sources.includes('`タスク一覧`が43列'));
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
