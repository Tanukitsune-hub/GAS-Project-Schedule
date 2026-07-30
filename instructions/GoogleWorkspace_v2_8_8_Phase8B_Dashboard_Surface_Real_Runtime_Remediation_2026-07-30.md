# Google Workspace Personal Work OS v2.8.8
# Phase 8B Dashboard Surface Real-Runtime Remediation 指示

- Date: 2026-07-30
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
- Working branch: `codex/r5-independent-reaudit-transfer-prep`
- Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/8`
- Current remote baseline before this instruction: `8fbb278496089edfa33899f426e08a9b5adaadd3`
- Current Source A7: `be2e551da310a9b7c0611f3aef8899309a3d7b69`
- Current Release B7: `95bc7240d99124b245e188b8e646eccf6c3ead48`
- Current fixed transfer ref T7: `008c643b85c6b234ad489d946033cb9c06d32920`
- Required new Code version: `2.8.8-prepilot`
- Schema / AI Schema / Migration remain: `2.6` / `2.0` / `3`
- Starting operational gate: `PHASE8B_SANDBOX_NO_GO_DASHBOARD_SURFACE`
- Maximum after full local/remote/fresh-clone verification: `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`

## 1. Mandatory execution rule

This is an implementation execution task. Do not stop after analysis, a proposed plan, a rewritten prompt, or a root-cause hypothesis.

Perform the implementation, regression tests, package generation, source/release/transfer lineage, company-PC differential patch manifest, normal push, Draft PR update, and detached fresh-clone verification. If a genuine blocker prevents execution, stop with a precise `NO-GO_*` status and evidence.

## 2. Real Google Workspace evidence

A real company Google Workspace Sandbox had previously completed Setup stages S00 through S80 under v2.8.6, with Automation OFF. The operator replaced the six T7 patch-manifest files with the fixed v2.8.7 payload and selected `セットアップを続行`.

Setup again stopped safely at S90:

```text
status: FAILED
code: E_QUICK_DIAGNOSTIC_FAILED
stage: S90_QUICK_DIAGNOSTIC
completed_stages:
  - S00_VALIDATE_ENV
  - S10_CREATE_SHEETS
  - S20_CREATE_SCHEMAS
  - S30_APPLY_SMALL_VALIDATIONS
  - S40_SEED_SAFE_SETTINGS
  - S50_CREATE_GMAIL_LABELS
  - S60_CREATE_DEADLINE_CALENDAR
  - S70_STORE_PROPERTIES
  - S80_CREATE_EDIT_TRIGGER
