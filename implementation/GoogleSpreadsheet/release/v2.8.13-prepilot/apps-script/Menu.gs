function onOpen() {
  var menu = SpreadsheetApp.getUi()
    .createMenu('業務OS v2')
    .addItem('初期セットアップ', 'menuSetupSystem')
    .addItem('セットアップを続行', 'menuContinueSetup')
    .addSeparator()
    .addItem('Quick Diagnostic', 'menuQuickDiagnostic')
    .addItem('Deep Diagnostic（明示・読取専用）', 'menuDeepDiagnostic')
    .addItem('運用Dashboardを更新', 'menuRefreshDashboard')
    .addItem('自動処理の状態を確認', 'menuAutomationStatus')
    .addItem('自動処理を明示的に有効化', 'menuEnableAutomation')
    .addItem('自動処理を停止', 'menuDisableAutomation')
    .addItem('手動/取込を1件前処理', 'menuRunManualImport')
    .addItem('Task編集を手動反映（fallback）', 'menuApplySelectedTaskEdits')
    .addItem('Calendar同期を1件処理', 'menuSyncPendingCalendarJobs')
    .addItem('選択したDead Letterを再実行予約', 'menuRetrySelectedDeadLetters');
  menu.addItem(
    '選択したReviewを再stage',
    'menuRestageSelectedReview'
  );
  if (WorkOsConfig.TEST_MODE === true) {
    menu
      .addSeparator()
      .addItem('Phase 1 Mock Taskをupsert', 'menuUpsertPhase1MockTask')
      .addItem('Phase 3/4 Mock縦フローを1件処理', 'menuRunMockVertical')
      .addItem('Phase 1テストを実行', 'menuRunPhase1Tests')
      .addItem('Phase 2テストを実行', 'menuRunPhase2Tests')
      .addItem('Phase 3テストを実行', 'menuRunPhase3Tests')
      .addItem('Phase 4テストを実行', 'menuRunPhase4Tests')
      .addItem('Phase 5テストを実行', 'menuRunPhase5Tests')
      .addItem('Phase 6テストを実行', 'menuRunPhase6Tests')
      .addItem('Phase 7テストを実行', 'menuRunPhase7Tests');
  }
  menu.addToUi();
}

function menuSetupSystem() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'v2 初期セットアップ',
    '新しい空のSpreadsheetまたは再開可能なv2環境だけが対象です。既存データのMigration・削除は行いません。段階処理ではSheet/Protection、正式Gmailラベル7件、専用secondary Calendar、所有者installable edit Triggerを作成します。通常Inbox処理、実AI接続、5分Triggerは開始せず、自動処理は停止のままです。続行しますか。',
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_('初期セットアップ', setupSystem());
}

function menuContinueSetup() {
  var ui = SpreadsheetApp.getUi();
  var preview = WorkOsSetup.getNextStagePreview();
  var response = ui.alert(
    'セットアップを続行',
    '次のstage: ' + preview.next_stage + '\n' +
      preview.description + '\n\n' +
      '通常Inbox処理、実AI接続、5分Triggerは開始しません。続行しますか。',
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_('セットアップを続行', continueSetup());
}

function menuQuickDiagnostic() {
  showSafeResult_('Quick Diagnostic', runQuickDiagnostic());
}

function menuDeepDiagnostic() {
  showSafeResult_('Deep Diagnostic', runDeepDiagnostic());
}

function menuRefreshDashboard() {
  showSafeResult_(
    '運用Dashboardを更新',
    refreshOperationalDashboard()
  );
}

function menuAutomationStatus() {
  showSafeResult_('自動処理の状態', getAutomationStatus());
}

function menuEnableAutomation() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    '自動処理を有効化',
    '5分間隔の通常Inbox処理を有効化します。実Provider、会社承認、credential保管、OAuth、専用Calendarの全条件が未完了なら安全に拒否されます。Setupからは有効化されません。続行しますか。',
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_('自動処理を有効化', enableAutomation());
}

