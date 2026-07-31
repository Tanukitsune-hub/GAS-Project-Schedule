# 指示番号: 0002
# Google Workspace Personal Work OS v2.8.10
# Phase 8B Tranche 1 Read-only / Structural Acceptance 実行パッケージ作成

- Date: 2026-07-31
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
- Working branch: `codex/r5-independent-reaudit-transfer-prep`
- Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/8`
- Current baseline / 0001 evidence commit: `8137ca4fcf55adf13848c45f158d36920a31c350`
- Instruction 0001 commit: `5def8e4dfc3f8a17168a7158d77f30fe178e0187`
- Fixed transfer T10: `927d8567bce64461840cc6f72fbae0c1e636a8e6`
- Code / Schema / AI Schema / Migration: `2.8.10-prepilot` / `2.6` / `2.0` / `3`
- Current and maximum status for this task: `READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE`

## 1. Mandatory execution rule

This is a documentation, source-review, operator-runbook, and evidence-template task. Do not stop after analysis or a proposed outline.

Read the repository rules and this instruction in full, verify the latest remote state, inspect the actual v2.8.10 fixed-T10 source and existing operator surfaces, create the required Tranche 1 execution package, run validation, commit, normal push, and update Draft PR #8.

Your final report must begin with:

```text
指示番号: 0002
```

Do not execute any real Google Workspace action. Do not modify executable Apps Script source, `appsscript.json`, tests, tools, release packages, transfer envelopes, checksums, fixed T10, or historical evidence. If the existing v2.8.10 UI/source cannot safely support a planned Tranche 1 observation, document the gap and stop that action as `REVIEW_REQUIRED`; do not implement a code change in this task.

## 2. Confirmed starting state

Instruction 0001 has been implemented and published at:

```text
8137ca4fcf55adf13848c45f158d36920a31c350
```

The GitHub record now establishes only the following controlled-Sandbox facts:

- Setup S00-S99: PASS for one observed run;
- in-Setup S90: PASS;
- module contract: `ALIGNED`;
- Dashboard normalization: `NORMALIZED`;
- write / flush / strict postcondition: true;
- checked cells: 51;
- noncanonical cells: 0;
- schema extension and Task-row change/quarantine/orphan counts: zero or unchanged;
- layout refresh: 11 Sheets;
- S60 and S80: PASS as Setup stages only.

The current gate is `READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE`. Standalone diagnostics and all functional/write-path tests remain `NOT_EXECUTED`. Automation and the five-minute trigger remain `OFF` / `NOT_AUTHORIZED`.

## 3. Goal

Prepare an operator-ready, action-by-action execution package for **Tranche 1 only** from:

```text
implementation/GoogleSpreadsheet/docs/V2_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE_PLAN_ja.md
```

The package must allow ChatGPT to authorize and the user to execute each action independently, beginning with T1-01, while preserving strict stop conditions and privacy boundaries.

This task prepares the runbook and templates only. It does not execute or mark any Tranche 1 action PASS.

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
11. instruction 0001 and its evidence commit;
12. the 0001 real-Workspace evidence audit;
13. `implementation/GoogleSpreadsheet/docs/V2_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE_PLAN_ja.md`;
14. fixed-T10 `MANUAL_ACCEPTANCE_GUIDE.md`, acceptance checklist, recovery guide, deployment manifest, and transfer manifest;
15. fixed-T10 Apps Script source relevant to Menu, Quick/Deep Diagnostic, Automation status, triggers, Calendar configuration, schemas, protections, and hidden-sheet state;
16. Draft PR #8 body, comments, state, and checks;
17. this instruction in full.

Confirm remote, branch, HEAD, working tree, staged/unstaged/untracked state, and that current HEAD starts from 0001 evidence commit `8137ca4fcf55adf13848c45f158d36920a31c350`. Fetch normally. Do not reset, clean, amend, rebase, force-push, or overwrite historical artifacts.

## 5. Required source review

Inspect the actual fixed-T10 implementation and map each Tranche 1 action to a real existing operator surface or a bounded manual observation.

At minimum inspect:

- `Menu.gs`;
- `16_Diagnostics.gs`;
- `19_RuntimeSettings.gs`;
- `12_Triggers.gs`;
- `10_CalendarSync.gs`;
- `01_TypesAndSchemas.gs`;
- `03_SheetBuilder.gs`;
- `00_Config.gs`;
- relevant tests proving diagnostics/read-only behavior and resource invariants.

For each T1 action, state one of:

```text
SUPPORTED_BY_EXISTING_MENU
SUPPORTED_BY_EXISTING_SAFE_OUTPUT
SUPPORTED_BY_BOUNDED_MANUAL_OBSERVATION
REVIEW_REQUIRED
```

Do not assume an output exists. Verify the actual function, menu entry, returned fields, and whether the observation can be made without recording sensitive data.

If a planned observation would require Apps Script code changes, deployment, new OAuth scope, trigger creation/deletion, resource ID exposure, or destructive inspection, mark it `REVIEW_REQUIRED` and keep it unexecuted.

## 6. Required operator runbook

Create:

```text
implementation/GoogleSpreadsheet/docs/V2_PHASE8B_TRANCHE1_READONLY_STRUCTURAL_OPERATOR_RUNBOOK_ja.md
```

The runbook must cover T1-01 through T1-08 from the existing controlled-manual-acceptance plan. T1-09 optional Setup idempotence must remain separately gated and must not be included in the initially authorized execution sequence.

For every action include:

- action ID and purpose;
- support classification from Section 5;
- exact existing Spreadsheet menu path, Apps Script function, or bounded manual observation procedure;
- preconditions;
- one-action-only execution instruction;
- expected closed output fields;
- exact PASS condition;
- exact STOP condition;
- `REVIEW_REQUIRED` condition;
- safe evidence fields permitted for ChatGPT/GitHub;
- prohibited information;
- whether the next action may be authorized;
- rollback rule, which normally means stop without repair or retry.

### T1-01 — Standalone Quick Diagnostic

This is the first recommended action. The runbook must make it independently executable without automatically authorizing T1-02.

Confirm from source:

- exact menu path;
- exact result shape and safe fields;
- whether external services are called;
- whether any Sheet, Property, Gmail, Calendar, or trigger write can occur;
- how PASS/WARN/FAIL counts and closed reason categories should be reported;
- what output section the operator should provide without submitting IDs, URLs, cell contents, ranges, locale, or screenshots containing unrelated information.

### T1-02 — Deep Diagnostic

Keep unexecuted until T1-01 evidence is reviewed and separately approved. Verify its source-level read-only and external-I/O boundaries rather than assuming parity with Quick Diagnostic.

### T1-03 through T1-08

Map and document:

- Automation status (`OFF` required);
- five-minute trigger absence;
- workbook topology: 11 Sheets / 5 hidden;
- Task schema: 50 columns;
- Task Authority Ledger: hidden, protected, 21 columns;
- dedicated Calendar configuration and owner edit-trigger configuration, without exposing IDs or performing reconciliation.

Where a single existing safe output can prove multiple observations, keep the evidence fields separated by action ID and do not silently mark unobserved actions PASS.

## 7. Required evidence template

Create:

```text
implementation/GoogleSpreadsheet/docs/V2_PHASE8B_TRANCHE1_READONLY_STRUCTURAL_RESULTS_TEMPLATE_ja.md
```

The template must support one action at a time and contain only closed evidence fields. At minimum:

```text
action_id:
authorization: APPROVED | NOT_APPROVED
execution_status: PASS | STOP | REVIEW_REQUIRED | NOT_EXECUTED
synthetic_non_sensitive_environment: true | false
automation_state: OFF | ON | UNKNOWN
five_minute_trigger_state: ABSENT | PRESENT | UNKNOWN
external_services_called: true | false | UNKNOWN
writes_observed: true | false | UNKNOWN
fail_count:
warn_count:
closed_reason_categories:
next_action_authorized: true | false
```

Add action-specific fields only when required, such as Sheet counts, column counts, hidden/protected Booleans, and closed configuration enums. Do not include actual IDs, URLs, names beyond canonical public Sheet/resource names already in source, data values, formulas, notes, ranges, account identities, timestamps, locale, actual format strings, email/Calendar content, or screenshots.

## 8. Existing plan and canonical-document updates

Update `V2_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE_PLAN_ja.md` only as necessary to link to the new runbook and results template. Preserve all existing Tranche boundaries and `NOT_EXECUTED` statuses.

Update current canonical documents only if needed to reference the new runbook. Do not change:

- Code/Schema versions;
- fixed T10;
- current transfer path;
- current gate `READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE`;
- Phase 8B overall status (`NOT_DECLARED`);
- Phase 8C, production, or pilot boundaries.

Do not create a new release, transfer, fixed ref, or evidence claim.

## 9. Validation requirements

Run at least:

- all existing Node test suites;
- Apps Script validator;
- canonical document consistency test;
- remote publication consistency tests relevant to the current branch;
- secret / credential / local-path / real-Workspace ID and URL scans;
- a changed-file boundary check proving no executable source, test, tool, release, transfer, checksum, or historical audit file changed;
- a link/path check for the new runbook and template;
- fixed T10 resolution and byte-immutability confirmation.

No test allow-list change should be necessary because the current gate does not change. If a validation failure requires changing executable files or tests, stop as `NO_GO_TRANCHE1_RUNBOOK_VALIDATION` and report the exact issue rather than expanding scope.

GitHub Actions/CI may remain `NOT_EXECUTED` if no workflow targets this scope; report this precisely.

## 10. Git and PR procedure

1. Use a clean worktree based on the latest remote branch.
2. Preserve current and historical commits.
3. Create one additive documentation-only commit after validation passes.
4. Normal push only; no force push.
5. Update Draft PR #8 body with:
   - instruction number `0002`;
   - links/paths for the runbook and results template;
   - confirmation that no Tranche 1 action has yet executed;
   - confirmation that fixed T10 and executable bytes remain unchanged;
   - next recommended action T1-01;
   - exact `NOT_EXECUTED` and authorization boundaries.
6. Keep PR #8 open, Draft, and unmerged.

## 11. Maximum status and prohibited claims

The maximum status remains:

```text
READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE
```

Do not declare:

- T1-01 or any Tranche 1 action PASS;
- Phase 8B overall PASS;
- Phase 8C GO;
- production ready;
- pilot ready;
- Automation authorized;
- external provider ready.

## 12. Required final report

The final report must begin with `指示番号: 0002` and include:

1. highest status;
2. documentation commit SHA and parent;
3. exact changed files;
4. source-to-action support matrix for T1-01 through T1-08;
5. exact paths and GitHub URLs for the runbook and results template;
6. validation commands and exact results;
7. confirmation that Apps Script source/tests/tools/releases/transfers/checksums/fixed T10 were unchanged;
8. PR #8 state and head;
9. next recommended operator action T1-01, still `NOT_EXECUTED`;
10. unresolved gaps and `REVIEW_REQUIRED` actions;
11. Review Focus.

Do not report completion unless the commit is pushed and resolvable from GitHub.
