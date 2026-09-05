# Work 0041 — Dispatch Ledger

WORK_ID: `0041`

CURRENT_DISPATCH_ID: `N/A`

BALL: `USER`

STATUS: `ACTION_REQUIRED`

MODE: `QUALIFICATION`

## Primary Outcome

Qualify the accepted Work 0039 installation in the user's company Google Workspace environment and advance it to safely usable operation using direct runtime evidence. The primary company path is Gemini plus governed Task/Review plus the dedicated `自動期日管理` Calendar projection. Azure OpenAI remains a separate provider/infrastructure path.

## Current Accepted Evidence

User-observed / reported company-runtime evidence:

- initial setup completed;
- required API key(s) configured in Apps Script Script Properties; credential values not requested, observed, or recorded;
- Gemini 5-minute Automation can be enabled;
- an eligible target email is processed successfully in Gemini mode;
- a scheduled run with no new eligible target email is being recorded `FAILED`;
- the expected Calendar projection was not correctly observed for the processed task path;
- the company-provided OpenAI service has been clarified to be Azure OpenAI, not direct OpenAI;
- an independent bounded GAS -> Azure OpenAI smoke test returned `HTTP 403 / PERMISSION_OR_NETWORK_DENIED`.

Repository evidence:

- `10_CalendarSync.gs` writes managed all-day deadline events only to the dedicated `自動期日管理` Calendar and rejects Tasks that are still in Review, lack a valid governed due date, are terminal/excluded, or are otherwise not Calendar-eligible;
- `calendar_sync_mode=AUTO` is Calendar-eligible only when `calendar_importance=HIGH` and the category is one of the allowed high-impact categories;
- `09_TaskReviewPolicy.gs` simultaneously treats HIGH/high-impact new actions as not safe for automatic finalization, so important new deadlines normally enter `REVIEW` first and cannot produce a Calendar event until accepted;
- `11_EditHandler.gs` handles the acceptance/edit boundary by writing durable Calendar intent to the Outbox and explicitly does not call the Calendar API;
- the normal five-minute trigger `runScheduledWorker` calls only `WorkOsWorker.processAutomaticBatch()`;
- `syncPendingCalendarJobs()` exists as a separate manual/top-level path and is exposed by the menu as `Calendar同期を1件処理`;
- no call from `runScheduledWorker` to the standalone `syncPendingCalendarJobs()` path is present in current source;
- `processAutomaticBatch()` resumes Message-State backlog including `CALENDAR_PENDING`, but a Calendar Outbox job created later by a Task edit/review decision is not by itself a Message-State backlog record.

## Current Classification

### ACCEPTED / primary provider

- Gemini target-email inference/processing works in the real company environment. This remains the preferred provider path.

### INVESTIGATION REQUIRED — scheduled failure

- The no-new-mail scheduled `FAILED` run must not yet be assumed to be a pure healthy-idle logging defect. It may represent Calendar/backlog/system work that failed before or without a new Gmail candidate. One bounded safe stage/code from an existing failed run is required.

### INVESTIGATION REQUIRED — Calendar end-to-end

- Calendar runtime E2E is not accepted. User-observed evidence says the expected Calendar projection was not correctly reflected.
- There is a strong static implementation concern at the post-review/post-edit boundary: the edit handler durably enqueues Calendar intent but the five-minute trigger does not directly drain the standalone Calendar Outbox. If the originating Message is already `DONE`, routine automatic execution may have no Message-State item that causes that Outbox job to run.
- This can make a review-accepted important deadline remain pending until the user explicitly invokes `Calendar同期を1件処理` or another message-related Calendar stage happens to process an allowed job. Routine manual intervention would violate the intended automatic deadline-management outcome.

### SUPERSEDED FOR COMPANY USE

- Existing direct OpenAI provider qualification. The company service is Azure OpenAI, so direct OpenAI enablement evidence is not meaningful for the intended company provider.

### DEFERRED / separate provider-infrastructure path

