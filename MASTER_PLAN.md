# Master Plan

Last updated: 2026-07-29
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Current contract: Code `2.8.5-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
Current publication gate: `READY_FOR_PHASE8B_SANDBOX_TRANSFER` (non-confidential Phase 8B carriage only)

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

The package manifests record A5.4 and `SELF` for the Release commit. The
historical Round 4 report remains a B5.2 package-generation record and is not
rewritten.

## Gate discipline

Source/release proof, canonical-text transfer checksum proof, P9 final-head
verification, and fixed P10 fresh-clone verification passed. The maximum status is
`READY_FOR_PHASE8B_SANDBOX_TRANSFER` only; it never means Phase 8B GO/PASS,
Phase 8C GO, production ready, or pilot ready.
