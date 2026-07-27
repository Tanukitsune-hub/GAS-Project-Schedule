# Google Workspace Personal Work OS v2
# Phase 1縲・ Remediation Plan

- 菴懈・譌･: 2026-07-25・・ST・・- 譬ｹ諡: `docs/V2_FINAL_INTEGRATED_AUDIT_REPORT.md`
- 蟇ｾ雎｡: Phase 1縲・縺ｮ譛ｪ螳御ｺ・ｺ矩・- Phase 8: 蟇ｾ雎｡螟・- 螳溯｣・easoning謗ｨ螂ｨ: 髱槫ｸｸ縺ｫ鬮倥＞

## 1. 螳滓命蜴溷援

- 迴ｾ蝨ｨ縺ｮworking tree縺ｨ譌｢蟄歪ode/test繧剃ｿ晄戟縺吶ｋ縲・- Provider縲‘ndpoint縲［odel縲∥uth縲…redential縲∽ｼ夂､ｾ謇ｿ隱阪ｒ謗ｨ貂ｬ縺励↑縺・・- 螳蘖rovider謗･邯壼燕縺ｯAutomation繧丹FF縺ｫ菫昴▽縲・- Setup縺九ｉ5蛻・roduction Trigger繧剃ｽ懊ｉ縺ｪ縺・・- 螳蘗I騾壻ｿ｡荳ｭ縺ｫScript Lock繧剃ｿ晄戟縺励↑縺・・- Gmail縲，alendar縲、I縲ゝrigger縺ｮ螳溽腸蠅・ｩｦ鬨薙・螳悟・縺ｪ髱樊ｩ溷ｯ・andbox縺ｧ陦後≧縲・- local/Mock PASS縺ｨ螳欷orkspace PASS繧貞・髮｢縺吶ｋ縲・- 蜷Цork Package邨ゆｺ・凾縺ｫ蜈ｨ24 regression縺ｨ迢ｬ遶脚eview繧貞・螳溯｡後☆繧九・- Dashboard縺ｸ鬮伜ｺｦ縺ｪWork Block縲∵律谺｡繝ｻ騾ｱ谺｡繝ｬ繝薙Η繝ｼ縲√せ繧ｱ繧ｸ繝･繝ｼ繝ｫ譛驕ｩ蛹悶ｒ
  霑ｽ蜉縺励↑縺・・- Phase 8縺ｸ騾ｲ縺ｾ縺ｪ縺・・
## 2. 謗ｨ螂ｨ鬆・ｺ・
1. WP-01 Provider / Approval Decision
2. WP-02 Production AI Adapter and Lock-safe Orchestration
3. WP-03 Automatic Gmail Scope and Readiness
4. WP-04 Standalone Secret Containment
5. WP-05 Reliable Task Edit Capture
6. WP-06 Lightweight Operations Dashboard
7. WP-07 Runtime Settings and Shared Preflight
8. WP-08 Budget, Quota and Long-run Hardening
9. WP-09 Setup Consent and Operational UX
10. WP-10 Deep Diagnostic and Retention Visibility
11. WP-11 Metadata / Traceability Correction
12. WP-12 Git Initial Release Hygiene
13. WP-13 Real Workspace Sandbox Acceptance

WP-01縺梧悴螳御ｺ・〒繧ゅ仝P-03縲弩P-12縺ｯMock-only縺九▽螟夜Κ騾壻ｿ｡縺ｪ縺励〒蜈郁｡後〒縺阪ｋ縲・WP-02縺ｨWP-13縺ｮ螳蘖rovider鬆・岼縺ｯWP-01螳御ｺ・ｾ後□縺大ｮ溯｡後☆繧九・
## 2.1 Implementation status 窶・2026-07-25

| Work Package | Code / local status | External boundary |
|---|---|---|
| WP-01 Provider / Approval Decision | BLOCKED 窶・no decision was guessed | Provider/model/endpoint/auth/company/data/credential decisions `NOT CONFIRMED` |
| WP-02 Production AI boundary | Code-remediable registry/factory, lock-free transport boundary and CAS commit implemented; production registry remains empty and fails closed | Real adapter/transport/credential loader `NOT IMPLEMENTED`; real connection `NOT EXECUTED` |
| WP-03 Gmail scope | Manual exclusion/import priority, system scope, promotions/social filters, Message-scoped import, call/filter metrics implemented | Newsletter and Calendar-notification rules remain decision-gated; real Gmail `NOT EXECUTED` |
| WP-04 Secret containment | High-confidence redaction and sink sanitization implemented with synthetic tests | Real credential corpus `NOT USED` |
| WP-05 Task edit capture | Owner installable edit Trigger plus menu fallback implemented and locally faked | Real owner authorization/edit event `NOT EXECUTED` |
| WP-06 Dashboard | 17-metric explicit-refresh Dashboard and local 100/1,000/10,000-row tests implemented | Real Apps Script performance/UI `NOT EXECUTED` |
| WP-07 Runtime Settings | Typed once-per-run snapshot, protection and shared preflight implemented | Real Protection/Validation/enable flow `NOT EXECUTED` |
| WP-08 Budget/quota | Setup/completed-stage budget propagation, Calendar page/API-boundary guards, Gmail refetch/call/time bounds and safe metrics implemented | Real quota/latency/120窶・10 second boundaries `NOT EXECUTED` |
| WP-09 Setup UX | Side-effect consent, next-stage preview and concise safe result implemented | Real dialog usability `NOT EXECUTED` |
| WP-10 Deep/retention | Existing read-only Deep Diagnostic retained; P2 retention policy remains out of this High/Medium remediation | Company retention policy `NOT CONFIRMED` |
| WP-11 Metadata/traceability | Code `2.8.1-prepilot`, Schema `2.2`, AI `2.0`, Migration `0`; stale Phase boundary/Guide corrected | Real existing-v2 rerun `NOT EXECUTED` |
| WP-12 Git hygiene | `.gitignore`, local-path cleanup, secret/archive checks prepared | Initial commit/branch/logical commits blocked by managed read-only `.git` |
| WP-13 Real Workspace acceptance | NOT EXECUTED | Requires user-owned non-confidential sandbox and applicable external decisions |

This table records implementation evidence, not a personal-pilot PASS. Local
and Mock checks cannot close the real Google Workspace or real Provider rows.

## 3. Work Packages

### WP-01 窶・Provider / Approval Decision

```text
Work Package ID: WP-01
Priority: P0
Related findings: F-001, F-003
Objective: 螳蘖rovider螳溯｣・・蜑肴署繧呈ｭ｣蠑乗ｱｺ螳壹☆繧・Complexity: M・亥､夜Κ隱ｿ謨ｴ繧貞性繧・・Recommended reasoning level: 髱槫ｸｸ縺ｫ鬮倥＞
```

Files:

- 譁ｰ隕上∪縺溘・譌｢蟄倥・謇ｿ隱肴ｸ医∩Decision險倬鹸
- 蠢・ｦ√↓蠢懊§縺ｦsecurity/data-processing checklist
- code縺ｯ縺薙・WP縺ｧ縺ｯ蜴溷援螟画峩縺励↑縺・
Implementation outline:

