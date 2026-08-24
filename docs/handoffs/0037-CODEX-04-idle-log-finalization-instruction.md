# Work 0037 — Idle-Log Finalization Instruction

WORK_ID: `0037`
Dispatch ID: `0037-CODEX-04`
BALL: `CODEX`
STATUS: `READY`

## Work Mode

`BUILD`

This is the final convergence micro-fix inside Work 0037. Do not create a new Work ID.

## Primary Outcome

Finish the Automatic Personal Inbox Shadow Pilot candidate at operational quality by removing the remaining five-minute idle-run Run History scan/retention work and making the `log_recorded` result truthful when a healthy idle detail row is intentionally suppressed, without changing Gmail admission, Gemini, Task/Review, Calendar, trigger cadence, privacy, authority, or the already accepted live-pilot behavior.

Target candidate after this dispatch:

- Code: `2.8.25-prepilot`
- Schema: `2.6`
- AI Schema: `2.0`
- Migration: `3`

Code `2.8.24-prepilot` is now frozen as the first operational-log-hardening placement evidence. Preserve all 2.8.20/2.8.21/2.8.22/2.8.23/2.8.24 historical source/release evidence byte-identically.

## Accepted Evidence / Closed Conclusions

Do not reopen these conclusions without contradictory evidence:

1. The user-controlled Code 2.8.23 Automatic Personal Inbox Shadow Pilot ran beyond the required observation window, admitted an ordinary unlabeled non-sensitive test Inbox message, produced the intended Task, showed repeated COMPLETE scheduled runs with zero visible errors in bounded evidence, and was explicitly stopped.
2. The user then confirmed the real Automation state is stopped/consistent with owned time-trigger cleanup complete. Do not request or execute another live status read.
3. Automatic Inbox admission, hard exclusions, durable first-start boundary, one-message-per-run, five-minute cadence, Gemini strict schema, Task/Review authority, Calendar ownership, and privacy boundaries are accepted for Work 0037.
4. Dispatch `0037-CODEX-03` correctly implemented and validated:
   - `AUTO_PILOT` -> `TIME_DRIVEN / AUTO_PILOT`;
   - historical `AUTO_PHASE6` and manual mappings preserved;
   - healthy complete no-op AUTO_PILOT detail rows suppressed;
   - 90-day retention limited to Run History;
   - `AUTOMATION_LAST_RUN_AT` heartbeat unchanged;
   - complete gate 11/11, deterministic inventory 85 suites missing 0 / extra 0, static/release/lineage/frozen/secret/diff gates PASS;
   - one OFF-state Phase 8C 2.8.24 placement and one isolated pull-back passed exact 23-file parity.
5. ChatGPT independently confirmed final report-head CI #500 SUCCESS and pre-placement CI #498 SUCCESS.
6. ChatGPT source review found one acceptance-contract defect in Dispatch 0037-CODEX-03: `appendRunSummary()` calls `pruneRunHistory(...)` before `isHealthyIdleAutomaticPilot(...)`. Therefore a healthy five-minute idle run still invokes Run History retention maintenance and reads the whole Run History data range even though it ultimately suppresses the detail row. This violates the explicit 0037-CODEX-03 instruction: idle rows are suppressed and must not trigger retention maintenance.
7. ChatGPT also confirmed `appendRunSummarySafely()` ignores the return value from `appendRunSummary()` and returns `true` whenever no exception occurs. A deliberately suppressed idle run therefore reports `log_recorded=true` despite no Run History row being recorded.
8. Another live scheduled smoke remains prohibited. Re-enabling would reuse the durable original pilot-start boundary and could admit messages received during the stopped interval. Local executable evidence plus OFF-state placement parity is the decisive validation.

## Acceptance Evidence — ranked

