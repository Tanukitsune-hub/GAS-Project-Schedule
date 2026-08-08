/**
 * Google Workspace Personal Work OS v2 - pre-pilot remediation configuration.
 *
 * This file is intentionally free of Spreadsheet writes and external service calls.
 */
var WorkOsConfig = Object.freeze({
  SYSTEM_NAME: 'Google Workspace Personal Work OS v2',
  CODE_VERSION: '2.8.12-prepilot',
  SCHEMA_VERSION: '2.6',
  AI_SCHEMA_VERSION: '2.0',
  MIGRATION_VERSION: '3',
  S90_MODULE_CONTRACT_ID: 'WORK_OS_V2_S90_CONTRACT_2_8_11',
  DIAGNOSTIC_ACCEPTANCE_SUMMARY_CONTRACT_ID:
    'WORK_OS_V2_DIAGNOSTIC_ACCEPTANCE_SUMMARY_V1',
  // This deliberately exceeds the known Quick Diagnostic check population
  // while keeping the summary bounded enough to remain above UI detail caps.
  DIAGNOSTIC_ACCEPTANCE_SUMMARY_MAX_CHECK_IDS: 96,
  DIAGNOSTIC_ACCEPTANCE_SUMMARY_MAX_CHECK_ID_LENGTH: 48,
  TIMEZONE: 'Asia/Tokyo',
  HEADER_ID_ROW: 1,
  HEADER_LABEL_ROW: 2,
  DATA_START_ROW: 3,
  // The only Dashboard rows that Setup may seed before an explicit refresh.
  // Dashboard ownership validation compares these values exactly; it must not
  // treat arbitrary rows with the same three keys as a safe legacy surface.
  DASHBOARD_LEGACY_SEED_ROWS: Object.freeze([
    Object.freeze({
      metric_key: 'AUTOMATION_STATUS',
      metric_value: 'OFF',
      note: '初期停止。明示更新後に現在状態を表示します。'
    }),
    Object.freeze({
      metric_key: 'SYSTEM_HEALTH',
      metric_value: '未更新',
      note: 'メニューから運用Dashboardを更新してください。'
    }),
    Object.freeze({
      metric_key: 'QUICK_DIAGNOSTIC',
      metric_value: 'NOT_EXECUTED',
      note: 'Dashboard未更新'
    })
  ]),
  // The Dashboard system block contains only string values. Setup may
  // establish this deterministic plain-text contract after (and only after)
  // the Dashboard control plane and the exact system surface are proven safe.
  // Diagnostics remain read-only and require this value exactly.
  DASHBOARD_SYSTEM_BLOCK_TEXT_FORMAT: '@',
  TASK_INITIAL_ROWS: 100,
  SETTINGS_INITIAL_ROWS: 50,
  DEFAULT_INITIAL_ROWS: 100,
  ROW_EXPANSION_UNIT: 100,
  SETUP_SOFT_LIMIT_MS: 120000,
  SETUP_RESERVE_MS: 5000,
  QUICK_DIAGNOSTIC_TARGET_MS: 60000,
  QUICK_DIAGNOSTIC_RESERVE_MS: 5000,
  QUICK_DIAGNOSTIC_CHUNK_ROWS: 250,
  DASHBOARD_SOFT_LIMIT_MS: 60000,
  DASHBOARD_RESERVE_MS: 5000,
  LOCK_WAIT_MS: 5000,
  MANUAL_WORKER_SOFT_LIMIT_MS: 120000,
  MANUAL_WORKER_RESERVE_MS: 5000,
  MANUAL_GMAIL_QUERY: 'label:手動/取込 -label:手動/除外',
  MANUAL_MAX_THREADS: 10,
  MANUAL_MAX_MESSAGES: 1,
  MANUAL_GMAIL_API_CALL_LIMIT: 20,
  CALENDAR_MAX_JOBS_PER_RUN: 1,
  CALENDAR_SEARCH_WINDOW_DAYS: 7,
  CALENDAR_LIST_PAGE_SIZE: 250,
  CALENDAR_LIST_MAX_PAGES: 10,
  MESSAGE_STALE_CLAIM_MS: 30 * 60 * 1000,
  EMAIL_BODY_MAX_CHARS: 20000,
  EMAIL_CONTEXT_MAX_MESSAGES: 2,
  EMAIL_CONTEXT_MAX_CHARS: 2000,
  MAX_AI_ACTIONS: 10,
  MAX_AI_WARNINGS: 10,
  AI_REQUEST_TIMEOUT_MS: 60000,
  AI_RESPONSE_MAX_CHARS: 100000,
  V2_EXTENSION_CHUNK_ROWS: 500,
  V2_EXTENSION_MAX_ROWS: 10000,
  V2_EXTENSION_BUDGET_RESERVE_MS: 5000,
  AUTHORITY_LEDGER_CHUNK_ROWS: 50,
  // A ledger snapshot is intentionally kept below the Google Sheets cell
  // limit.  The protocol fails closed rather than truncating recovery state.
  AUTHORITY_LEDGER_MAX_SNAPSHOT_CHARS: 45000,
  // Bound runtime scans and expansion so a malformed workbook cannot turn an
  // authority check into an unbounded Sheet read/write operation.
  AUTHORITY_LEDGER_MAX_DATA_ROWS: 10000,
  MOCK_AI_MODEL: 'work-os-deterministic-mock-v2',
  MOCK_PROMPT_VERSION: 'phase3-mock-v1',
  AI_PROVIDER: 'MOCK',
  EXTERNAL_AI_ENABLED: false,
  EXTERNAL_AI_PROVIDER: '',
  EXTERNAL_AI_MODEL: '',
  EXTERNAL_AI_PROMPT_VERSION: '',
  EXTERNAL_AI_CREDENTIAL_REFERENCE: '',
  EXTERNAL_AI_COMPANY_APPROVED: false,
  EXTERNAL_AI_DATA_POLICY_APPROVED: false,
  EXTERNAL_AI_CREDENTIAL_STORAGE_APPROVED: false,
  EXTERNAL_AI_AUTH_CONFIGURED: false,
  AUTOMATION_ENABLED: false,
  AUTOMATION_INTERVAL_MINUTES: 5,
  AUTOMATION_OVERLAP_MS: 24 * 60 * 60 * 1000,
  AUTOMATION_MAX_MESSAGES_PER_RUN: 10,
  AUTOMATION_MAX_SEARCH_THREADS: 100,
  AUTOMATION_SEARCH_PAGE_SIZE: 25,
  AUTOMATION_GMAIL_API_CALL_LIMIT: 160,
  AUTOMATION_WORKER_SOFT_LIMIT_MS: 210000,
  AUTOMATION_WORKER_RESERVE_MS: 5000,
  AUTOMATION_HANDLER_FUNCTION: 'runScheduledWorker',
  EDIT_HANDLER_FUNCTION: 'handleTaskEdit',
  AUTOMATION_NEWSLETTER_FILTER_APPROVED: false,
  AUTOMATION_CALENDAR_NOTIFICATION_FILTER_APPROVED: false,
  AUTOMATION_GMAIL_QUERY:
    'in:inbox -in:spam -in:trash -label:手動/除外',
  RETRY_DELAYS_MINUTES: Object.freeze([5, 15, 60]),
  RETRY_MAX_ATTEMPTS: 4,
  RETRY_MAX_ITEMS_PER_RUN: 10,
  MANUAL_RETRY_MAX_SELECTED: 5,
  PROVIDER_FAILURE_SUPPRESSION_MS: 5 * 60 * 1000,
  DEEP_DIAGNOSTIC_SOFT_LIMIT_MS: 180000,
  DEEP_DIAGNOSTIC_SAMPLE_ROWS: 50,
  DEADLINE_CALENDAR_NAME: '自動期日管理',
  GMAIL_LABELS: Object.freeze([
    'AI/要対応',
    'AI/期限',
    'AI/返信待',
    'AI/要確認',
    '手動/取込',
    '手動/除外',
    'SYS/失敗'
  ]),
  SHEETS: Object.freeze({
    DASHBOARD: 'ダッシュボード',
    TASKS: 'タスク一覧',
    SETTINGS: '設定',
    RUN_HISTORY: '処理履歴',
    ERRORS: 'エラー・再実行',
    GUIDE: '使い方',
    MESSAGE_STATE: 'メール状態',
    SYSTEM_CONFIG: 'システム設定',
    PROMPT_VERSIONS: 'プロンプト版管理',
    SYNC_STATE: '同期状態',
    TASK_AUTHORITY_LEDGER: 'Task Authority Ledger'
  }),
  V1_SHEET_NAMES: Object.freeze([
    '要確認',
    'Review Queue',
    'review_queue',
    'system_config',
    'history',
    'task_master',
    'メール一覧'
  ]),
  PROPERTIES: Object.freeze({
    INSTANCE_ID: 'WORK_OS_V2_INSTANCE_ID',
    CODE_VERSION: 'WORK_OS_V2_CODE_VERSION',
    SCHEMA_VERSION: 'WORK_OS_V2_SCHEMA_VERSION',
    MIGRATION_VERSION: 'WORK_OS_V2_MIGRATION_VERSION',
    SETUP_COMPLETED_STAGES: 'WORK_OS_V2_SETUP_COMPLETED_STAGES',
    SETUP_LAST_RESULT: 'WORK_OS_V2_SETUP_LAST_RESULT',
    MANAGEMENT_EDIT_WARNING: 'WORK_OS_V2_MANAGEMENT_EDIT_WARNING',
    DEADLINE_CALENDAR_ID: 'WORK_OS_V2_DEADLINE_CALENDAR_ID',
    AUTOMATION_ENABLED: 'WORK_OS_V2_AUTOMATION_ENABLED',
    AUTOMATION_DESIRED_STATE: 'WORK_OS_V2_AUTOMATION_DESIRED_STATE',
    AUTOMATION_TRIGGER_ID: 'WORK_OS_V2_AUTOMATION_TRIGGER_ID',
    EDIT_TRIGGER_ID: 'WORK_OS_V2_EDIT_TRIGGER_ID',
    AUTOMATION_WATERMARK_AT: 'WORK_OS_V2_AUTOMATION_WATERMARK_AT',
    AUTOMATION_LAST_RUN_AT: 'WORK_OS_V2_AUTOMATION_LAST_RUN_AT',
    AUTOMATION_SCAN_UPPER_AT: 'WORK_OS_V2_AUTOMATION_SCAN_UPPER_AT',
    AUTOMATION_SCAN_PAGE_TOKEN:
      'WORK_OS_V2_AUTOMATION_SCAN_PAGE_TOKEN',
    AI_PROVIDER_SUPPRESS_UNTIL:
      'WORK_OS_V2_AI_PROVIDER_SUPPRESS_UNTIL',
    AUTHORITY_MIGRATION_STATE:
      'WORK_OS_V2_AUTHORITY_MIGRATION_STATE'
  }),
  SETUP_STAGES: Object.freeze([
    'S00_VALIDATE_ENV',
    'S10_CREATE_SHEETS',
    'S20_CREATE_SCHEMAS',
    'S30_APPLY_SMALL_VALIDATIONS',
    'S40_SEED_SAFE_SETTINGS',
    'S50_CREATE_GMAIL_LABELS',
    'S60_CREATE_DEADLINE_CALENDAR',
    'S70_STORE_PROPERTIES',
    'S80_CREATE_EDIT_TRIGGER',
    'S90_QUICK_DIAGNOSTIC',
    'S99_COMPLETE'
  ]),
  IMPLEMENTED_SETUP_STAGES: Object.freeze([
    'S00_VALIDATE_ENV',
    'S10_CREATE_SHEETS',
    'S20_CREATE_SCHEMAS',
    'S30_APPLY_SMALL_VALIDATIONS',
    'S40_SEED_SAFE_SETTINGS',
    'S50_CREATE_GMAIL_LABELS',
    'S60_CREATE_DEADLINE_CALENDAR',
    'S70_STORE_PROPERTIES',
    'S80_CREATE_EDIT_TRIGGER',
    'S90_QUICK_DIAGNOSTIC',
    'S99_COMPLETE'
  ]),
  DATE_FORMAT: 'yyyy/mm/dd',
  DATETIME_FORMAT: 'yyyy/mm/dd hh:mm:ss',
  TEST_MODE: false
});

