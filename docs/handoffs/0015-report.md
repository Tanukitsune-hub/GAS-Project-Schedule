# Work 0015 Report — Controlled Synthetic Gmail → Mock AI → Task E2E

## Result

- `WORK_ID`: `0015`
- `STATUS`: `BLOCKED_BY_GMAIL_BODY_DECODE_PRODUCT_DEFECT`
- `BLOCKER`: `E_GMAIL_BODY_DECODE`
- `HIGHEST_CONFIRMED_GATE`: `READY_FOR_CONTROLLED_SYNTHETIC_END_TO_END_VALIDATION` (unchanged from Work 0014)
- `AUTOMATION`: `OFF`
- `EXTERNAL_AI`: `NOT_CALLED`
- `CALENDAR`: `NOT_CALLED`

Work 0015 stopped at the required fail-closed boundary during the first and only authorized manual Gmail import attempt. The Mock classification / Task-upsert action was not invoked.

## Safe runtime evidence

The user-reported bounded result established:

- Gmail candidate count: `1`
- processed count: `0`
- skipped count: `0`
- error count: `1`
- safe error code: `E_GMAIL_BODY_DECODE`
- Gmail API calls: `4 / 20`
- checkpoint: empty / not reached
- next operation: empty / not reached
- run summary recorded: `true`
- external AI: `NOT_CALLED`
- Calendar: `NOT_CALLED`

No second manual-import attempt and no Mock-vertical attempt were authorized or performed under Work 0015.

## Synthetic-message structural check

A separate read-only inspection of the exact synthetic test message established only privacy-safe structural facts:

- short synthetic body;
- no attachment;
- standard `multipart/alternative` message;
- a `text/plain` part with UTF-8 charset;
- no evidence that an unusual MIME structure is required to trigger the failure.

No message/thread identifiers, addresses, raw MIME, body text, URLs, credentials, or account identifiers are retained in this report.

## Code-boundary finding

The failure is inside `WorkOsGmailGateway.decodeBodyData()` / the real Apps Script Gmail-body decode boundary. The current local Phase 2 tests emulate `Utilities.base64DecodeWebSafe()` with Node `Buffer.from(..., 'base64url')`; therefore they do not prove the behavior of the real Apps Script `Utilities` implementation against the Advanced Gmail service response.

The exact runtime representation/normalization mismatch is not yet proven. The repair must not simply suppress `E_GMAIL_BODY_DECODE`; it must preserve fail-closed behavior while accepting the Gmail API body representation documented/observed in the real Apps Script runtime.

## CI / repository state

- Work 0015 instruction head: `a42f4d486687788807f787bdf048a37ec8c03719`
- GitHub Actions CI on that head: `SUCCESS`
- Product source was unchanged by Work 0015 before this report.
- Candidate identity remains Code `2.8.12-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`, `TEST_MODE=true`, Automation OFF.

## Classification

This is a **BLOCKER for the synthetic Gmail E2E path**, because a normal synthetic Gmail message cannot reach `PREPROCESSED`. It is not evidence of Setup corruption, AI failure, Task-authority failure, Calendar mutation, or production-data exposure.

## Required next work

Create a new Work ID for the smallest decoder repair and bounded redeployment to the same personal-synthetic Apps Script target. After that repair is independently validated, a later Work ID may authorize exactly one re-attempt of the same synthetic Gmail message.
