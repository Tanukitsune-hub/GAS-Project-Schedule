# Google Workspace Personal Work OS v2
# Phase 8B T1-01 Diagnostic Summary Visibility Remediation Deployment Manifest

## Release identity

| Field | Value |
|---|---|
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
| TEST_MODE | `true` |
| Automation default | `OFF` |
| Package prepared at | `2026-08-08T00:00:00Z` |
| Highest local status | `READY_FOR_CONTROLLED_SANDBOX_VALIDATION` |

This package corrects the bounded-visibility defect in T1-01 acceptance
evidence. Before redacted/capped Diagnostic JSON, it exposes sorted unique
WARN/FAIL check IDs, completeness flags, closed counts, all-false read-only
side-effect Booleans, and Task/Ledger aggregate states. It never suppresses a
warning, infers an unobserved warning, or performs a repair.

This package corrects `PHASE8B-DASHBOARD-NUMBER-FORMAT-01` write visibility:
after the exact Dashboard control plane, seed/owned marker, and every
non-number-format surface are proven safe, Setup alone normalizes the exact
17×3 system block to the canonical plain-text number-format contract, calls
`SpreadsheetApp.flush()`, reacquires a fresh Range, and verifies the strict
postcondition. Config, Setup, and Dashboard independently bind the S90 module
contract and fail closed with `E_MODULE_VERSION_SKEW` when they differ. It is
a candidate for independent re-audit. It does not declare Phase 8B GO/PASS,
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
- The Dashboard safe pre-refresh state is only the exact Setup-owned
  sheet/header protection control plane plus exact three-row legacy seed.
  Foreign protections, values, formulas, notes, named ranges, merges, hidden
  state, malformed markers, duplicate keys, and unsafe formatting fail closed.
- A pre-S90 Setup resume may normalize number format only after that strict
  surface proof succeeds. The operation is idempotent, applies only to the
  exact 17×3 system block, flushes pending Spreadsheet writes, reacquires a
  fresh Range, and records bounded safe postcondition evidence. Every other
  Dashboard cell remains untouched. Quick and Deep Diagnostic remain read-only
  and continue to fail closed on a noncanonical number format.
- Config, Setup, and Dashboard contain independent identical S90 module
  contract literals. Setup proves their alignment before any Dashboard write;
  a mismatch fails closed with `E_MODULE_VERSION_SKEW`.
- Task checkbox checks derive from `validationPlanForSheet(Task)`, including
  `calendar_reconcile_required`. An identity-empty row may retain only a
  canonical schema-checkbox Boolean `false`; all other values/types fail.
- For a Sandbox with S00 through S80 recorded and S90/S99 incomplete, Setup
  resumes by revalidating controls and completing only S90 then S99. It must
  not duplicate or delete Gmail labels, the dedicated Calendar, Properties, or
  the owner edit trigger; Automation and the five-minute trigger remain OFF.

## Apps Script payload

- Source of truth: `apps-script-v2/`
- Payload files: `23`
- `.gs` files: `22`
- Manifest files: `1`
- Canonical payload-list SHA-256: `d6ec728a90d71099c67a568b66edcdc388d4fce44634c271194cd1e34a003a6d`

The canonical payload-list hash is SHA-256 over the path-sorted concatenation
of `<lowercase sha256><two spaces><relative path><LF>` records.

| Relative path | SHA-256 |
|---|---|
| `apps-script/00_Config.gs` | `468d5f8e123d5903ad5b7e9dc1bdce55e4354fd69cc4d78fca70c84c7512b3cd` |
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
| `apps-script/99_TestHarness.gs` | `7bc57d5fab341399186b892456e922e25b5cf7e09e8f8d84f2435259bf73a505` |
| `apps-script/appsscript.json` | `c2e79aef7a95caec20b92c0e66479812a2862034121fba4ed3e1008fbda81658` |
| `apps-script/Menu.gs` | `ac84bf6f2b4e1f338d7daba34288afaed51b95ddb0bb41ef30d14f59d6b78817` |

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
| Code implementation | `READY_FOR_CONTROLLED_SANDBOX_VALIDATION` |
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
