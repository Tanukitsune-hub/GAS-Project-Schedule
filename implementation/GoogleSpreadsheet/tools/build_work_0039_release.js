'use strict';

/**
 * Build the Work 0039 versioned Phase 8B/8C packages and the derived
 * two-paste company-install bundle.  Source bytes are read from the supplied
 * Git commit so the package cannot silently include an uncommitted checkout.
 * This tool performs no Google, OpenAI, OAuth, clasp, or deployment action.
 */
const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const moduleRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(moduleRoot, '..', '..');
const sourceRelativeRoot = 'implementation/GoogleSpreadsheet/apps-script-v2';
const codeVersion = '2.8.26-prepilot';
const phase8bPackage = `v${codeVersion}`;
const phase8cPackage = `v${codeVersion}-phase8c`;
const bundlePackage = 'work-0039-single-file-company-install';
const manifestName = 'appsscript.json';
const provenanceName = 'BUNDLE_PROVENANCE.json';
const checksumsName = 'CHECKSUMS.sha256';
const repositoryName = 'Tanukitsune-hub/GAS-Project-Schedule';

const allSourceOrder = Object.freeze([
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
  '21_OpenAiProvider.gs',
  '22_AiProviderSelection.gs',
  '99_TestHarness.gs',
  'Menu.gs'
]);
const phase8cSourceOrder = Object.freeze(
  allSourceOrder.filter((name) => name !== '99_TestHarness.gs')
);
const bundleOutputNames = Object.freeze([
  'Code.gs',
  manifestName,
  provenanceName,
  checksumsName,
  'Code.gs.txt',
  'appsscript.json.txt'
]);

const bundleHeader = [
  '/*',
  ' * WORK_0039_SINGLE_FILE_COMPANY_INSTALL',
  ' * Derived from the validated Work 0039 Phase 8C Apps Script payload.',
  ' * The modular payload remains the canonical developer source.',
  ' * No loader, remote fetch, eval, or runtime bootstrap is used.',
  ' */',
  ''
].join('\n');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function gitResult(args) {
  return childProcess.spawnSync('git', ['-C', repositoryRoot].concat(args), {
    encoding: null,
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024
  });
}

function gitText(args, failureCode) {
  const result = gitResult(args);
  if (result.error || result.status !== 0) {
    throw new Error(failureCode || 'GIT_COMMAND_FAILED');
  }
  return Buffer.from(result.stdout || '').toString('utf8').trim();
}

function gitBuffer(commit, relativePath) {
  const result = gitResult(['show', `${commit}:${relativePath}`]);
  if (result.error || result.status !== 0) {
    throw new Error(`SOURCE_COMMIT_FILE_MISSING_${relativePath}`);
  }
  return Buffer.from(result.stdout || '');
}

