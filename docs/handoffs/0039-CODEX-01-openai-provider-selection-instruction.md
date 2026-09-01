# Work 0039 / Dispatch 0039-CODEX-01 — Explicit Gemini / OpenAI Provider Selection

WORK_ID: `0039`

DISPATCH_ID: `0039-CODEX-01`

BALL: `CODEX`

STATUS: `READY`

MODE: `BUILD`

Recommended model: `Sol High` — this is a cross-cutting provider, configuration, migration, safety-gate, test, and release change. The desired architecture is fixed, but implementation requires careful integration across existing boundaries.

## Primary Outcome

Extend the completed Gemini-only Work OS so an operator can explicitly select either the existing Gemini provider or a new direct OpenAI API provider, while preserving the existing canonical AI contract, fail-closed behavior, privacy controls, retry/idempotency boundaries, and two-paste company installation format.

The change must not replace or weaken Gemini. It adds OpenAI as a parallel registered provider and a controlled selection mechanism.

## Baseline and rollback source of truth

The completed Gemini version is frozen before this Work:

- source/repository archive: `archive/0038-gemini-source-baseline`
- exact source baseline commit: `272612831c4a46e45fdf166c65e3075ffee7dfef`
- company delivery archive: `archive/0038-gemini-company-delivery`
- exact delivery commit: `eccf27ec9f6b6fd023eca7b69279cc88741ecd9b`
- baseline record: `docs/baselines/0038-gemini-completed-baseline.md`

Do not modify, repoint, force-push, regenerate in place, or reinterpret those archive refs. Work 0038 remains the immediate rollback path.

Canonical development source remains `implementation/GoogleSpreadsheet/apps-script-v2/`. Work 0039 implementation branch is `codex/0039-openai-provider-selection`.

## Fastest Safe Decisive Action

Implement and locally validate the direct OpenAI provider and the controlled provider-selection boundary against synthetic fixtures first. Do not touch a live Google Workspace target, send a real email to either provider, configure a credential, deploy, or enable Automation in this dispatch.

## Closed Conclusions

1. Gemini and OpenAI are parallel providers behind the existing provider-neutral `WorkOsAiAdapter`; Gemini is not rewritten into an OpenAI-specific abstraction.
2. Provider selection is explicit and operator-controlled. There is no automatic cross-provider fallback.
3. A single message attempt may call only its selected provider. Existing bounded same-provider retry/dead-letter semantics may remain, but no retry may silently switch provider.
4. Provider switching is permitted only while Automation is consistently OFF, with zero owned clock triggers and no active worker lease or unresolved in-flight AI attempt that could cross the provider boundary.
5. Gemini and OpenAI credentials use separate Script Properties. Credential values are never copied, displayed, logged, committed, included in error details, or placed in a release package.
6. The authoritative canonical input/output contract and final `WorkOsAiAdapter.validateOutput()` validation remain unchanged unless direct evidence proves a required compatible extension. Provider schemas are projections, not replacements for canonical validation.
7. OpenAI uses the direct OpenAI API, not Azure OpenAI. If the company service is actually Azure OpenAI or a proxy with a different endpoint/authentication contract, stop and trigger a Strategy Reset rather than adding a silent compatibility path.
8. The OpenAI transport uses the Responses API with structured JSON output, `store=false`, no background mode, no streaming, and no tools. Email/task text remains untrusted data only.
9. No arbitrary endpoint, model, prompt version, or property name may be entered from a Sheet cell. Provider metadata is code-owned and allowlisted.
10. The initial OpenAI model candidate is `gpt-5.6-luna`, using a low-cost, bounded reasoning configuration suitable for high-volume classification. If the company OpenAI project does not expose that exact model, return a bounded unsupported-model result and stop; do not silently substitute another model. Promotion to `gpt-5.6-terra` or another model requires explicit review and a new accepted configuration change.
11. Existing installations without a provider-selection property remain backward compatible with Gemini. A read path may infer Gemini without writing; controlled Setup/migration may initialize the explicit selection to Gemini.
12. Canonical source remains modular. Work 0039 must generate a new versioned release and derived single-file bundle; it must not overwrite Work 0038 source, releases, or delivery branches.
13. Company manual installation remains two paste actions: one generated `Code.gs`, then `appsscript.json`. Text transport copies remain supported.

## Proposed Architecture

### Provider-neutral core

Keep `07_AiAdapter.gs` as the canonical provider-neutral contract. Extend its production provider registry to register both:

- `GEMINI` through the existing `WorkOsGeminiProvider`;
- `OPENAI` through a new `WorkOsOpenAiProvider`.

Provider registration must remain explicit and fail closed. Unknown providers are rejected.

### OpenAI provider module

Add a dedicated module, expected path:

`implementation/GoogleSpreadsheet/apps-script-v2/21_OpenAiProvider.gs`

