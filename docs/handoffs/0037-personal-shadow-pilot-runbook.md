# Work 0037 Personal Shadow Pilot Runbook

This runbook is a later user-controlled operation after ChatGPT review. It is
not an authorization for Codex implementation, placement, or runtime calls.

## Entry conditions

- Candidate Code `2.8.22-prepilot`, Schema `2.6`, AI Schema `2.0`, and
  Migration `3` are aligned.
- `getPersonalShadowPilotStatus()` reports the label-gated pilot ready while
  Automation is OFF, with zero owned clock triggers and no stored or canonical
  trigger residue.
- The user has confirmed the personal target, provider readiness, OAuth, formal
  Gmail labels, and dedicated Calendar boundary without exposing credentials or
  private identifiers.
- Do not use the historical Work 0036 failure, its Message State row, or any
  Dead Letter as a pilot fixture.

## Cohort and admission

Run for at least 24 hours and prepare at least 12 explicitly selected,
non-sensitive work-like test messages. Apply `手動/取込` only to the selected
messages. Every pilot candidate must be in Inbox and must not be in spam or
trash. `手動/除外` always wins when both labels are present. Ordinary
unlabeled Inbox messages must never be processed.

Use a representative bounded mix, recording only redacted outcomes:

1. new task with an explicit deadline;
2. new task with a relative deadline;
3. ambiguous task requiring Review;
4. information-only message;
5. waiting/reply-state message;
6. thread/task update;
7. safe dedicated-Calendar-relevant synthetic case, only if the existing
   policy naturally emits one;
8. additional normal task variations to reach at least 12 total;
9. one message carrying both `手動/取込` and `手動/除外` (must not process).

Do not include personal, confidential, company, production, high-impact, or
attachment-dependent data. Do not invoke the manual worker while pilot
Automation is enabled.

## Execution and observation

1. Confirm Automation is OFF and run the documented preparation/status surfaces
   only as authorized by the user.
2. Enable Automation once and verify exactly one canonical five-minute clock
   trigger. Do not create a second trigger.
3. Let scheduled runs process at most one message per run. Do not manually
   invoke the worker, retry a Dead Letter, or bypass the `手動/取込` gate.
4. Record bounded counts and terminal/reviewable states only. Do not record
   message bodies, subjects, senders, IDs, credentials, raw provider responses,
   or private URLs.
5. Stop immediately on any unlabeled message processing, duplicate Task,
   Review, or Calendar side effect, unexpected Calendar target, privacy leak,
   trigger duplication, or non-recoverable runtime error.

## Success and rollback

Success requires zero ordinary unlabeled messages processed, zero duplicate
business side effects, zero unexpected Calendar writes, zero pilot-caused
unresolved errors/Dead Letters, governed terminal or intentionally reviewable
state for every selected message, and the configured Gemini provider.

After observation, disable Automation once and verify `CONSISTENT`, disabled
desired state, zero owned clock triggers, and no stored or canonical trigger
residue. Preserve unrelated triggers. Record any classification/title
difference for review; any materially wrong task, deadline, action type, or
Calendar classification is a pilot failure.
