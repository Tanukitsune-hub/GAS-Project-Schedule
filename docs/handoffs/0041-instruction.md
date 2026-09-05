# Work 0041 — Company Workspace Runtime Qualification

WORK_ID: `0041`

DISPATCH_ID: `N/A`

BALL: `USER`

STATUS: `ACTION_REQUIRED`

MODE: `QUALIFICATION`

## Outcome

Qualify the accepted Work 0039 company-install bundle on the user's company Google Workspace environment and advance it to a safely usable state using direct user-observed runtime evidence. This includes the governed Gmail -> AI -> Task/Review -> Calendar Outbox -> dedicated Google Calendar projection path. Automation and Calendar behavior must not be declared accepted from CI/local evidence alone.

## Already-Decided Design Choices

- GitHub `main` / Work 0039 accepted source and release remain authoritative for product bytes.
- The canonical authored source remains `implementation/GoogleSpreadsheet/apps-script-v2/`.
- The installed company bundle is the accepted Work 0039 two-paste distribution; do not regenerate or modify it merely to repeat qualification.
- User-observed company-PC runtime evidence is stronger than local/CI inference for this Work.
- Credentials and API-key values must never be copied into GitHub, chat, email, reports, screenshots, or attachments.
- Calendar is a derived projection of the governed Task state; the Sheet remains the source of truth.
- A company Apps Script editor size failure would trigger a Strategy Reset to the pre-decided split-bundle fallback rather than repeated paste attempts; that fallback is not active because installation/setup has already progressed.

## Source of Truth

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Accepted product baseline at Work start: `b9fb54217576a9e780d725118081037eadcf5b48`
- Work 0039 acceptance: `docs/handoffs/0039-acceptance.md`
- Work 0039 dispatch ledger: `docs/handoffs/0039-dispatches.md`
- Runtime menu: `implementation/GoogleSpreadsheet/apps-script-v2/Menu.gs`
- Runtime readiness behavior: `implementation/GoogleSpreadsheet/apps-script-v2/README.md`, `12_Triggers.gs`, and related current source.
- Calendar runtime path: `09_TaskReviewPolicy.gs`, `10_CalendarSync.gs`, `11_EditHandler.gs`, `18_Worker.gs`.

## Accepted Evidence at Work Start

User-observed evidence reported in the company environment:

1. Initial setup has completed.
2. The required API key has been configured in Apps Script Script Properties.

The credential value was not requested, observed, recorded, or stored.

Subsequent company-runtime evidence now also establishes:

- Gemini 5-minute Automation can be enabled;
- an eligible target email can be processed successfully in Gemini mode;
- a scheduled run with no new eligible target email has been recorded `FAILED`;
- the expected Calendar projection was not correctly observed for the processed task path;
- the company-provided OpenAI service is Azure OpenAI and an independent bounded GAS -> Azure OpenAI smoke test returned `HTTP 403 / PERMISSION_OR_NETWORK_DENIED`.

The following are not yet claimed as PASS unless separately observed during this Work:

- healthy zero-new-mail scheduled behavior;
- Calendar eligibility -> Outbox -> Advanced Calendar API -> Task sync-state end-to-end behavior;
- correct automatic draining of Calendar Outbox work created by Task/Review edits;
- Azure OpenAI provider/infrastructure qualification.

## Required Scope

1. Preserve the already-accepted Gemini target-email major flow evidence.
2. Identify the safe stage/code for exactly one existing scheduled `FAILED` run with no new eligible email; do not assume it is an idle-run defect until Calendar/backlog failure is excluded.
3. Trace one existing task that was expected to reach Calendar through Task eligibility, Review state, Calendar intent, Outbox, Calendar job execution, and final Task Calendar state.
4. Determine whether the current post-edit/post-review Calendar Outbox is automatically drained by the five-minute worker or requires an implementation repair.
5. If an existing Calendar Outbox job is safely pending and the read-only evidence is insufficient, use at most one explicit user-controlled `Calendar同期を1件処理` invocation as the bounded runtime qualification action.
6. Resolve only defects that materially block safe company use; avoid broad hardening or provider work unrelated to these paths.
7. Record observed PASS/FAIL/NOT_EXECUTED evidence without confidential content.

