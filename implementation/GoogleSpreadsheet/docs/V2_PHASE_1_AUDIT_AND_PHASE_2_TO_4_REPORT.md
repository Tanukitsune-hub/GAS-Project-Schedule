# Google Workspace Personal Work OS v2

## Phase 1迢ｬ遶狗屮譟ｻ繝ｻPhase 2縲・螳溯｣・ｱ蜻・
- 蟇ｾ雎｡Repository: `GoogleSpreadsheet`
- 蟇ｾ雎｡Version: Code `2.4.0-phase4` / Schema `2.0` / Migration `0`
- 蛻､螳壽律: 2026-07-24
- 蟇ｾ雎｡遽・峇: Phase 1迢ｬ遶狗屮譟ｻ縲￣hase 2縲￣hase 3縲￣hase 4
- 蟇ｾ雎｡螟・ Phase 5莉･髯阪∝ｮ蘗I縲・壼ｸｸInbox蟾｡蝗槭∵悽逡ｪTrigger縲」1 Migration
- 蛻､螳壼次蜑・ Local test縺ｨGoogle Workspace螳溽腸蠅フest繧貞・髮｢縺励∝ｮ溽腸蠅・悴螳滓命繧単ASS縺ｨ縺励↑縺・
荳ｻ隕√↑蜈･蜉幄ｳ・侭縺ｯ`V2_IMPLEMENTATION_SPEC.md`縲・`V2_CODEX_IMPLEMENTATION_PLAN.md`縲・`CODEX_PHASE1_AUDIT_PHASE2_TO_4_INSTRUCTIONS.md`縺ｧ縺ゅｋ縲・Requirement蜊倅ｽ阪・蟇ｾ蠢憺未菫ゅ→謗｡逕ｨ縺励◆隗｣驥医・
`docs/V2_REQUIREMENTS_TRACEABILITY.md`繧貞盾辣ｧ縺吶ｋ縺薙→縲・
---

## 1. 邨占ｫ・
```text
Overall status: PASS WITH EXTERNAL VALIDATION PENDING
Phase 1 Audit: PASS WITH EXTERNAL VALIDATION PENDING
Phase 2: PASS WITH EXTERNAL VALIDATION PENDING
Phase 3: PASS WITH EXTERNAL VALIDATION PENDING
Phase 4: PASS WITH EXTERNAL VALIDATION PENDING
```

