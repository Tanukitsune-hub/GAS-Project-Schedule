# Work 0023 — Controlled Synthetic Calendar Runtime Validation

## Outcome

Prove one real Calendar create path in the exact existing personal-synthetic Work OS target running candidate `2.8.14-prepilot`, while keeping Gmail processing, AI, Dashboard, diagnostics, Setup, and Automation out of scope.

Target path:

`existing synthetic Task -> human Calendar登録=登録 edit -> canonical installable edit Trigger -> durable Calendar Outbox CREATE intent -> explicit Calendar同期を1件処理 -> one managed all-day Event in dedicated secondary Calendar`

Use only the existing Work 0020 synthetic Task `架空資料の提出`.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Parent Work: `0022`
- Starting commit: `2ab2e8529c72b0cb67775f515e721989fc92e100`
- Parent report: `docs/handoffs/0022-report.md`
- Exact target: same existing personal-synthetic Spreadsheet / bound Apps Script target used since Work 0010.
- Candidate: Code `2.8.14-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`.
- `TEST_MODE=true`; Automation OFF; external/production AI disabled.
- Work 0022 final report-head CI: SUCCESS.

Read-only preflight from the exact Spreadsheet confirmed one unique visible Task:

- title: `架空資料の提出`;
- status: `未対応`;
- completed: false;
- excluded: false;
- due date: `2026/08/18`;
- priority: `高`;
- Calendar登録: `自動`;
- review state: `なし`.

The deterministic Mock classification for this Task intentionally used Calendar category `NONE` / importance `LOW`, so AUTO policy correctly created no Calendar event. This Work explicitly tests the human FORCE path by changing only Calendar登録 to `登録`.

## Authorized user sequence

### A. Arm exactly one Calendar intent through the normal edit Trigger

1. Open `タスク一覧` in the exact existing synthetic Spreadsheet.
2. Locate the unique Task `架空資料の提出` with due date `2026/08/18`.
3. Change only `Calendar登録` from `自動` to `登録` exactly once using the existing dropdown.
4. Do not edit any other cell.
5. Do not use `Task編集を手動反映（fallback）`; this Work proves the canonical installable edit Trigger path.
6. Allow the Trigger to complete. A single refresh is allowed if needed; do not repeat the edit.

Expected effects of A:

- visible Calendar登録 remains `登録`;
- title, due date, priority, status, completed/excluded state remain unchanged;
- Task authority state is updated through the normal edit path;
- one durable Calendar reconcile/outbox intent may be written;
- no Gmail or AI call;
- no Calendar API/event mutation yet.

If the edit is rejected/restored, another field changes, or a manual fallback would be needed, STOP without retry.

### B. Process exactly one pending Calendar job

Only after A visibly passes:

1. Choose `業務OS v2` -> `Calendar同期を1件処理` exactly once.
2. Read the confirmation. It authorizes processing at most one pending Calendar job and writing only to the dedicated secondary Calendar `自動期日管理`.
3. Continue once.
4. Do not invoke the menu a second time in Work 0023.

The Calendar worker may use the Calendar API for this one job. It must not re-run Gmail processing, AI classification, or alter Task business fields other than designed Calendar management state.

Expected external result:

- exactly one managed all-day event is created in `自動期日管理`;
- event summary is materially `【期限】架空資料の提出`;
- event date is `2026-08-18` local Calendar date;
- no duplicate managed event is created;
- no event is written to the primary calendar or another calendar.

The event description may contain bounded Work OS metadata/source reference. Do not copy its raw description, event ID, Calendar ID, Gmail URL, Task ID, or other private identifiers into chat or GitHub evidence.

### C. Read-only verification

After B, report only the menu's safe summary. ChatGPT may independently verify the dedicated Calendar read-only through the connected Google Calendar surface.

If the event is not visible immediately, do not run Calendar sync again. Report the first result and stop so the durable state can be inspected without creating duplicate mutation risk.

## Acceptance

PASS requires:

- exactly one Calendar登録 edit `自動 -> 登録` on the intended synthetic Task;
- canonical installable edit Trigger persists the edit without fallback;
- no unintended Task business-field changes;
- exactly one explicit `Calendar同期を1件処理` invocation;
- at most one Calendar job processed;
- one managed all-day event for `架空資料の提出` on `2026-08-18` in dedicated `自動期日管理`;
- no duplicate event;
- no primary/other Calendar mutation;
- no Gmail processing or AI call;
- Automation remains OFF;
- no real/company data or prohibited operation.

Highest permitted success status:

`READY_FOR_CONTROLLED_SYNTHETIC_CALENDAR_UPDATE_DELETE_VALIDATION`

## Stop conditions

Stop without retry/workaround if the Task cannot be uniquely identified; Calendar登録 edit is restored/rejected; another Task field changes unexpectedly; fallback would be required; Calendar sync reports zero or more than one selected/processed job when a job is expected; Calendar API returns an error; the event appears on the wrong Calendar/date; more than one managed event appears; Gmail/AI is called; a second Calendar sync would be needed; or any raw exception/auth/identity/private-data issue occurs.

Do not broaden scope or clean up effects under this Work ID.

## Non-goals / not authorized

No Calendar event update/delete/idempotent replay test; no Gmail import/worker; no Mock or production AI classification; no Review decision; no arbitrary Task edit; no manual edit fallback; no Dashboard; no Quick/Deep Diagnostic; no Setup/Continue Setup; no Automation enablement; no source/clasp mutation; no new Spreadsheet/Apps Script/Calendar target; no synthetic cleanup; no company/production resource; no merge/release/pilot activation.

## Carried non-blocking gaps

- Work 0021 `review_count` summary under-counting: FIX SOON.
- `VERSION_PROPERTIES` Quick Diagnostic WARN: pre-pilot version-property reconciliation housekeeping.
- Historical controlled Gmail decode failures remain visible in dead-letter diagnostics.

## Evidence / Git requirements

After the user reports the bounded Calendar-sync result and the event is independently/read-only confirmed, ChatGPT owns GitHub recording: create `docs/handoffs/0023-report.md`, update the Draft PR, keep Draft/Open/Unmerged, and check final report-head CI. Store no run IDs, account/address identity, Gmail/Task/Calendar/Event IDs, private URLs, OAuth values, event descriptions, or raw Google payloads.
