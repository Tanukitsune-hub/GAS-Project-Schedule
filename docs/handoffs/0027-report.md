# Work 0027 Report — Integrated Runtime Re-audit and Pilot Hardening

## Result

- Status: `READY_FOR_CONTROLLED_PRODUCTION_AI_PROVIDER_INTEGRATION`
- BLOCKER: `NONE`
- Route: `A — ChatGPT-only`
- Candidate: Code `2.8.14-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- Source/release files changed: `NO`
- `CURRENT_CONTRACT.json` changed: `NO`
- Automation: `OFF`
- Production/external AI: not configured/accepted

## Outcome

Work 0027 replaced the slow per-click/per-commit validation pattern with one integrated re-audit of the already proven synthetic runtime chain.

The re-audit concluded that no source-code modification is required before the production-AI Provider boundary. The current candidate has already proven the primary non-AI Google runtime workflow far enough to proceed without repeating unchanged Gmail/Task/Review/Calendar behavior.

## Evidence reviewed

GitHub source-of-truth and current runtime evidence were reconciled through the Work 0026 report head.

Accepted controlled runtime evidence now includes:

- bound-Sheet/native menu and Setup execution;
- post-Setup Quick Diagnostic with zero FAIL and Task Authority Ledger validator PASS;
- real Advanced Gmail preprocessing through the repaired decoder;
- deterministic Mock Task creation;
- Review creation and human `受入` through the canonical installable edit Trigger;
- ordinary manual Task edit persistence through the authority path;
- dedicated Calendar CREATE;
- Calendar UPDATE in place after due-date change, without duplicate;
- Calendar DELETE after Task completion.

The Work 0026 report head `a825a992923351a650ea5bbacc0097c16c8d74fd` has CI success (`31476867911`).

## Hardening decisions

### 1. Mock `review_count` under-counting

The observed `review_count=0` for a newly inserted Review Task is an observability defect in one lock-free Mock vertical summary path. The actual Review row and its subsequent human acceptance were proven in real runtime.

Classification: `FIX SOON`, non-blocking.

Decision: do not create standalone source/version/release churn solely for this counter. Bundle the fix and focused regression test into the next coherent source-change Work.

### 2. `VERSION_PROPERTIES` WARN

This warning is truthful. Setup-stored version metadata predates the current placed `2.8.14-prepilot` candidate.

Classification: non-blocking for production-AI integration, but must be reconciled during the next controlled target update.

Decision: do not weaken the diagnostic. Refresh version metadata as part of the next controlled deployment/setup-compatible step.

### 3. `RETRY_DEAD_LETTER_STATE` WARN

This warning is truthful because the synthetic target intentionally retains historical failed Gmail-decode rows from controlled negative tests.

Classification: non-blocking historical synthetic state.

Decision: do not suppress the warning or delete retained failure evidence merely to make diagnostics green. Cleanup/retention requires a separate explicit decision.

### 4. Remaining diagnostic warnings

Production-AI configuration/auth/policy warnings remain expected blockers to real-AI use. Dashboard layout/ownership warning and explicit Deep Diagnostic are deferred grouped checks and do not block production-AI implementation.

## Files updated

- `CURRENT_STATUS.md`
- `PROJECT_CONTEXT.md`
- `MASTER_PLAN.md`
- `DECISIONS.md`
- `docs/handoffs/0027-report.md`

No Apps Script source, manifest, generated release package, schema, migration file, or machine-bound current contract was changed.

## Why Codex was not used

The material work was repository inspection, evidence reconciliation, classification of known observations, and canonical documentation updates. No local/runtime-only implementation or executable debugging remained after the audit decision to avoid unnecessary source churn. Route A was therefore sufficient and faster.

## Validation

- GitHub authoritative Work 0026 head inspected.
- Root and nested repository rules inspected.
- Canonical `CURRENT_STATUS.md`, `DECISIONS.md`, `PROJECT_CONTEXT.md`, `MASTER_PLAN.md`, and `CURRENT_CONTRACT.json` inspected.
- `18_Worker.gs` review-count summary behavior inspected.
- `16_Diagnostics.gs` `VERSION_PROPERTIES` and `RETRY_DEAD_LETTER_STATE` predicates inspected.
- `10_CalendarSync.gs` terminal/managed-event policy rechecked.
- Work 0026 report-head CI: SUCCESS.
- Work 0027 final-head CI: required after this documentation commit.

## Remaining blockers before automated pilot

- approved production-AI Provider transport;
- opaque credential reference/storage boundary;
- production-AI policy/authorization readiness;
- synthetic real-AI end-to-end proof;
- automatic/scheduled runtime pilot acceptance.

## Next Work

Use one grouped source-change Work to implement/configure the production-AI Provider boundary, include the deferred Mock `review_count` observability fix, run local/CI checks once, update the synthetic target once, refresh version metadata, and execute a small grouped synthetic real-AI end-to-end trial while Automation remains OFF.

Do not re-run the full Calendar CREATE/UPDATE/DELETE lifecycle unless the source change materially affects Calendar logic.
