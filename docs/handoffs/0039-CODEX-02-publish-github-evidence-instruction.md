# Work 0039 / Dispatch 0039-CODEX-02 — Publish Existing Local Result and Establish GitHub Evidence

WORK_ID: `0039`

DISPATCH_ID: `0039-CODEX-02`

BALL: `CODEX`

STATUS: `READY`

MODE: `BUILD`

Recommended model: `Luna Max` — product implementation is already reported complete locally; this dispatch is deterministic publication, remote verification, and CI evidence only.

## Primary Outcome

Publish the already-completed local Work 0039 implementation to GitHub without redesigning or reimplementing it, so ChatGPT can review the actual diff, report, release packages, bundle, tests, and CI from the GitHub source of truth.

## Current verified GitHub state

As of this dispatch creation:

- Remote branch `codex/0039-openai-provider-selection` is still at `3e302c2bc1e13c9482b208b754bc893e9a73fc70`.
- The locally reported final HEAD `e9e0fe1515170f030788cdfda34099d5c1839c31` is not present on GitHub.
- `docs/handoffs/0039-CODEX-01-openai-provider-selection-report.md` is not present on the remote implementation branch.
- `implementation/GoogleSpreadsheet/release/v2.8.26-prepilot/` is not present on the remote implementation branch.
- No Work 0039 pull request exists.

The preceding local report states:

- local final HEAD: `e9e0fe1515170f030788cdfda34099d5c1839c31`;
- implementation/release source includes commit beginning `474d66fc`;
- local `verify:local` / `verify:ci`: `13/13 PASS`, 89 suites;
- successor release paths:
  - `implementation/GoogleSpreadsheet/release/v2.8.26-prepilot/`
  - `implementation/GoogleSpreadsheet/release/v2.8.26-prepilot-phase8c/`
  - `implementation/GoogleSpreadsheet/release/work-0039-single-file-company-install/`;
- Work 0038 frozen artifacts unchanged;
- live Google/OpenAI/credentials/deployment/Automation not executed;
- OpenAI governance state `NOT_APPROVED_OR_UNKNOWN`.

These are not accepted evidence until GitHub publication and independent review.

## Fastest Safe Decisive Action

From the existing local repository and existing local branch `codex/0039-openai-provider-selection`, publish the current completed commit history exactly as it exists. Do not recreate the implementation and do not make opportunistic product changes.

## Required Actions

1. Confirm the local branch is `codex/0039-openai-provider-selection`, the worktree is clean, and local HEAD is exactly `e9e0fe1515170f030788cdfda34099d5c1839c31`.
2. Confirm the remote branch is currently an ancestor of the local branch. If it is not, stop and report a Strategy Reset condition; do not force-push.
3. Push the local branch to `origin/codex/0039-openai-provider-selection` using a normal fast-forward push only.
4. Verify from the remote after push that the branch HEAD is exactly `e9e0fe1515170f030788cdfda34099d5c1839c31`.
5. Verify the completion report and all three reported release paths are visible from the remote branch.
6. Create a Draft PR from `codex/0039-openai-provider-selection` to `main`. Do not merge it.
7. Allow the ordinary GitHub CI for the pushed final HEAD / PR to run and report its observed result. Do not claim PASS until GitHub reports PASS.
8. Confirm the two Work 0038 archive refs still point to the same exact commits:
   - `archive/0038-gemini-source-baseline` -> `272612831c4a46e45fdf166c65e3075ffee7dfef`
   - `archive/0038-gemini-company-delivery` -> `eccf27ec9f6b6fd023eca7b69279cc88741ecd9b`
9. Confirm no live Google Workspace, OpenAI, Gemini, credential, deployment, trigger, or Automation action is performed.

## Change Boundary

This dispatch is publication-only.

Do not modify product code, release contents, tests, bundle contents, version/schema/migration decisions, or the completion report merely to make the publication look cleaner.

If the local worktree is not clean, local HEAD differs from the reported HEAD, the remote branch is not an ancestor, push is rejected, or GitHub CI fails, stop and return the exact blocker rather than rewriting history or force-pushing.

## Acceptance Evidence

ChatGPT may begin substantive Work 0039 review only after all of the following are observable on GitHub:

1. remote implementation branch HEAD equals `e9e0fe1515170f030788cdfda34099d5c1839c31`;
2. completion report is readable from that ref;
3. `v2.8.26-prepilot`, Phase 8C, and Work 0039 single-file company-install release paths are readable from that ref;
4. Draft PR exists against `main`;
5. GitHub CI result for the published final HEAD is observable;
6. frozen Work 0038 archive refs are unchanged.

## Non-Goals

- no implementation redesign;
- no new provider behavior;
- no live provider request;
- no credential configuration;
- no company deployment;
- no Automation enablement;
- no merge to `main`;
- no force-push or history rewrite.

## Return

Return with:

- local HEAD before push;
- remote HEAD before and after push;
- push result;
- Draft PR number/URL/state;
- GitHub CI run ID and conclusion;
- confirmation that the completion report and all three release paths are remotely readable;
- confirmation of both frozen Work 0038 archive SHAs;
- BLOCKER / non-blocking issue classification;
- confirmation that no live external action occurred.

WORK_ID: `0039`

DISPATCH_ID: `0039-CODEX-02`

BALL: `CODEX`

STATUS: `READY`
