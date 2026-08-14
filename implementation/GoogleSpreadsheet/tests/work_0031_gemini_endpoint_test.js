'use strict';

const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const moduleRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(moduleRoot, 'apps-script-v2');
const endpoint = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const retiredEndpoint = 'https://generativelanguage.googleapis.com/v1/interactions';
let fetchCalls = 0;
let fetchRequest = null;

function disabledAutomationStatus() {
  return {
    status: 'CONSISTENT',
    enabled: false,
    desired_enabled: false,
    trigger_count: 0,
    clock_trigger_count: 0,
    stored_trigger_id_present: false,
    canonical_trigger_present: false
  };
}

const sandbox = {
  Date,
  JSON,
  Math,
  Number,
  Object,
  String,
  Boolean,
  Array,
  Error,
  RegExp,
  console,
  Utilities: {
    getUuid: () => crypto.randomUUID(),
    computeDigest: (_algorithm, value) => Array.from(
      crypto.createHash('sha256').update(String(value), 'utf8').digest()
    ).map((byte) => (byte > 127 ? byte - 256 : byte)),
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    Charset: { UTF_8: 'UTF_8' }
  },
  WorkOsAutomation: {
    getDiagnosticAutomationStatus: disabledAutomationStatus
  },
  UrlFetchApp: {
    fetch: (url, params) => {
      fetchCalls += 1;
      fetchRequest = { url, params };
      return {
        getResponseCode: () => 200,
        getContentText: () => JSON.stringify({
          status: 'completed',
          steps: [{
            type: 'model_output',
            content: [{ type: 'text', text: '{}' }]
          }]
        })
      };
    }
  }
};

vm.createContext(sandbox);
for (const name of [
  '00_Config.gs',
  '17_Utilities.gs',
  '07_AiAdapter.gs',
  '20_GeminiProvider.gs'
]) {
  vm.runInContext(fs.readFileSync(path.join(sourceRoot, name), 'utf8'),
    sandbox, { filename: name });
}

const Gemini = sandbox.WorkOsGeminiProvider;
const tests = [];
function test(name, body) {
  try {
    body();
    tests.push({ name, status: 'PASS' });
  } catch (error) {
    tests.push({
      name,
      status: 'FAIL',
      safe_message: String(error && error.message || error).slice(0, 160)
    });
  }
}

function currentReleaseFiles() {
  const roots = [
    path.join(moduleRoot, 'release', 'v2.8.18-prepilot', 'apps-script'),
    path.join(moduleRoot, 'release', 'v2.8.18-prepilot-phase8c', 'apps-script')
  ];
  return roots.flatMap((root) => {
    assert.strictEqual(fs.existsSync(root), true, root);
    const files = fs.readdirSync(root).filter((name) =>
      name.endsWith('.gs') || name === 'appsscript.json'
    );
    assert.ok(files.length > 0, root);
    assert.strictEqual(
      files.length,
      root.includes('phase8c') ? 23 : 24,
      root
    );
    const provider = fs.readFileSync(
      path.join(root, '20_GeminiProvider.gs'), 'utf8'
    );
    assert.strictEqual(provider.includes(endpoint), true, root);
    return files.map((name) => path.join(root, name));
  });
}

test('ACTIVE_SOURCE_USES_EXACT_V1BETA_ENDPOINT', () => {
  const source = fs.readFileSync(
    path.join(sourceRoot, '20_GeminiProvider.gs'), 'utf8'
  );
  assert.strictEqual(Gemini.ENDPOINT, endpoint);
  assert.strictEqual(source.includes(retiredEndpoint), false);
  assert.strictEqual(source.includes(endpoint), true);
});

test('CURRENT_RELEASE_PAYLOADS_HAVE_NO_RETIRED_ENDPOINT', () => {
  const files = currentReleaseFiles();
  for (const file of files) {
    assert.strictEqual(
      fs.readFileSync(file, 'utf8').includes(retiredEndpoint),
      false,
      path.basename(file)
    );
  }
});

test('TRANSPORT_IS_ONE_POST_WITH_THE_EXISTING_BOUNDED_CONTRACT', () => {
  fetchCalls = 0;
  fetchRequest = null;
  const transport = Gemini.createTransport({ url_fetch_app: sandbox.UrlFetchApp });
  const result = transport.send({
    provider: 'GEMINI',
    model: Gemini.MODEL,
    prompt_version: Gemini.PROMPT_VERSION,
    input: { synthetic: true, body: 'local-only' }
  }, 'synthetic-work-0031-key');
  assert.strictEqual(result.status, 200);
  assert.strictEqual(fetchCalls, 1);
  assert.strictEqual(fetchRequest.url, endpoint);
  assert.strictEqual(fetchRequest.params.method, 'post');
  assert.deepStrictEqual(Object.keys(fetchRequest.params.headers), [
    'x-goog-api-key'
  ]);
  const body = JSON.parse(fetchRequest.params.payload);
  assert.strictEqual(body.model, 'gemini-3.6-flash');
  assert.strictEqual(body.store, false);
  assert.strictEqual(body.stream, false);
  assert.strictEqual(body.background, false);
  assert.deepStrictEqual(body.generation_config, {
    thinking_level: 'low',
    thinking_summaries: 'none',
    max_output_tokens: 4096
  });
  assert.strictEqual(body.tools, undefined);
});

const failed = tests.filter((item) => item.status !== 'PASS');
process.stdout.write(`${JSON.stringify({
  suite: 'work_0031_gemini_endpoint',
  environment: 'LOCAL_FAKE_URLFETCH_ONLY',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
  real_gemini_request: 'NOT_EXECUTED',
  credential_inspected_or_modified: false,
  google_operation: 'NOT_EXECUTED',
  status: failed.length ? 'FAIL' : 'PASS'
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
