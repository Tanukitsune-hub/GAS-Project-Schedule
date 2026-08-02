# Calendar Outbox Authority-Loss Compensation Protocol

Contract: Code `2.8.11-prepilot` / Schema `2.6` / AI Schema `2.0` /
Migration `3`
Current corrective-integration gate:
`READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION`. Instruction 0010 independently
proved exact 23-file canonical pull-back parity on the approved new blank
personal-synthetic target. One operator-reported first-time Setup result is
`COMPLETE`, but it is not a standalone API-executable diagnostic and does not
establish Phase 8B overall PASS. Instruction 0011 passed personal Cloud/OAuth
and exact MYSELF-only runtime overlay parity, but its sole standalone runtime
attempt stopped as `BLOCKED_BY_AUTH` without a bounded result. The corrected
versioned executable was not retested; functional acceptance is
`ATTEMPTED_FAILED_CLOSED`. Instruction 0013 proved that versioned binding, but
its sole deployed-version diagnostic call returned no bounded body and closed
as `REMOTE_QUICK_DIAGNOSTIC_FAILED_CLOSED` /
`VERSIONED_RUNTIME_FUNCTION_NOT_FOUND`. No retry is permitted and
`REVIEW_REQUIRED` remains. Company handoff is
`NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW`. Fixed T10 and T11 are
immutable historical evidence, T11 is `T11_SUSPENDED`, and there is
`NO_ACTIVE_COMPANY_TRANSFER`. One observed Setup S00-S99 run is historical;
Calendar reconciliation remains subject to separate future approval and
`NOT_EXECUTED`. Instruction 0005 is `SUPERSEDED_NOT_EXECUTED`.

The v2.8.11 bounded Diagnostic summary also does not alter this protocol. It
is a read-only UI/result visibility contract: all Calendar API and repair
Booleans remain false, and a T1-01 recheck cannot reconcile Calendar intent or
write an authority record.

## Purpose and boundary

The Google Sheet Task row is a business projection. The protected hidden
`Task Authority Ledger` is the only technical authority. The Calendar Outbox
is durable *reconciliation intent* and must never become an authority source.

This protocol closes the failure window between a final authority check and a
Calendar mutation. It does not create a new Task authority, does not restore a
Task row, and does not permit a snapshot cell, note, or raw visible row as a
fallback.

Ledger protection and hidden visibility are Setup bootstrap controls, not a
Calendar recovery mechanism. Calendar never repairs a visible or unprotected
Ledger; it relies on the same fail-closed validator after Setup has established
the control plane.

The v2.8.10 S90 Dashboard module-contract and write-visibility guard does not
change this Calendar protocol. A module mismatch or Dashboard format
postcondition failure stops Setup before S90/S99 completion; it grants no
Calendar I/O, outbox rewrite, trigger activation, or authority recovery path.

The protocol applies only to a deterministic Work OS-owned Event ID. It never
deletes an Event unless ownership verification succeeds. The 0001 observation
establishes only Calendar provisioning S60 and owner edit-trigger creation S80
as Setup stages. Functional Calendar reconciliation, functional trigger
behavior, lock contention, OAuth, and Provider behavior remain
`NOT_EXECUTED`.

## Durable target types

| Target type | Meaning | Permitted terminal transition |
|---|---|---|
| `DEADLINE_CALENDAR` | Ordinary reconciliation intent | normal `DONE` / retry policy |
| `DEADLINE_CALENDAR_ARMED` | A short-lock final validator accepted the ledger authority and external I/O may have begun | normal completion, or authority compensation after an authority-loss conflict |
| `DEADLINE_CALENDAR_AUTHORITY_COMPENSATION` | Authority was excluded after the Outbox had been armed or external I/O may have succeeded | `CANCELLED` after confirmed owned-event reconciliation; `DEAD` on foreign/unsafe Event |

`error_code` remains an error description. It is never overloaded to carry the
armed or compensation intent. Manual retry preserves the target type.

## State transition and failure matrix

| Point | Durable state before the point | Required action | Recovery / rollback outcome |
|---|---|---|---|
| Claim selected | `PENDING` or `RETRY`, ordinary target | claim using the Outbox CAS fingerprint | stale claim cannot execute |
| Before final revalidation | claimed job; no arm | acquire short Script Lock and read Task through the shared authority validator | invalid / orphaned / quarantined Task transitions to `CANCELLED`; **zero Calendar I/O** |
| Arm persisted | `DEADLINE_CALENDAR_ARMED`, deterministic Event ID, current claim fingerprint | persist the arm under the same short lock before releasing it | crash before or after Calendar I/O leaves a durable recovery clue |
| Calendar I/O succeeds, Task remains authority-valid | armed record and owned Event | commit exact task/outbox CAS acknowledgement | normal target and terminal `DONE` as appropriate |
| Calendar I/O succeeds, authority becomes excluded before commit | armed record, deterministic Event may exist | create/update Outbox as `DEADLINE_CALENDAR_AUTHORITY_COMPENSATION`, desired action `DELETE` | no Task patch; later worker reconciles only the owned Event and ends `CANCELLED` |
| Crash after I/O before commit | armed record remains due after claim expiry | re-read authority and deterministic Event | excluded authority schedules or executes owned-event-only compensation; valid authority follows idempotent normal reconcile |
| Concurrent edit makes Task ineligible while an arm exists | concurrent enqueue must retain arm and deterministic Event ID | leave current row `PENDING`; do not erase external-I/O evidence | replay reconciles the owned Event rather than losing the intent |
| Compensation sees foreign / unowned Event | compensation target plus failed ownership test | do not delete or patch the Task | retain compensation target, record safe error, become `DEAD`; manual retry remains compensation |
| Later Task edit / forced re-enqueue while compensation is due | existing compensation target and deterministic Event ID | do not replace it with normal `NOOP` / `DONE`, even if the Task is again authority-valid | the owned-event-only cleanup remains due until it safely cancels or fails closed |

## Safety invariants

1. The final revalidation uses the same fail-closed validator as Setup,
   diagnostics, Migration, edit restore, Worker, Review, and normal Task
   writes.
2. A known authority exclusion before I/O is a direct `CANCELLED` transition;
   the Calendar gateway is not called.
3. External side effects are represented by `DEADLINE_CALENDAR_ARMED` before
   the side effect, not inferred later from an error string or a Task row.
4. Compensation is limited to the deterministic Event ID and an ownership
   check. A foreign Event is never deleted.
5. Compensation never writes a Calendar acknowledgement to the Task row,
   because that row no longer has valid authority.
6. Compensation has priority over later Task enqueue. A reappeared or changed
   Task cannot invalidate its Outbox CAS because compensation has no Task
   patch; normal reconciliation may run only after the owned cleanup reaches a
   terminal safe result.
7. The added final revalidation is bounded: the worker uses at most one
   additional Task and Outbox index read beyond the pre-existing claim /
   prepare / commit path.

## Local evidence

`prepilot_calendar_cas_failure_injection_test.js` contains F016 coverage for:

- authority loss after prepare and before execute (no external I/O);
- loss after final revalidation, then owned-event compensation;
- crash after create before commit;
- concurrent ineligibility while an armed job exists;
- refusal to delete a foreign Event; and
- preservation of the compensation marker across manual retry; and
- preservation across a later authority-valid, ineligible forced re-enqueue.

`phase4_performance_test.js` asserts the bounded additional reads. These are
local fake-runtime checks only, not a declaration of a real Workspace pass,
Phase 8B PASS, Phase 8C GO, production readiness, or pilot readiness.
