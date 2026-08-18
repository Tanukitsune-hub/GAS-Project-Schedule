# Work 0006 — Fresh Controlled Personal-Synthetic Remote Placement

## Outcome

Starting from the exact completed Work 0005 clasp-contract repair, prove on one newly created personal-synthetic Google target that the unchanged Code `2.8.12-prepilot` Phase 8B Apps Script payload can be:

1. selected by project-local clasp 3.3.0 as exactly 23 canonical files;
2. pushed exactly once;
3. pulled independently exactly once with `.gs` as the preferred script extension; and
4. reproduced with exact 23-file byte/hash parity.

The highest permitted successful status is:

```text
READY_FOR_CONTROLLED_SANDBOX_RUNTIME_VALIDATION
```

This status means only that a fresh synthetic target, binding, remote placement, independent pull-back, and exact byte parity have been proven for the exact candidate. It does not authorize or claim Setup, Quick/Deep Diagnostic, Apps Script runtime acceptance, Gmail, Calendar, triggers, deployment, Phase 8B overall PASS, Phase 8C GO, pilot, production, company handoff, or real-data use.

## Why Codex is needed

Route C. The residual work requires local ignored state, executable project-local clasp 3.3.0 behavior, controlled creation of one fresh synthetic Google Spreadsheet and bound Apps Script project, one guarded external push, one independent external pull, exact local parity validation, and final Git/CI evidence.

ChatGPT has completed the repository-only authorization boundary and created this exact handoff/ref.

## Exact starting point

Repository:

```text
Tanukitsune-hub/GAS-Project-Schedule
```

Work 0005 final head:

```text
e170885476ce202697b837c75fe5a6294cc429f3
```

Work 0005 status:

```text
READY_FOR_FRESH_CONTROLLED_REMOTE_PLACEMENT_RETRY
BLOCKER: NONE
```

Work 0005 proved locally with the actual project-local clasp 3.3.0 path that:

- exactly 23 canonical files are push-eligible;
- the canonical payload is 22 `.gs` files plus `appsscript.json`;
- explicit `scriptExtensions: [".gs", ".js"]` makes `.gs` the preferred pull extension;
- the exact 23-name `.claspignore` allowlist excludes extra `.gs`, `.js`, `.html`, docs, `.clasp*`, generated state, and outside-root files;
- the native `show-file-status --json` gate can fail closed before any remote push attempt state is recorded.

Exact product candidate remains:

```text
Source A12: d3f93e05e77a3cdccf24c5a5b7d8def452155841
Release B12: 0b655e6df51d7ac56c1936fb57331e03516ebe0c
Code: 2.8.12-prepilot
Schema: 2.6
AI Schema: 2.0
Migration: 3
TEST_MODE: true for Phase 8B payload
Automation: OFF
External AI: disabled / production provider registry empty
Canonical payload files: 23
```

Task branch:

```text
codex/0006-fresh-controlled-remote-placement
```

This branch is created from exact Work 0005 final head `e170885476ce202697b837c75fe5a6294cc429f3`.

Do not rebase onto `main`, import unrelated donor branches, merge prior PRs, or alter the candidate lineage.

## Canonical inputs

Read before implementation/execution:

```text
AGENTS.md
CURRENT_CONTRACT.json
CURRENT_STATUS.md
DECISIONS.md
PROJECT_CONTEXT.md
MASTER_PLAN.md
docs/handoffs/0004-report.md
docs/handoffs/0005-instruction.md
docs/handoffs/0005-report.md
implementation/GoogleSpreadsheet/package.json
implementation/GoogleSpreadsheet/tools/local_clasp_dev.js
implementation/GoogleSpreadsheet/tools/work_0004_target_bootstrap.js
implementation/GoogleSpreadsheet/tests/clasp_native_inventory_contract_test.js
implementation/GoogleSpreadsheet/tests/local_clasp_validation_gate_test.js
implementation/GoogleSpreadsheet/tests/work_0004_target_bootstrap_test.js
```

