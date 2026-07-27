'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repositoryRoot = path.resolve(__dirname, '..');
const appsScriptRoot = path.join(repositoryRoot, 'apps-script-v2');

class FakeRange {
  constructor(sheet, row, column, rowCount = 1, columnCount = 1) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.rowCount = rowCount;
    this.columnCount = columnCount;
    if (
      row < 1 ||
      column < 1 ||
      row + rowCount - 1 > sheet.maxRows ||
      column + columnCount - 1 > sheet.maxColumns
    ) {
      throw new Error('RANGE_OUT_OF_BOUNDS');
    }
  }

  getValues() {
    return Array.from({ length: this.rowCount }, (_, rowOffset) =>
      Array.from(
        { length: this.columnCount },
        (_, columnOffset) =>
          this.sheet.cells[this.row - 1 + rowOffset][
            this.column - 1 + columnOffset
          ]
      )
    );
  }

  setValues(values) {
    assert.strictEqual(values.length, this.rowCount);
    values.forEach((row, rowOffset) => {
      assert.strictEqual(row.length, this.columnCount);
      row.forEach((value, columnOffset) => {
        this.sheet.cells[this.row - 1 + rowOffset][
          this.column - 1 + columnOffset
        ] = value;
      });
    });
    this.sheet.writeLog.push({
      row: this.row,
      column: this.column,
      rowCount: this.rowCount,
      columnCount: this.columnCount
    });
    return this;
  }
}

class FakeSheet {
  constructor(name, rows, columns) {
    this.name = name;
    this.maxRows = rows;
    this.maxColumns = columns;
    this.insertedRows = 0;
    this.writeLog = [];
    this.cells = Array.from({ length: rows }, () =>
      Array.from({ length: columns }, () => '')
    );
  }

  getName() {
    return this.name;
  }

  getRange(row, column, rowCount, columnCount) {
    return new FakeRange(this, row, column, rowCount, columnCount);
  }

  getMaxRows() {
    return this.maxRows;
  }

  getMaxColumns() {
    return this.maxColumns;
  }

  insertRowsAfter(after, count) {
    assert.strictEqual(after, this.maxRows);
    for (let index = 0; index < count; index += 1) {
      this.cells.push(Array.from({ length: this.maxColumns }, () => ''));
    }
    this.maxRows += count;
    this.insertedRows += count;
  }
}

class FakeSpreadsheet {
  constructor(sheets) {
    this.sheets = sheets;
  }

  getSheetByName(name) {
    return this.sheets.find((sheet) => sheet.getName() === name) || null;
  }

  getSheets() {
    return this.sheets.slice();
  }
}

let activeSpreadsheet = null;
let lockAvailable = true;
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
    base64DecodeWebSafe: (value) =>
      Array.from(Buffer.from(String(value), 'base64url')).map((byte) =>
        byte > 127 ? byte - 256 : byte
      ),
    newBlob: (bytes) => ({
      getDataAsString: () =>
        Buffer.from(
          Array.from(bytes, (byte) => (byte < 0 ? byte + 256 : byte))
        ).toString('utf8')
    }),
    formatDate: (date, timezone) => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(date);
      const index = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      return `${index.year}-${index.month}-${index.day}`;
    }
  },
  SpreadsheetApp: {
    getActiveSpreadsheet: () => activeSpreadsheet
  },
  LockService: {
    getScriptLock: () => ({
      tryLock: () => lockAvailable,
      hasLock: () => lockAvailable,
      releaseLock: () => {}
    })
  },
  Gmail: {
    Users: {
      Labels: {},
      Threads: {},
      Messages: {}
    }
  }
};
vm.createContext(sandbox);

[
  '00_Config.gs',
  '01_TypesAndSchemas.gs',
  '17_Utilities.gs',
  '04_MessageStateRepository.gs',
  '05_GmailGateway.gs',
  '06_EmailPreprocessor.gs',
  '13_LogAndDeadLetter.gs',
  '18_Worker.gs'
].forEach((fileName) => {
  const source = fs.readFileSync(path.join(appsScriptRoot, fileName), 'utf8');
  vm.runInContext(source, sandbox, { filename: fileName });
});

function makeSchemaSheet(sheetName, rows = 100) {
  const schema = sandbox.WorkOsSchemas.getSheetSchema(sheetName);
  const sheet = new FakeSheet(sheetName, rows, schema.length);
  sheet.getRange(1, 1, 1, schema.length).setValues([
    schema.map((column) => column.id)
  ]);
  sheet.getRange(2, 1, 1, schema.length).setValues([
    schema.map((column) => column.header)
  ]);
  sheet.writeLog = [];
  return sheet;
}

function makeOperationalSpreadsheet() {
  return new FakeSpreadsheet([
    makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE),
    makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.RUN_HISTORY),
    makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.ERRORS)
  ]);
}

function metadata(id, overrides = {}) {
  return {
    message_id: id,
    thread_id: overrides.thread_id || `synthetic-thread-${id}`,
    stable_thread_key:
      overrides.stable_thread_key || `root:synthetic-root-${id}`,
    received_at:
      overrides.received_at || new Date('2026-07-24T00:00:00.000Z'),
    source_mode: 'MANUAL',
    ...overrides
  };
}

function base64Url(value) {
  return Buffer.from(String(value), 'utf8').toString('base64url');
}

