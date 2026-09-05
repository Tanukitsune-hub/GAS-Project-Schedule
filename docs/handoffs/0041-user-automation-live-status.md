# Work 0041 — Company Workspace Live Qualification Status

WORK_ID: `0041`
DISPATCH_ID: `0041-CODEX-01`
DISPATCH_STATUS: `ACCEPTED`
BALL: `USER`
STATUS: `ACTION_REQUIRED`
MODE: `QUALIFICATION`

## Frozen company-runtime evidence

No company Workspace operation was performed during CODEX-01 or the ChatGPT integration review. The following user-reported evidence remains unchanged:

- setup completed;
- required Gemini credential configured in company Script Properties without exposing the value;
- Gemini five-minute Automation can be enabled;
- an eligible target email completed scheduled Gmail/Gemini processing;
- at least one scheduled invocation with no new eligible target email was recorded FAILED;
- the expected Calendar projection was not correctly observed;
- company OpenAI is Azure OpenAI;
- separate bounded GAS-to-Azure smoke testing returned HTTP 403 / PERMISSION_OR_NETWORK_DENIED.

## Repository repair accepted; runtime not yet updated

ChatGPT accepted CODEX-01 and merged PR #56 at `9d46290da5612beef8f94d1aff40890ab430eae9`. Code `2.8.27-prepilot` now consumes standalone Calendar Outbox work through the normal scheduled worker. This repairs the repository-level gap after a Message is DONE and a later Review acceptance or Task edit enqueues Calendar work.

The accepted candidate is under `implementation/GoogleSpreadsheet/release/work-0041-single-file-company-install/`. Company delivery/update of this candidate and Calendar E2E are still NOT_EXECUTED. Source/CI success is not proof of the company's Calendar authorization or event projection.

The company no-new-mail FAILED observation is still NEED_USER_EVIDENCE. The repair did not establish its root cause. First inspect one existing FAILED run's normalized error code and stage/subsystem only. Do not manufacture a failure or send screenshots with business data.

## Later user-controlled update and qualification boundary

A company update is a separate explicit user action, not performed or delegated by the merge. It must use the accepted candidate and preserve the existing bound project, all Script Properties/credentials, Task/Review/Message/Outbox/authority state, dedicated Calendar identity, and original scan/start boundary. Establish Automation-OFF/quiescence before any code replacement. Do not rerun initial Setup, delete state, create another Calendar, or use a different account/target.

After an authorized update and readiness confirmation, the bounded acceptance test is:

1. one governed, Calendar-eligible accepted Task has due Outbox work;
2. the ordinary scheduled path creates the correct managed event in the dedicated Calendar without a manual Calendar-sync action;
3. Task/Outbox state reflects the result and the next observation shows no duplicate;
4. truly zero-work behavior is healthy, while any genuine error remains visible.

A manual one-job Calendar sync can be a separately approved diagnostic fallback, not evidence that the automatic scheduling fix works. Keep company E2E NOT_ACCEPTED until direct evidence is observed.

## Safety and remaining status

BUILD/integration blockers: NONE. Work-wide closure still requires Calendar runtime E2E and a supported disposition of the no-new-mail FAILED symptom. Do not expose email/Task/Calendar content, identifiers, private URLs, credentials or raw provider errors. Azure remains separate and deferred.

See `0041-CODEX-01-review.md` and `0041-dispatches.md` for current control state. The original instruction describes the completed BUILD, not a new active Codex authorization.

WORK_ID: `0041`
DISPATCH_ID: `0041-CODEX-01`
DISPATCH_STATUS: `ACCEPTED`
BALL: `USER`
STATUS: `ACTION_REQUIRED`