function menuDisableAutomation() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    '自動処理を停止',
    'Automationを先にdisabledへ変更し、このsystemのrunScheduledWorker Triggerだけを削除します。無関係Triggerは削除しません。続行しますか。',
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_('自動処理を停止', disableAutomation());
}

function menuUpsertPhase1MockTask() {
  WorkOsUtilities.assertTestMode('MENU_PHASE1_MOCK_TASK');
  showSafeResult_('Phase 1 Mock Task', WorkOsTaskRepository.upsertPhase1MockTask());
}

function menuRunPhase1Tests() {
  WorkOsUtilities.assertTestMode('MENU_PHASE1_TESTS');
  showSafeResult_('Phase 1テスト', runPhase1AcceptanceTests());
}

function menuRunManualImport() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Gmail手動取込',
    '手動/取込ラベル付きの非機密テストメールを最大1件だけ前処理します。TaskやCalendarは変更しません。続行しますか。',
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_('Gmail手動取込', runManualImport());
}

function menuRunPhase2Tests() {
  WorkOsUtilities.assertTestMode('MENU_PHASE2_TESTS');
  showSafeResult_('Phase 2テスト', runPhase2AcceptanceTests());
}

function menuRunMockVertical() {
  WorkOsUtilities.assertTestMode('MENU_MOCK_VERTICAL');
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Phase 3/4 Mock縦フロー',
    'PREPROCESSEDのダミーテストMessageを最大1件、決定的Mock AIからCalendar Outboxまで処理します。外部AIは呼びません。専用Calendarへは最大1 Jobだけ同期します。続行しますか。',
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_('Phase 3/4 Mock縦フロー', processMockVerticalOnce());
}

function menuApplySelectedTaskEdits() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Task編集・判断の反映',
    '通常は所有者installable edit Triggerがセル編集時に自動反映します。このfallbackでは、タスク一覧で編集したセル（最大20行）を選択してください。Gmail、AI、Calendar APIは呼びません。続行しますか。',
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_('Task編集・判断の反映', applySelectedTaskEdits());
}

function menuRestageSelectedReview() {
  var ui = SpreadsheetApp.getUi();
  var range = SpreadsheetApp.getActiveRange();
  var preview = WorkOsEditHandler.inspectRestageSelection(range);
  var response = ui.alert(
    '選択したReviewを再stage',
    'Task一覧の行 ' + String(preview.physical_row) +
      ' にあるOPEN Reviewを、現在の業務状態を基準に再stageします。\n' +
      '確認後に対象が変わった場合は安全のため中止します。続行しますか？',
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_(
    '選択したReviewを再stage',
    WorkOsEditHandler.restageSelectedReviewRange(
      range,
      WorkOsUtilities.now(),
      preview
    )
  );
}

function menuRunPhase3Tests() {
  WorkOsUtilities.assertTestMode('MENU_PHASE3_TESTS');
  showSafeResult_('Phase 3テスト', runPhase3AcceptanceTests());
}

function menuSyncPendingCalendarJobs() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    '専用Calendar同期',
    '同期状態の待機Jobを最大1件だけ処理します。書込み先は専用Calendar「自動期日管理」だけです。Gmail・AI・Taskの業務項目は再処理しません。続行しますか。',
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_('専用Calendar同期', syncPendingCalendarJobs());
}

function menuRetrySelectedDeadLetters() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Dead Letterを再実行予約',
    'エラー・再実行Sheetで「再実行」にチェックしたDEAD行を最大5件だけ予約します。未解決の設定、non-retryable、重複予約は拒否されます。Gmail IDは表示しません。続行しますか。',
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_(
    'Dead Letterを再実行予約',
    retrySelectedDeadLetters()
  );
}

function menuRunPhase4Tests() {
  WorkOsUtilities.assertTestMode('MENU_PHASE4_TESTS');
  showSafeResult_('Phase 4テスト', runPhase4AcceptanceTests());
}

function menuRunPhase5Tests() {
  WorkOsUtilities.assertTestMode('MENU_PHASE5_TESTS');
  showSafeResult_('Phase 5テスト', runPhase5AcceptanceTests());
}

