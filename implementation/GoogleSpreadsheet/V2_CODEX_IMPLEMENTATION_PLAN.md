# Google Workspace Personal Work OS v2 Codex螳溯｣・ｨ育判

- 譁・嶌迚・ 0.9.0-draft
- 菴懈・譌･: 2026-07-23
- Project ID: `google-workspace-personal-work-os`
- 蟇ｾ雎｡Repository: `Tanukitsune-hub/context-hub`
- 蟇ｾ雎｡Directory: `projects/google-workspace-personal-work-os/`
- 螳溯｣・・: `projects/google-workspace-personal-work-os/apps-script-v2/`
- 蝓ｺ貅悶ち繧､繝繧ｾ繝ｼ繝ｳ: `Asia/Tokyo`
- 諠ｳ螳壼ｮ溯｣・・ Codex
- 迥ｶ諷・ Codex謚募・逕ｨDraft縲よｭ｣譛ｬ4繝輔ぃ繧､繝ｫ繧貞､画峩縺吶ｋ譁・嶌縺ｧ縺ｯ縺ｪ縺・- 蜷梧凾縺ｫ隱ｭ繧譁・嶌: `V2_IMPLEMENTATION_SPEC.md`

## 1. 譁・嶌縺ｮ逶ｮ逧・
譛ｬ譖ｸ縺ｯ縲～V2_IMPLEMENTATION_SPEC.md`繧辰odex縺悟ｮ牙・縺九▽谿ｵ髫守噪縺ｫ螳溯｣・☆繧九◆繧√・菴懈･ｭ鬆・∵・譫懃黄縲∝女蜈･蝓ｺ貅悶∝●豁｢譚｡莉ｶ縲∝ｱ蜻雁ｽ｢蠑上ｒ螳壹ａ繧九・
Codex縺ｯ譛ｬ譖ｸ繧剃ｸ諡ｬ螳溯｣・・萓晞ｼ縺ｨ縺励※謇ｱ繧上↑縺・１hase縺斐→縺ｫ譛蟆上・邵ｦ譁ｹ蜷第ｩ溯・繧貞ｮ溯｣・＠縲√ユ繧ｹ繝医→蜿怜・險ｼ霍｡繧呈ｮ九＠縲；ate縺訓ASS縺励◆蝣ｴ蜷医□縺第ｬ｡縺ｮPhase縺ｸ騾ｲ繧縲・
譛ｬ險育判縺ｮ蛻晄悄Phase 1・・縺ｯ縲；mail縺九ｉTask繧呈歓蜃ｺ縺励；oogle Sheets縺ｮ`繧ｿ繧ｹ繧ｯ荳隕ｧ`縺ｸ蜀ｪ遲峨↓蜿肴丐縺励・㍾隕√↑豁｣蠑乗悄髯舌□縺代ｒ蟆ら畑Calendar縺ｸ蜷梧悄縺吶ｋ讖溯・繧貞ｯｾ雎｡縺ｨ縺吶ｋ縲・
譌ｧ縲隈oogle繧ｹ繧ｱ繧ｸ繝･繝ｼ繝ｫ邂｡逅・す繧ｹ繝・Β縲阪・莨夊ｭｰ縲∝・蠑ｵ縲∽ｽ懈･ｭ繝悶Ο繝・け縲∵律谺｡繝悶Μ繝ｼ繝輔・ｱ谺｡繝ｬ繝薙Η繝ｼ縲・擇隲・燕蠕悟・逅・．ocs繝ｻDrive繝ｻNotebookLM騾｣謳ｺ縺ｯ縲∝・譛溷渕逶､縺ｮ螳牙ｮ壼ｾ後↓Phase 9莉･髯阪→縺励※蜀崎ｩ穂ｾ｡縺吶ｋ縲ょ・譛溷ｮ溯｣・∈豺ｷ蝨ｨ縺輔○縺ｪ縺・・
## 2. Codex縺ｮ螳溯｡悟･醍ｴ・
Codex縺ｯ縲∝推菴懈･ｭ髢句ｧ区凾縺ｫ谺｡繧貞ｮ滓命縺吶ｋ縲・
1. Repository縺ｨ迴ｾ蝨ｨBranch繧堤｢ｺ隱阪☆繧・2. 譛ｪ繧ｳ繝溘ャ繝亥､画峩縺ｮ譛臥┌繧堤｢ｺ隱阪☆繧・3. 豁｣譛ｬ4繝輔ぃ繧､繝ｫ縺ｨ譛ｬ譖ｸ縲∬ｩｳ邏ｰ莉墓ｧ俶嶌繧定ｪｭ繧
4. 迴ｾ蝨ｨ蟇ｾ雎｡縺ｮPhase繧・縺､縺ｫ髯仙ｮ壹☆繧・5. 螟画峩蟇ｾ雎｡繝輔ぃ繧､繝ｫ縺ｨ繝・せ繝磯・岼繧貞・縺ｫ蛻玲嫌縺吶ｋ
6. 螳溯｣・☆繧・7. 閾ｪ蜍輔ユ繧ｹ繝医→髱咏噪遒ｺ隱阪ｒ螳滓命縺吶ｋ
8. Google Workspace荳翫〒縺ｮ縺ｿ蜿ｯ閭ｽ縺ｪ謇句虚繝・せ繝医ｒ譏守､ｺ縺吶ｋ
9. 螟画峩蜀・ｮｹ縲√ユ繧ｹ繝育ｵ先棡縲∵悴隗｣豎ｺ莠矩・∵ュ蝣ｱ邂｡逅・｢ｺ隱阪ｒ蝣ｱ蜻翫☆繧・10. Gate縺梧悴驕斐・蝣ｴ蜷医・谺｡Phase縺ｸ騾ｲ縺ｾ縺ｪ縺・
Codex縺瑚｡後▲縺ｦ縺ｯ縺ｪ繧峨↑縺・％縺ｨ縲・
- v1.x繧ｳ繝ｼ繝峨ｒ繧ｳ繝斐・縺励※菫ｮ豁｣縺吶ｋ
- Review Queue繧貞・菴懈・縺吶ｋ
- 迢ｬ遶九＠縺櫪anual繝｢繝ｼ繝峨ｒ螳溯｣・☆繧・- 譌ｧ`OS/`繝ｩ繝吶Ν繧剃ｽｿ逕ｨ縺吶ｋ
- v1竊致2逶ｴ謗･Migration繧貞ｮ溯｣・☆繧・- 豁｣譛ｬ4繝輔ぃ繧､繝ｫ繧貞茜逕ｨ閠・・譏守､ｺ遒ｺ隱阪↑縺励↓螟画峩縺吶ｋ
- 螳滄圀縺ｮSpreadsheet ID縲，alendar ID縲；mail Message ID縲∝・驛ｨURL繧偵さ繝溘ャ繝医☆繧・- API key縲｝assword縲》oken縲…redential繧偵さ繝ｼ繝峨ヾheet縲．ocs縲；itHub縺ｸ菫晏ｭ倥☆繧・- 螳溘Γ繝ｼ繝ｫ譛ｬ譁・∵ｷｻ莉倩ｳ・侭縲∝倶ｺｺ諠・ｱ縲∵悴蜈ｬ陦ｨ諠・ｱ繧断ixture縲〕og縲…ommit縺ｸ蜷ｫ繧√ｋ
- 繝｡繝ｼ繝ｫ繧定・蜍暮∽ｿ｡縺吶ｋ
- 繝｡繧､繝ｳCalendar縺ｮEvent繧定・蜍穂ｽ懈・縲∝､画峩縲∝炎髯､縺吶ｋ
- Runtime縺九ｉSchema縲∝・鬆・∝・蜉幄ｦ丞援縲∵嶌蠑上￣rotection繧剃ｿｮ蠕ｩ縺吶ｋ
- Diagnostic縺九ｉDashboard譖ｴ譁ｰ縲∝・陦梧嶌謠帙∴縲∝・Event蜷梧悄縲；mail蜈ｨ讀懃ｴ｢繧貞ｮ溯｡後☆繧・- 荳諡ｬ縺ｧPhase 1・・繧貞ｮ溯｣・☆繧・- 譛ｪ遒ｺ隱阪・Google API縲、I Provider縲∬ｪ崎ｨｼ譁ｹ蠑上［odel ID繧呈刻騾縺吶ｋ
- 繝・せ繝域悴螳滓命縺ｮ讖溯・繧貞ｮ梧・謇ｱ縺・☆繧・
## 3. 隱ｭ繧鬆・分縺ｨ蜆ｪ蜈磯・ｽ・
Codex縺ｯ谺｡縺ｮ鬆・分縺ｧ隱ｭ繧縲・
1. `CURRENT_STATUS.md`
2. `DECISIONS.md`
3. `PROJECT_CONTEXT.md`
4. `MASTER_PLAN.md`
5. `AUTOMATED_DEADLINE_MANAGER_DESIGN.md`
6. `INITIAL_IMPLEMENTATION_DEFAULTS.md`
7. `PROTOTYPE_V1_LESSONS_LEARNED.md`
8. `NAMING_AND_GMAIL_LABELS.md`
9. `V2_IMPLEMENTATION_SPEC.md`
10. 譛ｬ譖ｸ

遏帷崟譎ゅ・蜆ｪ蜈磯・ｽ阪・
1. 繧医ｊ譁ｰ縺励＞Decision
2. `CURRENT_STATUS.md`縺ｮ譏守､ｺ逧・ｨよｭ｣
3. `PROJECT_CONTEXT.md`
4. `MASTER_PLAN.md`
5. v2隧ｳ邏ｰ險ｭ險医→譌｢螳壼､
6. 譛ｬ譖ｸ縺ｨ隧ｳ邏ｰ螳溯｣・ｻ墓ｧ俶嶌
7. v1莉･蜑阪・雉・侭

遏帷崟繧堤匱隕九＠縺溷ｴ蜷医，odex縺ｯ驛ｽ蜷医・繧医＞隗｣驥医〒騾ｲ繧√↑縺・Ａimplementation_report.md`逶ｸ蠖薙・蝣ｱ蜻翫↓縲∫泝逶ｾ縺吶ｋ險倩ｿｰ縲∵治逕ｨ縺励◆荳贋ｽ肴枚譖ｸ縲∽ｿ晉蕗縺励◆隲也せ繧定ｨ倬鹸縺吶ｋ縲・
## 4. 螳溯｣・ｯｾ雎｡縺ｮDirectory縺ｨ螳梧・蠖｢

