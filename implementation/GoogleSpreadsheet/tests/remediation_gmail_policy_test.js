'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'apps-script-v2');
const sandbox = {
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
  Gmail: {
    Users: {
      Labels: {},
      Threads: {},
      Messages: {}
    }
  },
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
['00_Config.gs', '17_Utilities.gs', '05_GmailGateway.gs'].forEach((name) => {
  vm.runInContext(
    fs.readFileSync(path.join(sourceRoot, name), 'utf8'),
    sandbox,
    { filename: name }
  );
});

const Gateway = sandbox.WorkOsGmailGateway;
const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, status: 'PASS' });
  } catch (error) {
    results.push({ name, status: 'FAIL', message: error.message });
  }
}

function message({
  labels = ['INBOX'],
  from = 'Colleague <fixture@example.invalid>',
  unsubscribe = '',
  autoSubmitted = '',
  mimeType = 'text/plain',
  parts = []
} = {}) {
  const headers = [
    { name: 'From', value: from },
    { name: 'Subject', value: 'Synthetic policy fixture' }
  ];
  if (unsubscribe) {
    headers.push({ name: 'List-Unsubscribe', value: unsubscribe });
  }
  if (autoSubmitted) {
    headers.push({ name: 'Auto-Submitted', value: autoSubmitted });
  }
  return {
    id: 'synthetic-message',
    labelIds: labels,
    payload: { headers, mimeType, parts }
  };
}

test('R-GMAIL-01_MANUAL_EXCLUDE_ALWAYS_WINS', () => {
  const result = Gateway.automaticCandidatePolicy(
    ['謇句虚/髯､螟・, '謇句虚/蜿冶ｾｼ'],
    message({ labels: ['INBOX', 'CATEGORY_PROMOTIONS'] })
  );
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(result)),
    { process: false, reason: 'MANUAL_EXCLUDE', priority: 0 }
  );
});

test('R-GMAIL-02_SPAM_TRASH_AND_NON_INBOX_FAIL_CLOSED', () => {
  ['SPAM', 'TRASH'].forEach((label) => {
    assert.strictEqual(
      Gateway.automaticCandidatePolicy(
        ['謇句虚/蜿冶ｾｼ'],
        message({ labels: ['INBOX', label] })
      ).reason,
      'SYSTEM_SCOPE'
    );
  });
  assert.strictEqual(
    Gateway.automaticCandidatePolicy([], message({ labels: [] })).reason,
    'SYSTEM_SCOPE'
  );
});

test('R-GMAIL-03_MANUAL_IMPORT_OVERRIDES_LOW_VALUE_FILTERS', () => {
  const result = Gateway.automaticCandidatePolicy(
    ['謇句虚/蜿冶ｾｼ'],
    message({
      labels: ['INBOX', 'CATEGORY_PROMOTIONS'],
      unsubscribe: '<mailto:unsubscribe@example.invalid>'
    })
  );
  assert.strictEqual(result.process, true);
  assert.strictEqual(result.reason, 'MANUAL_IMPORT');
  assert.strictEqual(result.priority, 1);
});

test('R-GMAIL-04_PROMOTIONS_AND_SOCIAL_ARE_EXCLUDED', () => {
  ['CATEGORY_PROMOTIONS', 'CATEGORY_SOCIAL'].forEach((label) => {
    assert.strictEqual(
      Gateway.automaticCandidatePolicy(
        [],
        message({ labels: ['INBOX', label] })
      ).process,
      false
    );
  });
});

test('R-GMAIL-05_NEWSLETTER_RULE_REMAINS_BLOCKED_PENDING_DECISION', () => {
  const result = Gateway.automaticCandidatePolicy(
    [],
    message({ unsubscribe: '<https://example.invalid/unsubscribe>' })
  );
  assert.strictEqual(
    sandbox.WorkOsConfig.AUTOMATION_NEWSLETTER_FILTER_APPROVED,
    false
  );
  assert.strictEqual(result.reason, 'NORMAL_INBOX');
});

test('R-GMAIL-06_CALENDAR_RULE_REMAINS_BLOCKED_PENDING_DECISION', () => {
  const result = Gateway.automaticCandidatePolicy(
    [],
    message({
      from: 'Google Calendar <calendar-notification@google.com>',
      autoSubmitted: 'auto-generated',
      mimeType: 'text/calendar'
    })
  );
  assert.strictEqual(
    sandbox.WorkOsConfig
      .AUTOMATION_CALENDAR_NOTIFICATION_FILTER_APPROVED,
    false
  );
  assert.strictEqual(result.reason, 'NORMAL_INBOX');
});

