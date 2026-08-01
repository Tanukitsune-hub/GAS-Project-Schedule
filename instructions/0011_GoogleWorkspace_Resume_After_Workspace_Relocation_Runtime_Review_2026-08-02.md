# Work ID: 0001
# Instruction 0011 - Resume after local workspace relocation and runtime-readiness review

Date: 2026-08-02 JST
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
Primary working branch: `codex/0008-remote-gas-development-bootstrap`
Primary Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/11`
Pre-handoff application/evidence head inspected by ChatGPT: `03d78655a30a576cfb641bba289bd439277d76f9`
Parent branch for PR #11: `codex/0006-local-clasp-validation-gate`
Parent PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/10`
Default branch inspected by ChatGPT: `main` at `6723f9885e365c75a95254e35eb636573853750f`
Related configuration Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/12`
Related archive branch: `codex/archive-pre-relocation-r4-local-state-20260802`
Archive commit reported in PR #11 and resolved by ChatGPT: `ae075a3b520c5740d5506ffc5ce7e3c1e6d2a3e7`

This handoff was added after the inspected application/evidence head. Treat the branch HEAD that contains this file as the latest branch state, but treat `03d78655a30a576cfb641bba289bd439277d76f9` as the last inspected application/evidence boundary before this handoff-only commit.

The local working folder was relocated by the operator. Do not record or commit any absolute local path. Verify the local repository by remote URL, branch, HEAD, working-tree status, ignored-file boundaries, and GitHub refs rather than by path text.

## Mandatory opening and closing line for the Codex final report

Begin and end the final report with:

```text
Work ID: 0001 / Instruction 0011
```

## 1. Current GitHub state verified by ChatGPT

1. Repository `Tanukitsune-hub/GAS-Project-Schedule` exists, default branch is `main`, and latest main commit found by ChatGPT was `6723f9885e365c75a95254e35eb636573853750f`.
2. PR #11 is Open, Draft, unmerged, mergeable, base `codex/0006-local-clasp-validation-gate`, head `codex/0008-remote-gas-development-bootstrap`, and pre-handoff inspected head `03d78655a30a576cfb641bba289bd439277d76f9`.
3. PR #11 records Instruction 0010 evidence: new blank personal/non-company/synthetic bound-sheet Sandbox, blank-target preflight PASS, canonical independent pull-back 23/23 PASS, canonical payload SHA-256 `ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1`, and operator-reported first-time Setup `COMPLETE`.
4. PR #11 body reports development status `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` and company status `NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW` at `03d78655a30a576cfb641bba289bd439277d76f9`.
5. GitHub Actions for the pre-handoff inspected head included pull-request run `30706774163` and push run `30706772221`; both had the `Local static and regression validation` job and every listed step completed successfully.
6. PR #11 changed 43 files relative to PR #10 and includes the Instruction 0009/0010 tracked instructions and 0007/0008/0009/0010 audit evidence files.
7. PR #8, #9, #10, and #11 remain Open / Draft / unmerged. Keep them that way unless a later explicit user instruction says otherwise.
8. PR #12 is Open / Draft / unmerged and adds project-scoped Luna Max subagent configuration only: `.codex/config.toml`, `.codex/agents/luna-explorer.toml`, `.codex/agents/luna-executor.toml`, `.codex/agents/luna-auditor.toml`, and root `AGENTS.md`. It is based on `main`, not on PR #11. ChatGPT found no workflow runs or commit statuses for PR #12 head `581527b1a8ecec3ba8684f2455292ac8bde6c4bf`.
9. PR #11 reports pre-relocation local R4 historical artifact preservation on archive branch `codex/archive-pre-relocation-r4-local-state-20260802` at `ae075a3b520c5740d5506ffc5ce7e3c1e6d2a3e7`. Treat it as archive-only, not a merge target.

## 2. First task after relocation: repository and branch reattachment

1. In the relocated local workspace, confirm that the opened folder is the Git repository for `https://github.com/Tanukitsune-hub/GAS-Project-Schedule.git`.
2. Fetch normally from origin.
3. Checkout `codex/0008-remote-gas-development-bootstrap`.
4. Fast-forward to the latest remote branch state if possible. Do not rebase, amend, reset, clean, squash, force-push, or rewrite preserved 0007/0008/0009/0010 history.
5. Report only closed-safe local facts: repository full name, current branch, HEAD SHA, whether the worktree is clean, whether staged/unstaged/untracked files exist, and whether ignored local clasp/OAuth/target files are present. Do not print absolute local paths, Script IDs, account details, OAuth material, Workspace URLs, raw clasp output, or credential values.
6. If the local checkout contains uncommitted or untracked non-ignored files that were not created by this instruction, stop and report `LOCAL_RELOCATION_WORKTREE_UNCLEAN` with path names only if safe and non-secret. Do not delete or overwrite them.

