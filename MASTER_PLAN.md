# Master Plan

Last updated: 2026-08-10

Repository: `Tanukitsune-hub/GAS-Project-Schedule`

Current contract: Code `2.8.14-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Current gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

## Work 0002 — clean integration

1. Build A12 from exact starting main with selective donor porting only.
2. Execute source/static/focused regression validation.
3. Generate Phase 8B and Phase 8C packages from exact A12.
4. Commit the generated packages as direct-child B12.
5. Run the complete local gate and release verifiers.
6. Verify a fresh detached HTTPS clone at the pushed final head.
7. Require GitHub Actions success for Draft PR #16.

## Work 0016 — Gmail body decode runtime compatibility repair

1. Normalize strict padded/unpadded Gmail base64url before Apps Script decode.
2. Prove UTF-8, padding, URL-safe, malformed, truncation, attachment, and
   privacy behavior with a strict local Utilities shim.
3. Generate the `2.8.13-prepilot` packages from exact A13 and commit them as
   direct-child B13.
4. Require full local validation and exact repair-head CI before any Google
   mutation.
5. Reuse only the existing personal-synthetic target for at most one guarded
   push and one optional independent parity pull; perform no Gmail runtime.

Completion of these steps justifies only
`READY_FOR_CONTROLLED_SANDBOX_VALIDATION`.

## Work 0018 — Advanced Gmail byte-body decode repair

1. Inspect body data before String coercion and distinguish explicit base64url
   String input from narrowly recognized signed/unsigned byte sequences.
2. Validate byte-sequence length, density, integer values, and range before
   direct Apps Script Blob UTF-8 decoding; retain fixed privacy-safe failures.
3. Prove representation-accurate decode, malformed input, truncation,
   attachment exclusion, PREPROCESSED, idempotency, and privacy behavior.
4. Generate the `2.8.14-prepilot` packages from exact A14 and commit them as
   direct-child B14.
5. Require full local and exact-head CI before reusing the existing synthetic
   target for at most one guarded push and one optional parity pull.
6. Perform no Gmail runtime access or retest in Work 0018.

## Next controlled Sandbox Work ID

A separately authorized Work ID may use a dedicated personal synthetic target
to establish the next evidence in this order:

1. Directly verify target, container, owner/principal, Cloud project, and
   immutable deployment bindings without retaining identifiers.
2. Bind a one-use marker and exact payload SHA-256 before any remote call.
3. Perform one guarded push and pull-back parity check if explicitly authorized.
4. Run Setup and inspect native hidden/protected/validation/note behavior.
5. Run standalone Quick Diagnostic, Deep Diagnostic, and Dashboard refresh as
   separate bounded actions.
6. Exercise synthetic Gmail→Task→Review→Calendar and recovery paths only under
   explicit per-action authorization.

No step is authorized by this plan itself.

## Deferred project work

- Implement and approve one real AI Provider transport and opaque credential
  boundary.
- Validate native Google semantics, runtime entrypoints, triggers, locks,
  quotas, retries, and rollback/redeployment.
- Complete real end-to-end functional acceptance.
- Decide Phase 8B overall, Phase 8C GO, pilot, production, and company handoff
  only after their separate acceptance evidence exists.

## Gate discipline

- Automation remains OFF.
- No active company transfer or deployment target exists.
- Local/CI PASS never implies real Workspace or Provider PASS.
- Historical packages and transfer envelopes remain immutable and inactive.
- Any missing authorization, identity binding, parity evidence, or complete
  bounded result fails closed.
