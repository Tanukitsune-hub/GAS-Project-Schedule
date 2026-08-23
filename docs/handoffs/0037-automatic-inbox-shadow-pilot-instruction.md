# Work 0037 Scope Revision — Automatic Personal Inbox Shadow Pilot

WORK_ID: `0037`

This instruction **supersedes the unexecuted label-gated user pilot** defined by `docs/handoffs/0037-instruction.md` and `docs/handoffs/0037-personal-shadow-pilot-runbook.md` for all future Work 0037 execution. Preserve those files as historical evidence; do not rewrite them.

## Route and model

Route: `C — Codex implement`

Recommended Codex model: **Sol High**.

Rationale: this revision intentionally broadens production-shaped Gmail admission from an explicit per-message label gate to automatic ordinary-Inbox admission. The implementation crosses Gmail candidate policy, production worker mode, readiness, manual/automatic ownership, privacy boundaries, Task/Review/Calendar side effects, version/release/lineage, and live-placement safety. The desired product behavior is settled below, but independent cross-file safety reasoning is material.

Before starting, Codex must read all applicable `AGENTS.md` files, identify the repository-specific subagent-use policy, and follow it. Codex must use subagents actively and proportionately under that policy, including independent admission-policy review, Task/Calendar/idempotency review, lineage/release review, and final privacy/fail-closed audit.

## Outcome

Produce a new reversible candidate, **Code `2.8.23-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`**, that supports a user-controlled **Automatic Personal Inbox Shadow Pilot** on the existing personal target.

The user must no longer need to apply `手動/取込` to each pilot message. When Automation is explicitly enabled, the scheduled worker may automatically admit ordinary eligible Inbox messages under the bounded policy below, classify them with the configured Gemini provider, and use the existing governed Task/Review/Gmail-label/dedicated-Calendar pipeline.

Automation remains OFF by default. Work 0037 remains personal-environment only. Company-environment rollout is a separate future Work after this pilot passes.

## Why a new code version

Code `2.8.22-prepilot` is already a reviewed, placed, label-gated rollback point. Do not mutate its release packages or reinterpret its contract.

Implement this revised behavior as `2.8.23-prepilot`, preserving all `2.8.20`, `2.8.21`, and `2.8.22` source/release/report evidence unchanged.

## Source of truth

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Branch: `codex/0037-personal-shadow-pilot`
- PR: `#52` (must remain Draft/Open/Unmerged)
- Scope-revision parent head before this instruction: `acf212811eeb48ddf61af12ff491094c98c99632`
- Canonical merged main baseline: `ca70607cba047b340b8009a03448b8d8128dc68e`
- Current authored source: `implementation/GoogleSpreadsheet/apps-script-v2/`
- Historical label-gated candidate: Code `2.8.22-prepilot`

The exact ref containing this instruction becomes authoritative after ChatGPT records it.

## Already-decided product design

### 1. Automatic admission

The production-shaped pilot no longer requires `手動/取込`.

Base automatic search scope must be equivalent to:

`in:inbox -in:spam -in:trash -label:手動/除外`

It may additionally exclude Promotions/Social in the Gmail query for efficiency, but **code-level policy checks remain authoritative** and must not rely only on Gmail query semantics.

A normal unlabeled Inbox message that passes all exclusion checks is eligible.

Use a new explicit pilot source mode, preferably `AUTOMATIC_INBOX_PILOT` (or an equally clear Work-0037-specific token), distinct from:

- `MANUAL`;
- `AUTOMATIC_QUALIFICATION`;
- the historical 2.8.22 `AUTOMATIC_PILOT` label-gated mode;
- any generic local-test-only automatic mode.

Historical 2.8.22 pilot records, if any, must not become automatic 2.8.23 backlog merely because the new candidate is deployed.

### 2. Hard exclusions

The following are never admitted by the automatic Inbox pilot:

- any Thread carrying `手動/除外` anywhere in the Thread;
- spam;
- trash;
- non-Inbox messages;
- Gmail Promotions category;
- Gmail Social category;
- clear newsletters/mailing-list messages when the existing bounded newsletter metadata rule identifies them (including `List-Unsubscribe`-based detection);
- Google Calendar invite/update/system-notification mail identified by the existing bounded Calendar-notification rule.

These exclusions must be enforced in code after metadata retrieval even if the Gmail search query also excludes some of them.

`手動/除外` remains the strongest human veto.

### 3. `手動/取込` becomes optional only

`手動/取込` is no longer required for the automatic pilot.

