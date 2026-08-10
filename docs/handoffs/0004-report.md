# Work 0004 - Controlled Personal-Synthetic Placement Report

## Outcome

Work 0004 completed through its committed safe-stop path after the single
authorized pull attempt returned an incomplete payload inventory.

```text
WORK_ID: 0004
STATUS: READY_FOR_CONTROLLED_SANDBOX_VALIDATION
BLOCKER: REMOTE_PULLBACK_UNEXPECTED_CONTENT
TARGET_DISPOSITION: FRESH_SYNTHETIC_CREATED
AUTH_PREFLIGHT_INVOCATION_COUNT: 1
TARGET_CREATION_ATTEMPT_COUNT: 1
TARGET_INSPECTION_COUNT: 1
CLASP_PUSH_ATTEMPT_COUNT: 1
CLASP_PULL_ATTEMPT_COUNT: 1
PULLED_PAYLOAD_FILE_COUNT: 1
PULL_BACK_PARITY: FAIL_CLOSED_NOT_23_FILES
RUNTIME_OR_FUNCTION_EXECUTION: NOT_EXECUTED
```

The newly created personal-synthetic target passed the authorized ownership
and bound-container inspection. The single guarded clasp push command returned
success. The single independent clasp pull command completed, but the isolated
pull workspace contained only `appsscript.json` in its payload rather than the
required 23 files. The inventory guard therefore stopped before byte/hash
parity could be accepted.

No target, push, or pull retry was attempted. No second target or alternate
account was used. The synthetic target remains isolated and was not deleted.
The successful Work 0004 status
`READY_FOR_CONTROLLED_SANDBOX_RUNTIME_VALIDATION` is not justified. The prior
highest gate remains `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`.

## Exact starting point and candidate preservation

- Work 0004 instruction commit:
  `bdcfaf2aa2d189fbf45d80ee928990ac006e3a77`.
- Exact Work 0003 parent:
  `5e4e1dfcac493479c530390e07293dddbbd7c4a2`.
- Source A12:
  `d3f93e05e77a3cdccf24c5a5b7d8def452155841`.
- Release B12:
  `0b655e6df51d7ac56c1936fb57331e03516ebe0c`.
- Code `2.8.12-prepilot`, Schema `2.6`, AI Schema `2.0`, Migration
  `3`, and Automation OFF remained unchanged.
- Product `.gs` source, `appsscript.json`, both release packages,
  `CURRENT_CONTRACT.json`, root `AGENTS.md`, `.codex/**`, and both Work 0003
  handoff files were unchanged: PASS.
- Branch ancestry, governance identity, and no-donor-merge checks: PASS.

## Work 0004 tooling and safety changes

The pre-Google tooling head added only the Work 0004 local lane required by
the handoff:

- `implementation/GoogleSpreadsheet/tools/work_0004_target_bootstrap.js`
- `implementation/GoogleSpreadsheet/tests/work_0004_target_bootstrap_test.js`
- `implementation/GoogleSpreadsheet/tools/local_clasp_dev.js`
- `implementation/GoogleSpreadsheet/tools/local_validation_gate.js`
- `implementation/GoogleSpreadsheet/tests/local_validation_gate_pr_merge_scope_test.js`
- `implementation/GoogleSpreadsheet/package.json`

The lane:

- requires the exact Work 0004 branch for every external operation;
- uses `work-0004-creation-state.json`, distinct from Work 0003 state;
- writes creation, push, and pull attempt state before each corresponding
  remote command and refuses retries;
- suppresses account, credential, identifier, URL, and raw provider output;
- disables status, open, runtime test, and arbitrary command paths;
- stages the exact committed LF payload bytes, avoiding Windows CRLF
  materialization without changing product files;
- runs release verification in an isolated committed LF local checkout.

An independent standard Codex read-only review found four safety issues before
publication. The false `NOT_EXECUTED` failure label, missing exact-branch guard,
uncounted remote command paths, and arbitrary command echo were fixed. The
independent re-review reported no material findings. No repository-defined
custom agent was invoked.

## Pre-Google validation

