# Google Workspace Personal Work OS v2.8.7
# 実装実行・会社PC差分更新Manifest作成指示

- Date: 2026-07-30
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
- Working branch: `codex/r5-independent-reaudit-transfer-prep`
- Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/8`
- Current branch baseline before this instruction: `eb382e142468960730cb8ed3c3f887d9a94c2e43`
- Primary implementation specification:
  `instructions/GoogleWorkspace_v2_8_7_Phase8B_Quick_Diagnostic_Real_Runtime_Remediation_2026-07-30.md`
- Primary specification commit: `eb382e142468960730cb8ed3c3f887d9a94c2e43`
- Current Source A6: `8e8e3e4a5f2288985554b3467a5b68814e7bab21`
- Current Release B6: `49f6774242e11f3c4ae1f0881dc4a7e13c5aad23`
- Current fixed transfer ref T6.1: `863217b99dfa1ad682a8f4dd1989212b0a8d548b`
- Required new Code version: `2.8.7-prepilot`
- Schema / AI Schema / Migration: `2.6` / `2.0` / `3`
- Starting operational gate: `PHASE8B_SANDBOX_NO_GO_QUICK_DIAGNOSTIC`
- Maximum after complete verification: `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`

## 1. Mandatory execution rule

This is an **implementation execution task**. Do not stop after analysis, root-cause confirmation, a proposed plan, or a rewritten instruction.

You must perform the implementation, regression tests, package generation, independent verification, commits, normal push, and Draft PR update described here and in the primary specification.

A response that only says “精査しました”, only provides another prompt, or leaves v2.8.7 artifacts absent is incomplete.

If a genuine blocker prevents execution, stop with a precise `NO-GO_*` status and report the blocker, but do not misrepresent analysis as implementation completion.

## 2. Repository reading and baseline

Before modifying anything, read and follow:

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
11. the primary implementation specification in full;
12. relevant source, tests, tools, v2.8.6 release/transfer artifacts, audits, and PR #8.

Confirm remote, branch, HEAD, working tree, staged/unstaged/untracked state, and A6/B6/T6.1 lineage. Fetch normally. Preserve unrelated worktree changes and historical artifacts.

Use a separate clean worktree based on the latest remote instruction commit. Do not reset, clean, amend, rebase, or force-push an existing worktree.

## 3. Required product correction

Implement every requirement in the primary specification for the four real-runtime Quick Diagnostic findings:

- `DASHBOARD_LAYOUT_OWNERSHIP`;
- `TASK_PROTECTIONS`;
- `BLANK_ROW_BOOLEAN_VALUES`;
- `TASK_VALIDATION_TYPES`.

Do not weaken the diagnostic globally and do not merely convert failures to warnings.

At minimum:

- derive canonical checkbox expectations from the Task schema rather than a fixed list;
- treat checkbox-rendered `false` on identity-empty rows according to the real Google Sheets empty-row contract without accepting `true`, invalid values, partial identity, or business data;
- align Task header protection validation with the canonical protected rows 1–2 and all 50 columns;
- reproduce the S20/S30/S40 Dashboard state with real-runtime-like protection, formatting, validation, note, hidden-state, and empty-cell behavior;
- accept only the canonical pre-refresh Dashboard seed/control plane;
- retain fail-closed behavior for foreign protection, overlapping protection, user values/formulas/notes/named ranges, merges, hidden rows/columns, duplicate keys, malformed markers, and unsafe formatting;
- keep Quick Diagnostic read-only;
- support safe resume from exactly S00–S80 complete, S90/S99 incomplete;
- prove no duplicate Gmail labels, dedicated Calendar, owner edit trigger, or external setup resource is created during resume;
- keep Automation and the five-minute trigger OFF.

## 4. Version and candidate boundaries

Create an additive v2.8.7 chain without modifying historical v2.8.5 or v2.8.6 package bytes or transfer envelopes.

### Source A7

Source A7 must contain only source, tests, tools, canonical documents, specifications, visualizations, incident/recovery guidance, and changelog material. It must not contain v2.8.7 generated release packages, the v2.8.7 release report, or the v2.8.7 transfer envelope.

### Release B7

Create Release B7 as the direct child of Source A7. It must contain only:

- `implementation/GoogleSpreadsheet/release/v2.8.7-prepilot/`;
- `implementation/GoogleSpreadsheet/release/v2.8.7-prepilot-phase8c/`;
- the v2.8.7 implementation/release report.

### Transfer ref

After B7, create a separate v2.8.7 transfer envelope and fixed transfer ref. Use an additional correction ref only if an independently demonstrated transfer-record defect requires it.

The transfer envelope and later evidence commits must not alter the immutable release package.

## 5. Company-PC differential patch manifest — mandatory

The user updates Apps Script manually and wants to replace only changed payload files. Therefore, the v2.8.7 transfer envelope must include:

`implementation/GoogleSpreadsheet/transfer/v2.8.7-prepilot/COMPANY_PC_PATCH_MANIFEST_ja.md`

This manifest is mandatory and must be generated from an actual byte comparison between:

- old payload: fixed T6.1 `release/v2.8.6-prepilot/apps-script/`;
- new payload: final fixed v2.8.7 `release/v2.8.7-prepilot/apps-script/`.

It must contain:

1. old fixed ref, old version, new fixed ref, and new version;
2. an exact list titled `会社PCで差し替えるファイル`;
3. every changed payload path, old SHA-256, and new SHA-256;
4. every added or removed payload file, if any;
5. a statement on whether `appsscript.json` changed;
6. a statement that files not listed are byte-identical and need not be replaced;
7. safe update order;
8. the exact post-update version and safe config checks;
9. instructions for the current Sandbox state: S00–S80 complete, S90/S99 incomplete;
10. a stop rule if any local company-PC file does not match the expected old T6.1 hash before replacement;
11. a stop rule if any pasted new file cannot be confirmed against its new hash;
12. an explicit prohibition on manual Sheet, checkbox, Protection, Dashboard, Ledger, Gmail label, Calendar, trigger, or Task-data repair.

Also include a machine-readable companion:

`implementation/GoogleSpreadsheet/transfer/v2.8.7-prepilot/COMPANY_PC_PATCH_MANIFEST.json`

The JSON must include, at minimum:

- `old_fixed_ref`;
- `new_fixed_ref`;
- `old_version`;
- `new_version`;
- `changed_payload_files` with `path`, `old_sha256`, `new_sha256`, and `change_type`;
- `unchanged_payload_file_count`;
- `appsscript_manifest_changed`;
- `safe_resume_stage`;
- `automation_enabled`;
- `real_workspace_retest`.

Do not pre-assume the final changed-file set. Derive it from the final verified package comparison. The final report must repeat this exact list so ChatGPT can tell the user precisely which Apps Script files to replace.

## 6. Expected source areas, without pre-committing the final patch list

The investigation is expected to cover at least:

- `00_Config.gs` for the code version;
- `01_TypesAndSchemas.gs` if a shared canonical validation/protection contract is required;
- `02_Setup.gs` if safe S00–S80 resume behavior requires correction;
- `03_SheetBuilder.gs` if shared protection or Setup control-plane helpers require correction;
- `15_Dashboard.gs` for canonical Dashboard state recognition;
- `16_Diagnostics.gs` for schema-driven diagnostics and blank-row semantics;
- `99_TestHarness.gs` for acceptance-test contract alignment.

This is an investigation list, not permission to modify all of them. Modify only files justified by the implementation. The final company-PC patch list must come from byte comparison, not from this expectation list.

## 7. Required tests

Implement the tests required by the primary specification. At minimum:

- new `phase8b_quick_diagnostic_real_runtime_test.js`;
- update `phase1_audit_test.js` for the two-row Task header protection contract and negative cases;
- update `prepilot_dashboard_safety_test.js` for actual Setup-like seed/control-plane behavior;
- update `phase8b_setup_ledger_visibility_test.js` for S00–S80 resume and external-resource invariance;
- update `99_TestHarness.gs` if it contains the divergent checkbox contract.

Test positive and negative cases. Genuine corruption and unsafe states must still fail.

## 8. Full verification

Run and record:

- all Node suites;
- the new real-runtime diagnostic suite;
- prior Phase 8B Setup Ledger suite;
- F016 Calendar authority-loss suite;
- Apps Script static validator;
- remote publication consistency;
- v2.8.7 Phase 8B and Phase 8C builders/verifiers;
- source-to-package parity;
- independent rebuild byte parity;
- package checksum inventory;
- Phase 8B copy allow-list;
- transfer canonical checksums;
- company-PC differential patch manifest verification;
- provenance and lineage checks;
- secret, credential, local-path, real-ID/URL, and Phase 8C exclusion scans;
- fresh detached HTTPS clone verification of the final fixed transfer ref.

The fresh-clone verification must verify the patch manifest against the actual old and new immutable payloads.

Real Google Workspace retest remains `NOT_EXECUTED` by Codex.

## 9. Documentation and PR

Update the root canonical documents, README, decisions, protocols/specifications, traceability, manual acceptance, recovery guidance, visualizations, changelog, release/transfer operator documentation, and safe incident evidence.

Correct the active gate before implementation completion. Do not leave v2.8.6 `READY` as the current operational status while the High diagnostic blocker is unresolved.

Update PR #8 body to v2.8.7 and the two real Workspace findings. Keep it Draft and unmerged.

## 10. Git and publication

Use normal commits and normal non-force push only.

Preserve the source/release/transfer boundaries and report exact SHAs for Source A7, Release B7, transfer generation, fixed transfer ref, optional evidence-only closure, and final remote HEAD.

Do not merge PR #8.

## 11. Prohibited actions

Do not perform:

- reset, clean, rebase, amend, force push, unrelated revert;
- historical package overwrite;
- real Google Workspace operations;
- OAuth consent;
- Apps Script import;
- Setup execution;
- Gmail or Calendar calls;
- deployment or `clasp push`;
- Automation or trigger enablement;
- Provider configuration;
- use or storage of real data, IDs, URLs, screenshots, credentials, or OAuth details;
- manual repair of the user's Sandbox.

## 12. Completion status and final report

The maximum status is `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`, and only if all local, remote, package, transfer, patch-manifest, and fresh-clone checks pass with no unresolved Critical/High or transfer-safety Medium finding.

Do not declare Phase 8B PASS, Phase 8C GO, production ready, or pilot ready.

The final report must include:

- confirmation that implementation—not merely planning—was completed;
- root cause and correction for all four findings;
- exact changed source files;
- exact `会社PCで差し替えるファイル` list from the verified patch manifest;
- old/new SHA-256 for each changed Apps Script payload file;
- whether `appsscript.json` changed;
- Source A7, Release B7, transfer and fixed-ref SHAs;
- final remote HEAD;
- exact test results and hashes;
- PR #8 URL, Draft state, and updated body;
- real Workspace retest `NOT_EXECUTED`;
- unresolved issues and Review Focus.
