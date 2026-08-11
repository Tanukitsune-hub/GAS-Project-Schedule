# Project Context

Last updated: 2026-08-11

Project ID: `google-workspace-personal-work-os`

Repository of record: `Tanukitsune-hub/GAS-Project-Schedule`

Current candidate: Code `2.8.14-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Source-contract gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

Runtime-evidence status: `READY_FOR_CONTROLLED_PRODUCTION_AI_PROVIDER_INTEGRATION`

## Purpose

The system turns selected Gmail messages into governed Tasks in Google Sheets, supports human Review, projects important deadlines to a dedicated Calendar, and records bounded operational/recovery state. Apps Script coordinates the workflow. Google Sheets remains the Task system of record; Calendar is an auxiliary projection.

## Current source contract

- Canonical source: `implementation/GoogleSpreadsheet/apps-script-v2/`
- Apps Script runtime: V8/browser-compatible source only.
- Task schema: 50 columns with canonical internal-ID and Japanese-label rows.
- Task authority: hidden, protected, 21-column durable ledger.
- AI schema: provider-neutral `2.0`; production registry/transport intentionally not ready for use.
- Migration: bounded v2-only Migration `3`; no v1 migration or silent repair.
- Automation: OFF.
- Machine-bound source/release identity remains defined by `CURRENT_CONTRACT.json`; Work 0027 does not alter it.

## Current real-runtime assurance

On the existing personal-synthetic target, controlled Works 0019-0026 proved the following native Google boundaries with synthetic-only data:

- Gmail Advanced Service preprocessing through the repaired body decoder.
- Task creation and authority persistence.
- Human Review creation and acceptance through the canonical installable edit Trigger.
- Ordinary manual Task editing through the same authority path.
- Dedicated secondary Calendar CREATE, UPDATE-in-place, and DELETE on completion.
- Post-Setup Quick Diagnostic with zero FAIL and Task Authority Ledger validator PASS.

This evidence upgrades the runtime understanding materially beyond the source contract's original non-Google assurance. It does not change the deterministic release identity or authorize production/company use.

## Known runtime observations

- The Mock vertical summary can under-count `review_count` for a newly inserted Review Task in one lock-free path. The Review Task and acceptance behavior themselves were proven; this remains a non-blocking observability fix.
- `VERSION_PROPERTIES` WARN correctly detects that Setup-stored version metadata predates the current candidate placed on the target. It should be refreshed during a controlled future target update rather than suppressed.
- `RETRY_DEAD_LETTER_STATE` WARN correctly reflects retained historical synthetic failure rows from controlled Gmail-decode negative tests.
- Production-AI configuration, policy approval, and auth readiness warnings remain expected because no real Provider boundary has been accepted.

## Safety and privacy boundary

- No credential, token, private URL, account identifier, message body, personal data, raw provider error, real Workspace identifier, or machine path belongs in repository evidence.
- Runtime reports store only bounded/redacted facts and synthetic labels.
- External production AI remains unavailable and must fail closed until explicitly implemented, configured, approved, and tested.
- Automation remains OFF.
- Calendar is never the Task system of record and may mutate only the dedicated managed Calendar under explicit bounded execution.

## Current release model

The current deterministic release still has two packages generated from exact A14 source:

1. `v2.8.14-prepilot`: `TEST_MODE=true`, Automation OFF, harness included.
2. `v2.8.14-prepilot-phase8c`: only `TEST_MODE=false` changes and the harness is excluded.

Their package identity and source binding are unchanged by runtime evidence. Work 0027 intentionally avoids unnecessary regeneration/version churn because no source file changes are required.

## Next product boundary

Implement/configure one approved production-AI Provider boundary and exercise a grouped synthetic Gmail -> real AI -> Task/Review -> optional Calendar end-to-end flow while Automation remains OFF. Only after that passes should the project consider a bounded automatic-processing pilot.
