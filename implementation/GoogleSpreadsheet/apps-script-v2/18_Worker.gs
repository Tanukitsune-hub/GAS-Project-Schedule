/**
 * Manual and scheduled workers through the Phase 6 bounded automation flow.
 *
 * Phase 2 still stops at PREPROCESSED. The Mock vertical entry point keeps the
 * deterministic Phase 3 AI boundary, then persists a CALENDAR checkpoint and
 * processes at most one due outbox job. Calendar retries resume from that
 * checkpoint without refetching Gmail, invoking AI or rewriting Task business
 * fields. No production trigger is created by this module.
 */
var WorkOsWorker = (function () {
  var INTERNAL_SCHEDULED_CAPABILITY = {};
  var INTERNAL_GEMINI_SYNTHETIC_CAPABILITY = {};
  var LOCAL_TEST_PROPERTIES = {};

  function workerProperties(settings) {
    if (settings && settings.properties) {
      return settings.properties;
    }
    if (typeof PropertiesService !== 'undefined' &&
        PropertiesService &&
        typeof PropertiesService.getScriptProperties === 'function') {
      return PropertiesService.getScriptProperties();
    }
    if (!WorkOsConfig.TEST_MODE) {
      throw new WorkOsAppError(
        'E_PROPERTIES_UNAVAILABLE',
        'WORKER',
        false,
        'Script Propertiesを利用できません。'
      );
    }
    return {
      getProperty: function (key) {
        return Object.prototype.hasOwnProperty.call(
          LOCAL_TEST_PROPERTIES,
          key
        )
          ? LOCAL_TEST_PROPERTIES[key]
          : null;
      },
      setProperty: function (key, value) {
        LOCAL_TEST_PROPERTIES[String(key)] = String(value);
        return this;
      },
      deleteProperty: function (key) {
        delete LOCAL_TEST_PROPERTIES[String(key)];
        return this;
      }
    };
  }

  function boundSpreadsheet(options) {
    var supplied = options && options.spreadsheet;
    var spreadsheet = supplied || SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      throw new WorkOsAppError(
        'E_SETUP_NOT_BOUND',
        'MANUAL_IMPORT',
        false,
        'Bound Spreadsheetから実行してください。'
      );
    }
    return spreadsheet;
  }

  function formatToday(dateValue) {
    return Utilities.formatDate(
      dateValue,
      WorkOsConfig.TIMEZONE,
      'yyyy-MM-dd'
    );
  }

  function budgetError() {
    return new WorkOsAppError(
      'E_BUDGET_EXHAUSTED',
      'MANUAL_IMPORT',
      true,
      'soft execution budgetに達したため安全なcheckpointで停止しました。'
    );
  }

  function isExecutionPauseCode(code) {
    return code === 'E_BUDGET_EXHAUSTED' ||
      code === 'E_GMAIL_CALL_BUDGET';
  }

  function createGmailCallMeter(gateway, limit, supplied) {
    if (supplied) {
      return supplied;
    }
    return gateway && typeof gateway.createCallMeter === 'function'
      ? gateway.createCallMeter(limit)
      : null;
  }

  function gmailCallMetric(callMeter, methodName) {
    return callMeter &&
      typeof callMeter[methodName] === 'function'
      ? Number(callMeter[methodName]())
      : 0;
  }

  function manualCandidateSuppressionsFromContext(context) {
    var processStatuses = {
      PREPROCESSED: true,
      CLASSIFIED: true,
      TASKS_WRITTEN: true,
      CALENDAR_PENDING: true,
      DONE: true,
      SKIPPED: true,
      DEAD: true
    };
    var skipStatuses = {
      SKIPPED: true,
      DONE: true,
      DEAD: true
    };
    var processIds = {};
    var skipIds = {};
    (context.logicalRows || []).forEach(function (record) {
      var messageId = String(record.message_id || '');
      var status = String(record.processing_status || '');
      if (messageId && processStatuses[status]) {
        processIds[messageId] = true;
      }
      if (messageId && skipStatuses[status]) {
        skipIds[messageId] = true;
      }
    });
    return {
      process_suppressed_message_ids: processIds,
      skip_suppressed_message_ids: skipIds
    };
  }

  function manualCandidateSuppressionSnapshot(spreadsheet) {
    return WorkOsUtilities.withScriptLock(function (lock) {
      var context =
        WorkOsMessageStateRepository.createContextForHeldLock(
          WorkOsMessageStateRepository.messageSheet(spreadsheet),
          lock
        );
      return manualCandidateSuppressionsFromContext(context);
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  function runtimeSettingsSnapshot(spreadsheet, settings) {
    if (settings && settings.runtime_settings) {
      return settings.runtime_settings;
    }
    if (typeof WorkOsRuntimeSettings !== 'undefined' &&
        WorkOsRuntimeSettings &&
        typeof WorkOsRuntimeSettings.readSnapshot === 'function') {
      return WorkOsRuntimeSettings.readSnapshot(spreadsheet);
    }
    if (!WorkOsConfig.TEST_MODE) {
      throw new WorkOsAppError(
        'E_RUNTIME_SETTINGS_MODULE_MISSING',
        'RUNTIME_SETTINGS',
        false,
        'Runtime設定moduleを確認できません。'
      );
    }
    return {
      source: 'TEST_CONFIG_FALLBACK',
      settings_read_count: 0,
      manual_max_messages: WorkOsConfig.MANUAL_MAX_MESSAGES,
      automation_max_messages_per_run:
        WorkOsConfig.AUTOMATION_MAX_MESSAGES_PER_RUN,
      manual_worker_soft_limit_ms:
        WorkOsConfig.MANUAL_WORKER_SOFT_LIMIT_MS,
      automation_worker_soft_limit_ms:
        WorkOsConfig.AUTOMATION_WORKER_SOFT_LIMIT_MS
    };
  }

  function assertAutomationQualificationContent(candidate, messageInput) {
    var value = candidate || {};
    var content = messageInput || {};
    var provider = typeof WorkOsGeminiProvider !== 'undefined'
      ? WorkOsGeminiProvider
      : null;
    var candidateValid = provider &&
      typeof provider.isAutomationSyntheticCandidate === 'function' &&
      provider.isAutomationSyntheticCandidate({
        subject: content.subject,
        source_mode: value.source_mode,
        manual_decision: value.manual_decision
      });
    var bodyValid = provider &&
      typeof provider.isAutomationSyntheticBody === 'function' &&
      provider.isAutomationSyntheticBody(content.plain_body);
    if (!candidateValid ||
        content.body_transport_truncated === true ||
        !bodyValid) {
      throw new WorkOsAppError(
        'E_AUTOMATION_SYNTHETIC_GUARD',
        'GMAIL_MESSAGE_BODY',
        false,
        '自動処理の合成候補境界を確認できませんでした。'
      );
    }
    return true;
  }

  function isAutomationQualificationRecord(record) {
    return String(record && record.source_mode || '') ===
      WorkOsConfig.AUTOMATION_QUALIFICATION_SOURCE_MODE;
  }

  function isAutomationPilotMode(settings) {
    return Boolean(settings && settings.pilot_only === true) ||
      (WorkOsConfig.TEST_MODE !== true &&
        WorkOsConfig.AUTOMATION_PILOT_SCOPE ===
          'AUTOMATIC_PERSONAL_INBOX_SHADOW_PILOT');
  }

  function isAutomationPilotRecord(record) {
    return String(record && record.source_mode || '') ===
      WorkOsConfig.AUTOMATION_PILOT_SOURCE_MODE;
  }

  function assertManualWorkerPilotBoundary() {
    if (WorkOsConfig.TEST_MODE === true ||
        WorkOsConfig.AUTOMATION_PILOT_SCOPE !==
          'AUTOMATIC_PERSONAL_INBOX_SHADOW_PILOT') {
      return;
    }
    var status = WorkOsAutomation.getDiagnosticAutomationStatus();
    if (status.status !== 'CONSISTENT' ||
        status.enabled === true ||
        status.desired_enabled === true ||
        Number(status.clock_trigger_count || 0) !== 0 ||
        status.stored_trigger_id_present === true ||
        status.canonical_trigger_present === true) {
      throw new WorkOsAppError(
        'E_MANUAL_PILOT_AUTOMATION_ACTIVE',
        'MANUAL_IMPORT',
        false,
        'Personal Shadow Pilot稼働中は手動取込を実行できません。'
      );
    }
  }

  var WORKER_LEASE_PROPERTY = 'WORK_OS_V2_ACTIVE_WORKER_LEASE';

  function acquireWorkerLease(properties, runId, mode, clock, ttlMs) {
    return WorkOsUtilities.withScriptLock(function () {
      var nowValue = clock();
      var existingRaw = String(
        properties.getProperty(WORKER_LEASE_PROPERTY) || ''
      );
      if (existingRaw) {
        try {
          var existing = JSON.parse(existingRaw);
          var expiresAt = new Date(existing.expires_at);
          if (existing.owner_token &&
              !isNaN(expiresAt.getTime()) &&
              expiresAt.getTime() > nowValue.getTime()) {
            return {
              acquired: false,
              busy: true,
              expires_at: expiresAt
            };
          }
        } catch (parseError) {
          // Invalid bounded lease state is safely replaced under this Lock.
        }
      }
      var ownerToken = WorkOsUtilities.makeId('worker_lease_');
      var leaseMs = Math.max(
        60000,
        Number(ttlMs || WorkOsConfig.AUTOMATION_WORKER_SOFT_LIMIT_MS) +
          WorkOsConfig.AUTOMATION_WORKER_RESERVE_MS
      );
      var lease = {
        version: 1,
        owner_token: ownerToken,
        run_id: String(runId || ''),
        mode: String(mode || '').slice(0, 40),
        acquired_at: nowValue.toISOString(),
        expires_at: new Date(
          nowValue.getTime() + leaseMs
        ).toISOString()
      };
      properties.setProperty(
        WORKER_LEASE_PROPERTY,
        JSON.stringify(lease)
      );
      return {
        acquired: true,
        busy: false,
        owner_token: ownerToken,
        run_id: lease.run_id,
        expires_at: new Date(lease.expires_at)
      };
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  function releaseWorkerLease(properties, lease) {
    if (!lease || !lease.acquired) {
      return false;
    }
    return WorkOsUtilities.withScriptLock(function () {
      var raw = String(
        properties.getProperty(WORKER_LEASE_PROPERTY) || ''
      );
      if (!raw) {
        return false;
      }
      try {
        var current = JSON.parse(raw);
        if (current.owner_token !== lease.owner_token) {
          return false;
        }
      } catch (parseError) {
        return false;
      }
      properties.deleteProperty(WORKER_LEASE_PROPERTY);
      return true;
    }, WorkOsConfig.LOCK_WAIT_MS);
  }

  function appendRunSummarySafely(summary, spreadsheet, deferredError) {
    try {
      var result = WorkOsLogAndDeadLetter.appendRunSummary(
        summary,
        spreadsheet,
        deferredError
      );
      // appendRunSummary() returns null for an intentionally suppressed
      // healthy AUTO_PILOT detail row and a row number for persisted detail.
      return result !== null && result !== undefined;
    } catch (error) {
      return false;
    }
  }

  function legacyLockedProcessManualImportOnce(options) {
    var settings = options || {};
    if (Object.keys(settings).length && !WorkOsConfig.TEST_MODE) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        'MANUAL_IMPORT',
        false,
        'Workerへの依存注入はTest modeだけで利用できます。'
      );
    }
    var spreadsheet = boundSpreadsheet(settings);
    var runtimeSettings = runtimeSettingsSnapshot(
      spreadsheet,
      settings
    );
    var gateway = settings.gateway || WorkOsGmailGateway;
    var gmailCallMeter = createGmailCallMeter(
      gateway,
      WorkOsConfig.MANUAL_GMAIL_API_CALL_LIMIT,
      settings.gmail_call_meter
    );
    var preprocessor = settings.preprocessor || WorkOsEmailPreprocessor;
    var clock = typeof settings.now === 'function'
      ? settings.now
      : function () { return WorkOsUtilities.now(); };
    var startedAt = clock();
    var startedAtMs = startedAt.getTime();
    var budget = settings.budget || WorkOsUtilities.createSoftBudget(
      runtimeSettings.manual_worker_soft_limit_ms,
      Date.now()
    );
    var runId = WorkOsUtilities.makeId('run_');
    var summary = {
      run_id: runId,
      mode: 'GMAIL_PHASE2',
      started_at: startedAt,
      candidate_count: 0,
      processed_count: 0,
      skipped_count: 0,
      error_count: 0,
      run_status: 'COMPLETE',
      note: 'Phase 2 checkpoint only'
    };

    try {
      var stateSheet = WorkOsMessageStateRepository.messageSheet(spreadsheet);
      WorkOsMessageStateRepository.withLockedContext(
        stateSheet,
        function (context) {
          if (budget.isExhausted(WorkOsConfig.MANUAL_WORKER_RESERVE_MS)) {
            summary.run_status = 'PAUSED';
            summary.note = 'Soft budget reached before Gmail search';
            return;
          }
          var suppression =
            manualCandidateSuppressionsFromContext(context);
          var candidates = gateway.listManualCandidates({
            budget: budget,
            reserve_ms: WorkOsConfig.MANUAL_WORKER_RESERVE_MS,
            call_meter: gmailCallMeter,
            process_suppressed_message_ids:
              suppression.process_suppressed_message_ids,
            skip_suppressed_message_ids:
              suppression.skip_suppressed_message_ids
          });
          summary.candidate_count = candidates.length;
          var newlyHandled = 0;
          for (var index = 0; index < candidates.length; index += 1) {
            var candidate = candidates[index];
            if (newlyHandled >= runtimeSettings.manual_max_messages) {
              break;
            }
            if (budget.isExhausted(WorkOsConfig.MANUAL_WORKER_RESERVE_MS)) {
              summary.run_status = 'PAUSED';
              summary.note = 'Soft budget reached before new claim';
              break;
            }
            if (candidate.manual_decision === 'SKIP') {
              var existingSkipped = WorkOsMessageStateRepository.getByMessageId(
                context,
                candidate.message_id
              );
              var skippedResult = WorkOsMessageStateRepository.markSkippedInContext(
                candidate,
                runId,
                context,
                clock()
              );
              summary.skipped_count += 1;
              if ((!existingSkipped ||
                   existingSkipped.processing_status !==
                     WorkOsMessageStateRepository.STATUSES.SKIPPED) &&
                  skippedResult.operation === 'UPDATED') {
                newlyHandled += 1;
                break;
              }
              continue;
            }
            if (candidate.manual_decision !== 'PROCESS') {
              summary.skipped_count += 1;
              continue;
            }
            var claim = WorkOsMessageStateRepository.claimInContext(
              candidate,
              runId,
              context,
              clock()
            );
            if (!claim.claimed) {
              summary.skipped_count += 1;
              continue;
            }
            newlyHandled += 1;
            try {
              if (budget.isExhausted(WorkOsConfig.MANUAL_WORKER_RESERVE_MS)) {
                throw budgetError();
              }
              var messageInput = gateway.fetchSelectedContent(
                candidate,
                {
                  call_meter: gmailCallMeter,
                  budget: budget,
                  reserve_ms: WorkOsConfig.MANUAL_WORKER_RESERVE_MS
                }
              );
              if (budget.isExhausted(WorkOsConfig.MANUAL_WORKER_RESERVE_MS)) {
                throw budgetError();
              }
              var preprocessed = preprocessor.preprocess(
                messageInput,
                {
                  today: formatToday(clock()),
                  timezone: WorkOsConfig.TIMEZONE,
                  activeTaskProvider: function () {
                    // Task lookup is connected in Phase 3. Phase 2 must have
                    // no Task read/write side effect.
                    return [];
                  }
                }
              );
              WorkOsMessageStateRepository.checkpointPreprocessedInContext(
                candidate.message_id,
                runId,
                preprocessed.content_hash,
                context,
                clock()
              );
              summary.processed_count += 1;
              break;
            } catch (error) {
              var safeFailure = WorkOsUtilities.safeError(
                error,
                'MANUAL_IMPORT'
              );
              if (isExecutionPauseCode(safeFailure.code)) {
                WorkOsMessageStateRepository.pauseForBudgetInContext(
                  candidate.message_id,
                  runId,
                  context,
                  clock()
                );
                summary.run_status = 'PAUSED';
                summary.note = safeFailure.code;
              } else {
                var failure =
                  WorkOsMessageStateRepository.recordFailureInContext(
                    candidate.message_id,
                    runId,
                    error,
                    context,
                    clock()
                  );
                summary.error_count += 1;
                summary.run_status = 'FAILED';
                summary.note = failure.safe_error.code;
                try {
                  WorkOsLogAndDeadLetter.recordMessageError(
                    error,
                    {
                      message_id: failure.record.message_id,
                      thread_id: failure.record.thread_id,
                      retry_count: failure.record.retry_count,
                      next_retry_at: failure.record.next_retry_at,
                      processing_status: failure.record.processing_status,
                      resume_stage:
                        WorkOsMessageStateRepository
                          .checkpointStageForResumeStage(
                            failure.record.resume_stage
                          )
                    },
                    runId,
                    spreadsheet
                  );
                } catch (errorLogFailure) {
                  summary.note += ';E_ERROR_LOG_WRITE';
                }
              }
              break;
            }
          }
        }
      );
    } catch (error) {
      var safe = WorkOsUtilities.safeError(error, 'MANUAL_IMPORT');
      if (!isExecutionPauseCode(safe.code)) {
        summary.error_count += 1;
      }
      summary.run_status = isExecutionPauseCode(safe.code)
        ? 'PAUSED'
        : 'FAILED';
      summary.note = safe.code;
    }

    var finishedAt = clock();
    summary.finished_at = finishedAt;
    summary.duration_ms = Math.max(0, finishedAt.getTime() - startedAtMs);
    summary.gmail_api_call_count =
      gmailCallMetric(gmailCallMeter, 'count');
    summary.gmail_api_call_limit =
      gmailCallMetric(gmailCallMeter, 'limit');
    var logRecorded = true;
    try {
      WorkOsLogAndDeadLetter.appendRunSummary(summary, spreadsheet);
    } catch (logError) {
      logRecorded = false;
      if (summary.run_status === 'COMPLETE') {
        summary.run_status = 'FAILED';
        summary.error_count += 1;
        summary.note = 'E_RUN_SUMMARY_WRITE';
      }
    }
    return {
      run_id: summary.run_id,
      status: summary.run_status,
      note: summary.note,
      candidate_count: summary.candidate_count,
      processed_count: summary.processed_count,
      skipped_count: summary.skipped_count,
      error_count: summary.error_count,
      gmail_api_call_count: summary.gmail_api_call_count,
      gmail_api_call_limit: summary.gmail_api_call_limit,
      duration_ms: summary.duration_ms,
      checkpoint: summary.processed_count ? 'PREPROCESSED' : '',
      next_operation: summary.processed_count ? 'CLASSIFY' : '',
      log_recorded: logRecorded,
      external_services: {
        gmail: 'ADVANCED_GMAIL_SERVICE',
        ai: 'NOT_CALLED',
        calendar: 'NOT_CALLED'
      }
    };
  }

  function processManualImportOnce(options) {
    var settings = options || {};
    if (Object.keys(settings).length && !WorkOsConfig.TEST_MODE) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        'MANUAL_IMPORT',
        false,
        'Workerへの依存注入はTest modeだけで利用できます。'
      );
    }
    var spreadsheet = boundSpreadsheet(settings);
    var runtimeSettings = runtimeSettingsSnapshot(
      spreadsheet,
      settings
    );
    assertManualWorkerPilotBoundary();
    var gateway = settings.gateway || WorkOsGmailGateway;
    var preprocessor = settings.preprocessor || WorkOsEmailPreprocessor;
    var properties = workerProperties(settings);
    var clock = typeof settings.now === 'function'
      ? settings.now
      : function () { return WorkOsUtilities.now(); };
    var startedAt = clock();
    var runId = WorkOsUtilities.makeId('run_');
    var budget = settings.budget || WorkOsUtilities.createSoftBudget(
      runtimeSettings.manual_worker_soft_limit_ms,
      Date.now()
    );
    var callMeter = createGmailCallMeter(
      gateway,
      WorkOsConfig.MANUAL_GMAIL_API_CALL_LIMIT,
      settings.gmail_call_meter
    );
    var summary = {
      run_id: runId,
      mode: 'GMAIL_PHASE2',
      started_at: startedAt,
      candidate_count: 0,
      processed_count: 0,
      skipped_count: 0,
      error_count: 0,
      run_status: 'COMPLETE',
      note: 'Phase 2 checkpoint only; lock-free external I/O'
    };
    var lease = null;
    try {
      lease = acquireWorkerLease(
        properties,
        runId,
        summary.mode,
        clock,
        runtimeSettings.manual_worker_soft_limit_ms
      );
      if (!lease.acquired) {
        summary.run_status = 'BUSY';
        summary.note = 'WORKER_LEASE_ACTIVE';
      } else if (budget.isExhausted(
        WorkOsConfig.MANUAL_WORKER_RESERVE_MS
      )) {
        summary.run_status = 'PAUSED';
        summary.note = 'E_BUDGET_EXHAUSTED';
      } else {
        var suppression =
          manualCandidateSuppressionSnapshot(spreadsheet);
        var candidates = gateway.listManualCandidates({
          budget: budget,
          reserve_ms: WorkOsConfig.MANUAL_WORKER_RESERVE_MS,
          call_meter: callMeter,
          process_suppressed_message_ids:
            suppression.process_suppressed_message_ids,
          skip_suppressed_message_ids:
            suppression.skip_suppressed_message_ids
        });
        summary.candidate_count = candidates.length;
        for (var index = 0;
            index < candidates.length &&
            summary.processed_count <
              runtimeSettings.manual_max_messages;
            index += 1) {
          if (budget.isExhausted(
            WorkOsConfig.MANUAL_WORKER_RESERVE_MS
          )) {
            throw budgetError();
          }
          var candidate = candidates[index];
          if (candidate.manual_decision === 'SKIP') {
            WorkOsUtilities.withScriptLock(function (lock) {
              var skipContext =
                WorkOsMessageStateRepository.createContextForHeldLock(
                  WorkOsMessageStateRepository.messageSheet(spreadsheet),
                  lock
                );
              WorkOsMessageStateRepository.markSkippedInContext(
                candidate,
                runId,
                skipContext,
                clock()
              );
            }, WorkOsConfig.LOCK_WAIT_MS);
            summary.skipped_count += 1;
            break;
          }
          if (candidate.manual_decision !== 'PROCESS') {
            summary.skipped_count += 1;
            continue;
          }
          var prepared = WorkOsUtilities.withScriptLock(function (lock) {
            var messageContext =
              WorkOsMessageStateRepository.createContextForHeldLock(
                WorkOsMessageStateRepository.messageSheet(spreadsheet),
                lock
              );
            var claim = WorkOsMessageStateRepository.claimInContext(
              candidate,
              runId,
              messageContext,
              clock()
            );
            if (!claim.claimed) {
              return null;
            }
            return {
              message_id: candidate.message_id,
              run_id: runId,
              updated_at_ms:
                new Date(claim.record.updated_at).getTime()
            };
          }, WorkOsConfig.LOCK_WAIT_MS);
          if (!prepared) {
            summary.skipped_count += 1;
            continue;
          }
          if (budget.isExhausted(
            WorkOsConfig.MANUAL_WORKER_RESERVE_MS
          )) {
            throw budgetError();
          }
          var messageInput = gateway.fetchSelectedContent(
            candidate,
            {
              call_meter: callMeter,
              budget: budget,
              reserve_ms: WorkOsConfig.MANUAL_WORKER_RESERVE_MS
            }
          );
          var preprocessed = preprocessor.preprocess(
            messageInput,
            {
              today: formatToday(clock()),
              timezone: WorkOsConfig.TIMEZONE,
              activeTaskProvider: function () { return []; }
            }
          );
          WorkOsUtilities.withScriptLock(function (lock) {
            var commitContext =
              WorkOsMessageStateRepository.createContextForHeldLock(
                WorkOsMessageStateRepository.messageSheet(spreadsheet),
                lock
              );
            var current = WorkOsMessageStateRepository.getByMessageId(
              commitContext,
              prepared.message_id
            );
            if (!current ||
                current.processing_status !==
                  WorkOsMessageStateRepository.STATUSES.CLAIMED ||
                current.claim_run_id !== prepared.run_id ||
                current.resume_stage !==
                  WorkOsMessageStateRepository.RESUME_STAGES.PREPROCESS ||
                new Date(current.updated_at).getTime() !==
                  prepared.updated_at_ms) {
              throw new WorkOsAppError(
                'E_MESSAGE_CLAIM_CONFLICT',
                'PREPROCESS',
                true,
                'Message preprocess leaseの所有権が変更されました。'
              );
            }
            WorkOsMessageStateRepository.checkpointPreprocessedInContext(
              prepared.message_id,
              prepared.run_id,
              preprocessed.content_hash,
              commitContext,
              clock()
            );
          }, WorkOsConfig.LOCK_WAIT_MS);
          summary.processed_count += 1;
          break;
        }
      }
    } catch (error) {
      var safe = WorkOsUtilities.safeError(error, 'MANUAL_IMPORT');
      summary.run_status = isExecutionPauseCode(safe.code)
        ? 'PAUSED'
        : 'FAILED';
      summary.note = safe.code;
      if (!isExecutionPauseCode(safe.code)) {
        summary.error_count += 1;
      }
      /*
       * A failed re-lock deliberately leaves the durable CLAIMED checkpoint.
       * Stale-claim recovery owns the next transition; no unlocked write is
       * attempted.
       */
      try {
        WorkOsUtilities.withScriptLock(function (lock) {
          var failureContext =
            WorkOsMessageStateRepository.createContextForHeldLock(
              WorkOsMessageStateRepository.messageSheet(spreadsheet),
              lock
            );
          var claimed = failureContext.logicalRows.filter(function (record) {
            return record.claim_run_id === runId &&
              record.processing_status ===
                WorkOsMessageStateRepository.STATUSES.CLAIMED;
          })[0];
          if (claimed) {
            if (isExecutionPauseCode(safe.code)) {
              WorkOsMessageStateRepository.pauseForBudgetInContext(
                claimed.message_id,
                runId,
                failureContext,
                clock()
              );
            } else {
              WorkOsMessageStateRepository.recordFailureInContext(
                claimed.message_id,
                runId,
                error,
                failureContext,
                clock()
              );
            }
          }
        }, WorkOsConfig.LOCK_WAIT_MS);
      } catch (failureFinalizeError) {
        summary.note += ';CHECKPOINT_FINALIZE_PENDING';
      }
    }
    try {
      releaseWorkerLease(properties, lease);
    } catch (releaseError) {
      summary.note += ';WORKER_LEASE_RELEASE_PENDING';
    }
    var finishedAt = clock();
    summary.finished_at = finishedAt;
    summary.duration_ms = Math.max(
      0,
      finishedAt.getTime() - startedAt.getTime()
    );
    summary.gmail_api_call_count = gmailCallMetric(callMeter, 'count');
    summary.gmail_api_call_limit = gmailCallMetric(callMeter, 'limit');
    var logRecorded = appendRunSummarySafely(summary, spreadsheet);
    return {
      run_id: runId,
      status: summary.run_status,
      note: summary.note,
      candidate_count: summary.candidate_count,
      processed_count: summary.processed_count,
      skipped_count: summary.skipped_count,
      error_count: summary.error_count,
      gmail_api_call_count: summary.gmail_api_call_count,
      gmail_api_call_limit: summary.gmail_api_call_limit,
      duration_ms: summary.duration_ms,
      checkpoint: summary.processed_count ? 'PREPROCESSED' : '',
      next_operation: summary.processed_count ? 'CLASSIFY' : '',
      log_recorded: logRecorded,
      external_services: {
        gmail: summary.candidate_count
          ? 'ADVANCED_GMAIL_SERVICE'
          : 'NOT_CALLED',
        ai: 'NOT_CALLED',
        calendar: 'NOT_CALLED'
      }
    };
  }

  function eligiblePhase3Records(context, nowValue) {
    return context.logicalRows.filter(function (record) {
      if (record.processing_status ===
          WorkOsMessageStateRepository.STATUSES.PREPROCESSED ||
          record.processing_status ===
            WorkOsMessageStateRepository.STATUSES.CLASSIFIED ||
          record.processing_status ===
            WorkOsMessageStateRepository.STATUSES.TASKS_WRITTEN ||
          record.processing_status ===
            WorkOsMessageStateRepository.STATUSES.CALENDAR_PENDING) {
        return true;
      }
      if (record.processing_status ===
          WorkOsMessageStateRepository.STATUSES.CLAIMED &&
          record.resume_stage !==
            WorkOsMessageStateRepository.RESUME_STAGES.PREPROCESS) {
        return WorkOsMessageStateRepository.isStaleClaim(
          record,
          nowValue
        );
      }
      return record.processing_status ===
          WorkOsMessageStateRepository.STATUSES.RETRY &&
        record.resume_stage !==
          WorkOsMessageStateRepository.RESUME_STAGES.PREPROCESS &&
        (!(record.next_retry_at instanceof Date) ||
         record.next_retry_at.getTime() <= nowValue.getTime());
    }).sort(function (left, right) {
      var timeDifference =
        right.received_at.getTime() - left.received_at.getTime();
      return timeDifference !== 0
        ? timeDifference
        : left.message_id.localeCompare(right.message_id);
    });
  }

  function phase3BudgetCheck(budget) {
    if (budget.isExhausted(WorkOsConfig.MANUAL_WORKER_RESERVE_MS)) {
      throw budgetError();
    }
  }

  function activeTasksForThread(taskContext, stableThreadKey) {
    return WorkOsTaskRepository.findByStableThreadKey(
      taskContext,
      stableThreadKey
    ).filter(WorkOsTaskReviewPolicy.isActiveTask);
  }

  function threadHasUnresolvedFailure(
    messageContext,
    threadId,
    completingMessageId
  ) {
    return messageContext.logicalRows.some(function (record) {
      if (record.message_id === completingMessageId ||
          record.thread_id !== threadId) {
        return false;
      }
      return record.processing_status ===
          WorkOsMessageStateRepository.STATUSES.RETRY ||
        record.processing_status ===
          WorkOsMessageStateRepository.STATUSES.DEAD ||
        Boolean(record.last_error_code);
    });
  }

  function calendarModuleAvailable() {
    return typeof WorkOsCalendarSync !== 'undefined' &&
      WorkOsCalendarSync &&
      typeof WorkOsCalendarSync.createOutboxContextForHeldLock ===
        'function';
  }

  function calendarOutboxSheet(spreadsheet) {
    var sheet = spreadsheet.getSheetByName(
      WorkOsConfig.SHEETS.SYNC_STATE
    );
    if (!sheet) {
      throw new WorkOsAppError(
        'E_CALENDAR_OUTBOX_MISSING',
        'CALENDAR_SYNC',
        false,
        '同期状態Sheetがありません。'
      );
    }
    return sheet;
  }

  function allTasksInContext(taskContext) {
    return WorkOsTaskRepository.operationalTasks(taskContext);
  }

  function pendingStatusForAction(action) {
    if (action === 'DELETE') {
      return 'DELETE_PENDING';
    }
    if (action === 'CREATE' || action === 'UPDATE') {
      return 'PENDING';
    }
    return 'NOT_REQUIRED';
  }

  /**
   * Persist outbox intent and the Task-side management status under the one
   * Script Lock already held by the caller. Business fields are never patched.
   */
  function enqueueCalendarTasksInContext(
    tasks,
    taskContext,
    outboxContext,
    nowValue,
    forceAll,
    budget
  ) {
    var taskIds = [];
    var counts = {
      inspected_count: 0,
      queued_count: 0,
      noop_count: 0,
      recovered_intent_count: 0
    };
    (tasks || []).forEach(function (task) {
      if (budget &&
          budget.isExhausted(
            WorkOsConfig.MANUAL_WORKER_RESERVE_MS
          )) {
        throw budgetError();
      }
      var taskId = String(task && task.task_id || '').trim();
      if (!taskId) {
        return;
      }
      var currentStatus = String(task.calendar_sync_status || '');
      var hasDurableIntent =
        task.calendar_reconcile_required === true;
      var expectedIntentVersion = Number(
        task.calendar_intent_version
      );
      if (hasDurableIntent &&
          (!Number.isInteger(expectedIntentVersion) ||
           expectedIntentVersion < 1)) {
        throw new WorkOsAppError(
          'E_CALENDAR_INTENT_INVALID',
          'CALENDAR_RECONCILE',
          false,
          'Calendar reconcile intentが不正です。'
        );
      }
      var existingRow = outboxContext.byTaskId[taskId];
      var existingRecord = existingRow
        ? WorkOsCalendarSync.readOutboxRow(
          outboxContext,
          existingRow
        )
        : null;
      if (existingRecord &&
          existingRecord.status === 'DEAD' &&
          !hasDurableIntent) {
        taskIds.push(taskId);
        counts.inspected_count += 1;
        counts.noop_count += 1;
        if (currentStatus !== 'ERROR') {
          WorkOsTaskRepository.applyCalendarPatch(
            taskId,
            { calendar_sync_status: 'ERROR' },
            taskContext,
            nowValue
          );
        }
        return;
      }
      var mayForceCompletedJob = !existingRecord ||
        existingRecord.status === 'DONE';
      var enqueueResult = WorkOsCalendarSync.enqueueTaskInContext(
        task,
        outboxContext,
        {
          now: nowValue,
          timezone: WorkOsConfig.TIMEZONE,
          force_enqueue: hasDurableIntent || (
            mayForceCompletedJob && (
              forceAll === true ||
              currentStatus === 'PENDING' ||
              currentStatus === 'DELETE_PENDING'
            )
          )
        }
      );
      taskIds.push(taskId);
      counts.inspected_count += 1;
      if (enqueueResult.operation === 'NOOP') {
        counts.noop_count += 1;
      } else {
        counts.queued_count += 1;
      }

      var patchStatus = '';
      if (enqueueResult.status === 'PENDING') {
        patchStatus = pendingStatusForAction(
          enqueueResult.desired_action
        );
      } else if (enqueueResult.status === 'DEAD') {
        patchStatus = 'ERROR';
      } else if (enqueueResult.status === 'DONE' &&
          enqueueResult.desired_action === 'NOOP') {
        patchStatus = 'NOT_REQUIRED';
      }
      if (hasDurableIntent) {
        WorkOsTaskRepository.acknowledgeCalendarIntent(
          taskId,
          expectedIntentVersion,
          patchStatus || currentStatus || 'NOT_REQUIRED',
          taskContext,
          nowValue
        );
        counts.recovered_intent_count += 1;
      } else if (patchStatus && currentStatus !== patchStatus) {
        WorkOsTaskRepository.applyCalendarPatch(
          taskId,
          { calendar_sync_status: patchStatus },
          taskContext,
          nowValue
        );
      }
    });
    return {
      task_ids: taskIds,
      counts: counts
    };
  }

  function prioritizeOutboxRows(outboxContext, taskIds) {
    if (!taskIds || !taskIds.length) {
      return;
    }
    var priority = {};
    taskIds.forEach(function (taskId) {
      priority[String(taskId)] = true;
    });
    outboxContext.logicalRows = outboxContext.logicalRows
      .map(function (physicalRow, index) {
        var record = WorkOsCalendarSync.readOutboxRow(
          outboxContext,
          physicalRow
        );
        return {
          row: physicalRow,
          index: index,
          relevant: Boolean(
            record && priority[String(record.task_id || '')]
          )
        };
      })
      .sort(function (left, right) {
        if (left.relevant !== right.relevant) {
          return left.relevant ? -1 : 1;
        }
        return left.index - right.index;
      })
      .map(function (item) { return item.row; });
  }

  function inspectRelatedOutbox(outboxContext, taskIds) {
    var state = {
      pending_count: 0,
      dead_count: 0,
      missing_count: 0,
      first_dead: null
    };
    (taskIds || []).forEach(function (taskId) {
      var physicalRow = outboxContext.byTaskId[String(taskId)];
      if (!physicalRow) {
        state.missing_count += 1;
        return;
      }
      var record = WorkOsCalendarSync.readOutboxRow(
        outboxContext,
        physicalRow
      );
      if (!record) {
        state.missing_count += 1;
      } else if (record.status === 'PENDING' ||
          record.status === 'RETRY') {
        state.pending_count += 1;
      } else if (record.status === 'DEAD') {
        state.dead_count += 1;
        if (!state.first_dead) {
          state.first_dead = record;
        }
      }
    });
    return state;
  }

  function calendarFailureError(result) {
    var value = result || {};
    return new WorkOsAppError(
      String(value.error_code || 'E_CALENDAR_SYNC'),
      'CALENDAR_SYNC',
      value.retryable === true || value.status === 'RETRY',
      'Calendar同期に失敗しました。詳細・ID・payloadは保存しません。'
    );
  }

  function configuredCalendarJobLimit() {
    var value = WorkOsConfig.CALENDAR_MAX_JOBS_PER_RUN;
    if (typeof value !== 'number' ||
        !Number.isFinite(value) ||
        !Number.isInteger(value) ||
        value < 0) {
      throw new WorkOsAppError(
        'E_CALENDAR_JOB_LIMIT_CONFIG',
        'CALENDAR_SYNC',
        false,
        'Calendar Job上限設定が不正です。'
      );
    }
    return value;
  }

  /**
   * Process one due job only. If taskIds is supplied, an unrelated global
   * outbox job is never consumed on behalf of the current Message.
   */
  function processOneCalendarJobInContext(options) {
    var settings = options || {};
    if (configuredCalendarJobLimit() !== 1) {
      throw new WorkOsAppError(
        'E_CALENDAR_JOB_LIMIT_CONFIG',
        'CALENDAR_SYNC',
        false,
        'Phase 4 Calendar Job上限は1でなければなりません。'
      );
    }
    var taskIds = settings.task_ids || [];
    var nowValue = settings.now;
    if (!settings.allow_global && !taskIds.length) {
      return {
        status: 'IDLE',
        processed_count: 0,
        selected_task_id: ''
      };
    }
    prioritizeOutboxRows(settings.outbox_context, taskIds);
    var selected = WorkOsCalendarSync.selectNextJob(
      settings.outbox_context,
      nowValue
    );
    if (selected && !settings.allow_global &&
        taskIds.indexOf(String(selected.record.task_id || '')) === -1) {
      selected = null;
    }
    if (!selected) {
      return {
        status: 'IDLE',
        processed_count: 0,
        selected_task_id: ''
      };
    }
    var result = WorkOsCalendarSync.processNextJobInContext(
      settings.outbox_context,
      {
        gateway: settings.gateway,
        properties: settings.properties,
        instance_id: settings.instance_id,
        timezone: WorkOsConfig.TIMEZONE,
        now: nowValue,
        budget: settings.budget,
        reserve_ms: WorkOsConfig.MANUAL_WORKER_RESERVE_MS,
        task_reader: function (taskId) {
          return WorkOsTaskRepository.findByTaskId(
            settings.task_context,
            taskId
          );
        },
        task_writer: function (taskId, patch) {
          return WorkOsTaskRepository.applyCalendarPatch(
            taskId,
            patch,
            settings.task_context,
            nowValue
          );
        }
      }
    );
    result.selected_task_id = String(selected.record.task_id || '');
    return result;
  }

  function legacyLockedProcessMockVerticalOnce(options) {
    var settings = options || {};
    var internalScheduled =
      settings.internal_scheduled_capability ===
        INTERNAL_SCHEDULED_CAPABILITY;
    if (Object.keys(settings).length &&
        !WorkOsConfig.TEST_MODE &&
        !internalScheduled) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        'MOCK_VERTICAL',
        false,
        'Workerへの依存注入はTest modeだけで利用できます。'
      );
    }
    var spreadsheet = boundSpreadsheet(settings);
    var gateway = settings.gateway || WorkOsGmailGateway;
    var gmailCallMeter = createGmailCallMeter(
      gateway,
      internalScheduled
        ? WorkOsConfig.AUTOMATION_GMAIL_API_CALL_LIMIT
        : WorkOsConfig.MANUAL_GMAIL_API_CALL_LIMIT,
      settings.gmail_call_meter
    );
    var gmailBudgetReserve = internalScheduled
      ? WorkOsConfig.AUTOMATION_WORKER_RESERVE_MS
      : WorkOsConfig.MANUAL_WORKER_RESERVE_MS;
    var preprocessor = settings.preprocessor || WorkOsEmailPreprocessor;
    var adapter = WorkOsAiAdapter.createAdapter({
      adapter: settings.adapter,
      adapter_options: settings.adapter_options || {},
      mode: settings.adapter_mode || ''
    });
    if (adapter && typeof adapter.healthCheck === 'function') {
      var adapterHealth = adapter.healthCheck();
      if (!adapterHealth || adapterHealth.status !== 'READY') {
        throw new WorkOsAppError(
          String(adapterHealth && adapterHealth.code ||
            'E_AI_NOT_CONFIGURED'),
          'AI_CONFIG',
          false,
          'AI Adapterのlocal設定が完了していません。'
        );
      }
    }
    var adapterMetadata = WorkOsAiAdapter.getMetadata(adapter);
    if (adapterMetadata.provider !== 'MOCK') {
      var isNetworkFreeExternalTest =
        WorkOsConfig.TEST_MODE &&
        adapter instanceof WorkOsAiAdapter.ExternalAiAdapter &&
        adapter.settings &&
        adapter.settings.transport instanceof WorkOsAiAdapter.MockHttpTransport;
      isNetworkFreeExternalTest = isNetworkFreeExternalTest ||
        (internalScheduled &&
         !(adapter instanceof WorkOsAiAdapter.ExternalAiAdapter));
      if (!isNetworkFreeExternalTest && !internalScheduled) {
        throw new WorkOsAppError(
          'E_AI_EXTERNAL_WORKER_DISABLED',
          'AI_CONFIG',
          false,
          '実Provider Workerは会社承認とLock分離設計が完了するまで無効です。'
        );
      }
    }
    var clock = typeof settings.now === 'function'
      ? settings.now
      : function () { return WorkOsUtilities.now(); };
    var budget = settings.budget || WorkOsUtilities.createSoftBudget(
      WorkOsConfig.MANUAL_WORKER_SOFT_LIMIT_MS,
      Date.now()
    );
    var startedAt = clock();
    var runId = WorkOsUtilities.makeId('run_');
    var summary = {
      run_id: runId,
      mode: adapterMetadata.provider === 'MOCK'
        ? 'MOCK_PHASE3'
        : 'AI_PHASE5',
      started_at: startedAt,
      candidate_count: 0,
      processed_count: 0,
      skipped_count: 0,
      error_count: 0,
      created_task_count: 0,
      updated_task_count: 0,
      review_count: 0,
      run_status: 'COMPLETE',
      note: 'Phase 4 Mock-to-Calendar vertical',
      classification_reused: false,
      checkpoint: '',
      calendar_called: false,
      calendar_job_count: 0,
      gmail_called: false,
      ai_called: false
    };

    try {
      var messageSheet =
        WorkOsMessageStateRepository.messageSheet(spreadsheet);
      var taskSheet = spreadsheet.getSheetByName(WorkOsConfig.SHEETS.TASKS);
      if (!taskSheet) {
        throw new WorkOsAppError(
          'E_SCHEMA_MISSING_SHEET',
          'MOCK_VERTICAL',
          false,
          'タスク一覧Sheetがありません。'
        );
      }
      var executeWithLock = function (lock) {
        var messageContext = settings.message_context ||
          WorkOsMessageStateRepository.createContextForHeldLock(
            messageSheet,
            lock
          );
        var taskContext = settings.task_context ||
          WorkOsTaskRepository.createContextForHeldLock(
            taskSheet,
            lock
          );
        if (!calendarModuleAvailable()) {
          throw new WorkOsAppError(
            'E_CALENDAR_MODULE_MISSING',
            'CALENDAR_SYNC',
            false,
            'Calendar同期moduleがありません。'
          );
        }
        var outboxContext = settings.outbox_context ||
          WorkOsCalendarSync.createOutboxContextForHeldLock(
            calendarOutboxSheet(spreadsheet),
            lock
          );
        var errorContext = settings.error_context ||
          WorkOsLogAndDeadLetter.createErrorContext(spreadsheet);
        phase3BudgetCheck(budget);
        var eligible = eligiblePhase3Records(messageContext, clock());
        if (settings.selected_message_id) {
          eligible = eligible.filter(function (record) {
            return record.message_id ===
              String(settings.selected_message_id);
          });
        }
        summary.candidate_count = eligible.length;
        if (!eligible.length) {
          return;
        }
        var selected = eligible[0];
        var claim = WorkOsMessageStateRepository.claimForResumeInContext(
          selected.message_id,
          runId,
          messageContext,
          clock()
        );
        if (!claim.claimed) {
          summary.skipped_count = 1;
          return;
        }
        var calendarFailureMetadata = null;
        try {
          var current = WorkOsMessageStateRepository.getByMessageId(
            messageContext,
            selected.message_id
          );
          var classification = current.classification_json;
          var classificationProvenance =
            current.classification_provenance_json || adapterMetadata;
          var preprocessed = null;
          var requiresMessageContent =
            current.resume_stage ===
              WorkOsMessageStateRepository.RESUME_STAGES.CLASSIFY ||
            current.resume_stage ===
              WorkOsMessageStateRepository.RESUME_STAGES.TASK_WRITE;
          if (requiresMessageContent) {
            phase3BudgetCheck(budget);
            preprocessed = settings.preprocessed_result || null;
            if (!preprocessed) {
              summary.gmail_called = true;
              var messageInput = gateway.refetchMessageContent(
                claim.record,
                {
                  call_meter: gmailCallMeter,
                  budget: budget,
                  reserve_ms: gmailBudgetReserve
                }
              );
              phase3BudgetCheck(budget);
              preprocessed = preprocessor.preprocess(
                messageInput,
                {
                  today: formatToday(clock()),
                  timezone: WorkOsConfig.TIMEZONE,
                  activeTaskProvider: function (stableThreadKey) {
                    return activeTasksForThread(taskContext, stableThreadKey);
                  }
                }
              );
            }
            if (preprocessed.content_hash !== claim.record.preprocess_hash) {
              throw new WorkOsAppError(
                'E_PREPROCESS_HASH_CONFLICT',
                'AI_INPUT',
                false,
                '再取得した本文hashがPREPROCESSED checkpointと一致しません。'
              );
            }
          }
          if (current.resume_stage ===
              WorkOsMessageStateRepository.RESUME_STAGES.CLASSIFY) {
            if (classification) {
              throw new WorkOsAppError(
                'E_MESSAGE_CHECKPOINT_CONFLICT',
                'AI_CLASSIFY',
                false,
                'CLASSIFY段階に保存済みclassificationが存在します。'
              );
            }
            phase3BudgetCheck(budget);
            if (adapterMetadata.provider !== 'MOCK' &&
                settings.held_lock &&
                !isNetworkFreeExternalTest) {
              throw new WorkOsAppError(
                'E_AI_LOCK_BOUNDARY_REQUIRED',
                'AI_CLASSIFY',
                true,
                '実AI transportはScript Lock外の分類stageで実行してください。'
              );
            }
            summary.ai_called = true;
            classification = adapter.classify(
              WorkOsAiAdapter.buildInput(preprocessed)
            );
            WorkOsAiAdapter.validateOutput(classification);
            WorkOsMessageStateRepository.checkpointClassificationInContext(
              selected.message_id,
              runId,
              classification,
              messageContext,
              clock(),
              adapterMetadata
            );
          } else if (current.resume_stage ===
              WorkOsMessageStateRepository.RESUME_STAGES.TASK_WRITE) {
            if (!classification) {
              throw new WorkOsAppError(
                'E_MESSAGE_CHECKPOINT_CONFLICT',
                'TASK_WRITE',
                false,
                'TASK_WRITE段階にclassificationがありません。'
              );
            }
            WorkOsAiAdapter.validateOutput(classification);
            if (WorkOsAiAdapter.classificationHash(
              classification,
              classificationProvenance
            ) !==
                current.classification_hash) {
              throw new WorkOsAppError(
                'E_MESSAGE_CHECKPOINT_CONFLICT',
                'AI_CLASSIFY',
                false,
                '保存済みclassification hashが一致しません。'
              );
            }
            summary.classification_reused = true;
          } else if (current.resume_stage ===
              WorkOsMessageStateRepository.RESUME_STAGES.FINALIZE) {
            // The classification and Task checkpoint are already durable.
            // Finalization must not depend on fetching mutable Gmail content.
            summary.classification_reused = Boolean(classification);
          } else if (current.resume_stage ===
              WorkOsMessageStateRepository.RESUME_STAGES.CALENDAR) {
            // The Calendar checkpoint is durable. Do not fetch Gmail, invoke
            // AI, or rewrite Task business fields on this path.
            summary.classification_reused = Boolean(classification);
          } else {
            throw new WorkOsAppError(
              'E_MESSAGE_CHECKPOINT_CONFLICT',
              'MOCK_VERTICAL',
              false,
              'Phase 3/4で再開できないresume stageです。'
            );
          }

          current = WorkOsMessageStateRepository.getByMessageId(
            messageContext,
            selected.message_id
          );
          classificationProvenance =
            current.classification_provenance_json ||
            classificationProvenance;
          var actionResults = [];
          if (current.resume_stage ===
              WorkOsMessageStateRepository.RESUME_STAGES.TASK_WRITE) {
            phase3BudgetCheck(budget);
            actionResults = WorkOsTaskReviewPolicy.applyClassification(
              classification,
              {
                task_context: taskContext,
                preprocessed: preprocessed,
                ai_provenance: classificationProvenance
              }
            );
            actionResults.forEach(function (result) {
              if (result.operation === 'INSERT') {
                summary.created_task_count += 1;
              } else if (result.operation === 'UPDATE') {
                summary.updated_task_count += 1;
              }
              if (result.review_required === true) {
                summary.review_count += 1;
              }
            });
            WorkOsMessageStateRepository.checkpointTasksWrittenInContext(
              selected.message_id,
              runId,
              messageContext,
              clock()
            );
          }

          current = WorkOsMessageStateRepository.getByMessageId(
            messageContext,
            selected.message_id
          );
          if (current.resume_stage ===
                WorkOsMessageStateRepository.RESUME_STAGES.FINALIZE) {
            phase3BudgetCheck(budget);
            var threadTasks = WorkOsTaskRepository.findByStableThreadKey(
              taskContext,
              selected.stable_thread_key
            );
            var informationOnly = Boolean(
              classification && Array.isArray(classification.actions) &&
              classification.actions.length > 0 &&
              classification.actions.every(function (action) {
                return action && action.action_type === 'INFORMATION_ONLY';
              })
            );
            summary.gmail_called = true;
            gateway.syncAiLabels(
              selected.thread_id,
              WorkOsTaskReviewPolicy.computeAiLabels(threadTasks),
              {
                label_cache: settings.gmail_label_cache || null,
                call_meter: gmailCallMeter,
                budget: budget,
                reserve_ms: gmailBudgetReserve
              }
            );
            if (informationOnly) {
              WorkOsLogAndDeadLetter.resolveErrorsForMessage(
                selected.message_id,
                spreadsheet,
                clock(),
                errorContext
              );
              summary.gmail_called = true;
              gateway.setSystemFailureLabel(
                selected.thread_id,
                threadHasUnresolvedFailure(
                  messageContext,
                  selected.thread_id,
                  selected.message_id
                ) ||
                  WorkOsLogAndDeadLetter.hasUnresolvedThreadError(
                    selected.thread_id,
                    spreadsheet,
                    errorContext
                  ),
                {
                  label_cache: settings.gmail_label_cache || null,
                  call_meter: gmailCallMeter,
                  budget: budget,
                  reserve_ms: gmailBudgetReserve
                }
              );
              WorkOsMessageStateRepository.checkpointDoneInContext(
                selected.message_id,
                runId,
                messageContext,
                clock()
              );
              summary.checkpoint = 'DONE';
            } else {
              enqueueCalendarTasksInContext(
                threadTasks,
                taskContext,
                outboxContext,
                clock(),
                true,
                budget
              );
              WorkOsMessageStateRepository
                .checkpointCalendarPendingInContext(
                  selected.message_id,
                  runId,
                  messageContext,
                  clock()
                );
              var calendarClaim =
                WorkOsMessageStateRepository.claimForResumeInContext(
                  selected.message_id,
                  runId,
                  messageContext,
                  clock()
                );
              if (!calendarClaim.claimed) {
                throw new WorkOsAppError(
                  'E_MESSAGE_CLAIM_CONFLICT',
                  'CALENDAR_CHECKPOINT',
                  true,
                  'Calendar checkpointを再開できませんでした。'
                );
              }
              current = calendarClaim.record;
              summary.checkpoint = 'CALENDAR';
            }
          }

          current = WorkOsMessageStateRepository.getByMessageId(
            messageContext,
            selected.message_id
          );
          if (current.resume_stage ===
                WorkOsMessageStateRepository.RESUME_STAGES.CALENDAR) {
            phase3BudgetCheck(budget);
            var calendarTasks =
              WorkOsTaskRepository.findByStableThreadKey(
                taskContext,
                selected.stable_thread_key
              );
            var relatedTaskIds = calendarTasks.filter(function (task) {
              var taskId = String(task && task.task_id || '');
              if (!taskId) {
                return false;
              }
              /*
               * New Tasks requiring no Calendar action intentionally have no
               * Outbox row. Retain legacy/existing rows and every actionable
               * Task, but do not misclassify an omitted NOOP as corruption.
               */
              return Boolean(outboxContext.byTaskId[taskId]) ||
                WorkOsCalendarSync.initialDesiredActionForTask(
                  task,
                  WorkOsConfig.TIMEZONE
                ) !== 'NOOP';
            }).map(function (task) {
              return String(task.task_id);
            });
            var beforeCalendar = inspectRelatedOutbox(
              outboxContext,
              relatedTaskIds
            );
            if (beforeCalendar.missing_count) {
              throw new WorkOsAppError(
                'E_CALENDAR_OUTBOX_MISSING_TASK',
                'CALENDAR_SYNC',
                false,
                'Messageに対応するCalendar outboxがありません。'
              );
            }
            if (beforeCalendar.dead_count) {
              calendarFailureMetadata = beforeCalendar.first_dead;
              throw calendarFailureError({
                status: 'DEAD',
                error_code: beforeCalendar.first_dead.error_code
              });
            }

            var calendarAllowed =
              settings.calendar_jobs_remaining == null ||
              Number(settings.calendar_jobs_remaining) > 0;
            var calendarRun = relatedTaskIds.length && calendarAllowed
              ? processOneCalendarJobInContext({
                outbox_context: outboxContext,
                task_context: taskContext,
                task_ids: relatedTaskIds,
                now: clock(),
                budget: budget,
                gateway: settings.calendar_gateway,
                properties: settings.calendar_properties ||
                  settings.properties,
                instance_id: settings.instance_id
              })
              : {
                status: relatedTaskIds.length && !calendarAllowed
                  ? 'PAUSED'
                  : 'IDLE',
                processed_count: 0,
                result: null
              };
            summary.calendar_job_count += Number(
              calendarRun.processed_count || 0
            );
            summary.calendar_called =
              summary.calendar_job_count > 0;

            if (calendarRun.result &&
                (calendarRun.result.status === 'RETRY' ||
                 calendarRun.result.status === 'DEAD')) {
              calendarFailureMetadata = {
                task_id: calendarRun.selected_task_id,
                retry_count: calendarRun.result.retry_count,
                next_retry_at: calendarRun.result.next_retry_at || '',
                status: calendarRun.result.status,
                desired_action: calendarRun.result.action || ''
              };
              summary.processed_count = 1;
              throw calendarFailureError(calendarRun.result);
            }

            var afterCalendar = inspectRelatedOutbox(
              outboxContext,
              relatedTaskIds
            );
            if (afterCalendar.dead_count) {
              calendarFailureMetadata = afterCalendar.first_dead;
              throw calendarFailureError({
                status: 'DEAD',
                error_code: afterCalendar.first_dead.error_code
              });
            }
            if (calendarRun.status === 'PAUSED' ||
                afterCalendar.pending_count > 0) {
              WorkOsMessageStateRepository.pauseForBudgetInContext(
                selected.message_id,
                runId,
                messageContext,
                clock()
              );
              summary.run_status = 'PAUSED';
              summary.note = calendarRun.status === 'PAUSED'
                ? 'E_BUDGET_EXHAUSTED'
                : 'CALENDAR_JOB_LIMIT_REACHED';
              summary.checkpoint = 'CALENDAR';
            } else {
              WorkOsLogAndDeadLetter.resolveErrorsForMessage(
                selected.message_id,
                spreadsheet,
                clock(),
                errorContext
              );
              // SYS/失敗 belongs to the error subsystem and remains while any
              // other Message in this Thread has an unresolved error.
              summary.gmail_called = true;
              gateway.setSystemFailureLabel(
                selected.thread_id,
                threadHasUnresolvedFailure(
                  messageContext,
                  selected.thread_id,
                  selected.message_id
                ) ||
                  WorkOsLogAndDeadLetter.hasUnresolvedThreadError(
                    selected.thread_id,
                    spreadsheet,
                    errorContext
                  ),
                {
                  label_cache: settings.gmail_label_cache || null,
                  call_meter: gmailCallMeter,
                  budget: budget,
                  reserve_ms: gmailBudgetReserve
                }
              );
              WorkOsMessageStateRepository.checkpointDoneInContext(
                selected.message_id,
                runId,
                messageContext,
                clock()
              );
              summary.checkpoint = 'DONE';
            }
          }
          summary.processed_count = 1;
        } catch (error) {
          var safeFailure = WorkOsUtilities.safeError(
            error,
            'MOCK_VERTICAL'
          );
          if (isExecutionPauseCode(safeFailure.code)) {
            var budgetPause =
              WorkOsMessageStateRepository.pauseForBudgetInContext(
              selected.message_id,
              runId,
              messageContext,
              clock()
            );
            summary.run_status = 'PAUSED';
            summary.note = safeFailure.code;
            summary.checkpoint = budgetPause.record.resume_stage;
          } else {
            var failure =
              WorkOsMessageStateRepository.recordFailureInContext(
                selected.message_id,
                runId,
                error,
                messageContext,
                clock()
              );
            summary.error_count = 1;
            summary.run_status = 'FAILED';
            summary.note = failure.safe_error.code;
            summary.checkpoint = failure.record.resume_stage;
            if (/^AI_/.test(String(safeFailure.stage || ''))) {
              try {
                WorkOsLogAndDeadLetter.noteProviderFailure(
                  error,
                  settings.properties ||
                    PropertiesService.getScriptProperties(),
                  clock()
                );
              } catch (providerSuppressionError) {
                summary.note += ';E_PROVIDER_SUPPRESSION_WRITE';
              }
            }
            try {
              summary.gmail_called = true;
              gateway.setSystemFailureLabel(
                selected.thread_id,
                true,
                {
                  label_cache: settings.gmail_label_cache || null,
                  call_meter: gmailCallMeter,
                  budget: budget,
                  reserve_ms: gmailBudgetReserve
                }
              );
            } catch (failureLabelError) {
              summary.note += ';E_ERROR_LABEL_SYNC';
              try {
                WorkOsLogAndDeadLetter.recordOperationalError(
                  failureLabelError,
                  {
                    subsystem: 'GMAIL_LABEL',
                    fallback_stage: 'GMAIL_LABEL',
                    resume_stage:
                      WorkOsMessageStateRepository
                        .checkpointStageForResumeStage(
                          failure.record.resume_stage
                        ),
                    message_id: failure.record.message_id,
                    thread_id: failure.record.thread_id,
                    retry_count: failure.record.retry_count,
                    next_retry_at: failure.record.next_retry_at,
                    processing_status:
                      failure.record.processing_status
                  },
                  runId,
                  spreadsheet,
                  errorContext
                );
              } catch (labelErrorLogFailure) {
                summary.note += ';E_ERROR_LABEL_LOG_WRITE';
              }
            }
            try {
              if (calendarFailureMetadata ||
                  safeFailure.stage === 'CALENDAR_SYNC') {
                WorkOsLogAndDeadLetter.recordCalendarError(
                  error,
                  {
                    task_id: calendarFailureMetadata &&
                      calendarFailureMetadata.task_id || '',
                    message_id: failure.record.message_id,
                    thread_id: failure.record.thread_id,
                    retry_count: calendarFailureMetadata &&
                      calendarFailureMetadata.retry_count ||
                      failure.record.retry_count,
                    next_retry_at: calendarFailureMetadata &&
                      calendarFailureMetadata.next_retry_at ||
                      failure.record.next_retry_at,
                    status: calendarFailureMetadata &&
                      calendarFailureMetadata.status ||
                      failure.record.processing_status,
                    desired_action: calendarFailureMetadata &&
                      calendarFailureMetadata.desired_action || ''
                  },
                  runId,
                  spreadsheet,
                  errorContext
                );
              } else {
                WorkOsLogAndDeadLetter.recordMessageError(
                  error,
                  {
                    message_id: failure.record.message_id,
                    thread_id: failure.record.thread_id,
                    retry_count: failure.record.retry_count,
                    next_retry_at: failure.record.next_retry_at,
                    processing_status: failure.record.processing_status,
                    resume_stage:
                      WorkOsMessageStateRepository
                        .checkpointStageForResumeStage(
                          failure.record.resume_stage
                        )
                  },
                  runId,
                  spreadsheet,
                  errorContext
                );
              }
            } catch (errorLogFailure) {
              summary.note += ';E_ERROR_LOG_WRITE';
            }
          }
        }
      };
      if (settings.held_lock) {
        executeWithLock(settings.held_lock);
      } else {
        WorkOsUtilities.withScriptLock(
          executeWithLock,
          WorkOsConfig.LOCK_WAIT_MS
        );
      }
    } catch (error) {
      var safe = WorkOsUtilities.safeError(error, 'MOCK_VERTICAL');
      if (!isExecutionPauseCode(safe.code)) {
        summary.error_count += 1;
      }
      summary.run_status = isExecutionPauseCode(safe.code)
        ? 'PAUSED'
        : 'FAILED';
      summary.note = safe.code;
    }

    var finishedAt = clock();
    summary.finished_at = finishedAt;
    summary.duration_ms = Math.max(
      0,
      finishedAt.getTime() - startedAt.getTime()
    );
    summary.gmail_api_call_count =
      gmailCallMetric(gmailCallMeter, 'count');
    summary.gmail_api_call_limit =
      gmailCallMetric(gmailCallMeter, 'limit');
    var logRecorded = settings.skip_run_summary === true
      ? false
      : true;
    if (settings.skip_run_summary !== true) {
      try {
        WorkOsLogAndDeadLetter.appendRunSummary(summary, spreadsheet);
      } catch (logError) {
        logRecorded = false;
      }
    }
    return {
      run_id: runId,
      status: summary.run_status,
      note: summary.note,
      candidate_count: summary.candidate_count,
      processed_count: summary.processed_count,
      created_task_count: summary.created_task_count,
      updated_task_count: summary.updated_task_count,
      review_count: summary.review_count,
      error_count: summary.error_count,
      gmail_api_call_count: summary.gmail_api_call_count,
      gmail_api_call_limit: summary.gmail_api_call_limit,
      classification_reused: summary.classification_reused,
      checkpoint: summary.checkpoint,
      calendar_job_count: summary.calendar_job_count,
      duration_ms: summary.duration_ms,
      log_recorded: logRecorded,
      external_services: {
        gmail: summary.gmail_called
          ? 'ADVANCED_GMAIL_SERVICE'
          : 'NOT_CALLED',
        ai: summary.ai_called
          ? (adapterMetadata.provider === 'MOCK'
            ? 'MOCK_ONLY_NO_NETWORK'
            : 'EXTERNAL_ADAPTER')
          : 'NOT_CALLED_CHECKPOINT_REUSE',
        calendar: summary.calendar_called
          ? 'ADVANCED_CALENDAR_SERVICE'
          : (calendarModuleAvailable()
            ? 'OUTBOX_ONLY_NO_API'
            : 'NOT_CALLED')
      }
    };
  }

  function candidateFromMessageRecord(record, supplied) {
    if (supplied) {
      return supplied;
    }
    return {
      message_id: String(record.message_id || ''),
      thread_id: String(record.thread_id || ''),
      stable_thread_key: String(record.stable_thread_key || ''),
      received_at: record.received_at,
      source_mode: String(record.source_mode || 'AUTOMATIC'),
      manual_decision: String(record.manual_decision || 'PROCESS'),
      message_refs: []
    };
  }

  function processVerticalOnce(options) {
    var settings = options || {};
    var internalScheduled =
      settings.internal_scheduled_capability ===
        INTERNAL_SCHEDULED_CAPABILITY;
    var internalGeminiSynthetic =
      settings.internal_gemini_synthetic_capability ===
        INTERNAL_GEMINI_SYNTHETIC_CAPABILITY;
    if (Object.keys(settings).length &&
        !WorkOsConfig.TEST_MODE &&
        !internalScheduled) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        'MOCK_VERTICAL',
        false,
        'Workerへの依存注入はTest modeだけで利用できます。'
      );
    }
    var spreadsheet = boundSpreadsheet(settings);
    var gateway = settings.gateway || WorkOsGmailGateway;
    var preprocessor = settings.preprocessor || WorkOsEmailPreprocessor;
    var properties = workerProperties(settings);
    var adapter = WorkOsAiAdapter.createAdapter({
      adapter: settings.adapter,
      adapter_options: settings.adapter_options || {},
      mode: settings.adapter_mode || ''
    });
    if (adapter && typeof adapter.healthCheck === 'function') {
      var adapterHealth = adapter.healthCheck();
      if (!adapterHealth || adapterHealth.status !== 'READY') {
        throw new WorkOsAppError(
          String(adapterHealth && adapterHealth.code ||
            'E_AI_NOT_CONFIGURED'),
          'AI_CONFIG',
          false,
          'AI Adapterのlocal設定が完了していません。'
        );
      }
    }
    var adapterMetadata = WorkOsAiAdapter.getMetadata(adapter);
    if (adapterMetadata.provider !== 'MOCK') {
      var isNetworkFreeExternalTest =
        WorkOsConfig.TEST_MODE &&
        adapter instanceof WorkOsAiAdapter.ExternalAiAdapter &&
        adapter.settings &&
        adapter.settings.transport instanceof
          WorkOsAiAdapter.MockHttpTransport;
      isNetworkFreeExternalTest = isNetworkFreeExternalTest ||
        (internalScheduled &&
         !(adapter instanceof WorkOsAiAdapter.ExternalAiAdapter));
      if (!isNetworkFreeExternalTest && !internalScheduled &&
          !internalGeminiSynthetic) {
        throw new WorkOsAppError(
          'E_AI_EXTERNAL_WORKER_DISABLED',
          'AI_CONFIG',
          false,
          '実Provider Workerは会社承認とLock分離設計が完了するまで無効です。'
        );
      }
    }
    var clock = typeof settings.now === 'function'
      ? settings.now
      : function () { return WorkOsUtilities.now(); };
    var budget = settings.budget || WorkOsUtilities.createSoftBudget(
      internalScheduled
        ? WorkOsConfig.AUTOMATION_WORKER_SOFT_LIMIT_MS
        : WorkOsConfig.MANUAL_WORKER_SOFT_LIMIT_MS,
      Date.now()
    );
    var reserveMs = internalScheduled
      ? WorkOsConfig.AUTOMATION_WORKER_RESERVE_MS
      : WorkOsConfig.MANUAL_WORKER_RESERVE_MS;
    var callMeter = createGmailCallMeter(
      gateway,
      internalScheduled
        ? WorkOsConfig.AUTOMATION_GMAIL_API_CALL_LIMIT
        : WorkOsConfig.MANUAL_GMAIL_API_CALL_LIMIT,
      settings.gmail_call_meter
    );
    var startedAt = clock();
    var runId = String(settings.run_id || WorkOsUtilities.makeId('run_'));
    var summary = {
      run_id: runId,
      mode: adapterMetadata.provider === 'MOCK'
        ? 'MOCK_PHASE3'
        : 'AI_PHASE5',
      started_at: startedAt,
      candidate_count: 0,
      processed_count: 0,
      skipped_count: 0,
      error_count: 0,
      created_task_count: 0,
      updated_task_count: 0,
      review_count: 0,
      run_status: 'COMPLETE',
      note: 'Lock-free external vertical',
      classification_reused: false,
      checkpoint: '',
      calendar_called: false,
      calendar_job_count: 0,
      gmail_called: false,
      ai_called: false,
      safe_error_code: '',
      safe_error_stage: '',
      provider_http_status: null,
      provider_error_code: '',
      provider_interaction_status: '',
      canonical_schema_rule: '',
      failure_finalization: 'NOT_APPLICABLE',
      failure_finalization_code: ''
    };
    var workerLease = settings.worker_lease || null;
    var ownsWorkerLease = !workerLease;
    var cachedPreprocessed = settings.preprocessed_result || null;
    var selectedMessageId = String(settings.selected_message_id || '');
    var selectedThreadId = '';
    var selectedStableThreadKey = '';
    var calendarFailureMetadata = null;
    var errorContext = settings.error_context || null;
    var messageSheet = WorkOsMessageStateRepository.messageSheet(
      spreadsheet
    );

    function getErrorContext() {
      if (!errorContext) {
        errorContext = WorkOsLogAndDeadLetter.createErrorContext(
          spreadsheet
        );
      }
      return errorContext;
    }

    function copySafeDiagnostic(safe) {
      var diagnostic = safe && safe.diagnostic;
      if (!diagnostic) {
        return;
      }
      if (Number.isInteger(diagnostic.provider_http_status)) {
        summary.provider_http_status = diagnostic.provider_http_status;
      }
      if (diagnostic.provider_error_code) {
        summary.provider_error_code = String(
          diagnostic.provider_error_code
        );
      }
      if (diagnostic.provider_interaction_status) {
        summary.provider_interaction_status = String(
          diagnostic.provider_interaction_status
        );
      }
      if (diagnostic.canonical_schema_rule) {
        summary.canonical_schema_rule =
          WorkOsUtilities.safeCanonicalSchemaRule(
            diagnostic.canonical_schema_rule
          );
      }
    }

    function failureFinalizationPending() {
      summary.failure_finalization = 'PENDING';
      summary.failure_finalization_code = 'E_MESSAGE_FAILURE_CHECKPOINT_PENDING';
      summary.checkpoint = 'FAILURE_FINALIZATION';
    }

    function finalizeMessageFailure(error, safe) {
      if (!selectedMessageId) {
        summary.failure_finalization = 'NOT_APPLICABLE';
        return null;
      }
      var result = WorkOsUtilities.withScriptLock(function (lock) {
        var messages =
          WorkOsMessageStateRepository.createContextForHeldLock(
            messageSheet,
            lock
          );
        var current = WorkOsMessageStateRepository.getByMessageId(
          messages,
          selectedMessageId
        );
        if (!current ||
            current.processing_status !==
              WorkOsMessageStateRepository.STATUSES.CLAIMED ||
            current.claim_run_id !== runId) {
          throw new WorkOsAppError(
            'E_MESSAGE_FAILURE_CHECKPOINT_CONFLICT',
            'FINALIZE',
            false,
            'Message failure checkpoint ownership is not current.'
          );
        }
        var failure = isExecutionPauseCode(safe.code)
          ? WorkOsMessageStateRepository.pauseForBudgetInContext(
            selectedMessageId,
            runId,
            messages,
            clock()
          )
          : WorkOsMessageStateRepository.recordFailureInContext(
            selectedMessageId,
            runId,
            error,
            messages,
            clock()
          );
        if (!failure || !failure.record) {
          throw new WorkOsAppError(
            'E_MESSAGE_FAILURE_CHECKPOINT_CONFLICT',
            'FINALIZE',
            false,
            'Message failure checkpoint was not recorded.'
          );
        }
        return failure;
      }, WorkOsConfig.LOCK_WAIT_MS);
      summary.failure_finalization = 'RECORDED';
      summary.failure_finalization_code = '';
      summary.checkpoint = result.record.resume_stage;
      return result.record;
    }

    function freshContexts(lock) {
      var taskSheet = spreadsheet.getSheetByName(
        WorkOsConfig.SHEETS.TASKS
      );
      return {
        messages:
          WorkOsMessageStateRepository.createContextForHeldLock(
            messageSheet,
            lock
          ),
        tasks: WorkOsTaskRepository.createContextForHeldLock(
          taskSheet,
          lock
        ),
        outbox: WorkOsCalendarSync.createOutboxContextForHeldLock(
          calendarOutboxSheet(spreadsheet),
          lock
        )
      };
    }

    function prepareStage() {
      return WorkOsUtilities.withScriptLock(function (lock) {
        var contexts = freshContexts(lock);
        var record = selectedMessageId
          ? WorkOsMessageStateRepository.getByMessageId(
            contexts.messages,
            selectedMessageId
          )
          : null;
        if (internalGeminiSynthetic && !selectedMessageId) {
          throw new WorkOsAppError(
            'E_GEMINI_SYNTHETIC_CANDIDATE_CONFLICT',
            'GMAIL',
            false,
            'Gemini synthetic candidate was not pinned.'
          );
        }
        if (!record) {
          if (!internalGeminiSynthetic) {
            var eligible = eligiblePhase3Records(
              contexts.messages,
              clock()
            );
            record = eligible.length ? eligible[0] : null;
          }
        }
        if (!record && settings.candidate) {
          record = WorkOsMessageStateRepository.discoverInContext(
            settings.candidate,
            contexts.messages,
            clock()
          ).record;
        }
        if (internalGeminiSynthetic && record &&
            String(record.message_id || '') !== selectedMessageId) {
          throw new WorkOsAppError(
            'E_GEMINI_SYNTHETIC_CANDIDATE_CONFLICT',
            'GMAIL',
            false,
            'Gemini synthetic candidate identity changed.'
          );
        }
        if (!record) {
          return { stage: 'IDLE' };
        }
        selectedMessageId = String(record.message_id);
        selectedThreadId = String(record.thread_id || '');
        selectedStableThreadKey = String(
          record.stable_thread_key || ''
        );
        var owned = record.processing_status ===
            WorkOsMessageStateRepository.STATUSES.CLAIMED &&
          record.claim_run_id === runId;
        if (internalGeminiSynthetic && !owned &&
            record.processing_status !==
              WorkOsMessageStateRepository.STATUSES.DISCOVERED &&
            record.processing_status !==
              WorkOsMessageStateRepository.STATUSES.PREPROCESSED &&
            record.processing_status !==
              WorkOsMessageStateRepository.STATUSES.CLASSIFIED &&
            record.processing_status !==
              WorkOsMessageStateRepository.STATUSES.TASKS_WRITTEN &&
            record.processing_status !==
              WorkOsMessageStateRepository.STATUSES.CALENDAR_PENDING) {
          throw new WorkOsAppError(
            'E_GEMINI_SYNTHETIC_CANDIDATE_CONFLICT',
            'GMAIL',
            false,
            'Gemini synthetic candidate is not fresh and resumable.'
          );
        }
        if (!owned) {
          var claim;
          if (record.resume_stage ===
              WorkOsMessageStateRepository.RESUME_STAGES.PREPROCESS) {
            claim = WorkOsMessageStateRepository.claimInContext(
              candidateFromMessageRecord(record, settings.candidate),
              runId,
              contexts.messages,
              clock()
            );
          } else {
            claim =
              WorkOsMessageStateRepository.claimForResumeInContext(
                record.message_id,
                runId,
                contexts.messages,
                clock()
              );
          }
          if (!claim.claimed) {
            return {
              stage: 'SKIPPED',
              reason: claim.reason
            };
          }
          record = claim.record;
        }
        var activeTasks = activeTasksForThread(
          contexts.tasks,
          record.stable_thread_key
        );
        if (record.resume_stage ===
            WorkOsMessageStateRepository.RESUME_STAGES.PREPROCESS) {
          return {
            stage: 'PREPROCESS',
            record: record,
            active_tasks: activeTasks,
            lease:
              WorkOsMessageStateRepository
                .createPreprocessLeaseInContext(
                  record.message_id,
                  runId,
                  contexts.messages
                )
          };
        }
        if (record.resume_stage ===
            WorkOsMessageStateRepository.RESUME_STAGES.CLASSIFY) {
          return {
            stage: 'CLASSIFY',
            record: record,
            active_tasks: activeTasks,
            lease:
              WorkOsMessageStateRepository
                .createClassificationLeaseInContext(
                  record.message_id,
                  runId,
                  contexts.messages,
                  taskVersionSnapshot(activeTasks)
                )
          };
        }
        if (record.resume_stage ===
            WorkOsMessageStateRepository.RESUME_STAGES.TASK_WRITE) {
          return {
            stage: 'TASK_WRITE',
            record: record,
            active_tasks: activeTasks
          };
        }
        if (record.resume_stage ===
            WorkOsMessageStateRepository.RESUME_STAGES.FINALIZE) {
          return {
            stage: 'FINALIZE',
            record: record,
            thread_tasks: WorkOsTaskRepository.findByStableThreadKey(
              contexts.tasks,
              record.stable_thread_key
            ),
            task_versions: taskVersionSnapshot(
              WorkOsTaskRepository.findByStableThreadKey(
                contexts.tasks,
                record.stable_thread_key
              )
            ),
            lease:
              WorkOsMessageStateRepository
                .createFinalizeLeaseInContext(
                  record.message_id,
                  runId,
                  contexts.messages
                )
          };
        }
        if (record.resume_stage ===
            WorkOsMessageStateRepository.RESUME_STAGES.CALENDAR) {
          var threadTasks =
            WorkOsTaskRepository.findByStableThreadKey(
              contexts.tasks,
              record.stable_thread_key
            );
          var relatedTaskIds = threadTasks.filter(function (task) {
            var taskId = String(task && task.task_id || '');
            return taskId &&
              (contexts.outbox.byTaskId[taskId] ||
               WorkOsCalendarSync.initialDesiredActionForTask(
                 task,
                 WorkOsConfig.TIMEZONE
               ) !== 'NOOP');
          }).map(function (task) {
            return String(task.task_id);
          });
          return {
            stage: 'CALENDAR',
            record: record,
            related_task_ids: relatedTaskIds,
            outbox_state: inspectRelatedOutbox(
              contexts.outbox,
              relatedTaskIds
            ),
            message_updated_at_ms:
              new Date(record.updated_at).getTime()
          };
        }
        throw new WorkOsAppError(
          'E_MESSAGE_CHECKPOINT_CONFLICT',
          'MOCK_VERTICAL',
          false,
          '再開できないMessage checkpointです。'
        );
      }, WorkOsConfig.LOCK_WAIT_MS);
    }

    function loadPreprocessed(stagePlan) {
      if (cachedPreprocessed) {
        return cachedPreprocessed;
      }
      phase3BudgetCheck(budget);
      summary.gmail_called = true;
      var messageInput = settings.candidate &&
        stagePlan.stage === 'PREPROCESS'
        ? gateway.fetchSelectedContent(
          settings.candidate,
          {
            call_meter: callMeter,
            budget: budget,
            reserve_ms: reserveMs
          }
        )
        : gateway.refetchMessageContent(
          stagePlan.record,
          {
            call_meter: callMeter,
            budget: budget,
            reserve_ms: reserveMs
          }
        );
      if (internalScheduled && WorkOsConfig.TEST_MODE !== true &&
          isAutomationQualificationRecord(
            settings.candidate || stagePlan.record
          )) {
        assertAutomationQualificationContent(
          settings.candidate || stagePlan.record,
          messageInput
        );
      }
      cachedPreprocessed = preprocessor.preprocess(messageInput, {
        today: formatToday(clock()),
        timezone: WorkOsConfig.TIMEZONE,
        activeTaskProvider: function () {
          return (stagePlan.active_tasks || []).slice();
        }
      });
      return cachedPreprocessed;
    }

    try {
      if (ownsWorkerLease) {
        workerLease = acquireWorkerLease(
          properties,
          runId,
          summary.mode,
          clock,
          internalScheduled
            ? WorkOsConfig.AUTOMATION_WORKER_SOFT_LIMIT_MS
            : WorkOsConfig.MANUAL_WORKER_SOFT_LIMIT_MS
        );
      }
      if (!workerLease || !workerLease.acquired) {
        summary.run_status = 'BUSY';
        summary.note = 'WORKER_LEASE_ACTIVE';
      } else {
        var completed = false;
        for (var stageCount = 0;
            stageCount < 8 && !completed;
            stageCount += 1) {
          phase3BudgetCheck(budget);
          var plan = prepareStage();
          if (plan.stage === 'IDLE') {
            completed = true;
            break;
          }
          if (plan.stage === 'SKIPPED') {
            summary.skipped_count += 1;
            completed = true;
            break;
          }
          summary.candidate_count = 1;
          if (plan.record && plan.record.classification_json &&
              plan.stage !== 'PREPROCESS' &&
              plan.stage !== 'CLASSIFY') {
            summary.classification_reused = true;
          }
          if (plan.stage === 'PREPROCESS') {
            var preprocessResult = loadPreprocessed(plan);
            WorkOsUtilities.withScriptLock(function (lock) {
              var contexts = freshContexts(lock);
              WorkOsMessageStateRepository
                .commitPreprocessedLeaseInContext(
                  plan.lease,
                  preprocessResult.content_hash,
                  contexts.messages,
                  clock()
                );
            }, WorkOsConfig.LOCK_WAIT_MS);
            continue;
          }
          if (plan.stage === 'CLASSIFY') {
            var preprocessed = loadPreprocessed(plan);
            if (preprocessed.content_hash !==
                plan.lease.preprocess_hash) {
              throw new WorkOsAppError(
                'E_PREPROCESS_HASH_CONFLICT',
                'AI_INPUT',
                false,
                '再取得した本文hashがcheckpointと一致しません。'
              );
            }
            var input = WorkOsAiAdapter.buildInput(preprocessed);
            var inputHash = WorkOsUtilities.sha256Hex(
              JSON.stringify(input)
            );
            plan.lease =
              WorkOsMessageStateRepository
                .attachClassificationInputHash(
                  plan.lease,
                  inputHash
                );
            summary.ai_called = true;
            var classification = adapter.classify(input, {
              remaining_ms:
                typeof budget.remainingMs === 'function'
                  ? budget.remainingMs()
                  : WorkOsConfig.AI_REQUEST_TIMEOUT_MS + reserveMs,
              reserve_ms: reserveMs
            });
            WorkOsAiAdapter.validateOutput(classification);
            WorkOsUtilities.withScriptLock(function (lock) {
              var contexts = freshContexts(lock);
              var current =
                WorkOsMessageStateRepository.getByMessageId(
                  contexts.messages,
                  plan.lease.message_id
                );
              var currentTasks = current
                ? activeTasksForThread(
                  contexts.tasks,
                  current.stable_thread_key
                )
                : [];
              WorkOsMessageStateRepository
                .commitClassificationLeaseInContext(
                  plan.lease,
                  classification,
                  adapterMetadata,
                  contexts.messages,
                  taskVersionSnapshot(currentTasks),
                  inputHash,
                  clock()
                );
            }, WorkOsConfig.LOCK_WAIT_MS);
            try {
              WorkOsUtilities.withScriptLock(function () {
                WorkOsLogAndDeadLetter.noteProviderSuccess(
                  properties,
                  clock(),
                  {
                    provider_key: adapterMetadata.provider,
                    run_id: runId,
                    message_id: selectedMessageId
                  }
                );
              }, WorkOsConfig.LOCK_WAIT_MS);
            } catch (providerSuccessError) {
              summary.note += ';PROVIDER_SUCCESS_ACCOUNTING_PENDING';
            }
            continue;
          }
          if (plan.stage === 'TASK_WRITE') {
            var taskInput = loadPreprocessed(plan);
            WorkOsUtilities.withScriptLock(function (lock) {
              var contexts = freshContexts(lock);
              var current =
                WorkOsMessageStateRepository.getByMessageId(
                  contexts.messages,
                  selectedMessageId
                );
              if (!current ||
                  current.processing_status !==
                    WorkOsMessageStateRepository.STATUSES.CLAIMED ||
                  current.claim_run_id !== runId ||
                  current.resume_stage !==
                    WorkOsMessageStateRepository.RESUME_STAGES.TASK_WRITE) {
                throw new WorkOsAppError(
                  'E_MESSAGE_CLAIM_CONFLICT',
                  'TASK_WRITE',
                  true,
                  'Task write ownershipが変更されました。'
                );
              }
              WorkOsAiAdapter.validateOutput(
                current.classification_json
              );
              var actionResults =
                WorkOsTaskReviewPolicy.applyClassification(
                  current.classification_json,
                  {
                    task_context: contexts.tasks,
                    preprocessed: taskInput,
                    ai_provenance:
                      current.classification_provenance_json ||
                        adapterMetadata
                  }
                );
              actionResults.forEach(function (result) {
                if (result.operation === 'INSERT') {
                  summary.created_task_count += 1;
                } else if (result.operation === 'UPDATE') {
                  summary.updated_task_count += 1;
                }
                if (result.review_required === true) {
                  summary.review_count += 1;
                }
              });
              WorkOsMessageStateRepository
                .checkpointTasksWrittenInContext(
                  selectedMessageId,
                  runId,
                  contexts.messages,
                  clock()
                );
            }, WorkOsConfig.LOCK_WAIT_MS);
            continue;
          }
          if (plan.stage === 'FINALIZE') {
            phase3BudgetCheck(budget);
            var informationOnly = Boolean(
              plan.record && plan.record.classification_json &&
              Array.isArray(plan.record.classification_json.actions) &&
              plan.record.classification_json.actions.length > 0 &&
              plan.record.classification_json.actions.every(
                function (action) {
                  return action && action.action_type === 'INFORMATION_ONLY';
                }
              )
            );
            summary.gmail_called = true;
            gateway.syncAiLabels(
              selectedThreadId,
              WorkOsTaskReviewPolicy.computeAiLabels(
                plan.thread_tasks
              ),
              {
                label_cache: settings.gmail_label_cache || null,
                call_meter: callMeter,
                budget: budget,
                reserve_ms: reserveMs
              }
            );
            WorkOsUtilities.withScriptLock(function (lock) {
              var contexts = freshContexts(lock);
              WorkOsMessageStateRepository
                .commitFinalizeLeaseInContext(
                  plan.lease,
                  contexts.messages
                );
              if (!informationOnly) {
                var currentTasks =
                  WorkOsTaskRepository.findByStableThreadKey(
                    contexts.tasks,
                    selectedStableThreadKey
                  );
                if (JSON.stringify(taskVersionSnapshot(currentTasks)) !==
                    JSON.stringify(plan.task_versions)) {
                  throw new WorkOsAppError(
                    'E_FINALIZE_STALE_RESULT',
                    'FINALIZE',
                    true,
                    'Gmail label同期中にTask versionが変更されました。'
                  );
                }
                enqueueCalendarTasksInContext(
                  currentTasks,
                  contexts.tasks,
                  contexts.outbox,
                  clock(),
                  true,
                  budget
                );
                WorkOsMessageStateRepository
                  .checkpointCalendarPendingInContext(
                    selectedMessageId,
                    runId,
                    contexts.messages,
                    clock()
                  );
                var calendarClaim =
                  WorkOsMessageStateRepository.claimForResumeInContext(
                    selectedMessageId,
                    runId,
                    contexts.messages,
                    clock()
                  );
                if (!calendarClaim.claimed) {
                  throw new WorkOsAppError(
                    'E_MESSAGE_CLAIM_CONFLICT',
                    'CALENDAR_CHECKPOINT',
                    true,
                    'Calendar checkpoint ownershipが変更されました。'
                  );
                }
              }
            }, WorkOsConfig.LOCK_WAIT_MS);
            if (informationOnly) {
              var failureLabelEnabled = WorkOsUtilities.withScriptLock(
                function (lock) {
                  var contexts = freshContexts(lock);
                  WorkOsLogAndDeadLetter.resolveErrorsForMessage(
                    selectedMessageId,
                    spreadsheet,
                    clock(),
                    getErrorContext()
                  );
                  return threadHasUnresolvedFailure(
                    contexts.messages,
                    selectedThreadId,
                    selectedMessageId
                  ) || WorkOsLogAndDeadLetter.hasUnresolvedThreadError(
                    selectedThreadId,
                    spreadsheet,
                    getErrorContext()
                  );
                },
                WorkOsConfig.LOCK_WAIT_MS
              );
              gateway.setSystemFailureLabel(
                selectedThreadId,
                failureLabelEnabled,
                {
                  label_cache: settings.gmail_label_cache || null,
                  call_meter: callMeter,
                  budget: budget,
                  reserve_ms: reserveMs
                }
              );
              WorkOsUtilities.withScriptLock(function (lock) {
                var contexts = freshContexts(lock);
                WorkOsMessageStateRepository.checkpointDoneInContext(
                  selectedMessageId,
                  runId,
                  contexts.messages,
                  clock()
                );
              }, WorkOsConfig.LOCK_WAIT_MS);
              summary.checkpoint = 'DONE';
              summary.processed_count = 1;
              completed = true;
              continue;
            }
            continue;
          }
          if (plan.stage === 'CALENDAR') {
            if (plan.outbox_state.missing_count) {
              throw new WorkOsAppError(
                'E_CALENDAR_OUTBOX_MISSING_TASK',
                'CALENDAR_SYNC',
                false,
                'Messageに対応するCalendar outboxがありません。'
              );
            }
            if (plan.outbox_state.dead_count) {
              calendarFailureMetadata =
                plan.outbox_state.first_dead;
              throw calendarFailureError({
                status: 'DEAD',
                error_code:
                  plan.outbox_state.first_dead.error_code
              });
            }
            if (plan.related_task_ids.length &&
                (settings.calendar_jobs_remaining == null ||
                 Number(settings.calendar_jobs_remaining) > 0)) {
              var calendarRun =
                WorkOsCalendarSync.processNextJob({
                  spreadsheet: spreadsheet,
                  sheet: calendarOutboxSheet(spreadsheet),
                  gateway: settings.calendar_gateway,
                  properties: settings.calendar_properties ||
                    properties,
                  instance_id: settings.instance_id,
                  timezone: WorkOsConfig.TIMEZONE,
                  now: clock(),
                  budget: budget,
                  reserve_ms: reserveMs,
                  allowed_task_ids: plan.related_task_ids,
                  task_reader_in_context: function (taskId, lock) {
                    var taskContext =
                      WorkOsTaskRepository.createContextForHeldLock(
                        spreadsheet.getSheetByName(
                          WorkOsConfig.SHEETS.TASKS
                        ),
                        lock
                      );
                    return WorkOsTaskRepository.findByTaskId(
                      taskContext,
                      taskId
                    );
                  },
                  task_writer_in_context: function (
                    taskId,
                    patch,
                    expectedRowVersion,
                    lock
                  ) {
                    var taskContext =
                      WorkOsTaskRepository.createContextForHeldLock(
                        spreadsheet.getSheetByName(
                          WorkOsConfig.SHEETS.TASKS
                        ),
                        lock
                      );
                    var task = WorkOsTaskRepository.findByTaskId(
                      taskContext,
                      taskId
                    );
                    if (expectedRowVersion != null &&
                        Number(task && task.row_version) !==
                          Number(expectedRowVersion)) {
                      throw new WorkOsAppError(
                        'E_CALENDAR_JOB_CAS_CONFLICT',
                        'CALENDAR_SYNC',
                        true,
                        'Calendar Task CAS conflictです。'
                      );
                    }
                    return WorkOsTaskRepository.applyCalendarPatch(
                      taskId,
                      patch,
                      taskContext,
                      clock()
                    );
                  },
                  task_reader: function (taskId) {
                    return WorkOsUtilities.withScriptLock(
                      function (lock) {
                        var contexts = freshContexts(lock);
                        return WorkOsTaskRepository.findByTaskId(
                          contexts.tasks,
                          taskId
                        );
                      },
                      WorkOsConfig.LOCK_WAIT_MS
                    );
                  },
                  task_writer: function (
                    taskId,
                    patch,
                    expectedRowVersion
                  ) {
                    return WorkOsUtilities.withScriptLock(
                      function (lock) {
                        var contexts = freshContexts(lock);
                        var task =
                          WorkOsTaskRepository.findByTaskId(
                            contexts.tasks,
                            taskId
                          );
                        if (expectedRowVersion != null &&
                            Number(task && task.row_version) !==
                              Number(expectedRowVersion)) {
                          throw new WorkOsAppError(
                            'E_CALENDAR_JOB_CAS_CONFLICT',
                            'CALENDAR_SYNC',
                            true,
                            'Calendar Task CAS conflictです。'
                          );
                        }
                        return WorkOsTaskRepository
                          .applyCalendarPatch(
                            taskId,
                            patch,
                            contexts.tasks,
                            clock()
                          );
                      },
                      WorkOsConfig.LOCK_WAIT_MS
                    );
                  }
                });
              summary.calendar_job_count += Number(
                calendarRun.processed_count || 0
              );
              summary.calendar_called =
                summary.calendar_job_count > 0 ||
                calendarRun.external_io_performed === true;
              if (calendarRun.result &&
                  calendarRun.result.status === 'CONFLICT') {
                summary.note = calendarRun.recovery_scheduled
                  ? 'E_CALENDAR_CAS_CONFLICT_REQUEUED'
                  : 'E_CALENDAR_CAS_CONFLICT_REVIEW_REQUIRED';
                if (!calendarRun.recovery_scheduled) {
                  throw calendarFailureError(
                    calendarRun.result
                  );
                }
              }
              if (calendarRun.result &&
                  (calendarRun.result.status === 'RETRY' ||
                   calendarRun.result.status === 'DEAD')) {
                calendarFailureMetadata = {
                  task_id: calendarRun.selected_task_id || '',
                  retry_count:
                    calendarRun.result.retry_count || 0,
                  next_retry_at:
                    calendarRun.result.next_retry_at || '',
                  status: calendarRun.result.status,
                  desired_action:
                    calendarRun.result.action || ''
                };
                throw calendarFailureError(calendarRun.result);
              }
            }
            var finalPlan = WorkOsUtilities.withScriptLock(
              function (lock) {
                var contexts = freshContexts(lock);
                var current =
                  WorkOsMessageStateRepository.getByMessageId(
                    contexts.messages,
                    selectedMessageId
                  );
                var outboxState = inspectRelatedOutbox(
                  contexts.outbox,
                  plan.related_task_ids
                );
                if (!current ||
                    current.processing_status !==
                      WorkOsMessageStateRepository.STATUSES.CLAIMED ||
                    current.claim_run_id !== runId ||
                    current.resume_stage !==
                      WorkOsMessageStateRepository.RESUME_STAGES.CALENDAR) {
                  throw new WorkOsAppError(
                    'E_MESSAGE_CLAIM_CONFLICT',
                    'CALENDAR_SYNC',
                    true,
                    'Calendar completion ownershipが変更されました。'
                  );
                }
                if (outboxState.dead_count) {
                  throw calendarFailureError({
                    status: 'DEAD',
                    error_code:
                      outboxState.first_dead.error_code
                  });
                }
                if (outboxState.pending_count) {
                  WorkOsMessageStateRepository
                    .pauseForBudgetInContext(
                      selectedMessageId,
                      runId,
                      contexts.messages,
                      clock()
                    );
                  return { pending: true };
                }
                return {
                  pending: false,
                  message_updated_at_ms:
                    new Date(current.updated_at).getTime(),
                  failure_label_enabled:
                    threadHasUnresolvedFailure(
                      contexts.messages,
                      selectedThreadId,
                      selectedMessageId
                    )
                };
              },
              WorkOsConfig.LOCK_WAIT_MS
            );
            if (finalPlan.pending) {
              summary.run_status = 'PAUSED';
              summary.note = 'CALENDAR_JOB_PENDING';
              summary.checkpoint = 'CALENDAR';
              completed = true;
              continue;
            }
            summary.gmail_called = true;
            gateway.setSystemFailureLabel(
              selectedThreadId,
              finalPlan.failure_label_enabled,
              {
                label_cache: settings.gmail_label_cache || null,
                call_meter: callMeter,
                budget: budget,
                reserve_ms: reserveMs
              }
            );
            WorkOsUtilities.withScriptLock(function (lock) {
              var contexts = freshContexts(lock);
              var current =
                WorkOsMessageStateRepository.getByMessageId(
                  contexts.messages,
                  selectedMessageId
                );
              if (!current ||
                  current.processing_status !==
                    WorkOsMessageStateRepository.STATUSES.CLAIMED ||
                  current.claim_run_id !== runId ||
                  current.resume_stage !==
                    WorkOsMessageStateRepository.RESUME_STAGES.CALENDAR ||
                  new Date(current.updated_at).getTime() !==
                    finalPlan.message_updated_at_ms) {
                throw new WorkOsAppError(
                  'E_FINALIZE_STALE_RESULT',
                  'FINALIZE',
                  true,
                  'Gmail failure label同期中にownershipが変更されました。'
                );
              }
              WorkOsLogAndDeadLetter.resolveErrorsForMessage(
                selectedMessageId,
                spreadsheet,
                clock(),
                getErrorContext()
              );
              WorkOsMessageStateRepository.checkpointDoneInContext(
                selectedMessageId,
                runId,
                contexts.messages,
                clock()
              );
            }, WorkOsConfig.LOCK_WAIT_MS);
            summary.checkpoint = 'DONE';
            summary.processed_count = 1;
            completed = true;
          }
        }
      }
    } catch (error) {
      var safe = WorkOsUtilities.safeError(error, 'MOCK_VERTICAL');
      summary.run_status = isExecutionPauseCode(safe.code)
        ? 'PAUSED'
        : 'FAILED';
      summary.note = safe.code;
      summary.safe_error_code = safe.code;
      summary.safe_error_stage = safe.stage;
      copySafeDiagnostic(safe);
      if (!isExecutionPauseCode(safe.code)) {
        summary.error_count += 1;
      }
      var failureRecord = null;
      try {
        failureRecord = finalizeMessageFailure(error, safe);
      } catch (failureFinalizeError) {
        failureFinalizationPending();
      }
      if (/^AI_/.test(String(safe.stage || ''))) {
        try {
          WorkOsUtilities.withScriptLock(function () {
            WorkOsLogAndDeadLetter.noteProviderFailure(
              error,
              properties,
              clock(),
              {
                provider_key: adapterMetadata.provider,
                run_id: runId,
                message_id: selectedMessageId
              }
            );
          }, WorkOsConfig.LOCK_WAIT_MS);
        } catch (providerError) {
          summary.note += ';PROVIDER_ACCOUNTING_PENDING';
        }
      }
      if (selectedThreadId && !isExecutionPauseCode(safe.code)) {
        try {
          summary.gmail_called = true;
          gateway.setSystemFailureLabel(
            selectedThreadId,
            true,
            {
              label_cache: settings.gmail_label_cache || null,
              call_meter: callMeter,
              budget: budget,
              reserve_ms: reserveMs
            }
          );
        } catch (labelError) {
          summary.note += ';E_ERROR_LABEL_SYNC';
          try {
            WorkOsLogAndDeadLetter.recordOperationalError(
              labelError,
              {
                subsystem: 'GMAIL_LABEL',
                fallback_stage: 'GMAIL_LABEL',
                resume_stage: failureRecord
                  ? WorkOsMessageStateRepository
                    .checkpointStageForResumeStage(
                      failureRecord.resume_stage
                    )
                  : String(safe.stage || 'FINALIZE'),
                message_id: failureRecord
                  ? failureRecord.message_id
                  : selectedMessageId,
                thread_id: failureRecord
                  ? failureRecord.thread_id
                  : selectedThreadId,
                retry_count: failureRecord
                  ? failureRecord.retry_count
                  : 0,
                next_retry_at: failureRecord
                  ? failureRecord.next_retry_at
                  : '',
                processing_status: failureRecord
                  ? failureRecord.processing_status
                  : 'RETRY'
              },
              runId,
              spreadsheet,
              getErrorContext()
            );
          } catch (labelErrorLogFailure) {
            summary.note += ';E_ERROR_LABEL_LOG_WRITE';
          }
        }
      }
      if (failureRecord) {
        try {
          if (calendarFailureMetadata ||
              safe.stage === 'CALENDAR_SYNC') {
            WorkOsLogAndDeadLetter.recordCalendarError(
              error,
              {
                task_id: calendarFailureMetadata &&
                  calendarFailureMetadata.task_id || '',
                message_id: failureRecord.message_id,
                thread_id: failureRecord.thread_id,
                retry_count: calendarFailureMetadata &&
                  calendarFailureMetadata.retry_count ||
                  failureRecord.retry_count,
                next_retry_at: calendarFailureMetadata &&
                  calendarFailureMetadata.next_retry_at ||
                  failureRecord.next_retry_at,
                status: calendarFailureMetadata &&
                  calendarFailureMetadata.status ||
                  failureRecord.processing_status,
                desired_action: calendarFailureMetadata &&
                  calendarFailureMetadata.desired_action || ''
              },
              runId,
              spreadsheet,
              getErrorContext()
            );
          } else {
            WorkOsLogAndDeadLetter.recordMessageError(
              error,
              {
                message_id: failureRecord.message_id,
                thread_id: failureRecord.thread_id,
                retry_count: failureRecord.retry_count,
                next_retry_at: failureRecord.next_retry_at,
                processing_status:
                  failureRecord.processing_status,
                resume_stage:
                  WorkOsMessageStateRepository
                    .checkpointStageForResumeStage(
                      failureRecord.resume_stage
                    )
              },
              runId,
              spreadsheet,
              getErrorContext()
            );
          }
        } catch (errorLogFailure) {
          summary.note += ';E_ERROR_LOG_WRITE';
        }
      }
    }
    if (ownsWorkerLease) {
      try {
        releaseWorkerLease(properties, workerLease);
      } catch (releaseError) {
        summary.note += ';WORKER_LEASE_RELEASE_PENDING';
      }
    }
    var finishedAt = clock();
    summary.finished_at = finishedAt;
    summary.duration_ms = Math.max(
      0,
      finishedAt.getTime() - startedAt.getTime()
    );
    summary.gmail_api_call_count = gmailCallMetric(callMeter, 'count');
    summary.gmail_api_call_limit = gmailCallMetric(callMeter, 'limit');
    var logRecorded = settings.skip_run_summary === true
      ? false
      : appendRunSummarySafely(summary, spreadsheet);
    return {
      run_id: runId,
      status: summary.run_status,
      note: summary.note,
      candidate_count: summary.candidate_count,
      processed_count: summary.processed_count,
      created_task_count: summary.created_task_count,
      updated_task_count: summary.updated_task_count,
      review_count: summary.review_count,
      error_count: summary.error_count,
      gmail_api_call_count: summary.gmail_api_call_count,
      gmail_api_call_limit: summary.gmail_api_call_limit,
      classification_reused: summary.classification_reused,
      checkpoint: summary.checkpoint,
      calendar_job_count: summary.calendar_job_count,
      duration_ms: summary.duration_ms,
      log_recorded: logRecorded,
      safe_error_code: summary.safe_error_code,
      safe_error_stage: summary.safe_error_stage,
      provider_http_status: summary.provider_http_status,
      provider_error_code: summary.provider_error_code,
      provider_interaction_status: summary.provider_interaction_status,
      canonical_schema_rule: summary.canonical_schema_rule,
      failure_finalization: summary.failure_finalization,
      failure_finalization_code: summary.failure_finalization_code,
      external_services: {
        gmail: summary.gmail_called
          ? 'ADVANCED_GMAIL_SERVICE'
          : 'NOT_CALLED',
        ai: summary.ai_called
          ? (adapterMetadata.provider === 'MOCK'
            ? 'MOCK_ONLY_NO_NETWORK'
            : 'EXTERNAL_ADAPTER')
          : 'NOT_CALLED_CHECKPOINT_REUSE',
        calendar: summary.calendar_called
          ? 'ADVANCED_CALENDAR_SERVICE'
          : 'OUTBOX_ONLY_NO_API'
      }
    };
  }

  /**
   * Manual Phase 4 Calendar worker.
   *
   * It reconciles the Sheet Task index into the durable outbox and processes
   * at most one due job. It never invokes Gmail or AI and returns no Calendar
   * or Event identifier.
   */
  function processMockVerticalOnce(options) {
    WorkOsUtilities.assertTestMode('MOCK_VERTICAL_WORKER');
    return processVerticalOnce(options);
  }

  function runGeminiSyntheticValidation(options) {
    var settings = options || {};
    if (WorkOsConfig.TEST_MODE !== true) {
      throw new WorkOsAppError(
        'E_GEMINI_SYNTHETIC_GUARD',
        'AI_CONFIG',
        false,
        'Gemini synthetic validation is not enabled.'
      );
    }
    if (typeof WorkOsGeminiProvider === 'undefined' ||
        !WorkOsGeminiProvider ||
        typeof WorkOsGeminiProvider.assertAutomationOff !== 'function') {
      throw new WorkOsAppError(
        'E_GEMINI_AUTOMATION_STATE_UNAVAILABLE',
        'AI_CONFIG',
        false,
        'Gemini synthetic validationのAutomation状態を確認できません。'
      );
    }
    var automationOptions = {};
    if (settings.automation_status && WorkOsConfig.TEST_MODE === true) {
      automationOptions.automation_status = settings.automation_status;
      automationOptions.local_test_only = true;
    }
    var automationStatus =
      WorkOsGeminiProvider.assertAutomationOff(automationOptions);

    var gateway = settings.gateway || WorkOsGmailGateway;
    var preprocessor = settings.preprocessor || null;
    var budget = settings.budget || WorkOsUtilities.createSoftBudget(
      WorkOsConfig.MANUAL_WORKER_SOFT_LIMIT_MS,
      Date.now()
    );
    var callMeter = settings.gmail_call_meter ||
      (gateway && typeof gateway.createCallMeter === 'function'
        ? gateway.createCallMeter(WorkOsConfig.MANUAL_GMAIL_API_CALL_LIMIT)
        : null);
    var candidate = settings.candidate || null;
    if (!candidate) {
      if (!gateway || typeof gateway.listManualCandidates !== 'function') {
        throw new WorkOsAppError(
          'E_GEMINI_SYNTHETIC_GUARD',
          'GMAIL',
          false,
          'Gemini synthetic validationの候補を確認できません。'
        );
      }
      var candidates = gateway.listManualCandidates({
        budget: budget,
        reserve_ms: WorkOsConfig.MANUAL_WORKER_RESERVE_MS,
        call_meter: callMeter
      });
      var syntheticCandidates = (candidates || []).filter(function (item) {
        return WorkOsGeminiProvider.isSyntheticCandidate(item);
      });
      if (syntheticCandidates.length !== 1) {
        throw new WorkOsAppError(
          'E_GEMINI_SYNTHETIC_GUARD',
          'GMAIL',
          false,
          'Gemini synthetic validationの候補数が許可範囲外です。'
        );
      }
      candidate = syntheticCandidates[0];
    }
    if (typeof WorkOsGeminiProvider === 'undefined' ||
        !WorkOsGeminiProvider ||
        !WorkOsGeminiProvider.isSyntheticCandidate(candidate)) {
      throw new WorkOsAppError(
        'E_GEMINI_SYNTHETIC_GUARD',
        'AI_CONFIG',
        false,
        'The selected message is not an approved synthetic fixture.'
      );
    }
    if (typeof candidate.message_id !== 'string' ||
        !candidate.message_id.trim() ||
        candidate.message_id.length > 240) {
      throw new WorkOsAppError(
        'E_GEMINI_SYNTHETIC_CANDIDATE_CONFLICT',
        'GMAIL',
        false,
        'The approved synthetic candidate has no stable identity.'
      );
    }
    var preprocessed = settings.preprocessed_result || null;
    if (!preprocessor && !preprocessed) {
      if (typeof WorkOsEmailPreprocessor === 'undefined' ||
          !WorkOsEmailPreprocessor) {
        throw new WorkOsAppError(
          'E_GEMINI_SYNTHETIC_GUARD',
          'PREPROCESS',
          false,
          'Gemini synthetic validationの本文を確認できません。'
        );
      }
      preprocessor = WorkOsEmailPreprocessor;
    }
    if (!preprocessed) {
      if (!gateway || typeof gateway.fetchSelectedContent !== 'function') {
        throw new WorkOsAppError(
          'E_GEMINI_SYNTHETIC_GUARD',
          'GMAIL',
          false,
          'Gemini synthetic validationの本文を確認できません。'
        );
      }
      var syntheticCandidate = Object.assign({}, candidate, {
        message_refs: [{
          id: String(candidate.message_id || ''),
          internal_date: candidate.received_at instanceof Date
            ? candidate.received_at.getTime()
            : Number(candidate.received_at || 0)
        }]
      });
      var messageInput = gateway.fetchSelectedContent(syntheticCandidate, {
        call_meter: callMeter,
        budget: budget,
        reserve_ms: WorkOsConfig.MANUAL_WORKER_RESERVE_MS
      });
      if (String(messageInput && messageInput.subject || '') !==
          WorkOsGeminiProvider.SYNTHETIC_SUBJECT ||
          messageInput.body_transport_truncated === true ||
          !WorkOsGeminiProvider.isSyntheticBody(messageInput.plain_body)) {
        throw new WorkOsAppError(
          'E_GEMINI_SYNTHETIC_GUARD',
          'GMAIL',
          false,
          'The selected message content is not an approved synthetic fixture.'
        );
      }
      preprocessed = preprocessor.preprocess(messageInput, {
        today: formatToday(
          typeof settings.now === 'function'
            ? settings.now()
            : WorkOsUtilities.now()
        ),
        timezone: WorkOsConfig.TIMEZONE,
        activeTaskProvider: function () { return []; }
      });
    }
    if (String(preprocessed && preprocessed.subject || '') !==
          WorkOsGeminiProvider.SYNTHETIC_SUBJECT ||
        !WorkOsGeminiProvider.isSyntheticBody(
          preprocessed && preprocessed.body
        ) ||
        preprocessed.metadata && preprocessed.metadata.truncated === true) {
      throw new WorkOsAppError(
        'E_GEMINI_SYNTHETIC_GUARD',
        'AI_CONFIG',
        false,
        'The supplied preprocessed fixture is not approved.'
      );
    }
    var originalPreprocessor = preprocessor;
    var guardedPreprocessor = {
      preprocess: function (messageInput, preprocessOptions) {
        if (!messageInput ||
            String(messageInput.subject || '') !==
              WorkOsGeminiProvider.SYNTHETIC_SUBJECT ||
            !WorkOsGeminiProvider.isSyntheticBody(
              messageInput.plain_body
            )) {
          throw new WorkOsAppError(
            'E_GEMINI_SYNTHETIC_GUARD',
            'AI_CONFIG',
            false,
            'The selected message content is not an approved synthetic fixture.'
          );
        }
        return originalPreprocessor.preprocess(
          messageInput,
          preprocessOptions
        );
      }
    };
    var adapter = settings.adapter;
    if (!adapter) {
      adapter = WorkOsAiAdapter.createProductionExternalAdapter({
        config: {
          external_enabled: true,
          provider: WorkOsGeminiProvider.PROVIDER_ID,
          model: WorkOsGeminiProvider.MODEL,
          prompt_version: WorkOsGeminiProvider.PROMPT_VERSION,
          credential_reference:
            WorkOsGeminiProvider.CREDENTIAL_REFERENCE,
          company_approved: true,
          data_policy_approved: true,
          credential_storage_approved: true,
          auth_configured: true,
          timeout_ms: WorkOsConfig.AI_REQUEST_TIMEOUT_MS,
          max_response_chars: WorkOsConfig.AI_RESPONSE_MAX_CHARS
        },
        registry: WorkOsAiAdapter.getProductionProviderRegistry()
      });
    }
    var metadata = WorkOsAiAdapter.getMetadata(adapter);
    if (metadata.provider !== WorkOsGeminiProvider.PROVIDER_ID) {
      throw new WorkOsAppError(
        'E_GEMINI_SYNTHETIC_GUARD',
        'AI_CONFIG',
        false,
        'The synthetic validation adapter is not Gemini.'
      );
    }
    if (adapter.settings) {
      adapter.settings.max_classify_calls = 1;
    }
    var result = processVerticalOnce(Object.assign({}, settings, {
      adapter: adapter,
      candidate: candidate,
      preprocessed_result: preprocessed,
      gateway: gateway,
      preprocessor: guardedPreprocessor,
      selected_message_id: candidate.message_id,
      internal_gemini_synthetic_capability:
        INTERNAL_GEMINI_SYNTHETIC_CAPABILITY,
      calendar_jobs_remaining: 0,
      skip_run_summary: true
    }));
    return {
      status: result.status,
      candidate_count: Number(result.candidate_count || 0),
      processed_count: Number(result.processed_count || 0),
      skipped_count: Number(result.skipped_count || 0),
      error_count: Number(result.error_count || 0),
      created_task_count: Number(result.created_task_count || 0),
      updated_task_count: Number(result.updated_task_count || 0),
      review_count: Number(result.review_count || 0),
      calendar_job_count: Number(result.calendar_job_count || 0),
      ai_called: result.external_services &&
        result.external_services.ai !== 'NOT_CALLED_CHECKPOINT_REUSE',
      error_code: String(result.safe_error_code || ''),
      error_stage: String(result.safe_error_stage || ''),
      checkpoint: String(result.checkpoint || ''),
      failure_finalization: String(
        result.failure_finalization || 'NOT_APPLICABLE'
      ),
      failure_finalization_code: String(
        result.failure_finalization_code || ''
      ),
      provider_http_status: Number.isInteger(result.provider_http_status)
        ? result.provider_http_status
        : null,
      provider_error_code: String(result.provider_error_code || ''),
      provider_interaction_status: String(
        result.provider_interaction_status || ''
      ),
      canonical_schema_rule: String(result.canonical_schema_rule || ''),
      automation_status: automationStatus.status,
      automation_enabled: automationStatus.enabled,
      automation_desired_enabled: automationStatus.desired_enabled,
      scheduled_trigger_count: automationStatus.trigger_count,
      clock_trigger_count: automationStatus.clock_trigger_count,
      stored_trigger_id_present:
        automationStatus.stored_trigger_id_present,
      canonical_trigger_present:
        automationStatus.canonical_trigger_present
    };
  }

  function legacyLockedSyncPendingCalendarJobs(options) {
    var settings = options || {};
    if (Object.keys(settings).length && !WorkOsConfig.TEST_MODE) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        'CALENDAR_SYNC',
        false,
        'Workerへの依存注入はTest modeだけで利用できます。'
      );
    }
    var spreadsheet = boundSpreadsheet(settings);
    var clock = typeof settings.now === 'function'
      ? settings.now
      : function () { return WorkOsUtilities.now(); };
    var budget = settings.budget || WorkOsUtilities.createSoftBudget(
      WorkOsConfig.MANUAL_WORKER_SOFT_LIMIT_MS,
      Date.now()
    );
    var startedAt = clock();
    var runId = WorkOsUtilities.makeId('run_');
    var summary = {
      run_id: runId,
      mode: 'CALENDAR_PHASE4',
      started_at: startedAt,
      candidate_count: 0,
      processed_count: 0,
      skipped_count: 0,
      error_count: 0,
      created_task_count: 0,
      updated_task_count: 0,
      review_count: 0,
      run_status: 'COMPLETE',
      note: 'Phase 4 manual Calendar outbox',
      queued_count: 0,
      calendar_called: false,
      action: ''
    };

    try {
      if (!calendarModuleAvailable()) {
        throw new WorkOsAppError(
          'E_CALENDAR_MODULE_MISSING',
          'CALENDAR_SYNC',
          false,
          'Calendar同期moduleがありません。'
        );
      }
      var taskSheet = spreadsheet.getSheetByName(
        WorkOsConfig.SHEETS.TASKS
      );
      if (!taskSheet) {
        throw new WorkOsAppError(
          'E_SCHEMA_MISSING_SHEET',
          'CALENDAR_SYNC',
          false,
          'タスク一覧Sheetがありません。'
        );
      }
      WorkOsUtilities.withScriptLock(function (lock) {
        var taskContext = WorkOsTaskRepository.createContextForHeldLock(
          taskSheet,
          lock
        );
        var outboxContext =
          WorkOsCalendarSync.createOutboxContextForHeldLock(
            calendarOutboxSheet(spreadsheet),
            lock
          );
        var errorContext =
          WorkOsLogAndDeadLetter.createErrorContext(spreadsheet);
        phase3BudgetCheck(budget);
        var reconciliation = enqueueCalendarTasksInContext(
          allTasksInContext(taskContext),
          taskContext,
          outboxContext,
          clock(),
          false,
          budget
        );
        summary.queued_count = reconciliation.counts.queued_count;
        var selected = WorkOsCalendarSync.selectNextJob(
          outboxContext,
          clock()
        );
        summary.candidate_count = selected ? 1 : 0;
        if (!selected) {
          summary.note = 'No due Calendar outbox job';
          return;
        }

        var calendarRun = processOneCalendarJobInContext({
          outbox_context: outboxContext,
          task_context: taskContext,
          task_ids: [],
          allow_global: true,
          now: clock(),
          budget: budget,
          gateway: settings.calendar_gateway || settings.gateway,
          properties: settings.calendar_properties ||
            settings.properties,
          instance_id: settings.instance_id
        });
        if (calendarRun.status === 'PAUSED') {
          summary.run_status = 'PAUSED';
          summary.note = 'E_BUDGET_EXHAUSTED';
          return;
        }
        summary.processed_count = Number(
          calendarRun.processed_count || 0
        );
        summary.calendar_called = summary.processed_count > 0;
        if (!calendarRun.result) {
          return;
        }
        summary.action = String(calendarRun.result.action || '');
        if (calendarRun.result.status === 'RETRY' ||
            calendarRun.result.status === 'DEAD') {
          var error = calendarFailureError(calendarRun.result);
          summary.error_count = 1;
          summary.run_status = 'FAILED';
          summary.note = String(
            calendarRun.result.error_code || 'E_CALENDAR_SYNC'
          );
          try {
            WorkOsLogAndDeadLetter.recordCalendarError(
              error,
              {
                task_id: calendarRun.selected_task_id,
                retry_count: calendarRun.result.retry_count,
                next_retry_at:
                  calendarRun.result.next_retry_at || '',
                status: calendarRun.result.status,
                desired_action: calendarRun.result.action || ''
              },
              runId,
              spreadsheet,
              errorContext
            );
          } catch (calendarLogError) {
            summary.note += ';E_ERROR_LOG_WRITE';
          }
        } else {
          WorkOsLogAndDeadLetter.resolveErrorsForTask(
            calendarRun.selected_task_id,
            spreadsheet,
            clock(),
            errorContext
          );
          summary.note = 'Calendar outbox job completed';
        }
      }, WorkOsConfig.LOCK_WAIT_MS);
    } catch (error) {
      var safe = WorkOsUtilities.safeError(error, 'CALENDAR_SYNC');
      if (safe.code !== 'E_BUDGET_EXHAUSTED') {
        summary.error_count += 1;
      }
      summary.run_status = safe.code === 'E_BUDGET_EXHAUSTED'
        ? 'PAUSED'
        : 'FAILED';
      summary.note = safe.code;
    }

    var finishedAt = clock();
    summary.finished_at = finishedAt;
    summary.duration_ms = Math.max(
      0,
      finishedAt.getTime() - startedAt.getTime()
    );
    var logRecorded = true;
    try {
      WorkOsLogAndDeadLetter.appendRunSummary(summary, spreadsheet);
    } catch (logError) {
      logRecorded = false;
    }
    return {
      run_id: runId,
      status: summary.run_status,
      note: summary.note,
      candidate_count: summary.candidate_count,
      processed_count: summary.processed_count,
      queued_count: summary.queued_count,
      error_count: summary.error_count,
      action: summary.action,
      duration_ms: summary.duration_ms,
      log_recorded: logRecorded,
      external_services: {
        gmail: 'NOT_CALLED',
        ai: 'NOT_CALLED',
        calendar: summary.calendar_called
          ? 'ADVANCED_CALENDAR_SERVICE'
          : 'OUTBOX_ONLY_NO_API'
      }
    };
  }

  function syncPendingCalendarJobs(options) {
    var settings = options || {};
    if (Object.keys(settings).length && !WorkOsConfig.TEST_MODE) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        'CALENDAR_SYNC',
        false,
        'Workerへの依存注入はTest modeだけで利用できます。'
      );
    }
    var spreadsheet = boundSpreadsheet(settings);
    var properties = workerProperties(settings);
    var clock = typeof settings.now === 'function'
      ? settings.now
      : function () { return WorkOsUtilities.now(); };
    var budget = settings.budget || WorkOsUtilities.createSoftBudget(
      WorkOsConfig.MANUAL_WORKER_SOFT_LIMIT_MS,
      Date.now()
    );
    var startedAt = clock();
    var runId = WorkOsUtilities.makeId('run_');
    var summary = {
      run_id: runId,
      mode: 'CALENDAR_PHASE4',
      started_at: startedAt,
      candidate_count: 0,
      processed_count: 0,
      skipped_count: 0,
      error_count: 0,
      created_task_count: 0,
      updated_task_count: 0,
      review_count: 0,
      run_status: 'COMPLETE',
      note: 'Lock-free Calendar outbox',
      queued_count: 0,
      calendar_called: false,
      action: ''
    };
    var workerLease = null;
    try {
      workerLease = acquireWorkerLease(
        properties,
        runId,
        summary.mode,
        clock,
        WorkOsConfig.MANUAL_WORKER_SOFT_LIMIT_MS
      );
      if (!workerLease.acquired) {
        summary.run_status = 'BUSY';
        summary.note = 'WORKER_LEASE_ACTIVE';
      } else {
        var taskSheet = spreadsheet.getSheetByName(
          WorkOsConfig.SHEETS.TASKS
        );
        var prepared = WorkOsUtilities.withScriptLock(function (lock) {
          var taskContext =
            WorkOsTaskRepository.createContextForHeldLock(
              taskSheet,
              lock
            );
          var outboxContext =
            WorkOsCalendarSync.createOutboxContextForHeldLock(
              calendarOutboxSheet(spreadsheet),
              lock
            );
          phase3BudgetCheck(budget);
          var reconciliation = enqueueCalendarTasksInContext(
            allTasksInContext(taskContext),
            taskContext,
            outboxContext,
            clock(),
            false,
            budget
          );
          var selected = WorkOsCalendarSync.selectNextJob(
            outboxContext,
            clock()
          );
          return {
            queued_count: reconciliation.counts.queued_count,
            selected: Boolean(selected)
          };
        }, WorkOsConfig.LOCK_WAIT_MS);
        summary.queued_count = prepared.queued_count;
        summary.candidate_count = prepared.selected ? 1 : 0;
        if (prepared.selected) {
          var calendarRun = WorkOsCalendarSync.processNextJob({
            spreadsheet: spreadsheet,
            sheet: calendarOutboxSheet(spreadsheet),
            gateway: settings.calendar_gateway || settings.gateway,
            properties: settings.calendar_properties || properties,
            instance_id: settings.instance_id,
            timezone: WorkOsConfig.TIMEZONE,
            now: clock(),
            budget: budget,
            reserve_ms: WorkOsConfig.MANUAL_WORKER_RESERVE_MS,
            task_reader_in_context: function (taskId, lock) {
              var context =
                WorkOsTaskRepository.createContextForHeldLock(
                  taskSheet,
                  lock
                );
              return WorkOsTaskRepository.findByTaskId(
                context,
                taskId
              );
            },
            task_writer_in_context: function (
              taskId,
              patch,
              expectedRowVersion,
              lock
            ) {
              var context =
                WorkOsTaskRepository.createContextForHeldLock(
                  taskSheet,
                  lock
                );
              var current = WorkOsTaskRepository.findByTaskId(
                context,
                taskId
              );
              if (expectedRowVersion != null &&
                  Number(current && current.row_version) !==
                    Number(expectedRowVersion)) {
                throw new WorkOsAppError(
                  'E_CALENDAR_JOB_CAS_CONFLICT',
                  'CALENDAR_SYNC',
                  true,
                  'Calendar Task CAS conflictです。'
                );
              }
              return WorkOsTaskRepository.applyCalendarPatch(
                taskId,
                patch,
                context,
                clock()
              );
            },
            task_reader: function (taskId) {
              return WorkOsUtilities.withScriptLock(function (lock) {
                var context =
                  WorkOsTaskRepository.createContextForHeldLock(
                    taskSheet,
                    lock
                  );
                return WorkOsTaskRepository.findByTaskId(
                  context,
                  taskId
                );
              }, WorkOsConfig.LOCK_WAIT_MS);
            },
            task_writer: function (
              taskId,
              patch,
              expectedRowVersion
            ) {
              return WorkOsUtilities.withScriptLock(function (lock) {
                var context =
                  WorkOsTaskRepository.createContextForHeldLock(
                    taskSheet,
                    lock
                  );
                var current = WorkOsTaskRepository.findByTaskId(
                  context,
                  taskId
                );
                if (expectedRowVersion != null &&
                    Number(current && current.row_version) !==
                      Number(expectedRowVersion)) {
                  throw new WorkOsAppError(
                    'E_CALENDAR_JOB_CAS_CONFLICT',
                    'CALENDAR_SYNC',
                    true,
                    'Calendar Task CAS conflictです。'
                  );
                }
                return WorkOsTaskRepository.applyCalendarPatch(
                  taskId,
                  patch,
                  context,
                  clock()
                );
              }, WorkOsConfig.LOCK_WAIT_MS);
            }
          });
          if (calendarRun.status === 'PAUSED') {
            summary.run_status = 'PAUSED';
            summary.note = 'E_BUDGET_EXHAUSTED';
          }
          summary.processed_count = Number(
            calendarRun.processed_count || 0
          );
          summary.calendar_called =
            summary.processed_count > 0 ||
            calendarRun.external_io_performed === true;
          if (calendarRun.result) {
            summary.action = String(
              calendarRun.result.action || ''
            );
            if (calendarRun.result.status === 'CONFLICT') {
              summary.run_status = calendarRun.recovery_scheduled
                ? 'PAUSED'
                : 'FAILED';
              summary.note = calendarRun.recovery_scheduled
                ? 'E_CALENDAR_CAS_CONFLICT_REQUEUED'
                : 'E_CALENDAR_CAS_CONFLICT_REVIEW_REQUIRED';
              if (!calendarRun.recovery_scheduled) {
                summary.error_count = 1;
                WorkOsLogAndDeadLetter.recordCalendarError(
                  calendarFailureError(calendarRun.result),
                  {
                    task_id:
                      calendarRun.selected_task_id || '',
                    retry_count: 0,
                    next_retry_at: '',
                    status: 'CONFLICT',
                    desired_action:
                      calendarRun.result.action || ''
                  },
                  runId,
                  spreadsheet
                );
              }
            } else if (calendarRun.result.status === 'RETRY' ||
                calendarRun.result.status === 'DEAD') {
              summary.error_count = 1;
              summary.run_status = 'FAILED';
              summary.note = String(
                calendarRun.result.error_code ||
                  'E_CALENDAR_SYNC'
              );
              WorkOsLogAndDeadLetter.recordCalendarError(
                calendarFailureError(calendarRun.result),
                {
                  task_id: calendarRun.selected_task_id || '',
                  retry_count:
                    calendarRun.result.retry_count || 0,
                  next_retry_at:
                    calendarRun.result.next_retry_at || '',
                  status: calendarRun.result.status,
                  desired_action:
                    calendarRun.result.action || ''
                },
                runId,
                spreadsheet
              );
            } else {
              WorkOsLogAndDeadLetter.resolveErrorsForTask(
                calendarRun.selected_task_id || '',
                spreadsheet,
                clock()
              );
              summary.note = 'Calendar outbox job completed';
            }
          }
        } else {
          summary.note = 'No due Calendar outbox job';
        }
      }
    } catch (error) {
      var safe = WorkOsUtilities.safeError(error, 'CALENDAR_SYNC');
      summary.run_status = isExecutionPauseCode(safe.code)
        ? 'PAUSED'
        : 'FAILED';
      summary.note = safe.code;
      if (!isExecutionPauseCode(safe.code)) {
        summary.error_count += 1;
      }
    }
    try {
      releaseWorkerLease(properties, workerLease);
    } catch (releaseError) {
      summary.note += ';WORKER_LEASE_RELEASE_PENDING';
    }
    var finishedAt = clock();
    summary.finished_at = finishedAt;
    summary.duration_ms = Math.max(
      0,
      finishedAt.getTime() - startedAt.getTime()
    );
    var logRecorded = appendRunSummarySafely(summary, spreadsheet);
    return {
      run_id: runId,
      status: summary.run_status,
      note: summary.note,
      candidate_count: summary.candidate_count,
      processed_count: summary.processed_count,
      queued_count: summary.queued_count,
      error_count: summary.error_count,
      action: summary.action,
      duration_ms: summary.duration_ms,
      log_recorded: logRecorded,
      external_services: {
        gmail: 'NOT_CALLED',
        ai: 'NOT_CALLED',
        calendar: summary.calendar_called
          ? 'ADVANCED_CALENDAR_SERVICE'
          : 'OUTBOX_ONLY_NO_API'
      }
    };
  }

  function scheduledRecordPriority(record, nowValue) {
    if (record.processing_status ===
        WorkOsMessageStateRepository.STATUSES.RETRY &&
        (!(record.next_retry_at instanceof Date) ||
         record.next_retry_at.getTime() <= nowValue.getTime())) {
      return 0;
    }
    if (record.processing_status ===
        WorkOsMessageStateRepository.STATUSES.CLAIMED &&
        WorkOsMessageStateRepository.isStaleClaim(record, nowValue)) {
      return 1;
    }
    if ([
      WorkOsMessageStateRepository.STATUSES.PREPROCESSED,
      WorkOsMessageStateRepository.STATUSES.CLASSIFIED,
      WorkOsMessageStateRepository.STATUSES.TASKS_WRITTEN,
      WorkOsMessageStateRepository.STATUSES.CALENDAR_PENDING
    ].indexOf(record.processing_status) !== -1) {
      return 2;
    }
    if (record.processing_status ===
        WorkOsMessageStateRepository.STATUSES.DISCOVERED) {
      return 3;
    }
    return -1;
  }

  function eligibleScheduledRecords(
    context,
    nowValue,
    providerSuppression
  ) {
    return context.logicalRows.filter(function (record) {
      if (providerSuppression && providerSuppression.active &&
          [
            WorkOsMessageStateRepository.RESUME_STAGES.PREPROCESS,
            WorkOsMessageStateRepository.RESUME_STAGES.CLASSIFY
          ].indexOf(record.resume_stage) !== -1) {
        return false;
      }
      return scheduledRecordPriority(record, nowValue) >= 0;
    }).sort(function (left, right) {
      var priorityDifference =
        scheduledRecordPriority(left, nowValue) -
        scheduledRecordPriority(right, nowValue);
      if (priorityDifference) {
        return priorityDifference;
      }
      var leftRetry = left.next_retry_at instanceof Date
        ? left.next_retry_at.getTime()
        : 0;
      var rightRetry = right.next_retry_at instanceof Date
        ? right.next_retry_at.getTime()
        : 0;
      if (leftRetry !== rightRetry) {
        return leftRetry - rightRetry;
      }
      var receivedDifference =
        left.received_at.getTime() - right.received_at.getTime();
      return receivedDifference ||
        left.message_id.localeCompare(right.message_id);
    });
  }

  function safePropertyDate(value) {
    if (value == null || String(value) === '') {
      return null;
    }
    var date = new Date(String(value));
    if (isNaN(date.getTime())) {
      throw new WorkOsAppError(
        'E_AUTOMATION_SCAN_STATE_INVALID',
        'AUTOMATIC_SCAN_STATE',
        false,
        '自動検索の保存日時が不正です。'
      );
    }
    return date;
  }

  function automaticPilotStartBoundary(properties) {
    var raw = String(properties.getProperty(
      WorkOsConfig.PROPERTIES.AUTOMATION_PILOT_STARTED_AT
    ) || '');
    if (!raw) {
      throw new WorkOsAppError(
        'E_AUTOMATION_PILOT_START_BOUNDARY_MISSING',
        'AUTOMATIC_SCAN_STATE',
        false,
        'Automatic Inbox Pilotの開始境界がありません。'
      );
    }
    var value = safePropertyDate(raw);
    if (!value) {
      throw new WorkOsAppError(
        'E_AUTOMATION_PILOT_START_BOUNDARY_INVALID',
        'AUTOMATIC_SCAN_STATE',
        false,
        'Automatic Inbox Pilotの開始境界が不正です。'
      );
    }
    return value;
  }

  function taskVersionSnapshot(tasks) {
    return (tasks || []).map(function (task) {
      return {
        task_id: String(task.task_id || ''),
        row_version: Number(task.row_version)
      };
    }).sort(function (left, right) {
      return left.task_id.localeCompare(right.task_id);
    });
  }

  /**
   * Production-only CLASSIFY stage.
   *
   * The first critical section creates a durable Message claim and an
   * in-memory CAS lease. Gmail content retrieval, preprocessing, credential
   * resolution and AI transport then run without Script Lock. A second fresh
   * critical section verifies claim/input/Task versions before persisting the
   * classification. No provider is registered by this repository.
   */
  function processProductionClassificationOnce(options) {
    var settings = options || {};
    var pilotOnly = isAutomationPilotMode(settings);
    // Production-shaped runs use the automatic Inbox pilot. The explicit options
    // remain available only to local test harnesses and audit fixtures.
    var qualificationOnly = !pilotOnly && (WorkOsConfig.TEST_MODE !== true ||
      settings.qualification_only === true);
    var internalProduction =
      settings.internal_production_capability ===
        INTERNAL_SCHEDULED_CAPABILITY;
    if (Object.keys(settings).length && !WorkOsConfig.TEST_MODE &&
        !internalProduction) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        'AI_CLASSIFY',
        false,
        'production分類への依存注入はTest modeだけで利用できます。'
      );
    }
    var spreadsheet = boundSpreadsheet(settings);
    var runtimeSettings = runtimeSettingsSnapshot(
      spreadsheet,
      settings
    );
    var gateway = settings.gateway || WorkOsGmailGateway;
    var gmailCallMeter = createGmailCallMeter(
      gateway,
      WorkOsConfig.AUTOMATION_GMAIL_API_CALL_LIMIT,
      settings.gmail_call_meter
    );
    var preprocessor = settings.preprocessor || WorkOsEmailPreprocessor;
    var adapter = settings.adapter ||
      WorkOsAiAdapter.createProductionExternalAdapter();
    var metadata = WorkOsAiAdapter.getMetadata(adapter);
    if (String(metadata.provider || '').toUpperCase() === 'MOCK') {
      throw new WorkOsAppError(
        'E_REAL_AI_TRANSPORT_NOT_IMPLEMENTED',
        'AI_CLASSIFY',
        false,
        'production分類でMock Providerは使用できません。'
      );
    }
    var budget = settings.budget || WorkOsUtilities.createSoftBudget(
      runtimeSettings.automation_worker_soft_limit_ms,
      Date.now()
    );
    var clock = typeof settings.now === 'function'
      ? settings.now
      : function () { return WorkOsUtilities.now(); };
    var messageSheet =
      WorkOsMessageStateRepository.messageSheet(spreadsheet);
    var taskSheet = spreadsheet.getSheetByName(
      WorkOsConfig.SHEETS.TASKS
    );
    if (!taskSheet) {
      throw new WorkOsAppError(
        'E_SCHEMA_MISSING_SHEET',
        'AI_CLASSIFY',
        false,
        'タスク一覧Sheetがありません。'
      );
    }
    var runId = WorkOsUtilities.makeId('ai_run_');
    var prepared = WorkOsUtilities.withScriptLock(function (lock) {
      var messageContext =
        WorkOsMessageStateRepository.createContextForHeldLock(
          messageSheet,
          lock
        );
      var taskContext =
        WorkOsTaskRepository.createContextForHeldLock(taskSheet, lock);
      var acceptedSourceMode = pilotOnly
        ? WorkOsConfig.AUTOMATION_PILOT_SOURCE_MODE
        : WorkOsConfig.AUTOMATION_QUALIFICATION_SOURCE_MODE;
      var eligible = eligiblePhase3Records(
        messageContext,
        clock()
      ).filter(function (record) {
        return record.resume_stage ===
          WorkOsMessageStateRepository.RESUME_STAGES.CLASSIFY &&
          (!qualificationOnly && !pilotOnly ||
            String(record.source_mode || '') === acceptedSourceMode);
      });
      if (settings.selected_message_id) {
        eligible = eligible.filter(function (record) {
          return record.message_id ===
            String(settings.selected_message_id);
        });
      }
      if (!eligible.length) {
        return null;
      }
      var selected = eligible[0];
      var claim = WorkOsMessageStateRepository.claimForResumeInContext(
        selected.message_id,
        runId,
        messageContext,
        clock()
      );
      if (!claim.claimed) {
        return null;
      }
      var activeTasks = activeTasksForThread(
        taskContext,
        claim.record.stable_thread_key
      );
      return {
        lease:
          WorkOsMessageStateRepository.createClassificationLeaseInContext(
            claim.record.message_id,
            runId,
            messageContext,
            taskVersionSnapshot(activeTasks)
          ),
        record: claim.record,
        active_tasks: activeTasks
      };
    }, WorkOsConfig.LOCK_WAIT_MS);
    if (!prepared) {
      return {
        status: 'NOOP',
        classified_count: 0,
        external_transport_outside_lock: true
      };
    }

    var preprocessed;
    var input;
    var inputHash;
    var classification;
    try {
      if (budget.isExhausted(
        WorkOsConfig.AUTOMATION_WORKER_RESERVE_MS
      )) {
        throw budgetError();
      }
      var messageInput = gateway.refetchMessageContent(
        prepared.record,
        {
          call_meter: gmailCallMeter,
          budget: budget,
          reserve_ms: WorkOsConfig.AUTOMATION_WORKER_RESERVE_MS
        }
      );
      if (!pilotOnly && qualificationOnly && WorkOsConfig.TEST_MODE !== true &&
          isAutomationQualificationRecord(prepared.record)) {
        assertAutomationQualificationContent(prepared.record, messageInput);
      }
      preprocessed = preprocessor.preprocess(messageInput, {
        today: formatToday(clock()),
        timezone: WorkOsConfig.TIMEZONE,
        activeTaskProvider: function () {
          return prepared.active_tasks.slice();
        }
      });
      if (preprocessed.content_hash !== prepared.lease.preprocess_hash) {
        throw new WorkOsAppError(
          'E_PREPROCESS_HASH_CONFLICT',
          'AI_INPUT',
          false,
          'Lock外で再取得した本文hashがcheckpointと一致しません。'
        );
      }
      input = WorkOsAiAdapter.buildInput(preprocessed);
      inputHash = WorkOsUtilities.sha256Hex(JSON.stringify(input));
      prepared.lease =
        WorkOsMessageStateRepository.attachClassificationInputHash(
          prepared.lease,
          inputHash
        );
      classification = adapter.classify(input, {
        remaining_ms: typeof budget.remainingMs === 'function'
          ? budget.remainingMs()
          : WorkOsConfig.AI_REQUEST_TIMEOUT_MS +
            WorkOsConfig.AUTOMATION_WORKER_RESERVE_MS,
        reserve_ms: WorkOsConfig.AUTOMATION_WORKER_RESERVE_MS
      });
      WorkOsAiAdapter.validateOutput(classification);
    } catch (externalError) {
      WorkOsUtilities.withScriptLock(function (lock) {
        var messageContext =
          WorkOsMessageStateRepository.createContextForHeldLock(
            messageSheet,
            lock
          );
        var current = WorkOsMessageStateRepository.getByMessageId(
          messageContext,
          prepared.lease.message_id
        );
        var owned = current &&
          current.processing_status ===
            WorkOsMessageStateRepository.STATUSES.CLAIMED &&
          current.claim_run_id === prepared.lease.run_id &&
          current.resume_stage ===
            WorkOsMessageStateRepository.RESUME_STAGES.CLASSIFY &&
          String(current.preprocess_hash || '') ===
            prepared.lease.preprocess_hash &&
          new Date(current.updated_at).getTime() ===
            prepared.lease.claimed_updated_at_ms;
        if (!owned) {
          return;
        }
        var safe = WorkOsUtilities.safeError(
          externalError,
          'AI_CLASSIFY'
        );
        if (isExecutionPauseCode(safe.code) ||
            safe.code === 'E_AI_BUDGET_INSUFFICIENT') {
          WorkOsMessageStateRepository.pauseForBudgetInContext(
            prepared.lease.message_id,
            prepared.lease.run_id,
            messageContext,
            clock()
          );
        } else {
          WorkOsMessageStateRepository.recordFailureInContext(
            prepared.lease.message_id,
            prepared.lease.run_id,
            externalError,
            messageContext,
            clock()
          );
        }
      }, WorkOsConfig.LOCK_WAIT_MS);
      throw externalError;
    }

    var commit = WorkOsUtilities.withScriptLock(function (lock) {
      var messageContext =
        WorkOsMessageStateRepository.createContextForHeldLock(
          messageSheet,
          lock
        );
      var taskContext =
        WorkOsTaskRepository.createContextForHeldLock(taskSheet, lock);
      var current = WorkOsMessageStateRepository.getByMessageId(
        messageContext,
        prepared.lease.message_id
      );
      var currentTasks = current
        ? activeTasksForThread(
          taskContext,
          current.stable_thread_key
        )
        : [];
      return WorkOsMessageStateRepository
        .commitClassificationLeaseInContext(
          prepared.lease,
          classification,
          metadata,
          messageContext,
          taskVersionSnapshot(currentTasks),
          inputHash,
          clock()
        );
    }, WorkOsConfig.LOCK_WAIT_MS);
    return {
      status: 'CLASSIFIED',
      classified_count: 1,
      message_id: prepared.lease.message_id,
      operation: commit.operation,
      preprocessed_result: preprocessed,
      external_transport_outside_lock: true
    };
  }

  function legacyLockedProcessAutomaticBatch(options) {
    var settings = options || {};
    if (Object.keys(settings).length && !WorkOsConfig.TEST_MODE) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        'AUTOMATIC_WORKER',
        false,
        'Workerへの依存注入はTest modeだけで利用できます。'
      );
    }
    var spreadsheet = boundSpreadsheet(settings);
    var runtimeSettings = runtimeSettingsSnapshot(
      spreadsheet,
      settings
    );
    var gateway = settings.gateway || WorkOsGmailGateway;
    var gmailCallMeter = createGmailCallMeter(
      gateway,
      WorkOsConfig.AUTOMATION_GMAIL_API_CALL_LIMIT,
      settings.gmail_call_meter
    );
    var preprocessor = settings.preprocessor || WorkOsEmailPreprocessor;
    var props = settings.properties ||
      PropertiesService.getScriptProperties();
    var clock = typeof settings.now === 'function'
      ? settings.now
      : function () { return WorkOsUtilities.now(); };
    var budget = settings.budget || WorkOsUtilities.createSoftBudget(
      runtimeSettings.automation_worker_soft_limit_ms,
      Date.now()
    );
    var automaticMaxMessages = WorkOsConfig.TEST_MODE
      ? 10
      : runtimeSettings.automation_max_messages_per_run;
    var adapter;
    if (settings.adapter) {
      adapter = WorkOsAiAdapter.createAdapter({
        adapter: settings.adapter,
        adapter_options: settings.adapter_options || {},
        mode: settings.adapter_mode || ''
      });
    } else {
      if (typeof WorkOsAiAdapter.createProductionExternalAdapter !==
          'function') {
        throw new WorkOsAppError(
          'E_REAL_AI_TRANSPORT_NOT_IMPLEMENTED',
          'AUTOMATIC_WORKER',
          false,
          '実Provider transportが未実装のため自動処理を開始できません。'
        );
      }
      adapter = WorkOsAiAdapter.createProductionExternalAdapter();
      var productionMetadata = WorkOsAiAdapter.getMetadata(adapter);
      if (String(productionMetadata.provider || '').toUpperCase() === 'MOCK') {
        throw new WorkOsAppError(
          'E_REAL_AI_TRANSPORT_NOT_IMPLEMENTED',
          'AUTOMATIC_WORKER',
          false,
          '自動処理でMock Providerは使用できません。'
        );
      }
    }
    var runId = WorkOsUtilities.makeId('run_');
    var startedAt = clock();
    var summary = {
      run_id: runId,
      mode: 'AUTO_PHASE6',
      started_at: startedAt,
      candidate_count: 0,
      processed_count: 0,
      skipped_count: 0,
      error_count: 0,
      created_task_count: 0,
      updated_task_count: 0,
      review_count: 0,
      run_status: 'COMPLETE',
      note: 'Scheduled small batch',
      calendar_job_count: 0,
      backlog_processed_count: 0,
      inbox_processed_count: 0,
      search_saturated: false,
      watermark_advanced: false,
      provider_retry_suppressed: false,
      system_retry_deferred: false,
      ai_classified_outside_lock_count: 0,
      ai_transport_outside_lock: false
    };
    var lockAcquired = false;
    var cyclePageToken = '';
    var deferredOperationalError = null;
    var systemFailureSubsystem = 'STATE_WRITE';
    try {
      var productionMetadata = WorkOsAiAdapter.getMetadata(adapter);
      var productionClassification = null;
      if (String(productionMetadata.provider || '').toUpperCase() !==
          'MOCK') {
        productionClassification =
          processProductionClassificationOnce({
            spreadsheet: spreadsheet,
            gateway: gateway,
            preprocessor: preprocessor,
            adapter: adapter,
            properties: props,
            now: clock,
            budget: budget,
            runtime_settings: runtimeSettings,
            gmail_call_meter: gmailCallMeter,
            selected_message_id: settings.selected_message_id,
            internal_production_capability:
              INTERNAL_SCHEDULED_CAPABILITY,
            qualification_only: WorkOsConfig.TEST_MODE !== true
          });
        summary.ai_classified_outside_lock_count = Number(
          productionClassification.classified_count || 0
        );
        summary.ai_transport_outside_lock =
          productionClassification.external_transport_outside_lock ===
            true;
      }
      WorkOsUtilities.withScriptLock(function (lock) {
        lockAcquired = true;
        var messageSheet =
          WorkOsMessageStateRepository.messageSheet(spreadsheet);
        var taskSheet = spreadsheet.getSheetByName(
          WorkOsConfig.SHEETS.TASKS
        );
        if (!taskSheet) {
          throw new WorkOsAppError(
            'E_SCHEMA_MISSING_SHEET',
            'AUTOMATIC_WORKER',
            false,
            'タスク一覧Sheetがありません。'
          );
        }
        var messageContext =
          WorkOsMessageStateRepository.createContextForHeldLock(
            messageSheet,
            lock
          );
        var taskContext =
          WorkOsTaskRepository.createContextForHeldLock(
            taskSheet,
            lock
          );
        var outboxContext =
          WorkOsCalendarSync.createOutboxContextForHeldLock(
            calendarOutboxSheet(spreadsheet),
            lock
          );
        var errorContext =
          WorkOsLogAndDeadLetter.createErrorContext(spreadsheet);
        var calendarRemaining = configuredCalendarJobLimit();
        var stopNewWork = false;
        var providerSuppression =
          WorkOsLogAndDeadLetter.providerSuppressionStatus(
            props,
            clock()
          );
        summary.provider_retry_suppressed =
          providerSuppression.active === true;
        var gmailLabelCache = null;
        var gmailLabelCacheLoaded = false;

        function ensureBudget() {
          if (budget.isExhausted(
            WorkOsConfig.AUTOMATION_WORKER_RESERVE_MS
          )) {
            summary.run_status = 'PAUSED';
            summary.note = 'E_BUDGET_EXHAUSTED';
            stopNewWork = true;
            return false;
          }
          return true;
        }

        function getGmailLabelCache() {
          if (!gmailLabelCacheLoaded) {
            if (!ensureBudget()) {
              throw budgetError();
            }
            gmailLabelCache = typeof gateway.loadLabelCache === 'function'
              ? gateway.loadLabelCache(gmailCallMeter)
              : null;
            gmailLabelCacheLoaded = true;
          }
          return gmailLabelCache;
        }

        function preprocessIfNeeded(record, candidate) {
          if (record.resume_stage !==
              WorkOsMessageStateRepository.RESUME_STAGES.PREPROCESS) {
            return { ready: true };
          }
          if (!ensureBudget()) {
            return { ready: false };
          }
          var metadata = candidate || {
            message_id: record.message_id,
            thread_id: record.thread_id,
            stable_thread_key: record.stable_thread_key,
            received_at: record.received_at,
            source_mode: record.source_mode || 'AUTOMATIC'
          };
          var claim = WorkOsMessageStateRepository.claimInContext(
            metadata,
            runId,
            messageContext,
            clock()
          );
          if (!claim.claimed) {
            return {
              ready: false,
              skipped: true,
              reason: claim.reason
            };
          }
          try {
            var messageInput = candidate
              ? gateway.fetchSelectedContent(
                candidate,
                {
                  call_meter: gmailCallMeter,
                  budget: budget,
                  reserve_ms:
                    WorkOsConfig.AUTOMATION_WORKER_RESERVE_MS
                }
              )
              : gateway.refetchMessageContent(
                claim.record,
                {
                  call_meter: gmailCallMeter,
                  budget: budget,
                  reserve_ms:
                    WorkOsConfig.AUTOMATION_WORKER_RESERVE_MS
                }
              );
            if (!ensureBudget()) {
              throw budgetError();
            }
            if (WorkOsConfig.TEST_MODE !== true &&
                isAutomationQualificationRecord(metadata)) {
              assertAutomationQualificationContent(metadata, messageInput);
            }
            var preprocessed = preprocessor.preprocess(
              messageInput,
              {
                today: formatToday(clock()),
                timezone: WorkOsConfig.TIMEZONE,
                activeTaskProvider: function (stableThreadKey) {
                  return activeTasksForThread(
                    taskContext,
                    stableThreadKey
                  );
                }
              }
            );
            WorkOsMessageStateRepository.checkpointPreprocessedInContext(
              record.message_id,
              runId,
              preprocessed.content_hash,
              messageContext,
              clock()
            );
            return {
              ready: true,
              preprocessed: preprocessed
            };
          } catch (error) {
            var safe = WorkOsUtilities.safeError(
              error,
              'AUTOMATIC_PREPROCESS'
            );
            if (isExecutionPauseCode(safe.code)) {
              WorkOsMessageStateRepository.pauseForBudgetInContext(
                record.message_id,
                runId,
                messageContext,
                clock()
              );
              summary.run_status = 'PAUSED';
            } else {
              var failure =
                WorkOsMessageStateRepository.recordFailureInContext(
                  record.message_id,
                  runId,
                  error,
                  messageContext,
                  clock()
                );
              summary.error_count += 1;
              summary.run_status = 'FAILED';
              WorkOsLogAndDeadLetter.recordMessageError(
                error,
                {
                  message_id: failure.record.message_id,
                  thread_id: failure.record.thread_id,
                  retry_count: failure.record.retry_count,
                  next_retry_at: failure.record.next_retry_at,
                  processing_status:
                    failure.record.processing_status,
                  resume_stage:
                    WorkOsMessageStateRepository
                      .checkpointStageForResumeStage(
                        failure.record.resume_stage
                      )
                },
                runId,
                spreadsheet,
                errorContext
              );
            }
            summary.note = safe.code;
            stopNewWork = true;
            return { ready: false, failed: true };
          }
        }

        function advanceOne(record, candidate, source) {
          if (summary.processed_count >= automaticMaxMessages ||
              !ensureBudget()) {
            return false;
          }
          var preparation = preprocessIfNeeded(record, candidate);
          if (!preparation.ready) {
            if (preparation.skipped) {
              summary.skipped_count += 1;
            } else {
              summary.processed_count += 1;
            }
            return false;
          }
          var afterPreprocess =
            WorkOsMessageStateRepository.getByMessageId(
              messageContext,
              record.message_id
            );
          var isRealProvider = String(
            WorkOsAiAdapter.getMetadata(adapter).provider || ''
          ).toUpperCase() !== 'MOCK';
          var isNetworkFreeExternalTest =
            WorkOsConfig.TEST_MODE &&
            adapter instanceof WorkOsAiAdapter.ExternalAiAdapter &&
            adapter.settings &&
            adapter.settings.transport instanceof
              WorkOsAiAdapter.MockHttpTransport;
          isNetworkFreeExternalTest = isNetworkFreeExternalTest ||
            (!WorkOsConfig.TEST_MODE &&
             !(adapter instanceof WorkOsAiAdapter.ExternalAiAdapter));
          if (isRealProvider && !isNetworkFreeExternalTest &&
              afterPreprocess &&
              afterPreprocess.resume_stage ===
                WorkOsMessageStateRepository.RESUME_STAGES.CLASSIFY) {
            summary.note = 'AI_CLASSIFICATION_DEFERRED_TO_LOCK_FREE_STAGE';
            stopNewWork = true;
            return true;
          }
          var preprocessedForVertical =
            preparation.preprocessed || null;
          if (!preprocessedForVertical &&
              productionClassification &&
              productionClassification.message_id === record.message_id) {
            preprocessedForVertical =
              productionClassification.preprocessed_result;
          }
          var vertical = processVerticalOnce({
            spreadsheet: spreadsheet,
            gateway: gateway,
            preprocessor: preprocessor,
            adapter: adapter,
            now: clock,
            budget: budget,
            held_lock: lock,
            message_context: messageContext,
            task_context: taskContext,
            outbox_context: outboxContext,
            error_context: errorContext,
            selected_message_id: record.message_id,
            preprocessed_result: preprocessedForVertical,
            gmail_label_cache: getGmailLabelCache(),
            gmail_call_meter: gmailCallMeter,
            calendar_jobs_remaining: calendarRemaining,
            skip_run_summary: true,
            internal_scheduled_capability:
              INTERNAL_SCHEDULED_CAPABILITY,
            calendar_gateway: settings.calendar_gateway,
            properties: props,
            calendar_properties: settings.calendar_properties ||
              settings.properties,
            instance_id: settings.instance_id
          });
          summary.processed_count += Number(
            vertical.processed_count || 0
          );
          summary.created_task_count += Number(
            vertical.created_task_count || 0
          );
          summary.updated_task_count += Number(
            vertical.updated_task_count || 0
          );
          summary.review_count += Number(vertical.review_count || 0);
          summary.error_count += Number(vertical.error_count || 0);
          summary.calendar_job_count += Number(
            vertical.calendar_job_count || 0
          );
          calendarRemaining = Math.max(
            0,
            calendarRemaining -
              Number(vertical.calendar_job_count || 0)
          );
          if (source === 'BACKLOG') {
            summary.backlog_processed_count += Number(
              vertical.processed_count || 0
            );
          } else {
            summary.inbox_processed_count += Number(
              vertical.processed_count || 0
            );
          }
          if (vertical.status === 'FAILED' ||
              vertical.status === 'PAUSED') {
            summary.run_status = vertical.status;
            summary.note = vertical.status === 'PAUSED'
              ? 'CHECKPOINT_PAUSED'
              : 'MESSAGE_FAILED';
            stopNewWork = true;
            return false;
          }
          return true;
        }

        var backlog = eligibleScheduledRecords(
          messageContext,
          clock(),
          providerSuppression
        );
        for (var backlogIndex = 0;
          backlogIndex < backlog.length &&
          summary.processed_count < automaticMaxMessages &&
          !stopNewWork;
          backlogIndex += 1) {
          advanceOne(backlog[backlogIndex], null, 'BACKLOG');
        }

        if (stopNewWork ||
            summary.processed_count >= automaticMaxMessages ||
            !ensureBudget()) {
          return;
        }
        if (providerSuppression.active) {
          summary.run_status = 'PAUSED';
          summary.note = providerSuppression.invalid_state
            ? 'E_PROVIDER_SUPPRESSION_STATE'
            : 'AI_PROVIDER_RETRY_SUPPRESSED';
          return;
        }
        var systemRetry = WorkOsLogAndDeadLetter.systemRetryStatus(
          ['GMAIL_SEARCH', 'STATE_WRITE'],
          spreadsheet,
          clock(),
          errorContext
        );
        if (!systemRetry.allowed) {
          summary.run_status = 'PAUSED';
          summary.note = systemRetry.reason;
          summary.system_retry_deferred = true;
          return;
        }

        var watermark = safePropertyDate(props.getProperty(
          WorkOsConfig.PROPERTIES.AUTOMATION_WATERMARK_AT
        ));
        var cycleUpper = safePropertyDate(props.getProperty(
          WorkOsConfig.PROPERTIES.AUTOMATION_SCAN_UPPER_AT
        ));
        if (!cycleUpper) {
          cycleUpper = clock();
          props.setProperty(
            WorkOsConfig.PROPERTIES.AUTOMATION_SCAN_UPPER_AT,
            cycleUpper.toISOString()
          );
        }
        if (watermark &&
            cycleUpper.getTime() < watermark.getTime()) {
          throw new WorkOsAppError(
            'E_AUTOMATION_SCAN_STATE_INVALID',
            'AUTOMATIC_SCAN_STATE',
            false,
            '自動検索のwatermarkとupper boundが矛盾しています。'
          );
        }
        cyclePageToken = String(props.getProperty(
          WorkOsConfig.PROPERTIES.AUTOMATION_SCAN_PAGE_TOKEN
        ) || '');
        if (cyclePageToken.length > 2048 ||
            /[\u0000-\u001f]/.test(cyclePageToken)) {
          throw new WorkOsAppError(
            'E_AUTOMATION_SCAN_STATE_INVALID',
            'AUTOMATIC_SCAN_STATE',
            false,
            '自動検索の保存page tokenが不正です。'
          );
        }
        var knownMessageIds = {};
        Object.keys(messageContext.byMessageId).forEach(function (id) {
          knownMessageIds[id] = true;
        });
        systemFailureSubsystem = 'GMAIL_SEARCH';
        var search = gateway.listAutomaticCandidates({
          watermark_at: watermark,
          upper_bound_at: cycleUpper,
          page_token: cyclePageToken,
          known_message_ids: knownMessageIds,
          max_threads: WorkOsConfig.AUTOMATION_MAX_SEARCH_THREADS,
          page_size: WorkOsConfig.AUTOMATION_SEARCH_PAGE_SIZE,
          max_messages: automaticMaxMessages -
            summary.processed_count,
          budget: budget,
          reserve_ms: WorkOsConfig.AUTOMATION_WORKER_RESERVE_MS,
          label_cache: getGmailLabelCache(),
          call_meter: gmailCallMeter
        });
        systemFailureSubsystem = 'STATE_WRITE';
        WorkOsLogAndDeadLetter.resolveSystemErrors(
          ['GMAIL_SEARCH'],
          spreadsheet,
          clock(),
          errorContext
        );
        summary.candidate_count = search.candidates.length;
        summary.gmail_filter_counts = search.filter_counts || {};
        summary.search_saturated =
          search.search_saturated === true ||
          search.candidate_overflow === true;

        var searchCompletedSafely = true;
        for (var candidateIndex = 0;
          candidateIndex < search.candidates.length &&
          summary.processed_count < automaticMaxMessages &&
          !stopNewWork;
          candidateIndex += 1) {
          var candidate = search.candidates[candidateIndex];
          var discovery =
            WorkOsMessageStateRepository.discoverInContext(
              candidate,
              messageContext,
              clock()
            );
          if (!advanceOne(discovery.record, candidate, 'INBOX')) {
            searchCompletedSafely = false;
            break;
          }
        }
        if (!searchCompletedSafely || stopNewWork) {
          return;
        }
        if (search.search_complete) {
          props.setProperty(
            WorkOsConfig.PROPERTIES.AUTOMATION_WATERMARK_AT,
            cycleUpper.toISOString()
          );
          props.deleteProperty(
            WorkOsConfig.PROPERTIES.AUTOMATION_SCAN_UPPER_AT
          );
          props.deleteProperty(
            WorkOsConfig.PROPERTIES.AUTOMATION_SCAN_PAGE_TOKEN
          );
          summary.watermark_advanced = true;
        } else {
          props.setProperty(
            WorkOsConfig.PROPERTIES.AUTOMATION_SCAN_UPPER_AT,
            cycleUpper.toISOString()
          );
          if (search.resume_page_token) {
            props.setProperty(
              WorkOsConfig.PROPERTIES.AUTOMATION_SCAN_PAGE_TOKEN,
              String(search.resume_page_token)
            );
          } else {
            props.deleteProperty(
              WorkOsConfig.PROPERTIES.AUTOMATION_SCAN_PAGE_TOKEN
            );
          }
        }
        WorkOsLogAndDeadLetter.resolveSystemErrors(
          ['STATE_WRITE'],
          spreadsheet,
          clock(),
          errorContext
        );
      }, WorkOsConfig.LOCK_WAIT_MS);
    } catch (error) {
      var safe = WorkOsUtilities.safeError(
        error,
        'AUTOMATIC_WORKER'
      );
      summary.run_status = isExecutionPauseCode(safe.code)
        ? 'PAUSED'
        : 'FAILED';
      summary.note = safe.code;
      if (!isExecutionPauseCode(safe.code)) {
        summary.error_count += 1;
      }
      if ((safe.code === 'E_GMAIL_FETCH' ||
           safe.code === 'E_GMAIL_PAGINATION_LOOP') &&
          cyclePageToken) {
        try {
          /*
           * Keep the fixed upper bound and restart that bounded cycle from its
           * first page. Durable Message IDs make the replay idempotent.
           */
          props.deleteProperty(
            WorkOsConfig.PROPERTIES.AUTOMATION_SCAN_PAGE_TOKEN
          );
          summary.scan_cursor_reset = true;
          summary.note += ';SCAN_CURSOR_RESET';
        } catch (cursorResetError) {
          summary.scan_cursor_reset = false;
          summary.note += ';SCAN_CURSOR_RESET_FAILED';
        }
      }
      if (!isExecutionPauseCode(safe.code) && lockAcquired) {
        deferredOperationalError = {
          error: error,
          metadata: {
            subsystem: systemFailureSubsystem,
            fallback_stage: 'GMAIL_SEARCH',
            resume_stage: 'CLAIMED',
            last_attempt_at: clock()
          }
        };
      }
    }

    var finishedAt = clock();
    summary.finished_at = finishedAt;
    summary.duration_ms = Math.max(
      0,
      finishedAt.getTime() - startedAt.getTime()
    );
    summary.gmail_api_call_count =
      gmailCallMetric(gmailCallMeter, 'count');
    summary.gmail_api_call_limit =
      gmailCallMetric(gmailCallMeter, 'limit');
    var logRecorded = false;
    if (lockAcquired) {
      try {
        WorkOsLogAndDeadLetter.appendRunSummary(
          summary,
          spreadsheet,
          deferredOperationalError
        );
        logRecorded = true;
      } catch (logError) {
        logRecorded = false;
      }
    }
    return {
      run_id: runId,
      status: summary.run_status,
      candidate_count: summary.candidate_count,
      processed_count: summary.processed_count,
      backlog_processed_count: summary.backlog_processed_count,
      inbox_processed_count: summary.inbox_processed_count,
      created_task_count: summary.created_task_count,
      updated_task_count: summary.updated_task_count,
      review_count: summary.review_count,
      calendar_job_count: summary.calendar_job_count,
      error_count: summary.error_count,
      gmail_api_call_count: summary.gmail_api_call_count,
      gmail_api_call_limit: summary.gmail_api_call_limit,
      gmail_filter_counts: summary.gmail_filter_counts || {},
      search_saturated: summary.search_saturated,
      watermark_advanced: summary.watermark_advanced,
      scan_cursor_reset: summary.scan_cursor_reset === true,
      provider_retry_suppressed:
        summary.provider_retry_suppressed === true,
      system_retry_deferred: summary.system_retry_deferred === true,
      ai_classified_outside_lock_count:
        summary.ai_classified_outside_lock_count,
      ai_transport_outside_lock:
        summary.ai_transport_outside_lock === true,
      duration_ms: summary.duration_ms,
      log_recorded: logRecorded,
      external_services: {
        gmail: summary.candidate_count ||
          summary.inbox_processed_count
          ? 'ADVANCED_GMAIL_SERVICE'
          : 'SEARCH_ONLY_OR_NOT_CALLED',
        ai: summary.processed_count
          ? 'CONFIGURED_ADAPTER'
          : 'NOT_CALLED',
        calendar: summary.calendar_job_count
          ? 'ADVANCED_CALENDAR_SERVICE'
          : 'NOT_CALLED'
      }
    };
  }

  function processAutomaticBatch(options) {
    var settings = options || {};
    if (Object.keys(settings).length && !WorkOsConfig.TEST_MODE) {
      throw new WorkOsAppError(
        'E_TEST_MODE_DISABLED',
        'AUTOMATIC_WORKER',
        false,
        'Workerへの依存注入はTest modeだけで利用できます。'
      );
    }
    var spreadsheet = boundSpreadsheet(settings);
    var runtimeSettings = runtimeSettingsSnapshot(
      spreadsheet,
      settings
    );
    var pilotOnly = isAutomationPilotMode(settings);
    var gateway = settings.gateway || WorkOsGmailGateway;
    var properties = workerProperties(settings);
    var clock = typeof settings.now === 'function'
      ? settings.now
      : function () { return WorkOsUtilities.now(); };
    var startedAt = clock();
    var runId = WorkOsUtilities.makeId('run_');
    var budget = settings.budget || WorkOsUtilities.createSoftBudget(
      runtimeSettings.automation_worker_soft_limit_ms,
      Date.now()
    );
    var callMeter = createGmailCallMeter(
      gateway,
      WorkOsConfig.AUTOMATION_GMAIL_API_CALL_LIMIT,
      settings.gmail_call_meter
    );
    var gmailLabelCache =
      settings.gmail_label_cache || null;
    var gmailLabelCacheLoaded =
      Boolean(gmailLabelCache);

    function getGmailLabelCache() {
      if (!gmailLabelCacheLoaded) {
        gmailLabelCache = typeof gateway.loadLabelCache === 'function'
          ? gateway.loadLabelCache(callMeter)
          : null;
        gmailLabelCacheLoaded = true;
      }
      return gmailLabelCache;
    }
    var summary = {
      run_id: runId,
      mode: pilotOnly ? 'AUTO_PILOT' : 'AUTO_PHASE6',
      started_at: startedAt,
      candidate_count: 0,
      processed_count: 0,
      backlog_processed_count: 0,
      inbox_processed_count: 0,
      created_task_count: 0,
      updated_task_count: 0,
      review_count: 0,
      calendar_job_count: 0,
      skipped_count: 0,
      error_count: 0,
      run_status: 'COMPLETE',
      note: 'Bounded automation; lock-free external I/O',
      search_saturated: false,
      watermark_advanced: false,
      ai_classified_outside_lock_count: 0,
      ai_transport_outside_lock: true,
      canonical_schema_rule: ''
    };
    var workerLease = null;
    var adapter = null;
    var providerSuppression = {
      active: false,
      until: ''
    };
    var cycleSnapshot = null;
    var deferredError = null;
    var errorContext = null;
    var systemFailureSubsystem = 'STATE_WRITE';
    var calendarJobLimit = null;
    var pilotStartAt = null;

    function addVerticalResult(result, source) {
      summary.processed_count += Number(result.processed_count || 0);
      summary.created_task_count += Number(
        result.created_task_count || 0
      );
      summary.updated_task_count += Number(
        result.updated_task_count || 0
      );
      summary.review_count += Number(result.review_count || 0);
      summary.calendar_job_count += Number(
        result.calendar_job_count || 0
      );
      summary.error_count += Number(result.error_count || 0);
      if (result.canonical_schema_rule) {
        summary.canonical_schema_rule =
          WorkOsUtilities.safeCanonicalSchemaRule(
            result.canonical_schema_rule
          );
      }
      if (source === 'BACKLOG') {
        summary.backlog_processed_count += Number(
          result.processed_count || 0
        );
      } else {
        summary.inbox_processed_count += Number(
          result.processed_count || 0
        );
      }
      if (result.status === 'FAILED' ||
          result.status === 'PAUSED') {
        summary.run_status = result.status;
        summary.note = result.status === 'PAUSED'
          ? 'CHECKPOINT_PAUSED'
          : 'MESSAGE_FAILED';
        return false;
      }
      return true;
    }

    function runVertical(record, candidate, source) {
      var result = processVerticalOnce({
        spreadsheet: spreadsheet,
        gateway: gateway,
        preprocessor: settings.preprocessor ||
          WorkOsEmailPreprocessor,
        adapter: adapter,
        now: clock,
        budget: budget,
        selected_message_id: record.message_id,
        candidate: candidate || null,
        gmail_call_meter: callMeter,
        gmail_label_cache: getGmailLabelCache(),
        calendar_jobs_remaining:
          Math.max(
            0,
            calendarJobLimit -
              summary.calendar_job_count
          ),
        skip_run_summary: true,
        internal_scheduled_capability:
          INTERNAL_SCHEDULED_CAPABILITY,
        worker_lease: workerLease,
        run_id: runId,
        calendar_gateway: settings.calendar_gateway,
        properties: properties,
        calendar_properties: settings.calendar_properties ||
          properties,
        instance_id: settings.instance_id,
        error_context: errorContext
      });
      return addVerticalResult(result, source);
    }

    try {
      calendarJobLimit = configuredCalendarJobLimit();
      workerLease = acquireWorkerLease(
        properties,
        runId,
        summary.mode,
        clock,
        runtimeSettings.automation_worker_soft_limit_ms
      );
      if (!workerLease.acquired) {
        summary.run_status = 'BUSY';
        summary.note = 'WORKER_LEASE_ACTIVE';
      } else if (budget.isExhausted(
        WorkOsConfig.AUTOMATION_WORKER_RESERVE_MS
      )) {
        summary.run_status = 'PAUSED';
        summary.note = 'E_BUDGET_EXHAUSTED';
      } else {
        if (pilotOnly) {
          pilotStartAt = automaticPilotStartBoundary(properties);
        }
        providerSuppression = WorkOsUtilities.withScriptLock(
          function () {
            errorContext =
              WorkOsLogAndDeadLetter.createErrorContext(spreadsheet);
            return WorkOsLogAndDeadLetter
              .providerSuppressionStatus(
                properties,
                clock()
              );
          },
          WorkOsConfig.LOCK_WAIT_MS
        );
        if (providerSuppression.active) {
          summary.run_status = 'PAUSED';
          summary.note = providerSuppression.invalid_state
            ? 'E_PROVIDER_SUPPRESSION_STATE'
            : 'AI_PROVIDER_RETRY_SUPPRESSED';
          summary.provider_retry_suppressed = true;
        } else {
          if (WorkOsConfig.TEST_MODE &&
              !settings.adapter &&
              !settings.adapter_mode) {
            throw new WorkOsAppError(
              'E_AI_ADAPTER_REQUIRED',
              'AI_CONFIG',
              false,
              'TEST_MODEの自動処理には明示的なMock Adapterが必要です。'
            );
          }
          adapter = WorkOsAiAdapter.createAdapter({
            adapter: settings.adapter,
            adapter_options: settings.adapter_options || {},
            mode: settings.adapter_mode || '',
            production: !WorkOsConfig.TEST_MODE
          });
          if (!WorkOsConfig.TEST_MODE &&
              WorkOsAiAdapter.getMetadata(adapter).provider ===
                'MOCK') {
            adapter =
              WorkOsAiAdapter.createProductionExternalAdapter();
          }
          var automaticMaxMessages = pilotOnly
            ? Math.max(
              1,
              Math.min(
                WorkOsConfig.AUTOMATION_PILOT_MAX_MESSAGES_PER_RUN,
                Number(
                  runtimeSettings.automation_max_messages_per_run
                )
              )
            )
            : WorkOsConfig.TEST_MODE
              ? 10
            : Math.max(
              1,
              Math.min(
                WorkOsConfig.AUTOMATION_MAX_MESSAGES_PER_RUN,
                Number(
                  runtimeSettings.automation_max_messages_per_run
                )
              )
            );
          var backlog = WorkOsUtilities.withScriptLock(
            function (lock) {
              var context =
                WorkOsMessageStateRepository
                  .createContextForHeldLock(
                    WorkOsMessageStateRepository.messageSheet(
                      spreadsheet
                    ),
                    lock
                  );
              return eligibleScheduledRecords(
                context,
                clock(),
                providerSuppression
              ).map(function (record) {
                return {
                  message_id: record.message_id,
                  thread_id: record.thread_id,
                  stable_thread_key:
                    record.stable_thread_key,
                  received_at: record.received_at,
                  source_mode: record.source_mode,
                  manual_decision: record.manual_decision,
                  resume_stage: record.resume_stage
                };
              }).filter(function (record) {
                if (pilotOnly) {
                  if (!isAutomationPilotRecord(record)) {
                    return false;
                  }
                  var receivedAt = record.received_at instanceof Date
                    ? record.received_at
                    : new Date(record.received_at);
                  return !isNaN(receivedAt.getTime()) &&
                    receivedAt.getTime() >= pilotStartAt.getTime();
                }
                return WorkOsConfig.TEST_MODE === true ||
                  String(record.source_mode || '') ===
                    WorkOsConfig.AUTOMATION_QUALIFICATION_SOURCE_MODE;
              });
            },
            WorkOsConfig.LOCK_WAIT_MS
          );
          for (var backlogIndex = 0;
              backlogIndex < backlog.length &&
              summary.processed_count < automaticMaxMessages;
              backlogIndex += 1) {
            if (budget.isExhausted(
              WorkOsConfig.AUTOMATION_WORKER_RESERVE_MS
            )) {
              summary.run_status = 'PAUSED';
              summary.note = 'E_BUDGET_EXHAUSTED';
              break;
            }
            if (!runVertical(
              backlog[backlogIndex],
              null,
              'BACKLOG'
            )) {
              break;
            }
          }
          if (summary.run_status === 'COMPLETE' &&
              summary.processed_count < automaticMaxMessages) {
            var systemRetry = WorkOsUtilities.withScriptLock(
              function () {
                return WorkOsLogAndDeadLetter.systemRetryStatus(
                  ['GMAIL_SEARCH', 'STATE_WRITE'],
                  spreadsheet,
                  clock(),
                  errorContext
                );
              },
              WorkOsConfig.LOCK_WAIT_MS
            );
            if (!systemRetry.allowed) {
              summary.run_status = 'PAUSED';
              summary.note = systemRetry.reason;
              summary.system_retry_deferred = true;
            }
          }
          if (summary.run_status === 'COMPLETE' &&
              summary.processed_count < automaticMaxMessages) {
            cycleSnapshot = WorkOsUtilities.withScriptLock(
              function (lock) {
                var context =
                  WorkOsMessageStateRepository
                    .createContextForHeldLock(
                      WorkOsMessageStateRepository.messageSheet(
                        spreadsheet
                      ),
                      lock
                    );
                var watermarkRaw = String(
                  properties.getProperty(
                    WorkOsConfig.PROPERTIES
                      .AUTOMATION_WATERMARK_AT
                  ) || ''
                );
                var upperRaw = String(
                  properties.getProperty(
                    WorkOsConfig.PROPERTIES
                      .AUTOMATION_SCAN_UPPER_AT
                  ) || ''
                );
                var pageToken = String(
                  properties.getProperty(
                    WorkOsConfig.PROPERTIES
                      .AUTOMATION_SCAN_PAGE_TOKEN
                  ) || ''
                );
                var watermark = safePropertyDate(watermarkRaw);
                var upper = safePropertyDate(upperRaw);
                if (!upper) {
                  upper = clock();
                  upperRaw = upper.toISOString();
                  properties.setProperty(
                    WorkOsConfig.PROPERTIES
                      .AUTOMATION_SCAN_UPPER_AT,
                    upperRaw
                  );
                }
                if (watermark &&
                    upper.getTime() < watermark.getTime()) {
                  throw new WorkOsAppError(
                    'E_AUTOMATION_SCAN_STATE_INVALID',
                    'AUTOMATIC_SCAN_STATE',
                    false,
                    'Automation scan upper boundがwatermarkより前です。'
                  );
                }
                if (pageToken.length > 2048 ||
                    /[\u0000-\u001f]/.test(pageToken)) {
                  throw new WorkOsAppError(
                    'E_AUTOMATION_SCAN_STATE_INVALID',
                    'AUTOMATIC_SCAN_STATE',
                    false,
                    'Automation scan page tokenが不正です。'
                  );
                }
                var known = {};
                Object.keys(context.byMessageId).forEach(
                  function (messageId) {
                    known[messageId] = true;
                  }
                );
                return {
                  watermark_raw: watermarkRaw,
                  upper_raw: upperRaw,
                  page_token: pageToken,
                  watermark: watermark,
                  upper: upper,
                  known_message_ids: known
                };
              },
              WorkOsConfig.LOCK_WAIT_MS
            );
            systemFailureSubsystem = 'GMAIL_SEARCH';
            var search = gateway.listAutomaticCandidates({
              watermark_at: cycleSnapshot.watermark,
              upper_bound_at: cycleSnapshot.upper,
              page_token: cycleSnapshot.page_token,
              known_message_ids:
                cycleSnapshot.known_message_ids,
              max_threads:
                WorkOsConfig.AUTOMATION_MAX_SEARCH_THREADS,
              page_size:
                WorkOsConfig.AUTOMATION_SEARCH_PAGE_SIZE,
              max_messages:
                automaticMaxMessages -
                  summary.processed_count,
              budget: budget,
              reserve_ms:
                WorkOsConfig.AUTOMATION_WORKER_RESERVE_MS,
              label_cache: getGmailLabelCache(),
              call_meter: callMeter,
              pilot_only: pilotOnly,
              pilot_start_at: pilotStartAt,
              qualification_only: !pilotOnly &&
                (WorkOsConfig.TEST_MODE !== true ||
                  settings.qualification_only === true)
            });
            systemFailureSubsystem = 'STATE_WRITE';
            summary.candidate_count = search.candidates.length;
            summary.gmail_filter_counts =
              search.filter_counts || {};
            summary.search_saturated =
              search.search_saturated === true ||
              search.candidate_overflow === true;
            var discovered = WorkOsUtilities.withScriptLock(
              function (lock) {
                WorkOsLogAndDeadLetter.resolveSystemErrors(
                  ['GMAIL_SEARCH'],
                  spreadsheet,
                  clock(),
                  errorContext
                );
                var context =
                  WorkOsMessageStateRepository
                    .createContextForHeldLock(
                      WorkOsMessageStateRepository.messageSheet(
                        spreadsheet
                      ),
                      lock
                    );
                return search.candidates.map(function (candidate) {
                  return WorkOsMessageStateRepository
                    .discoverInContext(
                      candidate,
                      context,
                      clock()
                    ).record;
                });
              },
              WorkOsConfig.LOCK_WAIT_MS
            );
            var allCandidatesCompleted = true;
            for (var candidateIndex = 0;
                candidateIndex < discovered.length &&
                summary.processed_count < automaticMaxMessages;
                candidateIndex += 1) {
              if (!runVertical(
                discovered[candidateIndex],
                search.candidates[candidateIndex],
                'INBOX'
              )) {
                allCandidatesCompleted = false;
                break;
              }
            }
            if (allCandidatesCompleted &&
                summary.run_status === 'COMPLETE') {
              WorkOsUtilities.withScriptLock(function () {
                var currentUpper = String(
                  properties.getProperty(
                    WorkOsConfig.PROPERTIES
                      .AUTOMATION_SCAN_UPPER_AT
                  ) || ''
                );
                var currentToken = String(
                  properties.getProperty(
                    WorkOsConfig.PROPERTIES
                      .AUTOMATION_SCAN_PAGE_TOKEN
                  ) || ''
                );
                if (currentUpper !== cycleSnapshot.upper_raw ||
                    currentToken !== cycleSnapshot.page_token) {
                  throw new WorkOsAppError(
                    'E_AUTOMATION_SCAN_CAS_CONFLICT',
                    'AUTOMATIC_SCAN_STATE',
                    true,
                    'Automation scan cursor ownershipが変更されました。'
                  );
                }
                if (search.search_complete) {
                  properties.setProperty(
                    WorkOsConfig.PROPERTIES
                      .AUTOMATION_WATERMARK_AT,
                    cycleSnapshot.upper.toISOString()
                  );
                  properties.deleteProperty(
                    WorkOsConfig.PROPERTIES
                      .AUTOMATION_SCAN_UPPER_AT
                  );
                  properties.deleteProperty(
                    WorkOsConfig.PROPERTIES
                      .AUTOMATION_SCAN_PAGE_TOKEN
                  );
                  summary.watermark_advanced = true;
                } else {
                  properties.setProperty(
                    WorkOsConfig.PROPERTIES
                      .AUTOMATION_SCAN_UPPER_AT,
                    cycleSnapshot.upper.toISOString()
                  );
                  if (search.resume_page_token) {
                    properties.setProperty(
                      WorkOsConfig.PROPERTIES
                        .AUTOMATION_SCAN_PAGE_TOKEN,
                      String(search.resume_page_token)
                    );
                  } else {
                    properties.deleteProperty(
                      WorkOsConfig.PROPERTIES
                        .AUTOMATION_SCAN_PAGE_TOKEN
                    );
                  }
                }
                WorkOsLogAndDeadLetter.resolveSystemErrors(
                  ['STATE_WRITE'],
                  spreadsheet,
                  clock(),
                  errorContext
                );
              }, WorkOsConfig.LOCK_WAIT_MS);
            }
          }
        }
      }
    } catch (error) {
      var safe = WorkOsUtilities.safeError(
        error,
        'AUTOMATIC_WORKER'
      );
      summary.run_status = isExecutionPauseCode(safe.code)
        ? 'PAUSED'
        : 'FAILED';
      summary.note = safe.code;
      if (!isExecutionPauseCode(safe.code)) {
        summary.error_count += 1;
      }
      if ((safe.code === 'E_GMAIL_FETCH' ||
           safe.code === 'E_GMAIL_PAGINATION_LOOP') &&
          cycleSnapshot &&
          cycleSnapshot.page_token) {
        try {
          WorkOsUtilities.withScriptLock(function () {
            if (String(
              properties.getProperty(
                WorkOsConfig.PROPERTIES
                  .AUTOMATION_SCAN_PAGE_TOKEN
              ) || ''
            ) === cycleSnapshot.page_token) {
              properties.deleteProperty(
                WorkOsConfig.PROPERTIES
                  .AUTOMATION_SCAN_PAGE_TOKEN
              );
              summary.scan_cursor_reset = true;
              summary.note += ';SCAN_CURSOR_RESET';
            }
          }, WorkOsConfig.LOCK_WAIT_MS);
        } catch (cursorError) {
          summary.note += ';SCAN_CURSOR_RESET_FAILED';
        }
      }
      if (!isExecutionPauseCode(safe.code)) {
        deferredError = {
          error: error,
          metadata: {
            subsystem: /^E_AI_/.test(safe.code)
              ? 'AI_REQUEST'
              : systemFailureSubsystem,
            fallback_stage: 'AUTOMATIC_WORKER',
            resume_stage: 'CLAIMED',
            last_attempt_at: clock()
          },
          error_context: errorContext
        };
      }
    }
    try {
      releaseWorkerLease(properties, workerLease);
    } catch (releaseError) {
      summary.note += ';WORKER_LEASE_RELEASE_PENDING';
    }
    var finishedAt = clock();
    summary.finished_at = finishedAt;
    summary.duration_ms = Math.max(
      0,
      finishedAt.getTime() - startedAt.getTime()
    );
    summary.gmail_api_call_count = gmailCallMetric(
      callMeter,
      'count'
    );
    summary.gmail_api_call_limit = gmailCallMetric(
      callMeter,
      'limit'
    );
    var logRecorded = appendRunSummarySafely(
      summary,
      spreadsheet,
      deferredError
    );
    return {
      run_id: runId,
      status: summary.run_status,
      note: summary.note,
      candidate_count: summary.candidate_count,
      processed_count: summary.processed_count,
      backlog_processed_count:
        summary.backlog_processed_count,
      inbox_processed_count: summary.inbox_processed_count,
      created_task_count: summary.created_task_count,
      updated_task_count: summary.updated_task_count,
      review_count: summary.review_count,
      calendar_job_count: summary.calendar_job_count,
      error_count: summary.error_count,
      gmail_api_call_count: summary.gmail_api_call_count,
      gmail_api_call_limit: summary.gmail_api_call_limit,
      gmail_filter_counts: summary.gmail_filter_counts || {},
      search_saturated: summary.search_saturated,
      watermark_advanced: summary.watermark_advanced,
      scan_cursor_reset: summary.scan_cursor_reset === true,
      provider_retry_suppressed:
        summary.provider_retry_suppressed === true,
      system_retry_deferred:
        summary.system_retry_deferred === true,
      ai_classified_outside_lock_count:
        summary.ai_classified_outside_lock_count,
      ai_transport_outside_lock: true,
      canonical_schema_rule: summary.canonical_schema_rule,
      duration_ms: summary.duration_ms,
      log_recorded: logRecorded,
      external_services: {
        gmail: summary.candidate_count ||
          summary.inbox_processed_count
          ? 'ADVANCED_GMAIL_SERVICE'
          : 'SEARCH_ONLY_OR_NOT_CALLED',
        ai: summary.processed_count
          ? 'CONFIGURED_ADAPTER'
          : 'NOT_CALLED',
        calendar: summary.calendar_job_count
          ? 'ADVANCED_CALENDAR_SERVICE'
          : 'NOT_CALLED'
      }
    };
  }

  function runMockAcceptance(options) {
    WorkOsUtilities.assertTestMode('MOCK_ACCEPTANCE');
    var supplied = options || {};
    var shared = {};
    Object.keys(supplied).forEach(function (key) {
      shared[key] = supplied[key];
    });
    shared.budget = supplied.budget ||
      WorkOsUtilities.createSoftBudget(
        WorkOsConfig.MANUAL_WORKER_SOFT_LIMIT_MS,
        Date.now()
      );
    var phase2 = processManualImportOnce(shared);
    var phase3 = phase2.status === 'FAILED' ||
      phase2.status === 'PAUSED'
      ? {
        status: 'NOT_RUN',
        note: 'Phase 2 did not leave execution budget for Phase 3'
      }
      : processMockVerticalOnce(shared);
    return {
      status: phase2.status === 'FAILED' || phase3.status === 'FAILED'
        ? 'FAILED'
        : (phase2.status === 'PAUSED' || phase3.status === 'PAUSED'
          ? 'PAUSED'
          : 'COMPLETE'),
      phase2: phase2,
      phase3: phase3
    };
  }

  return Object.freeze({
    processManualImportOnce: processManualImportOnce,
    processMockVerticalOnce: processMockVerticalOnce,
    processProductionClassificationOnce:
      processProductionClassificationOnce,
    runGeminiSyntheticValidation: runGeminiSyntheticValidation,
    processAutomaticBatch: processAutomaticBatch,
    syncPendingCalendarJobs: syncPendingCalendarJobs,
    runMockAcceptance: runMockAcceptance
  });
}());

function processManualImportOnce() {
  return WorkOsWorker.processManualImportOnce();
}

function processMockVerticalOnce() {
  return WorkOsWorker.processMockVerticalOnce();
}

function runGeminiSyntheticValidationOnce() {
  return WorkOsWorker.runGeminiSyntheticValidation();
}

function syncPendingCalendarJobs() {
  return WorkOsWorker.syncPendingCalendarJobs();
}

function runMockAcceptance() {
  return WorkOsWorker.runMockAcceptance();
}
