'use strict';

/**
 * Work 0036 synthetic-only Automation qualification contract.
 *
 * This suite uses the existing Phase 3 in-memory Apps Script facade. It never
 * calls Gmail, Calendar, UrlFetchApp, ScriptApp mutation, or a real provider.
 */
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const phase3Path = path.resolve(__dirname, 'phase3_local_test.js');
const source = fs.readFileSync(phase3Path, 'utf8').replace(/\r\n/g, '\n');
const marker = '\nconst summary = {\n';
const markerIndex = source.lastIndexOf(marker);
if (markerIndex < 0) throw new Error('PHASE3_FIXTURE_REPORT_MARKER_MISSING');

const exposure = `
globalThis.__work0036 = {
  sandbox,
  scriptProperties,
  getScriptProperties: () => sandbox.PropertiesService.getScriptProperties(),
  makeOperationalSpreadsheet: () => {
    activeSpreadsheet = makeOperationalSpreadsheet();
    return activeSpreadsheet;
  },
  getActiveSpreadsheet: () => activeSpreadsheet
};
`;
const context = {
  require,
  __dirname,
  __filename: phase3Path,
  console,
  process: { stdout: { write: () => {} }, exitCode: 0 },
  Buffer,
  structuredClone,
  setTimeout,
  clearTimeout
};
vm.createContext(context);
vm.runInContext(source.slice(0, markerIndex) + exposure, context, {
  filename: 'work_0036_phase3_fixture.js'
});

for (const fileName of [
  '20_GeminiProvider.gs',
  '12_Triggers.gs',
  '02_Setup.gs'
]) {
  vm.runInContext(
    fs.readFileSync(
      path.join(__dirname, '..', 'apps-script-v2', fileName),
      'utf8'
    ),
    context.__work0036.sandbox,
    { filename: `work_0036_${fileName}` }
  );
}

const { sandbox, scriptProperties } = context.__work0036;
const Config = sandbox.WorkOsConfig;
const Gateway = sandbox.WorkOsGmailGateway;
const Provider = sandbox.WorkOsGeminiProvider;

function headerMessage(subject, labels = ['INBOX']) {
  return {
    id: 'synthetic-work-0036-message',
    labelIds: labels,
    payload: {
      headers: [{ name: 'Subject', value: subject }]
    }
  };
}

function exactBody() {
  return Config.AUTOMATION_SYNTHETIC_BODY;
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
      safe_message: String(error && error.message || error).slice(0, 160)
    });
  }
}

function resetProperties(values = {}) {
  scriptProperties.clear();
  Object.entries(values).forEach(([key, value]) => {
    scriptProperties.set(key, value);
  });
  return sandbox.PropertiesService.getScriptProperties();
}

function makePreparationCallerHarness(testMode) {
  const values = new Map([
    [Config.PROPERTIES.SETUP_COMPLETED_STAGES,
      JSON.stringify(Config.SETUP_STAGES)],
    [Config.PROPERTIES.SCHEMA_VERSION, Config.SCHEMA_VERSION],
    [Config.PROPERTIES.MIGRATION_VERSION, Config.MIGRATION_VERSION],
    [Config.PROPERTIES.CODE_VERSION, '2.8.20-prepilot']
  ]);
  const props = {
    getProperty(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setProperty(key, value) {
      values.set(key, String(value));
    }
  };
  const calls = [];
  const fakeConfig = {
    TEST_MODE: testMode,
    CODE_VERSION: Config.CODE_VERSION,
    SCHEMA_VERSION: Config.SCHEMA_VERSION,
    MIGRATION_VERSION: Config.MIGRATION_VERSION,
    SETUP_STAGES: Config.SETUP_STAGES.slice(),
    PROPERTIES: Config.PROPERTIES
  };
  const fakeAutomation = {
    getDiagnosticAutomationStatus() {
      calls.push(arguments.length);
      if (!testMode && arguments.length !== 0) {
        throw new Error('PRODUCTION_STATUS_MUST_BE_NO_ARG');
      }
      return {
        status: 'CONSISTENT',
        enabled: false,
        desired_enabled: false,
        clock_trigger_count: 0,
        stored_trigger_id_present: false
      };
    }
  };
  function FakeWorkOsAppError(code, stage, retryable, message) {
    this.name = 'WorkOsAppError';
    this.code = code;
    this.stage = stage;
    this.retryable = retryable;
    this.message = message;
  }
  FakeWorkOsAppError.prototype = Object.create(Error.prototype);
  const fakePropertiesService = {
    getScriptProperties() {
      return props;
    }
  };
  const fakeSpreadsheetApp = {
    getActiveSpreadsheet() {
      return {};
    }
  };
  const fakeSpreadsheet = {};
  const context = {
    WorkOsConfig: fakeConfig,
    WorkOsAutomation: fakeAutomation,
    WorkOsAppError: FakeWorkOsAppError,
    PropertiesService: fakePropertiesService,
    SpreadsheetApp: fakeSpreadsheetApp,
    console
  };
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(
      path.join(__dirname, '..', 'apps-script-v2', '02_Setup.gs'),
      'utf8'
    ),
    context,
    { filename: `work_0036_preparation_${testMode ? 'test' : 'production'}.gs` }
  );
  return { context, props, calls, fakeSpreadsheet };
}

