# Manual Acceptance Guide — 2.8.6 Phase 8B Setup Ledger Visibility Candidate

Code Version: `2.8.6-prepilot`
Schema Version: `2.6`
AI Schema Version: `2.0`
Migration Version: `3`
Current gate: `PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER` pending corrected source,
release, transfer, normal publication, and fresh-clone proof
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
2.8.6 transfer envelope.

## Prohibited status upgrades

This guide never declares Phase 8B GO/PASS, Phase 8C GO, production ready, or
pilot ready. Before corrected publication and fresh-clone verification, the
maximum status is `PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER`. After those conditions
and transfer-envelope verification, the maximum status is only
`READY_FOR_PHASE8B_SANDBOX_RETRANSFER`; it is not a Sandbox PASS or execution
authorization.