```text
projects/google-workspace-personal-work-os/
笏懌楳 V2_IMPLEMENTATION_SPEC.md
笏懌楳 V2_CODEX_IMPLEMENTATION_PLAN.md
笏披楳 apps-script-v2/
   笏懌楳 00_Config.gs
   笏懌楳 01_TypesAndSchemas.gs
   笏懌楳 02_Setup.gs
   笏懌楳 03_SheetBuilder.gs
   笏懌楳 04_MessageStateRepository.gs
   笏懌楳 05_GmailGateway.gs
   笏懌楳 06_EmailPreprocessor.gs
   笏懌楳 07_AiAdapter.gs
   笏懌楳 08_TaskRepository.gs
   笏懌楳 09_TaskReviewPolicy.gs
   笏懌楳 10_CalendarSync.gs
   笏懌楳 11_EditHandler.gs
   笏懌楳 12_Triggers.gs
   笏懌楳 13_LogAndDeadLetter.gs
   笏懌楳 14_Migrations.gs
   笏懌楳 15_Dashboard.gs
   笏懌楳 16_Diagnostics.gs
   笏懌楳 17_Utilities.gs
   笏懌楳 18_Worker.gs
   笏懌楳 99_TestHarness.gs
   笏懌楳 Menu.gs
   笏懌楳 appsscript.json
   笏懌楳 README.md
   笏披楳 .clasp.json.example
```

螳梧・譎ゅ・`apps-script-v2/README.md`縺ｯ縲∝ｰ代↑縺上→繧よｬ｡繧貞性繧縲・
- 譛ｬ繧ｷ繧ｹ繝・Β縺ｮ逶ｮ逧・- v1髱樔ｺ呈鋤縺ｧ縺ゅｋ縺薙→
- 蠢・ｦ√↑Google Workspace讓ｩ髯・- 譁ｰ縺励＞遨ｺ縺ｮSpreadsheet縺ｸ蟆主・縺吶ｋ謇矩・- `clasp`繧剃ｽｿ縺・ｴ蜷医・螳牙・縺ｪ謇矩・- Setup縺ｮ谿ｵ髫弱→蜀埼幕譁ｹ豕・- Mock隧ｦ鬨捺婿豕・- 閾ｪ蜍募・逅・・髢句ｧ九・蛛懈ｭ｢譁ｹ豕・- Quick Diagnostic縺ｮ螳溯｡梧婿豕・- Dead Letter縺ｮ遒ｺ隱阪・蜀榊ｮ溯｡梧婿豕・- 譛ｬ逡ｪAI髢句ｧ句燕縺ｮ謇ｿ隱堺ｺ矩・- 譌｢遏･縺ｮ蛻ｶ邏・- 莨夂､ｾ諠・ｱ繧竪itHub縺ｸ菫晏ｭ倥＠縺ｪ縺・ｳｨ諢・
## 5. 螳溯｣・・蜈ｨ菴謎ｾ晏ｭ倬未菫・
```text
Phase 0 莉墓ｧ倥・菴懈･ｭ迺ｰ蠅・｢ｺ隱・  竊・Phase 1 Sheets蝓ｺ逶､繝ｻSetup繝ｻTaskRepository譛蟆冗沿
  竊・Phase 2 Gmail謇句虚蜿冶ｾｼ繝ｻMessage State
  竊・Phase 3 Mock AI邵ｦ繝輔Ο繝ｼ繝ｻ蜷御ｸ陦軍eview
  竊・Phase 4 驥崎ｦ∵悄髯燭alendar蜷梧悄
  竊・Phase 5 莨夂､ｾ謇ｿ隱肴ｸ医∩螳蘗I Adapter
  竊・Phase 6 5蛻・・蜍輔・繝ｼ繝ｪ繝ｳ繧ｰ
  竊・Phase 7 Retry繝ｻDead Letter繝ｻ險ｺ譁ｭ繝ｻDashboard
  竊・Phase 8 驟榊ｸ・・蛻･迺ｰ蠅・女蜈･
  竊・Phase 9莉･髯・繧ｹ繧ｱ繧ｸ繝･繝ｼ繝ｫ邂｡逅・僑蠑ｵ
```

Phase 1・・縺ｯMock縺ｧ螳溯｣・・讀懆ｨｼ縺ｧ縺阪ｋ縲１hase 5莉･髯阪・螟夜ΚAI縺ｨ譛ｬ逡ｪ閾ｪ蜍募・逅・・縲∽ｼ夂､ｾ謇ｿ隱肴ｸ医∩縺ｮ謗･邯壽婿蠑上∬ｪ崎ｨｼ縲√ョ繝ｼ繧ｿ菫晄戟縲∬ｪｲ驥代＾Auth繝ｻUrlFetch蛻ｶ髯舌′遒ｺ隱阪＆繧後ｋ縺ｾ縺ｧFeature Flag繧丹FF縺ｨ縺吶ｋ縲・
## 6. Branch縲…ommit縲￣R縺ｮ蜊倅ｽ・
謗ｨ螂ｨBranch蜷阪・
| Phase | Branch |
| --- | --- |
| 0 | `docs/work-os-v2-spec-baseline` |
| 1 | `feat/work-os-v2-phase-1-foundation` |
| 2 | `feat/work-os-v2-phase-2-gmail-ingest` |
| 3 | `feat/work-os-v2-phase-3-mock-task-flow` |
| 4 | `feat/work-os-v2-phase-4-calendar-sync` |
| 5 | `feat/work-os-v2-phase-5-ai-adapter` |
| 6 | `feat/work-os-v2-phase-6-polling` |
| 7 | `feat/work-os-v2-phase-7-operations` |
| 8 | `docs/work-os-v2-phase-8-distribution` |

commit萓九・
```text
feat(work-os-v2): implement phase 1 sheet foundation
feat(work-os-v2): add phase 2 Gmail message state flow
feat(work-os-v2): add phase 3 mock classification and task review
feat(work-os-v2): add phase 4 deadline calendar outbox
test(work-os-v2): add phase 4 calendar idempotency fixtures
docs(work-os-v2): add phase 8 deployment and acceptance guide
```

1縺､縺ｮPR縺ｸ隍・焚Phase繧呈ｷｷ蝨ｨ縺輔○縺ｪ縺・１hase蜀・〒隍・焚commit繧剃ｽ懊ｋ蝣ｴ蜷医ｂ縲ヾchema螟画峩縲ヽuntime螟画峩縲√ユ繧ｹ繝郁ｿｽ蜉繧定ｭ伜挨縺ｧ縺阪ｋ蜊倅ｽ阪↓縺吶ｋ縲・
Codex縺ｯ縲∝茜逕ｨ閠・′譏守､ｺ縺励※縺・↑縺・剞繧劃ommit縲｝ush縲￣R菴懈・繧定・蜍募ｮ溯｡後＠縺ｪ縺・ょ､画峩蜀・ｮｹ縺ｨ繝・せ繝育ｵ先棡繧堤､ｺ縺励；it謫堺ｽ懊・萓晞ｼ縺輔ｌ縺溽ｯ・峇縺ｫ髯仙ｮ壹☆繧九・
## 7. 蜈ｨPhase蜈ｱ騾壹・Gate