function offScriptApp(status = 'NOT_REQUIRED') {
  return {
    AuthMode: { FULL: 'FULL' },
    triggers: [],
    getProjectTriggers() {
      return this.triggers.slice();
    },
    getAuthorizationInfo() {
      return { getAuthorizationStatus: () => status };
    }
  };
}

function completeFakeReadiness() {
  return {
    test_mode: false,
    external_request_performed: false,
    automation: {
      status: 'CONSISTENT',
      enabled: false,
      desired_enabled: false,
      trigger_count: 0,
      clock_trigger_count: 0,
      stored_trigger_id_present: false,
      canonical_trigger_present: false
    },
    prerequisites: { ready: true, reasons: [] },
    details: {
      candidate: {
        ready: true,
        setup_complete: true,
        stored_versions_aligned: true,
        code_version: Config.CODE_VERSION,
        stored_code_version: Config.CODE_VERSION,
        schema_version: Config.SCHEMA_VERSION,
        stored_schema_version: Config.SCHEMA_VERSION,
        ai_schema_version: Config.AI_SCHEMA_VERSION,
        migration_version: Config.MIGRATION_VERSION,
        stored_migration_version: Config.MIGRATION_VERSION
      },
      setup: { complete: true },
      test_mode: { enabled: false, production_shaped: true },
      scope: {
        ready: true,
        scope: Config.AUTOMATION_QUALIFICATION_SCOPE,
        source_mode: Config.AUTOMATION_QUALIFICATION_SOURCE_MODE,
        exact_subject: Config.AUTOMATION_SYNTHETIC_SUBJECT,
        exact_query_active: true,
        exact_body_guard_active: true
      },
      provider: {
        status: 'READY',
        ready: true,
        provider: 'GEMINI',
        model: Config.EXTERNAL_AI_MODEL,
        adapter_status: 'READY',
        credential_configured: true,
        provider_registered: true,
        credential_reference_present: true
      },
      oauth: { status: 'READY', ready: true },
      formal_labels: {
        status: 'READY',
        ready: true,
        checked: true,
        expected_count: Config.GMAIL_LABELS.length,
        present_count: Config.GMAIL_LABELS.length,
        missing_count: 0
      },
      calendar: {
        status: 'READY',
        ready: true,
        checked: true,
        property_present: true,
        instance_marker_ok: true,
        remotely_verified: true
      }
    }
  };
}

function evaluateFake(overrides = {}) {
  const input = completeFakeReadiness();
  if (overrides.automation) {
    Object.assign(input.automation, overrides.automation);
  }
  if (overrides.details) {
    Object.entries(overrides.details).forEach(([key, value]) => {
      Object.assign(input.details[key], value);
    });
  }
  if (overrides.prerequisites) {
    Object.assign(input.prerequisites, overrides.prerequisites);
  }
  if (Object.prototype.hasOwnProperty.call(overrides, 'test_mode')) {
    input.test_mode = overrides.test_mode;
  }
  if (Object.prototype.hasOwnProperty.call(
    overrides, 'external_request_performed'
  )) {
    input.external_request_performed = overrides.external_request_performed;
  }
  return sandbox.WorkOsAutomation.evaluatePersonalQualificationReadiness(
    input
  );
}

