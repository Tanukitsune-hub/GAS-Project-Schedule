# Task Authority Protocol - Code 2.8.16-prepilot

## Contract

| Field | Value |
|---|---|
| Code | `2.8.16-prepilot` |
| Schema | `2.6` |
| Migration | `3` |
| Task columns | `50` |
| Ledger columns | `21` |
| Machine gate | `READY_FOR_CONTROLLED_SANDBOX_VALIDATION` |

The protected hidden `Task Authority Ledger` is the only trust anchor for
persisted Tasks. The live row, `authoritative_snapshot_json`, cell notes, and
event raw values are editable observations and can never create authority.

## Record and recovery model

Each record binds Task identity, physical-row hint, canonical payload hash,
committed/prepared generations, transaction state, and canonical payloads.
Writes validate the committed record, write `PREPARED`, write the complete row
once, and promote to `COMMITTED`. Recovery uses only durable ledger evidence.
Missing, malformed, stale, duplicate, or conflicting authority is quarantined
or orphaned; it is never silently rebaselined.

Review, workers, diagnostics, migration, and Calendar consume only validated
operational Tasks. Diagnostics remain read-only. Native Sheet protection,
visibility, notes, edit events, locks, quotas, and concurrency require a future
controlled Sandbox validation.
