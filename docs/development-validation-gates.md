# Development validation gates

## Current policy

Current Code is `2.8.11-prepilot`. Instruction 0010 used the explicitly
approved new blank, spreadsheet-bound, personal synthetic target. Its separate
two-file blank preflight passed, and an independent pull-back then proved exact
`23`-file canonical byte parity at the approved payload hash. The operator also
reported one first-time Setup result as `COMPLETE`; that report is not a
standalone API-executable diagnostic and does not establish Phase 8B overall
PASS. Instruction 0011 then passed personal Cloud/OAuth prerequisites, named
OAuth verification, and exact MYSELF-only runtime overlay parity. Its sole
standalone runtime attempt stopped as `BLOCKED_BY_AUTH` without a bounded
diagnostic body. A correctly versioned MYSELF-only executable was created and
bound only after that stop, so it remains untested under the exactly-one rule.
Instruction 0013 independently proved the corrected binding was a visible
versioned deployment rather than HEAD-only, then consumed its one deployed-
version `runQuickDiagnostic` attempt. No bounded diagnostic body was returned;
the closed result is `REMOTE_QUICK_DIAGNOSTIC_FAILED_CLOSED`, with safe subtype
`VERSIONED_RUNTIME_FUNCTION_NOT_FOUND`. No retry is permitted.
The active development status remains
`READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` as readiness, not runtime PASS.
Functional acceptance is `ATTEMPTED_FAILED_CLOSED` and `REVIEW_REQUIRED`.
Company handoff remains
`NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW`.

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
| `gas:authorize-interactive-blank-push:dev` | Self PC | No remote call | Reclassifies an exact `Skipping push.` no-op and authorizes one normal interactive manifest-confirmation push only after the remote is independently re-proven blank. |
| `gas:record-interactive-blank-push:dev` | Self PC | No remote call | Records only the operator's closed 23-file success confirmation; independent pull-back parity remains mandatory. |
| `gas:prove-interactive-blank-push:dev` | Self PC | Read-only target pull | If operator confirmation was missed, accepts no inference and proves the result only through an exact 23-file canonical byte-parity pull. |
| `gas:push:dev` | Self PC | Local only | Explicit opt-in, clean worktree, target guard, and non-Google verification before push. |
| `gas:pull-verify:dev` | Self PC | Local only | Separate ignored pull-back, exact file set, and byte-level parity. |
| `gas:stage:runtime-dev` | Self PC | No | Canonical manifest byte preservation plus a separate MYSELF-only runtime overlay/hash. |
| `gas:runtime-auth-check:dev` | Self PC | Named local OAuth only | Closed verification of the named personal runtime profile; raw output stays ignored. |
| `gas:runtime-prerequisites:dev` | Self PC | Local only | Closed standard-Cloud/API/OAuth attestations after canonical parity and before runtime-overlay push. |
| `gas:runtime-config:dev` | Self PC | Local secret input only | Closed Cloud/OAuth/deployment attestations and a masked deployment binding under ignored local state. |
| `gas:push:runtime-dev` | Self PC | Named local OAuth only | Guarded same-target runtime-overlay push after Cloud/OAuth prerequisites; clasp `--force` is confined to the ignored MYSELF-only manifest overlay. |
| `gas:pull-verify:runtime-dev` | Self PC | Named local OAuth only | Separate runtime pull-back and exact dev-runtime payload parity. |
| `gas:test:runtime-dev` | Self PC | Named local OAuth only | Exactly one `runQuickDiagnostic`; bounded complete IDs and false side effects. |
| `gas:prepare-runtime-retry:0013` | Self PC | No | Preserves the Instruction 0011 failed-attempt record and creates one separate ignored Instruction 0013 marker before any new Google call. |
| `gas:preflight-runtime-retry:0013` | Self PC | Named local OAuth, read-only | Lists deployments once and records only closed counts/Booleans proving the ignored local binding is one visible versioned deployment, not HEAD-only. |
| `gas:test:runtime-dev:0013` | Self PC | Named local OAuth only | Requires the passed Instruction 0013 preflight, marks the attempt before the call, and invokes only `runQuickDiagnostic` once with clasp `--nondev`. |
| `gas:prepare-runtime-retry:0014` | Self PC | No | Preserves 0011/0013 attempts and proves staged/pulled top-level wrapper, exact function name, overlay parity, and local clasp run semantics before creating a separate 0014 marker. |
| `gas:preflight-runtime-retry:0014` | Self PC | Named local OAuth; one explicit personal-synthetic deployment opt-in | Re-pulls runtime HEAD, creates one fresh MYSELF-only immutable version/deployment, pulls that exact version back, proves wrapper/manifest/hash lineage, and prepares an ignored deployment-bound execution context. It never invokes a script function. |
| `gas:test:runtime-dev:0014` | Self PC | Named local OAuth only | Requires every 0014 lineage proof, marks the one-use attempt first, and invokes exactly `runQuickDiagnostic` once with `--nondev` against the API-executable deployment binding. |

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

An exit-code-zero `Skipping push.` is not remote mutation evidence. The blank
target lane preserves that no-op and its original retry marker, requires a
separate one-use interactive approval marker, forbids `--force`, and accepts
the result only after a separate pull proves exact 23-file byte parity.
The runtime lane is distinct: its ignored staged manifest intentionally adds
only `executionApi.access = MYSELF`, so clasp 3.3.0 receives `--force` only for
that guarded overlay push. A runtime `Skipping push.` result still fails closed,
and a separate exact runtime pull-back remains mandatory.

Instruction 0013 does not remove or reuse Instruction 0011's
`last-test-runtime.json`. Its separate one-use marker is written before the
deployment-list preflight, and the diagnostic attempt state is durably updated
before the single `scripts.run` call. The corrected binding preflight emits no
deployment identifier or description. A missing versioned match, a HEAD-only
result, or a changed local binding stops as
`CORRECTED_VERSIONED_DEPLOYMENT_NOT_PROVEN`. The retry uses deployed-version
mode (`--nondev`); it never creates or updates a deployment.

The completed Instruction 0013 preflight proved the corrected versioned
binding. Its exactly-one runtime call then returned no bounded diagnostic body
and closed as `REMOTE_QUICK_DIAGNOSTIC_FAILED_CLOSED`, safe subtype
`VERSIONED_RUNTIME_FUNCTION_NOT_FOUND`. The immediate parser record
`DEV_RUNTIME_RESULT_UNPARSEABLE` remains preserved. Do not delete either
attempt marker or perform another Instruction 0013 call.

Instruction 0014 records the identified guard defect: clasp 3.3.0's
`run-function` passes the active project configuration value to `scripts.run`;
`--nondev` sets `devMode=false` but does not select a separately saved
deployment binding. Apps Script `scripts.run` instead requires the API
executable deployment ID as its path parameter. Deployment visibility alone
therefore did not prove that 0013 executed the selected versioned deployment.

The corrected gate blocks execution until both ignored runtime payloads expose
the top-level wrapper, the function name is exactly `runQuickDiagnostic`, local
clasp package source proves argument/devMode handling, and a fresh deployment's
exact immutable version has been independently pulled and byte-matched. The
execution-only ignored clasp configuration is then bound to that deployment,
not the project ID. The 0011 and 0013 markers remain immutable evidence, and a
separate 0014 marker precedes the sole possible function call. Primary API
semantics are recorded in `docs/local-clasp-setup.md`.

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
