# Work 0037 — Personal Shadow Pilot

WORK_ID: `0037`

## Outcome

Create Code `2.8.22-prepilot` as the smallest safe production-shaped **personal shadow pilot** successor to Work 0036.

The pilot must process only explicitly selected Inbox messages through the real scheduled Automation path while remaining materially closer to normal production behavior than the exact-subject synthetic qualification. It must preserve fail-closed safety, one-message-per-run bounded execution, real Gemini classification, governed Task/Review handling, Gmail label behavior, and the existing dedicated Calendar boundary.

This Work prepares the software and controlled placement only. The user-controlled 24-hour shadow pilot itself is a separate explicit runtime step after ChatGPT review.

## Already-Decided Design Choices

- Baseline is merged `main` at Work 0036 completion commit `ca70607cba047b340b8009a03448b8d8128dc68e`.
- Code advances to `2.8.22-prepilot`; Schema remains `2.6`, AI Schema remains `2.0`, Migration remains `3` unless implementation proves a migration is genuinely required. Escalate before changing Schema/AI Schema/Migration.
- Code `2.8.21-prepilot` becomes the frozen personal synthetic Automation recovery baseline and must remain unchanged.
- Automation remains disabled by default.
- Production pilot admission is **label-gated**, not broad Inbox admission.
- Reuse the existing human-owned Gmail label `手動/取込` as the explicit pilot admission gate. Do not add a new Gmail label unless technically necessary and approved by ChatGPT.
- Pilot automatic query must be bounded to Inbox messages explicitly carrying `手動/取込`, while still excluding spam, trash, and `手動/除外`.
- `手動/除外` always wins over `手動/取込`.
- Pilot scheduled processing must assign a distinct source mode such as `AUTOMATIC_PILOT` so pilot evidence is distinguishable from manual import and historical `AUTOMATIC_QUALIFICATION`.
- The exact Work 0036 synthetic-only path remains historical; 2.8.22 intentionally replaces the production admission boundary with this label-gated pilot boundary.
- Existing Gmail/body/context limits, idempotency, Message State, Task authority, locks/leases, retry/dead-letter behavior, Gemini one-call/no-retry/no-fallback policy, strict AI Schema 2.0 validation, privacy-safe diagnostics, and Calendar ownership rules must not be weakened.
- Scheduled pilot capacity remains one processed message per run and the existing 5-minute interval.
- Human-owned `手動/*` labels must never be automatically removed or rewritten.
- While label-gated Automation is enabled, the manual import worker must not race the same candidate pool. Prefer an explicit fail-closed manual-worker guard during active pilot Automation if the current idempotency boundary alone does not make concurrent execution unambiguously safe.
- Ordinary unlabeled Inbox mail must never be processed in Work 0037.
- Company-environment deployment is not part of Work 0037.

## Source of Truth

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Base: merged `main` Work 0036 completion
- Current authored source: `implementation/GoogleSpreadsheet/apps-script-v2/`
- Current status: `CURRENT_STATUS.md`
- Repository rules: all applicable `AGENTS.md`
- Work 0036 final live evidence: `docs/handoffs/0036-user-automation-e2e-review.md`
- Work 0037 instruction: this file

## Required Scope

1. Implement the label-gated personal shadow-pilot production admission boundary.
2. Add/adjust bounded user-facing preparation/readiness surfaces so the user can confirm the 2.8.22 pilot is correctly configured while Automation is OFF before enabling it.
3. Preserve the existing explicit enable/disable lifecycle and zero-trigger rollback semantics.
4. Ensure pilot readiness proves at minimum:
   - Code/Schema/AI-Schema/Migration alignment;
   - Setup complete;
   - TEST_MODE false / production-shaped target;
   - real Gemini provider and credential readiness without exposing the credential;
   - OAuth ready;
   - all formal Gmail labels ready;
   - dedicated Calendar ready;
   - pilot admission mode exactly label-gated;
   - pilot Gmail query exactly constrained to `手動/取込` and exclusion boundaries;
   - Automation disabled with zero trigger residue before user start.
