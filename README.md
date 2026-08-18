# GAS Project Schedule

Google Apps Script source and non-Google validation tooling for the Google
Workspace Personal Work OS.

## Current contract

| Field | Value |
|---|---|
| Code | `2.8.20-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Machine gate | `READY_FOR_CONTROLLED_SANDBOX_VALIDATION` |
| Personal Gemini E2E | `PASS` |
| Product-code state | frozen manual-plus-Gemini baseline |
| Automation | `OFF` |
| Intended environment | personal Google Workspace only |

The canonical payload is exactly 23 `.gs` files plus `appsscript.json`.
`CURRENT_CONTRACT.json`, release manifests, checksums, and verifiers preserve
the historical A20/B20 source and release evidence.

Current packages:

- `implementation/GoogleSpreadsheet/release/v2.8.20-prepilot/`:
  `TEST_MODE=true`, harness included, Automation OFF.
- `implementation/GoogleSpreadsheet/release/v2.8.20-prepilot-phase8c/`:
  the audited `TEST_MODE=false` transform with the harness excluded.

Neither package authorizes deployment or Automation enablement by itself.

## Qualified personal Gemini E2E

On 2026-08-18 the user ran one fresh approved synthetic Gmail Message through
`Gemini synthetic validation (one request)` in the personal sandbox. The
bounded result was `COMPLETE`: one candidate processed, one Task and one Review
created, zero errors, zero Calendar jobs, checkpoint `DONE`, and Automation
consistently OFF with no clock trigger.

The review is recorded in `docs/handoffs/0033-live-e2e-review.md`. The Gemini
credential remains outside this repository.

## Validation

From `implementation/GoogleSpreadsheet`:

```text
pnpm install --frozen-lockfile
pnpm run verify:local
```

The gate checks JSON/YAML, Apps Script inventory and syntax, all current Node
regression suites, deterministic 2.8.20 release packages, historical A20/B20
provenance, current-main integration scope, and secret/local-state exclusions.
It performs no real Google, Gmail, Calendar, Apps Script function, or Gemini
operation.

## Next phase

No company-PC rollout is planned. After Work 0035 makes the qualified baseline
canonical on `main`, the next Work is controlled personal Automation
qualification. It must start disabled, use synthetic Inbox messages, prove
exactly one canonical time trigger, unattended Gmail → Gemini → Task/Review
processing, any separately authorized Calendar behavior, and complete disable
cleanup before real personal mail is admitted.

Do not paste credentials, private Workspace identifiers, raw mail, or provider
responses into GitHub issues, PRs, reports, tests, or chat.