function menuRunPhase6Tests() {
  WorkOsUtilities.assertTestMode('MENU_PHASE6_TESTS');
  showSafeResult_('Phase 6テスト', runPhase6AcceptanceTests());
}

function menuRunPhase7Tests() {
  WorkOsUtilities.assertTestMode('MENU_PHASE7_TESTS');
  showSafeResult_('Phase 7テスト', runPhase7AcceptanceTests());
}

function nextActionForResult_(title, value) {
  var result = value || {};
  var status = String(result.status || '完了');
  if (status === 'PAUSED') {
    if (result.next_stage || /セットアップ/.test(String(title || ''))) {
      return '次の操作: セットアップを続行してください。';
    }
    return '次の操作: 同じメニュー操作を再実行してください。保存済みcheckpointから再開します。';
  }
  if (status === 'FAILED' || status === 'FAIL') {
    return '次の操作: error codeを確認し、Quick Diagnosticを実行してください。';
  }
  return '次の操作: 必要に応じてDashboardまたは状態確認を実行してください。';
}

function boundedAcceptanceSummaryInteger_(value) {
  var numberValue = Number(value);
  return isFinite(numberValue) && numberValue >= 0 &&
    Math.floor(numberValue) === numberValue && numberValue <= 100000
    ? String(numberValue)
    : 'UNKNOWN';
}

function boundedAcceptanceSummaryBoolean_(value) {
  if (value === true) {
    return 'true';
  }
  if (value === false) {
    return 'false';
  }
  return 'UNKNOWN';
}

function boundedAcceptanceSummaryEnum_(value, allowed, fallback) {
  var text = String(value || '');
  return allowed.indexOf(text) !== -1 ? text : fallback;
}

function boundedAcceptanceSummaryIds_(value, complete) {
  if (!Array.isArray(value)) {
    return 'UNAVAILABLE';
  }
  var previous = '';
  var valid = value.every(function (candidate) {
    var id = String(candidate || '');
    var accepted = /^[A-Za-z][A-Za-z0-9_]{0,47}$/.test(id) &&
      (previous === '' || previous < id);
    previous = id;
    return accepted;
  });
  if (!valid) {
    return 'UNAVAILABLE';
  }
  var completeness = boundedAcceptanceSummaryBoolean_(complete);
  if (completeness === 'UNKNOWN') {
    return 'UNAVAILABLE';
  }
  return (value.length ? value.join(', ') : '(none)') +
    ' [complete=' + completeness + ']';
}

