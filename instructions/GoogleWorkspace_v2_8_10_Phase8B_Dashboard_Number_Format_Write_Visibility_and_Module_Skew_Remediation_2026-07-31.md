# Google Workspace Personal Work OS v2.8.10
# Phase 8B Dashboard Number-Format Write Visibility / Module-Skew Remediation 指示

- Date: 2026-07-31
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
- Working branch: `codex/r5-independent-reaudit-transfer-prep`
- Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/8`
- Current remote baseline before this instruction: `63841d85da478e401986e80db77e9308c8af9655`
- Current corrected Source A9.1: `4a145588b01a5f7ae7e9bce86efb9bd5b3d8345d`
- Current corrected Release B9.1: `b451d2361db99b4efbde036dafa3e2baf6b5cb97`
- Current fixed transfer T9: `781f408fcf0853a5fffee9c00d3022ee5e17b1d7`
- Required new Code version: `2.8.10-prepilot`
- Schema / AI Schema / Migration remain: `2.6` / `2.0` / `3`
- Starting operational gate: `PHASE8B_SANDBOX_NO_GO_DASHBOARD_WRITE_VISIBILITY`
- Maximum after full local/remote/fresh-clone verification: `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`

## 1. Mandatory execution rule

This is an implementation execution task. Do not stop after analysis, a proposed plan, a rewritten prompt, or a root-cause hypothesis.

Perform the implementation, regression tests, package generation, source/release/transfer lineage, company-PC differential patch manifest, normal push, Draft PR update, and detached fresh-clone verification. If a genuine blocker prevents execution, stop with a precise `NO-GO_*` status and evidence.

## 2. Real Google Workspace evidence

A real company Google Workspace Sandbox had completed Setup stages S00 through S80 with Automation OFF. The operator replaced the fixed-T8 payload files with fixed-T9 v2.8.9 files and retried the Setup path. The read-only Quick Diagnostic still returned the same bounded finding:

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

The count `51` equals the exact 17-metric by 3-column Dashboard system block. Do not store the actual Spreadsheet locale, actual number-format strings, cell values, range addresses, account identity, Spreadsheet ID/URL, Calendar ID, Gmail data, credentials, bookmarks, or screenshots.

Treat this as `PHASE8B-DASHBOARD-WRITE-VISIBILITY-01`, severity High for Phase 8B execution readiness because the actual S90/S99 path still cannot complete.

## 3. Confirmed repository facts and consistency findings

### 3.1 Menu selection is not the root cause

`menuSetupSystem()` and `menuContinueSetup()` use different confirmation text but both ultimately invoke the same `WorkOsSetup.executeSetup()` implementation through `setupSystem()` / `continueSetup()`. Therefore, within the same bound Apps Script project, pressing `初期セットアップ` instead of `セットアップを続行` does not explain the repeated 51-cell format failure.

Do not design the correction around a menu-choice workaround.

### 3.2 S90 calls the intended normalizer

The v2.8.9 `S90_QUICK_DIAGNOSTIC` path calls:

```text
WorkOsDashboard.normalizeSystemBlockNumberFormatForSetup(spreadsheet)
```

before invoking the read-only Quick Diagnostic. The release package contains this call.

### 3.3 Write-then-read consistency defect

The current v2.8.9 normalizer:

1. proves the exact Dashboard control plane and safe 17×3 block;
2. calls `range.setNumberFormat('@')`;
3. immediately calls strict `inspectLayout()` and re-reads `getNumberFormats()`;
4. does not call `SpreadsheetApp.flush()` and does not reacquire a fresh Range before the strict post-write read.

Google’s Apps Script Spreadsheet service documentation states that spreadsheet operations can be bundled and that `SpreadsheetApp.flush()` applies pending changes immediately. The repository itself already uses `SpreadsheetApp.flush()` after schema writes in `WorkOsSheetBuilder.applyAllSchemas()` before later reads.

This missing flush is a concrete cross-module inconsistency capable of producing exactly the observed result: the strict post-write inspection can still see all 51 pre-write formats, throw, and leave the later read-only Quick Diagnostic reporting the same 51 conflicts.

Official primary source:
`https://developers.google.com/apps-script/reference/spreadsheet/`

### 3.4 Fake-runtime test gap

`phase8b_dashboard_number_format_real_runtime_test.js` currently models `setNumberFormat()` as an immediate synchronous in-memory mutation. Its subsequent `getNumberFormats()` therefore sees the write without any flush boundary.

That fixture does not model Apps Script write bundling and could not detect the real write-visibility defect. The existing claim `real-runtime` must not be treated as actual Workspace evidence.

