# Google Workspace Personal Work OS v2.8.7
# Phase 8B Sandbox retransfer — fixed-ref fresh-clone verification

Date: 2026-07-30
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Target branch: `codex/r5-independent-reaudit-transfer-prep`
Fixed transfer ref: `008c643b85c6b234ad489d946033cb9c06d32920` (T7)

## 1. Result and scope

Result: `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`

This result permits only controlled carriage of the fixed non-confidential
v2.8.7 Phase 8B package and its company-PC patch manifest. It does not execute
or authorize real Google Workspace actions. The real Workspace
retransfer/retest is `NOT_EXECUTED`; Automation remains `OFF`.

No Spreadsheet, Gmail, Calendar, OAuth, Apps Script import, Setup,
deployment, `clasp push`, trigger enablement, Provider configuration, real
data, real identifiers, URLs, credentials, or screenshots were used or stored
for this verification.

## 2. Immutable lineage and commit boundaries

| Record | SHA | Boundary / verified relation |
|---|---|---|
| Historical fixed transfer T6.1 | `863217b99dfa1ad682a8f4dd1989212b0a8d548b` | immutable v2.8.6 comparison source |
| Source A7 | `be2e551da310a9b7c0611f3aef8899309a3d7b69` | source, tests, tools, canonical docs, visualization, incident, recovery only; no generated v2.8.7 package/report/transfer |
| Release B7 | `95bc7240d99124b245e188b8e646eccf6c3ead48` | direct child of A7; only `release/v2.8.7-prepilot/`, `release/v2.8.7-prepilot-phase8c/`, and the implementation report |
| Transfer-verifier C7 | `ba175d3994c86dacc76bad3537df97e3e644dc09` | independently demonstrated manifest-verifier correction only; no release-package byte changed |
| Fixed transfer T7 | `008c643b85c6b234ad489d946033cb9c06d32920` | transfer envelope, operator material, raw-byte patch manifests, and transfer checksums only |
| Evidence E7 | `SELF (this evidence-only commit)` | current-doc and audit proof only; never a transfer target and changes no package, transfer, source, test, or tool file |

The normal non-force publication advanced the target branch from
`de24f049051d43cd54123bfd1a145f46f8c5131d` through the above T7 chain. The
remote target branch was resolved to T7 before this evidence-only record.

## 3. Root-cause correction coverage

| Finding | Confirmed correction | Regression evidence |
|---|---|---|
| `DASHBOARD_LAYOUT_OWNERSHIP` | Only the exact Setup-owned Dashboard protection/control plane and three-row pre-refresh seed are accepted; foreign/overlapping protections, user data, formulas, notes, named ranges, merges, hidden state, malformed markers, duplicate keys, and unsafe formatting remain fail-closed. | `phase8b_quick_diagnostic_real_runtime_test.js`; `prepilot_dashboard_safety_test.js` |
| `TASK_PROTECTIONS` | Shared canonical Task header geometry validates one owner-only protection across rows 1–2 and all 50 columns, including idempotence and negative geometry cases. | `phase1_audit_test.js`; runtime suite |
| `BLANK_ROW_BOOLEAN_VALUES` | An identity-empty row permits only schema-defined checkbox Boolean `false` materialized by the Sheets contract; `true`, strings, non-checkbox values, business data, and partial identity remain strict failures. | runtime suite; Setup resume suite |
| `TASK_VALIDATION_TYPES` | Expected checkbox columns derive from `validationPlanForSheet(Tasks)`, including hidden `calendar_reconcile_required`; missing and unexpected checkbox validation remain failures. | runtime suite; `99_TestHarness.gs` contract checks |

The source change set touches these Apps Script payload files: `00_Config.gs`,
`01_TypesAndSchemas.gs`, `03_SheetBuilder.gs`, `15_Dashboard.gs`,
`16_Diagnostics.gs`, and `99_TestHarness.gs`. `02_Setup.gs` was not changed:
the added resume regression demonstrated that its existing staged resume path
meets the corrected diagnostic contract without duplicate external resources.

## 4. Fixed T7 company-PC patch proof

The transfer manifest compares raw Git blob bytes from T6.1 v2.8.6 payload to
T7 v2.8.7 payload. It reports six changed payload files, 17 byte-identical
payload files, no additions/deletions, and `appsscript.json` unchanged.

