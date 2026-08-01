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
| Package prepared at | `2026-07-26T10:28:10+09:00` |
| Source commit | `NOT AVAILABLE - repository has no commits` |
| Source tree status | `Repository has no source commit; Git closeout NOT EXECUTED - Codex index write denied and Git identity not configured` |

このpackageはPhase 8Aで作成した非本番Sandbox受入用です。Phase 8Bの実Google
Workspace受入、Phase 8CのTEST_MODE=false受入、実Provider接続、個人実業務
パイロットは実施済みではありません。

## Apps Script payload

- Source of truth: `apps-script-v2/`
- Payload files: `23`
- `.gs` files: `22`
- Manifest files: `1`
- Canonical payload-list SHA-256:
  `8fc8084126ea09ecea79cf0fb7c5d297e0cb6859894576cb9656d72f787fe9fa`

Canonical payload-list hashは、path順に並べた
`<lowercase sha256><two spaces><relative path><LF>`の連結値に対するSHA-256です。

| Relative path | SHA-256 |
|---|---|
| `apps-script/00_Config.gs` | `69ed5198bea90b6bbdb521610aca7fb4ef6f5280947b3ce2118a9c55dd65b264` |
| `apps-script/01_TypesAndSchemas.gs` | `e356ff846f3828a2b32894fdd06c9b815168b6cd447623b78729eca98c76a31c` |
| `apps-script/02_Setup.gs` | `4ca19e5b8c820fc10be7a478227068679bbd0af8a2d820f497afd84d6060fb72` |
| `apps-script/03_SheetBuilder.gs` | `048c4ea36f582db3d228462a8af054152e6b8bd8048b85b4c63cd74e6d5cb39d` |
| `apps-script/04_MessageStateRepository.gs` | `c99a0d761613471f9a5b31d68824414b734a75ff33259beac0bdc812cd10ed77` |
| `apps-script/05_GmailGateway.gs` | `eccbf6e4b429abddbf56014942d02da03cfdc53fef4a908546a1618f777214ab` |
| `apps-script/06_EmailPreprocessor.gs` | `febba4f009201fdf880d39dc43f54c8ff3b9bc17790ce588aa9f9c9d60394657` |
| `apps-script/07_AiAdapter.gs` | `b0d096fa9ff5240ee8c2620daf44846b54266dd83a1d530f33560334616d239f` |
| `apps-script/08_TaskRepository.gs` | `9f2fe35f93746c129859c87344813863fad65b89d747d4dc70005a81fc5e246a` |
| `apps-script/09_TaskReviewPolicy.gs` | `581da414ef0202022bf47b4edc9754cc4ac4f59102bfc9001ec5ed4fa14058d3` |
| `apps-script/10_CalendarSync.gs` | `af36ddba6139eccfee74ce7ccbb8fbbfabf7d8db13f05efc04120dad2ddce83d` |
| `apps-script/11_EditHandler.gs` | `e66f33770ab5eae5bff7c2cfda20a7cf5388ef7064ee87b70ab5a9444dee1fa5` |
| `apps-script/12_Triggers.gs` | `de81b90d648740ceb302cc12d74f2d45af34a4e493d6441c3a512d2efce0f0d7` |
| `apps-script/13_LogAndDeadLetter.gs` | `a20554c19f4bed60dcf70072641e8279634bc8d36b88ab0d8473e3a66a43eb05` |
| `apps-script/14_Migrations.gs` | `469a8b8759030ab150f16b99911ea782eb103f77d6c392a2eac80cb96b6eaf98` |
| `apps-script/15_Dashboard.gs` | `7c0cf47202df859c259fc2f6f710e73e8e9d2a2f300bf16ca42b37f4536a2427` |
| `apps-script/16_Diagnostics.gs` | `96a1b5f15037cf2395ebefe1fec7336310a73a32330a0a0cd63416908af47414` |
| `apps-script/17_Utilities.gs` | `7a13a4e0699d5f28e8022c12a5fb34f1401657e76241eebeae2d8fd59b0906f7` |
| `apps-script/18_Worker.gs` | `69d5edd4819bc1adc2ba81741c1d07ff86baf32fc647c3faf36cd3ffec6f46b5` |
| `apps-script/19_RuntimeSettings.gs` | `106370ebf78c81266d061f690b3448902d40bf177f283d880fe3965ac6fc618f` |
| `apps-script/99_TestHarness.gs` | `2477d07ccdcf103055d3afedef3b9419c043ed77807419073126bbfda06cb958` |
| `apps-script/appsscript.json` | `7e81bb85d229b3d136a9b8c089371c68011c4a6299dff29cf45e99b65fac23c6` |
| `apps-script/Menu.gs` | `c6eb0638e4659d1b1c973dfb466600eab3e8ff3bf833275b82733e909b761a1e` |

## OAuth scopes

- `https://www.googleapis.com/auth/spreadsheets.currentonly`
- `https://www.googleapis.com/auth/script.container.ui`
- `https://www.googleapis.com/auth/script.scriptapp`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/calendar.app.created`
- `https://www.googleapis.com/auth/calendar.calendarlist.readonly`

禁止境界:

- `script.external_request`なし
- Drive scopeなし
- mail-send scopeなし
- `mail.google.com`全体scopeなし
- Calendar全権限scopeなし

## Advanced Services

- `Gmail`: service `gmail`, version `v1`
- `Calendar`: service `calendar`, version `v3`

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

このpackageに含めないもの:

- `.clasp.json`と実Script ID
- credential、API key、password、token、private key
- Node test、fixture、Archive、Codex prompt
- 実Spreadsheet / Gmail / Calendar ID
- Google Workspace内部URL
- 会社メール本文、添付、個人情報、未公表情報

`CHECKSUMS.sha256`は、このmanifest、Quickstart、Apps Script payloadを含む
package全file（`CHECKSUMS.sha256`自身を除く）のhashをpath順で記録します。
