'use strict';

/**
 * Build the derived Work 0038 single-file Apps Script installation artifact.
 *
 * The Phase 8C modular payload remains the canonical developer source. This
 * tool only packages its 22 runtime .gs files into one Code.gs, preserving
 * each input file's bytes between deterministic provenance markers.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const moduleRoot = path.resolve(__dirname, '..');
const phase8cPackage = 'v2.8.25-prepilot-phase8c';
const phase8cSourceCommit =
  '8364a2deb091d52ef322c9aa6cb67098f721d93e';
const defaultSourceRoot = path.join(
  moduleRoot,
  'release',
  phase8cPackage,
  'apps-script'
);
const defaultOutputRoot = path.join(
  moduleRoot,
  'release',
  'work-0038-single-file-company-install'
);
const manifestName = 'appsscript.json';
const provenanceName = 'BUNDLE_PROVENANCE.json';
const checksumsName = 'CHECKSUMS.sha256';
const outputNames = Object.freeze([
  'Code.gs',
  manifestName,
  provenanceName,
  checksumsName
]);

const sourceOrder = Object.freeze([
  '00_Config.gs',
  '01_TypesAndSchemas.gs',
  '02_Setup.gs',
  '03_SheetBuilder.gs',
  '04_MessageStateRepository.gs',
  '05_GmailGateway.gs',
  '06_EmailPreprocessor.gs',
  '07_AiAdapter.gs',
  '08_TaskRepository.gs',
  '09_TaskReviewPolicy.gs',
  '10_CalendarSync.gs',
  '11_EditHandler.gs',
  '12_Triggers.gs',
  '13_LogAndDeadLetter.gs',
  '14_Migrations.gs',
  '15_Dashboard.gs',
  '16_Diagnostics.gs',
  '17_Utilities.gs',
  '18_Worker.gs',
  '19_RuntimeSettings.gs',
  '20_GeminiProvider.gs',
  'Menu.gs'
]);

const bundleHeader = [
  '/*',
  ' * WORK_0038_SINGLE_FILE_COMPANY_INSTALL',
  ' * Derived from the validated Phase 8C Apps Script payload.',
  ' * The modular payload remains the canonical developer source.',
  ' * No loader, remote fetch, eval, or runtime bootstrap is used.',
  ' */',
  ''
].join('\n');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readBuffer(filePath) {
  return fs.readFileSync(filePath);
}

function writeBuffer(filePath, value) {
  fs.writeFileSync(filePath, value);
}

function sourceBeginMarker(name, byteLength, digest) {
  return `/* WORK_0038_SOURCE_BEGIN file=${name} bytes=${byteLength} sha256=${digest} */\n`;
}

function sourceEndMarker(name) {
  return `/* WORK_0038_SOURCE_END file=${name} */\n`;
}

function assertInputInventory(sourceRoot) {
  if (!fs.existsSync(sourceRoot) || !fs.statSync(sourceRoot).isDirectory()) {
    throw new Error('WORK_0038_SOURCE_ROOT_MISSING');
  }
  const expected = sourceOrder.concat(manifestName).sort();
  const actual = fs.readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  if (actual.length !== expected.length ||
      actual.some((name, index) => name !== expected[index])) {
    throw new Error('WORK_0038_PHASE8C_INPUT_INVENTORY_INVALID');
  }
}

function sourceCommitFromPackage(packageRoot) {
  const manifestPath = path.join(packageRoot, 'DEPLOYMENT_MANIFEST.md');
  const text = fs.readFileSync(manifestPath, 'utf8');
  const match = text.match(/\|\s*Source commit\s*\|\s*`?([0-9a-f]{40})`?\s*\|/i);
  if (!match) throw new Error('WORK_0038_PHASE8C_SOURCE_COMMIT_MISSING');
  const sourceCommit = match[1].toLowerCase();
  if (sourceCommit !== phase8cSourceCommit) {
    throw new Error('WORK_0038_PHASE8C_SOURCE_COMMIT_UNEXPECTED');
  }
  return sourceCommit;
}

function validatedPayloadChecksums(packageRoot) {
  const checksumPath = path.join(packageRoot, 'CHECKSUMS.sha256');
  const records = new Map();
  fs.readFileSync(checksumPath, 'utf8').trimEnd().split(/\r?\n/)
    .forEach((line) => {
      const match = line.match(/^([0-9a-f]{64})  (.+)$/i);
      if (match) records.set(match[2], match[1].toLowerCase());
    });
  const required = sourceOrder.concat(manifestName).map(
    (name) => `apps-script/${name}`
  );
  if (required.some((name) => !records.has(name))) {
    throw new Error('WORK_0038_PHASE8C_VALIDATED_CHECKSUMS_INCOMPLETE');
  }
  return records;
}

function assertOutputDirectory(outputRoot) {
  if (!fs.existsSync(outputRoot)) {
    fs.mkdirSync(outputRoot, { recursive: true });
    return;
  }
  if (!fs.statSync(outputRoot).isDirectory()) {
    throw new Error('WORK_0038_OUTPUT_ROOT_NOT_DIRECTORY');
  }
  const actual = fs.readdirSync(outputRoot, { withFileTypes: true })
    .map((entry) => entry.name)
    .sort();
  const expected = outputNames.slice().sort();
  if (actual.length !== expected.length ||
      actual.some((name, index) => name !== expected[index])) {
    throw new Error('WORK_0038_OUTPUT_DIRECTORY_INVENTORY_INVALID');
  }
}

