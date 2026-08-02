# Task Authority Protocol — Code 2.8.11-prepilot

| Contract | Value |
|---|---|
| Code | `2.8.11-prepilot` |
| Task Schema | `2.6` / 50 columns |
| AI Schema | `2.0` |
| Migration | `3` |
| Authority store | protected hidden `Task Authority Ledger` / 21 columns |
| Current gate | `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION`; Instruction 0010 independently proved exact 23-file canonical pull-back parity on the approved new blank personal-synthetic target. One operator-reported first-time Setup result is `COMPLETE`, including its internal S90 gate, but it is not a standalone API-executable diagnostic and does not establish Phase 8B overall PASS. Personal Cloud/OAuth, MYSELF-only runtime overlay parity/deployment, and the guarded standalone read-only runtime invocation are `NOT_EXECUTED`. T10 and T11 are immutable historical evidence, T11 is `T11_SUSPENDED`, and `NO_ACTIVE_COMPANY_TRANSFER` remains explicit. Company handoff is `NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW`; functional acceptance remains `NOT_EXECUTED`. |

## Diagnostic bounded-acceptance summary

Quick and Deep Diagnostic preserve their read-only contract. Before any
redacted and capped detail payload, v2.8.11 exposes a bounded summary with
sorted unique WARN/FAIL check IDs, completeness flags, counts, explicit
no-side-effect Booleans, Task physical 50-column/header states, and Ledger
physical 21-column/hidden/protected/validator states. It never copies values,
formulas, notes, ranges, Sheet names, identities, IDs, URLs, locale, or raw
detail into this summary. A malformed, duplicate, or overflowed ID list is
`REVIEW_REQUIRED`; an absent aggregate is `UNKNOWN`. Neither outcome repairs
the ledger, task row, Dashboard, Calendar outbox, or version properties.

## Quick Diagnostic runtime control plane

The diagnostic is read-only and does not repair a Workbook. The Task header
control plane is exactly one owner-only, non-warning, non-domain-editable
protection covering rows 1–2 and all 50 Task columns. Its checkbox expectations
come only from `validationPlanForSheet(Tasks)`, including the hidden
`calendar_reconcile_required` column. An identity-empty physical row may have
canonical checkbox `false` values only when that row's validation is the same
canonical checkbox contract; all other content remains a failure. The exact
Dashboard Setup sheet/header protections and exact three-row seed are handled
by the Dashboard ownership protocol, never by a raw-data fallback.

## Dashboard Protection and surface contract

Dashboard ownership is not inferred from `getEditors().length`. The runtime
must prove a non-null Spreadsheet owner, a non-null effective user equal to
that owner, and `Protection.canEdit() === true`. The explicit editor list may
be empty (`OWNER_IMPLICIT_CAN_EDIT`) or contain exactly that owner
(`OWNER_EXPLICIT_EDITOR`). A null owner / Shared Drive, different effective
user, blank or foreign editor, warning-only Protection, domain edit, target
audience, duplicate/wrong Protection, non-empty unprotected range, or foreign
range Protection fails closed.

The read-only Dashboard inspector separates sheet/header/foreign range
Protection, foreign named range, value, formula, validation, note, merge,
hidden row/column, background, font, number format, and seed/marker contracts.
It returns only a closed reason/subreason enum and whitelisted counts. It does
not return identities, values, formulas, notes, range addresses, IDs, or URLs.
The exact three-row Setup seed and the explicit-refresh owned marker are the
only accepted content states. This contract is `PHASE8B-DASHBOARD-01`.

## S90 Dashboard write-visibility and module contract

The v2.8.10 S90 path adds no Task-authority fallback. Before the Setup-owned
Dashboard format write, `WorkOsConfig`, `WorkOsSetup`, and `WorkOsDashboard`
must expose one matching deterministic module-contract identifier. A missing
or mismatched identifier fails as `E_MODULE_VERSION_SKEW` before any write.

