'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const app = path.join(root, 'apps-script-v2');
const results = [];

function source(name) {
  return fs.readFileSync(path.join(app, name), 'utf8');
}

function test(name, fn) {
  try {
    fn();
    results.push({ name, status: 'PASS' });
  } catch (error) {
    results.push({
      name,
      status: 'FAIL',
      safe_message: String(error && error.message || error).slice(0, 240)
    });
  }
}

const runtimeContext = {
  console,
  WorkOsAppError: class WorkOsAppError extends Error {
    constructor(code, stage, retryable, message) {
      super(message);
      this.code = code;
      this.stage = stage;
      this.retryable = retryable;
    }
  }
};
vm.createContext(runtimeContext);
vm.runInContext(source('00_Config.gs'), runtimeContext);
vm.runInContext(source('01_TypesAndSchemas.gs'), runtimeContext);
runtimeContext.WorkOsUtilities = {
  createSoftBudget: () => ({ isExhausted: () => false }),
  safeError: (error) => ({ code: error.code || 'E_UNKNOWN' })
};
vm.runInContext(source('19_RuntimeSettings.gs'), runtimeContext);

function settingsSpreadsheet(overrides = {}) {
  const Config = runtimeContext.WorkOsConfig;
  const Schemas = runtimeContext.WorkOsSchemas;
  const ids = Schemas.getInternalIds(Config.SHEETS.SETTINGS);
  const map = Schemas.buildColumnMapFromIds(ids);
  const rows = runtimeContext.WorkOsRuntimeSettings.CONTRACT.map((item) => {
    const row = Array(ids.length).fill('');
    row[map.setting_key] = item.key;
    row[map.display_name] = `Synthetic ${item.key}`;
    row[map.value] = Object.prototype.hasOwnProperty.call(overrides, item.key)
      ? overrides[item.key]
      : item.default_value;
    row[map.value_type] = item.value_type;
    row[map.allowed_values] = '';
    row[map.description] = 'Synthetic setting';
    row[map.editable] = item.editable;
    row[map.updated_at] = new Date('2026-07-25T00:00:00Z');
    return row;
  });
  let dataReadCount = 0;
  const sheet = {
    getMaxRows: () => rows.length + 2,
    getRange(row, column, count, width) {
      return {
        getValues() {
          if (row === 1) {
            return [ids.slice(column - 1, column - 1 + width)];
          }
          dataReadCount += 1;
          return rows.slice(
            row - 3,
            row - 3 + count
          ).map((item) => item.slice(column - 1, column - 1 + width));
        }
      };
    }
  };
  return {
    getSheetByName: () => sheet,
    dataReadCount: () => dataReadCount
  };
}

test('R-RUNTIME-01_TYPED_SNAPSHOT_READS_SETTINGS_DATA_ONCE', () => {
  const spreadsheet = settingsSpreadsheet({
    auto_max_messages: 1,
    manual_soft_limit_sec: 60,
    auto_soft_limit_sec: 120
  });
  const snapshot =
    runtimeContext.WorkOsRuntimeSettings.readSnapshot(spreadsheet);
  assert.strictEqual(snapshot.automation_max_messages_per_run, 1);
  assert.strictEqual(snapshot.manual_worker_soft_limit_ms, 60000);
  assert.strictEqual(snapshot.automation_worker_soft_limit_ms, 120000);
  assert.strictEqual(spreadsheet.dataReadCount(), 1);
});

test('R-RUNTIME-02_EDITABLE_RANGE_TAMPER_FAILS_CLOSED', () => {
  const spreadsheet = settingsSpreadsheet({ auto_max_messages: 11 });
  assert.throws(
    () => runtimeContext.WorkOsRuntimeSettings.readSnapshot(spreadsheet),
    (error) => error && error.code === 'E_RUNTIME_SETTING_RANGE'
  );
});

test('R-RUNTIME-03_FIXED_SETTING_TAMPER_FAILS_CLOSED', () => {
  const spreadsheet = settingsSpreadsheet({ manual_max_messages: 2 });
  assert.throws(
    () => runtimeContext.WorkOsRuntimeSettings.readSnapshot(spreadsheet),
    (error) => error && error.code === 'E_RUNTIME_SETTING_FIXED'
  );
});

