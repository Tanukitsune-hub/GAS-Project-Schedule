'use strict';

/**
 * Work 0033 provider-schema projection and canonical-validator regressions.
 *
 * All provider and output data in this suite is synthetic and in memory. The
 * fake UrlFetchApp is an assertion boundary; no provider request is sent.
 */
const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'apps-script-v2');
let unexpectedUrlFetchCalls = 0;

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
  UrlFetchApp: {
    fetch: () => {
      unexpectedUrlFetchCalls += 1;
      throw new Error('UNEXPECTED_EXTERNAL_REQUEST');
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

const AI = sandbox.WorkOsAiAdapter;
const Gemini = sandbox.WorkOsGeminiProvider;
const providerOnlyConstraints = new Set([
  'additionalProperties',
  'format',
  'minimum',
  'maximum',
  'minItems',
  'maxItems'
]);
let observedSchemaMetrics = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sortedKeys(value) {
  return Object.keys(value).sort();
}

function schemaMetrics(schema) {
  const metrics = {
    serialized_length: JSON.stringify(schema).length,
    maximum_depth: 0,
    property_count: 0,
    enum_value_count: 0,
    nullable_union_count: 0,
    additional_properties_count: 0,
    format_count: 0,
    minimum_maximum_count: 0,
    array_bound_count: 0
  };

  function visit(value, depth) {
    if (!value || typeof value !== 'object') return;
    metrics.maximum_depth = Math.max(metrics.maximum_depth, depth);
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, depth + 1));
      return;
    }
    Object.keys(value).forEach((key) => {
      const child = value[key];
      if (key === 'properties' && child && typeof child === 'object' &&
          !Array.isArray(child)) {
        metrics.property_count += Object.keys(child).length;
      }
      if (key === 'enum' && Array.isArray(child)) {
        metrics.enum_value_count += child.length;
      }
      if (key === 'type' && Array.isArray(child) &&
          child.includes('null')) {
        metrics.nullable_union_count += 1;
      }
      if (key === 'additionalProperties') {
        metrics.additional_properties_count += 1;
      }
      if (key === 'format') {
        metrics.format_count += 1;
      }
      if (key === 'minimum' || key === 'maximum') {
        metrics.minimum_maximum_count += 1;
      }
      if (key === 'minItems' || key === 'maxItems') {
        metrics.array_bound_count += 1;
      }
      visit(child, depth + 1);
    });
  }

  visit(schema, 0);
  return metrics;
}

function providerRequest() {
  return {
    provider: 'GEMINI',
    model: Gemini.MODEL,
    prompt_version: Gemini.PROMPT_VERSION,
    input: { synthetic: true, body: 'local-only' }
  };
}

function providerSchema() {
  return clone(Gemini.buildRequest(providerRequest())
    .response_format.schema);
}

function assertProjectionSubset(projected, canonical, location) {
  if (Array.isArray(projected)) {
    assert.ok(Array.isArray(canonical), `${location} must remain an array`);
    assert.strictEqual(projected.length, canonical.length, location);
    projected.forEach((value, index) => {
      assertProjectionSubset(value, canonical[index], `${location}[${index}]`);
    });
    return;
  }
  if (!projected || typeof projected !== 'object') return;
  assert.ok(canonical && typeof canonical === 'object', location);
  Object.keys(projected).forEach((key) => {
    assert.ok(Object.prototype.hasOwnProperty.call(canonical, key),
      `${location}.${key} is absent from canonical schema`);
    if (key === 'properties') {
      Object.keys(projected.properties || {}).forEach((field) => {
        assert.ok(Object.prototype.hasOwnProperty.call(
          canonical.properties || {}, field
        ), `${location}.properties.${field} is absent from canonical schema`);
        assertProjectionSubset(
          projected.properties[field],
          canonical.properties[field],
          `${location}.properties.${field}`
        );
      });
    } else if (key === 'required') {
      const canonicalRequired = new Set(canonical.required || []);
      projected.required.forEach((field) => {
        assert.strictEqual(canonicalRequired.has(field), true,
          `${location}.required.${field} is absent from canonical schema`);
      });
    } else if (key === 'type' || key === 'enum') {
      assert.deepStrictEqual(projected[key], canonical[key],
        `${location}.${key} drift`);
    } else {
      assertProjectionSubset(projected[key], canonical[key],
        `${location}.${key}`);
    }
  });
}