function installGmailFake(options = {}) {
  const labels = (options.labels || []).map((label) => ({ ...label }));
  const threads = options.threads || {};
  const messages = options.messages || {};
  const calls = {
    labelList: 0,
    labelCreate: [],
    threadList: [],
    threadGet: [],
    messageGet: []
  };
  let createFailureName = options.createFailureName || '';
  sandbox.Gmail.Users.Labels.list = () => {
    calls.labelList += 1;
    return { labels: labels.map((label) => ({ ...label })) };
  };
  sandbox.Gmail.Users.Labels.create = (resource) => {
    calls.labelCreate.push(resource.name);
    if (resource.name === createFailureName) {
      createFailureName = '';
      throw new Error('synthetic label failure');
    }
    const created = {
      id: `LBL_${labels.length + 1}`,
      name: resource.name
    };
    labels.push(created);
    return { ...created };
  };
  sandbox.Gmail.Users.Threads.list = (_user, request) => {
    calls.threadList.push({ ...request });
    return {
      threads: Object.keys(threads).map((id) => ({ id }))
    };
  };
  sandbox.Gmail.Users.Threads.get = (_user, id) => {
    calls.threadGet.push(id);
    return threads[id];
  };
  sandbox.Gmail.Users.Messages.get = (_user, id) => {
    calls.messageGet.push(id);
    return messages[id];
  };
  return { labels, calls };
}

function allFormalLabels() {
  return sandbox.WorkOsConfig.GMAIL_LABELS.map((name, index) => ({
    id: `FORMAL_${index}`,
    name
  }));
}

const tests = [];
function test(id, body) {
  const startedAt = Date.now();
  try {
    body();
    tests.push({ id, status: 'PASS', duration_ms: Date.now() - startedAt });
  } catch (error) {
    tests.push({
      id,
      status: 'FAIL',
      duration_ms: Date.now() - startedAt,
      safe_message: sandbox.WorkOsUtilities.redact(error.message)
    });
  } finally {
    lockAvailable = true;
    activeSpreadsheet = null;
  }
}

test('P2-L01_LITERAL_MESSAGE_STATE_SCHEMA', () => {
  assert.deepStrictEqual(
    Array.from(
      sandbox.WorkOsSchemas.getInternalIds(
        sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE
      )
    ),
    [
      'message_id', 'thread_id', 'stable_thread_key', 'received_at',
      'discovered_at', 'source_mode', 'processing_status', 'resume_stage',
      'claimed_at', 'claim_run_id', 'preprocess_hash',
      'classification_json', 'classification_hash', 'action_count',
      'retry_count', 'next_retry_at', 'completed_at', 'last_error_code',
      'last_error_at', 'schema_version', 'updated_at',
      'classification_provenance_json'
    ]
  );
});

test('P2-L02_FORMAL_LABEL_ENSURE_IS_IDEMPOTENT', () => {
  const fake = installGmailFake({
    labels: [
      { id: 'OLD', name: '譌ｧ/繝ｩ繝吶Ν' },
      { id: 'MANUAL', name: '謇句虚/蜿冶ｾｼ' }
    ]
  });
  const first = sandbox.WorkOsGmailGateway.ensureFormalLabels();
  const second = sandbox.WorkOsGmailGateway.ensureFormalLabels();
  assert.strictEqual(first.created_count, 6);
  assert.strictEqual(second.created_count, 0);
  assert.strictEqual(fake.labels.filter((label) => label.name === '譌ｧ/繝ｩ繝吶Ν').length, 1);
  assert.deepStrictEqual(
    fake.labels
      .filter((label) => sandbox.WorkOsConfig.GMAIL_LABELS.includes(label.name))
      .map((label) => label.name)
      .sort(),
    Array.from(sandbox.WorkOsConfig.GMAIL_LABELS).sort()
  );
});

test('P2-L03_PARTIAL_LABEL_FAILURE_RESUMES_WITHOUT_DUPLICATES', () => {
  const fake = installGmailFake({
    labels: [],
    createFailureName: 'AI/隕∫｢ｺ隱・
  });
  assert.throws(
    () => sandbox.WorkOsGmailGateway.ensureFormalLabels(),
    (error) => error.code === 'E_GMAIL_LABEL_CREATE'
  );
  const resumed = sandbox.WorkOsGmailGateway.ensureFormalLabels();
  assert.strictEqual(resumed.created_count > 0, true);
  sandbox.WorkOsConfig.GMAIL_LABELS.forEach((name) => {
    assert.strictEqual(fake.labels.filter((label) => label.name === name).length, 1);
  });
});

test('P2-L04_MANUAL_QUERY_BOUNDS_AND_READ_STATE_INDEPENDENCE', () => {
  const labels = allFormalLabels();
  const importId = labels.find((label) => label.name === '謇句虚/蜿冶ｾｼ').id;
  const threads = {};
  for (let index = 0; index < 11; index += 1) {
    threads[`thread-${index}`] = {
      id: `thread-${index}`,
      messages: [
        {
          id: `root-${index}`,
          internalDate: String(1000 + index),
          labelIds: [importId],
          payload: { headers: [] }
        },
        {
          id: `latest-${index}`,
          internalDate: String(2000 + index),
          labelIds: index % 2 ? [importId, 'UNREAD'] : [importId],
          payload: { headers: [] }
        }
      ]
    };
  }
  const fake = installGmailFake({ labels, threads });
  const candidates = sandbox.WorkOsGmailGateway.listManualCandidates();
  assert.strictEqual(candidates.length, 10);
  assert.strictEqual(candidates.every((item) => item.manual_decision === 'PROCESS'), true);
  assert.strictEqual(candidates.every((item) => item.message_refs.length <= 3), true);
  assert.deepStrictEqual(fake.calls.threadList[0], {
    q: 'label:謇句虚/蜿冶ｾｼ -label:謇句虚/髯､螟・,
    maxResults: 10,
    includeSpamTrash: false
  });
});

