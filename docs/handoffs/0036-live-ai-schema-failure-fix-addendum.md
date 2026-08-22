# Work 0036 Live AI-Schema Failure Fix Addendum

This addendum supplements `docs/handoffs/0036-live-ai-schema-failure-fix-instruction.md` and controls where more recent live evidence is relevant.

## Live Automation OFF confirmation

After the first scheduled Work 0036 synthetic Automation run failed at `AI_RESPONSE / E_AI_SCHEMA`, the user explicitly stopped Automation and then ran the live Automation status check.

Observed bounded state:

- status: `CONSISTENT`
- enabled: `false`
- desired enabled: `false`
- trigger count: `0`
- clock trigger count: `0`
- invalid event trigger count: `0`
- stored trigger ID present: `false`
- canonical trigger present: `false`
- duplicate trigger count: `0`
- watermark present: `true`
- last run present: `true`

The watermark and last-run markers are expected evidence of the completed scheduled run and do not constitute trigger residue.

Therefore the explicit OFF/zero-trigger prerequisite in the instruction is satisfied.

## Placement authorization

After the required implementation, focused/full local validation, deterministic 2.8.21 release regeneration, and exact-head pre-placement CI all pass, Codex is authorized to use one fresh repair placement tranche on the same existing personal-synthetic Apps Script target:

- exactly one guarded Phase 8C source update;
- exactly one independent isolated pull-back parity check.

This authorization does not permit any Apps Script function invocation, Gmail processing, Gemini request, Calendar mutation, Setup/diagnostic/readiness action, trigger mutation, Automation enable/disable action, dead-letter retry, second placement attempt, fallback, alternate target, deployment, OAuth/client change, credential operation, or user E2E retry.

Automation must remain OFF throughout Codex work and after placement.

## Model and execution emphasis

Recommended Codex model: `Sol High`.

Rationale: the exact canonical field violation was intentionally not persisted, so the repair requires cross-file reasoning across provider prompt/schema projection, strict canonical semantics, privacy-safe diagnostics, regression coverage, release regeneration, and placement evidence. Do not weaken the canonical validator to obtain a pass.

Before work, read all applicable `AGENTS.md` files, identify the repository-specific subagent-use policy, and follow it. Use subagents actively and proportionately, including independent provider-contract analysis, privacy/fail-closed review, and final source/test/release/placement audit.

All other scope, non-goals, acceptance checks, report requirements, and stop/escalation conditions in the parent instruction remain unchanged.
