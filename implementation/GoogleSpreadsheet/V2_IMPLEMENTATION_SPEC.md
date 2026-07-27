# Google Workspace Personal Work OS v2 隧ｳ邏ｰ螳溯｣・ｻ墓ｧ俶嶌

- 譁・嶌迚・ 0.9.0-draft
- 菴懈・譌･: 2026-07-23
- Project ID: `google-workspace-personal-work-os`
- 蟇ｾ雎｡: 譁ｰ縺励＞遨ｺ縺ｮGoogle Sheets縺ｫ邏舌▼縺代ｋApps Script v2
- 蝓ｺ貅悶ち繧､繝繧ｾ繝ｼ繝ｳ: `Asia/Tokyo`
- 諠ｳ螳夊ｪｭ閠・ Codex縲、pps Script螳溯｣・球蠖薙√Ξ繝薙Η繝ｼ諡・ｽ・- 迥ｶ諷・ Codex謚募・逕ｨDraft縲よｭ｣譛ｬ4繝輔ぃ繧､繝ｫ繧貞､画峩縺吶ｋ譁・嶌縺ｧ縺ｯ縺ｪ縺・- 螳溯｣・幕蟋区擅莉ｶ: 譛ｬ譖ｸ縺ｨ`V2_CODEX_IMPLEMENTATION_PLAN.md`繧貞酔譎ゅ↓隱ｭ繧縺薙→

## 1. 逶ｮ逧・
譛ｬ譖ｸ縺ｯ縲；mail縺ｧ蜿励￠縺滉ｾ晞ｼ縲∵悄髯仙､画峩縲∝叙豸医∝ｮ御ｺ・∬ｿ比ｿ｡蠕・■遲峨ｒMessage ID蜊倅ｽ阪〒蜃ｦ逅・＠縲；oogle Sheets縺ｮ`繧ｿ繧ｹ繧ｯ荳隕ｧ`縺ｸ蜀ｪ遲峨↓蜿肴丐縺励・㍾隕√↑豁｣蠑乗悄髯舌□縺代ｒ蟆ら畑Google Calendar`閾ｪ蜍墓悄譌･邂｡逅・縺ｸ蜷梧悄縺吶ｋApps Script v2縺ｮ螳溯｣・･醍ｴ・ｒ螳壹ａ繧九・
Codex縺ｯ譛ｬ譖ｸ繧偵悟ｮ梧・繧､繝｡繝ｼ繧ｸ縺ｮ蜿り・阪〒縺ｯ縺ｪ縺上￣hase縺斐→縺ｫ讀懆ｨｼ蜿ｯ閭ｽ縺ｪ螳溯｣・ｻ墓ｧ倥→縺励※謇ｱ縺・よ尠譏ｧ縺ｪ轤ｹ繧貞享謇九↓諡｡蠑ｵ縺帙★縲∝ｮ牙・蛛ｴ縺ｮ蛛懈ｭ｢縲∬ｦ∫｢ｺ隱阪：eature Flag縲∵悴螳溯｣・tub縺ｮ縺・★繧後°繧帝∈縺ｶ縲・
## 2. Source of Truth縺ｨ蜆ｪ蜈磯・ｽ・
螳溯｣・燕縺ｫ谺｡繧定ｪｭ繧縲・
1. `CURRENT_STATUS.md`
2. `DECISIONS.md`
3. `PROJECT_CONTEXT.md`
4. `MASTER_PLAN.md`
5. `AUTOMATED_DEADLINE_MANAGER_DESIGN.md`
6. `INITIAL_IMPLEMENTATION_DEFAULTS.md`
7. `PROTOTYPE_V1_LESSONS_LEARNED.md`
8. `NAMING_AND_GMAIL_LABELS.md`
9. 譛ｬ譖ｸ
10. `V2_CODEX_IMPLEMENTATION_PLAN.md`

遏帷崟譎ゅ・蜆ｪ蜈磯・ｽ阪・縲√ｈ繧頑眠縺励＞Decision縲～CURRENT_STATUS.md`縺ｮ譏守､ｺ險よｭ｣縲～PROJECT_CONTEXT.md`縲～MASTER_PLAN.md`縲」2陬懷勧莉墓ｧ倥」1莉･蜑阪・雉・侭縺ｮ鬆・→縺吶ｋ縲・
譛ｬ譖ｸ縺ｯ豁｣譛ｬ4繝輔ぃ繧､繝ｫ縺ｮ蜀・ｮｹ繧貞・菴灘喧縺吶ｋ縲よｭ｣譛ｬ縺ｨ遏帷崟縺吶ｋ蝣ｴ蜷医・譛ｬ譖ｸ繧剃ｿｮ豁｣縺励∵ｭ｣譛ｬ繧定・蜍慕噪縺ｫ荳頑嶌縺阪＠縺ｪ縺・・
## 3. 縲隈oogle繧ｹ繧ｱ繧ｸ繝･繝ｼ繝ｫ邂｡逅・す繧ｹ繝・Β縲肴立隴ｰ隲悶・蜿悶ｊ霎ｼ縺ｿ

