# Master Plan

Last updated: 2026-07-28  
Repository: `Tanukitsune-hub/GAS-Project-Schedule`  
Current remediation contract: Code `2.8.5-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`  
Current publication gate: `NO-GO_REMOTE_PUBLICATION`

## Remediation sequence

| Step | Deliverable | Current state |
|---|---|---|
| P0 | Verify historic local A5 `9705def…` and B5 `753fdbf…`; preserve their worktrees and artifacts | Complete; their root history cannot fast-forward the current remote branch. |
| P1 | Prepare a corrected Source A5.1 on the current GitHub branch tip | In progress; canonical paths only. |
| P2 | Repair R4/R5 authority contracts, tests, canonical documents, and tools | Complete in a separate review worktree; awaiting Source A5.1 commit. |
| P3 | Run all local tests and static validation; record exact results | Complete pre-Source run: 41/41 files PASS; 603 PASS / 0 FAIL / 11 explicit fake-runtime skips; static 11/11 PASS. |
| P4 | Generate and verify 8B/8C candidate packages from final Source A5.1 | Pending; packages are excluded from Source A5.1. |
| P5 | Create a linear Release B5.1, publish non-force, resolve remote SHAs, and fresh-clone verify | Pending; this is the only path to `READY_FOR_INDEPENDENT_REAUDIT`. |

## Authority recovery objectives

1. The visible Task row and the independent authority ledger use a bounded,
   two-slot `PREPARED` / `COMMITTED` protocol. A visible-row write occurs once
   between durable ledger transitions and ambiguous writes are recovered from
   durable evidence only.
2. `authoritative_snapshot_json`, cell notes, and user-edited raw rows are
   never authority fallback sources for Schema 2.6.
3. Setup, Quick Diagnostic, Deep Diagnostic, Migration, Task writes, edit
   restoration, Review, Worker, and Calendar use the same fail-closed authority
   rules. Diagnostics are read-only.
4. A row move rebinds the ledger hint without recreating business state. A
   physical deletion becomes `ORPHANED`; duplicate or corrupt rows are
   `QUARANTINED` or `UNRECOVERABLE` and excluded from operations.
5. Task row 1/2, hidden-ledger headers, visibility, and protection are a
   canonical control plane, not user data.

## Publication topology

Corrected Source A5.1 contains only source, tests, tools, canonical documents,
visualization, authority design, and migration under
`implementation/GoogleSpreadsheet/`, plus the root canonical documents.

Corrected Release B5.1 contains only:

- `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/`
- `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot-phase8c/`
- `implementation/GoogleSpreadsheet/AUDIT_REMEDIATION_ROUND4_IMPLEMENTATION_REPORT.md`

The release package records Source A5.1 and `SELF` for the release commit. It
must be generated after the final Source commit and must not be included in the
Source commit.

## Gate discipline

All local tests, static validation, checksum/parity checks, and secret scans
are necessary but not sufficient. Before normal GitHub publication and fresh
clone verification, the maximum status remains `NO-GO_REMOTE_PUBLICATION`.
After all required remote proof succeeds, the maximum status is only
`READY_FOR_INDEPENDENT_REAUDIT`. Do not declare Phase 8B GO/PASS, Phase 8C GO,
production ready, or pilot ready.
