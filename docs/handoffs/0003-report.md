# Work 0003 - Controlled Personal-Synthetic Remote Placement Report

## Outcome

Work 0003 reached the committed authentication stop condition before target
selection or any target mutation.

```text
WORK_ID: 0003
STATUS: READY_FOR_CONTROLLED_SANDBOX_VALIDATION
BLOCKER: USER_ACTION_REQUIRED_BLOCKER
TARGET_DISPOSITION: NOT_SELECTED
TARGET_CREATION_ATTEMPT_COUNT: 0
TARGET_INSPECTION_COUNT: 0
CLASP_PUSH_ATTEMPT_COUNT: 0
CLASP_PULL_ATTEMPT_COUNT: 0
PULL_BACK_PARITY: NOT_EXECUTED
RUNTIME_OR_FUNCTION_EXECUTION: NOT_EXECUTED
```

The existing authenticated clasp state could not satisfy the committed
personal-principal precondition without user action. The command failed closed
before writing the one-use creation state. Because that state is written before
the first target-creation API request, its confirmed absence proves that no
Spreadsheet or bound Apps Script target creation attempt began.

The successful Work 0003 status
`READY_FOR_CONTROLLED_SANDBOX_RUNTIME_VALIDATION` is therefore not justified.
The prior highest gate remains `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`.

## Exact starting candidate and ancestry

- Work 0002 completed head:
  `920b7180312e67ec522740113bc85c66758189b9`
- Work 0003 instruction commit:
  `913f1fa0c5b69e54bd0793db04d72a98e0a79123`
- Source A12:
  `d3f93e05e77a3cdccf24c5a5b7d8def452155841`
- Release B12:
  `0b655e6df51d7ac56c1936fb57331e03516ebe0c`
- Source A12 is the direct parent of Release B12: PASS.
- Release B12 and the exact Work 0002 head are ancestors of the Work 0003
  branch: PASS.
- The fetched parent branch head remained exactly the Work 0002 completed head:
  PASS.
- Product source, `appsscript.json`, both generated release packages, and
  `CURRENT_CONTRACT.json` were unchanged from Work 0002: PASS.
- Root `AGENTS.md` and `.codex/**` were unchanged within the Work 0003 branch:
  PASS.

The unchanged contract remained Code `2.8.12-prepilot`, Schema `2.6`, AI Schema
`2.0`, Migration `3`, `TEST_MODE=true` for the Phase 8B payload, Automation
OFF, external AI disabled, and the production Provider registry empty.

## Tooling and test changes

The known PR #17 failure `UNEXPECTED_GITHUB_HEAD_REF` was caused by the
non-Google repository-scope gate allowing only the Work 0002 branch name. The
gate now uses an explicit two-branch allowlist for the Work 0002 parent and the
authorized Work 0003 validation descendant. Unlisted branches, unexpected PR
contexts, donor merges, governance changes, and wrong head refs remain rejected.

Before any Google operation, a Work 0003-only privacy-safe target bootstrap was
added because the existing tooling could neither create one blank bound target
without printing identifiers nor retain a no-retry partial-creation state. The
tool:

- requires explicit Work 0003 environment opt-ins;
- accepts only an existing non-interactive personal clasp principal;
- writes actual identifiers and a random HMAC salt only under ignored local
  state;
- emits only closed results, counts, payload SHA-256, and a non-reversible HMAC
  fingerprint;
- writes the one-use state before target mutation and refuses a second creation
  attempt;
- can verify owner count, `ownedByMe`, Shared Drive absence, pending-owner
  absence, principal consistency, and bound-container consistency without
  emitting metadata;
- does not invoke Setup, a runtime function, deployment, Gmail, Calendar,
  triggers, or a Provider.

Changed tooling/test files before the report:

- `implementation/GoogleSpreadsheet/tools/local_validation_gate.js`
- `implementation/GoogleSpreadsheet/tests/local_validation_gate_pr_merge_scope_test.js`
- `implementation/GoogleSpreadsheet/tools/local_clasp_dev.js`
- `implementation/GoogleSpreadsheet/tools/work_0003_target_bootstrap.js`
- `implementation/GoogleSpreadsheet/tests/work_0003_target_bootstrap_test.js`
- `implementation/GoogleSpreadsheet/package.json`

No product `.gs` source, Apps Script manifest, release package, version/schema,
Automation default, or Provider configuration changed.

