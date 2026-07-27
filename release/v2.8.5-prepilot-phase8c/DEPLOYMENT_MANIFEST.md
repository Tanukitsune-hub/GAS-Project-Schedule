# Google Workspace Personal Work OS v2
# Phase 8C Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Package | `v2.8.5-prepilot-phase8c` |
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Source commit | `9705def085b66b5e521c7ec93804c228eb60e7ba` |
| Release content commit | `SELF (the Git commit containing this manifest)` |
| Code Version | `2.8.5-prepilot` |
| Schema Version | `2.6` |
| AI Schema Version | `2.0` |
| Migration Version | `3` |
| Task canonical columns | `50` |
| Authority store | `protected hidden Task Authority Ledger` |
| Authority ledger columns | `21` |
| Authority protocol | `versioned two-slot PREPARED/COMMITTED` |
| Snapshot-cell fallback | `FORBIDDEN` |
| TEST_MODE | `false` |
| Automation default | `OFF` |
| Package prepared at | `2026-07-28T07:32:00+09:00` |
| Highest local status | `READY_FOR_INDEPENDENT_REAUDIT` |

This payload is distinct from the Phase 8B package. It excludes
`99_TestHarness.gs` and applies exactly one audited source transformation:
`00_Config.gs` changes `TEST_MODE: true` to `TEST_MODE: false`.
All other payload files are byte-identical to `apps-script-v2/`.

The Task authority architecture remains a protected hidden, versioned two-slot
ledger. A missing or invalid ledger authority is quarantined; the visible
`authoritative_snapshot_json` cell is never a fallback trust source.

This package is only a Phase 8C candidate artifact. Phase 8C GO is not declared.
Real Provider configuration, company/data/credential-storage approval, OAuth,
and real Google Workspace acceptance remain unexecuted. An unconfigured
Provider fails closed.

## Payload

- Payload files: `22`
- `.gs` files: `21`
- Canonical payload-list SHA-256: `6d5d12091655704366a7bd3586dea1f1274a24f5837de179a306969072f78fcc`
- `99_TestHarness.gs`: `EXCLUDED`
- `.clasp.json`: `EXCLUDED`

| Relative path | SHA-256 |
|---|---|
| `apps-script/00_Config.gs` | `1bb0a54d898249f774a727c0b330503a528933bceb251841511525aa98a527da` |
| `apps-script/01_TypesAndSchemas.gs` | `8f54c1ab4b6b9b43d9db5c8fe2126ae6c4bad3380c717f92b326ee97c24f4414` |
| `apps-script/02_Setup.gs` | `843dc713b162bcb4a25ca2a71eca065935d350f0f5c01c7f780f0483107a73db` |
| `apps-script/03_SheetBuilder.gs` | `f596b1965cf9bc75e3a386222bdb071e0daac652f81ed83db90776627d77f96d` |
| `apps-script/04_MessageStateRepository.gs` | `c99a0d761613471f9a5b31d68824414b734a75ff33259beac0bdc812cd10ed77` |
| `apps-script/05_GmailGateway.gs` | `1c017565a20a86a7ea946126f325c83c69a67ae20c4c01a49723166b8d6dcb7c` |
| `apps-script/06_EmailPreprocessor.gs` | `febba4f009201fdf880d39dc43f54c8ff3b9bc17790ce588aa9f9c9d60394657` |
| `apps-script/07_AiAdapter.gs` | `6a3b9fb5e504e8cfbffcee5dc786b13b511fbab63cef4d7281210bc07bb0243b` |
| `apps-script/08_TaskRepository.gs` | `c5cb1b0f7b26e0c668412d489161ad9ac104c3d7feeadf931e35daa075b19dc2` |
| `apps-script/09_TaskReviewPolicy.gs` | `c48000619bd5b7ff085dfcaa2df087fa91c6c69b58789d81b8a9d9a3a133f6b3` |
| `apps-script/10_CalendarSync.gs` | `1cabe999cf28c0bdcaa4acb7348afda64ca24d93a0b060cf5d163aa8806806e0` |
| `apps-script/11_EditHandler.gs` | `244b8424f8ffce15f436721484aeffa7b890d086926bd6530ce934b0e94f2297` |
| `apps-script/12_Triggers.gs` | `de81b90d648740ceb302cc12d74f2d45af34a4e493d6441c3a512d2efce0f0d7` |
| `apps-script/13_LogAndDeadLetter.gs` | `84df90d249e8f215ffceda6301b1bd362637f72a2812154618990c4f5c058f67` |
| `apps-script/14_Migrations.gs` | `b90a381db9160a6028f7ec098ac20fd1867aaf0bea92c1f1ee71d9090747f994` |
| `apps-script/15_Dashboard.gs` | `48729ccf04a9f443e92b5dc96218ae05a23e512e1e5de050b1ab5799f0a78012` |
| `apps-script/16_Diagnostics.gs` | `afb7eba5b91339b027695d5d3c4bf4122226ffb7b37850c3884da54eed110799` |
| `apps-script/17_Utilities.gs` | `49ee456bf5e412e704f917cdff1d9e96ade7ca42c33abf3f55554b104a1e5fbc` |
| `apps-script/18_Worker.gs` | `8d3529d9af8bc9f16a816a17f533cef26300809225c2ac68091a8ef9ca6f3e29` |
| `apps-script/19_RuntimeSettings.gs` | `106370ebf78c81266d061f690b3448902d40bf177f283d880fe3965ac6fc618f` |
| `apps-script/appsscript.json` | `7e81bb85d229b3d136a9b8c089371c68011c4a6299dff29cf45e99b65fac23c6` |
| `apps-script/Menu.gs` | `77e4141eb834276c475f1a4f76ab0d6cef4d49410464f2b6ad86be3303ccdaed` |

## Boundaries

- No real Provider request was executed.
- No real Google Workspace acceptance was executed.
- No credential, API key, password, token, real Workspace ID, or internal URL
  is included.
- OAuth scopes and Advanced Services are unchanged from the reviewed source
  `appsscript.json`.