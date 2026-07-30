# Google Workspace Personal Work OS v2.8.9
# Phase 8B Dashboard Number Format Real-Runtime Remediation 指示

- Date: 2026-07-30
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
- Working branch: `codex/r5-independent-reaudit-transfer-prep`
- Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/8`
- Current remote baseline before this instruction: `5cf8b932fd6de2678eee837e361100aa52f3168e`
- Current Source A8: `4140054b03c850f4a1e669b3aa562b305ef78bf5`
- Current Release B8: `a17d34422ed521cee81340902d9a19e2da372201`
- Current fixed transfer ref T8: `69f843f6ea426ccb45d721a40508a35b0a59795d`
- Required new Code version: `2.8.9-prepilot`
- Schema / AI Schema / Migration remain: `2.6` / `2.0` / `3`
- Starting operational gate: `PHASE8B_SANDBOX_NO_GO_DASHBOARD_NUMBER_FORMAT`
- Maximum after full local/remote/fresh-clone verification: `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`

## 1. Mandatory execution rule

This is an implementation execution task. Do not stop after analysis, a proposed plan, a rewritten prompt, or a root-cause hypothesis.

Perform the implementation, regression tests, package generation, source/release/transfer lineage, company-PC differential patch manifest, normal push, Draft PR update, and detached fresh-clone verification. If a genuine blocker prevents execution, stop with a precise `NO-GO_*` status and evidence.

## 2. Real Google Workspace evidence

A real company Google Workspace Sandbox had already completed Setup stages S00 through S80 with Automation OFF. The operator replaced the fixed-T7 payload files with fixed-T8 v2.8.8 files and selected `セットアップを続行`.

Setup stopped safely at S90/S99. One explicit read-only Quick Diagnostic exposed the remaining safe finding:

```text
id: DASHBOARD_LAYOUT_OWNERSHIP
status: FAIL
safe_message: Dashboard layout conflictを検出しました。修復や更新は行っていません。
details.error_code: E_DASHBOARD_LAYOUT_CONFLICT
details.conflict_reason_code: DASHBOARD_NUMBER_FORMAT_CONFLICT
details.conflict_subreason_code: NUMBER_FORMAT_NONCANONICAL
details.conflict_counts:
  named_range_count: 0
  value_conflict_count: 0
  formula_conflict_count: 0
  validation_conflict_count: 0
  note_conflict_count: 0
  merge_conflict_count: 0
  hidden_row_or_column_count: 0
  background_conflict_count: 0
  font_conflict_count: 0
  number_format_conflict_count: 51
