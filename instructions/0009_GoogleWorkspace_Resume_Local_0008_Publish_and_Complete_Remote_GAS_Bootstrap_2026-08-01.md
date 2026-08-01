# 指示番号: 0009
# Google Workspace Personal Work OS
# local 0008成果物の安全な公開／CI確認／remote GAS bootstrap完遂

- Date: 2026-08-01
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
- Instruction branch: `codex/0009-resume-remote-bootstrap-instruction`
- Remote parent implementation branch: `codex/0006-local-clasp-validation-gate`
- Remote parent Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/10`
- Remote parent HEAD before this instruction: `6ebe881075311722d5a1563511ca80936070bc67`
- Remote Instruction 0008: `instructions/0008_GoogleWorkspace_Full_Remote_GAS_Development_Bootstrap_and_Clasp_Recovery_2026-08-01.md`
- Operator-reported local branch: `codex/0008-remote-gas-development-bootstrap`
- Operator-reported local final HEAD: `80599d4296441441ef9672f99bc5541f8d92eeb8`
- Operator-reported local lineage:
  - `c40ff47e5020c606f4d8e652a2ac6a8f5c68e1e4`
  - `9f21e44ce036dd06d6db9d7aeb65be3b6f9424ed`
  - `f56dae24b75deb51f247fefe9d4f1fb2aa78cc4b`
  - `596cd2873cc90c1d01bb786e76d6e5542a29e13d`
  - `347d9cf60aa9b9013a95666c67073ed582e0307f`
  - `80599d4296441441ef9672f99bc5541f8d92eeb8`
- Candidate: Code `2.8.11-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- Canonical 23-file payload SHA-256: `ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1`
- Starting development status: `NO_GO_REMOTE_DEVELOPMENT_BOOTSTRAP`
- Starting company status: `NO_GO_COMPANY_HANDOFF_LOCAL_VALIDATION_FAILURE`
- Historical T11: `T11_SUSPENDED`; `NO_ACTIVE_COMPANY_TRANSFER`

## 1. Goal and execution rule

Resume the **same local workspace and existing local branch** that contains the operator-reported Instruction 0007/0008 commits. Do not start over from a fresh clone and do not recreate the reported commits from memory.

Complete the work in this order:

1. obtain task-scoped outbound network permission in the Codex session;
2. verify and publish the existing local 0007/0008 history without rewriting it;
3. create the stacked Draft PR and obtain all GitHub Actions PASS evidence;
4. only after the published branch and CI are verified, resume the authenticated Google/clasp bootstrap from Instruction 0008;
5. complete canonical push/pull parity, personal standard Cloud/OAuth/API-executable setup, dev-only runtime overlay, and one guarded `runQuickDiagnostic` remote dry-run if every prerequisite passes;
6. publish final evidence, rerun CI, and perform detached HTTPS fresh-clone verification.

Do not stop after another local-only commit. A task cannot be reported complete while the branch, PR, CI, or fresh-clone evidence is absent from GitHub.

The final report must begin and end with:

```text
指示番号: 0009
```

## 2. Mandatory network preflight

Start this task in a Codex desktop/session configuration that permits outbound access to GitHub and the Google endpoints needed by project-local clasp. If the Codex UI presents a network approval dialog, pause and ask the operator to approve network access **for this task/session only**.

Before editing or performing any Google mutation, prove safe access to:

- `github.com` and GitHub API;
- repository fetch/push using the existing authenticated Git configuration;
- Google OAuth and Apps Script API endpoints used by project-local clasp.

Do not ask the operator to disable Windows Firewall, antivirus, router security, corporate policy, or system-wide protection.

Allowed GitHub preflight outcomes:

```text
GITHUB_NETWORK_ALLOWED
GITHUB_AUTH_REQUIRED
BLOCKED_BY_CODEX_NETWORK_POLICY
GITHUB_REMOTE_UNREACHABLE
```