It owns only OpenAI-specific concerns:

- provider ID, model, prompt version, endpoint, and credential-reference constants;
- OpenAI credential presence/read boundary;
- Responses API request construction;
- strict provider-facing JSON Schema projection;
- response-envelope extraction and refusal/incomplete/error handling;
- bounded diagnostics that never retain provider output or request content;
- non-live readiness and exact synthetic qualification helpers.

Expected credential property:

`WORK_OS_V2_OPENAI_API_KEY`

Expected endpoint:

`https://api.openai.com/v1/responses`

Expected authentication:

`Authorization: Bearer <credential>`

The request must explicitly disable persistence and unsupported side effects. It must not enable web search, file search, code execution, tools, background execution, or remote MCP.

### Provider-selection module

Add a focused selection/control module, expected path:

`implementation/GoogleSpreadsheet/apps-script-v2/22_AiProviderSelection.gs`

Expected authoritative selection property:

`WORK_OS_V2_ACTIVE_AI_PROVIDER`

Allowed values are exactly `GEMINI` and `OPENAI`.

The module must provide:

- a read-only status surface showing only selected provider, model, prompt version, credential-present boolean, registry/readiness state, Automation state, and qualification state;
- a guarded switch operation for each provider;
- strict Automation-OFF and zero-trigger preconditions;
- active-worker and in-flight/retry boundary checks sufficient to prevent one message from being silently sent to both providers;
- a Script Lock around the selection transition;
- postcondition verification and rollback of the selection property if a controlled dependent update fails;
- no external API request during the switch itself.

The existing `ai_provider` Settings row must not become an unrestricted user-editable configuration source. It may remain a protected informational surface synchronized by controlled code, or be validated against the authoritative Script Property. There must be one unambiguous source of truth.

### Provider qualification

Add a provider-neutral status/menu flow and an OpenAI synthetic qualification flow. OpenAI qualification must:

- run only while Automation is consistently OFF;
- require an exact synthetic fixture with no company or personal data;
- perform at most one OpenAI request per explicit user action;
- store only a bounded qualification fingerprint/status tied to provider, model, prompt version, AI schema, code version, and instance;
- never store the credential, prompt, response, subject, body, sender, IDs, or raw provider error;
- be invalidated by a relevant provider/model/prompt/schema/code change.

Automation enablement with OpenAI selected must fail closed unless the current OpenAI qualification fingerprint is valid. Preserve existing accepted Gemini behavior and do not falsely reinterpret historical Gemini evidence as OpenAI evidence.

### Menu and user interaction

Add neutral menu surfaces such as:

- `AI Providerの状態を確認`
- `Geminiへ切り替え`
- `OpenAIへ切り替え`
- `選択中Providerの合成接続テスト`

Each mutating action requires a clear confirmation. The UI must state that switching does not automatically enable Automation. Remove no existing operational safety confirmation.

### State, retries, and provenance

The provider/model/prompt snapshot for an AI attempt must be deterministic and auditable. Do not allow a scheduled retry or manual retry to silently use a different provider from the original failed attempt. Use the smallest safe mechanism consistent with existing Message State / Dead Letter contracts. If avoiding a schema change is safe, prefer a guarded switch precondition; if persistent provider pinning is required, update schema/migration/version contracts consistently and test restoration/retry paths.

Classification provenance and hashes must continue to include provider, model, and prompt version. Existing Gemini provenance must remain valid.

## Required Scope

1. Inspect the exact current source, release builders, schemas, status contracts, tests, and applicable `AGENTS.md` files before editing.
2. Implement the OpenAI provider module and register it in the existing provider registry.
3. Implement controlled provider selection, status, menu actions, separate credential references, and fail-closed readiness.
4. Preserve the existing Gemini request, response, synthetic qualification, and normal runtime behavior.
5. Add OpenAI provider-facing strict-schema projection and deterministic normalization into the existing canonical output shape.
6. Add comprehensive local fixtures/tests for successful and failed OpenAI responses without making network requests.
7. Add negative tests for switch safety, credential absence, unsupported provider/model, refusal/incomplete response, malformed/extra output, timeout/rate/auth/permission errors, and cross-provider fallback prohibition.
8. Update version/schema/migration contracts only as required by the implemented durable state change. Advance the code version once using repository convention; keep AI Schema `2.0` unless a justified compatible change is necessary.
9. Generate a new versioned Work 0039 release package and new derived single-file company-install bundle through version-specific tooling. Do not change frozen Work 0038 packages.
10. Preserve the two-paste install path and generate `.txt` transport copies with checksum identity.
11. Update active documentation, current contract/status, release provenance, test inventory, and deployment guidance consistently.
12. Create a completion report at `docs/handoffs/0039-CODEX-01-openai-provider-selection-report.md` and return the dispatch ledger to ChatGPT with exact refs.

