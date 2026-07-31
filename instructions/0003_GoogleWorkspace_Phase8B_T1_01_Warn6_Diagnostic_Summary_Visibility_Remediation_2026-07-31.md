# 指示番号: 0003
# Google Workspace Personal Work OS
# Phase 8B T1-01 WARN=6 証跡化／Diagnostic bounded summary visibility remediation

- Date: 2026-07-31
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
- Working branch: `codex/r5-independent-reaudit-transfer-prep`
- Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/8`
- Current baseline / Instruction 0002 result: `cc727c3c1e94c9c76b1fa003c78f92911d229e0d`
- Instruction 0002 commit: `ad347e95512a14842147973487550a05e1e6c12d`
- Instruction 0001 evidence commit: `8137ca4fcf55adf13848c45f158d36920a31c350`
- Fixed transfer T10: `927d8567bce64461840cc6f72fbae0c1e636a8e6`
- Current candidate: Code `2.8.10-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- Current governance gate: `READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE`
- T1-01 action status at task start: `REVIEW_REQUIRED`

## 1. Mandatory execution rule

This task must investigate, record, remediate, test, package, publish, and prepare the exact controlled retransfer/retest boundary. Do not stop after analysis, an incident note, or a proposed patch.

Read the repository rules and this instruction in full. Verify the latest remote state, inspect fixed-T10 executable source and tests, create a privacy-bounded T1-01 evidence record, implement the smallest safe Diagnostic acceptance-summary visibility correction, run the complete required validation, create repo-consistent source/release/transfer/evidence lineage, commit, normal push, and update Draft PR #8.

Your final report must begin with:

```text
指示番号: 0003
```

Do not execute any real Google Workspace action in this task. Do not mark T1-01 PASS. Do not authorize T1-02, Dashboard refresh, Gmail, Calendar reconciliation, Automation, deployment, `clasp push`, Phase 8C, production, or pilot use.

## 2. Newly observed controlled Sandbox evidence

One individually approved T1-01 Standalone Quick Diagnostic was executed once in the existing controlled, non-production, synthetic/non-sensitive Sandbox.

Record only the following closed evidence:

```text
action_id: T1-01
authorization: APPROVED
execution_status: REVIEW_REQUIRED
diagnostic_kind: QUICK
reported_status: WARN
pass_count: 77
warn_count: 6
fail_count: 0
code_version: 2.8.10-prepilot
schema_version: 2.6
migration_version: 3
setup_completed_through: S99_COMPLETE
duration_ms: 26742
remaining_warning_ids_safely_observable: false
detail_visibility: INSUFFICIENT_TRUNCATED_OR_OUT_OF_VIEW
next_action_authorized: false
rollback_rule: STOP_NO_REPAIR_NO_RETRY
```

The following bounded visible checks may also be recorded:

```text
DASHBOARD_LAYOUT_OWNERSHIP:
  status: WARN
  layout_status: LEGACY_SEED
  writable: true
  protection_access_mode: OWNER_EXPLICIT_EDITOR
  conflict_reason_present: false
  conflict_subreason_present: false
  conflict_count_total: 0
  external_services_called: false
  repair_performed: false

TASK_SCHEMA:
  physical_column_count: 50
  expected_column_count: 50
  internal_ids_state: PASS
  headers_state: PASS
```

Do not retain or reproduce the supplied screenshots, browser tabs, account information, Workspace IDs/URLs, actual Sheet content, ranges, headers, locale, formulas, notes, formatting strings, user identity, timestamps beyond the closed duration above, or detailed JSON.

The observation proves only that the diagnostic returned 77 PASS / 6 WARN / 0 FAIL and that the visible bounded checks above had those states. It does not prove which check IDs account for all six WARNs.

## 3. Required initial conclusion

The T1-01 result is not PASS because all warning IDs/categories cannot be safely established from the existing UI result.