蜷Пhase縺ｯ谺｡繧偵☆縺ｹ縺ｦ貅縺溘☆縺ｾ縺ｧPASS縺ｫ縺励↑縺・・
```text
[ ] Phase蟇ｾ雎｡螟悶・讖溯・繧定ｿｽ蜉縺励※縺・↑縺・[ ] 莉墓ｧ俶嶌縺ｨ豁｣譛ｬ縺ｫ遏帷崟縺励↑縺・[ ] 螟画峩繝輔ぃ繧､繝ｫ荳隕ｧ繧定ｨ倬鹸縺励◆
[ ] Unit test縺訓ASS縺励◆
[ ] Integration fixture縺訓ASS縺励◆
[ ] 蜷後§蜈･蜉帙・蜀榊ｮ溯｡後〒驥崎､・′縺ｪ縺・[ ] 螳溯｡梧凾髢薙∪縺溘・soft budget譚｡莉ｶ繧呈ｺ縺溘＠縺・[ ] Setup蜀榊ｮ溯｡後〒譌｢蟄倥ョ繝ｼ繧ｿ繧貞｣翫＆縺ｪ縺・[ ] v1迺ｰ蠅・∵悴遏･縺ｮ髱樒ｩｺSheet繧堤ｴ螢翫○縺壼●豁｢縺吶ｋ
[ ] Runtime縺九ｉ繝ｬ繧､繧｢繧ｦ繝井ｿｮ蠕ｩ繧貞他縺ｰ縺ｪ縺・[ ] Logs縲’ixture縲…ommit縺ｫ讖溷ｯ・ュ蝣ｱ縺後↑縺・[ ] 螳櫑D縲∝・驛ｨURL縲…redential縺後↑縺・[ ] 謇句虚遒ｺ隱阪′蠢・ｦ√↑鬆・岼繧呈悴螳滓命縺ｮ縺ｾ縺ｾPASS縺ｫ縺励※縺・↑縺・[ ] 蜿怜・險ｼ霍｡繧剃ｿ晏ｭ倥＠縺・[ ] 譌｢遏･縺ｮ譛ｪ隗｣豎ｺ莠矩・ｒ險倬鹸縺励◆
```

Gate蛻､螳壹・`PASS`縲～CONDITIONAL PASS`縲～FAIL`縺ｮ縺・★繧後°縺ｨ縺吶ｋ縲・
- `PASS`: 閾ｪ蜍輔・謇句虚縺ｮ蠢・磯・岼縺後☆縺ｹ縺ｦ蜷域ｼ
- `CONDITIONAL PASS`: Google Workspace螳溽腸蠅・ｭ峨・螟夜Κ遒ｺ隱阪□縺代′譛ｪ螳滓命縲よｬ｡Phase縺ｮ繧ｳ繝ｼ繝我ｽ懈・縺ｯ蜿ｯ閭ｽ縺縺後∵悽逡ｪ髢句ｧ九・荳榊庄
- `FAIL`: 莉墓ｧ倬＆蜿阪√ョ繝ｼ繧ｿ遐ｴ螢翫・㍾隍・∝ｮ溯｡梧凾髢楢ｶ・℃縲∵ュ蝣ｱ邂｡逅・＆蜿阪∽ｸｻ隕√ユ繧ｹ繝域悴螳滓命

## 8. Phase 0: 莉墓ｧ錬aseline縺ｨ螳溯｣・腸蠅・｢ｺ隱・
### 8.1 逶ｮ逧・
螳溯｣・燕謠舌ｒ蝗ｺ螳壹＠縲，odex縺計1雉・侭繧・商縺・ｭｰ隲悶∈蠑輔″謌ｻ縺輔ｌ縺ｪ縺・憾諷九ｒ菴懊ｋ縲・
### 8.2 菴懈･ｭ

- 豁｣譛ｬ4繝輔ぃ繧､繝ｫ縺ｨv2陬懷勧雉・侭繧定ｪｭ繧
- `V2_IMPLEMENTATION_SPEC.md`縺ｨ譛ｬ譖ｸ縺ｮ蟄伜惠繧堤｢ｺ隱阪☆繧・- Repository蜀・↓v2繧ｳ繝ｼ繝峨′譌｢縺ｫ縺ゅｋ縺狗｢ｺ隱阪☆繧・- v1繧ｳ繝ｼ繝峨ｒ蜿ら・蟆ら畑縺ｨ隴伜挨縺吶ｋ
- 迴ｾ陦沓ranch縲∵悴繧ｳ繝溘ャ繝亥､画峩縲∫ｫｶ蜷医☆繧倶ｽ懈･ｭ繧堤｢ｺ隱阪☆繧・- 螳溯｣・・Directory縺梧悴蟄伜惠縺ｪ繧臼hase 1縺ｧ譁ｰ隕丈ｽ懈・縺吶ｋ
- Google Workspace縺ｧ縺ｮ謇句虚蜿怜・繧定｡後≧諡・ｽ薙→險倬鹸譁ｹ豕輔ｒ譁・嶌蛹悶☆繧・- 螟夜ΚAI縺ｮ謇ｿ隱咲憾豕√ｒ`譛ｪ遒ｺ隱・/ 蛻ｩ逕ｨ荳榊庄 / 蛻ｩ逕ｨ蜿ｯ閭ｽ / 邂｡逅・・｢ｺ隱榊ｿ・ｦ～縺ｧ險倬鹸縺吶ｋ
- 豁｣譛ｬ縺ｮ譛ｪ隗｣豎ｺ莠矩・ｒ菴懈･ｭBacklog縺ｸ霆｢險倥☆繧九′縲∝享謇九↓豎ｺ螳壹＠縺ｪ縺・
### 8.3 謌先棡迚ｩ

- 螳溯｣・燕遒ｺ隱阪Ξ繝昴・繝・- 遶ｶ蜷医・遏帷崟荳隕ｧ
- Phase 1螟画峩莠亥ｮ壹ヵ繧｡繧､繝ｫ荳隕ｧ
- Phase 1繝・せ繝井ｸ隕ｧ

### 8.4 蜿怜・蝓ｺ貅・
- v1繧ｳ繝ｼ繝峨ｒ繧ｳ繝斐・縺励↑縺・婿驥昴′譏守､ｺ縺輔ｌ縺ｦ縺・ｋ
- Review Queue縲｀anual繝｢繝ｼ繝峨∵立繝ｩ繝吶Ν繧剃ｽ懊ｉ縺ｪ縺・％縺ｨ縺檎｢ｺ隱阪＆繧後※縺・ｋ
- Phase 1繧帝仆螳ｳ縺吶ｋ驥榊､ｧ縺ｪ莉墓ｧ倡泝逶ｾ縺後↑縺・- 螳蘗I譛ｪ遒ｺ隱阪〒繧１hase 1・・繧樽ock縺ｧ騾ｲ繧√ｋ譁ｹ驥昴′邯ｭ謖√＆繧後※縺・ｋ
- 豁｣譛ｬ4繝輔ぃ繧､繝ｫ繧貞､画峩縺励※縺・↑縺・
## 9. Phase 1: 譛蟆輯heets蝓ｺ逶､縲ヾetup縲ゝaskRepository

### 9.1 逶ｮ逧・
譁ｰ縺励＞遨ｺ縺ｮGoogle Sheets縺九ｉ縲∵怙蟆上・v2 Schema縺ｨ譌･譛ｬ隱朸I繧貞ｮ牙・縺ｫ讒狗ｯ峨＠縲《ynthetic Mock Task繧・陦檎岼莉倩ｿ代∈蜀ｪ遲峨↓upsert縺ｧ縺阪ｋ迥ｶ諷九ｒ菴懊ｋ縲・
### 9.2 蟇ｾ雎｡繝輔ぃ繧､繝ｫ

```text
00_Config.gs
01_TypesAndSchemas.gs
02_Setup.gs
03_SheetBuilder.gs
08_TaskRepository.gs
14_Migrations.gs
16_Diagnostics.gs
17_Utilities.gs
99_TestHarness.gs
Menu.gs
appsscript.json
README.md
.clasp.json.example
```

`15_Dashboard.gs`縲～04`・杼13`縲～18_Worker.gs`縺ｯ遨ｺ繝輔ぃ繧､繝ｫ繧貞・縺ｫ菴懊ｉ縺ｪ縺・ょｿ・ｦ√↑Phase縺ｧ菴懈・縺吶ｋ縲ゅヵ繧｡繧､繝ｫ荳隕ｧ繧剃ｸ諡ｬ逕滓・縺吶ｋ蝣ｴ蜷医〒繧ゅ∵悴螳溯｣・unction縺悟茜逕ｨ蜿ｯ閭ｽ縺ｫ隕九∴縺ｪ縺・ｈ縺・・遒ｺ縺ｪstub縺ｨFeature Flag繧剃ｽｿ逕ｨ縺吶ｋ縲・
### 9.3 螳溯｣・・岼

