# Controlled Sandbox Trial Guide - 2.8.21-prepilot

Code Version: `2.8.21-prepilot`

Schema Version: `2.6`

AI Schema Version: `2.0`

Migration Version: `3`

Highest machine gate: `READY_FOR_USER_PERSONAL_AUTOMATION_E2E`

Work 0036 scope: `SYNTHETIC_AUTOMATION_QUALIFICATION_ONLY`; automatic
discovery accepts only the exact `[WORK_OS_AUTOMATION_SYNTHETIC_0036]`
fixture, and Automation remains `OFF` until a later explicit user action.

Work 0036 highest permitted status:
`READY_FOR_USER_PERSONAL_AUTOMATION_E2E`

Automation: `OFF`

Task canonical schema: `50` physical columns; authority ledger: `21` columns.

## Authorization boundary

This guide describes a later user-assisted personal automation qualification
boundary. It does not authorize a Google, OAuth, deployment, clasp, Gmail,
Calendar, Sheets, trigger mutation, Provider request, Task, Review, Setup,
Diagnostics, or Dashboard action in Work 0036. Work 0036 does not configure or
inspect a real API key, make a real Gemini request, access Gmail runtime, or
invoke an Apps Script function.

The user may manually enter a real Gemini key into the designated Script
Property only in a later explicitly authorized Work. The key must never be
pasted into GitHub, Codex, ChatGPT, source, tests, reports, or logs.

## Work 0036 qualification boundary

- Gemini uses the exact `/v1beta/interactions` creation endpoint and completed
  responses are accepted only as `thought* model_output`.
  Thought signatures and summaries are opaque and never retained or exposed.
- `getPersonalAutomationQualificationStatus()` is no-argument and read-only.
  It reports the exact synthetic scope, bounded operator/provider readiness,
  candidate guard, and actual Automation/trigger state without a Gmail or
  Gemini request.
- `preparePersonalAutomationQualification()` is idempotent and bounded. It
  updates only the minimum local version metadata required for the candidate;
  it does not read credential values, create triggers, or enable Automation.
- Automatic discovery accepts at most one fresh candidate whose subject and
  normalized body exactly match the fictional UTF-8 fixture. It excludes
  attachments, spam/trash, manual-exclusion threads, and stale/terminal state.

The fixture contains a fixed sentinel, says that it contains no personal,
confidential, or production data, asks for one fictional internal Task due
seven days after processing, and explicitly excludes external, legal, tax,
regulatory, contract, bid, and other high-impact Calendar use.

## Structural checks before any later placement

1. Bind the exact A21 source and B21 release commits and verify checksums.
2. Confirm the Phase 8C payload contains exactly 22 `.gs` files and
   `appsscript.json`.
3. Confirm Automation is OFF and no scheduled trigger exists.
4. Confirm the exact qualification subject/body/query guard and no broad
   production Inbox fallback.
5. Confirm no credential value, identifier, private URL, raw response, or real
   data is present in evidence.
6. Stop on any stale, ambiguous, or incomplete evidence. Do not repair or
   retry a remote operation in this Work.

All remaining native Google, Provider, Gmail, Task, Review, Calendar, Setup,
Diagnostics, Dashboard, trigger, deployment, and OAuth observations must be
recorded as `PASS`, `FAIL`, or `NOT EXECUTED` under their own authorization.
Local tests and package checksums do not promote them to runtime acceptance.