譌ｧGoogle Workspace蛟倶ｺｺ讌ｭ蜍儖S・上せ繧ｱ繧ｸ繝･繝ｼ繝ｫ邂｡逅・ｭｰ隲悶・縲∬ｦ∽ｻｶ縺ｮ逕ｱ譚･縺ｨ蟆・擂諡｡蠑ｵ縺ｮ蜈･蜉帙→縺励※蜿ら・縺吶ｋ縲ゅ◆縺縺励」1縺ｮ繧ｳ繝ｼ繝峨ヽeview Queue縲｀anual繝｢繝ｼ繝峨∵立繝ｩ繝吶Ν縲∫黄逅・・縲｀igration縺ｯ螳溯｣・・蜉帙↓縺励↑縺・・
| 譌ｧ隴ｰ隲悶・隕∫ｴ | 謇ｱ縺・| v2縺ｧ縺ｮ蜿肴丐 |
| --- | --- | --- |
| Sheets繧探ask/TODO縺ｮ豁｣譛ｬ縺ｨ縺吶ｋ | 謗｡逕ｨ | 迴ｾ陦後・`繧ｿ繧ｹ繧ｯ荳隕ｧ`縺ｸ邨ｱ蜷・|
| Calendar繧剃ｼ夊ｭｰ繝ｻ蜃ｺ蠑ｵ繝ｻ螳滉ｽ懈･ｭ譎る俣繝ｻ驥崎ｦ∵悄髯舌↓髯仙ｮ壹☆繧・| 謗｡逕ｨ | 蛻晄悄v2縺梧嶌縺上・縺ｯ蟆ら畑`閾ｪ蜍墓悄譌･邂｡逅・縺縺代ゅΓ繧､繝ｳCalendar縺ｯ螟画峩縺励↑縺・|
| 驥崎ｦ∵悄髯舌→騾壼ｸｸTask繧貞・髮｢縺吶ｋ | 謗｡逕ｨ | 豁｣蠑乗悄髯舌°縺､蠖ｱ髻ｿ螟ｧ縺ｮTask縺縺醍ｵよ律Event |
| Stable Thread Key縺ｧ繧ｹ繝ｬ繝・ラ譖ｴ譁ｰ繧定ｿｽ霍｡縺吶ｋ | 謗｡逕ｨ | 蜈磯ｭMessage ID繧剃ｽｿ逕ｨ |
| 譛滄剞螟画峩繝ｻ蜿匁ｶ医・螳御ｺ・・霑比ｿ｡蠕・■繝ｻ霑ｽ蜉萓晞ｼ繧定ｿｽ霍｡縺吶ｋ | 謗｡逕ｨ | AI Action縺ｨpending review縺ｧ螳溯｣・|
| Review Queue繧貞挨繧ｿ繝悶↓縺吶ｋ | 鄂ｮ謠帶ｸ医∩ | `繧ｿ繧ｹ繧ｯ荳隕ｧ`縺ｮ蜷御ｸ陦後〒蜿怜・繝ｻ蜊ｴ荳・|
| Manual繝｢繝ｼ繝峨ｒ迢ｬ遶矩°逕ｨ縺吶ｋ | 鄂ｮ謠帶ｸ医∩ | AI閾ｪ蜍募・鬘槭→莠ｺ髢楢｣懈ｭ｣縺ｮ蜊倅ｸ讒区・縲・ock縺ｯ蜿怜・隧ｦ鬨鍋畑Adapter |
| OS/邉ｻGmail繝ｩ繝吶Ν | 鄂ｮ謠帶ｸ医∩ | 豁｣蠑・繝ｩ繝吶Ν縺ｸ邨ｱ荳 |
| Workspace Studio繧剃ｽｿ縺・| 荳肴治逕ｨ | Apps Script荳ｭ蠢・|
| 菴懈･ｭ繝悶Ο繝・け閾ｪ蜍募酔譛・| 蠕檎ｶ壽僑蠑ｵ | 蛻晄悄Phase 1・・縺ｧ縺ｯ螳溯｣・＠縺ｪ縺・よ・遉ｺ謫堺ｽ懷梛縺ｧ蜀崎ｨｭ險・|
| 譌･谺｡繝悶Μ繝ｼ繝輔・騾ｱ谺｡繝ｬ繝薙Η繝ｼ | 蠕檎ｶ壽僑蠑ｵ | Task縺ｨCalendar縺ｮread-only髮・ｨ医→縺励※Phase 9蛟呵｣・|
| 髱｢隲・燕繝悶Μ繝ｼ繝輔・髱｢隲・ｾ瑚ｭｰ莠矩鹸/TODO/霑比ｿ｡繝峨Λ繝輔ヨ | 蠕檎ｶ壽僑蠑ｵ | 閾ｪ蜍暮∽ｿ｡繝ｻ豁｣譛ｬ荳頑嶌縺阪ｒ遖∵ｭ｢縺励◆迢ｬ遶九Δ繧ｸ繝･繝ｼ繝ｫ縺ｨ縺励※讀懆ｨ・|
| Projects / Meetings / Docs / Drive / NotebookLM騾｣謳ｺ | 蠕檎ｶ壽僑蠑ｵ | 蛻晄悄繧ｹ繧ｭ繝ｼ繝槭∈豺ｷ蝨ｨ縺輔○縺壹∝ｮ牙ｮ壼ｾ後↓蛻･Decision縺ｧ謗｡蜷ｦ繧堤｢ｺ螳・|

蛻晄悄v2縺ｮ譬ｸ蠢・・繝｡繝ｼ繝ｫ襍ｷ轤ｹTask縺ｨ驥崎ｦ∵悄髯舌〒縺ゅｋ縲ゆｼ夊ｭｰ縲∝・蠑ｵ縲∽ｽ懈･ｭ繝悶Ο繝・け縲∵律谺｡繝ｻ騾ｱ谺｡繝ｬ繝薙Η繝ｼ縲・擇隲・燕蠕悟・逅・・謐ｨ縺ｦ縺壹↓蠕檎ｶ壽僑蠑ｵ螂醍ｴ・∈蛻・ｊ蜃ｺ縺吶ゅ％繧後↓繧医ｊ縲∝・譛溽ｸｦ繝輔Ο繝ｼ繧貞ｰ上＆縺丈ｿ昴■縺ｪ縺後ｉ縲√せ繧ｱ繧ｸ繝･繝ｼ繝ｫ邂｡逅・す繧ｹ繝・Β蜈ｨ菴薙∈諡｡蠑ｵ縺ｧ縺阪ｋ縲・
## 4. 蛻晄悄v2縺ｮ遽・峇

### 4.1 In Scope

- 譁ｰ縺励＞遨ｺ縺ｮGoogle Sheets縺九ｉ縺ｮ谿ｵ髫守噪繧ｻ繝・ヨ繧｢繝・・
- 蛻ｩ逕ｨ閠・髄縺・繧ｿ繝悶・撼陦ｨ遉ｺ邂｡逅・繧ｿ繝・- 豁｣蠑秀mail繝ｩ繝吶Ν7蛟・- Gmail Message ID縺ｫ繧医ｋ譛ｪ蜃ｦ逅・ｮ｡逅・- `謇句虚/蜿冶ｾｼ`莉倥″譛譁ｰ繝｡繝ｼ繝ｫ縺ｮ髯仙ｮ壼叙霎ｼ
- Mock AI Adapter
- Provider-neutral AI Adapter interface
- 1繝｡繝ｼ繝ｫ縺九ｉ隍・焚Action繧呈歓蜃ｺ縺ｧ縺阪ｋ`actions[]`
- `繧ｿ繧ｹ繧ｯ荳隕ｧ`縺ｸ縺ｮ蜀ｪ遲疫psert
- 譁ｰ隕丞呵｣懊→譌｢蟄伜､画峩蛟呵｣懊・蜷御ｸ陦後Ξ繝薙Η繝ｼ
- 譏守､ｺ譛滄剞・乗治逕ｨ貂医∩逶ｸ蟇ｾ譛滄剞縺ｨAI謗ｨ貂ｬ譛滄剞縺ｮ蛻・屬
- 蟆ら畑Calendar`閾ｪ蜍墓悄譌･邂｡逅・縺ｸ縺ｮ驥崎ｦ∵悄髯仙酔譛・- 5蛻・・繝ｼ繝ｪ繝ｳ繧ｰ縺ｮ髢句ｧ九・蛛懈ｭ｢
- Lock縲《oft execution budget縲…heckpoint縲〉etry縲．ead Letter
- Quick Diagnostic縲∵・遉ｺ螳溯｡後・Dashboard譖ｴ譁ｰ
- 譌･譛ｬ隱朸I縲∬恭隱槭・蜀・ΚID繝ｻEnum繝ｻ險ｭ螳壹く繝ｼ
- 髱樊ｩ溷ｯ・・繝・せ繝・arness縺ｨ蟆主・謇矩・
### 4.2 Out of Scope

- v1.x繧ｳ繝ｼ繝峨・繧ｳ繝斐・縲√ヱ繝・メ縲∫峩謗･Migration
- v1繧ｷ繝ｼ繝医・譛ｬ逡ｪ蛻ｩ逕ｨ
- 隕∫｢ｺ隱榊ｰら畑繧ｿ繝・- 迢ｬ遶九＠縺櫪anual繝｢繝ｼ繝・- 繝｡繝ｼ繝ｫ騾∽ｿ｡縲∬ｿ比ｿ｡縲∬ｻ｢騾・- 繝｡繝ｼ繝ｫ蜑企勁縲√い繝ｼ繧ｫ繧､繝悶∵里隱ｭ繝ｻ譛ｪ隱ｭ螟画峩
- 豺ｻ莉倥ヵ繧｡繧､繝ｫ隗｣譫・- 騾∽ｿ｡貂医∩繝｡繝ｼ繝ｫ縺ｮ蟶ｸ譎ょｷ｡蝗・- AI縺ｫ繧医ｋ辟｡謇ｿ隱阪・螳御ｺ・∝叙豸医∵悄髯仙炎髯､縲・㍾隕∝､画峩
- 繝｡繧､繝ｳCalendar荳翫・莨夊ｭｰ縲∝・蠑ｵ縲∽ｽ懈･ｭ繝悶Ο繝・け縺ｮ閾ｪ蜍募､画峩
- Drive繝輔ぃ繧､繝ｫ蜑企勁縲∫ｧｻ蜍輔∝・譛画ｨｩ髯仙､画峩
- Docs豁｣譛ｬ縺ｮ辟｡謇ｿ隱堺ｸ頑嶌縺・- NotebookLM繝√Ε繝・ヨ縺ｮ閾ｪ蜍募ｮ溯｡・- 邂｡逅・・ｨｩ髯舌↓繧医ｋ蜈ｨ蛻ｩ逕ｨ閠・mail髮・ｸｭ隱ｭ蜿・- API繧ｭ繝ｼ縲｝assword縲》oken縲∽ｼ夂､ｾ譛ｪ蜈ｬ陦ｨ諠・ｱ縲∝倶ｺｺ諠・ｱ縺ｮGitHub菫晏ｭ・
## 5. 繧ｻ繧ｭ繝･繝ｪ繝・ぅ縺ｨ驕狗畑蠅・阜

