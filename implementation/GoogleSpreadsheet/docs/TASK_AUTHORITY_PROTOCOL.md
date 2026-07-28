# Task Authority Protocol — Source Copy

Code `2.8.5-prepilot` · Schema `2.6` · AI Schema `2.0` · Migration `3`  
Current corrective-integration gate: `NO-GO_REMOTE_PUBLICATION` pending R5
normal publication and fresh-clone proof

The canonical publication-facing protocol is
`../../docs/TASK_AUTHORITY_PROTOCOL.md`. This source-copy summary is kept
with the Apps Script modules so release and static checks can trace the
implementation without using a legacy external context.

## Contract

- `タスク一覧` is the business workflow projection; the protected hidden
  21-column `Task Authority Ledger` is the sole technical recovery authority.
- The ledger uses versioned Slot A/Slot B with `PREPARED` / `COMMITTED`
  transaction metadata. A full Task-row write happens once between those
  durable states.
- Canonical JSON ordering, Date normalization, formula guarding, self-field
  exclusion, snapshot limits, and bounded ledger reads are mandatory.
- Existing Schema 2.6 insertion-order hashes remain valid only when the same
  protected ledger payload verifies them; every new generation is canonical.
- Snapshot cells, notes, and live raw rows are never current Schema 2.6
  authority fallback sources.
- A Review decision is event input only: exactly one selected decision cell is
  captured before a ledger-derived row is reconstructed. Other raw drift is
  restored or isolated and never supplies a Task ID or authority payload.
- Missing, copied, duplicate, corrupt, or ambiguous authority is isolated.
  `ORPHANED` retains ledger evidence but clears its live physical hint; no
  code recreates a deleted Task from a snapshot. Repeated copied-row isolation
  reuses its detached `qrow_` record.
- When editor details are available, only the effective user may remain on the
  authority ledger protection; otherwise validation fails closed.
- Setup may repair/rebind/isolate; Quick and Deep Diagnostics are explicitly
  read-only. Migration uses bounded row validation and bounded Task-ID
  observation before shared ledger-only orphan reconciliation.
- Worker, Review, and Calendar operate only on valid authority. A pending
  outbox job for an excluded Task is cancelled without external Calendar I/O.
- Calendar also performs a short-lock final authority revalidation immediately
  before external I/O. A valid job is durably armed with
  `DEADLINE_CALENDAR_ARMED`; authority loss after that arm becomes
  `DEADLINE_CALENDAR_AUTHORITY_COMPENSATION`, which may delete only the
  deterministic, verified-owned Event and never writes a Task acknowledgement.
  A later Task enqueue cannot replace due compensation with normal
  `NOOP` / `DONE`; compensation uses only its Outbox CAS because it has no
  Task patch.

The canonical state/failure matrix is
`../../docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`. The F016 local
fault-injection cases cover pre-I/O exclusion, post-I/O compensation, crash
recovery, concurrent ineligibility, foreign-event refusal, and retry marker
preservation, including preservation across an authority-valid ineligible
forced re-enqueue.

Local fake-runtime tests are evidence only. Real Google Workspace behavior is
`NOT_EXECUTED`; this document does not declare Phase 8B GO/PASS, Phase 8C GO,
production ready, or pilot ready.
