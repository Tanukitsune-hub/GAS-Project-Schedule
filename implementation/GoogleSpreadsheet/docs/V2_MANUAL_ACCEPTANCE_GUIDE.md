# Manual Acceptance Guide — 2.8.5 R5 Corrective Candidate

Code Version: `2.8.5-prepilot`
Schema Version: `2.6`
AI Schema Version: `2.0`
Migration Version: `3`
Current gate: `NO-GO_REMOTE_PUBLICATION` pending R5 normal publication and fresh-clone proof
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

After final R5 remote verification only, use the authoritative Japanese
procedure, 8B-only allow-list, acceptance checklist, stop/rollback checklist,
synthetic-data specification, and results template in
`../transfer/v2.8.5-prepilot/`. Do not use the historical
`V2_SANDBOX_ACCEPTANCE_RESULTS_TEMPLATE.md` for this version.

## Prohibited status upgrades

This guide never declares Phase 8B GO/PASS, Phase 8C GO, production ready, or
pilot ready. Before R5 normal GitHub publication and fresh-clone verification,
the maximum status is `NO-GO_REMOTE_PUBLICATION`. After those conditions and
transfer-envelope verification, the maximum status is only
`READY_FOR_PHASE8B_SANDBOX_TRANSFER`; it is not a Sandbox PASS or execution
authorization.
