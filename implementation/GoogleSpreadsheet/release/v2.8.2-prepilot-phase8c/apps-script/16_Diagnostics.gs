/**
 * Quick and explicit Deep Diagnostic through Phase 7. All checks are read-only.
 */
var WorkOsDiagnostics = (function () {
  function check(id, status, safeMessage, details) {
    return {
      id: id,
      status: status,
      safe_message: safeMessage || '',
      details: details || {}
    };
  }

  function aiReasonPresent(readiness, reason) {
    return readiness &&
      Array.isArray(readiness.reasons) &&
      readiness.reasons.indexOf(reason) !== -1;
  }

  function buildAiReadinessChecks() {
    var results = [];
    var adapterAvailable =
      typeof WorkOsAiAdapter !== 'undefined' &&
      WorkOsAiAdapter &&
      typeof WorkOsAiAdapter.getProductionReadiness === 'function';
    var productionReadiness = adapterAvailable
      ? WorkOsAiAdapter.getProductionReadiness()
      : {
        ready: false,
        reasons: ['AI_ADAPTER_MODULE_UNAVAILABLE'],
        provider: '',
        model_configured: false,
        prompt_version_configured: false,
        registry_entry_present: false,
        credential_reference_present: false,
        external_request_performed: false
      };

    if (WorkOsConfig.TEST_MODE && adapterAvailable &&
        typeof WorkOsAiAdapter.MockAiAdapter === 'function') {
      var mockHealth = new WorkOsAiAdapter.MockAiAdapter().healthCheck();
      results.push(check(
        'MOCK_AI_LOCAL_READINESS',
        mockHealth.status === 'READY' ? 'PASS' : 'WARN',
        mockHealth.status === 'READY'
          ? ''
          : 'Mock AI縺ｮ繝ｭ繝ｼ繧ｫ繝ｫ貅門ｙ迥ｶ諷九ｒ遒ｺ隱阪〒縺阪∪縺帙ｓ縲・,
        {
          test_mode: true,
          provider: String(mockHealth.provider || 'MOCK'),
          health_status: String(mockHealth.status || 'UNKNOWN'),
          production_readiness: false,
          external_http_called: false
        }
      ));
    } else {
      results.push(check(
        'MOCK_AI_LOCAL_READINESS',
        WorkOsConfig.TEST_MODE ? 'WARN' : 'NOT_EXECUTED',
        WorkOsConfig.TEST_MODE
          ? 'Mock AI module繧貞茜逕ｨ縺ｧ縺阪∪縺帙ｓ縲・
          : 'TEST_MODE=false縺ｮ縺溘ａMock AI縺ｯ辟｡蜉ｹ縺ｧ縺吶・,
        {
          test_mode: WorkOsConfig.TEST_MODE === true,
          health_status: WorkOsConfig.TEST_MODE
            ? 'MODULE_UNAVAILABLE'
            : 'DISABLED',
          production_readiness: false,
          external_http_called: false
        }
      ));
    }

    var configurationReasons = [
      'EXTERNAL_AI_NOT_CONFIGURED',
      'AI_PROVIDER_NOT_REGISTERED',
      'AI_ADAPTER_MODULE_UNAVAILABLE'
    ].filter(function (reason) {
      return aiReasonPresent(productionReadiness, reason);
    });
    results.push(check(
      'PRODUCTION_AI_CONFIGURATION',
      configurationReasons.length === 0 ? 'PASS' : 'WARN',
      configurationReasons.length === 0
        ? ''
        : '螳蘖rovider縺ｮ險ｭ螳壹∪縺溘・逋ｻ骭ｲ縺梧悴螳御ｺ・〒縺吶・,
      {
        provider: String(productionReadiness.provider || ''),
        model_configured:
          productionReadiness.model_configured === true,
        prompt_version_configured:
          productionReadiness.prompt_version_configured === true,
        registry_entry_present:
          productionReadiness.registry_entry_present === true,
        reasons: configurationReasons,
        external_http_called: false
      }
    ));

    var policyReasons = [
      'COMPANY_APPROVAL_NOT_CONFIRMED',
      'DATA_POLICY_APPROVAL_NOT_CONFIRMED',
      'CREDENTIAL_STORAGE_APPROVAL_NOT_CONFIRMED',
      'AI_ADAPTER_MODULE_UNAVAILABLE'
    ].filter(function (reason) {
      return aiReasonPresent(productionReadiness, reason);
    });
    results.push(check(
      'PRODUCTION_AI_POLICY_APPROVAL',
      policyReasons.length === 0 ? 'PASS' : 'WARN',
      policyReasons.length === 0
        ? ''
        : 'Production AI縺ｮ遉ｾ蜀・・繝・・繧ｿ繝ｻcredential菫晉ｮ｡謇ｿ隱阪′譛ｪ遒ｺ隱阪〒縺吶・,
      {
        reasons: policyReasons,
        external_http_called: false
      }
    ));

    var authReasons = [
      'AI_AUTH_NOT_CONFIGURED',
      'AI_CREDENTIAL_REFERENCE_NOT_CONFIGURED',
      'AI_ADAPTER_MODULE_UNAVAILABLE'
    ].filter(function (reason) {
      return aiReasonPresent(productionReadiness, reason);
    });
    results.push(check(
      'PRODUCTION_AI_AUTH_READINESS',
      authReasons.length === 0 ? 'PASS' : 'WARN',
      authReasons.length === 0
        ? ''
        : 'Production AI縺ｮ隱崎ｨｼ縺ｾ縺溘・opaque credential蜿ら・縺梧悴險ｭ螳壹〒縺吶・,
      {
        credential_reference_present:
          productionReadiness.credential_reference_present === true,
        reasons: authReasons,
        external_http_called: false
      }
    ));
    return results;
  }

  function criteriaEquals(rule, expected) {
    return rule && rule.getCriteriaType() === expected;
  }

  function listCriteriaValues(rule) {
    if (!rule || typeof rule.getCriteriaValues !== 'function') {
      return [];
    }
    var values = rule.getCriteriaValues();
    return values && Array.isArray(values[0]) ? values[0].slice() : [];
  }

  function assertBudgetAvailable(budget) {
    if (budget && budget.isExhausted(WorkOsConfig.QUICK_DIAGNOSTIC_RESERVE_MS)) {
      throw new WorkOsAppError(
        'E_DIAGNOSTIC_BUDGET',
        'QUICK_DIAGNOSTIC',
        true,
        'Quick Diagnostic縺ｮ螳牙・縺ｪ螳溯｡御ｺ育ｮ励↓驕斐＠縺ｾ縺励◆縲・
      );
    }
  }

  function rangeGeometry(range) {
    return {
      row: range.getRow(),
      column: range.getColumn(),
      rows: range.getNumRows(),
      columns: range.getNumColumns()
    };
  }

  function protectionAccessIsRestricted(protection) {
    if (!protection || protection.isWarningOnly()) {
      return false;
    }
    var effectiveUser = Session.getEffectiveUser();
    var effectiveEmail = effectiveUser && effectiveUser.getEmail
      ? String(effectiveUser.getEmail() || '')
      : '';
    if (!effectiveEmail || protection.canDomainEdit()) {
      return false;
    }
    var editorEmails = protection.getEditors().map(function (editor) {
      return String(editor.getEmail() || '');
    }).filter(function (email) { return Boolean(email); });
    return editorEmails.length === 1 && editorEmails[0] === effectiveEmail;
  }

  function validateTaskSheet(sheet, checks, budget) {
    assertBudgetAvailable(budget);
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    var ids = sheet.getRange(1, 1, 1, schema.length).getValues()[0];
    var headers = sheet.getRange(2, 1, 1, schema.length).getValues()[0];
    var comparison = WorkOsSchemas.compareHeaders(WorkOsConfig.SHEETS.TASKS, ids, headers);
    checks.push(check(
      'TASK_SCHEMA_IDS',
      comparison.idsMatch ? 'PASS' : 'FAIL',
      comparison.idsMatch ? '' : '繧ｿ繧ｹ繧ｯ荳隕ｧ縺ｮ蜀・Κ蛻悠D縺御ｸ閾ｴ縺励∪縺帙ｓ縲・
    ));
    checks.push(check(
      'TASK_SCHEMA_HEADERS',
      comparison.headersMatch ? 'PASS' : 'FAIL',
      comparison.headersMatch ? '' : '繧ｿ繧ｹ繧ｯ荳隕ｧ縺ｮ隕句・縺励′荳閾ｴ縺励∪縺帙ｓ縲・
    ));

    var context;
    try {
      context = WorkOsTaskRepository.createContext(sheet);
      checks.push(check('TASK_COLUMN_MAP', 'PASS', ''));
    } catch (error) {
      checks.push(check('TASK_COLUMN_MAP', 'FAIL', 'Column Map繧呈ｧ狗ｯ峨〒縺阪∪縺帙ｓ縲・));
      return;
    }

    var dataRowCount = sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1;
    var checkboxIds = ['needs_review', 'completed', 'excluded', 'waiting_for_reply'];
    var validationFailures = [];
    var formatFailures = [];
    var validationPlan = WorkOsSchemas.validationPlanForSheet(WorkOsConfig.SHEETS.TASKS);
    for (var chunkOffset = 0;
        chunkOffset < dataRowCount;
        chunkOffset += WorkOsConfig.QUICK_DIAGNOSTIC_CHUNK_ROWS) {
      assertBudgetAvailable(budget);
      var chunkRows = Math.min(
        WorkOsConfig.QUICK_DIAGNOSTIC_CHUNK_ROWS,
        dataRowCount - chunkOffset
      );
      var chunkRange = sheet.getRange(
        WorkOsConfig.DATA_START_ROW + chunkOffset,
        1,
        chunkRows,
        schema.length
      );
      var validations = chunkRange.getDataValidations();
      validations.forEach(function (rowRules, rowIndex) {
        schema.forEach(function (item, index) {
          var rule = rowRules[index];
          if (checkboxIds.indexOf(item.id) !== -1) {
            if (!criteriaEquals(rule, SpreadsheetApp.DataValidationCriteria.CHECKBOX)) {
              validationFailures.push(
                item.id + '@' +
                (WorkOsConfig.DATA_START_ROW + chunkOffset + rowIndex) +
                ': checkbox missing'
              );
            }
          } else if (criteriaEquals(rule, SpreadsheetApp.DataValidationCriteria.CHECKBOX)) {
            validationFailures.push(
              item.id + '@' +
              (WorkOsConfig.DATA_START_ROW + chunkOffset + rowIndex) +
              ': unexpected checkbox'
            );
          }
          if (item.validation === 'ENUM') {
            if (!criteriaEquals(rule, SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST)) {
              validationFailures.push(
                item.id + '@' +
                (WorkOsConfig.DATA_START_ROW + chunkOffset + rowIndex) +
                ': enum validation missing'
              );
            } else if (JSON.stringify(listCriteriaValues(rule)) !==
                JSON.stringify(validationPlan[index].allowedValues || [])) {
              validationFailures.push(
                item.id + '@' +
                (WorkOsConfig.DATA_START_ROW + chunkOffset + rowIndex) +
                ': enum values differ'
              );
            }
          }
        });
      });
      assertBudgetAvailable(budget);
      var formats = chunkRange.getNumberFormats();
      formats.forEach(function (rowFormats, rowIndex) {
        schema.forEach(function (item, index) {
          if (item.type === 'Date' && rowFormats[index] !== WorkOsConfig.DATE_FORMAT) {
            formatFailures.push(
              item.id + '@' +
              (WorkOsConfig.DATA_START_ROW + chunkOffset + rowIndex)
            );
          }
          if (item.type === 'DateTime' &&
              rowFormats[index] !== WorkOsConfig.DATETIME_FORMAT) {
            formatFailures.push(
              item.id + '@' +
              (WorkOsConfig.DATA_START_ROW + chunkOffset + rowIndex)
            );
          }
        });
      });
    }
    checks.push(check(
      'TASK_VALIDATION_TYPES',
      validationFailures.length ? 'FAIL' : 'PASS',
      validationFailures.length ? '蜈･蜉幄ｦ丞援縺ｮ蝙九′荳閾ｴ縺励∪縺帙ｓ縲・ : '',
      { failures: validationFailures.slice(0, 50), failure_count: validationFailures.length }
    ));

    checks.push(check(
      'TASK_DATE_FORMATS',
      formatFailures.length ? 'FAIL' : 'PASS',
      formatFailures.length ? '譌･莉倩｡ｨ遉ｺ蠖｢蠑上′荳閾ｴ縺励∪縺帙ｓ縲・ : '',
      { failures: formatFailures.slice(0, 50), failure_count: formatFailures.length }
    ));

    var managementColumnFailures = [];
    schema.forEach(function (item, index) {
      if (item.visible === false &&
          typeof sheet.isColumnHiddenByUser === 'function' &&
          !sheet.isColumnHiddenByUser(index + 1)) {
        managementColumnFailures.push(item.id);
      }
    });
    checks.push(check(
      'TASK_MANAGEMENT_COLUMNS_HIDDEN',
      managementColumnFailures.length ? 'FAIL' : 'PASS',
      managementColumnFailures.length ? '邂｡逅・・縺碁撼陦ｨ遉ｺ縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・ : '',
      { failures: managementColumnFailures }
    ));

    if (typeof sheet.getProtections === 'function') {
      var protections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
      var firstManagementIndex = schema.findIndex(function (item) {
        return item.visible === false;
      });
      var requiredProtections = [
        {
          description: 'WORK_OS_V2_PHASE1_' +
            WorkOsConfig.SHEETS.TASKS + '_HEADER_IDS',
          geometry: { row: 1, column: 1, rows: 1, columns: schema.length }
        },
        {
          description: 'WORK_OS_V2_PHASE1_' +
            WorkOsConfig.SHEETS.TASKS + '_MANAGEMENT_COLUMNS',
          geometry: {
            row: 1,
            column: firstManagementIndex + 1,
            rows: sheet.getMaxRows(),
            columns: schema.length - firstManagementIndex
          }
        }
      ];
      var protectionFailures = requiredProtections.filter(function (expected) {
        var actual = protections.filter(function (protection) {
          return protection.getDescription() === expected.description;
        })[0];
        return !actual ||
          !protectionAccessIsRestricted(actual) ||
          JSON.stringify(rangeGeometry(actual.getRange())) !==
            JSON.stringify(expected.geometry);
      }).map(function (expected) {
        return expected.description;
      });
      checks.push(check(
        'TASK_PROTECTIONS',
        protectionFailures.length ? 'FAIL' : 'PASS',
        protectionFailures.length ? 'Task邂｡逅・ｯ・峇縺ｮ菫晁ｭｷ縺御ｸ崎ｶｳ縺励※縺・∪縺吶・ : '',
        { failures: protectionFailures }
      ));
      var taskSheetProtections = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
      var taskPolicyDescription = 'WORK_OS_V2_PHASE1_' +
        WorkOsConfig.SHEETS.TASKS + '_EDIT_POLICY';
      var taskPolicy = taskSheetProtections.filter(function (protection) {
        return protection.getDescription() === taskPolicyDescription;
      })[0];
      var expectedEditableRanges = schema.map(function (item, index) {
        return item.editable ? {
          row: WorkOsConfig.DATA_START_ROW,
          column: index + 1,
          rows: sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1,
          columns: 1
        } : null;
      }).filter(function (value) { return value != null; });
      var actualEditableRanges = taskPolicy
        ? taskPolicy.getUnprotectedRanges().map(function (range) {
          return {
            row: range.getRow(),
            column: range.getColumn(),
            rows: range.getNumRows(),
            columns: range.getNumColumns()
          };
        }).sort(function (left, right) { return left.column - right.column; })
        : [];
      var taskPolicyValid = Boolean(taskPolicy) &&
        protectionAccessIsRestricted(taskPolicy) &&
        JSON.stringify(actualEditableRanges) === JSON.stringify(expectedEditableRanges);
      checks.push(check(
        'TASK_EDIT_POLICY',
        taskPolicyValid ? 'PASS' : 'FAIL',
        taskPolicyValid ? '' : 'Task蛻励・邱ｨ髮・庄蜷ｦProtection縺御ｻ墓ｧ倥→荳閾ｴ縺励∪縺帙ｓ縲・,
        {
          expected_editable_ranges: expectedEditableRanges,
          actual_editable_ranges: actualEditableRanges
        }
      ));
    }

    var booleanIndexes = checkboxIds.map(function (id) { return context.columnMap[id]; });
    var blankBooleanRows = [];
    context.values.forEach(function (row, index) {
      var taskId = row[context.columnMap.task_id];
      var originKey = row[context.columnMap.origin_key];
      if (!WorkOsUtilities.isBlank(taskId) || !WorkOsUtilities.isBlank(originKey)) {
        return;
      }
      var hasBooleanValue = booleanIndexes.some(function (columnIndex) {
        return row[columnIndex] === true || row[columnIndex] === false;
      });
      if (hasBooleanValue) {
        blankBooleanRows.push(WorkOsConfig.DATA_START_ROW + index);
      }
    });
    checks.push(check(
      'BLANK_ROW_BOOLEAN_VALUES',
      blankBooleanRows.length ? 'FAIL' : 'PASS',
      blankBooleanRows.length ? '隲也炊遨ｺ陦後↓Boolean蛟､縺後≠繧翫∪縺吶・ : '',
      { rows: blankBooleanRows.slice(0, 20) }
    ));

    checks.push(check(
      'TASK_PRIMARY_KEY_DUPLICATES',
      context.duplicateTaskIds.length || context.duplicateOriginKeys.length ? 'FAIL' : 'PASS',
      context.duplicateTaskIds.length || context.duplicateOriginKeys.length
        ? 'Task荳ｻ繧ｭ繝ｼ縺ｫ驥崎､・′縺ゅｊ縺ｾ縺吶・
        : '',
      {
        task_id_duplicates: context.duplicateTaskIds,
        origin_key_duplicates: context.duplicateOriginKeys
      }
    ));
    var incompleteKeyRows = context.logicalRows.filter(function (physicalRow) {
      var row = context.values[physicalRow - WorkOsConfig.DATA_START_ROW];
      return WorkOsUtilities.isBlank(row[context.columnMap.task_id]) ||
        WorkOsUtilities.isBlank(row[context.columnMap.origin_key]);
    });
    checks.push(check(
      'TASK_PRIMARY_KEY_COMPLETENESS',
      incompleteKeyRows.length ? 'FAIL' : 'PASS',
      incompleteKeyRows.length ? 'Task陦後・蠢・井ｸｻ繧ｭ繝ｼ縺御ｸ崎ｶｳ縺励※縺・∪縺吶・ : '',
      { rows: incompleteKeyRows.slice(0, 20) }
    ));

    var invariantFailures = [];
    context.logicalRows.forEach(function (physicalRow) {
      try {
        var task = WorkOsTaskRepository.readTaskAtRow(
          context,
          physicalRow
        );
        var invariant = WorkOsSchemas.validateTaskStateInvariant(task);
        if (!invariant.ok) {
          invariantFailures.push({
            row: physicalRow,
            codes: invariant.errors.slice(0, 10)
          });
        }
      } catch (error) {
        invariantFailures.push({
          row: physicalRow,
          codes: [WorkOsUtilities.safeError(
            error,
            'DIAGNOSTIC_TASK_INVARIANT'
          ).code]
        });
      }
    });
    checks.push(check(
      'TASK_STATE_INVARIANTS',
      invariantFailures.length ? 'FAIL' : 'PASS',
      invariantFailures.length
        ? 'Task迥ｶ諷九・field髢捺紛蜷域ｧ縺ｫ蝠城｡後′縺ゅｊ縺ｾ縺吶・
        : '',
      { failures: invariantFailures.slice(0, 20) }
    ));

    checks.push(check(
      'TASK_LOGICAL_ROWS',
      'PASS',
      '',
      {
        task_count: context.logicalRows.length,
        next_logical_empty_row: WorkOsTaskRepository.findLogicalEmptyRow(
          context.taskIdValues,
          context.originKeyValues,
          WorkOsConfig.DATA_START_ROW
        )
      }
    ));
  }

  function validateSheetSchema(sheet, sheetName, checks, budget) {
    assertBudgetAvailable(budget);
    var schema = WorkOsSchemas.getSheetSchema(sheetName);
    var ids = sheet.getRange(1, 1, 1, schema.length).getValues()[0];
    var headers = sheet.getRange(2, 1, 1, schema.length).getValues()[0];
    var comparison = WorkOsSchemas.compareHeaders(sheetName, ids, headers);
    checks.push(check(
      'SCHEMA_' + WorkOsUtilities.sha256Hex(sheetName).slice(0, 8),
      comparison.idsMatch && comparison.headersMatch ? 'PASS' : 'FAIL',
      comparison.idsMatch && comparison.headersMatch
        ? ''
        : sheetName + '縺ｮSchema縺御ｸ閾ｴ縺励∪縺帙ｓ縲・,
      { sheet_name: sheetName }
    ));
    if (WorkOsHiddenSheets.indexOf(sheetName) !== -1 &&
        typeof sheet.getProtections === 'function') {
      var protections = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
      var expectedDescription = 'WORK_OS_V2_PHASE1_' + sheetName + '_MANAGEMENT_SHEET';
      var enforced = protections.some(function (protection) {
        return protection.getDescription() === expectedDescription &&
          protectionAccessIsRestricted(protection);
      });
      checks.push(check(
        'PROTECTION_' + WorkOsUtilities.sha256Hex(sheetName).slice(0, 8),
        enforced ? 'PASS' : 'FAIL',
        enforced ? '' : sheetName + '縺ｮ邂｡逅・heet菫晁ｭｷ縺御ｸ崎ｶｳ縺励※縺・∪縺吶・,
        { sheet_name: sheetName }
      ));
    }
  }

  function scanLogicalRows(
    sprea…3108 tokens truncated…ies();
    var completedRaw = props.getProperty(WorkOsConfig.PROPERTIES.SETUP_COMPLETED_STAGES);
    var instanceProperty = props.getProperty(WorkOsConfig.PROPERTIES.INSTANCE_ID);
    var deadlineCalendarProperty = props.getProperty(
      WorkOsConfig.PROPERTIES.DEADLINE_CALENDAR_ID
    );
    var codeProperty = props.getProperty(WorkOsConfig.PROPERTIES.CODE_VERSION);
    var schemaProperty = props.getProperty(WorkOsConfig.PROPERTIES.SCHEMA_VERSION);
    var migrationProperty = props.getProperty(WorkOsConfig.PROPERTIES.MIGRATION_VERSION);
    var completedForVersion = [];
    if (completedRaw) {
      try {
        var parsedForVersion = JSON.parse(completedRaw);
        completedForVersion = Array.isArray(parsedForVersion)
          ? parsedForVersion
          : [];
      } catch (versionStageParseError) {
        completedForVersion = [];
      }
    }
    var versionPropertiesMatch =
      codeProperty === WorkOsConfig.CODE_VERSION &&
      schemaProperty === WorkOsConfig.SCHEMA_VERSION &&
      migrationProperty === WorkOsConfig.MIGRATION_VERSION;
    var versionStageRecorded =
      completedForVersion.indexOf('S70_STORE_PROPERTIES') !== -1;
    var instancePropertyValid =
      /^ins_[0-9a-f]{32}$/.test(String(instanceProperty || ''));
    checks.push(check(
      'SETUP_PROPERTIES',
      completedRaw && instancePropertyValid ? 'PASS' : 'WARN',
      completedRaw && instancePropertyValid
        ? ''
        : 'Setup Properties縺梧悴螳御ｺ・°instance蠖｢蠑上′荳肴ｭ｣縺ｧ縺吶・,
      {
        completed_stages_recorded: Boolean(completedRaw),
        instance_id_recorded: Boolean(instanceProperty),
        instance_id_valid: instancePropertyValid
      }
    ));
    checks.push(check(
      'VERSION_PROPERTIES',
      versionPropertiesMatch ? 'PASS' : 'WARN',
      versionPropertiesMatch
        ? ''
        : (versionStageRecorded
          ? '螳御ｺ・ｸ医∩v2迺ｰ蠅・・version metadata縺ｫdrift縺後≠繧翫∪縺吶４etup繧貞・螳溯｡後＠縺ｦ縺上□縺輔＞縲・
          : 'S70譛ｪ螳溯｡後・縺溘ａversion Properties縺ｯ譛ｪ遒ｺ螳壹〒縺吶・),
      {
        s70_recorded: versionStageRecorded,
        code_version_property_matches: codeProperty === WorkOsConfig.CODE_VERSION,
        schema_version_property_matches: schemaProperty === WorkOsConfig.SCHEMA_VERSION,
        migration_version_property_matches: migrationProperty === WorkOsConfig.MIGRATION_VERSION
      }
    ));
    var editTriggerStatus = typeof WorkOsAutomation !== 'undefined' &&
      WorkOsAutomation &&
      typeof WorkOsAutomation.getEditTriggerStatus === 'function'
      ? WorkOsAutomation.getEditTriggerStatus()
      : null;
    checks.push(check(
      'EDIT_TRIGGER_POLICY',
      editTriggerStatus &&
        editTriggerStatus.status === 'CONSISTENT'
        ? 'PASS'
        : 'WARN',
      editTriggerStatus &&
        editTriggerStatus.status === 'CONSISTENT'
        ? ''
        : 'Task邱ｨ髮・rigger縺梧悴菴懈・縺ｾ縺溘・荳肴紛蜷医〒縺吶４etup繧貞・螳溯｡後＠縺ｦ縺上□縺輔＞縲・,
      editTriggerStatus
        ? {
          setup_creates_trigger: true,
          edit_handler_invocation:
            'OWNER_INSTALLABLE_TRIGGER_WITH_MENU_FALLBACK',
          trigger_count: editTriggerStatus.trigger_count,
          canonical_trigger_present:
            editTriggerStatus.canonical_trigger_present,
          owner_authorization_required: true,
          automation_enable_invocation: 'EXPLICIT_ENABLE_ONLY'
        }
        : {
          setup_creates_trigger: true,
          module_available: false,
          automation_enable_invocation: 'EXPLICIT_ENABLE_ONLY'
        }
    ));
    var automationStatus = typeof WorkOsAutomation !== 'undefined' &&
      WorkOsAutomation &&
      typeof WorkOsAutomation.getDiagnosticAutomationStatus === 'function'
      ? WorkOsAutomation.getDiagnosticAutomationStatus()
      : null;
    var runtimeSettings = automationStatus &&
      automationStatus.prerequisites &&
      automationStatus.prerequisites.runtime_settings ||
      null;
    var runtimeLimitsValid = runtimeSettings &&
      runtimeSettings.manual_max_messages === 1 &&
      runtimeSettings.automation_max_messages_per_run >= 1 &&
      runtimeSettings.automation_max_messages_per_run <= 10 &&
      runtimeSettings.manual_worker_soft_limit_ms >= 30000 &&
      runtimeSettings.manual_worker_soft_limit_ms <= 120000 &&
      runtimeSettings.automation_worker_soft_limit_ms >= 60000 &&
      runtimeSettings.automation_worker_soft_limit_ms <= 210000;
    checks.push(check(
      'AUTOMATION_LIMITS',
      WorkOsConfig.AUTOMATION_ENABLED === false &&
        WorkOsConfig.AUTOMATION_INTERVAL_MINUTES === 5 &&
        WorkOsConfig.AUTOMATION_OVERLAP_MS === 24 * 60 * 60 * 1000 &&
        WorkOsConfig.AUTOMATION_MAX_SEARCH_THREADS === 100 &&
        WorkOsConfig.AUTOMATION_SEARCH_PAGE_SIZE === 25 &&
        runtimeLimitsValid
        ? 'PASS'
        : (runtimeSettings ? 'FAIL' : 'WARN'),
      '',
      {
        default_enabled: WorkOsConfig.AUTOMATION_ENABLED,
        interval_minutes: WorkOsConfig.AUTOMATION_INTERVAL_MINUTES,
        overlap_days: 1,
        max_messages_per_run:
          runtimeSettings
            ? runtimeSettings.automation_max_messages_per_run
            : null,
        max_search_threads:
          WorkOsConfig.AUTOMATION_MAX_SEARCH_THREADS,
        page_size: WorkOsConfig.AUTOMATION_SEARCH_PAGE_SIZE,
        soft_limit_ms:
          runtimeSettings
            ? runtimeSettings.automation_worker_soft_limit_ms
            : null,
        settings_read_count:
          runtimeSettings
            ? runtimeSettings.settings_read_count
            : 0
      }
    ));
    checks.push(check(
      'AUTOMATION_TRIGGER_STATE',
      automationStatus
        ? (automationStatus.status === 'CONSISTENT'
          ? 'PASS'
          : 'WARN')
        : 'WARN',
      automationStatus &&
        automationStatus.status === 'CONSISTENT'
        ? ''
        : 'Automation Trigger迥ｶ諷九ｒ遒ｺ隱阪〒縺阪↑縺・°荳肴紛蜷医〒縺吶ゆｿｮ蠕ｩ縺ｯ陦後▲縺ｦ縺・∪縺帙ｓ縲・,
      automationStatus
        ? {
          enabled: automationStatus.enabled,
          trigger_count: automationStatus.trigger_count,
          stored_trigger_id_present:
            automationStatus.stored_trigger_id_present,
          canonical_trigger_present:
            automationStatus.canonical_trigger_present,
          duplicate_trigger_count:
            automationStatus.duplicate_trigger_count,
          watermark_present: automationStatus.watermark_present,
          last_run_present: automationStatus.last_run_present,
          prerequisites_ready:
            automationStatus.prerequisites.ready,
          shared_preflight_ready:
            automationStatus.prerequisites.shared_preflight_ready,
          real_provider_connection:
            automationStatus.prerequisites.real_provider_connection
        }
        : {
          module_available: false,
          google_workspace_real: 'NOT_EXECUTED'
        }
    ));
    checks.push(check(
      'EDIT_TRIGGER_REAL_LIST',
      editTriggerStatus ? 'PASS' : 'WARN',
      editTriggerStatus
        ? ''
        : 'Google Workspace Trigger荳隕ｧ繧堤｢ｺ隱阪〒縺阪∪縺帙ｓ縺ｧ縺励◆縲・,
      {
        trigger_list_read:
          editTriggerStatus
            ? editTriggerStatus.google_workspace_trigger_list
            : 'NOT_EXECUTED',
        live_edit_event_execution: 'NOT_EXECUTED'
      }
    ));
    var managementEditWarningRaw = props.getProperty(
      WorkOsConfig.PROPERTIES.MANAGEMENT_EDIT_WARNING
    );
    var managementEditDetails = {
      detected: Boolean(managementEditWarningRaw)
    };
    if (managementEditWarningRaw) {
      try {
        var managementEditMarker = JSON.parse(managementEditWarningRaw);
        managementEditDetails.count = Number(
          managementEditMarker.count || 0
        );
        managementEditDetails.last_detected_at = String(
          managementEditMarker.last_detected_at || ''
        );
        managementEditDetails.management_column_count = Number(
          managementEditMarker.management_column_count || 0
        );
      } catch (managementEditParseError) {
        managementEditDetails.marker_parse_error = true;
      }
    }
    checks.push(check(
      'MANAGEMENT_COLUMN_DIRECT_EDIT',
      managementEditWarningRaw ? 'WARN' : 'PASS',
      managementEditWarningRaw
        ? '邂｡逅・・縺ｮ逶ｴ謗･邱ｨ髮・ｱ･豁ｴ縺後≠繧翫∪縺吶ゅお繝ｩ繝ｼ繝ｻ蜀榊ｮ溯｡後ｒ遒ｺ隱阪＠縺ｦ縺上□縺輔＞縲・
        : '',
      managementEditDetails
    ));
    checks.push(check(
      'GMAIL_MANUAL_POLICY',
      WorkOsConfig.MANUAL_GMAIL_QUERY ===
        'label:謇句虚/蜿冶ｾｼ -label:謇句虚/髯､螟・ &&
        WorkOsConfig.MANUAL_MAX_THREADS === 10 &&
        WorkOsConfig.MANUAL_MAX_MESSAGES === 1
        ? 'PASS'
        : 'FAIL',
      WorkOsConfig.MANUAL_GMAIL_QUERY ===
        'label:謇句虚/蜿冶ｾｼ -label:謇句虚/髯､螟・ &&
        WorkOsConfig.MANUAL_MAX_THREADS === 10 &&
        WorkOsConfig.MANUAL_MAX_MESSAGES === 1
        ? ''
        : 'Gmail謇句虚蜿冶ｾｼ縺ｮ螳牙・縺ｪ荳企剞縺ｾ縺溘・query縺御ｸ閾ｴ縺励∪縺帙ｓ縲・,
      {
        search_threads: WorkOsConfig.MANUAL_MAX_THREADS,
        processed_messages: WorkOsConfig.MANUAL_MAX_MESSAGES,
        inbox_scan_enabled: false,
        read_state_used: false
      }
    ));
    buildAiReadinessChecks().forEach(function (aiCheck) {
      checks.push(aiCheck);
    });
    var completedForCalendar = [];
    if (completedRaw) {
      try {
        var parsedForCalendar = JSON.parse(completedRaw);
        completedForCalendar = Array.isArray(parsedForCalendar)
          ? parsedForCalendar
          : [];
      } catch (calendarSetupParseError) {
        completedForCalendar = [];
      }
    }
    var calendarStageRecorded =
      completedForCalendar.indexOf('S60_CREATE_DEADLINE_CALENDAR') !== -1;
    checks.push(check(
      'CALENDAR_PROPERTY_CONFIGURATION',
      calendarStageRecorded && deadlineCalendarProperty &&
        instancePropertyValid
        ? 'PASS'
        : 'WARN',
      calendarStageRecorded && deadlineCalendarProperty &&
        instancePropertyValid
        ? ''
        : 'S60縲∝ｰら畑Calendar ID縲√∪縺溘・instance property縺梧悴螳御ｺ・〒縺吶・,
      {
        setup_stage_recorded: calendarStageRecorded,
        calendar_id_recorded: Boolean(deadlineCalendarProperty),
        instance_id_valid: instancePropertyValid,
        calendar_api_called: false
      }
    ));
    checks.push(check(
      'CALENDAR_REMOTE_VERIFICATION',
      'WARN',
      'Google Workspace螳櫃alendar蛻ｰ驕疲ｧ繝ｻ髱柝rimary繝ｻ謇譛画ｨｩ: NOT EXECUTED縲よ焔蜍募女蜈･縺ｧ遒ｺ隱阪＠縺ｦ縺上□縺輔＞縲・,
      {
        calendar_api_called: false,
        real_calendar_verified: false,
        google_workspace_real: 'NOT_EXECUTED'
      }
    ));
    var syncSheet = target.getSheetByName(WorkOsConfig.SHEETS.SYNC_STATE);
    var expectedSyncIds = WorkOsSchemas.getInternalIds(
      WorkOsConfig.SHEETS.SYNC_STATE
    );
    var syncSchemaMatches = false;
    if (syncSheet &&
        syncSheet.getMaxColumns() === expectedSyncIds.length &&
        syncSheet.getMaxRows() >= WorkOsConfig.HEADER_LABEL_ROW) {
      var actualSyncIds = syncSheet.getRange(
        WorkOsConfig.HEADER_ID_ROW,
        1,
        1,
        expectedSyncIds.length
      ).getValues()[0];
      syncSchemaMatches =
        JSON.stringify(actualSyncIds) === JSON.stringify(expectedSyncIds);
    }
    checks.push(check(
      'CALENDAR_OUTBOX_SCHEMA',
      syncSchemaMatches ? 'PASS' : 'FAIL',
      syncSchemaMatches ? '' : '蜷梧悄迥ｶ諷九・Outbox Schema縺御ｸ閾ｴ縺励∪縺帙ｓ縲・,
      {
        expected_column_count: expectedSyncIds.length
      }
    ));
    if (typeof WorkOsMessageStateRepository !== 'undefined' &&
        typeof WorkOsCalendarSync !== 'undefined' &&
        typeof WorkOsLogAndDeadLetter !== 'undefined') {
      try {
      var recoveryState = inspectRecoveryState(
        target,
        budget,
        WorkOsUtilities.now()
      );
      var recoveryWarning =
        recoveryState.messages.stale_claim_count > 0 ||
        recoveryState.messages.dead_message_count > 0 ||
        recoveryState.errors.unresolved_error_count > 0 ||
        recoveryState.errors.dead_letter_count > 0 ||
        recoveryState.calendar_outbox.dead_count > 0;
      checks.push(check(
        'RETRY_DEAD_LETTER_STATE',
        recoveryWarning ? 'WARN' : 'PASS',
        recoveryWarning
          ? '譛ｪ隗｣豎ｺError縲．ead Letter縲√∪縺溘・stale claim縺後≠繧翫∪縺吶・
          : '',
        recoveryState
      ));
      checks.push(check(
        'RETRY_POLICY_LIMITS',
        JSON.stringify(WorkOsConfig.RETRY_DELAYS_MINUTES) ===
            JSON.stringify([5, 15, 60]) &&
          WorkOsConfig.RETRY_MAX_ATTEMPTS === 4 &&
          WorkOsConfig.RETRY_MAX_ITEMS_PER_RUN === 10
          ? 'PASS'
          : 'FAIL',
        '',
        {
          delays_minutes: WorkOsConfig.RETRY_DELAYS_MINUTES.slice(),
          max_attempts: WorkOsConfig.RETRY_MAX_ATTEMPTS,
          max_items_per_run: WorkOsConfig.RETRY_MAX_ITEMS_PER_RUN,
          soft_limit_ms:
            WorkOsConfig.AUTOMATION_WORKER_SOFT_LIMIT_MS
        }
      ));
      checks.push(check(
        'AI_PROVIDER_RETRY_SUPPRESSION',
        recoveryState.provider_suppression.invalid_state
          ? 'FAIL'
          : (recoveryState.provider_suppression.active ? 'WARN' : 'PASS'),
        recoveryState.provider_suppression.invalid_state
          ? 'Provider謚大宛迥ｶ諷九′荳肴ｭ｣縺ｧ縺吶ゆｿｮ蠕ｩ縺ｯ陦後▲縺ｦ縺・∪縺帙ｓ縲・
          : (recoveryState.provider_suppression.active
            ? 'Provider荳譎る囿螳ｳ縺ｮ蜀崎ｩｦ陦梧椛蛻ｶ荳ｭ縺ｧ縺吶・
            : ''),
        recoveryState.provider_suppression
      ));
      } catch (recoveryError) {
        var recoverySafe = WorkOsUtilities.safeError(
          recoveryError,
          'DIAGNOSTIC'
        );
        checks.push(check(
          'RETRY_DEAD_LETTER_STATE',
          'FAIL',
          'Retry繝ｻDead Letter迥ｶ諷九ｒ螳牙・縺ｫ讀懈渊縺ｧ縺阪∪縺帙ｓ縺ｧ縺励◆縲・,
          { error_code: recoverySafe.code }
        ));
      }
    }
    var setupPhase4Complete =
      JSON.stringify(completedForCalendar) ===
      JSON.stringify(WorkOsConfig.SETUP_STAGES);
    checks.push(check(
      'SETUP_PHASE4_COMPLETE',
      setupPhase4Complete ? 'PASS' : 'WARN',
      setupPhase4Complete
        ? ''
        : 'S99縺ｯ譛ｪ螳御ｺ・〒縺吶４etup螳溯｡御ｸｭ縺ｮS90縺ｧ縺ｯ縺薙・隴ｦ蜻翫′諠ｳ螳壹＆繧後∪縺吶・,
      {
        s99_recorded:
          completedForCalendar.indexOf('S99_COMPLETE') !== -1
      }
    ));

    var duration = Date.now() - startedAt;
    checks.push(check(
      'QUICK_DIAGNOSTIC_DURATION',
      duration <= WorkOsConfig.QUICK_DIAGNOSTIC_TARGET_MS ? 'PASS' : 'FAIL',
      duration <= WorkOsConfig.QUICK_DIAGNOSTIC_TARGET_MS ? '' : 'Quick Diagnostic縺檎岼讓呎凾髢薙ｒ雜・℃縺励∪縺励◆縲・,
      { duration_ms: duration, target_ms: WorkOsConfig.QUICK_DIAGNOSTIC_TARGET_MS }
    ));
    var hasFailure = checks.some(function (item) { return item.status === 'FAIL'; });
    var hasWarning = checks.some(function (item) {
      return item.status === 'WARN' || item.status === 'NOT_YET_IMPLEMENTED';
    });
    var completedStages = [];
    if (completedRaw) {
      try {
        var parsedStages = JSON.parse(completedRaw);
        completedStages = Array.isArray(parsedStages) ? parsedStages : [];
      } catch (error) {
        checks.push(check(
          'SETUP_PROPERTIES_PARSE',
          'FAIL',
          'Setup谿ｵ髫弱・Properties繧定ｧ｣譫舌〒縺阪∪縺帙ｓ縲・
        ));
        hasFailure = true;
      }
    }

    return {
      status: hasFailure ? 'FAIL' : (hasWarning ? 'WARN' : 'PASS'),
      code_version: WorkOsConfig.CODE_VERSION,
      schema_version: WorkOsConfig.SCHEMA_VERSION,
      migration_version: WorkOsConfig.MIGRATION_VERSION,
      setup_completed_stages: completedStages,
      duration_ms: Date.now() - startedAt,
      checks: checks
    };
  }

  function runDeepDiagnostic(spreadsheet, options) {
    var settings = options || {};
    if (Object.keys(settings).length && !WorkOsConfig.TEST_MODE) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        'DIAGNOSTIC',
        false,
        'Deep Diagnostic縺ｸ縺ｮ萓晏ｭ俶ｳｨ蜈･縺ｯTest mode縺縺代〒蛻ｩ逕ｨ縺ｧ縺阪∪縺吶・
      );
    }
    var startedAt = Date.now();
    var budget = settings.budget || WorkOsUtilities.createSoftBudget(
      WorkOsConfig.DEEP_DIAGNOSTIC_SOFT_LIMIT_MS,
      startedAt
    );
    var target = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
    if (!target) {
      return {
        status: 'FAIL',
        diagnostic_type: 'DEEP_MANUAL_READ_ONLY',
        code_version: WorkOsConfig.CODE_VERSION,
        duration_ms: Date.now() - startedAt,
        checks: [
          check('BOUND_SPREADSHEET', 'FAIL', 'Bound Spreadsheet縺後≠繧翫∪縺帙ｓ縲・)
        ]
      };
    }
    var checks = [];
    try {
      var recovery = inspectRecoveryState(
        target,
        budget,
        settings.now instanceof Date
          ? settings.now
          : WorkOsUtilities.now(),
        { row_limit: WorkOsConfig.DEEP_DIAGNOSTIC_SAMPLE_ROWS }
      );
      checks.push(check(
        'DEEP_RECOVERY_SAMPLE',
        'PASS',
        '',
        {
          sample_limit: WorkOsConfig.DEEP_DIAGNOSTIC_SAMPLE_ROWS,
          recovery: recovery
        }
      ));
      checks.push(check(
        'DEEP_SIDE_EFFECT_POLICY',
        'PASS',
        '',
        {
          repair: false,
          dashboard_refresh: false,
          gmail_search: false,
          calendar_sync: false,
          ai_request: false,
          trigger_creation: false,
          dead_letter_retry: false
        }
      ));
    } catch (error) {
      var safe = WorkOsUtilities.safeError(error, 'DIAGNOSTIC');
      checks.push(check(
        'DEEP_RECOVERY_SAMPLE',
        safe.code === 'E_DIAGNOSTIC_BUDGET' ? 'WARN' : 'FAIL',
        safe.code === 'E_DIAGNOSTIC_BUDGET'
          ? 'Deep Diagnostic繧痴oft budget縺ｧ螳牙・縺ｫ蛛懈ｭ｢縺励∪縺励◆縲・
          : 'Deep Diagnostic縺ｧ荳肴紛蜷医ｒ讀懷・縺励∪縺励◆縲・,
        { error_code: safe.code }
      ));
    }
    var failed = checks.some(function (item) {
      return item.status === 'FAIL';
    });
    var warned = checks.some(function (item) {
      return item.status === 'WARN';
    });
    return {
      status: failed ? 'FAIL' : (warned ? 'WARN' : 'PASS'),
      diagnostic_type: 'DEEP_MANUAL_READ_ONLY',
      code_version: WorkOsConfig.CODE_VERSION,
      schema_version: WorkOsConfig.SCHEMA_VERSION,
      migration_version: WorkOsConfig.MIGRATION_VERSION,
      duration_ms: Date.now() - startedAt,
      checks: checks
    };
  }

  return Object.freeze({
    runQuickDiagnostic: runQuickDiagnostic,
    runDeepDiagnostic: runDeepDiagnostic,
    inspectRecoveryState: inspectRecoveryState,
    buildAiReadinessChecks: buildAiReadinessChecks
  });
}());

function runQuickDiagnostic() {
  return WorkOsDiagnostics.runQuickDiagnostic(SpreadsheetApp.getActiveSpreadsheet());
}

function runDeepDiagnostic() {
  return WorkOsDiagnostics.runDeepDiagnostic(
    SpreadsheetApp.getActiveSpreadsheet()
  );
}