Fixed T10 `Menu.gs` currently displays only aggregate status counts in the top summary and appends redacted detailed JSON below. The detailed JSON is capped at 10,500 characters. A valid diagnostic can therefore contain warning checks that are absent from the visible retained portion. This is a controlled-acceptance evidence visibility gap.

The fixed-T10 source shows several possible warning-producing branches, including but not limited to:

- `DASHBOARD_LAYOUT_OWNERSHIP`;
- `PRODUCTION_AI_CONFIGURATION`;
- `PRODUCTION_AI_POLICY_APPROVAL`;
- `PRODUCTION_AI_AUTH_READINESS`;
- `CALENDAR_REMOTE_VERIFICATION`;
- state-dependent warnings such as `RETRY_DEAD_LETTER_STATE`, `MANAGEMENT_COLUMN_DIRECT_EDIT`, `AI_PROVIDER_RETRY_SUPPRESSION`, Setup/property/trigger warnings, or another safely classified warning.

Do not infer or formally assert the sixth real warning ID from source possibilities. The earlier Calendar safe stop makes an unresolved-error warning a plausible hypothesis only; it is not observed closed evidence.

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
11. Instructions 0001 and 0002 and their result commits;
12. the 0001 real-Workspace Setup/S90 evidence;
13. the controlled manual acceptance plan;
14. the 0002 Tranche 1 Operator Runbook and Results Template;
15. fixed-T10 `Menu.gs`, `16_Diagnostics.gs`, `12_Triggers.gs`, `19_RuntimeSettings.gs`, `10_CalendarSync.gs`, Config, Setup, Dashboard, schemas, and relevant tests;
16. fixed-T10 release/transfer manifests, checksums, patch rules, and recovery guidance;
17. Draft PR #8 body, comments, state, and checks;
18. this instruction in full.

Confirm remote, branch, HEAD, working tree, staged/unstaged/untracked state, and that the current remote branch contains baseline `cc727c3c1e94c9c76b1fa003c78f92911d229e0d`. Fetch normally. Do not reset, clean, amend, rebase, force-push, or overwrite historical artifacts.

## 5. Required incident/evidence record

Create an additive audit record under:

```text
audits/2026-07-31/
```

Use an exact descriptive filename such as:

```text
GoogleWorkspace_Phase8B_T1_01_Quick_Diagnostic_Warn6_Bounded_Summary_Visibility_Blocker_2026-07-31.md
```

The audit must include:

- instruction number `0003`;
- the closed evidence in Section 2;
- T1-01 outcome `REVIEW_REQUIRED`;
- no T1-02 authorization;
- the distinction between zero FAIL and inability to close all WARN IDs;
- the source-confirmed UI/detail-cap visibility gap;
- the list of possible warning-producing branches as source possibilities, not real-result claims;
- a privacy statement confirming screenshots are not retained;
- exact `NOT_EXECUTED` and prohibited-operation boundaries.

Do not declare a runtime product failure solely from WARN=6. Do not declare T1-01 PASS.

## 6. Remediation requirement — bounded Diagnostic acceptance summary

Implement the smallest safe executable correction that guarantees the operator can determine all acceptance-relevant Quick Diagnostic outcomes without reading or retaining detailed JSON.

The corrected Quick Diagnostic result and the UI area displayed before detailed JSON must contain a bounded, deterministic, privacy-safe acceptance summary. At minimum include:

```text
summary_contract_id
diagnostic_kind
status
pass_count
warn_count
fail_count
not_executed_count
warn_check_ids
fail_check_ids
warn_ids_complete
fail_ids_complete
external_services_called
writes_performed
spreadsheet_write_performed
properties_write_performed
trigger_write_performed
flush_performed
calendar_api_called
gmail_api_called
external_ai_request_performed
dashboard_repair_performed
```

Also include the closed aggregates needed for later separately approved T1-06 and T1-07 without rerunning Quick Diagnostic:

```text
task_physical_column_count
task_schema_ids_state
task_schema_headers_state
ledger_physical_column_count
ledger_hidden_state
ledger_protection_state
ledger_authority_validator_state
```

