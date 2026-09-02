/**
 * Code-owned AI provider selection and qualification boundary.
 *
 * WORK_OS_V2_ACTIVE_AI_PROVIDER is the only authoritative selection input.
 * The Settings sheet value remains informational and protected.  A switch is
 * allowed only while Automation is consistently disabled, owned clock
 * triggers are absent, and no worker lease, in-flight classification, or
 * retry is pending.  This module never makes an external request while
 * switching providers.
 */
var WorkOsAiProviderSelection = (function () {
  var DEFAULT_PROVIDER = 'GEMINI';
  var QUALIFICATION_STATUS_VERSION = 'WORK_OS_AI_QUALIFICATION_V1';

  function fail(code, stage, message) {
    throw new WorkOsAppError(
      code,
      stage || 'AI_PROVIDER_SELECTION',
      false,
      message || 'AI provider selection could not be accepted.'
    );
  }

  function propertyService(supplied) {
    if (supplied && typeof supplied.getProperty === 'function') {
      return supplied;
    }
    if (typeof PropertiesService !== 'undefined' && PropertiesService &&
        typeof PropertiesService.getScriptProperties === 'function') {
      return PropertiesService.getScriptProperties();
    }
    if (WorkOsConfig.TEST_MODE === true) {
      return {
        getProperty: function () { return null; },
        setProperty: function () {},
        deleteProperty: function () {}
      };
    }
    fail('E_PROPERTIES_UNAVAILABLE');
  }

  function allowedProviders() {
    var configured = Array.isArray(WorkOsConfig.AI_PROVIDER_SELECTION_ALLOWED)
      ? WorkOsConfig.AI_PROVIDER_SELECTION_ALLOWED
      : ['GEMINI', 'OPENAI'];
    return configured.slice().map(function (value) {
      return String(value || '').toUpperCase();
    });
  }

  function normalizeProvider(value) {
    var provider = String(value || '').trim().toUpperCase();
    if (allowedProviders().indexOf(provider) === -1) {
      fail(
        'E_AI_PROVIDER_SELECTION_INVALID',
        'AI_PROVIDER_SELECTION',
        'AI providerは許可された値だけを指定できます。'
      );
    }
    return provider;
  }

  function selectionSnapshot(suppliedProperties) {
    var props = propertyService(suppliedProperties);
    var raw = String(props.getProperty(
      WorkOsConfig.PROPERTIES.ACTIVE_AI_PROVIDER
    ) || '').trim();
    if (!raw) {
      return {
        provider: DEFAULT_PROVIDER,
        property_present: false,
        source: 'BACKWARD_COMPATIBLE_GEMINI_INFERRED',
        raw: ''
      };
    }
    return {
      provider: normalizeProvider(raw),
      property_present: true,
      source: 'ACTIVE_PROVIDER_PROPERTY',
      raw: raw
    };
  }

  function providerMetadata(provider) {
    var selected = normalizeProvider(provider);
    if (selected === 'OPENAI') {
      return {
        provider: 'OPENAI',
        model: String(WorkOsOpenAiProvider.MODEL),
        prompt_version: String(WorkOsOpenAiProvider.PROMPT_VERSION),
        credential_reference: String(
          WorkOsOpenAiProvider.CREDENTIAL_REFERENCE
        ),
        endpoint: String(WorkOsOpenAiProvider.ENDPOINT),
        data_governance_status:
          String(WorkOsConfig.OPENAI_DATA_GOVERNANCE_STATUS)
      };
    }
    return {
      provider: 'GEMINI',
      model: String(WorkOsGeminiProvider.MODEL),
      prompt_version: String(WorkOsGeminiProvider.PROMPT_VERSION),
      credential_reference: String(WorkOsGeminiProvider.CREDENTIAL_REFERENCE),
      endpoint: String(WorkOsGeminiProvider.ENDPOINT),
      data_governance_status: 'LEGACY_PROVIDER_POLICY_FLAG'
    };
  }

  function productionConfigSnapshot(options) {
    var settings = options || {};
    var props = propertyService(settings.properties);
    var selection = selectionSnapshot(props);
    var metadata = providerMetadata(selection.provider);
    var isOpenAi = selection.provider === 'OPENAI';
    return {
      external_enabled: isOpenAi
        ? WorkOsConfig.OPENAI_EXTERNAL_AI_ENABLED
        : WorkOsConfig.EXTERNAL_AI_ENABLED,
      provider: metadata.provider,
      model: metadata.model,
      prompt_version: metadata.prompt_version,
      credential_reference: metadata.credential_reference,
      operator_approved: isOpenAi
        ? WorkOsConfig.OPENAI_OPERATOR_APPROVED
        : WorkOsConfig.EXTERNAL_AI_OPERATOR_APPROVED,
      company_approved: isOpenAi
        ? WorkOsConfig.OPENAI_OPERATOR_APPROVED
        : WorkOsConfig.EXTERNAL_AI_COMPANY_APPROVED,
      data_policy_approved: isOpenAi
        ? WorkOsConfig.OPENAI_DATA_POLICY_APPROVED
        : WorkOsConfig.EXTERNAL_AI_DATA_POLICY_APPROVED,
      credential_storage_approved: isOpenAi
        ? WorkOsConfig.OPENAI_CREDENTIAL_STORAGE_APPROVED
        : WorkOsConfig.EXTERNAL_AI_CREDENTIAL_STORAGE_APPROVED,
      auth_configured: isOpenAi
        ? WorkOsConfig.OPENAI_AUTH_CONFIGURED
        : WorkOsConfig.EXTERNAL_AI_AUTH_CONFIGURED,
      timeout_ms: WorkOsConfig.AI_REQUEST_TIMEOUT_MS,
      max_response_chars: WorkOsConfig.AI_RESPONSE_MAX_CHARS,
      properties: props,
      selection_source: selection.source,
      data_governance_status: metadata.data_governance_status
    };
  }

  function boundedCount(value) {
    var numeric = Number(value);
    return Number.isInteger(numeric) && numeric >= 0 && numeric <= 100
      ? numeric
      : -1;
  }

  function automationSnapshot(settings, props) {
    var value = settings || {};
    if (value.automation_status &&
        typeof value.automation_status === 'object') {
      return {
        status: String(value.automation_status.status || 'UNKNOWN'),
        enabled: value.automation_status.enabled === true,
        desired_enabled: value.automation_status.desired_enabled === true,
        trigger_count: boundedCount(value.automation_status.trigger_count),
        clock_trigger_count:
          boundedCount(value.automation_status.clock_trigger_count),
        stored_trigger_id_present:
          value.automation_status.stored_trigger_id_present === true,
        canonical_trigger_present:
          value.automation_status.canonical_trigger_present === true
      };
    }
    var scriptApp = value.script_app ||
      (typeof ScriptApp !== 'undefined' ? ScriptApp : null);
    var triggers = null;
    if (scriptApp && typeof scriptApp.getProjectTriggers === 'function') {
      try {
        triggers = (scriptApp.getProjectTriggers() || []).filter(function (item) {
          try {
            return String(item.getHandlerFunction()) ===
              WorkOsConfig.AUTOMATION_HANDLER_FUNCTION;
          } catch (error) {
            return false;
          }
        });
      } catch (error) {
        triggers = null;
      }
    }
    var enabled = props.getProperty(
      WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED
    ) === 'true';
    var desired = props.getProperty(
      WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE
    ) === 'true';
    if (!triggers) {
      return {
        status: 'UNKNOWN',
        enabled: enabled,
        desired_enabled: desired,
        trigger_count: -1,
        clock_trigger_count: -1,
        stored_trigger_id_present: Boolean(props.getProperty(
          WorkOsConfig.PROPERTIES.AUTOMATION_TRIGGER_ID
        )),
        canonical_trigger_present: false
      };
    }
    var storedId = String(props.getProperty(
      WorkOsConfig.PROPERTIES.AUTOMATION_TRIGGER_ID
    ) || '');
    var ids = triggers.map(function (item) {
      try {
        return String(item.getUniqueId ? item.getUniqueId() : '');
      } catch (error) {
        return '';
      }
    });
    var clockCount = triggers.filter(function (item) {
      try {
        return String(item.getEventType ? item.getEventType() : '') === 'CLOCK';
      } catch (error) {
        return false;
      }
    }).length;
    var canonical = Boolean(storedId && ids.indexOf(storedId) !== -1);
    var consistent = enabled
      ? triggers.length === 1 && clockCount === 1 && canonical && desired
      : triggers.length === 0 && !storedId && !desired;
    return {
      status: consistent ? 'CONSISTENT' : 'INCONSISTENT',
      enabled: enabled,
      desired_enabled: desired,
      trigger_count: triggers.length,
      clock_trigger_count: clockCount,
      stored_trigger_id_present: Boolean(storedId),
      canonical_trigger_present: canonical
    };
  }

  function leaseSnapshot(settings, props) {
    var value = settings || {};
    if (value.active_worker_lease === true) {
      return { status: 'ACTIVE', active: true };
    }
    var raw = String(props.getProperty(
      WorkOsConfig.PROPERTIES.ACTIVE_WORKER_LEASE
    ) || '');
    if (!raw) {
      return { status: 'ABSENT', active: false };
    }
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return { status: 'MALFORMED', active: true };
    }
    var expiresAt = new Date(parsed && parsed.expires_at);
    if (!parsed || !parsed.owner_token || isNaN(expiresAt.getTime())) {
      return { status: 'MALFORMED', active: true };
    }
    var now = WorkOsUtilities.now();
    if (expiresAt.getTime() > now.getTime()) {
      return { status: 'ACTIVE', active: true };
    }
    return { status: 'EXPIRED', active: false };
  }

  function recordStateCounts(settings, spreadsheet, lock) {
    var value = settings || {};
    var inFlight = Number(value.in_flight_count || 0);
    var pendingRetry = Number(value.pending_retry_count || 0);
    if (Number.isInteger(inFlight) && inFlight >= 0 &&
        Number.isInteger(pendingRetry) && pendingRetry >= 0 &&
        (Object.prototype.hasOwnProperty.call(value, 'in_flight_count') ||
         Object.prototype.hasOwnProperty.call(value, 'pending_retry_count'))) {
      return { in_flight_count: inFlight, pending_retry_count: pendingRetry };
    }
    var records = Array.isArray(value.message_records)
      ? value.message_records
      : null;
    if (!records && spreadsheet && lock &&
        typeof WorkOsMessageStateRepository !== 'undefined' &&
        WorkOsMessageStateRepository &&
        typeof WorkOsMessageStateRepository.createContextForHeldLock ===
          'function') {
      try {
        var sheet = WorkOsMessageStateRepository.messageSheet(spreadsheet);
        var context = WorkOsMessageStateRepository.createContextForHeldLock(
          sheet,
          lock
        );
        records = context.logicalRows;
      } catch (error) {
        return { in_flight_count: -1, pending_retry_count: -1 };
      }
    }
    if (!records) {
      return { in_flight_count: 0, pending_retry_count: 0 };
    }
    var inFlightCount = 0;
    var pendingRetryCount = 0;
    records.forEach(function (record) {
      var status = String(record && record.processing_status || '');
      if (status === 'CLAIMED' || status === 'PREPROCESSED') {
        inFlightCount += 1;
      }
      if (status === 'RETRY') {
        pendingRetryCount += 1;
      }
    });
    return {
      in_flight_count: inFlightCount,
      pending_retry_count: pendingRetryCount
    };
  }

  function switchBlockers(settings, spreadsheet, lock) {
    var value = settings || {};
    var props = propertyService(value.properties);
    var automation = automationSnapshot(value, props);
    var reasons = [];
    if (automation.status !== 'CONSISTENT' ||
        automation.enabled !== false ||
        automation.desired_enabled !== false ||
        automation.trigger_count !== 0 ||
        automation.clock_trigger_count !== 0 ||
        automation.stored_trigger_id_present !== false ||
        automation.canonical_trigger_present !== false) {
      reasons.push('AUTOMATION_NOT_CONSISTENTLY_OFF');
    }
    var lease = leaseSnapshot(value, props);
    if (lease.active) {
      reasons.push(lease.status === 'MALFORMED'
        ? 'WORKER_LEASE_MALFORMED'
        : 'WORKER_LEASE_ACTIVE');
    }
    var counts = recordStateCounts(value, spreadsheet, lock);
    if (counts.in_flight_count < 0 || counts.pending_retry_count < 0) {
      reasons.push('MESSAGE_STATE_UNAVAILABLE');
    } else {
      if (counts.in_flight_count > 0) {
        reasons.push('AI_ATTEMPT_IN_FLIGHT');
      }
      if (counts.pending_retry_count > 0) {
        reasons.push('AI_RETRY_PENDING');
      }
    }
    return {
      ready: reasons.length === 0,
      reasons: reasons,
      automation: automation,
      worker_lease: lease,
      in_flight_count: counts.in_flight_count,
      pending_retry_count: counts.pending_retry_count
    };
  }

  function getSwitchBlockers(options) {
    var value = options || {};
    if (Object.keys(value).length && !WorkOsConfig.TEST_MODE) {
      fail('E_TEST_MODE_DISABLED', 'AI_PROVIDER_SELECTION');
    }
    return switchBlockers(value, value.spreadsheet || null, null);
  }

  function currentProvider(properties) {
    return selectionSnapshot(properties).provider;
  }

  function assertProviderUnchanged(provider, properties) {
    if (currentProvider(properties) !== normalizeProvider(provider)) {
      fail(
        'E_AI_PROVIDER_CHANGED_DURING_ATTEMPT',
        'AI_PROVIDER_SELECTION',
        'AI providerが分類中に変更されたため結果を保存しません。'
      );
    }
    return true;
  }

  function switchProvider(target, options) {
    var value = options || {};
    if (Object.keys(value).length && !WorkOsConfig.TEST_MODE) {
      fail('E_TEST_MODE_DISABLED', 'AI_PROVIDER_SELECTION');
    }
    var selected = normalizeProvider(target);
    var props = propertyService(value.properties);
    var spreadsheet = value.spreadsheet || null;
    return WorkOsUtilities.withScriptLock(function (lock) {
      var guards = switchBlockers(value, spreadsheet, lock);
      if (!guards.ready) {
        var error = new WorkOsAppError(
          'E_AI_PROVIDER_SWITCH_BLOCKED',
          'AI_PROVIDER_SELECTION',
          false,
          'Automation停止、owned clock Triggerゼロ、未完了AI処理なしが必要です。'
        );
        error.diagnostic = { reasons: guards.reasons.slice(0, 10) };
        throw error;
      }
      var beforeRaw = String(props.getProperty(
        WorkOsConfig.PROPERTIES.ACTIVE_AI_PROVIDER
      ) || '');
      var before = selectionSnapshot(props).provider;
      try {
        props.setProperty(
          WorkOsConfig.PROPERTIES.ACTIVE_AI_PROVIDER,
          selected
        );
        if (typeof value.dependent_update === 'function') {
          value.dependent_update({
            previous_provider: before,
            selected_provider: selected
          });
        }
        if (String(props.getProperty(
          WorkOsConfig.PROPERTIES.ACTIVE_AI_PROVIDER
        ) || '').toUpperCase() !== selected) {
          throw new Error('AI_PROVIDER_SWITCH_POSTCONDITION_FAILED');
        }
      } catch (error) {
        try {
          if (beforeRaw) {
            props.setProperty(
              WorkOsConfig.PROPERTIES.ACTIVE_AI_PROVIDER,
              beforeRaw
            );
          } else if (typeof props.deleteProperty === 'function') {
            props.deleteProperty(WorkOsConfig.PROPERTIES.ACTIVE_AI_PROVIDER);
          } else {
            props.setProperty(
              WorkOsConfig.PROPERTIES.ACTIVE_AI_PROVIDER,
              DEFAULT_PROVIDER
            );
          }
        } catch (rollbackError) {
          // Keep the public error safe; an absent property still infers Gemini.
        }
        throw new WorkOsAppError(
          'E_AI_PROVIDER_SWITCH_ROLLED_BACK',
          'AI_PROVIDER_SELECTION',
          false,
          'AI provider切り替えを確定できなかったため元の選択へ戻しました。'
        );
      }
      return {
        status: before === selected ? 'NOOP' : 'SWITCHED',
        previous_provider: before,
        selected_provider: selected,
        automation_enabled: false,
        external_request_performed: false,
        qualification_invalidated: before !== selected
      };
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  function ensureDefaultSelection(options) {
    var value = options || {};
    var props = propertyService(value.properties);
    if (!props.getProperty(WorkOsConfig.PROPERTIES.ACTIVE_AI_PROVIDER)) {
      props.setProperty(
        WorkOsConfig.PROPERTIES.ACTIVE_AI_PROVIDER,
        DEFAULT_PROVIDER
      );
      return { initialized: true, provider: DEFAULT_PROVIDER };
    }
    var selection = selectionSnapshot(props);
    return { initialized: false, provider: selection.provider };
  }

  function qualificationFingerprint(metadata, properties) {
    var props = propertyService(properties);
    var instance = String(props.getProperty(
      WorkOsConfig.PROPERTIES.INSTANCE_ID
    ) || 'INSTANCE_NOT_INITIALIZED');
    return WorkOsUtilities.sha256Hex(JSON.stringify({
      contract: 'WORK_OS_AI_QUALIFICATION_FINGERPRINT_V1',
      provider: metadata.provider,
      model: metadata.model,
      prompt_version: metadata.prompt_version,
      code_version: WorkOsConfig.CODE_VERSION,
      schema_version: WorkOsConfig.SCHEMA_VERSION,
      ai_schema_version: WorkOsConfig.AI_SCHEMA_VERSION,
      migration_version: WorkOsConfig.MIGRATION_VERSION,
      instance_fingerprint: WorkOsUtilities.sha256Hex(instance)
    }));
  }

  function safeQualificationState(properties) {
    var props = propertyService(properties);
    var raw = String(props.getProperty(
      WorkOsConfig.PROPERTIES.AI_QUALIFICATION_STATUS
    ) || '');
    if (!raw) {
      return { status: 'NOT_RECORDED', fingerprint: '' };
    }
    try {
      var value = JSON.parse(raw);
      if (!value || typeof value !== 'object' || Array.isArray(value) ||
          value.schema !== QUALIFICATION_STATUS_VERSION ||
          !/^[A-Z0-9_]{1,48}$/.test(String(value.status || '')) ||
          !/^[A-Z0-9_]{1,16}$/.test(String(value.provider || '')) ||
          !/^[0-9a-f]{64}$/.test(String(value.fingerprint || '')) ||
          !/^[0-9a-f]{64}$/.test(String(value.instance_fingerprint || ''))) {
        return { status: 'INVALID', fingerprint: '' };
      }
      return {
        status: String(value.status),
        provider: String(value.provider),
        model: String(value.model || ''),
        prompt_version: String(value.prompt_version || ''),
        fingerprint: String(value.fingerprint),
        instance_fingerprint: String(value.instance_fingerprint)
      };
    } catch (error) {
      return { status: 'INVALID', fingerprint: '' };
    }
  }

  function isCurrentQualificationValid(options) {
    var value = options || {};
    var props = propertyService(value.properties);
    var selection = selectionSnapshot(props);
    var metadata = providerMetadata(selection.provider);
    var expected = qualificationFingerprint(metadata, props);
    var state = safeQualificationState(props);
    var storedFingerprint = String(props.getProperty(
      WorkOsConfig.PROPERTIES.AI_QUALIFICATION_FINGERPRINT
    ) || '');
    return {
      valid: state.status === 'PASS' && state.provider === metadata.provider &&
        state.model === metadata.model &&
        state.prompt_version === metadata.prompt_version &&
        state.fingerprint === expected && storedFingerprint === expected,
      status: state.status,
      provider: metadata.provider,
      fingerprint_present: Boolean(storedFingerprint),
      fingerprint_current: storedFingerprint === expected
    };
  }

  function syntheticInput(provider) {
    var selected = normalizeProvider(provider);
    var source = selected === 'OPENAI'
      ? WorkOsOpenAiProvider
      : WorkOsGeminiProvider;
    return {
      schema_version: WorkOsConfig.AI_SCHEMA_VERSION,
      message: {
        message_id: 'synthetic-work-0039-qualification-message',
        thread_id: 'synthetic-work-0039-qualification-thread',
        stable_thread_key: 'root:synthetic-work-0039-qualification-thread',
        subject: source.SYNTHETIC_SUBJECT,
        sender: 'fixture@example.invalid',
        received_at: '2026-09-02T00:00:00.000Z',
        plain_body: source.SYNTHETIC_BODY,
        prior_messages: []
      },
      active_tasks: [],
      context: { today: '2026-09-02', timezone: WorkOsConfig.TIMEZONE },
      constraints: {
        max_actions: WorkOsConfig.MAX_AI_ACTIONS,
        no_attachment_analysis: true,
        no_email_send: true
      }
    };
  }

  function storeQualificationResult(properties, metadata, status, fingerprint,
    errorCode) {
    var props = propertyService(properties);
    var instance = String(props.getProperty(
      WorkOsConfig.PROPERTIES.INSTANCE_ID
    ) || 'INSTANCE_NOT_INITIALIZED');
    var record = {
      schema: QUALIFICATION_STATUS_VERSION,
      status: status,
      provider: metadata.provider,
      model: metadata.model,
      prompt_version: metadata.prompt_version,
      fingerprint: fingerprint,
      instance_fingerprint: WorkOsUtilities.sha256Hex(instance)
    };
    if (errorCode) {
      record.error_code = String(errorCode).slice(0, 48);
    }
    props.setProperty(
      WorkOsConfig.PROPERTIES.AI_QUALIFICATION_STATUS,
      JSON.stringify(record)
    );
    props.setProperty(
      WorkOsConfig.PROPERTIES.AI_QUALIFICATION_FINGERPRINT,
      fingerprint
    );
  }

  function runSyntheticQualification(options) {
    var value = options || {};
    if (Object.keys(value).length && !WorkOsConfig.TEST_MODE) {
      fail('E_TEST_MODE_DISABLED', 'AI_QUALIFICATION');
    }
    var props = propertyService(value.properties);
    var guards = switchBlockers(value, value.spreadsheet || null, null);
    if (!guards.ready) {
      fail(
        'E_AI_QUALIFICATION_BLOCKED',
        'AI_QUALIFICATION',
        '合成qualificationはAutomation停止中で未完了AI処理がない場合だけ実行できます。'
      );
    }
    var selection = selectionSnapshot(props);
    var metadata = providerMetadata(selection.provider);
    var fingerprint = qualificationFingerprint(metadata, props);
    var adapter = value.adapter || null;
    var requestStarted = false;
    try {
      if (!adapter) {
        adapter = WorkOsAiAdapter.createProductionExternalAdapter();
      }
      var observed = WorkOsAiAdapter.getMetadata(adapter);
      if (observed.provider !== metadata.provider ||
          observed.model !== metadata.model ||
          observed.prompt_version !== metadata.prompt_version) {
        fail(
          'E_AI_PROVIDER_CHANGED_DURING_ATTEMPT',
          'AI_QUALIFICATION',
          '選択中providerと実行providerが一致しません。'
        );
      }
      assertProviderUnchanged(metadata.provider, props);
      requestStarted = true;
      var output = adapter.classify(syntheticInput(metadata.provider));
      WorkOsAiAdapter.validateOutput(output);
      assertProviderUnchanged(metadata.provider, props);
      storeQualificationResult(props, metadata, 'PASS', fingerprint, '');
      return {
        status: 'QUALIFIED',
        provider: metadata.provider,
        model: metadata.model,
        prompt_version: metadata.prompt_version,
        qualification_status: 'PASS',
        fingerprint_present: true,
        external_request_performed: requestStarted,
        real_data_used: false,
        stored_response: false
      };
    } catch (error) {
      var safeCode = error instanceof WorkOsAppError
        ? String(error.code || 'E_AI_QUALIFICATION_FAILED')
        : 'E_AI_QUALIFICATION_FAILED';
      storeQualificationResult(props, metadata, 'FAILED', fingerprint, safeCode);
      if (error instanceof WorkOsAppError) {
        throw error;
      }
      fail('E_AI_QUALIFICATION_FAILED', 'AI_QUALIFICATION');
    }
  }

  function providerStatus(options) {
    var value = options || {};
    var props = propertyService(value.properties);
    var selection = selectionSnapshot(props);
    var metadata = providerMetadata(selection.provider);
    var automation = automationSnapshot(value, props);
    var module = selection.provider === 'OPENAI'
      ? WorkOsOpenAiProvider
      : WorkOsGeminiProvider;
    var readiness = null;
    try {
      readiness = module.readiness({
        properties: props,
        automation_status: automation,
        local_test_only: true
      });
    } catch (error) {
      readiness = { ready: false, status: 'BLOCKED' };
    }
    var qualification = isCurrentQualificationValid({ properties: props });
    return {
      status: 'OK',
      selected_provider: metadata.provider,
      selection_source: selection.source,
      selection_property_present: selection.property_present,
      allowed_providers: allowedProviders(),
      model: metadata.model,
      prompt_version: metadata.prompt_version,
      credential_reference: metadata.credential_reference,
      credential_configured: readiness &&
        readiness.credential_configured === true,
      provider_registered: readiness && readiness.provider_registered === true,
      provider_readiness: readiness && readiness.ready === true
        ? 'READY' : 'BLOCKED',
      data_governance_status: metadata.data_governance_status,
      qualification_status: qualification.status,
      qualification_fingerprint_current: qualification.valid,
      automation: automation,
      external_request_performed: false
    };
  }

  return Object.freeze({
    DEFAULT_PROVIDER: DEFAULT_PROVIDER,
    allowedProviders: allowedProviders,
    normalizeProvider: normalizeProvider,
    getSelectionSnapshot: function (options) {
      return selectionSnapshot(options && options.properties);
    },
    getProviderMetadata: providerMetadata,
    getProductionConfigSnapshot: productionConfigSnapshot,
    getSwitchBlockers: getSwitchBlockers,
    switchProvider: switchProvider,
    ensureDefaultSelection: ensureDefaultSelection,
    getProviderStatus: providerStatus,
    assertProviderUnchanged: assertProviderUnchanged,
    qualificationFingerprint: qualificationFingerprint,
    isCurrentQualificationValid: isCurrentQualificationValid,
    runSyntheticQualification: runSyntheticQualification,
    safeQualificationState: safeQualificationState
  });
}());

function getAiProviderStatus() {
  return WorkOsAiProviderSelection.getProviderStatus();
}

function switchAiProviderToGemini() {
  return WorkOsAiProviderSelection.switchProvider('GEMINI');
}

function switchAiProviderToOpenAi() {
  return WorkOsAiProviderSelection.switchProvider('OPENAI');
}

function runSelectedProviderSyntheticQualification() {
  return WorkOsAiProviderSelection.runSyntheticQualification();
}