5. Ensure scheduled candidate discovery cannot admit ordinary unlabeled Inbox messages.
6. Preserve explicit `手動/除外` opt-out and spam/trash exclusion.
7. Preserve current automatic candidate safety filters where applicable, without making explicit `手動/取込` selection ambiguous.
8. Keep one-message-per-run bounded behavior and deterministic watermark/idempotency behavior.
9. Add regression coverage for:
   - labeled eligible message admitted;
   - unlabeled Inbox message rejected;
   - both `手動/取込` and `手動/除外` rejected;
   - spam/trash rejected;
   - already-known Message ID not rediscovered;
   - pilot source mode distinct from MANUAL and AUTOMATIC_QUALIFICATION;
   - manual-worker concurrency/race boundary while pilot Automation is active;
   - one-call/no-retry/no-fallback Gemini behavior;
   - no duplicate Task/Review/Calendar side effects;
   - disable cleanup leaves zero owned clock triggers.
10. Create a bounded user-controlled pilot runbook for the later live step.
11. Regenerate deterministic 2.8.22 Phase 8B/8C release packages and update current contract/status/version documentation consistently.
12. Preserve all frozen 2.8.20 and 2.8.21 release/evidence bytes.

## User-Controlled Shadow Pilot Runbook Requirements

The runbook must define a realistic but bounded pseudo-production qualification after ChatGPT approval:

- duration: at least 24 hours;
- at least 12 explicitly selected work-like test messages total;
- messages are admitted only by applying `手動/取込`;
- no ordinary unlabeled Inbox processing;
- one message per scheduled run;
- include a representative mix such as new task, explicit deadline, relative deadline, ambiguous/review, information-only, waiting/reply-state behavior, thread/task update behavior, and at least one safe dedicated-Calendar-relevant synthetic case if the existing policy naturally produces one;
- include at least one `手動/除外` conflict case that must not process;
- historical Work 0036 failed candidate/Dead Letter must not be retried;
- manual worker must not be invoked while pilot Automation is enabled;
- stop immediately on any unlabeled message processing, duplicate Task/Review/Calendar side effect, privacy leak, unexpected external Calendar target, trigger duplication, or non-recoverable runtime failure;
- after the pilot, explicitly disable Automation and verify zero owned clock triggers / no stored or canonical trigger residue.

Success must require, at minimum:

- zero ordinary unlabeled Inbox messages processed;
- zero duplicate business side effects;
- zero unexpected Calendar writes;
- zero unresolved runtime errors/Dead Letters caused by the pilot cohort;
- all expected selected messages reach a governed terminal state or an intentionally reviewable state;
- Gemini provider/provenance is the configured production provider;
- Automation rollback is clean;
- any low-impact classification/title differences are manually reviewed and recorded, while any materially wrong task, deadline, action type, or Calendar classification is a pilot failure.

## Non-Goals

- Broad automatic processing of all personal Inbox mail.
- Company-PC/company-account deployment or use of company data.
- New AI providers/models, retries, fallback models, or correction calls.
- Attachment analysis, outbound email sending, browsing, or tool use by Gemini.
- New Calendar ownership model or a second Calendar system.
- Rewriting historical Work 0036 reports/evidence.
- UI polish unrelated to the pilot outcome.

## Acceptance Criteria

- Code `2.8.22-prepilot` implements an explicit production-shaped label-gated pilot mode with Automation OFF by default.
- Production candidate discovery can process an eligible `手動/取込` Inbox message but cannot process an otherwise identical unlabeled Inbox message.
- `手動/除外` wins and spam/trash remain excluded.
- Source mode and operational evidence clearly identify pilot processing.
- Strict AI Schema 2.0 and Work 0036 privacy/fail-closed protections remain intact.
- Manual and automatic processing cannot ambiguously race the same pilot candidate pool.
- Focused pilot tests and all affected regression suites pass.
- Full deterministic suite inventory has missing 0 / extra 0.
- Apps Script static validator, release verifiers, lineage checks, frozen 2.8.20/2.8.21 preservation, secret/local-state scan, and `git diff --check` pass.
- Exact-head pre-placement CI succeeds.
- One controlled Phase 8C source update to the same existing personal-synthetic/pilot Apps Script target and one independent pull-back parity check succeed, with Automation remaining OFF throughout Codex work.
- Final report-head CI succeeds.
- No BLOCKER remains before ChatGPT authorizes the user-controlled 24-hour shadow pilot.