## 3. Required reading before any edits or Google operations

Read, in full or enough to verify the relevant current rules and state:

1. root `README.md` and root `AGENTS.md`;
2. `implementation/GoogleSpreadsheet/AGENTS.md`;
3. `CONTRIBUTING.md` if present;
4. `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md` if present;
5. `CURRENT_STATUS.md`, `DECISIONS.md`, `MASTER_PLAN.md`, `PROJECT_CONTEXT.md`;
6. `docs/local-clasp-setup.md`, `docs/development-validation-gates.md`, `docs/company-handoff.md`, `docs/TASK_AUTHORITY_PROTOCOL.md`, and `docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`;
7. instructions `0006` through `0011` and all associated audits;
8. PR #8 through #12 metadata, comments, branch refs, current commits, changed files, workflow runs, jobs, steps, and relevant logs;
9. `implementation/GoogleSpreadsheet/package.json`, lockfile, `.clasp` examples, ignore rules, local clasp tooling, local validation tooling, and all related tests.

If a file listed above is absent, record `ABSENT` and continue only if repository rules allow it.

## 4. Important status-consistency review before runtime work

Before any runtime or Google operation, reconcile the following apparent inconsistency observed by ChatGPT:

- PR #11 body and the Instruction 0010 audit evidence support `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` after canonical pull-back parity and first-time Setup evidence.
- At the inspected head, root `README.md` and `CURRENT_STATUS.md` still appeared to carry the older `NO_GO_LOCAL_CLASP_VALIDATION` / `NO_GO_COMPANY_HANDOFF_LOCAL_VALIDATION_FAILURE` contract in their current status sections.

Required action:

1. Inspect all canonical status-bearing files, tests, PR body text, and evidence files on the actual latest branch HEAD.
2. Determine whether this is a real repository inconsistency, a stale section that must be updated, or a deliberate historical section that is correctly labelled.
3. If it is a real inconsistency, make the smallest tracked documentation/test update so current top-level status is internally consistent with evidence. Do not overstate the runtime boundary.
4. If it is not a real inconsistency, add a brief evidence-backed note to the final report explaining why no change was needed.
5. Do not claim Phase 8B overall PASS, Phase 8C GO, production-ready, pilot-ready, company-handoff-ready, or company transfer authorization.

## 5. Scope authorized by this handoff

Authorized now:

1. Relocated local workspace reattachment and safety verification.
2. Repository status reconciliation after Instruction 0010.
3. Non-Google local verification of the latest branch.
4. If and only if current status truly supports it after reconciliation, continue the next runtime-readiness lane that was still `NOT_EXECUTED` in Instruction 0010:
   - personal standard Google Cloud project linkage for the new synthetic target;
   - Apps Script API enablement in that standard Cloud project;
   - OAuth Testing/Desktop-client runtime profile configuration;
   - dev-only `executionApi.access = MYSELF` runtime overlay staging;
   - runtime overlay push/pull parity;
   - MYSELF-only API executable deployment;
   - exactly one guarded standalone read-only `runQuickDiagnostic` invocation through local clasp tooling;
   - bounded closed evidence publication.

Not authorized:

1. Company-PC operations, company Workspace operations, production data, production deployment, or company handoff.
2. Deep Diagnostic, Dashboard refresh, Task edits, Gmail import, Calendar reconciliation, Automation enablement, Migration, test harness, external AI/provider calls, or real company operations.
3. Any Google operation before the repository status-consistency review, local non-Google verification, target guard, and explicit human-only secret/UI prerequisite steps pass.
4. Any raw output, identifier, URL, account detail, local path, token, secret, or Workspace content in tracked files or chat reports.

## 6. Human-only UI and secret handling rules

If runtime prerequisites require the operator to use the browser, Google Cloud Console, Apps Script settings, OAuth consent screen, desktop OAuth client, Script ID, deployment UI, or local secret entry:

1. Ask only for the minimum human action needed.
2. Never ask the operator to paste an ID, URL, token, email, screenshot, raw output, client secret, or account detail into chat.
3. Use local non-echoing prompts for any local-only ID/secret entry.
4. Record only closed-safe fields such as `PRESENT`, `ABSENT`, `CONFIRMED_LOCAL_ONLY`, `PASS`, `FAIL`, `NOT_EXECUTED`, file counts, approved hashes, and non-sensitive reason codes.
5. Clear temporary secret variables after use.
6. Re-run tracked secret/local-path scans after any operation that could create evidence.

