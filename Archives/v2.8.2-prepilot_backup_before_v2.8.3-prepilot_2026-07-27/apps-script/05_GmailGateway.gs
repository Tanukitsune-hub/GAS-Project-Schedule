/**
 * Bounded Gmail gateway shared by the Phase 3 manual flow and the Phase 6
 * scheduled small-batch flow.
 *
 * Automatic discovery is limited by query window, pagination, thread count,
 * Message count, and soft budget. It never changes human-owned 手動/* labels
 * or fetches attachment bodies or URLs.
 */
var WorkOsGmailGateway = (function () {
  function assertService() {
    if (typeof Gmail === 'undefined' ||
        !Gmail.Users ||
        !Gmail.Users.Labels ||
        !Gmail.Users.Threads ||
        !Gmail.Users.Messages) {
      throw new WorkOsAppError(
        'E_GMAIL_SERVICE_UNAVAILABLE',
        'GMAIL',
        false,
        'Advanced Gmail serviceを利用できません。'
      );
    }
  }

  function createCallMeter(limitValue) {
    var limit = Number(limitValue);
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
      throw new WorkOsAppError(
        'E_GMAIL_CALL_BUDGET',
        'GMAIL',
        false,
        'Gmail API call上限が不正です。'
      );
    }
    var count = 0;
    return Object.freeze({
      consume: function (stage) {
        if (count >= limit) {
          throw new WorkOsAppError(
            'E_GMAIL_CALL_BUDGET',
            WorkOsUtilities.safeIdentifier(stage, 'GMAIL'),
            true,
            'Gmail API call上限に達したため安全に停止しました。'
          );
        }
        count += 1;
        return count;
      },
      count: function () { return count; },
      limit: function () { return limit; },
      exhausted: function () { return count >= limit; }
    });
  }

  function consumeCall(callMeter, stage) {
    if (callMeter && typeof callMeter.consume === 'function') {
      callMeter.consume(stage);
    }
  }

  function rethrowCallBudget(error) {
    if (error && [
      'E_GMAIL_CALL_BUDGET',
      'E_BUDGET_EXHAUSTED'
    ].indexOf(error.code) !== -1) {
      throw error;
    }
  }

  function assertTimeBudget(options, stage) {
    var settings = options || {};
    var budget = settings.budget;
    if (budget && typeof budget.isExhausted === 'function' &&
        budget.isExhausted(Number(settings.reserve_ms || 0))) {
      throw new WorkOsAppError(
        'E_BUDGET_EXHAUSTED',
        WorkOsUtilities.safeIdentifier(stage, 'GMAIL'),
        true,
        'soft execution budgetに達したためGmail API call前に停止しました。'
      );
    }
  }

  function listLabels(callMeter) {
    assertService();
    var response;
    try {
      consumeCall(callMeter, 'GMAIL_LABELS');
      response = Gmail.Users.Labels.list('me');
    } catch (error) {
      rethrowCallBudget(error);
      throw new WorkOsAppError(
        'E_GMAIL_FETCH',
        'GMAIL_LABELS',
        true,
        'Gmailラベルを取得できませんでした。'
      );
    }
    return (response && response.labels) || [];
  }

  function formalLabelIndex(labels) {
    var index = {};
    var formal = {};
    WorkOsConfig.GMAIL_LABELS.forEach(function (name) { formal[name] = true; });
    (labels || []).forEach(function (label) {
      if (formal[label.name]) {
        index[label.name] = String(label.id || '');
      }
    });
    return index;
  }

  function loadLabelCache(callMeter) {
    var labels = listLabels(callMeter);
    var namesById = {};
    labels.forEach(function (label) {
      namesById[String(label.id || '')] = String(label.name || '');
    });
    return {
      formal_by_name: formalLabelIndex(labels),
      names_by_id: namesById
    };
  }

  function inspectFormalLabels(options) {
    var settings = options || {};
    assertTimeBudget(
      settings,
      'GMAIL_LABEL_INSPECT'
    );
    var index = formalLabelIndex(listLabels(settings.call_meter));
    var present = WorkOsConfig.GMAIL_LABELS.filter(function (name) {
      return Boolean(index[name]);
    });
    var missing = WorkOsConfig.GMAIL_LABELS.filter(function (name) {
      return !index[name];
    });
    return {
      expected_count: WorkOsConfig.GMAIL_LABELS.length,
      present_count: present.length,
      present_names: present,
      missing_names: missing,
      complete: missing.length === 0
    };
  }

  function ensureFormalLabels(options) {
    var settings = options || {};
    var callMeter = settings.call_meter || createCallMeter(
      WorkOsConfig.MANUAL_GMAIL_API_CALL_LIMIT
    );
    assertTimeBudget(settings, 'GMAIL_LABEL_LIST');
    var existing = formalLabelIndex(listLabels(callMeter));
    var created = [];
    WorkOsConfig.GMAIL_LABELS.forEach(function (name) {
      if (existing[name]) {
        return;
      }
      try {
        assertTimeBudget(settings, 'GMAIL_LABEL_CREATE');
        callMeter.consume('GMAIL_LABEL_CREATE');
        var label = Gmail.Users.Labels.create(
          {
            name: name,
            labelListVisibility: 'labelShow',
            messageListVisibility: 'show'
          },
          'me'
        );
        existing[name] = String(label && label.id || '');
        created.push(name);
      } catch (error) {
        rethrowCallBudget(error);
        throw new WorkOsAppError(
          'E_GMAIL_LABEL_CREATE',
          'S50_CREATE_GMAIL_LABELS',
          true,
          '正式Gmailラベルを作成できませんでした。'
        );
      }
    });
    var verification = inspectFormalLabels({
      budget: settings.budget,
      reserve_ms: settings.reserve_ms,
      call_meter: callMeter
    });
    if (!verification.complete) {
      throw new WorkOsAppError(
        'E_GMAIL_LABEL_CREATE',
        'S50_CREATE_GMAIL_LABELS',
        true,
        '正式Gmailラベルの作成完了を確認できませんでした。'
      );
    }
    return {
      expected_count: WorkOsConfig.GMAIL_LABELS.length,
      created_count: created.length,
      existing_count: WorkOsConfig.GMAIL_LABELS.length - created.length,
      created_names: created,
      removed_count: 0,
      renamed_count: 0
    };
  }

  function makeStableThreadKey(firstMessageId, threadId) {
    var rootId = String(firstMessageId || '').trim();
    if (rootId) {
      return 'root:' + rootId;
    }
    var fallback = String(threadId || '').trim();
    if (!fallback) {
      throw new WorkOsAppError(
        'E_MESSAGE_METADATA',
        'GMAIL',
        false,
        'Stable Thread Keyを生成できません。'
      );
    }
    return 'thread:' + fallback;
  }

  function makeSourceEmailUrl(threadId) {
    var normalized = String(threadId || '').trim();
    if (!normalized) {
      throw new WorkOsAppError(
        'E_MESSAGE_METADATA',
        'GMAIL_MESSAGE_REFERENCE',
        false,
        '元メール参照に必要なThread IDがありません。'
      );
    }
    /*
     * Only the runtime Thread ID is interpolated. No token, body, account
     * address or private Workspace hostname is persisted in source code.
     */
    return 'https://mail.google.com/mail/u/0/#all/' +
      encodeURIComponent(normalized);
  }

  function headerValue(message, name) {
    var headers = message && message.payload && message.payload.headers || [];
    var expected = String(name || '').toLowerCase();
    for (var index = 0; index < headers.length; index += 1) {
      if (String(headers[index].name || '').toLowerCase() === expected) {
        return String(headers[index].value || '');
      }
    }
    return '';
  }

  function messageTimestamp(message) {
    var timestamp = Number(message && message.internalDate);
    if (!Number.isFinite(timestamp) || timestamp < 0) {
      throw new WorkOsAppError(
        'E_MESSAGE_METADATA',
        'GMAIL',
        false,
        'Gmail Messageの受信日時が不正です。'
      );
    }
    return timestamp;
  }

  function sortMessages(messages) {
    return (messages || []).slice().sort(function (left, right) {
      var timeDifference = messageTimestamp(left) - messageTimestamp(right);
      if (timeDifference !== 0) {
        return timeDifference;
      }
      return String(left.id || '').localeCompare(String(right.id || ''));
    });
  }

  function decideManualLabelAction(labelNames) {
    var names = labelNames || [];
    if (names.indexOf('手動/除外') !== -1) {
      return 'SKIP';
    }
    if (names.indexOf('手動/取込') !== -1) {
      return 'PROCESS';
    }
    return 'IGNORE';
  }

  function labelsForMessages(messages, labelById) {
    var present = {};
    (messages || []).forEach(function (message) {
      (message.labelIds || []).forEach(function (labelId) {
        if (labelById[labelId]) {
          present[labelById[labelId]] = true;
        }
      });
    });
    return Object.keys(present).sort();
  }

  function loadThreadMetadata(threadId, callMeter) {
    try {
      consumeCall(callMeter, 'GMAIL_THREAD_METADATA');
      return Gmail.Users.Threads.get('me', String(threadId), {
        format: 'metadata',
        metadataHeaders: [
          'Subject',
          'From',
          'List-Unsubscribe',
          'Auto-Submitted'
        ]
      });
    } catch (error) {
      rethrowCallBudget(error);
      throw new WorkOsAppError(
        'E_GMAIL_FETCH',
        'GMAIL_THREAD_METADATA',
        true,
        'Gmail Thread metadataを取得できませんでした。'
      );
    }
  }

  function listManualCandidates(options) {
    assertService();
    var settings = options || {};
    var callMeter = settings.call_meter || createCallMeter(
      WorkOsConfig.MANUAL_GMAIL_API_CALL_LIMIT
    );
    var budget = settings.budget || null;
    var reserveMs = Number(
      settings.reserve_ms || WorkOsConfig.MANUAL_WORKER_RESERVE_MS
    );
    function exhausted() {
      return budget &&
        typeof budget.isExhausted === 'function' &&
        budget.isExhausted(reserveMs);
    }
    var maxThreads = WorkOsConfig.MANUAL_MAX_THREADS;
    var searchResult;
    try {
      consumeCall(callMeter, 'GMAIL_SEARCH');
      searchResult = Gmail.Users.Threads.list('me', {
        q: WorkOsConfig.MANUAL_GMAIL_QUERY,
        maxResults: maxThreads,
        includeSpamTrash: false
      });
    } catch (error) {
      rethrowCallBudget(error);
      throw new WorkOsAppError(
        'E_GMAIL_FETCH',
        'GMAIL_SEARCH',
        true,
        '手動取込候補を取得できませんでした。'
      );
    }

    var labelCache = settings.label_cache || loadLabelCache(callMeter);
    var formalLabels = labelCache.formal_by_name || {};
    if (WorkOsConfig.GMAIL_LABELS.some(function (name) {
      return !formalLabels[name];
    })) {
      throw new WorkOsAppError(
        'E_GMAIL_LABEL_MISSING',
        'GMAIL_SEARCH',
        false,
        '正式Gmailラベルが不足しています。Setup S50を実行してください。'
      );
    }
    var labelById = labelCache.names_by_id || {};
    var candidates = [];
    var summaries = ((searchResult && searchResult.threads) || [])
      .slice(0, maxThreads);
    for (var summaryIndex = 0;
      summaryIndex < summaries.length;
      summaryIndex += 1) {
      if (exhausted()) {
        throw new WorkOsAppError(
          'E_BUDGET_EXHAUSTED',
          'GMAIL_THREAD_METADATA',
          true,
          'soft execution budgetに達したため候補展開を停止しました。'
        );
      }
      var summary = summaries[summaryIndex];
      var thread = loadThreadMetadata(summary.id, callMeter);
      var messages = thread && thread.messages || [];
      if (!messages.length) {
        continue;
      }
      // Do not depend on an undocumented array order. Sort once by the
      // provider timestamp and Message ID.
      var orderedMessages = sortMessages(messages);
      var first = orderedMessages[0];
      var selectedIndex = -1;
      orderedMessages.forEach(function (message, messageIndex) {
        var exactLabels = labelsForMessages([message], labelById);
        if (exactLabels.indexOf('手動/取込') !== -1) {
          selectedIndex = messageIndex;
        }
      });
      if (selectedIndex === -1) {
        // A Thread search result is not evidence that an arbitrary Message
        // may be imported. Without an exact Message label, fail closed.
        continue;
      }
      var selected = orderedMessages[selectedIndex];
      var systemLabels = {};
      (selected.labelIds || []).forEach(function (labelId) {
        systemLabels[String(labelId)] = true;
      });
      // includeSpamTrash:false is the API boundary; this second check makes
      // the exclusion explicit even if a test double returns such a thread.
      if (systemLabels.SPAM || systemLabels.TRASH) {
        continue;
      }
      // Gmail search returns Thread summaries. Treat an explicit manual
      // exclusion anywhere in the returned Thread as the strongest decision,
      // so a differently-labelled older Message cannot be bypassed by taking
      // labels only from the latest Message.
      var labelNames = labelsForMessages(messages, labelById);
      var decision = decideManualLabelAction(labelNames);
      if (decision === 'IGNORE') {
        continue;
      }
      var recent = orderedMessages.slice(
        Math.max(
          0,
          selectedIndex - WorkOsConfig.EMAIL_CONTEXT_MAX_MESSAGES
        ),
        selectedIndex + 1
      );
      candidates.push({
        message_id: String(selected.id || ''),
        thread_id: String(
          thread.id || summary.id || selected.threadId || ''
        ),
        stable_thread_key: makeStableThreadKey(first.id, thread.id || summary.id),
        received_at: new Date(messageTimestamp(selected)),
        source_mode: 'MANUAL',
        manual_decision: decision,
        selection_reason: decision === 'SKIP'
          ? 'MANUAL_EXCLUDE'
          : 'EXACT_MANUAL_IMPORT',
        message_refs: recent.map(function (message) {
          return {
            id: String(message.id || ''),
            internal_date: messageTimestamp(message)
          };
        })
      });
    }

    candidates.sort(function (left, right) {
      var timeDifference = right.received_at.getTime() - left.received_at.getTime();
      if (timeDifference !== 0) {
        return timeDifference;
      }
      return left.thread_id.localeCompare(right.thread_id);
    });
    return candidates.slice(0, maxThreads);
  }

  function automaticQuery(watermarkAt, upperBoundAt) {
    var now = upperBoundAt instanceof Date
      ? upperBoundAt
      : WorkOsUtilities.now();
    var upperBound = upperBoundAt instanceof Date &&
      !isNaN(upperBoundAt.getTime())
      ? upperBoundAt
      : now;
    var watermark = watermarkAt instanceof Date &&
      !isNaN(watermarkAt.getTime())
      ? watermarkAt
      : now;
    var overlapStartMs = Math.max(
      0,
      watermark.getTime() - WorkOsConfig.AUTOMATION_OVERLAP_MS
    );
    return {
      query: WorkOsConfig.AUTOMATION_GMAIL_QUERY +
        ' after:' + Math.floor(overlapStartMs / 1000) +
        ' before:' + (Math.floor(upperBound.getTime() / 1000) + 1),
      overlap_start: new Date(overlapStartMs),
      upper_bound: upperBound
    };
  }

  function payloadHasCalendarPart(payload) {
    var current = payload || {};
    if (String(current.mimeType || '').toLowerCase() === 'text/calendar') {
      return true;
    }
    return (current.parts || []).some(function (part) {
      return payloadHasCalendarPart(part);
    });
  }

  function clearNewsletterMetadata(message) {
    return Boolean(headerValue(message, 'List-Unsubscribe').trim());
  }

  function googleCalendarNotificationMetadata(message) {
    var sender = headerValue(message, 'From').toLowerCase();
    var exactGoogleCalendarSender =
      /(?:^|<)calendar-notification@google\.com(?:>|$)/.test(sender);
    if (!exactGoogleCalendarSender) {
      return false;
    }
    return payloadHasCalendarPart(message && message.payload) ||
      headerValue(message, 'Auto-Submitted').toLowerCase() ===
        'auto-generated';
  }

  function automaticCandidatePolicy(labelNames, message) {
    var names = labelNames || [];
    var system = {};
    (message && message.labelIds || []).forEach(function (labelId) {
      system[String(labelId)] = true;
    });
    if (names.indexOf('手動/除外') !== -1) {
      return { process: false, reason: 'MANUAL_EXCLUDE', priority: 0 };
    }
    if (system.SPAM || system.TRASH || !system.INBOX) {
      return { process: false, reason: 'SYSTEM_SCOPE', priority: 0 };
    }
    if (names.indexOf('手動/取込') !== -1) {
      return { process: true, reason: 'MANUAL_IMPORT', priority: 1 };
    }
    if (system.CATEGORY_PROMOTIONS) {
      return { process: false, reason: 'CATEGORY_PROMOTIONS', priority: 0 };
    }
    if (system.CATEGORY_SOCIAL) {
      return { process: false, reason: 'CATEGORY_SOCIAL', priority: 0 };
    }
    if (WorkOsConfig.AUTOMATION_NEWSLETTER_FILTER_APPROVED === true &&
        clearNewsletterMetadata(message)) {
      return { process: false, reason: 'CLEAR_NEWSLETTER', priority: 0 };
    }
    if (WorkOsConfig
      .AUTOMATION_CALENDAR_NOTIFICATION_FILTER_APPROVED === true &&
        googleCalendarNotificationMetadata(message)) {
      return {
        process: false,
        reason: 'GOOGLE_CALENDAR_NOTIFICATION',
        priority: 0
      };
    }
    return { process: true, reason: 'NORMAL_INBOX', priority: 0 };
  }

  function listAutomaticCandidates(options) {
    assertService();
    var settings = options || {};
    var callMeter = settings.call_meter || createCallMeter(
      WorkOsConfig.AUTOMATION_GMAIL_API_CALL_LIMIT
    );
    var budget = settings.budget || null;
    var reserveMs = Number(
      settings.reserve_ms || WorkOsConfig.AUTOMATION_WORKER_RESERVE_MS
    );
    var maxThreads = Math.min(
      WorkOsConfig.AUTOMATION_MAX_SEARCH_THREADS,
      Math.max(1, Number(settings.max_threads ||
        WorkOsConfig.AUTOMATION_MAX_SEARCH_THREADS))
    );
    var pageSize = Math.min(
      WorkOsConfig.AUTOMATION_SEARCH_PAGE_SIZE,
      Math.max(1, Number(settings.page_size ||
        WorkOsConfig.AUTOMATION_SEARCH_PAGE_SIZE))
    );
    var maxMessages = Math.min(
      WorkOsConfig.AUTOMATION_MAX_MESSAGES_PER_RUN,
      Math.max(1, Number(settings.max_messages ||
        WorkOsConfig.AUTOMATION_MAX_MESSAGES_PER_RUN))
    );
    var queryState = automaticQuery(
      settings.watermark_at,
      settings.upper_bound_at || settings.now
    );
    var knownIds = settings.known_message_ids || {};
    function exhausted() {
      return budget &&
        typeof budget.isExhausted === 'function' &&
        budget.isExhausted(reserveMs);
    }

    var summaries = [];
    var startPageToken = String(settings.page_token || '');
    var pageToken = startPageToken;
    var pageCalls = 0;
    var maxPageCalls = Math.ceil(maxThreads / pageSize);
    var seenPageTokens = {};
    do {
      if (exhausted()) {
        throw new WorkOsAppError(
          'E_BUDGET_EXHAUSTED',
          'GMAIL_AUTOMATIC_SEARCH',
          true,
          'soft execution budgetに達したため自動候補検索を停止しました。'
        );
      }
      var pageIdentity = pageToken || '__FIRST_PAGE__';
      if (seenPageTokens[pageIdentity]) {
        throw new WorkOsAppError(
          'E_GMAIL_PAGINATION_LOOP',
          'GMAIL_AUTOMATIC_SEARCH',
          true,
          'Gmail候補検索のpage tokenが循環しました。'
        );
      }
      seenPageTokens[pageIdentity] = true;
      var pageLimit = Math.min(pageSize, maxThreads - summaries.length);
      var request = {
        q: queryState.query,
        maxResults: pageLimit,
        includeSpamTrash: false
      };
      if (pageToken) {
        request.pageToken = pageToken;
      }
      var response;
      try {
        consumeCall(callMeter, 'GMAIL_AUTOMATIC_SEARCH');
        response = Gmail.Users.Threads.list('me', request);
      } catch (error) {
        rethrowCallBudget(error);
        throw new WorkOsAppError(
          'E_GMAIL_FETCH',
          'GMAIL_AUTOMATIC_SEARCH',
          true,
          'Gmail自動取込候補を取得できませんでした。'
        );
      }
      summaries = summaries.concat(
        ((response && response.threads) || []).slice(0, pageLimit)
      );
      pageToken = String(response && response.nextPageToken || '');
      pageCalls += 1;
    } while (pageToken &&
      summaries.length < maxThreads &&
      pageCalls < maxPageCalls);

    var searchSaturated = Boolean(pageToken);
    var labelCache = settings.label_cache || loadLabelCache(callMeter);
    var formalLabels = labelCache.formal_by_name || {};
    if (WorkOsConfig.GMAIL_LABELS.some(function (name) {
      return !formalLabels[name];
    })) {
      throw new WorkOsAppError(
        'E_GMAIL_LABEL_MISSING',
        'GMAIL_AUTOMATIC_SEARCH',
        false,
        '正式Gmailラベルが不足しています。Setup S50を実行してください。'
      );
    }
    var labelById = labelCache.names_by_id || {};

    var candidatesByMessageId = {};
    var metadataComplete = true;
    var expandedThreads = 0;
    var filterCounts = {};
    for (var summaryIndex = 0;
      summaryIndex < summaries.length;
      summaryIndex += 1) {
      if (exhausted()) {
        metadataComplete = false;
        break;
      }
      if (callMeter.exhausted()) {
        metadataComplete = false;
        break;
      }
      var summary = summaries[summaryIndex];
      var thread = loadThreadMetadata(summary.id, callMeter);
      expandedThreads += 1;
      var ordered = sortMessages(thread && thread.messages || []);
      if (!ordered.length) {
        continue;
      }
      var threadLabelNames = labelsForMessages(ordered, labelById);
      if (threadLabelNames.indexOf('手動/除外') !== -1) {
        filterCounts.MANUAL_EXCLUDE =
          Number(filterCounts.MANUAL_EXCLUDE || 0) + 1;
        continue;
      }
      var first = ordered[0];
      ordered.forEach(function (message, messageIndex) {
        var messageId = String(message.id || '');
        var timestamp = messageTimestamp(message);
        /*
         * 手動/除外 is intentionally Thread-wide, but 手動/取込 applies only
         * to the exact Message carrying that label. Reusing a Thread label
         * union here would cause an older opted-in Message to broaden the
         * scope of a newer promotions/social Message.
         */
        var messageLabelNames = labelsForMessages(
          [message],
          labelById
        );
        var policy = automaticCandidatePolicy(
          messageLabelNames,
          message
        );
        if (!messageId || candidatesByMessageId[messageId] ||
            knownIds[messageId] ||
            timestamp < queryState.overlap_start.getTime() ||
            timestamp >= queryState.upper_bound.getTime()) {
          return;
        }
        if (!policy.process) {
          filterCounts[policy.reason] =
            Number(filterCounts[policy.reason] || 0) + 1;
          return;
        }
        var recent = ordered.slice(
          Math.max(0, messageIndex - WorkOsConfig.EMAIL_CONTEXT_MAX_MESSAGES),
          messageIndex + 1
        );
        candidatesByMessageId[messageId] = {
          message_id: messageId,
          thread_id: String(
            thread.id || summary.id || message.threadId || ''
          ),
          stable_thread_key: makeStableThreadKey(
            first.id,
            thread.id || summary.id
          ),
          received_at: new Date(timestamp),
          source_mode: 'AUTOMATIC',
          manual_decision: 'PROCESS',
          selection_reason: policy.reason,
          selection_priority: policy.priority,
          message_refs: recent.map(function (reference) {
            return {
              id: String(reference.id || ''),
              internal_date: messageTimestamp(reference)
            };
          })
        };
      });
    }

    var candidates = Object.keys(candidatesByMessageId).map(function (id) {
      return candidatesByMessageId[id];
    });
    candidates.sort(function (left, right) {
      var priorityDifference =
        Number(right.selection_priority || 0) -
        Number(left.selection_priority || 0);
      if (priorityDifference) {
        return priorityDifference;
      }
      var timeDifference =
        left.received_at.getTime() - right.received_at.getTime();
      return timeDifference ||
        left.message_id.localeCompare(right.message_id);
    });
    var candidateOverflow = candidates.length > maxMessages;
    var replayCurrentPage = candidateOverflow || !metadataComplete;
    return {
      candidates: candidates.slice(0, maxMessages),
      searched_threads: summaries.length,
      expanded_threads: expandedThreads,
      page_call_count: pageCalls,
      api_call_count: callMeter.count(),
      api_call_limit: callMeter.limit(),
      call_budget_exhausted: callMeter.exhausted(),
      filter_counts: filterCounts,
      search_saturated: searchSaturated,
      candidate_overflow: candidateOverflow,
      metadata_complete: metadataComplete,
      overlap_start: queryState.overlap_start,
      upper_bound: queryState.upper_bound,
      query: queryState.query,
      read_state_used: false,
      next_page_pending: searchSaturated ||
        candidateOverflow ||
        !metadataComplete,
      resume_page_token: replayCurrentPage
        ? startPageToken
        : pageToken,
      search_complete:
        metadataComplete && !pageToken && !candidateOverflow
    };
  }

  function decodeBodyData(data, byteLimit) {
    var source = String(data || '');
    if (!source) {
      return { text: '', transport_truncated: false };
    }
    var encodedLimit = Math.max(4, Math.floor(Number(byteLimit) * 4 / 3));
    encodedLimit -= encodedLimit % 4;
    var truncated = source.length > encodedLimit;
    var selected = truncated ? source.slice(0, encodedLimit) : source;
    try {
      return {
        text: Utilities.newBlob(
          Utilities.base64DecodeWebSafe(selected)
        ).getDataAsString('UTF-8'),
        transport_truncated: truncated
      };
    } catch (error) {
      rethrowCallBudget(error);
      throw new WorkOsAppError(
        'E_GMAIL_BODY_DECODE',
        'GMAIL_MESSAGE_BODY',
        false,
        'Gmail本文を安全にdecodeできませんでした。'
      );
    }
  }

  function collectPlainParts(payload, byteLimit, state) {
    var current = payload || {};
    var filename = String(current.filename || '').trim();
    var body = current.body || {};
    var mimeType = String(current.mimeType || '').toLowerCase();
    state.source_bytes += Number(body.size || 0);
    if (filename || body.attachmentId) {
      return;
    }
    if (mimeType === 'text/plain' && body.data && state.text.length < byteLimit) {
      var decoded = decodeBodyData(
        body.data,
        Math.max(1, byteLimit - state.text.length)
      );
      state.text += (state.text ? '\n' : '') + decoded.text;
      state.transport_truncated =
        state.transport_truncated || decoded.transport_truncated;
    }
    (current.parts || []).forEach(function (part) {
      if (state.text.length < byteLimit) {
        collectPlainParts(part, byteLimit, state);
      } else {
        state.transport_truncated = true;
      }
    });
  }

  function loadMessageContent(messageId, byteLimit, options) {
    var callMeter = options && options.call_meter;
    var message;
    try {
      assertTimeBudget(options, 'GMAIL_MESSAGE_BODY');
      consumeCall(callMeter, 'GMAIL_MESSAGE_BODY');
      message = Gmail.Users.Messages.get('me', String(messageId), {
        format: 'full'
      });
    } catch (error) {
      rethrowCallBudget(error);
      throw new WorkOsAppError(
        'E_GMAIL_FETCH',
        'GMAIL_MESSAGE_BODY',
        true,
        'Gmail Message本文を取得できませんでした。'
      );
    }
    var state = {
      text: '',
      source_bytes: 0,
      transport_truncated: false
    };
    collectPlainParts(message.payload, byteLimit, state);
    return {
      message_id: String(message.id || messageId),
      subject: headerValue(message, 'Subject'),
      sender: headerValue(message, 'From'),
      received_at: new Date(messageTimestamp(message)),
      plain_body: state.text,
      source_body_bytes: state.source_bytes,
      body_transport_truncated: state.transport_truncated
    };
  }

  function fetchSelectedContent(candidate, options) {
    var refs = (candidate && candidate.message_refs || []).slice()
      .sort(function (left, right) {
        var difference = left.internal_date - right.internal_date;
        return difference !== 0
          ? difference
          : left.id.localeCompare(right.id);
      });
    if (!refs.length ||
        refs[refs.length - 1].id !== String(candidate.message_id || '')) {
      throw new WorkOsAppError(
        'E_MESSAGE_METADATA',
        'GMAIL_MESSAGE_BODY',
        false,
        '選択されたMessage metadataが不正です。'
      );
    }
    var target = loadMessageContent(
      candidate.message_id,
      WorkOsConfig.EMAIL_BODY_MAX_CHARS * 4,
      options
    );
    var previousRefs = refs.slice(
      Math.max(0, refs.length - 1 - WorkOsConfig.EMAIL_CONTEXT_MAX_MESSAGES),
      refs.length - 1
    );
    var previous = previousRefs.map(function (reference) {
      return loadMessageContent(
        reference.id,
        WorkOsConfig.EMAIL_CONTEXT_MAX_CHARS * 4,
        options
      );
    });
    return {
      message_id: candidate.message_id,
      thread_id: candidate.thread_id,
      stable_thread_key: candidate.stable_thread_key,
      subject: target.subject,
      sender: target.sender,
      received_at: target.received_at,
      plain_body: target.plain_body,
      source_body_bytes: target.source_body_bytes,
      body_transport_truncated: target.body_transport_truncated,
      source_email: makeSourceEmailUrl(candidate.thread_id),
      previous_messages: previous
    };
  }

  function refetchMessageContent(stateRecord, options) {
    var callMeter = options && options.call_meter;
    var record = stateRecord || {};
    assertTimeBudget(options, 'GMAIL_MESSAGE_REFETCH');
    var thread = loadThreadMetadata(record.thread_id, callMeter);
    var ordered = sortMessages(thread && thread.messages || []);
    var targetIndex = -1;
    for (var index = 0; index < ordered.length; index += 1) {
      if (String(ordered[index].id || '') === String(record.message_id || '')) {
        targetIndex = index;
        break;
      }
    }
    if (targetIndex === -1) {
      throw new WorkOsAppError(
        'E_GMAIL_FETCH',
        'GMAIL_MESSAGE_REFETCH',
        false,
        'checkpoint対象のGmail Messageを再取得できませんでした。'
      );
    }
    var expectedStableKey = makeStableThreadKey(
      ordered[0] && ordered[0].id,
      record.thread_id
    );
    if (String(record.stable_thread_key || '') !== expectedStableKey &&
        String(record.stable_thread_key || '') !==
          makeStableThreadKey('', record.thread_id)) {
      throw new WorkOsAppError(
        'E_MESSAGE_ID_CONFLICT',
        'GMAIL_MESSAGE_REFETCH',
        false,
        'Stable Thread Keyが再取得結果と一致しません。'
      );
    }
    var recent = ordered.slice(
      Math.max(0, targetIndex - WorkOsConfig.EMAIL_CONTEXT_MAX_MESSAGES),
      targetIndex + 1
    );
    return fetchSelectedContent({
      message_id: record.message_id,
      thread_id: record.thread_id,
      stable_thread_key: record.stable_thread_key,
      message_refs: recent.map(function (message) {
        return {
          id: String(message.id || ''),
          internal_date: messageTimestamp(message)
        };
      })
    }, {
      call_meter: callMeter,
      budget: options && options.budget,
      reserve_ms: options && options.reserve_ms
    });
  }

  function syncLabelSubset(
    threadId,
    desiredNames,
    managedNames,
    stage,
    options
  ) {
    assertService();
    var desired = desiredNames || [];
    desired.forEach(function (name) {
      if (managedNames.indexOf(name) === -1) {
        throw new WorkOsAppError(
          'E_GMAIL_LABEL_POLICY',
          stage,
          false,
          '管理対象外のGmailラベル変更を拒否しました。'
        );
      }
    });
    var labelCache = options && options.label_cache;
    var labelIndex = labelCache && labelCache.formal_by_name
      ? labelCache.formal_by_name
      : formalLabelIndex(listLabels(options && options.call_meter));
    var missing = managedNames.filter(function (name) {
      return !labelIndex[name];
    });
    if (missing.length) {
      throw new WorkOsAppError(
        'E_GMAIL_LABEL_MISSING',
        stage,
        false,
        '正式Gmailラベルが不足しています。'
      );
    }
    var addIds = desired.map(function (name) {
      return labelIndex[name];
    });
    var removeIds = managedNames.filter(function (name) {
      return desired.indexOf(name) === -1;
    }).map(function (name) {
      return labelIndex[name];
    });
    try {
      assertTimeBudget(options, stage);
      consumeCall(options && options.call_meter, stage);
      Gmail.Users.Threads.modify(
        {
          addLabelIds: addIds,
          removeLabelIds: removeIds
        },
        'me',
        String(threadId || '')
      );
    } catch (error) {
      rethrowCallBudget(error);
      throw new WorkOsAppError(
        'E_GMAIL_LABEL_SYNC',
        stage,
        true,
        'Gmailラベルを同期できませんでした。'
      );
    }
    return {
      added_count: addIds.length,
      removed_count: removeIds.length,
      human_label_changes: 0
    };
  }

  function syncAiLabels(threadId, desiredNames, options) {
    return syncLabelSubset(
      threadId,
      desiredNames,
      ['AI/要対応', 'AI/期限', 'AI/返信待', 'AI/要確認'],
      'GMAIL_AI_LABEL_SYNC',
      options
    );
  }

  function setSystemFailureLabel(threadId, enabled, options) {
    return syncLabelSubset(
      threadId,
      enabled ? ['SYS/失敗'] : [],
      ['SYS/失敗'],
      'GMAIL_ERROR_LABEL_SYNC',
      options
    );
  }

  return Object.freeze({
    inspectFormalLabels: inspectFormalLabels,
    ensureFormalLabels: ensureFormalLabels,
    makeStableThreadKey: makeStableThreadKey,
    makeSourceEmailUrl: makeSourceEmailUrl,
    decideManualLabelAction: decideManualLabelAction,
    listManualCandidates: listManualCandidates,
    automaticQuery: automaticQuery,
    listAutomaticCandidates: listAutomaticCandidates,
    loadLabelCache: loadLabelCache,
    createCallMeter: createCallMeter,
    automaticCandidatePolicy: automaticCandidatePolicy,
    fetchSelectedContent: fetchSelectedContent,
    refetchMessageContent: refetchMessageContent,
    syncAiLabels: syncAiLabels,
    setSystemFailureLabel: setSystemFailureLabel
  });
}());