## Non-Goals

- Rebuilding Work 0039 bundles without a material blocker.
- Broad hardening, refactoring, or unrelated UI work.
- Storing company message content, account identifiers, API keys, private URLs, provider payloads, Calendar event titles/descriptions, or raw provider errors in GitHub/chat.
- Implementing Azure OpenAI before the separate GAS-to-Azure network/auth boundary is qualified.
- Treating CI or synthetic local tests as company-runtime PASS.

## Acceptance Criteria

Priority order:

1. Installed bundle remains saved and runnable in the company Spreadsheet/Apps Script project.
2. Gemini target-email scheduled processing remains proven usable.
3. A scheduled invocation with no new eligible mail completes with truthful semantics: healthy idle when there is no backlog/error, or a precise bounded failure when real backlog/system work fails.
4. For a Calendar-eligible governed Task, the intended `CREATE` path reaches the dedicated `自動期日管理` Calendar and the Task/Outbox final state reflects success.
5. Review acceptance or a Calendar-relevant Task edit creates durable Calendar intent and is subsequently drained automatically by the normal five-minute operation, without requiring routine manual `Calendar同期を1件処理` intervention.
6. Existing Calendar `UPDATE`/`DELETE` behavior remains protected by the same outbox/authority contract; a local regression test must cover the repaired scheduling boundary even if live destructive verification is not required.
7. No BLOCKER remains in the Gemini + Task + Calendar primary company path.

## Required Validation Evidence

Evidence hierarchy:

1. User-observed company Spreadsheet / Apps Script / dedicated Calendar result.
2. Bounded Task state: `status`, `needs_review`, `decision`, `review_state`, due-date presence/validity, `deadline_basis`, `calendar_sync_mode`, `calendar_importance`, `calendar_category`, `calendar_sync_status`, `calendar_reconcile_required`, and event-id/last-sync presence only.
3. Bounded Calendar Outbox state: `target_type`, `desired_action`, `status`, `retry_count`, safe `error_code`, and whether a due job exists; omit IDs and business content.
4. Bounded Run History state: `mode`, `run_status`, `note`/safe code, `candidate_count`, `calendar_job_count`, `error_count`, and safe error stage/code.
5. Dedicated `自動期日管理` Calendar event presence/absence without exposing event title, description, attendees, or private URLs.
6. Repository CI/local regression evidence only as supporting evidence.

Never mark an unexecuted company-runtime check PASS.

## External-Action Authorization

Current authorization is limited to user-controlled actions in the already-created company Workspace installation necessary to inspect the existing failure and Calendar path.

Next decisive action is read-only inspection of one existing affected Task, its corresponding bounded Outbox state, and one existing failed scheduled run. If that proves a safe due Calendar job is pending, one explicit menu invocation of `業務OS v2` -> `Calendar同期を1件処理` is within the bounded qualification scope; do not create unrelated test mail or multiple Calendar jobs solely for diagnosis.

Not authorized:

- repeated provider requests;
- broad Gmail processing;
- destructive Task cleanup;
- sharing credentials or company content;
- Azure network-policy bypass or Azure provider integration before separate qualification.

## Escalation Conditions

Perform a Strategy Reset from QUALIFICATION to BUILD if the evidence establishes a reproducible code defect in either the zero-new-mail scheduled path or the normal automatic Calendar Outbox drain path. Keep the remediation narrow and preserve accepted Task authority, Calendar ownership, idempotency, and fail-closed behavior.

## Delivery

This Work is primarily user-executed company-runtime qualification. GitHub records contain bounded status/evidence only and no company secrets. Codex is required only after a reproducible implementation defect is fixed as the next decisive action; any such dispatch remains Work `0041` and begins at `0041-CODEX-01`.
