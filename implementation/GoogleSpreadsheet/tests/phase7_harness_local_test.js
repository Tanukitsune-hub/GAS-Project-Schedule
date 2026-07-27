'use strict';

/**
 * Executes only the Phase 7 Apps Script acceptance cases locally.
 *
 * The three real-environment cases must remain SKIPPED.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const apps = path.resolve(__dirname, '..', 'apps-script-v2');
const sandbox = {
  console,
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
  isNaN,
  Utilities: {
    getUuid: () => crypto.randomUUID(),
    computeDigest: (_algorithm, value) =>
      Array.from(
        crypto.createHash('sha256').update(String(value), 'utf8').digest()
      ).map((byte) => (byte > 127 ? byte - 256 : byte)),
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    Charset: { UTF_8: 'UTF_8' }
  }
};
vm.createContext(sandbox);
[
  '00_Config.gs',
  '17_Utilities.gs',
  '01_TypesAndSchemas.gs',
  '19_RuntimeSettings.gs',
  '15_Dashboard.gs',
  '13_LogAndDeadLetter.gs'
].forEach((name) => {
  vm.runInContext(
    fs.readFileSync(path.join(apps, name), 'utf8'),
    sandbox,
    { filename: name }
  );
});

const needle =
  '  return Object.freeze({\n    runPhase1AcceptanceTests:';
let harness = fs.readFileSync(
  path.join(apps, '99_TestHarness.gs'),
  'utf8'
);
if (!harness.includes(needle)) {
  throw new Error('PHASE7_HARNESS_EXPOSURE_POINT_NOT_FOUND');
}
harness = harness.replace(
  needle,
  '  globalThis.__phase7Tests = phase7Tests;\n' + needle
);
vm.runInContext(harness, sandbox, { filename: '99_TestHarness.gs' });

const results = sandbox.__phase7Tests();
const summary = {
  phase: 7,
  suite: 'apps_script_phase7_harness_isolated',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_dead_letter_retry: 'NOT_EXECUTED',
  real_diagnostic_runtime: 'NOT_EXECUTED',
  real_dashboard_runtime: 'NOT_EXECUTED',
  real_provider_connection: 'NOT_EXECUTED',
  passed: results.filter((item) => item.status === 'PASS').length,
  failed: results.filter((item) => item.status === 'FAIL').length,
  skipped: results.filter((item) => item.status === 'SKIPPED').length,
  tests: results
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed || summary.passed !== 10 || summary.skipped !== 3) {
  process.exitCode = 1;
}