1. 蜷・茜逕ｨ閠・′閾ｪ蛻・・Google Workspace繧｢繧ｫ繧ｦ繝ｳ繝医〒OAuth繧呈価隱阪☆繧九・2. installable trigger縺ｯ菴懈・閠・・讓ｩ髯舌〒蜍輔￥縺溘ａ縲∝推蛻ｩ逕ｨ閠・・繧ｳ繝斐・縺斐→縺ｫ菴懈・縺吶ｋ縲・3. API繧ｭ繝ｼ縺ｯSheet縲√さ繝ｼ繝峨；itHub縲．ocs縺ｸ菫晏ｭ倥＠縺ｪ縺・・4. Script Properties縺ｸ縺ｮ遘伜ｯ・ｿ晏ｭ倥・莨夂､ｾ隕冗ｨ九〒險ｱ蜿ｯ縺輔ｌ縺溷ｴ蜷医□縺代→縺吶ｋ縲ゆｼ夂､ｾ邂｡逅・・Google Cloud隱崎ｨｼ縺ｾ縺溘・Proxy繧貞━蜈医☆繧九・5. 繝ｭ繧ｰ縺ｸ繝｡繝ｼ繝ｫ譛ｬ譁・∵ｷｻ莉倥∬ｪ崎ｨｼ諠・ｱ縲∝ｮ悟・縺ｪAI prompt縲？TTP Authorization header繧剃ｿ晏ｭ倥＠縺ｪ縺・・6. GitHub縺ｫ縺ｯ螳滄圀縺ｮSpreadsheet ID縲，alendar ID縲；mail Message ID縲∝・驛ｨURL繧剃ｿ晏ｭ倥＠縺ｪ縺・・7. 閾ｪ蜍募・逅・・蛻晄悄蛟､蛛懈ｭ｢縲・ock蜿怜・蠕後∵・遉ｺ逧・↑`startAutomation()`縺縺代〒髢句ｧ九☆繧九・8. 譌｢蟄倬撼遨ｺSheet繧ё1迺ｰ蠅・ｒ讀懷・縺励◆蝣ｴ蜷医∝炎髯､繝ｻ螟画鋤縺帙★蛛懈ｭ｢縺吶ｋ縲・9. 螳蘗I髢句ｧ句燕縺ｫ縲￣rovider縲∬ｪ崎ｨｼ縲∬ｪｲ驥代∽ｿ晄戟縲∝ｭｦ鄙貞茜逕ｨ縲∫屮譟ｻ縲＾Auth/UrlFetch蛻ｶ髯舌ｒ遒ｺ隱阪☆繧九・10. 莨夂､ｾ隕冗ｨ九′譛ｬ譖ｸ繧医ｊ蜴ｳ縺励＞蝣ｴ蜷医∽ｼ夂､ｾ隕冗ｨ九ｒ蜆ｪ蜈医☆繧九・
## 6. 蜈ｨ菴薙い繝ｼ繧ｭ繝・け繝√Ε

```text
Gmail
  笏懌楳 蜿嶺ｿ｡Message
  笏懌楳 AI/* labels
  笏披楳 謇句虚/* labels
        竊・GmailGateway
        竊・MessageStateRepository
        竊・EmailPreprocessor
        竊・AiAdapter
        竊・TaskReviewPolicy
        竊・TaskRepository 笏笏竊・繧ｿ繧ｹ繧ｯ荳隕ｧ
        竊・Calendar Outbox
        竊・CalendarSync 笏笏竊・閾ｪ蜍墓悄譌･邂｡逅・
讓ｪ譁ｭ讖溯・:
Setup / Triggers / EditHandler / Logs / Dead Letter
Diagnostics / Dashboard / TestHarness
```

### 6.1 豁｣譛ｬ

