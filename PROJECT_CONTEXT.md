# Project Context

Last updated: 2026-08-11

Project ID: `google-workspace-personal-work-os`

Repository of record: `Tanukitsune-hub/GAS-Project-Schedule`

Current candidate: Code `2.8.15-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Highest gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

## Purpose

The system turns selected Gmail messages into governed Tasks in Google Sheets,
supports human Review, projects important deadlines to a dedicated Calendar,
and records bounded operational/recovery state. Apps Script coordinates the
workflow. Google Sheets remains the Task system of record; Calendar is an
auxiliary view.

## Current source contract

- Canonical source: `implementation/GoogleSpreadsheet/apps-script-v2/`
- Apps Script runtime: V8/browser-compatible source only.
- Task schema: 50 columns with canonical internal-ID and Japanese-label rows.
- Task authority: hidden, protected, 21-column durable ledger.
- AI schema: provider-neutral `2.0`; production registry recognizes `GEMINI`
  but external execution remains disabled by default.
- Migration: bounded v2-only Migration `3`; no v1 migration or silent repair.
- Automation: OFF.

## Current assurance

The local gate executes the real integrated `.gs` source in Node VM fakes and
covers authority recovery, Review/CAS, Gmail ordering/idempotency, Calendar
intent/recovery, Dashboard ownership/write visibility, diagnostic bounded
summaries, release parity, contract consistency, and secret/local-state
exclusion.

That evidence is non-Google only. It does not establish native Sheets,
Protection, Data Validation, note, trigger, LockService, quota, OAuth, Gmail,
Calendar, deployment, or real Provider behavior.

## Safety and privacy boundary

- No credential, token, private URL, account identifier, message body, personal
  data, raw provider error, real Workspace identifier, or machine path belongs
  in the repository or validation report.
- Local clasp bindings and pull/staging state are ignored and scanned out.
- Diagnostics and evidence retain only bounded enums, counts, hashes, and safe
  references.
- Gemini external AI is implemented behind Script Properties and strict
  approval/configuration gates; no credential is stored in the repository and
  no real provider request is authorized by this contract.
- No live Google or external mutation is authorized by this current contract.

## Current release model

The current release has two packages generated from exact Work 0028 A15 source:

1. `v2.8.15-prepilot`: `TEST_MODE=true`, Automation OFF, harness included.
2. `v2.8.15-prepilot-phase8c`: only `TEST_MODE=false` changes and the harness
   is excluded.

B15 must be A15's direct child. `CURRENT_CONTRACT.json`, manifests, checksums,
and verifiers bind the source/release roles. Work 0018 creates no transfer or
deployment target.

## Historical boundary

Existing audits, legacy `instructions/`, releases, transfers, and evidence are
retained as historical records. Old version/gate/transfer selectors are not
active. The current task exchange is under `docs/handoffs/`.

## Runtime evidence addendum 窶・Work 0027 (2026-08-11)

The source-contract sections above remain unchanged and continue to define the
machine-bound candidate/release gate. Separately, controlled Works 0019-0026
proved materially stronger behavior on the existing personal-synthetic Google
target without changing source/release identity.

Accepted synthetic-only real-runtime evidence now covers:

- Advanced Gmail Service preprocessing through the repaired decoder;
- Task authority persistence;
- Mock Task creation;
- Review creation and human acceptance through the canonical installable edit
  Trigger;
- ordinary manual Task edits through the authority path;
- managed secondary Calendar CREATE, UPDATE in place, and DELETE;
- post-Setup Quick Diagnostic with zero FAIL and authority-ledger validation.

This evidence does not authorize production/company data, deployment, or
automatic processing. It also does not replace the `Highest gate` field above.
For runtime planning, the next coherent boundary is controlled production-AI
Provider integration on synthetic data while Automation remains OFF.

Three known observations remain intentionally visible:

- Mock vertical `review_count` under-counting is a non-blocking observability
  defect; bundle it into the next coherent source-change Work rather than
  creating standalone release churn.
- `VERSION_PROPERTIES` WARN is truthful target metadata drift and should be
  refreshed during the next controlled target update, not suppressed.
- `RETRY_DEAD_LETTER_STATE` WARN is truthful retained synthetic negative-test
  history and should not be deleted simply to make diagnostics green.