test('WORK_0036_CANDIDATE_VERSION_AND_DEFAULT_OFF', () => {
  assert.strictEqual(Config.CODE_VERSION, '2.8.27-prepilot');
  assert.strictEqual(Config.SCHEMA_VERSION, '2.6');
  assert.strictEqual(Config.AI_SCHEMA_VERSION, '2.0');
  assert.strictEqual(Config.MIGRATION_VERSION, '3');
  assert.strictEqual(Config.AUTOMATION_ENABLED, false);
  assert.strictEqual(Config.AUTOMATION_MAX_MESSAGES_PER_RUN, 1);
  assert.strictEqual(
    Config.AUTOMATION_QUALIFICATION_SCOPE,
    'SYNTHETIC_AUTOMATION_QUALIFICATION_ONLY'
  );
});

test('WORK_0036_QUERY_IS_EXACT_SUBJECT_AND_BOUNDARY_IS_RECHECKED', () => {
  const gatewaySource = fs.readFileSync(
    path.join(__dirname, '..', 'apps-script-v2', '05_GmailGateway.gs'),
    'utf8'
  );
  const query = Gateway.automaticQuery(
    new Date('2026-07-24T00:00:00.000Z'),
    new Date('2026-07-24T01:00:00.000Z'),
    { qualification_only: true }
  ).query;
  assert.ok(query.includes('subject:"[WORK_OS_AUTOMATION_SYNTHETIC_0036]"'));
  assert.ok(query.includes('in:inbox'));
  assert.ok(query.includes('-in:spam'));
  assert.ok(query.includes('-in:trash'));
  assert.ok(query.includes('-label:手動/除外'));
  const exact = Gateway.automationQualificationCandidatePolicy(
    [],
    headerMessage(Config.AUTOMATION_SYNTHETIC_SUBJECT)
  );
  assert.strictEqual(exact.process, true);
  assert.strictEqual(exact.reason, 'AUTOMATION_SYNTHETIC_EXACT');
  assert.strictEqual(exact.priority, 10);
  assert.strictEqual(
    Gateway.automationQualificationCandidatePolicy(
      [],
      headerMessage('[WORK_OS_AUTOMATION_SYNTHETIC_0036] near')
    ).process,
    false
  );
  assert.match(
    gatewaySource,
    /var qualificationOnly = WorkOsConfig\.TEST_MODE !== true \|\|/
  );
  assert.match(
    gatewaySource,
    /qualificationOnly\s*\n\s*\?\s*WorkOsConfig\.AUTOMATION_GMAIL_QUERY/
  );
});

test('WORK_0036_BODY_NORMALIZATION_IS_EXACT_AND_ATTACHMENT_FREE', () => {
  assert.strictEqual(Provider.isAutomationSyntheticBody(exactBody()), true);
  assert.strictEqual(
    Provider.isAutomationSyntheticBody(exactBody().replace(/\n/g, '\r\n')),
    true
  );
  assert.strictEqual(
    Provider.isAutomationSyntheticBody(`${exactBody()}\nnear-match`),
    false
  );
  assert.strictEqual(
    Provider.isAutomationSyntheticBody(exactBody().slice(0, -1)),
    false
  );
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'apps-script-v2', '05_GmailGateway.gs'),
    'utf8'
  );
  assert.ok(source.includes('if (filename || body.attachmentId)'));
  assert.ok(source.includes('body_transport_truncated'));
});

test('WORK_0036_PROVIDER_INPUT_GUARD_IS_EXACT_AND_PROMPT_SCOPED', () => {
  const exact = {
    schema_version: Config.AI_SCHEMA_VERSION,
    message: {
      subject: Config.AUTOMATION_SYNTHETIC_SUBJECT,
      plain_body: exactBody()
    }
  };
  assert.strictEqual(Provider.isAutomationSyntheticInput(exact), true);
  assert.strictEqual(Provider.isAutomationSyntheticInput({
    message: {
      subject: Config.AUTOMATION_SYNTHETIC_SUBJECT,
      plain_body: `${exactBody()}\nextra`
    }
  }), false);
  assert.strictEqual(Provider.isAutomationSyntheticInput({
    message: { subject: 'ordinary personal mail', plain_body: exactBody() }
  }), false);
});

