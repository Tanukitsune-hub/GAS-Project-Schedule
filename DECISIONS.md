# Decisions

Last updated: 2026-08-18

This file records active decisions for the current Code `2.8.20-prepilot`
candidate. Historical handoffs, reports, release packages, and audit records
remain immutable evidence.

Current machine gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

## D-048: one active candidate

Work 0033 is the active Code `2.8.20-prepilot` with A20/B20. The active
source, tests, tools, documents, and generated packages form one linear A20/B20
candidate. Older release and transfer trees are historical and not deployment
selectors.

## D-049: the Task ledger is the trust anchor

Task authority requires a valid durable 21-column ledger record with committed
generation, canonical hash, and physical-row binding. A visible row, snapshot,
or note cannot create or restore authority.

## D-050: Calendar follows durable Task intent

Calendar is a derived projection of versioned Task intent. Enqueue,
acknowledgement, authority loss, and compensation remain fail-closed and
recoverable.

## D-051: diagnostics are read-only

Dashboard ownership, protection, flush, reacquire, and readback checks remain
strict. Quick and Deep Diagnostics emit bounded evidence and never repair data.

## D-052: one non-Google CI gate

The repository CI installs locked dependencies and runs the full local gate
with read-only contents permission. CI cannot access credentials or Google
Workspace state.

## D-053: deterministic release lineage

Phase 8B retains `TEST_MODE=true` and the harness. Phase 8C applies only the
audited `TEST_MODE=false` transform and harness exclusion. B20 is a direct
child of A20, and neither package is a deployment authorization.

## D-054: strict Gmail body decoding

Explicit String body data remains strict padded/unpadded base64url normalized
for Apps Script web-safe decoding. Malformed input stays a fixed,
privacy-safe, non-retryable `E_GMAIL_BODY_DECODE` failure.

## D-055: dual Gmail body representations

Before String coercion, only bounded dense Array, Int8Array, Uint8Array, or
Uint8ClampedArray byte sequences are accepted. Values are validated and decoded
directly through an Apps Script Blob. Attachment content is excluded.

## D-056: historical release identities

Work 0018 is Code `2.8.14-prepilot` with A14/B14. Work 0028 is Code
`2.8.15-prepilot` with A15/B15. Work 0029 remains Code `2.8.16-prepilot`
with A16/B16. Work 0030 remains Code `2.8.17-prepilot` with A17/B17. Work
0031 remains the historical Code `2.8.18-prepilot` with A18/B18. Work 0032
is the successor Code `2.8.19-prepilot` with A19/B19. These identities must
not be overwritten.

## D-057: Gemini remains explicitly bounded

The Gemini Interactions provider uses a deterministic projection of the
canonical AI Schema 2.0 that retains the output shape, required fields, types,
and enums while omitting provider-complexity constraints already enforced by
the application validator. It sends `thinking_level=low`,
`thinking_summaries=none`, and `max_output_tokens=4096`. No tools, streaming,
background execution, persistence, sampling, or fallback provider is used.
Completed responses are accepted only as `thought* model_output`; thought
signatures and summaries are opaque and never read, parsed, logged, hashed,
persisted, or surfaced. Exactly one final text output remains subject to the
existing strict application validator.

## D-058: runtime Automation guard

Readiness and synthetic validation read the actual canonical Automation status
before credential, Gmail, or Provider access. The required state is
`CONSISTENT`, disabled, undesired, zero scheduled/clock triggers, no stored
canonical ID, and no canonical scheduled trigger. No repair or mutation is
performed.

## D-059: exact synthetic fixture

The only candidate accepted by the Work 0029 validation path has the fixed
subject `[WORK_OS_SYNTHETIC_GEMINI_0029]` and the exact normalized UTF-8 body
defined by `20_GeminiProvider.gs`. It describes a fictional internal Task,
contains no personal/confidential/production data, uses a seven-day relative
deadline, and is not a high-impact Calendar item.

## D-060: Work 0030 historical credential boundary

Work 0030 did not configure or inspect a real API key, make a Gemini request,
access Gmail runtime, invoke an Apps Script function, or run Task, Review,
Calendar, Setup, Diagnostics, Dashboard, trigger, or Automation operations.
The manual Script Property configuration that was then described as the next
boundary has since been completed by the user in the personal-synthetic target
and is superseded by D-063.

## D-061: Gemini v1beta transport endpoint

The active Gemini Interactions provider uses exactly
`https://generativelanguage.googleapis.com/v1beta/interactions`. It performs
one bounded POST with the existing API-key header and request contract, with no
endpoint fallback, retry, model fallback, or alternate provider.

## D-062: Work 0032 credential and runtime boundary

Work 0032 does not configure or inspect the existing Gemini credential, make a
real Gemini request, invoke an Apps Script function, or access Gmail, Task,
Review, Calendar, Setup, Diagnostics, Dashboard, triggers, or Automation
runtime in Codex.

## D-063: personal Gemini E2E convergence boundary after Work 0033

The user has configured the Gemini credential in personal-synthetic Script
Properties outside the repository. Readiness has passed and bounded
user-controlled real Gemini attempts have occurred, but no real
classification-to-Task E2E has completed yet.

The next live action is exactly one fresh approved synthetic Gmail Message on
Code `2.8.20-prepilot`. Prior failed, stuck, or terminal Messages remain
historical evidence and are never reset or reused. The selected Message is
pinned exactly; no older resumable row may hijack the call.

A successful strict classification and governed Task or valid Review outcome,
with no processing error, no Calendar job for the fixture, and Automation OFF,
completes the personal-environment E2E and triggers code freeze. After that,
company-PC work is environment qualification only unless a company-specific
BLOCKER is proven.

If the live call fails, the next repair is constrained to the smallest change
supported by the new bounded code/stage, HTTP status, provider machine code,
checkpoint, and failure-finalization evidence. Broad redesign, fallback
providers/endpoints, and additional speculative qualification are not
permitted without new material evidence.
