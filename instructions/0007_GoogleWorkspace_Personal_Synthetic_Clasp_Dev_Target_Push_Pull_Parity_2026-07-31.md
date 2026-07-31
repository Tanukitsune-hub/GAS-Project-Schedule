# 指示番号: 0007
# Google Workspace Personal Work OS
# 個人synthetic dev targetのclasp接続／guarded push／pull-back parity検証

- Date: 2026-07-31
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
- Current implementation branch: `codex/0006-local-clasp-validation-gate`
- Current Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/10`
- Instruction 0006 final HEAD: `effffb737d365eacd71949eb7d37c2de94a599a0`
- Instruction 0006 base/integration ref: `06e5295f5c90c43964720be8598ef66ef7688318`
- Current candidate: Code `2.8.11-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- Current development status: `READY_FOR_LOCAL_CLASP_VALIDATION`
- Current company status: `NO_GO_COMPANY_HANDOFF_PENDING_LOCAL_CLASP_VALIDATION`
- Current staged payload contract: 23 files / SHA-256 `ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1`
- Instruction 0005: `SUPERSEDED_NOT_EXECUTED`
- Historical fixed T11: `T11_SUSPENDED`; `NO_ACTIVE_COMPANY_TRANSFER`

## 1. Goal and mandatory execution rule

Use the self-PC, the project-local `@google/clasp`, the Google account currently signed in on that PC, and the existing personal/non-company/synthetic Sandbox Apps Script project to execute the authenticated local validation lane through:

1. local target binding and guard;
2. guarded `clasp push`;
3. independent ignored-directory `clasp pull`;
4. exact 23-file and byte-level pull-back parity; and
5. evidence, status, CI, commit, normal push, and a new stacked Draft PR.

Do not stop after writing setup instructions. Attempt the authenticated lane during this Codex session. Pause only when a human browser approval or local secret/Script-ID entry is genuinely required, give the operator the exact minimal UI action, then continue after completion.

The final report must begin and end with:

```text
指示番号: 0007
```

## 2. Explicit operator authorization and target attestation

The repository owner explicitly authorizes:

- use of the Google account currently signed in on the self-PC for local `clasp` OAuth;
- use of the existing controlled Sandbox Apps Script project previously used for synthetic Setup/Diagnostic testing, provided it is personal, non-company, non-production, and contains no real company/business data;
- enabling the user-level Apps Script API for that same account if Google reports it disabled;
- overwriting the Apps Script **code files only** in that personal synthetic target through the guarded local tooling;
- no Setup or Spreadsheet/Calendar/Gmail operation as part of this instruction.

This authorization does **not** permit use of a company Google account, company Apps Script project, production project, real company data, real Gmail, real Calendar content, or a company PC.

Before binding, ask for one local operator confirmation only:

```text
TARGET_ATTESTATION = PERSONAL_SYNTHETIC_NON_COMPANY_EXISTING_SANDBOX
```

Do not record account identity, email, Script ID, URL, OAuth token, or the raw attestation interaction in GitHub. Record only the closed Boolean/enum result.

If the project visible in the browser is not clearly the existing personal synthetic Sandbox, stop with:

```text
DEV_TARGET_ATTESTATION_FAILED
```

Do not create a replacement target or choose another project silently.

## 3. Strict execution boundary

This instruction authorizes only local authentication, target binding, code push, code pull-back, and byte-parity verification.

It does not authorize:

- Setup, `セットアップを続行`, S90, or S99;
- Quick or Deep Diagnostic in Google Workspace;
- test-harness functions;
- Dashboard refresh;
- Task edits or edit-handler execution;
- Gmail, Calendar reconciliation, Drive, Properties, trigger, Worker, retry, or Migration actions;
- Automation or time-driven triggers;
- external AI or Provider configuration;
- deployment creation, API-executable creation, standard Cloud-project linkage, or production OAuth configuration;
- `clasp run` / `gas:test:dev` in this instruction;
- company-PC carriage or company-Sandbox operation;
- release, transfer, tag, or fixed-ref publication.

