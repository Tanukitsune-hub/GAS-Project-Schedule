# Google Workspace Personal Work OS v2
# Phase 8C Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Package | `v2.8.3-prepilot-phase8c` |
| Code Version | `2.8.3-prepilot` |
| Schema Version | `2.4` |
| AI Schema Version | `2.0` |
| Migration Version | `1` |
| TEST_MODE | `false` |
| Automation default | `OFF` |
| Package prepared at | `2026-07-27T11:53:10+09:00` |
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
- Canonical payload-list SHA-256: `5bbd3bc12c11b2463279352105cd97a0fe788b69055fd75a0b15f1b689c87e56`
- `99_TestHarness.gs`: `EXCLUDED`
- `.clasp.json`: `EXCLUDED`

| Relative path | SHA-256 |
|---|---|
| `apps-script/00_Config.gs` | `b77c1edb0b5492388fceb7b5f148c2d4bd51299f52ab14f36b75c40a4454ddb1` |
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
| `apps-script/appsscript.json` | `7e81bb85d229b3d136a9b8c089371c68011c4a6299dff29cf45e99b65fac23c6` |
| `apps-script/Menu.gs` | `96ef33a26ae012f35f2d38291f42b6755b4947272ec2fde1e17ca4319e1810d9` |

## Boundaries

- No real Provider request was executed.
- No real Google Workspace acceptance was executed.
- No credential, API key, password, token, real Workspace ID, or internal URL
  is included.
- OAuth scopes and Advanced Services are unchanged from the reviewed source
  `appsscript.json`.