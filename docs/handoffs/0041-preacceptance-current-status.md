# Current Status

Last updated: 2026-09-05

Candidate version: Code `2.8.27-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Overall status: `NON_LIVE_CALENDAR_REMEDIATION_CANDIDATE`

Machine gate: `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`

ChatGPT review disposition: `WORK_0041_PENDING_REVIEW`

Company Work 0039/0040 installation: `ACCEPTED_USER_EVIDENCE`; Calendar E2E: `NOT_ACCEPTED`

Personal Gemini E2E: `PASS`

Automation candidate default: `OFF`; company runtime state: `NOT_ACCESSED_BY_CODEX`

Company Gemini target-email processing: `ACCEPTED_USER_EVIDENCE`; Codex live actions: `NOT_EXECUTED`

## Work 0041 active candidate

Dispatch `0041-CODEX-01` prepares the non-live `2.8.27-prepilot` Calendar
scheduled-drain successor. Normal five-minute Automation drains due standalone
Outbox work within the existing shared Calendar job bound. Review/authority,
lease/budget, claim/CAS, retry/DEAD and idempotency remain in force.

Accepted Work 0039 product/release and Work 0040 transport evidence is closed.
Company setup and target-email scheduled Gemini processing are user-observed
accepted evidence. Company Calendar E2E remains `NOT_ACCEPTED`; the no-new-mail
FAILED observation remains `NEED_USER_EVIDENCE` for safe error code/stage.
The candidate has not been deployed and all Codex live actions are
`NOT_EXECUTED`. Automation OFF describes the artifact default, not a fresh
observation of company Trigger state.

Active packages are `v2.8.27-prepilot`, `v2.8.27-prepilot-phase8c`, and
`work-0041-single-file-company-install`. Schema/AI Schema/Migration are unchanged.
See `docs/handoffs/0041-CODEX-01-calendar-runtime-remediation-report.md`.

## Frozen Work 0039 and earlier status at acceptance

The following sections are historical evidence; current Work 0041 status is above.

## Current contract

The canonical source is `implementation/GoogleSpreadsheet/apps-script-v2/`.
The payload is exactly 25 `.gs` files plus `appsscript.json`. Phase 8B keeps
`TEST_MODE=true` and the test harness. Phase 8C is the audited production-mode
transform with the harness excluded, legacy Gemini readiness flags enabled,
OpenAI readiness and data-governance flags still blocked, and Automation OFF.
`CURRENT_CONTRACT.json`, release manifests, checksums, and verifiers bind the
Work 0039 candidate while preserving historical A20/B20, A21/B21, A22/B22,
A23/B23, A24/B24, and Work 0038 release/bundle evidence.

The canonical Code `2.8.26-prepilot` release gate is
`READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`. The historical Work 0036 live
qualification remains evidence for the frozen 2.8.21 baseline and is not
reinterpreted as Work 0037 pilot execution or OpenAI qualification.

The source includes the Gemini Interactions provider, a parallel direct OpenAI
Responses provider, code-owned explicit provider selection, provider-facing
schema projections, strict AI Schema 2.0 post-response validation, exact
synthetic fixture guards, bounded provider diagnostics, durable Task/Review
handling, Calendar outbox controls, and an Automation lifecycle that remains
disabled by default and fail-closed. OpenAI uses `store=false`, no tools,
background, or stream, and its data-governance state is
`NOT_APPROVED_OR_UNKNOWN`; no live OpenAI request was made.

The Gemini credential is not stored in this repository. The user configured it
in the personal-synthetic Apps Script target and, on 2026-08-18, completed one
fresh approved synthetic-message E2E on Code `2.8.20-prepilot`. The reviewed
bounded result is recorded in `docs/handoffs/0033-live-e2e-review.md`.

Code `2.8.20-prepilot` remains the frozen manual-plus-Gemini recovery baseline.
Work 0036 remains the frozen 2.8.21 synthetic Automation recovery baseline.
Code `2.8.23-prepilot` remains frozen Work 0037 live-pilot evidence. The
current Work 0037 candidate is the 2.8.25 idle-log-finalization successor.
Work 0038 company-PC rollout is now active: the two-paste installation packaging
is accepted, while company-environment installation and runtime acceptance remain
`NOT EXECUTED`.

## Work 0038 company deployment status

- Dispatch `0038-CODEX-01` is accepted with `BLOCKER: NONE`.
- Canonical development remains modular under
  `implementation/GoogleSpreadsheet/apps-script-v2/`; no source consolidation
  or refactor was performed.
- The preferred company manual-install path is exactly two pastes from
  `delivery/0038-company-live-bundle`: `QUICK_INSTALL/Code.gs`, then
  `QUICK_INSTALL/appsscript.json`.
- The original modular delivery payload remains present for provenance and
  optional engineering use; the bundle is a deterministic derived distribution
  artifact only.
- Validated implementation head before acceptance sync:
  `0178eade638c2d2ef4e6e14b29749facf85b30e6`.
- Delivery head: `fd5bc3e61363dbae1ff98eda8ebbd12cdb371c76`.
- Final implementation CI `#541` / run `33319331072`: SUCCESS; 11/11 checks,
  87 suites, missing 0, extra 0, release/lineage PASS, secret scan 0 hits.
