# Requirements Traceability — 2.8.11 T1-01 Diagnostic Summary Visibility Remediation

Last updated: 2026-08-01
Repository: `Tanukitsune-hub/GAS-Project-Schedule`  
Specification: `instructions/0003_GoogleWorkspace_Phase8B_T1_01_Warn6_Diagnostic_Summary_Visibility_Remediation_2026-07-31.md`
Version contract: Code `2.8.11-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
Current publication gate: `NO_GO_LOCAL_CLASP_VALIDATION`; current-branch CI,
non-Google local validation, target guard, and pre-push status passed, but
Instruction 0007's guarded push returned `CLASP_PUSH_FAILED`. Pull-back and
runtime validation are `NOT_EXECUTED`. Company handoff is
`NO_GO_COMPANY_HANDOFF_LOCAL_VALIDATION_FAILURE`; fixed T10 and T11
remain immutable historical evidence, T11 is `T11_SUSPENDED`, and there is
`NO_ACTIVE_COMPANY_TRANSFER`. Instruction 0005 is
`SUPERSEDED_NOT_EXECUTED`; the controlled T1-01 observation remains
`REVIEW_REQUIRED` and standalone functional acceptance remains
`NOT_EXECUTED`.

| 0003-01 | Bounded Quick/Deep summary before capped details | `16_Diagnostics.gs`, `Menu.gs`, `phase8b_t1_01_bounded_acceptance_summary_test.js` | LOCAL_PASS; no Workspace retest |
| 0003-02 | Sorted/unique/complete WARN and FAIL identifiers; overflow and malformed input fail closed | same test | LOCAL_PASS |
| 0003-03 | Closed T1-01 Task 50-column and Ledger 21-column/control aggregates | same test | LOCAL_PASS |
| 0003-04 | All Diagnostic side-effect Booleans false; no Setup/property/Calendar/Gmail/trigger repair | same test, source scan | LOCAL_PASS |

The row-level real-Workspace `NOT_EXECUTED` labels below retain their
historical pre-0001 fixed-transfer traceability meaning. They do not override
the current, narrowly scoped observed Setup status or the current external-
environment matrix in the controlled-manual-acceptance plan.

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
| QD-01 | Dashboard exact Setup control plane and exact seed; foreign data/control/format remains fail-closed | `15_Dashboard.gs`; `prepilot_dashboard_safety_test.js`; `phase8b_quick_diagnostic_real_runtime_test.js`; T7 fresh-clone audit | FIXED_TRANSFER_VERIFIED; real Workspace retransfer/retest `NOT_EXECUTED` |
| QD-02 | Task rows 1–2 / 50-column protection, five schema-defined checkbox validation, and narrow identity-empty `false` contract | `01_TypesAndSchemas.gs`; `03_SheetBuilder.gs`; `16_Diagnostics.gs`; runtime suite; T7 fresh-clone audit | FIXED_TRANSFER_VERIFIED; real Workspace retransfer/retest `NOT_EXECUTED` |
| QD-03 | S00–S80 preserved; S90/S99 resume neither duplicates nor deletes synthetic label/calendar/edit-trigger resources | `phase8b_setup_ledger_visibility_test.js`; T7 fresh-clone audit | FIXED_TRANSFER_VERIFIED; real Workspace retransfer/retest `NOT_EXECUTED` |
| QD-04 | Company-PC replacement list is Git raw-byte derived from T6.1 and final B7 payload | v2.8.7 patch-manifest tools; T7 manifest verifier | FIXED_TRANSFER_VERIFIED; real Workspace retransfer/retest `NOT_EXECUTED` |

## Phase 8B Dashboard surface traceability

| ID | Requirement | Primary evidence | Current evidence |
|---|---|---|---|
| DS-01 | Accept explicit owner and proven implicit owner Protection representations without relying on editor count alone | `15_Dashboard.gs`; `phase8b_dashboard_surface_real_runtime_test.js` | LOCAL_REGRESSION_PASS; real Workspace retransfer/retest `NOT_EXECUTED` |
| DS-02 | Reject null owner / Shared Drive, different effective user, `canEdit=false`, foreign/blank editor, domain edit, target audience, warning-only, duplicate/wrong/unprotected/overlapping protections | `15_Dashboard.gs`; native-protection fake-runtime cases | LOCAL_REGRESSION_PASS; real Workspace retransfer/retest `NOT_EXECUTED` |
| DS-03 | Separate Protection/name/value/formula/validation/note/merge/hidden/background/font/number-format/seed-marker conflicts into closed safe enums/counts | `15_Dashboard.gs`; `16_Diagnostics.gs`; surface conflict matrix | LOCAL_REGRESSION_PASS; no content/identity emitted |
| DS-04 | Quick Diagnostic is byte-stable and S00–S80 resume preserves labels, Calendar, Properties, edit trigger, Automation OFF, and no five-minute trigger | dashboard runtime suite; prior Setup/Quick Diagnostic suites | LOCAL_REGRESSION_PASS; real Workspace retransfer/retest `NOT_EXECUTED` |
| DS-05 | Company-PC patch is raw-Git-blob derived from fixed T7 and final B8 | v2.8.8 patch-manifest builder/verifier; fixed T8 detached-clone audit | FIXED_TRANSFER_VERIFIED; exactly 3 changed / 20 unchanged; `appsscript.json` unchanged |

## Phase 8B Dashboard number-format traceability

| ID | Requirement | Primary evidence | Current evidence |
|---|---|---|---|
| NF-01 | Strict Diagnostic reports the exact 17×3 system-block format conflict with closed enum/count output only | `15_Dashboard.gs`; `phase8b_dashboard_number_format_real_runtime_test.js` | LOCAL_REGRESSION_PASS; real Workspace retest `NOT_EXECUTED` |
| NF-02 | Setup, and only Setup before S90, may establish the deterministic plain-text contract after full control-plane and non-format surface proof | `02_Setup.gs`; `15_Dashboard.gs`; number-format runtime suite | LOCAL_REGRESSION_PASS; no Diagnostic repair path |
| NF-03 | Seed, owned marker, and full versioned states are idempotent; empty/foreign/ambiguous surfaces fail closed and leave the range unchanged | number-format runtime suite; recovery guide | LOCAL_REGRESSION_PASS; real Workspace retest `NOT_EXECUTED` |
| NF-04 | S00〜S80 resume preserves external-resource identity, Automation OFF, and absent five-minute trigger while S90/S99 resume | `phase8b_dashboard_number_format_real_runtime_test.js`; `phase8b_setup_ledger_visibility_test.js` | LOCAL_REGRESSION_PASS; real Workspace retest `NOT_EXECUTED` |
| NF-05 | Company-PC patch list is raw Git-blob derived from fixed T8 and corrected final B9.1 payload | v2.8.9 patch-manifest builder/verifier; fixed T9 detached-clone audit | FIXED_TRANSFER_VERIFIED; exactly 3 changed / 20 unchanged; `appsscript.json` unchanged; real Workspace retest `NOT_EXECUTED` |

## Phase 8B Dashboard write-visibility / module-skew traceability

The rows below are Source A10 requirements. Local, package, remote, and fixed
T10 detached-clone verification are complete. Real Workspace retransfer/retest
remains `NOT_EXECUTED`.

| ID | Requirement | Primary evidence | Current evidence |
|---|---|---|---|
| WV-01 | A queued format write is made visible with one `SpreadsheetApp.flush()` before the strict reread | `15_Dashboard.gs`; buffered-write runtime suite | PASS, 22/22 suite assertions; real Workspace retest `NOT_EXECUTED` |
| WV-02 | Postcondition uses a fresh exact Range and requires all 51 system cells to be canonical | `15_Dashboard.gs`; fresh-Range instrumentation | PASS; exact one-flush/fresh-Range and 51-cell postcondition covered |
| WV-03 | Flush unavailable/failure or stale post-flush state fails as `E_DASHBOARD_NUMBER_FORMAT_POSTCONDITION` with bounded evidence | Dashboard runtime suite; recovery guide | PASS; no locale or actual format string captured |
| WV-04 | Canonical block is idempotent with zero write/flush; Quick/Deep remain zero-write and zero-flush | Dashboard and Diagnostic runtime suites | PASS; read-only resource snapshots and mutation sentinels covered |
| WV-05 | Config/Setup/Dashboard mismatch fails as `E_MODULE_VERSION_SKEW` before a write; aligned identifiers may proceed | `00_Config.gs`; `02_Setup.gs`; `15_Dashboard.gs`; module-skew suite | PASS, 5/5 suite assertions |
| WV-06 | S00–S80 resume records safe normalization evidence without changing Gmail-label, Calendar, Property, edit-trigger, Automation-OFF, or no-five-minute-trigger invariants | Setup resume/runtime suites | PASS; real Workspace retest `NOT_EXECUTED` |
| WV-07 | Four canonical documents and the marked active Company-PC boundary agree on current version/gate/fixed-ref/path; synthetic T8/T9/T10, old-gate, and old-path skew fail | canonical-document consistency suite | LOCAL PASS; T11 is `T11_SUSPENDED`, `NO_ACTIVE_COMPANY_TRANSFER` is explicit, and historical T10 manifest baseline remains allowed |
| WV-08 | Historical T10/T11 patch-list provenance remains immutable; T11 uses T10 only as its old-byte/hash baseline | v2.8.10 and v2.8.11 patch-manifest verifiers | LOCAL PASS; the historical T11 manifest lists 5 modified / 18 unchanged / 0 added or removed; `appsscript.json` unchanged |

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