Phase 1縺ｧ逋ｺ隕九＠縺溽ｴ螢企亟豁｢縲∵賜莉門宛蠕｡縲∝梛螳牙・諤ｧ縲￣rotection縲・Diagnostic縲〉edaction荳翫・蝠城｡後ｒ菫ｮ豁｣縺励◆蠕後↓Phase 2縲・縲・繧帝・↓螳溯｣・＠縺溘・蜷Пhase縺ｮ繝ｭ繝ｼ繧ｫ繝ｫUnit縲！ntegration縲¨egative縲！dempotency縲・Failure Recovery縲ヽegression縺翫ｈ縺ｳ迢ｬ遶飢A縺ｯPASS縺励◆縲・譛邨ゅΟ繝ｼ繧ｫ繝ｫRegression縺ｯ9 suites蜷郁ｨ・91 PASS / 0 FAIL縺ｧ縺ゅｋ縲・Google Workspace螳溽腸蠅・畑縺ｮ5莉ｶ縺ｯ`SKIPPED / NOT EXECUTED`縺ｨ縺励※蛻・屬縺励◆縲・
Google Workspace螳溽腸蠅・〒縺ｯSheet UI縲、dvanced Gmail/Calendar Service縲・OAuth縲￣rotection縲´ockService遶ｶ蜷医∝ｮ溯｡梧凾髢薙ｒ讀懆ｨｼ縺励※縺・↑縺・・縺薙・縺溘ａOverall縺翫ｈ縺ｳ蜷Пhase縺ｮ蛻､螳壹・
`PASS WITH EXTERNAL VALIDATION PENDING`縺ｧ縺ゅｊ縲∝ｮ溽腸蠅ケASS縺ｧ縺ｯ縺ｪ縺・・
Phase 5縲∝ｮ蘗I Adapter縲；emini謗･邯壹～UrlFetchApp`縲・壼ｸｸInbox蟾｡蝗槭・5蛻・rigger縲（nstallable/time-driven Trigger縲」1 Migration縺ｯ螳溯｣・＠縺ｦ縺・↑縺・・譛ｬ蝣ｱ蜻翫ｒ繧ゅ▲縺ｦPhase 4縺ｧ蛛懈ｭ｢縺吶ｋ縲・
---

## 2. Phase 1逶｣譟ｻ邨先棡

### 2.1 蜑榊屓螳溯｣・・螯･蠖捺ｧ

Phase 1縺ｮ蝓ｺ譛ｬ譁ｹ驥昴・螯･蠖薙□縺｣縺溘・蜈ｷ菴鍋噪縺ｫ縺ｯ縲・0 Sheet讒区・縲・3蛻励・Task Schema縲∝・驛ｨ蛻悠D縲・隲也炊遨ｺ陦後・00陦悟腰菴肴僑蠑ｵ縲∵ｮｵ髫惨etup縲∝・遲窺ock Task縲・隱ｭ蜿紋ｸｭ蠢・・Quick Diagnostic縲∝､夜Κ繧ｵ繝ｼ繝薙せ髱樊磁邯壹→縺・≧蝓ｺ遉弱・邯ｭ謖√〒縺阪◆縲・
荳譁ｹ縲∫峡遶狗屮譟ｻ縺ｧ縺ｯ縲碁壼ｸｸ繧ｱ繝ｼ繧ｹ縺悟虚縺上％縺ｨ縲阪→
縲梧悴遏･繝ｻ遶ｶ蜷医・荳ｭ譁ｭ譎ゅ↓繧らｴ螢翫＠縺ｪ縺・％縺ｨ縲阪・髢薙↓隍・焚縺ｮ荳崎ｶｳ縺瑚ｦ九▽縺九▲縺溘・驥榊､ｧ謖・遭繧剃ｿｮ豁｣縺励∵里蟄・5 test縺ｫ蜉縺医※迢ｬ遶・3 test縺ｧ蜀肴､懆ｨｼ縺励◆縲・
### 2.2 逋ｺ隕九＠縺溷撫鬘後→菫ｮ豁｣

| 逋ｺ隕倶ｺ矩・| 繝ｪ繧ｹ繧ｯ | 謗｡逕ｨ縺励◆菫ｮ豁｣ | 邨先棡 |
|---|---|---|---|
| 謨ｰ蠑上¨ote縲．ata Validation縲￣rotection繧呈戟縺､Sheet繧堤ｩｺ縺ｨ隱､隱阪＠蠕励◆ | 譛ｪ遏･繝・・繧ｿ繧致2 Setup蟇ｾ雎｡縺ｫ縺励※螟画峩縺吶ｋ | 蜿ｯ隕門､莉･螟悶ｂprobe縺励∵悴遏･縺ｮ髱樒ｩｺ迺ｰ蠅・・Setup蜑阪↓蛛懈ｭ｢ | LOCAL PASS |
| 險倬鹸貂医∩Setup stage繧帝・ｺ上・螳滉ｽ鍋｢ｺ隱阪↑縺励↓菫｡鬆ｼ縺怜ｾ励◆ | 荳ｭ譁ｭ繝ｻProperty謾ｹ螟牙ｾ後↓荳肴紛蜷医↑stage縺九ｉ蜀埼幕縺吶ｋ | 螳御ｺ・tage繧帝・ｺ丈ｻ倥″prefix縺ｨ縺励※讀懆ｨｼ縺励∝推stage縺ｮpostcondition繧堤｢ｺ隱・| LOCAL PASS |
| Task譖ｸ霎ｼ縺ｫ荳雋ｫ縺励◆Script Lock縺ｨstale-context讀懷・縺御ｸ崎ｶｳ | 莠碁㍾陦後〕ost update縲〉ow version荳肴紛蜷・| held-lock Context縲∵嶌霎ｼ逶ｴ蜑阪・陦梧ｯ碑ｼ・∫ｫｶ蜷域凾safe stop繧定ｿｽ蜉 | LOCAL PASS |
| Task ID縲∝梛縲・num縲゛SON縲∵律譎ゅ・隱ｭ譖ｸ縺榊｢・阜縺悟香蛻・↓蜴ｳ譬ｼ縺ｧ縺ｪ縺九▲縺・| caller逕ｱ譚･ID繧・ｸ肴ｭ｣蝙九′豌ｸ邯壼喧縺吶ｋ | Repository謇譛迂D縲《trict typed read/write validation繧定ｿｽ蜉 | LOCAL PASS |
| 蜷御ｸ`origin_key`譖ｴ譁ｰ譎ゅ↓source identity繧・茜逕ｨ閠・・蜉帙ｒ螟画峩縺怜ｾ励◆ | Task縺ｮ蜃ｺ謇繧・焔蜍戊｣懈ｭ｣繧堤ｴ螢翫☆繧・| source identity繧段mmutable蛹悶＠縲…hanged-cell-only update縺ｸ髯仙ｮ・| LOCAL PASS |
| 邂｡逅・・繝ｻ邂｡逅・heet縺詣arning-only Protection縺縺｣縺・| 蛻ｩ逕ｨ閠・′蜀・Κ迥ｶ諷九ｒ逶ｴ謗･螟画峩縺ｧ縺阪ｋ | Header縲∫ｮ｡逅・・縲∫ｮ｡逅・heet繧貞ｮ溯｡瑚・剞螳啀rotection縺ｸ螟画峩 | LOCAL PASS / REAL NOT EXECUTED |
| Quick Diagnostic縺ｮschema蟷・’ormat縲」alidation縲”idden/protection讀懈渊縺御ｸ崎ｶｳ | 螢翫ｌ縺欖heet繧呈ｭ｣蟶ｸ縺ｨ蛻､螳壹☆繧・| exact width縲’ormat縲…riteria縲“eometry縲｝roperty縲」ersion讀懈渊繧定ｿｽ蜉 | LOCAL PASS / REAL NOT EXECUTED |
| Diagnostic縺ｮ螟ｧ縺阪↑遽・峇讀懈渊縺ｫbudget蠅・阜縺御ｸ崎ｶｳ | 60遘堤岼讓吶ｒ雜・∴縺ｦ荳ｭ譁ｭ縺吶ｋ | chunk蜃ｦ逅・→reserve莉倥″soft budget繧定ｿｽ蜉 | LOCAL PASS / REAL TIMING NOT EXECUTED |
| secret redaction縺梧ｧ矩蛹釦oken縲、uthorization縲，ookie縲ゞRI credential遲峨↓荳榊香蛻・| Log繧・ｾ句､悶∈讖溷ｯ・妙迚・′谿九ｋ | allowlist log縺ｨadversarial redaction繧呈僑蠑ｵ | LOCAL PASS |
| Test expectation縺ｮ荳驛ｨ縺継roduction螳夂ｾｩ縺ｸ霑代☆縺弱◆ | 蜷後§隱､繧翫ｒtest縺瑚ｿｽ隱阪☆繧・| literal contract縲］egative縲｜efore/after fingerprint繧呈戟縺､迢ｬ遶蟻udit suite繧定ｿｽ蜉 | LOCAL PASS |

### 2.3 菫ｮ豁｣縺励↑縺九▲縺滓欠鞫・
繧ｳ繝ｼ繝我ｸ翫・Blocker縲？igh縲｀edium謖・遭縺ｯ谿九＠縺ｦ縺・↑縺・・Phase 1 Gate縺ｧ霑ｽ霍｡縺輔ｌ縺櫚ow逶ｸ蠖謎ｺ矩・・縲．ata Validation縲・Protection editor縲´ockService遶ｶ蜷医∝ｮ溯｡梧凾髢鍋ｭ峨・Google Workspace螳溽腸蠅・ｾ晏ｭ倅ｺ矩・〒縺ゅｋ縲・蜈ｷ菴鍋噪縺ｪ繧ｳ繝ｼ繝画ｬ髯･縺ｨ縺励※譁ｭ螳壹○縺壹｀anual Acceptance蠕・■縺ｨ縺励※謇ｱ縺・・
installable edit trigger繧・・蜍謬rigger縺ｯ縲∽ｾｿ蛻ｩ縺輔ｈ繧翫ｂ莉雁屓縺ｮ譏守､ｺ逧・↑
no-trigger蛻ｶ邏・ｒ蜆ｪ蜈医＠縺ｦ螳溯｣・＠縺ｪ縺九▲縺溘・
### 2.4 Google Workspace螳溽腸蠅・悴遒ｺ隱堺ｺ矩・
- 螳欖heet縺ｧ縺ｮData Validation縲，heckbox縲∵律莉倩｡ｨ遉ｺ蠖｢蠑・- hidden Sheet縲”idden column縲￣rotection縺ｨeditor蛻ｶ蠕｡
- Setup荳ｭ譁ｭ繝ｻ蜀榊ｮ溯｡後→譌｢蟄伜・蜉帑ｿ晄戟
- Script Lock縺ｮ螳溽ｫｶ蜷・- Quick Diagnostic縺ｮ螳溯｡梧凾髢薙→隱ｭ蜿門ｰら畑諤ｧ
- 蠑熟eutralization蠕後・`Range.getFormula() === ''`

縺吶∋縺ｦ`NOT EXECUTED`縺ｧ縺ゅｊ縲￣ASS縺ｨ縺ｯ蛻､螳壹＠縺ｦ縺・↑縺・・
---

## 3. Phase蛻･邨先棡

| Phase | 蛻､螳・| 螳溯｣・ｦりｦ・| Local test | Real Workspace test | 谿玖ｪｲ鬘・|
|---|---|---|---|---|---|
| Phase 1 Audit | PASS WITH EXTERNAL VALIDATION PENDING | 螳牙・縺ｪblank蛻､螳壹《taged Setup縲ゝask Repository縲￣rotection縲．iagnostic縲〉edaction繧堤峡遶狗屮譟ｻ繝ｻ菫ｮ豁｣ | 譌｢蟄・5/15縲∫峡遶蟻udit 23/23 PASS | NOT EXECUTED | Sheet UI縲￣rotection縲´ock縲∝ｮ滓凾髢・|
| Phase 2 | PASS WITH EXTERNAL VALIDATION PENDING | formal Gmail label縲・剞螳嗄anual query縲｀essage State縲ヾtable Thread Key縲・mail Preprocessor縲￣REPROCESSED worker | 27/27 PASS | NOT EXECUTED | Gmail讀懃ｴ｢繝ｻlabel繝ｻOAuth繝ｻMessage ID |
| Phase 3 | PASS WITH EXTERNAL VALIDATION PENDING | strict Mock AI縲《ame-Sheet Review縲｝ending螟画峩縲［anual field菫晁ｭｷ縲、I label縲・∈謚樒ｯ・峇edit驕ｩ逕ｨ | production 37/37縲（ndependent 34/34 PASS | NOT EXECUTED | 螳檬mail label縲・∈謚樒ｯ・峇UI縲∝ｼ丞愛螳・|
| Phase 4 | PASS WITH EXTERNAL VALIDATION PENDING | 蟆ら畑Calendar縲＾utbox縲・vent CRUD縲，ALENDAR checkpoint縲，alendar-only retry縲ヾ60/S80/S99 | core 22/22縲、pps harness 15 PASS + 5 real SKIPPED縲（ndependent 11/11縲｝erformance 7/7縲ょ・9 suites 191/191 PASS | NOT EXECUTED | Calendar CRUD縲＾Auth縲｝rimary/ACL菫晁ｭｷ縲∝､ｱ謨怜・髢九》racked LOW 4莉ｶ |

### 3.1 Phase Gate

| Gate鬆・岼 | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---|---|---|---|---|
| Requirements Traceability | 譖ｴ譁ｰ貂医∩ | 譖ｴ譁ｰ貂医∩ | 譖ｴ譁ｰ貂医∩ | 譖ｴ譁ｰ貂医∩ |
| Unit / Integration / Negative | PASS_LOCAL | PASS_LOCAL | PASS_LOCAL | PASS_LOCAL |
| Idempotency / Failure Recovery | PASS_LOCAL | PASS_LOCAL | PASS_LOCAL | PASS_LOCAL |
| 蜑恒hase Regression | PASS_LOCAL | PASS_LOCAL | PASS_LOCAL | 9 suites 191 PASS / 0 FAIL |
| Security review | 螳御ｺ・・㍾螟ｧ謖・遭縺ｪ縺・| 螳御ｺ・｛pen finding縺ｪ縺・| formula injection菫ｮ豁｣蠕訓ASS | PASS縲・locker 0 / High 0 / Medium 0 / operational Low 1 |
| Performance review | soft budget遒ｺ隱・| 120遘鍛udget遒ｺ隱・| shared budget遒ｺ隱阪ょ・蝗曚ontext隱ｭ霎ｼ縺ｮ螳滓凾髢薙・tracked LOW | 7/7 PASS縲・locker 0 / High 0 / Medium 0 / Low 3 |
| Independent QA | 23/23 | independent production-code review螳御ｺ・| 34/34 | 11/11 |
| 驥榊､ｧ謖・遭 | 隗｣豸・| 隗｣豸・| 隗｣豸・| 隗｣豸・|
| Real Workspace | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED |
| Gate | PASS WITH EXTERNAL VALIDATION PENDING | PASS WITH EXTERNAL VALIDATION PENDING | PASS WITH EXTERNAL VALIDATION PENDING | PASS WITH EXTERNAL VALIDATION PENDING |

---

## 4. 螟画峩繝輔ぃ繧､繝ｫ

`.git`縺悟ｭ伜惠縺励↑縺・◆繧√∽ｻ･荳九・縲梧眠隕・螟画峩縲阪・Phase蟆主・譎ゅ・雋ｬ蜍吶↓蝓ｺ縺･縺上・commit蟾ｮ蛻・°繧峨・蛻､螳壹〒縺ｯ縺ｪ縺・・
### 4.1 Apps Script

| 繝代せ | 蛹ｺ蛻・| 雋ｬ蜍吶・荳ｻ縺ｪfunction | 蟇ｾ蠢彝equirement ID |
|---|---|---|---|
| `apps-script-v2/00_Config.gs` | 螟画峩 | version縲ヾheet蜷阪《tage縲｜udget縲〕abel縲，alendar螳壽焚 | P1-SCH-001縲￣1-SET-003縲￣2-GML-001縲￣4-SET-001 |
| `apps-script-v2/01_TypesAndSchemas.gs` | 螟画峩 | exact Schema縲・num螟画鋤縲，olumn Map縲ゝask蝙区､懆ｨｼ縲」alidation plan | P1-SCH-002縲・06縲￣1-REP-001/006 |
| `apps-script-v2/02_Setup.gs` | 螟画峩 | `setupSystem`縲‘nvironment讀懈渊縲《tage蜀埼幕縲ヾ50/S60縲ヾ80 NO_TRIGGER縲ヾ99 | P1-SET-001縲・06縲￣2-LBL-001縲￣4-SET-001 |
| `apps-script-v2/03_SheetBuilder.gs` | 螟画峩 | Sheet菴懈・縲《chema驕ｩ逕ｨ縲」alidation縲’ormat縲￣rotection縲・00陦梧僑蠑ｵ | P1-SCH-001縲・07 |
| `apps-script-v2/04_MessageStateRepository.gs` | 譁ｰ隕丞ｾ悟､画峩 | Message claim縲《tale蝗槫庶縲…heckpoint縲〉etry縲，ALENDAR resume | P2-MSG-001縲・03縲￣4-OUT-001 |
| `apps-script-v2/05_GmailGateway.gs` | 譁ｰ隕丞ｾ悟､画峩 | formal label縲・剞螳嘔uery縲｀essage蜿門ｾ励ヾtable Thread Key縲、I/SYS label diff | P2-LBL-001縲￣2-GML-001/002縲￣2-THR-001縲￣3-LBL-001 |
| `apps-script-v2/06_EmailPreprocessor.gs` | 譁ｰ隕・| provider-neutral email蜈･蜉帙ゞnicode-safe truncate縲”ash縲、ctive Task interface | P2-PRE-001/002 |
| `apps-script-v2/07_AiAdapter.gs` | 譁ｰ隕・| `MockAiAdapter`縲《trict input/output/action semantic validation | P3-AI-001縲・03 |
| `apps-script-v2/08_TaskRepository.gs` | 螟画峩 | logical empty row縲》yped upsert縲（ndex縲｝ending/manual update縲，alendar邂｡逅・atch | P1-REP-001縲・07縲￣3-REV-003縲￣4-CAL-004 |
| `apps-script-v2/09_TaskReviewPolicy.gs` | 譁ｰ隕・| confidence policy縲》arget隗｣豎ｺ縲《ame-row Review縲｝ending縲、I label髮・ｴ・| P3-REV-001縲・03縲￣3-MAN-001 |
| `apps-script-v2/10_CalendarSync.gs` | 譁ｰ隕・| 蟆ら畑Calendar讀懆ｨｼ縲‘ligibility縲・vent CRUD縲＾utbox縲〉etry縲｛wnership marker | P4-CAL-001縲・04縲￣4-OUT-001縲￣4-SET-001 |
| `apps-script-v2/11_EditHandler.gs` | 譁ｰ隕丞ｾ悟､画峩 | edited-row髯仙ｮ壼・逅・［anual field縲‥ecision驕ｩ逕ｨ縲＾utbox enqueue-only | P3-MAN-001縲￣3-EDT-001縲￣4-OUT-001 |
| `apps-script-v2/12_Triggers.gs` | 譁ｰ隕・| manual entry point縲《cheduled worker縺ｮ譏守､ｺ逧・┌蜉ｹ蛹・| P2-WRK-001縲．-006 |
| `apps-script-v2/13_LogAndDeadLetter.gs` | 譁ｰ隕丞ｾ悟､画峩 | allowlist run/error log縲｀essage/Calendar error縲［anagement warning | P2-LOG-001縲￣3-EDT-001縲￣4-OUT-001 |
| `apps-script-v2/14_Migrations.gs` | 螟画峩 | v1讀懷・縲｀igration遖∵ｭ｢縲～upgradeSystem` safe stop | P1-SET-002 |
| `apps-script-v2/16_Diagnostics.gs` | 螟画峩 | `runQuickDiagnostic`縲…hunk/budget縲《chema/validation/protection/version讀懈渊 | P1-DIA-001縲・03 |
| `apps-script-v2/17_Utilities.gs` | 螟画峩 | ID/hash/origin key縲〉edaction縲《afe error縲《oft budget縲ヾcript Lock | P1-REP-005縲￣1-SEC-001縲，OM-BUD-001 |
| `apps-script-v2/18_Worker.gs` | 譁ｰ隕丞ｾ悟､画峩 | Phase 2 manual worker縲｀ock vertical縲，ALENDAR checkpoint縲～syncPendingCalendarJobs` | P2-WRK-001縲￣3-FLOW-001縲￣4-OUT-001 |
| `apps-script-v2/99_TestHarness.gs` | 螟画峩 | Phase 1縲・ Apps Script acceptance縲〉eal test縺ｮ譏守､ｺ逧ТKIPPED | P1-TST-001縲，OM-GATE-001 |
| `apps-script-v2/Menu.gs` | 螟画峩 | Setup縲．iagnostic縲∝推Phase test縲《elected edit縲，alendar蜷梧悄menu | P1-TST-001縲￣3-EDT-001縲￣4-OUT-001 |
| `apps-script-v2/appsscript.json` | 螟画峩 | Advanced Gmail/Calendar v1/v3縲∵怙蟆衆Auth scope縲》imezone | P2-LBL-001縲￣4-SEC-001 |
| `apps-script-v2/.clasp.json.example` | 譁ｰ隕・| 螳欖cript ID繧貞性縺ｾ縺ｪ縺・ocal deployment險ｭ螳嗾emplate | P1-SEC-001 |

### 4.2 Tests繝ｻ蟆主・譁・嶌

| 繝代せ | 蛹ｺ蛻・| 雋ｬ蜍・| 蟇ｾ蠢彝equirement ID |
|---|---|---|---|
| `tests/phase1_local_test.js` | 譁ｰ隕丞ｾ梧峩譁ｰ | Phase 1譌｢蟄・5 acceptance | P1-TST-001 |
| `tests/phase1_audit_test.js` | 譁ｰ隕・| Phase 1迢ｬ遶蟻udit 23 test | P1-TST-001縲￣1-SEC-001 |
| `tests/phase2_local_test.js` | 譁ｰ隕・| Phase 2 production-code unit/integration 27 test | P2-*縲，OM-IDM-001 |
| `tests/phase3_local_test.js` | 譁ｰ隕丞ｾ梧峩譁ｰ | Phase 3 production-code 37 test縺ｨ蝗槫ｸｰ | P3-*縲，OM-IDM-001 |
| `tests/phase3_independent_test.js` | 譁ｰ隕丞ｾ梧峩譁ｰ | strict schema縲｝olicy縲…heckpoint縲《ecurity迢ｬ遶・4 test | P3-*縲，OM-GATE-001 |
| `tests/phase4_local_test.js` | 譁ｰ隕・| Calendar core縲］egative縲〉etry縲《ecurity 22 test | P4-CAL-*縲￣4-OUT-001縲￣4-SET-001 |
| `tests/phase4_harness_local_test.js` | 譁ｰ隕・| Apps Script Harness髫秘屬螳溯｡後・5 PASS / real 5 SKIPPED | P4-CAL-*縲，OM-GATE-001 |
| `tests/phase4_independent_test.js` | 譁ｰ隕・| Worker邵ｦ邨ｱ蜷医［ax 1縲］o re-AI縲〕ock縲∵ｩ溷ｯ・｢・阜11 test | P4-OUT-001縲￣4-SEC-001 |
| `tests/phase4_performance_test.js` | 譁ｰ隕・| retry chain縲〉ead蠅・阜縲［ax 1 Job縲｜udget縲”eld-lock縲¨OOP write amplification 7 test | COM-BUD-001縲￣4-OUT-001縲，OM-GATE-001 |
| `apps-script-v2/README.md` | 螟画峩 | 蟆主・縲［enu縲√Ο繝ｼ繧ｫ繝ｫ/螳溽腸蠅ヂcceptance縲∵里遏･蛻ｶ邏・| COM-GATE-001 |
| `apps-script-v2/CHANGELOG.md` | 螟画峩 | Phase蛻･縺ｮ螳溯｣・・讀懆ｨｼ螻･豁ｴ | COM-GATE-001 |
| `Archives/google-workspace-personal-work-os-v2_phase1-baseline_20260724.zip` | 譁ｰ隕・| Phase 2逹謇句燕縺ｮPhase 1逶｣譟ｻ貂医∩baseline backup | Audit instruction ﾂｧ3/ﾂｧ4 |
| `docs/V2_REQUIREMENTS_TRACEABILITY.md` | 譁ｰ隕丞ｾ梧峩譁ｰ | Requirement縲∝ｷｮ逡ｰ縲》est縲；ate蟇ｾ蠢懆｡ｨ | COM-GATE-001 |
| `docs/V2_MANUAL_ACCEPTANCE_GUIDE.md` | 譁ｰ隕丞ｾ梧峩譁ｰ | 遨ｺSheet縺九ｉ縺ｮPhase 1縲・螳溽腸蠅・焔鬆・∝ｰら畑Calendar髱槫・譛臥｢ｺ隱・| D-008縲￣4-SEC-001縲，OM-GATE-001 |
| `docs/V2_PHASE_1_AUDIT_AND_PHASE_2_TO_4_REPORT.md` | 譁ｰ隕・| 譛ｬ逶｣譟ｻ繝ｻ螳溯｣・・Gate蝣ｱ蜻・| Audit instruction ﾂｧ15.1/ﾂｧ17 |

---

## 5. 繧ｵ繝悶お繝ｼ繧ｸ繧ｧ繝ｳ繝・
| 諡・ｽ・| 遽・峇 | 荳ｻ縺ｪ謖・遭 | 謗｡逕ｨ縺励◆菫ｮ豁｣ |
|---|---|---|---|
| `phase1_spec_review`・・alton・・| Phase 1莉墓ｧ倥∵ｭ｣譛ｬ縲》raceability迢ｬ遶狗屮譟ｻ | exact Schema縲∝ｮ牙・蛛懈ｭ｢縲；ate險ｼ霍｡縺ｮ迢ｬ遶区ｧ | literal contract縺ｨRequirement matrix繧定ｿｽ蜉 |
| `phase1_code_qa`・・ermat・・| Phase 1 production code / Test Harness迢ｬ遶飢A | blank迺ｰ蠅・《etup integrity縲∝梛縲∫ｫｶ蜷医￣rotection縲．iagnostic | Phase 1 audit fixes縺ｨ迢ｬ遶・3 test縺ｸ蜿肴丐 |
| independent production-code review/test suite諡・ｽ・| Phase 2 Message/Gmail/preprocess/worker | label蜆ｪ蜈医…laim遶ｶ蜷医’ailure髱曠ONE縲｜udget縲《afe log | `謇句虚/髯､螟冒蜆ｪ蜈医．EAD/RETRY縲〕ock縲｜ounded expansion繧剃ｿｮ豁｣ |
| independent production-code review/test suite諡・ｽ・| Phase 3 AI/Review/Edit/worker | target隗｣豎ｺ縲∥ction semantic縲｜udget髱柮etry縲ヾYS aggregate縲’ormula injection | strict active-input target縲∥ction matrix縲《hared budget縲ゞ+200B neutralization繧呈治逕ｨ |
| Calendar莉墓ｧ藁atrix / API scope諡・ｽ・| Phase 4 policy縺ｨ蜈ｬ蠑修alendar API蠅・阜 | 蟆ら畑Calendar縲｝rimary諡貞凄縲〕east privilege縲《ame-name ownership | `calendar.app.created` + `calendar.calendarlist.readonly`縲［arker謇譛臥｢ｺ隱・|
| Calendar core諡・ｽ・| `10_CalendarSync.gs`縺ｨcore tests | Outbox steady state縲〉untime provision遖∵ｭ｢縲〉etry semantics | S60-only provision縲…anonical desired action縲・/15/60 retry繧貞ｮ溯｣・|
| Apps Script Harness諡・ｽ・| Phase 4 Harness | Local mock縺ｨreal test縺ｮ豺ｷ蜷碁亟豁｢ | real 5莉ｶ繧蛋SKIPPED / NOT EXECUTED`縺ｨ縺励※蛻・屬 |
| Worker integration諡・ｽ・| `18_Worker.gs` | CALENDAR checkpoint縲］o re-AI縲［ax 1 Job縲∫┌髢｢菫０utbox蛻・屬 | held-lock Message/Task/Outbox flow縺ｨstandalone worker繧貞ｮ溯｣・|
| Worker read-only revie…63 tokens truncated…hase 4 independent QA諡・ｽ・| Setup/Edit/Worker/Calendar邵ｦ邨ｱ蜷・| zero-task isolation縲］on-nested lock縲《ecret-bearing identifier縲《ource reference | 11/11 independent suite縺ｧ菫ｮ豁｣蠕訓ASS |
| Phase 4 security review諡・ｽ・| OAuth縲｛wnership縲〉edaction縲、PI boundary | Event ID譁・ｭ鈴寔蜷医…redential繧帝°縺ｹ繧菊rror code/stage縲〉aw Gmail ID log縲（nstance marker縲～source_email`谺關ｽ縲．iagnostic縺ｮreal PASS隱､陦ｨ遉ｺ縲ゝask荳榊ｭ伜惠縲・vent隱ｬ譏朱℃螟・| valid base32hex ID縲《afe identifier縲～msgref_`/`thrref_` hash縲《trict instance縲《ource reference莨晄眺縲～WARN / NOT_EXECUTED`縲’ail-closed縲∬ｪｬ譏取怙蟆丞喧縺ｸ菫ｮ豁｣ |
| Phase 4 performance review諡・ｽ・| Sheet read縲｜udget縲，alendar讀懃ｴ｢縲゛ob荳企剞 | NOOP Outbox/write amplification縺ｨretry蝗樊焚繧剃ｿｮ豁｣縲Ｅense sparse-row Context縲‘scaped held-lock Context縲，alendarList pagination繧鱈ow霑ｽ霍｡ | nonactionable Task縺ｮOutbox/write逵∫払縲［ax 1 Job縲｝er-item budget縲《cheduled-retry semantics繧呈治逕ｨ縲・/7 PASS |