- Company Google Workspace paste, Setup/readiness, OAuth, Gmail, Calendar,
  trigger, Gemini/provider request, credential handling, and live runtime are
  `NOT EXECUTED` and remain user-controlled Work 0038 actions.
- Current ball: `USER`; current dispatch ledger:
  `docs/handoffs/0038-dispatches.md`.

## Work 0039 OpenAI provider-selection status

- Dispatch `0039-CODEX-03` remediates the CODEX-02 review blockers as a local,
  synthetic-only candidate on `codex/0039-openai-provider-selection`. The
  product/release publication head `9d287b411ae70fdcaa667fbde9618e1c205e8173`
  passed both GitHub push and pull-request CI; Draft PR #55 remains unmerged.
- The authoritative active provider property is
  `WORK_OS_V2_ACTIVE_AI_PROVIDER`; absent values remain backward-compatible
  with Gemini, and allowed values are exactly `GEMINI` and `OPENAI`.
- Provider switches require consistent Automation-OFF state, zero owned clock
  triggers, no active worker lease, and a Script-Lock-held read of the bound
  Spreadsheet Message State with no `CLAIMED`, `PREPROCESSED`, or `RETRY`
  record. Unavailable or corrupt persisted state fails closed. The switch
  itself performs no external request and rolls back on a dependent-update
  failure.
- OpenAI model metadata is code-owned as `gpt-5.6-luna` with prompt
  `openai-responses-v1-work-os-v2` and endpoint
  `https://api.openai.com/v1/responses`. A missing or unsupported model is a
  bounded failure; there is no cross-provider fallback.
- The documented Responses envelope accepts one completed assistant
  `output_text` message, tolerates non-consumed reasoning items, and rejects
  refusals, executable/tool items, multiple messages, and malformed output.
- OpenAI company data governance, credentials, provider requests, company
  Workspace installation, deployment, OAuth, triggers, and Automation remain
  `NOT EXECUTED`; company runtime acceptance is blocked until a separately
  authorized qualification records an approved governance state.
- New release paths are
  `implementation/GoogleSpreadsheet/release/v2.8.26-prepilot/`,
  `implementation/GoogleSpreadsheet/release/v2.8.26-prepilot-phase8c/`, and
  `implementation/GoogleSpreadsheet/release/work-0039-single-file-company-install/`.

## Work 0037 implementation status

- Canonical baseline: merged `main` Work 0036 completion `ca70607...`; the
  repaired gate proves exact squash materialization and historical A21/B21
  ancestry without weakening lineage checks.
- Pilot admission: ordinary eligible personal Inbox mail is admitted;
  `手動/除外` wins thread-wide; spam, trash, non-Inbox, Promotions, Social,
  clear newsletters/list mail, and Google Calendar notifications are hard
  exclusions. `手動/取込` is optional priority only.
- Scheduled source mode: `AUTOMATIC_INBOX_PILOT`; maximum one candidate per
  five-minute run; manual processing fails closed while pilot Automation is
  active. A successful explicit enable establishes the durable pilot-start
  boundary, and older messages are rejected.
- Automation: `OFF` by default and throughout Codex work. No new user-controlled
  24-hour pilot, Gmail processing, Gemini calls, Task/Review/Calendar mutation,
  trigger changes, or runtime functions are executed in CODEX-04; the prior
  personal pilot remains accepted historical evidence and was stopped by the user.
- Code `2.8.25-prepilot` Phase 8B/8C packages, the 86-suite deterministic local
  inventory, pre-scan AUTO_PILOT idle suppression, truthful detail status, and
  90-day detailed-history retention are regenerated/validated by the Work 0037
  delivery gate. The exact pre-placement head passed CI; one guarded OFF-state
  Phase 8C correction push and one isolated pull-back proved exact 23-file
  parity. Code `2.8.24-prepilot` remains frozen placement evidence.

## Work 0036 implementation evidence

- PR `#51` contains the Code `2.8.21-prepilot` qualification successor.
- Runtime-preparation-fix source repair commit: `0f0b7eab0ed27b883ae25fb15af4371b42157662`.
- Runtime-preparation-fix release commit: `3a4c053ba9775659d5bb902ff0f7cd0bcffba531`.
- Runtime-preparation-fix pre-placement head: `dab94362c34e837bb236186ace7c0cf9c0f63e40`.
- Runtime-preparation-fix pre-placement push/PR CI: `#32268303659` / `#32268311064`, both PASS.
- Complete non-Google gate: 11/11 PASS.
- Deterministic regression inventory: 78 suites, missing 0, extra 0.
- Phase 8B/8C release verification and A21/B21 lineage: PASS.
- Historical 2.8.20 release preservation: PASS.
- Secret/local-state scan: 0 hits.
- Existing personal-synthetic target review-fix replacement: one guarded Phase
  8C update and one independent pull-back, exact parity PASS.
