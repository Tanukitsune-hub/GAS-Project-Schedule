# Work 0036 Live AI-Schema Failure Fix Instruction

## Outcome

Continue Work ID `0036` and repair the first scheduled personal-synthetic Automation E2E failure observed on Code `2.8.21-prepilot`.

The repaired candidate must preserve the exact synthetic-only Automation scope and one-call real-Gemini boundary while making the Gemini response contract sufficiently explicit and diagnosable that the controlled fixture can complete the existing strict AI Schema 2.0 validation without weakening fail-closed behavior.

The user-controlled Automation E2E must remain stopped until ChatGPT reviews the repair and explicitly authorizes a fresh bounded continuation.

## Observed live evidence

The user completed the Work 0036 preparation, readiness, and Automation-enable checkpoints successfully. The scheduled 5-minute trigger then discovered exactly one exact synthetic candidate and failed after the real Gemini call.

Bounded runtime evidence from the existing personal-synthetic spreadsheet:

- trigger type: `TIME_DRIVEN`
- mode: `AUTO_PHASE6`
- candidate count: `1`
- processed count: `0`
- created/updated/review counts: `0`
- error count: `1`
- run status: `FAILED`
- run note: `MESSAGE_FAILED`
- error stage: `AI_RESPONSE`
- error code: `E_AI_SCHEMA`
- error category: `INVALID_RESPONSE`
- message state: `AUTOMATIC_QUALIFICATION -> CLASSIFY -> DEAD`
- retry count: `0`
- no Task/Review/Calendar output was created for this candidate

Do not copy provider payloads, raw email content, message/thread IDs, account IDs, credential values, or private URLs into GitHub or reports.

## ChatGPT analysis completed

GitHub source review confirms:

1. The real provider call completed far enough to reach canonical AI response parsing; this is not a Gmail-discovery, trigger, credential, OAuth, or HTTP-status failure.
2. `WorkOsGeminiProvider.providerOutputSchema()` intentionally projects away provider-unsupported constraints such as `additionalProperties`, numeric/item bounds, and date formats before sending the structured-output schema to Gemini.
3. `WorkOsAiAdapter.validateOutput()` then applies a stricter canonical contract, including exact fields and action-type-dependent semantic rules that the projected provider schema cannot fully express.
4. `parseCanonicalResponse()` currently converts any canonical validation failure into generic `E_AI_SCHEMA` and discards the specific safe validation reason. The raw provider response is intentionally not retained.
5. Therefore the exact violating field cannot be recovered from the completed run, and the repair must not guess by weakening validation.

## Route and model

Route: `C` — Codex implementation and executable validation are required.

Recommended Codex model: `Sol High`.

Rationale: the live failure is localized to the provider-output/canonical-schema boundary, but the exact violating field is intentionally unrecoverable. The residual task therefore requires cross-file reasoning across the Gemini provider prompt/schema projection, canonical validator, privacy-safe diagnostics, tests, release generation, and the controlled existing-target placement boundary. Use the lowest-risk design that preserves strict validation and one-call behavior.

## Required repository instructions and subagents

Before starting, read all applicable `AGENTS.md` files, identify the repository-specific subagent-use policy, and follow it. Use subagents actively and proportionately under that policy. At minimum, use independent perspectives for:

- provider-schema/prompt versus canonical-validator contract analysis;
- privacy/fail-closed diagnostic review;
- final source/test/release/placement audit.

The parent Codex agent owns the integrated design and final judgment.

## Decided design constraints

These are not optional:

- Preserve strict canonical AI Schema 2.0 validation. Do not make unknown or semantically inconsistent output silently succeed.
- Preserve one real Gemini call per candidate; no retry, fallback model/provider, second correction call, or hidden reclassification pass.
- Preserve the exact Work 0036 synthetic-only Gmail/provider boundary. Ordinary personal Inbox mail remains out of scope.
- Do not persist or log raw provider responses, raw email bodies/subjects/senders, credentials, private IDs, or provider rationale.
- Do not weaken `additional_properties=false` as a canonical application contract merely because the provider schema cannot express every constraint.
- Do not silently drop unknown provider fields as a success path.
- Do not canonicalize conflicting semantic values into apparently successful output.
- Keep Automation default OFF and all existing enable/disable/trigger guards fail-closed.
- Preserve the frozen Code `2.8.20-prepilot` recovery packages unchanged.

## Required repair behavior

Implement the smallest coherent hardening that addresses the observed class of failure without weakening the canonical validator.

At minimum:

