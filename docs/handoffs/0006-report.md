# Work 0006 - Fresh Controlled Personal-Synthetic Placement Report

## Outcome

Work 0006 completed through its committed safe-stop path after the single
authorized pull attempt returned an incomplete payload inventory.

```text
WORK_ID: 0006
STATUS: READY_FOR_CONTROLLED_SANDBOX_VALIDATION
BLOCKER: REMOTE_PULLBACK_UNEXPECTED_CONTENT
TARGET_DISPOSITION: FRESH_SYNTHETIC_CREATED
AUTH_PREFLIGHT_INVOCATION_COUNT: 1
TARGET_CREATION_ATTEMPT_COUNT: 1
TARGET_INSPECTION_COUNT: 1
CLASP_PUSH_ATTEMPT_COUNT: 1
CLASP_PULL_ATTEMPT_COUNT: 1
PULLED_PAYLOAD_FILE_COUNT: 1
PULLED_GS_FILE_COUNT: 0
PULLED_MANIFEST_COUNT: 1
PULL_BACK_PARITY: FAIL_CLOSED_NOT_23_FILES
RUNTIME_OR_FUNCTION_EXECUTION: NOT_EXECUTED
```

The new personal-synthetic target passed the authorized ownership and
bound-container inspection. The single guarded clasp push command returned
success after the actual clasp-native eligibility gate selected exactly 23
canonical files. The single independent clasp pull command completed, but
the isolated pull payload contained only `appsscript.json`, not the required
22 `.gs` files plus manifest. The inventory guard stopped before byte/hash
parity could be accepted.

No target, push, pull, or inspection retry was attempted. No second target or
alternate account/profile was used. The target remains isolated and was not
deleted. `READY_FOR_CONTROLLED_SANDBOX_RUNTIME_VALIDATION` is not justified.

## Exact starting point and candidate preservation

- Work 0006 instruction commit:
  `597d70627990560d79602d0f16151a58c8c2c077`.
- Exact Work 0005 parent:
  `e170885476ce202697b837c75fe5a6294cc429f3`.
- Source A12:
  `d3f93e05e77a3cdccf24c5a5b7d8def452155841`.
- Release B12:
  `0b655e6df51d7ac56c1936fb57331e03516ebe0c`.
- Code `2.8.12-prepilot`, Schema `2.6`, AI Schema `2.0`, Migration
  `3`, Automation OFF, and Provider state remained unchanged.
- Product `.gs` source, `appsscript.json`, both release packages,
  `CURRENT_CONTRACT.json`, root `AGENTS.md`, `.codex/**`, and Work 0004/0005
  historical evidence remained unchanged.
- Work 0006 descends from the exact Work 0005 final head: PASS.

## Work 0006 tooling and safety changes

- `.gitignore`
- `implementation/GoogleSpreadsheet/package.json`
- `implementation/GoogleSpreadsheet/tools/local_clasp_dev.js`
- `implementation/GoogleSpreadsheet/tools/work_0006_target_bootstrap.js`
- `implementation/GoogleSpreadsheet/tools/local_validation_gate.js`
- `implementation/GoogleSpreadsheet/tests/work_0006_target_bootstrap_test.js`
- `implementation/GoogleSpreadsheet/tests/local_validation_secret_scan_test.js`
- `implementation/GoogleSpreadsheet/tests/local_validation_gate_pr_merge_scope_test.js`
- `docs/handoffs/0006-report.md`

The tooling uses distinct ignored Work 0006 staging, execution-state, and
independent-pull workspaces. It does not read, reset, delete, reinterpret, or
reuse Work 0004 state or target authority. The target and independent-pull
configs explicitly use `rootDir: "payload"` and
`scriptExtensions: [".gs", ".js"]`. The generated ignore file is the exact
23-name canonical allowlist.

Creation, inspection, push, and pull commands share an atomic operation lock.
One-use state is recorded before each authorized external attempt, and retry
paths fail closed. New Work 0006 ignored paths are also forbidden by the
tracked secret/local-state scan.