test('P2-L05_MANUAL_EXCLUDE_AND_SPAM_WIN', () => {
  assert.strictEqual(
    sandbox.WorkOsGmailGateway.decideManualLabelAction([
      '謇句虚/蜿冶ｾｼ',
      '謇句虚/髯､螟・
    ]),
    'SKIP'
  );
  const labels = allFormalLabels();
  const importId = labels.find((label) => label.name === '謇句虚/蜿冶ｾｼ').id;
  const fake = installGmailFake({
    labels,
    threads: {
      spam: {
        id: 'spam',
        messages: [{
          id: 'spam-message',
          internalDate: '1',
          labelIds: [importId, 'SPAM'],
          payload: { headers: [] }
        }]
      }
    }
  });
  assert.strictEqual(sandbox.WorkOsGmailGateway.listManualCandidates().length, 0);
  assert.strictEqual(fake.calls.threadGet.length, 1);
});

test('P2-L05A_THREAD_LEVEL_MANUAL_EXCLUDE_WINS', () => {
  const labels = allFormalLabels();
  const importId = labels.find((label) => label.name === '謇句虚/蜿冶ｾｼ').id;
  const excludeId = labels.find((label) => label.name === '謇句虚/髯､螟・).id;
  installGmailFake({
    labels,
    threads: {
      'thread-manual-exclude': {
        id: 'thread-manual-exclude',
        messages: [
          {
            id: 'message-older-excluded',
            internalDate: '1000',
            labelIds: [excludeId],
            payload: { headers: [] }
          },
          {
            id: 'message-latest-import',
            internalDate: '2000',
            labelIds: [importId],
            payload: { headers: [] }
          }
        ]
      }
    }
  });
  const candidates = sandbox.WorkOsGmailGateway.listManualCandidates();
  assert.strictEqual(candidates.length, 1);
  assert.strictEqual(candidates[0].manual_decision, 'SKIP');
  assert.strictEqual(candidates[0].message_id, 'message-latest-import');
});

test('P2-L05B_MISSING_FORMAL_LABELS_FAIL_WITHOUT_REPAIR', () => {
  const fake = installGmailFake({ labels: [], threads: {} });
  assert.throws(
    () => sandbox.WorkOsGmailGateway.listManualCandidates(),
    (error) => error.code === 'E_GMAIL_LABEL_MISSING'
  );
  assert.strictEqual(fake.calls.labelCreate.length, 0);
});

test('P2-L06_STABLE_THREAD_KEY', () => {
  assert.strictEqual(
    sandbox.WorkOsGmailGateway.makeStableThreadKey('first-message', 'thread-a'),
    'root:first-message'
  );
  assert.strictEqual(
    sandbox.WorkOsGmailGateway.makeStableThreadKey('', 'thread-a'),
    'thread:thread-a'
  );
});

test('P2-L06A_THREAD_MESSAGE_ORDER_IS_NORMALIZED', () => {
  const labels = allFormalLabels();
  const importId = labels.find((label) => label.name === '謇句虚/蜿冶ｾｼ').id;
  installGmailFake({
    labels,
    threads: {
      'thread-shuffled': {
        id: 'thread-shuffled',
        messages: [
          {
            id: 'message-latest',
            internalDate: '3000',
            labelIds: [importId],
            payload: { headers: [] }
          },
          {
            id: 'message-root',
            internalDate: '1000',
            labelIds: [],
            payload: { headers: [] }
          },
          {
            id: 'message-middle',
            internalDate: '2000',
            labelIds: [],
            payload: { headers: [] }
          }
        ]
      }
    }
  });
  const candidates = sandbox.WorkOsGmailGateway.listManualCandidates();
  assert.strictEqual(candidates.length, 1);
  assert.strictEqual(candidates[0].message_id, 'message-latest');
  assert.strictEqual(
    candidates[0].stable_thread_key,
    'root:message-root'
  );
  assert.deepStrictEqual(
    Array.from(candidates[0].message_refs, (item) => item.id),
    ['message-root', 'message-middle', 'message-latest']
  );
});

test('P2-A01_MANUAL_IMPORT_SELECTS_EXACT_LABELED_MESSAGE_ONLY', () => {
  const labels = allFormalLabels();
  const importId = labels.find((label) => label.name === '謇句虚/蜿冶ｾｼ').id;
  installGmailFake({
    labels,
    threads: {
      'thread-exact-older': {
        id: 'thread-exact-older',
        messages: [
          {
            id: 'message-root',
            internalDate: '1000',
            labelIds: [],
            payload: { headers: [] }
          },
          {
            id: 'message-explicitly-selected',
            internalDate: '2000',
            labelIds: [importId],
            payload: { headers: [] }
          },
          {
            id: 'message-later-unselected',
            internalDate: '3000',
            labelIds: [],
            payload: { headers: [] }
          }
        ]
      }
    }
  });
  const candidates = sandbox.WorkOsGmailGateway.listManualCandidates();
  assert.strictEqual(candidates.length, 1);
  assert.strictEqual(
    candidates[0].message_id,
    'message-explicitly-selected'
  );
  assert.deepStrictEqual(
    Array.from(candidates[0].message_refs, (item) => item.id),
    ['message-root', 'message-explicitly-selected']
  );
  assert.strictEqual(
    candidates[0].message_refs.some((item) =>
      item.id === 'message-later-unselected'
    ),
    false
  );
});

test('P2-A02_MANUAL_IMPORT_USES_LATEST_AMONG_LABELED_MESSAGES', () => {
  const labels = allFormalLabels();
  const importId = labels.find((label) => label.name === '謇句虚/蜿冶ｾｼ').id;
  installGmailFake({
    labels,
    threads: {
      'thread-multiple-import': {
        id: 'thread-multiple-import',
        messages: [
          {
            id: 'message-import-first',
            internalDate: '1000',
            labelIds: [importId],
            payload: { headers: [] }
          },
          {
            id: 'message-middle',
            internalDate: '2000',
            labelIds: [],
            payload: { headers: [] }
          },
          {
            id: 'message-import-second',
            internalDate: '3000',
            labelIds: [importId],
            payload: { headers: [] }
          },
          {
            id: 'message-after-selection',
            internalDate: '4000',
            labelIds: [],
            payload: { headers: [] }
          }
        ]
      }
    }
  });
  const candidates = sandbox.WorkOsGmailGateway.listManualCandidates();
  assert.strictEqual(candidates.length, 1);
  assert.strictEqual(candidates[0].message_id, 'message-import-second');
  assert.deepStrictEqual(
    Array.from(candidates[0].message_refs, (item) => item.id),
    ['message-import-first', 'message-middle', 'message-import-second']
  );
});

test('P2-A03_THREAD_WITHOUT_EXACT_IMPORT_LABEL_FAILS_CLOSED', () => {
  const labels = allFormalLabels();
  installGmailFake({
    labels,
    threads: {
      'thread-no-exact-import': {
        id: 'thread-no-exact-import',
        messages: [{
          id: 'message-unlabeled',
          internalDate: '1000',
          labelIds: [],
          payload: { headers: [] }
        }]
      }
    }
  });
  assert.strictEqual(
    sandbox.WorkOsGmailGateway.listManualCandidates().length,
    0
  );
});

test('P2-L07_SELECTED_BODY_FETCH_IS_BOUNDED_AND_SKIPS_ATTACHMENTS', () => {
  const messages = {};
  ['previous-a', 'previous-b', 'target'].forEach((id, index) => {
    messages[id] = {
      id,
      internalDate: String(1000 + index),
      payload: {
        headers: [
          { name: 'Subject', value: 'Synthetic subject' },
          { name: 'From', value: 'noreply@example.invalid' }
        ],
        parts: [
          {
            mimeType: 'text/plain',
            filename: '',
            body: { data: base64Url(`safe body ${id}`), size: 20 }
          },
          {
            mimeType: 'application/octet-stream',
            filename: 'secret.bin',
            body: {
              attachmentId: 'attachment-id',
              data: base64Url('ATTACHMENT_SECRET'),
              size: 99
            }
          }
        ]
      }
    };
  });
  const fake = installGmailFake({
    labels: allFormalLabels(),
    messages
  });
  const output = sandbox.WorkOsGmailGateway.fetchSelectedContent({
    message_id: 'target',
    thread_id: 'thread-body',
    stable_thread_key: 'root:previous-a',
    message_refs: [
      { id: 'previous-a', internal_date: 1000 },
      { id: 'previous-b', internal_date: 1001 },
      { id: 'target', internal_date: 1002 }
    ]
  });
  assert.strictEqual(fake.calls.messageGet.length, 3);
  assert.strictEqual(JSON.stringify(output).includes('ATTACHMENT_SECRET'), false);
  assert.strictEqual(output.previous_messages.length, 2);
});

test('P2-L08_PREPROCESS_BOUNDARIES_UNICODE_AND_HASH', () => {
  const makeInput = (body) => ({
    message_id: 'synthetic-message-preprocess',
    thread_id: 'synthetic-thread-preprocess',
    stable_thread_key: 'root:synthetic-root-preprocess',
    subject: 'Synthetic subject',
    sender: 'noreply@example.invalid',
    received_at: new Date('2026-07-24T00:00:00.000Z'),
    plain_body: body,
    previous_messages: []
  });
  [19999, 20000].forEach((count) => {
    const output = sandbox.WorkOsEmailPreprocessor.preprocess(
      makeInput('・'.repeat(count)),
      { today: '2026-07-24', timezone: 'Asia/Tokyo', active_tasks: [] }
    );
    assert.strictEqual(output.metadata.truncated, false);
    assert.strictEqual(Array.from(output.body).length, count);
  });
  const long = sandbox.WorkOsEmailPreprocessor.preprocess(
    makeInput('・'.repeat(20001)),
    { today: '2026-07-24', timezone: 'Asia/Tokyo', active_tasks: [] }
  );
  const replay = sandbox.WorkOsEmailPreprocessor.preprocess(
    makeInput('・'.repeat(20001)),
    { today: '2026-07-25', timezone: 'Asia/Tokyo', active_tasks: [] }
  );
  assert.strictEqual(Array.from(long.body).length, 20000);
  assert.strictEqual(long.metadata.truncated, true);
  assert.strictEqual(long.warnings.includes('BODY_TRUNCATED'), true);
  assert.strictEqual(long.content_hash, replay.content_hash);
  assert.match(long.content_hash, /^[0-9a-f]{64}$/);
});

test('P2-L09_MESSAGE_CLAIM_IDEMPOTENCY_AND_THREAD_MESSAGES', () => {
  const sheet = makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE);
  sandbox.WorkOsMessageStateRepository.withLockedContext(sheet, (context) => {
    const first = sandbox.WorkOsMessageStateRepository.claimInContext(
      metadata('message-a', {
        thread_id: 'shared-thread',
        stable_thread_key: 'root:shared-root'
      }),
      'run-a',
      context,
      new Date('2026-07-24T00:01:00.000Z')
    );
    assert.strictEqual(first.claimed, true);
    const active = sandbox.WorkOsMessageStateRepository.claimInContext(
      metadata('message-a', {
        thread_id: 'shared-thread',
        stable_thread_key: 'root:shared-root'
      }),
      'run-b',
      context,
      new Date('2026-07-24T00:02:00.000Z')
    );
    assert.strictEqual(active.claimed, false);
    assert.strictEqual(active.reason, 'ACTIVE_CLAIM');
    const secondMessage = sandbox.WorkOsMessageStateRepository.claimInContext(
      metadata('message-b', {
        thread_id: 'shared-thread',
        stable_thread_key: 'root:shared-root'
      }),
      'run-b',
      context,
      new Date('2026-07-24T00:02:00.000Z')
    );
    assert.strictEqual(secondMessage.claimed, true);
    assert.strictEqual(context.logicalRows.length, 2);
  });
});

