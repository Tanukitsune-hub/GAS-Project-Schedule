'use strict';

/**
 * F-014 provider suppression and Run History integration tests.
 *
 * Uses only the local Apps Script facade and synthetic adapters. No network,
 * credential, real provider or Google Workspace operation is performed.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const phase6Path = path.resolve(
  __dirname,
  'phase6_worker_integration_test.js'
);
const source = fs.readFileSync(phase6Path, 'utf8');
const marker = '\nconst tests = [];\n';
const markerIndex = source.indexOf(marker);
if (markerIndex < 0) {
  throw new Error('PHASE6_WORKER_FIXTURE_MARKER_NOT_FOUND');
}
const exposure = `
globalThis.__providerFailureFixture = {
  fixture,
  sandbox,
  Worker,
  Config,
  automaticGateway,
  properties,
  clockAt
};
`;
const context = {
  require,
  __dirname,
  __filename: phase6Path,
  console,
  process: { stdout: { write: () => {} }, exitCode: 0 },
  Buffer,
  structuredClone,
  setTimeout,
  clearTimeout,
  Intl
};
vm.createContext(context);
vm.runInContext(
  source.slice(0, markerIndex) + exposure,
  context,
  { filename: 'phase6_provider_failure_fixture.js' }
);

const {
  fixture,
  sandbox,
  Worker,
  Config,
  automaticGateway,
  properties,
  clockAt
} = context.__providerFailureFixture;
const Recovery = sandbox.WorkOsLogAndDeadLetter;
const FakeDate = sandbox.Date;

function recordsFromSheet(sheet) {
  const ids = sheet.cells[0];
  return sheet.cells.slice(Config.DATA_START_ROW - 1)
    .filter((row) => String(row[0] || ''))
    .map((row) => Object.fromEntries(
      ids.map((id, index) => [id, row[index]])
    ));
}

function runRecords(spreadsheet) {
  return recordsFromSheet(
    spreadsheet.getSheetByName(Config.SHEETS.RUN_HISTORY)
  );
}

function errorRecords(spreadsheet) {
  return recordsFromSheet(
    spreadsheet.getSheetByName(Config.SHEETS.ERRORS)
  );
}

function syntheticAdapter(error) {
  const mock = new sandbox.WorkOsAiAdapter.MockAiAdapter();
  return {
    healthCheck: () => ({
      status: 'READY',
      credential_configured: true,
      external_request: false
    }),
    getMetadata: () => ({
      provider: 'SYNTHETIC_APPROVED_PROVIDER',
      model: 'synthetic-model',
      prompt_version: 'synthetic-prompt-v1'
    }),
    classify(input) {
      if (error) {
        throw error;
      }
      return mock.classify(input);
    }
  };
}

function settings(spreadsheet, gateway, props, iso, adapter) {
  return {
    spreadsheet,
    gateway,
    properties: props,
    adapter,
    now: clockAt(iso),
    budget: {
      isExhausted: () => false,
      remainingMs: () => 120000
    }
  };
}

const tests = [];
function test(id, body) {
  try {
    body();
    tests.push({ id, status: 'PASS' });
  } catch (error) {
    tests.push({
      id,
      status: 'FAIL',
      safe_message: sandbox.WorkOsUtilities.redact(
        String(error && error.message || error)
      ).slice(0, 240)
    });
  } finally {
    fixture.setLockAvailable(true);
    fixture.scriptProperties.clear();
  }
}

test('PREP-PROVIDER-01_TRANSIENT_FAILURE_SUPPRESSES_AND_LOGS_RUN', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const props = properties();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-provider-transient'
  });
  const providerError = new sandbox.WorkOsAppError(
    'E_AI_NETWORK',
    'AI_REQUEST',
    true,
    'Synthetic provider network failure'
  );
  const result = Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      automaticGateway([message]),
      props,
      '2026-07-25T12:00:00.000Z',
      syntheticAdapter(providerError)
    )
  );
  assert.strictEqual(result.status, 'FAILED');
  assert.ok(
    props.getProperty(Config.PROPERTIES.AI_PROVIDER_SUPPRESS_UNTIL)
  );
  const runs = runRecords(spreadsheet);
  assert.strictEqual(runs.length, 1);
  assert.strictEqual(runs[0].run_id, result.run_id);
  assert.strictEqual(runs[0].run_status, 'FAILED');
  assert.strictEqual(
    errorRecords(spreadsheet).some(
      (record) => record.subsystem === 'AI_REQUEST'
    ),
    true
  );
});

test('PREP-PROVIDER-02_NONTRANSIENT_FAILURE_DOES_NOT_SUPPRESS', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const props = properties();
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-provider-schema'
  });
  const providerError = new sandbox.WorkOsAppError(
    'E_AI_SCHEMA',
    'AI_RESPONSE',
    false,
    'Synthetic invalid provider response'
  );
  const result = Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      automaticGateway([message]),
      props,
      '2026-07-25T12:00:00.000Z',
      syntheticAdapter(providerError)
    )
  );
  assert.strictEqual(result.status, 'FAILED');
  assert.strictEqual(
    props.getProperty(Config.PROPERTIES.AI_PROVIDER_SUPPRESS_UNTIL),
    null
  );
  assert.strictEqual(runRecords(spreadsheet).length, 1);
});

test('PREP-PROVIDER-03_SAME_RUN_FAILURE_IS_IDEMPOTENT_AND_SAFE', () => {
  const props = properties();
  const providerError = new sandbox.WorkOsAppError(
    'E_AI_RATE_LIMIT',
    'AI_REQUEST',
    true,
    'Authorization: Bearer SYNTHETIC_TOKEN_MUST_NOT_PERSIST'
  );
  const metadata = {
    provider_key: 'SYNTHETIC_APPROVED_PROVIDER',
    run_id: 'run_synthetic_same',
    message_id: 'synthetic-sensitive-provider-message'
  };
  const first = Recovery.noteProviderFailure(
    providerError,
    props,
    new FakeDate('2026-07-25T12:00:00.000Z'),
    metadata
  );
  const second = Recovery.noteProviderFailure(
    providerError,
    props,
    new FakeDate('2026-07-25T12:00:01.000Z'),
    metadata
  );
  assert.strictEqual(first.consecutive_failure_count, 1);
  assert.strictEqual(second.consecutive_failure_count, 1);
  assert.strictEqual(second.duplicate, true);
  const persisted = JSON.stringify(Array.from(
    fixture.scriptProperties.entries()
  ));
  assert.strictEqual(
    persisted.includes('SYNTHETIC_TOKEN_MUST_NOT_PERSIST'),
    false
  );
  assert.strictEqual(
    persisted.includes('synthetic-sensitive-provider-message'),
    false
  );
  assert.ok(persisted.length < 1200);
});

test('PREP-PROVIDER-04_SUCCESS_RESETS_TRANSIENT_STATE', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const props = properties();
  const providerError = new sandbox.WorkOsAppError(
    'E_AI_UPSTREAM',
    'AI_REQUEST',
    true,
    'Synthetic upstream failure'
  );
  Recovery.noteProviderFailure(
    providerError,
    props,
    new FakeDate('2026-07-25T12:00:00.000Z'),
    {
      provider_key: 'SYNTHETIC_APPROVED_PROVIDER',
      run_id: 'run_synthetic_failure'
    }
  );
  const message = fixture.rawMessage('INFORMATION_ONLY', {
    message_id: 'synthetic-provider-success'
  });
  const result = Worker.processAutomaticBatch(
    settings(
      spreadsheet,
      automaticGateway([message]),
      props,
      '2026-07-25T12:06:00.000Z',
      syntheticAdapter()
    )
  );
  assert.strictEqual(result.status, 'COMPLETE');
  assert.strictEqual(
    props.getProperty(Config.PROPERTIES.AI_PROVIDER_SUPPRESS_UNTIL),
    null
  );
  const status = Recovery.providerSuppressionStatus(
    props,
    new FakeDate('2026-07-25T12:06:01.000Z')
  );
  assert.strictEqual(status.active, false);
});

test('PREP-PROVIDER-05_ADAPTER_SETUP_FAILURE_HAS_ONE_RUN_RECORD', () => {
  const spreadsheet = fixture.makeOperationalSpreadsheet();
  const result = Worker.processAutomaticBatch({
    spreadsheet,
    gateway: automaticGateway([]),
    properties: properties(),
    now: clockAt('2026-07-25T12:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.status, 'FAILED');
  assert.strictEqual(result.note, 'E_AI_ADAPTER_REQUIRED');
  const runs = runRecords(spreadsheet);
  assert.strictEqual(runs.length, 1);
  assert.strictEqual(runs[0].run_id, result.run_id);
});

test('PREP-PROVIDER-06_NONPROVIDER_FAILURE_PRESERVES_SUPPRESSION', () => {
  const props = properties();
  const transient = new sandbox.WorkOsAppError(
    'E_AI_RATE_LIMIT',
    'AI_REQUEST',
    true,
    'Synthetic provider rate limit'
  );
  Recovery.noteProviderFailure(
    transient,
    props,
    new FakeDate('2026-07-25T12:00:00.000Z'),
    {
      provider_key: 'SYNTHETIC_APPROVED_PROVIDER',
      run_id: 'run_synthetic_provider_transient'
    }
  );
  const before = props.getProperty(
    Config.PROPERTIES.AI_PROVIDER_SUPPRESS_UNTIL
  );
  const conflict = new sandbox.WorkOsAppError(
    'E_AI_INPUT_CONFLICT',
    'AI_INPUT',
    true,
    'Synthetic local CAS conflict'
  );
  const ignored = Recovery.noteProviderFailure(
    conflict,
    props,
    new FakeDate('2026-07-25T12:00:01.000Z'),
    {
      provider_key: 'SYNTHETIC_APPROVED_PROVIDER',
      run_id: 'run_synthetic_local_conflict'
    }
  );
  assert.strictEqual(ignored.ignored, true);
  assert.strictEqual(ignored.suppressed, true);
  assert.strictEqual(
    props.getProperty(Config.PROPERTIES.AI_PROVIDER_SUPPRESS_UNTIL),
    before
  );
});

const passed = tests.filter((item) => item.status === 'PASS').length;
const failed = tests.length - passed;
process.stdout.write(`${JSON.stringify({
  suite: 'prepilot_provider_failure_accounting',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_provider_connection: 'NOT_EXECUTED',
  company_approval: 'NOT_EXECUTED',
  credential_storage_approval: 'NOT_EXECUTED',
  passed,
  failed,
  tests
}, null, 2)}\n`);
if (failed) {
  process.exitCode = 1;
}

