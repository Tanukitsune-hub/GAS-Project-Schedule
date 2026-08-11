/**
 * Provider-neutral AI contract, deterministic Mock adapter, and Phase 5
 * provider-neutral external transport boundary.
 *
 * This module has no network, Sheet, Gmail or Calendar dependency. Email text
 * is data only; fixture selection uses the subject marker and never executes
 * body content, URLs or quoted instructions.
 */
var WorkOsAiAdapter = (function () {
  var ACTION_TYPES = Object.freeze([
    'NEW_TASK',
    'ADD_TASK',
    'UPDATE_DUE',
    'CANCEL_TASK',
    'MARK_COMPLETE',
    'SET_WAITING',
    'CLEAR_WAITING',
    'INFORMATION_ONLY',
    'UNCLEAR'
  ]);
  var DEADLINE_BASES = Object.freeze([
    'EXPLICIT',
    'RELATIVE',
    'INFERRED',
    'AMBIGUOUS',
    'NONE'
  ]);
  var PRIORITIES = Object.freeze(['HIGH', 'MEDIUM', 'LOW']);
  var CALENDAR_CATEGORIES = Object.freeze([
    'EXTERNAL_SUBMISSION',
    'FINAL_MATERIAL',
    'CONTRACT_APPLICATION',
    'BID',
    'LEGAL_TAX_REGULATORY',
    'OTHER_HIGH_IMPACT',
    'NONE'
  ]);
  var CALENDAR_IMPORTANCE = Object.freeze(['HIGH', 'MEDIUM', 'LOW']);
  var OUTPUT_FIELDS = Object.freeze([
    'schema_version',
    'overall_confidence',
    'actions',
    'warnings'
  ]);
  var ACTION_FIELDS = Object.freeze([
    'action_type',
    'target_task_id',
    'task_title',
    'deadline',
    'suggested_deadline',
    'deadline_basis',
    'priority',
    'waiting_for_reply',
    'needs_review',
    'calendar_category',
    'calendar_importance',
    'confidence',
    'reason',
    'changes'
  ]);
  var CHANGE_FIELDS = Object.freeze([
    'task_title',
    'due_date',
    'priority',
    'waiting_for_reply',
    'calendar_category',
    'calendar_importance'
  ]);
  var ACTIVE_TASK_STATUSES = Object.freeze([
    'REVIEW',
    'OPEN',
    'IN_PROGRESS',
    'WAITING',
    'DONE',
    'EXCLUDED',
    'CANCELLED'
  ]);
  var MANUAL_FIELDS = Object.freeze([
    'status',
    'completed',
    'excluded',
    'task_title',
    'due_date',
    'priority',
    'waiting_for_reply',
    'calendar_sync_mode',
    'comment'
  ]);
  var PROVENANCE_FIELDS = Object.freeze([
    'provider',
    'model',
    'prompt_version'
  ]);
  var CANONICAL_REQUEST_FIELDS = Object.freeze([
    'contract_version',
    'provider',
    'model',
    'prompt_version',
    'timeout_ms',
    'input',
    'output_contract'
  ]);
  var EMPTY_PRODUCTION_PROVIDER_REGISTRY =
    createProviderRegistry([]);

  function fail(message) {
    throw new WorkOsAppError(
      'E_AI_SCHEMA',
      'AI_VALIDATION',
      false,
      message || 'Mock AI出力がSchemaを満たしません。'
    );
  }

  function exactFields(value, expected, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      fail(label + 'がObjectではありません。');
    }
    var actual = Object.keys(value).sort();
    var target = expected.slice().sort();
    if (JSON.stringify(actual) !== JSON.stringify(target)) {
      fail(label + 'のfieldがSchemaと一致しません。');
    }
  }

  function nullableString(value, maxLength, field) {
    if (value !== null &&
        (typeof value !== 'string' || value.length > maxLength)) {
      fail(field + 'が不正です。');
    }
  }

  function nullableDate(value, field) {
    if (value !== null && !WorkOsUtilities.isValidIsoDate(value)) {
      fail(field + 'が有効な日付ではありません。');
    }
  }

  function finiteConfidence(value, field) {
    if (typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 1) {
      fail(field + 'が0から1の範囲ではありません。');
    }
  }

  function validateChanges(changes) {
    if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
      fail('changesがObjectではありません。');
    }
    Object.keys(changes).forEach(function (field) {
      if (CHANGE_FIELDS.indexOf(field) === -1) {
        fail('changesに未知fieldがあります。');
      }
      var value = changes[field];
      if (field === 'task_title') {
        nullableString(value, 300, field);
      } else if (field === 'due_date') {
        nullableDate(value, field);
      } else if (field === 'waiting_for_reply') {
        if (value !== null && typeof value !== 'boolean') {
          fail(field + 'がBooleanではありません。');
        }
      } else if (field === 'priority') {
        if (value !== null && PRIORITIES.indexOf(value) === -1) {
          fail(field + 'のEnumが不正です。');
        }
      } else if (field === 'calendar_category') {
        if (value !== null &&
            CALENDAR_CATEGORIES.indexOf(value) === -1) {
          fail(field + 'のEnumが不正です。');
        }
      } else if (field === 'calendar_importance') {
        if (value !== null &&
            CALENDAR_IMPORTANCE.indexOf(value) === -1) {
          fail(field + 'のEnumが不正です。');
        }
      } else if (value !== null && typeof value !== 'string') {
        fail(field + 'がStringではありません。');
      }
    });
  }

  function exactChangeFields(action, expected) {
    var actual = Object.keys(action.changes).sort();
    var required = expected.slice().sort();
    if (JSON.stringify(actual) !== JSON.stringify(required)) {
      fail(action.action_type + 'のchanges fieldが不正です。');
    }
  }

  function requireNeutralFields(action, options) {
    var allowed = options || {};
    if (!allowed.task_title && action.task_title !== null) {
      fail(action.action_type + 'にtask_titleは指定できません。');
    }
    if (!allowed.deadline && action.deadline !== null) {
      fail(action.action_type + 'にdeadlineは指定できません。');
    }
    if (!allowed.suggested_deadline &&
        action.suggested_deadline !== null) {
      fail(action.action_type + 'にsuggested_deadlineは指定できません。');
    }
    if (!allowed.deadline_basis && action.deadline_basis !== 'NONE') {
      fail(action.action_type + 'にdeadline_basisは指定できません。');
    }
    if (!allowed.priority && action.priority !== 'MEDIUM') {
      fail(action.action_type + 'にpriorityは指定できません。');
    }
    if (!allowed.waiting_for_reply &&
        action.waiting_for_reply !== false) {
      fail(action.action_type + 'にwaiting_for_replyは指定できません。');
    }
    if (!allowed.calendar &&
        (action.calendar_category !== 'NONE' ||
         action.calendar_importance !== 'LOW')) {
      fail(action.action_type + 'にCalendar属性は指定できません。');
    }
  }

  function validateActionSemantics(action) {
    if (action.action_type === 'NEW_TASK' ||
        action.action_type === 'ADD_TASK') {
      if (action.target_task_id !== null) {
        fail(action.action_type + 'にtarget_task_idは指定できません。');
      }
      exactChangeFields(action, []);
    } else if (action.action_type === 'UPDATE_DUE') {
      requireNeutralFields(action, {
        deadline: true,
        deadline_basis: true
      });
      var hasDeadlineInChanges =
        Object.prototype.hasOwnProperty.call(action.changes, 'due_date');
      if (hasDeadlineInChanges) {
        exactChangeFields(action, ['due_date']);
      } else {
        exactChangeFields(action, []);
      }
      if (!hasDeadlineInChanges && action.deadline === null) {
        fail('UPDATE_DUEに期限変更がありません。');
      }
      if (hasDeadlineInChanges &&
          action.deadline !== null &&
          action.changes.due_date !== action.deadline) {
        fail('UPDATE_DUEのdeadline値が一致しません。');
      }
      var isDeletion = hasDeadlineInChanges &&
        action.changes.due_date === null;
      if (isDeletion &&
          (action.deadline !== null ||
           action.deadline_basis !== 'NONE')) {
        fail('UPDATE_DUEの期限削除表現が不正です。');
      }
      if (!isDeletion &&
          action.deadline_basis === 'NONE') {
        fail('UPDATE_DUEの期限変更にdeadline_basisがありません。');
      }
    } else if (action.action_type === 'CANCEL_TASK' ||
        action.action_type === 'MARK_COMPLETE') {
      requireNeutralFields(action);
      exactChangeFields(action, []);
    } else if (action.action_type === 'SET_WAITING' ||
        action.action_type === 'CLEAR_WAITING') {
      requireNeutralFields(action, {
        waiting_for_reply: true
      });
      exactChangeFields(action, ['waiting_for_reply']);
      var expectedWaiting = action.action_type === 'SET_WAITING';
      if (action.waiting_for_reply !== expectedWaiting ||
          action.changes.waiting_for_reply !== expectedWaiting) {
        fail(action.action_type + 'のwaiting_for_replyが不正です。');
      }
    } else if (action.action_type === 'INFORMATION_ONLY') {
      if (action.target_task_id !== null) {
        fail(action.action_type + 'にtarget_task_idは指定できません。');
      }
      requireNeutralFields(action);
      exactChangeFields(action, []);
    } else if (action.action_type === 'UNCLEAR') {
      if (action.target_task_id !== null) {
        fail(action.action_type + 'にtarget_task_idは指定できません。');
      }
      exactChangeFields(action, []);
    }

    if (action.deadline_basis === 'INFERRED' &&
        (action.deadline !== null ||
         action.suggested_deadline === null)) {
      fail('AI推測期限はsuggested_deadlineだけに指定してください。');
    }
    if ((action.deadline_basis === 'EXPLICIT' ||
         action.deadline_basis === 'RELATIVE') &&
        action.deadline === null &&
        action.action_type !== 'UPDATE_DUE') {
      fail('明示または相対期限にdeadlineがありません。');
    }
  }

  function validateAction(action) {
    exactFields(action, ACTION_FIELDS, 'action');
    if (ACTION_TYPES.indexOf(action.action_type) === -1) {
      fail('未知のActionです。');
    }
    nullableString(action.target_task_id, 80, 'target_task_id');
    if (action.target_task_id !== null &&
        !/^tsk_[0-9a-f]{32}$/.test(action.target_task_id)) {
      fail('target_task_idの形式が不正です。');
    }
    nullableString(action.task_title, 300, 'task_title');
    nullableDate(action.deadline, 'deadline');
    nullableDate(action.suggested_deadline, 'suggested_deadline');
    if (DEADLINE_BASES.indexOf(action.deadline_basis) === -1 ||
        PRIORITIES.indexOf(action.priority) === -1 ||
        CALENDAR_CATEGORIES.indexOf(action.calendar_category) === -1 ||
        CALENDAR_IMPORTANCE.indexOf(action.calendar_importance) === -1) {
      fail('ActionのEnumが不正です。');
    }
    if (typeof action.waiting_for_reply !== 'boolean' ||
        typeof action.needs_review !== 'boolean') {
      fail('ActionのBoolean fieldが不正です。');
    }
    finiteConfidence(action.confidence, 'confidence');
    if (typeof action.reason !== 'string' || action.reason.length > 1000) {
      fail('reasonが不正です。');
    }
    validateChanges(action.changes);

    if ((action.action_type === 'NEW_TASK' ||
         action.action_type === 'ADD_TASK') &&
        !String(action.task_title || '').trim()) {
      fail('新規Taskにtask_titleがありません。');
    }
    if (['UPDATE_DUE', 'CANCEL_TASK', 'MARK_COMPLETE',
      'SET_WAITING', 'CLEAR_WAITING'].indexOf(action.action_type) !== -1 &&
        action.target_task_id === null) {
      // A null target can still be resolved by a unique Stable Thread Task,
      // therefore it remains structurally valid and is resolved by policy.
    }
    if (action.action_type === 'UNCLEAR' && !action.reason.trim()) {
      fail('UNCLEARにreasonがありません。');
    }
    validateActionSemantics(action);
  }

  function validateOutput(output) {
    exactFields(output, OUTPUT_FIELDS, 'classification');
    if (output.schema_version !== WorkOsConfig.AI_SCHEMA_VERSION) {
      fail('classification schema_versionが一致しません。');
    }
    finiteConfidence(output.overall_confidence, 'overall_confidence');
    if (!Array.isArray(output.actions) ||
        output.actions.length > WorkOsConfig.MAX_AI_ACTIONS) {
      fail('Action数が上限を超えています。');
    }
    output.actions.forEach(validateAction);
    if (!Array.isArray(output.warnings) ||
        output.warnings.length > WorkOsConfig.MAX_AI_WARNINGS) {
      fail('warningsが不正です。');
    }
    output.warnings.forEach(function (warning) {
      if (typeof warning !== 'string' || warning.length > 500) {
        fail('warningが不正です。');
      }
    });
    return output;
  }

  function getOutputJsonSchema() {
    function nullable(type, extra) {
      return Object.assign({ type: [type, 'null'] }, extra || {});
    }
    var actionProperties = {
      action_type: {
        type: 'string',
        enum: ACTION_TYPES.slice()
      },
      target_task_id: nullable('string'),
      task_title: nullable('string'),
      deadline: nullable('string', {
        format: 'date'
      }),
      suggested_deadline: nullable('string', {
        format: 'date'
      }),
      deadline_basis: {
        type: 'string',
        enum: DEADLINE_BASES.slice()
      },
      priority: {
        type: 'string',
        enum: PRIORITIES.slice()
      },
      waiting_for_reply: { type: 'boolean' },
      needs_review: { type: 'boolean' },
      calendar_category: {
        type: 'string',
        enum: CALENDAR_CATEGORIES.slice()
      },
      calendar_importance: {
        type: 'string',
        enum: CALENDAR_IMPORTANCE.slice()
      },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      reason: { type: 'string' },
      changes: {
        type: 'object',
        additionalProperties: false,
        properties: {
          task_title: nullable('string'),
          due_date: nullable('string', { format: 'date' }),
          priority: nullable('string', { enum: PRIORITIES.slice() }),
          waiting_for_reply: nullable('boolean'),
          calendar_category: nullable('string', {
            enum: CALENDAR_CATEGORIES.slice()
          }),
          calendar_importance: nullable('string', {
            enum: CALENDAR_IMPORTANCE.slice()
          })
        }
      }
    };
    return {
      type: 'object',
      additionalProperties: false,
      required: OUTPUT_FIELDS.slice(),
      properties: {
        schema_version: {
          type: 'string',
          enum: [WorkOsConfig.AI_SCHEMA_VERSION]
        },
        overall_confidence: { type: 'number', minimum: 0, maximum: 1 },
        actions: {
          type: 'array',
          maxItems: WorkOsConfig.MAX_AI_ACTIONS,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ACTION_FIELDS.slice(),
            properties: actionProperties
          }
        },
        warnings: {
          type: 'array',
          maxItems: WorkOsConfig.MAX_AI_WARNINGS,
          items: { type: 'string' }
        }
      }
    };
  }

  function validateInput(input) {
    exactFields(
      input,
      ['schema_version', 'message', 'active_tasks', 'context', 'constraints'],
      'AI input'
    );
    if (input.schema_version !== WorkOsConfig.AI_SCHEMA_VERSION) {
      fail('AI input schema_versionが一致しません。');
    }
    exactFields(
      input.message,
      [
        'message_id',
        'thread_id',
        'stable_thread_key',
        'subject',
        'sender',
        'received_at',
        'plain_body',
        'prior_messages'
      ],
      'message'
    );
    ['message_id', 'thread_id', 'stable_thread_key', 'subject', 'sender',
      'received_at', 'plain_body'].forEach(function (field) {
      if (typeof input.message[field] !== 'string') {
        fail('message.' + field + 'がStringではありません。');
      }
    });
    if (!input.message.message_id ||
        !input.message.thread_id ||
        !input.message.stable_thread_key ||
        Number.isNaN(Date.parse(input.message.received_at)) ||
        Array.from(input.message.plain_body).length >
          WorkOsConfig.EMAIL_BODY_MAX_CHARS ||
        input.message.subject.length > 1000 ||
        input.message.sender.length > 500) {
      fail('message metadataまたは本文上限が不正です。');
    }
    if (!Array.isArray(input.message.prior_messages) ||
        input.message.prior_messages.length >
          WorkOsConfig.EMAIL_CONTEXT_MAX_MESSAGES) {
      fail('prior_messagesが不正です。');
    }
    input.message.prior_messages.forEach(function (message) {
      exactFields(
        message,
        ['message_id', 'sender', 'received_at', 'plain_body'],
        'prior_message'
      );
      Object.keys(message).forEach(function (field) {
        if (typeof message[field] !== 'string') {
          fail('prior_messageの型が不正です。');
        }
      });
      if (!message.message_id ||
          Number.isNaN(Date.parse(message.received_at)) ||
          Array.from(message.plain_body).length >
            WorkOsConfig.EMAIL_CONTEXT_MAX_CHARS) {
        fail('prior_message本文が上限を超えています。');
      }
    });
    if (!Array.isArray(input.active_tasks) || input.active_tasks.length > 20) {
      fail('active_tasksが不正です。');
    }
    input.active_tasks.forEach(function (task) {
      exactFields(
        task,
        ['task_id', 'task_title', 'status', 'due_date', 'manual_fields'],
        'active_task'
      );
      if (typeof task.task_id !== 'string' ||
          typeof task.task_title !== 'string' ||
          typeof task.status !== 'string' ||
          (task.due_date !== null && typeof task.due_date !== 'string') ||
          !Array.isArray(task.manual_fields)) {
        fail('active_taskの型が不正です。');
      }
      if (!/^tsk_[0-9a-f]{32}$/.test(task.task_id) ||
          !task.task_title ||
          task.task_title.length > 300 ||
          ACTIVE_TASK_STATUSES.indexOf(task.status) === -1 ||
          (task.due_date !== null &&
           !WorkOsUtilities.isValidIsoDate(task.due_date)) ||
          task.manual_fields.some(function (field) {
            return typeof field !== 'string' ||
              MANUAL_FIELDS.indexOf(field) === -1;
          }) ||
          task.manual_fields.some(function (field, index, fields) {
            return fields.indexOf(field) !== index;
          })) {
        fail('active_taskの識別子、日付またはmanual_fieldsが不正です。');
      }
    });
    exactFields(input.context, ['today', 'timezone'], 'context');
    if (!WorkOsUtilities.isValidIsoDate(input.context.today) ||
        input.context.timezone !== WorkOsConfig.TIMEZONE) {
      fail('contextが不正です。');
    }
    exactFields(
      input.constraints,
      ['max_actions', 'no_attachment_analysis', 'no_email_send'],
      'constraints'
    );
    if (input.constraints.max_actions !== WorkOsConfig.MAX_AI_ACTIONS ||
        input.constraints.no_attachment_analysis !== true ||
        input.constraints.no_email_send !== true) {
      fail('constraintsが不正です。');
    }
    return input;
  }

  function buildInput(preprocessed) {
    var value = preprocessed || {};
    var input = {
      schema_version: value.schema_version,
      message: {
        message_id: String(value.message_id || ''),
        thread_id: String(value.thread_id || ''),
        stable_thread_key: String(value.stable_thread_key || ''),
        subject: String(value.subject || ''),
        sender: String(value.sender || ''),
        received_at: String(value.received_at || ''),
        plain_body: String(value.body || ''),
        prior_messages: (value.previous_messages || []).map(function (message) {
          return {
            message_id: String(message.message_id || ''),
            sender: String(message.sender || ''),
            received_at: String(message.received_at || ''),
            plain_body: String(message.body || '')
          };
        })
      },
      active_tasks: (value.active_tasks || []).map(function (task) {
        return {
          task_id: String(task.task_id || ''),
          task_title: String(task.task_title || ''),
          status: String(task.status || ''),
          due_date: task.due_date ? String(task.due_date) : null,
          manual_fields: Array.isArray(task.manual_fields)
            ? task.manual_fields.slice()
            : []
        };
      }),
      context: {
        today: String(value.today || ''),
        timezone: String(value.timezone || '')
      },
      constraints: {
        max_actions: WorkOsConfig.MAX_AI_ACTIONS,
        no_attachment_analysis: true,
        no_email_send: true
      }
    };
    return validateInput(input);
  }

  function addDays(isoDate, days) {
    var parts = isoDate.split('-').map(Number);
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function baseAction(actionType, options) {
    var value = options || {};
    return {
      action_type: actionType,
      target_task_id: value.target_task_id == null
        ? null
        : value.target_task_id,
      task_title: value.task_title == null ? null : value.task_title,
      deadline: value.deadline == null ? null : value.deadline,
      suggested_deadline: value.suggested_deadline == null
        ? null
        : value.suggested_deadline,
      deadline_basis: value.deadline_basis || 'NONE',
      priority: value.priority || 'MEDIUM',
      waiting_for_reply: value.waiting_for_reply === true,
      needs_review: value.needs_review === true,
      calendar_category: value.calendar_category || 'NONE',
      calendar_importance: value.calendar_importance || 'LOW',
      confidence: value.confidence == null ? 0.9 : value.confidence,
      reason: value.reason || 'Deterministic Mock fixture',
      changes: value.changes || {}
    };
  }

  function firstTaskId(input) {
    return input.active_tasks.length ? input.active_tasks[0].task_id : null;
  }

  function markerFromSubject(subject) {
    var match = /^\s*\[MOCK:([A-Z0-9_]+)\]/.exec(String(subject || ''));
    return match ? match[1] : 'UNCLEAR';
  }

  function rawFixture(input, settings) {
    var marker = markerFromSubject(input.message.subject);
    var today = input.context.today;
    var targetTaskId = firstTaskId(input);
    var actions;
    if (marker === 'NEW_HIGH' || marker === 'NEW_EXPLICIT') {
      actions = [baseAction('NEW_TASK', {
        task_title: '架空資料の提出',
        deadline: addDays(today, 7),
        deadline_basis: 'EXPLICIT',
        priority: 'HIGH',
        confidence: 0.96
      })];
    } else if (marker === 'NEW_REVIEW') {
      actions = [baseAction('NEW_TASK', {
        task_title: '架空内容の確認',
        deadline_basis: 'AMBIGUOUS',
        needs_review: true,
        confidence: 0.72
      })];
    } else if (marker === 'RELATIVE') {
      actions = [baseAction('ADD_TASK', {
        task_title: '架空相対期限タスク',
        deadline: addDays(today, 3),
        deadline_basis: 'RELATIVE',
        confidence: 0.9
      })];
    } else if (marker === 'INFERRED') {
      actions = [baseAction('NEW_TASK', {
        task_title: '架空推測期限タスク',
        suggested_deadline: addDays(today, 5),
        deadline_basis: 'INFERRED',
        confidence: 0.91
      })];
    } else if (marker === 'MULTI' || marker === 'MULTI_ACTION') {
      actions = [
        baseAction('NEW_TASK', {
          task_title: '架空タスクA',
          deadline: addDays(today, 7),
          deadline_basis: 'EXPLICIT',
          confidence: 0.95
        }),
        baseAction('ADD_TASK', {
          task_title: '架空タスクB',
          deadline: addDays(today, 14),
          deadline_basis: 'EXPLICIT',
          confidence: 0.94
        })
      ];
    } else if (marker === 'UPDATE_DUE') {
      actions = [baseAction('UPDATE_DUE', {
        target_task_id: targetTaskId,
        deadline: addDays(today, 10),
        deadline_basis: 'EXPLICIT',
        changes: { due_date: addDays(today, 10) },
        confidence: 0.93
      })];
    } else if (marker === 'MARK_COMPLETE') {
      actions = [baseAction('MARK_COMPLETE', {
        target_task_id: targetTaskId,
        confidence: 0.98
      })];
    } else if (marker === 'CANCEL') {
      actions = [baseAction('CANCEL_TASK', {
        target_task_id: targetTaskId,
        confidence: 0.98
      })];
    } else if (marker === 'WAITING') {
      actions = [baseAction('SET_WAITING', {
        target_task_id: targetTaskId,
        waiting_for_reply: true,
        changes: { waiting_for_reply: true },
        confidence: 0.93
      })];
    } else if (marker === 'CLEAR_WAITING') {
      actions = [baseAction('CLEAR_WAITING', {
        target_task_id: targetTaskId,
        changes: { waiting_for_reply: false },
        confidence: 0.93
      })];
    } else if (marker === 'INFO' || marker === 'INFORMATION_ONLY') {
      actions = [baseAction('INFORMATION_ONLY', {
        confidence: 0.99,
        reason: 'No Task action'
      })];
    } else if (marker === 'UNCLEAR') {
      actions = [baseAction('UNCLEAR', {
        task_title: '架空内容の確認',
        needs_review: true,
        confidence: 0.55,
        reason: 'The request is intentionally ambiguous'
      })];
    } else if (marker === 'TRANSIENT_ERROR') {
      var counter = settings.transientCounter;
      if (!counter || Number(counter.remaining || 0) > 0) {
        if (counter) {
          counter.remaining = Math.max(0, Number(counter.remaining || 0) - 1);
        }
        throw new WorkOsAppError(
          'E_AI_TIMEOUT',
          'AI_CLASSIFY',
          true,
          'Mock Adapterの一時障害です。'
        );
      }
      actions = [baseAction('INFORMATION_ONLY', {
        confidence: 0.99,
        reason: 'Recovered deterministic Mock'
      })];
    } else if (marker === 'SCHEMA_ERROR') {
      return { schema_version: '2.0', actions: [] };
    } else if (marker === 'INVALID_JSON') {
      try {
        JSON.parse('{"schema_version":"2.0","actions":[');
      } catch (error) {
        throw new WorkOsAppError(
          'E_AI_INVALID_JSON',
          'AI_CLASSIFY',
          false,
          'Mock AI応答をJSONとして解析できません。'
        );
      }
      throw new WorkOsAppError(
        'E_AI_INVALID_JSON',
        'AI_CLASSIFY',
        false,
        'Mock AI応答をJSONとして解析できません。'
      );
    } else if (marker === 'UNKNOWN_ACTION') {
      actions = [baseAction('NOT_SUPPORTED', {})];
    } else if (marker === 'TOO_MANY') {
      actions = [];
      for (var index = 0; index < 11; index += 1) {
        actions.push(baseAction('NEW_TASK', {
          task_title: '架空上限テスト' + index,
          confidence: 0.9
        }));
      }
    } else {
      actions = [baseAction('UNCLEAR', {
        task_title: '架空内容の確認',
        needs_review: true,
        confidence: 0.5,
        reason: 'Unknown Mock marker'
      })];
    }
    return {
      schema_version: WorkOsConfig.AI_SCHEMA_VERSION,
      overall_confidence: actions.reduce(function (minimum, action) {
        return Math.min(minimum, action.confidence);
      }, 1),
      actions: actions,
      warnings: []
    };
  }

  function MockAiAdapter(options) {
    WorkOsUtilities.assertTestMode('MOCK_AI_ADAPTER');
    this.settings = options || {};
  }

  MockAiAdapter.prototype.healthCheck = function () {
    return {
      provider: 'MOCK',
      model: WorkOsConfig.MOCK_AI_MODEL,
      prompt_version: WorkOsConfig.MOCK_PROMPT_VERSION,
      status: 'READY',
      credential_configured: false,
      external_request: false
    };
  };

  MockAiAdapter.prototype.getMetadata = function () {
    return mockMetadata();
  };

  MockAiAdapter.prototype.classify = function (input) {
    validateInput(input);
    return validateOutput(rawFixture(input, this.settings));
  };

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function exactObjectFields(value, fields, label, code, stage) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new WorkOsAppError(
        code,
        stage,
        false,
        label + 'がObjectではありません。'
      );
    }
    var actual = Object.keys(value).sort();
    var expected = fields.slice().sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new WorkOsAppError(
        code,
        stage,
        false,
        label + 'のfieldが契約と一致しません。'
      );
    }
  }

  function metadataToken(value) {
    var text = String(value || '');
    return text.length <= 120 &&
      /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(text);
  }

  function createProviderRegistry(entries) {
    var byProvider = {};
    (entries || []).forEach(function (entry) {
      exactObjectFields(
        entry,
        ['provider_id', 'create_adapter_settings'],
        'production provider registry entry',
        'E_AI_PROVIDER_REGISTRY',
        'AI_CONFIG'
      );
      var providerId = String(entry.provider_id || '').toUpperCase();
      if (!metadataToken(providerId) || providerId === 'MOCK' ||
          typeof entry.create_adapter_settings !== 'function' ||
          Object.prototype.hasOwnProperty.call(byProvider, providerId)) {
        externalConfigError(
          'E_AI_PROVIDER_REGISTRY',
          'production provider registry entryが不正または重複しています。'
        );
      }
      byProvider[providerId] = Object.freeze({
        provider_id: providerId,
        create_adapter_settings: entry.create_adapter_settings
      });
    });
    return Object.freeze({
      has: function (providerId) {
        return Object.prototype.hasOwnProperty.call(
          byProvider,
          String(providerId || '').toUpperCase()
        );
      },
      get: function (providerId) {
        return byProvider[String(providerId || '').toUpperCase()] || null;
      },
      providers: function () {
        return Object.keys(byProvider).sort();
      }
    });
  }

  function productionProviderRegistry() {
    var entries = [];
    if (typeof WorkOsGeminiProvider !== 'undefined' &&
        WorkOsGeminiProvider &&
        typeof WorkOsGeminiProvider.createAdapterSettings === 'function') {
      entries.push({
        provider_id: 'GEMINI',
        create_adapter_settings: function (settings) {
          return WorkOsGeminiProvider.createAdapterSettings(settings);
        }
      });
    }
    return entries.length ? createProviderRegistry(entries) :
      EMPTY_PRODUCTION_PROVIDER_REGISTRY;
  }

  function validateOpaqueCredentialReference(value) {
    var reference = String(value || '');
    if (!metadataToken(reference) ||
        /^(?:sk-|AIza|gh[pousr]_|xox[baprs]-)/i.test(reference) ||
        /^eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(
          reference
        ) ||
        WorkOsUtilities.redact(reference) !== reference) {
      externalConfigError(
        'E_AI_CREDENTIAL_REFERENCE_INVALID',
        'credential referenceが安全なopaque識別子ではありません。'
      );
    }
    return reference;
  }

  function productionConfigSnapshot(options) {
    var settings = options || {};
    return {
      external_enabled: settings.external_enabled == null
        ? WorkOsConfig.EXTERNAL_AI_ENABLED
        : settings.external_enabled,
      provider: settings.provider == null
        ? WorkOsConfig.EXTERNAL_AI_PROVIDER
        : settings.provider,
      model: settings.model == null
        ? WorkOsConfig.EXTERNAL_AI_MODEL
        : settings.model,
      prompt_version: settings.prompt_version == null
        ? WorkOsConfig.EXTERNAL_AI_PROMPT_VERSION
        : settings.prompt_version,
      credential_reference: settings.credential_reference == null
        ? WorkOsConfig.EXTERNAL_AI_CREDENTIAL_REFERENCE
        : settings.credential_reference,
      company_approved: settings.company_approved == null
        ? WorkOsConfig.EXTERNAL_AI_COMPANY_APPROVED
        : settings.company_approved,
      data_policy_approved: settings.data_policy_approved == null
        ? WorkOsConfig.EXTERNAL_AI_DATA_POLICY_APPROVED
        : settings.data_policy_approved,
      credential_storage_approved:
        settings.credential_storage_approved == null
          ? WorkOsConfig.EXTERNAL_AI_CREDENTIAL_STORAGE_APPROVED
          : settings.credential_storage_approved,
      auth_configured: settings.auth_configured == null
        ? WorkOsConfig.EXTERNAL_AI_AUTH_CONFIGURED
        : settings.auth_configured,
      timeout_ms: settings.timeout_ms == null
        ? WorkOsConfig.AI_REQUEST_TIMEOUT_MS
        : settings.timeout_ms,
      max_response_chars: settings.max_response_chars == null
        ? WorkOsConfig.AI_RESPONSE_MAX_CHARS
        : settings.max_response_chars
    };
  }

  function getProductionReadiness(options) {
    var settings = options || {};
    var config = productionConfigSnapshot(settings.config || settings);
    var registry = settings.registry || productionProviderRegistry();
    var reasons = [];
    var provider = String(config.provider || '').toUpperCase();
    if (config.external_enabled !== true ||
        !metadataToken(provider) ||
        provider === 'MOCK' ||
        !metadataToken(config.model) ||
        !metadataToken(config.prompt_version)) {
      reasons.push('EXTERNAL_AI_NOT_CONFIGURED');
    }
    if (config.company_approved !== true) {
      reasons.push('COMPANY_APPROVAL_NOT_CONFIRMED');
    }
    if (config.data_policy_approved !== true) {
      reasons.push('DATA_POLICY_APPROVAL_NOT_CONFIRMED');
    }
    if (config.credential_storage_approved !== true) {
      reasons.push('CREDENTIAL_STORAGE_APPROVAL_NOT_CONFIRMED');
    }
    if (config.auth_configured !== true) {
      reasons.push('AI_AUTH_NOT_CONFIGURED');
    }
    try {
      validateOpaqueCredentialReference(config.credential_reference);
    } catch (error) {
      reasons.push('AI_CREDENTIAL_REFERENCE_NOT_CONFIGURED');
    }
    if (!registry || typeof registry.has !== 'function' ||
        !registry.has(provider)) {
      reasons.push('AI_PROVIDER_NOT_REGISTERED');
    }
    return {
      ready: reasons.length === 0,
      reasons: reasons,
      provider: metadataToken(provider) ? provider : '',
      model_configured: metadataToken(config.model),
      prompt_version_configured: metadataToken(config.prompt_version),
      registry_entry_present: Boolean(
        registry && typeof registry.has === 'function' &&
        registry.has(provider)
      ),
      credential_reference_present: Boolean(
        String(config.credential_reference || '')
      ),
      external_request_performed: false
    };
  }

  function validateProvenance(value) {
    exactObjectFields(
      value,
      PROVENANCE_FIELDS,
      'AI provenance',
      'E_AI_PROVENANCE',
      'AI_VALIDATION'
    );
    PROVENANCE_FIELDS.forEach(function (field) {
      if (!metadataToken(value[field])) {
        throw new WorkOsAppError(
          'E_AI_PROVENANCE',
          'AI_VALIDATION',
          false,
          'AI provenanceが安全な識別子ではありません。'
        );
      }
    });
    return {
      provider: String(value.provider),
      model: String(value.model),
      prompt_version: String(value.prompt_version)
    };
  }

  function mockMetadata() {
    return {
      provider: 'MOCK',
      model: WorkOsConfig.MOCK_AI_MODEL,
      prompt_version: WorkOsConfig.MOCK_PROMPT_VERSION
    };
  }

  function externalConfigError(code, message) {
    throw new WorkOsAppError(
      code,
      'AI_CONFIG',
      false,
      message
    );
  }

  function credentialIsConfigured(provider) {
    if (!provider || typeof provider.isConfigured !== 'function') {
      return false;
    }
    try {
      return provider.isConfigured() === true;
    } catch (error) {
      return false;
    }
  }

  function validateAdapterConfig(options) {
    var settings = options || {};
    if (settings.external_enabled !== true ||
        !metadataToken(settings.provider) ||
        !metadataToken(settings.model) ||
        !metadataToken(settings.prompt_version) ||
        !settings.transport ||
        typeof settings.transport.send !== 'function') {
      externalConfigError(
        'E_AI_NOT_CONFIGURED',
        '外部AI AdapterのProviderまたは通信境界が未設定です。'
      );
    }
    if (settings.company_approved !== true ||
        settings.data_policy_approved !== true ||
        settings.credential_storage_approved !== true) {
      externalConfigError(
        'E_AI_APPROVAL_REQUIRED',
        '外部AI利用の承認または情報管理条件が未確認です。'
      );
    }
    if (settings.auth_configured !== true ||
        !credentialIsConfigured(settings.credential_provider)) {
      externalConfigError(
        'E_AI_CREDENTIAL_NOT_CONFIGURED',
        '外部AI credentialが安全に設定されていません。'
      );
    }
    if (settings.require_opaque_reference === true) {
      validateOpaqueCredentialReference(settings.credential_reference);
    }
    var configuredTimeout = settings.timeout_ms;
    var timeoutMs = configuredTimeout == null
      ? WorkOsConfig.AI_REQUEST_TIMEOUT_MS
      : Number(configuredTimeout);
    var configuredMaxResponse = settings.max_response_chars;
    var maxResponseChars = configuredMaxResponse == null
      ? WorkOsConfig.AI_RESPONSE_MAX_CHARS
      : Number(configuredMaxResponse);
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 ||
        timeoutMs > WorkOsConfig.AI_REQUEST_TIMEOUT_MS ||
        !Number.isInteger(maxResponseChars) || maxResponseChars < 1 ||
        maxResponseChars > WorkOsConfig.AI_RESPONSE_MAX_CHARS) {
      externalConfigError(
        'E_AI_INVALID_REQUEST',
        '外部AIのtimeoutまたはresponse上限設定が不正です。'
      );
    }
    return validateProvenance({
      provider: settings.provider,
      model: settings.model,
      prompt_version: settings.prompt_version
    });
  }

  function buildCanonicalRequest(input, metadata, options) {
    var validatedInput;
    try {
      validatedInput = validateInput(input);
    } catch (error) {
      throw aiFailure(
        'E_AI_SCHEMA',
        'AI_REQUEST',
        false,
        'AI inputが厳密なSchemaと一致しません。'
      );
    }
    var provenance = validateProvenance(metadata);
    var settings = options || {};
    var timeoutMs = Number(settings.timeout_ms == null
      ? WorkOsConfig.AI_REQUEST_TIMEOUT_MS
      : settings.timeout_ms);
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 ||
        timeoutMs > WorkOsConfig.AI_REQUEST_TIMEOUT_MS) {
      throw new WorkOsAppError(
        'E_AI_INVALID_REQUEST',
        'AI_REQUEST',
        false,
        'AI request timeoutが安全な上限と一致しません。'
      );
    }
    var request = {
      contract_version: 'WORK_OS_EXTERNAL_AI_V1',
      provider: provenance.provider,
      model: provenance.model,
      prompt_version: provenance.prompt_version,
      timeout_ms: timeoutMs,
      input: cloneJson(validatedInput),
      output_contract: {
        schema_version: WorkOsConfig.AI_SCHEMA_VERSION,
        max_actions: WorkOsConfig.MAX_AI_ACTIONS,
        additional_properties: false
      }
    };
    exactObjectFields(
      request,
      CANONICAL_REQUEST_FIELDS,
      'canonical AI request',
      'E_AI_INVALID_REQUEST',
      'AI_REQUEST'
    );
    return request;
  }

  function aiFailure(code, stage, retryable, message) {
    return new WorkOsAppError(code, stage, retryable, message);
  }

  function classifyTransportFailure(error) {
    if (error instanceof WorkOsAppError &&
        /^E_AI_[A-Z0-9_]+$/.test(String(error.code || ''))) {
      return aiFailure(
        error.code,
        'AI_REQUEST',
        error.retryable,
        'AI transportが構造化エラーを返しました。'
      );
    }
    var kind = String(error && error.ai_error_kind || '').toUpperCase();
    if (kind === 'TIMEOUT') {
      return aiFailure(
        'E_AI_TIMEOUT',
        'AI_REQUEST',
        true,
        'AI requestが時間内に完了しませんでした。'
      );
    }
    return aiFailure(
      'E_AI_NETWORK',
      'AI_REQUEST',
      true,
      'AI transportへ安全に接続できませんでした。'
    );
  }

  function responseStatusFailure(response) {
    var status = Number(response && response.status);
    var normalizedKind = String(
      response && response.error_kind || ''
    ).toUpperCase();
    if (normalizedKind === 'INVALID_RESPONSE') {
      return aiFailure(
        'E_AI_PROVIDER_RESPONSE',
        'AI_RESPONSE',
        false,
        'AI Provider response envelope could not be accepted.'
      );
    }
    if (normalizedKind === 'UNSUPPORTED_MODEL') {
      return aiFailure(
        'E_AI_MODEL_UNSUPPORTED',
        'AI_REQUEST',
        false,
        '設定されたAI modelはProviderで利用できません。'
      );
    }
    if (status === 408) {
      return aiFailure(
        'E_AI_TIMEOUT',
        'AI_REQUEST',
        true,
        'AI requestが時間内に完了しませんでした。'
      );
    }
    if (status === 429) {
      return aiFailure(
        'E_AI_RATE_LIMIT',
        'AI_REQUEST',
        true,
        'AI Providerの一時的な利用上限に達しました。'
      );
    }
    if (status >= 500 && status <= 599) {
      return aiFailure(
        'E_AI_UPSTREAM',
        'AI_REQUEST',
        true,
        'AI Providerで一時的な障害が発生しました。'
      );
    }
    if (status === 401) {
      return aiFailure(
        'E_AI_AUTH',
        'AI_REQUEST',
        false,
        'AI Providerの認証を確認できません。'
      );
    }
    if (status === 403) {
      return aiFailure(
        'E_AI_PERMISSION',
        'AI_REQUEST',
        false,
        'AI Providerの利用権限を確認できません。'
      );
    }
    if (status >= 400 && status <= 499) {
      return aiFailure(
        'E_AI_INVALID_REQUEST',
        'AI_REQUEST',
        false,
        'AI requestがProviderの契約と一致しません。'
      );
    }
    if (!Number.isInteger(status) || status < 200 || status > 299) {
      return aiFailure(
        'E_AI_NETWORK',
        'AI_REQUEST',
        true,
        'AI transportから有効なstatusを取得できませんでした。'
      );
    }
    return null;
  }

  function sanitizeExternalOutput(output) {
    var sanitized = cloneJson(output);
    var sensitiveOutputDetected = false;
    sanitized.actions.forEach(function (action) {
      if (action.task_title !== null) {
        sensitiveOutputDetected =
          WorkOsUtilities.containsHighConfidenceSecret(
            action.task_title
          ) || sensitiveOutputDetected;
        action.task_title = WorkOsUtilities.redact(action.task_title)
          .slice(0, 300);
      }
      if (action.changes &&
          typeof action.changes.task_title === 'string') {
        sensitiveOutputDetected =
          WorkOsUtilities.containsHighConfidenceSecret(
            action.changes.task_title
          ) || sensitiveOutputDetected;
        action.changes.task_title = WorkOsUtilities.redact(
          action.changes.task_title
        ).slice(0, 300);
      }
      if (sensitiveOutputDetected) {
        action.needs_review = true;
      }
      action.reason = 'External classification rationale withheld';
    });
    sanitized.warnings = sanitized.warnings.map(function () {
      return 'EXTERNAL_WARNING_REDACTED';
    });
    if (sensitiveOutputDetected) {
      sanitized.warnings.push('SENSITIVE_OUTPUT_REDACTED_REVIEW_REQUIRED');
    }
    return validateOutput(sanitized);
  }

  function parseCanonicalResponse(response, options) {
    var settings = options || {};
    var failure = responseStatusFailure(response);
    if (failure) {
      throw failure;
    }
    var body = typeof response.body === 'string' ? response.body : '';
    if (!body.trim()) {
      throw aiFailure(
        'E_AI_EMPTY_RESPONSE',
        'AI_RESPONSE',
        false,
        'AI responseが空です。'
      );
    }
    var maxChars = Number(settings.max_response_chars == null
      ? WorkOsConfig.AI_RESPONSE_MAX_CHARS
      : settings.max_response_chars);
    if (!Number.isInteger(maxChars) || maxChars < 1 ||
        maxChars > WorkOsConfig.AI_RESPONSE_MAX_CHARS ||
        Array.from(body).length > maxChars) {
      throw aiFailure(
        'E_AI_RESPONSE_TOO_LARGE',
        'AI_RESPONSE',
        false,
        'AI responseが安全な上限を超えています。'
      );
    }
    var parsed;
    try {
      parsed = JSON.parse(body);
    } catch (error) {
      throw aiFailure(
        'E_AI_INVALID_JSON',
        'AI_RESPONSE',
        false,
        'AI responseをJSONとして解析できません。'
      );
    }
    try {
      validateOutput(parsed);
      return sanitizeExternalOutput(parsed);
    } catch (error) {
      throw aiFailure(
        'E_AI_SCHEMA',
        'AI_RESPONSE',
        false,
        'AI responseが厳密なSchemaと一致しません。'
      );
    }
  }

  function MockHttpTransport(fixtures) {
    WorkOsUtilities.assertTestMode('MOCK_AI_HTTP_TRANSPORT');
    this.fixtures = Array.isArray(fixtures) ? fixtures.slice() : [];
    this.calls = [];
  }

  MockHttpTransport.prototype.send = function (request, credential) {
    this.calls.push({
      request: cloneJson(request),
      credential_present: credential != null && credential !== ''
    });
    var fixture = this.fixtures.length
      ? this.fixtures.shift()
      : { status: 204, body: '' };
    var fixtureErrorKind = String(
      fixture && fixture.error_kind || ''
    ).toUpperCase();
    if (fixtureErrorKind === 'TIMEOUT' ||
        fixtureErrorKind === 'NETWORK') {
      var transportError = new Error('Mock transport failure');
      transportError.ai_error_kind = fixtureErrorKind;
      throw transportError;
    }
    return cloneJson(fixture);
  };

  function ExternalAiAdapter(options) {
    this.settings = options || {};
  }

  ExternalAiAdapter.prototype.getMetadata = function () {
    return validateProvenance({
      provider: this.settings.provider,
      model: this.settings.model,
      prompt_version: this.settings.prompt_version
    });
  };

  ExternalAiAdapter.prototype.healthCheck = function () {
    var metadata = {
      provider: metadataToken(this.settings.provider)
        ? String(this.settings.provider)
        : '',
      model: metadataToken(this.settings.model)
        ? String(this.settings.model)
        : '',
      prompt_version: metadataToken(this.settings.prompt_version)
        ? String(this.settings.prompt_version)
        : ''
    };
    try {
      validateAdapterConfig(this.settings);
      return {
        provider: metadata.provider,
        model: metadata.model,
        prompt_version: metadata.prompt_version,
        status: 'READY',
        credential_configured: true,
        external_request: false
      };
    } catch (error) {
      var safe = WorkOsUtilities.safeError(error, 'AI_CONFIG');
      return {
        provider: metadata.provider,
        model: metadata.model,
        prompt_version: metadata.prompt_version,
        status: 'NOT_CONFIGURED',
        code: safe.code,
        credential_configured: credentialIsConfigured(
          this.settings.credential_provider
        ),
        external_request: false
      };
    }
  };

  ExternalAiAdapter.prototype.classify = function (input) {
    var execution = arguments.length > 1 && arguments[1]
      ? arguments[1]
      : {};
    if (this.settings.max_classify_calls != null) {
      var maxCalls = Number(this.settings.max_classify_calls);
      var calls = Number(this.settings.classify_calls || 0);
      if (!Number.isInteger(maxCalls) || maxCalls < 1 || calls >= maxCalls) {
        throw aiFailure(
          'E_AI_CALL_LIMIT',
          'AI_REQUEST',
          false,
          'AI request call limit was reached.'
        );
      }
      this.settings.classify_calls = calls + 1;
    }
    var metadata = validateAdapterConfig(this.settings);
    var configuredTimeout = Number(
      this.settings.timeout_ms == null
        ? WorkOsConfig.AI_REQUEST_TIMEOUT_MS
        : this.settings.timeout_ms
    );
    var effectiveTimeout = configuredTimeout;
    if (execution.remaining_ms != null) {
      var remaining = Number(execution.remaining_ms);
      var reserve = Number(execution.reserve_ms || 0);
      effectiveTimeout = Math.min(
        configuredTimeout,
        Math.floor(remaining - reserve)
      );
      if (!Number.isInteger(effectiveTimeout) || effectiveTimeout < 1000) {
        throw aiFailure(
          'E_AI_BUDGET_INSUFFICIENT',
          'AI_REQUEST',
          true,
          'AI requestを安全に開始できる実行予算が残っていません。'
        );
      }
    }
    var request = buildCanonicalRequest(input, metadata, {
      timeout_ms: effectiveTimeout
    });
    var credential;
    try {
      credential = this.settings.credential_provider.getCredential();
    } catch (error) {
      externalConfigError(
        'E_AI_CREDENTIAL_NOT_CONFIGURED',
        '外部AI credentialを安全に取得できません。'
      );
    }
    if (credential == null || credential === '') {
      externalConfigError(
        'E_AI_CREDENTIAL_NOT_CONFIGURED',
        '外部AI credentialが安全に設定されていません。'
      );
    }
    var response;
    try {
      response = this.settings.transport.send(request, credential);
    } catch (error) {
      throw classifyTransportFailure(error);
    } finally {
      credential = null;
    }
    return parseCanonicalResponse(response, {
      max_response_chars: this.settings.max_response_chars
    });
  };

  function createProductionExternalAdapter(options) {
    var settings = options || {};
    if (Object.keys(settings).length && !WorkOsConfig.TEST_MODE) {
      externalConfigError(
        'E_TEST_MODE_DISABLED',
        'production AI factoryへの依存注入はTest modeだけで利用できます。'
      );
    }
    var config = productionConfigSnapshot(settings.config || {});
    var registry = settings.registry || productionProviderRegistry();
    var readiness = getProductionReadiness({
      config: config,
      registry: registry
    });
    if (!readiness.ready) {
      var firstReason = readiness.reasons[0] || 'EXTERNAL_AI_NOT_CONFIGURED';
      var code = firstReason === 'AI_PROVIDER_NOT_REGISTERED'
        ? 'E_AI_PROVIDER_NOT_REGISTERED'
        : (firstReason === 'AI_CREDENTIAL_REFERENCE_NOT_CONFIGURED'
          ? 'E_AI_CREDENTIAL_REFERENCE_INVALID'
          : (firstReason.indexOf('APPROVAL') !== -1
            ? 'E_AI_APPROVAL_REQUIRED'
            : 'E_REAL_AI_TRANSPORT_NOT_IMPLEMENTED'));
      externalConfigError(
        code,
        '外部AI production Adapterの前提が未確定です。'
      );
    }
    var entry = registry.get(config.provider);
    var components = entry.create_adapter_settings(Object.freeze({
      provider: String(config.provider).toUpperCase(),
      model: String(config.model),
      prompt_version: String(config.prompt_version),
      credential_reference: validateOpaqueCredentialReference(
        config.credential_reference
      ),
      timeout_ms: Number(config.timeout_ms),
      max_response_chars: Number(config.max_response_chars)
    }));
    exactObjectFields(
      components,
      ['transport', 'credential_provider'],
      'production adapter settings',
      'E_AI_PROVIDER_REGISTRY',
      'AI_CONFIG'
    );
    return new ExternalAiAdapter({
      external_enabled: true,
      provider: String(config.provider).toUpperCase(),
      model: config.model,
      prompt_version: config.prompt_version,
      company_approved: true,
      data_policy_approved: true,
      credential_storage_approved: true,
      auth_configured: true,
      credential_reference: config.credential_reference,
      require_opaque_reference: true,
      timeout_ms: config.timeout_ms,
      max_response_chars: config.max_response_chars,
      transport: components.transport,
      credential_provider: components.credential_provider
    });
  }

  function createAdapter(options) {
    var settings = options || {};
    if (settings.adapter) {
      if (!WorkOsConfig.TEST_MODE &&
          typeof settings.adapter.getMetadata === 'function' &&
          String(settings.adapter.getMetadata().provider || '')
            .toUpperCase() === 'MOCK') {
        WorkOsUtilities.assertTestMode('MOCK_AI_ADAPTER_INJECTION');
      }
      return settings.adapter;
    }
    var mode = String(settings.mode || '').toUpperCase();
    if (mode === 'EXTERNAL') {
      return new ExternalAiAdapter(settings);
    }
    if (mode === 'MOCK') {
      WorkOsUtilities.assertTestMode('MOCK_AI_ADAPTER_FACTORY');
      return new MockAiAdapter(settings.adapter_options || {});
    }
    if (!mode && WorkOsConfig.TEST_MODE !== true) {
      return createProductionExternalAdapter();
    }
    if (mode) {
      throw new WorkOsAppError(
        'E_AI_PROVIDER_NOT_CONFIGURED',
        'AI_CONFIG',
        false,
        'AI Adapter modeが未対応です。'
      );
    }
    return new MockAiAdapter(settings.adapter_options || {});
  }

  function getMetadata(adapter) {
    if (adapter && typeof adapter.getMetadata === 'function') {
      var metadata = validateProvenance(adapter.getMetadata());
      if (!WorkOsConfig.TEST_MODE && metadata.provider === 'MOCK') {
        WorkOsUtilities.assertTestMode('MOCK_AI_METADATA');
      }
      return metadata;
    }
    WorkOsUtilities.assertTestMode('MOCK_AI_METADATA_FALLBACK');
    return validateProvenance(mockMetadata());
  }

  function classificationHash(classification, provenance) {
    validateOutput(classification);
    var metadata = provenance
      ? validateProvenance(provenance)
      : getMetadata(null);
    return WorkOsUtilities.sha256Hex(JSON.stringify({
      classification: classification,
      provenance: metadata
    }));
  }

  function legacyClassificationHash(classification) {
    validateOutput(classification);
    return WorkOsUtilities.sha256Hex(JSON.stringify(classification));
  }

  return Object.freeze({
    ACTION_TYPES: ACTION_TYPES,
    buildInput: buildInput,
    validateInput: validateInput,
    validateOutput: validateOutput,
    validateProvenance: validateProvenance,
    createProviderRegistry: createProviderRegistry,
    validateOpaqueCredentialReference: validateOpaqueCredentialReference,
    getProductionReadiness: getProductionReadiness,
    getProductionProviderRegistry: productionProviderRegistry,
    validateAdapterConfig: validateAdapterConfig,
    buildCanonicalRequest: buildCanonicalRequest,
    getOutputJsonSchema: getOutputJsonSchema,
    parseCanonicalResponse: parseCanonicalResponse,
    classifyTransportFailure: classifyTransportFailure,
    classificationHash: classificationHash,
    legacyClassificationHash: legacyClassificationHash,
    getMetadata: getMetadata,
    createAdapter: createAdapter,
    createProductionExternalAdapter: createProductionExternalAdapter,
    MockAiAdapter: MockAiAdapter,
    MockHttpTransport: MockHttpTransport,
    ExternalAiAdapter: ExternalAiAdapter
  });
}());
