# Google Workspace Personal Work OS v2 窶・2.8.15-prepilot

This directory is the canonical Apps Script source for the Work 0028 successor
to the Work 0018 Gmail repair and Work 0002 clean integration candidate in
`Tanukitsune-hub/GAS-Project-Schedule`.

## Active contract

- Code: `2.8.15-prepilot`
- Schema: `2.6`
- AI Schema: `2.0`
- Migration: `3`
- Task sheet: `50` physical columns
- Authority store: protected hidden `Task Authority Ledger`, `21` columns
- Authority protocol: versioned two-slot `PREPARED` / Task row write /
  `COMMITTED`
- Snapshot or note fallback: `FORBIDDEN`
- `TEST_MODE`: `true` in the Phase 8B candidate
- Automation: `OFF`
- Production provider registry: lazy `GEMINI` registration only; external AI
  remains disabled until credential and approval gates are explicitly met
- Highest gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

The candidate consolidates the final Code 2.8.11 authority, Calendar outbox,
Dashboard, diagnostic-summary, Setup, and fail-closed behavior on the exact
Work 0002 starting main. The S90 module contract identifier remains
`WORK_OS_V2_S90_CONTRACT_2_8_11` because its three-module runtime contract is
unchanged; the candidate Code version is independently `2.8.15-prepilot`.
Work 0028 adds the isolated Gemini Interactions v1 transport in
`20_GeminiProvider.gs`, strict AI2 structured-output validation, a private
synthetic one-message readiness entrypoint, and write-time Review-count
metadata. No real Gemini request is executed in this Work.

## Local validation

From `implementation/GoogleSpreadsheet`:

```text
pnpm install --frozen-lockfile
pnpm run verify:local
```

The gate validates tracked JSON/YAML, the canonical Apps Script inventory,
static policy, every current `*_test.js` suite, both deterministic release
packages, A15/B15 lineage, governance identity, and secret/local-state
exclusions. It performs no Google, OAuth, deployment, clasp, Gmail, Calendar,
Sheets, trigger, or Provider operation.

There is no active transfer or deployment target. The future Sandbox trial
guide is `../docs/V2_MANUAL_ACCEPTANCE_GUIDE.md` and is descriptive only.
