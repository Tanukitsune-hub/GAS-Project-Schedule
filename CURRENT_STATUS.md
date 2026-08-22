# Current Status

Last updated: 2026-08-23

Candidate version: Code `2.8.21-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Overall status: `HOLD_USER_AUTOMATION_E2E_LIVE_AI_SCHEMA_FAILURE`

Machine gate: `READY_FOR_USER_PERSONAL_AUTOMATION_E2E`

ChatGPT review disposition: `HOLD — LIVE_GEMINI_RESPONSE_FAILED_STRICT_AI_SCHEMA_2_0`

Personal Gemini E2E: `PASS`

Automation: `OFF — CONSISTENT / ZERO CLOCK TRIGGERS / NO STORED OR CANONICAL TRIGGER RESIDUE`

User Automation E2E: `FAILED_AT_AI_RESPONSE_SCHEMA_VALIDATION`

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
Work 0036 remains its direct 2.8.21 successor for synthetic-only personal
Automation qualification. No company-PC or company-environment rollout is
planned.

## Work 0036 live Automation evidence

The user completed the preparation/readiness boundary and enabled exactly one
canonical 5-minute Automation trigger. The first scheduled run after one exact
synthetic fixture reached the real Gemini response boundary and failed closed:

- trigger type: `TIME_DRIVEN`
- mode: `AUTO_PHASE6`
- candidate count: `1`
- processed count: `0`
- created task count: `0`
- updated task count: `0`
- review count: `0`
- error count: `1`
- run status: `FAILED`
- run note: `MESSAGE_FAILED`
- error stage: `AI_RESPONSE`
- error code: `E_AI_SCHEMA`
- error category: `INVALID_RESPONSE`
- retry count: `0`
- no Task/Review/Calendar output was created

The exact provider output was intentionally not persisted, so the precise
violating canonical field cannot be recovered from the completed run. This is
consistent with the repository privacy contract and must not be bypassed by
logging raw provider material.

After the failure, the user explicitly stopped Automation and immediately
verified the live state as `CONSISTENT` with:

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

The remaining watermark/last-run markers are expected evidence that the
scheduled run occurred; they are not trigger residue.

## Active continuation

The user E2E is HOLD. Do not retry the synthetic candidate, dead-letter item,
Automation enablement, or provider call until the live AI-schema failure repair
is implemented, regenerated, placed, and independently reviewed.

Authoritative handoff:

- `docs/handoffs/0036-live-ai-schema-failure-fix-instruction.md`
- `docs/handoffs/0036-live-ai-schema-failure-fix-addendum.md`

The exact OFF/zero-trigger prerequisite required by the handoff is now
satisfied. One fresh repaired Phase 8C placement tranche may be used by Codex
only after all required local gates and exact-head CI pass, and only under the
handoff's one-update/one-pull-back limits.

Real personal Inbox mail remains out of scope. PR #51 remains Draft/Open/Unmerged.