#### 9.3.1 Config縺ｨEnum

- System name縲…ode version縲《chema version
- Timezone `Asia/Tokyo`
- Sheet蜷阪∝・驛ｨ蛻悠D縲∬｡ｨ遉ｺ隕句・縺・- Task status縲〉eview縲‥eadline basis縲｝riority縲…alendar mode遲峨・Enum
- 蛻晄悄陦梧焚縺ｨ霑ｽ蜉陦悟腰菴・- soft budget
- Feature Flag縲ょ・譛溷､縺ｯ閾ｪ蜍募・逅・FF縲、I Provider MOCK
- 豁｣蠑秀mail繝ｩ繝吶Ν縺ｨCalendar蜷阪・螳壽焚縺ｨ縺励※螳夂ｾｩ縺吶ｋ縺後￣hase 1縺ｧ縺ｯ螟夜Κ菴懈・縺励↑縺・
#### 9.3.2 Types and Schemas

- Task縲｀essage State縲ヾync State縲、I input/output縲、ppError縺ｮJSDoc
- 陦・蜀・Κ蛻悠D縺ｨ陦・譌･譛ｬ隱櫁ｦ句・縺励・Schema螳夂ｾｩ
- 陦ｨ遉ｺ蛟､縺ｨ蜀・ΚEnum縺ｮ蜿梧婿蜷僧apping
- Validation螳夂ｾｩ
- Schema version
- 蛻悠D驥崎､・∬ｦ句・縺嶺ｸ崎ｶｳ縲∝梛荳堺ｸ閾ｴ縺ｮ讀懆ｨｼ髢｢謨ｰ

#### 9.3.3 Setup foundation

Phase 1縺ｧ縺ｯSetup stage縺ｮ縺・■谺｡繧貞ｮ溯｣・・繝・せ繝医☆繧九・
```text
S00_VALIDATE_ENV
S10_CREATE_SHEETS
S20_CREATE_SCHEMAS
S30_APPLY_SMALL_VALIDATIONS
S40_SEED_SAFE_SETTINGS
S70_STORE_PROPERTIES
S80_CREATE_EDIT_TRIGGER
S90_QUICK_DIAGNOSTIC縺ｮSheets/Properties驛ｨ蛻・```

`S50_CREATE_GMAIL_LABELS`縺ｯPhase 2縲～S60_CREATE_DEADLINE_CALENDAR`縺ｯPhase 4縺ｧ螳溯｣・☆繧九よ怙邨ら噪縺ｪstage鬆・・莉墓ｧ俶嶌縺ｩ縺翫ｊ縺ｨ縺励￣hase騾比ｸｭ縺ｧ縺ｯ譛ｪ螳溯｣・tage繧貞ｮ御ｺ・桶縺・＠縺ｪ縺・・
Codex縺ｯPhase 1縺縺代・縺溘ａ縺ｫstage鬆・ｒ諱剃ｹ・､画峩縺励↑縺・５estHarness縺ｯ蛟九・・stage function繧堤峩謗･讀懆ｨｼ縺ｧ縺阪ｋ繧医≧縺ｫ縺吶ｋ縲ょ・髢義setupSystem()`縺ｯ譛ｪ螳溯｣・tage縺ｫ蛻ｰ驕斐＠縺溷ｴ蜷医∫ｴ螢顔噪謫堺ｽ懊ｒ縺帙★`SETUP_STAGE_NOT_IMPLEMENTED`繧貞ｮ牙・縺ｫ蝣ｱ蜻翫☆繧九・
#### 9.3.4 Sheet讒狗ｯ・
- 蛻ｩ逕ｨ閠・髄縺・繧ｿ繝・- 髱櫁｡ｨ遉ｺ邂｡逅・繧ｿ繝・- 陦・蜀・ΚID縲∬｡・譌･譛ｬ隱櫁ｦ句・縺・- 陦・莉･髯阪ョ繝ｼ繧ｿ
- 蛻晄悄陦梧焚100縲∬ｨｭ螳・0
- 蜈･蜉幄ｦ丞援縺ｯ蠢・ｦ√↑蛻晄悄遽・峇縺縺・- 遨ｺ陦後∈Boolean蛟､繧呈兜蜈･縺励↑縺・- 螟ｧ驥襲rotection繧剃ｽ懊ｉ縺ｪ縺・- 邂｡逅・・縺ｯ蜿ｳ蛛ｴ縲∝次蜑・撼陦ｨ遉ｺ
- 繧ｳ繝｡繝ｳ繝亥・遲峨・String蛻励↓Checkbox Validation繧剃ｻ倥￠縺ｪ縺・- Sheet菴懈・縲ヾchema縲〃alidation縲ヾeed繧貞・髮｢縺吶ｋ
- 蜷御ｸ螳溯｡悟・縺ｮ蛻柚ap縺ｯ繝｡繝｢繝ｪ荳翫〒菫晄戟縺吶ｋ

#### 9.3.5 TaskRepository譛蟆冗沿

- 陦・縺九ｉ蜀・Κ蛻柚ap繧剃ｽ懊ｋ
- `task_id`縺ｾ縺溘・`origin_key`縺ｮ縺ゅｋ陦後□縺代ｒTask縺ｨ縺吶ｋ
- 荳ｻ繧ｭ繝ｼ蛻励・譛蛻昴・隲也炊遨ｺ陦後ｒ謗｢縺・- 陦御ｸ崎ｶｳ譎ゅ□縺・00陦瑚ｿｽ蜉縺吶ｋ
- `getLastRow()`繧探ask霑ｽ險倅ｽ咲ｽｮ縺ｫ菴ｿ繧上↑縺・- `origin_key`縺ｨ`task_id`縺ｮindex繧・蝗槭・隱ｭ蜿悶〒菴懊ｋ
- synthetic Task縺ｮinsert/upsert
- 蜷後§`origin_key`縺ｮ蜀榊ｮ溯｡後〒陦後ｒ蠅励ｄ縺輔↑縺・- `row_version`蛻晄悄蛟､縺ｨ譖ｴ譁ｰ
- phase 1縺ｧ縺ｯGmail縲、I縲，alendar縺ｸ謗･邯壹＠縺ｪ縺・
#### 9.3.6 Migrations

- `14_Migrations.gs`縺ｯv2蟆・擂Migration縺ｮinterface縺ｨversion邂｡逅・□縺・- v1竊致2 migration繧貞ｮ溯｣・＠縺ｪ縺・- v1讀懷・譎ゅ・譏守､ｺ繧ｨ繝ｩ繝ｼ縺ｨ譁ｰ隕輯heet譯亥・
- migration螻･豁ｴ縲…ode version縲《chema version繧貞挨邂｡逅・☆繧玖ｨｭ險医↓縺吶ｋ

#### 9.3.7 Quick Diagnostic譛蟆冗沿

- 蠢・・heet
- 蜀・Κ蛻悠D
- Properties
- edit trigger
- Schema version
- Validation蝙・- 遨ｺ陦沓oolean蛟､縺ｮ譛臥┌
- 隲也炊Task莉ｶ謨ｰ

