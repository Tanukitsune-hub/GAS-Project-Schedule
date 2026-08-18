# Work 0026 — Controlled Synthetic Calendar DELETE Validation

## Outcome

Prove the terminal Calendar lifecycle path for the exact existing synthetic Task/event after Work 0025 successfully moved the managed event to `2026-08-19`.

Target path:

`existing managed event -> one human Task completion edit -> canonical installable edit Trigger -> one DELETE Outbox -> one explicit manual Calendar sync -> only the managed event is removed`

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Parent Work: `0025`
- Starting commit: `41b2555075fb68e62d95b9e6f1077a1005573d9c`
- Parent report: `docs/handoffs/0025-report.md`
- Exact target: same existing personal-synthetic Spreadsheet / bound Apps Script target used since Work 0010.
- Candidate: Code `2.8.14-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`.
- `TEST_MODE=true`; Automation OFF; external/production AI disabled.
- Existing Task: `架空資料の提出`.
- Current Task due date: `2026/08/19`.
- Calendar registration remains explicit `登録`.
- One managed all-day event currently exists on `2026-08-19` in the dedicated secondary Calendar `自動期日管理`.
- Work 0025 final report-head CI: SUCCESS.

## Expected completion semantics

The ordinary human-edit normalization treats a checked `完了` field as terminal completion:

- `status=DONE`;
- `completed=true`;
- `excluded=false`;
- `waiting_for_reply=false`.

`completed` and `status` are Calendar-reconcile fields. A terminal Task is not Calendar-eligible; because this Task already has a managed Calendar event reference, the Calendar policy must choose `DELETE`, not `NOOP` or `CREATE`.

The installable edit Trigger may update Task authority state, manual field ownership, Run History, and Calendar Outbox. It must not call Gmail, AI, or Calendar APIs during the cell edit itself.

## Authorized sequence

### A. One human completion edit

1. Open `タスク一覧` in the exact existing personal-synthetic Spreadsheet.
2. Locate only the Task `架空資料の提出` with due date `2026/08/19` and Calendar登録=`登録`.
3. Change only its visible `完了` checkbox from OFF to ON exactly once.
4. Do not edit `対応状況`, `期限`, `Calendar登録`, or any other cell in the same operation.
5. Do not use `Task編集を手動反映（fallback）`.
6. Allow the canonical installable edit Trigger to complete and refresh once if needed.
7. STOP before Calendar sync and report only that the completion edit is done.

PASS for stage A requires read-only verification by ChatGPT that:

- Task title remains `架空資料の提出`;
- `完了=true`;
- `対応状況=完了` / internal `status=DONE`;
- due date remains `2026/08/19`;
- managed Calendar event reference is still retained until DELETE succeeds;
- Calendar status is `DELETE_PENDING`;
- hidden `同期状態` contains exactly one relevant `DELETE / PENDING` job for the existing managed event;
- no extra pending Outbox jobs are present.

If this gate is not met, STOP. Do not invoke Calendar sync.

### B. One explicit Calendar DELETE sync

Only after ChatGPT explicitly reports pre-sync gate PASS:

1. Invoke `業務OS v2` -> `Calendar同期を1件処理` exactly once.
2. No second invocation is authorized without new evidence.

Expected safe runtime result is materially equivalent to:

- status COMPLETE;
- candidate_count 1;
- processed_count 1;
- error_count 0;
- action DELETE;
- Gmail NOT_CALLED;
- AI NOT_CALLED;
- Calendar ADVANCED_CALENDAR_SERVICE.

### C. Read-only post-delete verification

After the one sync attempt, ChatGPT must read-only verify:

- the managed event `【期限】架空資料の提出` no longer exists in the bounded `2026-08-19` target window on `自動期日管理`;
- no duplicate matching managed event appears nearby;
- the Task remains terminal DONE / completed;
- Task Calendar status is a completed/non-pending state consistent with successful deletion;
- hidden Outbox row is no longer pending/retry/dead for this completed DELETE.

## Acceptance

PASS requires:

- exactly one completion edit;
- only the intended synthetic Task becomes terminal;
- one DELETE Outbox job is proven before API execution;
- exactly one explicit Calendar sync attempt;
- Advanced Calendar Service removes only the managed synthetic event;
- no stale or duplicate matching event remains;
- no Gmail processing;
- no AI call;
- no Review action;
- no unrelated Task or Calendar mutation;
- Automation remains OFF;
- no real/company data.

Highest permitted success status:

`READY_FOR_POST_CALENDAR_LIFECYCLE_REAUDIT`

## Stop conditions

Stop without retry/workaround if the Task cannot be uniquely identified; another field changes unexpectedly; completion is rejected/restored; Calendar status is not DELETE_PENDING; Outbox is missing, duplicated, or not DELETE/PENDING; the Calendar event disappears before the authorized sync; Calendar sync returns non-COMPLETE, non-DELETE, error, retry, or processes more than one job; another Calendar event changes; or a second edit/sync would be needed.

Do not broaden or clean up runtime effects under this Work ID.

## Non-goals / not authorized

No reopening after completion; no Calendar recreate/update replay; no Gmail import/worker; no Mock classification; no Review decision; no manual fallback; no Dashboard; no Quick/Deep Diagnostic; no Setup; no external AI; no Automation enablement; no trigger mutation; no source/clasp mutation; no new target; no synthetic cleanup beyond the managed DELETE itself; no company/production resource; no merge/release/pilot activation.

## Evidence / Git requirements

After the user reports the completion edit and later the bounded Calendar DELETE result, ChatGPT owns all GitHub recording: create `docs/handoffs/0026-report.md`, update the Draft PR, keep Draft/Open/Unmerged, and verify final report-head CI. Store no private account identifiers, Calendar/Event/Task/Gmail IDs, URLs, OAuth values, or raw provider payloads.