1. Deterministic executable tests proving the exact idle fast-path and truthful `log_recorded` behavior.
2. Full local validation and exact-head GitHub CI with missing 0 / extra 0, static validation, release verification, lineage, frozen-release preservation, secret scan, and diff check PASS.
3. Exactly one guarded Phase 8C Code 2.8.25 source placement to the same existing personal target while Automation remains OFF, followed by one isolated pull-back and exact inventory/hash parity.
4. Final ChatGPT review and merge decision.

No live Gmail/Gemini/Calendar/Automation execution is required or authorized.

## Fastest Safe Decisive Action

Make the smallest possible logging-path correction:

1. identify a fully healthy/no-op `AUTO_PILOT` summary before any Run History retention scan, duplicate-ID full-column scan, compaction, or append work;
2. return the intentional suppression result without Run History maintenance;
3. keep `AUTOMATION_LAST_RUN_AT` heartbeat behavior unchanged in the scheduled Trigger wrapper;
4. report `log_recorded=false` (or an equally explicit truthful non-recorded result already compatible with existing contracts) when suppression intentionally writes no detail row;
5. keep all meaningful/non-idle Run History semantics and 90-day retention unchanged.

## Required Product Changes

### A. Idle fast path must precede Run History maintenance

For a fully healthy/no-op `AUTO_PILOT` run matching the already accepted 2.8.24 suppression predicate:

- do not run `pruneRunHistory()`;
- do not scan existing Run History run IDs for duplicate detection;
- do not compact or rewrite Run History;
- do not append a Run History row;
- do not add a new heartbeat or aggregation subsystem.

The predicate itself must remain at least as strict as 2.8.24. Do not suppress candidate-bearing, processed, skipped, Task/Review/Calendar-affecting, PAUSED/FAILED, provider-suppressed, retry-deferred, cursor-recovery, warning, deferred-error, or other meaningful runs.

A small fixed header/schema validation read is not required for a run that will not write Run History. Prefer no Run History Sheet I/O at all for the healthy idle fast path if this can be done without weakening safety.

### B. Retention remains meaningful-run maintenance

For a run that is not suppressed:

- preserve the 2.8.24 90-day Run History retention contract exactly;
- prune only valid `finished_at` records strictly older than 90 days;
- retain cutoff/newer/missing/invalid timestamps;
- preserve chronological order, fixed headers/schema, and appendability;
- do not touch Error/Dead Letter, Message State, Task/Review, Calendar, Task Authority Ledger, or any other business/audit state.

It is acceptable for old Run History detail to be pruned on the next meaningful Run History write rather than during every idle heartbeat. The objective is bounded history growth without periodic full-history work on empty five-minute cycles.

### C. Truthful `log_recorded`

When a healthy idle AUTO_PILOT detail row is intentionally suppressed:

- the worker/result surface must not claim that a Run History detail row was recorded;
- preserve existing `true` semantics for successful meaningful Run History persistence and `false` semantics for a write failure;
- do not change `AUTOMATION_LAST_RUN_AT`: heartbeat success is independent from detail-row persistence.

A minimal implementation may propagate the existing `appendRunSummary()` return value through `appendRunSummarySafely()` if that is compatible with all current call sites and tests.

### D. Version / documentation convergence

Advance active candidate metadata/docs/release to Code `2.8.25-prepilot`. Preserve historical 2.8.24 artifacts byte-identically.

Update only materially affected active documentation and the Work 0037 reports/dispatch ledger. Final active docs must not claim that the user-controlled Work 0037 pilot was never executed; historical sections may remain explicitly historical.

Company environment remains out of Work 0037. A separate Work 0038 company-sandbox qualification may follow only after Work 0037 final acceptance and explicit authorization.

## Required Tests

Add or adjust deterministic tests proving at least:

