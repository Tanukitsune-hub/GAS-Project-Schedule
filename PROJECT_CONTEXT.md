# Project Context

Last updated: 2026-08-18

Project ID: `google-workspace-personal-work-os`

Repository of record: `Tanukitsune-hub/GAS-Project-Schedule`

Current candidate: Code `2.8.20-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Machine gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

Work 0033 boundary: `READY_FOR_USER_GEMINI_E2E_RETRY_AFTER_SCHEMA_COMPATIBILITY_REPAIR`

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
- Provider-facing schema: deterministic compatibility projection of AI Schema
  2.0; canonical application validation remains unchanged and authoritative.
- Provider: Gemini is registered behind explicit approval and credential
  gates. The credential value exists only in the user's personal-synthetic
  Script Properties and is never stored or inspected by the repository or
  Codex. Work 0032 itself does not call the Provider.
- Release: Code `2.8.20-prepilot`, Schema `2.6`, Migration `3`.

## Work 0033 Gemini schema-compatibility transport surface

The provider uses the Gemini Interactions creation endpoint
`https://generativelanguage.googleapis.com/v1beta/interactions` and retains
the Work 0030 `thought* model_output` grammar. Thought signatures and
summaries are opaque and never parsed, retained, logged, hashed, or surfaced.
Exactly one final text output is passed to the existing strict application
validator.

Non-2xx responses retain only a bounded numeric HTTP status and a strict
machine-safe provider code. Invalid 2xx responses may retain only an
allowlisted interaction status. Human provider messages, details, headers,
payloads, identifiers, credentials, and raw response bodies are not surfaced
or persisted. External-AI failure finalization uses only the Message State
context and reports `RECORDED` or an explicit safe `PENDING` state.

The canonical synthetic body is fictional, contains no personal, confidential,
or production data, requests an internal Task, uses a seven-day relative
deadline, and is not a Calendar item. Subject and normalized body matching are
exact. Attachment content and prior-thread context are excluded. Synthetic
validation pins the exact selected Message and does not fall through to an
older eligible or resumable Message State row.

Work 0030 remains the historical A17/B17 parser candidate. Work 0031 remains
the historical A18/B18 endpoint candidate. Work 0032 remains the historical
A19/B19 diagnostics candidate. Work 0033 is the active A20/B20 schema-
compatibility candidate. The existing personal-synthetic target may be used
only for the guarded Work 0033 source placement; no credential value or
private identifier belongs in evidence.

## Current live validation boundary

The user has manually configured the Gemini key outside the repository and
network-free readiness passed. User-controlled real Gemini calls have reached
the Provider in the personal sandbox, but the classification-to-Task E2E has
not yet completed. The latest live attempt occurred before Code
`2.8.20-prepilot` schema compatibility is available; the prior
`2.8.19-prepilot` diagnostics attempt remains historical failure evidence.

The next permitted action is one fresh exact synthetic Gmail Message with
`手動/取込`, followed by one invocation of
`Gemini synthetic validation (one request)`. Prior failed, stuck, or terminal
Messages are not reset or reused. A success completes the personal-environment
Gemini E2E and moves the candidate to code freeze. A failure must be narrowed
only from the bounded safe diagnostic and checkpoint fields returned by Work
0032 or a later authorized Work.

## Assurance and privacy

The local gate runs the integrated source in Node fakes and covers authority,
Review, Gmail policy, Calendar intent, diagnostics, Provider schema, release
parity, secret scanning, and local-state exclusion. Earlier native sandbox
work has separately exercised Gmail preprocessing, governed Task/Review,
manual edits, and the managed Calendar CREATE/UPDATE/DELETE lifecycle. The
remaining unclosed native boundary is successful real-Gemini classification
through governed Task creation.

No credential, token, private URL, account identifier, message body, personal
data, raw Provider response, real Workspace identifier, or machine path belongs
in tracked evidence. Existing historical reports remain unchanged.
