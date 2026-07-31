# Google Workspace Personal Work OS v2
# 2.8.11-prepilot Manual Acceptance Guide

## 0. Release contract and status rule

| Field | Required value |
|---|---|
| Code Version | `2.8.11-prepilot` |
| Schema Version | `2.6` |
| AI Schema Version | `2.0` |
| Migration Version | `3` |
| Task canonical schema | `50` physical columns |
| Authority store | protected hidden `Task Authority Ledger` |
| Authority ledger schema | `21` columns |
| Authority protocol | versioned two-slot `PREPARED` / row write / `COMMITTED` |
| Snapshot-cell fallback | `FORBIDDEN` |
| Automation default | `OFF` |
| Highest status allowed here | `PHASE8B_SANDBOX_NO_GO_T1_01_SUMMARY` |

This is an independent-review checklist. It is not evidence that a real
Google Workspace test was performed. Every item must be recorded as `PASS`,
`FAIL`, or `NOT EXECUTED`; a local test or a package checksum never changes a
real Workspace item from `NOT EXECUTED` to `PASS`.

Never declare Phase 8B GO/PASS, Phase 8C GO, production ready, or pilot ready
from this guide.

For an already completed T10 Sandbox, this generic guide is subordinate to
the T11 transfer guide: do not rerun Setup. Only separately approved T1-01
Quick Diagnostic re-observation of the bounded summary may occur, followed by
STOP. A version-property mismatch remains an explicit WARN and must not be
silently reconciled.

## 1. Safety and evidence rules

- Use only a new non-production Spreadsheet and non-sensitive synthetic data.
- Keep `TEST_MODE=true` and Automation `OFF` throughout this review.
- Do not deploy, use `clasp push`, configure an external provider, create a
  time-driven trigger, or enable automation without separate explicit approval.
- Do not record credential values, OAuth details, real mail text, personal
  information, real Workspace IDs, real URLs, or internal links.
- Do not repair a failure by editing raw Task rows, a visible snapshot, or the
  authority ledger directly. Stop and record the safe failure code.
- Do not delete, reset, clean, force-update, or overwrite an existing package
  or worksheet during this review.

## Part A: Package provenance and integrity

### Procedure

1. Confirm the repository in `DEPLOYMENT_MANIFEST.md` is
   `Tanukitsune-hub/GAS-Project-Schedule`.
2. Confirm the Source commit is a 40-character Git commit and the release
   manifest states `SELF` for its release-content commit.
3. Check all version, authority, Automation, and status rows against Section 0.
4. Verify every `CHECKSUMS.sha256` record and the canonical payload-list hash.
5. Confirm `apps-script/` contains exactly 22 `.gs` files and
   `appsscript.json`, with no `.clasp.json`, secrets, archives, tests, or real
   identifiers.

### Pass condition

All checksum, inventory, provenance, and metadata checks match exactly.

### Stop condition

Any mismatch, missing source commit, non-empty pre-existing target package, or
secret-like file is a fail-closed condition. Do not merge, replace, or rebuild
over the existing package.

## Part B: Canonical Task and authority schema

### Procedure

1. Before testing data behavior, inspect the Task sheet structure.
2. Confirm row 1 contains the canonical internal IDs and row 2 the canonical
   labels; both are hidden/protected control-plane rows.
3. Confirm `タスク一覧` has exactly 50 physical columns.
4. Confirm the protected hidden `Task Authority Ledger` exists and has exactly
   21 canonical columns, including active/alternate slots, committed metadata,
   prepared metadata, physical-row hint, quarantine reason, and timestamp.
5. Confirm valid Task rows carry only ledger-derived authority generation,
   hash, and state values.

### Pass condition

The physical Task schema, hidden authority ledger, and canonical header rows
all match the current contract without a manual rewrite.

### Stop condition

Do not continue after an authority sheet is missing, header rows differ, or the
Task column count differs. Do not seed authority from a visible snapshot.

## Part C: Durable two-slot Task write protocol

### Required state transitions

| Transition | Durable expectation | Allowed recovery |
|---|---|---|
| Before `PREPARED` | Existing committed slot remains authoritative | no row mutation |
| `PREPARED` persisted | Alternate slot contains verified candidate and base generation/hash | complete or restore using durable ledger |
| Task row write | One canonical 50-column `setValues` write uses prepared generation/hash | re-read ledger and reconcile |
| `COMMITTED` promotion | Prepared slot becomes active committed slot | normal operation resumes |
| Invalid or ambiguous durable state | Task is quarantined or unrecoverable | exclusion from Worker, Review, Calendar |

### Procedure

1. Use a synthetic Task with valid authority and perform one permitted edit.
2. Confirm the observed sequence is `PREPARED`, one Task row write, then
   `COMMITTED`; no cell note is used for authority persistence.
3. Confirm the resulting Task row and active ledger slot agree on generation,
   hash, and canonical Task content.
4. Confirm a restart/re-entry observes the committed slot, not post-edit raw
   values as a new baseline.

### Pass condition

The Task row and ledger are mutually valid after the single durable write
protocol. The visible `authoritative_snapshot_json` may be a mirror but is not
trusted as authority.

## Part D: Authority fault-injection matrix

Execute only in a controlled non-production environment if separately approved.
Otherwise record each row `NOT EXECUTED`.