1. Harden the Gemini system/prompt contract so the model is explicitly told the canonical action semantics that are stricter than the projected JSON schema. This must include exact-field/no-extra-field expectations and action-type-dependent neutral/change-field rules.
2. For the exact Work 0036 automation synthetic fixture, make the requested semantics deterministic enough for qualification: a new internal confirmation task with the stated relative seven-day deadline, no high-impact Calendar classification, no invented target ID, and canonical new-task `changes` semantics.
3. Preserve general provider behavior outside the exact qualification fixture; do not hard-code a general production output unrelated to the supplied input.
4. Add bounded privacy-safe schema-failure diagnostics so a future `E_AI_SCHEMA` can identify the canonical rule class that failed without storing or surfacing provider text. The diagnostic must be an allowlisted bounded token/code only.
5. Preserve generic safe user-facing failure summaries; diagnostic detail belongs only in the existing bounded error/evidence surfaces that are already permitted to store non-sensitive codes.

If Codex identifies a safer/simpler implementation that satisfies all constraints above, it may use it. Any proposal that accepts previously invalid semantic output as success requires escalation to ChatGPT before implementation.

## Required validation

At minimum prove locally, without real Google/provider calls:

- the exact Work 0036 Gemini request contains the hardened semantic contract;
- provider-facing schema projection remains accepted by current local contract tests and does not reintroduce the prior invalid-request class;
- canonical `validateOutput()` remains strict for unknown fields, conflicting action semantics, invalid enums/types/dates, and non-empty new-task changes unless the existing canonical contract explicitly allows them;
- representative provider responses that satisfy the projected schema but violate canonical semantic rules still fail closed;
- those failures now emit only the new bounded allowlisted diagnostic code, never raw output;
- representative canonical responses for the exact Work 0036 fixture pass unchanged;
- one-call/no-retry/no-fallback behavior is unchanged;
- synthetic-only candidate/body guards are unchanged;
- Task/Review/Calendar writes do not occur after an AI-schema failure;
- existing error/dead-letter accounting remains correct and non-duplicating;
- focused Work 0036 tests pass;
- full deterministic suite inventory, static validator, release verifiers, lineage checks, historical 2.8.20 preservation, secret/local-state scan, and `git diff --check` pass;
- exact-head pre-placement CI succeeds.

## Release and existing-target boundary

Regenerate the deterministic Code `2.8.21-prepilot` Phase 8B/8C packages from authored source using the existing version-specific builders. Do not bump Code/Schema/AI-Schema/Migration versions unless the implementation genuinely requires a contract-version change; if a version bump becomes necessary, stop and escalate before proceeding.

A repaired Phase 8C update to the existing personal-synthetic Apps Script target is authorized only after all local gates and exact-head CI pass **and only if ChatGPT has recorded confirmation that Automation is OFF with zero owned clock triggers and no stored/canonical trigger residue after the failed live run**.

If that OFF confirmation is absent, stop before any Apps Script target mutation and report `BLOCKER: AUTOMATION_OFF_CONFIRMATION_REQUIRED`.

Once the OFF confirmation exists, one fresh repair placement tranche is authorized:

- exactly one guarded Phase 8C source update to the same existing personal-synthetic target;
- exactly one independent isolated pull-back parity check.

No runtime Apps Script function, Gmail processing, Gemini request, Calendar mutation, trigger mutation, Setup, diagnostic, readiness, enablement, disablement, dead-letter retry, or user E2E execution is authorized during Codex work.

## Documentation and report

Preserve historical Work 0036 reports unchanged. Write a new completion report:

`docs/handoffs/0036-live-ai-schema-failure-fix-report.md`

Update active status/plan/PR only from observed evidence. Record the failed live run only with bounded non-sensitive codes/counts.

## Git / PR requirements

Repository: `Tanukitsune-hub/GAS-Project-Schedule`

Branch: `codex/0036-personal-automation-qualification`

PR: `#51`, keep Draft/Open/Unmerged.

Use the exact execution ref supplied by ChatGPT. Do not rebase, force-push, merge main, create a new Work ID, or merge PR #51.

Commit and push the completed work and report. The final branch head must have successful final CI before return.

## Stop / escalation conditions

Stop and report a BLOCKER rather than guessing if:

- the repair would require weakening canonical validation or silently accepting conflicting output;
- a provider retry/fallback is required;
- raw provider/email/credential/private evidence would be needed;
- the exact target binding cannot be proven safely;
- Automation OFF/zero-trigger confirmation is absent before target placement;
- a version/schema migration becomes materially necessary;
- local or CI evidence shows source/release divergence or frozen 2.8.20 changes;
- the one-use placement/pull-back tranche fails or is consumed unexpectedly.

## Completion criteria

Completion requires source hardening, bounded diagnostics, focused/full local validation, deterministic 2.8.21 release regeneration, exact-head CI success, preserved 2.8.20 recovery evidence, one authorized repaired target update plus one pull-back parity check if the OFF prerequisite is satisfied, final report-head CI success, independent review with no BLOCKER, and Automation remaining OFF.

Do not perform the user-controlled E2E retry. ChatGPT will review the completion and decide the next bounded live step.