A standard Codex read-only subagent found the concurrent one-use claim and
new ignored-path scan gaps before Google mutation. Both were repaired and
covered by focused tests before the final pre-Google tooling head and CI.
No repository-defined custom agent was invoked.

## Pre-Google validation

- Git identity: CONFIGURED; values suppressed.
- Node: PASS, `v24.19.0`.
- pnpm: PASS, `11.9.0`.
- project-local clasp: PASS, `3.3.0`.
- `pnpm install --frozen-lockfile`: PASS; dependency graph unchanged.
- complete clean-worktree local gate: PASS, 11/11 sections and 55 suites.
- focused Work 0006 one-use/state tests: PASS, 22/22.
- Work 0004 guard regression: PASS, 20/20.
- Work 0005 clasp-native contract regression: PASS.
- release verification: PASS, 2/2.
- lineage and release-only B12 scope: PASS.
- tracked secret/identifier/local-state scan: PASS, 0 hits.
- `git diff --check`: PASS.
- staged canonical payload: 23 files.
- actual project-local clasp-native eligibility: 23 files, 22 `.gs`, one
  manifest, missing 0, extra 0.
- preferred pull script extension: `.gs`.
- staged payload SHA-256:
  `59327c8322cea8d5884375cdca12935b96674cb127460cf4ca0a2df02c2107ee`.
- final pre-Google tooling head:
  `dee9e8acd97f6b62a828c09c61a3885a730fa984`.
- pre-Google GitHub Actions runs `31359835386` and `31359837514`: PASS.

The existing default clasp authorization was checked once. The closed result
was non-interactive auth PASS and personal-principal PASS. No identity, OAuth
metadata, credential value, or credential path was emitted or recorded.

## Authorized external sequence result

| Operation | Attempts | Result |
|---|---:|---|
| Authentication preflight | 1 | PASS |
| Fresh synthetic target creation | 1 | PASS |
| Target/binding inspection | 1 | PASS |
| Actual clasp-native pre-push inventory | 1 | PASS, 23 files |
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
TARGET_FINGERPRINT: 754e21bfc1fd61755fb12d3156c5729a17e946c4a436eeb00b0aa91d55238a18
```

The ignored Work 0006 state ended with creation count 1, inspection count 1,
push count 1, pull count 1, and phase `PULL_ATTEMPT_STARTED`. That phase is
intentionally retained so the same Work ID cannot retry the pull.

## Guardrail confirmation

The following were all NOT_EXECUTED: interactive OAuth login/re-consent,
logout/login cycling, account switching, alternate profile, Setup, Quick
Diagnostic, Deep Diagnostic, Dashboard refresh, Apps Script function,
`clasp run`, `scripts.run`, Gmail, Calendar, trigger, deployment,
Cloud-project mutation, AI Provider request/configuration, Automation
enablement, Phase 8C deployment, company resource, production resource, and
real-data operation.

No second target, second inspection, second push, or second pull occurred. No
target was deleted. No identifier, account, OAuth client data, credential,
private URL, raw Google response, or local credential path is tracked or
reported.

## Blocker and next Work ID boundary

Work 0006 is complete with `REMOTE_PULLBACK_UNEXPECTED_CONTENT`. Its one-use
creation/push/pull authority is consumed and must not be retried under this
Work ID. Any diagnosis requiring Google access or any new target, push, or
pull requires a separately committed Work ID and handoff. Work 0006 state and
target are evidence only and are not reusable authority.

## Git and PR

- Branch: `codex/0006-fresh-controlled-remote-placement`.
- Pre-Google tooling head:
  `dee9e8acd97f6b62a828c09c61a3885a730fa984`.
- Final report commit: `SELF`.
- Draft PR: #20.
- PR base: `codex/0005-clasp-inventory-contract-repair`.
- Merge: NOT_PERFORMED.
- Work 0006 BLOCKER: `REMOTE_PULLBACK_UNEXPECTED_CONTENT`.
- Final report-head GitHub Actions is checked after push and recorded in
  Draft PR #20.