Historical Work 0004 target/state is evidence only. It is not an authorized target or reusable one-use state for Work 0006.

## Required-now scope

### 1. Reconfirm exact candidate and local environment

Before any Google access:

- fetch the latest remote state;
- check out the exact Work 0006 branch/ref;
- confirm ancestry from exact Work 0005 final head;
- confirm product `.gs` source, `appsscript.json`, A12/B12 release packages, versions/schemas, Automation OFF, and Provider state remain unchanged;
- confirm root `AGENTS.md` and `.codex/**` are not changed by Work 0006;
- confirm Git identity is configured without emitting its values;
- confirm Node, pnpm, and project-local clasp 3.3.0 are available;
- confirm the existing default clasp authorization can be used non-interactively and belongs to a personal Google principal, without emitting the identity or OAuth metadata;
- run `pnpm install --frozen-lockfile`;
- run the complete local verification gate;
- run the focused clasp-native inventory/extension regression coverage;
- stage the canonical payload and prove exactly 23 files with the expected payload hash;
- run the actual project-local clasp-native local file-status/eligibility gate before any remote attempt is recorded.

If candidate bytes, lineage, local gates, auth preflight, or clasp-native eligibility differ from Work 0005 evidence, stop before Google mutation and report a BLOCKER.

### 2. Work 0006-specific one-use tooling/state

Before any remote mutation, make only the smallest tooling/test/document changes necessary to create a distinct Work 0006 execution lane.

Required properties:

- exact branch guard for `codex/0006-fresh-controlled-remote-placement`;
- fresh Work 0006-specific ignored creation/inspection/push/pull state distinct from Work 0003 and Work 0004 state;
- Work 0004 target and state must not be deleted, reset, rewritten, reinterpreted, imported, or reused as authority;
- new target records must identify Work ID `0006` internally only in ignored local state;
- actual account, Spreadsheet ID, Script ID, project number, OAuth client data, target URL, token, credential path, or raw Google response must never enter tracked files, GitHub, report, chat, or normal stdout;
- stdout/report evidence is limited to closed enums, counts, canonical payload hash, and non-reversible fingerprints;
- one-use state is written before each external mutation/attempt so retries fail closed;
- creation attempt count max 1;
- push attempt count max 1;
- pull attempt count max 1;
- target/binding inspection max 2;
- actual clasp-native 23-file eligibility gate must pass before the push attempt state is recorded;
- generated `.clasp.json` for target and independent pull must explicitly use `rootDir: "payload"` and `scriptExtensions: [".gs", ".js"]`;
- generated `.claspignore` must use the exact canonical 23-name allowlist proven by Work 0005.

Prefer adapting the existing bounded tooling rather than creating a parallel general-purpose deployment system.

Do not change product source or versioning to accomplish this.

### 3. Pre-Google publication gate

After any Work 0006 tooling/test changes and before the first Google mutation:

- run all focused tests;
- run the complete non-Google local gate from a clean worktree;
- run release/lineage/secret checks;
- run `git diff --check`;
- commit only the authorized tooling/test/handoff-adjacent changes;
- push the Work 0006 branch normally;
- update/create the Draft PR;
- require final pre-Google GitHub Actions for that tooling head to PASS.

CI must remain non-Google and receive no Google credential, target identifier, or ignored state.

No Google mutation may start before the pre-Google branch head and CI are fixed and passing.

### 4. Select exactly one NEW personal synthetic target

Work 0006 authorizes creation of exactly one new blank personal synthetic Google Spreadsheet plus exactly one bound Apps Script project using the already-authenticated personal principal.

The Work 0004 synthetic target must not be reused.

The new target must:

- be dedicated to Work 0006;
- be clearly synthetic/non-production;
- contain no real mail, tasks, calendar data, attachments, personal/business information, credentials, internal URLs, or production configuration;
- not be in a Shared Drive;
- be owned by the authenticated personal principal;
- have no pending-owner ambiguity;
- have the expected bound-container relationship;
- have no standard Cloud-project creation/change and no API-executable deployment.

