# Current Status

Last updated: 2026-08-19

Candidate version: Code `2.8.21-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Overall status: `READY_FOR_USER_PERSONAL_AUTOMATION_E2E`

Machine gate: `READY_FOR_USER_PERSONAL_AUTOMATION_E2E`

ChatGPT review disposition: `READY — FALSE_READINESS_SURFACE_REPAIRED`

Personal Gemini E2E: `PASS`

Automation: `OFF`

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
- Apps Script function, Gmail, Gemini, Calendar, trigger, Automation, Setup,
  diagnostic, and user E2E execution: NOT EXECUTED.

## Work 0036 review-fix result

The review-fix makes the user-facing readiness surface authoritative and
bounded. `getPersonalAutomationQualificationStatus()` now evaluates the same
complete prerequisite boundary used by `enableAutomation()`, including Setup,
candidate/version alignment, production-shaped synthetic scope, approvals,
actual credential presence without value access, OAuth, production Gemini
adapter health, formal Gmail labels, dedicated Calendar, and trigger/state
residue. It returns READY only when every prerequisite is ready while
Automation remains OFF.

The menu now provides a confirmed preparation action that calls the existing
no-argument idempotent preparation path. The action remains Automation-OFF
only and does not expose credentials or mutate business data.

The repaired Phase 8C payload was placed once on the same existing
personal-synthetic target under a fresh review-fix state and independently
pulled back with exact byte/hash parity. No runtime function, Gmail message,
Gemini request, Calendar write, trigger mutation, Setup, or Automation action
was executed.

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
  automatic discovery, authoritative personal readiness/preparation gates,
  deterministic test inventory, and exact existing-target replacement parity
  are implemented. User-controlled Automation E2E remains unexecuted.

Historical handoffs and reports remain immutable evidence.

## Next boundary

The bounded Work 0036 review repair, deterministic 2.8.21 regeneration,
existing-target replacement, pull parity, final CI, and independent review are
complete. The next boundary is the separately user-controlled synthetic
Automation E2E. Real personal mail remains out of scope until that automatic
synthetic E2E and disable rollback pass.
