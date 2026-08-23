# Project Context

Last updated: 2026-08-19

Project ID: `google-workspace-personal-work-os`

Repository of record: `Tanukitsune-hub/GAS-Project-Schedule`

Current candidate: Code `2.8.22-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Machine gate: `READY_FOR_USER_PERSONAL_SHADOW_PILOT`

Personal runtime status: `PERSONAL_SHADOW_PILOT_READY_FOR_USER_CONTROLLED_RUN`

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
- Release: Code `2.8.22-prepilot`, Schema `2.6`, Migration `3`.
- Product state: label-gated personal shadow-pilot candidate; frozen 2.8.20
  and 2.8.21 remain recovery baselines.

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
current `main`. Work 0036 is the frozen 2.8.21 successor, and Work 0037 is the
direct label-gated 2.8.22 pilot successor, preserving current-main governance
and historical release evidence without replaying stacked Draft-PR history.

The canonical non-Google gate must work on `main` itself as well as on numbered
Work branches and PR merge refs. A branch-name-only validation exception is not
an acceptable completion state.

## Work 0037 boundary

The Work 0037 candidate requires `手動/取込` for scheduled admission, gives
`手動/除外` precedence, excludes spam/trash, rejects ordinary unlabeled Inbox
mail, uses `AUTOMATIC_PILOT`, and processes one message per five-minute run.
Automation remains OFF. The next outcome is a separately user-controlled
24-hour shadow pilot with at least 12 explicitly labeled work-like messages;
Codex does not run it or invoke any Apps Script runtime function.

## Assurance and privacy

No credential, token, private URL, account identifier, message body, personal
data, raw provider response, real Workspace identifier, or machine path belongs
in tracked evidence. Environment-specific evidence must remain bounded and
privacy-safe.
