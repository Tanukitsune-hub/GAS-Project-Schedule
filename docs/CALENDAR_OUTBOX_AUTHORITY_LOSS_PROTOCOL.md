# Calendar Outbox and Authority-Loss Protocol - Code 2.8.18-prepilot

Sheets Task state is authoritative. Calendar is an auxiliary projection of
eligible, important deadlines. Every action is derived from a versioned,
durable Task intent and is revalidated against current authority before and
after external I/O.

Enqueue creates or updates one deduplicated Outbox job. A missing append,
lock timeout, interruption, stale result, or authority loss remains durable
and recoverable. Compensation acts only on an event proven to carry this
system's deterministic ownership markers; foreign or ambiguous events fail
closed.

Local failure-injection and recovery suites cover these rules. Real Calendar
CRUD, Gmail, OAuth, triggers, locks, quotas, and Work 0031 runtime operations
remain `NOT_EXECUTED`. Work 0031 does not invoke Calendar or any Apps Script
function.
