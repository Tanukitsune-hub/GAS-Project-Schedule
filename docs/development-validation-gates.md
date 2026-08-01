# Development validation gates

## Current policy

Current Code is `2.8.11-prepilot`. Instruction 0008 supersedes Instruction
0007 after its safe push failure and establishes a full remote-development
bootstrap. Instruction 0009 then normally published the preserved history and
obtained current-head CI success. The user-level API confirmation and target
guard passed, but the required isolated read-only pull observed `2` files
instead of the exact `23`-file allow-list. This closed
`REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH` blocks canonical mutation. Company
handoff remains NO-GO and the active development status is
`NO_GO_LOCAL_CLASP_VALIDATION`.

Instruction 0005 is `SUPERSEDED_NOT_EXECUTED`. Fixed T11 and all earlier
release/transfer artifacts remain immutable historical evidence; T11 is
`T11_SUSPENDED` and there is `NO_ACTIVE_COMPANY_TRANSFER`.

## Gate composition

| Gate component | Executor | Google credential | Required proof |
|---|---|---:|---|
| `verify:ci` | GitHub Actions | No | Locked local tooling, static validation, all Node suites, existing package/transfer verifiers, provenance, and secret/local-path scan. |
| `verify:local` | Self PC | No | Same non-Google checks using the lockfile. |
| `gas:stage:dev` | Self PC | No | Exact 23-file staging inventory and byte-level payload hash. |
| `gas:bind:dev` | Self PC | No remote call | Non-echoing local-only Script ID entry after UI attestation; rewrites only ignored binding files with the exact `.gs`-first clasp extension contract. |
| `gas:access-check:dev` | Self PC | Local only | Isolated read-only pull: exact 23-file parity for an established target, or the separate exact two-file non-executable blank-project preflight when a new bound synthetic target is explicitly approved. |
| `gas:access-recover:dev` | Self PC | No remote call | Explicitly attested cleanup of only a failed, non-empty ignored access-check workspace after binding correction; it cannot consume or remove a retry marker. |
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

## clasp pull-extension contract

The project-local `@google/clasp` `3.3.0` configuration contract is exact:
`scriptExtensions` is `['.gs', '.js']` and `htmlExtensions` is `['.html']`.
Because clasp uses the first configured extension when materializing a pull,
this makes `.gs` the canonical local representation. The shared generator and
target guard enforce this before access-check, canonical pull-back, runtime
staging, and runtime pull-back. A missing, `.js`-first, additional, malformed,
or legacy conflicting extension setting is a fail-closed local validation
error; the 23-file exact allow-list and canonical payload hash are unchanged.

Target attestation selects exactly one remote preflight contract. Existing
targets remain subject to `EXISTING_CANONICAL_PAYLOAD_V1` and exact 23-file
shape. An explicitly approved new blank Spreadsheet-bound personal synthetic
target uses `NEW_BLANK_BOUND_SCRIPT_V1`: exactly one empty/default server script
and one non-executable manifest. The blank preflight is accepted only before
the single guarded initial canonical push; pull-back parity after that push is
still the unchanged 23-file canonical contract.

## Status discipline

| Condition | Status | Company action |
|---|---|---|
| GitHub publication or required CI is incomplete | `NO_GO_REMOTE_DEVELOPMENT_BOOTSTRAP` | None authorized. |
| Published CI/local pass, but canonical push/pull is incomplete or fails | `NO_GO_LOCAL_CLASP_VALIDATION` | None authorized. |
| Push and pull-back parity pass; safe runtime is unrun | `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` | None authorized. |
| All local/CI/canonical/Cloud/OAuth/runtime/fresh-clone checks pass | `READY_FOR_REMOTE_GAS_DEVELOPMENT_REVIEW` | Remote-development review only; company handoff remains blocked. |

`DEV_TARGET_NOT_CONFIGURED`, `BLOCKED_BY_AUTH`, and `NOT_EXECUTED` are
evidence states, not PASS states. Record their code without recording IDs,
URLs, accounts, tokens, or raw remote output.

For Instruction 0007, `CLASP_PUSH_FAILED` remains a blocking historical
result and never proves remote byte visibility. Instruction 0008 authorizes
one new controlled canonical retry only after the failure classifier and all
closed prerequisites pass. The tool writes the ignored attempt marker before
calling clasp and rejects a second attempt. A successful read-only pull with a
noncanonical payload shape is `REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH`; it records
only a closed category, output hash, exit state, and bounded counts, then stops
without consuming the canonical retry. Access evidence is bound to an ignored
local hash of the current binding. Recording prerequisites, a binding change,
or a failed access check revokes an earlier access PASS. A canonical push
requires a matching persisted successful access record with the exact 23-file
shape, not just a remembered PASS state. The only recovery from a noncanonical
access-check workspace is the separately attested local-only
`gas:access-recover:dev` step after the operator confirms the intended
personal synthetic target; it never contacts Google or removes a canonical
retry marker.

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