| Replacement order | Path | T6.1 SHA-256 | T7 SHA-256 |
|---:|---|---|---|
| 1 | `00_Config.gs` | `b0492460453814e2b0938e58d9063a368ce6501a01d309c0285dd501051a16de` | `a0c5f8a26d2211bb6c57da0712da0ae61f372404856136c12a949b35c9e0c8a2` |
| 2 | `01_TypesAndSchemas.gs` | `4d78f9fb97165d42c55c551a41368f7a4f2d485ab2c90a5fa44ee0d44582d2dc` | `1096aa80cd95fc4f4215072cdcdf88a059e1e36ce4c48c6521dfad9b6cf0f250` |
| 3 | `03_SheetBuilder.gs` | `b802b6c8f0f0ec23f530cee6baf1510650ba3f45b7f542f22f820021068f6527` | `de99de32edb15b90a437788446bdb05a86a13e76853fa1a73347e0ae55fccbf6` |
| 4 | `15_Dashboard.gs` | `48729ccf04a9f443e92b5dc96218ae05a23e512e1e5de050b1ab5799f0a78012` | `fa2cb636997aa756b7f804b14672f9ac9a80944c5b36e09bb17380eb7b67bc42` |
| 5 | `16_Diagnostics.gs` | `4c2911a988e7055888d6a58a99bcaea9628cf96312ad2315b828c08889d67b9c` | `22b4d57fa491c9b3ddc08dc5bccfaa5dd91ca36700137b081cb67c492ce6c8f0` |
| 6 | `99_TestHarness.gs` | `8d7c2f7a6057f992560c2a68d46194216f2c02427e41b5215a476e0e9c183873` | `ea25116676844c739dda9873756295c3c32859ab9bf882f929c51b87e91673ab` |

The authoritative operator instructions are the immutable T7 files:

- `implementation/GoogleSpreadsheet/transfer/v2.8.7-prepilot/COMPANY_PC_PATCH_MANIFEST_ja.md`
- `implementation/GoogleSpreadsheet/transfer/v2.8.7-prepilot/COMPANY_PC_PATCH_MANIFEST.json`

They require a stop if any local company-PC payload does not match its expected
T6.1 hash before replacement, prohibit all manual Sheet/Ledger/Protection/
Dashboard/Gmail/Calendar/trigger/Task-data repair, keep Automation OFF, and
resume only from the observed S00–S80-complete / S90-S99-incomplete state after
separate authorization.

## 5. Exact local and fresh-clone verification

The fixed T7 ref was cloned from the HTTPS remote into a new detached worktree
with `core.autocrlf=false`; `git status --short` was empty before verification.

| Check | Result |
|---|---|
| All Node suites | 43 suites; `629 PASS / 0 FAIL / 11 explicit skips` |
| New real-runtime Quick Diagnostic suite | `6 PASS / 0 FAIL` |
| Setup Ledger visibility/resume suite | `10 PASS / 0 FAIL` |
| F016 Calendar authority-loss suite | `12 PASS / 0 FAIL` |
| Apps Script static validator | `11/11 PASS` over 22 `.gs` files |
| Remote publication consistency (A7/B7 environment refs) | `8/8 PASS` |
| Phase 8B package verifier | PASS: source parity, checksum, allow-list, provenance, secret scan, Automation OFF |
| Phase 8C package verifier | PASS: parity, checksum, scope/advanced-service allow-lists, Phase 8C exclusion, provenance, secret scan, Automation OFF |
| Independent rebuild from detached A7 | Phase 8B `27/27`, Phase 8C `25/25`; `0` byte mismatches |
| Company-PC patch manifest verifier | PASS: raw-blob parity, transfer checksums, safe resume contract |
| Generic transfer-envelope verifier | PASS: canonical checksums, allow-list, secret/local-path scan |
| Secret / credential / local-path / real-ID / URL scan | PASS across source, v2.8.7 packages, and transfer envelope |

Package bundle SHA-256 values:

- Phase 8B: `a0d28ba0d4ba15581f011e62d84aab4c05b1f55c6018b78add9d9c872ba572a8`
- Phase 8C: `db756bfc46eadfb6d16ed6aad4de8b835d436d5c11d915739ea34023b4a7bb98`

## 6. Remaining boundaries and review focus

There are no unresolved local/static, package-integrity, or transfer-safety
findings in this evidence. The real Workspace retransfer/retest remains
`NOT_EXECUTED`, and GitHub Actions/CI is not configured for this branch/PR
scope. Draft PR review should focus on: (1) exact source/release/transfer/
evidence boundaries, (2) the raw-byte six-file manifest and unchanged
`appsscript.json`, (3) fail-closed negative diagnostic coverage, and (4) the
carriage-only interpretation of the recorded status.