test('R-RUNTIME-04_EXHAUSTED_PREFLIGHT_FAILS_BEFORE_SHEET_READ', () => {
  let sheetRead = false;
  const result = runtimeContext.WorkOsRuntimeSettings.collectCurrentPreflight(
    {
      getSheetByName() {
        sheetRead = true;
        throw new Error('preflight must not read after exhaustion');
      }
    },
    { budget: { isExhausted: () => true } }
  );
  assert.strictEqual(result.ready, false);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(result.reasons)),
    ['PREFLIGHT_BUDGET_EXHAUSTED']
  );
  assert.strictEqual(result.external_services_called, false);
  assert.strictEqual(sheetRead, false);
});

test('R-RUNTIME-05_MID_SCAN_BUDGET_EXHAUSTION_FAILS_CLOSED', () => {
  const spreadsheet = settingsSpreadsheet();
  let checks = 0;
  const result = runtimeContext.WorkOsRuntimeSettings.collectCurrentPreflight(
    spreadsheet,
    {
      budget: {
        isExhausted() {
          checks += 1;
          return checks >= 2;
        }
      }
    }
  );
  assert.strictEqual(result.ready, false);
  assert.strictEqual(
    result.reasons.includes('PREFLIGHT_BUDGET_EXHAUSTED'),
    true
  );
  assert.strictEqual(result.external_services_called, false);
  assert.strictEqual(spreadsheet.dataReadCount(), 1);
});

const taskIds = [
  'task_id', 'origin_key', 'status', 'completed', 'excluded',
  'needs_review', 'review_state', 'due_date', 'waiting_for_reply'
];
const historyIds = [
  'run_id', 'started_at', 'finished_at', 'processed_count', 'run_status'
];
const errorIds = ['error_id', 'status'];
const outboxIds = ['sync_id', 'status'];
const schemaIds = {
  'タスク一覧': taskIds,
  '処理履歴': historyIds,
  'エラー・再実行': errorIds,
  '同期状態': outboxIds,
  'ダッシュボード': ['metric_key', 'metric_value', 'note']
};
const dashboardContext = {
  console,
  Date,
  WorkOsConfig: {
    TIMEZONE: 'Asia/Tokyo',
    HEADER_ID_ROW: 1,
    HEADER_LABEL_ROW: 2,
    DATA_START_ROW: 3,
    ROW_EXPANSION_UNIT: 100,
    LOCK_WAIT_MS: 5000,
    TEST_MODE: true,
    SHEETS: {
      DASHBOARD: 'ダッシュボード',
      TASKS: 'タスク一覧',
      RUN_HISTORY: '処理履歴',
      ERRORS: 'エラー・再実行',
      SYNC_STATE: '同期状態'
    }
  },
  WorkOsEnums: {
    TaskStatus: {
      REVIEW: '要確認',
      WAITING: '返信待ち',
      DONE: '完了',
      EXCLUDED: '対象外',
      CANCELLED: '取消'
    },
    ReviewState: { OPEN: '未確認' }
  },
  WorkOsSchemas: {
    getInternalIds: (name) => schemaIds[name],
    getSheetSchema: (name) => schemaIds[name].map((id) => ({ id })),
    buildColumnMapFromIds(ids) {
      return Object.fromEntries(ids.map((id, index) => [id, index]));
    }
  },
  WorkOsUtilities: {
    now: () => new Date('2026-07-25T03:00:00Z'),
    redact: (value) => String(value),
    sha256Hex: (value) => require('crypto')
      .createHash('sha256')
      .update(String(value))
      .digest('hex'),
    withScriptLock: (callback) => callback(),
    createSoftBudget: () => ({ isExhausted: () => false })
  },
  Utilities: {
    formatDate(value, timezone, format) {
      const iso = new Date(value).toISOString();
      return format === 'yyyy-MM-dd'
        ? iso.slice(0, 10)
        : iso.replace('T', ' ').slice(0, 19).replace(/-/g, '/');
    }
  },
  WorkOsAppError: class WorkOsAppError extends Error {},
  WorkOsRuntimeSettings: {
    summarizeHealth: () => ({ status: 'ACTION_REQUIRED', note: 'Gate pending' })
  },
  SpreadsheetApp: {
    ProtectionType: { RANGE: 'RANGE', SHEET: 'SHEET' }
  },
  Session: {
    getEffectiveUser: () => ({
      getEmail: () => 'synthetic.owner@example.invalid'
    })
  }
};
vm.createContext(dashboardContext);
vm.runInContext(source('15_Dashboard.gs'), dashboardContext);

