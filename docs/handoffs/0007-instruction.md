# Work 0007 - Remote Content Diagnosis and CI Scope Stabilization

## Outcome

Determine why Work 0006 reported a successful guarded clasp push while the same fresh bound Apps Script project subsequently exposed only `appsscript.json` on pull-back, repair the local clasp round-trip contract based on evidence, and permanently remove the per-Work CI branch-allowlist maintenance that causes a new numbered Work branch/PR to begin with `UNEXPECTED_BRANCH` / `UNEXPECTED_GITHUB_HEAD_REF` failures.

This Work is diagnosis/repair only. It must not create a new Google target and must not mutate the existing Work 0006 target.

Highest permitted successful status:

`READY_FOR_FRESH_CONTROLLED_REMOTE_PLACEMENT_RETRY`

## Why Codex is needed

The residual work requires project-local clasp 3.3.0 behavior inspection, isolated executable regression tests, CI validation, and one tightly bounded authenticated read-only Apps Script content inspection of the existing Work 0006 synthetic target. These require the local/runtime environment.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Base Work: `0006`
- Exact parent commit: `7f1e87d870bdbfd628f914c73fabccef320ae816`
- Work 0006 report: `docs/handoffs/0006-report.md`
- Branch: `codex/0007-remote-content-diagnosis-ci-scope`
- Product candidate remains Code `2.8.12-prepilot`, Schema `2.6`, AI Schema `2.0`, Migration `3`, Automation OFF.

The Work 0006 target and one-use push/pull state remain consumed evidence. This handoff authorizes only the specific read-only inspection below; it does not restore or reuse Work 0006 mutation authority.

## Facts already established

Work 0006 proved all of the following before its remote operation:

- exact staged canonical payload: 23 files;
- 22 `.gs` files plus one `appsscript.json`;
- project-local clasp 3.3.0 native eligibility: exactly 23, missing 0, extra 0;
- `scriptExtensions: [".gs", ".js"]` in target and independent-pull configs;
- exact 23-name `.claspignore` allowlist;
- local/release/lineage/secret checks passed;
- pre-Google CI passed.

The authorized sequence then produced:

- fresh synthetic target creation: PASS, one attempt;
- target/binding inspection: PASS, one attempt;
- guarded clasp push: exit/command PASS, one attempt;
- independent clasp pull: command completed, one attempt;
- pulled inventory: only `appsscript.json`, 0 `.gs` files;
- parity: not reached;
- no retries.

Therefore Work 0007 must not assume the Work 0005 extension repair explains the remaining failure.

## Required-now scope

### A. Permanently repair the CI scope guard

Replace the current ever-growing explicit Work branch allowlist in the non-Google validation gate with a narrow structural policy.

Required behavior:

- Continue to accept the canonical `codex/0002-clean-integration-candidate` branch.
- Accept numbered Work branches only when the full branch name matches a strict form equivalent to:
  `codex/<exactly four digits>-<lowercase alphanumeric slug with hyphens>`.
- Apply the same structural validation to `GITHUB_HEAD_REF` in GitHub pull-request merge-ref CI.
- Continue to reject malformed names, arbitrary feature branches, `codex/r*`, `codex/instruction-*`, uppercase/mixed forms outside the strict pattern, missing slugs, and other non-Work branches.
- Preserve all existing ancestry, starting-main, governance-identity, detached/merge-ref, no-donor-merge, and fail-closed checks.
- Branch-name acceptance is CI scope only. It must not be treated as authorization for Google/external action; the committed handoff and `AGENTS.md` remain the authority.
- Add focused regression coverage proving a future unseen numbered Work branch is accepted without editing an allowlist, while malformed/unrelated branches remain rejected.

The branch-creation CI run that may already have failed before this repair is historical only. After the repair commit, both push and PR CI for the actual Work 0007 head must pass before the Google read-only probe below.

### B. Strengthen the clasp push semantic contract locally

Using only isolated/synthetic local workspaces and no Google/network operation:

1. Inspect the installed project-local `@google/clasp` 3.3.0 push implementation.
2. Build a black-box or boundary-stub regression that exercises the actual clasp push path far enough to prove whether `projects.updateContent` (or its equivalent installed API boundary) is invoked and what file inventory/type/name payload it would send for the canonical 23-file staged workspace.
3. Prove the future push contract requires:
   - one manifest;
   - 22 server-side script files;
   - zero missing/extra files;
   - correct filename normalization/type mapping;
   - an actual remote update-content request, not merely a zero-exit `No files to push` / no-op outcome.
4. If the current wrapper can report `COMMAND_PASS` for a semantic no-op, repair it so a future guarded push fails closed unless the expected update path is actually evidenced by the supported clasp behavior. Do not rely only on exit code.
5. Preserve the exact 23-file native eligibility gate from Work 0005/0006.

Do not change the product `.gs` source or manifest to satisfy clasp tooling.

### C. One read-only inspection of the existing Work 0006 target

Only after A and B are implemented, committed, pushed, and both push/PR CI pass, perform exactly one authenticated Apps Script source-content read of the existing Work 0006 synthetic bound project.

Authorization is limited to:

- the exact Work 0006 target identified from the ignored local Work 0006 evidence/state;
- the already-authorized existing personal clasp principal;
- one Apps Script read-only content operation equivalent to `projects.getContent`;
- no Drive mutation and no Apps Script mutation.

Before the call:

- verify the ignored state identifies Work ID `0006`, the expected synthetic target disposition, and the same privacy-safe fingerprint recorded by Work 0006;
- record a new Work 0007 read-attempt state before the external call so it cannot be retried under this Work ID;
- if the Work 0006 ignored evidence is absent, inconsistent, or cannot safely identify the exact target, stop with a BLOCKER. Do not recreate a target or derive an identifier from chat/GitHub.

