# Work 0035 Instruction

## Outcome

Create one clean, reviewable integration candidate from the current `main` that makes the already-qualified Code `2.8.20-prepilot` state through Work 0034 the repository's next canonical main candidate without replaying or merging the long stacked Draft-PR history.

The integration candidate must preserve the current `main` governance/rules changes, preserve the frozen Work 0034 product/release bytes, retain the evidence needed for the current project record, pass the complete applicable non-Google validation gate, and be suitable for ChatGPT's final merge review.

This Work prepares the clean main candidate. It does not itself merge to `main` or close historical Draft PRs; ChatGPT will perform those GitHub-only actions after reviewing the final diff, report, and CI.

## Why Codex is needed

The residual work is a large repository-wide tree integration across a 150-commit stacked development line that has diverged from current `main`. It requires local Git/tree operations, precise preservation of selected main-only governance paths, exact donor-byte comparison, complete local validation, and a reviewable PR diff.

Route: `C`.

Recommended Codex model: `Sol High`.

Rationale: this is a cross-cutting repository integration with conflict/preservation reasoning across divergent histories. A wrong tree selection could either lose the current main governance rules or silently alter the frozen product candidate. The final implementation is mostly mechanical, but the integration boundary and conflict handling warrant Sol High.

## Exact refs and source of truth

Repository: `Tanukitsune-hub/GAS-Project-Schedule`

Work branch: `codex/0035-clean-main-integration`

Exact instruction ref: `PENDING_THIS_COMMIT`

Current main starting commit:

`ee2e4a06e21f1755d6c735ef8dbfb25a698ecf2e`

Qualified donor / Work 0034 final commit:

`137c367cf3aeeeb56c9c50f72a9f9812f0393480`

Work 0034 report:

`docs/handoffs/0034-report.md`

Work 0033 live E2E evidence:

`docs/handoffs/0033-live-e2e-review.md`

Frozen candidate contract:

- Code: `2.8.20-prepilot`
- Schema: `2.6`
- AI Schema: `2.0`
- Migration: `3`
- Personal Gemini E2E: PASS
- Automation: OFF
- Frozen Apps Script payload SHA-256: `ced2ce52cd4a3faa46c66f0e1971a7cebb14334ca7d3f2bcb3ec79799c82effe`

## ChatGPT-completed work

ChatGPT has already:

1. independently reviewed Work 0034 and accepted the diagnosis as a test/documentation contract mismatch rather than a Task Authority product defect;
2. verified PR #49 is Draft/Open/Unmerged and mergeable;
3. verified the Work 0034 PR changes only:
   - `docs/handoffs/0034-instruction.md`
   - `docs/handoffs/0034-report.md`
   - `implementation/GoogleSpreadsheet/tests/remediation_round4_test.js`;
4. verified Work 0034 final CI run #368 is `SUCCESS`;
5. verified the current `main` and Work 0034 histories are diverged, with Work 0034 150 commits ahead and 5 commits behind current main;
6. identified the complete current-main-only governance change set relative to the old common base; and
7. created this Work 0035 branch directly from current `main`.

## Required integration decisions

### 1. Do not merge or replay the stacked donor history

Do not merge Work 0034, PR #49, or any earlier stacked branch into this branch. Do not rebase the historical stack onto main. Do not reproduce 150 historical commits.

The goal is one clean tree integration from current `main`, not preservation of the development commit graph.

### 2. Current-main governance paths are authoritative and protected

The following current-main state must be preserved exactly unless this instruction explicitly says otherwise:

- `.codex/**` remains absent as on current main; do not restore repository-scoped custom agent/model configuration.
- `.github/pull_request_template.md`
- `AGENTS.md`
- `docs/core-rules-changelog.md`
- `docs/handoff-template.md`
- `docs/handoffs/AGENTS.md`
- `implementation/GoogleSpreadsheet/AGENTS.md`

Do not replace these with older donor versions.

### 3. Frozen product source must remain donor-exact

The authored Apps Script product source and manifest under:

`implementation/GoogleSpreadsheet/apps-script-v2/`

must match Work 0034 final commit `137c367c...` byte-for-byte after integration.

No product behavior, version, schema, migration, Gemini contract, Task Authority behavior, Gmail behavior, Calendar behavior, Automation behavior, or safety guard may be redesigned or modified in Work 0035.

### 4. Current 2.8.20 release packages must remain donor-exact

At minimum, the current release packages:

- `implementation/GoogleSpreadsheet/release/v2.8.20-prepilot/`
- `implementation/GoogleSpreadsheet/release/v2.8.20-prepilot-phase8c/`

must remain exact Work 0034 donor bytes and pass their existing package/checksum/parity verification.

Historical release/evidence content needed by the current verification and provenance chain should be integrated from the donor rather than regenerated or rewritten.

### 5. Work 0034 test correction is part of the accepted donor state

The repaired `implementation/GoogleSpreadsheet/tests/remediation_round4_test.js` from Work 0034 is required. Do not revert it to the pre-0034 comparison against `Overall status`.

### 6. Preserve historical evidence; do not rewrite it

Carry forward the current historical handoff/release/audit evidence needed to make the Work 0034 repository state self-contained. Historical instruction/report files are immutable evidence and must not be rewritten to describe Work 0035.

This Work may add only its own `0035-report.md` and any minimal current-status integration record strictly necessary for validation. Do not rewrite old reports.

### 7. No company-PC rollout or Automation activation in this Work

The user has clarified that the manual system will not be deployed to a company PC. Automation validation will occur later in the personal environment.

However, Work 0035 is only main consolidation. Do not enable Automation, alter Automation defaults/approval gates, deploy a production-mode payload, call Google/Gmail/Calendar/Gemini, or perform any live runtime action.

ChatGPT will reconcile any stale next-phase wording in current status documents during final merge review if needed. Do not broaden this integration into Automation design or runtime qualification.

## Required scope

Produce a clean integration tree on `codex/0035-clean-main-integration` that:

1. is based on current main `ee2e4a06...`;
2. preserves the protected current-main governance paths above;
3. materializes the qualified Work 0034 repository/product state needed for Code `2.8.20-prepilot` and its evidence;
4. includes the accepted Work 0034 Round 4 test correction;
5. preserves exact frozen Apps Script product bytes;
6. preserves current 2.8.20 release/checksum bytes;
7. includes working locked local validation/CI tooling from the accepted donor state;
8. keeps secrets, local clasp state, private identifiers, and local paths out of Git;
9. creates `docs/handoffs/0035-report.md` after validation; and
10. leaves a clean, pushed branch and Draft PR targeting `main` for ChatGPT review.

## Non-goals

Do not:

- merge any historical stacked Draft PR;
- close historical Draft PRs;
- merge Work 0035 to main;
- rewrite shared history or force-push;
- restore `.codex/**` custom agents/config;
- change Apps Script product behavior;
- bump Code/Schema/AI Schema/Migration versions;
- change Automation defaults or activate Automation;
- change Gemini model/endpoint/request/response behavior;
- re-run synthetic Gmail/Gemini validation;
- access Google Workspace, Gmail, Calendar, Gemini, Apps Script runtime, OAuth, credentials, deployments, Cloud projects, or clasp targets;
- perform company-PC or production/pilot operations;
- delete historical evidence solely to reduce repository size; or
- create speculative cleanup/refactors unrelated to the clean integration.

## Validation and acceptance checks

The final integration must satisfy all of the following.

### Git / integration structure

- Work branch is based on current main `ee2e4a06...`.
- No donor merge commit is introduced.
- No force-push/history rewrite is used.
- Protected current-main governance paths remain byte-identical to current main, except this new Work 0035 instruction/report naturally adds files under `docs/handoffs/` without modifying `docs/handoffs/AGENTS.md`.
- `.codex/**` remains absent.

### Frozen product parity