test('WORK_0036_CANDIDATE_REQUIRES_EXACT_SOURCE_AND_PROCESS_DECISION', () => {
  assert.strictEqual(Provider.isAutomationSyntheticCandidate({
    subject: Config.AUTOMATION_SYNTHETIC_SUBJECT,
    source_mode: Config.AUTOMATION_QUALIFICATION_SOURCE_MODE,
    manual_decision: 'PROCESS'
  }), true);
  assert.strictEqual(Provider.isAutomationSyntheticCandidate({
    subject: Config.AUTOMATION_SYNTHETIC_SUBJECT,
    source_mode: 'AUTOMATIC',
    manual_decision: 'PROCESS'
  }), false);
  assert.strictEqual(Provider.isAutomationSyntheticCandidate({
    subject: Config.AUTOMATION_SYNTHETIC_SUBJECT,
    source_mode: Config.AUTOMATION_QUALIFICATION_SOURCE_MODE,
    manual_decision: 'SKIP'
  }), false);
});

test('WORK_0036_READINESS_REJECTS_MISSING_SETUP', () => {
  const result = sandbox.WorkOsAutomation.getPersonalAutomationQualificationStatus({
    properties: resetProperties(),
    script_app: offScriptApp()
  });
  assert.strictEqual(result.status, 'BLOCKED');
  assert.ok(result.readiness_reasons.includes(
    'AUTOMATION_PREREQUISITES_INCOMPLETE'
  ));
  assert.ok(result.prerequisites.reasons.includes('SETUP_NOT_COMPLETE'));
});

test('WORK_0036_READINESS_REJECTS_HISTORICAL_CODE_VERSION', () => {
  const props = resetProperties({
    [Config.PROPERTIES.SETUP_COMPLETED_STAGES]: '[]',
    [Config.PROPERTIES.CODE_VERSION]: '2.8.20-prepilot',
    [Config.PROPERTIES.SCHEMA_VERSION]: Config.SCHEMA_VERSION,
    [Config.PROPERTIES.MIGRATION_VERSION]: Config.MIGRATION_VERSION
  });
  const result = sandbox.WorkOsAutomation.getPersonalAutomationQualificationStatus({
    properties: props,
    script_app: offScriptApp()
  });
  assert.strictEqual(result.status, 'BLOCKED');
  assert.ok(result.prerequisites.reasons.includes('CODE_VERSION_MISMATCH'));
  assert.strictEqual(result.candidate.stored_code_version,
    '2.8.20-prepilot');
});

test('WORK_0036_READINESS_REJECTS_SCHEMA_AND_MIGRATION_MISMATCH', () => {
  const props = resetProperties({
    [Config.PROPERTIES.SETUP_COMPLETED_STAGES]:
      JSON.stringify(['S99_COMPLETE']),
    [Config.PROPERTIES.CODE_VERSION]: Config.CODE_VERSION,
    [Config.PROPERTIES.SCHEMA_VERSION]: '2.5',
    [Config.PROPERTIES.MIGRATION_VERSION]: '2'
  });
  const result = sandbox.WorkOsAutomation.getPersonalAutomationQualificationStatus({
    properties: props,
    script_app: offScriptApp()
  });
  assert.strictEqual(result.status, 'BLOCKED');
  assert.ok(result.prerequisites.reasons.includes('SCHEMA_VERSION_MISMATCH'));
  assert.ok(result.prerequisites.reasons.includes('MIGRATION_VERSION_MISMATCH'));
});

test('WORK_0036_READINESS_REJECTS_TEST_MODE_PRODUCTION_CLAIM', () => {
  const result = sandbox.WorkOsAutomation.getPersonalAutomationQualificationStatus({
    properties: resetProperties({
      [Config.PROPERTIES.SETUP_COMPLETED_STAGES]:
        JSON.stringify(['S99_COMPLETE']),
      [Config.PROPERTIES.CODE_VERSION]: Config.CODE_VERSION,
      [Config.PROPERTIES.SCHEMA_VERSION]: Config.SCHEMA_VERSION,
      [Config.PROPERTIES.MIGRATION_VERSION]: Config.MIGRATION_VERSION
    }),
    script_app: offScriptApp()
  });
  assert.strictEqual(result.status, 'BLOCKED');
  assert.strictEqual(result.test_mode.enabled, true);
  assert.ok(result.prerequisites.reasons.includes('TEST_MODE_ENABLED'));
});

