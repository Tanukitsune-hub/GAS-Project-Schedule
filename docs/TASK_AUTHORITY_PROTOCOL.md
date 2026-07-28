# Task Authority Protocol — Code 2.8.5-prepilot

| Contract | Value |
|---|---|
| Code | `2.8.5-prepilot` |
| Task Schema | `2.6` / 50 columns |
| AI Schema | `2.0` |
| Migration | `3` |
| Authority store | protected hidden `Task Authority Ledger` / 21 columns |
| Current gate | `NO-GO_REMOTE_PUBLICATION` for the R5 corrective integration pending final remote proof |

## Selected design

Three approaches were considered:

1. A protected hidden ledger alone: durable but insufficient without an
   interrupted-write protocol.
2. A versioned two-slot snapshot protocol alone in visible Task cells: cannot
   protect authority from user edits or snapshot-cell tampering.
3. A protected hidden ledger containing two versioned slots and transaction
   metadata: selected.

The selected model makes `タスク一覧` the business-facing projection and the
ledger the independent technical authority. The ledger is hidden, has canonical
row 1/2 headers, and must have the canonical non-warning Sheet protection. If
the runtime can report hidden/protection details, an invalid contract fails
closed. Local fakes that cannot report a detail do not constitute real
Workspace verification.

## Invariants

1. Authority is read only from a valid active ledger slot.
2. Canonical snapshot JSON recursively sorts object keys, normalizes Date
   values, guards formula-looking text, and excludes authority self-fields.
   Existing Schema 2.6 insertion-order hashes are accepted only when the same
   protected ledger slot verifies them; every new generation uses canonical
   hashing and no visible value is consulted for this compatibility check.
3. Snapshot JSON larger than the configured safe cell size, a ledger above the
   bounded row budget, or a malformed ledger fails closed.
4. `authoritative_snapshot_json`, a cell note, and a live raw row are never a
   Schema 2.6 authority fallback.
5. Raw Task indexes are built only after successful authority validation.
6. A Review decision is event input only: when exactly one selected decision
   cell changes, its value is captured before ledger reconstruction and is
   committed against the ledger-derived row. Any other raw drift is restored
   or isolated; no raw Task ID or row is used to resolve authority.
7. `QUARANTINED`, `UNRECOVERABLE`, and `ORPHANED` records are non-operational.
   A copied-row detached `qrow_` record is reused on repeat isolation rather
   than appended again.

## State and fault matrix

| State / failure point | Durable state | Recovery / rollback | Result |
|---|---|---|---|
| Before `PREPARED` write | old committed slot only | No Task write is attempted | caller receives the write failure |
| `PREPARED` persisted, row still old | old committed plus next slot | re-read; roll back the prepared transaction only if old row is proven | old Task remains valid |
| Task row write ambiguous | `PREPARED` plus one of old/new visible row | re-read; promote only if prepared row is proven; otherwise roll back only if committed row is proven | bounded retry, otherwise isolate |
| `COMMITTED` promotion ambiguous | new visible row with `PREPARED` ledger | re-read and retry deterministic promotion once | valid new Task or isolate |
| First insert row write fails | no committed slot and blank physical row | discard only the empty prepared record | retry is safe |
| Row moved / sorted | committed slot matches at new row | rebind ledger hint only | no Task-row rewrite or new generation |
| Row deleted | active ledger record has no observed Task ID | mark `ORPHANED`, clear physical hint, retain safe audit metadata | never recreate from snapshot |
| Duplicate / missing / invalid authority | evidence conflicts or is absent | durable `QUARANTINED` / `UNRECOVERABLE` record | exclude Worker, Review, Calendar |
| Historic Schema 2.6 hash | protected slot has a valid insertion-order hash | validate the ledger payload only, then use canonical hashing at the next write | no silent rebaseline or quarantine |
| Calendar job claimed, before Calendar I/O | claimed Outbox row and Task ID only | take the short execution lock and revalidate the Task from the ledger | invalid authority becomes `CANCELLED`; no Calendar API call is allowed |
| Calendar I/O is about to begin | atomically armed Outbox (`DEADLINE_CALENDAR_ARMED`), deterministic Event ID, and claim fingerprint | retain the arm through crashes and competing enqueue | recovery must reconcile the deterministic owned Event before completing the job |
| Authority is lost after an armed write | durable authority-compensation target and owned deterministic Event ID | schedule `DEADLINE_CALENDAR_AUTHORITY_COMPENSATION` | delete only a confirmed owned Event; never acknowledge a Task patch |
| Compensation encounters a foreign Event | ownership verification fails | leave the Event untouched and retain the compensation target through `DEAD` / manual retry | fail closed; operator decides the next safe action |
| Later Task enqueue sees compensation | compensation target has not reached a safe terminal result | preserve the target, deterministic ID, and due state | no `NOOP` / `DONE` overwrite can strand an owned Event |

