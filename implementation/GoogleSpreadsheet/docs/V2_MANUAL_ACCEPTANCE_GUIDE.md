# Google Workspace Personal Work OS v2
# TEST_MODE=true Sandbox 謇句虚蜿怜・繧ｬ繧､繝・
- 蟇ｾ雎｡version: `2.8.1-prepilot`
- Schema Version: `2.2`
- AI Schema Version: `2.0`
- Migration Version: `0`
- Mode: `TEST_MODE=true`
- Automation default: `OFF`
- 蟇ｾ雎｡Phase: Phase 8B縺ｮ髱樊悽逡ｪSandbox蜿怜・

縺薙・繧ｬ繧､繝峨・縲￣hase 8A縺ｧ貅門ｙ縺励◆deployment package繧偵∵眠縺励＞髱樊悽逡ｪGoogle
Spreadsheet縺ｸ螳牙・縺ｫ驟咲ｽｮ縺励√Ο繝ｼ繧ｫ繝ｫFake縺ｧ縺ｯ遒ｺ隱阪〒縺阪↑縺Тheets縲、dvanced
Gmail縲、dvanced Calendar縲＾Auth縲（nstallable edit Trigger縲´ockService縲・Apps Script螳溯｡梧凾髢薙ｒ遒ｺ隱阪☆繧九◆繧√・豁｣譛ｬ縺ｧ縺吶１hase 8A縺ｧ縺ｯ螳檬oogle Workspace繧・謫堺ｽ懊＠縺ｦ縺・↑縺・◆繧√∽ｻ･荳九・邨先棡縺ｯ縺吶∋縺ｦ譛ｪ險伜・縺ｧ縺吶・
邨先棡縺ｯ
[`V2_SANDBOX_ACCEPTANCE_RESULTS_TEMPLATE.md`](V2_SANDBOX_ACCEPTANCE_RESULTS_TEMPLATE.md)
縺ｸ險倬鹸縺励※縺上□縺輔＞縲・
## 0. 蛻､螳壹・諠・ｱ邂｡逅・Ν繝ｼ繝ｫ

- 螳溯｡後＠譛溷ｾ・ｵ先棡繧堤｢ｺ隱阪＠縺滄・岼縺縺代ｒ`PASS`縺ｨ縺吶ｋ縲・- 譛ｪ螳溯｡後・`NOT EXECUTED`縺ｨ縺励√Ο繝ｼ繧ｫ繝ｫPASS縺九ｉ謗ｨ螳壹＠縺ｪ縺・・- 1莉ｶ縺ｧ繧ょ●豁｢譚｡莉ｶ縺ｫ隧ｲ蠖薙＠縺蘖art縺ｯ`FAIL`縺ｨ縺励∝ｾ檎ｶ啀art縺ｸ騾ｲ縺ｾ縺ｪ縺・・- 螳欖preadsheet / Script / Gmail / Calendar / Event ID縲∝・驛ｨURL縲＾Auth諠・ｱ縲・  繝｡繝ｼ繝ｫ譛ｬ譁・∽ｻｶ蜷阪・∽ｿ｡閠・…redential繧定ｨｼ霍｡縺ｸ雋ｼ繧峨↑縺・・- synthetic email縲∵楔遨ｺTask縲∬・蛻・°繧芽・蛻・∈縺ｮ髱樊ｩ溷ｯ・Γ繝ｼ繝ｫ縺縺代ｒ菴ｿ縺・・- 莨夂､ｾ繝｡繝ｼ繝ｫ縲∝ｮ滓｡井ｻｶ縲∝倶ｺｺ諠・ｱ縲∵悴蜈ｬ陦ｨ諠・ｱ縲∵ｷｻ莉倥ｒ菴ｿ繧上↑縺・・- `TEST_MODE=true`縲、utomation `OFF`繧貞､画峩縺励↑縺・・- 螳蘖rovider縲‘ndpoint縲［odel縲…redential繧定ｨｭ螳壹・謗･邯壹＠縺ｪ縺・・- time-driven Trigger繧剃ｽ懈・縺帙★縲・壼ｸｸInbox閾ｪ蜍募ｷ｡蝗槭ｒ陦後ｏ縺ｪ縺・・- cleanup縺ｧ蜑企勁縺吶ｋ蝣ｴ蜷医・縲∝茜逕ｨ閠・悽莠ｺ縺郡andbox蟆ら畑resource縺ｧ縺ゅｋ縺薙→繧堤｢ｺ隱阪☆繧九・
蜷Пart縺ｮ險倬鹸蠖｢蠑・

```text
Result: PASS / FAIL / NOT EXECUTED
Started at:
Finished at:
Duration:
Evidence reference:
Safe notes:
Stopped because:
Cleanup performed:
Reviewer:
```

隧ｦ鬨灘玄蛻・

| 蛹ｺ蛻・| 蟇ｾ雎｡ |
|---|---|
| 蠢・・| 譁ｰ隕丞ｰ主・縲《cope縲ヾetup縲ヾheets縲∵焔蜍膝mail縲｀ock AI縲∝ｰら畑Calendar縲‘dit Trigger縲．ashboard縲．iagnostic縲？arness縲・壼ｸｸ縺ｮ蜀榊ｮ溯｡・|
| 譚｡莉ｶ莉倥″ | 閾ｪ辟ｶ逋ｺ逕溘＠縺殲etryable error縺ｮ蝗槫ｾｩ縲∝ｮ溯｡梧凾髢薙´ock遶ｶ蜷医・螳滓ｸｬ |
| 鬮伜ｺｦ繝ｻ蛻･Sandbox | unknown/v1迺ｰ蠅・∝酔蜷垢alendar陦晉ｪ√．ashboard layout conflict縲∽ｺ碁㍾Worker縲，alendar CAS遶ｶ蜷・|
| 莉雁屓遖∵ｭ｢ | 螳蘖rovider縲ゝEST_MODE=false縲・壼ｸｸInbox閾ｪ蜍募ｷ｡蝗槭》ime-driven Trigger縲∝ｮ滓｡井ｻｶ縲∵腐諢上・螟夜Κ髫懷ｮｳ |

