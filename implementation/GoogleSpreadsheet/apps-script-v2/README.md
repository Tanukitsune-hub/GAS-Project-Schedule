# Google Workspace Personal Work OS v2 - 2.8.2-prepilot / Phase 8B Remediation

縺薙・Directory縺ｯ縲￣hase 1縲梧怙蟆輯heets蝓ｺ逶､縲阪°繧臼hase 7縲軍etry繝ｻDead Letter繝ｻ險ｺ譁ｭ縲阪∪縺ｧ繧貞ｮ溯｣・＠縺蘗pps Script縺ｧ縺吶よ眠縺励＞遨ｺ縺ｮGoogle Sheets縺ｸ邏舌▼縺代※菴ｿ逕ｨ縺励∪縺吶・
## 螳溯｣・ｸ医∩縺ｮ遽・峇

- Phase 1: 10蛟九・Sheet縲～繧ｿ繧ｹ繧ｯ荳隕ｧ`Schema縲∵ｮｵ髫惨etup縲ゝask Repository縲《ynthetic Mock Task縲＿uick Diagnostic縲ゝest Harness
- Phase 2: 豁｣蠑秀mail繝ｩ繝吶Ν7蛟九・蜀ｪ遲我ｽ懈・縲～謇句虚/蜿冶ｾｼ`髯仙ｮ壽､懃ｴ｢縲｀essage State縲ヾtable Thread Key縲∵悽譁・燕蜃ｦ逅・∵焔蜍標orker縲〉etry checkpoint
- Phase 3: provider-neutral AI螂醍ｴ・∵ｱｺ螳夂噪Mock Adapter縲《trict input/output/Action讀懆ｨｼ縲ゝask/Review/pending縲∵園譛芽・nstallable edit Trigger縺ｨ謇句虚fallback縲、I繝ｩ繝吶Ν蜷梧悄縲∝・鬘枋heckpoint蜀榊茜逕ｨ
- Phase 4: 蟆ら畑`閾ｪ蜍墓悄譌･邂｡逅・Calendar縲・㍾隕∵悄髯舌・邨よ律Event縲，alendar Outbox縲…reate/update/delete/no-op縲∵園譛盈arker縲，alendar-only retry縲ヾ99螳御ｺ・- Phase 5: strict External AI螂醍ｴ・］etwork-free Mock HTTP Transport縲‘rror taxonomy縲…lassification provenance縲∵里蟄・2迺ｰ蠅・・append-only Schema extension
- Phase 6: 譏守､ｺ逧・↑5蛻・LOCK Trigger lifecycle縲・壼ｸｸInbox縺ｮ蟆剰ｦ乗ｨ｡閾ｪ蜍募呵｣懈､懃ｴ｢縲・4譎る俣overlap縲｀essage ID蜀ｪ遲画ｧ縲‥urable scan cursor縲‥ue retry蜆ｪ蜈医・10遘痴oft budget
- Phase 7: 14 subsystem縺ｨ6 checkpoint縺ｮ蝗槫ｾｩ螂醍ｴ・∝・蝗橸ｼ・/15/60蛻・・譛螟ｧ4 attempt縲．ead Letter縲∝・驛ｨID髯仙ｮ壹・謇句虚蜀崎ｩｦ陦後｝rovider-wide謚大宛縲＿uick/Deep Diagnostic縲∬ｻｽ驥城°逕ｨDashboard縲∵里蟄・2 Error Schema縺ｮappend-only諡｡蠑ｵ

Phase 2縺ｮ謇句虚Worker縺ｯ1螳溯｡後↓縺､縺肴怙螟ｧ10 Threads繧呈､懃ｴ｢縺励∵悴蜃ｦ逅・essage繧呈怙螟ｧ1莉ｶ縺縺疏PREPROCESSED`縺ｾ縺ｧ騾ｲ繧√∪縺吶１hase 6縺ｮ閾ｪ蜍標orker縺ｯ騾壼ｸｸInbox繧・5 Threads/page縲∵怙螟ｧ100 Threads縲∵怙螟ｧ10 Messages/run縺ｧ讀懃ｴ｢縺励∬ｪｭ蜿也憾諷九↓縺ｯ萓晏ｭ倥＠縺ｾ縺帙ｓ縲よ､懃ｴ｢cycle縺ｯ蝗ｺ螳嗽pper bound縺ｨ24譎る俣overlap繧剃ｽｿ逕ｨ縺励‥ue retry繧呈眠隕終nbox繧医ｊ蜈医↓蜃ｦ逅・＠縺ｾ縺吶・ock邵ｦ繝輔Ο繝ｼ縺ｯ縲∝・鬘曷SON繧探ask蜑ｯ菴懃畑繧医ｊ蜈医↓菫晏ｭ倥＠縺ｦTask繧貞・遲峨↓譖ｸ縺阪、I繝ｩ繝吶Ν蜷梧悄蠕後↓`CALENDAR` checkpoint縺ｸ騾ｲ縺ｿ縺ｾ縺吶・alendar Outbox縺ｯ1螳溯｡後↓縺､縺肴怙螟ｧ1 job縺ｧ縺吶よ悽譁・→逶ｴ蜑肴枚閼医・蜃ｦ逅・ｸｭ縺ｮ繝｡繝｢繝ｪ縺縺代↓菫晄戟縺励ヾheet繧Лog縺ｸ菫晏ｭ倥＠縺ｾ縺帙ｓ縲・
Phase 5縺ｮ讀懆ｨｼ蠅・阜縺ｯ谺｡縺ｮ縺ｨ縺翫ｊ縺ｧ縺吶・
- Code implementation: `LOCAL PASS`
- Mock HTTP Transport: `LOCAL PASS`
- Real provider connection: `NOT EXECUTED`
- Company approval: `NOT CONFIRMED`
- Credential storage approval: `NOT CONFIRMED`

