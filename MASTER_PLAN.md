# Master Plan

Last updated: 2026-08-17

Repository: `Tanukitsune-hub/GAS-Project-Schedule`

Current contract: Code `2.8.19-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Current machine gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

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

These records remain historical and are not rewritten as current selectors.

## Work 0032: Gemini runtime diagnostics hardening

1. Preserve the exact confirmed Gemini Interactions `/v1beta/interactions`
   creation endpoint with no fallback, retry, model fallback, or alternate
   provider.
2. Preserve the Work 0029 Automation-OFF, exact-fixture, credential,
   one-call, documented-schema, bounded-generation, and no-fallback guards.
3. Preserve the Work 0030 `thought* model_output` parser and opaque thought
   metadata behavior.
4. Add bounded provider diagnostics, independent Message failure
   finalization, and exact synthetic candidate pinning without changing the
   generic worker contract.
5. Generate Code `2.8.19-prepilot` packages as direct-child A19/B19 with the
   exact 23-file source payload inventory.
6. Run the complete non-Google validation gate and exact-head CI.
7. After all gates, perform at most one existing-target source placement and
   at most one independent parity pull. Do not invoke an Apps Script function,
   Gmail, Task, Review, Calendar, Setup, Diagnostics, Dashboard, Automation,
   or Gemini request in this Work.

The highest permitted Work 0032 status is
`READY_FOR_USER_GEMINI_DIAGNOSTIC_ONE_MESSAGE_RETRY`.

## Deferred boundary

A future separately authorized Work may ask the user to configure a Gemini
Script Property manually and perform one synthetic-message validation. The key
must never enter GitHub, Codex, ChatGPT, source, tests, reports, or logs.
Native Google behavior, deployment, production use, company handoff, and
Automation remain separately gated.
