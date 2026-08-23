# Project Context

Last updated: 2026-08-19

Project ID: `google-workspace-personal-work-os`

Repository of record: `Tanukitsune-hub/GAS-Project-Schedule`

Current candidate: Code `2.8.21-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Machine gate: `READY_FOR_USER_PERSONAL_AUTOMATION_E2E`

Personal runtime status: `PERSONAL_GEMINI_E2E_PASS_READY_FOR_PERSONAL_AUTOMATION_QUALIFICATION`

## Purpose

The Apps Script application turns eligible Gmail messages into governed Tasks
in Google Sheets, supports human Review, and projects authorized deadlines to a
Calendar outbox. Sheets is the Task system of record. Automation is OFF.

This is a personal Google Workspace tool. No company-PC or company-environment
deployment is planned.

## Source contract

- Source: `implementation/GoogleSpreadsheet/apps-script-v2/`
- Runtime: Google Apps Script V8; local validation tooling is separate.
- Payload: 23 `.gs` files plus `appsscript.json`.
- Task schema: 50 canonical columns.
- Authority: hidden protected 21-column Task Authority Ledger.
- AI Schema: provider-neutral `2.0`; application validation is authoritative.
- Provider: Gemini Interactions `/v1beta/interactions`, behind explicit gates.
- Release: Code `2.8.21-prepilot`, Schema `2.6`, Migration `3`.
- Product state: synthetic-only personal Automation qualification candidate;
  frozen 2.8.20 remains the recovery baseline.

## Qualified behavior

The personal sandbox has already exercised Gmail preprocessing, governed
Task/Review creation, manual edits, managed Calendar CREATE/UPDATE/DELETE, and
one real Gemini classification-to-Task E2E. The final Gemini attempt completed
with one candidate, one Task, one Review, zero errors, zero Calendar jobs, and
checkpoint `DONE`; Automation remained consistently disabled with no trigger.

The bounded runtime evidence is stored in
`docs/handoffs/0033-live-e2e-review.md`. Credentials and private identifiers
remain outside GitHub and ChatGPT.

## Current repository boundary

Work 0035 cleanly integrated the qualified Code `2.8.20-prepilot` state into
current `main`. Work 0036 is the direct 2.8.21 successor, preserving current-
main governance and historical A20/B20 release evidence without replaying the
stacked Draft-PR history.

The canonical non-Google gate must work on `main` itself as well as on numbered
Work branches and PR merge refs. A branch-name-only validation exception is not
an acceptable completion state.

## Next boundary

The Work 0036 candidate restricts automatic discovery to the exact
`[WORK_OS_AUTOMATION_SYNTHETIC_0036]` subject/body and keeps Automation OFF.
The next outcome is controlled personal Automation qualification. It begins
with Automation OFF and synthetic data only, then proves readiness, one
canonical time trigger, unattended Inbox → Gemini → Task/Review processing,
any separately authorized Calendar projection, and complete disable cleanup.
Real personal mail remains out of scope until the automatic synthetic E2E and
rollback path pass.

## Assurance and privacy

No credential, token, private URL, account identifier, message body, personal
data, raw provider response, real Workspace identifier, or machine path belongs
in tracked evidence. Environment-specific evidence must remain bounded and
privacy-safe.
