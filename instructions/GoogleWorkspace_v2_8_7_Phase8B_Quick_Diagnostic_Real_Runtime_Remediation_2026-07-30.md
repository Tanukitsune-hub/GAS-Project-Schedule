# Google Workspace Personal Work OS v2.8.7
# Phase 8B Quick Diagnostic Real-Runtime Remediation 指示

- Date: 2026-07-30
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
- Working branch: `codex/r5-independent-reaudit-transfer-prep`
- Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/8`
- Current remote baseline before this instruction: `e03367c38ac1a623f6ce0c45ba5d5e37d7271d69`
- Historical failed package fixed ref P10: `1a1f9df65dacf3a031409d724cb2906b58900f77`
- Current corrected Source A6: `8e8e3e4a5f2288985554b3467a5b68814e7bab21`
- Current corrected Release B6: `49f6774242e11f3c4ae1f0881dc4a7e13c5aad23`
- Current fixed transfer ref T6.1: `863217b99dfa1ad682a8f4dd1989212b0a8d548b`
- Required new Code version: `2.8.7-prepilot`
- Schema / AI Schema / Migration remain: `2.6` / `2.0` / `3`
- Current operational gate: `PHASE8B_SANDBOX_NO_GO_QUICK_DIAGNOSTIC`
- Maximum after local/remote verification: `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`

## 1. Goal

A real Google Workspace Phase 8B Sandbox using the exact v2.8.6 package passed the prior Ledger visibility blocker and completed Setup stages S00 through S80, but S90 Quick Diagnostic returned four deterministic FAIL checks. Reproduce the actual Google Sheets runtime semantics, correct the diagnostic/setup contract without weakening safety checks, add regression coverage, create a new additive Source/Release/transfer chain for Code `2.8.7-prepilot`, publish normally, and independently reverify from a fresh clone.

The existing v2.8.6 Source A6 / Release B6 / T6.1 package and the real Workspace Sandbox must remain historical evidence. Do not rewrite or delete them. The real Workspace execution performed by the user must not be repeated by Codex.

## 2. Real Workspace evidence

The second new, empty Sandbox used the exact v2.8.6 Phase 8B package. The prior `E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN` blocker did not recur. The initial Setup result was:

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
duration_ms: 102774
```

The user then ran exactly one explicit read-only Quick Diagnostic. Its safe aggregate result was:

```text
Code: 2.8.6-prepilot
status: FAIL
PASS: 74
FAIL: 4
WARN: 5
duration_ms: 13550
setup_completed_stages: S00 through S80
```

The four safe FAIL records were:

### `PHASE8B-DIAG-01` — Dashboard layout false conflict

```text
id: DASHBOARD_LAYOUT_OWNERSHIP
status: FAIL
safe_message: Dashboard layout conflictを検出しました。修復や更新は行っていません。
details.error_code: E_DASHBOARD_LAYOUT_CONFLICT
external_services_called: false
repair_performed: false
```

### `PHASE8B-DIAG-02` — Task header protection contract mismatch

```text
id: TASK_PROTECTIONS
status: FAIL
safe_message: Task管理範囲の保護が不足しています。
details.failures:
  - WORK_OS_V2_PHASE1_タスク一覧_HEADER_IDS
```

### `PHASE8B-DIAG-03` — Blank checkbox false values treated as logical data

```text
id: BLANK_ROW_BOOLEAN_VALUES
status: FAIL
safe_message: 論理空行にBoolean値があります。
details.rows sample:
  - 3 through 22
```

The UI safely truncates the row list. Do not infer that only 20 rows were affected. The relevant fact is that rows without Task identity were observed with Boolean values after canonical checkbox validation was applied in the actual Google Sheets runtime.

### `PHASE8B-DIAG-04` — Schema checkbox omitted from diagnostic contract

```text
id: TASK_VALIDATION_TYPES
status: FAIL
safe_message: 入力規則の型が一致しません。
details.failures sample:
  - calendar_reconcile_required@3: unexpected checkbox
  - calendar_reconcile_required@4: unexpected checkbox
  - ...
```

No screenshot, Spreadsheet ID, URL, account, OAuth details, Calendar ID, Gmail content, or other real Workspace identifier may be committed. Record only the safe evidence above.

