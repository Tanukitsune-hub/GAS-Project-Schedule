/**
 * Error whose user-facing fields are safe to persist or display.
 *
 * @param {string} code
 * @param {string} stage
 * @param {boolean} retryable
 * @param {string} safeMessage
 * @param {Error=} cause
 * @param {Object=} diagnostic
 * @constructor
 */
function WorkOsAppError(code, stage, retryable, safeMessage, cause, diagnostic) {
  this.name = 'WorkOsAppError';
  this.code = code;
  this.stage = stage;
  this.retryable = Boolean(retryable);
  this.safeMessage = String(safeMessage || '');
  this.message = this.safeMessage;
  this.cause = cause || null;
  this.diagnostic = diagnostic && typeof diagnostic === 'object' &&
      !Array.isArray(diagnostic)
    ? diagnostic
    : null;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, WorkOsAppError);
  }
}
WorkOsAppError.prototype = Object.create(Error.prototype);
WorkOsAppError.prototype.constructor = WorkOsAppError;

var WorkOsUtilities = (function () {
  function assertTestMode(operationName) {
    if (WorkOsConfig.TEST_MODE !== true) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        'TEST_MODE_GUARD',
        false,
        'Test modeが無効のためこの操作を実行できません: ' +
          String(operationName || 'TEST_OPERATION').slice(0, 80)
      );
    }
    return true;
  }

  function now() {
    return new Date();
  }

  function makeId(prefix) {
    var raw = Utilities.getUuid().replace(/-/g, '');
    return String(prefix || '') + raw;
  }

  function sha256Hex(value) {
    var bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      String(value),
      Utilities.Charset.UTF_8
    );
    return bytes.map(function (item) {
      var normalized = item < 0 ? item + 256 : item;
      return ('0' + normalized.toString(16)).slice(-2);
    }).join('');
  }

  function makeOriginKey(sourceMessageId, sourceActionIndex) {
    if (!String(sourceMessageId || '').trim()) {
      throw new WorkOsAppError(
        'E_INVALID_ORIGIN_INPUT',
        'TASK_REPOSITORY',
        false,
        'origin_keyの生成に必要な入力がありません。'
      );
    }
    var index = Number(sourceActionIndex);
    if (!Number.isInteger(index) || index < 0) {
      throw new WorkOsAppError(
        'E_INVALID_ORIGIN_INPUT',
        'TASK_REPOSITORY',
        false,
        'source_action_indexが不正です。'
      );
    }
    return 'org_' + sha256Hex('v2|' + sourceMessageId + '|' + index).slice(0, 32);
  }

  function redactHighConfidenceSecrets(value) {
    return String(value == null ? '' : value)
      .replace(
        /-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/gi,
        '[REDACTED_PRIVATE_KEY]'
      )
      .replace(/\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g, '[REDACTED_SECRET]')
      .replace(/\bAIza[0-9A-Za-z_-]{25,}\b/g, '[REDACTED_SECRET]')
      .replace(
        /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
        '[REDACTED_SECRET]'
      )
      .replace(/\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, '[REDACTED_SECRET]')
      .replace(/\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g, '[REDACTED_SECRET]')
      .replace(/\bya29\.[A-Za-z0-9_-]{20,}\b/g, '[REDACTED_SECRET]');
  }

  function containsHighConfidenceSecret(value) {
    var text = String(value == null ? '' : value);
    return redactHighConfidenceSecrets(text) !== text;
  }

  function redact(value) {
    var text = redactHighConfidenceSecrets(value);
    return text
      .replace(/\b(https?:\/\/)[^@\s/:]+:[^@\s]+@/gi, '$1[REDACTED]@')
      .replace(/\b(Authorization|Proxy-Authorization|Cookie|Set-Cookie)\s*:\s*[^\r\n]*/gi, '$1: [REDACTED]')
      .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi, '$1 [REDACTED]')
      .replace(/([?&](?:[a-z0-9_-]*token|credential|api_key|apikey|key|client_secret)=)[^&#\s]+/gi, '$1[REDACTED]')
      .replace(
        /((?:"|')?(?:api[_-]?key|[a-z0-9_-]*token|credential|client[_-]?secret|password|secret)(?:"|')?\s*[:=]\s*)(["'])([\s\S]*?)\2/gi,
        '$1$2[REDACTED]$2'
      )
      .replace(
        /\b((?:api[_-]?key|[a-z0-9_-]*token|credential|client[_-]?secret|password|secret)\s*[:=]\s*)[^\r\n,;}]+/gi,
        '$1[REDACTED]'
      );
  }

  function isSafeIdentifier(value) {
    return /^[A-Z][A-Z0-9_]{0,79}$/.test(String(value || ''));
  }

  function safeIdentifier(value, fallback) {
    var text = String(value || '');
    if (isSafeIdentifier(text)) {
      return text;
    }
    var fallbackText = String(fallback || '');
    return isSafeIdentifier(fallbackText) ? fallbackText : 'UNKNOWN';
  }

  function safeProviderErrorCode(value) {
    var text = String(value || '');
    if (/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(text) &&
        text.length <= 64) {
      return text;
    }
    if (text === 'UNSAFE_PROVIDER_ERROR_CODE') {
      return text;
    }
    return 'UNSAFE_PROVIDER_ERROR_CODE';
  }

  function safeInteractionStatus(value) {
    var text = String(value || '');
    return [
      'completed',
      'failed',
      'in_progress',
      'cancelled',
      'incomplete',
      'requires_action'
    ].indexOf(text) >= 0 ? text : '';
  }

  function safeProviderDiagnostic(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    var safe = {};
    var status = Number(value.provider_http_status);
    if (Number.isInteger(status) && status >= 100 && status <= 599) {
      safe.provider_http_status = status;
    }
    if (value.provider_error_code != null) {
      safe.provider_error_code = safeProviderErrorCode(
        value.provider_error_code
      );
    }
    var interactionStatus = safeInteractionStatus(
      value.provider_interaction_status
    );
    if (interactionStatus) {
      safe.provider_interaction_status = interactionStatus;
    }
    return Object.keys(safe).length ? safe : null;
  }

  function safeError(error, fallbackStage) {
    if (error instanceof WorkOsAppError) {
      var safe = {
        code: safeIdentifier(error.code, 'E_UNEXPECTED'),
        stage: safeIdentifier(error.stage, fallbackStage || 'UNKNOWN'),
        retryable: error.retryable,
        safe_message: redact(error.safeMessage)
      };
      var diagnostic = safeProviderDiagnostic(error.diagnostic);
      if (diagnostic) {
        safe.diagnostic = diagnostic;
      }
      return safe;
    }
    return {
      code: 'E_UNEXPECTED',
      stage: safeIdentifier(fallbackStage, 'UNKNOWN'),
      retryable: false,
      safe_message: '予期しないエラーが発生しました。詳細な入力内容は記録していません。'
    };
  }

  function createSoftBudget(limitMs, startedAtMs) {
    var started = startedAtMs == null ? Date.now() : Number(startedAtMs);
    var limit = Number(limitMs);
    return Object.freeze({
      elapsedMs: function () { return Date.now() - started; },
      remainingMs: function () { return Math.max(0, limit - (Date.now() - started)); },
      isExhausted: function (reserveMs) {
        return Date.now() - started >= limit - Number(reserveMs || 0);
      }
    });
  }

  function withScriptLock(callback, waitMs) {
    if (typeof LockService === 'undefined' || !LockService.getScriptLock) {
      throw new WorkOsAppError(
        'E_LOCK_UNAVAILABLE',
        'LOCK',
        false,
        'Script Lockを利用できません。'
      );
    }
    var lock = LockService.getScriptLock();
    var acquired = lock.tryLock(Number(waitMs || WorkOsConfig.LOCK_WAIT_MS));
    if (!acquired) {
      throw new WorkOsAppError(
        'E_LOCK_TIMEOUT',
        'LOCK',
        true,
        '別の処理が実行中です。時間を置いて再実行してください。'
      );
    }
    try {
      return callback(lock);
    } finally {
      lock.releaseLock();
    }
  }

  function isBlank(value) {
    return value == null || String(value).trim() === '';
  }

  function matrixHasContent(matrix, predicate) {
    var rows = matrix || [];
    for (var rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      for (var columnIndex = 0; columnIndex < rows[rowIndex].length; columnIndex += 1) {
        if (predicate(rows[rowIndex][columnIndex])) {
          return true;
        }
      }
    }
    return false;
  }

  function inspectRangeContent(range, preloadedValues) {
    var values = preloadedValues || range.getValues();
    var result = {
      has_value: matrixHasContent(values, function (item) { return !isBlank(item); }),
      has_formula: false,
      has_note: false,
      has_validation: false
    };
    if (result.has_value) {
      return result;
    }
    if (typeof range.getFormulas === 'function') {
      result.has_formula = matrixHasContent(
        range.getFormulas(),
        function (item) { return !isBlank(item); }
      );
      if (result.has_formula) {
        return result;
      }
    }
    if (typeof range.getNotes === 'function') {
      result.has_note = matrixHasContent(
        range.getNotes(),
        function (item) { return !isBlank(item); }
      );
      if (result.has_note) {
        return result;
      }
    }
    if (typeof range.getDataValidations === 'function') {
      result.has_validation = matrixHasContent(
        range.getDataValidations(),
        function (item) { return item != null; }
      );
    }
    return result;
  }

  function isValidIsoDate(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) {
      return false;
    }
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;
  }

  /*
   * Canonical JSON is used for persisted integrity hashes.  It intentionally
   * preserves array order, sorts object keys recursively, normalizes Date to
   * ISO-8601, normalizes undefined/non-finite numbers to JSON null, and keeps
   * primitive Boolean/Number/String values unchanged.  This is drift
   * detection, not a keyed tamper-proof signature.
   */
  function canonicalJsonValue(value) {
    if (value === undefined || value == null) {
      return null;
    }
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        throw new Error('E_INVALID_JSON_DATE');
      }
      return value.toISOString();
    }
    if (Array.isArray(value)) {
      return value.map(canonicalJsonValue);
    }
    if (typeof value === 'number') {
      return isFinite(value) ? value : null;
    }
    if (typeof value === 'object') {
      var output = {};
      Object.keys(value).sort().forEach(function (key) {
        output[key] = canonicalJsonValue(value[key]);
      });
      return output;
    }
    return value;
  }

  function normalizedJsonValue(value, expectedKind) {
    if (value == null || value === '') {
      return expectedKind === 'array' ? [] : {};
    }
    if (typeof value === 'string') {
      var parsed = JSON.parse(value);
      if (expectedKind === 'array' && !Array.isArray(parsed)) {
        throw new Error('E_INVALID_JSON_ARRAY');
      }
      if (expectedKind === 'object' && (Array.isArray(parsed) || parsed === null || typeof parsed !== 'object')) {
        throw new Error('E_INVALID_JSON_OBJECT');
      }
      return parsed;
    }
    if (expectedKind === 'array' && !Array.isArray(value)) {
      throw new Error('E_INVALID_JSON_ARRAY');
    }
    if (expectedKind === 'object' && (Array.isArray(value) || typeof value !== 'object')) {
      throw new Error('E_INVALID_JSON_OBJECT');
    }
    return value;
  }

  /*
   * Preserve the established cell serialization contract for ordinary JSON
   * fields.  Some independently checkpointed payloads hash their original
   * property order, so global key sorting here would invalidate a durable
   * checkpoint after an otherwise harmless read/write round trip.
   */
  function serializeJson(value, expectedKind) {
    return JSON.stringify(normalizedJsonValue(value, expectedKind));
  }

  /*
   * Integrity-sensitive callers opt into this deterministic representation.
   * Task Authority Ledger hashes use it; ordinary business projections do not.
   */
  function canonicalJsonString(value, expectedKind) {
    return JSON.stringify(canonicalJsonValue(
      normalizedJsonValue(value, expectedKind)
    ));
  }

  function parseJson(value, expectedKind) {
    var parsed = JSON.parse(String(value));
    if (expectedKind === 'array' && !Array.isArray(parsed)) {
      throw new Error('E_INVALID_JSON_ARRAY');
    }
    if (expectedKind === 'object' && (Array.isArray(parsed) || parsed === null || typeof parsed !== 'object')) {
      throw new Error('E_INVALID_JSON_OBJECT');
    }
    return parsed;
  }

  return Object.freeze({
    assertTestMode: assertTestMode,
    now: now,
    makeId: makeId,
    sha256Hex: sha256Hex,
    makeOriginKey: makeOriginKey,
    redactHighConfidenceSecrets: redactHighConfidenceSecrets,
    containsHighConfidenceSecret: containsHighConfidenceSecret,
    redact: redact,
    isSafeIdentifier: isSafeIdentifier,
    safeIdentifier: safeIdentifier,
    safeError: safeError,
    safeProviderDiagnostic: safeProviderDiagnostic,
    safeProviderErrorCode: safeProviderErrorCode,
    safeInteractionStatus: safeInteractionStatus,
    createSoftBudget: createSoftBudget,
    withScriptLock: withScriptLock,
    isBlank: isBlank,
    inspectRangeContent: inspectRangeContent,
    isValidIsoDate: isValidIsoDate,
    canonicalJsonValue: canonicalJsonValue,
    canonicalJsonString: canonicalJsonString,
    serializeJson: serializeJson,
    parseJson: parseJson
  });
}());