Requirements:

1. Warning and failure check IDs must be deterministic, stable, sorted, unique, and privacy-safe.
2. The summary must never include `safe_message`, raw details, values, formulas, ranges, Sheet names, IDs, URLs, identity, account information, event/mail content, actual formats, locale, or timestamps.
3. The summary must appear before detailed JSON and remain fully visible even when the detailed JSON exceeds its display cap.
4. If the complete WARN/FAIL ID lists cannot fit within the bounded contract, set the corresponding `*_ids_complete=false` and fail closed for acceptance; never silently omit an ID.
5. The known diagnostic check population is bounded. Choose and test an explicit maximum rather than an unbounded array.
6. `showSafeResult_` may continue to redact and cap detailed JSON, but acceptance must not depend on that detail.
7. Quick and Deep Diagnostic must remain read-only. The summary builder itself must not write Sheets, Properties, triggers, Gmail, Calendar, logs, or external services and must not call `SpreadsheetApp.flush()`.
8. Do not convert expected WARNs to PASS, suppress warnings, reduce checks, or weaken fail-closed behavior merely to improve the count.
9. Preserve S90 module alignment and all fixed-T10 Dashboard normalization behavior.
10. Deep Diagnostic should use the same bounded summary contract where technically appropriate, but do not expand its execution scope.

## 7. Reproduction and tests

Add regression coverage that proves at least:

1. A Quick Diagnostic result with more than 10,500 characters of details still displays the complete bounded WARN/FAIL summary before the truncated detail.
2. Six WARN IDs are all present, sorted, unique, complete, and visible in the summary while detailed JSON is truncated.
3. A state-dependent sixth warning can be represented without exposing its raw details. Use synthetic fixtures only.
4. `DASHBOARD_LAYOUT_OWNERSHIP=LEGACY_SEED` remains WARN with no repair/write/external call.
5. Three Production AI readiness WARNs and `CALENDAR_REMOTE_VERIFICATION` remain warnings where configured by the existing candidate.
6. The summary side-effect Booleans are false and are backed by the diagnostic execution policy, not optimistic defaults.
7. T1-06 Task aggregates and T1-07 Ledger aggregates are accurate in canonical, failure, and unknown/incomplete fixtures.
8. If the warning/failure ID bound is exceeded, completeness becomes false and acceptance fails closed.
9. Existing detail redaction and truncation still work.
10. No existing Quick/Deep read-only, S90, authority, Calendar, Automation, stale-ref, or publication negative test is weakened.

Create a deterministic local fixture approximating the observed completed-Sandbox state. It may demonstrate a source-consistent six-WARN scenario, but label it synthetic. Do not claim it proves the exact sixth real warning.

## 8. Versioning, release, transfer, and lineage

This is an executable behavior/output change. Follow the repository’s actual versioning and publication conventions rather than silently editing fixed T10.

- Preserve fixed T10 and all A10/B10/T10/E10/0001/0002 artifacts byte-for-byte.
- Select the smallest repo-consistent patch version after inspecting existing rules. A likely candidate is Code `2.8.11-prepilot` with Schema `2.6`, AI Schema `2.0`, Migration `3`, but do not create code/property drift or an unsafe update path merely to follow this suggestion.
- Explicitly solve how an already-complete v2.8.10 Sandbox receives the corrected summary without requiring an unsafe broad Setup rerun, external-resource recreation, Calendar deletion, label deletion, trigger mutation, or Automation change.
- If a Code version bump requires property reconciliation, implement or document a narrow, safe, idempotent path with tests and separate operator approval. Do not silently treat a version mismatch as acceptable.
- Create the repo-consistent additive Source, direct-child Release, fixed transfer, and evidence/publication chain.
- Produce exact raw-blob patch manifests from fixed T10 to the new release, with old/new SHA-256 and replacement order.
- Include only required files in the company-PC patch boundary.
- Keep `TEST_MODE=true`, Automation `OFF`, and the five-minute trigger absent.
- Do not include Phase 8C or production payloads in the transfer.
- Verify detached-clone resolution, checksums, allow-lists, provenance, secret scans, and source/release/transfer boundaries.

