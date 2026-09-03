# Work 0039 / Dispatch 0039-CODEX-04 — Main Integration Gate Report

WORK_ID: `0039`

DISPATCH_ID: `0039-CODEX-04`

BALL: `CHATGPT`

STATUS: `COMPLETE — MAIN INTEGRATION GATE PREPARED / PR UNMERGED`

## Outcome

The Work 0039 validation path now authenticates the implementation branch,
GitHub PR synthetic merge, a normal two-parent Work 0039 merge into `main`,
GitHub's detached main-push checkout, and permitted post-merge documentation or
status descendants without weakening donor-merge or product-drift rejection.

Draft PR #55 remains open, Draft, and unmerged. This dispatch did not alter the
accepted Work 0039 product source, candidate releases, company bundle, current
contract, or any Work 0038 frozen artifact.

## Git state and changed files

- Starting branch head: `959690d0863b268dda4f707ef213c5c353653f54`
- Integration-tooling head: `f7241c559d8d9365ee7a6b49b825549aa4e64930`
- Final branch head: `SELF` (the commit containing this report)
- Latest `origin/main` used for pre-merge simulation:
  `a3026f02d51e13de4894294e08816fd2c7b784b6`
- Accepted Work 0039 product head:
  `959690d0863b268dda4f707ef213c5c353653f54`
- Accepted source/release lineage commit:
  `7c8b4c7709ab00b4d315f910b9271f3c4945b702`

Changed files are exactly:

- `implementation/GoogleSpreadsheet/tools/work_0039_validation_gate.js`
- `implementation/GoogleSpreadsheet/tests/work_0039_ci_scope_test.js`
- `docs/handoffs/0039-CODEX-04-main-integration-gate-report.md`

`post_merge_validation_gate.js` required no change: its existing current-contract
routing already sends Work 0039 branch, PR, and main checkouts to the Work 0039
gate. Work 0037 post-merge validation code remains unchanged.

## Main-mode recognition and fail-closed boundaries

Main mode does not trust the branch name alone. It requires exactly one merge
on the main first-parent history after Work 0039 `starting_main`, requires that
commit to have exactly two parents, and proves:

- the first parent descends from the recorded `starting_main`;
- the second parent descends from the accepted Work 0039 product head and
  contains the exact accepted source commit;
- the Work-side `starting_main..second-parent` history has no donor merge;
- the integration commit preserves `CURRENT_CONTRACT.json`, Apps Script source,
  all three Work 0039 candidate release/bundle paths, release builder/verifier
  inputs, and `CURRENT_STATUS.md` from the second-parent tree;
- the current main tree still matches the accepted candidate on immutable
  product/release paths;
- post-merge descendants do not alter `AGENTS.md` or `.codex` governance;
- an absent, malformed, additional, nested, or ambiguous merge fails closed.

This permits ordinary single-parent documentation/status descendants after the
recognized integration while the Work 0039 contract remains current.

## Focused and full local validation

All tests were local and synthetic. No network or external service was used by
the focused Git-history suite.

| Validation | Observed result |
|---|---|
| Work 0039 branch/PR/main scope suite | PASS; 12 cases |
| Required branch with no donor merge | PASS |
| Work branch donor merge | rejected |
| Valid PR synthetic merge | PASS |
| Malformed/untrusted PR context | rejected |
| Real two-parent main integration shape | PASS |
| GitHub detached main-push shape | PASS |
| Documentation/status descendant | PASS |
| Work second-parent donor merge | rejected |
| Additional main merge | rejected |
| Merge-resolution product drift | rejected |
| Main without recognized integration | rejected |
| Post-integration product drift | rejected |
| Apps Script static validator | PASS; 11/11 |
| Test inventory | PASS; 90 suites; missing 0; extra 0; fingerprint `5ec666a3e25e541221caf2cd135bb1615ff746c6a87787e21ccff2c0a5cfdc3e` |
| `pnpm run verify:local` | PASS; 13/13 |
| `pnpm run verify:ci` | PASS; 13/13 |
| Work 0039 release verifier | PASS; source parity, checksums, txt identity, deterministic rebuild |
| Work 0038 frozen preservation | PASS; changed frozen paths 0; bundle blob identities unchanged |
| Secret/local-state scan | PASS; hits 0 |
| `git diff --check` | PASS; errors 0 |

The 90-suite aggregate retains the existing Work 0037 post-merge and historical
lineage regression coverage.

## Latest-main synthetic integration evidence

The first simulation used an unpushed detached worktree only:

- first parent: latest `origin/main`
  `a3026f02d51e13de4894294e08816fd2c7b784b6`;
- second parent: Work 0039 integration-tooling head
  `f7241c559d8d9365ee7a6b49b825549aa4e64930`;
- synthetic ordinary merge commit:
  `f94b8fa07e4c34ef4131bdd7cdc6fbfb25990fa8`;
- main-push-context `pnpm run verify:ci`: PASS 13/13, 90 suites,
  donor merges 0, protected product drift 0;
- documentation-only descendant:
  `a0a0f54e2c39a16886cb1e51bcd7895cd15afce7`;
- descendant main-push-context `pnpm run verify:ci`: PASS 13/13, 90 suites,
  same integration merge recognized, donor merges 0, protected product drift 0.

The final report-bearing branch head is re-simulated before return. Its exact
final simulation evidence is appended to Draft PR #55 without changing main.

## GitHub CI

For integration-tooling head
`f7241c559d8d9365ee7a6b49b825549aa4e64930`:

- push CI run `33746121456`: `SUCCESS`
  (https://github.com/Tanukitsune-hub/GAS-Project-Schedule/actions/runs/33746121456)
- pull_request CI run `33746127289`: `SUCCESS`
  (https://github.com/Tanukitsune-hub/GAS-Project-Schedule/actions/runs/33746127289)

The report-only final head is also required to pass both checks before return;
those final run IDs are appended to PR #55 as publication evidence.

## Accepted product and frozen evidence preservation

The accepted and post-change Git object identities are unchanged:

- `CURRENT_CONTRACT.json`: `4a2ae0595c3b88d032e90ede8bccbc7852a3c32e`
- Apps Script source tree: `ebcd81e21fa0def5a2e053a47900fb315e4e3abc`
- Phase 8B tree: `2a26b2afa09cd0f13cb9c09180863cb9a73e7fe4`
- Phase 8C tree: `066892caf1b45b10be60cd569f3b7c3bd70a5ead`
- Work 0039 company bundle tree:
  `e6b919ec7a7d9bc3f8adab6de9a33025271c9598`

Work 0038 remains frozen:

- `archive/0038-gemini-source-baseline`:
  `272612831c4a46e45fdf166c65e3075ffee7dfef`
- `archive/0038-gemini-company-delivery`:
  `eccf27ec9f6b6fd023eca7b69279cc88741ecd9b`
- Phase 8B tree: `fc1691d6dda976e154511313186414b10236a5ac`
- Phase 8C tree: `f26d38da8e9fc6499950c4a5f63bf03d392288ec`
- company bundle tree: `da75892220a1eb3f7148a58dec52df5237fd7d12`

## Issue and external-action status

- BLOCKER: none for CODEX-04 completion.
- Non-blocking limitation: actual PR merge and real main CI remain owned by
  ChatGPT after this dispatch; OpenAI data governance remains
  `NOT_APPROVED_OR_UNKNOWN`.
- PR #55 merge: `NOT_EXECUTED`.
- Real OpenAI/Gemini requests, credential access/configuration, Google
  Workspace, OAuth, deployment, Trigger, Automation, and company-environment
  operations: all `NOT_EXECUTED`.