If retained as an optional signal, it may increase selection priority **only after all hard automatic exclusions above pass**. It must not bypass `手動/除外`, spam/trash/non-Inbox, Promotions/Social, newsletter, or Google Calendar notification exclusions.

Do not create a second parallel manual-import system.

### 4. Bounded execution

Preserve:

- one admitted message maximum per scheduled run;
- five-minute Automation interval;
- existing watermark/upper-bound/page-token scan model;
- exact Message-ID deduplication through Message State;
- worker lease / overlap protection;
- one-call/no-retry/no-fallback Gemini behavior;
- strict canonical AI Schema 2.0 validation;
- provider suppression/recovery behavior;
- existing Task authority and idempotency rules;
- existing dedicated secondary Calendar ownership boundary;
- fail-closed trigger lifecycle;
- Automation OFF by default.

### 5. Information-only and unclear mail

The existing canonical action types `INFORMATION_ONLY` and `UNCLEAR` remain authoritative.

Automatic Inbox operation must prove that an information-only classification reaches a governed terminal state **without creating a Task or Calendar side effect**. An `UNCLEAR` classification must follow the existing governed Review behavior rather than silently creating an authoritative Task.

Do not change the canonical validator merely to make automatic Inbox responses easier to accept.

### 6. Manual-worker ownership

While the automatic Inbox pilot Automation is active, the manual Gmail worker must continue to fail closed so a message cannot be raced by manual and scheduled processing.

Generalize any 2.8.22 guard that is hard-coded only to `LABEL_GATED_PERSONAL_SHADOW_PILOT` so it also correctly protects the 2.8.23 automatic pilot.

### 7. Readiness and preparation

Add/update safe user surfaces for the automatic pilot.

Preparation may align only non-secret version/scope metadata while Automation is OFF. It must not process Gmail, call Gemini, mutate Task/Review/Calendar, inspect credential values, or create a time trigger.

Readiness must fail closed unless all are true:

- Setup `S99_COMPLETE`;
- Code/Schema/Migration metadata aligned to 2.8.23/2.6/3;
- `TEST_MODE=false` in the production-shaped payload;
- automatic Inbox pilot scope/source/admission policy exactly matches this instruction;
- ordinary unlabeled Inbox admission is enabled;
- `手動/除外` veto active;
- spam/trash/non-Inbox exclusion active;
- Promotions/Social exclusion active;
- newsletter exclusion active;
- Google Calendar notification exclusion active;
- one message/run and five-minute interval exact;
- operator/data-policy/credential-storage approvals confirmed;
- Gemini adapter/credential reference ready without exposing values;
- OAuth ready;
- all formal Gmail labels ready;
- dedicated Calendar ready;
- Automation state is `CONSISTENT` OFF with zero owned clock triggers and no stored/canonical trigger residue;
- no external provider request was performed by readiness.

Use a distinct safe readiness status such as `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`.

### 8. Menu/UI wording

Production menu text must clearly say that the pilot scans eligible ordinary Inbox automatically and does **not** require `手動/取込`.

The enable confirmation must mention the exclusion boundaries and that admitted message content is sent to the configured Gemini provider under the already-confirmed personal data-policy approval.

Do not expose credentials, message bodies, senders, message IDs, private URLs, or raw provider output in status dialogs.

## Privacy and data boundary

This Work authorizes **repository implementation and local/executable validation only** until a separate placement addendum is committed.

The later live pilot, once separately authorized, is limited to the existing personal target/account. No company account, company PC, company Gmail, company Calendar, company Workspace, or company data is authorized in Work 0037.

Preserve existing privacy behavior:

- no raw provider response persistence;
- no credential value persistence or logging;
- no message-body persistence beyond existing governed state boundaries;
- no repository storage of private identifiers or live account information;
- safe bounded diagnostics only.

Automatic Inbox admission necessarily means eligible personal Inbox message content may be sent to the configured Gemini provider during the later user-controlled pilot. The implementation must not silently broaden beyond the documented personal-account boundary.

## Required implementation scope

