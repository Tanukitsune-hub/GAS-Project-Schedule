# Work 0017 — Controlled Gmail Decode Retest → Mock Task E2E

## Outcome

Prove the repaired `2.8.13-prepilot` Gmail body decode boundary in the exact existing personal-synthetic Work OS target, then—only after the repaired manual-import step succeeds—complete the originally intended synthetic vertical path through deterministic Mock AI and one Task creation.

Target path:

`fresh synthetic Gmail message -> manual import/body decode -> PREPROCESSED -> deterministic Mock AI -> Task upsert`

This Work is user-assisted and GitHub-recorded. No Codex implementation is required unless a new product defect appears.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Parent Work: `0016`
- Starting commit: `5270d3095e1e1af46fc4f6c8f6ff22ebe8386f75`
- Parent report: `docs/handoffs/0016-report.md`
- Exact target: the same existing personal-synthetic bound Spreadsheet / Apps Script target used since Work 0010 and updated exactly once with the repaired Work 0016 source.
- Candidate: Code `2.8.13-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`.
- `TEST_MODE=true`.
- Automation remains OFF.
- External/production AI remains disabled.
- Work 0016 final report-head CI: SUCCESS.
- Work 0016 push/pull parity: PASS.

## Relevant prior state

Work 0015 used one synthetic Gmail message and failed at `E_GMAIL_BODY_DECODE` before PREPROCESSED. That failure is non-retryable and therefore the prior Message State is expected to be `DEAD`. The worker suppresses `DEAD` Message IDs from ordinary manual-import candidate processing, and the Dead Letter retry menu rejects unresolved non-retryable failures.

Therefore Work 0017 MUST NOT attempt to revive, edit, relabel for retry, delete, or manually alter the Work 0015 failed Message State / Dead Letter row. The old synthetic Gmail message may remain labelled; it is expected to be suppressed by the existing durable state.

Use one newly created synthetic Gmail message for the repaired runtime proof.

## Authorized user sequence

### A. Create exactly one fresh synthetic Gmail message

1. Using the same personal Google principal, send exactly one new email to yourself.
2. Use exactly this subject:
   `[MOCK:NEW_HIGH] Work OS Synthetic E2E 0017`
3. Use only non-sensitive synthetic body text, for example:
   `これは Work OS Synthetic E2E 0017 の架空テストメールです。実データ・個人情報・機密情報は含みません。`
4. Do not add attachments, links, real names, real deadlines, private data, or company/production content.
5. Apply the current Gmail label `手動/取込` only to this new Work 0017 message/thread.
6. Do not apply `手動/除外`.
7. Do not modify the old Work 0015 test message or its labels during this Work.

### B. Repaired Gmail manual import / body decode — exactly once

1. Open the exact existing personal-synthetic Work OS Spreadsheet.
2. Choose `業務OS v2` -> `手動/取込を1件前処理` exactly once.
3. Read the confirmation and continue once.
4. This action may make bounded Gmail Advanced Service reads and may write only the designed sandbox Message State / run-history checkpoint state.
5. It must not call AI or Calendar or create/update a Task in this step.

PASS for step B requires materially equivalent visible safe facts:

- `status=COMPLETE`;
- `candidate_count=1`;
- `processed_count=1`;
- `skipped_count=0`;
- `error_count=0`;
- `checkpoint=PREPROCESSED`;
- `next_operation=CLASSIFY`;
- Gmail API calls stay within the displayed bounded limit;
- AI is `NOT_CALLED`;
- Calendar is `NOT_CALLED`;
- no unexpected real message was selected.

The exact `run_id`, Gmail IDs, account address, source URL, or raw payload must not be copied into GitHub evidence.

If step B is not a closed PASS, STOP. Do not repeat manual import and do not run the Mock vertical in this Work.

### C. Deterministic Mock vertical — exactly once, only after B passes

1. Choose `業務OS v2` -> `Phase 3/4 Mock縦フローを1件処理` exactly once.
2. Read the confirmation and continue once.
3. The function may process at most one eligible PREPROCESSED Message.
4. Re-fetch of the exact selected synthetic Gmail content is authorized because the durable state intentionally does not persist message bodies. The refetched content hash must match the PREPROCESSED checkpoint before classification proceeds.
5. The only authorized AI adapter is the deterministic local `MockAiAdapter`; no external HTTP or real AI request is authorized.
6. The `[MOCK:NEW_HIGH]` fixture deterministically returns one `NEW_TASK` titled `架空資料の提出`, explicit due date seven days after runtime `today`, priority HIGH, confidence 0.96, and Calendar attributes `NONE` / `LOW`.
7. Because this fixture has no Calendar intent, expected Calendar job count is zero. If a Calendar API/event mutation occurs, record the unexpected result and STOP after this invocation.

