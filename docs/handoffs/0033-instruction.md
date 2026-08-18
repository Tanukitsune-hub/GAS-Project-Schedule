# Work 0033 — Gemini `invalid_request` Provider-Schema Compatibility Repair

## Outcome

Resolve the now-confirmed Gemini request-contract failure with the smallest safe change, then prepare exactly one new user-controlled synthetic E2E retry.

The live Code `2.8.19-prepilot` attempt returned only the following bounded evidence:

- Work OS code: `E_AI_INVALID_REQUEST`
- stage: `AI_REQUEST`
- provider HTTP status: `400`
- provider machine code: `invalid_request`
- checkpoint: `CLASSIFY`
- failure finalization: `RECORDED`
- Task/Review/Calendar side effects: zero
- Automation: consistently OFF with zero scheduled/clock triggers

This is material progress over the prior failure: Gmail selection, exact synthetic fixture validation, credential access, endpoint reachability, Automation guard, provider invocation, and failure checkpoint finalization are no longer unresolved. The remaining failure is inside the request accepted by the Gemini Interactions API.

Highest permitted status before the next live user call:

`READY_FOR_USER_GEMINI_E2E_RETRY_AFTER_SCHEMA_COMPATIBILITY_REPAIR`

## Route and recommended Codex model

Route: `C — Codex implement/validate`.

Recommended model: **Luna Max**.

Rationale: ChatGPT has already narrowed the failure to a provider `400 invalid_request` and audited the current Google primary documentation. The residual work is a bounded code-level verification and minimal schema-compatibility repair, followed by regression/release/placement checks. No broad architecture or unresolved product design remains.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Branch: `codex/0033-gemini-invalid-request-schema-compatibility`
- Starting commit: `53119f725ab128ec7b2875de3bef9dc1f93ff1eb`
- Parent Work: `0032`
- Parent PR: `#47`
- Parent report: `docs/handoffs/0032-report.md`
- Current candidate: Code `2.8.19-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- TEST_MODE: `true`
- Automation: `OFF`

## Mandatory repository setup and subagents

Before implementation:

1. read the root and all applicable closer `AGENTS.md` files;
2. identify and follow the repository-specific subagent policy;
3. actively use the repository-defined Luna subagents proportionately, including independent provider/schema inspection and independent final validation;
4. read this handoff completely;
5. read the current `CURRENT_STATUS.md`, `DECISIONS.md`, `PROJECT_CONTEXT.md`, and `MASTER_PLAN.md`;
6. verify exact branch/ref, remote/upstream state, and clean worktree.

Do not modify `AGENTS.md` or `.codex`.

## ChatGPT diagnosis and design decision

### Confirmed request fields that are not the primary hypothesis

Current Google primary documentation for the Interactions API documents all of the following used by the application:

- endpoint `POST https://generativelanguage.googleapis.com/v1beta/interactions`;
- model `gemini-3.6-flash` as a supported Interactions model;
- `input` as string/content;
- `system_instruction` as string;
- `response_format` as a text object or array with `mime_type=application/json` and `schema`;
- `stream`, `store`, and `background` booleans;
- `generation_config.max_output_tokens`;
- `generation_config.thinking_level=low`;
- `generation_config.thinking_summaries=none`.

Google also documents Gemini 3.6 Flash as supporting both structured outputs and thinking.

The provider returned `invalid_request`, not `parameter_unknown`, `authentication`, or `permission_denied`.

Therefore do **not** change endpoint, API key handling, model, header, prompt, Automation guard, parser, retry policy, or fallback behavior unless direct code inspection reveals a deterministic contradiction with current primary documentation.

### Leading hypothesis

The remaining unproven request component is the application’s detailed provider-facing JSON Schema under `response_format.schema`.

Google documents the individual keywords currently used (`properties`, `required`, `additionalProperties`, `enum`, `format`, `minimum`, `maximum`, `items`, `minItems`, `maxItems`, nullable type arrays), but also explicitly states that very large or deeply nested schemas can be rejected with a 400-level invalid request.

