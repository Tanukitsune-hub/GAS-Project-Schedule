# Project Context

Last updated: 2026-08-12

Project ID: `google-workspace-personal-work-os`

Repository of record: `Tanukitsune-hub/GAS-Project-Schedule`

Current candidate: Code `2.8.17-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Machine gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

Work 0030 boundary: `READY_FOR_USER_GEMINI_KEY_CONFIGURATION_AND_ONE_MESSAGE_VALIDATION`

## Purpose

The Apps Script application turns an approved Gmail message into a governed
Task in Google Sheets, supports human Review, and projects eligible deadlines
to a Calendar outbox. Sheets is the Task system of record; Calendar is a
derived view. Automation is OFF.

## Source contract

- Source: `implementation/GoogleSpreadsheet/apps-script-v2/`
- Runtime: Apps Script V8-compatible source; local tools are separate.
- Payload: 23 `.gs` files and `appsscript.json`.
- Task schema: 50 columns with canonical headers.
- Authority: protected hidden 21-column Task Authority Ledger.
- AI Schema: provider-neutral `2.0`; strict application validation remains
  authoritative after any Provider response.
- Provider: Gemini is registered behind explicit approval and credential
  gates. The current Work does not configure, inspect, or call it.
- Release: Code `2.8.17-prepilot`, Schema `2.6`, Migration `3`.

## Work 0030 Gemini response surface

The provider accepts only `thought* model_output` for a completed Gemini
Interactions response. Thought signatures and summaries are opaque and never
parsed, retained, logged, hashed, or surfaced. Exactly one final text output
is passed to the existing strict application validator. The existing
no-argument readiness and synthetic-validation entrypoints remain unchanged
and are not invoked in Work 0030.

The canonical synthetic body is fictional, contains no personal, confidential,
or production data, requests an internal Task, uses a seven-day relative
deadline, and is not a Calendar item. Subject and normalized body matching are
exact. Attachment content and prior-thread context are excluded.

## Assurance and privacy

The local gate runs the integrated source in Node fakes and covers authority,
Review, Gmail policy, Calendar intent, diagnostics, Provider schema, release
parity, secret scanning, and local-state exclusion. It does not prove native
Sheets, Gmail, Calendar, OAuth, trigger, quota, deployment, or Gemini behavior.

No credential, token, private URL, account identifier, message body, personal
data, raw Provider response, real Workspace identifier, or machine path belongs
in tracked evidence. Existing historical reports remain unchanged.