If the result is not `GITHUB_NETWORK_ALLOWED`, stop before Google mutation with `NO_GO_REMOTE_DEVELOPMENT_BOOTSTRAP`. Do not create more local evidence commits that cannot be published.

## 3. Required repository reading

Read in full before proceeding:

1. root `README.md`;
2. root `AGENTS.md`;
3. applicable `implementation/GoogleSpreadsheet/AGENTS.md`;
4. `CONTRIBUTING.md`, if present;
5. `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`;
6. `CURRENT_STATUS.md`, `DECISIONS.md`, `MASTER_PLAN.md`, `PROJECT_CONTEXT.md`;
7. `docs/local-clasp-setup.md`;
8. `docs/development-validation-gates.md`;
9. `docs/company-handoff.md`;
10. Instructions `0006`, `0007`, `0008`, and this `0009` in full;
11. PR #8, #9, and #10 state, refs, comments, Actions, jobs, steps, and logs;
12. `.github/workflows/ci.yml`;
13. `implementation/GoogleSpreadsheet/package.json` and lockfile;
14. all clasp/bootstrap tools and their tests;
15. canonical `apps-script-v2/appsscript.json`;
16. the operator-reported local commits, after they are resolved locally;
17. official primary Google documentation relevant to current clasp login/push/pull, standard Cloud project linkage, Apps Script API execution, OAuth Desktop clients, and API executables.

## 4. Preserve and verify the local-only history

Open the existing local repository/worktree where the operator-reported branch was created.

Verify, without modifying history:

```text
current branch = codex/0008-remote-gas-development-bootstrap
current HEAD = 80599d4296441441ef9672f99bc5541f8d92eeb8
working tree = clean
```

Verify that all six reported commits exist and form the actual ancestry claimed in the completion report. Inspect the diffs and confirm:

- no Script ID, account email, URL, OAuth token, client credential, client secret, deployment ID, Cloud project ID/number, raw clasp output, local absolute path, company information, or real data is committed;
- changes remain limited to safe docs/tests/tools/evidence/canonical-status metadata as reported;
- Apps Script `.gs`, canonical `appsscript.json`, historical release, transfer, checksum, and fixed historical artifacts remain unchanged unless Instruction 0008 explicitly and safely permitted tracked tooling/tests/docs only.

If the branch, commits, ancestry, or clean state cannot be verified, stop with:

```text
LOCAL_0008_EVIDENCE_UNRESOLVED
```

Do not fabricate, squash, amend, rebase, or recreate missing commits.

## 5. Fetch and merge the formal remote instructions

After network preflight passes:

```text
git fetch --prune origin
```

Fetch:

```text
origin/codex/0009-resume-remote-bootstrap-instruction
origin/codex/0006-local-clasp-validation-gate
```

While remaining on `codex/0008-remote-gas-development-bootstrap`, merge the instruction branch by a normal non-rewriting merge:

```text
git merge --no-ff origin/codex/0009-resume-remote-bootstrap-instruction
```

Do not rebase, amend, reset, clean, force-push, or cherry-pick the local history into a rewritten chain.

Resolve any documentation/status conflicts by preserving:

- the actual safe local 0008 implementation and evidence;
- the latest formal 0008/0009 execution boundaries;
- `NO_ACTIVE_COMPANY_TRANSFER`;
- company handoff NO-GO;
- no claim that Google push/pull/runtime has passed before it actually passes.

After the merge, rerun the full tracked secret/local-path scan and all local gates before publishing.

## 6. Publish the existing local work before further Google changes

