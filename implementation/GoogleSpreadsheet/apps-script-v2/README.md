# Google Workspace Personal Work OS v2 - 2.8.24-prepilot

This directory is the canonical Apps Script source for the Work 0037
automatic personal Inbox shadow-pilot candidate in
`Tanukitsune-hub/GAS-Project-Schedule`.

## Active contract

- Code: `2.8.24-prepilot`
- Schema: `2.6`
- AI Schema: `2.0`
- Migration: `3`
- Task schema: 50 physical columns
- Authority: protected hidden `Task Authority Ledger`, 21 columns
- `TEST_MODE`: `true` in the Phase 8B package
- Automation: `OFF`
- Machine gate: `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`
- Work 0037 highest permitted status:
  `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`

The source retains the Gmail byte-body decoder, durable Task authority,
Review/CAS, Calendar outbox, diagnostics, and strict privacy boundaries. It
also contains the isolated Gemini Interactions v1beta provider, a deterministic
provider-facing schema projection over the canonical AI Schema 2.0,
documented structured-output subset, bounded generation settings, strict
`thought* model_output` parsing, exact synthetic UTF-8 fixture, and
no-argument readiness/validation entrypoints.

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
that may process personal Inbox messages; it is not executed by Codex and must
not be replaced by an unbounded fallback.

The scheduled `AUTO_PILOT` path records `TIME_DRIVEN / AUTO_PILOT` for
meaningful runs. A fully healthy/no-op run leaves the existing
`AUTOMATION_LAST_RUN_AT` heartbeat intact without adding a detailed Run History
row. Only valid detailed Run History records strictly older than 90 days are
compacted; invalid or missing timestamps and all non-Run-History business or
audit surfaces are preserved.

## Local validation

From `implementation/GoogleSpreadsheet`:

```text
pnpm install --frozen-lockfile
pnpm run verify:local
```

The local gate runs the exact committed test inventory, source/static checks,
release parity, A24/B24 lineage, historical A20/B20/A21/B21/A22/B22/A23/B23 preservation,
active-document UTF-8/history checks, and secret/local
state scans. It does not configure or inspect a real key and performs no
Google, OAuth, Gmail, Calendar, Apps Script function, or Gemini operation.
