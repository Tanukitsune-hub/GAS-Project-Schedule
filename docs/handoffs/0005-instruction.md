# Work 0005 — Repair and Prove the clasp 3.3.0 File-Inventory Contract

## Outcome

Starting from the exact completed Work 0004 safe-stop head, diagnose and repair only the local clasp placement tooling contract that allowed a guarded push to report success while the one authorized pull-back could not establish the required 23-file inventory.

This Work ID is local/non-Google only.

Successful completion means the project-local clasp 3.3.0 tooling is proven, by isolated black-box local tests where feasible, to select the exact canonical 23-file Phase 8B payload for push and to preserve the repository's `.gs` filename contract for future pull-back verification.

Highest permitted successful status:

```text
READY_FOR_FRESH_CONTROLLED_REMOTE_PLACEMENT_RETRY
```

That status authorizes nothing by itself. It does not authorize a Google target creation, inspection, push, pull, Setup, runtime function, diagnostic, deployment, Gmail, Calendar, trigger, Provider, Automation, company transfer, pilot, or production action. A later Work ID must separately authorize any new remote attempt.

## Why Codex is needed

Route C. The residual work requires the project-local clasp 3.3.0 runtime, isolated filesystem workspaces, executable black-box validation of clasp file selection/config semantics, and narrowly scoped tooling/test repair.

ChatGPT has completed the repository-side diagnosis and this handoff. Do not repeat broad repository orientation.

## Exact starting point

Repository:

```text
Tanukitsune-hub/GAS-Project-Schedule
```

Work 0004 final safe-stop head:

```text
b458705e2402b72300d2016cc592bdb79c0524e7
```

Work 0004 branch:

```text
codex/0004-controlled-synthetic-placement
```

Work 0005 branch:

```text
codex/0005-clasp-inventory-contract-repair
```

The Work 0005 branch was created directly from exact Work 0004 final head.

Exact product candidate remains unchanged:

```text
Source A12: d3f93e05e77a3cdccf24c5a5b7d8def452155841
Release B12: 0b655e6df51d7ac56c1936fb57331e03516ebe0c
Code: 2.8.12-prepilot
Schema: 2.6
AI Schema: 2.0
Migration: 3
Phase 8B TEST_MODE: true
Automation: OFF
```

Do not rebase onto `main` or another donor branch.

## Canonical inputs

Read before implementation:

```text
AGENTS.md
CURRENT_CONTRACT.json
CURRENT_STATUS.md
DECISIONS.md
PROJECT_CONTEXT.md
MASTER_PLAN.md
docs/handoffs/0004-instruction.md
docs/handoffs/0004-report.md
implementation/GoogleSpreadsheet/package.json
implementation/GoogleSpreadsheet/tools/local_clasp_dev.js
implementation/GoogleSpreadsheet/tools/work_0004_target_bootstrap.js
implementation/GoogleSpreadsheet/tests/work_0004_target_bootstrap_test.js
implementation/GoogleSpreadsheet/tests/local_clasp_validation_gate_test.js
implementation/GoogleSpreadsheet/tests/local_validation_gate_pr_merge_scope_test.js
```

The installed project-local clasp version remains pinned at:

```text
@google/clasp 3.3.0
```

Primary upstream technical reference is the official `google/clasp` documentation/source for v3.x behavior. Relevant contract points to verify against the installed code rather than assuming from prose are:

- `.claspignore` patterns are interpreted relative to `rootDir`;
- `scriptExtensions` controls accepted script extensions and the first listed extension is used when pulling script files;
- the documented default is `['.js', '.gs']`;
- `show-file-status` / status is the local file-selection surface for what push considers eligible.

Do not change the clasp dependency version in this Work ID.

## Work 0004 evidence to preserve

Work 0004 safely established all of the following and must remain immutable historical evidence:

```text
Fresh personal-synthetic target creation: 1 attempt / PASS
Target inspection: 1 attempt / PASS
Guarded clasp push: 1 attempt / command PASS
Independent clasp pull: 1 attempt / command completed
Pulled required inventory: FAIL / only 1 expected payload file recognized
Pull-back parity: NOT_REACHED
Runtime/function execution: NOT_EXECUTED
```

The Work 0004 one-use creation/push/pull authority is consumed.

Do not alter `docs/handoffs/0004-instruction.md` or `docs/handoffs/0004-report.md`.

Do not retry or reuse Work 0004 remote state.

## Current diagnosis to test, not blindly assume

The current tooling writes `.clasp.json` with `scriptId` and `rootDir: 'payload'` but does not explicitly pin `scriptExtensions`.

The canonical repository payload contains 22 `.gs` files plus `appsscript.json` and the parity checker requires those exact `.gs` filenames.

Official clasp v3 documentation states that `scriptExtensions` defaults to `['.js', '.gs']` and that the first extension is used when pulling script files. Therefore the current generated config may be inconsistent with the repository's exact `.gs` pull-back contract.