### 3.5 Partial manual patch cannot currently be distinguished safely

The company-PC update is manual. `CODE_VERSION=2.8.9-prepilot` in `00_Config.gs` does not prove that the matching `02_Setup.gs` and `15_Dashboard.gs` module contracts are loaded. The current system has no cross-module contract/version skew check before S90.

The screenshot alone therefore cannot distinguish:

- a fully loaded v2.8.9 path whose write was not visible before the strict read; and
- a partial manual patch where one of the S90-critical modules remained stale.

The product must detect this itself rather than relying on operator memory.

### 3.6 Canonical-document inconsistencies

The E9 branch is not fully internally consistent despite its top-level v2.8.9 status:

- `README.md` top section identifies v2.8.9/T9, but its `Company-PC transfer boundary` still says the exact current carriage artifact is fixed T8 and `transfer/v2.8.8-prepilot/`.
- `PROJECT_CONTEXT.md` identifies v2.8.9/T9 at the top, but `Repository layout` and `Company-PC boundary` still name fixed T8 / v2.8.8 as current.
- `MASTER_PLAN.md` records A9.1/B9.1/T9 complete, but its `Gate discipline` still says exact fixed T8 carriage is current.
- `CURRENT_STATUS.md` describes T9 in the current section, but the provenance table and audit-reference list stop at E8/T8 and omit the A9/A9.1/B9.1/T9/E9 chain.

These are governance/provenance defects. They do not by themselves cause the 51-cell runtime failure, but they must be corrected in the same additive remediation so the current transfer target is unambiguous.

## 4. Immediate safety boundary

The user must not rerun Setup, Quick/Deep Diagnostic, Dashboard refresh, manual Gmail import, Calendar sync, Automation, or any trigger until a corrected package has been independently verified and re-transferred.

Do not ask the user to edit Dashboard cells, values, number formats, notes, protections, named ranges, merges, hidden rows/columns, Gmail labels, Calendar, Properties, triggers, Task data, or Task Authority Ledger.

The current Sandbox remains evidence at S00–S80 complete / S90–S99 incomplete. Codex must not perform any real Workspace operation.

## 5. Mandatory repository reading

Read and follow, in order:

1. root `README.md`;
2. root and applicable `AGENTS.md`;
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
17. `implementation/GoogleSpreadsheet/apps-script-v2/Menu.gs`;
18. Dashboard, Setup-resume, fake-runtime, Quick Diagnostic, package, patch-manifest, and provenance tests;
19. v2.8.9 builders/verifiers, fixed T9 transfer envelope, and E9 fresh-clone audit;
20. PR #8 body, changed files, comments, checks, and Draft state.

Confirm remote, branch, HEAD, working tree, staged/unstaged/untracked state, and A9/A9.1/B9.1/T9/E9 lineage. Fetch normally. Preserve unrelated working-tree changes and historical artifacts. Use a separate clean worktree based on the latest remote instruction commit. Do not reset, clean, amend, rebase, or force-push an existing worktree.

## 6. Required product correction

### 6.1 Flush-safe Setup-owned number-format normalization

Preserve the existing strict preconditions: canonical Dashboard schema, exact owner-proven sheet/header Protection, exact canonical seed or owned/versioned system state, and zero non-format surface conflicts.

When and only when those preconditions pass:

1. acquire the exact 17×3 Dashboard system-block Range;
2. apply the canonical plain-text contract;
3. call `SpreadsheetApp.flush()` before any post-write read;
4. reacquire a fresh Range object for the exact same 17×3 coordinates;
5. re-read the formats and require the exact canonical postcondition across all 51 cells;
6. only then continue to the read-only Quick Diagnostic.

If `SpreadsheetApp.flush` is unavailable or the postcondition remains noncanonical, fail closed with a distinct safe code such as:

```text
E_DASHBOARD_NUMBER_FORMAT_POSTCONDITION
```

and a closed subreason/count. Do not emit actual format strings or locale.

Do not broaden the allowed format list and do not accept arbitrary locale-dependent custom formats. Do not move the repair into Quick or Deep Diagnostic.

### 6.2 Explicit safe normalization evidence

The Setup result path must expose only safe, non-sensitive normalization metadata sufficient to distinguish execution states, for example:

```text
normalization_status: CANONICAL | NORMALIZED | FAILED_POSTCONDITION
write_performed: true | false
flush_performed: true | false
postcondition_verified: true | false
checked_cell_count: 51
noncanonical_count: integer
```

Do not include actual format strings, locale, values, formulas, notes, addresses, IDs, URLs, or identities.

