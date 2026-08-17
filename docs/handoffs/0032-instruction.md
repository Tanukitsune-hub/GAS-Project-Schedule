# Work 0032 — Gemini Runtime Diagnostics, Failure Finalization, and Synthetic Candidate Pinning

## Outcome

Make the next single user-controlled real Gemini synthetic validation diagnostically decisive and recoverable without weakening any privacy, fail-closed, Automation-OFF, or one-request boundary.

Work 0032 must ensure that:

1. a failed Gemini request exposes only bounded machine-safe diagnostics needed to identify the contract failure;
2. a failed external-AI attempt cannot silently leave the selected Message in an unresolved `CLAIMED` state without an explicit safe finalization status;
3. the Gemini synthetic validation processes only the exact approved fresh candidate selected by its synthetic guard and cannot be hijacked by older retryable/stale Message State rows;
4. the existing Gemini API request contract is not changed speculatively before the next live diagnostic provides evidence.

Highest permitted implementation status before the next user live call:

`READY_FOR_USER_GEMINI_DIAGNOSTIC_ONE_MESSAGE_RETRY`

## Route and recommended Codex model

Route: `C — Codex implement/validate`.

Recommended model: **Sol High**.

Rationale: the residual work is no longer a routine one-line repair. It combines an unresolved live-provider failure, privacy-safe observability, Message State failure-finalization semantics, and exact-candidate routing. The implementation must reason across `20_GeminiProvider.gs`, `07_AiAdapter.gs`, `18_Worker.gs`, `04_MessageStateRepository.gs`, logging/error handling, tests, and release/placement boundaries.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Branch: `codex/0032-gemini-runtime-diagnostics-hardening`
- Starting commit: `c653bd2736e8f98b1385822c74583744dea86c0e`
- Parent Work: `0031`
- Parent report: `docs/handoffs/0031-report.md`
- Parent PR: `#46`
- Current candidate: Code `2.8.18-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- TEST_MODE: `true`
- Automation: `OFF`

## Mandatory repository setup and subagents

Before starting work:

1. read the root `AGENTS.md` and every closer applicable `AGENTS.md`;
2. identify the repository-specific subagent-use policy and follow it except for the established task-specific override below;
3. read this instruction completely;
4. read `CURRENT_STATUS.md`, `DECISIONS.md`, `PROJECT_CONTEXT.md`, and `MASTER_PLAN.md` as required by repository governance;
5. verify exact branch/ref, remote/upstream state, and a clean worktree before implementation.

### Task-specific subagent override

Preserve the established Work 0031 execution rule:

- standard Codex subagents are mandatory and must be used actively and proportionately for independent diagnosis, implementation review, and validation;
- do not invoke repository-defined Luna or Terra custom agents;
- do not modify `AGENTS.md` or `.codex`.

Use subagents without duplicate overlapping writers. At minimum, use independent perspectives for provider-contract/error-envelope review and Message State/failure-path review, then an independent verification pass.

## Confirmed live evidence from ChatGPT review

A second fresh, exact synthetic Gmail Message was prepared correctly and was the only approved candidate. The user ran `Gemini synthetic validation (one request)` once.

The safe result showed:

- `status = FAILED`;
- candidate count `1`;
- AI called `true`;
- Task created/updated `0`;
- Review `0`;
- Calendar jobs `0`;
- Automation runtime state `CONSISTENT` and disabled;
- scheduled/clock trigger counts `0`.

Read-only inspection after that run found:

- the fresh Message State remains `CLAIMED` at resume stage `CLASSIFY`;
- preprocessing completed and a preprocess hash exists;
- no classification was persisted;
- retry count remains `0`;
- no safe `last_error_code` was persisted for this second attempt;
- no new Error/Dead Letter row was persisted for this second attempt;
- the Gmail system failure label was applied, proving the outer failure path progressed beyond the provider call;
- the user-visible synthetic result omitted the worker's internal safe failure note/code and did not indicate whether failure-checkpoint finalization succeeded.

Do not place any Message ID, Thread ID, run ID, account address, target ID, private URL, request payload, provider body, API key, or other private runtime identifier into source, tests, report, PR, or chat.

Historical failed rows and the currently stuck live row are evidence. Do not edit, reset, retry, delete, revive, relabel, or otherwise mutate them in Codex.

## Current API facts that constrain this Work

As of 2026-08-17, Google primary documentation states:

- the Interactions API is available under both `v1beta` and stable `v1`;
- `v1beta` create endpoint examples use `POST https://generativelanguage.googleapis.com/v1beta/interactions`;
- the current request shape includes `model`, `input`, `system_instruction`, `response_format`, `generation_config`, `store`, `stream`, and `background`;
- `thinking_level`, `thinking_summaries`, and `max_output_tokens` are valid generation settings;
- Interactions errors return an `error` object with a machine-readable `code` and human-readable `message`;
- documented machine codes include values such as `invalid_request`, `parameter_unknown`, and `authentication`;
- structured output supports the JSON Schema subset currently used by the project, but Google explicitly notes that very large or deeply nested schemas can still be rejected.

