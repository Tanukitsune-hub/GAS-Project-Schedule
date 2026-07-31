# 指示番号 0001
# Google Workspace Personal Work OS v2.8.10
# Phase 8B 実Workspace Setup・S90 PASS証跡化／次段階受入計画

- Date: 2026-07-31
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
- Working branch: `codex/r5-independent-reaudit-transfer-prep`
- Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/8`
- Current baseline / Evidence E10: `c45479878878957940fad4afe5326c6d26d75d3c`
- Fixed transfer T10: `927d8567bce64461840cc6f72fbae0c1e636a8e6`
- Code / Schema / AI Schema / Migration: `2.8.10-prepilot` / `2.6` / `2.0` / `3`
- Current published gate before this instruction: `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`
- Maximum status after this task: `READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE`

## 1. Mandatory execution rule

This is an evidence, governance, and next-stage planning task. Do not stop after analysis or a proposed plan.

Read the repository rules and this instruction in full, verify the current remote state, create the required evidence and acceptance-plan documents, update current canonical documents and Draft PR #8, run required validation, commit, normal push, and report the exact resulting commit SHA and Review Focus.

Your final report must begin with:

```text
指示番号: 0001
```

Do not modify executable Apps Script source, tests, build tools, release packages, transfer envelopes, checksums, fixed T10, or historical evidence unless this instruction explicitly requires it. This task should be an additive evidence/documentation commit only.

## 2. Newly observed real Google Workspace evidence

A controlled non-production Google Workspace Sandbox using the fixed-T10 v2.8.10 payload completed Setup successfully. Record only the following closed, non-sensitive evidence:

```text
status: COMPLETE
completed_stages:
  S00_VALIDATE_ENV
  S10_CREATE_SHEETS
  S20_CREATE_SCHEMAS
  S30_APPLY_SMALL_VALIDATIONS
  S40_SEED_SAFE_SETTINGS
  S50_CREATE_GMAIL_LABELS
  S60_CREATE_DEADLINE_CALENDAR
  S70_STORE_PROPERTIES
  S80_CREATE_EDIT_TRIGGER
  S90_QUICK_DIAGNOSTIC
  S99_COMPLETE

S90 safe_summary:
  module_contract_status: ALIGNED
  dashboard_number_format_normalization:
    normalization_status: NORMALIZED
    write_performed: true
    flush_performed: true
    postcondition_verified: true
    checked_cell_count: 51
    noncanonical_count: 0

v2_schema_extension:
  status: CURRENT
  changed: false
  appended_columns: 0
  updated_task_rows: 0
  quarantined_task_rows: 0
  orphaned_task_rows: 0
  migration_source: 2.6

completed_layout_refresh:
  refreshed: true
  sheet_count: 11