function writeBuffer(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function assertEmptyTarget(target) {
  if (!fs.existsSync(target)) return;
  if (!fs.statSync(target).isDirectory()) {
    throw new Error('RELEASE_TARGET_NOT_DIRECTORY');
  }
  if (fs.readdirSync(target).length) {
    throw new Error('RELEASE_TARGET_NON_EMPTY_REFUSING_OVERWRITE');
  }
}

function assertExactCommit(sourceCommit, requireHeadMatch) {
  if (!/^[0-9a-f]{40}$/i.test(String(sourceCommit || ''))) {
    throw new Error('SOURCE_COMMIT_MUST_BE_EXACT_40_CHAR_SHA');
  }
  const resolved = gitText(
    ['rev-parse', '--verify', `${sourceCommit}^{commit}`],
    'SOURCE_COMMIT_NOT_FOUND'
  ).toLowerCase();
  if (resolved !== sourceCommit.toLowerCase()) {
    throw new Error('SOURCE_COMMIT_DID_NOT_RESOLVE_EXACTLY');
  }
  if (requireHeadMatch) {
    const head = gitText(['rev-parse', '--verify', 'HEAD^{commit}']);
    if (head.toLowerCase() !== resolved) {
      throw new Error('SOURCE_COMMIT_MUST_MATCH_HEAD');
    }
    const status = gitText([
      'status', '--porcelain=v1', '--untracked-files=normal', '--',
      sourceRelativeRoot, 'implementation/GoogleSpreadsheet/tools'
    ]);
    if (status) throw new Error('CANONICAL_SOURCE_AND_TOOL_INPUTS_NOT_CLEAN');
  }
  return resolved;
}

function loadSourcePayload(sourceCommit) {
  const files = {};
  allSourceOrder.forEach((name) => {
    files[name] = gitBuffer(
      sourceCommit,
      `${sourceRelativeRoot}/${name}`
    );
  });
  files[manifestName] = gitBuffer(
    sourceCommit,
    `${sourceRelativeRoot}/${manifestName}`
  );
  return files;
}

function assertSourceContract(files) {
  const config = files['00_Config.gs'].toString('utf8');
  for (const pattern of [
    /CODE_VERSION:\s*'2\.8\.26-prepilot'/,
    /SCHEMA_VERSION:\s*'2\.6'/,
    /AI_SCHEMA_VERSION:\s*'2\.0'/,
    /MIGRATION_VERSION:\s*'3'/,
    /TEST_MODE:\s*true/,
    /AUTOMATION_ENABLED:\s*false/,
    /AI_PROVIDER_SELECTION_ALLOWED:\s*Object\.freeze\(\['GEMINI', 'OPENAI'\]\)/,
    /OPENAI_MODEL:\s*'gpt-5\.6-luna'/,
    /OPENAI_ENDPOINT:\s*'https:\/\/api\.openai\.com\/v1\/responses'/,
    /OPENAI_DATA_GOVERNANCE_STATUS:\s*'NOT_APPROVED_OR_UNKNOWN'/
  ]) {
    if (!pattern.test(config)) {
      throw new Error('SOURCE_CONFIGURATION_CONTRACT_INVALID');
    }
  }
  const manifest = JSON.parse(files[manifestName].toString('utf8'));
  if (manifest.runtimeVersion !== 'V8' ||
      !Array.isArray(manifest.oauthScopes) ||
      !manifest.dependencies ||
      !Array.isArray(manifest.dependencies.enabledAdvancedServices)) {
    throw new Error('SOURCE_MANIFEST_CONTRACT_INVALID');
  }
  return manifest;
}

function transformPhase8cConfig(sourceConfig) {
  let transformed = sourceConfig;
  const transforms = [
    ['TEST_MODE', /TEST_MODE:\s*true/g, 'TEST_MODE: false'],
    ['EXTERNAL_AI_ENABLED', /^\s*EXTERNAL_AI_ENABLED:\s*false/gm,
      'EXTERNAL_AI_ENABLED: true'],
    ['EXTERNAL_AI_OPERATOR_APPROVED',
      /^\s*EXTERNAL_AI_OPERATOR_APPROVED:\s*false/gm,
      'EXTERNAL_AI_OPERATOR_APPROVED: true'],
    ['EXTERNAL_AI_DATA_POLICY_APPROVED',
      /^\s*EXTERNAL_AI_DATA_POLICY_APPROVED:\s*false/gm,
      'EXTERNAL_AI_DATA_POLICY_APPROVED: true'],
    ['EXTERNAL_AI_CREDENTIAL_STORAGE_APPROVED',
      /^\s*EXTERNAL_AI_CREDENTIAL_STORAGE_APPROVED:\s*false/gm,
      'EXTERNAL_AI_CREDENTIAL_STORAGE_APPROVED: true'],
    ['EXTERNAL_AI_AUTH_CONFIGURED',
      /^\s*EXTERNAL_AI_AUTH_CONFIGURED:\s*false/gm,
      'EXTERNAL_AI_AUTH_CONFIGURED: true']
  ];
  transforms.forEach(([name, pattern, replacement]) => {
    const count = (transformed.match(pattern) || []).length;
    if (count !== 1) throw new Error(`PHASE8C_TRANSFORM_${name}_COUNT_INVALID`);
    transformed = transformed.replace(pattern, replacement);
  });
  if (!/AUTOMATION_ENABLED:\s*false/.test(transformed) ||
      !/EXTERNAL_AI_COMPANY_APPROVED:\s*false/.test(transformed) ||
      !/OPENAI_EXTERNAL_AI_ENABLED:\s*false/.test(transformed) ||
      !/OPENAI_DATA_POLICY_APPROVED:\s*false/.test(transformed)) {
    throw new Error('PHASE8C_SAFETY_FLAGS_INVALID');
  }
  return Buffer.from(transformed, 'utf8');
}

function payloadRecords(payload) {
  const names = Object.keys(payload).sort();
  return names.map((name) => ({
    path: `apps-script/${name}`,
    sha256: sha256(payload[name]),
    byte_length: payload[name].length
  }));
}

function canonicalPayloadHash(records) {
  return sha256(records.map((record) =>
    `${record.sha256}  ${record.path}\n`
  ).join(''));
}

function payloadTable(records) {
  return records.map((record) =>
    `| \`${record.path}\` | \`${record.sha256}\` |`
  ).join('\n');
}

function oauthScopeLines(manifest) {
  return manifest.oauthScopes.map((scope) => `- \`${scope}\``).join('\n');
}

function advancedServiceLines(manifest) {
  return manifest.dependencies.enabledAdvancedServices.map((service) =>
    `- \`${service.userSymbol}\`: service \`${service.serviceId}\`, version \`${service.version}\``
  ).join('\n');
}

function renderTemplate(templateName, replacements) {
  const templatePath = path.join(moduleRoot, 'tools', 'v2_8_26', templateName);
  if (!fs.existsSync(templatePath)) throw new Error('RELEASE_TEMPLATE_MISSING');
  let text = fs.readFileSync(templatePath, 'utf8');
  Object.entries(replacements).forEach(([key, value]) => {
    text = text.replaceAll(`{{${key}}}`, String(value));
  });
  if (/\{\{[A-Z0-9_]+\}\}/.test(text)) {
    throw new Error('RELEASE_TEMPLATE_TOKEN_UNRESOLVED');
  }
  return Buffer.from(text.replace(/\r\n/g, '\n'), 'utf8');
}

function phaseDescription(phase8b) {
  return phase8b
    ? 'Phase 8B retains `TEST_MODE=true` and `99_TestHarness.gs` for local\nnon-live validation. It is not a deployment or runtime authorization.'
    : 'Phase 8C excludes `99_TestHarness.gs` and changes only the audited legacy\nGemini production-readiness flags plus `TEST_MODE=false`. OpenAI readiness and\ndata-governance flags remain disabled, and Automation remains OFF.';
}

function phaseNote(phase8b) {
  return phase8b
    ? 'Phase 8B is test-shaped and must remain outside any live installation.'
    : 'Phase 8C is a candidate artifact only. The two-paste company bundle is\nderived from this payload; live company acceptance remains unexecuted.';
}

function renderPackageManifest(options) {
  const records = options.records;
  return renderTemplate('DEPLOYMENT_MANIFEST.template.md', {
    PHASE: options.phase,
    PACKAGE: options.packageName,
    REPOSITORY: repositoryName,
    SOURCE_COMMIT: options.sourceCommit,
    RELEASE_COMMIT: 'SELF (the Git commit containing this manifest)',
    TEST_MODE: options.testMode,
    TEST_HARNESS: options.testHarness ? 'included' : 'excluded',
    PREPARED_AT: options.preparedAt,
    PHASE_DESCRIPTION: phaseDescription(options.phase8b),
    PAYLOAD_COUNT: records.length,
    GS_COUNT: records.filter((record) => record.path.endsWith('.gs')).length,
    PAYLOAD_BUNDLE_SHA256: canonicalPayloadHash(records),
    PAYLOAD_TABLE: payloadTable(records),
    OAUTH_SCOPES: oauthScopeLines(options.manifest),
    ADVANCED_SERVICES: advancedServiceLines(options.manifest)
  });
}

function packageExpectedFiles(payload) {
  return Object.keys(payload).map((name) => `apps-script/${name}`)
    .concat([
      'DEPLOYMENT_MANIFEST.md',
      'MANUAL_ACCEPTANCE_GUIDE.md',
      'SANDBOX_QUICKSTART.md',
      checksumsName
    ]).sort();
}

function packageFiles(root) {
  const result = [];
  function visit(directory) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else result.push(path.relative(root, absolute).replaceAll(path.sep, '/'));
    });
  }
  visit(root);
  return result.sort();
}

