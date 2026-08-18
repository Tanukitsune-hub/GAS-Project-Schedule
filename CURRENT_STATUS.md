# Current Status

Last updated: 2026-08-18

Candidate version: Code `2.8.20-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Overall status: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

Work 0032 highest permitted status: `READY_FOR_USER_GEMINI_DIAGNOSTIC_ONE_MESSAGE_RETRY`
Work 0033 highest permitted status: `READY_FOR_USER_GEMINI_E2E_RETRY_AFTER_SCHEMA_COMPATIBILITY_REPAIR`

Automation: `OFF`

## Current contract

The canonical source is `implementation/GoogleSpreadsheet/apps-script-v2/`.
The current payload remains exactly 23 `.gs` files plus `appsscript.json`.
Phase 8B keeps `TEST_MODE=true` and includes the test harness. Phase 8C is
only the established `TEST_MODE` transform with the harness excluded.
`CURRENT_CONTRACT.json`, release manifests, checksums, and verifiers bind the
source and release commits.

The source contains the isolated Gemini Interactions provider, a smaller
provider-facing structured-output schema projection, strict AI Schema 2.0
post-response validation, exact synthetic fixture guards, bounded low-thinking
generation settings, the actual runtime Automation-OFF guard, privacy-safe
provider diagnostics, Message-only failure finalization, and exact synthetic
candidate pinning. Completed response grammar remains strictly
`thought* model_output`; thought signatures and summaries are opaque and never
retained or exposed. The active transport remains `/v1beta/interactions`.

The Gemini credential is never stored in this repository. The user has already
configured it manually in the personal-synthetic Apps Script target, and
network-free readiness returned READY. User-controlled real Gemini attempts
have reached the provider outside Codex, but Gemini E2E has not yet passed
because no real classification and Task were completed. Work 0032 itself made
no real Gemini request and prepared the next attempt to return bounded,
actionable diagnostics if it fails.

## Historical lineage

- Work 0018: Code `2.8.14-prepilot`, source A14 and release B14. It repaired
  the Gmail Advanced Service body decoding boundary.
- Work 0028: Code `2.8.15-prepilot`, source A15 and release B15. It added the
  Gemini provider boundary and write-time Review observability.
- Work 0029: Code `2.8.16-prepilot`, source A16 and release B16. It activates
  callable readiness and synthetic validation entrypoints without executing
  Gmail, Apps Script functions, or Gemini.
- Work 0030: Code `2.8.17-prepilot`, source A17 and release B17. It repairs
  strict Gemini thinking-step parsing without configuring a key, requesting
  Gemini, or invoking an Apps Script function.
- Work 0031: Code `2.8.18-prepilot`, source A18 and release B18. It established
  the current `/v1beta/interactions` transport candidate and preserved the
  Work 0030 parser and one-call boundary.
- Work 0032: Code `2.8.19-prepilot`, source A19 and release B19. It repairs
  privacy-safe Gemini provider diagnostics, Message failure finalization, and
  exact synthetic candidate routing without configuring a key, requesting
  Gemini, or invoking an Apps Script function in Codex.
- Work 0033: Code `2.8.20-prepilot`, source A20 and release B20. It adds the
  minimal provider-facing schema compatibility projection while preserving
  canonical AI Schema 2.0 validation and all Work 0032 safety boundaries.

Historical handoffs and reports are immutable evidence. They are not rewritten
to change their original claims.

## Evidence boundary

| Boundary | Status |
|---|---|
| Local source/static/test/release validation | Required and machine-checked |
| Pre-Google and final-head GitHub Actions validation | PASS |
| Work 0032 real Gemini request by Codex | `0` |
| Work 0032 Gmail/Task/Review/Calendar runtime by Codex | `0` |
| Personal-sandbox credential configuration by user | `CONFIGURED_OUTSIDE_REPOSITORY` |
| Personal-sandbox real Gemini call | `EXECUTED`; E2E not yet PASS |
| Latest pre-2.8.20 live attempt | Failed at provider request schema; historical state retained |
| Next permitted action | One fresh exact synthetic-message retry on Code `2.8.20-prepilot` |
| Company/production resource access | `NOT_AUTHORIZED` |

The next boundary is not API-key entry. Use one fresh exact synthetic Gmail
Message, ensure only that fresh Message carries `手動/取込`, and invoke
`Gemini synthetic validation (one request)` once on Code `2.8.20-prepilot`.
Prior failed or stuck Messages remain evidence and must not be reused. If the
attempt succeeds, the personal-environment Gemini E2E completion condition is
met and the candidate can move to code freeze. If it fails, the bounded Work
OS code/stage, provider HTTP status and machine code, checkpoint, and
failure-finalization state are the sole basis for one minimal follow-up repair.