蠢・磯・岼縺縺代ｒ騾壼ｸｸ縺ｮ荳譛ｬ驕薙→縺励※螳滓命縺励∪縺吶よ擅莉ｶ莉倥″繝ｻ鬮伜ｺｦ鬆・岼縺ｯ縲∝ｮ牙・縺ｫ蜑肴署繧・菴懊ｌ繧句ｰら畑Sandbox縺後↑縺・ｴ蜷医～NOT EXECUTED`縺梧ｭ｣縺励＞邨先棡縺ｧ縺吶・
## Part A: 蟆主・蜑阪メ繧ｧ繝・け

### 蜑肴署

- Phase 8A package
  `release/v2.8.1-prepilot/`繧剃ｽｿ逕ｨ縺吶ｋ縲・- 髱樊悽逡ｪGoogle繧｢繧ｫ繧ｦ繝ｳ繝医→譁ｰ縺励＞遨ｺ縺ｮSpreadsheet繧剃ｽｿ逕ｨ縺ｧ縺阪ｋ縲・- Gmail label縺ｨ蟆ら畑secondary Calendar繧剃ｽ懊ｋ縺薙→繧貞茜逕ｨ閠・悽莠ｺ縺檎炊隗｣縺励※縺・ｋ縲・
### 謫堺ｽ・
1. `DEPLOYMENT_MANIFEST.md`縺ｧ谺｡繧堤｢ｺ隱阪☆繧九・
   - Code `2.8.1-prepilot`
   - Schema `2.2`
   - AI Schema `2.0`
   - Migration `0`
   - `TEST_MODE=true`
   - Automation `OFF`
   - `.gs` 22莉ｶ縲～appsscript.json` 1莉ｶ

2. `CHECKSUMS.sha256`繧堤・蜷医☆繧九・3. package縺ｫ`.clasp.json`縲…redential縲》est縲、rchive縲｝rompt縲∝ｮ櫑D縲∝ｮ欟RL縺・   縺ｪ縺・％縺ｨ繧堤｢ｺ隱阪☆繧九・4. 譁ｰ縺励＞遨ｺ縺ｮSpreadsheet繧剃ｽ懈・縺励》imezone繧蛋Asia/Tokyo`縺ｫ縺吶ｋ縲・5. TEST_MODE=false縲∝ｮ蘖rovider縲∝ｮ滓｡井ｻｶ縲・壼ｸｸInbox縲∬・蜍謬rigger縺ｯ莉雁屓蟇ｾ雎｡螟悶→
   險倬鹸縺吶ｋ縲・
### 譛溷ｾ・ｵ先棡

- package checksum縺後☆縺ｹ縺ｦ荳閾ｴ縺吶ｋ縲・- Spreadsheet縺ｯ遨ｺ縺ｧ縲∵悴遏･data繧ё1讒矩縺後↑縺・・- 螟夜Κ蠅・阜縺後☆縺ｹ縺ｦ`NOT EXECUTED`縺ｾ縺溘・`NOT CONFIRMED`縺ｧ縺ゅｋ縲・
### 蛛懈ｭ｢譚｡莉ｶ

- checksum荳堺ｸ閾ｴ縲∵Φ螳壼､貿ile縲∫ｧ伜ｯ・ュ蝣ｱ縲∝ｮ櫑D縲」ersion荳堺ｸ閾ｴ縲・- 髱樊悽逡ｪ迺ｰ蠅・〒縺ゅｋ縺薙→繧堤｢ｺ隱阪〒縺阪↑縺・・
### Rollback / cleanup

- Apps Script縺ｸ驟咲ｽｮ縺吶ｋ蜑阪↑縺ｮ縺ｧ縲｝ackage繧剃ｽｿ逕ｨ蛛懈ｭ｢縺励ヾpreadsheet繧貞炎髯､縺吶ｋ
  蝣ｴ蜷医・蛻ｩ逕ｨ閠・悽莠ｺ縺悟ｯｾ雎｡繧堤｢ｺ隱阪☆繧九・
## Part B: Apps Script驟咲ｽｮ

### 蜑肴署

- Part A縺形PASS`縲・- Sandbox蛻ｩ逕ｨ閠・悽莠ｺ縺薫Auth consent繧定｡後≧縲・
### 謫堺ｽ・
1. Spreadsheet縺ｮ`諡｡蠑ｵ讖溯・` 竊・`Apps Script`繧帝幕縺上・2. package縺ｮ`apps-script/`縺九ｉ22蛟九・`.gs`繧貞酔蜷阪〒驟咲ｽｮ縺吶ｋ縲・3. Project Settings縺ｧmanifest陦ｨ遉ｺ繧呈怏蜉ｹ縺ｫ縺励～appsscript.json`繧堤ｽｮ縺肴鋤縺医ｋ縲・4. Services縺ｧGmail API v1縲，alendar API v3繧堤｢ｺ隱阪☆繧九・5. manifest縺ｮOAuth scope縺梧ｬ｡縺ｮ7莉ｶ縺縺代〒縺ゅｋ縺薙→繧堤｢ｺ隱阪☆繧九・
   - `spreadsheets.currentonly`
   - `script.container.ui`
   - `script.scriptapp`
   - `userinfo.email`
   - `gmail.modify`
   - `calendar.app.created`
   - `calendar.calendarlist.readonly`

6. 螟夜ΚHTTP縲．rive縲［ail-send縲～mail.google.com`蜈ｨ菴薙，alendar蜈ｨ讓ｩ髯尽cope縺・   縺ｪ縺・％縺ｨ繧堤｢ｺ隱阪☆繧九・7. Spreadsheet繧貞・隱ｭ霎ｼ縺励～讌ｭ蜍儖S v2`繝｡繝九Η繝ｼ繧堤｢ｺ隱阪☆繧九・
### 譛溷ｾ・ｵ先棡

- Apps Script source 23莉ｶ縺継ackage縺ｨ荳閾ｴ縺吶ｋ縲・- Gmail API v1縺ｨCalendar API v3縺縺代′Advanced Service縺ｨ縺励※譛牙柑縲・- 陦ｨ遉ｺ縺輔ｌ縺溷推OAuth prompt繧貞茜逕ｨ閠・悽莠ｺ縺碁・蠎ｦ遒ｺ隱阪＠縲∵Φ螳壼､穆cope縺後↑縺上・  prompt蝗樊焚繧定ｨ倬鹸縺吶ｋ縲・
### 蛛懈ｭ｢譚｡莉ｶ

- 諠ｳ螳壼､飽Auth scope縲∝挨version縲’ile谺關ｽ縲∵ｧ区枚error縲・- 螳欖cript ID繧坦epository縲｝ackage縲∬ｨｼ霍｡縺ｸ菫晏ｭ倥＠縺昴≧縺ｫ縺ｪ縺｣縺溷ｴ蜷医・
### Rollback / cleanup

- Setup蜑阪↓蛛懈ｭ｢縺励◆蝣ｴ蜷医・Apps Script project縺ｨSpreadsheet繧帝哩縺倥∬ｨｼ霍｡縺九ｉ
  螳櫑D繧帝勁蜴ｻ縺吶ｋ縲・
## Part C: Setup

### 蜑肴署

- Part B縺形PASS`縲・- Gmail label 7莉ｶ縲∝ｰら畑secondary Calendar縲ゝask邱ｨ髮・畑installable edit
  Trigger縺御ｽ懈・縺輔ｌ繧九％縺ｨ繧堤炊隗｣縺励※縺・ｋ縲・