The resulting highest status may authorize only controlled carriage/retest of the corrected T1-01 summary. It must not declare T1-01 PASS or authorize T1-02 before a new real Workspace T1-01 result is reviewed.

## 9. Operator retransfer/retest package

Create a Japanese operator instruction for the existing controlled Sandbox that states exactly:

- which files to replace and in what order;
- old/new hashes;
- whether Spreadsheet reload is needed;
- whether any Setup action is required or prohibited;
- confirmation that Calendar, Gmail labels, Properties, edit trigger, Dashboard, Task/Ledger, and Automation must not be manually changed;
- one permitted action after transfer: T1-01 Quick Diagnostic once;
- exact acceptance-summary fields to report;
- STOP conditions;
- no screenshot or detailed JSON requirement;
- no T1-02 authorization.

A patch that cannot be safely applied to the existing completed Sandbox must stop as `NO_GO_T1_01_SUMMARY_RETRANSFER` rather than improvising a destructive reset.

## 10. Documentation and current status

Update the canonical and acceptance documents consistently:

- `README.md`;
- `CURRENT_STATUS.md`;
- `MASTER_PLAN.md`;
- `PROJECT_CONTEXT.md`;
- `DECISIONS.md` as needed;
- Tranche 1 Operator Runbook;
- Results Template;
- controlled manual acceptance plan;
- relevant verification matrix and visualization metadata.

Record T1-01 as `REVIEW_REQUIRED` until a corrected real Workspace result is reviewed. Keep T1-02 and all later actions `NOT_EXECUTED` / not authorized.

Do not claim that the real sixth WARN has been identified unless a new bounded real output establishes it.

## 11. Validation requirements

Run at least:

- all Node test suites;
- new bounded-summary/truncation/privacy tests;
- Apps Script validator;
- canonical-document consistency;
- package and transfer parity/checksum/allow-list/provenance verifiers;
- remote publication consistency;
- fixed-ref detached fresh-clone verification;
- secret / credential / local-path / real-Workspace ID and URL scans;
- changed-file and lineage boundary checks;
- independent rebuild/parity checks for every new package;
- exact fixed-T10-to-new-release raw-byte comparison.

Report exact suite/assertion counts, PASS/FAIL/SKIP, and any genuine environment limitation. GitHub Actions/CI may remain `NOT_EXECUTED` only if no workflow targets this scope.

## 12. Git and PR procedure

1. Work from a clean worktree based on the latest remote branch.
2. Preserve all historical commits and artifacts.
3. Use additive commits following the repository’s existing source/release/transfer/evidence boundaries.
4. Normal push only; no force push.
5. Update Draft PR #8 with:
   - instruction number `0003`;
   - the T1-01 `REVIEW_REQUIRED` evidence;
   - source-confirmed summary visibility gap;
   - exact correction and tests;
   - version and lineage;
   - transfer/retest boundary;
   - exact `NOT_EXECUTED` items;
   - Review Focus.
6. Keep PR #8 open, Draft, and unmerged.

## 13. Required final report

The final report must begin with `指示番号: 0003` and include:

1. highest status;
2. T1-01 evidence classification and audit path;
3. confirmed root cause of the acceptance-summary visibility gap;
4. whether the exact sixth real WARN remains unknown;
5. selected version and rationale;
6. Source/Release/Transfer/Evidence commit SHAs and parent boundaries;
7. exact files changed in executable payload;
8. exact old/new hashes and patch order;
9. all validation commands and exact results;
10. proof fixed T10 and historical artifacts are unchanged;
11. PR #8 state and head;
12. exact operator retransfer/retest steps;
13. unresolved matters and `NOT_EXECUTED` items;
14. Review Focus.

Do not report completion unless every required commit is normally pushed and resolvable from GitHub.