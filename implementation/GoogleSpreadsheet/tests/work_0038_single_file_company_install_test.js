'use strict';

/**
 * Work 0038 focused validation for the derived single-file installation
 * artifact. This test loads and exercises the combined Code.gs itself; the
 * existing modular-source tests remain separate evidence.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

const moduleRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(moduleRoot, '..', '..');
const builder = require(path.join(
  moduleRoot,
  'tools',
  'build_work_0038_single_file_company_install.js'
));
const sourceRoot = builder.defaultSourceRoot;
const generatedRoot = builder.defaultOutputRoot;
const expectedOutputNames = builder.outputNames.slice().sort();

function read(root, name) {
  return fs.readFileSync(path.join(root, name));
}

function assertOutputInventory(root) {
  const actual = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  assert.deepStrictEqual(actual, expectedOutputNames);
}

function parseChecksums(root) {
  const lines = read(root, builder.checksumsName).toString('utf8')
    .trimEnd()
    .split('\n');
  const records = lines.map((line) => {
    const match = line.match(/^([0-9a-f]{64})  (.+)$/);
    assert.ok(match, `invalid checksum line: ${line}`);
    return { name: match[2], sha256: match[1] };
  });
  assert.deepStrictEqual(
    records.map((record) => record.name),
    [builder.provenanceName, 'Code.gs', builder.manifestName].sort()
  );
  records.forEach((record) => {
    assert.strictEqual(record.sha256, builder.sha256(read(root, record.name)));
  });
  return records;
}

function assertBundleParity(root) {
  assertOutputInventory(root);
  const code = read(root, 'Code.gs');
  const manifest = read(root, builder.manifestName);
  const provenance = JSON.parse(
    read(root, builder.provenanceName).toString('utf8')
  );
  const sourceNames = builder.sourceOrder.slice();
  assert.strictEqual(provenance.schema, 'WORK_0038_SINGLE_FILE_INSTALL_V1');
  assert.strictEqual(provenance.manual_install.paste_count, 2);
  assert.deepStrictEqual(provenance.source_order, sourceNames);
  assert.strictEqual(provenance.source_files.length, sourceNames.length);
  assert.strictEqual(provenance.bundle.sha256, builder.sha256(code));
  assert.strictEqual(provenance.bundle.byte_length, code.length);
  assert.strictEqual(provenance.manifest.sha256, builder.sha256(manifest));
  assert.strictEqual(
    provenance.manifest.byte_length,
    manifest.length
  );
  assert.deepStrictEqual(
    JSON.parse(manifest.toString('utf8')).runtimeVersion,
    'V8'
  );
  parseChecksums(root);

  const header = Buffer.from(
    [
      '/*',
      ' * WORK_0038_SINGLE_FILE_COMPANY_INSTALL',
      ' * Derived from the validated Phase 8C Apps Script payload.',
      ' * The modular payload remains the canonical developer source.',
      ' * No loader, remote fetch, eval, or runtime bootstrap is used.',
      ' */',
      ''
    ].join('\n'),
    'utf8'
  );
  assert.deepStrictEqual(code.subarray(0, header.length), header);

  let cursor = header.length;
  sourceNames.forEach((name, index) => {
    const source = read(sourceRoot, name);
    const digest = builder.sha256(source);
    const begin = Buffer.from(
      builder.sourceBeginMarker(name, source.length, digest),
      'utf8'
    );
    const end = Buffer.from(builder.sourceEndMarker(name), 'utf8');
    const beginIndex = code.indexOf(begin, cursor);
    assert.strictEqual(beginIndex, cursor);
    const sourceStart = beginIndex + begin.length;
    const endIndex = code.indexOf(end, sourceStart);
    assert.ok(endIndex > sourceStart);
    const section = code.subarray(sourceStart, endIndex);
    const expectedSection = source.length > 0 && source[source.length - 1] === 0x0a
      ? source
      : Buffer.concat([source, Buffer.from('\n', 'utf8')]);
    assert.deepStrictEqual(section, expectedSection, name);

    const metadata = provenance.source_files[index];
    assert.strictEqual(metadata.name, name);
    assert.strictEqual(metadata.byte_length, source.length);
    assert.strictEqual(metadata.sha256, digest);
    assert.strictEqual(metadata.source_start_byte, sourceStart);
    assert.strictEqual(metadata.source_end_byte, sourceStart + source.length);
    assert.strictEqual(
      metadata.trailing_separator_bytes,
      expectedSection.length - source.length
    );
    cursor = endIndex + end.length;
  });
  assert.strictEqual(cursor, code.length);

  sourceNames.forEach((name) => {
    const source = read(sourceRoot, name);
    const beginCount = code.toString('utf8').split(
      `/* WORK_0038_SOURCE_BEGIN file=${name} `
    ).length - 1;
    const endCount = code.toString('utf8').split(
      `/* WORK_0038_SOURCE_END file=${name} */`
    ).length - 1;
    assert.strictEqual(beginCount, 1, name);
    assert.strictEqual(endCount, 1, name);
    assert.ok(code.includes(source), `${name} bytes not found in bundle`);
  });
  return { code, manifest, provenance };
}