- Task縲∵ｭ｣蠑乗悄髯舌∫憾諷九∫｢ｺ隱咲ｵ先棡: `繧ｿ繧ｹ繧ｯ荳隕ｧ`
- 繝｡繝ｼ繝ｫ蜴滓枚: Gmail
- Message蜃ｦ逅・ｲ謐・ `繝｡繝ｼ繝ｫ迥ｶ諷義
- Calendar蜑ｯ菴懃畑騾ｲ謐・ `蜷梧悄迥ｶ諷義
- 驥崎ｦ∵悄髯舌・陦ｨ遉ｺ: `閾ｪ蜍墓悄譌･邂｡逅・
- 繧ｳ繝ｼ繝峨￣rompt縲ヾchema: GitHub荳翫・Apps Script v2繧ｳ繝ｼ繝・- API隱崎ｨｼ: 莨夂､ｾ謇ｿ隱肴ｸ医∩譁ｹ蠑・- Calendar縺ｯTask豁｣譛ｬ縺ｧ縺ｯ縺ｪ縺・・alendar蛛ｴ縺ｮ謇句虚螟画峩繧探ask縺ｸ騾・酔譛溘＠縺ｪ縺・・
## 7. Codex縺御ｽ懈・縺吶ｋ繝ｪ繝昴ず繝医Μ讒区・

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

`.clasp.json.example`縺ｫ縺ｯplaceholder縺縺代ｒ鄂ｮ縺阪∝ｮ滄圀縺ｮScript ID繧偵さ繝溘ャ繝医＠縺ｪ縺・ょ・譛溽沿縺ｯApps Script V8 JavaScript縺ｨJSDoc繧剃ｽｿ逕ｨ縺励ゝypeScript縺ｮbuild step縺ｯ蟆主・縺励↑縺・・
## 8. 繝｢繧ｸ繝･繝ｼ繝ｫ雋ｬ蜍・
| 繝輔ぃ繧､繝ｫ | 雋ｬ蜍・| 遖∵ｭ｢莠矩・|
| --- | --- | --- |
| 00_Config.gs | 螳壽焚縲∬ｨｭ螳壹く繝ｼ縲・num縲∝・譛溷､ | 螟夜Κ繧ｵ繝ｼ繝薙せ蜻ｼ蜃ｺ縺励ヾheet譖ｸ霎ｼ縺ｿ |
| 01_TypesAndSchemas.gs | JSDoc蝙九、I Schema縲∵､懆ｨｼ縲∬｡ｨ遉ｺ蛟､繝槭ャ繝斐Φ繧ｰ | 讌ｭ蜍吝・逅・|
| 02_Setup.gs | setupSystem縲…ontinueSetup縲」1讀懷・縲∵ｮｵ髫主宛蠕｡ | Runtime螳溯｡後∵里蟄倥ョ繝ｼ繧ｿ蜑企勁 |
| 03_SheetBuilder.gs | Sheet/蛻・蜈･蜉幄ｦ丞援/譖ｸ蠑・髱櫁｡ｨ遉ｺ險ｭ螳・| 繝｡繝ｼ繝ｫ蜃ｦ逅・°繧峨・蜻ｼ蜃ｺ縺・|
| 04_MessageStateRepository.gs | Message State縲…laim縲…heckpoint縲〉etry | Gmail讀懃ｴ｢縲ゝask譖ｴ譁ｰ |
| 05_GmailGateway.gs | 讀懃ｴ｢縲｀essage/Thread蜿門ｾ励、I繝ｩ繝吶Ν蜷梧悄 | Task/Calendar逶ｴ謗･譖ｸ霎ｼ縺ｿ |
| 06_EmailPreprocessor.gs | 譛ｬ譁・ｭ｣隕丞喧縲・聞縺募宛髯舌√せ繝ｬ繝・ラ譁・ц逕滓・ | AI騾壻ｿ｡縲ヾheet逶ｴ謗･譖ｸ霎ｼ縺ｿ |
| 07_AiAdapter.gs | Mock縺ｨProvider-neutral interface縲∝ｿ懃ｭ疲､懆ｨｼ | Sheets逶ｴ謗･謫堺ｽ懊∫ｧ伜ｯ・ュ蝣ｱ繝ｭ繧ｰ |
| 08_TaskRepository.gs | Task index縲∬ｫ也炊遨ｺ陦後∝・遲疫psert縲〉ow version | Gmail讀懃ｴ｢縲，alendar逶ｴ謗･謫堺ｽ・|
| 09_TaskReviewPolicy.gs | 閾ｪ蜍慕｢ｺ螳壹∬ｦ∫｢ｺ隱阪∝女蜈･縲∝唆荳九∫ｫｶ蜷亥愛螳・| 螟夜Κ繧ｵ繝ｼ繝薙せ謗･邯・|
| 10_CalendarSync.gs | 蟆ら畑Calendar縺ｮcreate/update/delete縲＾utbox蜃ｦ逅・| Task豁｣譛ｬ縺ｮ迢ｬ閾ｪ螟画峩縲√Γ繧､繝ｳCalendar螟画峩 |
| 11_EditHandler.gs | 蛻ｩ逕ｨ閠・ｷｨ髮・［anual_fields縲∝愛譁ｭ驕ｩ逕ｨ縲＾utbox謚募・ | Gmail/AI蜻ｼ蜃ｺ縺励・㍾縺・・陦悟・逅・|
| 12_Triggers.gs | installable edit縲・蛻・orker縲・幕蟋九・蛛懈ｭ｢ | 莉門茜逕ｨ閠・rigger縺ｮ蜑企勁 |
| 13_LogAndDeadLetter.gs | 讒矩蛹悶Ο繧ｰ縲〉edaction縲〉etry縲．ead Letter | 譛ｬ譁・・token繝ｻAPI key縺ｮ菫晏ｭ・|
| 14_Migrations.gs | 蟆・擂縺ｮv2 schema migration縺ｮ譫縺ｮ縺ｿ | v1竊致2螟画鋤縲∝・譛蘖hase縺ｧ縺ｮ螳溯｣・|
| 15_Dashboard.gs | 譏守､ｺ螳溯｡後・髮・ｨ医∬ｻｽ驥剰｡ｨ遉ｺ | Worker譛ｫ蟆ｾ縺九ｉ縺ｮ閾ｪ蜍墓峩譁ｰ |
| 16_Diagnostics.gs | Quick/Deep Diagnostic | 菫ｮ蠕ｩ縲∝・蜷梧悄縲；mail蜈ｨ讀懃ｴ｢ |
| 17_Utilities.gs | 譌･莉倥”ash縲！D縲〉edaction縲∵凾髢謎ｺ育ｮ・| 讌ｭ蜍吝崋譛峨・蜑ｯ菴懃畑 |
| 18_Worker.gs | 蜃ｦ逅・・´ock縲｜udget縲…heckpoint | 繝ｬ繧､繧｢繧ｦ繝井ｿｮ蠕ｩ |
| 99_TestHarness.gs | Unit/Integration test縲《ynthetic fixture | 螳溘Γ繝ｼ繝ｫ縲∝ｮ櫑D縲∫ｧ伜ｯ・ュ蝣ｱ |
| Menu.gs | 譌･譛ｬ隱槭き繧ｹ繧ｿ繝繝｡繝九Η繝ｼ縲∝・髢菊ntry point | 讌ｭ蜍吶Ο繧ｸ繝・け縺ｮ驥崎､・|
| appsscript.json | V8縲》imezone縲∝ｿ・ｦ∵怙蟆衆Auth scope | 荳崎ｦ√↑鬮伜ｺｦ讓ｩ髯・|

## 9. 繧ｳ繝ｼ繝・ぅ繝ｳ繧ｰ隕冗ｴ・
- 迚ｩ逅・・逡ｪ蜿ｷ繧呈･ｭ蜍吶Ο繧ｸ繝・け縺ｸ逶ｴ譖ｸ縺阪＠縺ｪ縺・り｡・縺ｮ蜀・Κ蛻悠D縺九ｉMap繧剃ｽ懊ｋ縲・- 1螳溯｡悟・縺ｧ險ｭ螳壹ゝask index縲｀essage State繧貞次蜑・蝗槭□縺題ｪｭ縺ｿ霎ｼ繧縲・- Sheet蜈･蜃ｺ蜉帙・驟榊・蛹悶＠縲～getValues()`縺ｨ`setValues()`繧偵∪縺ｨ繧√ｋ縲・- `SpreadsheetApp.flush()`縺ｯSchema菴懈・蠕檎ｭ峨・蠢・ｦ√↑蠅・阜縺縺代〒菴ｿ縺・・- 螟夜Κ繧ｵ繝ｼ繝薙せ縺ｯGateway/Adapter邨檎罰縺ｨ縺励ヽepository縺九ｉ逶ｴ謗･蜻ｼ縺ｰ縺ｪ縺・・- 譌･莉倩ｨ育ｮ励・`Asia/Tokyo`繧呈・遉ｺ縺励゛SON縺ｧ縺ｯ`YYYY-MM-DD`縺ｾ縺溘・ISO 8601繧剃ｽｿ縺・・- `Date`縺ｮ證鈴ｻ冲imezone螟画鋤繧帝∩縺代ｋ縲らｵよ律譛滄剞縺ｯ蟷ｴ譛域律繧呈・遉ｺ逧・↓逕滓・縺吶ｋ縲・- 萓句､悶・`AppError(code, stage, retryable, safeMessage, cause)`縺ｸ豁｣隕丞喧縺吶ｋ縲・- `safeMessage`縺ｫ譛ｬ譁・》oken縲∝ｮ悟・URL query縲？TTP body繧貞性繧√↑縺・・- 蜈ｬ髢菊ntry point莉･螟悶・讖溯・蛻･Object縺ｾ縺溘・荳諢上↑髢｢謨ｰ蜷阪ｒ菴ｿ縺・“lobal蜷崎｡晉ｪ√ｒ驕ｿ縺代ｋ縲・- Runtime荳ｭ縺ｫSchema縲∝・蜉幄ｦ丞援縲∵嶌蠑上∝・鬆・￣rotection繧剃ｿｮ蠕ｩ縺励↑縺・・- Script縺ｫ繧医ｋSheet譖ｴ譁ｰ縺ｯedit trigger繧貞・逋ｺ轣ｫ縺輔○縺ｪ縺・燕謠舌〒繧ゅ∝・逅・・蜀ｪ遲画ｧ繧堤ｶｭ謖√☆繧九・- 繝・せ繝・ixture縺ｯ譫ｶ遨ｺ縺ｮ豌丞錐縲∽ｼ夂､ｾ縲√Γ繝ｼ繝ｫ縲！D縺縺代ｒ菴ｿ縺・・
## 10. Google Sheets迚ｩ逅・ｧ矩

### 10.1 蜈ｱ騾壹Ν繝ｼ繝ｫ

- 陦・: 闍ｱ隱槫・驛ｨ蛻悠D縲る撼陦ｨ遉ｺ繝ｻ菫晁ｭｷ
- 陦・: 譌･譛ｬ隱櫁ｦ句・縺励ょ崋螳・- 陦・莉･髯・ 繝・・繧ｿ
- `繧ｿ繧ｹ繧ｯ荳隕ｧ`蛻晄悄100陦・- `險ｭ螳啻蛻晄悄50陦・- 螻･豁ｴ繝ｻ邂｡逅・ち繝門・譛・00陦・- 陦御ｸ崎ｶｳ譎ゅ・100陦悟腰菴阪〒霑ｽ蜉
- 遨ｺ陦後∈Boolean蛟､繧剃ｺ句燕謚募・縺励↑縺・- Checkbox縺ｯData Validation縺縺代ｒ險ｭ螳壹＠縲∝､縺ｯ螳溘ョ繝ｼ繧ｿ陦御ｽ懈・譎ゅ↓蜈･繧後ｋ
- Task縺ｮ隲也炊陦後・`task_id`縺ｾ縺溘・`origin_key`縺後≠繧玖｡後□縺・- Task霑ｽ險倅ｽ咲ｽｮ縺ｫ`getLastRow()`繧剃ｽｿ繧上↑縺・- 荳ｻ繧ｭ繝ｼ蛻励・譛蛻昴・隲也炊遨ｺ陦後ｒ菴ｿ縺・- 邂｡逅・・縺ｨ邂｡逅・ち繝悶・蜴溷援髱櫁｡ｨ遉ｺ繝ｻ菫晁ｭｷ
- 螟ｧ驥上・蛻怜腰菴恒rotection繧剃ｽ懈・縺励↑縺・
### 10.2 蛻ｩ逕ｨ閠・髄縺代ち繝・
```text
繝繝・す繝･繝懊・繝・繧ｿ繧ｹ繧ｯ荳隕ｧ
險ｭ螳・蜃ｦ逅・ｱ･豁ｴ
繧ｨ繝ｩ繝ｼ繝ｻ蜀榊ｮ溯｡・菴ｿ縺・婿
```

### 10.3 髱櫁｡ｨ遉ｺ邂｡逅・ち繝・
```text
繝｡繝ｼ繝ｫ迥ｶ諷・繧ｷ繧ｹ繝・Β險ｭ螳・繝励Ο繝ｳ繝励ヨ迚育ｮ｡逅・蜷梧悄迥ｶ諷・```

### 10.4 繧ｿ繧ｹ繧ｯ荳隕ｧ縺ｮ蜈ｨ蛻・
| 蜀・ΚID | 譌･譛ｬ隱櫁｡ｨ遉ｺ | 蝙・| 邱ｨ髮・ｸｻ菴・| 蛻晄悄蛟､ | 讀懆ｨｼ繝ｻ諢丞袖 | 陦ｨ遉ｺ |
| --- | --- | --- | --- | --- | --- | --- |
| needs_review | 隕∫｢ｺ隱・| Boolean | 閾ｪ蜍・| 螳溘ョ繝ｼ繧ｿ陦後・縺ｿFALSE/TRUE | FALSE縺ｪ繧…7746 tokens truncated…stic隴ｦ蜻翫り・蜍穂ｸ頑嶌縺阪・谺｡縺ｮ豁｣隕乗峩譁ｰ譎・- 1蝗槭・隍・焚繧ｻ繝ｫedit縺ｯ隧ｲ蠖楢｡後ｒ驥崎､・賜髯､縺励※蜃ｦ逅・- Sheet-only縺ｮ豁｣隕丞喧縺ｨDecision驕ｩ逕ｨ縺ｯedit蜃ｦ逅・・縺ｧ蜿ｯ閭ｽ
- Gmail縲、I縲，alendar繧弾dit蜃ｦ逅・°繧臥峩謗･蜻ｼ縺ｰ縺ｪ縺・- Calendar螟画峩縺ｯ`蜷梧悄迥ｶ諷義縺ｸOutbox謚募・
- `row_version`縺ｨ`updated_at`繧呈峩譁ｰ
- Script譖ｸ霎ｼ縺ｿ縺ｫ繧医ｋtrigger髱樒匱轣ｫ縺ｫ萓晏ｭ倥＠縺吶℃縺壹∝・逅・・蜀ｪ遲峨↓縺吶ｋ