Primary references:

- `https://ai.google.dev/api/interactions-api`
- `https://ai.google.dev/gemini-api/docs/api-versions`
- `https://ai.google.dev/gemini-api/docs/api-errors`
- `https://ai.google.dev/gemini-api/docs/structured-output`
- `https://ai.google.dev/gemini-api/docs/interactions-breaking-changes-may-2026`

The prior Work 0031 conclusion that `/v1` itself was definitively invalid is therefore superseded. **Do not switch endpoints again in this Work solely from assumption.** Keep the current `/v1beta/interactions` endpoint unless a primary-source contract audit and deterministic local evidence reveal a different exact defect that can be repaired without another live call. If the cause remains uncertain, instrument safely and leave the request contract unchanged for the next live diagnostic.

## Required scope

### 1. Privacy-safe provider diagnostic envelope

Make the existing Gemini transport preserve only the bounded machine-safe information required to classify a failed request.

For non-2xx Interactions responses, it is permitted to read the response text in memory solely to parse the JSON error envelope and immediately extract safe fields. The raw response must never be returned, logged, stored, or included in an exception/report.

At minimum make available to the synthetic-validation error path:

- numeric HTTP status when valid;
- machine-readable provider error code only when it passes a strict bounded safe-token rule, for example lower-case snake_case with a short maximum length;
- no provider human `message`;
- no `details`, headers, request payload, response body, credential, interaction ID, trace ID, or other provider content.

For a 2xx envelope that cannot be accepted, expose only similarly bounded classification such as the accepted interaction status enum if useful. Never expose thought content/signatures or model output when the response is being treated as invalid.

Unknown/malformed provider error codes must collapse to a fixed safe sentinel rather than forwarding arbitrary text.

### 2. User-visible safe synthetic failure result

The existing `Gemini synthetic validation` UI result must include enough allowlisted diagnostic state to make one live attempt actionable without exposing private data.

Include bounded fields equivalent to:

- Work OS safe `error_code`;
- safe `error_stage`;
- `checkpoint` / resume-stage state;
- failure-checkpoint finalization state such as `RECORDED`, `PENDING`, or `NOT_APPLICABLE`;
- provider HTTP status if observed;
- provider machine error code if safely parsed;
- provider interaction status if safely classified and materially useful.

Exact field names may follow existing repository conventions, but values must be bounded and allowlisted. Do not surface the original exception message, provider human message, request/response body, Gmail content, IDs, credential state beyond the existing boolean readiness indicator, or any raw external string.

On success, preserve the current compact safe result and add no unnecessary provider content.

### 3. Failure-checkpoint finalization must be independent of unrelated contexts

Harden the external-AI worker failure path so that recording a Message failure does not depend on successfully creating unrelated Task or Calendar contexts.

The current outer catch uses a helper that constructs Message, Task, and Outbox contexts before attempting `recordFailureInContext`. For the failure-finalization operation, use the smallest required Message State context under Script Lock.

Acceptance behavior:

- when a retryable/non-retryable external-AI error occurs while the selected Message is still owned by the current run, the Message State is deterministically moved to the repository-defined RETRY or DEAD state and the safe error is persisted;
- if that finalization itself cannot be committed, the returned synthetic result must explicitly say finalization is `PENDING` and expose only a safe fixed/internal checkpoint-finalization code;
- a finalization failure must not masquerade as a clean recorded failure;
- privacy-safe operational error recording may be used, but must not introduce raw IDs/body/payload/provider message.

Do not weaken ownership/CAS rules to force a write.

### 4. Exact synthetic candidate pinning

The synthetic validation must process only the exact fresh candidate that passed the Gemini synthetic guard.

Current generic worker stage preparation can consult pre-existing eligible Message State records before discovering/using the supplied candidate. That is unacceptable for this special one-message live validation because old RETRY/stale-CLAIMED rows must never substitute for the user's freshly approved message.

Implement an explicit fail-closed pin for the internal Gemini synthetic capability so that:

- the selected approved candidate is the only Message eligible for this run;
- stale CLAIMED, RETRY, PREPROCESSED, or other historical resumable records cannot hijack the synthetic run;
- an existing terminal state for the exact selected Message is refused rather than silently switching to another Message;
- generic manual/automatic worker behavior outside the synthetic capability is unchanged.

Do not mutate historical Message State rows as part of pinning.

### 5. Provider-contract audit without speculative redesign

Independently audit the current request against the primary Google Interactions documentation, including:

- endpoint version;
- request top-level fields;
- `response_format` object/array contract;
- current JSON Schema subset;
- generation configuration;
- synchronous response envelope and error envelope;
- thought/model_output step shapes.

If a deterministic and primary-source-backed defect is found, fix only that defect and add focused regression coverage. Do not:

- switch API versions merely to try another endpoint;
- remove structured output merely to make the request smaller;
- weaken the application-side strict schema;
- add fallback endpoints/models/providers;
- add automatic retries;
- make a live Gemini request in Codex.

If schema complexity remains only a plausible hypothesis, preserve the schema and rely on the newly safe provider error code in the next user live call.

### 6. Regression coverage

Add focused tests covering at least:

1. non-2xx Gemini error envelope with a safe code is reduced to HTTP status + safe machine code only;
2. a malicious/sensitive provider `message` and arbitrary extra fields never reach returned UI diagnostics, Error rows, logs, or thrown safe messages;
3. malformed/overlong provider error code collapses to a fixed safe sentinel;
4. 400 `invalid_request` and 400 `parameter_unknown` remain distinguishable by safe provider code while Work OS classification remains fail-closed;
5. 401/403/429/5xx existing Work OS mappings remain intact;
6. 2xx valid `thought* -> model_output` response still succeeds under Work 0030 parser rules;
7. 2xx malformed/unsupported response still fails closed with bounded safe diagnostics;
8. an external-AI failure at CLASSIFY records RETRY/DEAD using only the Message State context and does not require Task/Outbox context construction;
9. a simulated failure-finalization fault is surfaced as explicit safe `PENDING`, not silently lost;
10. the current UI/result contract contains no run ID, Gmail/Thread/Task/provider interaction ID, body, credential, private URL, or raw provider message;
11. with another historical stale/retry/resumable Message present, Gemini synthetic validation still processes only the explicitly selected fresh candidate;
12. exact candidate already terminal/conflicted fails closed and does not fall through to another candidate;
13. Work 0029 Automation/synthetic/one-call/no-Mock-fallback guards and Work 0030 parser regressions remain green.

No real network call in local/CI tests.

### 7. Candidate and release identity

Because deployed Apps Script bytes change, create the next coherent candidate:

- Code `2.8.19-prepilot`;
- Schema `2.6` unchanged;
- AI Schema `2.0` unchanged unless a truly unavoidable schema-version change is discovered and escalated as BLOCKER before changing it;
- Migration `3` unchanged;
- TEST_MODE `true` in Phase 8B;
- Automation `OFF`.