1. healthy/no-op AUTO_PILOT suppression performs zero Run History data-range scan/duplicate-ID scan/retention compaction/append work;
2. the same idle run returns a truthful non-recorded detail result (`log_recorded=false` or equivalent);
3. `AUTOMATION_LAST_RUN_AT` remains updated by the scheduled Trigger wrapper independently of detail-row suppression;
4. a meaningful AUTO_PILOT run still performs retention and records `TIME_DRIVEN / AUTO_PILOT`;
5. all 2.8.24 meaningful-run warning/error/PAUSED/FAILED preservation cases remain covered;
6. 90-day retention boundaries/order/schema/appendability remain unchanged;
7. manual and AUTO_PHASE6 behavior remains unchanged;
8. frozen Code 2.8.20/2.8.21/2.8.22/2.8.23/2.8.24 evidence is byte-identical.

Use repository-standard focused tests plus complete deterministic inventory. Do not weaken tests.

## Release / Placement

Generate Code `2.8.25-prepilot` Phase 8B and Phase 8C packages using existing exact conventions.

Before any target write require:

1. focused tests PASS;
2. complete deterministic inventory PASS, missing `0`, extra `0`;
3. complete local validation gate PASS;
4. Apps Script static validation PASS;
5. 2.8.25 Phase 8B/8C verifiers PASS;
6. lineage and frozen 2.8.20/2.8.21/2.8.22/2.8.23/2.8.24 preservation PASS;
7. secret/local-state scan `0` hits;
8. `git diff --check` PASS;
9. exact pre-placement head pushed;
10. exact-head GitHub CI PASS.

Only then perform exactly one new authorized correction placement tranche on the same existing personal target:

- one guarded Phase 8C Code 2.8.25 source push/update;
- one isolated pull-back;
- one exact inventory/hash/byte parity comparison.

This new Dispatch is the explicit authorization required for one correction write after the prior 2.8.24 placement. Automation must remain OFF throughout. No second 2.8.25 target write attempt is authorized after an actual write begins without a new ChatGPT decision.

## Explicitly Prohibited

Do not:

- enable/re-enable Automation;
- create/delete/repair time triggers through runtime functions;
- run scheduled/manual workers or a live smoke;
- process Gmail;
- call Gemini;
- mutate Task/Review/Calendar business state;
- run Setup/readiness/Dashboard/diagnostic Apps Script functions;
- retry Dead Letters;
- inspect credential values;
- execute retention against live Run History;
- access alternate personal targets;
- access any company account/PC/Gmail/Calendar/Workspace/data;
- merge PR #52.

## Non-Goals

- Gmail admission changes.
- Five-minute cadence changes.
- One-message-per-run changes.
- Aggregation subsystem.
- New heartbeat subsystem.
- Task/Review/Calendar changes.
- Attachment ingestion.
- Provider retry/fallback redesign.
- Company qualification.

## Strategy Reset Conditions

Stop and return to ChatGPT if:

- the fix requires schema migration/business-state mutation;
- the healthy idle path cannot avoid full Run History scan without redesigning accepted behavior;
- any frozen release must be modified;
- placement preflight detects Automation enabled or owned clock-trigger residue;
- exact-head CI fails for a product/source reason after two materially different repair attempts;
- placement would require a second 2.8.25 target write attempt;
- any company/alternate target is needed.

## Completion Latch

Dispatch `0037-CODEX-04` is complete only when:

- Code 2.8.25 implements the exact idle fast-path and truthful detail-record status;
- focused/full/local/CI/release/frozen/secret/diff gates all PASS;
- the same personal target contains exact Phase 8C 2.8.25 while Automation remains OFF;
- one isolated pull-back proves exact parity;
- `docs/handoffs/0037-CODEX-04-idle-log-finalization-report.md` records bounded evidence;
- `docs/handoffs/0037-report.md` is updated without erasing historical evidence;
- PR #52 remains Draft/Open/Unmerged for ChatGPT final review;
- no BLOCKER remains.

Return only:

- Work ID
- Dispatch ID
- BALL
- STATUS
- Report path
- Final commit
- Branch
- PR
- BLOCKER status

WORK_ID: `0037`
Dispatch ID: `0037-CODEX-04`
BALL: `CODEX`
STATUS: `READY`