1. 豁｣蠑上↓菴ｿ逕ｨ蜿ｯ閭ｽ縺ｪProvider縺ｨ謗･邯夂ｵ瑚ｷｯ繧堤｢ｺ隱阪☆繧九・2. endpoint縲［odel ID縲ヾtructured Output螂醍ｴ・》imeout縲〉ate limit繧堤｢ｺ隱阪☆繧九・3. 隱崎ｨｼ譁ｹ蠑上→Apps Script縺九ｉ縺ｮ謗･邯壼庄蜷ｦ繧堤｢ｺ隱阪☆繧九・4. 莨夂､ｾ謇ｿ隱阪‥ata policy縲∝・蜉帑ｿ晄戟縲∝ｭｦ鄙貞茜逕ｨ縲∫屮譟ｻ縲∬ｪｲ驥台ｸｻ菴薙ｒ遒ｺ隱阪☆繧九・5. credential菫晉ｮ｡譁ｹ蠑上〉ead讓ｩ髯舌〉otation縲〉evocation繧呈価隱阪☆繧九・6. `script.external_request`縺ｾ縺溘・莉｣譖ｿservice scope縺ｮ邂｡逅・・ｨｱ蜿ｯ繧堤｢ｺ隱阪☆繧九・7. 髱樊ｩ溷ｯ・est corpus縺ｨ螳滓磁邯夊ｩｦ鬨薙・險ｱ蜿ｯ繧堤｢ｺ隱阪☆繧九・
Tests:

- document review
- approval owner / date / scope completeness check
- 譛ｪ遒ｺ螳夐・岼縺・縺､縺ｧ繧ゅ≠繧句ｴ蜷医・fail-closed遒ｺ隱・
Acceptance criteria:

- Provider縲‘ndpoint縲［odel縲∥uth縲…redential reference蠖｢蠑上∽ｼ夂､ｾ謇ｿ隱阪・  data policy縲《torage approval縺後☆縺ｹ縺ｦ譏手ｨ倥＆繧後ｋ縲・- credential蛟､繧坦epository縲ヾheet縲〉eport縺ｸ菫晏ｭ倥＠縺ｪ縺・・- 譛ｪ遒ｺ螳壹↑繧荏NOT CONFIRMED`縺ｮ縺ｾ縺ｾWP-02繧帝幕蟋九＠縺ｪ縺・・
Dependencies:

- 莨夂､ｾIT / Security / Legal / data owner

### WP-02 窶・Production AI Adapter and Lock-safe Orchestration

```text
Work Package ID: WP-02
Priority: P0
Related findings: F-001
Objective: 謇ｿ隱肴ｸ医∩Provider繧貞ｮ牙・縺ｪproduction Worker縺ｸ謗･邯壹☆繧・Complexity: XL
Recommended reasoning level: 髱槫ｸｸ縺ｫ鬮倥＞
```

Files:

- `apps-script-v2/00_Config.gs`
- `apps-script-v2/07_AiAdapter.gs`
- `apps-script-v2/12_Triggers.gs`
- `apps-script-v2/13_LogAndDeadLetter.gs`
- `apps-script-v2/16_Diagnostics.gs`
- `apps-script-v2/18_Worker.gs`
- `apps-script-v2/99_TestHarness.gs`
- `apps-script-v2/appsscript.json`
- Phase 5/6 local and integration tests
- README縲｀anual Guide縲ゝraceability縲，HANGELOG

Implementation outline:

1. Provider-specific request builder繧貞ｮ溯｣・☆繧九・2. credential loader縺ｯopaque reference繧剃ｽｿ逕ｨ縺励∝､繧鱈og/Sheet縺ｸ霑斐＆縺ｪ縺・・3. production transport縺ｨ`createProductionExternalAdapter()`繧貞ｮ溯｣・☆繧九・4. timeout縲・29縲・xx縲∥uth縲（nvalid JSON縲ヾchema violation繧呈ｭ｣隕丞喧縺吶ｋ縲・5. provenance縺ｫProvider/model/prompt/schema/config version繧剃ｿ晏ｭ倥☆繧九・6. Lock蜀・〒claim縲《tage縲（nput hash縲〉ow version繧呈ｰｸ邯壼喧縺吶ｋ縲・7. Lock繧定ｧ｣謾ｾ縺励※Gmail/AI/Calendar螟夜ΚI/O繧定｡後≧縲・8. Lock蜀榊叙蠕怜ｾ後↓run ID縲《tage縲”ash縲〉ow version繧貞・讀懆ｨｼ縺励，AS蝙九〒commit縺吶ｋ縲・9. AI timeout繧蛋remaining budget - reserve`莉･荳九∈邵ｮ繧√ｋ縲・10. production縺ｫMock繧呈ｸ｡縺咏ｵ瑚ｷｯ繧貞ｼ輔″邯壹″諡貞凄縺吶ｋ縲・
Tests:

- adapter valid/invalid/extra-field
- 429縲・xx縲∥uth縲》imeout縲｛versized response
- credential retrieval failure and non-disclosure
- HTTP荳ｭ縺ｮTask edit縲［anual retry縲∽ｺ碁㍾Worker
- stale result縲〉ow version conflict縲｜udget逶ｴ蜑・- Mock fallback
- production factory existence/static test
- non-secret real Provider sandbox test

Acceptance criteria:

- `Code implementation`: COMPLETE
- `Mock HTTP Transport`: PASS
- `Real provider connection`: 螳溯｡後＠縺溷ｴ蜷医□縺善ASS
- `Company approval`: CONFIRMED
- `Credential storage approval`: CONFIRMED
- HTTP蠕・ｩ滉ｸｭ縺ｫScript Lock繧剃ｿ晄戟縺励↑縺・・- secret縲｜ody縲〉aw response縲…redential繧鱈og/DLQ縺ｸ菫晏ｭ倥＠縺ｪ縺・・- full regression 0 FAIL縲・
Dependencies:

- WP-01
- Security review
- Google Workspace OAuth/admin approval

### WP-03 窶・Automatic Gmail Scope and Readiness

```text
Work Package ID: WP-03
Priority: P0
Related findings: F-002, F-006
Objective: 閾ｪ蜍募・逅・ｯｾ雎｡縺ｨ髢句ｧ区擅莉ｶ繧呈ｭ｣譛ｬ縺ｩ縺翫ｊ縺ｫ蛻ｶ髯舌☆繧・Complexity: L
Recommended reasoning level: 髱槫ｸｸ縺ｫ鬮倥＞
```

Files:

- `apps-script-v2/00_Config.gs`
- `apps-script-v2/05_GmailGateway.gs`
- `apps-script-v2/12_Triggers.gs`
- `apps-script-v2/16_Diagnostics.gs`
- `apps-script-v2/18_Worker.gs`
- Phase 6 tests
- README縲｀anual Guide縲ゝraceability

Implementation outline:

1. `CATEGORY_PROMOTIONS`縺ｨ`CATEGORY_SOCIAL`繧呈・遉ｺ髯､螟悶☆繧九・2. newsletter縺ｨCalendar閾ｪ蜍暮夂衍縺ｮ蛻､螳夊ｦ丞援繧呈耳貂ｬ縺帙★Decision蛹悶☆繧九・3. `謇句虚/髯､螟冒繧呈怙蜆ｪ蜈医∵ｬ｡縺ｫ`謇句虚/蜿冶ｾｼ`繧貞呵｣憺・∈蜿肴丐縺吶ｋ縲・4. 讌ｭ蜍冦ail繧貞ｺ・￥髯､螟悶＠縺ｪ縺・egative fixture繧定ｿｽ蜉縺吶ｋ縲・5. enable蜑阪↓current shared preflight繧貞ｮ溯｡後☆繧九・6. preflight FAIL/WARN policy繧呈・譁・喧縺吶ｋ縲・7. selection count縺ｨ髯､螟也炊逕ｱ繧鍛ody/subject縺ｪ縺励〒螳牙・縺ｫ髮・ｨ医☆繧九・
Tests:

- promotions/social exclusion
- manual exclude over manual import
- manual import priority
- newsletter/Calendar approved rules
- no broad sender/domain exclusion
- Validation/Protection/Schema drift blocks enable
- automation OFF performs zero external call

Acceptance criteria:

- Spec `15.3`縺ｨPlan Phase 6 test繧呈ｺ縺溘☆縲・- 蟇ｾ雎｡mail縺ｮscope縺掲ixture縺ｧ隱ｬ譏主庄閭ｽ縲・- preflight譛ｪ蜷域ｼ譎ゅ↓Trigger繧剃ｽ懈・縺励↑縺・・- 螳蘖rovider騾∽ｿ｡蜑阪↓迢ｬ遶虐ecurity review繧帝夐℃縺吶ｋ縲・
Dependencies:

- newsletter/Calendar notification rule Decision
- WP-07縺ｮshared preflight縺ｨ隱ｿ謨ｴ

### WP-04 窶・Standalone Secret Containment

```text
Work Package ID: WP-04
Priority: P1
Related findings: F-003
Objective: 繝｡繝ｼ繝ｫ縺ｾ縺溘・AI蜃ｺ蜉帷罰譚･縺ｮcredential莠梧ｬ｡菫晏ｭ倥ｒ髦ｲ縺・Complexity: M
Recommended reasoning level: 髱槫ｸｸ縺ｫ鬮倥＞
```

Files:

- `apps-script-v2/17_Utilities.gs`
- `apps-script-v2/07_AiAdapter.gs`
- `apps-script-v2/08_TaskRepository.gs`
- `apps-script-v2/10_CalendarSync.gs`
- `apps-script-v2/13_LogAndDeadLetter.gs`
- security/negative tests

Implementation outline:

1. 鬮倡｢ｺ蠎ｦstandalone secret pattern繧貞・騾嘖canner縺ｸ霑ｽ蜉縺吶ｋ縲・2. 隱､讀懷・繧呈椛縺医ｋpositive/negative corpus繧堤畑諢上☆繧九・3. 讀懷・譎ゅ・policy繧蛋REVIEW`縺ｾ縺溘・髫秘屬縺ｨ縺励※螳夂ｾｩ縺吶ｋ縲・4. Task title縲｝ending change縲，alendar summary/description縲´og/DLQ縲・   Diagnostic繧貞酔荳fixture縺ｧ讀懆ｨｼ縺吶ｋ縲・5. raw secret繧稚est report縺ｸ蜃ｺ縺輔★縲《ynthetic token繧剃ｽｿ逕ｨ縺吶ｋ縲・
Tests:

- OpenAI-like縲；oogle API-like縲゛WT縲＾Auth/GitHub-like縲｝rivate-key marker
- benign UUID縲‥ate縲》ask code縺ｮfalse positive
- subject/body/AI output縺九ｉ蜷гink縺ｸ縺ｮend-to-end
- redacted value縺掲ormula縺ｾ縺溘・URL縺ｨ縺励※蠕ｩ蜈・＆繧後↑縺・
Acceptance criteria:

- high-confidence synthetic secrets縺卦ask縲，alendar縲´og縲．LQ縺ｸ谿九ｉ縺ｪ縺・・- benign fixture繧剃ｸ榊ｿ・ｦ√↓遐ｴ螢翫＠縺ｪ縺・・- actual secret繧断ixture縺ｸ菴ｿ逕ｨ縺励↑縺・・
Dependencies:

- Security policy

### WP-05 窶・Reliable Task Edit Capture

```text
Work Package ID: WP-05
Priority: P1
Related findings: F-004
Objective: Task邱ｨ髮・→Review蛻､譁ｭ繧・謫堺ｽ懊〒遒ｺ螳溘↓蜿肴丐縺吶ｋ
Complexity: M
Recommended reasoning level: 髱槫ｸｸ縺ｫ鬮倥＞
```

Files:

- `apps-script-v2/02_Setup.gs`
- `apps-script-v2/11_EditHandler.gs`
- `apps-script-v2/12_Triggers.gs`
- `apps-script-v2/Menu.gs`
- `apps-script-v2/16_Diagnostics.gs`
- `apps-script-v2/99_TestHarness.gs`
- Phase 3/4 tests
- README縲｀anual Guide縲ゝraceability

Implementation outline:

1. `繧ｿ繧ｹ繧ｯ荳隕ｧ`陦・莉･髯阪∝茜逕ｨ閠・ｷｨ髮・庄閭ｽ蛻励□縺代ｒ蟇ｾ雎｡縺ｫ縺吶ｋ縲・2. owner遒ｺ隱堺ｻ倥″installable edit trigger繧貞・遲我ｽ懈・縺吶ｋ縲・3. 5蛻・ime-driven Trigger縺ｨ縺ｯ蛻･遞ｮ鬘槭・蛻･lifecycle縺ｧ邂｡逅・☆繧九・4. edit event縺ｮrange縺九ｉ陦・蛻励ｒ豁｣遒ｺ縺ｫ蜿門ｾ励＠縲・㍾隍・｡後ｒ髯､螟悶☆繧九・5. `manual_fields`縲］ormalization縲‥ecision縲〉ow version縲＾utbox繧呈峩譁ｰ縺吶ｋ縲・6. Gmail縲、I縲，alendar API繧弾dit handler縺九ｉ蜻ｼ縺ｰ縺ｪ縺・・7. 謇句虚menu縺ｯfallback縺ｨ縺励※谿九☆縲・8. trigger菴懈・繧呈悍縺ｾ縺ｪ縺・・遉ｺDecision縺後≠繧句ｴ蜷医・縲∵ｭ｣譛ｬ繧貞・縺ｫ螟画峩縺吶ｋ縲・
Tests:

- single cell縲［ulti-cell縲｝aste縲・0陦御ｸ企剞
- user column / management column
- repeated event idempotency
- Review accept/reject
- Calendar Outbox enqueue
- Setup rerun縺ｧtrigger驥崎､・↑縺・- unrelated trigger蜑企勁縺ｪ縺・- real Workspace edit event

Acceptance criteria:

- 繧ｻ繝ｫ邱ｨ髮・□縺代〒manual field菫晁ｭｷ縺梧・遶九☆繧九・- 譛ｪ蜿肴丐迥ｶ諷九ｒ谿九＆縺ｪ縺・・- time-driven Automation縺ｯ蛻晄悄OFF縺ｮ縺ｾ縺ｾ縲・- local regression縺ｨreal edit acceptance縺訓ASS縲・
Dependencies:

- current user authorization

### WP-06 窶・Lightweight Operations Dashboard

```text
Work Package ID: WP-06
Priority: P1
Related findings: F-005
Objective: Phase 7蠢・医・霆ｽ驥城°逕ｨ蜿ｯ隕匁ｧ繧貞ｮ溯｣・☆繧・Complexity: M
Recommended reasoning level: 髱槫ｸｸ縺ｫ鬮倥＞
```

