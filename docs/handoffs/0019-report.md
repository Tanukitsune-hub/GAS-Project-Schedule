# Work 0019 Report — Controlled Advanced Gmail Byte-Body Runtime Retest

## Result

- `WORK_ID`: `0019`
- `STATUS`: `READY_FOR_CONTROLLED_SYNTHETIC_MOCK_VERTICAL_VALIDATION`
- `BLOCKER`: `NONE`
- `BRANCH`: `codex/0019-advanced-gmail-byte-body-retest`
- `PR`: `#32` (Draft / Open / Unmerged)
- `AUTOMATION`: `OFF`
- `EXTERNAL_AI`: `NOT_CALLED`
- `CALENDAR`: `NOT_CALLED`

## Runtime outcome

One fresh, non-sensitive, self-addressed synthetic Gmail message was used for the one authorized manual-import attempt against the existing personal-synthetic Work OS target running candidate `2.8.14-prepilot`.

The repaired Advanced Gmail body representation boundary passed in real Apps Script runtime:

- manual-import attempts: `1`;
- status: `COMPLETE`;
- candidate count: `1`;
- processed count: `1`;
- skipped count: `0`;
- error count: `0`;
- Gmail API calls: `6 / 20`;
- checkpoint: `PREPROCESSED`;
- next operation: `CLASSIFY`;
- run summary recorded: `true`;
- external service: Gmail Advanced Service only;
- AI: `NOT_CALLED`;
- Calendar: `NOT_CALLED`.

This is the first confirmed real Apps Script runtime proof that the Work 0018 dual-representation Gmail body decoder accepts the actual Advanced Gmail Service body representation and successfully reaches the durable PREPROCESSED checkpoint.

No exact run ID, Gmail Message/Thread ID, email/account identity, subject/body text, source URL, byte sequence, OAuth value, or private Google identifier is recorded here.

## Scope boundary

Work 0019 intentionally stopped immediately after PREPROCESSED. It did not invoke deterministic Mock AI, Task upsert, Review, Calendar, Dashboard, Quick/Deep Diagnostic, Setup, trigger mutation, Automation, external AI, or any company/production workflow.

The failed Work 0015 and Work 0017 messages/state rows were not revived, edited, retried, or deleted.

## Acceptance

All Work 0019 acceptance conditions passed:

- exactly one fresh synthetic Gmail input;
- exactly one manual-import invocation;
- exactly one candidate;
- exactly one processed message;
- zero skips and zero errors;
- former `E_GMAIL_BODY_DECODE` did not recur;
- durable `PREPROCESSED` checkpoint reached;
- next operation is `CLASSIFY`;
- Gmail call budget remained bounded;
- AI and Calendar were not called;
- Automation remained OFF;
- no prohibited operation or real/company data processing occurred.

## Next boundary

The next permitted Work should operate only on this already-PREPROCESSED synthetic Work 0019 message and invoke the deterministic `Phase 3/4 Mock縦フローを1件処理` action once. It should validate Mock-only classification and Task upsert, with no production AI and with zero expected Calendar jobs for the `[MOCK:NEW_HIGH]` fixture.
