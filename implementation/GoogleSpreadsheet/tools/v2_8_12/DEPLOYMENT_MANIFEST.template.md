# Google Workspace Personal Work OS v2
# Phase 8B T1-01 Diagnostic Summary Visibility Remediation Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Repository | {{REPOSITORY}} |
| Source commit | {{SOURCE_COMMIT}} |
| Release content commit | {{RELEASE_COMMIT}} |
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
| Package prepared at | `{{PREPARED_AT}}` |
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
- Payload files: `{{PAYLOAD_COUNT}}`
- `.gs` files: `{{GS_COUNT}}`
- Manifest files: `1`
- Canonical payload-list SHA-256: `{{PAYLOAD_BUNDLE_SHA256}}`

The canonical payload-list hash is SHA-256 over the path-sorted concatenation
of `<lowercase sha256><two spaces><relative path><LF>` records.

| Relative path | SHA-256 |
|---|---|
{{PAYLOAD_TABLE}}

## OAuth scopes

{{OAUTH_SCOPES}}

Forbidden scope boundary:

- no `script.external_request`
- no Drive scope
- no mail-send scope
- no `mail.google.com` full scope
- no Calendar full-control scope

## Advanced Services

{{ADVANCED_SERVICES}}

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
