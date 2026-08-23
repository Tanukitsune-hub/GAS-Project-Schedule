# Google Workspace Personal Work OS v2
# Phase 8C Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Package | `v2.8.22-prepilot-phase8c` |
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Source commit | `d4eae96be7c7d9a1976f86ab51db36dc4e41acdb` |
| Release content commit | `SELF (the Git commit containing this manifest)` |
| Code Version | `2.8.22-prepilot` |
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
| Package prepared at | `2026-08-23T00:00:00Z` |
| Highest local status | `READY_FOR_USER_PERSONAL_SHADOW_PILOT` |

This payload is distinct from the Phase 8B package. It excludes
`99_TestHarness.gs` and applies exactly one audited source transformation:
`00_Config.gs` changes only the TEST_MODE and approved production-runtime
configuration flags required for the label-gated Personal Shadow Pilot boundary.
All other payload files are byte-identical to `apps-script-v2/`.

The Task authority architecture remains a protected hidden, versioned two-slot
ledger. A missing or invalid ledger authority is quarantined; the visible
`authoritative_snapshot_json` cell is never a fallback trust source.

This package is only a Phase 8C candidate artifact. Phase 8C GO is not declared.
Real Provider credential values, OAuth, and real Google Workspace acceptance
remain unexecuted. An unconfigured
Provider fails closed.

## Payload

- Payload files: `23`
- `.gs` files: `22`
- Canonical payload-list SHA-256: `038d9bfb5f767778a79f8c1255233fb644c4d3799d86f07e2e233cbc64a3b1af`
- `99_TestHarness.gs`: `EXCLUDED`
- `.clasp.json`: `EXCLUDED`

| Relative path | SHA-256 |
|---|---|
| `apps-script/00_Config.gs` | `3c4696801a388fcd0f0d4d81e06cab2ea42a8ae11d458768af31c701a243bbfd` |
| `apps-script/01_TypesAndSchemas.gs` | `1096aa80cd95fc4f4215072cdcdf88a059e1e36ce4c48c6521dfad9b6cf0f250` |
| `apps-script/02_Setup.gs` | `a178b742c1496bb80a2d01e84e1de34719c20e8371d7001c15a8a5fe1995cfe8` |
| `apps-script/03_SheetBuilder.gs` | `de99de32edb15b90a437788446bdb05a86a13e76853fa1a73347e0ae55fccbf6` |
| `apps-script/04_MessageStateRepository.gs` | `c99a0d761613471f9a5b31d68824414b734a75ff33259beac0bdc812cd10ed77` |
| `apps-script/05_GmailGateway.gs` | `2415b05805f9b58b8e04291193fcdc15f2040e4e7dfeb2ffec63d6de907db639` |
| `apps-script/06_EmailPreprocessor.gs` | `febba4f009201fdf880d39dc43f54c8ff3b9bc17790ce588aa9f9c9d60394657` |
| `apps-script/07_AiAdapter.gs` | `5ff32a910ddd9626d331539a58a1d8242b51998e2e929e5714380d67f706437f` |
| `apps-script/08_TaskRepository.gs` | `4eb1e9c98e123e714207ddd8e7d3d9b8a9e2f690729eb0ec318c0e3973fbd17a` |
| `apps-script/09_TaskReviewPolicy.gs` | `47d036409127dc96cdace40cf61428fdc002c5c48d963eeb004e721d8720c23c` |
| `apps-script/10_CalendarSync.gs` | `7ec0be9c1a18f99913dcab3f657fe737f6f2e6321a5661bd3c46e43f15232975` |
| `apps-script/11_EditHandler.gs` | `244b8424f8ffce15f436721484aeffa7b890d086926bd6530ce934b0e94f2297` |
| `apps-script/12_Triggers.gs` | `fa37b95271dbf9e1b31ac9fb563e020263db50f42de3d740484b2c5ae8a79596` |
| `apps-script/13_LogAndDeadLetter.gs` | `bbc4ad49ed297c1c39f4a6c358d65004fcffcf0d2ca7cc45df6bc837c2955626` |
| `apps-script/14_Migrations.gs` | `4d93d8b336893a8d71392fbe7b5cf8222925d44cdd854b5b6df86e2ceea3e568` |
| `apps-script/15_Dashboard.gs` | `c18be435239c3468493971baab82fe746de4210f7513b1677eadff3b00405353` |
| `apps-script/16_Diagnostics.gs` | `b69eff8cc567969bf2fa00b6347009b7fdb0b38e06aa867684e8a7666c000c8c` |
| `apps-script/17_Utilities.gs` | `4cdc8b03d0d7023422c924ca3407c77e948f0db1a841a3414a1b635bde0d57bd` |
| `apps-script/18_Worker.gs` | `0786fcd4c444c8d03c74d07546c7218b0a4d4811ed8496d92ec75f82188cf844` |
| `apps-script/19_RuntimeSettings.gs` | `106370ebf78c81266d061f690b3448902d40bf177f283d880fe3965ac6fc618f` |
| `apps-script/20_GeminiProvider.gs` | `c7eb7d3220dbfe7fb072c6af3613877fe47f6d8199fd4f2cb6d79fc3cae42579` |
| `apps-script/appsscript.json` | `e546725fcfe47adfd40e094e66a6c866418cb6265441f541ee000c940d4a8afe` |
| `apps-script/Menu.gs` | `a95530f390c184e5e9b863603b85f63d38993141ed7c37f704766891563a1a6a` |

## Boundaries

- No real Provider request was executed.
- No real Google Workspace acceptance was executed.
- No credential, API key, password, token, real Workspace ID, or internal URL
  is included.
- OAuth scopes and Advanced Services are unchanged from the reviewed source
  `appsscript.json`.