# Google Workspace Personal Work OS v2
# Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Source commit | `a7f66eb4ca5ef71dab6faaaa595964c7af73326e` |
| Release content commit | `SELF (the Git commit containing this manifest)` |
| Code Version | `2.8.4-prepilot` |
| Schema Version | `2.5` |
| AI Schema Version | `2.0` |
| Migration Version | `2` |
| TEST_MODE | `true` |
| Automation default | `OFF` |
| Package prepared at | `2026-07-27T22:49:55+09:00` |
| Highest local status | `READY_FOR_INDEPENDENT_REAUDIT` |

このpackageはRound 3 remediation後の非本番Sandbox再監査候補です。
Phase 8B GO/PASS、Phase 8C GO、実Provider接続、個人実業務パイロットを
宣言するものではありません。

## Apps Script payload

- Source of truth: `apps-script-v2/`
- Payload files: `23`
- `.gs` files: `22`
- Manifest files: `1`
- Canonical payload-list SHA-256:
  `3497a2de0afdcf69ba8e4d816dadf0945ce0eaa14f3c4020bacb9d42e229b96b`

Canonical payload-list hashは、path順に並べた
`<lowercase sha256><two spaces><relative path><LF>`の連結値に対するSHA-256です。

| Relative path | SHA-256 |
|---|---|
| `apps-script/00_Config.gs` | `8a4e2e343a77a5e3c872f6972348a08a1ec154a38caa17dc53e91679e4bd74f1` |
| `apps-script/01_TypesAndSchemas.gs` | `d32f09da25127da924ee65d12ef322ed239b05adf37a96d64f0e88074429c2c1` |
| `apps-script/02_Setup.gs` | `8f6a9152a68a8396914e0c6209efc9505881ec6bff6af73cf35f8ef9aac845d8` |
| `apps-script/03_SheetBuilder.gs` | `ddca261e1492cd2ff4593b4de9ff407ba37050bd9e24ff58a944b4041be62769` |
| `apps-script/04_MessageStateRepository.gs` | `c99a0d761613471f9a5b31d68824414b734a75ff33259beac0bdc812cd10ed77` |
| `apps-script/05_GmailGateway.gs` | `1c017565a20a86a7ea946126f325c83c69a67ae20c4c01a49723166b8d6dcb7c` |
| `apps-script/06_EmailPreprocessor.gs` | `febba4f009201fdf880d39dc43f54c8ff3b9bc17790ce588aa9f9c9d60394657` |
| `apps-script/07_AiAdapter.gs` | `6a3b9fb5e504e8cfbffcee5dc786b13b511fbab63cef4d7281210bc07bb0243b` |
| `apps-script/08_TaskRepository.gs` | `b145fb82b726a6f39283f850effd5e4942372b67071dad18cb69a86c1fc82d14` |
| `apps-script/09_TaskReviewPolicy.gs` | `c48000619bd5b7ff085dfcaa2df087fa91c6c69b58789d81b8a9d9a3a133f6b3` |
| `apps-script/10_CalendarSync.gs` | `830f25e72146cc2ca56f45a6780957b14d3920c4b0104b6ae2e48d2da47f1b04` |
| `apps-script/11_EditHandler.gs` | `196f968dd76dc5ee32141ef29486e660cec8aa193099d54ab6c70c5b621b4be5` |
| `apps-script/12_Triggers.gs` | `de81b90d648740ceb302cc12d74f2d45af34a4e493d6441c3a512d2efce0f0d7` |
| `apps-script/13_LogAndDeadLetter.gs` | `84df90d249e8f215ffceda6301b1bd362637f72a2812154618990c4f5c058f67` |
| `apps-script/14_Migrations.gs` | `d878c24c1b7874582939d5d005c9b0ab33bb2e57c51a69dce452e00284abafb6` |
| `apps-script/15_Dashboard.gs` | `48729ccf04a9f443e92b5dc96218ae05a23e512e1e5de050b1ab5799f0a78012` |
| `apps-script/16_Diagnostics.gs` | `6bebbd77b05bad582d370edceb64bd66e66445c8cab364d030000be923d1d085` |
| `apps-script/17_Utilities.gs` | `49ee456bf5e412e704f917cdff1d9e96ade7ca42c33abf3f55554b104a1e5fbc` |
| `apps-script/18_Worker.gs` | `95d6daae5f76ce1037a702d182d955acd6b3d2e31abdcf03c6d2ce054d7bdef6` |
| `apps-script/19_RuntimeSettings.gs` | `106370ebf78c81266d061f690b3448902d40bf177f283d880fe3965ac6fc618f` |
| `apps-script/99_TestHarness.gs` | `8d7c2f7a6057f992560c2a68d46194216f2c02427e41b5215a476e0e9c183873` |
| `apps-script/appsscript.json` | `7e81bb85d229b3d136a9b8c089371c68011c4a6299dff29cf45e99b65fac23c6` |
| `apps-script/Menu.gs` | `77e4141eb834276c475f1a4f76ab0d6cef4d49410464f2b6ad86be3303ccdaed` |

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
