# Work 0041 — Calendar Runtime Remediation Instruction

WORK_ID: `0041`

Dispatch ID: `0041-CODEX-01`

BALL: `CODEX`

STATUS: `READY`

MODE: `BUILD`

## Primary Outcome

Make the accepted company-install candidate's normal five-minute scheduled path complete the governed Task/Review -> Calendar Outbox -> dedicated `自動期日管理` Calendar projection without routine manual `Calendar同期を1件処理` intervention, while preserving truthful scheduled-run semantics and every existing fail-closed authority/retry/idempotency boundary.

This dispatch also investigates the observed company scheduled `FAILED` run with no new eligible Gmail candidate. Fix that behavior only if it is locally reproducible or its root cause is established from repository evidence. Do not guess or convert genuine Calendar/backlog/system failures into healthy idle.

## Strategy Reset

Work 0041 is reset from `QUALIFICATION` to `BUILD` for this dispatch because source review established a concrete cross-subsystem gap that can materially prevent the intended end-to-end company outcome:

- Review/Task edits can create durable Calendar intent and Outbox work after the originating Message is already `DONE`;
- the canonical five-minute Trigger calls `WorkOsWorker.processAutomaticBatch()`;
- the standalone Calendar Outbox drain exists separately as `syncPendingCalendarJobs()` / menu `Calendar同期を1件処理`;
- current source does not establish that a standalone due Calendar Outbox job is drained automatically when there is no corresponding Message-State backlog.

The observed company `candidate_count=0` / `FAILED` run remains an unresolved runtime fact, not a proven idle-logging bug. Preserve that distinction.

## Accepted Evidence / Closed Conclusions

Do not reopen these without material contrary evidence:

1. Work 0039 product/release/bundle Acceptance remains closed.
2. Work 0040 transport Acceptance remains closed.
3. The accepted Work 0039 company bundle was installed and initial company setup completed.
4. Gemini is the current company primary provider path and an eligible target email has completed scheduled Gmail/Gemini processing in the real company environment.
5. Calendar event end-to-end behavior is not accepted: the expected Calendar projection was not correctly observed.
6. Calendar configuration/readiness is not equivalent to Calendar event E2E.
7. High-impact/important new Task actions intentionally enter Review before becoming Calendar-eligible. Do not weaken this Review policy merely to make Calendar tests pass.
8. `candidate_count=0` is not sufficient evidence of a healthy idle run when due Calendar/backlog/system work exists.
9. Direct OpenAI is not the intended company provider. Company OpenAI means Azure OpenAI.
10. Azure OpenAI is a separate provider/infrastructure path with bounded GAS smoke evidence `HTTP 403 / PERMISSION_OR_NETWORK_DENIED`; it is outside this dispatch.
11. Company credentials, message/business content, identifiers, private URLs, raw provider payloads/errors, and Calendar content must not enter GitHub, tests, reports, or chat.
12. No live company Workspace action is authorized by this Codex dispatch.

## Source of Truth

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Dispatch branch: `codex/0041-calendar-runtime-remediation`
- Work instruction: `docs/handoffs/0041-instruction.md`
- Dispatch ledger: `docs/handoffs/0041-dispatches.md`
- Live evidence status: `docs/handoffs/0041-user-automation-live-status.md`
- Current authored source: `implementation/GoogleSpreadsheet/apps-script-v2/`
- Relevant boundaries: `09_TaskReviewPolicy.gs`, `10_CalendarSync.gs`, `11_EditHandler.gs`, `12_Triggers.gs`, `13_LogAndDeadLetter.gs`, `18_Worker.gs`
- Tests: `implementation/GoogleSpreadsheet/tests/`
- Applicable instructions: repository root `AGENTS.md`, `implementation/GoogleSpreadsheet/AGENTS.md`, and `docs/handoffs/AGENTS.md`

Before changing code, verify the local repository/branch/HEAD against the GitHub main that contains this instruction. Preserve unrelated work and do not rewrite shared history.

## Required Scope

### A. Prove the automatic Calendar Outbox boundary locally

Use deterministic/local fakes to reproduce the post-Review/post-edit scenario that matters:

- a governed Task is or becomes Calendar-eligible;
- a durable Calendar Outbox job exists independently of new Gmail discovery and without requiring a Message-State `CALENDAR_PENDING` backlog item;
- the canonical scheduled operation should process that due job within the configured Calendar job bound.

If repository behavior disproves the static concern, do not force the proposed fix. Record the actual deterministic path and return the evidence.

### B. Implement the smallest coherent fix if the gap is confirmed

The normal five-minute scheduled operation must be able to process bounded due standalone Calendar Outbox work even when there is no new Gmail candidate and no Message-State backlog that owns the job.

Preserve existing architecture and safety contracts, including:

- Task is the source of truth and Calendar remains a derived projection;
- dedicated `自動期日管理` Calendar ownership markers;
- Calendar eligibility policy and Review gate;
- worker lease and execution budget;
- Calendar job claim/claim expiry and compare-and-set behavior;
- Task authority and row/business version checks;
- retry, DEAD, conflict recovery, and Dead Letter accounting;
- idempotent CREATE/UPDATE/DELETE/NOOP semantics;
- configured Calendar maximum jobs per run;
- no duplicate Calendar external side effects.

Do not add a second time Trigger, background mechanism, polling subsystem, or alternate Calendar path unless the current architecture makes the primary outcome impossible and a Strategy Reset is required.

### C. Preserve truthful scheduled-run semantics

A scheduled run must distinguish:

- truly healthy zero-work: no new Gmail candidate, no eligible Message backlog, no due Calendar Outbox work, and no system/provider failure;
- meaningful Calendar/backlog processing;
- PAUSED/BUSY states;
- genuine Calendar/system/provider failure.