### 21.1 迥ｶ諷区ｭ｣隕丞喧蜆ｪ蜈磯・ｽ・
1. `excluded=TRUE` 竊・status=EXCLUDED縲…ompleted=FALSE縲『aiting=FALSE
2. `completed=TRUE` 竊・status=DONE縲‘xcluded=FALSE縲『aiting=FALSE
3. status=CANCELLED 竊・completed=FALSE縲‘xcluded=FALSE縲『aiting=FALSE
4. `waiting_for_reply=TRUE` 竊・status=WAITING
5. WAITING迥ｶ諷九〒waiting繧巽ALSE 竊・status=OPEN
6. 縺昴・莉悶・蛻ｩ逕ｨ閠・・譛牙柑縺ｪstatus繧堤ｶｭ謖・
REVIEW荳ｭ縺ｫcompleted/excluded縺檎ｷｨ髮・＆繧後◆蝣ｴ蜷医・縲∽ｺｺ縺ｮ譏守､ｺ謫堺ｽ懊→縺励※險ｱ蜿ｯ縺励∵悴驕ｩ逕ｨpending繧偵け繝ｪ繧｢縺励※螻･豁ｴ縺ｸ險倬鹸縺吶ｋ縲・
## 22. TaskRepository

### 22.1 隱ｭ蜿・
- 陦・縺九ｉColumn Map繧・蝗樔ｽ懈・
- `task_id`縺ｾ縺溘・`origin_key`縺檎ｩｺ縺ｮ陦後ｒ辟｡隕・- `task_id`, `origin_key`, `stable_thread_key`蛻･index繧偵Γ繝｢繝ｪ縺ｧ菴懈・
- JSON field縺ｯparse error繧呈､懷・縺励∫ｩｺ縺ｧ陬懷ｮ後○縺啼rror縺ｸ
- 迚ｩ逅・・菴咲ｽｮ縺ｫ萓晏ｭ倥＠縺ｪ縺・
### 22.2 霑ｽ險・
1. `task_id`蛻励・陦・莉･髯阪ｒ荳諡ｬ隱ｭ蜿・2. 譛蛻昴・遨ｺ繧ｻ繝ｫ陦後ｒ隲也炊遨ｺ陦後→縺吶ｋ
3. 縺ｪ縺代ｌ縺ｰ100陦瑚ｿｽ蜉
4. 1陦悟・繧帝・蛻励〒荳諡ｬ譖ｸ霎ｼ縺ｿ
5. 螳溘ョ繝ｼ繧ｿBoolean縺縺代ｒ險ｭ螳・6. index繧偵Γ繝｢繝ｪ荳翫〒譖ｴ譁ｰ
7. `getLastRow()`縺ｯ菴ｿ繧上↑縺・
### 22.3 upsert

- `origin_key`譌｢蟄・ 譁ｰ隕剰｡後ｒ菴懊ｉ縺壹∝酔縺歪lassification縺ｮ蜀埼←逕ｨ縺ｯno-op
- `target_task_id`譌｢蟄・ Policy縺ｫ蠕薙▲縺ｦpending縺ｾ縺溘・螳牙・譖ｴ譁ｰ
- 譁ｰ隕・ UUID謗｡逡ｪ縺励・陦御ｽ懈・
- 蜷御ｸMessage縺ｫ隍・焚Action: action index縺斐→縺ｫ迢ｬ遶黍rigin key
- 荳驛ｨAction螟ｱ謨・ classification縺ｨAction邨先棡繧剃ｿ晏ｭ倥＠縲∵悴螳御ｺ・ction縺縺大・髢・- Task譖ｸ霎ｼ縺ｿ蠕後↓Message State checkpoint繧剃ｿ晏ｭ・
## 23. 譛滄剞隗｣驥・
蝓ｺ貅釦imezone縺ｯ`Asia/Tokyo`縲・
| 陦ｨ迴ｾ | 蛻晄悄蜃ｦ逅・|
| --- | --- |
| YYYY/MM/DD, YYYY-MM-DD, YYYY蟷ｴM譛・譌･ | 譏守､ｺ譛滄剞 |
| 莉企ｱ荳ｭ | 蠖楢ｩｲ騾ｱ驥第屆譌･縲３ELATIVE |
| 譚･騾ｱ荳ｭ | 鄙碁ｱ驥第屆譌･縲３ELATIVE |
| 譛域忰 | 蠖楢ｩｲ證ｦ譛域忰縲３ELATIVE |
| 譚･騾ｱ驥第屆譌･ | 鄙碁ｱ驥第屆譌･縲３ELATIVE |
| 縺ｪ繧九∋縺乗掠縺上∵掠諤･縺ｫ縲∬ｿ第律荳ｭ | AMBIGUOUS縲りｦ∫｢ｺ隱・|
| 蝟ｶ讌ｭ譌･謖・ｮ・| 蛻晄悄迚医〒閾ｪ蜍慕｢ｺ螳壹＠縺ｪ縺・りｦ∫｢ｺ隱・|
| AI謗ｨ貂ｬ | suggested_due_date縺縺・|

驕主悉譌･縲∵悄髯仙炎髯､縲∬､・焚蛟呵｣懊》imezone荳肴・縲∝霧讌ｭ譌･險育ｮ励・隕∫｢ｺ隱阪・
## 24. Calendar蜷梧悄

### 24.1 蟆ら畑Calendar