Creation authority is consumed once the first creation API attempt begins. If creation fails, stop. Do not retry or switch targets.

### 5. Authentication boundary

This Work ID authorizes reuse of the already-existing non-interactive default clasp authorization only for the one new personal synthetic target above.

It does not authorize:

- interactive OAuth login/re-consent;
- logout/login cycling;
- account switching;
- alternate/second auth profiles;
- credential creation/rotation;
- OAuth scope expansion;
- Cloud Console mutation;
- standard Cloud-project creation;
- API-executable deployment creation.

If existing authorization is unavailable, expired in a way that requires user interaction, belongs to an unexpected/non-personal principal, or cannot safely bind the new target, stop with `USER_ACTION_REQUIRED_BLOCKER`.

### 6. Target binding checks before push

After the single fresh target is created, perform at most two read-only binding/ownership inspections in total.

Before push, prove without emitting identifiers:

- target kind is `PERSONAL_SYNTHETIC_DEV`;
- target disposition is `FRESH_SYNTHETIC_CREATED`;
- local ignored `.clasp.json`, target metadata, and Work 0006 state refer to the same script/container;
- identifier values are absent from tracked Git content;
- `ownedByMe=true` when available;
- owner count = 1;
- Shared Drive absent;
- pending-owner ambiguity absent;
- bound-container relationship is consistent;
- principal fingerprint remains consistent with creation/auth preflight;
- target fingerprint is present and non-reversible.

Any contradiction or realistic wrong-target ambiguity is a no-push BLOCKER.

### 7. Exact authorized external sequence

Only after all preceding gates pass, Work 0006 authorizes this exact sequence against the one new synthetic target:

1. one fresh target creation attempt (already described above);
2. at most two total read-only target/binding inspections;
3. exactly one guarded `clasp push` of the staged canonical 23-file payload;
4. exactly one independent `clasp pull` into a newly isolated pull-verification workspace;
5. local exact inventory and byte/hash comparison of all 23 pulled files against the staged canonical payload.

Immediately before the guarded push, the actual project-local clasp 3.3.0 file-status/eligibility path must prove:

```text
eligible files = 23
.gs files = 22
manifest files = 1
missing = 0
extra = 0
```

The independent pull config must explicitly prefer `.gs` with:

```json
"scriptExtensions": [".gs", ".js"]
```

Success requires:

```text
push attempt count = 1
push result = PASS
pull attempt count = 1
pull result = PASS
pulled payload file count = 23
pulled .gs file count = 22
pulled manifest count = 1
missing files = 0
extra files = 0
byte/hash parity = PASS
```

No retry is authorized after a creation, push, or pull attempt begins.

If push fails: stop.
If pull fails: stop.
If inventory differs from 23: stop.
If filenames/extensions differ: stop.
If parity fails: stop.

Do not auto-correct remote content, push again, pull again, delete/recreate the target, or fall back to another target/account.

### 8. Forbidden operations

Do not perform any of the following in Work 0006:

- reuse or mutate the Work 0004 target as the Work 0006 target;
- delete Work 0004 or Work 0006 synthetic targets as cleanup;
- second target creation attempt;
- second push or second pull;
- `clasp run` or Apps Script `scripts.run`;
- any Apps Script function invocation;
- Setup or continuation of Setup;
- Quick Diagnostic or Deep Diagnostic;
- Dashboard refresh;
- Gmail search/read/write/label operation;
- Calendar list/create/update/delete operation;
- trigger creation/deletion;
- standard Cloud-project creation/change;
- Apps Script API-executable deployment creation/change;
- OAuth re-consent/account switching/second profile;
- real AI Provider configuration/request;
- Automation enablement;
- Phase 8C deployment;
- company-PC transfer or company resource;
- production resource;
- real data;
- merge of PR #17, #18, #19, or any older PR;
- force push/history rewrite;
- root `AGENTS.md` or `.codex/**` changes;
- dependency version upgrade;
- product source/release/version/schema change.

Do not invoke repository-defined custom agents. Standard Codex subagents may be used only for bounded, non-overlapping local review/testing where materially useful. The main agent owns the external sequence and final verification.

