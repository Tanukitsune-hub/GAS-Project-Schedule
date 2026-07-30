# Phase 8B Quick Diagnostic real-runtime remediation — implementation report

- Date: 2026-07-30
- Release: Code `2.8.7-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- Source A7: `be2e551da310a9b7c0611f3aef8899309a3d7b69`
- Release B7: `SELF (the Git commit containing this report and both release packages)`
- Current package-generation gate: `PHASE8B_SANDBOX_NO_GO_QUICK_DIAGNOSTIC`
- Automation default: `OFF`
- Corrective-package real Google Workspace retest: `NOT_EXECUTED`

## Scope and immutable history

This report documents the additive v2.8.7 release generated from Source A7.
It does not modify the historical v2.8.5/P10 or v2.8.6/A6/B6/T6.1 packages or
transfer envelopes. The observed real-Sandbox facts are recorded only as safe
finding categories; no Workspace identifiers, URLs, screenshots, account data,
credentials, message data, Calendar data, or personal/business data are stored.

Release B7 contains only:

- `release/v2.8.7-prepilot/`
- `release/v2.8.7-prepilot-phase8c/`
- this implementation report

## Confirmed root causes and corrections

| Finding | Root cause | Correction | Fail-closed boundary retained |
|---|---|---|---|
| `DASHBOARD_LAYOUT_OWNERSHIP` | The diagnostic did not model the exact S20/S30/S40 Setup-owned Dashboard sheet/header protections, formatting, and three-row pre-refresh seed. | `00_Config.gs`, `03_SheetBuilder.gs`, and `15_Dashboard.gs` use one exact canonical seed/control-plane contract and accept equivalent native white background representations. | Foreign/overlapping protections, values, formulas, notes, named ranges, merges, hidden rows/columns, malformed markers, duplicate keys, and unsafe formatting remain conflicts. |
| `TASK_PROTECTIONS` | Setup protected Task rows 1–2 and all 50 columns while diagnostic geometry expected a divergent one-row range. | `01_TypesAndSchemas.gs`, `03_SheetBuilder.gs`, and `16_Diagnostics.gs` share canonical row 1–2 / 50-column geometry. | Missing, misaligned, permissive, or duplicate protection fails. |
| `BLANK_ROW_BOOLEAN_VALUES` | Native Sheets can materialize checkbox Boolean `false` in identity-empty preallocated Task rows after validation application. | `16_Diagnostics.gs` permits only canonical checkbox Boolean `false` on an identity-empty row. | `true`, string Boolean, non-checkbox data, partial identity, and business data still fail. |
| `TASK_VALIDATION_TYPES` | Diagnostic used a divergent fixed four-field checkbox list and omitted hidden `calendar_reconcile_required`. | `16_Diagnostics.gs` and `99_TestHarness.gs` derive expectations from `validationPlanForSheet(Task)`. | Missing canonical checkbox validation or unexpected checkbox validation fails. |

Quick Diagnostic remains read-only. The S00–S80 resume regression proves that
only S90/S99 resume, existing synthetic Gmail-label/Calendar/edit-trigger state
is neither duplicated nor deleted, and Automation/five-minute trigger remain
OFF. No real Workspace operation was executed by this work.

## Changed Apps Script payload files

- `00_Config.gs` — Code version and canonical Dashboard safe seed.
- `01_TypesAndSchemas.gs` — shared Task header protection geometry.
- `03_SheetBuilder.gs` — shared header geometry and configuration-owned seed.
- `15_Dashboard.gs` — strict Setup-owned Dashboard control-plane recognition.
- `16_Diagnostics.gs` — schema-driven checkboxes, blank-row semantics, and
  raw partial-identity visibility.
- `99_TestHarness.gs` — canonical 50-column/five-checkbox acceptance contract.

`02_Setup.gs` was reviewed but did not require a product change: its existing
idempotent S00–S80/S90/S99 stage logic is covered by the new resume regression.

## Local release verification

| Check | Result |
|---|---|
| All Node suites | `43` suite files; `629 PASS / 0 FAIL / 11 explicit skips` |
| New real-runtime diagnostic suite | `6 PASS / 0 FAIL` |
| Setup Ledger visibility/resume suite | `10 PASS / 0 FAIL` |
| F016 Calendar authority-loss suite | included in the full local suite run; PASS |
| Apps Script validator | `11/11 PASS` across `22` `.gs` files |
| Phase 8B package verifier | PASS |
| Phase 8C package verifier | PASS |
| Phase 8B payload bundle SHA-256 | `a0d28ba0d4ba15581f011e62d84aab4c05b1f55c6018b78add9d9c872ba572a8` |
| Phase 8C payload bundle SHA-256 | `db756bfc46eadfb6d16ed6aad4de8b835d436d5c11d915739ea34023b4a7bb98` |
| Phase 8B package inventory | `27` package files / `23` payload files |
| Phase 8C package inventory | `25` package files / `22` payload files |
| Source-to-package parity, checksum, allow-list, provenance, secret scan | PASS in both package verifiers |

The release package carries Source A7 exactly and uses `SELF` for the
not-yet-knowable B7 release-content commit. Transfer T7, the raw-byte company-PC
patch manifest, independent rebuild parity, remote resolution, and fresh
detached HTTPS clone evidence are deliberately outside this Release B7 boundary.

## Status and prohibited interpretations

This local release report is not evidence of a corrective-package real Workspace
run. It does not declare Phase 8B PASS, Phase 8C GO, production ready, or pilot
ready. The maximum status remains `PHASE8B_SANDBOX_NO_GO_QUICK_DIAGNOSTIC`
until the separate T7 transfer and independent remote/fresh-clone verification
steps are complete.