function matrix(ids, rows) {
  return [ids, ids.map((id) => `見出し:${id}`), ...rows];
}

test('R-DASH-01_AGGREGATES_OPERATIONAL_COUNTS_WITHOUT_CONTENT', () => {
  const taskRows = [
    ['t1', 'o1', '要確認', false, false, true, '未確認',
      '2026-07-25', true],
    ['t2', 'o2', '未対応', false, false, false, 'なし',
      '2026-07-24', false],
    ['t3', 'o3', '完了', true, false, false, 'なし',
      '2026-07-27', false],
    ['t4', 'o4', '未対応', false, false, false, 'なし',
      '2026-07-30', false]
  ];
  const historyRows = [
    ['r1', '2026-07-25T01:00:00Z', '2026-07-25T01:01:00Z', 3,
      'COMPLETE'],
    ['r2', '2026-07-24T01:00:00Z', '2026-07-24T01:01:00Z', 1,
      'FAILED']
  ];
  const errorRows = [
    ['e1', 'OPEN'],
    ['e2', 'DEAD'],
    ['e3', 'RETRY_QUEUED']
  ];
  const outboxRows = [
    ['s1', 'PENDING'],
    ['s2', 'RETRY'],
    ['s3', 'DEAD']
  ];
  const metrics = dashboardContext.WorkOsDashboard
    .collectOperationalMetrics(null, {
      now: new Date('2026-07-25T03:00:00Z'),
      task_matrix: matrix(taskIds, taskRows),
      history_matrix: matrix(historyIds, historyRows),
      error_matrix: matrix(errorIds, errorRows),
      outbox_matrix: matrix(outboxIds, outboxRows)
    });
  assert.strictEqual(metrics.processed_today, 3);
  assert.strictEqual(metrics.review_open, 1);
  assert.strictEqual(metrics.overdue, 1);
  assert.strictEqual(metrics.due_today, 1);
  assert.strictEqual(metrics.due_next_7_days, 1);
  assert.strictEqual(metrics.waiting_reply, 1);
  assert.strictEqual(metrics.retry_waiting, 3);
  assert.strictEqual(metrics.dead_letter, 2);
  assert.strictEqual(metrics.calendar_pending, 2);
  assert.strictEqual(metrics.unresolved_errors, 3);
  assert(!JSON.stringify(metrics).includes('subject'));
  assert(!JSON.stringify(metrics).includes('message_id'));
});

test('R-DASH-02_REQUIRED_METRIC_SET_IS_COMPLETE', () => {
  assert.strictEqual(dashboardContext.WorkOsDashboard.METRIC_ORDER.length, 17);
  [
    'AUTOMATION_STATUS',
    'OVERDUE',
    'DEAD_LETTER',
    'SYSTEM_HEALTH',
    'QUICK_DIAGNOSTIC'
  ].forEach((key) => {
    assert(dashboardContext.WorkOsDashboard.METRIC_ORDER.includes(key));
  });
});

test('R-DASH-03_REFRESH_IS_EXPLICIT_AND_NOT_CALLED_BY_WORKER', () => {
  assert(source('Menu.gs').includes('refreshOperationalDashboard'));
  assert(!source('18_Worker.gs').includes('WorkOsDashboard'));
  assert(!source('16_Diagnostics.gs').includes('WorkOsDashboard.refresh'));
});

test('R-DASH-04_100_1000_10000_ROWS_REMAIN_LINEAR_AND_ACCURATE', () => {
  [100, 1000, 10000].forEach((count) => {
    const rows = Array.from({ length: count }, (_, index) => [
      `t${index}`,
      `o${index}`,
      '未対応',
      false,
      false,
      false,
      'なし',
      index % 2 ? '2026-07-25' : '2026-07-30',
      false
    ]);
    const metrics = dashboardContext.WorkOsDashboard
      .collectOperationalMetrics(null, {
        now: new Date('2026-07-25T03:00:00Z'),
        task_matrix: matrix(taskIds, rows),
        history_matrix: matrix(historyIds, []),
        error_matrix: matrix(errorIds, []),
        outbox_matrix: matrix(outboxIds, [])
      });
    assert.strictEqual(
      metrics.due_today + metrics.due_next_7_days,
      count
    );
  });
});

