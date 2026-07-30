# Google Workspace Personal Work OS v2 — Implementation Specification

Last updated: 2026-07-30
Code: `2.8.9-prepilot` · Schema: `2.6` · AI Schema: `2.0` · Migration: `3`
Current publication gate: `READY_FOR_PHASE8B_SANDBOX_RETRANSFER` (real Workspace retransfer/retest `NOT_EXECUTED`)

## 1. Scope and non-goals

The system derives and manages personal Tasks from Gmail through Google Sheets,
with Google Calendar as a derived reconciliation target. This specification
covers local source and fake-runtime evidence only. It does not authorize
deployment, `clasp push`, production Provider configuration, real Gmail or
Calendar mutation, credential storage, Phase 8B GO/PASS, Phase 8C GO,
production ready, or pilot ready.

## 2. Canonical workbook contract

| Item | Contract |
|---|---|
| Workbook sheets | 11 total: 6 user-facing and 5 hidden |
| Task Sheet | `タスク一覧`; row 1 internal IDs, row 2 labels, data begins row 3 |
| Task columns | exactly 50 ordered canonical columns |
| Authority store | 21-column protected hidden `Task Authority Ledger` |
| Automation default | `OFF` |
| Source authority | this repository under `implementation/GoogleSpreadsheet/` |

Task row 1/2 and ledger row 1/2 are control-plane schema. Setup and the edit
handler restore canonical headers; data cannot be promoted into headers.

### Setup Ledger bootstrap ordering

Before any Setup authority validation that requires Ledger hidden/protection
state, S20 applies canonical schemas and Setup explicitly reasserts canonical
Ledger protection plus hidden visibility. Only then can the shared validator
run. S30 repeats the reassertion idempotently, and a completed Setup rerun does
so before its pre-loop validation. A protection/visibility write failure is a
safe S20 failure and must leave S20 unrecorded. This bootstrap privilege does
not extend to diagnostics, Worker, Review, Calendar, Migration, or edit
restoration; none may silently repair the control plane or trust a raw row,
note, or snapshot as authority.

### Quick Diagnostic runtime compatibility

Quick Diagnostic is read-only. It derives every Task checkbox expectation from
the canonical validation plan (five current columns), verifies the exact
rows-1–2 / 50-column Task header protection contract, and permits `false` only
in an identity-empty cell that has the canonical checkbox validation. The
Dashboard accepts only the Setup-owned sheet/header protection control plane
and the exact `DASHBOARD_LEGACY_SEED_ROWS` before explicit refresh. It rejects
foreign controls, data, formulas, notes, names, merges, hidden state, and
non-default data-block formatting. This is a compatibility correction, not a
repair/write permission or a status upgrade.

### Dashboard native Protection and surface compatibility

Dashboard Protection ownership requires a non-null Spreadsheet owner, a
non-null effective user equal to that owner, and `canEdit() === true`.
`getEditors()` may be empty for the proven implicit owner or contain exactly
that owner. Null owner / Shared Drive, different effective user, blank or
foreign editor, warning-only mode, domain edit, target audience, duplicate or
wrong description/geometry, unprotected ranges, and foreign range Protection
remain fail-closed.

The pre-refresh/owned surface inspector uses a closed enum for sheet/header/
foreign Protection, named range, value, formula, validation, note, merge,
hidden row/column, background, font, number format, and seed/marker conflicts.
It emits only those codes and whitelisted counts. User identities, cell
contents, formulas, notes, range addresses, IDs, and URLs are never diagnostic
output. This is the `PHASE8B-DASHBOARD-01` contract.

### Dashboard deterministic number-format compatibility

The exact 17×3 Dashboard system block has one deterministic plain-text
contract. Setup alone, immediately before S90, may establish it after the
canonical schema, owner-proven protections, exact seed/owned versioned state,
and every non-format surface check are safe. Empty, ambiguous, foreign, or
user-owned surfaces fail closed. Quick and Deep Diagnostic remain read-only;
blank, default, or arbitrary system formats are not generally accepted.

