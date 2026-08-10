# Work 0007 - Remote Content Diagnosis and CI Scope Stabilization Report

## Outcome

Work 0007 completed the authorized CI-scope repair, single read-only remote
content diagnosis, and local clasp round-trip contract repair.

```text
WORK_ID: 0007
STATUS: READY_FOR_FRESH_CONTROLLED_REMOTE_PLACEMENT_RETRY
BLOCKER: NONE
REMOTE_CONTENT_READ_ATTEMPT_COUNT: 1
REMOTE_CONTENT_CLASSIFICATION: REMOTE_HAS_MANIFEST_ONLY
REMOTE_MUTATION: NOT_EXECUTED
```

The single authorized Apps Script content read proved that the exact existing
Work 0006 synthetic project contained only its manifest and no server-side
script files. Combined with the installed clasp 3.3.0 command behavior and
actual update-content boundary test, this identifies the Work 0006 defect as
a push semantic no-op, not a pull materialization defect.

The future guarded push path now requires `--force`, JSON semantic evidence of
all 23 pushed local files, and the existing exact native eligibility gate.
An exit-zero no-op or zero-file result fails closed.

## Exact starting point and candidate preservation

- Work 0007 instruction commit:
  `8bc62957f8852f6f9bd23f0c2f67bad522f73ea0`.
- Exact Work 0006 parent:
  `7f1e87d870bdbfd628f914c73fabccef320ae816`.
- Pre-read tooling head:
  `ddad9306e50a4de52f226181c5a88d2a713b4cc0`.
- Source A12:
  `d3f93e05e77a3cdccf24c5a5b7d8def452155841`.
- Release B12:
  `0b655e6df51d7ac56c1936fb57331e03516ebe0c`.
- Code `2.8.12-prepilot`, Schema `2.6`, AI Schema `2.0`, Migration
  `3`, Automation OFF, and Provider state remained unchanged.
- Product `.gs`, product `appsscript.json`, release packages,
  `CURRENT_CONTRACT.json`, root `AGENTS.md`, `.codex/**`, dependency versions,
  and Work 0003-0006 historical handoffs remained unchanged.
- Linear ancestry from exact Work 0006 final head: PASS.

## CI scope root cause and permanent repair

The prior gate used an explicit array containing only Work 0002 through Work
0006 branches. Consequently, the initial Work 0007 push and PR runs failed
with `UNEXPECTED_BRANCH` / `UNEXPECTED_GITHUB_HEAD_REF` before the new Work
could repair its own scope entry.

The explicit per-Work list was replaced by a single strict structural policy:

```text
codex/<exactly four digits>-<lowercase alphanumeric slug segments>
```

The canonical Work 0002 branch remains accepted. A future unseen numbered
Work branch passes without an allowlist edit. Arbitrary feature branches,
`codex/r*`, `codex/instruction-*`, wrong digit counts, missing slugs,
uppercase, underscores, and malformed hyphen forms fail closed. Existing
starting-main ancestry, governance identity, pull-request merge-ref,
detached-head, and no-donor-merge checks remain in force. Branch-name
acceptance is CI scope only and grants no external-operation authority.

Historical instruction-head CI failures:

- push run `31360878535`: expected failure before structural repair;
- PR run `31360892687`: expected failure before structural repair.

Pre-read tooling-head CI:

- push run `31361633621`: PASS;
- PR run `31361637676`: PASS.

## clasp 3.3.0 semantic diagnosis and repair

The installed project-local clasp version was exactly `3.3.0`. Its actual
push command checks whether `appsscript.json` differs. In a non-interactive
process without `--force`, the confirmation resolves false and the command
returns without calling the update-content path. That skip still exits zero.

Work 0006 invoked plain `clasp push`, and its wrapper treated exit zero as
`COMMAND_PASS`. The exact target was newly bound and retained its initial
manifest, so this path could report success without uploading the 22 scripts.

The smallest supported repair is:

- invoke project-local clasp with `--json push --force`;
- retain the exact pre-push native 23-file eligibility gate;
- require the JSON result to contain exactly the canonical 23 local paths;
- require 22 `.gs` files plus `appsscript.json`, missing 0, extra 0;
- reject exit-zero empty output as `CLASP_PUSH_SEMANTIC_NO_OP`;
- reject malformed or noncanonical semantic evidence before recording push
  completion.

An isolated boundary test exercised the installed clasp `Files.push()` path.
It observed exactly one `projects.updateContent` call with 23 serialized
files: 22 `SERVER_JS`, one manifest `JSON`, zero HTML, and exact normalized
remote names. The same captured synthetic remote shape was passed through the
installed clasp pull path, which materialized exactly 22 `.gs` files plus
`appsscript.json`. This proves the repaired local push and pull contracts
without a Google mutation.

## Single read-only remote-content result

Before the call, the helper verified the ignored Work 0006 evidence as:

- Work ID `0006`;
- target kind `PERSONAL_SYNTHETIC_DEV`;
- disposition `FRESH_SYNTHETIC_CREATED`;
- consumed mutation counts create/inspect/push/pull = 1/1/1/1;
- phase `PULL_ATTEMPT_STARTED`;
- matching local binding and exact recorded non-reversible fingerprint.

A distinct ignored Work 0007 read state was atomically created before the
external call. The call used the existing authorization and performed exactly
one read-only Apps Script content request.

```text
READ_ATTEMPT_COUNT: 1
READ_STATE_PHASE: READ_PASS
CLASSIFICATION: REMOTE_HAS_MANIFEST_ONLY
TOTAL_FILES: 1
SERVER_JS_FILES: 0
MANIFEST_FILES: 1
HTML_FILES: 0
INVALID_FILES: 0
MISSING_CANONICAL_FILES: 22
EXTRA_FILES: 0
TARGET_FINGERPRINT: 754e21bfc1fd61755fb12d3156c5729a17e946c4a436eeb00b0aa91d55238a18
```

No identifier, account identity, OAuth/client metadata, credential, URL, raw
response, source body, or local credential path was emitted or recorded.
The read authority is consumed and was not retried.

## Changed files

- `.gitignore`
- `implementation/GoogleSpreadsheet/package.json`
- `implementation/GoogleSpreadsheet/tools/local_validation_gate.js`
- `implementation/GoogleSpreadsheet/tests/local_validation_gate_pr_merge_scope_test.js`
- `implementation/GoogleSpreadsheet/tools/local_clasp_dev.js`
- `implementation/GoogleSpreadsheet/tests/clasp_push_update_content_contract_test.js`
- `implementation/GoogleSpreadsheet/tools/work_0007_remote_content_inspector.js`
- `implementation/GoogleSpreadsheet/tests/work_0007_remote_content_inspector_test.js`
- `implementation/GoogleSpreadsheet/tests/local_validation_secret_scan_test.js`
- `docs/handoffs/0007-report.md`

The new Work 0007 state path is ignored and is also explicitly rejected by
the tracked secret/local-state scanner.

## Validation

- `pnpm install --frozen-lockfile`: PASS; dependency graph unchanged.
- Node `v24.19.0`, pnpm `11.9.0`, project-local clasp `3.3.0`: PASS.
- structural CI scope regression: PASS, 19 checks.
- Work 0007 one-use read/classification regression: PASS, 10/10.
- installed clasp push/update-content contract: PASS.
  - update-content calls: 1;
  - serialized files: 23;
  - server scripts / manifest / HTML: 22 / 1 / 0;
  - semantic no-op rejection: PASS;
  - actual pull materialization: 22 `.gs` plus manifest.
- Work 0005 native inventory/extension regression: PASS.
- Work 0006 one-use/state regression: PASS, 22/22.
- complete clean-worktree local gate: PASS, 11/11 sections and 57 suites.
- Apps Script inventory/static validation: PASS, 22 `.gs` plus manifest.
- release verification: PASS, 2/2 in committed LF checkout.
- A12/B12 lineage and release-only scope: PASS.
- tracked secret/identifier/local-state scan: PASS, 0 hits.
- `git diff --check`: PASS.

The configured Luna custom subagent roles were unavailable in this runtime.
No generic or repository-defined agent was substituted; the main agent
performed the focused code review and executable validation directly.

## Guardrail confirmation

No Google Spreadsheet or Apps Script project was created. No clasp push,
clasp pull, target deletion, Drive mutation, Apps Script mutation, interactive
OAuth login/re-consent, logout/login cycle, account/profile switch, Setup,
Quick/Deep Diagnostic, Dashboard refresh, Apps Script function, `clasp run`,
`scripts.run`, Gmail, Calendar, trigger, deployment, Cloud-project mutation,
Provider operation, Automation enablement, company/production resource, or
real-data operation occurred.

Work 0004 and Work 0006 mutation state was not reset, deleted, reinterpreted,
or bypassed. The only live action was the one authorized read-only content
request against the exact Work 0006 synthetic target.

## Limitations and next Work boundary

The repaired command has not been run against Google because Work 0007
authorizes no remote mutation. A separately committed Work ID and handoff are
required for any fresh target creation or controlled push/pull retry. That
future Work must use a new target and new one-use mutation state; Work 0006
target and state remain consumed evidence.

## Git and PR

- Branch: `codex/0007-remote-content-diagnosis-ci-scope`.
- Pre-read functional head:
  `ddad9306e50a4de52f226181c5a88d2a713b4cc0`.
- Final report commit: `SELF`.
- Draft PR: #21.
- PR base: `codex/0006-fresh-controlled-remote-placement`.
- Merge: NOT_PERFORMED.
- BLOCKER: NONE.
- Final report-head push/PR CI is verified after this report commit and
  recorded in Draft PR #21.
