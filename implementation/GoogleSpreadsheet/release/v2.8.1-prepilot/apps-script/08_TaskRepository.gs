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
        'タスク一覧の内部列IDが仕様と一致しません。'
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
          columnDefinition.id + 'のEnum値が不正です。'
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
          columnDefinition.id + 'がIntegerではありません。'
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
          columnDefinition.id + 'がNumberではありません。'
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
          columnDefinition.id + 'がBooleanではありません。'
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
          columnDefinition.id + 'が有効な日付ではありません。'
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
        columnDefinition.id + 'がStringではありません。'
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
        'Task行が読取範囲外です。'
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
        '保持中のScript Lockを確認できません。'
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
        '保持中のScript Lockを確認できません。'
      );
    }
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    var ids = sheet.getRange(1, 1, 1, schema.length).getValues()[0];
    var expected = WorkOsSchemas.getInternalIds(
      WorkOsConfig.SHEETS.TASKS
    );
    if (JSON.stringify(ids) !== JSON.stringify(expected)) {
      throw new WorkOsAppError(
        'E_SCHEMA_MISSING_COLUMN',
        'TASK_REPOSITORY',
        false,
        'タスク一覧の内部列IDが仕様と一致しません。'
      );
    }
    var rowsByNumber = {};
    (physicalRows || []).forEach(function (rowValue) {
      var rowNumber = Number(rowValue);
      if (Number.isInteger(rowNumber) &&
          rowNumber >= WorkOsConfig.DATA_START_ROW) {
        rowsByNumber[rowNumber] = true;
      }
    });
    var rows = Object.keys(rowsByNumber).map(function (rowValue) {
      return Number(rowValue);
    }).sort(function (left, right) {
      return left - right;
    });
    var highestRow = rows.length
      ? rows[rows.length - 1]
      : WorkOsConfig.DATA_START_ROW - 1;
    var values = [];
    for (
      var row = WorkOsConfig.DATA_START_ROW;
      row <= highestRow;
      row += 1
    ) {
      values.push(new Array(schema.length).fill(''));
    }
    rows.forEach(function (rowNumber) {
      values[rowNumber - WorkOsConfig.DATA_START_ROW] =
        sheet.getRange(
          rowNumber,
          1,
          1,
          schema.length
        ).getValues()[0];
    });
    var context = buildContextFromValues(
      sheet,
      WorkOsSchemas.buildColumnMapFromIds(ids),
      values
    );
    Object.defineProperty(context, '_workOsLockMarker', {
      value: LOCK_MARKER,
      enumerable: false,
      writable: true,
      configurable: true
    });
    return context;
  }

  function assertLockedContext(context) {
    if (!context || context._workOsLockMarker !== LOCK_MARKER) {
      throw new WorkOsAppError(
        'E_LOCK_REQUIRED',
        'TASK_REPOSITORY',
        false,
        'Task更新にはScript Lockが必要です。'
      );
    }
  }

  function updateRowWithPatch(
    context,
    physicalRow,
    patch,
    allowedFields,
    nowValue
  ) {
    assertLockedContext(context);
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    var cached = rowForPhysicalRow(context, physicalRow);
    var current = context.sheet.getRange(
      physicalRow,
      1,
      1,
      schema.length
    ).getValues()[0];
    if (!rowsEqual(cached, current)) {
      throw new WorkOsAppError(
        'E_TASK_CONFLICT',
        'TASK_REPOSITORY',
        true,
        'Taskが他の操作で変更されたため書込みを停止しました。'
      );
    }
    var updated = current.slice();
    var changes = [];
    Object.keys(patch || {}).forEach(function (field) {
      if (!allowedFields[field] ||
          !Object.prototype.hasOwnProperty.call(context.columnMap, field)) {
        throw new WorkOsAppError(
          'E_TASK_FIELD_NOT_UPDATABLE',
          'TASK_REPOSITORY',
          false,
          '許可されていないTask field変更です。'
        );
      }
      var index = context.columnMap[field];
      var cellValue = valueForCell(schema[index], patch[field]);
      if (!cellsEqual(updated[index], cellValue)) {
        updated[index] = cellValue;
        changes.push({ columnIndex: index, value: cellValue });
      }
    });
    if (!changes.length) {
      return { operation: 'NOOP', row: physicalRow, changed_fields: [] };
    }
    var versionIndex = context.columnMap.row_version;
    var updatedAtIndex = context.columnMap.updated_at;
    updated[versionIndex] = Number(current[versionIndex] || 0) + 1;
    updated[updatedAtIndex] = nowValue || WorkOsUtilities.now();
    changes.push({
      columnIndex: versionIndex,
      value: updated[versionIndex]
    });
    changes.push({
      columnIndex: updatedAtIndex,
      value: updated[updatedAtIndex]
    });
    writeChangedCells(context.sheet, physicalRow, changes);
    context.values[physicalRow - WorkOsConfig.DATA_START_ROW] = updated;
    return {
      operation: 'UPDATE',
      row: physicalRow,
      changed_fields: Object.keys(patch).concat(['row_version', 'updated_at'])
    };
  }

  function stagePendingChange(taskId, actionType, envelope, context) {
    assertLockedContext(context);
    var physicalRow = context.byTaskId[String(taskId || '')];
    if (!physicalRow) {
      throw new WorkOsAppError(
        'E_TARGET_NOT_RESOLVED',
        'TASK_REPOSITORY',
        false,
        '変更対象Taskを解決できません。'
      );
    }
    if (WorkOsAiAdapter.ACTION_TYPES.indexOf(String(actionType || '')) === -1) {
      throw new WorkOsAppError(
        'E_INVALID_ENUM',
        'TASK_REPOSITORY',
        false,
        'pending Actionが不正です。'
      );
    }
    var current = readTaskAtRow(context, physicalRow);
    var payload = sanitizeStructuredValue(envelope || {});
    if (!payload.origin_key ||
        !payload.changes ||
        typeof payload.changes !== 'object' ||
        Array.isArray(payload.changes) ||
        Object.prototype.hasOwnProperty.call(payload.changes, 'comment')) {
      throw new WorkOsAppError(
        'E_TASK_VALIDATION',
        'TASK_REPOSITORY',
        false,
        'pending変更の構造が不正です。'
      );
    }
    var provenance = WorkOsAiAdapter.validateProvenance(
      payload.ai_provenance
    );
    var existingPayload = current.pending_changes_json &&
      typeof current.pending_changes_json === 'object' &&
      !Array.isArray(current.pending_changes_json)
      ? current.pending_changes_json
      : {};
    if (current.pending_action_type) {
      if (existingPayload.origin_key === payload.origin_key &&
          current.pending_action_type === actionType &&
          JSON.stringify(existingPayload) === JSON.stringify(payload)) {
        return {
          operation: 'NOOP',
          row: physicalRow,
          task_id: current.task_id,
          changed_fields: []
        };
      }
      throw new WorkOsAppError(
        'E_TASK_PENDING_CONFLICT',
        'TASK_REPOSITORY',
        false,
        '未処理のpending変更があるため上書きしません。'
      );
    }
    var result = updateRowWithPatch(
      context,
      physicalRow,
      {
        needs_review: true,
        decision: 'NONE',
        review_state: 'OPEN',
        review_type: 'EXISTING_CHANGE',
        pending_action_type: actionType,
        pending_changes_json: payload,
        ai_provider: provenance.provider,
        ai_model: provenance.model,
        ai_prompt_version: provenance.prompt_version
      },
      {
        needs_review: true,
        decision: true,
        review_state: true,
        review_type: true,
        pending_action_type: true,
        pending_changes_json: true,
        ai_provider: true,
        ai_model: true,
        ai_prompt_version: true
      }
    );
    result.task_id = current.task_id;
    return result;
  }

  function directTaskFromRow(row, schema) {
    var task = {};
    schema.forEach(function (column, index) {
      task[column.id] = valueFromCell(column, row[index]);
    });
    return task;
  }

  function normalizeUserState(task, patch, editedColumnIds) {
    function effective(field) {
      return Object.prototype.hasOwnProperty.call(patch, field)
        ? patch[field]
        : task[field];
    }
    var edited = editedColumnIds || [];
    var statusWasEdited = edited.indexOf('status') !== -1;
    var waitingWasEdited = edited.indexOf('waiting_for_reply') !== -1;
    if (effective('excluded') === true ||
        (statusWasEdited && effective('status') === 'EXCLUDED')) {
      patch.status = 'EXCLUDED';
      patch.excluded = true;
      patch.completed = false;
      patch.waiting_for_reply = false;
    } else if (effective('completed') === true ||
        (statusWasEdited && effective('status') === 'DONE')) {
      patch.status = 'DONE';
      patch.completed = true;
      patch.excluded = false;
      patch.waiting_for_reply = false;
    } else if (effective('status') === 'CANCELLED') {
      patch.completed = false;
      patch.excluded = false;
      patch.waiting_for_reply = false;
    } else if (effective('waiting_for_reply') === true ||
        (statusWasEdited && effective('status') === 'WAITING')) {
      patch.status = 'WAITING';
      patch.waiting_for_reply = true;
    } else if (waitingWasEdited &&
        task.status === 'WAITING' &&
        effective('waiting_for_reply') === false) {
      patch.status = 'OPEN';
    }
  }

  function applyUserEdits(sheet, rowEdits, nowValue) {
    return WorkOsUtilities.withScriptLock(function () {
      var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
      if (sheet.getMaxColumns() !== schema.length) {
        throw new WorkOsAppError(
          'E_SCHEMA_CONFLICT',
          'EDIT_HANDLER',
          false,
          'タスク一覧の列数がSchemaと一致しません。'
        );
      }
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
      var map = WorkOsSchemas.buildColumnMapFromIds(ids);
      var results = [];
      (rowEdits || []).forEach(function (edit) {
        var rowNumber = Number(edit.row);
        if (!Number.isInteger(rowNumber) ||
            rowNumber < WorkOsConfig.DATA_START_ROW) {
          return;
        }
        var row = sheet.getRange(
          rowNumber,
          1,
          1,
          schema.length
        ).getValues()[0];
        var task = directTaskFromRow(row, schema);
        if (!task.task_id && !task.origin_key) {
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
        if ((edit.column_ids || []).indexOf('decision') !== -1) {
          var decision = WorkOsTaskReviewPolicy.decisionPatch(
            task,
            task.decision
          );
          Object.keys(decision).forEach(function (field) {
            patch[field] = decision[field];
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
              '編集正規化fieldが許可されていません。'
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
        writeChangedCells(sheet, rowNumber, cellChanges);
        results.push({
          row: rowNumber,
          task_id: task.task_id,
          operation: 'UPDATE',
          changed_fields: Object.keys(patch)
        });
      });
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
        '既存Taskに主キー重複があるため書込みを停止しました。'
      );
    }

    var existingRow = repositoryContext.byOriginKey[String(target.origin_key)];
    var validation = WorkOsSchemas.validateTaskForWrite(target, !existingRow);
    if (!validation.ok) {
      throw new WorkOsAppError(
        'E_TASK_VALIDATION',
        'TASK_REPOSITORY',
        false,
        'Task入力が仕様を満たしません: ' + validation.errors.join(', ')
      );
    }
    if (existingRow) {
      return updateExistingTask(target, repositoryContext, existingRow);
    }
    if (target.task_id) {
      throw new WorkOsAppError(
        'E_TASK_ID_SUPPLIED',
        'TASK_REPOSITORY',
        false,
        '新規Taskのtask_idはRepositoryが発行します。'
      );
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
        'Taskが他の操作で変更されたため書込みを停止しました。'
      );
    }
    var currentTaskId = String(existing[context.columnMap.task_id] || '');
    if (!currentTaskId) {
      throw new WorkOsAppError(
        'E_TASK_CONFLICT',
        'TASK_REPOSITORY',
        false,
        '既存origin_key行にtask_idがないため自動更新を停止しました。'
      );
    }
    if (task.task_id && String(task.task_id) !== currentTaskId) {
      throw new WorkOsAppError(
        'E_TASK_CONFLICT',
        'TASK_REPOSITORY',
        false,
        '同じorigin_keyに異なるtask_idが指定されました。'
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
          id + 'は同一origin_keyの再処理では変更できません。'
        );
      }
      if (!SAFE_REPLAY_UPDATE_FIELDS[id]) {
        throw new WorkOsAppError(
          'E_TASK_FIELD_NOT_UPDATABLE',
          'TASK_REPOSITORY',
          false,
          id + 'は同一origin_keyの再処理では自動更新できません。'
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
        '新規Task IDが既存Taskと衝突したため書込みを停止しました。'
      );
    }
    var validation = WorkOsSchemas.validateTaskForWrite(prepared, true);
    if (!validation.ok) {
      throw new WorkOsAppError(
        'E_TASK_VALIDATION',
        'TASK_REPOSITORY',
        false,
        'Task入力が仕様を満たしません: ' + validation.errors.join(', ')
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
          item.id + 'の保存値が不正です。'
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
        'Calendar同期対象Taskを解決できません。'
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
          'Calendar同期が変更できないTask fieldです。'
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
        'Calendar Task patchが仕様を満たしません。'
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
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(WorkOsConfig.SHEETS.TASKS);
    if (!sheet) {
      throw new WorkOsAppError(
        'E_SCHEMA_MISSING_SHEET',
        'TASK_REPOSITORY',
        false,
        '先にPhase 1セットアップを実行してください。'
      );
    }
    return upsertTask({
      origin_key: WorkOsUtilities.makeOriginKey('synthetic-message-phase1', 0),
      task_title: '架空資料の提出準備',
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
    applyUserEdits: applyUserEdits,
    upsertPhase1MockTask: upsertPhase1MockTask
  });
}());