| Fault point | Required result | Forbidden result |
|---|---|---|
| Before ledger prepare | previous committed authority remains intact | partial raw Task change |
| After `PREPARED`, before Task row write | recovery completes or rolls back from ledger | visible snapshot becomes authority |
| Task row write succeeds but reports failure | recovery re-reads durable ledger and completes or restores | silent rebaseline from raw row |
| After Task row write, before promotion | prepared slot determines recovery | stale/ambiguous authority accepted |
| Ledger promotion failure | recover or quarantine with a safe code | later Worker/Review/Calendar processing |
| Ledger missing or malformed | quarantine or unrecoverable | auto-fallback to snapshot cell/note |
| Ledger/task identity or hash conflict | quarantine or unrecoverable | silent overwrite of evidence |

For every fault, record the safe failure code and whether the final state is
`COMMITTED`, restored to the previous committed state, `QUARANTINED`, or
`UNRECOVERABLE`. Do not record raw Task content.

## Part E: Multi-row edit and header recovery

### Procedure

1. Prepare two valid-authority synthetic Task rows and one invalid-authority
   synthetic Task row.
2. Make a multi-row edit that includes a management column.
3. Confirm every valid-authority row is restored from its own durable authority
   record; a bad row must not prevent valid peer restoration.
4. Confirm the invalid row is quarantined or unrecoverable and excluded from
   Worker, Review, and Calendar processing.
5. Attempt a controlled edit or cross-row paste involving header row 1 or 2.
6. Confirm both header rows are restored to the canonical internal IDs and
   labels, and permitted data rows are processed under the shared validator.

### Pass condition

No valid peer's raw management change remains. No invalid row becomes a trust
source. The Task header schema is canonical after recovery.

## Part F: Setup, diagnostics, and Migration 3

### Procedure

1. Run Setup, Quick Diagnostic, and Deep Diagnostic only under the recorded
   candidate conditions.
2. Confirm each uses the same authority validator and does not trust live raw
   data, a user-edited snapshot, or a cell note as an authority fallback.
3. Re-run Setup after a valid durable authority state and confirm it does not
   silently rebaseline or overwrite Task state.
4. For Migration 3, test only an explicit legacy Schema 2.5 migration fixture
   if separately approved. Legacy note anchoring is permitted solely at that
   one migration boundary.
5. Confirm a current Schema 2.6 row with missing/malformed authority is
   quarantined rather than seeded or rebaselined.
6. For a valid S00-S80 resume only, confirm Setup first proves the complete
   Dashboard control plane and all non-format surfaces, then normalizes only
   the exact 17×3 system block to the canonical plain-text format.
7. Confirm Setup calls `SpreadsheetApp.flush()` after the write, reacquires a
   fresh Range, and records only bounded status/count evidence after the strict
   postcondition succeeds. A flush failure, stale read, or remaining
   noncanonical cell must leave S90/S99 incomplete.
8. Confirm Config, Setup, and Dashboard expose the same independent S90 module
   contract. A mismatch must fail closed with `E_MODULE_VERSION_SKEW` before
   any Dashboard write.
9. Confirm Quick and Deep Diagnostic make no number-format write or flush and
   fail closed on a mismatch.

### Pass condition

Only a valid ledger record can support authority recovery. Legacy migration is
bounded, resumable, and isolated from current-schema silent repair. Dashboard
number-format normalization is Setup-only, narrow, deterministic,
flush-visible, module-aligned, and never authorizes a Diagnostic repair.

## Part G: Workflow, reporting, and backup provenance

### Procedure

1. Confirm the workflow visualization and canonical metadata state the values
   in Section 0 and describe the ledger rather than a snapshot fallback.
2. Confirm the release report distinguishes the historical Round 3 backup
   claim from the actual GitHub rollback source. Do not invent a remote backup.
3. Confirm the Source A10 commit contains source/tests/tools/canonical docs/
   changelog/visualization/design/migration only.
4. Confirm the Release B10 commit contains only the two release packages and
   `AUDIT_REMEDIATION_PHASE8B_DASHBOARD_WRITE_VISIBILITY_MODULE_SKEW_IMPLEMENTATION_REPORT.md`.

### Pass condition

Provenance is explicit, release contents are separated, and any unavailable
historical rollback material is described accurately rather than reported as
present.

## Part H: External validation status

Record these separately. They start as `NOT EXECUTED` for this package build:

| External item | Package-build status |
|---|---|
| Real Google Workspace Setup | `NOT EXECUTED` |
| Real OAuth consent | `NOT EXECUTED` |
| Real Gmail processing | `NOT EXECUTED` |
| Real Calendar reconciliation | `NOT EXECUTED` |
| Real installable edit trigger | `NOT EXECUTED` |
| Real LockService contention | `NOT EXECUTED` |
| External provider/model/credential | `NOT EXECUTED` |
| Phase 8B / Phase 8C / pilot declaration | `NOT DECLARED` |

## Final record

| Item | Result | Safe evidence reference |
|---|---|---|
| Local package checks |  |  |
| Authority and Setup faults |  |  |
| Multi-row/header recovery |  |  |
| Setup/diagnostic validator parity |  |  |
| Migration 3 boundary |  |  |
| Real Workspace validation | `NOT EXECUTED` unless independently run |  |
| Overall maximum status | `PHASE8B_SANDBOX_NO_GO_T1_01_SUMMARY` |  |

Do not alter the overall maximum status based solely on local test success.