function assertBundleLoadsAndSmokes(code) {
  const sourceText = code.toString('utf8');
  assert.doesNotThrow(() => {
    new vm.Script(sourceText, { filename: 'Code.gs' });
  });

  const sandbox = {
    console,
    Date,
    JSON,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    RegExp,
    Error,
    TypeError,
    Map,
    Set
  };
  vm.createContext(sandbox);
  assert.doesNotThrow(() => {
    vm.runInContext(sourceText, sandbox, {
      filename: 'Code.gs',
      timeout: 10000
    });
  });

  assert.strictEqual(sandbox.WorkOsConfig.CODE_VERSION, '2.8.25-prepilot');
  assert.strictEqual(sandbox.WorkOsConfig.SCHEMA_VERSION, '2.6');
  assert.strictEqual(sandbox.WorkOsConfig.AI_SCHEMA_VERSION, '2.0');
  assert.strictEqual(sandbox.WorkOsConfig.MIGRATION_VERSION, '3');
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(sandbox.WorkOsMigrations.getVersionState())),
    {
      code_version: '2.8.25-prepilot',
      schema_version: '2.6',
      migration_version: '3'
    }
  );
  assert.strictEqual(
    sandbox.WorkOsGeminiProvider.isSyntheticCandidate({
      subject: sandbox.WorkOsGeminiProvider.SYNTHETIC_SUBJECT,
      source_mode: 'MANUAL',
      manual_decision: 'PROCESS'
    }),
    true
  );
  assert.strictEqual(
    sandbox.WorkOsGeminiProvider.isSyntheticBody(
      sandbox.WorkOsGeminiProvider.SYNTHETIC_BODY
    ),
    true
  );
  assert.strictEqual(typeof sandbox.getAutomationStatus, 'function');
  assert.strictEqual(typeof sandbox.runScheduledWorker, 'function');
}

function assertReproducible() {
  const temporaryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'work-0038-single-file-test-')
  );
  const firstRoot = path.join(temporaryRoot, 'first');
  const secondRoot = path.join(temporaryRoot, 'second');
  try {
    builder.buildBundle({ sourceRoot, outputRoot: firstRoot });
    builder.buildBundle({ sourceRoot, outputRoot: secondRoot });
    expectedOutputNames.forEach((name) => {
      assert.deepStrictEqual(read(firstRoot, name), read(secondRoot, name), name);
    });
    assertBundleParity(firstRoot);
    assertBundleParity(secondRoot);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

assert.ok(fs.existsSync(repositoryRoot));
const generated = assertBundleParity(generatedRoot);
assertBundleLoadsAndSmokes(generated.code);
assertReproducible();

const summary = {
  suite: 'work_0038_single_file_company_install',
  environment: 'LOCAL_NON_GOOGLE_BUNDLE_VALIDATION',
  source_root: 'implementation/GoogleSpreadsheet/release/v2.8.25-prepilot-phase8c/apps-script',
  source_file_count: builder.sourceOrder.length,
  source_parity: 'PASS',
  manifest_identity: 'PASS',
  bundle_syntax: 'PASS',
  bundle_vm_load: 'PASS',
  representative_non_live_smoke: 'PASS',
  reproducibility: 'PASS',
  live_google_workspace: 'NOT_EXECUTED',
  real_ai_provider: 'NOT_EXECUTED'
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