### 謫堺ｽ・
1. `讌ｭ蜍儖S v2` 竊・`蛻晄悄繧ｻ繝・ヨ繧｢繝・・`繧貞ｮ溯｡後☆繧九・2. `PAUSED`縺ｮ蝣ｴ蜷医□縺代∫判髱｢縺ｮnext action縺ｫ蠕薙＞
   `繧ｻ繝・ヨ繧｢繝・・繧堤ｶ夊｡形繧貞ｮ溯｡後☆繧九・3. `COMPLETE`縺ｾ縺ｧ騾ｲ繧薙□繧峨ヾetup謇隕∵凾髢薙→螳溯｡悟屓謨ｰ繧定ｨ倬鹸縺吶ｋ縲・4. Apps Script縺ｮTrigger荳隕ｧ繧堤｢ｺ隱阪☆繧九・5. `閾ｪ蜍募・逅・・迥ｶ諷九ｒ遒ｺ隱港繧貞ｮ溯｡後☆繧九・
### 譛溷ｾ・ｵ先棡

- 蛻ｩ逕ｨ閠・heet 6莉ｶ縺ｨ髱櫁｡ｨ遉ｺ邂｡逅・heet 4莉ｶ縺ｮ蜷郁ｨ・0莉ｶ縲・- 豁｣蠑秀mail label 7莉ｶ縲・- 蟆ら畑secondary Calendar `閾ｪ蜍墓悄譌･邂｡逅・縺・莉ｶ縺ｧ縲｝rimary Calendar縺ｧ縺ｯ縺ｪ縺・・- 謇譛芽・nstallable edit Trigger縺・莉ｶ縲・- time-driven Trigger縺ｯ0莉ｶ縲・- Automation縺ｯdisabled / OFF縲・- Setup隱ｬ譏弱・谺｡縺ｮ謫堺ｽ懊ｒ陦ｨ遉ｺ縺励・壼ｸｸInbox縲∝ｮ蘗I縲・蛻・rigger繧帝幕蟋九＠縺ｪ縺・・
### 蛛懈ｭ｢譚｡莉ｶ

- 譛ｪ遏･data縲」1繧峨＠縺・ｧ矩縲∝酔蜷垢alendar謇譛画ｨｩ荳肴・縲［ain Calendar蜿ら・縲・- time-driven Trigger菴懈・縲、utomation ON縲∝ｮ蘖rovider隕∵ｱゅ・- Setup縺梧里蟄伜・螳ｹ繧貞炎髯､繝ｻclear縺励ｈ縺・→縺吶ｋ縲・
### Rollback / cleanup

- 閾ｪ蜍穂ｿｮ蠕ｩ縲∵里蟄賄ata蜑企勁縲∝酔蜷垢alendar蜑企勁繧定｡後ｏ縺ｪ縺・・- safe error code縲∵凾蛻ｻ縲・撼讖溷ｯ・判髱｢縺縺代ｒ險倬鹸縺励※蛛懈ｭ｢縺吶ｋ縲・
## Part D: Phase 1 Sheets遒ｺ隱・
### 蜑肴署

- Part C縺形PASS`縲・
### 謫堺ｽ・
1. `繧ｿ繧ｹ繧ｯ荳隕ｧ`縺ｮ1陦檎岼縺悟・驛ｨID縲・陦檎岼縺梧律譛ｬ隱櫁ｦ句・縺励・陦檎岼莉･髯阪′data鬆伜沺縺ｧ
   縺ゅｋ縺薙→繧堤｢ｺ隱阪☆繧九・2. `繧ｿ繧ｹ繧ｯ荳隕ｧ`縺・3蛻励〒縲∫ｮ｡逅・・縺悟承蛛ｴ縺ｫ縺ゅｊ縲・撼陦ｨ遉ｺ繝ｻ菫晁ｭｷ縺輔ｌ繧九％縺ｨ繧堤｢ｺ隱阪☆繧九・3. 遨ｺ陦後・Checkbox蟇ｾ雎｡cell縺ｫBoolean `FALSE`縺悟・縺｣縺ｦ縺・↑縺・％縺ｨ繧堤｢ｺ隱阪☆繧九・4. `繧ｳ繝｡繝ｳ繝・蛻励↓Checkbox縺後↑縺上。oolean蛻励□縺代↓Checkbox validation縺後≠繧・   縺薙→繧堤｢ｺ隱阪☆繧九・5. 譌･莉惑ormat縲・num validation縲∝茜逕ｨ閠・ｷｨ髮・・縲￣rotection繧堤｢ｺ隱阪☆繧九・6. `Phase 1繝・せ繝医ｒ螳溯｡形縺吶ｋ縲・7. `Phase 1 Mock Task繧置psert`繧・蝗槫ｮ溯｡後☆繧九・8. `Quick Diagnostic`繧貞ｮ溯｡後＠縲∵凾髢薙ｒ貂ｬ螳壹☆繧九・
