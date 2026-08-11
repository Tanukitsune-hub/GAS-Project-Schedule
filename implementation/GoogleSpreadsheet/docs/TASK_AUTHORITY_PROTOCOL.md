# Task Authority Protocol - Code 2.8.16-prepilot

The authoritative protocol is `../../../docs/TASK_AUTHORITY_PROTOCOL.md` and
is bound to Code `2.8.16-prepilot`, Schema `2.6`, and Migration `3`.

This implementation copy is intentionally a pointer. The protected hidden
21-column `Task Authority Ledger` is the only trust anchor for persisted Task
rows. A visible row, snapshot, note, or event value cannot create authority.

The protocol remains a two-slot `PREPARED` / one Task-row write / `COMMITTED`
transaction. Recovery promotes or rolls back only from durable ledger
evidence; missing, malformed, stale, duplicate, or conflicting authority is
quarantined or orphaned. Review, workers, diagnostics, migration, and Calendar
consume only validated operational Tasks.

The local fake-runtime suites cover these rules. Native Sheet visibility,
protection, notes, triggers, locks, quotas, and concurrency remain separate
controlled validation gates.
