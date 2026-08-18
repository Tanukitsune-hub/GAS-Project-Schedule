# Master Plan

Last updated: 2026-08-18

Repository: `Tanukitsune-hub/GAS-Project-Schedule`

Current contract: Code `2.8.20-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Current machine gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

Current personal runtime status: `PERSONAL_GEMINI_E2E_PASS_CODE_FROZEN`

## Historical release chain

- Work 0002 established the clean integration and deterministic local gate.
- Work 0018 remains Code `2.8.14-prepilot`, source A14, release B14. Its
  narrow scope was the Gmail Advanced Service body decoder.
- Work 0028 remains Code `2.8.15-prepilot`, source A15, release B15. Its
  scope was the isolated Gemini provider boundary and Review observability.
- Work 0029 remains Code `2.8.16-prepilot`, source A16, release B16. Its
  scope was callable Gemini readiness and synthetic validation entrypoints.
- Work 0030 remains Code `2.8.17-prepilot`, source A17, release B17. Its
  scope was strict Gemini thinking-step parsing.
- Work 0031 remains Code `2.8.18-prepilot`, source A18, release B18. Its
  scope was the current `/v1beta/interactions` endpoint candidate and exact
  transport/release alignment.

These records remain historical and are not rewritten as current selectors.

## Work 0032: Gemini runtime diagnostics hardening

1. Preserve the current Gemini Interactions `/v1beta/interactions` creation
   endpoint with no fallback, retry, model fallback, or alternate provider.
2. Preserve the Work 0029 Automation-OFF, exact-fixture, credential,
   one-call, documented-schema, bounded-generation, and no-fallback guards.
3. Preserve the Work 0030 `thought* model_output` parser and opaque thought
   metadata behavior.
4. Add bounded provider diagnostics, independent Message failure
   finalization, and exact synthetic candidate pinning without changing the
   generic worker contract.
5. Generate Code `2.8.19-prepilot` packages as direct-child A19/B19 with the
   exact 24-file source payload inventory: 23 `.gs` files plus
   `appsscript.json`.
6. Run the complete non-Google validation gate and exact-head CI.
7. After all gates, perform at most one existing-target source placement and
   at most one independent parity pull. Do not invoke an Apps Script function,
   Gmail, Task, Review, Calendar, Setup, Diagnostics, Dashboard, Automation,
   or Gemini request in this Work.

The highest permitted Work 0032 implementation status was
`READY_FOR_USER_GEMINI_DIAGNOSTIC_ONE_MESSAGE_RETRY`.

## Work 0033: Gemini provider-schema compatibility repair

1. Preserve the current Gemini Interactions `/v1beta/interactions` endpoint,
   `gemini-3.6-flash`, strict `thought* model_output` parser, one-call/no-retry
   boundary, no fallback, and Automation OFF.
2. Project canonical AI Schema 2.0 into a smaller provider-facing schema that
   retains the exact output shape, required fields, primitive/null types, and
   domain enums while leaving strict application validation unchanged.
3. Prove schema simplification and canonical/provider drift with local
   synthetic tests, then generate Code `2.8.20-prepilot` A20/B20 packages.
4. Run the complete non-Google validation gate and exact-head CI.
5. After all gates, perform at most one existing-target source placement and
   at most one independent parity pull. Do not invoke an Apps Script function,
   Gmail, Task, Review, Calendar, Setup, Diagnostics, Dashboard, Automation,
   or Gemini request in this Work.

The highest permitted Work 0033 implementation status was
`READY_FOR_USER_GEMINI_E2E_RETRY_AFTER_SCHEMA_COMPATIBILITY_REPAIR`.
That implementation boundary was subsequently satisfied by the user-controlled
live E2E described below.

## Personal-environment completion boundary — MET

The user configured the Gemini credential manually in the personal-synthetic
Apps Script target outside the repository. The credential value remains outside
GitHub, Codex, ChatGPT, source, tests, reports, and logs.

On 2026-08-18 the user executed one fresh exact synthetic Gmail Message through
`Gemini synthetic validation (one request)` on Code `2.8.20-prepilot`. The
bounded user-visible result was reviewed against the pre-declared completion
condition and is recorded in `docs/handoffs/0033-live-e2e-review.md`.

The result satisfied every required condition:

- Gemini was called and the synthetic path completed with `status=COMPLETE` and
  checkpoint `DONE`;
- exactly one candidate was processed;
- one governed Task and one Review were created;
- processing errors were zero;
- Calendar jobs were zero for the non-high-impact fixture; and
- Automation remained `CONSISTENT`, disabled, with zero scheduled/clock
  triggers and no stored/canonical trigger presence.

Therefore the personal version is practically complete and Code
`2.8.20-prepilot` is in product-code freeze.

## Next phase: environment qualification

The next phase is company-PC / company-environment qualification, not feature
or architecture development. The objective is to prove that the frozen
candidate can operate under the company's actual Google Workspace permissions,
network controls, OAuth policy, Apps Script policy, and allowed data-handling
boundary.

Do not reopen source merely to add more tests, polish, fallback providers,
alternate endpoints, retries, schema changes, or speculative hardening.
A new product-code Work is justified only if company qualification or another
required check produces material evidence of an environment-independent defect.
Environment-specific permission, network, OAuth, or policy restrictions should
be handled as qualification/configuration findings unless they prove a product
change is necessary.