Run from `implementation/GoogleSpreadsheet/`:

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm run verify:local
pnpm run gas:stage:dev
pnpm exec clasp --version
```

Required pre-publication result:

- all current local checks PASS;
- all Node suites PASS;
- Apps Script validator PASS;
- canonical/status tests PASS;
- JSON/YAML PASS;
- release/transfer/fixed-ref verifiers PASS;
- tracked secret/local-path scan 0 hits;
- 23 files;
- payload SHA-256 `ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1`;
- project-local clasp `3.3.0`;
- clean tracked worktree after the merge commit.

Then normal-push the existing branch:

```text
git push -u origin codex/0008-remote-gas-development-bootstrap
```

No force push.

Create one stacked Draft PR:

```text
base: codex/0006-local-clasp-validation-gate
head: codex/0008-remote-gas-development-bootstrap
```

The PR must explain:

- that it preserves the local 0007/0008 history;
- the prior network-policy blocker;
- exactly which Google operations remain NOT_EXECUTED at initial publication;
- CI/local results;
- no Apps Script source/canonical manifest/release/transfer/checksum changes;
- company handoff remains NO-GO.

Add short cross-reference comments to PR #10 and the new PR. Keep PR #8, #9, and #10 Open/Draft/unmerged.

Wait for the new PR’s GitHub Actions workflow. Inspect the actual workflow run, every job, every step, and logs. All required jobs/steps must PASS. A skipped, cancelled, missing, or failed required step is not PASS.

Do not proceed to Google mutation until publication and CI are complete.

## 7. Resume Instruction 0008 Google bootstrap

After the branch is published and CI passes, resume the existing Instruction 0008 implementation rather than redesigning it.

Use only:

- the Google account currently signed in on the self-PC;
- the existing personal, non-company, non-production, synthetic Sandbox Apps Script project;
- project-local `@google/clasp` `3.3.0`;
- ignored local target/credential/state directories.

Never use or expose a company account, company project, production project, real Gmail/Calendar/business data, or company PC.

At each human-only step, pause and give **one minimal UI action at a time**. Never ask the operator to paste IDs, emails, URLs, tokens, client secrets, credential JSON, or screenshots into chat.

## 8. Diagnose the prior push safely

Use the tracked 0008 failure-classification tooling. Inspect only ignored local operation records. Keep raw clasp output local and untracked.

The prior historical failure remains:

```text
UNKNOWN_CLASP_PUSH_FAILURE
```

unless new safe evidence establishes a closed category. Do not retroactively guess it.

Before any retry, confirm:

- user-level Apps Script API enabled;
- project-local clasp OAuth authenticated;
- existing synthetic target attestation PASS;
- local Script ID binding is present, matching, ignored, and not tracked;
- read-only target access/status PASS;
- canonical local gate and stage PASS;
- retry marker is not already consumed.

The one controlled canonical retry authorized by Instruction 0008 remains the only retry.

## 9. Canonical push and pull-back parity

With the explicit terminal opt-in required by the guard, run the tracked commands in their prescribed order.

Required closed outcome:

```text
target_guard: PASS
canonical_push: PASS
canonical_pullback_parity: PASS
file_count: 23
canonical_staged_payload_sha256: ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1
canonical_pulled_payload_sha256: ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1
```

Do not use `--force`, manually alter remote files, or accept partial parity.

On failure, record only the safe category/hash/count and stop. Do not proceed to runtime deployment after canonical parity failure.

## 10. Finish all self-PC Google/Cloud manual prerequisites

Only after canonical push/pull parity passes, complete the remaining personal-dev setup described in Instruction 0008:

1. create or select one personal standard Google Cloud project dedicated to this synthetic dev lane;
2. link the existing synthetic Apps Script project to it;
3. enable Google Apps Script API in that Cloud project;
4. configure OAuth consent in Testing mode;
5. add only the current personal operator account as a test user where required;
6. create a Desktop application OAuth client;
7. save credential JSON only in an ignored local directory;
8. use the named local clasp/OAuth profile required by the tracked tooling;
9. generate the ignored dev-only manifest overlay with `executionApi.access = MYSELF` without modifying canonical `appsscript.json`;
10. push and independently pull-verify the exact runtime-overlay payload;
11. create an API-executable deployment accessible only to the deploying user;
12. record all identifiers and credentials only in ignored local state.

For each browser setting, pause and guide the operator one step at a time, then continue. Do not dump a broad checklist and terminate the task.

## 11. One guarded remote runtime validation

After all runtime prerequisites and runtime-overlay parity pass, invoke only:

```text
runQuickDiagnostic
```

exactly once through the tracked guarded runtime command.

Do not run Setup, Deep Diagnostic, Dashboard refresh, test harnesses, Task edits, Gmail, Calendar, Properties mutation, triggers, Automation, Migration, external AI, or any other function.

The bounded result must prove:

- expected summary contract ID;
- complete WARN and FAIL ID lists;
- all tracked read-only side-effect Booleans exactly `false`;
- no raw details, IDs, URLs, account information, or business data stored in evidence.

Any missing/incomplete summary, genuine FAIL, unknown/true side-effect field, or runtime transport ambiguity is a fail-closed stop.

## 12. Final evidence and publication

Create or update an additive safe audit under `audits/2026-08-01/` containing only:

- instruction number;
- Git refs and ancestry;
- network classification;
- local/CI counts and conclusions;
- project-local clasp version;
- closed authentication/target/Cloud/OAuth/deployment states;
- canonical and runtime file counts/hashes/parity;
- bounded runtime status and safe summary fields;
- all NOT_EXECUTED and blockers;
- company-side remaining work;
- no identities, IDs, URLs, credentials, raw output, screenshots, or real data.

Update canonical documents only to the status actually earned.

Normal-push final commits to the same branch and update the stacked Draft PR. Wait for the final GitHub Actions run; inspect all jobs/steps/logs. Then perform a detached HTTPS fresh clone of the final remote HEAD, run locked install and the full local verification gate, and confirm a clean worktree.

## 13. Status rules

Use the highest status actually supported:

```text
GitHub/network publication or required CI incomplete:
  NO_GO_REMOTE_DEVELOPMENT_BOOTSTRAP

