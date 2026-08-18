# Project Context

Last updated: 2026-08-18

Project ID: `google-workspace-personal-work-os`

Repository of record: `Tanukitsune-hub/GAS-Project-Schedule`

Current candidate: Code `2.8.20-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Machine gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

Personal runtime status: `PERSONAL_GEMINI_E2E_PASS_CODE_FROZEN`

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
  Codex.
- Release: Code `2.8.20-prepilot`, Schema `2.6`, Migration `3`.
- Product-code state: frozen after successful personal Gemini E2E.

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
compatibility candidate. The historical Work 0033 Codex run made no real
Gemini request. The later user-controlled runtime qualification is separately
recorded in `docs/handoffs/0033-live-e2e-review.md`.

## Personal live validation — PASS

The user manually configured the Gemini key outside the repository and
network-free readiness passed. On 2026-08-18 the user then executed one fresh
approved synthetic Gmail Message through `Gemini synthetic validation (one
request)` on Code `2.8.20-prepilot`.

The bounded result was `COMPLETE`, processed exactly one candidate, created one
Task and one Review, recorded zero processing errors and zero Calendar jobs,
reached checkpoint `DONE`, called AI, and left Automation `CONSISTENT`,
disabled, with zero scheduled/clock triggers and no stored/canonical trigger
presence.

This satisfies the pre-declared personal-environment E2E completion condition.
The remaining native boundary is no longer real-Gemini classification through
Task creation; that boundary is closed. Code `2.8.20-prepilot` is now frozen.

## Next boundary: company environment qualification

Company-PC / company-environment setup is now environment qualification rather
than a new feature-development phase. Qualification should prove the frozen
candidate under the actual company Google Workspace permission model, network
controls, OAuth policy, Apps Script restrictions, and allowed data-handling
boundary.

Environment-specific restrictions should be treated as qualification or
configuration findings unless they demonstrate that the frozen product itself
cannot satisfy a required use case. Product source should reopen only on new
material evidence of an environment-independent defect or a failed required
qualification check.

## Assurance and privacy

The local gate runs the integrated source in Node fakes and covers authority,
Review, Gmail policy, Calendar intent, diagnostics, Provider schema, release
parity, secret scanning, and local-state exclusion. Earlier native sandbox
work separately exercised Gmail preprocessing, governed Task/Review, manual
edits, and the managed Calendar CREATE/UPDATE/DELETE lifecycle. The final
personal Gemini classification-to-Task E2E has now also passed.

The accepted live result is user-supplied bounded UI evidence; ChatGPT did not
independently invoke Apps Script, access Gmail or Spreadsheet runtime, inspect
the credential, or reproduce the Provider request.

No credential, token, private URL, account identifier, message body, personal
data, raw Provider response, real Workspace identifier, or machine path belongs
in tracked evidence. Existing historical reports remain unchanged.
