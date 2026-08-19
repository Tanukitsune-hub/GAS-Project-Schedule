# Work 0036 Review-Fix Instruction

## Outcome

Complete the existing Work 0036 outcome by repairing the false-readiness
surface before any user-controlled Automation E2E.

The repaired Code `2.8.21-prepilot` candidate must:

- remain synthetic-only and Automation OFF;
- keep ordinary personal Inbox mail unable to reach Gemini;
- provide a truthful, bounded, read-only, menu-callable personal Automation
  readiness result;
- provide an explicit menu action for the existing idempotent candidate
  preparation path;
- regenerate and verify the affected Phase 8B/8C packages without changing the
  frozen 2.8.20 recovery bytes;
- replace the exact repaired Phase 8C payload on the same existing
  personal-synthetic Apps Script target under the new one-use repair tranche
  defined below; and
- finish at `READY_FOR_USER_PERSONAL_AUTOMATION_E2E` only after the repaired
  readiness contract, exact target parity, final CI, and independent review all
  pass.

This is a continuation of Work ID `0036`. Do not create a new Work ID.

## Route and recommended model

Route: `C` — bounded implementation, executable validation, deterministic
release regeneration, and existing-target parity are required.

Recommended Codex model: `Luna Max`.

Rationale: ChatGPT has resolved the defect, design, scope, safety boundary, and
acceptance checks. The residual work is now a bounded implementation and
verification package rather than open-ended architecture work.

## Repository, branch, and authoritative ref

Repository: `Tanukitsune-hub/GAS-Project-Schedule`

Branch: `codex/0036-personal-automation-qualification`

PR: `#51`

Original Codex completion head:
`a056b088238dda93a41529e0b125a1306673de7d`

This instruction is authoritative only at the exact commit supplied in the
Codex execution request. Begin from that exact branch head; do not rebase,
force-push, merge `main`, or discard unrelated work.

## Required repository instructions and subagents

Before starting, read all applicable `AGENTS.md` files, including the root,
`docs/handoffs/AGENTS.md`, and
`implementation/GoogleSpreadsheet/AGENTS.md`. Identify and follow the
repository-specific delegation and subagent policy.

Use subagents actively and proportionately. At minimum, obtain independent
perspectives for:

- the false-readiness root cause and fail-closed decision semantics; and
- final source/release/placement review after implementation.

Avoid overlapping writes and unnecessary duplicate work. The parent agent
retains integration and final judgment.

## GitHub-verified starting evidence

ChatGPT independently verified the following on GitHub:

- PR `#51` is Draft / Open / Unmerged and currently targets exact main
  `4c28231dc08dc89ee7a529cb0a6192325263c810`;
- branch head `a056b088238dda93a41529e0b125a1306673de7d`
  contains `docs/handoffs/0036-report.md`;
- final PR CI run `#390` succeeded with 11/11 gate sections, 77 exact suites,
  missing 0, extra 0, release verification PASS, A21/B21 lineage PASS,
  historical 2.8.20 preservation PASS, and secret/local-state scan 0 hits;
- the exact Phase 8C payload was placed once on the existing target and one
  independent pull-back reached parity;
- Automation remained OFF and no Apps Script function, Gmail, Gemini,
  Calendar, trigger, Setup, or diagnostic runtime action was executed; and
- exact synthetic subject/body guards, production-only qualification scope,
  max-one candidate, and ordinary-Inbox exclusion are materially present.

Those completed facts remain valid. Do not repeat or reopen the prior external
placement merely for confidence.

## Confirmed BLOCKER

The new readiness surface is not authoritative.

`getPersonalAutomationQualificationStatus()` currently sets its top-level
status to `READY_FOR_CONTROLLED_QUALIFICATION` when Automation is consistent,
disabled, undesired, and has zero clock triggers. It does not require
`productionReadiness.ready`, Setup completion, target code/schema/migration
property alignment, actual credential readiness, OAuth readiness, formal Gmail
labels, or dedicated Calendar readiness. It returns:

- `formal_labels: NOT_CHECKED`; and
- `calendar: NOT_CHECKED`.

Therefore a 2.8.20 target with missing or invalid prerequisites can be shown as
READY even though `enableAutomation()` will later refuse it.

The actual enable path remains fail-closed, so this is not a permission
broadening or ordinary-Inbox exposure. It is a false readiness claim and a
BLOCKER under the repository review rules because the primary user E2E cannot
safely rely on the displayed result.

## ChatGPT-completed GitHub work

