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
      return {
        inspected_count: 0,
        pending_count: 0,
        delete_pending_count: 0,
        noop_count: 0
      };
    }
    var spreadsheet = sheet.getParent();
    var outboxSheet = spreadsheet &&
      spreadsheet.getSheetByName(WorkOsConfig.SHEETS.SYNC_STATE);
    if (!outboxSheet) {
      throw new WorkOsAppError(
        'E_CALENDAR_OUTBOX_MISSING',
        'EDIT_HANDLER',
        false,
        '蜷梧悄迥ｶ諷鬼heet縺後↑縺・◆繧，alendar諢丞峙繧剃ｿ晏ｭ倥〒縺阪∪縺帙ｓ縲・
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
        WorkOsCalendarSync.createOutboxContextForHeldLock(outboxSheet, lock);
      var summary = {
        inspected_count: 0,
        pending_count: 0,
        delete_pending_count: 0,
        noop_count: 0
      };
      ids.forEach(function (taskId) {
        var task = WorkOsTaskRepository.findByTaskId(taskContext, taskId);
        if (!task) {
          throw new WorkOsAppError(
            'E_TARGET_NOT_RESOLVED',
            'EDIT_HANDLER',
            false,
            '邱ｨ髮・＠縺鬱ask繧辰alendar Outbox謚募・譎ゅ↓遒ｺ隱阪〒縺阪∪縺帙ｓ縲・
          );
        }
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
        WorkOsTaskRepository.applyCalendarPatch(
          taskId,
          { calendar_sync_status: syncStatus },
          taskContext,
          nowValue
        );
        summary.inspected_count += 1;
        if (syncStatus === 'DELETE_PENDING') {
          summary.delete_pending_count += 1;
        } else if (syncStatus === 'PENDING') {
          summary.pending_count += 1;
        } else {
          summary.noop_count += 1;
        }
      });
      return summary;
    }, WorkOsConfig.LOCK_WAIT_MS);
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
        '豁｣隕上・Task邱ｨ髮・rigger莉･螟悶°繧峨・event繧呈拠蜷ｦ縺励∪縺励◆縲・
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
        '邱ｨ髮・vent縺御ｸ崎ｶｳ縺励※縺・∪縺吶・
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
        '繧ｿ繧ｹ繧ｯ荳隕ｧ縺ｮ蜀・Κ蛻悠D縺御ｸ閾ｴ縺励∪縺帙ｓ縲・
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
    if (lastRow - firstRow + 1 > MAX_EDIT_ROWS) {
      throw new WorkOsAppError(
        'E_EDIT_RANGE_LIMIT',
        'EDIT_HANDLER',
        false,
        '1蝗槭↓蜿肴丐縺ｧ縺阪ｋTask邱ｨ髮・・20陦後∪縺ｧ縺ｧ縺吶・
      );
    }
    var firstColumn = Math.max(1, range.getColumn());
    var lastColumn = Math.min(
      schema.length,
      range.getColumn() + range.getNumColumns() - 1
    );
    var editedIds = [];
    var managementIds = [];
    for (var column = firstColumn; column <= lastColumn; column += 1) {
      var definition = schema[column - 1];
      if (definition.editable ||
          WorkOsTaskReviewPolicy.MANUAL_PROTECTED_FIELDS
            .indexOf(definition.id) !== -1) {
        editedIds.push(definition.id);
      } else {
        managementIds.push(definition.id);
      }
    }
    var managementWarning = recordManagementWarning(
      sheet,
      managementIds.length
    );
    if (!editedIds.length) {
      return {
        status: 'IGNORED',
        reason: 'MANAGEMENT_COLUMN_EDIT',
        processed_rows: 0,
        management_column_count: managementIds.length,
        management_warning: managementWarning
      };
    }
    var rowEdits = [];
    for (var row = firstRow; row <= lastRow; row += 1) {
      rowEdits.push({ row: row, column_ids: editedIds.slice() });
    }
    var nowValue = WorkOsUtilities.now();
    var results = WorkOsTaskRepository.applyUserEdits(
      sheet,
      rowEdits,
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
      management_warning: managementWarning,
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
        '蜿肴丐縺吶ｋTask邱ｨ髮・ｯ・峇繧帝∈謚槭＠縺ｦ縺上□縺輔＞縲・
      );
    }
    return handle({ range: range });
  }

  return Object.freeze({
    handle: handle,
    handleActiveSelection: handleActiveSelection,
    assertCanonicalInstallableEvent: assertCanonicalInstallableEvent,
    enqueueEditedTasks: enqueueEditedTasks
  });
}());

function handleTaskEdit(event) {
  return WorkOsEditHandler.handle(event);
}

function applySelectedTaskEdits() {
  return WorkOsEditHandler.handleActiveSelection();
}