function writePackage(options) {
  const root = options.root;
  assertEmptyTarget(root);
  const payload = {};
  const sourceNames = options.phase8b ? allSourceOrder : phase8cSourceOrder;
  sourceNames.forEach((name) => {
    payload[name] = options.phase8b
      ? options.sourceFiles[name]
      : (name === '00_Config.gs'
        ? transformPhase8cConfig(
          options.sourceFiles[name].toString('utf8')
        )
        : options.sourceFiles[name]);
  });
  payload[manifestName] = options.sourceFiles[manifestName];
  Object.entries(payload).forEach(([name, value]) => {
    writeBuffer(path.join(root, 'apps-script', name), value);
  });
  const records = payloadRecords(payload);
  const manifest = renderPackageManifest(Object.assign({}, options, {
    records,
    manifest: options.sourceManifest
  }));
  writeBuffer(path.join(root, 'DEPLOYMENT_MANIFEST.md'), manifest);
  writeBuffer(path.join(root, 'MANUAL_ACCEPTANCE_GUIDE.md'),
    renderTemplate('MANUAL_ACCEPTANCE_GUIDE.md', {
      PACKAGE: options.packageName,
      TEST_MODE: options.testMode,
      PHASE_NOTE: phaseNote(options.phase8b)
    }));
  writeBuffer(path.join(root, 'SANDBOX_QUICKSTART.md'),
    renderTemplate('SANDBOX_QUICKSTART.md', {
      PACKAGE: options.packageName,
      TEST_MODE: options.testMode
    }));
  const actualBeforeChecksum = packageFiles(root)
    .filter((file) => file !== checksumsName);
  const expected = packageExpectedFiles(payload)
    .filter((file) => file !== checksumsName);
  if (JSON.stringify(actualBeforeChecksum) !== JSON.stringify(expected)) {
    throw new Error('RELEASE_PACKAGE_INVENTORY_INVALID');
  }
  const checksumLines = actualBeforeChecksum.map((file) => {
    const value = fs.readFileSync(path.join(root, file));
    return `${sha256(value)}  ${file}`;
  });
  writeBuffer(path.join(root, checksumsName),
    Buffer.from(`${checksumLines.join('\n')}\n`, 'utf8'));
  const actual = packageFiles(root);
  if (JSON.stringify(actual) !== JSON.stringify(packageExpectedFiles(payload))) {
    throw new Error('RELEASE_PACKAGE_FINAL_INVENTORY_INVALID');
  }
  return {
    root,
    package: options.packageName,
    phase: options.phase,
    payload_count: records.length,
    gs_count: records.filter((record) => record.path.endsWith('.gs')).length,
    package_file_count: actual.length,
    payload_sha256: canonicalPayloadHash(records),
    package_sha256: sha256(Buffer.from(actual.map((file) =>
      `${sha256(fs.readFileSync(path.join(root, file)))}  ${file}\n`
    ).join(''), 'utf8'))
  };
}

