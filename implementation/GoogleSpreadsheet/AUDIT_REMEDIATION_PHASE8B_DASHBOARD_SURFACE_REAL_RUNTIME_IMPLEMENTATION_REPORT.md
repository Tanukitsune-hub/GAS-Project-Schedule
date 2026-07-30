# Phase 8B Dashboard Surface Real-Runtime Remediation Implementation Report

Date: 2026-07-30

## Release identity

| Field | Value |
|---|---|
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Code | `2.8.8-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Source A8 | `4140054b03c850f4a1e669b3aa562b305ef78bf5` |
| Release B8 | `SELF (the Git commit containing this report and both packages)` |
| Source/Release relation | direct child required |
| Phase 8B TEST_MODE | `true` |
| Phase 8C TEST_MODE | `false` |
| Automation default | `OFF` |
| Highest status at package generation | `PHASE8B_SANDBOX_NO_GO_DASHBOARD_SURFACE` |
| Real Workspace retransfer/retest | `NOT_EXECUTED` |

## Confirmed root cause

The v2.8.7 Dashboard Protection ownership predicate required
`getEditors().length === 1`. Apps Script may represent the Spreadsheet owner's
inherent edit permission through `Protection.canEdit()` without listing that
owner as an ordinary explicit editor. A canonical S20/S30/S40 Dashboard could
therefore be rejected as `UNSAFE_DASHBOARD_SURFACE`.

v2.8.8 internally proves a non-null Spreadsheet owner, a non-null effective
user equal to the owner, and `canEdit() === true`. It accepts only zero
ordinary explicit editors for the proven implicit owner or exactly the
explicit owner. It fails closed for owner unavailable / Shared Drive,
different effective user, `canEdit=false`, blank/foreign/multiple editor,
warning-only, domain edit, target audience, duplicate/wrong Protection,
non-empty unprotected ranges, and foreign/overlapping range Protection.

## Implementation

Changed Apps Script files:

- `00_Config.gs`: Code version `2.8.8-prepilot`.
- `15_Dashboard.gs`: native Protection ownership proof; exact sheet/header/
  foreign-range control plane; closed surface reason/subreason enum and counts.
- `16_Diagnostics.gs`: safe access mode and conflict enum/count projection only.

`03_SheetBuilder.gs`, `99_TestHarness.gs`, and `appsscript.json` are unchanged.
The existing Setup protection writer remains idempotent and does not weaken or
duplicate Protection.

The surface inspector distinguishes Protection, named range, value, formula,
validation, note, merge, hidden row/column, background, font, number format,
and seed/marker conflicts. It does not expose identities, values, formulas,
notes, range addresses, IDs, or URLs.

## Local validation before package generation

| Check | Result |
|---|---|
| All Node suites | 44 suites; 646 PASS / 0 FAIL / 11 explicit SKIPPED |
| New Dashboard native-runtime suite | 17 PASS / 0 FAIL |
| Prior Quick Diagnostic runtime suite | 6 PASS / 0 FAIL |
| Setup Ledger/resume suite | 10 PASS / 0 FAIL |
| F016 Calendar authority-loss suite | 12 PASS / 0 FAIL |
| Apps Script validator | 11/11 PASS over 22 `.gs` files |
| PowerShell parser | all six v2.8.8 builder/verifier scripts PASS |
| Source A8 boundary | package/report/transfer absent; PASS |
| Secret/local-path scan | PASS, reviewed synthetic test fixtures only |

The 11 explicit SKIPPED cases retain their historical real Workspace /
Provider boundary. They were not weakened, deleted, or promoted to PASS.

## Generated packages

| Package | Files | Payload files | Canonical payload SHA-256 | Verification |
|---|---:|---:|---|---|
| `release/v2.8.8-prepilot/` | 27 | 23 | `fa8c0d2c070c32f818203f936e2df4b2b2d5c2f51e52e93b79ed48cc8ad7da57` | source parity, checksum, secret scan, provenance PASS |
| `release/v2.8.8-prepilot-phase8c/` | 25 | 22 | `cddefd8153de1e53a04261bfbe9758845843f07079c696a61b7b8455bbc333ac` | audited TEST_MODE transform, Test Harness exclusion, checksum, allow-list, secret scan, provenance PASS |

Prepared timestamp for both deterministic builds:
`2026-07-30T15:00:00Z`.

## Release boundary

This Release B8 commit must be the direct child of Source A8 and contain only:

- `implementation/GoogleSpreadsheet/release/v2.8.8-prepilot/`;
- `implementation/GoogleSpreadsheet/release/v2.8.8-prepilot-phase8c/`;
- this implementation report.

The company-PC transfer envelope is generated in a later commit from raw Git
blob comparison between fixed T7 and this Release B8 payload. This report does
not declare Phase 8B PASS, Phase 8C GO, production ready, or pilot ready.
