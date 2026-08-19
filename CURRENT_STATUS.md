# Current Status

Last updated: 2026-08-19

Candidate version: Code `2.8.21-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Overall status: `HOLD_USER_AUTOMATION_E2E_RUNTIME_PREPARATION_DEFECT`

Machine gate: `READY_FOR_USER_PERSONAL_AUTOMATION_E2E`

ChatGPT review disposition: `HOLD — LIVE_PREPARATION_TEST_MODE_INJECTION_DEFECT`

Personal Gemini E2E: `PASS`

Automation: `OFF`

User Automation E2E: `HOLD`

## Current contract

The canonical source is `implementation/GoogleSpreadsheet/apps-script-v2/`.
The payload is exactly 23 `.gs` files plus `appsscript.json`. Phase 8B keeps
`TEST_MODE=true` and the test harness. Phase 8C is the audited production-mode
transform with the harness excluded, bounded provider-readiness flags enabled,
and Automation OFF. `CURRENT_CONTRACT.json`, release manifests, checksums, and
verifiers bind the A21/B21 candidate while preserving historical A20/B20 source
and release evidence.

The source includes the Gemini Interactions provider, provider-facing schema
projection, strict AI Schema 2.0 post-response validation, exact synthetic
fixture guards, bounded provider diagnostics, durable Task/Review handling,
Calendar outbox controls, and an Automation lifecycle that remains disabled by
default and fail-closed.

The Gemini credential is not stored in this repository. The user configured it
in the personal-synthetic Apps Script target and, on 2026-08-18, completed one
fresh approved synthetic-message E2E on Code `2.8.20-prepilot`. The reviewed
bounded result is recorded in `docs/handoffs/0033-live-e2e-review.md`.

Code `2.8.20-prepilot` remains the frozen manual-plus-Gemini recovery baseline.
Work 0036 is its direct 2.8.21 successor for synthetic-only personal
Automation qualification. No company-PC or company-environment rollout is
planned.

## Work 0036 implementation evidence

- Draft PR `#51` remains Open / Unmerged.
- Codex completion head: `a056b088238dda93a41529e0b125a1306673de7d`.
- Review-fix pre-placement head: `097a2aa188e2faf13d30a5ca3f2382d10903d8f1`.
- Review-fix pre-placement CI `#396`: PASS.
- Complete non-Google gate: 11/11 PASS.
- Deterministic regression inventory: 78 suites, missing 0, extra 0.
- Phase 8B/8C release verification and A21/B21 lineage: PASS.
- Historical 2.8.20 release preservation: PASS.
- Secret/local-state scan: 0 hits.
- Existing personal-synthetic target review-fix replacement: one guarded Phase
  8C update and one independent pull-back, exact parity PASS.
- Review-fix final CI `#400`: PASS.
- ChatGPT docs-only clarification CI `#402`: PASS.
- Automation remained OFF throughout the implementation/review work.

## Work 0036 review-fix result

The review-fix made the user-facing readiness surface authoritative and
bounded. `getPersonalAutomationQualificationStatus()` evaluates the complete
prerequisite boundary used by `enableAutomation()`, including Setup,
candidate/version alignment, production-shaped synthetic scope, approvals,
actual credential presence without value access, OAuth, production Gemini
adapter health, formal Gmail labels, dedicated Calendar, and trigger/state
residue.

The menu also exposes the no-argument idempotent
`preparePersonalAutomationQualification()` action.

## Live user evidence: preparation BLOCKER

On 2026-08-19 the user began the authorized synthetic Automation E2E and ran
`個人用合成Automationを準備` with Automation still OFF. The live action stopped
immediately with the bounded error:

`WorkOsAppError: Automation依存注入はTest modeだけで利用できます。`

GitHub source review confirmed the root cause: the production no-argument
preparation path obtains real services correctly, but then calls
`WorkOsAutomation.getDiagnosticAutomationStatus({...})` with an injected options
object. In Phase 8C (`TEST_MODE=false`), the Automation module correctly rejects
any non-empty dependency-injection object. The defect is therefore the
preparation caller, not the production injection guard.

No Automation enable, scheduled trigger, Gmail processing, Gemini request,
Task/Review mutation, or Calendar action occurred in this failed step. The
system failed closed and Automation remains OFF.

The user must not retry preparation or continue to readiness/enable until the
same Work 0036 runtime-preparation repair is implemented, validated, regenerated,
placed on the existing target, and independently reviewed.

Authoritative continuation handoff:

- `docs/handoffs/0036-runtime-preparation-fix-instruction.md`
- `docs/handoffs/0036-runtime-preparation-fix-addendum.md`

## Historical lineage

- Work 0018: Code `2.8.14-prepilot`, source A14 and release B14.
- Work 0028: Code `2.8.15-prepilot`, source A15 and release B15.
- Work 0029: Code `2.8.16-prepilot`, source A16 and release B16.
- Work 0030: Code `2.8.17-prepilot`, source A17 and release B17.
- Work 0031: Code `2.8.18-prepilot`, source A18 and release B18.
- Work 0032: Code `2.8.19-prepilot`, source A19 and release B19.
- Work 0033: Code `2.8.20-prepilot`, source A20 and release B20; the subsequent
  user-controlled personal Gemini E2E passed.
- Work 0036: Code `2.8.21-prepilot`, source A21 and release B21; synthetic-only
  automatic discovery and authoritative readiness are implemented, but the live
  production preparation caller requires the bounded repair recorded above.

Historical handoffs and reports remain immutable evidence.

## Next boundary

Repair only the live production preparation caller under the same Work 0036,
prove the regression and all existing safety boundaries, regenerate the exact
2.8.21 Phase 8B/8C packages, replace the repaired Phase 8C source once on the
same existing personal-synthetic target, and verify independent pull-back
parity. Automation must remain OFF throughout that repair.

Only after ChatGPT reviews that completion may the user retry the single
preparation step. Real personal mail remains out of scope.
