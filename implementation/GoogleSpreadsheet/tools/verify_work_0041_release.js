'use strict';

/**
 * Verify Work 0041 versioned packages and the derived two-paste bundle.
 * Verification is local and synthetic only; it never calls a Provider,
 * Google Workspace, OAuth, clasp, or deployment service.
 */
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const builder = require('./build_work_0041_release');

const moduleRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(moduleRoot, '..', '..');
const releaseRoot = path.join(moduleRoot, 'release');
const contractPath = path.join(repositoryRoot, 'CURRENT_CONTRACT.json');
const gate = 'READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT';

function readBuffer(filePath) {
  return fs.readFileSync(filePath);
}

function sha256(value) {
  return builder.sha256(value);
}

function gitShow(commit, relativePath) {
  const result = childProcess.spawnSync(
    'git',
    ['-C', repositoryRoot, 'show', `${commit}:${relativePath}`],
    { encoding: null, windowsHide: true, maxBuffer: 64 * 1024 * 1024 }
  );
  if (result.error || result.status !== 0) {
    throw new Error(`SOURCE_COMMIT_FILE_MISSING_${relativePath}`);
  }
  return Buffer.from(result.stdout || '');
}

function listFiles(root) {
  const result = [];
  function visit(directory) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else result.push(path.relative(root, absolute).replaceAll(path.sep, '/'));
    });
  }
  if (!fs.existsSync(root)) throw new Error('RELEASE_ROOT_MISSING');
  visit(root);
  return result.sort();
}

function expectedPackageFiles(sourceNames) {
  return sourceNames.concat([builder.manifestName])
    .map((name) => `apps-script/${name}`).concat([
    'CHECKSUMS.sha256',
    'DEPLOYMENT_MANIFEST.md',
    'MANUAL_ACCEPTANCE_GUIDE.md',
    'SANDBOX_QUICKSTART.md'
  ]).sort();
}

function assertExact(actual, expected, errorCode) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(errorCode);
  }
}

function parseChecksumFile(root, expectedFiles) {
  const checksumPath = path.join(root, builder.checksumsName);
  const lines = readBuffer(checksumPath).toString('utf8')
    .trimEnd().split('\n').filter(Boolean);
  const records = new Map();
  lines.forEach((line) => {
    const match = line.match(/^([0-9a-f]{64})  (.+)$/);
    if (!match || records.has(match[2])) {
      throw new Error('CHECKSUM_FILE_INVALID');
    }
    records.set(match[2], match[1]);
  });
  assertExact([...records.keys()].sort(), expectedFiles.filter(
    (file) => file !== builder.checksumsName
  ).sort(), 'CHECKSUM_FILE_INVENTORY_INVALID');
  records.forEach((digest, relativePath) => {
    const actual = sha256(readBuffer(path.join(root, relativePath)));
    if (actual !== digest) throw new Error(`CHECKSUM_MISMATCH_${relativePath}`);
  });
  return records;
}

function payloadRecords(root) {
  return listFiles(path.join(root, 'apps-script')).map((relativePath) => {
    const value = readBuffer(path.join(root, 'apps-script', relativePath));
    return {
      path: `apps-script/${relativePath}`,
      sha256: sha256(value),
      byte_length: value.length
    };
  });
}

function manifestPayloadHash(manifestText) {
  const match = manifestText.match(
    /Canonical payload-list SHA-256\s*\|\s*`([0-9a-f]{64})`/i
  );
  if (!match) throw new Error('MANIFEST_PAYLOAD_HASH_MISSING');
  return match[1];
}

