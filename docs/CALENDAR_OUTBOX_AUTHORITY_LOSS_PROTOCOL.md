# Calendar Outbox and Authority-Loss Protocol — Code 2.8.13-prepilot

## Invariant

Google Sheets Task state is authoritative. Calendar is an auxiliary projection
of eligible important deadlines. Every Calendar action is derived from a
versioned durable Task intent and must be reconciled against current Task
authority before and after external I/O.

## Intent lifecycle

1. A controlled Task commit records `calendar_reconcile_required` and advances
   `calendar_intent_version` before enqueue.
2. Enqueue creates or updates one deduplicated Outbox job for that exact intent.
3. Successful enqueue acknowledges only the exact current intent version.
4. Missing Outbox, append failure, lock timeout, or interruption leaves the
   Task intent durable for bounded recovery.
5. Recovery reconstructs create/update/delete/no-op work from the current
   authoritative Task without rerunning Gmail or AI stages.

## Execution boundaries

- Before I/O, the worker revalidates Task authority, eligibility, job
  fingerprint, row/business version, and ownership.
- After I/O, it revalidates before committing the observed result.
- A stale result never overwrites a newer Task or Outbox state.
- CREATE is armed before I/O so a crash after event creation can reconcile the
  owned event instead of creating a duplicate.

## Authority loss and compensation

If authority or eligibility is lost after owned external I/O, the Outbox
retains an authority-compensation target. Later re-enqueue cannot erase that
only cleanup path. Compensation acts only on an event proven to carry this
system's Task and instance markers; foreign or ambiguous events fail closed.

Manual retry resumes from the durable Outbox/dead-letter stage and does not
repeat classification or Task creation. Retry/dead-letter metadata is bounded
and redacted.

## Local evidence and external boundary

`prepilot_calendar_cas_failure_injection_test.js`, the Phase 4 suites, and the
recovery suites cover enqueue/ack gaps, stale CAS, crash-after-create,
authority loss, compensation persistence, duplicate suppression, and no-op
behavior against the real integrated `.gs` source in local fakes.

Real Calendar CRUD, marker search, eventual consistency, quotas, OAuth,
LockService, and trigger behavior remain `NOT_EXECUTED`. Work 0002 performs no
Calendar or Google operation.
