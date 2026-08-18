# Work 0025 — Controlled Synthetic Calendar UPDATE Validation

## Outcome

Prove that an existing managed deadline event is updated in place when the authoritative synthetic Task due date changes, without creating a duplicate Calendar event.

Target path:

`existing managed Calendar event -> one Task due-date edit -> canonical installable edit Trigger -> one UPDATE Outbox -> one explicit Calendar sync -> same managed event moved to new date`

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Parent Work: `0024`
- Starting commit: `97d7140e51736565a9204407bc73ce1e5cd20eac`
- Parent report: `docs/handoffs/0024-report.md`
- Exact target: same existing personal-synthetic Spreadsheet / bound Apps Script target used since Work 0010.
- Candidate: Code `2.8.14-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`.
- TEST_MODE=true; Automation OFF; external/production AI disabled.
- Existing due Task: `架空資料の提出`.
- Current due date: `2026-08-18`.
- Current Calendar登録: `登録`.
- One managed all-day event `【期限】架空資料の提出` exists on `2026-08-18` in dedicated Calendar `自動期日管理`.

## Authorized user sequence

### A. Change only the due date

1. In `タスク一覧`, uniquely locate the existing Task `架空資料の提出`.
2. Change only `期限` from `2026/08/18` to `2026/08/19` exactly once.
3. Do not edit Calendar登録, status, priority, comment, completion, Review, title, or any other cell.
4. Do not use manual fallback.
5. Allow the owner installable edit Trigger to complete; refresh once if needed.
6. Stop before invoking Calendar sync.

### B. Pre-sync read-only gate

ChatGPT must independently read the exact Spreadsheet before authorizing Calendar API mutation.

PASS requires:

- `架空資料の提出` due=`2026-08-19`;
- Calendar登録 remains `登録`;
- Task Calendar status is `PENDING` or equivalent pending-update state;
- hidden `同期状態` contains exactly one actionable row for this Task;
- desired action is `UPDATE`;
- no unrelated PENDING/RETRY Calendar job exists.

If this gate fails, STOP. Do not invoke Calendar sync.

### C. One Calendar UPDATE

Only after ChatGPT gives explicit GO:

1. Invoke `業務OS v2` -> `Calendar同期を1件処理` exactly once.
2. Do not invoke it a second time under this Work ID.

PASS requires materially equivalent safe evidence:

- status COMPLETE;
- candidate_count 1;
- processed_count 1;
- error_count 0;
- action UPDATE;
- Gmail NOT_CALLED;
- AI NOT_CALLED;
- Calendar ADVANCED_CALENDAR_SERVICE.

### D. Read-only Calendar verification

ChatGPT independently verifies the dedicated secondary Calendar.

PASS requires:

- exactly one matching managed event `【期限】架空資料の提出` exists on `2026-08-19`;
- no matching event remains on `2026-08-18`;
- no duplicate matching event exists in the bounded `2026-08-18` through `2026-08-20` window;
- only the managed event was changed.

## Acceptance

PASS requires the full UPDATE lifecycle above and no unrelated mutation.

Highest permitted success status:

`READY_FOR_CONTROLLED_SYNTHETIC_CALENDAR_DELETE_VALIDATION`

## Stop conditions

Stop without retry/workaround if the Task cannot be uniquely identified; another field changes; the due date is not `2026-08-19`; Outbox is absent, duplicated, unrelated, or not UPDATE; Calendar API reports error; a second sync would be required; the old event remains after a successful-looking update; a duplicate event appears; or any private/raw identity issue occurs.

## Non-goals / not authorized

No DELETE test; no completion/exclusion/cancellation edit; no Gmail worker; no AI classification; no Review action; no manual fallback; no Dashboard/diagnostics/Setup; no Automation enablement; no trigger mutation; no source/clasp mutation; no new target; no cleanup; no company/production data; no merge/release/pilot activation.

## Evidence / Git requirements

After user reports the bounded sync result, ChatGPT records `docs/handoffs/0025-report.md`, updates the Draft PR, keeps it Draft/Open/Unmerged, and checks final report-head CI. Store no account identity, Calendar/Event/Task/Gmail IDs, URLs, OAuth values, run IDs, or raw Google payloads.
