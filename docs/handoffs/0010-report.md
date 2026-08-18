# Work 0010 - Fresh Controlled Remote Placement Report

## Outcome

Work 0010 completed the exact one-use controlled placement against one new
personal-synthetic Google target.

```text
WORK_ID: 0010
STATUS: READY_FOR_CONTROLLED_SANDBOX_RUNTIME_VALIDATION
BLOCKER: NONE
AUTH_PREFLIGHT_ATTEMPTS: 1
CREATE_ATTEMPTS: 1
INSPECTION_ATTEMPTS: 1
PUSH_ATTEMPTS: 1
POST_PUSH_CONTENT_READ_ATTEMPTS: 1
PULL_ATTEMPTS: 1
PROHIBITED_OPERATION_ATTEMPTS: 0
```

The Work 0007 repaired semantic push path performed a real canonical
23-file update. One independent read-only content inspection then proved the
remote Apps Script project contained exactly 22 server scripts and one
manifest. One independent isolated pull materialized exactly 22 `.gs` files
and `appsscript.json`; every pulled byte/hash matched the staged committed
payload.

No retry occurred after any authorized attempt began.

## Exact starting point and candidate preservation

- Work 0010 instruction commit:
  `78f6982b61fadd295594dcf00f9c4b4a029fa81d`.
- Exact Work 0007 starting parent:
  `3f54d2a90c38ea574db6bd20ab8341d27d82a183`.
- Pre-Google tooling head:
  `41323d73f71e433ca617e85bd9fa49e4ac1d28b8`.
- Source A12:
  `d3f93e05e77a3cdccf24c5a5b7d8def452155841`.
- Release B12:
  `0b655e6df51d7ac56c1936fb57331e03516ebe0c`.
- Code `2.8.12-prepilot`, Schema `2.6`, AI Schema `2.0`, Migration
  `3`, Automation OFF, and Provider settings remained unchanged.
- Product `.gs`, product `appsscript.json`, release packages,
  `CURRENT_CONTRACT.json`, canonical status/decision/context/plan,
  root `AGENTS.md`, `.codex/**`, and dependency lock remained unchanged.
- Linear ancestry from the exact Work 0007 final head: PASS.
- Canonical committed/staged payload: 23 files, consisting of 22 `.gs`
  files and `appsscript.json`.
- Canonical staged aggregate SHA-256:
  `59327c8322cea8d5884375cdca12935b96674cb127460cf4ca0a2df02c2107ee`.

## Work 0010 local tooling and state

A distinct ignored Work 0010 lane was added. It never reads or accepts Work
0004 or Work 0006 state or targets as authority.

The lane enforces:

- exact Work 0010 branch, published pre-Google head, clean tracked tree, and
  exact Work 0007 ancestry;
- protected candidate and release preservation;
- a new Work 0010-only execution state and isolated pull workspace;
- atomic one-use attempt recording before each authorized external call;
- no second auth preflight, creation, push, post-push read, or pull;
- no more than two ownership/binding inspections;
- exact `rootDir: "payload"`;
- exact `scriptExtensions: [".gs", ".js"]`, with `.gs` preferred;
- exact canonical 23-name `.claspignore` allowlist;
- actual project-local clasp-native 23-file eligibility immediately before
  push;
- Work 0007 `--json push --force` semantics and fail-closed rejection of
  empty, malformed, or noncanonical semantic evidence;
- exact remote-content shape before pull;
- a fresh isolated pull workspace and exact byte/hash parity;
- closed privacy-safe output containing no identity, credential, identifier,
  URL, raw response, source body, or credential path.

## Pre-Google prerequisites and validation

- Git identity: CONFIGURED; values were not emitted.
- Node `v24.19.0`: PASS.
- pnpm `11.9.0`: PASS.
- project-local clasp `3.3.0`: PASS.
- `pnpm install --frozen-lockfile`: PASS; dependency graph unchanged.
- existing non-interactive personal clasp authorization: PASS; identity and
  OAuth details suppressed.
- Work 0010 state was absent before staging: PASS.
- Work 0004 and Work 0006 ignored states were only existence-checked; their
  contents were not read, reset, deleted, reinterpreted, or reused.
- Work 0010 one-use/state regression: PASS, 15/15.
- installed clasp push/update-content contract: PASS.
  - one synthetic `projects.updateContent` boundary call;
  - 23 serialized files;
  - 22 server scripts, one manifest, zero HTML;
  - zero-file semantic no-op rejected.
- clasp-native inventory/extension regression: PASS.
  - 23 eligible files;
  - 22 `.gs`, one manifest;
  - missing 0, extra 0;
  - `.gs` is the preferred pull script extension.
- structural numbered-Work CI scope regression: PASS, 19 checks.
- complete clean-worktree local gate at the pre-Google head: PASS, 11/11
  sections and 58 suites.
- release verification: PASS, 2/2 in committed LF checkout.
- A12/B12 lineage and release-only scope: PASS.
- tracked secret/identifier/local-state scan: PASS, 0 hits.
- `git diff --check`: PASS.

Pre-Google GitHub Actions for exact head
`41323d73f71e433ca617e85bd9fa49e4ac1d28b8`:

- push run `31363068356`: PASS;
- pull-request run `31363071046`: PASS.

No Google mutation began until both runs were green.

## Authorized external sequence evidence

### Authentication

