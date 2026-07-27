# Task Authority Protocol — R4 / Code 2.8.5-prepilot

## Purpose and scope

This design fixes the R4 trust boundary for the `タスク一覧` sheet.  A visible
Task row is a projection for operators; it is not, by itself, authority.  The
user-visible `authoritative_snapshot_json` projection and every cell note are
never used as a fallback source of truth.

The protocol is intentionally fail-closed.  When it cannot prove a Task row
against independently stored authority, it restores from a previously
committed record where possible or marks the row `QUARANTINED`/
`UNRECOVERABLE`.  It does not silently trust a live row, a user-modified
snapshot cell, or a newly copied row.

Versions covered by this note:

| Item | Value |
| --- | --- |
| Code | `2.8.5-prepilot` |
| Task Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Highest release status | `READY_FOR_INDEPENDENT_REAUDIT` |

## Options considered before implementation

| Option | Strength | Failure/recovery limitation | Decision |
| --- | --- | --- | --- |
| Protected hidden ledger, one current snapshot | Separates authority from the visible Task row | A ledger update and Task-row update still leave an ambiguous interrupted state | Rejected as insufficient by itself |
| Visible snapshot cell plus cell note mirror | Easy to inspect | Both values are user-observable and a `setValues` then `setNote` sequence is unmarked, non-atomic double-write | Rejected |
| Append-only event journal | Strong audit history | Requires compaction, ordering, and a separate materialized-state recovery design beyond the bounded remediation scope | Not selected |
| Protected hidden ledger plus versioned two-slot record | Independent store, bounded read, an old committed slot survives a prepared write, and every interruption has deterministic recovery | Requires canonical ledger schema, validation, and quarantine handling | **Selected** |

The selected `Task Authority Ledger` sheet is hidden and owner protected.  It
stores a Task identity, physical-row hint, control state, active slot, committed
generation/hash, Slot A and Slot B snapshots, and PREPARED transaction metadata.
It is not a substitute for Google Workspace access control; protection is
defense in depth.  Trust comes from the independent record and canonical hash,
not from visibility alone.

## Authority invariants

1. A committed authority record has `control_state=ACTIVE`,
   `transaction_state=IDLE`, an `active_slot`, and a matching
   generation/hash/snapshot in that slot.
2. The visible Task row must exactly equal the canonical row reconstructed from
   the active slot, including control fields.  The visible snapshot cell is
   regenerated as a projection and is excluded from ledger authority input.
3. `PREPARED` contains a valid next slot and its declared base
   generation/hash.  A promotion proves that the base is still the committed
   slot before changing `active_slot`.
4. A missing, malformed, duplicate, mismatched, or ambiguous record is never
   replaced from the visible row or snapshot cell.
5. `QUARANTINED` and `UNRECOVERABLE` Task rows are excluded by the common
   validator from operational Task reads, Worker processing, Review actions,
   and Calendar reconciliation.
6. Existing Schema 2.5 rows may be seeded only from their independently stored
   legacy note anchor during Migration 3.  The migration compares the live row
   with that anchor; it does not manufacture authority from live state.

## State transition and fault matrix