function sourceBeginMarker(name, byteLength, digest) {
  return `/* WORK_0039_SOURCE_BEGIN file=${name} bytes=${byteLength} sha256=${digest} */\n`;
}

function sourceEndMarker(name) {
  return `/* WORK_0039_SOURCE_END file=${name} */\n`;
}

function buildBundle(options) {
  const outputRoot = options.bundleRoot;
  assertEmptyTarget(outputRoot);
  const phase8cRoot = path.join(options.phase8cRoot, 'apps-script');
  const manifest = fs.readFileSync(path.join(phase8cRoot, manifestName));
  const parts = [Buffer.from(bundleHeader, 'utf8')];
  const sourceFiles = [];
  let offset = Buffer.byteLength(bundleHeader, 'utf8');
  phase8cSourceOrder.forEach((name) => {
    const source = fs.readFileSync(path.join(phase8cRoot, name));
    const digest = sha256(source);
    const begin = Buffer.from(sourceBeginMarker(name, source.length, digest), 'utf8');
    const end = Buffer.from(sourceEndMarker(name), 'utf8');
    const sourceStart = offset + begin.length;
    const separator = source.length && source[source.length - 1] === 0x0a
      ? Buffer.alloc(0) : Buffer.from('\n', 'utf8');
    parts.push(begin, source, separator, end);
    sourceFiles.push({
      name,
      byte_length: source.length,
      sha256: digest,
      source_start_byte: sourceStart,
      source_end_byte: sourceStart + source.length,
      trailing_separator_bytes: separator.length
    });
    offset += begin.length + source.length + separator.length + end.length;
  });
  const code = Buffer.concat(parts);
  const provenance = {
    schema: 'WORK_0039_SINGLE_FILE_INSTALL_V1',
    work_id: '0039',
    dispatch_id: '0039-CODEX-03',
    package: phase8cPackage,
    source_root: `implementation/GoogleSpreadsheet/release/${phase8cPackage}/apps-script`,
    source_commit: options.sourceCommit,
    prepared_at: options.preparedAt,
    generated_by: 'implementation/GoogleSpreadsheet/tools/build_work_0039_release.js',
    encoding: 'UTF-8 bytes; source sections are preserved without normalization',
    manual_install: {
      paste_count: 2,
      order: ['Code.gs', manifestName],
      application_code_file: 'Code.gs',
      manifest_file: manifestName,
      text_transport_copies: ['Code.gs.txt', 'appsscript.json.txt']
    },
    governance: {
      openai_endpoint: 'https://api.openai.com/v1/responses',
      openai_model: 'gpt-5.6-luna',
      openai_prompt_version: 'openai-responses-v1-work-os-v2',
      store: false,
      tools: false,
      background: false,
      stream: false,
      data_governance_status: 'NOT_APPROVED_OR_UNKNOWN',
      live_runtime: 'NOT_EXECUTED'
    },
    source_order: phase8cSourceOrder,
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
    text_transport: {
      code_path: 'Code.gs.txt',
      manifest_path: 'appsscript.json.txt',
      code_byte_identical: true,
      manifest_byte_identical: true
    },
    separators: {
      begin_marker: '/* WORK_0039_SOURCE_BEGIN ... */',
      end_marker: '/* WORK_0039_SOURCE_END ... */',
      newline: '\n'
    }
  };
  const provenanceBytes = Buffer.from(`${JSON.stringify(provenance, null, 2)}\n`, 'utf8');
  const outputs = {
    'Code.gs': code,
    [manifestName]: manifest,
    [provenanceName]: provenanceBytes,
    'Code.gs.txt': code,
    'appsscript.json.txt': manifest
  };
  Object.entries(outputs).forEach(([name, value]) => {
    writeBuffer(path.join(outputRoot, name), value);
  });
  const checksumLines = Object.keys(outputs).sort().map((name) =>
    `${sha256(outputs[name])}  ${name}`
  );
  writeBuffer(path.join(outputRoot, checksumsName),
    Buffer.from(`${checksumLines.join('\n')}\n`, 'utf8'));
  const actual = packageFiles(outputRoot);
  if (JSON.stringify(actual) !== JSON.stringify(bundleOutputNames.slice().sort())) {
    throw new Error('BUNDLE_OUTPUT_INVENTORY_INVALID');
  }
  return {
    root: outputRoot,
    source_file_count: phase8cSourceOrder.length,
    code_gs_bytes: code.length,
    code_gs_sha256: sha256(code),
    manifest_bytes: manifest.length,
    manifest_sha256: sha256(manifest),
    checksums_sha256: sha256(fs.readFileSync(path.join(outputRoot, checksumsName)))
  };
}

