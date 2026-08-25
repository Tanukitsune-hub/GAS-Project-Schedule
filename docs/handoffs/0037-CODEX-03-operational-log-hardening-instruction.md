# Work 0037 — Operational Log Hardening Instruction

WORK_ID: `0037`
Dispatch ID: `0037-CODEX-03`
BALL: `CODEX`
STATUS: `READY`

## Work Mode

`BUILD`

This is a convergence change inside the existing Work 0037 outcome. Do not create a new Work ID.

## Primary Outcome

Finish the Personal Automatic Inbox Shadow Pilot candidate at operational quality by correcting the observed Run History audit-mode bug and preventing five-minute healthy idle runs from growing detailed history indefinitely, without changing Gmail admission, Gemini, Task/Review, Calendar, trigger cadence, privacy, or authority behavior.

Target candidate after this dispatch:

- Code: `2.8.24-prepilot`
- Schema: `2.6`
- AI Schema: `2.0`
- Migration: `3`

Code `2.8.23-prepilot` is frozen Work 0037 live-pilot evidence and must remain byte-identical in its authored historical/release evidence.

## Accepted Evidence / Closed Conclusions

Do not reopen these conclusions without new contradictory evidence:

1. User-controlled Code 2.8.23 Automatic Personal Inbox Shadow Pilot ran for more than the required observation window and was explicitly stopped by the user.
2. The user then ran the real Automation state surface and confirmed the stopped state is `CONSISTENT` with Automation disabled and owned time trigger cleanup complete. Do not request or execute another live status read in this dispatch.
3. User-observed live evidence confirms an ordinary unlabeled non-sensitive test Inbox message was automatically discovered and produced the intended Task record. Repeated scheduled runs were observed as `COMPLETE` with zero visible errors in the supplied bounded evidence.
4. The Automatic Inbox admission policy, durable pilot-start boundary, one-message-per-run limit, five-minute trigger cadence, Gemini strict schema path, Task/Review authority, Calendar ownership, and privacy boundaries are accepted for Work 0037 and are not in scope for redesign.
5. A real Run History defect was independently confirmed from source:
   - `processAutomaticBatch()` emits `mode: 'AUTO_PILOT'` for the 2.8.23 production pilot;
   - `appendRunSummary()` does not allow `AUTO_PILOT` and falls back to `GMAIL_PHASE2`;
   - `trigger_type` is currently `TIME_DRIVEN` only for `AUTO_PHASE6`, so the live automatic pilot is incorrectly recorded as `MANUAL / GMAIL_PHASE2`.
6. `AUTOMATION_LAST_RUN_AT` is already updated after each scheduled worker invocation and is sufficient as the lightweight Automation heartbeat. Do not add a new heartbeat sheet or parallel heartbeat property unless a concrete blocker proves it necessary.
7. Do not perform another live scheduled smoke after this change. The durable first-pilot start boundary remains historical state; re-enabling could admit mail received during the stopped interval. Local executable evidence plus OFF-state placement parity is the decisive and safer validation for this logging-only hardening.

## Acceptance Evidence — ranked

1. **Deterministic executable tests** proving exact Run History semantics below.
2. **Full repository validation / CI** with missing `0`, extra `0`, static validation, release verifiers, lineage, frozen-release preservation, secret scan, and diff check all PASS.
3. **One guarded Phase 8C Code 2.8.24 source placement** to the same existing personal target while Automation remains OFF, followed by exactly one isolated pull-back and exact inventory/hash parity.
4. Final ChatGPT review of diff, report, tests, CI, release provenance, and placement evidence.

No live Gmail/Gemini/Calendar/Automation execution is required or authorized for acceptance of this dispatch.

## Fastest Safe Decisive Action

Make the smallest logging-layer change that:

1. preserves the five-minute trigger cadence;
2. preserves `AUTOMATION_LAST_RUN_AT` heartbeat behavior;
3. logs meaningful automatic-pilot runs correctly;
4. suppresses only fully healthy/no-op automatic-pilot detail rows;
5. bounds Run History detail retention without touching business/error evidence;
6. leaves all product authority and external-action boundaries unchanged.

## Required Product Changes

### A. Correct the automatic-pilot audit mode

In the canonical Run History write path:

- add `AUTO_PILOT` to the explicit allowed run modes;
- record `trigger_type = 'TIME_DRIVEN'` for both `AUTO_PILOT` and historical/current `AUTO_PHASE6` scheduled modes;
- persist `mode = 'AUTO_PILOT'` without fallback;
- preserve existing manual mode behavior exactly.

Never silently map an unknown future mode to a successful known automatic mode. Existing fail-safe fallback behavior for unrelated unknown modes may remain only if tests prove it cannot falsely claim time-driven execution.

### B. Suppress only healthy idle AUTO_PILOT detail rows

A scheduled `AUTO_PILOT` run may skip the `処理履歴` row only when **all** of the following are true:

- `run_status === 'COMPLETE'`;
- `candidate_count === 0`;
- `processed_count === 0`;
- `backlog_processed_count === 0`;
- `inbox_processed_count === 0`;
- `created_task_count === 0`;
- `updated_task_count === 0`;
- `review_count === 0`;
- `calendar_job_count === 0`;
- `skipped_count === 0`;
- `error_count === 0`;
- no deferred operational error exists;
- provider retry suppression is not active;
- system retry is not deferred;
- scan cursor reset/error recovery did not occur;
- no other bounded warning/failure signal carried by the current summary would be lost by suppression.

`watermark_advanced` by itself is normal scan bookkeeping and must not force a detail row.

Excluded-message/filter counts by themselves do not require a detailed idle row. Hard-exclusion correctness is already accepted/tested in Work 0037; do not create a new aggregation subsystem just to retain zero-side-effect filter counts.

All non-COMPLETE, candidate-bearing, processed, skipped, Task/Review/Calendar-affecting, warning, retry, recovery, or error runs must continue to be written to detailed Run History.

The existing `AUTOMATION_LAST_RUN_AT` property remains the heartbeat for suppressed idle runs. Do not change its scheduled-worker update semantics.

### C. Bound detailed Run History to 90 days

Apply retention only to the `処理履歴` / Run History sheet.

- Keep detailed Run History records whose `finished_at` is within the most recent 90 days.
- Prune only records with a valid `finished_at` strictly older than the cutoff.
- Preserve rows with missing/invalid timestamps rather than guessing that they are safe to delete.
- Preserve header/schema rows exactly.
- Preserve chronological order of retained records.
- Do not create holes that cause new records to be inserted above newer retained history.
- Do not reduce or corrupt the sheet schema/protection contract.
- `エラー・再実行`, Message State, Task, Review, Calendar outbox/state, Task Authority Ledger, and other business/audit surfaces are **not** subject to this retention rule.
- Do not retroactively delete current Work 0037 live-pilot evidence merely because this code is placed. Retention must delete only data older than 90 days.

Prefer a bounded compaction/delete-and-capacity-preservation strategy that leaves the sheet ready for normal append. Avoid an unbounded full-sheet rewrite on every five-minute idle run; idle rows are suppressed and therefore must not trigger retention maintenance.

### D. Documentation convergence

Update active documentation only; do not rewrite historical evidence.

At minimum reconcile:

- `README.md`;
- `CURRENT_STATUS.md`;
- `MASTER_PLAN.md`;
- `PROJECT_CONTEXT.md` where materially stale;
- current Apps Script README / applicable Work 0037 operational guide;
- `CURRENT_CONTRACT.json` for Code 2.8.24 and exact release metadata.

Required documentation outcomes:

- final deterministic suite count matches actual executed inventory;
- remove stale active instructions that still require `手動/取込` for the automatic Inbox pilot;
- the authoritative automatic-Inbox runbook is the 2.8.23/2.8.24 Work 0037 runbook, while the label-gated runbook remains historical evidence only;
- company environment remains outside Work 0037, but a separate company-sandbox qualification Work may follow only after Work 0037 final acceptance and explicit authorization;
- document that healthy idle scheduled runs use the `AUTOMATION_LAST_RUN_AT` heartbeat and are not individually persisted to detailed Run History;
- document the 90-day detailed Run History retention boundary.

## Required Tests

Add or update focused deterministic tests covering at least:

1. `AUTO_PILOT` writes `trigger_type=TIME_DRIVEN` and `mode=AUTO_PILOT`.
2. `AUTO_PHASE6` remains `TIME_DRIVEN / AUTO_PHASE6`.
3. Manual modes remain `MANUAL` and preserve their exact mode.
4. A fully healthy/no-op `AUTO_PILOT` run does not append a Run History row.
5. The same idle shape still leaves scheduled heartbeat behavior independently intact at the trigger wrapper boundary; do not couple heartbeat success to detail-row append.
6. An `AUTO_PILOT` run with candidate, processing, skip, Task, Review, Calendar, warning, PAUSED/FAILED, provider suppression, system retry defer, cursor recovery, deferred error, or nonzero error evidence is not suppressed.
7. Retention removes only valid rows older than 90 days.
8. Exactly-90-day and newer rows are retained according to the chosen strict cutoff rule.
9. Invalid/missing timestamp rows are preserved.
10. Retention preserves headers, schema width, chronological order, and appendability.
11. Retention does not touch `エラー・再実行` or any business-state sheet.
12. Historical Code 2.8.20 / 2.8.21 / 2.8.22 / 2.8.23 frozen source/release evidence remains byte-identical.

Use repository-standard focused tests plus the complete deterministic inventory. Do not weaken existing tests to make the new behavior pass.

## Release / Placement

Generate new controlled release packages for Code `2.8.24-prepilot` using the repository's exact version-specific release conventions.

Before any live target write:

1. focused tests PASS;
2. complete deterministic inventory PASS, missing `0`, extra `0`;
3. complete local validation gate PASS;
4. Apps Script static validation PASS;
5. 2.8.24 Phase 8B/8C release verifiers PASS;
6. lineage and frozen 2.8.20/2.8.21/2.8.22/2.8.23 preservation PASS;
7. secret/local-state scan `0` hits;
8. `git diff --check` PASS;
9. exact pre-placement head pushed;
10. exact-head GitHub CI PASS.

Only then, perform exactly one placement tranche on the **same existing personal target**:

- one guarded Phase 8C Code 2.8.24 source push/update;
- one isolated pull-back;
- one exact inventory/hash/byte parity comparison.

Automation must remain OFF throughout.

No second push attempt is authorized after an actual target write begins without a new ChatGPT dispatch/addendum.

## Explicitly Prohibited

Do not:

- enable or re-enable Automation;
- create/delete/repair time triggers through runtime functions;
- run the scheduled worker or manual worker;
- process Gmail;
- call Gemini;
- mutate Task/Review/Calendar business state;
- run Setup/readiness/Dashboard/diagnostic Apps Script functions;
- retry Dead Letters;
- inspect credential values;
- clean up or delete existing live Run History rows via runtime execution;
- access an alternate personal target;
- access any company account, company PC, company Gmail, company Calendar, company Workspace, or company data;
- merge PR `#52`.

## Non-Goals

- Changing Gmail admission or hard-exclusion rules.
- Changing the five-minute trigger cadence.
- Raising the one-message-per-run limit.
- Adding daily/monthly aggregation sheets.
- Adding a second heartbeat subsystem.
- Reworking Task/Review/Calendar semantics.
- Attachment ingestion.
- Provider retry/fallback redesign.
- Company-environment qualification.

## Strategy Reset Conditions

Stop and return to ChatGPT without broadening scope if any of the following occurs:

- the logging fix requires schema migration or business-state mutation;
- retention cannot be made bounded without touching non-Run-History evidence;
- a required frozen release would need modification;
- placement preflight detects Automation enabled or owned clock-trigger residue;
- exact-head CI fails for a product/source reason after two materially different local repair attempts;
- the same placement failure would require a second target write attempt;
- any company or alternate target is required.

## Completion Latch

This dispatch is complete when:

- Code 2.8.24 implements the exact logging/retention contract;
- focused/full/local/CI/release/frozen/secret/diff gates all pass;
- the same existing personal target contains the exact Phase 8C 2.8.24 payload while Automation remains OFF;
- one isolated pull-back proves exact parity;
- `docs/handoffs/0037-CODEX-03-operational-log-hardening-report.md` records bounded evidence;
- `docs/handoffs/0037-report.md` is updated as the overall Work 0037 report without erasing historical 2.8.22/2.8.23 evidence;
- PR `#52` remains Draft/Open/Unmerged for ChatGPT final review;
- no BLOCKER remains.

Return only:

- Work ID
- Dispatch ID
- BALL
- STATUS
- report path
- final commit
- branch
- PR
- BLOCKER status

WORK_ID: `0037`
Dispatch ID: `0037-CODEX-03`
BALL: `CODEX`
STATUS: `READY`
