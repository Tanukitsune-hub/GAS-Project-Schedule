# Google Workspace Personal Work OS v2 - 2.8.27-prepilot

This directory is the canonical Apps Script source for the Work 0041
Calendar scheduled-drain candidate in
`Tanukitsune-hub/GAS-Project-Schedule`.

## Active contract

- Code: `2.8.27-prepilot`
- Schema: `2.6`
- AI Schema: `2.0`
- Migration: `3`
- Task schema: 50 physical columns
- Authority: protected hidden `Task Authority Ledger`, 21 columns
- `TEST_MODE`: `true` in the Phase 8B package
- Automation: `OFF`
- Machine gate: `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`
- Work 0041 inherited machine gate:
  `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`

The source retains the Gmail byte-body decoder, durable Task authority,
Review/CAS, Calendar outbox, diagnostics, and strict privacy boundaries. It
also contains the isolated Gemini Interactions v1beta provider, a deterministic
provider-facing schema projection over the canonical AI Schema 2.0,
documented structured-output subset, bounded generation settings, strict
`thought* model_output` parsing, exact synthetic UTF-8 fixture, and
no-argument readiness/validation entrypoints. Work 0039 adds a parallel direct
OpenAI Responses provider and a code-owned provider-selection boundary. The
authoritative selection is `WORK_OS_V2_ACTIVE_AI_PROVIDER`; the Settings sheet
value is informational only and absent selection remains Gemini.

OpenAI is pinned to `gpt-5.6-luna`, prompt
`openai-responses-v1-work-os-v2`, and the direct
`https://api.openai.com/v1/responses` endpoint. Requests use structured JSON,
`store=false`, no tools, no background mode, and no streaming. OpenAI
credentials use the separate `WORK_OS_V2_OPENAI_API_KEY` Script Property and
are never displayed, logged, committed, bundled, or copied.

Automatic discovery admits ordinary eligible personal Inbox messages. A
Thread-wide `手動/除外` veto, spam/trash, non-Inbox, Promotions, Social, clear
newsletter/list mail, and Google Calendar notification exclusions are hard
boundaries; `手動/取込` is optional priority only. The scheduled source mode is
`AUTOMATIC_INBOX_PILOT`, one message is processed per existing five-minute
run, and the first successful explicit enable establishes a durable start
boundary that rejects older messages. The candidate preparation and readiness
surfaces preserve Automation OFF and use personal owner/operator approval
semantics.

`getPersonalShadowPilotStatus()` now requires the complete
fail-closed readiness boundary shared with `enableAutomation()`. It reports
bounded candidate, Setup, exact synthetic scope, provider/OAuth, formal-label,
Calendar, and trigger-state details without reading a credential value or
performing a runtime request. The menu's confirmed preparation action invokes
the existing no-argument idempotent preparation path and leaves Automation OFF.

`getPersonalShadowPilotStatus()` and `preparePersonalShadowPilot()` perform no
Gmail or Gemini request. The later user-controlled pilot is the only boundary
that may process personal Inbox messages; the prior personal pilot was executed
and stopped by the user, while no new pilot is executed by Codex and must not
be replaced by an unbounded fallback.

The scheduled `AUTO_PILOT` path records `TIME_DRIVEN / AUTO_PILOT` for
meaningful runs. A fully healthy/no-op run leaves the existing
`AUTOMATION_LAST_RUN_AT` heartbeat intact without adding a detailed Run History
row. Only valid detailed Run History records strictly older than 90 days are
compacted; invalid or missing timestamps and all non-Run-History business or
audit surfaces are preserved.

## Work 0041 scheduled Calendar boundary

After Message/Gmail processing, the canonical five-minute worker drains due
standalone Calendar Outbox jobs created by Review acceptance or Task edits,
including when the source Message is already DONE. The remaining per-run job
allowance, worker lease, shared execution budget, Calendar claim/expiry,
Task authority and CAS are enforced. Calendar failures remain FAILED or PAUSED;
deferred retry/DEAD work is not reported as healthy idle. The manual one-job
command remains a fallback. Schema, migration, provider and Review policies
are unchanged.

Work 0039/0040 acceptance stays closed. Company target-email Gemini processing
is accepted user evidence; company Calendar E2E is NOT_ACCEPTED. This successor
is a locally validated candidate with all live Codex actions NOT_EXECUTED.

## Local validation

From `implementation/GoogleSpreadsheet`:

```text
pnpm install --frozen-lockfile
pnpm run verify:local
```

The local gate runs the exact committed test inventory, source/static checks,
release parity, Work 0041 bundle checks, historical A20/B20/A21/B21/A22/B22/A23/B23/A24/B24 and
Work 0038 preservation,
active-document UTF-8/history checks, and secret/local
state scans. It does not configure or inspect a real key and performs no
Google, OAuth, Gmail, Calendar, Apps Script function, Gemini, or OpenAI
operation.

## Work 0039 selection and qualification boundary

Switching provider is explicit and serialized by Script Lock. It requires
consistent Automation-OFF state, zero owned clock triggers, no active worker
lease, and no in-flight or retry-pending message state. The switch itself does
not call either provider, and a dependent-update failure restores the prior
property. Each classification attempt verifies that the selected provider did
not change before committing its result; Gemini failures never invoke OpenAI
and OpenAI failures never invoke Gemini.

`getAiProviderStatus()` exposes only bounded provider metadata, readiness,
credential-presence booleans, governance status, and qualification state.
`runSelectedProviderSyntheticQualification()` accepts only the fixed fictional
fixture, performs at most one request for an explicit action, and persists only
bounded status/fingerprint data. The OpenAI governance state is
`NOT_APPROVED_OR_UNKNOWN`; company data, live credentials, provider requests,
Workspace installation, deployment, OAuth, triggers, and Automation are
outside this dispatch and remain `NOT EXECUTED`.