Files:

- new `apps-script-v2/15_Dashboard.gs`
- `apps-script-v2/Menu.gs`
- `apps-script-v2/99_TestHarness.gs`
- new local Dashboard test
- 蠢・ｦ√↓蠢懊§縺ｦ`apps-script-v2/00_Config.gs`
- README縲｀anual Guide縲ゝraceability縲￣hase report縲，HANGELOG

Implementation outline:

- 譌｢蟄・蛻祐chema繧堤ｶｭ謖√＠縲∵・遉ｺrefresh縺ｧ螳牙・縺ｪ髮・ｴ・､縺縺代ｒkeyed upsert縺吶ｋ縲・- 谺｡縺ｮData source縲・寔邏・∵峩譁ｰ縲∵ｧ閭ｽ縲《ecurity contract繧剃ｸ菴薙〒螳溯｣・☆繧九・
Data source:

- `繧ｿ繧ｹ繧ｯ荳隕ｧ`
- `蜃ｦ逅・ｱ･豁ｴ`
- `繧ｨ繝ｩ繝ｼ繝ｻ蜀榊ｮ溯｡形
- `蜷梧悄迥ｶ諷義
- Script Properties
- shared read-only health collector

Aggregation method:

- `task_id`縺ｾ縺溘・`origin_key`縺後≠繧亀ask縺縺代ｒ髮・ｨ・- Error/Outbox縺ｯlogical record縺縺代ｒ髮・ｨ・- Sheet縺斐→縺ｫ1蝗槭∪縺溘・budgeted chunk縺ｧread
- count/status/time縺縺代ｒ逕滓・
- 譌｢蟄・蛻輿metric_key / metric_value / metric_note`繧談eyed upsert

Refresh method:

- 蛻晄悄譁ｹ蠑上・蛻ｩ逕ｨ閠・・譏守､ｺ`Dashboard譖ｴ譁ｰ`
- Worker縺九ｉ蜻ｼ縺ｰ縺ｪ縺・- Quick/Deep Diagnostic縺九ｉwrite縺励↑縺・- shared pure collector縺ｯ險ｱ蜿ｯ縺吶ｋ縺後∬ｲｬ蜍吶→read蝗樊焚繧呈・遉ｺ縺吶ｋ
- 譛ｪ譖ｴ譁ｰ譎ゅ・縲梧悴譖ｴ譁ｰ / Automation OFF / Diagnostic譛ｪ螳溯｡後阪ｒ陦ｨ遉ｺ

Minimum metrics:

1. automation status
2. last success
3. last failure
4. processed today
5. review count
6. overdue count
7. due today count
8. due within 7 days
9. waiting count
10. retry waiting count
11. Dead Letter count
12. Calendar pending count
13. unresolved error count
14. system health
15. AI provider
16. Quick Diagnostic status

Performance budget:

- 蟆ら畑soft budget
- Task/Error/Outbox/History/Properties繧貞推1蝗・- 1蝗槭・`setValues`
- 100 / 1,000 / 10,000 row縺ｮlocal/Fake險域ｸｬ
- Apps Script螳滓ｸｬ
- Worker荳ｭ縺ｯ遏ｭ縺дryLock縺ｾ縺溘・BUSY邨ゆｺ・
Security constraints:

- body縲《ubject縲《ender縲〉aw Gmail/Calendar ID縲…redential縲｝ayload繧定｡ｨ遉ｺ縺励↑縺・- Task title繧定｡ｨ遉ｺ縺励↑縺・- count縲《tatus縲》imestamp縲《afe note縺ｮ縺ｿ
- Error detail縺ｸ逶ｴ謗･link縺励↑縺・
Tests:

- file/menu existence
- empty縲・00縲・,000縲・0,000 row
- count accuracy
- idempotent refresh
- no Task/Error/Outbox mutation
- no external service
- no raw ID/secret
- budget exhaustion
- Worker/Diagnostic髱樔ｾ晏ｭ・- real Apps Script manual acceptance

Acceptance criteria:

- 豁｣譛ｬ縺ｮ譛菴手｡ｨ遉ｺ繧呈ｺ縺溘☆縲・- Dashboard縺ｯ豁｣譛ｬ縺ｫ縺ｪ繧峨↑縺・・- Dashboard failure縺ｧWorker繧貞､ｱ謨励＆縺帙↑縺・・- 鬮伜ｺｦ縺ｪWork Block縲∵律谺｡繝ｻ騾ｱ谺｡review縲《chedule譛驕ｩ蛹悶ｒ蜷ｫ繧√↑縺・・- Phase 7 Gate繧堤峡遶句・蛻､螳壹☆繧九・
Dependencies:

- WP-07 shared health design

### WP-07 窶・Runtime Settings and Shared Preflight

```text
Work Package ID: WP-07
Priority: P1
Related findings: F-006
Objective: 陦ｨ遉ｺ險ｭ螳壹ヽuntime縲．iagnostic縲‘nable蛻､螳壹ｒ荳閾ｴ縺輔○繧・Complexity: L
Recommended reasoning level: 髱槫ｸｸ縺ｫ鬮倥＞
```

Files:

- `apps-script-v2/00_Config.gs`
- `apps-script-v2/01_TypesAndSchemas.gs`
- `apps-script-v2/03_SheetBuilder.gs`
- `apps-script-v2/12_Triggers.gs`
- `apps-script-v2/16_Diagnostics.gs`
- `apps-script-v2/18_Worker.gs`
- tests縲ヽEADME縲；uide

Implementation outline:

1. Runtime settings snapshot縺ｮ雋ｬ蜍咎・鄂ｮ繧定ｨｭ險医☆繧九・2. 1 run縺ｧ1蝗槭□縺全ettings繧定ｪｭ繧縲・3. type縲〉ange縲∥llowed value縲‘ditable policy繧呈､懆ｨｼ縺吶ｋ縲・4. 蝗ｺ螳夐・岼繧貞ｮ滄圀縺ｫ菫晁ｭｷ縺吶ｋ縲・5. 譛ｪ蟇ｾ蠢懆ｨｭ螳壹・邱ｨ髮・ｸ榊庄繝ｻ諠・ｱ陦ｨ遉ｺ縺ｫ螟画峩縺吶ｋ縲・6. common pure preflight collector繧剃ｽ懊ｋ縲・7. Quick Diag…729 tokens truncated…Setup Consent and Operational UX

```text
Work Package ID: WP-09
Priority: P1
Related findings: F-009
Objective: 蛻晄悄蟆主・縲∝・髢九∵律蟶ｸmenu縲∫ｵ先棡陦ｨ遉ｺ繧定ｪ､謫堺ｽ懊＠縺ｫ縺上￥縺吶ｋ
Complexity: M
Recommended reasoning level: 髱槫ｸｸ縺ｫ鬮倥＞
```

Files:

- `apps-script-v2/Menu.gs`
- `apps-script-v2/02_Setup.gs`
- `apps-script-v2/03_SheetBuilder.gs`
- README縲｀anual Guide
- UX acceptance checklist

Implementation outline:

1. Setup蜑阪↓Gmail label 7莉ｶ縲∝ｰら畑secondary Calendar縲、utomation OFF縲・   external AI縺ｪ縺励ｒ陦ｨ遉ｺ縺吶ｋ縲・2. Continue蜑阪↓谺｡stage縺ｨ蜑ｯ菴懃畑繧定｡ｨ遉ｺ縺吶ｋ縲・3. COMPLETE/PAUSED/FAILED繧堤洒縺・律譛ｬ隱枹ummary縺ｨ谺｡謫堺ｽ懊〒陦ｨ遉ｺ縺吶ｋ縲・4. menu繧担etup縲∵律蟶ｸ縲、utomation縲ヽecovery/Diagnostic縲ゝest縺ｸ謨ｴ逅・☆繧九・5. 7蛟九・Phase test繧堤ｮ｡逅・ubmenu縺ｾ縺溘・蜈ｨtest command縺ｸ髮・ｴ・☆繧九・6. Diagnostic縺ｯstatus count縺ｨ謗ｨ螂ｨaction繧貞・縺ｫ陦ｨ遉ｺ縺吶ｋ縲・7. 12,000譁・ｭ幼ut譎ゅ↓蛻・ｊ隧ｰ繧√ｒ譏守､ｺ縺吶ｋ縲・8. Error Sheet縺ｯ驕狗畑蛻励→謚陦灘・繧呈紛逅・☆繧九・
Tests:

- consent text and stage display
- cancelled setup has no side effect
- resume next-stage accuracy
- current automation/trigger count in dialog
- safe result truncation
- menu entry existence
- real UI usability

Acceptance criteria:

- 蛻ｩ逕ｨ閠・′螟夜Κ蜑ｯ菴懃畑繧貞ｮ溯｡悟燕縺ｫ逅・ｧ｣縺ｧ縺阪ｋ縲・- 譌･蟶ｸ謫堺ｽ懊→test/admin謫堺ｽ懊ｒ蛹ｺ蛻･縺ｧ縺阪ｋ縲・- JSON繧定ｪｭ縺ｾ縺ｪ縺上※繧よｬ｡謫堺ｽ懊ｒ蛻､譁ｭ縺ｧ縺阪ｋ縲・
Dependencies:

- WP-05縲仝P-06縲仝P-07縺ｮ蜈ｬ髢菊ntry point遒ｺ螳・
### WP-10 窶・Deep Diagnostic and Retention Visibility

```text
Work Package ID: WP-10
Priority: P2
Related findings: F-010
Objective: read-only縺ｧ髟ｷ譛滓紛蜷医・retention蟇ｾ雎｡繧呈滑謠｡縺吶ｋ
Complexity: M
Recommended reasoning level: 髱槫ｸｸ縺ｫ鬮倥＞
```

Files:

- `apps-script-v2/00_Config.gs`
- `apps-script-v2/03_SheetBuilder.gs`
- `apps-script-v2/16_Diagnostics.gs`
- `apps-script-v2/99_TestHarness.gs`
- diagnostic tests縲ヽEADME縲；uide

Implementation outline:

1. 365/365/90譌･縺ｮ譌｢螳壼､繧剃ｼ夂､ｾpolicy譛ｪ遒ｺ隱阪→縺励※譏守､ｺ縺吶ｋ縲・2. 閾ｪ蜍募炎髯､縺ｯ螳溯｣・＠縺ｪ縺・・3. Task/Message/Outbox limited integrity繧定ｿｽ蜉縺吶ｋ縲・4. Event ID/Task marker縺ｯ螟夜ΚCalendar繧貞他縺ｰ縺嗟ocal metadata縺縺醍・蜷医☆繧九・5. retention蟇ｾ雎｡莉ｶ謨ｰ縺ｨoldest timestamp繧定ｿ斐☆縲・6. Schema/Validation drift繧奪eep sample縺ｸ霑ｽ蜉縺吶ｋ縲・7. sparse data繧定・・縺励◆sample strategy繧貞ｮ夂ｾｩ縺吶ｋ縲・
Tests:

- no write / no external call
- retention count boundary
- sparse rows after first 50
- mismatch samples
- 180 second budget
- safe output

Acceptance criteria:

- Spec `27.2`縺ｮread-only鬆・岼繧呈ｺ縺溘☆縲・- cleanup縺ｯ陦後ｏ縺ｪ縺・・- real Workspace runtime繧貞ｮ滓ｸｬ縺吶ｋ縲・
Dependencies:

- 莨夂､ｾretention policy

### WP-11 窶・Metadata / Traceability Correction

```text
Work Package ID: WP-11
Priority: P2
Related findings: F-005, F-011, F-012
Objective: 豁｣譛ｬ縲∝ｮ溯｣・」ersion縲；ate縲“uide繧剃ｸ閾ｴ縺輔○繧・Complexity: S
Recommended reasoning level: 髱槫ｸｸ縺ｫ鬮倥＞
```

Files:

- `apps-script-v2/02_Setup.gs`
- `apps-script-v2/03_SheetBuilder.gs`
- related tests
- README縲，HANGELOG縲｀anual Guide縲ゝraceability縲￣hase report
- 蠢・ｦ√↓蠢懊§縺ｦ讖溷ｯ・勁蜴ｻ貂医∩control brief

Implementation outline:

1. Dashboard繧単hase 8縺ｨ縺吶ｋ隱､險倥ｒ菫ｮ豁｣縺吶ｋ縲・2. Phase 7繧池emediation螳御ｺ・∪縺ｧPARTIAL縺ｨ縺励※險倬鹸縺吶ｋ縲・3. `STOP_BEFORE_PHASE7`繧貞ｮ檬ate迥ｶ諷九↓鄂ｮ謠帙☆繧九・4. Settings/Guide縺ｮPhase 1 wording繧致ersioned upsert縺吶ｋ縲・5. control source chain繧坦epository蜀・〒蜀咲樟蜿ｯ閭ｽ縺ｫ縺吶ｋ縲・6. Code/Schema/AI/Migration version譖ｴ譁ｰ隕∝凄繧貞愛螳壹☆繧九・
Tests:

- stale phrase scan
- version/property/system-config alignment
- rerun preserves user data
- Dashboard requirement trace

Acceptance criteria:

- Spec縲￣lan縲ゝrace縲ヽEADME縲ヽeport縲…ode縺ｮPhase蠅・阜縺御ｸ閾ｴ縺吶ｋ縲・- 譌｢蟄伜茜逕ｨ閠・ask/險ｭ螳壹ｒ遐ｴ螢翫＠縺ｪ縺・・
Dependencies:

- WP-05縲弩P-10縺ｮ螳御ｺ・ｯ・峇

### WP-12 窶・Git Initial Release Hygiene

```text
Work Package ID: WP-12
Priority: P1 before first commit
Related findings: F-008
Objective: secret-safe縺ｧ逶｣譟ｻ蜿ｯ閭ｽ縺ｪ蛻晏屓Git baseline繧呈ｺ門ｙ縺吶ｋ
Complexity: S
Recommended reasoning level: 髱槫ｸｸ縺ｫ鬮倥＞
```

Files:

- new `.gitignore`
- local path繧貞性繧譌｢蟄腕eports
- Archive霑ｽ霍｡譁ｹ驥・- current staged allow-list

Implementation outline:

1. 57 staged file繧定｣ｽ蜩√∽ｻ墓ｧ倥》est縲〉eport縲、rchive縲（nstruction縺ｫ蛻・｡槭☆繧九・2. 螳歔.clasp.json`縲～.env*`縲…redential/key縲〕ogs縲》mp縲＾S junk繧段gnore縺吶ｋ縲・3. example file縺ｯ霑ｽ霍｡蜿ｯ閭ｽ縺ｫ菫昴▽縲・4. local absolute path 2莉ｶ繧恥laceholder縺ｸ荳闊ｬ蛹悶☆繧九・5. Archive縺ｮ菫晄戟逅・罰縲…hecksum縲《can譁ｹ驥昴ｒ豎ｺ螳壹☆繧九・6. whitespace check繧・縺ｫ縺吶ｋ縲・7. working tree縲（ndex縲、rchive繧貞ｰら畑secret scanner縺ｧ讀懈渊縺吶ｋ縲・8. 蜈ｨremediation縺ｨaudit螳御ｺ・ｾ後√Θ繝ｼ繧ｶ繝ｼ謇ｿ隱阪ｒ蠕励◆蛻･session縺縺代〒commit縺吶ｋ縲・
Tests:

- `git status --short`
- `git diff --cached --check`
- `git check-ignore --no-index apps-script-v2/.clasp.json`
- secret scanner
- Archive inventory/hash
- full regression

Acceptance criteria:

- 蛻晏屓commit candidate縺径llow-list蛹悶＆繧後ｋ縲・- real local config/secret縺景gnore縺輔ｌ繧九・- local user path縺後↑縺・・- user approval縺ｪ縺励↓commit/push/remote螟画峩縺励↑縺・・
Dependencies:

- core remediation螳御ｺ・
### WP-13 窶・Real Workspace Sandbox Acceptance

```text
Work Package ID: WP-13
Priority: P0 before personal pilot
Related findings: all external-validation gaps
Objective: local/Mock PASS繧貞ｮ檬oogle Workspace PASS縺ｨ蛻・屬縺励※讀懆ｨｼ縺吶ｋ
Complexity: L
Recommended reasoning level: 髱槫ｸｸ縺ｫ鬮倥＞
```

Files:

- `apps-script-v2/`縺ｮ譛邨Ｓemediation code荳蠑・- `apps-script-v2/appsscript.json`
- `apps-script-v2/99_TestHarness.gs`
- `tests/`縺ｮ蜈ｨlocal suite
- README縲｀anual Guide縲ゝraceability縲∥cceptance report

Environment:

- 譁ｰ縺励＞髱樊ｩ溷ｯ・oogle Spreadsheet
- 蟆ら畑test Gmail label / synthetic self-mail
- 蟆ら畑secondary Calendar
- 謇ｿ隱肴ｸ医∩Provider縺ｯWP-01/02螳御ｺ・ｾ後□縺・- production data縲∝ｮ滉ｼ夂､ｾmail縲∝ｮ歛ttachment縺ｯ菴ｿ逕ｨ縺励↑縺・
Implementation outline:

1. WP-01縲弩P-12縺ｮ螳御ｺ・憾諷九→version繧恥reflight縺ｧ遒ｺ隱阪☆繧九・2. 譁ｰ縺励＞髱樊ｩ溷ｯ・andbox縺ｸ豁｣遒ｺ縺ｪfile inventory繧壇eploy縺吶ｋ縲・3. Automation OFF縺ｮ縺ｾ縺ｾPhase 1縲・縺ｮ謇句虚蜿怜・縺九ｉ髢句ｧ九☆繧九・4. 螳蘖rovider縺ｨAutomation縺ｯ謇ｿ隱肴ｸ医∩蜑肴署繧貞・遒ｺ隱阪＠縺ｦ縺九ｉ譏守､ｺenable縺吶ｋ縲・5. 蜷・ase縺ｮ螳溯｡梧律譎ゅ∫腸蠅・ｨｮ蛻･縲￣ASS/FAIL/SKIPPED繧堤ｧ伜ｯ・ュ蝣ｱ縺ｪ縺励〒險倬鹸縺吶ｋ縲・6. FAIL譎ゅ・蠕檎ｶ嘖tage縺ｸ騾ｲ縺ｾ縺壹∽ｿｮ豁｣蠕後↓蜈ｨRegression縺九ｉ蜀埼幕縺吶ｋ縲・
Tests:

1. Phase 1 Data Validation縲￣rotection縲・00陦後〉erun
2. Phase 2 Gmail label縲［anual import縲｀essage State
3. Phase 3 real edit trigger縲ヽeview縲［anual field
4. Phase 4 5 skipped Calendar/OAuth cases
5. Phase 5 real Provider 1 skipped case
6. Phase 6 real Trigger/Gmail 2 skipped cases
7. Phase 7 real Retry/Diagnostic 2 skipped cases
8. Dashboard explicit refresh縲…ounts縲］o external call
9. Setup 120遘偵＿uick 60遘偵．eep 180遘偵仝orker 210遘・10. concurrent Worker/edit/retry/disable
11. 100 recent Threads縺ｨrepresentative row counts
12. 1920ﾃ・080 visual/operational UX

Acceptance criteria:

- 10 SKIPPED繧貞ｮ溯｡梧ｸ医∩縺ｮ繧ゅ・縺縺善ASS縺ｸ螟画峩縺吶ｋ縲・- 譛ｪ螳溯｡後ｒPASS縺ｨ縺励↑縺・・- raw ID縲｜ody縲…redential繧池eport縺ｸ險倬鹸縺励↑縺・・- High/Medium finding縺・縲・- personal pilot Gate繧堤峡遶句・逶｣譟ｻ縺吶ｋ縲・
Dependencies:

- WP-02縲弩P-12
- company approval
- user authorization

## 4. Gate after Remediation

谺｡縺ｮ蜈ｨ譚｡莉ｶ繧呈ｺ縺溘☆縺ｾ縺ｧ蛟倶ｺｺpilot繧帝幕蟋九＠縺ｪ縺・・
- [ ] F-001縲：-002縺ｮHigh縺瑚ｧ｣豸・- [ ] F-003縲廡-009縺ｮMedium縺瑚ｧ｣豸・- [ ] Phase 3縲・縲・縲・繧貞・逶｣譟ｻ
- [ ] `15_Dashboard.gs`縺ｨDashboard tests縺悟ｭ伜惠
- [ ] production provider蠅・阜繧貞ｮ溯｣・√∪縺溘・pilot scope繧呈・遉ｺMock-only縺ｫ髯仙ｮ・- [ ] installable edit trigger縺悟ｮ欷orkspace縺ｧPASS
- [ ] Settings縺ｨRuntime縺御ｸ閾ｴ
- [ ] current preflight荳榊粋譬ｼ譎ゅ↓Trigger繧剃ｽ懈・縺励↑縺・- [ ] full regression 0 FAIL
- [ ] `.gs`縲［anifest縲《cope縲《ecret scan PASS
- [ ] Google Workspace acceptance繧貞ｮ溯｡梧ｸ医∩縺縺善ASS
- [ ] 蛻晏屓Git baseline繧偵Θ繝ｼ繧ｶ繝ｼ謇ｿ隱榊ｾ後↓菴懈・蜿ｯ閭ｽ縺ｪ迥ｶ諷・
## 5. Explicit Non-goals

縺薙・Remediation縺ｯPhase 8縺ｧ縺ｯ縺ｪ縺・よｬ｡繧貞性繧√↑縺・・
- Work Block
- 譌･谺｡brief
- 騾ｱ谺｡review
- schedule optimization
- 髱｢隲・ｮ｡逅・- v1 migration
- 譁ｰ縺励＞Review蟆ら畑tab
- 騾壼ｸｸInbox縺ｮ辟｡蛻ｶ髯尽can
- 譛ｪ謇ｿ隱恒rovider縲∵楔遨ｺendpoint縲∵楔遨ｺcredential
- Setup縺九ｉ縺ｮproduction 5蛻・rigger菴懈・
- Dashboard縺九ｉ縺ｮ螟夜ΚAI/Gmail/Calendar騾壻ｿ｡

## 6. Post-remediation audit addendum 窶・2026-07-25

譌｢蟄炉inding縺ｨWork Package縺ｯ蜑企勁縺帙★縲∽ｿｮ豁｣蠕後・迢ｬ遶狗屮譟ｻ邨先棡繧呈ｬ｡縺ｮ縺ｨ縺翫ｊ
霑ｽ險倥☆繧九・
| Finding | Post-remediation status | Remaining |
|---|---|---|
| F-001 | PARTIALLY CLOSED / CODE AND EXTERNAL WORK REMAIN | Provider/model/endpoint/auth縲￣rovider Adapter縲］etwork transport縲…redential loader縲∽ｼ夂､ｾ繝ｻdata繝ｻcredential菫晉ｮ｡謇ｿ隱阪∝ｮ滓磁邯壹ょ刈縺医※Gmail search/body/label縺ｨCalendar I/O縺ｮ髟ｷ譎る俣Worker Lock螟悶∈縺ｮ蛻・屬 |
| F-002 | PARTIALLY CLOSED / BLOCKED BY EXTERNAL DECISION | newsletter / Calendar騾夂衍policy縲∝ｮ檬mail |
| F-003 | CLOSED 窶・LOCAL / EXTERNAL VALIDATION PENDING | 螳歡redential handling |
| F-004 | CLOSED 窶・LOCAL / EXTERNAL VALIDATION PENDING | 螳殪wner installable edit event |
| F-005 | PARTIALLY CLOSED / REOPENED 窶・MEDIUM | 髱樒ｩｺcustom key縺ｯ菫晄戟縺吶ｋ縺後〔ey遨ｺ谺・°縺､B/C縺ｫ蛟､繝ｻformula縺後≠繧玖｡後ｒsystem block縺御ｸ頑嶌縺阪＠蠕励ｋ縲・ashboard Schema縺ｾ縺溘・Quick Diagnostic FAIL譎ゅ・write繧Ｇail closed蛹悶′蠢・ｦ・|
| F-006 | CLOSED 窶・LOCAL / EXTERNAL VALIDATION PENDING | 螳蘖rotection/Validation/enable |
| F-007 | PARTIALLY CLOSED 窶・MEDIUM | Setup budget縲，alendar pagination縲；mail call cap縺ｯ螳溯｣・ｸ医∩縲・mail/Calendar螟夜ΚI/O縺碁聞譎る俣Worker Lock蜀・↓谿九ｋ縺溘ａ縲∝ｮ殯uota/duration遒ｺ隱榊燕縺ｫ繧Ｄode remediation縺悟ｿ・ｦ・|
| F-008 | PARTIALLY CLOSED / ENVIRONMENT PERMISSION | baseline/branch/commits縲Ａ.git/index.lock` write permission |
| F-009 | CLOSED 窶・LOCAL / EXTERNAL VALIDATION PENDING | 螳歸ialog usability |
| F-010 | OPEN 窶・LOW / POLICY | retention縲・聞譛滄°逕ｨ縲｜roader Deep visibility |
| F-011 | CLOSED 窶・LOCAL / EXTERNAL VALIDATION PENDING | 螳滓里蟄・2 rerun |
| F-012 | OPEN 窶・INFORMATIONAL | external governance/control chain |

