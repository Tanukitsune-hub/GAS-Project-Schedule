# Work 0004 — Controlled Personal-Synthetic Placement Resume

## Outcome

Continue from the completed Work 0003 safe-stop and prove that the exact Code `2.8.12-prepilot` Phase 8B payload can be placed on exactly one fresh personal-synthetic Google target, independently pulled back once, and reproduced with exact 23-file parity.

This is a new authorization tranche. Work 0003 authority is not reused.

Highest permitted successful status:

```text
READY_FOR_CONTROLLED_SANDBOX_RUNTIME_VALIDATION
```

This status proves only controlled remote placement and pull-back parity for the exact candidate. It does not prove Setup, Quick/Deep Diagnostic, Gmail, Calendar, trigger, runtime, Phase 8B overall, Phase 8C GO, pilot, production, or company handoff.

## Why Codex is needed

Route C. Residual work requires local ignored state, the user’s already-configured personal clasp authentication on the regular development terminal, controlled Google target creation/mutation, one guarded push, one independent pull, byte/hash verification, local executable tests, and final CI evidence.

ChatGPT has completed the GitHub-only preparation and created this dedicated branch/handoff.

## Exact starting point

Repository:

```text
Tanukitsune-hub/GAS-Project-Schedule
```

Work 0003 final head / parent for this Work ID:

```text
5e4e1dfcac493479c530390e07293dddbbd7c4a2
```

Work 0003 report:

```text
docs/handoffs/0003-report.md
```

Work 0002 product candidate retained through Work 0003:

```text
Source A12: d3f93e05e77a3cdccf24c5a5b7d8def452155841
Release B12: 0b655e6df51d7ac56c1936fb57331e03516ebe0c
Code: 2.8.12-prepilot
Schema: 2.6
AI Schema: 2.0
Migration: 3
Automation: OFF
Highest gate before this Work ID: READY_FOR_CONTROLLED_SANDBOX_VALIDATION
```

Task branch:

```text
codex/0004-controlled-synthetic-placement
```

This branch is created from exact Work 0003 final head. Do not rebase onto `main`, PR #17, or an older donor branch. Do not merge PR #17 or older stacked PRs as part of this Work ID.

## User-completed prerequisite

Outside GitHub, the user has re-established the regular development terminal and confirmed the following before this handoff was created:

- Git identity configured;
- Node available;
- pnpm available;
- project-local `@google/clasp` version `3.3.0` available after locked install;
- default clasp authorization currently resolves to a personal Google account.

Treat this only as a starting observation. Reconfirm the required safe closed-state preconditions locally without writing the account identity, OAuth client ID, script ID, Spreadsheet ID, token, credential path, URL, or other identifying/auth material to GitHub, chat, committed logs, the report, or stdout beyond what the existing privacy-safe tooling permits.

If the existing authorization now requires interactive login/re-consent, account switching, a second profile, credential creation/rotation, or broader scopes, stop before any Google mutation and report `USER_ACTION_REQUIRED_BLOCKER`.

## Applicable rules

Read before execution:

```text
AGENTS.md
CURRENT_CONTRACT.json
CURRENT_STATUS.md
DECISIONS.md
PROJECT_CONTEXT.md
MASTER_PLAN.md
docs/handoffs/0003-instruction.md
docs/handoffs/0003-report.md
implementation/GoogleSpreadsheet/package.json
implementation/GoogleSpreadsheet/tools/local_validation_gate.js
implementation/GoogleSpreadsheet/tools/local_clasp_dev.js
implementation/GoogleSpreadsheet/tools/work_0003_target_bootstrap.js
implementation/GoogleSpreadsheet/tests/work_0003_target_bootstrap_test.js
```

This handoff explicitly overrides stale branch-local custom-agent wording inherited from Work 0003: do not invoke repository-defined custom agents. Use only standard Codex subagent capabilities if they materially help and keep the main agent responsible for the outcome.

## Required-now scope

### 1. Safely synchronize and reconfirm the exact candidate

Before any Google operation:

- fetch normally and check out `codex/0004-controlled-synthetic-placement`;
- confirm the branch descends directly from Work 0003 final head `5e4e1dfcac493479c530390e07293dddbbd7c4a2` plus only Work 0004-authorized changes;
- confirm Work 0002 source/release bytes, product `.gs` files, `appsscript.json`, `CURRENT_CONTRACT.json`, code/schema versions, Automation OFF, and external AI disabled remain unchanged;
- run `pnpm install --frozen-lockfile`;
- run the full local verification gate;
- run guarded staging and prove exactly 23 Phase 8B payload files;
- record only safe payload/hash evidence.

