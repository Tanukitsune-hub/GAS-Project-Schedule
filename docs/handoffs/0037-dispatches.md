# Work 0037 Dispatch Ledger

WORK_ID: `0037`
Current Dispatch ID: `0037-CODEX-03`
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

- Purpose: operational log hardening and final Work 0037 convergence.
- Instruction: `docs/handoffs/0037-CODEX-03-operational-log-hardening-instruction.md`
- Target Code: `2.8.24-prepilot`
- Scope: correct automatic-pilot Run History mode, suppress fully healthy idle detail rows while preserving existing `AUTOMATION_LAST_RUN_AT` heartbeat, enforce 90-day retention only for detailed Run History, converge active docs, regenerate/verify release, and perform one OFF-state existing-target placement plus isolated pull-back parity.
- Explicit runtime boundary: no Automation enable/re-enable, no scheduled smoke, no Gmail/Gemini/Task/Review/Calendar execution.
- BALL: `CODEX`
- STATUS: `READY`

## Current ball

Codex owns only the bounded implementation, local executable validation, release regeneration, exact-head CI, and one authorized OFF-state existing-target placement/pull-back defined in Dispatch `0037-CODEX-03`.

ChatGPT retains Primary Outcome, scope, authorization, final review, PR merge decision, Work acceptance, and any later company-sandbox routing.

WORK_ID: `0037`
Current Dispatch ID: `0037-CODEX-03`
BALL: `CODEX`
STATUS: `READY`
