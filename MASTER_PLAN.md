# Master Plan

Last updated: 2026-08-19

Repository: `Tanukitsune-hub/GAS-Project-Schedule`

Current contract: Code `2.8.21-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Candidate machine gate: `READY_FOR_USER_PERSONAL_AUTOMATION_E2E`

ChatGPT review disposition: `HOLD — FALSE_READINESS_SURFACE_REPAIR_REQUIRED`

## Historical release chain

- Work 0002 established the clean integration and deterministic local gate.
- Work 0018 remains Code `2.8.14-prepilot`, source A14, release B14. Its
  scope was the Gmail Advanced Service body decoder.
- Work 0028 remains Code `2.8.15-prepilot`, source A15, release B15. Its
  scope was the isolated Gemini provider boundary and Review observability.
- Work 0029 remains Code `2.8.16-prepilot`, source A16, release B16. Its
  scope was callable Gemini readiness and synthetic validation.
- Work 0030 remains Code `2.8.17-prepilot`, source A17, release B17. Its
  scope was strict Gemini thinking-step parsing.
- Work 0031 remains Code `2.8.18-prepilot`, source A18, release B18. Its
  scope was the `/v1beta/interactions` transport candidate.
- Work 0032 remains Code `2.8.19-prepilot`, source A19, release B19. Its
  scope was bounded provider diagnostics and failure finalization.
- Work 0033 remains Code `2.8.20-prepilot`, source A20, release B20. Its
  scope was provider-schema compatibility; the later user-controlled personal
  Gemini E2E passed.

Historical records are not current deployment selectors and are not rewritten.

## Completed boundary: personal Gemini E2E

On 2026-08-18 the user executed one fresh approved synthetic Gmail Message via
`Gemini synthetic validation (one request)` in the personal sandbox. The result
was `COMPLETE`, processed one candidate, created one governed Task and one
Review, recorded zero errors and zero Calendar jobs, reached checkpoint `DONE`,
and left Automation consistently OFF with no clock trigger.

This closes the real-Gemini classification-to-Task boundary and freezes Code
`2.8.20-prepilot` as the manual-plus-Gemini recovery baseline.

## Completed boundary: Work 0035 clean main integration

Work 0035 materialized the qualified 2.8.20 tree from current `main` without
merging or replaying the long stacked Draft-PR history. It preserved current-
main governance, the frozen Apps Script and release bytes, and a validation
gate that also works after becoming canonical `main`.

## Work 0036: personal Automation qualification candidate

Work 0036 is the direct 2.8.21 successor of the frozen 2.8.20 recovery
baseline. Its automatic discovery scope is the single exact synthetic subject
and normalized body `WORK_OS_AUTOMATION_SYNTHETIC_BODY_0036`; ordinary Inbox
mail cannot reach the Gemini boundary. Automation remains OFF.

Codex completed the source, deterministic A21/B21 release packages, exact
77-suite inventory, complete non-Google validation, one guarded Phase 8C
placement to the existing personal-synthetic target, and one independent
pull-back parity check. Final report-head CI `#390` passed.

## Work 0036 review hold

Final ChatGPT review found one acceptance blocker in the user-facing readiness
surface. `getPersonalAutomationQualificationStatus()` can report READY from a
consistent Automation-OFF state even when AI, Setup/version, formal-label,
Calendar, credential, or OAuth prerequisites are not ready. Formal labels and
Calendar are returned as `NOT_CHECKED`.

The actual enable path remains fail-closed and ordinary Inbox mail remains
excluded. The candidate is therefore safe to keep disabled, but it is not yet
ready for the user-controlled E2E because the advertised readiness result is
not authoritative.

The same Work ID continues. The bounded review repair must:

1. Make the readiness decision use the same complete prerequisite set as
   `enableAutomation()`, or a read-only equivalent with identical decision
   semantics.
2. Report bounded Setup/version, provider, credential, OAuth, formal-label,
   dedicated-Calendar, qualification-scope, and trigger readiness.
3. Add an explicit menu action for the existing idempotent
   `preparePersonalAutomationQualification()` path.
4. Preserve Automation OFF, exact synthetic-only discovery, Gemini no-fallback,
   and all durable-state protections.
5. Regenerate and verify affected 2.8.21 packages and replace the Phase 8C
   payload on the same target under a new one-use review-repair tranche.
6. Obtain final-head CI and independent review before the user E2E.

## Next phase after the review repair

No company-PC or company-environment deployment is planned. Once the repaired
candidate is placed and all gates pass, the shortest safe user sequence is:

1. Keep Automation OFF and use the new preparation menu action once.
2. Run the repaired readiness/status action and require a truthful all-ready
   result with zero owned clock triggers.
3. Create one fresh exact Work 0036 synthetic Gmail fixture; do not use real
   personal mail or a prior terminal fixture.
4. Explicitly enable Automation once and verify exactly one canonical 5-minute
   trigger.
5. Allow the unattended synthetic Gmail → Gemini → governed Task/Review flow to
   complete once, with no ordinary Inbox candidate admitted.
6. Disable Automation and prove zero effective running state and zero owned
   triggers while unrelated triggers remain untouched.
7. Record the bounded result before deciding whether a later Work may broaden
   the scope to normal personal Inbox mail.

Calendar projection is not required for this non-high-impact fixture unless a
later exact handoff explicitly authorizes it. Broad redesign, fallback
providers, speculative hardening, and company rollout remain out of scope.