Do not discard the S90 stage output into a generic `COMPLETED` marker only. Preserve a bounded safe summary in the Setup result or a dedicated safe error detail so the operator can determine whether normalization ran.

### 6.3 Cross-module contract/version skew detection

Add a minimal, deterministic compatibility contract for the S90-critical modules.

At minimum, the loaded `WorkOsConfig`, `WorkOsSetup`, and `WorkOsDashboard` must expose/validate one matching module-contract identifier for v2.8.10. Before any Setup-owned normalization write, fail closed if the identifiers do not match.

Use a distinct safe code such as:

```text
E_MODULE_VERSION_SKEW
```

Do not expose file hashes to the Spreadsheet UI. This check is a product-level guard against partial manual patching; it does not replace the transfer manifest’s raw-byte hashes.

### 6.4 Read-only diagnostics

Quick and Deep Diagnostic must remain byte-for-byte read-only with respect to Sheets, Gmail, Calendar, Properties, and triggers.

Diagnostic details may report only closed enums and numeric counts. They must not emit actual number-format strings, locale, cell/display values, formulas, notes, range addresses, user identity, IDs, or URLs.

### 6.5 Resource invariants

The S00–S80 completed resume must not duplicate, delete, overwrite, or rename:

- Gmail labels;
- the dedicated secondary Calendar;
- Script Properties except current version/module metadata and strictly necessary Setup-owned metadata;
- the owner installable edit trigger;
- any Task or Ledger data;
- any five-minute trigger, which must remain absent;
- Automation state, which must remain OFF.

### 6.6 Canonical-document reconciliation

Update all current canonical documents so they agree at every current-transfer reference.

Before the new v2.8.10 chain is complete, the current gate is:

```text
PHASE8B_SANDBOX_NO_GO_DASHBOARD_WRITE_VISIBILITY
```

After the complete A10/B10/T10/E10 chain passes, current references must consistently identify fixed T10 and `transfer/v2.8.10-prepilot/`. Historical T8 and T9 remain immutable historical evidence, not the current transfer target.

At minimum reconcile:

- `README.md` including `Company-PC transfer boundary`;
- `CURRENT_STATUS.md` current section, provenance table, and audit-reference list;
- `MASTER_PLAN.md` current remediation and `Gate discipline`;
- `PROJECT_CONTEXT.md` current candidate, provenance, repository layout, and company-PC boundary;
- `DECISIONS.md`;
- relevant implementation plan/spec, acceptance/recovery guidance, traceability, and visualizations;
- Draft PR #8 body.

Add a document-consistency test or verifier that fails if top-level version/gate/current fixed transfer/current transfer path disagree across the four canonical documents.

## 7. Regression tests

Add or update tests to cover at least:

1. a fake runtime in which `setNumberFormat()` queues a pending write and `getNumberFormats()` returns the old state until `SpreadsheetApp.flush()`;
2. proof that the old no-flush implementation fails the strict postcondition in that buffered runtime;
3. proof that the corrected implementation calls flush exactly once after a write and then passes using a freshly reacquired Range;
4. a canonical block performs no write and no unnecessary flush;
5. flush API unavailable fails closed without fallback;
6. post-flush noncanonical state fails with the distinct postcondition code and 51-safe-count evidence;
7. S00–S80 completed resume normalizes, records safe normalization evidence, then completes S90/S99;
8. Quick/Deep Diagnostic performs zero writes and zero flushes;
9. partial module versions (`00_Config`, `02_Setup`, `15_Dashboard`) fail with `E_MODULE_VERSION_SKEW` before any format write;
10. fully aligned module versions pass;
11. foreign/user Dashboard surfaces still block normalization;
12. custom format outside the exact system block remains untouched;
13. Gmail labels, Calendar, Properties, edit trigger, Automation OFF, and absent five-minute trigger remain invariant;
14. all prior v2.8.7/v2.8.8/v2.8.9 Dashboard, Quick Diagnostic, Setup Ledger, and F015/F016 tests continue to PASS;
15. canonical-document consistency verifier detects stale T8/T9 references in a synthetic negative fixture and passes the corrected v2.8.10 documents.

The fake runtime must not apply format writes synchronously by default in this test path. It must explicitly model queued writes and flush visibility.

Do not weaken, delete, or convert existing negative tests to WARN/PASS.

## 8. Versioning and immutable history

Create a new additive chain for:

```text
Code: 2.8.10-prepilot
Schema: 2.6
AI Schema: 2.0
Migration: 3
TEST_MODE: true for Phase 8B
Automation: OFF
```

Do not modify any historical v2.8.5 through v2.8.9 package, transfer envelope, audit, or incident evidence.