The tooling also writes an explicit `.claspignore` while using `rootDir: 'payload'`. The existing internal inventory test proves only that 23 local files exist; it does not by itself prove that clasp 3.3.0 selects all 23 for push.

Treat both points as hypotheses requiring executable local proof.

## Required-now scope

### 1. Reconfirm repository integrity

Before changes:

- fetch normally;
- confirm exact Work 0005 branch and ancestry from `b458705e2402b72300d2016cc592bdb79c0524e7`;
- confirm Work 0004 final report remains unchanged;
- confirm A12/B12 and `CURRENT_CONTRACT.json` remain unchanged;
- confirm product `.gs` source, `appsscript.json`, release packages, root `AGENTS.md`, and `.codex/**` are unchanged;
- confirm working tree is clean.

If product bytes or canonical candidate identity differ, stop with `BLOCKER`.

### 2. Reproduce the local clasp contract gap without Google

Use a temporary isolated local workspace and the project-local clasp 3.3.0 executable.

Do not use a real Script ID, target ID, account, credential, or Work 0004 ignored target state.

Prefer a synthetic placeholder identifier that satisfies only local configuration parsing.

Where the clasp command supports it, isolate `HOME` / `USERPROFILE` so no user OAuth state is available. A local file-selection proof must not depend on authentication.

Establish, as far as locally executable:

- how clasp 3.3.0 interprets the current generated `.claspignore` with `rootDir: 'payload'`;
- exactly which files `show-file-status` / equivalent local status considers push-eligible;
- how the current project config represents `scriptExtensions`;
- why the future pull-side exact `.gs` naming contract is not guaranteed by the current config.

Do not make a network request merely to reproduce the issue.

If the only available clasp surface unexpectedly requires network access, stop that path and validate using the installed clasp source/modules plus focused local tests. Do not use Google as a test fixture.

### 3. Implement the smallest repair

Make only the minimum local tooling/test changes needed to make the future contract explicit and testable.

Expected direction, subject to the local reproduction:

- explicitly pin the generated project configuration so `.gs` is the preferred pull script extension while retaining compatibility with clasp 3.3.0;
- make the push allowlist semantics unambiguous for the exact 22 `.gs` files plus `appsscript.json` under `rootDir`;
- ensure both the future target config and isolated pull-verification config use the same explicit extension contract;
- ensure future remote push cannot begin unless a local clasp-native inventory check proves exactly 23 eligible files;
- preserve strict no-extra-file behavior.

A likely explicit configuration is conceptually:

```json
{
  "rootDir": "payload",
  "scriptExtensions": [".gs", ".js"]
}
```

but do not adopt this mechanically unless the installed clasp 3.3.0 behavior confirms it.

If the simplest correct solution is to rely on clasp's documented default ignore rules rather than maintain a custom `.claspignore`, that is acceptable only if black-box/local tests prove the exact 23-file selection and no broader file inclusion.

Do not introduce a second deployment system, alternate uploader, direct Apps Script content API writer, custom fork of clasp, or dependency upgrade.

### 4. Add clasp-native regression coverage

Internal inventory counting alone is insufficient.

Add focused regression coverage that exercises the actual installed project-local clasp 3.3.0 file-selection/config path in an isolated temporary workspace where practical.

Acceptance evidence must prove at minimum:

```text
Expected canonical payload files: 23
Push-eligible files according to clasp-native selection: 23
Expected `.gs` source files: 22
Manifest files: 1
Unexpected eligible files: 0
Missing eligible files: 0
Preferred pull script extension: .gs
```

The test must fail if:

- only `appsscript.json` is eligible;
- one or more `.gs` files are ignored;
- `.js` becomes the preferred future pull filename contract;
- an extra `.js`, `.html`, documentation file, `.clasp*` file, generated state file, or unrelated file becomes eligible;
- `rootDir` or ignore semantics drift;
- the exact 23-file canonical allowlist drifts silently.

Do not assert correctness only by testing a helper that reimplements the same logic. At least one test must cross the real clasp 3.3.0 local selection/config boundary or directly exercise the installed clasp implementation used by the CLI.

### 5. Preserve the one-use remote guardrails

Work 0005 must not reset, delete, reinterpret, or bypass the Work 0004 consumed state to make a remote retry possible.

If shared tooling is changed for future Work IDs, it must continue to refuse Work 0004 retry semantics.

Do not modify ignored Work 0004 target state as part of this task except read-only local inspection if strictly necessary to understand a generic config shape. Prefer not to read it.

### 6. Run complete non-Google validation

At minimum:

```bash
cd implementation/GoogleSpreadsheet
pnpm install --frozen-lockfile
pnpm run verify:local
```

Also run:

- all new focused clasp inventory/extension tests;
- existing local clasp tests affected by the change;
- Apps Script inventory/static validator;
- Phase 8B/8C release verifiers;
- A12/B12 lineage verification;
- tracked secret/identifier/local-path scan;
- `git diff --check`.

