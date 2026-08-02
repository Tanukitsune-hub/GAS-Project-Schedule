# Work ID: 0005
# Instruction 0017 - PR #11 lineage/scope audit before runtime continuation

Date: 2026-08-03 JST
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
Primary working branch: `codex/0008-remote-gas-development-bootstrap`
Primary Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/11`
Pre-handoff inspected head: `4c3e42493649d3b0c8898e5a8a25182846fec014`
Parent PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/10`
Parent branch: `codex/0006-local-clasp-validation-gate`

This handoff was added after the inspected application/evidence head. Treat the branch HEAD that contains this file as the latest branch state, but treat `4c3e42493649d3b0c8898e5a8a25182846fec014` as the last inspected application/runtime-evidence boundary before this handoff-only commit.

Use `Instruction 0017` for this work. Do not reuse Instruction 0012, 0013, 0014, 0015, or 0016. Instruction 0012 was the separate Luna custom-agent PR. Instruction 0016 appears to have been used by the separate Luna/micro-agent work on `main` / PR #13. This instruction is not a runtime-retry instruction.

## Mandatory opening and closing line for the Codex final report

Begin and end the final report with:

```text
Work ID: 0005 / Instruction 0017
```

## 1. GitHub state verified by ChatGPT before this handoff

1. PR #11 is Open / Draft / unmerged / mergeable. Its inspected head was `4c3e42493649d3b0c8898e5a8a25182846fec014`.
2. The final Instruction 0015 CI reported by Codex was verified at the GitHub job level: push run `30771912428` / job `91560389525` and pull-request run `30771913841` / job `91560393631` completed successfully, with all listed setup, checkout, Node, Corepack, locked install, non-Google verification, post, and completion steps successful.
3. The inspected `CURRENT_STATUS.md` states `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` only as a readiness boundary and keeps functional acceptance as `ATTEMPTED_FAILED_CLOSED` with `RUNTIME_QUICK_DIAGNOSTIC_FAILED_CLOSED` / `BLOCKED_BY_AUTH` / `RUNTIME_AUTHORIZATION_REJECTED`. Company handoff remains `NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW`; T11 remains `T11_SUSPENDED`; transfer path remains `NO_ACTIVE_COMPANY_TRANSFER`.
4. The Instruction 0015 report says `.codex` authoritative definitions were not present on the active branch and that PR #12 was not incorporated into PR #11.
5. However, ChatGPT's compare from the Instruction 0015 handoff commit `d7a68bf667a156b91e62093b4e9065b84178a591` to inspected head `4c3e42493649d3b0c8898e5a8a25182846fec014` showed `.codex/config.toml`, `.codex/agents/luna-explorer.toml`, `.codex/agents/luna-executor.toml`, `.codex/agents/luna-auditor.toml`, and root `AGENTS.md` changes present in the PR #11 branch delta.
6. ChatGPT also observed separate `main` history for Luna agent work, including PR #12 and PR #13 / `codex/instruction-0016-micro-luna-agents`. Do not assume these are authorized PR #11 changes without evidence.
7. Therefore, before any further Google/runtime work, reconcile whether PR #11 has unintentionally absorbed `.codex`/Luna-agent scope or whether the report/branch state has another explanation.

## 2. Objective

Perform a no-Google, no-runtime lineage and scope audit of PR #11 after Instruction 0015.

The outcome must be one of:

- `PR11_SCOPE_CLEAN_READY_FOR_AUTH_CONTINUATION`, if no unauthorized `.codex`/agent or main-branch scope is present after full evidence review;
- `PR11_SCOPE_REMEDIATED_READY_FOR_AUTH_CONTINUATION`, if unauthorized `.codex`/agent/main-branch scope is removed from PR #11 by a safe additive commit and validation passes;
- `PR11_SCOPE_RETAINED_WITH_EXPLICIT_EVIDENCE`, if the `.codex`/agent files are intentionally present on PR #11 with clear, source-backed authorization and all status/PR evidence is corrected accordingly;
- `PR11_SCOPE_BLOCKED_NEEDS_USER_DECISION`, only if safe remediation cannot determine whether `.codex`/agent scope should stay or be removed without risking unrelated history or branch integrity.

This instruction does not authorize another `runQuickDiagnostic` call. It does not authorize OAuth refresh, new deployments, Apps Script API calls, clasp Google operations, company operations, or any Workspace mutation.

## 3. Required reading before any operation

Read, in full or enough to verify current rules, scope, and state:

1. root `README.md` and root `AGENTS.md`;
2. `.codex/config.toml` and `.codex/agents/*.toml`, if present on PR #11;
3. `implementation/GoogleSpreadsheet/AGENTS.md`;
4. `CONTRIBUTING.md`, if present;
5. `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`, if present;
6. `CURRENT_STATUS.md`, `DECISIONS.md`, `MASTER_PLAN.md`, `PROJECT_CONTEXT.md`;
7. `docs/local-clasp-setup.md`, `docs/development-validation-gates.md`, `docs/company-handoff.md`, `docs/TASK_AUTHORITY_PROTOCOL.md`, and `docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`;
8. instructions `0006` through `0017` available on PR #11 and all associated audits;
9. PR #8 through #13 metadata, comments, refs, current commits, changed files, workflow runs, jobs, steps, and relevant logs;
10. merge-base and ancestry evidence among `main`, PR #11 head, PR #12 merge commit `1956c6943b5d475a33778e7d992a47ac7f31b0c2`, PR #13 merge commit `63e5c124d8c00ae76dd8b9e95e5606ccb9e2cb06`, and Instruction 0015 head `4c3e42493649d3b0c8898e5a8a25182846fec014`;
11. `implementation/GoogleSpreadsheet/package.json`, lockfile, local validation tooling, runtime bootstrap tooling, and related tests.