Before this handoff, ChatGPT directly completed the safe documentation work:

- corrected the README regression count from 76 to 77;
- corrected active Phase 8C decision wording to include the bounded provider-
  readiness flag transform;
- removed stale planning that treated the already-completed exclusion decision
  and successor candidate as future work;
- recorded the review HOLD and exact false-readiness blocker in active status,
  plan, and decisions; and
- preserved `docs/handoffs/0036-report.md` as the original Codex completion
  record.

Do not undo those corrections. Update them only as necessary after the repair
has actually passed.

## Decided repair design

### 1. One authoritative readiness decision

Refactor the personal qualification readiness path so its top-level decision
uses the complete prerequisite set enforced by `enableAutomation()`, or a
read-only equivalent with identical pass/fail semantics.

READY is permitted only when all of the following are true:

- exact Code `2.8.21-prepilot`, Schema `2.6`, AI Schema `2.0`, Migration `3`;
- existing Setup is complete;
- stored code/schema/migration properties match the candidate;
- `TEST_MODE=false` for the placed qualification payload;
- exact qualification scope, query, subject, and body guard are active;
- operator, data-policy, credential-storage, and auth configuration gates pass;
- the configured credential is actually present without reading or exposing its
  value;
- the production Gemini adapter is constructible/healthy and is not Mock;
- OAuth authorization is not required;
- all formal Gmail labels are present;
- the dedicated Calendar is configured for the existing target;
- Automation is consistent, disabled, undesired, and has zero owned clock
  triggers and no stored/canonical scheduled-trigger residue; and
- no external request or mutation was performed by readiness.

Do not hard-code READY and do not merely copy configuration booleans. Reuse
existing prerequisite, provider, label, Calendar, version, and trigger
abstractions where safe.

### 2. Bounded, privacy-safe output

The menu-callable readiness result must report bounded status and reasons for:

- candidate and stored version alignment;
- Setup completion;
- TEST_MODE / production-shaped state;
- exact synthetic qualification scope/query/body guard;
- operator, data, credential-storage, auth, and actual credential readiness;
- provider/model/adapter health without a Gemini request;
- OAuth readiness;
- formal Gmail-label readiness;
- dedicated Calendar configuration;
- Automation enabled/desired/consistency state;
- handler and clock-trigger counts and canonical/stored-trigger presence; and
- `external_request_performed=false`.

Do not return a credential value, property value containing a credential,
account identifier, Script ID, Calendar ID, Gmail ID, private URL, raw provider
message, or free-form external error.

Readiness may perform the minimum read-only service checks needed for these
facts. It must not fetch a Gmail message body, send a Gemini request, write a
Calendar event, create/delete a trigger, mutate Setup state, or change durable
business data.

### 3. Accessible preparation action

Add a clearly named menu item that invokes the existing no-argument
`preparePersonalAutomationQualification()` through a confirmation dialog.

The preparation action must retain its current guarantees:

- require Setup complete and compatible schema/migration;
- require Automation OFF and zero owned clock triggers;
- update only the minimum version/runtime metadata;
- preserve all Tasks, Reviews, Message State, Calendar state, labels, authority
  records, and the Gemini credential;
- never read or expose the credential value;
- remain idempotent; and
- leave Automation OFF.

After preparation, the user can rerun readiness. Preparation itself must not
return the final all-ready result unless every readiness prerequisite is then
actually satisfied.

### 4. Preserve the accepted safety boundary

Do not change or weaken:

- exact Work 0036 synthetic subject/body matching;
- production-shaped qualification-only discovery;
- ordinary Inbox, near-match, duplicate/ambiguous, stale/terminal, truncated,
  attachment, newsletter, Calendar-notification, Promotions, Social, spam,
  trash, non-Inbox, and `手動/除外` rejection;
- max one fresh candidate;
- Gemini `/v1beta/interactions`, `gemini-3.6-flash`, strict
  `thought* model_output`, strict application validation, one-call/no-fallback
  behavior, or bounded diagnostics;
- Task/Review authority, checkpoint, retry, Calendar outbox, lock/lease, and
  trigger lifecycle contracts;
- Automation OFF defaults; or
- the frozen 2.8.20 recovery packages and historical evidence.

## Required tests

Add or extend focused network-free tests proving at least:

