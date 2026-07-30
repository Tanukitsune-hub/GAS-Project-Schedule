# Master Plan

Last updated: 2026-07-30
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Current contract: Code `2.8.7-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
Current publication gate: `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`

## Phase 8B Quick Diagnostic remediation

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
`PHASE8B-QUICK-DIAGNOSTIC-01` supersedes it as the current transfer target.
The A7/B7/C7/T7/evidence path is complete and its maximum carriage-only status
is `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`. This permits only controlled
non-confidential package retransfer; it does not authorize real Workspace
execution, Automation, deployment, real data, or later-stage readiness.
