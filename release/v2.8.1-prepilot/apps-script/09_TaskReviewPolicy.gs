/**
 * Phase 3 Task review and classification-application policy.
 *
 * Policy decisions are deterministic and provider-neutral. Existing Task
 * business fields are never changed by an AI action; all existing changes are
 * staged in pending fields until a human accepts them.
 */
var WorkOsTaskReviewPolicy = (function () {
  var TERMINAL_STATUSES = Object.freeze({
    DONE: true,
    EXCLUDED: true,
    CANCELLED: true
  });
  var MANUAL_PROTECTED_FIELDS = Object.freeze([
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

  function isActiveTask(task) {
    return task && !TERMINAL_STATUSES[String(task.status || '')];
  }

  function isHighImpact(action) {
    return action.calendar_importance === 'HIGH' ||
      action.calendar_category === 'LEGAL_TAX_REGULATORY' ||
      action.calendar_category === 'OTHER_HIGH_IMPACT';
  }

  function safeNewAction(action, classification) {
    return (action.action_type === 'NEW_TASK' ||
        action.action_type === 'ADD_TASK') &&
      action.confidence >= 0.85 &&
      classification.overall_confidence >= 0.85 &&
      action.needs_review === false &&
      classification.warnings.length === 0 &&
      action.deadline_basis !== 'AMBIGUOUS' &&
      action.deadline_basis !== 'INFERRED' &&
      !isHighImpact(action);
  }

  function sourceDate(value) {
    var parsed = new Date(String(value || ''));
    return Number.isNaN(parsed.getTime()) ? '' : parsed;
  }

  function classificationProvenance(environment) {
    return WorkOsAiAdapter.validateProvenance(
      environment && environment.ai_provenance ||
        WorkOsAiAdapter.getMetadata(null)
    );
  }

  function newTaskFromAction(action, classification, actionIndex, environment) {
    var safe = safeNewAction(action, classification);
    var inferred = action.deadline_basis === 'INFERRED';
    var formalDeadline = !inferred &&
      action.deadline_basis !== 'AMBIGUOUS'
      ? action.deadline
      : null;
    var suggested = action.suggested_deadline ||
      (inferred ? action.deadline : null);
    var message = environment.preprocessed;
    var provenance = classificationProvenance(environment);
    return {
      origin_key: WorkOsUtilities.makeOriginKey(
        message.message_id,
        actionIndex
      ),
      task_title: String(action.task_title ||
        (action.action_type === 'UNCLEAR'
          ? '内容確認が必要なメール'
          : '既存タスク変更の確認')),
      status: safe ? 'OPEN' : 'REVIEW',
      needs_review: !safe,
      decision: 'NONE',
      review_state: safe ? 'NONE' : 'OPEN',
      review_type: safe ? '' : (
        action.action_type === 'NEW_TASK' ||
        action.action_type === 'ADD_TASK'
          ? 'NEW_TASK'
          : 'TARGET_UNRESOLVED'
      ),
      completed: false,
      excluded: false,
      due_date: formalDeadline || '',
      suggested_due_date: suggested || '',
      deadline_basis: action.deadline_basis,
      priority: action.priority,
      waiting_for_reply: action.waiting_for_reply,
      calendar_sync_mode: 'AUTO',
      comment: '',
      sender: message.sender,
      subject: message.subject,
      received_at: sourceDate(message.received_at),
      source_email: String(message.source_email || ''),
      source_message_id: message.message_id,
      source_thread_id: message.thread_id,
      stable_thread_key: message.stable_thread_key,
      source_action_index: actionIndex,
      ai_action_type: action.action_type,
      ai_reason: action.reason,
      ai_confidence: action.confidence,
      ai_provider: provenance.provider,
      ai_model: provenance.model,
      ai_prompt_version: provenance.prompt_version,
      calendar_category: action.calendar_category,
      calendar_importance: action.calendar_importance,
      calendar_sync_status: 'NOT_REQUIRED',
      schedule_state: 'NONE',
      pending_action_type: safe ? '' : (
        action.action_type === 'NEW_TASK' ||
        action.action_type === 'ADD_TASK' ||
        action.action_type === 'UNCLEAR'
          ? ''
          : action.action_type
      ),
      pending_changes_json: safe ||
        action.action_type === 'NEW_TASK' ||
        action.action_type === 'ADD_TASK' ||
        action.action_type === 'UNCLEAR'
        ? {}
        : {
          origin_key: WorkOsUtilities.makeOriginKey(
            message.message_id,
            actionIndex
          ),
          action_type: action.action_type,
          changes: changesForAction(action),
          ai_provenance: provenance,
          target_resolution: 'UNRESOLVED'
        }
    };
  }

  function changesForAction(action) {
    var changes = {};
    if (action.action_type === 'UPDATE_DUE') {
      changes.due_date =
        Object.prototype.hasOwnProperty.call(action.changes, 'due_date')
          ? action.changes.due_date
          : action.deadline;
    } else if (action.action_type === 'MARK_COMPLETE') {
      changes.completed = true;
      changes.status = 'DONE';
    } else if (action.action_type === 'CANCEL_TASK') {
      changes.status = 'CANCELLED';
    } else if (action.action_type === 'SET_WAITING') {
      changes.waiting_for_reply = true;
      changes.status = 'WAITING';
    } else if (action.action_type === 'CLEAR_WAITING') {
      changes.waiting_for_reply = false;
      changes.status = 'OPEN';
    }
    Object.keys(action.changes || {}).forEach(function (field) {
      if (field !== 'comment') {
        changes[field] = action.changes[field];
      }
    });
    delete changes.comment;
    return changes;
  }

  function resolveTarget(action, taskContext, preprocessed) {
    if (action.target_task_id) {
      var inputTasks = Array.isArray(preprocessed.active_tasks)
        ? preprocessed.active_tasks
        : [];
      var presentInInput = inputTasks.some(function (task) {
        return task &&
          String(task.task_id || '') === action.target_task_id;
      });
      var explicit = WorkOsTaskRepository.findByTaskId(
        taskContext,
        action.target_task_id
      );
      var sameThread = Boolean(explicit) &&
        String(explicit.stable_thread_key || '') ===
          String(preprocessed.stable_thread_key || '');
      var resolvable = presentInInput &&
        Boolean(explicit) &&
        sameThread &&
        isActiveTask(explicit);
      return {
        task: resolvable ? explicit : null,
        ambiguous: false,
        fabricated: !resolvable,
        outside_active_input: !presentInInput,
        repository_missing: !explicit,
        thread_mismatch: Boolean(explicit) && !sameThread
      };
    }
    var candidates = WorkOsTaskRepository.findByStableThreadKey(
      taskContext,
      preprocessed.stable_thread_key
    ).filter(isActiveTask);
    return {
      task: candidates.length === 1 ? candidates[0] : null,
      ambiguous: candidates.length !== 1,
      fabricated: false,
      outside_active_input: false,
      repository_missing: false,
      thread_mismatch: false
    };
  }

  function manualConflicts(task, changes) {
    var manual = Array.isArray(task.manual_fields) ? task.manual_fields : [];
    return Object.keys(changes).filter(function (field) {
      return manual.indexOf(field) !== -1;
    });
  }

  function isPastDue(changes, today) {
    return typeof changes.due_date === 'string' &&
      WorkOsUtilities.isValidIsoDate(changes.due_date) &&
      changes.due_date < today;
  }

  function applyClassification(classification, environment) {
    WorkOsAiAdapter.validateOutput(classification);
    var taskContext = environment.task_context;
    var message = environment.preprocessed;
    var results = [];
    classification.actions.forEach(function (action, actionIndex) {
      var originKey = WorkOsUtilities.makeOriginKey(
        message.message_id,
        actionIndex
      );
      if (action.action_type === 'INFORMATION_ONLY') {
        results.push({
          action_index: actionIndex,
          operation: 'NO_TASK',
          origin_key: originKey
        });
        return;
      }
      if (action.action_type === 'NEW_TASK' ||
          action.action_type === 'ADD_TASK' ||
          action.action_type === 'UNCLEAR') {
        var created = WorkOsTaskRepository.upsertTask(
          newTaskFromAction(
            action,
            classification,
            actionIndex,
            environment
          ),
          taskContext
        );
        results.push({
          action_index: actionIndex,
          operation: created.operation,
          task_id: created.task_id,
          origin_key: originKey
        });
        return;
      }

      var resolution = resolveTarget(
        action,
        taskContext,
        message
      );
      if (!resolution.task) {
        var unresolved = WorkOsTaskRepository.upsertTask(
          newTaskFromAction(
            action,
            classification,
            actionIndex,
            environment
          ),
          taskContext
        );
        results.push({
          action_index: actionIndex,
          operation: unresolved.operation,
          task_id: unresolved.task_id,
          origin_key: originKey,
          target_unresolved: true,
          target_ambiguous: resolution.ambiguous,
          fabricated_target: resolution.fabricated,
          target_outside_active_input: resolution.outside_active_input,
          target_repository_missing: resolution.repository_missing,
          target_thread_mismatch: resolution.thread_mismatch
        });
        return;
      }

      var changes = changesForAction(action);
      var provenance = classificationProvenance(environment);
      var conflicts = manualConflicts(resolution.task, changes);
      var existingPending = resolution.task.pending_changes_json &&
        typeof resolution.task.pending_changes_json === 'object' &&
        !Array.isArray(resolution.task.pending_changes_json)
        ? resolution.task.pending_changes_json
        : {};
      if (resolution.task.pending_action_type &&
          existingPending.origin_key !== originKey) {
        var conflictReviewTask = newTaskFromAction(
          action,
          classification,
          actionIndex,
          environment
        );
        conflictReviewTask.review_type = 'PENDING_CONFLICT';
        conflictReviewTask.pending_changes_json.target_task_id =
          resolution.task.task_id;
        var conflictReview = WorkOsTaskRepository.upsertTask(
          conflictReviewTask,
          taskContext
        );
        results.push({
          action_index: actionIndex,
          operation: conflictReview.operation,
          task_id: conflictReview.task_id,
          origin_key: originKey,
          pending_conflict: true
        });
        return;
      }
      var pending = WorkOsTaskRepository.stagePendingChange(
        resolution.task.task_id,
        action.action_type,
        {
          origin_key: originKey,
          source_message_id: message.message_id,
          source_action_index: actionIndex,
          changes: changes,
          manual_conflicts: conflicts,
          past_due: isPastDue(changes, message.today),
          target_ambiguous: resolution.ambiguous,
          ai_confidence: action.confidence,
          ai_reason: action.reason,
          ai_provenance: provenance
        },
        taskContext
      );
      results.push({
        action_index: actionIndex,
        operation: pending.operation,
        task_id: resolution.task.task_id,
        origin_key: originKey,
        pending: true,
        manual_conflicts: conflicts
      });
    });
    return results;
  }

  function decisionPatch(task, decision) {
    var normalizedDecision = String(decision || '');
    if (normalizedDecision !== 'ACCEPT' && normalizedDecision !== 'REJECT') {
      return {};
    }
    if ((task.review_state === 'APPLIED' ||
         task.review_state === 'REJECTED')) {
      return {};
    }
    var patch = {};
    var pending = task.pending_changes_json &&
      typeof task.pending_changes_json === 'object' &&
      !Array.isArray(task.pending_changes_json)
      ? task.pending_changes_json
      : {};
    var hasPending = Boolean(task.pending_action_type) &&
      pending.changes &&
      typeof pending.changes === 'object';
    if (normalizedDecision === 'ACCEPT') {
      if (hasPending) {
        Object.keys(pending.changes).forEach(function (field) {
          if (field !== 'comment') {
            patch[field] = pending.changes[field];
          }
        });
      } else {
        patch.status = 'OPEN';
        patch.excluded = false;
      }
      patch.needs_review = false;
      patch.decision = 'ACCEPT';
      patch.review_state = 'APPLIED';
    } else {
      if (!hasPending) {
        patch.status = 'EXCLUDED';
        patch.excluded = true;
        patch.completed = false;
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

  function computeAiLabels(tasks) {
    var active = (tasks || []).filter(isActiveTask);
    var labels = [];
    if (active.length) {
      labels.push('AI/要対応');
    }
    if (active.some(function (task) { return Boolean(task.due_date); })) {
      labels.push('AI/期限');
    }
    if (active.some(function (task) {
      return task.waiting_for_reply === true || task.status === 'WAITING';
    })) {
      labels.push('AI/返信待');
    }
    if ((tasks || []).some(function (task) {
      return task.needs_review === true;
    })) {
      labels.push('AI/要確認');
    }
    return labels;
  }

  return Object.freeze({
    MANUAL_PROTECTED_FIELDS: MANUAL_PROTECTED_FIELDS,
    isActiveTask: isActiveTask,
    safeNewAction: safeNewAction,
    changesForAction: changesForAction,
    applyClassification: applyClassification,
    decisionPatch: decisionPatch,
    computeAiLabels: computeAiLabels
  });
}());
