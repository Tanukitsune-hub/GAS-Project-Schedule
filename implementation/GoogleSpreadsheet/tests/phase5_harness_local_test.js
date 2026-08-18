'use strict';

/**
 * Executes the Phase 5-only Apps Script Test Harness locally.
 *
 * Production code is evaluated in a VM with a scripted Mock HTTP Transport.
 * It never contacts a real AI provider, Google Workspace service, or network
 * endpoint. The real-provider case remains SKIPPED / NOT EXECUTED.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appsScriptRoot = path.resolve(__dirname, '..', 'apps-script-v2');
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
  Utilities: {
    getUuid: () => crypto.randomUUID(),
    computeDigest: (_algorithm, value) =>
      Array.from(
        crypto.createHash('sha256').update(String(value), 'utf8').digest()
      ).map((byte) => (byte > 127 ? byte - 256 : byte)),
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    Charset: { UTF_8: 'UTF_8' },
    formatDate: (date, timezone) => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(date);
      const fields = Object.fromEntries(
        parts.map((part) => [part.type, part.value])
      );
      return `${fields.year}-${fields.month}-${fields.day}`;
    }
  }
};
vm.createContext(sandbox);

[
  '00_Config.gs',
  '17_Utilities.gs',
  '07_AiAdapter.gs'
].forEach((fileName) => {
  vm.runInContext(
    fs.readFileSync(path.join(appsScriptRoot, fileName), 'utf8'),
    sandbox,
    { filename: fileName }
  );
});

const exposureNeedle =
  '  return Object.freeze({\n    runPhase1AcceptanceTests:';
let harnessSource = fs.readFileSync(
  path.join(appsScriptRoot, '99_TestHarness.gs'),
  'utf8'
).replace(/\r\n/g, '\n');
if (!harnessSource.includes(exposureNeedle)) {
  throw new Error('PHASE5_HARNESS_EXPOSURE_POINT_NOT_FOUND');
}
harnessSource = harnessSource.replace(
  exposureNeedle,
  '  globalThis.__phase5Tests = phase5Tests;\n' + exposureNeedle
);
vm.runInContext(harnessSource, sandbox, { filename: '99_TestHarness.gs' });

const results = sandbox.__phase5Tests();
const summary = {
  phase: 5,
  suite: 'apps_script_phase5_harness_isolated',
  passed: results.filter((item) => item.status === 'PASS').length,
  failed: results.filter((item) => item.status === 'FAIL').length,
  skipped: results.filter((item) => item.status === 'SKIPPED').length,
  real_provider_connection: 'NOT_EXECUTED',
  google_workspace: 'NOT_EXECUTED',
  company_approval: 'NOT_CONFIRMED',
  credential_storage_approval: 'NOT_CONFIRMED',
  tests: results
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed > 0 || summary.passed !== 8 || summary.skipped !== 1) {
  process.exitCode = 1;
}
