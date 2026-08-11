# Decisions

Last updated: 2026-08-10

This file contains the active decisions for the 2.8.15 clean integration
candidate. Superseded decisions remain available in Git history and in their
historical audit, instruction, release, transfer, and evidence records; those
records are not reinterpreted as active operator instructions.

## D-048 遯ｶ繝ｻOne clean current candidate replaces the stacked active path

**Decision.** Code `2.8.15-prepilot`, Schema `2.6`, AI Schema `2.0`, Migration
`3`, and `READY_FOR_CONTROLLED_SANDBOX_VALIDATION` form the only active
contract. PR #8/#10/#11 refs are read-only donors, not merge or deployment
targets.

**Consequence.** Current source, tests, tools, CI, documentation, and the two
generated packages are reviewed as one linear A15遶企＃14 chain. Historical
release and transfer trees remain immutable and inactive. Work 0018 creates no
new Google target, company-transfer target, or deployment.

## D-049 遯ｶ繝ｻThe Task ledger is the only trust anchor

**Decision.** Task authority requires a valid durable ledger record with
explicit transaction state, committed/prepared generation, canonical hash,
and physical-row binding. A live row, snapshot cell, or note cannot create or
restore authority.

**Consequence.** Partial writes are recoverable or rolled back. Missing,
malformed, stale, generation-mismatched, duplicate, or orphan authority fails
closed. Valid peers in a multi-row edit are restored independently; invalid
rows are quarantined with bounded redacted evidence.

## D-050 遯ｶ繝ｻCalendar effects follow durable Task intent

**Decision.** Calendar create/update/delete/no-op work is derived from a
versioned durable Task intent. Enqueue and acknowledgement failures must leave
recoverable state, and authority loss after external I/O must preserve the
owned-event compensation path.

**Consequence.** Calendar is an auxiliary projection, never the Task system of
record. Real Calendar operations remain unaccepted in this Work ID.

## D-051 遯ｶ繝ｻDashboard and diagnostics preserve Google-specific boundaries

**Decision.** Dashboard writes require proven system ownership and exact
surface state. A write is followed by flush, fresh range acquisition, and
strict readback. Quick and Deep Diagnostics are read-only and emit bounded,
complete, redacted summaries.

**Consequence.** Local fakes test the strongest available model but do not
promote Google-native behavior to PASS. Controlled Sandbox validation is a
separate future gate.

## D-052 遯ｶ繝ｻOne locked non-Google CI gate is standard

**Decision.** `.github/workflows/ci.yml` is the only workflow. It installs the
locked project dependencies and runs the complete non-Google verification gate
from a fresh checkout with `contents: read` permission.

**Consequence.** CI cannot read secrets or local clasp state and cannot perform
Google, OAuth, deployment, trigger, or Workspace operations.

## D-053 遯ｶ繝ｻRelease packages are deterministic and non-authorizing

**Decision.** B15 is a direct child of A15. The Phase 8B package retains
`TEST_MODE=true` and the harness; the Phase 8C candidate applies only the
accepted `TEST_MODE=false` transform and excludes the harness.

**Consequence.** Both packages bind the exact A15 source commit, use
deterministic manifests/checksums, and pass byte/parity verification. Neither
package declares runtime, Phase 8B overall, Phase 8C GO, pilot, production, or
company-handoff acceptance.

## D-054 遯ｶ繝ｻExplicit Gmail String data is normalized before Utilities decode

**Decision.** Explicit String input from the Gmail Advanced Service must be
strict base64url with valid optional terminal padding. Valid unpadded data is padded
to a four-character quantum before `Utilities.base64DecodeWebSafe()`;
malformed alphabet, length, or padding remains `E_GMAIL_BODY_DECODE`.

**Consequence.** Node's permissive `Buffer` decoder is not accepted as the
runtime contract. Tests use a strict Apps Script-compatible shim, and failures
retain fixed privacy-safe error evidence without body or identifier content.

## D-055 遯ｶ繝ｻAdvanced Gmail body data has two strict representations

**Decision.** Before any String coercion, body data is classified as either an
explicit String or a narrowly recognized Array, Int8Array, Uint8Array, or
Uint8ClampedArray. Byte sequences require bounded integer length, no sparse
elements, and only signed bytes `-128..127` or unsigned bytes `0..255`.
Unsigned values above `127` are normalized to signed bytes and decoded only by
`Utilities.newBlob(bytes).getDataAsString('UTF-8')`; base64 decoding is never
used for byte input.

**Consequence.** Unsupported, malformed, fractional, non-finite, sparse, or
out-of-range representations fail as fixed, privacy-safe, non-retryable
`E_GMAIL_BODY_DECODE`. The existing byte limit, truncation evidence, attachment
exclusion, idempotency, and Automation-OFF boundaries remain unchanged.

## Stable product decisions retained

- Google Sheets Task data is the operational system of record.
- Gmail processing is exact-message ordered and idempotent.
- Ambiguous or material changes require human Review/CAS handling.
- Calendar is limited to important deadline projection and recovery.
- Production AI remains fail-closed until one approved provider, transport,
  credential boundary, and data policy are separately implemented and tested.
- Automation defaults to OFF and cannot be enabled by Setup or local tests.

## Work 0027 runtime-evidence decisions 遯ｶ繝ｻ2026-08-11

### D-056 遯ｶ繝ｻRuntime evidence is tracked separately from source/release identity

**Decision.** Controlled Works 0019-0026 establish accepted real-Google
synthetic-runtime evidence for Gmail preprocessing, Task authority, Review,
ordinary manual edits, and managed Calendar CREATE/UPDATE/DELETE. The machine
source/release contract remains `READY_FOR_CONTROLLED_SANDBOX_VALIDATION` and
`CURRENT_CONTRACT.json` is unchanged.

**Consequence.** Runtime planning may advance to controlled production-AI
Provider integration without regenerating packages or rewriting the machine
gate. This does not authorize company/production data, deployment, or
Automation.

### D-057 遯ｶ繝ｻTruthful diagnostics outrank cosmetic green status

**Decision.** `VERSION_PROPERTIES` and `RETRY_DEAD_LETTER_STATE` remain visible
while their underlying conditions are real. The former reflects Setup-stored
version metadata predating the current placed candidate; the latter reflects
retained controlled synthetic failure history.

**Consequence.** Do not weaken diagnostic predicates or delete synthetic
negative-test evidence merely to reduce WARN count. Refresh target version
metadata during the next controlled target update; treat Dead Letter cleanup
as an explicit retention decision.

### D-058 遯ｶ繝ｻReview count is derived from write-time result metadata

**Decision.** Mock and external Worker paths increment `review_count` from the
`review_required` result metadata returned by the canonical Task/Review write.
They must not reread a newly inserted Task through stale lock-free context.

**Consequence.** A newly inserted Review Task, unresolved target, pending
change, or conflict is counted exactly once; safe automatic NEW/ADD and
information-only actions are not counted.

## Work 0028 provider decisions — 2026-08-11

### D-059 — Gemini is isolated behind a disabled-by-default provider boundary

**Decision.** The only production-capable provider module is
`20_GeminiProvider.gs`. It uses the stable Gemini Interactions v1 endpoint,
the pinned `gemini-3.6-flash` model, strict structured output, and a fixed
opaque Script Properties reference. The provider registry is lazy and never
falls back to Mock.

**Consequence.** The normal TEST_MODE path remains Mock, Automation remains
OFF, and Work 0028 performs no real Gemini request. Credential configuration
and one guarded synthetic runtime are separate next-step authorization gates.
