# Google Workspace Personal Work OS v2.8.6
# Phase 8B Setup Ledger Visibility Blocker 修正・再検証指示

- Date: 2026-07-29
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
- Working branch: `codex/r5-independent-reaudit-transfer-prep`
- Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/8`
- Current branch baseline before this instruction: `b2827c136fd872767006b8f59fb7c62a9b8aeffd`
- Failed transferred package fixed ref: `1a1f9df65dacf3a031409d724cb2906b58900f77` (P10)
- Failed package Source A5.4: `6c4f737c676b3121c42aafabe9d0c677cacd69bb`
- Failed package Release B5.4: `3e5790672740626f3bec4592c3c7c0b86b47f3b1`
- Required new code version: `2.8.6-prepilot`
- Schema / AI Schema / Migration remain: `2.6` / `2.0` / `3`
- Current operational gate: `PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER`
- Maximum after local/remote verification: `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`

## 1. Goal

A real Google Workspace Phase 8B Sandbox initial setup failed deterministically before schema-stage completion with `E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN`. Reproduce, correct, test, package, publish, and independently reverify this setup-order defect.

Do not treat the existing P10 package as executable after this finding. Preserve P10 and all prior evidence as historical records. Produce a new source/release/transfer chain for Code `2.8.6-prepilot` without rewriting history.

This task does not execute real Google Workspace, OAuth consent, Apps Script import, Setup, Gmail, Calendar, deployment, `clasp push`, Automation, trigger enablement, Provider configuration, or real data.

## 2. Real Workspace evidence

Observed from a new empty Spreadsheet using the exact P10 Phase 8B package:

```text
status: FAILED
code: E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN
stage: TASK_AUTHORITY
safe_message: Task Authority Ledger must remain hidden.
completed_stages:
  - S00_VALIDATE_ENV
  - S10_CREATE_SHEETS