Phase 6縺ｮtime-driven閾ｪ蜍募喧縺ｯ蛻晄悄蛛懈ｭ｢縺ｧ縺吶４etup縺ｯTask邱ｨ髮・畑縺ｮ謇譛芽・nstallable edit Trigger縺縺代ｒ菴懈・縺励・蛻・LOCK Trigger縺ｯ菴懈・縺励∪縺帙ｓ縲ょｮ蘖rovider縲∽ｼ夂､ｾ謇ｿ隱阪…redential菫晉ｮ｡謇ｿ隱阪∬ｪ崎ｨｼ縲∵ｭ｣蠑上Λ繝吶Ν繝ｻSchema繝ｻversion繝ｻcurrent shared preflight縺ｮ蜈ｨ蜑肴署繧呈ｺ縺溘＠縲∝茜逕ｨ閠・′`閾ｪ蜍募・逅・ｒ譛牙柑蛹冒繧呈・遉ｺ螳溯｡後＠縺溷ｴ蜷医□縺・蛻・LOCK Trigger繧・莉ｶ縺ｫ豁｣隕丞喧縺励∪縺吶５rigger lifecycle縺ｯWorker縺ｮ蜃ｦ逅・ock縺ｨ蛻・屬縺励～enabled`縺ｨ`desired state`縺ｮ莠碁㍾kill-switch縺ｧ荳ｦ陦慧isable繧貞━蜈医＠縺ｾ縺吶ら樟蝨ｨ縺ｮ險ｭ螳壹〒縺ｯ螳蘖rovider transport縺悟ｭ伜惠縺励↑縺・◆繧∝ｮ滓怏蜉ｹ蛹悶・fail closed縺ｧ諡貞凄縺輔ｌ縲√Ο繝ｼ繧ｫ繝ｫFake縺縺代′Trigger lifecycle繧呈､懆ｨｼ縺励※縺・∪縺吶・
Phase 7縺ｯ螟ｱ謨励ｒ`繧ｨ繝ｩ繝ｼ繝ｻ蜀榊ｮ溯｡形縺ｸ1 subsystem繝ｻ1 safe reference蜊倅ｽ阪〒upsert縺励∵悽譁・∽ｻｶ蜷阪・∽ｿ｡閠・〉aw Gmail ID縲、I payload/response縲…redential繧剃ｿ晏ｭ倥＠縺ｾ縺帙ｓ縲り・蜍募・隧ｦ陦後・譛螟ｧ10莉ｶ/run縲∵焔蜍暮∈謚槭・譛螟ｧ5陦後〒縲～DEAD`縺九▽retryable縺ｧ蜑肴署譚｡莉ｶ縺瑚ｧ｣豎ｺ貂医∩縺ｮ鬆・岼縺縺代ｒ蜀・Κ`err_`/`dl_` ID縺九ｉ蜀埼幕縺励∪縺吶・essage縺ｫ邏舌▼縺九↑縺Жmail讀懃ｴ｢/迥ｶ諷九お繝ｩ繝ｼ繧・rror陦後・`next_retry_at`縺ｧ5/15/60蛻・ｒ蛻ｶ蠕｡縺励∵・蜉滓凾縺ｫ隗｣豎ｺ縺励∪縺吶１rovider-wide謚大宛荳ｭ縺ｯAI縺ｸ蛻ｰ驕斐＠蠕励ｋ`PREPROCESS`縺ｨ`CLASSIFY`繧貞ｻｶ譛溘＠縲∽ｿ晏ｭ俶ｸ医∩Task/Calendar checkpoint縺縺代ｒ邯咏ｶ壹〒縺阪∪縺吶２uick Diagnostic縺ｯ60遘堤岼讓吶・read-only縲．eep Diagnostic縺ｯ謇句虚繝ｻread-only繝ｻ蛻･entry point縺ｧ縲√＞縺壹ｌ繧Ｄhunk蜊倅ｽ阪〒budget繧堤｢ｺ隱阪＠縺ｾ縺吶ょｮ蘖rovider縲∝ｮ檬mail縲∝ｮ櫃alendar縲∝ｮ鬱rigger繧定ｨｺ譁ｭ縺九ｉ蜻ｼ縺ｳ縺ｾ縺帙ｓ縲・
`2.8.1-prepilot`縺ｧ縺ｯ縲仝orker蜈ｨ菴薙ｒ髟ｷ譎る俣菫晄戟縺吶ｋScript Lock繧貞ｻ・ｭ｢縺励｜ounded logical lease縺ｨ遏ｭ譎る俣縺ｮclaim・縦heckpoint・修AS Lock縺ｸ蛻・牡縺励∪縺励◆縲・mail search/body/label縲、I transport縲，alendar list/CRUD縺ｯLock螟悶〒螳溯｡後＠縺ｾ縺吶ょ､夜ΚCalendar譖ｴ譁ｰ蠕後↓Task/Outbox縺悟､牙喧縺励◆蝣ｴ蜷医・stale縺ｪ讌ｭ蜍冉ield繧帝←逕ｨ縺帙★縲∫樟蝨ｨ縺ｮTask縺ｨ隕ｳ貂ｬ貂医∩Event ID縺九ｉfresh reconciliation checkpoint繧剃ｽ懊ｊ縲・vent驥崎､・・蟄､遶九ｒ髦ｲ縺弱∪縺吶・ashboard縺ｯmarker莉倥″system-owned block縺縺代ｒ譖ｴ譁ｰ縺励｜lank-key蛟､繝ｻformula繝ｻmetadata縺ｾ縺溘・Quick Diagnostic conflict繧蜘rite蜑阪↓諡貞凄縺励∪縺吶ゅΟ繝ｼ繧ｫ繝ｫ邨先棡縺ｯ34 suites縲・71 PASS / 0 FAIL / 11 SKIPPED縺ｧ縲ヾKIPPED縺ｯ螳蘖rovider・丞ｮ檬oogle Workspace讀懆ｨｼ縺ｧ縺吶・
`2.8.2-prepilot`縺ｧ縺ｯ縲√さ繝ｼ繝臥屮譟ｻ縺ｮF-01・曦-12縺ｨ螳牙・縺ｫ驕ｩ逕ｨ縺ｧ縺阪ｋF-13繧剃ｿｮ豁｣縺励∪縺励◆縲・utomation縺ｮCalendar checkpoint邯咏ｶ壹∵悄髯・鬆・岼縺ｨ`MANUAL_CONFIRMED` provenance縲ヽeview Decision縺ｮexact target/CAS縲ゝask cross-field invariant縲｀essage蜊倅ｽ阪・謇句虚蜿冶ｾｼ縲～TEST_MODE=false` guard縲《ystem-owned Sheet Protection縲ヽELATIVE譛滄剞縺ｮ莠ｺ髢泥ecision gate縲｀ock/Production AI險ｺ譁ｭ蛻・屬繧定ｿｽ蜉縺励※縺・∪縺吶・alendar隱ｬ譏弱・譛滄剞譬ｹ諡縺ｯ譌･譛ｬ隱櫁｡ｨ遉ｺ縺ｧ縺吶４chema Version縺ｯ`MANUAL_CONFIRMED`霑ｽ蜉繧堤ｮ｡逅・☆繧九◆繧～2.3`縺ｸ荳翫￡縲∵里蟄倭2.2` Message State陦後ｒ繝・・繧ｿ菫晄戟縺励◆縺ｾ縺ｾ`2.3`縺ｸ譖ｴ譁ｰ縺ｧ縺阪∪縺吶・
Phase 8B逕ｨ`release/v2.8.2-prepilot/`縺ｯ`TEST_MODE=true`縲、utomation OFF縲ゝest Harness蜷梧｢ｱ縺ｧ縺吶１hase 8C蛟呵｣彖release/v2.8.2-prepilot-phase8c/`縺ｯ`TEST_MODE=false`縺ｸ縺ｮ蜊倅ｸ逶｣譟ｻ貂医∩Config螟画鋤繧帝勁縺行ource縺ｨ蜷御ｸ縺ｧ縲～99_TestHarness.gs`繧帝勁螟悶＠縺ｦ縺・∪縺吶ゆｸ｡payload縺ｯ蛻･package縺ｨ縺励※謇ｱ縺・∪縺吶１hase 8C縺ｯ螳蘖rovider譁ｹ驥昴・莨夂､ｾ謇ｿ隱阪・OAuth繝ｻ螳欷orkspace蜿怜・縺梧悴螳御ｺ・・縺溘ａ`NO-GO`縺ｧ縺吶・
Phase 8A縺ｧ縺ｯApps Script source繧貞､画峩縺帙★縲～release/v2.8.1-prepilot/`縺ｸ
TEST_MODE=true繝ｻAutomation OFF縺ｮ豎ｺ螳夂噪縺ｪ髱樊悽逡ｪSandbox蟆主・package繧剃ｽ懈・縺励∪縺励◆縲・驟咲ｽｮ蜑阪↓`DEPLOYMENT_MANIFEST.md`縺ｨ`CHECKSUMS.sha256`繧堤・蜷医＠縲・`SANDBOX_QUICKSTART.md`縺九ｉ謇句虚蜿怜・縺ｸ騾ｲ繧薙〒縺上□縺輔＞縲１hase 8B縺ｮ螳檬oogle
Workspace蜿怜・縲ゝEST_MODE=false縲∝ｮ蘖rovider謗･邯壹∝ｮ滓｡井ｻｶ繝代う繝ｭ繝・ヨ縺ｯ譛ｪ螳滓命縺ｧ縺吶・
谺｡縺ｯ譛ｪ螳溯｣・〒縺吶・
- 螳蘗I API縲｝rovider蝗ｺ譛陰dapter縲～UrlFetchApp`縺ｫ繧医ｋ螟夜Κ騾壻ｿ｡
- 螳蘖rovider繧剃ｽｿ縺・悽逡ｪ閾ｪ蜍募・逅・・譛牙柑蛹・- v1縺九ｉv2縺ｸ縺ｮMigration
- 隕∫｢ｺ隱榊ｰら畑繧ｿ繝悶∫峡遶貴anual繝｢繝ｼ繝・- 鬮伜ｺｦ縺ｪWork Block縲∵律谺｡繝ｻ騾ｱ谺｡review縲《chedule譛驕ｩ蛹也ｭ峨・蟆・擂諡｡蠑ｵ

v1.x縺ｨ縺ｯ髱樔ｺ呈鋤縺ｧ縺吶Ｗ1.x繧ｳ繝ｼ繝峨ｄ譌｢蟄牢heet繧偵さ繝斐・縲∝､画鋤縲∽ｸ頑嶌縺阪＠縺ｪ縺・〒縺上□縺輔＞縲・
## 菴懈・縺輔ｌ繧鬼heet

蛻ｩ逕ｨ閠・髄縺・

1. `繝繝・す繝･繝懊・繝荏
2. `繧ｿ繧ｹ繧ｯ荳隕ｧ`
3. `險ｭ螳啻
4. `蜃ｦ逅・ｱ･豁ｴ`
5. `繧ｨ繝ｩ繝ｼ繝ｻ蜀榊ｮ溯｡形
6. `菴ｿ縺・婿`

