# Work ID: 0004
# Instruction 0015 - runtime authorization root-cause and guarded diagnostic

Date: 2026-08-03 JST
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
Primary working branch: `codex/0008-remote-gas-development-bootstrap`
Primary Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/11`
Pre-handoff inspected head: `65b0d9bd2de90fc7d14235bc6322923a4bd0c9f8`
Parent PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/10`
Parent branch: `codex/0006-local-clasp-validation-gate`

This handoff was added after the inspected application/evidence head. Treat the branch HEAD that contains this file as the latest branch state, but treat `65b0d9bd2de90fc7d14235bc6322923a4bd0c9f8` as the last inspected application/runtime-evidence boundary before this handoff-only commit.

Use `Instruction 0015` for this work. Do not reuse Instruction 0012, 0013, or 0014. Instruction 0012 was the separate Luna custom-agent PR. Instructions 0013 and 0014 each consumed their own single runtime attempts and are closed.

## Mandatory opening and closing line for the Codex final report

Begin and end the final report with:

```text
Work ID: 0004 / Instruction 0015
```

## 1. GitHub state verified by ChatGPT before this handoff

1. PR #11 is Open / Draft / unmerged / mergeable. Its inspected head was `65b0d9bd2de90fc7d14235bc6322923a4bd0c9f8`.
2. The inspected Instruction 0014 delta from `a784977d8f66adee343219f9c519a30129b47e79` to `65b0d9bd2de90fc7d14235bc6322923a4bd0c9f8` consists of 2 commits and 12 changed files.
3. Instruction 0014 evidence reports `RUNTIME_QUICK_DIAGNOSTIC_FAILED_CLOSED`, functional runtime acceptance `ATTEMPTED_FAILED_CLOSED`, review state `REVIEW_REQUIRED`, closed category `BLOCKED_BY_AUTH`, safe subtype `RUNTIME_AUTHORIZATION_REJECTED`, no bounded diagnostic body, exactly 1 Instruction 0014 diagnostic call, and no further Instruction 0014 retry.
4. Instruction 0014 identified and remediated the Instruction 0013 execution-context binding bug: clasp 3.3.0 used the active `.clasp.json` project configuration as the `scripts.run` path value, while `--nondev` only set `devMode=false` and did not select the separately stored deployment binding.
5. Instruction 0014 guard evidence says staged runtime payload, independent HEAD pull-back, and immutable-version pull-back all contained one top-level callable `runQuickDiagnostic` wrapper; `allowedRuntimeFunction`, target configuration, command construction, and parser expectation all matched `runQuickDiagnostic` exactly.
6. Instruction 0014 created one fresh MYSELF-only immutable version and deployment, proved exact version-number pull-back parity and wrapper presence, proved deployment/version lineage, and used a deployment-bound execution context.
7. Instruction 0014 then invoked only `runQuickDiagnostic` once, with `--nondev`, against the deployment-bound API-executable context. It returned no bounded diagnostic body and closed as `BLOCKED_BY_AUTH` / `RUNTIME_AUTHORIZATION_REJECTED`.
8. Current status documents at inspected head keep `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` only as a readiness boundary. Phase 8B overall PASS, Phase 8C GO, production readiness, pilot readiness, company-handoff readiness, and company transfer are not established.
9. Final Instruction 0014 CI succeeded for push run `30769529752` / job `91554095395` and pull-request run `30769531521` / job `91554100041`; every listed setup, checkout, Node, Corepack, locked install, non-Google verification, post, and completion step succeeded.
10. The tracked evidence contains no local absolute path, Script ID, deployment ID, Workspace URL, account detail, OAuth material, credential, raw clasp output, company data, personal data, or real data.

## 2. Objective

Resolve the remaining `BLOCKED_BY_AUTH` / `RUNTIME_AUTHORIZATION_REJECTED` blocker without guessing and without repeated runtime calls.

The outcome must be one of:

- `RUNTIME_AUTHORIZATION_ROOT_CAUSE_IDENTIFIED_NO_DIAGNOSTIC`, if the authorization root cause is identified but no safe reauthorization/proof is completed;
- `RUNTIME_AUTHORIZATION_GUARD_REMEDIATED_READY_FOR_ONE_DIAGNOSTIC`, if tooling/docs/tests and authorization preflight are corrected but no new diagnostic call is authorized or performed;
- `RUNTIME_QUICK_DIAGNOSTIC_BOUNDED_RESULT_OBTAINED`, only if one newly authorized Instruction 0015 diagnostic call returns a bounded diagnostic body;
- `RUNTIME_AUTHORIZATION_FAILED_CLOSED`, if the single newly authorized Instruction 0015 call is made but still returns no bounded diagnostic body due to authorization or another closed runtime category.

This instruction authorizes investigation, closed-safe authorization guard hardening, local-only reauthorization/remediation of the named personal synthetic runtime profile if required, and if and only if all preconditions pass, exactly one further `runQuickDiagnostic` runtime attempt. It does not authorize repeated calls.