test('P2-L10_STALE_CLAIM_BOUNDARY_AND_RECLAIM', () => {
  const exactNow = new Date('2026-07-24T01:00:00.000Z');
  assert.strictEqual(
    sandbox.WorkOsMessageStateRepository.isStaleClaim(
      {
        processing_status: 'CLAIMED',
        claimed_at: new Date('2026-07-24T00:30:00.000Z')
      },
      exactNow
    ),
    false
  );
  assert.strictEqual(
    sandbox.WorkOsMessageStateRepository.isStaleClaim(
      {
        processing_status: 'CLAIMED',
        claimed_at: new Date('2026-07-24T00:29:59.999Z')
      },
      exactNow
    ),
    true
  );
});

test('P2-L11_THREE_RETRY_DELAYS_THEN_DEAD_NEVER_DONE', () => {
  const sheet = makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE);
  sandbox.WorkOsMessageStateRepository.withLockedContext(sheet, (context) => {
    let now = new Date('2026-07-24T00:00:00.000Z');
    const expectedRetryAt = [
      '2026-07-24T00:05:00.000Z',
      '2026-07-24T00:20:00.001Z',
      '2026-07-24T01:20:00.002Z'
    ];
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const claim = sandbox.WorkOsMessageStateRepository.claimInContext(
        metadata('message-retry'),
        `run-retry-${attempt}`,
        context,
        now
      );
      assert.strictEqual(claim.claimed, true);
      const failure = sandbox.WorkOsMessageStateRepository.recordFailureInContext(
        'message-retry',
        `run-retry-${attempt}`,
        new sandbox.WorkOsAppError(
          'E_GMAIL_FETCH',
          'PREPROCESS',
          true,
          'Synthetic safe error'
        ),
        context,
        now
      );
      assert.notStrictEqual(failure.record.processing_status, 'DONE');
      if (attempt <= 3) {
        assert.strictEqual(failure.record.processing_status, 'RETRY');
        assert.strictEqual(
          failure.record.next_retry_at.toISOString(),
          expectedRetryAt[attempt - 1]
        );
        now = new Date(failure.record.next_retry_at.getTime() + 1);
      } else {
        assert.strictEqual(failure.record.processing_status, 'DEAD');
        assert.strictEqual(failure.record.retry_count, 3);
        assert.strictEqual(
          failure.record.completed_at instanceof sandbox.Date,
          true
        );
      }
    }
  });
});

