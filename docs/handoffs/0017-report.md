# Work 0017 Report — Controlled Gmail Decode Retest

## Result

- `WORK_ID`: `0017`
- `STATUS`: `BLOCKED_BY_ADVANCED_GMAIL_BYTE_REPRESENTATION_DEFECT`
- `BLOCKER`: `E_GMAIL_BODY_DECODE`
- `BRANCH`: `codex/0017-gmail-decode-mock-task-retest`
- `PR`: `#30` (Draft / Open / Unmerged)
- `CANDIDATE`: Code `2.8.13-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- `AUTOMATION`: `OFF`
- `EXTERNAL_AI`: `NOT_CALLED`
- `CALENDAR`: `NOT_CALLED`

Work 0017 stopped at the required fail-closed boundary during the first and only authorized manual Gmail import attempt. The Mock vertical was not invoked and no Task or Calendar operation occurred.

## Safe runtime evidence

The user-reported bounded result established:

- manual-import attempts: `1`
- status: `FAILED`
- safe error code: `E_GMAIL_BODY_DECODE`
- Gmail candidate count: `1`
- processed count: `0`
- skipped count: `0`
- error count: `1`
- Gmail API calls: `5 / 20`
- checkpoint: empty / not reached
- next operation: empty / not reached
- run summary recorded: `true`
- external AI: `NOT_CALLED`
- Calendar: `NOT_CALLED`

No second manual-import attempt and no Mock-vertical attempt were performed under Work 0017.

## Synthetic-message structural check

A separate privacy-safe, read-only inspection established only these structural facts about the exact Work 0017 test message:

- one normal synthetic message;
- short Japanese plain-text body;
- no attachment or inline image;
- Inbox scope and the intended manual-import label;
- no unusual message/thread expansion was required to explain the failure.

No Gmail IDs, addresses, account identifiers, URLs, raw MIME, body text, OAuth values, or private payload data are retained in Git.

## Revised technical finding

Work 0016 repaired one plausible string-path defect by validating base64url and restoring terminal padding before `Utilities.base64DecodeWebSafe()`. The identical runtime failure recurred, so missing padding is not the complete root cause.

The current implementation begins `decodeBodyData()` with `String(data || '')`. That assumes Advanced Gmail Service `MessagePartBody.data` is delivered to Apps Script as the public REST JSON base64url string.

The highest-confidence revised diagnosis is that Apps Script's Advanced Gmail Service materializes the Gmail API `bytes` field as an already-decoded byte sequence / Int8-style array. Under that representation, `String(data)` becomes comma-separated integer text, which is neither base64url nor valid input to `Utilities.base64DecodeWebSafe()`. This explains both Work 0015 and Work 0017 while also explaining why Node tests built around string/base64url fixtures passed.

This diagnosis is strongly supported by:

- the public Gmail API contract declaring `MessagePartBody.data` as a `bytes`-format field;
- Apps Script Advanced Services translating public API resource types for the Apps Script runtime;
- an independently reported, materially identical Advanced Gmail Service observation in which `payload.body.data` logged as an integer byte array and was consumed directly by `Utilities.newBlob(byteArray).getDataAsString()`.

The next repair must verify and support the real Advanced-Service byte representation without weakening strict validation, privacy, attachment exclusion, truncation, or the fail-closed error contract. It must not merely add another permissive string decoder.

## State and safety consequence

Because `E_GMAIL_BODY_DECODE` is non-retryable, the Work 0017 message is expected to have entered durable `DEAD` state and to be suppressed from ordinary manual-import selection. Do not revive, edit, delete, or manually retry the Work 0015 or Work 0017 Message State / Dead Letter entries.

## CI and repository evidence

- Work 0017 instruction head: `a48802b868fff8414028b9acd050cdc6fdcdf7c1`
- instruction-head GitHub Actions: `SUCCESS`
- product source was not changed by Work 0017 before this report
- existing Apps Script target remains on the exact Work 0016 `2.8.13-prepilot` payload

## Classification

This remains a BLOCKER for the synthetic Gmail E2E path. It is not evidence of Setup corruption, AI failure, Task-authority failure, Calendar mutation, Automation activation, or real-data exposure.

## Required next work

Create a new Work ID for a narrow Advanced Gmail Service byte-representation repair. The implementation should:

1. preserve a strict base64url-string path for explicit string fixtures/clients;
2. add a strict bounded byte-sequence path for the real Apps Script Advanced Service representation;
3. validate element type/range and normalize only valid signed/unsigned byte values;
4. decode byte sequences directly through `Utilities.newBlob(bytes).getDataAsString('UTF-8')` without double base64 decoding;
5. model the real representation in local tests, including JavaScript arrays and typed-array-like values where Apps Script compatibility permits;
6. preserve truncation, attachment exclusion, privacy, and fixed `E_GMAIL_BODY_DECODE` failures;
7. produce a coherent successor pre-pilot candidate if product bytes change;
8. place the repaired exact payload onto the same existing personal-synthetic target only after full local/CI validation.

A later Work ID may authorize one fresh synthetic Gmail runtime retest. No Gmail runtime retry is authorized in the repair Work itself.
