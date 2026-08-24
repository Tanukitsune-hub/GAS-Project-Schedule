# Work 0037 Automatic Personal Inbox Shadow Pilot Runbook

WORK_ID: `0037`

This is the authoritative user-controlled runtime runbook for Code
`2.8.24-prepilot`. It supersedes the historical label-gated 2.8.22 runbook for
all future Work 0037 pilot operations. The historical file
`docs/handoffs/0037-personal-shadow-pilot-runbook.md` remains unchanged as
2.8.22 evidence.

This runbook does not authorize company-environment use. A company sandbox is a
separate later Work after this personal pilot passes and required company
approval is confirmed.

## What this pilot does

When the user explicitly enables Automation, the system checks eligible new
personal Inbox mail every five minutes and may send admitted message content to
the configured Gemini provider. `手動/取込` is not required.

The code must exclude, before admission:

- every Thread carrying `手動/除外`;
- spam, trash, and non-Inbox mail;
- Promotions and Social categories;
- clear newsletter/list mail identified by the bounded metadata rule;
- Google Calendar invite, update, and system-notification mail identified by
  the bounded Calendar-notification rule;
- Message IDs already known to Message State;
- every Message received before the durable pilot-start boundary.

At most one Message may be admitted in each scheduled run. Automation remains
OFF until the user explicitly enables it.

Healthy scheduled `AUTO_PILOT` no-op runs are intentionally not written as
detailed `処理履歴` rows; `AUTOMATION_LAST_RUN_AT` remains the heartbeat.
Meaningful automatic runs are recorded as `TIME_DRIVEN / AUTO_PILOT`, while
historical `AUTO_PHASE6` and manual modes retain their existing semantics. A
90-day retention cutoff applies only to detailed Run History rows: valid
timestamps strictly older than the cutoff may be compacted, invalid or missing
timestamps are retained, and Errors, Message State, Task/Review, Calendar, and
Task Authority Ledger evidence are never touched.

## Privacy gate before starting

Use only the existing personal test environment and non-sensitive test content.
Do not start this pilot on an account that may receive confidential, company,
financial, medical, legal, family, credential, or other sensitive messages
while Automation is enabled. Any new ordinary Inbox Message that passes the
hard exclusions can be sent to Gemini without a manual label.

Use fresh Threads for the pilot except for the dedicated thread-update case.
This keeps all intended thread context inside the pilot window and avoids
including older personal correspondence as context.

Do not include attachments, private URLs, credentials, real names, real company
information, or production data. Do not paste Message bodies, subjects,
senders, Message IDs, private URLs, credentials, or raw provider output into
GitHub, Codex, or ChatGPT.

## Entry conditions

Before any enablement:

1. The Spreadsheet has reloaded after placement of Code `2.8.24-prepilot`.
2. Automation is `CONSISTENT` and OFF.
3. `enabled=false` and `desired_enabled=false`.
4. Owned `trigger_count=0` and `clock_trigger_count=0`.
5. Stored and canonical Automation Trigger identifiers are absent.
6. Setup `S99_COMPLETE`, Code/Schema/Migration alignment, Gemini readiness,
   OAuth, all seven formal Gmail labels, and the dedicated Calendar are ready.
7. No historical Work 0036 failure or Dead Letter is retried.
8. The previous 2.8.22 `AUTOMATIC_PILOT` history is left untouched.

## Controlled start sequence

### 1. Establish one pre-start negative witness

Before enabling Automation, place one fresh, non-sensitive, unlabeled test
Message in Inbox. Record only that one pre-start witness exists; do not record
its content or identifier. It must remain unprocessed throughout the pilot.

### 2. Prepare the 2.8.24 candidate

From `業務OS v2`, run:

- `個人用Shadow Pilotを準備`
- `個人用Shadow Pilotの準備状態を確認`

Proceed only when the preparation reports Code `2.8.24-prepilot` and readiness
reports `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT` with Automation OFF,
zero owned clock Triggers, the automatic-Inbox scope, all hard exclusions, and
provider/OAuth/label/Calendar readiness.

Preparation must not process Gmail, call Gemini, create a time Trigger, or
mutate Task, Review, or Calendar business state.

### 3. Enable exactly once

Run `自動処理を明示的に有効化` once. Continue only when the result is
`ENABLED` and the immediate state check shows:

- `status=CONSISTENT`;
- `enabled=true`;
- `desired_enabled=true`;
- exactly one canonical five-minute clock Trigger;
- no invalid or duplicate Trigger;
- a valid, established pilot-start boundary.

If enablement is refused, fails, or returns anything other than `ENABLED`, stop
immediately. Do not retry enablement, do not send pilot Messages, and do not
manually run the worker. Disable Automation if needed and preserve the bounded
status for review.