### 譛溷ｾ・ｵ先棡

- Harness縺ｮ螳溯｡梧ｸ医∩local鬆・岼縺ｫFAIL縺後↑縺・・- 蜷後§Mock Task縺ｯ1陦後□縺代〒縲・陦檎岼莉倩ｿ代↓菴懈・縺輔ｌ繧九・- Quick Diagnostic縺ｫFAIL縺後↑縺上・0遘剃ｻ･蜀・ｒ逶ｮ讓吶↓螳御ｺ・☆繧九・- Quick Diagnostic蜑榊ｾ後〒Sheet縲ゝask縲．ashboard縲￣roperty縲ゝrigger縺悟､峨ｏ繧峨↑縺・・
### 蛛懈ｭ｢譚｡莉ｶ

- Sheet/蛻鈴㍾隍・∫ｩｺ陦熊ALSE縲√さ繝｡繝ｳ繝・heckbox縲∫ｮ｡逅・・谺關ｽ縲￣rotection荳堺ｸ閾ｴ縲・- Diagnostic縺畦ayout繧剃ｿｮ蠕ｩ縺ｾ縺溘・螟夜Κ騾壻ｿ｡縺吶ｋ縲・
### Rollback / cleanup

- Mock Task繧呈焔蜍募炎髯､縺励※Schema繧貞､峨∴縺ｪ縺・４andbox邨先棡縺ｫ谿九＠縺溘∪縺ｾ蠕檎ｶ嗾est縺ｧ
  隴伜挨縺吶ｋ縲・
## Part E: Gmail謇句虚蜿冶ｾｼ

### 蜑肴署

- Part D縺形PASS`縲・- 螳悟・synthetic縺ｾ縺溘・閾ｪ蛻・°繧芽・蛻・∈縺ｮ髱樊ｩ溷ｯ・Γ繝ｼ繝ｫ縺縺代ｒ菴ｿ逕ｨ縺吶ｋ縲・
### 謫堺ｽ・
1. 豁｣蠑粛abel 7莉ｶ縺碁㍾隍・↑縺丞ｭ伜惠縺吶ｋ縺薙→繧堤｢ｺ隱阪☆繧九・2. 莉ｶ蜷榊・鬆ｭ繧蛋[MOCK:NEW_HIGH]`縺ｫ縺励◆譫ｶ遨ｺ繝｡繝ｼ繝ｫ縺ｸ`謇句虚/蜿冶ｾｼ`繧剃ｻ倥￠繧九・3. `謇句虚/蜿冶ｾｼ繧・莉ｶ蜑榊・逅・繧貞ｮ溯｡後☆繧九・4. 蜷後§謫堺ｽ懊ｒ蜀榊ｮ溯｡後☆繧九・5. 蛻･縺ｮ譫ｶ遨ｺThread縺ｸ`謇句虚/蜿冶ｾｼ`縺ｨ`謇句虚/髯､螟冒繧剃ｸ｡譁ｹ莉倥￠縺ｦ螳溯｡後☆繧九・6. 譌｢隱ｭ繝ｻ譛ｪ隱ｭ縺ｮsynthetic Message繧貞推1莉ｶ遒ｺ隱阪☆繧九・
### 譛溷ｾ・ｵ先棡

