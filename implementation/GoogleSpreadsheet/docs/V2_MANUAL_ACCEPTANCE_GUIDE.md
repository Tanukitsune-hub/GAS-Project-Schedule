# Manual Acceptance Guide — 2.8.10 Dashboard Write-Visibility / Module-Skew Candidate

Code Version: `2.8.10-prepilot`
Schema Version: `2.6`
AI Schema Version: `2.0`
Migration Version: `3`
Current publication gate: `PHASE8B_SANDBOX_NO_GO_DASHBOARD_WRITE_VISIBILITY`; fixed transfer `PENDING_T10`; real Workspace retransfer/retest `NOT_EXECUTED`
Automation default: `OFF`

Historical note: A9/A9.1/B9.1/T9 and the
`PHASE8B_SANDBOX_NO_GO_DASHBOARD_NUMBER_FORMAT` source gate are retained as
immutable provenance. The repeated 51-cell finding supersedes T9 as an
execution target.

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

Do not use any v2.8.5 through v2.8.9 transfer as the current execution target.
They are immutable historical evidence. Do not manually hide the Ledger,
change Dashboard formats, continue Setup, or run diagnostics as a workaround.
The v2.8.10 company-PC replacement list must be generated from raw Git blob
comparison between fixed T9 and final B10. Until fixed T10 and detached-clone
evidence are complete, no transfer path or changed-file/hash list is approved;
those items remain `PENDING_T10`.

## Prohibited status upgrades

This guide never declares execution readiness. The current gate is
`PHASE8B_SANDBOX_NO_GO_DASHBOARD_WRITE_VISIBILITY`; A10/B10/T10/E10 are
pending. Even a later `READY_FOR_PHASE8B_SANDBOX_RETRANSFER` would mean
controlled carriage only, never Sandbox PASS or execution authorization.
Real Workspace retransfer/retest is `NOT_EXECUTED`.

Historical source/package-generation material correctly recorded
`PHASE8B_SANDBOX_NO_GO_QUICK_DIAGNOSTIC` and the later verified A7/B7/C7/T7
chain. Those markers are not the current operational gate.