The first successful enable establishes the durable start boundary. Messages
older than that boundary are never eligible as pilot candidates.

## 24-hour cohort

Run for at least 24 consecutive hours. Use at least 12 fresh, non-sensitive,
work-like Messages received after successful enablement. Send them gradually,
not all at once. Keep the one-Message-per-run cadence observable.

The cohort must include a bounded representative mix:

### Expected eligible cases

1. A new task with an explicit calendar date.
2. A new task with a relative deadline.
3. A simple task with no deadline.
4. An ambiguous or unclear request that should enter governed Review.
5. An information-only Message that should create no Task and no Calendar job.
6. A waiting-for-reply case.
7. A two-Message thread update where both Messages are received after the
   pilot-start boundary.
8. Additional ordinary unlabeled Inbox variations sufficient to exercise
   multiple scheduled runs.

### Expected excluded cases

9. A Message or Thread carrying `手動/除外`.
10. A Message carrying both `手動/取込` and `手動/除外`; exclusion must win.
11. A clear newsletter/list Message with the applicable metadata, when safely
    available.
12. A Google Calendar notification Message, when safely available.
13. A Promotions or Social Message, when safely available.

`手動/取込` may be used on one otherwise eligible Message only to observe
priority. It is optional and must not bypass any hard exclusion.

Do not manually invoke `runScheduledWorker`, the manual Gmail worker, Calendar
sync, Setup, diagnostics, Dashboard repair, or Dead Letter retry during the
pilot. Do not edit or delete Message State rows.

## Observation

Observe only bounded, redacted evidence:

- scheduled run count and terminal status;
- candidate, processed, skipped, Task-created, Task-updated, Review, Calendar
  job, and error counts;
- source mode `AUTOMATIC_INBOX_PILOT`;
- whether each intended eligible case reached a correct governed terminal or
  Review state;
- whether each intended exclusion remained unprocessed;
- whether the pre-start witness remained unprocessed;
- whether Task titles, action types, deadlines, waiting state, and Review
  decisions were materially correct;
- whether Calendar writes, if any, used only the dedicated managed Calendar and
  matched the governed policy;
- whether exactly one canonical time Trigger remained present.

Do not record raw email or provider content. A classification that is merely
worded differently is not a failure unless it changes the intended action,
Task, deadline, Review requirement, waiting state, or Calendar behavior.

## Immediate stop conditions

Disable Automation immediately if any of the following occurs:

- a pre-start Message is admitted;
- a `手動/除外`, spam, trash, non-Inbox, Promotions, Social, newsletter/list,
  or Google Calendar notification Message is admitted;
- an unexpected or sensitive personal Message is admitted;
- duplicate Task, Review, Message State, or Calendar business effects appear;
- information-only mail creates a Task or Calendar job;
- unclear mail bypasses governed Review;
- a Calendar event is written outside the dedicated managed Calendar or is
  otherwise materially wrong;
- more than one owned clock Trigger appears;
- the system reaches a non-recoverable error, unresolved Dead Letter, privacy
  leak, or repeated failure state;
- Automation status becomes inconsistent.

After any stop, do not re-enable during the same pilot without a new review.
The durable first-start boundary remains historical evidence, so re-enabling
could make Messages received during the stopped interval eligible.

## Success criteria

The pilot passes only when all are true:

- at least 24 hours elapsed after the first successful enable;
- the bounded cohort was completed;
- the pre-start witness was never processed;
- every hard-exclusion witness remained unprocessed;
- ordinary eligible unlabeled Inbox Messages were processed without a manual
  admission label;
- every admitted Message reached a governed terminal or intentionally
  reviewable state;
- information-only mail created no Task or Calendar side effect;
- unclear mail followed governed Review;
- there were no duplicate business effects;
- there were no unexpected Calendar writes;
- there were no unresolved pilot-caused errors or Dead Letters;
- Gemini remained the configured provider and strict AI Schema validation did
  not require weakening;
- no privacy-sensitive evidence was persisted or shared.

## Final rollback

At the end of the observation period, run `自動処理を停止` once and then
`自動処理の状態を確認`.

Completion requires:

- `status=CONSISTENT`;
- `enabled=false`;
- `desired_enabled=false`;
- owned `trigger_count=0` and `clock_trigger_count=0`;
- no stored or canonical Automation Trigger identifier;
- no duplicate or invalid owned Trigger.

Do not delete the pilot-start boundary, watermark, last-run marker, run history,
Message State, Review, or error evidence. These are needed for the final bounded
review.

## After a pass

A successful personal automatic-Inbox pilot does not itself authorize company
use. The next outcome is a separate Work ID for company-environment sandbox
qualification, starting with policy/authorization and environment readiness,
then synthetic validation, and only later a tightly bounded company-account
pilot if explicitly approved.
