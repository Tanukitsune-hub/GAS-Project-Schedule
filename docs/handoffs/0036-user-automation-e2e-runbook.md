# Work 0036 User-Controlled Automation E2E Runbook

## Outcome

Perform the first live personal Automation end-to-end qualification for Code
`2.8.21-prepilot` in the existing personal-synthetic Google Workspace target.

This is a continuation of Work ID `0036`. It does not authorize ordinary
personal Inbox processing or broad production use.

Success means one fresh exact synthetic Gmail fixture is processed unattended
through the scheduled Automation path to the governed Task/Review outcome,
followed by a verified Automation disable/trigger-cleanup rollback.

## Authority and starting boundary

User authorization: the user explicitly asked to proceed with the next step on
2026-08-19.

Repository/PR boundary before runtime:

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Branch: `codex/0036-personal-automation-qualification`
- PR: `#51` remains Draft / Open / Unmerged
- Candidate: Code `2.8.21-prepilot`, Schema `2.6`, AI Schema `2.0`, Migration `3`
- Scope: `SYNTHETIC_AUTOMATION_QUALIFICATION_ONLY`
- Automation starting state: `OFF`
- Frozen recovery baseline: Code `2.8.20-prepilot`

The current personal-synthetic Apps Script target already has the Gemini
credential configured. Do not re-enter, rotate, inspect, copy, or expose the
credential.

## Exactly authorized live actions

The user may perform only the following bounded runtime sequence in the existing
personal-synthetic target:

1. Run the menu action `個人用合成Automationを準備` once if candidate metadata
   is not already aligned.
2. Run `個人用合成Automationの準備状態を確認`.
3. Continue only if the top-level status is
   `READY_FOR_CONTROLLED_QUALIFICATION` and Automation is disabled with zero
   owned clock triggers and no stored/canonical trigger residue.
4. Run `自動処理を明示的に有効化` once.
5. Immediately run `自動処理の状態を確認` and continue only if exactly one
   canonical 5-minute clock trigger exists and Automation state is consistent.
6. Create exactly one fresh synthetic Gmail message using the exact fixture
   below and place it in Inbox without `手動/取込` or `手動/除外`.
7. Allow the normal scheduled Automation trigger to execute. Do not manually
   invoke `runScheduledWorker()` or any worker function.
8. Observe the bounded Task/Review and Automation status results.
9. Run `自動処理を停止` once.
10. Run `自動処理の状態を確認` and require Automation disabled, desired state
    disabled, zero owned clock triggers, no stored trigger ID, and no canonical
    trigger present.

No retry, second synthetic message, second enable attempt, alternate target,
manual worker invocation, broad Inbox test, Calendar-specific test, credential
operation, deployment, OAuth/client change, or cleanup mutation is authorized by
this runbook.

## Exact synthetic Gmail fixture

Subject:

```text
[WORK_OS_AUTOMATION_SYNTHETIC_0036]
```

Body, exactly five lines:

```text
WORK_OS_AUTOMATION_SYNTHETIC_BODY_0036
これは架空の自動処理検証メールです。個人情報、機密情報、実在の本番データを含みません。
架空の社内タスクとして、自動処理の動作確認メモを確認してください。
処理日から7日後までに確認してください。
外部提出、法律、税務、規制、契約、入札、その他の高影響なカレンダー予定ではありません。
```

Do not add an attachment. Do not add extra body text or signatures. The message
must be fresh and in Inbox.

## Stop conditions

Stop immediately and do not continue to the next step if any of the following
occurs:

- readiness top-level status is not `READY_FOR_CONTROLLED_QUALIFICATION`;
- readiness reports Setup/version/scope/provider/credential/OAuth/formal-label/
  Calendar/Automation/trigger state as blocked or inconsistent;
- preparation changes anything beyond bounded candidate/version metadata;
- enable is refused, errors, or creates zero, duplicate, non-clock, or
  non-canonical owned triggers;
- Automation is not consistent after enable;
- an unrelated Inbox message appears to be processed;
- more than one synthetic candidate is discovered or processed;
- Gemini is invoked more than once for the qualification fixture;
- the run reports an error, retry/fallback, unexpected Calendar job, or unsafe
  output;
- Task/Review evidence is ambiguous;
- disable fails to make effective running false immediately; or
- any owned scheduled trigger remains after disable.

On a stop condition, do not retry. Preserve Automation OFF if possible and
report only bounded status/error codes and counts; do not paste message IDs,
credential values, account IDs, private URLs, raw provider responses, or other
private data into GitHub or chat.

## PASS conditions

The runtime E2E is PASS only if all of the following are observed:

### Before enable

- readiness: `READY_FOR_CONTROLLED_QUALIFICATION`;
- Code `2.8.21-prepilot` and stored candidate metadata aligned;
- exact synthetic qualification scope/query/body guard active;
- provider/credential/OAuth/formal-label/dedicated-Calendar readiness pass;
- Automation consistent OFF;
- enabled `false`;
- desired enabled `false`;
- owned clock trigger count `0`;
- stored/canonical scheduled-trigger residue absent.

### After enable

- enable succeeds once;
- Automation consistent ON;
- enabled `true`;
- desired enabled `true`;
- exactly one canonical 5-minute clock trigger;
- no duplicate owned trigger.

### Scheduled synthetic processing

- exactly one fresh synthetic candidate handled;
- exactly one real Gemini classification request for that candidate;
- processing completes without retry/fallback/error;
- governed Task/Review output is created or validly updated according to the
  existing authority rules;
- the fixture produces no unexpected high-impact Calendar action;
- ordinary personal Inbox mail remains outside the candidate scope.

### Disable rollback

- disable succeeds once;
- effective running becomes false immediately;
- enabled `false`;
- desired enabled `false`;
- owned clock trigger count `0`;
- stored trigger ID absent;
- canonical trigger absent;
- unrelated triggers are untouched.

## Safe result template for chat/GitHub

Return only bounded, non-sensitive fields similar to the following. Omit any
field that the UI does not provide; never invent values.

```text
Work ID: 0036
readiness_status: <...>
readiness_reasons: <bounded codes only>
preparation_status: <...>
automation_before_enable_status: <...>
enable_status: <...>
enabled_after_enable: <true/false>
desired_enabled_after_enable: <true/false>
clock_trigger_count_after_enable: <number>
canonical_trigger_present_after_enable: <true/false>
candidate_count: <number>
processed_count: <number>
error_count: <number>
created_task_count: <number>
updated_task_count: <number>
review_count: <number>
calendar_job_count: <number>
ai_called: <true/false or count if available>
checkpoint: <...>
disable_status: <...>
enabled_after_disable: <true/false>
desired_enabled_after_disable: <true/false>
clock_trigger_count_after_disable: <number>
stored_trigger_id_present_after_disable: <true/false>
canonical_trigger_present_after_disable: <true/false>
```

## Completion boundary

If the PASS conditions above are met, Work 0036 may be recorded as personal
synthetic Automation E2E PASS. That does not yet authorize broad ordinary
personal Inbox processing. Broad personal-Inbox activation, if desired, is a
separate later outcome and should use a new Work ID because the admitted data
scope materially changes.