Run all testing without Google credentials or live Google operations where possible. No test success may depend on a live target.

## Explicit forbidden operations

Work 0005 authorizes no live Google operation.

Do not perform:

- Google target creation or deletion;
- Drive API read/write against a target;
- Apps Script API project read/write;
- `clasp push` against a real target;
- `clasp pull` against a real target;
- target/binding inspection against Google;
- `clasp run` / `scripts.run`;
- Setup or any Apps Script function invocation;
- Quick/Deep Diagnostic;
- Dashboard refresh;
- Gmail or Calendar access;
- trigger creation/deletion;
- deployment/version creation;
- Cloud-project mutation;
- OAuth login, logout, re-consent, account switching, second profile, or credential rotation;
- real AI Provider request/configuration;
- Automation enablement;
- company/production resources or real data;
- deletion or cleanup of the Work 0004 synthetic target;
- merge of PR #18 or any older stacked PR.

Do not emit account identity, OAuth client IDs, credentials, tokens, Script IDs, Spreadsheet IDs, URLs, local credential paths, or Work 0004 target fingerprints in new chat output.

## Non-goals

Do not:

- change product `.gs` logic;
- change `appsscript.json` product manifest;
- change Code/Schema/AI Schema/Migration versions;
- change release payload bytes;
- change `CURRENT_CONTRACT.json` product identity;
- enable Automation;
- connect a real AI Provider;
- redesign the Worker, Task authority, Calendar, Gmail, Dashboard, Retry, or diagnostic systems;
- upgrade Node, pnpm, clasp, yaml, or other dependencies;
- modify root `AGENTS.md` or `.codex/**`;
- perform runtime validation.

## Files likely in scope

Keep changes as narrow as possible. Expected candidates:

```text
implementation/GoogleSpreadsheet/tools/local_clasp_dev.js
implementation/GoogleSpreadsheet/tools/work_0004_target_bootstrap.js
implementation/GoogleSpreadsheet/tests/local_clasp_validation_gate_test.js
implementation/GoogleSpreadsheet/tests/work_0004_target_bootstrap_test.js
implementation/GoogleSpreadsheet/tests/<new focused clasp inventory test>.js
implementation/GoogleSpreadsheet/tools/local_validation_gate.js
implementation/GoogleSpreadsheet/tests/local_validation_gate_pr_merge_scope_test.js
implementation/GoogleSpreadsheet/package.json
```

A future-work helper may be renamed/generalized only if that is clearly simpler than adding another Work-ID-specific copy and does not weaken historical one-use guards.

Do not touch unrelated files.

## Acceptance checks

### Repository

- branch descends directly from Work 0004 final head;
- product candidate remains byte-identical;
- Work 0004 report/instruction remain unchanged;
- root `AGENTS.md` and `.codex/**` unchanged;
- no secrets, real identifiers, accounts, URLs, credential paths, or machine-local sensitive state tracked;
- worktree clean at completion.

### Technical repair

- exact rootDir/ignore semantics are covered;
- clasp-native push eligibility is exactly 23 canonical files;
- `.gs` is explicitly and verifiably the preferred pull script extension;
- no custom uploader or dependency change added;
- Work 0004 remote retry remains impossible under its consumed state;
- no Google operation was executed.

### Validation

- full local gate PASS;
- focused new tests PASS;
- affected existing clasp tests PASS;
- release/lineage/secret checks PASS;
- `git diff --check` PASS;
- GitHub Actions at final head PASS.

## Git / PR requirements

Branch:

```text
codex/0005-clasp-inventory-contract-repair
```

Base PR branch:

```text
codex/0004-controlled-synthetic-placement
```

Create or update exactly one Draft PR for Work 0005.

Do not merge it.

Do not close or merge PR #18.

Commit the report:

```text
docs/handoffs/0005-report.md
```

The report must state:

- exact reproduced root cause or, if not fully reproducible, the strongest proven failure mechanism;
- exact minimal repair;
- clasp-native local inventory evidence;
- explicit pull extension contract;
- all tests/CI;
- confirmation of zero live Google operations;
- unchanged product candidate;
- limitations;
- branch/commit/PR;
- BLOCKER status.

## Stop / escalation conditions

Stop with BLOCKER if:

- fixing the issue requires a product `.gs` or manifest change;
- fixing the issue requires upgrading/replacing clasp;
- the installed clasp 3.3.0 local selection behavior cannot be made deterministic without live Google access;
- any test or tool attempts a live Google request unexpectedly;
- the canonical 23-file source/release contract is inconsistent;
- a safe repair would require weakening one-use remote guards or privacy protections;
- unrelated repository drift or unsafe local Git state prevents trustworthy validation.

If no BLOCKER remains, stop at:

```text
READY_FOR_FRESH_CONTROLLED_REMOTE_PLACEMENT_RETRY
```

Do not perform that remote retry in Work 0005.

## Codex completion response

Return only:

```text
Work ID
Report path
Final commit
Branch
PR
BLOCKER status
```
