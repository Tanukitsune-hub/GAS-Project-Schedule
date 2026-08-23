# GAS Project Schedule

Google Apps Script source and non-Google validation tooling for the Google
Workspace Personal Work OS.

## Current contract

| Field | Value |
|---|---|
| Code | `2.8.22-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Candidate machine gate | `READY_FOR_USER_PERSONAL_SHADOW_PILOT` |
| ChatGPT review disposition | `READY — LABEL_GATED_PERSONAL_SHADOW_PILOT_IMPLEMENTED` |
| Personal Gemini E2E | `PASS` |
| Product-code state | label-gated personal shadow-pilot candidate |
| Automation | `OFF` |
| Intended environment | personal Google Workspace only |

The canonical payload is exactly 23 `.gs` files plus `appsscript.json`.
`CURRENT_CONTRACT.json`, release manifests, checksums, and verifiers preserve
the historical A20/B20 and Work 0036 A21/B21 evidence. The active successor
uses the canonical-main Work 0037 lineage and preserves the frozen 2.8.20 and
2.8.21 release bytes.

Current packages:

- `implementation/GoogleSpreadsheet/release/v2.8.22-prepilot/`:
  `TEST_MODE=true`, harness included, Automation OFF.
- `implementation/GoogleSpreadsheet/release/v2.8.22-prepilot-phase8c/`:
  the audited production-mode transform with the harness excluded, bounded
  provider-readiness flags enabled, label-gated pilot admission, and
  Automation still OFF.

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
committed 80-suite regression manifest, deterministic 2.8.22 release packages,
canonical-main Work 0037 provenance, frozen 2.8.20/2.8.21 preservation,
current-main integration scope, and secret/local-state exclusions. It performs
no real Google, Gmail, Calendar, Apps Script function, or Gemini operation.

## Work 0037 personal shadow-pilot boundary

Code `2.8.22-prepilot` replaces the historical synthetic-only automatic
admission with a label-gated personal shadow pilot. Scheduled discovery is
limited to fresh Inbox messages carrying `手動/取込`, excludes `手動/除外`,
spam, and trash, and processes at most one message per five-minute run.
Ordinary unlabeled Inbox mail is rejected, the pilot source mode is
`AUTOMATIC_PILOT`, and the manual worker fails closed while pilot Automation
is active. Automation remains OFF in both packages.

The later user-controlled pilot is not executed by Codex. Its bounded steps
and stop criteria are recorded in
`docs/handoffs/0037-personal-shadow-pilot-runbook.md`.

## Work 0036 review-fix result

The review-fix makes `getPersonalAutomationQualificationStatus()` use the
complete fail-closed prerequisite boundary shared with `enableAutomation()`.
The bounded result now includes candidate/version and Setup alignment,
production-shaped exact synthetic scope, approval and actual credential
readiness without credential-value access, OAuth, production Gemini adapter
health, formal Gmail labels, dedicated Calendar, and trigger/state residue.
READY is impossible unless all required checks pass while Automation remains
OFF.

The menu exposes a confirmed, no-argument call to the existing idempotent
preparation path. The repaired Phase 8C payload was updated once on the same
existing personal-synthetic target and independently pulled back with exact
byte/hash parity. Automation, Apps Script functions, Gmail, Gemini, Calendar,
triggers, Setup, diagnostics, and user E2E remained unexecuted.

The runtime-preparation-fix pre-placement CI passed at head
`dab94362c34e837bb236186ace7c0cf9c0f63e40`; the final report-head CI is the
publication gate for `docs/handoffs/0036-runtime-preparation-fix-report.md`.
No company-PC rollout is planned. Real personal mail remains out of scope.

Do not paste credentials, private Workspace identifiers, raw mail, or provider
responses into GitHub issues, PRs, reports, tests, or chat.