- 1螳溯｡後・譁ｰ隕舟essage縺ｯ譛螟ｧ1莉ｶ縺ｧ縲〉ead/unread縺ｫ萓晏ｭ倥＠縺ｪ縺・・- Message ID蜊倅ｽ阪〒dedup縺励∝酔縺弄essage State縺ｯ1陦後□縺代・- `謇句虚/髯､螟冒縲ヾpam縲ゝrash縺悟━蜈医＆繧後ｋ縲・- 騾壼ｸｸInbox閾ｪ蜍戊ｵｰ譟ｻ縲∵ｷｻ莉倥∝､夜ΚURL蜿門ｾ励ｒ陦後ｏ縺ｪ縺・・- 譛ｬ譁・∽ｻｶ蜷阪・∽ｿ｡閠・〉aw ID縺梧ｰｸ邯售heet繧・ｮ溯｡檎ｵ先棡縺ｸ菫晏ｭ倥＆繧後↑縺・・
### 蛛懈ｭ｢譚｡莉ｶ

- 莨夂､ｾ繝｡繝ｼ繝ｫ縲∝倶ｺｺ諠・ｱ縲∵ｷｻ莉倥・壼ｸｸInbox繧貞・逅・＠縺昴≧縺ｫ縺ｪ縺｣縺溷ｴ蜷医・- 蜷後§Message縺碁㍾隍・√∪縺溘・譛ｬ譁・′log / Sheet縺ｸ菫晏ｭ倥＆繧後◆蝣ｴ蜷医・
### Rollback / cleanup

- synthetic Thread縺ｮlabel縺縺代ｒ蛻ｩ逕ｨ閠・悽莠ｺ縺梧紛逅・☆繧九ゆｼ夂､ｾlabel繧・里蟄狼hread繧・  螟画峩縺励↑縺・・
## Part F: Mock AI / Review

### 蜑肴署

- Part E縺ｮMessage縺訓REPROCESSED縲・- 螳蘖rovider registry縺ｯ遨ｺ縺ｧ縺ゅｋ縲・
### 謫堺ｽ・
1. `Phase 3/4 Mock邵ｦ繝輔Ο繝ｼ繧・莉ｶ蜃ｦ逅・繧貞ｮ溯｡後☆繧九・2. 蜷後§Message繧貞・螳溯｡後☆繧九・3. synthetic fixture
   `[MOCK:NEW_REVIEW]`縲～[MOCK:INFERRED]`縲・   `[MOCK:INVALID_JSON]`縲｝rompt-injection-as-data繧堤｢ｺ隱阪☆繧九・4. Review Task縺ｮ蜷後§陦後↓縺ゅｋ`蛻､譁ｭ`繧貞女蜈･縺ｾ縺溘・蜊ｴ荳九∈螟画峩縺吶ｋ縲・5. 蛻ｩ逕ｨ閠・ｷｨ髮・・縲～manual_fields`縲～繧ｳ繝｡繝ｳ繝・縺悟ｾ檎ｶ哺ock縺ｧ菫晄戟縺輔ｌ繧九％縺ｨ繧・   遒ｺ隱阪☆繧九・6. `Phase 2繝・せ繝医ｒ螳溯｡形縲～Phase 3繝・せ繝医ｒ螳溯｡形繧帝・↓螳溯｡後☆繧九・
### 譛溷ｾ・ｵ先棡

- 螟夜ΚAI縲～UrlFetchApp`縲…redential繧剃ｽｿ逕ｨ縺励↑縺・・- 蜷後§`origin_key`縺ｮTask縺ｯ驥崎､・＠縺ｪ縺・・- Review蟆ら畑Sheet繧剃ｽ懊ｉ縺壹∝酔縺倭繧ｿ繧ｹ繧ｯ荳隕ｧ`陦後〒蜿怜・繝ｻ蜊ｴ荳九〒縺阪ｋ縲・- 謗ｨ貂ｬ譛滄剞縺ｯ`謗ｨ螂ｨ譛滄剞`縺縺代↓蜈･繧翫∵ｭ｣蠑乗悄髯舌ｄEvent縺ｫ縺ｪ繧峨↑縺・・- 荳肴ｭ｣JSON縺ｨprompt injection fixture縺ｯTask蜑ｯ菴懃畑蜑阪↓螳牙・縺ｫ蜃ｦ逅・＆繧後ｋ縲・- script逕ｱ譚･縺ｮ蠑術refix縺ｯformula縺ｫ縺ｪ繧峨↑縺・・
### 蛛懈ｭ｢譚｡莉ｶ

- 螟夜ΚProvider謗･邯夊ｦ∵ｱゅ∝ｮ蘗I騾壻ｿ｡縲∝茜逕ｨ閠・ield荳頑嶌縺阪ゝask驥崎､・・
### Rollback / cleanup

- 螳蘖rovider險ｭ螳壹ｒ霑ｽ蜉縺励↑縺・Ｔynthetic Task縺ｯSandbox險ｼ霍｡縺ｨ縺励※菫晄戟縺吶ｋ縲・
## Part G: Calendar

### 蜑肴署

- Part F縺形PASS`縲・- 蟆ら畑Calendar縺碁撼蜈ｱ譛鋭econdary Calendar縺ｧ縺ゅｋ縺薙→繧堤｢ｺ隱肴ｸ医∩縲・
### 謫堺ｽ・
1. Review隗｣豸域ｸ医∩繝ｻ豁｣蠑乗悄髯舌≠繧翫・synthetic Task縺ｧ`Calendar逋ｻ骭ｲ`繧蛋逋ｻ骭ｲ`縺ｸ
   螟画峩縺吶ｋ縲・2. `蜷梧悄迥ｶ諷義縺ｫPENDING縺・莉ｶ菴懈・縺輔ｌ縺溘％縺ｨ繧堤｢ｺ隱阪☆繧九・3. `Calendar蜷梧悄繧・莉ｶ蜃ｦ逅・繧貞ｮ溯｡後☆繧九・4. 蜷後§謫堺ｽ懊ｒ蜀榊ｮ溯｡後☆繧九・5. Task蜷阪∪縺溘・譛滄剞繧貞､画峩縺励∝・蠎ｦ蜷梧悄縺吶ｋ縲・6. Task繧貞ｮ御ｺ・∪縺溘・蟇ｾ雎｡螟悶↓縺励∝・蠎ｦ蜷梧悄縺吶ｋ縲・7. 豁｣蠑乗悄髯舌↑縺励ヽeview荳ｭ縲，alendar蟇ｾ雎｡螟悶・Task繧ら｢ｺ隱阪☆繧九・8. `Phase 4繝・せ繝医ｒ螳溯｡形縺吶ｋ縲・
### 譛溷ｾ・ｵ先棡