Keep local `.clasp-dev/target.json` field `runtime_dry_run_allowed` set to `false`. Runtime validation is a later, separately designed gate.

## 4. Required repository reading

Read and follow, in order:

1. root `README.md`;
2. root `AGENTS.md`;
3. applicable `implementation/GoogleSpreadsheet/AGENTS.md`;
4. `CONTRIBUTING.md`, if present;
5. `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`;
6. `CURRENT_STATUS.md`, `DECISIONS.md`, `MASTER_PLAN.md`, `PROJECT_CONTEXT.md`;
7. `docs/development-validation-gates.md`;
8. `docs/local-clasp-setup.md`;
9. `docs/company-handoff.md`;
10. Instruction 0006 and its audit evidence;
11. `.github/workflows/ci.yml` and the final PR #10 Actions run/job/logs;
12. `implementation/GoogleSpreadsheet/package.json` and lockfile;
13. `.clasp.example.json` and `.clasp-dev.target.example.json`;
14. `tools/local_validation_gate.js` and `tools/local_clasp_dev.js` in full;
15. relevant local-clasp/CI/secret-scan regression tests;
16. PR #8, PR #9, PR #10 state, comments, refs, and checks;
17. this instruction in full.

Confirm remote, all relevant branches, HEAD, working tree, staged/unstaged/untracked state, and normal-fetch the latest remote. Do not reset, clean, rebase, amend, force-push, or rewrite historical artifacts.

## 5. Branch and PR procedure

Create a dedicated branch from the commit containing this instruction:

```text
codex/0007-local-clasp-dev-validation
```

Create a new stacked Draft PR after evidence is committed:

```text
base: codex/0006-local-clasp-validation-gate
head: codex/0007-local-clasp-dev-validation
```

Keep PR #8, PR #9, and PR #10 Open / Draft / unmerged. Add short cross-reference comments where useful. Do not push directly to `main` or to the PR #10 implementation branch after creating the 0007 branch.

## 6. Pre-authentication non-Google verification

From `implementation/GoogleSpreadsheet/`, run and record closed results:

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm run verify:local
pnpm run gas:stage:dev
pnpm exec clasp --version
```

Requirements:

- clean tracked worktree before authenticated push;
- 11/11 local gate PASS;
- all current Node suites PASS;
- exact 23-file staged payload;
- staged payload SHA-256 exactly
  `ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1`;
- project-local clasp version `3.3.0` unless a lockfile-consistent platform output proves an equivalent exact package version.

Any failure before Google authentication is:

```text
NO_GO_LOCAL_CLASP_VALIDATION
```

Do not continue to OAuth or push after a failure.

## 7. Google OAuth setup on the self-PC

Use only the project-local clasp executable. Do not install or rely on a global clasp.

Check whether the self-PC already has usable clasp OAuth state without printing credential content. If authentication is absent or unusable, run:

```powershell
pnpm exec clasp login
```

When the browser opens, ask the operator to select and approve the Google account currently signed in on the PC. Do not request a password, OAuth code, token, `.clasprc.json`, or account email in chat.

If Google reports that the Apps Script API is disabled, ask the operator to enable the **user-level Apps Script API** for the same personal account, then retry the login/status step once. Do not create a Google Cloud project, OAuth client, service account, API key, deployment, or secret.

Allowed closed outcomes:

```text
AUTHENTICATED_CURRENT_OPERATOR_ACCOUNT
BLOCKED_BY_AUTH
APPS_SCRIPT_API_DISABLED
```

Do not include raw Google error text, browser URL, account identity, or credential path in GitHub evidence.

## 8. Local-only target binding

Use the existing personal synthetic Sandbox Apps Script project. Do not create a new project in this task.

Obtain its Script ID from the local Apps Script **Project Settings** UI. The operator must enter it only through a local terminal prompt or directly into ignored local files. Never ask the operator to paste it into ChatGPT/Codex chat, a commit, PR, issue, log, screenshot, or report.

Create ignored local files only:

```text
implementation/GoogleSpreadsheet/.clasp-dev/.clasp.json
implementation/GoogleSpreadsheet/.clasp-dev/target.json
```

They must contain the same locally supplied Script ID and these non-secret fields:

```text
.clasp.json:
  rootDir = payload