豁｣蠑丞錐遘ｰ縺ｯ`閾ｪ蜍墓悄譌･邂｡逅・縲ょ・譛殼2縺梧嶌霎ｼ縺ｿ蜿ｯ閭ｽ縺ｪCalendar縺ｯ縺薙ｌ縺縺代ゅΓ繧､繝ｳCalendar縺ｸ譖ｸ縺九↑縺・・
### 24.2 逋ｻ骭ｲ蜿ｯ閭ｽ譚｡莉ｶ

- `needs_review=FALSE`
- `due_date`縺ゅｊ
- `deadline_basis`縺窪XPLICIT縺ｾ縺溘・謗｡逕ｨ貂医∩RELATIVE
- status縺轡ONE/EXCLUDED/CANCELLED縺ｧ縺ｪ縺・- `calendar_sync_mode`縺君ONE縺ｧ縺ｪ縺・- AUTO縺ｮ蝣ｴ蜷医・㍾隕√き繝・ざ繝ｪ縺九▽importance荳螳壻ｻ･荳・- FORCE縺ｮ蝣ｴ蜷医ｂ豁｣蠑乗悄髯仙ｿ・・- AI謗ｨ貂ｬ譛滄剞縺縺代〒縺ｯ逋ｻ骭ｲ縺励↑縺・
AUTO蟇ｾ雎｡縲・
```text
EXTERNAL_SUBMISSION
FINAL_MATERIAL
CONTRACT_APPLICATION
BID
LEGAL_TAX_REGULATORY
OTHER_HIGH_IMPACT
```

### 24.3 Event

- 邨よ律Event
- 繧ｿ繧､繝医Ν: `縲先悄髯舌・task_title>`
- 隱ｬ譏・ sender縲《ubject縲‥eadline basis縲《ource email縲ゝask ID marker
- marker: `[WORKOS_TASK_ID:<task_id>]`
- guest縺ｪ縺・- invite騾∽ｿ｡縺ｪ縺・- Event ID繧探ask縺ｨOutbox縺ｫ菫晏ｭ・
### 24.4 desired action

```text
CREATE
UPDATE
DELETE
NOOP
```

- Event縺ｪ縺励・eligible 竊・CREATE
- Event縺ゅｊ繝ｻeligible繝ｻ蜀・ｮｹ蟾ｮ蛻・竊・UPDATE
- Event縺ゅｊ繝ｻineligible/terminal 竊・DELETE
- 蟾ｮ蛻・↑縺・竊・NOOP

Event ID縺瑚ｦ九▽縺九ｉ縺ｪ縺・ｴ蜷医∵悄髯先律莉倩ｿ代・蟆ら畑Calendar縺縺代ｒ髯仙ｮ壽､懃ｴ｢縺励ゝask marker荳閾ｴ繧堤｢ｺ隱阪☆繧九ょ・Calendar繝ｻ蜈ｨ譛滄俣繧定ｵｰ譟ｻ縺励↑縺・りｦ九▽縺九ｉ縺ｪ縺代ｌ縺ｰ譁ｰ隕丈ｽ懈・縺励・㍾隍・呵｣懊ｒerror縺ｸ險倬鹸縺吶ｋ縲・
### 24.5 Calendar縺ｨMessage蜀崎ｩｦ陦・
Calendar螟ｱ謨励・`蜷梧悄迥ｶ諷義縺ｸ谿九＠縲ゝask譖ｸ霎ｼ縺ｿ縺ｨAI蛻・｡槭ｒ繧・ｊ逶ｴ縺輔↑縺・よ怙螟ｧ3蝗槫ｾ後・Dead Letter縲５ask豁｣譛ｬ縺ｯ菫晄戟縺吶ｋ縲・
## 25. Worker

### 25.1 蜈ｬ髢矩未謨ｰ

```text
runManualImport()
runMockAcceptance()
runScheduledWorker()
processPendingReviews()
syncPendingCalendarJobs()
retrySelectedErrors()
```

### 25.2 蜃ｦ逅・・
```text
1. Config隱ｭ霎ｼ
2. Script Lock
3. run_id菴懈・
4. Message State / Task index隱ｭ霎ｼ
5. 蛟呵｣懈､懃ｴ｢
6. Message claim
7. preprocess
8. 菫晏ｭ俶ｸ医∩classification遒ｺ隱・9. 蠢・ｦ√↑繧陰I classify
10. classification菫晏ｭ・11. Policy蛻､螳・12. Task upsert
13. Gmail AI label蜷梧悄
14. Calendar Outbox謚募・
15. Calendar蜃ｦ逅・16. Message checkpoint / DONE
17. Run summary菫晏ｭ・18. Lock release
```

Dashboard譖ｴ譁ｰ縲〕ayout菫ｮ蠕ｩ縲．eep Diagnostic繧淡orker譛ｫ蟆ｾ縺ｧ螳溯｡後＠縺ｪ縺・・
### 25.3 Soft budget

- 謇句虚120遘・- 閾ｪ蜍・10遘・- 邨碁℃譎る俣繧貞推螟ｧstage蜑阪↓遒ｺ隱・- budget谿九′螳牙・菴呵｣墓悴貅縺ｪ繧画眠隕縦laim蛛懈ｭ｢
- 迴ｾ蝨ｨMessage縺ｮcheckpoint繧剃ｿ晏ｭ倥＠縺ｦ邨ゆｺ・- Google縺ｮ譛螟ｧ螳溯｡梧凾髢薙ｒ菴ｿ縺・・繧峨↑縺・
## 26. Retry縲．ead Letter縲√Ο繧ｰ

### 26.1 Retry

```text
retry 1: 5蛻・ｾ・retry 2: 15蛻・ｾ・retry 3: 60蛻・ｾ・retry 3螟ｱ謨怜ｾ・ DEAD
```

Retryable萓九・
- AI timeout
- HTTP 429
- HTTP 5xx
- 荳譎ら噪Gmail/Sheets/Calendar service error
- Lock遶ｶ蜷・
Non-retryable萓九・
- Schema荳肴ｭ｣
- v1迺ｰ蠅・- 蠢・亥・谺關ｽ
- 荳肴ｭ｣Enum
- 隱崎ｨｼ譛ｪ險ｭ螳・- 莨夂､ｾ隕冗ｨ倶ｸ顔ｦ∵ｭ｢
- 蟇ｾ雎｡Task隗｣豎ｺ荳崎・縺ｫ繧医ｋ閾ｪ蜍募､画峩

Non-retryable縺ｪ讌ｭ蜍呎尠譏ｧ諤ｧ縺ｯ隕∫｢ｺ隱阪∵ｧ区・荳榊ｙ縺ｯerror縺ｨ縺吶ｋ縲・
### 26.2 Error code萓・
```text
E_SETUP_NOT_EMPTY
E_V1_DETECTED
E_SCHEMA_MISSING_COLUMN
E_INVALID_ENUM
E_INVALID_JSON
E_LOCK_TIMEOUT
E_GMAIL_FETCH
E_AI_TIMEOUT
E_AI_RATE_LIMIT
E_AI_SCHEMA
E_TASK_CONFLICT
E_TARGET_NOT_RESOLVED
E_CALENDAR_NOT_FOUND
E_CALENDAR_SYNC
E_AUTH_REQUIRED
E_BUDGET_EXHAUSTED
```

### 26.3 Redaction

繝ｭ繧ｰ縺ｸ谿九○繧九・
- error code
- stage
- run_id
- Message/Thread/Task ID
- HTTP status
- Provider蜷・- model蜷・- prompt version
- 蜃ｦ逅・ｻｶ謨ｰ
- sanitized summary

谿九＆縺ｪ縺・・
- 繝｡繝ｼ繝ｫ譛ｬ譁・- 豺ｻ莉・- API key/token/password
- Authorization header
- Cookie
- AI request蜈ｨ譁・- 莨夂､ｾ譛ｪ蜈ｬ陦ｨ諠・ｱ縺ｮ閾ｪ逕ｱ險倩ｿｰ
- stack trace蜀・・request payload

## 27. Diagnostic

### 27.1 Quick Diagnostic

60遘剃ｻ･蜀・ｒ逶ｮ讓吶・
- 蠢・・heet
- 陦・蜀・Κ蛻悠D
- 隕句・縺励→蝙・- 譁・ｭ怜・蛻励↓Checkbox縺後↑縺・％縺ｨ
- 遨ｺ陦後↓FALSE縺後↑縺・％縺ｨ
- 豁｣蠑秀mail繝ｩ繝吶Ν
- 蟆ら畑Calendar ID
- installable edit trigger
- automation trigger迥ｶ諷・- Properties
- AI Adapter health
- version謨ｴ蜷・- 驥崎､㏄ask_id / origin_key

陦後ｏ縺ｪ縺・・
- Dashboard譖ｴ譁ｰ
- Task蜈ｨ陦悟・險育ｮ励・譖ｸ謠帙∴
- layout菫ｮ蠕ｩ
- Calendar蜈ｨEvent蜷梧悄
- Gmail蜈ｨ讀懃ｴ｢

### 27.2 Deep Diagnostic

Phase 7莉･髯阪∵・遉ｺ螳溯｡後・縺ｿ縲・
- limited sample縺ｧTask/Message/Outbox謨ｴ蜷・- stale claim
- unresolved error
- Event ID縺ｨTask marker縺ｮ髯仙ｮ夂・蜷・- retention蟇ｾ雎｡莉ｶ謨ｰ
- Schema/validation drift

Deep Diagnostic繧り・蜍穂ｿｮ蠕ｩ縺励↑縺・ゆｿｮ蠕ｩ縺ｯ蛟句挨command縺ｨ縺吶ｋ縲・
## 28. Dashboard縺ｨ繝｡繝九Η繝ｼ