function buildBundle(options = {}) {
  const sourceRoot = path.resolve(options.sourceRoot || defaultSourceRoot);
  const packageRoot = path.dirname(sourceRoot);
  const outputRoot = path.resolve(options.outputRoot || defaultOutputRoot);
  assertInputInventory(sourceRoot);
  const validatedChecksums = validatedPayloadChecksums(packageRoot);

  const manifest = readBuffer(path.join(sourceRoot, manifestName));
  let manifestJson;
  try {
    manifestJson = JSON.parse(manifest.toString('utf8'));
  } catch (error) {
    throw new Error('WORK_0038_PHASE8C_MANIFEST_INVALID');
  }
  if (manifestJson.runtimeVersion !== 'V8' ||
      !Array.isArray(manifestJson.oauthScopes)) {
    throw new Error('WORK_0038_PHASE8C_MANIFEST_CONTRACT_INVALID');
  }
  if (sha256(manifest) !== validatedChecksums.get(`apps-script/${manifestName}`)) {
    throw new Error('WORK_0038_PHASE8C_MANIFEST_HASH_INVALID');
  }

  const parts = [Buffer.from(bundleHeader, 'utf8')];
  let offset = Buffer.byteLength(bundleHeader, 'utf8');
  const sourceFiles = [];

  sourceOrder.forEach((name) => {
    const source = readBuffer(path.join(sourceRoot, name));
    const digest = sha256(source);
    if (digest !== validatedChecksums.get(`apps-script/${name}`)) {
      throw new Error(`WORK_0038_PHASE8C_SOURCE_HASH_INVALID_${name}`);
    }
    const begin = Buffer.from(
      sourceBeginMarker(name, source.length, digest),
      'utf8'
    );
    const sourceStart = offset + begin.length;
    const endSeparator = source.length > 0 && source[source.length - 1] === 0x0a
      ? Buffer.alloc(0)
      : Buffer.from('\n', 'utf8');
    const end = Buffer.from(sourceEndMarker(name), 'utf8');
    parts.push(begin, source, endSeparator, end);
    sourceFiles.push({
      name,
      byte_length: source.length,
      sha256: digest,
      source_start_byte: sourceStart,
      source_end_byte: sourceStart + source.length,
      trailing_separator_bytes: endSeparator.length
    });
    offset += begin.length + source.length + endSeparator.length + end.length;
  });

  const code = Buffer.concat(parts);
  const packageVersion = sourceCommitFromPackage(packageRoot);
  const provenance = {
    schema: 'WORK_0038_SINGLE_FILE_INSTALL_V1',
    work_id: '0038',
    dispatch_id: '0038-CODEX-01',
    package: phase8cPackage,
    source_root: `implementation/GoogleSpreadsheet/release/${phase8cPackage}/apps-script`,
    source_commit: packageVersion,
    generated_by: 'implementation/GoogleSpreadsheet/tools/build_work_0038_single_file_company_install.js',
    encoding: 'UTF-8 bytes; source sections are preserved without normalization',
    manual_install: {
      paste_count: 2,
      application_code_file: 'Code.gs',
      manifest_file: manifestName
    },
    source_order: sourceOrder,
    source_files: sourceFiles,
    bundle: {
      path: 'Code.gs',
      byte_length: code.length,
      sha256: sha256(code)
    },
    manifest: {
      path: manifestName,
      byte_length: manifest.length,
      sha256: sha256(manifest)
    },
    separators: {
      begin_marker: '/* WORK_0038_SOURCE_BEGIN ... */',
      end_marker: '/* WORK_0038_SOURCE_END ... */',
      newline: '\n'
    }
  };
  const provenanceBytes = Buffer.from(
    `${JSON.stringify(provenance, null, 2)}\n`,
    'utf8'
  );
  const checksumRecords = [
    [provenanceName, sha256(provenanceBytes)],
    ['Code.gs', sha256(code)],
    [manifestName, sha256(manifest)]
  ].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
  const checksums = Buffer.from(
    `${checksumRecords.map(([name, digest]) => `${digest}  ${name}`).join('\n')}\n`,
    'utf8'
  );

  assertOutputDirectory(outputRoot);
  writeBuffer(path.join(outputRoot, 'Code.gs'), code);
  writeBuffer(path.join(outputRoot, manifestName), manifest);
  writeBuffer(path.join(outputRoot, provenanceName), provenanceBytes);
  writeBuffer(path.join(outputRoot, checksumsName), checksums);

  return {
    outputRoot,
    sourceRoot,
    files: outputNames.slice(),
    sourceFiles,
    bundle: provenance.bundle,
    manifest: provenance.manifest,
    checksums: sha256(checksums)
  };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--source-root') {
      options.sourceRoot = argv[++index];
    } else if (argument === '--output-root') {
      options.outputRoot = argv[++index];
    } else if (argument === '--help') {
      options.help = true;
    } else {
      throw new Error('WORK_0038_UNKNOWN_ARGUMENT');
    }
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(
      'Usage: node tools/build_work_0038_single_file_company_install.js ' +
      '[--source-root PATH] [--output-root PATH]\n'
    );
    return;
  }
  const result = buildBundle(options);
  process.stdout.write(`${JSON.stringify({
    schema: 'WORK_0038_SINGLE_FILE_BUILD_RESULT_V1',
    output_root: result.outputRoot,
    source_root: result.sourceRoot,
    source_file_count: result.sourceFiles.length,
    code_gs_bytes: result.bundle.byte_length,
    code_gs_sha256: result.bundle.sha256,
    manifest_bytes: result.manifest.byte_length,
    manifest_sha256: result.manifest.sha256,
    checksums_sha256: result.checksums
  }, null, 2)}\n`);
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
  phase8cPackage,
  phase8cSourceCommit,
  sourceOrder,
  manifestName,
  provenanceName,
  checksumsName,
  outputNames,
  defaultSourceRoot,
  defaultOutputRoot,
  sourceBeginMarker,
  sourceEndMarker,
  sha256,
  buildBundle
};