- Git identity: configured without emitting values.
- Node: PASS, `v24.19.0`.
- pnpm: PASS, `11.9.0`.
- project-local clasp: PASS, `3.3.0`.
- locked install: `pnpm install --frozen-lockfile` PASS.
- complete local gate: PASS, 11/11 sections and 53 Node suites.
- focused Work 0004 safety tests: PASS, 17/17.
- Apps Script inventory: PASS, 22 `.gs` files plus `appsscript.json`.
- Phase 8B/8C committed-LF release verification: PASS, 2/2.
- A12/B12 lineage and release-only B12 scope: PASS.
- tracked secret/identifier/local-state scan: PASS, 451 files and 0 hits.
- `git diff --check`: PASS.
- guarded staging: PASS, exactly 23 files.
- guarded staging payload SHA-256:
  `59327c8322cea8d5884375cdca12935b96674cb127460cf4ca0a2df02c2107ee`.
- pre-Google tooling commits:
  `618db5f80b1ec0263c8a4c9c96776eb5e71d3a74` and
  `8627da0b68ccba320bc7e0d9812a5dd585134db1`.
- pre-Google push CI run `31354446502`: SUCCESS.
- pre-Google pull-request CI run `31354448975`: SUCCESS.

The existing default clasp authorization was checked once through the closed
Work 0004 auth-preflight lane. It returned non-interactive auth PASS and
personal-principal PASS without exposing an account or credential value.

## Authorized external sequence result

| Operation | Attempts | Result |
|---|---:|---|
| Authentication preflight | 1 | PASS |
| Fresh synthetic target creation | 1 | PASS |
| Target/binding inspection | 1 | PASS |
| Guarded clasp push | 1 | COMMAND_PASS |
| Independent isolated clasp pull | 1 | COMMAND_COMPLETED |
| Pulled 23-file inventory | 1 | FAIL, 1 payload file |
| Pull-back byte/hash parity | 0 | NOT_REACHED_AFTER_INVENTORY_FAILURE |

Privacy-safe target evidence:

```text
TARGET_KIND: PERSONAL_SYNTHETIC_DEV
TARGET_DISPOSITION: FRESH_SYNTHETIC_CREATED
PRINCIPAL_BINDING: PASS
TARGET_BINDING: PASS
OWNED_BY_ME: true
OWNER_COUNT: 1
SHARED_DRIVE: false
PENDING_OWNER: false
BOUND_CONTAINER: true
TARGET_FINGERPRINT: a881530a87b8ff8e195fd7c387094d89c87a1ab08dc2fba610489109db5d1675
```

The ignored Work 0004 state ended with creation count 1, inspection count 1,
push count 1, pull count 1, and phase `PULL_ATTEMPT_STARTED`. That phase is
intentionally left unchanged after the inventory failure so the same Work ID
cannot retry the pull.

## Guardrail confirmation

No Setup, Quick Diagnostic, Deep Diagnostic, Dashboard refresh, Apps Script
function, `clasp run`, `scripts.run`, Gmail, Calendar, trigger, deployment,
Cloud-project mutation, AI Provider operation, Automation enablement, company
resource, production resource, or real-data operation occurred. No interactive
OAuth flow, re-consent, account switch, alternate profile, second target,
second push, or second pull occurred. No identifier, account, credential,
private URL, raw Google response, or local credential path is tracked or
reported.

## Blocker and next Work ID boundary

Work 0004 is complete with `REMOTE_PULLBACK_UNEXPECTED_CONTENT`. The one-use
creation/push/pull authority is consumed and must not be retried under this
Work ID.

A new committed Work ID and handoff are required before any further Google
operation. That handoff should first repair and synthetically validate the
clasp source-extension/upload inventory contract without Google access, then
explicitly decide whether a new fresh target is authorized. It must not treat
the isolated Work 0004 target or state as reusable authority by default.

## Git and PR

- Branch: `codex/0004-controlled-synthetic-placement`.
- Pre-Google functional head:
  `8627da0b68ccba320bc7e0d9812a5dd585134db1`.
- Final report commit: `SELF`.
- Draft PR: #18.
- PR base: `codex/0003-controlled-remote-placement`.
- Merge: NOT_PERFORMED.
- Work 0004 BLOCKER: `REMOTE_PULLBACK_UNEXPECTED_CONTENT`.
- Final report-head CI is checked after push and recorded in Draft PR #18.
