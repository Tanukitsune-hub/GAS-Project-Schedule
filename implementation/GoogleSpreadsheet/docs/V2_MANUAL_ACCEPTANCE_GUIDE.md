# Controlled Personal Shadow Pilot Guide - 2.8.22-prepilot

Code Version: `2.8.22-prepilot`

Schema Version: `2.6`

AI Schema Version: `2.0`

Migration Version: `3`

Highest machine gate: `READY_FOR_USER_PERSONAL_SHADOW_PILOT`

Work 0037 scope: `LABEL_GATED_PERSONAL_SHADOW_PILOT`; automatic discovery
requires `手動/取込` on an Inbox message, gives `手動/除外` precedence, and
excludes spam, trash, and ordinary unlabeled Inbox mail. Automation remains
`OFF` until a later explicit user action.

Work 0037 highest permitted status:
`READY_FOR_USER_PERSONAL_SHADOW_PILOT`

Automation: `OFF`

Task canonical schema: `50` physical columns; authority ledger: `21` columns.

## Authorization boundary

This guide describes a later user-assisted personal automation qualification
boundary. It does not authorize a Google, OAuth, deployment, clasp, Gmail,
Calendar, Sheets, trigger mutation, Provider request, Task, Review, Setup,
Diagnostics, or Dashboard action in Work 0036. Work 0036 does not configure or
inspect a real API key, make a real Gemini request, access Gmail runtime, or
invoke an Apps Script function.

The existing personal-synthetic Apps Script target already has the Gemini
credential configured outside the repository. Do not re-enter, rotate, inspect,
or copy the credential for this qualification. The key must never be pasted
into GitHub, Codex, ChatGPT, source, tests, reports, or logs.

## Work 0037 shadow-pilot boundary

- The existing five-minute schedule processes at most one admitted message per
  run and records the distinct `AUTOMATIC_PILOT` source mode.
- The user-controlled run lasts at least 24 hours and uses at least 12
  explicitly selected, non-sensitive work-like messages. Apply `手動/取込`
  only to those messages; do not process ordinary unlabeled Inbox mail.
- Include a `手動/取込` plus `手動/除外` conflict case and verify it does not
  process. Do not retry historical Work 0036 failures or Dead Letters.
- Do not invoke the manual worker while pilot Automation is enabled. Stop on
  any unlabeled processing, duplicate Task/Review/Calendar side effect,
  privacy leak, unexpected Calendar target, duplicate trigger, or
  non-recoverable runtime failure.
- After the run, disable Automation and verify zero owned clock triggers and
  no stored or canonical trigger residue.

This guide is documentation only. Work 0037 Codex execution does not run the
pilot, process Gmail, invoke Gemini, mutate Task/Review/Calendar, or invoke an
Apps Script function.

## Historical Work 0036 qualification boundary

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