Security review譛邨ょ愛螳壹・Blocker 0 / High 0 / Medium 0 / Low 1縺ｧ縺ゅｋ縲・Low 1縺ｯnarrow scope縺ｧ縺ｯ蟆ら畑Calendar縺ｮACL繝ｻ蜈ｱ譛芽ｨｭ螳壹ｒAPI讀懈渊縺ｧ縺阪↑縺・驕狗畑荳翫・螟夜Κ讀懆ｨｼ莠矩・〒縺ゅｊ縲｀anual Acceptance縺ｸ髱槫・譛臥｢ｺ隱阪ｒ霑ｽ蜉縺励◆縲・
Performance review譛邨ょ愛螳壹・Blocker 0 / High 0 / Medium 0 / Low 3縺ｧ縺ゅｋ縲・3莉ｶ縺ｯSection 8縺ｫ險倩ｼ峨☆繧句ｰ・擂hardening縺ｧ縺ゅｊ縲∫樟陦後・繝ｭ繝ｼ繧ｫ繝ｫGate繧帝仆螳ｳ縺励↑縺・・
Event隱ｬ譏弱・subject縲｜ody縲∥ttachment縲…redential繧帝勁螟悶☆繧倶ｸ譁ｹ縲・莉墓ｧ倅ｸ雁ｿ・医・runtime source reference URL縺ｯ菫晄戟縺吶ｋ縲・standalone縺ｪMessage/Calendar/Event ID field繧貞・髢狗ｵ先棡縺ｸ霑ｽ蜉縺励※縺・↑縺・・Error Log縺ｮraw provider ID縺ｯdomain-separated hash縺ｸ螟画鋤縺吶ｋ縲・
### 5.1 謗｡逕ｨ縺励↑縺九▲縺滓欠鞫倥・莉｣譖ｿ譯・
- installable edit trigger: 莉雁屓縺ｮno-trigger蛻ｶ邏・→遶ｶ蜷医☆繧九◆繧∽ｸ肴治逕ｨ縲・  selected-range menu縺九ｉ蜷後§蜃ｦ逅・∈譏守､ｺ逧・↓蛻ｰ驕斐〒縺阪ｋ繧医≧縺ｫ縺励◆縲・- broad Calendar/Gmail scope: arbitrary Calendar繧・ailbox蜈ｨ菴薙∈縺ｮ讓ｩ髯舌・荳崎ｦ√↑縺溘ａ荳肴治逕ｨ縲・- 蜷悟錐Calendar縺ｮ辟｡譚｡莉ｶ蜀榊茜逕ｨ: 謇譛画ｨｩ縺ｨinstance marker繧定ｨｼ譏弱〒縺阪↑縺・◆繧∽ｸ肴治逕ｨ縲・- Calendar Runtime縺九ｉ縺ｮ閾ｪ蜍穂ｽ懈・: Setup/Runtime雋ｬ蜍吝・髮｢縺ｫ蜿阪☆繧九◆繧∽ｸ肴治逕ｨ縲・- Calendar蛛ｴ螟画峩縺ｮTask縺ｸ縺ｮreverse sync: Sheets豁｣譛ｬ縺ｫ蜿阪☆繧九◆繧∽ｸ肴治逕ｨ縲・
---