螟夜ΚGmail縲，alendar縲、I縺ｯPhase 1縺ｧ縺ｯ`NOT_YET_IMPLEMENTED`縺ｨ縺励※謇ｱ縺・∬ｨｺ譁ｭFAIL縺ｫ縺励↑縺・ゅ◆縺縺玲悴螳溯｣・ｒ`PASS`縺ｨ陦ｨ遉ｺ縺励↑縺・・
### 9.4 閾ｪ蜍輔ユ繧ｹ繝・
| ID | Test | 譛溷ｾ・ｵ先棡 |
| --- | --- | --- |
| P1-U01 | 蜀・Κ蛻悠D驥崎､・､懷・ | 譏守､ｺ繧ｨ繝ｩ繝ｼ |
| P1-U02 | 陦ｨ遉ｺ蛟､竊貞・驛ｨEnum | 豁｣縺励＞螟画鋤 |
| P1-U03 | 蜀・ΚEnum竊定｡ｨ遉ｺ蛟､ | 豁｣縺励＞螟画鋤 |
| P1-U04 | 隲也炊遨ｺ陦梧､懃ｴ｢ | 3陦檎岼縺ｾ縺溘・…8091 tokens truncated…mit縺輔ｌ縺ｪ縺・- `.clasp.json.example`縺ｯplaceholder縺縺・- Script Properties蛻ｩ逕ｨ縺御ｼ夂､ｾ隕冗ｨ九↓驕ｩ蜷・- Provider縺ｮ菫晄戟繝ｻ蟄ｦ鄙呈擅莉ｶ繧堤｢ｺ隱・- OAuth scope縺悟ｿ・ｦ∵怙蟆・- 蜈ｱ譛臥ｯ・峇繧貞､画峩縺励↑縺・- 繝｡繝ｼ繝ｫ閾ｪ蜍暮∽ｿ｡縺ｪ縺・- 繝｡繧､繝ｳCalendar螟画峩縺ｪ縺・- Docs豁｣譛ｬ閾ｪ蜍穂ｸ頑嶌縺阪↑縺・
### 16.5 蛻晄悄v2 Definition of Done

```text
[ ] 譁ｰ縺励＞遨ｺ縺ｮSheet縺九ｉsetup螳御ｺ・[ ] Task縺・陦檎岼莉倩ｿ代∈蜈･繧・[ ] 遨ｺ陦熊ALSE縺ｪ縺・[ ] 繧ｳ繝｡繝ｳ繝亥・Checkbox縺ｪ縺・[ ] Message/Task/Event驥崎､・↑縺・[ ] Review Queue縺ｪ縺・[ ] 蜷御ｸ陦後〒蜿怜・繝ｻ蜊ｴ荳・[ ] 螳御ｺ・・蜿匁ｶ医・驥崎ｦ∝､画峩縺ｯ莠ｺ髢鍋｢ｺ隱・[ ] 驥崎ｦ√↑豁｣蠑乗悄髯舌□縺舛alendar蜷梧悄
[ ] Mock邵ｦ繝輔Ο繝ｼ蜷域ｼ
[ ] Quick Diagnostic 60遘剃ｻ･蜀・[ ] manual 120遘偵∥uto 210遘痴oft budget
[ ] retry縺御ｿ晏ｭ・tage縺九ｉ蜀埼幕
[ ] setup蜀榊ｮ溯｡後〒繝・・繧ｿ遐ｴ謳阪↑縺・[ ] Logs縺ｫ讖溷ｯ・ュ蝣ｱ縺ｪ縺・[ ] 蛻･迺ｰ蠅・〒謇句ｼ墓嶌縺縺代°繧牙・迴ｾ
[ ] 螳蘗I繝ｻautomation縺ｯ莨夂､ｾ謇ｿ隱榊ｾ後↓譏守､ｺ髢句ｧ・```

## 17. Phase 9莉･髯・ Google繧ｹ繧ｱ繧ｸ繝･繝ｼ繝ｫ邂｡逅・す繧ｹ繝・Β諡｡蠑ｵ

Phase 9莉･髯阪・蛻晄悄v2螳梧・蠕後・蛟呵｣懊〒縺ゅｊ縲∵悽譖ｸ縺ｮ菴懈・縺縺代〒縺ｯ謗｡逕ｨDecision縺ｫ縺ｪ繧峨↑縺・ょ推諡｡蠑ｵ縺ｯ蛻･Decision縲∝挨莉墓ｧ倥∝挨Gate繧貞ｿ・ｦ√→縺吶ｋ縲・
### 17.1 Phase 9A: 譌･谺｡繝悶Μ繝ｼ繝・
- `繧ｿ繧ｹ繧ｯ荳隕ｧ`縺ｨCalendar繧池ead-only髮・ｨ・- 莉頑律縲∵悄髯占ｶ・℃縲∬ｦ∫｢ｺ隱阪∬ｿ比ｿ｡蠕・■縲∝ｽ捺律莨夊ｭｰ繧定｡ｨ遉ｺ
- 繝｡繝ｼ繝ｫ閾ｪ蜍暮∽ｿ｡縺ｪ縺・- Dashboard縺ｾ縺溘・蟆ら畑Doc縺ｸ縺ｮ蜃ｺ蜉帙・蛻･Decision
- Worker縺ｨ縺ｯ蛻･trigger
- failure縺卦ask蜃ｦ逅・∈蠖ｱ髻ｿ縺励↑縺・
### 17.2 Phase 9B: 騾ｱ谺｡繝ｬ繝薙Η繝ｼ

- 螳御ｺ・∵悄髯占ｶ・℃縲∫ｿ碁ｱ譛滄剞縲・聞譛溯ｿ比ｿ｡蠕・■縲．ead Letter縺ｮread-only髮・ｨ・- status繧定・蜍募､画峩縺励↑縺・- 莠ｺ縺ｮ騾ｱ谺｡遒ｺ隱阪ｒ陬懷勧
- 豁｣譛ｬDocs繧堤┌謇ｿ隱阪〒荳頑嶌縺阪＠縺ｪ縺・
### 17.3 Phase 9C: 菴懈･ｭ繝悶Ο繝・け

- 騾壼ｸｸTask縺九ｉ閾ｪ蜍輔〒繝｡繧､繝ｳCalendar繧貞沂繧√↑縺・- 蛻ｩ逕ｨ閠・・譏守､ｺ謫堺ｽ懊∪縺溘・遒ｺ隱肴ｸ医∩request縺縺・- deadline Event縺ｨ縺ｯ蛻･縺ｮevent type縺ｨID
- 菴懈･ｭ譎る俣縲・幕蟋区凾蛻ｻ縲‥uration縲》imezone繧呈・遉ｺ
- 譌｢蟄倅ｼ夊ｭｰ縺ｨ遶ｶ蜷医☆繧句ｴ蜷医・閾ｪ蜍慕ｧｻ蜍輔○縺壼呵｣懈署遉ｺ
- Event縺ｮ閾ｪ蜍募炎髯､繝ｻ蜀埼・鄂ｮ縺ｯ莠ｺ髢鍋｢ｺ隱・- 蛻晄悄螳溯｣・〒縺ｯ繝｡繧､繝ｳCalendar縺ｯread-only縺ｾ縺溘・譏守､ｺ謫堺ｽ憺剞螳・
### 17.4 Phase 9D: 髱｢隲・燕蠕・
- Calendar event縺ｨProject縺ｮ髢｢騾｣縺･縺・- 髱｢隲・燕縺ｯ髢｢騾｣Task縲．ocs縲．rive繝ｪ繝ｳ繧ｯ縲・℃蜴ｻMeeting Notes縺ｮread-only蜿門ｾ・- 髱｢隲・ｾ後・隴ｰ莠矩鹸縲ゝask縲∬ｿ比ｿ｡譁・・蛟呵｣應ｽ懈・
- 繝｡繝ｼ繝ｫ閾ｪ蜍暮∽ｿ｡縺ｪ縺・- Project Context縲．ecision Log縲｀eeting Note縺ｮ豁｣譛ｬ繧定・蜍穂ｸ頑嶌縺阪＠縺ｪ縺・- AI謠先｡医・蛟呵｣懊→縺励※菫晏ｭ倥＠縲∽ｺｺ縺梧治逕ｨ縺吶ｋ

### 17.5 Phase 9E: Docs縲．rive縲¨otebookLM

- GitHub縺ｨGoogle Docs縺ｮ豁｣譛ｬ髢｢菫ゅｒ譯井ｻｶ縺斐→縺ｫ譏守｢ｺ蛹・- 螳溘ョ繝ｼ繧ｿ縲∝・驛ｨURL縲∫ｧ伜ｯ・ュ蝣ｱ繧竪itHub縺ｸ菫晏ｭ倥＠縺ｪ縺・- NotebookLM繧但pps Script閾ｪ蜍募ｮ溯｡後お繝ｳ繧ｸ繝ｳ縺ｫ縺励↑縺・- NotebookLM縺ｯ莠ｺ縺ｫ繧医ｋ譬ｹ諡莉倥″讀懃ｴ｢繝ｻ蛻・梵
- 蜈ｱ譛画ｨｩ髯舌ｒ閾ｪ蜍募､画峩縺励↑縺・- File蜑企勁縲∝､ｧ驥冗ｧｻ蜍輔ｒ閾ｪ蜍募ｮ溯｡後＠縺ｪ縺・
### 17.6 諡｡蠑ｵ蜑阪・蠢・域擅莉ｶ