function verifyPackage(options) {
  const root = path.join(releaseRoot, options.packageName);
  const sourceNames = options.phase8b
    ? builder.allSourceOrder
    : builder.phase8cSourceOrder;
  const expectedFiles = expectedPackageFiles(sourceNames);
  assertExact(listFiles(root), expectedFiles, 'RELEASE_PACKAGE_INVENTORY_INVALID');
  const checksums = parseChecksumFile(root, expectedFiles);
  const manifestText = readBuffer(path.join(root, 'DEPLOYMENT_MANIFEST.md'))
    .toString('utf8');
  for (const required of [
    `Package | \`${options.packageName}\``,
    `Source commit | \`${options.sourceCommit}\``,
    'Code Version | `2.8.27-prepilot`',
    'Schema Version | `2.6`',
    'AI Schema Version | `2.0`',
    'Migration Version | `3`',
    `TEST_MODE | \`${options.phase8b ? 'true' : 'false'}\``,
    `Test harness | \`${options.phase8b ? 'included' : 'excluded'}\``,
    'Automation default | `OFF`',
    `Highest local status | \`${gate}\``,
    'gpt-5.6-luna',
    'https://api.openai.com/v1/responses',
    'store=false',
    'NOT_APPROVED_OR_UNKNOWN',
    'NOT_EXECUTED'
  ]) {
    if (!manifestText.includes(required)) {
      throw new Error('RELEASE_MANIFEST_CONTRACT_INVALID');
    }
  }
  if (manifestText.includes('{{')) throw new Error('RELEASE_MANIFEST_TOKEN_PRESENT');
  const payload = payloadRecords(root);
  assertExact(payload.map((record) => record.path), expectedFiles.filter(
    (file) => file.startsWith('apps-script/')
  ), 'RELEASE_PAYLOAD_INVENTORY_INVALID');
  const expectedPayload = {};
  builder.allSourceOrder.forEach((name) => {
    if (name === '99_TestHarness.gs' && !options.phase8b) return;
    const source = gitShow(
      options.sourceCommit,
      `implementation/GoogleSpreadsheet/apps-script-v2/${name}`
    );
    expectedPayload[name] = options.phase8b || name !== '00_Config.gs'
      ? source
      : builder.transformPhase8cConfig(source.toString('utf8'));
  });
  expectedPayload[builder.manifestName] = gitShow(
    options.sourceCommit,
    'implementation/GoogleSpreadsheet/apps-script-v2/appsscript.json'
  );
  Object.entries(expectedPayload).forEach(([name, expectedValue]) => {
    const actual = readBuffer(path.join(root, 'apps-script', name));
    if (!actual.equals(expectedValue)) {
      throw new Error(`RELEASE_SOURCE_PARITY_INVALID_${name}`);
    }
    const checksum = checksums.get(`apps-script/${name}`);
    if (checksum !== sha256(actual)) {
      throw new Error(`RELEASE_PAYLOAD_CHECKSUM_INVALID_${name}`);
    }
  });
  if (manifestPayloadHash(manifestText) !== builder.canonicalPayloadHash(payload)) {
    throw new Error('RELEASE_PAYLOAD_BUNDLE_HASH_INVALID');
  }
  const manifestJson = JSON.parse(readBuffer(
    path.join(root, 'apps-script', builder.manifestName)
  ).toString('utf8'));
  if (manifestJson.runtimeVersion !== 'V8' ||
      !Array.isArray(manifestJson.oauthScopes)) {
    throw new Error('RELEASE_MANIFEST_JSON_INVALID');
  }
  const manualGuide = readBuffer(path.join(root, 'MANUAL_ACCEPTANCE_GUIDE.md'))
    .toString('utf8');
  const quickstart = readBuffer(path.join(root, 'SANDBOX_QUICKSTART.md'))
    .toString('utf8');
  for (const text of [manualGuide, quickstart]) {
    if (!text.includes('2.8.27-prepilot') ||
        !text.includes(gate) ||
        !text.includes('NOT_EXECUTED') ||
        text.includes('{{')) {
      throw new Error('RELEASE_GUIDANCE_CONTRACT_INVALID');
    }
  }
  return {
    package: options.packageName,
    payload_file_count: payload.length,
    package_file_count: expectedFiles.length,
    payload_sha256: builder.canonicalPayloadHash(payload),
    package_sha256: sha256(Buffer.from(expectedFiles.map((file) =>
      `${sha256(readBuffer(path.join(root, file)))}  ${file}\n`
    ).join(''), 'utf8')),
    checksums_sha256: sha256(readBuffer(path.join(root, builder.checksumsName)))
  };
}