## 6. 繝・せ繝育ｵ先棡

### 6.1 螳溯｡檎ｵ先棡

| Test蛻・｡・| Status | 螳溯｡梧婿豕輔・莉ｶ謨ｰ | 邨先棡 |
|---|---|---|---|
| Phase 1譌｢蟄・5 test | PASS_LOCAL | `node tests/phase1_local_test.js` | 15/15 |
| Phase 1霑ｽ蜉audit | PASS_LOCAL | `node tests/phase1_audit_test.js` | 23/23 |
| Phase 2 Unit / Integration | PASS_LOCAL | `node tests/phase2_local_test.js` | 27/27 |
| Phase 3 Unit / Integration | PASS_LOCAL | `node tests/phase3_local_test.js` | 37/37 |
| Phase 3 independent | PASS_LOCAL | `node tests/phase3_independent_test.js` | 34/34 |
| Phase 4 Unit / core | PASS_LOCAL | `node tests/phase4_local_test.js` | 22/22縲１4-G08縺ｯTask荳榊ｭ伜惠繝ｻwriter谺關ｽ繧断ail-closed遒ｺ隱・|
| Phase 4 Apps Script Harness | PASS_LOCAL / REAL_SKIPPED | `node tests/phase4_harness_local_test.js` | 15 PASS縲・ FAIL縲・ SKIPPED |
| Phase 4 Integration / independent | PASS_LOCAL | `node tests/phase4_independent_test.js` | 11/11 |
| Phase 4 Performance / Reliability | PASS_LOCAL | `node tests/phase4_performance_test.js` | 7/7 |
| 蜈ｨLocal suite | PASS_LOCAL | 荳願ｨ・ suites | 191 PASS / 0 FAIL縲Ｓeal 5莉ｶ縺ｯSKIPPED / NOT EXECUTED |
| JavaScript syntax | PASS_LOCAL | 蜈ｨ`.gs`繧鍛undled Node縺ｮ`node --check`縺ｸstdin蜈･蜉・| 20/20 |
| Manifest | PASS_LOCAL | JSON parse縲《ervice/scope exact check | PASS |
| Idempotency | PASS_LOCAL | Message縲ゝask縲ヽeview縲＾utbox縲・vent replay | 驥崎､・↑縺・|
| Failure Recovery | PASS_LOCAL | stale claim縲…heckpoint縲，alendar RETRY/DEAD縲｜udget pause | PASS |
| Security | PASS_LOCAL | identifier縲”ash reference縲〉edaction縲’ormula縲《cope縲’oreign/primary縲∫ｦ∵ｭ｢API scan | B0/H0/M0/L1 operational |
| Performance | PASS_LOCAL | 100陦梧僑蠑ｵ縲…hunk縲・20遘鍛udget縲・0遘奪iagnostic reserve縲［ax 1 Calendar Job縲¨OOP write謚大宛 | 7/7縲・0/H0/M0/L3 hardening |
| Google Workspace Manual Acceptance | NOT EXECUTED | `docs/V2_MANUAL_ACCEPTANCE_GUIDE.md` | 譛ｪ螳滓命 |

