# Work 0021 Report — Controlled Synthetic Review Creation and Human Accept Validation

## Result

- `WORK_ID`: `0021`
- `STATUS`: `READY_FOR_CONTROLLED_SYNTHETIC_MANUAL_TASK_EDIT_VALIDATION`
- `BLOCKER`: `NONE`
- `BRANCH`: `codex/0021-synthetic-review-accept-validation`
- `PR`: `#34` (Draft / Open / Unmerged)
- Candidate: Code `2.8.14-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- `TEST_MODE=true`
- Automation: `OFF`
- External/production AI: disabled

## Runtime outcome

One fresh non-sensitive synthetic Gmail message using the deterministic `NEW_REVIEW` Mock fixture was processed through the controlled review path.

The user-reported Mock vertical result established:

- status: `COMPLETE`;
- candidate count: `1`;
- processed count: `1`;
- created Task count: `1`;
- updated Task count: `0`;
- error count: `0`;
- Gmail API calls: `6 / 20`;
- final Message checkpoint: `DONE`;
- Calendar job count: `0`;
- AI: `MOCK_ONLY_NO_NETWORK`;
- Calendar: `OUTBOX_ONLY_NO_API`.

The visible Task row before human decision matched the deterministic review-required state materially:

- title `架空内容の確認`;
- `要確認=true`;
- decision `未選択`;
- status `要確認`;
- no due date;
- priority `中`;
- review state `未確認`.

The user then changed only the decision field from `未選択` to `受入` once. No manual fallback was used.

A user-supplied read-only screenshot after the edit confirmed the canonical installable edit Trigger closed the Review materially as expected:

- `要確認=false`;
- decision `受入`;
- status `未対応`;
- completed unchecked;
- excluded unchecked;
- title remains `架空内容の確認`;
- review state `適用済`;
- review type remains `NEW_TASK` as visible metadata;
- no duplicate Task was visible;
- the prior synthetic Task remained present as a separate row.

This proves the native human Review ACCEPT path through the installed Task edit Trigger in the existing personal-synthetic Spreadsheet.

No exact run ID, Gmail/Task identifier, address, account identity, private URL, message body, OAuth value, Calendar ID, or raw Google payload is retained in this report.

## Review-count observation

The Mock vertical safe summary reported `review_count=0` even though the newly created Task was visibly and materially in the required Review state.

The worker's current summary logic increments `review_count` from action-result flags or by looking the newly inserted Task back up in the existing in-memory Task context. The runtime evidence shows the durable Task write succeeded while this count did not reflect it.

Classification:

- Review creation / persistence / human ACCEPT behavior: `PASS`;
- `review_count` run-summary accuracy for this INSERT path: `FIX SOON`;
- severity: non-blocking observability/counting defect;
- no evidence of Task-authority, Review-policy, Gmail, AI, Calendar, or Trigger failure.

Do not stop the controlled validation sequence solely for this metric defect. Repair it under a later dedicated Work ID with focused regression coverage.

## Acceptance

PASS:

- one fresh synthetic Review input;
- manual preprocessing completed before the Mock vertical;
- one deterministic Mock vertical invocation;
- exactly one review-required Task created;
- visible pre-decision Review state matched the fixture;
- exactly one human `受入` edit;
- installable Trigger visibly changed the Task to accepted `未対応` state;
- no manual edit fallback;
- no duplicate Task;
- no external AI/network;
- no Calendar API/event mutation;
- Automation remained OFF;
- no real/company data or prohibited operation.

## Next boundary

The next controlled runtime validation may test an ordinary manual Task business-field edit on an already accepted synthetic Task, proving normal user editing and authority persistence independently of Review decisions. A low-side-effect field should be preferred before deliberate Calendar-event validation.
