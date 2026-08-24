# Current Status

Last updated: 2026-08-25

Candidate version: Code `2.8.25-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Overall status: `WORK_0037_FINAL_LOG_CONVERGENCE_IN_PROGRESS`

Machine gate: `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`

ChatGPT review disposition: `BLOCKED_FOR_COMPLETION — IDLE_RUN_RETENTION_MAINTENANCE_ORDER`

Personal Gemini E2E: `PASS`

Automation: `OFF — USER CONFIRMED STOPPED / OWNED TIME-TRIGGER CLEANUP COMPLETE`

User Automatic Inbox Pilot: `PASS — USER-CONTROLLED LIVE PILOT COMPLETED AND STOPPED`

## Current contract

The canonical source is `implementation/GoogleSpreadsheet/apps-script-v2/`.
Code `2.8.23-prepilot` is frozen as accepted Work 0037 live-pilot evidence.
Code `2.8.24-prepilot` is frozen as the returned first operational-log-hardening
placement evidence. The active target for final convergence is Code
`2.8.25-prepilot`; Schema `2.6`, AI Schema `2.0`, and Migration `3` remain
unchanged.

The accepted Work 0037 Automatic Inbox product boundary is closed:

- ordinary eligible personal Inbox mail is admitted without requiring
  `手動/取込`;
- `手動/除外` wins Thread-wide;
- spam, trash, non-Inbox, Promotions, Social, clear newsletter/list mail, and
  bounded Google Calendar notification mail are hard exclusions;
- `手動/取込` is optional priority only;
- source mode is `AUTOMATIC_INBOX_PILOT`;
- a successful explicit enable establishes a durable pilot-start boundary;
- at most one Message is admitted per five-minute scheduled run;
- strict AI Schema 2.0, one-call/no-retry/no-fallback Gemini, Task/Review
  authority, dedicated-Calendar ownership, privacy, and fail-closed Trigger
  lifecycle remain authoritative.

## Accepted Work 0037 live evidence

The user-controlled Code `2.8.23-prepilot` Automatic Personal Inbox Shadow
Pilot was executed in the existing personal test environment. Accepted bounded
evidence includes:

- preparation/readiness PASS;
- explicit enable PASS with one canonical five-minute time Trigger;
- durable pilot-start boundary established;
- an ordinary unlabeled non-sensitive test Inbox Message was automatically
  admitted and produced the intended Task;
- repeated scheduled runs were user-observed as COMPLETE with zero visible
  errors in the supplied bounded evidence;
- after the observation window the user explicitly stopped Automation;
- the user then confirmed the real Automation state was stopped/consistent
  with owned time-trigger cleanup complete.

No company environment is authorized by this evidence.

## Operational-log convergence

Live evidence exposed that the 2.8.23 Run History serializer falsely displayed
`AUTO_PILOT` as `MANUAL / GMAIL_PHASE2` and that healthy five-minute idle rows
would accumulate indefinitely.

Dispatch `0037-CODEX-03` returned Code `2.8.24-prepilot` and successfully:

- corrected meaningful `AUTO_PILOT` history to
  `TIME_DRIVEN / AUTO_PILOT`;
- preserved historical `AUTO_PHASE6` and manual mappings;
- introduced a strict healthy-idle detail suppression predicate;
- preserved `AUTOMATION_LAST_RUN_AT` as the existing lightweight heartbeat;
- implemented 90-day retention only for detailed Run History;
- passed local gate `11/11`, deterministic inventory `85` suites with missing
  `0` / extra `0`, static/release/lineage/frozen/secret/diff checks;
- passed exact pre-placement CI `#498` and returned report-head CI `#500`;
- completed one OFF-state Phase 8C 2.8.24 placement and one isolated pull-back
  with exact 23-file parity.

ChatGPT final source review found one explicit acceptance mismatch: the healthy
idle path calls Run History duplicate/full-range and retention maintenance
before it decides to suppress the idle row. The row no longer grows history,
but every empty five-minute cycle still performs unnecessary full-history work.
The helper also reports `log_recorded=true` after intentional suppression.

Dispatch `0037-CODEX-04` therefore owns the final Code `2.8.25-prepilot`
micro-fix. It must move healthy-idle suppression ahead of Run History
maintenance, make detail-record status truthful, preserve meaningful-run
retention/audit semantics and heartbeat, pass all gates, and perform one newly
authorized OFF-state correction placement plus one isolated pull-back.

No Automation enable/re-enable, scheduled smoke, Gmail/Gemini/Task/Review/
Calendar runtime action, live retention cleanup, alternate target, or company
environment action is authorized.

## Machine gate note

`READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT` remains the canonical product
release-gate identifier used by active validation contracts. It does not mean
another Work 0037 user pilot is required. The user pilot is already accepted;
the remaining blocker is limited to operational-log finalization.

## Next boundary after Work 0037

After Dispatch `0037-CODEX-04` passes final ChatGPT review and PR #52 is merged,
Work 0037 can be Completion-Latched. A separate Work `0038` may then qualify a
company-environment sandbox only after explicit authorization. It must begin
with company policy/environment readiness rather than ordinary company Inbox
processing.