`node`縺ｯbundled runtime
`<codex-runtime>\dependencies\node\bin\node.exe`
繧剃ｽｿ逕ｨ縺励◆縲・ocal harness縺ｯGoogle API繧・etwork縺ｸ謗･邯壹＠縺ｦ縺・↑縺・・
### 6.2 Final Regression

| 遒ｺ隱堺ｺ矩・| Local邨先棡 | Real邨先棡 |
|---|---|---|
| 蜀行etup縺ｧTask繝ｻ蛻ｩ逕ｨ閠・・蜉帙ｒ遐ｴ螢翫＠縺ｪ縺・| PASS | NOT EXECUTED |
| 蜷御ｸMessage縺ｧMessage State繝ｻTask驥崎､・↑縺・| PASS | NOT EXECUTED |
| 蜷御ｸTask蜀榊酔譛溘〒Event驥崎､・↑縺・| PASS | NOT EXECUTED |
| AI荳肴ｭ｣蜃ｺ蜉帙〒Task蜑ｯ菴懃畑縺ｪ縺・| PASS | NOT EXECUTED |
| Calendar螟ｱ謨玲凾縺ｫGmail蜀榊叙蠕励・AI繝ｻTask讌ｭ蜍冰psert繧貞・螳溯｡後＠縺ｪ縺・| PASS | NOT EXECUTED |
| zero-task Message縺檎┌髢｢菫０utbox繧呈ｶ郁ｲｻ縺励↑縺・| PASS | NOT EXECUTED |
| Review荳ｭ繝ｻ謗ｨ貂ｬ譛滄剞縺ｮ縺ｿ縺ｧ縺ｯEvent繧剃ｽ懊ｉ縺ｪ縺・| PASS | NOT EXECUTED |
| 螳御ｺ・・蟇ｾ雎｡螟悶・蜿匁ｶ医・蟇ｾ雎｡螟卜ode縺ｧowned Event繧貞炎髯､ | PASS | NOT EXECUTED |
| manual field縺ｨ`comment`繧但I縺御ｸ頑嶌縺阪＠縺ｪ縺・| PASS | NOT EXECUTED |
| Log繝ｻ蜈ｬ髢狗ｵ先棡縺ｸ譛ｬ譁・…redential縲《tandalone Calendar/Event ID field繧貞・縺輔↑縺・ょｿ・・ource reference縺ｯ菫晄戟 | PASS | NOT EXECUTED |
| Task霑ｽ險倥∈`getLastRow()`繧剃ｽｿ逕ｨ縺励↑縺・| PASS_STATIC | N/A |
| 螟夜ΚAI縲￣hase 5縲・蛻・rigger縺後↑縺・| PASS_STATIC | Trigger UI縺ｯNOT EXECUTED |

