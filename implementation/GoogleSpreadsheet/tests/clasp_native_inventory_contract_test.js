'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  canonicalPayloadFileNames,
  claspIgnoreContents,
  claspProjectConfig,
  runClaspNativeFileStatus
} = require('../tools/local_clasp_dev');

const moduleRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(moduleRoot, 'apps-script-v2');
const claspCorePath = path.join(
  moduleRoot, 'node_modules', '@google', 'clasp', 'build', 'src', 'core',
  'clasp.js'
);
const installedClaspVersion = JSON.parse(fs.readFileSync(path.join(
  moduleRoot, 'node_modules', '@google', 'clasp', 'package.json'
), 'utf8')).version;
const placeholderScriptId = 'REPLACE_WITH_SYNTHETIC_SCRIPT_ID';
const expectedNames = canonicalPayloadFileNames.slice().sort();

function createWorkspace(parent, name, config) {
  const root = path.join(parent, name);
  const payload = path.join(root, 'payload');
  fs.mkdirSync(payload, { recursive: true });
  for (const fileName of expectedNames) {
    fs.copyFileSync(
      path.join(sourceRoot, fileName),
      path.join(payload, fileName)
    );
  }
  for (const fileName of [
    'unexpected.gs',
    'unexpected.js',
    'unexpected.html',
    'README.md',
    '.clasp-state.json',
    'generated-state.json'
  ]) {
    fs.writeFileSync(path.join(payload, fileName), 'synthetic\n', 'utf8');
  }
  fs.writeFileSync(path.join(root, 'outside.gs'), 'synthetic\n', 'utf8');
  fs.writeFileSync(
    path.join(root, '.clasp.json'),
    `${JSON.stringify(config, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, '.claspignore'),
    claspIgnoreContents(),
    'utf8'
  );
  return root;
}

async function effectiveScriptExtensions(workspaceRoot) {
  const { initClaspInstance } = await import(pathToFileURL(claspCorePath).href);
  const previousCwd = process.cwd();
  process.chdir(workspaceRoot);
  try {
    const clasp = await initClaspInstance({
      configFile: workspaceRoot,
      rootDir: workspaceRoot
    });
    return clasp.options.files.fileExtensions.SERVER_JS.slice();
  } finally {
    process.chdir(previousCwd);
  }
}

async function pulledScriptFileName(workspaceRoot, scriptExtensions) {
  const claspRequire = createRequire(pathToFileURL(fs.realpathSync(claspCorePath)));
  const { google } = claspRequire('googleapis');
  const { Files } = await import(pathToFileURL(path.join(
    moduleRoot, 'node_modules', '@google', 'clasp', 'build', 'src', 'core',
    'files.js'
  )).href);
  const originalScript = google.script;
  google.script = () => ({
    projects: {
      getContent: async () => ({
        data: {
          files: [{
            name: 'PulledScript',
            type: 'SERVER_JS',
            source: 'function synthetic() {}\n'
          }]
        }
      })
    }
  });
  const previousCwd = process.cwd();
  process.chdir(workspaceRoot);
  try {
    const files = new Files({
      credentials: {},
      configFilePath: path.join(workspaceRoot, '.clasp.json'),
      project: { scriptId: placeholderScriptId },
      files: {
        projectRootDir: workspaceRoot,
        contentDir: path.join(workspaceRoot, 'payload'),
        fileExtensions: {
          SERVER_JS: scriptExtensions,
          HTML: ['.html'],
          JSON: ['.json']
        }
      }
    });
    const pulled = await files.fetchRemote();
    assert.strictEqual(pulled.length, 1);
    return path.basename(pulled[0].localPath);
  } finally {
    process.chdir(previousCwd);
    google.script = originalScript;
  }
}

function difference(left, right) {
  const rightSet = new Set(right);
  return left.filter((name) => !rightSet.has(name));
}

async function main() {
  const temporaryRoot = fs.mkdtempSync(path.join(
    os.tmpdir(), 'work-0005-clasp-native-contract-'
  ));
  try {
    assert.strictEqual(installedClaspVersion, '3.3.0');
    const currentConfig = {
      scriptId: placeholderScriptId,
      rootDir: 'payload'
    };
    const repairedConfig = claspProjectConfig(placeholderScriptId);
    const currentRoot = createWorkspace(
      temporaryRoot, 'current-missing-script-extensions', currentConfig
    );
    const repairedRoot = createWorkspace(
      temporaryRoot, 'explicit-gs-first', repairedConfig
    );

    const currentStatus = runClaspNativeFileStatus(currentRoot);
    const repairedStatus = runClaspNativeFileStatus(repairedRoot);
    const currentExtensions = await effectiveScriptExtensions(currentRoot);
    const repairedExtensions = await effectiveScriptExtensions(repairedRoot);
    const currentPulledScript = await pulledScriptFileName(
      currentRoot, currentExtensions
    );
    const repairedPulledScript = await pulledScriptFileName(
      repairedRoot, repairedExtensions
    );
    const missing = difference(expectedNames, repairedStatus.names);
    const extra = difference(repairedStatus.names, expectedNames);

    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(currentConfig, 'scriptExtensions'),
      false
    );
    assert.deepStrictEqual(currentExtensions, ['.js', '.gs']);
    assert.strictEqual(currentExtensions[0], '.js');
    assert.strictEqual(currentPulledScript, 'PulledScript.js');
    assert.strictEqual(currentStatus.file_count, 24);
    assert.deepStrictEqual(currentStatus.names, expectedNames);

    assert.deepStrictEqual(repairedConfig.scriptExtensions, ['.gs', '.js']);
    assert.deepStrictEqual(repairedExtensions, ['.gs', '.js']);
    assert.strictEqual(repairedExtensions[0], '.gs');
    assert.strictEqual(repairedPulledScript, 'PulledScript.gs');
    assert.strictEqual(repairedStatus.file_count, 24);
    assert.deepStrictEqual(repairedStatus.names, expectedNames);
    assert.strictEqual(
      repairedStatus.names.filter((name) => name.endsWith('.gs')).length,
      23
    );
    assert.strictEqual(
      repairedStatus.names.filter((name) => name === 'appsscript.json').length,
      1
    );
    assert.deepStrictEqual(missing, []);
    assert.deepStrictEqual(extra, []);
    assert.strictEqual(repairedStatus.names.includes('unexpected.gs'), false);
    assert.strictEqual(repairedStatus.names.includes('unexpected.js'), false);
    assert.strictEqual(repairedStatus.names.includes('unexpected.html'), false);
    assert.strictEqual(repairedStatus.names.includes('README.md'), false);
    assert.strictEqual(repairedStatus.names.includes('.clasp-state.json'), false);
    assert.strictEqual(repairedStatus.names.includes('generated-state.json'), false);
    assert.strictEqual(repairedStatus.names.includes('outside.gs'), false);
    assert.strictEqual(repairedStatus.authentication, 'NOT_EXECUTED');

    process.stdout.write(`${JSON.stringify({
      suite: 'clasp_native_inventory_contract',
      environment: 'ISOLATED_LOCAL_NON_GOOGLE',
      clasp_version: installedClaspVersion,
      current_missing_explicit_script_extensions: true,
      current_effective_script_extensions: currentExtensions,
      current_preferred_pull_script_extension: currentExtensions[0],
      current_native_pull_script_filename: currentPulledScript,
      repaired_effective_script_extensions: repairedExtensions,
      repaired_preferred_pull_script_extension: repairedExtensions[0],
      repaired_native_pull_script_filename: repairedPulledScript,
      expected_payload_file_count: expectedNames.length,
      push_eligible_file_count: repairedStatus.file_count,
      expected_gs_file_count: 23,
      manifest_file_count: 1,
      missing_eligible_file_count: missing.length,
      unexpected_eligible_file_count: extra.length,
      google_operation: 'NOT_EXECUTED',
      clasp_authentication: 'NOT_EXECUTED',
      status: 'PASS'
    }, null, 2)}\n`);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  process.stderr.write(`${String(error && (error.stack || error.message) || error)}\n`);
  process.exitCode = 1;
});