If the exact candidate differs or any material product/release invariant fails, stop before Google access and report a `BLOCKER`.

### 2. Create Work 0004-specific one-use safety tooling

Work 0003 completed through a safe-stop and its remote-operation authority must not be reused. Before any Google mutation, make the smallest local tooling/test/document changes needed to establish a fresh Work 0004 one-use tranche.

Allowed examples:

- add or adapt a Work 0004-specific privacy-safe target bootstrap;
- use a Work 0004-specific ignored one-use creation state so a Work 0003 state cannot authorize or suppress this tranche;
- update the non-Google branch/scope gate so the exact Work 0004 branch is accepted while unexpected branches and donor merges remain rejected;
- add focused tests proving exactly one creation attempt, no automatic retry, no identifier leakage, and correct Work 0004 state isolation;
- update package scripts only as needed for the Work 0004 lane.

Preserve Work 0003 report/instruction as historical evidence. Do not delete or rewrite them.

Do not change:

- product `.gs` source;
- `appsscript.json`;
- A12/B12 release bytes;
- product version/schema;
- Automation defaults;
- Provider configuration;
- root `AGENTS.md` or `.codex/**`.

If product-source changes appear necessary, stop with `BLOCKER`; do not create Code 2.8.13 inside Work 0004.

### 3. Pre-Google commit and CI gate

All Work 0004 tooling/test changes required for the external sequence must be completed before the first target-creation attempt.

Then:

- rerun the complete local gate;
- run focused Work 0004 tests;
- run `git diff --check`;
- commit the pre-Google tooling changes;
- push normally to the Work 0004 branch;
- update/create the Draft stacked PR;
- require the final pre-Google branch head non-Google GitHub Actions CI to pass.

Do not begin target creation until that CI is green.

Once the first target-creation attempt begins, do not make further code/tool changes and then retry the external sequence under this Work ID.

### 4. Select exactly one fresh personal-synthetic target

For Work 0004, use exactly one newly created blank personal-synthetic Google Spreadsheet and its bound Apps Script project.

Do not reuse an older target or Work 0003 target state. The regular development terminal currently has no Work 0003 ignored target state to reuse, and this Work ID intentionally chooses fresh creation to eliminate wrong-target ambiguity.

The target must contain no real mail, tasks, calendar data, attachments, personal/business information, company information, credentials, internal URLs, or production configuration.

Creation authorization is exactly one attempt for:

1. one blank personal-synthetic Spreadsheet; and
2. its one bound Apps Script project.

Use the already-authenticated personal principal only.

Do not create a standard Cloud project, API-executable deployment, Gmail label, Calendar resource, trigger, Sheet schema, application data, or provider configuration.

If the Spreadsheet is created but the bound Apps Script project creation fails, stop safely. Do not retry and do not delete the partial synthetic resource as cleanup. Record only closed/privacy-safe evidence.

### 5. Authentication and privacy boundary

Reuse only the existing default clasp authentication already present on the regular development terminal.

This Work ID does not authorize:

- interactive OAuth login or re-consent;
- account switching;
- alternate account fallback;
- second auth profile;
- OAuth client creation/change;
- credential creation/rotation;
- standard Cloud-project mutation;
- broader scope grant.

The Work 0004 bootstrap must fail closed if the principal is not demonstrably personal or if authentication cannot be reused non-interactively.

Never write or echo to tracked output/report/chat:

- Google account address or ID;
- OAuth client ID;
- token/credential content or credential path;
- Spreadsheet ID;
- Script ID;
- project/deployment IDs;
- Drive IDs;
- private URLs;
- raw Google error bodies.

Use only closed enums, counts, payload SHA-256, and a non-reversible salted/HMAC fingerprint stored with its salt only in ignored local state.

### 6. Target inspection before push

After successful fresh target creation and before push, perform up to two read-only target/binding inspections only as needed to prove:

- target kind is `PERSONAL_SYNTHETIC_DEV`;
- local ignored clasp binding and Work 0004 target state refer to the same bound script;
- target identifiers are absent from tracked Git content;
- target is owned by the same personal principal;
- one owner is present when the accessible metadata permits that proof;
- no Shared Drive `driveId`;
- no pending-owner ambiguity;
- bound-container relationship is consistent;
- no production/company target evidence exists.

Any contradiction or unresolved evidence that creates a realistic wrong-target risk is a no-push `BLOCKER`.

Do not weaken the guard because a field is unavailable.

### 7. Exact authorized external sequence

