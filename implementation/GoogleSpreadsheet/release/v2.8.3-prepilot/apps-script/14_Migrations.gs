/**
 * v1 migration boundary plus explicit v2-only schema extensions.
 *
 * v1 -> v2 migration is deliberately unsupported. This module only exposes
 * independent version metadata and safe detection helpers for future v2 work.
 */
var WorkOsMigrations = (function () {
  function getVersionState() {
    return {
      code_version: WorkOsConfig.CODE_VERSION,
      schema_version: WorkOsConfig.SCHEMA_VERSION,
      migration_version: WorkOsConfig.MIGRATION_VERSION
    };
  }

  function isKnownV1SheetName(sheetName) {
    return WorkOsConfig.V1_SHEET_NAMES.indexOf(String(sheetName || '')) !== -1;
  }

  function assertNoV1Migration() {
    throw new WorkOsAppError(
      'E_V1_MIGRATION_UNSUPPORTED',
      'MIGRATION',
      false,
      'v1環境は自動変換できません。新しい空のSpreadsheetを使用してください。'
    );
  }

  function exactRow(values, expected) {
    return JSON.stringify(values) === JSON.stringify(expected);
  }

  function inspectV2ExtensionCandidate(spreadsheet) {
    var sheets = spreadsheet.getSheets();
    if (sheets.length !== WorkOsSheetOrder.length) {
      return { applicable: false, reason: 'SHEET_COUNT' };
    }
    var byName = {};
    sheets.forEach(function (sheet) {
      byName[sheet.getName()] = sheet;
    });
    if (WorkOsSheetOrder.some(function (name) { return !byName[name]; })) {
      return { applicable: false, reason: 'SHEET_NAMES' };
    }
    var messageName = WorkOsConfig.SHEETS.MESSAGE_STATE;
    var errorName = WorkOsConfig.SHEETS.ERRORS;
    var taskName = WorkOsConfig.SHEETS.TASKS;
    var legacyErrorColumnCount = 11;
    for (var index = 0; index < WorkOsSheetOrder.length; index += 1) {
      var sheetName = WorkOsSheetOrder[index];
      var sheet = byName[sheetName];
      var currentIds = WorkOsSchemas.getInternalIds(sheetName);
      var currentHeaders = WorkOsSchemas.getHeaders(sheetName);
      var width = sheet.getMaxColumns();
      var ids = sheet.getRange(1, 1, 1, width).getValues()[0];
      var headers = sheet.getRange(2, 1, 1, width).getValues()[0];
      if (sheetName === taskName &&
          width === currentIds.length - 1 &&
          exactRow(ids, currentIds.slice(0, -1)) &&
          exactRow(headers, currentHeaders.slice(0, -1))) {
        continue;
      }
      if (sheetName === messageName &&
          width === currentIds.length - 1 &&
          exactRow(ids, currentIds.slice(0, -1)) &&
          exactRow(headers, currentHeaders.slice(0, -1))) {
        continue;
      }
      if (sheetName === errorName &&
          width === currentIds.length - legacyErrorColumnCount &&
          exactRow(
            ids,
            currentIds.slice(0, -legacyErrorColumnCount)
          ) &&
          exactRow(
            headers,
            currentHeaders.slice(0, -legacyErrorColumnCount)
          )) {
        continue;
      }
      if (width !== currentIds.length ||
          !exactRow(ids, currentIds) ||
          !exactRow(headers, currentHeaders)) {
        return {
          applicable: false,
          reason: 'SCHEMA_MISMATCH',
          sheet_name: sheetName
        };
      }
    }
    var messageSheet = byName[messageName];
    var errorSheet = byName[errorName];
    var taskSheet = byName[taskName];
    return {
      applicable: true,
      task_sheet: taskSheet,
      message_sheet: messageSheet,
      error_sheet: errorSheet,
      task_legacy_width:
        taskSheet.getMaxColumns() ===
          WorkOsSchemas.getInternalIds(taskName).length - 1,
      legacy_width:
        messageSheet.getMaxColumns() ===
          WorkOsSchemas.getInternalIds(messageName).length - 1,
      error_legacy_width:
        errorSheet.getMaxColumns() ===
          WorkOsSchemas.getInternalIds(errorName).length -
            legacyErrorColumnCount,
      legacy_error_column_count: legacyErrorColumnCount
    };
  }

  function parseLegacyClassification(value) {
    var classification;
    try {
      classification = WorkOsUtilities.parseJson(value, 'object');
      WorkOsAiAdapter.validateOutput(classification);
    } catch (error) {
      throw new WorkOsAppError(
        'E_V2_EXTENSION_STATE_INVALID',
        'V2_SCHEMA_EXTENSION',
        false,
        '既存classificationを安全に検証できないためSchema拡張を停止しました。'
      );
    }
    return classification;
  }

  function assertExtensionBudget(budget) {
    if (budget && budget.isExhausted(
      WorkOsConfig.V2_EXTENSION_BUDGET_RESERVE_MS
    )) {
      throw new WorkOsAppError(
        'E_BUDGET_EXHAUSTED',
        'V2_SCHEMA_EXTENSION',
        true,
        'v2 Schema拡張を安全な境界で一時停止しました。'
      );
    }
  }

  function prepareMessageRowsForProvenance(sheet, legacyWidth, budget) {
    var sheetName = WorkOsConfig.SHEETS.MESSAGE_STATE;
    var currentIds = WorkOsSchemas.getInternalIds(sheetName);
    var sourceWidth = legacyWidth ? currentIds.length - 1 : currentIds.length;
    var sourceIds = currentIds.slice(0, sourceWidth);
    var map = WorkOsSchemas.buildColumnMapFromIds(sourceIds);
    var currentMap = WorkOsSchemas.buildColumnMapFromIds(currentIds);
    var rowCount = Math.max(
      0,
      sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
    );
    if (rowCount > WorkOsConfig.V2_EXTENSION_MAX_ROWS) {
      throw new WorkOsAppError(
        'E_V2_EXTENSION_TOO_LARGE',
        'V2_SCHEMA_EXTENSION',
        false,
        'Message Stateが安全なv2 Schema拡張上限を超えています。'
      );
    }
    var nowValue = WorkOsUtilities.now();
    var changedRows = [];
    function inspectSourceRow(sourceRow, physicalRow) {
      var messageId = String(sourceRow[map.message_id] || '');
      if (!messageId) {
        return;
      }
      var output = sourceRow.slice();
      while (output.length < currentIds.length) {
        output.push('');
      }
      var rowSchemaVersion = String(
        sourceRow[map.schema_version] || ''
      );
      if (rowSchemaVersion !== '2.0' &&
          rowSchemaVersion !== '2.1' &&
          rowSchemaVersion !== '2.2' &&
          rowSchemaVersion !== '2.3' &&
          rowSchemaVersion !== WorkOsConfig.SCHEMA_VERSION) {
        throw new WorkOsAppError(
          'E_V2_EXTENSION_STATE_INVALID',
          'V2_SCHEMA_EXTENSION',
          false,
          '既存Message StateのSchema versionがv2拡張対象外です。'
        );
      }
      var classificationCell = sourceRow[map.classification_json];
      var provenanceCell = legacyWidth
        ? ''
        : sourceRow[map.classification_provenance_json];
      if (classificationCell === '' || classificationCell == null) {
        if (String(sourceRow[map.classification_hash] || '') ||
            Number(sourceRow[map.action_count] || 0) !== 0 ||
            String(provenanceCell || '')) {
          throw new WorkOsAppError(
            'E_V2_EXTENSION_STATE_INVALID',
            'V2_SCHEMA_EXTENSION',
            false,
            '未分類Messageにclassification metadataがあります。'
          );
        }
      } else {
        var classification = parseLegacyClassification(classificationCell);
        var provenance = provenanceCell
          ? WorkOsAiAdapter.validateProvenance(
            WorkOsUtilities.parseJson(provenanceCell, 'object')
          )
          : WorkOsAiAdapter.getMetadata(null);
        var existingHash = String(
          sourceRow[map.classification_hash] || ''
        );
        var validHash = provenanceCell
          ? WorkOsAiAdapter.classificationHash(
            classification,
            provenance
          )
          : WorkOsAiAdapter.legacyClassificationHash(classification);
        if (existingHash !== validHash ||
            Number(sourceRow[map.action_count] || 0) !==
              classification.actions.length) {
          throw new WorkOsAppError(
            'E_V2_EXTENSION_STATE_INVALID',
            'V2_SCHEMA_EXTENSION',
            false,
            '既存classification checkpointの整合性を確認できません。'
          );
        }
        output[currentMap.classification_hash] =
          WorkOsAiAdapter.classificationHash(
            classification,
            provenance
          );
        output[currentMap.classification_provenance_json] =
          WorkOsUtilities.serializeJson(provenance, 'object');
      }
      var changed = legacyWidth ||
        rowSchemaVersion !== WorkOsConfig.SCHEMA_VERSION ||
        (!provenanceCell && classificationCell);
      if (changed) {
        output[currentMap.schema_version] = WorkOsConfig.SCHEMA_VERSION;
        output[currentMap.updated_at] = nowValue;
        changedRows.push({
          row: physicalRow,
          values: output
        });
      }
    }
    var chunkRows = WorkOsConfig.V2_EXTENSION_CHUNK_ROWS;
    for (var offset = 0; offset < rowCount; offset += chunkRows) {
      assertExtensionBudget(budget);
      var currentChunkRows = Math.min(chunkRows, rowCount - offset);
      var sourceRows = sheet.getRange(
        WorkOsConfig.DATA_START_ROW + offset,
        1,
        currentChunkRows,
        sourceWidth
      ).getValues();
      sourceRows.forEach(function (sourceRow, rowIndex) {
        inspectSourceRow(
          sourceRow,
          WorkOsConfig.DATA_START_ROW + offset + rowIndex
        );
      });
    }
    return {
      rows: changedRows,
      current_ids: currentIds,
      current_headers: WorkOsSchemas.getHeaders(sheetName)
    };
  }

  function prepareTaskRowsForSnapshot(sheet, legacyWidth, budget) {
    var sheetName = WorkOsConfig.SHEETS.TASKS;
    var currentIds = WorkOsSchemas.getInternalIds(sheetName);
    var sourceWidth = legacyWidth
      ? currentIds.length - 1
      : currentIds.length;
    var sourceIds = currentIds.slice(0, sourceWidth);
    var sourceMap = WorkOsSchemas.buildColumnMapFromIds(sourceIds);
    var rowCount = Math.max(
      0,
      sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
    );
    if (rowCount > WorkOsConfig.V2_EXTENSION_MAX_ROWS) {
      throw new WorkOsAppError(
        'E_V2_EXTENSION_TOO_LARGE',
        'V2_SCHEMA_EXTENSION',
        false,
        'Task一覧が安全なv2 Schema拡張上限を超えています。'
      );
    }
    var changedRows = [];
    var chunkRows = WorkOsConfig.V2_EXTENSION_CHUNK_ROWS;
    for (var offset = 0; offset < rowCount; offset += chunkRows) {
      assertExtensionBudget(budget);
      var currentChunkRows = Math.min(chunkRows, rowCount - offset);
      var sourceRows = sheet.getRange(
        WorkOsConfig.DATA_START_ROW + offset,
        1,
        currentChunkRows,
        sourceWidth
      ).getValues();
      sourceRows.forEach(function (sourceRow, rowIndex) {
        if (!String(sourceRow[sourceMap.task_id] || '') &&
            !String(sourceRow[sourceMap.origin_key] || '')) {
          return;
        }
        var legacyRow = legacyWidth
          ? sourceRow
          : sourceRow.slice(0, -1);
        var output =
          WorkOsTaskRepository.migrateLegacyRowToSnapshot(legacyRow);
        var snapshotChanged = legacyWidth ||
          String(sourceRow[sourceWidth - 1] || '') !==
            String(output[output.length - 1] || '');
        if (snapshotChanged) {
          changedRows.push({
            row: WorkOsConfig.DATA_START_ROW + offset + rowIndex,
            values: output
          });
        }
      });
    }
    return {
      rows: changedRows,
      current_ids: currentIds,
      current_headers: WorkOsSchemas.getHeaders(sheetName)
    };
  }

  function writePreparedRows(sheet, rows, width, budget) {
    var written = 0;
    var index = 0;
    while (index < rows.length) {
      if (budget && budget.isExhausted(
        WorkOsConfig.V2_EXTENSION_BUDGET_RESERVE_MS
      )) {
        return { status: 'PAUSED', written_rows: written };
      }
      var block = [rows[index]];
      var next = index + 1;
      while (next < rows.length &&
          block.length < WorkOsConfig.V2_EXTENSION_CHUNK_ROWS &&
          rows[next].row === block[block.length - 1].row + 1) {
        block.push(rows[next]);
        next += 1;
      }
      sheet.getRange(
        block[0].row,
        1,
        block.length,
        width
      ).setValues(block.map(function (entry) { return entry.values; }));
      written += block.length;
      index = next;
    }
    return { status: 'COMPLETE', written_rows: written };
  }

  function migratedSubsystem(stage, code) {
    var text = String(stage || '') + ' ' + String(code || '');
    if (/GMAIL.*SEARCH|AUTOMATIC_SCAN/i.test(text)) {
      return 'GMAIL_SEARCH';
    }
    if (/GMAIL/i.test(text)) {
      return /LABEL/i.test(text) ? 'GMAIL_LABEL' : 'GMAIL_READ';
    }
    if (/PREPROCESS/i.test(text)) {
      return 'PREPROCESS';
    }
    if (/AI/i.test(text)) {
      return /JSON|SCHEMA|RESPONSE/i.test(text)
        ? 'AI_RESPONSE'
        : 'AI_REQUEST';
    }
    if (/REVIEW/i.test(text)) {
      return 'REVIEW_APPLY';
    }
    if (/TASK/i.test(text)) {
      return 'TASK_UPSERT';
    }
    if (/CALENDAR/i.test(text)) {
      if (/DELETE/i.test(text)) {
        return 'CALENDAR_DELETE';
      }
      if (/UPDATE/i.test(text)) {
        return 'CALENDAR_UPDATE';
      }
      return 'CALENDAR_CREATE';
    }
    if (/TRIGGER|AUTOMATION/i.test(text)) {
      return 'TRIGGER';
    }
    if (/DIAGNOSTIC/i.test(text)) {
      return 'DIAGNOSTIC';
    }
    return 'STATE_WRITE';
  }

  function migratedErrorCategory(code) {
    var value = String(code || '');
    if (/TIMEOUT|RATE_LIMIT|UPSTREAM|FETCH|SERVICE|LOCK/.test(value)) {
      return 'TRANSIENT';
    }
    if (/AUTH/.test(value)) {
      return 'AUTH';
    }
    if (/PERMISSION|APPROVAL|POLICY/.test(value)) {
      return 'POLICY';
    }
    if (/SCHEMA|INVALID|CONFLICT|NOT_FOUND/.test(value)) {
      return 'DATA_OR_SCHEMA';
    }
    return 'UNKNOWN';
  }

  function migratedResumeStage(subsystem) {
    if (subsystem === 'PREPROCESS' || subsystem === 'GMAIL_READ') {
      return 'CLAIMED';
    }
    if (subsystem === 'AI_REQUEST' || subsystem === 'AI_RESPONSE') {
      return 'PREPROCESSED';
    }
    if (subsystem === 'TASK_UPSERT' ||
        subsystem === 'REVIEW_APPLY') {
      return 'CLASSIFIED';
    }
    if (/^CALENDAR_/.test(subsystem)) {
      return 'CALENDAR_PENDING';
    }
    return 'CLAIMED';
  }

  function prepareErrorRowsForDeadLetter(sheet, legacyWidth, budget) {
    var sheetName = WorkOsConfig.SHEETS.ERRORS;
    var currentIds = WorkOsSchemas.getInternalIds(sheetName);
    var sourceWidth = legacyWidth ? currentIds.length - 11 : currentIds.length;
    var sourceIds = currentIds.slice(0, sourceWidth);
    var map = WorkOsSchemas.buildColumnMapFromIds(sourceIds);
    var currentMap = WorkOsSchemas.buildColumnMapFromIds(currentIds);
    var rowCount = Math.max(
      0,
      sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
    );
    if (rowCount > WorkOsConfig.V2_EXTENSION_MAX_ROWS) {
      throw new WorkOsAppError(
        'E_V2_EXTENSION_TOO_LARGE',
        'V2_SCHEMA_EXTENSION',
        false,
        'Error記録が安全なv2 Schema拡張上限を超えています。'
      );
    }
    var changedRows = [];
    var chunkRows = WorkOsConfig.V2_EXTENSION_CHUNK_ROWS;
    for (var offset = 0; offset < rowCount; offset += chunkRows) {
      assertExtensionBudget(budget);
      var currentChunkRows = Math.min(chunkRows, rowCount - offset);
      var sourceRows = sheet.getRange(
        WorkOsConfig.DATA_START_ROW + offset,
        1,
        currentChunkRows,
        sourceWidth
      ).getValues();
      sourceRows.forEach(function (sourceRow, rowIndex) {
        var errorId = String(sourceRow[map.error_id] || '');
        if (!errorId) {
          return;
        }
        var output = sourceRow.slice();
        while (output.length < currentIds.length) {
          output.push('');
        }
        var status = String(sourceRow[map.status] || 'OPEN').toUpperCase();
        var stage = String(sourceRow[map.stage] || '');
        var code = String(sourceRow[map.error_code] || '');
        var subsystem = String(
          output[currentMap.subsystem] || migratedSubsystem(stage, code)
        );
        var existingSafeReference = String(
          output[currentMap.safe_reference] || ''
        );
        var safeReference =
          /^(?:msgref_|thrref_|taskref_|sysref_)[0-9a-f]{64}$/.test(
            existingSafeReference
          )
            ? existingSafeReference
            : '';
        var sourceMessageReference = String(
          sourceRow[map.source_message_id] || ''
        );
        var sourceThreadReference = String(
          sourceRow[map.source_thread_id] || ''
        );
        if (!safeReference && sourceMessageReference) {
          safeReference = /^msgref_[0-9a-f]{64}$/.test(sourceMessageReference)
            ? sourceMessageReference
            : 'msgref_' + WorkOsUtilities.sha256Hex(
              'v2|error-log-reference|msgref_|' + sourceMessageReference
            );
        }
        if (!safeReference && sourceThreadReference) {
          safeReference = /^thrref_[0-9a-f]{64}$/.test(sourceThreadReference)
            ? sourceThreadReference
            : 'thrref_' + WorkOsUtilities.sha256Hex(
              'v2|error-log-reference|thrref_|' + sourceThreadReference
            );
        }
        if (!safeReference && String(sourceRow[map.task_id] || '')) {
          safeReference = 'taskref_' + WorkOsUtilities.sha256Hex(
            'v2|error-task-reference|' + String(sourceRow[map.task_id])
          );
        }
        output[currentMap.source_message_id] = sourceMessageReference
          ? (/^msgref_[0-9a-f]{64}$/.test(sourceMessageReference)
            ? sourceMessageReference
            : 'msgref_' + WorkOsUtilities.sha256Hex(
              'v2|error-log-reference|msgref_|' + sourceMessageReference
            ))
          : '';
        output[currentMap.source_thread_id] = sourceThreadReference
          ? (/^thrref_[0-9a-f]{64}$/.test(sourceThreadReference)
            ? sourceThreadReference
            : 'thrref_' + WorkOsUtilities.sha256Hex(
              'v2|error-log-reference|thrref_|' + sourceThreadReference
            ))
          : '';
        var retryCount = Math.max(
          0,
          Number(sourceRow[map.retry_count] || 0)
        );
        var lastFailedAt = sourceRow[map.last_failed_at] || '';
        var firstFailedAt = sourceRow[map.first_failed_at] || lastFailedAt;
        output[currentMap.dead_letter_id] =
          output[currentMap.dead_letter_id] ||
          (status === 'DEAD'
            ? 'dl_' + WorkOsUtilities.sha256Hex(
              'v2|dead-letter-migration|' + errorId
            ).slice(0, 32)
            : '');
        output[currentMap.subsystem] = subsystem;
        output[currentMap.error_category] =
          output[currentMap.error_category] ||
          migratedErrorCategory(code);
        output[currentMap.safe_reference] = safeReference;
        output[currentMap.message_state_id] =
          output[currentMap.message_state_id] ||
          (/^msgref_[0-9a-f]{64}$/.test(safeReference)
            ? safeReference
            : '');
        output[currentMap.resume_stage] =
          output[currentMap.resume_stage] ||
          migratedResumeStage(subsystem);
        output[currentMap.attempt_count] = Number(
          output[currentMap.attempt_count] ||
          (status === 'DEAD' && retryCount >= 3
            ? retryCount + 1
            : Math.max(1, retryCount))
        );
        output[currentMap.last_attempt_at] =
          output[currentMap.last_attempt_at] || lastFailedAt;
        output[currentMap.next_action] =
          output[currentMap.next_action] ||
          (status === 'DEAD'
            ? (retryCount >= 3 && /TRANSIENT/.test(String(
              output[currentMap.error_category] || ''
            ))
              ? 'REVIEW_AND_RETRY'
              : 'RESOLVE_CONFIGURATION_OR_DATA')
            : 'WAIT_FOR_AUTOMATIC_RETRY');
        output[currentMap.created_at] =
          output[currentMap.created_at] || firstFailedAt;
        output[currentMap.updated_at] =
          output[currentMap.updated_at] || lastFailedAt || firstFailedAt;
        if (legacyWidth ||
            currentIds.slice(-11).some(function (id) {
              return sourceRow[currentMap[id]] === '' &&
                output[currentMap[id]] !== '';
            })) {
          changedRows.push({
            row: WorkOsConfig.DATA_START_ROW + offset + rowIndex,
            values: output
          });
        }
      });
    }
    return {
      rows: changedRows,
      current_ids: currentIds,
      current_headers: WorkOsSchemas.getHeaders(sheetName)
    };
  }

  /**
   * Append-only recognized-v2 extensions through physical Schema v2.4.
   * It runs only when every Sheet is an
   * exact known v2 schema; v1 and unknown/non-empty environments are left
   * untouched for Setup validation to reject.
   */
  function ensureV2ExtensionsBeforeValidation(spreadsheet, budget) {
    var inspection = inspectV2ExtensionCandidate(spreadsheet);
    if (!inspection.applicable) {
      return {
        status: 'NOT_APPLICABLE',
        changed: false,
        reason: inspection.reason
      };
    }
    return WorkOsUtilities.withScriptLock(function () {
      var refreshed = inspectV2ExtensionCandidate(spreadsheet);
      if (!refreshed.applicable) {
        throw new WorkOsAppError(
          'E_V2_EXTENSION_CONFLICT',
          'V2_SCHEMA_EXTENSION',
          false,
          'v2 Schema拡張中に環境構成が変化したため停止しました。'
        );
      }
      var preparedTasks;
      var prepared;
      var preparedErrors;
      try {
        preparedTasks = prepareTaskRowsForSnapshot(
          refreshed.task_sheet,
          refreshed.task_legacy_width,
          budget
        );
        assertExtensionBudget(budget);
        prepared = prepareMessageRowsForProvenance(
          refreshed.message_sheet,
          refreshed.legacy_width,
          budget
        );
        assertExtensionBudget(budget);
        preparedErrors = prepareErrorRowsForDeadLetter(
          refreshed.error_sheet,
          refreshed.error_legacy_width,
          budget
        );
        assertExtensionBudget(budget);
      } catch (preparationError) {
        if (preparationError &&
            preparationError.code === 'E_BUDGET_EXHAUSTED') {
          return {
            status: 'PAUSED',
            changed: false,
            appended_columns: 0,
            updated_task_rows: 0,
            updated_message_rows: 0,
            updated_error_rows: 0
          };
        }
        throw preparationError;
      }
      if (refreshed.task_legacy_width) {
        refreshed.task_sheet.insertColumnsAfter(
          refreshed.task_sheet.getMaxColumns(),
          1
        );
        var taskLastColumn = preparedTasks.current_ids.length;
        refreshed.task_sheet.getRange(1, taskLastColumn, 1, 1)
          .setValues([[
            preparedTasks.current_ids[taskLastColumn - 1]
          ]]);
        refreshed.task_sheet.getRange(2, taskLastColumn, 1, 1)
          .setValues([[
            preparedTasks.current_headers[taskLastColumn - 1]
          ]]);
      }
      var taskWriteResult = writePreparedRows(
        refreshed.task_sheet,
        preparedTasks.rows,
        preparedTasks.current_ids.length,
        budget
      );
      if (taskWriteResult.status === 'PAUSED') {
        return {
          status: 'PAUSED',
          changed: refreshed.task_legacy_width ||
            taskWriteResult.written_rows > 0,
          appended_columns: refreshed.task_legacy_width ? 1 : 0,
          updated_task_rows: taskWriteResult.written_rows,
          updated_message_rows: 0,
          updated_error_rows: 0,
          remaining_task_rows:
            preparedTasks.rows.length - taskWriteResult.written_rows
        };
      }
      if (refreshed.legacy_width) {
        refreshed.message_sheet.insertColumnsAfter(
          refreshed.message_sheet.getMaxColumns(),
          1
        );
        var lastColumn = prepared.current_ids.length;
        refreshed.message_sheet.getRange(1, lastColumn, 1, 1)
          .setValues([[prepared.current_ids[lastColumn - 1]]]);
        refreshed.message_sheet.getRange(2, lastColumn, 1, 1)
          .setValues([[prepared.current_headers[lastColumn - 1]]]);
      }
      var writeResult = writePreparedRows(
        refreshed.message_sheet,
        prepared.rows,
        prepared.current_ids.length,
        budget
      );
      if (writeResult.status === 'PAUSED') {
        return {
          status: 'PAUSED',
          changed: refreshed.legacy_width ||
            refreshed.task_legacy_width ||
            taskWriteResult.written_rows > 0 ||
            writeResult.written_rows > 0,
          appended_columns:
            (refreshed.task_legacy_width ? 1 : 0) +
            (refreshed.legacy_width ? 1 : 0),
          updated_task_rows: taskWriteResult.written_rows,
          updated_message_rows: writeResult.written_rows,
          updated_error_rows: 0,
          remaining_message_rows:
            prepared.rows.length - writeResult.written_rows
        };
      }
      if (refreshed.error_legacy_width) {
        var errorAppendCount = refreshed.legacy_error_column_count;
        refreshed.error_sheet.insertColumnsAfter(
          refreshed.error_sheet.getMaxColumns(),
          errorAppendCount
        );
        var errorStartColumn =
          preparedErrors.current_ids.length - errorAppendCount + 1;
        refreshed.error_sheet.getRange(
          1,
          errorStartColumn,
          1,
          errorAppendCount
        ).setValues([preparedErrors.current_ids.slice(-errorAppendCount)]);
        refreshed.error_sheet.getRange(
          2,
          errorStartColumn,
          1,
          errorAppendCount
        ).setValues([preparedErrors.current_headers.slice(-errorAppendCount)]);
      }
      var errorWriteResult = writePreparedRows(
        refreshed.error_sheet,
        preparedErrors.rows,
        preparedErrors.current_ids.length,
        budget
      );
      if (errorWriteResult.status === 'PAUSED') {
        return {
          status: 'PAUSED',
          changed: true,
          appended_columns:
            (refreshed.task_legacy_width ? 1 : 0) +
            (refreshed.legacy_width ? 1 : 0) +
            (refreshed.error_legacy_width
              ? refreshed.legacy_error_column_count
              : 0),
          updated_task_rows: taskWriteResult.written_rows,
          updated_message_rows: writeResult.written_rows,
          updated_error_rows: errorWriteResult.written_rows,
          remaining_error_rows:
            preparedErrors.rows.length - errorWriteResult.written_rows
        };
      }
      return {
        status: preparedTasks.rows.length ||
            refreshed.task_legacy_width ||
            prepared.rows.length || refreshed.legacy_width ||
            preparedErrors.rows.length || refreshed.error_legacy_width
          ? 'UPDATED'
          : 'CURRENT',
        changed: preparedTasks.rows.length > 0 ||
          refreshed.task_legacy_width ||
          prepared.rows.length > 0 || refreshed.legacy_width ||
          preparedErrors.rows.length > 0 || refreshed.error_legacy_width,
        appended_columns:
          (refreshed.task_legacy_width ? 1 : 0) +
          (refreshed.legacy_width ? 1 : 0) +
          (refreshed.error_legacy_width
            ? refreshed.legacy_error_column_count
            : 0),
        updated_task_rows: taskWriteResult.written_rows,
        updated_message_rows: writeResult.written_rows,
        updated_error_rows: errorWriteResult.written_rows
      };
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  return Object.freeze({
    getVersionState: getVersionState,
    isKnownV1SheetName: isKnownV1SheetName,
    ensureV2ExtensionsBeforeValidation: ensureV2ExtensionsBeforeValidation,
    assertNoV1Migration: assertNoV1Migration
  });
}());

function upgradeSystem() {
  return WorkOsMigrations.assertNoV1Migration();
}