A real Calendar failure must never be suppressed as healthy idle. A truly healthy `AUTO_PILOT` zero-work run must remain compatible with the accepted detailed Run History suppression contract while `AUTOMATION_LAST_RUN_AT` remains the independent Trigger heartbeat.

Investigate the observed company no-new-mail `FAILED` symptom using local executable evidence. If it cannot be reproduced or safely rooted without the existing company run's bounded code/stage, do not invent a fix. Record exactly which non-sensitive runtime field is still needed for Work 0041 qualification.

### D. Regression coverage

Add focused deterministic tests for the repaired boundary, including at least:

1. Review acceptance / Calendar-relevant edit -> durable Outbox -> next canonical scheduled invocation -> `CREATE` completion without a new Gmail candidate;
2. subsequent eligible Task change -> scheduled `UPDATE`;
3. completion/exclusion/cancellation or equivalent existing policy -> scheduled `DELETE`;
4. already-converged state -> `NOOP` without duplicate external write;
5. due standalone Calendar job with no Message backlog is bounded by the configured per-run job limit;
6. Calendar retryable/non-retryable/conflict failure remains truthful and is not treated as healthy idle;
7. worker lease/budget/claim/CAS protections remain fail-closed;
8. true zero-work scheduled run remains `COMPLETE` with no Calendar API call and retains the accepted idle-detail suppression/heartbeat separation;
9. manual `Calendar同期を1件処理` behavior remains compatible as an explicit fallback, not a routine requirement;
10. existing Gmail/Gemini/Task/Review/Calendar regression suites remain green.

### E. Version, release, and documentation consistency

If authored product source changes, follow the repository's current patch-version/release convention. `2.8.27-prepilot` is the expected unused successor to `2.8.26-prepilot`, but verify this from repository state before adopting it; stop and report if repository evidence conflicts.

Regenerate only the current active source-derived release/company-install candidate through existing authorized tooling. Preserve Work 0038/0039 and all other historical/frozen release evidence byte-identically. Do not edit generated release payloads as the primary fix.

Update materially affected active README/CHANGELOG/status/handoff records so source, version, release evidence, and claims agree. Do not claim company runtime PASS from local tests.

## Non-Goals

- Changing Gemini request/response behavior or provider selection.
- Implementing Azure OpenAI or bypassing company Azure/network policy.
- Weakening high-impact Review requirements or Calendar eligibility merely to create more events.
- Broad UI redesign or unrelated refactor.
- Schema migration unless proven strictly necessary; a requirement for migration triggers Strategy Reset.
- Changing five-minute cadence or creating another Trigger.
- Live company deployment, Apps Script write, Gmail processing, Calendar mutation, provider request, OAuth action, credential read, or Trigger mutation.

## Required Validation Evidence

At minimum, execute and observe:

1. focused deterministic tests for the new Calendar scheduled-drain and idle/failure semantics;
2. relevant Calendar, EditHandler, Worker, Trigger, Run History, retry/idempotency and authority regression suites;
3. Apps Script static validation;
4. complete deterministic test inventory required by the current repository gate, with missing `0` / extra `0` where that gate reports inventory;
5. applicable version/release/source-parity/lineage/frozen-artifact checks if product version or release output changes;
6. secret/local-state scan and `git diff --check`;
7. exact branch-head GitHub CI before returning.

Hosted CI/infrastructure failure is not by itself evidence of a product defect; distinguish it from implementation failure. Do not claim any company Workspace runtime action was executed.

## Delivery Contract

- Work ID: `0041`
- Dispatch ID: `0041-CODEX-01`
- Branch: `codex/0041-calendar-runtime-remediation`
- Report: `docs/handoffs/0041-CODEX-01-calendar-runtime-remediation-report.md`
- Open a Draft PR from the dispatch branch to `main` after the implementation and required local validation are ready for review.
- Keep one active implementation path; do not create parallel competing branches or dispatches.
- Do not merge the PR. ChatGPT owns final review/integration decision.

The report must separate:

- confirmed root cause(s);
- source changes;
- tests/validation actually executed and exact result;
- release/version changes, if any;
- what was not executed (all live Workspace/provider operations);
- residual BLOCKER / FOLLOW_UP / OPTIONAL items;
- whether the company no-new-mail `FAILED` symptom was locally reproduced, fixed, or still requires one bounded runtime code/stage from the user.

## Strategy Reset Conditions

Stop implementation and return to ChatGPT if any of these occurs:

- deterministic evidence disproves the suspected automatic Outbox-drain gap and no equally narrow root cause is established;
- the fix requires schema migration, broad state rewrite, new Trigger architecture, weakened Review/authority/CAS/idempotency controls, or historical release modification;
- a live Google Workspace/provider action is required to continue;
- two materially different repair attempts fail for the same core acceptance condition;
- repository/source/release state materially contradicts this handoff.

Preserve Accepted Evidence and Closed Conclusions during a reset.

## Completion Latch for This Dispatch

Dispatch `0041-CODEX-01` is ready to return only when the smallest safe Calendar scheduled-drain implementation is complete and locally/CI validated, or when a Strategy Reset condition is met and the blocking evidence is precisely recorded.

This dispatch does not complete Work 0041 by itself. Company runtime acceptance remains a later user-observed qualification after ChatGPT review and any approved delivery/update.

Return to ChatGPT with:

- Work ID
- Dispatch ID
- BALL: `CHATGPT`
- STATUS: `RETURNED` or `BLOCKED`
- report path
- final commit SHA
- branch
- Draft PR
- validation summary
- BLOCKER status
