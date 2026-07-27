/**
 * Owner-installed Task edit handler with an explicit menu fallback.
 *
 * The handler touches only event-selected Task rows and writes Calendar intent
 * to the Outbox; it never calls Gmail, AI or Calendar APIs.
 */
var WorkOsEditHandler = (function () {
  var MAX_EDIT_ROWS = 20;

  function recordManagementWarning(sheet, managementColumnCount) {
    if (!managementColumnCount) {
      return {
        detected: false,
        recorded: false
      };
    }
    try {
      var warning = WorkOsLogAndDeadLetter.recordManagementEditWarning(
        {
          detected_at: WorkOsUtilities.now(),
          management_column_count: managementColumnCount
        },
        sheet.getParent()
      );
      return {
        detected: true,
        recorded: true,
        error_row: warning.error_row
      };
    } catch (error) {
      return {
        detected: true,
        recorded: false,
        error_code: WorkOsUtilities.safeError(
          error,
          'EDIT_HANDLER'
        ).code
      };
    }
  }

  function emptyCalendarSummary() {
    return {
      inspected_count: 0,
      pending_intent_count: 0,
      remaining_intent_count: 0,
      pending_count: 0,
      delete_pending_count: 0,
      noop_count: 0
    };
  }

  function enqueueIntentTasksInContexts(
    taskContext,
    outboxContext,
    taskIds,
    nowValue
  ) {
    var summary = emptyCalendarSummary();
    (taskIds || []).forEach(function (taskId) {
      var task = WorkOsTaskRepository.findByTaskId(taskContext, taskId);
      if (!task) {
        throw new WorkOsAppError(
          'E_TARGET_NOT_RESOLVED',
          'EDIT_HANDLER',
          false,
          'Calendar Outboxへ反映するTaskを再解決できません。'
        );
      }
      if (task.calendar_reconcile_required !== true) {
        return;
      }
      var expectedIntentVersion = Number(task.calendar_intent_version);
      if (!Number.isInteger(expectedIntentVersion) ||
          expectedIntentVersion < 1) {
        throw new WorkOsAppError(
          'E_CALENDAR_INTENT_INVALID',
          'EDIT_HANDLER',
          false,
          'Calendar reconcile intentが不正です。'
        );
      }
      summary.pending_intent_count += 1;
      var enqueueResult = WorkOsCalendarSync.enqueueTaskInContext(
        task,
        outboxContext,
        {
          now: nowValue,
          timezone: WorkOsConfig.TIMEZONE,
          force_enqueue: true
        }
      );
      var desiredAction = enqueueResult.desired_action;
      var syncStatus = desiredAction === 'DELETE'
        ? 'DELETE_PENDING'
        : (desiredAction === 'NOOP' ? 'NOT_REQUIRED' : 'PENDING');
      var acknowledgement =
        WorkOsTaskRepository.acknowledgeCalendarIntent(
          taskId,
          expectedIntentVersion,
          syncStatus,
          taskContext,
          nowValue
        );
      summary.inspected_count += 1;
      if (acknowledgement.operation === 'STALE_INTENT') {
        summary.remaining_intent_count += 1;
        return;
      }
      if (syncStatus === 'DELETE_PENDING') {
        summary.delete_pending_count += 1;
      } else if (syncStatus === 'PENDING') {
        summary.pending_count += 1;
      } else {
        summary.noop_count += 1;
      }
    });
    return summary;
  }

  function enqueueEditedTasks(sheet, results, nowValue) {
    var taskRowsById = {};
    (results || []).forEach(function (result) {
      if (result && result.task_id &&
          Number.isInteger(Number(result.row))) {
        taskRowsById[String(result.task_id)] = Number(result.row);
      }
    });
    var ids = Object.keys(taskRowsById);
    if (!ids.length) {
      return emptyCalendarSummary();
    }
    var spreadsheet = sheet.getParent();
    var outboxSheet = spreadsheet &&
      spreadsheet.getSheetByName(WorkOsConfig.SHEETS.SYNC_STATE);
    if (!outboxSheet) {
      throw new WorkOsAppError(
        'E_CALENDAR_OUTBOX_MISSING',
        'EDIT_HANDLER',
        false,
        'Calendar intentを保存するOutboxを確認できません。'
      );
    }
    return WorkOsUtilities.withScriptLock(function (lock) {
      var taskContext =
        WorkOsTaskRepository.createScopedContextForHeldLock(
          sheet,
          ids.map(function (taskId) {
            return taskRowsById[taskId];
          }),
          lock
        );
      var outboxContext =
        WorkOsCalendarSync.createOutboxContextForHeldLock(
          outboxSheet,
          lock
        );
      return enqueueIntentTasksInContexts(
        taskContext,
        outboxContext,
        ids,
        nowValue
      );
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  function recoverPendingCalendarIntents(options) {
    var settings = options || {};
    var spreadsheet = settings.spreadsheet ||
      SpreadsheetApp.getActiveSpreadsheet();
    var taskSheet = spreadsheet &&
      spreadsheet.getSheetByName(WorkOsConfig.SHEETS.TASKS);
    var outboxSheet = spreadsheet &&
      spreadsheet.getSheetByName(WorkOsConfig.SHEETS.SYNC_STATE);
    if (!taskSheet || !outboxSheet) {
      throw new WorkOsAppError(
        'E_CALENDAR_OUTBOX_MISSING',
        'CALENDAR_INTENT_RECOVERY',
        false,
        'TaskまたはCalendar Outboxを確認できません。'
      );
    }
    var requestedLimit = Number(settings.maxTasks || MAX_EDIT_ROWS);
    var maxTasks = Number.isInteger(requestedLimit)
      ? Math.max(1, Math.min(100, requestedLimit))
      : MAX_EDIT_ROWS;
    return WorkOsUtilities.withScriptLock(function (lock) {
      var taskContext =
        WorkOsTaskRepository.createContextForHeldLock(taskSheet, lock);
      var pendingIds = taskContext.logicalRows.map(function (physicalRow) {
        return WorkOsTaskRepository.readTaskAtRow(
          taskContext,
          physicalRow
        );
      }).filter(function (task) {
        return task && task.calendar_reconcile_required === true;
      }).map(function (task) {
        return String(task.task_id);
      });
      if (!pendingIds.length) {
        return emptyCalendarSummary();
      }
      var selectedIds = pendingIds.slice(0, maxTasks);
      var outboxContext =
        WorkOsCalendarSync.createOutboxContextForHeldLock(
          outboxSheet,
          lock
        );
      var summary = enqueueIntentTasksInContexts(
        taskContext,
        outboxContext,
        selectedIds,
        settings.now || WorkOsUtilities.now()
      );
      summary.remaining_intent_count +=
        pendingIds.length - selectedIds.length;
      return summary;
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  function assertRestageRange(range) {
    if (!range || !range.getSheet ||
        range.getNumRows() !== 1 ||
        range.getRow() < WorkOsConfig.DATA_START_ROW ||
        range.getSheet().getName() !== WorkOsConfig.SHEETS.TASKS) {
      throw new WorkOsAppError(
        'REVIEW_RESTAGE_SELECTION',
        'TASK_REVIEW',
        false,
        '再stageするTask一覧のReviewを1行だけ選択してください。'
      );
    }
    return range.getSheet();
  }

  function inspectRestageSelection(range) {
    var sheet = assertRestageRange(range);
    return WorkOsTaskRepository.withLockedContext(
      sheet,
      function (context) {
        var task = WorkOsTaskRepository.readTaskAtRow(
          context,
          range.getRow()
        );
        if (!task ||
            task.needs_review !== true ||
            task.review_state !== 'OPEN' ||
            task.review_type !== 'EXISTING_CHANGE' ||
            !task.pending_action_type) {
          throw new WorkOsAppError(
            'REVIEW_RESTAGE_NOT_AVAILABLE',
            'TASK_REVIEW',
            false,
            '選択した行は再stage可能なOPEN Reviewではありません。'
          );
        }
        return {
          physical_row: range.getRow(),
          expected_task_id: String(task.task_id),
          expected_business_version: Number(task.business_version),
          task_title: String(task.task_title || '')
        };
      }
    );
  }

  function recordRestageAudit(sheet, physicalRow, nowValue) {
    try {
      WorkOsLogAndDeadLetter.appendRunSummary(
        {
          run_id: WorkOsUtilities.makeId('restage_'),
          mode: 'REVIEW_RESTAGE',
          started_at: nowValue,
          finished_at: WorkOsUtilities.now(),
          duration_ms: 0,
          candidate_count: 1,
          processed_count: 1,
          updated_task_count: 1,
          skipped_count: 0,
          error_count: 0,
          run_status: 'COMPLETE',
          note: 'ROW=' + Number(physicalRow) +
            ';ACTION=RESTAGE;STATUS=COMPLETE'
        },
        sheet.getParent()
      );
      return { recorded: true };
    } catch (error) {
      return {
        recorded: false,
        error_code: WorkOsUtilities.safeError(
          error,
          'REVIEW_RESTAGE_AUDIT'
        ).code
      };
    }
  }

  function restageSelectedReviewRange(range, nowValue, preview) {
    var sheet = assertRestageRange(range);
    var inspected = preview || inspectRestageSelection(range);
    if (Number(inspected.physical_row) !== Number(range.getRow())) {
      throw new WorkOsAppError(
        'REVIEW_RESTAGE_CONFLICT',
        'TASK_REVIEW',
        false,
        '選択行が確認後に変わったため再stageを中止しました。'
      );
    }
    var effectiveNow = nowValue || WorkOsUtilities.now();
    var result = WorkOsTaskRepository.restagePendingChangeAtRow({
      sheet: sheet,
      physicalRow: range.getRow(),
      expectedTaskId: inspected.expected_task_id,
      expectedBusinessVersion: inspected.expected_business_version,
      now: effectiveNow
    });
    result.audit = recordRestageAudit(
      sheet,
      range.getRow(),
      effectiveNow
    );
    return result;
  }

  function recordDecisionRejections(sheet, results) {
    var rejected = (results || []).filter(function (result) {
      return result && result.operation === 'REJECTED';
    });
    if (!rejected.length) {
      return { rejected_count: 0, recorded_count: 0 };
    }
    var spreadsheet = sheet.getParent();
    var recorded = 0;
    rejected.forEach(function (result) {
      try {
        WorkOsLogAndDeadLetter.recordOperationalError(
          new WorkOsAppError(
            String(result.error_code || 'REVIEW_DECISION_REJECTED'),
            'EDIT_HANDLER',
            false,
            'Task判断操作を安全のため拒否しました。'
          ),
          {
            task_id: result.review_task_id || result.task_id,
            status: 'DEAD'
          },
          '',
          spreadsheet
        );
        recorded += 1;
      } catch (error) {
        // The decision has already been reverted. Logging must not re-accept it.
      }
    });
    if (spreadsheet && typeof spreadsheet.toast === 'function') {
      spreadsheet.toast(
        '確認待ちのReview以外では判断を変更できません。',
        '判断を元に戻しました',
        5
      );
    }
    return {
      rejected_count: rejected.length,
      recorded_count: recorded
    };
  }

  function recordManualEditAudit(sheet, results, nowValue) {
    var values = results || [];
    var updated = values.filter(function (result) {
      return result && result.operation === 'UPDATE';
    });
    var rejected = values.filter(function (result) {
      return result && result.operation === 'REJECTED';
    });
    var noop = values.filter(function (result) {
      return result && result.operation === 'NOOP';
    });
    var fieldMap = {};
    var versionPairs = [];
    updated.forEach(function (result) {
      var audit = result.audit || {};
      (audit.edited_fields || []).forEach(function (fieldId) {
        if (WorkOsUtilities.isSafeIdentifier(fieldId)) {
          fieldMap[fieldId] = true;
        }
      });
      if (Number.isInteger(Number(audit.prior_row_version)) &&
          Number.isInteger(Number(audit.new_row_version))) {
        versionPairs.push(
          Number(audit.prior_row_version) + '>' +
            Number(audit.new_row_version)
        );
      }
    });
    var note = [
      'ROWS=' + values.length,
      'UPDATED=' + updated.length,
      'REJECTED=' + rejected.length,
      'NOOP=' + noop.length,
      'FIELDS=' + Object.keys(fieldMap).sort().join(','),
      'VERSIONS=' + versionPairs.join(',')
    ].join(';');
    try {
      var runId = WorkOsUtilities.makeId('edit_');
      var row = WorkOsLogAndDeadLetter.appendRunSummary(
        {
          run_id: runId,
          mode: 'MANUAL_EDIT',
          started_at: nowValue,
          finished_at: WorkOsUtilities.now(),
          duration_ms: 0,
          candidate_count: values.length,
          processed_count: values.length,
          updated_task_count: updated.length,
          skipped_count: noop.length,
          error_count: rejected.length,
          run_status: rejected.length
            ? 'PARTIAL_REJECTED'
            : 'COMPLETE',
          note: note
        },
        sheet.getParent()
      );
      return {
        recorded: true,
        run_id: runId,
        history_row: row,
        updated_count: updated.length,
        rejected_count: rejected.length,
        noop_count: noop.length
      };
    } catch (error) {
      return {
        recorded: false,
        error_code: WorkOsUtilities.safeError(
          error,
          'EDIT_AUDIT'
        ).code,
        updated_count: updated.length,
        rejected_count: rejected.length,
        noop_count: noop.length
      };
    }
  }

  function assertCanonicalInstallableEvent(event) {
    var eventTriggerId = String(event && event.triggerUid || '');
    if (!eventTriggerId) {
      return false;
    }
    var storedId = String(
      PropertiesService.getScriptProperties().getProperty(
        WorkOsConfig.PROPERTIES.EDIT_TRIGGER_ID
      ) || ''
    );
    if (!storedId || eventTriggerId !== storedId) {
      throw new WorkOsAppError(
        'E_EDIT_TRIGGER_NON_CANONICAL',
        'EDIT_HANDLER',
        false,
        '正規のTask編集Trigger以外からのeventを拒否しました。'
      );
    }
    return true;
  }

  function handle(event) {
    if (!event || !event.range || !event.range.getSheet) {
      throw new WorkOsAppError(
        'E_EDIT_EVENT',
        'EDIT_HANDLER',
        false,
        '編集eventが不足しています。'
      );
    }
    var installableEvent = assertCanonicalInstallableEvent(event);
    var range = event.range;
    var sheet = range.getSheet();
    if (!sheet ||
        sheet.getName() !== WorkOsConfig.SHEETS.TASKS) {
      return {
        status: 'IGNORED',
        reason: 'OUTSIDE_TASK_SHEET',
        processed_rows: 0
      };
    }
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    var ids = sheet.getRange(1, 1, 1, schema.length).getValues()[0];
    if (JSON.stringify(ids) !==
        JSON.stringify(WorkOsSchemas.getInternalIds(
          WorkOsConfig.SHEETS.TASKS
        ))) {
      throw new WorkOsAppError(
        'E_SCHEMA_MISSING_COLUMN',
        'EDIT_HANDLER',
        false,
        'タスク一覧の内部列IDが一致しません。'
      );
    }
    var firstRow = Math.max(
      WorkOsConfig.DATA_START_ROW,
      range.getRow()
    );
    var lastRow = range.getRow() + range.getNumRows() - 1;
    if (lastRow < WorkOsConfig.DATA_START_ROW) {
      return {
        status: 'IGNORED',
        reason: 'HEADER_EDIT',
        processed_rows: 0
      };
    }
    var exceedsRowLimit =
      lastRow - firstRow + 1 > MAX_EDIT_ROWS;
    var firstColumn = Math.max(1, range.getColumn());
    var lastColumn = Math.min(
      schema.length,
      range.getColumn() + range.getNumColumns() - 1
    );
    var editedIds = [];
    var allEventIds = [];
    var managementIds = [];
    for (var column = firstColumn; column <= lastColumn; column += 1) {
      var definition = schema[column - 1];
      allEventIds.push(definition.id);
      if (definition.editable ||
          WorkOsTaskReviewPolicy.MANUAL_PROTECTED_FIELDS
            .indexOf(definition.id) !== -1) {
        editedIds.push(definition.id);
      } else {
        managementIds.push(definition.id);
      }
    }
    var rowEdits = [];
    for (var row = firstRow; row <= lastRow; row += 1) {
      rowEdits.push({
        row: row,
        column_ids: allEventIds.slice()
      });
    }
    var nowValue = WorkOsUtilities.now();
    var noManagementWarning = {
      detected: false,
      recorded: false
    };
    if (managementIds.length) {
      var managementRestoration =
        WorkOsTaskRepository.restoreUserEditRows(sheet, rowEdits);
      var managementWarning = recordManagementWarning(
        sheet,
        managementIds.length
      );
      var managementResults = rowEdits.map(function (edit) {
        return {
          row: edit.row,
          operation: 'REJECTED',
          error_code: 'MANAGEMENT_COLUMN_EDIT',
          calendar_reconcile: false
        };
      });
      return {
        status: 'REJECTED',
        reason: 'MANAGEMENT_COLUMN_EDIT',
        processed_rows: 0,
        rejected_rows: rowEdits.length,
        restored_rows: managementRestoration.restored_count,
        management_column_count: managementIds.length,
        management_warning: managementWarning,
        manual_edit_audit: recordManualEditAudit(
          sheet,
          managementResults,
          nowValue
        ),
        calendar_outbox: emptyCalendarSummary()
      };
    }
    rowEdits.forEach(function (edit) {
      edit.column_ids = editedIds.slice();
    });
    if (exceedsRowLimit) {
      var restoration = WorkOsTaskRepository.restoreUserEditRows(
        sheet,
        rowEdits
      );
      var rejectedResults = rowEdits.map(function (edit) {
        return {
          row: edit.row,
          operation: 'REJECTED',
          error_code: 'E_EDIT_RANGE_LIMIT',
          calendar_reconcile: false
        };
      });
      var rangeLimitAudit = recordManualEditAudit(
        sheet,
        rejectedResults,
        nowValue
      );
      var spreadsheet = sheet.getParent();
      if (spreadsheet && typeof spreadsheet.toast === 'function') {
        spreadsheet.toast(
          '1回に反映できるTask編集は20行までです。変更を元に戻しました。',
          '編集範囲を元に戻しました',
          6
        );
      }
      return {
        status: 'REJECTED',
        reason: 'E_EDIT_RANGE_LIMIT',
        processed_rows: 0,
        rejected_rows: rowEdits.length,
        restored_rows: restoration.restored_count,
        management_column_count: managementIds.length,
        management_warning: noManagementWarning,
        manual_edit_audit: rangeLimitAudit,
        calendar_outbox: emptyCalendarSummary()
      };
    }
    var results = WorkOsTaskRepository.applyUserEdits(
      sheet,
      rowEdits,
      nowValue
    );
    var decisionRejections = recordDecisionRejections(sheet, results);
    var manualEditAudit = recordManualEditAudit(
      sheet,
      results,
      nowValue
    );
    var calendarOutbox = enqueueEditedTasks(sheet, results, nowValue);
    return {
      status: 'COMPLETE',
      invocation: installableEvent
        ? 'INSTALLABLE_EDIT_TRIGGER'
        : 'EXPLICIT_MENU_FALLBACK',
      processed_rows: results.length,
      management_column_count: managementIds.length,
      management_warning: noManagementWarning,
      decision_rejections: decisionRejections,
      manual_edit_audit: manualEditAudit,
      calendar_outbox: calendarOutbox,
      results: results
    };
  }

  function handleActiveSelection() {
    var range = SpreadsheetApp.getActiveRange();
    if (!range) {
      throw new WorkOsAppError(
        'E_EDIT_EVENT',
        'EDIT_HANDLER',
        false,
        '反映するTask編集範囲を選択してください。'
      );
    }
    return handle({ range: range });
  }

  return Object.freeze({
    handle: handle,
    handleActiveSelection: handleActiveSelection,
    assertCanonicalInstallableEvent: assertCanonicalInstallableEvent,
    enqueueEditedTasks: enqueueEditedTasks,
    recoverPendingCalendarIntents: recoverPendingCalendarIntents,
    inspectRestageSelection: inspectRestageSelection,
    restageSelectedReviewRange: restageSelectedReviewRange
  });
}());

function handleTaskEdit(event) {
  return WorkOsEditHandler.handle(event);
}

function applySelectedTaskEdits() {
  return WorkOsEditHandler.handleActiveSelection();
}