## 7. Runtime-readiness lane stop conditions

Stop without performing further Google/runtime operations if any of these occur:

1. branch/ref/worktree state is ambiguous after relocation;
2. status documents and evidence cannot be reconciled safely;
3. local non-Google validation fails;
4. required GitHub Actions current-head validation fails or cannot be confirmed;
5. target guard fails, target attestation fails, or target binding is ambiguous;
6. runtime overlay parity is not exact;
7. API executable prerequisites are missing or ambiguous;
8. guarded read-only `runQuickDiagnostic` returns an unbounded, side-effecting, malformed, or unsafe result;
9. any operation would require company account/data/Workspace, production deployment, broader Google permissions, or forbidden secrets in tracked files.

When stopping, commit only safe documentation/evidence if appropriate, update PR #11, and report the stop code and exact unexecuted items.

## 8. Delegation plan

Use repository `.codex` agent definitions only if they are present and authoritative in the active local environment. Do not treat PR #12 definitions as authoritative for PR #11 unless they have been explicitly checked out or otherwise made available by the operator in the current Codex session.

Recommended delegation if available and materially beneficial:

1. `luna_explorer` read-only: inspect status-bearing files, Instruction 0010 evidence, local clasp/runtime tooling, PR refs, and relocation-sensitive ignored-file handling. Output paths/symbols/evidence only.
2. Main Codex: decide status, runtime boundary, Google-operation authorization, git/PR plan, human prompts, and final acceptance.
3. One bounded `luna_executor` only if a clear non-overlapping documentation/test/tooling fix is required. Do not delegate Google operations, secret handling, git decisions, push, PR update, release, migration, or status promotion.
4. `luna_auditor` read-only after changes and before final report: independently verify diff, status language, tests, secret/local-path exclusion, GitHub Actions evidence, and any runtime claims.

No overlapping write agents. Main Codex must independently verify all material subagent claims against repository files, commands, logs, SHAs, or GitHub evidence.

## 9. Required local validation

Run the relevant validation from `implementation/GoogleSpreadsheet/` unless repository scripts specify otherwise:

```bash
pnpm install --frozen-lockfile
pnpm run verify:local
```

Also run any narrower tests touched by this work, especially status/canonical-document consistency tests and local clasp/runtime bootstrap tests. Record exact commands and results.

Do not claim PASS for clasp, OAuth, Cloud, deployment, runtime, or Workspace behavior unless the corresponding operation actually executed under this instruction and produced safe evidence.

## 10. GitHub Actions and PR requirements

1. Commit safe tracked changes to `codex/0008-remote-gas-development-bootstrap`.
2. Push normally to update PR #11.
3. Keep PR #11 Open / Draft / unmerged.
4. Do not merge, close, or retarget PR #8, #9, #10, #11, or #12 unless a later explicit user instruction says so.
5. Do not merge PR #12 into PR #11 as part of this instruction. If PR #12 is relevant, report it separately as a configuration PR with no CI evidence found by ChatGPT at its inspected head.
6. After push, inspect GitHub Actions for the latest PR #11 head. Confirm workflow run IDs, jobs, steps, conclusions, and relevant logs. All required jobs/steps must complete successfully; none may fail, be cancelled, skipped, or remain unexecuted.
7. If CI fails, stop feature/runtime work, identify workflow/job/step/cause, and fix/rerun through a new safe commit if within scope.

## 11. Final report requirements

The final report must include:

1. `Work ID: 0001 / Instruction 0011` at start and end.
2. Repository, branch, latest HEAD SHA, PR #11 URL, and whether PR #11 remains Open/Draft/unmerged.
3. Whether relocation reattachment was safe, without local absolute paths.
4. Status-consistency conclusion, including any files changed or why none changed.
5. Runtime lane status: executed steps, PASS/FAIL/NOT_EXECUTED items, and any stop code.
6. Commands run and exact results.
7. GitHub Actions run IDs, job/step conclusions, and whether all required checks passed.
8. Changed files and commit SHAs.
9. Delegated work used, evidence received, and main-agent verification of material claims.
10. Remaining company-environment, OAuth/Cloud/API, Google Workspace, and real-data limitations.
11. Explicit statement that no forbidden secrets, local paths, Workspace IDs/URLs, account details, raw output, or company data were committed.
12. Cache/Input/Output usage if Codex reports such metrics.

# Work ID: 0001
