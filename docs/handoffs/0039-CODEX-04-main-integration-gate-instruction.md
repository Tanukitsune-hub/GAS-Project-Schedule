# Work 0039 / Dispatch 0039-CODEX-04 — Main Integration Gate Preparation

WORK_ID: `0039`

DISPATCH_ID: `0039-CODEX-04`

BALL: `CODEX`

STATUS: `READY`

MODE: `BUILD`

Recommended model: `Luna Max` — the product implementation is already accepted; this is a narrow, deterministic Git/CI integration-harness task with focused tests.

## Primary Outcome

Prepare the existing Work 0039 Draft PR #55 for a normal merge-commit integration into `main` such that:

- the current accepted product/release candidate is not reopened or changed;
- PR CI remains green;
- the immediate `main` CI after the real GitHub merge commit will pass;
- later documentation/status descendants on `main` can also pass while the Work 0039 contract remains current;
- donor merges or product/release drift remain fail-closed.

Do not merge PR #55 in this dispatch. ChatGPT owns the eventual merge and final main verification.

## Authoritative inputs

Read first:

- `docs/handoffs/0039-CODEX-03-review.md`
- `docs/handoffs/0039-CODEX-03-openai-contract-retry-and-pr-ci-remediation-instruction.md`
- `docs/handoffs/0039-CODEX-03-openai-contract-retry-and-pr-ci-remediation-report.md`

Implementation branch remains:

`codex/0039-openai-provider-selection`

Existing Draft PR remains:

`#55`

## Accepted evidence — preserve and do not reopen

The Work 0039 product candidate is accepted for non-live integration:

- accepted product head before this integration-harness dispatch: `959690d0863b268dda4f707ef213c5c353653f54`;
- canonical/release source: `7c8b4c7709ab00b4d315f910b9271f3c4945b702`;
- code version: `2.8.26-prepilot`;
- push CI `33718666447`: SUCCESS;
- PR CI `33718669532`: SUCCESS;
- final PR gate: 13/13 PASS, 90 suites, missing 0, extra 0;
- OpenAI response-contract remediation: accepted;
- persisted Message State provider-switch guard: accepted;
- PR synthetic-merge scope handling: accepted;
- Work 0039 Phase 8B/8C and two-paste bundle verifier: PASS;
- txt copies: byte-identical;
- Work 0038 frozen archives/releases/bundle identities: unchanged;
- real provider/Workspace/credential/deployment/Automation actions: NOT_EXECUTED;
- OpenAI data governance: NOT_APPROVED_OR_UNKNOWN.

No CODEX-04 change may alter the canonical Apps Script product source, Work 0039 candidate releases/bundle, Work 0038 frozen artifacts, model/prompt/provider behavior, or data-governance decisions.

## Why this dispatch is required

`post_merge_validation_gate.js` routes the current `2.8.26-prepilot` Work 0039 contract to `work_0039_validation_gate.js` even after it is integrated to main.

The current Work 0039 scope gate supports:

1. the implementation branch; and
2. GitHub's temporary `refs/pull/<n>/merge` synthetic merge.

It does not yet support the real persistent `main` merge commit or subsequent documentation/status descendants on `main`.

Merging PR #55 now would therefore knowingly produce a red main CI even though the product tree is accepted. This dispatch fixes only that integration harness.

## Required integration model

The eventual integration method is fixed:

**normal GitHub merge commit**

Do not design for squash or rebase integration. Exact Work 0039 source/release commits must remain ancestors of main.

The gate must not depend on a future hard-coded merge SHA, because that SHA does not exist until ChatGPT merges the final PR.

## Required main-mode scope semantics

Extend the Work 0039 validation path with a narrowly authenticated `main` mode.

### Main-mode recognition

When the repository is on branch `main` and the Work 0039 contract is current:

1. Search the ancestry after Work 0039 `starting_main` for the single Work 0039 integration merge.
2. The recognized integration commit must be an ordinary two-parent merge.
3. Its first parent must belong to the legitimate main lineage descending from `starting_main`.
4. Its second parent must be a Work 0039 candidate lineage containing the contract's exact `source_commit` and the accepted Work 0039 release/bundle state.
5. The second-parent Work branch history from `starting_main` to that parent must contain no donor merge commit.
6. The integration merge must not resolve/alter Work 0039 product or release content away from the second parent. Main-side documentation/handoff additions may differ, but canonical Apps Script source, Work 0039 release/bundle paths, `CURRENT_CONTRACT.json`, and other candidate-governed product artifacts must match the accepted second-parent tree unless an explicitly reviewed integration-only file is listed.
7. While this Work 0039 contract remains current, there must not be a second unrecognized merge in the `starting_main..HEAD` main history. Fail closed if multiple merge candidates or ambiguous history are observed.

Do not merely accept `branch === main` or any two-parent merge.

### Descendants after integration

The main-mode gate must also pass for normal single-parent documentation/status commits made after the recognized Work 0039 integration merge, provided:

- the recognized integration merge remains an ancestor;
- no additional merge commit has appeared in the active Work 0039 history;
- product/release/source parity checks remain valid;
- Work 0038 frozen evidence remains unchanged;
- no governance/product drift is introduced.

This is required so ChatGPT can write final acceptance/status records after merge without making main CI red.

### Validation target separation

- Branch-history/donor-merge checks should inspect the actual Work 0039 second-parent lineage, not the persistent main merge commit itself.
- Static, test, release, lineage, secret, generated-file, and diff validations should continue to validate the current checked-out main tree where appropriate.
- Do not weaken current PR synthetic-merge validation.