test('P2-L11B_NON_RETRYABLE_FAILURE_IS_IMMEDIATELY_DEAD', () => {
  const sheet = makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE);
  sandbox.WorkOsMessageStateRepository.withLockedContext(sheet, (context) => {
    const now = new Date('2026-07-24T00:00:00.000Z');
    sandbox.WorkOsMessageStateRepository.claimInContext(
      metadata('message-non-retryable'),
      'run-non-retryable',
      context,
      now
    );
    const failure =
      sandbox.WorkOsMessageStateRepository.recordFailureInContext(
        'message-non-retryable',
        'run-non-retryable',
        new sandbox.WorkOsAppError(
          'E_INVALID_ENUM',
          'PREPROCESS',
          false,
          'Synthetic non-retryable error'
        ),
        context,
        now
      );
    assert.strictEqual(failure.record.processing_status, 'DEAD');
    assert.strictEqual(failure.record.next_retry_at, '');
    assert.strictEqual(
      failure.record.completed_at instanceof sandbox.Date,
      true
    );
  });
});

test('P2-L11C_MANUAL_EXCLUDE_STOPS_PREPROCESSED_CHECKPOINT', () => {
  const sheet = makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE);
  sandbox.WorkOsMessageStateRepository.withLockedContext(sheet, (context) => {
    const now = new Date('2026-07-24T00:00:00.000Z');
    const item = metadata('message-excluded-after-preprocess', {
      manual_decision: 'SKIP'
    });
    sandbox.WorkOsMessageStateRepository.claimInContext(
      item,
      'run-preprocess',
      context,
      now
    );
    sandbox.WorkOsMessageStateRepository.checkpointPreprocessedInContext(
      item.message_id,
      'run-preprocess',
      'a'.repeat(64),
      context,
      now
    );
    const skipped = sandbox.WorkOsMessageStateRepository.markSkippedInContext(
      item,
      'run-exclude',
      context,
      new Date(now.getTime() + 1000)
    );
    assert.strictEqual(skipped.operation, 'UPDATED');
    assert.strictEqual(skipped.record.processing_status, 'SKIPPED');
    assert.strictEqual(skipped.record.resume_stage, 'SKIPPED');
    assert.strictEqual(
      skipped.record.completed_at instanceof sandbox.Date,
      true
    );
  });
});