## Required Validation Evidence

Record exact PASS/FAIL evidence for focused pilot admission tests, manual/automatic race protection, Message State/idempotency, strict AI/provider boundaries, release verification, historical preservation, secret scan, and complete CI.

Do not include raw email bodies, subjects from real mail, sender addresses, Gmail/Calendar IDs, account identifiers, credential values, private URLs, or raw provider responses in GitHub evidence.

## Write Boundaries

Allowed: current Apps Script source, affected tests/tooling, 2.8.22 release packages/metadata, current status/contract/docs, and Work 0037 handoff/report/runbook.

Restricted: frozen 2.8.20 and 2.8.21 release/evidence, credentials, `.clasp.json`, real IDs, historical Work 0036 reports.

## External-Action Authorization

Codex is authorized, only after all local gates and exact-head pre-placement CI pass, to perform **one** guarded Phase 8C source update to the same existing personal target used for Work 0036 and **one** independent isolated pull-back parity check.

Before that source update, Codex must prove from existing bounded target-state evidence or a non-mutating eligible check that Automation is OFF and no owned clock-trigger residue is present. If it cannot prove this without executing an Apps Script runtime function, stop and report `BLOCKER: AUTOMATION_OFF_CONFIRMATION_REQUIRED`.

Codex is **not** authorized to enable/disable Automation, create/delete triggers, process Gmail, invoke Gemini, mutate Task/Review/Calendar data, run Setup/readiness/diagnostic/runtime Apps Script functions, retry Dead Letters, inspect credential values, create a new target, switch accounts, or perform the user-controlled shadow pilot.

No company environment action is authorized in Work 0037.

## Delivery

- Branch: `codex/0037-personal-shadow-pilot`
- Create/maintain a Draft PR to `main`.
- Write completion report: `docs/handoffs/0037-report.md`.
- Keep PR Draft/Open/Unmerged until ChatGPT review and the later user-controlled shadow pilot are complete.
- Do not merge to `main` during Codex implementation.

## Model and Delegation

Route: `C`.

Recommended Codex model: **Luna Max**.

Rationale: ChatGPT has fixed the outcome, admission policy, safety boundaries, version target, acceptance criteria, and external-action limits. The residual work is primarily bounded implementation, regression coverage, deterministic release regeneration, placement verification, and reporting rather than unresolved architecture.

Before starting, Codex must read all applicable `AGENTS.md` files, identify the repository-specific subagent-use policy, and follow it. Use subagents actively and proportionately under that policy. At minimum use independent perspectives for candidate/admission safety, Task/Calendar/idempotency regression review, and final source/release/placement audit.

## Escalation Conditions

Stop and report a BLOCKER rather than guessing if:

- safe pilot admission cannot be implemented without broad unlabeled Inbox access;
- strict Work 0036 fail-closed/privacy/idempotency boundaries would need weakening;
- a Schema/AI-Schema/Migration change appears materially necessary;
- manual/automatic candidate ownership cannot be made unambiguous;
- a broader Calendar permission/ownership model is required;
- target binding or Automation-OFF state cannot be proven safely;
- any frozen 2.8.20/2.8.21 artifact changes;
- pre-placement or final CI fails because of the implementation;
- the one-use target placement or pull-back tranche fails or is consumed unexpectedly.

## Completion Report

Return only:

- Work ID;
- report path;
- final commit;
- branch;
- PR;
- BLOCKER status.
