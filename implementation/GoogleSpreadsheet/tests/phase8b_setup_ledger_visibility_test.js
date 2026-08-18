'use strict';

/*
 * Phase 8B Setup Ledger visibility/protection regression suite.
 *
 * This suite reproduces PHASE8B-SETUP-01 entirely in an in-memory Apps
 * Script facade.  It does not contact Google Workspace, OAuth, Gmail,
 * Calendar, or any real data.  The fixture is deliberately derived from the
 * existing Phase 1 authority-aware fake so Sheet visibility and Sheet
 * protection state are observable and fault-injectable.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repositoryRoot = path.resolve(__dirname, '..');
const appsScriptRoot = path.join(repositoryRoot, 'apps-script-v2');
const phase1FixturePath = path.join(__dirname, 'phase1_audit_test.js');
const phase1Source = fs.readFileSync(phase1FixturePath, 'utf8')
  .replace(/\r\n/g, '\n');
const testsMarker = '\nconst tests = [];\n';
const fixtureEnd = phase1Source.indexOf(testsMarker);
if (fixtureEnd < 0) {
  throw new Error('PHASE1_FIXTURE_TEST_MARKER_NOT_FOUND');
}

const fixtureContext = {
  require,
  __dirname,
  __filename: phase1FixturePath,
  console,
  process: { stdout: { write: () => {} }, exitCode: 0 },
  Buffer,
  structuredClone
};
vm.createContext(fixtureContext);
vm.runInContext(
  phase1Source.slice(0, fixtureEnd) + `
globalThis.__phase8bSetupFixture = {
  sandbox,
  FakeRange,
  FakeSheet,
  FakeSpreadsheet
};
`,
  fixtureContext,
  { filename: 'phase1_authority_fixture.js' }
);

const fixture = fixtureContext.__phase8bSetupFixture;
const sandbox = fixture.sandbox;
const originalModules = {
  WorkOsSheetBuilder: sandbox.WorkOsSheetBuilder,
  WorkOsTaskRepository: sandbox.WorkOsTaskRepository,
  WorkOsMigrations: sandbox.WorkOsMigrations,
  WorkOsGmailGateway: sandbox.WorkOsGmailGateway,
  WorkOsCalendarSync: sandbox.WorkOsCalendarSync,
  WorkOsAutomation: sandbox.WorkOsAutomation,
  WorkOsDiagnostics: sandbox.WorkOsDiagnostics,
  WorkOsDashboard: sandbox.WorkOsDashboard
};

function matrixColumns(matrix, count, value) {
  matrix.forEach((row) => {
    for (let index = 0; index < count; index += 1) row.push(value);
  });
}

function installStatefulFakeExtensions() {
  const originalRangeProtect = fixture.FakeRange.prototype.protect;
  fixture.FakeRange.prototype.protect = function () {
    if (this.sheet.failProtect) throw new Error('SYNTHETIC_PROTECTION_WRITE_FAILURE');
    return originalRangeProtect.call(this);
  };

  const originalSheetProtect = fixture.FakeSheet.prototype.protect;
  fixture.FakeSheet.prototype.protect = function () {
    if (this.failProtect) throw new Error('SYNTHETIC_PROTECTION_WRITE_FAILURE');
    return originalSheetProtect.call(this);
  };

  const originalHideSheet = fixture.FakeSheet.prototype.hideSheet;
  fixture.FakeSheet.prototype.hideSheet = function () {
    this.controlPlaneEvents = this.controlPlaneEvents || [];
    this.controlPlaneEvents.push({ type: 'hideSheet', sheet: this.getName() });
    if (this.failHide) throw new Error('SYNTHETIC_VISIBILITY_WRITE_FAILURE');
    return originalHideSheet.call(this);
  };

  const originalShowSheet = fixture.FakeSheet.prototype.showSheet;
  fixture.FakeSheet.prototype.showSheet = function () {
    this.controlPlaneEvents = this.controlPlaneEvents || [];
    this.controlPlaneEvents.push({ type: 'showSheet', sheet: this.getName() });
    return originalShowSheet.call(this);
  };

  fixture.FakeRange.prototype.getNote = function () {
    return this.getNotes()[0][0];
  };
  fixture.FakeRange.prototype.setNote = function (value) {
    for (let rowOffset = 0; rowOffset < this.rowCount; rowOffset += 1) {
      for (let columnOffset = 0; columnOffset < this.columnCount; columnOffset += 1) {
        this.sheet.notes[this.row - 1 + rowOffset][this.column - 1 + columnOffset] =
          String(value || '');
      }
    }
    return this;
  };

  fixture.FakeSheet.prototype.setName = function (name) {
    this.name = String(name);
    return this;
  };
  fixture.FakeSheet.prototype.insertColumnsAfter = function (after, count) {
    assert.strictEqual(after, this.maxColumns, 'insertColumnsAfter must append');
    matrixColumns(this.cells, count, '');
    matrixColumns(this.formulas, count, '');
    matrixColumns(this.notes, count, '');
    matrixColumns(this.validations, count, null);
    matrixColumns(this.formats, count, '');
    this.maxColumns += count;
    return this;
  };
  fixture.FakeSheet.prototype.deleteColumns = function (start, count) {
    [this.cells, this.formulas, this.notes, this.validations, this.formats]
      .forEach((matrix) => matrix.forEach((row) => row.splice(start - 1, count)));
    this.maxColumns -= count;
    return this;
  };
  fixture.FakeSheet.prototype.deleteRows = function (start, count) {
    [this.cells, this.formulas, this.notes, this.validations, this.formats]
      .forEach((matrix) => matrix.splice(start - 1, count));
    this.maxRows -= count;
    return this;
  };
  fixture.FakeSheet.prototype.getLastRow = function () {
    let last = 1;
    this.cells.forEach((row, index) => {
      if (row.some((value) => value !== '' && value != null)) last = index + 1;
    });
    return last;
  };

  fixture.FakeSpreadsheet.prototype.insertSheet = function (name, index) {
    const sheet = new fixture.FakeSheet(String(name), 100, 1);
    sheet.parent = this;
    const target = Number.isInteger(index) ? index : this.sheets.length;
    this.sheets.splice(target, 0, sheet);
    return sheet;
  };
  fixture.FakeSpreadsheet.prototype.setActiveSheet = function (sheet) {
    this.activeSheet = sheet;
    return this;
  };
  fixture.FakeSpreadsheet.prototype.getActiveSheet = function () {
    return this.activeSheet || this.sheets[0] || null;
  };
  fixture.FakeSpreadsheet.prototype.moveActiveSheet = function (position) {
    const sheet = this.getActiveSheet();
    const current = this.sheets.indexOf(sheet);
    if (current < 0) return this;
    this.sheets.splice(current, 1);
    this.sheets.splice(Math.max(0, Number(position) - 1), 0, sheet);
    return this;
  };
}
installStatefulFakeExtensions();

function makeProperties(initial) {
  const values = new Map(Object.entries(initial || {}).map(([key, value]) => [
    String(key), String(value)
  ]));
  return {
    getProperty: (key) => values.has(String(key)) ? values.get(String(key)) : null,
    setProperty: (key, value) => values.set(String(key), String(value)),
    setProperties: (entries) => Object.keys(entries).forEach((key) =>
      values.set(String(key), String(entries[key]))
    ),
    snapshot: () => Object.fromEntries(values.entries())
  };
}

function attachParents(spreadsheet) {
  spreadsheet.getSheets().forEach((sheet) => { sheet.parent = spreadsheet; });
}

function restoreModules() {
  Object.keys(originalModules).forEach((name) => {
    sandbox[name] = originalModules[name];
  });
}

function installSetupOnlyStubs(environment) {
  restoreModules();
  attachParents(environment.spreadsheet);
  sandbox.SpreadsheetApp.getActiveSpreadsheet = () => environment.spreadsheet;
  sandbox.SpreadsheetApp.flush = () => {
    environment.flushCount = Number(environment.flushCount || 0) + 1;
  };
  sandbox.PropertiesService.getScriptProperties = () => environment.properties;
  sandbox.WorkOsMigrations = {
    ensureV2ExtensionsBeforeValidation: () => ({ status: 'NOT_APPLICABLE' })
  };
  const resources = environment.externalResources || {
    labels: { token: 'synthetic-label-set-v1', created: 0, reused: 0, deleted: 0 },
    calendar: { token: 'synthetic-calendar-v1', created: 0, reused: 0, deleted: 0 },
    edit_trigger: { token: 'synthetic-edit-trigger-v1', created: 0, reused: 0, deleted: 0 },
    time_trigger_created: 0
  };
  environment.externalResources = resources;
  const ensureOnce = (resource) => {
    if (resource.created === 0) {
      resource.created += 1;
    } else {
      resource.reused += 1;
    }
    return resource.token;
  };
  sandbox.WorkOsGmailGateway = {
    ensureFormalLabels: () => ({
      status: 'CONFIGURED',
      synthetic_resource: ensureOnce(resources.labels)
    }),
    inspectFormalLabels: () => ({
      complete: true,
      present_count: sandbox.WorkOsConfig.GMAIL_LABELS.length
    })
  };
  sandbox.WorkOsCalendarSync = {
    ensureDedicatedCalendar: () => ({
      status: 'CONFIGURED',
      synthetic_resource: ensureOnce(resources.calendar)
    }),
    inspectDedicatedCalendarConfiguration: () => ({
      property_present: true,
      remotely_verified: true,
      status: 'CONFIGURED'
    })
  };
  sandbox.WorkOsAutomation = {
    ensureEditTrigger: () => {
      const token = ensureOnce(resources.edit_trigger);
      environment.properties.setProperty(
        sandbox.WorkOsConfig.PROPERTIES.EDIT_TRIGGER_ID,
        token
      );
      return { status: 'CONFIGURED', synthetic_resource: token };
    }
  };
  sandbox.WorkOsDiagnostics = {
    runQuickDiagnostic: () => ({
      status: environment.quickDiagnosticStatus || 'PASS'
    })
  };
  sandbox.WorkOsDashboard = {
    MODULE_CONTRACT_ID: sandbox.WorkOsConfig.S90_MODULE_CONTRACT_ID,
    normalizeSystemBlockNumberFormatForSetup: () => ({
      normalization_status: 'CANONICAL',
      status: 'CANONICAL',
      write_performed: false,
      flush_performed: false,
      postcondition_verified: true,
      checked_cell_count: 51,
      noncanonical_count: 0,
      row_count: 17,
      column_count: 3,
      layout_status: 'SYNTHETIC'
    })
  };
}

function stageList(environment) {
  const raw = environment.properties.getProperty(
    sandbox.WorkOsConfig.PROPERTIES.SETUP_COMPLETED_STAGES
  );
  return raw ? JSON.parse(raw) : [];
}

function setStageList(environment, stages) {
  environment.properties.setProperty(
    sandbox.WorkOsConfig.PROPERTIES.SETUP_COMPLETED_STAGES,
    JSON.stringify(stages)
  );
}

function newEnvironment() {
  const spreadsheet = new fixture.FakeSpreadsheet([
    new fixture.FakeSheet('Sheet1', 100, 1)
  ]);
  const environment = {
    spreadsheet,
    properties: makeProperties({}),
    flushCount: 0,
    quickDiagnosticStatus: 'PASS'
  };
  installSetupOnlyStubs(environment);
  return environment;
}

function externalResourceSnapshot(environment) {
  return JSON.parse(JSON.stringify(environment.externalResources));
}

function s10PartialEnvironment() {
  const environment = newEnvironment();
  sandbox.WorkOsSheetBuilder.ensureSheets(environment.spreadsheet);
  attachParents(environment.spreadsheet);
  setStageList(environment, ['S00_VALIDATE_ENV', 'S10_CREATE_SHEETS']);
  return environment;
}

function ledgerFor(environment) {
  return environment.spreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.TASK_AUTHORITY_LEDGER
  );
}

function taskFor(environment) {
  return environment.spreadsheet.getSheetByName(sandbox.WorkOsConfig.SHEETS.TASKS);
}

function expectedLedgerProtection(ledger) {
  const description = `WORK_OS_V2_PHASE1_${
    sandbox.WorkOsConfig.SHEETS.TASK_AUTHORITY_LEDGER
  }_MANAGEMENT_SHEET`;
  return ledger.getProtections(sandbox.SpreadsheetApp.ProtectionType.SHEET)
    .filter((protection) =>
      protection.getDescription() === description &&
      protection.isWarningOnly() === false &&
      protection.canDomainEdit() === false &&
      protection.getUnprotectedRanges().length === 0
    );
}

function installValidatorProbe(environment) {
  const originalRepository = sandbox.WorkOsTaskRepository;
  const observations = [];
  sandbox.WorkOsTaskRepository = Object.assign({}, originalRepository, {
    validateAllTaskAuthorities: (taskSheet, options) => {
      const ledger = taskSheet.getParent().getSheetByName(
        sandbox.WorkOsConfig.SHEETS.TASK_AUTHORITY_LEDGER
      );
      observations.push({
        hidden: ledger.isSheetHidden(),
        protection_count: expectedLedgerProtection(ledger).length,
        completed_stages: stageList(environment)
      });
      return originalRepository.validateAllTaskAuthorities(taskSheet, options);
    }
  });
  return observations;
}

function runSetup(environment) {
  installSetupOnlyStubs(environment);
  return sandbox.WorkOsSetup.executeSetup();
}

const tests = [];
function test(id, body) {
  const startedAt = Date.now();
  try {
    body();
    tests.push({ id, status: 'PASS', duration_ms: Date.now() - startedAt });
  } catch (error) {
    tests.push({
      id,
      status: 'FAIL',
      duration_ms: Date.now() - startedAt,
      safe_message: sandbox.WorkOsUtilities.redact(error && error.message || String(error))
    });
  } finally {
    restoreModules();
  }
}

test('P8B-SL-01_FRESH_SETUP_ESTABLISHES_LEDGER_CONTROL_PLANE_BEFORE_VALIDATION', () => {
  const environment = newEnvironment();
  installSetupOnlyStubs(environment);
  const observations = installValidatorProbe(environment);
  const result = sandbox.WorkOsSetup.executeSetup();
  const ledger = ledgerFor(environment);

  assert.strictEqual(result.status, 'COMPLETE', JSON.stringify(result));
  assert.deepStrictEqual(stageList(environment), Array.from(sandbox.WorkOsConfig.SETUP_STAGES));
  assert.strictEqual(environment.spreadsheet.getSheets().length, 11);
  assert.strictEqual(ledger.isSheetHidden(), true);
  assert.strictEqual(expectedLedgerProtection(ledger).length, 1);
  assert.ok(observations.length >= 1, 'authority validator must be called');
  observations.forEach((observation) => {
    assert.strictEqual(observation.hidden, true);
    assert.strictEqual(observation.protection_count, 1);
    assert.deepStrictEqual(
      observation.completed_stages,
      ['S00_VALIDATE_ENV', 'S10_CREATE_SHEETS'],
      'S20 must not be recorded before the authority validator returns'
    );
  });
});

test('P8B-SL-02_PARTIAL_S00_S10_RESUME_REUSES_CANONICAL_SHEETS_WITHOUT_MANUAL_REPAIR', () => {
  const environment = s10PartialEnvironment();
  const sheetsBefore = environment.spreadsheet.getSheets().slice();
  const ledgerBefore = ledgerFor(environment);
  const taskBefore = taskFor(environment);
  assert.strictEqual(ledgerBefore.isSheetHidden(), false, 'P10 partial state is visible');

  const result = runSetup(environment);
  assert.strictEqual(result.status, 'COMPLETE', JSON.stringify(result));
  assert.deepStrictEqual(stageList(environment), Array.from(sandbox.WorkOsConfig.SETUP_STAGES));
  assert.strictEqual(environment.spreadsheet.getSheets().length, 11);
  assert.strictEqual(ledgerFor(environment), ledgerBefore);
  assert.strictEqual(taskFor(environment), taskBefore);
  sheetsBefore.forEach((sheet) => assert.ok(environment.spreadsheet.getSheets().includes(sheet)));
  assert.strictEqual(ledgerFor(environment).isSheetHidden(), true);
  assert.strictEqual(expectedLedgerProtection(ledgerFor(environment)).length, 1);
});

test('P8B-SL-03_VISIBILITY_FAILURE_LEAVES_S20_INCOMPLETE_AND_RESUMABLE', () => {
  const environment = s10PartialEnvironment();
  const ledger = ledgerFor(environment);
  ledger.failHide = true;

  const failed = runSetup(environment);
  assert.strictEqual(failed.status, 'FAILED');
  assert.strictEqual(failed.code, 'E_TASK_AUTHORITY_LEDGER_VISIBILITY_SETUP_FAILED');
  assert.strictEqual(failed.stage, 'S20_CREATE_SCHEMAS');
  assert.deepStrictEqual(stageList(environment), ['S00_VALIDATE_ENV', 'S10_CREATE_SHEETS']);
  assert.strictEqual(ledger.isSheetHidden(), false);

  ledger.failHide = false;
  const resumed = runSetup(environment);
  assert.strictEqual(resumed.status, 'COMPLETE', JSON.stringify(resumed));
  assert.deepStrictEqual(stageList(environment), Array.from(sandbox.WorkOsConfig.SETUP_STAGES));
});

test('P8B-SL-04_PROTECTION_FAILURE_LEAVES_S20_INCOMPLETE_AND_FAILS_CLOSED', () => {
  const environment = s10PartialEnvironment();
  const ledger = ledgerFor(environment);
  ledger.failProtect = true;

  const failed = runSetup(environment);
  assert.strictEqual(failed.status, 'FAILED');
  assert.strictEqual(failed.code, 'E_TASK_AUTHORITY_LEDGER_PROTECTION_SETUP_FAILED');
  assert.strictEqual(failed.stage, 'S20_CREATE_SCHEMAS');
  assert.deepStrictEqual(stageList(environment), ['S00_VALIDATE_ENV', 'S10_CREATE_SHEETS']);
  assert.strictEqual(ledger.isSheetHidden(), false);
  assert.strictEqual(expectedLedgerProtection(ledger).length, 0);
});

test('P8B-SL-05_SETUP_OWNED_BOOTSTRAP_CORRECTS_VISIBLE_OR_UNPROTECTED_VARIANTS', () => {
  const visibleEnvironment = s10PartialEnvironment();
  sandbox.WorkOsSheetBuilder.applyAllSchemas(visibleEnvironment.spreadsheet);
  const visibleLedger = ledgerFor(visibleEnvironment);
  assert.strictEqual(visibleLedger.isSheetHidden(), false);
  assert.strictEqual(expectedLedgerProtection(visibleLedger).length, 1);
  assert.strictEqual(runSetup(visibleEnvironment).status, 'COMPLETE');
  assert.strictEqual(visibleLedger.isSheetHidden(), true);
  assert.strictEqual(expectedLedgerProtection(visibleLedger).length, 1);

  const unprotectedEnvironment = s10PartialEnvironment();
  sandbox.WorkOsSheetBuilder.applyAllSchemas(unprotectedEnvironment.spreadsheet);
  const unprotectedLedger = ledgerFor(unprotectedEnvironment);
  unprotectedLedger.hideSheet();
  unprotectedLedger.sheetProtections = [];
  assert.strictEqual(unprotectedLedger.isSheetHidden(), true);
  assert.strictEqual(expectedLedgerProtection(unprotectedLedger).length, 0);
  assert.strictEqual(runSetup(unprotectedEnvironment).status, 'COMPLETE');
  assert.strictEqual(unprotectedLedger.isSheetHidden(), true);
  assert.strictEqual(expectedLedgerProtection(unprotectedLedger).length, 1);
});

test('P8B-SL-06_S30_REASSERTS_LEDGER_VISIBILITY_AND_PROTECTION_IDEMPOTENTLY', () => {
  const environment = s10PartialEnvironment();
  sandbox.WorkOsSheetBuilder.applyAllSchemas(environment.spreadsheet);
  const ledger = ledgerFor(environment);
  ledger.showSheet();
  ledger.sheetProtections = [];

  const first = sandbox.WorkOsSetup.runStageForTest('S30_APPLY_SMALL_VALIDATIONS');
  assert.strictEqual(first.applied, true);
  assert.strictEqual(ledger.isSheetHidden(), true);
  assert.strictEqual(expectedLedgerProtection(ledger).length, 1);

  const protectionCount = expectedLedgerProtection(ledger).length;
  const second = sandbox.WorkOsSetup.runStageForTest('S30_APPLY_SMALL_VALIDATIONS');
  assert.strictEqual(second.applied, true);
  assert.strictEqual(ledger.isSheetHidden(), true);
  assert.strictEqual(expectedLedgerProtection(ledger).length, protectionCount);
});

test('P8B-SL-07_COMPLETED_SETUP_RERUN_REASSERTS_CONTROLS_WITHOUT_REBASELINE', () => {
  const environment = newEnvironment();
  assert.strictEqual(runSetup(environment).status, 'COMPLETE');
  installSetupOnlyStubs(environment);
  const task = taskFor(environment);
  sandbox.WorkOsTaskRepository.upsertPhase1MockTask();
  const ledger = ledgerFor(environment);
  const taskBefore = JSON.stringify(task.cells);
  const ledgerBefore = JSON.stringify(ledger.cells);
  const stagesBefore = stageList(environment);
  const sheetCountBefore = environment.spreadsheet.getSheets().length;
  ledger.showSheet();
  ledger.sheetProtections = [];

  const rerun = runSetup(environment);
  assert.strictEqual(rerun.status, 'COMPLETE', JSON.stringify(rerun));
  assert.deepStrictEqual(stageList(environment), stagesBefore);
  assert.strictEqual(environment.spreadsheet.getSheets().length, sheetCountBefore);
  assert.strictEqual(ledger.isSheetHidden(), true);
  assert.strictEqual(expectedLedgerProtection(ledger).length, 1);
  assert.strictEqual(JSON.stringify(task.cells), taskBefore);
  assert.strictEqual(JSON.stringify(ledger.cells), ledgerBefore);
  assert.strictEqual(
    environment.properties.getProperty(sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED),
    'false'
  );
});

test('P8B-SL-07B_S00_S80_PARTIAL_RESUME_REUSES_EXTERNAL_RESOURCES', () => {
  const environment = newEnvironment();
  environment.quickDiagnosticStatus = 'FAIL';
  const failed = runSetup(environment);
  assert.strictEqual(failed.status, 'FAILED', JSON.stringify(failed));
  assert.strictEqual(failed.code, 'E_QUICK_DIAGNOSTIC_FAILED');
  assert.deepStrictEqual(
    stageList(environment),
    Array.from(sandbox.WorkOsConfig.SETUP_STAGES).slice(0, 9)
  );
  const before = externalResourceSnapshot(environment);
  assert.strictEqual(before.labels.created, 1);
  assert.strictEqual(before.calendar.created, 1);
  assert.strictEqual(before.edit_trigger.created, 1);
  assert.strictEqual(before.time_trigger_created, 0);

  environment.quickDiagnosticStatus = 'WARN';
  const resumed = runSetup(environment);
  assert.strictEqual(resumed.status, 'COMPLETE', JSON.stringify(resumed));
  assert.deepStrictEqual(stageList(environment), Array.from(sandbox.WorkOsConfig.SETUP_STAGES));
  const after = externalResourceSnapshot(environment);
  ['labels', 'calendar', 'edit_trigger'].forEach((name) => {
    assert.strictEqual(after[name].token, before[name].token);
    assert.strictEqual(after[name].created, before[name].created);
    assert.strictEqual(after[name].deleted, 0);
  });
  assert.strictEqual(after.labels.reused, before.labels.reused);
  assert.strictEqual(after.calendar.reused, before.calendar.reused);
  assert.strictEqual(after.edit_trigger.reused, before.edit_trigger.reused + 1);
  assert.strictEqual(after.time_trigger_created, 0);
  assert.strictEqual(
    environment.properties.getProperty(sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED),
    'false'
  );
  assert.strictEqual(
    environment.properties.getProperty(
      sandbox.WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE
    ),
    'false'
  );
});

test('P8B-SL-07C_TRUE_S90_FAILURE_STAYS_RESUMABLE_WITHOUT_RESOURCE_DUPLICATION', () => {
  const environment = newEnvironment();
  environment.quickDiagnosticStatus = 'FAIL';
  assert.strictEqual(runSetup(environment).status, 'FAILED');
  const before = externalResourceSnapshot(environment);
  const repeated = runSetup(environment);
  assert.strictEqual(repeated.status, 'FAILED');
  assert.strictEqual(repeated.code, 'E_QUICK_DIAGNOSTIC_FAILED');
  assert.deepStrictEqual(
    stageList(environment),
    Array.from(sandbox.WorkOsConfig.SETUP_STAGES).slice(0, 9)
  );
  const after = externalResourceSnapshot(environment);
  ['labels', 'calendar', 'edit_trigger'].forEach((name) => {
    assert.strictEqual(after[name].token, before[name].token);
    assert.strictEqual(after[name].created, before[name].created);
    assert.strictEqual(after[name].deleted, 0);
  });
  assert.strictEqual(after.labels.reused, before.labels.reused);
  assert.strictEqual(after.calendar.reused, before.calendar.reused);
  assert.strictEqual(after.edit_trigger.reused, before.edit_trigger.reused + 1);
  assert.strictEqual(after.time_trigger_created, 0);
});

test('P8B-SL-08_RAW_ROW_SNAPSHOT_AND_NOTE_NEVER_CREATE_SETUP_AUTHORITY', () => {
  const environment = s10PartialEnvironment();
  sandbox.WorkOsSheetBuilder.applyAllSchemas(environment.spreadsheet);
  sandbox.WorkOsSheetBuilder.ensureTaskAuthorityLedgerControlPlane(environment.spreadsheet);
  const task = taskFor(environment);
  const ledger = ledgerFor(environment);
  const ids = Array.from(sandbox.WorkOsSchemas.getInternalIds(sandbox.WorkOsConfig.SHEETS.TASKS));
  const taskId = `tsk_${'f'.repeat(32)}`;
  const raw = new Array(ids.length).fill('');
  raw[ids.indexOf('task_id')] = taskId;
  raw[ids.indexOf('origin_key')] = `org_${'e'.repeat(32)}`;
  raw[ids.indexOf('task_title')] = 'Untrusted raw row';
  raw[ids.indexOf('authoritative_snapshot_json')] = JSON.stringify({
    task_id: taskId,
    source: 'untrusted visible snapshot'
  });
  task.getRange(sandbox.WorkOsConfig.DATA_START_ROW, 1, 1, ids.length).setValues([raw]);
  task.getRange(
    sandbox.WorkOsConfig.DATA_START_ROW,
    ids.indexOf('authoritative_snapshot_json') + 1,
    1,
    1
  ).setNote('WORK_OS_TASK_AUTHORITY_V2:{"untrusted":true}');

  const report = sandbox.WorkOsTaskRepository.validateAllTaskAuthorities(task, {
    mode: 'SETUP',
    recover_prepared: true,
    recover_relocated: true,
    quarantine_invalid: false,
    mark_orphaned: true
  });
  assert.ok(report.rows.some((row) => row.task_id === taskId &&
    row.status !== 'VALID'));
  const ledgerTaskIdIndex = ledger.cells[0].indexOf('task_id');
  assert.strictEqual(
    ledger.cells.slice(2).some((row) => String(row[ledgerTaskIdIndex] || '') === taskId),
    false,
    'visible raw/snapshot/note data must not seed a ledger record'
  );
  assert.strictEqual(task.getRange(
    sandbox.WorkOsConfig.DATA_START_ROW,
    ids.indexOf('authoritative_snapshot_json') + 1,
    1,
    1
  ).getNote(), 'WORK_OS_TASK_AUTHORITY_V2:{"untrusted":true}');
});

const failed = tests.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({
  suite: 'phase8b_setup_ledger_visibility',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_google_workspace: 'NOT_EXECUTED',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
