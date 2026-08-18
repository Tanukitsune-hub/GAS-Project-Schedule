# Work 0034 — Frozen Candidate CI Regression Convergence

## Outcome

Restore a green complete CI/local validation gate for the already live-qualified and product-code-frozen Code `2.8.20-prepilot` candidate, without reopening Gemini/provider development or changing deployed Apps Script bytes unless a genuine product defect is proven.

The user-controlled personal-sandbox Gemini E2E has already PASSED on the frozen candidate. That result is recorded separately in `docs/handoffs/0033-live-e2e-review.md`.

Current problem: after ChatGPT recorded the live E2E PASS in documentation only, GitHub Actions run `363` failed twice, both times only at the Node regression suite `remediation_round4_test.js`. In both attempts:

- worktree: PASS
- generated-files: PASS
- scope/governance: PASS
- JSON/YAML: PASS
- Apps Script inventory: PASS
- Apps Script static validation: PASS
- release verification: PASS
- A20/B20 lineage: PASS
- secret/local-state scan: PASS
- tests: FAIL only as `NODE_REGRESSION_SUITE_FAILED_remediation_round4_test.js`

The exact Apps Script product payload hash remained `ced2ce52cd4a3faa46c66f0e1971a7cebb14334ca7d3f2bcb3ec79799c82effe` and was not changed by the documentation updates. Original Work 0033 final-head CI #351 was SUCCESS before the E2E documentation-only updates.

Success for this Work is one explained root cause, the smallest safe correction if needed, and a green complete final-head gate/CI while preserving the frozen product payload unless an actual product defect is demonstrated.

## Route and recommended Codex model

Route: `C — Codex diagnose/implement/validate`.

Recommended model: `Sol High`.