Only after every local, CI, auth, creation, and inspection precondition passes, perform exactly:

1. target creation attempt: exactly 1;
2. target/binding read-only inspections: at most 2 total;
3. guarded `clasp push`: exactly 1 attempt;
4. independent isolated `clasp pull`: exactly 1 attempt;
5. local exact 23-file byte/hash parity verification.

No push retry after its attempt begins.
No pull retry after its attempt begins.
No second target.
No alternate target.
No automatic correction and repush if parity fails.

If push fails, stop.
If pull fails, stop.
If pulled inventory is not exactly 23 files, stop.
If byte/hash parity fails, stop.

Leave the synthetic target isolated for later authorized runtime validation; do not delete it after success or failure.

### 8. Explicit forbidden operations

Do not perform any of the following in Work 0004:

- Setup or Setup continuation;
- `runQuickDiagnostic` or `runDeepDiagnostic`;
- Dashboard refresh;
- any Apps Script function invocation;
- `clasp run`;
- Apps Script `scripts.run`;
- Gmail search/read/write/labels;
- Calendar list/create/update/delete;
- trigger creation/deletion;
- deployment creation/change;
- standard Cloud-project creation/change;
- real AI Provider configuration/request;
- Automation enablement;
- Phase 8C deployment;
- company-PC transfer;
- company resources;
- production resources;
- real data;
- merge/rebase/force-push/history rewrite;
- merge of PR #17 or older stacked PRs.

### 9. Evidence and success conditions

On success, record only privacy-safe evidence proving:

- exact Work 0002/0003 product candidate unchanged;
- full local gate PASS;
- focused Work 0004 safety tests PASS;
- pre-Google final-head CI PASS;
- target disposition `FRESH_SYNTHETIC_CREATED`;
- principal/target binding PASS using non-identifying fingerprint only;
- target creation attempt count = 1;
- target inspection count <= 2;
- push attempt count = 1 and PASS;
- pull attempt count = 1 and PASS;
- pulled payload file count = 23;
- pull-back parity = PASS;
- no runtime/function/Setup/Gmail/Calendar/trigger/deployment/Provider operation;
- Automation remained OFF;
- no real data used.

Only if all of the above pass may Work 0004 conclude:

```text
READY_FOR_CONTROLLED_SANDBOX_RUNTIME_VALIDATION
```

Otherwise record the exact closed blocker/failure and stop without workaround.

## Acceptance checks

### Repository

- Work 0004 branch is based on exact Work 0003 final head;
- Work 0002 product/release contract remains unchanged;
- root `AGENTS.md` and `.codex/**` unchanged;
- Work 0003 historical handoff/report unchanged;
- no Google identifiers, credentials, account details, private URLs, or machine paths tracked;
- `git diff --check` PASS;
- worktree clean after final commit/push.

### Local before remote

At minimum from `implementation/GoogleSpreadsheet`:

```text
pnpm install --frozen-lockfile
pnpm run verify:local
pnpm run gas:stage:dev
```

Add and run focused Work 0004 safety tests for any changed tooling.

### GitHub Actions

- pre-Google functional head CI must PASS before target mutation;
- final report-head CI must PASS after final push;
- CI must remain non-Google and must not receive Google credentials or target identifiers.

## Report and Git/PR requirements

Create and commit:

```text
docs/handoffs/0004-report.md
```

Report the complete outcome, including safe attempt counts and parity result.

Branch:

```text
codex/0004-controlled-synthetic-placement
```

Draft PR base:

```text
codex/0003-controlled-remote-placement
```

Keep the PR Draft and unmerged.

Push normal commits only. No force-push, rebase, merge commit, release, tag, or history rewrite.

## Stop / escalation conditions

Stop safely and report a `BLOCKER` if any of the following occurs:

- repository/branch/ancestry cannot be reconciled without destructive Git action;
- product/release candidate differs from the exact A12/B12 contract;
- local gate or required CI fails and cannot be fixed within allowed local tooling/test/doc scope;
- existing clasp auth is missing/expired and requires user interaction or re-consent;
- principal cannot be proven personal without exposing or broadening auth;
- Work 0004 one-use local state indicates creation already began;
- creation attempt partially succeeds then fails;
- target ownership/binding is contradictory or realistically ambiguous;
- push attempt fails;
- pull attempt fails;
- pull inventory/parity fails;
- any forbidden runtime/Workspace operation would be required;
- any product-source change would be required.

Do not work around a stop condition.

## Required Codex chat return

Return only:

```text
Work ID
Report path
Final commit
Branch
PR
BLOCKER status
```
