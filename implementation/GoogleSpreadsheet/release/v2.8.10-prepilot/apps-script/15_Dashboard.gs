/**
 * Phase 7 lightweight operational Dashboard.
 *
 * Refresh is explicit and bounded. It reads operational Sheets and writes
 * aggregate status only; no Task title, sender, subject, Message ID, Calendar
 * ID, credential reference or external payload is copied to the Dashboard.
 */
var WorkOsDashboard = (function () {
  var MODULE_CONTRACT_ID = 'WORK_OS_V2_S90_CONTRACT_2_8_10';
  var METRIC_ORDER = Object.freeze([
    'AUTOMATION_STATUS',
    'LAST_SUCCESS_AT',
    'LAST_FAILURE_AT',
    'PROCESSED_TODAY',
    'REVIEW_OPEN',
    'OVERDUE',
    'DUE_TODAY',
    'DUE_NEXT_7_DAYS',
    'WAITING_REPLY',
    'RETRY_WAITING',
    'DEAD_LETTER',
    'CALENDAR_PENDING',
    'UNRESOLVED_ERRORS',
    'SYSTEM_HEALTH',
    'AI_PROVIDER',
    'QUICK_DIAGNOSTIC',
    'LAST_REFRESHED_AT'
  ]);
  var BLOCK_MARKER_PREFIX = 'WORK_OS_V2_DASHBOARD_BLOCK:';
  var BLOCK_MARKER_OWNER = 'WORK_OS_V2_DASHBOARD';
  var OWNED_SHEET_PROTECTION_DESCRIPTION =
    'WORK_OS_V2_PHASE1_ダッシュボード_SYSTEM_OWNED_EDIT_POLICY';
  var BLOCK_MARKER_VERSION = 1;
  var LEGACY_SEED_ROWS = WorkOsConfig.DASHBOARD_LEGACY_SEED_ROWS ||
    Object.freeze([]);
  var LEGACY_SEED_KEYS = Object.freeze(LEGACY_SEED_ROWS.map(
    function (row) { return row.metric_key; }
  ));
  var CANONICAL_SYSTEM_BLOCK_TEXT_FORMAT = String(
    WorkOsConfig.DASHBOARD_SYSTEM_BLOCK_TEXT_FORMAT || '@'
  );
  // This sentinel is intentionally private. It permits Setup to defer only
  // the number-format failure decision while retaining every other ownership
  // and surface check. It is not an externally configurable inspection mode.
  var SETUP_NUMBER_FORMAT_NORMALIZATION_MODE = Object.freeze({});
  var DASHBOARD_CONFLICT_REASONS = Object.freeze({
    DASHBOARD_SHEET_PROTECTION_CONTRACT: true,
    DASHBOARD_HEADER_PROTECTION_CONTRACT: true,
    DASHBOARD_FOREIGN_OR_OVERLAPPING_RANGE_PROTECTION: true,
    DASHBOARD_FOREIGN_NAMED_RANGE: true,
    DASHBOARD_VALUE_CONFLICT: true,
    DASHBOARD_FORMULA_CONFLICT: true,
    DASHBOARD_VALIDATION_CONFLICT: true,
    DASHBOARD_NOTE_CONFLICT: true,
    DASHBOARD_MERGE_CONFLICT: true,
    DASHBOARD_HIDDEN_ROW_OR_COLUMN: true,
    DASHBOARD_BACKGROUND_CONFLICT: true,
    DASHBOARD_FONT_CONFLICT: true,
    DASHBOARD_NUMBER_FORMAT_CONFLICT: true,
    DASHBOARD_SEED_OR_MARKER_CONTRACT: true
  });
  var DASHBOARD_CONFLICT_SUBREASONS = Object.freeze({
    PROTECTION_API_UNAVAILABLE: true,
    PROTECTION_ACCESS_READ_FAILED: true,
    PROTECTION_WARNING_ONLY: true,
    PROTECTION_DOMAIN_EDIT_ENABLED: true,
    PROTECTION_TARGET_AUDIENCE_PRESENT: true,
    PROTECTION_OWNER_UNAVAILABLE_SHARED_DRIVE: true,
    PROTECTION_OWNER_IDENTITY_UNAVAILABLE: true,
    PROTECTION_EFFECTIVE_USER_IDENTITY_UNAVAILABLE: true,
    PROTECTION_EFFECTIVE_USER_NOT_OWNER: true,
    PROTECTION_CAN_EDIT_FALSE: true,
    PROTECTION_EDITOR_IDENTITY_UNAVAILABLE: true,
    PROTECTION_FOREIGN_EDITOR: true,
    PROTECTION_DUPLICATE_OWNER_EDITOR: true,
    PROTECTION_UNPROTECTED_RANGE_PRESENT: true,
    PROTECTION_NAMED_RANGE_ASSOCIATION: true,
    SHEET_PROTECTION_MISSING: true,
    SHEET_PROTECTION_DUPLICATE: true,
    SHEET_PROTECTION_DESCRIPTION_MISMATCH: true,
    HEADER_PROTECTION_MISSING: true,
    HEADER_PROTECTION_DUPLICATE: true,
    HEADER_PROTECTION_DESCRIPTION_MISMATCH: true,
    HEADER_PROTECTION_GEOMETRY_MISMATCH: true,
    FOREIGN_RANGE_PROTECTION_PRESENT: true,
    FOREIGN_NAMED_RANGE_PRESENT: true,
    UNEXPECTED_VALUE_PRESENT: true,
    FORMULA_PRESENT: true,
    VALIDATION_PRESENT: true,
    NOTE_PRESENT: true,
    MERGE_PRESENT: true,
    ROW_OR_COLUMN_HIDDEN: true,
    BACKGROUND_NONCANONICAL: true,
    FONT_NONCANONICAL: true,
    NUMBER_FORMAT_NONCANONICAL: true,
    NUMBER_FORMAT_API_UNAVAILABLE: true,
    NUMBER_FORMAT_FLUSH_UNAVAILABLE: true,
    NUMBER_FORMAT_POSTCONDITION_FAILED: true,
    SEED_VALUES_NONCANONICAL: true,
    MARKER_NONCANONICAL: true,
    DUPLICATE_METRIC_KEY: true,
    DASHBOARD_SHAPE_NONCANONICAL: true,
    NO_SAFE_BLOCK: true,
    DASHBOARD_CONTRACT_UNCLASSIFIED: true
  });
  var DASHBOARD_CONFLICT_COUNT_KEYS = Object.freeze({
    sheet_protection_count: true,
    header_protection_count: true,
    foreign_range_protection_count: true,
    explicit_editor_count: true,
    target_audience_count: true,
    unprotected_range_count: true,
    named_range_count: true,
    value_conflict_count: true,
    formula_conflict_count: true,
    validation_conflict_count: true,
    note_conflict_count: true,
    merge_conflict_count: true,
    hidden_row_or_column_count: true,
    background_conflict_count: true,
    font_conflict_count: true,
    number_format_conflict_count: true
  });

  function assertBudget(budget, stage) {
    if (budget &&
        budget.isExhausted(WorkOsConfig.DASHBOARD_RESERVE_MS)) {
      throw new WorkOsAppError(
        'E_DASHBOARD_BUDGET',
        'DASHBOARD',
        true,
        'Dashboard更新を実行予算内で停止しました: ' + stage
      );
    }
  }

  function sheetMatrix(spreadsheet, sheetName, budget) {
    assertBudget(budget, 'READ_' + sheetName);
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      throw new WorkOsAppError(
        'E_SCHEMA_MISSING_SHEET',
        'DASHBOARD',
        false,
        'Dashboard集計に必要なSheetがありません。'
      );
    }
    return sheet.getDataRange().getValues();
  }

  function columnMap(matrix, sheetName) {
    var expected = WorkOsSchemas.getInternalIds(sheetName);
    var actual = matrix.length ? matrix[0].slice(0, expected.length) : [];
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new WorkOsAppError(
        'E_SCHEMA_MISSING_COLUMN',
        'DASHBOARD',
        false,
        'Dashboard集計元の内部列IDが一致しません。'
      );
    }
    return WorkOsSchemas.buildColumnMapFromIds(expected);
  }

  function dateIso(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return Utilities.formatDate(
        value,
        WorkOsConfig.TIMEZONE,
        'yyyy-MM-dd'
      );
    }
    var text = String(value == null ? '' : value).trim();
    return /^\d{4}-\d{2}-\d{2}/.test(text)
      ? text.slice(0, 10)
      : '';
  }

  function dateTimeText(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return Utilities.formatDate(
        value,
        WorkOsConfig.TIMEZONE,
        'yyyy/MM/dd HH:mm:ss'
      );
    }
    var text = String(value == null ? '' : value).trim();
    return text ? WorkOsUtilities.redact(text).slice(0, 32) : '未記録';
  }

  function addDaysIso(iso, days) {
    var parts = String(iso).split('-').map(Number);
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function logicalRows(matrix, map, primaryKeys) {
    return matrix.slice(WorkOsConfig.DATA_START_ROW - 1)
      .filter(function (row) {
        return primaryKeys.some(function (key) {
          return String(row[map[key]] || '').trim() !== '';
        });
      });
  }

  function isTrue(value) {
    return value === true || String(value).toLowerCase() === 'true';
  }

  function isTerminalTask(row, map) {
    var status = String(row[map.status] || '');
    return isTrue(row[map.completed]) ||
      isTrue(row[map.excluded]) ||
      [
        WorkOsEnums.TaskStatus.DONE,
        WorkOsEnums.TaskStatus.EXCLUDED,
        WorkOsEnums.TaskStatus.CANCELLED
      ].indexOf(status) !== -1;
  }

  function latestRunTime(rows, map, success) {
    var candidates = rows.filter(function (row) {
      var status = String(row[map.run_status] || '').toUpperCase();
      return success
        ? status === 'COMPLETE' || status === 'SUCCESS'
        : status === 'FAILED';
    }).map(function (row) {
      return row[map.finished_at] || row[map.started_at];
    }).filter(function (value) {
      return Boolean(value);
    });
    if (!candidates.length) {
      return '未記録';
    }
    candidates.sort(function (left, right) {
      return new Date(left).getTime() - new Date(right).getTime();
    });
    return dateTimeText(candidates[candidates.length - 1]);
  }

  function collectOperationalMetrics(spreadsheet, options) {
    var settings = options || {};
    var budget = settings.budget ||
      WorkOsUtilities.createSoftBudget(
        WorkOsConfig.DASHBOARD_SOFT_LIMIT_MS,
        Date.now()
      );
    var nowValue = settings.now instanceof Date
      ? settings.now
      : WorkOsUtilities.now();
    var today = dateIso(nowValue);
    var nextSeven = addDaysIso(today, 7);
    var taskMatrix = settings.task_matrix ||
      sheetMatrix(spreadsheet, WorkOsConfig.SHEETS.TASKS, budget);
    var historyMatrix = settings.history_matrix ||
      sheetMatrix(spreadsheet, WorkOsConfig.SHEETS.RUN_HISTORY, budget);
    var errorMatrix = settings.error_matrix ||
      sheetMatrix(spreadsheet, WorkOsConfig.SHEETS.ERRORS, budget);
    var outboxMatrix = settings.outbox_matrix ||
      sheetMatrix(spreadsheet, WorkOsConfig.SHEETS.SYNC_STATE, budget);
    var taskMap = columnMap(taskMatrix, WorkOsConfig.SHEETS.TASKS);
    var historyMap = columnMap(
      historyMatrix,
      WorkOsConfig.SHEETS.RUN_HISTORY
    );
    var errorMap = columnMap(
      errorMatrix,
      WorkOsConfig.SHEETS.ERRORS
    );
    var outboxMap = columnMap(
      outboxMatrix,
      WorkOsConfig.SHEETS.SYNC_STATE
    );
    var tasks = logicalRows(
      taskMatrix,
      taskMap,
      ['task_id', 'origin_key']
    );
    var history = logicalRows(historyMatrix, historyMap, ['run_id']);
    var errors = logicalRows(errorMatrix, errorMap, ['error_id']);
    var outbox = logicalRows(outboxMatrix, outboxMap, ['sync_id']);
    var activeTasks = tasks.filter(function (row) {
      return !isTerminalTask(row, taskMap);
    });
    return {
      last_success_at: latestRunTime(history, historyMap, true),
      last_failure_at: latestRunTime(history, historyMap, false),
      processed_today: history.reduce(function (total, row) {
        return total + (dateIso(row[historyMap.started_at]) === today
          ? Math.max(0, Number(row[historyMap.processed_count] || 0))
          : 0);
      }, 0),
      review_open: activeTasks.filter(function (row) {
        return isTrue(row[taskMap.needs_review]) ||
          row[taskMap.status] === WorkOsEnums.TaskStatus.REVIEW ||
          row[taskMap.review_state] === WorkOsEnums.ReviewState.OPEN;
      }).length,
      overdue: activeTasks.filter(function (row) {
        var due = dateIso(row[taskMap.due_date]);
        return due && due < today;
      }).length,
      due_today: activeTasks.filter(function (row) {
        return dateIso(row[taskMap.due_date]) === today;
      }).length,
      due_next_7_days: activeTasks.filter(function (row) {
        var due = dateIso(row[taskMap.due_date]);
        return due > today && due <= nextSeven;
      }).length,
      waiting_reply: activeTasks.filter(function (row) {
        return isTrue(row[taskMap.waiting_for_reply]) ||
          row[taskMap.status] === WorkOsEnums.TaskStatus.WAITING;
      }).length,
      retry_waiting: errors.filter(function (row) {
        return String(row[errorMap.status] || '') === 'RETRY_QUEUED';
      }).length + outbox.filter(function (row) {
        return ['PENDING', 'RETRY'].indexOf(
          String(row[outboxMap.status] || '')
        ) !== -1;
      }).length,
      dead_letter: errors.filter(function (row) {
        return String(row[errorMap.status] || '') === 'DEAD';
      }).length + outbox.filter(function (row) {
        return String(row[outboxMap.status] || '') === 'DEAD';
      }).length,
      calendar_pending: outbox.filter(function (row) {
        return ['PENDING', 'RETRY'].indexOf(
          String(row[outboxMap.status] || '')
        ) !== -1;
      }).length,
      unresolved_errors: errors.filter(function (row) {
        return ['RESOLVED', 'IGNORED'].indexOf(
          String(row[errorMap.status] || '')
        ) === -1;
      }).length,
      source_read_counts: {
        tasks: 1,
        run_history: 1,
        errors: 1,
        calendar_outbox: 1
      }
    };
  }

  function buildMetricRows(metrics, automation, quick, aiReadiness) {
    var prerequisites = automation.prerequisites || {};
    var health = WorkOsRuntimeSettings.summarizeHealth(
      {
        ready: prerequisites.ready === true
      },
      automation,
      quick
    );
    var provider = String(aiReadiness.provider || '');
    var values = {
      AUTOMATION_STATUS: [automation.status || 'UNKNOWN',
        '初期停止。明示的な有効化と全Gate通過が必要です。'],
      LAST_SUCCESS_AT: [metrics.last_success_at, '処理履歴から集計'],
      LAST_FAILURE_AT: [metrics.last_failure_at, '処理履歴から集計'],
      PROCESSED_TODAY: [metrics.processed_today, '本日開始runの処理件数'],
      REVIEW_OPEN: [metrics.review_open, '要確認・未確認Task'],
      OVERDUE: [metrics.overdue, '未完了かつ期限超過'],
      DUE_TODAY: [metrics.due_today, '本日期限'],
      DUE_NEXT_7_DAYS: [metrics.due_next_7_days, '明日から7日後まで'],
      WAITING_REPLY: [metrics.waiting_reply, '未完了の返信待ち'],
      RETRY_WAITING: [metrics.retry_waiting, '再試行待ち合計'],
      DEAD_LETTER: [metrics.dead_letter, '手動確認が必要'],
      CALENDAR_PENDING: [metrics.calendar_pending, 'Calendar outbox待機'],
      UNRESOLVED_ERRORS: [metrics.unresolved_errors, '未解決error行'],
      SYSTEM_HEALTH: [health.status, health.note],
      AI_PROVIDER: [provider || '未設定',
        aiReadiness.ready ? 'code readiness READY' :
          '実Provider接続はNOT EXECUTED'],
      QUICK_DIAGNOSTIC: [quick.status || 'NOT_EXECUTED',
        'Dashboard更新時に読取専用で実行'],
      LAST_REFRESHED_AT: [
        dateTimeText(WorkOsUtilities.now()),
        '明示更新。自動refreshなし'
      ]
    };
    return METRIC_ORDER.map(function (key) {
      return [key, String(values[key][0]), String(values[key][1])];
    });
  }

  function safeDashboardConflictCounts(counts) {
    var source = counts || {};
    var safe = {};
    Object.keys(DASHBOARD_CONFLICT_COUNT_KEYS).forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) {
        return;
      }
      var value = Number(source[key]);
      safe[key] = Number.isFinite(value) && value >= 0
        ? Math.floor(value)
        : 0;
    });
    return safe;
  }

  function closedDashboardReason(reasonCode) {
    var value = String(reasonCode || '');
    return DASHBOARD_CONFLICT_REASONS[value]
      ? value
      : 'DASHBOARD_SEED_OR_MARKER_CONTRACT';
  }

  function closedDashboardSubreason(subreasonCode) {
    var value = String(subreasonCode || '');
    return DASHBOARD_CONFLICT_SUBREASONS[value]
      ? value
      : 'DASHBOARD_CONTRACT_UNCLASSIFIED';
  }

  function dashboardLayoutConflict(reasonCode, subreasonCode, counts) {
    var error = new WorkOsAppError(
      'E_DASHBOARD_LAYOUT_CONFLICT',
      'DASHBOARD',
      false,
      'Dashboardのsystem領域と利用者領域を安全に区別できないため更新を停止しました。'
    );
    // This is a closed, non-user-data enum for the read-only diagnostic.  It
    // deliberately never carries a cell value, range address, or Workspace
    // identifier into the diagnostic/reporting path.
    error.dashboard_conflict_reason = closedDashboardReason(reasonCode);
    error.dashboard_conflict_subreason =
      closedDashboardSubreason(subreasonCode);
    error.dashboard_conflict_counts = safeDashboardConflictCounts(counts);
    return error;
  }

  function normalizationEvidence(
      status,
      writePerformed,
      flushPerformed,
      postconditionVerified,
      checkedCellCount,
      noncanonicalCount) {
    return {
      normalization_status: String(status),
      status: String(status),
      write_performed: writePerformed === true,
      flush_performed: flushPerformed === true,
      postcondition_verified: postconditionVerified === true,
      checked_cell_count: Math.max(0, Math.floor(
        Number(checkedCellCount) || 0
      )),
      noncanonical_count: Math.max(0, Math.floor(
        Number(noncanonicalCount) || 0
      ))
    };
  }

  function numberFormatPostconditionError(evidence, subreasonCode) {
    var error = new WorkOsAppError(
      'E_DASHBOARD_NUMBER_FORMAT_POSTCONDITION',
      'DASHBOARD',
      false,
      'Dashboard number-format postcondition could not be verified.'
    );
    error.dashboard_conflict_reason =
      'DASHBOARD_NUMBER_FORMAT_CONFLICT';
    error.dashboard_conflict_subreason = closedDashboardSubreason(
      subreasonCode || 'NUMBER_FORMAT_POSTCONDITION_FAILED'
    );
    error.dashboard_conflict_counts = {
      number_format_conflict_count: Math.max(
        0,
        Math.floor(Number(evidence && evidence.noncanonical_count) || 0)
      )
    };
    error.dashboard_normalization_evidence = evidence;
    return error;
  }

  function moduleVersionSkewError() {
    var error = new WorkOsAppError(
      'E_MODULE_VERSION_SKEW',
      'S90_QUICK_DIAGNOSTIC',
      false,
      'Setup-critical module contract is not aligned.'
    );
    error.module_contract_status = 'MISMATCH';
    return error;
  }

  function assertModuleContract() {
    if (String(WorkOsConfig.S90_MODULE_CONTRACT_ID || '') !==
        MODULE_CONTRACT_ID ||
        typeof WorkOsSetup === 'undefined' ||
        !WorkOsSetup ||
        String(WorkOsSetup.MODULE_CONTRACT_ID || '') !==
          MODULE_CONTRACT_ID) {
      throw moduleVersionSkewError();
    }
  }

  function countNoncanonicalFormats(formats, rowCount, columnCount) {
    if (!Array.isArray(formats) || formats.length !== rowCount) {
      return rowCount * columnCount;
    }
    var count = 0;
    for (var rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      if (!Array.isArray(formats[rowIndex]) ||
          formats[rowIndex].length !== columnCount) {
        count += columnCount;
        continue;
      }
      for (var columnIndex = 0;
          columnIndex < columnCount;
          columnIndex += 1) {
        if (!isCanonicalSystemBlockNumberFormat(
          formats[rowIndex][columnIndex]
        )) {
          count += 1;
        }
      }
    }
    return count;
  }

  function dashboardInspection(
      safe,
      reasonCode,
      subreasonCode,
      counts,
      accessMode) {
    return {
      safe: safe === true,
      reason: safe === true ? '' : closedDashboardReason(reasonCode),
      subreason: safe === true
        ? ''
        : closedDashboardSubreason(subreasonCode),
      counts: safeDashboardConflictCounts(counts),
      protection_access_mode: safe === true
        ? String(accessMode || '')
        : ''
    };
  }

  function throwDashboardInspection(inspection) {
    throw dashboardLayoutConflict(
      inspection && inspection.reason,
      inspection && inspection.subreason,
      inspection && inspection.counts
    );
  }

  function emptyMatrix(rows, columns, value) {
    return Array.from({ length: rows }, function () {
      return Array.from({ length: columns }, function () {
        return value;
      });
    });
  }

  function rangeMatrix(range, method, rows, columns, emptyValue) {
    return range && typeof range[method] === 'function'
      ? range[method]()
      : emptyMatrix(rows, columns, emptyValue);
  }

  function rangeBounds(range) {
    if (!range ||
        typeof range.getRow !== 'function' ||
        typeof range.getColumn !== 'function' ||
        typeof range.getNumRows !== 'function' ||
        typeof range.getNumColumns !== 'function') {
      return null;
    }
    return {
      first_row: range.getRow(),
      last_row: range.getRow() + range.getNumRows() - 1,
      first_column: range.getColumn(),
      last_column: range.getColumn() + range.getNumColumns() - 1
    };
  }

  function boundsOverlap(left, right) {
    return left && right &&
      left.first_row <= right.last_row &&
      right.first_row <= left.last_row &&
      left.first_column <= right.last_column &&
      right.first_column <= left.last_column;
  }

  function normalizedUserEmail(user) {
    if (!user || typeof user.getEmail !== 'function') {
      return '';
    }
    return String(user.getEmail() || '').trim().toLowerCase();
  }

  /*
   * Google Sheets owners can edit protections even when getEditors() does
   * not list them as an ordinary explicit editor.  Prove that relationship
   * with Spreadsheet.getOwner(), Session.getEffectiveUser(), and canEdit()
   * instead of relying on an editor-array cardinality shortcut.  The result
   * exposes only closed enums and counts, never either identity.
   */
  function inspectProtectionAccess(spreadsheet, protection) {
    var counts = {
      explicit_editor_count: 0,
      target_audience_count: 0
    };
    if (!spreadsheet ||
        typeof spreadsheet.getOwner !== 'function' ||
        !protection ||
        typeof protection.isWarningOnly !== 'function' ||
        typeof protection.canDomainEdit !== 'function' ||
        typeof protection.canEdit !== 'function' ||
        typeof protection.getEditors !== 'function' ||
        typeof protection.getTargetAudiences !== 'function' ||
        typeof Session === 'undefined' ||
        !Session ||
        typeof Session.getEffectiveUser !== 'function') {
      return dashboardInspection(
        false,
        'DASHBOARD_SHEET_PROTECTION_CONTRACT',
        'PROTECTION_API_UNAVAILABLE',
        counts
      );
    }

    try {
      if (protection.isWarningOnly()) {
        return dashboardInspection(
          false,
          'DASHBOARD_SHEET_PROTECTION_CONTRACT',
          'PROTECTION_WARNING_ONLY',
          counts
        );
      }
      if (protection.canDomainEdit()) {
        return dashboardInspection(
          false,
          'DASHBOARD_SHEET_PROTECTION_CONTRACT',
          'PROTECTION_DOMAIN_EDIT_ENABLED',
          counts
        );
      }
      var audiences = protection.getTargetAudiences() || [];
      counts.target_audience_count = audiences.length;
      if (audiences.length) {
        return dashboardInspection(
          false,
          'DASHBOARD_SHEET_PROTECTION_CONTRACT',
          'PROTECTION_TARGET_AUDIENCE_PRESENT',
          counts
        );
      }

      var owner = spreadsheet.getOwner();
      if (owner == null) {
        return dashboardInspection(
          false,
          'DASHBOARD_SHEET_PROTECTION_CONTRACT',
          'PROTECTION_OWNER_UNAVAILABLE_SHARED_DRIVE',
          counts
        );
      }
      var ownerEmail = normalizedUserEmail(owner);
      if (!ownerEmail) {
        return dashboardInspection(
          false,
          'DASHBOARD_SHEET_PROTECTION_CONTRACT',
          'PROTECTION_OWNER_IDENTITY_UNAVAILABLE',
          counts
        );
      }
      var effectiveEmail = normalizedUserEmail(
        Session.getEffectiveUser()
      );
      if (!effectiveEmail) {
        return dashboardInspection(
          false,
          'DASHBOARD_SHEET_PROTECTION_CONTRACT',
          'PROTECTION_EFFECTIVE_USER_IDENTITY_UNAVAILABLE',
          counts
        );
      }
      if (ownerEmail !== effectiveEmail) {
        return dashboardInspection(
          false,
          'DASHBOARD_SHEET_PROTECTION_CONTRACT',
          'PROTECTION_EFFECTIVE_USER_NOT_OWNER',
          counts
        );
      }
      if (protection.canEdit() !== true) {
        return dashboardInspection(
          false,
          'DASHBOARD_SHEET_PROTECTION_CONTRACT',
          'PROTECTION_CAN_EDIT_FALSE',
          counts
        );
      }

      var editors = protection.getEditors() || [];
      counts.explicit_editor_count = editors.length;
      var editorEmails = [];
      for (var index = 0; index < editors.length; index += 1) {
        var editorEmail = normalizedUserEmail(editors[index]);
        if (!editorEmail) {
          return dashboardInspection(
            false,
            'DASHBOARD_SHEET_PROTECTION_CONTRACT',
            'PROTECTION_EDITOR_IDENTITY_UNAVAILABLE',
            counts
          );
        }
        editorEmails.push(editorEmail);
      }
      if (editorEmails.some(function (email) {
        return email !== ownerEmail;
      })) {
        return dashboardInspection(
          false,
          'DASHBOARD_SHEET_PROTECTION_CONTRACT',
          'PROTECTION_FOREIGN_EDITOR',
          counts
        );
      }
      if (editorEmails.length > 1) {
        return dashboardInspection(
          false,
          'DASHBOARD_SHEET_PROTECTION_CONTRACT',
          'PROTECTION_DUPLICATE_OWNER_EDITOR',
          counts
        );
      }
      return dashboardInspection(
        true,
        '',
        '',
        counts,
        editorEmails.length === 0
          ? 'OWNER_IMPLICIT_CAN_EDIT'
          : 'OWNER_EXPLICIT_EDITOR'
      );
    } catch (error) {
      return dashboardInspection(
        false,
        'DASHBOARD_SHEET_PROTECTION_CONTRACT',
        'PROTECTION_ACCESS_READ_FAILED',
        counts
      );
    }
  }

  function dashboardHeaderProtectionGeometry(width) {
    return {
      first_row: WorkOsConfig.HEADER_ID_ROW,
      last_row: WorkOsConfig.HEADER_LABEL_ROW,
      first_column: 1,
      last_column: width
    };
  }

  function sameBounds(left, right) {
    return left && right &&
      left.first_row === right.first_row &&
      left.last_row === right.last_row &&
      left.first_column === right.first_column &&
      left.last_column === right.last_column;
  }

  function dashboardControlPlane(spreadsheet, sheet, width) {
    if (typeof sheet.getProtections !== 'function' ||
        typeof SpreadsheetApp === 'undefined' ||
        !SpreadsheetApp.ProtectionType) {
      return dashboardInspection(
        false,
        'DASHBOARD_SHEET_PROTECTION_CONTRACT',
        'PROTECTION_API_UNAVAILABLE',
        {}
      );
    }
    var sheetProtections = sheet.getProtections(
      SpreadsheetApp.ProtectionType.SHEET
    ) || [];
    if (sheetProtections.length === 0) {
      return dashboardInspection(
        false,
        'DASHBOARD_SHEET_PROTECTION_CONTRACT',
        'SHEET_PROTECTION_MISSING',
        { sheet_protection_count: 0 }
      );
    }
    if (sheetProtections.length !== 1) {
      return dashboardInspection(
        false,
        'DASHBOARD_SHEET_PROTECTION_CONTRACT',
        'SHEET_PROTECTION_DUPLICATE',
        { sheet_protection_count: sheetProtections.length }
      );
    }
    var sheetProtection = sheetProtections[0];
    if (!sheetProtection ||
        typeof sheetProtection.getDescription !== 'function' ||
        sheetProtection.getDescription() !==
          OWNED_SHEET_PROTECTION_DESCRIPTION) {
      return dashboardInspection(
        false,
        'DASHBOARD_SHEET_PROTECTION_CONTRACT',
        'SHEET_PROTECTION_DESCRIPTION_MISMATCH',
        { sheet_protection_count: 1 }
      );
    }
    var sheetAccess = inspectProtectionAccess(
      spreadsheet,
      sheetProtection
    );
    if (!sheetAccess.safe) {
      return dashboardInspection(
        false,
        'DASHBOARD_SHEET_PROTECTION_CONTRACT',
        sheetAccess.subreason,
        Object.assign(
          { sheet_protection_count: 1 },
          sheetAccess.counts
        )
      );
    }
    if (typeof sheetProtection.getUnprotectedRanges !== 'function') {
      return dashboardInspection(
        false,
        'DASHBOARD_SHEET_PROTECTION_CONTRACT',
        'PROTECTION_API_UNAVAILABLE',
        { sheet_protection_count: 1 }
      );
    }
    var unprotectedRanges = sheetProtection.getUnprotectedRanges() || [];
    if (unprotectedRanges.length) {
      return dashboardInspection(
        false,
        'DASHBOARD_SHEET_PROTECTION_CONTRACT',
        'PROTECTION_UNPROTECTED_RANGE_PRESENT',
        {
          sheet_protection_count: 1,
          unprotected_range_count: unprotectedRanges.length
        }
      );
    }
    var rangeProtections = sheet.getProtections(
      SpreadsheetApp.ProtectionType.RANGE
    ) || [];
    var headerDescription = 'WORK_OS_V2_PHASE1_' +
      WorkOsConfig.SHEETS.DASHBOARD + '_HEADER_IDS';
    var headerProtections = rangeProtections.filter(function (protection) {
      return protection &&
        typeof protection.getDescription === 'function' &&
        protection.getDescription() === headerDescription;
    });
    if (headerProtections.length === 0 && rangeProtections.length === 0) {
      return dashboardInspection(
        false,
        'DASHBOARD_HEADER_PROTECTION_CONTRACT',
        'HEADER_PROTECTION_MISSING',
        { header_protection_count: 0 }
      );
    }
    if (headerProtections.length === 0) {
      return dashboardInspection(
        false,
        'DASHBOARD_FOREIGN_OR_OVERLAPPING_RANGE_PROTECTION',
        'HEADER_PROTECTION_DESCRIPTION_MISMATCH',
        {
          header_protection_count: 0,
          foreign_range_protection_count: rangeProtections.length
        }
      );
    }
    if (headerProtections.length !== 1) {
      return dashboardInspection(
        false,
        'DASHBOARD_HEADER_PROTECTION_CONTRACT',
        'HEADER_PROTECTION_DUPLICATE',
        { header_protection_count: headerProtections.length }
      );
    }
    if (rangeProtections.length !== 1) {
      return dashboardInspection(
        false,
        'DASHBOARD_FOREIGN_OR_OVERLAPPING_RANGE_PROTECTION',
        'FOREIGN_RANGE_PROTECTION_PRESENT',
        {
          header_protection_count: 1,
          foreign_range_protection_count: rangeProtections.length - 1
        }
      );
    }
    var headerProtection = headerProtections[0];
    if (!headerProtection ||
        typeof headerProtection.getRange !== 'function') {
      return dashboardInspection(
        false,
        'DASHBOARD_HEADER_PROTECTION_CONTRACT',
        'PROTECTION_API_UNAVAILABLE',
        { header_protection_count: 1 }
      );
    }
    if (!sameBounds(
      rangeBounds(headerProtection.getRange()),
      dashboardHeaderProtectionGeometry(width)
    )) {
      return dashboardInspection(
        false,
        'DASHBOARD_HEADER_PROTECTION_CONTRACT',
        'HEADER_PROTECTION_GEOMETRY_MISMATCH',
        { header_protection_count: 1 }
      );
    }
    if (typeof headerProtection.getRangeName === 'function' &&
        headerProtection.getRangeName() != null) {
      return dashboardInspection(
        false,
        'DASHBOARD_HEADER_PROTECTION_CONTRACT',
        'PROTECTION_NAMED_RANGE_ASSOCIATION',
        { header_protection_count: 1 }
      );
    }
    var headerAccess = inspectProtectionAccess(
      spreadsheet,
      headerProtection
    );
    if (!headerAccess.safe) {
      return dashboardInspection(
        false,
        'DASHBOARD_HEADER_PROTECTION_CONTRACT',
        headerAccess.subreason,
        Object.assign(
          { header_protection_count: 1 },
          headerAccess.counts
        )
      );
    }
    return dashboardInspection(
      true,
      '',
      '',
      Object.assign(
        {
          sheet_protection_count: 1,
          header_protection_count: 1,
          unprotected_range_count: 0,
          foreign_range_protection_count: 0
        },
        sheetAccess.counts
      ),
      sheetAccess.protection_access_mode
    );
  }

  function isDefaultDashboardBackground(value) {
    var normalized = String(value == null ? '' : value)
      .toLowerCase()
      .replace(/\s+/g, '');
    // Google Sheets can report the default white background in either hex or
    // RGB notation.  These are the same canonical unformatted surface, not
    // an invitation to accept arbitrary formatting.
    return normalized === '' ||
      normalized === '#ffffff' ||
      normalized === '#fff' ||
      normalized === 'white' ||
      normalized === 'rgb(255,255,255)' ||
      normalized === 'rgba(255,255,255,1)';
  }

  function isCanonicalSystemBlockNumberFormat(value) {
    return String(value == null ? '' : value) ===
      CANONICAL_SYSTEM_BLOCK_TEXT_FORMAT;
  }

  function matchesCanonicalLegacySeed(values) {
    if (!LEGACY_SEED_ROWS.length) {
      return false;
    }
    return LEGACY_SEED_ROWS.every(function (expected, index) {
      var actual = values[index] || [];
      return String(actual[0] == null ? '' : actual[0]) ===
          expected.metric_key &&
        String(actual[1] == null ? '' : actual[1]) ===
          expected.metric_value &&
        String(actual[2] == null ? '' : actual[2]) === expected.note;
    });
  }

  function createDashboardSurfaceSnapshot(
      spreadsheet,
      sheet,
      dataRange,
      rowCount,
      width) {
    var mergeBounds = [];
    var namedRangeBounds = [];
    var controlPlane = dashboardControlPlane(
      spreadsheet,
      sheet,
      width
    );
    if (typeof dataRange.getMergedRanges === 'function') {
      (dataRange.getMergedRanges() || []).forEach(function (range) {
        var bounds = rangeBounds(range);
        if (bounds) {
          mergeBounds.push(bounds);
        }
      });
    }
    var namedRangeUnknown = false;
    if (spreadsheet &&
        typeof spreadsheet.getNamedRanges === 'function') {
      (spreadsheet.getNamedRanges() || []).forEach(function (named) {
        var range = typeof named.getRange === 'function'
          ? named.getRange()
          : null;
        if (range &&
            typeof range.getSheet === 'function' &&
            range.getSheet() !== sheet) {
          return;
        }
        var bounds = rangeBounds(range);
        if (bounds) {
          namedRangeBounds.push(bounds);
        } else {
          namedRangeUnknown = true;
        }
      });
    }
    var hiddenColumnCount = 0;
    for (var physicalColumn = 1;
        physicalColumn <= width;
        physicalColumn += 1) {
      if (typeof sheet.isColumnHiddenByUser === 'function' &&
          sheet.isColumnHiddenByUser(physicalColumn)) {
        hiddenColumnCount += 1;
      }
    }
    return {
      values: rangeMatrix(
        dataRange,
        'getValues',
        rowCount,
        width,
        ''
      ),
      formulas: rangeMatrix(
        dataRange,
        'getFormulas',
        rowCount,
        width,
        ''
      ),
      notes: rangeMatrix(
        dataRange,
        'getNotes',
        rowCount,
        width,
        ''
      ),
      validations: rangeMatrix(
        dataRange,
        'getDataValidations',
        rowCount,
        width,
        null
      ),
      backgrounds: rangeMatrix(
        dataRange,
        'getBackgrounds',
        rowCount,
        width,
        '#ffffff'
      ),
      fontWeights: rangeMatrix(
        dataRange,
        'getFontWeights',
        rowCount,
        width,
        'normal'
      ),
      fontStyles: rangeMatrix(
        dataRange,
        'getFontStyles',
        rowCount,
        width,
        'normal'
      ),
      numberFormats: rangeMatrix(
        dataRange,
        'getNumberFormats',
        rowCount,
        width,
        'General'
      ),
      mergeBounds: mergeBounds,
      namedRangeBounds: namedRangeBounds,
      namedRangeUnknown: namedRangeUnknown,
      hiddenRows: {},
      hiddenColumnCount: hiddenColumnCount,
      controlPlane: controlPlane,
      sheet: sheet,
      width: width
    };
  }

  function snapshotRowIsHidden(snapshot, sourceRow) {
    if (Object.prototype.hasOwnProperty.call(
      snapshot.hiddenRows,
      sourceRow
    )) {
      return snapshot.hiddenRows[sourceRow];
    }
    var physicalRow = WorkOsConfig.DATA_START_ROW + sourceRow;
    var hidden = (
      typeof snapshot.sheet.isRowHiddenByUser === 'function' &&
      snapshot.sheet.isRowHiddenByUser(physicalRow)
    ) || (
      typeof snapshot.sheet.isRowHiddenByFilter === 'function' &&
      snapshot.sheet.isRowHiddenByFilter(physicalRow)
    );
    snapshot.hiddenRows[sourceRow] = Boolean(hidden);
    return snapshot.hiddenRows[sourceRow];
  }

  function inspectSnapshotDashboardSurface(
      snapshot,
      startIndex,
      rowCount,
      allowedValues,
      allowedMarkerNotes,
      inspectionMode) {
    if (!snapshot.controlPlane.safe) {
      return snapshot.controlPlane;
    }
    var targetBounds = {
      first_row: WorkOsConfig.DATA_START_ROW + startIndex,
      last_row: WorkOsConfig.DATA_START_ROW + startIndex +
        rowCount - 1,
      first_column: 1,
      last_column: snapshot.width
    };
    var counts = {
      named_range_count: 0,
      value_conflict_count: 0,
      formula_conflict_count: 0,
      validation_conflict_count: 0,
      note_conflict_count: 0,
      merge_conflict_count: 0,
      hidden_row_or_column_count: snapshot.hiddenColumnCount,
      background_conflict_count: 0,
      font_conflict_count: 0,
      number_format_conflict_count: 0
    };
    if (snapshot.namedRangeUnknown) {
      counts.named_range_count += 1;
    }
    for (var boundsIndex = 0;
        boundsIndex < snapshot.namedRangeBounds.length;
        boundsIndex += 1) {
      if (boundsOverlap(
        targetBounds,
        snapshot.namedRangeBounds[boundsIndex]
      )) {
        counts.named_range_count += 1;
      }
    }
    for (var mergeIndex = 0;
        mergeIndex < snapshot.mergeBounds.length;
        mergeIndex += 1) {
      if (boundsOverlap(
        targetBounds,
        snapshot.mergeBounds[mergeIndex]
      )) {
        counts.merge_conflict_count += 1;
      }
    }
    for (var rowOffset = 0; rowOffset < rowCount; rowOffset += 1) {
      var sourceRow = startIndex + rowOffset;
      for (var columnIndex = 0;
          columnIndex < snapshot.width;
          columnIndex += 1) {
        var valueAllowed = allowedValues &&
          allowedValues[rowOffset] &&
          allowedValues[rowOffset][columnIndex] === true;
        if (!valueAllowed &&
            String(snapshot.values[sourceRow][columnIndex] == null
              ? ''
              : snapshot.values[sourceRow][columnIndex]) !== '') {
          counts.value_conflict_count += 1;
        }
        if (String(
          snapshot.formulas[sourceRow][columnIndex] || ''
        ) !== '') {
          counts.formula_conflict_count += 1;
        }
        if (snapshot.validations[sourceRow][columnIndex] != null) {
          counts.validation_conflict_count += 1;
        }
        var note = String(
          snapshot.notes[sourceRow][columnIndex] || ''
        );
        var markerAllowed = allowedMarkerNotes &&
          allowedMarkerNotes[rowOffset] &&
          allowedMarkerNotes[rowOffset][columnIndex] === true &&
          note.indexOf(BLOCK_MARKER_PREFIX) === 0;
        if (note && !markerAllowed) {
          counts.note_conflict_count += 1;
        }
        if (!isDefaultDashboardBackground(
          snapshot.backgrounds[sourceRow][columnIndex]
        )) {
          counts.background_conflict_count += 1;
        }
        var fontWeight = String(
          snapshot.fontWeights[sourceRow][columnIndex] || ''
        ).toLowerCase();
        var fontStyle = String(
          snapshot.fontStyles[sourceRow][columnIndex] || ''
        ).toLowerCase();
        if ((fontWeight && fontWeight !== 'normal') ||
            (fontStyle && fontStyle !== 'normal')) {
          counts.font_conflict_count += 1;
        }
        if (!isCanonicalSystemBlockNumberFormat(
          snapshot.numberFormats[sourceRow][columnIndex]
        )) {
          counts.number_format_conflict_count += 1;
        }
      }
    }
    var surfaceResultOrder = [
      [
        'named_range_count',
        'DASHBOARD_FOREIGN_NAMED_RANGE',
        'FOREIGN_NAMED_RANGE_PRESENT'
      ],
      [
        'value_conflict_count',
        'DASHBOARD_VALUE_CONFLICT',
        'UNEXPECTED_VALUE_PRESENT'
      ],
      [
        'formula_conflict_count',
        'DASHBOARD_FORMULA_CONFLICT',
        'FORMULA_PRESENT'
      ],
      [
        'validation_conflict_count',
        'DASHBOARD_VALIDATION_CONFLICT',
        'VALIDATION_PRESENT'
      ],
      [
        'note_conflict_count',
        'DASHBOARD_NOTE_CONFLICT',
        'NOTE_PRESENT'
      ],
      [
        'merge_conflict_count',
        'DASHBOARD_MERGE_CONFLICT',
        'MERGE_PRESENT'
      ],
      [
        'background_conflict_count',
        'DASHBOARD_BACKGROUND_CONFLICT',
        'BACKGROUND_NONCANONICAL'
      ],
      [
        'font_conflict_count',
        'DASHBOARD_FONT_CONFLICT',
        'FONT_NONCANONICAL'
      ],
      [
        'number_format_conflict_count',
        'DASHBOARD_NUMBER_FORMAT_CONFLICT',
        'NUMBER_FORMAT_NONCANONICAL'
      ]
    ];
    for (var resultIndex = 0;
        resultIndex < surfaceResultOrder.length;
        resultIndex += 1) {
      var item = surfaceResultOrder[resultIndex];
      if (item[0] === 'number_format_conflict_count' &&
          inspectionMode === SETUP_NUMBER_FORMAT_NORMALIZATION_MODE) {
        continue;
      }
      if (counts[item[0]] > 0) {
        return dashboardInspection(
          false,
          item[1],
          item[2],
          counts
        );
      }
    }
    for (var hiddenRowOffset = 0;
        hiddenRowOffset < rowCount;
        hiddenRowOffset += 1) {
      if (snapshotRowIsHidden(
        snapshot,
        startIndex + hiddenRowOffset
      )) {
        counts.hidden_row_or_column_count += 1;
      }
    }
    if (counts.hidden_row_or_column_count > 0) {
      return dashboardInspection(
        false,
        'DASHBOARD_HIDDEN_ROW_OR_COLUMN',
        'ROW_OR_COLUMN_HIDDEN',
        counts
      );
    }
    return dashboardInspection(
      true,
      '',
      '',
      counts,
      snapshot.controlPlane.protection_access_mode
    );
  }

  function dashboardInstanceId() {
    var instanceId = '';
    if (typeof PropertiesService !== 'undefined' &&
        PropertiesService &&
        typeof PropertiesService.getScriptProperties === 'function') {
      instanceId = String(
        PropertiesService.getScriptProperties().getProperty(
          WorkOsConfig.PROPERTIES.INSTANCE_ID
        ) || ''
      );
    }
    if (!/^ins_[0-9a-f]{32}$/.test(instanceId)) {
      if (WorkOsConfig.TEST_MODE) {
        return 'ins_00000000000000000000000000000000';
      }
      throw dashboardLayoutConflict(
        'DASHBOARD_SEED_OR_MARKER_CONTRACT',
        'MARKER_NONCANONICAL'
      );
    }
    return instanceId;
  }

  function dashboardMarker(edge, startRow, endRow, keys) {
    return BLOCK_MARKER_PREFIX + JSON.stringify({
      owner: BLOCK_MARKER_OWNER,
      marker_version: BLOCK_MARKER_VERSION,
      edge: edge,
      instance_id: dashboardInstanceId(),
      start_row: startRow,
      end_row: endRow,
      rows: keys.length,
      columns: 3,
      metric_order_hash: WorkOsUtilities.sha256Hex(
        JSON.stringify(keys)
      )
    });
  }

  function parseDashboardMarker(note) {
    var text = String(note || '');
    if (text.indexOf(BLOCK_MARKER_PREFIX) !== 0) {
      return null;
    }
    try {
      return JSON.parse(text.slice(BLOCK_MARKER_PREFIX.length));
    } catch (error) {
      throw dashboardLayoutConflict(
        'DASHBOARD_SEED_OR_MARKER_CONTRACT',
        'MARKER_NONCANONICAL'
      );
    }
  }

  function inspectLayoutInternal(spreadsheet, desiredKeys, inspectionMode) {
    var keys = desiredKeys || METRIC_ORDER.slice();
    var sheet = spreadsheet.getSheetByName(
      WorkOsConfig.SHEETS.DASHBOARD
    );
    var width = WorkOsSchemas.getSheetSchema(
      WorkOsConfig.SHEETS.DASHBOARD
    ).length;
    if (!sheet || width !== 3 || !keys.length) {
      throw dashboardLayoutConflict(
        'DASHBOARD_SEED_OR_MARKER_CONTRACT',
        'DASHBOARD_SHAPE_NONCANONICAL'
      );
    }
    var desired = {};
    keys.forEach(function (key) {
      if (!key || desired[key]) {
        throw dashboardLayoutConflict(
          'DASHBOARD_SEED_OR_MARKER_CONTRACT',
          'DUPLICATE_METRIC_KEY'
        );
      }
      desired[key] = true;
    });
    var dataRowCount = Math.max(
      0,
      sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
    );
    var dataRange = sheet.getRange(
      WorkOsConfig.DATA_START_ROW,
      1,
      dataRowCount,
      width
    );
    var surface = createDashboardSurfaceSnapshot(
      spreadsheet,
      sheet,
      dataRange,
      dataRowCount,
      width
    );
    var values = surface.values;
    var notes = surface.notes;
    var systemRows = [];
    var seen = {};
    var markerCells = [];
    for (var rowIndex = 0; rowIndex < dataRowCount; rowIndex += 1) {
      var key = String(values[rowIndex][0] || '');
      if (desired[key]) {
        if (seen[key]) {
          throw dashboardLayoutConflict(
            'DASHBOARD_SEED_OR_MARKER_CONTRACT',
            'DUPLICATE_METRIC_KEY'
          );
        }
        seen[key] = true;
        systemRows.push({ index: rowIndex, key: key });
      }
      for (var columnIndex = 0;
          columnIndex < width;
          columnIndex += 1) {
        if (String(notes[rowIndex][columnIndex] || '')
            .indexOf(BLOCK_MARKER_PREFIX) === 0) {
          markerCells.push({
            index: rowIndex,
            column: columnIndex,
            payload: parseDashboardMarker(
              notes[rowIndex][columnIndex]
            )
          });
        }
      }
    }
    if (markerCells.length) {
      if (markerCells.length !== 2) {
        throw dashboardLayoutConflict(
          'DASHBOARD_SEED_OR_MARKER_CONTRACT',
          'MARKER_NONCANONICAL'
        );
      }
      var start = markerCells.filter(function (item) {
        return item.payload && item.payload.edge === 'START';
      })[0];
      var end = markerCells.filter(function (item) {
        return item.payload && item.payload.edge === 'END';
      })[0];
      if (!start || !end || start.column !== 0 || end.column !== 0 ||
          end.index !== start.index + keys.length - 1) {
        throw dashboardLayoutConflict(
          'DASHBOARD_SEED_OR_MARKER_CONTRACT',
          'MARKER_NONCANONICAL'
        );
      }
      var startRow = WorkOsConfig.DATA_START_ROW + start.index;
      var endRow = startRow + keys.length - 1;
      var orderHash = WorkOsUtilities.sha256Hex(JSON.stringify(keys));
      [start.payload, end.payload].forEach(function (payload) {
        if (payload.owner !== BLOCK_MARKER_OWNER ||
            payload.marker_version !== BLOCK_MARKER_VERSION ||
            payload.instance_id !== dashboardInstanceId() ||
            payload.start_row !== startRow ||
            payload.end_row !== endRow ||
            payload.rows !== keys.length ||
            payload.columns !== width ||
            payload.metric_order_hash !== orderHash) {
          throw dashboardLayoutConflict(
            'DASHBOARD_SEED_OR_MARKER_CONTRACT',
            'MARKER_NONCANONICAL'
          );
        }
      });
      for (var ownedIndex = 0;
          ownedIndex < keys.length;
          ownedIndex += 1) {
        if (String(values[start.index + ownedIndex][0] || '') !==
            keys[ownedIndex]) {
          throw dashboardLayoutConflict(
            'DASHBOARD_SEED_OR_MARKER_CONTRACT',
            'MARKER_NONCANONICAL'
          );
        }
      }
      var allowedValues = emptyMatrix(keys.length, width, true);
      var allowedNotes = emptyMatrix(keys.length, width, false);
      allowedNotes[0][0] = true;
      allowedNotes[keys.length - 1][0] = true;
      var ownedInspection = inspectSnapshotDashboardSurface(
        surface,
        start.index,
        keys.length,
        allowedValues,
        allowedNotes,
        inspectionMode
      );
      if (!ownedInspection.safe) {
        throwDashboardInspection(ownedInspection);
      }
      return {
        status: 'OWNED',
        writable: true,
        block_start_row: startRow,
        block_end_row: endRow,
        protection_access_mode:
          surface.controlPlane.protection_access_mode
      };
    }

    var fullStart = -1;
    for (var candidate = 0;
        candidate + keys.length <= dataRowCount;
        candidate += 1) {
      var exact = true;
      for (var keyIndex = 0;
          keyIndex < keys.length;
          keyIndex += 1) {
        if (String(values[candidate + keyIndex][0] || '') !==
            keys[keyIndex]) {
          exact = false;
          break;
        }
      }
      if (exact) {
        fullStart = candidate;
        break;
      }
    }
    if (fullStart !== -1) {
      if (systemRows.length !== keys.length) {
        throw dashboardLayoutConflict(
          'DASHBOARD_SEED_OR_MARKER_CONTRACT',
          'DUPLICATE_METRIC_KEY'
        );
      }
      var fullInspection = inspectSnapshotDashboardSurface(
        surface,
        fullStart,
        keys.length,
        emptyMatrix(keys.length, width, true),
        null,
        inspectionMode
      );
      if (!fullInspection.safe) {
        throwDashboardInspection(fullInspection);
      }
      return {
        status: 'LEGACY_FULL',
        writable: true,
        block_start_row: WorkOsConfig.DATA_START_ROW + fullStart,
        block_end_row:
          WorkOsConfig.DATA_START_ROW + fullStart + keys.length - 1,
        protection_access_mode:
          surface.controlPlane.protection_access_mode
      };
    }

    var legacySeed = systemRows.length === LEGACY_SEED_KEYS.length &&
      LEGACY_SEED_KEYS.every(function (key, index) {
        return systemRows[index] &&
          systemRows[index].index === index &&
          systemRows[index].key === key;
      }) && matchesCanonicalLegacySeed(values);
    if (systemRows.length && !legacySeed) {
      throw dashboardLayoutConflict(
        'DASHBOARD_SEED_OR_MARKER_CONTRACT',
        'SEED_VALUES_NONCANONICAL'
      );
    }
    if (legacySeed) {
      var seedAllowed = emptyMatrix(keys.length, width, false);
      for (var seedIndex = 0;
          seedIndex < LEGACY_SEED_KEYS.length;
          seedIndex += 1) {
        seedAllowed[seedIndex] = [true, true, true];
      }
      var seedInspection = inspectSnapshotDashboardSurface(
        surface,
        0,
        keys.length,
        seedAllowed,
        null,
        inspectionMode
      );
      if (!seedInspection.safe) {
        throwDashboardInspection(seedInspection);
      }
      return {
        status: 'LEGACY_SEED',
        writable: true,
        block_start_row: WorkOsConfig.DATA_START_ROW,
        block_end_row:
          WorkOsConfig.DATA_START_ROW + keys.length - 1,
        protection_access_mode:
          surface.controlPlane.protection_access_mode
      };
    }

    var firstUnsafeInspection = null;
    for (var emptyStart = 0;
        emptyStart + keys.length <= dataRowCount;
        emptyStart += 1) {
      var emptyInspection = inspectSnapshotDashboardSurface(
        surface,
        emptyStart,
        keys.length,
        null,
        null,
        inspectionMode
      );
      if (emptyInspection.safe) {
        return {
          status: 'EMPTY',
          writable: true,
          block_start_row:
            WorkOsConfig.DATA_START_ROW + emptyStart,
          block_end_row:
            WorkOsConfig.DATA_START_ROW + emptyStart +
              keys.length - 1,
          protection_access_mode:
            surface.controlPlane.protection_access_mode
        };
      }
      if (!firstUnsafeInspection) {
        firstUnsafeInspection = emptyInspection;
      }
    }
    firstUnsafeInspection = firstUnsafeInspection || dashboardInspection(
      false,
      'DASHBOARD_SEED_OR_MARKER_CONTRACT',
      'NO_SAFE_BLOCK',
      {}
    );
    return {
      status: 'NO_SAFE_BLOCK',
      writable: false,
      block_start_row: 0,
      block_end_row: 0,
      conflict_reason_code: firstUnsafeInspection.reason,
      conflict_subreason_code: firstUnsafeInspection.subreason,
      conflict_counts: firstUnsafeInspection.counts
    };
  }

  function inspectLayout(spreadsheet, desiredKeys) {
    return inspectLayoutInternal(spreadsheet, desiredKeys, null);
  }

  function normalizeSystemBlockNumberFormatForSetup(spreadsheet) {
    assertModuleContract();
    var keys = METRIC_ORDER.slice();
    var checkedCellCount = keys.length * 3;
    var layout = inspectLayoutInternal(
      spreadsheet,
      keys,
      SETUP_NUMBER_FORMAT_NORMALIZATION_MODE
    );
    if (!layout.writable || [
      'LEGACY_SEED',
      'LEGACY_FULL',
      'OWNED'
    ].indexOf(layout.status) === -1 ||
        layout.block_end_row - layout.block_start_row + 1 !== keys.length) {
      throw dashboardLayoutConflict(
        layout.conflict_reason_code || 'DASHBOARD_SEED_OR_MARKER_CONTRACT',
        layout.conflict_subreason_code || 'NO_SAFE_BLOCK',
        layout.conflict_counts || {}
      );
    }
    var sheet = spreadsheet.getSheetByName(WorkOsConfig.SHEETS.DASHBOARD);
    var range = sheet.getRange(
      layout.block_start_row,
      1,
      keys.length,
      3
    );
    if (typeof range.getNumberFormats !== 'function' ||
        typeof range.setNumberFormat !== 'function') {
      throw dashboardLayoutConflict(
        'DASHBOARD_NUMBER_FORMAT_CONFLICT',
        'NUMBER_FORMAT_API_UNAVAILABLE',
        { number_format_conflict_count: keys.length * 3 }
      );
    }
    var formats = range.getNumberFormats();
    var noncanonicalCount = countNoncanonicalFormats(
      formats,
      keys.length,
      3
    );
    if (noncanonicalCount === 0) {
      var canonicalEvidence = normalizationEvidence(
        'CANONICAL',
        false,
        false,
        true,
        checkedCellCount,
        0
      );
      canonicalEvidence.row_count = keys.length;
      canonicalEvidence.column_count = 3;
      canonicalEvidence.layout_status = layout.status;
      return canonicalEvidence;
    }
    if (typeof SpreadsheetApp === 'undefined' ||
        !SpreadsheetApp ||
        typeof SpreadsheetApp.flush !== 'function') {
      throw numberFormatPostconditionError(
        normalizationEvidence(
          'FAILED_POSTCONDITION',
          false,
          false,
          false,
          checkedCellCount,
          noncanonicalCount
        ),
        'NUMBER_FORMAT_FLUSH_UNAVAILABLE'
      );
    }
    range.setNumberFormat(CANONICAL_SYSTEM_BLOCK_TEXT_FORMAT);
    try {
      SpreadsheetApp.flush();
    } catch (flushError) {
      throw numberFormatPostconditionError(
        normalizationEvidence(
          'FAILED_POSTCONDITION',
          true,
          false,
          false,
          checkedCellCount,
          noncanonicalCount
        ),
        'NUMBER_FORMAT_FLUSH_UNAVAILABLE'
      );
    }
    // Reacquire a fresh Range after the write boundary. Apps Script may bundle
    // Spreadsheet writes, so a pre-flush Range must never prove postcondition.
    var freshRange;
    try {
      freshRange = sheet.getRange(
        layout.block_start_row,
        1,
        keys.length,
        3
      );
    } catch (freshRangeError) {
      throw numberFormatPostconditionError(
        normalizationEvidence(
          'FAILED_POSTCONDITION',
          true,
          true,
          false,
          checkedCellCount,
          checkedCellCount
        ),
        'NUMBER_FORMAT_POSTCONDITION_FAILED'
      );
    }
    if (!freshRange ||
        typeof freshRange.getNumberFormats !== 'function') {
      throw numberFormatPostconditionError(
        normalizationEvidence(
          'FAILED_POSTCONDITION',
          true,
          true,
          false,
          checkedCellCount,
          checkedCellCount
        ),
        'NUMBER_FORMAT_POSTCONDITION_FAILED'
      );
    }
    var postconditionFormats;
    try {
      postconditionFormats = freshRange.getNumberFormats();
    } catch (postconditionReadError) {
      throw numberFormatPostconditionError(
        normalizationEvidence(
          'FAILED_POSTCONDITION',
          true,
          true,
          false,
          checkedCellCount,
          checkedCellCount
        ),
        'NUMBER_FORMAT_POSTCONDITION_FAILED'
      );
    }
    var postconditionNoncanonicalCount = countNoncanonicalFormats(
      postconditionFormats,
      keys.length,
      3
    );
    if (postconditionNoncanonicalCount !== 0) {
      throw numberFormatPostconditionError(
        normalizationEvidence(
          'FAILED_POSTCONDITION',
          true,
          true,
          false,
          checkedCellCount,
          postconditionNoncanonicalCount
        ),
        'NUMBER_FORMAT_POSTCONDITION_FAILED'
      );
    }
    // The strict read-only inspector still verifies the complete Dashboard
    // surface after the format postcondition is visible.
    var verified = inspectLayout(spreadsheet, keys);
    if (!verified.writable || verified.block_start_row !==
        layout.block_start_row || verified.block_end_row !==
        layout.block_end_row) {
      throw dashboardLayoutConflict(
        verified.conflict_reason_code || 'DASHBOARD_NUMBER_FORMAT_CONFLICT',
        verified.conflict_subreason_code || 'NUMBER_FORMAT_NONCANONICAL',
        verified.conflict_counts || {}
      );
    }
    var normalizedEvidence = normalizationEvidence(
      'NORMALIZED',
      true,
      true,
      true,
      checkedCellCount,
      0
    );
    normalizedEvidence.row_count = keys.length;
    normalizedEvidence.column_count = 3;
    normalizedEvidence.layout_status = verified.status;
    return normalizedEvidence;
  }

  function safeUpsertMetricRows(spreadsheet, desiredRows) {
    if (!desiredRows.length) {
      return { updated_count: 0 };
    }
    var keys = desiredRows.map(function (row) {
      return String(row[0] || '');
    });
    if (keys.length !== METRIC_ORDER.length ||
        JSON.stringify(keys) !== JSON.stringify(METRIC_ORDER)) {
      throw dashboardLayoutConflict(
        'DASHBOARD_SEED_OR_MARKER_CONTRACT',
        'DUPLICATE_METRIC_KEY'
      );
    }
    var sheet = spreadsheet.getSheetByName(
      WorkOsConfig.SHEETS.DASHBOARD
    );
    var layout = inspectLayout(spreadsheet, keys);
    if (!layout.writable) {
      throw dashboardLayoutConflict(
        layout.conflict_reason_code,
        layout.conflict_subreason_code,
        layout.conflict_counts
      );
    }
    var range = sheet.getRange(
      layout.block_start_row,
      1,
      desiredRows.length,
      3
    );
    range.setValues(desiredRows);
    if (layout.status !== 'OWNED') {
      if (typeof range.setNotes !== 'function') {
        throw dashboardLayoutConflict(
          'DASHBOARD_SEED_OR_MARKER_CONTRACT',
          'MARKER_NONCANONICAL'
        );
      }
      var markerNotes = emptyMatrix(
        desiredRows.length,
        3,
        ''
      );
      markerNotes[0][0] = dashboardMarker(
        'START',
        layout.block_start_row,
        layout.block_end_row,
        keys
      );
      markerNotes[markerNotes.length - 1][0] = dashboardMarker(
        'END',
        layout.block_start_row,
        layout.block_end_row,
        keys
      );
      range.setNotes(markerNotes);
    }
    return {
      updated_count: desiredRows.length,
      custom_rows_preserved: true,
      system_block_start_row: layout.block_start_row,
      layout_status: layout.status
    };
  }

  function refresh(spreadsheet, options) {
    var settings = options || {};
    if (Object.keys(settings).length && !WorkOsConfig.TEST_MODE) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        'DASHBOARD',
        false,
        'Dashboardへの依存注入はTest modeだけで利用できます。'
      );
    }
    var target = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
    if (!target) {
      throw new WorkOsAppError(
        'E_SETUP_NOT_BOUND',
        'DASHBOARD',
        false,
        'Bound Spreadsheetから実行してください。'
      );
    }
    var budget = settings.budget ||
      WorkOsUtilities.createSoftBudget(
        WorkOsConfig.DASHBOARD_SOFT_LIMIT_MS,
        Date.now()
      );
    var boundedSettings = {};
    Object.keys(settings).forEach(function (key) {
      boundedSettings[key] = settings[key];
    });
    boundedSettings.budget = budget;
    var quick = settings.quick_diagnostic ||
      WorkOsDiagnostics.runQuickDiagnostic(
        target,
        { budget: budget }
      );
    if (quick.status === 'FAIL') {
      var layoutFailed = (quick.checks || []).some(function (item) {
        return item &&
          item.id === 'DASHBOARD_LAYOUT_OWNERSHIP' &&
          item.status === 'FAIL';
      });
      throw new WorkOsAppError(
        layoutFailed
          ? 'E_DASHBOARD_LAYOUT_CONFLICT'
          : 'E_DASHBOARD_DIAGNOSTIC_FAILED',
        'DASHBOARD',
        false,
        'Quick Diagnostic FAILのためDashboard更新を停止しました。'
      );
    }
    var metrics = collectOperationalMetrics(target, boundedSettings);
    assertBudget(budget, 'QUICK_DIAGNOSTIC');
    assertBudget(budget, 'AUTOMATION_STATUS');
    var automation = settings.automation_status ||
      WorkOsAutomation.getDiagnosticAutomationStatus();
    var aiReadiness = settings.ai_readiness ||
      WorkOsAiAdapter.getProductionReadiness();
    var desiredRows = buildMetricRows(
      metrics,
      automation,
      quick,
      aiReadiness
    );
    assertBudget(budget, 'DASHBOARD_WRITE');
    var writeResult = WorkOsUtilities.withScriptLock(function () {
      return safeUpsertMetricRows(target, desiredRows);
    }, WorkOsConfig.LOCK_WAIT_MS);
    return {
      status: quick.status === 'FAIL' ? 'WARN' : 'REFRESHED',
      metric_count: desiredRows.length,
      source_read_counts: metrics.source_read_counts,
      quick_diagnostic: String(quick.status || 'NOT_EXECUTED'),
      automation_status: String(automation.status || 'UNKNOWN'),
      external_services_called: false,
      task_business_fields_written: false,
      dashboard_write: writeResult
    };
  }

  return Object.freeze({
    MODULE_CONTRACT_ID: MODULE_CONTRACT_ID,
    METRIC_ORDER: METRIC_ORDER,
    collectOperationalMetrics: collectOperationalMetrics,
    buildMetricRows: buildMetricRows,
    inspectLayout: inspectLayout,
    normalizeSystemBlockNumberFormatForSetup:
      normalizeSystemBlockNumberFormatForSetup,
    upsertMetricRows: safeUpsertMetricRows,
    refresh: refresh
  });
}());

function refreshOperationalDashboard() {
  return WorkOsDashboard.refresh(
    SpreadsheetApp.getActiveSpreadsheet()
  );
}
