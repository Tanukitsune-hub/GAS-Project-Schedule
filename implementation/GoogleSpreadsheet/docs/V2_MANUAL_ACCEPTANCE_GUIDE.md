# Manual Acceptance Guide — 2.8.5 Candidate

Code Version: `2.8.5-prepilot`  
Schema Version: `2.6`  
AI Schema Version: `2.0`  
Migration Version: `3`  
Current gate: `NO-GO_REMOTE_PUBLICATION`  
Automation default: `OFF`

## Purpose

This is a future evidence template for an approved sandbox. It is not an
authorization to deploy or run real Workspace operations. Record only safe,
non-secret evidence. Never store Workspace IDs, URLs, message bodies,
credentials, tokens, or personal information in this repository.

## Preconditions

- An authorized human has selected an isolated test Spreadsheet.
- The reviewed package provenance and checksum have been independently checked.
- TEST_MODE and automation settings match the package being assessed.
- No `clasp push`, production Provider configuration, or external mutation is
  performed without explicit approval.

## Required observations

| Area | Expected safe result | Evidence state |
|---|---|---|
| Workbook schema | 11 Sheets, 5 hidden, 50 Task columns, 21 ledger columns | NOT EXECUTED |
| Ledger control plane | hidden and protected with canonical headers | NOT EXECUTED |
| Header edit | row 1/2 is restored to canonical schema | NOT EXECUTED |
| Valid Task edit | business edit follows review policy and retains authority | NOT EXECUTED |
| Invalid authority | row is excluded; no snapshot fallback | NOT EXECUTED |
| Move / sort | ledger hint only rebinds; Task data is not recreated | NOT EXECUTED |
| Row deletion | ledger becomes ORPHANED; no Task recreation | NOT EXECUTED |
| Calendar outbox | excluded Task job is cancelled without Calendar I/O | NOT EXECUTED |
| Diagnostics | Quick/Deep remain read-only | NOT EXECUTED |
| Migration | Schema 2.5 anchor-only conversion and pause/resume behavior | NOT EXECUTED |

For each execution record: result (PASS/FAIL/NOT EXECUTED), timestamp, safe
evidence reference, reviewer, and cleanup result. A local test PASS cannot be
transcribed as real Workspace PASS.

## Prohibited status upgrades

Even after all approved evidence is collected, this guide does not itself
declare Phase 8B GO/PASS, Phase 8C GO, production ready, or pilot ready. Before
normal GitHub publication and fresh-clone verification, the maximum status is
`NO-GO_REMOTE_PUBLICATION`.