## 3. Immediate safety boundary

Treat all four findings together as `PHASE8B-QUICK-DIAGNOSTIC-01`, severity High for Phase 8B execution readiness because Setup cannot complete S90/S99 in the real target runtime.

The user has not:

- rerun Setup after the Quick Diagnostic result;
- run Deep Diagnostic;
- enabled Automation;
- run manual Gmail import;
- run Calendar sync;
- edited Task data, Ledger data, Protection, validations, or Dashboard manually;
- used real business data or Provider configuration.

The current real Sandbox has S00 through S80 recorded. Gmail labels, the dedicated secondary Calendar, non-secret properties, and the owner installable edit trigger may already exist. The remediation must support safe resume from this exact stage state without duplicate or destructive external setup operations.

Codex must not execute or simulate real Workspace operations against the user's environment.

## 4. Mandatory repository reading

Before modifying anything, read in this order:

1. root `README.md`
2. applicable `AGENTS.md`, if any
3. `CONTRIBUTING.md`, if any
4. `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`
5. `CURRENT_STATUS.md`
6. `DECISIONS.md`
7. `PROJECT_CONTEXT.md`
8. `MASTER_PLAN.md`
9. `docs/TASK_AUTHORITY_PROTOCOL.md`
10. `docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`
11. `implementation/GoogleSpreadsheet/apps-script-v2/01_TypesAndSchemas.gs`
12. `implementation/GoogleSpreadsheet/apps-script-v2/02_Setup.gs`
13. `implementation/GoogleSpreadsheet/apps-script-v2/03_SheetBuilder.gs`
14. `implementation/GoogleSpreadsheet/apps-script-v2/15_Dashboard.gs`
15. `implementation/GoogleSpreadsheet/apps-script-v2/16_Diagnostics.gs`
16. related tests, especially Setup, Dashboard, diagnostic, schema, protection, and fake-runtime suites
17. v2.8.6 release/transfer builders, verifiers, package manifests, and T6.1 fresh-clone audit
18. PR #8 body, changed files, comments, checks, and current Draft state

The repository currently has no root `AGENTS.md` or `CONTRIBUTING.md` as of the instruction baseline, but verify rather than assume.

## 5. Required investigation and correction

Do not merely downgrade all four FAIL checks to WARN or remove them. Identify each exact contract mismatch and retain fail-closed detection for genuine corruption, unsafe user content, or noncanonical controls.

### 5.1 Schema-driven checkbox diagnostics

The Task schema declares these checkbox fields, including the hidden protected `calendar_reconcile_required` field. The diagnostic must not maintain a divergent hard-coded subset.

Requirements:

- derive expected checkbox columns from the canonical Task schema or `validationPlanForSheet()`;
- recognize every field whose canonical validation is `CHECKBOX`;
- fail if a non-checkbox schema field has checkbox validation;
- fail if a checkbox schema field lacks canonical checkbox validation;
- add a regression that specifically proves `calendar_reconcile_required` is accepted as a canonical checkbox and that an actually unexpected checkbox still fails.

### 5.2 Logical blank-row Boolean semantics

Actual Google Sheets behavior after applying checkbox validation may expose `false` values in otherwise identity-empty preallocated rows. The fake runtime did not sufficiently model this behavior.

Requirements:

- preserve the invariant that logical Task existence is determined by the canonical identity contract (`task_id` / `origin_key`), not by checkbox-rendered `false` values;
- canonical `false` values caused solely by checkbox validation on an identity-empty row must not create a logical Task or fail Quick Diagnostic;
- `true`, invalid types, noncanonical values, partial Task identity, or business data on an identity-empty row must still fail or be reported under the appropriate strict check;
- do not clear or rewrite Task rows during Quick Diagnostic;
- do not clear real business values during Setup rerun;
- if Setup normalizes blank checkbox cells, it must do so only under a separately proven safe empty-row contract and must preserve validation and existing logical rows. Prefer a diagnostic semantic correction unless a Setup write is demonstrably required by the product contract.

Add fake-runtime behavior that reproduces the observed real Google Sheets checkbox materialization rather than relying on a facade that leaves all cells blank.

### 5.3 Task header protection geometry

