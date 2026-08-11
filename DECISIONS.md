# Decisions

Last updated: 2026-08-11

This file contains the active decisions for the 2.8.14 clean integration candidate. Superseded decisions remain available in Git history and in their historical audit, instruction, release, transfer, and evidence records; those records are not reinterpreted as active operator instructions.

## D-048 — One clean current candidate replaces the stacked active path

**Decision.** Code `2.8.14-prepilot`, Schema `2.6`, AI Schema `2.0`, Migration `3`, and `READY_FOR_CONTROLLED_SANDBOX_VALIDATION` form the machine-bound source/release contract. PR #8/#10/#11 refs are read-only donors, not merge or deployment targets.

**Consequence.** Current source, tests, tools, CI, documentation, and the two generated packages are reviewed as one linear A14→B14 chain. Historical release and transfer trees remain immutable and inactive. Later runtime-validation evidence does not silently rewrite deterministic source/release identity.

## D-049 — The Task ledger is the only trust anchor

**Decision.** Task authority requires a valid durable ledger record with explicit transaction state, committed/prepared generation, canonical hash, and physical-row binding. A live row, snapshot cell, or note cannot create or restore authority.

**Consequence.** Partial writes are recoverable or rolled back. Missing, malformed, stale, generation-mismatched, duplicate, or orphan authority fails closed. Valid peers in a multi-row edit are restored independently; invalid rows are quarantined with bounded redacted evidence.

## D-050 — Calendar effects follow durable Task intent

**Decision.** Calendar create/update/delete/no-op work is derived from a versioned durable Task intent. Enqueue and acknowledgement failures must leave recoverable state, and authority loss after external I/O must preserve the owned-event compensation path.

**Consequence.** Calendar is an auxiliary projection, never the Task system of record. Works 0024-0026 later proved the managed `CREATE -> UPDATE -> DELETE` lifecycle on the dedicated personal-synthetic Calendar without changing this authority model.

## D-051 — Dashboard and diagnostics preserve Google-specific boundaries

**Decision.** Dashboard writes require proven system ownership and exact surface state. A write is followed by flush, fresh range acquisition, and strict readback. Quick and Deep Diagnostics are read-only and emit bounded, complete, redacted summaries.

**Consequence.** Diagnostics must report real drift/recovery state honestly. Runtime evidence may resolve a previously unknown boundary, but warnings are not suppressed merely to produce a green summary.

## D-052 — One locked non-Google CI gate is standard

**Decision.** `.github/workflows/ci.yml` is the only workflow. It installs the locked project dependencies and runs the complete non-Google verification gate from a fresh checkout with `contents: read` permission.

**Consequence.** CI cannot read secrets or local clasp state and cannot perform Google, OAuth, deployment, trigger, or Workspace operations.

## D-053 — Release packages are deterministic and non-authorizing

**Decision.** B14 is a direct child of A14. The Phase 8B package retains `TEST_MODE=true` and the harness; the Phase 8C candidate applies only the accepted `TEST_MODE=false` transform and excludes the harness.

**Consequence.** Both packages bind the exact A14 source commit, use deterministic manifests/checksums, and pass byte/parity verification. Runtime validation does not alter those packages unless source actually changes and a new release chain is intentionally created.

## D-054 — Explicit Gmail String data is normalized before Utilities decode

**Decision.** Explicit String input from the Gmail Advanced Service must be strict base64url with valid optional terminal padding. Valid unpadded data is padded to a four-character quantum before `Utilities.base64DecodeWebSafe()`; malformed alphabet, length, or padding remains `E_GMAIL_BODY_DECODE`.

**Consequence.** Node's permissive `Buffer` decoder is not accepted as the runtime contract. Tests use a strict Apps Script-compatible shim, and failures retain fixed privacy-safe error evidence without body or identifier content.

## D-055 — Advanced Gmail body data has two strict representations

**Decision.** Before any String coercion, body data is classified as either an explicit String or a narrowly recognized Array, Int8Array, Uint8Array, or Uint8ClampedArray. Byte sequences require bounded integer length, no sparse elements, and only signed bytes `-128..127` or unsigned bytes `0..255`. Unsigned values above `127` are normalized to signed bytes and decoded only by `Utilities.newBlob(bytes).getDataAsString('UTF-8')`; base64 decoding is never used for byte input.

**Consequence.** Unsupported, malformed, fractional, non-finite, sparse, or out-of-range representations fail as fixed, privacy-safe, non-retryable `E_GMAIL_BODY_DECODE`. Work 0019 later proved the repaired decoder effective in real Advanced Gmail runtime without claiming an uninstrumented representation type.

## D-056 — Controlled personal-synthetic Google runtime evidence is accepted separately from source-contract identity

**Decision.** Works 0019-0026 establish accepted runtime evidence for the current candidate on the existing personal-synthetic target: Gmail preprocessing, Task authority, Mock Task creation, human Review acceptance, ordinary manual Task editing, and dedicated Calendar CREATE/UPDATE/DELETE.

**Consequence.** The human-readable runtime status advances to `READY_FOR_CONTROLLED_PRODUCTION_AI_PROVIDER_INTEGRATION`, while `CURRENT_CONTRACT.json` remains unchanged because no source/release identity changed. This runtime evidence does not authorize company/production data, autonomous processing, or a production AI Provider.

## D-057 — Truthful diagnostics outrank cosmetic green status

**Decision.** `VERSION_PROPERTIES` and `RETRY_DEAD_LETTER_STATE` warnings remain visible while their underlying conditions are real. `VERSION_PROPERTIES` currently reflects Setup-stored version metadata that predates the placed `2.8.14-prepilot` candidate. `RETRY_DEAD_LETTER_STATE` currently reflects intentionally retained historical synthetic failures.

**Consequence.** Do not weaken diagnostic predicates or delete synthetic negative-test evidence merely to reduce WARN count. Refresh version metadata during the next controlled target update; make any Dead Letter retention/cleanup decision explicit and separate.

## D-058 — Mock `review_count` under-counting is a non-blocking observability fix and should be bundled with the next source change

**Decision.** One lock-free Mock vertical summary path under-counts a newly inserted Review Task because it does not count the newly persisted `needs_review` row after insertion. The Review Task itself and human acceptance path were proven in real runtime.

**Consequence.** Classify this as `FIX SOON`, not a pilot blocker. Avoid a standalone source/version/release churn solely for this counter. Correct it with focused regression coverage in the next coherent source-change bundle, expected to be the production-AI Provider integration Work.

## Stable product decisions retained

- Google Sheets Task data is the operational system of record.
- Gmail processing is exact-message ordered and idempotent.
- Ambiguous or material changes require human Review/CAS handling.
- Calendar is limited to important deadline projection and recovery.
- Production AI remains fail-closed until one approved provider, transport, credential boundary, and data policy are separately implemented and tested.
- Automation defaults to OFF and cannot be enabled by Setup or local tests.
- Already accepted runtime boundaries should not be repetitively re-run unless a material source change affects them.