## 3. Authority architecture

The visible Task Sheet is the business-facing projection. The ledger is the
technical authority for integrity and recovery. It contains a committed active
slot, an inactive alternate slot, generation/hash metadata, a physical-row
hint, and `PREPARED` transaction fields.

### 3.1 Canonical snapshot

- Recursive object-key ordering makes hashes independent of JSON key order.
- Date values have deterministic ISO representation.
- Formula-looking text is guarded before snapshot/hash projection.
- Authority self-fields are excluded from the snapshot.
- Snapshot size and ledger read/expansion are bounded; overflow fails closed.

### 3.2 Write protocol

1. Validate the existing authority; never trust a snapshot cell or note.
2. Write the next snapshot to the inactive ledger slot as `PREPARED`.
3. Write the complete visible Task row once.
4. Promote the prepared slot to committed and clear transaction metadata.
5. On an ambiguous exception, re-read durable state and deterministically
   promote, roll back, or isolate. Never infer success from an exception.

A first insert with a blank Task row and no prior committed slot can discard its
empty prepared record after a proved rollback. Other incomplete evidence is
`UNRECOVERABLE`.

### 3.3 Authority states

| State | Operational behavior |
|---|---|
| `COMMITTED` Task / `ACTIVE` ledger | Eligible after successful validation. |
| `PREPARED` | Recover only through durable transition rules. |
| `QUARANTINED` | Invalid authority; excluded from operations. |
| `UNRECOVERABLE` | Ambiguous or duplicate authority; excluded from operations. |
| `ORPHANED` | Ledger record has no physical Task. Retain ledger evidence, clear live hint, never recreate the row. |

## 4. Shared validation

`validateAuthority` is used by Task reads/writes, edit restoration, Setup,
Migration, diagnostics, Worker, Review, and Calendar consumers. Context
indexes (`task_id`, `origin_key`, `stable_thread_key`) are populated only
after an individual Task has passed validation.

Quick/Deep Diagnostics specify all recovery switches as false. Setup may
recover prepared writes, rebind relocation, isolate invalid rows, and persist
orphans. No path regenerates current authority from a live raw row or editable
snapshot.

## 5. Movement, deletion, and copying

- A valid moved/sorted row is `RELOCATABLE`. Only the ledger physical hint is
  rebound; its committed snapshot, generation, hash, and Task payload remain
  unchanged.
- A deleted Task is observed from the ledger side and becomes `ORPHANED`.
- A copied raw row cannot steal the original record. It gets a detached
  `qrow_*` ledger record and is `QUARANTINED` or `UNRECOVERABLE`.
- Outbox jobs for any excluded authority are safely cancelled. Calendar I/O and
  Task acknowledgement do not run for them.

## 6. Migration 3

Migration accepts only a strict Schema 2.5 legacy note anchor for one-time
authority seeding. It proceeds in bounded chunks, keeps a checkpoint without
persisting raw Task IDs, and uses a separate bounded Task-ID observation pass
before ledger-only orphan reconciliation. If the budget expires during
observation, it checkpoints and restarts the read-only observation pass on the
next invocation; it does not classify unseen Tasks as missing.

Current Schema 2.6 rows with missing authority, duplicate data, drift, or
physical deletion are never silently rebaselined.

## 7. Test and publication boundary

Local tests run against an in-memory Apps Script facade. They provide
regression evidence for failure injection but do not establish real Google
Workspace behavior. The source commit excludes release packages. Candidate 8B
and 8C packages are generated only after final Source provenance exists and
are verified for source parity, checksums, inventory, and secrets.

The detailed requirement mapping is in
`docs/V2_REQUIREMENTS_TRACEABILITY.md`; the root publication matrix is
`docs/R4_VERIFICATION_MATRIX.md`.