| Step / durable state | Normal action | Failure point | Deterministic recovery | Rollback / quarantine rule |
| --- | --- | --- | --- | --- |
| `IDLE` / committed Slot A or B | Validate visible row against the active slot | Ledger missing, schema invalid, missing identity, duplicate record | None; evidence is insufficient | Mark/retain `QUARANTINED` or `UNRECOVERABLE`; do not use snapshot-cell fallback |
| `PREPARED` / old slot still committed | Write the next snapshot to the inactive slot plus base generation/hash and operation ID | Ledger write fails before durable PREPARED | No Task write is attempted | No visible row change; transaction is absent |
| `PREPARED` write reports an error after persistence | The old visible row still equals the committed slot, while the next slot is durable | On the next validator/recovery pass, re-read the ledger and roll back PREPARED | The old committed row remains operational after validation | Do not infer success from the exception; retry rollback once after a before-persist error, then quarantine only if the durable result remains ambiguous |
| `PREPARED` / next slot durable | Perform the **single** visible Task-row `setValues` write | Task write throws before or after server-side persistence | Re-read ledger and visible row.  If it equals prepared, promote; if it equals committed, roll back PREPARED; otherwise isolate | First insert with no committed slot and a blank Task row discards only that empty PREPARED record, reports `ROLLED_BACK_EMPTY`, and propagates the original write failure for retry; all other ambiguity is `UNRECOVERABLE` |
| Task row written / ledger still `PREPARED` | Promote next slot by setting active/committed generation/hash and clearing PREPARED fields | Promotion write throws before or after server-side persistence | Re-read durable record and Task row; retry the deterministic promotion once only if it is still PREPARED; otherwise accept the durable COMMITTED result | If neither canonical row is present, quarantine with a safe reason code |
| Committed visible row / ledger still `PREPARED` | Roll back the next slot and retain the old active slot | Rollback write throws before or after server-side persistence | Re-read durable record; retry rollback once only if it is still PREPARED; otherwise accept the durable COMMITTED old slot (or `EMPTY` only for a proved blank first insert) | If the row and ledger cannot be proved after the bounded retry, quarantine with a safe reason code |
| `IDLE` / new slot committed | Return successful write result | Later raw cell edit, paste, delete, or copied row | Common validator compares against active slot; valid drift is restored | Missing/duplicate/ambiguous authority produces a per-row quarantine record; healthy peers are restored independently |
| `QUARANTINED` or `UNRECOVERABLE` | No normal write, Worker, Review, or Calendar processing | Operator asks to resume | Require an explicit independently reviewed repair source (committed ledger backup or approved human repair package) | No automatic rebaseline and no automatic return to operational processing |

`setNote` is not part of this protocol.  The previous unmarked
`setValues → setNote` path is removed; authority commit has one visible-row
write surrounded by durable ledger PREPARED/COMMITTED metadata.

Calendar reconciliation is a separate cross-Sheet boundary.  The Task edit
commits its versioned reconciliation intent before Outbox enqueue.  If enqueue
succeeds but the exact-intent acknowledgement Task write fails, the handler
returns the edit result with a pending-recovery count, leaves the Task marker
durable, and lets bounded recovery acknowledge it later.  It never treats that
failed acknowledgement as either a completed Task write or a reason to
rebaseline authority.

## Shared validation and consumers

`WorkOsTaskRepository.validateAuthority` is the shared trust boundary.  It is
called by Setup, Quick Diagnostic, Deep Diagnostic, Task write/insert/update,
manual edit restoration, Migration 3, Worker operational reads, Review flows,
and Calendar reconciliation.  A caller may choose whether to recover a valid
PREPARED transaction or quarantine an invalid row, but it cannot choose a
different trust source.

For a multi-row edit, every selected row is validated before the event returns.
Rows with a valid/restorable authority record are restored from their own
committed slot.  A row without sufficient evidence receives an isolated
control record and a safe reason code; that isolated record must not corrupt
the valid authority record for another row sharing a copied Task ID.

## Header and migration rules

Task internal IDs in row 1 and display headers in row 2 are canonical schema
controls.  Any direct edit or paste crossing either row restores both canonical
header rows and then routes touched data rows through the same authority
recovery path.

Migration 3 is bounded and resumable.  It creates/normalizes the protected
ledger schema and Task headers before row conversion.  It accepts only an
independently stored Schema 2.5 legacy authority note as a one-time migration
anchor, verifies it against the live row, and otherwise quarantines/fails
closed.  Current Schema 2.6 missing authority is not seeded from any visible
projection.

## Audit evidence and limits

The local regression suite contains R4 fault injection for ledger PREPARED and
COMMITTED failures, Task-row write failures, multi-row quarantine/peer restore,
header restoration, migration pause/resume, and no-fallback behavior.  These
tests are local fakes only.  Real Google Sheets protection, trigger, LockService
and crash/restart behavior remain `NOT EXECUTED` until an independently approved
Workspace audit; this document does not authorize deployment, `clasp push`, or
Phase 8B/8C approval.
