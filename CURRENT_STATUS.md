# Current Status

Last updated: 2026-08-19

Candidate version: Code `2.8.21-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Overall status: `PERSONAL_GEMINI_E2E_PASS_READY_FOR_PERSONAL_AUTOMATION_QUALIFICATION`

Machine gate: `READY_FOR_USER_PERSONAL_AUTOMATION_E2E`

Personal Gemini E2E: `PASS`

Automation: `OFF`

## Current contract

The canonical source is `implementation/GoogleSpreadsheet/apps-script-v2/`.
The payload is exactly 23 `.gs` files plus `appsscript.json`. Phase 8B keeps
`TEST_MODE=true` and the test harness. Phase 8C is the audited
audited production-mode transform with the harness excluded and Automation OFF.
`CURRENT_CONTRACT.json`, release manifests, checksums, and verifiers bind the
A21/B21 candidate while preserving historical A20/B20 source and release
evidence.

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

## Historical lineage

- Work 0018: Code `2.8.14-prepilot`, source A14 and release B14. It repaired
  the Gmail Advanced Service body decoding boundary.
- Work 0028: Code `2.8.15-prepilot`, source A15 and release B15. It added the
  Gemini provider boundary and Review observability.
- Work 0029: Code `2.8.16-prepilot`, source A16 and release B16. It added the
  callable readiness and synthetic validation boundary.
- Work 0030: Code `2.8.17-prepilot`, source A17 and release B17. It repaired
  strict Gemini thinking-step parsing.
- Work 0031: Code `2.8.18-prepilot`, source A18 and release B18. It established
  the `/v1beta/interactions` transport candidate.
- Work 0032: Code `2.8.19-prepilot`, source A19 and release B19. It hardened
  bounded diagnostics, failure finalization, and exact candidate routing.
- Work 0033: Code `2.8.20-prepilot`, source A20 and release B20. It added the
  provider-schema compatibility projection; the subsequent user-controlled
  personal Gemini E2E passed.
- Work 0036: Code `2.8.21-prepilot`, source A21 and release B21. It narrows
  automatic discovery to the exact synthetic fixture, adds personal
  operator/readiness and candidate-preparation guards, and preserves A20/B20.

Historical handoffs and reports remain immutable evidence.

## Evidence boundary

| Boundary | Status |
|---|---|
| Local source/static/test/release validation | `PASS` |
| Personal-sandbox Gemini E2E | `PASS` |
| E2E result | `COMPLETE`; 1 processed; 1 Task; 1 Review; 0 errors; `DONE` |
| Calendar job for the non-calendar fixture | `0` |
| Automation after E2E | `CONSISTENT`; disabled; zero clock triggers |
| Frozen 2.8.20 recovery payload | 23 `.gs` + manifest; SHA-256 `ced2ce52cd4a3faa46c66f0e1971a7cebb14334ca7d3f2bcb3ec79799c82effe` |
| Active 2.8.21 qualification scope | `SYNTHETIC_AUTOMATION_QUALIFICATION_ONLY`; exact subject/body; max 1 |
| Company-PC / company-environment rollout | `NOT PLANNED` |

## Next boundary

After the Work 0035 baseline is canonical and the Work 0036 candidate gate is
green, the next boundary is controlled personal-environment Automation
qualification. It must begin with
Automation OFF, settle the approved inbox exclusions and provider approval
configuration, use a production-mode successor candidate where required, and
prove enable, one-trigger ownership, automatic synthetic Gmail-to-Task/Review
processing, any explicitly authorized Calendar projection, and complete disable
rollback. Real personal mail is out of scope until that synthetic automatic E2E
passes.
