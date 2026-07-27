/**
 * Task Repository implemented through Phase 4.
 *
 * The repository uses row 1 internal IDs and treats a row as logical Task data
 * only when task_id OR origin_key is present.
 */
var WorkOsTaskRepository = (function () {
  var IMMUTABLE_ON_EXISTING_UPSERT = Object.freeze({
    task_id: true,
    origin_key: true,
    created_at: true,
    updated_at: true,
    row_version: true,
    manual_fields: true,
    pending_action_type: true,
    pending_changes_json: true,
    comment: true,
    source_message_id: true,
    source_thread_id: true,
    stable_thread_key: true,
    source_action_index: true,
    sender: true,
    subject: true,
    received_at: true,
    source_email: true
  });
  var SAFE_REPLAY_UPDATE_FIELDS = Object.freeze({
    ai_action_type: true,
    ai_reason: true,
    ai_confidence: true,
    ai_provider: true,
    ai_model: true,
    ai_prompt_version: true
  });
  var REVIEW_TYPES = Object.freeze({
    NEW_TASK: true,
    EXISTING_CHANGE: true,
    TARGET_UNRESOLVED: true,
    PENDING_CONFLICT: true
  });
  var REVIEW_WRITE_FIELDS = Object.freeze({
    status: true,
    completed: true,
    excluded: true,
    waiting_for_reply: true,
    task_title: true,
    due_date: true,
    suggested_due_date: true,
    deadline_basis: true,
    priority: true,
    calendar_sync_mode: true,
    calendar_category: true,
    calendar_importance: true,
    needs_review: true,
    decision: true,
    review_state: true,
    review_type: true,
    pending_action_type: true,
    pending_changes_json: true
  });
  var LOCK_MARKER = {};

  function calculateRowsToAppend(currentMaxRows, requiredRow) {
    if (requiredRow <= currentMaxRows) {
      return 0;
    }
    return Math.ceil(
      (requiredRow - currentMaxRows) / WorkOsConfig.ROW_EXPANSION_UNIT
    ) * WorkOsConfig.ROW_EXPANSION_UNIT;
  }

  function ensureCapacityForRow(sheet, requiredRow) {
    var rowsToAppend = calculateRowsToAppend(sheet.getMaxRows(), requiredRow);
    if (rowsToAppend > 0) {
      sheet.insertRowsAfter(sheet.getMaxRows(), rowsToAppend);
    }
    return rowsToAppend;
  }

  function findLogicalEmptyRow(taskIdValues, originKeyValues, startRow) {
    var firstDataRow = startRow || WorkOsConfig.DATA_START_ROW;
    var length = Math.max(taskIdValues.length, originKeyValues.length);
    for (var index = 0; index < length; index += 1) {
      var taskId = taskIdValues[index] && taskIdValues[index][0];
      var originKey = originKeyValues[index] && originKeyValues[index][0];
      if (WorkOsUtilities.isBlank(taskId) && WorkOsUtilities.isBlank(originKey)) {
        return firstDataRow + index;
      }
    }
    return firstDataRow + length;
  }

  function createContext(sheet, lockMarker) {
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    var ids = sheet.getRange(1, 1, 1, schema.length).getValues()[0];
    var columnMap = WorkOsSchemas.buildColumnMapFromIds(ids);
    var expected = WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS);
    if (JSON.stringify(ids) !== JSON.stringify(expected)) {
      throw new WorkOsAppError(
        'E_SCHEMA_MISSING_COLUMN',
        'TASK_REPOSITORY',
        false,
        '繧ｿ繧ｹ繧ｯ荳隕ｧ縺ｮ蜀・Κ蛻悠D縺御ｻ墓ｧ倥→荳閾ｴ縺励∪縺帙ｓ縲・
      );
    }
    var rowCount = Math.max(0, sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1);
    var values = rowCount
      ? sheet.getRange(WorkOsConfig.DATA_START_ROW, 1, rowCount, schema.length).getValues()
      : [];
    var context = buildContextFromValues(sheet, columnMap, values);
    if (lockMarker === LOCK_MARKER) {
      Object.defineProperty(context, '_workOsLockMarker', {
        value: LOCK_MARKER,
        enumerable: false,
        writable: true,
        configurable: true
      });
    }
    return context;
  }

  function buildContextFromValues(sheet, columnMap, values) {
    var byTaskId = {};
    var byOriginKey = {};
    var byStableThreadKey = {};
    var duplicateTaskIds = [];
    var duplicateOriginKeys = [];
    var logicalRows = [];
    var taskIdValues = [];
    var originKeyValues = [];
    var taskIdIndex = columnMap.task_id;
    var originKeyIndex = columnMap.origin_key;
    var stableThreadKeyIndex = columnMap.stable_thread_key;

    values.forEach(function (row, index) {
      var physicalRow = WorkOsConfig.DATA_START_ROW + index;
      var taskId = String(row[taskIdIndex] || '').trim();
      var originKey = String(row[originKeyIndex] || '').trim();
      var stableThreadKey = String(row[stableThreadKeyIndex] || '').trim();
      taskIdValues.push([taskId]);
      originKeyValues.push([originKey]);
      if (!taskId && !originKey) {
        return;
      }
      logicalRows.push(physicalRow);
      if (taskId) {
        if (byTaskId[taskId]) {
          duplicateTaskIds.push(taskId);
        } else {
          byTaskId[taskId] = physicalRow;
        }
      }
      if (originKey) {
        if (byOriginKey[originKey]) {
          duplicateOriginKeys.push(originKey);
        } else {
          byOriginKey[originKey] = physicalRow;
        }
      }
      if (stableThreadKey) {
        if (!byStableThreadKey[stableThreadKey]) {
          byStableThreadKey[stableThreadKey] = [];
        }
        byStableThreadKey[stableThreadKey].push(physicalRow);
      }
    });

    return {
      sheet: sheet,
      columnMap: columnMap,
      values: values,
      taskIdValues: taskIdValues,
      originKeyValues: originKeyValues,
      byTaskId: byTaskId,
      byOriginKey: byOriginKey,
      byStableThreadKey: byStableThreadKey,
      duplicateTaskIds: duplicateTaskIds,
      duplicateOriginKeys: duplicateOriginKeys,
      logicalRows: logicalRows
    };
  }

  var FORMULA_GUARD = '\u200B';

  function neutralizeFormulaText(value) {
    if (typeof value !== 'string') {
      return value;
    }
    return /^[\u0000-\u0020]*[=+\-@]/.test(value)
      ? FORMULA_GUARD + value
      : value;
  }

  function valueForCell(columnDefinition, value) {
    if (value == null || value === '') {
      return '';
    }
    if (columnDefinition.enumName) {
      if (Object.prototype.hasOwnProperty.call(WorkOsEnums[columnDefinition.enumName], String(value))) {
        return WorkOsSchemas.toSheetEnum(columnDefinition.enumName, String(value));
      }
      WorkOsSchemas.toInternalEnum(columnDefinition.enumName, String(value));
      return String(value);
    }
    if (columnDefinition.type === 'Date') {
      if (value instanceof Date) {
        return value;
      }
      var dateText = String(value);
      var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
      if (match) {
        return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
      }
      return new Date(value);
    }
    if (columnDefinition.type === 'DateTime') {
      return value instanceof Date ? value : new Date(value);
    }
    if (columnDefinition.type === 'Integer') {
      return Number(value);
    }
    if (columnDefinition.type === 'Number') {
      return Number(value);
    }
    if (columnDefinition.type === 'JsonArray') {
      return WorkOsUtilities.serializeJson(value, 'array');
    }
    if (columnDefinition.type === 'JsonObject') {
      return WorkOsUtilities.serializeJson(value, 'object');
    }
    if (columnDefinition.type === 'String' ||
        columnDefinition.type === 'URL') {
      return neutralizeFormulaText(value);
    }
    return value;
  }

  function valueFromCell(columnDefinition, value) {
    if (value == null || value === '') {
      return '';
    }
    if (columnDefinition.enumName) {
      return WorkOsSchemas.toInternalEnum(columnDefinition.enumName, value);
    }
    if (columnDefinition.allowedValues) {
      if (typeof value !== 'string' ||
          columnDefinition.allowedValues.indexOf(value) === -1) {
        throw new WorkOsAppError(
          'E_INVALID_ENUM',
          'TASK_REPOSITORY',
          false,
          columnDefinition.id + '縺ｮEnum蛟､縺御ｸ肴ｭ｣縺ｧ縺吶・
        );
      }
      return value;
    }
    if (columnDefinition.type === 'JsonArray') {
      return WorkOsUtilities.parseJson(value, 'array');
    }
    if (columnDefinition.type === 'JsonObject') {
      return WorkOsUtilities.parseJson(value, 'object');
    }
    if (columnDefinition.type === 'Integer') {
      if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
        throw new WorkOsAppError(
          'E_TASK_TYPE',
          'TASK_REPOSITORY',
          false,
          columnDefinition.id + '縺栗nteger縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・
        );
      }
      return value;
    }
    if (columnDefinition.type === 'Number') {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new WorkOsAppError(
          'E_TASK_TYPE',
          'TASK_REPOSITORY',
          false,
          columnDefinition.id + '縺君umber縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・
        );
      }
      return value;
    }
    if (columnDefinition.type === 'Boolean') {
      if (typeof value !== 'boolean') {
        throw new WorkOsAppError(
          'E_TASK_TYPE',
          'TASK_REPOSITORY',
          false,
          columnDefinition.id + '縺沓oolean縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・
        );
      }
      return value;
    }
    if (columnDefinition.type === 'Date' || columnDefinition.type === 'DateTime') {
      if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
        throw new WorkOsAppError(
          'E_TASK_TYPE',
          'TASK_REPOSITORY',
          false,
          columnDefinition.id + '縺梧怏蜉ｹ縺ｪ譌･莉倥〒縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・
        );
      }
      return value;
    }
    if ((columnDefinition.type === 'String' || columnDefinition.type === 'URL') &&
        typeof value !== 'string') {
      throw new WorkOsAppError(
        'E_TASK_TYPE',
        'TASK_REPOSITORY',
        false,
        columnDefinition.id + '縺郡tring縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・
      );
    }
    return value;
  }

  function defaultTask(task, nowValue) {
    var result = {
      needs_review: false,
      decision: 'NONE',
      status: 'OPEN',
      completed: false,
      excluded: false,
      suggested_due_date: '',
      deadline_basis: 'NONE',
      priority: 'MEDIUM',
      waiting_for_reply: false,
      calendar_sync_mode: 'AUTO',
      comment: '',
      review_state: 'NONE',
      review_type: '',
      source_action_index: 0,
      ai_provider: 'MOCK',
      ai_prompt_version: 'phase1-mock',
      calendar_category: 'NONE',
      calendar_importance: 'LOW',
      calendar_sync_status: 'NOT_REQUIRED',
      schedule_state: 'NONE',
      manual_fields: [],
      row_version: 1,
      pending_action_type: '',
      pending_changes_json: {},
      created_at: nowValue,
      updated_at: nowValue
    };
    Object.keys(task || {}).forEach(function (key) {
      result[key] = task[key];
    });
    return result;
  }

  function sanitizePersistenceText(value) {
    var text = WorkOsUtilities.redact(String(value == null ? '' : value));
    return neutralizeFormulaText(text);
  }

  function sanitizeStructuredValue(value) {
    if (typeof value === 'string') {
      return sanitizePersistenceText(value);
    }
    if (value instanceof Date) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeStructuredValue);
    }
    if (value && typeof value === 'object') {
      var result = {};
      Object.keys(value).forEach(function (key) {
        result[key] = sanitizeStructuredValue(value[key]);
      });
      return result;
    }
    return value;
  }

  function sanitizeTaskForPersistence(task) {
    var result = {};
    var textFields = {
      task_title: true,
      comment: true,
      sender: true,
      subject: true,
      review_type: true,
      ai_reason: true
    };
    Object.keys(task || {}).forEach(function (key) {
      if (textFields[key] && typeof task[key] === 'string') {
        result[key] = sanitizePersistenceText(task[key]);
      } else if (key === 'pending_changes_json') {
        result[key] = sanitizeStructuredValue(task[key]);
      } else {
        result[key] = task[key];
      }
    });
    return result;
  }

  function sanitizeReviewDisplay(value) {
    var text;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      text = Utilities.formatDate(
        value,
        WorkOsConfig.TIMEZONE,
        'yyyy-MM-dd'
      );
    } else if (value === true) {
      text = '縺ｯ縺・;
    } else if (value === false) {
      text = '縺・＞縺・;
    } else {
      text = String(value == null || value === '' ? '譛ｪ險ｭ螳・ : value);
      if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
        var parsedDate = new Date(text);
        text = Number.isNaN(parsedDate.getTime())
          ? text.slice(0, 10)
          : Utilities.formatDate(
            parsedDate,
            WorkOsConfig.TIMEZONE,
            'yyyy-MM-dd'
          );
      }
    }
    return WorkOsUtilities.redact(text)
      .replace(/https?:\/\/\S+/gi, '[繝ｪ繝ｳ繧ｯ]')
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[繝｡繝ｼ繝ｫ]')
      .replace(/\b(?:msg|thr|tsk|org)_[0-9a-f]{16,}\b/gi, '[隴伜挨蟄疹')
      .replace(/[\r\n\t]+/g, ' ')
      .slice(0, 120);
  }

  function reviewFieldLabel(field) {
    var labels = {
      task_title: '莉ｶ蜷・,
      status: '迥ｶ諷・,
      completed: '螳御ｺ・,
      excluded: '蟇ｾ雎｡螟・,
      waiting_for_reply: '霑比ｿ｡蠕・■',
      due_date: '譛滄剞',
      suggested_due_date: '謗ｨ螂ｨ譛滄剞',
      deadline_basis: '譛滄剞譬ｹ諡',
      priority: '蜆ｪ蜈亥ｺｦ',
      calendar_sync_mode: 'Calendar蜷梧悄',
      calendar_category: 'Calendar蛻・｡・,
      calendar_importance: 'Calendar驥崎ｦ∝ｺｦ'
    };
    return labels[field] || field;
  }

  function buildReviewNote(task, previousTask) {
    var value = task || {};
    if (value.needs_review !== true ||
        value.review_state !== 'OPEN' ||
        !value.pending_action_type ||
        !isPlainObject(value.pending_changes_json) ||
        !isPlainObject(value.pending_changes_json.changes)) {
      return '';
    }
    var pending = value.pending_changes_json;
    var currentValues = isPlainObject(pending.current_values)
      ? pending.current_values
      : {};
    var lines = [
      '螟画峩: ' + sanitizeReviewDisplay(value.pending_action_type),
      '蟇ｾ雎｡: ' + sanitizeReviewDisplay(value.task_title)
    ];
    Object.keys(pending.changes).filter(function (field) {
      return REVIEW_WRITE_FIELDS[field] === true &&
        field !== 'needs_review' &&
        field !== 'decision' &&
        field !== 'review_state' &&
        field !== 'review_type' &&
        field !== 'pending_action_type' &&
        field !== 'pending_changes_json';
    }).sort().forEach(function (field) {
      var before = Object.prototype.hasOwnProperty.call(
        currentValues,
        field
      )
        ? currentValues[field]
        : (previousTask &&
          Object.prototype.hasOwnProperty.call(previousTask, field)
          ? previousTask[field]
          : '蟇ｾ雎｡譛ｪ隗｣豎ｺ');
      lines.push(
        reviewFieldLabel(field) + ' 迴ｾ蝨ｨ蛟､: ' +
          sanitizeReviewDisplay(before) +
          ' / 螟画峩蠕・ ' +
          sanitizeReviewDisplay(pending.changes[field])
      );
    });
    if (Object.prototype.hasOwnProperty.call(
      pending.changes,
      'deadline_basis'
    )) {
      lines.push(
        '譛滄剞譬ｹ諡: ' +
          sanitizeReviewDisplay(pending.changes.deadline_basis)
      );
    }
    lines.push(
      '謇句虚遶ｶ蜷・ ' +
        (Array.isArray(pending.manual_conflicts) &&
         pending.manual_conflicts.length ? '縺ゅｊ' : '縺ｪ縺・)
    );
    if (pending.past_due === true) {
      lines.push('隴ｦ蜻・ 驕主悉譌･縺ｮ譛滄剞蛟呵｣懊〒縺吶・);
    }
    return lines.join('\n').slice(0, 1500);
  }

  function syncReviewNote(sheet, physicalRow, task, previousTask) {
    var map = WorkOsSchemas.buildColumnMapFromIds(
      WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS)
    );
    var range = sheet.getRange(
      physicalRow,
      map.review_type + 1,
      1,
      1
    );
    if (typeof range.setNote === 'function') {
      range.setNote(buildReviewNote(task, previousTask));
    }
  }

  function makeRow(task) {
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    return schema.map(function (item) {
      return Object.prototype.hasOwnProperty.call(task, item.id)
        ? valueForCell(item, task[item.id])
        : '';
    });
  }

  function rowForPhysicalRow(context, physicalRow) {
    var index = physicalRow - WorkOsConfig.DATA_START_ROW;
    if (index < 0 || index >= context.values.length) {
      throw new WorkOsAppError(
        'E_TASK_ROW_OUT_OF_RANGE',
        'TASK_REPOSITORY',
        false,
        'Task陦後′隱ｭ蜿也ｯ・峇螟悶〒縺吶・
      );
    }
    return context.values[index].slice();
  }

  function cellsEqual(left, right) {
    if (left instanceof Date && right instanceof Date) {
      return left.getTime() === right.getTime();
    }
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function rowsEqual(left, right) {
    if (left.length !== right.length) {
      return false;
    }
    for (var index = 0; index < left.length; index += 1) {
      if (!cellsEqual(left[index], right[index])) {
        return false;
      }
    }
    return true;
  }

  function writeChangedCells(sheet, physicalRow, changes) {
    var sorted = changes.slice().sort(function (left, right) {
      return left.columnIndex - right.columnIndex;
    });
    var groups = [];
    sorted.forEach(function (change) {
      var current = groups.length ? groups[groups.length - 1] : null;
      if (!current || change.columnIndex !== current.lastColumnIndex + 1) {
        current = {
          firstColumnIndex: change.columnIndex,
          lastColumnIndex: change.columnIndex,
          values: [change.value]
        };
        groups.push(current);
      } else {
        current.lastColumnIndex = change.columnIndex;
        current.values.push(change.value);
      }
    });
    groups.forEach(function (group) {
      sheet.getRange(
        physicalRow,
        group.firstColumnIndex + 1,
        1,
        group.values.length
      ).setValues([group.values]);
    });
  }

  function withLockedContext(sheet, callback) {
    return WorkOsUtilities.withScriptLock(function () {
      var context = createContext(sheet, LOCK_MARKER);
      try {
        return callback(context);
      } finally {
        context._workOsLockMarker = null;
      }
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  function createContextForHeldLock(sheet, lock) {
    if (!lock ||
        typeof lock.hasLock !== 'function' ||
        !lock.hasLock()) {
      throw new WorkOsAppError(
        'E_LOCK_REQUIRED',
        'TASK_REPOSITORY',
        false,
        '菫晄戟荳ｭ縺ｮScript Lock繧堤｢ｺ隱阪〒縺阪∪縺帙ｓ縲・
      );
    }
    return createContext(sheet, LOCK_MARKER);
  }

  /**
   * Build a lock-bound context from explicitly selected physical rows only.
   *
   * This is used by the callable edit flow so a one-row user edit does not
   * cause a full Task table read merely to enqueue Calendar intent. Empty
   * in-memory rows keep the same physical-row indexing contract as a regular
   * context; no unselected data row is read from Sheets.
   */
  function createScopedContextForHeldLock(sheet, physicalRows, lock) {
    if (!lock ||
        typeof lock.hasLock !== 'function' ||
        !lock.hasLock()) {
      throw new WorkOsAppError(
        'E_LOCK_REQUIRED',
        'TASK_REPOSITORY',
        false,
        '菫晄戟荳ｭ縺ｮ…5435 tokens truncated…IEW_TARGET_UNRESOLVED',
        '蟇ｾ雎｡Task縺梧悴遒ｺ螳壹・縺溘ａ蜿怜・縺ｧ縺阪∪縺帙ｓ縲・
      );
    }
    if (reviewType === 'PENDING_CONFLICT' && decision === 'ACCEPT') {
      return applyConflictReviewDecision(
        context,
        physicalRow,
        task,
        pending,
        settings.now
      );
    }
    var result = updateRowWithPatch(
      context,
      physicalRow,
      sameRowReviewPatch(task, reviewType, decision, pending),
      REVIEW_WRITE_FIELDS,
      settings.now
    );
    result.task_id = task.task_id;
    result.review_task_id = task.task_id;
    result.calendar_reconcile = true;
    return result;
  }

  function applyReviewDecision(options) {
    var settings = options || {};
    var sheet = settings.sheet || SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(WorkOsConfig.SHEETS.TASKS);
    return withLockedContext(sheet, function (context) {
      return applyReviewDecisionUnlocked(settings, context);
    });
  }

  function applyUserEdits(sheet, rowEdits, nowValue) {
    return WorkOsUtilities.withScriptLock(function (lock) {
      var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
      if (sheet.getMaxColumns() !== schema.length) {
        throw new WorkOsAppError(
          'E_SCHEMA_CONFLICT',
          'EDIT_HANDLER',
          false,
          '繧ｿ繧ｹ繧ｯ荳隕ｧ縺ｮ蛻玲焚縺郡chema縺ｨ荳閾ｴ縺励∪縺帙ｓ縲・
        );
      }
      var containsDecision = (rowEdits || []).some(function (edit) {
        return (edit.column_ids || []).indexOf('decision') !== -1;
      });
      var selectedRows = (rowEdits || []).map(function (edit) {
        return Number(edit.row);
      }).filter(function (rowNumber) {
        return Number.isInteger(rowNumber) &&
          rowNumber >= WorkOsConfig.DATA_START_ROW;
      });
      var lockedContext = containsDecision
        ? createContext(sheet, LOCK_MARKER)
        : createScopedContextForHeldLock(sheet, selectedRows, lock);
      var map = lockedContext.columnMap;
      var results = [];
      (rowEdits || []).forEach(function (edit) {
        var rowNumber = Number(edit.row);
        if (!Number.isInteger(rowNumber) ||
            rowNumber < WorkOsConfig.DATA_START_ROW) {
          return;
        }
        var row = rowForPhysicalRow(lockedContext, rowNumber);
        var task = directTaskFromRow(row, schema);
        if (!task.task_id && !task.origin_key) {
          return;
        }
        if ((edit.column_ids || []).indexOf('decision') !== -1) {
          if ((edit.column_ids || []).length !== 1) {
            results.push(rejectedReviewResult(
              lockedContext,
              rowNumber,
              task,
              'REVIEW_EDIT_AMBIGUOUS',
              '蛻､譁ｭ谺・・莉悶・鬆・岼縺ｨ蛻・￠縺ｦ謫堺ｽ懊＠縺ｦ縺上□縺輔＞縲・
            ));
            return;
          }
          results.push(applyReviewDecisionUnlocked(
            {
              reviewTaskId: task.task_id,
              decision: task.decision,
              expectedReviewRowVersion: task.row_version,
              now: nowValue
            },
            lockedContext
          ));
          return;
        }
        var patch = {};
        var manualFields = Array.isArray(task.manual_fields)
          ? task.manual_fields.slice()
          : [];
        (edit.column_ids || []).forEach(function (field) {
          if (WorkOsTaskReviewPolicy.MANUAL_PROTECTED_FIELDS.indexOf(field) !== -1 &&
              manualFields.indexOf(field) === -1) {
            manualFields.push(field);
          }
        });
        patch.manual_fields = manualFields;
        if ((edit.column_ids || []).indexOf('due_date') !== -1) {
          var deadlinePatch =
            WorkOsTaskReviewPolicy.buildDeadlinePatch({
              dueDate: task.due_date,
              source: 'MANUAL',
              clearSuggestedDueDate: true
            });
          Object.keys(deadlinePatch).forEach(function (field) {
            patch[field] = deadlinePatch[field];
          });
        }
        normalizeUserState(task, patch, edit.column_ids || []);
        if (task.status === 'REVIEW' &&
            ((edit.column_ids || []).indexOf('completed') !== -1 ||
             (edit.column_ids || []).indexOf('excluded') !== -1)) {
          patch.pending_action_type = '';
          patch.pending_changes_json = {};
          patch.needs_review = false;
          patch.review_state = 'APPLIED';
        }
        var updated = row.slice();
        var cellChanges = [];
        var allowed = {
          status: true,
          completed: true,
          excluded: true,
          waiting_for_reply: true,
          task_title: true,
          due_date: true,
          suggested_due_date: true,
          deadline_basis: true,
          priority: true,
          calendar_sync_mode: true,
          calendar_category: true,
          calendar_importance: true,
          needs_review: true,
          decision: true,
          review_state: true,
          review_type: true,
          manual_fields: true,
          pending_action_type: true,
          pending_changes_json: true
        };
        Object.keys(patch).forEach(function (field) {
          if (!allowed[field]) {
            throw new WorkOsAppError(
              'E_TASK_FIELD_NOT_UPDATABLE',
              'EDIT_HANDLER',
              false,
              '邱ｨ髮・ｭ｣隕丞喧field縺瑚ｨｱ蜿ｯ縺輔ｌ縺ｦ縺・∪縺帙ｓ縲・
            );
          }
          var index = map[field];
          var cell = valueForCell(schema[index], patch[field]);
          if (!cellsEqual(row[index], cell)) {
            updated[index] = cell;
            cellChanges.push({ columnIndex: index, value: cell });
          }
        });
        if (!cellChanges.length) {
          results.push({
            row: rowNumber,
            task_id: task.task_id,
            operation: 'NOOP',
            changed_fields: []
          });
          return;
        }
        var versionIndex = map.row_version;
        var updatedAtIndex = map.updated_at;
        updated[versionIndex] = Number(row[versionIndex] || 0) + 1;
        updated[updatedAtIndex] = nowValue || WorkOsUtilities.now();
        cellChanges.push({
          columnIndex: versionIndex,
          value: updated[versionIndex]
        });
        cellChanges.push({
          columnIndex: updatedAtIndex,
          value: updated[updatedAtIndex]
        });
        validateCandidateRow(updated, schema, 'EDIT_HANDLER');
        writeChangedCells(sheet, rowNumber, cellChanges);
        lockedContext.values[
          rowNumber - WorkOsConfig.DATA_START_ROW
        ] = updated;
        results.push({
          row: rowNumber,
          task_id: task.task_id,
          operation: 'UPDATE',
          changed_fields: Object.keys(patch),
          calendar_reconcile: true
        });
      });
      lockedContext._workOsLockMarker = null;
      return results;
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  function upsertTask(task, context) {
    if (context && context._workOsLockMarker === LOCK_MARKER) {
      return upsertTaskUnlocked(task, context);
    }
    var sheet = context && context.sheet
      ? context.sheet
      : SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WorkOsConfig.SHEETS.TASKS);
    return withLockedContext(sheet, function (lockedContext) {
      return upsertTaskUnlocked(task, lockedContext);
    });
  }

  function upsertTaskUnlocked(task, repositoryContext) {
    var target = sanitizeTaskForPersistence(task || {});
    if (repositoryContext.duplicateOriginKeys.length || repositoryContext.duplicateTaskIds.length) {
      throw new WorkOsAppError(
        'E_TASK_DUPLICATE_KEY',
        'TASK_REPOSITORY',
        false,
        '譌｢蟄狼ask縺ｫ荳ｻ繧ｭ繝ｼ驥崎､・′縺ゅｋ縺溘ａ譖ｸ霎ｼ縺ｿ繧貞●豁｢縺励∪縺励◆縲・
      );
    }

    var existingRow = repositoryContext.byOriginKey[String(target.origin_key)];
    if (!existingRow && target.task_id) {
      throw new WorkOsAppError(
        'E_TASK_ID_SUPPLIED',
        'TASK_REPOSITORY',
        false,
        '譁ｰ隕週ask縺ｮtask_id縺ｯRepository縺檎匱陦後＠縺ｾ縺吶・
      );
    }
    var validation = WorkOsSchemas.validateTaskForWrite(target, !existingRow);
    if (!validation.ok) {
      throw new WorkOsAppError(
        'E_TASK_VALIDATION',
        'TASK_REPOSITORY',
        false,
        'Task蜈･蜉帙′莉墓ｧ倥ｒ貅縺溘＠縺ｾ縺帙ｓ: ' + validation.errors.join(', ')
      );
    }
    if (existingRow) {
      return updateExistingTask(target, repositoryContext, existingRow);
    }
    return insertTask(target, repositoryContext);
  }

  function updateExistingTask(task, context, physicalRow) {
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    var cached = rowForPhysicalRow(context, physicalRow);
    var existing = context.sheet.getRange(
      physicalRow,
      1,
      1,
      schema.length
    ).getValues()[0];
    if (!rowsEqual(cached, existing)) {
      throw new WorkOsAppError(
        'E_TASK_CONFLICT',
        'TASK_REPOSITORY',
        true,
        'Task縺御ｻ悶・謫堺ｽ懊〒螟画峩縺輔ｌ縺溘◆繧∵嶌霎ｼ縺ｿ繧貞●豁｢縺励∪縺励◆縲・
      );
    }
    var currentTaskId = String(existing[context.columnMap.task_id] || '');
    if (!currentTaskId) {
      throw new WorkOsAppError(
        'E_TASK_CONFLICT',
        'TASK_REPOSITORY',
        false,
        '譌｢蟄椀rigin_key陦後↓task_id縺後↑縺・◆繧∬・蜍墓峩譁ｰ繧貞●豁｢縺励∪縺励◆縲・
      );
    }
    if (task.task_id && String(task.task_id) !== currentTaskId) {
      throw new WorkOsAppError(
        'E_TASK_CONFLICT',
        'TASK_REPOSITORY',
        false,
        '蜷後§origin_key縺ｫ逡ｰ縺ｪ繧逆ask_id縺梧欠螳壹＆繧後∪縺励◆縲・
      );
    }
    var updated = existing.slice();
    var changedFields = [];
    var changedCells = [];
    Object.keys(task).forEach(function (id) {
      if (!Object.prototype.hasOwnProperty.call(context.columnMap, id)) {
        return;
      }
      var columnIndex = context.columnMap[id];
      var candidate = valueForCell(schema[columnIndex], task[id]);
      if (cellsEqual(existing[columnIndex], candidate)) {
        return;
      }
      if (IMMUTABLE_ON_EXISTING_UPSERT[id]) {
        throw new WorkOsAppError(
          'E_TASK_IMMUTABLE_FIELD',
          'TASK_REPOSITORY',
          false,
          id + '縺ｯ蜷御ｸorigin_key縺ｮ蜀榊・逅・〒縺ｯ螟画峩縺ｧ縺阪∪縺帙ｓ縲・
        );
      }
      if (!SAFE_REPLAY_UPDATE_FIELDS[id]) {
        throw new WorkOsAppError(
          'E_TASK_FIELD_NOT_UPDATABLE',
          'TASK_REPOSITORY',
          false,
          id + '縺ｯ蜷御ｸorigin_key縺ｮ蜀榊・逅・〒縺ｯ閾ｪ蜍墓峩譁ｰ縺ｧ縺阪∪縺帙ｓ縲・
        );
      }
      updated[columnIndex] = candidate;
      changedFields.push(id);
      changedCells.push({ columnIndex: columnIndex, value: candidate });
    });
    if (!changedFields.length) {
      return {
        operation: 'NOOP',
        row: physicalRow,
        task_id: currentTaskId,
        origin_key: String(task.origin_key),
        changed_fields: []
      };
    }
    var rowVersionIndex = context.columnMap.row_version;
    var updatedAtIndex = context.columnMap.updated_at;
    updated[rowVersionIndex] = Number(existing[rowVersionIndex] || 0) + 1;
    updated[updatedAtIndex] = WorkOsUtilities.now();
    changedCells.push({
      columnIndex: rowVersionIndex,
      value: updated[rowVersionIndex]
    });
    changedCells.push({
      columnIndex: updatedAtIndex,
      value: updated[updatedAtIndex]
    });
    validateCandidateRow(
      updated,
      schema,
      'TASK_REPOSITORY'
    );
    writeChangedCells(context.sheet, physicalRow, changedCells);
    context.values[physicalRow - WorkOsConfig.DATA_START_ROW] = updated;
    changedFields.push('row_version', 'updated_at');
    return {
      operation: 'UPDATE',
      row: physicalRow,
      task_id: currentTaskId,
      origin_key: String(task.origin_key),
      changed_fields: changedFields
    };
  }

  function insertTask(task, context) {
    var nowValue = WorkOsUtilities.now();
    var prepared = defaultTask(task, nowValue);
    prepared.task_id = WorkOsUtilities.makeId('tsk_');
    prepared.origin_key = String(task.origin_key);
    prepared.manual_fields = [];
    prepared.row_version = 1;
    prepared.created_at = nowValue;
    prepared.updated_at = nowValue;
    if (context.byTaskId[prepared.task_id]) {
      throw new WorkOsAppError(
        'E_TASK_DUPLICATE_KEY',
        'TASK_REPOSITORY',
        false,
        '譁ｰ隕週ask ID縺梧里蟄狼ask縺ｨ陦晉ｪ√＠縺溘◆繧∵嶌霎ｼ縺ｿ繧貞●豁｢縺励∪縺励◆縲・
      );
    }
    var validation = WorkOsSchemas.validateTaskForWrite(prepared, true);
    if (!validation.ok) {
      throw new WorkOsAppError(
        'E_TASK_VALIDATION',
        'TASK_REPOSITORY',
        false,
        'Task蜈･蜉帙′莉墓ｧ倥ｒ貅縺溘＠縺ｾ縺帙ｓ: ' + validation.errors.join(', ')
      );
    }
    var physicalRow = findLogicalEmptyRow(
      context.taskIdValues,
      context.originKeyValues,
      WorkOsConfig.DATA_START_ROW
    );
    var rowsAdded = ensureCapacityForRow(context.sheet, physicalRow);
    while (context.values.length < physicalRow - WorkOsConfig.DATA_START_ROW + 1) {
      context.values.push(new Array(WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS).length).fill(''));
      context.taskIdValues.push(['']);
      context.originKeyValues.push(['']);
    }
    var output = makeRow(prepared);
    context.sheet.getRange(physicalRow, 1, 1, output.length).setValues([output]);
    syncReviewNote(context.sheet, physicalRow, prepared, null);
    var valueIndex = physicalRow - WorkOsConfig.DATA_START_ROW;
    context.values[valueIndex] = output;
    context.taskIdValues[valueIndex] = [prepared.task_id];
    context.originKeyValues[valueIndex] = [prepared.origin_key];
    context.byTaskId[prepared.task_id] = physicalRow;
    context.byOriginKey[prepared.origin_key] = physicalRow;
    if (prepared.stable_thread_key) {
      if (!context.byStableThreadKey[prepared.stable_thread_key]) {
        context.byStableThreadKey[prepared.stable_thread_key] = [];
      }
      context.byStableThreadKey[prepared.stable_thread_key].push(physicalRow);
    }
    context.logicalRows.push(physicalRow);
    return {
      operation: 'INSERT',
      row: physicalRow,
      task_id: prepared.task_id,
      origin_key: prepared.origin_key,
      rows_added: rowsAdded,
      changed_fields: Object.keys(prepared)
    };
  }

  function readTaskAtRow(context, physicalRow) {
    var row = rowForPhysicalRow(context, physicalRow);
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    var task = {};
    schema.forEach(function (item, index) {
      try {
        task[item.id] = valueFromCell(item, row[index]);
      } catch (error) {
        if (error instanceof WorkOsAppError) {
          throw error;
        }
        throw new WorkOsAppError(
          item.type === 'JsonArray' || item.type === 'JsonObject'
            ? 'E_INVALID_JSON'
            : 'E_TASK_TYPE',
          'TASK_REPOSITORY',
          false,
          item.id + '縺ｮ菫晏ｭ伜､縺御ｸ肴ｭ｣縺ｧ縺吶・
        );
      }
    });
    return task;
  }

  function findByTaskId(context, taskId) {
    var row = context.byTaskId[String(taskId || '')];
    return row ? readTaskAtRow(context, row) : null;
  }

  function findByOriginKey(context, originKey) {
    var row = context.byOriginKey[String(originKey || '')];
    return row ? readTaskAtRow(context, row) : null;
  }

  function findByStableThreadKey(context, stableThreadKey) {
    var rows = context.byStableThreadKey[String(stableThreadKey || '')] || [];
    return rows.map(function (row) {
      return readTaskAtRow(context, row);
    });
  }

  /**
   * Apply only Calendar-owned management fields to an existing Task.
   *
   * Calendar synchronization must not be able to overwrite user fields, AI
   * evidence or Task identity. The caller must hold the shared Script Lock.
   */
  function applyCalendarPatch(taskId, patch, context, nowValue) {
    assertLockedContext(context);
    var normalizedTaskId = String(taskId || '');
    var physicalRow = context.byTaskId[normalizedTaskId];
    if (!physicalRow) {
      throw new WorkOsAppError(
        'E_TARGET_NOT_RESOLVED',
        'CALENDAR_SYNC',
        false,
        'Calendar蜷梧悄蟇ｾ雎｡Task繧定ｧ｣豎ｺ縺ｧ縺阪∪縺帙ｓ縲・
      );
    }
    var allowed = {
      calendar_event_id: true,
      calendar_sync_status: true,
      last_calendar_sync_at: true
    };
    var normalizedPatch = patch || {};
    Object.keys(normalizedPatch).forEach(function (field) {
      if (!allowed[field]) {
        throw new WorkOsAppError(
          'E_TASK_FIELD_NOT_UPDATABLE',
          'CALENDAR_SYNC',
          false,
          'Calendar蜷梧悄縺悟､画峩縺ｧ縺阪↑縺Уask field縺ｧ縺吶・
        );
      }
    });
    var current = readTaskAtRow(context, physicalRow);
    var candidate = {};
    Object.keys(current).forEach(function (field) {
      candidate[field] = current[field];
    });
    Object.keys(normalizedPatch).forEach(function (field) {
      candidate[field] = normalizedPatch[field];
    });
    var validation = WorkOsSchemas.validateTaskForWrite(candidate, false);
    if (!validation.ok) {
      throw new WorkOsAppError(
        'E_TASK_VALIDATION',
        'CALENDAR_SYNC',
        false,
        'Calendar Task patch縺御ｻ墓ｧ倥ｒ貅縺溘＠縺ｾ縺帙ｓ縲・
      );
    }
    var result = updateRowWithPatch(
      context,
      physicalRow,
      normalizedPatch,
      allowed,
      nowValue
    );
    result.task_id = normalizedTaskId;
    return result;
  }

  function upsertPhase1MockTask() {
    WorkOsUtilities.assertTestMode('PHASE1_MOCK_TASK');
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(WorkOsConfig.SHEETS.TASKS);
    if (!sheet) {
      throw new WorkOsAppError(
        'E_SCHEMA_MISSING_SHEET',
        'TASK_REPOSITORY',
        false,
        '蜈医↓Phase 1繧ｻ繝・ヨ繧｢繝・・繧貞ｮ溯｡後＠縺ｦ縺上□縺輔＞縲・
      );
    }
    return upsertTask({
      origin_key: WorkOsUtilities.makeOriginKey('synthetic-message-phase1', 0),
      task_title: '譫ｶ遨ｺ雉・侭縺ｮ謠仙・貅門ｙ',
      status: 'OPEN',
      priority: 'MEDIUM',
      needs_review: false,
      completed: false,
      excluded: false,
      waiting_for_reply: false,
      source_action_index: 0,
      ai_provider: 'MOCK',
      ai_prompt_version: 'phase1-mock'
    }, { sheet: sheet });
  }

  return Object.freeze({
    calculateRowsToAppend: calculateRowsToAppend,
    ensureCapacityForRow: ensureCapacityForRow,
    findLogicalEmptyRow: findLogicalEmptyRow,
    createContext: createContext,
    withLockedContext: withLockedContext,
    createContextForHeldLock: createContextForHeldLock,
    createScopedContextForHeldLock: createScopedContextForHeldLock,
    buildContextFromValues: buildContextFromValues,
    upsertTask: upsertTask,
    readTaskAtRow: readTaskAtRow,
    findByTaskId: findByTaskId,
    findByOriginKey: findByOriginKey,
    findByStableThreadKey: findByStableThreadKey,
    sanitizeTaskForPersistence: sanitizeTaskForPersistence,
    applyCalendarPatch: applyCalendarPatch,
    stagePendingChange: stagePendingChange,
    applyReviewDecision: applyReviewDecision,
    applyUserEdits: applyUserEdits,
    upsertPhase1MockTask: upsertPhase1MockTask
  });
}());

