# Work ID: 0003
# Instruction 0014 - runtime function availability root-cause and guarded diagnostic

Date: 2026-08-03 JST
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
Primary working branch: `codex/0008-remote-gas-development-bootstrap`
Primary Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/11`
Pre-handoff inspected head: `c94d78ed41cfaef782af6b04e09f27e770fb2c3b`
Parent PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/10`
Parent branch: `codex/0006-local-clasp-validation-gate`

This handoff was added after the inspected application/evidence head. Treat the branch HEAD that contains this file as the latest branch state, but treat `c94d78ed41cfaef782af6b04e09f27e770fb2c3b` as the last inspected application/runtime-evidence boundary before this handoff-only commit.

Use `Instruction 0014` for this work. Do not reuse Instruction 0012 or 0013. Instruction 0012 was used for the separate Luna custom-agent configuration PR. Instruction 0013 has already consumed its one runtime retry and is closed.

## Mandatory opening and closing line for the Codex final report

Begin and end the final report with:

```text
Work ID: 0003 / Instruction 0014
```

## 1. GitHub state verified by ChatGPT before this handoff

1. PR #11 is Open / Draft / unmerged / mergeable. Its inspected head was `c94d78ed41cfaef782af6b04e09f27e770fb2c3b`.
2. The inspected Instruction 0013 delta from `d573a9e2661dce095ce1c45a0d5b99231595baa3` to `c94d78ed41cfaef782af6b04e09f27e770fb2c3b` consists of 2 commits and 16 changed files.
3. Instruction 0013 evidence reports that no canonical Apps Script source and no canonical `appsscript.json` changed.
4. Instruction 0013 preserved the Instruction 0011 failed-attempt record and used a separate one-use marker before its Google operation.
5. Instruction 0013 preflight proved, in closed-safe form, named OAuth/profile, runtime authorization, standard Cloud linkage, Cloud-project Apps Script API, OAuth Testing/Desktop prerequisites, and exact MYSELF-only runtime overlay pull-back parity.
6. Instruction 0013 preflight also proved 2 visible deployments, 1 visible versioned deployment, 1 visible HEAD test deployment, ignored local binding matching the visible versioned deployment, `Binding is HEAD-only = false`, and corrected versioned MYSELF-only binding `PASS`.
7. Instruction 0013 then invoked exactly one deployed-version `runQuickDiagnostic` call with `--nondev`. It returned no bounded diagnostic body and closed as `REMOTE_QUICK_DIAGNOSTIC_FAILED_CLOSED`, safe subtype `VERSIONED_RUNTIME_FUNCTION_NOT_FOUND`; the immediate local parser record remained `DEV_RUNTIME_RESULT_UNPARSEABLE`.
8. Functional runtime acceptance remains `ATTEMPTED_FAILED_CLOSED` and `REVIEW_REQUIRED`. `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` remains only a readiness boundary. Phase 8B overall PASS, Phase 8C GO, production readiness, pilot readiness, company-handoff readiness, and company transfer are not established.
9. Final Instruction 0013 CI on inspected head succeeded for final push run `30757462933` / job `91522001904` and final PR run `30757464719` / job `91522006764`; every listed setup, checkout, Node, Corepack, locked install, non-Google verification, post, and completion step succeeded.
10. `16_Diagnostics.gs` at the inspected head contains the module method `WorkOsDiagnostics.runQuickDiagnostic(...)` and also a top-level Apps Script wrapper:

```javascript
function runQuickDiagnostic() {
  return WorkOsDiagnostics.runQuickDiagnostic(SpreadsheetApp.getActiveSpreadsheet());
}
```

11. `local_clasp_dev.js` at the inspected head invokes Instruction 0013 using:

```javascript
runtimeClaspArgs(['--json', 'run-function', '--nondev', allowedRuntimeFunction])
```

where `allowedRuntimeFunction` is expected to be `runQuickDiagnostic`.

Do not infer the root cause solely from item 10 or item 11. The current evidence only proves that the tracked source contains a top-level wrapper, while the corrected deployed-version runtime path still reported that the requested function was unavailable.

## 2. Objective

Resolve the `VERSIONED_RUNTIME_FUNCTION_NOT_FOUND` blocker without guessing and without using repeated runtime calls.

The outcome must be one of:

- `RUNTIME_FUNCTION_AVAILABILITY_ROOT_CAUSE_IDENTIFIED_NO_GOOGLE_RETRY`, if the cause can be identified but a safe fix or proof cannot be completed within this instruction;
- `RUNTIME_FUNCTION_AVAILABILITY_GUARD_REMEDIATED_READY_FOR_ONE_DIAGNOSTIC`, if tooling/docs/tests are corrected and all prerequisites pass but no new diagnostic call is authorized or performed;
- `RUNTIME_QUICK_DIAGNOSTIC_BOUNDED_RESULT_OBTAINED`, only if a single newly authorized Instruction 0014 diagnostic call returns a bounded diagnostic body;
- `RUNTIME_QUICK_DIAGNOSTIC_FAILED_CLOSED`, if the one newly authorized Instruction 0014 call is made but still returns no bounded body.

This instruction authorizes investigation, guard hardening, and if and only if all preconditions below pass, exactly one further `runQuickDiagnostic` runtime attempt. It does not authorize repeated calls.

## 3. Required reading before any operation

Read, in full or enough to verify current rules, scope, and state:

1. root `README.md` and root `AGENTS.md`;
2. `implementation/GoogleSpreadsheet/AGENTS.md`;
3. `CONTRIBUTING.md`, if present;
4. `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`, if present;
5. `CURRENT_STATUS.md`, `DECISIONS.md`, `MASTER_PLAN.md`, `PROJECT_CONTEXT.md`;
6. `docs/local-clasp-setup.md`, `docs/development-validation-gates.md`, `docs/company-handoff.md`, `docs/TASK_AUTHORITY_PROTOCOL.md`, and `docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`;
7. instructions `0006` through `0014` and all associated audits;
8. PR #8 through #12 metadata, comments, refs, current commits, changed files, workflow runs, jobs, steps, and relevant logs;
9. `implementation/GoogleSpreadsheet/package.json`, lockfile, `.clasp` examples, ignore rules, local clasp tooling, local validation tooling, runtime bootstrap tooling, and all related tests;
10. project-local `@google/clasp` 3.3.0 implementation/help relevant to `run-function`, `--nondev`, API executable deployment, Apps Script versions, deployment selection, and function names;
11. official primary documentation available locally or online for Apps Script API `scripts.run`, API executable deployments, `devMode`, and clasp `run-function` semantics. Use only primary sources or project-local package source for tool/CLI claims.

If any listed repository file is absent on the active branch, record `ABSENT` and continue only if repository rules allow it.

## 4. Repository and branch procedure

1. Fetch normally from origin.
2. Checkout `codex/0008-remote-gas-development-bootstrap`.
3. Fast-forward to the latest remote branch state.
4. Confirm repository full name, remote URL, current branch, HEAD SHA, PR #11 state, and worktree cleanliness.
5. Do not rebase, squash, amend, reset, clean, force-push, or rewrite preserved 0007/0008/0009/0010/0011/0013 history.
6. If staged, unstaged, or untracked non-ignored files exist before work starts, stop with `LOCAL_WORKTREE_UNCLEAN_BEFORE_0014` and report only safe non-secret path names.
7. Keep PR #8, #9, #10, and #11 Open / Draft / unmerged. PR #12 is already merged to `main`; do not alter or merge/cherry-pick it into PR #11 unless a later explicit instruction authorizes that scope.

## 5. Delegation and `.codex` boundary

Use repository `.codex` agent definitions only if they are present and authoritative in the active PR #11 branch after checkout. Because PR #12 was merged to `main` separately and is not necessarily an ancestor of PR #11, do not assume those definitions exist on this branch.

If available and useful, use read-only exploration/audit agents for source/CLI semantics and final verification only. Main Codex retains all architecture, status, Google-operation, git, PR, and final acceptance decisions.

## 6. Investigation requirements before any new Google runtime call

Before any function execution, perform non-Google and read-only checks sufficient to answer these questions in closed-safe evidence:

1. Does the runtime staged payload still contain the top-level `function runQuickDiagnostic()` wrapper in the exact file that is part of the 23-file runtime payload?
2. Is the wrapper top-level from Apps Script's perspective, not nested, renamed, conditionally excluded, or transformed away by staging?
3. Does the runtime pull-back payload from the remote target still contain the same top-level wrapper and the expected runtime manifest overlay?
4. Does the tool's `allowedRuntimeFunction` exactly equal `runQuickDiagnostic` and is it used consistently in all Instruction 0014 commands?
5. Does `clasp run-function --nondev` in project-local clasp 3.3.0 call Apps Script with the expected function name and non-dev/deployed-version semantics? Cite local package source or primary docs in the report.
6. Does the corrected visible versioned deployment actually correspond to a version created after the remote runtime payload with the wrapper was pushed and independently pull-verified?
7. If that correspondence cannot be proved from safe local/remote metadata, is there a safe way to create a fresh MYSELF-only versioned API executable from the already pull-verified runtime payload without exposing IDs and without altering canonical source?
8. Was the Instruction 0013 failure plausibly caused by stale deployment-version content, incorrect `clasp run-function` semantics, incorrect command argument order, wrong selected execution context, or another source? Separate verified fact from inference.

