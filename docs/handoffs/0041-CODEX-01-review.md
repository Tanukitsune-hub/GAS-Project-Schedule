# Work 0041 — ChatGPT Review and BUILD Acceptance

Work ID: `0041`
Dispatch ID: `0041-CODEX-01`
BALL: `USER`
STATUS: `ACTION_REQUIRED`
Dispatch disposition: `ACCEPTED`
Work mode after review: `QUALIFICATION`
Date: `2026-09-05`

## Decision

Accept the non-live Calendar scheduled-drain BUILD and integrate PR #56. Do not declare company runtime or Work 0041 complete. No additional Codex execution is required by this review.

Reviewed head: `7de465b03af4e3f412392ab02345d363efa766f1`.
Review base: `baddbd9dc728599dc095526e69ce7531b0f16bea`.
Source commit: `2a1b656fd7ecd411b61d728369b02fd5b49b28be`.
Release content commit: `62f1e8d255ab3906c97e81a1ea48558fd68f8fee`.
Merge commit: `9d46290da5612beef8f94d1aff40890ab430eae9`.
The two-parent merge preserves the exact reviewed tree `ba201252b443d15db0b2f36411511e036061c62b` and source/release ancestry. No squash, rebase, product patch, or live deployment was performed by ChatGPT.

## Reviewed evidence and scope

ChatGPT inspected the PR metadata and changed-file inventory, the complete authored Worker/CalendarSync behavioral diff, the focused scheduled-drain tests, the validation gate and relevant release verification/build contracts, the existing Work 0039 historical release test, the canonical-document checks, the completion report and final hosted CI evidence. The generated package payloads were assessed through the inspected source-parity/checksum/rebuild verifier and observed CI results; this was not a manual line-by-line reading of every generated copy. No local test or Google Workspace runtime was executed by ChatGPT.

The confirmed code gap was the lack of a standalone Calendar Outbox consumer after the originating Message had reached DONE. The new tail stage in `processAutomaticBatch` uses the remaining shared Calendar job allowance, existing worker lease and execution budget, and the existing Calendar claim -> external I/O -> CAS path. It does not require a new Gmail candidate or a Message-State CALENDAR_PENDING entry. No second Trigger was added.

The focused tests use the real repositories/EditHandler/Calendar claim-CAS implementation with fake platform gateways. They cover important-Task Review acceptance after Message DONE, CREATE, UPDATE, completion DELETE, NOOP/replay without duplicate writes, the combined Message/standalone job bound, retry/deferred/dead failures, post-I/O conflict, lease/budget/claim/authority rejection, and healthy idle/detail suppression/heartbeat separation. Review policy, Task authority, schema/migration, manifest, provider and Trigger implementations are unchanged in the PR.

## Observed hosted validation

| Evidence | Result |
|---|---|
| Final-head push CI, run `33940502943` | SUCCESS |
| Final-head PR CI, run `33940504456` | SUCCESS |
| Inspected push job `101236853356` | 13/13 checks; 92 suites; missing 0 / extra 0 |
| Release source parity, checksums and deterministic rebuild in that job | PASS |
| Frozen-root preservation and secret scan in that job | PASS; changed frozen paths 0 / hits 0 |
| Merge-head main CI, run `33941081434` / #594 | SUCCESS |

The report separately records focused Calendar tests 16/16, CI-scope tests 19/19 and local verify:local / verify:ci 13/13. Local results are Codex-reported, corroborated by the final hosted gate; they are not new ChatGPT executions.

## Classification

- BUILD / integration BLOCKER: `NONE` in the reviewed scope.
- Required next Work-level evidence: company update/delivery and real Calendar projection for Code 2.8.27 are `NOT_EXECUTED` / `NOT_ACCEPTED`.
- Required next Work-level evidence: the historical company no-new-mail FAILED cause is `NEED_USER_EVIDENCE`. This PR neither explains nor claims to fix that observed failure.
- Azure OpenAI remains separate and deferred. Do not use this Work to bypass the existing Azure network/auth boundary.
- Optional hardening: none required for this acceptance.

Calling the two company items FOLLOW_UP is appropriate for this non-live BUILD dispatch, but not permission to skip them when closing the company workflow.

## Current artifact and next action

Accepted source-derived company candidate:
`implementation/GoogleSpreadsheet/release/work-0041-single-file-company-install/`.

Code.gs SHA-256: `1535e6294197bebd97c4c3ff37a6c83ae866a9c28b112896da01203894993a78`.
Manifest SHA-256: `e546725fcfe47adfd40e094e66a6c866418cb6265441f541ee000c940d4a8afe`.
Version: `2.8.27-prepilot`; Schema `2.6`; AI Schema `2.0`; Migration `3`.
The .txt transport copies are byte-identical according to the verified release contract. Company installation of this candidate has not occurred in this review.

The current smallest decisive action is a user read-only observation of the normalized safe error code and stage/subsystem from one already-existing no-new-mail FAILED run. Do not generate a fresh failure or copy business content. This observation can identify a still-active blocker before resuming company Automation.

The next update/qualification must be explicitly user-controlled on the existing company installation. Preserve Script Properties, Tasks, Review, Message State, Outbox, authority ledger, Calendar identity and scan/start boundary. Do not rerun fresh Setup, erase state, change accounts, or create another Calendar. Stop Automation and establish a quiescent state before any later code replacement; replacing a file with Automation OFF defaults does not itself switch off persisted Automation. After an authorized update and readiness check, the acceptance discriminator is an eligible accepted Task reaching the dedicated Calendar through normal scheduled operation without manually draining it. One event and truthful Task/Outbox state, followed by no duplicate event, are required. A manual Calendar-sync success alone is not automatic-path acceptance.

No company update, email send, credential access, provider call, OAuth/Trigger mutation or Calendar operation is authorized to Codex by this review. Further Codex work, if needed after new evidence, must use `0041-CODEX-02`; do not rerun CODEX-01.

## Strategy Reset and Completion Latch

Transition `BUILD -> QUALIFICATION` within Work 0041: the repository-level gap is fixed and accepted; now optimize for company-use evidence rather than additional hardening. Preserve previous Work 0039/0040 acceptance and the successful company Gemini target-email observation.

Dispatch BUILD latch: applied.
Work 0041 latch: not applied. Company Calendar E2E and the no-new-mail FAILED disposition remain required.

Work ID: `0041`
Dispatch ID: `0041-CODEX-01`
BALL: `USER`
STATUS: `ACTION_REQUIRED`
