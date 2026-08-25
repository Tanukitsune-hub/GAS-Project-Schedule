/**
 * Pure, provider-neutral email normalization through Phase 3.
 *
 * The returned body exists only in memory. Callers may persist content_hash and
 * safe counts, but must never persist the body or previous-message context.
 */
var WorkOsEmailPreprocessor = (function () {
  function normalizeText(value) {
    return String(value == null ? '' : value)
      .replace(/\r\n?/g, '\n')
      .replace(/\u0000/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();
  }

  function truncate(text, limit) {
    var normalized = normalizeText(text);
    var characters = Array.from(normalized);
    return {
      text: characters.slice(0, limit).join(''),
      original_char_count: characters.length,
      output_char_count: Math.min(characters.length, limit),
      truncated: characters.length > limit
    };
  }

  function safeTaskSummaries(tasks) {
    if (!Array.isArray(tasks)) {
      throw new WorkOsAppError(
        'E_PREPROCESS_INPUT',
        'PREPROCESS',
        false,
        'Active Task要約は配列で指定してください。'
      );
    }
    return tasks.slice(0, 20).map(function (task) {
      var value = task || {};
      var dueDate = '';
      if (value.due_date instanceof Date &&
          !Number.isNaN(value.due_date.getTime())) {
        dueDate = Utilities.formatDate(
          value.due_date,
          WorkOsConfig.TIMEZONE,
          'yyyy-MM-dd'
        );
      } else if (value.due_date) {
        dueDate = String(value.due_date).slice(0, 10);
      }
      return {
        task_id: String(value.task_id || '').slice(0, 80),
        task_title: normalizeText(value.task_title).slice(0, 300),
        status: String(value.status || '').slice(0, 40),
        due_date: dueDate,
        manual_fields: Array.isArray(value.manual_fields)
          ? value.manual_fields.slice(0, 20)
          : []
      };
    });
  }

  function preprocess(input, options) {
    var value = input || {};
    var settings = options || {};
    ['message_id', 'thread_id', 'stable_thread_key'].forEach(function (field) {
      if (!String(value[field] || '').trim()) {
        throw new WorkOsAppError(
          'E_PREPROCESS_INPUT',
          'PREPROCESS',
          false,
          '前処理に必要なMessage metadataがありません。'
        );
      }
    });
    if (!(value.received_at instanceof Date) ||
        Number.isNaN(value.received_at.getTime())) {
      throw new WorkOsAppError(
        'E_PREPROCESS_INPUT',
        'PREPROCESS',
        false,
        '受信日時が不正です。'
      );
    }
    var today = String(settings.today || '');
    if (!WorkOsUtilities.isValidIsoDate(today)) {
      throw new WorkOsAppError(
        'E_PREPROCESS_INPUT',
        'PREPROCESS',
        false,
        'todayがYYYY-MM-DD形式ではありません。'
      );
    }
    var timezone = String(settings.timezone || '').trim();
    if (!timezone) {
      throw new WorkOsAppError(
        'E_PREPROCESS_INPUT',
        'PREPROCESS',
        false,
        'timezoneがありません。'
      );
    }

    var body = truncate(value.plain_body, WorkOsConfig.EMAIL_BODY_MAX_CHARS);
    var warnings = [];
    if (body.truncated || value.body_transport_truncated === true) {
      warnings.push('BODY_TRUNCATED');
    }
    var previous = (value.previous_messages || [])
      .slice(-WorkOsConfig.EMAIL_CONTEXT_MAX_MESSAGES)
      .map(function (message) {
        var contextBody = truncate(
          message.plain_body,
          WorkOsConfig.EMAIL_CONTEXT_MAX_CHARS
        );
        if (contextBody.truncated || message.body_transport_truncated === true) {
          warnings.push('CONTEXT_TRUNCATED');
        }
        return {
          message_id: String(message.message_id || ''),
          sender: normalizeText(message.sender).slice(0, 500),
          received_at: message.received_at instanceof Date &&
            !Number.isNaN(message.received_at.getTime())
            ? message.received_at.toISOString()
            : '',
          body: contextBody.text,
          metadata: {
            original_char_count: contextBody.original_char_count,
            output_char_count: contextBody.output_char_count,
            truncated: contextBody.truncated ||
              message.body_transport_truncated === true
          }
        };
      });
    var activeTaskProvider = settings.activeTaskProvider;
    var activeTasks = typeof activeTaskProvider === 'function'
      ? activeTaskProvider(String(value.stable_thread_key))
      : (settings.active_tasks || []);

    return {
      schema_version: WorkOsConfig.AI_SCHEMA_VERSION,
      message_id: String(value.message_id),
      thread_id: String(value.thread_id),
      stable_thread_key: String(value.stable_thread_key),
      subject: normalizeText(value.subject).slice(0, 1000),
      sender: normalizeText(value.sender).slice(0, 500),
      received_at: value.received_at.toISOString(),
      source_email: normalizeText(value.source_email).slice(0, 2000),
      body: body.text,
      previous_messages: previous,
      active_tasks: safeTaskSummaries(activeTasks),
      today: today,
      timezone: timezone,
      content_hash: WorkOsUtilities.sha256Hex(body.text),
      warnings: warnings.filter(function (warning, index, items) {
        return items.indexOf(warning) === index;
      }),
      metadata: {
        original_char_count: body.original_char_count,
        output_char_count: body.output_char_count,
        source_body_bytes: Number(value.source_body_bytes || 0),
        truncated: body.truncated || value.body_transport_truncated === true,
        attachment_content_included: false,
        external_url_fetched: false
      }
    };
  }

  return Object.freeze({
    normalizeText: normalizeText,
    preprocess: preprocess
  });
}());
