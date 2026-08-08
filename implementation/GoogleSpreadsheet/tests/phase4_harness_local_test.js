'use strict';

/**
 * Executes the Phase 4-only portion of the Apps Script Test Harness locally.
 *
 * Production code is evaluated in a VM. The five real Workspace cases remain
 * SKIPPED/NOT EXECUTED and no Google service is contacted.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appsScriptRoot = path.resolve(__dirname, '..', 'apps-script-v2');
let fakeScriptLockHeld = false;
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
  },
  LockService: {
    getScriptLock: () => {
      let heldByThisLock = false;
      return {
        tryLock: () => {
          if (fakeScriptLockHeld) {
            return false;
          }
          fakeScriptLockHeld = true;
          heldByThisLock = true;
          return true;
        },
        hasLock: () => heldByThisLock && fakeScriptLockHeld,
        releaseLock: () => {
          if (heldByThisLock) {
            heldByThisLock = false;
            fakeScriptLockHeld = false;
          }
        }
      };
    }
  }
};
vm.createContext(sandbox);

[
  '00_Config.gs',
  '01_TypesAndSchemas.gs',
  '17_Utilities.gs',
  '02_Setup.gs',
  '10_CalendarSync.gs'
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
  throw new Error('PHASE4_HARNESS_EXPOSURE_POINT_NOT_FOUND');
}
harnessSource = harnessSource.replace(
  exposureNeedle,
  '  globalThis.__phase4Tests = phase4Tests;\n' + exposureNeedle
);
vm.runInContext(harnessSource, sandbox, { filename: '99_TestHarness.gs' });

const results = sandbox.__phase4Tests();
const summary = {
  phase: 4,
  suite: 'apps_script_phase4_harness_isolated',
  passed: results.filter((item) => item.status === 'PASS').length,
  failed: results.filter((item) => item.status === 'FAIL').length,
  skipped: results.filter((item) => item.status === 'SKIPPED').length,
  real_google_workspace: 'NOT_EXECUTED',
  tests: results
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed > 0 ||
    summary.passed !== 15 ||
    summary.skipped !== 5) {
  process.exitCode = 1;
}
