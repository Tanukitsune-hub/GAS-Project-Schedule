# Google Workspace Personal Work OS v2
# Phase 8B Setup Ledger Visibility Blocker Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Source commit | `8e8e3e4a5f2288985554b3467a5b68814e7bab21` |
| Release content commit | `SELF (the Git commit containing this manifest)` |
| Code Version | `2.8.6-prepilot` |
| Schema Version | `2.6` |
| AI Schema Version | `2.0` |
| Migration Version | `3` |
| Task canonical columns | `50` |
| Authority store | `protected hidden Task Authority Ledger` |
| Authority ledger columns | `21` |
| Authority protocol | `versioned two-slot PREPARED/COMMITTED` |
| Snapshot-cell fallback | `FORBIDDEN` |
| TEST_MODE | `true` |
| Automation default | `OFF` |
| Package prepared at | `2026-07-29T06:27:34.455Z` |
| Highest local status | `PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER` |

This package corrects the Phase 8B Setup Ledger visibility blocker and is a
candidate for independent re-audit. It does not declare Phase 8B GO/PASS,
Phase 8C GO, production readiness, or pilot readiness. Real Google Workspace
validation remains `NOT EXECUTED` when this package is built locally.

## Authority and Setup control-plane contract

- A Task write uses a durable two-slot authority ledger: `PREPARED`, one Task
  row write, then `COMMITTED`.
- Recovery reads the protected hidden ledger. `authoritative_snapshot_json`, a
  cell note, live raw values, and post-edit values are never authority fallback
  sources.
- A missing, malformed, or conflicting authority record is quarantined or
  marked unrecoverable. It is excluded from Worker, Review, and Calendar paths.
- Task header rows 1 and 2 are canonical control-plane metadata and are
  restored by the common schema path.
- Migration 3 permits legacy note anchoring only at the explicit Schema 2.5
  migration boundary; it does not silently rebaseline a Schema 2.6 Task row.
- During `S20_CREATE_SCHEMAS`, Setup establishes the Ledger Sheet protection
  and hidden state before any authority validation. `S30` and a completed
  Setup rerun reassert those controls idempotently. A visibility/protection
  write failure leaves `S20_CREATE_SCHEMAS` incomplete and fails closed.

## Apps Script payload

- Source of truth: `apps-script-v2/`
- Payload files: `23`
- `.gs` files: `22`
- Manifest files: `1`
- Canonical payload-list SHA-256: `e734d1d11be637e4b146b448728dd54841df0cb37f0cba53528213f2a564fbfc`

The canonical payload-list hash is SHA-256 over the path-sorted concatenation
of `<lowercase sha256><two spaces><relative path><LF>` records.

| Relative path | SHA-256 |
|---|---|
| `apps-script/00_Config.gs` | `b0492460453814e2b0938e58d9063a368ce6501a01d309c0285dd501051a16de` |
| `apps-script/01_TypesAndSchemas.gs` | `4d78f9fb97165d42c55c551a41368f7a4f2d485ab2c90a5fa44ee0d44582d2dc` |
| `apps-script/02_Setup.gs` | `4d7adcb1fc1d963d39fda6fa323f16d2be006f3de0e081d67512be13a5da1eea` |
| `apps-script/03_SheetBuilder.gs` | `b802b6c8f0f0ec23f530cee6baf1510650ba3f45b7f542f22f820021068f6527` |
| `apps-script/04_MessageStateRepository.gs` | `c99a0d761613471f9a5b31d68824414b734a75ff33259beac0bdc812cd10ed77` |
| `apps-script/05_GmailGateway.gs` | `1c017565a20a86a7ea946126f325c83c69a67ae20c4c01a49723166b8d6dcb7c` |
| `apps-script/06_EmailPreprocessor.gs` | `febba4f009201fdf880d39dc43f54c8ff3b9bc17790ce588aa9f9c9d60394657` |
| `apps-script/07_AiAdapter.gs` | `6a3b9fb5e504e8cfbffcee5dc786b13b511fbab63cef4d7281210bc07bb0243b` |
| `apps-script/08_TaskRepository.gs` | `4eb1e9c98e123e714207ddd8e7d3d9b8a9e2f690729eb0ec318c0e3973fbd17a` |
| `apps-script/09_TaskReviewPolicy.gs` | `c48000619bd5b7ff085dfcaa2df087fa91c6c69b58789d81b8a9d9a3a133f6b3` |
| `apps-script/10_CalendarSync.gs` | `7ec0be9c1a18f99913dcab3f657fe737f6f2e6321a5661bd3c46e43f15232975` |
| `apps-script/11_EditHandler.gs` | `244b8424f8ffce15f436721484aeffa7b890d086926bd6530ce934b0e94f2297` |
| `apps-script/12_Triggers.gs` | `de81b90d648740ceb302cc12d74f2d45af34a4e493d6441c3a512d2efce0f0d7` |
| `apps-script/13_LogAndDeadLetter.gs` | `84df90d249e8f215ffceda6301b1bd362637f72a2812154618990c4f5c058f67` |
| `apps-script/14_Migrations.gs` | `4d93d8b336893a8d71392fbe7b5cf8222925d44cdd854b5b6df86e2ceea3e568` |
| `apps-script/15_Dashboard.gs` | `48729ccf04a9f443e92b5dc96218ae05a23e512e1e5de050b1ab5799f0a78012` |
| `apps-script/16_Diagnostics.gs` | `4c2911a988e7055888d6a58a99bcaea9628cf96312ad2315b828c08889d67b9c` |
| `apps-script/17_Utilities.gs` | `494ad83b1b841ea7e05e1721e22780add2c439ea41473eda4dc521fc428407f6` |
| `apps-script/18_Worker.gs` | `8d3529d9af8bc9f16a816a17f533cef26300809225c2ac68091a8ef9ca6f3e29` |
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

Forbidden scope boundary:

- no `script.external_request`
- no Drive scope
- no mail-send scope
- no `mail.google.com` full scope
- no Calendar full-control scope

## Advanced Services

- `Gmail`: service `gmail`, version `v1`
- `Calendar`: service `calendar`, version `v3`

## External boundaries

| Boundary | Status |
|---|---|
| Code implementation | `PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER` |
| Local fault-injection validation | package-build prerequisite |
| Real Provider connection | `NOT EXECUTED` |
| Provider / model / endpoint / auth | `NOT CONFIRMED` |
| Company approval | `NOT CONFIRMED` |
| Credential storage approval | `NOT CONFIRMED` |
| Real Google Workspace | `NOT EXECUTED` |
| Real OAuth consent | `NOT EXECUTED` |
| Real Trigger / LockService contention | `NOT EXECUTED` |

## Package exclusions

The package excludes:

- `.clasp.json`, Script IDs, deployment commands, and deployment credentials
- credential values, API keys, passwords, tokens, and private keys
- Node tests, fixtures, archives, prompts, and local environment files
- real Spreadsheet / Gmail / Calendar IDs and Google Workspace internal URLs
- company email bodies, attachments, personal information, and unpublished data

`CHECKSUMS.sha256` records every package file except itself, including this
manifest, the Quickstart, the Manual Acceptance Guide, and the Apps Script
payload. A mismatch is a fail-closed condition.