- 蟆ら畑Calendar縺縺代↓邨よ律Event縺梧怙螟ｧ1莉ｶ菴懈・縺輔ｌ繧九・- Event縺ｯTask譛滄剞譌･縺ｮ1譌･Event縺ｧ縲》itle縺ｯ`縲先悄髯舌・Task蜷・`縲・- attendee縲“uest縲…onference縲（nvite縺後↑縺・・- description縺ｫ譛ｬ譁・∽ｻｶ蜷阪∵ｷｻ莉倥…redential縲〉aw ID縺後↑縺・・- 蜀榊ｮ溯｡後・NOOP縲∝､画峩縺ｯ蜷後§owned Event縺ｮUPDATE縲・撼蟇ｾ雎｡蛹悶・DELETE縲・- primary Calendar縺ｨforeign Event縺ｯ荳榊､峨・- 1蝗槭・譏守､ｺ蜷梧悄縺ｯ譛螟ｧ1 Job縲・
### 蛛懈ｭ｢譚｡莉ｶ

- primary Calendar縲’oreign Event縲∝・譛芽ｨｭ螳壹ｒ螟画峩縺励◎縺・↓縺ｪ縺｣縺溷ｴ蜷医・- Event驥崎､・∵園譛盈arker荳堺ｸ閾ｴ縲∝酔蜷垢alendar陦晉ｪ√・
### Rollback / cleanup

- app謇譛右vent縺縺代ｒ騾壼ｸｸflow縺ｧDELETE縺吶ｋ縲Ｇoreign Event繧呈焔蜍募炎髯､縺励↑縺・・
## Part H: Edit Trigger

### 蜑肴署

- Part C縺ｧ謇譛芽・nstallable edit Trigger縺・莉ｶ縲・
### 謫堺ｽ・
1. `繧ｿ繧ｹ繧ｯ荳隕ｧ`縺ｮ蛻ｩ逕ｨ閠・ｷｨ髮・・縺ｧ縲∵悄髯舌∝━蜈亥ｺｦ縲∝ｯｾ蠢懃憾豕√∝ｮ御ｺ・∝ｯｾ雎｡螟悶・   霑比ｿ｡蠕・■縲，alendar逋ｻ骭ｲ縲√さ繝｡繝ｳ繝医ｒ邱ｨ髮・☆繧九・2. 譛螟ｧ20陦御ｻ･蜀・・bulk paste繧痴ynthetic Task縺ｧ螳溯｡後☆繧九・3. 邱ｨ髮・′閾ｪ蜍募渚譏縺輔ｌ繧九％縺ｨ繧堤｢ｺ隱阪☆繧九・4. 蝠城｡梧凾縺縺大ｯｾ雎｡cell繧帝∈縺ｳ縲・   `Task邱ｨ髮・ｒ謇句虚蜿肴丐・・allback・荏繧貞ｮ溯｡後☆繧九・5. 邂｡逅・・縺ｮ逶ｴ謗･邱ｨ髮・′螳牙・縺ｫ諡貞凄縺輔ｌ繧九％縺ｨ繧堤｢ｺ隱阪☆繧九・
### 譛溷ｾ・ｵ先棡

- installable edit Trigger縺ｯ1莉ｶ縺縺代〒縲∝・蟶ｰ逧・↑驥崎､・・逅・′縺ｪ縺・・- 驕ｸ謚櫁｡後□縺代′譖ｴ譁ｰ縺輔ｌ縲〉ow version縲［anual fields縲，alendar Outbox縺梧紛蜷医☆繧九・- fallback縺ｯGmail縲、I縲，alendar API繧貞他縺ｰ縺ｪ縺・・
### 蛛懈ｭ｢譚｡莉ｶ

- time-driven Trigger霑ｽ蜉縲∫┌髢｢菫Ｓow譖ｴ譁ｰ縲∫ｮ｡逅・・荳頑嶌縺阪・0陦瑚ｶ・・辟｡蛻ｶ髯仙・逅・・
### Rollback / cleanup

- Automation縺ｯOFF縺ｮ縺ｾ縺ｾ縲りｪ､邱ｨ髮・・蛻ｩ逕ｨ閠・ｷｨ髮・・縺縺代ｒ謇句虚縺ｧ謌ｻ縺励∫ｮ｡逅・・繧・  逶ｴ謗･菫ｮ豁｣縺励↑縺・・
## Part I: Retry / Dead Letter・域ｧ矩遒ｺ隱阪・蠢・医∝ｮ溷屓蠕ｩ縺ｯ譚｡莉ｶ莉倥″・・
### 蜑肴署

- 螳滄囿螳ｳ繧呈э蝗ｳ逧・↓菴懊ｉ縺ｪ縺・・- 閾ｪ辟ｶ縺ｫ逋ｺ逕溘＠縺殱ynthetic retryable error縺後↑縺代ｌ縺ｰ螳溷屓蠕ｩ縺ｯ
  `NOT EXECUTED`縺ｨ縺吶ｋ縲・
### 謫堺ｽ・
1. `Phase 5繝・せ繝医ｒ螳溯｡形縲～Phase 6繝・せ繝医ｒ螳溯｡形縲・   `Phase 7繝・せ繝医ｒ螳溯｡形繧帝・↓螳溯｡後☆繧九・2. local / Mock鬆・岼縺ｫFAIL縺後↑縺・％縺ｨ繧堤｢ｺ隱阪☆繧九・3. 螳蘖rovider縲∝ｮ鬱rigger縲∝ｮ檬mail閾ｪ蜍墓､懃ｴ｢縲∝ｮ溷屓蠕ｩ鬆・岼縺・   SKIPPED / NOT EXECUTED縺ｧ縺ゅｋ縺薙→繧堤｢ｺ隱阪☆繧九・4. 閾ｪ辟ｶ縺ｫ逋ｺ逕溘＠縺殲etryable `DEAD`陦後′縺ゅｊ縲∝次蝗縺瑚ｧ｣豸域ｸ医∩縺ｮ蝣ｴ蜷医□縺代・   譛螟ｧ5陦後ｒ驕ｸ謚槭＠縺ｦ`驕ｸ謚槭＠縺櫂ead Letter繧貞・螳溯｡御ｺ育ｴЯ繧貞ｮ溯｡後☆繧九・
### 譛溷ｾ・ｵ先棡