- 蛻晄悄v2縺ｮPhase 8 Gate縺訓ASS
- 驥崎､・紫縲∬ｪ､讀懃衍邇・〉eview貊樒蕗縲，alendar蜷梧悄error繧剃ｸ螳壽悄髢楢ｦｳ貂ｬ
- 繝｡繧､繝ｳCalendar譖ｸ霎ｼ譁ｹ驥昴ｒDecision縺ｧ遒ｺ螳・- 莨夊ｭｰ繝ｻ菴懈･ｭ繝悶Ο繝・け縺ｮsource of truth繧堤｢ｺ螳・- Docs譖ｴ譁ｰ縺ｮ謇ｿ隱阪ヵ繝ｭ繝ｼ繧堤｢ｺ螳・- 諠・ｱ邂｡逅・Κ髢縺ｮ譚｡莉ｶ繧堤｢ｺ隱・- 諡｡蠑ｵ縺卦ask worker縺ｮ螳溯｡梧凾髢薙∈蠖ｱ髻ｿ縺励↑縺・ｨｭ險・
## 18. TestHarness縺ｮ螳溯｣・婿驥・
### 18.1 Test蛻・｡・
```text
runUnitTests()
runSchemaTests()
runRepositoryTests()
runReviewPolicyTests()
runMessageStateTests()
runMockAdapterTests()
runCalendarPolicyTests()
runErrorInjectionTests()
runSecurityRedactionTests()
runPhaseAcceptanceTests(phase)
```

Apps Script荳翫〒螟夜Κ蜑ｯ菴懃畑繧剃ｼｴ縺・est縺ｯ縲∵・遉ｺ逧・↑`TEST_MODE`縺ｨ蟆ら畑fixture resource縺縺代ｒ菴ｿ縺・る壼ｸｸ縺ｮmain Calendar縲∝ｮ溘Γ繝ｼ繝ｫ縲∝ｮ鬱ask繧剃ｽｿ繧上↑縺・・
### 18.2 Test邨先棡

`99_TestHarness.gs`縺ｯ谺｡繧定ｿ斐☆縲・
```json
{
  "run_id": "TEST-...",
  "phase": 3,
  "started_at": "ISO-8601",
  "finished_at": "ISO-8601",
  "passed": 24,
  "failed": 0,
  "skipped": 2,
  "tests": [
    {
      "id": "P3-U01",
      "status": "PASS",
      "duration_ms": 12,
      "safe_message": ""
    }
  ]
}
```

Test邨先棡縺ｫ螳溘Γ繝ｼ繝ｫ譛ｬ譁・∝ｮ櫑D縲…redential繧貞性繧√↑縺・・
### 18.3 Static check

Codex縺後Ο繝ｼ繧ｫ繝ｫ縺ｧ螳溯｡悟庄閭ｽ縺ｪ遽・峇縲・
- brace/parenthesis syntax
- duplicate global function蜷・- forbidden term scan
- `getLastRow()`縺ｮTask append蛻ｩ逕ｨ
- `setValue(false)`縺ｮ遨ｺ陦御ｺ句燕謚募・
- raw credential pattern
- `.clasp.json`縺ｮ霑ｽ霍｡
- v1 file copy
- Review Queue/Manual mode/譌ｧOS label
- physical column number縺ｮ讌ｭ蜍吶Ο繧ｸ繝・け逶ｴ譖ｸ縺・- Runtime縺九ｉSheetBuilder蜻ｼ蜃ｺ縺・- Diagnostic縺九ｉDashboard/repair蜻ｼ蜃ｺ縺・- Calendar縺ｮdefault Calendar蜻ｼ蜃ｺ縺・- Gmail譛ｬ譁・・Log蜃ｺ蜉・
萓九・
```bash
find projects/google-workspace-personal-work-os/apps-script-v2 -name '*.gs' -print0 \
  | xargs -0 -I{} sh -c 'node --check < "{}"'

grep -RInE 'Review Queue|OS/TODO蜿冶ｾｼ|Manual mode|譛滓律邂｡逅・' \
  projects/google-workspace-personal-work-os/apps-script-v2

grep -RInE 'API[_-]?KEY\s*=|Authorization: Bearer|BEGIN PRIVATE KEY' \
  projects/google-workspace-personal-work-os/apps-script-v2
```

讀懃ｴ｢邨先棡縺ｯ0莉ｶ縺ｧ縺ゅｋ縺ｹ縺阪ｂ縺ｮ縺ｨ縲∵枚譖ｸ荳翫・隱ｬ譏弱→縺励※險ｱ螳ｹ縺吶ｋ繧ゅ・繧貞玄蛻･縺吶ｋ縲・
## 19. 謇句虚蜿怜・逕ｨsynthetic test email

