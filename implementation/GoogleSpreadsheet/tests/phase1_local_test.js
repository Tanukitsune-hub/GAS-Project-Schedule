'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repositoryRoot = path.resolve(__dirname, '..');
const appsScriptRoot = path.join(repositoryRoot, 'apps-script-v2');

class FakeRange {
  constructor(sheet, row, column, rowCount, columnCount) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.rowCount = rowCount || 1;
    this.columnCount = columnCount || 1;
  }

  getValues() {
    const output = [];
    for (let rowOffset = 0; rowOffset < this.rowCount; rowOffset += 1) {
      const row = [];
      for (let columnOffset = 0; columnOffset < this.columnCount; columnOffset += 1) {
        row.push(this.sheet.cells[this.row - 1 + rowOffset][this.column - 1 + columnOffset]);
      }
      output.push(row);
    }
    return output;
  }

  setValues(values) {
    assert.strictEqual(values.length, this.rowCount);
    values.forEach((row, rowOffset) => {
      assert.strictEqual(row.length, this.columnCount);
      row.forEach((value, columnOffset) => {
        this.sheet.cells[this.row - 1 + rowOffset][this.column - 1 + columnOffset] = value;
      });
    });
    this.sheet.writeCount += 1;
    return this;
  }
}

class FakeSheet {
  constructor(rows, columns) {
    this.maxRows = rows;
    this.maxColumns = columns;
    this.writeCount = 0;
    this.insertedRows = 0;
    this.cells = Array.from(
      { length: rows },
      () => Array.from({ length: columns }, () => '')
    );
  }

  getRange(row, column, rowCount, columnCount) {
    return new FakeRange(this, row, column, rowCount, columnCount);
  }

  getMaxRows() {
    return this.maxRows;
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
    computeDigest: (_algorithm, value) => Array.from(
      crypto.createHash('sha256').update(String(value), 'utf8').digest()
    ).map((byte) => (byte > 127 ? byte - 256 : byte)),
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    Charset: { UTF_8: 'UTF_8' }
  },
  SpreadsheetApp: {
    getActiveSpreadsheet: () => null
  },
  LockService: {
    getScriptLock: () => ({
      tryLock: () => true,
      releaseLock: () => {}
    })
  }
};
vm.createContext(sandbox);

[
  '00_Config.gs',
  '01_TypesAndSchemas.gs',
  '17_Utilities.gs',
  '14_Migrations.gs',
  '08_TaskRepository.gs',
  '02_Setup.gs'
].forEach((fileName) => {
  const source = fs.readFileSync(path.join(appsScriptRoot, fileName), 'utf8');
  vm.runInContext(source, sandbox, { filename: fileName });
});

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
      message: error.message
    });
  }
}

test('P1-L01_SCHEMA_DEFINITIONS', () => {
  const validation = sandbox.WorkOsSchemas.validateSchemaDefinitions();
  assert.strictEqual(validation.ok, true, validation.errors.join('; '));
  assert.strictEqual(
      sandbox.WorkOsSchemas.getSheetSchema(sandbox.WorkOsConfig.SHEETS.TASKS).length,
      47
  );
});

test('P1-L02_DUPLICATE_COLUMN_ID', () => {
  assert.throws(
    () => sandbox.WorkOsSchemas.buildColumnMapFromIds(['task_id', 'task_id']),
    /E_SCHEMA_DUPLICATE_COLUMN_ID/
  );
});

test('P1-L03_ENUM_ROUND_TRIP', () => {
  assert.strictEqual(
    sandbox.WorkOsSchemas.toSheetEnum('TaskStatus', 'OPEN'),
    '未対応'
  );
  assert.strictEqual(
    sandbox.WorkOsSchemas.toInternalEnum('TaskStatus', '未対応'),
    'OPEN'
  );
  assert.throws(
    () => sandbox.WorkOsSchemas.toInternalEnum('TaskStatus', ' 未対応 ' + 'x'),
    /E_INVALID_ENUM/
  );
});

test('P1-L04_ORIGIN_KEY_CONTRACT', () => {
  const expected = 'org_' + crypto
    .createHash('sha256')
    .update('v2|synthetic-message-001|0')
    .digest('hex')
    .slice(0, 32);
  assert.strictEqual(
    sandbox.WorkOsUtilities.makeOriginKey('synthetic-message-001', 0),
    expected
  );
});

test('P1-L05_LOGICAL_EMPTY_ROW', () => {
  assert.strictEqual(
    sandbox.WorkOsTaskRepository.findLogicalEmptyRow(
      [['tsk_a'], [''], ['']],
      [['org_a'], ['org_b'], ['']],
      3
    ),
    5
  );
});

