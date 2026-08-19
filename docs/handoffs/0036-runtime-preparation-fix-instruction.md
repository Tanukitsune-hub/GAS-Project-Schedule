# Work 0036 Production Preparation Runtime-Fix Instruction

## Outcome

Continue Work ID `0036` and repair the live `個人用合成Automationを準備` path so the existing Code `2.8.21-prepilot` Phase 8C production-shaped target can execute bounded candidate preparation without being rejected as test-only dependency injection.

This repair must preserve the already-validated synthetic-only Automation scope, truthful readiness boundary, Automation OFF default, frozen 2.8.20 recovery baseline, and all privacy/fail-closed behavior.

## Observed live evidence

The user executed the menu action `個人用合成Automationを準備` in the existing personal-synthetic target and received:

`WorkOsAppError: Automation依存注入はTest modeだけで利用できます。`

Do not ask the user to retry until the repaired payload is placed and independently verified.

## Root cause confirmed by ChatGPT

At the current Work 0036 source, `preparePersonalAutomationQualification()` obtains real production services when called with no arguments, but then calls:

`WorkOsAutomation.getDiagnosticAutomationStatus({ properties: props, script_app: settings.script_app })`

In Phase 8C `TEST_MODE=false`, `WorkOsAutomation.injected(options)` correctly rejects any non-empty dependency-injection object with `E_TEST_MODE_DISABLED`. Therefore the menu preparation path cannot run in production-shaped mode even though no test dependency was supplied by the user.

The defect is in the caller, not in the test-only injection guard. Do not weaken or remove `WorkOsAutomation.injected()` production protection.

## Route and model

Route: `C` — ChatGPT confirmed the root cause and completed the GitHub status/handoff work. Codex implements the bounded caller correction, adds/extends regression coverage, regenerates releases, validates them, and performs the authorized repaired-target parity sequence.

Recommended Codex model: `Luna Max`.

Rationale: root cause, design, scope, and acceptance criteria are resolved; residual work is bounded implementation, executable validation, release regeneration, and exact existing-target parity.

## Repository / branch / PR

Repository: `Tanukitsune-hub/GAS-Project-Schedule`

Branch: `codex/0036-personal-automation-qualification`

PR: `#51`

Use the exact ref supplied in the execution request. Do not rebase, force-push, merge `main`, or create a new Work ID.

## Required repository instructions and subagents

Before starting, read all applicable `AGENTS.md` files and follow the repository-specific delegation policy. Use subagents actively and proportionately, including at least one independent review of the production/Test-mode boundary and one independent final source/release/placement audit.

## Decided repair design

The production preparation path must call the real no-argument Automation status path. Test-mode dependency injection may remain available for local tests.

The simplest acceptable behavior is equivalent to:

- TEST_MODE / injected test execution: preserve the existing injected status call so tests can use fakes;
- production-shaped no-argument execution: call `WorkOsAutomation.getDiagnosticAutomationStatus()` with no options.

Do not weaken the existing `E_TEST_MODE_DISABLED` injection guard.

## Required validation

At minimum prove:

1. Phase 8C / `TEST_MODE=false` no-argument `preparePersonalAutomationQualification()` no longer throws `E_TEST_MODE_DISABLED` from Automation dependency injection.
2. Production preparation still requires Setup complete, compatible schema/migration, Automation OFF, zero owned clock triggers, and no stored trigger residue.
3. Preparation updates only bounded version metadata and remains idempotent.
4. Preparation performs no Gmail body fetch, Gemini request, Calendar write, trigger mutation, credential-value read, or business-data mutation.
5. Test-mode dependency injection remains available and production dependency injection remains rejected.
6. The repaired preparation action still leaves Automation OFF.
7. Existing truthful readiness, exact synthetic-only Gmail/provider boundary, one-message cap, and fail-closed enable behavior remain green.
8. Exact deterministic suite inventory remains synchronized; add a focused regression suite or extend the Work 0036 suite as appropriate.
9. Full local gate, static validation, release verifiers, lineage, frozen 2.8.20 preservation, secret/local-state scan, and `git diff --check` all PASS.
10. Exact-head pre-placement CI succeeds.

## Release and existing-target replacement

Because the source defect is already present on the existing personal-synthetic target, after all non-Google validation and exact-head pre-placement CI pass, one fresh repair replacement tranche is authorized:

- exactly one guarded Phase 8C source update to the same existing personal-synthetic target;
- exactly one independent isolated pull-back parity check.

No second attempt, fallback, alternate target, deployment, OAuth/client change, credential inspection, Apps Script function invocation, Gmail processing, Gemini request, Calendar mutation, trigger mutation, Setup execution, readiness execution, or Automation enablement is authorized during Codex work.

If the exact target binding or one-use state cannot be established safely, stop before mutation and report a BLOCKER.

## Documentation and report

Preserve the historical `0036-report.md` and `0036-review-fix-report.md` unchanged. Write a new completion record:

`docs/handoffs/0036-runtime-preparation-fix-report.md`

Update active status/plan/PR only after observed validation. Record the user's failed live preparation attempt as bounded evidence without personal IDs or private data.

## Completion criteria

Completion requires:

- repaired source behavior;
- focused regression PASS;
- complete local gate PASS;
- deterministic 2.8.21 Phase 8B/8C packages regenerated and verified;
- historical 2.8.20 unchanged;
- pre-placement exact-head CI SUCCESS;
- one repaired Phase 8C target update PASS;
- one independent pull-back exact parity PASS;
- final report-head CI SUCCESS;
- independent review finds no BLOCKER;
- Automation remains OFF.

Do not perform the user-controlled Automation E2E. The user will retry only the preparation step after ChatGPT reviews this completion.

## Final return contract

Return only:

- Work ID
- Runtime-preparation-fix report path
- Final commit
- Branch
- PR
- BLOCKER status
