# Google Workspace Personal Work OS v2 - 2.8.22-prepilot

This directory is the canonical Apps Script source for the Work 0037
label-gated personal shadow-pilot candidate in
`Tanukitsune-hub/GAS-Project-Schedule`.

## Active contract

- Code: `2.8.22-prepilot`
- Schema: `2.6`
- AI Schema: `2.0`
- Migration: `3`
- Task schema: 50 physical columns
- Authority: protected hidden `Task Authority Ledger`, 21 columns
- `TEST_MODE`: `true` in the Phase 8B package
- Automation: `OFF`
- Machine gate: `READY_FOR_USER_PERSONAL_SHADOW_PILOT`
- Work 0037 highest permitted status:
  `READY_FOR_USER_PERSONAL_SHADOW_PILOT`

The source retains the Gmail byte-body decoder, durable Task authority,
Review/CAS, Calendar outbox, diagnostics, and strict privacy boundaries. It
also contains the isolated Gemini Interactions v1beta provider, a deterministic
provider-facing schema projection over the canonical AI Schema 2.0,
documented structured-output subset, bounded generation settings, strict
`thought* model_output` parsing, exact synthetic UTF-8 fixture, and
no-argument readiness/validation entrypoints.

Automatic discovery is label-gated: a fresh Inbox message must carry
`手動/取込`, `手動/除外` wins, and spam/trash plus ordinary unlabeled Inbox
mail are excluded. The scheduled source mode is `AUTOMATIC_PILOT`, one message
is processed per existing five-minute run, and there is no broad-Inbox fallback.
The candidate preparation and readiness surfaces preserve Automation OFF and
use personal owner/operator approval semantics.

`getPersonalShadowPilotStatus()` now requires the complete
fail-closed readiness boundary shared with `enableAutomation()`. It reports
bounded candidate, Setup, exact synthetic scope, provider/OAuth, formal-label,
Calendar, and trigger-state details without reading a credential value or
performing a runtime request. The menu's confirmed preparation action invokes
the existing no-argument idempotent preparation path and leaves Automation OFF.

`getPersonalShadowPilotStatus()` and `preparePersonalShadowPilot()` perform no
Gmail or Gemini request. The later user-controlled pilot is the only boundary
that may process explicitly labeled personal messages; it is not executed by
Codex and must not be replaced by a broad Inbox fallback.

## Local validation

From `implementation/GoogleSpreadsheet`:

```text
pnpm install --frozen-lockfile
pnpm run verify:local
```

The local gate runs the exact committed test inventory, source/static checks,
release parity, A21/B21 lineage, historical A20/B20 preservation,
active-document UTF-8/history checks, and secret/local
state scans. It does not configure or inspect a real key and performs no
Google, OAuth, Gmail, Calendar, Apps Script function, or Gemini operation.
