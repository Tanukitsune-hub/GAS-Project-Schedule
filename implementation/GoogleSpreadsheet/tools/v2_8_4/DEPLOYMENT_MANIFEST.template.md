# Google Workspace Personal Work OS v2
# Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Repository | {{REPOSITORY}} |
| Source commit | {{SOURCE_COMMIT}} |
| Release content commit | {{RELEASE_COMMIT}} |
| Code Version | `2.8.4-prepilot` |
| Schema Version | `2.5` |
| AI Schema Version | `2.0` |
| Migration Version | `2` |
| TEST_MODE | `true` |
| Automation default | `OFF` |
| Package prepared at | `{{PREPARED_AT}}` |
| Highest local status | `READY_FOR_INDEPENDENT_REAUDIT` |

このpackageはRound 3 remediation後の非本番Sandbox再監査候補です。
Phase 8B GO/PASS、Phase 8C GO、実Provider接続、個人実業務パイロットを
宣言するものではありません。

## Apps Script payload

- Source of truth: `apps-script-v2/`
- Payload files: `{{PAYLOAD_COUNT}}`
- `.gs` files: `{{GS_COUNT}}`
- Manifest files: `1`
- Canonical payload-list SHA-256:
  `{{PAYLOAD_BUNDLE_SHA256}}`

Canonical payload-list hashは、path順に並べた
`<lowercase sha256><two spaces><relative path><LF>`の連結値に対するSHA-256です。

| Relative path | SHA-256 |
|---|---|
{{PAYLOAD_TABLE}}

## OAuth scopes

{{OAUTH_SCOPES}}

禁止境界:

- `script.external_request`なし
- Drive scopeなし
- mail-send scopeなし
- `mail.google.com`全体scopeなし
- Calendar全権限scopeなし

## Advanced Services

{{ADVANCED_SERVICES}}

## External boundaries

| Boundary | Status |
|---|---|
| Code implementation | `READY_FOR_INDEPENDENT_REAUDIT` |
| Mock HTTP Transport | `PASS_LOCAL` |
| Real Provider connection | `NOT EXECUTED` |
| Provider / model / endpoint / auth | `NOT CONFIRMED` |
| Company approval | `NOT CONFIRMED` |
| Credential storage approval | `NOT CONFIRMED` |
| Real Google Workspace | `NOT EXECUTED` |
| Real OAuth consent | `NOT EXECUTED` |
| Real Trigger / LockService contention | `NOT EXECUTED` |

## Package exclusions

このpackageに含めないもの:

- `.clasp.json`と実Script ID
- credential、API key、password、token、private key
- Node test、fixture、Archive、Codex prompt
- 実Spreadsheet / Gmail / Calendar ID
- Google Workspace内部URL
- 会社メール本文、添付、個人情報、未公表情報

`CHECKSUMS.sha256`は、このmanifest、Quickstart、Manual Acceptance Guide、
Apps Script payloadを含むpackage全file（`CHECKSUMS.sha256`自身を除く）の
hashをpath順で記録します。
