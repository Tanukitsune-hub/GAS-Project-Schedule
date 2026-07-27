# Task Authority Protocol
# R4 Design Baseline for Code 2.8.5-prepilot

- Date: 2026-07-28
- Canonical repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Scope: R4-01 through R4-03 authority recovery design, with the header,
  diagnostics, migration and release consequences required by R4-04 through
  R4-06.
- Status: selected implementation design. It is not a deployment approval.

## 1. Decision

Adopt a **protected hidden Task Authority Ledger with a versioned two-slot
protocol**.

The ledger is the only authoritative source for a current Task. The Task row,
`authoritative_snapshot_json` cell and all existing cell notes are materialized
projections, not trust sources.

Schema 2.6 adds one hidden/protected ledger sheet and protected Task control
fields `authority_generation`, `authority_hash` and `authority_state`.
The control fields are useful locators and cross-checks but are not themselves
trusted if the ledger disagrees.

The 2.5 `WORK_OS_TASK_AUTHORITY_V2:` cell note is accepted only as a
strictly validated, legacy migration anchor for 2.5 -> 2.6. Code 2.6 runtime
does not read it as authority and does not write it.

## 2. Options considered

| Option | Partial failure recovery | Row move/delete resilience | Budget / calls | Owner-error resilience | Audit / rollback | Decision |
|---|---|---|---|---|---|---|
| Protected hidden ledger + two slots | Keeps an active committed slot while an inactive slot is prepared; recovery can finish or roll back deterministically | Uses committed Task identity, authority generation/hash and a row hint; moved rows can be rediscovered, deleted rows become orphaned rather than recreated | Batchable by contiguous ledger and Task ranges; bounded pause/resume | Ledger is protected/hidden and separate from editable Task cells | Generation, hashes, operation and safe quarantine code are retained | **Selected** |
| Two slots only in the Task row / snapshot cell | A single row write is simpler, but an owner can alter Task data and both slots together | Deleting or moving the Task row also loses the authority record | Low call count but no independent recovery source | Does not protect against simultaneous raw-row and snapshot edits | Rollback source is not independent | Rejected |
| Script Properties or append-only audit log | Properties have size/indexing limits; a log alone needs compaction and cannot efficiently locate all rows | Weak mapping to moved/deleted rows and poor batch scan behavior | Poor for many Tasks and Apps Script execution limits | Less visible, but limited audit query and repair tooling | Either storage limits or high recovery cost | Rejected |

The selected design stores only the existing payload-limited, sanitized Task
representation. It does not add raw mail bodies, credentials, tokens, real
Workspace IDs or private external content to the ledger or audit logs.

## 3. Authority model

### 3.1 Trust hierarchy

1. A valid active slot in the protected `Task Authority Ledger`
2. A validated prior active slot in that same ledger, for explicit rollback
3. An audited migration anchor or human-approved repair package, only through
   an explicit repair operation

The following are never a normal trust source:

- live raw Task row
- `authoritative_snapshot_json` cell
- a user-edited snapshot cell
- a missing, malformed or mismatched legacy note
- a stale row locator
- a generated value inferred from any of the above

### 3.2 Ledger record

Each ledger row is keyed by the committed Task identity and contains:

```text
task_id, origin_key, physical_row_hint
active_slot                         A | B
slot_a_generation, slot_a_hash, slot_a_snapshot_json
slot_b_generation, slot_b_hash, slot_b_snapshot_json
transaction_state                   IDLE | PREPARED
prepared_slot, base_generation, operation_id
control_state                       ACTIVE | QUARANTINED | UNRECOVERABLE | ORPHANED
quarantine_reason_code, updated_at
```

The hash is calculated from a canonical, sanitized Task projection. The hash
input excludes its self-referential hash field and the display snapshot cell.
The snapshot includes all restoreable business and management values, including
Task identity, Review state, Calendar metadata and durable Calendar intent.

### 3.3 Shared validator

All of Setup, Quick Diagnostic, Deep Diagnostic, Task writes, Migration,
edit restoration, Worker/Review/Calendar selection and explicit repair call
one validator with a mode:

```text
validateAuthority(row, ledgerRecord, mode)
  NORMAL_WRITE | EDIT_EVENT | RESTORE | MIGRATION_25_TO_26 | DIAGNOSTIC
```

The validator returns only a safe classification:

- `VALID`: active ledger slot, row generation/hash and projection agree
- `RESTORABLE`: valid active ledger slot exists but raw Task projection drifted
- `PREPARED_RECOVERABLE`: a prepared transaction can be completed or rolled back
- `QUARANTINED`: authority is missing, malformed, mismatched or unsafe
- `UNRECOVERABLE`: no safe identity or independent recovery evidence exists
- `ORPHANED`: committed authority exists but its Task row was deleted