test('WORK_0036_READINESS_REJECTS_MISSING_CALENDAR', () => {
  const result = sandbox.WorkOsAutomation.getPersonalAutomationQualificationStatus({
    properties: resetProperties({
      [Config.PROPERTIES.SETUP_COMPLETED_STAGES]:
        JSON.stringify(['S99_COMPLETE']),
      [Config.PROPERTIES.CODE_VERSION]: Config.CODE_VERSION,
      [Config.PROPERTIES.SCHEMA_VERSION]: Config.SCHEMA_VERSION,
      [Config.PROPERTIES.MIGRATION_VERSION]: Config.MIGRATION_VERSION
    }),
    script_app: offScriptApp()
  });
  assert.strictEqual(result.status, 'BLOCKED');
  assert.strictEqual(result.calendar.status, 'NOT_CONFIGURED');
  assert.ok(result.prerequisites.reasons.includes('CALENDAR_NOT_CONFIGURED'));
});

test('WORK_0036_READINESS_REJECTS_MISSING_FORMAL_LABEL', () => {
  const result = evaluateFake({
    details: {
      formal_labels: {
        status: 'BLOCKED',
        ready: false,
        checked: true,
        present_count: Config.GMAIL_LABELS.length - 1,
        missing_count: 1
      }
    }
  });
  assert.strictEqual(result.ready, false);
  assert.ok(result.reasons.includes('FORMAL_GMAIL_LABEL_MISSING'));
});

test('WORK_0036_READINESS_REJECTS_POLICY_APPROVALS', () => {
  const result = sandbox.WorkOsAutomation.getPersonalAutomationQualificationStatus({
    properties: resetProperties({
      [Config.PROPERTIES.SETUP_COMPLETED_STAGES]:
        JSON.stringify(['S99_COMPLETE']),
      [Config.PROPERTIES.CODE_VERSION]: Config.CODE_VERSION,
      [Config.PROPERTIES.SCHEMA_VERSION]: Config.SCHEMA_VERSION,
      [Config.PROPERTIES.MIGRATION_VERSION]: Config.MIGRATION_VERSION,
      [Config.PROPERTIES.DEADLINE_CALENDAR_ID]: 'synthetic-calendar'
    }),
    script_app: offScriptApp()
  });
  assert.strictEqual(result.status, 'BLOCKED');
  assert.ok(result.prerequisites.reasons.includes(
    'OPERATOR_APPROVAL_NOT_CONFIRMED'
  ));
  assert.ok(result.prerequisites.reasons.includes(
    'DATA_POLICY_APPROVAL_NOT_CONFIRMED'
  ));
  assert.ok(result.prerequisites.reasons.includes(
    'CREDENTIAL_STORAGE_APPROVAL_NOT_CONFIRMED'
  ));
  assert.ok(result.prerequisites.reasons.includes('AI_AUTH_NOT_CONFIGURED'));
});

test('WORK_0036_READINESS_REJECTS_MISSING_OR_MOCK_PROVIDER', () => {
  const result = evaluateFake({
    details: {
      provider: {
        status: 'BLOCKED',
        ready: false,
        provider: 'MOCK',
        adapter_status: 'BLOCKED',
        credential_configured: false
      }
    }
  });
  assert.strictEqual(result.ready, false);
  assert.ok(result.reasons.includes('REAL_AI_ADAPTER_NOT_READY'));
  assert.ok(result.reasons.includes('AI_CREDENTIAL_NOT_READY'));
  assert.ok(result.reasons.includes('AI_PROVIDER_NOT_GEMINI'));
});

test('WORK_0036_READINESS_REJECTS_OAUTH_REQUIRED_OR_UNAVAILABLE', () => {
  const required = evaluateFake({
    details: { oauth: { status: 'AUTHORIZATION_REQUIRED', ready: false } }
  });
  const unavailable = evaluateFake({
    details: { oauth: { status: 'UNAVAILABLE', ready: false } }
  });
  assert.strictEqual(required.ready, false);
  assert.strictEqual(unavailable.ready, false);
  assert.ok(required.reasons.includes('OAUTH_NOT_READY'));
  assert.ok(unavailable.reasons.includes('OAUTH_NOT_READY'));
});

