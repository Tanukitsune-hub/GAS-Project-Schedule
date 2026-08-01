# Development validation gates

## Current policy

Current Code is `2.8.11-prepilot`. Instruction 0008 supersedes Instruction
0007 after its safe push failure and establishes a full remote-development
bootstrap. The current gate remains fail-closed until GitHub publication,
closed failure classification, user-level API/OAuth/target access, canonical
push/pull parity, personal standard-Cloud setup, dev-runtime overlay parity,
MYSELF-only API executable, one read-only remote runtime, current-branch CI,
and a fresh HTTPS clone all pass. Company handoff remains NO-GO.
The active development status is `NO_GO_REMOTE_DEVELOPMENT_BOOTSTRAP` because
GitHub CLI connectivity and every authenticated remote gate are incomplete.

Instruction 0005 is `SUPERSEDED_NOT_EXECUTED`. Fixed T11 and all earlier
release/transfer artifacts remain immutable historical evidence; T11 is
`T11_SUSPENDED` and there is `NO_ACTIVE_COMPANY_TRANSFER`.

## Gate composition

| Gate component | Executor | Google credential | Required proof |
|---|---|---:|---|
| `verify:ci` | GitHub Actions | No | Locked local tooling, static validation, all Node suites, existing package/transfer verifiers, provenance, and secret/local-path scan. |
| `verify:local` | Self PC | No | Same non-Google checks using the lockfile. |
| `gas:stage:dev` | Self PC | No | Exact 23-file staging inventory and byte-level payload hash. |
| `gas:access-check:dev` | Self PC | Local only | Isolated read-only target pull before the one controlled canonical retry. |
| `gas:push:dev` | Self PC | Local only | Explicit opt-in, clean worktree, target guard, and non-Google verification before push. |
| `gas:pull-verify:dev` | Self PC | Local only | Separate ignored pull-back, exact file set, and byte-level parity. |
| `gas:stage:runtime-dev` | Self PC | No | Canonical manifest byte preservation plus a separate MYSELF-only runtime overlay/hash. |
| `gas:runtime-auth-check:dev` | Self PC | Named local OAuth only | Closed verification of the named personal runtime profile; raw output stays ignored. |
| `gas:runtime-prerequisites:dev` | Self PC | Local only | Closed standard-Cloud/API/OAuth attestations after canonical parity and before runtime-overlay push. |
| `gas:runtime-config:dev` | Self PC | Local secret input only | Closed Cloud/OAuth/deployment attestations and a masked deployment binding under ignored local state. |
| `gas:push:runtime-dev` | Self PC | Named local OAuth only | Guarded same-target runtime-overlay push after Cloud/OAuth prerequisites. |
| `gas:pull-verify:runtime-dev` | Self PC | Named local OAuth only | Separate runtime pull-back and exact dev-runtime payload parity. |
| `gas:test:runtime-dev` | Self PC | Named local OAuth only | Exactly one `runQuickDiagnostic`; bounded complete IDs and false side effects. |

GitHub Actions uses read-only repository permission and must not use clasp,
Google authentication, credentials, secrets, or a script identifier. CI is
therefore necessary evidence, but cannot prove the authenticated local lane.

## Status discipline

| Condition | Status | Company action |
|---|---|---|
| Any GitHub/local/OAuth/target/canonical parity/runtime-bootstrap check fails | `NO_GO_REMOTE_DEVELOPMENT_BOOTSTRAP` | None authorized. |
| Push and pull-back parity pass; safe runtime is unrun | `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` | None authorized. |
| All local/CI/canonical/Cloud/OAuth/runtime/fresh-clone checks pass | `READY_FOR_REMOTE_GAS_DEVELOPMENT_REVIEW` | Remote-development review only; company handoff remains blocked. |

`DEV_TARGET_NOT_CONFIGURED`, `BLOCKED_BY_AUTH`, and `NOT_EXECUTED` are
evidence states, not PASS states. Record their code without recording IDs,
URLs, accounts, tokens, or raw remote output.

For Instruction 0007, `CLASP_PUSH_FAILED` remains a blocking historical
result and never proves remote byte visibility. Instruction 0008 authorizes
one new controlled canonical retry only after the failure classifier and all
closed prerequisites pass. The tool writes the ignored attempt marker before
calling clasp and rejects a second attempt.

## Evidence requirements

Each evidence record must state:

- source branch and commit;
- CI run URL/ID and conclusion;
- exact non-Google command results and lockfile use;
- local clasp version without credential output;
- staged, pushed, and pulled payload hashes/counts when performed;
- runtime dry-run status and its absence/presence of the closed side-effect
  contract;
- `NOT_EXECUTED`, blockers, company-side remaining work, and review focus.

The operator must never infer that the personal-target declaration proves a
non-company target. That is a manual review item. No evidence changes an Apps
Script source file, release package, transfer envelope, or fixed historical
reference.