No validator mode falls back to the Task snapshot cell or silently creates a
new trust anchor from raw values.

## 4. Two-slot write protocol

All Task mutation routes use one coordinator:

- new Task insert
- existing Task upsert
- manual edit
- Review ACCEPT, REJECT and explicit restage
- Calendar patch and Calendar intent acknowledgement
- multi-row restore
- Migration 2.5 -> 2.6

The coordinator performs the following sequence under the existing short
Script Lock. Gmail, AI and Calendar external I/O remain outside the lock.

```text
1. Validate current active authority
2. Construct and validate target projection
3. Write inactive ledger slot as PREPARED
4. Write complete Task row projection
5. Promote prepared ledger slot to active COMMITTED
6. Run non-authority side effects (review note, safe audit, outbox)
```

A batch coordinator groups compatible ledger rows and Task rows, checks a
soft execution budget before each batch and leaves explicit PREPARED records
for the next recovery run. It does not perform unbounded per-row service
calls.

## 5. Failure state machine

| Failure boundary | Ledger state | Task row state | Recovery / rollback rule |
|---|---|---|---|
| Before PREPARE | active C | C | No mutation is trusted or required |
| PREPARE write fails | active C or invalid partial candidate | C | Verify active C; discard inactive candidate only when safe; otherwise quarantine |
| PREPARE succeeds, before Task row write | C active, N PREPARED | C | Roll back PREPARED to C; retry begins a new operation |
| Task row write fails or returns uncertain state | C active, N PREPARED | C, N or unknown | If C, roll back PREPARED. If exactly N, promote N. If neither, restore C only when identity is unambiguous; otherwise quarantine |
| Task row written, before COMMIT | C active, N PREPARED | N | Promote N; no second Task row write |
| COMMIT succeeds, review note/audit/outbox fails | N active COMMITTED | N | Never roll back authority. Rebuild non-authority review/outbox work from committed row and durable Calendar intent |
| Stale worker ACK | newer active generation | newer row | Expected generation/hash mismatch returns stale; it cannot clear newer intent |
| Ledger or identity cannot be validated | missing / malformed / mismatch | arbitrary | Create/update safe control record when possible; classify QUARANTINED or UNRECOVERABLE; exclude from normal flows |

For a new Task, no active slot exists until PREPARE succeeds. If the Task row
cannot be written, the prepared record becomes rolled back/orphaned and no
normal Task is exposed. For a deletion, no row is silently recreated; the
committed ledger record becomes ORPHANED and requires explicit repair.

## 6. Multi-row edit and quarantine

A multi-row management edit is classified per physical row:

- `RESTORED`: a valid active slot restored the full Task row
- `QUARANTINED`: authority was unsafe but a control record identifies the row
- `UNRECOVERABLE`: no safe row/identity mapping remains

A bad row never prevents a valid authority row in the same event from being
restored. A quarantined or unrecoverable row is removed from operational
Repository indexes, Worker scans, Review actions and Calendar reconciliation.
It can return to service only through an explicit repair rooted in independent
evidence.

A blank row with a manually entered Task ID is cleared only when the event
proves it was previously blank. Otherwise it is quarantined rather than
promoted from raw values.

## 7. Migration and repair

Migration 2.5 -> 2.6 validates the legacy note anchor, snapshot projection and
raw row as a single strict preflight. Valid rows are written through the same
PREPARED/COMMITTED coordinator. A missing/malformed/mismatched legacy note
does not create ledger authority from the snapshot cell; it is quarantined with
a safe reason code.

Migration is bounded, resumable and idempotent. It records only safe Task
identity, generation/state and reason code in Run History/Errors. It never
logs raw Task payloads.

Repair accepts only:

- an older valid ledger generation
- a separately audited backup / Git source evidence
- a human-approved repair package

It never accepts a live raw row or snapshot cell as a silent rebaseline.

## 8. Header, diagnostic and release implications

Task header row 1 internal IDs and row 2 Japanese labels are restored directly
from the canonical schema when edited. This path does not mutate Task data
rows. Quick/Deep diagnostics report header, ledger and authority validation
using the same safe reason codes.

The workflow visualization, README and release tooling must read the current
Code, Schema, AI Schema, Migration and gate metadata. A post-staging remote
content check verifies the canonical root README, visualization index and
workflow HTML because this implementation workspace contains only the
`implementation/GoogleSpreadsheet/` subtree.

## 9. Non-goals and guardrails

- No deployment, clasp push or Automation enablement
- No snapshot-cell authority fallback
- No silent rebaseline
- No external I/O inside the main Script Lock
- No secret, credential, raw mail body or real Workspace data persistence
- No Phase 8B GO/PASS, Phase 8C GO, production-ready or pilot-ready claim
