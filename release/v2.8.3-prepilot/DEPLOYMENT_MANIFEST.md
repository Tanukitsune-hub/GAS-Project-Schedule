# Google Workspace Personal Work OS v2
# Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Code Version | `2.8.3-prepilot` |
| Schema Version | `2.4` |
| AI Schema Version | `2.0` |
| Migration Version | `1` |
| TEST_MODE | `true` |
| Automation default | `OFF` |
| Package prepared at | `2026-07-27T11:53:10+09:00` |
| Source commit | `NOT AVAILABLE - repository has no commits` |
| Source tree status | `Repository has no source commit; Git closeout NOT EXECUTED - Codex index write denied and Git identity not configured` |

このpackageはコード監査Finding修正後のPhase 8B非本番Sandbox受入用です。
Phase 8Bの実Google Workspace受入、Phase 8CのTEST_MODE=false受入、
実Provider接続、個人実業務パイロットは実施済みではありません。

## Apps Script payload

- Source of truth: `apps-script-v2/`
- Payload files: `23`
- `.gs` files: `22`
- Manifest files: `1`
- Canonical payload-list SHA-256:
  `423d4f6937c21909c1f88c6e81e264887611782aae98c3b6d3b2668443937f7a`

Canonical payload-list hashは、path順に並べた
`<lowercase sha256><two spaces><relative path><LF>`の連結値に対するSHA-256です。

| Relative path | SHA-256 |
|---|---|
| `apps-script/00_Config.gs` | `e30b7af1877acdeebcbd5a2ce6b16db7020bd5824618b9ef3537bac0349397d7` |
| `apps-script/01_TypesAndSchemas.gs` | `cd1e5c7297669ea3ca0d595c7e779348abbd4e0bd121e38975e926cabfabc241` |
| `apps-script/02_Setup.gs` | `cca4d936b822a4b9da4070f259a062d4037f2f21ad1c066513c3e15283803745` |
| `apps-script/03_SheetBuilder.gs` | `ddca261e1492cd2ff4593b4de9ff407ba37050bd9e24ff58a944b4041be62769` |
| `apps-script/04_MessageStateRepository.gs` | `c99a0d761613471f9a5b31d68824414b734a75ff33259beac0bdc812cd10ed77` |
| `apps-script/05_GmailGateway.gs` | `65d94a6818e604f2dddf02ce7c9922a4db00a8d7961e5c0403dec403547e2ac4` |
| `apps-script/06_EmailPreprocessor.gs` | `febba4f009201fdf880d39dc43f54c8ff3b9bc17790ce588aa9f9c9d60394657` |
| `apps-script/07_AiAdapter.gs` | `6a3b9fb5e504e8cfbffcee5dc786b13b511fbab63cef4d7281210bc07bb0243b` |
| `apps-script/08_TaskRepository.gs` | `a9eac90116061a3524593a5824c063df5909b51a928e18db3e2f6de51871ad4f` |
| `apps-script/09_TaskReviewPolicy.gs` | `c48000619bd5b7ff085dfcaa2df087fa91c6c69b58789d81b8a9d9a3a133f6b3` |
| `apps-script/10_CalendarSync.gs` | `830f25e72146cc2ca56f45a6780957b14d3920c4b0104b6ae2e48d2da47f1b04` |
| `apps-script/11_EditHandler.gs` | `7a3ab9525323de9936516842dfd060ab156fddec7cb586691ac69a578a48458c` |
| `apps-script/12_Triggers.gs` | `de81b90d648740ceb302cc12d74f2d45af34a4e493d6441c3a512d2efce0f0d7` |
| `apps-script/13_LogAndDeadLetter.gs` | `84df90d249e8f215ffceda6301b1bd362637f72a2812154618990c4f5c058f67` |
| `apps-script/14_Migrations.gs` | `945e58304aaab020e9d1d0e68168a33dee65e1e4421eb606f70e3afed1668b69` |
| `apps-script/15_Dashboard.gs` | `48729ccf04a9f443e92b5dc96218ae05a23e512e1e5de050b1ab5799f0a78012` |
| `apps-script/16_Diagnostics.gs` | `6bebbd77b05bad582d370edceb64bd66e66445c8cab364d030000be923d1d085` |
| `apps-script/17_Utilities.gs` | `49ee456bf5e412e704f917cdff1d9e96ade7ca42c33abf3f55554b104a1e5fbc` |
| `apps-script/18_Worker.gs` | `fe880ade5a02e88a5d709ed514faf8fa0cf115f6c15121bae4552021bfee32d4` |
| `apps-script/19_RuntimeSettings.gs` | `106370ebf78c81266d061f690b3448902d40bf177f283d880fe3965ac6fc618f` |
| `apps-script/99_TestHarness.gs` | `8d7c2f7a6057f992560c2a68d46194216f2c02427e41b5215a476e0e9c183873` |
| `apps-script/appsscript.json` | `7e81bb85d229b3d136a9b8c089371c68011c4a6299dff29cf45e99b65fac23c6` |
| `apps-script/Menu.gs` | `96ef33a26ae012f35f2d38291f42b6755b4947272ec2fde1e17ca4319e1810d9` |

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