## Shared validator and consumers

`validateAuthority` is the fail-closed row validator. `validateAllTaskAuthorities`
and `reconcileMissingAuthorityRecords` provide row- and ledger-oriented passes.

- Setup may recover PREPARED work, rebind moved rows, quarantine invalid rows,
  and persist orphan classification.
- Quick and Deep Diagnostics use the same validator with all recovery and
  mutation switches explicitly disabled.
- Migration 3 validates each row in bounded chunks, re-observes Task IDs in
  bounded chunks, then uses the shared ledger reconciliation helper. It does
  not persist raw Task IDs in checkpoint properties.
- Task writes and edit restoration recover only from ledger evidence.
- When the runtime exposes protection editors, the ledger contract fails closed
  unless only the effective user remains an editor.
- Worker, Review, and Calendar use authority-aware operational reads. An
  existing outbox record for an excluded Task is cancelled with a safe reason;
  no Calendar external operation is attempted for it.
- Calendar performs one more short-lock authority revalidation immediately
  before external I/O. It durably arms the Outbox before I/O and, if authority
  is lost after the arm, schedules owned-event-only compensation instead of
  writing a Task acknowledgement. A later Task enqueue cannot overwrite an
  outstanding compensation record; its Outbox CAS is sufficient because the
  cleanup intentionally has no Task patch.

## Calendar authority-loss compensation

The Outbox is durable reconciliation intent, not authority. Its additional
armed and compensation target types make the interval around an external
Calendar write failure-recoverable without trusting a visible Task row. The
full state and recovery protocol is in
[`CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`](CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md).

## Migration rule

Schema 2.5 may seed a ledger record exactly once from an independently stored
legacy note anchor after strict comparison. Current Schema 2.6 corruption,
authority loss, or row deletion may not be repaired from a visible snapshot,
note, or raw row. A partial migration checkpoint resumes through bounded scans;
an incomplete Task-ID observation pass is never treated as evidence that all
previous rows are missing.

## Evidence and boundary

Round 4 and Round 5 local fault-injection tests cover two-slot failure points,
canonical hashing, validation-before-index, multi-row isolation, move/copy/
delete/orphan handling, bounded reads, hidden/protection contracts, Calendar
exclusion, authority loss before and after the final pre-I/O revalidation,
armed crash recovery, foreign-event refusal, and migration pause/resume. They
use an in-memory fake Apps Script environment. Real Google Workspace Sheet
protection, trigger, lock, Gmail, and Calendar behavior remain `NOT_EXECUTED`
pending independent re-audit.

P5 publication evidence for A5.2/B5.2 and fixed target `3442ac...` remains
historical evidence. The retained A5.3/B5.3 candidate exposed a second High
re-enqueue race during independent source review. Final R5 Source A5.4
`6c4f737...` and direct-child Release B5.4 `3e57906...` preserve compensation
across later forced re-enqueue and require their own normal non-force
publication and fresh-clone verification. Until that proof, the current
corrective integration remains `NO-GO_REMOTE_PUBLICATION`. After all remote
proof and the separate 8B-only transfer envelope are verified, the maximum
status may be only `READY_FOR_PHASE8B_SANDBOX_TRANSFER`; it is not Phase 8B
PASS, Phase 8C GO, production ready, or pilot ready.
