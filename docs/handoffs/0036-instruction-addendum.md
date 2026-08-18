# Work 0036 Instruction Addendum

This addendum is mandatory and supplements
`docs/handoffs/0036-instruction.md`. If there is a conflict, this addendum
controls. All other Work 0036 requirements remain unchanged.

## New evidence after Work 0035 merge

The automated review of the final Work 0035 tree identified two repository-
evidence issues that do not change the accepted Code `2.8.20-prepilot`
product result:

1. `implementation/GoogleSpreadsheet/tools/local_validation_gate.js` still
   accepts any regression inventory of at least 49 `*_test.js` files, although
   the final CI-validated main tree contains 74 suites. This could allow future
   silent deletion of up to 25 suites while the remaining tests pass.
2. `docs/handoffs/0035-report.md` records the 73-suite Codex completion state,
   while ChatGPT's later final-review commit added
   `work_0035_main_post_merge_gate_test.js` and final CI #374 executed 74
   suites.

The second point is not permission to rewrite the historical Work 0035 report.
That report truthfully records the Codex completion boundary before ChatGPT's
final-review commit. The final 74-suite result is separately recorded in the
merged PR #50 review/consolidation evidence.

## Additional required scope

Work 0036 must update the active regression-inventory contract so the complete
suite set cannot silently shrink.

Use the simplest robust design, preferably one of:

- a deterministic committed manifest of expected current `*_test.js` paths,
  checked exactly by the local validation gate; or
- another exact inventory/fingerprint mechanism that fails on unexpected
  deletion and is intentionally updated when a Work adds or removes a suite.

A numeric floor alone is insufficient unless it is mechanically tied to the
exact final Work 0036 inventory and cannot conceal a renamed or deleted suite.

Requirements:

- begin from the accepted 74-suite final Work 0035 inventory;
- include every new Work 0036 regression suite in the final expected inventory;
- fail closed on a missing, renamed, or silently removed expected suite;
- continue to execute every present expected suite;
- keep unexpected extra suite handling explicit and deterministic;
- add focused tests for missing, renamed, removed, and newly added suite cases;
- keep this change in local validation/test tooling only; do not modify the
  frozen 2.8.20 product or historical release bytes for this issue; and
- report the exact final suite count and inventory/fingerprint evidence in
  `docs/handoffs/0036-report.md`.

## Evidence wording requirement

Do not rewrite `docs/handoffs/0035-report.md` to claim 74 Codex-completion
suites. In current Work 0036 reporting, distinguish:

- Work 0035 Codex completion: 73 suites at
  `0cfa8e9c175868dd0812405d59b2a18be82fedd2`; and
- Work 0035 ChatGPT final-review/main integration: 74 suites at final-head CI
  #374 and merged main commit
  `4c28231dc08dc89ee7a529cb0a6192325263c810`.

This evidence correction is required before Work 0036 may report
`BLOCKER: NONE`.