The application currently sends essentially the same highly strict schema used for post-response application validation. That strictness is not required for security at the provider boundary because `WorkOsAiAdapter.validateOutput()` already performs the authoritative fail-closed application validation after the model response.

### Design decision

Separate **provider generation guidance** from **authoritative application validation**.

Implement the smallest provider-facing schema projection that materially reduces schema complexity while preserving the same required output shape. The application-side strict AI Schema 2.0 validator remains unchanged and authoritative.

The provider-facing schema should:

- preserve the root classification object and its four required fields;
- preserve the `actions` array and the required action field names;
- preserve primitive/object/array/null types needed for parseable output;
- preserve the small action/domain enums where they materially guide output quality;
- preserve the `changes` object field names and primitive/null types;
- remove provider-side constraints that are redundant because the application validator already enforces them and that contribute to schema complexity, including exact-object closure and validation-only bounds/format constraints when safe to do so;
- never relax `WorkOsAiAdapter.validateOutput()` or Task/Review policy semantics.

Prefer deriving this projection deterministically from the canonical AI Schema rather than maintaining an unrelated parallel hand-written contract. If derivation is more complex or riskier than a small explicit provider-schema builder, use the simpler readable implementation and add drift tests tying its field names/enums to the canonical validator contract.

Do not remove `response_format` entirely. Do not rely on prompt-only JSON generation.

## Required scope

### 1. Verify the narrowed hypothesis in code

Inspect the exact current `buildRequest()` payload and `getOutputJsonSchema()` output.

Produce a deterministic local test/report that records only non-sensitive structural facts such as:

- provider schema serialized length;
- maximum nesting depth;
- property count;
- enum value count;
- number of nullable unions;
- number of `additionalProperties`, format, min/max, and array-bound constraints.

Do not include real email content, credentials, private IDs, or any runtime provider response.

Confirm that every non-schema top-level request field matches the current primary Interactions contract. If an actual non-schema contradiction is found, stop before broad changes and implement only the directly documented defect; explain why the leading schema hypothesis was superseded.

### 2. Add a provider-facing schema projection

Create a provider schema used only by `20_GeminiProvider.gs` when building `response_format.schema`.

Keep the canonical strict schema and `validateOutput()` unchanged.

The provider schema must be meaningfully simpler than the current canonical schema and must retain enough structure to guide Gemini to the existing exact JSON shape.

At minimum, regression tests must prove:

- provider schema and canonical schema have the same root field names;
- provider action field names cannot drift from the canonical action field set;
- provider enum values used for `action_type`, `deadline_basis`, `priority`, `calendar_category`, and `calendar_importance` match canonical enum values;
- provider schema does not introduce any field absent from the canonical schema;
- canonical `validateOutput()` still rejects extra fields, malformed dates, out-of-range confidence, too many actions/warnings, invalid enums, invalid `changes`, and action-semantic violations exactly as before.

### 3. Keep all Work 0032 diagnostics and safety

Preserve without weakening:

- bounded HTTP/provider-machine-code diagnostics;
- no provider human message/body persistence;
- Message-only failure finalization;
- explicit `RECORDED`/`PENDING` finalization state;
- exact synthetic candidate pinning;
- one-call limit;
- no automatic retry;
- no endpoint/model/provider fallback;
- Automation OFF guard;
- no Calendar API call in the synthetic validation.

### 4. Focused regression tests

Add focused coverage for at least:

1. provider-facing schema is structurally simpler than the canonical strict schema by deterministic metrics;
2. provider schema retains required root/action shape and canonical enum values;
3. strict canonical validator remains unchanged in behavior for representative invalid outputs;
4. current `400 invalid_request` safe diagnostics remain intact;
5. Work 0030 thought parser remains intact;
6. Work 0032 exact candidate pinning and Message-only finalization remain intact;
7. request still uses exactly `/v1beta/interactions`, `gemini-3.6-flash`, low thinking, no thought summaries, no store/stream/background, and no tools/fallback/retry;
8. no real Gemini request occurs in tests.

### 5. Candidate/release identity

Because deployed source bytes change, create the next candidate:

- Code `2.8.20-prepilot`;
- Schema `2.6` unchanged;
- AI Schema `2.0` unchanged — the authoritative application contract is not changing;
- Migration `3` unchanged;
- Phase 8B `TEST_MODE=true`;
- Automation `OFF`.

Generate the established A20/B20 source/release lineage, Phase 8B/8C packages, current selectors, manifests, checksums, docs/tests, and release verifiers required by repository convention.

### 6. Validation

Run focused tests and the complete current local gate. Require:

- all current `*_test.js` suites PASS;
- Apps Script static validation PASS;
- source/release/checksum parity PASS;
- A20/B20 direct-child lineage PASS;
- secret/private-ID/local-state scan PASS;
- `git diff --check` PASS;
- canonical source inventory remains 23 `.gs` plus `appsscript.json` unless a new deployed module is strictly necessary; prefer editing existing ownership boundaries.

### 7. Existing-target placement

After exact implementation head is committed/pushed and exact-head CI succeeds, reuse only the existing personal-synthetic Apps Script target:

- at most one guarded source push;
- at most one isolated pull-back parity check;
- no new Spreadsheet, Apps Script project, account, auth profile, deployment, or Cloud project;
- do not inspect, read, print, modify, rotate, overwrite, or delete Script Properties or the Gemini API key;
- do not invoke any Apps Script function;
- do not access or mutate Gmail, Message State, Error rows, Task, Review, Calendar, Automation, Trigger, Setup, Diagnostics, or Dashboard;
- do not make a real Gemini request.

Historical failed/stuck/DEAD/RETRY rows and Gmail labels remain untouched.

## Explicit non-goals

- No live Gemini request by Codex.
- No user API-key change.
- No endpoint/version switch.
- No model change.
- No fallback endpoint/model/provider.
- No automatic retry.
- No prompt redesign unless directly necessary for the provider-schema projection.
- No weakening of canonical AI Schema 2.0 validation.
- No generic Worker redesign.
- No Calendar lifecycle retest.
- No company environment work.
- No historical failure cleanup.
- No broad refactor.

## Acceptance checks

PASS requires all of the following:

1. the exact live `400 invalid_request` evidence is treated as a request-contract failure, not a generic Gemini failure;
2. every non-schema request field remains reconciled with current primary Google documentation;
3. a smaller provider-facing structured-output schema is used while canonical AI Schema 2.0 validation stays unchanged and authoritative;
4. schema drift tests bind provider field names and enums to the canonical contract;
5. all Work 0032 diagnostics/finalization/candidate/safety guards remain green;
6. Code `2.8.20-prepilot` A20/B20 release lineage and parity are coherent;
7. full local gate and exact-head CI pass;
8. one guarded existing-target placement and one pull-back parity pass;
9. zero real Gemini/Gmail/Task/Review/Calendar/Apps Script function/Automation/trigger/credential operations occur in Codex;
10. no credential, private identifier, raw provider message/body, or production data enters GitHub/report/chat.

## Stop / escalation conditions

Stop and report BLOCKER if:

- code inspection reveals the 400 cannot plausibly come from the provider schema and another request component contradicts the current primary API contract;
- creating a simpler provider schema would require weakening canonical application validation;
- provider/canonical schema drift cannot be mechanically controlled;
- local/full validation or release parity requires unrelated changes;
- exact-head CI fails for a product-relevant reason;
- safe existing-target placement/parity cannot be proven;
- a credential/private identifier would need exposure.

Do not work around a blocker with another endpoint, model, provider, account, automatic retry, or relaxed safety gate.

## Git / PR requirements

- Create/maintain a Draft PR for Work 0033 based on the Work 0032 reviewed branch/head.
- Keep the work linear and reversible.
- Do not merge, rebase, force-push, or rewrite history.
- Stage only in-scope files.
- Write `docs/handoffs/0033-report.md`, commit/push it with the work, and link instruction/report in the PR.
- The report must distinguish source-code proof, local/CI proof, target-placement proof, and the still-unexecuted real Gemini retry.

## Codex chat return

Return only:

- Work ID
- Report path
- Final commit
- Branch
- PR
- BLOCKER status
