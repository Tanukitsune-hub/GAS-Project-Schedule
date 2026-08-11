# Master Plan

Last updated: 2026-08-11

Repository: `Tanukitsune-hub/GAS-Project-Schedule`

Current contract: Code `2.8.16-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Current machine gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

## Historical release chain

- Work 0002 established the clean integration and deterministic local gate.
- Work 0018 remains Code `2.8.14-prepilot`, source A14, release B14. Its
  narrow scope was the Gmail Advanced Service body decoder.
- Work 0028 remains Code `2.8.15-prepilot`, source A15, release B15. Its
  scope was the isolated Gemini provider boundary and Review observability.

These records remain historical and are not rewritten as current selectors.

## Work 0029: Gemini runtime activation remediation

1. Add no-argument readiness and one-message synthetic validation entrypoints.
2. Read actual Automation state before credential, Gmail, or Provider access;
   fail closed unless Automation is consistently OFF.
3. Use an exact UTF-8 synthetic subject/body fixture with a fictional internal
   Task and a seven-day relative deadline.
4. Use only the documented structured-output schema subset and bounded
   low-thinking generation configuration.
5. Repair active UTF-8 documents while preserving historical A14/B14 and
   A15/B15 facts.
6. Generate Code `2.8.16-prepilot` packages as direct-child A16/B16 with the
   exact 24-file source payload inventory.
7. Run the complete non-Google validation gate and exact-head CI.
8. After all gates, perform at most one existing-target source placement and
   at most one independent parity pull. Do not invoke an Apps Script function,
   Gmail, Task, Review, Calendar, Setup, Diagnostics, Dashboard, Automation,
   or Gemini request in this Work.

The highest permitted Work 0029 status is
`READY_FOR_USER_GEMINI_KEY_CONFIGURATION_AND_ONE_MESSAGE_VALIDATION`.

## Deferred boundary

A future separately authorized Work may ask the user to configure a Gemini
Script Property manually and perform one synthetic-message validation. The key
must never enter GitHub, Codex, ChatGPT, source, tests, reports, or logs.
Native Google behavior, deployment, production use, company handoff, and
Automation remain separately gated.
