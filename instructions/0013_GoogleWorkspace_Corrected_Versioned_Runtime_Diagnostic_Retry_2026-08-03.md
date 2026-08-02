# Work ID: 0002
# Instruction 0013 - corrected versioned deployment runtime diagnostic retry

Date: 2026-08-03 JST
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
Primary working branch: `codex/0008-remote-gas-development-bootstrap`
Primary Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/11`
Pre-handoff inspected head: `a284dff098cfe4d2026c761e82b7cefaa30444c9`
Parent PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/10`
Parent branch: `codex/0006-local-clasp-validation-gate`

This handoff was added after the inspected application/evidence head. Treat the branch HEAD that contains this file as the latest branch state, but treat `a284dff098cfe4d2026c761e82b7cefaa30444c9` as the last inspected application/runtime-evidence boundary before this handoff-only commit.

Use `Instruction 0013` for this runtime-retry work. Do not reuse `Instruction 0012`: PR #12 used that label for the separate Luna custom-agent configuration work and has already been merged to `main`. That PR is not part of PR #11's branch ancestry unless explicitly merged later under a separate instruction.

## Mandatory opening and closing line for the Codex final report

Begin and end the final report with:

```text
Work ID: 0002 / Instruction 0013
```

## 1. GitHub state verified by ChatGPT before this handoff

1. PR #11 is Open / Draft / unmerged / mergeable. Its head at the inspected boundary was `a284dff098cfe4d2026c761e82b7cefaa30444c9`.
2. The inspected Instruction 0011 delta from `ba209feb5ebadb28084cbcd3da6b3137e6f6f760` to `a284dff098cfe4d2026c761e82b7cefaa30444c9` consists of 3 commits and 18 changed files.
3. Instruction 0011 reconciled current status to `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` as a readiness boundary and `ATTEMPTED_FAILED_CLOSED` / `BLOCKED_BY_AUTH` for functional runtime acceptance.
4. Instruction 0011 evidence states that relocation reattachment, status reconciliation, non-Google local verification, personal standard-Cloud/API/OAuth prerequisites, named OAuth, exact 23-file MYSELF-only runtime overlay staging, runtime push, and separate runtime pull-back parity passed.
5. The canonical payload SHA-256 remains `ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1`.
6. The runtime overlay payload SHA-256 recorded by Instruction 0011 is `5524d8412d79bbe8a9b77c916ec1132507b931a1c0b7dbb852eaafe991b74e7a`.
7. The sole Instruction 0011 standalone `runQuickDiagnostic` API attempt did not return a bounded diagnostic JSON body. It closed as `BLOCKED_BY_AUTH`; the immediate parser category was `DEV_RUNTIME_RESULT_UNPARSEABLE`.
8. The root cause recorded in the tracked evidence is that the deployment binding used for the attempt did not match any deployment visible through the named OAuth profile. Read-only enumeration showed only a HEAD test deployment, not a versioned deployment.
9. After the failed attempt, a MYSELF-only versioned API executable was created from the already verified runtime manifest and locally rebound. Read-only enumeration then proved a versioned deployment and local binding membership, but it was not executed because Instruction 0011's exactly-one invocation allowance had already been consumed.
10. Latest-head CI for `a284dff098cfe4d2026c761e82b7cefaa30444c9` was reported and inspected as successful for both push run `30755543362` / job `91516955941` and pull-request run `30755545259` / job `91516960883`; required listed steps completed successfully.
11. PR #12 is closed and merged to `main` at merge commit `1956c6943b5d475a33778e7d992a47ac7f31b0c2`. It adds `.codex` Luna agent configuration but is separate from the PR #11 application/runtime branch. Do not merge or cherry-pick it into PR #11 unless a later instruction explicitly authorizes that scope.

## 2. Objective

Perform one carefully bounded retry of the standalone read-only `runQuickDiagnostic` runtime diagnostic against the corrected versioned MYSELF-only deployment created after Instruction 0011's failed attempt.

This is not a new feature task. This is an evidence and runtime-boundary task:

- independently verify that the corrected versioned deployment binding exists before the call;
- preserve the Instruction 0011 failed-attempt evidence and markers;
- authorize exactly one new Google API invocation for `runQuickDiagnostic` under Instruction 0013;
- parse and publish only bounded closed diagnostic evidence;
- keep company handoff blocked unless a later independent review explicitly changes that boundary.

## 3. Required reading before any operation

Read, in full or enough to verify current rules, scope, and state:

1. root `README.md` and root `AGENTS.md`;
2. `implementation/GoogleSpreadsheet/AGENTS.md`;
3. `CONTRIBUTING.md`, if present;
4. `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`, if present;
5. `CURRENT_STATUS.md`, `DECISIONS.md`, `MASTER_PLAN.md`, `PROJECT_CONTEXT.md`;
6. `docs/local-clasp-setup.md`, `docs/development-validation-gates.md`, `docs/company-handoff.md`, `docs/TASK_AUTHORITY_PROTOCOL.md`, and `docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`;
7. instructions `0006` through `0013` and all associated audits;
8. PR #8 through #12 metadata, comments, refs, current commits, changed files, workflow runs, jobs, steps, and relevant logs;
9. `implementation/GoogleSpreadsheet/package.json`, lockfile, `.clasp` examples, ignore rules, local clasp tooling, local validation tooling, runtime bootstrap tooling, and all related tests.

If any listed file is absent on the active branch, record `ABSENT` and continue only if repository rules allow it.

## 4. Repository and branch procedure

1. Fetch normally from origin.
2. Checkout `codex/0008-remote-gas-development-bootstrap`.
3. Fast-forward to the latest remote branch state.
4. Confirm repository full name, remote URL, current branch, HEAD SHA, PR #11 state, and worktree cleanliness.
5. Do not rebase, squash, amend, reset, clean, force-push, or rewrite the preserved 0007/0008/0009/0010/0011 history.
6. If staged, unstaged, or untracked non-ignored files exist before work starts, stop with `LOCAL_WORKTREE_UNCLEAN_BEFORE_0013` and report only safe non-secret path names.
7. Keep PR #8, #9, #10, and #11 Open / Draft / unmerged. PR #12 is already merged to `main`; do not alter it.

## 5. Delegation and `.codex` boundary

Use repository `.codex` agent definitions only if they are present and authoritative in the active PR #11 branch after checkout. Because PR #12 was merged to `main` separately and is not necessarily an ancestor of PR #11, do not assume those definitions exist on this branch.

If `.codex` definitions are present and applicable:

- use `luna_explorer` read-only to inspect the Instruction 0011 runtime-attempt evidence, deployment-binding guards, exactly-one markers, and relevant test coverage;
- use at most one bounded `luna_executor` only for clear, non-overlapping mechanical changes needed to support an Instruction 0013 attempt marker or evidence update;
- use `luna_auditor` read-only after implementation and evidence publication.

If `.codex` definitions are absent, proceed in the main Codex session only. Main Codex retains all decisions on status, Google operations, Git, PR updates, and final acceptance. Agent claims are never proof by themselves; verify with files, commands, logs, SHAs, and PR evidence.

## 6. Privacy, secret, and boundary rules

Never commit or print:

- Script ID;
- deployment ID;
- Workspace ID or URL;
- account, email, or user identity;
- OAuth material;
- credentials;
- raw clasp or Google API output;
- local absolute path;
- screenshots;
- company data;
- personal data.

All local target, OAuth, Cloud, deployment, and raw-output material must remain in ignored local state only. GitHub evidence may contain only closed categories, counts, hashes, Booleans, and bounded diagnostic summaries.

Do not perform:

- company-PC operation;
- company Workspace operation;
- production deployment;
- company handoff;
- Deep Diagnostic;
- Dashboard refresh;
- Task edit;
- Gmail import;
- Calendar reconciliation;
- Automation enablement;
- Migration;
- test harness execution;
- external AI/provider call;
- any real-data operation.

Automation must remain OFF.

## 7. Non-Google validation before the retry

Before any Google call, run the required non-Google checks from the canonical implementation directory, unless repository scripts specify a different directory:

```bash
pnpm install --frozen-lockfile
pnpm run verify:local
```

