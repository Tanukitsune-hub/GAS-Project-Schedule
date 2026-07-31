# Master Plan

Last updated: 2026-07-31
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Current contract: Code `2.8.11-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
Current publication gate: `READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER`

<!-- CURRENT_TRANSFER_CONTRACT_START -->
| Field | Value |
|---|---|
| Code | `2.8.11-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Gate | `READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER` |
| Fixed transfer | `a3b5a5d8d851bf2d15a2738c54dc6bb31e231d33` |
| Transfer path | `implementation/GoogleSpreadsheet/transfer/v2.8.11-prepilot/` |
<!-- CURRENT_TRANSFER_CONTRACT_END -->

## Phase 8B T1-01 bounded Diagnostic-summary visibility remediation

| Step | Deliverable | State |
|---|---|---|
| P8B-DS-1 | Preserve closed T1-01 evidence (`77/6/0`) without inferring the sixth WARN ID | Complete in Source A11 audit; `REVIEW_REQUIRED` remains. |
| P8B-DS-2 | Bounded Quick/Deep acceptance summary | Complete in Source A11 candidate: sorted IDs, counts, completeness, side-effect Booleans, and Task/Ledger aggregates precede capped details. |
| P8B-DS-3 | Read-only and overflow regression coverage | Complete locally; overflow or malformed IDs fail closed. |
| P8B-DS-4 | T11/B11/E11 publication chain | Complete: A11.1, B11, T11, and E11 are normal-published and detached-HTTPS-clone verified; only controlled T1-01 re-observation is authorized. |

## Phase 8B Dashboard write-visibility / module-skew remediation

| Step | Deliverable | State |
|---|---|---|
| P8B-WV-1 | Preserve v2.8.5 through v2.8.9 history | Complete; historical source, release, transfer, audit, and incident bytes remain immutable. |
| P8B-WV-2 | Flush-safe Setup normalization | Complete in Source A10: an actual write flushes exactly once, reacquires a fresh exact Range, and passes the strict 51-cell postcondition before S90 continues. |
| P8B-WV-3 | Module-contract skew guard | Complete in Source A10: Config, Setup, and Dashboard expose the aligned v2.8.10 S90 contract; mismatch fails closed before any write. |
| P8B-WV-4 | Buffered-runtime and document consistency tests | Complete: buffered-write/flush, module-skew, diagnostics-read-only, resume invariants, and canonical-document negative fixtures PASS. |
| P8B-WV-5 | Source A10 / direct-child Release B10 | Complete: A10 `33b9ecee5b0957615fcc27fc822bf7d10a74c86f`; direct-child B10 `3f4fe6c52be7bf9c66ad221594e6271feebb57ed`; commit boundaries PASS. |
| P8B-WV-6 | Fixed transfer T10 / evidence E10 | Complete: T10 `927d8567bce64461840cc6f72fbae0c1e636a8e6` is normal-pushed and detached-clone verified; this evidence-only commit records the proof and is not a transfer target. |
| P8B-WV-7 | Controlled Sandbox Setup/S90 evidence and next acceptance boundary | Complete as evidence/governance only: one observed Sandbox Setup completed S00-S99 with in-Setup S90 alignment and bounded normalization postcondition. The current gate permits only separately approved, synthetic non-sensitive manual acceptance; no functional tranche is executed by this record. |

## Historical Phase 8B Dashboard number-format remediation

