# Work 0037 Completion Report

## Outcome

`BLOCKER: NONE`

The Work 0037 post-Work-0036 squash-lineage repair and the label-gated
Personal Shadow Pilot were implemented, validated, and placed once on the
existing personal-synthetic Apps Script target. The independent pull-back
completed with exact byte/hash parity.

The highest permitted status is:

`READY_FOR_USER_PERSONAL_SHADOW_PILOT`

Automation remained OFF throughout this Work. The user-controlled 24-hour
pilot was not run. This Work did not process Gmail, invoke Gemini or any
Apps Script function, mutate Task/Review/Calendar, create or delete triggers,
run Setup/readiness/diagnostics, inspect a credential value, or access any
company or production environment.

## References and preserved evidence

- Work ID: `0037`
- Instruction ref: `57442e9631e0d54f1f90443c6274f8d319159f1d`
- Instruction: `docs/handoffs/0037-instruction.md`
- Mandatory addendum: `docs/handoffs/0037-instruction-addendum.md`
- Branch: `codex/0037-personal-shadow-pilot`
- Draft PR: `#52`, kept Draft/Open/Unmerged
- Starting canonical main: `ca70607cba047b340b8009a03448b8d8128dc68e`
- Current product source correction commit: `3e0f79229179e42addd9e3e0ae58b664f9c56031`
- Current release regeneration commit: `6b4e7bdf0e1fc525df5f5d46856c56788157682e`
- Pre-placement delivery head: `797467a102e7ee61a5768e4b195eaa03a4f9b16b`

The final report commit is the commit that adds this file; its exact SHA is
returned in the Work 0037 completion fields. No historical stacked PR was
merged, and no merge, rebase, force-push, or history rewrite was performed.

The baseline lineage repair recognizes the exact Work 0036 squash
materialization on canonical main by proving the expected main tree, parent,
validated Work 0036 commit, and historical source/release ancestry. Historical
pre-squash proof remains separate from current Work 0037 source/release proof.
The frozen Code `2.8.20-prepilot` and `2.8.21-prepilot` release packages and
reports were preserved unchanged.

## Minimal implementation

The current candidate is Code `2.8.22-prepilot`, Schema `2.6`, AI Schema
`2.0`, Migration `3`, `TEST_MODE=true` for Phase 8B, and Automation OFF.

The pilot contract is bounded as follows:

- admission requires Inbox plus `手動/取込`;
- `手動/除外` wins over the import label;
- spam, trash, and non-Inbox candidates are excluded;
- the pilot source mode is `AUTOMATIC_PILOT` and is distinct from manual and
  historical qualification modes;
- one message is admitted per run and the existing five-minute lifecycle is
  preserved;
- the manual worker fails closed with the fixed pilot-active error while the
  pilot boundary is active;
- the existing Message State, Task/Review, Calendar, idempotency, one-call,
  no-retry, no-fallback, privacy, and Automation-OFF boundaries remain in
  force.

The current source/release contract, manifests, checksums, verifiers, status,
and lineage agree on the candidate. The new placement tool uses a fresh
Work-0037-specific one-use state and reads Work 0036 placement evidence only
as historical evidence, never as mutation authority.

## Local validation

- Git identity: configured
- Node: ready
- pnpm: ready
- Project-local clasp: `3.3.0`, ready
- Existing clasp authorization: ready; identity suppressed
- Worktree: clean before placement and after placement
- `git diff --check`: PASS
- Work 0037 pilot tests: 10/10 PASS
- Work 0037 lineage materialization tests: 8/8 PASS, including tree and
  parent false-positive cases
- Work 0037 placement contract tests: 31/31 PASS
- Complete deterministic regression inventory: 81 suites; missing 0, extra 0
- Apps Script inventory: 23 `.gs` files plus harness/manifest payload as
  expected by the source gate
- Static validator: PASS
- Complete local validation gate: 11/11 PASS
- Phase 8B and Phase 8C release verifiers: PASS
- Current source/release lineage: PASS
- Historical 2.8.20/2.8.21 preservation: PASS
- Secret/local-state scan: PASS, zero hits

The pre-placement exact head was published and its GitHub Actions CI passed:

- push CI: run `32626305081`, SUCCESS
- pull-request CI: run `32626306726`, SUCCESS

## Automation-OFF evidence

The committed bounded evidence in
`docs/handoffs/0036-live-ai-schema-failure-fix-addendum.md` was required by
the placement lane and confirmed without invoking an Apps Script function:

- status: `CONSISTENT`
- enabled: `false`
- desired enabled: `false`
- owned clock triggers: `0`
- stored trigger ID: absent
- canonical trigger: absent
- duplicate triggers: `0`
- runtime function: `NOT_EXECUTED`
- Automation mutation: `NOT_EXECUTED`

No Automation status function, readiness function, trigger operation, or
runtime execution was performed in Work 0037.

## Existing-target placement and parity

The actual project-local clasp-native eligibility gate passed immediately
before the authorized source update:

- eligible files: `23`
- `.gs` files: `22`
- `appsscript.json`: `1`
- missing: `0`
- extra: `0`
- `scriptExtensions`: `[".gs", ".js"]`
- preferred pull extension: `.gs`
- staged/pulled payload inventory SHA-256:
  `62b07f5c73d3d00ed9ffc9be5c1a56cbeda1e731942e2a218880b21477bcdb07`

The authorized external sequence completed exactly once per operation:

| Operation | Attempts | Result |
|---|---:|---|
| Guarded Phase 8C source update/push | 1 | PASS; semantic update-content evidence, 23 files, 22 `.gs`, 1 manifest, missing 0, extra 0 |
| Independent isolated pull-back | 1 | PASS; 23 files, 22 `.gs`, 1 manifest, missing 0, extra 0 |
| Pull-back byte/hash parity | 1 | PASS; staged and pulled inventory matched exactly |

The state reached `PULL_PARITY_PASS`. A pre-operation inventory check first
failed closed with `DIRTY_WORKTREE_REFUSED` because the new Work 0037 ignored
workspace patterns had not yet been committed. No target operation, push, or
pull attempt began in that check. The exact Work 0037 paths were added to
`.gitignore`, the repair head was pushed and revalidated by CI, and the state
was safely restaged before the single push and single pull. No state was
deleted or reused, and no retry followed an external attempt.

## Delivery and remaining boundary

The final report head is pushed to `codex/0037-personal-shadow-pilot`, Draft PR
`#52` is Open and Unmerged, and final report-head CI is required and recorded
after this report is pushed. The next step is separately user-controlled and
must follow the committed runbook; it is not part of Work 0037. Ordinary
personal Inbox mail remains outside the pilot admission scope.