1. Advance authored source and active docs/contracts to Code `2.8.23-prepilot`.
2. Implement a dedicated production-shaped automatic Inbox pilot admission policy with the hard exclusions above.
3. Use a new source mode that cannot accidentally consume historical 2.8.22 label-gated backlog.
4. Generalize pilot detection/worker ownership guards/readiness from label-gated-only to the automatic pilot safely.
5. Preserve existing Task/Review/Calendar/idempotency/privacy/provider contracts.
6. Regenerate Phase 8B and Phase 8C 2.8.23 release packages from authored source.
7. Update `CURRENT_CONTRACT.json`, active status/docs, visualizations only where materially required, and release/build/verification tooling.
8. Extend lineage so 2.8.23 is a clean successor of the current 2.8.22 candidate while preserving the exact Work 0036 squash proof and frozen 2.8.20/2.8.21/2.8.22 evidence.
9. Create/update a later user-controlled automatic-Inbox pilot runbook, but do not execute it.
10. Write `docs/handoffs/0037-report.md` as the authoritative latest completion report for this revised scope, clearly distinguishing the historical 2.8.22 report state from the final 2.8.23 state.

## Required negative/regression coverage

At minimum prove locally with deterministic fakes:

- ordinary unlabeled Inbox message is admitted;
- `手動/除外` veto wins Thread-wide;
- spam, trash and non-Inbox are rejected;
- Promotions and Social are rejected;
- clear newsletter metadata is rejected;
- Google Calendar notification metadata is rejected;
- optional `手動/取込` cannot bypass any hard exclusion;
- already-known Message ID is not rediscovered;
- at most one message is admitted per run;
- automatic 2.8.23 source mode is distinct from historical modes;
- historical 2.8.22 `AUTOMATIC_PILOT` backlog is not automatically consumed;
- information-only classification causes no Task or Calendar side effect;
- unclear classification follows governed Review behavior;
- manual worker fails closed while automatic pilot Automation is active;
- Automation enable remains fail closed on prerequisite mismatch;
- readiness cannot claim ready if any automatic-exclusion contract is missing;
- provider remains one-call/no-retry/no-fallback and strict-schema fail closed;
- frozen 2.8.20/2.8.21/2.8.22 releases and evidence remain byte-identical.

## Acceptance criteria

Before completion:

- all new focused tests PASS;
- full deterministic suite inventory PASS with missing 0 / extra 0;
- complete local verification gate PASS;
- Apps Script static validator PASS;
- Phase 8B/8C 2.8.23 release verifiers PASS;
- exact source/release lineage PASS;
- Work 0036 squash materialization proof still PASS;
- historical 2.8.20/2.8.21/2.8.22 preservation PASS;
- secret/local-state scan 0 hits;
- `git diff --check` PASS;
- exact-head GitHub CI PASS;
- PR remains Draft/Open/Unmerged;
- Automation not enabled by Codex;
- no user-controlled pilot executed by Codex.

## Live target placement — NOT YET AUTHORIZED

The user reported that Automation was stopped before requesting this scope revision, but ChatGPT has not yet recorded an exact post-stop status snapshot proving zero owned clock triggers and no stored/canonical trigger residue.

Therefore this instruction **does not authorize any Apps Script target update/push/pull**.

Codex must not:

- push 2.8.23 to the personal target;
- pull from the live target;
- run any Apps Script function;
- process Gmail;
- invoke Gemini;
- mutate Task/Review/Calendar;
- create/delete/enable/disable triggers;
- run Setup/readiness/diagnostics;
- inspect credential values;
- access any alternate target or any company environment.

A separate ChatGPT-authored addendum/ref may authorize one guarded Phase 8C target update and one isolated pull-back parity check only after exact Automation-OFF evidence is recorded.

## Non-goals

- no company deployment or company-environment qualification;
- no full-production ordinary Inbox rollout beyond the later bounded pilot;
- no email sending, replying, forwarding, deleting, archiving, or trashing;
- no attachment-body ingestion expansion;
- no new AI provider/fallback/retry path;
- no weakening of AI Schema 2.0;
- no primary-Calendar ownership change;
- no broad historical Dead Letter retry;
- no unrelated UI polish or feature expansion.

## Delivery

- Branch: `codex/0037-personal-shadow-pilot`
- PR: `#52`, Draft/Open/Unmerged
- Report: `docs/handoffs/0037-report.md`
- Commit and push all implementation/test/release/report changes.
- Link this superseding instruction and the final report in PR #52.

## Stop / escalation conditions

Stop and report `BLOCKER` if:

- safe automatic Inbox admission cannot be separated from historical source modes/backlog;
- a hard exclusion can be bypassed;
- information-only mail necessarily creates a business side effect;
- strict schema or privacy would need to be weakened;
- frozen release evidence would need mutation;
- live-target activity would be required before separate authorization;
- tests/CI expose a material unresolved safety or correctness failure.