### 28.1 Dashboard

Worker縺九ｉ譖ｴ譁ｰ縺励↑縺・ＡrefreshDashboard()`縺ｾ縺溘・迢ｬ遶逆rigger縺ｧ譖ｴ譁ｰ縺吶ｋ縲・
譛菴手｡ｨ遉ｺ縲・
- 隕∫｢ｺ隱堺ｻｶ謨ｰ
- 莉頑律譛滄剞
- 7譌･莉･蜀・悄髯・- 譛滄剞雜・℃
- 霑比ｿ｡蠕・■
- 譛ｪ隗｣豎ｺerror
- 譛邨り・蜍募・逅・・蜉滓凾蛻ｻ
- automation ON/OFF
- AI Provider
- Quick Diagnostic邨先棡

### 28.2 繧ｫ繧ｹ繧ｿ繝繝｡繝九Η繝ｼ

```text
讌ｭ蜍儖S v2
笏懌楳 蛻晄悄繧ｻ繝・ヨ繧｢繝・・
笏懌楳 繧ｻ繝・ヨ繧｢繝・・繧堤ｶ夊｡・笏懌楳 Quick Diagnostic
笏懌楳 Mock蜿怜・繝・せ繝・笏懌楳 謇句虚/蜿冶ｾｼ繧・莉ｶ蜃ｦ逅・笏懌楳 Calendar蜷梧悄
笏懌楳 驕ｸ謚槭お繝ｩ繝ｼ繧貞・隧ｦ陦・笏懌楳 Dashboard譖ｴ譁ｰ
笏懌楳 閾ｪ蜍募・逅・ｒ髢句ｧ・笏懌楳 閾ｪ蜍募・逅・ｒ蛛懈ｭ｢
笏披楳 蜈ｨ繝・せ繝亥ｮ溯｡・```

蜊ｱ髯ｺ縺ｪ謫堺ｽ懊・遒ｺ隱硬ialog繧定｡ｨ遉ｺ縺吶ｋ縲る幕蟋九・蛛懈ｭ｢縺ｯ迴ｾ蝨ｨ迥ｶ諷九→蟇ｾ雎｡trigger繧定｡ｨ遉ｺ縺吶ｋ縲・
## 29. Manifest縺ｨOAuth

`appsscript.json`縺ｯV8縺ｨ`Asia/Tokyo`繧呈・遉ｺ縺吶ｋ縲０Auth scope縺ｯPhase縺斐→縺ｮ蠢・ｦ∵怙蟆城剞縺ｨ縺励∝・譛溘°繧吋rive縲．ocs縲｀ail send遲峨ｒ霑ｽ蜉縺励↑縺・・
諠ｳ螳嘖cope鄒､縲・
- Spreadsheet current file
- Gmail read/modify labels
- Calendar write for蟆ら畑Calendar
- Script trigger
- External request縺ｯ螳蘗IPhase縺縺・
Scope縺ｮ譛邨ょ､縺ｯ螳溯｣・凾縺ｫGoogle蜈ｬ蠑剰ｳ・侭縺ｨ莨夂､ｾ邂｡逅・・宛邏・ｒ蜀咲｢ｺ隱阪☆繧九・
## 30. Apps Script quota險ｭ險・
Google蜈ｬ蠑上・Apps Script螳溯｡御ｸ企剞縺ｯ螟画峩縺輔ｌ蠕励ｋ縺溘ａ縲∵怙螟ｧ蛟､繧呈･ｭ蜍吶Ο繧ｸ繝・け縺ｫ蝓九ａ霎ｼ縺ｾ縺ｪ縺・・026-07-23譎らせ縺ｮ蜈ｬ蠑剰ｳ・侭縺ｧ縺ｯscript runtime縺ｯ1螳溯｡・蛻・□縺後∵悽繧ｷ繧ｹ繝・Β縺ｯ謇句虚120遘偵∬・蜍・10遘偵・soft limit繧呈治逕ｨ縺励∝ｮ牙・縺ｪcheckpoint縺ｧ邨ゆｺ・☆繧九・
- quota exception繧池etryable/non-retryable縺ｸ蛻・｡・- Gmail縲￣roperties縲》rigger遲峨・譌･谺｡quota繧堤屮隕・- 1螳溯｡後〒蜈ｨ谿倶ｻｶ繧貞・逅・＠繧医≧縺ｨ縺励↑縺・- trigger縺ｮ驥崎､・ｽ懈・繧帝亟縺・- provider timeout繧但pps Script縺ｮ谿区凾髢薙ｈ繧顔洒縺剰ｨｭ螳・- quota蛟､繧坦EADME縺ｸ蝗ｺ螳壹さ繝斐・縺帙★蜈ｬ蠑酋RL繧貞盾辣ｧ縺吶ｋ

## 31. 繧ｹ繧ｱ繧ｸ繝･繝ｼ繝ｫ邂｡逅・僑蠑ｵ螂醍ｴ・
譌ｧ縲隈oogle繧ｹ繧ｱ繧ｸ繝･繝ｼ繝ｫ邂｡逅・す繧ｹ繝・Β縲崎ｭｰ隲悶ｒ蟆・擂謗･邯壹☆繧九◆繧√∝・譛殼2縺ｯ谺｡繧貞ｮ医ｋ縲・
### 31.1 繝｡繧､繝ｳCalendar

- 莨夊ｭｰ縲・擇隲・∝・蠑ｵ縲∵兜雉・ｧ泌藤莨壹∝ｮ滄圀縺ｮ菴懈･ｭ譎る俣縺ｯ繝｡繧､繝ｳCalendar縺ｧ莠ｺ縺檎ｮ｡逅・- 蛻晄悄v2縺ｯread/write縺励↑縺・- `閾ｪ蜍墓悄譌･邂｡逅・縺ｨ豺ｷ蝨ｨ縺輔○縺ｪ縺・
### 31.2 Phase 9蛟呵｣彿nterface

```javascript
class ScheduleContextGateway {
  listEvents(windowStart, windowEnd) {}
}

class BriefService {
  buildDailyBrief(date, tasks, events) {}
  buildWeeklyReview(weekStart, tasks, events) {}
}

class WorkBlockPlanner {
  propose(task, freeBusy) {}
  createApprovedBlock(proposal) {}
}

class MeetingAutomation {
  buildPrepCandidate(event, contextRefs) {}
  buildPostMeetingCandidates(event, artifacts) {}
}
```

### 31.3 蠕檎ｶ壽僑蠑ｵ縺ｮ螳牙・譚｡莉ｶ

- read-only daily/weekly brief縺九ｉ髢句ｧ・- 菴懈･ｭ繝悶Ο繝・け縺ｯ蛻ｩ逕ｨ閠・・譏守､ｺ謇ｿ隱榊ｾ後□縺台ｽ懈・
- 譛滄剞Event縺ｨ菴懈･ｭEvent繧貞挨category繝ｻ蛻･蜷梧悄ID縺ｧ邂｡逅・- Meeting蠕後・Task縺ｯ騾壼ｸｸ縺ｮReview Policy繧帝壹☆
- 霑比ｿ｡譁・・draft蛟呵｣懊∪縺ｧ縲り・蜍暮∽ｿ｡縺励↑縺・- Project Context縲．ecision Log縲｀eeting Note縺ｯ蛟呵｣懊ｒ菴懊ｋ縺縺代〒豁｣譛ｬ繧堤┌謇ｿ隱堺ｸ頑嶌縺阪＠縺ｪ縺・- NotebookLM縺ｯ繝ｪ繝ｳ繧ｯ縺ｨ莠ｺ謇区､懃ｴ｢縲・pps Script縺九ｉ繝√Ε繝・ヨ閾ｪ蜍募ｮ溯｡後＠縺ｪ縺・- Projects/Meetings譁ｰ繧ｿ繝冶ｿｽ蜉縺ｯ蛻･Decision縺ｨSchema migration縺ｧ陦後≧

## 32. Test specification

### 32.1 Unit

- Column Map
- 譌･譛ｬ隱櫁｡ｨ遉ｺ蛟､縺ｨ闍ｱ隱昿num縺ｮ蜿梧婿蜷大､画鋤
- UUID/Hash/Origin Key
- 隲也炊遨ｺ陦梧､懃ｴ｢
- Task index縺ｨ驥崎､・､懷・
- JSON parse/validation
- Action semantic validation
- confidence policy
- manual_fields conflict
- Review accept/reject
- status豁｣隕丞喧
- date parse縺ｨrelative deadline
- Calendar eligibility
- desired action
- Message state transition
- retry schedule
- stale claim
- redaction
- soft budget

