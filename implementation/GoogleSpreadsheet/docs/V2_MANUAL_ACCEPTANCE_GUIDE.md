# Controlled Sandbox Trial Guide - 2.8.20-prepilot

Code Version: `2.8.20-prepilot`

Schema Version: `2.6`

AI Schema Version: `2.0`

Migration Version: `3`

Highest machine gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

Work 0033 highest permitted status:
`READY_FOR_USER_GEMINI_E2E_RETRY_AFTER_SCHEMA_COMPATIBILITY_REPAIR`

Automation: `OFF`

Task canonical schema: `50` physical columns; authority ledger: `21` columns.

## Authorization boundary

This guide describes a later user-assisted validation boundary. It does not
authorize a Google, OAuth, deployment, clasp, Gmail, Calendar, Sheets,
  trigger, Provider, Task, Review, Setup, Diagnostics, or Dashboard action in
  Work 0033. Work 0033 does not configure or inspect a real API key, make a real
Gemini request, access Gmail runtime, or invoke an Apps Script function.

The user may manually enter a real Gemini key into the designated Script
Property only in a later explicitly authorized Work. The key must never be
pasted into GitHub, Codex, ChatGPT, source, tests, reports, or logs.

## Work 0033 response boundary

- Gemini uses the exact `/v1beta/interactions` creation endpoint and completed
  responses are accepted only as `thought* model_output`.
  Thought signatures and summaries are opaque and never retained or exposed.
- `checkGeminiSyntheticReadiness()` is no-argument and read-only. It reports
  only bounded provider metadata, credential configured/not-configured state,
  and actual Automation status. It performs no Gmail or Gemini request.
- `runGeminiSyntheticValidationOnce()` is no-argument and test-mode only. It
  accepts exactly one manually selected candidate whose subject and normalized
  body exactly match the fictional UTF-8 fixture. It checks Automation first,
  excludes attachments and prior-thread context, and permits at most one
  Provider request in the later authorized Work. It never falls back to Mock.

The fixture contains a fixed sentinel, says that it contains no personal,
confidential, or production data, asks for one fictional internal Task due
seven days after processing, and explicitly excludes external, legal, tax,
regulatory, contract, bid, and other high-impact Calendar use.

## Structural checks before any later placement

1. Bind the exact A20 source and B20 release commits and verify checksums.
2. Confirm the payload contains exactly 23 `.gs` files and `appsscript.json`.
3. Confirm Automation is OFF and no scheduled trigger exists.
4. Confirm no credential value, identifier, private URL, raw response, or real
   data is present in evidence.
5. Stop on any stale, ambiguous, or incomplete evidence. Do not repair or
   retry a remote operation in this Work.

All remaining native Google, Provider, Gmail, Task, Review, Calendar, Setup,
Diagnostics, Dashboard, trigger, deployment, and OAuth observations must be
recorded as `PASS`, `FAIL`, or `NOT EXECUTED` under their own authorization.
Local tests and package checksums do not promote them to runtime acceptance.