1. Missing Setup completion returns BLOCKED, not READY.
2. Stored 2.8.20 code metadata against 2.8.21 source returns BLOCKED.
3. Missing/mismatched schema or migration returns BLOCKED.
4. TEST_MODE source cannot report production qualification READY.
5. Missing Calendar configuration returns BLOCKED.
6. Missing formal Gmail label returns BLOCKED.
7. Missing operator/data/credential-storage/auth approval returns BLOCKED.
8. Missing actual credential or unhealthy/non-Gemini/Mock adapter returns
   BLOCKED.
9. OAuth authorization required/unavailable returns BLOCKED.
10. Inconsistent, enabled, desired, stale stored-trigger, duplicate trigger, or
    nonzero clock-trigger state returns BLOCKED.
11. A complete synthetic fake prerequisite set returns READY.
12. Readiness performs no Gmail body fetch, Gemini request, Calendar write,
    trigger mutation, credential-value read, or business-data write.
13. Preparation menu wiring exists, confirmation is required, and preparation
    remains idempotent and Automation-OFF-only.
14. Actual `enableAutomation()` remains fail-closed and behaviorally aligned
    with the readiness decision.
15. Existing Work 0036 Gmail/provider/worker/trigger negative coverage remains
    green.

Update the deterministic expected-suite inventory and fingerprint if a new
suite is added. Silent deletion, renaming, or unexpected extra suites must
remain fail-closed.

## Documentation and report

After implementation and observed validation:

- update active source and release documentation to describe the truthful
  readiness/preparation sequence;
- change the active review HOLD to READY only after all acceptance checks pass;
- keep the exact suite count synchronized everywhere;
- preserve the original `docs/handoffs/0036-report.md` unchanged as the first
  Codex completion record; and
- write `docs/handoffs/0036-review-fix-report.md` with exact observed tests,
  hashes, commits, CI runs, placement attempts, and remaining limitations.

Update PR `#51` to link the original instruction/report and the review-fix
instruction/report.

## Release and existing-target repair tranche

Because the source repair changes the Phase 8C payload already placed by the
first Work 0036 run, one new replacement tranche is authorized after all local
checks and exact-head pre-placement CI pass.

This is not a retry of the prior successful placement. It is a new one-use
replacement for the new exact repaired payload.

Allowed exactly once each:

- one guarded Phase 8C source update to the same existing personal-synthetic
  target used by Work 0033 and the first Work 0036 placement; and
- one independent isolated pull-back parity check.

Required before the update:

- exact branch/ref and clean worktree;
- complete local gate and focused review-fix tests PASS;
- deterministic release regeneration/checksum/source parity PASS;
- historical 2.8.20 bytes unchanged;
- exact-head pre-placement CI SUCCESS;
- existing target binding established from the accepted untracked local
  configuration; and
- Automation still OFF with no function invocation.

Prohibited:

- a different target, account, auth profile, deployment, Cloud project, OAuth
  client, or credential;
- credential inspection, copying, rotation, or logging;
- Setup, preparation, readiness, enable, disable, worker, Gmail, Gemini,
  Calendar, Dashboard, diagnostics, or any Apps Script function invocation;
- trigger inspection or mutation beyond source-content placement boundaries;
- a second update/pull attempt, fallback, cleanup deletion, or runtime test; and
- merge to `main`.

If the exact target binding or one-use safety cannot be established, stop before
mutation and report a BLOCKER.

## Validation and completion checks

Run the exact current project commands and all affected focused suites. Final
evidence must include:

- exact focused PASS/FAIL counts;
- complete deterministic suite inventory count/fingerprint, missing 0, extra 0;
- full local gate PASS;
- Apps Script static/inventory PASS;
- 2.8.21 Phase 8B/8C deterministic build and verifier PASS;
- A21/B21/current repair lineage and historical 2.8.20 preservation PASS;
- secret/local-state scan 0 hits;
- `git diff --check` PASS;
- pre-placement exact-head CI SUCCESS;
- one repaired-payload update and one pull-back parity PASS;
- final report-head CI SUCCESS; and
- independent subagent final review with no BLOCKER.

## Stop and escalation conditions

Stop and report a BLOCKER rather than weakening the contract if:

- truthful readiness would require a Gmail body fetch, Gemini request, Calendar
  write, trigger mutation, credential exposure, or broad Inbox scope;
- readiness and enable semantics cannot be aligned without a material redesign;
- durable state would need destructive reset or credential re-entry;
- historical 2.8.20 bytes change;
- ordinary Inbox mail can reach the provider boundary;
- exact target binding cannot be safely proven; or
- any authorized external attempt fails or is consumed.

## Final return contract

Return only:

- Work ID
- Review-fix report path
- Final commit
- Branch
- PR
- BLOCKER status
