# Work 0003 — Controlled Personal-Synthetic Remote Placement and Pull-back Parity

## Outcome

Starting from the exact completed Work 0002 candidate, prove that the exact Code `2.8.12-prepilot` Apps Script payload can be safely bound to one personal synthetic Google target, pushed exactly once, pulled back exactly once, and reproduced byte-for-byte without exposing identifiers or expanding into runtime/functional acceptance.

This Work ID is a controlled remote-placement validation tranche only.

Success status for this Work ID is:

```text
READY_FOR_CONTROLLED_SANDBOX_RUNTIME_VALIDATION
```

That status means only that target binding, one guarded remote placement, and pull-back byte parity are established for the exact candidate. It does not mean Setup, Quick/Deep Diagnostic, Gmail, Calendar, trigger, runtime, Phase 8B overall, Phase 8C GO, pilot, production, company handoff, or end-to-end acceptance.

## Why Codex is needed

Route C. The remaining work requires local ignored target state, an authenticated local clasp runtime if already available, controlled external mutation of one synthetic Google target, remote pull-back, exact byte/hash verification, and executable validation. ChatGPT has completed the repository-only preparation and authorization boundary.

## Exact starting point

Repository:

```text
Tanukitsune-hub/GAS-Project-Schedule
```

Work 0002 completed candidate head:

```text
920b7180312e67ec522740113bc85c66758189b9
```

Work 0002 source/release contract:

```text
Source A12: d3f93e05e77a3cdccf24c5a5b7d8def452155841
Release B12: 0b655e6df51d7ac56c1936fb57331e03516ebe0c
Code: 2.8.12-prepilot
Schema: 2.6
AI Schema: 2.0
Migration: 3
Automation: OFF
```

Task branch:

```text
codex/0003-controlled-remote-placement
```

This branch was created from exact Work 0002 completed head `920b7180312e67ec522740113bc85c66758189b9`.

Do not rebase onto `main` or another donor branch. PR #16 remains the parent candidate and must remain untouched except for normal stacked-PR relationship evidence.

## Canonical inputs

Read before execution:

```text
CURRENT_CONTRACT.json
CURRENT_STATUS.md
docs/handoffs/0002-report.md
implementation/GoogleSpreadsheet/tools/v2_8_12/SANDBOX_QUICKSTART.md
implementation/GoogleSpreadsheet/tools/local_clasp_dev.js
implementation/GoogleSpreadsheet/tests/local_clasp_validation_gate_test.js
implementation/GoogleSpreadsheet/tests/local_validation_secret_scan_test.js
```

Historical design reference only, not a merge/cherry-pick target:

```text
PR #11 donor head: 5a80ae1eb4d887356c1ddee0899a08a372de7ac8
audits/2026-08-04/GoogleWorkspace_0022_Stage_A_Evidence_Bridge_Evidence_2026-08-04.md
```

Use that historical material only for lessons on privacy-safe target binding and fail-closed behavior. Do not import PR #11 wholesale and do not reintroduce its stale product/version/governance state.

## Required-now scope

### 1. Reconfirm the candidate locally

Before any Google operation:

- confirm exact branch ancestry from `920b7180312e67ec522740113bc85c66758189b9`;
- confirm `CURRENT_CONTRACT.json` still selects A12/B12 and `2.8.12-prepilot / 2.6 / 2.0 / 3`;
- confirm product source and release payload are unchanged from Work 0002;
- run `pnpm install --frozen-lockfile` and `pnpm run verify:local`;
- run the guarded staging command and record only the safe payload SHA-256;
- confirm the staged inventory is exactly the canonical 23-file TEST_MODE=true payload;
- confirm Automation remains OFF and no real Provider is configured.

If product source, release bytes, version contract, or local verification differs from Work 0002, stop before Google access and report `BLOCKER`.

### 2. Select exactly one personal synthetic target

The target must be one dedicated, non-production, synthetic Google Spreadsheet with its bound Apps Script project. It must contain no real mail, tasks, calendar data, attachments, personal information, company information, credentials, internal URLs, or production configuration.

Preferred order:

1. Reuse an already-existing ignored local target only if it can be positively established as the prior personal synthetic development target and contains no real/business data.
2. If no acceptable target exists, this Work ID authorizes creation of exactly one new blank personal synthetic Spreadsheet plus its bound Apps Script project using the already-authenticated personal Google principal.

If creating a new target:

- create only one target;
- use a clearly synthetic/non-production title;
- do not create a standard Cloud project;
- do not create an API-executable deployment;
- do not create Gmail labels, Calendar resources, triggers, Sheets schemas, or application data;
- do not run Setup or any Apps Script function;
- do not delete the target as cleanup if a later step fails; leave it isolated and record the safe outcome.

### 3. Authentication and identity boundary

This Work ID authorizes reuse of an already-authenticated local clasp/Google profile only for the target above.

It does not authorize a new OAuth consent flow, credential creation, credential rotation, broad scope grant, Cloud Console mutation, standard Cloud-project creation, API-executable deployment, or browser-based account switching.

If the existing authenticated state is missing, expired in a way that requires interactive re-consent, belongs to an unexpected principal, or cannot safely bind the target, stop and report:

```text
USER_ACTION_REQUIRED_BLOCKER
```

Do not work around it with a second profile or alternate account.

Never write the account, script ID, Spreadsheet ID, project number, OAuth client ID, deployment ID, URL, token, credential path, or raw provider output into GitHub, chat, logs committed to Git, or the report.

Actual identifiers may exist only in the existing ignored local binding required by the guarded tooling. Report only closed enums, counts, and SHA-256 fingerprints that cannot recover the underlying identifier.

### 4. Target binding checks before mutation

Before the push, establish as much of the following as the existing authenticated surfaces safely allow, without requesting broader OAuth consent:

- target kind is `PERSONAL_SYNTHETIC_DEV`;
- ignored `.clasp-dev/.clasp.json` and ignored target binding refer to the same script;
- the target identifier is not tracked anywhere in Git;
- target is not an existing production/company script;
- if current Drive metadata is already accessible without new consent: `ownedByMe=true`, one owner, no Shared Drive `driveId`, no pending-owner ambiguity, bound-container relationship consistent;
- if the target was freshly created in this Work ID: bind the creation receipt to the same local principal and target fingerprint as non-identifying provenance.

Any contradiction or unresolved evidence that creates a realistic wrong-target risk is a no-push `BLOCKER`.

Do not lower the guard merely because a field is unavailable.

### 5. Authorized external operations — exact bounded sequence

After all local and target checks pass, this Work ID authorizes only this remote sequence against the one selected synthetic target:

1. Up to two read-only target/status inspections as needed to confirm the binding.
2. Exactly one guarded `clasp push` of the staged canonical 23-file payload.
3. Exactly one independent `clasp pull` into the isolated pull-verification workspace.
4. Local byte/hash comparison of all 23 pulled files against the staged payload.

Use the existing `local_clasp_dev.js` guarded lane where it is sufficient. Set its explicit push opt-in only for the authorized push/pull sequence.

No retry is authorized for the push. No second push is authorized after a push attempt begins.

No retry is authorized for the pull after a pull attempt begins.

If push fails, stop. If pull fails, stop. If pull succeeds but parity fails, stop. Do not auto-correct remote bytes, do not push again, do not delete the target, and do not fall back to another target.

### 6. Tooling changes allowed before the external mutation

Before the first remote push attempt, Codex may make narrowly scoped local tooling/test/document changes only if required to execute this exact Work 0003 safety contract, for example:

- add a privacy-safe bootstrap for creating/binding one blank synthetic target;
- strengthen ignored-target validation;
- ensure command output cannot disclose identifiers;
- add regression tests for the exact one-push/one-pull/no-retry contract;
- add a closed, non-identifying target fingerprint/evidence format.

Any such change must remain local-tool/test/doc scope and must not change the product `.gs` source, `appsscript.json`, A12/B12 release bytes, product version/schema, Automation defaults, or Provider configuration.

If a product-source change appears necessary, stop and report `BLOCKER`; do not silently create Code 2.8.13 within this Work ID.

After any pre-push tooling change, rerun the full local gate and CI before the external push.

Once the external push attempt begins, do not make further code/tool changes and retry the external sequence under this handoff.

### 7. Evidence and outcome

On success, record only privacy-safe evidence sufficient to prove:

- exact candidate payload hash before push;
- target disposition: `REUSED_VERIFIED_SYNTHETIC` or `FRESH_SYNTHETIC_CREATED`;
- target identity binding result: PASS/FAIL using non-identifying fingerprint only;
- push attempt count = 1 and result;
- pull attempt count = 1 and result;
- pulled file count = 23;
- pull-back parity = PASS;
- no Setup/function/runtime/deployment/Provider operation occurred;
- Automation remained OFF;
- no real data was used.