The current Setup implementation protects both canonical header rows 1 and 2 under the existing header protection, while Quick Diagnostic appears to expect a one-row geometry for `WORK_OS_V2_PHASE1_タスク一覧_HEADER_IDS`.

Requirements:

- reconcile the canonical contract explicitly;
- because both row 1 internal IDs and row 2 labels are control-plane metadata, retain protection of both rows unless repository specifications clearly require otherwise;
- align Quick Diagnostic geometry with the Setup-owned protection, or introduce a precisely versioned and idempotent protection migration if a different structure is justified;
- do not remove protection from either header row;
- do not create duplicate protections on rerun;
- add tests for exact description, exact rows/columns, restricted editor/domain state, idempotence, and genuine missing/misaligned protection failure.

### 5.4 Dashboard layout real-runtime semantics

The canonical S40 seed inserts the three legacy Dashboard keys. Setup also applies canonical protections and sheet formatting. The actual Workspace Quick Diagnostic then received `E_DASHBOARD_LAYOUT_CONFLICT` before any Dashboard refresh.

Requirements:

- reproduce the actual canonical new-Sandbox Dashboard state after S20/S30/S40 and the relevant Google Sheets return values for protections, formats, hidden states, notes, validations, and empty cells;
- identify the exact false-positive condition rather than broadly relaxing `inspectLayout()`;
- canonical Setup-seeded rows plus canonical owned protections/formatting must be recognized as `LEGACY_SEED`, `EMPTY`, or another explicitly safe pre-refresh state;
- genuine unknown sheet protection, overlapping foreign range protection, user data, formulas, merged cells, foreign notes/named ranges, hidden rows/columns, malformed/partial markers, duplicate metric keys, or unsafe formatting must continue to fail closed;
- Quick Diagnostic remains read-only and must not create Dashboard markers or write metric rows;
- explicit Dashboard refresh remains the only operation that may claim/write the owned metric block;
- improve safe diagnostic details with a non-sensitive conflict-reason code if necessary, without exposing cell values or Workspace identifiers.

Add tests that exercise actual-runtime-like protection and formatting behavior, canonical seed acceptance, and multiple genuine unsafe conflicts.

## 6. Setup resume requirements

The corrected version must safely resume the real observed stage state:

```text
S00 ... S80 complete
S90 incomplete
S99 incomplete
```

Requirements:

- Setup rerun/restart revalidates the environment and canonical controls;
- it does not duplicate Gmail labels, dedicated Calendar, or installable edit trigger;
- it does not delete or overwrite the existing dedicated Calendar;
- it does not enable Automation or create the 5-minute trigger;
- it runs the corrected read-only S90 and records S90 only after a non-FAIL result;
- it then records S99 and returns COMPLETE when all mandatory checks are satisfied;
- a true diagnostic failure leaves S90/S99 incomplete and remains resumable;
- no raw Task row, snapshot cell, note, or live post-edit value becomes authority;
- no user workaround is required.

Add a regression fixture representing the exact S00-S80 completed state and prove one successful idempotent resume. Include a repeated completed-Setup rerun test.

## 7. Versioning and immutable history

Create a new additive chain for:

```text
Code: 2.8.7-prepilot
Schema: 2.6
AI Schema: 2.0
Migration: 3
Automation: OFF
```

Do not modify any historical v2.8.5 or v2.8.6 release package or transfer envelope. Preserve P10, A6, B6, T6/T6.1, their audit records, and the two real Workspace incident records as history.

Use a new Source A7 containing only source/tests/tools/canonical docs/spec/visualization/incident and recovery guidance. Generate a direct-child Release B7 containing only:

- `implementation/GoogleSpreadsheet/release/v2.8.7-prepilot/`
- `implementation/GoogleSpreadsheet/release/v2.8.7-prepilot-phase8c/`
- the v2.8.7 implementation/release report

Create a separate v2.8.7 transfer envelope and a fixed transfer ref after B7. Follow the existing source/release/transfer lineage discipline. Do not embed an unknowable commit SHA into the same commit; use `SELF` where the repository convention requires it.

## 8. Tests and independent verification

At minimum, execute and report:

- all existing Node suites;
- new real-runtime diagnostic regression suite(s);
- prior Phase 8B Setup Ledger suite;
- F016 Calendar authority-loss suite;
- Apps Script static validator;
- remote publication consistency;
- v2.8.7 Phase 8B and Phase 8C release builders/verifiers;
- source-to-package parity;
- independent rebuild byte parity;
- package checksum inventory;
- Phase 8B copy allow-list;
- transfer-envelope canonical UTF-8/LF checksums;
- provenance and lineage validation;
- secret, credential, local-path, real-ID/URL, and Phase 8C exclusion scans;
- fresh detached HTTPS clone verification of the final fixed transfer ref.

No test may be weakened, deleted, silently skipped, or converted from FAIL to WARN merely to make Setup pass. Any status-policy change must be separately justified by the semantic contract and covered by positive and negative tests.

## 9. Canonical documentation and PR

Update the four root canonical documents, README, decisions, relevant protocols/specifications, traceability, manual acceptance, recovery guidance, visualizations, and package/transfer operator materials.

Record the safe real Workspace evidence without screenshots, IDs, URLs, account names, OAuth details, Calendar identifiers, Gmail content, bookmarks, or personal/business data.

Update Draft PR #8 body so it no longer presents v2.8.5/P10 as the current candidate. The PR body must summarize:

- both real Workspace findings (`PHASE8B-SETUP-01` and `PHASE8B-QUICK-DIAGNOSTIC-01`);
- current v2.8.7 Source/Release/transfer refs;
- exact local/static results and hashes;
- real Workspace retest `NOT_EXECUTED` for v2.8.7;
- Draft/unmerged state;
- GitHub Actions status for this scope;
- Review Focus and prohibited interpretations.

Keep PR #8 Draft and unmerged.

## 10. Git and safety rules

Before work:

- confirm repository root, remote URLs, branch, HEAD, working tree, staged/untracked files, and relevant refs;
- fetch latest remote state normally;
- preserve unrelated local changes and historical worktrees;
- use a clean worktree/fresh clone when appropriate.

Prohibited:

- `reset`, `clean`, `rebase`, `amend`, force push, unrelated revert;
- rewriting A6/B6/T6/T6.1 or prior release/transfer bytes;
- manual edits to the user's Sandbox;
- real Google Workspace access or execution;
- OAuth consent;
- Apps Script import or Setup execution;
- Gmail/Calendar calls;
- deployment or `clasp push`;
- Automation or trigger enablement;
- Provider configuration or credentials;
- real data, IDs, URLs, screenshots, or account information in GitHub.

Commit in clear source/release/transfer/evidence boundaries. Push only with normal non-force updates.

## 11. Status gate

Current status:

```text
PHASE8B_SANDBOX_NO_GO_QUICK_DIAGNOSTIC
```

If any unresolved Critical/High finding, transfer-safety Medium, package mismatch, or unexplained real-runtime contract issue remains, keep NO-GO.

Only after the complete additive v2.8.7 chain is normal-pushed, GitHub-resolved, and independently verified from a fresh detached clone may the maximum status become:

```text
READY_FOR_PHASE8B_SANDBOX_RETRANSFER
```

This permits only carriage/patching of the exact non-confidential v2.8.7 Phase 8B package through an approved company route and a separately authorized real Workspace retest. It does not mean Phase 8B PASS, Phase 8C GO, production ready, pilot ready, OAuth approved, deployment approved, Automation approved, or real-data use approved.

## 12. Required final report

Include:

- conclusion and highest status;
- confirmed root cause for each of the four FAIL checks;
- exact changed Apps Script files and why;
- Source A7 / Release B7 / transfer / fixed-ref / evidence SHAs and lineage;
- exact suite counts, PASS/FAIL/skips;
- package inventories and SHA-256 values;
- source/rebuild parity;
- changed-file boundary for every commit;
- Draft PR #8 URL, head SHA, updated body status, and mergeability;
- GitHub Actions/combined-status evidence or explicit `NOT_EXECUTED`;
- all real Workspace actions remaining `NOT_EXECUTED`;
- unresolved findings and Review Focus;
- confirmation that historical packages/evidence and unrelated worktrees were preserved.

Do not report Phase 8B PASS, Phase 8C GO, production ready, or pilot ready.