test('P2-L12_DUPLICATE_AND_CORRUPT_STATE_STOP', () => {
  const sheet = makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE);
  sandbox.WorkOsMessageStateRepository.withLockedContext(sheet, (context) => {
    sandbox.WorkOsMessageStateRepository.discoverInContext(
      metadata('message-duplicate'),
      context,
      new Date('2026-07-24T00:00:00.000Z')
    );
  });
  const firstRow = sheet.getRange(
    sandbox.WorkOsConfig.DATA_START_ROW,
    1,
    1,
    sheet.getMaxColumns()
  ).getValues()[0];
  sheet.getRange(4, 1, 1, sheet.getMaxColumns()).setValues([firstRow]);
  assert.throws(
    () => sandbox.WorkOsMessageStateRepository.createContext(sheet),
    (error) => error.code === 'E_MESSAGE_STATE_DUPLICATE'
  );
  sheet.cells[3][0] = '';
  const map = sandbox.WorkOsSchemas.buildColumnMapFromIds(
    sandbox.WorkOsSchemas.getInternalIds(
      sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE
    )
  );
  sheet.cells[2][map.processing_status] = '';
  assert.throws(
    () => sandbox.WorkOsMessageStateRepository.createContext(sheet),
    (error) => error.code === 'E_INVALID_ENUM'
  );
});

test('P2-L13_LOGICAL_ROW_EXPANSION_IS_100', () => {
  const sheet = makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE);
  sandbox.WorkOsMessageStateRepository.withLockedContext(sheet, (context) => {
    for (let index = 0; index < 99; index += 1) {
      sandbox.WorkOsMessageStateRepository.discoverInContext(
        metadata(`message-capacity-${index}`),
        context,
        new Date('2026-07-24T00:00:00.000Z')
      );
    }
  });
  assert.strictEqual(sheet.insertedRows, 100);
  assert.strictEqual(sheet.getMaxRows(), 200);
});

test('P2-L14_LOCK_IS_REQUIRED_AND_CONTENTION_STOPS', () => {
  const sheet = makeSchemaSheet(sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE);
  const unlocked = sandbox.WorkOsMessageStateRepository.createContext(sheet);
  assert.throws(
    () =>
      sandbox.WorkOsMessageStateRepository.discoverInContext(
        metadata('message-unlocked'),
        unlocked,
        new Date('2026-07-24T00:00:00.000Z')
      ),
    (error) => error.code === 'E_LOCK_REQUIRED'
  );
  lockAvailable = false;
  assert.throws(
    () =>
      sandbox.WorkOsMessageStateRepository.withLockedContext(sheet, () => {}),
    (error) => error.code === 'E_LOCK_TIMEOUT'
  );
});

test('P2-L15_WORKER_SUCCESS_IS_IDEMPOTENT_AND_PERSISTS_NO_BODY', () => {
  activeSpreadsheet = makeOperationalSpreadsheet();
  const candidate = metadata('message-worker', {
    manual_decision: 'PROCESS',
    message_refs: [{ id: 'message-worker', internal_date: 1 }]
  });
  const gateway = {
    listManualCandidates: () => [candidate],
    fetchSelectedContent: () => ({
      ...candidate,
      subject: 'PRIVATE SUBJECT',
      sender: 'private.sender@example.invalid',
      plain_body: 'PRIVATE BODY MUST STAY IN MEMORY',
      previous_messages: []
    })
  };
  let tick = 0;
  const now = () => new Date(1753315200000 + tick++ * 1000);
  const budget = { isExhausted: () => false };
  const first = sandbox.WorkOsWorker.processManualImportOnce({
    spreadsheet: activeSpreadsheet,
    gateway,
    now,
    budget
  });
  const second = sandbox.WorkOsWorker.processManualImportOnce({
    spreadsheet: activeSpreadsheet,
    gateway,
    now,
    budget
  });
  assert.strictEqual(first.processed_count, 1);
  assert.strictEqual(first.checkpoint, 'PREPROCESSED');
  assert.strictEqual(second.processed_count, 0);
  const stateSheet = activeSpreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE
  );
  const stateText = JSON.stringify(stateSheet.cells);
  assert.strictEqual(stateText.includes('PRIVATE BODY'), false);
  assert.strictEqual(stateText.includes('PRIVATE SUBJECT'), false);
  assert.strictEqual(stateText.includes('private.sender'), false);
  const context = sandbox.WorkOsMessageStateRepository.createContext(stateSheet);
  assert.strictEqual(context.logicalRows.length, 1);
  assert.strictEqual(context.logicalRows[0].processing_status, 'PREPROCESSED');
  assert.strictEqual(context.logicalRows[0].resume_stage, 'CLASSIFY');
});