external_services_called: false
repair_performed: false
```

The count `51` equals the complete 17-metric by 3-column Dashboard system block. Do not infer or store the actual Spreadsheet locale, number-format strings, cell values, range addresses, account identity, Spreadsheet ID/URL, Calendar ID, Gmail data, credentials, bookmarks, screenshots, or business data.

Treat this as `PHASE8B-DASHBOARD-NUMBER-FORMAT-01`, severity High for Phase 8B execution readiness because S90/S99 cannot complete in the actual target runtime.

## 3. Immediate safety boundary

The user must not rerun Setup, Quick/Deep Diagnostic, Dashboard refresh, manual Gmail import, Calendar sync, Automation, or any trigger until a corrected package has been independently verified and re-transferred.

Do not ask the user to edit Dashboard cells, values, number formats, notes, protections, named ranges, merges, hidden rows/columns, Gmail labels, Calendar, Properties, triggers, Task data, or Task Authority Ledger.

The current Sandbox remains evidence at S00-S80 complete / S90-S99 incomplete. Codex must not perform any real Workspace operation.

## 4. Mandatory repository reading

Read and follow, in order:

1. root `README.md`;
2. applicable `AGENTS.md`, including root `AGENTS.md` if present;
3. `CONTRIBUTING.md`, if present;
4. `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`;
5. `CURRENT_STATUS.md`;
6. `DECISIONS.md`;
7. `PROJECT_CONTEXT.md`;
8. `MASTER_PLAN.md`;
9. `docs/TASK_AUTHORITY_PROTOCOL.md`;
10. `docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`;
11. this instruction in full;
12. `implementation/GoogleSpreadsheet/apps-script-v2/00_Config.gs`;
13. `implementation/GoogleSpreadsheet/apps-script-v2/02_Setup.gs`;
14. `implementation/GoogleSpreadsheet/apps-script-v2/03_SheetBuilder.gs`;
15. `implementation/GoogleSpreadsheet/apps-script-v2/15_Dashboard.gs`;
16. `implementation/GoogleSpreadsheet/apps-script-v2/16_Diagnostics.gs`;
17. Dashboard, Setup resume, fake-runtime, Quick Diagnostic, package, patch-manifest, and provenance tests;
18. v2.8.8 builders/verifiers, fixed T8 transfer envelope, and fresh-clone audit;
19. PR #8 body, changed files, comments, checks, and Draft state.

Confirm remote, branch, HEAD, working tree, staged/unstaged/untracked state, and A8/B8/T8/E8 lineage. Fetch normally. Preserve unrelated working-tree changes and historical artifacts. Use a separate clean worktree based on the latest remote instruction commit. Do not reset, clean, amend, rebase, or force-push an existing worktree.

## 5. Confirmed implementation mismatch to investigate

The current v2.8.8 Dashboard inspection treats every number format other than exact `General` or `@` as unsafe. Actual Google Sheets returned a noncanonical representation across all 51 cells of the exact Dashboard system block, while every other conflict count was zero.

The current Setup path:

- creates and protects the Dashboard;
- seeds the exact canonical pre-refresh rows;
- on S00-S80 resume, re-runs validation/protection refresh;
- does not establish a deterministic Dashboard system-block number-format contract before read-only S90.

The current Dashboard values are deliberately produced as strings. However, do not simply accept arbitrary number formats and do not globally remove number-format checks. Establish a deterministic, cross-locale, Setup-owned number-format contract for the exact Dashboard system block while preserving fail-closed behavior for foreign content and user-controlled surfaces.

## 6. Required product correction

### 6.1 Canonical Dashboard number-format contract

Define one explicit canonical number-format contract for the exact Dashboard system block.

Preferred direction, subject to repository-consistent verification:

- the exact Dashboard system block is 17 metric rows by 3 columns;
- all system-block values are written as strings;
- Setup owns the number format of that exact block;
- Setup establishes a deterministic plain-text format, preferably `@`, for the exact block;
- Quick Diagnostic remains read-only and validates the canonical format after Setup-owned normalization;
- explicit Dashboard refresh writes values only and must preserve/reassert the canonical format without touching user space.

If implementation analysis proves another narrower cross-locale contract is safer, document the evidence and retain deterministic behavior. Do not accept arbitrary locale-dependent custom formats merely because the current values happen to display correctly.

### 6.2 Safe Setup-owned normalization

The real Sandbox is S00-S80 complete, so the corrected version must support safe resume.

A Setup-owned normalization may write number format only when all of the following are true:

- the Dashboard sheet and schema are canonical;
- sheet/header Protection control plane is canonical and owner-proven;
- the target block is exactly the canonical 17-by-3 system block;
- the Dashboard is either the exact three-row Setup seed state, the exact owned marker state, or another explicitly versioned canonical pre-refresh/full-owned state;
- no foreign named range, overlapping Protection, value, formula, validation, note, merge, hidden row/column, background, font, seed/marker mismatch, or user data is present in the target block;
- no row outside the exact system block is written or formatted.

On any ambiguity, fail closed and do not normalize.

Do not use Quick Diagnostic itself as a repair path. Normalization belongs in an idempotent Setup-owned control-plane path that runs before S90 on a completed S00-S80 resume.

### 6.3 Existing resource invariants

The corrected resume must not duplicate, delete, overwrite, or rename:

- Gmail labels;
- the dedicated secondary Calendar;
- Script Properties except current version metadata and strictly necessary Setup-owned metadata;
- the owner installable edit trigger;
- any Task or Ledger data;
- any five-minute trigger, which must remain absent;
- Automation state, which must remain OFF.

### 6.4 Read-only diagnostics

Quick and Deep Diagnostic remain byte-for-byte read-only with respect to Sheets, Gmail, Calendar, Properties, and triggers.

Diagnostic details may report only closed non-sensitive enums and numeric counts. They must not emit:

- actual number-format strings;
- locale;
- cell values or display values;
- formulas or notes;
- range addresses;
- user identity;
- IDs or URLs.

### 6.5 Fail-closed boundaries

Continue to fail for:

- arbitrary custom number formats on a foreign/user block;
- malformed or partial owned marker state;
- number-format drift outside the exact Setup-owned block;
- foreign named ranges or protections;
- values, formulas, validations, notes, merges, hidden state, noncanonical background/font;
- missing/wrong/duplicate sheet or header Protection;
- owner/effective-user mismatch, Shared Drive/null owner, foreign editor, domain edit, target audience, warning-only, `canEdit=false`, unprotected ranges;
- any user content that makes Setup ownership ambiguous.

## 7. Regression tests

Add or update tests to cover at least:

1. real-runtime-equivalent 17-by-3 number-format mismatch producing exactly 51 conflicts before Setup-owned normalization;
2. S00-S80 completed resume safely normalizes only the canonical Dashboard block and then S90/S99 completes;
3. canonical three-row seed state normalization;
4. canonical full owned-marker state normalization;
5. repeated resume is idempotent and performs no second write when already canonical;
6. Quick Diagnostic itself performs zero writes;
7. explicit Dashboard refresh preserves/reasserts the canonical format;
8. foreign/user Dashboard content blocks normalization and remains FAIL;
9. a custom format outside the system block is not touched;
10. unknown named ranges, protections, formulas, notes, validations, merge, hidden state, background/font conflicts remain FAIL;
11. Gmail labels, Calendar, Properties, edit trigger, Automation OFF, and absent five-minute trigger remain invariant;
12. all previous v2.8.7/v2.8.8 Quick Diagnostic and Dashboard ownership tests continue to PASS.

Update the fake runtime so `getNumberFormats()` and `setNumberFormat()`/`setNumberFormats()` accurately model the required state and write counts. Do not weaken, delete, or convert existing negative tests to WARN/PASS.

## 8. Versioning and immutable history

Create a new additive chain for:

```text
Code: 2.8.9-prepilot
Schema: 2.6
AI Schema: 2.0
Migration: 3
TEST_MODE: true for Phase 8B
Automation: OFF
```

Do not modify any historical v2.8.5, v2.8.6, v2.8.7, or v2.8.8 package, transfer envelope, audit, or incident evidence.

### Source A9

Source A9 contains only source, tests, tools, canonical documents, specifications, visualizations, safe incident/recovery guidance, and changelog material. It must not contain v2.8.9 generated release packages, the v2.8.9 release report, or the v2.8.9 transfer envelope.

### Release B9

Create Release B9 as the direct child of Source A9. It contains only:

- `implementation/GoogleSpreadsheet/release/v2.8.9-prepilot/`;
- `implementation/GoogleSpreadsheet/release/v2.8.9-prepilot-phase8c/`;
- the v2.8.9 implementation/release report.

### Transfer T9

After B9, create a separate v2.8.9 transfer envelope and fixed transfer ref. Generate the company-PC patch manifest from a raw Git blob byte comparison between fixed T8 and final B9 payload. Do not pre-assume the changed-file list.

The transfer envelope must include:

- `COMPANY_PC_PATCH_MANIFEST_ja.md`;
- `COMPANY_PC_PATCH_MANIFEST.json`;
- old/new hashes, exact replacement order, unchanged files, `appsscript.json` status;
- S00-S80 resume instructions;
- stop rules and manual-repair prohibition.

## 9. Verification and publication

Run and record:

- all Node suites;
- Dashboard native-runtime suite;
- new Dashboard number-format suite;
- prior Quick Diagnostic suite;
- Setup Ledger/resume suite;
- Calendar F015/F016 suite;
- Apps Script static validator;
- remote publication consistency;
- v2.8.9 Phase 8B and Phase 8C builders/verifiers;
- source-to-package parity;
- independent rebuild raw-byte parity;
- package checksum inventory;
- Phase 8B copy allow-list;
- company-PC patch-manifest verifier;
- transfer-envelope canonical checksums;
- provenance and lineage validation;
- secret, credential, local-path, real-ID/URL, screenshot, identity, and Phase 8C exclusion scans;
- fresh detached HTTPS clone verification of final fixed T9.

Commit and normal non-force push. Update Draft PR #8 body to v2.8.9, the new safe real-Workspace finding, fixed lineage, exact patch list, tests, hashes, and NOT_EXECUTED boundary. Keep PR #8 Draft, open, and unmerged.

## 10. Prohibited actions

Do not perform:

- reset, clean, rebase, amend, force push, or unrelated revert;
- modification of historical packages/transfers/audits;
- real Workspace access or execution;
- OAuth, Apps Script import, Setup, Quick/Deep Diagnostic, Dashboard refresh;
- Gmail/Calendar action, deployment, `clasp push`;
- Automation or trigger enablement;
- Provider configuration;
- real data, IDs, URLs, screenshots, locale, user identity, or actual format-string storage.

## 11. Completion status and final report

The highest permitted status is `READY_FOR_PHASE8B_SANDBOX_RETRANSFER` only if all local, package, remote, and detached fresh-clone checks PASS and there is no unresolved Critical/High or transfer-safety Medium finding.

Do not declare Phase 8B PASS, Phase 8C GO, production ready, or pilot ready.

The final report must include:

- exact confirmed root cause;
- chosen canonical number-format contract and why it is cross-locale and fail-closed;
- changed Apps Script files;
- company-PC exact replacement files and old/new SHA-256;
- whether `appsscript.json` changed;
- Source A9 / Release B9 / fixed T9 / evidence SHA;
- exact tests and results;
- package and transfer hashes;
- Draft PR URL/state;
- NOT_EXECUTED boundaries;
- unresolved issues and Review Focus;
- execution metrics, or explicit unavailability.