test('R-GMAIL-07_NORMAL_INBOX_IS_INCLUDED_INDEPENDENT_OF_READ_STATE', () => {
  ['UNREAD', 'READ'].forEach((state) => {
    const result = Gateway.automaticCandidatePolicy(
      [],
      message({ labels: ['INBOX', state, 'CATEGORY_UPDATES'] })
    );
    assert.strictEqual(result.process, true);
    assert.strictEqual(result.reason, 'NORMAL_INBOX');
  });
});

test('R-GMAIL-08_CALL_METER_STOPS_BEFORE_LIMIT_PLUS_ONE', () => {
  const meter = Gateway.createCallMeter(2);
  assert.strictEqual(meter.consume('SYNTHETIC_GMAIL'), 1);
  assert.strictEqual(meter.consume('SYNTHETIC_GMAIL'), 2);
  assert.strictEqual(meter.exhausted(), true);
  assert.throws(
    () => meter.consume('SYNTHETIC_GMAIL'),
    (error) => error.code === 'E_GMAIL_CALL_BUDGET'
  );
  assert.strictEqual(meter.count(), 2);
});

test('R-GMAIL-09_POLICY_OUTPUT_CONTAINS_NO_MESSAGE_CONTENT', () => {
  const result = Gateway.automaticCandidatePolicy([], message());
  const serialized = JSON.stringify(result);
  ['subject', 'body', 'sender', 'credential', 'token'].forEach((key) => {
    assert.strictEqual(serialized.toLowerCase().includes(key), false);
  });
});

test('R-GMAIL-10_SOURCE_PRIORITIZES_MANUAL_IMPORT_BEFORE_TIME', () => {
  const source = fs.readFileSync(
    path.join(sourceRoot, '05_GmailGateway.gs'),
    'utf8'
  );
  const priorityIndex = source.indexOf('priorityDifference');
  const timeIndex = source.indexOf('timeDifference', priorityIndex);
  assert.ok(priorityIndex !== -1);
  assert.ok(timeIndex > priorityIndex);
  assert.ok(source.includes('read_state_used: false'));
});

test('R-GMAIL-11_REFETCH_RECHECKS_BUDGET_BEFORE_MESSAGE_BODY', () => {
  let budgetChecks = 0;
  let metadataCalls = 0;
  let bodyCalls = 0;
  const threadId = 'synthetic-budget-thread';
  const messageId = 'synthetic-budget-message';
  sandbox.Gmail.Users.Threads.get = () => {
    metadataCalls += 1;
    return {
      id: threadId,
      messages: [{
        id: messageId,
        internalDate: '1784952000000',
        labelIds: ['INBOX'],
        payload: {
          mimeType: 'text/plain',
          headers: [
            { name: 'From', value: 'fixture@example.invalid' },
            { name: 'Subject', value: 'Synthetic budget fixture' }
          ],
          body: { data: '' }
        }
      }]
    };
  };
  sandbox.Gmail.Users.Messages.get = () => {
    bodyCalls += 1;
    throw new Error('message body call must not occur');
  };
  assert.throws(
    () => Gateway.refetchMessageContent({
      message_id: messageId,
      thread_id: threadId,
      stable_thread_key: Gateway.makeStableThreadKey(messageId, threadId)
    }, {
      call_meter: Gateway.createCallMeter(10),
      budget: {
        isExhausted() {
          budgetChecks += 1;
          return budgetChecks >= 2;
        }
      },
      reserve_ms: 1000
    }),
    (error) => error.code === 'E_BUDGET_EXHAUSTED'
  );
  assert.strictEqual(metadataCalls, 1);
  assert.strictEqual(bodyCalls, 0);
  assert.strictEqual(budgetChecks, 2);
});

const failed = results.filter((item) => item.status === 'FAIL');
console.log(JSON.stringify({
  suite: 'remediation_gmail_policy',
  environment: 'LOCAL_FAKE_APPS_SCRIPT',
  real_gmail: 'NOT_EXECUTED',
  passed: results.length - failed.length,
  failed: failed.length,
  tests: results
}, null, 2));
if (failed.length) {
  process.exitCode = 1;
}

