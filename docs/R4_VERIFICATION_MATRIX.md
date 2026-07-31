# R4/R5 Verification Matrix

Date: 2026-07-31
Candidate: Code `2.8.11-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
Gate: `READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER`; fixed T10 `927d8567bce64461840cc6f72fbae0c1e636a8e6` remains immutable and T11 `a3b5a5d8d851bf2d15a2738c54dc6bb31e231d33` is remote-resolved/detached-clone verified; one controlled Sandbox Setup S00-S99 observation is PASS, while standalone functional acceptance remains `NOT_EXECUTED`

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
| R4-33 | Secret scan/fresh clone/remote SHA and transfer-checksum portability | `static/fresh clone` | REMOTE_FRESH_CLONE_PASS_P9_CANONICAL_CHECKSUM |
| R5-41 | T1-01 bounded WARN/FAIL summary visible before capped details | `phase8b_t1_01_bounded_acceptance_summary_test.js` | LOCAL_PASS; no real Workspace retest |
| R5-42 | WARN/FAIL overflow, malformed IDs, and missing aggregates fail closed | `phase8b_t1_01_bounded_acceptance_summary_test.js` | LOCAL_PASS |
| R5-43 | Quick/Deep summary side-effect policy remains all false | `phase8b_t1_01_bounded_acceptance_summary_test.js` | LOCAL_PASS |

## Phase 8B Setup blocker traceability

| ID | Requirement | Evidence | State |
|---|---|---|---|
| PHASE8B-SETUP-01 | Setup establishes and verifies the protected-hidden Ledger control plane before S20 authority validation; S00/S10 partial resume, control-plane failure, S30, completed rerun, and no-fallback remain fail-closed | `phase8b_setup_ledger_visibility_test.js`; safe incident record | LOCAL_REGRESSION_PASS; corrected-package real Workspace retest `NOT_EXECUTED` |

## Phase 8B Quick Diagnostic traceability

| ID | Requirement | Evidence | State |
|---|---|---|---|
| PHASE8B-QUICK-DIAGNOSTIC-01 | Exact Dashboard Setup control plane/seed, 50-column Task rows 1–2 protection, schema-driven five-checkbox validation, narrow blank-row Boolean handling, and S00–S80 resource-invariant S90/S99 resume | runtime suite; Setup resume suite; fixed T7 fresh-clone audit; safe incident record | FIXED_TRANSFER_VERIFIED; real Workspace retransfer/retest `NOT_EXECUTED` |

## Phase 8B Dashboard surface traceability

| ID | Requirement | Evidence | State |
|---|---|---|---|
| PHASE8B-DASHBOARD-01 | Native owner/effective-user/`canEdit` Protection semantics; implicit or explicit proven owner only; fail-closed foreign/domain/audience/wrong/duplicate/unprotected controls; closed-enum surface inspection; byte-stable Quick Diagnostic; S00–S80 resource-invariant S90/S99 resume | `phase8b_dashboard_surface_real_runtime_test.js`; prior Quick Diagnostic and Setup resume suites; fixed T8 detached-clone audit; safe incident record | FIXED_TRANSFER_VERIFIED; corrected-package real Workspace retransfer/retest `NOT_EXECUTED` |

## Phase 8B Dashboard number-format traceability

| ID | Requirement | Evidence | State |
|---|---|---|---|
| PHASE8B-DASHBOARD-NUMBER-FORMAT-01 | A strictly proven, seeded or owned 17×3 Dashboard system block is normalized by Setup only to the deterministic canonical plain-text contract; every other surface remains fail-closed and Quick/Deep Diagnostic remain read-only | `phase8b_dashboard_number_format_real_runtime_test.js`; `PHASE8B_DASHBOARD_NUMBER_FORMAT_RECOVERY_GUIDE_ja.md`; fixed T9 detached-clone audit | FIXED_TRANSFER_VERIFIED; corrected-package real Workspace retransfer/retest `NOT_EXECUTED` |

## Phase 8B Dashboard write-visibility / module-skew traceability

| ID | Requirement | Evidence | State |
|---|---|---|---|
| PHASE8B-DASHBOARD-WRITE-VISIBILITY-01 | An actual Setup-only format write is followed by exactly one flush, a fresh exact Range, and a strict 51-cell postcondition; Config/Setup/Dashboard contract skew fails before any write; bounded Setup evidence is retained; Quick/Deep Diagnostic remain read-only | `phase8b_dashboard_number_format_real_runtime_test.js`; `phase8b_module_version_skew_test.js`; `canonical_document_consistency_test.js`; fixed-T10 fresh-clone publication audit | LOCAL_REGRESSION_PASS; A10 `33b9ecee5b0957615fcc27fc822bf7d10a74c86f`; B10 `3f4fe6c52be7bf9c66ad221594e6271feebb57ed`; T10 `927d8567bce64461840cc6f72fbae0c1e636a8e6`; E10 is this evidence-only commit; real Workspace retransfer/retest `NOT_EXECUTED` |

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

P5/R5/P10 publication is historical evidence. `PHASE8B-SETUP-01` made the
corrective package-generation gate `PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER`.
Source A6, direct-child Release B6, normal non-force publication, final remote
SHA resolution, and detached T6.1 fresh-clone verification are historical
evidence. The v2.8.7 A7/B7/C7/T7 chain passed its own historical
source/release/transfer/fresh-clone proof. `PHASE8B-DASHBOARD-01` supersedes T7
as an execution target. The A8/B8/T8 chain completed normal publication,
GitHub resolution, and detached HTTPS fresh-clone verification as historical
evidence. The corrected v2.8.9 Source A9.1
`4a145588b01a5f7ae7e9bce86efb9bd5b3d8345d`, direct-child Release B9.1
`b451d2361db99b4efbde036dafa3e2baf6b5cb97`, and fixed transfer T9
`781f408fcf0853a5fffee9c00d3022ee5e17b1d7` completed normal publication,
remote resolution, package/transfer verification, and detached HTTPS
fresh-clone proof. That carriage-only status is historical: the repeated
write-visibility finding supersedes T9 as an execution transfer target.
Source A10, direct-child Release B10, fixed T10, normal publication, and
detached T10 verification all passed. E10 records that publication closure.
The later 0001 closed observation records one controlled Sandbox Setup through
S99, including in-Setup S90 alignment and the 51-cell normalization/flush/
postcondition. The historical row-level `NOT_EXECUTED` entries remain their
original pre-observation traceability states; the current real-environment
status is defined by the matrix below.

The `READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE` row is historical. The
current T11 boundary is `READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER`: T10 is
immutable old-byte/hash evidence only, while fixed T11 is the sole carriage
source. It permits only the hash-verified five-file replacement and one
separately approved read-only T1-01 Quick Diagnostic re-observation. It does
not declare T1-01 PASS, Phase 8B overall PASS, Phase 8C GO, production ready,
or pilot ready.

## External-environment status after 0001

| External item | Status |
|---|---|
| Real Google Workspace Setup S00-S99 | PASS for the observed controlled Sandbox Setup only |
| Real S90 Quick Diagnostic within Setup / module alignment | PASS for that Setup only |
| Dashboard 51-cell normalization / flush / postcondition | PASS for that Setup only |
| Real dedicated Calendar provisioning S60 / owner edit-trigger creation S80 | PASS for Setup stage only |
| Standalone Quick Diagnostic / Deep Diagnostic / Dashboard refresh | NOT_EXECUTED |
| Functional edit-trigger behavior / Gmail processing / Calendar reconciliation | NOT_EXECUTED |
| LockService contention / authority fault injection / external provider | NOT_EXECUTED |
| Automation / five-minute trigger | OFF / NOT_AUTHORIZED |
| Phase 8B overall PASS / Phase 8C GO / production / pilot | NOT_DECLARED |