---

## 7. 螳溽腸蠅・〒蠢・ｦ√↑遒ｺ隱・
縺吶∋縺ｦGoogle Workspace real test縺ｯ`NOT EXECUTED`縺ｧ縺ゅｋ縲・蜈ｷ菴鍋噪謇矩・→譛溷ｾ・ｵ先棡縺ｯ`docs/V2_MANUAL_ACCEPTANCE_GUIDE.md`縺ｫ蠕薙≧縲・
| 蛻・｡・| 蠢・ｦ√↑遒ｺ隱・| Status |
|---|---|---|
| Sheet | 10 Sheet縺ｮ菴懈・鬆・”idden Sheet縲・3蛻励〉ow 1/2縲〉ow 3髢句ｧ九・00陦梧僑蠑ｵ | NOT EXECUTED |
| Validation | Checkbox髯仙ｮ壹・num縲∵律莉惑ormat縲∫ｩｺ陦後↓`FALSE`縺ｪ縺励∝ｼ熟eutralization | NOT EXECUTED |
| Protection | Header縲∫ｮ｡逅・・縲∫ｮ｡逅・heet縲∵僑蠑ｵ蠕後・Protection縺ｨeditor | NOT EXECUTED |
| Setup | 遨ｺSheet縲∝・setup縲∽ｸｭ譁ｭ蜀埼幕縲∵悴遏･/v1迺ｰ蠅ピafe stop縲ヾ99 | NOT EXECUTED |
| Gmail | formal 7 label縲・剞螳嘔uery縲∵里隱ｭ/譛ｪ隱ｭ縲・勁螟門━蜈医｀essage ID縲《ource reference | NOT EXECUTED |
| Calendar | S60蟆ら畑Calendar縲…reate/update/delete/no-op縲・㍾隍・亟豁｢縲｝rimary/foreign荳榊､峨∝ｰら畑Calendar縺御ｻ冶・・邨・ｹ斐∈蜈ｱ譛峨＆繧後※縺・↑縺・％縺ｨ | NOT EXECUTED |
| OAuth | Gmail/Calendar Advanced Service縲…onsent逕ｻ髱｢縲∫ｵ・ｹ皮ｮ｡逅・・価隱阪∵怙蟆峻cope | NOT EXECUTED |
| Trigger | installable/time-driven Trigger縺御ｽ懈・縺輔ｌ縺ｦ縺・↑縺・| NOT EXECUTED |
| 螳溯｡梧凾髢・| Setup 120遘偵仝orker 120遘偵＿uick Diagnostic 60遘堤岼讓・| NOT EXECUTED |
| Lock | 蜷梧凾螳溯｡後《tale claim縲ゝask/Outbox遶ｶ蜷域凾縺ｮ螳滓嫌蜍・| NOT EXECUTED |
| Manual acceptance | Phase 1縲・縺ｮ繝繝溘・邵ｦ繝輔Ο繝ｼ縺ｨ蜀榊ｮ溯｡・| NOT EXECUTED |

螳溘Γ繝ｼ繝ｫ譛ｬ譁・∝ｮ櫑D縲∽ｼ夂､ｾ諠・ｱ縲∝倶ｺｺ諠・ｱ繧定ｩｦ鬨薙ョ繝ｼ繧ｿ縺ｸ菴ｿ逕ｨ縺励※縺ｯ縺ｪ繧峨↑縺・・蟆ら畑Calendar ACL繝ｻ蜈ｱ譛臥憾諷九・narrow OAuth scope縺ｧ縺ｯ繧ｳ繝ｼ繝峨°繧画､懈渊縺ｧ縺阪↑縺・◆繧√・Manual Acceptance縺ｧ髱槫・譛峨ｒ逶ｮ隕也｢ｺ隱阪＠縲∬ｩｦ鬨謎ｸｭ繧ょ・譛峨＠縺ｪ縺・・
---

