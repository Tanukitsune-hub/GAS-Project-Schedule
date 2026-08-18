# Work 0036 Instruction

## Outcome

Build and validate the smallest safe successor to the frozen Code
`2.8.20-prepilot` baseline that can qualify unattended Automation in the
user's existing personal Google Workspace sandbox without exposing ordinary
Inbox mail to Gemini.

The successor candidate must:

- preserve Code `2.8.20-prepilot` on `main` as the known-good manual-plus-Gemini
  recovery point;
- become Code `2.8.21-prepilot`, with Schema `2.6`, AI Schema `2.0`, and
  Migration `3` unless evidence proves a schema/migration change is genuinely
  required;
- remain Automation OFF by default;
- provide a production-mode personal Automation qualification path that can
  process only one exact, fixed synthetic Gmail fixture and cannot process
  unrelated Inbox mail;
- preserve the accepted Gemini, Task/Review, Gmail, Calendar, authority,
  retry, checkpoint, privacy, and trigger fail-closed boundaries;
- generate and verify deterministic 2.8.21 Phase 8B and Phase 8C packages;
- after all non-Google gates pass, place the exact Phase 8C qualification
  payload on the already-existing personal-synthetic Apps Script target with
  Automation still OFF, followed by one independent pull-back parity check;
  and
- finish at `READY_FOR_USER_PERSONAL_AUTOMATION_E2E`, not at Automation enabled
  or personal production use.

This Work prepares the candidate and target. It does not execute the user-side
Automation E2E.

## Why Codex is needed

This is a cross-cutting runtime change involving Gmail candidate selection,
production Gemini readiness, trigger lifecycle, setup/version alignment,
production-mode packaging, deterministic release lineage, local regression
coverage, and exact existing-target placement. It requires local Git/runtime
access and executable validation that GitHub-only work cannot safely complete.

Route: `C`.

Recommended Codex model: `Sol High`.

Rationale: the key difficulty is not mechanical editing but proving that an
Automation trigger can be enabled for a real provider while ordinary Inbox
mail remains unreachable. The task also spans source, release, target parity,
and runtime handoff design. Incorrect scope or gating could expose personal mail
or weaken the 2.8.20 recovery baseline.

## Repository, branch, and exact starting ref

Repository: `Tanukitsune-hub/GAS-Project-Schedule`

Branch: `codex/0036-personal-automation-qualification`

Exact starting `main` commit:

`4c28231dc08dc89ee7a529cb0a6192325263c810`

This instruction is authoritative only at the exact commit supplied in the
Codex execution request.

## Source of truth and accepted baseline

Read and follow all applicable `AGENTS.md` files before implementation.

Primary current sources:

- `CURRENT_STATUS.md`
- `MASTER_PLAN.md`
- `DECISIONS.md`
- `PROJECT_CONTEXT.md`
- `CURRENT_CONTRACT.json`
- `implementation/GoogleSpreadsheet/apps-script-v2/`
- `implementation/GoogleSpreadsheet/tests/`
- `implementation/GoogleSpreadsheet/tools/`
- `implementation/GoogleSpreadsheet/release/v2.8.20-prepilot/`
- `implementation/GoogleSpreadsheet/release/v2.8.20-prepilot-phase8c/`
- `docs/handoffs/0033-live-e2e-review.md`
- `docs/handoffs/0035-report.md`

Accepted 2.8.20 baseline:

- Code: `2.8.20-prepilot`
- Schema: `2.6`
- AI Schema: `2.0`
- Migration: `3`
- Personal Gemini E2E: `PASS`
- Automation: `OFF`
- Apps Script payload SHA-256:
  `ced2ce52cd4a3faa46c66f0e1971a7cebb14334ca7d3f2bcb3ec79799c82effe`
- Canonical clean-main commit:
  `4c28231dc08dc89ee7a529cb0a6192325263c810`

The 2.8.20 source, release packages, reports, and evidence are historical and
must not be rewritten or replaced.

## ChatGPT-completed work and decisions

ChatGPT has already:

1. merged Work 0035 to `main` and made the clean 2.8.20 tree canonical;
2. independently verified final-head CI with 11/11 gate sections, 74 suites,
   exact payload parity, release/lineage PASS, and secret scan 0 hits;
3. closed the 37 superseded Draft PRs without deleting branches or evidence;
4. confirmed the project is for the user's personal Google Workspace only and
   no company-PC/company-environment rollout is planned;
5. confirmed the existing Automation lifecycle is default-disabled,
   idempotent, single-trigger, canonical-trigger-UID checked, and independently
   stoppable;
6. confirmed clear newsletters and Google Calendar-generated notifications
   already have implemented filter logic but their approval flags are false;
7. confirmed the current automatic Gmail query is otherwise broad enough to
   reach normal Inbox mail and is therefore not safe for a first live
   Automation qualification; and
