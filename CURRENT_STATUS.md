# Current Status

Last updated: 2026-08-11

Candidate version: Code `2.8.16-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Overall status: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

Work 0029 highest permitted status: `READY_FOR_USER_GEMINI_KEY_CONFIGURATION_AND_ONE_MESSAGE_VALIDATION`

Automation: `OFF`

## Current contract

The canonical source is `implementation/GoogleSpreadsheet/apps-script-v2/`.
The current payload remains exactly 23 `.gs` files plus `appsscript.json`.
Phase 8B keeps `TEST_MODE=true` and includes the test harness. Phase 8C is
only the established `TEST_MODE` transform with the harness excluded.
`CURRENT_CONTRACT.json`, release manifests, checksums, and verifiers bind the
source and release commits.

The source contains the isolated Gemini Interactions provider, strict AI
Schema 2.0 post-response validation, exact synthetic fixture guards, bounded
low-thinking generation settings, and the actual runtime Automation-OFF
guard. The provider is not configured by this repository and no real request
is implied by the local gate.

## Historical lineage

- Work 0018: Code `2.8.14-prepilot`, source A14 and release B14. It repaired
  the Gmail Advanced Service body decoding boundary.
- Work 0028: Code `2.8.15-prepilot`, source A15 and release B15. It added the
  Gemini provider boundary and write-time Review observability.
- Work 0029: Code `2.8.16-prepilot`, source A16 and release B16. It activates
  callable readiness and synthetic validation entrypoints without executing
  Gmail, Apps Script functions, or Gemini.

Historical handoffs and reports are immutable evidence. They are not rewritten
to change their original claims.

## Evidence boundary

| Boundary | Status |
|---|---|
| Local source/static/test/release validation | Required and machine-checked |
| Pre-Google GitHub Actions validation | Required before placement |
| Real Gemini request | `NOT_EXECUTED` |
| Real API-key configuration or inspection | `NOT_EXECUTED` |
| Gmail runtime access in Work 0029 | `NOT_EXECUTED` |
| Apps Script function invocation in Work 0029 | `0` |
| Task, Review, Calendar, Setup, Diagnostics, Dashboard, triggers | `NOT_EXECUTED` |
| Company/production resource access | `NOT_AUTHORIZED` |

Local and CI evidence does not establish native Google behavior or Provider
acceptance. The next explicitly bounded user-assisted boundary is manual entry
of a real Gemini key into Script Properties by the user, followed by one
synthetic-message validation in a separately authorized Work. The key must
never be pasted into GitHub, Codex, or ChatGPT.
