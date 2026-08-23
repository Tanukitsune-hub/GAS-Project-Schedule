# Work 0036 User-Controlled Automation E2E Runbook

## Status

`READY — WAITING FOR EXPLICIT USER ACTION AFTER LIVE AI-SCHEMA REPAIR`

This runbook controls the remaining user-operated live qualification for Code
`2.8.21-prepilot` in the existing personal-synthetic Google Workspace target.
It does not authorize ordinary personal Inbox processing, broad production use,
or company-environment deployment.

The first scheduled Work 0036 exact synthetic candidate reached the real Gemini
boundary but failed at strict canonical AI Schema 2.0 validation with bounded
`AI_RESPONSE / E_AI_SCHEMA` evidence. The candidate became `DEAD`, was not
retried, and produced no Task/Review/Calendar output. The user then explicitly
disabled Automation and verified consistent OFF with zero clock triggers and no
stored/canonical trigger residue.

The subsequent repair is recorded in:

- `docs/handoffs/0036-live-ai-schema-failure-fix-instruction.md`
- `docs/handoffs/0036-live-ai-schema-failure-fix-addendum.md`
- `docs/handoffs/0036-live-ai-schema-failure-fix-report.md`

The repair preserves strict canonical validation, one Gemini call, no provider
retry/fallback, exact synthetic-only scope, and privacy-safe logging. The Gemini
semantic contract was hardened and future schema failures can expose only a
bounded allowlisted `canonical_schema_rule` token, never provider text or email
content. The repaired Phase 8C source was placed once on the same target and an
independent pull-back reached exact parity. Automation remains OFF.

## Outcome

Success requires one **fresh** exact Work 0036 synthetic Gmail fixture to be
processed unattended by the scheduled Automation path, followed by a verified
Automation disable/trigger-cleanup rollback.

The historical failed candidate and its Dead Letter must not be retried. The
old failed Gmail message does not need to be deleted or modified; its Message
State is already known and the automatic scan excludes known message IDs from
fresh discovery.

## Authorized sequence

Proceed one checkpoint at a time. Stop immediately on any unexpected state.

1. With Automation still OFF, run `個人用合成Automationの準備状態を確認`.
   - Required result: `READY_FOR_CONTROLLED_QUALIFICATION`.
   - Required Automation state: enabled false, desired false, zero clock
     triggers, no stored/canonical trigger residue.
   - Do not continue from `BLOCKED` or any inconsistent trigger state.

2. Run `自動処理を明示的に有効化` exactly once and confirm.
   Then run `自動処理の状態を確認`.
   - Required result: `CONSISTENT`.
   - enabled true / desired true.
   - exactly one clock trigger and one canonical trigger.
   - duplicate trigger count zero.

3. Only after step 2 passes, create exactly one **fresh** Gmail message in the
   same personal-synthetic Inbox.

   Exact subject:

   `[WORK_OS_AUTOMATION_SYNTHETIC_0036]`

   Exact body, five lines only:

   `WORK_OS_AUTOMATION_SYNTHETIC_BODY_0036`

   `これは架空の自動処理検証メールです。個人情報、機密情報、実在の本番データを含みません。`

   `架空の社内タスクとして、自動処理の動作確認メモを確認してください。`

   `処理日から7日後までに確認してください。`

   `外部提出、法律、税務、規制、契約、入札、その他の高影響なカレンダー予定ではありません。`

   Requirements:
   - one message only;
   - no attachment;
   - no signature, greeting, extra text, or extra blank content;
   - do not add `手動/除外`;
   - leave it in Inbox;
   - do not invoke `runScheduledWorker()` or another worker function manually.

4. Wait for the normal 5-minute scheduled trigger. Do not manually accelerate
   processing.

5. Inspect bounded product evidence only after the scheduled run.
   Expected successful run evidence:
   - trigger type `TIME_DRIVEN`;
   - mode `AUTO_PHASE6`;
   - fresh candidate count 1;
   - error count 0;
   - one processed exact synthetic message;
   - one governed new Task outcome for the internal confirmation action;
   - no duplicate Task/Review side effect;
   - Gemini is called once for that candidate;
   - no high-impact Calendar classification for the exact fixture.

   If the run fails, stop. Do not create a second message, retry the Dead Letter,
   rerun a worker manually, or re-enable after disabling. Record only bounded
   non-sensitive status/count/error-code fields. If an `E_AI_SCHEMA` recurs,
   include the allowlisted `AI_SCHEMA_RULE=...` / `canonical_schema_rule` token
   when present, but never provider output or message content.

6. After the successful run evidence is captured, explicitly run
   `自動処理を停止` exactly once and then `自動処理の状態を確認`.
   Required rollback:
   - status `CONSISTENT`;
   - enabled false;
   - desired false;
   - trigger count 0;
   - clock trigger count 0;
   - stored trigger ID absent;
   - canonical trigger absent;
   - duplicate trigger count 0.

7. Confirm no subsequent scheduled Automation processing can continue after
   disable. The PR remains Draft/Open/Unmerged until ChatGPT reviews the full
   successful run and rollback evidence.

## Explicit non-goals

This runbook does not authorize:

- ordinary personal Inbox mail;
- historical failed-candidate or Dead Letter retry;
- a second fresh synthetic message after any failure;
- manual worker invocation;
- Calendar-specific testing or cleanup beyond observing bounded outcome state;
- credential inspection/change;
- OAuth/client/deployment changes;
- alternate targets/accounts;
- PR merge.
