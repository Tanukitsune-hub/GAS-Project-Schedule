'use strict';

const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  approvedSyntheticFixtureHashes,
  contentHasSensitivePattern,
  isForbiddenCredentialPath
} = require('../tools/local_validation_gate');

const moduleRoot = path.resolve(__dirname, '..');
const knownSyntheticFixture = fs.readFileSync(
  path.join(moduleRoot, 'apps-script-v2', '99_TestHarness.gs')
);
const knownHash = crypto.createHash('sha256').update(knownSyntheticFixture).digest('hex');
const constructedCredentialLikeValue = ['AIza', 'a'.repeat(30)].join('');
const constructedWorkspaceUrl = ['https://', 'docs.google.com/spreadsheets/d/', 'synthetic'].join('');
const constructedLocalPath = ['C:', '\\Users\\synthetic'].join('');

assert.strictEqual(contentHasSensitivePattern(constructedCredentialLikeValue), true);
assert.strictEqual(contentHasSensitivePattern(constructedWorkspaceUrl), true);
assert.strictEqual(contentHasSensitivePattern(constructedLocalPath), true);
assert.strictEqual(
  approvedSyntheticFixtureHashes().has(knownHash),
  true,
  'the exact historical synthetic fixture must be fingerprint-approved'
);
assert.strictEqual(
  approvedSyntheticFixtureHashes().has(
    crypto.createHash('sha256').update(`${knownSyntheticFixture}\nchanged`).digest('hex')
  ),
  false,
  'a changed fixture must return to strict scanning'
);
assert.strictEqual(isForbiddenCredentialPath('nested/.clasp.json'), true);
assert.strictEqual(isForbiddenCredentialPath('nested/credentials.local.json'), true);
assert.strictEqual(isForbiddenCredentialPath('nested/.env.example'), false);
assert.strictEqual(isForbiddenCredentialPath('nested/.clasp.example.json'), false);

process.stdout.write(`${JSON.stringify({
  suite: 'local_validation_secret_scan',
  passed: 9,
  failed: 0,
  policy: 'exact_content_fixture_allowlist'
}, null, 2)}\n`);