- Review-fix final CI `#400`: PASS.
- ChatGPT docs-only clarification CI `#402`: PASS.
- Production preparation caller regression: production no-argument status path
  and Test-mode dependency injection are both covered; the production guard
  remains fail-closed.
- Runtime-preparation-fix replacement lane: one guarded Phase 8C update and
  one independent pull-back, exact parity PASS.

## Work 0036 preparation/readiness/enable live checkpoints

The repaired preparation path passed live on the existing personal-synthetic
target. The candidate version metadata aligned to Code `2.8.21-prepilot` while
Automation remained OFF and no external request was performed.

The authoritative readiness check returned
`READY_FOR_CONTROLLED_QUALIFICATION` with Setup/version, production-shaped exact
synthetic scope, approvals, Gemini credential/adapter, OAuth, all seven formal
Gmail labels, dedicated Calendar, and zero-trigger Automation-OFF state ready.

The user explicitly enabled Automation. The immediate live status was
`CONSISTENT` with enabled/desired enabled `true`, exactly one canonical
5-minute clock trigger, zero duplicates, and prerequisites ready.

## Historical live failure: scheduled Automation AI-schema validation

On 2026-08-23 the first normal scheduled trigger discovered exactly one fresh
exact Work 0036 synthetic candidate. The run reached the real Gemini
classification boundary, then failed before Task/Review/Calendar output.

Bounded evidence:

- trigger: `TIME_DRIVEN`
- mode: `AUTO_PHASE6`
- candidate count: `1`
- processed count: `0`
- created/updated/review counts: `0`
- error count: `1`
- run status: `FAILED`
- run note: `MESSAGE_FAILED`
- error stage: `AI_RESPONSE`
- error code: `E_AI_SCHEMA`
- error category: `INVALID_RESPONSE`
- message state: `AUTOMATIC_QUALIFICATION -> CLASSIFY -> DEAD`
- retry count: `0`

The provider response and email content were not persisted. Source review showed
that the provider-facing structured-output schema cannot express all of the
stricter action-type-dependent semantic rules enforced by canonical AI Schema
2.0 validation. The historical run therefore could not identify the exact
violating field without weakening the privacy boundary.

The historical failed candidate and Dead Letter remain un-retried.

## Historical disable rollback after failure

After that failed scheduled run, the user explicitly disabled Automation and
verified the real trigger state:

- status: `CONSISTENT`
- enabled: `false`
- desired enabled: `false`
- trigger count: `0`
- clock trigger count: `0`
- invalid event trigger count: `0`
- stored trigger ID present: `false`
- canonical trigger present: `false`
- duplicate trigger count: `0`
- watermark present: `true`
- last run present: `true`

The watermark and last-run markers are expected historical run evidence and are
not trigger residue.

## Work 0036 live AI-schema repair evidence

The repair is recorded in:

- `docs/handoffs/0036-live-ai-schema-failure-fix-instruction.md`
- `docs/handoffs/0036-live-ai-schema-failure-fix-addendum.md`
- `docs/handoffs/0036-live-ai-schema-failure-fix-report.md`

Observed completion evidence:

- Source repair commit: `25e32a0a4a2c51a7d347534659299d5523b3477f`.
- Release regeneration commit: `bda4df2ec8a21b5e4ece64609e2e50b7be12dcb5`.
- Pre-placement tooling/test head: `78a27bc2cddd42eb7af826d42443006cab332c1c`.
- Product/report head: `ecce57b39b7543ab37ee8b2a3f6201c298f59ddc`.
- Prompt contract advanced to `gemini-interactions-v1-work-os-v2` while Code,
  Schema, AI Schema, and Migration versions remain unchanged.
- Strict canonical `validateOutput()` remains authoritative; unknown fields,
  invalid types/enums/dates, conflicting semantics, and invalid `changes`
  remain fail-closed.
- Gemini receives explicit canonical action semantics plus an exact-fixture-only
  qualification instruction for one internal NEW_TASK with a relative seven-day
  deadline, `changes:{}`, no invented ID, and no high-impact Calendar category.
- Future `E_AI_SCHEMA` failures can retain only an allowlisted bounded
  `canonical_schema_rule` class; provider output and email content remain
  unpersisted.
- One-call/no-retry/no-fallback behavior is preserved.
- Complete local gate: 11/11 PASS; deterministic inventory 78 suites, missing
  0, extra 0.
