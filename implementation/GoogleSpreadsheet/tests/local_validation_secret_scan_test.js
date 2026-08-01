'use strict';

const assert = require('node:assert');
const {
  contentHasSensitivePattern,
  hasTrackedScriptId,
  isForbiddenCredentialPath
} = require('../tools/local_validation_gate');

const constructedCredentialLikeValue = ['AIza', 'a'.repeat(30)].join('');
const constructedWorkspaceUrl = ['https://', 'docs.google.com/spreadsheets/d/', 'synthetic'].join('');
const constructedLocalPath = ['C:', '\\Users\\synthetic'].join('');

assert.strictEqual(contentHasSensitivePattern(constructedCredentialLikeValue), true);
assert.strictEqual(contentHasSensitivePattern(constructedWorkspaceUrl), true);
assert.strictEqual(contentHasSensitivePattern(constructedLocalPath), true);
assert.strictEqual(hasTrackedScriptId('{"scriptId":"LOCAL_ONLY"}'), false);
assert.strictEqual(hasTrackedScriptId('{"scriptId":"..."}'), false);
assert.strictEqual(
  hasTrackedScriptId('{"scriptId":"REPLACE_WITH_PERSONAL_SYNTHETIC_DEV_SCRIPT_ID"}'),
  false
);
assert.strictEqual(hasTrackedScriptId(`{"scriptId":"${'A'.repeat(24)}"}`), true);
assert.strictEqual(isForbiddenCredentialPath('nested/.clasp.json'), true);
assert.strictEqual(isForbiddenCredentialPath('nested/credentials.local.json'), true);
assert.strictEqual(isForbiddenCredentialPath('nested/.env.example'), false);
assert.strictEqual(isForbiddenCredentialPath('nested/.clasp.example.json'), false);

process.stdout.write(`${JSON.stringify({
  suite: 'local_validation_secret_scan',
  passed: 11,
  failed: 0,
  policy: 'changed_content_and_tracked_path_guards'
}, null, 2)}\n`);