### F-013 窶・Low 窶・Dashboard layout conflict縺ｮdirect negative test荳崎ｶｳ

`apps-script-v2/15_Dashboard.gs`縺ｯ縲・㍾隍㎏ystem key縲∝・謨｣system block縺ｾ縺溘・
custom row縺ｨ螳牙・縺ｫ蜈ｱ蟄倥〒縺阪↑縺・・鄂ｮ繧・`E_DASHBOARD_LAYOUT_CONFLICT`縺ｧfail closed縺吶ｋ縲る壼ｸｸ縺ｮkeyed upsert縲・髱樒ｩｺkey繧呈戟縺､custom row/formula菫晄戟縲∝・遲画ｧ縺ｯlocal test貂医∩縺縺後√％縺ｮ
exact error path繧堤峩謗･逋ｺ逕溘＆縺帙ｋtest縺ｯ蟄伜惠縺励↑縺・Ｌey遨ｺ谺・°縺､B/C縺ｫ蛟､縺ｾ縺溘・
formula縺後≠繧玖｡後・菫晁ｭｷ荳崎ｶｳ縺ｯF-005縺ｨ縺励※蛻･騾泌・繧ｪ繝ｼ繝励Φ縺励◆縲・
```text
Status: OPEN
Related Work Package: WP-06
Severity: Low
TEST_MODE=true synthetic Sandbox blocker: No
TEST_MODE=false Sandbox / personal pilot prerequisite: Yes
```

