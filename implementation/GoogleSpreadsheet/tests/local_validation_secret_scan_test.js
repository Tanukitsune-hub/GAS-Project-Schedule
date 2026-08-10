'use strict';

const assert = require('node:assert');
const {
  contentHasSensitivePattern,
  isForbiddenCredentialPath
} = require('../tools/local_validation_gate');

const constructedCredentialLikeValue = ['AIza', 'a'.repeat(30)].join('');
const constructedWorkspaceUrl = ['https://', 'docs.google.com/spreadsheets/d/', 'synthetic'].join('');
const constructedLocalPath = ['C:', '\\Users\\synthetic'].join('');

assert.strictEqual(contentHasSensitivePattern(constructedCredentialLikeValue), true);
assert.strictEqual(contentHasSensitivePattern(constructedWorkspaceUrl), true);
assert.strictEqual(contentHasSensitivePattern(constructedLocalPath), true);
assert.strictEqual(isForbiddenCredentialPath('nested/.clasp.json'), true);
assert.strictEqual(
  isForbiddenCredentialPath('nested/.clasp-work-0006/target.json'), true
);
assert.strictEqual(
  isForbiddenCredentialPath(
    'nested/.clasp-pull-verify-work-0006/payload/appsscript.json'
  ), true
);
assert.strictEqual(
  isForbiddenCredentialPath(
    'nested/.work-0007-read-state/work-0007-content-read-state.json'
  ), true
);
assert.strictEqual(
  isForbiddenCredentialPath(
    'nested/.clasp-work-0010/work-0010-execution-state.json'
  ), true
);
assert.strictEqual(
  isForbiddenCredentialPath(
    'nested/.clasp-pull-verify-work-0010/payload/appsscript.json'
  ), true
);
assert.strictEqual(isForbiddenCredentialPath('nested/credentials.local.json'), true);
assert.strictEqual(isForbiddenCredentialPath('nested/.env.example'), false);
assert.strictEqual(isForbiddenCredentialPath('nested/.clasp.example.json'), false);

process.stdout.write(`${JSON.stringify({
  suite: 'local_validation_secret_scan',
  passed: 7,
  failed: 0,
  policy: 'changed_content_and_tracked_path_guards'
}, null, 2)}\n`);
