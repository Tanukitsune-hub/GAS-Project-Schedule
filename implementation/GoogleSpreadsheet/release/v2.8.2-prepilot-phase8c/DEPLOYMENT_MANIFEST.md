# Google Workspace Personal Work OS v2
# Phase 8C Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Package | `v2.8.2-prepilot-phase8c` |
| Code Version | `2.8.2-prepilot` |
| Schema Version | `2.3` |
| AI Schema Version | `2.0` |
| Migration Version | `0` |
| TEST_MODE | `false` |
| Automation default | `OFF` |
| Package prepared at | `2026-07-26T23:39:19+09:00` |
| Source commit | `NOT AVAILABLE - repository has no commits` |
| Source tree status | `Unborn master with pre-existing and remediation working-tree changes; no commit created` |

This payload is distinct from the Phase 8B package. It excludes
`99_TestHarness.gs` and applies exactly one audited source transformation:
`00_Config.gs` changes `TEST_MODE: true` to `TEST_MODE: false`.
All other payload files are byte-identical to `apps-script-v2/`.

Phase 8C remains `NO-GO` until real Provider configuration, company/data/
credential-storage approval, OAuth, and real Google Workspace acceptance are
completed. An unconfigured Provider fails closed.

## Payload

- Payload files: `22`
- `.gs` files: `21`
- Canonical payload-list SHA-256: `9b87abaa00c367f0cf56cdac6f1c16f5b678877612714fc81d1dea4da5255e5c`
- `99_TestHarness.gs`: `EXCLUDED`
- `.clasp.json`: `EXCLUDED`

| Relative path | SHA-256 |
|---|---|
| `apps-script/00_Config.gs` | `70b0e43c2bc9ab4900a9048eb0b2d903f17258c963119da0694d199002efb982` |
| `apps-script/01_TypesAndSchemas.gs` | `8141469b761da87b1f52c20467e664939542fd5a9e6af6058d99ff3ab644513e` |
| `apps-script/02_Setup.gs` | `4ca19e5b8c820fc10be7a478227068679bbd0af8a2d820f497afd84d6060fb72` |
| `apps-script/03_SheetBuilder.gs` | `bb29f1b8dccc93e5c1a2742e524f6f6f23cc0eef8476186c1380372854cc1f84` |
| `apps-script/04_MessageStateRepository.gs` | `c99a0d761613471f9a5b31d68824414b734a75ff33259beac0bdc812cd10ed77` |
| `apps-script/05_GmailGateway.gs` | `fa692e5194ec69d50aaea6252867796c89c433b7cb6d166c08c1c0d1211bd49f` |
| `apps-script/06_EmailPreprocessor.gs` | `febba4f009201fdf880d39dc43f54c8ff3b9bc17790ce588aa9f9c9d60394657` |
| `apps-script/07_AiAdapter.gs` | `6a3b9fb5e504e8cfbffcee5dc786b13b511fbab63cef4d7281210bc07bb0243b` |
| `apps-script/08_TaskRepository.gs` | `8c4ce2687dec2ace358c63fefd625d08883c12a980bf8aba8d74684deff378b1` |
| `apps-script/09_TaskReviewPolicy.gs` | `c48000619bd5b7ff085dfcaa2df087fa91c6c69b58789d81b8a9d9a3a133f6b3` |
| `apps-script/10_CalendarSync.gs` | `830f25e72146cc2ca56f45a6780957b14d3920c4b0104b6ae2e48d2da47f1b04` |
| `apps-script/11_EditHandler.gs` | `e6eb955e1eaba63a173f73255f27bf8cb63ea5743e9b4786abeafc38f3c38e34` |
| `apps-script/12_Triggers.gs` | `de81b90d648740ceb302cc12d74f2d45af34a4e493d6441c3a512d2efce0f0d7` |
| `apps-script/13_LogAndDeadLetter.gs` | `fe8dbf6f5c41efb984de456d37122c42d99855a8d0aee700a3b1aa638db21d91` |
| `apps-script/14_Migrations.gs` | `d9186a9d041d8cbc4df048364bd5551f60f1c15be4bdb27328cd408345f34b87` |
| `apps-script/15_Dashboard.gs` | `48729ccf04a9f443e92b5dc96218ae05a23e512e1e5de050b1ab5799f0a78012` |
| `apps-script/16_Diagnostics.gs` | `6bebbd77b05bad582d370edceb64bd66e66445c8cab364d030000be923d1d085` |
| `apps-script/17_Utilities.gs` | `49ee456bf5e412e704f917cdff1d9e96ade7ca42c33abf3f55554b104a1e5fbc` |
| `apps-script/18_Worker.gs` | `c0496325456a6d43c623f5e177f89eaf71ede9caf61309615b5d26346bf64bde` |
| `apps-script/19_RuntimeSettings.gs` | `106370ebf78c81266d061f690b3448902d40bf177f283d880fe3965ac6fc618f` |
| `apps-script/appsscript.json` | `7e81bb85d229b3d136a9b8c089371c68011c4a6299dff29cf45e99b65fac23c6` |
| `apps-script/Menu.gs` | `96ef33a26ae012f35f2d38291f42b6755b4947272ec2fde1e17ca4319e1810d9` |

## Boundaries

- No real Provider request was executed.
- No real Google Workspace acceptance was executed.
- No credential, API key, password, token, real Workspace ID, or internal URL
  is included.
- OAuth scopes and Advanced Services are unchanged from the reviewed source
  `appsscript.json`.
