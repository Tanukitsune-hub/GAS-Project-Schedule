# Work 0031 — Gemini v1beta Endpoint Remediation and Runtime Continuation

## Outcome

Repair the confirmed Gemini Interactions REST endpoint defect discovered during the first real synthetic API attempt, regenerate/place the next coherent pre-pilot candidate, and leave the existing personal-synthetic target ready for the user to rerun the same one-message Gemini validation.

This Work remains the same Work ID as the current real-Gemini validation effort. Do not create a new Work ID for this repair.

Highest permitted implementation status before the user reruns the live menu action:

`READY_FOR_USER_GEMINI_ONE_MESSAGE_RETRY`

## Why Codex is needed

The implementation change is tiny and fully decided, but deployed Apps Script bytes change. Codex is required only for bounded implementation, executable tests, release regeneration, exact-head CI, and one controlled existing-target placement/parity check.

## Recommended Codex model

**Luna Max.** The root cause, design, file target, exact endpoint, acceptance checks, and non-goals are fully settled. Residual work is bounded implementation and validation; no architecture or open-ended planning is required.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Branch: `codex/0031-gemini-v1beta-endpoint-runtime-validation`
- Starting commit: `cc6745cee06d65d6ea5bd00d8845e4b394fb363e`
- Parent Work: `0030`
- Parent report: `docs/handoffs/0030-report.md`
- Parent PR: `#44`
- Current candidate: Code `2.8.17-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- TEST_MODE: true
- Automation: OFF

## ChatGPT-completed investigation

The user configured the real Gemini credential in the intended Script Property. Network-free readiness returned READY with:

- credential configured;
- GEMINI provider registered;
- Automation runtime state consistent and disabled;
- scheduled/clock trigger counts zero;
- external request not yet performed at readiness.

The user then ran the one-message synthetic validation. The candidate passed the synthetic guards and the real Gemini transport was called once, but processing failed before Task creation. The existing private sandbox Error sheet recorded only the privacy-safe classification:

- stage: `AI_REQUEST`
- code: `E_AI_INVALID_REQUEST`
- retryable behavior: non-retryable / fail-closed
- Task/Review/Calendar side effects: zero

No raw provider body, credential, message ID, account identity, target ID, or private URL is retained in GitHub.

ChatGPT rechecked the current official Google Gemini Interactions documentation. The current REST creation endpoint is:

`https://generativelanguage.googleapis.com/v1beta/interactions`

The deployed Work 0030 source instead uses:

`https://generativelanguage.googleapis.com/v1/interactions`

This mismatch is the confirmed source defect to repair. Request fields (`model`, `input`, `system_instruction`, `response_format`, `generation_config`, `store`, `stream`, `background`) and the Work 0030 `thought* model_output` parser are otherwise retained unless a focused regression demonstrates a directly related issue.

The exact new synthetic email is now correctly formatted and the intended candidate count is one. Do not change the synthetic subject/body contract in this Work.

## Mandatory Codex setup

Before implementation:

1. read all applicable `AGENTS.md` files;
2. identify the repository-specific subagent-use policy;
3. follow the task-specific override below;
4. verify the exact branch/ref, fetch state, and clean worktree.

### Task-specific subagent override

- Standard Codex subagents are mandatory and must be used actively and proportionately for independent protocol review and verification.
- Do not invoke repository-defined Luna or Terra custom agents.
- Do not modify `AGENTS.md` or `.codex`.

## Required scope

### 1. Repair the endpoint only

Primary source target:

`implementation/GoogleSpreadsheet/apps-script-v2/20_GeminiProvider.gs`

Change the Gemini Interactions endpoint to exactly:

`https://generativelanguage.googleapis.com/v1beta/interactions`

Do not add endpoint fallback, dual-call logic, retries, model fallback, or alternate providers.

Preserve:

- model `gemini-3.6-flash`;
- `x-goog-api-key` authentication;
- structured JSON `response_format`;
- `thinking_level: low`;
- `thinking_summaries: none`;
- `max_output_tokens: 4096`;
- `store:false`, `stream:false`, `background:false`;
- no tools;
- one-call limit;
- no Mock fallback;
- Work 0030 `thought* model_output` fail-closed parser;
- credential access through the fixed Script Property reference only.

### 2. Add/adjust focused endpoint regression coverage

Add or update focused tests so they prove at minimum:

- transport calls exactly `https://generativelanguage.googleapis.com/v1beta/interactions`;
- the old `/v1/interactions` literal is absent from the active deployed source and current generated release payloads;
- the request remains one POST with only the expected API-key header and existing bounded body contract;
- existing Work 0029/0030 synthetic guard, Automation guard, provider, response-parser, no-retry, and no-fallback tests still pass;
- no real network/provider call occurs in local/CI tests.

Do not broaden into unrelated Gemini API redesign.

### 3. Candidate/release identity

Because deployed bytes change, create the next coherent candidate:

- Code `2.8.18-prepilot`;
- Schema `2.6` unchanged;
- AI Schema `2.0` unchanged;
- Migration `3` unchanged;
- TEST_MODE true in Phase 8B;
- Automation OFF.

Regenerate the established Phase 8B/8C packages, manifests, checksums, current selectors, version-bound docs/tests, and release verifiers required by repository convention. Preserve historical 2.8.14 through 2.8.17 evidence.

Do not refactor the release system.

### 4. Validation

Run focused endpoint/provider/parser/runtime-guard tests plus the complete current local gate. Require:

- all current `*_test.js` suites PASS;
- Apps Script static validation PASS;
- release/checksum/source parity PASS;
- A18/B18 direct-child lineage PASS;
- secret/local-state scan PASS;
- `git diff --check` PASS;
- canonical deployed source remains exactly 23 `.gs` plus `appsscript.json`.

No real network/provider/Google call in local tests.

### 5. Pre-Google CI and existing-target placement

Before any target mutation:

- commit/push exact implementation head;
- require exact-head GitHub Actions success;
- confirm clean worktree and no secrets.

Then reuse only the existing personal-synthetic Apps Script target:

- at most one guarded push;
- at most one isolated pull-back parity check;
- exact canonical 24-file semantic/hash parity;
- no new target/account/deployment/Cloud project;
- do not modify or inspect Script Properties;
- do not read, print, rotate, overwrite, or delete the user's Gemini key;
- do not invoke any Apps Script function;
- do not access Gmail/Task/Review/Calendar/Setup/Diagnostics/Dashboard/Triggers/Automation runtime;
- do not make a real Gemini request in Codex.

The user's existing Script Property must be left untouched so the user can rerun the menu validation after ChatGPT reviews this Work.

## Explicit non-goals

- No production/company data.
- No company-PC deployment.
- No Automation enablement.
- No Calendar lifecycle retest.
- No cleanup of historical Dead Letter rows.
- No API-key operation.
- No real Gemini runtime call by Codex.
- No merge/rebase/force-push.

## Acceptance checks

PASS requires all of the following:

1. active endpoint is exactly `/v1beta/interactions`;
2. old active `/v1/interactions` endpoint is eliminated from current source/release selectors;
3. existing Gemini request/security/parser behavior remains intact;
4. Code `2.8.18-prepilot` release and A18/B18 lineage are coherent;
5. full local gate and exact-head CI pass;
6. one authorized existing-target push and optional one pull parity pass;
7. all real Gemini, Gmail, Task, Review, Calendar, Apps Script function, trigger, Automation, and credential-operation counts remain zero in Codex;
8. no credential/private identifier/raw provider body enters source, GitHub, report, or chat.

## Stop / escalation conditions

Stop and report BLOCKER if:

- current official primary Google documentation no longer identifies `/v1beta/interactions` as the creation endpoint;
- fixing the endpoint requires a materially broader provider/API redesign;
- local/full validation or release parity cannot be made green without unrelated changes;
- exact-head CI fails for a product-relevant reason;
- existing-target identity/parity safety cannot be proven before placement;
- a real credential or private identifier would need to be exposed.

Do not work around a blocker with a second endpoint, retry, alternate account, or fallback provider.

## Git / PR / report requirements

- Keep branch: `codex/0031-gemini-v1beta-endpoint-runtime-validation`.
- Base the Draft PR on `codex/0030-gemini-thinking-step-parser-remediation`.
- Write `docs/handoffs/0031-report.md`.
- Commit and push all implementation/report work.
- Link instruction and report in the Draft PR.
- Keep PR Draft/Open/Unmerged.
- Verify final report-head CI.
- Finish with a clean worktree.

## Codex final response

Return only:

Work ID
Report path
Final commit
Branch
PR
BLOCKER status