test('WORK_0036_READINESS_REJECTS_TRIGGER_RESIDUE_AND_STATE_DRIFT', () => {
  [
    { status: 'INCONSISTENT' },
    { enabled: true },
    { desired_enabled: true },
    { stored_trigger_id_present: true },
    { canonical_trigger_present: true },
    { trigger_count: 1 },
    { clock_trigger_count: 1 }
  ].forEach((state) => {
    const result = evaluateFake({ automation: state });
    assert.strictEqual(result.ready, false);
    assert.ok(result.reasons.includes('AUTOMATION_STATE_NOT_READY'));
  });
});

test('WORK_0036_COMPLETE_SYNTHETIC_FAKE_PREREQUISITES_RETURN_READY', () => {
  const result = evaluateFake();
  assert.strictEqual(result.ready, true);
  assert.strictEqual(result.reasons.length, 0);
});

test('WORK_0036_READINESS_HAS_NO_EXTERNAL_OR_MUTATING_SIDE_EFFECTS', () => {
  const props = sandbox.PropertiesService.getScriptProperties();
  let labelCalls = 0;
  let bodyCalls = 0;
  let credentialReads = 0;
  sandbox.Gmail.Users.Labels.list = () => {
    labelCalls += 1;
    throw new Error('LABEL_READ_MUST_NOT_RUN_IN_TEST_MODE');
  };
  sandbox.Gmail.Users.Messages.get = () => {
    bodyCalls += 1;
    throw new Error('BODY_READ_MUST_NOT_RUN');
  };
  const guardedProperties = {
    getProperty(key) {
      if (String(key) === Config.PROPERTIES.GEMINI_API_KEY) {
        credentialReads += 1;
      }
      return props.getProperty(key);
    }
  };
  const scriptApp = offScriptApp();
  const beforeTriggers = scriptApp.triggers.length;
  const result = sandbox.WorkOsAutomation.getPersonalAutomationQualificationStatus({
    properties: guardedProperties,
    script_app: scriptApp
  });
  assert.strictEqual(result.external_request_performed, false);
  assert.strictEqual(labelCalls, 0);
  assert.strictEqual(bodyCalls, 0);
  assert.strictEqual(credentialReads, 0);
  assert.strictEqual(scriptApp.triggers.length, beforeTriggers);
});

test('WORK_0036_PREPARATION_MENU_REQUIRES_CONFIRMATION_AND_NO_ARG_CALL', () => {
  const menuSource = fs.readFileSync(
    path.join(__dirname, '..', 'apps-script-v2', 'Menu.gs'),
    'utf8'
  );
  assert.match(
    menuSource,
    /addItem\('個人用Shadow Pilotを準備',\s*'menuPreparePersonalShadowPilot'\)/
  );
  assert.match(menuSource,
    /function menuPreparePersonalAutomationQualification\(\)/);
  assert.match(menuSource, /ui\.ButtonSet\.OK_CANCEL/);
  assert.match(menuSource, /preparePersonalAutomationQualification\(\)/);
});

test('WORK_0036_PRODUCTION_PREPARATION_USES_NO_ARG_AUTOMATION_STATUS', () => {
  const harness = makePreparationCallerHarness(false);
  const result = harness.context.WorkOsSetup
    .preparePersonalAutomationQualification();
  assert.strictEqual(result.status,
    'READY_FOR_PERSONAL_AUTOMATION_QUALIFICATION');
  assert.deepStrictEqual(harness.calls, [0]);
  assert.strictEqual(
    harness.props.getProperty(Config.PROPERTIES.CODE_VERSION),
    Config.CODE_VERSION
  );
});

test('WORK_0036_TEST_MODE_PREPARATION_RETAINS_DEPENDENCY_INJECTION', () => {
  const harness = makePreparationCallerHarness(true);
  const result = harness.context.WorkOsSetup
    .preparePersonalAutomationQualification({
      properties: harness.props,
      completed_stages: Config.SETUP_STAGES.slice(),
      spreadsheet: harness.fakeSpreadsheet,
      script_app: offScriptApp()
    });
  assert.strictEqual(result.status,
    'READY_FOR_PERSONAL_AUTOMATION_QUALIFICATION');
  assert.deepStrictEqual(harness.calls, [1]);
});

