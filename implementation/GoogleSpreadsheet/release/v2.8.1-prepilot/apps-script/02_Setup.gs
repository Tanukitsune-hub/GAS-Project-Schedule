/**
 * New-environment-only, staged setup available through the Phase 4 build.
 */
var WorkOsSetup = (function () {
  function getBoundSpreadsheet() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      throw new WorkOsAppError(
        'E_SETUP_NOT_BOUND',
        'S00_VALIDATE_ENV',
        false,
        'Bound Spreadsheet縺九ｉ螳溯｡後＠縺ｦ縺上□縺輔＞縲・
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
          'Spreadsheet縺ｮ邱ｨ髮・ｨｩ髯舌ｒ遒ｺ隱阪〒縺阪∪縺帙ｓ縲・
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
        'Spreadsheet縺ｮ邱ｨ髮・ｨｩ髯舌ｒ螳牙・縺ｫ遒ｺ隱阪〒縺阪∪縺帙ｓ縲・
      );
    }
  }

  function validateEnvironment(spreadsheet) {
    var classification = classifyEnvironmentDescriptors(snapshotEnvironment(spreadsheet));
    if (!classification.allowed) {
      var message = classification.code === 'E_V1_DETECTED'
        ? 'v1繧峨＠縺・腸蠅・ｒ讀懷・縺励∪縺励◆縲り・蜍募､画鋤縺帙★蛛懈ｭ｢縺励∪縺吶・
        : '譁ｰ隕冗ｩｺSheet縺ｾ縺溘・蜀埼幕蜿ｯ閭ｽ縺ｪv2迺ｰ蠅・〒縺ｯ縺ｪ縺・◆繧∝●豁｢縺励∪縺吶・;
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
        'Setup迥ｶ諷九′荳肴ｭ｣縺ｧ縺吶り・蜍穂ｿｮ蠕ｩ縺ｯ陦後＞縺ｾ縺帙ｓ縲・
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
          'Setup迥ｶ諷九→菴懈・貂医∩Sheet縺御ｸ閾ｴ縺励∪縺帙ｓ縲・
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
            'Setup迥ｶ諷九→Sheet Grid縺御ｸ閾ｴ縺励∪縺帙ｓ縲・
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
            'Setup迥ｶ諷九→Schema縺御ｸ閾ｴ縺励∪縺帙ｓ縲・
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
            'Setup迥ｶ諷九→Checkbox Validation縺御ｸ閾ｴ縺励∪縺帙ｓ縲・
          );
        }
        if (item.validation === 'ENUM' &&
            criteria !== SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
          throw new WorkOsAppError(
            'E_SETUP_STATE_CONFLICT',
            'SETUP',
            false,
            'Setup迥ｶ諷九→Enum Validation縺御ｸ閾ｴ縺励∪縺帙ｓ縲・
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
            'Setup迥ｶ諷九→螳牙・縺ｪ蛻晄悄險ｭ螳壹′荳閾ｴ縺励∪縺帙ｓ縲・
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
          'Setup迥ｶ諷九→豁｣蠑秀mail繝ｩ繝吶Ν縺御ｸ閾ｴ縺励∪縺帙ｓ縲・
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
          'Setup迥ｶ諷九→蟆ら畑Calendar讒区・縺御ｸ閾ｴ縺励∪縺帙ｓ縲・
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
    properties().setProperty(
      WorkOsConfig.PROPERTIES.SETUP_LAST_RESULT,
      JSON.stringify({
        status: result.status,
        code: result.code || '',
        next_stage: result.next_stage || '',
        recorded_at: new Date().toISOString()
      })
    );
  }

  function assertSetupBudget(budget, stage) {
    if (budget &&
        budget.isExhausted(WorkOsConfig.SETUP_RESERVE_MS)) {
      throw new WorkOsAppError(
        'E_BUDGET_EXHAUSTED',
        stage,
        true,
        'Setup繧貞ｮ溯｡御ｺ育ｮ怜・縺ｧ螳牙・縺ｫ蛛懈ｭ｢縺励∪縺励◆縲・
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

  function runImplementedStage(stage, spreadsheet, budget) {
    if (budget &&
        budget.isExhausted(WorkOsConfig.SETUP_RESERVE_MS)) {
      throw new WorkOsAppError(
        'E_BUDGET_EXHAUSTED',
        stage,
        true,
        'Setup縺ｮsoft execution budget縺ｫ驕斐＠縺溘◆繧《tage髢句ｧ句燕縺ｫ蛛懈ｭ｢縺励∪縺励◆縲・
      );
    }
    if (stage === 'S00_VALIDATE_ENV') {
      return validateEnvironment(spreadsheet);
    }
    if (stage === 'S10_CREATE_SHEETS') {
      return WorkOsSheetBuilder.ensureSheets(spreadsheet);
    }
    if (stage === 'S20_CREATE_SCHEMAS') {
      return WorkOsSheetBuilder.applyAllSchemas(spreadsheet);
    }
    if (stage === 'S30_APPLY_SMALL_VALIDATIONS') {
      WorkOsSheetBuilder.applyValidationsAndFormats(spreadsheet);
      WorkOsSheetBuilder.applyVisibility(spreadsheet);
      return { applied: true };
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
          'Task邱ｨ髮・rigger module繧堤｢ｺ隱阪〒縺阪∪縺帙ｓ縲・
        );
      }
      return WorkOsAutomation.ensureEditTrigger();
    }
    if (stage === 'S90_QUICK_DIAGNOSTIC') {
      return WorkOsDiagnostics.runQuickDiagnostic(
        spreadsheet,
        { budget: budget }
      );
    }
    if (stage === 'S99_COMPLETE') {
      return {
        completed: true,
        phase_boundary:
          'PHASE7_LOCAL_COMPLETE_EXTERNAL_VALIDATION_PENDING'
      };
    }
    throw new WorkOsAppError(
      'SETUP_STAGE_NOT_IMPLEMENTED',
      stage,
      false,
      stage + '縺ｯ迴ｾ蝨ｨ縺ｮPhase縺ｧ縺ｯ譛ｪ螳溯｣・〒縺吶ょ､夜Κ蜑ｯ菴懃畑縺ｯ螳溯｡後＠縺ｦ縺・∪縺帙ｓ縲・
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
            safe_message: stage + '縺ｯ蠕檎ｶ啀hase縺ｮ縺溘ａ螳溯｡後＠縺ｦ縺・∪縺帙ｓ縲・
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
          throw new WorkOsAppError(
            'E_QUICK_DIAGNOSTIC_FAILED',
            stage,
            false,
            'Quick Diagnostic縺御ｸ榊粋譬ｼ縺ｮ縺溘ａSetup繧貞ｮ御ｺ・＠縺ｾ縺帙ｓ縲・
          );
        }
        recordCompletedStage(stage);
        stageResults.push({
          stage: stage,
          duration_ms: Date.now() - stageStartedAt,
          result: output ? 'COMPLETED' : 'COMPLETED'
        });
        completed = getCompletedStages();
      }
      var completeResult = {
        status: 'COMPLETE',
        code: '',
        completed_stages: getCompletedStages(),
        stage_results: stageResults,
        v2_schema_extension: v2Extension,
        version_metadata_refresh: versionRefresh,
        edit_trigger_refresh: editTriggerRefresh,
        duration_ms: Date.now() - startedAt
      };
      storeLastResult(completeResult);
      return completeResult;
    } catch (error) {
      var safe = WorkOsUtilities.safeError(error, 'SETUP');
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
        'Test mode縺檎┌蜉ｹ縺ｧ縺吶・
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
        'Quick Diagnostic縺御ｸ榊粋譬ｼ縺ｮ縺溘ａstage繧貞ｮ御ｺ・＠縺ｾ縺帙ｓ縲・
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
        'Test mode縺檎┌蜉ｹ縺ｧ縺吶・
      );
    }
    return refreshCompletedVersionMetadata(
      spreadsheet || getBoundSpreadsheet(),
      completedStages || getCompletedStages()
    );
  }

  function getNextStagePreview() {
    var completed = getCompletedStagesSafely();
    var nextStage = WorkOsConfig.SETUP_STAGES.find(function (stage) {
      return completed.indexOf(stage) === -1;
    }) || 'COMPLETE';
    var descriptions = {
      S00_VALIDATE_ENV: '譌｢蟄倡腸蠅・ｒ隱ｭ蜿匁､懈渊縺励∪縺吶ょ､画峩縺励∪縺帙ｓ縲・,
      S10_CREATE_SHEETS: 'v2縺ｮ蠢・・heet繧剃ｽ懈・縺励∪縺吶・,
      S20_CREATE_SCHEMAS: '蛻励∬ｦ句・縺励￣rotection繧定ｨｭ螳壹＠縺ｾ縺吶・,
      S30_APPLY_SMALL_VALIDATIONS: '蜈･蜉幄ｦ丞援縲∬｡ｨ遉ｺ蠖｢蠑上∬｡ｨ遉ｺ迥ｶ諷九ｒ險ｭ螳壹＠縺ｾ縺吶・,
      S40_SEED_SAFE_SETTINGS: '螳牙・縺ｪ蛻晄悄險ｭ螳壹→菴ｿ縺・婿繧呈兜蜈･縺励∪縺吶・,
      S50_CREATE_GMAIL_LABELS: '豁｣蠑秀mail繝ｩ繝吶Ν7莉ｶ縺ｮ荳崎ｶｳ蛻・ｒ菴懈・縺励∪縺吶・,
      S60_CREATE_DEADLINE_CALENDAR:
        '蟆ら畑secondary Calendar縲瑚・蜍墓悄譌･邂｡逅・阪ｒ遒ｺ隱阪∪縺溘・菴懈・縺励∪縺吶・,
      S70_STORE_PROPERTIES: '髱樊ｩ溷ｯ・・version/instance迥ｶ諷九ｒ菫晏ｭ倥＠縺ｾ縺吶・,
      S80_CREATE_EDIT_TRIGGER:
        '謇譛芽・nstallable edit Trigger繧・莉ｶ遒ｺ隱阪∪縺溘・菴懈・縺励∪縺吶・,
      S90_QUICK_DIAGNOSTIC: '隱ｭ蜿門ｰら畑Quick Diagnostic繧貞ｮ溯｡後＠縺ｾ縺吶・,
      S99_COMPLETE: 'Setup螳御ｺ・憾諷九ｒ險倬鹸縺励∪縺吶・,
      COMPLETE: 'Setup縺ｯ螳御ｺ・＠縺ｦ縺・∪縺吶ょ､夜Κvalidation縺ｯ蛻･騾泌ｿ・ｦ√〒縺吶・
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
    snapshotEnvironment: snapshotEnvironment,
    classifyEnvironmentDescriptors: classifyEnvironmentDescriptors,
    validateEnvironment: validateEnvironment,
    getCompletedStages: getCompletedStages,
    assertCompletedStageIntegrity: assertCompletedStageIntegrity,
    executeSetup: executeSetup,
    getNextStagePreview: getNextStagePreview,
    runStageForTest: runStageForTest,
    refreshCompletedVersionMetadataForTest:
      refreshCompletedVersionMetadataForTest
  });
}());

function setupSystem() {
  return WorkOsSetup.executeSetup();
}

function continueSetup() {
  return WorkOsSetup.executeSetup();
}

