/**
 * Setup-only Sheet construction. Runtime modules must not call this object.
 */
var WorkOsSheetBuilder = (function () {
  var PROTECTION_PREFIX = 'WORK_OS_V2_PHASE1_';
  var SYSTEM_OWNED_SHEETS = Object.freeze({
    'ダッシュボード': true,
    '処理履歴': true,
    '使い方': true,
    'エラー・再実行': true
  });

  function initialRowsForSheet(sheetName) {
    if (sheetName === WorkOsConfig.SHEETS.SETTINGS) {
      return WorkOsConfig.SETTINGS_INITIAL_ROWS;
    }
    if (sheetName === WorkOsConfig.SHEETS.TASKS) {
      return WorkOsConfig.TASK_INITIAL_ROWS;
    }
    return WorkOsConfig.DEFAULT_INITIAL_ROWS;
  }

  function isSheetLogicallyEmpty(sheet) {
    var content = WorkOsUtilities.inspectRangeContent(sheet.getDataRange());
    if (content.has_value || content.has_formula || content.has_note || content.has_validation) {
      return false;
    }
    if (typeof sheet.getProtections === 'function') {
      if (sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE).length ||
          sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).length) {
        return false;
      }
    }
    return true;
  }

  function resizeNewBlankSheet(sheet, sheetName) {
    var targetRows = initialRowsForSheet(sheetName);
    var targetColumns = WorkOsSchemas.getSheetSchema(sheetName).length;
    var currentRows = sheet.getMaxRows();
    var currentColumns = sheet.getMaxColumns();
    if (currentRows < targetRows) {
      sheet.insertRowsAfter(currentRows, targetRows - currentRows);
    } else if (currentRows > targetRows) {
      sheet.deleteRows(targetRows + 1, currentRows - targetRows);
    }
    if (currentColumns < targetColumns) {
      sheet.insertColumnsAfter(currentColumns, targetColumns - currentColumns);
    } else if (currentColumns > targetColumns) {
      sheet.deleteColumns(targetColumns + 1, currentColumns - targetColumns);
    }
  }

  function ensureMinimumGrid(sheet, sheetName) {
    var minimumRows = initialRowsForSheet(sheetName);
    var minimumColumns = WorkOsSchemas.getSheetSchema(sheetName).length;
    if (sheet.getMaxRows() < minimumRows) {
      sheet.insertRowsAfter(sheet.getMaxRows(), minimumRows - sheet.getMaxRows());
    }
    if (sheet.getMaxColumns() < minimumColumns) {
      sheet.insertColumnsAfter(
        sheet.getMaxColumns(),
        minimumColumns - sheet.getMaxColumns()
      );
    }
  }

  function ensureSheets(spreadsheet) {
    var created = [];
    var existingSheets = spreadsheet.getSheets();
    var firstSheet = existingSheets.length === 1 ? existingSheets[0] : null;
    var canRenameFirst = firstSheet &&
      WorkOsSheetOrder.indexOf(firstSheet.getName()) === -1 &&
      isSheetLogicallyEmpty(firstSheet);

    WorkOsSheetOrder.forEach(function (sheetName, index) {
      var sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        if (index === 0 && canRenameFirst) {
          firstSheet.setName(sheetName);
          sheet = firstSheet;
          canRenameFirst = false;
        } else {
          sheet = spreadsheet.insertSheet(sheetName, index);
        }
        resizeNewBlankSheet(sheet, sheetName);
        created.push(sheetName);
      } else {
        // Resume safely if a prior S10 execution stopped after creating only
        // part of a Sheet grid. Existing grids are never shrunk.
        ensureMinimumGrid(sheet, sheetName);
      }
      var currentIndex = spreadsheet.getSheets().indexOf(sheet);
      if (currentIndex !== index) {
        var wasHidden = sheet.isSheetHidden();
        if (wasHidden) {
          sheet.showSheet();
        }
        spreadsheet.setActiveSheet(sheet);
        spreadsheet.moveActiveSheet(index + 1);
        if (wasHidden) {
          sheet.hideSheet();
        }
      }
    });

    return {
      created: created,
      sheets: WorkOsSheetOrder.reduce(function (result, name) {
        result[name] = spreadsheet.getSheetByName(name);
        return result;
      }, {})
    };
  }

  function allBlank(values) {
    return values.every(function (value) {
      return WorkOsUtilities.isBlank(value);
    });
  }

  function applySchemaToSheet(sheet, sheetName) {
    var schema = WorkOsSchemas.getSheetSchema(sheetName);
    var ids = schema.map(function (item) { return item.id; });
    var headers = schema.map(function (item) { return item.header; });
    var existingIds = sheet.getRange(
      WorkOsConfig.HEADER_ID_ROW,
      1,
      1,
      schema.length
    ).getValues()[0];
    var existingHeaders = sheet.getRange(
      WorkOsConfig.HEADER_LABEL_ROW,
      1,
      1,
      schema.length
    ).getValues()[0];
    var comparison = WorkOsSchemas.compareHeaders(sheetName, existingIds, existingHeaders);

    if (allBlank(existingIds) && allBlank(existingHeaders)) {
      sheet.getRange(WorkOsConfig.HEADER_ID_ROW, 1, 1, schema.length).setValues([ids]);
      sheet.getRange(WorkOsConfig.HEADER_LABEL_ROW, 1, 1, schema.length).setValues([headers]);
    } else if (comparison.idsMatch && comparison.headersMatch) {
      // Exact v2 schema: rerun is a no-op for cell values.
    } else if (comparison.idsMatch && existingHeaders.every(function (value, index) {
      return WorkOsUtilities.isBlank(value) || String(value) === headers[index];
    })) {
      // Safe recovery from interruption between row 1 and row 2.
      sheet.getRange(WorkOsConfig.HEADER_LABEL_ROW, 1, 1, schema.length).setValues([headers]);
    } else {
      throw new WorkOsAppError(
        'E_SCHEMA_CONFLICT',
        'S20_CREATE_SCHEMAS',
        false,
        sheetName + 'の既存Schemaがv2仕様と一致しないため停止しました。'
      );
    }

    sheet.setFrozenRows(2);
    sheet.hideRows(WorkOsConfig.HEADER_ID_ROW);
    sheet.getRange(WorkOsConfig.HEADER_ID_ROW, 1, 1, schema.length)
      .setFontWeight('bold')
      .setBackground('#e8eaed');
    sheet.getRange(WorkOsConfig.HEADER_LABEL_ROW, 1, 1, schema.length)
      .setFontWeight('bold')
      .setBackground('#d9eaf7');

    if (sheetName === WorkOsConfig.SHEETS.TASKS) {
      var firstHidden = schema.findIndex(function (item) { return item.visible === false; });
      if (firstHidden >= 0) {
        sheet.hideColumns(firstHidden + 1, schema.length - firstHidden);
      }
    }
    ensureSmallProtections(sheet, sheetName, schema);

    return WorkOsSchemas.buildColumnMapFromIds(ids);
  }

  function configureProtection(protection) {
    protection.setWarningOnly(false);
    var effectiveUser = Session.getEffectiveUser();
    var effectiveEmail = effectiveUser.getEmail();
    if (!effectiveEmail) {
      throw new WorkOsAppError(
        'E_PROTECTION_IDENTITY_UNAVAILABLE',
        'S20_CREATE_SCHEMAS',
        false,
        'Protection設定に必要な実行者情報を確認できません。'
      );
    }
    protection.addEditor(effectiveUser);
    var removableEditors = protection.getEditors().filter(function (editor) {
      return editor.getEmail() !== effectiveEmail;
    });
    if (removableEditors.length) {
      protection.removeEditors(removableEditors);
    }
    if (protection.canDomainEdit()) {
      protection.setDomainEdit(false);
    }
    return protection;
  }

  function findProtectionByDescription(protections, description) {
    for (var index = 0; index < protections.length; index += 1) {
      if (protections[index].getDescription() === description) {
        return protections[index];
      }
    }
    return null;
  }

  function ensureSmallProtections(sheet, sheetName, schema) {
    if (typeof sheet.getProtections !== 'function') {
      return;
    }
    var rangeProtections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
    var headerDescription = PROTECTION_PREFIX + sheetName + '_HEADER_IDS';
    var headerProtection = findProtectionByDescription(rangeProtections, headerDescription);
    var headerRange = sheet.getRange(1, 1, 1, schema.length);
    if (!headerProtection) {
      headerProtection = headerRange
        .protect()
        .setDescription(headerDescription);
    } else if (typeof headerProtection.setRange === 'function') {
      headerProtection.setRange(headerRange);
    }
    configureProtection(headerProtection);
    if (sheetName === WorkOsConfig.SHEETS.TASKS) {
      var firstHidden = schema.findIndex(function (item) { return item.visible === false; });
      var managementDescription = PROTECTION_PREFIX + sheetName + '_MANAGEMENT_COLUMNS';
      var managementProtection = findProtectionByDescription(
        rangeProtections,
        managementDescription
      );
      if (firstHidden >= 0 && !managementProtection) {
        managementProtection = sheet.getRange(
          1,
          firstHidden + 1,
          sheet.getMaxRows(),
          schema.length - firstHidden
        ).protect()
          .setDescription(managementDescription);
      }
      if (managementProtection) {
        if (typeof managementProtection.setRange === 'function') {
          managementProtection.setRange(sheet.getRange(
            1,
            firstHidden + 1,
            sheet.getMaxRows(),
            schema.length - firstHidden
          ));
        }
        configureProtection(managementProtection);
      }
      var taskPolicyDescription = PROTECTION_PREFIX + sheetName + '_EDIT_POLICY';
      var taskSheetProtections = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
      var taskPolicyProtection = findProtectionByDescription(
        taskSheetProtections,
        taskPolicyDescription
      );
      if (!taskPolicyProtection) {
        taskPolicyProtection = sheet.protect().setDescription(taskPolicyDescription);
      }
      var editableRanges = [];
      var taskDataRowCount = Math.max(
        1,
        sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
      );
      schema.forEach(function (item, index) {
        if (item.editable) {
          editableRanges.push(sheet.getRange(
            WorkOsConfig.DATA_START_ROW,
            index + 1,
            taskDataRowCount,
            1
          ));
        }
      });
      taskPolicyProtection.setUnprotectedRanges(editableRanges);
      configureProtection(taskPolicyProtection);
    }
    if (WorkOsHiddenSheets.indexOf(sheetName) !== -1) {
      var sheetDescription = PROTECTION_PREFIX + sheetName + '_MANAGEMENT_SHEET';
      var sheetProtections = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
      var sheetProtection = findProtectionByDescription(sheetProtections, sheetDescription);
      if (!sheetProtection) {
        sheetProtection = sheet.protect().setDescription(sheetDescription);
      }
      configureProtection(sheetProtection);
    }
    if (SYSTEM_OWNED_SHEETS[sheetName]) {
      var systemDescription = PROTECTION_PREFIX +
        sheetName + '_SYSTEM_OWNED_EDIT_POLICY';
      var systemProtections = sheet.getProtections(
        SpreadsheetApp.ProtectionType.SHEET
      );
      var systemProtection = findProtectionByDescription(
        systemProtections,
        systemDescription
      );
      if (!systemProtection) {
        systemProtection = sheet.protect()
          .setDescription(systemDescription);
      }
      var operatorRanges = [];
      if (sheetName === WorkOsConfig.SHEETS.ERRORS) {
        var errorMap = WorkOsSchemas.buildColumnMapFromIds(
          WorkOsSchemas.getInternalIds(sheetName)
        );
        operatorRanges.push(sheet.getRange(
          WorkOsConfig.DATA_START_ROW,
          errorMap.retry_requested + 1,
          Math.max(
            1,
            sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
          ),
          1
        ));
      }
      systemProtection.setUnprotectedRanges(operatorRanges);
      configureProtection(systemProtection);
    }
  }

  function applyAllSchemas(spreadsheet) {
    var columnMaps = {};
    WorkOsSheetOrder.forEach(function (sheetName) {
      var sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        throw new WorkOsAppError(
          'E_SCHEMA_MISSING_SHEET',
          'S20_CREATE_SCHEMAS',
          false,
          '必須Sheetがありません: ' + sheetName
        );
      }
      columnMaps[sheetName] = applySchemaToSheet(sheet, sheetName);
    });
    SpreadsheetApp.flush();
    return columnMaps;
  }

  function buildValidationRule(planItem) {
    if (planItem.validation === 'CHECKBOX') {
      return SpreadsheetApp.newDataValidation()
        .requireCheckbox()
        .setAllowInvalid(false)
        .build();
    }
    if (planItem.validation === 'ENUM' && planItem.allowedValues) {
      return SpreadsheetApp.newDataValidation()
        .requireValueInList(planItem.allowedValues, true)
        .setAllowInvalid(false)
        .build();
    }
    return null;
  }

  function applyValidationsAndFormats(spreadsheet) {
    WorkOsSheetOrder.forEach(function (sheetName) {
      var sheet = spreadsheet.getSheetByName(sheetName);
      var schema = WorkOsSchemas.getSheetSchema(sheetName);
      var dataRowCount = Math.max(0, sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1);
      if (!dataRowCount) {
        return;
      }
      WorkOsSchemas.validationPlanForSheet(sheetName).forEach(function (planItem) {
        var rule = buildValidationRule(planItem);
        if (rule) {
          sheet.getRange(
            WorkOsConfig.DATA_START_ROW,
            planItem.columnIndex,
            dataRowCount,
            1
          ).setDataValidation(rule);
        }
      });
      schema.forEach(function (item, index) {
        var range = sheet.getRange(
          WorkOsConfig.DATA_START_ROW,
          index + 1,
          dataRowCount,
          1
        );
        if (item.type === 'Date') {
          range.setNumberFormat(WorkOsConfig.DATE_FORMAT);
        } else if (item.type === 'DateTime') {
          range.setNumberFormat(WorkOsConfig.DATETIME_FORMAT);
        } else if (item.type === 'Integer') {
          range.setNumberFormat('0');
        } else if (item.type === 'Number') {
          range.setNumberFormat('0.00');
        }
      });
    });
  }

  function refreshValidationsAndProtections(spreadsheet) {
    applyValidationsAndFormats(spreadsheet);
    var refreshedSheets = [];
    WorkOsSheetOrder.forEach(function (sheetName) {
      var sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        throw new WorkOsAppError(
          'E_SCHEMA_MISSING_SHEET',
          'SETUP_LAYOUT_REFRESH',
          false,
          'Validation/Protection更新対象Sheetがありません。'
        );
      }
      ensureSmallProtections(
        sheet,
        sheetName,
        WorkOsSchemas.getSheetSchema(sheetName)
      );
      refreshedSheets.push(sheetName);
    });
    return {
      refreshed: true,
      sheet_count: refreshedSheets.length,
      sheets: refreshedSheets
    };
  }

  function findFirstEmptyKeyRow(sheet, keyColumnIndex) {
    var rowCount = sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1;
    var values = sheet.getRange(
      WorkOsConfig.DATA_START_ROW,
      keyColumnIndex,
      rowCount,
      1
    ).getValues();
    for (var index = 0; index < values.length; index += 1) {
      if (WorkOsUtilities.isBlank(values[index][0])) {
        return WorkOsConfig.DATA_START_ROW + index;
      }
    }
    sheet.insertRowsAfter(sheet.getMaxRows(), WorkOsConfig.ROW_EXPANSION_UNIT);
    return sheet.getMaxRows() - WorkOsConfig.ROW_EXPANSION_UNIT + 1;
  }

  function seedRowsByKey(sheet, sheetName, keyId, rows) {
    var schema = WorkOsSchemas.getSheetSchema(sheetName);
    var ids = schema.map(function (item) { return item.id; });
    var map = WorkOsSchemas.buildColumnMapFromIds(ids);
    var keyColumn = map[keyId] + 1;
    var rowCount = sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1;
    var existingKeys = sheet.getRange(
      WorkOsConfig.DATA_START_ROW,
      keyColumn,
      rowCount,
      1
    ).getValues().map(function (row) { return String(row[0] || ''); });
    var insertedCount = 0;

    rows.forEach(function (record) {
      if (existingKeys.indexOf(String(record[keyId])) !== -1) {
        return;
      }
      var targetRow = findFirstEmptyKeyRow(sheet, keyColumn);
      var output = ids.map(function (id) {
        return Object.prototype.hasOwnProperty.call(record, id) ? record[id] : '';
      });
      sheet.getRange(targetRow, 1, 1, output.length).setValues([output]);
      existingKeys[targetRow - WorkOsConfig.DATA_START_ROW] = String(record[keyId]);
      insertedCount += 1;
    });
    return insertedCount;
  }

  function upsertSystemRowsByKey(sheet, sheetName, keyId, rows) {
    var schema = WorkOsSchemas.getSheetSchema(sheetName);
    var ids = schema.map(function (item) { return item.id; });
    var map = WorkOsSchemas.buildColumnMapFromIds(ids);
    var keyColumn = map[keyId] + 1;
    var rowCount = Math.max(
      0,
      sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
    );
    var values = rowCount
      ? sheet.getRange(
        WorkOsConfig.DATA_START_ROW,
        1,
        rowCount,
        ids.length
      ).getValues()
      : [];
    var byKey = {};
    values.forEach(function (row, index) {
      var key = String(row[map[keyId]] || '');
      if (!key) {
        return;
      }
      if (byKey[key]) {
        throw new WorkOsAppError(
          'E_SETUP_STATE_CONFLICT',
          'S40_SEED_SAFE_SETTINGS',
          false,
          sheetName + 'のsystem keyが重複しています。'
        );
      }
      byKey[key] = {
        row_number: WorkOsConfig.DATA_START_ROW + index,
        values: row
      };
    });
    var inserted = seedRowsByKey(
      sheet,
      sheetName,
      keyId,
      rows
    );
    var updated = 0;
    rows.forEach(function (record) {
      var entry = byKey[String(record[keyId])];
      if (!entry) {
        return;
      }
      var output = ids.map(function (id) {
        return Object.prototype.hasOwnProperty.call(record, id)
          ? record[id]
          : '';
      });
      if (JSON.stringify(output) !== JSON.stringify(entry.values)) {
        sheet.getRange(
          entry.row_number,
          1,
          1,
          ids.length
        ).setValues([output]);
        updated += 1;
      }
    });
    return {
      inserted_count: inserted,
      updated_count: updated
    };
  }

  function ensureSafePromptMetadata(spreadsheet, nowValue) {
    var timestamp = nowValue || WorkOsUtilities.now();
    var promptHash = WorkOsUtilities.sha256Hex(
      'WORK_OS_MOCK_PROMPT_CONTRACT|' +
      WorkOsConfig.MOCK_AI_MODEL + '|' +
      WorkOsConfig.MOCK_PROMPT_VERSION + '|' +
      WorkOsConfig.AI_SCHEMA_VERSION
    );
    return seedRowsByKey(
      spreadsheet.getSheetByName(WorkOsConfig.SHEETS.PROMPT_VERSIONS),
      WorkOsConfig.SHEETS.PROMPT_VERSIONS,
      'prompt_version',
      [{
        prompt_version: WorkOsConfig.MOCK_PROMPT_VERSION,
        provider: 'MOCK',
        schema_version: WorkOsConfig.AI_SCHEMA_VERSION,
        prompt_hash: promptHash,
        active: true,
        effective_from: timestamp,
        retired_at: '',
        note: 'Deterministic Mock contract; no prompt content stored'
      }]
    );
  }

  function safeSettingsSeed(nowValue) {
    return [
      ['timezone', 'タイムゾーン', WorkOsConfig.TIMEZONE, 'STRING', WorkOsConfig.TIMEZONE, '固定。日付計算基準', false],
      ['automation_enabled', '自動処理の初期値', false, 'BOOLEAN', 'false', '固定。現在状態はDashboardと明示menuで確認', false],
      ['ai_provider', 'Local AI Provider', WorkOsConfig.AI_PROVIDER, 'STRING', 'MOCK', '固定。実Providerは未決定でSettingsへcredentialを保存しない', false],
      ['manual_max_messages', '手動最大メッセージ数', WorkOsConfig.MANUAL_MAX_MESSAGES, 'INTEGER', '1', '固定。手動試験は1回1件', false],
      ['auto_max_messages', '自動最大メッセージ数', WorkOsConfig.AUTOMATION_MAX_MESSAGES_PER_RUN, 'INTEGER', '1..10', 'Runtimeが1 runに処理する上限', true],
      ['manual_soft_limit_sec', '手動soft limit秒', WorkOsConfig.MANUAL_WORKER_SOFT_LIMIT_MS / 1000, 'INTEGER', '30..120', 'Runtimeの手動Worker budget', true],
      ['auto_soft_limit_sec', '自動soft limit秒', WorkOsConfig.AUTOMATION_WORKER_SOFT_LIMIT_MS / 1000, 'INTEGER', '60..210', 'Runtimeの自動Worker budget', true],
      ['lock_wait_ms', 'Lock待機ms', WorkOsConfig.LOCK_WAIT_MS, 'INTEGER', String(WorkOsConfig.LOCK_WAIT_MS), '固定。コード安全境界', false],
      ['max_actions_per_message', '最大Action数', WorkOsConfig.MAX_AI_ACTIONS, 'INTEGER', String(WorkOsConfig.MAX_AI_ACTIONS), '固定。AI Schema安全境界', false],
      ['deadline_calendar_name', '専用Calendar名', WorkOsConfig.DEADLINE_CALENDAR_NAME, 'STRING', WorkOsConfig.DEADLINE_CALENDAR_NAME, '固定。Setupで専用secondary Calendarを作成', false]
    ].map(function (item) {
      return {
        setting_key: item[0],
        display_name: item[1],
        value: item[2],
        value_type: item[3],
        allowed_values: item[4],
        description: item[5],
        editable: item[6],
        updated_at: nowValue
      };
    });
  }

  function upsertSafeSettings(spreadsheet, nowValue) {
    var sheet = spreadsheet.getSheetByName(WorkOsConfig.SHEETS.SETTINGS);
    var schema = WorkOsSchemas.getSheetSchema(
      WorkOsConfig.SHEETS.SETTINGS
    );
    var ids = schema.map(function (item) { return item.id; });
    var map = WorkOsSchemas.buildColumnMapFromIds(ids);
    var rowCount = Math.max(
      0,
      sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
    );
    var existing = rowCount
      ? sheet.getRange(
        WorkOsConfig.DATA_START_ROW,
        1,
        rowCount,
        ids.length
      ).getValues()
      : [];
    var rowsByKey = {};
    existing.forEach(function (row, index) {
      var key = String(row[map.setting_key] || '');
      if (!key) {
        return;
      }
      if (rowsByKey[key]) {
        throw new WorkOsAppError(
          'E_SETUP_STATE_CONFLICT',
          'S40_SEED_SAFE_SETTINGS',
          false,
          '設定Sheetのsetting_keyが重複しています。'
        );
      }
      rowsByKey[key] = {
        row_number: WorkOsConfig.DATA_START_ROW + index,
        values: row
      };
    });
    var timestamp = nowValue || WorkOsUtilities.now();
    var definitions = safeSettingsSeed(timestamp);
    var inserted = seedRowsByKey(
      sheet,
      WorkOsConfig.SHEETS.SETTINGS,
      'setting_key',
      definitions
    );
    var updated = 0;
    definitions.forEach(function (definition) {
      var entry = rowsByKey[definition.setting_key];
      if (!entry) {
        return;
      }
      var next = entry.values.slice();
      ids.forEach(function (id) {
        if (id === 'updated_at') {
          return;
        }
        if (id === 'value' && definition.editable === true) {
          return;
        }
        next[map[id]] = definition[id];
      });
      if (JSON.stringify(next) !== JSON.stringify(entry.values)) {
        next[map.updated_at] = timestamp;
        sheet.getRange(
          entry.row_number,
          1,
          1,
          ids.length
        ).setValues([next]);
        updated += 1;
      }
    });
    return {
      inserted_count: inserted,
      updated_count: updated,
      editable_values_preserved: true
    };
  }

  function applySettingsProtection(spreadsheet) {
    var sheet = spreadsheet.getSheetByName(WorkOsConfig.SHEETS.SETTINGS);
    if (!sheet ||
        typeof sheet.getProtections !== 'function' ||
        typeof sheet.protect !== 'function') {
      return { applied: false, reason: 'PROTECTION_UNAVAILABLE' };
    }
    var description = PROTECTION_PREFIX +
      WorkOsConfig.SHEETS.SETTINGS + '_EDIT_POLICY';
    var protections = sheet.getProtections(
      SpreadsheetApp.ProtectionType.SHEET
    );
    var protection = findProtectionByDescription(
      protections,
      description
    );
    if (!protection) {
      protection = sheet.protect().setDescription(description);
    }
    var ids = WorkOsSchemas.getInternalIds(
      WorkOsConfig.SHEETS.SETTINGS
    );
    var map = WorkOsSchemas.buildColumnMapFromIds(ids);
    var rowCount = Math.max(
      0,
      sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
    );
    var values = rowCount
      ? sheet.getRange(
        WorkOsConfig.DATA_START_ROW,
        1,
        rowCount,
        ids.length
      ).getValues()
      : [];
    var editableRanges = [];
    values.forEach(function (row, index) {
      if (row[map.editable] === true) {
        editableRanges.push(sheet.getRange(
          WorkOsConfig.DATA_START_ROW + index,
          map.value + 1,
          1,
          1
        ));
      }
    });
    protection.setUnprotectedRanges(editableRanges);
    configureProtection(protection);
    return {
      applied: true,
      editable_value_cell_count: editableRanges.length
    };
  }

  function seedSafeSettings(spreadsheet) {
    var nowValue = WorkOsUtilities.now();
    var settingsResult = upsertSafeSettings(spreadsheet, nowValue);
    var settingsProtection = applySettingsProtection(spreadsheet);
    seedRowsByKey(
      spreadsheet.getSheetByName(WorkOsConfig.SHEETS.DASHBOARD),
      WorkOsConfig.SHEETS.DASHBOARD,
      'metric_key',
      [
        {
          metric_key: 'AUTOMATION_STATUS',
          metric_value: 'OFF',
          note: '初期停止。明示更新後に現在状態を表示します。'
        },
        {
          metric_key: 'SYSTEM_HEALTH',
          metric_value: '未更新',
          note: 'メニューから運用Dashboardを更新してください。'
        },
        {
          metric_key: 'QUICK_DIAGNOSTIC',
          metric_value: 'NOT_EXECUTED',
          note: 'Dashboard未更新'
        }
      ]
    );
    seedRowsByKey(
      spreadsheet.getSheetByName(WorkOsConfig.SHEETS.SYSTEM_CONFIG),
      WorkOsConfig.SHEETS.SYSTEM_CONFIG,
      'config_key',
      [
        { config_key: 'code_version', config_value: WorkOsConfig.CODE_VERSION, value_type: 'STRING', updated_at: nowValue, note: 'Current v2 code' },
        { config_key: 'schema_version', config_value: WorkOsConfig.SCHEMA_VERSION, value_type: 'STRING', updated_at: nowValue, note: 'Current v2 physical schema' },
        { config_key: 'migration_version', config_value: WorkOsConfig.MIGRATION_VERSION, value_type: 'STRING', updated_at: nowValue, note: 'v1 migration unsupported' },
        { config_key: 'automation_enabled', config_value: 'false', value_type: 'BOOLEAN', updated_at: nowValue, note: 'Initial state' }
      ]
    );
    upsertSystemRowsByKey(
      spreadsheet.getSheetByName(WorkOsConfig.SHEETS.GUIDE),
      WorkOsConfig.SHEETS.GUIDE,
      'step_id',
      [
        { step_id: '1', title: '初期セットアップ', instruction: 'メニューの説明を確認して実行します。Sheet/Protection、正式Gmailラベル、専用secondary Calendar、所有者edit Triggerを段階作成します。既存データのMigration・削除は行いません。' },
        { step_id: '2', title: '自動処理の初期状態', instruction: '通常Inbox処理、実AI接続、5分TriggerはSetupから開始しません。外部判断と全Gate通過後にだけ、メニューから明示的に有効化します。' },
        { step_id: '3', title: 'Taskの日常操作', instruction: '日常操作はタスク一覧だけで行います。通常の編集は所有者installable edit Triggerが自動反映し、問題時だけ手動fallbackを使います。' },
        { step_id: '4', title: '要確認', instruction: '要確認、確認状態、判断をタスク一覧で確認します。専用の要確認タブはありません。' },
        { step_id: '5', title: '運用Dashboard', instruction: 'メニューから明示更新します。件数と安全な状態だけを表示し、メール本文、Task名、外部IDは表示しません。' },
        { step_id: '6', title: 'Diagnosticと再実行', instruction: 'Quick Diagnosticは読取専用です。エラー・再実行では原因を解消してから選択したDead Letterだけを再実行予約します。' },
        { step_id: '7', title: 'Gmail手動取込', instruction: '非機密テストMessage単位に手動/取込ラベルを付け、メニューから1件だけ前処理します。手動/除外が最優先です。' }
      ]
    );
    ensureSafePromptMetadata(spreadsheet, nowValue);
    return {
      settings: settingsResult,
      settings_protection: settingsProtection
    };
  }

  /**
   * Refresh only the internal version values of an already-created v2
   * environment. This is deliberately separate from seed insertion so a
   * completed S40/S99 environment can move to a newer code release without
   * resetting Setup stages or touching user-owned settings and Task rows.
   */
  function refreshVersionMetadata(spreadsheet) {
    var sheet = spreadsheet.getSheetByName(
      WorkOsConfig.SHEETS.SYSTEM_CONFIG
    );
    if (!sheet) {
      throw new WorkOsAppError(
        'E_SCHEMA_MISSING_SHEET',
        'SETUP_VERSION_REFRESH',
        false,
        'システム設定Sheetがないためversion metadataを更新できません。'
      );
    }
    var expectedIds = WorkOsSchemas.getInternalIds(
      WorkOsConfig.SHEETS.SYSTEM_CONFIG
    );
    if (sheet.getMaxColumns() !== expectedIds.length) {
      throw new WorkOsAppError(
        'E_SCHEMA_CONFLICT',
        'SETUP_VERSION_REFRESH',
        false,
        'システム設定Sheetの列数がv2 Schemaと一致しません。'
      );
    }
    var actualIds = sheet.getRange(
      WorkOsConfig.HEADER_ID_ROW,
      1,
      1,
      expectedIds.length
    ).getValues()[0];
    if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
      throw new WorkOsAppError(
        'E_SCHEMA_MISSING_COLUMN',
        'SETUP_VERSION_REFRESH',
        false,
        'システム設定Sheetの内部列IDがv2 Schemaと一致しません。'
      );
    }
    var map = WorkOsSchemas.buildColumnMapFromIds(actualIds);
    var rowCount = Math.max(
      0,
      sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
    );
    var values = rowCount
      ? sheet.getRange(
        WorkOsConfig.DATA_START_ROW,
        1,
        rowCount,
        expectedIds.length
      ).getValues()
      : [];
    var targets = {
      code_version: WorkOsConfig.CODE_VERSION,
      schema_version: WorkOsConfig.SCHEMA_VERSION,
      migration_version: WorkOsConfig.MIGRATION_VERSION
    };
    var rowsByKey = {};
    values.forEach(function (row, index) {
      var key = String(row[map.config_key] || '');
      if (Object.prototype.hasOwnProperty.call(targets, key)) {
        if (Object.prototype.hasOwnProperty.call(rowsByKey, key)) {
          throw new WorkOsAppError(
            'E_SETUP_STATE_CONFLICT',
            'SETUP_VERSION_REFRESH',
            false,
            'version metadataの行が重複しています。'
          );
        }
        rowsByKey[key] = {
          row: WorkOsConfig.DATA_START_ROW + index,
          values: row
        };
      }
    });
    var missing = Object.keys(targets).filter(function (key) {
      return !rowsByKey[key];
    });
    if (missing.length) {
      throw new WorkOsAppError(
        'E_SETUP_STATE_CONFLICT',
        'SETUP_VERSION_REFRESH',
        false,
        'version metadataの必須行が不足しています。'
      );
    }
    var changedKeys = [];
    var timestamp = null;
    Object.keys(targets).forEach(function (key) {
      var entry = rowsByKey[key];
      var currentValue = String(entry.values[map.config_value] || '');
      var currentType = String(entry.values[map.value_type] || '');
      if (currentValue === targets[key] && currentType === 'STRING') {
        return;
      }
      if (!timestamp) {
        timestamp = WorkOsUtilities.now();
      }
      var updated = entry.values.slice();
      updated[map.config_value] = targets[key];
      updated[map.value_type] = 'STRING';
      updated[map.updated_at] = timestamp;
      sheet.getRange(
        entry.row,
        1,
        1,
        expectedIds.length
      ).setValues([updated]);
      changedKeys.push(key);
    });
    return {
      changed: changedKeys.length > 0,
      changed_keys: changedKeys
    };
  }

  function applyVisibility(spreadsheet) {
    WorkOsHiddenSheets.forEach(function (sheetName) {
      var sheet = spreadsheet.getSheetByName(sheetName);
      if (sheet && !sheet.isSheetHidden()) {
        sheet.hideSheet();
      }
    });
    var dashboard = spreadsheet.getSheetByName(WorkOsConfig.SHEETS.DASHBOARD);
    if (dashboard && dashboard.isSheetHidden()) {
      dashboard.showSheet();
    }
    spreadsheet.setActiveSheet(dashboard);
  }

  return Object.freeze({
    isSheetLogicallyEmpty: isSheetLogicallyEmpty,
    ensureSheets: ensureSheets,
    applyAllSchemas: applyAllSchemas,
    applyValidationsAndFormats: applyValidationsAndFormats,
    refreshValidationsAndProtections:
      refreshValidationsAndProtections,
    seedSafeSettings: seedSafeSettings,
    upsertSafeSettings: upsertSafeSettings,
    applySettingsProtection: applySettingsProtection,
    ensureSafePromptMetadata: ensureSafePromptMetadata,
    refreshVersionMetadata: refreshVersionMetadata,
    applyVisibility: applyVisibility,
    initialRowsForSheet: initialRowsForSheet
  });
}());
