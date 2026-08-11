# Task Authority Protocol 窶・Code 2.8.15-prepilot

## Contract

| Field | Value |
|---|---|
| Code | `2.8.15-prepilot` |
| Schema | `2.6` |
| Migration | `3` |
| Task columns | `50` |
| Ledger columns | `21` |
| Gate | `READY_FOR_CONTROLLED_SANDBOX_VALIDATION` |

The Task Authority Ledger is the only trust anchor for persisted Task rows.
The live row, `authoritative_snapshot_json`, cell notes, and event raw values
are editable observations and can never create authority.

## Record model

Each authoritative record binds:

- Task identity and physical-row hint;
- canonical payload hash and hash version;
- committed generation and optional prepared generation;
- transaction state (`IDLE` or `PREPARED`);
- committed and prepared canonical payloads;
- control state for valid, orphaned, or isolated/quarantined records.

Canonical hashing sorts keys, excludes authority self-fields, and binds the
complete validated Task payload. Legacy ledger hashes may be read only when
the ledger itself validates; the next controlled write promotes them.

## Commit and recovery

1. Validate the current committed ledger record.
2. Write a PREPARED next generation with the candidate payload.
3. Write the complete Task row once.
4. Promote PREPARED to the committed generation.
5. If any boundary fails, recover or roll back from durable ledger state.

Recovery never consults an editable snapshot or note. A prepared state is
either completed when the Task row matches its canonical payload or rolled
back to the prior committed payload. Before/after-persist fault injection is
covered by `remediation_round4_test.js`.

## Validation states

- `VALID`: ledger, generation, hash, identity, schema, and row binding agree.
- `RESTORABLE`: trusted ledger payload can restore the observed row.
- `QUARANTINED`: authority is missing, malformed, stale, mismatched, duplicate,
  capacity-exceeded, unprotected, visible, or otherwise unsafe.
- `ORPHANED`: a durable record has no valid current Task-row binding.

Missing or invalid authority does not fall back to live/snapshot agreement.
Joint tampering therefore cannot self-authorize.

## Multi-row and header edits

An edit event is classified row by row. Valid peers are restored from their
ledger state even when another row is corrupt. Invalid rows are isolated and
quarantined with a domain-separated safe reference; raw Task values are not
written to the error record. Task row 1 internal IDs and row 2 Japanese labels
are restored from the schema before Task edits proceed.

## Consumers

Review, workers, diagnostics, migration, and Calendar logic consume only
operational Tasks whose authority validates. Diagnostics may inspect and
summarize invalid rows but remain read-only. Setup may perform explicit bounded
control-plane recovery; it never silently rebaselines current drift.

## Runtime boundary

The local fake-runtime regressions establish logic behavior only. Native Sheet
write visibility, hidden/protection/note semantics, edit event shape,
LockService, and concurrency require separately authorized controlled Sandbox
validation. No such action is authorized by this protocol.
