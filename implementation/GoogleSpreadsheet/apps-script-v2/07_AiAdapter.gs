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
      message || 'Mock AI蜃ｺ蜉帙′Schema繧呈ｺ縺溘＠縺ｾ縺帙ｓ縲・
    );
  }

  function exactFields(value, expected, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      fail(label + '縺薫bject縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・);
    }
    var actual = Object.keys(value).sort();
    var target = expected.slice().sort();
    if (JSON.stringify(actual) !== JSON.stringify(target)) {
      fail(label + '縺ｮfield縺郡chema縺ｨ荳閾ｴ縺励∪縺帙ｓ縲・);
    }
  }

  function nullableString(value, maxLength, field) {
    if (value !== null &&
        (typeof value !== 'string' || value.length > maxLength)) {
      fail(field + '縺御ｸ肴ｭ｣縺ｧ縺吶・);
    }
  }

  function nullableDate(value, field) {
    if (value !== null && !WorkOsUtilities.isValidIsoDate(value)) {
      fail(field + '縺梧怏蜉ｹ縺ｪ譌･莉倥〒縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・);
    }
  }

  function finiteConfidence(value, field) {
    if (typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 1) {
      fail(field + '縺・縺九ｉ1縺ｮ遽・峇縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・);
    }
  }

  function validateChanges(changes) {
    if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
      fail('changes縺薫bject縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・);
    }
    Object.keys(changes).forEach(function (field) {
      if (CHANGE_FIELDS.indexOf(field) === -1) {
        fail('changes縺ｫ譛ｪ遏･field縺後≠繧翫∪縺吶・);
      }
      var value = changes[field];
      if (field === 'task_title') {
        nullableString(value, 300, field);
      } else if (field === 'due_date') {
        nullableDate(value, field);
      } else if (field === 'waiting_for_reply') {
        if (value !== null && typeof value !== 'boolean') {
          fail(field + '縺沓oolean縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・);
        }
      } else if (field === 'priority') {
        if (value !== null && PRIORITIES.indexOf(value) === -1) {
          fail(field + '縺ｮEnum縺御ｸ肴ｭ｣縺ｧ縺吶・);
        }
      } else if (field === 'calendar_category') {
        if (value !== null &&
            CALENDAR_CATEGORIES.indexOf(value) === -1) {
          fail(field + '縺ｮEnum縺御ｸ肴ｭ｣縺ｧ縺吶・);
        }
      } else if (field === 'calendar_importance') {
        if (value !== null &&
            CALENDAR_IMPORTANCE.indexOf(value) === -1) {
          fail(field + '縺ｮEnum縺御ｸ肴ｭ｣縺ｧ縺吶・);
        }
      } else if (value !== null && typeof value !== 'string') {
        fail(field + '縺郡tring縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・);
      }
    });
  }

  function exactChangeFields(action, expected) {
    var actual = Object.keys(action.changes).sort();
    var required = expected.slice().sort();
    if (JSON.stringify(actual) !== JSON.stringify(required)) {
      fail(action.action_type + '縺ｮchanges field縺御ｸ肴ｭ｣縺ｧ縺吶・);
    }
  }

  function requireNeutralFields(action, options) {
    var allowed = options || {};
    if (!allowed.task_title && action.task_title !== null) {
      fail(action.action_type + '縺ｫtask_title縺ｯ謖・ｮ壹〒縺阪∪縺帙ｓ縲・);
    }
    if (!allowed.deadline && action.deadline !== null) {
      fail(action.action_type + '縺ｫdeadline縺ｯ謖・ｮ壹〒縺阪∪縺帙ｓ縲・);
    }
    if (!allowed.suggested_deadline &&
        action.suggested_deadline !== null) {
      fail(action.action_type + '縺ｫsuggested_deadline縺ｯ謖・ｮ壹〒縺阪∪縺帙ｓ縲・);
    }
    if (!allowed.deadline_basis && action.deadline_basis !== 'NONE') {
      fail(action.action_type + '縺ｫdeadline_basis縺ｯ謖・ｮ壹〒縺阪∪縺帙ｓ縲・);
    }
    if (!allowed.priority && action.priority !== 'MEDIUM') {
      fail(action.action_type + '縺ｫpriority縺ｯ謖・ｮ壹〒縺阪∪縺帙ｓ縲・);
    }
    if (!allowed.waiting_for_reply &&
        action.waiting_for_reply !== false) {
      fail(action.action_type + '縺ｫwaiting_for_reply縺ｯ謖・ｮ壹〒縺阪∪縺帙ｓ縲・);
    }
    if (!allowed.calendar &&
        (action.calendar_category !== 'NONE' ||
         action.calendar_importance !== 'LOW')) {
      fail(action.action_type + '縺ｫCalendar螻樊ｧ縺ｯ謖・ｮ壹〒縺阪∪縺帙ｓ縲・);
    }
  }

  function validateActionSemantics(action) {
    if (action.action_type === 'NEW_TASK' ||
        action.action_type === 'ADD_TASK') {
      if (action.target_task_id !== null) {
        fail(action.action_type + '縺ｫtarget_task_id縺ｯ謖・ｮ壹〒縺阪∪縺帙ｓ縲・);
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
        fail('UPDATE_DUE縺ｫ譛滄剞螟画峩縺後≠繧翫∪縺帙ｓ縲・);
      }
      if (hasDeadlineInChanges &&
          action.deadline !== null &&
          action.changes.due_date !== action.deadline) {
        fail('UPDATE_DUE縺ｮdeadline蛟､縺御ｸ閾ｴ縺励∪縺帙ｓ縲・);
      }
      var isDeletion = hasDeadlineInChanges &&
        action.changes.due_date === null;
      if (isDeletion &&
          (action.deadline !== null ||
           action.deadline_basis !== 'NONE')) {
        fail('UPDATE_DUE縺ｮ譛滄剞蜑企勁陦ｨ迴ｾ縺御ｸ肴ｭ｣縺ｧ縺吶・);
      }
      if (!isDeletion &&
          action.deadline_basis === 'NONE') {
        fail('UPDATE_DUE縺ｮ譛滄剞螟画峩縺ｫdeadline_basis縺後≠繧翫∪縺帙ｓ縲・);
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
        fail(action.action_type + '縺ｮwaiting_for_reply縺御ｸ肴ｭ｣縺ｧ縺吶・);
      }
    } else if (action.action_type === 'INFORMATION_ONLY') {
      if (action.target_task_id !== null) {
        fail(action.action_type + '縺ｫtarget_task_id縺ｯ謖・ｮ壹〒縺阪∪縺帙ｓ縲・);
      }
      requireNeutralFields(action);
      exactChangeFields(action, []);
    } else if (action.action_type === 'UNCLEAR') {
      if (action.target_task_id !== null) {
        fail(action.action_type + '縺ｫtarget_task_id縺ｯ謖・ｮ壹〒縺阪∪縺帙ｓ縲・);
      }
      exactChangeFields(action, []);
    }

    if (action.deadline_basis === 'INFERRED' &&
        (action.deadline !== null ||
         action.suggested_deadline === null)) {
      fail('AI謗ｨ貂ｬ譛滄剞縺ｯsuggested_deadline縺縺代↓謖・ｮ壹＠縺ｦ縺上□縺輔＞縲・);
    }
    if ((action.deadline_basis === 'EXPLICIT' ||
         action.deadline_basis === 'RELATIVE') &&
        action.deadline === null &&
        action.action_type !== 'UPDATE_DUE') {
      fail('譏守､ｺ縺ｾ縺溘・逶ｸ蟇ｾ譛滄剞縺ｫdeadline縺後≠繧翫∪縺帙ｓ縲・);
    }
  }

  function validateAction(action) {
    exactFields(action, ACTION_FIELDS, 'action');
    if (ACTION_TYPES.indexOf(action.action_type) === -1) {
      fail('譛ｪ遏･縺ｮAction縺ｧ縺吶・);
    }
    nullableString(action.target_task_id, 80, 'target_task_id');
    if (action.target_task_id !== null &&
        !/^tsk_[0-9a-f]{32}$/.test(action.target_task_id)) {
      fail('target_task_id縺ｮ蠖｢蠑上′荳肴ｭ｣縺ｧ縺吶・);
    }
    nullableString(action.task_title, 300, 'task_title');
    nullableDate(action.deadline, 'deadline');
    nullableDate(action.suggested_deadline, 'suggested_deadline');
    if (DEADLINE_BASES.indexOf(action.deadline_basis) === -1 ||
        PRIORITIES.indexOf(action.priority) === -1 ||
        CALENDAR_CATEGORIES.indexOf(action.calendar_category) === -1 ||
        CALENDAR_IMPORTANCE.indexOf(action.calendar_importance) === -1) {
      fail('Action縺ｮEnum縺御ｸ肴ｭ｣縺ｧ縺吶・);
    }
    if (typeof action.waiting_for_reply !== 'boolean' ||
        typeof action.needs_review !== 'boolean') {
      fail('Action縺ｮBoolean field縺御ｸ肴ｭ｣縺ｧ縺吶・);
    }
    finiteConfidence(action.confidence, 'confidence');
    if (typeof action.reason !== 'string' || action.reason.length > 1000) {
      fail('reason縺御ｸ肴ｭ｣縺ｧ縺吶・);
    }
    validateChanges(action.changes);

    if ((action.action_type === 'NEW_TASK' ||
         action.action_type === 'ADD_TASK') &&
        !String(action.task_title || '').trim()) {
      fail('譁ｰ隕週ask縺ｫtask_title縺後≠繧翫∪縺帙ｓ縲・);
    }
    if (['UPDATE_DUE', 'CANCEL_TASK', 'MARK_COMPLETE',
      'SET_WAITING', 'CLEAR_WAITING'].indexOf(action.action_type) !== -1 &&
        action.target_task_id === null) {
      // A null target can still be resolved by a unique Stable Thread Task,
      // therefore it remains structurally valid and is resolved by policy.
    }
    if (action.action_type === 'UNCLEAR' && !action.reason.trim()) {
      fail('UNCLEAR縺ｫreason縺後≠繧翫∪縺帙ｓ縲・);
    }
    validateActionSemantics(action);
  }

  function validateOutput(output) {
    exactFields(output, OUTPUT_FIELDS, 'classification');
    if (output.schema_version !== WorkOsConfig.AI_SCHEMA_VERSION) {
      fail('classification schema_version縺御ｸ閾ｴ縺励∪縺帙ｓ縲・);
    }
    finiteConfidence(output.overall_confidence, 'overall_confidence');
    if (!Array.isArray(output.actions) ||
        output.actions.length > WorkOsConfig.MAX_AI_ACTIONS) {
      fail('Action謨ｰ縺御ｸ企剞繧定ｶ・∴縺ｦ縺・∪縺吶・);
    }
    output.actions.forEach(validateAction);
    if (!Array.isArray(output.warnings) ||
        output.warnings.length > WorkOsConfig.MAX_AI_WARNINGS) {
      fail('warnings縺御ｸ肴ｭ｣縺ｧ縺吶・);
    }
    output.warnings.forEach(function (warning) {
      if (typeof warning !== 'string' || warning.length > 500) {
        fail('warning縺御ｸ肴ｭ｣縺ｧ縺吶・);
      }
    });
    return output;
  }

  function validateInput(input) {
    exactFields(
      input,
      ['schema_version', 'message', 'active_tasks', 'context', 'constraints'],
      'AI input'
    );
    if (input.schema_version !== WorkOsConfig.AI_SCHEMA_VERSION) {
      fail('AI input schema_version縺御ｸ閾ｴ縺励∪縺帙ｓ縲・);
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
        fail('message.' + field + '縺郡tring縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・);
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
      fail('message metadata縺ｾ縺溘・譛ｬ譁・ｸ企剞縺御ｸ肴ｭ｣縺ｧ縺吶・);
    }
    if (!Array.isArray(input.message.prior_messages) ||
        input.message.prior_messages.length >
          WorkOsConfig.EMAIL_CONTEXT_MAX_MESSAGES) {
      fail('prior_messages縺御ｸ肴ｭ｣縺ｧ縺吶・);
    }
    input.message.prior_messages.forEach(function (message) {
      exactFields(
        message,
        ['message_id', 'sender', 'received_at', 'plain_body'],
        'prior_message'
      );
      Object.keys(message).forEach(function (field) {
        if (typeof message[field] !== 'string') {
          fail('prior_message縺ｮ蝙九′荳肴ｭ｣縺ｧ縺吶・);
        }
      });
      if (!message.message_id ||
          Number.isNaN(Date.parse(message.received_at)) ||
          Array.from(message.plain_body).length >
            WorkOsConfig.EMAIL_CONTEXT_MAX_CHARS) {
        fail('prior_message譛ｬ譁・′荳企剞繧定ｶ・∴縺ｦ縺・∪縺吶・);
      }
    });
    if (!Array.isArray(input.active_tasks) || input.active_tasks.length > 20) {
      fail('active_tasks縺御ｸ肴ｭ｣縺ｧ縺吶・);
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
        fail('active_task縺ｮ蝙九′荳肴ｭ｣縺ｧ縺吶・);
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
        fail('active_task縺ｮ隴伜挨蟄舌∵律莉倥∪縺溘・manual_fields縺御ｸ肴ｭ｣縺ｧ縺吶・);
      }
    });
    exactFields(input.context, ['today', 'timezone'], 'context');
    if (!WorkOsUtilities.isValidIsoDate(input.context.today) ||
        input.context.timezone !== WorkOsConfig.TIMEZONE) {
      fail('context縺御ｸ肴ｭ｣縺ｧ縺吶・);
    }
    exactFields(
      input.constraints,
      ['max_actions', 'no_attachment_analysis', 'no_email_send'],
      'constraints'
    );
    if (input.constraints.max_actions !== WorkOsConfig.MAX_AI_ACTIONS ||
        input.constraints.no_attachment_analysis !== true ||
        input.constraints.no_email_send !== true) {
      fail('constraints縺御ｸ肴ｭ｣縺ｧ縺吶・);
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
      deadline: value.deadline …3517 tokens truncated…{
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
        '螟夜ΚAI Adapter縺ｮProvider縺ｾ縺溘・騾壻ｿ｡蠅・阜縺梧悴險ｭ螳壹〒縺吶・
      );
    }
    if (settings.company_approved !== true ||
        settings.data_policy_approved !== true ||
        settings.credential_storage_approved !== true) {
      externalConfigError(
        'E_AI_APPROVAL_REQUIRED',
        '螟夜ΚAI蛻ｩ逕ｨ縺ｮ謇ｿ隱阪∪縺溘・諠・ｱ邂｡逅・擅莉ｶ縺梧悴遒ｺ隱阪〒縺吶・
      );
    }
    if (settings.auth_configured !== true ||
        !credentialIsConfigured(settings.credential_provider)) {
      externalConfigError(
        'E_AI_CREDENTIAL_NOT_CONFIGURED',
        '螟夜ΚAI credential縺悟ｮ牙・縺ｫ險ｭ螳壹＆繧後※縺・∪縺帙ｓ縲・
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
        '螟夜ΚAI縺ｮtimeout縺ｾ縺溘・response荳企剞險ｭ螳壹′荳肴ｭ｣縺ｧ縺吶・
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
        'AI input縺悟宍蟇・↑Schema縺ｨ荳閾ｴ縺励∪縺帙ｓ縲・
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
        'AI request timeout縺悟ｮ牙・縺ｪ荳企剞縺ｨ荳閾ｴ縺励∪縺帙ｓ縲・
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
        'AI transport縺梧ｧ矩蛹悶お繝ｩ繝ｼ繧定ｿ斐＠縺ｾ縺励◆縲・
      );
    }
    var kind = String(error && error.ai_error_kind || '').toUpperCase();
    if (kind === 'TIMEOUT') {
      return aiFailure(
        'E_AI_TIMEOUT',
        'AI_REQUEST',
        true,
        'AI request縺梧凾髢灘・縺ｫ螳御ｺ・＠縺ｾ縺帙ｓ縺ｧ縺励◆縲・
      );
    }
    return aiFailure(
      'E_AI_NETWORK',
      'AI_REQUEST',
      true,
      'AI transport縺ｸ螳牙・縺ｫ謗･邯壹〒縺阪∪縺帙ｓ縺ｧ縺励◆縲・
    );
  }

  function responseStatusFailure(response) {
    var status = Number(response && response.status);
    var normalizedKind = String(
      response && response.error_kind || ''
    ).toUpperCase();
    if (normalizedKind === 'UNSUPPORTED_MODEL') {
      return aiFailure(
        'E_AI_MODEL_UNSUPPORTED',
        'AI_REQUEST',
        false,
        '險ｭ螳壹＆繧後◆AI model縺ｯProvider縺ｧ蛻ｩ逕ｨ縺ｧ縺阪∪縺帙ｓ縲・
      );
    }
    if (status === 408) {
      return aiFailure(
        'E_AI_TIMEOUT',
        'AI_REQUEST',
        true,
        'AI request縺梧凾髢灘・縺ｫ螳御ｺ・＠縺ｾ縺帙ｓ縺ｧ縺励◆縲・
      );
    }
    if (status === 429) {
      return aiFailure(
        'E_AI_RATE_LIMIT',
        'AI_REQUEST',
        true,
        'AI Provider縺ｮ荳譎ら噪縺ｪ蛻ｩ逕ｨ荳企剞縺ｫ驕斐＠縺ｾ縺励◆縲・
      );
    }
    if (status >= 500 && status <= 599) {
      return aiFailure(
        'E_AI_UPSTREAM',
        'AI_REQUEST',
        true,
        'AI Provider縺ｧ荳譎ら噪縺ｪ髫懷ｮｳ縺檎匱逕溘＠縺ｾ縺励◆縲・
      );
    }
    if (status === 401) {
      return aiFailure(
        'E_AI_AUTH',
        'AI_REQUEST',
        false,
        'AI Provider縺ｮ隱崎ｨｼ繧堤｢ｺ隱阪〒縺阪∪縺帙ｓ縲・
      );
    }
    if (status === 403) {
      return aiFailure(
        'E_AI_PERMISSION',
        'AI_REQUEST',
        false,
        'AI Provider縺ｮ蛻ｩ逕ｨ讓ｩ髯舌ｒ遒ｺ隱阪〒縺阪∪縺帙ｓ縲・
      );
    }
    if (status >= 400 && status <= 499) {
      return aiFailure(
        'E_AI_INVALID_REQUEST',
        'AI_REQUEST',
        false,
        'AI request縺訓rovider縺ｮ螂醍ｴ・→荳閾ｴ縺励∪縺帙ｓ縲・
      );
    }
    if (!Number.isInteger(status) || status < 200 || status > 299) {
      return aiFailure(
        'E_AI_NETWORK',
        'AI_REQUEST',
        true,
        'AI transport縺九ｉ譛牙柑縺ｪstatus繧貞叙蠕励〒縺阪∪縺帙ｓ縺ｧ縺励◆縲・
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
        'AI response縺檎ｩｺ縺ｧ縺吶・
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
        'AI response縺悟ｮ牙・縺ｪ荳企剞繧定ｶ・∴縺ｦ縺・∪縺吶・
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
        'AI response繧谷SON縺ｨ縺励※隗｣譫舌〒縺阪∪縺帙ｓ縲・
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
        'AI response縺悟宍蟇・↑Schema縺ｨ荳閾ｴ縺励∪縺帙ｓ縲・
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
          'AI request繧貞ｮ牙・縺ｫ髢句ｧ九〒縺阪ｋ螳溯｡御ｺ育ｮ励′谿九▲縺ｦ縺・∪縺帙ｓ縲・
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
        '螟夜ΚAI credential繧貞ｮ牙・縺ｫ蜿門ｾ励〒縺阪∪縺帙ｓ縲・
      );
    }
    if (credential == null || credential === '') {
      externalConfigError(
        'E_AI_CREDENTIAL_NOT_CONFIGURED',
        '螟夜ΚAI credential縺悟ｮ牙・縺ｫ險ｭ螳壹＆繧後※縺・∪縺帙ｓ縲・
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
        'production AI factory縺ｸ縺ｮ萓晏ｭ俶ｳｨ蜈･縺ｯTest mode縺縺代〒蛻ｩ逕ｨ縺ｧ縺阪∪縺吶・
      );
    }
    var config = productionConfigSnapshot(settings.config || {});
    var registry = settings.registry ||
      EMPTY_PRODUCTION_PROVIDER_REGISTRY;
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
        '螟夜ΚAI production Adapter縺ｮ蜑肴署縺梧悴遒ｺ螳壹〒縺吶・
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
        'AI Adapter mode縺梧悴蟇ｾ蠢懊〒縺吶・
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
    validateAdapterConfig: validateAdapterConfig,
    buildCanonicalRequest: buildCanonicalRequest,
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

