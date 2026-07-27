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
    authoritative_snapshot_json: true,
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
  var SNAPSHOT_FIELD = 'authoritative_snapshot_json';
  var SNAPSHOT_VALUE_FIELDS = Object.freeze({
    needs_review: true,
    decision: true,
    status: true,
    completed: true,
    excluded: true,
    task_title: true,
    due_date: true,
    suggested_due_date: true,
    deadline_basis: true,
    priority: true,
    waiting_for_reply: true,
    calendar_sync_mode: true,
    comment: true,
    review_state: true,
    review_type: true,
    calendar_category: true,
    calendar_importance: true,
    manual_fields: true,
    pending_action_type: true,
    pending_changes_json: true
  });

  function calculateRowsToAppend(currentMaxRows, requiredRow) {
    if (requiredRow <= currentMaxRows) {
      return 0;
    }
    return Math.ceil(
      (requiredRow - currentMaxRows) / WorkOsConfig.ROW_EXPANSION_UNIT
    ) * WorkOsConfig.ROW_EXPANSION_UNIT;
  }

  function findRuntimeTaskProtection(protections, description) {
    for (var index = 0; index < protections.length; index += 1) {
      if (protections[index].getDescription() === description) {
        return protections[index];
      }
    }
    return null;
  }

  function configureRuntimeTaskProtection(protection) {
    protection.setWarningOnly(false);
    var effectiveUser = Session.getEffectiveUser();
    var effectiveEmail = effectiveUser.getEmail();
    if (!effectiveEmail) {
      throw new WorkOsAppError(
        'E_PROTECTION_IDENTITY_UNAVAILABLE',
        'TASK_ROW_EXPANSION',
        false,
        'Task行拡張時のProtection実行者を確認できません。'
      );
    }
    protection.addEditor(effectiveUser);
    var removableEditors = protection.getEditors().filter(function (editor) {
      return editor.getEmail() !== effectiveEmail;
    });
    if (removableEditors.length) {
      protection.removeEditors(removableEditors);
    }
    if (protection.canDomainEdit()) {
      protection.setDomainEdit(false);
    }
  }

  function buildRuntimeValidation(planItem) {
    if (planItem.validation === 'CHECKBOX') {
      return SpreadsheetApp.newDataValidation()
        .requireCheckbox()
        .setAllowInvalid(false)
        .build();
    }
    if (planItem.validation === 'ENUM' && planItem.allowedValues) {
      return SpreadsheetApp.newDataValidation()
        .requireValueInList(planItem.allowedValues, true)
        .setAllowInvalid(false)
        .build();
    }
    return null;
  }

  function assertRuntimeTaskControlPrerequisites(sheet) {
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    var prefix = 'WORK_OS_V2_PHASE1_' +
      WorkOsConfig.SHEETS.TASKS;
    var managementProtection = findRuntimeTaskProtection(
      sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE),
      prefix + '_MANAGEMENT_COLUMNS'
    );
    var editPolicy = findRuntimeTaskProtection(
      sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET),
      prefix + '_EDIT_POLICY'
    );
    var firstHidden = schema.findIndex(function (item) {
      return item.visible === false;
    });
    if (!managementProtection || !editPolicy || firstHidden < 0 ||
        typeof managementProtection.setRange !== 'function') {
      throw new WorkOsAppError(
        'E_TASK_PROTECTION_MISSING',
        'TASK_ROW_EXPANSION',
        false,
        'Task行拡張に必要なProtectionを確認できません。'
      );
    }
    var effectiveUser = Session.getEffectiveUser();
    if (!effectiveUser || !effectiveUser.getEmail()) {
      throw new WorkOsAppError(
        'E_PROTECTION_IDENTITY_UNAVAILABLE',
        'TASK_ROW_EXPANSION',
        false,
        'Task行拡張時のProtection実行者を確認できません。'
      );
    }
  }

  function extendTaskControlsAfterExpansion(sheet, firstRow, rowCount) {
    var count = Number(rowCount || 0);
    if (count <= 0) {
      return { extended: false, row_count: 0 };
    }
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    WorkOsSchemas.validationPlanForSheet(
      WorkOsConfig.SHEETS.TASKS
    ).forEach(function (planItem) {
      var validation = buildRuntimeValidation(planItem);
      if (validation) {
        sheet.getRange(
          firstRow,
          planItem.columnIndex,
          count,
          1
        ).setDataValidation(validation);
      }
    });
    schema.forEach(function (item, index) {
      var format = '';
      if (item.type === 'Date') {
        format = WorkOsConfig.DATE_FORMAT;
      } else if (item.type === 'DateTime') {
        format = WorkOsConfig.DATETIME_FORMAT;
      } else if (item.type === 'Integer') {
        format = '0';
      } else if (item.type === 'Number') {
        format = '0.00';
      }
      if (format) {
        sheet.getRange(firstRow, index + 1, count, 1)
          .setNumberFormat(format);
      }
    });

    var prefix = 'WORK_OS_V2_PHASE1_' +
      WorkOsConfig.SHEETS.TASKS;
    var rangeProtections = sheet.getProtections(
      SpreadsheetApp.ProtectionType.RANGE
    );
    var managementProtection = findRuntimeTaskProtection(
      rangeProtections,
      prefix + '_MANAGEMENT_COLUMNS'
    );
    var firstHidden = schema.findIndex(function (item) {
      return item.visible === false;
    });
    if (!managementProtection || firstHidden < 0 ||
        typeof managementProtection.setRange !== 'function') {
      throw new WorkOsAppError(
        'E_TASK_PROTECTION_MISSING',
        'TASK_ROW_EXPANSION',
        false,
        'Task管理列Protectionを確認できないため行拡張を停止しました。'
      );
    }
    managementProtection.setRange(sheet.getRange(
      1,
      firstHidden + 1,
      sheet.getMaxRows(),
      schema.length - firstHidden
    ));
    configureRuntimeTaskProtection(managementProtection);

    var sheetProtections = sheet.getProtections(
      SpreadsheetApp.ProtectionType.SHEET
    );
    var editPolicy = findRuntimeTaskProtection(
      sheetProtections,
      prefix + '_EDIT_POLICY'
    );
    if (!editPolicy) {
      throw new WorkOsAppError(
        'E_TASK_PROTECTION_MISSING',
        'TASK_ROW_EXPANSION',
        false,
        'Task編集Policy Protectionを確認できないため行拡張を停止しました。'
      );
    }
    var editableRowCount = Math.max(
      1,
      sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
    );
    var editableRanges = [];
    schema.forEach(function (item, index) {
      if (item.editable) {
        editableRanges.push(sheet.getRange(
          WorkOsConfig.DATA_START_ROW,
          index + 1,
          editableRowCount,
          1
        ));
      }
    });
    editPolicy.setUnprotectedRanges(editableRanges);
    configureRuntimeTaskProtection(editPolicy);
    return {
      extended: true,
      first_row: firstRow,
      row_count: count
    };
  }

  function ensureCapacityForRow(sheet, requiredRow) {
    var rowsToAppend = calculateRowsToAppend(sheet.getMaxRows(), requiredRow);
    if (rowsToAppend > 0) {
      var priorMaxRows = sheet.getMaxRows();
      if (typeof sheet.getProtections === 'function') {
        // Verify every fail-closed prerequisite before changing the grid.
        assertRuntimeTaskControlPrerequisites(sheet);
      }
      sheet.insertRowsAfter(priorMaxRows, rowsToAppend);
      // Apps Script does not guarantee that row insertion inherits canonical
      // validations, formats or protection geometry. Production Sheets expose
      // getProtections(); narrow local test doubles intentionally may not.
      if (typeof sheet.getProtections === 'function') {
        extendTaskControlsAfterExpansion(
          sheet,
          priorMaxRows + 1,
          rowsToAppend
        );
      }
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

  function sanitizeReviewDisplay(value) {
    var text;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      text = Utilities.formatDate(
        value,
        WorkOsConfig.TIMEZONE,
        'yyyy-MM-dd'
      );
    } else if (value === true) {
      text = 'はい';
    } else if (value === false) {
      text = 'いいえ';
    } else {
      text = String(value == null || value === '' ? '未設定' : value);
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
      .replace(/https?:\/\/\S+/gi, '[リンク]')
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[メール]')
      .replace(/\b(?:msg|thr|tsk|org)_[0-9a-f]{16,}\b/gi, '[識別子]')
      .replace(/[\r\n\t]+/g, ' ')
      .slice(0, 120);
  }

  function reviewFieldLabel(field) {
    var labels = {
      task_title: '件名',
      status: '状態',
      completed: '完了',
      excluded: '対象外',
      waiting_for_reply: '返信待ち',
      due_date: '期限',
      suggested_due_date: '推奨期限',
      deadline_basis: '期限根拠',
      priority: '優先度',
      calendar_sync_mode: 'Calendar同期',
      calendar_category: 'Calendar分類',
      calendar_importance: 'Calendar重要度'
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
    var latestValues = isPlainObject(pending.latest_current_values)
      ? pending.latest_current_values
      : {};
    var lines = [
      '変更: ' + sanitizeReviewDisplay(value.pending_action_type),
      '対象: ' + sanitizeReviewDisplay(value.task_title)
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
        latestValues,
        field
      )
        ? latestValues[field]
        : (Object.prototype.hasOwnProperty.call(
        currentValues,
        field
      )
        ? currentValues[field]
        : (previousTask &&
          Object.prototype.hasOwnProperty.call(previousTask, field)
          ? previousTask[field]
          : '対象未解決'));
      lines.push(
        reviewFieldLabel(field) + ' 現在値: ' +
          sanitizeReviewDisplay(before) +
          ' / 変更後: ' +
          sanitizeReviewDisplay(pending.changes[field])
      );
    });
    if (Object.prototype.hasOwnProperty.call(
      pending.changes,
      'deadline_basis'
    )) {
      lines.push(
        '期限根拠: ' +
          sanitizeReviewDisplay(pending.changes.deadline_basis)
      );
    }
    lines.push(
      '手動競合: ' +
        (Array.isArray(pending.manual_conflicts) &&
         pending.manual_conflicts.length ? 'あり' : 'なし')
    );
    if (pending.past_due === true) {
      lines.push('警告: 過去日の期限候補です。');
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
    var row = schema.map(function (item) {
      return Object.prototype.hasOwnProperty.call(task, item.id)
        ? valueForCell(item, task[item.id])
        : '';
    });
    return attachAuthoritativeSnapshot(
      row,
      schema,
      WorkOsSchemas.buildColumnMapFromIds(
        WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS)
      )
    );
  }

  function snapshotSafeValue(value) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (Array.isArray(value)) {
      return value.map(snapshotSafeValue);
    }
    if (value && typeof value === 'object') {
      var output = {};
      Object.keys(value).sort().forEach(function (key) {
        output[key] = snapshotSafeValue(value[key]);
      });
      return output;
    }
    return value;
  }

  function buildAuthoritativeSnapshot(row, schema, columnMap) {
    var values = {};
    schema.forEach(function (item, index) {
      if (!SNAPSHOT_VALUE_FIELDS[item.id]) {
        return;
      }
      values[item.id] = snapshotSafeValue(
        valueFromCell(item, row[index])
      );
    });
    return {
      schema_version: WorkOsConfig.SCHEMA_VERSION,
      task_id: String(row[columnMap.task_id] || ''),
      values: values
    };
  }

  function attachAuthoritativeSnapshot(row, schema, columnMap) {
    var map = columnMap || WorkOsSchemas.buildColumnMapFromIds(
      WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS)
    );
    var snapshotIndex = map[SNAPSHOT_FIELD];
    if (!Number.isInteger(snapshotIndex)) {
      throw new WorkOsAppError(
        'E_TASK_SNAPSHOT_SCHEMA',
        'TASK_REPOSITORY',
        false,
        'Task snapshot列を確認できません。'
      );
    }
    var output = row.slice();
    output[snapshotIndex] = valueForCell(
      schema[snapshotIndex],
      buildAuthoritativeSnapshot(output, schema, map)
    );
    return output;
  }

  function authoritativeRowFromSnapshot(row, schema, columnMap) {
    var snapshotIndex = columnMap[SNAPSHOT_FIELD];
    var snapshot;
    try {
      snapshot = valueFromCell(schema[snapshotIndex], row[snapshotIndex]);
    } catch (error) {
      snapshot = null;
    }
    if (!isPlainObject(snapshot) ||
        snapshot.schema_version !== WorkOsConfig.SCHEMA_VERSION ||
        !isPlainObject(snapshot.values)) {
      throw new WorkOsAppError(
        'E_TASK_SNAPSHOT_INVALID',
        'EDIT_HANDLER',
        false,
        '編集前のTask snapshotを確認できないため反映を停止しました。'
      );
    }
    if (String(row[columnMap.task_id] || '') !==
        String(snapshot.task_id || '')) {
      throw new WorkOsAppError(
        'E_TASK_SNAPSHOT_INVALID',
        'EDIT_HANDLER',
        false,
        'Task snapshotのTask IDが一致しません。'
      );
    }
    var restored = schema.map(function (item, index) {
      if (item.id === SNAPSHOT_FIELD) {
        return row[index];
      }
      if (!SNAPSHOT_VALUE_FIELDS[item.id]) {
        return row[index];
      }
      if (!Object.prototype.hasOwnProperty.call(
        snapshot.values,
        item.id
      )) {
        throw new WorkOsAppError(
          'E_TASK_SNAPSHOT_INVALID',
          'EDIT_HANDLER',
          false,
          'Task snapshotの必須fieldが不足しています。'
        );
      }
      return valueForCell(item, snapshot.values[item.id]);
    });
    restored[snapshotIndex] = valueForCell(
      schema[snapshotIndex],
      snapshot
    );
    return restored;
  }

  function migrateLegacyRowToSnapshot(sourceRow) {
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    if (!Array.isArray(sourceRow) ||
        sourceRow.length !== schema.length - 1 ||
        schema[schema.length - 1].id !== SNAPSHOT_FIELD) {
      throw new WorkOsAppError(
        'E_TASK_SNAPSHOT_SCHEMA',
        'V2_SCHEMA_EXTENSION',
        false,
        'Task snapshot追加前のv2 Schemaを確認できません。'
      );
    }
    var row = sourceRow.slice();
    row.push('');
    row = attachAuthoritativeSnapshot(
      row,
      schema,
      WorkOsSchemas.buildColumnMapFromIds(
        WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS)
      )
    );
    return row;
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

  function validateCandidateRow(row, schema, stage) {
    var candidate = directTaskFromRow(row, schema);
    var validation = WorkOsSchemas.validateTaskForWrite(candidate, false);
    if (!validation.ok) {
      throw new WorkOsAppError(
        'E_TASK_VALIDATION',
        stage || 'TASK_REPOSITORY',
        false,
        'Task状態が仕様を満たさないため書込みを停止しました: ' +
          validation.errors.join(', ')
      );
    }
    return candidate;
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
    var snapshotChanged = false;
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
        if (SNAPSHOT_VALUE_FIELDS[field]) {
          snapshotChanged = true;
        }
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
    if (snapshotChanged) {
      updated = attachAuthoritativeSnapshot(
        updated,
        schema,
        context.columnMap
      );
    }
    var previousTask = directTaskFromRow(current, schema);
    var candidateTask = validateCandidateRow(
      updated,
      schema,
      'TASK_REPOSITORY'
    );
    if (snapshotChanged) {
      context.sheet.getRange(
        physicalRow,
        1,
        1,
        schema.length
      ).setValues([updated]);
    } else {
      writeChangedCells(context.sheet, physicalRow, changes);
    }
    syncReviewNote(
      context.sheet,
      physicalRow,
      candidateTask,
      previousTask
    );
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
    var currentValidation = WorkOsSchemas.validateTaskForWrite(current, false);
    if (!currentValidation.ok ||
        current.status === 'DONE' ||
        current.status === 'EXCLUDED' ||
        current.status === 'CANCELLED') {
      throw new WorkOsAppError(
        'E_TASK_VALIDATION',
        'TASK_REPOSITORY',
        false,
        'terminalまたは不整合Taskにはpending変更を作成できません。'
      );
    }
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
    payload.action_type = String(actionType);
    payload.target_task_id = current.task_id;
    payload.expected_target_row_version = Number(current.row_version);
    payload.target_resolution = 'RESOLVED';
    if (!Array.isArray(payload.manual_conflicts)) {
      payload.manual_conflicts = [];
    }
    if (!isPlainObject(payload.current_values)) {
      payload.current_values = {};
    }
    payload.expected_manual_fields = Array.isArray(current.manual_fields)
      ? current.manual_fields.slice().sort()
      : [];
    payload.latest_current_values = {};
    Object.keys(payload.changes).forEach(function (field) {
      if (REVIEW_WRITE_FIELDS[field] === true &&
          Object.prototype.hasOwnProperty.call(current, field)) {
        payload.current_values[field] = sanitizeStructuredValue(
          current[field]
        );
      }
    });
    var existingPayload = current.pending_changes_json &&
      typeof current.pending_changes_json === 'object' &&
      !Array.isArray(current.pending_changes_json)
      ? current.pending_changes_json
      : {};
    if (current.pending_action_type) {
      if (existingPayload.origin_key === payload.origin_key &&
          current.pending_action_type === actionType) {
        payload.target_task_id = existingPayload.target_task_id;
        payload.expected_target_row_version =
          existingPayload.expected_target_row_version;
        payload.target_resolution = existingPayload.target_resolution;
      }
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

  function restagePendingChangeUnlocked(taskId, context, nowValue) {
    assertLockedContext(context);
    var physicalRow = context.byTaskId[String(taskId || '')];
    if (!physicalRow) {
      throw new WorkOsAppError(
        'E_TARGET_NOT_RESOLVED',
        'TASK_REVIEW',
        false,
        '再stageするReview Taskを解決できません。'
      );
    }
    var task = readTaskAtRow(context, physicalRow);
    var pending = isPlainObject(task.pending_changes_json)
      ? sanitizeStructuredValue(task.pending_changes_json)
      : null;
    if (task.needs_review !== true ||
        task.review_state !== 'OPEN' ||
        task.review_type !== 'EXISTING_CHANGE' ||
        !task.pending_action_type ||
        !pending ||
        !isPlainObject(pending.changes) ||
        !assertReviewChanges(pending.changes)) {
      throw new WorkOsAppError(
        'REVIEW_RESTAGE_NOT_AVAILABLE',
        'TASK_REVIEW',
        false,
        '再stage可能な同一行Reviewではありません。'
      );
    }
    pending.target_task_id = task.task_id;
    pending.target_resolution = 'RESOLVED';
    pending.expected_target_row_version = Number(task.row_version);
    pending.current_values = {};
    Object.keys(pending.changes).forEach(function (field) {
      pending.current_values[field] =
        sanitizeStructuredValue(task[field]);
    });
    pending.expected_manual_fields = Array.isArray(task.manual_fields)
      ? task.manual_fields.slice().sort()
      : [];
    pending.latest_current_values = {};
    pending.manual_conflicts = Object.keys(pending.changes)
      .filter(function (field) {
        return pending.expected_manual_fields.indexOf(field) !== -1;
      })
      .sort();
    delete pending.application_checkpoint;
    delete pending.checkpoint_target_row_version;
    var result = updateRowWithPatch(
      context,
      physicalRow,
      {
        decision: 'NONE',
        pending_changes_json: pending
      },
      {
        decision: true,
        pending_changes_json: true
      },
      nowValue
    );
    result.task_id = task.task_id;
    result.review_task_id = task.task_id;
    result.calendar_reconcile = false;
    return result;
  }

  function restagePendingChange(options) {
    var settings = options || {};
    var sheet = settings.sheet || SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(WorkOsConfig.SHEETS.TASKS);
    return withLockedContext(sheet, function (context) {
      return restagePendingChangeUnlocked(
        settings.reviewTaskId,
        context,
        settings.now
      );
    });
  }

  function directTaskFromRow(row, schema) {
    var task = {};
    schema.forEach(function (column, index) {
      if (column.id === SNAPSHOT_FIELD) {
        return;
      }
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

  function isPlainObject(value) {
    return value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value);
  }

  function priorDecisionForState(reviewState) {
    if (reviewState === 'APPLIED') {
      return 'ACCEPT';
    }
    if (reviewState === 'REJECTED') {
      return 'REJECT';
    }
    return 'NONE';
  }

  function revertDecisionCell(context, physicalRow, priorDecision) {
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    var decisionIndex = context.columnMap.decision;
    var cellValue = valueForCell(
      schema[decisionIndex],
      priorDecision || 'NONE'
    );
    context.sheet.getRange(
      physicalRow,
      decisionIndex + 1,
      1,
      1
    ).setValues([[cellValue]]);
    context.values[
      physicalRow - WorkOsConfig.DATA_START_ROW
    ][decisionIndex] = cellValue;
  }

  function rejectedReviewResult(
    context,
    physicalRow,
    task,
    errorCode,
    message
  ) {
    revertDecisionCell(
      context,
      physicalRow,
      priorDecisionForState(task.review_state)
    );
    return {
      operation: 'REJECTED',
      row: physicalRow,
      task_id: task.task_id,
      review_task_id: task.task_id,
      changed_fields: [],
      calendar_reconcile: false,
      error_code: errorCode,
      user_message: message || 'この判断操作は受け付けられません。'
    };
  }

  function assertReviewChanges(changes) {
    if (!isPlainObject(changes)) {
      return false;
    }
    return Object.keys(changes).every(function (field) {
      return field !== 'comment' && REVIEW_WRITE_FIELDS[field] === true;
    });
  }

  function sameRowReviewPatch(task, reviewType, decision, pending) {
    var patch = {};
    if (decision === 'ACCEPT') {
      if (reviewType === 'EXISTING_CHANGE') {
        Object.keys(pending.changes).forEach(function (field) {
          patch[field] = pending.changes[field];
        });
      } else {
        patch.status = 'OPEN';
        patch.completed = false;
        patch.excluded = false;
        patch.waiting_for_reply = false;
      }
      patch.needs_review = false;
      patch.decision = 'ACCEPT';
      patch.review_state = 'APPLIED';
    } else {
      if (reviewType !== 'EXISTING_CHANGE') {
        patch.status = 'EXCLUDED';
        patch.completed = false;
        patch.excluded = true;
        patch.waiting_for_reply = false;
      }
      patch.needs_review = false;
      patch.decision = 'REJECT';
      patch.review_state = 'REJECTED';
    }
    patch.pending_action_type = '';
    patch.pending_changes_json = {};
    return patch;
  }

  function changesMatchTask(context, physicalRow, changes) {
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    var row = rowForPhysicalRow(context, physicalRow);
    return Object.keys(changes).every(function (field) {
      if (!Object.prototype.hasOwnProperty.call(context.columnMap, field)) {
        return false;
      }
      var index = context.columnMap[field];
      return cellsEqual(row[index], valueForCell(schema[index], changes[field]));
    });
  }

  function applyConflictReviewDecision(
    context,
    reviewRow,
    reviewTask,
    pending,
    nowValue
  ) {
    var targetTaskId = String(pending.target_task_id || '');
    var targetRow = context.byTaskId[targetTaskId];
    var expectedTargetVersion = Number(
      pending.expected_target_row_version
    );
    if (!targetTaskId ||
        targetTaskId === reviewTask.task_id ||
        !targetRow ||
        !Number.isInteger(expectedTargetVersion) ||
        expectedTargetVersion < 1 ||
        !assertReviewChanges(pending.changes)) {
      return rejectedReviewResult(
        context,
        reviewRow,
        reviewTask,
        'REVIEW_TARGET_CONFLICT',
        '対象Taskを確認できないため受入を取り消しました。'
      );
    }
    var target = readTaskAtRow(context, targetRow);
    var checkpoint = String(pending.application_checkpoint || '');
    var targetMatches = changesMatchTask(
      context,
      targetRow,
      pending.changes
    );
    var targetAlreadyApplied = checkpoint === 'TARGET_APPLYING' &&
      target.row_version === expectedTargetVersion + 1 &&
      targetMatches;
    if (!targetAlreadyApplied &&
        (target.row_version !== expectedTargetVersion ||
         target.pending_action_type ||
         (isPlainObject(target.pending_changes_json) &&
          isPlainObject(target.pending_changes_json.changes)))) {
      return rejectedReviewResult(
        context,
        reviewRow,
        reviewTask,
        'REVIEW_TARGET_CONFLICT',
        '対象Taskが更新済みまたは確認中のため受入を取り消しました。'
      );
    }

    if (checkpoint !== 'TARGET_APPLYING') {
      var checkpointPayload = sanitizeStructuredValue(pending);
      checkpointPayload.application_checkpoint = 'TARGET_APPLYING';
      checkpointPayload.checkpoint_target_row_version =
        expectedTargetVersion;
      updateRowWithPatch(
        context,
        reviewRow,
        {
          decision: 'NONE',
          pending_changes_json: checkpointPayload
        },
        REVIEW_WRITE_FIELDS,
        nowValue
      );
      pending = checkpointPayload;
    }

    var targetResult;
    if (targetAlreadyApplied) {
      targetResult = {
        operation: 'NOOP',
        row: targetRow,
        task_id: targetTaskId,
        changed_fields: []
      };
    } else {
      targetResult = updateRowWithPatch(
        context,
        targetRow,
        pending.changes,
        REVIEW_WRITE_FIELDS,
        nowValue
      );
      targetResult.task_id = targetTaskId;
    }
    updateRowWithPatch(
      context,
      reviewRow,
      {
        status: 'EXCLUDED',
        completed: false,
        excluded: true,
        waiting_for_reply: false,
        needs_review: false,
        decision: 'ACCEPT',
        review_state: 'APPLIED',
        pending_action_type: '',
        pending_changes_json: {}
      },
      REVIEW_WRITE_FIELDS,
      nowValue
    );
    return {
      operation: targetResult.operation === 'NOOP' ? 'UPDATE' :
        targetResult.operation,
      row: targetRow,
      task_id: targetTaskId,
      review_row: reviewRow,
      review_task_id: reviewTask.task_id,
      changed_fields: targetResult.changed_fields,
      calendar_reconcile: true
    };
  }

  function reviewValuesEqual(field, left, right) {
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    var map = WorkOsSchemas.buildColumnMapFromIds(
      WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS)
    );
    if (!Object.prototype.hasOwnProperty.call(map, field)) {
      return false;
    }
    try {
      return cellsEqual(
        valueForCell(schema[map[field]], left),
        valueForCell(schema[map[field]], right)
      );
    } catch (error) {
      return false;
    }
  }

  function sameRowReviewConflicts(task, pending) {
    var conflicts = [];
    var expectedVersion = Number(pending.expected_target_row_version);
    if (!Number.isInteger(expectedVersion) ||
        expectedVersion < 1 ||
        Number(task.row_version) !== expectedVersion + 1) {
      conflicts.push('row_version');
    }
    if (String(pending.target_task_id || '') !== String(task.task_id || '') ||
        pending.target_resolution !== 'RESOLVED') {
      conflicts.push('target');
    }
    var currentValues = isPlainObject(pending.current_values)
      ? pending.current_values
      : null;
    if (!currentValues) {
      conflicts.push('current_values');
    } else {
      Object.keys(pending.changes || {}).forEach(function (field) {
        if (!Object.prototype.hasOwnProperty.call(currentValues, field) ||
            !reviewValuesEqual(
              field,
              task[field],
              currentValues[field]
            )) {
          conflicts.push(field);
        }
      });
    }
    var expectedManual = Array.isArray(pending.expected_manual_fields)
      ? pending.expected_manual_fields.slice().sort()
      : null;
    var currentManual = Array.isArray(task.manual_fields)
      ? task.manual_fields.slice().sort()
      : [];
    if (!expectedManual ||
        JSON.stringify(expectedManual) !== JSON.stringify(currentManual)) {
      conflicts.push('manual_fields');
    }
    return conflicts.filter(function (field, index, values) {
      return values.indexOf(field) === index;
    });
  }

  function syncSameRowConflictNote(
    context,
    physicalRow,
    task,
    pending,
    conflicts
  ) {
    var refreshedPending = sanitizeStructuredValue(pending);
    var latest = {};
    Object.keys(refreshedPending.changes || {}).forEach(function (field) {
      latest[field] = sanitizeStructuredValue(task[field]);
    });
    refreshedPending.latest_current_values = latest;
    var manualConflicts = Array.isArray(
      refreshedPending.manual_conflicts
    )
      ? refreshedPending.manual_conflicts.slice()
      : [];
    (conflicts || []).forEach(function (field) {
      if (Object.prototype.hasOwnProperty.call(
        refreshedPending.changes || {},
        field
      ) && manualConflicts.indexOf(field) === -1) {
        manualConflicts.push(field);
      }
    });
    refreshedPending.manual_conflicts = manualConflicts.sort();
    var noteTask = {};
    Object.keys(task).forEach(function (field) {
      noteTask[field] = task[field];
    });
    noteTask.pending_changes_json = refreshedPending;
    syncReviewNote(
      context.sheet,
      physicalRow,
      noteTask,
      task
    );
  }

  function applyReviewDecisionUnlocked(options, context) {
    assertLockedContext(context);
    var settings = options || {};
    var reviewTaskId = String(settings.reviewTaskId || '');
    var physicalRow = context.byTaskId[reviewTaskId];
    if (!physicalRow) {
      throw new WorkOsAppError(
        'E_TARGET_NOT_RESOLVED',
        'TASK_REVIEW',
        false,
        'Review Taskを解決できません。'
      );
    }
    var task = readTaskAtRow(context, physicalRow);
    var decision = String(settings.decision || task.decision || '');
    var expectedReviewVersion = Number(settings.expectedReviewRowVersion);
    if (!Number.isInteger(expectedReviewVersion) ||
        expectedReviewVersion !== Number(task.row_version)) {
      return rejectedReviewResult(
        context,
        physicalRow,
        task,
        'REVIEW_ROW_CONFLICT',
        'Reviewが更新済みのため判断を取り消しました。'
      );
    }
    if (decision !== 'ACCEPT' && decision !== 'REJECT') {
      return rejectedReviewResult(
        context,
        physicalRow,
        task,
        'REVIEW_DECISION_INVALID',
        '判断値が不正なため元に戻しました。'
      );
    }
    if (task.review_state === 'APPLIED' ||
        task.review_state === 'REJECTED') {
      return rejectedReviewResult(
        context,
        physicalRow,
        task,
        'REVIEW_ALREADY_CLOSED',
        'このReviewはすでに処理済みです。'
      );
    }
    if (task.status === 'DONE' ||
        task.status === 'EXCLUDED' ||
        task.status === 'CANCELLED') {
      return rejectedReviewResult(
        context,
        physicalRow,
        task,
        'REVIEW_TERMINAL_TASK',
        '完了済みTaskでは判断を変更できません。'
      );
    }
    if (task.needs_review !== true ||
        task.review_state !== 'OPEN' ||
        !REVIEW_TYPES[String(task.review_type || '')]) {
      return rejectedReviewResult(
        context,
        physicalRow,
        task,
        'REVIEW_NOT_OPEN',
        '確認待ちReview以外では判断を変更できません。'
      );
    }

    var pending = isPlainObject(task.pending_changes_json)
      ? task.pending_changes_json
      : {};
    var reviewType = String(task.review_type);
    var hasPending = Boolean(task.pending_action_type) &&
      isPlainObject(pending.changes);
    var structureValid = reviewType === 'NEW_TASK'
      ? !task.pending_action_type &&
        !Object.prototype.hasOwnProperty.call(pending, 'changes')
      : hasPending &&
        String(pending.action_type || '') ===
          String(task.pending_action_type || '') &&
        assertReviewChanges(pending.changes);
    if (structureValid && reviewType === 'EXISTING_CHANGE') {
      structureValid = pending.target_resolution === 'RESOLVED' &&
        pending.target_task_id === task.task_id;
    } else if (structureValid && reviewType === 'TARGET_UNRESOLVED') {
      structureValid = pending.target_resolution === 'UNRESOLVED';
    } else if (structureValid && reviewType === 'PENDING_CONFLICT') {
      structureValid = pending.target_resolution === 'CONFLICT';
    }
    if (structureValid && reviewType !== 'NEW_TASK') {
      try {
        WorkOsAiAdapter.validateProvenance(pending.ai_provenance);
      } catch (error) {
        structureValid = false;
      }
    }
    if (!structureValid) {
      return rejectedReviewResult(
        context,
        physicalRow,
        task,
        'REVIEW_PAYLOAD_INVALID',
        'Review内容が不正なため判断を取り消しました。'
      );
    }
    if (reviewType === 'TARGET_UNRESOLVED' && decision === 'ACCEPT') {
      return rejectedReviewResult(
        context,
        physicalRow,
        task,
        'REVIEW_TARGET_UNRESOLVED',
        '対象Taskが未確定のため受入できません。'
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
    if (reviewType === 'EXISTING_CHANGE' && decision === 'ACCEPT') {
      var sameRowConflicts = sameRowReviewConflicts(task, pending);
      if (sameRowConflicts.length) {
        var rejected = rejectedReviewResult(
          context,
          physicalRow,
          task,
          'REVIEW_SAME_ROW_CONFLICT',
          'Review作成後にTaskが更新されたため受入を取り消しました。'
        );
        syncSameRowConflictNote(
          context,
          physicalRow,
          task,
          pending,
          sameRowConflicts
        );
        return rejected;
      }
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

  function writeRowPlans(sheet, plans, schema) {
    var ordered = (plans || []).slice().sort(function (left, right) {
      return left.row - right.row;
    });
    var groups = [];
    ordered.forEach(function (plan) {
      var current = groups.length ? groups[groups.length - 1] : null;
      if (!current || plan.row !== current.last_row + 1) {
        current = {
          first_row: plan.row,
          last_row: plan.row,
          values: [plan.output_row]
        };
        groups.push(current);
      } else {
        current.last_row = plan.row;
        current.values.push(plan.output_row);
      }
    });
    groups.forEach(function (group) {
      sheet.getRange(
        group.first_row,
        1,
        group.values.length,
        schema.length
      ).setValues(group.values);
    });
  }

  function restoreUserEditRows(sheet, rowEdits) {
    return WorkOsUtilities.withScriptLock(function () {
      var schema =
        WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
      var expectedIds =
        WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS);
      if (sheet.getMaxColumns() !== expectedIds.length) {
        throw new WorkOsAppError(
          'E_SCHEMA_CONFLICT',
          'EDIT_HANDLER',
          false,
          'Task列数がSchemaと一致しません。'
        );
      }
      var ids = sheet.getRange(
        WorkOsConfig.HEADER_ID_ROW,
        1,
        1,
        expectedIds.length
      ).getValues()[0];
      if (JSON.stringify(ids) !== JSON.stringify(expectedIds)) {
        throw new WorkOsAppError(
          'E_SCHEMA_MISSING_COLUMN',
          'EDIT_HANDLER',
          false,
          'Task内部列IDがSchemaと一致しません。'
        );
      }
      var map = WorkOsSchemas.buildColumnMapFromIds(ids);
      var byRow = {};
      (rowEdits || []).forEach(function (edit) {
        var row = Number(edit && edit.row);
        if (!Number.isInteger(row) ||
            row < WorkOsConfig.DATA_START_ROW ||
            row > sheet.getMaxRows()) {
          throw new WorkOsAppError(
            'E_EDIT_RANGE',
            'EDIT_HANDLER',
            false,
            '復元対象のTask行が不正です。'
          );
        }
        if (!byRow[row]) {
          byRow[row] = {
            row: row,
            column_ids: {}
          };
        }
        (edit.column_ids || []).forEach(function (fieldId) {
          if (SNAPSHOT_VALUE_FIELDS[fieldId]) {
            byRow[row].column_ids[fieldId] = true;
          }
        });
      });
      var plans = Object.keys(byRow).map(function (rowKey) {
        var row = Number(rowKey);
        var raw = sheet.getRange(
          row,
          1,
          1,
          schema.length
        ).getValues()[0];
        var hasIdentity = !WorkOsUtilities.isBlank(raw[map.task_id]) ||
          !WorkOsUtilities.isBlank(raw[map.origin_key]);
        var restored;
        if (hasIdentity) {
          restored = authoritativeRowFromSnapshot(raw, schema, map);
        } else {
          restored = raw.slice();
          Object.keys(byRow[row].column_ids).forEach(function (fieldId) {
            restored[map[fieldId]] = '';
          });
        }
        return {
          row: row,
          output_row: restored
        };
      }).sort(function (left, right) {
        return left.row - right.row;
      });
      // Parse every snapshot before the first write. A corrupt row therefore
      // cannot leave a multi-row rejection only partially restored.
      writeRowPlans(sheet, plans, schema);
      return {
        restored_count: plans.length,
        rows: plans.map(function (plan) { return plan.row; })
      };
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  function manualEditAllowed(field, schema, columnMap) {
    if (!Object.prototype.hasOwnProperty.call(columnMap, field)) {
      return false;
    }
    var definition = schema[columnMap[field]];
    return definition.editable === true ||
      WorkOsTaskReviewPolicy.MANUAL_PROTECTED_FIELDS
        .indexOf(field) !== -1;
  }

  function refreshPendingAfterManualEdit(task, patch, changedFields) {
    if (task.needs_review !== true ||
        task.review_state !== 'OPEN' ||
        !task.pending_action_type ||
        !isPlainObject(task.pending_changes_json) ||
        !isPlainObject(task.pending_changes_json.changes)) {
      return;
    }
    var pending = sanitizeStructuredValue(task.pending_changes_json);
    var latest = isPlainObject(pending.latest_current_values)
      ? pending.latest_current_values
      : {};
    var conflicts = Array.isArray(pending.manual_conflicts)
      ? pending.manual_conflicts.slice()
      : [];
    var touched = false;
    (changedFields || []).forEach(function (field) {
      if (!Object.prototype.hasOwnProperty.call(pending.changes, field)) {
        return;
      }
      latest[field] = sanitizeStructuredValue(task[field]);
      if (conflicts.indexOf(field) === -1) {
        conflicts.push(field);
      }
      touched = true;
    });
    if (touched) {
      pending.latest_current_values = latest;
      pending.manual_conflicts = conflicts.sort();
      patch.pending_changes_json = pending;
    }
  }

  function rejectedManualEditResult(plan, errorCode, message) {
    return {
      row: plan.row,
      task_id: plan.task_id,
      operation: 'REJECTED',
      changed_fields: [],
      calendar_reconcile: false,
      error_code: errorCode || 'EDIT_VALIDATION_REJECTED',
      user_message: message ||
        '編集内容を検証できないため変更前の値へ戻しました。'
    };
  }

  function buildManualEditPlan(
    lockedContext,
    edit,
    schema,
    nowValue
  ) {
    var map = lockedContext.columnMap;
    var rowNumber = Number(edit.row);
    var rawRow = rowForPhysicalRow(lockedContext, rowNumber);
    var snapshotCell = rawRow[map[SNAPSHOT_FIELD]];
    if (!snapshotCell &&
        !rawRow[map.task_id] &&
        !rawRow[map.origin_key]) {
      return {
        row: rowNumber,
        task_id: '',
        authoritative_row: new Array(schema.length).fill(''),
        output_row: new Array(schema.length).fill(''),
        error: new WorkOsAppError(
          'E_EDIT_EMPTY_TASK',
          'EDIT_HANDLER',
          false,
          'Taskではない行への直接入力を取り消しました。'
        )
      };
    }
    var authoritative = authoritativeRowFromSnapshot(
      rawRow,
      schema,
      map
    );
    var priorTask = directTaskFromRow(authoritative, schema);
    var editedFields = (edit.column_ids || []).filter(function (
      field,
      index,
      values
    ) {
      return values.indexOf(field) === index;
    });
    if (!editedFields.length ||
        editedFields.some(function (field) {
          return field === 'decision' ||
            !manualEditAllowed(field, schema, map);
        })) {
      return {
        row: rowNumber,
        task_id: priorTask.task_id,
        authoritative_row: authoritative,
        output_row: authoritative,
        prior_task: priorTask,
        error: new WorkOsAppError(
          'E_EDIT_FIELD_NOT_ALLOWED',
          'EDIT_HANDLER',
          false,
          '許可されていないTask field変更を取り消しました。'
        )
      };
    }
    var candidateRow = authoritative.slice();
    var actualFields = [];
    editedFields.forEach(function (field) {
      var index = map[field];
      var parsedValue = valueFromCell(schema[index], rawRow[index]);
      var canonicalCell = valueForCell(schema[index], parsedValue);
      candidateRow[index] = canonicalCell;
      if (!cellsEqual(authoritative[index], canonicalCell)) {
        actualFields.push(field);
      }
    });
    if (!actualFields.length) {
      return {
        row: rowNumber,
        task_id: priorTask.task_id,
        authoritative_row: authoritative,
        output_row: authoritative,
        prior_task: priorTask,
        candidate_task: priorTask,
        operation: 'NOOP',
        changed_fields: []
      };
    }
    var task = directTaskFromRow(candidateRow, schema);
    var patch = {};
    var manualFields = Array.isArray(priorTask.manual_fields)
      ? priorTask.manual_fields.slice()
      : [];
    actualFields.forEach(function (field) {
      if (WorkOsTaskReviewPolicy.MANUAL_PROTECTED_FIELDS
          .indexOf(field) !== -1 &&
          manualFields.indexOf(field) === -1) {
        manualFields.push(field);
      }
    });
    patch.manual_fields = manualFields;
    if (actualFields.indexOf('due_date') !== -1) {
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
    normalizeUserState(task, patch, actualFields);
    refreshPendingAfterManualEdit(task, patch, actualFields);
    if (priorTask.status === 'REVIEW' &&
        (actualFields.indexOf('completed') !== -1 ||
         actualFields.indexOf('excluded') !== -1)) {
      patch.pending_action_type = '';
      patch.pending_changes_json = {};
      patch.needs_review = false;
      patch.review_state = 'APPLIED';
    }
    var allowedPatch = {
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
    var normalizedFields = actualFields.slice();
    Object.keys(patch).forEach(function (field) {
      if (!allowedPatch[field]) {
        throw new WorkOsAppError(
          'E_TASK_FIELD_NOT_UPDATABLE',
          'EDIT_HANDLER',
          false,
          '編集正規化fieldが許可されていません。'
        );
      }
      var index = map[field];
      var cell = valueForCell(schema[index], patch[field]);
      if (!cellsEqual(candidateRow[index], cell)) {
        candidateRow[index] = cell;
        if (normalizedFields.indexOf(field) === -1) {
          normalizedFields.push(field);
        }
      }
    });
    var versionIndex = map.row_version;
    var updatedAtIndex = map.updated_at;
    candidateRow[versionIndex] =
      Number(authoritative[versionIndex] || 0) + 1;
    candidateRow[updatedAtIndex] =
      nowValue || WorkOsUtilities.now();
    candidateRow = attachAuthoritativeSnapshot(
      candidateRow,
      schema,
      map
    );
    var candidateTask = validateCandidateRow(
      candidateRow,
      schema,
      'EDIT_HANDLER'
    );
    return {
      row: rowNumber,
      task_id: priorTask.task_id,
      authoritative_row: authoritative,
      output_row: candidateRow,
      prior_task: priorTask,
      candidate_task: candidateTask,
      operation: 'UPDATE',
      changed_fields: normalizedFields.concat([
        'row_version',
        'updated_at'
      ]),
      audit: {
        type: 'MANUAL_EDIT',
        edited_fields: actualFields.slice().sort(),
        prior_row_version: Number(priorTask.row_version),
        new_row_version: Number(candidateTask.row_version)
      }
    };
  }

  function applyUserEdits(sheet, rowEdits, nowValue) {
    return WorkOsUtilities.withScriptLock(function (lock) {
      var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
      if (sheet.getMaxColumns() !== schema.length) {
        throw new WorkOsAppError(
          'E_SCHEMA_CONFLICT',
          'EDIT_HANDLER',
          false,
          'タスク一覧の列数がSchemaと一致しません。'
        );
      }
      var editsByRow = {};
      (rowEdits || []).forEach(function (edit) {
        var rowNumber = Number(edit.row);
        if (!Number.isInteger(rowNumber) ||
            rowNumber < WorkOsConfig.DATA_START_ROW) {
          return;
        }
        if (!editsByRow[rowNumber]) {
          editsByRow[rowNumber] = {};
        }
        (edit.column_ids || []).forEach(function (field) {
          editsByRow[rowNumber][String(field)] = true;
        });
      });
      var normalizedRowEdits = Object.keys(editsByRow)
        .map(function (rowValue) {
          return {
            row: Number(rowValue),
            column_ids: Object.keys(editsByRow[rowValue])
          };
        })
        .sort(function (left, right) {
          return left.row - right.row;
        });
      var selectedRows = normalizedRowEdits.map(function (edit) {
        return Number(edit.row);
      }).filter(function (rowNumber) {
        return Number.isInteger(rowNumber) &&
          rowNumber >= WorkOsConfig.DATA_START_ROW;
      });
      var containsDecision = normalizedRowEdits.some(function (edit) {
        return (edit.column_ids || []).indexOf('decision') !== -1;
      });
      var lockedContext = containsDecision
        ? createContext(sheet, LOCK_MARKER)
        : createScopedContextForHeldLock(sheet, selectedRows, lock);
      var map = lockedContext.columnMap;
      try {
        if (containsDecision) {
          var decisionPlans = [];
          var decisionError = null;
          normalizedRowEdits.forEach(function (edit) {
            var rowNumber = Number(edit.row);
            if (!Number.isInteger(rowNumber) ||
                rowNumber < WorkOsConfig.DATA_START_ROW) {
              return;
            }
            var rawRow = rowForPhysicalRow(lockedContext, rowNumber);
            var authoritative = authoritativeRowFromSnapshot(
              rawRow,
              schema,
              map
            );
            var task = directTaskFromRow(authoritative, schema);
            var fields = edit.column_ids || [];
            var plan = {
              row: rowNumber,
              task_id: task.task_id,
              authoritative_row: authoritative,
              output_row: authoritative,
              prior_task: task,
              decision: ''
            };
            try {
              if (fields.length !== 1 || fields[0] !== 'decision') {
                throw new WorkOsAppError(
                  'REVIEW_EDIT_AMBIGUOUS',
                  'EDIT_HANDLER',
                  false,
                  '判断欄は他の項目と分けて操作してください。'
                );
              }
              plan.decision = valueFromCell(
                schema[map.decision],
                rawRow[map.decision]
              );
            } catch (error) {
              plan.error = error;
              decisionError = decisionError || error;
            }
            decisionPlans.push(plan);
          });
          writeRowPlans(sheet, decisionPlans, schema);
          decisionPlans.forEach(function (plan) {
            lockedContext.values[
              plan.row - WorkOsConfig.DATA_START_ROW
            ] = plan.authoritative_row;
          });
          if (decisionError) {
            return decisionPlans.map(function (plan) {
              return rejectedManualEditResult(
                plan,
                decisionError.code || 'REVIEW_EDIT_AMBIGUOUS',
                decisionError.safe_message
              );
            });
          }
          return decisionPlans.map(function (plan) {
            return applyReviewDecisionUnlocked(
              {
                reviewTaskId: plan.task_id,
                decision: plan.decision,
                expectedReviewRowVersion:
                  plan.prior_task.row_version,
                now: nowValue
              },
              lockedContext
            );
          });
        }

        var plans = [];
        var firstError = null;
        normalizedRowEdits.forEach(function (edit) {
          var rowNumber = Number(edit.row);
          if (!Number.isInteger(rowNumber) ||
              rowNumber < WorkOsConfig.DATA_START_ROW) {
            return;
          }
          try {
            var plan = buildManualEditPlan(
              lockedContext,
              edit,
              schema,
              nowValue
            );
            plans.push(plan);
            if (plan.error) {
              firstError = firstError || plan.error;
            }
          } catch (error) {
            firstError = firstError || error;
            var rawRow = rowForPhysicalRow(lockedContext, rowNumber);
            var authoritative = authoritativeRowFromSnapshot(
              rawRow,
              schema,
              lockedContext.columnMap
            );
            var priorTask = directTaskFromRow(authoritative, schema);
            plans.push({
              row: rowNumber,
              task_id: priorTask.task_id,
              authoritative_row: authoritative,
              output_row: authoritative,
              prior_task: priorTask,
              error: error
            });
          }
        });
        if (firstError) {
          plans.forEach(function (plan) {
            plan.output_row = plan.authoritative_row;
          });
          writeRowPlans(sheet, plans, schema);
          plans.forEach(function (plan) {
            lockedContext.values[
              plan.row - WorkOsConfig.DATA_START_ROW
            ] = plan.authoritative_row;
            if (plan.prior_task) {
              syncReviewNote(
                sheet,
                plan.row,
                plan.prior_task,
                plan.prior_task
              );
            }
          });
          return plans.map(function (plan) {
            return rejectedManualEditResult(
              plan,
              firstError.code,
              firstError.safe_message
            );
          });
        }
        writeRowPlans(sheet, plans, schema);
        plans.forEach(function (plan) {
          lockedContext.values[
            plan.row - WorkOsConfig.DATA_START_ROW
          ] = plan.output_row;
          if (plan.candidate_task) {
            syncReviewNote(
              sheet,
              plan.row,
              plan.candidate_task,
              plan.prior_task
            );
          }
        });
        return plans.map(function (plan) {
          return {
            row: plan.row,
            task_id: plan.task_id,
            operation: plan.operation,
            changed_fields: plan.changed_fields,
            calendar_reconcile: plan.operation === 'UPDATE',
            audit: plan.audit || null
          };
        });
      } finally {
        lockedContext._workOsLockMarker = null;
      }
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
    if (!existingRow && target.task_id) {
      throw new WorkOsAppError(
        'E_TASK_ID_SUPPLIED',
        'TASK_REPOSITORY',
        false,
        '新規Taskのtask_idはRepositoryが発行します。'
      );
    }
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
      if (item.id === SNAPSHOT_FIELD) {
        return;
      }
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
    WorkOsUtilities.assertTestMode('PHASE1_MOCK_TASK');
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
    extendTaskControlsAfterExpansion: extendTaskControlsAfterExpansion,
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
    migrateLegacyRowToSnapshot: migrateLegacyRowToSnapshot,
    applyCalendarPatch: applyCalendarPatch,
    stagePendingChange: stagePendingChange,
    restagePendingChange: restagePendingChange,
    applyReviewDecision: applyReviewDecision,
    applyUserEdits: applyUserEdits,
    restoreUserEditRows: restoreUserEditRows,
    upsertPhase1MockTask: upsertPhase1MockTask
  });
}());
