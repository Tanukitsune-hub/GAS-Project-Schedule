# Work 0015 — Controlled Synthetic Gmail → Mock AI → Task E2E

## Outcome

Prove one product-real, fully synthetic vertical path in the exact personal sandbox that completed Work 0014:

`fresh synthetic Gmail message -> manual import/preprocess -> PREPROCESSED checkpoint -> deterministic Mock AI classification -> Task upsert`

This Work deliberately stops before human Review/Edit validation, explicit Calendar event behavior, external AI, or Automation. It is user-assisted and GitHub-recorded; no Codex implementation is required unless the runtime exposes a product defect.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Parent Work: `0014`
- Starting commit: `8a2513d7559ac6165176dc88b46d4ab2e6565c8f`
- Exact target: the same personal-synthetic Spreadsheet created in Work 0010, Setup-completed in Work 0013, and post-Setup diagnosed in Work 0014.
- Work 0014 final report-head CI: PASS.
- Product candidate remains Code `2.8.12-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`.
- `TEST_MODE=true`; Automation OFF; external/production AI disabled.
- Current Setup-created Gmail labels and dedicated Calendar are the current sandbox resources.

## Why this Work exists

The repository's controlled trial order calls for exact synthetic Gmail selection/PREPROCESSED checkpoint first, then deterministic Mock classification and Task upsert. The menu action `Phase 3/4 Mock縦フローを1件処理` does not itself create a PREPROCESSED Message, so the preceding manual-import product path is required.

The deterministic Mock adapter selects its fixture only from a leading subject marker. For `[MOCK:NEW_HIGH]`, it deterministically returns one new Task titled `架空資料の提出`, with an explicit deadline seven days after the runtime `today`, priority HIGH, confidence 0.96, no external AI request, and default Calendar attributes `NONE` / `LOW`.

Therefore the expected Work 0015 outcome is one Task creation and zero intended Calendar jobs/events. Calendar behavior will be validated separately under a later Work ID.

## Authorized user sequence

### A. Create exactly one synthetic Gmail message

1. Using the same personal Google principal, send exactly one email to yourself.
2. Use exactly this subject:
   `[MOCK:NEW_HIGH] Work OS Synthetic E2E 0015`
3. Use only non-sensitive synthetic body text, for example:
   `これは Work OS Synthetic E2E 0015 の架空テストメールです。実データ・個人情報・機密情報は含みません。`
4. Do not add an attachment, link, real name, real deadline, private data, or production/company content.
5. On the newly created test message/thread only, apply the current Gmail label `手動/取込`.
6. Do not apply `手動/除外`.
7. Do not apply the Work OS labels to any other message in this Work.

### B. Manual import/preprocess — exactly once

1. Open the exact Work 0010 sandbox Spreadsheet.
2. Choose `業務OS v2` -> `手動/取込を1件前処理` exactly once.
3. Read the confirmation and continue once.
4. The action may use bounded Gmail API reads for the single labelled synthetic message and may write only the designed sandbox Message State / run-history checkpoint state.
5. It must not create/update a Task, call AI, or mutate Calendar in this step.

Proceed to C only if the visible safe result establishes all materially equivalent facts:

- exactly one candidate was selected;
- exactly one message was processed;
- error count is zero;
- checkpoint/state reached `PREPROCESSED` or equivalent closed success;
- next operation is classification / `CLASSIFY` or equivalent;
- no unexpected real message was selected.

If those facts are not established, stop. Do not repeat manual import under Work 0015.

### C. Deterministic Mock vertical — exactly once

1. Choose `業務OS v2` -> `Phase 3/4 Mock縦フローを1件処理` exactly once.
2. Read the confirmation and continue once.
3. The function may process at most one PREPROCESSED Message.
4. The only AI adapter authorized is the deterministic local `MockAiAdapter`; no external HTTP/real AI request is authorized.
5. The existing function has a maximum of one dedicated-Calendar job dispatch. For this exact `[MOCK:NEW_HIGH]` fixture, zero Calendar jobs/events are expected because the fixture's Calendar category/importance remain `NONE` / `LOW`. If a Calendar event is unexpectedly created/updated/deleted, record it as an unexpected result and stop after this invocation; do not retry or clean it up in this Work.

Expected safe result:

- candidate count: 1;
- processed count: 1;
- created Task count: 1;
- updated Task count: 0;
- error count: 0;
- AI path: Mock-only / no network;
- Gmail not called by the classification/upsert phase;
- expected Calendar job count: 0.

Do not invoke this menu action a second time in Work 0015.

### D. Visible Task confirmation — read only

After C succeeds, open `タスク一覧` and confirm without editing that one new synthetic Task is visible with materially equivalent values:

- task title: `架空資料の提出`;
- due date: seven days after the runtime processing date;
- priority: HIGH / `高`;
- the row is clearly the synthetic Work 0015 result.

Do not edit, accept/reject, complete, exclude, or otherwise mutate the Task in this Work.

## Acceptance

PASS requires all of the following:

- exactly one newly created synthetic Gmail message was used;
- only that message/thread received `手動/取込`;
- manual import was invoked once and reached PREPROCESSED with zero errors;
- Mock vertical was invoked once and processed exactly one candidate;
- deterministic Mock AI was used and no external AI/network request occurred;
- exactly one new Task was created and no existing Task was unintentionally changed;
- the visible Task matches the deterministic `[MOCK:NEW_HIGH]` fixture materially as described above;
- expected Calendar job/event count is zero; any unexpected Calendar mutation is a stop/result requiring review;
- Automation remains OFF;
- no prohibited real/company data was accessed or processed.

Highest permitted success status:

`READY_FOR_CONTROLLED_SYNTHETIC_HUMAN_REVIEW_VALIDATION`

## Stop conditions

Stop without workaround or retry if:

- more than one Gmail candidate is selected;
- the selected message is not the newly created synthetic Work 0015 message;
- manual import errors or fails to establish PREPROCESSED;
- external AI/network is called;
- Mock vertical reports zero or more than one processed candidate;
- Task creation count is not exactly one, an unintended existing Task changes, or the expected visible synthetic Task is absent;
- a Calendar event mutation unexpectedly occurs;
- any raw exception, authorization loop, identity ambiguity, or real/private-data exposure occurs;
- a second manual-import or Mock-vertical invocation would be needed.

Do not broaden scope or clean up runtime effects under this Work ID.

## Explicit non-goals / not authorized

- no real/non-synthetic Gmail message processing;
- no bulk Gmail processing or normal Inbox worker;
- no `手動/除外` behavior test;
- no human Review accept/reject/restage;
- no Task manual edit or edit-trigger acceptance;
- no deliberate Calendar create/update/delete/no-op test;
- no Dashboard refresh;
- no Deep Diagnostic or Phase acceptance-test menu actions;
- no Setup/Continue Setup;
- no external/production AI Provider call or configuration;
- no Automation enablement or 5-minute worker trigger;
- no retry/DLQ test;
- no clasp/source mutation;
- no company/production resource or real-data workflow;
- no cleanup deletion, merge, release, or pilot activation.

## Evidence and Git requirements

After the user reports the two safe menu results and visible Task confirmation, ChatGPT owns the GitHub record:

- create `docs/handoffs/0015-report.md` with privacy-safe closed evidence only;
- do not store Gmail Message/Thread IDs, email address, account identity, URLs, source-email links, raw message body, Task IDs, Calendar IDs, OAuth values, or detailed raw JSON;
- update the Draft PR with result/final commit;
- keep the PR Draft/Open/Unmerged;
- if a runtime/product defect appears, create a separate residual Codex handoff rather than silently expanding Work 0015.