test('R-DASH-05_BUDGET_EXHAUSTION_STOPS_BEFORE_SOURCE_READ', () => {
  let sourceRead = false;
  const spreadsheet = {
    getSheetByName: () => ({
      getDataRange() {
        sourceRead = true;
        throw new Error('must not read');
      }
    })
  };
  assert.throws(
    () => dashboardContext.WorkOsDashboard.collectOperationalMetrics(
      spreadsheet,
      { budget: { isExhausted: () => true } }
    ),
    /E_DASHBOARD_BUDGET/
  );
  assert.strictEqual(sourceRead, false);
});

test('R-DASH-06_KEYED_UPSERT_IS_IDEMPOTENT_AND_PRESERVES_CUSTOM_ROW', () => {
  const cells = [
    ['metric_key', 'metric_value', 'note'],
    ['項目', '値', '注記'],
    ['CUSTOM', 'keep', 'user row'],
    ['', '', '']
  ];
  let writes = 0;
  const writtenRows = [];
  const formulaCells = Array.from(
    { length: 100 },
    () => ['', '', '']
  );
  const noteCells = Array.from(
    { length: 100 },
    () => ['', '', '']
  );
  let customFormula = '=ROW()';
  const owner = {
    getEmail: () => 'synthetic.owner@example.invalid'
  };
  function canonicalProtection(description, range = null) {
    return {
      getDescription: () => description,
      getRange: () => range,
      getRangeName: () => null,
      isWarningOnly: () => false,
      canDomainEdit: () => false,
      canEdit: () => true,
      getTargetAudiences: () => [],
      getEditors: () => [owner],
      getUnprotectedRanges: () => []
    };
  }
  let headerProtection = null;
  const sheetProtection = canonicalProtection(
    `WORK_OS_V2_PHASE1_${
      dashboardContext.WorkOsConfig.SHEETS.DASHBOARD
    }_SYSTEM_OWNED_EDIT_POLICY`
  );
  const sheet = {
    getDataRange: () => ({ getValues: () => structuredClone(cells) }),
    getMaxRows: () => 100,
    getMaxColumns: () => 3,
    getProtections: (type) => type ===
      dashboardContext.SpreadsheetApp.ProtectionType.SHEET
      ? [sheetProtection]
      : [headerProtection],
    isRowHiddenByUser: () => false,
    isRowHiddenByFilter: () => false,
    isColumnHiddenByUser: () => false,
    getRange(row, column, rowCount, columnCount) {
      return {
        getRow: () => row,
        getColumn: () => column,
        getNumRows: () => rowCount,
        getNumColumns: () => columnCount,
        getValues() {
          return Array.from({ length: rowCount }, (_, rowOffset) =>
            Array.from({ length: columnCount }, (_, columnOffset) =>
              cells[row - 1 + rowOffset] &&
                cells[row - 1 + rowOffset][column - 1 + columnOffset] || ''
            )
          );
        },
        getFormulas() {
          return Array.from({ length: rowCount }, (_, rowOffset) =>
            formulaCells[row - 1 + rowOffset]
              .slice(column - 1, column - 1 + columnCount)
          );
        },
        getNotes() {
          return Array.from({ length: rowCount }, (_, rowOffset) =>
            noteCells[row - 1 + rowOffset]
              .slice(column - 1, column - 1 + columnCount)
          );
        },
        getDataValidations: () =>
          Array.from(
            { length: rowCount },
            () => Array(columnCount).fill(null)
          ),
        getBackgrounds: () =>
          Array.from(
            { length: rowCount },
            () => Array(columnCount).fill('#ffffff')
          ),
        getFontWeights: () =>
          Array.from(
            { length: rowCount },
            () => Array(columnCount).fill('normal')
          ),
        getFontStyles: () =>
          Array.from(
            { length: rowCount },
            () => Array(columnCount).fill('normal')
          ),
        getNumberFormats: () =>
          Array.from(
            { length: rowCount },
            () => Array(columnCount).fill('@')
          ),
        getMergedRanges: () => [],
        setValues(values) {
          writes += 1;
          writtenRows.push({
            row,
            rowCount,
            column,
            columnCount
          });
          values.forEach((sourceRow, rowIndex) => {
            const target = row - 1 + rowIndex;
            if (target === 2 &&
                column <= 2 &&
                column + columnCount - 1 >= 2) {
              customFormula = '';
            }
            while (cells.length <= target) {
              cells.push(['', '', '']);
            }
            for (let col = 0; col < columnCount; col += 1) {
              cells[target][column - 1 + col] = sourceRow[col];
            }
          });
        },
        setNotes(values) {
          values.forEach((sourceRow, rowIndex) => {
            sourceRow.forEach((value, columnIndex) => {
              noteCells[row - 1 + rowIndex][column - 1 + columnIndex] =
                value;
            });
          });
        }
      };
    },
    insertRowsAfter: () => {}
  };
  headerProtection = canonicalProtection(
    `WORK_OS_V2_PHASE1_${
      dashboardContext.WorkOsConfig.SHEETS.DASHBOARD
    }_HEADER_IDS`,
    sheet.getRange(1, 1, 2, 3)
  );
  const spreadsheet = {
    getSheetByName: () => sheet,
    getOwner: () => owner,
    getNamedRanges: () => []
  };
  const desired = dashboardContext.WorkOsDashboard.METRIC_ORDER.map(
    (key) => [key, 'HEALTHY', 'safe aggregate']
  );
  dashboardContext.WorkOsDashboard.upsertMetricRows(spreadsheet, desired);
  const afterFirst = structuredClone(cells);
  dashboardContext.WorkOsDashboard.upsertMetricRows(spreadsheet, desired);
  assert.deepStrictEqual(cells, afterFirst);
  assert.strictEqual(cells[2][0], 'CUSTOM');
  assert.strictEqual(cells[2][1], 'keep');
  assert.strictEqual(writes, 2);
  assert.strictEqual(writtenRows.every((entry) => entry.row === 4), true);
  assert.strictEqual(customFormula, '=ROW()');
});