Expected materially equivalent safe result:

- `status=COMPLETE`;
- `candidate_count=1`;
- `processed_count=1`;
- `created_task_count=1`;
- `updated_task_count=0`;
- `error_count=0`;
- deterministic Mock adapter only / no external AI network request;
- bounded Gmail re-fetch is allowed and may be reported as Gmail called;
- `calendar_job_count=0`;
- Calendar external service is not called;
- final checkpoint is closed/successful (for example DONE or equivalent).

Do not invoke the Mock vertical a second time in Work 0017.

### D. Visible Task confirmation — read only

After C succeeds, open `タスク一覧` and confirm without editing that one new synthetic Work 0017 Task is visible with materially equivalent values:

- title: `架空資料の提出`;
- due date: seven days after the runtime processing date;
- priority: HIGH / `高`;
- row is newly created by this Work.

The prior Work 0015 failure created no Task, so this should be the first Task produced by the Gmail-to-Mock vertical acceptance path. Do not edit, complete, exclude, restage, accept/reject, or otherwise mutate the Task in this Work.

## Acceptance

PASS requires all of the following:

- one and only one fresh Work 0017 synthetic Gmail message was created and labelled `手動/取込`;
- old Work 0015 failed state/message was not manually repaired or deleted;
- repaired manual import was invoked exactly once and reached PREPROCESSED with zero errors;
- the former `E_GMAIL_BODY_DECODE` did not recur;
- Mock vertical was invoked exactly once only after manual import PASS;
- exactly one eligible synthetic message was processed;
- Mock AI only; no external AI/network request;
- exactly one new Task was created and no existing Task was unintentionally changed;
- visible Task matches the deterministic `[MOCK:NEW_HIGH]` fixture materially;
- Calendar job count is zero and no Calendar event mutation occurred;
- Automation remains OFF;
- no real/company data was processed;
- no prohibited operation was attempted.

Highest permitted success status:

`READY_FOR_CONTROLLED_SYNTHETIC_HUMAN_REVIEW_VALIDATION`

## Stop conditions

Stop without workaround or retry if:

- manual import reports zero or more than one candidate;
- selected content is not the new Work 0017 synthetic message;
- `E_GMAIL_BODY_DECODE` recurs;
- manual import fails to reach PREPROCESSED;
- manual import reports AI or Calendar use;
- Mock vertical reports zero or more than one processed candidate;
- external/production AI is called;
- Task creation count is not exactly one;
- an unintended existing Task changes;
- the visible synthetic Task is absent or materially differs from the deterministic fixture;
- Calendar API/event mutation occurs;
- any raw exception, auth loop, identity ambiguity, or private-data exposure occurs;
- a second manual-import or Mock-vertical invocation would be needed.

Do not broaden scope or clean up effects under this Work ID.

## Explicit non-goals / not authorized

- no retry or mutation of the Work 0015 DEAD Message State / Dead Letter;
- no cleanup/deletion of Work 0015 or Work 0017 Gmail messages;
- no real/non-synthetic Gmail processing;
- no bulk Gmail processing or normal Inbox worker;
- no `手動/除外` behavior test;
- no human Review accept/reject/restage;
- no Task manual edit or edit-trigger acceptance;
- no deliberate Calendar create/update/delete/no-op test;
- no Dashboard refresh;
- no Quick or Deep Diagnostic unless a new failure is explicitly triaged into a later Work;
- no Setup/Continue Setup;
- no external/production AI Provider call or configuration;
- no Automation enablement or 5-minute worker trigger;
- no clasp push/pull/source mutation;
- no new Spreadsheet/Apps Script target;
- no company/production resource or real-data workflow;
- no merge, release-to-production, or pilot activation.

## Evidence and Git requirements

After the user reports the safe results from B and C plus visible Task confirmation, ChatGPT owns the GitHub record:

- create `docs/handoffs/0017-report.md` with privacy-safe closed evidence only;
- do not store Gmail Message/Thread IDs, run IDs, email addresses, account identity, URLs, raw message text, Task IDs, Calendar IDs, OAuth values, or detailed raw Google payloads;
- update the Draft PR with result/final commit;
- keep the PR Draft/Open/Unmerged;
- final report-head CI must be checked;
- if a new product defect appears, stop and create a separate residual Work ID rather than silently expanding scope.
