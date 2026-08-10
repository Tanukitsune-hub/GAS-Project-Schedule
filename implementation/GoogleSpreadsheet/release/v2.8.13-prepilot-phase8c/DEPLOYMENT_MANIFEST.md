# Google Workspace Personal Work OS v2
# Phase 8C Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Package | `v2.8.13-prepilot-phase8c` |
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Source commit | `57205299ccedb87b521e9cddfc2481d2cb0baf7c` |
| Release content commit | `SELF (the Git commit containing this manifest)` |
| Code Version | `2.8.13-prepilot` |
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
| Package prepared at | `2026-08-10T09:43:01Z` |
| Highest local status | `READY_FOR_CONTROLLED_SANDBOX_VALIDATION` |

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
- Canonical payload-list SHA-256: `992161875057dba3523354a0583c675afdf3416e8b1c93d96d5a78ff34485a8a`
- `99_TestHarness.gs`: `EXCLUDED`
- `.clasp.json`: `EXCLUDED`

| Relative path | SHA-256 |
|---|---|
| `apps-script/00_Config.gs` | `aeeb1b43590f95964306cfdc18c90ec7ce91341d4bf3f58df45f0a13a11cc91c` |
| `apps-script/01_TypesAndSchemas.gs` | `1096aa80cd95fc4f4215072cdcdf88a059e1e36ce4c48c6521dfad9b6cf0f250` |
| `apps-script/02_Setup.gs` | `e2b5bcc42e54e3413fe8b11ce19ac805c0736c170d050c320ba5e9c37cb9dbba` |
| `apps-script/03_SheetBuilder.gs` | `de99de32edb15b90a437788446bdb05a86a13e76853fa1a73347e0ae55fccbf6` |
| `apps-script/04_MessageStateRepository.gs` | `c99a0d761613471f9a5b31d68824414b734a75ff33259beac0bdc812cd10ed77` |
| `apps-script/05_GmailGateway.gs` | `97b59ff951140d86b9c1863cf7f095cd611891c57345494a319e63a44c0fac00` |
| `apps-script/06_EmailPreprocessor.gs` | `febba4f009201fdf880d39dc43f54c8ff3b9bc17790ce588aa9f9c9d60394657` |
| `apps-script/07_AiAdapter.gs` | `6a3b9fb5e504e8cfbffcee5dc786b13b511fbab63cef4d7281210bc07bb0243b` |
| `apps-script/08_TaskRepository.gs` | `4eb1e9c98e123e714207ddd8e7d3d9b8a9e2f690729eb0ec318c0e3973fbd17a` |
| `apps-script/09_TaskReviewPolicy.gs` | `c48000619bd5b7ff085dfcaa2df087fa91c6c69b58789d81b8a9d9a3a133f6b3` |
| `apps-script/10_CalendarSync.gs` | `7ec0be9c1a18f99913dcab3f657fe737f6f2e6321a5661bd3c46e43f15232975` |
| `apps-script/11_EditHandler.gs` | `244b8424f8ffce15f436721484aeffa7b890d086926bd6530ce934b0e94f2297` |
| `apps-script/12_Triggers.gs` | `de81b90d648740ceb302cc12d74f2d45af34a4e493d6441c3a512d2efce0f0d7` |
| `apps-script/13_LogAndDeadLetter.gs` | `84df90d249e8f215ffceda6301b1bd362637f72a2812154618990c4f5c058f67` |
| `apps-script/14_Migrations.gs` | `4d93d8b336893a8d71392fbe7b5cf8222925d44cdd854b5b6df86e2ceea3e568` |
| `apps-script/15_Dashboard.gs` | `c18be435239c3468493971baab82fe746de4210f7513b1677eadff3b00405353` |
| `apps-script/16_Diagnostics.gs` | `b69eff8cc567969bf2fa00b6347009b7fdb0b38e06aa867684e8a7666c000c8c` |
| `apps-script/17_Utilities.gs` | `494ad83b1b841ea7e05e1721e22780add2c439ea41473eda4dc521fc428407f6` |
| `apps-script/18_Worker.gs` | `8d3529d9af8bc9f16a816a17f533cef26300809225c2ac68091a8ef9ca6f3e29` |
| `apps-script/19_RuntimeSettings.gs` | `106370ebf78c81266d061f690b3448902d40bf177f283d880fe3965ac6fc618f` |
| `apps-script/appsscript.json` | `7e81bb85d229b3d136a9b8c089371c68011c4a6299dff29cf45e99b65fac23c6` |
| `apps-script/Menu.gs` | `d96d7b9ba6a35cd1a9d0309fb0375699e1b1f89fbd851da86b26e680cbb59c15` |

## Boundaries

- No real Provider request was executed.
- No real Google Workspace acceptance was executed.
- No credential, API key, password, token, real Workspace ID, or internal URL
  is included.
- OAuth scopes and Advanced Services are unchanged from the reviewed source
  `appsscript.json`.