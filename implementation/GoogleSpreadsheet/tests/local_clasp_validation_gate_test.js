'use strict';

const assert = require('node:assert');
const childProcess = require('node:child_process');
const path = require('node:path');

const moduleRoot = path.resolve(__dirname, '..');
const tool = path.join(moduleRoot, 'tools', 'local_clasp_dev.js');
const result = childProcess.spawnSync(process.execPath, [tool, 'self-test'], {
  cwd: moduleRoot,
  encoding: 'utf8',
  windowsHide: true
});

assert.strictEqual(result.status, 0, result.stderr || result.stdout);
const report = JSON.parse(result.stdout);
assert.strictEqual(report.suite, 'local_clasp_dev_self_test');
assert.strictEqual(report.failed, 0);
assert.ok(report.passed >= 25);
assert.ok(report.tests.every((item) => item.status === 'PASS'));

process.stdout.write(`${JSON.stringify({
  suite: 'local_clasp_validation_gate',
  environment: 'LOCAL_NON_GOOGLE',
  passed: report.passed,
  failed: 0,
  local_clasp_authentication: 'NOT_EXECUTED'
}, null, 2)}\n`);