Published CI/local PASS, but canonical clasp push/pull incomplete or failed:
  NO_GO_LOCAL_CLASP_VALIDATION

Canonical push/pull parity PASS; runtime prerequisites or dry-run incomplete:
  READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION

Published CI/local PASS; canonical and runtime-overlay parity PASS; MYSELF-only API executable and guarded runtime dry-run PASS; fresh clone PASS:
  READY_FOR_REMOTE_GAS_DEVELOPMENT_REVIEW
```

Company status remains at most:

```text
NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW
```

No status automatically authorizes company-PC carriage, company Sandbox operations, Phase 8B PASS, Phase 8C GO, production readiness, or pilot readiness.

## 14. Prohibited actions

- no rebase, reset, clean, amend, force push, or history rewrite;
- no fresh-clone replacement of the existing local branch before publication;
- no secrets or identifiers in GitHub/chat/logs/reports;
- no global security disabling;
- no company account/project/data/PC;
- no canonical Apps Script `.gs` or `appsscript.json` behavioral change merely to make validation pass;
- no weakening/deleting CI or tests;
- no release/transfer/tag/fixed-ref publication;
- no company handoff;
- no repeated clasp push beyond the one guarded retry authorized after prerequisites pass.

## 15. Final report

The final report must include:

1. highest development and company status;
2. verified local ancestry and merge relation to this instruction;
3. remote branch, final HEAD, stacked PR URL/state;
4. GitHub Actions run IDs, all job/step conclusions, and failure-log disposition;
5. local commands and exact closed results;
6. clasp version, target guard, canonical push/pull parity;
7. Cloud/OAuth/API-executable closed configuration states;
8. runtime-overlay parity and guarded runtime result;
9. fresh-clone result;
10. exact changed-file boundary;
11. all blockers and NOT_EXECUTED items;
12. remaining company-side smoke items;
13. Review Focus.

Do not claim completion unless all remote claims are directly verifiable on GitHub.

# 指示番号: 0009 — END
