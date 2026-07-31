# Manual Acceptance Guide — 2.8.11 T1-01 Diagnostic Summary Visibility Candidate

Code Version: `2.8.11-prepilot`
Schema Version: `2.6`
AI Schema Version: `2.0`
Migration Version: `3`
Historical E10 carriage gate: `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`; fixed T10 `927d8567bce64461840cc6f72fbae0c1e636a8e6` remains immutable historical old-byte/hash evidence. The then-current `READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE` gate is nonoperative; this historical pre-observation guide does not govern current actions.
Automation default: `OFF`

The 0003 gate is historical. Instruction 0005 is
`SUPERSEDED_NOT_EXECUTED`: fixed T11 is immutable evidence but
`T11_SUSPENDED`, so it authorizes neither replacement nor a Company Sandbox
Diagnostic. The current development gate is
`READY_FOR_LOCAL_CLASP_VALIDATION`: current-branch CI and non-Google local
validation passed, but the personal synthetic dev target is unconfigured. No
company Workspace action is authorized; company handoff remains
`NO_GO_COMPANY_HANDOFF_PENDING_LOCAL_CLASP_VALIDATION`.
Any version-property mismatch remains an explicit WARN and is not reconciled.

Historical 0003 source-stage label:
`PHASE8B_SANDBOX_NO_GO_T1_01_SUMMARY`. It is preserved as provenance for the
pre-T11 state only; it is not the current gate and does not authorize a
different action.

Historical note: A9/A9.1/B9.1/T9 and the
`PHASE8B_SANDBOX_NO_GO_DASHBOARD_NUMBER_FORMAT` source gate are retained as
immutable provenance. The repeated 51-cell finding supersedes T9 as an
execution target. Source A10 and Release B10 correctly retained
`PHASE8B_SANDBOX_NO_GO_DASHBOARD_WRITE_VISIBILITY` until T10 was normally
published and verified; E10 changes the current publication gate without
rewriting that historical stage evidence.

## Purpose

This is a future-evidence guide for an approved, isolated Sandbox. It is not
authorization to deploy, consent to OAuth, enable automation, or run real
Google Workspace operations. Record only safe, non-secret evidence. Never
store Workspace IDs, URLs, message bodies, credentials, tokens, or personal
information in this repository.

## Preconditions

- An authorized human has selected a new, empty, isolated test Spreadsheet.
- The exact Phase 8B package provenance and checksums have been independently
  verified.
- `TEST_MODE=true` and Automation OFF match the package being assessed.
- Mock AI and wholly synthetic, non-confidential input are used.
- No `clasp push`, deployment, real Provider configuration, real Gmail,
  existing business Calendar, or external mutation is performed without
  explicit approval.

## Required observations

| Area | Expected safe result | Evidence state |
|---|---|---|
| Workbook schema | 11 Sheets, 5 hidden, 50 Task columns, 21 ledger columns | NOT EXECUTED |
| Ledger control plane | hidden and protected with canonical headers | NOT EXECUTED |
| Header edit | row 1/2 restores canonical schema | NOT EXECUTED |
| Valid Task edit | business edit follows review policy and retains authority | NOT EXECUTED |
| Invalid authority | row is excluded; no snapshot fallback | NOT EXECUTED |
| Move / sort | ledger hint only rebinds; Task data is not recreated | NOT EXECUTED |
| Row deletion | ledger becomes ORPHANED; no Task recreation | NOT EXECUTED |
| Calendar exclusion before I/O | job becomes `CANCELLED`; zero Calendar calls | NOT EXECUTED |
| Calendar authority loss after arm / I/O | owned deterministic Event compensation; no excluded-Task patch | NOT EXECUTED |
| Foreign Event compensation | Event is retained and fails closed | NOT EXECUTED |
| Diagnostics | Quick/Deep remain read-only | NOT EXECUTED |
| Dashboard pre-refresh ownership | exact Setup sheet/header protection and exact seed; no marker write | NOT EXECUTED |
| Dashboard native Protection access | owner/effective user match; implicit or explicit proven owner only; no domain/audience/foreign access | NOT EXECUTED |
| Dashboard conflict output | closed reason/subreason enums and counts only; no identity/content/address | NOT EXECUTED |
| Dashboard number-format normalization | Setup before S90 writes only the exact 17×3 proven system block, flushes, reacquires a fresh Range, and proves all 51 cells; Quick/Deep remain read-only | NOT EXECUTED |
| Module contract | Config/Setup/Dashboard identifiers match; skew fails before any format write | NOT EXECUTED |
| Safe Setup evidence | closed normalization state plus write/flush/postcondition Booleans and counts only | NOT EXECUTED |
| Empty Task checkboxes | only schema-defined checkbox `false` in identity-empty rows | NOT EXECUTED |
| Migration | Schema 2.5 anchor-only conversion and pause/resume behavior | NOT EXECUTED |

For each execution record: PASS/FAIL/NOT EXECUTED, timestamp, safe evidence
reference, reviewer, and cleanup result. A local test PASS cannot be
transcribed as real Workspace PASS.

## Company-PC material

Do not use any v2.8.5 through v2.8.11 transfer as the current execution
target. They are immutable historical evidence. Do not manually hide the
Ledger, change Dashboard formats, continue Setup, or run diagnostics as a
workaround. Instruction 0005 is `SUPERSEDED_NOT_EXECUTED`: T11 is suspended,
there is no active carriage source, and neither a five-file replacement nor a
Company Sandbox Quick Diagnostic is authorized.

## Prohibited status upgrades

This historical pre-observation guide never declares execution readiness. Its
E10-era `READY_FOR_PHASE8B_SANDBOX_RETRANSFER` gate meant controlled carriage
of exact fixed T10 only, never Sandbox PASS or execution authorization. The
current development gate is `READY_FOR_LOCAL_CLASP_VALIDATION`; guarded clasp
validation on a personal synthetic target is the prerequisite before any future
reassessment. Company handoff remains
`NO_GO_COMPANY_HANDOFF_PENDING_LOCAL_CLASP_VALIDATION`. T1-01 remains
`REVIEW_REQUIRED`, T1-02 and later actions
are not authorized, and standalone functional acceptance remains
`NOT_EXECUTED`.

Historical source/package-generation material correctly recorded
`PHASE8B_SANDBOX_NO_GO_QUICK_DIAGNOSTIC` and the later verified A7/B7/C7/T7
chain. Those markers are not the current operational gate.