duration_ms: 38645
```

The failure occurred during the first `初期セットアップ` execution. No manual Ledger hide, raw-row edit, Setup continuation, Quick Diagnostic workaround, Calendar sync, task import, or Automation enablement was performed after the failure.

Treat this as finding `PHASE8B-SETUP-01`, severity High for Phase 8B execution readiness because it blocks a clean first-time Setup in the actual target runtime.

## 3. Suspected root cause to verify

In P10 `02_Setup.gs`:

- `S20_CREATE_SCHEMAS` calls `WorkOsSheetBuilder.applyAllSchemas(spreadsheet)` and then immediately calls `validateTaskAuthorityForSetup(spreadsheet)`.
- `S30_APPLY_SMALL_VALIDATIONS` later calls `WorkOsSheetBuilder.applyVisibility(spreadsheet)`.
- The authority validator requires the protected hidden `Task Authority Ledger` to already be hidden.

The resulting order appears to be:

```text
create Ledger sheet
→ apply schema
→ validate Ledger hidden state
→ fail
→ visibility stage never reached
```

Verify the exact source path and do not assume this hypothesis is complete. Check protection, visibility, fake-runtime behavior, stage persistence, and resumability together.

## 4. Mandatory repository reading

Before changing files, read in order:

1. `README.md`
2. applicable `AGENTS.md` files, if any
3. `CONTRIBUTING.md`, if any
4. `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`
5. `CURRENT_STATUS.md`
6. `DECISIONS.md`
7. `PROJECT_CONTEXT.md`
8. `MASTER_PLAN.md`
9. `docs/TASK_AUTHORITY_PROTOCOL.md`
10. `implementation/GoogleSpreadsheet/apps-script-v2/02_Setup.gs`
11. `implementation/GoogleSpreadsheet/apps-script-v2/03_SheetBuilder.gs`
12. `implementation/GoogleSpreadsheet/apps-script-v2/08_TaskRepository.gs`
13. Setup, schema, authority, visibility/protection, migration, and fresh-environment tests
14. v2.8.5 release/transfer builders and verifiers
15. PR #8 body, changed files, comments, reviews, and checks

## 5. Git safety

First verify:

```powershell
git rev-parse --show-toplevel
git status --short --branch
git remote -v
git fetch --prune origin
git rev-parse origin/codex/r5-independent-reaudit-transfer-prep
git cat-file -e b2827c136fd872767006b8f59fb7c62a9b8aeffd^{commit}
git cat-file -e 1a1f9df65dacf3a031409d724cb2906b58900f77^{commit}
git cat-file -e 6c4f737c676b3121c42aafabe9d0c677cacd69bb^{commit}
git cat-file -e 3e5790672740626f3bec4592c3c7c0b86b47f3b1^{commit}
```

Preserve all existing worktrees, historical commits, staged/untracked artifacts, and PR history. Do not use reset, clean, rebase, amend, force push, unrelated revert, or history rewriting. Use a separate clean worktree or fresh clone if required.

## 6. Required correction behavior

The corrected Setup must satisfy all of the following.

### 6.1 Fresh empty Spreadsheet

- `S00_VALIDATE_ENV` accepts exactly one empty unknown sheet.
- `S10_CREATE_SHEETS` creates the canonical 11-sheet workbook.
- Before any authority validation that requires a hidden/protected Ledger, the `Task Authority Ledger` control plane is hidden and protected through an explicit, idempotent Setup-owned operation.
- Setup proceeds through schema validation without a manual hide workaround.
- `S30` remains idempotent and may reassert visibility/protection safely.

### 6.2 Partial failed-state resume

Model the observed state with completed stages `S00_VALIDATE_ENV` and `S10_CREATE_SHEETS`, canonical sheets created, and Ledger visible because old `S20` failed before completion.

The corrected `continueSetup()` must:

- safely establish the required Ledger visibility/protection before authority validation;
- complete `S20` without trusting visible rows, snapshot cells, notes, or raw values;
- preserve fail-closed authority semantics;
- never require a user to manually hide or edit the Ledger;
- not recreate, duplicate, or silently rebaseline Task authority.

### 6.3 Failure boundaries

- A visibility/protection write failure must return a safe deterministic error and must not record `S20` complete.
- A hidden but unprotected Ledger, or protected but visible Ledger, must fail closed or be corrected only by the explicit Setup-owned control-plane step before authority validation.
- Runtime, diagnostics, Worker, Review, Calendar, and Migration must not gain a general-purpose silent repair path.
- The correction must be scoped to Setup bootstrap/resume ordering, not weaken the validator.

## 7. Test requirements

Add targeted regression tests that fail against P10 and pass after correction.

At minimum cover:

1. fresh empty environment full Setup stage order;
2. `S20` hides/protects Ledger before authority validation;
3. old partially failed state resumes without manual intervention;
4. visibility write failure leaves `S20` incomplete and fail-closed;
5. protection failure leaves `S20` incomplete and fail-closed;
6. S30 idempotently reasserts visibility and protection;
7. no snapshot/note/raw-row fallback is introduced;
8. Setup rerun after completion remains idempotent;
9. fake runtime accurately models `hideSheet`, `showSheet`, `isSheetHidden`, and protection behavior used by this path.

Run all existing 41 suites plus new tests, all Apps Script validation, PowerShell parsing, release/transfer verifiers, parity, provenance, allow-lists, secret scans, and local-path scans.

## 8. Versioning and release boundary

Because the transferred P10 package has already been used in a real Workspace and failed, do not silently replace bytes under the same transfer identity.

Create:

- Code `2.8.6-prepilot`
- Schema `2.6`
- AI Schema `2.0`
- Migration `3`
- Automation default `OFF`
- `TEST_MODE=true` Phase 8B package
- separately generated Phase 8C candidate, still unauthorized

Use an additive Source commit and a direct-child Release commit. Source contains source/tests/tools/docs/changelog only. Release contains only the two new packages and the implementation report. Generate new manifests, inventories, payload/tree hashes, checksums, and transfer envelope. Preserve all v2.8.5 artifacts unchanged as failed historical evidence.

## 9. Audit and canonical documentation

Add a real-Workspace incident record containing only safe evidence:

- finding ID `PHASE8B-SETUP-01`;
- exact safe error code/stage/completed stages;
- no Spreadsheet ID, URL, account, screenshot, company data, or OAuth detail;
- root cause and correction;
- tests proving fresh and resumable Setup;
- explicit statement that real retest is pending.

Update canonical documents so the current gate is no longer transfer-ready for v2.8.5. The maximum before a corrected package is independently published and reverified is `PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER`.

After successful corrected publication, use only `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`; this permits carriage of v2.8.6 to the company PC, not Setup execution or Phase 8B PASS.

## 10. Remote publication and PR

- Commit and normal-push the new Source/Release/evidence chain to `codex/r5-independent-reaudit-transfer-prep`.
- Update Draft PR #8; keep it Draft and unmerged.
- Do not mark ready, merge, squash, rebase, or enable auto-merge.
- Perform final verification from a new detached HTTPS clone at the fixed transfer ref.
- Verify the transfer folder and release packages from GitHub, not from a developer worktree.

## 11. User recovery guidance deliverable

Provide a concise Japanese guide for the already-failed Sandbox:

- keep Automation OFF;
- do not manually hide the Ledger;
- do not run Setup continuation or diagnostics with P10;
- preserve or rename the failed workbook as evidence;
- after v2.8.6 is approved for retransfer, either test safe resume under explicit instruction or use a second new empty Spreadsheet;
- no real data, real Gmail, existing Calendar, Provider, or production trigger.

Do not instruct the user to delete evidence or repair raw sheets manually.

## 12. Prohibited actions

- real Workspace execution;
- OAuth consent or scope changes in a real account;
- Apps Script import, Setup, Gmail/Calendar calls, deployment, `clasp push`;
- Automation/time-driven trigger enablement;
- Provider configuration or credentials;
- real IDs, URLs, email text, personal/client/unpublished information;
- weakening/removing the hidden/protected Ledger invariant;
- manual Ledger hide as the product fix;
- changing historical v2.8.5 package bytes;
- reset, clean, amend, rebase, force push, unrelated revert.

## 13. Completion and report

The final report must include:

- verified root cause;
- exact changed-file boundary;
- Source and Release SHAs and lineage;
- all test suite counts and exact PASS/FAIL/skip totals;
- targeted Setup regression results;
- Apps Script validator result;
- v2.8.6 8B/8C payload hashes and 8B package-tree hash;
- transfer checksum and allow-list results;
- fresh-clone verification ref and remote HEAD;
- Draft PR #8 URL and state;
- current status/gate;
- real Workspace retest status `NOT_EXECUTED`;
- unresolved matters and Review Focus;
- confirmation that old failed Sandbox evidence was not altered by Codex.

Do not declare Phase 8B PASS, Phase 8C GO, production ready, or pilot ready.