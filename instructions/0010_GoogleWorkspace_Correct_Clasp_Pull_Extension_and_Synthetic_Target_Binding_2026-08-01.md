# 指示番号: 0010
# Google Workspace Personal Work OS
# clasp pull拡張子契約修正／既存synthetic Sandbox再binding／remote bootstrap再開

- Date: 2026-08-01
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
- Working branch: `codex/0008-remote-gas-development-bootstrap`
- Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/11`
- Instruction 0009 result baseline: `2aee3dbebcbebc6c958716647ded706f9cd2c882`
- Parent stacked branch: `codex/0006-local-clasp-validation-gate`
- Parent Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/10`
- Candidate: Code `2.8.11-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- Canonical payload: 23 files / SHA-256 `ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1`
- Development status at start: `NO_GO_LOCAL_CLASP_VALIDATION`
- Company status at start: `NO_GO_COMPANY_HANDOFF_LOCAL_VALIDATION_FAILURE`
- Historical T11: `T11_SUSPENDED`; `NO_ACTIVE_COMPANY_TRANSFER`

## 1. Goal and mandatory execution rule

Continue in the same local workspace and on the same branch used for Instruction 0009.

Complete, in order:

1. inspect and remediate the tracked clasp pull-extension contract;
2. publish the tracked remediation and obtain current-head GitHub Actions PASS;
3. pause once for the operator to open the exact existing personal/non-company/synthetic Sandbox Apps Script project;
4. bind that project locally through a non-echoing local prompt only;
5. recover only the ignored failed access-check workspace;
6. perform one new isolated read-only access check;
7. only if the exact 23-file contract passes, perform the already-authorized single canonical push retry and independent pull-back parity;
8. only after canonical parity, complete the personal standard-Cloud/OAuth/runtime bootstrap from Instructions 0008/0009 and perform one guarded read-only `runQuickDiagnostic` runtime validation;
9. publish final evidence, update Draft PR #11, verify all GitHub Actions jobs/steps, and perform detached HTTPS fresh-clone verification.

Do not stop after analysis or after asking the operator to open the project. Pause only for the exact human-only UI/secret-entry action, then continue after the operator confirms completion.

The final report must begin and end with:

```text
指示番号: 0010
```

## 2. Confirmed current evidence

Treat the following as the formal starting evidence:

- PR #11 is Open / Draft / unmerged at baseline `2aee3dbebcbebc6c958716647ded706f9cd2c882`.
- Current-head non-Google CI and local validation pass.
- The Apps Script source, canonical `appsscript.json`, historical releases, transfer envelopes, checksums, and fixed refs are unchanged.
- User-level Apps Script API confirmation, OAuth, ignored target guard, and read-only pull transport completed.
- Post-pull validation stopped at:

```text
REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH
observed_file_count: 2
expected_file_count: 23
observed_nonfile_count: 0
```

- No target-identity inference is permitted from that shape.
- Canonical retry marker is unused.
- Canonical push, canonical pull-back parity, Cloud/OAuth bootstrap, runtime overlay, API executable, runtime call, and final fresh clone remain `NOT_EXECUTED`.

## 3. Additional blocking defect found in repository review

The current canonical local source uses `.gs` for all 22 script files and the strict pull-back allow-list expects those exact `.gs` names.

The current tracked clasp configurations and generated pull configurations specify only:

```json
{
  "scriptId": "...",
  "rootDir": "payload"
}
```

They do not explicitly set the clasp `scriptExtensions` pull contract.

Current official clasp behavior supports `scriptExtensions`, defaults to `['.js', '.gs']`, and uses the first listed extension when writing pulled server-side script files. Therefore, even after the correct target is bound, a default pull may materialize remote script files as `.js`, while this repository requires exact `.gs` names. This is an independent deterministic parity blocker and must be fixed before any new read-only pull.

Do not claim this caused the observed 2-file result. The 2-file result still requires target rebinding/reconfirmation. Treat the missing explicit pull-extension contract as a separate confirmed tooling defect.

## 4. Required repository reading

Read in full, in this order:

1. root `README.md` and `AGENTS.md`;
2. applicable `implementation/GoogleSpreadsheet/AGENTS.md`;
3. `CONTRIBUTING.md`, if present;
4. `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`;
5. `CURRENT_STATUS.md`, `DECISIONS.md`, `MASTER_PLAN.md`, `PROJECT_CONTEXT.md`;
6. `docs/local-clasp-setup.md`, `docs/development-validation-gates.md`, and `docs/company-handoff.md`;
7. Instructions `0006` through `0009` and all associated audits;
8. PR #10 and PR #11, including refs, comments, workflow runs, jobs, steps, and logs;
9. `implementation/GoogleSpreadsheet/package.json`, lockfile, clasp examples, ignore rules, tooling, and all related tests;
10. project-local `@google/clasp` `3.3.0` help/schema/source relevant to `.clasp.json`, `scriptExtensions`, pull, push, and run-function;
11. official primary clasp documentation for `scriptExtensions` and pull behavior;
12. this instruction in full.

Confirm remote, branch, HEAD, worktree, staged/unstaged/untracked state, ignored local target state, and current retry-marker state. Do not print ignored configuration, IDs, credentials, raw clasp output, or local paths.

## 5. Delegation plan

Use repository `.codex` agent definitions as authoritative.

Where materially useful:

- `luna_explorer` (read-only): inspect project-local clasp 3.3.0 extension behavior, all generated `.clasp.json` paths, strict file-name assumptions, current tests, and the target-binding recovery flow. Cite exact paths/symbols and stop on ambiguity.
- Main Codex: decide architecture, scope, security/privacy rules, status, Google operation boundaries, Git/PR decisions, and all manual operator prompts.
- One bounded `luna_executor`, only if beneficial: modify the non-overlapping tracked tooling/tests/docs files authorized below. No Google operation and no Git decision may be delegated.
- `luna_auditor` (read-only): independently verify the final diff, pull-extension contract, target guard, retry-marker discipline, secret exclusion, local/CI evidence, and remote parity/runtime claims.

No overlapping writes. Main Codex must verify every material agent claim against files, commands, logs, SHAs, or GitHub evidence.

## 6. Git and branch procedure

Continue on:

```text
codex/0008-remote-gas-development-bootstrap
```

Fetch normally. Bring this instruction commit into the same local branch by fast-forward or normal non-rewriting merge as applicable.

Do not create another implementation branch or PR unless the existing PR #11 cannot safely be updated. Do not rebase, squash, amend, reset, clean, force-push, or rewrite the preserved 0007/0008/0009 history.

Keep PR #8, #9, #10, and #11 Open / Draft / unmerged.

## 7. Implement the explicit `.gs` pull contract

Create one canonical helper for local clasp project configuration and use it everywhere a local `.clasp.json` is generated or validated.

The required non-secret configuration contract is:

```json
{
  "scriptId": "LOCAL_ONLY",
  "rootDir": "payload",
  "scriptExtensions": [".gs", ".js"],
  "htmlExtensions": [".html"]
}
```

Requirements:

1. `scriptExtensions[0]` must be `.gs` so a pull materializes canonical script names as `.gs`.
2. `.js` may remain the second accepted script extension for clasp compatibility, but it must never be first in this repository's pull configuration.
3. `htmlExtensions` must remain exactly `['.html']`.
4. Apply this contract to:
   - `.clasp.example.json`;
   - ignored `.clasp-dev/.clasp.json` migration/validation;
   - isolated access-check pull config;
   - canonical pull-back verification config;
   - runtime staging config;
   - runtime pull-back verification config;
   - any other generated clasp project config.
5. Reject missing, reordered, additional, malformed, or conflicting extension settings before any Google operation.
6. Preserve the local-only Script ID without printing it while migrating the ignored config.
7. Do not modify canonical Apps Script `appsscript.json`.
8. Do not change the canonical 23-file payload hash.

Update tracked docs and examples accordingly.

## 8. Required regression tests for the extension contract

Add or update narrow non-Google tests that prove:

1. the example and every generated clasp config use `scriptExtensions: ['.gs', '.js']`;
2. `.js`-first configuration is rejected;
3. missing `scriptExtensions` is rejected;
4. unexpected additional extensions are rejected;
5. `htmlExtensions` is exactly `['.html']`;
6. access-check, canonical pull-back, runtime staging, and runtime pull-back all use the same helper;
7. a synthetic server-side script inventory is mapped to the canonical 22 `.gs` names plus `appsscript.json`;
8. canonical file inventory and payload SHA-256 remain unchanged;
9. no Script ID, OAuth material, raw output, URL, local path, or credential can enter tracked output.

Do not weaken the strict 23-file allow-list or current negative tests.

## 9. Publish the tracked tooling fix before another Google call

Run all non-Google local checks and create a bounded tracked commit containing only the extension-contract tooling/tests/docs changes.

Normal-push the branch and update PR #11. Wait for current-head GitHub Actions. Inspect the workflow run, every job, every step, and logs. All required jobs/steps must PASS; none may be failed, cancelled, skipped, or unexecuted.

Do not perform a new target pull until this current-head CI is verified.

## 10. Human-only target reconfirmation and local binding

After the tracked fix and CI pass, pause and ask the operator to do exactly this first action:

```text
ブラウザで、これまでsynthetic Setup／Diagnosticに使用した既存の個人・非会社SandboxのApps Scriptプロジェクトを開き、「開いた」とだけ返信してください。
```

Do not ask for an ID, URL, email, screenshot, or project title in chat.

After the operator replies `開いた`:

1. Ask the operator to confirm locally that the Apps Script file list visibly contains the established Work OS source family, including `00_Config` and `Menu`. Record only:

```text
visible_work_os_source_family: CONFIRMED | NOT_CONFIRMED
```

2. If not confirmed, stop with:

```text
DEV_TARGET_ATTESTATION_FAILED
```

3. Guide the operator to Project Settings and use a local non-echoing prompt to enter the Script ID. Never paste it into chat or a report.
4. Update only the ignored local binding files with:
   - the same locally supplied Script ID;
   - `target_kind = PERSONAL_SYNTHETIC_DEV`;
   - `rootDir = payload`;
   - `scriptExtensions = ['.gs', '.js']`;
   - `htmlExtensions = ['.html']`;
   - `runtime_dry_run_allowed = false`.
5. Clear the temporary secret variable after writing.
6. Confirm only closed fields:

```text
target_configuration_present: true
target_kind: PERSONAL_SYNTHETIC_DEV
script_id_match: true
script_id_tracked: false
script_extensions_contract: GS_FIRST_CANONICAL
runtime_dry_run_allowed: false
```

Run the tracked secret/local-path scan again.

## 11. Recover and repeat only the read-only access check

Re-record the closed prerequisites for the corrected binding. This must invalidate all stale target-bound PASS evidence.

Use the existing local-only recovery command to remove only the known tool-generated failed access-check workspace. It must not contact Google, modify the target, remove or create the canonical retry marker, or expose remote names/content.

Then run exactly one new isolated read-only access check.

Required PASS:

```text
target_binding: CONFIRMED_LOCAL_ONLY
read_only_target_access: PASS
post_pull_validation: PASS
observed_file_count: 23
expected_file_count: 23
observed_nonfile_count: 0
script_extension_contract: GS_FIRST_CANONICAL
```

The operation record must remain target-fingerprint-bound and contain no names, content, ID, URL, credential, or raw output.

If the result is still not exact 23-file PASS, stop. Do not push. Classify without inference as one of:

```text
DEV_TARGET_ATTESTATION_FAILED
REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH
REMOTE_PULL_EXTENSION_CONTRACT_FAILED
DEV_TARGET_BINDING_UNRESOLVED
```

Do not create a new Apps Script project or switch to another target silently.

## 12. Canonical push and pull-back parity

Only after Section 11 passes:

1. verify the canonical retry marker is still unused;
2. rerun the full local gate and stage;
3. set the explicit local opt-in;
4. perform the single authorized canonical push retry;
5. independently pull into the ignored canonical pull-back directory using the explicit `.gs` extension contract;
6. require exact 23-file and byte-level parity;
7. run post-push status.

Required result:

```text
canonical_push: PASS
canonical_pullback_parity: PASS
file_count: 23
canonical_staged_payload_sha256: ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1
canonical_pulled_payload_sha256: ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1
script_extension_contract: GS_FIRST_CANONICAL
```

Do not use `--force`, delete remote files manually, accept partial parity, or consume another retry.

On failure, record only the closed category, counts, and hashes permitted by the tracked tooling and stop before runtime setup.

## 13. Resume the remote runtime bootstrap only after canonical parity

After Section 12 passes, resume the already-reviewed Instructions 0008/0009 runtime lane without redesigning it:

1. personal standard Google Cloud project only;
2. link the existing synthetic Apps Script project;
3. enable Google Apps Script API in that Cloud project;
4. OAuth consent in Testing mode;
5. current personal operator as test user where required;
6. one local-only Desktop OAuth client;
7. credential JSON in ignored local storage only;
8. named local clasp/OAuth profile;
9. dev-only manifest overlay adding only `executionApi.access = MYSELF`;
10. runtime-overlay push and independent pull-back parity using the explicit `.gs` extension contract;
11. one MYSELF-only API-executable deployment;
12. one guarded remote invocation of `runQuickDiagnostic` only.

At every browser step, guide the operator one minimal action at a time. Never request or expose IDs, URLs, emails, credentials, tokens, or screenshots in chat or GitHub.

The runtime result must prove the complete bounded summary, zero FAIL, all warning/failure IDs complete, all side-effect Booleans false, Task 50-column contract PASS, and Ledger 21-column hidden/protected/authority contract PASS.

Do not run Setup, Deep Diagnostic, Dashboard refresh, test harness, Task edit, Gmail, Calendar, Properties, trigger, Automation, Migration, external AI, or any other function.

## 14. Final evidence, GitHub Actions, and fresh clone

Create additive privacy-safe evidence that separates:

- tracked extension-contract remediation;
- operator target reconfirmation;
- read-only access result;
- canonical push/pull parity;
- Cloud/OAuth/runtime prerequisites;
- runtime-overlay parity;
- guarded runtime result;
- `NOT_EXECUTED` or blockers.

Do not store any identifier, URL, account detail, credential, raw clasp output, local path, remote file name/content, screenshot, or business data.

Normal-push all tracked changes and evidence to the existing branch, update PR #11, and inspect the final GitHub Actions workflow, every job, every step, and logs. All required steps must PASS.

Perform a detached HTTPS fresh clone of the final remote HEAD, install locked dependencies, rerun the full non-Google gate, confirm a clean worktree, and confirm no secret/local binding is present.

Keep PR #8, #9, #10, and #11 Open / Draft / unmerged.

## 15. Status rules

Use the highest status supported by actual evidence:

- tracked fix or CI fails:
  `NO_GO_LOCAL_CLASP_VALIDATION`
- corrected binding/access-check does not pass:
  `NO_GO_LOCAL_CLASP_VALIDATION`
- canonical push/pull parity passes, runtime not complete:
  `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION`
- canonical and runtime overlay parity plus guarded runtime pass, final CI and fresh clone pass:
  `READY_FOR_REMOTE_GAS_DEVELOPMENT_REVIEW`

Company status remains, even on full success:

```text
NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW
```

Do not declare company handoff, Phase 8B overall PASS, Phase 8C GO, production ready, or pilot ready.

## 16. Stop conditions

Stop without repair/retry when any of the following occurs:

- operator does not confirm the existing Work OS source family;
- ignored Script ID binding cannot be safely updated;
- extension contract cannot be proven;
- read-only access is not exact 23-file PASS;
- canonical retry marker is already used;
- canonical push or parity fails;
- runtime overlay is not MYSELF-only;
- any identifier/credential becomes tracked or printed;
- any unauthorized Google service or Workspace action is proposed or observed;
- any required CI job/step fails, is cancelled, skipped, or unexecuted.

## 17. Required final report

The final report must include:

1. `指示番号: 0010` at the beginning and end;
2. highest development and company status;
3. branch, final remote HEAD, PR #11 URL/state/base/head;
4. delegation used and evidence reviewed by main Codex;
5. exact tracked files changed;
6. confirmed clasp 3.3.0 extension behavior and implemented config contract;
7. local/CI commands and exact results;
8. operator target attestation closed result;
9. read-only access result;
10. canonical push/pull parity result;
11. runtime overlay/runtime result or exact blocker;
12. GitHub Actions workflow/run/job/step status;
13. detached fresh-clone result;
14. all `NOT_EXECUTED` items and unresolved matters;
15. company-side remaining work;
16. Review Focus;
17. Cache/Input/Output usage and execution metrics when available.

No completion claim is valid until the final branch is normally pushed, PR #11 is updated, required CI passes, and the final remote HEAD is GitHub-resolvable.

# 指示番号: 0010 — END