test('R-RELIABILITY-01_SETUP_PROPAGATES_ONE_SOFT_BUDGET', () => {
  const setup = source('02_Setup.gs');
  assert.match(setup, /runImplementedStage\(\s*stage,\s*spreadsheet,\s*budget/);
  assert.match(setup, /ensureFormalLabels\(\{\s*budget:\s*budget/);
  assert.match(setup, /ensureDedicatedCalendar\(\{\s*budget:\s*budget/);
  assert.match(setup, /runQuickDiagnostic\(\s*spreadsheet,\s*\{\s*budget:\s*budget/);
  assert.match(
    setup,
    /refreshCompletedVersionMetadata\(\s*spreadsheet,\s*completed,\s*budget/
  );
  assert.match(
    setup,
    /assertSetupBudget\(budget,\s*'S80_CREATE_EDIT_TRIGGER'\)/
  );
});

test('R-RELIABILITY-02_CALENDAR_PAGINATION_HAS_LIMIT_BUDGET_AND_CYCLE_GUARD', () => {
  const calendar = source('10_CalendarSync.gs');
  assert.match(calendar, /CALENDAR_LIST_MAX_PAGES/);
  assert.match(calendar, /E_CALENDAR_LIST_TOKEN_CYCLE/);
  assert.match(calendar, /settings\.budget\.isExhausted/);
});

test('R-RUNTIME-06_WORKER_USES_RUNTIME_SNAPSHOT_FOR_LIMITS', () => {
  const worker = source('18_Worker.gs');
  assert.match(worker, /runtimeSettingsSnapshot/);
  assert.match(worker, /automaticMaxMessages/);
  assert.match(worker, /runtimeSettings\.manual_max_messages/);
});

test('R-RUNTIME-07_SETTINGS_PROTECTION_AND_EDITABLE_PRESERVATION_EXIST', () => {
  const builder = source('03_SheetBuilder.gs');
  assert.match(builder, /applySettingsProtection/);
  assert.match(builder, /definition\.editable === true/);
  assert.match(builder, /setUnprotectedRanges\(editableRanges\)/);
});

test('R-UX-01_SETUP_CONSENT_NAMES_SIDE_EFFECTS_AND_NON_EFFECTS', () => {
  const menu = source('Menu.gs');
  assert.match(menu, /正式Gmailラベル7件/);
  assert.match(menu, /専用secondary Calendar/);
  assert.match(menu, /所有者installable edit Trigger/);
  assert.match(menu, /通常Inbox処理、実AI接続、5分Triggerは開始/);
  assert.match(menu, /WorkOsSetup\.getNextStagePreview/);
});

test('R-UX-02_RESULT_SUMMARY_HAS_NEXT_ACTION_AND_TRUNCATION_NOTICE', () => {
  const menu = source('Menu.gs');
  assert.match(menu, /次の操作:/);
  assert.match(menu, /詳細は表示上限のため切り詰めました/);
  assert.match(menu, /Diagnostic:/);
});

test('R-UX-03_PAUSED_ACTION_DEPENDS_ON_OPERATION', () => {
  const menuContext = {};
  vm.createContext(menuContext);
  vm.runInContext(source('Menu.gs'), menuContext);
  assert.match(
    menuContext.nextActionForResult_(
      '手動取込',
      { status: 'PAUSED' }
    ),
    /同じメニュー操作を再実行/
  );
  assert.doesNotMatch(
    menuContext.nextActionForResult_(
      '手動取込',
      { status: 'PAUSED' }
    ),
    /セットアップを続行/
  );
  assert.match(
    menuContext.nextActionForResult_(
      '初期セットアップ',
      { status: 'PAUSED', next_stage: 'S60_CREATE_DEADLINE_CALENDAR' }
    ),
    /セットアップを続行/
  );
});

test('R-META-01_PHASE_BOUNDARY_AND_VERSIONS_ARE_CURRENT', () => {
  const config = source('00_Config.gs');
  const setup = source('02_Setup.gs');
  assert.match(config, /CODE_VERSION:\s*'2\.8\.24-prepilot'/);
  assert.match(config, /SCHEMA_VERSION:\s*'2\.6'/);
  assert.match(config, /AI_SCHEMA_VERSION:\s*'2\.0'/);
  assert.match(config, /MIGRATION_VERSION:\s*'3'/);
  assert.match(
    setup,
    /READY_FOR_AUTOMATIC_INBOX_SHADOW_PILOT/
  );
  assert(!setup.includes('STOP_BEFORE_PHASE7'));
});

test('R-META-02_AUTOMATION_DEFAULT_REMAINS_OFF', () => {
  const config = source('00_Config.gs');
  assert.match(config, /AUTOMATION_ENABLED:\s*false/);
  assert.strictEqual(
    runtimeContext.WorkOsRuntimeSettings.CONTRACT.find(
      (item) => item.key === 'automation_enabled'
    ).default_value,
    false
  );
});

test('R-META-03_TASK_AUTHORITY_SCHEMA_IS_PRESENT_AND_HIDDEN_LEDGER_IS_REGISTERED', () => {
  const Config = runtimeContext.WorkOsConfig;
  const Schemas = runtimeContext.WorkOsSchemas;
  const taskIdsCurrent = Schemas.getInternalIds(Config.SHEETS.TASKS);
  const ledgerIds = Schemas.getInternalIds(Config.SHEETS.TASK_AUTHORITY_LEDGER);

  assert.strictEqual(taskIdsCurrent.length, 50);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(taskIdsCurrent.slice(-3))),
    ['authority_generation', 'authority_hash', 'authority_state']
  );
  assert.strictEqual(ledgerIds.length, 21);
  assert.strictEqual(
    JSON.parse(JSON.stringify(runtimeContext.WorkOsHiddenSheets)).includes(
      Config.SHEETS.TASK_AUTHORITY_LEDGER
    ),
    true
  );
});

const failed = results.filter((item) => item.status === 'FAIL');
const report = {
  suite: 'remediation_runtime_dashboard_reliability',
  environment: 'LOCAL_VM_AND_STATIC',
  real_google_workspace: 'NOT_EXECUTED',
  passed: results.length - failed.length,
  failed: failed.length,
  tests: results
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  process.exitCode = 1;
}
