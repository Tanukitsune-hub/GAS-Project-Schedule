/**
 * @typedef {Object} WorkOsTask
 * @property {string=} task_id
 * @property {string} origin_key
 * @property {string} task_title
 * @property {string=} status
 * @property {boolean=} needs_review
 * @property {number=} row_version
 */

/**
 * @typedef {Object} WorkOsDiagnosticCheck
 * @property {string} id
 * @property {'PASS'|'WARN'|'FAIL'|'NOT_YET_IMPLEMENTED'} status
 * @property {string} safe_message
 */

var WorkOsSchemas = (function () {
  function column(id, header, type, options) {
    var result = {
      id: id,
      header: header,
      type: type,
      editable: false,
      visible: true,
      validation: null,
      enumName: null,
      allowedValues: null
    };
    Object.keys(options || {}).forEach(function (key) {
      result[key] = options[key];
    });
    return Object.freeze(result);
  }

  var taskColumns = [
    column('needs_review', '要確認', 'Boolean', { validation: 'CHECKBOX' }),
    column('decision', '判断', 'Enum', { editable: true, validation: 'ENUM', enumName: 'Decision' }),
    column('status', '対応状況', 'Enum', { editable: true, validation: 'ENUM', enumName: 'TaskStatus' }),
    column('completed', '完了', 'Boolean', { editable: true, validation: 'CHECKBOX' }),
    column('excluded', '対象外', 'Boolean', { editable: true, validation: 'CHECKBOX' }),
    column('task_title', 'タスク内容', 'String', { editable: true, maxLength: 300 }),
    column('due_date', '期限', 'Date', { editable: true }),
    column('suggested_due_date', '推奨期限', 'Date'),
    column('deadline_basis', '期限根拠', 'Enum', { validation: 'ENUM', enumName: 'DeadlineBasis' }),
    column('priority', '優先度', 'Enum', { editable: true, validation: 'ENUM', enumName: 'Priority' }),
    column('waiting_for_reply', '返信待ち', 'Boolean', { editable: true, validation: 'CHECKBOX' }),
    column('calendar_sync_mode', 'Calendar登録', 'Enum', { editable: true, validation: 'ENUM', enumName: 'CalendarSyncMode' }),
    column('comment', 'コメント', 'String', { editable: true, maxLength: 2000 }),
    column('sender', '送信者', 'String'),
    column('subject', '件名', 'String'),
    column('received_at', '受信日時', 'DateTime'),
    column('source_email', '元メール', 'URL'),
    column('review_state', '確認状態', 'Enum', { validation: 'ENUM', enumName: 'ReviewState' }),
    column('review_type', '確認種別', 'String'),
    column('task_id', 'task_id', 'String', { visible: false, protected: true }),
    column('origin_key', 'origin_key', 'String', { visible: false, protected: true }),
    column('source_message_id', 'source_message_id', 'String', { visible: false, protected: true }),
    column('source_thread_id', 'source_thread_id', 'String', { visible: false, protected: true }),
    column('stable_thread_key', 'stable_thread_key', 'String', { visible: false, protected: true }),
    column('source_action_index', 'source_action_index', 'Integer', { visible: false, protected: true }),
    column('ai_action_type', 'ai_action_type', 'Enum', {
      visible: false,
      protected: true,
      validation: 'ENUM',
      allowedValues: [
        'NEW_TASK',
        'ADD_TASK',
        'UPDATE_DUE',
        'CANCEL_TASK',
        'MARK_COMPLETE',
        'SET_WAITING',
        'CLEAR_WAITING',
        'INFORMATION_ONLY',
        'UNCLEAR'
      ]
    }),
    column('ai_reason', 'ai_reason', 'String', { visible: false, protected: true, maxLength: 1000 }),
    column('ai_confidence', 'ai_confidence', 'Number', { visible: false, protected: true, min: 0, max: 1 }),
    column('ai_provider', 'ai_provider', 'String', { visible: false, protected: true }),
    column('ai_model', 'ai_model', 'String', { visible: false, protected: true }),
    column('ai_prompt_version', 'ai_prompt_version', 'String', { visible: false, protected: true }),
    column('calendar_category', 'calendar_category', 'Enum', {
      visible: false,
      protected: true,
      validation: 'ENUM',
      allowedValues: [
        'EXTERNAL_SUBMISSION',
        'FINAL_MATERIAL',
        'CONTRACT_APPLICATION',
        'BID',
        'LEGAL_TAX_REGULATORY',
        'OTHER_HIGH_IMPACT',
        'NONE'
      ]
    }),
    column('calendar_importance', 'calendar_importance', 'Enum', {
      visible: false,
      protected: true,
      validation: 'ENUM',
      allowedValues: ['LOW', 'MEDIUM', 'HIGH']
    }),
    column('calendar_event_id', 'calendar_event_id', 'String', { visible: false, protected: true }),
    column('calendar_sync_status', 'calendar_sync_status', 'Enum', {
      visible: false,
      protected: true,
      validation: 'ENUM',
      allowedValues: ['NOT_REQUIRED', 'PENDING', 'SYNCED', 'DELETE_PENDING', 'ERROR']
    }),
    column('schedule_state', 'schedule_state', 'Enum', {
      visible: false,
      protected: true,
      validation: 'ENUM',
      allowedValues: ['NONE', 'FUTURE', 'UPCOMING', 'TODAY', 'OVERDUE']
    }),
    column('manual_fields', 'manual_fields', 'JsonArray', { visible: false, protected: true }),
    column('row_version', 'row_version', 'Integer', { visible: false, protected: true }),
    column('pending_action_type', 'pending_action_type', 'Enum', {
      visible: false,
      protected: true,
      validation: 'ENUM',
      allowedValues: [
        'NEW_TASK',
        'ADD_TASK',
        'UPDATE_DUE',
        'CANCEL_TASK',
        'MARK_COMPLETE',
        'SET_WAITING',
        'CLEAR_WAITING',
        'INFORMATION_ONLY',
        'UNCLEAR'
      ]
    }),
    column('pending_changes_json', 'pending_changes_json', 'JsonObject', { visible: false, protected: true }),
    column('created_at', 'created_at', 'DateTime', { visible: false, protected: true }),
    column('updated_at', 'updated_at', 'DateTime', { visible: false, protected: true }),
    column('last_calendar_sync_at', 'last_calendar_sync_at', 'DateTime', { visible: false, protected: true })
  ];

  var schemas = {};

  schemas[WorkOsConfig.SHEETS.DASHBOARD] = [
    column('metric_key', '項目', 'String'),
    column('metric_value', '値', 'String'),
    column('note', '注記', 'String')
  ];
  schemas[WorkOsConfig.SHEETS.TASKS] = taskColumns;
  schemas[WorkOsConfig.SHEETS.SETTINGS] = [
    column('setting_key', '設定キー', 'String', { protected: true }),
    column('display_name', '設定名', 'String', { protected: true }),
    column('value', '値', 'String', { editable: true }),
    column('value_type', '型', 'String', { protected: true }),
    column('allowed_values', '許容値', 'String', { protected: true }),
    column('description', '説明', 'String', { protected: true }),
    column('editable', '編集可', 'Boolean', { protected: true, validation: 'CHECKBOX' }),
    column('updated_at', '更新日時', 'DateTime', { protected: true })
  ];
  schemas[WorkOsConfig.SHEETS.RUN_HISTORY] = [
    column('run_id', '実行ID', 'String'),
    column('trigger_type', '起動種別', 'String'),
    column('mode', 'モード', 'String'),
    column('started_at', '開始日時', 'DateTime'),
    column('finished_at', '終了日時', 'DateTime'),
    column('duration_ms', '所要時間ms', 'Integer'),
    column('candidate_count', '候補数', 'Integer'),
    column('processed_count', '処理数', 'Integer'),
    column('created_task_count', '新規Task数', 'Integer'),
    column('updated_task_count', '更新Task数', 'Integer'),
    column('review_count', '要確認数', 'Integer'),
    column('skipped_count', 'スキップ数', 'Integer'),
    column('error_count', 'エラー数', 'Integer'),
    column('run_status', '実行状態', 'String'),
    column('note', '注記', 'String')
  ];
  schemas[WorkOsConfig.SHEETS.ERRORS] = [
    column('error_id', 'エラーID', 'String'),
    column('status', '状態', 'String'),
    column('retry_requested', '再実行', 'Boolean', { editable: true, validation: 'CHECKBOX' }),
    column('stage', '処理段階', 'String'),
    column('error_code', 'エラーコード', 'String'),
    column('error_summary', '概要', 'String'),
    column('source_message_id', 'Message ID', 'String'),
    column('source_thread_id', 'Thread ID', 'String'),
    column('task_id', 'Task ID', 'String'),
    column('retry_count', '再試行回数', 'Integer'),
    column('next_retry_at', '次回再試行', 'DateTime'),
    column('first_failed_at', '初回失敗', 'DateTime'),
    column('last_failed_at', '最終失敗', 'DateTime'),
    column('resolved_at', '解決日時', 'DateTime'),
    column('last_run_id', '最終実行ID', 'String'),
    column('dead_letter_id', 'Dead Letter ID', 'String'),
    column('subsystem', 'Subsystem', 'String'),
    column('error_category', 'Error Category', 'String'),
    column('safe_reference', 'Safe Reference', 'String'),
    column('message_state_id', 'Message State参照', 'String'),
    column('resume_stage', '再開段階', 'String'),
    column('attempt_count', '試行回数', 'Integer'),
    column('last_attempt_at', '最終試行', 'DateTime'),
    column('next_action', '次の操作', 'String'),
    column('created_at', '作成日時', 'DateTime'),
    column('updated_at', '更新日時', 'DateTime')
  ];
  schemas[WorkOsConfig.SHEETS.GUIDE] = [
    column('step_id', '手順', 'String'),
    column('title', '項目', 'String'),
    column('instruction', '説明', 'String')
  ];
  schemas[WorkOsConfig.SHEETS.MESSAGE_STATE] = [
    column('message_id', 'message_id', 'String'),
    column('thread_id', 'thread_id', 'String'),
    column('stable_thread_key', 'stable_thread_key', 'String'),
    column('received_at', 'received_at', 'DateTime'),
    column('discovered_at', 'discovered_at', 'DateTime'),
    column('source_mode', 'source_mode', 'String'),
    column('processing_status', 'processing_status', 'String'),
    column('resume_stage', 'resume_stage', 'String'),
    column('claimed_at', 'claimed_at', 'DateTime'),
    column('claim_run_id', 'claim_run_id', 'String'),
    column('preprocess_hash', 'preprocess_hash', 'String'),
    column('classification_json', 'classification_json', 'JsonObject'),
    column('classification_hash', 'classification_hash', 'String'),
    column('action_count', 'action_count', 'Integer'),
    column('retry_count', 'retry_count', 'Integer'),
    column('next_retry_at', 'next_retry_at', 'DateTime'),
    column('completed_at', 'completed_at', 'DateTime'),
    column('last_error_code', 'last_error_code', 'String'),
    column('last_error_at', 'last_error_at', 'DateTime'),
    column('schema_version', 'schema_version', 'String'),
    column('updated_at', 'updated_at', 'DateTime'),
    column(
      'classification_provenance_json',
      'classification_provenance_json',
      'JsonObject'
    )
  ];
  schemas[WorkOsConfig.SHEETS.SYSTEM_CONFIG] = [
    column('config_key', 'config_key', 'String'),
    column('config_value', 'config_value', 'String'),
    column('value_type', 'value_type', 'String'),
    column('updated_at', 'updated_at', 'DateTime'),
    column('note', 'note', 'String')
  ];
  schemas[WorkOsConfig.SHEETS.PROMPT_VERSIONS] = [
    column('prompt_version', 'prompt_version', 'String'),
    column('provider', 'provider', 'String'),
    column('schema_version', 'schema_version', 'String'),
    column('prompt_hash', 'prompt_hash', 'String'),
    column('active', 'active', 'Boolean', { validation: 'CHECKBOX' }),
    column('effective_from', 'effective_from', 'DateTime'),
    column('retired_at', 'retired_at', 'DateTime'),
    column('note', 'note', 'String')
  ];
  schemas[WorkOsConfig.SHEETS.SYNC_STATE] = [
    column('sync_id', 'sync_id', 'String'),
    column('task_id', 'task_id', 'String'),
    column('target_type', 'target_type', 'String'),
    column('desired_action', 'desired_action', 'String'),
    column('event_id', 'event_id', 'String'),
    column('status', 'status', 'String'),
    column('retry_count', 'retry_count', 'Integer'),
    column('next_retry_at', 'next_retry_at', 'DateTime'),
    column('last_attempt_at', 'last_attempt_at', 'DateTime'),
    column('last_success_at', 'last_success_at', 'DateTime'),
    column('error_code', 'error_code', 'String'),
    column('updated_at', 'updated_at', 'DateTime')
  ];

  Object.keys(schemas).forEach(function (sheetName) {
    schemas[sheetName] = Object.freeze(schemas[sheetName].slice());
  });

  function getSheetSchema(sheetName) {
    if (!schemas[sheetName]) {
      throw new Error('E_SCHEMA_UNKNOWN_SHEET: ' + sheetName);
    }
    return schemas[sheetName];
  }

  function getInternalIds(sheetName) {
    return getSheetSchema(sheetName).map(function (item) { return item.id; });
  }

  function getHeaders(sheetName) {
    return getSheetSchema(sheetName).map(function (item) { return item.header; });
  }

  function buildColumnMapFromIds(ids) {
    var map = {};
    (ids || []).forEach(function (id, index) {
      var normalized = String(id || '').trim();
      if (!normalized) {
        throw new Error('E_SCHEMA_MISSING_COLUMN_ID at position ' + (index + 1));
      }
      if (Object.prototype.hasOwnProperty.call(map, normalized)) {
        throw new Error('E_SCHEMA_DUPLICATE_COLUMN_ID: ' + normalized);
      }
      map[normalized] = index;
    });
    return map;
  }

  function validateSchemaDefinitions(schemaOverrides) {
    var target = schemaOverrides || schemas;
    var errors = [];
    Object.keys(target).forEach(function (sheetName) {
      try {
        buildColumnMapFromIds(target[sheetName].map(function (item) { return item.id; }));
        target[sheetName].forEach(function (item) {
          if (!String(item.header || '').trim()) {
            errors.push(sheetName + ': missing header for ' + item.id);
          }
        });
      } catch (error) {
        errors.push(sheetName + ': ' + error.message);
      }
    });
    return { ok: errors.length === 0, errors: errors };
  }

  function toInternalEnum(enumName, sheetValue) {
    var mapping = WorkOsEnums[enumName];
    if (!mapping) {
      throw new Error('E_INVALID_ENUM_NAME: ' + enumName);
    }
    var value = String(sheetValue == null ? '' : sheetValue).trim();
    var codes = Object.keys(mapping);
    for (var i = 0; i < codes.length; i += 1) {
      if (mapping[codes[i]] === value) {
        return codes[i];
      }
    }
    throw new Error('E_INVALID_ENUM: ' + enumName);
  }

  function toSheetEnum(enumName, internalCode) {
    var mapping = WorkOsEnums[enumName];
    var code = String(internalCode == null ? '' : internalCode).trim();
    if (!mapping || !Object.prototype.hasOwnProperty.call(mapping, code)) {
      throw new Error('E_INVALID_ENUM: ' + enumName);
    }
    return mapping[code];
  }

  function compareHeaders(sheetName, internalIds, headers) {
    var expectedIds = getInternalIds(sheetName);
    var expectedHeaders = getHeaders(sheetName);
    var actualIds = (internalIds || []).slice();
    var actualHeaders = (headers || []).slice();
    return {
      idsMatch: actualIds.length === expectedIds.length &&
        JSON.stringify(actualIds) === JSON.stringify(expectedIds),
      headersMatch: actualHeaders.length === expectedHeaders.length &&
        JSON.stringify(actualHeaders) === JSON.stringify(expectedHeaders),
      expectedIds: expectedIds,
      expectedHeaders: expectedHeaders
    };
  }

  function validationPlanForSheet(sheetName) {
    return getSheetSchema(sheetName).map(function (item, index) {
      var values = null;
      if (item.validation === 'ENUM' && item.enumName) {
        values = Object.keys(WorkOsEnums[item.enumName]).map(function (code) {
          return WorkOsEnums[item.enumName][code];
        });
      } else if (item.allowedValues) {
        values = item.allowedValues.slice();
      }
      return {
        id: item.id,
        columnIndex: index + 1,
        validation: item.validation,
        allowedValues: values
      };
    });
  }

  function isValidDateValue(value, dateOnly) {
    if (value instanceof Date) {
      return !Number.isNaN(value.getTime());
    }
    if (typeof value !== 'string') {
      return false;
    }
    if (dateOnly) {
      return WorkOsUtilities.isValidIsoDate(value);
    }
    return /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));
  }

  function plainObject(value) {
    return value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value);
  }

  function pendingObject(value) {
    if (plainObject(value)) {
      return value;
    }
    if (typeof value !== 'string' || !value.trim()) {
      return {};
    }
    try {
      var parsed = JSON.parse(value);
      return plainObject(parsed) ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Validate semantic Task state invariants shared by every write boundary.
   *
   * The function never repairs ambiguous state. User edits that have one
   * deterministic meaning are normalized before reaching this validator.
   */
  function validateTaskStateInvariant(task) {
    var value = task || {};
    var errors = [];
    var status = String(value.status || '');
    var reviewState = String(value.review_state || 'NONE');
    var decision = String(value.decision || 'NONE');
    var pendingAction = String(value.pending_action_type || '');
    var pending = pendingObject(value.pending_changes_json);
    var hasPendingChanges = Object.prototype.hasOwnProperty.call(
      pending,
      'changes'
    ) && plainObject(pending.changes);
    var terminal = status === 'DONE' ||
      status === 'EXCLUDED' ||
      status === 'CANCELLED';

    function requireState(condition, code) {
      if (!condition) {
        errors.push(code);
      }
    }

    if (status === 'DONE') {
      requireState(
        value.completed === true &&
          value.excluded === false &&
          value.waiting_for_reply === false,
        'TASK_STATE_DONE_FLAGS'
      );
    } else if (value.completed === true) {
      errors.push('TASK_STATE_COMPLETED_STATUS');
    }
    if (status === 'EXCLUDED') {
      requireState(
        value.excluded === true &&
          value.completed === false &&
          value.waiting_for_reply === false,
        'TASK_STATE_EXCLUDED_FLAGS'
      );
    } else if (value.excluded === true) {
      errors.push('TASK_STATE_EXCLUDED_STATUS');
    }
    if (status === 'CANCELLED') {
      requireState(
        value.completed === false &&
          value.excluded === false &&
          value.waiting_for_reply === false,
        'TASK_STATE_CANCELLED_FLAGS'
      );
    }
    if (status === 'WAITING') {
      requireState(
        value.waiting_for_reply === true &&
          value.completed === false &&
          value.excluded === false,
        'TASK_STATE_WAITING_FLAGS'
      );
    }
    if (terminal) {
      requireState(value.needs_review === false, 'TASK_STATE_TERMINAL_REVIEW');
      requireState(reviewState !== 'OPEN', 'TASK_STATE_TERMINAL_REVIEW_STATE');
      requireState(!pendingAction, 'TASK_STATE_TERMINAL_PENDING_ACTION');
      requireState(!hasPendingChanges, 'TASK_STATE_TERMINAL_PENDING_CHANGES');
    }
    if (status === 'REVIEW') {
      requireState(
        value.needs_review === true &&
          reviewState === 'OPEN' &&
          decision === 'NONE' &&
          value.completed === false &&
          value.excluded === false,
        'TASK_STATE_NEW_REVIEW'
      );
    }

    requireState(
      Boolean(pendingAction) === hasPendingChanges,
      'TASK_STATE_PENDING_SYMMETRY'
    );
    if (pendingAction || hasPendingChanges) {
      requireState(value.needs_review === true, 'TASK_STATE_PENDING_REVIEW');
      requireState(reviewState === 'OPEN', 'TASK_STATE_PENDING_REVIEW_STATE');
      requireState(decision === 'NONE', 'TASK_STATE_PENDING_DECISION');
    }
    if (reviewState === 'OPEN') {
      requireState(value.needs_review === true, 'TASK_STATE_OPEN_REVIEW_FLAG');
      requireState(decision === 'NONE', 'TASK_STATE_OPEN_DECISION');
    } else if (reviewState === 'APPLIED') {
      requireState(value.needs_review === false, 'TASK_STATE_APPLIED_REVIEW_FLAG');
      requireState(decision === 'ACCEPT', 'TASK_STATE_APPLIED_DECISION');
    } else if (reviewState === 'REJECTED') {
      requireState(value.needs_review === false, 'TASK_STATE_REJECTED_REVIEW_FLAG');
      requireState(decision === 'REJECT', 'TASK_STATE_REJECTED_DECISION');
    } else if (reviewState === 'NONE') {
      requireState(value.needs_review === false, 'TASK_STATE_NONE_REVIEW_FLAG');
      requireState(decision === 'NONE', 'TASK_STATE_NONE_DECISION');
    }
    if (value.needs_review === true) {
      requireState(reviewState === 'OPEN', 'TASK_STATE_REVIEW_FLAG_STATE');
    }
    return { ok: errors.length === 0, errors: errors };
  }

  function validateTaskForWrite(task, isCreate) {
    var errors = [];
    var value = task || {};
    var knownIds = {};
    taskColumns.forEach(function (item) { knownIds[item.id] = true; });
    Object.keys(value).forEach(function (id) {
      if (!knownIds[id]) {
        errors.push(id + ' is not a known Task field');
      }
    });
    if (!String(value.origin_key || '').trim()) {
      errors.push('origin_key is required');
    }
    if (value.origin_key && !/^org_[0-9a-f]{32}$/.test(String(value.origin_key))) {
      errors.push('origin_key has invalid format');
    }
    if (value.task_id && !/^tsk_[0-9a-f]{32}$/.test(String(value.task_id))) {
      errors.push('task_id has invalid format');
    }
    if (isCreate && !String(value.task_title || '').trim()) {
      errors.push('task_title is required');
    } else if (value.task_title != null && String(value.task_title).length > 300) {
      errors.push('task_title exceeds 300 characters');
    }
    ['needs_review', 'completed', 'excluded', 'waiting_for_reply'].forEach(function (id) {
      if (value[id] != null && typeof value[id] !== 'boolean') {
        errors.push(id + ' must be Boolean');
      }
    });
    ['source_action_index', 'row_version'].forEach(function (id) {
      if (value[id] != null && (!Number.isInteger(Number(value[id])) || Number(value[id]) < 0)) {
        errors.push(id + ' must be a non-negative Integer');
      }
    });
    if (value.ai_confidence != null) {
      var confidence = Number(value.ai_confidence);
      if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
        errors.push('ai_confidence must be between 0 and 1');
      }
    }
    taskColumns.forEach(function (item) {
      if (value[item.id] == null || value[item.id] === '') {
        return;
      }
      if (item.type === 'String' && typeof value[item.id] !== 'string') {
        errors.push(item.id + ' must be a String');
      }
      if (item.type === 'URL') {
        if (typeof value[item.id] !== 'string' || !/^https:\/\//i.test(value[item.id])) {
          errors.push(item.id + ' must be an HTTPS URL');
        }
      }
      if (item.type === 'Integer' &&
          (typeof value[item.id] !== 'number' || !Number.isInteger(value[item.id]))) {
        errors.push(item.id + ' must be an Integer');
      }
      if (item.type === 'Number' &&
          (typeof value[item.id] !== 'number' || !Number.isFinite(value[item.id]))) {
        errors.push(item.id + ' must be a Number');
      }
      if (item.maxLength && String(value[item.id]).length > item.maxLength) {
        errors.push(item.id + ' exceeds ' + item.maxLength + ' characters');
      }
      if (item.enumName) {
        try {
          if (Object.prototype.hasOwnProperty.call(WorkOsEnums[item.enumName], String(value[item.id]))) {
            toSheetEnum(item.enumName, String(value[item.id]));
          } else {
            toInternalEnum(item.enumName, String(value[item.id]));
          }
        } catch (error) {
          errors.push(item.id + ' has invalid enum value');
        }
      }
      if (item.allowedValues &&
          item.allowedValues.indexOf(String(value[item.id])) === -1) {
        errors.push(item.id + ' has invalid enum value');
      }
      if (item.type === 'Date' && !isValidDateValue(value[item.id], true)) {
        errors.push(item.id + ' must be a valid YYYY-MM-DD date');
      }
      if (item.type === 'DateTime' && !isValidDateValue(value[item.id], false)) {
        errors.push(item.id + ' must be a valid date');
      }
      if (item.type === 'JsonArray' || item.type === 'JsonObject') {
        try {
          var parsed = typeof value[item.id] === 'string'
            ? JSON.parse(value[item.id])
            : value[item.id];
          if (item.type === 'JsonArray' && !Array.isArray(parsed)) {
            errors.push(item.id + ' must be a JSON Array');
          }
          if (item.type === 'JsonObject' &&
              (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object')) {
            errors.push(item.id + ' must be a JSON Object');
          }
        } catch (error) {
          errors.push(item.id + ' must contain valid JSON');
        }
      }
    });
    if (String(value.task_id || '')) {
      var invariant = validateTaskStateInvariant(value);
      errors = errors.concat(invariant.errors);
    }
    return { ok: errors.length === 0, errors: errors };
  }

  return Object.freeze({
    getSheetSchema: getSheetSchema,
    getInternalIds: getInternalIds,
    getHeaders: getHeaders,
    buildColumnMapFromIds: buildColumnMapFromIds,
    validateSchemaDefinitions: validateSchemaDefinitions,
    toInternalEnum: toInternalEnum,
    toSheetEnum: toSheetEnum,
    compareHeaders: compareHeaders,
    validationPlanForSheet: validationPlanForSheet,
    isValidDateValue: isValidDateValue,
    validateTaskStateInvariant: validateTaskStateInvariant,
    validateTaskForWrite: validateTaskForWrite
  });
}());