### Source A10

Source A10 contains only source, tests, tools, canonical documents, specifications, visualizations, safe incident/recovery guidance, and changelog material. It must not contain v2.8.10 generated release packages, the v2.8.10 release report, or the v2.8.10 transfer envelope.

### Release B10

Create Release B10 as the direct child of Source A10. It contains only:

- `implementation/GoogleSpreadsheet/release/v2.8.10-prepilot/`;
- `implementation/GoogleSpreadsheet/release/v2.8.10-prepilot-phase8c/`;
- the v2.8.10 implementation/release report.

### Transfer T10

After B10, create a separate v2.8.10 transfer envelope and fixed transfer ref. Generate the company-PC patch manifest from a raw Git blob byte comparison between fixed T9 and final B10 payload. Do not pre-assume the changed-file list.

The transfer envelope must include:

- `COMPANY_PC_PATCH_MANIFEST_ja.md`;
- `COMPANY_PC_PATCH_MANIFEST.json`;
- old/new hashes, exact replacement order, unchanged files, `appsscript.json` status;
- S00–S80 resume instructions;
- stop rules and manual-repair prohibition.

### Evidence E10

After fixed T10 is normal-pushed and detached-clone verified, create an evidence-only commit that updates current canonical status/evidence and changes no source, test, tool, package, transfer, checksum, or historical artifact.

## 9. Verification and publication

Run and record:

- all Node suites;
- Dashboard native-runtime suite;
- Dashboard number-format buffered-write / flush suite;
- module-skew suite;
- canonical-document consistency suite;
- prior Quick Diagnostic suite;
- Setup Ledger/resume suite;
- Calendar F015/F016 suite;
- Apps Script static validator;
- remote publication consistency;
- v2.8.10 Phase 8B and Phase 8C builders/verifiers;
- source-to-package parity;
- independent rebuild raw-byte parity;
- package checksum inventory;
- Phase 8B copy allow-list;
- company-PC patch-manifest verifier;
- transfer-envelope canonical checksums;
- provenance and lineage validation;
- secret, credential, local-path, real-ID/URL, screenshot, identity, and Phase 8C exclusion scans;
- fresh detached HTTPS clone verification of final fixed T10.

Commit and normal non-force push. Update Draft PR #8 body to v2.8.10, the real-Workspace repeated 51-cell finding, the confirmed write-visibility/test-model defect, fixed lineage, exact patch list, tests, hashes, canonical-document reconciliation, and NOT_EXECUTED boundary. Keep PR #8 Draft, open, and unmerged.

## 10. Prohibited actions

Do not perform:

- reset, clean, rebase, amend, force push, unrelated revert;
- rewrite or delete historical packages, transfers, audits, incidents, instructions, or commits;
- any real Google Workspace operation;
- OAuth consent, Apps Script import, Setup, Quick/Deep Diagnostic, Dashboard refresh;
- Gmail or Calendar call;
- deployment or `clasp push`;
- Automation or trigger enablement;
- Provider configuration;
- real data, IDs, URLs, screenshots, locale, observed format strings, or user identities in the repository.

## 11. Status gate

The current fixed T9 package is superseded as an execution transfer target by `PHASE8B-DASHBOARD-WRITE-VISIBILITY-01`.

Only if all local, package, transfer, remote, detached-clone, module-skew, buffered-write/flush, and canonical-document consistency checks PASS, and there is no unresolved Critical/High or transfer-safety Medium finding, may the highest status become:

```text
READY_FOR_PHASE8B_SANDBOX_RETRANSFER
```

This status means controlled carriage of the exact non-sensitive fixed-T10 Phase 8B package only. It is not Phase 8B PASS, Phase 8C GO, production ready, or pilot ready.

## 12. Required final report

The final report must include:

- explicit confirmation that implementation, tests, package generation, commit, push, and PR update were performed;
- confirmed root cause and any remaining uncertainty;
- explanation of the `SpreadsheetApp.flush()` boundary and buffered fake-runtime correction;
- module-skew contract and failure code;
- changed Apps Script files;
- company-PC replacement files with old/new SHA-256 and replacement order;
- `appsscript.json` changed/unchanged status;
- Source A10 / Release B10 / fixed T10 / Evidence E10 SHAs and parent relations;
- exact test suite/assertion counts and failures/skips;
- payload/package/transfer/manifest hashes;
- canonical-document consistency result;
- Draft PR #8 URL and state;
- `NOT_EXECUTED` items;
- unresolved findings and Review Focus;
- elapsed time and token usage, or explicit unavailability.
