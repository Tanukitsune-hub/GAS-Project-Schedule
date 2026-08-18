# Work 0036 Manual Acceptance Guide - 2.8.21-prepilot

This guide is descriptive only. It does not authorize deployment, OAuth,
clasp, Gmail, Calendar, Task, Review, Setup, diagnostics, trigger mutation,
Automation, Provider, or Apps Script function execution.

Required candidate: Code `2.8.21-prepilot`, Schema `2.6`, AI Schema `2.0`,
Migration `3`, `TEST_MODE=true`, Automation `OFF`.

Machine gate: `READY_FOR_USER_PERSONAL_AUTOMATION_E2E`.

The current source exposes no-argument
`getPersonalAutomationQualificationStatus()` and
`preparePersonalAutomationQualification()`. Readiness and preparation are
network-free and do not read credential values. Automatic qualification
requires the actual Automation-OFF guard and one exact fictional UTF-8
synthetic message. A later separately authorized Work may permit one bounded
personal runtime action. Credential values must not enter source, evidence,
GitHub, Codex, or ChatGPT.

Completed Gemini responses are accepted only as `thought* model_output`.
Thought signatures and summaries are opaque and never retained or exposed;
exactly one final text output reaches the existing strict application validator.

Before any future placement, verify source/release commits, checksums, exactly
22 `.gs` files plus `appsscript.json` in the Phase 8C payload, no credentials
or identifiers, the exact synthetic candidate guard, and no scheduled trigger.
Record every native observation as PASS, FAIL, or NOT EXECUTED. Local checks do
not prove native Google behavior.