## Acceptance checks

### Repository and candidate

- Work 0006 branch descends from exact Work 0005 final head `e170885476ce202697b837c75fe5a6294cc429f3`;
- exact A12/B12 candidate and release bytes unchanged;
- product/version/Automation/Provider settings unchanged;
- root `AGENTS.md` and `.codex/**` unchanged;
- no real identifier/account/OAuth/credential/URL/local credential path tracked;
- worktree clean at each external mutation boundary and final completion;
- `git diff --check` PASS.

### Local clasp contract

- project-local clasp = 3.3.0;
- exact canonical 23-file staged inventory;
- actual clasp-native eligibility gate = exact 23;
- explicit `scriptExtensions: [".gs", ".js"]` for target and independent pull;
- exact 23-name ignore allowlist;
- focused Work 0006 one-use/state tests PASS;
- Work 0005 clasp-native contract regression PASS;
- complete local validation PASS.

### Remote placement

- fresh target creation attempts = 1;
- target disposition = `FRESH_SYNTHETIC_CREATED`;
- binding inspection count <= 2;
- ownership/binding checks PASS;
- push attempts = 1 and PASS;
- pull attempts = 1 and PASS;
- pulled files = exactly 23;
- pulled scripts = exactly 22 `.gs`;
- pulled manifest = exactly 1 `appsscript.json`;
- missing/extra = 0/0;
- exact byte/hash parity = PASS;
- no runtime/function/Setup/Gmail/Calendar/trigger/deployment/Provider/Automation operation.

### GitHub Actions

- publish a pre-Google tooling head before external mutation;
- pre-Google final-head non-Google CI PASS;
- after final report commit, final report-head non-Google CI PASS;
- CI accesses no Google credentials or target state.

## Evidence and report

Create:

```text
docs/handoffs/0006-report.md
```

The report must contain only privacy-safe evidence and include:

- outcome and highest status;
- exact starting and final candidate refs;
- changed tooling/test files;
- local clasp-native eligibility/extension evidence;
- pre-Google CI result;
- auth preflight closed result;
- fresh target disposition and non-reversible fingerprint only;
- creation/inspection/push/pull attempt counts;
- pulled inventory counts;
- parity result;
- explicit confirmation of every forbidden runtime/service operation as NOT_EXECUTED;
- final branch/commit/PR;
- BLOCKER status.

Never include account email, OAuth client ID, Spreadsheet ID, Script ID, project number, URL, token, credential value/path, or raw Google response.

## Git / PR requirements

Branch:

```text
codex/0006-fresh-controlled-remote-placement
```

Draft PR base:

```text
codex/0005-clasp-inventory-contract-repair
```

Keep the PR Draft and unmerged.

Do not modify/merge the older stacked PRs except to reference them as historical evidence.

After completion:

- commit all in-scope changes and report;
- push normally;
- update the Draft PR with instruction/report links, exact final head, outcome, validation, attempt counts, and guardrail summary;
- verify final-head GitHub Actions;
- confirm clean worktree;
- do not merge.

## Stop / escalation conditions

Stop safely with a BLOCKER if any of the following occurs:

- candidate/version/release bytes differ from Work 0005;
- root governance or unrelated product changes are required;
- local validation or clasp-native 23-file gate fails;
- existing auth requires interactive user action or is not the expected personal class;
- target ownership/binding is unsafe or ambiguous;
- fresh target creation fails after its first attempt begins;
- push fails after its single attempt begins;
- pull fails after its single attempt begins;
- pulled inventory is not exactly 23 with 22 `.gs` + manifest;
- exact parity fails;
- sensitive identifier/account/OAuth/credential data would need to be recorded;
- safe continuation would require a second target, second push/pull, account/profile fallback, Setup, runtime invocation, deployment, or any forbidden operation.

Do not work around a stop condition.

## Codex chat return contract

Return only:

```text
Work ID
Report path
Final commit
Branch
PR
BLOCKER status
```
