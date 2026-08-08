# Google Workspace Personal Work OS v2
# Phase 8C Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Package | `v2.8.12-prepilot-phase8c` |
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Source commit | `66d2bdfcd3c2fd3ff8aa7811951e08e3306ed6b7` |
| Release content commit | `SELF (the Git commit containing this manifest)` |
| Code Version | `2.8.12-prepilot` |
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
| Package prepared at | `2026-08-08T00:00:00Z` |
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
- Canonical payload-list SHA-256: `2e48961f3755877d301c5396e6ec4c4d4bfbefeae203ca47a4e9265fc81c68fc`
- `99_TestHarness.gs`: `EXCLUDED`
- `.clasp.json`: `EXCLUDED`

| Relative path | SHA-256 |
|---|---|
| `apps-script/00_Config.gs` | `7f3ebf72fb833e1154ea9f04f1304872461e514e36dc345f783eb7af96a16751` |
| `apps-script/01_TypesAndSchemas.gs` | `a6fbab4ca3147b8ac618378c26ba6efc5a88b6bb4349686ca30b2b157c354825` |
| `apps-script/02_Setup.gs` | `a8fd0d1c4a8a620478bed577154ae1d5a417bef45f3bd91e4576a1b3b6c8240a` |
| `apps-script/03_SheetBuilder.gs` | `9dad313d9734add92de1c45847e07ed0c134151e536e7d2c9adfe5b2ea3d69d7` |
| `apps-script/04_MessageStateRepository.gs` | `1dde8a5b5b149ed967c1b4fbb9abfdadeffafdcaa97bbab890e2011dc883c91d` |
| `apps-script/05_GmailGateway.gs` | `d8eee9e146f179362d3fcfec1b841d5c66c71ae6a7e298d944e1b4c2d766f466` |
| `apps-script/06_EmailPreprocessor.gs` | `4ef4ccf034492082450ba6e47720e4c0710e0b7ad7ca80fec6b45aa55d13c3a9` |
| `apps-script/07_AiAdapter.gs` | `109b16aff5c9a9f86bc5f27c2d095a31ed2f8d1e4b53dc1051845d183fa7ec73` |
| `apps-script/08_TaskRepository.gs` | `f71952902641830546b221ef1e3a0665e5a8a71e960426a9b4b2b0d4424746e7` |
| `apps-script/09_TaskReviewPolicy.gs` | `a741b92bf7c0758c6d248fc4a548ff66dc7bf00716c128d7d45cf9385088b625` |
| `apps-script/10_CalendarSync.gs` | `a2272affd36302a8fa0fbd87b8242061821320499c026f964e7fc70252cbc898` |
| `apps-script/11_EditHandler.gs` | `7529eed36fc47646fd502664fcd750e004c557be69c5be7fb2fccdc417371846` |
| `apps-script/12_Triggers.gs` | `0721ea92c4685a1ccb095eeab6756b8a67f712bb6436642f928100c10c13a26c` |
| `apps-script/13_LogAndDeadLetter.gs` | `eb2585da6433707ad0336337aafc93c80996439b41ce22db6b72919411e5ebb0` |
| `apps-script/14_Migrations.gs` | `4611bed996a6a9fe1f968f2d3d987ddb5ba73bf3f7e4b06aa2b197c1eaa4c12c` |
| `apps-script/15_Dashboard.gs` | `e41e8d15564f1d78880ffa382536d99f9b7d4008eed84abb2d6cef9bffd2f0fc` |
| `apps-script/16_Diagnostics.gs` | `cd2948883a0ad3aef1218fd18be3cfa7ab82da12f53056f53a9229cc36590cd6` |
| `apps-script/17_Utilities.gs` | `ee578a58ebecad587455399ee11552cb5adc1b8e5650ff8e5472d3155c70063e` |
| `apps-script/18_Worker.gs` | `80587b3332b3394bd2cafd855a9de19dce4e414a4ef75ff9b75ea620159a4ade` |
| `apps-script/19_RuntimeSettings.gs` | `36409d7873d47e983e005e2f749e31329396c25a8935203f30003ce720b568dc` |
| `apps-script/appsscript.json` | `c2e79aef7a95caec20b92c0e66479812a2862034121fba4ed3e1008fbda81658` |
| `apps-script/Menu.gs` | `ac84bf6f2b4e1f338d7daba34288afaed51b95ddb0bb41ef30d14f59d6b78817` |

## Boundaries

- No real Provider request was executed.
- No real Google Workspace acceptance was executed.
- No credential, API key, password, token, real Workspace ID, or internal URL
  is included.
- OAuth scopes and Advanced Services are unchanged from the reviewed source
  `appsscript.json`.