Also run the narrow runtime/bootstrap suites that cover:

- canonical document consistency;
- remote GAS bootstrap tests;
- local clasp tool self-tests;
- Instruction 0011 failed-attempt preservation;
- Instruction 0013 new-attempt marker discipline, if new marker logic is added;
- secret/local-path scan.

If any non-Google required check fails, stop and publish only safe failure evidence. Do not make a Google call.

## 8. Preserve Instruction 0011 failed-attempt evidence and add an Instruction 0013 one-use marker

Do not delete, rewrite, or repurpose the Instruction 0011 attempt marker, raw-output hash record, or failed-attempt evidence.

Before the new runtime call, create or verify a separate Instruction 0013 one-use attempt marker in ignored local state. Requirements:

1. It must be durable before the Google call.
2. It must be separate from the Instruction 0011 marker.
3. It must fail closed if an Instruction 0013 attempt marker already exists.
4. It must not contain IDs, URLs, account detail, raw output, credentials, or local absolute paths.
5. If the current tooling cannot support a separate Instruction 0013 marker without weakening the existing guard, implement the smallest tracked tooling/test change to support instruction-scoped one-use runtime markers. Validate that the Instruction 0011 marker remains preserved and cannot be erased to manufacture another attempt.

## 9. Corrected versioned deployment preflight

Before the new runtime call, independently confirm only closed-safe facts:

```text
named_oauth_profile: PASS
runtime_auth_check: PASS
runtime_prerequisites: PASS
standard_cloud_linkage: PASS
apps_script_api_enablement: PASS
runtime_overlay_pullback_parity: PASS
corrected_versioned_deployment_binding: PASS
versioned_myself_only_deployment_visible: true
local_binding_matches_visible_versioned_deployment: true
head_test_deployment_only: false
```

Do this through the existing read-only deployment enumeration / guard tooling. Do not expose deployment IDs or raw output.

If the corrected versioned deployment is not visible, the local binding does not match, the visible deployment is only a HEAD test deployment, or the tool cannot distinguish these states without exposing secrets, stop with:

```text
CORRECTED_VERSIONED_DEPLOYMENT_NOT_PROVEN
```

Do not create another deployment in this instruction unless the repository tooling already has a safe, idempotent, closed-evidence path that proves the existing corrected deployment was lost or invalid without exposing identifiers. If a new deployment would be necessary, stop and report the missing prerequisite rather than guessing.

## 10. Runtime overlay and target mutation rules

Do not modify canonical Apps Script source or canonical `appsscript.json`.

Do not push the canonical payload or blank-target payload.

Do not re-push the runtime overlay unless the current local guards prove that the already staged and pulled runtime payload parity is stale or missing. If a runtime overlay push is necessary, it must remain confined to the ignored MYSELF-only runtime manifest overlay and must preserve the Instruction 0011 rule that `--force` is allowed only for this runtime overlay lane. A separate runtime pull-back parity proof remains mandatory after any such push.

Expected hashes unless code changes intentionally alter the relevant payload under a tracked, validated reason:

```text
canonical_payload_sha256: ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1
runtime_payload_sha256: 5524d8412d79bbe8a9b77c916ec1132507b931a1c0b7dbb852eaafe991b74e7a
```

If either hash changes, stop unless the change is fully explained, tracked, validated, and unrelated to any secret or local-only state.

## 11. Exactly one Instruction 0013 runtime call

After all gates above pass, perform exactly one standalone Google API invocation of the already authorized read-only function:

```text
runQuickDiagnostic
```

The call must use the corrected versioned MYSELF-only deployment. It must not call HEAD-only deployment, devMode, another function, Deep Diagnostic, Dashboard refresh, Task/Gmail/Calendar methods, Automation, Migration, Test Harness, or provider code.

Record the result as one of the following closed categories:

```text
REMOTE_QUICK_DIAGNOSTIC_BOUNDED_RESULT
REMOTE_QUICK_DIAGNOSTIC_REVIEW_REQUIRED
REMOTE_QUICK_DIAGNOSTIC_FAILED_CLOSED
BLOCKED_BY_AUTH
DEV_RUNTIME_RESULT_UNPARSEABLE
CORRECTED_VERSIONED_DEPLOYMENT_NOT_PROVEN
```

