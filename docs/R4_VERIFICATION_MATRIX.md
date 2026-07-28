# R4/R5 Verification Matrix

Date: 2026-07-29
Candidate: Code `2.8.5-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`  
Gate: `READY_FOR_PHASE8B_SANDBOX_TRANSFER` (non-confidential Phase 8B carriage only)

This matrix is the publication-facing summary. Detailed source traceability is
under `implementation/GoogleSpreadsheet/docs/V2_REQUIREMENTS_TRACEABILITY.md`.

## 33 requirement categories

| ID | Requirement | Evidence | State |
|---|---|---|---|
| R4-01 | Canonical source and release-tool topology | `remote_publication_consistency_test.js` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-02 | No root duplicate implementation/test/tool trees | `remote_publication_consistency_test.js` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-03 | Code/Schema/AI/Migration/Gate consistency | `remote_publication_consistency_test.js` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-04 | Historic A5/B5 preserved and verified | `Git ancestry audit` | VERIFIED_HISTORIC |
| R4-05 | Source/Release self-reference | `release verify scripts` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-06 | Release diff boundary | `remote_publication_consistency_test.js` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-07 | 11 Sheets / hidden 5 | `static schema contract` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-08 | 50 Task columns | `static schema contract` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-09 | 21 Ledger columns | `static schema contract` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-10 | Task internal-ID header restore | `remediation_round4_test.js` | LOCAL_PASS |
| R4-11 | Task label header restore | `remediation_round4_test.js` | LOCAL_PASS |
| R4-12 | Hidden/protected ledger contract | `remediation_round5_test.js` | LOCAL_PASS |
| R4-13 | Shared validator inventory | `remediation_round4_test.js` | LOCAL_PASS |
| R4-14 | No editable fallback | `remediation_round4_test.js` | LOCAL_PASS |
| R4-15 | Validation-before-index | `remediation_round5_test.js` | LOCAL_PASS |
| R4-16 | Canonical new-generation hash; ledger-verified legacy Schema 2.6 hash | `remediation_round5_test.js`, `phase5_schema_extension_test.js` | LOCAL_PASS |
| R4-17 | Snapshot/capacity fail closed | `remediation_round5_test.js` | LOCAL_PASS |
| R4-18 | Chunked ledger reads | `remediation_round5_test.js` | LOCAL_PASS |
| R4-19 | PREPARED failure recovery | `remediation_round4_test.js` | LOCAL_PASS |
| R4-20 | Task write ambiguity recovery | `remediation_round4_test.js` | LOCAL_PASS |
| R4-21 | First-insert retry | `remediation_round4_test.js` | LOCAL_PASS |
| R4-22 | Full-row restoration | `remediation_round4_test.js` | LOCAL_PASS |
| R4-23 | Multi-row peer isolation | `remediation_round4_test.js` | LOCAL_PASS |
| R4-24 | Copied-row detached isolation is repeat-idempotent | `remediation_round5_test.js` | LOCAL_PASS |
| R4-25 | Moved-row rebind | `remediation_round5_test.js` | LOCAL_PASS |
| R4-26 | Deletion/orphan policy | `phase5_schema_extension_test.js` | LOCAL_PASS |
| R4-27 | Diagnostics are read-only | `diagnostic source/test` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-28 | Schema 2.5 note-only seed | `phase5_schema_extension_test.js` | LOCAL_PASS |
| R4-29 | Migration observation pause/resume | `phase5_schema_extension_test.js` | LOCAL_PASS |
| R4-30 | Durable outbox/ack | `remediation_round3_test.js` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-31 | Calendar authority exclusion; armed authority-loss compensation survives later re-enqueue | `remediation_round5_test.js`, `prepilot_calendar_cas_failure_injection_test.js` F016 | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-32 | Release checksum/parity/provenance | `verify scripts` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-33 | Secret scan/fresh clone/remote SHA | `static/fresh clone` | REMOTE_FRESH_CLONE_PASS_P6 |

## 13 write routes

| ID | Route | Authority path |
|---|---|---|
| W-01 | insertTask | `commitAuthorityRow` |
| W-02 | upsert update | `commitAuthorityRow` |
| W-03 | direct Task update | `commitAuthorityRow` |
| W-04 | review decision | `08_TaskRepository.gs`: ledger projection plus one controlled decision input |
| W-05 | single edit restore | `restoreAuthorityRow` |
| W-06 | multi-row edit restore | `per-row restore/isolate` |
| W-07 | Setup recovery | `validateAllTaskAuthorities` |
| W-08 | Migration seed | explicit Schema 2.5 migration anchor only; never a Schema 2.6 fallback |
| W-09 | Migration rebind/reconcile | `validateAuthority + reconcileMissingAuthorityRecords` |
| W-10 | PREPARED recovery | `recoverPreparedAuthority` |
| W-11 | Worker patch | `operational authority read` |
| W-12 | Calendar acknowledgement / authority-loss compensation | `final validator; durable arm; owned-event-only compensation` |
| W-13 | quarantine/orphan | `durable isolation record` |

## Status rule

P5 publication is historical evidence; R5 has a new Source/Release pair. Only
final R5 local/static/release verification plus normal non-force GitHub
publication, final remote SHA resolution, fresh-clone verification, and the
8B-only transfer envelope can change the maximum status to
`READY_FOR_PHASE8B_SANDBOX_TRANSFER`. This matrix does not declare Phase 8B
GO/PASS, Phase 8C GO, production ready, or pilot ready. Real Google Workspace
evidence remains `NOT_EXECUTED`.