test('P2-L15B_WORKER_EXCLUDE_STOPS_AFTER_ONE_NEW_MESSAGE', () => {
  activeSpreadsheet = makeOperationalSpreadsheet();
  const candidates = ['exclude-a', 'exclude-b'].map((id) =>
    metadata(id, { manual_decision: 'SKIP' })
  );
  const result = sandbox.WorkOsWorker.processManualImportOnce({
    spreadsheet: activeSpreadsheet,
    gateway: {
      listManualCandidates: () => candidates,
      fetchSelectedContent: () => {
        throw new Error('excluded message must not fetch content');
      }
    },
    now: () => new Date('2026-07-24T00:00:00.000Z'),
    budget: { isExhausted: () => false }
  });
  assert.strictEqual(result.processed_count, 0);
  assert.strictEqual(result.skipped_count, 1);
  const context = sandbox.WorkOsMessageStateRepository.createContext(
    activeSpreadsheet.getSheetByName(
      sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE
    )
  );
  assert.strictEqual(context.logicalRows.length, 1);
  assert.strictEqual(context.logicalRows[0].processing_status, 'SKIPPED');
});

test('P2-L16_WORKER_BUDGET_BEFORE_AND_AFTER_CLAIM', () => {
  const candidate = metadata('message-budget', {
    manual_decision: 'PROCESS',
    message_refs: [{ id: 'message-budget', internal_date: 1 }]
  });
  let searchCalls = 0;
  const gateway = {
    listManualCandidates: () => {
      searchCalls += 1;
      return [candidate];
    },
    fetchSelectedContent: () => {
      throw new Error('must not fetch after exhausted claim');
    }
  };
  activeSpreadsheet = makeOperationalSpreadsheet();
  let result = sandbox.WorkOsWorker.processManualImportOnce({
    spreadsheet: activeSpreadsheet,
    gateway,
    now: () => new Date('2026-07-24T00:00:00.000Z'),
    budget: { isExhausted: () => true }
  });
  assert.strictEqual(result.status, 'PAUSED');
  assert.strictEqual(searchCalls, 0);

  activeSpreadsheet = makeOperationalSpreadsheet();
  let checks = 0;
  result = sandbox.WorkOsWorker.processManualImportOnce({
    spreadsheet: activeSpreadsheet,
    gateway,
    now: () => new Date('2026-07-24T00:00:00.000Z'),
    budget: {
      isExhausted: () => {
        checks += 1;
        return checks >= 3;
      }
    }
  });
  assert.strictEqual(result.status, 'PAUSED');
  const state = sandbox.WorkOsMessageStateRepository.createContext(
    activeSpreadsheet.getSheetByName(
      sandbox.WorkOsConfig.SHEETS.MESSAGE_STATE
    )
  ).logicalRows[0];
  assert.strictEqual(state.processing_status, 'DISCOVERED');
  assert.strictEqual(state.resume_stage, 'PREPROCESS');
  assert.strictEqual(state.retry_count, 0);
  assert.strictEqual(state.last_error_code, '');
  assert.strictEqual(state.claim_run_id, '');
});

test('P2-L16B_GATEWAY_STOPS_THREAD_EXPANSION_AT_BUDGET', () => {
  const labels = allFormalLabels();
  const importId = labels.find((label) => label.name === '謇句虚/蜿冶ｾｼ').id;
  const threads = {};
  for (let index = 0; index < 10; index += 1) {
    threads[`budget-thread-${index}`] = {
      id: `budget-thread-${index}`,
      messages: [{
        id: `budget-message-${index}`,
        internalDate: String(1000 + index),
        labelIds: [importId],
        payload: { headers: [] }
      }]
    };
  }
  const fake = installGmailFake({ labels, threads });
  assert.throws(
    () => sandbox.WorkOsGmailGateway.listManualCandidates({
      budget: { isExhausted: () => true },
      reserve_ms: 1000
    }),
    (error) =>
      error.code === 'E_BUDGET_EXHAUSTED' &&
      error.retryable === true
  );
  assert.strictEqual(fake.calls.threadGet.length, 0);
});

test('P2-L17_LOG_ALLOWLIST_REJECTS_BODY_AND_CREDENTIAL_TEXT', () => {
  activeSpreadsheet = makeOperationalSpreadsheet();
  sandbox.WorkOsLogAndDeadLetter.recordMessageError(
    new Error('PRIVATE BODY password=secret-value token=token-value'),
    {
      message_id: 'synthetic-message-error',
      thread_id: 'synthetic-thread-error',
      retry_count: 1
    },
    'run-synthetic-error',
    activeSpreadsheet
  );
  const text = JSON.stringify(
    activeSpreadsheet.getSheetByName(
      sandbox.WorkOsConfig.SHEETS.ERRORS
    ).cells
  );
  ['PRIVATE BODY', 'secret-value', 'token-value', 'password='].forEach(
    (secret) => assert.strictEqual(text.includes(secret), false)
  );
  assert.strictEqual(text.includes('synthetic-message-error'), false);
  assert.strictEqual(text.includes('synthetic-thread-error'), false);
  assert.strictEqual(text.includes('msgref_'), true);
  assert.strictEqual(text.includes('thrref_'), true);
});

