'use strict';

/**
 * Executes the Phase 6-only Apps Script Test Harness locally.
 *
 * Trigger and Gmail real cases remain SKIPPED. All executed cases use
 * in-memory fakes and make no Google Workspace or network call.
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
    Charset: { UTF_8: 'UTF_8' },
    formatDate: (date, timezone) => {
      const fields = Object.fromEntries(
        new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).formatToParts(date).map((part) => [part.type, part.value])
      );
      return `${fields.year}-${fields.month}-${fields.day}`;
    }
  },
  Gmail: {
    Users: {
      Labels: {},
      Threads: {},
      Messages: {}
    }
  },
  LockService: {
    getDocumentLock: () => ({
      tryLock: () => true,
      releaseLock: () => {}
    })
  }
};
vm.createContext(sandbox);
[
  '00_Config.gs',
  '17_Utilities.gs',
  '05_GmailGateway.gs',
  '07_AiAdapter.gs',
  '02_Setup.gs',
  '12_Triggers.gs'
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
  throw new Error('PHASE6_HARNESS_EXPOSURE_POINT_NOT_FOUND');
}
harness = harness.replace(
  needle,
  '  globalThis.__phase6Tests = phase6Tests;\n' + needle
);
vm.runInContext(harness, sandbox, { filename: '99_TestHarness.gs' });

const results = sandbox.__phase6Tests();
const summary = {
  phase: 6,
  suite: 'apps_script_phase6_harness_isolated',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_trigger: 'NOT_EXECUTED',
  real_gmail: 'NOT_EXECUTED',
  real_provider_connection: 'NOT_EXECUTED',
  passed: results.filter((item) => item.status === 'PASS').length,
  failed: results.filter((item) => item.status === 'FAIL').length,
  skipped: results.filter((item) => item.status === 'SKIPPED').length,
  tests: results
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed || summary.passed !== 8 || summary.skipped !== 2) {
  process.exitCode = 1;
}

