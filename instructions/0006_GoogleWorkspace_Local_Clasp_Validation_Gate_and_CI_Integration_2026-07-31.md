# 指示番号: 0006
# Google Workspace Personal Work OS
# 自前PC + clasp実検証ゲート正式化／既存GitHub Actions統合

- Date: 2026-07-31
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
- Current integration branch: `codex/r5-independent-reaudit-transfer-prep`
- Current Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/8`
- Current branch HEAD before this instruction: `6ca3458a168de55e14510a72ef17efa74cad2f05`
- Instruction 0004 result: `ec8a4dd0d883fe85069f815d5b2cf6b8ca60da80`
- Fixed T11: `a3b5a5d8d851bf2d15a2738c54dc6bb31e231d33`
- Existing CI Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/9`
- Existing CI branch / head: `agent/add-standard-ci` / `00a1372339d8c2463689be8077396e538264e482`
- Existing CI successful run: GitHub Actions run `30627823458`
- Current candidate: Code `2.8.11-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

## 1. Supersession and safety status

Instruction `0005_GoogleWorkspace_v2_8_11_T11_Five_File_Retransfer_and_T1_01_Quick_Diagnostic_Reobservation_2026-07-31.md` was saved but was not given to Codex and was not executed. It is superseded by this instruction.

Do not carry T11 to the company PC, do not replace the five files, and do not run the company-Sandbox T1-01 re-observation under instruction 0005. Record 0005 as `SUPERSEDED_NOT_EXECUTED` in current governance documents.

The development policy is now changed to:

```text
local static / regression verification
→ GitHub Actions CI
→ dedicated personal dev Apps Script project via local clasp
→ push / pull-back parity
→ safe dev-runtime dry-run where prerequisites exist
→ independent review of the evidence
→ release / tag / fixed transfer decision
→ company-PC manual reflection, authorization, and minimal smoke test only
```

At task start, treat company handoff as:

```text
NO_GO_COMPANY_HANDOFF_PENDING_LOCAL_CLASP_VALIDATION
```

This task authorizes development and validation only on the user's own PC and a dedicated, non-company, synthetic Google verification project. It does not authorize any company Workspace action, company data, production project, company script ID, company OAuth credential, company Calendar/Gmail/Drive resource, company deployment, or company `clasp` use.

## 2. Mandatory execution rule

Do not stop after analysis, a design note, or a proposed command list.

Inspect the actual repository and both open PRs, integrate the already-created CI work without duplicating or weakening it, implement the local validation lane, run every locally available verification, perform the dedicated-dev `clasp` lane when credentials and target preconditions are safely available, publish the changes on a dedicated branch, create a Draft PR, and report exact evidence.

Your final report must begin and end with:

```text
指示番号: 0006
```

Never fabricate a clasp, Google runtime, or GitHub Actions PASS. Distinguish `PASS`, `FAIL`, `NOT_EXECUTED`, `BLOCKED_BY_AUTH`, and `REVIEW_REQUIRED`.

## 3. Repository and PR reading order

Read and follow, in order:

1. root `README.md` at the current integration branch;
2. root and applicable `AGENTS.md` files;
3. `CONTRIBUTING.md`, if present;
4. `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`;
5. `CURRENT_STATUS.md`, `DECISIONS.md`, `PROJECT_CONTEXT.md`, `MASTER_PLAN.md`;
6. current Authority and Calendar protocols;
7. instructions 0001 through 0005 and their evidence, noting that 0005 is superseded and unexecuted;
8. fixed-T11 release, transfer manifest, checksums, and current source;
9. current Apps Script source, `appsscript.json`, tests, tools, release builders/verifiers, acceptance guides, and transfer guides;
10. all existing `.gitignore`, `.claspignore`, `.clasp*.json`, `package.json`, lockfiles, Node/PowerShell scripts, and local-development documentation;
11. Draft PR #8 body, comments, state, changed files, and checks;
12. Draft PR #9 body, commits, changed files, workflow, Actions runs, jobs, and logs;
13. this instruction in full.

Confirm remote, branches, HEADs, working tree, staged/unstaged/untracked files, and normal-fetch all relevant refs. Do not reset, clean, amend, rebase, force-push, or rewrite existing history.

## 4. Git and branch topology

Do not push directly to `main`.

Create a new clean worktree and dedicated branch from the commit containing this instruction:

```text
codex/0006-local-clasp-validation-gate
```

Create a new stacked Draft PR with:

```text
base: codex/r5-independent-reaudit-transfer-prep
head: codex/0006-local-clasp-validation-gate
```

The new PR is the review surface for instruction 0006. Keep PR #8 and PR #9 open, Draft, and unmerged unless the user separately instructs otherwise. Do not close PR #9 automatically.

Cross-link PR #8, PR #9, and the new Draft PR in their bodies or a concise top-level comment so reviewers can see:

- PR #8 contains the current Work OS development chain;
- PR #9 contains the first CI implementation against the older `main` baseline;
- the instruction-0006 PR integrates the CI semantics into the current v2.8.11 branch and adds the local clasp validation gate.

## 5. Existing GitHub Actions: preserve and integrate, do not duplicate

PR #9 already adds:

- `.github/workflows/ci.yml`;
- root `AGENTS.md` CI policy;
- README CI documentation.

Its GitHub Actions run `30627823458` completed successfully on head `00a1372339d8c2463689be8077396e538264e482` with JSON validation, the Apps Script static validator, and the then-existing regression suites.

This work is not yet merged into `main` or the current PR #8 branch. Treat it as an existing implementation to integrate, not as an instruction to create a second competing CI workflow.

Required handling:

1. Inspect PR #9's exact commits and workflow.
2. Carry its CI behavior and repository-wide CI policy into the instruction-0006 branch, resolving them against the current v2.8.11 README, current 48-suite test tree, and existing `implementation/GoogleSpreadsheet/AGENTS.md`.
3. Do not blindly cherry-pick PR #9's old README text or overwrite current canonical status/transfer sections.
4. Keep one clear minimal root CI workflow unless the repository already has an intentional separate workflow with a distinct purpose.
5. Preserve or strengthen the current checks; do not remove JSON validation, the Apps Script validator, or all `*_test.js` suites.
6. Do not add Google credentials, `.clasprc.json`, `.clasp.json`, or `clasp push` to GitHub Actions in this phase.
7. Keep workflow permissions read-only and avoid direct secrets context.
8. Add only minimal supplementary CI checks required by the new committed scripts, such as package-lock integrity, local verification script execution, tracked-secret guards, or YAML parsing. Avoid unnecessary external Actions and dependencies.
9. After push, require a real GitHub Actions run on the instruction-0006 branch/new PR. It must exercise the current repository, not only PR #9's older 38-suite baseline.

If the integrated workflow fails, fix it minimally and rerun. Do not report CI PASS from PR #9 as proof that the current instruction-0006 branch passes.

## 6. Local toolchain and package scripts

Inspect whether a suitable root or Apps-Script-scoped `package.json` already exists. Preserve existing conventions. If none exists, create the smallest maintainable Node toolchain with a lockfile and pin compatible versions.

Use Node.js 20 or later. Prefer a project-local `@google/clasp` dev dependency and `npm exec` / `npx` over an unpinned global-only dependency.

Provide scripts equivalent to the following names, adapting paths to the repository's actual structure:

```text
verify
verify:local
verify:json
verify:yaml
verify:apps-script
verify:tests
verify:release
verify:transfer
gas:stage:dev
gas:status:dev
gas:push:dev
gas:pull-verify:dev
gas:test:dev
gas:open
```

Requirements:

- `verify` must be safe and non-Google-networked by default.
- `verify:local` must run all locally runnable static/regression/package/transfer checks required for the current candidate.
- `gas:*` commands must be explicit and must never target a company or production project.
- No command may silently treat a skipped Google operation as PASS.
- Commands must work from a documented repository location on Windows PowerShell, which is the primary local environment. Cross-platform Node scripts are preferred where practical.
- Commit a lockfile when dependencies are introduced.

## 7. Exact local verification lane

Build a deterministic local verification entrypoint that performs, at minimum:

1. tracked JSON syntax validation;
2. tracked YAML/YML syntax validation, including the CI workflow;
3. Git status and unexpected generated-file checks;
4. Apps Script file inventory and `appsscript.json` structure validation;
5. `node implementation/GoogleSpreadsheet/tools/validate_apps_script_v2.js`;
6. every current `implementation/GoogleSpreadsheet/tests/*_test.js` suite;
7. canonical-document and current-transfer consistency tests;
8. current Phase 8B and Phase 8C package verifiers;
9. current patch-manifest and transfer-envelope verifiers;
10. source/package parity and fixed-ref checks already used by this repository;
11. secret, credential, local-path, real Workspace ID/URL, and accidental `.clasp*` tracking scans;
12. generation of a machine-readable local verification report containing only command names, PASS/FAIL/NOT_EXECUTED status, counts, Git refs, and safe hashes.

Do not duplicate existing verifier logic when it can be called directly.

## 8. Safe clasp workspace architecture

The local clasp lane must use a dedicated, untracked, synthetic-development workspace. Do not point clasp at the entire repository or at company resources.

Implement a safe staging process with these properties:

- build an allow-listed dev payload containing only the current canonical Apps Script files and `appsscript.json`;
- preserve the exact Apps Script file names expected by the project;
- exclude tests that are not part of the deployed payload unless the current release intentionally includes them;
- exclude repository docs, releases, transfer envelopes, credentials, IDs, URLs, screenshots, company data, and local evidence;
- generate a safe payload inventory and SHA-256 report;
- use an untracked `.clasp.json` that points only to a dedicated personal dev script project;
- use an untracked `.clasprc.json` or the normal user-home clasp credential store; never copy its contents into the repository or logs;
- fail closed if the target script ID is missing, differs from an explicitly supplied local dev target, or resembles a tracked/company identifier;
- require an explicit environment guard such as `GAS_DEV_CLASP_ALLOWED=true` and an untracked expected dev script ID before push;
- refuse to run from a dirty or mismatched staging payload unless the command is explicitly designed to verify that state;
- never use a company script ID, company account, company Spreadsheet, production project, or shared company resource.

Update `.gitignore` as needed. At minimum ensure the following are not tracked:

```text
.clasp.json
.clasprc.json
.clasp-dev/
.clasp-pull-verify/
creds.json
credentials*.json
client_secret*.json
.env
.env.*
node_modules/
```

Add a committed `.clasp.example.json` or equivalent example containing placeholders only. Add a narrowly scoped `.claspignore` or generated allow-list if useful. Do not include a real script ID.

## 9. Local clasp execution

First inspect the installed/local clasp version and its actual help output. Do not assume unsupported command names or flags.

When the dedicated personal dev target and authentication are safely available, perform the following in order:

1. run the complete non-Google `verify:local` gate;
2. build and hash the staged dev payload;
3. verify the target guard and untracked clasp configuration;
4. run a non-mutating clasp status/list inspection;
5. execute `clasp push` only to the dedicated personal dev project;
6. pull or clone the remote dev project into a separate temporary verification directory;
7. compare the pulled remote content with the staged local payload and record exact parity;
8. run a safe dev-runtime dry-run only when the prerequisites in Section 10 are met;
9. capture only closed, non-sensitive evidence; do not print or commit script IDs, account identities, tokens, URLs, file IDs, or OAuth material.

Do not use `clasp push` in GitHub Actions. Do not use `clasp deploy`, `clasp redeploy`, `clasp undeploy`, or change production deployments in this task.

If clasp, authentication, or the dedicated dev target is unavailable, stop the Google lane as `BLOCKED_BY_AUTH` or `DEV_TARGET_NOT_CONFIGURED`, complete the non-Google work, and provide exact user commands and remaining prerequisites. Do not downgrade the missing clasp run to PASS.

## 10. Dev-runtime dry-run test

Inspect the current source before adding any new Apps Script entrypoint.

Preferred order:

1. reuse an existing read-only, basic-type-returning function such as the bounded Quick/Deep Diagnostic or an existing test-mode verification surface if it can safely run in the dedicated dev project;
2. use `clasp run-function` or the installed clasp equivalent only if a dedicated dev API-executable deployment, standard Google Cloud project, OAuth configuration, and required scopes already exist;
3. do not create or modify a deployment, standard Cloud project, OAuth client, or production manifest merely to make remote execution work in this task;
4. if remote execution prerequisites do not exist, document the exact gap and provide a manual dev-editor run procedure as `NOT_EXECUTED`, without claiming runtime PASS.

A safe runtime function must:

- enforce `TEST_MODE=true` or an equivalent dev-only guard;
- use only synthetic/non-sensitive dev resources;
- return basic closed data types;
- perform no Gmail send/search, Calendar create/update/delete/reconcile, Drive mutation, external HTTP/AI request, deployment, trigger creation/deletion, Automation enablement, company Spreadsheet update, or production write;
- report side-effect Booleans explicitly;
- fail closed if the environment cannot be proven safe.

Only if repository inspection proves that no existing safe function can meet this contract may a new dry-run entrypoint be added. If executable Apps Script source changes:

- use the repository's normal versioning, source/release/transfer, testing, and provenance rules;
- do not silently modify v2.8.11 release or T11;
- create a new candidate version and keep company handoff blocked pending review.

## 11. Documentation deliverables

Create or update repository-consistent documentation. Use existing canonical locations; where no stronger rule exists, create:

```text
docs/local-clasp-setup.md
docs/company-handoff.md
docs/development-validation-gates.md
```

### `docs/local-clasp-setup.md`

Include:

- prerequisites: Node 20+, local dependency installation, Apps Script API user setting, dedicated non-company dev account/project;
- safe authentication procedure without copying tokens into the repository;
- `.clasp.example.json` usage and untracked `.clasp.json` creation;
- staging, target guard, push, pull-back parity, optional runtime dry-run, logs, and cleanup;
- PowerShell commands;
- stop conditions and troubleshooting;
- explicit statement that `clasp run-function` requires additional API-executable / Cloud-project / OAuth prerequisites and may remain `NOT_EXECUTED`.

### `docs/company-handoff.md`

Include:

- company PC has no clasp dependency;
- company handoff is allowed only after the local clasp gate and independent review;
- how to retrieve the exact fixed GitHub release/transfer;
- manual Apps Script file reflection and hash checks;
- `appsscript.json` review items;
- first authorization review;
- minimum company smoke test;
- Automation OFF by default;
- stop/rollback procedure;
- no company secrets or IDs in GitHub.

### `docs/development-validation-gates.md`

Define the mandatory progression:

```text
local static/regression
→ GitHub Actions
→ local clasp dev push
→ remote pull-back parity
→ dev-runtime dry-run, when configured
→ independent evidence review
→ release/tag/fixed transfer
→ company manual reflection and minimal smoke
```

Clearly define which gates can be `PASS`, `NOT_EXECUTED`, or blocking.

## 12. AGENTS.md and repository policy

Integrate PR #9's root CI policy into the current repository without overwriting current project-specific rules. Update root and applicable `AGENTS.md` files so future Codex work follows these rules:

- minimal GitHub Actions CI is standard;
- existing CI must not be removed or weakened without a documented reason;
- CI never performs Google-authenticated clasp push in the current phase;
- every GAS change intended for company use must pass local static/regression validation and, where the dedicated dev environment is available, local clasp push/pull verification before company handoff;
- company environments do not rely on clasp and are limited to manual reflection, authorization, and minimal smoke tests;
- Codex final reports must state GitHub Actions status, local verification status, clasp push status, pull-back parity, runtime dry-run status, missing prerequisites, and remaining company checks;
- `.clasp.json`, `.clasprc.json`, OAuth tokens, API keys, Google credentials, company data, personal data, IDs, and URLs must not be committed;
- a skipped local clasp lane blocks company handoff unless a later explicit governance decision says otherwise.

## 13. Canonical status and prior instruction handling

Update current canonical documents and decisions to record:

- instruction 0005 is `SUPERSEDED_NOT_EXECUTED`;
- company T11 carriage and T1-01 re-observation are suspended pending local clasp validation;
- PR #9's CI implementation exists and was successful on its branch, but is not yet proof for the current branch until integrated and rerun;
- the new local clasp development gate is mandatory for future company handoff.

Use these status rules:

```text
If local or CI validation fails:
  NO_GO_LOCAL_CLASP_VALIDATION

If CI and non-Google local validation pass, but clasp push/pull is not executed:
  READY_FOR_LOCAL_CLASP_VALIDATION

If dedicated-dev clasp push and pull-back parity pass, but runtime dry-run is unavailable:
  READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION

Only if CI, local validation, dev push, pull-back parity, and safe runtime dry-run all pass with no unresolved transfer-safety finding:
  READY_FOR_COMPANY_HANDOFF_REASSESSMENT
```

None of these statuses authorizes company transfer automatically. A separate ChatGPT review and later instruction are required.

## 14. Validation and evidence requirements

Run and report, as applicable:

- all current Node suites;
- Apps Script validator;
- JSON/YAML validation;
- package-lock integrity / `npm ci`;
- all current package, release, transfer, checksum, allow-list, parity, provenance, and secret scans;
- local verification entrypoint;
- CI workflow syntax and actual GitHub Actions run;
- tracked-file scan proving `.clasp.json`, `.clasprc.json`, credentials, tokens, and IDs are absent;
- dev staged-payload inventory/hash;
- clasp target guard;
- clasp push result;
- remote pull-back parity;
- runtime dry-run or its exact `NOT_EXECUTED` prerequisite gap;
- clean worktree after generated artifacts are removed or ignored.

Store only safe evidence under the repository's audit conventions. Do not store account names, script IDs, deployment IDs, OAuth responses, tokens, local absolute paths, Workspace URLs, real data, or screenshots.

## 15. PR and completion requirements

Create one or more logical commits with clear boundaries. At minimum separate, where practical:

1. CI integration and repository policy;
2. local verification/clasp tooling and docs;
3. evidence/canonical status updates.

Normal push only.

Create the new stacked Draft PR and include:

- instruction number 0006;
- branch/base relation;
- relationship to PR #8 and PR #9;
- exact CI integration decision;
- changed files;
- commands run;
- GitHub Actions run URL/ID and conclusion;
- local verification results;
- clasp version;
- clasp target-guard status;
- clasp push/pull parity status;
- runtime dry-run status;
- credentials/secrets tracking scan;
- current governance status;
- remaining prerequisites;
- company-environment checks still pending;
- Review Focus.

Do not mark the new PR ready for review, merge it, merge PR #8, merge PR #9, or push to `main`.

## 16. Required final report

Begin and end with `指示番号: 0006`.

Include:

1. highest status;
2. new branch and Draft PR URL;
3. commits and parent relations;
4. PR #9 integration disposition;
5. GitHub Actions run and jobs;
6. package/tooling/docs/policy changes;
7. exact local commands and results;
8. clasp version and authenticated-dev-target status without identity/ID disclosure;
9. push result, pull-back parity, runtime dry-run result;
10. any executable source/version/release impact;
11. secrets and generated-file scan;
12. unresolved matters and next gate;
13. company handoff status;
14. Review Focus.

Do not claim company readiness merely because CI or clasp push succeeds.

# 指示番号: 0006 — END
