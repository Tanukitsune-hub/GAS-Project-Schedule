# 指示番号: 0004
# Google Workspace Personal Work OS v2.8.11
# T11 canonical transfer-boundary conflict remediation

- Date: 2026-07-31
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
- Working branch: `codex/r5-independent-reaudit-transfer-prep`
- Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/8`
- Current baseline / canonical-gate evidence: `2d4d3d36034d169335fe610cd55c656fd8eb1de1`
- Source A11.1: `aeca148415d70df625400e53d2281378adff60b4`
- Release B11: `952438907e1a09092a46127dc130b3403a911db4`
- Fixed Transfer T11: `a3b5a5d8d851bf2d15a2738c54dc6bb31e231d33`
- Local Evidence E11: `908476ac716d3a3b6bdf35cd814dede1f2b0e411`
- Historical fixed T10: `927d8567bce64461840cc6f72fbae0c1e636a8e6`
- Candidate: Code `2.8.11-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- Claimed current gate at baseline: `READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER`
- Safety status at task start: `NO_GO_T11_CANONICAL_TRANSFER_BOUNDARY_CONFLICT`
- Maximum status after successful remediation and verification: `READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER`

## 1. Mandatory execution rule

This is a canonical-document conflict remediation, validation-hardening, and evidence task. Do not stop after analysis or a proposed wording change.

Read the repository rules and this instruction in full, verify the latest remote state, inspect the active current-transfer assertions across the repository, remediate every genuinely active T10/T11 contradiction without rewriting historical evidence, strengthen validation so the same contradiction cannot pass again, run all required checks, create one additive remediation/evidence commit, normal push, and update Draft PR #8.

Your final report must begin with:

```text
指示番号: 0004
```

Do not execute any real Google Workspace action. Do not carry or paste T11 to the company PC during this task. Do not modify Apps Script executable source, `appsscript.json`, release packages, transfer envelopes, checksums, fixed T11, or historical artifacts. Do not rebuild A11.1/B11/T11/E11.

## 2. Confirmed blocking contradiction

At baseline `2d4d3d36034d169335fe610cd55c656fd8eb1de1`, root `README.md` contains contradictory active current-transfer instructions.

The top current contract states:

```text
Code: 2.8.11-prepilot
Gate: READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER
Fixed transfer: a3b5a5d8d851bf2d15a2738c54dc6bb31e231d33
Transfer path: implementation/GoogleSpreadsheet/transfer/v2.8.11-prepilot/
```

But the later active section headed `Company-PC transfer boundary` states that the only approved carriage source is fixed T10 at the v2.8.10 transfer path and describes the old `READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE` boundary.

This later text is not clearly labelled as historical and directly governs company-PC carriage. It conflicts with the top contract, the T11 governing transfer guide, `CURRENT_STATUS.md`, the final remote-publication evidence, and PR #8. A reasonable operator could therefore select the wrong transfer source or scope.

Treat this as a transfer-safety blocker. Until remediated and independently validated, do not rely on the baseline `READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER` claim for actual carriage.

## 3. Required repository reading

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
11. instructions `0001`, `0002`, `0003` and their resulting evidence;
12. baseline commit `2d4d3d36034d169335fe610cd55c656fd8eb1de1` and its changed-file boundary;
13. A11.1/B11/T11/E11 lineage and reports;
14. fixed-T11 governing files:
    - `implementation/GoogleSpreadsheet/transfer/v2.8.11-prepilot/README_ja.md`;
    - `COMPANY_PC_PATCH_MANIFEST.json`;
    - `COMPANY_PC_PATCH_MANIFEST_ja.md`;
    - `TRANSFER_MANIFEST.md`;
    - `TRANSFER_CHECKSUMS.sha256`;
    - `RESULTS_TEMPLATE_ja.md`;
    - `STOP_AND_ROLLBACK_CHECKLIST_ja.md`;
15. current canonical-document consistency and remote-publication tests;
16. Draft PR #8 body, state, comments, and checks;
17. this instruction in full.

Confirm remote, branch, HEAD, working tree, staged/unstaged/untracked state, and normal-fetch the latest branch. Do not reset, clean, amend, rebase, force-push, or rewrite history.

## 4. Required conflict scan and classification

Scan current canonical and operator-facing documents for active assertions involving:

- current Code version;
- current gate;
- current fixed transfer;
- current transfer path;
- approved company-PC carriage source;
- authorized real-Workspace action scope;
- T1-01 status and next authorized action.

At minimum inspect:

- `README.md`;
- `CURRENT_STATUS.md`;
- `MASTER_PLAN.md`;
- `PROJECT_CONTEXT.md`;
- `DECISIONS.md`;
- current implementation specs/plans/guides;
- Tranche 1 runbook/results template;
- T11 transfer guide and manifests;
- current visualizations and metadata;
- PR #8 body.

Classify every T10/T11 reference as one of:

```text
ACTIVE_CURRENT_ASSERTION
CLEARLY_LABELLED_HISTORICAL_EVIDENCE
AMBIGUOUS_OPERATOR_INSTRUCTION
```

Do not mechanically replace every T10 reference. T10 must remain immutable historical evidence and the old-hash baseline for the T10-to-B11 patch manifest. Correct only active or ambiguous current instructions.

## 5. Required remediation

### 5.1 Root README

Correct the active `Company-PC transfer boundary` section so it unambiguously states:

- historical T10 remains immutable and is the old-byte/hash baseline only;
- the current fixed carriage source is T11 `a3b5a5d8d851bf2d15a2738c54dc6bb31e231d33`;
- the governing path is `implementation/GoogleSpreadsheet/transfer/v2.8.11-prepilot/`;
- exactly the five manifest-listed files may be replaced after old/new SHA-256 confirmation;
- `appsscript.json` and all unlisted files remain unchanged;
- the completed Sandbox must not run Setup, S90/S99, Dashboard refresh, Gmail, Calendar reconciliation, property/trigger work, Automation, tests, migration, or repair;
- only one separately approved read-only T1-01 Quick Diagnostic bounded-summary re-observation is authorized after hash-verified carriage;
- T1-01 remains `REVIEW_REQUIRED`; T1-02 and later actions remain unauthorized.

The section must not imply that the whole repository, release tree, Phase 8C package, or historical transfer envelope may be copied to the company PC.

### 5.2 Other documents

Correct any other active or ambiguous current assertions found by the scan. Preserve historical narratives, old incident evidence, old hashes, and fixed refs when clearly marked historical.

If two repository authorities genuinely disagree about the intended T11 boundary, do not choose silently. Record the conflict and retain `NO_GO_T11_CANONICAL_TRANSFER_BOUNDARY_CONFLICT`.

## 6. Required audit evidence

Create an additive audit record under:

```text
audits/2026-07-31/
```

Use an exact filename such as:

```text
GoogleWorkspace_v2_8_11_T11_Canonical_Transfer_Boundary_Conflict_Remediation_2026-07-31.md
```

Include:

- instruction number `0004`;
- baseline and resulting commit relations;
- the exact contradiction in closed form;
- classification and affected active documents;
- files changed;
- confirmation that A11.1/B11/T11/E11, release/transfer bytes, checksums, and executable source were unchanged;
- validation results;
- resulting gate;
- explicit statement that no real Workspace operation or company-PC carriage occurred;
- continued `NOT_EXECUTED` status for the T11 T1-01 re-observation.

Do not include IDs, URLs other than public GitHub references, credentials, local paths, real Workspace details, screenshots, or business data.

## 7. Validation hardening

The existing canonical-document consistency check validated the marked current-transfer block but did not catch a contradictory active carriage instruction later in `README.md`.

Strengthen tests narrowly so that future current-gate publication fails when an active current operator section contradicts the marked contract. At minimum, add negative fixtures or assertions covering:

1. top current-transfer block = T11 while active company-PC boundary says T10;
2. top current gate = `READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER` while active boundary states the old gate;
3. current transfer path points to v2.8.11 while active operator text points to v2.8.10;
4. historical T10 references clearly labelled historical remain allowed;
5. T10 old-hash baseline inside the T11 patch manifest remains allowed;
6. stale T8/T9 rejection remains intact.

Do not weaken current negative tests or make a broad substring ban on T10.

Test changes are allowed only for this validation hardening. Apps Script source and release/transfer tooling are out of scope.

## 8. Status rule

During review, treat the baseline as:

```text
NO_GO_T11_CANONICAL_TRANSFER_BOUNDARY_CONFLICT
```

After all active contradictions are corrected, all validations pass, GitHub resolves the new commit, and the fixed T11 remains byte-identical, the maximum status may return to:

```text
READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER
```

This status still authorizes only hash-verified five-file carriage and one read-only T1-01 summary re-observation. It does not declare T1-01 PASS, T1-02 authorization, Phase 8B overall PASS, Phase 8C GO, production ready, or pilot ready.

## 9. Required validation

Run at least:

- all Node test suites;
- bounded-summary regression suite;
- Apps Script validator;
- strengthened canonical-document consistency suite and negative fixtures;
- remote-publication consistency relevant to A11.1/B11/T11/E11;
- main and Phase 8C package verifiers;
- T11 patch-manifest verifier;
- transfer checksum and allow-list verification;
- secret / credential / local-path / real-ID scan;
- changed-file boundary check;
- fixed-T11 resolution and byte-immutability check;
- staged diff check.

No package or transfer rebuild is required. If any executable/release/transfer/checksum byte changes, stop with `NO_GO_T11_BOUNDARY_REMEDIATION_SCOPE_BREACH`.

GitHub Actions/CI may remain `NOT_EXECUTED` if no workflow targets this scope; report this precisely.

## 10. Git and PR procedure

1. Use a clean worktree based on the latest remote branch.
2. Preserve all current and historical commits.
3. Create one additive documentation/test/evidence commit after validation passes.
4. Normal push only; no force push.
5. Update Draft PR #8 body with:
   - instruction number `0004`;
   - the detected canonical transfer-boundary contradiction;
   - the corrected current T11 boundary;
   - validation hardening and negative fixtures;
   - confirmation that T11/executable/release/transfer/checksum bytes are unchanged;
   - confirmation that no company-PC carriage or Workspace action was executed;
   - next action remains the separately approved five-file T11 carriage and one T1-01 re-observation.
6. Keep PR #8 open, Draft, and unmerged.

## 11. Required final report

The final report must begin with `指示番号: 0004` and include:

1. highest status;
2. remediation commit SHA and parent;
3. exact files changed;
4. all active contradictions found and their disposition;
5. validation commands and exact results;
6. fixed T11 and byte-immutability confirmation;
7. PR #8 state and head;
8. unresolved matters and `NOT_EXECUTED` items;
9. the exact next operator boundary;
10. Review Focus.

Do not report completion unless the commit is normally pushed and resolvable from GitHub.
