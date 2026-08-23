# Master Plan

Last updated: 2026-08-20

Repository: `Tanukitsune-hub/GAS-Project-Schedule`

Current contract: Code `2.8.23-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Candidate machine gate: `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`

ChatGPT review disposition: `READY — FALSE_READINESS_SURFACE_REPAIRED`

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

Codex completed the source review-fix and the bounded runtime-preparation fix,
regenerated the deterministic A21/B21 release packages, passed the exact
78-suite inventory and complete non-Google validation, and performed the
authorized one-use replacement tranche for the runtime-preparation repair on
the same existing personal-synthetic target. One independent pull-back reached
exact parity. Runtime-fix pre-placement CI passed at head
`dab94362c34e837bb236186ace7c0cf9c0f63e40`; final report-head CI is the
publication gate for this report.

## Work 0036 review repair complete

The repaired `getPersonalAutomationQualificationStatus()` is authoritative,
bounded, and read-only: it shares the complete prerequisite boundary with
`enableAutomation()` and requires candidate/version, Setup, exact synthetic
scope, approvals, actual credential presence, OAuth, production Gemini adapter,
formal Gmail labels, dedicated Calendar, and clean Automation/trigger state.
The menu provides a confirmed call to the existing no-argument idempotent
preparation path.

The actual enable path remains fail-closed, Automation remains OFF, and
ordinary Inbox mail remains excluded. The Phase 8C replacement and independent
pull-back reached exact 23-file parity on the same existing synthetic target.
No Apps Script function, Gmail, Gemini, Calendar, trigger, Setup, diagnostic,
or user E2E action was executed.

The same Work ID continues. The completed review repair provides:

1. An authoritative readiness decision and bounded diagnostic details.
2. An explicit confirmation-gated preparation menu action.
3. Automation OFF, exact synthetic-only discovery, Gemini no-fallback, and all
   durable-state protections.
4. Deterministic 2.8.21 package verification and a fresh one-use replacement
   tranche on the same target.
5. Final CI and independent source/release/placement review.

## Work 0036 runtime-preparation fix complete

The production no-argument `preparePersonalAutomationQualification()` caller
now invokes the real no-argument Automation status path. Test-mode callers
retain dependency injection, and the production `E_TEST_MODE_DISABLED` guard
is unchanged. The repair is covered by focused production-shaped and Test-mode
regressions, with Automation-OFF, zero-clock-trigger, bounded-metadata, and
non-runtime side-effect checks preserved.

The 2.8.21 Phase 8B/8C packages were regenerated and verified. The same
existing personal-synthetic target received exactly one guarded Phase 8C
source update; one isolated pull-back verified 23-file byte/hash parity. No
Apps Script function, preparation, readiness, enablement, Gmail, Gemini,
Calendar, trigger, Setup, diagnostic, or user E2E action was executed.

## Work 0037: automatic personal Inbox shadow pilot

The revised Work 0037 advances the frozen 2.8.22 label-gated candidate to Code
`2.8.23-prepilot`. Scheduled discovery admits ordinary eligible personal Inbox
messages, rejects `手動/除外` Thread-wide, excludes spam/trash, non-Inbox,
Promotions, Social, clear newsletters/list mail, and Google Calendar
notifications, and treats `手動/取込` only as optional priority. It uses the
distinct `AUTOMATIC_INBOX_PILOT` source mode and remains bounded to one
message per existing five-minute run. A successful explicit enable establishes
a durable pilot-start boundary and pre-start messages are rejected. The
manual worker fails closed while pilot Automation is active, and all
Task/Review/Calendar/idempotency and strict Gemini boundaries remain unchanged.

The repaired canonical-main squash lineage gate, 82-suite local inventory,
2.8.23 Phase 8B/8C packages, frozen 2.8.20/2.8.21/2.8.22 preservation, and the
bounded existing-target placement are recorded in the Work 0037 report. The
later 24-hour shadow pilot is user-controlled and is not executed by Codex.

## Next phase after Work 0037

No company-PC or company-environment deployment is planned. Once the repaired
candidate is placed and all gates pass, the shortest safe user sequence is:

1. Keep Automation OFF and use the Work 0037 preparation/status surfaces.
2. Confirm label readiness and zero owned clock triggers.
3. Select at least 12 bounded, non-sensitive work-like messages by applying
   `手動/取込`; do not use ordinary unlabeled Inbox mail.
4. Explicitly enable Automation once and verify exactly one canonical
   five-minute trigger.
5. Allow the bounded automatic-Inbox → Gemini → governed Task/Review flow
   to run for at least 24 hours, with hard exclusions and the start boundary
   enforced for every admitted candidate.
6. Disable Automation and prove zero effective running state and zero owned
   triggers while unrelated triggers remain untouched.
7. Record the bounded result before deciding whether a later Work may broaden
   the scope to normal personal Inbox mail.

Calendar projection is not required for this non-high-impact fixture unless a
later exact handoff explicitly authorizes it. Broad redesign, fallback
providers, speculative hardening, and company rollout remain out of scope.
