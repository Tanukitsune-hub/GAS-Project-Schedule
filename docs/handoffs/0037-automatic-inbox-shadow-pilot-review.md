# Work 0037 ChatGPT Review — Automatic Personal Inbox Shadow Pilot

WORK_ID: `0037`

## Disposition

`PASS_AFTER_CHATGPT_RUNBOOK_REPAIR`

`BLOCKER: NONE`

The GitHub source of truth was reviewed independently from the Codex completion
message. The reviewed candidate is Code `2.8.23-prepilot` on
`codex/0037-personal-shadow-pilot`, Draft PR `#52`.

Codex final report head:

`725ccd4ee4073a159be3730d315b43b97fc32466`

ChatGPT added the missing authoritative user-controlled runtime runbook at:

`docs/handoffs/0037-automatic-inbox-shadow-pilot-runbook.md`

The historical label-gated 2.8.22 runbook remains unchanged and is not an
authority for the 2.8.23 automatic pilot.

## GitHub verification performed

The following were checked from GitHub rather than accepted from the Codex
summary:

- PR `#52` is Draft, Open, Unmerged, mergeable, and points to the reported
  branch and final Codex head.
- `docs/handoffs/0037-report.md` is the revised automatic-Inbox report.
- `CURRENT_CONTRACT.json` records Code `2.8.23-prepilot`, Schema `2.6`, AI
  Schema `2.0`, Migration `3`, gate
  `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`, and Automation OFF.
- The authored source uses scope `AUTOMATIC_PERSONAL_INBOX_SHADOW_PILOT`,
  admission `AUTOMATIC_INBOX`, and source mode `AUTOMATIC_INBOX_PILOT`.
- Ordinary eligible Inbox mail no longer requires `手動/取込`.
- `手動/除外` is enforced Thread-wide before candidate admission.
- Spam, trash, non-Inbox, Promotions, Social, clear newsletter/list, and
  bounded Google Calendar notification cases are rejected in code after
  metadata retrieval.
- `手動/取込` is optional priority only and does not bypass hard exclusions.
- Known Message IDs are suppressed, one Message per run is enforced, and the
  five-minute cadence is unchanged.
- The first successful enable establishes a durable start boundary; candidates
  older than that boundary are rejected.
- Historical 2.8.22 `AUTOMATIC_PILOT` records are not eligible as 2.8.23
  automatic backlog.
- The manual Gmail worker fails closed while automatic pilot Automation is
  active.
- Information-only processing reaches `DONE` without Task or Calendar business
  effects in executable local coverage; governed Review behavior and Task
  authority remain intact.
- Phase 8C core Gmail, Trigger, and Worker files match the reviewed authored
  source bytes; Config differs only through the audited production transform.
- The final report-head GitHub Actions run `#488` completed with SUCCESS.

Final CI `#488` independently reported:

- complete gate `11/11 PASS`;
- deterministic inventory `83 suites`, missing `0`, extra `0`;
- Apps Script inventory and static validation PASS;
- 2.8.23 Phase 8B/8C release verification PASS;
- current lineage and Work 0036 squash proof PASS;
- frozen 2.8.20/2.8.21/2.8.22 preservation PASS;
- secret/local-state scan `0` hits.

The exact pre-placement head
`7c28634a160522fc11640e0210d27ea16334d68b` also has successful GitHub CI
run `#486`.

The report records one guarded Phase 8C push and one isolated pull-back on the
same existing personal target, with 23-file exact inventory/hash parity and no
runtime function, Gmail processing, Gemini request, Task/Review/Calendar
business mutation, Trigger mutation, alternate target, company environment, or
PR merge.

## Initial finding repaired directly by ChatGPT

The implementation instruction required a new automatic-Inbox pilot runbook
while preserving the historical 2.8.22 label-gated runbook. The final branch
preserved the historical file but did not create the new operational runbook;
README still pointed to the historical label-gated instructions.

This was a user-operation blocker because the old runbook requires
`手動/取込` and treats ordinary unlabeled Inbox processing as a failure, which
is the opposite of the 2.8.23 contract.

ChatGPT resolved the blocker by creating:

`docs/handoffs/0037-automatic-inbox-shadow-pilot-runbook.md`

The new runbook is authoritative for the later user-controlled 2.8.23 pilot and
contains the privacy gate, pre-start witness, preparation/readiness sequence,
single-enable rule, 24-hour cohort, hard-exclusion witnesses, stop conditions,
success criteria, final disable/zero-trigger rollback, and the conditional
company-sandbox next boundary.

## Remaining classifications

### BLOCKER

None after the runbook repair.

### FIX SOON

These are documentation inconsistencies and do not change the placed product
bytes or prevent the controlled personal pilot:

1. `README.md`, `CURRENT_STATUS.md`, and `MASTER_PLAN.md` still say `82 suites`;
   final GitHub CI proves `83 suites`.
2. `MASTER_PLAN.md` still contains historical label-gated steps requiring
   `手動/取込` and says normal Inbox broadening is still future work.
3. `README.md` still links the historical label-gated runbook instead of the
   new automatic-Inbox runbook.
4. `CURRENT_STATUS.md`, `PROJECT_CONTEXT.md`, and `MASTER_PLAN.md` still say no
   company rollout is planned. The current decision is narrower: Work 0037 is
   personal-only, while a separate company-environment sandbox Work may start
   after this pilot passes and required company authorization is confirmed.
5. The enable rollback removes a newly created start marker on a best-effort
   basis if a later enable commit fails. The user runbook therefore requires an
   immediate stop and prohibits retry after any non-`ENABLED` result. Structural
   hardening can be considered before company rollout.

These items should be corrected in the final Work 0037 evidence/status update
before PR `#52` is merged. They do not justify another Codex run before the
personal pilot.

### BACKLOG

- A separate Work ID for company-environment sandbox qualification after the
  personal pilot passes and authorization is confirmed.
- Before company use, explicitly decide whether a new post-start reply may send
  bounded prior Thread context that predates the pilot start. The personal
  runbook uses fresh Threads to avoid this ambiguity during qualification.
- Broader attachment ingestion, provider fallback/retry, primary-Calendar
  ownership, and production-scale throughput remain outside Work 0037.

## Current runtime boundary

Automation remains OFF after Codex placement. The user-controlled pilot has not
started. No ordinary personal Inbox Message should be processed until the user
completes preparation/readiness and explicitly enables Automation under the new
runbook.

## Next authorized user sequence

1. Reload the bound Spreadsheet.
2. Create one non-sensitive pre-start witness in Inbox.
3. Run `個人用Shadow Pilotを準備`.
4. Run `個人用Shadow Pilotの準備状態を確認`.
5. Continue only on
   `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT` with Automation OFF and zero
   owned clock Triggers.
6. Enable exactly once and verify `ENABLED`, one canonical five-minute Trigger,
   and an established start boundary.
7. Run the bounded 24-hour automatic-Inbox cohort from the authoritative
   runbook.
8. Disable once, prove zero owned clock Triggers, and preserve bounded evidence
   for final review.

PR `#52` remains Draft/Open/Unmerged until the user-controlled pilot and final
rollback are reviewed.
