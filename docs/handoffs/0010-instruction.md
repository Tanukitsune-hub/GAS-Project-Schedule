# Work 0010 — Fresh Controlled Remote Placement After Push-Semantic Repair

## Outcome

Validate the exact Work 0007 repaired clasp 3.3.0 push/pull contract against one new personal-synthetic Google target, with no production/company data or runtime execution.

Success means all of the following are proven in one bounded sequence:

1. the exact candidate remains unchanged;
2. the repaired guarded push performs a real 23-file Apps Script content update rather than an exit-zero no-op;
3. one read-only post-push content inspection proves the remote project contains exactly 22 server scripts plus one manifest;
4. one independent isolated pull materializes exactly 22 `.gs` files plus `appsscript.json`;
5. pulled bytes/hashes exactly match the staged canonical 23-file payload;
6. final local validation and GitHub Actions pass with no BLOCKER.

Highest permitted successful status:

`READY_FOR_CONTROLLED_SANDBOX_RUNTIME_VALIDATION`

## Why Codex is required

Route C. This Work requires the local authenticated development environment, project-local clasp 3.3.0, executable validation, one-use local state, and tightly bounded Google Apps Script/Drive operations that cannot be safely completed by GitHub-only work.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Required branch: `codex/0010-fresh-controlled-remote-placement`
- Starting parent / Work 0007 final head: `3f54d2a90c38ea574db6bd20ab8341d27d82a183`
- Work 0007 status: `READY_FOR_FRESH_CONTROLLED_REMOTE_PLACEMENT_RETRY`
- Work 0007 BLOCKER: `NONE`
- Product candidate: Code `2.8.12-prepilot`
- Schema: `2.6`
- AI Schema: `2.0`
- Migration: `3`
- Automation: OFF
- Source A12: `d3f93e05e77a3cdccf24c5a5b7d8def452155841`
- Release B12: `0b655e6df51d7ac56c1936fb57331e03516ebe0c`
- Canonical staged payload: exactly 23 files = 22 `.gs` + `appsscript.json`
- Canonical staged payload SHA-256 established by prior Work: `59327c8322cea8d5884375cdca12935b96674cb127460cf4ca0a2df02c2107ee`

## ChatGPT-completed work

ChatGPT has already:

- inspected `docs/handoffs/0007-report.md` at the exact final head;
- verified PR #21 is Draft/Open/Unmerged and points to the exact Work 0007 final head;
- verified Work 0007 final PR CI is SUCCESS;
- confirmed the Work 0007 root cause: prior plain `clasp push` could exit zero without calling `projects.updateContent` when non-interactive confirmation resolved false;
- confirmed the Work 0007 repair requires project-local clasp `--json push --force`, exact 23-file semantic evidence, and fail-closed rejection of empty/noncanonical results;
- confirmed Work 0007 locally proved one `projects.updateContent` call containing 22 `SERVER_JS` + one manifest and proved the same synthetic remote shape pulls back as 22 `.gs` + manifest;
- confirmed the CI scope gate now structurally accepts valid `codex/<4-digit-work-id>-<lowercase-hyphenated-slug>` branches without per-Work allowlist edits while retaining ancestry/governance/no-merge checks;
- intentionally skipped Work IDs 0008 and 0009 because those IDs are already used by historical repository branches.

Do not redo broad repository orientation or reopen already-proven Work 0007 design decisions unless new material evidence contradicts them.

## Required-now scope

### A. Safe repository/environment preflight

Before any Google operation:

1. Verify the exact branch and ancestry.
2. Fetch and fast-forward safely if needed; do not overwrite local work.
3. Require a clean worktree before any external mutation.
4. Confirm Git identity is configured without emitting values.
5. Confirm Node, pnpm, project-local clasp 3.3.0, and locked dependencies.
6. Confirm existing clasp authorization non-interactively using the existing personal principal without emitting account identity, OAuth metadata, credentials, IDs, URLs, or credential paths.
7. Confirm product `.gs`, product `appsscript.json`, releases, versions/schemas, `CURRENT_CONTRACT.json` product identity, Automation/Provider settings, root `AGENTS.md`, and `.codex/**` are unchanged from Work 0007.
8. Re-stage the exact committed canonical payload bytes.
9. Run the actual project-local clasp native file-selection gate and require exactly 23 eligible files: 22 `.gs` + manifest, missing 0, extra 0.
10. Confirm generated clasp configuration uses `rootDir: "payload"`, `scriptExtensions: [".gs", ".js"]`, and the exact canonical 23-name allowlist.

