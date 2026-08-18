'use strict';

const assert = require('node:assert');
const {
  compareTestInventory,
  testInventoryFingerprint
} = require('../tools/local_validation_gate');

const expected = [
  'alpha_test.js',
  'beta_test.js',
  'gamma_test.js'
];

assert.strictEqual(
  compareTestInventory(expected, expected).pass,
  true
);

const missing = compareTestInventory(
  ['alpha_test.js', 'gamma_test.js'],
  expected
);
assert.deepStrictEqual(missing.missing, ['beta_test.js']);
assert.deepStrictEqual(missing.extra, []);
assert.strictEqual(missing.pass, false);

const renamed = compareTestInventory(
  ['alpha_test.js', 'beta_renamed_test.js', 'gamma_test.js'],
  expected
);
assert.deepStrictEqual(renamed.missing, ['beta_test.js']);
assert.deepStrictEqual(renamed.extra, ['beta_renamed_test.js']);
assert.strictEqual(renamed.pass, false);

const removed = compareTestInventory(
  ['alpha_test.js', 'beta_test.js'],
  expected
);
assert.deepStrictEqual(removed.missing, ['gamma_test.js']);
assert.strictEqual(removed.pass, false);

const added = compareTestInventory(
  expected.concat('new_test.js'),
  expected
);
assert.deepStrictEqual(added.missing, []);
assert.deepStrictEqual(added.extra, ['new_test.js']);
assert.strictEqual(added.pass, false);

assert.strictEqual(
  testInventoryFingerprint(expected),
  testInventoryFingerprint(expected.slice().reverse())
);

process.stdout.write(`${JSON.stringify({
  suite: 'work_0036_test_inventory_contract',
  environment: 'LOCAL_NON_GOOGLE',
  passed: 9,
  failed: 0,
  missing_case: 'FAIL_CLOSED',
  renamed_case: 'FAIL_CLOSED',
  removed_case: 'FAIL_CLOSED',
  added_case: 'FAIL_CLOSED'
}, null, 2)}\n`);
