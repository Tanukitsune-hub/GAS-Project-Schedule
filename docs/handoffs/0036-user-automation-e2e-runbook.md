# Work 0036 User-Controlled Automation E2E Runbook

## Status

`READY — WAITING FOR EXPLICIT USER ACTION`

The first live preparation attempt on 2026-08-19 stopped safely with:

`WorkOsAppError: Automation依存注入はTest modeだけで利用できます。`

GitHub source review confirmed a production preparation caller defect. Automation remains OFF and no scheduled trigger, Gmail processing, Gemini request, Task/Review mutation, or Calendar action occurred.

The bounded runtime-preparation repair has now been implemented, validated,
placed on the same existing personal-synthetic target, independently pulled
back with exact parity, and reviewed by ChatGPT. Codex did not run preparation,
readiness, enablement, or any Apps Script function. The user may continue only
with the explicit synthetic-only E2E action below.

Authoritative repair handoff:

- `docs/handoffs/0036-runtime-preparation-fix-instruction.md`
- `docs/handoffs/0036-runtime-preparation-fix-addendum.md`

## Original outcome after HOLD is cleared

Perform the first live personal Automation end-to-end qualification for Code
`2.8.21-prepilot` in the existing personal-synthetic Google Workspace target.

This is a continuation of Work ID `0036`. It does not authorize ordinary
personal Inbox processing or broad production use.

Success means one fresh exact synthetic Gmail fixture is processed unattended
through the scheduled Automation path to the governed Task/Review outcome,
followed by a verified Automation disable/trigger-cleanup rollback.

## Resume condition

ChatGPT has confirmed that the runtime-preparation repair is complete. The
remaining bounded sequence continues only under the exact synthetic-only scope
and one-attempt rules already established for Work 0036. Keep Automation OFF
before preparation, do not use ordinary personal Inbox mail, and stop on any
committed fail-closed condition.

No runtime action was performed by Codex in Work 0036 runtime-preparation fix.
