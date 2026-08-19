# GAS Project Schedule

Google Apps Script source and non-Google validation tooling for the Google
Workspace Personal Work OS.

## Current contract

| Field | Value |
|---|---|
| Code | `2.8.21-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Candidate machine gate | `READY_FOR_USER_PERSONAL_AUTOMATION_E2E` |
| ChatGPT review disposition | `HOLD — FALSE_READINESS_SURFACE_REPAIR_REQUIRED` |
| Personal Gemini E2E | `PASS` |
| Product-code state | synthetic-only personal Automation qualification candidate |
| Automation | `OFF` |
| Intended environment | personal Google Workspace only |

The canonical payload is exactly 23 `.gs` files plus `appsscript.json`.
`CURRENT_CONTRACT.json`, release manifests, checksums, and verifiers preserve
the historical A20/B20 source and release evidence. The active successor uses
A21/B21 lineage and preserves the 2.8.20 recovery bytes.

Current packages:

- `implementation/GoogleSpreadsheet/release/v2.8.21-prepilot/`:
  `TEST_MODE=true`, harness included, Automation OFF.
- `implementation/GoogleSpreadsheet/release/v2.8.21-prepilot-phase8c/`:
  the audited production-mode transform with the harness excluded, bounded
  provider-readiness flags enabled, and Automation still OFF.

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

The gate checks JSON/YAML, Apps Script inventory and syntax, the exact
committed 77-suite regression manifest, deterministic 2.8.21 release packages,
A21/B21 provenance, historical 2.8.20 preservation, current-main integration
scope, and secret/local-state exclusions. It performs no real Google, Gmail,
Calendar, Apps Script function, or Gemini operation.

## Current review hold

The Work 0036 source, release packages, existing-target placement, pull-back
parity, and final CI passed. Final ChatGPT review nevertheless found that
`getPersonalAutomationQualificationStatus()` can return
`READY_FOR_CONTROLLED_QUALIFICATION` from Automation-OFF state alone while AI,
version, formal-label, Calendar, or OAuth prerequisites are not ready. It also
returns `NOT_CHECKED` for formal labels and Calendar.

The actual `enableAutomation()` path remains fail-closed, so this finding does
not expose ordinary Inbox mail or enable Automation. It does prevent the
readiness screen from being trusted as the user-side E2E gate. Do not begin the
personal Automation E2E until the bounded Work 0036 review repair is completed,
placed on the same target, and independently revalidated.

No company-PC rollout is planned. Real personal mail remains out of scope.

Do not paste credentials, private Workspace identifiers, raw mail, or provider
responses into GitHub issues, PRs, reports, tests, or chat.
