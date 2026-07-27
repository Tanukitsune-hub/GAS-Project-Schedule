function onOpen() {
  var menu = SpreadsheetApp.getUi()
    .createMenu('讌ｭ蜍儖S v2')
    .addItem('蛻晄悄繧ｻ繝・ヨ繧｢繝・・', 'menuSetupSystem')
    .addItem('繧ｻ繝・ヨ繧｢繝・・繧堤ｶ夊｡・, 'menuContinueSetup')
    .addSeparator()
    .addItem('Quick Diagnostic', 'menuQuickDiagnostic')
    .addItem('Deep Diagnostic・域・遉ｺ繝ｻ隱ｭ蜿門ｰら畑・・, 'menuDeepDiagnostic')
    .addItem('驕狗畑Dashboard繧呈峩譁ｰ', 'menuRefreshDashboard')
    .addItem('閾ｪ蜍募・逅・・迥ｶ諷九ｒ遒ｺ隱・, 'menuAutomationStatus')
    .addItem('閾ｪ蜍募・逅・ｒ譏守､ｺ逧・↓譛牙柑蛹・, 'menuEnableAutomation')
    .addItem('閾ｪ蜍募・逅・ｒ蛛懈ｭ｢', 'menuDisableAutomation')
    .addItem('謇句虚/蜿冶ｾｼ繧・莉ｶ蜑榊・逅・, 'menuRunManualImport')
    .addItem('Task邱ｨ髮・ｒ謇句虚蜿肴丐・・allback・・, 'menuApplySelectedTaskEdits')
    .addItem('Calendar蜷梧悄繧・莉ｶ蜃ｦ逅・, 'menuSyncPendingCalendarJobs')
    .addItem('驕ｸ謚槭＠縺櫂ead Letter繧貞・螳溯｡御ｺ育ｴ・, 'menuRetrySelectedDeadLetters');
  if (WorkOsConfig.TEST_MODE === true) {
    menu
      .addSeparator()
      .addItem('Phase 1 Mock Task繧置psert', 'menuUpsertPhase1MockTask')
      .addItem('Phase 3/4 Mock邵ｦ繝輔Ο繝ｼ繧・莉ｶ蜃ｦ逅・, 'menuRunMockVertical')
      .addItem('Phase 1繝・せ繝医ｒ螳溯｡・, 'menuRunPhase1Tests')
      .addItem('Phase 2繝・せ繝医ｒ螳溯｡・, 'menuRunPhase2Tests')
      .addItem('Phase 3繝・せ繝医ｒ螳溯｡・, 'menuRunPhase3Tests')
      .addItem('Phase 4繝・せ繝医ｒ螳溯｡・, 'menuRunPhase4Tests')
      .addItem('Phase 5繝・せ繝医ｒ螳溯｡・, 'menuRunPhase5Tests')
      .addItem('Phase 6繝・せ繝医ｒ螳溯｡・, 'menuRunPhase6Tests')
      .addItem('Phase 7繝・せ繝医ｒ螳溯｡・, 'menuRunPhase7Tests');
  }
  menu.addToUi();
}

function menuSetupSystem() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'v2 蛻晄悄繧ｻ繝・ヨ繧｢繝・・',
    '譁ｰ縺励＞遨ｺ縺ｮSpreadsheet縺ｾ縺溘・蜀埼幕蜿ｯ閭ｽ縺ｪv2迺ｰ蠅・□縺代′蟇ｾ雎｡縺ｧ縺吶よ里蟄倥ョ繝ｼ繧ｿ縺ｮMigration繝ｻ蜑企勁縺ｯ陦後＞縺ｾ縺帙ｓ縲よｮｵ髫主・逅・〒縺ｯSheet/Protection縲∵ｭ｣蠑秀mail繝ｩ繝吶Ν7莉ｶ縲∝ｰら畑secondary Calendar縲∵園譛芽・nstallable edit Trigger繧剃ｽ懈・縺励∪縺吶る壼ｸｸInbox蜃ｦ逅・∝ｮ蘗I謗･邯壹・蛻・rigger縺ｯ髢句ｧ九○縺壹∬・蜍募・逅・・蛛懈ｭ｢縺ｮ縺ｾ縺ｾ縺ｧ縺吶らｶ夊｡後＠縺ｾ縺吶°縲・,
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_('蛻晄悄繧ｻ繝・ヨ繧｢繝・・', setupSystem());
}

function menuContinueSetup() {
  var ui = SpreadsheetApp.getUi();
  var preview = WorkOsSetup.getNextStagePreview();
  var response = ui.alert(
    '繧ｻ繝・ヨ繧｢繝・・繧堤ｶ夊｡・,
    '谺｡縺ｮstage: ' + preview.next_stage + '\n' +
      preview.description + '\n\n' +
      '騾壼ｸｸInbox蜃ｦ逅・∝ｮ蘗I謗･邯壹・蛻・rigger縺ｯ髢句ｧ九＠縺ｾ縺帙ｓ縲らｶ夊｡後＠縺ｾ縺吶°縲・,
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_('繧ｻ繝・ヨ繧｢繝・・繧堤ｶ夊｡・, continueSetup());
}

function menuQuickDiagnostic() {
  showSafeResult_('Quick Diagnostic', runQuickDiagnostic());
}

function menuDeepDiagnostic() {
  showSafeResult_('Deep Diagnostic', runDeepDiagnostic());
}

function menuRefreshDashboard() {
  showSafeResult_(
    '驕狗畑Dashboard繧呈峩譁ｰ',
    refreshOperationalDashboard()
  );
}

function menuAutomationStatus() {
  showSafeResult_('閾ｪ蜍募・逅・・迥ｶ諷・, getAutomationStatus());
}

function menuEnableAutomation() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    '閾ｪ蜍募・逅・ｒ譛牙柑蛹・,
    '5蛻・俣髫斐・騾壼ｸｸInbox蜃ｦ逅・ｒ譛牙柑蛹悶＠縺ｾ縺吶ょｮ蘖rovider縲∽ｼ夂､ｾ謇ｿ隱阪…redential菫晉ｮ｡縲＾Auth縲∝ｰら畑Calendar縺ｮ蜈ｨ譚｡莉ｶ縺梧悴螳御ｺ・↑繧牙ｮ牙・縺ｫ諡貞凄縺輔ｌ縺ｾ縺吶４etup縺九ｉ縺ｯ譛牙柑蛹悶＆繧後∪縺帙ｓ縲らｶ夊｡後＠縺ｾ縺吶°縲・,
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_('閾ｪ蜍募・逅・ｒ譛牙柑蛹・, enableAutomation());
}

function menuDisableAutomation() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    '閾ｪ蜍募・逅・ｒ蛛懈ｭ｢',
    'Automation繧貞・縺ｫdisabled縺ｸ螟画峩縺励√％縺ｮsystem縺ｮrunScheduledWorker Trigger縺縺代ｒ蜑企勁縺励∪縺吶ら┌髢｢菫５rigger縺ｯ蜑企勁縺励∪縺帙ｓ縲らｶ夊｡後＠縺ｾ縺吶°縲・,
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_('閾ｪ蜍募・逅・ｒ蛛懈ｭ｢', disableAutomation());
}

function menuUpsertPhase1MockTask() {
  WorkOsUtilities.assertTestMode('MENU_PHASE1_MOCK_TASK');
  showSafeResult_('Phase 1 Mock Task', WorkOsTaskRepository.upsertPhase1MockTask());
}

function menuRunPhase1Tests() {
  WorkOsUtilities.assertTestMode('MENU_PHASE1_TESTS');
  showSafeResult_('Phase 1繝・せ繝・, runPhase1AcceptanceTests());
}

function menuRunManualImport() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Gmail謇句虚蜿冶ｾｼ',
    '謇句虚/蜿冶ｾｼ繝ｩ繝吶Ν莉倥″縺ｮ髱樊ｩ溷ｯ・ユ繧ｹ繝医Γ繝ｼ繝ｫ繧呈怙螟ｧ1莉ｶ縺縺大燕蜃ｦ逅・＠縺ｾ縺吶５ask繧Гalendar縺ｯ螟画峩縺励∪縺帙ｓ縲らｶ夊｡後＠縺ｾ縺吶°縲・,
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_('Gmail謇句虚蜿冶ｾｼ', runManualImport());
}

function menuRunPhase2Tests() {
  WorkOsUtilities.assertTestMode('MENU_PHASE2_TESTS');
  showSafeResult_('Phase 2繝・せ繝・, runPhase2AcceptanceTests());
}

function menuRunMockVertical() {
  WorkOsUtilities.assertTestMode('MENU_MOCK_VERTICAL');
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Phase 3/4 Mock邵ｦ繝輔Ο繝ｼ',
    'PREPROCESSED縺ｮ繝繝溘・繝・せ繝・essage繧呈怙螟ｧ1莉ｶ縲∵ｱｺ螳夂噪Mock AI縺九ｉCalendar Outbox縺ｾ縺ｧ蜃ｦ逅・＠縺ｾ縺吶ょ､夜ΚAI縺ｯ蜻ｼ縺ｳ縺ｾ縺帙ｓ縲ょｰら畑Calendar縺ｸ縺ｯ譛螟ｧ1 Job縺縺大酔譛溘＠縺ｾ縺吶らｶ夊｡後＠縺ｾ縺吶°縲・,
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_('Phase 3/4 Mock邵ｦ繝輔Ο繝ｼ', processMockVerticalOnce());
}

function menuApplySelectedTaskEdits() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Task邱ｨ髮・・蛻､譁ｭ縺ｮ蜿肴丐',
    '騾壼ｸｸ縺ｯ謇譛芽・nstallable edit Trigger縺後そ繝ｫ邱ｨ髮・凾縺ｫ閾ｪ蜍募渚譏縺励∪縺吶ゅ％縺ｮfallback縺ｧ縺ｯ縲√ち繧ｹ繧ｯ荳隕ｧ縺ｧ邱ｨ髮・＠縺溘そ繝ｫ・域怙螟ｧ20陦鯉ｼ峨ｒ驕ｸ謚槭＠縺ｦ縺上□縺輔＞縲・mail縲、I縲，alendar API縺ｯ蜻ｼ縺ｳ縺ｾ縺帙ｓ縲らｶ夊｡後＠縺ｾ縺吶°縲・,
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_('Task邱ｨ髮・・蛻､譁ｭ縺ｮ蜿肴丐', applySelectedTaskEdits());
}

function menuRunPhase3Tests() {
  WorkOsUtilities.assertTestMode('MENU_PHASE3_TESTS');
  showSafeResult_('Phase 3繝・せ繝・, runPhase3AcceptanceTests());
}

function menuSyncPendingCalendarJobs() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    '蟆ら畑Calendar蜷梧悄',
    '蜷梧悄迥ｶ諷九・蠕・ｩ櫟ob繧呈怙螟ｧ1莉ｶ縺縺大・逅・＠縺ｾ縺吶よ嶌霎ｼ縺ｿ蜈医・蟆ら畑Calendar縲瑚・蜍墓悄譌･邂｡逅・阪□縺代〒縺吶・mail繝ｻAI繝ｻTask縺ｮ讌ｭ蜍咎・岼縺ｯ蜀榊・逅・＠縺ｾ縺帙ｓ縲らｶ夊｡後＠縺ｾ縺吶°縲・,
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_('蟆ら畑Calendar蜷梧悄', syncPendingCalendarJobs());
}

function menuRetrySelectedDeadLetters() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Dead Letter繧貞・螳溯｡御ｺ育ｴ・,
    '繧ｨ繝ｩ繝ｼ繝ｻ蜀榊ｮ溯｡郡heet縺ｧ縲悟・螳溯｡後阪↓繝√ぉ繝・け縺励◆DEAD陦後ｒ譛螟ｧ5莉ｶ縺縺台ｺ育ｴ・＠縺ｾ縺吶よ悴隗｣豎ｺ縺ｮ險ｭ螳壹］on-retryable縲・㍾隍・ｺ育ｴ・・諡貞凄縺輔ｌ縺ｾ縺吶・mail ID縺ｯ陦ｨ遉ｺ縺励∪縺帙ｓ縲らｶ夊｡後＠縺ｾ縺吶°縲・,
    ui.ButtonSet.OK_CANCEL
  );
  if (response !== ui.Button.OK) {
    return;
  }
  showSafeResult_(
    'Dead Letter繧貞・螳溯｡御ｺ育ｴ・,
    retrySelectedDeadLetters()
  );
}

function menuRunPhase4Tests() {
  WorkOsUtilities.assertTestMode('MENU_PHASE4_TESTS');
  showSafeResult_('Phase 4繝・せ繝・, runPhase4AcceptanceTests());
}

function menuRunPhase5Tests() {
  WorkOsUtilities.assertTestMode('MENU_PHASE5_TESTS');
  showSafeResult_('Phase 5繝・せ繝・, runPhase5AcceptanceTests());
}

function menuRunPhase6Tests() {
  WorkOsUtilities.assertTestMode('MENU_PHASE6_TESTS');
  showSafeResult_('Phase 6繝・せ繝・, runPhase6AcceptanceTests());
}

function menuRunPhase7Tests() {
  WorkOsUtilities.assertTestMode('MENU_PHASE7_TESTS');
  showSafeResult_('Phase 7繝・せ繝・, runPhase7AcceptanceTests());
}

function nextActionForResult_(title, value) {
  var result = value || {};
  var status = String(result.status || '螳御ｺ・);
  if (status === 'PAUSED') {
    if (result.next_stage || /繧ｻ繝・ヨ繧｢繝・・/.test(String(title || ''))) {
      return '谺｡縺ｮ謫堺ｽ・ 繧ｻ繝・ヨ繧｢繝・・繧堤ｶ夊｡後＠縺ｦ縺上□縺輔＞縲・;
    }
    return '谺｡縺ｮ謫堺ｽ・ 蜷後§繝｡繝九Η繝ｼ謫堺ｽ懊ｒ蜀榊ｮ溯｡後＠縺ｦ縺上□縺輔＞縲ゆｿ晏ｭ俶ｸ医∩checkpoint縺九ｉ蜀埼幕縺励∪縺吶・;
  }
  if (status === 'FAILED' || status === 'FAIL') {
    return '谺｡縺ｮ謫堺ｽ・ error code繧堤｢ｺ隱阪＠縲＿uick Diagnostic繧貞ｮ溯｡後＠縺ｦ縺上□縺輔＞縲・;
  }
  return '谺｡縺ｮ謫堺ｽ・ 蠢・ｦ√↓蠢懊§縺ｦDashboard縺ｾ縺溘・迥ｶ諷狗｢ｺ隱阪ｒ螳溯｡後＠縺ｦ縺上□縺輔＞縲・;
}

function showSafeResult_(title, result) {
  var value = result || {};
  var status = String(value.status || '螳御ｺ・);
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
  var summary = '迥ｶ諷・ ' + status +
    (value.code ? '\nCode: ' + String(value.code) : '') +
    (value.next_stage
      ? '\n谺｡stage: ' + String(value.next_stage)
      : '') +
    counts + '\n' + action;
  var details = WorkOsUtilities.redact(
    JSON.stringify(value, null, 2)
  );
  var maxDetails = 10500;
  if (details.length > maxDetails) {
    details = details.slice(0, maxDetails) +
      '\n\n[隧ｳ邏ｰ縺ｯ陦ｨ遉ｺ荳企剞縺ｮ縺溘ａ蛻・ｊ隧ｰ繧√∪縺励◆]';
  }
  SpreadsheetApp.getUi().alert(
    title,
    summary + '\n\n--- 螳牙・縺ｪ隧ｳ邏ｰ ---\n' + details,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

