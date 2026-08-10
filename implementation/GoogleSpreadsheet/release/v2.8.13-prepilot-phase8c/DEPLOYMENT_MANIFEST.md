# Google Workspace Personal Work OS v2
# Phase 8C Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Package | `v2.8.13-prepilot-phase8c` |
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Source commit | `152f7ae5b30b7763129c61dad4b317546c193b29` |
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
| Package prepared at | `2026-08-10T09:38:33Z` |
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
- Canonical payload-list SHA-256: `b0a78718a760d4690879e7155607522a0f38359ec5b3fcd12c92d0acd8db9aed`
- `99_TestHarness.gs`: `EXCLUDED`
- `.clasp.json`: `EXCLUDED`

| Relative path | SHA-256 |
|---|---|
| `apps-script/00_Config.gs` | `aeeb1b43590f95964306cfdc18c90ec7ce91341d4bf3f58df45f0a13a11cc91c` |
| `apps-script/01_TypesAndSchemas.gs` | `1096aa80cd95fc4f4215072cdcdf88a059e1e36ce4c48c6521dfad9b6cf0f250` |
| `apps-script/02_Setup.gs` | `e2b5bcc42e54e3413fe8b11ce19ac805c0736c170d050c320ba5e9c37cb9dbba` |
| `apps-script/03_SheetBuilder.gs` | `de99de32edb15b90a437788446bdb05a86a13e76853fa1a73347e0ae55fccbf6` |
| `apps-script/04_MessageStateRepository.gs` | `1dde8a5b5b149ed967c1b4fbb9abfdadeffafdcaa97bbab890e2011dc883c91d` |
| `apps-script/05_GmailGateway.gs` | `b0925f153a82c24c09cfaf148594874638b6203243499ed4b7ba36c344e893aa` |
| `apps-script/06_EmailPreprocessor.gs` | `4ef4ccf034492082450ba6e47720e4c0710e0b7ad7ca80fec6b45aa55d13c3a9` |
| `apps-script/07_AiAdapter.gs` | `109b16aff5c9a9f86bc5f27c2d095a31ed2f8d1e4b53dc1051845d183fa7ec73` |
| `apps-script/08_TaskRepository.gs` | `4eb1e9c98e123e714207ddd8e7d3d9b8a9e2f690729eb0ec318c0e3973fbd17a` |
| `apps-script/09_TaskReviewPolicy.gs` | `a741b92bf7c0758c6d248fc4a548ff66dc7bf00716c128d7d45cf9385088b625` |
| `apps-script/10_CalendarSync.gs` | `7ec0be9c1a18f99913dcab3f657fe737f6f2e6321a5661bd3c46e43f15232975` |
| `apps-script/11_EditHandler.gs` | `244b8424f8ffce15f436721484aeffa7b890d086926bd6530ce934b0e94f2297` |
| `apps-script/12_Triggers.gs` | `0721ea92c4685a1ccb095eeab6756b8a67f712bb6436642f928100c10c13a26c` |
| `apps-script/13_LogAndDeadLetter.gs` | `eb2585da6433707ad0336337aafc93c80996439b41ce22db6b72919411e5ebb0` |
| `apps-script/14_Migrations.gs` | `4d93d8b336893a8d71392fbe7b5cf8222925d44cdd854b5b6df86e2ceea3e568` |
| `apps-script/15_Dashboard.gs` | `c18be435239c3468493971baab82fe746de4210f7513b1677eadff3b00405353` |
| `apps-script/16_Diagnostics.gs` | `b69eff8cc567969bf2fa00b6347009b7fdb0b38e06aa867684e8a7666c000c8c` |
| `apps-script/17_Utilities.gs` | `494ad83b1b841ea7e05e1721e22780add2c439ea41473eda4dc521fc428407f6` |
| `apps-script/18_Worker.gs` | `8d3529d9af8bc9f16a816a17f533cef26300809225c2ac68091a8ef9ca6f3e29` |
| `apps-script/19_RuntimeSettings.gs` | `36409d7873d47e983e005e2f749e31329396c25a8935203f30003ce720b568dc` |
| `apps-script/appsscript.json` | `c2e79aef7a95caec20b92c0e66479812a2862034121fba4ed3e1008fbda81658` |
| `apps-script/Menu.gs` | `d96d7b9ba6a35cd1a9d0309fb0375699e1b1f89fbd851da86b26e680cbb59c15` |

## Boundaries

- No real Provider request was executed.
- No real Google Workspace acceptance was executed.
- No credential, API key, password, token, real Workspace ID, or internal URL
  is included.
- OAuth scopes and Advanced Services are unchanged from the reviewed source
  `appsscript.json`.