Do not publish raw output, identifiers, descriptions, account details, source text fetched from Google, local absolute paths, or credentials. Retain raw output only in ignored local operation records with SHA-256 and closed counts/Booleans in GitHub.

## 7. Guard/tooling remediation requirements

If the investigation identifies a tooling or guard gap, fix it with the smallest tracked change. At minimum, strengthen tests and docs so that a future runtime call is not allowed unless the following are proved in closed-safe form:

1. top-level callable function presence in the staged runtime payload;
2. top-level callable function presence in the independent runtime pull-back payload;
3. exact function name consistency across config, command construction, and parser expectations;
4. deployed-version call semantics are either primary-source confirmed or explicitly treated as unproven and blocked;
5. deployment-version lineage is not inferred merely from deployment visibility; a visible versioned deployment must be tied to a post-runtime-push version/deployment action or the operation must stop;
6. Instruction 0011 and Instruction 0013 attempt markers remain preserved and cannot be deleted or reused to manufacture extra calls;
7. any Instruction 0014 attempt must have its own separate one-use marker written before the Google call.

Do not weaken canonical/blank-target non-force behavior. Do not modify canonical Apps Script source or canonical `appsscript.json` unless the investigation proves a real source defect and the change is strictly necessary; if source changes become necessary, keep them minimal and update package/hash/evidence contracts accordingly.

## 8. Google operation boundary

This instruction permits read-only Google metadata/preflight calls only as needed to prove deployment/function availability. It permits no Task, Gmail, Calendar, Dashboard, Deep Diagnostic, Automation, Migration, test harness, external AI/provider, company-PC/company-Workspace, production, or real-data operation.

A new `runQuickDiagnostic` call is authorized only if all conditions below pass:

1. all non-Google local checks pass;
2. runtime overlay staging and independent runtime pull-back parity pass;
3. callable wrapper presence is proved in both staged and pulled runtime payloads;
4. function-name and command semantics are proved or corrected;
5. deployment-version lineage is proved or a fresh MYSELF-only versioned deployment has been created from the pull-verified runtime payload under this instruction;
6. a separate Instruction 0014 one-use marker is written before the call;
7. no prior Instruction 0014 runtime call exists.

If these conditions are not all met, do not run the diagnostic. Close with the appropriate no-retry status and publish evidence.

If the call is made, it must be exactly one invocation of only `runQuickDiagnostic`. If it returns a bounded body, publish only the bounded closed acceptance summary. If it returns no bounded body, close as `RUNTIME_QUICK_DIAGNOSTIC_FAILED_CLOSED` with exact closed category/subtype and no retry.

## 9. Validation requirements

Run from `implementation/GoogleSpreadsheet` unless the repository defines otherwise:

```text
pnpm install --frozen-lockfile
pnpm run verify:local
```

Also run focused checks affected by this work, including but not limited to:

```text
node tests/canonical_document_consistency_test.js
node tests/remote_gas_development_bootstrap_test.js
node tools/local_clasp_dev.js self-test
```

If new package scripts or tools are added, test them in no-Google dry/self-test mode before any Google operation.

After final commit/push, inspect both latest push and pull-request GitHub Actions. Confirm run IDs, job IDs, step conclusions, and relevant logs. All required jobs and steps must succeed; none may fail, be cancelled, skipped, or remain unexecuted.

## 10. Evidence, PR, and final reporting

Publish safe tracked evidence, preferably:

```text
audits/2026-08-03/GoogleWorkspace_0014_Runtime_Function_Availability_Root_Cause_Evidence_2026-08-03.md
```

Update current status docs and PR #11 comments with the final boundary. Keep the diff minimal and evidence-based.

Final report must include:

- Work ID and Instruction number;
- repository, branch, latest HEAD, PR URL/state;
- changed files and commits;
- what was verified from source/staged payload/pull-back payload;
- what was verified from clasp/local package source or primary docs;
- whether deployment-version lineage was proved or remediated;
- whether a new runtime call occurred;
- exact closed runtime result, if any;
- validation commands/results;
- GitHub Actions run IDs/job IDs/step conclusions;
- remaining limits and company boundary;
- explicit confirmation that no local absolute path, Script ID, deployment ID, Workspace URL, account detail, OAuth material, credential, raw remote/clasp output, company data, personal data, or real data was committed.

Do not declare Phase 8B overall PASS, Phase 8C GO, production-ready, pilot-ready, company-handoff-ready, or company transfer unless explicitly supported by a bounded diagnostic PASS plus a later independent review instruction. The expected default after this task remains no company handoff unless all evidence says otherwise.