function markerBegin(name, byteLength, digest) {
  return Buffer.from(
    `/* WORK_0041_SOURCE_BEGIN file=${name} bytes=${byteLength} sha256=${digest} */\n`,
    'utf8'
  );
}

function markerEnd(name) {
  return Buffer.from(`/* WORK_0041_SOURCE_END file=${name} */\n`, 'utf8');
}

function verifyBundle(sourceCommit, preparedAt) {
  const root = path.join(releaseRoot, builder.bundlePackage);
  assertExact(listFiles(root), builder.bundleOutputNames.slice().sort(),
    'BUNDLE_INVENTORY_INVALID');
  const checksums = parseChecksumFile(root, builder.bundleOutputNames);
  const code = readBuffer(path.join(root, 'Code.gs'));
  const manifest = readBuffer(path.join(root, builder.manifestName));
  const provenance = JSON.parse(readBuffer(
    path.join(root, builder.provenanceName)
  ).toString('utf8'));
  if (provenance.schema !== 'WORK_0041_SINGLE_FILE_INSTALL_V1' ||
      provenance.work_id !== '0041' ||
      provenance.dispatch_id !== '0041-CODEX-01' ||
      provenance.package !== builder.phase8cPackage ||
      provenance.source_commit !== sourceCommit ||
      provenance.prepared_at !== preparedAt ||
      provenance.manual_install.paste_count !== 2 ||
      JSON.stringify(provenance.manual_install.order) !==
        JSON.stringify(['Code.gs', builder.manifestName]) ||
      provenance.governance.store !== false ||
      provenance.governance.tools !== false ||
      provenance.governance.background !== false ||
      provenance.governance.stream !== false ||
      provenance.governance.data_governance_status !==
        'NOT_APPROVED_OR_UNKNOWN' ||
      provenance.governance.live_runtime !== 'NOT_EXECUTED') {
    throw new Error('BUNDLE_PROVENANCE_CONTRACT_INVALID');
  }
  if (provenance.bundle.sha256 !== sha256(code) ||
      provenance.bundle.byte_length !== code.length ||
      provenance.manifest.sha256 !== sha256(manifest) ||
      provenance.manifest.byte_length !== manifest.length ||
      provenance.text_transport.code_byte_identical !== true ||
      provenance.text_transport.manifest_byte_identical !== true) {
    throw new Error('BUNDLE_PROVENANCE_HASH_INVALID');
  }
  if (!code.subarray(0, Buffer.byteLength([
    '/*',
    ' * WORK_0041_SINGLE_FILE_COMPANY_INSTALL',
    ' * Derived from the validated Work 0041 Phase 8C Apps Script payload.',
    ' * The modular payload remains the canonical developer source.',
    ' * No loader, remote fetch, eval, or runtime bootstrap is used.',
    ' */',
    ''
  ].join('\n'), 'utf8')).equals(Buffer.from([
    '/*',
    ' * WORK_0041_SINGLE_FILE_COMPANY_INSTALL',
    ' * Derived from the validated Work 0041 Phase 8C Apps Script payload.',
    ' * The modular payload remains the canonical developer source.',
    ' * No loader, remote fetch, eval, or runtime bootstrap is used.',
    ' */',
    ''
  ].join('\n'), 'utf8'))) {
    throw new Error('BUNDLE_HEADER_INVALID');
  }
  if (JSON.stringify(provenance.source_order) !==
      JSON.stringify(builder.phase8cSourceOrder)) {
    throw new Error('BUNDLE_SOURCE_ORDER_INVALID');
  }
  let cursor = Buffer.byteLength([
    '/*',
    ' * WORK_0041_SINGLE_FILE_COMPANY_INSTALL',
    ' * Derived from the validated Work 0041 Phase 8C Apps Script payload.',
    ' * The modular payload remains the canonical developer source.',
    ' * No loader, remote fetch, eval, or runtime bootstrap is used.',
    ' */',
    ''
  ].join('\n'), 'utf8');
  builder.phase8cSourceOrder.forEach((name, index) => {
    const source = readBuffer(path.join(
      releaseRoot, builder.phase8cPackage, 'apps-script', name
    ));
    const digest = sha256(source);
    const begin = markerBegin(name, source.length, digest);
    const end = markerEnd(name);
    if (code.indexOf(begin, cursor) !== cursor) {
      throw new Error(`BUNDLE_SOURCE_BEGIN_INVALID_${name}`);
    }
    const sourceStart = cursor + begin.length;
    const endIndex = code.indexOf(end, sourceStart);
    if (endIndex < 0) throw new Error(`BUNDLE_SOURCE_END_MISSING_${name}`);
    const section = code.subarray(sourceStart, endIndex);
    const expectedSection = source.length && source[source.length - 1] === 0x0a
      ? source : Buffer.concat([source, Buffer.from('\n', 'utf8')]);
    if (!section.equals(expectedSection)) {
      throw new Error(`BUNDLE_SOURCE_BYTES_INVALID_${name}`);
    }
    const metadata = provenance.source_files[index];
    if (!metadata || metadata.name !== name || metadata.byte_length !== source.length ||
        metadata.sha256 !== digest || metadata.source_start_byte !== sourceStart ||
        metadata.source_end_byte !== sourceStart + source.length ||
        metadata.trailing_separator_bytes !== expectedSection.length - source.length) {
      throw new Error(`BUNDLE_SOURCE_PROVENANCE_INVALID_${name}`);
    }
    const codeText = code.toString('utf8');
    if (codeText.split(`/* WORK_0041_SOURCE_BEGIN file=${name} `).length - 1 !== 1 ||
        codeText.split(`/* WORK_0041_SOURCE_END file=${name} */`).length - 1 !== 1) {
      throw new Error(`BUNDLE_SOURCE_MARKER_DUPLICATE_${name}`);
    }
    cursor = endIndex + end.length;
  });
  if (cursor !== code.length ||
      JSON.parse(manifest.toString('utf8')).runtimeVersion !== 'V8') {
    throw new Error('BUNDLE_TRAILING_BYTES_OR_MANIFEST_INVALID');
  }
  new vm.Script(code.toString('utf8'), { filename: 'Work0041-Code.gs' });
  if (!readBuffer(path.join(root, 'Code.gs.txt')).equals(code) ||
      !readBuffer(path.join(root, 'appsscript.json.txt')).equals(manifest)) {
    throw new Error('BUNDLE_TEXT_TRANSPORT_NOT_BYTE_IDENTICAL');
  }
  if (checksums.get('Code.gs.txt') !== sha256(code) ||
      checksums.get('appsscript.json.txt') !== sha256(manifest)) {
    throw new Error('BUNDLE_TEXT_TRANSPORT_CHECKSUM_INVALID');
  }
  return {
    package: builder.bundlePackage,
    source_file_count: builder.phase8cSourceOrder.length,
    code_gs_bytes: code.length,
    code_gs_sha256: sha256(code),
    manifest_sha256: sha256(manifest),
    checksums_sha256: sha256(readBuffer(path.join(root, builder.checksumsName)))
  };
}

