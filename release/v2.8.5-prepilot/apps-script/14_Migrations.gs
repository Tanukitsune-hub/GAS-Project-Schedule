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
          (width === currentIds.length - 4 ||
           width === currentIds.length - 3) &&
          exactRow(ids, currentIds.slice(0, width)) &&
          exactRow(headers, currentHeaders.slice(0, width))) {
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
    var currentTaskWidth =
      WorkOsSchemas.getInternalIds(taskName).length;
    var taskWidth = taskSheet.getMaxColumns();
    var taskSourceVersion = taskWidth === currentTaskWidth - 4
      ? '2.3'
      : (taskWidth === currentTaskWidth - 3 ? '2.4' : '2.5');
    return {
      applicable: true,
      task_sheet: taskSheet,
      message_sheet: messageSheet,
      error_sheet: errorSheet,
      task_source_version: taskSourceVersion,
      task_append_count: currentTaskWidth - taskWidth,
      task_legacy_width: taskWidth !== currentTaskWidth,
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
          rowSchemaVersion !== '2.4' &&
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

  function extensionCellsAreBlank(row, startIndex) {
    return row.slice(startIndex).every(function (value) {
      return value === '' || value == null;
    });
  }

  function prepareTaskRowsForSnapshot(
    sheet,
    taskSourceVersion,
    budget
  ) {
    var sheetName = WorkOsConfig.SHEETS.TASKS;
    var currentIds = WorkOsSchemas.getInternalIds(sheetName);
    var currentMap = WorkOsSchemas.buildColumnMapFromIds(currentIds);
    var sourceVersion = String(taskSourceVersion || '2.5');
    var sourceWidth = sourceVersion === '2.3'
      ? currentIds.length - 4
      : (sourceVersion === '2.4'
        ? currentIds.length - 3
        : currentIds.length);
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
        var output;
        if (sourceVersion === '2.3') {
          output =
            WorkOsTaskRepository.migrateLegacyRowToSnapshot(sourceRow);
        } else if (sourceVersion === '2.4') {
          output =
            WorkOsTaskRepository.migrateSchema24RowTo25(sourceRow);
        } else {
          var snapshotCell =
            sourceRow[currentMap.authoritative_snapshot_json];
          /*
           * A PAUSED run may already have appended the new columns while
           * later rows are still physically 2.3 or 2.4. Only the exact blank
           * suffix patterns are resumable; an established 2.5 row with a
           * missing or malformed snapshot fails closed.
           */
          if (!snapshotCell &&
              extensionCellsAreBlank(
                sourceRow,
                currentIds.length - 4
              )) {
            output = WorkOsTaskRepository.migrateLegacyRowToSnapshot(
              sourceRow.slice(0, -4)
            );
          } else {
            var parsedSnapshot = null;
            try {
              parsedSnapshot = typeof snapshotCell === 'string'
                ? JSON.parse(snapshotCell)
                : snapshotCell;
            } catch (parseError) {
              parsedSnapshot = null;
            }
            if (parsedSnapshot &&
                parsedSnapshot.schema_version === '2.4' &&
                extensionCellsAreBlank(
                  sourceRow,
                  currentIds.length - 3
                )) {
              output = WorkOsTaskRepository.migrateSchema24RowTo25(
                sourceRow.slice(0, -3)
              );
            } else {
              WorkOsTaskRepository.assertCurrentAuthoritativeRow(
                sourceRow
              );
              return;
            }
          }
        }
        changedRows.push({
          row: WorkOsConfig.DATA_START_ROW + offset + rowIndex,
          values: output
        });
      });
    }
    return {
      rows: changedRows,
      current_ids: currentIds,
      current_headers: WorkOsSchemas.getHeaders(sheetName),
      source_version: sourceVersion
    };
  }

  function writePreparedRows(sheet, rows, width, budget, afterWrite) {
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
      if (typeof afterWrite === 'function') {
        block.forEach(function (entry) {
          afterWrite(entry);
        });
      }
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

  function r4TaskAuthorityInspection(spreadsheet) {
    var taskName = WorkOsConfig.SHEETS.TASKS;
    var ledgerName = WorkOsConfig.SHEETS.TASK_AUTHORITY_LEDGER;
    var taskSheet = spreadsheet.getSheetByName(taskName);
    if (!taskSheet) {
      return null;
    }
    var currentIds = WorkOsSchemas.getInternalIds(taskName);
    var currentHeaders = WorkOsSchemas.getHeaders(taskName);
    var width = taskSheet.getMaxColumns();
    var ids = taskSheet.getRange(1, 1, 1, width).getValues()[0];
    var headers = taskSheet.getRange(2, 1, 1, width).getValues()[0];
    var legacyWidth = currentIds.length - 3;
    // Header rows are repairable control-plane metadata.  Column count is the
    // physical migration discriminator; row 1/2 may be exact, partially
    // written after an interruption, or owner-edited and will be restored
    // canonically before any Task data is inspected.
    var isLegacy25 = width === legacyWidth;
    var isCurrent26 = width === currentIds.length;
    if (!isLegacy25 && !isCurrent26) {
      return null;
    }
    return {
      task_sheet: taskSheet,
      source_version: isLegacy25 ? '2.5' : '2.6',
      append_count: isLegacy25 ? 3 : 0,
      ledger_present: Boolean(spreadsheet.getSheetByName(ledgerName))
    };
  }

  function ensureR4AuthorityLedgerSheet(spreadsheet) {
    var sheetName = WorkOsConfig.SHEETS.TASK_AUTHORITY_LEDGER;
    var schema = WorkOsSchemas.getSheetSchema(sheetName);
    var ids = WorkOsSchemas.getInternalIds(sheetName);
    var headers = WorkOsSchemas.getHeaders(sheetName);
    var sheet = spreadsheet.getSheetByName(sheetName);
    var created = false;
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      created = true;
    }
    if (sheet.getMaxRows() < WorkOsConfig.DEFAULT_INITIAL_ROWS) {
      sheet.insertRowsAfter(
        sheet.getMaxRows(),
        WorkOsConfig.DEFAULT_INITIAL_ROWS - sheet.getMaxRows()
      );
    }
    if (sheet.getMaxColumns() < schema.length) {
      sheet.insertColumnsAfter(
        sheet.getMaxColumns(),
        schema.length - sheet.getMaxColumns()
      );
    }
    if (sheet.getMaxColumns() > schema.length) {
      if (!created || typeof sheet.deleteColumns !== 'function') {
        throw new WorkOsAppError(
          'E_TASK_AUTHORITY_LEDGER_SCHEMA',
          'MIGRATION_25_TO_26',
          false,
          'Existing Task authority ledger has an unsupported column count.'
        );
      }
      sheet.deleteColumns(
        schema.length + 1,
        sheet.getMaxColumns() - schema.length
      );
    }
    if (sheet.getMaxColumns() !== schema.length) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_LEDGER_SCHEMA',
        'MIGRATION_25_TO_26',
        false,
        'Task authority ledger does not have the canonical column count.'
      );
    }
    var existingIds = sheet.getRange(1, 1, 1, schema.length).getValues()[0];
    var existingHeaders = sheet.getRange(2, 1, 1, schema.length).getValues()[0];
    if (!exactRow(existingIds, ids) || !exactRow(existingHeaders, headers)) {
      // A ledger header is control-plane metadata only; restoring it does not
      // create authority from Task data and makes row1/row2 partial writes
      // resumable.
      sheet.getRange(1, 1, 1, schema.length).setValues([ids]);
      sheet.getRange(2, 1, 1, schema.length).setValues([headers]);
    }
    return sheet;
  }

  function appendR4TaskAuthorityColumns(taskSheet, inspection) {
    if (!inspection.append_count) {
      return false;
    }
    var ids = WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS);
    var headers = WorkOsSchemas.getHeaders(WorkOsConfig.SHEETS.TASKS);
    var startColumn = taskSheet.getMaxColumns() + 1;
    taskSheet.insertColumnsAfter(taskSheet.getMaxColumns(), inspection.append_count);
    taskSheet.getRange(1, startColumn, 1, inspection.append_count)
      .setValues([ids.slice(-inspection.append_count)]);
    taskSheet.getRange(2, startColumn, 1, inspection.append_count)
      .setValues([headers.slice(-inspection.append_count)]);
    return true;
  }

  function r4MigrationState(properties, state) {
    var key = WorkOsConfig.PROPERTIES.AUTHORITY_MIGRATION_STATE;
    if (state == null) {
      properties.deleteProperty(key);
      return;
    }
    properties.setProperty(key, JSON.stringify(state));
  }

  function readR4MigrationState(properties) {
    var raw = properties.getProperty(
      WorkOsConfig.PROPERTIES.AUTHORITY_MIGRATION_STATE
    );
    if (!raw) {
      return null;
    }
    try {
      var state = JSON.parse(raw);
      if (!state || typeof state !== 'object' ||
          state.state !== 'PREPARED' ||
          (state.source_version !== '2.5' && state.source_version !== '2.6')) {
        throw new Error('invalid authority migration state');
      }
      return state;
    } catch (error) {
      throw new WorkOsAppError(
        'E_TASK_AUTHORITY_MIGRATION_STATE',
        'MIGRATION_25_TO_26',
        false,
        'Task authority migration state is invalid and cannot be resumed safely.'
      );
    }
  }

  function r4AuthorityNoteAt(taskSheet, physicalRow, snapshotColumn) {
    var range = taskSheet.getRange(physicalRow, snapshotColumn, 1, 1);
    return typeof range.getNote === 'function' ? range.getNote() : '';
  }

  function migrateR4TaskAuthority(spreadsheet, inspection, budget) {
    var taskSheet = inspection.task_sheet;
    var props = PropertiesService.getScriptProperties();
    var priorState = readR4MigrationState(props);
    var sourceVersion = priorState
      ? priorState.source_version
      : inspection.source_version;
    var startedAt = priorState && priorState.started_at
      ? priorState.started_at
      : WorkOsUtilities.now().toISOString();
    r4MigrationState(props, {
      source_version: sourceVersion,
      state: 'PREPARED',
      started_at: startedAt,
      next_row: Number(priorState && priorState.next_row) ||
        WorkOsConfig.DATA_START_ROW
    });
    ensureR4AuthorityLedgerSheet(spreadsheet);
    var appended = appendR4TaskAuthorityColumns(taskSheet, inspection);
    // Header rows are control-plane metadata and are restored canonically.
    WorkOsSheetBuilder.restoreCanonicalTaskHeaders(taskSheet);
    // Make the new ledger and its Task control columns hidden/protected before
    // any record conversion. A budget pause or injected fault must never
    // strand a visible, writable authority store.
    WorkOsSheetBuilder.applyAllSchemas(spreadsheet);
    WorkOsSheetBuilder.applyValidationsAndFormats(spreadsheet);
    WorkOsSheetBuilder.applyVisibility(spreadsheet);
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.TASKS);
    var ids = WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.TASKS);
    var map = WorkOsSchemas.buildColumnMapFromIds(ids);
    var rowCount = Math.max(
      0,
      taskSheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
    );
    var migrated = 0;
    var quarantined = 0;
    var restored = 0;
    // Reuse one ledger index per bounded migration invocation. Writes update
    // that context in-place only after durable success, avoiding per-Task
    // whole-ledger scans while retaining pause/resume boundaries.
    var ledgerContext = null;
    var resumeRow = Math.max(
      WorkOsConfig.DATA_START_ROW,
      Number(priorState && priorState.next_row) ||
        WorkOsConfig.DATA_START_ROW
    );
    var resumeOffset = Math.min(
      rowCount,
      resumeRow - WorkOsConfig.DATA_START_ROW
    );
    for (var offset = resumeOffset; offset < rowCount; offset +=
        WorkOsConfig.AUTHORITY_LEDGER_CHUNK_ROWS) {
      if (budget && budget.isExhausted(
        WorkOsConfig.V2_EXTENSION_BUDGET_RESERVE_MS
      )) {
        r4MigrationState(props, {
          source_version: sourceVersion,
          state: 'PREPARED',
          started_at: startedAt,
          next_row: WorkOsConfig.DATA_START_ROW + offset
        });
        return {
          status: 'PAUSED',
          changed: appended || migrated > 0 || quarantined > 0 || restored > 0,
          appended_columns: inspection.append_count,
          updated_task_rows: migrated + restored,
          quarantined_task_rows: quarantined,
          remaining_from_row: WorkOsConfig.DATA_START_ROW + offset
        };
      }
      var count = Math.min(
        WorkOsConfig.AUTHORITY_LEDGER_CHUNK_ROWS,
        rowCount - offset
      );
      var rows = taskSheet.getRange(
        WorkOsConfig.DATA_START_ROW + offset,
        1,
        count,
        schema.length
      ).getValues();
      rows.forEach(function (raw, rowIndex) {
        var physicalRow = WorkOsConfig.DATA_START_ROW + offset + rowIndex;
        var rowHasIdentity = String(raw[map.task_id] || '') ||
          String(raw[map.origin_key] || '');
        var validation = WorkOsTaskRepository.validateAuthority(raw, {
          sheet: taskSheet,
          physical_row: physicalRow,
          schema: schema,
          column_map: map,
          ledger_context: ledgerContext,
          mode: 'MIGRATION_25_TO_26'
        });
        ledgerContext = validation.ledger_context || ledgerContext;
        if (!rowHasIdentity && validation.status === 'EMPTY') {
          return;
        }
        if (validation.status === 'VALID') {
          return;
        }
        if (validation.status === 'RELOCATABLE') {
          var reboundRow = WorkOsTaskRepository.restoreAuthorityRow(
            taskSheet,
            physicalRow,
            raw,
            {
              schema: schema,
              column_map: map,
              ledger_context: ledgerContext,
              mode: 'MIGRATION_25_TO_26'
            }
          );
          if (reboundRow && reboundRow.status === 'RESTORED') {
            restored += 1;
            return;
          }
          validation = reboundRow || validation;
        }
        if (validation.status === 'PREPARED_RECOVERABLE') {
          var recovered = WorkOsTaskRepository.recoverPreparedAuthority(
            taskSheet,
            physicalRow,
            {
              schema: schema,
              column_map: map,
              raw_row: raw,
              ledger_context: ledgerContext
            }
          );
          if (recovered.status === 'VALID') {
            restored += 1;
            return;
          }
          validation = recovered;
        }
        if (validation.status === 'RESTORABLE') {
          var restoredRow = WorkOsTaskRepository.restoreAuthorityRow
            ? WorkOsTaskRepository.restoreAuthorityRow(taskSheet, physicalRow, raw, {
              schema: schema,
              column_map: map,
              ledger_context: ledgerContext,
              mode: 'MIGRATION_25_TO_26'
            })
            : null;
          if (restoredRow && restoredRow.status === 'RESTORED') {
            restored += 1;
            return;
          }
          validation = restoredRow || validation;
        }
        if (validation.status === 'EMPTY' ||
            validation.status === 'QUARANTINED' ||
            validation.status === 'UNRECOVERABLE') {
          // Schema 2.5 records can be seeded exactly once, and only when no
          // Schema 2.6 authority record exists.  A corrupt or conflicting
          // ledger record is evidence of an authority failure, not a reason
          // to trust the live row, editable snapshot cell, or a stale note
          // again.  Keep that row excluded and let the operator resolve it.
          if (!rowHasIdentity || sourceVersion !== '2.5' ||
              (validation.status !== 'EMPTY' &&
               validation.code !== 'E_TASK_AUTHORITY_MISSING')) {
            WorkOsTaskRepository.quarantineAuthorityRow(
              taskSheet,
              physicalRow,
              raw,
              validation.code || 'E_TASK_AUTHORITY_MIGRATION_INVALID',
              {
                schema: schema,
                column_map: map,
                ledger_context: ledgerContext,
                unrecoverable: validation.status === 'UNRECOVERABLE'
              }
            );
            quarantined += 1;
            return;
          }
          var legacySource = raw.slice(0, -3);
          var note = r4AuthorityNoteAt(
            taskSheet,
            physicalRow,
            map.authoritative_snapshot_json + 1
          );
          try {
            var candidate = WorkOsTaskRepository
              .prepareSchema25AuthorityCandidate(legacySource, note);
            WorkOsTaskRepository.commitAuthorityRow(
              taskSheet,
              physicalRow,
              candidate,
              {
                schema: schema,
                column_map: map,
                mode: 'MIGRATION_25_TO_26',
                ledger_context: ledgerContext,
                allow_authority_seed: true
              }
            );
            migrated += 1;
          } catch (migrationError) {
            WorkOsTaskRepository.quarantineAuthorityRow(
              taskSheet,
              physicalRow,
              raw,
              migrationError && migrationError.code ||
                validation.code || 'E_TASK_AUTHORITY_MIGRATION_INVALID',
              {
                schema: schema,
                column_map: map,
                ledger_context: ledgerContext,
                unrecoverable: validation.status === 'UNRECOVERABLE'
              }
            );
            quarantined += 1;
          }
        }
      });
      r4MigrationState(props, {
        source_version: sourceVersion,
        state: 'PREPARED',
        started_at: startedAt,
        next_row: WorkOsConfig.DATA_START_ROW + offset + count
      });
    }
    r4MigrationState(props, null);
    return {
      status: migrated || quarantined || restored || appended ? 'UPDATED' : 'CURRENT',
      changed: Boolean(migrated || quarantined || restored || appended),
      appended_columns: inspection.append_count,
      updated_task_rows: migrated + restored,
      quarantined_task_rows: quarantined,
      migration_source: sourceVersion
    };
  }

  /**
   * Append-only recognized-v2 extensions through physical Schema v2.4.
   * It runs only when every Sheet is an
   * exact known v2 schema; v1 and unknown/non-empty environments are left
   * untouched for Setup validation to reject.
   */
  function ensureV2ExtensionsBeforeValidation(spreadsheet, budget) {
    var r4Inspection = r4TaskAuthorityInspection(spreadsheet);
    if (r4Inspection) {
      return WorkOsUtilities.withScriptLock(function () {
        var refreshedR4Inspection = r4TaskAuthorityInspection(spreadsheet);
        if (!refreshedR4Inspection) {
          throw new WorkOsAppError(
            'E_V2_EXTENSION_CONFLICT',
            'MIGRATION_25_TO_26',
            false,
            'Task authority migration changed while waiting for the Script Lock.'
          );
        }
        return migrateR4TaskAuthority(
          spreadsheet,
          refreshedR4Inspection,
          budget
        );
      }, WorkOsConfig.LOCK_WAIT_MS);
    }
    var inspection = inspectV2ExtensionCandidate(spreadsheet);
    if (!inspection.applicable) {
      return {
        status: 'NOT_APPLICABLE',
        changed: false,
        reason: inspection.reason
      };
    }
    // Schema 2.6 deliberately supports only the strict 2.5 -> 2.6 ledger
    // migration above.  Older snapshot-cell extension paths cannot satisfy
    // the mandatory independent-authority rule and therefore fail closed.
    throw new WorkOsAppError(
      'E_TASK_AUTHORITY_LEGACY_SCHEMA_UNSUPPORTED',
      'MIGRATION_25_TO_26',
      false,
      'Pre-2.5 Task schemas require an explicit audited repair package.'
    );
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
          refreshed.task_source_version,
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
        var taskAppendCount = refreshed.task_append_count;
        var taskStartColumn =
          preparedTasks.current_ids.length - taskAppendCount + 1;
        refreshed.task_sheet.insertColumnsAfter(
          refreshed.task_sheet.getMaxColumns(),
          taskAppendCount
        );
        refreshed.task_sheet.getRange(
          1,
          taskStartColumn,
          1,
          taskAppendCount
        ).setValues([
          preparedTasks.current_ids.slice(-taskAppendCount)
        ]);
        refreshed.task_sheet.getRange(
          2,
          taskStartColumn,
          1,
          taskAppendCount
        ).setValues([
          preparedTasks.current_headers.slice(-taskAppendCount)
        ]);
      }
      var taskWriteResult = writePreparedRows(
        refreshed.task_sheet,
        preparedTasks.rows,
        preparedTasks.current_ids.length,
        budget,
        function (entry) {
          WorkOsTaskRepository.syncAuthoritativeMirror(
            refreshed.task_sheet,
            entry.row,
            entry.values,
            WorkOsSchemas.getSheetSchema(
              WorkOsConfig.SHEETS.TASKS
            ),
            WorkOsSchemas.buildColumnMapFromIds(
              preparedTasks.current_ids
            )
          );
        }
      );
      if (taskWriteResult.status === 'PAUSED') {
        return {
          status: 'PAUSED',
          changed: refreshed.task_legacy_width ||
            taskWriteResult.written_rows > 0,
          appended_columns: refreshed.task_append_count,
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
            refreshed.task_append_count +
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
            refreshed.task_append_count +
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
          refreshed.task_append_count +
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