螳滉ｼ夂､ｾ蜷阪∝ｮ滓｡井ｻｶ蜷阪∝ｮ滉ｺｺ迚ｩ蜷阪ｒ菴ｿ繧上↑縺・・
| ID | Subject萓・| Body marker | 譛溷ｾ・|
| --- | --- | --- | --- |
| M-01 | 繝・せ繝郁ｳ・侭謠仙・ | `[MOCK:NEW_HIGH] 2026/8/31縺ｾ縺ｧ縺ｫ繝・せ繝郁ｳ・侭繧呈署蜃ｺ` | OPEN・区ｭ｣蠑乗悄髯・|
| M-02 | 遒ｺ隱阪′蠢・ｦ・| `[MOCK:NEW_REVIEW] 譚･譛磯・↓遒ｺ隱港 | REVIEW |
| M-03 | 隍・焚萓晞ｼ | `[MOCK:MULTI]` | 2莉ｶ莉･荳翫｛rigin key蛻･ |
| M-04 | 譛滄剞螟画峩 | `[MOCK:UPDATE_DUE]` | pending |
| M-05 | 螳御ｺ・｣邨｡ | `[MOCK:MARK_COMPLETE]` | pending縲∫┌譁ｭDONE縺ｪ縺・|
| M-06 | 蜿匁ｶ磯｣邨｡ | `[MOCK:CANCEL]` | pending縲∫┌譁ｭCANCEL縺ｪ縺・|
| M-07 | 霑比ｿ｡蠕・■ | `[MOCK:WAITING]` | waiting蛟呵｣・|
| M-08 | 諠・ｱ縺ｮ縺ｿ | `[MOCK:INFO]` | Task縺ｪ縺・|
| M-09 | 荳譎る囿螳ｳ | `[MOCK:TRANSIENT_ERROR]` | RETRY |
| M-10 | 髯､螟・| M-01逶ｸ蠖難ｼ義謇句虚/髯､螟冒 | SKIPPED |

## 20. 螳溯｡梧凾髢薙→諤ｧ閭ｽ險ｼ霍｡

蜷Пhase蝣ｱ蜻翫↓谺｡繧貞性繧√ｋ縲・
| Metric | 譚｡莉ｶ |
| --- | --- |
| Setup stage duration | stage蛻･ |
| Quick Diagnostic | 60遘剃ｻ･蜀・岼讓・|
| Manual worker | 120遘痴oft budget |
| Automatic worker | 210遘痴oft budget |
| Gmail messages/run | manual 1縲∥uto 10 |
| Search threads | manual 10縲∥uto 100 |
| Lock wait | 5遘・|
| Stale claim | 30蛻・|
| AI actions/message | 譛螟ｧ10 |
| Sheet reads | 險ｭ螳壹ゝask index縲｀essage State縺ｯ蜴溷援蜷・蝗・|
| Sheet writes | 縺ｾ縺ｨ繧√※螳溯｡・|
| Row expansion | 100陦悟腰菴・|

Google Workspace螳溽腸蠅・〒貂ｬ螳壹〒縺阪↑縺・ｴ蜷医，odex縺ｯ譛ｪ貂ｬ螳壹→譏手ｨ倥☆繧九よ耳貂ｬ蛟､繧貞ｮ滓ｸｬ謇ｱ縺・＠縺ｪ縺・・
## 21. 繝ｪ繧ｹ繧ｯ縺ｨ蛛懈ｭ｢譚｡莉ｶ

| 繝ｪ繧ｹ繧ｯ | 讀懃衍 | 蟇ｾ蠢・|
| --- | --- | --- |
| v1 Sheet縺ｸ隱､setup | v1蜷・version marker | 螟画峩縺帙★蛛懈ｭ｢ |
| 譛ｪ遏･縺ｮ髱樒ｩｺSheet | S00 validation | 螟画峩縺帙★蛛懈ｭ｢ |
| 迚ｩ逅・怙邨り｡瑚ｪ､隱・| logical row test | 荳ｻ繧ｭ繝ｼ蛻励〒蛻､螳・|
| 遨ｺ陦熊ALSE | validation/value test | Data Validation縺縺・|
| duplicate Task | origin key | upsert |
| duplicate Event | Event ID/Task marker | update |
| concurrent worker | Lock/claim | 謗剃ｻ・|
| AI hallucinated Task ID | Task index辣ｧ蜷・| Review/Reject |
| AI辟｡譁ｭ螳御ｺ・・蜿匁ｶ・| Action policy | pending Review |
| Calendar縺縺大､ｱ謨・| Outbox stage | Calendar縺九ｉ蜀埼幕 |
| execution timeout | soft budget | checkpoint |
| credential leak | static/redaction test | commit遖∵ｭ｢ |
| real data fixture | review scan | synthetic縺ｸ鄂ｮ謠・|
| external AI譛ｪ謇ｿ隱・| health/config gate | Mock邯ｭ謖・|
| trigger驥崎､・| saved trigger ID | ensure one |
| main Calendar螟画峩 | Calendar ID check | 蟆ら畑縺ｮ縺ｿ |
| scope creep | Phase file list | 谺｡Phase縺ｸ蟒ｶ譛・|

蜊ｳ譎ょ●豁｢譚｡莉ｶ縲・
- 螳溘ョ繝ｼ繧ｿ繧・redential縺隈it蟾ｮ蛻・∈蜈･縺｣縺・- v1縺ｾ縺溘・譛ｪ遏･Sheet繧貞､画峩縺励◆
- 繝｡繧､繝ｳCalendar繧貞､画峩縺励◆
- Task/Event驥崎､・′逋ｺ逕溘＠縺・- Review Queue縺御ｽ懊ｉ繧後◆
- AI螳御ｺ・・蜿匁ｶ医′辟｡謇ｿ隱阪〒遒ｺ螳壹＠縺・- setup縺ｾ縺溘・worker縺敬ard timeout縺ｸ驕斐＠縺・- 豁｣譛ｬ4繝輔ぃ繧､繝ｫ縺ｨ縺ｮ驥榊､ｧ縺ｪ遏帷崟縺悟愛譏弱＠縺・- 莨夂､ｾ謇ｿ隱榊燕縺ｫ螳蘗I縺ｸ諠・ｱ繧帝∽ｿ｡縺励◆

蛛懈ｭ｢蠕後・蜴溷屏縲∝ｽｱ髻ｿ遽・峇縲∝､画峩縺輔ｌ縺殲esource縲∝ｾｩ譌ｧ謇矩・ｒ蝣ｱ蜻翫＠縲∝享謇九↓邯夊｡後＠縺ｪ縺・・
## 22. Rollback譁ｹ驥・
### 22.1 Code

- Phase縺斐→縺ｫcommit繧貞・髮｢
- 蜑恒hase縺ｮPASS commit繧稚ag縺ｾ縺溘・SHA縺ｧ險倬鹸
- rollback縺ｯ繧ｳ繝ｼ繝牙ｷｮ蛻・□縺代ｒ謌ｻ縺・- Schema/data縺ｮrollback繧偵さ繝ｼ繝詠ollback縺ｸ豺ｷ蝨ｨ縺輔○縺ｪ縺・
### 22.2 Sheets

- setup縺ｯ譁ｰ縺励＞遨ｺ縺ｮSpreadsheet縺縺・- 譌｢蟄狼ask繧貞炎髯､縺励↑縺・- Phase 1・・縺ｧ遐ｴ螢顔噪migration縺ｪ縺・- 荳榊ｮ悟・stage縺ｯProperties縺ｧ蜀埼幕
- Schema螟画峩縺悟ｿ・ｦ√↓縺ｪ縺｣縺溷ｴ蜷医・Phase 8蠕後↓豁｣蠑舟igration繧定ｨｭ險・- 謇句虚縺ｧ蛻励ｒ蜑企勁繝ｻ遘ｻ蜍輔＠縺ｦ蠕ｩ譌ｧ縺励↑縺・
### 22.3 Gmail

- 譌｢蟄倥Γ繝ｼ繝ｫ繧貞炎髯､繝ｻ螟画峩縺励↑縺・- 莠ｺ髢薙Λ繝吶Ν繧貞炎髯､縺励↑縺・- AI繝ｩ繝吶Ν縺ｮrollback縺ｯ蟇ｾ雎｡繧呈・遉ｺ縺励◆陬懷勧function縺ｫ髯仙ｮ・- 蜃ｦ逅・ｸ医∩蛻､螳壹ｒ繝ｩ繝吶Ν縺ｸ萓晏ｭ倥＠縺ｪ縺・
### 22.4 Calendar

- 譛ｬinstance縺御ｽ懊▲縺溷ｰら畑Calendar Event縺縺・- Task ID/system marker縺ｧ謇譛右vent繧堤｢ｺ隱・- main Calendar繧貞､画峩縺励↑縺・- Event蜑企勁蜑阪↓Task豁｣譛ｬ迥ｶ諷九ｒ遒ｺ隱・- Calendar蜈ｨ蜑企勁繧・ｸ諡ｬ蜀堺ｽ懈・繧帝壼ｸｸrollback縺ｫ縺励↑縺・
## 23. Codex縺ｮPhase螳御ｺ・ｱ蜻翫ユ繝ｳ繝励Ξ繝ｼ繝・
```markdown
# Phase N 螳溯｣・ｱ蜻・
## 1. 邨占ｫ・- Gate: PASS / CONDITIONAL PASS / FAIL
- 螳溯｣・ｯ・峇:
- 譛ｪ螳溯｣・ｯ・峇:

## 2. 蜿ら・縺励◆豁｣譛ｬ
- CURRENT_STATUS:
- DECISIONS:
- PROJECT_CONTEXT:
- MASTER_PLAN:
- 陬懷勧莉墓ｧ・

## 3. 螟画峩繝輔ぃ繧､繝ｫ
| Path | Change | Reason |
| --- | --- | --- |

## 4. 螳溯｣・・螳ｹ
-

## 5. 閾ｪ蜍輔ユ繧ｹ繝・| Test ID | Result | Evidence |
| --- | --- | --- |

## 6. Google Workspace謇句虚繝・せ繝・| Test | Result | Evidence / 譛ｪ螳滓命逅・罰 |
| --- | --- | --- |

## 7. 諤ｧ閭ｽ
| Metric | Result | Limit |
| --- | ---: | ---: |

## 8. 諠・ｱ邂｡逅・｢ｺ隱・- 螳溘ョ繝ｼ繧ｿ縺ｪ縺・
- credential縺ｪ縺・
- 螳櫑D縺ｪ縺・
- Log redaction:
- OAuth scope:

## 9. 譌｢遏･縺ｮ蛻ｶ邏・・譛ｪ隗｣豎ｺ
-

## 10. 谺｡Phase縺ｸ騾ｲ繧譚｡莉ｶ
-
```

繝・せ繝医ｒ螳滓命縺ｧ縺阪↑縺九▲縺溷ｴ蜷医～PASS`縺ｨ譖ｸ縺九↑縺・よ悴螳滓命逅・罰縺ｨ蠢・ｦ√↑謇句虚謫堺ｽ懊ｒ險倩ｼ峨☆繧九・
## 24. Codex縺ｸ縺ｮ蛻晏屓謚募・Prompt

