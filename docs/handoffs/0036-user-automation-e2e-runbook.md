# Work 0036 User-Controlled Automation E2E Runbook

## Status

`HOLD — DO NOT CONTINUE`

The first live preparation attempt on 2026-08-19 stopped safely with:

`WorkOsAppError: Automation依存注入はTest modeだけで利用できます。`

GitHub source review confirmed a production preparation caller defect. Automation remains OFF and no scheduled trigger, Gmail processing, Gemini request, Task/Review mutation, or Calendar action occurred.

Do not rerun `個人用合成Automationを準備`, do not run readiness, and do not enable Automation until the repaired Phase 8C payload has been implemented, validated, placed on the same existing personal-synthetic target, independently pulled back with exact parity, and reviewed by ChatGPT.

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

This runbook may resume only after ChatGPT explicitly confirms that the runtime-preparation repair is complete and authorizes retry of the preparation step. At that time the remaining original bounded sequence continues under the exact synthetic-only scope and one-attempt rules already established for Work 0036.

Until then, no user runtime action is authorized.