If a bounded diagnostic body is returned, retain only the approved bounded summary fields, such as:

- total PASS/WARN/FAIL counts;
- complete sorted WARN/FAIL reason IDs;
- completeness flags;
- side-effect Booleans;
- Task 50-column/header states;
- Ledger 21-column/hidden/protected/validator states;
- Automation/trigger closed states;
- schema/version closed states.

Do not retain raw diagnostic JSON if it contains or might contain sensitive details. Keep raw output only in ignored local evidence, with a SHA-256 hash in tracked evidence if needed.

No retry is allowed in Instruction 0013, regardless of outcome.

## 12. Status update rules after the call

If the bounded diagnostic body validates with no FAIL and all required completeness/side-effect checks are present, update status conservatively to show a remote Quick Diagnostic observation is available for independent review. Do not declare Phase 8B overall PASS, Phase 8C GO, production-ready, pilot-ready, company-handoff-ready, or company transfer authorization.

If WARNs remain, preserve them as `REVIEW_REQUIRED` and list only the bounded reason IDs. Do not collapse WARNs into PASS.

If no bounded body is returned, preserve `ATTEMPTED_FAILED_CLOSED` and the precise closed category.

Company handoff must remain:

```text
NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW
```

unless a later explicit user instruction authorizes an independent company-handoff review. T11 remains `T11_SUSPENDED` and there remains `NO_ACTIVE_COMPANY_TRANSFER`.

## 13. Required tracked outputs

Publish safe tracked evidence for Instruction 0013, preferably:

```text
audits/2026-08-03/GoogleWorkspace_0013_Corrected_Versioned_Runtime_Diagnostic_Retry_Evidence_2026-08-03.md
```

Update only the status-bearing docs/tests needed for consistency, such as:

- `README.md`;
- `CURRENT_STATUS.md`;
- `DECISIONS.md`;
- `MASTER_PLAN.md`;
- `PROJECT_CONTEXT.md`;
- `docs/development-validation-gates.md`;
- `docs/local-clasp-setup.md`;
- `docs/company-handoff.md`;
- relevant implementation docs/tests;
- `implementation/GoogleSpreadsheet/tools/local_clasp_dev.js` only if marker or guard changes are required.

Keep the diff minimal. Do not update unrelated historical release, transfer, or app source files.

## 14. GitHub Actions, PR, and closeout

After local validation and any tracked evidence/doc/test updates:

1. Commit to `codex/0008-remote-gas-development-bootstrap`.
2. Push normally; no force push.
3. Update PR #11 with a concise checkpoint comment.
4. Inspect the latest push and pull-request GitHub Actions runs for the final head.
5. Verify every required job and listed step completed successfully; none failed, was cancelled, skipped, or remained unexecuted.
6. Inspect relevant logs for the local verification summary, 11/11 gate, test suite count, and secret/local-path scan hit count.
7. Keep PR #11 Open / Draft / unmerged.

## 15. Final report requirements

The final report must begin and end with:

```text
Work ID: 0002 / Instruction 0013
```

Report, with evidence:

- repository, branch, PR #11 URL, latest HEAD SHA;
- whether PR #12/main `.codex` definitions were present on this branch and whether agents were used;
- local worktree safety and ignored-state boundary, without local paths;
- non-Google validation commands and results;
- corrected versioned deployment preflight result;
- whether any runtime overlay push was necessary, and if so, push/pull-back parity proof;
- Instruction 0013 attempt marker status;
- exactly-one `runQuickDiagnostic` call status and closed category;
- bounded diagnostic summary if returned;
- status/doc/test changes and changed files;
- commit SHA(s);
- GitHub Actions run IDs, jobs, steps, conclusions, and relevant log evidence;
- unresolved risks and remaining `NOT_EXECUTED` scopes;
- explicit confirmation that no credential, OAuth material, Script ID, deployment ID, Workspace ID/URL, account detail, local absolute path, raw remote output, company data, personal data, or real data was committed.

Work ID: 0002
