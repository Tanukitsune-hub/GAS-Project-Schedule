# Work 0024 — Controlled Synthetic Calendar CREATE Retry

## Outcome

Complete the intended one-event Calendar CREATE proof after Work 0023 safely no-op'd because Calendar mode was changed on the wrong synthetic Task.

Target path:

`restore wrong no-due Task mode -> arm correct due Task -> ChatGPT read-only verification of Task + Outbox -> one explicit Calendar sync -> ChatGPT read-only event verification`

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Parent Work: `0023`
- Starting commit: `a5e83bf303be3f25a7e685c4002c3ebc8087be50`
- Parent report: `docs/handoffs/0023-report.md`
- Exact target: same existing personal-synthetic Spreadsheet / bound Apps Script target used since Work 0010.
- Candidate: Code `2.8.14-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`.
- `TEST_MODE=true`; Automation OFF; external/production AI disabled.
- Work 0023 final report-head CI: SUCCESS.

## Verified runtime starting state

Read-only inspection after Work 0023 established:

- `架空資料の提出`: due `2026/08/18`, `Calendar登録=自動`.
- `架空内容の確認`: no due date, `Calendar登録=登録` from the mistaken Work 0023 edit.
- hidden `同期状態`: zero Outbox data rows.
- no Calendar API call/event mutation occurred in Work 0023.

## Authorized user sequence — Stage A only

1. In `タスク一覧`, uniquely locate `架空内容の確認` and change only `Calendar登録` from `登録` back to `自動` exactly once.
2. Then uniquely locate `架空資料の提出` with due date `2026/08/18` and change only `Calendar登録` from `自動` to `登録` exactly once.
3. Do not edit any other cell.
4. Do not use `Task編集を手動反映（fallback）`.
5. Do not invoke `Calendar同期を1件処理` yet.
6. Allow the canonical owner installable edit Trigger to finish; refresh once if needed.
7. Tell ChatGPT the two edits are complete. ChatGPT will perform read-only connected-Sheets verification before authorizing Stage B.

## Required pre-sync verification by ChatGPT

Before any Calendar API write, ChatGPT must read only the exact synthetic Spreadsheet and verify all of the following:

- `架空内容の確認` is back to `Calendar登録=自動` and still has no due date;
- `架空資料の提出` is `Calendar登録=登録`, due `2026/08/18`, status `未対応`, and unique;
- the hidden `同期状態` contains exactly one actionable pending CREATE job corresponding to the due synthetic Task;
- no unrelated pending/retry/dead Calendar job would be selected first.

If any condition fails, STOP. Do not invoke Calendar sync and do not repeat edits under this Work ID.

## Authorized user sequence — Stage B only after ChatGPT GO

1. Invoke `業務OS v2` -> `Calendar同期を1件処理` exactly once.
2. This is the only Calendar write attempt authorized in Work 0024.
3. The write destination is only the dedicated secondary Calendar `自動期日管理` created by Setup.
4. Expected successful result is materially equivalent to COMPLETE; candidate 1; processed 1; error 0; Calendar API crossed for one managed CREATE; Gmail NOT_CALLED; AI NOT_CALLED.
5. Do not invoke the sync a second time regardless of result.

## Post-sync read-only verification

After the user supplies the bounded safe result, ChatGPT may use connected Google Calendar read-only access to verify that exactly one managed all-day event exists on `2026-08-18` in `自動期日管理` with visible title:

`【期限】架空資料の提出`

Do not disclose or persist Calendar IDs, event IDs, private URLs, account identity, raw event descriptions, attendee data, or provider payloads.

## Acceptance

PASS requires:

- wrong no-due Task restored to `自動`;
- correct due Task armed to `登録`;
- exactly one correct pending CREATE job proven before API write;
- exactly one Calendar sync invocation;
- exactly one managed all-day event on `2026-08-18` in `自動期日管理`;
- no unrelated Calendar event mutation;
- Gmail and AI not called;
- Automation remains OFF;
- no real/company data.

Highest permitted success status:

`READY_FOR_CONTROLLED_SYNTHETIC_CALENDAR_UPDATE_DELETE_VALIDATION`

## Stop conditions

Stop without retry/workaround if either Task cannot be uniquely identified; either edit is rejected/restored; pre-sync read-only verification does not show exactly one correct actionable CREATE job; an unrelated Calendar job is pending first; Calendar sync returns zero candidates, RETRY, DEAD, FAIL, PAUSED, or unexpected result; Calendar auth/identity issue appears; event is missing/duplicated; any unrelated event changes; or a second edit/sync would be required.

## Non-goals / not authorized

No Gmail import/worker; no Mock/real AI; no Review action; no manual fallback; no due-date/status/priority/comment edit; no Calendar UPDATE/DELETE; no Dashboard/diagnostics/Setup; no Automation; no source/clasp mutation; no new target; no synthetic cleanup beyond the exact wrong Calendar-mode restoration; no company/production resource; no merge/release/pilot activation.

## Evidence / Git requirements

After completion, ChatGPT creates `docs/handoffs/0024-report.md`, updates the Draft PR, keeps it Draft/Open/Unmerged, and verifies final report-head CI. Store no run IDs, account/address identity, Gmail/Task/Calendar IDs, private URLs, OAuth values, raw provider payloads, or raw event descriptions.