function assertNoProviderOnlyConstraints(schema) {
  function visit(value, location) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${location}[${index}]`));
      return;
    }
    Object.keys(value).forEach((key) => {
      if (key === 'properties') {
        Object.keys(value.properties || {}).forEach((field) => {
          visit(value.properties[field], `${location}.properties.${field}`);
        });
        return;
      }
      assert.strictEqual(providerOnlyConstraints.has(key), false,
        `${location}.${key} is provider-only constraint`);
      visit(value[key], `${location}.${key}`);
    });
  }
  visit(schema, 'schema');
}

function validAction() {
  return {
    action_type: 'NEW_TASK',
    target_task_id: null,
    task_title: 'Synthetic schema task',
    deadline: '2026-08-25',
    suggested_deadline: null,
    deadline_basis: 'EXPLICIT',
    priority: 'MEDIUM',
    waiting_for_reply: false,
    needs_review: false,
    calendar_category: 'NONE',
    calendar_importance: 'LOW',
    confidence: 0.9,
    reason: 'Synthetic schema fixture',
    changes: {}
  };
}

function validOutput() {
  return {
    schema_version: '2.0',
    overall_confidence: 0.9,
    actions: [validAction()],
    warnings: []
  };
}

function validInput() {
  return {
    schema_version: sandbox.WorkOsConfig.AI_SCHEMA_VERSION,
    message: {
      message_id: 'synthetic-work-0033-message',
      thread_id: 'synthetic-work-0033-thread',
      stable_thread_key: 'root:synthetic-work-0033-thread',
      subject: 'Synthetic schema request',
      sender: 'fixture@example.invalid',
      received_at: '2026-08-18T00:00:00.000Z',
      plain_body: 'Synthetic provider input only.',
      prior_messages: []
    },
    active_tasks: [],
    context: { today: '2026-08-18', timezone: 'Asia/Tokyo' },
    constraints: {
      max_actions: sandbox.WorkOsConfig.MAX_AI_ACTIONS,
      no_attachment_analysis: true,
      no_email_send: true
    }
  };
}

function assertCanonicalReject(label, mutate) {
  const candidate = validOutput();
  mutate(candidate);
  assert.throws(
    () => AI.validateOutput(candidate),
    (error) => error && error.code === 'E_AI_SCHEMA',
    label
  );
}

function makeProviderAdapter(transport) {
  return new AI.ExternalAiAdapter({
    provider: Gemini.PROVIDER_ID,
    model: Gemini.MODEL,
    prompt_version: Gemini.PROMPT_VERSION,
    external_enabled: true,
    company_approved: true,
    data_policy_approved: true,
    credential_storage_approved: true,
    auth_configured: true,
    credential_provider: {
      isConfigured: () => true,
      getCredential: () => 'x'.repeat(24)
    },
    transport,
    timeout_ms: 30000,
    max_response_chars: 100000
  });
}

const tests = [];
function test(name, body) {
  try {
    body();
    tests.push({ name, status: 'PASS' });
  } catch (error) {
    tests.push({
      name,
      status: 'FAIL',
      safe_message: String(error && error.message || error).slice(0, 180)
    });
  }
}

test('PROVIDER_SCHEMA_IS_SIMPLER_BY_DETERMINISTIC_STRUCTURAL_METRICS', () => {
  const canonical = clone(AI.getOutputJsonSchema());
  const projected = providerSchema();
  const canonicalMetrics = schemaMetrics(canonical);
  const projectedMetrics = schemaMetrics(projected);
  observedSchemaMetrics = { canonical: canonicalMetrics, provider: projectedMetrics };

  assert.ok(projectedMetrics.serialized_length < canonicalMetrics.serialized_length);
  assert.ok(projectedMetrics.maximum_depth <= canonicalMetrics.maximum_depth);
  assert.strictEqual(projectedMetrics.additional_properties_count, 0);
  assert.strictEqual(projectedMetrics.format_count, 0);
  assert.strictEqual(projectedMetrics.minimum_maximum_count, 0);
  assert.strictEqual(projectedMetrics.array_bound_count, 0);
  assert.strictEqual(projectedMetrics.property_count, canonicalMetrics.property_count);
  assert.strictEqual(projectedMetrics.enum_value_count, canonicalMetrics.enum_value_count);
  assert.strictEqual(projectedMetrics.nullable_union_count,
    canonicalMetrics.nullable_union_count);
});

test('PROVIDER_SCHEMA_RETAINS_SHAPE_ENUMS_AND_CANONICAL_FIELD_BOUNDARY', () => {
  const canonical = clone(AI.getOutputJsonSchema());
  const projected = providerSchema();
  const canonicalAction = canonical.properties.actions.items;
  const projectedAction = projected.properties.actions.items;

  assert.deepStrictEqual(sortedKeys(projected.properties),
    sortedKeys(canonical.properties));
  assert.deepStrictEqual(projected.required, canonical.required);
  assert.deepStrictEqual(sortedKeys(projectedAction.properties),
    sortedKeys(canonicalAction.properties));
  assert.deepStrictEqual(projectedAction.required, canonicalAction.required);
  assert.deepStrictEqual(sortedKeys(projectedAction.properties.changes.properties),
    sortedKeys(canonicalAction.properties.changes.properties));
  assertProjectionSubset(projected, canonical, 'schema');
  assertNoProviderOnlyConstraints(projected);

  for (const field of [
    'action_type',
    'deadline_basis',
    'priority',
    'calendar_category',
    'calendar_importance'
  ]) {
    assert.deepStrictEqual(
      projectedAction.properties[field].enum,
      canonicalAction.properties[field].enum,
      `${field} enum drift`
    );
  }
});

test('CANONICAL_VALIDATOR_REMAINS_STRICT_AND_SEMANTICALLY_AUTHORITATIVE', () => {
  assertCanonicalReject('root extra field', (output) => {
    output.extra = true;
  });
  assertCanonicalReject('action extra field', (output) => {
    output.actions[0].extra = true;
  });
  assertCanonicalReject('changes extra field', (output) => {
    output.actions[0].changes.extra = true;
  });
  assertCanonicalReject('malformed date', (output) => {
    output.actions[0].deadline = '2026-99-99';
  });
  assertCanonicalReject('overall confidence out of range', (output) => {
    output.overall_confidence = 1.1;
  });
  assertCanonicalReject('action confidence out of range', (output) => {
    output.actions[0].confidence = -0.1;
  });
  assertCanonicalReject('too many actions', (output) => {
    output.actions = Array.from({
      length: sandbox.WorkOsConfig.MAX_AI_ACTIONS + 1
    }, validAction);
  });
  assertCanonicalReject('too many warnings', (output) => {
    output.warnings = Array.from({
      length: sandbox.WorkOsConfig.MAX_AI_WARNINGS + 1
    }, () => 'synthetic warning');
  });
  for (const field of [
    'action_type',
    'deadline_basis',
    'priority',
    'calendar_category',
    'calendar_importance'
  ]) {
    assertCanonicalReject(`${field} enum`, (output) => {
      output.actions[0][field] = 'NOT_A_CANONICAL_VALUE';
    });
  }
  assertCanonicalReject('invalid changes type', (output) => {
    output.actions[0].changes = { waiting_for_reply: 'not-a-boolean' };
  });
  assertCanonicalReject('action semantic violation', (output) => {
    output.actions[0].action_type = 'UPDATE_DUE';
    output.actions[0].deadline = null;
    output.actions[0].deadline_basis = 'NONE';
  });
});

test('400_INVALID_REQUEST_RETAINS_BOUNDED_SAFE_DIAGNOSTICS', () => {
  let fetchCalls = 0;
  const transport = Gemini.createTransport({
    url_fetch_app: {
      fetch: (url) => {
        fetchCalls += 1;
        assert.strictEqual(url, Gemini.ENDPOINT);
        return {
          getResponseCode: () => 400,
          getContentText: () => JSON.stringify({
            error: { code: 'invalid_request', message: 'local-only detail' }
          })
        };
      }
    }
  });
  const adapter = makeProviderAdapter(transport);
  let error = null;
  try {
    adapter.classify(validInput());
  } catch (caught) {
    error = caught;
  }
  assert.ok(error);
  assert.strictEqual(error.code, 'E_AI_INVALID_REQUEST');
  const safe = sandbox.WorkOsUtilities.safeError(error);
  assert.deepStrictEqual(clone(safe.diagnostic), {
    provider_http_status: 400,
    provider_error_code: 'invalid_request'
  });
  assert.strictEqual(fetchCalls, 1);
  assert.strictEqual(unexpectedUrlFetchCalls, 0);
});

const failed = tests.filter((item) => item.status !== 'PASS');
process.stdout.write(`${JSON.stringify({
  suite: 'work_0033_gemini_schema_compatibility',
  environment: 'LOCAL_SYNTHETIC_VM_AND_FAKE_URLFETCH_ONLY',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
  schema_metrics: observedSchemaMetrics,
  real_gemini_request: 'NOT_EXECUTED',
  google_runtime: 'NOT_EXECUTED',
  credential_inspected_or_modified: false,
  status: failed.length ? 'FAIL' : 'PASS'
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
