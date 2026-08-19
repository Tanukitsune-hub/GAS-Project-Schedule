# Google Workspace Personal Work OS v2 - 2.8.21-prepilot

This directory is the canonical Apps Script source for the Work 0036
synthetic-only personal Automation qualification candidate in
`Tanukitsune-hub/GAS-Project-Schedule`.

## Active contract

- Code: `2.8.21-prepilot`
- Schema: `2.6`
- AI Schema: `2.0`
- Migration: `3`
- Task schema: 50 physical columns
- Authority: protected hidden `Task Authority Ledger`, 21 columns
- `TEST_MODE`: `true` in the Phase 8B package
- Automation: `OFF`
- Machine gate: `READY_FOR_USER_PERSONAL_AUTOMATION_E2E`
- Work 0036 highest permitted status:
  `READY_FOR_USER_PERSONAL_AUTOMATION_E2E`

The source retains the Gmail byte-body decoder, durable Task authority,
Review/CAS, Calendar outbox, diagnostics, and strict privacy boundaries. It
also contains the isolated Gemini Interactions v1beta provider, a deterministic
provider-facing schema projection over the canonical AI Schema 2.0,
documented structured-output subset, bounded generation settings, strict
`thought* model_output` parsing, exact synthetic UTF-8 fixture, and
no-argument readiness/validation entrypoints.

Automatic discovery is restricted to the exact
`[WORK_OS_AUTOMATION_SYNTHETIC_0036]` subject and normalized UTF-8 body,
with one fresh Message per run and no broad-Inbox fallback. The candidate
preparation and readiness surfaces preserve Automation OFF and use personal
owner/operator approval semantics.

`getPersonalAutomationQualificationStatus()` now requires the complete
fail-closed readiness boundary shared with `enableAutomation()`. It reports
bounded candidate, Setup, exact synthetic scope, provider/OAuth, formal-label,
Calendar, and trigger-state details without reading a credential value or
performing a runtime request. The menu's confirmed preparation action invokes
the existing no-argument idempotent preparation path and leaves Automation OFF.

`checkGeminiSyntheticReadiness()` performs no Gmail or Gemini request.
`runGeminiSyntheticValidationOnce()` is test-mode only, checks actual runtime
Automation state before external access, accepts one exact manual synthetic
message, and permits at most one Provider request in a later separately
authorized Work. It never accepts a real message or falls back to Mock.

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