## 3. Required reading before any operation

Read, in full or enough to verify current rules, scope, and state:

1. root `README.md` and root `AGENTS.md`;
2. `implementation/GoogleSpreadsheet/AGENTS.md`;
3. `CONTRIBUTING.md`, if present;
4. `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`, if present;
5. `CURRENT_STATUS.md`, `DECISIONS.md`, `MASTER_PLAN.md`, `PROJECT_CONTEXT.md`;
6. `docs/local-clasp-setup.md`, `docs/development-validation-gates.md`, `docs/company-handoff.md`, `docs/TASK_AUTHORITY_PROTOCOL.md`, and `docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`;
7. instructions `0006` through `0015` and all associated audits;
8. PR #8 through #12 metadata, comments, refs, current commits, changed files, workflow runs, jobs, steps, and relevant logs;
9. `implementation/GoogleSpreadsheet/package.json`, lockfile, `.clasp` examples, ignore rules, local clasp tooling, local validation tooling, runtime bootstrap tooling, and all related tests;
10. project-local `@google/clasp` 3.3.0 implementation/help relevant to OAuth login, named profiles, `--user`, `--project`, `--use-project-scopes`, `--include-clasp-scopes`, `run-function`, `--nondev`, deployment selection, and token storage;
11. official primary Apps Script API / Google OAuth documentation relevant to `scripts.run`, API executable deployment permissions, required OAuth scopes, OAuth consent Testing mode, test-user restrictions, authorization grants, and execution identity.

If a listed file is absent on the active branch, record `ABSENT` and continue only if repository rules allow it.

## 4. Repository and branch procedure

1. Fetch normally from origin.
2. Checkout `codex/0008-remote-gas-development-bootstrap`.
3. Fast-forward to the latest remote branch state.
4. Confirm repository full name, remote URL, current branch, HEAD SHA, PR #11 state, and worktree cleanliness.
5. Do not rebase, squash, amend, reset, clean, force-push, or rewrite preserved history.
6. If staged, unstaged, or untracked non-ignored files exist before work starts, stop with `LOCAL_WORKTREE_UNCLEAN_BEFORE_0015` and report only safe non-secret path names.
7. Keep PR #8, #9, #10, and #11 Open / Draft / unmerged. PR #12 is already merged to `main`; do not alter or merge it into this branch.

## 5. Delegation and `.codex` boundary

Use repository `.codex` agent definitions only if they are present and authoritative in the active PR #11 branch after checkout. Do not assume PR #12 definitions exist on this branch.

If available and materially useful, use read-only exploration/audit for primary-source and package-source review. Main Codex retains all architecture, authorization, Google-operation, Git, PR, evidence, and acceptance decisions. Do not delegate local secret/OAuth handling or any Google operation.

## 6. Mandatory authorization root-cause matrix before any runtime call

Do not begin by making another `runQuickDiagnostic` call.

First build and publish only closed-safe proof for an authorization matrix that distinguishes at least these possibilities:

1. named OAuth profile missing, expired, unreadable, or bound to the wrong local profile;
2. OAuth grant missing one or more manifest/project scopes required by the runtime payload;
3. Desktop OAuth client or consent screen not in the expected personal synthetic standard Cloud project;
4. OAuth consent Testing mode not allowing the operator account as a test user;
5. API executable deployment visibility not equal to execution permission;
6. deployment access not MYSELF-only or not callable by the named OAuth principal;
7. script/project owner identity mismatch, without publishing any identity;
8. bound Spreadsheet or Apps Script target ownership/authorization mismatch, without publishing any ID, URL, account, or title;
9. Apps Script API enabled but the wrong Cloud project or OAuth client is being used for the named profile;
10. function call blocked by required Spreadsheet/Properties/ScriptApp scopes rather than by function availability.

For each item, report only closed fields such as `PASS`, `FAIL`, `UNKNOWN`, counts, Booleans, safe enum categories, and SHA-256 hashes. Do not publish account names, emails, Script IDs, deployment IDs, Workspace URLs, OAuth token material, raw API output, raw clasp output, local absolute paths, file contents pulled from Google, company data, personal data, or real data.

Local ignored records may retain raw output if repository rules already allow it, but tracked evidence must contain only closed classifications and hashes.

## 7. Local-only reauthorization / remediation boundary

If the evidence supports an OAuth-grant or named-profile authorization problem, this instruction authorizes a local-only remediation of the personal synthetic runtime profile, limited to one of the following safe approaches:

- refresh the named OAuth profile using the existing ignored credentials and project scopes;
- create a new ignored named OAuth profile specifically for Instruction 0015, preserving prior profiles and recording only closed-safe profile-state evidence;
- require an operator-only browser consent action without pasting any secret, ID, URL, account, screenshot, or raw output into chat or GitHub.