- retry縺ｯ蛻晏屓蠕・ / 15 / 60蛻・・蝗樒岼螟ｱ謨励〒DEAD縲・- 蜷後§Dead Letter縲｀essage縲ゝask縲・vent縺ｯ驥崎､・＠縺ｪ縺・・- 髱柮etryable縲∵悴隗｣豎ｺ險ｭ螳壹…heckpoint荳堺ｸ閾ｴ縲・陦瑚ｶ・・諡貞凄縺輔ｌ繧九・- Provider registry empty縲ゝEST_MODE enable諡貞凄縲、utomation OFF繧堤ｶｭ謖√☆繧九・
### 蛛懈ｭ｢譚｡莉ｶ

- 螳蘖rovider縲・壼ｸｸInbox縲，alendar縲∬ｪ崎ｨｼ繧呈腐諢上↓螢翫☆蠢・ｦ√′縺ゅｋ蝣ｴ蜷医・- raw Gmail / Calendar ID縺ｮ蜈･蜉帙ｒ豎ゅａ繧峨ｌ縺溷ｴ蜷医・
### Rollback / cleanup

- 螳滄囿螳ｳ繧剃ｽ懊ｉ縺ｪ縺・よ悴螳滓命鬆・岼縺ｯ`NOT EXECUTED`縺ｨ險倬鹸縺吶ｋ縲・
## Part J: Dashboard / Diagnostic・磯壼ｸｸ遒ｺ隱阪・蠢・医〕ayout conflict縺ｯ鬮伜ｺｦ・・
### 蜑肴署

- Part D縺ｾ縺ｧ縺形PASS`縲・
### 謫堺ｽ・
1. `Quick Diagnostic`繧貞ｮ溯｡後＠縲∵園隕∵凾髢薙ｒ貂ｬ繧九・2. `Deep Diagnostic・域・遉ｺ繝ｻ隱ｭ蜿門ｰら畑・荏繧貞ｮ溯｡後＠縲∵園隕∵凾髢薙ｒ貂ｬ繧九・3. `驕狗畑Dashboard繧呈峩譁ｰ`繧貞ｮ溯｡後☆繧九・4. Dashboard縺ｮ17謖・ｨ吶→source Sheet縺ｮ蜑榊ｾ悟ｷｮ繧堤｢ｺ隱阪☆繧九・5. 蛻･縺ｮ蟆ら畑Sandbox縺ｧblank-key value / formula縺ｾ縺溘・foreign metadata繧・   system block蛟呵｣懊∈鄂ｮ縺阪．ashboard譖ｴ譁ｰ縺詣rite蜑榊●豁｢縺吶ｋ縺薙→繧堤｢ｺ隱阪☆繧九・
### 譛溷ｾ・ｵ先棡

- Quick縺ｯ60遘偵．eep縺ｯ180遘偵ｒ逶ｮ讓吶↓螳御ｺ・☆繧九・- Diagnostic縺ｯrepair縲．ashboard譖ｴ譁ｰ縲；mail縲、I縲，alendar縲ゝrigger縲・  Dead Letter retry繧定｡後ｏ縺ｪ縺・・- Dashboard縺ｯ17 aggregate謖・ｨ吶□縺代〒縲ゝask蜷阪∽ｻｶ蜷阪・∽ｿ｡閠・〉aw ID縲・  credential縲｝ayload繧定｡ｨ遉ｺ縺励↑縺・・- layout conflict縺ｯ`E_DASHBOARD_LAYOUT_CONFLICT`縺ｧfail closed縺励∝茜逕ｨ閠・・
  value / formula / metadata縺ｨsource Sheet繧貞､画峩縺励↑縺・・
### 蛛懈ｭ｢譚｡莉ｶ

- Diagnostic縺ｮ蜑ｯ菴懃畑縲．ashboard縺九ｉ螟夜Κ騾壻ｿ｡縲∝茜逕ｨ閠・｡御ｸ頑嶌縺阪・
### Rollback / cleanup

- conflict繧定・蜍穂ｿｮ蠕ｩ縺励↑縺・ょｰら畑negative-test Sandbox繧帝哩縺倥ｋ縲・
## Part K: 蜀榊ｮ溯｡後・蜀ｪ遲画ｧ繝ｻ螳牙・蛛懈ｭ｢・磯壼ｸｸ蜀榊ｮ溯｡後・蠢・医∬｡晉ｪ∬ｩｦ鬨薙・鬮伜ｺｦ・・
### 蜑肴署