## Acceptance Evidence — Priority Order

1. Gemini regression: the complete existing Gemini behavior and local regression inventory remain PASS; frozen Work 0038 refs and bytes are unchanged.
2. OpenAI canonical correctness: representative `NEW_TASK`, update, completion/cancellation, waiting, information-only, and unclear fixtures normalize into outputs accepted by the unchanged canonical validator.
3. Switch safety: switching fails while Automation is enabled/inconsistent, while an owned clock trigger exists, during an active worker lease, or when unresolved state could cause a cross-provider resend.
4. No fallback/dual-send: one message attempt invokes at most one provider; Gemini failure never invokes OpenAI and OpenAI failure never invokes Gemini.
5. Credential isolation: each provider reads only its own property; no key value enters logs, errors, tests, Git, bundle, UI, or persisted business state.
6. OpenAI response safety: refusal, incomplete/multiple output, malformed schema, unexpected fields, invalid semantics, oversized response, and unsafe provider error bodies fail closed.
7. Qualification binding: OpenAI Automation cannot be enabled without a valid current synthetic qualification fingerprint; stale fingerprints are rejected.
8. Retry/provenance integrity: retries cannot silently cross providers, and provider/model/prompt provenance remains correct in hashes and records.
9. Full non-live verification: static validator, focused suites, complete regression inventory, release/lineage verification, deterministic bundle build, secret scan, and CI all PASS.
10. Delivery usability: a new Work 0039 company package exposes `Code.gs` + `appsscript.json` and byte-identical txt transport copies without changing the Work 0038 archive.

## Validation Matrix

Run and report exact observed results for:

- OpenAI provider request-construction fixtures;
- strict structured-output schema projection;
- response extraction and canonical validation;
- provider registry and selection resolution;
- provider-specific credential isolation;
- all switch guard failure paths;
- active lease / pending retry / in-flight state handling;
- no-fallback and maximum-call assertions;
- Gemini regression suites;
- version/schema/migration compatibility;
- bundle source order, uniqueness, VM load, reproducibility, checksums, and txt identity;
- `node implementation/GoogleSpreadsheet/tools/validate_apps_script_v2.js`;
- applicable focused tests;
- `pnpm install --frozen-lockfile`;
- `pnpm run verify:local` and CI-equivalent gate;
- secret/local-state scan;
- `git diff --check`;
- final diff review against this instruction.

All real OpenAI, Gemini, Gmail, Calendar, OAuth, Apps Script target, trigger, credential, and company-environment checks must remain `NOT EXECUTED` in this dispatch.

## Non-Goals

- No automatic provider fallback or load balancing.
- No simultaneous Gemini/OpenAI comparison on a real email.
- No Azure OpenAI, company proxy, third provider, or arbitrary endpoint support.
- No user-supplied free-form model/endpoint/prompt setting.
- No company credential entry or live request.
- No company Workspace deployment or Automation enablement.
- No broad historical Inbox backfill.
- No weakening of canonical validation, privacy redaction, Task authority, locks, retries, Calendar ownership, Gmail admission filters, or trigger lifecycle.
- No rewrite of Work 0038 history, archive refs, releases, or delivery files.

## Strategy Reset Conditions

Stop and return to ChatGPT if any of the following is evidenced:

- the company service is Azure OpenAI or requires a nonstandard proxy/authentication contract;
- direct OpenAI Structured Outputs cannot represent a safe projection of the canonical AI Schema without weakening final validation;
- provider switching cannot prevent cross-provider resend without a materially larger schema/migration redesign;
- the single-file Apps Script bundle exceeds a demonstrated platform/editor limit after the added modules;
- current release tooling cannot produce a successor package without rewriting frozen Work 0038 evidence;
- the proposed `gpt-5.6-luna` model is unavailable in the eventual company project.

Preserve accepted evidence, keep the Gemini archive unchanged, classify the blocker, and propose the cheapest decisive next action. Do not add a silent fallback.

## Git and write boundaries

- Use branch `codex/0039-openai-provider-selection`.
- Do not write credentials, company IDs, private URLs, message content, or raw provider payloads.
- Do not force-push or rewrite archive/history.
- Keep changes scoped, reviewable, and reversible.
- Do not merge to `main` or modify the Work 0038 delivery/archive branches in this dispatch.

## Return Report

Return with:

- final implementation branch and commit sequence;
- PR URL/state if used;
- exact files changed;
- version/schema/migration decisions;
- provider-selection and OpenAI architecture summary;
- exact validation commands and observed results;
- release and two-paste bundle paths/checksums;
- proof that Work 0038 archives are unchanged;
- BLOCKER, non-blocking issue, and optional-improvement classification;
- confirmation that no live external action or credential handling occurred.

WORK_ID: `0039`

DISPATCH_ID: `0039-CODEX-01`

BALL: `CODEX`

STATUS: `READY`