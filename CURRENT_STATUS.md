# Current Status

Last updated: 2026-07-30
Candidate version: Code `2.8.7-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
Overall status: `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`
Automation default: `OFF`  
Corrected-package real Google Workspace retest: `NOT_EXECUTED`

## Current 2.8.7 Quick Diagnostic remediation candidate

`PHASE8B-QUICK-DIAGNOSTIC-01` records four safe, real-Sandbox observations
without Workspace IDs, URLs, screenshots, or business data:

- `DASHBOARD_LAYOUT_OWNERSHIP`: a canonical Setup-owned Dashboard control
  plane / seed state must not be confused with a foreign writable surface.
- `TASK_PROTECTIONS`: the canonical Task header protection spans rows 1–2 and
  all 50 Task columns.
- `BLANK_ROW_BOOLEAN_VALUES`: an identity-empty row may retain only canonical
  checkbox Boolean `false` materialized by Google Sheets.
- `TASK_VALIDATION_TYPES`: all five schema-defined checkbox columns, including
  hidden `calendar_reconcile_required`, are validated from the canonical plan.

Source A7 `be2e551da310a9b7c0611f3aef8899309a3d7b69` contains only source,
tests, tools, canonical documents, visualization, incident, and recovery
guidance. Its direct-child Release B7
`95bc7240d99124b245e188b8e646eccf6c3ead48` contains only the two v2.8.7
packages and implementation report. C7
`ba175d3994c86dacc76bad3537df97e3e644dc09` corrected the transfer-manifest
verifier without changing package bytes. Fixed transfer T7
`008c643b85c6b234ad489d946033cb9c06d32920` contains only the transfer
envelope and raw-byte-derived company-PC patch manifest. T7 was normally
pushed, GitHub-resolved, and verified from a detached fresh HTTPS clone.

Evidence E7 is `SELF (this evidence-only commit)`: it records the final remote
and fresh-clone proof and is not a transfer target. It changes no package,
transfer, source, test, or tool file. Real Workspace retransfer/retest remains
`NOT_EXECUTED`.

## Why the 2.8.5 transfer gate is superseded

The final R5 A5.4/B5.4 correction and its P6–P10 publication evidence remain
immutable historical records.  A first-time Setup using the exact P10 Phase
8B package then safely failed with `E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN` at
`TASK_AUTHORITY`, after only `S00_VALIDATE_ENV` and `S10_CREATE_SHEETS`.
Finding `PHASE8B-SETUP-01` therefore supersedes P10 as a transfer target. The
former 2.8.6 source candidate was deliberately no-go until its additive
source/release/transfer chain was independently published and reverified. That
historical condition was satisfied for fixed T6.1 only. T6.1 is now historical
evidence, not the current transfer target or an execution authorization.

## Provenance state

| Record | SHA / relation | State |
|---|---|---|
| Historic Source A5 | `9705def085b66b5e521c7ec93804c228eb60e7ba` | retained historical local evidence |
| Historic Release B5 | `753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf` | retained historical local evidence; direct child of historic A5 |
| Published P5 baseline | `3442ac01f5c544c2b49a40a9af170d1f432312f1` | fixed independent-audit target; parent is B5.2 |
| Corrected Source A5.2 | `ff658bacf1e85864e4008efa32863635e446d47d` | historic published source; retained |
| Corrected Release B5.2 | `d6dda2b3eb9307e7033dcdd5f4718260c4944451` | historic published release; direct child of A5.2 |
| R5 Source A5.3 | `4b39a0eaeb1eb5f9efe4188bf23b6e60b0f6edb1` | retained unpublished candidate; superseded after the second independent Calendar review finding |
| R5 Release B5.3 | `f4fa0bfe4b2479f6ae61ebb6780369079f073aa4` | retained unpublished candidate release; superseded with no rewrite or force operation |
| Final R5 Source A5.4 | `6c4f737c676b3121c42aafabe9d0c677cacd69bb` | final source-only additive correction; no release payload or release report |
| Final R5 Release B5.4 | `3e5790672740626f3bec4592c3c7c0b86b47f3b1` | direct child of A5.4; exactly 27 Phase 8B files, 25 Phase 8C files, and one Round 5 report |
| P6 remote publication evidence | `12538796fed90eb7f95492d477cca44a5d859291` | normal fast-forward pushed to `codex/r5-independent-reaudit-transfer-prep`; GitHub SHA resolution and fresh-clone validation PASS |
| Historical P7 transfer-readiness evidence | `45bb4b938b02f2fd56d5d57267f4083a46f5176b` | normal-pushed; its fresh clone detected `REAUDIT-TR-01` raw-byte checksum portability mismatch; not a transfer authorization |
| P8 checksum-portability correction | `784b293c50713597a656bc7d9d1ae51fdaa26f1a` | normal-pushed; a fresh clone passed canonical-text transfer checksum verification while intentionally `NO-GO` |
| P9 transfer-envelope evidence | `ab6b1db8c0d7cc3f0df6bc104cfee39392787d4b` | normal-pushed; GitHub resolution, fresh-clone 41-suite validation, package parity, canonical transfer checksum, allow-list, and scans PASS |
| P10 fixed transfer reference | `1a1f9df65dacf3a031409d724cb2906b58900f77` | independently verified from a detached fresh HTTPS clone; the fixed non-confidential Phase 8B transfer reference |
| Phase 8B Setup blocker | `PHASE8B-SETUP-01` | High; observed only on failed historical P10 initial Setup; safe evidence preserved, corrected-package real retest pending |
| Source A6 | `8e8e3e4a5f2288985554b3467a5b68814e7bab21` | additive source/tests/tools/canonical-docs/visualization/recovery guide; excludes v2.8.6 release and transfer payloads |
| Release B6 | `49f6774242e11f3c4ae1f0881dc4a7e13c5aad23` | direct child of A6; exactly both v2.8.6 packages and the implementation report |
| Transfer T6 | `39205ff9d0a7df79f9e0892b02ab73cac1a7dc14` | retained transfer-envelope generation record; superseded only for an external-digest record correction |
| Fixed transfer T6.1 | `863217b99dfa1ad682a8f4dd1989212b0a8d548b` | normally pushed, GitHub-resolved historical transfer ref; fresh-clone static verification PASS, superseded as the current target by `PHASE8B-QUICK-DIAGNOSTIC-01` |
| Historical evidence-only closure E6.1 | `e03367c38ac1a623f6ce0c45ba5d5e37d7271d69` | records the T6.1 proof and corrected documentation digest; it is not a transfer target |
| Source A7 | `be2e551da310a9b7c0611f3aef8899309a3d7b69` | source/tests/tools/canonical-docs/visualization/incident/recovery only; excludes v2.8.7 package, report, and transfer envelope |
| Release B7 | `95bc7240d99124b245e188b8e646eccf6c3ead48` | direct child of A7; exactly the two v2.8.7 packages and the Phase 8B Quick Diagnostic implementation report |
| Transfer verifier C7 | `ba175d3994c86dacc76bad3537df97e3e644dc09` | post-B7 tool-only correction for an independently demonstrated manifest-verifier defect; immutable package bytes unchanged |
| Fixed transfer T7 | `008c643b85c6b234ad489d946033cb9c06d32920` | normally pushed, GitHub-resolved fixed v2.8.7 transfer ref; raw-byte patch manifest, checksums, and detached fresh-clone verification PASS |
| Evidence E7 | `SELF (this evidence-only commit)` | records final remote/fresh-clone proof; not a transfer target and changes no package/transfer/source/test/tool file |

The immutable P5 publication evidence remains at
`audits/2026-07-28/GoogleWorkspace_v2_8_5_Remote_Publication_Verification_2026-07-28.md`.
The fixed-ref `REAUDIT_NO_GO` evidence remains at
`audits/2026-07-29/GoogleWorkspace_v2_8_5_Independent_Reaudit_Report_2026-07-29.md`.
The separate final-corrective local re-audit and transfer-readiness record is
`audits/2026-07-29/GoogleWorkspace_v2_8_5_R5_Corrective_Independent_Reaudit_and_Transfer_Readiness_2026-07-29.md`.
The remote-publication and transfer-readiness verification is recorded at
`audits/2026-07-29/GoogleWorkspace_v2_8_5_R5_Remote_Publication_and_Transfer_Readiness_Verification_2026-07-29.md`.
The checksum-portability finding and P8 corrective record is
`audits/2026-07-29/GoogleWorkspace_v2_8_5_R5_Transfer_Checksum_Portability_Correction_2026-07-29.md`.
The final independent re-audit and company-PC transfer-readiness record is
`audits/2026-07-29/GoogleWorkspace_v2_8_5_R5_Final_Independent_Reaudit_and_Company_PC_Transfer_Readiness_2026-07-29.md`.
The fixed P10 verification record is
`audits/2026-07-29/GoogleWorkspace_v2_8_5_P10_Fixed_Transfer_Ref_Verification_2026-07-29.md`;
the later evidence-only commit is not a transfer target.
The safe incident record for the superseding blocker is
`audits/2026-07-29/GoogleWorkspace_v2_8_6_Phase8B_Setup_Ledger_Visibility_Blocker_Incident_2026-07-29.md`.
The final T6.1 fresh-clone verification is
`audits/2026-07-29/GoogleWorkspace_v2_8_6_Phase8B_Sandbox_Retransfer_Fresh_Clone_Verification_2026-07-29.md`.
The v2.8.7 final detached-clone verification is
`audits/2026-07-30/GoogleWorkspace_v2_8_7_Phase8B_Sandbox_Retransfer_Fresh_Clone_Verification_2026-07-30.md`.

## Historical R5 and 2.8.6 correction

| Area | State |
|---|---|
| High Calendar authority-loss findings | `REAUDIT-CAL-01` and `REAUDIT-CAL-02` are locally corrected: final ledger validator before I/O; durable arm; owned-event-only compensation; compensation preservation across later forced re-enqueue; foreign-event fail-closed behavior. |
| Task authority protocol | Protected hidden 21-column `Task Authority Ledger`; two-slot `PREPARED` / `COMMITTED`; 50 Task columns; 11 Sheets / hidden 5. |
| Calendar / Outbox | `DEADLINE_CALENDAR_ARMED` survives the external-I/O window; `DEADLINE_CALENDAR_AUTHORITY_COMPENSATION` survives failure, manual retry, and later authority-valid ineligible forced re-enqueue. |
| Historical source tests | R5/P10 evidence: 41 suite files; 611 PASS / 0 FAIL / 11 explicit real-Workspace/fake-runtime skips. |
| F016 fault injection | 12 PASS / 0 FAIL, including pre-I/O exclusion, post-I/O compensation, crash recovery, concurrent ineligibility, foreign Event refusal, manual retry-marker preservation, and forced re-enqueue preservation. |
| Static validation | `tools/validate_apps_script_v2.js`: 11/11 PASS; 22 `.gs` files. |
| R5 release packages | 8B: 27 files / 23 payload; 8C: 25 files / 22 payload; checksum, parity, allow-list, provenance, and secret scans PASS from the P6 fresh clone. |
| Historical company-PC transfer materials | P6 source/release proof, P8 canonical-text checksum portability proof, P9 final-head proof, and P10 fixed-ref verification PASS; P10 itself is now historical failed evidence and may not be used. |
| Corrected 2.8.6 final fresh clone | T6.1: 42 suites, 619 PASS / 0 FAIL / 11 explicit skips; F016 7/7; validator 11/11 over 22 `.gs`; 8B/8C verifier, parity, 27/27 allow-list, 26/26 package checksum, transfer checksum, secret/local-path scan, and remote consistency 8/8 PASS. |

The 2.8.6 correction makes Ledger protection and hidden visibility an explicit
Setup-owned, idempotent control-plane operation before hidden/protection
authority validation in S20.  S30 and completed-Setup reruns reassert it.  The
authority validator remains fail-closed and no raw row, note, or snapshot
fallback is added.  Local regression coverage includes fresh Setup, the
observed S00/S10 partial state, visibility/protection failure injection,
idempotent S30, completed rerun, and no-fallback checks.  Corrected-package
real Workspace retest remains `NOT_EXECUTED`.

## Gate and recovery boundary

The historical `PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER` prohibited reuse of the
old package and all real Workspace action while the corrected Source A6 /
Release B6 / transfer chain was created and independently verified. Automation
remains OFF. Do not manually hide the Ledger, continue Setup, or run
diagnostics with P10; preserve the failed workbook as evidence.

The normal-pushed T6.1 fixed ref passed its required target-branch fresh-clone
checks and remains historical. The v2.8.7 A7/B7/C7/T7 chain has separately
passed normal publication, GitHub resolution, raw-byte patch-manifest checks,
and detached fresh-clone verification. The current status therefore permits
only retransfer carriage. It does not authorize OAuth consent, deployment,
`clasp push`, Automation enablement, real data, or real Workspace action.

No GitHub Actions run or combined-status evidence exists for this PR #8 scope.
The repository retains three active historical temporary workflows, but none
targeted this branch/ref; CI evidence for this scope is `NOT EXECUTED`.
Fresh-clone local/static validation is the required evidence.
