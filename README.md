# GAS Project Schedule

Google Apps Script source and non-Google validation tooling for the Google
Workspace Personal Work OS.

## Current contract

| Field | Value |
|---|---|
| Code | `2.8.23-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Candidate machine gate | `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT` |
| ChatGPT review disposition | `READY — AUTOMATIC_INBOX_PERSONAL_SHADOW_PILOT_IMPLEMENTED` |
| Personal Gemini E2E | `PASS` |
| Product-code state | automatic personal Inbox shadow-pilot candidate |
| Automation | `OFF` |
| Intended environment | personal Google Workspace only |

The canonical payload is exactly 23 `.gs` files plus `appsscript.json`.
`CURRENT_CONTRACT.json`, release manifests, checksums, and verifiers preserve
the historical A20/B20 and Work 0036 A21/B21 evidence. The active successor
uses the canonical-main Work 0037 lineage and preserves the frozen 2.8.20 and
2.8.21 release bytes.

Current packages:

- `implementation/GoogleSpreadsheet/release/v2.8.23-prepilot/`:
  `TEST_MODE=true`, harness included, Automation OFF.
- `implementation/GoogleSpreadsheet/release/v2.8.23-prepilot-phase8c/`:
  the audited production-mode transform with the harness excluded, bounded
  provider-readiness flags enabled, automatic Inbox pilot admission, and
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
committed 82-suite regression manifest, deterministic 2.8.23 release packages,
canonical-main Work 0037 provenance, frozen 2.8.20/2.8.21 preservation,
current-main integration scope, and secret/local-state exclusions. It performs
no real Google, Gmail, Calendar, Apps Script function, or Gemini operation.

## Work 0037 personal shadow-pilot boundary

Code `2.8.23-prepilot` replaces the historical label-gated admission with an
automatic personal Inbox shadow pilot. Scheduled discovery admits ordinary
eligible personal Inbox messages, excludes `手動/除外` thread-wide, spam,
trash, non-Inbox, Promotions, Social, clear newsletters/list mail, and Google
Calendar notification mail. `手動/取込` is optional priority only and cannot
bypass a hard exclusion. The distinct pilot source mode is
`AUTOMATIC_INBOX_PILOT`, the run bound is one message per five-minute run, and
the manual worker fails closed while pilot Automation is active. A successful
explicit enable establishes a durable start boundary; older messages are
never admitted. Automation remains OFF in both packages.

The later user-controlled automatic Inbox pilot is not executed by Codex. Its bounded steps
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
