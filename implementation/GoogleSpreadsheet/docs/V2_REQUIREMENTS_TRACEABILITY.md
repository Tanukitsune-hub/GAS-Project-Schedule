# Requirements Traceability — 2.8.7 Quick Diagnostic Candidate

Last updated: 2026-07-30
Repository: `Tanukitsune-hub/GAS-Project-Schedule`  
Specification: `instructions/GoogleWorkspace_v2_8_7_Implementation_Execution_and_Company_PC_Patch_Manifest_2026-07-30.md`
Version contract: Code `2.8.7-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
Current gate: `PHASE8B_SANDBOX_NO_GO_QUICK_DIAGNOSTIC`; corrected-package real
Google Workspace retest remains `NOT_EXECUTED`.

`LOCAL_PASS` means only the local fake-runtime check passed. It never asserts
real Google Workspace execution. `REMOTE_FRESH_CLONE_PASS_P6` means the R5
corrective source/release result was normal-published, remote-resolved, and
verified in a fresh clone. `REMOTE_FRESH_CLONE_PASS_P8_CANONICAL_CHECKSUM`
adds the separate canonical-text transfer-checksum portability proof. P9
normal publication, GitHub resolution, and final-head fresh-clone validation
completed before the transfer-only status was recorded.

Historical R5/P10 local run: 41/41 test files PASS; 611 PASS / 0 FAIL / 11
explicit real-Workspace/fake-runtime skips. `tools/validate_apps_script_v2.js`
also passed 11/11 checks over 22 `.gs` files. These historical facts do not
replace the v2.8.6 evidence after `PHASE8B-SETUP-01`.

## Historical provenance labels retained for traceability

| Decision | Retained meaning in the historical 2.8.5 candidate |
|---|---|
| D-033 | Raw edit values are event input only; authority, ID resolution, and recovery are reconstructed from the validated ledger slot. |
| D-038 | Legacy v2 Error rows remain historical audit evidence and are not a current authority, rollback, or publication source. |

## R4/R5 requirement matrix (33 categories)

| ID | Requirement | Primary evidence | Current evidence |
|---|---|---|---|
| R4-01 | Canonical source topology | `remote_publication_consistency_test.js` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-02 | No root duplicate implementation/test/tool trees | `remote_publication_consistency_test.js` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-03 | Code, Schema, AI Schema, Migration, Gate consistency | `remote_publication_consistency_test.js` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-04 | Historical A5/B5 lineage preserved | `Git ancestry / publication audit` | VERIFIED_HISTORIC |
| R4-05 | Source / Release self-reference rule | `release verify scripts` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-06 | Release B boundary contains packages and report only | `remote_publication_consistency_test.js` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-07 | 11 Sheets with 5 hidden | `schema and static tests` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-08 | Task Sheet has exactly 50 canonical columns | `schema and static tests` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-09 | Ledger has exactly 21 canonical columns | `schema and static tests` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-10 | Task row 1 internal IDs restore canonically | `remediation_round4_test.js` | LOCAL_PASS |
| R4-11 | Task row 2 labels restore canonically | `remediation_round4_test.js` | LOCAL_PASS |
| R4-12 | Ledger hidden / protected runtime contract | `remediation_round5_test.js` | LOCAL_PASS |
| R4-13 | Shared validator caller inventory | `remediation_round4_test.js` | LOCAL_PASS |
| R4-14 | No snapshot cell / note / raw-row fallback | `remediation_round4_test.js` | LOCAL_PASS |
| R4-15 | Indexes only after validated authority | `remediation_round5_test.js` | LOCAL_PASS |
| R4-16 | Canonical new-generation hash, self-field exclusion, and ledger-verified legacy Schema 2.6 hash | `remediation_round5_test.js`, `phase5_schema_extension_test.js` | LOCAL_PASS |
| R4-17 | Snapshot size and ledger capacity fail closed | `remediation_round5_test.js` | LOCAL_PASS |
| R4-18 | Ledger reads remain chunk-bounded | `remediation_round5_test.js` | LOCAL_PASS |
| R4-19 | PREPARED ledger write failure recovery | `remediation_round4_test.js` | LOCAL_PASS |
| R4-20 | Task write before/after persistence recovery | `remediation_round4_test.js` | LOCAL_PASS |
| R4-21 | First insert rollback and retry | `remediation_round4_test.js` | LOCAL_PASS |
| R4-22 | Full Task row restore and management fields | `remediation_round4_test.js` | LOCAL_PASS |
| R4-23 | Multi-row edit preserves valid peers | `remediation_round4_test.js` | LOCAL_PASS |
| R4-24 | Copied duplicate becomes repeat-idempotent detached isolation | `remediation_round5_test.js` | LOCAL_PASS |
| R4-25 | Moved/sorted row rebinds ledger only | `remediation_round5_test.js` | LOCAL_PASS |
| R4-26 | Deleted row becomes durable ORPHANED | `phase5_schema_extension_test.js` | LOCAL_PASS |
| R4-27 | Quick / Deep diagnostic is read-only | `diagnostic tests and static caller options` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-28 | Schema 2.5 seed uses independent note only | `phase5_schema_extension_test.js` | LOCAL_PASS |
| R4-29 | Migration pause/resume re-observes IDs safely | `phase5_schema_extension_test.js` | LOCAL_PASS |
| R4-30 | Outbox intent and acknowledgement are durable | `remediation_round3_test.js` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-31 | Calendar excludes invalid authority before I/O; armed authority loss is owned-event-only compensation that survives later re-enqueue | `remediation_round5_test.js`, `prepilot_calendar_cas_failure_injection_test.js` F016 | LOCAL_PASS |
| R4-32 | Release parity/checksum/inventory/provenance | `verify_v2_8_5*.ps1` | REMOTE_FRESH_CLONE_PASS_P6 |
| R4-33 | Secret scan and fresh clone verification | `static scan / fresh clone` | REMOTE_FRESH_CLONE_PASS_P9_CANONICAL_CHECKSUM |

## Phase 8B Setup blocker traceability

| ID | Requirement | Primary evidence | Current evidence |
|---|---|---|---|
| PHASE8B-SETUP-01 | Setup establishes protected-hidden Ledger state before S20 authority validation; observed S00/S10 partial resume, control-plane failures, S30, completed rerun, and no-fallback remain safe | `phase8b_setup_ledger_visibility_test.js`; incident record; `02_Setup.gs` / `03_SheetBuilder.gs` | LOCAL_REGRESSION_PASS; corrected-package real Workspace retest `NOT_EXECUTED` |

## Phase 8B Quick Diagnostic traceability

| ID | Requirement | Primary evidence | Current evidence |
|---|---|---|---|
| QD-01 | Dashboard exact Setup control plane and exact seed; foreign data/control/format remains fail-closed | `15_Dashboard.gs`; `prepilot_dashboard_safety_test.js`; `phase8b_quick_diagnostic_real_runtime_test.js` | LOCAL_REGRESSION_PASS; real Workspace retest `NOT_EXECUTED` |
| QD-02 | Task rows 1–2 / 50-column protection, five schema-defined checkbox validation, and narrow identity-empty `false` contract | `01_TypesAndSchemas.gs`; `03_SheetBuilder.gs`; `16_Diagnostics.gs`; runtime suite | LOCAL_REGRESSION_PASS; real Workspace retest `NOT_EXECUTED` |
| QD-03 | S00–S80 preserved; S90/S99 resume neither duplicates nor deletes synthetic label/calendar/edit-trigger resources | `phase8b_setup_ledger_visibility_test.js` | LOCAL_REGRESSION_PASS; real Workspace retest `NOT_EXECUTED` |
| QD-04 | Company-PC replacement list is Git raw-byte derived from T6.1 and final B7 payload | v2.8.7 patch-manifest tools | PENDING_RELEASE_TRANSFER |

## Task write-route inventory (13 routes)

| ID | Route | Primary module | Authority contract |
|---|---|---|---|
| W-01 | insertTask | `08_TaskRepository.gs` | PREPARED → one row write → COMMITTED |
| W-02 | upsertTask update | `08_TaskRepository.gs` | shared validator / commitAuthorityRow |
| W-03 | direct Task update | `08_TaskRepository.gs` | shared validator / commitAuthorityRow |
| W-04 | review decision update | `08_TaskRepository.gs` | ledger projection plus one controlled decision input |
| W-05 | single-row edit restore | `08_TaskRepository.gs` | restore or isolate from ledger |
| W-06 | multi-row edit restore | `08_TaskRepository.gs` | per-row validation; valid peer retained |
| W-07 | Setup recovery | `02_Setup.gs` | recover/rebind/quarantine/orphan |
| W-08 | Migration seed | `14_Migrations.gs` | explicit Schema 2.5 migration anchor only; never a Schema 2.6 fallback |
| W-09 | Migration restore/rebind | `14_Migrations.gs` | validator plus bounded reconcile |
| W-10 | PREPARED recovery | `08_TaskRepository.gs` | promote or rollback from durable evidence |
| W-11 | Worker operational patch | `18_Worker.gs` | operational authority read |
| W-12 | Calendar acknowledgement / authority-loss compensation | `10_CalendarSync.gs` | final validator; durable arm; owned-event-only compensation; no excluded-Task patch |
| W-13 | Quarantine / orphan isolation | `08_TaskRepository.gs` | detached record or ORPHANED ledger state |

## External boundary

Real Google Workspace Sheet protection, Sheet row movement/deletion semantics,
installable edit triggers, LockService, Gmail, Calendar, credentials, and
production Provider behavior are `NOT_EXECUTED`. This traceability file does
not declare Phase 8B GO/PASS, Phase 8C GO, production ready, or pilot ready.