The read-only result may be reduced only to privacy-safe evidence such as:

- total remote file count;
- server-side script / manifest / HTML counts;
- normalized canonical source-name inventory or missing/extra counts;
- content hashes/comparison results where safe;
- a closed classification of `REMOTE_HAS_23_CANONICAL_FILES`, `REMOTE_HAS_MANIFEST_ONLY`, or another precise sanitized state.

Do not emit or commit account identity, Spreadsheet ID, Script ID, parent ID, URLs, OAuth/client metadata, credentials, credential paths, raw API responses, or raw remote source bodies.

Exactly one authenticated remote source-content read is authorized. No retry.

### D. Diagnose and locally repair based on the evidence

After the single read-only classification:

- If the Work 0006 remote project contains the 23 canonical files, treat the remaining defect as a pull/materialization/verification path problem. Reproduce it locally against a synthetic remote-content stub matching the real sanitized shape and implement the smallest correction required.
- If the Work 0006 remote project contains only the manifest, treat the remaining defect as a push/update-content path or semantic-success problem. Use the local clasp push-boundary evidence from B to locate and repair the smallest wrapper/config/tooling defect.
- If the remote content is materially different from both cases, fail closed unless a local, non-Google correction is directly supported by the evidence.

For the repaired future round-trip contract, add regression coverage for both:

- actual push serialization/update invocation with 23 canonical files; and
- actual pull materialization to 22 `.gs` files plus manifest using `.gs` as the preferred extension.

Do not perform a new remote push/pull in Work 0007. The repair is validated locally only after the one read-only diagnosis.

## Non-goals / prohibited actions

Do not perform any of the following in Work 0007:

- create a Google Spreadsheet or Apps Script project;
- mutate the Work 0006 target;
- clasp push to any real target;
- clasp pull from any real target;
- a second Apps Script content read;
- target deletion or cleanup mutation;
- interactive OAuth login, logout, re-consent, account switching, alternate profile;
- Setup;
- Quick/Deep Diagnostic;
- Dashboard refresh;
- Apps Script function invocation;
- `clasp run` / `scripts.run`;
- Gmail or Calendar access;
- triggers, deployments, Cloud-project mutation;
- real AI Provider request/configuration;
- Automation enablement;
- company or production resources;
- real user/work data.

Do not reset, delete, reinterpret, or bypass the consumed Work 0004 or Work 0006 one-use mutation state.

## Files and change boundaries

Expected change area is limited to local tooling/tests and this Work handoff/report, for example:

- `implementation/GoogleSpreadsheet/tools/local_validation_gate.js`
- `implementation/GoogleSpreadsheet/tests/local_validation_gate_pr_merge_scope_test.js`
- `implementation/GoogleSpreadsheet/tools/local_clasp_dev.js`
- new/focused local clasp push/pull contract test(s)
- a narrowly scoped Work 0007 read-only diagnostic helper if required
- `implementation/GoogleSpreadsheet/package.json` only if a script entry is needed; dependency versions must remain unchanged
- `.gitignore` only if a new ignored Work 0007 state path is required
- `docs/handoffs/0007-report.md`

Do not modify:

- product `.gs` files;
- `appsscript.json` product bytes;
- release payloads;
- version/schema values;
- `CURRENT_CONTRACT.json` product identity;
- Automation or Provider settings;
- root `AGENTS.md`;
- `.codex/**`;
- dependency versions;
- historical Work 0003-0006 instruction/report files.

## Required validation

Before the single Google read-only operation:

- locked install PASS;
- CI scope structural-policy tests PASS;
- local clasp actual push-boundary test PASS;
- existing Work 0005/0006 clasp regressions PASS;
- complete non-Google local gate PASS from a clean worktree;
- `git diff --check` PASS;
- pre-read tooling commit pushed;
- push CI PASS;
- PR CI PASS.

After diagnosis/repair:

- focused repaired push/pull contract tests PASS;
- complete non-Google local gate PASS;
- release/lineage/secret/local-state checks PASS;
- `git diff --check` PASS;
- final report-head push/PR CI PASS;
- final worktree clean.

## Report requirements

Create `docs/handoffs/0007-report.md` and record:

- exact starting/final commits;
- CI scope root cause and permanent repair;
- local clasp push semantic findings;
- read-only remote-content attempt count (must be 0 or 1);
- sanitized remote-content classification/counts;
- diagnosed root cause of the Work 0006 manifest-only pull-back;
- changed files;
- tests and CI evidence;
- confirmation that no prohibited Google mutation occurred;
- remaining limitations;
- BLOCKER status;
- next recommended Work boundary.

Never include private identifiers or raw remote/provider output.

## Git / PR requirements

- Work only on `codex/0007-remote-content-diagnosis-ci-scope`.
- Keep the PR Draft and unmerged.
- Preserve linear ancestry from Work 0006 final head.
- No force push or history rewrite.
- Commit/push the report with the work.

## Success / stop conditions

Success requires all of the following:

- the per-Work explicit CI allowlist is replaced by the narrow structural Work-branch rule with regressions;
- Work 0007 final push/PR CI is green;
- exactly one or zero authorized Work 0006 read-only content calls occurred;
- the live remote state is safely classified if the call was needed;
- the remaining round-trip failure is root-caused and repaired locally with executable evidence;
- no remote mutation or new target occurred;
- no BLOCKER remains.

On success, report:

`READY_FOR_FRESH_CONTROLLED_REMOTE_PLACEMENT_RETRY`

If the exact Work 0006 target cannot be safely identified, the read-only call fails, the remote state is inconsistent, the defect cannot be locally repaired from evidence, or any prohibited action would be required, stop with an explicit BLOCKER and do not broaden scope.