/**
 * Phase 4 deadline Calendar policy, outbox and provider-neutral gateway.
 *
 * The Google Sheet remains the Task source of truth.  This module only writes
 * managed all-day deadline Events to the dedicated "閾ｪ蜍墓悄譌･邂｡逅・ Calendar.
 * Callers can inject a gateway, clock, Properties store, Task reader and Task
 * Calendar-state writer so the policy and retry flow are locally testable.
 */
var WorkOsCalendarSync = (function () {
  var TARGET_TYPE = 'DEADLINE_CALENDAR';
  var EVENT_TYPE = 'DEADLINE';
  var DESIRED_ACTIONS = Object.freeze([
    'CREATE',
    'UPDATE',
    'DELETE',
    'NOOP'
  ]);
  var JOB_STATUSES = Object.freeze([
    'PENDING',
    'RETRY',
    'DONE',
    'DEAD'
  ]);
  var AUTO_CATEGORIES = Object.freeze([
    'EXTERNAL_SUBMISSION',
    'FINAL_MATERIAL',
    'CONTRACT_APPLICATION',
    'BID',
    'LEGAL_TAX_REGULATORY',
    'OTHER_HIGH_IMPACT'
  ]);
  var TERMINAL_STATUSES = Object.freeze([
    'DONE',
    'EXCLUDED',
    'CANCELLED'
  ]);
  var OUTBOX_IDS = Object.freeze([
    'sync_id',
    'task_id',
    'target_type',
    'desired_action',
    'event_id',
    'status',
    'retry_count',
    'next_retry_at',
    'last_attempt_at',
    'last_success_at',
    'error_code',
    'updated_at'
  ]);
  var RETRY_DELAYS_MINUTES = Object.freeze([5, 15, 60]);
  var MAX_RETRIES = 3;
  var LOCK_MARKER = {};
  var CALENDAR_JOB_CLAIM_PROPERTY =
    'WORK_OS_V2_CALENDAR_JOB_CLAIM';
  var CALENDAR_RESOLUTION_CLAIM_PROPERTY =
    'WORK_OS_V2_CALENDAR_RESOLUTION_CLAIM';
  var CALENDAR_CLAIM_TTL_MS = 10 * 60 * 1000;
  var MAX_CLAIM_PROPERTY_CHARS = 2048;

  function calendarIdPropertyKey() {
    return WorkOsConfig.PROPERTIES.DEADLINE_CALENDAR_ID ||
      'WORK_OS_V2_DEADLINE_CALENDAR_ID';
  }

  function appError(code, retryable, safeMessage, cause) {
    return new WorkOsAppError(
      code,
      'CALENDAR_SYNC',
      retryable,
      safeMessage,
      cause
    );
  }

  function nowFromSettings(settings) {
    var value = settings && settings.now;
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'function') {
      value = value();
      if (value instanceof Date && !isNaN(value.getTime())) {
        return value;
      }
    }
    return WorkOsUtilities.now();
  }

  function canonicalFingerprintValue(value) {
    if (value instanceof Date) {
      return {
        _type: 'DATE',
        value: isNaN(value.getTime()) ? '' : value.toISOString()
      };
    }
    if (Array.isArray(value)) {
      return value.map(canonicalFingerprintValue);
    }
    if (value && typeof value === 'object') {
      var output = {};
      Object.keys(value).sort().forEach(function (key) {
        output[key] = canonicalFingerprintValue(value[key]);
      });
      return output;
    }
    if (typeof value === 'number' && !isFinite(value)) {
      return String(value);
    }
    return value == null ? '' : value;
  }

  function fingerprint(value) {
    return WorkOsUtilities.sha256Hex(
      JSON.stringify(canonicalFingerprintValue(value))
    );
  }

  function outboxFingerprint(record) {
    var snapshot = {};
    OUTBOX_IDS.forEach(function (id) {
      snapshot[id] = record && record[id] == null ? '' : record && record[id];
    });
    return fingerprint(snapshot);
  }

  function taskFingerprint(task) {
    return fingerprint(task || {});
  }

  function cloneRecord(record) {
    var output = {};
    Object.keys(record || {}).forEach(function (key) {
      output[key] = record[key];
    });
    return output;
  }

  function claimPropertyStore(settings) {
    return settings && settings.properties ||
      PropertiesService.getScriptProperties();
  }

  function parseClaimProperty(properties, propertyName, nowValue) {
    var raw = String(properties.getProperty(propertyName) || '');
    if (!raw) {
      return null;
    }
    if (raw.length > MAX_CLAIM_PROPERTY_CHARS) {
      throw appError(
        'E_CALENDAR_CLAIM_STATE',
        false,
        'Calendar claim縺ｮ菫晏ｭ倡憾諷九′荳肴ｭ｣縺ｧ縺吶・
      );
    }
    var value;
    try {
      value = JSON.parse(raw);
    } catch (error) {
      throw appError(
        'E_CALENDAR_CLAIM_STATE',
        false,
        'Calendar claim縺ｮ菫晏ｭ倡憾諷九ｒ隗｣驥医〒縺阪∪縺帙ｓ縲・,
        error
      );
    }
    if (!value ||
        !/^clm_[0-9a-f]{32}$/.test(String(value.token || '')) ||
        !Number.isFinite(Number(value.claimed_at_ms)) ||
        !Number.isFinite(Number(value.expires_at_ms)) ||
        Number(value.expires_at_ms) <= Number(value.claimed_at_ms)) {
      throw appError(
        'E_CALENDAR_CLAIM_STATE',
        false,
        'Calendar claim縺ｮ菫晏ｭ伜､縺御ｸ肴ｭ｣縺ｧ縺吶・
      );
    }
    value.active = Number(value.expires_at_ms) > nowValue.getTime();
    return value;
  }

  function persistClaimProperty(properties, propertyName, claim) {
    var serialized = JSON.stringify(claim);
    if (serialized.length > MAX_CLAIM_PROPERTY_CHARS) {
      throw appError(
        'E_CALENDAR_CLAIM_STATE',
        false,
        'Calendar claim縺御ｿ晏ｭ倅ｸ企剞繧定ｶ・∴縺ｾ縺励◆縲・
      );
    }
    properties.setProperty(propertyName, serialized);
  }

  function clearOwnedClaimProperty(
    properties,
    propertyName,
    token,
    nowValue
  ) {
    var current = parseClaimProperty(
      properties,
      propertyName,
      nowValue
    );
    if (current && current.token === String(token || '')) {
      properties.deleteProperty(propertyName);
      return true;
    }
    return false;
  }

  function assertCalendarBudget(options) {
    var settings = options || {};
    if (settings.budget &&
        typeof settings.budget.isExhausted === 'function' &&
        settings.budget.isExhausted(
          settings.reserve_ms == null
            ? WorkOsConfig.MANUAL_WORKER_RESERVE_MS
            : settings.reserve_ms
        )) {
      throw appError(
        'E_BUDGET_EXHAUSTED',
        true,
        'soft execution budget縺ｫ驕斐＠縺溘◆繧，alendar API call蜑阪↓蛛懈ｭ｢縺励∪縺励◆縲・
      );
    }
  }

  function normalizeEnum(value, enumName) {
    var text = String(value == null ? '' : value).trim();
    var values = WorkOsEnums[enumName] || {};
    if (Object.prototype.hasOwnProperty.call(values, text)) {
      return text;
    }
    var codes = Object.keys(values);
    for (var index = 0; index < codes.length; index += 1) {
      if (values[codes[index]] === text) {
        return codes[index];
      }
    }
    return text;
  }

  function normalizeBoolean(value) {
    if (value === true || value === false) {
      return value;
    }
    var text = String(value == null ? '' : value).trim().toLowerCase();
    if (text === 'true') {
      return true;
    }
    if (text === 'false' || text === '') {
      return false;
    }
    return Boolean(value);
  }

  function isoDate(value, timezone) {
    if (value == null || value === '') {
      return '';
    }
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        return '';
      }
      if (typeof Utilities !== 'undefined' &&
          typeof Utilities.formatDate === 'function') {
        return Utilities.formatDate(
          value,
          timezone || WorkOsConfig.TIMEZONE,
          'yyyy-MM-dd'
        );
      }
      return value.toISOString().slice(0, 10);
    }
    var text = String(value).trim().slice(0, 10);
    return WorkOsUtilities.isValidIsoDate(text) ? text : '';
  }

  function addDaysIso(value, days) {
    if (!WorkOsUtilities.isValidIsoDate(value)) {
      throw appError(
        'E_CALENDAR_INVALID_DATE',
        false,
        'Calendar蜷梧悄蟇ｾ雎｡縺ｮ譛滄剞譌･縺御ｸ肴ｭ｣縺ｧ縺吶・
      );
    }
    var parts = String(value).split('-').map(Number);
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    date.setUTCDate(date.getUTCDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  }

  function isEligibleTask(task, timezone) {
    var value = task || {};
    var status = normalizeEnum(value.status, 'TaskStatus');
    var reviewState = normalizeEnum(value.review_state, 'ReviewState');
    var decision = normalizeEnum(value.decision, 'Decision');
    var basis = normalizeEnum(value.deadline_basis, 'DeadlineBasis');
    var mode = normalizeEnum(value.calendar_sync_mode, 'CalendarSyncMode');
    var importance = normalizeEnum(
      value.calendar_importance,
      'CalendarImportance'
    );
    var dueDate = isoDate(value.due_date, timezone);

    if (normalizeBoolean(value.needs_review) ||
        reviewState === 'OPEN' ||
        status === 'REVIEW' ||
        !dueDate ||
        (basis === 'RELATIVE' &&
          (reviewState !== 'APPLIED' || decision !== 'ACCEPT')) ||
        (basis !== 'EXPLICIT' &&
         basis !== 'RELATIVE' &&
         basis !== 'MANUAL_CONFIRMED') ||
        TERMINAL_STATUSES.indexOf(status) !== -1 ||
        normalizeBoolean(value.completed) ||
        normalizeBoolean(value.excluded) ||
        mode === 'NONE') {
      return false;
    }
    if (mode === 'FORCE') {
      return true;
    }
    return mode === 'AUTO' &&
      importance === 'HIGH' &&
      AUTO_CATEGORIES.indexOf(
        String(value.calendar_category || '').trim()
      ) !== -1;
  }

  function safeText(value, maxLength) {
    var text = WorkOsUtilities.redact(
      String(value == null ? '' : value)
    )
      .replace(
        /\b(?:api[_-]?key|[a-z0-9_-]*token|credential|client[_-]?secret|password|secret)\s*[:=]\s*\[REDACTED\]/gi,
        '[REDACTED_CREDENTIAL]'
      )
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/&/g, '・・)
      .replace(/</g, '・・)
      .replace(/>/g, '・・)
      .replace(/\r\n?/g, '\n')
      .trim();
    return text.slice(0, Number(maxLength || 500));
  }

  function taskMarker(taskId) {
    return '[WORKOS_TASK_ID:' + String(taskId || '') + ']';
  }

  function normalizeInstanceId(instanceId) {
    var normalized = String(instanceId || '').trim();
    if (!/^ins_[0-9a-f]{32}$/.test(normalized)) {
      throw appError(
        'E_CALENDAR_INSTANCE_INVALID',
        false,
        'Calendar蜷梧悄逕ｨinstance縺ｮ蠖｢蠑上′荳肴ｭ｣縺ｧ縺吶４etup S60繧貞・遒ｺ隱阪＠縺ｦ縺上□縺輔＞縲・
      );
    }
    return normalized;
  }

  function instanceMarker(instanceId) {
    return '[WORKOS_INSTANCE_ID:' + normalizeInstanceId(instanceId) + ']';
  }

  function deterministicEventId(taskId) {
    var normalized = String(taskId || '').trim();
    if (!/^tsk_[0-9a-f]{32}$/.test(normalized)) {
      throw appError(
        'E_CALENDAR_TASK_ID',
        false,
        'Calendar蜷梧悄蟇ｾ雎｡縺ｮTask ID縺御ｸ肴ｭ｣縺ｧ縺吶・
      );
    }
    /*
     * Google Calendar custom Event IDs accept base32hex characters. SHA-256
     * hexadecimal output is a valid deterministic subset and prevents Task ID
     * punctuation from reaching the API.
     */
    return 'v2d' + WorkOsUtilities.sha256Hex(
      'v2|deadline|' + normalized
    ).slice(0, 40);
  }

  function buildEventResource(task, instanceId, timezone) {
    var value = task || {};
    var taskId = String(value.task_id || '').trim();
    var instance = String(instanceId || '').trim();
    var dueDate = isoDate(value.due_date, timezone);
    if (!taskId || !instance || !dueDate) {
      throw appError(
        'E_CALENDAR_EVENT_INPUT',
        false,
        'Event逕滓・縺ｫ蠢・ｦ√↑Task諠・ｱ縺御ｸ崎ｶｳ縺励※縺・∪縺吶・
      );
    }
    var title = safeText(value.task_title, 300);
    if (!title) {
      throw appError(
        'E_CALENDAR_EVENT_INPUT',
        false,
        'Event逕滓・縺ｫ蠢・ｦ√↑Task蜷阪′縺ゅｊ縺ｾ縺帙ｓ縲・
      );
    }
    var description = [
      '騾∽ｿ｡閠・ ' + safeText(value.sender, 320),
      '譛滄剞譬ｹ諡: ' + safeText(
        WorkOsSchemas.toSheetEnum(
          'DeadlineBasis',
          normalizeEnum(value.deadline_basis, 'DeadlineBasis')
        ),
        30
      ),
      '蜈・Γ繝ｼ繝ｫ蜿ら・: ' + safeText(value.source_email, 1000),
      taskMarker(taskId),
      instanceMarker(instance)
    ].join('\n');
    return {
      id: deterministicEventId(taskId),
      summary: '縲先悄髯舌・ + title,
      description: description,
      start: { date: dueDate },
      end: { date: addDaysIso(dueDate, 1) },
      visibility: 'private',
      transparency: 'transparent',
      guestsCanInviteOthers: false,
      guestsCanModify: false,
      guestsCanSeeOtherGuests: false,
      extendedProperties: {
        private: {
          workosTaskId: taskId,
          workosInstanceId: instance,
          workosEventType: EVENT_TYPE
        }
      }
    };
  }

  function eventPrivateProperties(event) {
    return event &&
      event.extendedProperties &&
      event.extendedProperties.private
      ? event.extendedProperties.private
      : {};
  }

  function isOwnedEvent(event, taskId, instanceId) {
    var privateProperties = eventPrivateProperties(event);
    var expectedInstanceId = normalizeInstanceId(instanceId);
    return String(privateProperties.workosTaskId || '') ===
        String(taskId || '') &&
      String(privateProperties.workosInstanceId || '') ===
        expectedInstanceId &&
      String(privateProperties.workosEventType || '') === EVENT_TYPE;
  }

  function canonicalManagedEvent(event) {
    var value = event || {};
    var privateProperties = eventPrivateProperties(value);
    return {
      summary: String(value.summary || ''),
      description: String(value.description || ''),
      start_date: String(value.start && value.start.date || ''),
      end_date: String(value.end && value.end.date || ''),
      visibility: String(value.visibility || ''),
      transparency: String(value.transparency || ''),
      workos_task_id: String(privateProperties.workosTaskId || ''),
      workos_instance_id: String(privateProperties.workosInstanceId || ''),
      workos_event_type: String(privateProperties.workosEventType || '')
    };
  }

  function eventNeedsUpdate(existingEvent, desiredEvent) {
    return JSON.stringify(canonicalManagedEvent(existingEvent)) !==
      JSON.stringify(canonicalManagedEvent(desiredEvent));
  }

  function determineDesiredAction(task, existingEvent, timezone) {
    var eligible = isEligibleTask(task, timezone);
    if (!eligible) {
      return existingEvent ? 'DELETE' : 'NOOP';
    }
    if (!existingEvent) {
      return 'CREATE';
    }
    var desired = buildEventResource(
      task,
      eventPrivateProperties(existingEvent).workosInstanceId ||
        'instance_for_comparison',
      timezone
    );
    /*
     * The caller normally supplies an owned Event whose instance marker is
     * already known. Preserve that marker in comparison.
     */
    desired.extendedProperties.private.workosInstanceId =
      eventPrivateProperties(existingEvent).workosInstanceId ||
      desired.extendedProperties.private.workosInstanceId;
    desired.description = desired.description.replace(
      /\[WORKOS_INSTANCE_ID:[^\]]+\]/,
      instanceMarker(desired.extendedProperties.private.workosInstanceId)
    );
    return eventNeedsUpdate(existingEvent, desired) ? 'UPDATE' : 'NOOP';
  }

  function eventSearchWindow(dueDate) {
    if (!WorkOsUtilities.isValidIsoDate(dueDate)) {
      return null;
    }
    var totalDays = Math.max(
      1,
      Number(WorkOsConfig.CALENDAR_SEARCH_WINDOW_DAYS || 7)
    );
    var daysBefore = Math.floor(totalDays / 2);
    var daysAfterExclusive = totalDays - daysBefore;
    return {
      timeMin: addDaysIso(dueDate, -daysBefore) + 'T00:00:00.000Z',
      timeMax: addDaysIso(dueDate, daysAfterExclusive) +
        'T00:00:00.000Z'
    };
  }

  function apiStatus(error) {
    if (!error) {
      return 0;
    }
    return Number(
      error.status ||
      error.statusCode ||
      error.code ||
      error.response && error.response.status ||
      error.details && error.details.code ||
      0
    );
  }

  function wrapApiError(error, operation) {
    if (error instanceof WorkOsAppError) {
      return error;
    }
    var status = apiStatus(error);
    var errorText = String(
      error && (
        error.message ||
        error.details && error.details.message ||
        error.details && error.details[0] && error.details[0].reason
      ) || ''
    );
    var isRateOrQuota = status === 403 &&
      /rateLimitExceeded|userRateLimitExceeded|quotaExceeded|rate limit|quota/i
        .test(errorText);
    var authorizationFailure =
      status === 401 || (status === 403 && !isRateOrQuota);
    return appError(
      status === 409
        ? 'E_CALENDAR_EVENT_CONFLICT'
        : (authorizationFailure
          ? 'E_CALENDAR_AUTHORIZATION'
          : 'E_CALENDAR_API_CALL'),
      status === 408 ||
        status === 429 ||
        status >= 500 ||
        status === 0 ||
        isRateOrQuota,
      'Calendar API縺ｮ' + String(operation || '蜃ｦ逅・) +
        '縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲ょ・蜉帛・螳ｹ縺ｯ險倬鹸縺励※縺・∪縺帙ｓ縲・,
      error
    );
  }

  function isMissingApiError(error) {
    var status = apiStatus(error);
    return status === 404 || status === 410;
  }

  function isConflictApiError(error) {
    return apiStatus(error) === 409 ||
      error && error.code === 'E_CALENDAR_EVENT_CONFLICT';
  }

  /**
   * Default Advanced Calendar v3 gateway. Tests should inject a fake gateway.
   */
  function AdvancedCalendarGateway(calendarService) {
    this.service = calendarService ||
      (typeof Calendar !== 'undefined' ? Calendar : null);
    if (!this.service) {
      throw appError(
        'E_CALENDAR_SERVICE_UNAVAILABLE',
        false,
        'Advanced Calendar service繧貞茜逕ｨ縺ｧ縺阪∪縺帙ｓ縲・
      );
    }
  }

  AdvancedCalendarGateway.prototype.listCalendarsBySummary =
    function (summary, options) {
      var settings = options || {};
      var matches = [];
      var pageToken = null;
      var seenTokens = {};
      var pageCount = 0;
      do {
        if (settings.budget &&
            settings.budget.isExhausted(
              Number(settings.reserve_ms ||
                WorkOsConfig.SETUP_RESERVE_MS)
            )) {
          throw appError(
            'E_BUDGET_EXHAUSTED',
            true,
            'Calendar荳隕ｧ蜿門ｾ励ｒ螳溯｡御ｺ育ｮ怜・縺ｧ蛛懈ｭ｢縺励∪縺励◆縲・
          );
        }
        if (pageCount >= WorkOsConfig.CALENDAR_LIST_MAX_PAGES) {
          throw appError(
            'E_CALENDAR_LIST_PAGE_LIMIT',
            true,
            'Calendar荳隕ｧ縺御ｸ企剞page謨ｰ繧定ｶ・∴縺溘◆繧∝ｮ牙・縺ｫ蛛懈ｭ｢縺励∪縺励◆縲・
          );
        }
        var params = {
          maxResults: WorkOsConfig.CALENDAR_LIST_PAGE_SIZE,
          showDeleted: false,
          showHidden: true
        };
        if (pageToken) {
          params.pageToken = pageToken;
        }
        var response;
        try {
          response = this.service.CalendarList.list(params) || {};
        } catch (error) {
          throw wrapApiError(error, 'Calendar荳隕ｧ蜿門ｾ・);
        }
        pageCount += 1;
        (response.items || []).forEach(function (item) {
          if (String(item.summary || '') === String(summary || '')) {
            matches.push(item);
          }
        });
        pageToken = response.nextPageToken || null;
        if (pageToken && seenTokens[pageToken]) {
          throw appError(
            'E_CALENDAR_LIST_TOKEN_CYCLE',
            true,
            'Calendar荳隕ｧ縺ｮpage token縺悟ｾｪ迺ｰ縺励◆縺溘ａ螳牙・縺ｫ蛛懈ｭ｢縺励∪縺励◆縲・
          );
        }
        if (…10047 tokens truncated…     return {
          action: 'NOOP',
          event_id: '',
          calendar_sync_status: 'NOT_REQUIRED'
        };
      }
      assertCalendarBudget(options);
      gateway.deleteEvent(calendarId, existing.id);
      return {
        action: 'DELETE',
        event_id: '',
        calendar_sync_status: 'NOT_REQUIRED'
      };
    }

    var desired = buildEventResource(task, instanceId, timezone);
    if (existing) {
      if (!eventNeedsUpdate(existing, desired)) {
        return {
          action: 'NOOP',
          event_id: String(existing.id),
          calendar_sync_status: 'SYNCED'
        };
      }
      desired.id = String(existing.id);
      assertCalendarBudget(options);
      var updated = gateway.updateEvent(
        calendarId,
        existing.id,
        desired
      );
      return {
        action: 'UPDATE',
        event_id: String(updated && updated.id || existing.id),
        calendar_sync_status: 'SYNCED'
      };
    }

    try {
      assertCalendarBudget(options);
      var inserted = gateway.insertEvent(calendarId, desired);
      return {
        action: 'CREATE',
        event_id: String(inserted && inserted.id || desired.id),
        calendar_sync_status: 'SYNCED'
      };
    } catch (error) {
      if (!isConflictApiError(error)) {
        throw error;
      }
      assertCalendarBudget(options);
      var replay = gateway.getEvent(calendarId, desired.id);
      if (!replay ||
          !isOwnedEvent(replay, task.task_id, instanceId)) {
        throw appError(
          'E_CALENDAR_EVENT_CONFLICT',
          false,
          'Event ID遶ｶ蜷医ｒ螳牙・縺ｫ隗｣豎ｺ縺ｧ縺阪↑縺・◆繧∝・逅・ｒ蛛懈ｭ｢縺励∪縺励◆縲・
        );
      }
      if (eventNeedsUpdate(replay, desired)) {
        assertCalendarBudget(options);
        replay = gateway.updateEvent(
          calendarId,
          replay.id,
          desired
        );
      }
      return {
        action: 'NOOP',
        event_id: String(replay.id),
        calendar_sync_status: 'SYNCED'
      };
    }
  }

  function markJobSuccess(context, selected, result, taskWriter, nowValue) {
    var record = selected.record;
    /*
     * Persist the post-sync steady-state desire, not the operation just
     * executed. An eligible Task with an Event reconciles as UPDATE, while an
     * ineligible Task without an Event reconciles as NOOP. This prevents a
     * CREATE -> UPDATE -> NOOP -> UPDATE outbox loop on unchanged Tasks.
     */
    record.desired_action = result.calendar_sync_status === 'SYNCED'
      ? 'UPDATE'
      : 'NOOP';
    record.event_id = result.event_id;
    record.status = 'DONE';
    record.next_retry_at = '';
    record.last_attempt_at = nowValue;
    record.last_success_at = nowValue;
    record.error_code = '';
    record.updated_at = nowValue;
    writeOutboxRecord(context, selected.row, record);
    writeTaskCalendarState(taskWriter, record.task_id, {
      calendar_event_id: result.event_id,
      calendar_sync_status: result.calendar_sync_status,
      last_calendar_sync_at: nowValue
    });
    return {
      status: 'DONE',
      action: result.action,
      retry_count: record.retry_count
    };
  }

  function markJobFailure(
    context,
    selected,
    error,
    taskWriter,
    nowValue,
    options
  ) {
    var settings = options || {};
    var safe = WorkOsUtilities.safeError(error, 'CALENDAR_SYNC');
    var safeCode = /^[A-Z][A-Z0-9_]{0,79}$/.test(String(safe.code || ''))
      ? String(safe.code)
      : 'E_CALENDAR_SYNC';
    var record = selected.record;
    var priorRetryCount = Number(record.retry_count || 0);
    var retryable = safe.retryable !== false &&
      error && error.retryable !== false;
    /*
     * retry_count is the number of retries already scheduled. The initial
     * failed attempt is not itself a retry. This keeps all three documented
     * delays (5, 15 and 60 minutes) reachable, and moves the job to DEAD only
     * after the third retry also fails.
     */
    var dead = !retryable || priorRetryCount >= MAX_RETRIES;
    var retryCount = dead ? priorRetryCount : priorRetryCount + 1;
    record.status = dead ? 'DEAD' : 'RETRY';
    record.retry_count = retryCount;
    record.next_retry_at = dead
      ? ''
      : new Date(
        nowValue.getTime() +
        RETRY_DELAYS_MINUTES[retryCount - 1] * 60 * 1000
      );
    record.last_attempt_at = nowValue;
    record.error_code = safeCode;
    record.updated_at = nowValue;
    writeOutboxRecord(context, selected.row, record);
    if (settings.skip_task_patch !== true) {
      writeTaskCalendarState(taskWriter, record.task_id, {
        calendar_sync_status: dead
          ? 'ERROR'
          : record.desired_action === 'DELETE'
            ? 'DELETE_PENDING'
            : 'PENDING'
      });
    }
    return {
      status: record.status,
      action: record.desired_action,
      retry_count: record.retry_count,
      retryable: retryable,
      error_code: safeCode,
      next_retry_at: record.next_retry_at
    };
  }

  /**
   * Execute only the Calendar-facing portion of a prepared job.
   *
   * No Sheet mutation is performed here. A short claim-ownership check occurs
   * before the external boundary; the Lock is released before any Calendar
   * list/get/find/create/update/delete call.
   */
  function executePreparedJob(prepared, options) {
    var settings = options || {};
    if (!prepared || prepared.status !== 'READY') {
      throw appError(
        'E_CALENDAR_JOB_NOT_PREPARED',
        false,
        'Calendar job縺悟､夜Κ螳溯｡檎畑縺ｫ貅門ｙ縺輔ｌ縺ｦ縺・∪縺帙ｓ縲・
      );
    }
    var properties = claimPropertyStore(settings);
    WorkOsUtilities.withScriptLock(function () {
      assertOwnedCalendarJobClaim(
        properties,
        prepared,
        nowFromSettings(settings)
      );
    }, WorkOsConfig.LOCK_WAIT_MS);
    if (settings.budget &&
        settings.budget.isExhausted(
          settings.reserve_ms == null
            ? WorkOsConfig.MANUAL_WORKER_RESERVE_MS
            : settings.reserve_ms
        )) {
      return {
        status: 'PAUSED',
        error: appError(
          'E_BUDGET_EXHAUSTED',
          true,
          'Calendar螟夜ΚI/O縺ｮ蜑阪↓螳溯｡御ｺ育ｮ励∈驕斐＠縺ｾ縺励◆縲・
        )
      };
    }
    if (!prepared.task ||
        String(prepared.task.task_id || '') !== prepared.task_id) {
      return {
        status: 'FAILED',
        error: appError(
          'E_CALENDAR_TASK_NOT_FOUND',
          false,
          'Calendar蜷梧悄蟇ｾ雎｡Task繧堤｢ｺ隱阪〒縺阪∪縺帙ｓ縲・
        )
      };
    }
    try {
      var instanceId = String(
        settings.instance_id ||
        properties.getProperty(WorkOsConfig.PROPERTIES.INSTANCE_ID) ||
        ''
      ).trim();
      var resolved = resolveDeadlineCalendar({
        gateway: settings.gateway,
        properties: properties,
        instance_id: instanceId,
        budget: settings.budget,
        reserve_ms: settings.reserve_ms,
        now: settings.now
      });
      instanceId = String(
        properties.getProperty(WorkOsConfig.PROPERTIES.INSTANCE_ID) ||
        instanceId ||
        ''
      ).trim();
      return {
        status: 'EXECUTED',
        result: executeCalendarAction(
          settings.gateway || new AdvancedCalendarGateway(),
          resolved._calendarId,
          prepared.task,
          prepared.outbox_record,
          instanceId,
          settings.timezone || WorkOsConfig.TIMEZONE,
          {
            budget: settings.budget,
            reserve_ms: settings.reserve_ms
          }
        )
      };
    } catch (error) {
      return {
        status: error && error.code === 'E_BUDGET_EXHAUSTED'
          ? 'PAUSED'
          : 'FAILED',
        error: error
      };
    }
  }

  function calendarCasConflictResult(prepared, execution, recovery) {
    return {
      status: 'CONFLICT',
      processed_count: 0,
      external_io_performed:
        Boolean(execution && execution.status === 'EXECUTED'),
      recovery_scheduled:
        Boolean(recovery && recovery.scheduled === true),
      recovery_action: String(recovery && recovery.action || ''),
      selected_task_id: String(prepared && prepared.task_id || ''),
      result: {
        status: 'CONFLICT',
        action: String(
          prepared && prepared.outbox_record &&
            prepared.outbox_record.desired_action || ''
        ),
        retry_count: Number(
          prepared && prepared.outbox_record &&
            prepared.outbox_record.retry_count || 0
        ),
        retryable: true,
        error_code: 'E_CALENDAR_CAS_CONFLICT',
        next_retry_at: ''
      }
    };
  }

  /**
   * Record the observed external state against the current Task after a CAS
   * conflict. This does not apply the stale business snapshot. It only updates
   * Calendar-owned management fields and writes a fresh reconciliation
   * checkpoint derived from the current Task.
   */
  function schedulePostConflictReconciliation(
    context,
    row,
    currentRecord,
    currentTask,
    execution,
    taskWriter,
    nowValue,
    timezone
  ) {
    if (!row ||
        !currentRecord ||
        !currentTask ||
        !execution ||
        execution.status !== 'EXECUTED' ||
        !execution.result) {
      return { scheduled: false, action: '' };
    }
    var executionResult = execution.result;
    var observedEventId =
      executionResult.calendar_sync_status === 'SYNCED'
        ? String(executionResult.event_id || '').trim()
        : '';
    var currentTaskEventId = String(
      currentTask.calendar_event_id || ''
    ).trim();
    var currentOutboxEventId = String(
      currentRecord.event_id || ''
    ).trim();
    var externalDeleteCompleted =
      executionResult.action === 'DELETE' &&
      !observedEventId;
    var eventStateConflicts = externalDeleteCompleted
      ? (currentTaskEventId &&
         currentOutboxEventId &&
         currentTaskEventId !== currentOutboxEventId)
      : ((currentTaskEventId &&
          currentTaskEventId !== observedEventId) ||
         (currentOutboxEventId &&
          currentOutboxEventId !== observedEventId));
    if (eventStateConflicts) {
      return { scheduled: false, action: '' };
    }

    var observedTask = cloneRecord(currentTask);
    observedTask.calendar_event_id = observedEventId;
    var desiredAction = initialDesiredActionForTask(
      observedTask,
      timezone || WorkOsConfig.TIMEZONE
    );
    var syncStatus = desiredAction === 'NOOP'
      ? 'NOT_REQUIRED'
      : (desiredAction === 'DELETE'
        ? 'DELETE_PENDING'
        : 'PENDING');

    currentRecord.event_id = observedEventId;
    currentRecord.desired_action = desiredAction;
    currentRecord.status = desiredAction === 'NOOP'
      ? 'DONE'
      : 'PENDING';
    currentRecord.retry_count = 0;
    currentRecord.next_retry_at = '';
    currentRecord.last_attempt_at = '';
    if (desiredAction === 'NOOP') {
      currentRecord.last_success_at = nowValue;
    }
    currentRecord.error_code = desiredAction === 'NOOP'
      ? ''
      : 'E_CALENDAR_CAS_CONFLICT';
    currentRecord.updated_at = nowValue;
    writeOutboxRecord(context, row, currentRecord);

    var taskPatch = {
      calendar_event_id: observedEventId,
      calendar_sync_status: syncStatus
    };
    if (desiredAction === 'NOOP') {
      taskPatch.last_calendar_sync_at = nowValue;
    }
    writeTaskCalendarState(
      taskWriter,
      currentTask.task_id,
      taskPatch
    );
    return {
      scheduled: desiredAction !== 'NOOP',
      action: desiredAction
    };
  }

  /**
   * Reacquire the Lock, re-read Task/Outbox state and commit only when the
   * logical claim and both optimistic snapshots still match.
   */
  function commitPreparedJob(prepared, execution, options) {
    var settings = options || {};
    var sheet = outboxSheetForSettings(settings);
    var properties = claimPropertyStore(settings);
    return WorkOsUtilities.withScriptLock(function (lock) {
      var nowValue = nowFromSettings(settings);
      assertOwnedCalendarJobClaim(properties, prepared, nowValue);
      var context = createOutboxContextForHeldLock(sheet, lock);
      var row = context.bySyncId[String(prepared.sync_id || '')];
      var currentRecord = row ? readOutboxRow(context, row) : null;
      var currentTask = readTaskForHeldLock(
        settings,
        prepared.task_id,
        lock
      );
      var taskWriter = taskWriterForHeldLock(
        settings,
        lock,
        prepared.task_row_version
      );
      var currentTaskVersion = Number(
        currentTask && currentTask.row_version || 0
      );
      var snapshotsMatch = currentRecord &&
        String(currentRecord.task_id || '') === prepared.task_id &&
        outboxFingerprint(currentRecord) ===
          String(prepared.outbox_fingerprint || '') &&
        taskFingerprint(currentTask) ===
          String(prepared.task_fingerprint || '') &&
        currentTaskVersion === Number(prepared.task_row_version || 0);
      if (!snapshotsMatch) {
        var recoveryWriter = taskWriterForHeldLock(
          settings,
          lock,
          currentTaskVersion
        );
        var recovery = schedulePostConflictReconciliation(
          context,
          row,
          currentRecord,
          currentTask,
          execution,
          recoveryWriter,
          nowValue,
          settings.timezone || WorkOsConfig.TIMEZONE
        );
        clearOwnedClaimProperty(
          properties,
          CALENDAR_JOB_CLAIM_PROPERTY,
          prepared.claim_token,
          nowValue
        );
        /*
         * The external effect may already have succeeded. Do not consume the
         * Calendar retry allowance or overwrite the newer Task/Outbox state.
         * The deterministic Event ID/private marker makes the next attempt
         * converge by get/update/delete rather than create a duplicate.
         */
        return calendarCasConflictResult(
          prepared,
          execution,
          recovery
        );
      }
      if (execution && execution.status === 'PAUSED') {
        clearOwnedClaimProperty(
          properties,
          CALENDAR_JOB_CLAIM_PROPERTY,
          prepared.claim_token,
          nowValue
        );
        return {
          status: 'PAUSED',
          processed_count: 0,
          selected_task_id: prepared.task_id
        };
      }
      var selected = {
        row: row,
        record: currentRecord
      };
      var result;
      if (!execution || execution.status !== 'EXECUTED') {
        result = markJobFailure(
          context,
          selected,
          execution && execution.error ||
            appError(
              'E_CALENDAR_SYNC',
              true,
              'Calendar螟夜Κ蜃ｦ逅・′螳御ｺ・＠縺ｾ縺帙ｓ縺ｧ縺励◆縲・
            ),
          taskWriter,
          nowValue,
          currentTask ? null : { skip_task_patch: true }
        );
      } else {
        result = markJobSuccess(
          context,
          selected,
          execution.result,
          taskWriter,
          nowValue
        );
      }
      clearOwnedClaimProperty(
        properties,
        CALENDAR_JOB_CLAIM_PROPERTY,
        prepared.claim_token,
        nowValue
      );
      return {
        processed_count: 1,
        selected_task_id: prepared.task_id,
        result: result
      };
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  /**
   * A held-lock context cannot safely release and later reacquire its caller's
   * Lock. Keep this legacy symbol as an explicit safety boundary.
   */
  function processNextJobInContext() {
    throw appError(
      'E_CALENDAR_LOCK_BOUNDARY',
      true,
      'processNextJob繧剃ｽｿ逕ｨ縺励※Calendar螟夜ΚI/O繧鱈ock螟悶〒螳溯｡後＠縺ｦ縺上□縺輔＞縲・
    );
  }

  function requestManualRetryInContext(taskId, context, nowValue) {
    assertLockedOutboxContext(context);
    var normalizedTaskId = String(taskId || '').trim();
    if (!/^tsk_[0-9a-f]{32}$/.test(normalizedTaskId)) {
      throw appError(
        'E_CALENDAR_TASK_ID',
        false,
        '謇句虚蜀榊ｮ溯｡悟ｯｾ雎｡縺ｮTask ID縺御ｸ肴ｭ｣縺ｧ縺吶・
      );
    }
    var row = context.byTaskId[normalizedTaskId];
    var record = row ? readOutboxRow(context, row) : null;
    if (!record) {
      throw appError(
        'E_CALENDAR_OUTBOX_MISSING_TASK',
        false,
        '謇句虚蜀榊ｮ溯｡悟ｯｾ雎｡縺ｮCalendar outbox縺後≠繧翫∪縺帙ｓ縲・
      );
    }
    if (record.status === 'RETRY') {
      return { operation: 'NOOP', record: record };
    }
    if (record.status !== 'DEAD') {
      throw appError(
        'E_CALENDAR_RETRY_CONFLICT',
        false,
        'DEAD迥ｶ諷九〒縺ｯ縺ｪ縺Гalendar job縺ｯ謇句虚蜀榊ｮ溯｡後〒縺阪∪縺帙ｓ縲・
      );
    }
    if (DESIRED_ACTIONS.indexOf(record.desired_action) === -1 ||
        record.desired_action === 'NOOP') {
      throw appError(
        'E_CALENDAR_OUTBOX_CORRUPT',
        false,
        'Calendar job縺ｮ蜀埼幕Action縺御ｸ肴ｭ｣縺ｧ縺吶・
      );
    }
    var timestamp = nowValue instanceof Date
      ? nowValue
      : WorkOsUtilities.now();
    record.status = 'RETRY';
    record.next_retry_at = timestamp;
    record.error_code = '';
    record.updated_at = timestamp;
    writeOutboxRecord(context, row, record);
    return { operation: 'UPDATED', record: record };
  }

  function processNextJob(options) {
    var settings = options || {};
    if (settings.context) {
      return processNextJobInContext(settings.context, settings);
    }
    var prepared = prepareNextJob(settings);
    if (!prepared || prepared.status !== 'READY') {
      return prepared || { status: 'IDLE', processed_count: 0 };
    }
    var execution = executePreparedJob(prepared, settings);
    return commitPreparedJob(prepared, execution, settings);
  }

  function processNextPendingJob(options) {
    return processNextJob(options);
  }

  return Object.freeze({
    TARGET_TYPE: TARGET_TYPE,
    EVENT_TYPE: EVENT_TYPE,
    DESIRED_ACTIONS: DESIRED_ACTIONS,
    JOB_STATUSES: JOB_STATUSES,
    AUTO_CATEGORIES: AUTO_CATEGORIES,
    OUTBOX_IDS: OUTBOX_IDS,
    RETRY_DELAYS_MINUTES: RETRY_DELAYS_MINUTES,
    MAX_RETRIES: MAX_RETRIES,
    AdvancedCalendarGateway: AdvancedCalendarGateway,
    isoDate: isoDate,
    addDaysIso: addDaysIso,
    isEligibleTask: isEligibleTask,
    normalizeInstanceId: normalizeInstanceId,
    deterministicEventId: deterministicEventId,
    buildEventResource: buildEventResource,
    isOwnedEvent: isOwnedEvent,
    eventNeedsUpdate: eventNeedsUpdate,
    determineDesiredAction: determineDesiredAction,
    eventSearchWindow: eventSearchWindow,
    ensureDedicatedCalendar: ensureDedicatedCalendar,
    inspectDedicatedCalendarConfiguration:
      inspectDedicatedCalendarConfiguration,
    createOutboxContext: createOutboxContext,
    createOutboxContextForHeldLock: createOutboxContextForHeldLock,
    withLockedOutboxContext: withLockedOutboxContext,
    readOutboxRow: readOutboxRow,
    findLogicalEmptyOutboxRow: findLogicalEmptyOutboxRow,
    initialDesiredActionForTask: initialDesiredActionForTask,
    enqueueTaskInContext: enqueueTaskInContext,
    enqueueTask: enqueueTask,
    reconcileTasksInContext: reconcileTasksInContext,
    selectNextJob: selectNextJob,
    executeCalendarAction: executeCalendarAction,
    prepareNextJob: prepareNextJob,
    executePreparedJob: executePreparedJob,
    commitPreparedJob: commitPreparedJob,
    processNextJobInContext: processNextJobInContext,
    processNextJob: processNextJob,
    processNextPendingJob: processNextPendingJob,
    requestManualRetryInContext: requestManualRetryInContext,
    assertTaskWriterPatch: assertTaskWriterPatch
  });
}());