If a listed file is absent on the active branch, record `ABSENT` and continue only if repository rules allow it.

## 4. Repository and branch procedure

1. Fetch normally from origin.
2. Checkout `codex/0008-remote-gas-development-bootstrap`.
3. Fast-forward to the latest remote branch state.
4. Confirm repository full name, remote URL, current branch, HEAD SHA, PR #11 state, and worktree cleanliness.
5. Do not rebase, squash, amend, reset, clean, force-push, or rewrite preserved history.
6. If staged, unstaged, or untracked non-ignored files exist before work starts, stop with `LOCAL_WORKTREE_UNCLEAN_BEFORE_0017` and report only safe non-secret path names.
7. Keep PR #8, #9, #10, and #11 Open / Draft / unmerged. Do not alter PR #12 or PR #13.

## 5. Required lineage and scope checks

Perform and record closed-safe evidence for all of the following:

1. PR #11 current head, base, merge base, and changed-file list.
2. Whether `.codex/config.toml` and `.codex/agents/*.toml` are present on PR #11.
3. If present, which commit introduced each `.codex` file to PR #11 and whether that commit is part of PR #12, PR #13, an explicit PR #11 instruction, or another source.
4. Whether PR #11 contains merge commits or normal commits that import `main`, PR #12, or PR #13 scope after Instruction 0015 handoff.
5. Whether the Instruction 0015 final report statement about `.codex` absence and no PR #12 incorporation is accurate, incomplete, or contradicted by repository evidence.
6. Whether the root `AGENTS.md` on PR #11 now includes Luna/subagent governance and whether that changed Codex delegation authority for later work.
7. Whether the `.codex`/agent changes affect application code, tests, CI, runtime tooling, or only Codex governance.
8. Whether keeping them in PR #11 would broaden the review scope beyond the stacked runtime/bootstrap PR and make PR #11 harder to review safely.
9. Whether removing them from PR #11 can be done by a small additive commit without touching application/runtime evidence.
10. Whether the PR body, current status docs, or audits need correction to disclose the scope state.

Do not publish local paths, account names, raw logs containing secrets, Script IDs, deployment IDs, Workspace URLs, OAuth material, credentials, company data, personal data, or real data.

## 6. Remediation rule

If `.codex`/Luna-agent files or PR #12/#13 scope are present in PR #11 without explicit authorization in the PR #11 instruction chain:

1. Remove them from PR #11 through a normal additive commit, not reset/rebase/force-push.
2. Preserve all application/runtime evidence and instruction history.
3. Update status docs/audit notes only as needed to say the unauthorized scope was removed.
4. Do not alter main, PR #12, PR #13, or their merged history.

If `.codex`/Luna-agent files are intentionally and explicitly authorized for PR #11:

1. Do not remove them.
2. Update PR #11 evidence/status so the branch-scope statement is accurate.
3. Clearly explain how this does not broaden application/runtime acceptance and how future delegation authority should be interpreted.

If the evidence is ambiguous and safe remediation cannot decide, stop without changing `.codex` and report `PR11_SCOPE_BLOCKED_NEEDS_USER_DECISION` with exactly what decision is needed.

## 7. Validation

Run from `implementation/GoogleSpreadsheet` unless repository scripts indicate a different safe root:

```bash
pnpm install --frozen-lockfile
pnpm run verify:local
node tests/canonical_document_consistency_test.js
node tests/remote_gas_development_bootstrap_test.js
node tools/local_clasp_dev.js self-test
```

Also run any targeted no-Google checks needed for TOML/agent syntax if `.codex` remains present.

No Google/clasp remote operation is authorized. CI must remain non-Google only.

## 8. Evidence and publication

Publish a safe tracked evidence file, preferably:

```text
audits/2026-08-03/GoogleWorkspace_0017_PR11_Lineage_Scope_Audit_Evidence_2026-08-03.md
```

The evidence must include:

- repository/branch/head and PR state;
- ancestry/merge-base findings;
- `.codex`/AGENTS presence and origin;
- whether the Instruction 0015 report was accurate or contradicted;
- remediation performed or reason no remediation was needed;
- validation commands/results;
- CI run IDs, job IDs, and step conclusions after push;
- remaining runtime/company boundaries.

Commit and push normally to `codex/0008-remote-gas-development-bootstrap`, update PR #11, and inspect latest push and pull-request GitHub Actions. Confirm run IDs, job IDs, step conclusions, and relevant logs. All required jobs and steps must succeed; none may fail, be cancelled, skipped, or remain unexecuted.

## 9. Boundaries

This instruction authorizes no runtime diagnostic attempt, no OAuth refresh, no new deployment, no Apps Script API call, no clasp push/pull/run/open, no company-PC/company-Workspace work, no production work, and no real-data operation.

Do not declare Phase 8B overall PASS, Phase 8C GO, production-ready, pilot-ready, company-handoff-ready, company transfer, or company Workspace authorization.

Final report must begin and end with:

```text
Work ID: 0005 / Instruction 0017
```