# Master Plan

Last updated: 2026-08-11

Repository: `Tanukitsune-hub/GAS-Project-Schedule`

Current contract: Code `2.8.15-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Current gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

## Work 0002 窶・clean integration

1. Build A12 from exact starting main with selective donor porting only.
2. Execute source/static/focused regression validation.
3. Generate Phase 8B and Phase 8C packages from exact A12.
4. Commit the generated packages as direct-child B12.
5. Run the complete local gate and release verifiers.
6. Verify a fresh detached HTTPS clone at the pushed final head.
7. Require GitHub Actions success for Draft PR #16.

## Work 0016 窶・Gmail body decode runtime compatibility repair

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

## Work 0018 窶・Advanced Gmail byte-body decode repair

1. Inspect body data before String coercion and distinguish explicit base64url
   String input from narrowly recognized signed/unsigned byte sequences.
2. Validate byte-sequence length, density, integer values, and range before
   direct Apps Script Blob UTF-8 decoding; retain fixed privacy-safe failures.
3. Prove representation-accurate decode, malformed input, truncation,
   attachment exclusion, PREPROCESSED, idempotency, and privacy behavior.
4. Generate the `2.8.15-prepilot` packages from exact A15 and commit them as
   direct-child B15.
5. Require full local and exact-head CI before reusing the existing synthetic
   target for at most one guarded push and one optional parity pull.
6. Perform no Gmail runtime access or retest in Work 0018.

## Work 0028 — Gemini provider integration and observability repair

1. Add the isolated Gemini Interactions v1 provider with Script Properties
   credential lookup, strict structured output, and no provider fallback.
2. Keep external AI disabled by default and add a private, one-message
   synthetic entrypoint without invoking it in this Work.
3. Count Review-required results from write-time metadata in both Worker paths.
4. Generate the `2.8.15-prepilot` packages from exact A15 and commit them as
   direct-child B15.
5. Require full local and exact-head CI validation, then perform only the
   separately authorized existing-target placement boundary.

Completion justifies only
`READY_FOR_CONTROLLED_GEMINI_CREDENTIAL_CONFIGURATION_AND_SYNTHETIC_RUNTIME_VALIDATION`.
No real Gemini request or Gmail runtime retest is part of Work 0028.

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
6. Exercise synthetic Gmail竊探ask竊坦eview竊辰alendar and recovery paths only under
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

## Runtime progress addendum 窶・Work 0027 (2026-08-11)

The canonical source/release plan above remains retained because the current
machine contract is still `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`. The
separately authorized sandbox sequence has since been executed through
controlled Works 0019-0026 on synthetic-only data.

Completed real-Google runtime outcomes now include:

1. Gmail Advanced Service preprocessing through the repaired decoder.
2. Deterministic Mock Task creation with authoritative persistence.
3. Review-required Task creation and human `蜿怜・` via the canonical installable
   edit Trigger.
4. Ordinary manual Task editing through the same authority path.
5. Dedicated Calendar CREATE for one managed deadline event.
6. Calendar UPDATE in place after one due-date change, without duplication.
7. Calendar DELETE after Task completion, leaving no matching managed event in
   the bounded target window.

Work 0027 consolidates that evidence and deliberately makes no Apps Script,
release-package, schema, migration, or `CURRENT_CONTRACT.json` change.

### Next grouped Work

The next coherent source-change Work should combine rather than fragment:

1. implement/configure one approved production-AI Provider transport compatible
   with the existing provider-neutral AI schema;
2. use only an opaque credential reference/storage boundary;
3. fix the non-blocking Mock `review_count` under-counting with focused
   regression coverage in the same source-change bundle;
4. run the full local/CI gate once;
5. update the existing synthetic target once and refresh truthful version
   metadata as part of that controlled update;
6. run a small grouped synthetic real-AI end-to-end trial while Automation
   remains OFF;
7. finish with one bounded diagnostic and one consolidated report.

Do not repeat the already proven Calendar CREATE/UPDATE/DELETE lifecycle unless
that source change materially touches Calendar behavior.

Only after production-AI integration succeeds should a separate grouped Work
enable bounded scheduled Automation for a synthetic/personal-safe pilot with an
immediate disable path. Production/company use remains a separate decision.
