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
    business_version: true,
    calendar_reconcile_required: true,
    calendar_intent_version: true,
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
  var SNAPSHOT_MIRROR_PREFIX = 'WORK_OS_TASK_AUTHORITY_V2:';
  var AUTHORITY_GENERATION_FIELD = 'authority_generation';
  var AUTHORITY_HASH_FIELD = 'authority_hash';
  var AUTHORITY_STATE_FIELD = 'authority_state';
  var AUTHORITY_LEDGER_SHEET = WorkOsConfig.SHEETS.TASK_AUTHORITY_LEDGER;
  var AUTHORITY_SNAPSHOT_FORMAT = 'TASK_AUTHORITY_V1';
  var AUTHORITY_ACTIVE_STATE = 'COMMITTED';
  var AUTHORITY_QUARANTINED_STATE = 'QUARANTINED';
  var AUTHORITY_UNRECOVERABLE_STATE = 'UNRECOVERABLE';
  var BUSINESS_GUARD_FIELDS = Object.freeze({
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
  var PENDING_BUSINESS_CHANGE_FIELDS = Object.freeze({
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
    calendar_importance: true
  });
  var CALENDAR_RECONCILE_FIELDS = Object.freeze({
    status: true,
    completed: true,
    excluded: true,
    waiting_for_reply: true,
    task_title: true,
    due_date: true,
    deadline_basis: true,
    priority: true,
    calendar_sync_mode: true,
    calendar_category: true,
    calendar_importance: true
  });
  var SCHEMA_24_SNAPSHOT_FIELDS = Object.freeze([
    'needs_review',
    'decision',
    'status',
    'completed',
    'excluded',
    'task_title',
    'due_date',
    'suggested_due_date',
    'deadline_basis',
    'priority',
    'waiting_for_reply',
    'calendar_sync_mode',
    'comment',
    'review_state',
    'review_type',
    'calendar_category',
    'calendar_importance',
    'manual_fields',
    'pending_action_type',
    'pending_changes_json'
  ]);

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

  function findLogicalEmptyRow(
    taskIdValues,
    originKeyValues,
    startRow,
    blockedPhysicalRows
  ) {
    var firstDataRow = startRow || WorkOsConfig.DATA_START_ROW;
    var length = Math.max(taskIdValues.length, originKeyValues.length);
    for (var index = 0; index < length; index += 1) {
      var taskId = taskIdValues[index] && taskIdValues[index][0];
      var originKey = originKeyValues[index] && originKeyValues[index][0];
      var physicalRow = firstDataRow + index;
      if (WorkOsUtilities.isBlank(taskId) && WorkOsUtilities.isBlank(originKey) &&
          !(blockedPhysicalRows && blockedPhysicalRows[physicalRow])) {
        return physicalRow;
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
    var context = applyAuthorityValidatedIndexes(
      buildContextFromValues(sheet, columnMap, values)
    );
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
    var logicalRows = [];
    var taskIdValues = [];
    var originKeyValues = [];
    var taskIdIndex = columnMap.task_id;
    var originKeyIndex = columnMap.origin_key;

    values.forEach(function (row, index) {
      var physicalRow = WorkOsConfig.DATA_START_ROW + index;
      var taskId = String(row[taskIdIndex] || '').trim();
      var originKey = String(row[originKeyIndex] || '').trim();
      taskIdValues.push([taskId]);
      originKeyValues.push([originKey]);
      if (!taskId && !originKey) {
        return;
      }
      logicalRows.push(physicalRow);
    });

    return {
      sheet: sheet,
      columnMap: columnMap,
      values: values,
      taskIdValues: taskIdValues,
      originKeyValues: originKeyValues,
      // These resolution indexes are intentionally populated only by
      // applyAuthorityValidatedIndexes().
      byTaskId: {},
      byOriginKey: {},
      byStableThreadKey: {},
      duplicateTaskIds: [],
      duplicateOriginKeys: [],
      logicalRows: logicalRows
    };
  }

  var FORMULA_GUARD = '\u200B';

  /*
   * Raw Task cells are retained only for physical-row restoration and empty-row
   * detection. They are never allowed to populate resolution indexes until the
   * shared ledger validator accepts the row. This prevents copied or untrusted
   * task_id/origin_key values from winning target resolution before authority
   * is decided.
   */
  function applyAuthorityValidatedIndexes(context, options) {
    var settings = options || {};
    var decisionRows = settings.decision_rows || {};
    var rawLogicalRows = (context.logicalRows || []).slice();
    var ledgerContext = readAuthorityLedgerContext(context.sheet);
    var map = context.columnMap;
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    context.raw_logical_rows = rawLogicalRows;
    context.authority_by_physical_row = {};
    context.blockedPhysicalRows = {};
    Object.keys(ledgerContext.by_physical_row || {}).forEach(function (row) {
      context.blockedPhysicalRows[Number(row)] = true;
    });
    context.byTaskId = {};
    context.byOriginKey = {};
    context.byStableThreadKey = {};
    context.duplicateTaskIds = [];
    context.duplicateOriginKeys = [];
    context.logicalRows = [];
    rawLogicalRows.forEach(function (physicalRow) {
      var raw = rowForPhysicalRow(context, physicalRow);
      var validation = validateAuthority(raw, {
        sheet: context.sheet,
        physical_row: physicalRow,
        schema: schema,
        column_map: map,
        ledger_context: ledgerContext,
        mode: 'CONTEXT_INDEX'
      });
      context.authority_by_physical_row[physicalRow] = {
        status: validation.status,
        code: validation.code || ''
      };
      /*
       * A decision edit arrives after Sheets has changed the visible decision
       * cell.  That makes the otherwise committed row RESTORABLE, but it does
       * not make the raw row authoritative.  The dedicated decision path may
       * resolve only its explicitly selected row from the ledger projection;
       * the caller captures the raw decision value before this replacement and
       * subsequently commits a single ledger-backed output row.  Every other
       * context remains strictly VALID-only.
       */
      var useAuthoritativeProjection = validation.status === 'VALID' ||
        (validation.status === 'RESTORABLE' &&
         decisionRows[physicalRow] === true);
      if (!useAuthoritativeProjection) {
        context.blockedPhysicalRows[physicalRow] = true;
        return;
      }
      var authoritative = validation.authoritative_row;
      context.values[physicalRow - WorkOsConfig.DATA_START_ROW] =
        authoritative.slice();
      var taskId = String(authoritative[map.task_id] || '').trim();
      var originKey = String(authoritative[map.origin_key] || '').trim();
      var stableThreadKey = String(
        authoritative[map.stable_thread_key] || ''
      ).trim();
      if (!taskId || !originKey || context.byTaskId[taskId] ||
          context.byOriginKey[originKey]) {
        if (context.byTaskId[taskId]) {
          delete context.byTaskId[taskId];
          context.duplicateTaskIds.push(taskId);
        }
        if (context.byOriginKey[originKey]) {
          delete context.byOriginKey[originKey];
          context.duplicateOriginKeys.push(originKey);
        }
        context.blockedPhysicalRows[physicalRow] = true;
        return;
      }
      context.byTaskId[taskId] = physicalRow;
      context.byOriginKey[originKey] = physicalRow;
      if (stableThreadKey) {
        if (!context.byStableThreadKey[stableThreadKey]) {
          context.byStableThreadKey[stableThreadKey] = [];
        }
        context.byStableThreadKey[stableThreadKey].push(physicalRow);
      }
      context.logicalRows.push(physicalRow);
    });
    return context;
  }

  /*
   * Build a no-trust decision context after the edit handler has captured the
   * one user-input cell.  A selected decision row may be RESTORABLE solely
   * because that cell was changed; all index data is still reconstructed from
   * the committed authority slot.  This avoids both a raw-ID index and an
   * unnecessary restore-then-commit double Task write.
   */
  function createDecisionEditContextForHeldLock(sheet, selectedRows) {
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
    var rowCount = Math.max(
      0,
      sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
    );
    var values = rowCount ? sheet.getRange(
      WorkOsConfig.DATA_START_ROW,
      1,
      rowCount,
      schema.length
    ).getValues() : [];
    var decisionRows = {};
    (selectedRows || []).forEach(function (row) {
      var rowNumber = Number(row);
      if (Number.isInteger(rowNumber) &&
          rowNumber >= WorkOsConfig.DATA_START_ROW) {
        decisionRows[rowNumber] = true;
      }
    });
    var context = applyAuthorityValidatedIndexes(
      buildContextFromValues(sheet, columnMap, values),
      { decision_rows: decisionRows }
    );
    Object.defineProperty(context, '_workOsLockMarker', {
      value: LOCK_MARKER,
      enumerable: false,
      writable: true,
      configurable: true
    });
    return context;
  }

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
      business_version: 1,
      calendar_reconcile_required: false,
      calendar_intent_version: 0,
      authority_generation: 0,
      authority_hash: '',
      authority_state: '',
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

  /*
   * Hash/snapshot input is based on the canonical Sheet representation, not
   * the caller's raw JavaScript value. In particular, formula-like text is
   * guarded before it becomes integrity input, so a first commit and a later
   * read-back of the same business state hash identically.
   */
  function canonicalSnapshotFieldValue(columnDefinition, rawValue) {
    var parsed = valueFromCell(columnDefinition, rawValue);
    var canonicalCell = valueForCell(columnDefinition, parsed);
    return snapshotSafeValue(valueFromCell(columnDefinition, canonicalCell));
  }

  function buildAuthoritativeSnapshot(row, schema, columnMap) {
    var values = {};
    schema.forEach(function (item, index) {
      if (item.id === SNAPSHOT_FIELD ||
          item.id === AUTHORITY_GENERATION_FIELD ||
          item.id === AUTHORITY_HASH_FIELD ||
          item.id === AUTHORITY_STATE_FIELD) {
        return;
      }
      values[item.id] = canonicalSnapshotFieldValue(item, row[index]);
    });
    return {
      format: 'FULL_ROW_V1',
      schema_version: WorkOsConfig.SCHEMA_VERSION,
      task_id: String(row[columnMap.task_id] || ''),
      values: values
    };
  }

  function snapshotFieldIds(schema) {
    return schema.filter(function (item) {
      return item.id !== SNAPSHOT_FIELD &&
        item.id !== AUTHORITY_GENERATION_FIELD &&
        item.id !== AUTHORITY_HASH_FIELD &&
        item.id !== AUTHORITY_STATE_FIELD;
    }).map(function (item) {
      return item.id;
    });
  }

  function validateAuthoritativeSnapshot(snapshot, schema) {
    if (!isPlainObject(snapshot) ||
        snapshot.format !== 'FULL_ROW_V1' ||
        snapshot.schema_version !== WorkOsConfig.SCHEMA_VERSION ||
        !isPlainObject(snapshot.values)) {
      throw new WorkOsAppError(
        'E_TASK_SNAPSHOT_INVALID',
        'TASK_AUTHORITY',
        false,
        'Task authoritative snapshotの形式が一致しません。'
      );
    }
    var expectedFields = snapshotFieldIds(schema).sort();
    var actualFields = Object.keys(snapshot.values).sort();
    if (JSON.stringify(expectedFields) !== JSON.stringify(actualFields) ||
        String(snapshot.task_id || '') !==
          String(snapshot.values.task_id || '')) {
      throw new WorkOsAppError(
        'E_TASK_SNAPSHOT_INVALID',
        'TASK_AUTHORITY',
        false,
        'Task authoritative snapshotの必須fieldが一致しません。'
      );
    }
    return snapshot;
  }

  function parseAuthoritativeSnapshotText(text, schema) {
    var value;
    try {
      value = typeof text === 'string' ? JSON.parse(text) : text;
    } catch (error) {
      throw new WorkOsAppError(
        'E_TASK_SNAPSHOT_INVALID',
        'TASK_AUTHORITY',
        false,
        'Task authoritative snapshotを解析できません。'
      );
    }
    return validateAuthoritativeSnapshot(value, schema);
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

  /*
   * Schema 2.6 authority protocol
   * -----------------------------
   * The hidden, protected ledger is the sole trust source.  The Task-row
   * snapshot cell remains an observable projection only: it is never used as
   * a fallback when the ledger is absent or corrupt.  A ledger record contains
   * two versioned slots.  The inactive slot is PREPARED before a Task-row
   * write; a matching row then promotes that slot to COMMITTED.  This makes a
   * failure at either write boundary deterministically recoverable or
   * quarantinable without creating authority from live cells.
   */
  function authoritySnapshotFieldIds(schema) {
    return schema.filter(function (item) {
      return item.id !== SNAPSHOT_FIELD &&
        item.id !== AUTHORITY_GENERATION_FIELD &&
        item.id !== AUTHORITY_HASH_FIELD &&
        item.id !== AUTHORITY_STATE_FIELD;
    }).map(function (item) { return item.id; });
  }

  function buildAuthoritySnapshot(row, schema, columnMap) {
    var values = {};
    authoritySnapshotFieldIds(schema).forEach(function (field) {
      var index = columnMap[field];
      values[field] = canonicalSnapshotFieldValue(schema[index], row[index]);
    });
    return {
      format: AUTHORITY_SNAPSHOT_FORMAT,
      schema_version: WorkOsConfig.SCHEMA_VERSION,
      task_id: String(row[columnMap.task_id] || ''),
      values: values
    };
  }

  function authoritySnapshotSerializedHash(serialized) {
    if (serialized.length > WorkOsConfig.AUTHORITY_LEDGER_MAX_SNAPSHOT_CHARS) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_SNAPSHOT_TOO_LARGE',
        'TASK_AUTHORITY',
        false,
        'Task authority snapshot exceeds the bounded ledger cell budget.'
      );
    }
    return WorkOsUtilities.sha256Hex(serialized);
  }

  function authoritySnapshotHash(snapshot) {
    return authoritySnapshotSerializedHash(
      WorkOsUtilities.canonicalJsonString(snapshot, 'object')
    );
  }

  /*
   * Schema 2.6 was first published with insertion-order JSON hashes.  Those
   * hashes remain independently verifiable from the protected ledger slot,
   * not from the visible Task row or snapshot cell.  Migration 3 therefore
   * accepts the historical representation only when its exact ledger payload
   * and stored hash agree; every newly prepared generation uses the canonical
   * representation above.
   */
  function legacyAuthoritySnapshotHash(snapshot) {
    return authoritySnapshotSerializedHash(
      WorkOsUtilities.serializeJson(snapshot, 'object')
    );
  }

  function isAuthorityControlField(field) {
    return field === AUTHORITY_GENERATION_FIELD ||
      field === AUTHORITY_HASH_FIELD ||
      field === AUTHORITY_STATE_FIELD;
  }

  function validateLedgerAuthoritySnapshot(snapshot, expectedTaskId, hash) {
    if (!isPlainObject(snapshot) ||
        snapshot.format !== AUTHORITY_SNAPSHOT_FORMAT ||
        snapshot.schema_version !== WorkOsConfig.SCHEMA_VERSION ||
        !isPlainObject(snapshot.values) ||
        String(snapshot.task_id || '') !== String(expectedTaskId || '')) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_LEDGER_INVALID',
        'TASK_AUTHORITY',
        false,
        'Task authority ledger snapshot is invalid.'
      );
    }
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    var expectedFields = authoritySnapshotFieldIds(schema).sort();
    var actualFields = Object.keys(snapshot.values).sort();
    var suppliedHash = String(hash || '');
    var matchesCanonicalHash = authoritySnapshotHash(snapshot) === suppliedHash;
    var matchesLegacyHash = !matchesCanonicalHash &&
      legacyAuthoritySnapshotHash(snapshot) === suppliedHash;
    if (JSON.stringify(expectedFields) !== JSON.stringify(actualFields) ||
        String(snapshot.values.task_id || '') !== String(expectedTaskId || '') ||
        (!matchesCanonicalHash && !matchesLegacyHash)) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_LEDGER_INVALID',
        'TASK_AUTHORITY',
        false,
        'Task authority ledger slot does not match its immutable hash.'
      );
    }
    return snapshot;
  }

  function rowFromAuthoritySnapshot(
    snapshot,
    generation,
    hash,
    controlState,
    schema,
    columnMap
  ) {
    var targetSchema = schema || WorkOsSchemas.getSheetSchema(
      WorkOsConfig.SHEETS.TASKS
    );
    var targetMap = columnMap || WorkOsSchemas.buildColumnMapFromIds(
      WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS)
    );
    validateLedgerAuthoritySnapshot(snapshot, snapshot.task_id, hash);
    var output = targetSchema.map(function (item) {
      if (item.id === SNAPSHOT_FIELD) {
        return '';
      }
      if (item.id === AUTHORITY_GENERATION_FIELD) {
        return valueForCell(item, generation);
      }
      if (item.id === AUTHORITY_HASH_FIELD) {
        return valueForCell(item, hash);
      }
      if (item.id === AUTHORITY_STATE_FIELD) {
        return valueForCell(item, controlState || AUTHORITY_ACTIVE_STATE);
      }
      if (!Object.prototype.hasOwnProperty.call(snapshot.values, item.id)) {
        throw new WorkOsAppError(
          'E_TASK_AUTHORITY_LEDGER_INVALID',
          'TASK_AUTHORITY',
          false,
          'Task authority ledger snapshot is missing a canonical field.'
        );
      }
      return valueForCell(item, snapshot.values[item.id]);
    });
    return attachAuthoritativeSnapshot(output, targetSchema, targetMap);
  }

  function taskParentSpreadsheet(taskSheet) {
    var parent = taskSheet && typeof taskSheet.getParent === 'function'
      ? taskSheet.getParent()
      : null;
    return parent || SpreadsheetApp.getActiveSpreadsheet();
  }

  function authorityLedgerSchemaAndMap() {
    var schema = WorkOsSchemas.getSheetSchema(AUTHORITY_LEDGER_SHEET);
    return {
      schema: schema,
      ids: WorkOsSchemas.getInternalIds(AUTHORITY_LEDGER_SHEET),
      map: WorkOsSchemas.buildColumnMapFromIds(
        WorkOsSchemas.getInternalIds(AUTHORITY_LEDGER_SHEET)
      )
    };
  }

  function getAuthorityLedgerSheet(taskSheet) {
    var spreadsheet = taskParentSpreadsheet(taskSheet);
    var ledger = spreadsheet && spreadsheet.getSheetByName
      ? spreadsheet.getSheetByName(AUTHORITY_LEDGER_SHEET)
      : null;
    if (!ledger) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_LEDGER_MISSING',
        'TASK_AUTHORITY',
        false,
        'Task authority ledger is missing; no Task snapshot fallback is allowed.'
      );
    }
    var definition = authorityLedgerSchemaAndMap();
    var expectedLabels = WorkOsSchemas.getHeaders(AUTHORITY_LEDGER_SHEET);
    if (ledger.getMaxColumns() !== definition.ids.length ||
        JSON.stringify(ledger.getRange(
          WorkOsConfig.HEADER_ID_ROW,
          1,
          1,
          definition.ids.length
        ).getValues()[0]) !== JSON.stringify(definition.ids) ||
        JSON.stringify(ledger.getRange(
          WorkOsConfig.HEADER_LABEL_ROW,
          1,
          1,
          definition.ids.length
        ).getValues()[0]) !== JSON.stringify(expectedLabels)) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_LEDGER_SCHEMA',
        'TASK_AUTHORITY',
        false,
        'Task authority ledger schema is not canonical.'
      );
    }
    assertAuthorityLedgerRuntimeContract(ledger);
    return ledger;
  }

  /*
   * Production Apps Script exposes both methods.  Narrow local fixtures may
   * intentionally omit them, in which case their real-Workspace verification
   * remains NOT EXECUTED rather than being simulated as a pass.  When the
   * runtime can report either property, a false/missing protection is
   * fail-closed for all authority reads and writes.
   */
  function assertAuthorityLedgerRuntimeContract(ledger) {
    if (typeof ledger.isSheetHidden === 'function' &&
        ledger.isSheetHidden() !== true) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN',
        'TASK_AUTHORITY',
        false,
        'Task Authority Ledger must remain hidden.'
      );
    }
    if (typeof ledger.getProtections === 'function') {
      var protectionType = typeof SpreadsheetApp !== 'undefined' &&
        SpreadsheetApp.ProtectionType
        ? SpreadsheetApp.ProtectionType.SHEET
        : undefined;
      var protections = protectionType === undefined
        ? ledger.getProtections()
        : ledger.getProtections(protectionType);
      var expectedDescription = 'WORK_OS_V2_PHASE1_' +
        AUTHORITY_LEDGER_SHEET + '_MANAGEMENT_SHEET';
      var protectedSheet = (protections || []).some(function (protection) {
        if (!protection ||
            (typeof protection.isWarningOnly === 'function' &&
             protection.isWarningOnly() !== false)) {
          return false;
        }
        // A Sheet-level protection for another purpose is not the authority
        // protection.  Where the runtime exposes these details, enforce the
        // canonical policy rather than accepting a superficially protected
        // but editable ledger.
        if (typeof protection.getDescription === 'function' &&
            protection.getDescription() !== expectedDescription) {
          return false;
        }
        if (typeof protection.canDomainEdit === 'function' &&
            protection.canDomainEdit() === true) {
          return false;
        }
        if (typeof protection.getUnprotectedRanges === 'function' &&
            protection.getUnprotectedRanges().length !== 0) {
          return false;
        }
        if (typeof protection.getEditors === 'function') {
          if (typeof Session === 'undefined' || !Session ||
              typeof Session.getEffectiveUser !== 'function') {
            return false;
          }
          var effectiveUser = Session.getEffectiveUser();
          var effectiveEmail = effectiveUser &&
            typeof effectiveUser.getEmail === 'function'
            ? String(effectiveUser.getEmail() || '')
            : '';
          if (!effectiveEmail) {
            return false;
          }
          var editors = protection.getEditors();
          if (!Array.isArray(editors) || !editors.length ||
              !editors.every(function (editor) {
                return editor && typeof editor.getEmail === 'function' &&
                  String(editor.getEmail() || '') === effectiveEmail;
              })) {
            return false;
          }
        }
        return true;
      });
      if (!protectedSheet) {
        throw new WorkOsAppError(
          'E_TASK_AUTHORITY_LEDGER_UNPROTECTED',
          'TASK_AUTHORITY',
          false,
          'Task Authority Ledger must retain a non-warning-only Sheet protection.'
        );
      }
    }
  }

  function ledgerRecordFromRow(row, schema) {
    var record = {};
    schema.forEach(function (item, index) {
      record[item.id] = valueFromCell(item, row[index]);
    });
    return record;
  }

  function ledgerRowFromRecord(record, schema) {
    return schema.map(function (item) {
      return valueForCell(
        item,
        Object.prototype.hasOwnProperty.call(record, item.id)
          ? record[item.id]
          : ''
      );
    });
  }

  function copyAuthorityLedgerRecord(record) {
    var output = {};
    Object.keys(record || {}).forEach(function (key) {
      output[key] = record[key];
    });
    return output;
  }

  function readAuthorityLedgerContext(taskSheet) {
    var ledgerSheet = getAuthorityLedgerSheet(taskSheet);
    var definition = authorityLedgerSchemaAndMap();
    var maxDataRows = Number(WorkOsConfig.AUTHORITY_LEDGER_MAX_DATA_ROWS);
    var maximumRow = ledgerSheet.getMaxRows();
    var lastUsedRow = typeof ledgerSheet.getLastRow === 'function'
      ? Math.max(WorkOsConfig.HEADER_LABEL_ROW, Number(ledgerSheet.getLastRow()))
      : maximumRow;
    var rowCount = Math.max(
      0,
      lastUsedRow - WorkOsConfig.DATA_START_ROW + 1
    );
    var chunkRows = Number(WorkOsConfig.AUTHORITY_LEDGER_CHUNK_ROWS);
    if (!Number.isInteger(maxDataRows) || maxDataRows <= 0 ||
        !Number.isInteger(chunkRows) || chunkRows <= 0 ||
        rowCount > maxDataRows) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_LEDGER_CAPACITY',
        'TASK_AUTHORITY',
        false,
        'Task Authority Ledger exceeds the bounded runtime read budget.'
      );
    }
    var byTaskId = {};
    var byPhysicalRow = {};
    var duplicateTaskIds = {};
    var emptyRows = [];
    function indexLedgerRow(row, physicalLedgerRow) {
      var taskId = String(row[definition.map.task_id] || '').trim();
      if (!taskId) {
        emptyRows.push(physicalLedgerRow);
        return;
      }
      var record = ledgerRecordFromRow(row, definition.schema);
      record._row = physicalLedgerRow;
      if (byTaskId[taskId]) {
        duplicateTaskIds[taskId] = true;
      } else {
        byTaskId[taskId] = record;
      }
      var physicalRow = Number(record.physical_row_hint);
      if (Number.isInteger(physicalRow) && physicalRow >=
          WorkOsConfig.DATA_START_ROW) {
        if (byPhysicalRow[physicalRow]) {
          duplicateTaskIds[taskId] = true;
        } else {
          byPhysicalRow[physicalRow] = record;
        }
      }
    }
    /*
     * Do not turn a malformed or heavily formatted ledger into one enormous
     * Sheets read.  `getLastRow` gives the bounded high-water mark, and this
     * loop keeps every individual read within the configured chunk budget.
     */
    for (var offset = 0; offset < rowCount; offset += chunkRows) {
      var count = Math.min(chunkRows, rowCount - offset);
      var rows = ledgerSheet.getRange(
        WorkOsConfig.DATA_START_ROW + offset,
        1,
        count,
        definition.schema.length
      ).getValues();
      rows.forEach(function (row, index) {
        indexLedgerRow(
          row,
          WorkOsConfig.DATA_START_ROW + offset + index
        );
      });
    }
    var nextAppendRow = WorkOsConfig.DATA_START_ROW + rowCount;
    return {
      sheet: ledgerSheet,
      schema: definition.schema,
      map: definition.map,
      by_task_id: byTaskId,
      by_physical_row: byPhysicalRow,
      duplicate_task_ids: duplicateTaskIds,
      empty_rows: emptyRows,
      next_append_row: nextAppendRow,
      maximum_row: maximumRow,
      maximum_data_rows: maxDataRows
    };
  }

  function ledgerRecordForTask(
    ledgerContext,
    observedTaskId,
    physicalRow
  ) {
    var taskId = String(observedTaskId || '').trim();
    var byTask = taskId ? ledgerContext.by_task_id[taskId] : null;
    var byPhysical = ledgerContext.by_physical_row[Number(physicalRow)] || null;
    if (taskId && ledgerContext.duplicate_task_ids[taskId]) {
      return { duplicate: true, record: byPhysical || byTask || null };
    }
    if (byTask && byPhysical && byTask._row !== byPhysical._row) {
      if (String(byPhysical.task_id || '') === taskId) {
        return { duplicate: true, record: byPhysical };
      }
      // A Sheet row deletion can shift several valid Task rows at once. Use
      // the matching task_id ledger record and classify its stale physical
      // hint below instead of quarantining the unrelated row now occupying it.
      return {
        duplicate: false,
        record: byTask,
        physical_mismatch: true
      };
    }
    var record = byPhysical || byTask || null;
    return {
      duplicate: false,
      record: record,
      physical_mismatch: Boolean(
        record && byTask && !byPhysical &&
        Number(record.physical_row_hint) !== Number(physicalRow)
      )
    };
  }

  function firstEmptyLedgerRow(ledgerContext) {
    if (ledgerContext.empty_rows && ledgerContext.empty_rows.length) {
      return ledgerContext.empty_rows.shift();
    }
    if (Number(ledgerContext.next_append_row) <=
        Math.min(
          Number(ledgerContext.maximum_row || ledgerContext.sheet.getMaxRows()),
          WorkOsConfig.DATA_START_ROW +
            Number(ledgerContext.maximum_data_rows) - 1
        )) {
      var available = Number(ledgerContext.next_append_row);
      ledgerContext.next_append_row = available + 1;
      return available;
    }
    var priorRows = ledgerContext.sheet.getMaxRows();
    var maximumRow = WorkOsConfig.DATA_START_ROW +
      Number(ledgerContext.maximum_data_rows) - 1;
    var rowsToAppend = Math.min(
      WorkOsConfig.ROW_EXPANSION_UNIT,
      maximumRow - priorRows
    );
    if (!Number.isInteger(rowsToAppend) || rowsToAppend <= 0) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_LEDGER_CAPACITY',
        'TASK_AUTHORITY',
        false,
        'Task Authority Ledger has reached its bounded data-row capacity.'
      );
    }
    ledgerContext.sheet.insertRowsAfter(
      priorRows,
      rowsToAppend
    );
    ledgerContext.maximum_row = priorRows + rowsToAppend;
    ledgerContext.empty_rows = ledgerContext.empty_rows || [];
    for (var offset = 1; offset < rowsToAppend; offset += 1) {
      ledgerContext.empty_rows.push(priorRows + 1 + offset);
    }
    return priorRows + 1;
  }

  function writeAuthorityLedgerRecord(ledgerContext, record) {
    var target = record;
    var row = Number(target._row);
    if (!Number.isInteger(row) || row < WorkOsConfig.DATA_START_ROW) {
      row = firstEmptyLedgerRow(ledgerContext);
      target._row = row;
    }
    target.updated_at = WorkOsUtilities.now();
    ledgerContext.sheet.getRange(
      row,
      1,
      1,
      ledgerContext.schema.length
    ).setValues([ledgerRowFromRecord(target, ledgerContext.schema)]);
    ledgerContext.by_task_id[String(target.task_id)] = target;
    Object.keys(ledgerContext.by_physical_row).forEach(function (hint) {
      var existing = ledgerContext.by_physical_row[hint];
      if (existing && (Number(existing._row) === Number(target._row) ||
          String(existing.task_id || '') === String(target.task_id || ''))) {
        delete ledgerContext.by_physical_row[hint];
      }
    });
    if (Number.isInteger(Number(target.physical_row_hint))) {
      ledgerContext.by_physical_row[Number(target.physical_row_hint)] = target;
    }
    return target;
  }

  function discardUncommittedAuthorityRecord(ledgerContext, record) {
    // A failed first insert can leave a PREPARED record without any committed
    // slot.  It is safe to discard only that empty authority transaction: the
    // Task row has already been proved blank by recoverPreparedAuthority.  Do
    // not use this path for a record that ever had a committed generation.
    var row = Number(record && record._row);
    if (Number.isInteger(row) && row >= WorkOsConfig.DATA_START_ROW) {
      ledgerContext.sheet.getRange(
        row,
        1,
        1,
        ledgerContext.schema.length
      ).setValues([new Array(ledgerContext.schema.length).fill('')]);
      ledgerContext.empty_rows = ledgerContext.empty_rows || [];
      ledgerContext.empty_rows.push(row);
      ledgerContext.empty_rows.sort(function (left, right) {
        return left - right;
      });
    }
    Object.keys(ledgerContext.by_task_id).forEach(function (taskId) {
      if (ledgerContext.by_task_id[taskId] === record) {
        delete ledgerContext.by_task_id[taskId];
      }
    });
    Object.keys(ledgerContext.by_physical_row).forEach(function (physicalRow) {
      if (ledgerContext.by_physical_row[physicalRow] === record) {
        delete ledgerContext.by_physical_row[physicalRow];
      }
    });
    return null;
  }

  function newAuthorityLedgerRecord(taskId, physicalRow) {
    return {
      task_id: String(taskId || ''),
      control_state: 'ACTIVE',
      active_slot: '',
      committed_generation: 0,
      committed_hash: '',
      slot_a_generation: '',
      slot_a_hash: '',
      slot_a_snapshot_json: '',
      slot_b_generation: '',
      slot_b_hash: '',
      slot_b_snapshot_json: '',
      transaction_state: 'IDLE',
      prepared_slot: '',
      prepared_generation: '',
      prepared_hash: '',
      base_generation: '',
      base_hash: '',
      operation_id: '',
      physical_row_hint: Number(physicalRow),
      quarantine_reason_code: '',
      updated_at: WorkOsUtilities.now()
    };
  }

  function ledgerSlotSnapshot(record, slot) {
    var normalized = String(slot || '');
    if (normalized !== 'A' && normalized !== 'B') {
      return null;
    }
    var suffix = normalized === 'A' ? 'a' : 'b';
    var snapshot = record['slot_' + suffix + '_snapshot_json'];
    var hash = record['slot_' + suffix + '_hash'];
    var generation = Number(record['slot_' + suffix + '_generation']);
    if (!Number.isInteger(generation) || generation <= 0 || !snapshot || !hash) {
      return null;
    }
    return {
      slot: normalized,
      generation: generation,
      hash: String(hash),
      snapshot: snapshot
    };
  }

  function committedLedgerSlot(record) {
    if (!record || String(record.control_state || '') !== 'ACTIVE') {
      return null;
    }
    var result = ledgerSlotSnapshot(record, record.active_slot);
    if (!result ||
        result.generation !== Number(record.committed_generation) ||
        result.hash !== String(record.committed_hash || '')) {
      return null;
    }
    return result;
  }

  function preparedLedgerSlot(record) {
    if (!record || String(record.transaction_state || '') !== 'PREPARED') {
      return null;
    }
    var result = ledgerSlotSnapshot(record, record.prepared_slot);
    if (!result ||
        result.generation !== Number(record.prepared_generation) ||
        result.hash !== String(record.prepared_hash || '')) {
      return null;
    }
    return result;
  }

  function authorityValidationResult(status, code, record, details) {
    var result = {
      status: status,
      code: code || '',
      record: record || null
    };
    Object.keys(details || {}).forEach(function (key) {
      result[key] = details[key];
    });
    return result;
  }

  /**
   * Shared, fail-closed authority validator used by Setup, diagnostics,
   * migration, Task writes and edit restoration.  It deliberately does not
   * inspect authoritative_snapshot_json or a cell note as a trust source.
   */
  function validateAuthority(row, options) {
    var settings = options || {};
    var schema = settings.schema || WorkOsSchemas.getSheetSchema(
      WorkOsConfig.SHEETS.TASKS
    );
    var map = settings.column_map || WorkOsSchemas.buildColumnMapFromIds(
      WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS)
    );
    var physicalRow = Number(settings.physical_row);
    var taskSheet = settings.sheet;
    var observedTaskId = String(row && row[map.task_id] || '').trim();
    var observedOriginKey = String(row && row[map.origin_key] || '').trim();
    var ledgerContext;
    try {
      ledgerContext = settings.ledger_context || readAuthorityLedgerContext(
        taskSheet
      );
    } catch (error) {
      return authorityValidationResult(
        'QUARANTINED',
        error && error.code || 'E_TASK_AUTHORITY_LEDGER_MISSING',
        null,
        { safe_message: 'Authority ledger is unavailable.' }
      );
    }
    if (!observedTaskId && !observedOriginKey &&
        !ledgerContext.by_physical_row[physicalRow]) {
      return authorityValidationResult('EMPTY', '', null, {
        ledger_context: ledgerContext
      });
    }
    var located = ledgerRecordForTask(
      ledgerContext,
      observedTaskId,
      physicalRow
    );
    if (located.duplicate) {
      return authorityValidationResult(
        'UNRECOVERABLE',
        'E_TASK_AUTHORITY_DUPLICATE',
        located.record,
        { ledger_context: ledgerContext }
      );
    }
    var record = located.record;
    if (!record) {
      return authorityValidationResult(
        'QUARANTINED',
        'E_TASK_AUTHORITY_MISSING',
        null,
        { ledger_context: ledgerContext }
      );
    }
    if (String(record.control_state || '') === 'QUARANTINED') {
      return authorityValidationResult(
        'QUARANTINED',
        String(record.quarantine_reason_code || 'E_TASK_AUTHORITY_QUARANTINED'),
        record,
        { ledger_context: ledgerContext }
      );
    }
    if (String(record.control_state || '') === 'UNRECOVERABLE') {
      return authorityValidationResult(
        'UNRECOVERABLE',
        String(record.quarantine_reason_code || 'E_TASK_AUTHORITY_UNRECOVERABLE'),
        record,
        { ledger_context: ledgerContext }
      );
    }
    if (String(record.control_state || '') === 'ORPHANED') {
      return authorityValidationResult(
        'ORPHANED',
        String(record.quarantine_reason_code || 'E_TASK_AUTHORITY_ORPHANED'),
        record,
        { ledger_context: ledgerContext }
      );
    }
    var relocated = false;
    if (located.physical_mismatch) {
      var hintedRow = Number(record.physical_row_hint);
      if (Number.isInteger(hintedRow) &&
          hintedRow >= WorkOsConfig.DATA_START_ROW &&
          hintedRow !== physicalRow) {
        var hintedRaw = taskSheet.getRange(
          hintedRow,
          1,
          1,
          schema.length
        ).getValues()[0];
        if (String(hintedRaw[map.task_id] || '') ===
            String(record.task_id || '')) {
          return authorityValidationResult(
            'UNRECOVERABLE',
            'E_TASK_AUTHORITY_DUPLICATE_ROW',
            record,
            { ledger_context: ledgerContext }
          );
        }
      }
      relocated = true;
    }
    var prepared = preparedLedgerSlot(record);
    if (String(record.transaction_state || '') === 'PREPARED') {
      if (!prepared) {
        return authorityValidationResult(
          'UNRECOVERABLE',
          'E_TASK_AUTHORITY_PREPARED_INVALID',
          record,
          { ledger_context: ledgerContext }
        );
      }
      return authorityValidationResult(
        'PREPARED_RECOVERABLE',
        'E_TASK_AUTHORITY_PREPARED',
        record,
        { ledger_context: ledgerContext, prepared_slot: prepared }
      );
    }
    if (String(record.transaction_state || '') !== 'IDLE') {
      return authorityValidationResult(
        'UNRECOVERABLE',
        'E_TASK_AUTHORITY_TRANSACTION_INVALID',
        record,
        { ledger_context: ledgerContext }
      );
    }
    var committed = committedLedgerSlot(record);
    if (!committed) {
      return authorityValidationResult(
        'UNRECOVERABLE',
        'E_TASK_AUTHORITY_COMMIT_INVALID',
        record,
        { ledger_context: ledgerContext }
      );
    }
    try {
      var expected = rowFromAuthoritySnapshot(
        validateLedgerAuthoritySnapshot(
          committed.snapshot,
          record.task_id,
          committed.hash
        ),
        committed.generation,
        committed.hash,
        AUTHORITY_ACTIVE_STATE,
        schema,
        map
      );
      var matchesCommitted = rowsEqual(row, expected);
      return authorityValidationResult(
        relocated && matchesCommitted
          ? 'RELOCATABLE'
          : (matchesCommitted ? 'VALID' : 'RESTORABLE'),
        relocated && matchesCommitted
          ? 'E_TASK_AUTHORITY_ROW_RELOCATED'
          : (matchesCommitted ? '' : 'E_TASK_AUTHORITY_DRIFT'),
        record,
        {
          ledger_context: ledgerContext,
          committed_slot: committed,
          authoritative_row: expected,
          mode: String(settings.mode || 'NORMAL'),
          relocation_required: relocated
        }
      );
    } catch (error) {
      return authorityValidationResult(
        'UNRECOVERABLE',
        error && error.code || 'E_TASK_AUTHORITY_LEDGER_INVALID',
        record,
        { ledger_context: ledgerContext }
      );
    }
  }

  function writeAuthorityStateMarker(sheet, physicalRow, state, map) {
    if (!sheet || !Number.isInteger(Number(physicalRow))) {
      return;
    }
    var columnMap = map || WorkOsSchemas.buildColumnMapFromIds(
      WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS)
    );
    if (!Object.prototype.hasOwnProperty.call(columnMap, AUTHORITY_STATE_FIELD)) {
      return;
    }
    sheet.getRange(
      Number(physicalRow),
      columnMap[AUTHORITY_STATE_FIELD] + 1,
      1,
      1
    ).setValues([[state]]);
  }

  /**
   * Records only a one-way, non-content-bearing authority isolation event.
   * The visible Task ID is transformed before it reaches the Errors schema;
   * raw Task cells, snapshots and user input are never passed to logging.
   * Logging is best-effort so an unavailable Errors sheet cannot undo the
   * fail-closed quarantine that has already been durably written to the
   * authority ledger.
   */
  function recordAuthorityIsolation(
    taskSheet,
    taskId,
    physicalRow,
    reasonCode,
    controlState
  ) {
    var safeTaskRef = 'taskref_' + WorkOsUtilities.sha256Hex(
      'v2|task-authority-isolation|' + String(taskId || '') + '|' +
        String(physicalRow || '')
    );
    var code = String(reasonCode || 'E_TASK_AUTHORITY_QUARANTINED')
      .replace(/[^A-Z0-9_]/g, '_')
      .slice(0, 80) || 'E_TASK_AUTHORITY_QUARANTINED';
    if (typeof WorkOsLogAndDeadLetter === 'undefined' ||
        !WorkOsLogAndDeadLetter ||
        typeof WorkOsLogAndDeadLetter.recordOperationalError !== 'function') {
      return {
        recorded: false,
        safe_task_reference: safeTaskRef,
        reason_code: code
      };
    }
    try {
      WorkOsLogAndDeadLetter.recordOperationalError(
        new WorkOsAppError(
          code,
          'TASK_AUTHORITY',
          false,
          'Task authority was isolated; inspect the safe reason code.'
        ),
        {
          subsystem: 'TASK_UPSERT',
          fallback_stage: 'TASK_AUTHORITY',
          task_id: safeTaskRef,
          status: 'DEAD',
          processing_status: 'DEAD'
        },
        '',
        taskParentSpreadsheet(taskSheet)
      );
      return {
        recorded: true,
        safe_task_reference: safeTaskRef,
        reason_code: code,
        control_state: String(controlState || 'QUARANTINED')
      };
    } catch (error) {
      return {
        recorded: false,
        safe_task_reference: safeTaskRef,
        reason_code: code,
        control_state: String(controlState || 'QUARANTINED')
      };
    }
  }

  function quarantineAuthorityRow(sheet, physicalRow, rawRow, reasonCode, options) {
    var settings = options || {};
    var schema = settings.schema || WorkOsSchemas.getSheetSchema(
      WorkOsConfig.SHEETS.TASKS
    );
    var map = settings.column_map || WorkOsSchemas.buildColumnMapFromIds(
      WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS)
    );
    var ledgerContext = settings.ledger_context || readAuthorityLedgerContext(sheet);
    var observedTaskId = String(rawRow && rawRow[map.task_id] || '').trim();
    var located = ledgerRecordForTask(ledgerContext, observedTaskId, physicalRow);
    // A copied row can share a valid Task ID with its original.  Never turn
    // the original record into QUARANTINED just to isolate the copy; attach a
    // detached control record to the copied physical row instead.
    var detachFromExistingAuthority = located.duplicate ||
      (located.physical_mismatch && located.record &&
       Number(located.record.physical_row_hint) !== Number(physicalRow));
    var detachedTaskId = 'qrow_' + WorkOsUtilities.sha256Hex(
      String(physicalRow) + '|' + String(reasonCode || '')
    ).slice(0, 24);
    var existingPhysicalRecord = ledgerContext.by_physical_row[
      Number(physicalRow)
    ] || null;
    var reusableDetachedRecord = existingPhysicalRecord &&
      /^qrow_[0-9a-f]{24}$/.test(String(existingPhysicalRecord.task_id || '')) &&
      (String(existingPhysicalRecord.control_state || '') === 'QUARANTINED' ||
       String(existingPhysicalRecord.control_state || '') === 'UNRECOVERABLE');
    var baseRecord = reusableDetachedRecord
      ? existingPhysicalRecord
      : (detachFromExistingAuthority
      ? newAuthorityLedgerRecord(detachedTaskId, physicalRow)
      : (located.record || newAuthorityLedgerRecord(
        observedTaskId || detachedTaskId,
        physicalRow
      )));
    var record = copyAuthorityLedgerRecord(baseRecord);
    record.control_state = settings.unrecoverable === true
      ? 'UNRECOVERABLE'
      : 'QUARANTINED';
    record.transaction_state = 'IDLE';
    record.prepared_slot = '';
    record.prepared_generation = '';
    record.prepared_hash = '';
    record.base_generation = '';
    record.base_hash = '';
    record.operation_id = '';
    record.physical_row_hint = Number(physicalRow);
    record.quarantine_reason_code = String(
      reasonCode || 'E_TASK_AUTHORITY_QUARANTINED'
    );
    writeAuthorityLedgerRecord(ledgerContext, record);
    writeAuthorityStateMarker(
      sheet,
      physicalRow,
      record.control_state === 'UNRECOVERABLE'
        ? AUTHORITY_UNRECOVERABLE_STATE
        : AUTHORITY_QUARANTINED_STATE,
      map
    );
    var isolationAudit = recordAuthorityIsolation(
      sheet,
      observedTaskId || record.task_id,
      physicalRow,
      record.quarantine_reason_code,
      record.control_state
    );
    return authorityValidationResult(
      record.control_state === 'UNRECOVERABLE'
        ? 'UNRECOVERABLE'
        : 'QUARANTINED',
      record.quarantine_reason_code,
      record,
      {
        ledger_context: ledgerContext,
        safe_task_reference: isolationAudit.safe_task_reference,
        isolation_logged: isolationAudit.recorded
      }
    );
  }

  function promotePreparedLedgerRecord(ledgerContext, record) {
    var output = copyAuthorityLedgerRecord(record);
    var prepared = preparedLedgerSlot(output);
    if (!prepared) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_PREPARED_INVALID',
        'TASK_AUTHORITY',
        false,
        'Prepared authority slot is not valid.'
      );
    }
    var committed = committedLedgerSlot(output);
    if (Number(output.base_generation || 0) !==
          Number(committed && committed.generation || 0) ||
        String(output.base_hash || '') !==
          String(committed && committed.hash || '')) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_BASE_MISMATCH',
        'TASK_AUTHORITY',
        false,
        'Prepared authority record does not match its declared committed base.'
      );
    }
    output.active_slot = prepared.slot;
    output.committed_generation = prepared.generation;
    output.committed_hash = prepared.hash;
    output.transaction_state = 'IDLE';
    output.prepared_slot = '';
    output.prepared_generation = '';
    output.prepared_hash = '';
    output.base_generation = '';
    output.base_hash = '';
    output.operation_id = '';
    output.quarantine_reason_code = '';
    output.control_state = 'ACTIVE';
    return writeAuthorityLedgerRecord(ledgerContext, output);
  }

  function rollbackPreparedLedgerRecord(ledgerContext, record) {
    if (!committedLedgerSlot(record) &&
        Number(record.committed_generation || 0) === 0 &&
        !String(record.committed_hash || '')) {
      return discardUncommittedAuthorityRecord(ledgerContext, record);
    }
    var output = copyAuthorityLedgerRecord(record);
    output.transaction_state = 'IDLE';
    output.prepared_slot = '';
    output.prepared_generation = '';
    output.prepared_hash = '';
    output.base_generation = '';
    output.base_hash = '';
    output.operation_id = '';
    return writeAuthorityLedgerRecord(ledgerContext, output);
  }

  function rebindRelocatedAuthorityRecord(ledgerContext, record, physicalRow) {
    var output = copyAuthorityLedgerRecord(record);
    output.physical_row_hint = Number(physicalRow);
    return writeAuthorityLedgerRecord(ledgerContext, output);
  }

  /*
   * A missing physical Task row is never silently recreated from a ledger
   * snapshot. Keep the last valid generation for audited recovery, but remove
   * the record from normal authority/worker/calendar selection until an
   * explicit operator-led repair establishes a new physical row.
   */
  function markAuthorityRecordOrphaned(ledgerContext, record) {
    var output = copyAuthorityLedgerRecord(record);
    output.control_state = 'ORPHANED';
    output.transaction_state = 'IDLE';
    output.prepared_slot = '';
    output.prepared_generation = '';
    output.prepared_hash = '';
    output.base_generation = '';
    output.base_hash = '';
    output.operation_id = '';
    // The old physical hint may now belong to a different Task after a row
    // delete/sort. Keeping it would make an orphan shadow that healthy Task
    // on a later scan, so retain no live physical resolution hint.
    output.physical_row_hint = '';
    output.quarantine_reason_code = 'E_TASK_AUTHORITY_ORPHANED';
    return writeAuthorityLedgerRecord(ledgerContext, output);
  }

  /**
   * Settle the ledger side of an already-durable PREPARED transaction.
   * A Sheets write can throw either before or after persistence, so each
   * attempt re-reads and validates the durable record before deciding whether
   * to retry the deterministic promote/rollback operation.  Two attempts are
   * sufficient for a single interrupted operation; any remaining ambiguous
   * state is returned to the caller for fail-closed quarantine.
   */
  function settlePreparedLedgerTransition(
    taskSheet,
    physicalRow,
    raw,
    schema,
    map,
    transition,
    allowEmptyAfterRollback
  ) {
    var lastError = null;
    var validation;
    for (var attempt = 0; attempt < 2; attempt += 1) {
      validation = validateAuthority(raw, {
        sheet: taskSheet,
        physical_row: physicalRow,
        schema: schema,
        column_map: map,
        mode: 'RECOVERY'
      });
      if (validation.status === 'VALID' ||
          (transition === 'ROLLBACK' &&
            allowEmptyAfterRollback === true &&
            validation.status === 'EMPTY')) {
        return {
          validation: validation,
          error: lastError
        };
      }
      if (validation.status !== 'PREPARED_RECOVERABLE') {
        return {
          validation: validation,
          error: lastError
        };
      }
      try {
        if (transition === 'PROMOTE') {
          promotePreparedLedgerRecord(
            validation.ledger_context,
            validation.record
          );
        } else {
          rollbackPreparedLedgerRecord(
            validation.ledger_context,
            validation.record
          );
        }
      } catch (error) {
        lastError = error;
      }
    }
    validation = validateAuthority(raw, {
      sheet: taskSheet,
      physical_row: physicalRow,
      schema: schema,
      column_map: map,
      mode: 'RECOVERY'
    });
    return {
      validation: validation,
      error: lastError
    };
  }

  function recoveredAuthorityValidation(validation, recoveryAction) {
    var output = {};
    Object.keys(validation || {}).forEach(function (key) {
      output[key] = validation[key];
    });
    output.recovery_action = recoveryAction;
    return output;
  }

  function recoverPreparedAuthority(taskSheet, physicalRow, options) {
    var settings = options || {};
    var schema = settings.schema || WorkOsSchemas.getSheetSchema(
      WorkOsConfig.SHEETS.TASKS
    );
    var map = settings.column_map || WorkOsSchemas.buildColumnMapFromIds(
      WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS)
    );
    var raw = settings.raw_row || taskSheet.getRange(
      physicalRow,
      1,
      1,
      schema.length
    ).getValues()[0];
    var validation = validateAuthority(raw, {
      sheet: taskSheet,
      physical_row: physicalRow,
      schema: schema,
      column_map: map,
      ledger_context: settings.ledger_context,
      mode: 'RECOVERY'
    });
    if (validation.status !== 'PREPARED_RECOVERABLE') {
      return validation;
    }
    var record = validation.record;
    var prepared = validation.prepared_slot;
    var committed = committedLedgerSlot(record);
    var preparedRow;
    var committedRow;
    try {
      preparedRow = rowFromAuthoritySnapshot(
        validateLedgerAuthoritySnapshot(
          prepared.snapshot,
          record.task_id,
          prepared.hash
        ),
        prepared.generation,
        prepared.hash,
        AUTHORITY_ACTIVE_STATE,
        schema,
        map
      );
      committedRow = committed
        ? rowFromAuthoritySnapshot(
          validateLedgerAuthoritySnapshot(
            committed.snapshot,
            record.task_id,
            committed.hash
          ),
          committed.generation,
          committed.hash,
          AUTHORITY_ACTIVE_STATE,
          schema,
          map
        )
        : new Array(schema.length).fill('');
    } catch (error) {
      return quarantineAuthorityRow(
        taskSheet,
        physicalRow,
        raw,
        error && error.code || 'E_TASK_AUTHORITY_PREPARED_INVALID',
        {
          schema: schema,
          column_map: map,
          ledger_context: validation.ledger_context,
          unrecoverable: true
        }
      );
    }
    if (rowsEqual(raw, preparedRow)) {
      var promotion = settlePreparedLedgerTransition(
        taskSheet,
        physicalRow,
        raw,
        schema,
        map,
        'PROMOTE'
      );
      if (promotion.validation.status === 'VALID') {
        return recoveredAuthorityValidation(
          promotion.validation,
          'PROMOTED'
        );
      }
      return quarantineAuthorityRow(
        taskSheet,
        physicalRow,
        raw,
        promotion.error && promotion.error.code ||
          promotion.validation.code ||
          'E_TASK_AUTHORITY_PREPARED_COMMIT_FAILED',
        {
          schema: schema,
          column_map: map,
          ledger_context: promotion.validation.ledger_context ||
            validation.ledger_context,
          unrecoverable: true
        }
      );
    }
    if (rowsEqual(raw, committedRow)) {
      // A failed first insert has no committed slot and its durable Task row is
      // still blank.  Rolling that PREPARED record back deliberately removes
      // the ledger row, so the only correct postcondition is EMPTY rather than
      // VALID.  Treat that as a completed rollback, never as a reason to
      // quarantine an otherwise retryable insert.
      var allowEmptyAfterRollback = !committed;
      var rollback = settlePreparedLedgerTransition(
        taskSheet,
        physicalRow,
        raw,
        schema,
        map,
        'ROLLBACK',
        allowEmptyAfterRollback
      );
      if (rollback.validation.status === 'VALID') {
        return recoveredAuthorityValidation(
          rollback.validation,
          'ROLLED_BACK'
        );
      }
      if (allowEmptyAfterRollback && rollback.validation.status === 'EMPTY') {
        return recoveredAuthorityValidation(
          rollback.validation,
          'ROLLED_BACK_EMPTY'
        );
      }
      return quarantineAuthorityRow(
        taskSheet,
        physicalRow,
        raw,
        rollback.error && rollback.error.code ||
          rollback.validation.code ||
          'E_TASK_AUTHORITY_PREPARED_ROLLBACK_FAILED',
        {
          schema: schema,
          column_map: map,
          ledger_context: rollback.validation.ledger_context ||
            validation.ledger_context,
          unrecoverable: true
        }
      );
    }
    return quarantineAuthorityRow(
      taskSheet,
      physicalRow,
      raw,
      'E_TASK_AUTHORITY_PREPARED_ROW_AMBIGUOUS',
      {
        schema: schema,
        column_map: map,
        ledger_context: validation.ledger_context,
        unrecoverable: true
      }
    );
  }

  function prepareAuthorityLedgerCommit(
    ledgerContext,
    record,
    snapshot,
    physicalRow
  ) {
    var base = copyAuthorityLedgerRecord(record ||
      newAuthorityLedgerRecord(snapshot.task_id, physicalRow));
    if (record && String(record.control_state || '') !== 'ACTIVE') {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_QUARANTINED',
        'TASK_AUTHORITY',
        false,
        'A quarantined Task cannot be written by normal processing.'
      );
    }
    var committed = committedLedgerSlot(base);
    if (record && !committed) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_COMMIT_INVALID',
        'TASK_AUTHORITY',
        false,
        'Existing authority record has no valid committed slot.'
      );
    }
    var nextSlot = committed && committed.slot === 'A' ? 'B' : 'A';
    var suffix = nextSlot === 'A' ? 'a' : 'b';
    var nextGeneration = committed ? committed.generation + 1 : 1;
    var nextHash = authoritySnapshotHash(snapshot);
    base['slot_' + suffix + '_generation'] = nextGeneration;
    base['slot_' + suffix + '_hash'] = nextHash;
    base['slot_' + suffix + '_snapshot_json'] = snapshot;
    base.control_state = 'ACTIVE';
    base.transaction_state = 'PREPARED';
    base.prepared_slot = nextSlot;
    base.prepared_generation = nextGeneration;
    base.prepared_hash = nextHash;
    base.base_generation = committed ? committed.generation : 0;
    base.base_hash = committed ? committed.hash : '';
    base.operation_id = WorkOsUtilities.makeId('op_');
    base.physical_row_hint = Number(physicalRow);
    base.quarantine_reason_code = '';
    writeAuthorityLedgerRecord(ledgerContext, base);
    return {
      record: base,
      generation: nextGeneration,
      hash: nextHash,
      snapshot: snapshot
    };
  }

  function commitAuthorityRow(taskSheet, physicalRow, candidateRow, options) {
    var settings = options || {};
    var schema = settings.schema || WorkOsSchemas.getSheetSchema(
      WorkOsConfig.SHEETS.TASKS
    );
    var map = settings.column_map || WorkOsSchemas.buildColumnMapFromIds(
      WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS)
    );
    var raw = taskSheet.getRange(
      physicalRow,
      1,
      1,
      schema.length
    ).getValues()[0];
    var validation = validateAuthority(raw, {
      sheet: taskSheet,
      physical_row: physicalRow,
      schema: schema,
      column_map: map,
      ledger_context: settings.ledger_context,
      mode: settings.mode || 'WRITE'
    });
    if (validation.status === 'PREPARED_RECOVERABLE') {
      validation = recoverPreparedAuthority(taskSheet, physicalRow, {
        schema: schema,
        column_map: map,
        raw_row: raw,
        ledger_context: validation.ledger_context
      });
      raw = taskSheet.getRange(
        physicalRow,
        1,
        1,
        schema.length
      ).getValues()[0];
    }
    if (settings.allow_authority_seed === true &&
        validation.status === 'QUARANTINED' &&
        validation.code === 'E_TASK_AUTHORITY_MISSING') {
      validation = authorityValidationResult('EMPTY', '', null, {
        ledger_context: validation.ledger_context ||
          readAuthorityLedgerContext(taskSheet)
      });
    }
    if (validation.status === 'QUARANTINED' ||
        validation.status === 'UNRECOVERABLE') {
      throw new WorkOsAppError(
        validation.code || 'E_TASK_AUTHORITY_QUARANTINED',
        'TASK_AUTHORITY',
        false,
        'Task authority is quarantined and cannot be updated.'
      );
    }
    if (validation.status !== 'EMPTY' && validation.status !== 'VALID' &&
        validation.status !== 'RELOCATABLE' &&
        !(settings.allow_raw_drift === true &&
          validation.status === 'RESTORABLE')) {
      throw new WorkOsAppError(
        validation.code || 'E_TASK_AUTHORITY_DRIFT',
        'TASK_AUTHORITY',
        false,
        'Task row does not match the committed authority record.'
      );
    }
    var candidate = candidateRow.slice();
    var snapshot = buildAuthoritySnapshot(candidate, schema, map);
    if (!String(snapshot.task_id || '')) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_ID',
        'TASK_AUTHORITY',
        false,
        'Task authority commit requires a stable task_id.'
      );
    }
    var prepared = prepareAuthorityLedgerCommit(
      validation.ledger_context || readAuthorityLedgerContext(taskSheet),
      validation.record,
      snapshot,
      physicalRow
    );
    var output = rowFromAuthoritySnapshot(
      prepared.snapshot,
      prepared.generation,
      prepared.hash,
      AUTHORITY_ACTIVE_STATE,
      schema,
      map
    );
    try {
      taskSheet.getRange(
        physicalRow,
        1,
        1,
        schema.length
      ).setValues([output]);
    } catch (writeError) {
      var writeRecovery = recoverPreparedAuthority(taskSheet, physicalRow, {
        schema: schema,
        column_map: map,
        // Re-read durable state. The preceding write can throw after either
        // the Task row or ledger mutation, so a mutable cached record is not
        // authoritative for recovery.
        ledger_context: readAuthorityLedgerContext(taskSheet)
      });
      // A rollback proves only that the old committed row survived; it does
      // not prove this caller's candidate write happened.  Propagation of the
      // original error preserves retry semantics and prevents an unpersisted
      // Task update from being reported as success.
      if (writeRecovery.status === 'VALID' &&
          writeRecovery.recovery_action === 'PROMOTED') {
        return {
          row: physicalRow,
          output_row: output,
          authority_generation: prepared.generation,
          authority_hash: prepared.hash,
          recovered: true
        };
      }
      throw writeError;
    }
    try {
      promotePreparedLedgerRecord(
        validation.ledger_context || readAuthorityLedgerContext(taskSheet),
        prepared.record
      );
    } catch (commitError) {
      var commitRecovery = recoverPreparedAuthority(taskSheet, physicalRow, {
        schema: schema,
        column_map: map,
        ledger_context: readAuthorityLedgerContext(taskSheet)
      });
      if (commitRecovery.status !== 'VALID') {
        throw commitError;
      }
    }
    return {
      row: physicalRow,
      output_row: output,
      authority_generation: prepared.generation,
      authority_hash: prepared.hash,
      recovered: false
    };
  }

  function restoreAuthorityRow(taskSheet, physicalRow, rawRow, options) {
    var settings = options || {};
    var schema = settings.schema || WorkOsSchemas.getSheetSchema(
      WorkOsConfig.SHEETS.TASKS
    );
    var map = settings.column_map || WorkOsSchemas.buildColumnMapFromIds(
      WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS)
    );
    var validation = validateAuthority(rawRow, {
      sheet: taskSheet,
      physical_row: physicalRow,
      schema: schema,
      column_map: map,
      ledger_context: settings.ledger_context,
      mode: settings.mode || 'RESTORE'
    });
    if (validation.status === 'PREPARED_RECOVERABLE') {
      validation = recoverPreparedAuthority(taskSheet, physicalRow, {
        schema: schema,
        column_map: map,
        raw_row: rawRow,
        ledger_context: validation.ledger_context
      });
    }
    if (validation.status === 'RELOCATABLE') {
      // A moved row already equals its committed authority. Rebind the ledger
      // hint only; a full Task-row rewrite would turn an innocent sort/move
      // into an unnecessary second physical mutation.
      rebindRelocatedAuthorityRecord(
        validation.ledger_context,
        validation.record,
        physicalRow
      );
      return authorityValidationResult(
        'RESTORED',
        validation.code,
        validation.record,
        {
          ledger_context: validation.ledger_context,
          authoritative_row: validation.authoritative_row,
          recovery_action: 'REBOUND'
        }
      );
    }
    if (validation.status === 'VALID' ||
        validation.status === 'RESTORABLE') {
      taskSheet.getRange(
        physicalRow,
        1,
        1,
        schema.length
      ).setValues([validation.authoritative_row]);
      return authorityValidationResult(
        'RESTORED',
        validation.code,
        validation.record,
        {
          ledger_context: validation.ledger_context,
          authoritative_row: validation.authoritative_row
        }
      );
    }
    if (validation.status === 'EMPTY' &&
        validation.recovery_action === 'ROLLED_BACK_EMPTY') {
      // The original row was blank and the failed initial insert was safely
      // discarded.  There is no Task to restore or isolate.
      return validation;
    }
    return quarantineAuthorityRow(
      taskSheet,
      physicalRow,
      rawRow,
      validation.code || 'E_TASK_AUTHORITY_UNRECOVERABLE',
      {
        schema: schema,
        column_map: map,
        ledger_context: validation.ledger_context,
        unrecoverable: validation.status === 'UNRECOVERABLE'
      }
    );
  }

  /*
   * Ledger-oriented reconciliation complements row-oriented validation. A
   * deleted Task has no raw row to validate, so the only safe action is to
   * classify its ACTIVE record as ORPHANED.  Both Setup/diagnostics and
   * Migration use this one helper; it never recreates a Task from a snapshot.
   */
  function reconcileMissingAuthorityRecords(
    taskSheet,
    ledgerContext,
    observedTaskRowsById,
    options
  ) {
    var settings = options || {};
    var results = [];
    var mutations = { orphaned: 0 };
    Object.keys(ledgerContext.by_task_id).forEach(function (taskId) {
      var record = ledgerContext.by_task_id[taskId];
      var knownRows = observedTaskRowsById[String(taskId || '')];
      if (knownRows && (Array.isArray(knownRows) ? knownRows.length : true)) {
        return;
      }
      var hintedRow = Number(record && record.physical_row_hint);
      var safeHintedRow = Number.isInteger(hintedRow) &&
        hintedRow >= WorkOsConfig.DATA_START_ROW ? hintedRow : null;
      var controlState = String(record && record.control_state || '');
      if (controlState !== 'ACTIVE' && controlState !== 'ORPHANED') {
        return;
      }
      if (settings.mark_orphaned === true &&
          controlState === 'ACTIVE') {
        record = markAuthorityRecordOrphaned(ledgerContext, record);
        mutations.orphaned += 1;
        recordAuthorityIsolation(
          taskSheet,
          String(record.task_id || ''),
          safeHintedRow,
          'E_TASK_AUTHORITY_ORPHANED',
          'ORPHANED'
        );
      }
      results.push({
        row: safeHintedRow,
        task_id: String(record.task_id || ''),
        status: 'ORPHANED',
        code: 'E_TASK_AUTHORITY_ORPHANED'
      });
    });
    return { rows: results, mutations: mutations };
  }

  function validateAllTaskAuthorities(taskSheet, options) {
    var settings = options || {};
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    var map = WorkOsSchemas.buildColumnMapFromIds(
      WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS)
    );
    var ledgerContext = readAuthorityLedgerContext(taskSheet);
    var rowCount = Math.max(
      0,
      taskSheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
    );
    var rows = rowCount ? taskSheet.getRange(
      WorkOsConfig.DATA_START_ROW,
      1,
      rowCount,
      schema.length
    ).getValues() : [];
    var results = [];
    var mutations = { orphaned: 0 };
    var rawTaskRowsById = {};
    rows.forEach(function (row, index) {
      var rawTaskId = String(row[map.task_id] || '').trim();
      if (!rawTaskId) {
        return;
      }
      if (!rawTaskRowsById[rawTaskId]) {
        rawTaskRowsById[rawTaskId] = [];
      }
      rawTaskRowsById[rawTaskId].push(
        WorkOsConfig.DATA_START_ROW + index
      );
    });
    rows.forEach(function (row, index) {
      var physicalRow = WorkOsConfig.DATA_START_ROW + index;
      var rawTaskId = String(row[map.task_id] || '').trim();
      var rawOriginKey = String(row[map.origin_key] || '').trim();
      var hintedRecord = ledgerContext.by_physical_row[physicalRow] || null;
      /*
       * A blank row with a previously committed ledger hint is a deletion
       * candidate, not a RESTORABLE live row. Leave it for the ledger-oriented
       * orphan pass below. A first-insert PREPARED record is the only blank-row
       * exception because it has an explicit rollback state machine.
       */
      if (!rawTaskId && !rawOriginKey &&
          !(hintedRecord &&
            String(hintedRecord.transaction_state || '') === 'PREPARED')) {
        return;
      }
      var validation = validateAuthority(row, {
        sheet: taskSheet,
        physical_row: physicalRow,
        schema: schema,
        column_map: map,
        ledger_context: ledgerContext,
        mode: settings.mode || 'DIAGNOSTIC'
      });
      if (validation.status === 'EMPTY') {
        return;
      }
      if (validation.status === 'PREPARED_RECOVERABLE' &&
          settings.recover_prepared === true) {
        validation = recoverPreparedAuthority(taskSheet, physicalRow, {
          schema: schema,
          column_map: map,
          raw_row: row,
          ledger_context: ledgerContext
        });
      }
      if (validation.status === 'RELOCATABLE' &&
          settings.recover_relocated === true) {
        rebindRelocatedAuthorityRecord(
          ledgerContext,
          validation.record,
          physicalRow
        );
        validation = validateAuthority(row, {
          sheet: taskSheet,
          physical_row: physicalRow,
          schema: schema,
          column_map: map,
          ledger_context: ledgerContext,
          mode: settings.mode || 'DIAGNOSTIC'
        });
      }
      if ((validation.status === 'QUARANTINED' ||
           validation.status === 'UNRECOVERABLE') &&
          settings.quarantine_invalid === true) {
        validation = quarantineAuthorityRow(
          taskSheet,
          physicalRow,
          row,
          validation.code,
          {
            schema: schema,
            column_map: map,
            ledger_context: ledgerContext,
            unrecoverable: validation.status === 'UNRECOVERABLE'
          }
        );
      }
      results.push({
        row: physicalRow,
        task_id: String(row[map.task_id] || ''),
        status: validation.status,
        code: validation.code || ''
      });
    });
    var orphanReconciliation = reconcileMissingAuthorityRecords(
      taskSheet,
      ledgerContext,
      rawTaskRowsById,
      settings
    );
    orphanReconciliation.rows.forEach(function (item) {
      results.push(item);
    });
    mutations.orphaned += Number(
      orphanReconciliation.mutations.orphaned || 0
    );
    var counts = {};
    results.forEach(function (item) {
      counts[item.status] = Number(counts[item.status] || 0) + 1;
    });
    return { rows: results, counts: counts, mutations: mutations };
  }

  function parseSchema25LegacyAuthorityNote(noteText) {
    var text = String(noteText || '');
    if (text.indexOf(SNAPSHOT_MIRROR_PREFIX) !== 0) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_LEGACY_NOTE_MISSING',
        'MIGRATION_25_TO_26',
        false,
        'Schema 2.5 authority note is required; the editable snapshot cell is not a fallback.'
      );
    }
    var snapshot;
    try {
      snapshot = JSON.parse(text.slice(SNAPSHOT_MIRROR_PREFIX.length));
    } catch (error) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_LEGACY_NOTE_INVALID',
        'MIGRATION_25_TO_26',
        false,
        'Schema 2.5 authority note cannot be parsed.'
      );
    }
    var currentIds = WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS);
    var legacyIds = currentIds.slice(0, -3);
    var expectedFields = legacyIds.filter(function (id) {
      return id !== SNAPSHOT_FIELD;
    }).sort();
    if (!isPlainObject(snapshot) ||
        snapshot.format !== 'FULL_ROW_V1' ||
        snapshot.schema_version !== '2.5' ||
        !isPlainObject(snapshot.values) ||
        String(snapshot.task_id || '') !== String(snapshot.values.task_id || '') ||
        JSON.stringify(Object.keys(snapshot.values).sort()) !==
          JSON.stringify(expectedFields)) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_LEGACY_NOTE_INVALID',
        'MIGRATION_25_TO_26',
        false,
        'Schema 2.5 authority note is not a complete canonical snapshot.'
      );
    }
    return snapshot;
  }

  /**
   * Build a Schema 2.6 candidate only from the independently stored Schema
   * 2.5 note anchor.  The live row is compared, never used as a baseline.
   */
  function prepareSchema25AuthorityCandidate(sourceRow, noteText) {
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    var currentIds = WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS);
    var legacyIds = currentIds.slice(0, -3);
    if (!Array.isArray(sourceRow) || sourceRow.length !== legacyIds.length) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_LEGACY_SCHEMA',
        'MIGRATION_25_TO_26',
        false,
        'Schema 2.5 Task row does not have the expected physical width.'
      );
    }
    var legacyMap = WorkOsSchemas.buildColumnMapFromIds(legacyIds);
    var currentMap = WorkOsSchemas.buildColumnMapFromIds(currentIds);
    var snapshot = parseSchema25LegacyAuthorityNote(noteText);
    if (String(sourceRow[legacyMap.task_id] || '') !==
        String(snapshot.task_id || '')) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_LEGACY_ID_MISMATCH',
        'MIGRATION_25_TO_26',
        false,
        'Schema 2.5 Task identity does not match the legacy authority note.'
      );
    }
    legacyIds.forEach(function (field) {
      if (field === SNAPSHOT_FIELD) {
        return;
      }
      var canonical = valueForCell(
        schema[currentMap[field]],
        snapshot.values[field]
      );
      if (!cellsEqual(sourceRow[legacyMap[field]], canonical)) {
        throw new WorkOsAppError(
          'E_TASK_AUTHORITY_LEGACY_LIVE_DRIFT',
          'MIGRATION_25_TO_26',
          false,
          'Schema 2.5 live Task values do not match the legacy authority note.'
        );
      }
    });
    var output = sourceRow.concat([0, '', '']);
    output[currentMap[SNAPSHOT_FIELD]] = '';
    output[currentMap[AUTHORITY_GENERATION_FIELD]] = 0;
    output[currentMap[AUTHORITY_HASH_FIELD]] = '';
    output[currentMap[AUTHORITY_STATE_FIELD]] = '';
    output = attachAuthoritativeSnapshot(output, schema, currentMap);
    validateCandidateRow(output, schema, 'MIGRATION_25_TO_26');
    return output;
  }

  function authoritativeRowFromSnapshot(row, schema, columnMap) {
    // Kept only as a fail-closed compatibility boundary for pre-2.6 callers.
    // An editable Task cell is an observable projection, never authority.
    throw new WorkOsAppError(
      'E_TASK_AUTHORITY_SNAPSHOT_FALLBACK_FORBIDDEN',
      'TASK_AUTHORITY',
      false,
      'Editable Task snapshot cells cannot be used as an authority fallback.'
    );
  }

  function trustedSnapshotForRow(
    row,
    schema,
    columnMap,
    sheet,
    physicalRow
  ) {
    var validation = validateAuthority(row, {
      sheet: sheet,
      physical_row: physicalRow,
      schema: schema,
      column_map: columnMap,
      mode: 'RESTORE'
    });
    if (validation.status === 'PREPARED_RECOVERABLE') {
      validation = recoverPreparedAuthority(sheet, physicalRow, {
        schema: schema,
        column_map: columnMap,
        raw_row: row,
        ledger_context: validation.ledger_context
      });
    }
    if (validation.status !== 'VALID' &&
        validation.status !== 'RESTORABLE' &&
        validation.status !== 'RELOCATABLE') {
      throw new WorkOsAppError(
        validation.code || 'E_TASK_AUTHORITY_MISSING',
        'TASK_AUTHORITY',
        false,
        'Task authority is unavailable; snapshot cells and notes are not fallbacks.'
      );
    }
    return validation.committed_slot.snapshot;
  }

  function authoritativeRowFromTrustedState(
    row,
    schema,
    columnMap,
    sheet,
    physicalRow
  ) {
    var validation = validateAuthority(row, {
      sheet: sheet,
      physical_row: physicalRow,
      schema: schema,
      column_map: columnMap,
      mode: 'RESTORE'
    });
    if (validation.status === 'PREPARED_RECOVERABLE') {
      validation = recoverPreparedAuthority(sheet, physicalRow, {
        schema: schema,
        column_map: columnMap,
        raw_row: row,
        ledger_context: validation.ledger_context
      });
    }
    if (validation.status !== 'VALID' &&
        validation.status !== 'RESTORABLE' &&
        validation.status !== 'RELOCATABLE') {
      throw new WorkOsAppError(
        validation.code || 'E_TASK_AUTHORITY_MISSING',
        'TASK_AUTHORITY',
        false,
        'Task authority is unavailable; no editable snapshot fallback is allowed.'
      );
    }
    return validation.authoritative_row;
  }

  function syncAuthoritativeMirror(
    sheet,
    physicalRow,
    row,
    schema,
    columnMap
  ) {
    // Deprecated in Schema 2.6. Notes are no longer an authority write
    // boundary; the hidden two-slot ledger is committed around the single
    // Task-row write. This compatibility stub performs no Sheet mutation.
    return {
      deprecated: true,
      authority_source: AUTHORITY_LEDGER_SHEET,
      row: Number(physicalRow || 0)
    };
  }

  function migrateLegacyRowToSnapshot(sourceRow) {
    throw new WorkOsAppError(
      'E_TASK_AUTHORITY_LEGACY_SCHEMA_UNSUPPORTED',
      'MIGRATION_25_TO_26',
      false,
      'Schema 2.3 live rows cannot be promoted to authority without independent evidence.'
    );
  }

  function taskIdentity(task) {
    return {
      task_id: String(task.task_id || ''),
      origin_key: String(task.origin_key || ''),
      stable_thread_key: String(task.stable_thread_key || ''),
      source_message_id: String(task.source_message_id || ''),
      source_thread_id: String(task.source_thread_id || '')
    };
  }

  function initializeMigratedBusinessGuard(row, schema, map) {
    var output = row.slice();
    var task = directTaskFromRow(output, schema);
    var businessVersion = 1;
    if (task.needs_review === true &&
        task.review_state === 'OPEN' &&
        task.review_type === 'EXISTING_CHANGE' &&
        task.pending_action_type &&
        isPlainObject(task.pending_changes_json) &&
        isPlainObject(task.pending_changes_json.changes)) {
      var pending = sanitizeStructuredValue(task.pending_changes_json);
      pending.expected_target_business_version = 1;
      pending.target_identity = taskIdentity(task);
      output[map.pending_changes_json] = valueForCell(
        schema[map.pending_changes_json],
        pending
      );
      businessVersion = 2;
    }
    output[map.business_version] = businessVersion;
    output[map.calendar_reconcile_required] = false;
    output[map.calendar_intent_version] = 0;
    return output;
  }

  function migrateSchema24RowTo25(sourceRow) {
    throw new WorkOsAppError(
      'E_TASK_AUTHORITY_LEGACY_SCHEMA_UNSUPPORTED',
      'MIGRATION_25_TO_26',
      false,
      'Schema 2.4 snapshot cells cannot be promoted to authority without independent evidence.'
    );
  }

  function assertCurrentAuthoritativeRow(row) {
    throw new WorkOsAppError(
      'E_TASK_AUTHORITY_SNAPSHOT_FALLBACK_FORBIDDEN',
      'MIGRATION_25_TO_26',
      false,
      'Schema 2.6 accepts only the independent Schema 2.5 authority note anchor.'
    );
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
    var context = applyAuthorityValidatedIndexes(buildContextFromValues(
      sheet,
      WorkOsSchemas.buildColumnMapFromIds(ids),
      values
    ));
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
    var expectedDecisionInputs = context._workOsDecisionInputByRow || {};
    var hasExpectedDecisionInput = Object.prototype.hasOwnProperty.call(
      expectedDecisionInputs,
      physicalRow
    );
    var decisionIndex = context.columnMap.decision;
    var rawDifferenceIndexes = [];
    schema.forEach(function (_item, index) {
      if (!cellsEqual(cached[index], current[index])) {
        rawDifferenceIndexes.push(index);
      }
    });
    var controlledDecisionDrift = hasExpectedDecisionInput &&
      rawDifferenceIndexes.length === 1 &&
      rawDifferenceIndexes[0] === decisionIndex &&
      cellsEqual(current[decisionIndex],
        expectedDecisionInputs[physicalRow]);
    if (!rowsEqual(cached, current) && !controlledDecisionDrift) {
      throw new WorkOsAppError(
        'E_TASK_CONFLICT',
        'TASK_REPOSITORY',
        true,
        'Taskが他の操作で変更されたため書込みを停止しました。'
      );
    }
    var trustedCurrent = authoritativeRowFromTrustedState(
      current,
      schema,
      context.columnMap,
      context.sheet,
      physicalRow
    );
    if (!rowsEqual(current, trustedCurrent)) {
      var authorityDriftFields = schema.filter(function (item, index) {
        return !cellsEqual(current[index], trustedCurrent[index]);
      }).map(function (item) {
        return item.id;
      });
      if (!controlledDecisionDrift ||
          authorityDriftFields.length !== 1 ||
          authorityDriftFields[0] !== 'decision') {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_DRIFT',
        'TASK_REPOSITORY',
        false,
        'Task rowがtrusted authoritative stateと一致しません: ' +
          authorityDriftFields.join(',')
      );
      }
    }
    var baseRow = controlledDecisionDrift ? trustedCurrent : current;
    var updated = baseRow.slice();
    var changedFields = [];
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
        changedFields.push(field);
      }
    });
    if (!changedFields.length) {
      return { operation: 'NOOP', row: physicalRow, changed_fields: [] };
    }
    var versionIndex = context.columnMap.row_version;
    var updatedAtIndex = context.columnMap.updated_at;
    var businessVersionIndex = context.columnMap.business_version;
    var intentRequiredIndex =
      context.columnMap.calendar_reconcile_required;
    var intentVersionIndex = context.columnMap.calendar_intent_version;
    var businessChanged = changedFields.some(function (field) {
      return BUSINESS_GUARD_FIELDS[field] === true;
    });
    var calendarReconcileChanged = changedFields.some(function (field) {
      return CALENDAR_RECONCILE_FIELDS[field] === true;
    });
    if (businessChanged) {
      updated[businessVersionIndex] =
        Number(baseRow[businessVersionIndex] || 0) + 1;
      changedFields.push('business_version');
    }
    if (calendarReconcileChanged) {
      updated[intentRequiredIndex] = true;
      updated[intentVersionIndex] =
        Number(baseRow[intentVersionIndex] || 0) + 1;
      changedFields.push(
        'calendar_reconcile_required',
        'calendar_intent_version'
      );
    }
    updated[versionIndex] = Number(baseRow[versionIndex] || 0) + 1;
    updated[updatedAtIndex] = nowValue || WorkOsUtilities.now();
    updated = attachAuthoritativeSnapshot(
      updated,
      schema,
      context.columnMap
    );
    var previousTask = directTaskFromRow(baseRow, schema);
    var candidateTask = validateCandidateRow(
      updated,
      schema,
      'TASK_REPOSITORY'
    );
    var authorityCommit = commitAuthorityRow(
      context.sheet,
      physicalRow,
      updated,
      {
        schema: schema,
        column_map: context.columnMap,
        mode: 'TASK_PATCH',
        allow_raw_drift: controlledDecisionDrift
      }
    );
    syncReviewNote(
      context.sheet,
      physicalRow,
      candidateTask,
      previousTask
    );
    context.values[physicalRow - WorkOsConfig.DATA_START_ROW] =
      authorityCommit.output_row;
    return {
      operation: 'UPDATE',
      row: physicalRow,
      changed_fields: changedFields.concat([
        'row_version',
        'updated_at',
        AUTHORITY_GENERATION_FIELD,
        AUTHORITY_HASH_FIELD
      ])
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
    payload.expected_target_business_version =
      Number(current.business_version);
    payload.target_identity = {
      task_id: String(current.task_id || ''),
      origin_key: String(current.origin_key || ''),
      stable_thread_key: String(current.stable_thread_key || ''),
      source_message_id: String(current.source_message_id || ''),
      source_thread_id: String(current.source_thread_id || '')
    };
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
        payload.expected_target_business_version =
          existingPayload.expected_target_business_version;
        payload.target_identity = existingPayload.target_identity;
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
    pending.expected_target_business_version =
      Number(task.business_version);
    pending.target_identity = {
      task_id: String(task.task_id || ''),
      origin_key: String(task.origin_key || ''),
      stable_thread_key: String(task.stable_thread_key || ''),
      source_message_id: String(task.source_message_id || ''),
      source_thread_id: String(task.source_thread_id || '')
    };
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

  function restagePendingChangeAtRow(options) {
    var settings = options || {};
    var sheet = settings.sheet || SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(WorkOsConfig.SHEETS.TASKS);
    var physicalRow = Number(settings.physicalRow);
    if (!Number.isInteger(physicalRow) ||
        physicalRow < WorkOsConfig.DATA_START_ROW) {
      throw new WorkOsAppError(
        'REVIEW_RESTAGE_SELECTION',
        'TASK_REVIEW',
        false,
        'Review再stage対象はTaskの1行だけです。'
      );
    }
    return withLockedContext(sheet, function (context) {
      var task = readTaskAtRow(context, physicalRow);
      if (!task ||
          (settings.expectedTaskId &&
           String(settings.expectedTaskId) !== String(task.task_id)) ||
          (settings.expectedBusinessVersion != null &&
           Number(settings.expectedBusinessVersion) !==
             Number(task.business_version))) {
        throw new WorkOsAppError(
          'REVIEW_RESTAGE_CONFLICT',
          'TASK_REVIEW',
          false,
          'Review対象が変更されたため再stageを停止しました。'
        );
      }
      return restagePendingChangeUnlocked(
        task.task_id,
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
    var raw = context.sheet.getRange(
      physicalRow,
      1,
      1,
      schema.length
    ).getValues()[0];
    var restored = restoreAuthorityRow(context.sheet, physicalRow, raw, {
      schema: schema,
      column_map: context.columnMap,
      mode: 'REVIEW_DECISION_REVERT'
    });
    if (restored.status !== 'RESTORED') {
      throw new WorkOsAppError(
        restored.code || 'E_TASK_AUTHORITY_QUARANTINED',
        'TASK_AUTHORITY',
        false,
        'Review decision could not be reverted because authority is invalid.'
      );
    }
    context.values[physicalRow - WorkOsConfig.DATA_START_ROW] =
      restored.authoritative_row;
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
      return PENDING_BUSINESS_CHANGE_FIELDS[field] === true;
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
    var expectedTargetBusinessVersion = Number(
      pending.expected_target_business_version
    );
    if (!targetTaskId ||
        targetTaskId === reviewTask.task_id ||
        !targetRow ||
        !Number.isInteger(expectedTargetVersion) ||
        expectedTargetVersion < 1 ||
        !Number.isInteger(expectedTargetBusinessVersion) ||
        expectedTargetBusinessVersion < 1 ||
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
    if (!targetIdentityMatches(target, pending.target_identity)) {
      return rejectedReviewResult(
        context,
        reviewRow,
        reviewTask,
        'REVIEW_TARGET_CONFLICT',
        '対象Task identityが変更されたため受入を拒否しました。'
      );
    }
    var checkpoint = String(pending.application_checkpoint || '');
    var targetMatches = changesMatchTask(
      context,
      targetRow,
      pending.changes
    );
    var targetAlreadyApplied = checkpoint === 'TARGET_APPLYING' &&
      target.business_version === expectedTargetBusinessVersion + 1 &&
      targetMatches;
    if (!targetAlreadyApplied &&
        (target.business_version !== expectedTargetBusinessVersion ||
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

  function targetIdentityMatches(task, identity) {
    if (!isPlainObject(identity)) {
      return false;
    }
    return [
      'task_id',
      'origin_key',
      'stable_thread_key',
      'source_message_id',
      'source_thread_id'
    ].every(function (field) {
      return String(identity[field] || '') === String(task[field] || '');
    });
  }

  function sameRowReviewConflicts(task, pending) {
    var conflicts = [];
    var expectedBusinessVersion = Number(
      pending.expected_target_business_version
    );
    if (!Number.isInteger(expectedBusinessVersion) ||
        expectedBusinessVersion < 1 ||
        Number(task.business_version) !==
          expectedBusinessVersion + 1) {
      conflicts.push('business_version');
    }
    if (String(pending.target_task_id || '') !== String(task.task_id || '') ||
        pending.target_resolution !== 'RESOLVED' ||
        !targetIdentityMatches(task, pending.target_identity)) {
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
        pending.target_task_id === task.task_id &&
        Number.isInteger(Number(
          pending.expected_target_business_version
        )) &&
        Number(pending.expected_target_business_version) >= 1 &&
        targetIdentityMatches(task, pending.target_identity);
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
    var map = WorkOsSchemas.buildColumnMapFromIds(
      WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS)
    );
    var ledgerContext = readAuthorityLedgerContext(sheet);
    var results = [];
    ordered.forEach(function (plan) {
      var raw = sheet.getRange(
        plan.row,
        1,
        1,
        schema.length
      ).getValues()[0];
      if (plan.authority_invalid === true) {
        results.push(quarantineAuthorityRow(
          sheet,
          plan.row,
          raw,
          plan.authority_error_code || 'E_TASK_AUTHORITY_INVALID',
          {
            schema: schema,
            column_map: map,
            ledger_context: ledgerContext,
            unrecoverable: plan.authority_unrecoverable === true
          }
        ));
        return;
      }
      var validation = validateAuthority(raw, {
        sheet: sheet,
        physical_row: plan.row,
        schema: schema,
        column_map: map,
        ledger_context: ledgerContext,
        mode: plan.mode || 'EDIT_PLAN'
      });
      if (validation.status === 'EMPTY') {
        var blankOutput = plan.output_row || new Array(schema.length).fill('');
        sheet.getRange(plan.row, 1, 1, schema.length).setValues([blankOutput]);
        results.push(authorityValidationResult('RESTORED', '', null, {
          authoritative_row: blankOutput
        }));
        return;
      }
      if (validation.status !== 'VALID' &&
          validation.status !== 'RESTORABLE' &&
          validation.status !== 'PREPARED_RECOVERABLE' &&
          validation.status !== 'RELOCATABLE') {
        results.push(quarantineAuthorityRow(
          sheet,
          plan.row,
          raw,
          validation.code || 'E_TASK_AUTHORITY_INVALID',
          {
            schema: schema,
            column_map: map,
            ledger_context: ledgerContext,
            unrecoverable: validation.status === 'UNRECOVERABLE'
          }
        ));
        return;
      }
      var target = plan.output_row || validation.authoritative_row;
      var differsFromCommitted = validation.authoritative_row &&
        !rowsEqual(target, validation.authoritative_row);
      if (differsFromCommitted) {
        var committed = commitAuthorityRow(sheet, plan.row, target, {
          schema: schema,
          column_map: map,
          ledger_context: ledgerContext,
          mode: plan.mode || 'EDIT_PLAN',
          allow_raw_drift: true
        });
        plan.output_row = committed.output_row;
        results.push(authorityValidationResult('COMMITTED', '', null, {
          authoritative_row: committed.output_row
        }));
      } else {
        var restored = restoreAuthorityRow(sheet, plan.row, raw, {
          schema: schema,
          column_map: map,
          ledger_context: ledgerContext,
          mode: plan.mode || 'EDIT_PLAN'
        });
        plan.output_row = restored.authoritative_row || target;
        results.push(restored);
      }
    });
    return results;
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
      var ledgerContext = readAuthorityLedgerContext(sheet);
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
          if (Object.prototype.hasOwnProperty.call(map, fieldId)) {
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
        var validation = validateAuthority(raw, {
          sheet: sheet,
          physical_row: row,
          schema: schema,
          column_map: map,
          ledger_context: ledgerContext,
          mode: 'EDIT_RESTORE'
        });
        if (validation.status === 'EMPTY') {
          var cleared = raw.slice();
          Object.keys(byRow[row].column_ids).forEach(function (fieldId) {
            cleared[map[fieldId]] = '';
          });
          var wasBlankBeforeEvent = cleared.every(function (value) {
            return WorkOsUtilities.isBlank(value);
          });
          return wasBlankBeforeEvent
            ? { row: row, output_row: new Array(schema.length).fill('') }
            : {
              row: row,
              output_row: raw,
              authority_invalid: true,
              authority_error_code: 'E_TASK_AUTHORITY_MISSING'
            };
        }
        if (validation.status === 'VALID' ||
            validation.status === 'RESTORABLE' ||
            validation.status === 'PREPARED_RECOVERABLE' ||
            validation.status === 'RELOCATABLE') {
          return {
            row: row,
            output_row: validation.authoritative_row || raw,
            mode: 'EDIT_RESTORE'
          };
        }
        return {
          row: row,
          output_row: raw,
          authority_invalid: true,
          authority_unrecoverable: validation.status === 'UNRECOVERABLE',
          authority_error_code: validation.code || 'E_TASK_AUTHORITY_INVALID'
        };
      }).sort(function (left, right) {
        return left.row - right.row;
      });
      // Every row is classified independently. A corrupt authority record is
      // quarantined, while every valid peer is restored from its own committed
      // ledger slot; no peer raw edit is left behind.
      var results = writeRowPlans(sheet, plans, schema);
      return {
        restored_count: results.filter(function (result) {
          return result.status === 'RESTORED' || result.status === 'COMMITTED';
        }).length,
        quarantined_count: results.filter(function (result) {
          return result.status === 'QUARANTINED' ||
            result.status === 'UNRECOVERABLE';
        }).length,
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
    var authoritative = authoritativeRowFromTrustedState(
      rawRow,
      schema,
      map,
      lockedContext.sheet,
      rowNumber
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
    var businessVersionIndex = map.business_version;
    var intentRequiredIndex = map.calendar_reconcile_required;
    var intentVersionIndex = map.calendar_intent_version;
    candidateRow[businessVersionIndex] =
      Number(authoritative[businessVersionIndex] || 0) + 1;
    normalizedFields.push('business_version');
    if (normalizedFields.some(function (field) {
      return CALENDAR_RECONCILE_FIELDS[field] === true;
    })) {
      candidateRow[intentRequiredIndex] = true;
      candidateRow[intentVersionIndex] =
        Number(authoritative[intentVersionIndex] || 0) + 1;
      normalizedFields.push(
        'calendar_reconcile_required',
        'calendar_intent_version'
      );
    }
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
      var decisionInputValues = {};
      if (containsDecision) {
        var canonicalMap = WorkOsSchemas.buildColumnMapFromIds(
          WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS)
        );
        normalizedRowEdits.forEach(function (edit) {
          if ((edit.column_ids || []).indexOf('decision') === -1) {
            return;
          }
          decisionInputValues[Number(edit.row)] = sheet.getRange(
            Number(edit.row),
            canonicalMap.decision + 1,
            1,
            1
          ).getValues()[0][0];
        });
      }
      var lockedContext = containsDecision
        ? createDecisionEditContextForHeldLock(sheet, selectedRows)
        : createScopedContextForHeldLock(sheet, selectedRows, lock);
      if (containsDecision) {
        Object.defineProperty(lockedContext, '_workOsDecisionInputByRow', {
          value: decisionInputValues,
          enumerable: false,
          writable: false,
          configurable: true
        });
      }
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
            var authoritative;
            try {
              authoritative = authoritativeRowFromTrustedState(
                rawRow,
                schema,
                map,
                sheet,
                rowNumber
              );
            } catch (authorityError) {
              decisionPlans.push({
                row: rowNumber,
                task_id: '',
                output_row: rawRow,
                authority_invalid: true,
                authority_error_code: authorityError.code ||
                  'E_TASK_AUTHORITY_INVALID',
                authority_unrecoverable: /UNRECOVERABLE|DUPLICATE/.test(
                  String(authorityError.code || '')
                ),
                error: authorityError
              });
              decisionError = decisionError || authorityError;
              return;
            }
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
                decisionInputValues[rowNumber]
              );
            } catch (error) {
              plan.error = error;
              decisionError = decisionError || error;
            }
            decisionPlans.push(plan);
          });
          if (decisionError) {
            writeRowPlans(sheet, decisionPlans, schema);
            decisionPlans.forEach(function (plan) {
              if (plan.authoritative_row) {
                lockedContext.values[
                  plan.row - WorkOsConfig.DATA_START_ROW
                ] = plan.authoritative_row;
              }
            });
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
            try {
              var authoritative = authoritativeRowFromTrustedState(
                rawRow,
                schema,
                lockedContext.columnMap,
                sheet,
                rowNumber
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
            } catch (authorityError) {
              plans.push({
                row: rowNumber,
                task_id: '',
                output_row: rawRow,
                authority_invalid: true,
                authority_error_code: authorityError.code ||
                  'E_TASK_AUTHORITY_INVALID',
                authority_unrecoverable: /UNRECOVERABLE|DUPLICATE/.test(
                  String(authorityError.code || '')
                ),
                error: authorityError
              });
            }
          }
        });
        if (firstError) {
          plans.forEach(function (plan) {
            if (plan.authoritative_row) {
              plan.output_row = plan.authoritative_row;
            }
          });
          writeRowPlans(sheet, plans, schema);
          plans.forEach(function (plan) {
            if (plan.authoritative_row) {
              lockedContext.values[
                plan.row - WorkOsConfig.DATA_START_ROW
              ] = plan.authoritative_row;
            }
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
    var trustedExisting = authoritativeRowFromTrustedState(
      existing,
      schema,
      context.columnMap,
      context.sheet,
      physicalRow
    );
    if (!rowsEqual(existing, trustedExisting)) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_DRIFT',
        'TASK_REPOSITORY',
        false,
        'Task rowがtrusted authoritative stateと一致しません。'
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
    updated = attachAuthoritativeSnapshot(
      updated,
      schema,
      context.columnMap
    );
    validateCandidateRow(
      updated,
      schema,
      'TASK_REPOSITORY'
    );
    var authorityCommit = commitAuthorityRow(
      context.sheet,
      physicalRow,
      updated,
      {
        schema: schema,
        column_map: context.columnMap,
        mode: 'TASK_UPSERT'
      }
    );
    context.values[physicalRow - WorkOsConfig.DATA_START_ROW] =
      authorityCommit.output_row;
    changedFields.push(
      'row_version',
      'updated_at',
      AUTHORITY_GENERATION_FIELD,
      AUTHORITY_HASH_FIELD
    );
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
      WorkOsConfig.DATA_START_ROW,
      context.blockedPhysicalRows
    );
    var rowsAdded = ensureCapacityForRow(context.sheet, physicalRow);
    while (context.values.length < physicalRow - WorkOsConfig.DATA_START_ROW + 1) {
      context.values.push(new Array(WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS).length).fill(''));
      context.taskIdValues.push(['']);
      context.originKeyValues.push(['']);
    }
    var output = makeRow(prepared);
    var authorityCommit = commitAuthorityRow(
      context.sheet,
      physicalRow,
      output,
      {
        schema: WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS),
        column_map: context.columnMap,
        mode: 'TASK_INSERT'
      }
    );
    output = authorityCommit.output_row;
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

  function authoritativeRowForOperationalRead(
    context,
    physicalRow,
    authorityLedgerContext
  ) {
    var row = rowForPhysicalRow(context, physicalRow);
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    var validation = validateAuthority(row, {
      sheet: context.sheet,
      physical_row: physicalRow,
      schema: schema,
      column_map: context.columnMap,
      ledger_context: authorityLedgerContext,
      mode: 'OPERATIONAL_READ'
    });
    if (validation.status === 'PREPARED_RECOVERABLE') {
      validation = recoverPreparedAuthority(context.sheet, physicalRow, {
        schema: schema,
        column_map: context.columnMap,
        raw_row: row,
        ledger_context: validation.ledger_context || authorityLedgerContext
      });
    }
    return validation.status === 'VALID' ||
      validation.status === 'RELOCATABLE'
      ? validation.authoritative_row
      : null;
  }

  function readTaskAtRow(context, physicalRow, authorityLedgerContext) {
    var row = authoritativeRowForOperationalRead(
      context,
      physicalRow,
      authorityLedgerContext
    );
    if (!row) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_EXCLUDED',
        'TASK_AUTHORITY',
        false,
        'Task is not operational because its authority is not committed and valid.'
      );
    }
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
    if (!row) {
      return null;
    }
    try {
      return readTaskAtRow(context, row);
    } catch (error) {
      return error && /^E_TASK_AUTHORITY_/.test(String(error.code || ''))
        ? null
        : (function () { throw error; }());
    }
  }

  function findByOriginKey(context, originKey) {
    var row = context.byOriginKey[String(originKey || '')];
    if (!row) {
      return null;
    }
    try {
      return readTaskAtRow(context, row);
    } catch (error) {
      return error && /^E_TASK_AUTHORITY_/.test(String(error.code || ''))
        ? null
        : (function () { throw error; }());
    }
  }

  function findByStableThreadKey(context, stableThreadKey) {
    var rows = context.byStableThreadKey[String(stableThreadKey || '')] || [];
    return rows.map(function (row) {
      try {
        return readTaskAtRow(context, row);
      } catch (error) {
        if (error && /^E_TASK_AUTHORITY_/.test(String(error.code || ''))) {
          return null;
        }
        throw error;
      }
    }).filter(function (task) { return task != null; });
  }

  function operationalTasks(context) {
    var authorityLedgerContext = readAuthorityLedgerContext(context.sheet);
    return (context.logicalRows || []).map(function (row) {
      try {
        return readTaskAtRow(context, row, authorityLedgerContext);
      } catch (error) {
        if (error && /^E_TASK_AUTHORITY_/.test(String(error.code || ''))) {
          return null;
        }
        throw error;
      }
    }).filter(function (task) { return task != null; });
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

  function acknowledgeCalendarIntent(
    taskId,
    expectedIntentVersion,
    syncStatus,
    context,
    nowValue
  ) {
    assertLockedContext(context);
    var normalizedTaskId = String(taskId || '');
    var physicalRow = context.byTaskId[normalizedTaskId];
    if (!physicalRow) {
      throw new WorkOsAppError(
        'E_TARGET_NOT_RESOLVED',
        'CALENDAR_INTENT',
        false,
        'Calendar intent対象Taskを解決できません。'
      );
    }
    var task = readTaskAtRow(context, physicalRow);
    var expected = Number(expectedIntentVersion);
    if (!Number.isInteger(expected) ||
        expected < 0 ||
        Number(task.calendar_intent_version) !== expected) {
      return {
        operation: 'STALE_INTENT',
        row: physicalRow,
        task_id: normalizedTaskId,
        current_intent_version: Number(task.calendar_intent_version)
      };
    }
    if (task.calendar_reconcile_required !== true) {
      return {
        operation: 'NOOP',
        row: physicalRow,
        task_id: normalizedTaskId,
        current_intent_version: expected
      };
    }
    var allowed = {
      calendar_reconcile_required: true,
      calendar_sync_status: true
    };
    var result = updateRowWithPatch(
      context,
      physicalRow,
      {
        calendar_reconcile_required: false,
        calendar_sync_status: String(syncStatus || 'NOT_REQUIRED')
      },
      allowed,
      nowValue
    );
    result.task_id = normalizedTaskId;
    result.acknowledged_intent_version = expected;
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
    migrateSchema24RowTo25: migrateSchema24RowTo25,
    assertCurrentAuthoritativeRow: assertCurrentAuthoritativeRow,
    validateAuthority: validateAuthority,
    validateAllTaskAuthorities: validateAllTaskAuthorities,
    reconcileMissingAuthorityRecords: reconcileMissingAuthorityRecords,
    recoverPreparedAuthority: recoverPreparedAuthority,
    quarantineAuthorityRow: quarantineAuthorityRow,
    restoreAuthorityRow: restoreAuthorityRow,
    commitAuthorityRow: commitAuthorityRow,
    prepareSchema25AuthorityCandidate: prepareSchema25AuthorityCandidate,
    operationalTasks: operationalTasks,
    syncAuthoritativeMirror: syncAuthoritativeMirror,
    applyCalendarPatch: applyCalendarPatch,
    acknowledgeCalendarIntent: acknowledgeCalendarIntent,
    stagePendingChange: stagePendingChange,
    restagePendingChange: restagePendingChange,
    restagePendingChangeAtRow: restagePendingChangeAtRow,
    applyReviewDecision: applyReviewDecision,
    applyUserEdits: applyUserEdits,
    restoreUserEditRows: restoreUserEditRows,
    upsertPhase1MockTask: upsertPhase1MockTask
  });
}());
