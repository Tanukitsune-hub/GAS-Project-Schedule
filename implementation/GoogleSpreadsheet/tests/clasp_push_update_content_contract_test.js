'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  GateError,
  canonicalPayloadFileNames,
  claspIgnoreContents,
  claspProjectConfig,
  claspSemanticPushArguments,
  assertClaspPushSemanticEvidence
} = require('../tools/local_clasp_dev');

const moduleRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(moduleRoot, 'apps-script-v2');
const claspRoot = path.join(moduleRoot, 'node_modules', '@google', 'clasp');
const claspCorePath = path.join(claspRoot, 'build', 'src', 'core', 'clasp.js');
const pushCommandPath = path.join(
  claspRoot, 'build', 'src', 'commands', 'push.js'
);
const placeholderScriptId = 'REPLACE_WITH_SYNTHETIC_SCRIPT_ID';
const expectedLocalNames = canonicalPayloadFileNames.slice().sort();
const expectedRemoteNames = expectedLocalNames.map((name) =>
  name === 'appsscript.json' ? 'appsscript' : path.parse(name).name
).sort();

function createWorkspace(parent, name, includePayload) {
  const root = path.join(parent, name);
  const payload = path.join(root, 'payload');
  fs.mkdirSync(payload, { recursive: true });
  if (includePayload) {
    for (const fileName of expectedLocalNames) {
      fs.copyFileSync(
        path.join(sourceRoot, fileName), path.join(payload, fileName)
      );
    }
  }
  fs.writeFileSync(path.join(root, '.clasp.json'),
    `${JSON.stringify(claspProjectConfig(placeholderScriptId), null, 2)}\n`,
    'utf8');
  fs.writeFileSync(path.join(root, '.claspignore'),
    claspIgnoreContents(), 'utf8');
  return root;
}

function exactLocalInventory(payloadRoot) {
  return fs.readdirSync(payloadRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
}

async function main() {
  const temporaryRoot = fs.mkdtempSync(path.join(
    os.tmpdir(), 'work-0007-clasp-update-content-'
  ));
  const claspRequire = createRequire(pathToFileURL(fs.realpathSync(claspCorePath)));
  const { google } = claspRequire('googleapis');
  const originalScript = google.script;
  let updateContentCalls = 0;
  let capturedRequest = null;
  try {
    const installedVersion = JSON.parse(fs.readFileSync(
      path.join(claspRoot, 'package.json'), 'utf8'
    )).version;
    assert.strictEqual(installedVersion, '3.3.0');

    const commandSource = fs.readFileSync(pushCommandPath, 'utf8');
    assert.ok(commandSource.includes('isManifestUpdated && !force'));
    assert.ok(commandSource.includes('return; // Exit onChange without pushing.'));
    assert.deepStrictEqual(
      claspSemanticPushArguments,
      ['--json', 'push', '--force']
    );

    google.script = () => ({
      projects: {
        updateContent: async (request) => {
          updateContentCalls += 1;
          capturedRequest = request;
          return { data: {} };
        },
        getContent: async () => ({
          data: { files: capturedRequest.requestBody.files }
        })
      }
    });

    const { initClaspInstance } = await import(pathToFileURL(claspCorePath).href);
    const pushRoot = createWorkspace(temporaryRoot, 'push', true);
    const previousCwd = process.cwd();
    let pushed;
    try {
      process.chdir(pushRoot);
      const clasp = await initClaspInstance({
        configFile: pushRoot, rootDir: pushRoot, credentials: {}
      });
      pushed = await clasp.files.push();
    } finally {
      process.chdir(previousCwd);
    }

    assert.strictEqual(updateContentCalls, 1);
    assert.ok(capturedRequest);
    assert.strictEqual(capturedRequest.scriptId, placeholderScriptId);
    assert.strictEqual(pushed.length, 24);
    const sentFiles = capturedRequest.requestBody.files;
    assert.strictEqual(sentFiles.length, 24);
    assert.strictEqual(
      sentFiles.filter((file) => file.type === 'SERVER_JS').length, 23
    );
    assert.strictEqual(
      sentFiles.filter((file) => file.type === 'JSON').length, 1
    );
    assert.strictEqual(
      sentFiles.filter((file) => file.type === 'HTML').length, 0
    );
    assert.deepStrictEqual(
      sentFiles.map((file) => file.name).sort(), expectedRemoteNames
    );
    assert.ok(sentFiles.every((file) => typeof file.source === 'string'));

    const semantic = assertClaspPushSemanticEvidence({
      exit_code: 0,
      stdout: JSON.stringify(pushed.map((file) => file.localPath))
    }, pushRoot);
    assert.deepStrictEqual(semantic, {
      file_count: 24,
      gs_file_count: 23,
      manifest_file_count: 1,
      missing_file_count: 0,
      extra_file_count: 0,
      update_content_evidenced: true
    });
    assert.throws(
      () => assertClaspPushSemanticEvidence({
        exit_code: 0, stdout: '[]'
      }, pushRoot),
      (error) => error instanceof GateError &&
        error.code === 'CLASP_PUSH_SEMANTIC_NO_OP'
    );

    const pullRoot = createWorkspace(temporaryRoot, 'pull', false);
    try {
      process.chdir(pullRoot);
      const clasp = await initClaspInstance({
        configFile: pullRoot, rootDir: pullRoot, credentials: {}
      });
      const pulled = await clasp.files.pull();
      assert.strictEqual(pulled.length, 24);
    } finally {
      process.chdir(previousCwd);
    }
    const pulledNames = exactLocalInventory(path.join(pullRoot, 'payload'));
    assert.deepStrictEqual(pulledNames, expectedLocalNames);
    assert.strictEqual(
      pulledNames.filter((name) => name.endsWith('.gs')).length, 23
    );
    assert.strictEqual(
      pulledNames.filter((name) => name === 'appsscript.json').length, 1
    );

    process.stdout.write(`${JSON.stringify({
      suite: 'clasp_push_update_content_contract',
      environment: 'ISOLATED_LOCAL_NON_GOOGLE',
      clasp_version: installedVersion,
      installed_noninteractive_manifest_skip_without_force: true,
      future_push_arguments: claspSemanticPushArguments,
      update_content_call_count: updateContentCalls,
      serialized_file_count: sentFiles.length,
      serialized_server_js_count: 23,
      serialized_manifest_count: 1,
      serialized_html_count: 0,
      semantic_no_op_rejected: true,
      pull_materialized_file_count: pulledNames.length,
      pull_materialized_gs_count: 23,
      pull_materialized_manifest_count: 1,
      google_operation: 'NOT_EXECUTED',
      status: 'PASS'
    }, null, 2)}\n`);
  } finally {
    google.script = originalScript;
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  process.stderr.write(`${String(error && (error.stack || error.message) || error)}\n`);
  process.exitCode = 1;
});