var WorkOsEnums = Object.freeze({
  TaskStatus: Object.freeze({
    REVIEW: '要確認',
    OPEN: '未対応',
    IN_PROGRESS: '対応中',
    WAITING: '返信待ち',
    DONE: '完了',
    EXCLUDED: '対象外',
    CANCELLED: '取消'
  }),
  Decision: Object.freeze({
    NONE: '未選択',
    ACCEPT: '受入',
    REJECT: '却下'
  }),
  Priority: Object.freeze({
    HIGH: '高',
    MEDIUM: '中',
    LOW: '低'
  }),
  DeadlineBasis: Object.freeze({
    EXPLICIT: '明示',
    RELATIVE: '相対',
    MANUAL_CONFIRMED: '手動確認',
    INFERRED: '推測',
    AMBIGUOUS: '曖昧',
    NONE: 'なし'
  }),
  CalendarSyncMode: Object.freeze({
    AUTO: '自動',
    FORCE: '登録',
    NONE: '対象外'
  }),
  ReviewState: Object.freeze({
    NONE: 'なし',
    OPEN: '未確認',
    APPLIED: '適用済',
    REJECTED: '却下済'
  }),
  CalendarImportance: Object.freeze({
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH'
  }),
  CalendarSyncStatus: Object.freeze({
    NOT_REQUIRED: 'NOT_REQUIRED',
    PENDING: 'PENDING',
    SYNCED: 'SYNCED',
    DELETE_PENDING: 'DELETE_PENDING',
    ERROR: 'ERROR'
  }),
  ScheduleState: Object.freeze({
    NONE: 'NONE',
    FUTURE: 'FUTURE',
    UPCOMING: 'UPCOMING',
    TODAY: 'TODAY',
    OVERDUE: 'OVERDUE'
  }),
  AuthorityControlState: Object.freeze({
    ACTIVE: 'ACTIVE',
    ORPHANED: 'ORPHANED',
    QUARANTINED: 'QUARANTINED',
    UNRECOVERABLE: 'UNRECOVERABLE'
  }),
  AuthorityTransactionState: Object.freeze({
    IDLE: 'IDLE',
    PREPARED: 'PREPARED'
  })
});

var WorkOsSheetOrder = Object.freeze([
  WorkOsConfig.SHEETS.DASHBOARD,
  WorkOsConfig.SHEETS.TASKS,
  WorkOsConfig.SHEETS.SETTINGS,
  WorkOsConfig.SHEETS.RUN_HISTORY,
  WorkOsConfig.SHEETS.ERRORS,
  WorkOsConfig.SHEETS.GUIDE,
  WorkOsConfig.SHEETS.MESSAGE_STATE,
  WorkOsConfig.SHEETS.SYSTEM_CONFIG,
  WorkOsConfig.SHEETS.PROMPT_VERSIONS,
  WorkOsConfig.SHEETS.SYNC_STATE,
  WorkOsConfig.SHEETS.TASK_AUTHORITY_LEDGER
]);

var WorkOsHiddenSheets = Object.freeze([
  WorkOsConfig.SHEETS.MESSAGE_STATE,
  WorkOsConfig.SHEETS.SYSTEM_CONFIG,
  WorkOsConfig.SHEETS.PROMPT_VERSIONS,
  WorkOsConfig.SHEETS.SYNC_STATE,
  WorkOsConfig.SHEETS.TASK_AUTHORITY_LEDGER
]);
