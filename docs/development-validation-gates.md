# Development validation gates

## Current policy

Current Code is `2.8.11-prepilot`. The initial current gate is
`NO_GO_COMPANY_HANDOFF_PENDING_LOCAL_CLASP_VALIDATION`. The sole active
development lane is the self-PC, personal-synthetic local clasp gate described
in [local-clasp-setup.md](local-clasp-setup.md).

Instruction 0005 is `SUPERSEDED_NOT_EXECUTED`. Fixed T11 and all earlier
release/transfer artifacts remain immutable historical evidence; T11 is
`T11_SUSPENDED` and there is `NO_ACTIVE_COMPANY_TRANSFER`.

## Gate composition

| Gate component | Executor | Google credential | Required proof |
|---|---|---:|---|
| `verify:ci` | GitHub Actions | No | Locked local tooling, static validation, all Node suites, existing package/transfer verifiers, provenance, and secret/local-path scan. |
| `verify:local` | Self PC | No | Same non-Google checks using the lockfile. |
| `gas:stage:dev` | Self PC | No | Exact 23-file staging inventory and byte-level payload hash. |
| `gas:push:dev` | Self PC | Local only | Explicit opt-in, clean worktree, target guard, and non-Google verification before push. |
| `gas:pull-verify:dev` | Self PC | Local only | Separate ignored pull-back, exact file set, and byte-level parity. |
| `gas:test:dev` | Self PC | Local only | Explicit runtime opt-in and closed read-only side-effect result. |

GitHub Actions uses read-only repository permission and must not use clasp,
Google authentication, credentials, secrets, or a script identifier. CI is
therefore necessary evidence, but cannot prove the authenticated local lane.

## Status discipline

| Condition | Status | Company action |
|---|---|---|
| Any local or CI non-Google check fails | `NO_GO_LOCAL_CLASP_VALIDATION` | None authorized. |
| CI and non-Google local checks pass; clasp is unrun, blocked, or target is absent | `READY_FOR_LOCAL_CLASP_VALIDATION` | None authorized. |
| Push and pull-back parity pass; safe runtime is unrun | `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` | None authorized. |
| Safe runtime dry-run also passes | `READY_FOR_COMPANY_HANDOFF_REASSESSMENT` | Reassessment only; no automatic authorization. |

`DEV_TARGET_NOT_CONFIGURED`, `BLOCKED_BY_AUTH`, and `NOT_EXECUTED` are
evidence states, not PASS states. Record their code without recording IDs,
URLs, accounts, tokens, or raw remote output.

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