test('P1-L06_FALSE_ONLY_ROW_NOT_TASK', () => {
  const schema = sandbox.WorkOsSchemas.getSheetSchema(sandbox.WorkOsConfig.SHEETS.TASKS);
  const ids = schema.map((column) => column.id);
  const map = sandbox.WorkOsSchemas.buildColumnMapFromIds(ids);
  const row = Array.from({ length: schema.length }, () => '');
  row[map.needs_review] = false;
  row[map.completed] = false;
  row[map.excluded] = false;
  row[map.waiting_for_reply] = false;
  const context = sandbox.WorkOsTaskRepository.buildContextFromValues(
    new FakeSheet(100, schema.length),
    map,
    [row]
  );
  assert.strictEqual(context.logicalRows.length, 0);
});

test('P1-L07_IDEMPOTENT_UPSERT_AND_TYPED_READ', () => {
  const schema = sandbox.WorkOsSchemas.getSheetSchema(sandbox.WorkOsConfig.SHEETS.TASKS);
  const ids = schema.map((column) => column.id);
  const sheet = new FakeSheet(100, schema.length);
  sheet.getRange(1, 1, 1, schema.length).setValues([ids]);
  const context = sandbox.WorkOsTaskRepository.createContext(sheet);
  const task = {
    origin_key: 'org_00000000000000000000000000000001',
    task_title: '架空タスク',
    status: 'OPEN',
    priority: 'MEDIUM',
    needs_review: false,
    completed: false,
    excluded: false,
    waiting_for_reply: false,
    source_action_index: 0,
    ai_confidence: 0.9
  };
  const inserted = sandbox.WorkOsTaskRepository.upsertTask(task, { sheet });
  const second = sandbox.WorkOsTaskRepository.upsertTask(task, { sheet });
  const after = sandbox.WorkOsTaskRepository.createContext(sheet);
  assert.strictEqual(inserted.operation, 'INSERT');
  assert.strictEqual(inserted.row, 3);
  assert.strictEqual(second.operation, 'NOOP');
  assert.strictEqual(after.logicalRows.length, 1);
  const read = sandbox.WorkOsTaskRepository.findByOriginKey(after, task.origin_key);
  assert.strictEqual(read.status, 'OPEN');
  assert.strictEqual(read.priority, 'MEDIUM');
  assert.strictEqual(read.row_version, 1);
  assert.strictEqual(read.needs_review, false);
});

test('P1-L08_LIMITED_EXISTING_UPDATE', () => {
  const schema = sandbox.WorkOsSchemas.getSheetSchema(sandbox.WorkOsConfig.SHEETS.TASKS);
  const ids = schema.map((column) => column.id);
  const sheet = new FakeSheet(100, schema.length);
  sheet.getRange(1, 1, 1, schema.length).setValues([ids]);
  const context = sandbox.WorkOsTaskRepository.createContext(sheet);
  const base = {
    origin_key: 'org_00000000000000000000000000000002',
    task_title: '変更前',
    status: 'OPEN',
    ai_confidence: 0.5
  };
  sandbox.WorkOsTaskRepository.upsertTask(base, { sheet });
  const update = sandbox.WorkOsTaskRepository.upsertTask({
    origin_key: base.origin_key,
    task_title: '変更前',
    status: 'OPEN',
    ai_confidence: 0.9
  }, { sheet });
  assert.deepStrictEqual(
    Array.from(update.changed_fields).sort(),
    ['ai_confidence', 'row_version', 'updated_at'].sort()
  );
  const after = sandbox.WorkOsTaskRepository.createContext(sheet);
  const read = sandbox.WorkOsTaskRepository.findByOriginKey(after, base.origin_key);
  assert.strictEqual(read.task_title, '変更前');
  assert.strictEqual(read.ai_confidence, 0.9);
  assert.strictEqual(read.row_version, 2);
});

test('P1-L09_ROW_EXPANSION_BY_100', () => {
  const sheet = new FakeSheet(100, 44);
  assert.strictEqual(
    sandbox.WorkOsTaskRepository.calculateRowsToAppend(100, 101),
    100
  );
  sandbox.WorkOsTaskRepository.ensureCapacityForRow(sheet, 201);
  assert.strictEqual(sheet.insertedRows, 200);
  assert.strictEqual(sheet.getMaxRows(), 300);
});

test('P1-L10_ENVIRONMENT_SAFETY', () => {
  const empty = sandbox.WorkOsSetup.classifyEnvironmentDescriptors([
    { name: 'シート1', isEmpty: true, firstRow: [''], secondRow: [''] }
  ]);
  assert.strictEqual(empty.allowed, true);
  assert.strictEqual(empty.kind, 'NEW_EMPTY');

  const unknown = sandbox.WorkOsSetup.classifyEnvironmentDescriptors([
    { name: '既存業務', isEmpty: false, firstRow: ['data'], secondRow: [] }
  ]);
  assert.strictEqual(unknown.allowed, false);
  assert.strictEqual(unknown.code, 'E_SETUP_NOT_EMPTY');

  const v1 = sandbox.WorkOsSetup.classifyEnvironmentDescriptors([
    { name: 'Review Queue', isEmpty: false, firstRow: ['v1.4'], secondRow: [] }
  ]);
  assert.strictEqual(v1.allowed, false);
  assert.strictEqual(v1.code, 'E_V1_DETECTED');
});