Rationale: the residual work is a reproducible but currently opaque regression failure that appeared after documentation-only commits, while the product code is frozen and live E2E-qualified. Root-cause discrimination between test-fixture nondeterminism, CI/environment sensitivity, hidden repository coupling, and a genuine authority-protocol defect requires careful cross-cutting diagnosis. Do not use a more expensive model unless materially necessary.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Branch: `codex/0034-frozen-ci-regression-convergence`
- Starting commit before this instruction: `c00273830f116dfdb4194104887bfd409c51735a`
- Parent Work: `0033`
- Parent PR: `#48`
- Frozen candidate: Code `2.8.20-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- Product Apps Script source payload SHA-256: `ced2ce52cd4a3faa46c66f0e1971a7cebb14334ca7d3f2bcb3ec79799c82effe`
- Automation: `OFF`
- Personal Gemini E2E: `PASS`
- Failing GitHub Actions run: `363`, failed twice on `remediation_round4_test.js`

Use the committed Work 0034 instruction head as the exact execution ref once fetched.

## Mandatory repository setup and subagents

Before doing any diagnosis or edits:

1. read the root and all applicable closer `AGENTS.md` files;
2. identify the repository-specific subagent policy and follow it;
3. actively use subagents proportionately and independently under that policy;
4. specifically use independent diagnosis and independent final-validation perspectives; do not keep all reasoning in the main agent;
5. read this handoff fully;
6. read current `CURRENT_STATUS.md`, `DECISIONS.md`, `PROJECT_CONTEXT.md`, and `MASTER_PLAN.md`;
7. verify exact branch/ref, upstream, remote state, and clean worktree.

Do not modify `AGENTS.md` or `.codex`.

## ChatGPT-completed work

ChatGPT already:

- accepted the user-supplied bounded live Gemini result as meeting every predeclared personal E2E condition;
- recorded the result in `docs/handoffs/0033-live-e2e-review.md`;
- updated current status/planning docs and PR #48 to enter product-code freeze;
- confirmed original Work 0033 CI #351 was SUCCESS;
- confirmed run #363 failed after documentation-only updates;
- reran run #363 once; the same suite failed again;
- inspected both run summaries and confirmed every gate except the Node test step passes;
- confirmed the failing suite is `implementation/GoogleSpreadsheet/tests/remediation_round4_test.js`;
- confirmed the Apps Script product payload hash remains unchanged.

Do not redo broad Gemini/provider investigation or personal live validation.

## Residual scope

### 1. Reproduce the exact failing test locally

Run `remediation_round4_test.js` directly enough to expose the specific failing case/assertion and safe error message, then run it repeatedly if needed to determine determinism.

Capture only safe local evidence. No Google, Gmail, Calendar, OAuth, Apps Script remote, Gemini, credential, or external runtime calls are authorized.

### 2. Diagnose before editing

Determine whether the failure is:

- test nondeterminism or order dependence;
- CI/Linux/Node-version sensitivity;
- fixture/global-state leakage;
- timing/randomness dependence;
- an unintended effect of repository/document changes;
- or a real Task Authority protocol defect.

Use git history/diff only as needed. The fact that original Work 0033 CI passed and only documentation changed afterward is evidence, not proof that the test is wrong.

### 3. Smallest safe fix

Preferred order:

1. fix a deterministic test/fixture defect without changing Apps Script product bytes;
2. fix a local validation harness defect without changing product bytes;
3. only if a genuine product defect is proven, stop before changing Apps Script source and report BLOCKER with the exact defect and required new product-code Work. Do not silently break the code freeze inside Work 0034.

Do not weaken assertions merely to make CI green. Preserve the authority-protocol safety property being tested.

### 4. Validation

After the smallest permissible fix:

- run the affected test repeatedly enough to show the failure is converged;
- run the complete current local gate;
- require every current test suite PASS;
- require Apps Script static/inventory validation PASS;
- require release verification PASS;
- require A20/B20 lineage PASS;
- require secret/local-state scan PASS;
- require `git diff --check` PASS;
- prove the frozen Apps Script product payload SHA-256 remains exactly `ced2ce52cd4a3faa46c66f0e1971a7cebb14334ca7d3f2bcb3ec79799c82effe` unless this Work stops as BLOCKER for a genuine product defect;
- push exact final head and require GitHub Actions SUCCESS.

No real Google or Gemini operation is part of this Work.

## Non-goals

- No Gemini request or provider change.
- No new synthetic Gmail run.
- No Task/Review/Calendar live validation.
- No Automation enablement.
- No company-environment work.
- No deployment or clasp push/pull.
- No API-key access/change.
- No PR-stack consolidation or merge to `main`.
- No broad refactor or cleanup.
- No change to current release identity/version solely for a test fix.

## Acceptance checks

PASS requires all of the following:

1. the exact failing Round 4 case/assertion is identified and explained;
2. the root cause is classified as test/harness/environment or genuine product defect;
3. if non-product, the smallest correction is implemented without weakening the tested safety invariant;
4. frozen Apps Script payload hash remains unchanged;
5. repeated focused test runs pass;
6. complete local gate passes;
7. final-head GitHub Actions passes;
8. no Google/Gemini/credential/external runtime operation occurs;
9. no unrelated cleanup or consolidation is mixed into this Work.

If a real product defect is proven, PASS is not permitted: stop with `BLOCKER: PRODUCT_CODE_FREEZE_BREAK_REQUIRED` and provide the exact evidence and smallest recommended successor Work.

## Git / PR requirements

- Work only on `codex/0034-frozen-ci-regression-convergence`.
- Keep history linear and reversible; no force-push, rebase, history rewrite, merge to parent/main, or release/deployment action.
- Stage only in-scope files.
- Create/maintain a Draft PR based on `codex/0033-gemini-invalid-request-schema-compatibility`.
- Write `docs/handoffs/0034-report.md` and commit/push it with the work.
- Link both instruction and report in the PR.

## Stop / escalation conditions

Stop and report BLOCKER if:

- the failure reproduces as a genuine Apps Script authority-protocol defect;
- fixing it requires changing frozen product Apps Script bytes;
- the tested safety invariant would need weakening;
- another previously green material gate now fails for a product-relevant reason;
- credentials/private IDs/real Google data would be required;
- the branch/ref or repository state is unsafe or inconsistent.

Do not work around a blocker by skipping the suite, deleting assertions, disabling CI, or changing the product code under the guise of a test repair.

## Codex chat return

Return only:

- Work ID
- Report path
- Final commit
- Branch
- PR
- BLOCKER status
