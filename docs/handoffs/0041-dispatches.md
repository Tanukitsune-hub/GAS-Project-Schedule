# Work 0041 — Dispatch Ledger

WORK_ID: `0041`
CURRENT_DISPATCH_ID: `0041-CODEX-01`
DISPATCH_STATUS: `ACCEPTED`
ACTIVE_CODEX_DISPATCH: `NONE`
BALL: `USER`
STATUS: `ACTION_REQUIRED`
MODE: `QUALIFICATION`

## Primary Outcome

Converge the company-primary Gemini + governed Task/Review + dedicated `自動期日管理` Calendar path to safely usable operation. The non-live Calendar scheduled-drain BUILD is now accepted and merged. Work-wide completion still requires truthful company-runtime evidence.

## Dispatch history and Strategy Reset

| Dispatch | Outcome | Disposition |
|---|---|---|
| N/A, initial Route A | Company setup/Gemini evidence and two unresolved runtime symptoms recorded | Retained |
| `0041-CODEX-01` | Proved and repaired standalone Calendar Outbox scheduling; produced Code 2.8.27 and Draft PR #56 | ACCEPTED by ChatGPT; merged |

The earlier `QUALIFICATION -> BUILD` reset addressed a reproducible repository-level scheduling gap. The review now returns this same Work to `QUALIFICATION`; no active Codex run remains. The last dispatch ID is retained for traceability, not as an instruction to execute it again.

Instruction: `docs/handoffs/0041-CODEX-01-calendar-runtime-remediation-instruction.md`.
Report: `docs/handoffs/0041-CODEX-01-calendar-runtime-remediation-report.md`.
Review: `docs/handoffs/0041-CODEX-01-review.md`.
Branch: `codex/0041-calendar-runtime-remediation`.
Reviewed head: `7de465b03af4e3f412392ab02345d363efa766f1`.
Merge: `9d46290da5612beef8f94d1aff40890ab430eae9` / PR #56.

## Accepted evidence

Historical user-reported company evidence remains unchanged: setup completed; Gemini credential configured in company Script Properties without copying its value; five-minute Automation can be enabled; an eligible target email completed scheduled Gmail/Gemini processing. The no-new-mail FAILED observation and missing expected Calendar projection are accepted observations of unresolved symptoms, not PASS results.

Company OpenAI means Azure OpenAI. The separate GAS-to-Azure smoke result `HTTP 403 / PERMISSION_OR_NETWORK_DENIED` remains outside this Work's Calendar remedy.

Repository evidence now establishes the standalone Outbox consumer after a Message is DONE. The scheduled worker shares its lease, soft budget and remaining Calendar allowance with the existing claim/CAS path. Review/eligibility, authority, schema/migration, manifest, provider and Trigger implementations are preserved. Focused tests cover the post-Review path and CREATE/UPDATE/DELETE/NOOP, bounds, failures and healthy idle.

Final-head push CI `33940502943` and PR CI `33940504456`: SUCCESS. Inspected push job: 13/13 checks, 92 suites, missing 0 / extra 0; release parity/rebuild, frozen-path preservation and secret scan PASS. Merge-head main CI `33941081434` / #594: SUCCESS.

Post-acceptance Route A repository-integrity repair: main CI #596 at `85be0cd5d4ebbc0f3d01c45c9b0087bbebf9c08d` failed only `work_0029_active_document_integrity_test.js` after the accepted-current-status synchronization intentionally compacted `CURRENT_STATUS.md` and preserved the prior historical sections in `docs/handoffs/0041-preacceptance-current-status.md`. ChatGPT kept the historical lineage assertions, redirected those assertions to the preserved historical file, added current Work 0041 status assertions, and added the preserved file to the mojibake scan. Product source, release packages and accepted company bundle were untouched. Repair commit `032af32a0b9d4db870d5a89d581e887161c0e371`; main CI `33942504863` / #597: SUCCESS with 13/13 checks, 92 suites, release/lineage PASS and secret scan 0 hits. This did not reopen CODEX-01 or create CODEX-02.

## Current decisive action and remaining evidence

Current action is user read-only evidence: normalized `error_code` and `stage`/subsystem from one existing no-new-mail FAILED scheduled run. No fresh failing run or private data is requested.

Company Code 2.8.27 update and Calendar E2E remain NOT_EXECUTED / NOT_ACCEPTED. A subsequent explicitly user-controlled update must preserve all existing business and identity state, establish Automation-OFF/quiescence before replacement, and use the exact accepted candidate. Ordinary scheduled processing, not routine manual `Calendar同期を1件処理`, must project a Calendar-eligible accepted Task and must not duplicate its managed event.

A zero-Gmail-candidate run is not automatically healthy idle; Calendar/backlog/system failures must remain visible. The observed company FAILED cause was not reproduced or fixed by CODEX-01. Local healthy-idle PASS does not close that company symptom.

## Closed conclusions

- Work 0039 product/release/bundle and Work 0040 transport acceptance remain closed; historical source/releases/delivery evidence are not rewritten.
- Company Gemini target-email processing is accepted user evidence; company Calendar E2E is not accepted.
- High-impact Review and Calendar eligibility remain unchanged.
- No new Trigger, schema migration, provider behavior change or external permission broadening is part of this remedy.
- Calendar setup/readiness is not event E2E; local/CI results are not company-runtime PASS.
- Direct OpenAI is not the intended company provider; Azure remains separate and deferred.
- No credentials, company content, private IDs/URLs or raw provider errors/payloads may be copied into chat/GitHub.
- No Codex live Workspace/provider action was executed or is newly authorized.

## Attempt bounds and completion

No new Codex retry is authorized. A new Codex instruction after this return would be `0041-CODEX-02`, retaining Work 0041. For later live qualification, use a bounded test and stop on an unexpected failure or ownership/data-integrity issue rather than retrying blindly. A missing company observation is not grounds to reopen the accepted repository implementation without contrary evidence.

BUILD/integration BLOCKER: NONE.
Work-level required evidence: company Calendar E2E plus no-new-mail FAILED disposition.
Dispatch BUILD completion latch: APPLIED.
Work completion latch: NOT_APPLIED.

WORK_ID: `0041`
CURRENT_DISPATCH_ID: `0041-CODEX-01`
DISPATCH_STATUS: `ACCEPTED`
ACTIVE_CODEX_DISPATCH: `NONE`
BALL: `USER`
STATUS: `ACTION_REQUIRED`
