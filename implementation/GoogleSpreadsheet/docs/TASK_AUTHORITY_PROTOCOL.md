# Task Authority Protocol — Source Copy

Code `2.8.10-prepilot` · Schema `2.6` · AI Schema `2.0` · Migration `3`
Current corrective-integration gate:
`PHASE8B_SANDBOX_NO_GO_DASHBOARD_WRITE_VISIBILITY`; Source A10,
direct-child Release B10, fixed transfer T10, and evidence E10 are
`PENDING_A10`, `PENDING_B10`, `PENDING_T10`, and `PENDING_E10`. Real
Workspace retest remains `NOT_EXECUTED`. Historical A8/B8/T8 and
A9/A9.1/B9.1/T9 evidence is preserved and is not the current execution target.

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
- Setup alone establishes canonical Ledger protection and hidden visibility
  before S20 authority validation. The same idempotent control-plane operation
  is reasserted by S30 and a completed Setup rerun. A write failure leaves S20
  incomplete; Worker, Review, Calendar, diagnostics, Migration, and edit
  restoration receive no general repair permission.
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
- The Task header protection is one owner-only, non-warning, non-domain
  editable range over rows 1–2 / 50 columns. Quick Diagnostic obtains five
  checkbox expectations from `validationPlanForSheet(Tasks)` and treats
  identity-empty canonical checkbox `false` as a Sheets materialization only;
  all other raw content remains fail-closed.
- Dashboard pre-refresh ownership accepts only the exact Setup-owned
  Dashboard sheet/header protection and exact three-row canonical seed.
  Diagnostics neither write a marker nor repair an unsafe layout.
- Dashboard Protection access proves non-null owner/effective-user equality
  and `canEdit()`. It accepts either the implicit proven owner with no ordinary
  explicit editors or exactly the explicit owner. Shared Drive / null owner,
  different user, blank/foreign editor, warning-only, domain edit, target
  audiences, duplicate/wrong/overlapping protections, and unprotected ranges
  remain fail-closed.
- Dashboard surface checks return only closed reason/subreason enums and
  whitelisted counts for Protection, name, value, formula, validation, note,
  merge, hidden, background, font, number-format, and seed/marker contracts.
  They never return identity or Workspace content.
- Before an S90 Dashboard format write, Config, Setup, and Dashboard expose
  one matching v2.8.10 module-contract identifier. Skew fails as
  `E_MODULE_VERSION_SKEW` before the write.
- When a proven 17×3 block needs normalization, Setup writes once, flushes
  pending Spreadsheet operations, reacquires a fresh exact Range, and verifies
  the strict 51-cell postcondition. Flush unavailable/failure or a
  noncanonical reread fails as `E_DASHBOARD_NUMBER_FORMAT_POSTCONDITION`.
  Quick/Deep Diagnostic remain read-only and never flush to repair state.

The canonical state/failure matrix is
`../../docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`. The F016 local
fault-injection cases cover pre-I/O exclusion, post-I/O compensation, crash
recovery, concurrent ineligibility, foreign-event refusal, and retry marker
preservation, including preservation across an authority-valid ineligible
forced re-enqueue.

Local fake-runtime tests are evidence only. Real Google Workspace behavior is
`NOT_EXECUTED` for the corrected package; the historical P10 package failed
first-time Setup safely and is immutable evidence, not an executable transfer
target. This document does not declare Phase 8B GO/PASS, Phase 8C GO,
production ready, or pilot ready.
