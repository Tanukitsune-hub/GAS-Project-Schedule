'use strict';

const assert = require('node:assert');
const {
  isPersonalEmail,
  principalFingerprint,
  targetFingerprint,
  validateInspectionEvidence
} = require('../tools/work_0003_target_bootstrap');

const salt = Buffer.alloc(32, 7);
const syntheticUser = { email: 'synthetic.user@gmail.com', id: 'synthetic-user' };
const scriptId = 's'.repeat(32);
const parentId = 'p'.repeat(32);

assert.strictEqual(isPersonalEmail(syntheticUser.email), true);
assert.strictEqual(isPersonalEmail('synthetic@company.example'), false);
assert.strictEqual(isPersonalEmail(''), false);

const principal = principalFingerprint(salt, syntheticUser);
const target = targetFingerprint(salt, scriptId, parentId);
assert.match(principal, /^[0-9a-f]{64}$/);
assert.match(target, /^[0-9a-f]{64}$/);
assert.strictEqual(principal.includes(syntheticUser.email), false);
assert.strictEqual(target.includes(scriptId), false);

const evidence = {
  principal_email: syntheticUser.email,
  parent_id: parentId,
  script_id: scriptId,
  drive: {
    id: parentId,
    mimeType: 'application/vnd.google-apps.spreadsheet',
    ownedByMe: true,
    owners: [{ emailAddress: syntheticUser.email, me: true }]
  },
  permissions: [{
    role: 'owner', type: 'user', pendingOwner: false,
    emailAddress: syntheticUser.email, deleted: false
  }],
  script: { scriptId, parentId }
};

assert.deepStrictEqual(validateInspectionEvidence(evidence), {
  owned_by_me: true,
  owner_count: 1,
  shared_drive: false,
  pending_owner: false,
  bound_container: true
});

assert.throws(
  () => validateInspectionEvidence(Object.assign({}, evidence, {
    drive: Object.assign({}, evidence.drive, { driveId: 'shared-drive' })
  })),
  (error) => error && error.code === 'SYNTHETIC_TARGET_BINDING_INSPECTION_FAILED'
);
assert.throws(
  () => validateInspectionEvidence(Object.assign({}, evidence, {
    permissions: [Object.assign({}, evidence.permissions[0], { pendingOwner: true })]
  })),
  (error) => error && error.code === 'SYNTHETIC_TARGET_BINDING_INSPECTION_FAILED'
);
assert.throws(
  () => validateInspectionEvidence(Object.assign({}, evidence, {
    script: { scriptId, parentId: 'wrong-parent' }
  })),
  (error) => error && error.code === 'SYNTHETIC_TARGET_BINDING_INSPECTION_FAILED'
);

process.stdout.write(`${JSON.stringify({
  suite: 'work_0003_target_bootstrap',
  environment: 'LOCAL_NON_GOOGLE_SYNTHETIC_ONLY',
  passed: 11,
  failed: 0,
  google_operation: 'NOT_EXECUTED'
}, null, 2)}\n`);
