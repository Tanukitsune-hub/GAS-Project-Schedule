# Current Status

Last updated: 2026-08-19

Candidate version: Code `2.8.21-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Overall status: `WORK_0036_REVIEW_REPAIR_REQUIRED`

Machine gate: `READY_FOR_USER_PERSONAL_AUTOMATION_E2E`

ChatGPT review disposition: `HOLD — FALSE_READINESS_SURFACE_REPAIR_REQUIRED`

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
- Final report-head CI `#390`: PASS.
- Complete non-Google gate: 11/11 PASS.
- Deterministic regression inventory: 77 suites, missing 0, extra 0.
- Phase 8B/8C release verification and A21/B21 lineage: PASS.
- Historical 2.8.20 release preservation: PASS.
- Secret/local-state scan: 0 hits.
- Existing personal-synthetic target placement: one guarded Phase 8C update
  and one independent pull-back, exact parity PASS.
- Apps Script function, Gmail, Gemini, Calendar, trigger, Automation, Setup,
  diagnostic, and user E2E execution: NOT EXECUTED.

## ChatGPT final-review blocker

The implementation and placement evidence above are valid, but the user-facing
readiness surface does not satisfy the Work 0036 acceptance contract.

`getPersonalAutomationQualificationStatus()` currently derives its top-level
`READY_FOR_CONTROLLED_QUALIFICATION` status only from a consistent
Automation-OFF / zero-clock-trigger state. It reports AI readiness separately
without making it part of the top-level decision, and reports formal labels and
Calendar as `NOT_CHECKED`. Code/schema/migration properties, Setup completion,
actual credential readiness, OAuth readiness, and the same service-backed
prerequisites used by `enableAutomation()` are not authoritative inputs to that
READY result.

The actual enable path still checks those prerequisites and fails closed, so
this is not evidence of unintended Gmail or Gemini processing. It is a false
readiness claim and therefore blocks handing the candidate to the user for the
Automation E2E. The review repair must make the readiness result authoritative,
bounded, read-only, and consistent with the enable gate, and must provide an
accessible preparation action before the user test proceeds.

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
  automatic discovery, personal operator/readiness gates, deterministic test
  inventory, and exact existing-target placement are implemented, subject to
  the readiness-surface review repair above.

Historical handoffs and reports remain immutable evidence.

## Next boundary

Complete the bounded Work 0036 review repair on the existing branch and PR,
regenerate and revalidate the affected 2.8.21 packages, and replace the exact
Phase 8C payload on the same personal-synthetic target under a new one-use
repair tranche. Automation must remain OFF and no Apps Script function may be
invoked during that work.

Only after the repaired readiness result is truthful and all gates pass may the
user-controlled synthetic Automation E2E begin. Real personal mail remains out
of scope until that automatic synthetic E2E and disable rollback pass.
