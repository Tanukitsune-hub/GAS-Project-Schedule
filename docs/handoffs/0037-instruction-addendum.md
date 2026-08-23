# Work 0037 Mandatory Addendum — Post-Work-0036 Squash Lineage Repair

WORK_ID: `0037`

This addendum is mandatory together with `docs/handoffs/0037-instruction.md`.

## Observed pre-Codex baseline evidence

After ChatGPT created the Work 0037 handoff branch directly from canonical merged `main` (`ca70607cba047b340b8009a03448b8d8128dc68e`), PR #52 CI run `#468` executed the unchanged Work 0036 verification gate.

Observed result:

- worktree: PASS
- generated files: PASS
- scope: PASS
- JSON: PASS
- YAML: PASS
- Apps Script inventory: PASS
- Apps Script static validation: PASS
- regression tests: PASS — 78 suites, missing 0, extra 0
- release verification: PASS — both 2.8.21 verifiers
- secret/local-state scan: PASS — zero hits
- lineage: **FAIL only** with `CURRENT_RELEASE_NOT_DIRECT_CHILD_OF_SOURCE`

This is not evidence of a product regression. GitHub `main` is the source of truth and Work 0036 was intentionally squash-merged. The merged main commit `ca70607cba047b340b8009a03448b8d8128dc68e` has the same tree as the final validated Work 0036 branch head `1b4c6d9fbdb3bc8fea96f07c5b0ff456a4010a90`, but `implementation/GoogleSpreadsheet/tools/local_validation_gate.js` still assumes the pre-squash Work 0036 `CURRENT_CONTRACT.json` release commit is directly parented by the historical source commit in the current branch ancestry.

## Required first repair

Before implementing the 2.8.22 shadow-pilot behavior, repair the lineage verifier so that future work can branch from canonical merged `main` without weakening historical proof.

The repair must:

1. Treat merged Work 0036 main `ca70607cba047b340b8009a03448b8d8128dc68e` as the current Work 0037 scope baseline.
2. Prove the squash materialization is exact, using immutable Git evidence such as exact tree equality between the merged main commit and the validated final Work 0036 head, or an equivalently strong deterministic proof.
3. Continue validating the historical pre-squash Work 0036 source/release chain using the immutable Work 0036 commits and release artifacts already recorded in the repository.
4. Preserve checks that 2.8.20 and 2.8.21 frozen artifacts remain unchanged.
5. Preserve meaningful source/release scope validation; do not simply skip, disable, or blanket-allow lineage checks after a squash merge.
6. Update/add focused local regression coverage for canonical-main squash materialization and future numbered Work branches.
7. Ensure the repaired baseline gate passes on canonical main-derived Work 0037 history before proceeding with 2.8.22 implementation.

Do **not** repair this by:

- rewriting `CURRENT_CONTRACT.json` with a fake source/release parent;
- changing historical commit identities;
- branching Work 0037 from an old unmerged branch instead of canonical main;
- weakening `CURRENT_RELEASE_NOT_DIRECT_CHILD_OF_SOURCE` into an unconditional pass;
- force-pushing or rewriting history.

## Routing impact

The recommended Codex model remains **Luna Max**. The failure is fully diagnosed and the required safety properties are fixed; residual work is bounded implementation and executable Git-history validation.

Codex must still read all applicable `AGENTS.md` files and use subagents actively and proportionately under repository policy. One subagent should independently review the lineage repair for false-positive acceptance before the main shadow-pilot implementation proceeds.

## Exact execution authority

The exact ref supplied by ChatGPT after this addendum is committed supersedes the earlier handoff-only ref.

All external-action limits from `0037-instruction.md` remain unchanged. The lineage repair is local/Git-only and authorizes no Google Workspace or provider action.
