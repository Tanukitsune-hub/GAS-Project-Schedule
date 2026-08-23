# Work 0037 Manual Acceptance Guide - 2.8.22-prepilot

This guide is descriptive only. It does not authorize deployment, OAuth,
clasp, Gmail, Calendar, Task, Review, Setup, diagnostics, trigger mutation,
Automation, Provider, or Apps Script function execution.

Required candidate: Code `2.8.22-prepilot`, Schema `2.6`, AI Schema `2.0`,
Migration `3`, `TEST_MODE=true`, Automation `OFF`.

Machine gate: `READY_FOR_USER_PERSONAL_SHADOW_PILOT`.

The current source exposes no-argument
`getPersonalShadowPilotStatus()` and `preparePersonalShadowPilot()`. Readiness
and preparation are network-free and do not read credential values. The pilot
requires the actual Automation-OFF guard and an explicit `手動/取込` Inbox
label gate; ordinary unlabeled Inbox mail is rejected. A later separately
authorized Work may permit one bounded personal runtime action. Credential values must not enter source, evidence,
GitHub, Codex, or ChatGPT.

Completed Gemini responses are accepted only as `thought* model_output`.
Thought signatures and summaries are opaque and never retained or exposed;
exactly one final text output reaches the existing strict application validator.

Before any future placement, verify source/release commits, checksums, exactly
22 `.gs` files plus `appsscript.json` in the Phase 8C payload, no credentials
or identifiers, the exact label-gated candidate guard, and no scheduled trigger.
Record every native observation as PASS, FAIL, or NOT EXECUTED. Local checks do
not prove native Google behavior.
