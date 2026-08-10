# Work 0005 - clasp 3.3.0 Inventory Contract Repair Report

## Outcome

Work 0005 completed the authorized local/non-Google repair.

```text
WORK_ID: 0005
STATUS: READY_FOR_FRESH_CONTROLLED_REMOTE_PLACEMENT_RETRY
BLOCKER: NONE
LIVE_GOOGLE_OPERATION: NOT_EXECUTED
CLASP_AUTHENTICATION: NOT_ACCESSED
WORK_0004_IGNORED_STATE: NOT_ACCESSED_OR_MODIFIED
```

This status authorizes no remote retry. A separately committed Work ID and
handoff are still required before any Google target creation, inspection,
push, pull, OAuth action, Setup, runtime function, diagnostic, deployment,
Gmail, Calendar, Provider, Automation, company, production, or real-data
operation.

## Reproduced failure mechanism

The installed project-local `@google/clasp` version was exactly `3.3.0`.
Isolated black-box execution of its real `show-file-status --json` command
proved that the Work 0004 configuration and ignore rules selected all 23
canonical push files:

```text
Expected payload files: 23
Push-eligible files: 23
Expected .gs source files: 22
Manifest files: 1
Missing eligible files: 0
Unexpected eligible files: 0
```

Therefore Work 0004 did not fail because clasp excluded the `.gs` files from
the push inventory.

The exact reproduced failure mechanism was the pull filename-extension
contract. With `scriptExtensions` absent, clasp 3.3.0 normalized its default
order to `['.js', '.gs']`. The installed `Files.fetchRemote()` implementation
used the first extension and produced a synthetic pulled script filename of
`PulledScript.js`. The Work 0004 parity checker required the canonical `.gs`
filenames, so only `appsscript.json` matched its expected inventory.

The current `!*.gs` ignore rule was also only an extension allowlist: an extra
`.gs` file became push-eligible. It was not an exact canonical filename
allowlist.

All reproduction used OS temporary workspaces, isolated temporary
`HOME`/`USERPROFILE`/`APPDATA`, a missing synthetic auth file, synthetic
placeholder configuration, and a local stub at the installed clasp fetch
boundary. No credential file was created and no network or Google operation
was invoked.

## Minimal repair

- Added one shared generated clasp configuration with
  `scriptExtensions: ['.gs', '.js']`; `.gs` is now explicitly first.
- Used that configuration for both future target binding and isolated
  pull-verification configuration.
- Replaced the broad `!*.gs` rule with an exact 23-name `.claspignore`
  allowlist under `rootDir: 'payload'`.
- Added an isolated invocation of the actual project-local clasp
  `show-file-status --json` path before any guarded push attempt is recorded.
  The push lane now fails closed unless clasp itself selects exactly the 23
  canonical files.
- Preserved the existing Work 0004 exact-branch and one-use attempt-state
  guards. No consumed state was reset, deleted, read, reinterpreted, or
  bypassed.

## Changed files

- `implementation/GoogleSpreadsheet/tools/local_clasp_dev.js`
- `implementation/GoogleSpreadsheet/tools/work_0004_target_bootstrap.js`
- `implementation/GoogleSpreadsheet/tools/local_validation_gate.js`
- `implementation/GoogleSpreadsheet/tests/clasp_native_inventory_contract_test.js`
- `implementation/GoogleSpreadsheet/tests/local_clasp_validation_gate_test.js`
- `implementation/GoogleSpreadsheet/tests/work_0004_target_bootstrap_test.js`
- `implementation/GoogleSpreadsheet/tests/local_validation_gate_pr_merge_scope_test.js`
- `implementation/GoogleSpreadsheet/package.json`
- `docs/handoffs/0005-report.md`

No product `.gs` source, `appsscript.json`, release payload, version/schema,
`CURRENT_CONTRACT.json` product identity, Automation or Provider setting,
root `AGENTS.md`, `.codex/**`, dependency version, or Work 0004 handoff/report
was changed.

