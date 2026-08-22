# Current Status

Last updated: 2026-08-23

Candidate version: Code `2.8.21-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Overall status: `HOLD_USER_AUTOMATION_E2E_LIVE_AI_SCHEMA_FAILURE`

Machine gate: `READY_FOR_USER_PERSONAL_AUTOMATION_E2E`

ChatGPT review disposition: `HOLD — LIVE_GEMINI_RESPONSE_FAILED_STRICT_AI_SCHEMA_2_0`

Personal Gemini E2E: `PASS`

Automation: `STOP_REQUESTED_AFTER_LIVE_FAILURE — USER_OFF_CONFIRMATION_PENDING`

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
Work 0036 is its direct 2.8.21 successor for synthetic-only personal
Automation qualification. No company-PC or company-environment rollout is
planned.

## Work 0036 implementation evidence

- Draft PR `#51` remains Open / Unmerged.
- Runtime-preparation-fix source repair commit: `0f0b7eab0ed27b883ae25fb15af4371b42157662`.
- Runtime-preparation-fix release commit: `3a4c053ba9775659d5bb902ff0f7cd0bcffba531`.
- Runtime-preparation-fix pre-placement head: `dab94362c34e837bb236186ace7c0cf9c0f63e40`.
- Runtime-preparation-fix pre-placement push/PR CI: `#32268303659` / `#32268311064`, both PASS.
- Complete non-Google gate: 11/11 PASS.
- Deterministic regression inventory: 78 suites, missing 0, extra 0.
- Phase 8B/8C release verification and A21/B21 lineage: PASS.
- Historical 2.8.20 release preservation: PASS.
- Secret/local-state scan: 0 hits.
- Existing personal-synthetic target review-fix replacement: one guarded Phase
  8C update and one independent pull-back, exact parity PASS.
- Review-fix final CI `#400`: PASS.
- ChatGPT docs-only clarification CI `#402`: PASS.
- Production preparation caller regression: production no-argument status path
  and Test-mode dependency injection are both covered; the production guard
  remains fail-closed.
- Runtime-preparation-fix replacement lane: one guarded Phase 8C update and
  one independent pull-back, exact parity PASS.

## Work 0036 preparation/readiness/enable live checkpoints

The repaired preparation path subsequently passed live on the existing
personal-synthetic target. The candidate version metadata aligned to Code
`2.8.21-prepilot` while Automation remained OFF and no external request was
performed.

The authoritative readiness check then returned
`READY_FOR_CONTROLLED_QUALIFICATION` with Setup/version, production-shaped exact
synthetic scope, approvals, Gemini credential/adapter, OAuth, all seven formal
Gmail labels, dedicated Calendar, and zero-trigger Automation-OFF state ready.

The user explicitly enabled Automation once. The immediate live status was
`CONSISTENT` with enabled/desired enabled `true`, exactly one canonical
5-minute clock trigger, zero duplicates, and prerequisites ready.

## Live user evidence: scheduled Automation AI-schema failure

On 2026-08-23 the normal scheduled trigger discovered exactly one fresh exact
Work 0036 synthetic candidate. The run reached the real Gemini classification
boundary, then failed before Task/Review/Calendar output.

Bounded evidence:

- trigger: `TIME_DRIVEN`
- mode: `AUTO_PHASE6`
- candidate count: `1`
- processed count: `0`
- created/updated/review counts: `0`
- error count: `1`
- run status: `FAILED`
- run note: `MESSAGE_FAILED`
- error stage: `AI_RESPONSE`
- error code: `E_AI_SCHEMA`
- error category: `INVALID_RESPONSE`
- message state: `AUTOMATIC_QUALIFICATION -> CLASSIFY -> DEAD`
- retry count: `0`

The provider response and email content were not persisted. Source review shows
that the provider-facing structured-output schema cannot express all of the
stricter action-type-dependent semantic rules enforced by canonical AI Schema
2.0 validation. `parseCanonicalResponse()` also collapses the specific safe
canonical validation reason into generic `E_AI_SCHEMA`, so the exact violating
field cannot be recovered from this completed run without violating the privacy
boundary.

This is a Work 0036 BLOCKER for the user Automation E2E. Do not retry the
synthetic candidate or Dead Letter and do not re-enable Automation.

Authoritative continuation handoff:

- `docs/handoffs/0036-live-ai-schema-failure-fix-instruction.md`

The required repair must preserve strict validation, one Gemini call, no
provider retry/fallback, exact synthetic-only scope, and privacy-safe logging.
It must harden the Gemini semantic output instructions and add bounded
allowlisted schema-violation diagnostics without storing raw provider output.

## Historical preparation defect and repair

Earlier in Work 0036, the first live `個人用合成Automationを準備` action stopped
fail-closed with `WorkOsAppError: Automation依存注入はTest modeだけで利用できます。`
The root cause was a production caller passing an injected options object into
the Automation status boundary. The runtime-preparation repair changed the
production caller to the real no-argument status path while preserving Test-mode
injection and the production guard. That repair was regenerated, placed on the
same target, and independently pulled back with exact parity before the later
live checkpoints above.

Historical handoffs and reports remain immutable evidence.

## Historical lineage

- Work 0018: Code `2.8.14-prepilot`, source A14 and release B14.
- Work 0028: Code `2.8.15-prepilot`, source A15 and release B15.
- Work 0029: Code `2.8.16-prepilot`, source A16 and release B16.
- Work 0030: Code `2.8.17-prepilot`, source A17 and release B17.
- Work 0031: Code `2.8.18-prepilot`, source A18 and release B18.
- Work 0032: Code `2.8.19-prepilot`, source A19 and release B19.
- Work 0033: Code `2.8.20-prepilot`, source A20 and release B20; the subsequent
  user-controlled personal Gemini E2E passed.
- Work 0036: Code `2.8.21-prepilot`, source A21 and release B21; automatic
  discovery, readiness, preparation, and trigger enablement reached live PASS,
  but the first scheduled exact synthetic candidate failed at strict Gemini
  response validation with `E_AI_SCHEMA`.

## Next boundary

First confirm Automation is disabled after the failed live run: enabled false,
desired false, zero owned clock triggers, no stored trigger ID, and no canonical
trigger residue.

Then implement and validate the bounded Work 0036 Gemini-response contract
hardening under `docs/handoffs/0036-live-ai-schema-failure-fix-instruction.md`.
No repaired Apps Script target placement is allowed until the Automation-OFF
confirmation is recorded. The user-controlled E2E retry remains separately
explicit and ordinary personal Inbox mail remains out of scope.