```

This evidence proves the following limited facts:

1. Real Workspace Setup completed through S99.
2. The S90-critical Config / Setup / Dashboard module contract was aligned.
3. The exact 51-cell Dashboard number-format block was normalized.
4. The write was followed by flush and a successful strict postcondition.
5. S90 Quick Diagnostic completed without the prior 51-cell blocker.
6. No schema extension, Task-row update, quarantine, or orphaning was reported.
7. The completed layout refresh covered 11 Sheets.

Do not infer or claim more than these observations prove.

## 3. Privacy and evidence boundary

Do not commit or reproduce:

- screenshots or photographs;
- Spreadsheet, Calendar, Gmail, Script Project, Message, Thread, Event, Trigger, or account IDs;
- Workspace URLs or internal links;
- user identity, account name, email address, bookmarks, browser tabs, device information, or local paths;
- actual Calendar descriptions, instance markers, actual cell values, actual number-format strings, locale, formulas, notes, or business data;
- OAuth details, credentials, tokens, API keys, or authorization responses.

The audit record must state that the source observation was reviewed by the operator and translated into the closed evidence above; the image itself is not retained in GitHub.

Do not formally assert an unobserved root cause for the earlier Calendar adoption failure. It is sufficient to record that the new run completed S60 after the prior safe `E_CALENDAR_APP_ACCESS_REQUIRED` stop. Do not record a Calendar ID or claim a specific deletion/recreation sequence unless independently confirmed from safe evidence.

## 4. Required repository reading

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
12. `implementation/GoogleSpreadsheet/release/v2.8.10-prepilot/MANUAL_ACCEPTANCE_GUIDE.md`;
13. `implementation/GoogleSpreadsheet/transfer/v2.8.10-prepilot/PHASE8B_ACCEPTANCE_CHECKLIST_ja.md`;
14. `implementation/GoogleSpreadsheet/transfer/v2.8.10-prepilot/FAILED_SANDBOX_RECOVERY_GUIDE_ja.md`;
15. fixed-T10 deployment manifest, patch manifest, transfer manifest, and E10 audit;
16. Draft PR #8 body, state, comments, and checks.

Confirm remote, branch, HEAD, working tree, staged/unstaged/untracked state, and the A10 -> B10 -> T10 -> E10 lineage. Fetch normally. Do not reset, clean, amend, rebase, force-push, or overwrite historical artifacts.

## 5. Required new real-Workspace evidence record

Create one additive audit record under:

```text
audits/2026-07-31/
```

Use an appropriate exact filename such as:

```text
GoogleWorkspace_v2_8_10_Phase8B_Real_Workspace_Setup_S90_Acceptance_Evidence_2026-07-31.md
```

The record must include:

- instruction number `0001`;
- repository, branch, fixed T10, baseline E10, Code/Schema versions;
- the exact closed evidence in Section 2;
- an explicit conclusion that the former Dashboard 51-cell blocker is remediated in this observed Setup run;
- an explicit conclusion that real Workspace Setup, S90, and S99 are PASS for this controlled Sandbox run;
- explicit separation between Setup-stage completion and unexecuted functional tests;
- an exact `NOT_EXECUTED` list;
- no screenshot, identity, actual ID, URL, locale, format string, or business content.

The audit must not declare Phase 8B overall PASS, Phase 8C GO, production ready, or pilot ready.

## 6. Status and canonical-document updates

Update the current canonical documents so they remain mutually consistent:

- `README.md`;
- `CURRENT_STATUS.md`;
- `MASTER_PLAN.md`;
- `PROJECT_CONTEXT.md`;
- `DECISIONS.md` where a new decision is necessary.

The new current status may be:

```text
READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE
```

Use that exact status only after the new evidence record and all document checks pass.

Interpretation:

- fixed T10 remains the current payload and transfer anchor;
- real Workspace Setup S00-S99 is PASS for the observed controlled Sandbox run;
- S90 module alignment and Dashboard normalization/postcondition are PASS;
- this status authorizes only a separately approved, staged Phase 8B manual acceptance sequence using synthetic non-sensitive data;
- it does not authorize Automation, a five-minute trigger, external AI, real data, deployment, `clasp push`, Phase 8C, production, or pilot use.

Update the machine-readable current-transfer/current-status blocks without replacing historical T8/T9/T10 evidence. If the current document consistency verifier is scoped only to transfer readiness, extend it only when necessary to represent the new gate safely; do not weaken its stale-ref negative tests.

## 7. Next controlled manual-acceptance plan

Create or update a Japanese operator plan under the existing documentation structure. Prefer:

```text
implementation/GoogleSpreadsheet/docs/V2_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE_PLAN_ja.md
```

The plan must divide future real Workspace tests into separately authorized tranches. Do not execute them in this task.

### Tranche 1 — Read-only and structural checks

This should be the next recommended operator tranche. It may include:

1. standalone Quick Diagnostic;
2. Deep Diagnostic;
3. Automation status inspection;
4. confirmation that Automation is OFF and no five-minute trigger exists;
5. confirmation of 11 Sheets / 5 hidden Sheets;
6. confirmation that `タスク一覧` has 50 columns;
7. confirmation that `Task Authority Ledger` is hidden/protected with 21 columns;
8. confirmation that the dedicated Calendar configuration and the owner edit trigger are configured, without recording IDs;
9. re-running Setup only as an idempotence check if explicitly justified, with no external-resource duplication.

Every action must have a precise pass condition, stop condition, evidence fields, and prohibited information list.

### Tranche 2 — Bounded synthetic write-path checks

Keep this separately gated and `NOT_EXECUTED`. It may include:

- explicit Dashboard refresh with aggregate/synthetic state only;
- synthetic Task creation/edit and installable edit-trigger behavior;
- one synthetic manual Gmail import;
- deterministic Mock AI vertical flow;
- one synthetic Calendar reconciliation job;
- Task/ledger consistency and idempotence checks.

Do not authorize real email content, real deadlines, business data, external AI, or Automation.

### Tranche 3 — Controlled fault and recovery checks

Keep this separately gated and `NOT_EXECUTED`. It may include only predesigned synthetic fault cases for authority, Calendar outbox, retry, multi-row/header restoration, and recovery. The plan must identify which tests are too destructive or impractical for the company Workspace and may remain covered by local fault-injection evidence instead.

### Tranche 4 — Later-stage readiness decision

Keep Phase 8C, production, pilot, external provider, deployment, and Automation explicitly outside the current authorization.

## 8. External-status matrix

Update the real-environment status matrix conservatively. At minimum:

| External item | Status after this evidence |
|---|---|
| Real Google Workspace Setup S00-S99 | PASS |
| Real S90 Quick Diagnostic within Setup | PASS |
| S90 module contract alignment | PASS |
| Dashboard 51-cell normalization / flush / postcondition | PASS |
| Real dedicated Calendar provisioning stage S60 | PASS for Setup stage only |
| Real owner edit trigger creation stage S80 | PASS for Setup stage only |
| Standalone Quick Diagnostic | NOT_EXECUTED unless separately observed |
| Deep Diagnostic | NOT_EXECUTED |
| Dashboard refresh | NOT_EXECUTED |
| Functional edit-trigger behavior | NOT_EXECUTED |
| Real Gmail processing | NOT_EXECUTED |
| Real Calendar reconciliation | NOT_EXECUTED |
| LockService contention | NOT_EXECUTED |
| Authority fault injection | NOT_EXECUTED |
| External provider/model/credential | NOT_EXECUTED |
| Automation / five-minute trigger | OFF / NOT_AUTHORIZED |
| Phase 8B overall PASS | NOT_DECLARED |
| Phase 8C GO | NOT_DECLARED |
| Production / pilot readiness | NOT_DECLARED |

Do not relabel Setup stage completion as full Gmail, Calendar, or trigger functional validation.

## 9. Validation requirements

Run at least:

- all Node test suites, unless a genuine environment blocker is documented;
- Apps Script validator;
- canonical document consistency test;
- remote publication consistency tests relevant to the current branch;
- secret / credential / local-path / real-Workspace ID and URL scans;
- a diff/boundary check proving this commit changes only approved documentation/evidence paths.

No release/package/transfer rebuild is required because executable bytes and fixed T10 are unchanged. Confirm that fixed T10 remains resolvable and byte-unchanged.

GitHub Actions/CI may remain `NOT_EXECUTED` if no workflow targets this scope; state this precisely.

## 10. Git and PR procedure

1. Use a clean worktree based on the latest remote branch.
2. Preserve current and historical commits.
3. Create one additive evidence/documentation commit after all validation passes.
4. Normal push only; no force push.
5. Update Draft PR #8 body with:
   - instruction number `0001`;
   - the new real Workspace Setup/S90 evidence;
   - the new controlled-manual-acceptance status;
   - the exact `NOT_EXECUTED` boundary;
   - confirmation that fixed T10 and executable bytes are unchanged.
6. Keep PR #8 open, Draft, and unmerged.

## 11. Required final report

The final report must begin with `指示番号: 0001` and include:

1. highest status;
2. evidence commit SHA and parent;
3. exact files changed;
4. evidence summary using only the closed fields in Section 2;
5. validation commands and exact results;
6. confirmation that source/tests/tools/releases/transfers/fixed T10 were unchanged;
7. PR #8 state and head;
8. next recommended operator tranche;
9. all unresolved matters and `NOT_EXECUTED` items;
10. Review Focus.

Do not report this task complete unless the commit is pushed and resolvable from GitHub.