## Validation

- `pnpm install --frozen-lockfile`: PASS; dependency graph unchanged.
- Node `v24.19.0`, pnpm `11.9.0`, project-local clasp `3.3.0`: PASS.
- `pnpm run verify:clasp-contract`: PASS.
  - current effective order `.js`, `.gs` and native synthetic pull
    `PulledScript.js`: reproduced;
  - repaired effective order `.gs`, `.js` and native synthetic pull
    `PulledScript.gs`: PASS;
  - exact native push eligibility 23, `.gs` 22, manifest 1, missing 0,
    extra 0: PASS;
  - extra `.gs`, `.js`, `.html`, documentation, `.clasp*`, generated-state,
    and rootDir-outside files: not eligible.
- Existing local clasp self-test: PASS, 12/12.
- Work 0004 guard test: PASS, 20/20, including native-gate-before-attempt
  behavior and no attempt-state call after native inventory failure.
- PR merge/scope regression: PASS, 6/6.
- Complete `pnpm run verify:local` at functional head
  `5206f39c3cb3da923ec74ba077352fa3b88b2d53`: PASS, 11/11 sections and
  54 Node suites.
- Apps Script inventory/static validation: PASS, 22 `.gs` files plus
  `appsscript.json`.
- Phase 8B/8C release verification: PASS, 2/2 in a committed LF checkout.
- A12/B12 lineage and release-only B12 scope: PASS.
- Tracked secret, identifier, credential, local-path, clasp-state, and active
  transfer scan: PASS, 0 hits.
- `git diff --check`: PASS.

An initial pre-commit complete-gate invocation correctly rejected the dirty
worktree and new untracked test while every substantive section passed. After
the tooling/test commits, the complete gate passed all 11 sections from a
clean worktree.

An independent standard Codex subagent reproduced the clasp-native behavior
and reviewed the implementation. Its only Low finding requested behavioral
coverage of the native-gate/attempt-state ordering; that coverage was added,
and the affected tests and complete local gate passed afterward. No
repository-defined custom agent was invoked.

Final report-head GitHub Actions is verified after this report commit is
pushed, and the final run evidence is recorded in Draft PR #19. CI remains
non-Google and receives no Google credential or target identifier.

## Candidate and guardrail confirmation

- Source A12: `d3f93e05e77a3cdccf24c5a5b7d8def452155841`.
- Release B12: `0b655e6df51d7ac56c1936fb57331e03516ebe0c`.
- Code `2.8.12-prepilot`, Schema `2.6`, AI Schema `2.0`, Migration `3`.
- Automation: OFF.
- Product and release bytes: unchanged from Work 0004 final head
  `b458705e2402b72300d2016cc592bdb79c0524e7`.
- Work 0004 creation/push/pull authority remains consumed and unusable for a
  retry under Work 0004.

No clasp push, clasp pull, target/binding inspection, Google Drive or Apps
Script API operation, OAuth action, Setup, diagnostic, Dashboard refresh,
Apps Script function, `clasp run`, `scripts.run`, Gmail, Calendar, trigger,
deployment, Cloud-project mutation, Provider request, Automation enablement,
company/production resource, or real-data operation was performed.

## Limitations and next boundary

No live pull or push was performed, as required. The repaired local contract
is ready for consideration by a new, separately authorized controlled remote
placement Work ID. Work 0005 itself does not authorize that retry.

## Git and PR

- Branch: `codex/0005-clasp-inventory-contract-repair`.
- Instruction commit: `79e318d2fd9e235919c552e3cc1e4f7dfb4cbc2c`.
- Functional tooling head: `5206f39c3cb3da923ec74ba077352fa3b88b2d53`.
- Final report commit: `SELF`.
- Draft PR: #19.
- PR base: `codex/0004-controlled-synthetic-placement`.
- Merge: NOT_PERFORMED.
- BLOCKER: NONE.
