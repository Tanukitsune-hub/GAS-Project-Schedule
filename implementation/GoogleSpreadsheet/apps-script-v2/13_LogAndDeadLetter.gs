/**
 * Allowlist-only operational logging, retry policy and Dead Letter handling.
 *
 * No function in this module accepts or stores a subject, sender, body,
 * attachment, request payload, credential or stack trace.
 */
var WorkOsLogAndDeadLetter = (function () {
  var INTERNAL_RETRY_CAPABILITY = {};
  var PROVIDER_FAILURE_STATE_PROPERTY =
    'WORK_OS_V2_AI_PROVIDER_FAILURE_STATE';
  var PROVIDER_FAILURE_COUNT_MAX = 1000;
  var SUBSYSTEMS = Object.freeze([
    'GMAIL_SEARCH',
    'GMAIL_READ',
    'GMAIL_LABEL',
    'PREPROCESS',
    'AI_REQUEST',
    'AI_RESPONSE',
    'TASK_UPSERT',
    'REVIEW_APPLY',
    'CALENDAR_CREATE',
    'CALENDAR_UPDATE',
    'CALENDAR_DELETE',
    'STATE_WRITE',
    'TRIGGER',
    'DIAGNOSTIC'
  ]);
  var CHECKPOINT_STAGES = Object.freeze([
    'CLAIMED',
    'PREPROCESSED',
    'CLASSIFIED',
    'TASK_APPLIED',
    'CALENDAR_PENDING',
    'DONE'
  ]);

  function normalizedSubsystem(value, safe) {
    var requested = String(value || '').toUpperCase();
    if (SUBSYSTEMS.indexOf(requested) !== -1) {
      return requested;
    }
    var text = String(safe && safe.stage || '') + ' ' +
      String(safe && safe.code || '');
    if (/GMAIL.*SEARCH|AUTOMATIC_SCAN/.test(text)) {
      return 'GMAIL_SEARCH';
    }
    if (/GMAIL.*LABEL|ERROR_LABEL/.test(text)) {
      return 'GMAIL_LABEL';
    }
    if (/GMAIL/.test(text)) {
      return 'GMAIL_READ';
    }
    if (/PREPROCESS/.test(text)) {
      return 'PREPROCESS';
    }
    if (/AI/.test(text)) {
      return /JSON|SCHEMA|RESPONSE|EMPTY|ACTION/.test(text)
        ? 'AI_RESPONSE'
        : 'AI_REQUEST';
    }
    if (/REVIEW/.test(text)) {
      return 'REVIEW_APPLY';
    }
    if (/TASK/.test(text)) {
      return 'TASK_UPSERT';
    }
    if (/CALENDAR/.test(text)) {
      if (/DELETE/.test(text)) {
        return 'CALENDAR_DELETE';
      }
      if (/UPDATE/.test(text)) {
        return 'CALENDAR_UPDATE';
      }
      return 'CALENDAR_CREATE';
    }
    if (/TRIGGER|AUTOMATION_ENABLE|AUTOMATION_DISABLE/.test(text)) {
      return 'TRIGGER';
    }
    if (/DIAGNOSTIC/.test(text)) {
      return 'DIAGNOSTIC';
    }
    return 'STATE_WRITE';
  }

  function normalizedCheckpoint(value, subsystem) {
    var requested = String(value || '').toUpperCase();
    if (CHECKPOINT_STAGES.indexOf(requested) !== -1) {
      return requested;
    }
    if (subsystem === 'GMAIL_READ' ||
        subsystem === 'GMAIL_LABEL' ||
        subsystem === 'PREPROCESS') {
      return 'CLAIMED';
    }
    if (subsystem === 'AI_REQUEST' || subsystem === 'AI_RESPONSE') {
      return 'PREPROCESSED';
    }
    if (subsystem === 'TASK_UPSERT' || subsystem === 'REVIEW_APPLY') {
      return 'CLASSIFIED';
    }
    if (/^CALENDAR_/.test(subsystem)) {
      return 'CALENDAR_PENDING';
    }
    return 'CLAIMED';
  }

  function classifyErrorCategory(safe, subsystem) {
    var code = String(safe.code || '');
    if (subsystem === 'AI_REQUEST' &&
        /TIMEOUT|RATE_LIMIT|UPSTREAM|NETWORK/.test(code)) {
      return 'PROVIDER_TRANSIENT';
    }
    if (/TIMEOUT|RATE_LIMIT|UPSTREAM|FETCH|SERVICE|LOCK/.test(code)) {
      return 'SERVICE_TRANSIENT';
    }
    if (/AUTH|CREDENTIAL/.test(code)) {
      return 'AUTH_CONFIGURATION';
    }
    if (/PERMISSION|APPROVAL|POLICY/.test(code)) {
      return 'PERMISSION_POLICY';
    }
    if ((subsystem === 'AI_REQUEST' || subsystem === 'AI_RESPONSE') &&
        /PROVIDER.*(?:NOT_REGISTERED|REGISTRY)|NOT_CONFIGURED|TRANSPORT_NOT_IMPLEMENTED|INVALID_REQUEST/.test(code)) {
      return 'PROVIDER_CONFIGURATION';
    }
    if (/JSON|AI_SCHEMA|RESPONSE|MODEL_UNSUPPORTED/.test(code)) {
      return 'INVALID_RESPONSE';
    }
    if (/SCHEMA|INVALID_ENUM|V1|MISSING_COLUMN|CONFLICT|NOT_FOUND/.test(code)) {
      return 'DATA_OR_SCHEMA';
    }
    return safe.retryable ? 'SERVICE_TRANSIENT' : 'UNKNOWN_NON_RETRYABLE';
  }

  function retryPolicy(error, metadata) {
    var value = metadata || {};
    var safe = WorkOsUtilities.safeError(
      error,
      String(value.fallback_stage || 'STATE_WRITE')
    );
    var subsystem = normalizedSubsystem(value.subsystem, safe);
    var category = classifyErrorCategory(safe, subsystem);
    var retryable = safe.retryable === true &&
      category !== 'AUTH_CONFIGURATION' &&
      category !== 'PERMISSION_POLICY' &&
      category !== 'INVALID_RESPONSE' &&
      category !== 'DATA_OR_SCHEMA' &&
      category !== 'UNKNOWN_NON_RETRYABLE';
    return Object.freeze({
      code: safe.code,
      stage: safe.stage,
      subsystem: subsystem,
      error_category: category,
      retryable: retryable,
      retry_delays_minutes: WorkOsConfig.RETRY_DELAYS_MINUTES.slice(),
      max_attempts: WorkOsConfig.RETRY_MAX_ATTEMPTS,
      resume_stage: normalizedCheckpoint(
        value.resume_stage,
        subsystem
      ),
      user_action: retryable
        ? 'REVIEW_AND_RETRY'
        : 'RESOLVE_CONFIGURATION_OR_DATA'
    });
  }

  function safeProviderKey(value) {
    var normalized = String(value || '').trim().toUpperCase();
    if (!normalized) {
      return '';
    }
    if (/^[A-Z0-9][A-Z0-9._-]{0,79}$/.test(normalized)) {
      return normalized;
    }
    return 'PROVIDERREF_' + WorkOsUtilities.sha256Hex(
      'v2|provider-key|' + normalized
    );
  }

  function safeProviderRunId(value) {
    var normalized = String(value || '').trim();
    if (!normalized) {
      return '';
    }
    if (/^[A-Za-z0-9_-]{1,80}$/.test(normalized)) {
      return normalized;
    }
    return 'runref_' + WorkOsUtilities.sha256Hex(
      'v2|provider-run-reference|' + normalized
    );
  }

  function safeProviderMessageReference(metadata) {
    var value = metadata || {};
    var supplied = String(value.safe_message_reference || '').trim();
    if (/^msgref_[0-9a-f]{64}$/.test(supplied)) {
      return supplied;
    }
    return hashedExternalReference('msgref_', value.message_id);
  }

  function providerStateTimestamp(value) {
    var date = new Date(String(value || ''));
    return isNaN(date.getTime()) ? null : date;
  }

  function readProviderFailureState(properties) {
    var raw = String(properties.getProperty(
      PROVIDER_FAILURE_STATE_PROPERTY
    ) || '');
    if (!raw) {
      return { present: false, invalid: false, state: null };
    }
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || Array.isArray(parsed) ||
          typeof parsed !== 'object') {
        throw new Error('E_PROVIDER_STATE_OBJECT');
      }
      var providerKey = String(parsed.provider_key || '');
      var category = String(parsed.error_category || '');
      var timestamp = String(parsed.last_outcome_at || '');
      var failureCount = Number(parsed.consecutive_failure_count);
      var suppressionUntil = String(parsed.suppression_until || '');
      var runId = String(parsed.run_id || '');
      var messageReference = String(
        parsed.safe_message_reference || ''
      );
      if ((providerKey &&
           !/^[A-Z0-9][A-Z0-9._-]{0,79}$/.test(providerKey)) ||
          !WorkOsUtilities.isSafeIdentifier(category) ||
          !providerStateTimestamp(timestamp) ||
          !Number.isInteger(failureCount) ||
          failureCount < 0 ||
          failureCount > PROVIDER_FAILURE_COUNT_MAX ||
          (suppressionUntil &&
           !providerStateTimestamp(suppressionUntil)) ||
          (runId && !/^[A-Za-z0-9_-]{1,80}$/.test(runId)) ||
          (messageReference &&
           !/^msgref_[0-9a-f]{64}$/.test(messageReference))) {
        throw new Error('E_PROVIDER_STATE_FIELDS');
      }
      return {
        present: true,
        invalid: false,
        state: {
          provider_key: providerKey,
          error_category: category,
          last_outcome_at: timestamp,
          consecutive_failure_count: failureCount,
          suppression_until: suppressionUntil,
          run_id: runId,
          safe_message_reference: messageReference
        }
      };
    } catch (error) {
      return { present: true, invalid: true, state: null };
    }
  }

  function writeProviderFailureState(properties, state) {
    var safeState = {
      provider_key: safeProviderKey(state.provider_key),
      error_category: WorkOsUtilities.safeIdentifier(
        state.error_category,
        'UNKNOWN_NON_RETRYABLE'
      ),
      last_outcome_at: new Date(state.last_outcome_at).toISOString(),
      consecutive_failure_count: Math.min(
        PROVIDER_FAILURE_COUNT_MAX,
        Math.max(0, Number(state.consecutive_failure_count || 0))
      ),
      suppression_until: state.suppression_until
        ? new Date(state.suppression_until).toISOString()
        : '',
      run_id: safeProviderRunId(state.run_id),
      safe_message_reference: safeProviderMessageReference({
        safe_message_reference: state.safe_message_reference
      })
    };
    properties.setProperty(
      PROVIDER_FAILURE_STATE_PROPERTY,
      JSON.stringify(safeState)
    );
    return safeState;
  }

  function noteProviderFailure(error, properties, nowValue, metadata) {
    var value = metadata || {};
    var policy = retryPolicy(error, { subsystem: 'AI_REQUEST' });
    var timestamp = nowValue instanceof Date
      ? nowValue
      : WorkOsUtilities.now();
    var providerKey = safeProviderKey(
      value.provider_key || value.provider_token
    );
    var runId = safeProviderRunId(value.run_id);
    var messageReference = safeProviderMessageReference(value);
    var priorRead = readProviderFailureState(properties);
    var prior = priorRead.invalid ? null : priorRead.state;
    var priorTimestamp = prior &&
      providerStateTimestamp(prior.last_outcome_at);
    if (policy.error_category !== 'PROVIDER_TRANSIENT' ||
        policy.retryable !== true) {
      var preservedUntil = prior && prior.suppression_until
        ? providerStateTimestamp(prior.suppression_until)
        : '';
      return {
        suppressed: Boolean(
          preservedUntil &&
          preservedUntil.getTime() > timestamp.getTime()
        ),
        until: preservedUntil || '',
        error_category: policy.error_category,
        consecutive_failure_count: prior
          ? Number(prior.consecutive_failure_count || 0)
          : 0,
        duplicate: false,
        stale: false,
        ignored: true
      };
    }
    if (prior && runId && prior.run_id === runId) {
      var duplicateUntil = prior.suppression_until
        ? providerStateTimestamp(prior.suppression_until)
        : '';
      return {
        suppressed: policy.error_category === 'PROVIDER_TRANSIENT' &&
          policy.retryable &&
          Boolean(duplicateUntil &&
            duplicateUntil.getTime() > timestamp.getTime()),
        until: duplicateUntil || '',
        error_category: prior.error_category,
        consecutive_failure_count:
          prior.consecutive_failure_count,
        duplicate: true,
        stale: false
      };
    }
    if (priorTimestamp &&
        priorTimestamp.getTime() > timestamp.getTime()) {
      var staleUntil = prior.suppression_until
        ? providerStateTimestamp(prior.suppression_until)
        : '';
      return {
        suppressed: Boolean(
          staleUntil && staleUntil.getTime() > timestamp.getTime()
        ),
        until: staleUntil || '',
        error_category: prior.error_category,
        consecutive_failure_count:
          prior.consecutive_failure_count,
        duplicate: false,
        stale: true
      };
    }
    var sameProvider = prior &&
      prior.error_category !== 'PROVIDER_SUCCESS' &&
      String(prior.provider_key || '') === providerKey;
    var failureCount = Math.min(
      PROVIDER_FAILURE_COUNT_MAX,
      sameProvider
        ? Number(prior.consecutive_failure_count || 0) + 1
        : 1
    );
    var suppressed = policy.error_category === 'PROVIDER_TRANSIENT' &&
      policy.retryable;
    var until = suppressed
      ? new Date(
        timestamp.getTime() +
          WorkOsConfig.PROVIDER_FAILURE_SUPPRESSION_MS
      )
      : '';
    var stored = writeProviderFailureState(properties, {
      provider_key: providerKey,
      error_category: policy.error_category,
      last_outcome_at: timestamp,
      consecutive_failure_count: failureCount,
      suppression_until: until,
      run_id: runId,
      safe_message_reference: messageReference
    });
    if (suppressed) {
      properties.setProperty(
        WorkOsConfig.PROPERTIES.AI_PROVIDER_SUPPRESS_UNTIL,
        stored.suppression_until
      );
    } else {
      properties.deleteProperty(
        WorkOsConfig.PROPERTIES.AI_PROVIDER_SUPPRESS_UNTIL
      );
    }
    return {
      suppressed: suppressed,
      until: until,
      error_category: stored.error_category,
      consecutive_failure_count:
        stored.consecutive_failure_count,
      duplicate: false,
      stale: false
    };
  }

  function noteProviderSuccess(properties, nowValue, metadata) {
    var value = metadata || {};
    var timestamp = nowValue instanceof Date
      ? nowValue
      : WorkOsUtilities.now();
    var providerKey = safeProviderKey(
      value.provider_key || value.provider_token
    );
    var runId = safeProviderRunId(value.run_id);
    var messageReference = safeProviderMessageReference(value);
    var priorRead = readProviderFailureState(properties);
    var prior = priorRead.invalid ? null : priorRead.state;
    var priorTimestamp = prior &&
      providerStateTimestamp(prior.last_outcome_at);
    if (prior && runId && prior.run_id === runId &&
        prior.error_category === 'PROVIDER_SUCCESS') {
      return {
        reset: true,
        duplicate: true,
        stale: false,
        provider_mismatch: false
      };
    }
    if (priorTimestamp &&
        (priorTimestamp.getTime() > timestamp.getTime() ||
         (priorTimestamp.getTime() === timestamp.getTime() &&
          prior.error_category !== 'PROVIDER_SUCCESS'))) {
      return {
        reset: false,
        duplicate: false,
        stale: true,
        provider_mismatch: false
      };
    }
    if (prior && prior.provider_key && providerKey &&
        prior.provider_key !== providerKey) {
      return {
        reset: false,
        duplicate: false,
        stale: false,
        provider_mismatch: true
      };
    }
    writeProviderFailureState(properties, {
      provider_key: providerKey ||
        String(prior && prior.provider_key || ''),
      error_category: 'PROVIDER_SUCCESS',
      last_outcome_at: timestamp,
      consecutive_failure_count: 0,
      suppression_until: '',
      run_id: runId,
      safe_message_reference: messageReference
    });
    properties.deleteProperty(
      WorkOsConfig.PROPERTIES.AI_PROVIDER_SUPPRESS_UNTIL
    );
    return {
      reset: true,
      duplicate: false,
      stale: false,
      provider_mismatch: false
    };
  }

  function providerSuppressionStatus(properties, nowValue) {
    var raw = String(properties.getProperty(
      WorkOsConfig.PROPERTIES.AI_PROVIDER_SUPPRESS_UNTIL
    ) || '');
    var stateRead = readProviderFailureState(properties);
    if (stateRead.invalid) {
      return {
        active: true,
        until: '',
        invalid_state: true
      };
    }
    var state = stateRead.state;
    var stateUntil = state && state.suppression_until
      ? providerStateTimestamp(state.suppression_until)
      : null;
    var legacyUntil = raw ? providerStateTimestamp(raw) : null;
    if ((raw && !legacyUntil) ||
        (state && state.suppression_until && !stateUntil)) {
      return {
        active: true,
        until: '',
        invalid_state: true
      };
    }
    var until = legacyUntil;
    if (stateUntil &&
        (!until || stateUntil.getTime() > until.getTime())) {
      until = stateUntil;
    }
    var timestamp = nowValue instanceof Date
      ? nowValue
      : WorkOsUtilities.now();
    return {
      active: Boolean(until &&
        until.getTime() > timestamp.getTime()),
      until: until || '',
      provider_key: String(state && state.provider_key || ''),
      error_category: String(state && state.error_category || ''),
      consecutive_failure_count: Number(
        state && state.consecutive_failure_count || 0
      ),
      run_id: String(state && state.run_id || ''),
      safe_message_reference: String(
        state && state.safe_message_reference || ''
      )
    };
  }

  function hashedExternalReference(prefix, value) {
    var normalized = String(value || '').trim();
    if (!normalized) {
      return '';
    }
    return String(prefix) + WorkOsUtilities.sha256Hex(
      'v2|error-log-reference|' + String(prefix) + '|' + normalized
    );
  }

  function sheetFor(spreadsheet, sheetName) {
    var sheet = spreadsheet && spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      throw new WorkOsAppError(
        'E_SCHEMA_MISSING_SHEET',
        'LOG',
        false,
        '驕狗畑險倬鹸Sheet縺後≠繧翫∪縺帙ｓ縲・
      );
    }
    return sheet;
  }

  function errorOperatorProtection(sheet) {
    if (!sheet ||
        typeof sheet.getProtections !== 'function' ||
        typeof SpreadsheetApp === 'undefined' ||
        !SpreadsheetApp.ProtectionType) {
      return null;
    }
    var description = 'WORK_OS_V2_PHASE1_' +
      WorkOsConfig.SHEETS.ERRORS + '_SYSTEM_OWNED_EDIT_POLICY';
    var protections = sheet.getProtections(
      SpreadsheetApp.ProtectionType.SHEET
    ) || [];
    for (var index = 0; index < protections.length; index += 1) {
      if (typeof protections[index].getDescription === 'function' &&
          protections[index].getDescription() === description) {
        return protections[index];
      }
    }
    throw new WorkOsAppError(
      'E_ERROR_PROTECTION_MISSING',
      'STATE_WRITE',
      false,
      '繧ｨ繝ｩ繝ｼ繝ｻ蜀榊ｮ溯｡郡heet縺ｮProtection縺梧悴險ｭ螳壹・縺溘ａ陦梧僑蠑ｵ繧貞●豁｢縺励∪縺励◆縲・
    );
  }

  function extendErrorOperatorCellsAfterExpansion(sheet, protection) {
    var ids = WorkOsSchemas.getInternalIds(WorkOsConfig.SHEETS.ERRORS);
    var map = WorkOsSchemas.buildColumnMapFromIds(ids);
    var retryColumn = map.retry_requested + 1;
    var dataRows = Math.max(
      1,
      sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
    );
    var operatorRange = sheet.getRange(
      WorkOsConfig.DATA_START_ROW,
      retryColumn,
      dataRows,
      1
    );
    if (protection &&
        typeof protection.setUnprotectedRanges === 'function') {
      protection.setUnprotectedRanges([operatorRange]);
    }
    if (typeof operatorRange.setDataValidation === 'function') {
      var validation = null;
      var previousRow = WorkOsConfig.DATA_START_ROW - 1 + dataRows -
        WorkOsConfig.ROW_EXPANSION_UNIT;
      if (previousRow >= WorkOsConfig.DATA_START_ROW) {
        var previousCell = sheet.getRange(
          previousRow,
          retryColumn,
          1,
          1
        );
        if (typeof previousCell.getDataValidation === 'function') {
          validation = previousCell.getDataValidation();
        }
      }
      if (!validation &&
          typeof SpreadsheetApp.newDataValidation === 'function') {
        validation = SpreadsheetApp.newDataValidation()
          .requireCheckbox()
          .setAllowInvalid(false)
          .build();
      }
      if (validation) {
        operatorRange.setDataValidation(validation);
      }
    }
  }

  function findLogicalEmptyRow(sheet, keyColumn) {
    var rowCount = sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1;
    var values = sheet.getRange(
      WorkOsConfig.DATA_START_ROW,
      keyColumn,
      rowCount,
      1
    ).getValues();
    for (var index = 0; index < values.length; index += 1) {
      if (WorkOsUtilities.isBlank(values[index][0])) {
        return WorkOsConfig.DATA_START_ROW + index;
      }
    }
    var previousMax = sheet.getMaxRows();
    var protection = sheet.getName() === WorkOsConfig.SHEETS.ERRORS
      ? errorOperatorProtection(sheet)
      : null;
    sheet.insertRowsAfter(previousMax…5453 tokens truncated…) === reference;
    }));
  }

  function operationalCounts(
    spreadsheet,
    nowValue,
    budget,
    errorContext,
    options
  ) {
    var timestamp = nowValue instanceof Date
      ? nowValue
      : WorkOsUtilities.now();
    var settings = options || {};
    var context = errorContext ||
      createErrorContext(spreadsheet, { skip_rows: true });
    var availableRows = errorContext
      ? context.rows.length
      : context.physical_row_count;
    var rowLimit = settings.row_limit == null
      ? availableRows
      : Math.min(
        availableRows,
        Math.max(0, Number(settings.row_limit || 0))
      );
    var counts = {
      unresolved_error_count: 0,
      dead_letter_count: 0,
      due_retry_count: 0,
      retry_queued_count: 0
    };
    function assertErrorBudget() {
      if (budget && budget.isExhausted(
        WorkOsConfig.QUICK_DIAGNOSTIC_RESERVE_MS
      )) {
        throw new WorkOsAppError(
          'E_DIAGNOSTIC_BUDGET',
          'DIAGNOSTIC',
          true,
          'Error險ｺ譁ｭ繧貞ｮ牙・縺ｪ螳溯｡御ｺ育ｮ励〒蛛懈ｭ｢縺励∪縺励◆縲・
        );
      }
    }
    function countRecord(record) {
      if (!record || String(record.status || '') === 'RESOLVED') {
        return;
      }
      counts.unresolved_error_count += 1;
      if (String(record.status || '') === 'DEAD') {
        counts.dead_letter_count += 1;
      }
      if (String(record.status || '') === 'RETRY_QUEUED') {
        counts.retry_queued_count += 1;
      }
      if (record.next_retry_at instanceof Date &&
          record.next_retry_at.getTime() <= timestamp.getTime()) {
        counts.due_retry_count += 1;
      }
    }
    if (errorContext) {
      for (var index = 0; index < rowLimit; index += 1) {
        if (index % WorkOsConfig.QUICK_DIAGNOSTIC_CHUNK_ROWS === 0) {
          assertErrorBudget();
        }
        countRecord(errorRecordAt(
          context,
          WorkOsConfig.DATA_START_ROW + index
        ));
      }
      return counts;
    }
    var chunkSize = WorkOsConfig.QUICK_DIAGNOSTIC_CHUNK_ROWS;
    for (var offset = 0; offset < rowLimit; offset += chunkSize) {
      assertErrorBudget();
      var chunkLength = Math.min(chunkSize, rowLimit - offset);
      var values = context.sheet.getRange(
        WorkOsConfig.DATA_START_ROW + offset,
        1,
        chunkLength,
        context.ids.length
      ).getValues();
      values.forEach(function (row) {
        if (WorkOsUtilities.isBlank(row[context.map.error_id])) {
          return;
        }
        var record = {};
        context.ids.forEach(function (id) {
          record[id] = row[context.map[id]];
        });
        countRecord(record);
      });
    }
    return counts;
  }

  function systemRetryStatus(
    subsystems,
    spreadsheet,
    nowValue,
    errorContext
  ) {
    var requested = Array.isArray(subsystems) ? subsystems : [subsystems];
    var allowedSubsystems = {};
    requested.forEach(function (subsystem) {
      var normalized = String(subsystem || '').toUpperCase();
      if (normalized === 'GMAIL_SEARCH' || normalized === 'STATE_WRITE') {
        allowedSubsystems[normalized] = true;
      }
    });
    var timestamp = nowValue instanceof Date
      ? nowValue
      : WorkOsUtilities.now();
    var context = errorContext || createErrorContext(spreadsheet);
    var matchingCount = 0;
    var dueCount = 0;
    var futureCount = 0;
    var deadCount = 0;
    var invalidCount = 0;
    for (var index = 0; index < context.rows.length; index += 1) {
      var record = errorRecordAt(
        context,
        WorkOsConfig.DATA_START_ROW + index
      );
      if (!record ||
          String(record.status || '') === 'RESOLVED' ||
          !allowedSubsystems[String(record.subsystem || '')] ||
          !/^sysref_[0-9a-f]{64}$/.test(
            String(record.safe_reference || '')
          )) {
        continue;
      }
      matchingCount += 1;
      if (String(record.status || '') === 'DEAD') {
        deadCount += 1;
        continue;
      }
      if ([
        'OPEN',
        'RETRY_QUEUED'
      ].indexOf(String(record.status || '')) === -1) {
        invalidCount += 1;
        continue;
      }
      if (String(record.next_action || '') !==
            'WAIT_FOR_AUTOMATIC_RETRY' ||
          [
            'PROVIDER_TRANSIENT',
            'SERVICE_TRANSIENT',
            'TRANSIENT'
          ].indexOf(String(record.error_category || '')) === -1) {
        invalidCount += 1;
        continue;
      }
      if (!(record.next_retry_at instanceof Date)) {
        invalidCount += 1;
        continue;
      }
      if (record.next_retry_at.getTime() > timestamp.getTime()) {
        futureCount += 1;
      } else {
        dueCount += 1;
      }
    }
    var retryAllowed = deadCount === 0 &&
      invalidCount === 0 &&
      futureCount === 0;
    return {
      allowed: retryAllowed,
      reason: deadCount
        ? 'SYSTEM_DEAD_LETTER'
        : (invalidCount
          ? 'SYSTEM_RETRY_STATE_INVALID'
          : (futureCount ? 'SYSTEM_RETRY_NOT_DUE' : 'READY')),
      matching_count: matchingCount,
      due_count: dueCount,
      deferred_count: futureCount,
      dead_count: deadCount,
      invalid_count: invalidCount
    };
  }

  function resolveSystemErrors(
    subsystems,
    spreadsheet,
    nowValue,
    errorContext
  ) {
    var requested = Array.isArray(subsystems) ? subsystems : [subsystems];
    var allowedSubsystems = {};
    requested.forEach(function (subsystem) {
      var normalized = String(subsystem || '').toUpperCase();
      if (normalized === 'GMAIL_SEARCH' || normalized === 'STATE_WRITE') {
        allowedSubsystems[normalized] = true;
      }
    });
    var timestamp = nowValue instanceof Date
      ? nowValue
      : WorkOsUtilities.now();
    var context = errorContext || createErrorContext(spreadsheet);
    var resolved = 0;
    for (var index = 0; index < context.rows.length; index += 1) {
      var record = errorRecordAt(
        context,
        WorkOsConfig.DATA_START_ROW + index
      );
      if (!record ||
          String(record.status || '') === 'RESOLVED' ||
          !allowedSubsystems[String(record.subsystem || '')] ||
          !/^sysref_[0-9a-f]{64}$/.test(
            String(record.safe_reference || '')
          )) {
        continue;
      }
      record.status = 'RESOLVED';
      record.retry_requested = false;
      record.next_retry_at = '';
      record.next_action = 'NONE';
      record.resolved_at = timestamp;
      record.updated_at = timestamp;
      writeErrorRecord(context, record._row, record);
      resolved += 1;
    }
    return { resolved_count: resolved };
  }

  function defaultRetryReadiness(context) {
    var subsystem = String(context && context.subsystem || '');
    if (/^CALENDAR_/.test(subsystem)) {
      var props = PropertiesService.getScriptProperties();
      var calendarConfigured = Boolean(props.getProperty(
        WorkOsConfig.PROPERTIES.DEADLINE_CALENDAR_ID
      ));
      var instanceConfigured = /^ins_[0-9a-f]{32}$/.test(String(
        props.getProperty(WorkOsConfig.PROPERTIES.INSTANCE_ID) || ''
      ));
      return {
        ready: calendarConfigured && instanceConfigured,
        reasons: [
          calendarConfigured ? '' : 'CALENDAR_ID_NOT_CONFIGURED',
          instanceConfigured ? '' : 'INSTANCE_ID_NOT_CONFIGURED'
        ].filter(Boolean)
      };
    }
    if (typeof WorkOsAutomation === 'undefined' ||
        !WorkOsAutomation ||
        typeof WorkOsAutomation.getAutomationStatus !== 'function') {
      return { ready: false, reasons: ['AUTOMATION_STATUS_UNAVAILABLE'] };
    }
    var status = WorkOsAutomation.getAutomationStatus();
    return status.prerequisites || {
      ready: false,
      reasons: ['AUTOMATION_PREREQUISITES_UNAVAILABLE']
    };
  }

  function requestedRetryRecord(context, internalId) {
    var normalized = String(internalId || '').trim();
    if (!/^(?:err|dl)_[0-9a-f]{32}$/.test(normalized)) {
      throw new WorkOsAppError(
        'E_DEAD_LETTER_ID_INVALID',
        'STATE_WRITE',
        false,
        '蜀榊ｮ溯｡悟ｯｾ雎｡縺ｮ蜀・ΚID蠖｢蠑上′荳肴ｭ｣縺ｧ縺吶・
      );
    }
    return findErrorRecord(context, function (record) {
      return String(record.error_id || '') === normalized ||
        String(record.dead_letter_id || '') === normalized;
    });
  }

  function retryDeadLetterById(internalId, options) {
    var settings = options || {};
    var internalRetry =
      settings.internal_capability === INTERNAL_RETRY_CAPABILITY;
    if (Object.keys(settings).length &&
        !WorkOsConfig.TEST_MODE &&
        !internalRetry) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        'STATE_WRITE',
        false,
        '蜀榊ｮ溯｡悟・逅・∈縺ｮ萓晏ｭ俶ｳｨ蜈･縺ｯTest mode縺縺代〒蛻ｩ逕ｨ縺ｧ縺阪∪縺吶・
      );
    }
    var spreadsheet = settings.spreadsheet ||
      SpreadsheetApp.getActiveSpreadsheet();
    var readinessChecker = settings.readiness_checker ||
      defaultRetryReadiness;
    var executeWithLock = function (lock) {
      var context = settings.error_context ||
        createErrorContext(spreadsheet);
      var record = requestedRetryRecord(context, internalId);
      if (!record) {
        throw new WorkOsAppError(
          'E_DEAD_LETTER_NOT_FOUND',
          'STATE_WRITE',
          false,
          '謖・ｮ壹＆繧後◆Dead Letter縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縲・
        );
      }
      if (String(record.status || '') === 'RETRY_QUEUED') {
        return {
          status: 'NOOP',
          reason: 'ALREADY_QUEUED',
          dead_letter_id: String(record.dead_letter_id || '')
        };
      }
      if (String(record.status || '') !== 'DEAD') {
        throw new WorkOsAppError(
          'E_DEAD_LETTER_NOT_RETRYABLE_STATE',
          'STATE_WRITE',
          false,
          'DEAD迥ｶ諷九・鬆・岼縺縺代ｒ謇句虚蜀榊ｮ溯｡後〒縺阪∪縺吶・
        );
      }
      if ([
        'AUTH_CONFIGURATION',
        'PERMISSION_POLICY',
        'INVALID_RESPONSE',
        'DATA_OR_SCHEMA',
        'UNKNOWN_NON_RETRYABLE'
      ].indexOf(String(record.error_category || '')) !== -1 ||
          String(record.next_action || '') !== 'REVIEW_AND_RETRY') {
        throw new WorkOsAppError(
          'E_DEAD_LETTER_NON_RETRYABLE',
          'STATE_WRITE',
          false,
          '髱槫・隧ｦ陦後お繝ｩ繝ｼ縺ｯ蜴溷屏隗｣豎ｺ縺ｨ蛟句挨遒ｺ隱阪↑縺励↓蜀榊ｮ溯｡後〒縺阪∪縺帙ｓ縲・
        );
      }
      var readiness = readinessChecker({
        subsystem: String(record.subsystem || ''),
        resume_stage: String(record.resume_stage || '')
      }) || {};
      if (readiness.ready !== true) {
        return {
          status: 'REFUSED',
          reason: 'PREREQUISITES_NOT_READY',
          reasons: Array.isArray(readiness.reasons)
            ? readiness.reasons.slice(0, 10)
            : []
        };
      }
      var timestamp = settings.now instanceof Date
        ? settings.now
        : WorkOsUtilities.now();
      var queued;
      var messageQueued = null;
      if (/^CALENDAR_/.test(String(record.subsystem || ''))) {
        var outboxSheet = spreadsheet.getSheetByName(
          WorkOsConfig.SHEETS.SYNC_STATE
        );
        var outboxContext =
          WorkOsCalendarSync.createOutboxContextForHeldLock(
            outboxSheet,
            lock
          );
        var calendarMessageContext = null;
        var calendarMessageId = '';
        if (String(record.message_state_id || '')) {
          var calendarMessageSheet = spreadsheet.getSheetByName(
            WorkOsConfig.SHEETS.MESSAGE_STATE
          );
          calendarMessageContext =
            WorkOsMessageStateRepository.createContextForHeldLock(
              calendarMessageSheet,
              lock
            );
          calendarMessageContext.logicalRows.some(function (messageRecord) {
            if (safeMessageReference(messageRecord.message_id) ===
                String(record.message_state_id || '')) {
              calendarMessageId = messageRecord.message_id;
              return true;
            }
            return false;
          });
          if (!calendarMessageId) {
            throw new WorkOsAppError(
              'E_MESSAGE_STATE_NOT_FOUND',
              'STATE_WRITE',
              false,
              'Calendar Dead Letter縺ｫ蟇ｾ蠢懊☆繧貴essage State縺後≠繧翫∪縺帙ｓ縲・
            );
          }
          var calendarMessageRecord =
            WorkOsMessageStateRepository.getByMessageId(
              calendarMessageContext,
              calendarMessageId
            );
          if (!calendarMessageRecord ||
              calendarMessageRecord.processing_status !==
                WorkOsMessageStateRepository.STATUSES.DEAD ||
              WorkOsMessageStateRepository.checkpointStageForResumeStage(
                calendarMessageRecord.resume_stage
              ) !== String(record.resume_stage || '')) {
            throw new WorkOsAppError(
              'E_MESSAGE_CHECKPOINT_CONFLICT',
              'STATE_WRITE',
              false,
              'Calendar Dead Letter縺ｮ蜀埼幕谿ｵ髫弱′荳閾ｴ縺励∪縺帙ｓ縲・
            );
          }
        }
        queued = WorkOsCalendarSync.requestManualRetryInContext(
          String(record.task_id || ''),
          outboxContext,
          timestamp
        );
        if (calendarMessageContext) {
          messageQueued =
            WorkOsMessageStateRepository.requestManualRetryInContext(
              calendarMessageId,
              String(record.resume_stage || ''),
              calendarMessageContext,
              timestamp
            );
        }
      } else if (
        [
          'GMAIL_SEARCH',
          'STATE_WRITE'
        ].indexOf(String(record.subsystem || '')) !== -1 &&
        /^sysref_[0-9a-f]{64}$/.test(
          String(record.safe_reference || '')
        ) &&
        !String(record.message_state_id || '') &&
        !String(record.task_id || '')
      ) {
        queued = { operation: 'SYSTEM_RETRY_QUEUED' };
      } else {
        var messageSheet = spreadsheet.getSheetByName(
          WorkOsConfig.SHEETS.MESSAGE_STATE
        );
        var messageContext =
          WorkOsMessageStateRepository.createContextForHeldLock(
            messageSheet,
            lock
          );
        var rawMessageId = '';
        messageContext.logicalRows.some(function (messageRecord) {
          if (safeMessageReference(messageRecord.message_id) ===
              String(record.message_state_id || '')) {
            rawMessageId = messageRecord.message_id;
            return true;
          }
          return false;
        });
        if (!rawMessageId) {
          throw new WorkOsAppError(
            'E_MESSAGE_STATE_NOT_FOUND',
            'STATE_WRITE',
            false,
            'Dead Letter縺ｫ蟇ｾ蠢懊☆繧貴essage State縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縲・
          );
        }
        queued =
          WorkOsMessageStateRepository.requestManualRetryInContext(
            rawMessageId,
            String(record.resume_stage || ''),
            messageContext,
            timestamp
          );
      }
      record.status = 'RETRY_QUEUED';
      record.retry_requested = false;
      record.next_retry_at = timestamp;
      record.next_action = 'WAIT_FOR_AUTOMATIC_RETRY';
      record.updated_at = timestamp;
      writeErrorRecord(context, record._row, record);
      return {
        status: 'QUEUED',
        dead_letter_id: String(record.dead_letter_id || ''),
        subsystem: String(record.subsystem || ''),
        safe_reference: String(record.safe_reference || ''),
        resume_stage: String(record.resume_stage || ''),
        repository_operation: queued.operation,
        message_repository_operation: messageQueued
          ? messageQueued.operation
          : ''
      };
    };
    if (internalRetry && settings.held_lock) {
      return executeWithLock(settings.held_lock);
    }
    return WorkOsUtilities.withScriptLock(
      executeWithLock,
      WorkOsConfig.LOCK_WAIT_MS
    );
  }

  function retrySelectedDeadLetters(options) {
    var settings = options || {};
    if (Object.keys(settings).length && !WorkOsConfig.TEST_MODE) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        'STATE_WRITE',
        false,
        '驕ｸ謚槫・螳溯｡後∈縺ｮ萓晏ｭ俶ｳｨ蜈･縺ｯTest mode縺縺代〒蛻ｩ逕ｨ縺ｧ縺阪∪縺吶・
      );
    }
    var spreadsheet = settings.spreadsheet ||
      SpreadsheetApp.getActiveSpreadsheet();
    var selection = settings.range ||
      (typeof spreadsheet.getActiveRange === 'function'
        ? spreadsheet.getActiveRange()
        : SpreadsheetApp.getActiveRange());
    if (!selection ||
        selection.getSheet().getName() !== WorkOsConfig.SHEETS.ERRORS) {
      throw new WorkOsAppError(
        'E_DEAD_LETTER_SELECTION',
        'STATE_WRITE',
        false,
        '繧ｨ繝ｩ繝ｼ繝ｻ蜀榊ｮ溯｡郡heet縺ｮ蟇ｾ雎｡陦後ｒ驕ｸ謚槭＠縺ｦ縺上□縺輔＞縲・
      );
    }
    if (selection.getNumRows() > WorkOsConfig.MANUAL_RETRY_MAX_SELECTED) {
      throw new WorkOsAppError(
        'E_DEAD_LETTER_SELECTION_LIMIT',
        'STATE_WRITE',
        false,
        '荳蠎ｦ縺ｫ蜀榊ｮ溯｡後〒縺阪ｋ莉ｶ謨ｰ荳企剞繧定ｶ・∴縺ｦ縺・∪縺吶・
      );
    }
    return WorkOsUtilities.withScriptLock(function (lock) {
      var context = createErrorContext(spreadsheet);
      var ids = [];
      for (var rowOffset = 0;
        rowOffset < selection.getNumRows();
        rowOffset += 1) {
        var physicalRow = selection.getRow() + rowOffset;
        var record = errorRecordAt(context, physicalRow);
        if (record && record.retry_requested === true) {
          ids.push(String(record.dead_letter_id || record.error_id || ''));
        }
      }
      if (!ids.length) {
        return { status: 'NOOP', selected_count: 0, results: [] };
      }
      var retrySettings = {
        internal_capability: INTERNAL_RETRY_CAPABILITY,
        held_lock: lock,
        error_context: context,
        spreadsheet: spreadsheet,
        readiness_checker: settings.readiness_checker,
        now: settings.now
      };
      return {
        status: 'COMPLETE',
        selected_count: ids.length,
        results: ids.map(function (id) {
          return retryDeadLetterById(id, retrySettings);
        })
      };
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  return Object.freeze({
    SUBSYSTEMS: SUBSYSTEMS,
    CHECKPOINT_STAGES: CHECKPOINT_STAGES,
    retryPolicy: retryPolicy,
    noteProviderFailure: noteProviderFailure,
    noteProviderSuccess: noteProviderSuccess,
    providerSuppressionStatus: providerSuppressionStatus,
    hashedExternalReference: hashedExternalReference,
    createErrorContext: createErrorContext,
    appendRunSummary: appendRunSummary,
    recordOperationalError: recordOperationalError,
    recordMessageError: recordMessageError,
    recordCalendarError: recordCalendarError,
    recordManagementEditWarning: recordManagementEditWarning,
    resolveErrorsForMessage: resolveErrorsForMessage,
    resolveErrorsForTask: resolveErrorsForTask,
    hasUnresolvedThreadError: hasUnresolvedThreadError,
    operationalCounts: operationalCounts,
    systemRetryStatus: systemRetryStatus,
    resolveSystemErrors: resolveSystemErrors,
    retryDeadLetterById: retryDeadLetterById,
    retrySelectedDeadLetters: retrySelectedDeadLetters
  });
}());

function retrySelectedDeadLetters() {
  return WorkOsLogAndDeadLetter.retrySelectedDeadLetters();
}

function retryDeadLetterById(deadLetterId) {
  return WorkOsLogAndDeadLetter.retryDeadLetterById(deadLetterId);
}