## Pre-Google validation evidence

All complete-gate commands ran in a clean LF checkout of the exact branch head
because the primary Windows checkout had pre-existing CRLF materialization in
otherwise clean tracked source files. No tracked bytes were changed to work
around that local checkout condition.

- `pnpm install --frozen-lockfile`: PASS.
- `pnpm run verify:local`: PASS, 11/11 sections and 52 current Node suites.
- Apps Script inventory: PASS, 22 `.gs` files plus `appsscript.json`.
- Phase 8B/8C release verification: PASS, 2/2 verifiers.
- A12/B12 lineage and B12 scope: PASS.
- Tracked secret/identifier/local-state scan: PASS, 447 files and 0 hits.
- Work 0003 target bootstrap synthetic-only tests: PASS, 11/11.
- Existing local clasp guard tests: PASS, 9/9.
- `git diff --check`: PASS.
- `pnpm run gas:stage:dev`: PASS, exactly 23 files.
- Guarded staging payload SHA-256:
  `59327c8322cea8d5884375cdca12935b96674cb127460cf4ca0a2df02c2107ee`.
- Locked Phase 8B package payload SHA-256 under the release-contract algorithm:
  `20314bfd4e07ef31f1fc8e5ff7aa160fc5b1add378b17fa9ba1a7f1af2665d1f`.

The two payload hashes use different committed aggregation schemes. Each was
recomputed by its own locked verifier, and byte parity between canonical source,
staging, and the Work 0002 release payload passed before remote preflight.

## GitHub Actions

The narrowly scoped tooling commits were pushed normally before any Google
preflight. Draft PR #17 remained open, unmerged, and stacked on
`codex/0002-clean-integration-candidate`.

- Pre-Google functional head:
  `02007eaf6eec9d8f4cd00fee622e0fffb3b7026a`
- Pull-request CI run: `31316098408`
- Workflow: `CI`
- Result: SUCCESS.

The final report commit is report-only. Its final-head Actions result is checked
after push and recorded in Draft PR #17 because a run ID cannot exist before the
commit containing this report.

## Authorized remote sequence result

Only the authentication preflight command was invoked, once. It returned the
closed result `USER_ACTION_REQUIRED_BLOCKER`; sensitive output was suppressed.

| Operation | Attempts | Result |
|---|---:|---|
| Authentication preflight invocation | 1 | `USER_ACTION_REQUIRED_BLOCKER` |
| Target creation API attempt | 0 | NOT_EXECUTED |
| Target/binding inspection | 0 | NOT_EXECUTED |
| Guarded `clasp push` | 0 | NOT_EXECUTED |
| Independent `clasp pull` | 0 | NOT_EXECUTED |
| 23-file pull-back parity | 0 | NOT_EXECUTED |

No target disposition or target fingerprint exists because no target was
selected or created. No retry, alternate account, second auth profile,
interactive OAuth flow, re-consent, or account switching was attempted.

## Guardrail confirmation

No Setup, Quick Diagnostic, Deep Diagnostic, Dashboard refresh, Apps Script
function, `clasp run`, `scripts.run`, Gmail, Calendar, trigger, deployment,
Cloud-project change, AI Provider operation, Automation enablement, company
resource, production resource, or real-data operation occurred. Automation
remained OFF. No target, account, OAuth, credential, URL, local credential path,
or raw provider detail is present in this report or tracked files.

## Limitation and next Work ID boundary

Work 0003 is complete through its safe-stop path with
`USER_ACTION_REQUIRED_BLOCKER`. Outside this Work ID, the user must establish or
repair one non-interactive personal clasp authorization without exposing its
identity. A new committed handoff/ref must then explicitly authorize a fresh
creation/placement tranche. It must repeat the exact candidate, full local gate,
and final-head CI checks before any target mutation; it must not reuse this
Work ID as authority for OAuth re-consent, account switching, target creation,
push, pull, runtime, or functional validation.

## Git and PR

- Branch: `codex/0003-controlled-remote-placement`
- Pre-report functional head:
  `02007eaf6eec9d8f4cd00fee622e0fffb3b7026a`
- Final report commit: `SELF`
- Draft PR: #17
- PR base: `codex/0002-clean-integration-candidate`
- Merge: NOT_PERFORMED
- Work 0003 BLOCKER: `USER_ACTION_REQUIRED_BLOCKER`
