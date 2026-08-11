# Work 0030 — Gemini Thinking-Step Parser Remediation

## Outcome

Fix the last blocker before the first real Gemini API request: accept the actual Gemini Interactions `steps` shape produced by a thinking model without weakening response validation, then regenerate/place the next coherent pre-pilot candidate.

Highest permitted success status:

`READY_FOR_USER_GEMINI_KEY_CONFIGURATION_AND_ONE_MESSAGE_VALIDATION`

## Why Codex is needed

This is a small source change, but it changes deployed bytes and therefore requires executable regression tests, release regeneration, lineage/checksum validation, exact-head CI, and one bounded existing-target placement.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Branch: `codex/0030-gemini-thinking-step-parser-remediation`
- Starting commit: `a39824c76009df1f46a5a9afa83a2103480d9e49`
- Parent Work: `0029`
- Parent report: `docs/handoffs/0029-report.md`
- Parent PR: `#43`
- Independent review evidence: PR #43 comment recording the Gemini thought-step blocker
- Current candidate: Code `2.8.16-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- TEST_MODE: true
- Automation: OFF

## Root cause

`20_GeminiProvider.gs::responseObject()` currently requires `response.steps.length === 1` and requires that sole step to be `model_output`.

Gemini 3.6 Flash is a thinking model. Current official Gemini Interactions documentation states that thinking is represented by dedicated `thought` steps in the `steps` array, and a thought step may contain only a signature when `thinking_summaries: "none"`. Therefore a valid response can contain one or more `thought` steps before the final `model_output`. The current parser would reject that valid response as `E_AI_PROVIDER_RESPONSE`.

The current local fake tests only model a single `model_output` step, so they miss the protocol shape.

## Mandatory Codex setup

Before work:

1. read all applicable `AGENTS.md` files;
2. identify the repository-specific subagent policy;
3. follow the task-specific override below;
4. verify branch/ref, fetch, clean worktree, and safe synchronization.

### Task-specific subagent override

- Standard Codex subagents are mandatory and must be used proportionately for independent protocol review and verification.
- Do not invoke repository-defined Luna or Terra custom agents.
- Do not modify `AGENTS.md` or `.codex`.

## Required scope

### 1. Repair only the Gemini response-step parser

Primary source target:

`implementation/GoogleSpreadsheet/apps-script-v2/20_GeminiProvider.gs`

Keep the current request contract unchanged unless a concrete test proves otherwise:

- stable `/v1/interactions` endpoint;
- `gemini-3.6-flash`;
- `response_format` structured JSON;
- `thinking_level: low`;
- `thinking_summaries: none`;
- `max_output_tokens: 4096`;
- `store:false`, `stream:false`, `background:false`;
- no tools, retry, or Mock fallback.

The parser must:

- require interaction `status === "completed"`;
- accept zero or more `thought` steps;
- ignore thought `signature` / `summary` content entirely and never persist/log it;
- require exactly one usable `model_output` step;
- require exactly one usable text content block for the structured JSON classification, unless the official current contract proves a different minimal robust shape is necessary;
- reject unexpected step types, missing model output, multiple model outputs, multiple/invalid output content blocks, malformed structures, and incomplete/failed interactions;
- continue returning only the extracted final classification JSON text into the existing strict `WorkOsAiAdapter` validator.

Do not parse, expose, log, hash, persist, or echo thought signatures/summaries.

### 2. Add focused protocol-shape tests

At minimum cover:

- `model_output` only — PASS;
- signature-only `thought` then `model_output` — PASS;
- multiple valid `thought` steps then one `model_output` — PASS;
- thought with summary present then one `model_output` — PASS while summary is ignored;
- unexpected function/tool/user step — FAIL closed;
- multiple `model_output` steps — FAIL closed;
- missing `model_output` — FAIL closed;
- malformed output content — FAIL closed;
- incomplete/failed status — FAIL closed;
- error messages/evidence contain no thought signature, summary, provider body, credential, or message content.

Keep the existing Work 0029 Automation, callable entrypoint, synthetic fixture, credential, one-call, UTF-8/history, and no-fallback tests intact.

### 3. Candidate and release identity

Because deployed bytes change, create the next coherent candidate:

- Code `2.8.17-prepilot`;
- Schema `2.6` unchanged;
- AI Schema `2.0` unchanged;
- Migration `3` unchanged;
- TEST_MODE true in Phase 8B;
- Automation OFF.

Regenerate the established Phase 8B/8C release packages and all current version-bound manifests/checksums/verifiers/docs required by repository convention. Preserve historical 2.8.14 / 2.8.15 / 2.8.16 evidence.

Do not redesign or refactor the release system.

### 4. Validation

Run focused parser/provider tests plus the complete current local gate. Require:

- all current `*_test.js` suites PASS;
- Apps Script validation PASS;
- release/checksum/parity PASS;
- A17/B17 direct-child lineage PASS;
- secret/local-state scan PASS;
- `git diff --check` PASS;
- canonical payload remains exactly 23 `.gs` plus `appsscript.json`.

No real network/provider/Google call in local tests.

### 5. Pre-Google CI and existing-target placement

Before target mutation:

- commit/push exact implementation head;
- require exact-head CI success;
- confirm clean worktree and no secrets.

Then reuse only the existing personal-synthetic Apps Script target:

- at most one guarded push;
- at most one isolated pull-back parity check;
- exact 24-file semantic/hash parity;
- no new target/account/deployment/Cloud project;
- no Apps Script function invocation;
- no Gmail/Task/Review/Calendar/Setup/Diagnostic/Dashboard/Trigger/Automation operation;
- no real Gemini request or real API-key operation.

## Explicitly prohibited

- Do not configure, read, print, rotate, or inspect a real Gemini API key.
- Do not make a real Gemini request.
- Do not run the new readiness or synthetic validation function.
- Do not access Gmail runtime or mutate Task/Review/Calendar.
- Do not enable/modify Automation or triggers.
- Do not merge/rebase/force-push.

## Acceptance

PASS requires the real Interactions thinking-step shape to be accepted without accepting unsafe/ambiguous step shapes, all checks/CI/release/placement evidence to pass, and all live runtime/provider operation counts to remain zero.

Final status on PASS:

`READY_FOR_USER_GEMINI_KEY_CONFIGURATION_AND_ONE_MESSAGE_VALIDATION`

## Report / PR

Write `docs/handoffs/0030-report.md`, commit/push all work, and update/create the Draft PR against `codex/0029-gemini-runtime-activation-remediation`. Keep Draft/Open/Unmerged and verify final report-head CI.

Report only privacy-safe evidence and explicit external-call counts.

Return in Codex chat only:

Work ID
Report path
Final commit
Branch
PR
BLOCKER status