The highest permitted successful status is:

```text
READY_FOR_CONTROLLED_SANDBOX_RUNTIME_VALIDATION
```

Do not declare runtime acceptance from placement/parity alone.

## Explicit non-goals / forbidden operations

Do not perform any of the following in Work 0003:

- `clasp run` or Apps Script `scripts.run`;
- `runQuickDiagnostic`, `runDeepDiagnostic`, Dashboard refresh, Setup, continuation of Setup, or any Apps Script function invocation;
- standard Cloud-project creation or change;
- Apps Script API-executable deployment creation or change;
- OAuth re-consent, a second auth profile, alternate account fallback, credential creation/rotation;
- Gmail search/read/write/labels;
- Calendar create/update/delete/list beyond incidental metadata already available without new consent;
- Drive mutation other than the one optional fresh synthetic target creation;
- trigger creation/deletion;
- Automation enablement;
- real AI Provider configuration or request;
- Phase 8C deployment;
- company-PC transfer, pilot, production, real data;
- merge of PR #16 or any older PR;
- changes to root `AGENTS.md` or `.codex/**`;
- source/release version bump or product logic repair.

## Acceptance checks

All applicable checks must pass at final branch head.

### Repository

- branch descends from exact Work 0002 head `920b7180312e67ec522740113bc85c66758189b9`;
- Work 0002 product/release contract remains unchanged;
- root `AGENTS.md` and `.codex/**` unchanged;
- no real identifier, credential, URL, account detail, or local machine path is tracked;
- `git diff --check` passes;
- worktree clean after commit/push.

### Local before remote

At minimum:

```bash
cd implementation/GoogleSpreadsheet
pnpm install --frozen-lockfile
pnpm run verify:local
pnpm run gas:stage:dev
```

If tool changes are made, add focused tests and rerun the complete gate before remote access.

### Remote placement

- exactly one target selected;
- exactly one push attempt;
- exactly one pull attempt;
- pulled inventory exactly 23 files;
- staged and pulled payload hashes equal;
- no runtime/function invocation;
- no Setup, Gmail, Calendar, trigger, deployment, or Provider operation.

### GitHub Actions

- push the branch normally;
- keep one Draft stacked PR whose base is `codex/0002-clean-integration-candidate`;
- final-head non-Google CI passes;
- CI itself must never access Google credentials or the synthetic target.

## PR and Git requirements

Branch:

```text
codex/0003-controlled-remote-placement
```

Create/update one Draft PR with base:

```text
codex/0002-clean-integration-candidate
```

Suggested title:

```text
0003: validate controlled synthetic remote placement
```

The PR must link:

```text
docs/handoffs/0003-instruction.md
docs/handoffs/0003-report.md
```

Keep PR #16 open, Draft, unmerged and unchanged in scope.

## Report requirement

Create and commit:

```text
docs/handoffs/0003-report.md
```

The report must include:

- outcome and highest justified status;
- exact starting Work 0002 head;
- whether an existing synthetic target was reused or one new blank target was created;
- privacy-safe target binding evidence/fingerprint only;
- local commands/results before remote action;
- exact counts of target inspections, push attempts, and pull attempts;
- safe push/pull result hashes and payload hash;
- pulled inventory count and parity result;
- confirmation that no runtime/function/Setup/Gmail/Calendar/trigger/deployment/Provider operation occurred;
- any tooling/test/doc changes and why they were necessary;
- GitHub Actions result;
- branch/commit/PR;
- `BLOCKER` status;
- the precise safest next Work ID boundary.

## Stop / escalation conditions

Stop without broadening scope if:

- Work 0002 candidate bytes or contract are not exact;
- local validation fails materially;
- existing target cannot be positively identified as personal synthetic and a fresh target cannot be safely created under the already-authenticated principal;
- interactive OAuth/re-consent or account switching is required;
- wrong-target risk remains;
- any real/business data is present;
- product-source change is required;
- push fails;
- pull fails;
- pull parity fails;
- an identifier/credential/private value would need to be committed or sent in chat;
- any success claim would require runtime execution.

A safe stop with preserved evidence is a valid Work 0003 outcome. Do not retry or improvise around an authorization or parity failure.

## Completion

Work 0003 is done when either:

1. the exact candidate has one verified personal-synthetic remote placement and one successful independent pull-back with 23-file byte parity, final CI passes, and the report is committed; or
2. a material stop condition is reached, no unsafe retry occurs, and the blocker plus safest next action are recorded.
