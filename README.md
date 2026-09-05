# GAS Project Schedule

Google Apps Script source and non-Google validation tooling for the Google
Workspace Personal Work OS.

## Current contract

| Field | Value |
|---|---|
| Code | `2.8.27-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Candidate machine gate | `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT` |
| ChatGPT review disposition | `WORK_0041_PENDING_REVIEW` |
| Personal Gemini E2E | `PASS` |
| Product-code state | Work 0041 bounded scheduled Calendar drain candidate |
| Automation | Candidate default `OFF`; company state not accessed by Codex |
| Runtime evidence | Company Gemini target-email processing accepted; Calendar E2E open |

The canonical payload is exactly 25 `.gs` files plus `appsscript.json`.
`CURRENT_CONTRACT.json`, release manifests, checksums, and verifiers preserve
the historical A20/B20, A21/B21, A22/B22, A23/B23, and A24/B24 evidence. The active
successor starts from the published Work 0041 main baseline and preserves all
historical release/delivery bytes, including Work 0038, Work 0039 and Work 0040.

Current packages: `v2.8.27-prepilot`, `v2.8.27-prepilot-phase8c`, and
`work-0041-single-file-company-install` under `implementation/GoogleSpreadsheet/release/`.
The company candidate remains exactly two pastes (`Code.gs`, then
`appsscript.json`) with byte-identical `.txt` transport copies. The ordinary
five-minute worker drains standalone Calendar Outbox work after Review/Task
edits; manual one-job Calendar sync remains an explicit fallback.

Frozen historical packages:

- `implementation/GoogleSpreadsheet/release/v2.8.25-prepilot/`:
  `TEST_MODE=true`, harness included, Automation OFF.
- `implementation/GoogleSpreadsheet/release/v2.8.25-prepilot-phase8c/`:
  the audited production-mode transform with the harness excluded, bounded
  provider-readiness flags enabled, automatic Inbox pilot admission, and
  Automation still OFF.
- `implementation/GoogleSpreadsheet/release/v2.8.26-prepilot/` and
  `implementation/GoogleSpreadsheet/release/v2.8.26-prepilot-phase8c/`:
  Work 0039 versioned candidates with the OpenAI selection module; OpenAI
  governance and live readiness remain blocked.
- `implementation/GoogleSpreadsheet/release/work-0039-single-file-company-install/`:
  `Code.gs` plus `appsscript.json` in the exact two-paste order, with
  byte-identical `.txt` transport copies.

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
committed regression manifest, deterministic 2.8.27 release packages and
Work 0041 bundle,
canonical-main Work 0037 provenance, frozen 2.8.20/2.8.21 preservation,
current-main integration scope, and secret/local-state exclusions. It performs
no real Google, Gmail, Calendar, Apps Script function, Gemini, or OpenAI
operation.

## Work 0039 provider-selection boundary

Work 0039 registers direct OpenAI Responses in parallel with Gemini and makes
`WORK_OS_V2_ACTIVE_AI_PROVIDER` the only authoritative selection. The allowed
values are exactly `GEMINI` and `OPENAI`; absent selection remains Gemini.
Switching is guarded by consistent Automation-OFF state, zero owned clock
triggers, no worker lease, and no in-flight or retry-pending state. There is no
automatic provider fallback or dual-send.

OpenAI uses code-owned `gpt-5.6-luna`, prompt
`openai-responses-v1-work-os-v2`, direct `/v1/responses`, structured output,
`store=false`, and no tools/background/stream. `NOT_APPROVED_OR_UNKNOWN` is the
current data-governance state. Work 0039 uses only synthetic local fixtures;
credentials, company data, live requests, deployment, and Automation remain
unexecuted.

## Work 0037 personal shadow-pilot boundary

Code `2.8.25-prepilot` replaces the historical label-gated admission with an
automatic personal Inbox shadow pilot. Scheduled discovery admits ordinary
eligible personal Inbox messages, excludes `手動/除外` thread-wide, spam,
trash, non-Inbox, Promotions, Social, clear newsletters/list mail, and Google
Calendar notification mail. `手動/取込` is optional priority only and cannot
bypass a hard exclusion. The distinct pilot source mode is
`AUTOMATIC_INBOX_PILOT`, the run bound is one message per five-minute run, and
the manual worker fails closed while pilot Automation is active. A successful
explicit enable establishes a durable start boundary; older messages are
never admitted. Automation remains OFF in both packages.

Healthy scheduled `AUTO_PILOT` runs use the existing
`AUTOMATION_LAST_RUN_AT` property as their heartbeat and do not create a
detailed `処理履歴` row when they are a fully healthy no-op. Meaningful runs
remain detailed, and only valid detailed Run History rows older than 90 days
are compacted; Errors, Message State, Task/Review, Calendar, and Task Authority
Ledger evidence are outside this retention boundary.

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