谺｡縺ｮPrompt繧偵∵悽譖ｸ縺ｨ`V2_IMPLEMENTATION_SPEC.md`繧坦epository縺ｸ鄂ｮ縺・◆迥ｶ諷九〒菴ｿ逕ｨ縺吶ｋ縲・
```text
Tanukitsune-hub/context-hub 縺ｮ
projects/google-workspace-personal-work-os/
繧貞ｯｾ雎｡縺ｫ縲；oogle Workspace Personal Work OS v2縺ｮPhase 1縺縺代ｒ螳溯｣・＠縺ｦ縺上□縺輔＞縲・
譛蛻昴↓谺｡繧偵％縺ｮ鬆・分縺ｧ隱ｭ繧薙〒縺上□縺輔＞縲・
1. CURRENT_STATUS.md
2. DECISIONS.md
3. PROJECT_CONTEXT.md
4. MASTER_PLAN.md
5. AUTOMATED_DEADLINE_MANAGER_DESIGN.md
6. INITIAL_IMPLEMENTATION_DEFAULTS.md
7. PROTOTYPE_V1_LESSONS_LEARNED.md
8. NAMING_AND_GMAIL_LABELS.md
9. V2_IMPLEMENTATION_SPEC.md
10. V2_CODEX_IMPLEMENTATION_PLAN.md

螳溯｣・ｯ・峇縺ｯV2_CODEX_IMPLEMENTATION_PLAN.md縺ｮPhase 1縺縺代〒縺吶・Phase 2莉･髯阪∝ｮ蘗I謗･邯壹・壼ｸｸInbox讀懃ｴ｢縲，alendar蜷梧悄縺ｯ螳溯｣・＠縺ｪ縺・〒縺上□縺輔＞縲・
蠢・域擅莉ｶ:

- v1繧ｳ繝ｼ繝峨ｒ繧ｳ繝斐・縺励↑縺・- 譁ｰ縺励＞遨ｺ縺ｮGoogle Sheets縺縺代ｒ蟇ｾ雎｡縺ｫ縺吶ｋ
- Review Queue繧剃ｽ懊ｉ縺ｪ縺・- 迢ｬ遶九＠縺櫪anual繝｢繝ｼ繝峨ｒ菴懊ｉ縺ｪ縺・- Task霑ｽ險倅ｽ咲ｽｮ縺ｫgetLastRow()繧剃ｽｿ繧上↑縺・- 遨ｺ陦後∈FALSE繧剃ｺ句燕謚募・縺励↑縺・- 迚ｩ逅・・逡ｪ蜿ｷ縺ｧ縺ｯ縺ｪ縺丞・驛ｨ蛻悠D繧剃ｽｿ縺・- Setup縲ヽuntime縲．iagnostic縲｀igration繧貞・髮｢縺吶ｋ
- setup蜀榊ｮ溯｡後〒譌｢蟄狼ask繧貞｣翫＆縺ｪ縺・- v1縺ｾ縺溘・譛ｪ遏･縺ｮ髱樒ｩｺSheet縺ｯ螟画峩縺帙★蛛懈ｭ｢縺吶ｋ
- API key縲》oken縲∝ｮ櫑D縲∝ｮ溘Γ繝ｼ繝ｫ縲∝・驛ｨURL繧剃ｿ晏ｭ倥＠縺ｪ縺・- 豁｣譛ｬ4繝輔ぃ繧､繝ｫ繧貞､画峩縺励↑縺・- 閾ｪ蜍募・逅・・蛻晄悄OFF
- TEST_MODE縺ｮsynthetic fixture縺縺代ｒ菴ｿ縺・
菴懈･ｭ蜑阪↓縲∝､画峩莠亥ｮ壹ヵ繧｡繧､繝ｫ縺ｨ繝・せ繝郁ｨ育判繧堤､ｺ縺励※縺上□縺輔＞縲・縺昴・蠕後￣hase 1繧貞ｮ溯｣・＠縲∬・蜍輔ユ繧ｹ繝医ｒ螳溯｡後＠縺ｦ縺上□縺輔＞縲・Google Workspace荳翫〒縺励°螳溯｡後〒縺阪↑縺・ユ繧ｹ繝医・縲∵悴螳滓命縺ｨ譏手ｨ倥＠縲∝・菴鍋噪縺ｪ謇矩・ｒ遉ｺ縺励※縺上□縺輔＞縲・
譛蠕後↓縲∵悽險育判縺ｮ縲靴odex縺ｮPhase螳御ｺ・ｱ蜻翫ユ繝ｳ繝励Ξ繝ｼ繝医阪↓蠕薙▲縺ｦ蝣ｱ蜻翫＠縺ｦ縺上□縺輔＞縲・Gate縺梧悴驕斐↑繧画ｬ｡Phase縺ｸ騾ｲ縺ｾ縺ｪ縺・〒縺上□縺輔＞縲・commit縲｝ush縲￣R菴懈・縺ｯ譏守､ｺ萓晞ｼ縺後↑縺・剞繧願｡後ｏ縺ｪ縺・〒縺上□縺輔＞縲・```

## 25. Phase 2莉･髯阪・Codex蜀肴兜蜈･繝ｫ繝ｼ繝ｫ

谺｡Phase繧剃ｾ晞ｼ縺吶ｋ縺ｨ縺阪・縲∝燕Phase縺ｮcommit縺ｾ縺溘・螟画峩荳蠑上→縲￣hase螳御ｺ・ｱ蜻翫ｒCodex縺ｸ隱ｭ縺ｾ縺帙ｋ縲・
Prompt縺ｮ蜀帝ｭ縲・
```text
蜑恒hase N縺ｮGate縺訓ASS縺励※縺・ｋ縺薙→繧堤｢ｺ隱阪＠縺ｦ縺上□縺輔＞縲・PASS縺ｧ縺ｪ縺・ｴ蜷医・Phase N+1繧貞ｮ溯｣・○縺壹∵悴驕秘・岼縺縺代ｒ菫ｮ豁｣縺励※縺上□縺輔＞縲・
莉雁屓縺ｮ螳溯｣・ｯ・峇縺ｯV2_CODEX_IMPLEMENTATION_PLAN.md縺ｮPhase N+1縺縺代〒縺吶・豁｣譛ｬ4繝輔ぃ繧､繝ｫ縲〃2_IMPLEMENTATION_SPEC.md縲∝燕Phase蝣ｱ蜻翫ｒ隱ｭ繧薙〒縺上□縺輔＞縲・```

蜷Пhase縺ｧ蜷後§蜴溷援繧堤ｹｰ繧願ｿ斐☆縲・
- 迴ｾ蝨ｨPhase縺縺・- 螟画峩莠亥ｮ壹→test plan繧貞・縺ｫ謠千､ｺ
- 螳溯｣・- 閾ｪ蜍付est
- 謇句虚test縺ｮ譏守､ｺ
- 諠・ｱ邂｡逅・｢ｺ隱・- Gate蛻､螳・- 谺｡Phase縺ｸ閾ｪ蜍暮ｲ陦後＠縺ｪ縺・
## 26. 豁｣譛ｬ縺ｸ縺ｮ蜿肴丐繝ｫ繝ｼ繝ｫ

譛ｬ莉墓ｧ俶嶌縺ｨ螳溯｣・ｨ育判縺ｯCodex逕ｨ縺ｮ陬懷勧譁・嶌縺ｧ縺ゅｊ縲√◎繧瑚・菴薙〒Decision繧定ｿｽ蜉繝ｻ螟画峩縺励↑縺・・
螳溯｣・∪縺溘・蜿怜・縺ｫ繧医ｊ縲∵ｬ｡縺悟茜逕ｨ閠・↓繧医▲縺ｦ遒ｺ螳壹＠縺溷ｴ蜷医□縺第ｭ｣譛ｬ譖ｴ譁ｰ蛟呵｣懊→縺吶ｋ縲・
- Schema縺ｮ豁｣蠑冗｢ｺ螳・- 迥ｶ諷矩・遘ｻ縺ｮ螟画峩
- Provider縲∬ｪ崎ｨｼ縲［odel縺ｮ豁｣蠑乗治逕ｨ
- 閾ｪ蜍募・逅・atch縺ｮ豁｣蠑丞､
- retention縺ｮ豁｣蠑丞､
- 蝟ｶ讌ｭ譌･繝ｻ逶ｸ蟇ｾ譛滄剞繝ｫ繝ｼ繝ｫ
- Phase 9諡｡蠑ｵ縺ｮ謗｡逕ｨ
- v1 Task migration縺ｮ隕∝凄

豁｣譛ｬ譖ｴ譁ｰ譎ゅ・縲∝・螳ｹ縺ｫ蠢懊§縺ｦ谺｡縺ｸ蜿肴丐縺吶ｋ縲・
| 蜀・ｮｹ | 豁｣譛ｬ |
| --- | --- |
| 逶ｮ逧・・蜑肴署繝ｻ蛻ｶ邏・| `PROJECT_CONTEXT.md` |
| 迴ｾ陦瑚ｨｭ險医・Phase | `MASTER_PLAN.md` |
| 蛻､譁ｭ縺ｨ逅・罰 | `DECISIONS.md` |
| 螳溯｣・憾豕√・谺｡菴懈･ｭ繝ｻ譛ｪ隗｣豎ｺ | `CURRENT_STATUS.md` |

Codex縺ｯ縲∽ｼ夊ｩｱ荳ｭ縺ｮ譯医ｄ閾ｪ蜍慕函謌舌＠縺滓署譯医ｒ遒ｺ螳壻ｺ矩・→縺励※豁｣譛ｬ縺ｸ譖ｸ縺九↑縺・・
