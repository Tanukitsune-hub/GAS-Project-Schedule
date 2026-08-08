# Decisions

Last updated: 2026-08-08

This file contains the active decisions for the 2.8.12 clean integration
candidate. Superseded decisions remain available in Git history and in their
historical audit, instruction, release, transfer, and evidence records; those
records are not reinterpreted as active operator instructions.

## D-048 — One clean current candidate replaces the stacked active path

**Decision.** Code `2.8.12-prepilot`, Schema `2.6`, AI Schema `2.0`, Migration
`3`, and `READY_FOR_CONTROLLED_SANDBOX_VALIDATION` form the only active
contract. PR #8/#10/#11 refs are read-only donors, not merge or deployment
targets.

**Consequence.** Current source, tests, tools, CI, documentation, and the two
generated packages are reviewed as one linear A12→B12 chain. Historical
release and transfer trees remain immutable and inactive. Work 0002 creates no
company-transfer target.

## D-049 — The Task ledger is the only trust anchor

**Decision.** Task authority requires a valid durable ledger record with
explicit transaction state, committed/prepared generation, canonical hash,
and physical-row binding. A live row, snapshot cell, or note cannot create or
restore authority.

**Consequence.** Partial writes are recoverable or rolled back. Missing,
malformed, stale, generation-mismatched, duplicate, or orphan authority fails
closed. Valid peers in a multi-row edit are restored independently; invalid
rows are quarantined with bounded redacted evidence.

## D-050 — Calendar effects follow durable Task intent

**Decision.** Calendar create/update/delete/no-op work is derived from a
versioned durable Task intent. Enqueue and acknowledgement failures must leave
recoverable state, and authority loss after external I/O must preserve the
owned-event compensation path.

**Consequence.** Calendar is an auxiliary projection, never the Task system of
record. Real Calendar operations remain unaccepted in this Work ID.

## D-051 — Dashboard and diagnostics preserve Google-specific boundaries

**Decision.** Dashboard writes require proven system ownership and exact
surface state. A write is followed by flush, fresh range acquisition, and
strict readback. Quick and Deep Diagnostics are read-only and emit bounded,
complete, redacted summaries.

**Consequence.** Local fakes test the strongest available model but do not
promote Google-native behavior to PASS. Controlled Sandbox validation is a
separate future gate.

## D-052 — One locked non-Google CI gate is standard

**Decision.** `.github/workflows/ci.yml` is the only workflow. It installs the
locked project dependencies and runs the complete non-Google verification gate
from a fresh checkout with `contents: read` permission.

**Consequence.** CI cannot read secrets or local clasp state and cannot perform
Google, OAuth, deployment, trigger, or Workspace operations.

## D-053 — Release packages are deterministic and non-authorizing

**Decision.** B12 is a direct child of A12. The Phase 8B package retains
`TEST_MODE=true` and the harness; the Phase 8C candidate applies only the
accepted `TEST_MODE=false` transform and excludes the harness.

**Consequence.** Both packages bind the exact A12 source commit, use
deterministic manifests/checksums, and pass byte/parity verification. Neither
package declares runtime, Phase 8B overall, Phase 8C GO, pilot, production, or
company-handoff acceptance.

## Stable product decisions retained

- Google Sheets Task data is the operational system of record.
- Gmail processing is exact-message ordered and idempotent.
- Ambiguous or material changes require human Review/CAS handling.
- Calendar is limited to important deadline projection and recovery.
- Production AI remains fail-closed until one approved provider, transport,
  credential boundary, and data policy are separately implemented and tested.
- Automation defaults to OFF and cannot be enabled by Setup or local tests.