### 32.2 Integration fixture

| ID | 蜈･蜉・| 譛溷ｾ・ｵ先棡 |
| --- | --- | --- |
| IT-01 | [MOCK:NEW_EXPLICIT]縲∵・遉ｺ譛滄剞 | OPEN Task 1莉ｶ縲∝ｿ・ｦ√↑繧韻alendar CREATE |
| IT-02 | [MOCK:NEW_REVIEW] | REVIEW Task 1莉ｶ縲，alendar縺ｪ縺・|
| IT-03 | [MOCK:MULTI_ACTION] | 1 Message縺九ｉ隍・焚Task縲｛rigin_key蛻･ |
| IT-04 | IT-01繧貞・螳溯｡・| Task/Event驥崎､・↑縺・|
| IT-05 | [MOCK:UPDATE_DUE] | 譌｢蟄狼ask邯ｭ謖√｝ending縲∝女蜈･蠕後□縺租ue譖ｴ譁ｰ |
| IT-06 | [MOCK:MARK_COMPLETE] | 閾ｪ蜍募ｮ御ｺ・○縺嗔ending |
| IT-07 | 蛻ｩ逕ｨ閠・′due_date繧堤ｷｨ髮・ｾ窟I螟画峩 | manual_fields遶ｶ蜷医〒pending |
| IT-08 | 謇句虚/髯､螟悶≠繧・| Task閾ｪ蜍穂ｽ懈・縺ｪ縺・|
| IT-09 | Calendar CREATE竊旦PDATE竊奪ELETE | 蜷御ｸEvent ID繧呈峩譁ｰ縺励》erminal縺ｧ蜑企勁 |
| IT-10 | [MOCK:TRANSIENT_ERROR] | 5/15/60 retry縲∽ｿ晏ｭ俶ｸ医∩stage縺九ｉ蜀埼幕 |
| IT-11 | 遨ｺ陦靴heckbox Validation | 遨ｺ陦悟､縺ｯ遨ｺ縲５ask縺ｯ3陦檎岼莉倩ｿ・|
| IT-12 | setup蜀榊ｮ溯｡・| Task豸亥､ｱ繝ｻSchema驥崎､・↑縺・|
| IT-13 | v1譌｢遏･Sheet | 蛛懈ｭ｢縺励∝､画峩縺ｪ縺・|
| IT-14 | Quick Diagnostic | 60遘剃ｻ･蜀・∵嶌謠帙∴縺ｪ縺・|

### 32.3 諠・ｱ邂｡逅・ユ繧ｹ繝・
- repository讀懃ｴ｢縺ｧtoken縲∝ｮ櫑D縲∝ｮ溘Γ繝ｼ繝ｫ譛ｬ譁・′縺ｪ縺・- Logs縺ｫ譛ｬ譁・、uthorization縲、PI key縺後↑縺・- test fixture縺悟ｮ悟・縺ｫ譫ｶ遨ｺ
- Calendar description縺瑚ｨｱ螳ｹ遽・峇
- AI provider縺ｸ騾√ｋfield縺御ｻ墓ｧ倅ｻ･蜀・- automation蛻晄悄蛟､OFF

## 33. 蛻晄悄v2 Definition of Done

- 譁ｰ縺励＞遨ｺ縺ｮSheet縺九ｉsetup螳御ｺ・- Task縺・陦檎岼莉倩ｿ代∈蜈･繧・- 遨ｺ陦後↓FALSE縺ｪ縺・- 繧ｳ繝｡繝ｳ繝亥・縺ｫCheckbox縺ｪ縺・- 蜷後§Message繧堤ｹｰ繧願ｿ斐＠縺ｦ繧５ask驥崎､・↑縺・- 蜷後§Task縺ｮEvent驥崎､・↑縺・- Review Queue縺ｪ縺励〒蜿怜・繝ｻ蜊ｴ荳句ｮ御ｺ・- AI螳御ｺ・・蜿匁ｶ医・驥崎ｦ∝､画峩縺檎┌謇ｿ隱咲｢ｺ螳壹＆繧後↑縺・- Calendar縺ｯ驥崎ｦ√↑豁｣蠑乗悄髯舌□縺・- Mock邵ｦ繝輔Ο繝ｼ蜷域ｼ
- Quick Diagnostic 60遘剃ｻ･蜀・- manual worker 120遘偵∥uto worker 210遘剃ｻ･蜀・↓螳牙・邨ゆｺ・- retry縺茎tage縺九ｉ蜀埼幕
- setup蜀榊ｮ溯｡後〒繝・・繧ｿ遐ｴ謳阪↑縺・- Logs縺ｫ讖溷ｯ・ュ蝣ｱ縺ｪ縺・- 蛻･縺ｮ譁ｰ隕集orkspace迺ｰ蠅・〒謇句ｼ墓嶌縺縺代°繧牙・迴ｾ蜿ｯ閭ｽ
- 螳蘗I繝ｻ閾ｪ蜍募・逅・・莨夂､ｾ謇ｿ隱榊ｾ後↓譏守､ｺ髢句ｧ・
## 34. 譛ｪ隗｣豎ｺ莠矩・
谺｡縺ｯ譛ｬ譖ｸ縺ｧ遒ｺ螳壹＠縺ｪ縺・・
- 莨夂､ｾ迺ｰ蠅・〒豁｣蠑丞茜逕ｨ縺ｧ縺阪ｋAI Provider
- Gemini API縲〃ertex AI縲￣roxy遲峨・隱崎ｨｼ譁ｹ蠑・- API隱ｲ驥台ｸｻ菴薙［odel ID縲∝茜逕ｨ荳企剞
- Provider縺ｮ菫晄戟縲∝ｭｦ鄙貞茜逕ｨ縲∫屮譟ｻ譚｡莉ｶ
- Script Properties縺ｸ縺ｮsecret菫晏ｭ伜庄蜷ｦ
- OAuth scope縲ゞrlFetch縲∝､夜Κ騾壻ｿ｡縺ｮ邂｡逅・・宛髯・- 閾ｪ蜍募・逅・・螳牙・縺ｪ譛邨Ｃatch莉ｶ謨ｰ
- 蝟ｶ讌ｭ譌･險育ｮ励→莨夂､ｾ莨第律
- 逶ｸ蟇ｾ譛滄剞繧定・蜍慕｢ｺ螳壹☆繧狗ｯ・峇
- retention譌･謨ｰ縺ｮ莨夂､ｾ隕冗ｨ矩←蜷・- v2螳牙ｮ壼ｾ後・v1 Task遘ｻ陦瑚ｦ∝凄
- Phase 9縺ｮ莨夊ｭｰ縲∽ｽ懈･ｭ繝悶Ο繝・け縲∵律谺｡/騾ｱ谺｡縲．ocs騾｣謳ｺ縺ｮ謗｡蜷ｦ

螟夜Κ譚｡莉ｶ縺梧悴遒ｺ隱阪〒繧１hase 1・・縺ｯMock縺ｧ騾ｲ繧√ｉ繧後ｋ縲１hase 5莉･髯阪・譛ｪ遒ｺ隱堺ｺ矩・ｒ謐城縺帙★縲：eature Flag OFF縲《tub縲∵､懆ｨｼ繝ｬ繝昴・繝医・縺・★繧後°縺ｧ豁｢繧√ｋ縲・
## 35. 蜈ｬ蠑丞盾辣ｧ

螳溯｣・凾縺ｫ譛譁ｰ迚医ｒ遒ｺ隱阪☆繧九・
- Installable triggers
  https://developers.google.com/apps-script/guides/triggers/installable
- Simple triggers
  https://developers.google.com/apps-script/guides/triggers
- Apps Script quotas
  https://developers.google.com/apps-script/guides/services/quotas
- LockService
  https://developers.google.com/apps-script/reference/lock
- PropertiesService
  https://developers.google.com/apps-script/reference/properties/properties-service
- GmailMessage
  https://developers.google.com/apps-script/reference/gmail/gmail-message
- Calendar Service
  https://developers.google.com/apps-script/reference/calendar/calendar
- Spreadsheet Service
  https://developers.google.com/apps-script/reference/spreadsheet

