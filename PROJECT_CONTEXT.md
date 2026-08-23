# Project Context

Last updated: 2026-08-19

Project ID: `google-workspace-personal-work-os`

Repository of record: `Tanukitsune-hub/GAS-Project-Schedule`

Current candidate: Code `2.8.23-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Machine gate: `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`

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
- Release: Code `2.8.23-prepilot`, Schema `2.6`, Migration `3`.
- Product state: automatic personal Inbox shadow-pilot candidate; frozen
  2.8.20, 2.8.21, and 2.8.22 remain recovery baselines.

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
current `main`. Work 0036 is the frozen 2.8.21 successor, Work 0037's prior
2.8.22 label-gated candidate is historical, and the revised Work 0037 is the
direct automatic Inbox 2.8.23 pilot successor, preserving current-main
governance and historical release evidence without replaying stacked Draft-PR
history.

The canonical non-Google gate must work on `main` itself as well as on numbered
Work branches and PR merge refs. A branch-name-only validation exception is not
an acceptable completion state.

## Work 0037 boundary

The revised Work 0037 candidate admits ordinary eligible personal Inbox mail,
gives `手動/除外` Thread-wide precedence, excludes spam/trash, non-Inbox,
Promotions, Social, clear newsletters/list mail, and Google Calendar
notifications, uses `AUTOMATIC_INBOX_PILOT`, and processes one message per
five-minute run. A successful explicit enable establishes the pilot-start
boundary; older mail is never admitted. Automation remains OFF. The next
outcome is a separately user-controlled automatic Inbox shadow pilot; Codex
does not run it or invoke any Apps Script runtime function.

## Assurance and privacy

No credential, token, private URL, account identifier, message body, personal
data, raw provider response, real Workspace identifier, or machine path belongs
in tracked evidence. Environment-specific evidence must remain bounded and
privacy-safe.
