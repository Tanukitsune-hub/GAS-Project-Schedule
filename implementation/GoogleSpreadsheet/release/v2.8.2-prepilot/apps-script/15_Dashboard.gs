/**
 * Phase 7 lightweight operational Dashboard.
 *
 * Refresh is explicit and bounded. It reads operational Sheets and writes
 * aggregate status only; no Task title, sender, subject, Message ID, Calendar
 * ID, credential reference or external payload is copied to the Dashboard.
 */
var WorkOsDashboard = (function () {
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
  var LEGACY_SEED_KEYS = Object.freeze([
    'AUTOMATION_STATUS',
    'SYSTEM_HEALTH',
    'QUICK_DIAGNOSTIC'
  ]);

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

  function dashboardLayoutConflict() {
    return new WorkOsAppError(
      'E_DASHBOARD_LAYOUT_CONFLICT',
      'DASHBOARD',
      false,
      'Dashboardのsystem領域と利用者領域を安全に区別できないため更新を停止しました。'
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

  function matrixSome(matrix, predicate) {
    for (var row = 0; row < matrix.length; row += 1) {
      for (var column = 0; column < matrix[row].length; column += 1) {
        if (predicate(matrix[row][column])) {
          return true;
        }
      }
    }
    return false;
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

  function isOwnedDashboardSheetProtection(protection) {
    if (!protection ||
        typeof protection.getDescription !== 'function' ||
        protection.getDescription() !==
          OWNED_SHEET_PROTECTION_DESCRIPTION) {
      return false;
    }
    if (typeof protection.isWarningOnly === 'function' &&
        protection.isWarningOnly()) {
      return false;
    }
    return typeof protection.getUnprotectedRanges !== 'function' ||
      protection.getUnprotectedRanges().length === 0;
  }

  function rangeHasProtectionOrMarker(spreadsheet, sheet, range) {
    var targetBounds = rangeBounds(range);
    if (typeof sheet.getProtections === 'function' &&
        typeof SpreadsheetApp !== 'undefined' &&
        SpreadsheetApp.ProtectionType) {
      var sheetProtections = sheet.getProtections(
        SpreadsheetApp.ProtectionType.SHEET
      ) || [];
      var unknownSheetProtection = sheetProtections.some(function (
          protection
      ) {
        return !isOwnedDashboardSheetProtection(protection);
      });
      if (unknownSheetProtection) {
        return true;
      }
      var rangeProtections = sheet.getProtections(
        SpreadsheetApp.ProtectionType.RANGE
      ) || [];
      for (var protectionIndex = 0;
          protectionIndex < rangeProtections.length;
          protectionIndex += 1) {
        var protectedRange =
          typeof rangeProtections[protectionIndex].getRange === 'function'
            ? rangeProtections[protectionIndex].getRange()
            : null;
        if (boundsOverlap(targetBounds, rangeBounds(protectedRange))) {
          return true;
        }
      }
    }
    if (spreadsheet &&
        typeof spreadsheet.getNamedRanges === 'function') {
      var namedRanges = spreadsheet.getNamedRanges() || [];
      for (var namedIndex = 0;
          namedIndex < namedRanges.length;
          namedIndex += 1) {
        var namedRange =
          typeof namedRanges[namedIndex].getRange === 'function'
            ? namedRanges[namedIndex].getRange()
            : null;
        if (namedRange &&
            typeof namedRange.getSheet === 'function' &&
            namedRange.getSheet() !== sheet) {
          continue;
        }
        if (boundsOverlap(targetBounds, rangeBounds(namedRange))) {
          return true;
        }
      }
    }
    return false;
  }

  function rangeHasUnsafeDashboardSurface(
      spreadsheet,
      sheet,
      startRow,
      rowCount,
      width,
      allowedValues,
      allowedMarkerNotes) {
    var range = sheet.getRange(startRow, 1, rowCount, width);
    var values = rangeMatrix(
      range,
      'getValues',
      rowCount,
      width,
      ''
    );
    var formulas = rangeMatrix(
      range,
      'getFormulas',
      rowCount,
      width,
      ''
    );
    var notes = rangeMatrix(
      range,
      'getNotes',
      rowCount,
      width,
      ''
    );
    var validations = rangeMatrix(
      range,
      'getDataValidations',
      rowCount,
      width,
      null
    );
    if (matrixSome(formulas, function (value) {
      return String(value || '') !== '';
    }) ||
        matrixSome(validations, function (value) {
          return value != null;
        })) {
      return true;
    }
    for (var rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      for (var columnIndex = 0;
          columnIndex < width;
          columnIndex += 1) {
        var valueAllowed = allowedValues &&
          allowedValues[rowIndex] &&
          allowedValues[rowIndex][columnIndex] === true;
        if (!valueAllowed &&
            String(values[rowIndex][columnIndex] == null
              ? ''
              : values[rowIndex][columnIndex]) !== '') {
          return true;
        }
        var note = String(notes[rowIndex][columnIndex] || '');
        var markerAllowed = allowedMarkerNotes &&
          allowedMarkerNotes[rowIndex] &&
          allowedMarkerNotes[rowIndex][columnIndex] === true &&
          note.indexOf(BLOCK_MARKER_PREFIX) === 0;
        if (note && !markerAllowed) {
          return true;
        }
      }
    }
    if (typeof range.getMergedRanges === 'function' &&
        (range.getMergedRanges() || []).length) {
      return true;
    }
    if (rangeHasProtectionOrMarker(spreadsheet, sheet, range)) {
      return true;
    }
    for (var physicalRow = startRow;
        physicalRow < startRow + rowCount;
        physicalRow += 1) {
      if ((typeof sheet.isRowHiddenByUser === 'function' &&
           sheet.isRowHiddenByUser(physicalRow)) ||
          (typeof sheet.isRowHiddenByFilter === 'function' &&
           sheet.isRowHiddenByFilter(physicalRow))) {
        return true;
      }
    }
    for (var physicalColumn = 1;
        physicalColumn <= width;
        physicalColumn += 1) {
      if (typeof sheet.isColumnHiddenByUser === 'function' &&
          sheet.isColumnHiddenByUser(physicalColumn)) {
        return true;
      }
    }
    var backgrounds = rangeMatrix(
      range,
      'getBackgrounds',
      rowCount,
      width,
      '#ffffff'
    );
    var fontWeights = rangeMatrix(
      range,
      'getFontWeights',
      rowCount,
      width,
      'normal'
    );
    var fontStyles = rangeMatrix(
      range,
      'getFontStyles',
      rowCount,
      width,
      'normal'
    );
    var numberFormats = rangeMatrix(
      range,
      'getNumberFormats',
      rowCount,
      width,
      'General'
    );
    return matrixSome(backgrounds, function (value) {
      var normalized = String(value || '').toLowerCase();
      return normalized && normalized !== '#ffffff' &&
        normalized !== 'white';
    }) ||
      matrixSome(fontWeights, function (value) {
        return String(value || '').toLowerCase() === 'bold';
      }) ||
      matrixSome(fontStyles, function (value) {
        return String(value || '').toLowerCase() === 'italic';
      }) ||
      matrixSome(numberFormats, function (value) {
        var normalized = String(value || '');
        return normalized && normalized !== 'General' &&
          normalized !== '@';
      });
  }

  function createDashboardSurfaceSnapshot(
      spreadsheet,
      sheet,
      dataRange,
      rowCount,
      width) {
    var unsafeBounds = [];
    if (typeof dataRange.getMergedRanges === 'function') {
      (dataRange.getMergedRanges() || []).forEach(function (range) {
        var bounds = rangeBounds(range);
        if (bounds) {
          unsafeBounds.push(bounds);
        }
      });
    }
    var sheetProtected = false;
    if (typeof SpreadsheetApp !== 'undefined' &&
        SpreadsheetApp &&
        SpreadsheetApp.ProtectionType &&
        typeof sheet.getProtections === 'function') {
      sheetProtected = (sheet.getProtections(
        SpreadsheetApp.ProtectionType.SHEET
      ) || []).some(function (protection) {
        return !isOwnedDashboardSheetProtection(protection);
      });
      (sheet.getProtections(
        SpreadsheetApp.ProtectionType.RANGE
      ) || []).forEach(function (protection) {
        var range = typeof protection.getRange === 'function'
          ? protection.getRange()
          : null;
        var bounds = rangeBounds(range);
        if (bounds) {
          unsafeBounds.push(bounds);
        }
      });
    }
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
          unsafeBounds.push(bounds);
        }
      });
    }
    var hiddenColumn = false;
    for (var physicalColumn = 1;
        physicalColumn <= width;
        physicalColumn += 1) {
      if (typeof sheet.isColumnHiddenByUser === 'function' &&
          sheet.isColumnHiddenByUser(physicalColumn)) {
        hiddenColumn = true;
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
      unsafeBounds: unsafeBounds,
      hiddenRows: {},
      hiddenColumn: hiddenColumn,
      sheetProtected: sheetProtected,
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

  function snapshotHasUnsafeDashboardSurface(
      snapshot,
      startIndex,
      rowCount,
      allowedValues,
      allowedMarkerNotes) {
    if (snapshot.sheetProtected || snapshot.hiddenColumn) {
      return true;
    }
    var targetBounds = {
      first_row: WorkOsConfig.DATA_START_ROW + startIndex,
      last_row: WorkOsConfig.DATA_START_ROW + startIndex +
        rowCount - 1,
      first_column: 1,
      last_column: snapshot.width
    };
    for (var boundsIndex = 0;
        boundsIndex < snapshot.unsafeBounds.length;
        boundsIndex += 1) {
      if (boundsOverlap(
        targetBounds,
        snapshot.unsafeBounds[boundsIndex]
      )) {
        return true;
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
          return true;
        }
        if (String(
          snapshot.formulas[sourceRow][columnIndex] || ''
        ) !== '' ||
            snapshot.validations[sourceRow][columnIndex] != null) {
          return true;
        }
        var note = String(
          snapshot.notes[sourceRow][columnIndex] || ''
        );
        var markerAllowed = allowedMarkerNotes &&
          allowedMarkerNotes[rowOffset] &&
          allowedMarkerNotes[rowOffset][columnIndex] === true &&
          note.indexOf(BLOCK_MARKER_PREFIX) === 0;
        if (note && !markerAllowed) {
          return true;
        }
        var background = String(
          snapshot.backgrounds[sourceRow][columnIndex] || ''
        ).toLowerCase();
        if (background && background !== '#ffffff' &&
            background !== 'white') {
          return true;
        }
        if (String(
          snapshot.fontWeights[sourceRow][columnIndex] || ''
        ).toLowerCase() === 'bold' ||
            String(
              snapshot.fontStyles[sourceRow][columnIndex] || ''
            ).toLowerCase() === 'italic') {
          return true;
        }
        var numberFormat = String(
          snapshot.numberFormats[sourceRow][columnIndex] || ''
        );
        if (numberFormat && numberFormat !== 'General' &&
            numberFormat !== '@') {
          return true;
        }
      }
    }
    for (var hiddenRowOffset = 0;
        hiddenRowOffset < rowCount;
        hiddenRowOffset += 1) {
      if (snapshotRowIsHidden(
        snapshot,
        startIndex + hiddenRowOffset
      )) {
        return true;
      }
    }
    return false;
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
      throw dashboardLayoutConflict();
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
      throw dashboardLayoutConflict();
    }
  }

  function inspectLayout(spreadsheet, desiredKeys) {
    var keys = desiredKeys || METRIC_ORDER.slice();
    var sheet = spreadsheet.getSheetByName(
      WorkOsConfig.SHEETS.DASHBOARD
    );
    var width = WorkOsSchemas.getSheetSchema(
      WorkOsConfig.SHEETS.DASHBOARD
    ).length;
    if (!sheet || width !== 3 || !keys.length) {
      throw dashboardLayoutConflict();
    }
    var desired = {};
    keys.forEach(function (key) {
      if (!key || desired[key]) {
        throw dashboardLayoutConflict();
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
          throw dashboardLayoutConflict();
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
        throw dashboardLayoutConflict();
      }
      var start = markerCells.filter(function (item) {
        return item.payload && item.payload.edge === 'START';
      })[0];
      var end = markerCells.filter(function (item) {
        return item.payload && item.payload.edge === 'END';
      })[0];
      if (!start || !end || start.column !== 0 || end.column !== 0 ||
          end.index !== start.index + keys.length - 1) {
        throw dashboardLayoutConflict();
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
          throw dashboardLayoutConflict();
        }
      });
      for (var ownedIndex = 0;
          ownedIndex < keys.length;
          ownedIndex += 1) {
        if (String(values[start.index + ownedIndex][0] || '') !==
            keys[ownedIndex]) {
          throw dashboardLayoutConflict();
        }
      }
      var allowedValues = emptyMatrix(keys.length, width, true);
      var allowedNotes = emptyMatrix(keys.length, width, false);
      allowedNotes[0][0] = true;
      allowedNotes[keys.length - 1][0] = true;
      if (snapshotHasUnsafeDashboardSurface(
        surface,
        start.index,
        keys.length,
        allowedValues,
        allowedNotes
      )) {
        throw dashboardLayoutConflict();
      }
      return {
        status: 'OWNED',
        writable: true,
        block_start_row: startRow,
        block_end_row: endRow
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
      if (systemRows.length !== keys.length ||
          snapshotHasUnsafeDashboardSurface(
            surface,
            fullStart,
            keys.length,
            emptyMatrix(keys.length, width, true),
            null
          )) {
        throw dashboardLayoutConflict();
      }
      return {
        status: 'LEGACY_FULL',
        writable: true,
        block_start_row: WorkOsConfig.DATA_START_ROW + fullStart,
        block_end_row:
          WorkOsConfig.DATA_START_ROW + fullStart + keys.length - 1
      };
    }

    var legacySeed = systemRows.length === LEGACY_SEED_KEYS.length &&
      LEGACY_SEED_KEYS.every(function (key, index) {
        return systemRows[index] &&
          systemRows[index].index === index &&
          systemRows[index].key === key;
      });
    if (systemRows.length && !legacySeed) {
      throw dashboardLayoutConflict();
    }
    if (legacySeed) {
      var seedAllowed = emptyMatrix(keys.length, width, false);
      for (var seedIndex = 0;
          seedIndex < LEGACY_SEED_KEYS.length;
          seedIndex += 1) {
        seedAllowed[seedIndex] = [true, true, true];
      }
      if (snapshotHasUnsafeDashboardSurface(
        surface,
        0,
        keys.length,
        seedAllowed,
        null
      )) {
        throw dashboardLayoutConflict();
      }
      return {
        status: 'LEGACY_SEED',
        writable: true,
        block_start_row: WorkOsConfig.DATA_START_ROW,
        block_end_row:
          WorkOsConfig.DATA_START_ROW + keys.length - 1
      };
    }

    for (var emptyStart = 0;
        emptyStart + keys.length <= dataRowCount;
        emptyStart += 1) {
      if (!snapshotHasUnsafeDashboardSurface(
        surface,
        emptyStart,
        keys.length,
        null,
        null
      )) {
        return {
          status: 'EMPTY',
          writable: true,
          block_start_row:
            WorkOsConfig.DATA_START_ROW + emptyStart,
          block_end_row:
            WorkOsConfig.DATA_START_ROW + emptyStart +
              keys.length - 1
        };
      }
    }
    return {
      status: 'NO_SAFE_BLOCK',
      writable: false,
      block_start_row: 0,
      block_end_row: 0
    };
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
      throw dashboardLayoutConflict();
    }
    var sheet = spreadsheet.getSheetByName(
      WorkOsConfig.SHEETS.DASHBOARD
    );
    var layout = inspectLayout(spreadsheet, keys);
    if (!layout.writable) {
      throw dashboardLayoutConflict();
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
        throw dashboardLayoutConflict();
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
    METRIC_ORDER: METRIC_ORDER,
    collectOperationalMetrics: collectOperationalMetrics,
    buildMetricRows: buildMetricRows,
    inspectLayout: inspectLayout,
    upsertMetricRows: safeUpsertMetricRows,
    refresh: refresh
  });
}());

function refreshOperationalDashboard() {
  return WorkOsDashboard.refresh(
    SpreadsheetApp.getActiveSpreadsheet()
  );
}