### B. Work 0010 one-use tooling/state

Implement only the smallest Work 0010-specific tooling/state changes needed to safely execute this Work.

Requirements:

- use a distinct ignored Work 0010 creation/execution/read state;
- never read, reset, delete, reinterpret, or reuse Work 0004 or Work 0006 consumed mutation state as authority;
- never reuse Work 0004 or Work 0006 targets as Work 0010 targets;
- record each external attempt atomically before the corresponding call begins;
- refuse retries after creation, push, post-push content read, or pull attempt begins;
- retain the Work 0007 repaired push semantics exactly: project-local clasp `--json push --force`, exact 23-file semantic evidence, and fail-closed no-op rejection;
- preserve privacy-safe output: no account identity, target IDs, Script IDs, Spreadsheet IDs, URLs, OAuth/client metadata, credentials, raw provider responses, source bodies, or credential paths in GitHub, chat, logs, reports, or tracked files.

### C. Pre-Google validation and publication

Before any Google mutation:

1. Run focused Work 0010 one-use/state tests.
2. Run the Work 0007 push/update-content contract regression.
3. Run clasp-native inventory/extension regression.
4. Run CI-scope structural regression including an unseen valid future numbered Work branch and malformed branch rejection.
5. Run the complete clean-worktree local validation gate.
6. Run release/lineage/secret/local-state checks and `git diff --check`.
7. Commit and push the pre-Google tooling head.
8. Require both push and pull-request GitHub Actions for that exact pre-Google head to pass.

If pre-Google CI is not green, do not perform any Google mutation.

## Exact authorized external sequence

If and only if every precondition above passes, the following sequence is authorized once.

### 1. Authentication preflight

- At most one non-interactive closed auth/principal preflight.
- Must use the already-authenticated personal principal.
- Interactive login, re-consent, logout/login cycling, account switching, and alternate profiles are forbidden.

### 2. Fresh target creation

- Exactly one fresh blank personal-synthetic Google Spreadsheet creation attempt.
- Exactly one bound Apps Script project for that new Spreadsheet.
- The target must be owned solely by the authenticated personal principal, not a shared drive/company resource.
- Do not create a second target if creation is ambiguous or fails after the attempt begins.

### 3. Binding/ownership inspection

- At most two total read-only binding/ownership inspections.
- Must prove the new target is the created personal-synthetic target and its Apps Script project is bound to it.
- If evidence is incomplete or inconsistent, stop.

### 4. Repaired guarded push

Immediately before push:

- rerun actual clasp-native eligibility and require exactly 23 canonical files;
- require the staged payload hash to match the canonical committed payload;
- require Work 0010 one-use state to show no prior push attempt.

Then perform exactly one guarded push using the Work 0007 repaired command path.

The push is successful only if all are true:

- project-local clasp exits successfully;
- semantic JSON evidence proves exactly 23 pushed local files;
- evidence contains exactly 22 `.gs` sources plus `appsscript.json`, missing 0, extra 0;
- empty/zero-file/noncanonical output fails closed;
- no second push is attempted.

### 5. One post-push remote content read

After and only after successful semantic push evidence:

- perform exactly one read-only Apps Script content inspection of the new Work 0010 target;
- require remote content to contain exactly 23 files: 22 server scripts + one manifest, HTML 0, invalid 0;
- require canonical normalized remote script names with missing 0 and extra 0;
- do not emit source bodies or identifiers;
- if remote content is not exactly canonical, stop before pull and report the blocker; do not retry or push again.

### 6. One independent isolated pull

After and only after the post-push remote content read passes:

- prepare a new isolated pull workspace;
- use `rootDir: "payload"` and `scriptExtensions: [".gs", ".js"]`;
- perform exactly one clasp pull attempt;
- require exactly 23 materialized payload files: 22 `.gs` + `appsscript.json`, missing 0, extra 0;
- compute exact byte/hash parity against the staged canonical payload;
- require exact parity PASS;
- do not retry the pull after the attempt begins.

## Explicit non-goals / forbidden actions

This Work does NOT authorize:

- reuse or mutation of Work 0004 or Work 0006 targets;
- second target creation;
- second push or second pull;
- cleanup deletion of any historical or new target;
- interactive OAuth login/re-consent/logout/account switching/profile switching;
- Setup;
- Quick Diagnostic or Deep Diagnostic;
- Dashboard refresh/repair;
- any Apps Script function invocation;
- `clasp run` or `scripts.run`;
- Gmail access;
- Calendar access;
- trigger creation/edit/deletion;
- deployment creation/edit/deletion;
- Cloud-project mutation;
- real AI Provider request/configuration;
- Automation enablement;
- Phase 8C deployment;
- company/production resources;
- real personal/business data;
- merge, force-push, history rewrite, release, or production/pilot declaration.

## Acceptance checks

Successful Work 0010 requires all of the following:

- exact Work 0007 ancestry preserved;
- candidate/release/product bytes unchanged;
- complete local gate PASS;
- pre-Google push CI PASS;
- pre-Google PR CI PASS;
- auth preflight count <= 1 and PASS;
- fresh target creation attempts = 1 and PASS;
- target inspections <= 2 and PASS;
- native pre-push eligible files = 23 exactly;
- guarded push attempts = 1;
- push semantic evidence = exactly 23 canonical local files;
- post-push read attempts = 1;
- remote files = exactly 22 server scripts + 1 manifest;
- pull attempts = 1;
- pulled files = exactly 22 `.gs` + 1 manifest;
- pull-back byte/hash parity = PASS;
- prohibited operations = 0;
- final local gate PASS;
- final report-head GitHub Actions PASS;
- final worktree clean;
- Draft PR remains open and unmerged;
- no BLOCKER remains.

If successful, report:

`STATUS: READY_FOR_CONTROLLED_SANDBOX_RUNTIME_VALIDATION`

`BLOCKER: NONE`

## Stop / escalation conditions

Stop safely and do not work around the condition if any of the following occurs:

- required branch/ref/ancestry is inconsistent;
- worktree cannot be made safely clean without disturbing unrelated work;
- auth requires interaction/re-consent/account switching;
- pre-Google CI is not green;
- target ownership/binding is ambiguous;
- creation attempt fails after beginning;
- clasp-native eligibility is not exactly 23 canonical files;
- push JSON evidence is absent, empty, malformed, or not exactly 23 canonical files;
- post-push remote content is not exactly 22 server scripts + one manifest;
- pull does not return exactly 22 `.gs` + manifest;
- byte/hash parity fails;
- any retry would be required after an authorized one-use attempt began;
- safe continuation would require broader Google access, mutation, runtime execution, or scope/design change.

Use a precise blocker code that describes the first material failed boundary. Do not reuse `REMOTE_PULLBACK_UNEXPECTED_CONTENT` if the actual failure boundary is now push semantic evidence or post-push remote content.

## Git / PR requirements

- Work only on `codex/0010-fresh-controlled-remote-placement`.
- Preserve linear ancestry from Work 0007 final head.
- Do not merge donor branches or historical stacked PRs.
- Stage only in-scope files.
- Write `docs/handoffs/0010-report.md`.
- Commit and push all completed in-scope work and the report.
- Create/update one Draft PR for Work 0010 with base `codex/0007-remote-content-diagnosis-ci-scope`.
- Link both instruction and report in the PR body.
- Record privacy-safe attempt counts, semantic counts, validation evidence, final commit, and final CI run identifiers.
- Keep the PR Draft/Open/Unmerged.
- Confirm the final worktree is clean.

## Report requirements

The report must include:

- outcome/status/BLOCKER;
- exact starting ref and final commit;
- candidate preservation evidence;
- changed files and material decisions;
- local/focused test results;
- pre-Google CI evidence;
- auth/creation/inspection/push/read/pull attempt counts;
- push semantic file count and classification;
- post-push remote content classification/counts;
- pull materialized counts and exact parity result;
- guardrail/prohibited-operation confirmation;
- limitations/deferred work;
- branch/PR/final CI/clean-worktree evidence.

Do not include secrets, credentials, identifiers, account details, private URLs, source bodies from the remote target, or raw Google responses.

## Completion response

Return only:

- Work ID
- Report path
- Final commit
- Branch
- PR
- BLOCKER status
