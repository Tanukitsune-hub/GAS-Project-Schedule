# Work 0037 Completion Report — Automatic Personal Inbox Shadow Pilot

WORK_ID: `0037`

This is the authoritative completion report for the revised automatic-Inbox scope. Earlier Code `2.8.22-prepilot` label-gated evidence and later Code `2.8.23-prepilot` live-pilot evidence remain historical and are not rewritten.

## Primary outcome status

The Automatic Personal Inbox Shadow Pilot itself has been user-executed and accepted as live evidence:

- an ordinary unlabeled, non-sensitive personal Inbox test message was automatically admitted;
- the intended Task record was produced;
- repeated scheduled runs were user-observed as `COMPLETE` with zero visible errors in bounded evidence;
- the user explicitly stopped Automation after the observation window;
- the user then confirmed the real Automation status was stopped/consistent with owned time-trigger cleanup complete.

The active Work remains open only for final operational-log convergence before PR merge and the Completion Latch.

## Accepted automatic-Inbox product boundary

The accepted pilot contract remains:

- Scope: `AUTOMATIC_PERSONAL_INBOX_SHADOW_PILOT`.
- Admission mode: `AUTOMATIC_INBOX`.
- Source mode: `AUTOMATIC_INBOX_PILOT`, distinct from historical `AUTOMATIC_PILOT`.
- Ordinary eligible personal Inbox mail does not require `手動/取込`.
- `手動/除外` is a Thread-wide veto.
- Spam, trash, non-Inbox, Promotions, Social, clear newsletter/list mail, and bounded Google Calendar invite/update/system-notification mail are excluded.
- `手動/取込` is optional priority only and cannot bypass a hard exclusion.
- Known Message IDs are not rediscovered.
- At most one Message is admitted per scheduled run on the five-minute cadence.
- The durable first-successful-enable boundary excludes pre-start messages.
- Information-only mail has no Task/Calendar business side effect; unclear mail follows governed Review.
- Strict AI Schema 2.0, one-call/no-retry/no-fallback Gemini, Task/Review authority, dedicated-Calendar ownership, privacy, and fail-closed Trigger lifecycle remain authoritative.

## Historical implementation / placement evidence

Code `2.8.23-prepilot` is frozen as the live-pilot candidate evidence. Its deterministic/release/placement evidence remains recorded in the historical Work 0037 commits and PR #52 discussion.

## Dispatch 0037-CODEX-03 — Operational-log hardening

Instruction: `docs/handoffs/0037-CODEX-03-operational-log-hardening-instruction.md`

Returned candidate: Code `2.8.24-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`.

Returned evidence:

- Product source commit: `1dbd28fd8e98e13849a29f3c4eeb6fa6c5663eb1`.
- Release commit: `a2deb099df5581436284cdab8e01ca4e87fb72d2`.
- Exact pre-placement head: `0ab1850e9bdec02251f08181b7b1bd75fde71374`.
- Returned report head: `c09cc3acd0ba3e73b16e15352b4db5830bf6eab0`.
- Exact pre-placement CI `#498`: SUCCESS.
- Returned report-head CI `#500`: SUCCESS.
- Complete gate: `11/11 PASS`.
- Deterministic inventory: `85` suites, missing `0`, extra `0`.
- Apps Script static validation: PASS.
- 2.8.24 Phase 8B/8C release verification, source parity, checksums, provenance, lineage, Work 0036 squash proof, frozen 2.8.20/2.8.21/2.8.22/2.8.23 preservation, secret/local-state scan, and diff check: PASS.
- Existing-target correction placement: one guarded Phase 8C push PASS, one isolated pull-back PASS, exact 23-file (`22 .gs` + manifest) parity PASS.
- Automation remained OFF; no Apps Script runtime function, Gmail, Gemini, Task, Review, Calendar, Trigger, credential, company, alternate-target, or merge action was executed.

The 2.8.24 implementation correctly fixed the live-observed audit-mode bug so meaningful `AUTO_PILOT` history serializes as `TIME_DRIVEN / AUTO_PILOT`, preserved historical `AUTO_PHASE6` and manual behavior, introduced a strict healthy-idle suppression predicate, kept `AUTOMATION_LAST_RUN_AT` as the existing heartbeat, and implemented Run-History-only 90-day retention semantics.

### ChatGPT review result for CODEX-03

ChatGPT independently reviewed source, tests, reports, CI, release, and placement evidence and found one remaining acceptance-contract defect:

- `appendRunSummary()` performs Run History duplicate/full-range work and invokes `pruneRunHistory()` before evaluating the healthy-idle suppression predicate. Therefore a five-minute fully healthy idle run still triggers Run History retention maintenance/full-history reads even though no row is eventually written.
- `appendRunSummarySafely()` ignores the suppression return and reports `log_recorded=true` whenever no exception occurs, so an intentionally suppressed detail row is reported as recorded.

This does not invalidate the accepted 2.8.23 live pilot or the 2.8.24 meaningful-run audit/retention semantics. It does prevent Work 0037 final completion because the explicit idle-fast-path acceptance condition was not met.

`0037-CODEX-03` is therefore `SUPERSEDED`, and Code `2.8.24-prepilot` is frozen as returned placement evidence.

## Dispatch 0037-CODEX-04 — Final idle-log convergence

Instruction: `docs/handoffs/0037-CODEX-04-idle-log-finalization-instruction.md`

Target candidate: Code `2.8.25-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`.

Required final correction is deliberately narrow:

1. detect and suppress a fully healthy/no-op `AUTO_PILOT` before any Run History full-data/duplicate/retention maintenance;
2. preserve meaningful-run 90-day retention and `TIME_DRIVEN / AUTO_PILOT` behavior;
3. make the worker result truthfully indicate that no detail row was recorded when suppression occurs;
4. keep `AUTOMATION_LAST_RUN_AT` heartbeat unchanged;
5. preserve all frozen Code 2.8.20/2.8.21/2.8.22/2.8.23/2.8.24 evidence byte-identically;
6. validate locally/CI/release/frozen/secret/diff, then perform exactly one newly authorized OFF-state Phase 8C 2.8.25 correction placement and one isolated pull-back parity check.

No Automation re-enable or live scheduled smoke is authorized. The accepted durable pilot-start boundary remains historical state, so local executable evidence plus OFF-state placement parity is the safer decisive validation.

## Current BLOCKER status

`BLOCKER: YES — IDLE_RUN_RETENTION_MAINTENANCE_ORDER`

This blocker is limited to the final operational-log acceptance contract. The Automatic Inbox live pilot itself remains accepted evidence.

Work 0037 remains Draft/Open/Unmerged until Dispatch `0037-CODEX-04` returns, ChatGPT reviews the exact final evidence, active docs/contract are converged, PR #52 is merged, and the Completion Latch is applied.

A company-environment sandbox remains a separate later Work 0038 after Work 0037 final acceptance and explicit authorization.
