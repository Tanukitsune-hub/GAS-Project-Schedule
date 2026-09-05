# Work 0041 — Dispatch Ledger

WORK_ID: `0041`

CURRENT_DISPATCH_ID: `0041-CODEX-01`

BALL: `CODEX`

STATUS: `READY`

MODE: `BUILD`

## Primary Outcome

Converge the company-primary Gemini + governed Task/Review + dedicated `自動期日管理` Calendar path to safely usable operation. The immediate BUILD outcome is to make the canonical five-minute scheduled operation drain bounded due standalone Calendar Outbox work created after Review acceptance/Task edits, while preserving truthful zero-work/failure semantics.

## Strategy Reset Applied

Work 0041 was previously in `QUALIFICATION`. Static source review established a material implementation gap candidate at the post-Review/post-edit Calendar boundary, so the Work is reset to `BUILD` for Dispatch `0041-CODEX-01`.

The observed company scheduled `candidate_count=0` / `FAILED` run remains unresolved runtime evidence. It is not pre-classified as an idle-log defect because a zero-new-mail invocation can still contain Calendar/backlog/system work.

## Current Accepted Evidence

Company-runtime evidence already accepted:

- initial setup completed;
- required API key(s) configured in company Apps Script Script Properties; values never copied to GitHub/chat;
- Gemini 5-minute Automation can be enabled;
- an eligible target email completes scheduled Gmail/Gemini processing;
- at least one scheduled invocation with no new eligible target email was recorded `FAILED`;
- the expected Calendar projection was not correctly observed;
- company OpenAI means Azure OpenAI, and the separate bounded GAS -> Azure smoke test returned `HTTP 403 / PERMISSION_OR_NETWORK_DENIED`.

Repository evidence already accepted:

- `10_CalendarSync.gs` owns the dedicated Calendar projection and its eligibility/idempotency contract;
- high-impact/important Tasks intentionally require Review before Calendar eligibility;
- `11_EditHandler.gs` can persist Calendar intent/Outbox work without calling Calendar API;
- `runScheduledWorker` invokes `WorkOsWorker.processAutomaticBatch()`;
- standalone Calendar draining also exists as `syncPendingCalendarJobs()` / menu `Calendar同期を1件処理`;
- a post-edit standalone Outbox job is not inherently a Message-State backlog item.

## Active Dispatch

### `0041-CODEX-01` — Calendar Runtime Remediation

Instruction:

`docs/handoffs/0041-CODEX-01-calendar-runtime-remediation-instruction.md`

Expected branch:

`codex/0041-calendar-runtime-remediation`

Expected report:

`docs/handoffs/0041-CODEX-01-calendar-runtime-remediation-report.md`

Required outcome:

1. deterministically prove or disprove the automatic standalone Calendar Outbox drain gap;
2. if confirmed, make the normal five-minute scheduled path drain bounded due standalone Calendar work without requiring routine manual menu intervention;
3. preserve worker lease/budget, Calendar claim/CAS, Task authority, retry/dead-letter, idempotency, Review/eligibility policy, and per-run Calendar limits;
4. keep genuine Calendar/backlog/system failures truthful rather than suppressing them as idle;
5. keep a truly zero-work `AUTO_PILOT` compatible with accepted idle-detail suppression and independent Trigger heartbeat;
6. investigate the company no-new-mail `FAILED` symptom locally, but do not guess a fix if the bounded company stage/code is still required;
7. add deterministic CREATE/UPDATE/DELETE/NOOP and failure/budget/claim regression coverage;
8. return a Draft PR and report for ChatGPT review; no live Workspace/provider operation is authorized.

## Closed Conclusions

- Work 0039 Acceptance remains closed.
- Work 0040 Acceptance remains closed.
- Work 0039/0040 historical product, release, bundle, delivery and provenance evidence must not be rewritten.
- Gemini target-email company processing is accepted evidence; Calendar E2E is not yet accepted.
- Calendar setup/readiness is not Calendar event E2E.
- High-impact Review policy stays intact unless a separate product decision changes it.
- `candidate_count=0` alone does not prove healthy idle.
- Direct OpenAI is superseded for company use; Azure OpenAI is separate and deferred.
- No credential, company content, private identifier/URL, raw provider payload/error, or Calendar business content may enter GitHub/chat.
- No live company Gmail/Calendar/Apps Script/provider/OAuth/Trigger/deployment action is authorized in `0041-CODEX-01`.

## Attempt Bound / Reset

Maximum two materially different repair attempts for the same core acceptance failure. Strategy Reset is required if the suspected gap is disproved without a narrow replacement root cause, schema/new-Trigger architecture becomes necessary, accepted authority/idempotency boundaries would need weakening, live Workspace access is required, or historical release evidence would need modification.

## Completion Latch

Not applied. Work 0041 remains open until ChatGPT reviews the Codex return and later company-runtime qualification proves the repaired primary path.

WORK_ID: `0041`

CURRENT_DISPATCH_ID: `0041-CODEX-01`

BALL: `CODEX`

STATUS: `READY`