- non-interactive auth preflight attempts: 1;
- result: PASS;
- principal class: personal;
- interactive login/re-consent/account/profile switching: 0.

### Fresh target creation and inspection

- fresh Spreadsheet/bound Apps Script creation attempts: 1;
- result: `FRESH_SYNTHETIC_CREATED`;
- ownership/binding inspection attempts: 1;
- owned by authenticated principal: PASS;
- sole owner count: 1;
- shared-drive target: false;
- pending owner: false;
- Spreadsheet/script binding: PASS;
- second target or alternate target/account: not used.

### Repaired guarded push

The actual project-local clasp-native gate was rerun immediately before the
push and returned:

```text
ELIGIBLE_FILES: 23
GS_FILES: 22
MANIFEST_FILES: 1
MISSING_FILES: 0
EXTRA_FILES: 0
PREFERRED_PULL_SCRIPT_EXTENSION: .gs
PAYLOAD_HASH_MATCH: PASS
```

The guarded push then returned:

```text
PUSH_ATTEMPTS: 1
SEMANTIC_PUSH_FILES: 23
SEMANTIC_GS_FILES: 22
SEMANTIC_MANIFEST_FILES: 1
SEMANTIC_MISSING_FILES: 0
SEMANTIC_EXTRA_FILES: 0
UPDATE_CONTENT_EVIDENCED: true
```

No second push was attempted.

### Post-push read-only remote content verification

```text
CONTENT_READ_ATTEMPTS: 1
CLASSIFICATION: REMOTE_HAS_23_CANONICAL_FILES
TOTAL_FILES: 23
SERVER_JS_FILES: 22
MANIFEST_FILES: 1
HTML_FILES: 0
INVALID_FILES: 0
MISSING_FILES: 0
EXTRA_FILES: 0
```

No source body, identifier, URL, account detail, OAuth metadata, credential,
credential path, or raw Google response was emitted or retained as report
evidence. No second content read was attempted.

### Independent isolated pull and parity

```text
PULL_ATTEMPTS: 1
PULLED_FILES: 23
PULLED_GS_FILES: 22
PULLED_MANIFEST_FILES: 1
MISSING_FILES: 0
EXTRA_FILES: 0
PULL_PAYLOAD_SHA256: 59327c8322cea8d5884375cdca12935b96674cb127460cf4ca0a2df02c2107ee
EXACT_BYTE_HASH_PARITY: PASS
```

No second pull was attempted.

## Changed files

- `.gitignore`
- `implementation/GoogleSpreadsheet/package.json`
- `implementation/GoogleSpreadsheet/tools/local_clasp_dev.js`
- `implementation/GoogleSpreadsheet/tools/local_validation_gate.js`
- `implementation/GoogleSpreadsheet/tools/work_0010_remote_placement.js`
- `implementation/GoogleSpreadsheet/tests/local_validation_secret_scan_test.js`
- `implementation/GoogleSpreadsheet/tests/work_0010_remote_placement_test.js`
- `docs/handoffs/0010-report.md`

No product or release file changed.

## Final local validation

After the authorized external sequence:

- Work 0010 one-use evidence phase: `PULL_PARITY_PASS`;
- attempt counts auth/create/inspect/push/read/pull: 1/1/1/1/1/1;
- focused Work 0010 regression: PASS, 15/15;
- Work 0007 push/update-content regression: PASS;
- clasp-native inventory/extension regression: PASS;
- structural CI scope regression: PASS, 19 checks;
- complete clean-worktree local gate: PASS, 11/11 sections and 58 suites;
- release/lineage/secret checks: PASS;
- `git diff --check`: PASS.

The configured Luna custom subagent roles were unavailable in this runtime.
The available generic subagent API was not substituted because repository
policy permits only Luna custom roles. The main agent performed the bounded
implementation review and executable validation directly.

## Guardrail confirmation

No Work 0004 or Work 0006 target/state was reused or mutated. No second Work
0010 target was created. No retry of creation, push, post-push read, or pull
occurred.

No Setup, Quick/Deep Diagnostic, Dashboard refresh/repair, Apps Script
function, `clasp run`, `scripts.run`, Gmail, Calendar, trigger, deployment,
Cloud-project mutation, interactive OAuth change, Provider operation,
Automation enablement, company/production resource, real-data access,
cleanup deletion, force-push, merge, history rewrite, release, pilot, or
production operation occurred.

The new personal-synthetic target remains intact because cleanup deletion was
explicitly forbidden.

## Limitations and next boundary

Work 0010 proves placement and source parity only. It does not prove Apps
Script runtime behavior, native Sheets behavior, Setup, diagnostics,
Dashboard behavior, Gmail, Calendar, triggers, deployment, Provider,
Automation, pilot, production, or company acceptance.

A separate committed Work ID and handoff are required for any controlled
sandbox runtime validation. Work 0010 creation/push/read/pull authority is
consumed and cannot authorize another attempt.

## Git and PR

- Branch: `codex/0010-fresh-controlled-remote-placement`.
- Pre-Google tooling head:
  `41323d73f71e433ca617e85bd9fa49e4ac1d28b8`.
- Final report commit: `SELF`.
- Draft PR: #22.
- PR base: `codex/0007-remote-content-diagnosis-ci-scope`.
- PR state: Draft/Open/Unmerged.
- Merge: NOT_PERFORMED.
- BLOCKER: NONE.
- Final report-head push and pull-request Actions are verified after this
  report commit and recorded in Draft PR #22.