test('P2-L17A_ERROR_STATUS_FOLLOWS_RETRY_OR_DEAD_STATE', () => {
  activeSpreadsheet = makeOperationalSpreadsheet();
  sandbox.WorkOsLogAndDeadLetter.recordMessageError(
    new sandbox.WorkOsAppError(
      'E_GMAIL_FETCH',
      'PREPROCESS',
      true,
      'Synthetic retryable error'
    ),
    {
      message_id: 'synthetic-message-third-retry',
      thread_id: 'synthetic-thread-third-retry',
      retry_count: 3,
      processing_status: 'RETRY',
      next_retry_at: new Date('2026-07-24T01:00:00.000Z')
    },
    'run-synthetic-third-retry',
    activeSpreadsheet
  );
  sandbox.WorkOsLogAndDeadLetter.recordMessageError(
    new sandbox.WorkOsAppError(
      'E_INVALID_ENUM',
      'PREPROCESS',
      false,
      'Synthetic non-retryable error'
    ),
    {
      message_id: 'synthetic-message-dead',
      thread_id: 'synthetic-thread-dead',
      retry_count: 1,
      processing_status: 'DEAD'
    },
    'run-synthetic-dead',
    activeSpreadsheet
  );
  const sheet = activeSpreadsheet.getSheetByName(
    sandbox.WorkOsConfig.SHEETS.ERRORS
  );
  const ids = sandbox.WorkOsSchemas.getInternalIds(
    sandbox.WorkOsConfig.SHEETS.ERRORS
  );
  const map = sandbox.WorkOsSchemas.buildColumnMapFromIds(ids);
  assert.strictEqual(
    sheet.cells[sandbox.WorkOsConfig.DATA_START_ROW - 1][map.status],
    'OPEN'
  );
  assert.strictEqual(
    sheet.cells[sandbox.WorkOsConfig.DATA_START_ROW][map.status],
    'DEAD'
  );
});

test('P2-L17B_RUN_SUMMARY_REQUIRES_SCRIPT_LOCK', () => {
  activeSpreadsheet = makeOperationalSpreadsheet();
  lockAvailable = false;
  try {
    assert.throws(
      () => sandbox.WorkOsLogAndDeadLetter.appendRunSummary(
        {
          run_id: 'synthetic-run-lock',
          started_at: new Date('2026-07-24T00:00:00.000Z'),
          finished_at: new Date('2026-07-24T00:00:01.000Z')
        },
        activeSpreadsheet
      ),
      (error) => error.code === 'E_LOCK_TIMEOUT'
    );
  } finally {
    lockAvailable = true;
    activeSpreadsheet = null;
  }
});

test('P2-L18_MANIFEST_AND_STATIC_PHASE_BOUNDARIES', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(appsScriptRoot, 'appsscript.json'), 'utf8')
  );
  const phase4 = Number(
    String(sandbox.WorkOsConfig.CODE_VERSION).split('.')[1]
  ) >= 4;
  const phase6 = Number(
    String(sandbox.WorkOsConfig.CODE_VERSION).split('.')[1]
  ) >= 6;
  const gmailScopes = String(sandbox.WorkOsConfig.CODE_VERSION)
    .startsWith('2.3.') || phase4
    ? ['https://www.googleapis.com/auth/gmail.modify']
    : [
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/gmail.readonly'
    ];
  assert.deepStrictEqual(
    Array.from(manifest.oauthScopes).sort(),
    [
      ...gmailScopes,
      ...(phase4
        ? [
          'https://www.googleapis.com/auth/calendar.app.created',
          'https://www.googleapis.com/auth/calendar.calendarlist.readonly'
        ]
        : []),
      ...(phase6
        ? ['https://www.googleapis.com/auth/script.scriptapp']
        : []),
      'https://www.googleapis.com/auth/script.container.ui',
      'https://www.googleapis.com/auth/spreadsheets.currentonly',
      'https://www.googleapis.com/auth/userinfo.email'
    ].sort()
  );
  const expectedServices = [{
    userSymbol: 'Gmail',
    version: 'v1',
    serviceId: 'gmail'
  }];
  if (phase4) {
    expectedServices.push({
      userSymbol: 'Calendar',
      version: 'v3',
      serviceId: 'calendar'
    });
  }
  assert.deepStrictEqual(
    manifest.dependencies.enabledAdvancedServices,
    expectedServices
  );
  const sources = fs.readdirSync(appsScriptRoot)
    .filter((fileName) =>
      fileName.endsWith('.gs') && fileName !== '99_TestHarness.gs'
    )
    .map((fileName) =>
      fs.readFileSync(path.join(appsScriptRoot, fileName), 'utf8')
    )
    .join('\n');
  const prohibitedPatterns = [
    /\bGmailApp\b/,
    /\bis:unread\b/i,
    /\bUrlFetchApp\b/,
    /\bCalendarApp\b/,
    /\.getAttachments?\s*\(/
  ];
  if (!phase6) {
    prohibitedPatterns.push(/\bin:inbox\b/i, /\bnewTrigger\s*\(/);
  } else {
    const setupSource = fs.readFileSync(
      path.join(appsScriptRoot, '02_Setup.gs'),
      'utf8'
    );
    assert.strictEqual(/\bnewTrigger\s*\(/.test(setupSource), false);
  }
  if (!phase4) {
    prohibitedPatterns.push(/Calendar\.Events/);
  }
  prohibitedPatterns.forEach(
    (pattern) => assert.strictEqual(pattern.test(sources), false)
  );
  assert.strictEqual(/\bgetLastRow\s*\(/.test(sources), false);
});

const summary = {
  phase: 2,
  suite: 'production_code_local',
  passed: tests.filter((item) => item.status === 'PASS').length,
  failed: tests.filter((item) => item.status === 'FAIL').length,
  tests
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed > 0) {
  process.exitCode = 1;
}

