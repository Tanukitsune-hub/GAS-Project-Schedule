# Current Status

Work ID: `0041`
Dispatch ID: `0041-CODEX-01`
BALL: `USER`
STATUS: `ACTION_REQUIRED`
Last updated: `2026-09-05`

Candidate version: Code `2.8.27-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`.
Overall status: `BUILD_ACCEPTED_COMPANY_QUALIFICATION_PENDING`.
ChatGPT review disposition: `0041-CODEX-01_ACCEPTED`.
Work mode: `QUALIFICATION`; active Codex dispatch: `NONE`.
Machine gate: `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`.
The machine gate describes the non-live candidate contract, not company production acceptance.

## Current decision

PR #56 was reviewed and merged by ChatGPT with source/release ancestry preserved.
Reviewed head: `7de465b03af4e3f412392ab02345d363efa766f1`.
Merge commit: `9d46290da5612beef8f94d1aff40890ab430eae9`.
The merged tree exactly matches the reviewed head. The ordinary five-minute worker now consumes standalone Calendar Outbox jobs after a Message is DONE and a Review acceptance/Task edit creates new Calendar work. Existing Review, authority, lease/budget, Calendar claim/CAS, retry and per-run job limits remain intact.

BUILD/integration BLOCKER: `NONE` in the reviewed scope.
Company Calendar E2E: `NOT_ACCEPTED`.
Company no-new-mail FAILED cause: `NEED_USER_EVIDENCE`, not claimed fixed.
Company Code 2.8.27 delivery/update: `NOT_EXECUTED` by this Work's build/review.
Automation artifact default: `OFF`; current company runtime state was not accessed or changed.

## Evidence

- Code 2.8.27 source commit: `2a1b656fd7ecd411b61d728369b02fd5b49b28be`.
- Release content commit: `62f1e8d255ab3906c97e81a1ea48558fd68f8fee`.
- Final-head push CI `33940502943` and PR CI `33940504456`: SUCCESS.
- Inspected final push job: 13/13 checks, 92 suites, missing 0 / extra 0; release parity/rebuild, frozen-path preservation and secret scan PASS.
- Merge-head main CI `33941081434` / #594: SUCCESS.
- Local focused tests are documented as 16/16 Calendar and 19/19 scope tests in the Codex report; ChatGPT did not rerun them.
- Live Google Workspace/provider/credential/deployment/Trigger/OAuth operations: `NOT_EXECUTED` during CODEX-01 and ChatGPT review.

## Accepted candidate and unchanged boundaries

Authored source: `implementation/GoogleSpreadsheet/apps-script-v2/`.
The authored payload remains 25 .gs files plus appsscript.json.
Phase 8B: `implementation/GoogleSpreadsheet/release/v2.8.27-prepilot/`, TEST_MODE=true, test harness included.
Phase 8C: `implementation/GoogleSpreadsheet/release/v2.8.27-prepilot-phase8c/`, TEST_MODE=false, harness excluded, existing Gemini readiness transform, Automation OFF default.
Two-paste company candidate: `implementation/GoogleSpreadsheet/release/work-0041-single-file-company-install/`, Code.gs then appsscript.json; .txt copies are byte-identical.
Code.gs SHA-256: `1535e6294197bebd97c4c3ff37a6c83ae866a9c28b112896da01203894993a78`.
Manifest SHA-256: `e546725fcfe47adfd40e094e66a6c866418cb6265441f541ee000c940d4a8afe`.

CURRENT_CONTRACT.json retains the immutable candidate/source/release provenance. Its branch and live_runtime fields describe the candidate build, not a currently running Codex dispatch. Current control state is in the dispatch ledger.
Work 0039 product/release acceptance and Work 0040 transport acceptance remain closed. Company setup and successful Gemini target-email processing remain accepted historical user observations. High-impact Review policy, Task authority, schema/migration, manifest, provider and Trigger implementations are unchanged by this repair. Direct OpenAI is not the intended company provider; Azure OpenAI is separate and deferred following its bounded 403 smoke result.

## Next decisive action and completion boundary

Inspect the normalized safe error code and stage/subsystem from one existing company no-new-mail FAILED run. No new failure or private content is requested. A later explicitly user-controlled company update and ordinary scheduled Calendar E2E are required before Work 0041 can close. Preserve all existing business/credential/Calendar identity/scan state; do not confuse an OFF default in replacement code with persisted Automation being stopped.

No new Codex dispatch or live authorization is issued here. CODEX-01 BUILD is latched; Work 0041 completion is not latched.

## Current records and preserved history

- `docs/handoffs/0041-dispatches.md`: current ball and dispatch state.
- `docs/handoffs/0041-CODEX-01-review.md`: ChatGPT acceptance, review limits and remaining runtime gates.
- `docs/handoffs/0041-CODEX-01-calendar-runtime-remediation-report.md`: immutable Codex return evidence.
- `docs/handoffs/0041-user-automation-live-status.md`: company evidence and qualification boundary.
- `docs/handoffs/0041-preacceptance-current-status.md`: exact pre-review CURRENT_STATUS.md, preserved with original Git blob `dd44e2614e04c91ff4a250fd8cffe4f8444763c2`; all earlier historical status sections remain intact there.

This file and the current ledger supersede pre-review disposition labels in candidate-era overview documents. Such labels are not fresh runtime or approval evidence.

Work ID: `0041`
Dispatch ID: `0041-CODEX-01`
BALL: `USER`
STATUS: `ACTION_REQUIRED`