function buildRelease(options) {
  const sourceCommit = assertExactCommit(
    options.sourceCommit,
    options.requireHeadMatch === true
  );
  if (!/^\d{4}-\d{2}-\d{2}T/.test(String(options.preparedAt || ''))) {
    throw new Error('PREPARED_AT_MUST_BE_ISO_TIMESTAMP');
  }
  const outputBase = path.resolve(options.outputBase || path.join(moduleRoot, 'release'));
  const sourceFiles = loadSourcePayload(sourceCommit);
  const sourceManifest = assertSourceContract(sourceFiles);
  const phase8bRoot = path.join(outputBase, phase8bPackage);
  const phase8cRoot = path.join(outputBase, phase8cPackage);
  const bundleRoot = path.join(outputBase, bundlePackage);
  const phase8b = writePackage({
    root: phase8bRoot,
    packageName: phase8bPackage,
    phase: '8B',
    phase8b: true,
    testMode: 'true',
    testHarness: true,
    preparedAt: options.preparedAt,
    sourceCommit,
    sourceFiles,
    sourceManifest
  });
  const phase8c = writePackage({
    root: phase8cRoot,
    packageName: phase8cPackage,
    phase: '8C',
    phase8b: false,
    testMode: 'false',
    testHarness: false,
    preparedAt: options.preparedAt,
    sourceCommit,
    sourceFiles,
    sourceManifest
  });
  const bundle = buildBundle({
    bundleRoot,
    phase8cRoot,
    sourceCommit,
    preparedAt: options.preparedAt
  });
  return {
    schema: 'WORK_0039_RELEASE_BUILD_RESULT_V1',
    source_commit: sourceCommit,
    prepared_at: options.preparedAt,
    phase8b,
    phase8c,
    bundle
  };
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--source-commit') result.sourceCommit = argv[++index];
    else if (argument === '--prepared-at') result.preparedAt = argv[++index];
    else if (argument === '--output-base') result.outputBase = argv[++index];
    else if (argument === '--help') result.help = true;
    else throw new Error('WORK_0039_UNKNOWN_ARGUMENT');
  }
  return result;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(
      'Usage: node tools/build_work_0039_release.js --source-commit SHA ' +
      '--prepared-at ISO [--output-base PATH]\n'
    );
    return;
  }
  if (!options.sourceCommit || !options.preparedAt) {
    throw new Error('SOURCE_COMMIT_AND_PREPARED_AT_REQUIRED');
  }
  const result = buildRelease(Object.assign({}, options, {
    requireHeadMatch: true
  }));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
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
  codeVersion,
  phase8bPackage,
  phase8cPackage,
  bundlePackage,
  manifestName,
  provenanceName,
  checksumsName,
  allSourceOrder,
  phase8cSourceOrder,
  bundleOutputNames,
  sha256,
  canonicalPayloadHash,
  transformPhase8cConfig,
  buildRelease
};