## 8. Phase 5髢句ｧ句燕縺ｮ譛ｪ隗｣豎ｺ莠矩・
### 8.1 繧ｳ繝ｼ繝我ｸ翫・蝠城｡・
Phase 1縲・縺ｮ繝ｭ繝ｼ繧ｫ繝ｫGate繧呈ｭ｢繧√ｋBlocker縲？igh縲｀edium縺ｯ縺ｪ縺・・Phase 5繧ｳ繝ｼ繝峨・譛ｪ逹謇九〒縺ゅｋ縲・
| 遞ｮ蛻･ | Low | 迴ｾ蝨ｨ縺ｮ蠖ｱ髻ｿ | Phase 5蜑阪・謇ｱ縺・|
|---|---|---|---|
| Performance | `08_TaskRepository.createScopedContextForHeldLock`縺ｯ髱槫ｸｸ縺ｫ鬮倥＞驕ｸ謚櫁｡後∪縺ｧdense blank matrix繧堤｢ｺ菫昴☆繧・| memory縺形O(highest selected row ﾃ・columns)`縲る壼ｸｸ縺ｮ100陦悟・譛殀rid縺ｨ譛螟ｧ20驕ｸ謚櫁｡後〒縺ｯ髱樣仆螳ｳ | 螟ｧ隕乗ｨ｡Sheet驕狗畑蜑阪↓sparse Context縺ｾ縺溘・驕ｸ謚櫁｡御ｸ企剞繧呈､懆ｨ・|
| Performance | held-lock Context縺ｯ菴懈・譎ゅ↓螳殕ock繧堤｢ｺ隱阪☆繧九′縲［utation譎ゅ・蜀・Κmarker繧剃ｿ｡鬆ｼ縺吶ｋ | 迴ｾ陦後・蜷梧悄callback蜀・〒縺ｯContext繧弾scape縺輔○縺ｪ縺・◆繧・撼髦ｻ螳ｳ | escaped-context髦ｲ蠕｡縺ｨ縺励※callback邨ゆｺ・凾辟｡蜉ｹ蛹悶∪縺溘・mutation譎Ｍock蜀咲｢ｺ隱阪ｒ讀懆ｨ・|
| Performance | Setup S60縺ｮCalendarList summary讀懃ｴ｢縺ｯ譛螟ｧ250莉ｶ/page繧貞・page襍ｰ譟ｻ縺吶ｋ縺継age髢澱udget check縺後↑縺・| Setup髯仙ｮ壹・alendar謨ｰ縺梧･ｵ遶ｯ縺ｫ螟壹＞迺ｰ蠅・〒soft limit雜・℃菴吝慍 | page髢薙〒soft-budget繧堤｢ｺ隱阪＠safe resume縺吶ｋhardening繧呈､懆ｨ・|
| Security operational | narrow scope縺ｧ縺ｯ蟆ら畑Calendar ACL繝ｻ蜈ｱ譛芽ｨｭ螳壹ｒAPI讀懈渊縺ｧ縺阪↑縺・| Event縺ｯprivate縲（nvite縺ｪ縺励□縺靴alendar閾ｪ菴薙・蜈ｱ譛峨・繧ｳ繝ｼ繝峨〒險ｼ譏惹ｸ崎・ | Manual Acceptance縺ｧ髱槫・譛峨ｒ遒ｺ隱阪＠縲∫ｵ・ｹ廃olicy繧ら｢ｺ隱・|

Performance譛邨Ｔeverity縺ｯB0/H0/M0/L3縲・Security譛邨Ｔeverity縺ｯB0/H0/M0/L1縺ｧ縺ゅｋ縲・縺・★繧後ｂLocal Gate繧帝仆螳ｳ縺励↑縺・′縲∝ｮ溽腸蠅・・螟ｧ隕乗ｨ｡蛹門燕縺ｫ霑ｽ霍｡縺吶ｋ縲・
### 8.2 螳溽腸蠅・｢ｺ隱榊ｾ・■

1. `docs/V2_MANUAL_ACCEPTANCE_GUIDE.md`縺ｮPhase 1縲・謇矩・ｒ縲・   譁ｰ縺励＞遨ｺ縺ｮ髱樊ｩ溷ｯ・preadsheet縺ｧ螳御ｺ・☆繧九・2. Gmail label/query縲｀essage ID縲《ource reference縺ｮ螳滓嫌蜍輔ｒ遒ｺ隱阪☆繧九・3. 蟆ら畑Calendar縺ｨowned Event縺ｮCRUD縲｝rimary荳榊､峨《ame-name陦晉ｪ√・   Calendar-only retry縲∝ｰら畑Calendar髱槫・譛峨ｒ遒ｺ隱阪☆繧九・4. Protection縲．ata Validation縲∝ｼ熟eutralization縲´ock遶ｶ蜷医・   soft budget螳滓凾髢薙ｒ遒ｺ隱阪☆繧九・5. 螳溽腸蠅・ｵ先棡繧単ASS / FAIL / NOT EXECUTED縺ｧtraceability縺ｸ蜿肴丐縺吶ｋ縲・
### 8.3 莨夂､ｾ謇ｿ隱阪・隱崎ｨｼ譁ｹ蠑丞ｾ・■

- Advanced Gmail/Calendar Service縺ｨOAuth scope縺ｮ邨・ｹ疲価隱・- 髱樊ｩ溷ｯ・ユ繧ｹ繝医Γ繝ｼ繝ｫ繝ｻCalendar繧剃ｽｿ逕ｨ縺吶ｋ蜿怜・隧ｦ鬨薙・謇ｿ隱・- Phase 5縺ｧ螟夜ΚAI繧剃ｽｿ逕ｨ縺吶ｋ蝣ｴ蜷医・provider縲∝･醍ｴ・‥ata residency縲・  retention縲∫屮譟ｻ縲…redential菫晉ｮ｡譁ｹ豕・- 螳蘗I縺ｸ貂｡縺励※繧医＞email field縺ｨmasking譁ｹ驥・
### 8.4 螳蘗I Adapter險ｭ險医↓蠖ｱ髻ｿ縺吶ｋ莠矩・
- strict AI schema繧貞､画峩縺吶ｋ縺九∫樟陦茎chema繧堤ｶｭ謖√☆繧九°
- prose縺縺代↓蟄伜惠縺吶ｋ`target_origin_key`繧貞ｰ・擂schema縺ｸ霑ｽ蜉縺吶ｋ縺・- `UNCLEAR`繧貞ｿ・★Review Task縺ｫ縺吶ｋ迴ｾ陦梧婿驥昴・遒ｺ隱・- AUTO Calendar驥崎ｦ∝ｺｦ髢ｾ蛟､繧蛋HIGH`縺ｮ縺ｾ縺ｾ縺ｫ縺吶ｋ縺・- production trigger繧貞ｰ・擂蟆主・縺吶ｋ縺九ょｰ主・縺ｫ縺ｯ蛻･騾疲・遉ｺ謇ｿ隱阪′蠢・ｦ・
縺薙ｌ繧峨ｒ遒ｺ隱阪☆繧九∪縺ｧPhase 5繧帝幕蟋九＠縺ｪ縺・・
---

## 9. 莉墓ｧ倥→縺ｮ蟾ｮ逡ｰ