test('WORK_0036_AUTOMATION_PRODUCTION_DI_GUARD_REMAINS_FAIL_CLOSED', () => {
  const triggerSource = fs.readFileSync(
    path.join(__dirname, '..', 'apps-script-v2', '12_Triggers.gs'),
    'utf8'
  );
  assert.match(
    triggerSource,
    /Object\.keys\(settings\)\.length && !WorkOsConfig\.TEST_MODE/
  );
  assert.match(triggerSource, /E_TEST_MODE_DISABLED/);
});

test('WORK_0036_ENABLE_REMAINS_FAIL_CLOSED_AND_OFF', () => {
  const props = resetProperties();
  const scriptApp = offScriptApp();
  assert.throws(
    () => sandbox.WorkOsAutomation.enableAutomation({
      properties: props,
      script_app: scriptApp
    }),
    (error) => error && error.code === 'E_LOCK_UNAVAILABLE'
  );
  assert.strictEqual(props.getProperty(Config.PROPERTIES.AUTOMATION_ENABLED),
    null);
  assert.strictEqual(props.getProperty(
    Config.PROPERTIES.AUTOMATION_DESIRED_STATE
  ), null);
  assert.strictEqual(scriptApp.triggers.length, 0);
});

test('WORK_0036_READINESS_IS_BOUNDED_AND_NON_MUTATING', () => {
  const fixture = sandbox.PropertiesService.getScriptProperties();
  const scriptApp = {
    triggers: [],
    getProjectTriggers() { return this.triggers.slice(); }
  };
  const before = scriptApp.triggers.length;
  const result = sandbox.WorkOsAutomation
    .getPersonalAutomationQualificationStatus({
      properties: fixture,
      script_app: scriptApp
    });
  assert.strictEqual(result.status, 'BLOCKED');
  assert.strictEqual(result.qualification_scope,
    'SYNTHETIC_AUTOMATION_QUALIFICATION_ONLY');
  assert.strictEqual(result.exact_body_guard_active, true);
  assert.strictEqual(result.exact_query_active, true);
  assert.strictEqual(result.external_request_performed, false);
  assert.strictEqual(result.automation.clock_trigger_count, 0);
  assert.notStrictEqual(result.formal_labels, 'NOT_CHECKED');
  assert.notStrictEqual(result.calendar, 'NOT_CHECKED');
  assert.strictEqual(scriptApp.triggers.length, before);
  assert.ok(!JSON.stringify(result).includes('GEMINI_API_KEY'));
});

test('WORK_0036_PREPARATION_IS_OFF_ONLY_IDEMPOTENT_AND_VERSION_ALIGNED', () => {
  const props = sandbox.PropertiesService.getScriptProperties();
  scriptProperties.clear();
  props.setProperty(Config.PROPERTIES.SETUP_COMPLETED_STAGES,
    JSON.stringify(['S99_COMPLETE']));
  props.setProperty(Config.PROPERTIES.SCHEMA_VERSION, Config.SCHEMA_VERSION);
  props.setProperty(Config.PROPERTIES.MIGRATION_VERSION,
    Config.MIGRATION_VERSION);
  const scriptApp = { getProjectTriggers: () => [] };
  const options = {
    properties: props,
    script_app: scriptApp,
    completed_stages: ['S99_COMPLETE'],
    spreadsheet: context.__work0036.makeOperationalSpreadsheet()
  };
  const first = sandbox.WorkOsSetup.preparePersonalAutomationQualification(
    options
  );
  const second = sandbox.WorkOsSetup.preparePersonalAutomationQualification(
    options
  );
  assert.strictEqual(first.status,
    'READY_FOR_PERSONAL_AUTOMATION_QUALIFICATION');
  assert.strictEqual(second.property_keys_changed.length, 0);
  assert.strictEqual(props.getProperty(Config.PROPERTIES.AUTOMATION_ENABLED),
    null);
  assert.strictEqual(first.external_request_performed, false);
  assert.strictEqual(first.credential_value_read, false);
});

const failed = tests.filter((item) => item.status !== 'PASS');
process.stdout.write(`${JSON.stringify({
  suite: 'work_0036_personal_automation_qualification',
  environment: 'LOCAL_NON_GOOGLE_SYNTHETIC_ONLY',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests,
  real_gmail: 'NOT_EXECUTED',
  real_gemini: 'NOT_EXECUTED',
  trigger_mutation: 'NOT_EXECUTED'
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
