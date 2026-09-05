# Work 0041 — Company Workspace Live Qualification Status

WORK_ID: `0041`

DISPATCH_ID: `N/A`

BALL: `USER`

STATUS: `ACTION_REQUIRED`

MODE: `QUALIFICATION`

## Current live evidence

The company Google Workspace installation is producing direct runtime evidence.

User-observed / user-reported evidence:

- initial setup completed;
- required API key(s) configured in Script Properties; credential values were not requested, copied, logged, or stored;
- Gemini mode can enable the 5-minute Automation;
- when an eligible target email exists in Gemini mode, scheduled Gmail/AI processing completes successfully;
- when no new eligible target email exists, a scheduled invocation has been recorded `FAILED` rather than an established healthy no-work completion;
- the expected Task-to-Calendar projection was not correctly observed;
- the company-provided OpenAI service is Azure OpenAI, not direct OpenAI;
- an independent bounded GAS -> Azure OpenAI smoke test returned `HTTP 403 / PERMISSION_OR_NETWORK_DENIED`.

## Current interpretation

### Gemini

Gemini inference on an eligible real company target-email path is accepted evidence. The remaining issues are downstream/scheduled-runtime semantics, not proof that Gemini itself is unusable.

### Scheduled no-new-mail behavior

The existing `FAILED` run must not yet be classified as a pure idle-run defect. The five-minute worker resumes Message-State backlog before scanning new Gmail candidates, including `CALENDAR_PENDING` work. A run with no new eligible mail can therefore fail because of real Calendar/backlog/system work. The safe `note`/stage/code from one existing run is required before changing zero-work semantics.

### Calendar

Calendar runtime E2E is not accepted.

Static source review shows:

1. `10_CalendarSync.gs` permits AUTO Calendar projection only for a governed, non-Review Task with a valid deadline, `calendar_importance=HIGH`, and an allowed category.
2. `09_TaskReviewPolicy.gs` routes HIGH/high-impact new actions into Review instead of automatic finalization, so important new deadlines normally require user acceptance before becoming Calendar-eligible.
3. `11_EditHandler.gs` turns the accepted/edit Task change into durable Calendar Outbox intent but explicitly performs no Calendar API call.
4. The normal five-minute `runScheduledWorker` calls `WorkOsWorker.processAutomaticBatch()` only.
5. `syncPendingCalendarJobs()` is a separate path exposed by the menu as `Calendar同期を1件処理`; current source does not show `runScheduledWorker` invoking that standalone Outbox drain.

This creates a credible implementation gap: once a Message is already `DONE`, a later Review acceptance or Task edit may enqueue a Calendar job without creating Message-State backlog that the normal five-minute worker will resume. The Calendar job can therefore remain pending unless a manual Calendar-sync action or another eligible processing path drains it.

This is a candidate root cause for the observed missing Calendar projection and must be qualified before company use is accepted.

### Direct OpenAI / Azure OpenAI

Direct OpenAI is superseded for company qualification because the company service is Azure OpenAI. Azure OpenAI remains a separate provider/infrastructure path; the current bounded GAS smoke test returned `HTTP 403 / PERMISSION_OR_NETWORK_DENIED`.

## Next decisive evidence

Use one existing affected Task and one existing failed scheduled run. Do not create unrelated new test mail solely for diagnosis.

Report only bounded fields from the affected Task if present:

- `status`
- `needs_review`
- `decision`
- `review_state`
- due-date present/valid: yes/no
- `deadline_basis`
- `calendar_sync_mode`
- `calendar_importance`
- `calendar_category`
- `calendar_sync_status`
- `calendar_reconcile_required`
- Calendar event ID present: yes/no
- last Calendar sync timestamp present: yes/no

From the corresponding `同期状態` / Calendar Outbox row, omit IDs and report only:

- `target_type`
- `desired_action`
- `status`
- `retry_count`
- safe `error_code`
- next retry populated: yes/no

From one existing `FAILED` scheduled run, report only:

- `mode`
- `run_status` / status
- `note` / safe error code
- `candidate_count`
- `calendar_job_count`
- `error_count`
- safe error stage/code if shown separately

For the dedicated `自動期日管理` Calendar, report only whether the expected managed event is `PRESENT` or `ABSENT`.

Do not provide Task/message/event IDs, email subject/body, sender/recipient, Calendar title/description, account IDs, private URLs, or credentials.

If the existing bounded Outbox state shows a due Calendar job that is `PENDING` or `RETRY`, one explicit `業務OS v2` -> `Calendar同期を1件処理` action is permitted as the single bounded runtime discriminator. A success would strongly support a missing automatic-Outbox-drain defect; a safe Calendar error code would instead identify an API/auth/state blocker.

## Safety / qualification boundary

- Gemini target-email completion is accepted runtime evidence but does not establish Calendar success.
- Calendar configuration/readiness is not equivalent to Calendar event E2E.
- Do not modify Review/high-impact policy until the automatic Outbox drain boundary is proven or disproven.
- Direct OpenAI is not the intended company provider.
- Azure OpenAI requires separate bounded network/auth qualification before integration.
- Work 0039 product acceptance and Work 0040 transport acceptance remain closed unless direct contrary evidence appears.
- No company credential or confidential business content may be stored in GitHub or chat.

WORK_ID: `0041`

DISPATCH_ID: `N/A`

BALL: `USER`

STATUS: `ACTION_REQUIRED`
