# Work 0041 — Company Workspace Runtime Qualification / Remediation

WORK_ID: `0041`

DISPATCH_ID: `0041-CODEX-01`

BALL: `CODEX`

STATUS: `READY`

MODE: `BUILD`

## Primary Outcome

Advance the accepted Work 0039 company installation to a safely usable company-primary path: Gemini scheduled processing plus governed Task/Review plus automatic projection of eligible deadlines into the dedicated `自動期日管理` Calendar.

The current BUILD step repairs and validates the local source boundary that can strand Calendar Outbox work after Review acceptance/Task edits. Company runtime Acceptance remains separate and must later be based on direct user-observed evidence.

## Current State

Accepted company-runtime evidence:

- setup completed;
- required Gemini credential configured in Script Properties without exposing its value;
- Gemini five-minute Automation can run;
- an eligible target email completed scheduled Gmail/Gemini processing;
- a no-new-mail scheduled invocation has been observed as `FAILED`;
- expected Calendar projection was not correctly observed.

Static repository review establishes a material Calendar scheduling concern: Review/Task edits can create durable Calendar Outbox work after the originating Message is already `DONE`, while the canonical scheduled Trigger drives `processAutomaticBatch()` and the standalone Calendar Outbox drain also exists separately as `syncPendingCalendarJobs()`.

The no-new-mail `FAILED` symptom is not assumed to have the same root cause. It must be reproduced locally or remain a bounded company-runtime evidence request.

## Current Dispatch

`0041-CODEX-01` — Calendar Runtime Remediation

Authoritative instruction:

`docs/handoffs/0041-CODEX-01-calendar-runtime-remediation-instruction.md`

Authoritative current ball/status:

`docs/handoffs/0041-dispatches.md`

## Acceptance Criteria for the Remediated Product Candidate

1. A Calendar-eligible governed Task can create/update/delete its managed event through the ordinary five-minute scheduled operation without routine manual Calendar-sync intervention.
2. Standalone due Calendar Outbox work is bounded by the existing per-run limits and existing worker/Calendar claim/CAS/authority/retry/idempotency controls.
3. A true zero-work scheduled invocation remains healthy and compatible with accepted idle-detail suppression and the independent Trigger heartbeat.
4. Genuine Calendar/backlog/system failure remains visible and is never converted to healthy idle.
5. Existing Gemini Gmail/Task/Review behavior and high-impact Review policy remain intact.
6. Source, tests, active version/release evidence and current documentation agree after any product change.
7. No company runtime PASS is claimed until a later authorized user-observed qualification.

## Non-Goals / Boundaries

- no Azure OpenAI implementation or network-policy bypass;
- no direct OpenAI company qualification;
- no broad Review/Calendar-policy relaxation;
- no new Trigger architecture unless a Strategy Reset is explicitly approved;
- no live company Gmail/Calendar/Apps Script/provider/OAuth/Trigger/deployment action by Codex;
- no credentials, company content, private identifiers/URLs, raw provider payloads/errors, or Calendar business content in GitHub/chat.

## Closed Conclusions

- Work 0039 Acceptance remains closed.
- Work 0040 Acceptance remains closed.
- Gemini target-email company processing is accepted evidence.
- Calendar configuration/readiness is not Calendar E2E and Calendar E2E is still open.
- `candidate_count=0` alone does not establish healthy idle.
- high-impact/important new Tasks intentionally require Review before Calendar eligibility.
- company OpenAI is Azure OpenAI; its existing 403 smoke result is a separate provider/infrastructure path.

## Completion Latch

Not applied. Work 0041 remains open through Codex remediation, ChatGPT review, delivery decision, and later bounded company-runtime qualification.

WORK_ID: `0041`

DISPATCH_ID: `0041-CODEX-01`

BALL: `CODEX`

STATUS: `READY`
