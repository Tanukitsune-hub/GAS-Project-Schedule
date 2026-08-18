# Work 0020 — Controlled Synthetic Mock Vertical Validation

## Outcome

Prove the next product-real synthetic step against the exact personal-synthetic Work OS target by processing only the already-PREPROCESSED Work 0019 synthetic message through deterministic Mock AI classification and Task upsert.

Target path:

`existing PREPROCESSED Work 0019 message -> bounded Gmail refetch/hash check -> deterministic Mock AI -> one Task upsert -> closed Message checkpoint`

This Work intentionally does not create another Gmail message and does not rerun manual import. It stops before human Review/edit validation, deliberate Calendar behavior, Dashboard, production AI, or Automation.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Parent Work: `0019`
- Starting commit: `85c4e242d57c08cd0d71240f44f73692419d0e95`
- Parent report: `docs/handoffs/0019-report.md`
- Exact target: same existing personal-synthetic Spreadsheet / bound Apps Script target used since Work 0010.
- Candidate: Code `2.8.14-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`.
- `TEST_MODE=true`.
- Automation remains OFF.
- External/production AI remains disabled.
- Work 0019 final report-head CI: SUCCESS.
- Work 0019 left exactly one fresh synthetic message at durable `PREPROCESSED`, next operation `CLASSIFY`.

## Relevant product contract

The Work 0019 message subject begins with `[MOCK:NEW_HIGH]`.

For this fixture the deterministic `MockAiAdapter` returns exactly one new Task with materially equivalent values:

- action: `NEW_TASK`;
- title: `架空資料の提出`;
- due date: runtime `today + 7 days`;
- priority: `HIGH`;
- confidence: `0.96`;
- Calendar category: `NONE`;
- Calendar importance: `LOW`.

No external AI/network request is needed or authorized.

The Mock vertical may re-fetch the exact Gmail content because message bodies are intentionally not persisted in durable state. That bounded Gmail refetch is authorized only to reproduce preprocessing/hash evidence before classification. It must not broaden to any other Gmail message.

Because the fixture carries no Calendar intent, the expected Calendar job/event count is zero and the Calendar API should not be called.

## Authorized user sequence

### A. Do not create or relabel Gmail input

- Do not create another test email.
- Do not rerun `手動/取込を1件前処理`.
- Do not modify the Work 0019 Gmail message or its label.
- Do not modify/revive/delete Work 0015 or Work 0017 failed states/messages.

### B. Run deterministic Mock vertical exactly once

1. Open the exact existing personal-synthetic Work OS Spreadsheet.
2. Choose `業務OS v2` -> `Phase 3/4 Mock縦フローを1件処理` exactly once.
3. Read the confirmation and continue once.
4. The action may select at most one eligible PREPROCESSED message.
5. Bounded Gmail re-fetch of that exact message is authorized for content-hash verification.
6. The only authorized AI adapter is the local deterministic `MockAiAdapter`.
7. No external HTTP or production AI Provider request is authorized.
8. Task state may be mutated only as required to create the single deterministic synthetic Task and durable Message checkpoint.
9. No deliberate Calendar operation is authorized; expected Calendar job/event count is zero.

## PASS requirements

PASS requires materially equivalent safe facts:

- invocation count: exactly `1`;
- `status=COMPLETE` or equivalent closed success;
- candidate/eligible message count: exactly `1`;
- processed count: exactly `1`;
- created Task count: exactly `1`;
- updated existing Task count: `0`;
- error count: `0`;
- deterministic Mock adapter used;
- external/production AI request count: `0`;
- bounded Gmail re-fetch, if reported, remains within its displayed call limit;
- Calendar job count: `0`;
- Calendar API/event mutation: `0`;
- durable Message state reaches `DONE` or materially equivalent closed checkpoint;
- Automation remains OFF.

After the menu result succeeds, open `タスク一覧` read-only and confirm one new Task with materially equivalent values:

- title `架空資料の提出`;
- due date seven days after the runtime processing date;
- priority HIGH / `高`.

Do not edit or otherwise mutate the Task in Work 0020.

Highest permitted success status:

`READY_FOR_CONTROLLED_SYNTHETIC_HUMAN_REVIEW_VALIDATION`

## Stop conditions

Stop without workaround or retry if:

- zero or more than one PREPROCESSED candidate is reported;
- selected content is not the existing Work 0019 synthetic message;
- Gmail content re-fetch/hash verification fails;
- `E_GMAIL_BODY_DECODE` recurs;
- external/production AI or unrelated network access occurs;
- Task creation count is not exactly one;
- an existing Task is unexpectedly updated;
- Calendar job/event/API activity is non-zero;
- any raw exception, authorization loop, identity ambiguity, private-data exposure, or unintended real-data access occurs;
- a second Mock-vertical invocation would be required.

Do not rerun the menu action under this Work ID.

## Explicit non-goals / not authorized

- no new Gmail test message;
- no manual-import rerun;
- no normal Inbox worker/bulk Gmail processing;
- no real/non-synthetic Gmail processing;
- no production/external AI Provider call or configuration;
- no human Review accept/reject/restage;
- no Task manual edit or edit-trigger validation;
- no deliberate Calendar create/update/delete/no-op test;
- no manual Calendar sync;
- no Dashboard refresh;
- no Quick/Deep Diagnostic;
- no Setup/Continue Setup;
- no retry/DLQ operation;
- no Automation enablement or time-driven trigger;
- no clasp/source mutation;
- no new Spreadsheet/Apps Script target;
- no company/production resource or real-data workflow;
- no cleanup/deletion, merge, release-to-production, or pilot activation.

## Evidence and Git requirements

After the user reports the safe result and visible Task confirmation, ChatGPT owns the GitHub record:

- create `docs/handoffs/0020-report.md` with privacy-safe closed evidence only;
- do not store Gmail Message/Thread IDs, run IDs, addresses, account identity, source URLs, raw body/MIME, Task IDs, Calendar IDs, OAuth values, or detailed raw Google responses;
- update the Draft PR with result/final commit;
- keep the PR Draft/Open/Unmerged;
- check final report-head CI;
- if a new product/runtime defect appears, stop and create a separate Work ID rather than broadening this Work.
