# Google Workspace Personal Work OS v2
# Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Code Version | `2.8.1-prepilot` |
| Schema Version | `2.2` |
| AI Schema Version | `2.0` |
| Migration Version | `0` |
| TEST_MODE | `true` |
| Automation default | `OFF` |
| Package prepared at | `{{PREPARED_AT}}` |
| Source commit | {{SOURCE_COMMIT}} |
| Source tree status | {{SOURCE_TREE_STATUS}} |

縺薙・package縺ｯPhase 8A縺ｧ菴懈・縺励◆髱樊悽逡ｪSandbox蜿怜・逕ｨ縺ｧ縺吶１hase 8B縺ｮ螳檬oogle
Workspace蜿怜・縲￣hase 8C縺ｮTEST_MODE=false蜿怜・縲∝ｮ蘖rovider謗･邯壹∝倶ｺｺ螳滓･ｭ蜍・繝代う繝ｭ繝・ヨ縺ｯ螳滓命貂医∩縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・
## Apps Script payload

- Source of truth: `apps-script-v2/`
- Payload files: `{{PAYLOAD_COUNT}}`
- `.gs` files: `{{GS_COUNT}}`
- Manifest files: `1`
- Canonical payload-list SHA-256:
  `{{PAYLOAD_BUNDLE_SHA256}}`

Canonical payload-list hash縺ｯ縲｝ath鬆・↓荳ｦ縺ｹ縺・`<lowercase sha256><two spaces><relative path><LF>`縺ｮ騾｣邨仙､縺ｫ蟇ｾ縺吶ｋSHA-256縺ｧ縺吶・
| Relative path | SHA-256 |
|---|---|
{{PAYLOAD_TABLE}}

## OAuth scopes

{{OAUTH_SCOPES}}

遖∵ｭ｢蠅・阜:

- `script.external_request`縺ｪ縺・- Drive scope縺ｪ縺・- mail-send scope縺ｪ縺・- `mail.google.com`蜈ｨ菴都cope縺ｪ縺・- Calendar蜈ｨ讓ｩ髯尽cope縺ｪ縺・
## Advanced Services

{{ADVANCED_SERVICES}}

## External boundaries

| Boundary | Status |
|---|---|
| Code implementation | `PASS_LOCAL` |
| Mock HTTP Transport | `PASS_LOCAL` |
| Real Provider connection | `NOT EXECUTED` |
| Provider / model / endpoint / auth | `NOT CONFIRMED` |
| Company approval | `NOT CONFIRMED` |
| Credential storage approval | `NOT CONFIRMED` |
| Real Google Workspace | `NOT EXECUTED` |
| Real OAuth consent | `NOT EXECUTED` |
| Real Trigger / LockService contention | `NOT EXECUTED` |

## Package exclusions

縺薙・package縺ｫ蜷ｫ繧√↑縺・ｂ縺ｮ:

- `.clasp.json`縺ｨ螳欖cript ID
- credential縲、PI key縲｝assword縲》oken縲｝rivate key
- Node test縲’ixture縲、rchive縲，odex prompt
- 螳欖preadsheet / Gmail / Calendar ID
- Google Workspace蜀・ΚURL
- 莨夂､ｾ繝｡繝ｼ繝ｫ譛ｬ譁・∵ｷｻ莉倥∝倶ｺｺ諠・ｱ縲∵悴蜈ｬ陦ｨ諠・ｱ

`CHECKSUMS.sha256`縺ｯ縲√％縺ｮmanifest縲＿uickstart縲、pps Script payload繧貞性繧
package蜈ｨfile・・CHECKSUMS.sha256`閾ｪ霄ｫ繧帝勁縺擾ｼ峨・hash繧恥ath鬆・〒險倬鹸縺励∪縺吶・
