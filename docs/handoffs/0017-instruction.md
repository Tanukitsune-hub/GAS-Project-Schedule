# Work 0017 — Controlled Gmail Decode Retest → Mock Task E2E

## Outcome

Validate the Gmail body-decode repair delivered and placed in Work 0016, then—only if that repair passes in real Apps Script runtime—complete the previously blocked fully synthetic product path:

`fresh synthetic Gmail message -> manual import/preprocess -> PREPROCESSED -> deterministic Mock AI -> one Task upsert`

This Work is user-assisted and GitHub-recorded. It requires no Codex implementation unless the runtime exposes a new defect.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Parent Work: `0016`
- Parent final commit: `5270d3095e1e1af46fc4f6c8f6ff22ebe8386f75`
- Exact source already placed on the existing personal-synthetic Apps Script target in Work 0016.
- Candidate: Code `2.8.13-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`.
- `TEST_MODE=true`.
- Automation remains OFF.
- External/production AI remains disabled.
- Work 0016 final-head CI: SUCCESS.
- Work 0016 guarded push: exactly one PASS; pull-back exact byte/hash parity: PASS.

## Prior failed synthetic message

The Work 0015 synthetic message failed with non-retryable `E_GMAIL_BODY_DECODE` before PREPROCESSED. Under the Message State contract that failure is DEAD and is normally suppressed from new manual-import candidates.

Therefore Work 0017 MUST NOT retry, relabel, edit, delete, or otherwise manipulate the Work 0015 failed message or its Message State / Dead Letter record. Use one fresh synthetic message instead. This keeps the decoder retest independent and preserves the Work 0015 failure evidence.

## Authorized user sequence

### A. Create one fresh synthetic Gmail message

Using the same personal Google principal:

1. Send exactly one new email to yourself.
2. Exact subject:
   `[MOCK:NEW_HIGH] Work OS Synthetic E2E 0017`
3. Body must be short and fully synthetic. Recommended exact body:
   `ダミーメール0017`
4. No attachment, link, real name, real deadline, confidential/private content, company data, credentials, or production information.
5. Apply `手動/取込` only to this new message/thread.
6. Do not apply `手動/除外`.
7. Do not modify labels on the old Work 0015 message.

### B. Gmail manual import / decoder retest — exactly once

1. Open the existing personal-synthetic Work OS Spreadsheet.
2. Choose `業務OS v2` -> `手動/取込を1件前処理` exactly once.
3. Confirm once.
4. No second manual-import invocation is authorized in Work 0017.

PASS for step B requires the safe result to establish all materially equivalent facts:

- `status=COMPLETE`;
- `candidate_count=1`;
- `processed_count=1`;
- `error_count=0`;
- checkpoint `PREPROCESSED`;
- next operation `CLASSIFY`;
- Gmail Advanced Service may be called within its configured bounded call limit;
- AI remains `NOT_CALLED` in this step;
- Calendar remains `NOT_CALLED` in this step;
- no `E_GMAIL_BODY_DECODE` or other error;
- the selected message is clearly the fresh Work 0017 synthetic message, not real data.

If step B does not PASS, STOP. Do not retry, do not run Mock vertical, and do not attempt a workaround under this Work ID.

### C. Deterministic Mock vertical — exactly once, conditional on B PASS

Only after step B PASS:

1. Choose `業務OS v2` -> `Phase 3/4 Mock縦フローを1件処理` exactly once.
2. Confirm once.
3. The only authorized AI adapter is the deterministic local Mock adapter. No external HTTP/real AI request is authorized.
4. Do not invoke this action a second time.

The `[MOCK:NEW_HIGH]` fixture is expected to produce:

- exactly one processed Message;
- exactly one new Task;
- Task title `架空資料の提出`;
- explicit due date seven calendar days after runtime `today`;
- priority HIGH / `高`;
- no intended Calendar job/event because the fixture retains Calendar category `NONE` and importance `LOW`;
- external AI/network not called.

Expected safe result materially equivalent to:

- `status=COMPLETE`;
- `candidate_count=1`;
- `processed_count=1`;
- `created_task_count=1`;
- `updated_task_count=0`;
- `error_count=0`;
- Mock-only AI path / no network;
- Calendar job count `0`.

Any unexpected Calendar event mutation is a stop/result requiring later review. Do not clean it up under Work 0017.

### D. Visible Task confirmation — read only

After C succeeds, open `タスク一覧` and confirm without editing that the new Work 0017 synthetic Task is visible with:

- title `架空資料の提出`;
- due date seven days after processing date;
- priority HIGH / `高`.

Do not edit, accept/reject, complete, exclude, restage, or otherwise mutate the Task in Work 0017.

## Acceptance

PASS requires:

- one fresh Work 0017 synthetic Gmail message only;
- old Work 0015 failed message untouched;
- exactly one manual-import invocation;
- real Apps Script Gmail body decode succeeds and reaches PREPROCESSED;
- exactly one Mock-vertical invocation after decoder PASS;
- deterministic Mock adapter only, no external AI/network;
- exactly one new expected synthetic Task and zero unintended Task updates;
- visible Task materially matches the fixture;
- expected Calendar job/event count is zero;
- Automation remains OFF;
- no company/production/real data is processed.

Highest permitted success status:

`READY_FOR_CONTROLLED_SYNTHETIC_HUMAN_REVIEW_VALIDATION`

## Stop conditions

Stop immediately without retry/workaround if:

- manual import selects zero or more than one candidate;
- selected content is not clearly the fresh Work 0017 synthetic message;
- `E_GMAIL_BODY_DECODE` recurs or any other manual-import failure occurs;
- PREPROCESSED is not reached;
- external AI/network is called;
- Mock vertical reports zero or more than one processed candidate;
- Task creation count is not exactly one;
- an existing Task is unexpectedly modified;
- expected synthetic Task is absent;
- Calendar is unexpectedly mutated;
- account/target ambiguity, raw exception, privacy exposure, or authorization loop occurs.

## Explicit non-goals / not authorized

- no reuse/manual retry of Work 0015 DEAD message;
- no Dead Letter manual retry;
- no normal Inbox/automatic worker;
- no real/non-synthetic Gmail processing;
- no human Review accept/reject/restage;
- no Task manual edit/edit-trigger test;
- no deliberate Calendar create/update/delete test;
- no Dashboard refresh;
- no Quick/Deep Diagnostic or test harness;
- no Setup/Continue Setup;
- no external/production AI Provider;
- no Automation enablement or 5-minute trigger;
- no retry/DLQ acceptance test;
- no clasp/source push/pull or source mutation;
- no new Spreadsheet/Apps Script target;
- no company/production resource;
- no cleanup deletion;
- no merge/release/pilot activation.

## Evidence and Git requirements

After the user reports the safe results, ChatGPT owns the GitHub record:

- create `docs/handoffs/0017-report.md` with privacy-safe closed evidence only;
- do not store Gmail IDs, addresses, account identity, URLs, body text, Task IDs, Calendar IDs, OAuth values, or raw provider responses;
- update the Draft PR with final status and commit;
- keep PR Draft/Open/Unmerged;
- if any runtime/product defect appears, create a separate residual Work rather than expanding scope silently.
