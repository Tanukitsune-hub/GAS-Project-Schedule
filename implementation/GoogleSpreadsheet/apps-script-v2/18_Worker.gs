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
        'Script Properties繧貞茜逕ｨ縺ｧ縺阪∪縺帙ｓ縲・
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
        'Bound Spreadsheet縺九ｉ螳溯｡後＠縺ｦ縺上□縺輔＞縲・
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
      'soft execution budget縺ｫ驕斐＠縺溘◆繧∝ｮ牙・縺ｪcheckpoint縺ｧ蛛懈ｭ｢縺励∪縺励◆縲・
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
        'Runtime險ｭ螳嗄odule繧堤｢ｺ隱阪〒縺阪∪縺帙ｓ縲・
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
      WorkOsLogAndDeadLetter.appendRunSummary(
        summary,
        spreadsheet,
        deferredError
      );
      return true;
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
        'Worker縺ｸ縺ｮ萓晏ｭ俶ｳｨ蜈･縺ｯTest mode縺縺代〒蛻ｩ逕ｨ縺ｧ縺阪∪縺吶・
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
          var candidates = gateway.listManualCandidates({
            budget: budget,
            reserve_ms: WorkOsConfig.MANUAL_WORKER_RESERVE_MS,
            call_meter: gmailCallMeter
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
        'Worker縺ｸ縺ｮ萓晏ｭ俶ｳｨ蜈･縺ｯTest mode縺縺代〒蛻ｩ逕ｨ縺ｧ縺阪∪縺吶・
      );
    }
    var spreadsheet = boundSpreadsheet(settings);
    var runtimeSettings = runtimeSettingsSnapshot(
      spreadsheet,
      settings
    );
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
        var candidates = gateway.listManualCandidates({
          budget: budget,
          reserve_ms: WorkOsConfig.MANUAL_WORKER_RESERVE_MS,
          call_meter: callMeter
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
 …35212 tokens truncated…status;
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
              'TEST_MODE縺ｮ閾ｪ蜍募・逅・↓縺ｯ譏守､ｺ逧・↑Mock Adapter縺悟ｿ・ｦ√〒縺吶・
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
          var automaticMaxMessages = Math.max(
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
                    'Automation scan upper bound縺詣atermark繧医ｊ蜑阪〒縺吶・
                  );
                }
                if (pageToken.length > 2048 ||
                    /[\u0000-\u001f]/.test(pageToken)) {
                  throw new WorkOsAppError(
                    'E_AUTOMATION_SCAN_STATE_INVALID',
                    'AUTOMATIC_SCAN_STATE',
                    false,
                    'Automation scan page token縺御ｸ肴ｭ｣縺ｧ縺吶・
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
              call_meter: callMeter
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
                    'Automation scan cursor ownership縺悟､画峩縺輔ｌ縺ｾ縺励◆縲・
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

function syncPendingCalendarJobs() {
  return WorkOsWorker.syncPendingCalendarJobs();
}

function runMockAcceptance() {
  return WorkOsWorker.runMockAcceptance();
}

