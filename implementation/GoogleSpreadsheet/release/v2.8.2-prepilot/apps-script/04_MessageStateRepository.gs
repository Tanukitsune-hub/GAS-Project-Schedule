/**
 * Message State repository through Phase 7 recovery checkpoints.
 *
 * The Message ID column is the only row key. Message bodies, subjects and
 * senders are deliberately outside this repository contract.
 */
var WorkOsMessageStateRepository = (function () {
  var LOCK_MARKER = {};
  var STATUSES = Object.freeze({
    DISCOVERED: 'DISCOVERED',
    CLAIMED: 'CLAIMED',
    PREPROCESSED: 'PREPROCESSED',
    CLASSIFIED: 'CLASSIFIED',
    TASKS_WRITTEN: 'TASKS_WRITTEN',
    CALENDAR_PENDING: 'CALENDAR_PENDING',
    DONE: 'DONE',
    RETRY: 'RETRY',
    DEAD: 'DEAD',
    SKIPPED: 'SKIPPED'
  });
  var STATUS_VALUES = Object.keys(STATUSES).map(function (key) {
    return STATUSES[key];
  });
  var RETRY_DELAYS_MS = Object.freeze([
    WorkOsConfig.RETRY_DELAYS_MINUTES[0] * 60 * 1000,
    WorkOsConfig.RETRY_DELAYS_MINUTES[1] * 60 * 1000,
    WorkOsConfig.RETRY_DELAYS_MINUTES[2] * 60 * 1000
  ]);
  var MAX_RETRIES = RETRY_DELAYS_MS.length;
  var RESUME_STAGES = Object.freeze({
    PREPROCESS: 'PREPROCESS',
    CLASSIFY: 'CLASSIFY',
    TASK_WRITE: 'TASK_WRITE',
    FINALIZE: 'FINALIZE',
    CALENDAR: 'CALENDAR',
    DONE: 'DONE'
  });
  var CHECKPOINT_STAGES = Object.freeze({
    CLAIMED: 'CLAIMED',
    PREPROCESSED: 'PREPROCESSED',
    CLASSIFIED: 'CLASSIFIED',
    TASK_APPLIED: 'TASK_APPLIED',
    CALENDAR_PENDING: 'CALENDAR_PENDING',
    DONE: 'DONE'
  });

  function messageSheet(spreadsheet) {
    var target = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
    var sheet = target && target.getSheetByName(WorkOsConfig.SHEETS.MESSAGE_STATE);
    if (!sheet) {
      throw new WorkOsAppError(
        'E_SCHEMA_MISSING_SHEET',
        'MESSAGE_STATE',
        false,
        '繝｡繝ｼ繝ｫ迥ｶ諷鬼heet縺後≠繧翫∪縺帙ｓ縲・
      );
    }
    return sheet;
  }

  function assertDate(value, fieldName) {
    if (value === '' || value == null) {
      return '';
    }
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new WorkOsAppError(
        'E_MESSAGE_STATE_TYPE',
        'MESSAGE_STATE',
        false,
        fieldName + '縺ｮ蝙九′荳肴ｭ｣縺ｧ縺吶・
      );
    }
    return value;
  }

  function assertInteger(value, fieldName) {
    if (value === '' || value == null) {
      return 0;
    }
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
      throw new WorkOsAppError(
        'E_MESSAGE_STATE_TYPE',
        'MESSAGE_STATE',
        false,
        fieldName + '縺ｮ蝙九′荳肴ｭ｣縺ｧ縺吶・
      );
    }
    return value;
  }

  function parseClassification(value) {
    if (value === '' || value == null) {
      return null;
    }
    try {
      return WorkOsUtilities.parseJson(value, 'object');
    } catch (error) {
      throw new WorkOsAppError(
        'E_INVALID_JSON',
        'MESSAGE_STATE',
        false,
        'classification_json縺御ｸ肴ｭ｣縺ｧ縺吶・
      );
    }
  }

  function parseClassificationProvenance(value) {
    if (value === '' || value == null) {
      return null;
    }
    try {
      return WorkOsAiAdapter.validateProvenance(
        WorkOsUtilities.parseJson(value, 'object')
      );
    } catch (error) {
      throw new WorkOsAppError(
        'E_AI_PROVENANCE',
        'MESSAGE_STATE',
        false,
        'classification provenance縺御ｸ肴ｭ｣縺ｧ縺吶・
      );
    }
  }

  function recordFromRow(row, map, physicalRow) {
    var status = String(row[map.processing_status] || '');
    if (!status || STATUS_VALUES.indexOf(status) === -1) {
      throw new WorkOsAppError(
        'E_INVALID_ENUM',
        'MESSAGE_STATE',
        false,
        'Message State縺ｮ迥ｶ諷九′荳肴ｭ｣縺ｧ縺吶・
      );
    }
    var record = {
      row: physicalRow,
      message_id: String(row[map.message_id] || ''),
      thread_id: String(row[map.thread_id] || ''),
      stable_thread_key: String(row[map.stable_thread_key] || ''),
      received_at: assertDate(row[map.received_at], 'received_at'),
      discovered_at: assertDate(row[map.discovered_at], 'discovered_at'),
      source_mode: String(row[map.source_mode] || ''),
      processing_status: status,
      resume_stage: String(row[map.resume_stage] || ''),
      claimed_at: assertDate(row[map.claimed_at], 'claimed_at'),
      claim_run_id: String(row[map.claim_run_id] || ''),
      preprocess_hash: String(row[map.preprocess_hash] || ''),
      classification_json: parseClassification(row[map.classification_json]),
      classification_hash: String(row[map.classification_hash] || ''),
      action_count: assertInteger(row[map.action_count], 'action_count'),
      retry_count: assertInteger(row[map.retry_count], 'retry_count'),
      next_retry_at: assertDate(row[map.next_retry_at], 'next_retry_at'),
      completed_at: assertDate(row[map.completed_at], 'completed_at'),
      last_error_code: String(row[map.last_error_code] || ''),
      last_error_at: assertDate(row[map.last_error_at], 'last_error_at'),
      schema_version: String(row[map.schema_version] || ''),
      updated_at: assertDate(row[map.updated_at], 'updated_at'),
      classification_provenance_json: parseClassificationProvenance(
        row[map.classification_provenance_json]
      )
    };
    if (record.last_error_code &&
        !WorkOsUtilities.isSafeIdentifier(record.last_error_code)) {
      throw new WorkOsAppError(
        'E_MESSAGE_STATE_CORRUPT',
        'MESSAGE_STATE',
        false,
        'Message State縺ｮerror code縺御ｸ肴ｭ｣縺ｧ縺吶・
      );
    }
    if (!record.thread_id ||
        !record.stable_thread_key ||
        !record.source_mode ||
        !record.resume_stage ||
        !record.schema_version ||
        !(record.received_at instanceof Date) ||
        !(record.discovered_at instanceof Date) ||
        !(record.updated_at instanceof Date)) {
      throw new WorkOsAppError(
        'E_MESSAGE_STATE_CORRUPT',
        'MESSAGE_STATE',
        false,
        'Message State縺ｮ蠢・・ield縺梧ｬ關ｽ縺励※縺・∪縺吶・
      );
    }
    if (record.schema_version !== WorkOsConfig.SCHEMA_VERSION) {
      throw new WorkOsAppError(
        'E_MESSAGE_STATE_SCHEMA',
        'MESSAGE_STATE',
        false,
        'Message State縺ｮSchema version縺御ｸ閾ｴ縺励∪縺帙ｓ縲・
      );
    }
    if (record.processing_status === STATUSES.CLAIMED &&
        (!(record.claimed_at instanceof Date) || !record.claim_run_id)) {
      throw new WorkOsAppError(
        'E_MESSAGE_STATE_CORRUPT',
        'MESSAGE_STATE',
        false,
        'CLAIMED迥ｶ諷九・蠢・・ield縺梧ｬ關ｽ縺励※縺・∪縺吶・
      );
    }
    if (record.processing_status === STATUSES.PREPROCESSED &&
        (!/^[0-9a-f]{64}$/.test(record.preprocess_hash) ||
         record.resume_stage !== RESUME_STAGES.CLASSIFY)) {
      throw new WorkOsAppError(
        'E_MESSAGE_STATE_CORRUPT',
        'MESSAGE_STATE',
        false,
        'PREPROCESSED checkpoint縺御ｸ肴ｭ｣縺ｧ縺吶・
      );
    }
    var classificationRequired =
      record.processing_status === STATUSES.CLASSIFIED ||
      record.processing_status === STATUSES.TASKS_WRITTEN ||
      record.processing_status === STATUSES.CALENDAR_PENDING ||
      record.processing_status === STATUSES.DONE ||
      record.resume_stage === RESUME_STAGES.TASK_WRITE ||
      record.resume_stage === RESUME_STAGES.FINALIZE ||
      record.resume_stage === RESUME_STAGES.CALENDAR ||
      record.resume_stage === RESUME_STAGES.DONE;
    if (classificationRequired) {
      if (!record.classification_json ||
          !record.classification_provenance_json ||
          !/^[0-9a-f]{64}$/.test(record.classification_hash) ||
          WorkOsAiAdapter.classificationHash(
            record.classification_json,
            record.classification_provenance_json
          ) !== record.classification_hash ||
          !Array.isArray(record.classification_json.actions) ||
          record.action_count !== record.classification_json.actions.length) {
        throw new WorkOsAppError(
          'E_MESSAGE_STATE_CORRUPT',
          'MESSAGE_STATE',
          false,
          'classification checkpoint縺御ｸ肴ｭ｣縺ｧ縺吶・
        );
      }
      if (typeof WorkOsAiAdapter !== 'undefined') {
        WorkOsAiAdapter.validateOutput(record.classification_json);
        WorkOsAiAdapter.validateProvenance(
          record.classification_provenance_json
        );
      }
    } else if (record.classification_json ||
        record.classification_provenance_json ||
        record.classification_hash ||
        record.action_count) {
      throw new WorkOsAppError(
        'E_MESSAGE_STATE_CORRUPT',
        'MESSAGE_STATE',
        false,
        'classification譛ｪ螳御ｺ・｡後↓蛻・｡枸etadata縺後≠繧翫∪縺吶・
      );
    }
    if (record.processing_status === STATUSES.CALENDAR_PENDING &&
        record.resume_stage !== RESUME_STAGES.CALENDAR) {
      throw new WorkOsAppError(
        'E_MESSAGE_STATE_CORRUPT',
        'MESSAGE_STATE',
        false,
        'CALENDAR_PENDING checkpoint縺御ｸ肴ｭ｣縺ｧ縺吶・
      );
    }
    if (record.processing_status === STATUSES.DONE &&
        (!(record.completed_at instanceof Date) ||
         record.resume_stage !== RESUME_STAGES.DONE)) {
      throw new WorkOsAppError(
        'E_MESSAGE_STATE_CORRUPT',
        'MESSAGE_STATE',
        false,
        'DONE checkpoint縺御ｸ肴ｭ｣縺ｧ縺吶・
      );
    }
    return record;
  }

  function createContext(sheet, lockMarker) {
    var schema = WorkOsSchemas.getSheetSchema(WorkOsConfig.SHEETS.MESSAGE_STATE);
    var expectedIds = WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.MESSAGE_STATE);
    if (sheet.getMaxColumns() !== expectedIds.length) {
      throw new WorkOsAppError(
        'E_SCHEMA_CONFLICT',
        'MESSAGE_STATE',
        false,
        '繝｡繝ｼ繝ｫ迥ｶ諷鬼heet縺ｮ蛻玲焚縺郡chema縺ｨ荳閾ｴ縺励∪縺帙ｓ縲・
      );
    }
    var ids = sheet.getRange(1, 1, 1, expectedIds.length).getValues()[0];
    if (JSON.stringify(ids) !== JSON.stringify(expectedIds)) {
      throw new WorkOsAppError(
        'E_SCHEMA_MISSING_COLUMN',
        'MESSAGE_STATE',
        false,
        '繝｡繝ｼ繝ｫ迥ｶ諷鬼heet縺ｮ蜀・Κ蛻悠D縺郡chema縺ｨ荳閾ｴ縺励∪縺帙ｓ縲・
      );
    }
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
        schema.length
      ).getValues()
      : [];
    var byMessageId = {};
    var logicalRows = [];
    values.forEach(function (row, index) {
      var messageId = String(row[map.message_id] || '').trim();
      if (!messageId) {
        return;
      }
      if (Object.prototype.hasOwnProperty.call(byMessageId, messageId)) {
        throw new WorkOsAppError(
          'E_MESSAGE_STATE_DUPLICATE',
          'MESSAGE_STATE',
          false,
          '蜷後§Message ID縺ｮ迥ｶ諷玖｡後′驥崎､・＠縺ｦ縺・∪縺吶・
        );
      }
      var record = recordFromRow(
        row,
        map,
        WorkOsConfig.DATA_START_ROW + index
      );
      byMessageId[messageId] = record;
      logicalRows.push(record);
    });
    return {
      sheet: sheet,
      schema: schema,
      map: map,
      values: values,
      byMessageId: byMessageId,
      logicalRows: logicalRows,
      lockMarker: lockMarker || null
    };
  }

  function assertLocked(context) {
    if (!context || context.lockMarker !== LOCK_MARKER) {
      throw new WorkOsAppError(
        'E_LOCK_REQUIRED',
        'MESSAGE_STATE',
        false,
        'Message State縺ｮ譖ｴ譁ｰ縺ｫ縺ｯScript Lock縺悟ｿ・ｦ√〒縺吶・
      );
    }
  }

  function assertRunId(runId) {
    var value = String(runId || '').trim();
    if (!value || value.length > 80) {
      throw new WorkOsAppError(
        'E_RUN_ID',
        'MESSAGE_STATE',
        false,
        'run_id縺御ｸ崎ｶｳ縺ｾ縺溘・荳肴ｭ｣縺ｧ縺吶・
      );
    }
    return value;
  }

  function withLockedContext(sheet, callback) {
    return WorkOsUtilities.withScriptLock(function () {
      var context = createContext(sheet, LOCK_MARKER);
      try {
        return callback(context);
      } finally {
        context.lockMarker = null;
      }
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  function createContextForHeldLock(sheet, lock) {
    if (!lock ||
        typeof lock.hasLock !== 'function' ||
        !lock.hasLock()) {
      throw new WorkOsAppError(
        'E_LOCK_REQUIRED',
        'MESSAGE_STATE',
        false,
        '菫晄戟荳ｭ縺ｮScript Lock繧堤｢ｺ隱阪〒縺阪∪縺帙ｓ縲・
      );
    }
    return createContext(sheet, LOCK_MARKER);
  }

  function validateMetadata(metadata) {
    var value = metadata || {};
    ['message_id', 'thread_id', 'stable_thread_key'].forEach(function (field) {
      var text = String(value[field] || '').trim();
      if (!text || text.length > 512) {
        throw new WorkOsAppError(
          'E_MESSAGE_METADATA',
          'MESSAGE_STATE',
          false,
          'Message metadata縺御ｸ崎ｶｳ縺ｾ縺溘・荳肴ｭ｣縺ｧ縺吶・
        );
      }
    });
    if (!(value.received_at instanceof Date) ||
        Number.isNaN(value.received_at.getTime())) {
      throw new WorkOsAppError(
        'E_MESSAGE_METADATA',
        'MESSAGE_STATE',
        false,
        'Message蜿嶺ｿ｡譌･譎ゅ′荳肴ｭ｣縺ｧ縺吶・
      );
    }
  }

  function emptyPhysicalRow(context) {
    var messageIndex = context.map.message_id;
    for (var index = 0; index < context.values.length; index += 1) {
      if (WorkOsUtilities.isBlank(context.values[index][messageIndex])) {
        return WorkOsConfig.DATA_START_ROW + index;
      }
    }
    var previousMax = context.sheet.getMaxRows();
    context.sheet.insertRowsAfter(previousMax, WorkOsConfig.ROW_EXPANSION_UNIT);
    for (var appended = 0; appended < WorkOsConfig.ROW_EXPANSION_UNIT; appended += 1) {
      context.values.push(context.schema.map(function () { return ''; }));
    }
    return previousMax + 1;
  }

  function valueForCell(column, value) {
    if (value === '' || value == null) {
      return '';
    }
    if (column.type === 'JsonObject') {
      return WorkOsUtilities.serializeJson(value, 'object');
    }
    return value;
  }

  function rowFromRecord(context, record) {
    return context.schema.map(function (column) {
      return valueForCell(column, record[column.id]);
    });
  }

  function sameStoredCellValue(left, right) {
    if (left instanceof Date || right instanceof Date) {
      var leftDate = left instanceof Date ? left : new Date(left);
      var rightDate = right instanceof Date ? right : new Date(right);
      return !isNaN(leftDate.getTime()) &&
        !isNaN(rightDate.getTime()) &&
        leftDate.getTime() === rightDate.getTime();
    }
    return String(left) === String(right);
  }

  function storeRecord(context, record, isInsert) {
    var output = rowFromRecord(context, record);
    var matrixIndex = record.row - WorkOsConfig.DATA_START_ROW;
    if (isInsert) {
      context.sheet.getRange(record.row, 1, 1, output.length).setValues([output]);
      context.values[matrixIndex] = output.slice();
      context.logicalRows.push(record);
    } else {
      var previous = context.values[matrixIndex];
      var start = -1;
      for (var index = 0; index <= output.length; index += 1) {
        var changed = index < output.length &&
          !sameStoredCellValue(previous[index], output[index]);
        if (changed && start === -1) {
          start = index;
        }
        if ((!changed || index === output.length) && start !== -1) {
          var end = index;
          context.sheet.getRange(
            record.row,
            start + 1,
            1,
            end - start
          ).setValues([output.slice(start, end)]);
          start = -1;
        }
      }
      context.values[matrixIndex] = output.slice();
    }
    context.byMessageId[record.message_id] = record;
    for (var logicalIndex = 0;
      logicalIndex < context.logicalRows.length;
      logicalIndex += 1) {
      if (context.logicalRows[logicalIndex].message_id === record.message_id) {
        context.logicalRows[logicalIndex] = record;
        break;
      }
    }
    return record;
  }

  function discoverInContext(metadata, context, nowValue) {
    assertLocked(context);
    validateMetadata(metadata);
    var messageId = String(metadata.message_id);
    var existing = context.byMessageId[messageId];
    if (existing) {
      if (existing.thread_id !== String(metadata.thread_id) ||
          existing.stable_thread_key !== String(metadata.stable_thread_key)) {
        throw new WorkOsAppError(
          'E_MESSAGE_ID_CONFLICT',
          'MESSAGE_STATE',
          false,
          'Message ID縺ｫ蟇ｾ蠢懊☆繧玖ｭ伜挨諠・ｱ縺御ｸ閾ｴ縺励∪縺帙ｓ縲・
        );
      }
      return { operation: 'NOOP', record: existing };
    }
    var timestamp = nowValue || WorkOsUtilities.now();
    var row = emptyPhysicalRow(context);
    var record = {
      row: row,
      message_id: String(metadata.message_id),
      thread_id: String(metadata.thread_id),
      stable_thread_key: String(metadata.stable_thread_key),
      received_at: metadata.received_at,
      discovered_at: timestamp,
      source_mode: String(metadata.source_mode || 'MANUAL'),
      processing_status: STATUSES.DISCOVERED,
      resume_stage: RESUME_STAGES.PREPROCESS,
      claimed_at: '',
      claim_run_id: '',
      preprocess_hash: '',
      classification_json: '',
      classification_hash: '',
      action_count: 0,
      retry_count: 0,
      next_retry_at: '',
      completed_at: '',
      last_error_code: '',
      last_error_at: '',
      schema_version: WorkOsConfig.SCHEMA_VERSION,
      updated_at: timestamp,
      classification_provenance_json: ''
    };
    storeRecord(context, record, true);
    return { operation: 'INSERTED', record: record };
  }

  function isStaleClaim(record, nowValue) {
    if (record.processing_status !== STATUSES.CLAIMED ||
        !(record.claimed_at instanceof Date)) {
      return false;
    }
    return nowValue.getTime() - record.claimed_at.getTime() >
      WorkOsConfig.MESSAGE_STALE_CLAIM_MS;
  }

  function claimInContext(metadata, runId, context, nowValue) {
    assertLocked(context);
    var normalizedRunId = assertRunId(runId);
    var timestamp = nowValue || WorkOsUtilities.now();
    var discovered = discoverInContext(metadata, context, timestamp);
    var record = discovered.record;
    if (record.processing_status === STATUSES.PREPROCESSED ||
        record.processing_status === STATUSES.CLASSIFIED ||
        record.processing_status === STATUSES.TASKS_WRITTEN ||
        record.processing_status === STATUSES.CALENDAR_PENDING ||
        record.processing_status === STATUSES.DONE ||
        record.processing_status === STATUSES.SKIPPED ||
        record.processing_status === STATUSES.DEAD) {
      return {
        claimed: false,
        reason: 'ALREADY_CHECKPOINTED',
        record: record
      };
    }
    if (record.processing_status === STATUSES.CLAIMED &&
        !isStaleClaim(record, timestamp)) {
      return {
        claimed: false,
        reason: 'ACTIVE_CLAIM',
        record: record
      };
    }
    if (record.processing_status === STATUSES.RETRY &&
        record.next_retry_at instanceof Date &&
        record.next_retry_at.getTime() > timestamp.getTime()) {
      return {
        claimed: false,
        reason: 'RETRY_NOT_READY',
        record: record
      };
    }
    var updat…3234 tokens truncated…nction createClassificationLeaseInContext(
    messageId,
    runId,
    context,
    taskVersions
  ) {
    assertLocked(context);
    var normalizedRunId = assertRunId(runId);
    var record = context.byMessageId[String(messageId || '')];
    if (!record ||
        record.processing_status !== STATUSES.CLAIMED ||
        record.claim_run_id !== normalizedRunId ||
        record.resume_stage !== RESUME_STAGES.CLASSIFY ||
        !/^[0-9a-f]{64}$/.test(String(record.preprocess_hash || '')) ||
        dateMilliseconds(record.updated_at) < 0 ||
        record.classification_json) {
      throw new WorkOsAppError(
        'E_AI_STALE_RESULT',
        'AI_CLASSIFY',
        true,
        'AI蛻・｡柩ease繧剃ｽ懈・縺ｧ縺阪ｋMessage checkpoint縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・
      );
    }
    return Object.freeze({
      message_id: String(record.message_id),
      run_id: normalizedRunId,
      resume_stage: RESUME_STAGES.CLASSIFY,
      preprocess_hash: String(record.preprocess_hash),
      claimed_updated_at_ms: dateMilliseconds(record.updated_at),
      active_task_versions: Object.freeze(
        normalizeTaskVersions(taskVersions)
      ),
      input_hash: ''
    });
  }

  function attachClassificationInputHash(lease, inputHash) {
    var normalizedHash = String(inputHash || '').toLowerCase();
    if (!lease || !/^[0-9a-f]{64}$/.test(normalizedHash)) {
      throw new WorkOsAppError(
        'E_AI_INPUT_CONFLICT',
        'AI_CLASSIFY',
        true,
        'AI蛻・｡柩ease縺ｮinput hash縺御ｸ肴ｭ｣縺ｧ縺吶・
      );
    }
    return Object.freeze({
      message_id: lease.message_id,
      run_id: lease.run_id,
      resume_stage: lease.resume_stage,
      preprocess_hash: lease.preprocess_hash,
      claimed_updated_at_ms: lease.claimed_updated_at_ms,
      active_task_versions: Object.freeze(
        normalizeTaskVersions(lease.active_task_versions)
      ),
      input_hash: normalizedHash
    });
  }

  function inspectClassificationLeaseInContext(
    lease,
    context,
    currentTaskVersions,
    inputHash
  ) {
    assertLocked(context);
    var record = lease &&
      context.byMessageId[String(lease.message_id || '')];
    var reasons = [];
    if (!record ||
        record.processing_status !== STATUSES.CLAIMED ||
        record.claim_run_id !== String(lease && lease.run_id || '') ||
        record.resume_stage !== RESUME_STAGES.CLASSIFY) {
      reasons.push('CLAIM_CHANGED');
    }
    if (record && String(record.preprocess_hash || '') !==
        String(lease && lease.preprocess_hash || '')) {
      reasons.push('PREPROCESS_HASH_CHANGED');
    }
    if (record && dateMilliseconds(record.updated_at) !==
        Number(lease && lease.claimed_updated_at_ms)) {
      reasons.push('CLAIM_VERSION_CHANGED');
    }
    if (record && record.classification_json) {
      reasons.push('CLASSIFICATION_ALREADY_PRESENT');
    }
    var expectedTasks;
    var actualTasks;
    try {
      expectedTasks = normalizeTaskVersions(
        lease && lease.active_task_versions
      );
      actualTasks = normalizeTaskVersions(currentTaskVersions);
      if (JSON.stringify(expectedTasks) !== JSON.stringify(actualTasks)) {
        reasons.push('TASK_VERSION_CHANGED');
      }
    } catch (error) {
      reasons.push('TASK_VERSION_INVALID');
    }
    var normalizedInputHash = String(inputHash || '').toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(normalizedInputHash) ||
        normalizedInputHash !== String(lease && lease.input_hash || '')) {
      reasons.push('INPUT_HASH_CHANGED');
    }
    return {
      valid: reasons.length === 0,
      reasons: reasons
    };
  }

  function commitClassificationLeaseInContext(
    lease,
    classification,
    provenance,
    context,
    currentTaskVersions,
    inputHash,
    nowValue
  ) {
    var inspection = inspectClassificationLeaseInContext(
      lease,
      context,
      currentTaskVersions,
      inputHash
    );
    if (!inspection.valid) {
      throw new WorkOsAppError(
        inspection.reasons.indexOf('TASK_VERSION_CHANGED') !== -1 ||
          inspection.reasons.indexOf('PREPROCESS_HASH_CHANGED') !== -1 ||
          inspection.reasons.indexOf('INPUT_HASH_CHANGED') !== -1
          ? 'E_AI_INPUT_CONFLICT'
          : 'E_AI_STALE_RESULT',
        'AI_CLASSIFY',
        true,
        'AI蛻・｡樔ｸｭ縺ｫ蜈･蜉帙∪縺溘・謇譛画ｨｩ縺悟､峨ｏ縺｣縺溘◆繧∫ｵ先棡繧剃ｿ晏ｭ倥＠縺ｾ縺帙ｓ縺ｧ縺励◆縲・
      );
    }
    return checkpointClassificationInContext(
      lease.message_id,
      lease.run_id,
      classification,
      context,
      nowValue,
      provenance
    );
  }

  function checkpointTasksWrittenInContext(
    messageId,
    runId,
    context,
    nowValue
  ) {
    assertLocked(context);
    var normalizedRunId = assertRunId(runId);
    var record = context.byMessageId[String(messageId || '')];
    if (!record) {
      throw new WorkOsAppError(
        'E_MESSAGE_STATE_NOT_FOUND',
        'TASK_WRITE',
        false,
        'Message State縺後≠繧翫∪縺帙ｓ縲・
      );
    }
    if (record.processing_status === STATUSES.TASKS_WRITTEN) {
      return { operation: 'NOOP', record: record };
    }
    if ([STATUSES.CLASSIFIED, STATUSES.CLAIMED]
        .indexOf(record.processing_status) === -1 ||
        record.claim_run_id !== normalizedRunId ||
        record.resume_stage !== RESUME_STAGES.TASK_WRITE) {
      throw new WorkOsAppError(
        'E_MESSAGE_CLAIM_CONFLICT',
        'TASK_WRITE',
        true,
        'Task checkpoint菫晏ｭ俶凾縺ｮMessage迥ｶ諷九′荳閾ｴ縺励∪縺帙ｓ縲・
      );
    }
    var timestamp = nowValue || WorkOsUtilities.now();
    var updated = {};
    Object.keys(record).forEach(function (key) { updated[key] = record[key]; });
    updated.processing_status = STATUSES.TASKS_WRITTEN;
    updated.resume_stage = RESUME_STAGES.FINALIZE;
    updated.updated_at = timestamp;
    storeRecord(context, updated, false);
    return { operation: 'UPDATED', record: updated };
  }

  /**
   * Persist the boundary between Gmail/AI/Task work and Calendar work.
   *
   * The claim is deliberately released. A Calendar retry can therefore resume
   * from this checkpoint without refetching Gmail, invoking AI or rewriting a
   * Task.
   */
  function checkpointCalendarPendingInContext(
    messageId,
    runId,
    context,
    nowValue
  ) {
    assertLocked(context);
    var normalizedRunId = assertRunId(runId);
    var record = context.byMessageId[String(messageId || '')];
    if (!record) {
      throw new WorkOsAppError(
        'E_MESSAGE_STATE_NOT_FOUND',
        'CALENDAR_CHECKPOINT',
        false,
        'Message State縺後≠繧翫∪縺帙ｓ縲・
      );
    }
    if (record.processing_status === STATUSES.CALENDAR_PENDING &&
        record.resume_stage === RESUME_STAGES.CALENDAR) {
      return { operation: 'NOOP', record: record };
    }
    if ([STATUSES.TASKS_WRITTEN, STATUSES.CLAIMED]
        .indexOf(record.processing_status) === -1 ||
        record.claim_run_id !== normalizedRunId ||
        record.resume_stage !== RESUME_STAGES.FINALIZE) {
      throw new WorkOsAppError(
        'E_MESSAGE_CLAIM_CONFLICT',
        'CALENDAR_CHECKPOINT',
        true,
        'Calendar checkpoint菫晏ｭ俶凾縺ｮMessage迥ｶ諷九′荳閾ｴ縺励∪縺帙ｓ縲・
      );
    }
    var timestamp = nowValue || WorkOsUtilities.now();
    var updated = {};
    Object.keys(record).forEach(function (key) { updated[key] = record[key]; });
    updated.processing_status = STATUSES.CALENDAR_PENDING;
    updated.resume_stage = RESUME_STAGES.CALENDAR;
    updated.claimed_at = '';
    updated.claim_run_id = '';
    /*
     * Retry allowance is stage-local. A recovered Gmail/AI failure must not
     * make the first Calendar failure exhaust the Message retry allowance.
     * Subsequent CALENDAR resumes do not pass this transition again.
     */
    updated.retry_count = 0;
    updated.next_retry_at = '';
    updated.last_error_code = '';
    updated.last_error_at = '';
    updated.completed_at = '';
    updated.updated_at = timestamp;
    storeRecord(context, updated, false);
    return { operation: 'UPDATED', record: updated };
  }

  function checkpointDoneInContext(messageId, runId, context, nowValue) {
    assertLocked(context);
    var normalizedRunId = assertRunId(runId);
    var record = context.byMessageId[String(messageId || '')];
    if (!record) {
      throw new WorkOsAppError(
        'E_MESSAGE_STATE_NOT_FOUND',
        'FINALIZE',
        false,
        'Message State縺後≠繧翫∪縺帙ｓ縲・
      );
    }
    if (record.processing_status === STATUSES.DONE) {
      return { operation: 'NOOP', record: record };
    }
    if ([STATUSES.TASKS_WRITTEN, STATUSES.CALENDAR_PENDING, STATUSES.CLAIMED]
        .indexOf(record.processing_status) === -1 ||
        record.claim_run_id !== normalizedRunId ||
        [RESUME_STAGES.FINALIZE, RESUME_STAGES.CALENDAR]
          .indexOf(record.resume_stage) === -1) {
      throw new WorkOsAppError(
        'E_MESSAGE_CLAIM_CONFLICT',
        'FINALIZE',
        true,
        'DONE菫晏ｭ俶凾縺ｮMessage迥ｶ諷九′荳閾ｴ縺励∪縺帙ｓ縲・
      );
    }
    var timestamp = nowValue || WorkOsUtilities.now();
    var updated = {};
    Object.keys(record).forEach(function (key) { updated[key] = record[key]; });
    updated.processing_status = STATUSES.DONE;
    updated.resume_stage = RESUME_STAGES.DONE;
    updated.completed_at = timestamp;
    updated.last_error_code = '';
    updated.last_error_at = '';
    updated.next_retry_at = '';
    updated.updated_at = timestamp;
    storeRecord(context, updated, false);
    return { operation: 'UPDATED', record: updated };
  }

  function markSkippedInContext(metadata, runId, context, nowValue) {
    assertLocked(context);
    var normalizedRunId = assertRunId(runId);
    var timestamp = nowValue || WorkOsUtilities.now();
    var discovered = discoverInContext(metadata, context, timestamp);
    var record = discovered.record;
    if (record.processing_status === STATUSES.SKIPPED) {
      return { operation: 'NOOP', record: record };
    }
    if (record.processing_status === STATUSES.DONE ||
        record.processing_status === STATUSES.DEAD) {
      return { operation: 'NOOP', record: record };
    }
    var updated = {};
    Object.keys(record).forEach(function (key) { updated[key] = record[key]; });
    updated.processing_status = STATUSES.SKIPPED;
    updated.resume_stage = STATUSES.SKIPPED;
    updated.claim_run_id = normalizedRunId;
    updated.next_retry_at = '';
    updated.last_error_code = '';
    updated.last_error_at = '';
    updated.completed_at = timestamp;
    updated.updated_at = timestamp;
    storeRecord(context, updated, false);
    return { operation: 'UPDATED', record: updated };
  }

  function recordFailureInContext(
    messageId,
    runId,
    error,
    context,
    nowValue
  ) {
    assertLocked(context);
    var normalizedRunId = assertRunId(runId);
    var record = context.byMessageId[String(messageId || '')];
    if (!record) {
      throw new WorkOsAppError(
        'E_MESSAGE_STATE_NOT_FOUND',
        'MESSAGE_FAILURE',
        false,
        'Message State縺後↑縺・◆繧∝､ｱ謨幼heckpoint繧剃ｿ晏ｭ倥〒縺阪∪縺帙ｓ縲・
      );
    }
    if ([STATUSES.CLAIMED, STATUSES.PREPROCESSED, STATUSES.CLASSIFIED,
      STATUSES.TASKS_WRITTEN].indexOf(record.processing_status) === -1 ||
        record.claim_run_id !== normalizedRunId) {
      throw new WorkOsAppError(
        'E_MESSAGE_CLAIM_CONFLICT',
        'MESSAGE_FAILURE',
        true,
        'Message claim縺御ｸ閾ｴ縺励↑縺・◆繧∝､ｱ謨幼heckpoint繧剃ｿ晏ｭ倥＠縺ｾ縺帙ｓ縺ｧ縺励◆縲・
      );
    }
    var timestamp = nowValue || WorkOsUtilities.now();
    var safe = WorkOsUtilities.safeError(error, 'MANUAL_IMPORT');
    /*
     * retry_count is the number of retries scheduled after the initial
     * failure. Keep all three documented delays reachable and move to DEAD
     * only when the third retry itself also fails.
     */
    var priorRetryCount = Number(record.retry_count || 0);
    var isDead = !safe.retryable || priorRetryCount >= MAX_RETRIES;
    var retryCount = isDead ? priorRetryCount : priorRetryCount + 1;
    var updated = {};
    Object.keys(record).forEach(function (key) { updated[key] = record[key]; });
    updated.processing_status = isDead ? STATUSES.DEAD : STATUSES.RETRY;
    updated.retry_count = retryCount;
    updated.next_retry_at = isDead
      ? ''
      : new Date(timestamp.getTime() + RETRY_DELAYS_MS[retryCount - 1]);
    updated.completed_at = isDead ? timestamp : '';
    updated.last_error_code = safe.code;
    updated.last_error_at = timestamp;
    updated.updated_at = timestamp;
    storeRecord(context, updated, false);
    return { operation: 'UPDATED', record: updated, safe_error: safe };
  }

  function stableStatusForResumeStage(resumeStage) {
    if (resumeStage === RESUME_STAGES.PREPROCESS) {
      return STATUSES.DISCOVERED;
    }
    if (resumeStage === RESUME_STAGES.CLASSIFY) {
      return STATUSES.PREPROCESSED;
    }
    if (resumeStage === RESUME_STAGES.TASK_WRITE) {
      return STATUSES.CLASSIFIED;
    }
    if (resumeStage === RESUME_STAGES.FINALIZE) {
      return STATUSES.TASKS_WRITTEN;
    }
    if (resumeStage === RESUME_STAGES.CALENDAR) {
      return STATUSES.CALENDAR_PENDING;
    }
    throw new WorkOsAppError(
      'E_MESSAGE_CHECKPOINT_CONFLICT',
      'MESSAGE_BUDGET_PAUSE',
      false,
      'soft budget蛛懈ｭ｢譎ゅ・resume stage縺御ｸ肴ｭ｣縺ｧ縺吶・
    );
  }

  function checkpointStageForResumeStage(resumeStage) {
    if (resumeStage === RESUME_STAGES.PREPROCESS) {
      return CHECKPOINT_STAGES.CLAIMED;
    }
    if (resumeStage === RESUME_STAGES.CLASSIFY) {
      return CHECKPOINT_STAGES.PREPROCESSED;
    }
    if (resumeStage === RESUME_STAGES.TASK_WRITE) {
      return CHECKPOINT_STAGES.CLASSIFIED;
    }
    if (resumeStage === RESUME_STAGES.FINALIZE) {
      return CHECKPOINT_STAGES.TASK_APPLIED;
    }
    if (resumeStage === RESUME_STAGES.CALENDAR) {
      return CHECKPOINT_STAGES.CALENDAR_PENDING;
    }
    if (resumeStage === RESUME_STAGES.DONE) {
      return CHECKPOINT_STAGES.DONE;
    }
    throw new WorkOsAppError(
      'E_MESSAGE_CHECKPOINT_CONFLICT',
      'STATE_WRITE',
      false,
      'Message State縺ｮresume stage縺御ｸ肴ｭ｣縺ｧ縺吶・
    );
  }

  function requestManualRetryInContext(
    messageId,
    checkpointStage,
    context,
    nowValue
  ) {
    assertLocked(context);
    var record = context.byMessageId[String(messageId || '')];
    if (!record) {
      throw new WorkOsAppError(
        'E_MESSAGE_STATE_NOT_FOUND',
        'STATE_WRITE',
        false,
        '謇句虚蜀榊ｮ溯｡悟ｯｾ雎｡縺ｮMessage State縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縲・
      );
    }
    if (record.processing_status !== STATUSES.DEAD) {
      if (record.processing_status === STATUSES.RETRY) {
        return { operation: 'NOOP', record: record };
      }
      throw new WorkOsAppError(
        'E_MESSAGE_STATE_RETRY_CONFLICT',
        'STATE_WRITE',
        false,
        'DEAD迥ｶ諷九〒縺ｯ縺ｪ縺Мessage縺ｯ謇句虚蜀榊ｮ溯｡後〒縺阪∪縺帙ｓ縲・
      );
    }
    var expectedCheckpoint = checkpointStageForResumeStage(
      record.resume_stage
    );
    if (String(checkpointStage || '') !== expectedCheckpoint ||
        expectedCheckpoint === CHECKPOINT_STAGES.DONE) {
      throw new WorkOsAppError(
        'E_MESSAGE_CHECKPOINT_CONFLICT',
        'STATE_WRITE',
        false,
        'Dead Letter縺ｨMessage State縺ｮ蜀埼幕谿ｵ髫弱′荳閾ｴ縺励∪縺帙ｓ縲・
      );
    }
    var timestamp = nowValue instanceof Date
      ? nowValue
      : WorkOsUtilities.now();
    var updated = {};
    Object.keys(record).forEach(function (key) {
      updated[key] = record[key];
    });
    updated.processing_status = STATUSES.RETRY;
    updated.claimed_at = '';
    updated.claim_run_id = '';
    updated.next_retry_at = timestamp;
    updated.completed_at = '';
    updated.updated_at = timestamp;
    storeRecord(context, updated, false);
    return { operation: 'UPDATED', record: updated };
  }

  /**
   * Release only the current claim and return to the last durable checkpoint.
   * A soft-budget pause is not a processing failure and must never consume the
   * three-retry allowance or turn an otherwise healthy Message DEAD.
   */
  function pauseForBudgetInContext(
    messageId,
    runId,
    context,
    nowValue
  ) {
    assertLocked(context);
    var normalizedRunId = assertRunId(runId);
    var record = context.byMessageId[String(messageId || '')];
    if (!record) {
      throw new WorkOsAppError(
        'E_MESSAGE_STATE_NOT_FOUND',
        'MESSAGE_BUDGET_PAUSE',
        false,
        'Message State縺後↑縺・◆繧｜udget蛛懈ｭ｢繧剃ｿ晏ｭ倥〒縺阪∪縺帙ｓ縲・
      );
    }
    if (record.processing_status !== STATUSES.CLAIMED ||
        record.claim_run_id !== normalizedRunId) {
      throw new WorkOsAppError(
        'E_MESSAGE_CLAIM_CONFLICT',
        'MESSAGE_BUDGET_PAUSE',
        true,
        'Message claim縺御ｸ閾ｴ縺励↑縺・◆繧｜udget蛛懈ｭ｢繧剃ｿ晏ｭ倥＠縺ｾ縺帙ｓ縺ｧ縺励◆縲・
      );
    }
    var timestamp = nowValue || WorkOsUtilities.now();
    var updated = {};
    Object.keys(record).forEach(function (key) { updated[key] = record[key]; });
    updated.processing_status = stableStatusForResumeStage(
      record.resume_stage
    );
    updated.claimed_at = '';
    updated.claim_run_id = '';
    updated.next_retry_at = '';
    updated.updated_at = timestamp;
    storeRecord(context, updated, false);
    return { operation: 'UPDATED', record: updated };
  }

  function getByMessageId(context, messageId) {
    return context.byMessageId[String(messageId || '')] || null;
  }

  return Object.freeze({
    STATUSES: STATUSES,
    RESUME_STAGES: RESUME_STAGES,
    CHECKPOINT_STAGES: CHECKPOINT_STAGES,
    createContext: createContext,
    withLockedContext: withLockedContext,
    createContextForHeldLock: createContextForHeldLock,
    discoverInContext: discoverInContext,
    claimInContext: claimInContext,
    checkpointPreprocessedInContext: checkpointPreprocessedInContext,
    createPreprocessLeaseInContext: createPreprocessLeaseInContext,
    inspectPreprocessLeaseInContext: inspectPreprocessLeaseInContext,
    commitPreprocessedLeaseInContext: commitPreprocessedLeaseInContext,
    createFinalizeLeaseInContext: createFinalizeLeaseInContext,
    inspectFinalizeLeaseInContext: inspectFinalizeLeaseInContext,
    commitFinalizeLeaseInContext: commitFinalizeLeaseInContext,
    createClassificationLeaseInContext:
      createClassificationLeaseInContext,
    attachClassificationInputHash: attachClassificationInputHash,
    inspectClassificationLeaseInContext:
      inspectClassificationLeaseInContext,
    commitClassificationLeaseInContext:
      commitClassificationLeaseInContext,
    claimForResumeInContext: claimForResumeInContext,
    checkpointClassificationInContext: checkpointClassificationInContext,
    checkpointTasksWrittenInContext: checkpointTasksWrittenInContext,
    checkpointCalendarPendingInContext: checkpointCalendarPendingInContext,
    checkpointDoneInContext: checkpointDoneInContext,
    markSkippedInContext: markSkippedInContext,
    recordFailureInContext: recordFailureInContext,
    checkpointStageForResumeStage: checkpointStageForResumeStage,
    requestManualRetryInContext: requestManualRetryInContext,
    pauseForBudgetInContext: pauseForBudgetInContext,
    getByMessageId: getByMessageId,
    isStaleClaim: isStaleClaim,
    messageSheet: messageSheet
  });
}());

