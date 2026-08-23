/**
 * New-environment-only, staged setup available through the Phase 4 build.
 */
var WorkOsSetup = (function () {
  var MODULE_CONTRACT_ID = 'WORK_OS_V2_S90_CONTRACT_2_8_11';

  function safeNormalizationEvidence(value) {
    if (!value || typeof value !== 'object') {
      return null;
    }
    var allowedStatus = {
      CANONICAL: true,
      NORMALIZED: true,
      FAILED_POSTCONDITION: true
    };
    var status = String(
      value.normalization_status || value.status || ''
    );
    if (!allowedStatus[status]) {
      return null;
    }
    var checkedCellCount = Number(value.checked_cell_count);
    var noncanonicalCount = Number(value.noncanonical_count);
    return {
      normalization_status: status,
      write_performed: value.write_performed === true,
      flush_performed: value.flush_performed === true,
      postcondition_verified: value.postcondition_verified === true,
      checked_cell_count:
        Number.isFinite(checkedCellCount) && checkedCellCount >= 0
          ? Math.floor(checkedCellCount)
          : 0,
      noncanonical_count:
        Number.isFinite(noncanonicalCount) && noncanonicalCount >= 0
          ? Math.floor(noncanonicalCount)
          : 0
    };
  }

  function moduleVersionSkewError() {
    var error = new WorkOsAppError(
      'E_MODULE_VERSION_SKEW',
      'S90_QUICK_DIAGNOSTIC',
      false,
      'Setup-critical module contract is not aligned.'
    );
    error.module_contract_status = 'MISMATCH';
    return error;
  }

  function assertS90ModuleContract() {
    if (String(WorkOsConfig.S90_MODULE_CONTRACT_ID || '') !==
        MODULE_CONTRACT_ID ||
        typeof WorkOsDashboard === 'undefined' ||
        !WorkOsDashboard ||
        String(WorkOsDashboard.MODULE_CONTRACT_ID || '') !==
          MODULE_CONTRACT_ID) {
      throw moduleVersionSkewError();
    }
    return { status: 'ALIGNED' };
  }

  function normalizationEvidenceFromResult(result) {
    var direct = safeNormalizationEvidence(
      result && result.dashboard_number_format_normalization
    );
    if (direct) {
      return direct;
    }
    var stages = result && Array.isArray(result.stage_results)
      ? result.stage_results
      : [];
    for (var index = 0; index < stages.length; index += 1) {
      var summary = stages[index] && stages[index].safe_summary;
      var nested = safeNormalizationEvidence(
        summary && summary.dashboard_number_format_normalization
      );
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  function getBoundSpreadsheet() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      throw new WorkOsAppError(
        'E_SETUP_NOT_BOUND',
        'S00_VALIDATE_ENV',
        false,
        'Bound Spreadsheetから実行してください。'
      );
    }
    return spreadsheet;
  }

  function snapshotEnvironment(spreadsheet) {
    return spreadsheet.getSheets().map(function (sheet) {
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      var content = WorkOsUtilities.inspectRangeContent(dataRange, values);
      var firstRow = values.length ? values[0].slice() : [];
      var secondRow = values.length > 1 ? values[1].slice() : [];
      var protectionCount = 0;
      if (typeof sheet.getProtections === 'function') {
        protectionCount += sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).length;
        protectionCount += sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).length;
      }
      return {
        name: sheet.getName(),
        isEmpty: !content.has_value &&
          !content.has_formula &&
          !content.has_note &&
          !content.has_validation &&
          protectionCount === 0,
        firstRow: firstRow,
        secondRow: secondRow,
        maxColumns: sheet.getMaxColumns(),
        content: content,
        protectionCount: protectionCount
      };
    });
  }

  function hasV1Marker(descriptor) {
    if (WorkOsConfig.V1_SHEET_NAMES.indexOf(descriptor.name) !== -1) {
      return true;
    }
    var text = descriptor.firstRow.concat(descriptor.secondRow).join(' ');
    return /Review Queue/i.test(text) ||
      /\bv1(?:\.|\b)/i.test(text) ||
      /schema[_ ]?version[^0-9]*1\./i.test(text);
  }

  function classifyEnvironmentDescriptors(descriptors) {
    var items = descriptors || [];
    if (!items.length) {
      return { allowed: false, code: 'E_SETUP_NO_SHEETS', kind: 'INVALID' };
    }
    if (items.some(hasV1Marker)) {
      return { allowed: false, code: 'E_V1_DETECTED', kind: 'V1' };
    }

    var knownNames = {};
    WorkOsSheetOrder.forEach(function (name) { knownNames[name] = true; });
    var unknown = items.filter(function (item) { return !knownNames[item.name]; });
    var known = items.filter(function (item) { return knownNames[item.name]; });

    if (unknown.length === 1 && known.length === 0 && unknown[0].isEmpty) {
      return { allowed: true, code: 'OK_NEW_EMPTY', kind: 'NEW_EMPTY' };
    }
    if (unknown.length) {
      return {
        allowed: false,
        code: unknown.some(function (item) { return !item.isEmpty; })
          ? 'E_SETUP_NOT_EMPTY'
          : 'E_SETUP_UNKNOWN_SHEET',
        kind: 'UNKNOWN'
      };
    }

    for (var index = 0; index < known.length; index += 1) {
      var descriptor = known[index];
      var schema = WorkOsSchemas.getSheetSchema(descriptor.name);
      var expectedIds = schema.map(function (item) { return item.id; });
      var expectedHeaders = schema.map(function (item) { return item.header; });
      if (!descriptor.isEmpty &&
          descriptor.maxColumns != null &&
          Number(descriptor.maxColumns) !== expectedIds.length) {
        return { allowed: false, code: 'E_SCHEMA_CONFLICT', kind: 'CONFLICT' };
      }
      var ids = descriptor.firstRow.slice(0, expectedIds.length);
      var headers = descriptor.secondRow.slice(0, expectedHeaders.length);
      var idsBlank = ids.every(WorkOsUtilities.isBlank);
      var headersBlank = headers.every(WorkOsUtilities.isBlank);
      var idsExact = JSON.stringify(ids) === JSON.stringify(expectedIds);
      var headersSafe = headers.every(function (value, headerIndex) {
        return WorkOsUtilities.isBlank(value) || String(value) === expectedHeaders[headerIndex];
      });
      if (!descriptor.isEmpty && !(idsExact && headersSafe)) {
        return { allowed: false, code: 'E_SCHEMA_CONFLICT', kind: 'CONFLICT' };
      }
      if (descriptor.isEmpty && !(idsBlank && headersBlank) && !(idsExact && headersSafe)) {
        return { allowed: false, code: 'E_SCHEMA_CONFLICT', kind: 'CONFLICT' };
      }
    }
    return { allowed: true, code: 'OK_V2_RESUMABLE', kind: 'V2_RESUMABLE' };
  }

  function assertEditable(spreadsheet) {
    try {
      var sheets = spreadsheet.getSheets();
      var probeRange = sheets[0].getRange(1, 1, 1, 1);
      if (typeof probeRange.canEdit !== 'function' || !probeRange.canEdit()) {
        throw new WorkOsAppError(
          'E_SETUP_NO_EDIT_ACCESS',
          'S00_VALIDATE_ENV',
          false,
          'Spreadsheetの編集権限を確認できません。'
        );
      }
      return { checked: true, reason: '' };
    } catch (error) {
      if (error instanceof WorkOsAppError) {
        throw error;
      }
      throw new WorkOsAppError(
        'E_SETUP_EDIT_CHECK_UNAVAILABLE',
        'S00_VALIDATE_ENV',
        false,
        'Spreadsheetの編集権限を安全に確認できません。'
      );
    }
  }

  function validateEnvironment(spreadsheet) {
    var classification = classifyEnvironmentDescriptors(snapshotEnvironment(spreadsheet));
    if (!classification.allowed) {
      var message = classification.code === 'E_V1_DETECTED'
        ? 'v1らしい環境を検出しました。自動変換せず停止します。'
        : '新規空Sheetまたは再開可能なv2環境ではないため停止します。';
      throw new WorkOsAppError(
        classification.code,
        'S00_VALIDATE_ENV',
        false,
        message
      );
    }
    var editCheck = assertEditable(spreadsheet);
    return {
      environment: classification.kind,
      edit_access_check: editCheck.checked ? 'PASS' : 'UNVERIFIED'
    };
  }

  function properties() {
    return PropertiesService.getScriptProperties();
  }

  function getCompletedStages() {
    var raw = properties().getProperty(WorkOsConfig.PROPERTIES.SETUP_COMPLETED_STAGES);
    if (!raw) {
      return [];
    }
    try {
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error('completed stages is not an array');
      }
      var seen = {};
      parsed.forEach(function (stage, index) {
        if (typeof stage !== 'string' ||
            WorkOsConfig.SETUP_STAGES.indexOf(stage) === -1 ||
            seen[stage] ||
            WorkOsConfig.SETUP_STAGES[index] !== stage) {
          throw new Error('completed stages is not a valid ordered prefix');
        }
        seen[stage] = true;
      });
      return parsed;
    } catch (error) {
      throw new WorkOsAppError(
        'E_SETUP_STATE_INVALID',
        'SETUP',
        false,
        'Setup状態が不正です。自動修復は行いません。'
      );
    }
  }

  function assertCompletedStageIntegrity(completed, spreadsheet, budget) {
    var stages = completed || [];
    if (stages.indexOf('S10_CREATE_SHEETS') !== -1) {
      var missingSheets = WorkOsSheetOrder.filter(function (sheetName) {
        return !spreadsheet.getSheetByName(sheetName);
      });
      if (missingSheets.length) {
        throw new WorkOsAppError(
          'E_SETUP_STATE_CONFLICT',
          'SETUP',
          false,
          'Setup状態と作成済みSheetが一致しません。'
        );
      }
    }
    if (stages.indexOf('S20_CREATE_SCHEMAS') !== -1) {
      WorkOsSheetOrder.forEach(function (sheetName) {
        var sheet = spreadsheet.getSheetByName(sheetName);
        var expectedIds = WorkOsSchemas.getInternalIds(sheetName);
        var expectedHeaders = WorkOsSchemas.getHeaders(sheetName);
        if (sheet.getMaxColumns() !== expectedIds.length ||
            sheet.getMaxRows() < WorkOsConfig.DATA_START_ROW) {
          throw new WorkOsAppError(
            'E_SETUP_STATE_CONFLICT',
            'SETUP',
            false,
            'Setup状態とSheet Gridが一致しません。'
          );
        }
        var ids = sheet.getRange(1, 1, 1, expectedIds.length).getValues()[0];
        var headers = sheet.getRange(2, 1, 1, expectedHeaders.length).getValues()[0];
        if (JSON.stringify(ids) !== JSON.stringify(expectedIds) ||
            JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
          throw new WorkOsAppError(
            'E_SETUP_STATE_CONFLICT',
            'SETUP',
            false,
            'Setup状態とSchemaが一致しません。'
          );
        }
      });
    }
    if (stages.indexOf('S30_APPLY_SMALL_VALIDATIONS') !== -1) {
      var taskSheet = spreadsheet.getSheetByName(WorkOsConfig.SHEETS.TASKS);
      var plan = WorkOsSchemas.validationPlanForSheet(WorkOsConfig.SHEETS.TASKS);
      var rules = taskSheet.getRange(3, 1, 1, plan.length).getDataValidations()[0];
      plan.forEach(function (item, index) {
        var rule = rules[index];
        var criteria = rule && rule.getCriteriaType();
        if (item.validation === 'CHECKBOX' &&
            criteria !== SpreadsheetApp.DataValidationCriteria.CHECKBOX) {
          throw new WorkOsAppError(
            'E_SETUP_STATE_CONFLICT',
            'SETUP',
            false,
            'Setup状態とCheckbox Validationが一致しません。'
          );
        }
        if (item.validation === 'ENUM' &&
            criteria !== SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
          throw new WorkOsAppError(
            'E_SETUP_STATE_CONFLICT',
            'SETUP',
            false,
            'Setup状態とEnum Validationが一致しません。'
          );
        }
        if (item.validation === 'ENUM' &&
            JSON.stringify(
              rule && rule.getCriteriaValues
                ? rule.getCriteriaValues()[0]
                : []
            ) !== JSON.stringify(item.allowedValues || [])) {
          throw new WorkOsAppError(
            'E_SETUP_STATE_CONFLICT',
            'SETUP',
            false,
            'Setup状態とEnum Validationの許可値が一致しません。'
          );
        }
      });
    }
    if (stages.indexOf('S40_SEED_SAFE_SETTINGS') !== -1) {
      var settings = spreadsheet.getSheetByName(WorkOsConfig.SHEETS.SETTINGS);
      var settingKeys = settings.getRange(
        WorkOsConfig.DATA_START_ROW,
        1,
        settings.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1,
        1
      ).getValues().map(function (row) { return String(row[0] || ''); });
      ['timezone', 'automation_enabled', 'ai_provider'].forEach(function (key) {
        if (settingKeys.indexOf(key) === -1) {
          throw new WorkOsAppError(
            'E_SETUP_STATE_CONFLICT',
            'SETUP',
            false,
            'Setup状態と安全な初期設定が一致しません。'
          );
        }
      });
    }
    if (stages.indexOf('S50_CREATE_GMAIL_LABELS') !== -1) {
      var labelState = WorkOsGmailGateway.inspectFormalLabels({
        budget: budget,
        reserve_ms: WorkOsConfig.SETUP_RESERVE_MS
      });
      if (!labelState.complete ||
          labelState.present_count !== WorkOsConfig.GMAIL_LABELS.length) {
        throw new WorkOsAppError(
          'E_SETUP_STATE_CONFLICT',
          'SETUP',
          false,
          'Setup状態と正式Gmailラベルが一致しません。'
        );
      }
    }
    if (stages.indexOf('S60_CREATE_DEADLINE_CALENDAR') !== -1) {
      var calendarState =
        WorkOsCalendarSync.inspectDedicatedCalendarConfiguration({
          verify_remote: true,
          budget: budget,
          reserve_ms: WorkOsConfig.SETUP_RESERVE_MS
        });
      if (!calendarState.property_present ||
          !calendarState.remotely_verified ||
          calendarState.status !== 'CONFIGURED') {
        throw new WorkOsAppError(
          'E_SETUP_STATE_CONFLICT',
          'SETUP',
          false,
          'Setup状態と専用Calendar構成が一致しません。'
        );
      }
    }
  }

  function getCompletedStagesSafely() {
    try {
      return getCompletedStages();
    } catch (error) {
      return [];
    }
  }

  function recordCompletedStage(stage) {
    var completed = getCompletedStages();
    if (completed.indexOf(stage) === -1) {
      completed.push(stage);
      properties().setProperty(
        WorkOsConfig.PROPERTIES.SETUP_COMPLETED_STAGES,
        JSON.stringify(completed)
      );
    }
  }

  function storeLastResult(result) {
    var stored = {
      status: result.status,
      code: result.code || '',
      next_stage: result.next_stage || '',
      recorded_at: new Date().toISOString()
    };
    var normalization = normalizationEvidenceFromResult(result);
    if (normalization) {
      stored.dashboard_number_format_normalization = normalization;
    }
    if (result.module_contract_status === 'ALIGNED' ||
        result.module_contract_status === 'MISMATCH') {
      stored.module_contract_status = result.module_contract_status;
    } else if (Array.isArray(result.stage_results)) {
      for (var index = 0; index < result.stage_results.length; index += 1) {
        var safeSummary = result.stage_results[index] &&
          result.stage_results[index].safe_summary;
        if (safeSummary &&
            (safeSummary.module_contract_status === 'ALIGNED' ||
             safeSummary.module_contract_status === 'MISMATCH')) {
          stored.module_contract_status =
            safeSummary.module_contract_status;
          break;
        }
      }
    }
    properties().setProperty(
      WorkOsConfig.PROPERTIES.SETUP_LAST_RESULT,
      JSON.stringify(stored)
    );
  }

  function assertSetupBudget(budget, stage) {
    if (budget &&
        budget.isExhausted(WorkOsConfig.SETUP_RESERVE_MS)) {
      throw new WorkOsAppError(
        'E_BUDGET_EXHAUSTED',
        stage,
        true,
        'Setupを実行予算内で安全に停止しました。'
      );
    }
  }

  function refreshCompletedVersionMetadata(
    spreadsheet,
    completedStages,
    budget
  ) {
    var completed = completedStages || [];
    var result = {
      system_config_changed: false,
      property_keys_changed: []
    };
    if (completed.indexOf('S40_SEED_SAFE_SETTINGS') !== -1) {
      assertSetupBudget(budget, 'S40_SEED_SAFE_SETTINGS');
      var systemConfigResult =
        WorkOsSheetBuilder.refreshVersionMetadata(spreadsheet);
      result.system_config_changed = systemConfigResult.changed;
      assertSetupBudget(budget, 'S40_SEED_SAFE_SETTINGS');
      result.safe_seed_refresh =
        WorkOsSheetBuilder.seedSafeSettings(spreadsheet);
    }
    if (completed.indexOf('S70_STORE_PROPERTIES') !== -1) {
      assertSetupBudget(budget, 'S70_STORE_PROPERTIES');
      var props = properties();
      [
        [WorkOsConfig.PROPERTIES.CODE_VERSION, WorkOsConfig.CODE_VERSION],
        [WorkOsConfig.PROPERTIES.SCHEMA_VERSION, WorkOsConfig.SCHEMA_VERSION],
        [
          WorkOsConfig.PROPERTIES.MIGRATION_VERSION,
          WorkOsConfig.MIGRATION_VERSION
        ]
      ].forEach(function (entry) {
        if (props.getProperty(entry[0]) !== entry[1]) {
          props.setProperty(entry[0], entry[1]);
          result.property_keys_changed.push(entry[0]);
        }
      });
      if (props.getProperty(
        WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED
      ) == null) {
        props.setProperty(
          WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED,
          'false'
        );
        result.property_keys_changed.push(
          WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED
        );
      }
      if (props.getProperty(
        WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE
      ) == null) {
        props.setProperty(
          WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE,
          'false'
        );
        result.property_keys_changed.push(
          WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE
        );
      }
    }
    return result;
  }

  function refreshCompletedLayout(
    spreadsheet,
    completedStages,
    budget
  ) {
    var completed = completedStages || [];
    if (completed.indexOf('S20_CREATE_SCHEMAS') === -1 &&
        completed.indexOf('S30_APPLY_SMALL_VALIDATIONS') === -1) {
      return {
        refreshed: false,
        reason: 'SCHEMA_STAGE_NOT_COMPLETED'
      };
    }
    assertSetupBudget(budget, 'SETUP_LAYOUT_REFRESH');
    var result =
      WorkOsSheetBuilder.refreshValidationsAndProtections(spreadsheet);
    assertSetupBudget(budget, 'SETUP_LAYOUT_REFRESH');
    result.task_authority_control_plane =
      WorkOsSheetBuilder.ensureTaskAuthorityLedgerControlPlane(spreadsheet);
    assertSetupBudget(budget, 'SETUP_LAYOUT_REFRESH');
    return result;
  }

  function validateTaskAuthorityForSetup(spreadsheet) {
    var taskSheet = spreadsheet.getSheetByName(WorkOsConfig.SHEETS.TASKS);
    if (!taskSheet) {
      throw new WorkOsAppError(
        'E_SCHEMA_MISSING_SHEET',
        'SETUP_AUTHORITY_VALIDATION',
        false,
        'Task sheet is missing during authority validation.'
      );
    }
    return WorkOsUtilities.withScriptLock(function () {
      var report = WorkOsTaskRepository.validateAllTaskAuthorities(taskSheet, {
        mode: 'SETUP',
        recover_prepared: true,
        recover_relocated: true,
        quarantine_invalid: true,
        mark_orphaned: true
      });
      var nonOperational = report.rows.filter(function (item) {
        return item.status !== 'VALID';
      });
      if (nonOperational.length) {
        throw new WorkOsAppError(
          'E_TASK_AUTHORITY_INVALID',
          'SETUP_AUTHORITY_VALIDATION',
          false,
          'Task authority contains quarantined, recoverable-drift, or invalid rows.'
        );
      }
      return report;
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  function runImplementedStage(stage, spreadsheet, budget) {
    if (budget &&
        budget.isExhausted(WorkOsConfig.SETUP_RESERVE_MS)) {
      throw new WorkOsAppError(
        'E_BUDGET_EXHAUSTED',
        stage,
        true,
        'Setupのsoft execution budgetに達したためstage開始前に停止しました。'
      );
    }
    if (stage === 'S00_VALIDATE_ENV') {
      return validateEnvironment(spreadsheet);
    }
    if (stage === 'S10_CREATE_SHEETS') {
      return WorkOsSheetBuilder.ensureSheets(spreadsheet);
    }
    if (stage === 'S20_CREATE_SCHEMAS') {
      var columnMaps = WorkOsSheetBuilder.applyAllSchemas(spreadsheet);
      var taskAuthorityControlPlane =
        WorkOsSheetBuilder.ensureTaskAuthorityLedgerControlPlane(spreadsheet);
      return {
        column_maps: columnMaps,
        task_authority_control_plane: taskAuthorityControlPlane,
        task_authority: validateTaskAuthorityForSetup(spreadsheet)
      };
    }
    if (stage === 'S30_APPLY_SMALL_VALIDATIONS') {
      WorkOsSheetBuilder.applyValidationsAndFormats(spreadsheet);
      var taskAuthorityControlPlaneS30 =
        WorkOsSheetBuilder.ensureTaskAuthorityLedgerControlPlane(spreadsheet);
      WorkOsSheetBuilder.applyVisibility(spreadsheet);
      return {
        applied: true,
        task_authority_control_plane: taskAuthorityControlPlaneS30
      };
    }
    if (stage === 'S40_SEED_SAFE_SETTINGS') {
      return WorkOsSheetBuilder.seedSafeSettings(spreadsheet);
    }
    if (stage === 'S50_CREATE_GMAIL_LABELS') {
      return WorkOsGmailGateway.ensureFormalLabels({
        budget: budget,
        reserve_ms: WorkOsConfig.SETUP_RESERVE_MS
      });
    }
    if (stage === 'S60_CREATE_DEADLINE_CALENDAR') {
      return WorkOsCalendarSync.ensureDedicatedCalendar({
        budget: budget,
        reserve_ms: WorkOsConfig.SETUP_RESERVE_MS
      });
    }
    if (stage === 'S70_STORE_PROPERTIES') {
      var props = properties();
      if (!props.getProperty(WorkOsConfig.PROPERTIES.INSTANCE_ID)) {
        props.setProperty(WorkOsConfig.PROPERTIES.INSTANCE_ID, WorkOsUtilities.makeId('ins_'));
      }
      props.setProperties({
        WORK_OS_V2_CODE_VERSION: WorkOsConfig.CODE_VERSION,
        WORK_OS_V2_SCHEMA_VERSION: WorkOsConfig.SCHEMA_VERSION,
        WORK_OS_V2_MIGRATION_VERSION: WorkOsConfig.MIGRATION_VERSION
      }, false);
      if (props.getProperty(
        WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED
      ) == null) {
        props.setProperty(
          WorkOsConfig.PROPERTIES.AUTOMATION_ENABLED,
          'false'
        );
      }
      if (props.getProperty(
        WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE
      ) == null) {
        props.setProperty(
          WorkOsConfig.PROPERTIES.AUTOMATION_DESIRED_STATE,
          'false'
        );
      }
      return { stored: true };
    }
    if (stage === 'S80_CREATE_EDIT_TRIGGER') {
      if (typeof WorkOsAutomation === 'undefined' ||
          typeof WorkOsAutomation.ensureEditTrigger !== 'function') {
        throw new WorkOsAppError(
          'E_EDIT_TRIGGER_MODULE_MISSING',
          stage,
          false,
          'Task編集Trigger moduleを確認できません。'
        );
      }
      return WorkOsAutomation.ensureEditTrigger();
    }
    if (stage === 'S90_QUICK_DIAGNOSTIC') {
      if (typeof WorkOsDashboard === 'undefined' ||
          !WorkOsDashboard ||
          typeof WorkOsDashboard
            .normalizeSystemBlockNumberFormatForSetup !== 'function') {
        throw new WorkOsAppError(
          'E_DASHBOARD_MODULE_MISSING',
          stage,
          false,
          'Dashboard number-format control-plane module is unavailable.'
        );
      }
      var moduleContract = assertS90ModuleContract();
      // This is the only Setup-owned number-format repair path. It proves
      // the exact Dashboard control plane before writing the 17 x 3 system
      // block, then leaves Quick Diagnostic itself read-only.
      var normalization =
        WorkOsDashboard.normalizeSystemBlockNumberFormatForSetup(spreadsheet);
      var safeEvidence = safeNormalizationEvidence(normalization);
      var diagnostic;
      try {
        diagnostic = WorkOsDiagnostics.runQuickDiagnostic(
          spreadsheet,
          { budget: budget }
        );
      } catch (diagnosticFailure) {
        diagnosticFailure.module_contract_status = moduleContract.status;
        diagnosticFailure.dashboard_normalization_evidence = safeEvidence;
        throw diagnosticFailure;
      }
      diagnostic.module_contract_status = moduleContract.status;
      diagnostic.dashboard_number_format_normalization =
        safeEvidence;
      return diagnostic;
    }
    if (stage === 'S99_COMPLETE') {
      return {
        completed: true,
        phase_boundary:
          'READY_FOR_PHASE8B_SANDBOX_RETRANSFER'
      };
    }
    throw new WorkOsAppError(
      'SETUP_STAGE_NOT_IMPLEMENTED',
      stage,
      false,
      stage + 'は現在のPhaseでは未実装です。外部副作用は実行していません。'
    );
  }

  function executeSetup() {
    var startedAt = Date.now();
    var budget = WorkOsUtilities.createSoftBudget(WorkOsConfig.SETUP_SOFT_LIMIT_MS, startedAt);
    var spreadsheet;
    try {
      spreadsheet = getBoundSpreadsheet();
      var v2Extension =
        WorkOsMigrations.ensureV2ExtensionsBeforeValidation(
          spreadsheet,
          budget
        );
      if (v2Extension.status === 'PAUSED') {
        var extensionPauseResult = {
          status: 'PAUSED',
          code: 'E_BUDGET_EXHAUSTED',
          next_stage: 'V2_SCHEMA_EXTENSION',
          completed_stages: getCompletedStages(),
          v2_schema_extension: v2Extension,
          duration_ms: Date.now() - startedAt
        };
        storeLastResult(extensionPauseResult);
        return extensionPauseResult;
      }
      // Environment safety is revalidated on every invocation, even when S00
      // was completed previously. A stale property must never bypass safety.
      validateEnvironment(spreadsheet);
      var completed = getCompletedStages();
      // A completed pre-v2.5 installation may have structurally valid headers
      // while retaining stale validation lists or protection geometry. Repair
      // those idempotent controls before the strict completed-stage assertion.
      var layoutRefresh = refreshCompletedLayout(
        spreadsheet,
        completed,
        budget
      );
      var setupAuthority = null;
      if (completed.indexOf('S20_CREATE_SCHEMAS') !== -1) {
        WorkOsSheetBuilder.ensureTaskAuthorityLedgerControlPlane(spreadsheet);
        setupAuthority = validateTaskAuthorityForSetup(spreadsheet);
      }
      assertCompletedStageIntegrity(completed, spreadsheet, budget);
      var versionRefresh = refreshCompletedVersionMetadata(
        spreadsheet,
        completed,
        budget
      );
      var editTriggerRefresh = null;
      if (completed.indexOf('S80_CREATE_EDIT_TRIGGER') !== -1) {
        assertSetupBudget(budget, 'S80_CREATE_EDIT_TRIGGER');
        editTriggerRefresh = WorkOsAutomation.ensureEditTrigger();
      }
      if (completed.indexOf('S00_VALIDATE_ENV') === -1) {
        recordCompletedStage('S00_VALIDATE_ENV');
        completed = getCompletedStages();
      }
      var stageResults = [];
      for (var index = 0; index < WorkOsConfig.SETUP_STAGES.length; index += 1) {
        var stage = WorkOsConfig.SETUP_STAGES[index];
        if (completed.indexOf(stage) !== -1) {
          continue;
        }
        if (budget.isExhausted(5000)) {
          var budgetResult = {
            status: 'PAUSED',
            code: 'E_BUDGET_EXHAUSTED',
            next_stage: stage,
            completed_stages: getCompletedStages(),
            duration_ms: Date.now() - startedAt
          };
          storeLastResult(budgetResult);
          return budgetResult;
        }
        if (WorkOsConfig.IMPLEMENTED_SETUP_STAGES.indexOf(stage) === -1) {
          var phaseBoundaryResult = {
            status: 'PHASE_BOUNDARY',
            code: 'SETUP_STAGE_NOT_IMPLEMENTED',
            next_stage: stage,
            completed_stages: getCompletedStages(),
            duration_ms: Date.now() - startedAt,
            safe_message: stage + 'は後続Phaseのため実行していません。'
          };
          storeLastResult(phaseBoundaryResult);
          return phaseBoundaryResult;
        }
        if (stage === 'S00_VALIDATE_ENV') {
          continue;
        }
        var stageStartedAt = Date.now();
        var output = runImplementedStage(
          stage,
          spreadsheet,
          budget
        );
        if (stage === 'S90_QUICK_DIAGNOSTIC' && output.status === 'FAIL') {
          var diagnosticError = new WorkOsAppError(
            'E_QUICK_DIAGNOSTIC_FAILED',
            stage,
            false,
            'Quick Diagnosticが不合格のためSetupを完了しません。'
          );
          diagnosticError.module_contract_status =
            output.module_contract_status;
          diagnosticError.dashboard_normalization_evidence =
            output.dashboard_number_format_normalization;
          throw diagnosticError;
        }
        recordCompletedStage(stage);
        var stageResult = {
          stage: stage,
          duration_ms: Date.now() - stageStartedAt,
          result: output ? 'COMPLETED' : 'COMPLETED'
        };
        if (stage === 'S90_QUICK_DIAGNOSTIC') {
          stageResult.safe_summary = {
            module_contract_status: output.module_contract_status,
            dashboard_number_format_normalization:
              safeNormalizationEvidence(
                output.dashboard_number_format_normalization
              )
          };
        }
        stageResults.push(stageResult);
        completed = getCompletedStages();
      }
      var completeResult = {
        status: 'COMPLETE',
        code: '',
        completed_stages: getCompletedStages(),
        stage_results: stageResults,
        v2_schema_extension: v2Extension,
        completed_layout_refresh: layoutRefresh,
        task_authority_validation: setupAuthority,
        version_metadata_refresh: versionRefresh,
        edit_trigger_refresh: editTriggerRefresh,
        duration_ms: Date.now() - startedAt
      };
      storeLastResult(completeResult);
      return completeResult;
    } catch (error) {
      var safe = WorkOsUtilities.safeError(error, 'SETUP');
      var failedNormalization = safeNormalizationEvidence(
        error && error.dashboard_normalization_evidence
      );
      var failedResult = {
        status: safe.code === 'E_BUDGET_EXHAUSTED'
          ? 'PAUSED'
          : 'FAILED',
        code: safe.code,
        stage: safe.stage,
        next_stage: safe.code === 'E_BUDGET_EXHAUSTED'
          ? safe.stage
          : '',
        safe_message: safe.safe_message,
        completed_stages: getCompletedStagesSafely(),
        duration_ms: Date.now() - startedAt
      };
      if (failedNormalization) {
        failedResult.dashboard_number_format_normalization =
          failedNormalization;
      }
      if (error &&
          (error.module_contract_status === 'ALIGNED' ||
           error.module_contract_status === 'MISMATCH')) {
        failedResult.module_contract_status =
          error.module_contract_status;
      }
      try {
        storeLastResult(failedResult);
      } catch (storeError) {
        failedResult.result_recorded = false;
      }
      return failedResult;
    }
  }

  function runStageForTest(stage) {
    if (!WorkOsConfig.TEST_MODE) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        stage,
        false,
        'Test modeが無効です。'
      );
    }
    var spreadsheet = getBoundSpreadsheet();
    if (stage !== 'S00_VALIDATE_ENV') {
      validateEnvironment(spreadsheet);
    }
    var result = runImplementedStage(
      stage,
      spreadsheet,
      WorkOsUtilities.createSoftBudget(
        WorkOsConfig.SETUP_SOFT_LIMIT_MS,
        Date.now()
      )
    );
    if (stage === 'S90_QUICK_DIAGNOSTIC' && result.status === 'FAIL') {
      throw new WorkOsAppError(
        'E_QUICK_DIAGNOSTIC_FAILED',
        stage,
        false,
        'Quick Diagnosticが不合格のためstageを完了しません。'
      );
    }
    return result;
  }

  function refreshCompletedVersionMetadataForTest(
    spreadsheet,
    completedStages
  ) {
    if (!WorkOsConfig.TEST_MODE) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        'SETUP_VERSION_REFRESH',
        false,
        'Test modeが無効です。'
      );
    }
    return refreshCompletedVersionMetadata(
      spreadsheet || getBoundSpreadsheet(),
      completedStages || getCompletedStages()
    );
  }

  function preparePersonalAutomationQualification(options) {
    var settings = options || {};
    if (Object.keys(settings).length && !WorkOsConfig.TEST_MODE) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        'QUALIFICATION_PREPARATION',
        false,
        '候補準備の依存注入はTest modeだけで利用できます。'
      );
    }
    var spreadsheet = settings.spreadsheet || getBoundSpreadsheet();
    var props = settings.properties || properties();
    var completed = settings.completed_stages || getCompletedStages();
    if (!Array.isArray(completed) ||
        completed.indexOf('S99_COMPLETE') === -1) {
      throw new WorkOsAppError(
        'E_SETUP_NOT_COMPLETE',
        'QUALIFICATION_PREPARATION',
        false,
        '候補準備には既存Setupの完了状態が必要です。'
      );
    }
    if (props.getProperty(WorkOsConfig.PROPERTIES.SCHEMA_VERSION) !==
          WorkOsConfig.SCHEMA_VERSION ||
        props.getProperty(WorkOsConfig.PROPERTIES.MIGRATION_VERSION) !==
          WorkOsConfig.MIGRATION_VERSION) {
      throw new WorkOsAppError(
        'E_SCHEMA_MIGRATION_INCOMPATIBLE',
        'QUALIFICATION_PREPARATION',
        false,
        '既存schemaまたはmigrationの互換性を確認できません。'
      );
    }
    var automationStatus = WorkOsConfig.TEST_MODE
      ? WorkOsAutomation.getDiagnosticAutomationStatus({
        properties: props,
        script_app: settings.script_app
      })
      : WorkOsAutomation.getDiagnosticAutomationStatus();
    if (automationStatus.status !== 'CONSISTENT' ||
        automationStatus.enabled === true ||
        automationStatus.desired_enabled === true ||
        automationStatus.clock_trigger_count !== 0 ||
        automationStatus.stored_trigger_id_present === true) {
      throw new WorkOsAppError(
        'E_AUTOMATION_NOT_DISABLED',
        'QUALIFICATION_PREPARATION',
        false,
        '候補準備にはAutomation停止とowned clock Triggerゼロが必要です。'
      );
    }
    var changed = [];
    [
      [WorkOsConfig.PROPERTIES.CODE_VERSION, WorkOsConfig.CODE_VERSION],
      [WorkOsConfig.PROPERTIES.SCHEMA_VERSION, WorkOsConfig.SCHEMA_VERSION],
      [WorkOsConfig.PROPERTIES.MIGRATION_VERSION, WorkOsConfig.MIGRATION_VERSION]
    ].forEach(function (entry) {
      if (props.getProperty(entry[0]) !== entry[1]) {
        props.setProperty(entry[0], entry[1]);
        changed.push(entry[0]);
      }
    });
    if (completed.indexOf('S40_SEED_SAFE_SETTINGS') !== -1 &&
        typeof WorkOsSheetBuilder !== 'undefined' &&
        WorkOsSheetBuilder &&
        typeof WorkOsSheetBuilder.refreshVersionMetadata === 'function') {
      WorkOsSheetBuilder.refreshVersionMetadata(spreadsheet);
    }
    return {
      status: 'READY_FOR_PERSONAL_AUTOMATION_QUALIFICATION',
      code_version: WorkOsConfig.CODE_VERSION,
      schema_version: WorkOsConfig.SCHEMA_VERSION,
      migration_version: WorkOsConfig.MIGRATION_VERSION,
      property_keys_changed: changed,
      automation_enabled: false,
      desired_enabled: false,
      clock_trigger_count: 0,
      credential_value_read: false,
      external_request_performed: false
    };
  }

  function getNextStagePreview() {
    var completed = getCompletedStagesSafely();
    var nextStage = WorkOsConfig.SETUP_STAGES.find(function (stage) {
      return completed.indexOf(stage) === -1;
    }) || 'COMPLETE';
    var descriptions = {
      S00_VALIDATE_ENV: '既存環境を読取検査します。変更しません。',
      S10_CREATE_SHEETS: 'v2の必須Sheetを作成します。',
      S20_CREATE_SCHEMAS: '列、見出し、Protectionを設定します。',
      S30_APPLY_SMALL_VALIDATIONS: '入力規則、表示形式、表示状態を設定します。',
      S40_SEED_SAFE_SETTINGS: '安全な初期設定と使い方を投入します。',
      S50_CREATE_GMAIL_LABELS: '正式Gmailラベル7件の不足分を作成します。',
      S60_CREATE_DEADLINE_CALENDAR:
        '専用secondary Calendar「自動期日管理」を確認または作成します。',
      S70_STORE_PROPERTIES: '非機密のversion/instance状態を保存します。',
      S80_CREATE_EDIT_TRIGGER:
        '所有者installable edit Triggerを1件確認または作成します。',
      S90_QUICK_DIAGNOSTIC: '読取専用Quick Diagnosticを実行します。',
      S99_COMPLETE: 'Setup完了状態を記録します。',
      COMPLETE: 'Setupは完了しています。外部validationは別途必要です。'
    };
    return {
      next_stage: nextStage,
      description: descriptions[nextStage],
      automation_started: false,
      real_ai_called: false,
      production_time_trigger_created: false
    };
  }

  return Object.freeze({
    MODULE_CONTRACT_ID: MODULE_CONTRACT_ID,
    snapshotEnvironment: snapshotEnvironment,
    classifyEnvironmentDescriptors: classifyEnvironmentDescriptors,
    validateEnvironment: validateEnvironment,
    getCompletedStages: getCompletedStages,
    assertCompletedStageIntegrity: assertCompletedStageIntegrity,
    executeSetup: executeSetup,
    getNextStagePreview: getNextStagePreview,
    runStageForTest: runStageForTest,
    refreshCompletedVersionMetadataForTest:
      refreshCompletedVersionMetadataForTest,
    preparePersonalAutomationQualification:
      preparePersonalAutomationQualification
  });
}());

function setupSystem() {
  return WorkOsSetup.executeSetup();
}

function continueSetup() {
  return WorkOsSetup.executeSetup();
}

function preparePersonalAutomationQualification() {
  return WorkOsSetup.preparePersonalAutomationQualification();
}