Regenerate the established Phase 8B/8C packages, manifests, checksums, current selectors, version-bound docs/tests, and release verifiers required by repository convention. Preserve historical release evidence.

### 8. Validation

Run focused tests plus the complete current local gate. Require:

- all current `*_test.js` suites PASS;
- Apps Script static validation PASS;
- release/checksum/source parity PASS;
- A19/B19 direct-child lineage PASS under repository convention;
- secret/private-ID/local-state scan PASS;
- `git diff --check` PASS;
- canonical source inventory remains exactly 23 `.gs` plus `appsscript.json` unless a directly required source module addition is justified; prefer no new deployed module if existing ownership is clear.

### 9. Existing-target placement

Before any Google target mutation:

- commit/push exact implementation head;
- require exact-head CI success;
- confirm clean worktree and no secrets/private identifiers.

Then reuse only the existing personal-synthetic Apps Script target:

- at most one guarded source push;
- at most one isolated pull-back parity check;
- exact canonical payload parity;
- no new Spreadsheet, Apps Script project, account, auth profile, deployment, or Cloud project;
- do not inspect, read, print, modify, rotate, overwrite, or delete Script Properties or the Gemini API key;
- do not invoke any Apps Script function;
- do not access or mutate Gmail, Task, Review, Calendar, Setup, Diagnostics, Dashboard, Trigger, Automation, Message State, or Error runtime;
- do not make a real Gemini request.

The current live CLAIMED row, prior DEAD rows, and Gmail labels must remain untouched by Codex.

## Explicit non-goals

- No production/company data.
- No company-PC deployment.
- No Automation enablement.
- No Calendar lifecycle retest.
- No historical Error/Dead Letter/Message State cleanup.
- No live provider call by Codex.
- No API-key operation.
- No endpoint/model/provider fallback.
- No generic worker redesign beyond the exact synthetic candidate pin and failure-finalization boundary required here.
- No broad AI prompt/schema simplification without primary-source proof of a defect.
- No merge/rebase/force-push.

## Acceptance checks

PASS requires all of the following:

1. the next live synthetic failure, if any, will expose a bounded Work OS safe code/stage plus safe provider HTTP/machine-code evidence when available;
2. raw provider messages/bodies and private runtime identifiers remain impossible to surface through the new diagnostic path;
3. external-AI failure checkpoint finalization uses only the required Message State boundary and cannot silently leave an unreported stuck claim;
4. finalization failure is explicitly represented as safe `PENDING` evidence;
5. Gemini synthetic processing is pinned to the exact approved candidate and cannot select historical eligible rows;
6. no speculative API-version/model/fallback change is introduced;
7. any provider-contract repair is directly supported by current primary Google documentation and focused deterministic tests;
8. Code `2.8.19-prepilot` release lineage and source/release parity are coherent;
9. full local gate and exact-head CI pass;
10. one authorized existing-target placement and pull-back parity pass;
11. all live Gemini/Gmail/Task/Review/Calendar/Apps Script function/trigger/Automation/credential-operation counts remain zero in Codex;
12. no private identifier, credential, provider human message, or raw external payload enters GitHub/report/chat.

## Stop / escalation conditions

Stop and report BLOCKER if:

- primary Google documentation and current request contract cannot be reconciled without materially redesigning the provider integration;
- safe provider error extraction would require retaining/logging raw external response bodies;
- failure-checkpoint finalization cannot be made deterministic without weakening Message ownership/CAS safety;
- exact candidate pinning requires changing generic production scheduling semantics rather than the internal synthetic capability boundary;
- local/full validation or release parity cannot be green without unrelated changes;
- exact-head CI fails for a product-relevant reason;
- existing-target identity/parity cannot be proven safely;
- any credential/private identifier would need exposure.

Do not work around a blocker with a second endpoint, automatic retry, alternate provider/account, or relaxed guard.

## Git / PR / report requirements

- Keep branch: `codex/0032-gemini-runtime-diagnostics-hardening`.
- Base the Draft PR on `codex/0031-gemini-v1beta-endpoint-runtime-validation`.
- Write `docs/handoffs/0032-report.md`.
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