test('P1-L11_VALIDATION_PLAN', () => {
  const plan = sandbox.WorkOsSchemas.validationPlanForSheet(
    sandbox.WorkOsConfig.SHEETS.TASKS
  );
  const checkboxIds = plan
    .filter((item) => item.validation === 'CHECKBOX')
    .map((item) => item.id);
    assert.deepStrictEqual(
      Array.from(checkboxIds),
      [
        'needs_review',
        'completed',
        'excluded',
        'waiting_for_reply',
        'calendar_reconcile_required'
      ]
    );
  assert.strictEqual(
    plan.find((item) => item.id === 'comment').validation,
    null
  );
});

test('P1-L12_VERSION_SEPARATION', () => {
  const versions = sandbox.WorkOsMigrations.getVersionState();
  assert.deepStrictEqual(
    Object.keys(versions).sort(),
    ['code_version', 'migration_version', 'schema_version'].sort()
  );
  assert.notStrictEqual(versions.code_version, versions.schema_version);
});

test('P1-L13_REDACTION', () => {
  const unsafe = 'Bearer abc.def token=hidden API_KEY=also-hidden password=secret';
  const safe = sandbox.WorkOsUtilities.redact(unsafe);
  ['abc.def', 'hidden', 'also-hidden', 'secret'].forEach((secret) => {
    assert.strictEqual(safe.includes(secret), false);
  });
});

test('P1-L14_STATIC_GUARDRAILS', () => {
  const sources = fs.readdirSync(appsScriptRoot)
    .filter((fileName) => fileName.endsWith('.gs'))
    .map((fileName) => fs.readFileSync(path.join(appsScriptRoot, fileName), 'utf8'))
    .join('\n');
  assert.strictEqual(/\bgetLastRow\s*\(/.test(sources), false);
  assert.strictEqual(/\.setValue\s*\(\s*false\s*\)/i.test(sources), false);
  assert.strictEqual(/\b(?:GmailApp|CalendarApp|UrlFetchApp)\b/.test(sources), false);
  const phase6 = Number(
    String(sandbox.WorkOsConfig.CODE_VERSION).split('.')[1]
  ) >= 6;
  if (phase6) {
    const triggerSource = fs.readFileSync(
      path.join(appsScriptRoot, '12_Triggers.gs'),
      'utf8'
    );
    const setupSource = fs.readFileSync(
      path.join(appsScriptRoot, '02_Setup.gs'),
      'utf8'
    );
    assert.strictEqual(
      (triggerSource.match(/\bnewTrigger\s*\(/g) || []).length,
      2
    );
    assert.strictEqual(/\bnewTrigger\s*\(/.test(setupSource), false);
  } else {
    assert.strictEqual(/\bnewTrigger\s*\(/.test(sources), false);
  }
  const diagnostics = fs.readFileSync(
    path.join(appsScriptRoot, '16_Diagnostics.gs'),
    'utf8'
  );
  assert.strictEqual(/\.(?:setValue|setValues|clear|insert|delete|append|protect)\s*\(/.test(diagnostics), false);
});

test('P1-L15_MANIFEST_MINIMAL_SCOPES', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(appsScriptRoot, 'appsscript.json'), 'utf8')
  );
  const phase4 = Number(
    String(sandbox.WorkOsConfig.CODE_VERSION).split('.')[1]
  ) >= 4;
  const phase6 = Number(
    String(sandbox.WorkOsConfig.CODE_VERSION).split('.')[1]
  ) >= 6;
  const expectedScopes = [
    'https://www.googleapis.com/auth/script.container.ui',
    'https://www.googleapis.com/auth/spreadsheets.currentonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/gmail.modify'
  ];
  if (phase4) {
    expectedScopes.push(
      'https://www.googleapis.com/auth/calendar.app.created',
      'https://www.googleapis.com/auth/calendar.calendarlist.readonly'
    );
  }
  if (phase6) {
    expectedScopes.push(
      'https://www.googleapis.com/auth/script.scriptapp'
    );
  }
  assert.deepStrictEqual(
    Array.from(manifest.oauthScopes).sort(),
    expectedScopes.sort()
  );
  [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/script.external_request',
    'https://www.googleapis.com/auth/drive',
    'https://mail.google.com/'
  ].forEach((forbiddenScope) => {
    assert.strictEqual(manifest.oauthScopes.includes(forbiddenScope), false);
  });
  if (!phase6) {
    assert.strictEqual(
      manifest.oauthScopes.includes(
        'https://www.googleapis.com/auth/script.scriptapp'
      ),
      false
    );
  }
});

const summary = {
  phase: 1,
  passed: tests.filter((item) => item.status === 'PASS').length,
  failed: tests.filter((item) => item.status === 'FAIL').length,
  tests
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (summary.failed > 0) {
  process.exitCode = 1;
}
