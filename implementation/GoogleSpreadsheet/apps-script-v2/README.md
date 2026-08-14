# Google Workspace Personal Work OS v2 - 2.8.18-prepilot

This directory is the canonical Apps Script source for the Work 0031
Gemini v1beta endpoint remediation in
`Tanukitsune-hub/GAS-Project-Schedule`.

## Active contract

- Code: `2.8.18-prepilot`
- Schema: `2.6`
- AI Schema: `2.0`
- Migration: `3`
- Task schema: 50 physical columns
- Authority: protected hidden `Task Authority Ledger`, 21 columns
- `TEST_MODE`: `true` in the Phase 8B package
- Automation: `OFF`
- Machine gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`
- Work 0031 highest permitted status:
  `READY_FOR_USER_GEMINI_ONE_MESSAGE_RETRY`

The source retains the Gmail byte-body decoder, durable Task authority,
Review/CAS, Calendar outbox, diagnostics, and strict privacy boundaries. It
also contains the isolated Gemini Interactions v1beta provider, documented
structured-output subset, bounded generation settings, strict
`thought* model_output` parsing, exact synthetic UTF-8 fixture, and
no-argument readiness/validation entrypoints.

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

The local gate runs the current test suites, source/static checks, release
parity, A18/B18 lineage, active-document UTF-8/history checks, and secret/local
state scans. It does not configure or inspect a real key and performs no
Google, OAuth, Gmail, Calendar, Apps Script function, or Gemini operation.
