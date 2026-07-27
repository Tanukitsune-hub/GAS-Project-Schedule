/**
 * Typed runtime settings and shared read-only automation preflight.
 *
 * Settings are read once per snapshot. Credential material and provider
 * endpoints are intentionally outside this contract.
 */
var WorkOsRuntimeSettings = (function () {
  var CONTRACT = Object.freeze([
    Object.freeze({
      key: 'timezone',
      value_type: 'STRING',
      default_value: WorkOsConfig.TIMEZONE,
      editable: false
    }),
    Object.freeze({
      key: 'automation_enabled',
      value_type: 'BOOLEAN',
      default_value: false,
      editable: false
    }),
    Object.freeze({
      key: 'ai_provider',
      value_type: 'STRING',
      default_value: WorkOsConfig.AI_PROVIDER,
      editable: false
    }),
    Object.freeze({
      key: 'manual_max_messages',
      value_type: 'INTEGER',
      default_value: WorkOsConfig.MANUAL_MAX_MESSAGES,
      editable: false
    }),
    Object.freeze({
      key: 'auto_max_messages',
      value_type: 'INTEGER',
      default_value: WorkOsConfig.AUTOMATION_MAX_MESSAGES_PER_RUN,
      editable: true,
      min: 1,
      max: WorkOsConfig.AUTOMATION_MAX_MESSAGES_PER_RUN
    }),
    Object.freeze({
      key: 'manual_soft_limit_sec',
      value_type: 'INTEGER',
      default_value: WorkOsConfig.MANUAL_WORKER_SOFT_LIMIT_MS / 1000,
      editable: true,
      min: 30,
      max: WorkOsConfig.MANUAL_WORKER_SOFT_LIMIT_MS / 1000
    }),
    Object.freeze({
      key: 'auto_soft_limit_sec',
      value_type: 'INTEGER',
      default_value: WorkOsConfig.AUTOMATION_WORKER_SOFT_LIMIT_MS / 1000,
      editable: true,
      min: 60,
      max: WorkOsConfig.AUTOMATION_WORKER_SOFT_LIMIT_MS / 1000
    }),
    Object.freeze({
      key: 'lock_wait_ms',
      value_type: 'INTEGER',
      default_value: WorkOsConfig.LOCK_WAIT_MS,
      editable: false
    }),
    Object.freeze({
      key: 'max_actions_per_message',
      value_type: 'INTEGER',
      default_value: WorkOsConfig.MAX_AI_ACTIONS,
      editable: false
    }),
    Object.freeze({
      key: 'deadline_calendar_name',
      value_type: 'STRING',
      default_value: WorkOsConfig.DEADLINE_CALENDAR_NAME,
      editable: false
    })
  ]);

  function contractByKey() {
    var result = {};
    CONTRACT.forEach(function (definition) {
      result[definition.key] = definition;
    });
    return result;
  }

  function sameScalar(left, right) {
    return String(left) === String(right);
  }

  function parseValue(value, definition) {
    if (definition.value_type === 'INTEGER') {
      var numeric = Number(value);
      if (!Number.isInteger(numeric)) {
        throw new WorkOsAppError(
          'E_RUNTIME_SETTING_TYPE',
          'RUNTIME_SETTINGS',
          false,
          definition.key + '縺ｯ謨ｴ謨ｰ縺ｧ謖・ｮ壹＠縺ｦ縺上□縺輔＞縲・
        );
      }
      if (definition.editable &&
          (numeric < definition.min || numeric > definition.max)) {
        throw new WorkOsAppError(
          'E_RUNTIME_SETTING_RANGE',
          'RUNTIME_SETTINGS',
          false,
          definition.key + '縺悟ｮ牙・縺ｪ遽・峇螟悶〒縺吶・
        );
      }
      return numeric;
    }
    if (definition.value_type === 'BOOLEAN') {
      if (value === true || String(value).toLowerCase() === 'true') {
        return true;
      }
      if (value === false || String(value).toLowerCase() === 'false') {
        return false;
      }
      throw new WorkOsAppError(
        'E_RUNTIME_SETTING_TYPE',
        'RUNTIME_SETTINGS',
        false,
        definition.key + '縺ｯBoolean縺ｧ謖・ｮ壹＠縺ｦ縺上□縺輔＞縲・
      );
    }
    return String(value == null ? '' : value);
  }

  function readSnapshot(spreadsheet) {
    var sheet = spreadsheet &&
      spreadsheet.getSheetByName(WorkOsConfig.SHEETS.SETTINGS);
    if (!sheet) {
      throw new WorkOsAppError(
        'E_RUNTIME_SETTINGS_MISSING',
        'RUNTIME_SETTINGS',
        false,
        '險ｭ螳售heet縺後≠繧翫∪縺帙ｓ縲・
      );
    }
    var schema = WorkOsSchemas.getSheetSchema(
      WorkOsConfig.SHEETS.SETTINGS
    );
    var ids = sheet.getRange(1, 1, 1, schema.length).getValues()[0];
    if (JSON.stringify(ids) !== JSON.stringify(
      WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.SETTINGS)
    )) {
      throw new WorkOsAppError(
        'E_RUNTIME_SETTINGS_SCHEMA',
        'RUNTIME_SETTINGS',
        false,
        '險ｭ螳售heet縺ｮ蜀・Κ蛻悠D縺御ｸ閾ｴ縺励∪縺帙ｓ縲・
      );
    }
    var rowCount = Math.max(
      0,
      sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
    );
    var rows = rowCount
      ? sheet.getRange(
        WorkOsConfig.DATA_START_ROW,
        1,
        rowCount,
        schema.length
      ).getValues()
      : [];
    var map = WorkOsSchemas.buildColumnMapFromIds(ids);
    var contract = contractByKey();
    var values = {};
    var seen = {};
    rows.forEach(function (row) {
      var key = String(row[map.setting_key] || '');
      if (!key || !contract[key]) {
        return;
      }
      if (seen[key]) {
        throw new WorkOsAppError(
          'E_RUNTIME_SETTING_DUPLICATE',
          'RUNTIME_SETTINGS',
          false,
          '險ｭ螳壹く繝ｼ縺碁㍾隍・＠縺ｦ縺・∪縺吶・
        );
      }
      seen[key] = true;
      var definition = contract[key];
      if (String(row[map.value_type] || '') !==
          definition.value_type ||
          Boolean(row[map.editable]) !== definition.editable) {
        throw new WorkOsAppError(
          'E_RUNTIME_SETTING_CONTRACT',
          'RUNTIME_SETTINGS',
          false,
          key + '縺ｮ險ｭ螳壼･醍ｴ・′荳閾ｴ縺励∪縺帙ｓ縲４etup繧貞・螳溯｡後＠縺ｦ縺上□縺輔＞縲・
        );
      }
      var parsed = parseValue(row[map.value], definition);
      if (!definition.editable &&
          !sameScalar(parsed, definition.default_value)) {
        throw new WorkOsAppError(
          'E_RUNTIME_SETTING_FIXED',
          'RUNTIME_SETTINGS',
          false,
          key + '縺ｯ邱ｨ髮・〒縺阪↑縺・ｨｭ螳壹〒縺吶４etup繧貞・螳溯｡後＠縺ｦ縺上□縺輔＞縲・
        );
      }
      values[key] = parsed;
    });
    CONTRACT.forEach(function (definition) {
      if (!seen[definition.key]) {
        throw new WorkOsAppError(
          'E_RUNTIME_SETTING_REQUIRED',
          'RUNTIME_SETTINGS',
          false,
          '蠢・郁ｨｭ螳壹′荳崎ｶｳ縺励※縺・∪縺・ ' + definition.key
        );
      }
    });
    return Object.freeze({
      source: 'SETTINGS_SHEET',
      settings_read_count: 1,
      manual_max_messages: Number(values.manual_max_messages),
      automation_max_messages_per_run:
        Number(values.auto_max_messages),
      manual_worker_soft_limit_ms:
        Number(values.manual_soft_limit_sec) * 1000,
      automation_worker_soft_limit_ms:
        Number(values.auto_soft_limit_sec) * 1000,
      lock_wait_ms: Number(values.lock_wait_ms),
      raw_values: Object.freeze(values)
    });
  }

  function validationMatches(rule, planItem) {
    var criteria = rule && rule.getCriteriaType
      ? rule.getCriteriaType()
      : null;
    if (planItem.validation === 'CHECKBOX') {
      return criteria === SpreadsheetApp.DataValidationCriteria.CHECKBOX;
    }
    if (planItem.validation === 'ENUM') {
      if (criteria !==
          SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
        return false;
      }
      var criteriaValues = rule.getCriteriaValues();
      var list = criteriaValues && Array.isArray(criteriaValues[0])
        ? criteriaValues[0]
        : [];
      return JSON.stringify(list) === JSON.stringify(
        planItem.allowedValues || []
      );
    }
    return criteria !== SpreadsheetApp.DataValidationCriteria.CHECKBOX;
  }

  function collectCurrentPreflight(spreadsheet, options) {
    var settings = options || {};
    var budget = settings.budget ||
      WorkOsUtilities.createSoftBudget(
        WorkOsConfig.QUICK_DIAGNOSTIC_TARGET_MS,
        Date.now()
      );
    var reasons = [];
    var snapshot = null;
    if (budget.isExhausted(
      WorkOsConfig.QUICK_DIAGNOSTIC_RESERVE_MS
    )) {
      return {
        ready: false,
        reasons: ['PREFLIGHT_BUDGET_EXHAUSTED'],
        runtime_settings: null,
        external_services_called: false,
        layout_repaired: false
      };
    }
    try {
      snapshot = readSnapshot(spreadsheet);
    } catch (error) {
      reasons.push(WorkOsUtilities.safeError(
        error,
        'RUNTIME_SETTINGS'
      ).code);
    }
    var settingsSheet = spreadsheet &&
      spreadsheet.getSheetByName(WorkOsConfig.SHEETS.SETTINGS);
    if (settingsSheet &&
        typeof settingsSheet.getProtections === 'function') {
      try {
        var settingsProtectionFound = settingsSheet.getProtections(
          SpreadsheetApp.ProtectionType.SHEET
        ).some(function (protection) {
          return String(protection.getDescription() || '') ===
            'WORK_OS_V2_PHASE1_' +
              WorkOsConfig.SHEETS.SETTINGS + '_EDIT_POLICY';
        });
        if (!settingsProtectionFound) {
          reasons.push('SETTINGS_PROTECTION_MISMATCH');
        }
      } catch (protectionError) {
        reasons.push('SETTINGS_PROTECTION_UNAVAILABLE');
      }
    } else if (settingsSheet) {
      reasons.push('SETTINGS_PROTECTION_UNAVAILABLE');
    }
    var sheetNames = Object.keys(WorkOsConfig.SHEETS);
    for (var sheetIndex = 0;
        sheetIndex < sheetNames.length;
        sheetIndex += 1) {
      if (budget.isExhausted(
        WorkOsConfig.QUICK_DIAGNOSTIC_RESERVE_MS
      )) {
        reasons.push('PREFLIGHT_BUDGET_EXHAUSTED');
        break;
      }
      var nameKey = sheetNames[sheetIndex];
      var sheetName = WorkOsConfig.SHEETS[nameKey];
      var sheet = spreadsheet && spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        reasons.push('REQUIRED_SHEET_MISSING');
      } else {
        try {
          var schema = WorkOsSchemas.getSheetSchema(sheetName);
          var headers = sheet.getRange(
            1,
            1,
            2,
            schema.length
          ).getValues();
          var comparison = WorkOsSchemas.compareHeaders(
            sheetName,
            headers[0],
            headers[1]
          );
          if (!comparison.idsMatch || !comparison.headersMatch ||
              sheet.getMaxColumns() !== schema.length) {
            reasons.push('SHEET_SCHEMA_MISMATCH');
          }
        } catch (error) {
          reasons.push('SHEET_SCHEMA_MISMATCH');
        }
      }
    }
    var taskSheet = reasons.indexOf('PREFLIGHT_BUDGET_EXHAUSTED') === -1 &&
      spreadsheet &&
      spreadsheet.getSheetByName(WorkOsConfig.SHEETS.TASKS);
    if (taskSheet) {
      try {
        var taskSchema = WorkOsSchemas.getSheetSchema(
          WorkOsConfig.SHEETS.TASKS
        );
        var plan = WorkOsSchemas.validationPlanForSheet(
          WorkOsConfig.SHEETS.TASKS
        );
        var dataRows = Math.max(
          0,
          taskSheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
        );
        var validationMismatch = false;
        for (var offset = 0; offset < dataRows; offset += 250) {
          if (budget.isExhausted(
            WorkOsConfig.QUICK_DIAGNOSTIC_RESERVE_MS
          )) {
            reasons.push('PREFLIGHT_BUDGET_EXHAUSTED');
            break;
          }
          var rows = Math.min(250, dataRows - offset);
          taskSheet.getRange(
            WorkOsConfig.DATA_START_ROW + offset,
            1,
            rows,
            taskSchema.length
          ).getDataValidations().some(function (rowRules) {
            return plan.some(function (planItem, index) {
              if (!validationMatches(rowRules[index], planItem)) {
                validationMismatch = true;
                return true;
              }
              return false;
            });
          });
          if (validationMismatch) {
            reasons.push('TASK_VALIDATION_MISMATCH');
            break;
          }
        }
        if (reasons.indexOf('PREFLIGHT_BUDGET_EXHAUSTED') !== -1) {
          throw new WorkOsAppError(
            'E_BUDGET_EXHAUSTED',
            'RUNTIME_PREFLIGHT',
            true,
            'Shared preflight繧貞ｮ溯｡御ｺ育ｮ怜・縺ｧ蛛懈ｭ｢縺励∪縺励◆縲・
          );
        }
        var taskMap = WorkOsSchemas.buildColumnMapFromIds(
          WorkOsSchemas.getInternalIds(
            WorkOsConfig.SHEETS.TASKS
          )
        );
        var taskIds = dataRows
          ? taskSheet.getRange(
            WorkOsConfig.DATA_START_ROW,
            taskMap.task_id + 1,
            dataRows,
            1
          ).getValues()
          : [];
        var originKeys = dataRows
          ? taskSheet.getRange(
            WorkOsConfig.DATA_START_ROW,
            taskMap.origin_key + 1,
            dataRows,
            1
          ).getValues()
          : [];
        var taskSeen = {};
        var originSeen = {};
        taskIds.forEach(function (row, index) {
          var taskId = String(row[0] || '');
          var originKey = String(originKeys[index][0] || '');
          if ((taskId && taskSeen[taskId]) ||
              (originKey && originSeen[originKey])) {
            reasons.push('TASK_KEY_DUPLICATE');
          }
          if (taskId) {
            taskSeen[taskId] = true;
          }
          if (originKey) {
            originSeen[originKey] = true;
          }
        });
        if (typeof taskSheet.getProtections === 'function') {
          var descriptions = [];
          [
            SpreadsheetApp.ProtectionType.RANGE,
            SpreadsheetApp.ProtectionType.SHEET
          ].forEach(function (type) {
            taskSheet.getProtections(type).forEach(function (protection) {
              descriptions.push(String(protection.getDescription() || ''));
            });
          });
          [
            'WORK_OS_V2_PHASE1_' +
              WorkOsConfig.SHEETS.TASKS + '_HEADER_IDS',
            'WORK_OS_V2_PHASE1_' +
              WorkOsConfig.SHEETS.TASKS + '_MANAGEMENT_COLUMNS',
            'WORK_OS_V2_PHASE1_' +
              WorkOsConfig.SHEETS.TASKS + '_EDIT_POLICY'
          ].forEach(function (description) {
            if (descriptions.indexOf(description) === -1) {
              reasons.push('TASK_PROTECTION_MISMATCH');
            }
          });
        } else {
          reasons.push('TASK_PROTECTION_UNAVAILABLE');
        }
      } catch (error) {
        reasons.push('TASK_PREFLIGHT_UNAVAILABLE');
      }
    }
    var uniqueReasons = [];
    reasons.forEach(function (reason) {
      if (uniqueReasons.indexOf(reason) === -1) {
        uniqueReasons.push(reason);
      }
    });
    return {
      ready: uniqueReasons.length === 0,
      reasons: uniqueReasons,
      runtime_settings: snapshot,
      external_services_called: false,
      layout_repaired: false
    };
  }

  function summarizeHealth(preflight, automationStatus, quickDiagnostic) {
    var quick = String(
      quickDiagnostic && quickDiagnostic.status || 'NOT_EXECUTED'
    );
    var automation = String(
      automationStatus && automationStatus.status || 'UNKNOWN'
    );
    if (quick === 'FAIL') {
      return {
        status: 'ERROR',
        note: 'Quick Diagnostic縺ｫFAIL縺後≠繧翫∪縺吶・
      };
    }
    if (preflight && preflight.ready === false) {
      return {
        status: 'ACTION_REQUIRED',
        note: '閾ｪ蜍募・逅・ate縺ｮ譛ｪ螳御ｺ・擅莉ｶ縺後≠繧翫∪縺吶・
      };
    }
    if (quick === 'WARN' || automation !== 'CONSISTENT') {
      return {
        status: 'ATTENTION',
        note: '隱ｭ蜿也ｵ先棡縺ｫ遒ｺ隱堺ｺ矩・′縺ゅｊ縺ｾ縺吶・
      };
    }
    return {
      status: 'HEALTHY',
      note: '繝ｭ繝ｼ繧ｫ繝ｫ讒区・遒ｺ隱阪・豁｣蟶ｸ縺ｧ縺吶ょ､夜Κ謗･邯壹・讀懆ｨｼ邨先棡縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・
    };
  }

  return Object.freeze({
    CONTRACT: CONTRACT,
    readSnapshot: readSnapshot,
    collectCurrentPreflight: collectCurrentPreflight,
    summarizeHealth: summarizeHealth
  });
}());

