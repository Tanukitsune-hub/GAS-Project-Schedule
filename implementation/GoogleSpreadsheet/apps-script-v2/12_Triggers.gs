/**
 * Phase 6 automation boundary.
 *
 * Setup creates only the owner-authorized installable Task edit Trigger.
 * The independent time-driven Trigger can be created only by the explicit
 * enableAutomation() entry point after every prerequisite passes.
 */
var WorkOsAutomation = (function () {
  function injected(options) {
    var settings = options || {};
    if (Object.keys(settings).length && !WorkOsConfig.TEST_MODE) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        'AUTOMATION',
        false,
        'Automation依存注入はTest modeだけで利用できます。'
      );
    }
    return settings;
  }

  function properties(settings) {
    return settings.properties ||
      PropertiesService.getScriptProperties();
  }

  function scriptService(settings) {
    return settings.script_app || ScriptApp;
  }

  function triggerId(trigger) {
    try {
      return String(trigger && trigger.getUniqueId() || '');
    } catch (error) {
      return '';
    }
  }

  function handlerName(trigger) {
    try {
      return String(trigger && trigger.getHandlerFunction() || '');
    } catch (error) {
      return '';
    }
  }

  function handlerTriggers(scriptApp) {
    return (scriptApp.getProjectTriggers() || []).filter(function (trigger) {
      return handlerName(trigger) ===
        WorkOsConfig.AUTOMATION_HANDLER_FUNCTION;
    });
  }

  function isClockTrigger(trigger) {
    try {
      return String(trigger && trigger.getEventType
        ? trigger.getEventType()
        : '') === 'CLOCK';
    } catch (error) {
      return false;
    }
  }

  function automationTriggers(scriptApp) {
    return handlerTriggers(scriptApp).filter(isClockTrigger);
  }

  function editHandlerTriggers(scriptApp) {
    return (scriptApp.getProjectTriggers() || []).filter(function (trigger) {
      return handlerName(trigger) === WorkOsConfig.EDIT_HANDLER_FUNCTION;
    });
  }

  function isEditTrigger(trigger) {
    try {
      return String(trigger && trigger.getEventType
        ? trigger.getEventType()
        : '') === 'ON_EDIT';
    } catch (error) {
      return false;
    }
  }

  function triggerSourceId(trigger) {
    try {
      return String(trigger && trigger.getTriggerSourceId
        ? trigger.getTriggerSourceId()
        : '');
    } catch (error) {
      return '';
    }
  }

  function spreadsheetId(spreadsheet) {
    try {
      return String(spreadsheet && spreadsheet.getId
        ? spreadsheet.getId()
        : '');
    } catch (error) {
      return '';
    }
  }

  function correctEditTrigger(trigger, spreadsheet) {
    if (!isEditTrigger(trigger)) {
      return false;
    }
    var actualSourceId = triggerSourceId(trigger);
    var expectedSourceId = spreadsheetId(spreadsheet);
    return Boolean(
      actualSourceId &&
      expectedSourceId &&
      actualSourceId === expectedSourceId
    );
  }

  function principalEmail(principal) {
    try {
      return String(principal && principal.getEmail
        ? principal.getEmail()
        : '').trim().toLowerCase();
    } catch (error) {
      return '';
    }
  }

  function assertSpreadsheetOwner(settings, spreadsheet) {
    if (WorkOsConfig.TEST_MODE && settings.owner_verified === true) {
      return true;
    }
    var owner = spreadsheet && spreadsheet.getOwner
      ? spreadsheet.getOwner()
      : null;
    var session = settings.session ||
      (typeof Session !== 'undefined' ? Session : null);
    var effectiveUser = session &&
      typeof session.getEffectiveUser === 'function'
      ? session.getEffectiveUser()
      : null;
    var ownerEmail = principalEmail(owner);
    var effectiveEmail = principalEmail(effectiveUser);
    if (!ownerEmail || !effectiveEmail || ownerEmail !== effectiveEmail) {
      throw new WorkOsAppError(
        'E_EDIT_TRIGGER_OWNER_REQUIRED',
        'EDIT_TRIGGER',
        false,
        'Spreadsheet所有者本人だけがTask編集Triggerを作成できます。'
      );
    }
    return true;
  }

  function editTriggerStatusInternal(settings) {
    var spreadsheet = settings.spreadsheet ||
      SpreadsheetApp.getActiveSpreadsheet();
    var scriptApp = scriptService(settings);
    var props = properties(settings);
    var triggers = editHandlerTriggers(scriptApp);
    var correct = triggers.filter(function (trigger) {
      return correctEditTrigger(trigger, spreadsheet);
    });
    var storedId = String(props.getProperty(
      WorkOsConfig.PROPERTIES.EDIT_TRIGGER_ID
    ) || '');
    var canonical = correct.filter(function (trigger) {
      return storedId && triggerId(trigger) === storedId;
    })[0] || null;
    var consistent = triggers.length === 1 &&
      correct.length === 1 &&
      Boolean(canonical);
    return {
      status: consistent ? 'CONSISTENT' : 'INCONSISTENT',
      trigger_count: triggers.length,
      edit_trigger_count: correct.length,
      invalid_trigger_count: triggers.length - correct.length,
      stored_trigger_id_present: Boolean(storedId),
      canonical_trigger_present: Boolean(canonical),
      owner_authorization_required: true,
      google_workspace_trigger_list: settings.script_app
        ? 'LOCAL_FAKE'
        : 'REAL_READ'
    };
  }

  function getEditTriggerStatus(options) {
    return editTriggerStatusInternal(injected(options));
  }

  function ensureEditTriggerUnlocked(settings) {
    var spreadsheet = settings.spreadsheet ||
      SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      throw new WorkOsAppError(
        'E_SETUP_NOT_BOUND',
        'EDIT_TRIGGER',
        false,
        'Bound Spreadsheetを確認できません。'
      );
    }
    assertSpreadsheetOwner(settings, spreadsheet);
    var scriptApp = scriptService(settings);
    var props = properties(settings);
    var triggers = editHandlerTriggers(scriptApp);
    var storedId = String(props.getProperty(
      WorkOsConfig.PROPERTIES.EDIT_TRIGGER_ID
    ) || '');
    var correct = triggers.filter(function (trigger) {
      return correctEditTrigger(trigger, spreadsheet);
    });
    var keep = correct.filter(function (trigger) {
      return storedId && triggerId(trigger) === storedId;
    })[0] || correct[0] || null;
    var removed = 0;
    triggers.forEach(function (trigger) {
      if (trigger === keep) {
        return;
      }
      scriptApp.deleteTrigger(trigger);
      removed += 1;
    });
    if (!keep) {
      try {
        keep = scriptApp.newTrigger(
          WorkOsConfig.EDIT_HANDLER_FUNCTION
        ).forSpreadsheet(spreadsheet).onEdit().create();
      } catch (error) {
        throw new WorkOsAppError(
          'E_EDIT_TRIGGER_CREATE',
          'EDIT_TRIGGER',
          false,
          'Task編集Triggerを安全に作成できませんでした。'
        );
      }
    }
    var createdId = triggerId(keep);
    if (!createdId || !correctEditTrigger(keep, spreadsheet)) {
      try {
        scriptApp.deleteTrigger(keep);
      } catch (cleanupError) {
        // A non-canonical edit Trigger is rejected by handleTaskEdit.
      }
      props.deleteProperty(WorkOsConfig.PROPERTIES.EDIT_TRIGGER_ID);
      throw new WorkOsAppError(
        'E_EDIT_TRIGGER_CREATE',
        'EDIT_TRIGGER',
        false,
        'Task編集Triggerの所有情報を確認できませんでした。'
      );
    }
    props.setProperty(
      WorkOsConfig.PROPERTIES.EDIT_TRIGGER_ID,
      createdId
    );
    return {
      status: 'CONSISTENT',
      created: correct.indexOf(keep) === -1,
      trigger_count: 1,
      removed_count: removed,
      handler: WorkOsConfig.EDIT_HANDLER_FUNCTION,
      event_type: 'ON_EDIT',
      owner_verified: true
    };
  }

  function ensureEditTrigger(options) {
    var settings = injected(options);
    return withAutomationMutation(settings, function () {
      return ensureEditTriggerUnlocked(settings);
    });
  }

  function withAutomationMutation(settings, callback) {
    if (typeof LockService === 'undefined' ||
        typeof LockService.getDocumentLock !== 'function') {
      throw new WorkOsAppError(
        'E_LOCK_UNAVAILABLE',
        'AUTOMATION_TRIGGER',
        false,
        'Automation Trigger管理Lockを利用できません。'
      );
    }
    var lock = LockService.getDocumentLock();
    if (!lock ||
        !lock.tryLock(WorkOsConfig.LOCK_WAIT_MS)) {
      throw new WorkOsAppError(
        'E_LOCK_TIMEOUT',
        'AUTOMATION_TRIGGER',
        true,
        '別のTrigger管理処理が実行中です。'
      );
    }
    try {
      return callback(lock);
    } finally {
      lock.releaseLock();
    }
  }

  function inspectAutomationSheetSchemasInternal(settings) {
    var spreadsheet = settings.spreadsheet ||
      SpreadsheetApp.getActiveSpreadsheet();
    var missing = [];
    var mismatched = [];
    Object.keys(WorkOsConfig.SHEETS).forEach(function (key) {
      var sheetName = WorkOsConfig.SHEETS[key];
      var sheet = spreadsheet &&
        spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        missing.push(sheetName);
        return;
      }
      try {
        var width = WorkOsSchemas.getSheetSchema(sheetName).length;
        var rows = sheet.getRange(
          WorkOsConfig.HEADER_ID_ROW,
          1,
          2,
          width
        ).getValues();
        var comparison = WorkOsSchemas.compareHeaders(
          sheetName,
          rows[0],
          rows[1]
        );
        if (!comparison.idsMatch || !comparison.headersMatch) {
          mismatched.push(sheetName);
        }
      } catch (error) {
        mismatched.push(sheetName);
      }
    });
    return {
      ok: missing.length === 0 && mismatched.length === 0,
      missing_sheet_count: missing.length,
      mismatched_schema_count: mismatched.length,
      missing_sheets: missing,
      mismatched_sheets: mismatched
    };
  }

  function inspectAutomationSheetSchemas(options) {
    return inspectAutomationSheetSchemasInternal(injected(options));
  }

  function appendScopeDecisionReasons(reasons) {
    if (WorkOsConfig.AUTOMATION_NEWSLETTER_FILTER_APPROVED !== true) {
      reasons.push('NEWSLETTER_FILTER_DECISION_PENDING');
    }
    if (WorkOsConfig
      .AUTOMATION_CALENDAR_NOTIFICATION_FILTER_APPROVED !== true) {
      reasons.push('CALENDAR_NOTIFICATION_FILTER_DECISION_PENDING');
    }
  }

  function appendSharedPreflightReasons(settings, reasons) {
    if (typeof WorkOsRuntimeSettings === 'undefined' ||
        !WorkOsRuntimeSettings ||
        typeof WorkOsRuntimeSettings.collectCurrentPreflight !==
          'function') {
      if (!WorkOsConfig.TEST_MODE) {
        reasons.push('SHARED_PREFLIGHT_UNAVAILABLE');
      }
      return null;
    }
    try {
      var spreadsheet = settings.spreadsheet ||
        SpreadsheetApp.getActiveSpreadsheet();
      var result = WorkOsRuntimeSettings.collectCurrentPreflight(
        spreadsheet
      );
      (result.reasons || []).forEach(function (reason) {
        if (reasons.indexOf(reason) === -1) {
          reasons.push(reason);
        }
      });
      return result;
    } catch (error) {
      reasons.push('SHARED_PREFLIGHT_UNAVAILABLE');
      return null;
    }
  }

  function safeRuntimeSettings(preflight) {
    var snapshot = preflight && preflight.runtime_settings;
    if (!snapshot) {
      return null;
    }
    return {
      source: String(snapshot.source || ''),
      settings_read_count: Number(snapshot.settings_read_count || 0),
      manual_max_messages: Number(snapshot.manual_max_messages || 0),
      automation_max_messages_per_run:
        Number(snapshot.automation_max_messages_per_run || 0),
      manual_worker_soft_limit_ms:
        Number(snapshot.manual_worker_soft_limit_ms || 0),
      automation_worker_soft_limit_ms:
        Number(snapshot.automation_worker_soft_limit_ms || 0),
      lock_wait_ms: Number(snapshot.lock_wait_ms || 0)
    };
  }

  function addUniqueReason(reasons, reason) {
    var value = String(reason || '');
    if (value && reasons.indexOf(value) === -1) {
      reasons.push(value);
    }
  }

  function safeReadinessToken(value, fallback) {
    var text = String(value == null ? '' : value);
    return /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(text)
      ? text
      : (text ? 'INVALID' : String(fallback || 'MISSING'));
  }

  function safeVersionToken(value) {
    var text = String(value == null ? '' : value);
    return /^\d+(?:\.\d+){0,3}(?:-[A-Za-z0-9]+)?$/.test(text)
      ? text
      : (text ? 'INVALID' : 'MISSING');
  }

  function safeCount(value, maximum) {
    var count = Number(value);
    return Number.isInteger(count) && count >= 0 && count <= maximum
      ? count
      : 0;
  }

  function qualificationScopeSnapshot() {
    var query = String(WorkOsConfig.AUTOMATION_GMAIL_QUERY || '');
    var subject = String(WorkOsConfig.AUTOMATION_SYNTHETIC_SUBJECT || '');
    var exactQuery = Boolean(
      query.indexOf('in:inbox') !== -1 &&
      query.indexOf('-in:spam') !== -1 &&
      query.indexOf('-in:trash') !== -1 &&
      query.indexOf('-label:手動/除外') !== -1 &&
      query.indexOf('subject:"' + subject + '"') !== -1
    );
    var exactSubject = Boolean(
      subject &&
      typeof WorkOsGeminiProvider !== 'undefined' &&
      WorkOsGeminiProvider &&
      String(WorkOsGeminiProvider.AUTOMATION_SYNTHETIC_SUBJECT || '') ===
        subject
    );
    var bodyGuard = Boolean(
      typeof WorkOsGeminiProvider !== 'undefined' &&
      WorkOsGeminiProvider &&
      typeof WorkOsGeminiProvider.isAutomationSyntheticBody === 'function' &&
      String(WorkOsGeminiProvider.AUTOMATION_SYNTHETIC_BODY || '') ===
        String(WorkOsConfig.AUTOMATION_SYNTHETIC_BODY || '')
    );
    var scopeExact =
      WorkOsConfig.AUTOMATION_QUALIFICATION_SCOPE ===
        'SYNTHETIC_AUTOMATION_QUALIFICATION_ONLY' &&
      WorkOsConfig.AUTOMATION_QUALIFICATION_SOURCE_MODE ===
        'AUTOMATIC_QUALIFICATION';
    return {
      ready: scopeExact && exactQuery && exactSubject && bodyGuard,
      scope: String(WorkOsConfig.AUTOMATION_QUALIFICATION_SCOPE || ''),
      source_mode: safeReadinessToken(
        WorkOsConfig.AUTOMATION_QUALIFICATION_SOURCE_MODE,
        'MISSING'
      ),
      exact_subject: subject,
      exact_query_active: exactQuery,
      exact_body_guard_active: bodyGuard
    };
  }

  function pilotScopeSnapshot() {
    var query = String(
      WorkOsConfig.AUTOMATION_PILOT_GMAIL_QUERY || ''
    );
    var exactQuery = query === String(
      WorkOsConfig.AUTOMATION_PILOT_GMAIL_QUERY || ''
    ) &&
      query.indexOf('in:inbox') !== -1 &&
      query.indexOf('-in:spam') !== -1 &&
      query.indexOf('-in:trash') !== -1 &&
      query.indexOf('label:手動/取込') !== -1 &&
      query.indexOf('-label:手動/除外') !== -1;
    var scopeExact =
      WorkOsConfig.AUTOMATION_PILOT_SCOPE ===
        'LABEL_GATED_PERSONAL_SHADOW_PILOT' &&
      WorkOsConfig.AUTOMATION_PILOT_ADMISSION_MODE === 'LABEL_GATED' &&
      WorkOsConfig.AUTOMATION_PILOT_SOURCE_MODE === 'AUTOMATIC_PILOT';
    return {
      ready: scopeExact && exactQuery &&
        WorkOsConfig.AUTOMATION_PILOT_MAX_MESSAGES_PER_RUN === 1 &&
        WorkOsConfig.AUTOMATION_INTERVAL_MINUTES === 5,
      scope: String(WorkOsConfig.AUTOMATION_PILOT_SCOPE || ''),
      source_mode: safeReadinessToken(
        WorkOsConfig.AUTOMATION_PILOT_SOURCE_MODE,
        'MISSING'
      ),
      admission_mode: safeReadinessToken(
        WorkOsConfig.AUTOMATION_PILOT_ADMISSION_MODE,
        'MISSING'
      ),
      exact_subject: '',
      exact_query_active: exactQuery,
      exact_body_guard_active: false,
      pilot_query_active: exactQuery,
      label_gate_active: query.indexOf('label:手動/取込') !== -1,
      manual_exclude_wins: query.indexOf('-label:手動/除外') !== -1,
      spam_trash_excluded: query.indexOf('-in:spam') !== -1 &&
        query.indexOf('-in:trash') !== -1,
      one_message_per_run:
        WorkOsConfig.AUTOMATION_PILOT_MAX_MESSAGES_PER_RUN === 1,
      interval_minutes: Number(WorkOsConfig.AUTOMATION_INTERVAL_MINUTES || 0)
    };
  }

  function candidateSnapshot(props, completed) {
    var storedCode = props.getProperty(WorkOsConfig.PROPERTIES.CODE_VERSION);
    var storedSchema = props.getProperty(
      WorkOsConfig.PROPERTIES.SCHEMA_VERSION
    );
    var storedMigration = props.getProperty(
      WorkOsConfig.PROPERTIES.MIGRATION_VERSION
    );
    var setupComplete = completed.indexOf('S99_COMPLETE') !== -1;
    var versionsAligned = storedCode === WorkOsConfig.CODE_VERSION &&
      storedSchema === WorkOsConfig.SCHEMA_VERSION &&
      storedMigration === WorkOsConfig.MIGRATION_VERSION;
    return {
      ready: setupComplete && versionsAligned &&
        WorkOsConfig.TEST_MODE !== true,
      setup_complete: setupComplete,
      stored_versions_aligned: versionsAligned,
      code_version: String(WorkOsConfig.CODE_VERSION),
      stored_code_version: safeVersionToken(storedCode),
      schema_version: String(WorkOsConfig.SCHEMA_VERSION),
      stored_schema_version: safeVersionToken(storedSchema),
      ai_schema_version: String(WorkOsConfig.AI_SCHEMA_VERSION),
      migration_version: String(WorkOsConfig.MIGRATION_VERSION),
      stored_migration_version: safeVersionToken(storedMigration)
    };
  }

  function blockedLabelSnapshot(reason) {
    var expected = WorkOsConfig.GMAIL_LABELS.length;
    return {
      status: 'BLOCKED',
      ready: false,
      checked: false,
      expected_count: expected,
      present_count: 0,
      missing_count: expected,
      reason: String(reason || 'FORMAL_GMAIL_LABEL_NOT_CHECKED')
    };
  }

  function safeLabelSnapshot(value) {
    var result = value || {};
    var expected = WorkOsConfig.GMAIL_LABELS.length;
    var present = safeCount(result.present_count, expected);
    var complete = result.complete === true && present === expected;
    return {
      status: complete ? 'READY' : 'BLOCKED',
      ready: complete,
      checked: true,
      expected_count: expected,
      present_count: present,
      missing_count: Math.max(0, expected - present),
      reason: complete ? '' : 'FORMAL_GMAIL_LABEL_MISSING'
    };
  }

  function blockedCalendarSnapshot(properties, reason) {
    var saved = String(properties.getProperty(
      WorkOsConfig.PROPERTIES.DEADLINE_CALENDAR_ID
    ) || '').trim();
    return {
      status: saved ? 'BLOCKED' : 'NOT_CONFIGURED',
      ready: false,
      checked: false,
      property_present: Boolean(saved),
      instance_marker_ok: false,
      remotely_verified: false,
      reason: String(reason || (saved
        ? 'DEDICATED_CALENDAR_NOT_CHECKED'
        : 'CALENDAR_NOT_CONFIGURED'))
    };
  }

  function safeCalendarSnapshot(value) {
    var result = value || {};
    var ready = result.status === 'CONFIGURED' &&
      result.property_present === true &&
      result.instance_marker_ok === true &&
      result.remotely_verified === true;
    return {
      status: ready ? 'READY' : 'BLOCKED',
      ready: ready,
      checked: true,
      property_present: result.property_present === true,
      instance_marker_ok: result.instance_marker_ok === true,
      remotely_verified: result.remotely_verified === true,
      reason: ready ? '' : 'DEDICATED_CALENDAR_NOT_READY'
    };
  }

  function providerSnapshot(readiness) {
    var value = readiness || {};
    return {
      status: value.ready === true ? 'READY' : 'BLOCKED',
      ready: value.ready === true,
      provider: safeReadinessToken(value.provider, 'MISSING'),
      model: safeReadinessToken(
        value.model || WorkOsConfig.EXTERNAL_AI_MODEL,
        'MISSING'
      ),
      adapter_status: 'NOT_CHECKED',
      credential_configured: 'NOT_CHECKED',
      provider_registered: value.registry_entry_present === true,
      credential_reference_present:
        value.credential_reference_present === true,
      external_request_performed: false
    };
  }

  function safeCredentialState(value) {
    if (value === true || value === false) {
      return value;
    }
    return 'NOT_CHECKED';
  }

  function safePrerequisiteDetails(value) {
    var details = value || {};
    var candidate = details.candidate || {};
    var setup = details.setup || {};
    var testMode = details.test_mode || {};
    var scope = details.scope || {};
    var provider = details.provider || {};
    var oauth = details.oauth || {};
    var labels = details.formal_labels || {};
    var calendar = details.calendar || {};
    return {
      candidate: {
        ready: candidate.ready === true,
        setup_complete: candidate.setup_complete === true,
        stored_versions_aligned:
          candidate.stored_versions_aligned === true,
        code_version: safeVersionToken(candidate.code_version),
        stored_code_version: safeVersionToken(candidate.stored_code_version),
        schema_version: safeVersionToken(candidate.schema_version),
        stored_schema_version: safeVersionToken(
          candidate.stored_schema_version
        ),
        ai_schema_version: safeVersionToken(candidate.ai_schema_version),
        migration_version: safeVersionToken(candidate.migration_version),
        stored_migration_version: safeVersionToken(
          candidate.stored_migration_version
        )
      },
      setup: {
        complete: setup.complete === true,
        required_stage: 'S99_COMPLETE'
      },
      test_mode: {
        enabled: testMode.enabled === true,
        production_shaped: testMode.production_shaped === true
      },
      scope: {
        ready: scope.ready === true,
        status: scope.ready === true ? 'READY' : 'BLOCKED',
        scope: safeReadinessToken(scope.scope, 'MISSING'),
        source_mode: safeReadinessToken(scope.source_mode, 'MISSING'),
        admission_mode: safeReadinessToken(
          scope.admission_mode,
          'NOT_APPLICABLE'
        ),
        exact_subject: String(scope.exact_subject || ''),
        exact_query_active: scope.exact_query_active === true,
        exact_body_guard_active: scope.exact_body_guard_active === true,
        pilot_query_active: scope.pilot_query_active === true,
        label_gate_active: scope.label_gate_active === true,
        manual_exclude_wins: scope.manual_exclude_wins === true,
        spam_trash_excluded: scope.spam_trash_excluded === true,
        one_message_per_run: scope.one_message_per_run === true,
        interval_minutes: Number(scope.interval_minutes || 0)
      },
      provider: {
        status: provider.status === 'READY' ? 'READY' : 'BLOCKED',
        ready: provider.ready === true,
        provider: safeReadinessToken(provider.provider, 'MISSING'),
        model: safeReadinessToken(provider.model, 'MISSING'),
        adapter_status: safeReadinessToken(
          provider.adapter_status,
          'NOT_CHECKED'
        ),
        credential_configured: safeCredentialState(
          provider.credential_configured
        ),
        provider_registered: provider.provider_registered === true,
        credential_reference_present:
          provider.credential_reference_present === true,
        external_request_performed: false
      },
      oauth: {
        status: safeReadinessToken(oauth.status, 'UNAVAILABLE'),
        ready: oauth.ready === true
      },
      formal_labels: {
        status: safeReadinessToken(labels.status, 'BLOCKED'),
        ready: labels.ready === true,
        checked: labels.checked === true,
        expected_count: safeCount(
          labels.expected_count,
          WorkOsConfig.GMAIL_LABELS.length
        ),
        present_count: safeCount(
          labels.present_count,
          WorkOsConfig.GMAIL_LABELS.length
        ),
        missing_count: safeCount(
          labels.missing_count,
          WorkOsConfig.GMAIL_LABELS.length
        ),
        reason: safeReadinessToken(labels.reason, '')
      },
      calendar: {
        status: safeReadinessToken(calendar.status, 'BLOCKED'),
        ready: calendar.ready === true,
        checked: calendar.checked === true,
        property_present: calendar.property_present === true,
        instance_marker_ok: calendar.instance_marker_ok === true,
        remotely_verified: calendar.remotely_verified === true,
        reason: safeReadinessToken(calendar.reason, '')
      },
      external_request_performed: false
    };
  }

  function evaluatePersonalQualificationReadiness(input) {
    var value = input || {};
    var automation = value.automation || {};
    var prerequisites = value.prerequisites || {};
    var details = safePrerequisiteDetails(value.details);
    var reasons = [];
    var requireReady = function (condition, reason) {
      if (!condition) {
        addUniqueReason(reasons, reason);
      }
    };
    requireReady(value.test_mode === false, 'TEST_MODE_ENABLED');
    requireReady(prerequisites.ready === true,
      'AUTOMATION_PREREQUISITES_INCOMPLETE');
    requireReady(details.candidate.ready === true,
      'CANDIDATE_VERSION_OR_SETUP_NOT_READY');
    requireReady(details.candidate.setup_complete === true,
      'SETUP_NOT_COMPLETE');
    requireReady(details.candidate.stored_versions_aligned === true,
      'STORED_VERSION_ALIGNMENT_FAILED');
    requireReady(details.candidate.ai_schema_version ===
      WorkOsConfig.AI_SCHEMA_VERSION, 'AI_SCHEMA_VERSION_MISMATCH');
    requireReady(details.test_mode.production_shaped === true,
      'TEST_MODE_ENABLED');
    requireReady(details.scope.ready === true,
      'QUALIFICATION_SCOPE_NOT_EXACT');
    requireReady(details.scope.scope ===
      'SYNTHETIC_AUTOMATION_QUALIFICATION_ONLY',
    'QUALIFICATION_SCOPE_NOT_EXACT');
    requireReady(details.scope.source_mode === 'AUTOMATIC_QUALIFICATION',
      'QUALIFICATION_SCOPE_NOT_EXACT');
    requireReady(details.scope.exact_query_active === true,
      'QUALIFICATION_QUERY_NOT_EXACT');
    requireReady(details.scope.exact_body_guard_active === true,
      'QUALIFICATION_BODY_GUARD_NOT_ACTIVE');
    requireReady(details.provider.ready === true,
      'REAL_AI_ADAPTER_NOT_READY');
    requireReady(details.provider.credential_configured === true,
      'AI_CREDENTIAL_NOT_READY');
    requireReady(details.provider.adapter_status === 'READY',
      'REAL_AI_ADAPTER_NOT_READY');
    requireReady(details.provider.provider === 'GEMINI',
      'AI_PROVIDER_NOT_GEMINI');
    requireReady(details.oauth.ready === true, 'OAUTH_NOT_READY');
    requireReady(details.formal_labels.ready === true,
      'FORMAL_GMAIL_LABEL_MISSING');
    requireReady(details.calendar.ready === true,
      'DEDICATED_CALENDAR_NOT_READY');
    requireReady(automation.status === 'CONSISTENT' &&
      automation.enabled === false &&
      automation.desired_enabled === false &&
      automation.trigger_count === 0 &&
      automation.clock_trigger_count === 0 &&
      automation.stored_trigger_id_present === false &&
      automation.canonical_trigger_present === false,
    'AUTOMATION_STATE_NOT_READY');
    requireReady(value.external_request_performed === false,
      'EXTERNAL_REQUEST_PERFORMED');
    return {
      ready: reasons.length === 0,
      reasons: reasons
    };
  }

  function evaluatePersonalShadowPilotReadiness(input) {
    var value = input || {};
    var automation = value.automation || {};
    var prerequisites = value.prerequisites || {};
    var details = safePrerequisiteDetails(value.details);
    var reasons = [];
    var requireReady = function (condition, reason) {
      if (!condition) {
        addUniqueReason(reasons, reason);
      }
    };
    requireReady(value.test_mode === false, 'TEST_MODE_ENABLED');
    requireReady(prerequisites.ready === true,
      'AUTOMATION_PREREQUISITES_INCOMPLETE');
    requireReady(details.candidate.ready === true,
      'CANDIDATE_VERSION_OR_SETUP_NOT_READY');
    requireReady(details.candidate.setup_complete === true,
      'SETUP_NOT_COMPLETE');
    requireReady(details.candidate.stored_versions_aligned === true,
      'STORED_VERSION_ALIGNMENT_FAILED');
    requireReady(details.candidate.ai_schema_version ===
      WorkOsConfig.AI_SCHEMA_VERSION, 'AI_SCHEMA_VERSION_MISMATCH');
    requireReady(details.test_mode.production_shaped === true,
      'TEST_MODE_ENABLED');
    requireReady(details.scope.ready === true,
      'PILOT_SCOPE_NOT_EXACT');
    requireReady(details.scope.scope === WorkOsConfig.AUTOMATION_PILOT_SCOPE,
      'PILOT_SCOPE_NOT_EXACT');
    requireReady(details.scope.admission_mode ===
      WorkOsConfig.AUTOMATION_PILOT_ADMISSION_MODE,
      'PILOT_ADMISSION_MODE_NOT_LABEL_GATED');
    requireReady(details.scope.source_mode ===
      WorkOsConfig.AUTOMATION_PILOT_SOURCE_MODE,
      'PILOT_SOURCE_MODE_NOT_EXACT');
    requireReady(details.scope.pilot_query_active === true &&
      details.scope.exact_query_active === true,
      'PILOT_QUERY_NOT_EXACT');
    requireReady(details.scope.label_gate_active === true,
      'PILOT_LABEL_GATE_NOT_ACTIVE');
    requireReady(details.scope.manual_exclude_wins === true,
      'PILOT_MANUAL_EXCLUDE_NOT_ACTIVE');
    requireReady(details.scope.spam_trash_excluded === true,
      'PILOT_SPAM_TRASH_BOUNDARY_NOT_ACTIVE');
    requireReady(details.scope.one_message_per_run === true &&
      details.scope.interval_minutes === 5,
      'PILOT_RUN_BOUND_NOT_EXACT');
    requireReady(details.provider.ready === true,
      'REAL_AI_ADAPTER_NOT_READY');
    requireReady(details.provider.credential_configured === true,
      'AI_CREDENTIAL_NOT_READY');
    requireReady(details.provider.adapter_status === 'READY',
      'REAL_AI_ADAPTER_NOT_READY');
    requireReady(details.provider.provider === 'GEMINI',
      'AI_PROVIDER_NOT_GEMINI');
    requireReady(details.oauth.ready === true, 'OAUTH_NOT_READY');
    requireReady(details.formal_labels.ready === true,
      'FORMAL_GMAIL_LABEL_MISSING');
    requireReady(details.calendar.ready === true,
      'DEDICATED_CALENDAR_NOT_READY');
    requireReady(automation.status === 'CONSISTENT' &&
      automation.enabled === false &&
      automation.desired_enabled === false &&
      automation.trigger_count === 0 &&
      automation.clock_trigger_count === 0 &&
      automation.stored_trigger_id_present === false &&
      automation.canonical_trigger_present === false,
    'AUTOMATION_STATE_NOT_READY');
    requireReady(value.external_request_performed === false,
      'EXTERNAL_REQUEST_PERFORMED');
    return {
      ready: reasons.length === 0,
      reasons: reasons
    };
  }

  function defaultPrerequisiteCheck(settings, scopeMode) {
    var props = properties(settings);
    var pilotMode = scopeMode !== 'QUALIFICATION';
    var reasons = [];
    var completed = [];
    try {
      completed = JSON.parse(props.getProperty(
        WorkOsConfig.PROPERTIES.SETUP_COMPLETED_STAGES
      ) || '[]');
      if (!Array.isArray(completed)) {
        completed = [];
      }
    } catch (error) {
      completed = [];
    }
    var setupComplete = completed.indexOf('S99_COMPLETE') !== -1;
    var candidate = candidateSnapshot(props, completed);
    var scope = pilotMode
      ? pilotScopeSnapshot()
      : qualificationScopeSnapshot();
    var scopeReason = pilotMode
      ? 'PILOT_SCOPE_NOT_EXACT'
      : 'QUALIFICATION_SCOPE_NOT_EXACT';
    var provider = providerSnapshot(null);
    var oauth = {
      status: 'UNAVAILABLE',
      ready: false
    };
    var labels = blockedLabelSnapshot('POLICY_PREREQUISITES_INCOMPLETE');
    var calendar = blockedCalendarSnapshot(
      props,
      'POLICY_PREREQUISITES_INCOMPLETE'
    );
    if (!setupComplete) {
      addUniqueReason(reasons, 'SETUP_NOT_COMPLETE');
    }
    if (WorkOsConfig.TEST_MODE === true) {
      addUniqueReason(reasons, 'TEST_MODE_ENABLED');
    }
    if (!scope.ready) {
      addUniqueReason(reasons, scopeReason);
    }
    if (!props.getProperty(WorkOsConfig.PROPERTIES.DEADLINE_CALENDAR_ID)) {
      addUniqueReason(reasons, 'CALENDAR_NOT_CONFIGURED');
    }
    appendScopeDecisionReasons(reasons);
    var sharedPreflight =
      appendSharedPreflightReasons(settings, reasons);
    if (props.getProperty(WorkOsConfig.PROPERTIES.CODE_VERSION) !==
        WorkOsConfig.CODE_VERSION) {
      addUniqueReason(reasons, 'CODE_VERSION_MISMATCH');
    }
    if (props.getProperty(WorkOsConfig.PROPERTIES.SCHEMA_VERSION) !==
        WorkOsConfig.SCHEMA_VERSION) {
      addUniqueReason(reasons, 'SCHEMA_VERSION_MISMATCH');
    }
    if (props.getProperty(WorkOsConfig.PROPERTIES.MIGRATION_VERSION) !==
        WorkOsConfig.MIGRATION_VERSION) {
      addUniqueReason(reasons, 'MIGRATION_VERSION_MISMATCH');
    }
    if (typeof WorkOsAiAdapter === 'undefined' ||
        typeof WorkOsAiAdapter.getProductionReadiness !== 'function') {
      [
        'EXTERNAL_AI_NOT_CONFIGURED',
        'OPERATOR_APPROVAL_NOT_CONFIRMED',
        'DATA_POLICY_APPROVAL_NOT_CONFIRMED',
        'CREDENTIAL_STORAGE_APPROVAL_NOT_CONFIRMED',
        'AI_AUTH_NOT_CONFIGURED',
        'REAL_AI_TRANSPORT_NOT_IMPLEMENTED',
        'AI_PRODUCTION_BOUNDARY_UNAVAILABLE'
      ].forEach(function (reason) { addUniqueReason(reasons, reason); });
    } else {
      var aiReadiness = WorkOsAiAdapter.getProductionReadiness();
      provider = providerSnapshot(aiReadiness);
      (aiReadiness.reasons || []).forEach(function (reason) {
        addUniqueReason(reasons, reason);
      });
    }
    var scriptApp = scriptService(settings);
    if (!scriptApp ||
        typeof scriptApp.getAuthorizationInfo !== 'function' ||
        !scriptApp.AuthMode ||
        !scriptApp.AuthMode.FULL) {
      addUniqueReason(reasons, 'OAUTH_STATUS_UNAVAILABLE');
    } else {
      try {
        var authorization = scriptApp.getAuthorizationInfo(
          scriptApp.AuthMode.FULL
        );
        var status = String(
          authorization && authorization.getAuthorizationStatus
            ? authorization.getAuthorizationStatus()
            : ''
        );
        if (!status) {
          addUniqueReason(reasons, 'OAUTH_STATUS_UNAVAILABLE');
        } else if (status !== 'NOT_REQUIRED') {
          addUniqueReason(reasons, 'OAUTH_AUTHORIZATION_REQUIRED');
          oauth = { status: 'AUTHORIZATION_REQUIRED', ready: false };
        } else {
          oauth = { status: 'READY', ready: true };
        }
      } catch (error) {
        addUniqueReason(reasons, 'OAUTH_STATUS_UNAVAILABLE');
      }
    }
    /*
     * Service-backed checks run only after policy and configuration checks
     * pass, and never in the test-shaped source. They are read-only: label
     * listing, dedicated-calendar inspection, and adapter healthCheck only.
     */
    if (!reasons.length && WorkOsConfig.TEST_MODE !== true) {
      try {
        var labelStatus = typeof settings.label_inspector === 'function'
          ? settings.label_inspector()
          : WorkOsGmailGateway.inspectFormalLabels();
        labels = safeLabelSnapshot(labelStatus);
        if (!labels.ready) {
          addUniqueReason(reasons, 'FORMAL_GMAIL_LABEL_MISSING');
        }
      } catch (labelError) {
        labels = blockedLabelSnapshot('GMAIL_LABEL_READINESS_UNAVAILABLE');
        addUniqueReason(reasons, 'GMAIL_LABEL_READINESS_UNAVAILABLE');
      }
      try {
        var calendarStatus = typeof settings.calendar_inspector ===
          'function'
          ? settings.calendar_inspector()
          : WorkOsCalendarSync.inspectDedicatedCalendarConfiguration({
            properties: props,
            verify_remote: true
          });
        calendar = safeCalendarSnapshot(calendarStatus);
        if (!calendar.ready) {
          addUniqueReason(reasons, 'DEDICATED_CALENDAR_NOT_READY');
        }
      } catch (calendarError) {
        calendar = blockedCalendarSnapshot(
          props,
          'DEDICATED_CALENDAR_NOT_READY'
        );
        addUniqueReason(reasons, 'DEDICATED_CALENDAR_NOT_READY');
      }
      try {
        var productionAdapter =
          WorkOsAiAdapter.createProductionExternalAdapter();
        var health = productionAdapter.healthCheck();
        var metadata = WorkOsAiAdapter.getMetadata(productionAdapter);
        var providerIsGemini =
          String(metadata.provider || '').toUpperCase() === 'GEMINI';
        provider = {
          status: health && health.status === 'READY' && providerIsGemini
            ? 'READY'
            : 'BLOCKED',
          ready: Boolean(health && health.status === 'READY' &&
            providerIsGemini),
          provider: safeReadinessToken(metadata.provider, 'MISSING'),
          model: safeReadinessToken(metadata.model, 'MISSING'),
          adapter_status: health && health.status === 'READY'
            ? 'READY'
            : 'BLOCKED',
          credential_configured: health &&
            health.credential_configured === true,
          provider_registered: true,
          credential_reference_present: true,
          external_request_performed: false
        };
        if (!provider.ready || provider.credential_configured !== true) {
          addUniqueReason(reasons, 'REAL_AI_ADAPTER_NOT_READY');
        }
      } catch (adapterError) {
        provider = {
          status: 'BLOCKED',
          ready: false,
          provider: safeReadinessToken(
            WorkOsConfig.EXTERNAL_AI_PROVIDER,
            'MISSING'
          ),
          model: safeReadinessToken(
            WorkOsConfig.EXTERNAL_AI_MODEL,
            'MISSING'
          ),
          adapter_status: 'BLOCKED',
          credential_configured: false,
          provider_registered: false,
          credential_reference_present: false,
          external_request_performed: false
        };
        addUniqueReason(reasons, 'REAL_AI_ADAPTER_NOT_READY');
      }
    }
    candidate.ready = setupComplete && candidate.stored_versions_aligned &&
      WorkOsConfig.TEST_MODE !== true;
    return {
      ready: reasons.length === 0,
      reasons: reasons,
      real_provider_connection: 'NOT_EXECUTED',
      operator_approval: WorkOsConfig.EXTERNAL_AI_OPERATOR_APPROVED
        ? 'CONFIRMED'
        : 'NOT_CONFIRMED',
      credential_storage_approval:
        WorkOsConfig.EXTERNAL_AI_CREDENTIAL_STORAGE_APPROVED
          ? 'CONFIRMED'
          : 'NOT_CONFIRMED',
      shared_preflight_ready:
        Boolean(sharedPreflight && sharedPreflight.ready),
      runtime_settings: safeRuntimeSettings(sharedPreflight),
      details: safePrerequisiteDetails({
        candidate: candidate,
        setup: { complete: setupComplete },
        test_mode: {
          enabled: WorkOsConfig.TEST_MODE === true,
          production_shaped: WorkOsConfig.TEST_MODE !== true
        },
        scope: scope,
        provider: provider,
        oauth: oauth,
        formal_labels: labels,
        calendar: calendar,
        external_request_performed: false
      })
    };
  }

  function prerequisiteStatus(settings, scopeMode) {
    var checker = settings.prerequisite_checker ||
      function (value) {
        return defaultPrerequisiteCheck(value, scopeMode);
      };
    var result = checker(settings) || {};
    return {
      ready: result.ready === true,
      reasons: Array.isArray(result.reasons)
        ? result.reasons.map(function (reason) {
          var value = String(reason || '');
          return /^[A-Z0-9_]{1,80}$/.test(value)
            ? value
            : 'UNSAFE_PREREQUISITE_REASON';
        })
        : [],
      real_provider_connection: String(
        result.real_provider_connection || 'NOT_EXECUTED'
      ),
      operator_approval: String(
        result.operator_approval || result.company_approval ||
          'NOT_CONFIRMED'
      ),
      credential_storage_approval: String(
        result.credential_storage_approval || 'NOT_CONFIRMED'
      ),
      shared_preflight_ready:
        result.shared_preflight_ready === true,
      runtime_settings: result.runtime_settings || null,
      details: safePrerequisiteDetails(result.details)
    };
  }

  function diagnosticPrerequisiteStatus(settings) {
    var reasons = ['SERVICE_READINESS_NOT_EXECUTED'];
    appendScopeDecisionReasons(reasons);
    var sharedPreflight =
      appendSharedPreflightReasons(settings, reasons);
    if (typeof WorkOsAiAdapter === 'undefined' ||
        typeof WorkOsAiAdapter.getProductionReadiness !== 'function') {
      reasons.push('EXTERNAL_AI_NOT_CONFIGURED');
      reasons.push('OPERATOR_APPROVAL_NOT_CONFIRMED');
      reasons.push('DATA_POLICY_APPROVAL_NOT_CONFIRMED');
      reasons.push('CREDENTIAL_STORAGE_APPROVAL_NOT_CONFIRMED');
      reasons.push('AI_AUTH_NOT_CONFIGURED');
      reasons.push('REAL_AI_TRANSPORT_NOT_IMPLEMENTED');
      reasons.push('AI_PRODUCTION_BOUNDARY_UNAVAILABLE');
    } else {
      WorkOsAiAdapter.getProductionReadiness().reasons.forEach(
        function (reason) {
          if (reasons.indexOf(reason) === -1) {
            reasons.push(reason);
          }
        }
      );
    }
    return {
      ready: false,
      reasons: reasons,
      real_provider_connection: 'NOT_EXECUTED',
      operator_approval: WorkOsConfig.EXTERNAL_AI_OPERATOR_APPROVED
        ? 'CONFIRMED'
        : 'NOT_CONFIRMED',
      credential_storage_approval:
        WorkOsConfig.EXTERNAL_AI_CREDENTIAL_STORAGE_APPROVED
          ? 'CONFIRMED'
          : 'NOT_CONFIRMED',
      shared_preflight_ready:
        Boolean(sharedPreflight && sharedPreflight.ready),
      runtime_settings: safeRuntimeSettings(sharedPreflight)
    };
  }

  function automationStatusInternal(
    settings,
    diagnosticOnly,
    scopeMode
  ) {
    var props = properties(settings);
    var scriptApp = scriptService(settings);
    var allHandlerTriggers = handlerTriggers(scriptApp);
    var triggers = allHandlerTriggers.filter(isClockTrigger);
    var storedId = String(props.getProperty(
      WorkOsConfig.PROPERTIES.AUTOMATION_TRIGGER_ID
    ) || '');
    var ids = triggers.map(triggerId).filter(Boolean);
    var enabled = props.getProperty(
      WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED
    ) === 'true';
    var desiredEnabled = props.getProperty(
      WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE
    ) === 'true';
    var canonicalPresent = storedId &&
      ids.indexOf(storedId) !== -1;
    var consistent = enabled
      ? allHandlerTriggers.length === 1 &&
        triggers.length === 1 &&
        canonicalPresent &&
        desiredEnabled
      : allHandlerTriggers.length === 0 &&
        !storedId &&
        !desiredEnabled;
    return {
      status: consistent ? 'CONSISTENT' : 'INCONSISTENT',
      enabled: enabled,
      desired_enabled: desiredEnabled,
      configured_default_enabled: WorkOsConfig.AUTOMATION_ENABLED,
      trigger_count: allHandlerTriggers.length,
      clock_trigger_count: triggers.length,
      invalid_event_trigger_count:
        allHandlerTriggers.length - triggers.length,
      stored_trigger_id_present: Boolean(storedId),
      canonical_trigger_present: Boolean(canonicalPresent),
      duplicate_trigger_count: Math.max(0, triggers.length - 1),
      interval_minutes: WorkOsConfig.AUTOMATION_INTERVAL_MINUTES,
      watermark_present: Boolean(props.getProperty(
        WorkOsConfig.PROPERTIES.AUTOMATION_WATERMARK_AT
      )),
      last_run_present: Boolean(props.getProperty(
        WorkOsConfig.PROPERTIES.AUTOMATION_LAST_RUN_AT
      )),
      prerequisites: diagnosticOnly
        ? diagnosticPrerequisiteStatus(settings, scopeMode)
        : prerequisiteStatus(settings, scopeMode),
      google_workspace_trigger_list: settings.script_app
        ? 'LOCAL_FAKE'
        : 'REAL_READ'
    };
  }

  function getAutomationStatus(options) {
    return automationStatusInternal(injected(options), false, 'PILOT');
  }

  function getDiagnosticAutomationStatus(options) {
    return automationStatusInternal(injected(options), true, 'PILOT');
  }

  function getPersonalAutomationQualificationStatus(options) {
    var settings = injected(options);
    var automation = automationStatusInternal(
      settings,
      false,
      'QUALIFICATION'
    );
    var prerequisites = automation.prerequisites || {};
    var details = safePrerequisiteDetails(prerequisites.details);
    var decision = evaluatePersonalQualificationReadiness({
      test_mode: WorkOsConfig.TEST_MODE === true,
      automation: automation,
      prerequisites: prerequisites,
      details: details,
      external_request_performed: false
    });
    var safeReasons = Array.isArray(prerequisites.reasons)
      ? prerequisites.reasons.slice(0, 40)
      : [];
    var providerReady = details.provider.ready === true &&
      details.provider.adapter_status === 'READY' &&
      details.provider.credential_configured === true;
    return {
      status: decision.ready
        ? 'READY_FOR_CONTROLLED_QUALIFICATION'
        : 'BLOCKED',
      readiness_reasons: decision.reasons,
      prerequisites: {
        ready: prerequisites.ready === true,
        reasons: safeReasons,
        external_request_performed: false
      },
      qualification_scope: WorkOsConfig.AUTOMATION_QUALIFICATION_SCOPE,
      candidate_mode: WorkOsConfig.AUTOMATION_QUALIFICATION_SOURCE_MODE,
      exact_subject: WorkOsConfig.AUTOMATION_SYNTHETIC_SUBJECT,
      exact_body_guard_active: details.scope.exact_body_guard_active,
      exact_query_active: details.scope.exact_query_active,
      candidate: details.candidate,
      setup: details.setup,
      test_mode: details.test_mode,
      scope: details.scope,
      operator_approval: WorkOsConfig.EXTERNAL_AI_OPERATOR_APPROVED
        ? 'CONFIRMED'
        : 'NOT_CONFIRMED',
      data_policy_approval: WorkOsConfig.EXTERNAL_AI_DATA_POLICY_APPROVED
        ? 'CONFIRMED'
        : 'NOT_CONFIRMED',
      credential_storage_approval:
        WorkOsConfig.EXTERNAL_AI_CREDENTIAL_STORAGE_APPROVED
          ? 'CONFIRMED'
          : 'NOT_CONFIRMED',
      auth_configured: WorkOsConfig.EXTERNAL_AI_AUTH_CONFIGURED
        ? 'CONFIGURED'
        : 'NOT_CONFIGURED',
      provider: String(WorkOsConfig.EXTERNAL_AI_PROVIDER),
      model: String(WorkOsConfig.EXTERNAL_AI_MODEL),
      provider_readiness: details.provider,
      production_readiness: {
        ready: providerReady,
        reasons: safeReasons,
        external_request_performed: false
      },
      oauth: details.oauth,
      automation: {
        status: automation.status,
        enabled: automation.enabled === true,
        desired_enabled: automation.desired_enabled === true,
        trigger_count: automation.trigger_count,
        clock_trigger_count: automation.clock_trigger_count,
        stored_trigger_id_present:
          automation.stored_trigger_id_present === true,
        canonical_trigger_present:
          automation.canonical_trigger_present === true
      },
      formal_labels: details.formal_labels,
      calendar: details.calendar,
      external_request_performed: false
    };
  }

  function getPersonalShadowPilotStatus(options) {
    var settings = injected(options);
    var automation = getAutomationStatus(settings);
    var prerequisites = automation.prerequisites || {};
    var details = safePrerequisiteDetails(prerequisites.details);
    var decision = evaluatePersonalShadowPilotReadiness({
      test_mode: WorkOsConfig.TEST_MODE === true,
      automation: automation,
      prerequisites: prerequisites,
      details: details,
      external_request_performed: false
    });
    var safeReasons = Array.isArray(prerequisites.reasons)
      ? prerequisites.reasons.slice(0, 40)
      : [];
    var providerReady = details.provider.ready === true &&
      details.provider.adapter_status === 'READY' &&
      details.provider.credential_configured === true;
    return {
      status: decision.ready
        ? 'READY_FOR_USER_PERSONAL_SHADOW_PILOT'
        : 'BLOCKED',
      readiness_reasons: decision.reasons,
      prerequisites: {
        ready: prerequisites.ready === true,
        reasons: safeReasons,
        external_request_performed: false
      },
      pilot_scope: WorkOsConfig.AUTOMATION_PILOT_SCOPE,
      admission_mode: WorkOsConfig.AUTOMATION_PILOT_ADMISSION_MODE,
      candidate_mode: WorkOsConfig.AUTOMATION_PILOT_SOURCE_MODE,
      pilot_query: WorkOsConfig.AUTOMATION_PILOT_GMAIL_QUERY,
      label_gate_active: details.scope.label_gate_active,
      manual_exclude_wins: details.scope.manual_exclude_wins,
      spam_trash_excluded: details.scope.spam_trash_excluded,
      one_message_per_run: details.scope.one_message_per_run,
      interval_minutes: details.scope.interval_minutes,
      candidate: details.candidate,
      setup: details.setup,
      test_mode: details.test_mode,
      scope: details.scope,
      operator_approval: WorkOsConfig.EXTERNAL_AI_OPERATOR_APPROVED
        ? 'CONFIRMED'
        : 'NOT_CONFIRMED',
      data_policy_approval: WorkOsConfig.EXTERNAL_AI_DATA_POLICY_APPROVED
        ? 'CONFIRMED'
        : 'NOT_CONFIRMED',
      credential_storage_approval:
        WorkOsConfig.EXTERNAL_AI_CREDENTIAL_STORAGE_APPROVED
          ? 'CONFIRMED'
          : 'NOT_CONFIRMED',
      auth_configured: WorkOsConfig.EXTERNAL_AI_AUTH_CONFIGURED
        ? 'CONFIGURED'
        : 'NOT_CONFIGURED',
      provider: String(WorkOsConfig.EXTERNAL_AI_PROVIDER),
      model: String(WorkOsConfig.EXTERNAL_AI_MODEL),
      provider_readiness: details.provider,
      production_readiness: {
        ready: providerReady,
        reasons: safeReasons,
        external_request_performed: false
      },
      oauth: details.oauth,
      automation: {
        status: automation.status,
        enabled: automation.enabled === true,
        desired_enabled: automation.desired_enabled === true,
        trigger_count: automation.trigger_count,
        clock_trigger_count: automation.clock_trigger_count,
        stored_trigger_id_present:
          automation.stored_trigger_id_present === true,
        canonical_trigger_present:
          automation.canonical_trigger_present === true
      },
      formal_labels: details.formal_labels,
      calendar: details.calendar,
      external_request_performed: false
    };
  }

  function removeDuplicateAutomationTriggersUnlocked(settings) {
    var props = properties(settings);
    var scriptApp = scriptService(settings);
    var triggers = handlerTriggers(scriptApp);
    var storedId = String(props.getProperty(
      WorkOsConfig.PROPERTIES.AUTOMATION_TRIGGER_ID
    ) || '');
    var keep = triggers.filter(function (trigger) {
      return storedId &&
        triggerId(trigger) === storedId &&
        isClockTrigger(trigger);
    })[0] || null;
    var removed = 0;
    triggers.forEach(function (trigger) {
      if (trigger === keep) {
        return;
      }
      scriptApp.deleteTrigger(trigger);
      removed += 1;
    });
    if (keep) {
      props.setProperty(
        WorkOsConfig.PROPERTIES.AUTOMATION_TRIGGER_ID,
        triggerId(keep)
      );
    } else {
      props.deleteProperty(
        WorkOsConfig.PROPERTIES.AUTOMATION_TRIGGER_ID
      );
    }
    return {
      status: keep ? 'CONSISTENT' : 'RECREATE_REQUIRED',
      trigger_count: keep ? 1 : 0,
      removed_count: removed
    };
  }

  function removeDuplicateAutomationTriggers(options) {
    var settings = injected(options);
    return withAutomationMutation(settings, function () {
      return removeDuplicateAutomationTriggersUnlocked(settings);
    });
  }

  function ensureSingleAutomationTriggerUnlocked(settings) {
    var props = properties(settings);
    var scriptApp = scriptService(settings);
    var enabled = props.getProperty(
      WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED
    ) === 'true';
    if (!enabled && !settings.allow_create_while_disabled) {
      return {
        status: 'DISABLED',
        created: false,
        trigger_count: automationTriggers(scriptApp).length
      };
    }
    var prerequisites = prerequisiteStatus(settings);
    if (!prerequisites.ready) {
      throw new WorkOsAppError(
        'E_AUTOMATION_PREREQUISITES',
        'AUTOMATION_ENABLE',
        false,
        '自動処理の前提条件が未完了です。'
      );
    }
    var existing = handlerTriggers(scriptApp);
    if (existing.length) {
      var cleanup = removeDuplicateAutomationTriggersUnlocked(settings);
      if (cleanup.status === 'CONSISTENT') {
        return cleanup;
      }
    }
    var created = null;
    try {
      created = scriptApp.newTrigger(
        WorkOsConfig.AUTOMATION_HANDLER_FUNCTION
      ).timeBased().everyMinutes(
        WorkOsConfig.AUTOMATION_INTERVAL_MINUTES
      ).create();
      var createdId = triggerId(created);
      if (!createdId) {
        throw new Error('TRIGGER_ID_UNAVAILABLE');
      }
      props.setProperty(
        WorkOsConfig.PROPERTIES.AUTOMATION_TRIGGER_ID,
        createdId
      );
      return {
        status: 'CONSISTENT',
        created: true,
        trigger_count: 1,
        interval_minutes: WorkOsConfig.AUTOMATION_INTERVAL_MINUTES
      };
    } catch (error) {
      if (created) {
        try {
          scriptApp.deleteTrigger(created);
        } catch (rollbackError) {
          // enabled remains false at the caller, so a rollback failure is a
          // harmless no-op trigger rather than an active worker.
        }
      }
      throw new WorkOsAppError(
        'E_AUTOMATION_TRIGGER_CREATE',
        'AUTOMATION_ENABLE',
        false,
        'Automation Triggerを安全に作成できませんでした。'
      );
    }
  }

  function ensureSingleAutomationTrigger(options) {
    var settings = injected(options);
    return withAutomationMutation(settings, function () {
      return ensureSingleAutomationTriggerUnlocked(settings);
    });
  }

  function enableAutomationUnlocked(settings) {
    var props = properties(settings);
    props.setProperty(
      WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED,
      'false'
    );
    props.setProperty(
      WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE,
      'true'
    );
    var prerequisites = prerequisiteStatus(settings);
    if (!prerequisites.ready) {
      /*
       * A refused enable request is a completed disabled state, not a pending
       * user intent. Leaving desired=true here would make the default
       * unapproved configuration appear inconsistent.
       */
      props.setProperty(
        WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE,
        'false'
      );
      return {
        status: 'REFUSED',
        enabled: false,
        created_trigger: false,
        reasons: prerequisites.reasons,
        real_provider_connection:
          prerequisites.real_provider_connection,
        operator_approval: prerequisites.operator_approval,
        credential_storage_approval:
          prerequisites.credential_storage_approval
      };
    }
    var ensured;
    try {
      ensured = ensureSingleAutomationTriggerUnlocked(Object.assign(
        {},
        settings,
        { allow_create_while_disabled: true }
      ));
    } catch (ensureError) {
      try {
        props.setProperty(
          WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE,
          'false'
        );
        props.setProperty(
          WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED,
          'false'
        );
      } catch (ensureRollbackError) {
        // The original safe enable failure remains the public error.
      }
      throw ensureError;
    }
    if (props.getProperty(
      WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE
    ) !== 'true') {
      var cancelled = disableAutomationUnlocked(settings);
      return {
        status: 'REFUSED',
        enabled: false,
        created_trigger: ensured.created === true,
        reasons: ['DISABLE_REQUESTED_DURING_ENABLE'],
        cleanup_status: cancelled.status
      };
    }
    try {
      props.setProperty(
        WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED,
        'true'
      );
    } catch (error) {
      /*
       * A Trigger must never remain runnable when the final enable commit
       * fails. Roll back the authoritative flag first, then remove only this
       * module's handler Trigger(s). Even if cleanup fails, the worker stays a
       * no-op because the enabled flag was written before Trigger creation.
       */
      try {
        props.setProperty(
          WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE,
          'false'
        );
        props.setProperty(
          WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED,
          'false'
        );
      } catch (flagRollbackError) {
        // Preserve the original commit failure as the public safe error.
      }
      handlerTriggers(scriptService(settings)).forEach(function (trigger) {
        try {
          scriptService(settings).deleteTrigger(trigger);
        } catch (triggerRollbackError) {
          // A leftover Trigger is still gated by the false enabled flag.
        }
      });
      try {
        props.deleteProperty(
          WorkOsConfig.PROPERTIES.AUTOMATION_TRIGGER_ID
        );
      } catch (idRollbackError) {
        // The stored identifier is not authority to run the disabled worker.
      }
      throw new WorkOsAppError(
        'E_AUTOMATION_ENABLE_COMMIT',
        'AUTOMATION_ENABLE',
        false,
        'Automation有効化状態を安全に確定できませんでした。'
      );
    }
    if (props.getProperty(
      WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE
    ) !== 'true') {
      var postCommitCancelled = disableAutomationUnlocked(settings);
      return {
        status: 'REFUSED',
        enabled: false,
        created_trigger: ensured.created === true,
        reasons: ['DISABLE_REQUESTED_DURING_ENABLE'],
        cleanup_status: postCommitCancelled.status
      };
    }
    return {
      status: 'ENABLED',
      enabled: true,
      created_trigger: ensured.created === true,
      trigger_count: ensured.trigger_count,
      interval_minutes: WorkOsConfig.AUTOMATION_INTERVAL_MINUTES
    };
  }

  function enableAutomation(options) {
    var settings = injected(options);
    return withAutomationMutation(settings, function () {
      try {
        return enableAutomationUnlocked(settings);
      } catch (error) {
        /*
         * This callback runs only after the lifecycle lock is acquired. Make
         * every exceptional enable path best-effort disabled without allowing
         * a lock-timeout caller to cancel a separate successful enable.
         */
        try {
          properties(settings).setProperty(
            WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE,
            'false'
          );
        } catch (desiredRollbackError) {
          // Preserve the original safe enable failure.
        }
        try {
          properties(settings).setProperty(
            WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED,
            'false'
          );
        } catch (enabledRollbackError) {
          // Preserve the original safe enable failure.
        }
        throw error;
      }
    });
  }

  function disableAutomationUnlocked(settings) {
    var props = properties(settings);
    var scriptApp = scriptService(settings);
    try {
      props.setProperty(
        WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE,
        'false'
      );
    } catch (desiredStateError) {
      // The authoritative enabled flag and Trigger cleanup remain independent.
    }
    var flagWriteFailures = 0;
    try {
      props.setProperty(
        WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED,
        'false'
      );
    } catch (flagWriteError) {
      /*
       * Continue to physical Trigger cleanup. A transient Script Properties
       * failure must not prevent the independent stop mechanism from running.
       */
      flagWriteFailures += 1;
    }
    var failures = 0;
    var removed = 0;
    handlerTriggers(scriptApp).forEach(function (trigger) {
      try {
        scriptApp.deleteTrigger(trigger);
        removed += 1;
      } catch (error) {
        failures += 1;
      }
    });
    if (flagWriteFailures) {
      try {
        props.setProperty(
          WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED,
          'false'
        );
        flagWriteFailures = 0;
      } catch (flagRetryError) {
        // Report the unresolved flag write after Trigger cleanup.
      }
    }
    if (!failures) {
      try {
        props.deleteProperty(
          WorkOsConfig.PROPERTIES.AUTOMATION_TRIGGER_ID
        );
      } catch (idDeleteError) {
        // A stale identifier cannot execute without an owned Trigger.
      }
    }
    var incomplete = failures > 0 && flagWriteFailures > 0;
    return {
      status: incomplete
        ? 'DISABLE_INCOMPLETE'
        : (failures
          ? 'DISABLED_WITH_TRIGGER_CLEANUP_ERROR'
          : (flagWriteFailures
            ? 'DISABLED_WITH_FLAG_WRITE_ERROR'
            : 'DISABLED')),
      enabled: incomplete ? null : false,
      effective_running: incomplete ? null : false,
      removed_count: removed,
      cleanup_error_count: failures,
      flag_write_error_count: flagWriteFailures
    };
  }

  function disableAutomation(options) {
    var settings = injected(options);
    var preDisabled = false;
    try {
      properties(settings).setProperty(
        WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE,
        'false'
      );
      properties(settings).setProperty(
        WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED,
        'false'
      );
      preDisabled = true;
    } catch (preDisableError) {
      // The locked path retries the flag and independently removes Triggers.
    }
    try {
      return withAutomationMutation(settings, function () {
        return disableAutomationUnlocked(settings);
      });
    } catch (error) {
      if (error instanceof WorkOsAppError &&
          error.code === 'E_LOCK_TIMEOUT') {
        return {
          status: preDisabled
            ? 'DISABLED_WITH_TRIGGER_CLEANUP_DEFERRED'
            : 'DISABLE_INCOMPLETE',
          enabled: preDisabled ? false : null,
          effective_running: preDisabled ? false : null,
          removed_count: 0,
          cleanup_error_count: 0,
          flag_write_error_count: preDisabled ? 0 : 1,
          cleanup_deferred: true
        };
      }
      throw error;
    }
  }

  function runScheduledWorker(event, options) {
    var settings = injected(options);
    var props = properties(settings);
    if (props.getProperty(
      WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED
    ) !== 'true' ||
        props.getProperty(
          WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE
        ) !== 'true') {
      return {
        status: 'DISABLED',
        processed_count: 0,
        external_services_called: false
      };
    }
    var status = getAutomationStatus(settings);
    if (status.status !== 'CONSISTENT' ||
        !status.prerequisites.ready) {
      return {
        status: 'REFUSED',
        processed_count: 0,
        external_services_called: false,
        reason: status.status !== 'CONSISTENT'
          ? 'TRIGGER_STATE_INCONSISTENT'
          : 'PREREQUISITES_INCOMPLETE'
      };
    }
    var eventTriggerId = String(event && event.triggerUid || '');
    var storedId = String(props.getProperty(
      WorkOsConfig.PROPERTIES.AUTOMATION_TRIGGER_ID
    ) || '');
    if (!eventTriggerId || eventTriggerId !== storedId) {
      return {
        status: 'NON_CANONICAL_TRIGGER',
        processed_count: 0,
        external_services_called: false
      };
    }
    var worker = settings.worker || WorkOsWorker;
    if (!worker || typeof worker.processAutomaticBatch !== 'function') {
      return {
        status: 'REFUSED',
        processed_count: 0,
        external_services_called: false,
        reason: 'AUTOMATIC_WORKER_UNAVAILABLE'
      };
    }
    var result = worker.processAutomaticBatch(
      settings.worker_options || {}
    );
    props.setProperty(
      WorkOsConfig.PROPERTIES.AUTOMATION_LAST_RUN_AT,
      WorkOsUtilities.now().toISOString()
    );
    return result;
  }

  return Object.freeze({
    inspectAutomationSheetSchemas: inspectAutomationSheetSchemas,
    getEditTriggerStatus: getEditTriggerStatus,
    ensureEditTrigger: ensureEditTrigger,
    getAutomationStatus: getAutomationStatus,
    getDiagnosticAutomationStatus: getDiagnosticAutomationStatus,
    getPersonalAutomationQualificationStatus:
      getPersonalAutomationQualificationStatus,
    getPersonalShadowPilotStatus: getPersonalShadowPilotStatus,
    evaluatePersonalQualificationReadiness:
      evaluatePersonalQualificationReadiness,
    evaluatePersonalShadowPilotReadiness:
      evaluatePersonalShadowPilotReadiness,
    removeDuplicateAutomationTriggers:
      removeDuplicateAutomationTriggers,
    ensureSingleAutomationTrigger: ensureSingleAutomationTrigger,
    enableAutomation: enableAutomation,
    disableAutomation: disableAutomation,
    runScheduledWorker: runScheduledWorker
  });
}());

function runManualImport() {
  return WorkOsWorker.processManualImportOnce();
}

function enableAutomation() {
  return WorkOsAutomation.enableAutomation();
}

function disableAutomation() {
  return WorkOsAutomation.disableAutomation();
}

function getAutomationStatus() {
  return WorkOsAutomation.getAutomationStatus();
}

function getPersonalAutomationQualificationStatus() {
  return WorkOsAutomation.getPersonalAutomationQualificationStatus();
}

function getPersonalShadowPilotStatus() {
  return WorkOsAutomation.getPersonalShadowPilotStatus();
}

function ensureSingleAutomationTrigger() {
  return WorkOsAutomation.ensureSingleAutomationTrigger();
}

function ensureTaskEditTrigger() {
  return WorkOsAutomation.ensureEditTrigger();
}

function removeDuplicateAutomationTriggers() {
  return WorkOsAutomation.removeDuplicateAutomationTriggers();
}

function runScheduledWorker(event) {
  return WorkOsAutomation.runScheduledWorker(event || null);
}
