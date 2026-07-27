/**
 * Setup-only Sheet construction. Runtime modules must not call this object.
 */
var WorkOsSheetBuilder = (function () {
  var PROTECTION_PREFIX = 'WORK_OS_V2_PHASE1_';
  var SYSTEM_OWNED_SHEETS = Object.freeze({
    '繝繝・す繝･繝懊・繝・: true,
    '蜃ｦ逅・ｱ･豁ｴ': true,
    '菴ｿ縺・婿': true,
    '繧ｨ繝ｩ繝ｼ繝ｻ蜀榊ｮ溯｡・: true
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
        sheetName + '縺ｮ譌｢蟄牢chema縺計2莉墓ｧ倥→荳閾ｴ縺励↑縺・◆繧∝●豁｢縺励∪縺励◆縲・
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
        'Protection險ｭ螳壹↓蠢・ｦ√↑螳溯｡瑚・ュ蝣ｱ繧堤｢ｺ隱阪〒縺阪∪縺帙ｓ縲・
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
    if (!headerProtection) {
      headerProtection = sheet.getRange(1, 1, 1, schema.length)
        .protect()
        .setDescription(headerDescription);
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
          '蠢・・heet縺後≠繧翫∪縺帙ｓ: ' + sheetName
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
          sheetName + '縺ｮsystem key縺碁㍾隍・＠縺ｦ縺・∪縺吶・
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
      ['timezone', '繧ｿ繧､繝繧ｾ繝ｼ繝ｳ', WorkOsConfig.TIMEZONE, 'STRING', WorkOsConfig.TIMEZONE, '蝗ｺ螳壹よ律莉倩ｨ育ｮ怜渕貅・, false],
      ['automation_enabled', '閾ｪ蜍募・逅・・蛻晄悄蛟､', false, 'BOOLEAN', 'false', '蝗ｺ螳壹ら樟蝨ｨ迥ｶ諷九・Dashboard縺ｨ譏守､ｺmenu縺ｧ遒ｺ隱・, false],
      ['ai_provider', 'Local AI Provider', WorkOsConfig.AI_PROVIDER, 'STRING', 'MOCK', '蝗ｺ螳壹ょｮ蘖rovider縺ｯ譛ｪ豎ｺ螳壹〒Settings縺ｸcredential繧剃ｿ晏ｭ倥＠縺ｪ縺・, false],
      ['manual_max_messages', '謇句虚譛螟ｧ繝｡繝・そ繝ｼ繧ｸ謨ｰ', WorkOsConfig.MANUAL_MAX_MESSAGES, 'INTEGER', '1', '蝗ｺ螳壹よ焔蜍戊ｩｦ鬨薙・1蝗・莉ｶ', false],
      ['auto_max_messages', '閾ｪ蜍墓怙螟ｧ繝｡繝・そ繝ｼ繧ｸ謨ｰ', WorkOsConfig.AUTOMATION_MAX_MESSAGES_PER_RUN, 'INTEGER', '1..10', 'Runtime縺・ run縺ｫ蜃ｦ逅・☆繧倶ｸ企剞', true],
      ['manual_soft_limit_sec', '謇句虚soft limit遘・, WorkOsConfig.MANUAL_WORKER_SOFT_LIMIT_MS / 1000, 'INTEGER', '30..120', 'Runtime縺ｮ謇句虚Worker budget', true],
      ['auto_soft_limit_sec', '閾ｪ蜍不oft limit遘・, WorkOsConfig.AUTOMATION_WORKER_SOFT_LIMIT_MS / 1000, 'INTEGER', '60..210', 'Runtime縺ｮ閾ｪ蜍標orker budget', true],
      ['lock_wait_ms', 'Lock蠕・ｩ殞s', WorkOsConfig.LOCK_WAIT_MS, 'INTEGER', String(WorkOsConfig.LOCK_WAIT_MS), '蝗ｺ螳壹ゅさ繝ｼ繝牙ｮ牙・蠅・阜', false],
      ['max_actions_per_message', '譛螟ｧAction謨ｰ', WorkOsConfig.MAX_AI_ACTIONS, 'INTEGER', String(WorkOsConfig.MAX_AI_ACTIONS), '蝗ｺ螳壹・I Schema螳牙・蠅・阜', false],
      ['deadline_calendar_name', '蟆ら畑Calendar蜷・, WorkOsConfig.DEADLINE_CALENDAR_NAME, 'STRING', WorkOsConfig.DEADLINE_CALENDAR_NAME, '蝗ｺ螳壹４etup縺ｧ蟆ら畑secondary Calendar繧剃ｽ懈・', false]
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
          '險ｭ螳售heet縺ｮsetting_key縺碁㍾隍・＠縺ｦ縺・∪縺吶・
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
          note: '蛻晄悄蛛懈ｭ｢縲よ・遉ｺ譖ｴ譁ｰ蠕後↓迴ｾ蝨ｨ迥ｶ諷九ｒ陦ｨ遉ｺ縺励∪縺吶・
        },
        {
          metric_key: 'SYSTEM_HEALTH',
          metric_value: '譛ｪ譖ｴ譁ｰ',
          note: '繝｡繝九Η繝ｼ縺九ｉ驕狗畑Dashboard繧呈峩譁ｰ縺励※縺上□縺輔＞縲・
        },
        {
          metric_key: 'QUICK_DIAGNOSTIC',
          metric_value: 'NOT_EXECUTED',
          note: 'Dashboard譛ｪ譖ｴ譁ｰ'
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
        { step_id: '1', title: '蛻晄悄繧ｻ繝・ヨ繧｢繝・・', instruction: '繝｡繝九Η繝ｼ縺ｮ隱ｬ譏弱ｒ遒ｺ隱阪＠縺ｦ螳溯｡後＠縺ｾ縺吶４heet/Protection縲∵ｭ｣蠑秀mail繝ｩ繝吶Ν縲∝ｰら畑secondary Calendar縲∵園譛芽・dit Trigger繧呈ｮｵ髫惹ｽ懈・縺励∪縺吶よ里蟄倥ョ繝ｼ繧ｿ縺ｮMigration繝ｻ蜑企勁縺ｯ陦後＞縺ｾ縺帙ｓ縲・ },
        { step_id: '2', title: '閾ｪ蜍募・逅・・蛻晄悄迥ｶ諷・, instruction: '騾壼ｸｸInbox蜃ｦ逅・∝ｮ蘗I謗･邯壹・蛻・rigger縺ｯSetup縺九ｉ髢句ｧ九＠縺ｾ縺帙ｓ縲ょ､夜Κ蛻､譁ｭ縺ｨ蜈ｨGate騾夐℃蠕後↓縺縺代√Γ繝九Η繝ｼ縺九ｉ譏守､ｺ逧・↓譛牙柑蛹悶＠縺ｾ縺吶・ },
        { step_id: '3', title: 'Task縺ｮ譌･蟶ｸ謫堺ｽ・, instruction: '譌･蟶ｸ謫堺ｽ懊・繧ｿ繧ｹ繧ｯ荳隕ｧ縺縺代〒陦後＞縺ｾ縺吶る壼ｸｸ縺ｮ邱ｨ髮・・謇譛芽・nstallable edit Trigger縺瑚・蜍募渚譏縺励∝撫鬘梧凾縺縺第焔蜍蒜allback繧剃ｽｿ縺・∪縺吶・ },
        { step_id: '4', title: '隕∫｢ｺ隱・, instruction: '隕∫｢ｺ隱阪∫｢ｺ隱咲憾諷九∝愛譁ｭ繧偵ち繧ｹ繧ｯ荳隕ｧ縺ｧ遒ｺ隱阪＠縺ｾ縺吶ょｰら畑縺ｮ隕∫｢ｺ隱阪ち繝悶・縺ゅｊ縺ｾ縺帙ｓ縲・ },
        { step_id: '5', title: '驕狗畑Dashboard', instruction: '繝｡繝九Η繝ｼ縺九ｉ譏守､ｺ譖ｴ譁ｰ縺励∪縺吶ゆｻｶ謨ｰ縺ｨ螳牙・縺ｪ迥ｶ諷九□縺代ｒ陦ｨ遉ｺ縺励√Γ繝ｼ繝ｫ譛ｬ譁・ゝask蜷阪∝､夜ΚID縺ｯ陦ｨ遉ｺ縺励∪縺帙ｓ縲・ },
        { step_id: '6', title: 'Diagnostic縺ｨ蜀榊ｮ溯｡・, instruction: 'Quick Diagnostic縺ｯ隱ｭ蜿門ｰら畑縺ｧ縺吶ゅお繝ｩ繝ｼ繝ｻ蜀榊ｮ溯｡後〒縺ｯ蜴溷屏繧定ｧ｣豸医＠縺ｦ縺九ｉ驕ｸ謚槭＠縺櫂ead Letter縺縺代ｒ蜀榊ｮ溯｡御ｺ育ｴ・＠縺ｾ縺吶・ },
        { step_id: '7', title: 'Gmail謇句虚蜿冶ｾｼ', instruction: '髱樊ｩ溷ｯ・ユ繧ｹ繝・essage蜊倅ｽ阪↓謇句虚/蜿冶ｾｼ繝ｩ繝吶Ν繧剃ｻ倥￠縲√Γ繝九Η繝ｼ縺九ｉ1莉ｶ縺縺大燕蜃ｦ逅・＠縺ｾ縺吶よ焔蜍・髯､螟悶′譛蜆ｪ蜈医〒縺吶・ }
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
        '繧ｷ繧ｹ繝・Β險ｭ螳售heet縺後↑縺・◆繧」ersion metadata繧呈峩譁ｰ縺ｧ縺阪∪縺帙ｓ縲・
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
        '繧ｷ繧ｹ繝・Β險ｭ螳售heet縺ｮ蛻玲焚縺計2 Schema縺ｨ荳閾ｴ縺励∪縺帙ｓ縲・
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
        '繧ｷ繧ｹ繝・Β險ｭ螳售heet縺ｮ蜀・Κ蛻悠D縺計2 Schema縺ｨ荳閾ｴ縺励∪縺帙ｓ縲・
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
            'version metadata縺ｮ陦後′驥崎､・＠縺ｦ縺・∪縺吶・
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
        'version metadata縺ｮ蠢・郁｡後′荳崎ｶｳ縺励※縺・∪縺吶・
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
    seedSafeSettings: seedSafeSettings,
    upsertSafeSettings: upsertSafeSettings,
    applySettingsProtection: applySettingsProtection,
    ensureSafePromptMetadata: ensureSafePromptMetadata,
    refreshVersionMetadata: refreshVersionMetadata,
    applyVisibility: applyVisibility,
    initialRowsForSheet: initialRowsForSheet
  });
}());