髱櫁｡ｨ遉ｺ邂｡逅・

1. `繝｡繝ｼ繝ｫ迥ｶ諷義
2. `繧ｷ繧ｹ繝・Β險ｭ螳啻
3. `繝励Ο繝ｳ繝励ヨ迚育ｮ｡逅・
4. `蜷梧悄迥ｶ諷義

`繧ｿ繧ｹ繧ｯ荳隕ｧ`縺ｯ陦・縺悟・驛ｨ蛻悠D縲∬｡・縺梧律譛ｬ隱櫁ｦ句・縺励∬｡・莉･髯阪′Task縺ｧ縺吶らｮ｡逅・・縺ｯ蜿ｳ蛛ｴ縺ｫ縺ゅｊ縲・撼陦ｨ遉ｺ縺ｧ縺吶５ask縺ｯ`task_id`縺ｾ縺溘・`origin_key`縺後≠繧玖｡後□縺代〒縺吶・
## 蟆主・謇矩・
1. 讖溷ｯ・ュ蝣ｱ繧貞性縺ｾ縺ｪ縺・∵眠縺励＞遨ｺ縺ｮGoogle Spreadsheet繧剃ｽ懈・縺励∪縺吶・2. `諡｡蠑ｵ讖溯・ > Apps Script`繧帝幕縺阪∪縺吶・3. 縺薙・Directory縺ｮ`.gs`繝輔ぃ繧､繝ｫ繧貞酔蜷阪〒菴懈・縺励∝・螳ｹ繧定ｲｼ繧贋ｻ倥￠縺ｾ縺吶・4. Apps Script縺ｮProject Settings縺ｧmanifest陦ｨ遉ｺ繧呈怏蜉ｹ縺ｫ縺励～appsscript.json`繧堤ｽｮ縺肴鋤縺医∪縺吶・5. Spreadsheet繧貞・隱ｭ霎ｼ縺励√Γ繝九Η繝ｼ`讌ｭ蜍儖S v2`繧定｡ｨ遉ｺ縺励∪縺吶・6. Apps Script縺ｮServices縺ｧAdvanced Gmail API v1縺ｨAdvanced Calendar API v3縺梧怏蜉ｹ縺ｧ縺ゅｋ縺薙→繧堤｢ｺ隱阪＠縺ｾ縺吶・7. `蛻晄悄繧ｻ繝・ヨ繧｢繝・・`繧貞ｮ溯｡後＠縲ヾpreadsheet縲￣rotection螳溯｡瑚・｢ｺ隱阪；mail縺ｨCalendar縺ｫ蠢・ｦ√↑manifest險倩ｼ鋭cope繧呈価隱阪＠縺ｾ縺吶・8. 豁｣蠑秀mail繝ｩ繝吶Ν7蛟九′荳崎ｶｳ蛻・□縺台ｽ懈・縺輔ｌ縲∝ｰら畑Calendar `閾ｪ蜍墓悄譌･邂｡逅・縺・蛟九□縺台ｽ懈・縺輔ｌ縲ヾetup縺郡99縺ｾ縺ｧ`COMPLETE`縺ｫ縺ｪ繧九％縺ｨ繧堤｢ｺ隱阪＠縺ｾ縺吶よ里蟄倥・蜷悟錐Calendar縺瑚､・焚縺ゅｋ蝣ｴ蜷医｝rimary Calendar縺ｧ縺ゅｋ蝣ｴ蜷医∵園譛峨・instance marker繧呈､懆ｨｼ縺ｧ縺阪↑縺・ｴ蜷医・螳牙・蛛懈ｭ｢縺梧ｭ｣縺励＞邨先棡縺ｧ縺吶・9. `Phase 1 Mock Task繧置psert`繧・蝗槫ｮ溯｡後＠縲・莉ｶ縺縺代↓縺ｪ繧九％縺ｨ繧堤｢ｺ隱阪＠縺ｾ縺吶・10. 閾ｪ蛻・°繧芽・蛻・∈莉ｶ蜷港[MOCK:NEW_HIGH] 譫ｶ遨ｺ雉・侭縺ｮ謠仙・`縺ｮ螳悟・縺ｪ譫ｶ遨ｺ繝｡繝ｼ繝ｫ繧帝√ｊ縲～謇句虚/蜿冶ｾｼ`繧剃ｻ倥￠縲～謇句虚/蜿冶ｾｼ繧・莉ｶ蜑榊・逅・繧貞ｮ溯｡後＠縺ｾ縺吶・11. `繝｡繝ｼ繝ｫ迥ｶ諷義縺ｫ譛ｬ譁・↑縺励・`PREPROCESSED` checkpoint縺・莉ｶ縺縺台ｽ懈・縺輔ｌ繧九％縺ｨ繧堤｢ｺ隱阪＠縺ｾ縺吶・12. `Phase 3/4 Mock邵ｦ繝輔Ο繝ｼ繧・莉ｶ蜃ｦ逅・繧貞ｮ溯｡後＠縲｀essage縺形DONE`縲・壼ｸｸTask縺形OPEN`縺ｫ縺ｪ繧翫∝酔縺倭origin_key`縺ｮTask縺ｨEvent縺碁㍾隍・＠縺ｪ縺・％縺ｨ繧堤｢ｺ隱阪＠縺ｾ縺吶Ｇixture縺靴alendar蟇ｾ雎｡螟悶↑繧峨∵ｭ｣蠑乗悄髯舌～FORCE`縲ヽeview隗｣豸育ｭ峨ｒ謇句虚蜿怜・Guide縺ｩ縺翫ｊ縺ｫ險ｭ螳壹＠縺ｾ縺吶・13. Review Task縺ｮ`蛻､譁ｭ`繧貞､画峩縺励（nstallable edit Trigger縺ｧ蜷後§陦後∈蜿怜・繝ｻ蜊ｴ荳九′閾ｪ蜍募渚譏縺輔ｌ繧九％縺ｨ繧堤｢ｺ隱阪＠縺ｾ縺吶ょ撫鬘梧凾縺縺大ｯｾ雎｡繧ｻ繝ｫ繧帝∈謚槭＠縲～Task邱ｨ髮・ｒ謇句虚蜿肴丐・・allback・荏繧剃ｽｿ逕ｨ縺励∪縺吶・14. `Calendar蜷梧悄繧・莉ｶ蜃ｦ逅・縺ｧ譛螟ｧ1 job縺縺大・逅・＆繧後ｋ縺薙→繧堤｢ｺ隱阪＠縺ｾ縺吶・15. `Quick Diagnostic`縲～驕狗畑Dashboard繧呈峩譁ｰ`縲∝ｿ・ｦ√↓蠢懊§縺ｦ`Deep Diagnostic・郁ｪｭ蜿門ｰら畑・荏縲￣hase 1・・縺ｮ蜷・ユ繧ｹ繝医ｒ螳溯｡後＠縺ｾ縺吶ょｮ蘖rovider縲∝ｮ殳ime-driven Trigger縲∝ｮ檬mail閾ｪ蜍墓､懃ｴ｢縺ｯ`NOT EXECUTED`縺ｮ縺ｾ縺ｾ縺ｧ縺吶・16. `繧ｨ繝ｩ繝ｼ繝ｻ蜀榊ｮ溯｡形縺ｮPhase 7邂｡逅・・縺ｫ縲．ead Letter縺ｮ蜀・ΚID縲《ubsystem縲‘rror category縲《afe reference縲〉esume stage縲∥ttempt縲］ext action縲∽ｽ懈・繝ｻ譖ｴ譁ｰ譌･譎ゅ′縺ゅｋ縺薙→繧堤｢ｺ隱阪＠縺ｾ縺吶・17. 螳溷､夜Κ髫懷ｮｳ繧剃ｽ懊ｉ縺壹↓縲￣hase 7 Harness縺ｮlocal鬆・岼縺・0 PASS縲∝ｮ溷屓蠕ｩ繝ｻ螳溯ｨｺ譁ｭ繝ｻ螳櫂ashboard鬆・岼縺・ SKIPPED縺ｧ縺ゅｋ縺薙→繧堤｢ｺ隱阪＠縺ｾ縺吶・
`setupSystem()`縺ｯS00・朶99繧帝・↓螳溯｡後＠縺ｾ縺吶４60縺ｯ蟆ら畑Calendar繧剃ｽ懈・縺ｾ縺溘・蜴ｳ蟇・↓蜀榊茜逕ｨ縺励ヾ80縺ｯ謇譛芽・ｒ遒ｺ隱阪＠縺ｦTask邱ｨ髮・畑installable edit Trigger繧・莉ｶ縺ｫ豁｣隕丞喧縺励∪縺吶４etup縺ｯGmail讀懃ｴ｢縲｀essage蜃ｦ逅・、I蛻・｡槭，alendar Event蜷梧悄縲・蛻・rigger菴懈・繧貞他縺ｳ縺ｾ縺帙ｓ縲ＡcontinueSetup()`縺ｯ谺｡stage縺ｨ蜑ｯ菴懃畑繧定｡ｨ遉ｺ縺励※縺九ｉ蜀埼幕縺励∪縺吶・
## 蛟句挨stage讀懆ｨｼ

Test Harness縺ｾ縺溘・Apps Script editor縺九ｉ縲∵ｬ｡縺ｮPhase 1 support stage繧貞句挨縺ｫ讀懆ｨｼ縺ｧ縺阪∪縺吶・
```javascript
WorkOsSetup.runStageForTest('S70_STORE_PROPERTIES');
WorkOsSetup.runStageForTest('S90_QUICK_DIAGNOSTIC');
WorkOsSetup.runStageForTest('S80_CREATE_EDIT_TRIGGER');
```

S50縺ｨS60縺ｯ蜈ｬ髢鬼etup縺九ｉ螳溯｡後＆繧後∪縺吶４80縺ｯTask邱ｨ髮・畑Trigger縺縺代ｒ菴懈・縺励∪縺吶Ｕime-driven閾ｪ蜍募・逅・rigger縺ｯSetup縺九ｉ菴懈・縺励∪縺帙ｓ縲・
## 謇句虚蜿怜・繝√ぉ繝・け

譁ｰ縺励＞繝・せ繝・preadsheet縺ｧ遒ｺ隱阪＠縺ｾ縺吶・
1. 譌｢螳售heet縺形繝繝・す繝･繝懊・繝荏縺ｸrename縺輔ｌ縲・0 Sheet縺御ｻ墓ｧ倬・↓縺ｪ繧九・2. 邂｡逅・ Sheet縺碁撼陦ｨ遉ｺ縺ｫ縺ｪ繧九・3. `繧ｿ繧ｹ繧ｯ荳隕ｧ`縺ｮ陦・縺悟・驛ｨID縲∬｡・縺梧律譛ｬ隱櫁ｦ句・縺励↓縺ｪ繧九・4. 譛蛻昴・Mock Task縺瑚｡・縺ｫ蜈･繧翫∝酔縺弄ock繧・蝗槫ｮ溯｡後＠縺ｦ繧・莉ｶ縺縺代↓縺ｪ繧九・5. 遨ｺ陦後・Checkbox繧ｻ繝ｫ縺檎ｩｺ縺ｧ縺ゅｊ縲。oolean蛟､`FALSE`縺悟・縺｣縺ｦ縺・↑縺・・6. `繧ｳ繝｡繝ｳ繝・縺ｸ閾ｪ逕ｱ險倩ｿｰ縺ｧ縺阪，heckbox縺瑚｡ｨ遉ｺ縺輔ｌ縺ｪ縺・・7. `蛻､譁ｭ`縲～蟇ｾ蠢懃憾豕～縲～譛滄剞譬ｹ諡`縲～蜆ｪ蜈亥ｺｦ`縲～Calendar逋ｻ骭ｲ`縺ｫ莉墓ｧ倥←縺翫ｊ縺ｮDropdown縺後≠繧九・8. `譛滄剞`縺ｨ`謗ｨ螂ｨ譛滄剞`縲∵律譎ょ・縺ｮ陦ｨ遉ｺ蠖｢蠑上′莉墓ｧ倥←縺翫ｊ縺ｧ縺ゅｋ縲・9. setup繧貞・螳溯｡後＠縺ｦ繧・ock Task縲∝茜逕ｨ閠・・蜉帙∝・縲ヾheet縺梧ｶ亥､ｱ繝ｻ驥崎､・＠縺ｪ縺・・10. 蛻･縺ｮ讀懆ｨｼSpreadsheet縺ｫ`Review Queue`縺ｾ縺溘・v1 marker繧堤ｽｮ縺上→縲《etup縺悟､画峩蜑阪↓蛛懈ｭ｢縺吶ｋ縲・11. 蛻･縺ｮ讀懆ｨｼSpreadsheet縺ｫ譛ｪ遏･縺ｮ髱樒ｩｺSheet繧堤ｽｮ縺上→縲《etup縺悟､画峩蜑阪↓蛛懈ｭ｢縺吶ｋ縲・12. Quick Diagnostic蜑榊ｾ後〒繧ｻ繝ｫ蛟､縲∬｡悟・謨ｰ縲∬｡ｨ遉ｺ/髱櫁｡ｨ遉ｺ縲ヾchema縺悟､牙喧縺励↑縺・・13. Quick Diagnostic縺ｮ螳滓ｸｬ縺・0遘剃ｻ･蜀・〒縺ゅｋ縲・14. Setup逶ｴ蠕後・Apps Script縺ｮTriggers逕ｻ髱｢縺ｫ譛ｬ螳溯｣・′菴懈・縺励◆time-driven Trigger縺後↑縺・・15. OAuth scope縺形spreadsheets.currentonly`縲～script.container.ui`縲～script.scriptapp`縲～userinfo.email`縲～gmail.modify`縲～calendar.app.created`縲～calendar.calendarlist.readonly`縺縺代〒縲∝ｺ・＞`calendar`縲～gmail.labels`縲～gmail.readonly`縲～mail.google.com`縲・xternal request縲．rive縲｀ail send縺悟性縺ｾ繧後↑縺・・16. `繧ｿ繧ｹ繧ｯ荳隕ｧ`縺ｮ蛻ｩ逕ｨ閠・ｷｨ髮・庄蛻暦ｼ亥愛譁ｭ縲∝ｯｾ蠢懃憾豕√∝ｮ御ｺ・∝ｯｾ雎｡螟悶√ち繧ｹ繧ｯ蜀・ｮｹ縲∵悄髯舌∝━蜈亥ｺｦ縲∬ｿ比ｿ｡蠕・■縲，alendar逋ｻ骭ｲ縲√さ繝｡繝ｳ繝茨ｼ峨・陦・莉･髯阪〒邱ｨ髮・〒縺阪ｋ縲・17. `繧ｿ繧ｹ繧ｯ荳隕ｧ`縺ｮ閾ｪ蜍募・繝ｻ邂｡逅・・縺ｨ縲・撼陦ｨ遉ｺ邂｡逅・heet縺ｯ螳溯｡瑚・ｻ･螟悶′邱ｨ髮・〒縺阪★縲∬ｭｦ蜻翫□縺代・Protection縺ｧ縺ｯ縺ｪ縺・・18. Task縺・00陦後ｒ雜・∴縺ｦ陦梧僑蠑ｵ縺輔ｌ縺溷ｾ後ｂ縲∝茜逕ｨ閠・ｷｨ髮・庄蛻励□縺代′譁ｰ縺励＞陦後〒邱ｨ髮・〒縺阪∫ｮ｡逅・・縺ｮProtection縺ｨData Validation縺檎ｶｭ謖√＆繧後ｋ縲・19. 豁｣蠑・繝ｩ繝吶Ν縺縺代′荳崎ｶｳ蛻・ｽ懈・縺輔ｌ縲ヾetup蜀榊ｮ溯｡後〒驥崎､・○縺壹∵里蟄倥Λ繝吶Ν繧Я謇句虚/*`縺悟炎髯､繝ｻrename縺輔ｌ縺ｪ縺・・20. 譌｢隱ｭ繝ｻ譛ｪ隱ｭ縺ｮ譫ｶ遨ｺ繝・せ繝医Γ繝ｼ繝ｫ繧貞推1莉ｶ隧ｦ縺励√←縺｡繧峨ｂMessage ID蜊倅ｽ阪〒蜃ｦ逅・〒縺阪ｋ縲・21. `謇句虚/蜿冶ｾｼ`縺ｨ`謇句虚/髯､螟冒繧貞酔譎ゅ↓莉倥￠繧九→譛ｬ譁・叙蠕励・蜑榊・逅・∈騾ｲ縺ｾ縺ｪ縺・・22. 蜷後§Message繧貞・螳溯｡後＠縺ｦ繧Ａ繝｡繝ｼ繝ｫ迥ｶ諷義縺・陦後・縺ｾ縺ｾ縺ｧ縲～PREPROCESSED`縺九ｉ蜈医∈騾ｲ縺ｾ縺ｪ縺・・23. `繝｡繝ｼ繝ｫ迥ｶ諷義縲～蜃ｦ逅・ｱ･豁ｴ`縲～繧ｨ繝ｩ繝ｼ繝ｻ蜀榊ｮ溯｡形縲・xecution Log縺ｫ譛ｬ譁・∽ｻｶ蜷阪・∽ｿ｡閠・∵ｷｻ莉伜・螳ｹ縺後↑縺・・24. 謇句虚Worker縺梧怙螟ｧ1 Message縲・20遘痴oft budget蜀・〒螳牙・邨ゆｺ・＠縲∝､ｱ謨玲凾縺ｯ`DONE`縺ｧ縺ｯ縺ｪ縺汁RETRY`縺ｾ縺溘・`DEAD`縺ｫ縺ｪ繧九・25. `[MOCK:NEW_HIGH]`縺ｯ騾壼ｸｸTask繧定・蜍描OPEN`縺ｫ縺励∝酔縺弄essage/Action繧貞・蜃ｦ逅・＠縺ｦ繧５ask縺碁㍾隍・＠縺ｪ縺・・26. `[MOCK:NEW_REVIEW]`縺ｯ蛻･繧ｿ繝悶〒縺ｯ縺ｪ縺丞酔縺倭繧ｿ繧ｹ繧ｯ荳隕ｧ`縺ｸ`REVIEW`縺ｨ縺励※蜈･繧翫～蜿怜・`縺ｧ`OPEN`縲～蜊ｴ荳義縺ｧ`EXCLUDED`縺ｫ縺ｪ繧九・27. `[MOCK:MULTI]`縺ｯAction縺斐→縺ｫ豎ｺ螳夂噪縺ｪ`origin_key`繧呈戟縺､2 Task繧剃ｽ懊ｋ縲・28. `[MOCK:UPDATE_DUE]`縲～[MOCK:MARK_COMPLETE]`縲～[MOCK:CANCEL]`縺ｯ迴ｾ蝨ｨ蛟､繧定・蜍募､画峩縺帙★pending Review縺ｫ縺ｪ繧九・29. 蛻ｩ逕ｨ閠・′邱ｨ髮・＠縺歔due_date`遲峨・`manual_fields`縺ｸ蜈･繧翫∝ｾ檎ｶ哺ock螟画峩縺ｯ遶ｶ蜷医→縺励※pending縺ｸ騾√ｉ繧後ｋ縲Ａcomment`縺ｯAI縺ｫ螟画峩縺輔ｌ縺ｪ縺・・30. `[MOCK:INFERRED]`縺ｮ謗ｨ貂ｬ譛滄剞縺ｯ`due_date`縺ｧ縺ｯ縺ｪ縺汁suggested_due_date`縺縺代↓蜈･繧九・31. `[MOCK:INFORMATION_ONLY]`縺ｯTask繧剃ｽ懊ｉ縺哺essage繧蛋DONE`縺ｾ縺ｧ騾ｲ繧√ｋ縲・32. `[MOCK:INVALID_JSON]`縲～[MOCK:SCHEMA_ERROR]`縲∵悴遏･Action縲・1 Action縺ｯTask蜑ｯ菴懃畑蜑阪↓諡貞凄縺輔ｌ繧九・33. 譛ｬ譁・ｸｭ縺ｮ`[MOCK:*]`縲∝多莉､譁・ゞRL縺ｯ蛻ｶ蠕｡縺ｨ縺励※謇ｱ繧上ｌ縺壹∽ｻｶ蜷榊・鬆ｭmarker縺縺代′fixture繧帝∈縺ｶ縲・34. AI label蜷梧悄縺ｯ`AI/隕∝ｯｾ蠢彖縲～AI/譛滄剞`縲～AI/霑比ｿ｡蠕・縲～AI/隕∫｢ｺ隱港縺縺代ｒ邂｡逅・＠縲～謇句虚/*`繧貞､画峩縺励↑縺・ＡSYS/螟ｱ謨輿縺ｯ繧ｨ繝ｩ繝ｼ蜃ｦ逅・□縺代′邂｡逅・☆繧九・35. 邂｡逅・・縺ｮ逶ｴ謗･邱ｨ髮・ｒ`handleTaskEdit(event)`縺ｸ貂｡縺吶→縲∝､繧呈綾縺輔★螳牙・縺ｪ繧ｨ繝ｩ繝ｼ陦後→Diagnostic warning繧定ｨ倬鹸縺吶ｋ縲・36. Phase 3縺ｮEditHandler縺ｯ謇譛芽・nstallable edit Trigger縺九ｉ迢ｭ縺Уask邱ｨ髮・□縺代ｒ閾ｪ蜍募渚譏縺励・∈謚樒ｯ・峇繝｡繝九Η繝ｼ縺ｯfallback縺ｨ縺励※蛻ｰ驕斐〒縺阪ｋ縲・37. 莉ｶ蜷阪・∽ｿ｡閠・ゝask蜷阪、I逅・罰縺形= + - @`遲峨・蠑術refix縺ｧ蟋九∪繧句ｮ悟・縺ｪ譫ｶ遨ｺ蜈･蜉帙ｒ菴ｿ縺・～繧ｿ繧ｹ繧ｯ荳隕ｧ`縺ｮ蟇ｾ雎｡繧ｻ繝ｫ縺ｫ縺､縺・※`getFormula()`縺檎ｩｺ縺ｧ縺ゅｋ縺薙→繧堤｢ｺ隱阪☆繧九・38. 蜷後§Thread縺ｫ譛ｪ隗｣豎ｺ`RETRY`縺ｾ縺溘・`DEAD`縺梧ｮ九ｋ蝣ｴ蜷医∝挨Message謌仙粥蠕後ｂ`SYS/螟ｱ謨輿縺梧ｮ九ｋ縺薙→繧堤｢ｺ隱阪☆繧九・39. `閾ｪ蜍墓悄譌･邂｡逅・莉･螟悶∫音縺ｫprimary Calendar縺御ｽ懈・繝ｻ譖ｴ譁ｰ繝ｻ蜑企勁縺輔ｌ縺ｪ縺・・40. 豁｣蠑乗悄髯舌′縺ゅｊ縲ヽeview隗｣豸域ｸ医∩縺ｧ縲∝ｮ御ｺ・・蟇ｾ雎｡螟悶・蜿匁ｶ医〒縺ｯ縺ｪ縺上，alendar譁ｹ驥昴→蠖ｱ髻ｿ譚｡莉ｶ繧呈ｺ縺溘☆Task縺縺代′邨よ律Event縺ｫ縺ｪ繧九・41. Event繧ｿ繧､繝医Ν縺ｯ`縲先悄髯舌代ち繧ｹ繧ｯ蜀・ｮｹ`縲∬ｪｬ譏弱・redaction貂医∩騾∽ｿ｡閠・・譛滄剞譬ｹ諡繝ｻ蜈・Γ繝ｼ繝ｫ蜿ら・繝ｻTask marker繝ｻinstance marker縺縺代ｒ蜷ｫ縺ｿ縲∽ｻｶ蜷阪∵悽譁・∵ｷｻ莉倥ｄ隱崎ｨｼ諠・ｱ繧貞性縺ｾ縺ｪ縺・・42. 蜷御ｸTask縺ｮ蜷梧悄蜀榊ｮ溯｡後→譛滄剞繝ｻTask蜷肴峩譁ｰ縺ｧEvent縺悟｢励∴縺壹∝酔縺椀wned Event縺梧峩譁ｰ縺輔ｌ繧九・43. 螳御ｺ・∝ｯｾ雎｡螟悶∝叙豸医，alendar蟇ｾ雎｡螟悶∵ｭ｣蠑乗悄髯仙炎髯､縲ヽeview蠕ｩ蟶ｰ縺ｧowned Event縺悟炎髯､縺輔ｌ繧九・44. Calendar荳譎ょ､ｱ謨怜ｾ後・Outbox縺形RETRY`縺ｨ縺ｪ繧翫∝・蝗槫､ｱ謨怜ｾ後・5/15/60蛻・・譛螟ｧ3蝗柮etry schedule縺ｫ蠕薙＞縲、I蛻・｡槭ｄTask菴懈・繧貞・螳溯｡後＠縺ｪ縺・・蝗樒岼縺ｮretry繧ょ､ｱ謨励＠縺溷ｴ蜷医√∪縺溘・髱柮etryable螟ｱ謨励・`DEAD`縺ｨ縺ｪ繧九・45. 菫晏ｭ櫓vent ID荳肴紛蜷医∬､・焚marker Event縲’oreign instance marker縲∝酔蜷垢alendar驥崎､・〒縺ｯ蟇ｾ雎｡繧呈耳貂ｬ繝ｻ荳頑嶌縺阪○縺壼ｮ牙・蛛懈ｭ｢縺吶ｋ縲・46. Setup逶ｴ蠕後・time-driven Trigger縺・莉ｶ縺ｧ縺ゅｋ縲ら樟蝨ｨ縺ｮ譛ｪ謇ｿ隱肴ｧ区・縺ｧ縺ｯ譏守､ｺ逧・↑閾ｪ蜍募喧譛牙柑蛹悶ｂ諡貞凄縺輔ｌ縲ゝrigger縺悟｢励∴縺ｪ縺・・47. 譌｢蟄・2迺ｰ蠅・ｒPhase 5 code縺ｧSetup縺吶ｋ縺ｨ縲～繝｡繝ｼ繝ｫ迥ｶ諷義蜿ｳ遶ｯ縺ｫ`classification_provenance_json`縺・蛻励□縺題ｿｽ蜉縺輔ｌ縲∵里蟄伜､縺ｨTask縺御ｿ晄戟縺輔ｌ繧九ょ・螳溯｡後・no-op縺ｫ縺ｪ繧九・48. Phase 5 Harness縺ｧ縺ｯCode implementation縺ｨMock HTTP Transport縺縺代′PASS縺励ヽeal provider connection縺ｯ`NOT EXECUTED`縲，ompany approval縺ｨCredential storage approval縺ｯ`NOT CONFIRMED`縺ｧ縺ゅｋ縲・49. manifest縺ｫExternal request scope縺後↑縺上〉epository縺ｫ`UrlFetchApp`縲∝ｮ歹ndpoint縲［odel縲…redential蛟､縺後↑縺・・50. Phase 6 local tests縺ｧCLOCK Trigger縺ｮ蜊倅ｸ蛹悶『rong-event鄂ｮ謠帙‥isable fail-safe縲［issing trigger UID諡貞凄縲・4譎る俣overlap縲｀essage蜊倅ｽ講pper bound縲・ page荳企剞縲｀essage ID dedup縲｝artial cursor蜀埼幕縲∵怙螟ｧ10 Message縲‥ue retry蜆ｪ蜈医ｒ遒ｺ隱阪☆繧九・51. Phase 6縺ｮ螳・蛻・rigger縺ｨ螳滄壼ｸｸInbox讀懃ｴ｢縺ｯ縲∝ｰら畑髱樊ｩ溷ｯ・andbox縺ｧ螳溯｡後☆繧九∪縺ｧ`NOT EXECUTED`縺ｨ縺吶ｋ縲・52. 蜷御ｸ縺ｮretryable髫懷ｮｳ縺ｯ蛻晏屓螟ｱ謨怜ｾ・/15/60蛻・〒蜀崎ｩｦ陦後＆繧後・蝗樒岼縺ｮ螟ｱ謨励〒1莉ｶ縺ｮDead Letter縺ｫ縺ｪ繧九・essage縲ゝask縲，alendar Event縺ｯ驥崎､・＠縺ｪ縺・・53. retryable縺ｪDead Letter縺縺代′縲～繧ｨ繝ｩ繝ｼ繝ｻ蜀榊ｮ溯｡形縺ｧ驕ｸ謚槭＠縺溷・驛ｨID縺九ｉ譛螟ｧ5莉ｶ縺ｾ縺ｧ謇句虚蜀埼幕縺ｧ縺阪ｋ縲よ悴隗｣豎ｺ險ｭ螳壹・撼retryable縲…heckpoint荳堺ｸ閾ｴ縺ｯ螳牙・縺ｫ諡貞凄縺輔ｌ繧九・54. Calendar Dead Letter縺ｮ謇句虚蜀埼幕縺ｯAI蛻・｡槭→Task菴懈・繧貞・螳溯｡後○縺壹＾utbox縺ｨMessage checkpoint縺九ｉ蜀埼幕縺励※Event繧帝㍾隍・ｽ懈・縺励↑縺・・55. `Quick Diagnostic`縺ｨ`Deep Diagnostic・郁ｪｭ蜿門ｰら畑・荏縺ｮ蜑榊ｾ後〒Sheet縲ゝask縲｀essage縲＾utbox縲￣roperty縲ゝrigger縲．ashboard縺悟､牙喧縺帙★縲；mail縲，alendar縲、I縺ｸ騾壻ｿ｡縺励↑縺・・56. 螳櫂ead Letter蝗槫ｾｩ縲∝ｮ櫺uick/Deep螳溯｡梧凾髢薙∝ｮ櫚abel/Calendar蜀崎ｩｦ陦後・蟆ら畑髱樊ｩ溷ｯ・oogle Workspace迺ｰ蠅・〒螳溯｡後☆繧九∪縺ｧ`NOT EXECUTED`縺ｨ縺吶ｋ縲・57. `驕狗畑Dashboard繧呈峩譁ｰ`縺ｧ17謖・ｨ吶′keyed upsert縺輔ｌ縲ゝask蜷阪∽ｻｶ蜷阪・∽ｿ｡閠・〉aw Gmail/Calendar ID縲…redential縲｝ayload縺瑚｡ｨ遉ｺ縺輔ｌ縺ｪ縺・・58. `險ｭ螳啻縺ｧ邱ｨ髮・庄閭ｽ縺ｪ縺ｮ縺ｯ閾ｪ蜍墓怙螟ｧMessage謨ｰ縲∵焔蜍不oft limit縲∬・蜍不oft limit縺縺代〒縲∝､画峩蛟､縺梧ｬ｡run縺ｮ螳滉ｸ企剞縺ｸ蜿肴丐縺輔ｌ繧九ょ崋螳夊ｨｭ螳壽隼螟峨∝梛繝ｻ遽・峇繝ｻProtection繝ｻ驥崎､㌧rift縺ｯenable蜑阪↓諡貞凄縺輔ｌ繧九・59. instrumented Gmail/AI/Calendar gateway縺悟､夜ΚI/O蜻ｼ蜃ｺ譎ゅ・Script Lock髱樔ｿ晄戟繧堤峩謗･遒ｺ隱阪☆繧九・60. ownership縲《tage縲（nput hash縲ゝask row version縲∽ｺ碁㍾Worker縺ｮCAS遶ｶ蜷医〒stale邨先棡繧団ommit縺励↑縺・・61. Calendar螟夜ΚCREATE蠕後・Task/Outbox遶ｶ蜷医ｒ蜀榊ｮ溯｡後＠縲・vent繧帝㍾隍・・蟄､遶九＆縺帙★迴ｾ蝨ｨTask縺ｸ蜿取據縺吶ｋ縲・62. Dashboard blank-key蛟､縲’ormula縲［etadata縲’oreign marker縲’ailed Quick Diagnostic縺ｧ`E_DASHBOARD_LAYOUT_CONFLICT`縺ｨ縺ｪ繧翫・Κ蛻・rite繧定｡後ｏ縺ｪ縺・・
Google Workspace螳溽腸蠅・〒螳溯｡後＠縺ｦ縺・↑縺・・岼縺ｯPASS縺ｫ縺帙★縲∵悴螳滓命縺ｨ縺励※險倬鹸縺励※縺上□縺輔＞縲・
螳溽腸蠅・・隧ｳ邏ｰ謇矩・→譛溷ｾ・ｵ先棡縺ｯ[`../docs/V2_MANUAL_ACCEPTANCE_GUIDE.md`](../docs/V2_MANUAL_ACCEPTANCE_GUIDE.md)繧呈ｭ｣譛ｬ縺ｨ縺励※菴ｿ逕ｨ縺励※縺上□縺輔＞縲・
## `clasp`繧剃ｽｿ縺・ｴ蜷・
`.clasp.json.example`繧偵Ο繝ｼ繧ｫ繝ｫ縺ｧ`.clasp.json`縺ｸ繧ｳ繝斐・縺励∝ｮ滄圀縺ｮScript ID縺ｯ縺昴・繝ｭ繝ｼ繧ｫ繝ｫ繝輔ぃ繧､繝ｫ縺縺代∈險ｭ螳壹＠縺ｾ縺吶ょｮ滄圀縺ｮScript ID縲ヾpreadsheet ID縲，alendar ID縲；mail Message ID縲∝・驛ｨURL繧坦epository縺ｸ菫晏ｭ倥＠縺ｪ縺・〒縺上□縺輔＞縲・
萓・

```text
clasp login
clasp push
```

縺薙・Repository縺ｧ縺ｯcommit縲｝ush縲‥eploy繧定・蜍募ｮ溯｡後＠縺ｾ縺帙ｓ縲・
## 諠・ｱ邂｡逅・
菫晏ｭ倡ｦ∵ｭ｢:

- API key縲｝assword縲》oken縲…redential
- 螳滄圀縺ｮGmail Message ID縲ヾpreadsheet ID縲，alendar ID
- 繝｡繝ｼ繝ｫ譛ｬ譁・∵ｷｻ莉伜・螳ｹ縲∝倶ｺｺ諠・ｱ縲∵悴蜈ｬ陦ｨ諠・ｱ
- Google Workspace蜀・ΚURL

Test Harness縺ｮTask縺ｯ螳悟・縺ｪ譫ｶ遨ｺ繝・・繧ｿ縺ｧ縺吶りｪ崎ｨｼ諠・ｱ繧担heet繧ｻ繝ｫ縲√た繝ｼ繧ｹ繧ｳ繝ｼ繝峨ヽEADME縲’ixture縲〕og縺ｸ菫晏ｭ倥＠縺ｪ縺・〒縺上□縺輔＞縲・
## 譌｢遏･縺ｮ蛻ｶ邏・
- Google Workspace蝗ｺ譛峨・Data Validation縲￣rotection縲、dvanced Gmail/Calendar Service縲＾Auth縲∝ｮ滄圀縺ｮlabel hierarchy縲∝ｰら畑Calendar謇譛牙愛螳壹・vent CRUD縲・∈謚樒ｯ・峇繝｡繝九Η繝ｼ縲∝ｼ熟eutralization縺ｮ`getFormula()`遒ｺ隱阪ヾcript Lock遶ｶ蜷医∝ｮ溯｡梧凾髢薙・螳溽腸蠅・〒縺ｮ謇句虚蜿怜・縺悟ｿ・ｦ√〒縺吶ゅΟ繝ｼ繧ｫ繝ｫPASS縺ｯ縺薙ｌ繧峨・螳溽腸蠅ケASS繧呈э蜻ｳ縺励∪縺帙ｓ縲・- Code Version縺ｯ`2.8.2-prepilot`縲ヾchema Version縺ｯ`2.3`縲、I Schema Version縺ｯ`2.0`縲｀igration Version縺ｯ`0`縺ｨ縺励※蛻・屬縺励※縺・∪縺吶・- Phase 2 entry point縺ｯ`PREPROCESSED`縺ｧ蛛懈ｭ｢縺励∪縺吶・ock邵ｦ繝輔Ο繝ｼ縺ｯMock蛻・｡槭ゝask/Review縲、I繝ｩ繝吶Ν縲，alendar Outbox繧呈桶縺・∪縺吶′縲∝ｮ蘗I繧貞他縺ｳ縺ｾ縺帙ｓ縲・- installable edit Trigger縺ｯSetup縺ｧTask邱ｨ髮・畑縺ｫ1莉ｶ縺縺台ｽ懈・縺励∪縺吶Ｕime-driven Trigger縺ｯSetup縺九ｉ菴懈・縺帙★縲∵・遉ｺ逧・怏蜉ｹ蛹悶→蜈ｨ蜑肴署譚｡莉ｶ繧呈ｺ縺溘☆蝣ｴ蜷医□縺醍ｮ｡逅・＠縺ｾ縺吶ら樟蝨ｨ縺ｮ譛ｪ謇ｿ隱阪・螳鬱ransport譛ｪ螳溯｣・ｧ区・縺ｧ縺ｯ菴懈・繧呈拠蜷ｦ縺励∪縺吶・- Calendar Event縺ｯ蟆ら畑Calendar蜀・・譛ｬsystem謇譛盈arker繧呈戟縺､Event縺縺代ｒ譖ｴ譁ｰ繝ｻ蜑企勁縺励∪縺吶・alendar蛛ｴ縺ｮ螟画峩繧探ask豁｣譛ｬ縺ｸ騾・ｵ√＆縺帙∪縺帙ｓ縲・- Phase 5縺ｯprovider-neutral縺ｪExternal Adapter蠅・阜縺ｾ縺ｧ縺ｧ縺吶ょｮ殫rovider縲‘ndpoint縲［odel縲∬ｪ崎ｨｼ譁ｹ蠑上…redential菫晉ｮ｡譁ｹ蠑上・譛ｪ遒ｺ螳壹〒縺ゅｊ縲∝ｮ滓磁邯壹・`NOT EXECUTED`縺ｧ縺吶・- External Adapter縺ｮproduction registry縺ｯ遨ｺ縺ｧ縲∝ｮ蘖rovider adapter/transport/credential loader縺ｯ譛ｪ螳溯｣・〒縺吶ゆｼ夂､ｾ謇ｿ隱阪・credential菫晉ｮ｡謇ｿ隱阪′謠・≧縺ｾ縺ｧfail closed縺ｧ縺吶・ock HTTP Transport縺ｯlocal test縺縺代〒菴ｿ逕ｨ縺励∪縺吶・- 迴ｾ蝨ｨ縺ｯ`TEST_MODE=true`縺ｮpre-pilot讒区・縺ｧ縺吶Ｔhared enable Gate縺ｯ`TEST_MODE_ENABLED`縺ｧproduction automation繧呈拠蜷ｦ縺励∪縺吶ょｮ溽腸蠅・∈騾ｲ繧蝣ｴ蜷医・`TEST_MODE=false`縺ｧ蜈ｨRegression縺ｨ螳欷orkspace Gate繧貞・螳滓命縺励※縺上□縺輔＞縲・- 譛邨らｵｱ蜷育屮譟ｻ縺ｫ蝓ｺ縺･縺阪￣hase 7蠢・医・霆ｽ驥愁ashboard繧呈・遉ｺ譖ｴ譁ｰ譁ｹ蠑上〒螳溯｣・＠縺ｦ縺・∪縺吶３untime縺ｨDiagnostic縺九ｉDashboard write縺ｯ陦後＞縺ｾ縺帙ｓ縲るｫ伜ｺｦ縺ｪ驕狗畑譛驕ｩ蛹悶・蟆・擂諡｡蠑ｵ縺ｧ縺吶・
