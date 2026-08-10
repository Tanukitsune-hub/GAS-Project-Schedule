# Work 0020 Report — Controlled Synthetic Mock Vertical Validation

## Result

- `WORK_ID`: `0020`
- `STATUS`: `READY_FOR_NEXT_CONTROLLED_SYNTHETIC_TASK_VALIDATION`
- `BLOCKER`: `NONE`
- `BRANCH`: `codex/0020-synthetic-mock-vertical-validation`
- `PR`: `#33` (Draft / Open / Unmerged)
- Candidate: Code `2.8.14-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- `TEST_MODE`: `true`
- Automation: `OFF`

## Runtime outcome

The already-PREPROCESSED Work 0019 synthetic message was processed through the one authorized deterministic Mock vertical invocation.

Privacy-safe bounded runtime evidence:

- invocation attempts: `1`;
- status: `COMPLETE`;
- candidate count: `1`;
- processed count: `1`;
- created Task count: `1`;
- updated Task count: `0`;
- Review count: `0`;
- error count: `0`;
- Gmail API calls: `6 / 20`;
- classification reused: `true`;
- final checkpoint: `DONE`;
- Calendar job count: `0`;
- run summary recorded: `true`;
- Gmail: Advanced Gmail Service only;
- AI: deterministic Mock only, no network;
- Calendar: outbox path only, no Calendar API.

No run ID, Gmail Message/Thread ID, account identity, email address, source-email URL, Task ID, raw message content, raw Google payload, or other private identifier is recorded here.

## Visible Task confirmation

The user supplied a read-only screenshot of the Task list after the invocation. It confirmed one newly created synthetic task with the expected deterministic fixture values:

- title: `架空資料の提出`;
- due date: `2026-08-18`;
- priority: `高` / HIGH.

The Task row was visible in the expected Task list. No Task edit was performed as part of Work 0020.

## Acceptance

Work 0020 acceptance passed:

- one eligible PREPROCESSED synthetic message;
- one Mock vertical invocation;
- one processed message;
- exactly one new Task;
- no existing Task update;
- deterministic Mock AI only;
- no external AI/network request;
- final checkpoint `DONE`;
- zero errors;
- expected Calendar job count `0`;
- no Calendar API call;
- visible Task materially matched the deterministic `[MOCK:NEW_HIGH]` fixture;
- Automation remained OFF;
- no real/company data workflow or prohibited operation occurred.

## Scope boundary

Work 0020 did not perform human Review accept/reject/restage, manual Task edits, edit-trigger validation, deliberate Calendar create/update/delete/no-op validation, Dashboard refresh, diagnostics, Setup, external AI, Automation enablement, cleanup, merge, release, or company/production operations.

## Next boundary

Because this deterministic fixture produced `review_count=0`, the next Work must inspect the implemented Task/Review sequencing before authorizing another mutation. The next controlled runtime test should target the highest-value missing end-to-end behavior without inventing a Review state that this fixture did not create.