8. selected a separate synthetic-only qualification candidate before any
   normal personal-Inbox pilot.

## Decided design

### 1. Personal sandbox only

Active code, UI, diagnostics, and status wording must use personal
owner/operator approval semantics. Remove active references that imply a
company approval or company-PC rollout is required.

Preserve independent gates for:

- explicit owner/operator authorization;
- synthetic-data policy authorization;
- Script Properties credential-storage authorization;
- credential presence/auth configuration;
- OAuth and service readiness; and
- exact target/setup/version readiness.

A backward-compatible internal alias may remain only if it materially reduces
risk, but user-facing readiness must not report a fictitious company approval.
Do not replace the gates with a hard-coded unconditional `ready=true`.

The user's authorization in this Work applies only to the exact synthetic
qualification fixture. It does not authorize sending ordinary personal mail to
Gemini.

### 2. New candidate, frozen recovery point

Create Code `2.8.21-prepilot` as a direct successor from current `main`.
Preserve 2.8.20 as the recovery baseline and preserve all existing 2.8.20
release/evidence paths.

Use a new deterministic A21/B21 source/release lineage and update current
contract, release tooling, tests, and active documents consistently. Phase 8B
retains `TEST_MODE=true` and the harness. Phase 8C applies the audited
production-mode transform and excludes the harness.

### 3. Automation remains OFF by default

`AUTOMATION_ENABLED` must remain false in authored source and both packages.
Setup, candidate preparation, source placement, readiness, and diagnostics must
not create the 5-minute trigger.

Only the later user-controlled explicit enable action may create one canonical
trigger after every prerequisite passes.

### 4. Exact synthetic-only Automation scope

Code `2.8.21-prepilot` is an Automation qualification candidate, not a normal
Inbox pilot.

While this candidate is active, automatic discovery must be restricted to the
exact fixed fixture below. It must be structurally impossible for unrelated
Inbox mail, newsletters, promotions, social mail, Calendar notifications, or a
near-match fixture to reach the Gemini transport.

Exact subject:

`[WORK_OS_AUTOMATION_SYNTHETIC_0036]`

Exact normalized UTF-8 body:

```text
WORK_OS_AUTOMATION_SYNTHETIC_BODY_0036
これは架空の自動処理検証メールです。個人情報、機密情報、実在の本番データを含みません。
架空の社内タスクとして、自動処理の動作確認メモを確認してください。
処理日から7日後までに確認してください。
外部提出、法律、税務、規制、契約、入札、その他の高影響なカレンダー予定ではありません。
```

Requirements:

- narrow the Gmail automatic query to the exact qualification subject in
  addition to Inbox/spam/trash/manual-exclusion controls;
- validate exact normalized subject and body before any Gemini request;
- reject truncated body transport;
- process at most one fresh exact Message per qualification run;
- keep prior processed/terminal exact Message IDs suppressed;
- fail closed on zero, duplicate, ambiguous, stale, malformed, or near-match
  fixtures;
- never fall back to the broad normal-Inbox query; and
- retain bounded metadata/body/context and API-call budgets.

Prefer one explicit qualification-scope abstraction over scattered ad hoc
special cases. There must be no callable switch to broad normal-Inbox mode in
2.8.21. Broad personal-Inbox activation belongs to a later Work after this
qualification passes.

### 5. Existing exclusion decisions are approved for qualification

For this personal synthetic qualification:

- clear newsletters are excluded;
- Google Calendar-generated notification mail is excluded;
- Promotions and Social categories remain excluded;
- `手動/除外` remains authoritative and thread-wide; and
- the exact qualification fixture requires no `手動/取込` label.

Set the relevant approval/configuration flags consistently and retain focused
negative tests. Do not broaden sender-pattern matching beyond the existing
clear metadata rules without evidence.

### 6. Real Gemini, no fallback

The Phase 8C qualification candidate must use the accepted Gemini
`/v1beta/interactions` transport and `gemini-3.6-flash` contract. Preserve the
provider-facing schema compatibility projection, strict application validation,
`thought* model_output` parsing, bounded diagnostics, no retry at the request
boundary, and no model/provider/endpoint fallback.

Readiness may verify safe credential presence and construct/health-check the
adapter, but must perform zero Gemini requests.

### 7. Safe candidate preparation and version alignment

The existing personal target contains durable 2.8.20 setup/state and Script
Properties. Provide or prove the smallest idempotent path that aligns the target
to Code 2.8.21 without deleting/recreating Tasks, Reviews, Message State,
Calendar events, labels, authority ledger records, or the Gemini key.

Prefer the existing setup/migration/runtime-settings path if it is safe and
sufficient. Add a narrowly scoped explicit preparation entry point only if
necessary. Candidate preparation must:

- require Automation OFF and zero canonical clock triggers;
- verify existing schema/migration compatibility;
- update only the minimum version/runtime metadata required;
- preserve the configured Gemini credential without reading or logging its
  value;
- be idempotent; and
- leave Automation OFF.

### 8. Bounded user-facing readiness and lifecycle evidence

Provide a no-argument, menu-callable, privacy-safe readiness/status surface for
the later user-controlled qualification. It must clearly report at least:

- candidate/version and qualification scope;
- TEST_MODE/production-mode readiness;
- operator/data/credential/auth approval readiness;
- formal labels and dedicated Calendar readiness;
- Automation enabled/desired state;
- handler/clock trigger counts;
- stored/canonical trigger presence;
- whether the exact qualification query/body guard is active; and
- whether any external request was performed (`false` for readiness).

Keep the existing explicit enable and disable lifecycle fail-closed. The later
user must be able to prove exactly one canonical 5-minute trigger after enable
and zero owned triggers/effective running after disable.

Update the menu confirmation text so it accurately describes personal
synthetic qualification rather than broad normal-Inbox or company approval.

### 9. Calendar boundary

Do not redesign Calendar behavior. The existing managed Calendar
CREATE/UPDATE/DELETE lifecycle is already accepted. The later first automatic
E2E is expected to prove Gmail → Gemini → governed Task/Review with this
non-high-impact fixture; a Calendar event is not a required completion condition
for Work 0036.

If implementation changes touch Calendar enqueue/sync behavior, run the full
affected Calendar regression set and stop on any behavioral drift.

## Required scope

1. Inspect the current Phase 6 Automation, Gmail automatic discovery,
   production AI readiness, runtime settings, menu, release, and placement
   paths before editing.
2. Implement the decided 2.8.21 synthetic-only personal Automation
   qualification candidate with the minimum coherent source changes.
3. Add focused unit/integration/failure-injection coverage for every new gate
   and selection boundary.
4. Update active source documentation and canonical current-status/decision
   documents while preserving historical records.
5. Build deterministic Phase 8B and Phase 8C 2.8.21 packages and A21/B21
   lineage.
6. Run the full accepted non-Google validation gate locally.
7. Obtain exact-head pre-placement GitHub Actions success.
8. After all gates pass, use only the already-existing personal-synthetic target
   used for Work 0033:
   - perform at most one guarded Phase 8C source placement;
   - perform at most one independent isolated pull-back;
   - require exact Phase 8C file inventory and byte/hash parity;
   - do not create a new target, deployment, Cloud project, OAuth client, or
     credential;
   - do not invoke any Apps Script function or mutate Automation/trigger state.
9. Write `docs/handoffs/0036-report.md`, commit and push it, update the Draft PR,
   and obtain final-head CI success.

## Required regression coverage

At minimum, tests must prove:

- 2.8.21 defaults to Automation OFF;
- Phase 8B/Test Mode cannot enable Automation;
- readiness performs no Gmail body fetch, Gemini request, Calendar write, or
  trigger mutation;
- Phase 8C production readiness uses real Gemini and cannot fall back to Mock;
- the automatic query is restricted to the exact 0036 subject;
- only the exact normalized body is accepted before the provider boundary;
- near-match subject/body, truncation, duplicate/ambiguous candidates, and
  prior terminal Message IDs are rejected without a provider call;
- ordinary Inbox mail is excluded in qualification mode;
- newsletter, Google Calendar notification, Promotions, Social, spam, trash,
  non-Inbox, and `手動/除外` cases remain excluded;
- a fresh exact fixture requires no manual label and can be selected once;
- enable creates exactly one canonical 5-minute trigger only after every
  prerequisite passes;
- repeated/concurrent enable remains idempotent and serialized;
- non-canonical trigger UID cannot run the worker;
- disable wins during races, prevents external calls immediately, removes only
  owned triggers, and leaves unrelated triggers untouched;
- version alignment is compatible, idempotent, and preserves durable data;
- output/status fields remain bounded and privacy-safe; and
- the complete existing regression suite remains green.

## Release and validation acceptance

Expected active contract after implementation:

- Code: `2.8.21-prepilot`
- Schema: `2.6`
- AI Schema: `2.0`
- Migration: `3`
- Automation default: `OFF`
- Scope: `SYNTHETIC_AUTOMATION_QUALIFICATION_ONLY`

Create new current packages:

- `implementation/GoogleSpreadsheet/release/v2.8.21-prepilot/`
- `implementation/GoogleSpreadsheet/release/v2.8.21-prepilot-phase8c/`

Do not modify historical 2.8.20 package bytes.

From `implementation/GoogleSpreadsheet`, run:

```text
pnpm install --frozen-lockfile
pnpm run verify:local
```

The final gate must include all current tests plus the new focused Work 0036
coverage, Apps Script inventory/static validation, deterministic 2.8.21 release
verification, A21/B21 lineage, current-main scope, secret/local-state scan, and
`git diff --check`.

