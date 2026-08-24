# Work 0037 Dispatch Ledger

WORK_ID: `0037`
Current Dispatch ID: `0037-CODEX-04`
BALL: `CODEX`
STATUS: `READY`

This file is the authoritative ball-control ledger for Work 0037.

## Dispatch history

### 0037-CODEX-01

- Purpose: initial Personal Shadow Pilot implementation using explicit `手動/取込` label gating.
- Outcome: returned and reviewed; Code `2.8.22-prepilot` label-gated pilot candidate completed.
- Later disposition: superseded as the active pilot design when the user requested fully automatic ordinary-Inbox admission.
- BALL: `NONE`
- STATUS: `SUPERSEDED`

### 0037-CODEX-02

- Purpose: revise Work 0037 to Code `2.8.23-prepilot` Automatic Personal Inbox Shadow Pilot, including durable start boundary, ordinary-Inbox admission, hard exclusions, release regeneration, and one guarded existing-target placement/pull-back.
- Primary instruction: `docs/handoffs/0037-automatic-inbox-shadow-pilot-instruction.md`
- Mandatory addendum: `docs/handoffs/0037-automatic-inbox-shadow-pilot-addendum.md`
- Report: `docs/handoffs/0037-report.md`
- Outcome: returned; ChatGPT reviewed; user-controlled personal automatic-Inbox pilot executed and later explicitly stopped.
- Accepted live evidence: ordinary unlabeled test mail was automatically admitted and produced the intended Task; repeated scheduled runs were observed as COMPLETE with zero visible errors; final user stop and follow-up Automation status confirmed disabled/zero owned time-trigger state.
- Remaining issue discovered from live evidence: `AUTO_PILOT` Run History rows were falsely serialized as `MANUAL / GMAIL_PHASE2`; five-minute healthy idle rows accumulated indefinitely.
- BALL: `NONE`
- STATUS: `ACCEPTED`

### 0037-CODEX-03

- Purpose: operational log hardening and Work 0037 convergence.
- Instruction: `docs/handoffs/0037-CODEX-03-operational-log-hardening-instruction.md`
- Report: `docs/handoffs/0037-CODEX-03-operational-log-hardening-report.md`
- Target Code: `2.8.24-prepilot`.
- Returned evidence: exact pre-placement CI and final report-head CI passed; local gate 11/11, 85 suites missing 0 / extra 0, static/release/lineage/frozen/secret/diff gates passed; one OFF-state Phase 8C placement and one isolated pull-back passed exact 23-file parity.
- Accepted implementation portions: `AUTO_PILOT` audit mode correction, strict healthy-idle detail suppression predicate, existing heartbeat preservation, 90-day Run History-only retention semantics, frozen 2.8.20-2.8.23 preservation.
- ChatGPT final review found an acceptance-contract defect: the healthy-idle path invokes `pruneRunHistory()` and full Run History duplicate-ID/retention reads before deciding to suppress the row, contrary to the instruction that idle runs must not trigger retention maintenance. The suppression return value is also discarded by `appendRunSummarySafely()`, so a suppressed detail reports `log_recorded=true`.
- Code `2.8.24-prepilot` is frozen as returned placement evidence; do not rewrite it.
- BALL: `NONE`
- STATUS: `SUPERSEDED`

### 0037-CODEX-04

- Purpose: final idle-log fast-path and truthful detail-record status, with no change to accepted Automatic Inbox behavior.
- Instruction: `docs/handoffs/0037-CODEX-04-idle-log-finalization-instruction.md`
- Target Code: `2.8.25-prepilot`.
- Scope: move fully healthy/no-op AUTO_PILOT suppression ahead of all Run History full-data/duplicate/retention work; make the result surface truthfully report that no detail row was recorded; preserve meaningful-run retention/audit behavior and heartbeat; converge final active docs/release; perform one newly authorized OFF-state correction placement plus isolated pull-back parity.
- Explicit runtime boundary: no Automation enable/re-enable, no scheduled smoke, no live Run History retention execution, no Gmail/Gemini/Task/Review/Calendar runtime action, no company or alternate target.
- BALL: `CODEX`
- STATUS: `READY`

## Current ball

Codex owns only the bounded implementation, executable validation, release regeneration, exact-head CI, and one newly authorized OFF-state correction placement/pull-back defined in Dispatch `0037-CODEX-04`.

ChatGPT retains Primary Outcome, scope, authorization, final review, PR merge decision, Completion Latch, and any later company-sandbox routing.

WORK_ID: `0037`
Current Dispatch ID: `0037-CODEX-04`
BALL: `CODEX`
STATUS: `READY`