If strict ownership and non-format surface proof permits normalization, Setup
writes only the exact 17×3 system block, calls `SpreadsheetApp.flush()`,
reacquires a fresh exact Range, and verifies the canonical postcondition over
all 51 cells. Flush unavailable, flush failure, or a stale/noncanonical
postcondition fails closed as
`E_DASHBOARD_NUMBER_FORMAT_POSTCONDITION`. The safe result contains only a
closed normalization state, write/flush/postcondition Booleans, checked-cell
count, and noncanonical count. Quick and Deep Diagnostic remain read-only and
perform neither write nor flush.

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

## Setup-owned control-plane establishment

The Ledger invariant applies before authority validation, including a fresh
workbook with no Task records. `2.8.6-prepilot` therefore assigns only Setup
the bootstrap write that ensures canonical Ledger protection and hidden
visibility before S20 authority validation. It is idempotent and has these
boundaries:

| Setup path / failure point | Required action | Safe result |
|---|---|---|
| Fresh S20 after canonical schemas | establish Ledger protection, hide Ledger, verify postcondition, then validate authority | no manual hide is required; S20 may complete only after the control plane exists |
| Observed S00/S10 partial state | execute the same Setup-owned operation before validation | resume without recreating Sheets, Task records, or authority |
| Protection or visibility write failure | throw deterministic S20 control-plane failure before stage persistence | S20 remains incomplete and the validator stays fail-closed |
| S30 layout application | reassert protection and hidden visibility idempotently | layout rerun does not duplicate protections or change authority |
| Completed Setup rerun | reassert before pre-loop authority validation | protects against a visibly drifted Ledger without granting runtime repair rights |

Worker, Review, Calendar, diagnostics, Migration, and edit restoration do not
call this bootstrap operation. It does not trust a Task raw row, cell note, or
`authoritative_snapshot_json`, and it does not create or rebaseline a ledger
record.

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
use an in-memory fake Apps Script environment. Independent functional/fault
validation of real Google Workspace Sheet protection, trigger, lock, Gmail,
and Calendar behavior remains `NOT_EXECUTED` beyond the observed Setup-stage
facts. `phase8b_setup_ledger_visibility_test.js` adds
fake-runtime coverage for fresh S20 ordering, the observed S00/S10 partial
resume, visibility/protection failures, S30, completed rerun, and no-fallback.

P5 publication evidence for A5.2/B5.2 and fixed target `3442ac...` remains
historical evidence. The retained A5.3/B5.3 candidate exposed a second High
re-enqueue race during independent source review. Final R5 Source A5.4
`6c4f737...` and direct-child Release B5.4 `3e57906...` preserve compensation
across later forced re-enqueue. P6 normally published that correction and a
fresh clone reran the local/static source and package checks. Historical P7
then exposed a raw-checkout-byte transfer checksum portability defect;
P8 published the canonical UTF-8 text checksum correction and a fresh clone
passed its verifier. P9 `ab6b1db...` was then normal-pushed, resolved from
GitHub, and independently rechecked in a new fresh clone. Those facts remain
historical, but the exact P10 package then failed first-time Setup with
`E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN`; `PHASE8B-SETUP-01` made the corrective
package-generation gate `PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER`. The separately
published and fresh-clone verified T6.1 2.8.6 transfer ref is historical
evidence only. The v2.8.7 A7/B7/C7/T7 chain completed its independent
source/release/transfer/fresh-clone verification but is now historical because
`PHASE8B-DASHBOARD-01` supersedes T7 as an execution target. Source A8
`4140054b03c850f4a1e669b3aa562b305ef78bf5`, direct-child Release B8
`a17d34422ed521cee81340902d9a19e2da372201`, and fixed transfer T8
`69f843f6ea426ccb45d721a40508a35b0a59795d` completed normal publication,
GitHub resolution, and detached HTTPS fresh-clone verification. The later
v2.8.9 A9/A9.1/B9.1/T9 chain is also retained as immutable historical
evidence. The repeated 51-cell finding supersedes T9 as an execution target.
The v2.8.10 Source-stage A10/B10/T10/E10 pending state and
`PHASE8B_SANDBOX_NO_GO_DASHBOARD_WRITE_VISIBILITY` gate are historical.
Instruction 0005 is `SUPERSEDED_NOT_EXECUTED`; T11 is suspended and no
Company-PC carriage or Quick Diagnostic re-observation is authorized. The
current prerequisite is a personal synthetic local clasp validation gate.