| Step | Deliverable | State |
|---|---|---|
| P8B-NF-1 | Preserve historical v2.8.5–v2.8.8 artifacts | Complete; no historical package, transfer, audit, or incident byte is replaced. |
| P8B-NF-2 | Exact root cause and strict contract | Complete in source: all 51 format cells remain strict conflicts until the exact control plane and non-format surface are proven safe. |
| P8B-NF-3 | Setup-only normalization | Complete in source: Setup immediately before S90 may set only the exact 17×3 system block; Diagnostics remain read-only. |
| P8B-NF-4 | Native runtime / resume coverage | Complete locally: 12 number-format cases plus preserved Dashboard, Quick Diagnostic, and Ledger suites. |
| P8B-NF-5 | Source A9 / corrected A9.1 | Complete: A9 `a448b8d856abd5eb32baa60117f5fdb9f8e56de9` excludes package/report/transfer; corrected A9.1 `4a145588b01a5f7ae7e9bce86efb9bd5b3d8345d` binds the patch tool default to fixed T8. |
| P8B-NF-6 | Corrected Release B9.1 / Transfer T9 / evidence E9 | Complete: B9.1 `b451d2361db99b4efbde036dafa3e2baf6b5cb97` is a direct child of A9.1; T9 `781f408fcf0853a5fffee9c00d3022ee5e17b1d7` contains only transfer material; E9 records fresh-clone evidence. No real Workspace execution. |

## Historical Phase 8B Dashboard surface remediation

| Step | Deliverable | State |
|---|---|---|
| P8B-DS-1 | Preserve v2.8.5/P10, v2.8.6/T6.1, and v2.8.7/T7 history | Complete; all historical package, transfer, audit, and incident bytes remain immutable. |
| P8B-DS-2 | Exact root cause / native Protection model | Complete in source: owner/effective-user identity plus `canEdit()`, explicit-or-implicit owner mode, and fail-closed foreign/domain/audience/duplicate/wrong controls. |
| P8B-DS-3 | Closed Dashboard surface inspection | Complete in source: Protection, named range, value, formula, validation, note, merge, hidden state, background, font, number format, and seed/marker produce only safe enums/counts. |
| P8B-DS-4 | Runtime/regression coverage | Complete: 17 Dashboard runtime cases plus all prior suites; 44 suites / 646 PASS / 0 FAIL / 11 explicit SKIPPED in detached T8 HTTPS clone. |
| P8B-DS-5 | Source A8 | Complete: `4140054b03c850f4a1e669b3aa562b305ef78bf5`; source/tests/tools/canonical docs/visualization/incident/recovery only; no v2.8.8 package/report/transfer. |
| P8B-DS-6 | Direct-child Release B8 | Complete: `a17d34422ed521cee81340902d9a19e2da372201`; exactly two v2.8.8 packages and the implementation report. |
| P8B-DS-7 | Transfer T8 / raw-byte company-PC manifest | Complete: `69f843f6ea426ccb45d721a40508a35b0a59795d`; raw Git-blob comparison proves exactly three changed files and 20 unchanged payload files. |
| P8B-DS-8 | Normal push / detached HTTPS fresh clone / Draft PR #8 | Complete: linear non-force publication, GitHub SHA resolution, full detached-clone verification, and Draft PR update evidence. |

## Historical Phase 8B Quick Diagnostic remediation

| Step | Deliverable | State |
|---|---|---|
| P8B-QD-1 | Preserve 2.8.5/P10 and 2.8.6/T6.1 history | Complete; historical packages, transfer material, and proofs remain immutable. |
| P8B-QD-2 | Source A7 | Complete: `be2e551da310a9b7c0611f3aef8899309a3d7b69`; source/tests/tools/canonical docs/visualization/incident/recovery only; no v2.8.7 package/report/transfer. |
| P8B-QD-3 | Direct-child Release B7 | Complete: `95bc7240d99124b245e188b8e646eccf6c3ead48`; direct child of A7, containing only two v2.8.7 packages and the implementation report. |
| P8B-QD-4 | Transfer T7 / company-PC patch manifest | Complete: C7 `ba175d3994c86dacc76bad3537df97e3e644dc09` corrects the verifier only; fixed T7 `008c643b85c6b234ad489d946033cb9c06d32920` contains raw-Git-blob patch manifests versus T6.1, checksums, and operator materials. |
| P8B-QD-5 | Evidence E7 / remote fresh clone | Complete in `SELF`: remote resolution and detached HTTPS fresh-clone verification PASS; evidence changes no package, transfer, source, test, or tool file. |