霑ｽ蜉test縺ｯ譛菴朱剞縲∵ｬ｡繧堤｢ｺ隱阪☆繧九・
1. duplicate system key繧貞酔縺脇rror code縺ｧ諡貞凄縺吶ｋ縲・2. custom row縺ｧ蛻・妙縺輔ｌ縺滓里蟄・ystem block繧呈耳貂ｬ遘ｻ蜍輔○縺壽拠蜷ｦ縺吶ｋ縲・3. failure蜑榊ｾ後〒Dashboard蛟､縲’ormula縲∬｡梧焚縲《ource Sheet縺御ｸ榊､峨〒縺ゅｋ縲・4. conflict譎ゅ↓row expansion縺ｾ縺溘・驛ｨ蛻・setValues`繧定｡後ｏ縺ｪ縺・・
螳溯｣・・菴薙・fail-closed蠅・阜縺ｨ髱樒ｩｺkey縺ｮnormal/custom-row邨瑚ｷｯ縺畦ocal test貂医∩縺ｮ
縺溘ａ縲√％縺ｮtest gap閾ｪ菴薙・Critical/High/Medium縺ｸ蠑輔″荳翫￡縺ｪ縺・Ｃlank-key陦後・
螳溯｣・ｸ翫・谺髯･縺ｯF-005 Medium縺ｨ縺励※謇ｱ縺・・
### F-014 窶・Medium 窶・production Provider螟ｱ謨励・謚第ｭ｢繝ｻRun History騾｣謳ｺ荳崎ｶｳ

production classification縺ｯmain Worker Lock繧医ｊ蜑阪↓螳溯｡後＆繧後ｋ縲ゅ◎縺ｮfailure
path縺ｯMessage State縺ｸfailure繧定ｨ倬鹸縺吶ｋ荳譁ｹ縲￣rovider蜈ｨ菴薙・
`noteProviderFailure()`繧貞他縺ｰ縺ｪ縺・ゅ∪縺溘［ain Lock譛ｪ蜿門ｾ励・縺溘ａfinal Run
Summary縺御ｿ晏ｭ倥＆繧後↑縺・ｵ瑚ｷｯ縺後≠繧九・
```text
Status: OPEN
Related Work Package: WP-02, WP-08
Severity: Medium
TEST_MODE=true synthetic Sandbox blocker: No, provided no real Provider is used
Real Provider / TEST_MODE=false prerequisite: Yes
```

菫ｮ豁｣縺ｨtest縺ｯ譛菴朱剞縲∵ｬ｡繧堤｢ｺ隱阪☆繧九・
1. production classification螟ｱ謨励ｒProvider suppression縺ｸ螳牙・縺ｫ險井ｸ翫☆繧九・2. main Lock蜿門ｾ怜燕縺ｮ螟ｱ謨励ｂ讖溷ｯ・ｒ蜷ｫ縺ｾ縺ｪ縺Сun History縺ｾ縺溘・Error evidence縺ｸ谿九☆縲・3. suppression荳ｭ縺ｯtransport繧貞他縺ｰ縺壹〉etry蜿ｯ閭ｽ譎ょ綾繧剃ｸ雋ｫ縺励※霑斐☆縲・4. 螟ｱ謨苓ｨ倬鹸閾ｪ菴薙′螟ｱ謨励＠縺ｦ繧ょ・萓句､悶ｒ貍上∴縺・＆縺帙★縲∝・遲画ｧ繧貞｣翫＆縺ｪ縺・・
### F-015 窶・Low 窶・production CAS conflict failure-injection荳崎ｶｳ

AI transport縺ｮlock-free螳溯｡後→CAS謌仙粥邉ｻ縺ｯlocal test貂医∩縺縺後》ransport蠕・ｩ滉ｸｭ縺ｮ
Task edit縲…laim螟画峩縲（nput hash荳堺ｸ閾ｴ縲〉ow version荳堺ｸ閾ｴ縲∽ｺ碁㍾Worker繧・逶ｴ謗･豕ｨ蜈･縺励◆negative test縺後↑縺・・
```text
Status: OPEN
Related Work Package: WP-02
Severity: Low
TEST_MODE=true synthetic Sandbox blocker: No, provided no concurrency is exercised
TEST_MODE=false Sandbox / personal pilot prerequisite: Yes
```

霑ｽ蜉test縺ｧ縺ｯ縲《tale縺ｪAI邨先棡縺卦ask縲｀essage State縲，alendar Outbox縺ｸcommit
縺輔ｌ縺ｪ縺・％縺ｨ縲・㍾隍Ⅰask/Event繧剃ｽ懊ｉ縺ｪ縺・％縺ｨ縲《afe縺ｪ遶ｶ蜷育ｵ先棡繧定ｿ斐☆縺薙→繧堤｢ｺ隱・縺吶ｋ縲・
## 7. Final code-remediation closure addendum 窶・2026-07-25

縺薙・遽縺ｯ荳願ｨ榔ost-remediation audit譎らせ縺ｮFinding險倬鹸繧貞炎髯､縺帙★縲∽ｻ雁屓縺ｮ
code-remediable遽・峇縺ｮ譛邨ら憾諷九ｒ霑ｽ險倥☆繧九１rovider縲∽ｼ夂､ｾ謇ｿ隱阪…redential
菫晉ｮ｡謇ｿ隱阪］ewsletter・修alendar騾夂衍policy縲〉etention縲“overnance縲∝ｮ檬oogle
Workspace讀懆ｨｼ縺ｯ豎ｺ螳壹∪縺溘・螳溯｡後＠縺溘ｂ縺ｮ縺ｨ縺励※謇ｱ繧上↑縺・・
| Finding | Final code status | Local evidence | External remaining |
|---|---|---|---|
| F-001 | CLOSED 窶・CODE-REMEDIABLE SCOPE | Gmail search/body/label縲、I transport縲，alendar list/CRUD繧担cript Lock螟悶∈蛻・屬縲ら洒譎る俣claim縲｛wnership縲”ash縲〉ow version縲，AS縲…heckpoint繧堤ｶｭ謖・| 螳蘖rovider縲∝ｮ檬mail/Calendar縲∝ｮ櫚ockService遶ｶ蜷医・`NOT EXECUTED` |
| F-005 | CLOSED 窶・LOCAL | marker莉倥″system-owned 3-column block莉･螟悶・blank-key value/formula繧貞性繧’ail closed縲２uick Diagnostic螟ｱ謨玲凾繧Ｘrite蜑榊●豁｢ | 螳欖heet縺ｮnote/validation/merge/protection/named-range謖吝虚縺ｯ`NOT EXECUTED` |
| F-007 | CLOSED 窶・CODE-REMEDIABLE SCOPE | bounded Gmail calls縲，alendar pagination縲ヾetup budget縺ｫ蜉縺医（nstrumented gateway縺ｧ螟夜ΚI/O譎・ock髱樔ｿ晄戟繧堤峩謗･讀懆ｨｼ | 螳殯uota縲∝ｮ溯｡梧凾髢薙，alendar API latency縺ｯ`NOT EXECUTED` |
| F-013 | CLOSED 窶・LOCAL | `E_DASHBOARD_LAYOUT_CONFLICT`繧鍛lank-key縲’ormula縲［etadata縲’oreign marker縲‥iagnostic failure縺ｧ逶ｴ謗･逋ｺ逕溘＆縺帙∝憶菴懃畑縺ｪ縺励ｒ讀懆ｨｼ | 螳櫂ashboard UI縺ｯ`NOT EXECUTED` |
| F-014 | CLOSED 窶・CODE-REMEDIABLE SCOPE | transient Provider螟ｱ謨励ｒrun_id蜀ｪ遲峨・bounded suppression縺ｸ謗･邯壹りｨｭ螳壼､ｱ謨励ｒ蜷ｫ繧蜈ｨrun outcome繧坦un History縺ｸ螳牙・縺ｫ險倬鹸 | 螳蘖rovider髫懷ｮｳ縺ｯ`NOT EXECUTED` |
| F-015 | CLOSED 窶・LOCAL | claim ownership縲《tage縲（nput hash縲ゝask row_version縲∽ｺ碁㍾Worker縲，alendar菴懈・謌仙粥蠕後・Task/Outbox CAS遶ｶ蜷医ｒ逶ｴ謗･豕ｨ蜈･縲ょ・螳溯｡梧凾Event驥崎､・↑縺・| 螳溷酔譎ょｮ溯｡後→螳櫃alendar 409縺ｯ`NOT EXECUTED` |

Final local regression:

```text
34 suites
471 PASS
0 FAIL
11 SKIPPED
22/22 .gs syntax PASS
```

Local Gate縺ｯCritical / High / Medium縺ｮ繧ｳ繝ｼ繝我ｸ皆inding 0縺ｨ縺励※PASS縺吶ｋ縲・TEST_MODE=true縲、utomation OFF繧堤ｶｭ謖√＠縲ゝEST_MODE=false Sandbox莉･髯阪・螟夜Κ
蛻､譁ｭ縺ｨ螳溽腸蠅エate縺悟ｮ御ｺ・☆繧九∪縺ｧNO-GO縺ｨ縺吶ｋ縲・
