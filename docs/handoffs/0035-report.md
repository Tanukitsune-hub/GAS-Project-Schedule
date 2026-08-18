# Work 0035 Report

## Outcome

Work 0035 created a clean integration candidate from current `main` that
materializes the qualified Work 0034 / Code `2.8.20-prepilot` tree without
merging or replaying the stacked development history.

`BLOCKER: NONE`

## Refs and integration boundary

- Work ID: `0035`
- Starting main: `ee2e4a06e21f1755d6c735ef8dbfb25a698ecf2e`
- Qualified donor: Work 0034 final `137c367cf3aeeeb56c9c50f72a9f9812f0393480`
- Work branch: `codex/0035-clean-main-integration`
- Draft PR: `#50`, base `main`
- Exact instruction ref: `33301669e994cdbf26e6485a80189a54657e6b97`

The tree was materialized from the donor onto the Work 0035 branch, then the
current-main governance paths were restored byte-for-byte. No donor merge,
rebase, force-push, history rewrite, or historical PR merge was performed.

Protected current-main paths have zero blob mismatches:

- `.github/pull_request_template.md`
- `AGENTS.md`
- `docs/core-rules-changelog.md`
- `docs/handoff-template.md`
- `docs/handoffs/AGENTS.md`
- `implementation/GoogleSpreadsheet/AGENTS.md`

The donor's seven repository-scoped `.codex/**` files were not restored;
`.codex` is absent from both the final index and filesystem. The Work 0035
instruction is preserved from the exact starting branch.

## Frozen candidate parity

The following remain byte-identical to Work 0034 donor state:

- `implementation/GoogleSpreadsheet/apps-script-v2/`
- `implementation/GoogleSpreadsheet/release/v2.8.20-prepilot/`
- `implementation/GoogleSpreadsheet/release/v2.8.20-prepilot-phase8c/`
- `implementation/GoogleSpreadsheet/tests/remediation_round4_test.js`

The candidate remains Code `2.8.20-prepilot`, Schema `2.6`, AI Schema `2.0`,
Migration `3`, `TEST_MODE=true` for the Phase 8B candidate, and Automation
OFF. The Apps Script payload remains 23 `.gs` files plus `appsscript.json`
(24 files total) with SHA-256:

`ced2ce52cd4a3faa46c66f0e1971a7cebb14334ca7d3f2bcb3ec79799c82effe`

Historical handoff/report evidence through Work 0034, the Work 0033 live-E2E
review, release implementation records, validation tests, and locked tooling
were carried forward from the donor. Historical evidence was not rewritten.

## Minimal integration tooling adjustment

`implementation/GoogleSpreadsheet/tools/local_validation_gate.js` was the
only non-governance donor file changed. The adjustment is limited to the
clean-main integration boundary: repository scope now uses current main
`ee2e4a06...`, while the existing Work 0002 contract identity remains
unchanged; lineage validation checks the preserved historical A20/B20 direct
parent relationship (`0c0304f6...` / `b321d83e...`) without importing that
stacked history into the clean branch. This is required because a clean tree
integration cannot make the historical B20 commit an ancestor without
violating the handoff's no-merge/no-replay constraint. It does not alter
product source, manifest, release bytes, or candidate identity.

## Validation

- `pnpm install --frozen-lockfile`: PASS.
- `pnpm run verify:local`: PASS, 11/11 gate sections.
- Regression suites: 73/73 PASS.
- Apps Script inventory/static validation: PASS; 23 `.gs` plus manifest.
- Phase 8B/8C 2.8.20 release verification: PASS.
- Historical A20/B20 lineage and release-only scope: PASS.
- Secret/local-state/transfer scan: PASS, 0 hits.
- `git diff --check`: PASS on the final clean worktree.
- No merge commits after current main; current main is an ancestor of the
  integration head.

The first gate run exposed only the old donor assumptions for current-main
governance and direct B20 ancestry. Those assumptions were corrected in the
minimal validation-tool change above; the complete rerun passed.

## External-action boundary and deferred narrative

No Google Workspace, Gmail, Calendar, Gemini, Apps Script runtime, OAuth,
credential, deployment, clasp, Automation, or other live operation occurred.

Some carried-forward narrative about future company-PC/environment
qualification remains historical and is intentionally not changed in this
main consolidation work. It is non-blocking and deferred to ChatGPT's final
merge review as required by the handoff. Automation remains OFF.

The required repository-defined Luna roles were requested, but Luna was not
available in this session. A standard read-only Codex explorer was used under
the repository fallback policy for independent integration-boundary analysis;
the parent agent independently reran the complete final validation and parity
checks. No delegated agent modified the tree.

## Final handoff

- Report: `docs/handoffs/0035-report.md`
- Final commit: the commit containing this report; exact SHA is recorded in
  the final completion handoff and Draft PR `#50`.
- Branch: `codex/0035-clean-main-integration`
- PR: `#50` (Draft/Open/Unmerged)