- Final product/report CI `#450`: SUCCESS.
- Phase 8B/8C release verification, A21/B21 lineage, secret scan, and historical
  2.8.20 preservation: PASS.
- Fresh existing-target replacement: one guarded Phase 8C update and one
  independent pull-back; exact 23-file parity PASS.
- Automation remained OFF throughout Codex repair/placement work.
- Independent Codex audits reported no BLOCKER.

ChatGPT independently reviewed the final source, repair diff, report, tests,
final CI, release/lineage evidence, and placement result. No BLOCKER was found.
The user E2E runbook was updated at docs-only head
`260a52ea2eae3ea4240aab7f70e402494a738db6` and CI `#452` passed. The active
status review was synchronized at docs-only head
`7ed37fa1314849bbfe5dbdde9e53ff8485d78d88` and CI `#454` passed. Subsequent
docs-only status wording heads also passed CI through `#458`. Product/release
payload was unchanged by those documentation updates.

## Final live user evidence: successful controlled Automation E2E

After the AI-schema repair was placed and independently reviewed, the user ran
one fresh controlled synthetic qualification under the updated runbook.

Bounded evidence from the successful scheduled run:

- trigger: `TIME_DRIVEN`
- mode: `AUTO_PHASE6`
- candidate count: `1`
- processed count: `1`
- created Task count: `1`
- updated Task count: `0`
- review count: `1`
- skipped count: `0`
- error count: `0`
- run status: `COMPLETE`
- Message State: `AUTOMATIC_QUALIFICATION -> DONE / DONE`
- action count: `1`
- retry count: `0`
- last error: none
- provider: `GEMINI`
- model: `gemini-3.6-flash`
- prompt version: `gemini-interactions-v1-work-os-v2`

The governed synthetic Task used one `NEW_TASK` action with the expected
relative seven-day deadline semantics, medium priority, no waiting flag,
`calendar_category=NONE`, `calendar_importance=LOW`, and Calendar sync
`NOT_REQUIRED`. The user observed expected Gmail label application. The prior
failed candidate was not retried.

The final bounded review is recorded in
`docs/handoffs/0036-user-automation-e2e-review.md`.

## Final disable / zero-trigger rollback

Immediately after the successful run, the user explicitly disabled Automation
and verified:

- status: `CONSISTENT`
- enabled: `false`
- desired enabled: `false`
- trigger count: `0`
- clock trigger count: `0`
- invalid event trigger count: `0`
- stored trigger ID present: `false`
- canonical trigger present: `false`
- duplicate trigger count: `0`
- watermark present: `true`
- last run present: `true`

No owned clock-trigger residue remains. The watermark and last-run markers are
expected historical evidence of successful scheduled execution.

## Historical preparation defect and repair

Earlier in Work 0036, the first live `個人用合成Automationを準備` action stopped
fail-closed with `WorkOsAppError: Automation依存注入はTest modeだけで利用できます。`
The root cause was a production caller passing an injected options object into
the Automation status boundary. The runtime-preparation repair changed the
production caller to the real no-argument status path while preserving Test-mode
injection and the production guard. That repair was regenerated, placed on the
same target, and independently pulled back with exact parity before the later
live checkpoints above.

Historical handoffs and reports remain immutable evidence.

## Historical lineage

- Work 0018: Code `2.8.14-prepilot`, source A14 and release B14.
- Work 0028: Code `2.8.15-prepilot`, source A15 and release B15.
- Work 0029: Code `2.8.16-prepilot`, source A16 and release B16.
- Work 0030: Code `2.8.17-prepilot`, source A17 and release B17.
- Work 0031: Code `2.8.18-prepilot`, source A18 and release B18.
- Work 0032: Code `2.8.19-prepilot`, source A19 and release B19.
- Work 0033: Code `2.8.20-prepilot`, source A20 and release B20; the subsequent
  user-controlled personal Gemini E2E passed.
- Work 0036: Code `2.8.21-prepilot`, source A21 and release B21; automatic
  discovery, readiness, preparation, real Gemini classification, strict AI
  Schema 2.0 acceptance, governed Task creation, expected Gmail labeling, and
  explicit disable/zero-trigger rollback have now passed in the controlled
  personal-synthetic Automation E2E.

## Completion / next boundary

Work 0036 is complete with `BLOCKER: NONE`.

PR `#51` may be integrated after this final documentation head passes CI. The
controlled synthetic Automation path is qualified, but Automation remains OFF
by default and in the live target after qualification.

Ordinary personal Inbox admission, broader automatic-mail policy, additional
Calendar behavior beyond the proven `NOT_REQUIRED` synthetic case remain
separate future Work boundaries. Company-environment rollout is now Work 0038
and is governed by its current handoff and dispatch ledger rather than by this
historical Work 0036 completion boundary.