## Completed historic publication path

| Step | Deliverable | State |
|---|---|---|
| P0 | Preserve historic local A5 `9705def...` and B5 `753fdb...` | Complete; retained without reset, rebase, or replacement. |
| P1 | Corrected Source A5.2 `ff658...` | Complete; source boundary verified. |
| P2 | Corrected Release B5.2 `d6dda...` | Complete; direct child of A5.2; package boundary verified. |
| P3 | P5 remote publication target `3442ac...` | Complete; normal non-force publication and fresh-clone evidence retained. |
| P4 | Fixed-ref independent re-audit | Complete with `REAUDIT_NO_GO` finding `REAUDIT-CAL-01`; its immutable report is retained. |

## R5 corrective path

| Step | Deliverable | State |
|---|---|---|
| R5-1 | Final Source A5.4 `6c4f737...` | Complete. Additive source/tests/tools/canonical-docs/visualization correction only; no current v2.8.5 package or release report. Historical A5.3 remains preserved. |
| R5-2 | Calendar authority-loss repair | Complete locally. Final shared-validator recheck, durable armed Outbox, owned-event-only compensation, and compensation preservation across later forced re-enqueue (F016). |
| R5-3 | Full local validation | Complete locally and in P6 fresh clone: 41 suite files, 611 PASS / 0 FAIL / 11 explicit skips; validator 11/11 over 22 `.gs` files. |
| R5-4 | Final Release B5.4 `3e57906...` | Complete locally. Direct child of A5.4; exactly 27 Phase 8B package files, 25 Phase 8C package files, and one Round 5 release report. Historical B5.3 remains preserved. |
| R5-5 | Package verification | Complete locally and in P6 fresh clone. 8B/8C parity, checksums, allow-lists, provenance, secret scans, and immutable input guards PASS. |
| R5-6 | P6 canonical documents, audit record, and 8B-only transfer envelope | Complete. P8 corrected `REAUDIT-TR-01` with canonical-text checksum verification; P9 final-head proof enables the 8B-only transfer envelope. |
| R5-7 | Normal remote publication and fixed-ref fresh-clone re-audit | Complete: P6 source/release proof, P8 canonical-checksum proof, P9 remote SHA/fresh-clone confirmation, and detached P10 `1a1f9df...` fresh-clone verification PASS. The later evidence-only closure record is not a transfer target. |

## Phase 8B Setup blocker remediation

| Step | Deliverable | State |
|---|---|---|
| P8B-1 | Preserve failed P10 evidence | Complete. `1a1f9df...` and all v2.8.5 packages/transfer material remain immutable historical failed evidence; no byte or transfer identity is replaced. |
| P8B-2 | `PHASE8B-SETUP-01` incident record | Complete in Source A6 scope. Safe evidence records `E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN` at `TASK_AUTHORITY`, with only S00/S10 complete; corrected-package real retest remains `NOT_EXECUTED`. |
| P8B-3 | Setup-owned Ledger control-plane repair | Complete in Source A6. S20 establishes protected-hidden Ledger state before validation; S30 and completed Setup rerun reassert it without a runtime/diagnostic repair path or authority fallback. |
| P8B-4 | Fresh/partial/failure/idempotence regression coverage | Complete locally: the targeted fake-runtime suite covers empty Setup, observed S00/S10 resume, visibility/protection failure, S30, rerun, and no-fallback. |
| P8B-5 | Source A6 | Complete: `8e8e3e4a5f2288985554b3467a5b68814e7bab21`; source/tests/tools/canonical docs/visualization/recovery guidance only; no v2.8.6 package, release report, or transfer envelope. |
| P8B-6 | Direct-child Release B6 | Complete: `49f6774242e11f3c4ae1f0881dc4a7e13c5aad23`; exactly the two v2.8.6 packages and the Phase 8B implementation report. |
| P8B-7 | Corrected transfer candidate and fresh clone | Complete: T6 `39205ff...` transfer generation and T6.1 `863217b...` external-digest correction were normal-pushed. GitHub resolution plus detached target-branch fresh-clone validation, package parity, checksum, allow-list, provenance, and scans PASS. |
| P8B-8 | Evidence-only closure | Complete in `SELF`. Records T6.1 proof and the corrected external package-tree digest; does not change package, transfer, source, test, or tool files. |