## post_merge_validation_gate routing

Keep Work 0037 historical logic intact.

For Work 0039 `2.8.26-prepilot`, ensure `post_merge_validation_gate.js` routes branch, PR synthetic merge, real main integration merge, and allowed post-integration main descendants to the Work 0039 gate correctly.

Do not add a broad bypass to the core gate and do not special-case arbitrary CI failures into PASS.

## Focused test requirements

Add/extend deterministic Git-history tests covering at minimum:

1. Work 0039 normal branch head with no donor merge -> PASS.
2. Work branch containing an actual donor merge -> FAIL.
3. Exact GitHub PR synthetic merge over a clean Work branch -> PASS.
4. Malformed/untrusted detached PR context -> FAIL closed.
5. Real main two-parent Work 0039 integration merge -> PASS.
6. Single-parent documentation/status descendant after the recognized main integration -> PASS.
7. Main integration where the Work second-parent history itself contains a donor merge -> FAIL.
8. Main history with an additional/ambiguous merge while Work 0039 remains current -> FAIL.
9. Main integration whose merge resolution changes canonical Apps Script source or Work 0039 release/bundle candidate content relative to the Work second parent -> FAIL.
10. Main mode without a recognizable Work 0039 integration merge -> FAIL closed.

Tests must create local synthetic Git repositories/commits only. No network or external service is permitted.

## Scope / allowed files

Expected change area is limited to integration validation tooling/tests, for example:

- `implementation/GoogleSpreadsheet/tools/work_0039_validation_gate.js`
- `implementation/GoogleSpreadsheet/tools/post_merge_validation_gate.js` only if routing changes are required;
- focused Work 0039 CI/main integration test(s);
- `implementation/GoogleSpreadsheet/tests/expected_test_inventory.json`;
- relevant validation documentation/report only.

Do not modify:

- `implementation/GoogleSpreadsheet/apps-script-v2/` product source;
- `implementation/GoogleSpreadsheet/release/v2.8.26-prepilot/`;
- `implementation/GoogleSpreadsheet/release/v2.8.26-prepilot-phase8c/`;
- `implementation/GoogleSpreadsheet/release/work-0039-single-file-company-install/`;
- Work 0038 frozen paths/refs;
- code/schema/AI schema/migration versions;
- OpenAI/Gemini configuration or runtime behavior.

If an unexpected product/release change appears necessary, stop and Strategy Reset rather than expanding scope.

## Required verification

Run and report:

- focused Work 0039 branch/PR/main-integration scope tests;
- all current `*_test.js` suites and inventory;
- `node implementation/GoogleSpreadsheet/tools/validate_apps_script_v2.js`;
- Work 0039 release verifier, proving candidate artifacts remain exactly valid and source remains `7c8b4c7709ab00b4d315f910b9271f3c4945b702`;
- Work 0038 frozen preservation;
- `pnpm install --frozen-lockfile`;
- `pnpm run verify:local`;
- `pnpm run verify:ci` on the branch head;
- secret/local-state scan;
- `git diff --check`.

After local verification:

1. normal fast-forward push to `codex/0039-openai-provider-selection`;
2. keep PR #55 Draft/open/unmerged;
3. confirm push CI SUCCESS;
4. confirm PR CI SUCCESS against latest main;
5. confirm Work 0039 product/release paths are unchanged from the accepted CODEX-03 candidate;
6. confirm both Work 0038 archive refs unchanged.

## Pre-merge simulation evidence

Before returning, create a local synthetic merge using:

- a representation of latest `origin/main` as first parent; and
- the final CODEX-04 branch head as second parent;

then execute the same CI gate in a `main` branch context and demonstrate PASS. Also make one documentation-only descendant after that synthetic integration commit and demonstrate PASS.

This is a simulation only. Do not push a merge commit and do not modify real main.

## External/live boundary

Do not perform:

- merge of PR #55;
- real OpenAI/Gemini request;
- credential access/configuration;
- Google Workspace/Apps Script deployment;
- OAuth action;
- trigger mutation;
- Automation enablement;
- company-environment inspection.

All live/runtime states remain NOT_EXECUTED and OpenAI governance remains NOT_APPROVED_OR_UNKNOWN.

## Return report

Create:

`docs/handoffs/0039-CODEX-04-main-integration-gate-report.md`

Report:

- starting branch head;
- final branch head;
- exact changed files;
- main-mode recognition design;
- donor-merge protections retained;
- merge-resolution drift protection;
- focused test results;
- total suite inventory;
- local/CI-equivalent results;
- synthetic main merge simulation and descendant results;
- push CI run ID/conclusion;
- PR CI run ID/conclusion;
- confirmation that accepted Work 0039 product/release hashes and source commit are unchanged;
- Work 0038 archive SHAs;
- BLOCKER/non-blocking issue classification;
- confirmation that PR #55 is still Draft/open/unmerged;
- confirmation that all live external actions remain NOT_EXECUTED.

## Completion condition for CODEX-04

Return to ChatGPT only when the integration gate is green on branch/PR and the local synthetic real-main merge plus descendant simulations PASS, with no product/release drift.

ChatGPT will then perform the actual merge using merge method `merge`, verify real main CI, write final acceptance/status records, and apply the Work 0039 Completion Latch.

WORK_ID: `0039`

DISPATCH_ID: `0039-CODEX-04`

BALL: `CODEX`

STATUS: `READY`
