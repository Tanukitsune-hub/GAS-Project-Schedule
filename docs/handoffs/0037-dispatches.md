# Work 0037 Dispatch Ledger

WORK_ID: `0037`
Current Dispatch ID: `0037-CODEX-04`
BALL: `NONE`
STATUS: `ACCEPTED`

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
- ChatGPT final review found an acceptance-contract defect: the healthy-idle path invoked `pruneRunHistory()` and full Run History duplicate-ID/retention reads before deciding to suppress the row, contrary to the instruction that idle runs must not trigger retention maintenance. The suppression return value was also discarded by `appendRunSummarySafely()`, so a suppressed detail reported `log_recorded=true`.
- Code `2.8.24-prepilot` is frozen as returned placement evidence; do not rewrite it.
- BALL: `NONE`
- STATUS: `SUPERSEDED`

### 0037-CODEX-04

- Purpose: final idle-log fast-path and truthful detail-record status, with no change to accepted Automatic Inbox behavior.
- Instruction: `docs/handoffs/0037-CODEX-04-idle-log-finalization-instruction.md`
- Report: `docs/handoffs/0037-CODEX-04-idle-log-finalization-report.md`
- Target and returned Code: `2.8.25-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`.
- Exact pre-placement HEAD: `53a9ea6fe6dad2fa963db8e94be637ace22ab876`.
- Final Codex report head: `e8273eec584f5bf0239c70f8a86ad5aa7067b93c`.
- Complete local/final CI gate: `11/11 PASS`; deterministic inventory `86` suites, missing `0`, extra `0`; Apps Script static validation, 2.8.25 Phase 8B/8C release verification, lineage, frozen 2.8.20-2.8.24 preservation, secret/local-state scan, and diff check all PASS.
- Exact pre-placement CI `#516`: SUCCESS; final report-head CI `#518`: SUCCESS.
- Source review confirms fully healthy/no-op `AUTO_PILOT` suppression occurs before any Run History sheet lookup/full-data read/duplicate-ID scan/retention/compaction/append work.
- Source review confirms intentional suppression propagates as `log_recorded=false` while meaningful runs preserve `TIME_DRIVEN / AUTO_PILOT`, 90-day Run History retention, and existing heartbeat semantics.
- Existing-target correction: one guarded OFF-state Phase 8C push PASS; one isolated pull-back PASS; exact `22 .gs + appsscript.json` inventory, missing `0`, extra `0`, and byte/hash parity PASS.
- Automation remained OFF; no Apps Script runtime function, scheduled/manual worker, Gmail, Gemini, Task, Review, Calendar, credential, alternate-target, company-environment, or retry action was executed.
- ChatGPT final review: PASS; BLOCKER NONE; Completion Latch may be applied after final docs-only CI and PR integration.
- BALL: `NONE`
- STATUS: `ACCEPTED`

## Current ball

No Codex dispatch remains active. Work 0037 implementation, live personal Automatic Inbox pilot evidence, final logging convergence, release validation, and OFF-state placement verification are accepted.

PR `#52` is ready for final integration by ChatGPT. After integration, the next work boundary is a separate Work `0038` for company-environment sandbox qualification, only with explicit authorization and beginning with policy/environment readiness rather than ordinary company Inbox processing.

WORK_ID: `0037`
Current Dispatch ID: `0037-CODEX-04`
BALL: `NONE`
STATUS: `ACCEPTED`