## Authority recovery objectives

1. The visible Task row is a business projection. The protected hidden Task
   Authority Ledger is the only technical authority, using a bounded two-slot
   `PREPARED` / `COMMITTED` transaction around one full visible-row write.
2. Snapshot cells, notes, and user-edited raw rows are never Schema 2.6
   authority fallbacks. Missing or invalid evidence isolates rather than
   silently rebaselines.
3. Setup, diagnostics, Migration, edit restoration, Worker, Review, and
   Calendar share fail-closed authority validation.
4. Calendar work takes a short final revalidation immediately before external
   I/O. Durable arm and compensation target types make crash and
   authority-loss recovery explicit; foreign Events are never deleted.
5. Header rows, ledger visibility/protection, Task columns, and the sheet
   contract remain canonical controls rather than user data.

## Source/release boundary

Final R5 Source A5.4 contains source, tests, tools, canonical documents, the
authority-loss design memo, and visualizations. It contains no current release
payload and no release implementation report.

Final R5 Release B5.4 contains only:

- `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/`
- `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot-phase8c/`
- `implementation/GoogleSpreadsheet/AUDIT_REMEDIATION_ROUND5_CALENDAR_OUTBOX_AUTHORITY_IMPLEMENTATION_REPORT.md`

The package manifests record A5.4 and `SELF` for the historical Release
commit. The historical Round 4 report remains a B5.2 package-generation record
and is not rewritten.

The historical Source A6 contains source, tests, tools, canonical documents,
the workflow visualization, incident record, and Japanese recovery guide.  It
must not contain any `v2.8.6-prepilot` release package, release implementation
report, or transfer envelope.  Its direct-child Release B6 must contain only:

- `implementation/GoogleSpreadsheet/release/v2.8.6-prepilot/`
- `implementation/GoogleSpreadsheet/release/v2.8.6-prepilot-phase8c/`
- `implementation/GoogleSpreadsheet/AUDIT_REMEDIATION_PHASE8B_SETUP_LEDGER_VISIBILITY_IMPLEMENTATION_REPORT.md`

## Gate discipline

P10 proof and the corrected T6.1 ref remain historical. T6.1 was verified from
GitHub in a detached target-branch fresh clone, but
`PHASE8B-QUICK-DIAGNOSTIC-01` superseded it as the then-current transfer target.
The A7/B7/C7/T7/evidence path is complete historical evidence, but
`PHASE8B-DASHBOARD-01` superseded T7 as an executable transfer target. The
additive A8/B8/T8 and A9/A9.1/B9.1/T9 paths completed their historical normal
publication and detached fresh-clone verification. T8 and T9 are immutable
evidence, but `PHASE8B-DASHBOARD-WRITE-VISIBILITY-01` supersedes T9 as an
execution transfer target. Fixed T10
`927d8567bce64461840cc6f72fbae0c1e636a8e6` passed normal publication
and detached HTTPS fresh-clone verification. A later controlled Sandbox Setup
observed S00-S99 completion and in-Setup S90 alignment/normalization with the
closed evidence retained in the 0001 audit. That record's then-current
`READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE` gate is historical. The
current T11 contract is `READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER`: T10 is
only its immutable old-byte/hash baseline; T11 is the current carriage source.
Only the hash-verified five-file replacement and one separately approved,
read-only T1-01 Quick Diagnostic re-observation are within scope. It does not
declare T1-01 PASS, Phase 8B overall PASS, Phase 8C GO, production ready, or
pilot ready.