The remediation must not change canonical Apps Script source, canonical `appsscript.json`, company Workspace, production resources, or real data. It must not weaken OAuth scopes, remove required project scopes, or bypass the repository's runtime guard. It must not delete Instruction 0011/0013/0014 attempt markers to manufacture another attempt.

If the root cause requires a change outside the personal synthetic local/runtime lane, stop with `RUNTIME_AUTHORIZATION_ROOT_CAUSE_IDENTIFIED_NO_DIAGNOSTIC`.

## 8. Guard hardening required before any new diagnostic call

Before any new runtime diagnostic call, add or verify guard logic and tests proving:

1. Instruction 0011, 0013, and 0014 attempt evidence remains preserved;
2. Instruction 0015 uses its own separate ignored one-use marker;
3. the deployment-bound execution context is still an API-executable deployment, not a project/script ID and not HEAD-only;
4. the named OAuth profile used for the call is the profile that passed the authorization matrix;
5. manifest/project scope coverage is proven in closed-safe form;
6. the function name is exactly `runQuickDiagnostic`;
7. staged payload, independent HEAD pull-back, and immutable-version pull-back still contain the top-level wrapper;
8. the runtime payload and manifest overlay remain unchanged unless a tracked, reviewed, non-secret fix explicitly requires otherwise;
9. the guard writes `ATTEMPT_STARTED` before the remote call;
10. a second Instruction 0015 call is impossible without a later tracked instruction.

Run non-Google checks after guard changes before any Google call.

## 9. Google/runtime operation boundary

Allowed before the one runtime call:

- read-only metadata/preflight calls needed to prove the authorization matrix;
- local-only OAuth consent/profile refresh under the personal synthetic boundary;
- creating a fresh MYSELF-only immutable version/deployment only if required to bind the reauthorized profile to a verified deployment lineage, and only after preserving the previous version/deployment evidence.

Not allowed:

- Deep Diagnostic;
- Dashboard refresh;
- Task edits;
- Gmail import or Gmail mutation;
- Calendar reconciliation or Calendar mutation;
- Automation enablement or trigger creation beyond existing Setup-created state checks;
- Migration;
- Test Harness execution;
- external AI/provider calls;
- company-PC or company-Workspace work;
- production work;
- real-data operations;
- repeated diagnostic calls.

If all preconditions pass, exactly one Instruction 0015 call of only `runQuickDiagnostic` is authorized. It must use the deployment-bound API-executable context and the authorization-profile evidence that passed the matrix. If it returns a bounded diagnostic body, publish only the bounded closed acceptance summary. If it returns no bounded body, close with the exact safe category/subtype and no retry.

## 10. Required validation

From `implementation/GoogleSpreadsheet`, run at minimum:

```powershell
pnpm install --frozen-lockfile
pnpm run verify:local
node tests/canonical_document_consistency_test.js
node tests/remote_gas_development_bootstrap_test.js
node tools/local_clasp_dev.js self-test
```

If tooling changes add narrower tests, run them too. Do not claim PASS unless the command actually ran.

## 11. Evidence, docs, PR, and CI

Publish safe tracked evidence, preferably:

```text
audits/2026-08-03/GoogleWorkspace_0015_Runtime_Authorization_Root_Cause_Evidence_2026-08-03.md
```

Update only necessary status docs, validation docs, tests, and tooling. Keep the diff minimal. Preserve historical evidence and do not rewrite prior conclusions; supersede them only with clearly labelled later evidence.

Commit and push normally to `codex/0008-remote-gas-development-bootstrap`. Update PR #11 with a safe closed summary. Inspect latest push and pull-request GitHub Actions. Confirm run IDs, job IDs, step conclusions, and relevant logs. All required jobs and steps must succeed; none may fail, be cancelled, skipped, or remain unexecuted.

## 12. Final report requirements

The final report must begin and end with:

```text
Work ID: 0004 / Instruction 0015
```

Report:

- repository, branch, HEAD SHA, PR URL/state, worktree state;
- whether PR #8-#11 remained Open/Draft/unmerged and whether PR #12 remained separate;
- authorization root-cause matrix result;
- any local-only OAuth/profile remediation performed;
- whether a new diagnostic call was made;
- if made, exact closed outcome and bounded summary or failure category;
- changed files and commits;
- local validation commands/results;
- push/PR CI run IDs, job IDs, and step results;
- remaining boundaries and explicit non-authorization of company/production/Phase 8C/pilot/company-handoff;
- confirmation that no forbidden secret, path, ID, URL, account detail, raw output, company data, personal data, or real data was committed or posted.

Do not declare Phase 8B overall PASS, Phase 8C GO, production-ready, pilot-ready, company-handoff-ready, company transfer, or company Workspace authorization unless a bounded diagnostic PASS is obtained and a later independent review instruction explicitly authorizes that promotion.