target.json:
  target_kind = PERSONAL_SYNTHETIC_DEV
  runtime_dry_run_allowed = false
  runtime_function = runQuickDiagnostic
```

Use a local interactive prompt such as PowerShell `Read-Host` so the Script ID is not embedded in shell history or the Codex report where practical. Clear the temporary variable after writing the ignored files.

Do not print either file. Confirm only:

```text
target_configuration_present: true
target_kind: PERSONAL_SYNTHETIC_DEV
script_id_match: true
script_id_tracked: false
runtime_dry_run_allowed: false
```

Run the tracked-secret/local-path scan again and confirm that no `.clasp.json`, `.clasprc.json`, target ID, OAuth material, or local report is tracked.

## 9. Guarded status, push, and pull-back parity

Set the explicit opt-in only in the current terminal:

```powershell
$env:GAS_DEV_CLASP_ALLOWED = 'true'
```

Then run, in order:

```powershell
pnpm run gas:status:dev
pnpm run gas:push:dev
pnpm run gas:pull-verify:dev
pnpm run gas:status:dev
```

The tracked tool is the authority for target guard, clean-worktree refusal, exact staging, push, ignored pull workspace, file inventory, and payload parity.

Required PASS evidence:

```text
target_guard: PASS
clasp_status_before_push: PASS
clasp_push: PASS
clasp_pullback_parity: PASS
clasp_status_after_push: PASS
file_count: 23
staged_payload_sha256: ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1
pulled_payload_sha256: ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1
parity: PASS
```

Do not use `--force`, bypass the guard, alter the allow-list, delete unexpected remote files manually, or accept a partial pull. Do not report raw clasp output; report only exit classifications, counts, versions, and hashes generated by the guarded tool.

### Stop conditions

Stop with no repair/retry beyond the one expressly allowed API-enable/login retry if any of the following occurs:

- `DEV_TARGET_NOT_CONFIGURED` after local target entry;
- `DEV_TARGET_KIND_REJECTED`;
- `DEV_TARGET_ID_MISMATCH`;
- `DEV_TARGET_ID_IS_TRACKED`;
- `BLOCKED_BY_AUTH` after the approved login attempt;
- dirty tracked worktree at push time;
- staged/source skew;
- `CLASP_PUSH_FAILED`;
- `CLASP_PULL_FAILED`;
- unexpected remote file inventory;
- pull-back hash mismatch;
- any request to run Setup, create resources, authorize company data, enable triggers, or alter production settings.

If remote pull-back shows an unexpected file, do not delete it remotely and do not rerun with force. Record the safe code and stop.

## 10. Runtime validation boundary

Do not run:

```text
pnpm run gas:test:dev
pnpm run gas:open
clasp run
clasp deploy
clasp deployments
```

Do not change `runtime_dry_run_allowed` from `false`.

After successful push/pull parity, inspect the source/runtime contract locally and document the separate prerequisites that a future runtime-validation instruction would need. Do not create those prerequisites in this task.

The maximum successful development status for this task is:

```text
READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION
```

The corresponding company status must remain:

```text
NO_GO_COMPANY_HANDOFF_PENDING_LOCAL_RUNTIME_VALIDATION
```

Neither status authorizes company carriage or runtime execution.

## 11. Evidence and canonical-document updates

After the authenticated lane concludes, create a privacy-safe additive audit record:

```text
audits/2026-07-31/GoogleWorkspace_0007_Personal_Synthetic_Clasp_Dev_Push_Pull_Parity_Evidence_2026-07-31.md
```

Record only:

- instruction number;
- source branch/commit;
- operator target attestation enum and Boolean result;
- clasp version;
- authentication closed outcome without identity;
- target-guard status;
- 23-file count;
- staged and pulled payload hashes;
- push and pull-back parity closed outcomes;
- runtime `NOT_EXECUTED` and why;
- local verification and Actions results;
- company remaining NO-GO;
- no ID, URL, identity, OAuth/token, raw remote output, Workspace content, local path, or screenshot.

Update as necessary and keep mutually consistent:

- `README.md`;
- `CURRENT_STATUS.md`;
- `MASTER_PLAN.md`;
- `PROJECT_CONTEXT.md`;
- `DECISIONS.md` if a new decision is required;
- `docs/development-validation-gates.md`;
- `docs/local-clasp-setup.md`;
- `docs/company-handoff.md`;
- applicable current implementation plans/guides;
- static status/consistency tests.

On full push/pull success, set:

```text
Development status: READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION
Company status: NO_GO_COMPANY_HANDOFF_PENDING_LOCAL_RUNTIME_VALIDATION
```

On authentication/target blockage with no remote mutation, retain:

```text
Development status: READY_FOR_LOCAL_CLASP_VALIDATION
Company status: NO_GO_COMPANY_HANDOFF_PENDING_LOCAL_CLASP_VALIDATION
```

On a real push, pull, parity, guard-bypass, tracked-secret, or remote-inventory failure, set:

```text
Development status: NO_GO_LOCAL_CLASP_VALIDATION
Company status: NO_GO_COMPANY_HANDOFF_LOCAL_VALIDATION_FAILURE
```

Do not change Code/Schema/AI/Migration versions. Do not modify executable `.gs` source, `appsscript.json`, historical release/transfer/checksum bytes, or fixed historical refs.

## 12. Validation after evidence changes

Run at least:

- `pnpm install --frozen-lockfile`;
- `pnpm run verify:local`;
- local clasp tool self-tests;
- canonical-document/status consistency tests;
- CI workflow contract tests;
- tracked secret/credential/local-path/target-ID scan;
- changed-file boundary check proving no executable `.gs`, manifest, release, transfer, checksum, or fixed artifact changed;
- fresh detached HTTPS clone non-Google verification.

Normal-push the branch and wait for the new stacked PR GitHub Actions run to complete successfully. GitHub Actions must not receive or use Google credentials, target files, Script ID, OAuth state, or secrets.

If the authenticated lane passes but the final CI/evidence validation fails, do not declare `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION`.

## 13. Required PR and final report

Create one new stacked Draft PR with:

- instruction number `0007`;
- base/head relationship to PR #10;
- current CI run ID/conclusion;
- exact local non-Google commands/results;
- clasp version;
- authentication closed outcome without account identity;
- target-attestation result;
- push status;
- pull-back parity status;
- 23-file count and payload hash;
- runtime `NOT_EXECUTED`;
- company status and remaining blockers;
- confirmation that no Script ID, URL, token, `.clasp*`, local report, company data, or screenshot was committed;
- exact changed files;
- unresolved matters;
- Review Focus.

Keep PR #8, #9, and #10 Open / Draft / unmerged.

The final report must begin and end with `指示番号: 0007` and include:

1. highest development status;
2. company status;
3. final commit SHA and parent;
4. new Draft PR URL/base/head/state;
5. Actions run and conclusion;
6. local verification results;
7. clasp authentication, guard, push, and pull-back parity results;
8. staged/pulled hashes and file count;
9. runtime `NOT_EXECUTED` and prerequisites remaining;
10. exact files changed;
11. privacy/secret confirmation;
12. unresolved matters and Review Focus.

Do not report completion unless the result commit is normally pushed, GitHub-resolvable, the new PR exists, and its Actions run has completed.

# 指示番号: 0007 — END