| 蟾ｮ逡ｰ | 謗｡逕ｨ縺励◆螳溯｣・| 逅・罰 | 蠖ｱ髻ｿ | 蟆・擂蟇ｾ蠢・|
|---|---|---|---|---|
| 螳溯｣・・縺ｫ`context-hub`縺ｨ`GoogleSpreadsheet`縺ｮ險倩ｿｰ蟾ｮ | `GoogleSpreadsheet`縺縺代ｒ蟇ｾ雎｡ | 譛譁ｰuser謖・､ｺ縺梧怙蜆ｪ蜈・| `context-hub`縺ｯ辟｡螟画峩 | 縺ｪ縺・|
| `origin_key`蠑上・plan/spec蟾ｮ | Spec縺ｮ`SHA-256("v2|" + message_id + "|" + index)` | 隧ｳ邏ｰSpec蜆ｪ蜈・| 豎ｺ螳夂噪縺ｪ`org_` key | 縺ｪ縺・|
| generic Message State鬆・岼縺ｨexact Schema蟾ｮ | exact v2 Sheet Schema繧堤ｶｭ謖・| instruction縺憩xact Schema繧担pec縺ｸ蟋碑ｭｲ | generic蜷阪ｒ譌｢蟄惑ield縺ｸ蟇ｾ蠢・| 縺ｪ縺・|
| Phase 2譛菴・ label縺ｨS50豁｣蠑・ label | 荳崎ｶｳ縺励※縺・ｋ豁｣蠑・ label繧貞・遲我ｽ懈・ | Spec縺ｮ譁ｹ縺悟宍譬ｼ | Phase 3 label繧４etup譎ゅ↓蟄伜惠 | 螳溽腸蠅・｢ｺ隱・|
| installable edit trigger險ｱ螳ｹ縺ｨno-trigger蛻ｶ邏・| trigger縺ｪ縺励《elected-range menu | 莉雁屓縺ｮ蛻ｶ邏・━蜈・| 閾ｪ蜍賓nEdit縺ｧ縺ｯ縺ｪ縺・| 蟆主・譎ゅ・蛻･謇ｿ隱・|
| S80蜷阪′CREATE_EDIT_TRIGGER | `NO_TRIGGER` policy stage縺ｨ縺励※螳御ｺ・| stage鬆・ｒ菫昴■縺､縺､遖∵ｭ｢莠矩・ｒ驕ｵ螳・| Trigger ID縺ｯ菴懊ｉ縺ｪ縺・| Spec蜷咲ｧｰ縺ｮ蟆・擂譏守｢ｺ蛹・|
| AI縺形SYS/螟ｱ謨輿繧らｮ｡逅・☆繧玖ｨ倩ｿｰ | AI縺ｯ`AI/*`縺縺代‘rror subsystem縺形SYS/螟ｱ謨輿繧堤ｮ｡逅・| 譛譁ｰinstruction縺檎強縺・| subsystem ownership縺梧・遒ｺ | 縺ｪ縺・|
| confidence 0.85縺ｮ驕ｩ逕ｨ遽・峇 | action縺ｨoverall縺ｮ荳｡譁ｹ縺ｫ驕ｩ逕ｨ | conservative縺ｪ閾ｪ蜍慕｢ｺ螳・| auto-open縺檎強縺・| 螳蘗I蜑阪↓遒ｺ隱・|
| exact AI schema縺ｫ`target_origin_key`縺後↑縺・| validated input蜀・・`target_task_id`縺縺代〒隗｣豎ｺ | schema螟貿ield繧定ｿｽ蜉縺励↑縺・| 隗｣豎ｺ荳崎・譖ｴ譁ｰ縺ｯReview髫秘屬 | schema謾ｹ險よ凾縺ｫ遒ｺ隱・|
| budget exhaustion縺ｨgeneric retry隕丞援 | error縺ｧ縺ｯ縺ｪ縺重urable checkpoint縺ｸpause | budget蛛懈ｭ｢縺ｯ蜃ｦ逅・､ｱ謨励〒縺ｯ縺ｪ縺・| retry allowance繧呈ｶ郁ｲｻ縺励↑縺・| 螳滓凾髢鍋｢ｺ隱・|
| Sheet formula隗｣驥・| String/URL縺ｮ蜊ｱ髯ｺprefix縺ｸU+200B | formula injection髦ｲ豁｢ | 陦ｨ遉ｺ荳翫⊇縺ｼ蜷後§縲∝・驛ｨ蛟､縺ｫ1譁・ｭ苓ｿｽ蜉 | 螳歔getFormula()`遒ｺ隱・|
| Calendar `NONE` / `NOOP`蟾ｮ | exact Spec縺ｮ`NOOP` | 隧ｳ邏ｰSpec蜆ｪ蜈・| Outbox action縺ｯ`NOOP` | 縺ｪ縺・|
| AUTO驥崎ｦ∝ｺｦ髢ｾ蛟､縺梧悴謖・ｮ・| `HIGH`縺ｮ縺ｿ | conservative縺ｪEvent菴懈・ | MEDIUM縺ｯ閾ｪ蜍慕匳骭ｲ縺励↑縺・| production蜑阪↓遒ｺ隱・|
| Runtime縺ｧCalendar property谺關ｽ譎ゅ・雋ｬ蜍・| S60縺縺代′create/adopt縺励ヽuntime縺ｯfail-closed | Setup/Runtime蛻・屬縺ｨprimary螳牙・諤ｧ | S60譛ｪ螳御ｺ・〒縺ｯ蜷梧悄蛛懈ｭ｢ | 螳欖60遒ｺ隱・|
| Message retry counter縺ｮstage邏ｯ遨榊撫鬘・| 蛻晏屓CALENDAR checkpoint縺ｧ譌ｧretry/error繧剃ｸ蠎ｦ縺縺喪eset | Calendar retry allowance繧堤峡遶九＆縺帙ｋ | 蠕檎ｶ咾ALENDAR resume縺ｧ縺ｯcount邯ｭ謖・| 螳溷､ｱ謨玲ｳｨ蜈･遒ｺ隱・|
| 蜷悟錐Calendar蜀榊茜逕ｨ縺ｨleast scope縺ｮ蛻ｶ邏・| app-created access縲｛wner縲（nstance marker繧定ｨｼ譏弱〒縺阪ｋ蝣ｴ蜷医□縺疎dopt | arbitrary Calendar繧貞､画峩縺励↑縺・| 險ｼ譏惹ｸ崎・縺ｪ繧鋭afe stop | OAuth/same-name螳溽｢ｺ隱・|
| Error Sheet縺ｫsource-reference蛻励′縺ゅｋ荳譁ｹ縲∝ｮ檬mail ID縺ｮLog菫晏ｭ倥・遖∵ｭ｢ | Error Log縺ｧ縺ｯraw ID繧剃ｿ晏ｭ倥○縺壹‥omain-separated SHA-256縺ｮ`msgref_` / `thrref_`蜿ら・繧剃ｿ晏ｭ・| 逶ｸ髢｢遒ｺ隱阪ｒ邯ｭ謖√＠縺､縺､provider ID繧剃ｸ榊庄騾・喧 | Message State遲峨・豁｣隕淑dempotency record縺ｨError Log繧貞・髮｢ | 螳滄°逕ｨlog遒ｺ隱・|
| Task/Event縺ｫ蜈・Γ繝ｼ繝ｫ蜿ら・縺悟ｿ・ｦ√□縺後∝ｮ牙・縺ｪ蠖｢蠑上′譛ｪ謖・ｮ・| runtime Thread ID縺九ｉgeneric Gmail UI source reference繧知emory荳翫〒菴懊ｊ縲ゝask/Event縺ｸ蠢・ｦ∵怙蟆城剞縺ｧ莨晄眺縲・I input縺ｨError Log縺ｸ縺ｯ貂｡縺輔↑縺・| URL蜿門ｾ励ｄ螟夜Κ騾壻ｿ｡繧定ｿｽ蜉縺帙★蛻ｩ逕ｨ閠・盾辣ｧ繧呈ｺ縺溘☆ | Event隱ｬ譏弱↓縺ｯ蠢・・ource reference縺梧ｮ九ｊ縲《ubject/body/attachment/credential縺ｯ谿九ｉ縺ｪ縺・| 螳歛ccount context縺ｧnavigation遒ｺ隱・|
| 縲・蝗槫､ｱ謨怜ｾ轡EAD縲阪→5/15/60蛻・・3 delay縺ｮ隗｣驥・| 蛻晏屓螟ｱ謨怜ｾ後↓5蛻・・5蛻・・0蛻・・3 retries繧定ｨｱ蜿ｯ縺励・蝗樒岼retry螟ｱ謨怜ｾ轡EAD | 3縺､縺ｮ謖・ｮ單elay繧偵☆縺ｹ縺ｦ蛻ｰ驕泌庄閭ｽ縺ｫ縺吶ｋ | 譛螟ｧ4 attempts・・nitial + 3 retries・峨Ａretry_count`縺ｯscheduled retry謨ｰ | production蜑阪↓owner遒ｺ隱阪・ total attempts縺梧э蝗ｳ縺ｪ繧英olicy/test/README繧貞酔譎ょ､画峩 |

---

## 10. 菴懈･ｭ迥ｶ諷・
```text
Repository root:
<workspace>\GoogleSpreadsheet

Git repository not initialized
```

- `.git`縺悟ｭ伜惠縺励↑縺・◆繧√｜ranch縲…ommit hash縲～git status`縲・  `git diff --stat`縺ｯ蜿門ｾ励〒縺阪↑縺・・- commit縲｝ush縲￣R縲〉eset縲…lean縲’orce謫堺ｽ懊・陦後▲縺ｦ縺・↑縺・・- `context-hub`縺ｯ螟画峩縺励※縺・↑縺・・- 螳滄圀縺ｮSpreadsheet ID縲，alendar ID縲；mail Message ID縲・  API key縲｝assword縲》oken縲√Γ繝ｼ繝ｫ譛ｬ譁・∝・驛ｨURL繧剃ｿ晏ｭ倥＠縺ｦ縺・↑縺・・- Test fixture縺ｯ螳悟・縺ｪ繝繝溘・縺ｧ縺ゅｋ縲・- Code Version縺ｯ`2.4.0-phase4`縲ヾchema Version縺ｯ`2.0`縺ｧ縺ゅｋ縲・- Phase 4螳御ｺ・ｾ後￣hase 5縺ｸ騾ｲ縺ｾ縺壼●豁｢縺励◆縲・