function verifyReproducibility(sourceCommit, preparedAt) {
  const temporaryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'work-0041-release-verify-')
  );
  try {
    builder.buildRelease({
      sourceCommit,
      preparedAt,
      outputBase: temporaryRoot,
      requireHeadMatch: false
    });
    for (const packageName of [
      builder.phase8bPackage,
      builder.phase8cPackage,
      builder.bundlePackage
    ]) {
      const expected = path.join(releaseRoot, packageName);
      const actual = path.join(temporaryRoot, packageName);
      assertExact(listFiles(actual), listFiles(expected),
        `REPRODUCIBILITY_INVENTORY_INVALID_${packageName}`);
      listFiles(expected).forEach((relativePath) => {
        if (!readBuffer(path.join(expected, relativePath)).equals(
          readBuffer(path.join(actual, relativePath))
        )) {
          throw new Error(`REPRODUCIBILITY_BYTES_INVALID_${packageName}`);
        }
      });
    }
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
  return { deterministic_rebuild: 'PASS' };
}

function readContract() {
  if (!fs.existsSync(contractPath)) throw new Error('CURRENT_CONTRACT_MISSING');
  const value = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  if (value.schema !== 'WORK_OS_CURRENT_CONTRACT_V1' ||
      value.branch !== 'codex/0041-calendar-runtime-remediation' ||
      value.code_version !== '2.8.27-prepilot' ||
      value.schema_version !== '2.6' ||
      value.ai_schema_version !== '2.0' ||
      value.migration_version !== '3' ||
      value.highest_gate !== gate || value.automation !== false ||
      value.active_transfer !== null || value.active_deployment !== null ||
      !/^[0-9a-f]{40}$/.test(String(value.source_commit || '')) ||
      !value.work_0039 || !value.work_0041 ||
      value.work_0039.openai_data_governance_status !==
        'NOT_APPROVED_OR_UNKNOWN' ||
      value.work_0041.live_runtime !== 'NOT_EXECUTED') {
    throw new Error('CURRENT_CONTRACT_WORK_0041_INVALID');
  }
  return value;
}