function formatBoundedAcceptanceSummary_(summary) {
  var value = summary || {};
  var contract = String(value.summary_contract_id || '');
  if (contract !== 'WORK_OS_V2_DIAGNOSTIC_ACCEPTANCE_SUMMARY_V1') {
    contract = 'UNAVAILABLE';
  }
  var kind = boundedAcceptanceSummaryEnum_(
    value.diagnostic_kind,
    ['QUICK', 'DEEP_MANUAL_READ_ONLY'],
    'UNKNOWN'
  );
  var status = boundedAcceptanceSummaryEnum_(
    value.status,
    ['PASS', 'WARN', 'FAIL'],
    'UNKNOWN'
  );
  var completeness = boundedAcceptanceSummaryEnum_(
    value.acceptance_summary_status,
    ['COMPLETE', 'REVIEW_REQUIRED'],
    'REVIEW_REQUIRED'
  );
  var lines = [
    '--- Bounded Acceptance Summary ---',
    'summary_contract_id=' + contract,
    'diagnostic_kind=' + kind,
    'status=' + status,
    'pass_count=' + boundedAcceptanceSummaryInteger_(value.pass_count),
    'warn_count=' + boundedAcceptanceSummaryInteger_(value.warn_count),
    'fail_count=' + boundedAcceptanceSummaryInteger_(value.fail_count),
    'not_executed_count=' +
      boundedAcceptanceSummaryInteger_(value.not_executed_count),
    'warn_check_ids=' + boundedAcceptanceSummaryIds_(
      value.warn_check_ids,
      value.warn_ids_complete
    ),
    'fail_check_ids=' + boundedAcceptanceSummaryIds_(
      value.fail_check_ids,
      value.fail_ids_complete
    ),
    'acceptance_summary_status=' + completeness,
    'external_services_called=' +
      boundedAcceptanceSummaryBoolean_(value.external_services_called),
    'writes_performed=' +
      boundedAcceptanceSummaryBoolean_(value.writes_performed),
    'spreadsheet_write_performed=' +
      boundedAcceptanceSummaryBoolean_(value.spreadsheet_write_performed),
    'properties_write_performed=' +
      boundedAcceptanceSummaryBoolean_(value.properties_write_performed),
    'trigger_write_performed=' +
      boundedAcceptanceSummaryBoolean_(value.trigger_write_performed),
    'flush_performed=' +
      boundedAcceptanceSummaryBoolean_(value.flush_performed),
    'calendar_api_called=' +
      boundedAcceptanceSummaryBoolean_(value.calendar_api_called),
    'gmail_api_called=' +
      boundedAcceptanceSummaryBoolean_(value.gmail_api_called),
    'external_ai_request_performed=' +
      boundedAcceptanceSummaryBoolean_(value.external_ai_request_performed),
    'dashboard_repair_performed=' +
      boundedAcceptanceSummaryBoolean_(value.dashboard_repair_performed),
    'task_physical_column_count=' +
      boundedAcceptanceSummaryInteger_(value.task_physical_column_count),
    'task_schema_ids_state=' + boundedAcceptanceSummaryEnum_(
      value.task_schema_ids_state,
      ['PASS', 'WARN', 'FAIL', 'NOT_EXECUTED', 'NOT_YET_IMPLEMENTED'],
      'UNKNOWN'
    ),
    'task_schema_headers_state=' + boundedAcceptanceSummaryEnum_(
      value.task_schema_headers_state,
      ['PASS', 'WARN', 'FAIL', 'NOT_EXECUTED', 'NOT_YET_IMPLEMENTED'],
      'UNKNOWN'
    ),
    'ledger_physical_column_count=' +
      boundedAcceptanceSummaryInteger_(value.ledger_physical_column_count),
    'ledger_hidden_state=' +
      boundedAcceptanceSummaryBoolean_(value.ledger_hidden_state),
    'ledger_protection_state=' +
      boundedAcceptanceSummaryBoolean_(value.ledger_protection_state),
    'ledger_authority_validator_state=' + boundedAcceptanceSummaryEnum_(
      value.ledger_authority_validator_state,
      ['PASS', 'WARN', 'FAIL', 'NOT_EXECUTED', 'NOT_YET_IMPLEMENTED'],
      'UNKNOWN'
    )
  ];
  return lines.join('\n');
}

function showSafeResult_(title, result) {
  var value = result || {};
  var status = String(value.status || '完了');
  var action = nextActionForResult_(title, value);
  var counts = '';
  if (Array.isArray(value.checks)) {
    var statusCounts = {};
    value.checks.forEach(function (item) {
      var key = String(item.status || 'UNKNOWN');
      statusCounts[key] = Number(statusCounts[key] || 0) + 1;
    });
    counts = '\nDiagnostic: ' + Object.keys(statusCounts)
      .map(function (key) {
        return key + '=' + statusCounts[key];
      }).join(', ');
  }
  var summary = '状態: ' + status +
    (value.code ? '\nCode: ' + String(value.code) : '') +
    (value.next_stage
      ? '\n次stage: ' + String(value.next_stage)
      : '') +
    counts + '\n' + action;
  if (value.acceptance_summary) {
    summary += '\n\n' +
      formatBoundedAcceptanceSummary_(value.acceptance_summary);
  }
  var details = WorkOsUtilities.redact(
    JSON.stringify(value, null, 2)
  );
  var maxDetails = 10500;
  if (details.length > maxDetails) {
    details = details.slice(0, maxDetails) +
      '\n\n[詳細は表示上限のため切り詰めました]';
  }
  SpreadsheetApp.getUi().alert(
    title,
    summary + '\n\n--- 安全な詳細 ---\n' + details,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