```

The operator then ran exactly one explicit read-only Quick Diagnostic. The following safe finding was observed:

```text
id: DASHBOARD_LAYOUT_OWNERSHIP
status: FAIL
safe_message: Dashboard layout conflictを検出しました。修復や更新は行っていません。
details.error_code: E_DASHBOARD_LAYOUT_CONFLICT
details.conflict_reason_code: UNSAFE_DASHBOARD_SURFACE
external_services_called: false
repair_performed: false
```

Do not commit screenshots, Spreadsheet IDs, URLs, account names, email addresses, Calendar IDs, Gmail data, credentials, bookmarks, or business data. Record only the safe fields above.

The screenshot confirms this Dashboard finding. Do not assume from this record alone that no other FAIL exists; all prior v2.8.7 corrected checks must remain covered and must PASS in the regression suite.

Treat this as `PHASE8B-DASHBOARD-01`, severity High for Phase 8B execution readiness because S90/S99 cannot complete in the actual target runtime.

## 3. Immediate safety boundary

The user must not rerun Setup, Quick/Deep Diagnostic, Dashboard refresh, manual Gmail import, Calendar sync, Automation, or any trigger. The current Sandbox remains evidence at S00-S80 complete / S90-S99 incomplete.

Do not ask the user to edit Dashboard cells, values, notes, formats, protections, named ranges, merges, hidden rows/columns, Gmail labels, Calendar, Properties, triggers, Task data, or the Task Authority Ledger.

Codex must not perform any real Workspace operation.

## 4. Mandatory repository reading

Read and follow, in order:

1. root `README.md`;
2. applicable `AGENTS.md`, if present;
3. `CONTRIBUTING.md`, if present;
4. `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`;
5. `CURRENT_STATUS.md`;
6. `DECISIONS.md`;
7. `PROJECT_CONTEXT.md`;
8. `MASTER_PLAN.md`;
9. `docs/TASK_AUTHORITY_PROTOCOL.md`;
10. `docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`;
11. the v2.8.7 implementation instructions and reports;
12. `implementation/GoogleSpreadsheet/apps-script-v2/03_SheetBuilder.gs`;
13. `implementation/GoogleSpreadsheet/apps-script-v2/15_Dashboard.gs`;
14. `implementation/GoogleSpreadsheet/apps-script-v2/16_Diagnostics.gs`;
15. related Dashboard, Setup, protection, fake-runtime, and company-PC patch-manifest tests/tools;
16. fixed T7 release/transfer payload and E7 fresh-clone audit;
17. PR #8 body, changed files, comments, checks, and Draft state.

Confirm remote, branch, HEAD, working tree, staged/unstaged/untracked state, and A7/B7/C7/T7/E7 lineage. Fetch normally. Use a new clean worktree based on the latest remote instruction commit. Preserve unrelated changes and all historical artifacts.

## 5. Root-cause investigation: do not broadly relax the Dashboard contract

The v2.8.7 `UNSAFE_DASHBOARD_SURFACE` code is still too coarse. Determine the exact native condition that caused the canonical S20/S30/S40 Dashboard state to be rejected.

Replace internal Boolean-only surface checks with a closed, non-sensitive structured inspection result. The read-only diagnostic may report only enum-like reason codes and counts; it must never report cell values, notes, formulas, email addresses, user identities, range addresses, IDs, URLs, or other Workspace-specific data.

At minimum distinguish:

- `DASHBOARD_SHEET_PROTECTION_CONTRACT`;
- `DASHBOARD_HEADER_PROTECTION_CONTRACT`;
- `DASHBOARD_FOREIGN_OR_OVERLAPPING_RANGE_PROTECTION`;
- `DASHBOARD_FOREIGN_NAMED_RANGE`;
- `DASHBOARD_VALUE_CONFLICT`;
- `DASHBOARD_FORMULA_CONFLICT`;
- `DASHBOARD_VALIDATION_CONFLICT`;
- `DASHBOARD_NOTE_CONFLICT`;
- `DASHBOARD_MERGE_CONFLICT`;
- `DASHBOARD_HIDDEN_ROW_OR_COLUMN`;
- `DASHBOARD_BACKGROUND_CONFLICT`;
- `DASHBOARD_FONT_CONFLICT`;
- `DASHBOARD_NUMBER_FORMAT_CONFLICT`;
- `DASHBOARD_SEED_OR_MARKER_CONTRACT`.

The final implementation may use more precise closed enums, but must not fall back to arbitrary strings or user data.

## 6. Protection ownership semantics must match the real Apps Script API

Investigate the real API behavior of:

- `Spreadsheet.getOwner()`;
- `Session.getEffectiveUser()`;
- `Protection.canEdit()`;
- `Protection.getEditors()`;
- `Protection.canDomainEdit()`;
- `Protection.getTargetAudiences()` when available;
- `Protection.getUnprotectedRanges()`;
- `Protection.getDescription()` and range geometry.

Do not assume that a safe owner-created protection is represented in every Workspace context by `getEditors().length === 1`. The Spreadsheet owner is always able to edit protected ranges/sheets, and the owner/current user cannot necessarily be removed in the same way as ordinary explicit editors. Conversely, do not accept an empty editor array as safe without proving that the effective user is the Spreadsheet owner or another precisely specified safe condition.

Requirements:

- compare owner/effective-user identity internally without exposing either identity in diagnostic output;
- use only existing `spreadsheets.currentonly` capabilities; do not add Drive scope;
- handle `Spreadsheet.getOwner() === null` for Shared Drive as a separate fail-closed or explicitly specified contract;
- retain `warningOnly=false`;
- retain `canDomainEdit=false`;
- reject target-audience edit permission unless an existing canonical policy explicitly allows it;
- reject foreign explicit editors, foreign protections, duplicate protections, wrong descriptions, wrong geometry, and non-empty unprotected ranges on the Dashboard sheet protection;
- retain exactly the canonical Dashboard header protection and Setup-owned sheet protection;
- Setup rerun must be idempotent and must not weaken or duplicate protections.

Do not simply remove editor checks or convert the finding to WARN.

## 7. Real-runtime-like regression fixture

Extend the fake runtime so it can reproduce the actual API distinctions rather than one idealized editor model.

Cover at minimum:

1. canonical Spreadsheet owner represented as an explicit protection editor;
2. canonical owner/current user able to edit while not represented as one ordinary explicit editor, when consistent with the verified API contract;
3. different owner/effective user;
4. owner unavailable / Shared Drive;
5. extra explicit editor;
6. domain edit enabled;
7. target audience present;
8. warning-only protection;
9. duplicate sheet or header protections;
10. missing/wrong-description/wrong-geometry protection;
11. non-empty unprotected ranges;
12. foreign/overlapping range protection;
13. named range, value, formula, validation, note, merge, hidden state, background, font, and number-format conflicts;
14. exact canonical three-row pre-refresh seed;
15. exact owned marker state after explicit Dashboard refresh;
16. Quick Diagnostic remains byte-for-byte read-only for Dashboard values, formulas, notes, validations, formatting, protections, named ranges, and properties.

A canonical real-runtime-equivalent S20/S30/S40 state must PASS. Genuine unsafe states must remain FAIL.

## 8. Setup resume contract

Preserve the observed state:

```text
S00-S80 complete
S90 incomplete
S99 incomplete
```

The corrected version must:

- revalidate environment and canonical controls;
- not recreate/delete/overwrite Gmail labels, dedicated Calendar, non-secret Properties, or owner edit trigger;
- not create the five-minute trigger;
- keep Automation OFF;
- run corrected read-only S90;
- record S90 only when there is no FAIL;
- record S99 and return COMPLETE only after S90 succeeds;
- preserve a true Dashboard conflict as resumable S90/S99-incomplete failure;
- perform no Dashboard refresh or marker write during Quick Diagnostic;
- require no user workaround.

## 9. Versioning and immutable boundaries

Create a new additive chain:

```text
Code: 2.8.8-prepilot
Schema: 2.6
AI Schema: 2.0
Migration: 3
TEST_MODE: true for Phase 8B
Automation: OFF
```

Do not modify historical v2.8.5, v2.8.6, or v2.8.7 package/transfer bytes, refs, audits, or incident evidence.

### Source A8

Source/tests/tools/canonical docs/spec/visualization/incident/recovery guidance only. No v2.8.8 generated package, release report, or transfer envelope.

### Release B8

Direct child of A8 and limited to:

- `implementation/GoogleSpreadsheet/release/v2.8.8-prepilot/`;
- `implementation/GoogleSpreadsheet/release/v2.8.8-prepilot-phase8c/`;
- the v2.8.8 implementation/release report.

### Transfer T8

After B8, create a separate v2.8.8 transfer envelope and fixed transfer ref. Add a correction ref only if an independently demonstrated transfer-record defect requires it.

## 10. Company-PC differential patch manifest

The user manually replaces only changed Apps Script payload files. Generate from raw Git blob byte comparison between fixed T7 and final v2.8.8 payload:

- `implementation/GoogleSpreadsheet/transfer/v2.8.8-prepilot/COMPANY_PC_PATCH_MANIFEST_ja.md`;
- `implementation/GoogleSpreadsheet/transfer/v2.8.8-prepilot/COMPANY_PC_PATCH_MANIFEST.json`.

Include exact old/new hashes, added/removed files, unchanged count/list, `appsscript.json` change flag, safe replacement order, post-update config, S00-S80 resume instructions, and stop rules. Do not pre-assume the final changed file list.

Likely investigation areas include `00_Config.gs`, `03_SheetBuilder.gs`, `15_Dashboard.gs`, `16_Diagnostics.gs`, and `99_TestHarness.gs`, but modify only files justified by the final implementation.

## 11. Full verification

Run and record:

- all Node suites;
- new Dashboard native-protection/surface regression suite;
- prior Quick Diagnostic real-runtime suite;
- Setup Ledger/resume suite;
- F016 Calendar authority-loss suite;
- Apps Script static validator;
- remote publication consistency;
- v2.8.8 Phase 8B/8C builders and verifiers;
- source-package parity;
- independent rebuild byte parity;
- package checksum inventory;
- Phase 8B allow-list;
- company-PC patch-manifest raw-blob verifier;
- transfer canonical UTF-8/LF checksums;
- provenance and lineage checks;
- secret, credential, local-path, real-ID/URL, and Phase 8C exclusion scans;
- fresh detached HTTPS clone verification of the final fixed transfer ref.

No test may be weakened, deleted, silently skipped, or converted from FAIL to WARN solely to make Setup pass.

## 12. Canonical docs and PR

Record `PHASE8B-DASHBOARD-01` safely in canonical docs and audit evidence. Update README, CURRENT_STATUS, DECISIONS, PROJECT_CONTEXT, MASTER_PLAN, relevant specs/protocols/traceability/recovery/acceptance/visualizations, transfer operator materials, and Draft PR #8.

PR #8 must remain Draft and unmerged. Update its title/body with v2.8.8 refs, the third real-Workspace finding, exact tests/hashes, company-PC patch list, and `NOT_EXECUTED` boundaries.

## 13. Prohibited actions

Do not use reset, clean, rebase, amend, force push, unrelated revert, historical artifact rewrite, real Workspace operation, OAuth, Apps Script import, Setup, Gmail/Calendar call, Dashboard refresh, deployment, `clasp push`, Automation/trigger enablement, Provider configuration, credentials, real data, IDs, URLs, screenshots, or user identities.

## 14. Completion gate and report

Only if all local/remote/fresh-clone verification passes and no unresolved Critical/High or transfer-safety Medium remains may the status become:

`READY_FOR_PHASE8B_SANDBOX_RETRANSFER`

This is carriage-only. Do not declare Phase 8B PASS, Phase 8C GO, production ready, or pilot ready.

The final report must include:

- confirmed exact root cause and safe subreason;
- changed Apps Script files;
- exact company-PC replacement list with old/new SHA-256;
- `appsscript.json` change status;
- Source A8 / Release B8 / transfer / fixed-ref / evidence SHAs;
- exact tests and hashes;
- PR URL and Draft state;
- unresolved items and Review Focus;
- all `NOT_EXECUTED` boundaries.