function verifyRelease(options = {}) {
  const contract = readContract();
  const sourceCommit = String(options.sourceCommit || contract.source_commit);
  if (sourceCommit !== contract.source_commit) {
    throw new Error('RELEASE_SOURCE_COMMIT_CONTRACT_MISMATCH');
  }
  const bundleProvenance = JSON.parse(readBuffer(path.join(
    releaseRoot, builder.bundlePackage, builder.provenanceName
  )).toString('utf8'));
  const preparedAt = options.preparedAt || bundleProvenance.prepared_at;
  if (!/^\d{4}-\d{2}-\d{2}T/.test(preparedAt)) {
    throw new Error('RELEASE_PREPARED_AT_INVALID');
  }
  const phase8b = verifyPackage({
    packageName: builder.phase8bPackage,
    phase8b: true,
    sourceCommit
  });
  const phase8c = verifyPackage({
    packageName: builder.phase8cPackage,
    phase8b: false,
    sourceCommit
  });
  const bundle = verifyBundle(sourceCommit, preparedAt);
  const reproducibility = verifyReproducibility(sourceCommit, preparedAt);
  return {
    schema: 'WORK_0041_RELEASE_VERIFICATION_RESULT_V1',
    source_commit: sourceCommit,
    phase8b,
    phase8c,
    bundle,
    reproducibility
  };
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--source-commit') result.sourceCommit = argv[++index];
    else if (argv[index] === '--prepared-at') result.preparedAt = argv[++index];
    else if (argv[index] === '--help') result.help = true;
    else throw new Error('WORK_0041_VERIFY_UNKNOWN_ARGUMENT');
  }
  return result;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(
      'Usage: node tools/verify_work_0041_release.js ' +
      '[--source-commit SHA] [--prepared-at ISO]\n'
    );
    return;
  }
  process.stdout.write(`${JSON.stringify(verifyRelease(options), null, 2)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${String(error && error.message || error)}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  verifyRelease,
  verifyPackage,
  verifyBundle,
  verifyReproducibility
};