Record exact observed counts and hashes; do not predeclare them as passed.

## Existing-target placement boundary

Placement is authorized only after source/formula-equivalent freeze, complete
local validation, and pre-placement exact-head CI success.

Allowed:

- reuse the exact existing personal-synthetic target previously used by Work
  0033;
- one guarded Phase 8C push/update-content attempt;
- one independent pull-back attempt;
- privacy-safe inventory/hash/parity evidence.

Prohibited:

- creating or selecting a different target;
- invoking Setup, candidate preparation, readiness, status, enable, disable,
  worker, Gmail, Calendar, Dashboard, diagnostics, Gemini validation, or any
  Apps Script function;
- creating, deleting, or inspecting trigger identifiers;
- inspecting, copying, rotating, or logging the Gemini key;
- sending or reading real personal mail beyond the remote source-content parity
  operation;
- performing a real Gemini request; or
- retrying after either one authorized placement/pull attempt is consumed.

If exact existing-target binding cannot be safely established from the
previously accepted untracked local configuration, stop without target
mutation and report the required user action.

## Non-goals

Do not:

- enable Automation;
- execute the scheduled worker;
- send or process the 0036 synthetic Gmail fixture;
- process ordinary personal mail;
- add a broad normal-Inbox mode or pilot switch;
- create Calendar events;
- change Task/Review/Calendar business semantics;
- change Schema 2.6, AI Schema 2.0, or Migration 3 without a proven blocker;
- modify historical 2.8.20 source/release/evidence;
- configure or inspect credential values;
- perform company-PC/company-environment work;
- add fallback providers/models/endpoints;
- merge the PR; or
- delete historical branches or evidence.

## Success and stop conditions

Success status:

`READY_FOR_USER_PERSONAL_AUTOMATION_E2E`

This means the exact Phase 8C candidate is placed and parity-verified with
Automation still OFF. It does not mean Automation has run or normal personal
mail is approved.

Stop and report `BLOCKER: YES` rather than improvising if:

- unrelated Inbox mail cannot be proven unreachable before the Gemini call;
- synthetic qualification requires weakening existing validation, privacy,
  authority, retry, or trigger guards;
- a real product defect is found in the accepted 2.8.20 baseline;
- existing durable state requires a destructive migration;
- 2.8.20 historical bytes would need to change;
- deterministic 2.8.21 release/lineage cannot be established;
- a new target, credential, deployment, or OAuth setup is required;
- Automation or an owned clock trigger is discovered active during any
  permitted read-only preflight;
- a secret, private identifier, raw mail body, provider payload, or local path
  would enter GitHub/chat/evidence; or
- final CI fails for an implementation-caused reason that cannot be resolved
  within this bounded scope.

Non-blocking optional UI polish must not delay completion.

## Git and PR requirements

- Work only on `codex/0036-personal-automation-qualification`.
- Keep changes coherent and reviewable.
- Do not merge, rebase, or rewrite shared history.
- Commit the source stage and release stage intentionally so A21/B21 provenance
  is inspectable.
- Push the branch.
- Open or update exactly one Draft PR targeting `main`.
- Link this instruction and `docs/handoffs/0036-report.md` in the PR.
- Do not merge the PR.

## Mandatory subagent use

Before starting, read every applicable `AGENTS.md`, identify the current
repository-specific subagent/delegation policy, and follow it.

Use subagents actively and proportionately. At minimum obtain:

- an independent analysis of Gmail qualification scope and the proof that
  ordinary Inbox mail cannot reach Gemini;
- an independent review of trigger lifecycle, provider readiness, and durable
  state/version alignment; and
- an independent final diff/release/validation audit.

The parent agent retains integration and final judgment. Avoid overlapping
writes and unnecessary duplication. Do not restore deleted repository-scoped
custom-agent configuration.

## Required report

Write `docs/handoffs/0036-report.md`, commit and push it with the completed
work, and link it in the Draft PR.

The report must state:

- outcome and BLOCKER status;
- starting main, source-stage, release-stage, and final refs;
- Code/Schema/AI Schema/Migration versions;
- exact qualification scope and fixture guard;
- proof ordinary Inbox mail cannot reach Gemini;
- owner/operator approval and readiness semantics;
- trigger lifecycle and disable evidence;
- safe version-alignment result;
- focused and full local test results;
- release/checksum/lineage results;
- pre-placement and final CI results;
- existing-target placement attempt count and pull-back parity;
- confirmation Automation remained OFF and no function/Gmail/Calendar/Gemini
  runtime operation occurred;
- any required user action before the later E2E; and
- final commit, branch, and PR.

Return to ChatGPT only:

- Work ID
- Report path
- Final commit
- Branch
- PR
- BLOCKER status
