# Google Workspace Personal Work OS v2
# Phase 8B T1-01 Diagnostic Summary Visibility Remediation Deployment Manifest

## Release identity

| Field | Value |
|---|---|
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
| TEST_MODE | `true` |
| Automation default | `OFF` |
| Package prepared at | `2026-08-10T09:38:33Z` |
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
- Canonical payload-list SHA-256: `0ed8e8e959f3f4c377731aaf9e7aa2cfa7a08a6f925350c4fbce870222446389`

The canonical payload-list hash is SHA-256 over the path-sorted concatenation
of `<lowercase sha256><two spaces><relative path><LF>` records.

| Relative path | SHA-256 |
|---|---|
| `apps-script/00_Config.gs` | `5e07cb29b4cfabc4b33429b4ec44ace7c309a4bd5d6ac8821f74ca77b9a5be66` |
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
| `apps-script/99_TestHarness.gs` | `ea25116676844c739dda9873756295c3c32859ab9bf882f929c51b87e91673ab` |
| `apps-script/appsscript.json` | `c2e79aef7a95caec20b92c0e66479812a2862034121fba4ed3e1008fbda81658` |
| `apps-script/Menu.gs` | `d96d7b9ba6a35cd1a9d0309fb0375699e1b1f89fbd851da86b26e680cbb59c15` |

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
