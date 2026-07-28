/**
 * Phase 4 deadline Calendar policy, outbox and provider-neutral gateway.
 *
 * The Google Sheet remains the Task source of truth.  This module only writes
 * managed all-day deadline Events to the dedicated "自動期日管理" Calendar.
 * Callers can inject a gateway, clock, Properties store, Task reader and Task
 * Calendar-state writer so the policy and retry flow are locally testable.
 */
var WorkOsCalendarSync = (function () {
  var TARGET_TYPE = 'DEADLINE_CALENDAR';
  var TARGET_TYPE_ARMED = 'DEADLINE_CALENDAR_ARMED';
  var TARGET_TYPE_AUTHORITY_COMPENSATION =
    'DEADLINE_CALENDAR_AUTHORITY_COMPENSATION';
  var CALENDAR_TARGET_TYPES = Object.freeze([
    TARGET_TYPE,
    TARGET_TYPE_ARMED,
    TARGET_TYPE_AUTHORITY_COMPENSATION
  ]);
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
    'DEAD',
    'CANCELLED'
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
  /*
   * A Calendar action is not transactional with the Sheet.  Before crossing
   * the external boundary, retain the deterministic Event target in the
   * Outbox so an authority loss or an interrupted execution can be cleaned up
   * without trusting a stale Task snapshot.
   */

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

  function isCommittedAuthorityTask(task) {
    return Boolean(task) &&
      (!Object.prototype.hasOwnProperty.call(task, 'authority_state') ||
       String(task.authority_state || '') === 'COMMITTED');
  }

  function expectedManagedEventId(taskId) {
    return deterministicEventId(String(taskId || ''));
  }

  function isCalendarTargetType(value) {
    return CALENDAR_TARGET_TYPES.indexOf(String(value || '')) !== -1;
  }

  function isExternalIoArmedRecord(record) {
    return Boolean(record) &&
      String(record.target_type || '') === TARGET_TYPE_ARMED;
  }

  function isAuthorityCompensationRecord(record) {
    return Boolean(record) &&
      String(record && record.desired_action || '') === 'DELETE' &&
      String(record.target_type || '') ===
        TARGET_TYPE_AUTHORITY_COMPENSATION;
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
        'Calendar claimの保存状態が不正です。'
      );
    }
    var value;
    try {
      value = JSON.parse(raw);
    } catch (error) {
      throw appError(
        'E_CALENDAR_CLAIM_STATE',
        false,
        'Calendar claimの保存状態を解釈できません。',
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
        'Calendar claimの保存値が不正です。'
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
        'Calendar claimが保存上限を超えました。'
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
        'soft execution budgetに達したためCalendar API call前に停止しました。'
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
        'Calendar同期対象の期限日が不正です。'
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
      .replace(/&/g, '＆')
      .replace(/</g, '＜')
      .replace(/>/g, '＞')
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
        'Calendar同期用instanceの形式が不正です。Setup S60を再確認してください。'
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
        'Calendar同期対象のTask IDが不正です。'
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
        'Event生成に必要なTask情報が不足しています。'
      );
    }
    var title = safeText(value.task_title, 300);
    if (!title) {
      throw appError(
        'E_CALENDAR_EVENT_INPUT',
        false,
        'Event生成に必要なTask名がありません。'
      );
    }
    var description = [
      '送信者: ' + safeText(value.sender, 320),
      '期限根拠: ' + safeText(
        WorkOsSchemas.toSheetEnum(
          'DeadlineBasis',
          normalizeEnum(value.deadline_basis, 'DeadlineBasis')
        ),
        30
      ),
      '元メール参照: ' + safeText(value.source_email, 1000),
      taskMarker(taskId),
      instanceMarker(instance)
    ].join('\n');
    return {
      id: deterministicEventId(taskId),
      summary: '【期限】' + title,
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
      'Calendar APIの' + String(operation || '処理') +
        'に失敗しました。入力内容は記録していません。',
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
        'Advanced Calendar serviceを利用できません。'
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
            'Calendar一覧取得を実行予算内で停止しました。'
          );
        }
        if (pageCount >= WorkOsConfig.CALENDAR_LIST_MAX_PAGES) {
          throw appError(
            'E_CALENDAR_LIST_PAGE_LIMIT',
            true,
            'Calendar一覧が上限page数を超えたため安全に停止しました。'
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
          throw wrapApiError(error, 'Calendar一覧取得');
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
            'Calendar一覧のpage tokenが循環したため安全に停止しました。'
          );
        }
        if (pageToken) {
          seenTokens[pageToken] = true;
        }
      } while (pageToken);
      return matches;
    };

  AdvancedCalendarGateway.prototype.getCalendar = function (calendarId) {
    try {
      return this.service.Calendars.get(String(calendarId));
    } catch (error) {
      if (isMissingApiError(error)) {
        return null;
      }
      throw wrapApiError(error, 'Calendar確認');
    }
  };

  AdvancedCalendarGateway.prototype.createCalendar =
    function (summary, instanceId) {
      try {
        return this.service.Calendars.insert({
          summary: String(summary),
          timeZone: WorkOsConfig.TIMEZONE,
          description: 'Google Workspace Personal Work OS v2\n' +
            instanceMarker(String(instanceId))
        });
      } catch (error) {
        throw wrapApiError(error, '専用Calendar作成');
      }
    };

  AdvancedCalendarGateway.prototype.isPrimaryCalendar =
    function (calendarId, resource) {
      if (String(calendarId || '').toLowerCase() === 'primary' ||
          resource && resource.primary === true) {
        return true;
      }
      try {
        var entry = this.service.CalendarList.get(String(calendarId));
        return Boolean(entry && entry.primary === true);
      } catch (error) {
        if (isMissingApiError(error)) {
          return false;
        }
        throw wrapApiError(error, 'Calendar権限境界確認');
      }
    };

  AdvancedCalendarGateway.prototype.getCalendarAccessRole =
    function (calendarId) {
      try {
        var entry = this.service.CalendarList.get(String(calendarId));
        return String(entry && entry.accessRole || '');
      } catch (error) {
        if (isMissingApiError(error)) {
          return '';
        }
        throw wrapApiError(error, 'Calendar所有権確認');
      }
    };

  AdvancedCalendarGateway.prototype.getEvent =
    function (calendarId, eventId) {
      try {
        return this.service.Events.get(
          String(calendarId),
          String(eventId)
        );
      } catch (error) {
        if (isMissingApiError(error)) {
          return null;
        }
        throw wrapApiError(error, 'Event確認');
      }
    };

  AdvancedCalendarGateway.prototype.findEventsByTaskMarker =
    function (calendarId, taskId, dueDate) {
      var window = eventSearchWindow(dueDate);
      if (!window) {
        return [];
      }
      var params = {
        maxResults: 10,
        showDeleted: false,
        singleEvents: true,
        timeMin: window.timeMin,
        timeMax: window.timeMax,
        privateExtendedProperty: [
          'workosTaskId=' + String(taskId)
        ]
      };
      try {
        var response = this.service.Events.list(
          String(calendarId),
          params
        ) || {};
        return (response.items || []).filter(function (event) {
          var privateProperties = eventPrivateProperties(event);
          return String(privateProperties.workosTaskId || '') ===
            String(taskId || '');
        });
      } catch (error) {
        throw wrapApiError(error, 'Event限定検索');
      }
    };

  AdvancedCalendarGateway.prototype.insertEvent =
    function (calendarId, resource) {
      try {
        return this.service.Events.insert(
          resource,
          String(calendarId),
          { sendUpdates: 'none' }
        );
      } catch (error) {
        throw wrapApiError(error, 'Event作成');
      }
    };

  AdvancedCalendarGateway.prototype.updateEvent =
    function (calendarId, eventId, resource) {
      try {
        return this.service.Events.update(
          resource,
          String(calendarId),
          String(eventId),
          { sendUpdates: 'none' }
        );
      } catch (error) {
        throw wrapApiError(error, 'Event更新');
      }
    };

  AdvancedCalendarGateway.prototype.deleteEvent =
    function (calendarId, eventId) {
      try {
        this.service.Events.remove(
          String(calendarId),
          String(eventId),
          { sendUpdates: 'none' }
        );
        return true;
      } catch (error) {
        if (isMissingApiError(error)) {
          return false;
        }
        throw wrapApiError(error, 'Event削除');
      }
    };

  function makeSafeCalendarResult(status, reused) {
    return {
      status: String(status),
      calendar_name: WorkOsConfig.DEADLINE_CALENDAR_NAME,
      reused: Boolean(reused)
    };
  }

  function attachCalendarId(result, calendarId) {
    Object.defineProperty(result, '_calendarId', {
      value: String(calendarId || ''),
      enumerable: false,
      writable: false,
      configurable: false
    });
    return result;
  }

  function assertDedicatedCalendar(gateway, calendarId, resource,
      instanceId, requireOwner, options) {
    assertCalendarBudget(options);
    if (!String(calendarId || '').trim() ||
        String(calendarId).toLowerCase() === 'primary' ||
        gateway.isPrimaryCalendar(calendarId, resource)) {
      throw appError(
        'E_CALENDAR_PRIMARY_FORBIDDEN',
        false,
        'メインCalendarは期限同期の対象にできません。'
      );
    }
    if (!resource ||
        String(resource.summary || '') !==
          WorkOsConfig.DEADLINE_CALENDAR_NAME) {
      throw appError(
        'E_CALENDAR_ID_MISMATCH',
        false,
        '保存済みCalendarが専用Calendarと一致しません。'
      );
    }
    if (String(resource.description || '').indexOf(
      instanceMarker(String(instanceId || ''))
    ) === -1) {
      throw appError(
        'E_CALENDAR_INSTANCE_MISMATCH',
        false,
        '専用Calendarのinstance markerが一致しないため変更を停止しました。'
      );
    }
    if (requireOwner) {
      if (!resource.accessRole &&
          typeof gateway.getCalendarAccessRole === 'function') {
        assertCalendarBudget(options);
      }
      var role = String(
        resource.accessRole ||
        typeof gateway.getCalendarAccessRole === 'function' &&
          gateway.getCalendarAccessRole(calendarId) ||
        ''
      );
      if (role !== 'owner') {
        throw appError(
          'E_CALENDAR_OWNER_REQUIRED',
          false,
          '専用Calendarの所有権を確認できないため変更を停止しました。'
        );
      }
    }
  }

  function resolveDeadlineCalendarUnlocked(options) {
    var settings = options || {};
    var gateway = settings.gateway || new AdvancedCalendarGateway();
    var properties = settings.properties ||
      PropertiesService.getScriptProperties();
    var instanceId = String(
      settings.instance_id ||
      properties.getProperty(WorkOsConfig.PROPERTIES.INSTANCE_ID) ||
      ''
    ).trim();
    if (!instanceId) {
      if (settings.allow_provision !== true) {
        throw appError(
          'E_CALENDAR_INSTANCE_NOT_CONFIGURED',
          false,
          'Calendar同期用instanceが未設定です。Setup S60を再確認してください。'
        );
      }
      instanceId = WorkOsUtilities.makeId('ins_');
      properties.setProperty(
        WorkOsConfig.PROPERTIES.INSTANCE_ID,
        instanceId
      );
    }
    instanceId = normalizeInstanceId(instanceId);
    var propertyKey = calendarIdPropertyKey();
    var savedId = String(properties.getProperty(propertyKey) || '').trim();
    if (savedId) {
      assertCalendarBudget(settings);
      var savedCalendar = gateway.getCalendar(savedId);
      if (!savedCalendar) {
        throw appError(
          'E_CALENDAR_SAVED_NOT_FOUND',
          false,
          '保存済み専用Calendarを確認できないため自動作成を停止しました。'
        );
      }
      assertDedicatedCalendar(
        gateway,
        savedId,
        savedCalendar,
        instanceId,
        true,
        settings
      );
      return attachCalendarId(
        makeSafeCalendarResult('RESOLVED_SAVED', true),
        savedId
      );
    }

    /*
     * Provisioning and adoption belong exclusively to Setup S60. Runtime must
     * never create a Calendar merely because a property is missing.
     */
    if (settings.allow_provision !== true) {
      throw appError(
        'E_CALENDAR_NOT_CONFIGURED',
        false,
        '専用Calendarが未設定です。Setup S60を再確認してください。'
      );
    }

    assertCalendarBudget(settings);
    var matches = gateway.listCalendarsBySummary(
      WorkOsConfig.DEADLINE_CALENDAR_NAME,
      {
        budget: settings.budget,
        reserve_ms: settings.reserve_ms
      }
    );
    if (matches.length > 1) {
      throw appError(
        'E_CALENDAR_DUPLICATE_NAME',
        false,
        '同名Calendarが複数あるため自動選択を停止しました。'
      );
    }
    if (matches.length === 1) {
      var candidateId = String(matches[0].id || '');
      if (!candidateId ||
          candidateId.toLowerCase() === 'primary' ||
          gateway.isPrimaryCalendar(candidateId, matches[0])) {
        throw appError(
          'E_CALENDAR_PRIMARY_FORBIDDEN',
          false,
          '同名のメインCalendarは採用せず、安全のため作成も停止しました。'
        );
      }
      if (String(matches[0].accessRole || '') !== 'owner') {
        throw appError(
          'E_CALENDAR_OWNER_REQUIRED',
          false,
          '同名Calendarの所有権を確認できないため作成を停止しました。'
        );
      }
      /*
       * With calendar.app.created, a successful Calendars.get proves this
       * deployment may manage the Calendar. Merely seeing it through the
       * read-only CalendarList is not sufficient for adoption.
       */
      assertCalendarBudget(settings);
      var candidate = gateway.getCalendar(candidateId);
      if (!candidate) {
        throw appError(
          'E_CALENDAR_APP_ACCESS_REQUIRED',
          false,
          '同名Calendarが本アプリ作成物と証明できないため作成を停止しました。'
        );
      }
      assertDedicatedCalendar(
        gateway,
        candidateId,
        candidate,
        instanceId,
        true,
        settings
      );
      properties.setProperty(propertyKey, candidateId);
      return attachCalendarId(
        makeSafeCalendarResult('RESOLVED_PROVEN', true),
        candidateId
      );
    }

    assertCalendarBudget(settings);
    var created = gateway.createCalendar(
      WorkOsConfig.DEADLINE_CALENDAR_NAME,
      instanceId
    );
    var createdId = String(created && created.id || '').trim();
    assertDedicatedCalendar(
      gateway,
      createdId,
      created,
      instanceId,
      false,
      settings
    );
    properties.setProperty(propertyKey, createdId);
    return attachCalendarId(
      makeSafeCalendarResult('CREATED', false),
      createdId
    );
  }

  function hasHeldLock(settings) {
    if (settings &&
        settings.lock &&
        typeof settings.lock.hasLock === 'function' &&
        settings.lock.hasLock()) {
      return true;
    }
    return Boolean(
      settings &&
      settings.lock_context &&
      settings.lock_context._workOsCalendarLockMarker === LOCK_MARKER
    );
  }

  function acquireCalendarResolutionClaim(settings) {
    var properties = claimPropertyStore(settings);
    var nowValue = nowFromSettings(settings);
    return WorkOsUtilities.withScriptLock(function () {
      var current = parseClaimProperty(
        properties,
        CALENDAR_RESOLUTION_CLAIM_PROPERTY,
        nowValue
      );
      if (current && current.active) {
        throw appError(
          'E_CALENDAR_RESOLUTION_BUSY',
          true,
          '別のCalendar確認処理が進行中です。'
        );
      }
      var claim = {
        token: WorkOsUtilities.makeId('clm_'),
        claimed_at_ms: nowValue.getTime(),
        expires_at_ms:
          nowValue.getTime() + CALENDAR_CLAIM_TTL_MS
      };
      persistClaimProperty(
        properties,
        CALENDAR_RESOLUTION_CLAIM_PROPERTY,
        claim
      );
      return claim;
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  function releaseCalendarResolutionClaim(settings, claim) {
    var properties = claimPropertyStore(settings);
    var nowValue = nowFromSettings(settings);
    return WorkOsUtilities.withScriptLock(function () {
      return clearOwnedClaimProperty(
        properties,
        CALENDAR_RESOLUTION_CLAIM_PROPERTY,
        claim && claim.token,
        nowValue
      );
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  function resolveDeadlineCalendar(options) {
    var settings = options || {};
    if (hasHeldLock(settings)) {
      throw appError(
        'E_CALENDAR_LOCK_BOUNDARY',
        true,
        'Calendar外部I/OはScript Lock外で実行してください。'
      );
    }
    var claim = acquireCalendarResolutionClaim(settings);
    var result;
    var primaryError = null;
    try {
      /*
       * The durable logical claim serializes resolution/provisioning, while
       * the physical Script Lock has already been released. CalendarList,
       * Calendars.get/insert and ownership checks therefore never wait under
       * the shared mutation Lock.
       */
      result = resolveDeadlineCalendarUnlocked(settings);
    } catch (error) {
      primaryError = error;
    }
    try {
      releaseCalendarResolutionClaim(settings, claim);
    } catch (releaseError) {
      if (!primaryError) {
        throw releaseError;
      }
    }
    if (primaryError) {
      throw primaryError;
    }
    return result;
  }

  /**
   * Setup S60 entry point. The returned object intentionally has no enumerable
   * Calendar ID; the ID is persisted only in Script Properties.
   */
  function ensureDedicatedCalendar(options) {
    var settings = {};
    Object.keys(options || {}).forEach(function (key) {
      settings[key] = options[key];
    });
    settings.allow_provision = true;
    var resolved = resolveDeadlineCalendar(settings);
    return makeSafeCalendarResult(
      resolved.status,
      resolved.reused
    );
  }

  /**
   * Read-only configuration inspection for diagnostics. Remote verification is
   * opt-in because Quick Diagnostic must not perform external Calendar calls.
   * No Calendar ID is returned in either mode.
   */
  function inspectDedicatedCalendarConfiguration(options) {
    var settings = options || {};
    var properties = settings.properties ||
      PropertiesService.getScriptProperties();
    var saved = String(
      properties.getProperty(calendarIdPropertyKey()) || ''
    ).trim();
    var result = {
      calendar_name: WorkOsConfig.DEADLINE_CALENDAR_NAME,
      property_present: Boolean(saved),
      instance_marker_ok: false,
      remotely_verified: false,
      status: saved ? 'CONFIGURED_UNVERIFIED' : 'NOT_CONFIGURED'
    };
    try {
      normalizeInstanceId(
        properties.getProperty(WorkOsConfig.PROPERTIES.INSTANCE_ID)
      );
      result.instance_marker_ok = true;
    } catch (instanceError) {
      var safeInstanceError = WorkOsUtilities.safeError(
        instanceError,
        'CALENDAR_SYNC'
      );
      result.status = 'ERROR';
      result.error_code = safeInstanceError.code;
      return result;
    }
    if (!saved || !settings.verify_remote) {
      return result;
    }
    try {
      var gateway = settings.gateway || new AdvancedCalendarGateway();
      assertCalendarBudget(settings);
      var resource = gateway.getCalendar(saved);
      if (!resource) {
        result.status = 'CONFIGURED_NOT_FOUND';
        return result;
      }
      assertDedicatedCalendar(
        gateway,
        saved,
        resource,
        properties.getProperty(WorkOsConfig.PROPERTIES.INSTANCE_ID),
        true,
        settings
      );
      result.remotely_verified = true;
      result.status = 'CONFIGURED';
      return result;
    } catch (error) {
      if (error && error.code === 'E_BUDGET_EXHAUSTED') {
        throw error;
      }
      var safe = WorkOsUtilities.safeError(error, 'CALENDAR_SYNC');
      result.status = 'ERROR';
      result.error_code = safe.code;
      return result;
    }
  }

  function buildOutboxContext(sheet, values, lockMarker) {
    var byTaskId = {};
    var bySyncId = {};
    var logicalRows = [];
    var duplicateTaskIds = [];
    var duplicateSyncIds = [];
    (values || []).forEach(function (row, index) {
      var physicalRow = WorkOsConfig.DATA_START_ROW + index;
      var syncId = String(row[0] || '').trim();
      var taskId = String(row[1] || '').trim();
      if (!syncId && !taskId) {
        return;
      }
      if (!syncId || !taskId) {
        throw appError(
          'E_CALENDAR_OUTBOX_CORRUPT',
          false,
          '同期状態に主キー欠落行があります。'
        );
      }
      if (!/^syn_[0-9a-f]{32}$/.test(syncId) ||
          !/^tsk_[0-9a-f]{32}$/.test(taskId) ||
          !isCalendarTargetType(row[2]) ||
          DESIRED_ACTIONS.indexOf(String(row[3] || '')) === -1 ||
          JOB_STATUSES.indexOf(String(row[5] || '')) === -1 ||
          !Number.isInteger(Number(row[6])) ||
          Number(row[6]) < 0 ||
          (String(row[10] || '') &&
           !WorkOsUtilities.isSafeIdentifier(String(row[10])))) {
        throw appError(
          'E_CALENDAR_OUTBOX_CORRUPT',
          false,
          '同期状態に不正な保存値があるため処理を停止しました。'
        );
      }
      [7, 8, 9, 11].forEach(function (columnIndex) {
        var dateValue = row[columnIndex];
        if (dateValue !== '' &&
            dateValue != null &&
            (!(dateValue instanceof Date) ||
             Number.isNaN(dateValue.getTime())) &&
            Number.isNaN(Date.parse(String(dateValue)))) {
          throw appError(
            'E_CALENDAR_OUTBOX_CORRUPT',
            false,
            '同期状態に不正な日時があるため処理を停止しました。'
          );
        }
      });
      if (byTaskId[taskId]) {
        duplicateTaskIds.push(taskId);
      } else {
        byTaskId[taskId] = physicalRow;
      }
      if (bySyncId[syncId]) {
        duplicateSyncIds.push(syncId);
      } else {
        bySyncId[syncId] = physicalRow;
      }
      logicalRows.push(physicalRow);
    });
    var context = {
      sheet: sheet,
      values: values,
      byTaskId: byTaskId,
      bySyncId: bySyncId,
      logicalRows: logicalRows,
      duplicateTaskIds: duplicateTaskIds,
      duplicateSyncIds: duplicateSyncIds
    };
    if (lockMarker === LOCK_MARKER) {
      Object.defineProperty(context, '_workOsCalendarLockMarker', {
        value: LOCK_MARKER,
        enumerable: false,
        writable: false,
        configurable: false
      });
    }
    return context;
  }

  function createOutboxContext(sheet, lockMarker) {
    if (!sheet) {
      throw appError(
        'E_CALENDAR_OUTBOX_MISSING',
        false,
        '同期状態Sheetがありません。'
      );
    }
    if (sheet.getMaxColumns() !== OUTBOX_IDS.length) {
      throw appError(
        'E_CALENDAR_OUTBOX_SCHEMA',
        false,
        '同期状態の列数が仕様と一致しません。'
      );
    }
    var ids = sheet.getRange(
      WorkOsConfig.HEADER_ID_ROW,
      1,
      1,
      OUTBOX_IDS.length
    ).getValues()[0].map(function (value) {
      return String(value || '').trim();
    });
    if (JSON.stringify(ids) !== JSON.stringify(OUTBOX_IDS)) {
      throw appError(
        'E_CALENDAR_OUTBOX_SCHEMA',
        false,
        '同期状態の内部列IDが仕様と一致しません。'
      );
    }
    var rowCount = Math.max(
      0,
      sheet.getMaxRows() - WorkOsConfig.DATA_START_ROW + 1
    );
    var values = rowCount
      ? sheet.getRange(
        WorkOsConfig.DATA_START_ROW,
        1,
        rowCount,
        OUTBOX_IDS.length
      ).getValues()
      : [];
    var context = buildOutboxContext(sheet, values, lockMarker);
    if (context.duplicateTaskIds.length ||
        context.duplicateSyncIds.length) {
      throw appError(
        'E_CALENDAR_OUTBOX_DUPLICATE',
        false,
        '同期状態に主キー重複があるため処理を停止しました。'
      );
    }
    return context;
  }

  function createOutboxContextForHeldLock(sheet, lock) {
    if (!lock ||
        typeof lock.hasLock !== 'function' ||
        !lock.hasLock()) {
      throw appError(
        'E_LOCK_REQUIRED',
        false,
        '同期状態の更新にはScript Lockが必要です。'
      );
    }
    return createOutboxContext(sheet, LOCK_MARKER);
  }

  function withLockedOutboxContext(sheet, callback) {
    return WorkOsUtilities.withScriptLock(function (lock) {
      return callback(
        createOutboxContextForHeldLock(sheet, lock),
        lock
      );
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  function assertLockedOutboxContext(context) {
    if (!context ||
        context._workOsCalendarLockMarker !== LOCK_MARKER) {
      throw appError(
        'E_LOCK_REQUIRED',
        false,
        '同期状態の更新にはScript Lockが必要です。'
      );
    }
  }

  function readOutboxRow(context, physicalRow) {
    var index = Number(physicalRow) - WorkOsConfig.DATA_START_ROW;
    var row = context.values[index];
    if (!row) {
      return null;
    }
    var result = {};
    OUTBOX_IDS.forEach(function (id, columnIndex) {
      result[id] = row[columnIndex];
    });
    result.retry_count = Number(result.retry_count || 0);
    return result;
  }

  function findLogicalEmptyOutboxRow(context) {
    for (var index = 0; index < context.values.length; index += 1) {
      if (WorkOsUtilities.isBlank(context.values[index][0]) &&
          WorkOsUtilities.isBlank(context.values[index][1])) {
        return WorkOsConfig.DATA_START_ROW + index;
      }
    }
    return WorkOsConfig.DATA_START_ROW + context.values.length;
  }

  function ensureOutboxCapacity(context, physicalRow) {
    var current = context.sheet.getMaxRows();
    if (physicalRow <= current) {
      return 0;
    }
    var count = Math.ceil(
      (physicalRow - current) / WorkOsConfig.ROW_EXPANSION_UNIT
    ) * WorkOsConfig.ROW_EXPANSION_UNIT;
    context.sheet.insertRowsAfter(current, count);
    return count;
  }

  function writeOutboxRecord(context, physicalRow, record) {
    assertLockedOutboxContext(context);
    var output = OUTBOX_IDS.map(function (id) {
      return record[id] == null ? '' : record[id];
    });
    ensureOutboxCapacity(context, physicalRow);
    context.sheet.getRange(
      physicalRow,
      1,
      1,
      OUTBOX_IDS.length
    ).setValues([output]);
    while (context.values.length <=
        physicalRow - WorkOsConfig.DATA_START_ROW) {
      context.values.push(new Array(OUTBOX_IDS.length).fill(''));
    }
    context.values[
      physicalRow - WorkOsConfig.DATA_START_ROW
    ] = output;
    context.byTaskId[String(record.task_id)] = physicalRow;
    context.bySyncId[String(record.sync_id)] = physicalRow;
    if (context.logicalRows.indexOf(physicalRow) === -1) {
      context.logicalRows.push(physicalRow);
    }
  }

  function initialDesiredActionForTask(task, timezone) {
    var eventId = String(task && task.calendar_event_id || '').trim();
    if (isEligibleTask(task, timezone)) {
      return eventId ? 'UPDATE' : 'CREATE';
    }
    return eventId ? 'DELETE' : 'NOOP';
  }

  function enqueueTaskInContext(task, context, options) {
    assertLockedOutboxContext(context);
    var settings = options || {};
    var nowValue = settings.now || WorkOsUtilities.now();
    var taskId = String(task && task.task_id || '').trim();
    if (!/^tsk_[0-9a-f]{32}$/.test(taskId)) {
      throw appError(
        'E_CALENDAR_TASK_ID',
        false,
        '同期状態へ投入するTask IDが不正です。'
      );
    }
    var desiredAction = settings.desired_action ||
      initialDesiredActionForTask(task, settings.timezone);
    if (DESIRED_ACTIONS.indexOf(desiredAction) === -1) {
      throw appError(
        'E_CALENDAR_ACTION',
        false,
        'Calendar desired actionが不正です。'
      );
    }
    var eventId = String(task.calendar_event_id || '').trim();
    var existingRow = context.byTaskId[taskId];
    if (existingRow) {
      var existing = readOutboxRow(context, existingRow);
      /*
       * A concurrent Task edit may update normal outbox fields, but an armed
       * row retains its separate target_type marker until the pending external
       * effect has been reconciled.  Do not use error_code as that marker.
       */
      var retainExternalIoArm = isExternalIoArmedRecord(existing);
      var same = String(existing.desired_action) === desiredAction &&
        String(existing.event_id || '') === eventId;
      if (existing.status === 'DEAD' &&
          !settings.force_enqueue) {
        return {
          operation: 'NOOP',
          desired_action: existing.desired_action,
          status: 'DEAD'
        };
      }
      if (same &&
          (existing.status === 'PENDING' ||
           existing.status === 'RETRY' ||
           existing.status === 'DONE' ||
           existing.status === 'DEAD') &&
          !settings.force_enqueue) {
        return {
          operation: 'NOOP',
          desired_action: desiredAction,
          status: existing.status
        };
      }
      existing.desired_action = desiredAction;
      existing.event_id = retainExternalIoArm
        ? expectedManagedEventId(taskId)
        : eventId;
      existing.target_type = retainExternalIoArm
        ? TARGET_TYPE_ARMED
        : TARGET_TYPE;
      /*
       * An armed external call may have completed before this concurrent Task
       * edit. Keep it due even when the current Task has no ordinary Calendar
       * work, so a crash before commit can still locate/delete the deterministic
       * Event instead of stranding an ARMED+DONE row.
       */
      existing.status = retainExternalIoArm || desiredAction !== 'NOOP'
        ? 'PENDING'
        : 'DONE';
      existing.retry_count = 0;
      existing.next_retry_at = '';
      existing.last_attempt_at = '';
      existing.error_code = '';
      existing.updated_at = nowValue;
      writeOutboxRecord(context, existingRow, existing);
      return {
        operation: 'UPDATE',
        desired_action: desiredAction,
        status: existing.status
      };
    }
    /*
     * A Task with no owned Event and no Calendar eligibility has no external
     * work to persist. Avoid growing the Outbox with permanent DONE/NOOP rows.
     */
    if (desiredAction === 'NOOP') {
      return {
        operation: 'NOOP',
        desired_action: desiredAction,
        status: 'DONE'
      };
    }
    var record = {
      sync_id: WorkOsUtilities.makeId('syn_'),
      task_id: taskId,
      target_type: TARGET_TYPE,
      desired_action: desiredAction,
      event_id: eventId,
      status: 'PENDING',
      retry_count: 0,
      next_retry_at: '',
      last_attempt_at: '',
      last_success_at: '',
      error_code: '',
      updated_at: nowValue
    };
    writeOutboxRecord(
      context,
      findLogicalEmptyOutboxRow(context),
      record
    );
    return {
      operation: 'INSERT',
      desired_action: desiredAction,
      status: record.status
    };
  }

  function enqueueTask(task, options) {
    var settings = options || {};
    var sheet = settings.sheet ||
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
        WorkOsConfig.SHEETS.SYNC_STATE
      );
    if (settings.context) {
      return enqueueTaskInContext(task, settings.context, settings);
    }
    return withLockedOutboxContext(sheet, function (context) {
      return enqueueTaskInContext(task, context, settings);
    });
  }

  /**
   * Reconcile the already-loaded Task index into the already-locked outbox.
   * This function has no Calendar side effect. It is safe for Worker/EditHandler
   * to call after Task writes while retaining the same Script Lock.
   */
  function reconcileTasksInContext(taskContext, outboxContext, nowOrOptions) {
    assertLockedOutboxContext(outboxContext);
    var settings = nowOrOptions instanceof Date
      ? { now: nowOrOptions }
      : (nowOrOptions || {});
    var counts = {
      inspected_count: 0,
      inserted_count: 0,
      updated_count: 0,
      noop_count: 0
    };
    WorkOsTaskRepository.operationalTasks(taskContext || { logicalRows: [] })
      .forEach(function (task) {
        var syncStatus = String(task.calendar_sync_status || '');
        var existingRow = outboxContext.byTaskId[
          String(task.task_id || '')
        ];
        var existingRecord = existingRow
          ? readOutboxRow(outboxContext, existingRow)
          : null;
        var result = enqueueTaskInContext(task, outboxContext, {
          now: settings.now || WorkOsUtilities.now(),
          timezone: settings.timezone || WorkOsConfig.TIMEZONE,
          force_enqueue: settings.force_enqueue === true ||
            (
              (syncStatus === 'PENDING' ||
               syncStatus === 'DELETE_PENDING') &&
              existingRecord &&
              existingRecord.status === 'DONE'
            )
        });
        counts.inspected_count += 1;
        if (result.operation === 'INSERT') {
          counts.inserted_count += 1;
        } else if (result.operation === 'UPDATE') {
          counts.updated_count += 1;
        } else {
          counts.noop_count += 1;
        }
      });
    return counts;
  }

  function isDueForAttempt(record, nowValue) {
    if (record.status === 'PENDING') {
      return true;
    }
    if (record.status !== 'RETRY') {
      return false;
    }
    if (!record.next_retry_at) {
      return true;
    }
    return new Date(record.next_retry_at).getTime() <=
      nowValue.getTime();
  }

  function selectNextJob(context, nowValue, allowedTaskIds) {
    var allowed = null;
    if (Array.isArray(allowedTaskIds)) {
      allowed = {};
      allowedTaskIds.forEach(function (taskId) {
        allowed[String(taskId || '')] = true;
      });
    }
    for (var index = 0; index < context.logicalRows.length; index += 1) {
      var record = readOutboxRow(
        context,
        context.logicalRows[index]
      );
      if (record &&
          isCalendarTargetType(record.target_type) &&
          (!allowed || allowed[String(record.task_id || '')]) &&
          isDueForAttempt(record, nowValue)) {
        return {
          row: context.logicalRows[index],
          record: record
        };
      }
    }
    return null;
  }

  /*
   * An Outbox row is derivative state. If its Task can no longer be resolved
   * through the authority-aware reader, it must not repeatedly occupy the
   * first Calendar job or cross the external I/O boundary. A later explicit
   * repair/Task commit may deterministically enqueue a fresh row.
   */
  function cancelAuthorityExcludedJob(context, selected, nowValue) {
    var record = cloneRecord(selected.record);
    record.target_type = TARGET_TYPE;
    record.status = 'CANCELLED';
    record.retry_count = 0;
    record.next_retry_at = '';
    record.last_attempt_at = nowValue;
    record.error_code = 'E_CALENDAR_TASK_AUTHORITY_EXCLUDED';
    record.updated_at = nowValue;
    writeOutboxRecord(context, selected.row, record);
    return record;
  }

  function armOutboxRecordForExternalIo(context, selected, nowValue) {
    var record = cloneRecord(selected.record);
    var expectedEventId = expectedManagedEventId(record.task_id);
    var storedEventId = String(record.event_id || '').trim();
    if (storedEventId && storedEventId !== expectedEventId) {
      throw appError(
        'E_CALENDAR_EVENT_ID_MISMATCH',
        false,
        'Calendar outbox Event IDがTask由来の決定的IDと一致しません。'
      );
    }
    record.event_id = expectedEventId;
    record.target_type = TARGET_TYPE_ARMED;
    record.updated_at = nowValue;
    writeOutboxRecord(context, selected.row, record);
    return record;
  }

  function scheduleAuthorityExcludedCompensation(
    context,
    row,
    currentRecord,
    nowValue
  ) {
    if (!row || !currentRecord || !isExternalIoArmedRecord(currentRecord)) {
      return { scheduled: false, action: '' };
    }
    var record = cloneRecord(currentRecord);
    record.desired_action = 'DELETE';
    record.event_id = expectedManagedEventId(record.task_id);
    record.target_type = TARGET_TYPE_AUTHORITY_COMPENSATION;
    record.status = 'PENDING';
    record.retry_count = 0;
    record.next_retry_at = '';
    record.last_attempt_at = '';
    record.error_code = 'E_CALENDAR_TASK_AUTHORITY_COMPENSATION';
    record.updated_at = nowValue;
    writeOutboxRecord(context, row, record);
    return { scheduled: true, action: 'DELETE', record: record };
  }

  function outboxSheetForSettings(settings) {
    return settings.sheet ||
      settings.spreadsheet &&
        settings.spreadsheet.getSheetByName(
          WorkOsConfig.SHEETS.SYNC_STATE
        ) ||
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
        WorkOsConfig.SHEETS.SYNC_STATE
      );
  }

  function readTaskForHeldLock(settings, taskId, lock) {
    if (typeof settings.task_reader_in_context === 'function') {
      return settings.task_reader_in_context(
        String(taskId || ''),
        lock
      );
    }
    if (typeof settings.task_reader === 'function') {
      return settings.task_reader(String(taskId || ''));
    }
    throw appError(
      'E_CALENDAR_TASK_READER',
      false,
      'Calendar同期用Task readerがありません。'
    );
  }

  function readAuthorityTaskForHeldLock(settings, taskId, lock) {
    try {
      return readTaskForHeldLock(settings, taskId, lock);
    } catch (error) {
      if (error && /^E_TASK_AUTHORITY_/.test(String(error.code || ''))) {
        return null;
      }
      throw error;
    }
  }

  function taskWriterForHeldLock(settings, lock, expectedRowVersion) {
    if (typeof settings.task_writer_in_context === 'function') {
      return function (taskId, patch) {
        return settings.task_writer_in_context(
          String(taskId || ''),
          patch,
          expectedRowVersion,
          lock
        );
      };
    }
    if (typeof settings.task_writer === 'function') {
      return function (taskId, patch) {
        return settings.task_writer(
          String(taskId || ''),
          patch,
          expectedRowVersion
        );
      };
    }
    throw appError(
      'E_CALENDAR_TASK_WRITER',
      false,
      'Calendar同期用Task writerがありません。'
    );
  }

  function acquireCalendarJobClaim(
    properties,
    selected,
    task,
    nowValue
  ) {
    var current = parseClaimProperty(
      properties,
      CALENDAR_JOB_CLAIM_PROPERTY,
      nowValue
    );
    if (current && current.active) {
      return null;
    }
    var claim = {
      token: WorkOsUtilities.makeId('clm_'),
      sync_id: String(selected.record.sync_id || ''),
      task_id: String(selected.record.task_id || ''),
      outbox_fingerprint: outboxFingerprint(selected.record),
      task_fingerprint: taskFingerprint(task),
      task_row_version: Number(task && task.row_version || 0),
      claimed_at_ms: nowValue.getTime(),
      expires_at_ms: nowValue.getTime() + CALENDAR_CLAIM_TTL_MS
    };
    if (!/^syn_[0-9a-f]{32}$/.test(claim.sync_id) ||
        !/^tsk_[0-9a-f]{32}$/.test(claim.task_id) ||
        !/^[0-9a-f]{64}$/.test(claim.outbox_fingerprint) ||
        !/^[0-9a-f]{64}$/.test(claim.task_fingerprint) ||
        !Number.isInteger(claim.task_row_version) ||
        claim.task_row_version < 0) {
      throw appError(
        'E_CALENDAR_CLAIM_STATE',
        false,
        'Calendar job claimを安全に作成できません。'
      );
    }
    persistClaimProperty(
      properties,
      CALENDAR_JOB_CLAIM_PROPERTY,
      claim
    );
    return claim;
  }

  function assertOwnedCalendarJobClaim(
    properties,
    prepared,
    nowValue
  ) {
    var current = parseClaimProperty(
      properties,
      CALENDAR_JOB_CLAIM_PROPERTY,
      nowValue
    );
    if (!current ||
        current.active !== true ||
        current.token !== String(prepared && prepared.claim_token || '') ||
        current.sync_id !== String(prepared && prepared.sync_id || '') ||
        current.task_id !== String(prepared && prepared.task_id || '') ||
        current.outbox_fingerprint !==
          String(prepared && prepared.outbox_fingerprint || '') ||
        current.task_fingerprint !==
          String(prepared && prepared.task_fingerprint || '')) {
      throw appError(
        'E_CALENDAR_JOB_CLAIM_CONFLICT',
        true,
        'Calendar jobのownershipが変わったため結果を保存しませんでした。'
      );
    }
    return current;
  }

  /**
   * Atomically select one due outbox row and persist a bounded logical claim.
   * No Calendar service is touched in this function.
   */
  function prepareNextJob(options) {
    var settings = options || {};
    var sheet = outboxSheetForSettings(settings);
    var properties = claimPropertyStore(settings);
    return WorkOsUtilities.withScriptLock(function (lock) {
      var nowValue = nowFromSettings(settings);
      if (settings.budget &&
          settings.budget.isExhausted(
            settings.reserve_ms == null
              ? WorkOsConfig.MANUAL_WORKER_RESERVE_MS
              : settings.reserve_ms
          )) {
        return { status: 'PAUSED', processed_count: 0 };
      }
      var context = createOutboxContextForHeldLock(sheet, lock);
      if (typeof settings.task_reader !== 'function' &&
          typeof settings.task_reader_in_context !== 'function') {
        throw appError(
          'E_CALENDAR_TASK_READER',
          false,
          'Calendar同期用Task readerがありません。'
        );
      }
      if (typeof settings.task_writer !== 'function' &&
          typeof settings.task_writer_in_context !== 'function') {
        throw appError(
          'E_CALENDAR_TASK_WRITER',
          false,
          'Calendar同期用Task writerがありません。'
        );
      }
      var authorityExcludedCount = 0;
      while (true) {
        var selected = selectNextJob(
          context,
          nowValue,
          settings.allowed_task_ids
        );
        if (!selected) {
          return {
            status: 'IDLE',
            processed_count: 0,
            authority_excluded_count: authorityExcludedCount
          };
        }
        var task = readAuthorityTaskForHeldLock(
          settings,
          selected.record.task_id,
          lock
        );
        var authorityCompensation = false;
        if (!isCommittedAuthorityTask(task)) {
          authorityExcludedCount += 1;
          if (isAuthorityCompensationRecord(selected.record)) {
            authorityCompensation = true;
          } else if (isExternalIoArmedRecord(selected.record)) {
            var scheduled = scheduleAuthorityExcludedCompensation(
              context,
              selected.row,
              selected.record,
              nowValue
            );
            if (!scheduled.scheduled) {
              cancelAuthorityExcludedJob(context, selected, nowValue);
              continue;
            }
            selected = { row: selected.row, record: scheduled.record };
            authorityCompensation = true;
          } else {
            cancelAuthorityExcludedJob(context, selected, nowValue);
            continue;
          }
        }

        /*
         * Claim first.  The normal path is armed only after execute performs
         * its final Task-authority revalidation below, immediately before
         * Calendar I/O.  This prevents a prepare-time arm from turning a
         * known pre-I/O authority exclusion into an unnecessary GET/DELETE.
         */
        var claim = acquireCalendarJobClaim(
          properties,
          selected,
          authorityCompensation ? null : task,
          nowValue
        );
        if (!claim) {
          return {
            status: 'BUSY',
            processed_count: 0,
            authority_excluded_count: authorityExcludedCount
          };
        }
        return {
          status: 'READY',
          claim_token: claim.token,
          sync_id: claim.sync_id,
          task_id: claim.task_id,
          outbox_fingerprint: claim.outbox_fingerprint,
          task_fingerprint: claim.task_fingerprint,
          task_row_version: claim.task_row_version,
          outbox_record: cloneRecord(selected.record),
          task: authorityCompensation ? null : cloneRecord(task),
          authority_compensation: authorityCompensation,
          authority_excluded_count: authorityExcludedCount
        };
      }
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  function assertTaskWriterPatch(patch) {
    var allowed = {
      calendar_event_id: true,
      calendar_sync_status: true,
      last_calendar_sync_at: true
    };
    Object.keys(patch || {}).forEach(function (field) {
      if (!allowed[field]) {
        throw appError(
          'E_CALENDAR_TASK_PATCH',
          false,
          'Calendar同期がTask業務fieldを変更しようとしたため停止しました。'
        );
      }
    });
  }

  function writeTaskCalendarState(writer, taskId, patch) {
    assertTaskWriterPatch(patch);
    if (typeof writer !== 'function') {
      throw appError(
        'E_CALENDAR_TASK_WRITER',
        false,
        'Calendar同期用Task writerがありません。'
      );
    }
    writer(String(taskId), patch);
  }

  function locateExistingEvent(gateway, calendarId, task, record,
      instanceId, timezone, options) {
    var savedEventId = String(
      record.event_id || task.calendar_event_id || ''
    ).trim();
    if (savedEventId) {
      assertCalendarBudget(options);
    }
    var event = savedEventId
      ? gateway.getEvent(calendarId, savedEventId)
      : null;
    if (event) {
      if (!isOwnedEvent(event, task.task_id, instanceId)) {
        throw appError(
          'E_CALENDAR_EVENT_FOREIGN',
          false,
          '保存済みEventの所有markerが一致しないため変更を停止しました。'
        );
      }
      return event;
    }
    var dueDate = isoDate(task.due_date, timezone);
    if (!dueDate) {
      return null;
    }
    assertCalendarBudget(options);
    var matches = gateway.findEventsByTaskMarker(
      calendarId,
      task.task_id,
      dueDate
    ) || [];
    if (matches.length > 1) {
      throw appError(
        'E_CALENDAR_EVENT_DUPLICATE',
        false,
        'Task markerが一致するEventが複数あるため処理を停止しました。'
      );
    }
    if (matches.length === 1) {
      if (!isOwnedEvent(matches[0], task.task_id, instanceId)) {
        throw appError(
          'E_CALENDAR_EVENT_FOREIGN',
          false,
          '検索したEventの所有markerが一致しないため変更を停止しました。'
        );
      }
      return matches[0];
    }
    return null;
  }

  function executeCalendarAction(gateway, calendarId, task, record,
      instanceId, timezone, options) {
    var eligible = isEligibleTask(task, timezone);
    var existing = locateExistingEvent(
      gateway,
      calendarId,
      task,
      record,
      instanceId,
      timezone,
      options
    );
    if (!existing &&
        !isoDate(task.due_date, timezone) &&
        (record.desired_action === 'DELETE' ||
         String(task.calendar_sync_status || '') === 'SYNCED' ||
         String(task.calendar_sync_status || '') === 'DELETE_PENDING')) {
      throw appError(
        'E_CALENDAR_EVENT_ID_MISSING',
        false,
        '既存Eventを限定検索できるEvent IDまたは期限日がないため停止しました。'
      );
    }
    if (!eligible) {
      if (!existing) {
        return {
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
          'Event ID競合を安全に解決できないため処理を停止しました。'
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
    record.target_type = TARGET_TYPE;
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

  function markAuthorityCompensationSuccess(
    context,
    selected,
    result,
    nowValue
  ) {
    var record = selected.record;
    if (!isAuthorityCompensationRecord(record) ||
        !result ||
        result.calendar_sync_status !== 'NOT_REQUIRED') {
      throw appError(
        'E_CALENDAR_COMPENSATION_STATE',
        false,
        'Authority除外後のCalendar補償状態が不正です。'
      );
    }
    record.target_type = TARGET_TYPE;
    record.status = 'CANCELLED';
    record.retry_count = 0;
    record.next_retry_at = '';
    record.last_attempt_at = nowValue;
    record.last_success_at = nowValue;
    record.error_code = 'E_CALENDAR_TASK_AUTHORITY_EXCLUDED';
    record.updated_at = nowValue;
    writeOutboxRecord(context, selected.row, record);
    return {
      status: 'CANCELLED',
      action: result.action,
      retry_count: record.retry_count
    };
  }

  function revalidatePreparedExecution(prepared, settings) {
    var sheet = outboxSheetForSettings(settings);
    var properties = claimPropertyStore(settings);
    return WorkOsUtilities.withScriptLock(function (lock) {
      var nowValue = nowFromSettings(settings);
      var claim = assertOwnedCalendarJobClaim(
        properties,
        prepared,
        nowValue
      );
      var context = createOutboxContextForHeldLock(sheet, lock);
      var row = context.bySyncId[String(prepared.sync_id || '')];
      var record = row ? readOutboxRow(context, row) : null;
      if (!record ||
          String(record.task_id || '') !== String(prepared.task_id || '') ||
          outboxFingerprint(record) !==
            String(prepared.outbox_fingerprint || '')) {
        return { status: 'SKIPPED_STALE' };
      }
      var task = readAuthorityTaskForHeldLock(
        settings,
        prepared.task_id,
        lock
      );
      if (prepared.authority_compensation === true) {
        if (isCommittedAuthorityTask(task) ||
            !isAuthorityCompensationRecord(record)) {
          return { status: 'SKIPPED_STALE' };
        }
        return {
          status: 'AUTHORITY_COMPENSATION',
          record: record
        };
      }
      if (!isCommittedAuthorityTask(task)) {
        return { status: 'SKIPPED_AUTHORITY_EXCLUDED' };
      }
      /*
       * This is the last lock-held point before Calendar I/O.  Persist the
       * deterministic cleanup target and update the claim atomically with
       * that arm, then release the lock before calling Calendar.
       */
      var armedRecord = armOutboxRecordForExternalIo(
        context,
        { row: row, record: record },
        nowValue
      );
      claim.outbox_fingerprint = outboxFingerprint(armedRecord);
      delete claim.active;
      persistClaimProperty(
        properties,
        CALENDAR_JOB_CLAIM_PROPERTY,
        claim
      );
      prepared.outbox_fingerprint = claim.outbox_fingerprint;
      prepared.outbox_record = cloneRecord(armedRecord);
      return {
        status: 'AUTHORIZED',
        task: task,
        record: armedRecord
      };
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  function executeAuthorityCompensation(
    gateway,
    calendarId,
    record,
    instanceId,
    options
  ) {
    if (!isAuthorityCompensationRecord(record)) {
      throw appError(
        'E_CALENDAR_COMPENSATION_STATE',
        false,
        'Authority除外後のCalendar補償対象が不正です。'
      );
    }
    var taskId = String(record.task_id || '');
    var eventId = expectedManagedEventId(taskId);
    assertCalendarBudget(options);
    var existing = gateway.getEvent(calendarId, eventId);
    if (!existing) {
      return {
        action: 'NOOP',
        event_id: '',
        calendar_sync_status: 'NOT_REQUIRED'
      };
    }
    if (!isOwnedEvent(existing, taskId, instanceId)) {
      throw appError(
        'E_CALENDAR_EVENT_FOREIGN',
        false,
        'Authority除外後の補償対象Eventの所有markerが一致しません。'
      );
    }
    assertCalendarBudget(options);
    gateway.deleteEvent(calendarId, eventId);
    return {
      action: 'DELETE',
      event_id: '',
      calendar_sync_status: 'NOT_REQUIRED'
    };
  }

  /**
   * Execute only the Calendar-facing portion of a prepared job.
   *
   * A short lock-held preflight revalidates Task authority and arms the Outbox
   * before the external boundary. The Lock is released before any Calendar
   * list/get/find/create/update/delete call.
   */
  function executePreparedJob(prepared, options) {
    var settings = options || {};
    if (!prepared || prepared.status !== 'READY') {
      throw appError(
        'E_CALENDAR_JOB_NOT_PREPARED',
        false,
        'Calendar jobが外部実行用に準備されていません。'
      );
    }
    var properties = claimPropertyStore(settings);
    var preflight = revalidatePreparedExecution(prepared, settings);
    if (preflight.status === 'SKIPPED_AUTHORITY_EXCLUDED' ||
        preflight.status === 'SKIPPED_STALE') {
      return {
        status: preflight.status,
        external_io_performed: false
      };
    }
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
          'Calendar外部I/Oの前に実行予算へ達しました。'
        )
      };
    }
    if (preflight.status !== 'AUTHORITY_COMPENSATION' &&
        (!preflight.task ||
         String(preflight.task.task_id || '') !== prepared.task_id)) {
      return {
        status: 'FAILED',
        error: appError(
          'E_CALENDAR_TASK_NOT_FOUND',
          false,
          'Calendar同期対象Taskを確認できません。'
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
        result: preflight.status === 'AUTHORITY_COMPENSATION'
          ? executeAuthorityCompensation(
            settings.gateway || new AdvancedCalendarGateway(),
            resolved._calendarId,
            preflight.record,
            instanceId,
            {
              budget: settings.budget,
              reserve_ms: settings.reserve_ms
            }
          )
          : executeCalendarAction(
            settings.gateway || new AdvancedCalendarGateway(),
            resolved._calendarId,
            preflight.task,
            preflight.record,
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
    currentRecord.target_type = TARGET_TYPE;
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
      var currentTask = readAuthorityTaskForHeldLock(
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
        var recovery;
        if (!currentTask && currentRecord && execution &&
            execution.status === 'SKIPPED_AUTHORITY_EXCLUDED') {
          /*
           * Revalidation stopped before Calendar I/O.  There is no possible
           * external side effect to compensate, so cancel directly instead
           * of scheduling a GET/DELETE pass.
           */
          cancelAuthorityExcludedJob(
            context,
            { row: row, record: currentRecord },
            nowValue
          );
          recovery = { scheduled: false, action: '' };
        } else if (!currentTask && currentRecord &&
            (isExternalIoArmedRecord(currentRecord) ||
             isAuthorityCompensationRecord(currentRecord))) {
          recovery = scheduleAuthorityExcludedCompensation(
            context,
            row,
            currentRecord,
            nowValue
          );
          if (!recovery.scheduled &&
              isAuthorityCompensationRecord(currentRecord)) {
            recovery = {
              scheduled: true,
              action: 'DELETE'
            };
          }
        } else if (prepared.authority_compensation === true &&
                   currentTask &&
                   execution &&
                   execution.status === 'SKIPPED_STALE') {
          var requeued = enqueueTaskInContext(currentTask, context, {
            now: nowValue,
            timezone: settings.timezone || WorkOsConfig.TIMEZONE,
            force_enqueue: true
          });
          recovery = {
            scheduled: requeued.status === 'PENDING' ||
              requeued.status === 'RETRY',
            action: String(requeued.desired_action || '')
          };
        } else {
          recovery = schedulePostConflictReconciliation(
            context,
            row,
            currentRecord,
            currentTask,
            execution,
            recoveryWriter,
            nowValue,
            settings.timezone || WorkOsConfig.TIMEZONE
          );
        }
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
      if (prepared.authority_compensation === true) {
        if (!execution || execution.status !== 'EXECUTED') {
          result = markJobFailure(
            context,
            selected,
            execution && execution.error ||
              appError(
                'E_CALENDAR_SYNC',
                true,
                'Calendar補償処理が完了しませんでした。'
              ),
            taskWriter,
            nowValue,
            { skip_task_patch: true }
          );
        } else {
          result = markAuthorityCompensationSuccess(
            context,
            selected,
            execution.result,
            nowValue
          );
        }
      } else if (!execution || execution.status !== 'EXECUTED') {
        result = markJobFailure(
          context,
          selected,
          execution && execution.error ||
            appError(
              'E_CALENDAR_SYNC',
              true,
              'Calendar外部処理が完了しませんでした。'
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
      'processNextJobを使用してCalendar外部I/OをLock外で実行してください。'
    );
  }

  function requestManualRetryInContext(taskId, context, nowValue) {
    assertLockedOutboxContext(context);
    var normalizedTaskId = String(taskId || '').trim();
    if (!/^tsk_[0-9a-f]{32}$/.test(normalizedTaskId)) {
      throw appError(
        'E_CALENDAR_TASK_ID',
        false,
        '手動再実行対象のTask IDが不正です。'
      );
    }
    var row = context.byTaskId[normalizedTaskId];
    var record = row ? readOutboxRow(context, row) : null;
    if (!record) {
      throw appError(
        'E_CALENDAR_OUTBOX_MISSING_TASK',
        false,
        '手動再実行対象のCalendar outboxがありません。'
      );
    }
    if (record.status === 'RETRY') {
      return { operation: 'NOOP', record: record };
    }
    if (record.status !== 'DEAD') {
      throw appError(
        'E_CALENDAR_RETRY_CONFLICT',
        false,
        'DEAD状態ではないCalendar jobは手動再実行できません。'
      );
    }
    if (DESIRED_ACTIONS.indexOf(record.desired_action) === -1 ||
        record.desired_action === 'NOOP') {
      throw appError(
        'E_CALENDAR_OUTBOX_CORRUPT',
        false,
        'Calendar jobの再開Actionが不正です。'
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
