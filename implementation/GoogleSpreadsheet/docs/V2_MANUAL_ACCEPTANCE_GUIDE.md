# Manual Acceptance Guide — 2.8.7 Phase 8B Quick Diagnostic Candidate

Code Version: `2.8.7-prepilot`
Schema Version: `2.6`
AI Schema Version: `2.0`
Migration Version: `3`
Current gate: `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`; controlled carriage only
Automation default: `OFF`

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
| Empty Task checkboxes | only schema-defined checkbox `false` in identity-empty rows | NOT EXECUTED |
| Migration | Schema 2.5 anchor-only conversion and pause/resume behavior | NOT EXECUTED |

For each execution record: PASS/FAIL/NOT EXECUTED, timestamp, safe evidence
reference, reviewer, and cleanup result. A local test PASS cannot be
transcribed as real Workspace PASS.

## Company-PC material

Do not use `../transfer/v2.8.5-prepilot/`: it is the immutable failed P10
historical envelope. Do not manually hide its Ledger, continue its Setup, or
run its diagnostics. After corrected 2.8.6 publication and independent
verification only, use the separately generated Japanese procedure, 8B-only
allow-list, acceptance checklist, stop/rollback checklist, synthetic-data
specification, results template, and failed-Sandbox recovery guide in the new
2.8.7 transfer envelope after its separate verification.

## Prohibited status upgrades

This guide never declares execution readiness. Source A7, direct-child Release
B7, C7 verifier correction, fixed transfer T7, remote resolution, and detached
fresh-clone evidence are complete. `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`
remains only a retransfer authorization, never a Sandbox execution
authorization. Real Workspace retransfer/retest is `NOT_EXECUTED`.

Historical source/package-generation material correctly recorded the earlier
cap as `PHASE8B_SANDBOX_NO_GO_QUICK_DIAGNOSTIC` before the A7/B7/C7/T7
publication and detached-clone proof. That historical marker is not the current
operational gate.