- Azure OpenAI from GAS has bounded smoke-test evidence of `HTTP 403 / PERMISSION_OR_NETWORK_DENIED`. Do not implement or enable an Azure provider until the GAS-to-Azure network/auth boundary is proven reachable and the approved endpoint/deployment contract is known. Do not bypass company Azure network or governance controls.

## Current Decisive Action

Use existing company-runtime state; do not create new test mail solely for diagnosis.

From one affected Task that was expected to appear in Calendar, report only bounded non-sensitive values if present:

- `status`
- `needs_review`
- `decision`
- `review_state`
- whether `due_date` is present and valid, without the business text around it
- `deadline_basis`
- `calendar_sync_mode`
- `calendar_importance`
- `calendar_category`
- `calendar_sync_status`
- `calendar_reconcile_required`
- whether `calendar_event_id` is present
- whether `last_calendar_sync_at` is present

From the corresponding Calendar Outbox / `同期状態` row, omit all IDs and report only:

- `target_type`
- `desired_action`
- `status`
- `retry_count`
- safe `error_code`
- whether `next_retry_at` is populated

From exactly one existing scheduled `FAILED` run, report only:

- `mode`
- `run_status` / status
- `note` / safe error code
- `candidate_count`
- `calendar_job_count`
- `error_count`
- safe error stage/code if separately displayed

Also record only whether the dedicated `自動期日管理` Calendar contains the expected managed event: `PRESENT` or `ABSENT`; do not expose title, description, attendees, IDs, or private URLs.

If the bounded Outbox evidence shows a due `PENDING`/`RETRY` Calendar job and no sensitive data is required, exactly one user-controlled `業務OS v2` -> `Calendar同期を1件処理` invocation is the next permitted decisive runtime test. Its bounded result will distinguish Calendar API/auth failure from missing automatic Outbox draining.

## Likely Remediation Shape if Static Concern Is Confirmed

Strategy Reset: `QUALIFICATION -> BUILD`, same Work ID `0041`.

First Codex dispatch: `0041-CODEX-01`.

Narrow implementation target:

1. make the canonical five-minute worker drain at most the already-configured bounded number of due standalone Calendar Outbox jobs even when there is no Message-State backlog/new Gmail candidate;
2. preserve worker lease, budget, Calendar claim/CAS, authority, retry/dead-letter and one-job-per-run limits;
3. do not turn genuine Calendar errors into healthy idle;
4. keep healthy zero-work AUTO_PILOT cycles suppressible as detailed Run History while still updating the automation heartbeat;
5. add regression coverage for review acceptance/edit -> durable Outbox -> next scheduled run -> Calendar CREATE/UPDATE/DELETE/NOOP outcome;
6. verify that a Calendar-eligible Task reaches `SYNCED`/event-present state without routine manual menu intervention.

Do not change the high-impact Review policy merely to make the test pass unless product intent is separately changed. The first defect to prove/fix is automatic draining after a governed Task becomes Calendar-eligible.

## Closed Conclusions

- Work 0039 product/release/bundle Acceptance remains closed.
- Work 0040 transport Acceptance remains closed.
- Bundle regeneration or resend is not required.
- The correct Work 0039 Code bundle SHA-256 is `a3fcd9c11d232254dc9ed25d5052da0dbddd0b5ba7c2212ca055ea35446aa510`.
- Company-runtime evidence, not GitHub CI alone, controls Work 0041 qualification.
- Calendar setup/readiness and Calendar event end-to-end behavior are different acceptance claims; current evidence does not permit the latter to be marked PASS.
- A scheduled run with `candidate_count=0` is not automatically a healthy-idle run if due Calendar/backlog/system work exists.
- Direct OpenAI is not the intended company provider; company OpenAI use means Azure OpenAI.
- Azure OpenAI requires a separate bounded provider/infrastructure qualification before integration.
- Credentials and company content must never be pasted into chat or GitHub.

## Completion Latch

Not applied. Gemini target-email processing is usable, but healthy scheduled semantics and Calendar end-to-end automatic projection remain open.

WORK_ID: `0041`

CURRENT_DISPATCH_ID: `N/A`

BALL: `USER`

STATUS: `ACTION_REQUIRED`
