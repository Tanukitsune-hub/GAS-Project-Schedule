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
          : 'Mock AIのローカル準備状態を確認できません。',
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
          ? 'Mock AI moduleを利用できません。'
          : 'TEST_MODE=falseのためMock AIは無効です。',
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
        : '実Providerの設定または登録が未完了です。',
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
        : 'Production AIの社内・データ・credential保管承認が未確認です。',
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
        : 'Production AIの認証またはopaque credential参照が未設定です。',
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
        'Quick Diagnosticの安全な実行予算に達しました。'
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
      comparison.idsMatch ? '' : 'タスク一覧の内部列IDが一致しません。'
    ));
    checks.push(check(
      'TASK_SCHEMA_HEADERS',
      comparison.headersMatch ? 'PASS' : 'FAIL',
      comparison.headersMatch ? '' : 'タスク一覧の見出しが一致しません。'
    ));

    var context;
    try {
      context = WorkOsTaskRepository.createContext(sheet);
      checks.push(check('TASK_COLUMN_MAP', 'PASS', ''));
    } catch (error) {
      checks.push(check('TASK_COLUMN_MAP', 'FAIL', 'Column Mapを構築できません。'));
      return;
    }
    try {
      var authority = WorkOsTaskRepository.validateAllTaskAuthorities(sheet, {
        mode: 'QUICK_DIAGNOSTIC',
        recover_prepared: false,
        recover_relocated: false,
        quarantine_invalid: false,
        mark_orphaned: false
      });
      var authorityFailures = authority.rows.filter(function (item) {
        return item.status !== 'VALID';
      });
      checks.push(check(
        'TASK_AUTHORITY_VALIDATOR',
        authorityFailures.length ? 'FAIL' : 'PASS',
        authorityFailures.length
          ? 'Task authority requires recovery or quarantine; no snapshot fallback was used.'
          : '',
        {
          counts: authority.counts,
          invalid_row_count: authorityFailures.length,
          validator: 'WorkOsTaskRepository.validateAuthority'
        }
      ));
    } catch (authorityError) {
      checks.push(check(
        'TASK_AUTHORITY_VALIDATOR',
        'FAIL',
        'Task authority validator could not verify the protected ledger.',
        {
          error_code: WorkOsUtilities.safeError(
            authorityError,
            'DIAGNOSTIC'
          ).code,
          validator: 'WorkOsTaskRepository.validateAuthority'
        }
      ));
    }

    var dataRowCount = sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1;
    var validationFailures = [];
    var formatFailures = [];
    var validationPlan = WorkOsSchemas.validationPlanForSheet(
      WorkOsConfig.SHEETS.TASKS
    );
    var checkboxColumnIndexes = validationPlan.filter(function (planItem) {
      return planItem.validation === 'CHECKBOX';
    }).map(function (planItem) {
      return planItem.columnIndex - 1;
    });
    var canonicalCheckboxValidationByRow = {};
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
        var physicalRow = WorkOsConfig.DATA_START_ROW + chunkOffset + rowIndex;
        canonicalCheckboxValidationByRow[physicalRow] = {};
        schema.forEach(function (item, index) {
          var rule = rowRules[index];
          var planItem = validationPlan[index];
          if (planItem.validation === 'CHECKBOX') {
            if (!criteriaEquals(
              rule,
              SpreadsheetApp.DataValidationCriteria.CHECKBOX
            )) {
              validationFailures.push(
                item.id + '@' +
                physicalRow +
                ': checkbox missing'
              );
            } else {
              canonicalCheckboxValidationByRow[physicalRow][index] = true;
            }
          } else if (criteriaEquals(rule, SpreadsheetApp.DataValidationCriteria.CHECKBOX)) {
            validationFailures.push(
              item.id + '@' +
              physicalRow +
              ': unexpected checkbox'
            );
          }
          if (item.validation === 'ENUM') {
            if (!criteriaEquals(rule, SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST)) {
              validationFailures.push(
                item.id + '@' +
                physicalRow +
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
      validationFailures.length ? '入力規則の型が一致しません。' : '',
      { failures: validationFailures.slice(0, 50), failure_count: validationFailures.length }
    ));

    checks.push(check(
      'TASK_DATE_FORMATS',
      formatFailures.length ? 'FAIL' : 'PASS',
      formatFailures.length ? '日付表示形式が一致しません。' : '',
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
      managementColumnFailures.length ? '管理列が非表示ではありません。' : '',
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
          geometry: WorkOsSchemas.headerProtectionGeometryForSheet(
            WorkOsConfig.SHEETS.TASKS
          )
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
        var actualMatches = protections.filter(function (protection) {
          return protection.getDescription() === expected.description;
        });
        var actual = actualMatches[0];
        return actualMatches.length !== 1 ||
          !actual ||
          !protectionAccessIsRestricted(actual) ||
          JSON.stringify(rangeGeometry(actual.getRange())) !==
            JSON.stringify(expected.geometry);
      }).map(function (expected) {
        return expected.description;
      });
      checks.push(check(
        'TASK_PROTECTIONS',
        protectionFailures.length ? 'FAIL' : 'PASS',
        protectionFailures.length ? 'Task管理範囲の保護が不足しています。' : '',
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
        taskPolicyValid ? '' : 'Task列の編集可否Protectionが仕様と一致しません。',
        {
          expected_editable_ranges: expectedEditableRanges,
          actual_editable_ranges: actualEditableRanges
        }
      ));
    }

    var blankRowFailures = [];
    context.values.forEach(function (row, index) {
      var taskId = row[context.columnMap.task_id];
      var originKey = row[context.columnMap.origin_key];
      if (!WorkOsUtilities.isBlank(taskId) || !WorkOsUtilities.isBlank(originKey)) {
        return;
      }
      var physicalRow = WorkOsConfig.DATA_START_ROW + index;
      var canonicalCheckboxes = canonicalCheckboxValidationByRow[physicalRow] || {};
      schema.forEach(function (item, columnIndex) {
        var value = row[columnIndex];
        if (WorkOsUtilities.isBlank(value)) {
          return;
        }
        if (value === false &&
            checkboxColumnIndexes.indexOf(columnIndex) !== -1 &&
            canonicalCheckboxes[columnIndex] === true) {
          return;
        }
        blankRowFailures.push({
          row: physicalRow,
          column: item.id,
          reason: value === true
            ? 'BOOLEAN_TRUE_ON_IDENTITY_EMPTY_ROW'
            : (value === false
              ? 'NONCANONICAL_BOOLEAN_FALSE_ON_IDENTITY_EMPTY_ROW'
              : 'CONTENT_ON_IDENTITY_EMPTY_ROW')
        });
      });
    });
    checks.push(check(
      'BLANK_ROW_BOOLEAN_VALUES',
      blankRowFailures.length ? 'FAIL' : 'PASS',
      blankRowFailures.length
        ? '論理空行にcanonical checkbox false以外の値があります。'
        : '',
      {
        rows: blankRowFailures.map(function (item) {
          return item.row;
        }).filter(function (row, index, rows) {
          return rows.indexOf(row) === index;
        }).slice(0, 20),
        failures: blankRowFailures.slice(0, 50),
        failure_count: blankRowFailures.length
      }
    ));

    checks.push(check(
      'TASK_PRIMARY_KEY_DUPLICATES',
      context.duplicateTaskIds.length || context.duplicateOriginKeys.length ? 'FAIL' : 'PASS',
      context.duplicateTaskIds.length || context.duplicateOriginKeys.length
        ? 'Task主キーに重複があります。'
        : '',
      {
        task_id_duplicates: context.duplicateTaskIds,
        origin_key_duplicates: context.duplicateOriginKeys
      }
    ));
    // Authority validation intentionally removes untrusted rows from
    // context.logicalRows.  Completeness is a physical raw-row invariant,
    // however: a partial identity must remain visible to a read-only
    // diagnostic even when the authority validator quarantines it.
    var incompleteKeyRows = context.values.map(function (row, rowIndex) {
      var taskId = row[context.columnMap.task_id];
      var originKey = row[context.columnMap.origin_key];
      var taskIdBlank = WorkOsUtilities.isBlank(taskId);
      var originKeyBlank = WorkOsUtilities.isBlank(originKey);
      return taskIdBlank === originKeyBlank
        ? null
        : WorkOsConfig.DATA_START_ROW + rowIndex;
    }).filter(function (physicalRow) {
      return physicalRow != null;
    });
    checks.push(check(
      'TASK_PRIMARY_KEY_COMPLETENESS',
      incompleteKeyRows.length ? 'FAIL' : 'PASS',
      incompleteKeyRows.length ? 'Task行の必須主キーが不足しています。' : '',
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
        ? 'Task状態のfield間整合性に問題があります。'
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
        : sheetName + 'のSchemaが一致しません。',
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
        enforced ? '' : sheetName + 'の管理Sheet保護が不足しています。',
        { sheet_name: sheetName }
      ));
    }
  }

  function scanLogicalRows(
    spreadsheet,
    sheetName,
    primaryId,
    budget,
    rowLimit,
    visitor
  ) {
    assertBudgetAvailable(budget);
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      throw new WorkOsAppError(
        'E_SCHEMA_MISSING_SHEET',
        'DIAGNOSTIC',
        false,
        'Recovery診断に必要なSheetがありません。'
      );
    }
    var ids = WorkOsSchemas.getInternalIds(sheetName);
    if (sheet.getMaxColumns() !== ids.length) {
      throw new WorkOsAppError(
        'E_SCHEMA_CONFLICT',
        'DIAGNOSTIC',
        false,
        'Recovery診断対象Sheetの列数が一致しません。'
      );
    }
    var actualIds = sheet.getRange(1, 1, 1, ids.length).getValues()[0];
    if (JSON.stringify(actualIds) !== JSON.stringify(ids)) {
      throw new WorkOsAppError(
        'E_SCHEMA_MISSING_COLUMN',
        'DIAGNOSTIC',
        false,
        'Recovery診断対象Sheetの内部列IDが一致しません。'
      );
    }
    var map = WorkOsSchemas.buildColumnMapFromIds(ids);
    var availableRows = Math.max(
      0,
      sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
    );
    var scanRows = rowLimit == null
      ? availableRows
      : Math.min(availableRows, Math.max(0, Number(rowLimit || 0)));
    var logicalCount = 0;
    var chunkSize = WorkOsConfig.QUICK_DIAGNOSTIC_CHUNK_ROWS;
    for (var offset = 0; offset < scanRows; offset += chunkSize) {
      assertBudgetAvailable(budget);
      var chunkLength = Math.min(chunkSize, scanRows - offset);
      var rows = sheet.getRange(
        WorkOsConfig.DATA_START_ROW + offset,
        1,
        chunkLength,
        ids.length
      ).getValues();
      rows.forEach(function (row) {
        if (WorkOsUtilities.isBlank(row[map[primaryId]])) {
          return;
        }
        var record = {};
        ids.forEach(function (id) {
          record[id] = row[map[id]];
        });
        logicalCount += 1;
        visitor(record);
      });
    }
    return {
      physical_rows_scanned: scanRows,
      logical_rows_scanned: logicalCount
    };
  }

  function inspectRecoveryState(spreadsheet, budget, nowValue, options) {
    assertBudgetAvailable(budget);
    var settings = options || {};
    var rowLimit = settings.row_limit == null
      ? null
      : Math.max(0, Number(settings.row_limit || 0));
    var timestamp = nowValue instanceof Date
      ? nowValue
      : WorkOsUtilities.now();
    var messageCounts = {
      stale_claim_count: 0,
      due_retry_count: 0,
      dead_message_count: 0,
      checkpoint_count: 0
    };
    var messageScan = scanLogicalRows(
      spreadsheet,
      WorkOsConfig.SHEETS.MESSAGE_STATE,
      'message_id',
      budget,
      rowLimit,
      function (record) {
        if (record.processing_status ===
            WorkOsMessageStateRepository.STATUSES.CLAIMED &&
            WorkOsMessageStateRepository.isStaleClaim(record, timestamp)) {
          messageCounts.stale_claim_count += 1;
        }
        if (record.processing_status ===
            WorkOsMessageStateRepository.STATUSES.RETRY &&
            (!(record.next_retry_at instanceof Date) ||
             record.next_retry_at.getTime() <= timestamp.getTime())) {
          messageCounts.due_retry_count += 1;
        }
        if (record.processing_status ===
            WorkOsMessageStateRepository.STATUSES.DEAD) {
          messageCounts.dead_message_count += 1;
        }
        if ([
          WorkOsMessageStateRepository.STATUSES.CLAIMED,
          WorkOsMessageStateRepository.STATUSES.PREPROCESSED,
          WorkOsMessageStateRepository.STATUSES.CLASSIFIED,
          WorkOsMessageStateRepository.STATUSES.TASKS_WRITTEN,
          WorkOsMessageStateRepository.STATUSES.CALENDAR_PENDING
        ].indexOf(record.processing_status) !== -1) {
          messageCounts.checkpoint_count += 1;
        }
      }
    );
    var outboxCounts = {
      pending_count: 0,
      retry_count: 0,
      due_retry_count: 0,
      dead_count: 0
    };
    var outboxScan = scanLogicalRows(
      spreadsheet,
      WorkOsConfig.SHEETS.SYNC_STATE,
      'sync_id',
      budget,
      rowLimit,
      function (record) {
        if (record.status === 'PENDING') {
          outboxCounts.pending_count += 1;
        } else if (record.status === 'RETRY') {
          outboxCounts.retry_count += 1;
          if (!(record.next_retry_at instanceof Date) ||
              record.next_retry_at.getTime() <= timestamp.getTime()) {
            outboxCounts.due_retry_count += 1;
          }
        } else if (record.status === 'DEAD') {
          outboxCounts.dead_count += 1;
        }
      }
    );
    var errorCounts = WorkOsLogAndDeadLetter.operationalCounts(
      spreadsheet,
      timestamp,
      budget,
      null,
      { row_limit: rowLimit }
    );
    var props = PropertiesService.getScriptProperties();
    var providerSuppression =
      WorkOsLogAndDeadLetter.providerSuppressionStatus(
        props,
        timestamp
      );
    return {
      messages: messageCounts,
      errors: errorCounts,
      calendar_outbox: outboxCounts,
      provider_suppression: {
        active: providerSuppression.active === true,
        invalid_state: providerSuppression.invalid_state === true,
        until_present: Boolean(providerSuppression.until)
      },
      scan: {
        row_limit: rowLimit,
        message_state: messageScan,
        calendar_outbox: outboxScan
      }
    };
  }

  function runQuickDiagnostic(spreadsheet, options) {
    var startedAt = Date.now();
    var settings = options || {};
    var budget = settings.budget ||
      WorkOsUtilities.createSoftBudget(
        WorkOsConfig.QUICK_DIAGNOSTIC_TARGET_MS,
        startedAt
      );
    var target = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
    var checks = [];
    if (!target) {
      return {
        status: 'FAIL',
        code_version: WorkOsConfig.CODE_VERSION,
        schema_version: WorkOsConfig.SCHEMA_VERSION,
        duration_ms: Date.now() - startedAt,
        checks: [check('BOUND_SPREADSHEET', 'FAIL', 'Bound Spreadsheetがありません。')]
      };
    }

    for (var sheetIndex = 0; sheetIndex < WorkOsSheetOrder.length; sheetIndex += 1) {
      if (budget.isExhausted(WorkOsConfig.QUICK_DIAGNOSTIC_RESERVE_MS)) {
        checks.push(check(
          'QUICK_DIAGNOSTIC_BUDGET',
          'FAIL',
          '実行予算に達したため未検査のSheetを残して安全に停止しました。',
          { remaining_sheet_count: WorkOsSheetOrder.length - sheetIndex }
        ));
        break;
      }
      var sheetName = WorkOsSheetOrder[sheetIndex];
      var sheet = target.getSheetByName(sheetName);
      if (!sheet) {
        checks.push(check('SHEET_' + WorkOsUtilities.sha256Hex(sheetName).slice(0, 8), 'FAIL', '必須Sheetがありません。', {
          sheet_name: sheetName
        }));
        continue;
      }
      var minimumRows = WorkOsSheetBuilder.initialRowsForSheet(sheetName);
      var rowCount = sheet.getMaxRows();
      var columnCount = sheet.getMaxColumns();
      var expectedColumns = WorkOsSchemas.getSheetSchema(sheetName).length;
      var rowCountValid = rowCount >= minimumRows &&
        (rowCount - minimumRows) % WorkOsConfig.ROW_EXPANSION_UNIT === 0;
      checks.push(check(
        'ROWS_' + WorkOsUtilities.sha256Hex(sheetName).slice(0, 8),
        rowCountValid ? 'PASS' : 'FAIL',
        rowCountValid ? '' : '行数が初期値または100行単位の拡張と一致しません。',
        {
          sheet_name: sheetName,
          rows: rowCount,
          minimum_rows: minimumRows,
          expansion_unit: WorkOsConfig.ROW_EXPANSION_UNIT
        }
      ));
      checks.push(check(
        'COLUMNS_' + WorkOsUtilities.sha256Hex(sheetName).slice(0, 8),
        columnCount === expectedColumns ? 'PASS' : 'FAIL',
        columnCount === expectedColumns ? '' : '列数がv2 Schemaと一致しません。',
        {
          sheet_name: sheetName,
          columns: columnCount,
          expected_columns: expectedColumns
        }
      ));
      if (rowCount < WorkOsConfig.DATA_START_ROW || columnCount < expectedColumns) {
        checks.push(check(
          'READABLE_' + WorkOsUtilities.sha256Hex(sheetName).slice(0, 8),
          'FAIL',
          'Gridが小さすぎるためSchema検査を安全に継続できません。',
          { sheet_name: sheetName }
        ));
      } else {
        try {
          if (sheetName === WorkOsConfig.SHEETS.TASKS) {
            validateTaskSheet(sheet, checks, budget);
          } else {
            validateSheetSchema(sheet, sheetName, checks, budget);
            if (sheetName === WorkOsConfig.SHEETS.DASHBOARD &&
                typeof WorkOsDashboard !== 'undefined' &&
                WorkOsDashboard &&
                typeof WorkOsDashboard.inspectLayout === 'function') {
              try {
                var dashboardLayout =
                  WorkOsDashboard.inspectLayout(target);
                var dashboardLayoutStatus =
                  dashboardLayout.status === 'OWNED'
                    ? 'PASS'
                    : (dashboardLayout.writable ? 'WARN' : 'FAIL');
                checks.push(check(
                  'DASHBOARD_LAYOUT_OWNERSHIP',
                  dashboardLayoutStatus,
                  dashboardLayoutStatus === 'PASS'
                    ? ''
                    : (dashboardLayoutStatus === 'WARN'
                      ? 'Dashboard system blockは次回の明示更新で安全に所有markerを設定できます。'
                      : 'Dashboardに安全なsystem blockを確保できません。'),
                  {
                    layout_status: dashboardLayout.status,
                    writable: dashboardLayout.writable === true,
                    external_services_called: false,
                    repair_performed: false
                  }
                ));
              } catch (dashboardLayoutError) {
                checks.push(check(
                  'DASHBOARD_LAYOUT_OWNERSHIP',
                  'FAIL',
                  'Dashboard layout conflictを検出しました。修復や更新は行っていません。',
                  {
                    error_code: WorkOsUtilities.safeError(
                      dashboardLayoutError,
                      'DIAGNOSTIC'
                    ).code,
                    conflict_reason_code: String(
                      dashboardLayoutError &&
                      dashboardLayoutError.dashboard_conflict_reason ||
                      'UNSAFE_DASHBOARD_SURFACE'
                    ),
                    external_services_called: false,
                    repair_performed: false
                  }
                ));
              }
            }
          }
        } catch (error) {
          var budgetError = error instanceof WorkOsAppError &&
            error.code === 'E_DIAGNOSTIC_BUDGET';
          checks.push(check(
            budgetError
              ? 'QUICK_DIAGNOSTIC_BUDGET'
              : 'VALIDATION_ERROR_' + WorkOsUtilities.sha256Hex(sheetName).slice(0, 8),
            'FAIL',
            budgetError
              ? '実行予算に達したため現在の検査を安全に停止しました。'
              : 'Sheet検査中に安全に処理できない構成を検出しました。',
            {
              sheet_name: sheetName,
              error_code: WorkOsUtilities.safeError(
                error,
                'DIAGNOSTIC'
              ).code
            }
          ));
          if (budgetError) {
            break;
          }
        }
      }
      var expectedHidden = WorkOsHiddenSheets.indexOf(sheetName) !== -1;
      checks.push(check(
        'VISIBILITY_' + WorkOsUtilities.sha256Hex(sheetName).slice(0, 8),
        sheet.isSheetHidden() === expectedHidden ? 'PASS' : 'FAIL',
        sheet.isSheetHidden() === expectedHidden ? '' : 'Sheet表示状態が仕様と一致しません。',
        { sheet_name: sheetName, expected_hidden: expectedHidden }
      ));
    }

    var props = PropertiesService.getScriptProperties();
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
        : 'Setup Propertiesが未完了かinstance形式が不正です。',
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
          ? '完了済みv2環境のversion metadataにdriftがあります。Setupを再実行してください。'
          : 'S70未実行のためversion Propertiesは未確定です。'),
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
        : 'Task編集Triggerが未作成または不整合です。Setupを再実行してください。',
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
        : 'Automation Trigger状態を確認できないか不整合です。修復は行っていません。',
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
        : 'Google Workspace Trigger一覧を確認できませんでした。',
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
        ? '管理列の直接編集履歴があります。エラー・再実行を確認してください。'
        : '',
      managementEditDetails
    ));
    checks.push(check(
      'GMAIL_MANUAL_POLICY',
      WorkOsConfig.MANUAL_GMAIL_QUERY ===
        'label:手動/取込 -label:手動/除外' &&
        WorkOsConfig.MANUAL_MAX_THREADS === 10 &&
        WorkOsConfig.MANUAL_MAX_MESSAGES === 1
        ? 'PASS'
        : 'FAIL',
      WorkOsConfig.MANUAL_GMAIL_QUERY ===
        'label:手動/取込 -label:手動/除外' &&
        WorkOsConfig.MANUAL_MAX_THREADS === 10 &&
        WorkOsConfig.MANUAL_MAX_MESSAGES === 1
        ? ''
        : 'Gmail手動取込の安全な上限またはqueryが一致しません。',
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
        : 'S60、専用Calendar ID、またはinstance propertyが未完了です。',
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
      'Google Workspace実Calendar到達性・非primary・所有権: NOT EXECUTED。手動受入で確認してください。',
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
      syncSchemaMatches ? '' : '同期状態のOutbox Schemaが一致しません。',
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
          ? '未解決Error、Dead Letter、またはstale claimがあります。'
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
          ? 'Provider抑制状態が不正です。修復は行っていません。'
          : (recoveryState.provider_suppression.active
            ? 'Provider一時障害の再試行抑制中です。'
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
          'Retry・Dead Letter状態を安全に検査できませんでした。',
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
        : 'S99は未完了です。Setup実行中のS90ではこの警告が想定されます。',
      {
        s99_recorded:
          completedForCalendar.indexOf('S99_COMPLETE') !== -1
      }
    ));

    var duration = Date.now() - startedAt;
    checks.push(check(
      'QUICK_DIAGNOSTIC_DURATION',
      duration <= WorkOsConfig.QUICK_DIAGNOSTIC_TARGET_MS ? 'PASS' : 'FAIL',
      duration <= WorkOsConfig.QUICK_DIAGNOSTIC_TARGET_MS ? '' : 'Quick Diagnosticが目標時間を超過しました。',
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
          'Setup段階のPropertiesを解析できません。'
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
        'Deep Diagnosticへの依存注入はTest modeだけで利用できます。'
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
          check('BOUND_SPREADSHEET', 'FAIL', 'Bound Spreadsheetがありません。')
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
      var taskSheet = target.getSheetByName(WorkOsConfig.SHEETS.TASKS);
      var authority = WorkOsTaskRepository.validateAllTaskAuthorities(
        taskSheet,
        {
          mode: 'DEEP_DIAGNOSTIC',
          recover_prepared: false,
          recover_relocated: false,
          quarantine_invalid: false,
          mark_orphaned: false
        }
      );
      var authorityFailures = authority.rows.filter(function (item) {
        return item.status !== 'VALID';
      });
      checks.push(check(
        'DEEP_TASK_AUTHORITY_VALIDATOR',
        authorityFailures.length ? 'FAIL' : 'PASS',
        authorityFailures.length
          ? 'Deep Diagnostic found non-operational Task authority rows.'
          : '',
        {
          counts: authority.counts,
          invalid_row_count: authorityFailures.length,
          validator: 'WorkOsTaskRepository.validateAuthority',
          repair: false
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
          ? 'Deep Diagnosticをsoft budgetで安全に停止しました。'
          : 'Deep Diagnosticで不整合を検出しました。',
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