- Parts C縲廱縺ｮ荳ｻ隕’low縺悟ｮ御ｺ・・
### 謫堺ｽ・
1. `蛻晄悄繧ｻ繝・ヨ繧｢繝・・`縺ｾ縺溘・`繧ｻ繝・ヨ繧｢繝・・繧堤ｶ夊｡形繧貞・螳溯｡後☆繧九・2. Sheet縲∝・縲〕abel縲，alendar縲‘dit Trigger縲ゝask縲｀essage縲・vent縺ｮ莉ｶ謨ｰ繧・   蜑榊ｾ梧ｯ碑ｼ・☆繧九・3. 蛻･縺ｮ譁ｰ隕輯preadsheet縺ｧ譛ｪ遏･縺ｮ髱樒ｩｺcell繧・縺､逕ｨ諢上＠縲ヾetup繧貞ｮ溯｡後☆繧九・4. 縺輔ｉ縺ｫ蛻･縺ｮSpreadsheet縺ｧv1繧峨＠縺Тheet蜷阪∪縺溘・header繧堤畑諢上＠縲ヾetup繧・   螳溯｡後☆繧九・5. 螳牙・縺ｫ螳滓命縺ｧ縺阪ｋ蝣ｴ蜷医□縺代∵焔蜍募叙霎ｼ縺ｨTask邱ｨ髮・，alendar蜷梧悄縺ｨTask邱ｨ髮・ｒ
   蛻･螳溯｡後〒驥阪・縲《tale邨先棡縺慶ommit縺輔ｌ縺ｪ縺・％縺ｨ繧堤｢ｺ隱阪☆繧九・
### 譛溷ｾ・ｵ先棡

- Setup蜀榊ｮ溯｡後〒蛻ｩ逕ｨ閠・ata繧Уask縺梧ｶ医∴縺壹∝・resource縺碁㍾隍・＠縺ｪ縺・・- unknown / v1迺ｰ蠅・・螟画峩繝ｻMigration縺帙★蛛懈ｭ｢縺吶ｋ縲・- 螟夜ΚI/O蠕・ｩ滉ｸｭ繧ら洒譎る俣claim / CAS縺ｫ繧医ｊ蛻ｩ逕ｨ閠・ｷｨ髮・ｒ謌ｻ縺輔↑縺・・- concurrency繧貞ｮ牙・縺ｫ蜀咲樟縺ｧ縺阪↑縺・・岼縺ｯ`NOT EXECUTED`縲・
### 蛛懈ｭ｢譚｡莉ｶ

- destructive setup縲」1 migration縲‥uplicate resource縲《tale field overwrite縲・
### Rollback / cleanup

- unknown / v1 test迺ｰ蠅・ｒ菫ｮ蠕ｩ縺帙★縲∫ｵ先棡險倬鹸蠕後↓蛻ｩ逕ｨ閠・悽莠ｺ縺悟炎髯､縺吶ｋ縲・
## Part L: Sandbox邨ゆｺ・・險ｼ霍｡菫晏ｭ・
### 蜑肴署

- 螳滓命縺ｧ縺阪◆Part縺ｮ邨先棡縺瑚ｨ倬鹸貂医∩縲・
### 謫堺ｽ・
1. `閾ｪ蜍募・逅・・迥ｶ諷九ｒ遒ｺ隱港縺ｧAutomation OFF繧貞・遒ｺ隱阪☆繧九・2. Apps Script Trigger荳隕ｧ縺ｧtime-driven 0莉ｶ繧堤｢ｺ隱阪☆繧九・3. Provider / endpoint / model / credential譛ｪ險ｭ螳壹ｒ遒ｺ隱阪☆繧九・4. PASS / FAIL / NOT EXECUTED繧堤ｵ先棡template縺ｸ霆｢險倥☆繧九・5. screenshot縺ｨmemo縺九ｉ螳櫑D縲∝・驛ｨURL縲√Γ繝ｼ繝ｫ譛ｬ譁・＾Auth諠・ｱ繧帝勁蜴ｻ縺吶ｋ縲・6. Setup縲＿uick縲．eep縲仝orker縺ｮ謇隕∵凾髢薙ｒ險倬鹸縺吶ｋ縲・7. Sandbox縺ｮ蟆ら畑Calendar縺ｨSpreadsheet繧呈ｮ九☆縺句炎髯､縺吶ｋ縺九∝茜逕ｨ閠・悽莠ｺ縺悟愛譁ｭ縺吶ｋ縲・
### 譛溷ｾ・ｵ先棡

- Phase 8B縺ｮ險ｼ霍｡縺碁撼讖溷ｯ・〒閾ｪ蟾ｱ螳檎ｵ舌＠縺ｦ縺・ｋ縲・- 螳蘖rovider縲ゝEST_MODE=false縲》ime-driven Trigger縲∝ｮ滓｡井ｻｶ縲∝倶ｺｺpilot縺ｯ
  `NOT EXECUTED`縲・- Phase 8C / 8D縺ｸ閾ｪ蜍慕噪縺ｫ騾ｲ縺ｾ縺ｪ縺・・
### 蛛懈ｭ｢譚｡莉ｶ

- 險ｼ霍｡縺ｫ螳櫑D縲∵悽譁・…redential縲∝・驛ｨURL縺梧ｮ九ｋ縲・
### Rollback / cleanup

- 蜑企勁蜑阪↓蟇ｾ雎｡縺後％縺ｮSandbox蟆ら畑resource縺ｧ縺ゅｋ縺薙→繧貞茜逕ｨ閠・悽莠ｺ縺檎｢ｺ隱阪☆繧九・- shared / primary Calendar縲∵里蟄詫abel縲∫┌髢｢菫５rigger繧貞炎髯､縺励↑縺・・
## 譛邨ょ愛螳・
| Stage | 蛻､螳・|
|---|---|
| Phase 8B TEST_MODE=true髱樊ｩ溷ｯ・andbox | GO / CONDITIONAL GO / NO-GO |
| Phase 8C TEST_MODE=false Sandbox | NO-GO |
| Phase 8D 蛟倶ｺｺ螳滓･ｭ蜍吶ヱ繧､繝ｭ繝・ヨ | NO-GO |

Phase 8B縺ｯ縲￣arts A縲廰縺ｧ螳滓命蟇ｾ雎｡縺ｨ縺励◆鬆・岼縺ｫFAIL縺後↑縺上∝●豁｢譚｡莉ｶ縺後↑縺上・譛ｪ螳滓命螟夜Κ蠅・阜縺梧・遒ｺ縺ｪ蝣ｴ蜷医□縺疏GO`縺ｾ縺溘・`CONDITIONAL GO`縺ｨ縺励∪縺吶・
