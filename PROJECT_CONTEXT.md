# Project Context

Last updated: 2026-09-05

Project ID: `google-workspace-personal-work-os`

Repository of record: `Tanukitsune-hub/GAS-Project-Schedule`

Current candidate: Code `2.8.27-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Machine gate: `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`

Current review status: `WORK_0041_PENDING_REVIEW`; company Calendar E2E: `NOT_ACCEPTED`

## Purpose

The Apps Script application turns eligible Gmail messages into governed Tasks
in Google Sheets, supports human Review, and projects authorized deadlines to a
Calendar outbox. Sheets is the Task system of record. The artifact's Automation
default is OFF; Codex has not inspected or changed company runtime state.

Work 0041 prepares a company-primary Gemini Calendar remediation candidate.
Company setup and eligible-email Gemini processing are accepted user evidence;
Calendar E2E remains open. Codex performs only local and GitHub work.

## Source contract

- Source: `implementation/GoogleSpreadsheet/apps-script-v2/`
- Runtime: Google Apps Script V8; local validation tooling is separate.
- Payload: 25 `.gs` files plus `appsscript.json`.
- Task schema: 50 canonical columns.
- Authority: hidden protected 21-column Task Authority Ledger.
- AI Schema: provider-neutral `2.0`; application validation is authoritative.
- Provider: explicit code-owned selection between Gemini Interactions
  `/v1beta/interactions` and direct OpenAI Responses `/v1/responses`.
- Release: Code `2.8.27-prepilot`, Schema `2.6`, Migration `3`.
- Product state: bounded scheduled Calendar-drain candidate; all prior releases
  remain frozen source/release evidence. Company Gemini processing is accepted;
  Azure OpenAI is a separate deferred route, not implemented by this candidate.

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
2.8.22 label-gated and 2.8.23 automatic-Inbox candidates are historical, and
the current Work 0037 is the direct 2.8.25 operational-log successor, and Work
0039 is the 2.8.26 provider-selection successor, preserving current-main
governance and historical release evidence without replaying stacked Draft-PR
history.

## Work 0039 provider-selection boundary

Work 0039 adds OpenAI as a parallel provider behind the existing provider-neutral
adapter. `WORK_OS_V2_ACTIVE_AI_PROVIDER` is the only authoritative selection;
the Settings sheet remains informational. Switching is guarded by consistent
Automation-OFF state, zero owned clock triggers, no active worker lease, and no
in-flight or retry-pending message state. There is no automatic fallback between
Gemini and OpenAI.

The OpenAI candidate is `gpt-5.6-luna` at the direct Responses endpoint with
`store=false`, no tools, background mode, or streaming. The company data-policy
state is `NOT_APPROVED_OR_UNKNOWN`, credentials and live provider calls remain
outside this repository, and all Work 0039 evidence is synthetic/non-live.

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

Scheduled `AUTO_PILOT` logging records `TIME_DRIVEN / AUTO_PILOT` for
meaningful runs, suppresses only fully healthy/no-op detail rows, preserves the
existing `AUTOMATION_LAST_RUN_AT` heartbeat, and applies the 90-day cutoff only
to detailed Run History. Missing or invalid timestamps and all non-Run-History
business/audit surfaces are preserved.

## Assurance and privacy

No credential, token, private URL, account identifier, message body, personal
data, raw provider response, real Workspace identifier, or machine path belongs
in tracked evidence. Environment-specific evidence must remain bounded and
privacy-safe.