- `implementation/GoogleSpreadsheet/apps-script-v2/` is exact Work 0034 donor parity.
- Apps Script inventory remains 23 `.gs` files plus `appsscript.json` = 24 payload files.
- Apps Script payload SHA-256 remains exactly:
  `ced2ce52cd4a3faa46c66f0e1971a7cebb14334ca7d3f2bcb3ec79799c82effe`.
- Code remains `2.8.20-prepilot`; Schema `2.6`; AI Schema `2.0`; Migration `3`.
- Automation remains OFF/default-disabled.

### Release parity

- Current Phase 8B and Phase 8C 2.8.20 release verification passes.
- A20/B20 lineage and current release/checksum checks pass under the integrated tree.
- No release byte is silently regenerated to a different value.

### Tests and tooling

Run the complete accepted donor validation path from `implementation/GoogleSpreadsheet`:

`pnpm install --frozen-lockfile`

`pnpm run verify:local`

The expected acceptance level is the Work 0034-equivalent complete gate: 11/11 gate sections, all current regression suites passing, Apps Script static/inventory validation passing, release verification passing, lineage passing, secret/local-state scan passing, and `git diff --check` passing.

If the integration itself requires a narrowly justified compatibility adjustment to non-product test/tooling because of the preserved main governance files, keep it minimal and document it. Do not change the frozen Apps Script product source to make integration tests pass.

### CI

After all local validation is green, push the final branch and require the final-head GitHub Actions CI for the Work 0035 PR to complete successfully before reporting `BLOCKER: NONE`.

Do not use repeated hosted CI as an exploratory loop when local validation can diagnose the issue.

## Stop / escalation conditions

Stop and report `BLOCKER: YES` rather than improvising if any of the following occurs:

- preserving current-main governance and donor product state proves mutually incompatible without changing product behavior;
- the Apps Script source cannot remain exact Work 0034 parity;
- the frozen payload hash changes for any unexplained reason;
- current 2.8.20 release verification/lineage cannot pass without changing release/product bytes;
- a genuine product defect is discovered;
- a required historical evidence file has conflicting provenance that cannot be resolved without rewriting history;
- integration would require restoring `.codex/**`, rewriting main history, force-pushing, or merging historical stacked branches;
- secrets/private identifiers/local state appear in the proposed diff; or
- final CI fails for an implementation-caused reason that cannot be resolved within this bounded integration scope.

Non-blocking stale narrative text about future company-PC qualification should be recorded for ChatGPT's post-integration status reconciliation rather than expanding Work 0035.

## Git / PR requirements

- Work only on `codex/0035-clean-main-integration`.
- Keep commits intentional and reviewable; do not reconstruct the 150-commit donor history.
- Push the branch.
- Open or update exactly one Draft PR targeting `main`.
- Do not merge the PR.
- Do not close or mutate the historical Draft PR stack.
- Link this instruction and `docs/handoffs/0035-report.md` in the PR body.

## Mandatory subagent use

Before starting, read all applicable `AGENTS.md` files, identify the repository-specific subagent/delegation policy, and follow it.

Use subagents actively and proportionately for useful independent work. At minimum, obtain independent analysis of the integration boundary/protected-main paths and independent final validation/review of the resulting tree/diff. Follow applicable `AGENTS.md` rules for roles, write ownership, coordination, and synthesis. Do not restore deleted repository-scoped custom-agent configuration merely to satisfy this requirement.

## Required completion report

Write `docs/handoffs/0035-report.md`, commit it, push it with the final work, and link it in the Draft PR.

The report must state concisely:

- outcome and BLOCKER status;
- starting main and donor refs;
- integration method at a high level;
- protected main governance parity result;
- donor Apps Script exact-parity result and payload hash;
- release/lineage result;
- complete local validation result;
- final CI result;
- changed-file/integration scope summary;
- confirmation that no live Google/Gmail/Calendar/Gemini/Automation/deployment operation occurred;
- any non-blocking stale narrative left for ChatGPT final review; and
- exact final commit, branch, and PR.

Return to ChatGPT only:

- Work ID
- Report path
- Final commit
- Branch
- PR
- BLOCKER status
