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
        'Automation萓晏ｭ俶ｳｨ蜈･縺ｯTest mode縺縺代〒蛻ｩ逕ｨ縺ｧ縺阪∪縺吶・
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
        'Spreadsheet謇譛芽・悽莠ｺ縺縺代′Task邱ｨ髮・rigger繧剃ｽ懈・縺ｧ縺阪∪縺吶・
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
        'Bound Spreadsheet繧堤｢ｺ隱阪〒縺阪∪縺帙ｓ縲・
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
          'Task邱ｨ髮・rigger繧貞ｮ牙・縺ｫ菴懈・縺ｧ縺阪∪縺帙ｓ縺ｧ縺励◆縲・
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
        'Task邱ｨ髮・rigger縺ｮ謇譛画ュ蝣ｱ繧堤｢ｺ隱阪〒縺阪∪縺帙ｓ縺ｧ縺励◆縲・
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
        'Automation Trigger邂｡逅・ock繧貞茜逕ｨ縺ｧ縺阪∪縺帙ｓ縲・
      );
    }
    var lock = LockService.getDocumentLock();
    if (!lock ||
        !lock.tryLock(WorkOsConfig.LOCK_WAIT_MS)) {
      throw new WorkOsAppError(
        'E_LOCK_TIMEOUT',
        'AUTOMATION_TRIGGER',
        true,
        '蛻･縺ｮTrigger邂｡逅・・逅・′螳溯｡御ｸｭ縺ｧ縺吶・
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

  function defaultPrerequisiteCheck(settings) {
    var props = properties(settings);
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
    if (completed.indexOf('S99_COMPLETE') === -1) {
      reasons.push('SETUP_NOT_COMPLETE');
    }
    if (WorkOsConfig.TEST_MODE === true) {
      reasons.push('TEST_MODE_ENABLED');
    }
    if (!props.getProperty(WorkOsConfig.PROPERTIES.DEADLINE_CALENDAR_ID)) {
      reasons.push('CALENDAR_NOT_CONFIGURED');
    }
    appendScopeDecisionReasons(reasons);
    var sharedPreflight =
      appendSharedPreflightReasons(settings, reasons);
    if (props.getProperty(WorkOsConfig.PROPERTIES.CODE_VERSION) !==
        WorkOsConfig.CODE_VERSION) {
      reasons.push('CODE_VERSION_MISMATCH');
    }
    if (props.getProperty(WorkOsConfig.PROPERTIES.SCHEMA_VERSION) !==
        WorkOsConfig.SCHEMA_VERSION) {
      reasons.push('SCHEMA_VERSION_MISMATCH');
    }
    if (props.getProperty(WorkOsConfig.PROPERTIES.MIGRATION_VERSION) !==
        WorkOsConfig.MIGRATION_VERSION) {
      reasons.push('MIGRATION_VERSION_MISMATCH');
    }
    if (typeof WorkOsAiAdapter === 'undefined' ||
        typeof WorkOsAiAdapter.getProductionReadiness !== 'function') {
      reasons.push('EXTERNAL_AI_NOT_CONFIGURED');
      reasons.push('COMPANY_APPROVAL_NOT_CONFIRMED');
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
    var scriptApp = scriptService(settings);
    if (!scriptApp ||
        typeof scriptApp.getAuthorizationInfo !== 'function' ||
        !scriptApp.AuthMode ||
        !scriptApp.AuthMode.FULL) {
      reasons.push('OAUTH_STATUS_UNAVAILABLE');
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
          reasons.push('OAUTH_STATUS_UNAVAILABLE');
        } else if (status !== 'NOT_REQUIRED') {
          reasons.push('OAUTH_AUTHORIZATION_REQUIRED');
        }
      } catch (error) {
        reasons.push('OAUTH_STATUS_UNAVAILABLE');
      }
    }
    /*
     * Run the service-backed readiness checks only after every policy and
     * credential prerequisite has passed. In the current Phase 6 baseline
     * those approvals are deliberately false, so status remains read-only and
     * does not touch Gmail or construct an external Adapter.
     */
    if (!reasons.length) {
      try {
        var labelStatus = WorkOsGmailGateway.inspectFormalLabels();
        if (!labelStatus.complete) {
          reasons.push('FORMAL_GMAIL_LABEL_MISSING');
        }
      } catch (labelError) {
        reasons.push('GMAIL_LABEL_READINESS_UNAVAILABLE');
      }
      try {
        var productionAdapter =
          WorkOsAiAdapter.createProductionExternalAdapter();
        var health = productionAdapter.healthCheck();
        var metadata = WorkOsAiAdapter.getMetadata(productionAdapter);
        if (!health || health.status !== 'READY' ||
            String(metadata.provider || '').toUpperCase() === 'MOCK') {
          reasons.push('REAL_AI_ADAPTER_NOT_READY');
        }
      } catch (adapterError) {
        reasons.push('REAL_AI_ADAPTER_NOT_READY');
      }
    }
    return {
      ready: reasons.length === 0,
      reasons: reasons,
      real_provider_connection: 'NOT_EXECUTED',
      company_approval: WorkOsConfig.EXTERNAL_AI_COMPANY_APPROVED
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

  function prerequisiteStatus(settings) {
    var checker = settings.prerequisite_checker ||
      defaultPrerequisiteCheck;
    var result = checker(settings) || {};
    return {
      ready: result.ready === true,
      reasons: Array.isArray(result.reasons)
        ? result.reasons.map(function (reason) {
          return String(reason).slice(0, 80);
        })
        : [],
      real_provider_connection: String(
        result.real_provider_connection || 'NOT_EXECUTED'
      ),
      company_approval: String(
        result.company_approval || 'NOT_CONFIRMED'
      ),
      credential_storage_approval: String(
        result.credential_storage_approval || 'NOT_CONFIRMED'
      ),
      shared_preflight_ready:
        result.shared_preflight_ready === true,
      runtime_settings: result.runtime_settings || null
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
      reasons.push('COMPANY_APPROVAL_NOT_CONFIRMED');
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
      company_approval: WorkOsConfig.EXTERNAL_AI_COMPANY_APPROVED
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

  function automationStatusInternal(settings, diagnosticOnly) {
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
        ? diagnosticPrerequisiteStatus(settings)
        : prerequisiteStatus(settings),
      google_workspace_trigger_list: settings.script_app
        ? 'LOCAL_FAKE'
        : 'REAL_READ'
    };
  }

  function getAutomationStatus(options) {
    return automationStatusInternal(injected(options), false);
  }

  function getDiagnosticAutomationStatus(options) {
    return automationStatusInternal(injected(options), true);
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
        '閾ｪ蜍募・逅・・蜑肴署譚｡莉ｶ縺梧悴螳御ｺ・〒縺吶・
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
        'Automation Trigger繧貞ｮ牙・縺ｫ菴懈・縺ｧ縺阪∪縺帙ｓ縺ｧ縺励◆縲・
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
        company_approval: prerequisites.company_approval,
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
        'Automation譛牙柑蛹也憾諷九ｒ螳牙・縺ｫ遒ｺ螳壹〒縺阪∪縺帙ｓ縺ｧ縺励◆縲・
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

