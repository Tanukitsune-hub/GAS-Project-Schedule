# Work 0025 Report — Controlled Synthetic Calendar UPDATE Validation

## Result

- Status: `READY_FOR_CONTROLLED_SYNTHETIC_CALENDAR_DELETE_VALIDATION`
- BLOCKER: `NONE`
- Candidate: Code `2.8.14-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- TEST_MODE: true
- Automation: OFF
- Production/external AI: disabled

## Authorized runtime sequence

The existing synthetic Task `架空資料の提出` had one managed all-day Calendar event created under Work 0024 for `2026-08-18`.

Under Work 0025 the operator changed only the Task due date from `2026/08/18` to `2026/08/19` once.

Before the Calendar API call, ChatGPT read-only verified:

- Task due date=`2026/08/19`;
- Calendar registration remained explicit `登録`;
- Calendar sync status=`PENDING`;
- the existing managed Calendar event reference remained attached to the Task;
- hidden `同期状態` contained exactly one data row for the same Task/event with `desired_action=UPDATE`, `status=PENDING`;
- no extra Outbox jobs.

The operator then invoked `Calendar同期を1件処理` exactly once.

Safe runtime result:

- status: COMPLETE
- note: Calendar outbox job completed
- candidate_count: 1
- processed_count: 1
- queued_count: 0
- error_count: 0
- action: UPDATE
- Gmail: NOT_CALLED
- AI: NOT_CALLED
- Calendar: ADVANCED_CALENDAR_SERVICE

## Read-only Calendar verification

The operator reported that the prior `2026-08-18` event disappeared and the managed event moved to `2026-08-19` without duplication.

ChatGPT independently queried the dedicated secondary Calendar in bounded windows and confirmed:

- no matching managed event remained on `2026-08-18`;
- exactly one matching managed all-day event `【期限】架空資料の提出` exists on `2026-08-19`;
- no duplicate matching event was observed in the combined `2026-08-18` through `2026-08-19` window.

No private account identifiers, Calendar IDs, Event IDs, Task IDs, Gmail IDs, URLs, OAuth values, or raw provider payloads are stored in this report.

## Acceptance

PASS.

The real Google runtime path is now proven:

`authoritative Task due-date edit -> one UPDATE Outbox -> one explicit manual Calendar sync -> Advanced Calendar Service -> existing managed event moved in place without duplication`

No Gmail processing, AI classification, Review action, Dashboard/diagnostic/Setup action, Automation enablement, or unrelated Calendar mutation occurred.

## Carried non-blocking items

- Work 0021 Mock `review_count` summary under-counting remains FIX SOON.
- `VERSION_PROPERTIES` and historical dead-letter warnings remain deferred housekeeping before pilot/final release.

## Next boundary

Use the same synthetic Task/event to validate one terminal completion path:

`Task completed -> one DELETE Outbox -> one explicit Calendar sync -> only the managed event is removed`

Highest next status: readiness for the next controlled runtime boundary after Calendar lifecycle validation.
