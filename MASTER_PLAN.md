# Master Plan

Last updated: 2026-08-19

Repository: `Tanukitsune-hub/GAS-Project-Schedule`

Current contract: Code `2.8.20-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Current machine gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

Current personal runtime status: `PERSONAL_GEMINI_E2E_PASS_READY_FOR_PERSONAL_AUTOMATION_QUALIFICATION`

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

## Work 0035: clean main integration

Work 0035 takes the qualified Work 0034 tree and materializes it from current
`main` without merging or replaying the long stacked Draft-PR history. It keeps
current-main governance, preserves the frozen Apps Script and 2.8.20 release
bytes, and makes the completed baseline the canonical repository state.

The merge is permitted only after:

- protected main governance remains unchanged;
- frozen payload parity remains exact;
- the complete gate passes on the PR head and merge ref;
- the validation gate is also valid for canonical `main`, not only the Work
  0035 branch name; and
- no blocker remains.

## Next phase: personal Automation qualification

No company-PC or company-environment deployment is planned. After clean main
integration, the next outcome is to prove controlled automatic operation in the
same personal Google Workspace environment.

The shortest safe sequence is:

1. Keep the 2.8.20 baseline recoverable and Automation OFF.
2. Decide the automatic inbox exclusions. Default decision: exclude newsletters
   and Calendar-generated notification mail from task creation.
3. Prepare a successor production-mode candidate only for changes genuinely
   required to satisfy Automation prerequisites; do not weaken fail-closed
   gates or silently mutate 2.8.20.
4. Confirm readiness with no trigger and no external processing.
5. Enable Automation once and prove exactly one canonical time trigger.
6. Place one fresh synthetic ordinary request in Inbox and prove unattended
   Gmail → Gemini → governed Task/Review completion.
7. Separately test a synthetic due-date case only if Calendar projection is
   explicitly authorized for that Work.
8. Disable Automation and prove the trigger is removed and processing stops.
9. Re-enable for real personal use only after the synthetic automatic E2E and
   rollback checks pass with no BLOCKER.

Product source may reopen only for evidence-backed defects or the minimal
configuration/version changes required for this Automation outcome. Broad
redesign, fallback providers, speculative hardening, and company rollout remain
out of scope.
