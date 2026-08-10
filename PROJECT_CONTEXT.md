# Project Context

Last updated: 2026-08-08

Project ID: `google-workspace-personal-work-os`

Repository of record: `Tanukitsune-hub/GAS-Project-Schedule`

Current candidate: Code `2.8.13-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

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
- AI schema: provider-neutral `2.0`; production registry intentionally empty.
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
- External AI remains unavailable and fails closed.
- No live Google or external mutation is authorized by this current contract.

## Current release model

The current release has two packages generated from exact A13 source:

1. `v2.8.13-prepilot`: `TEST_MODE=true`, Automation OFF, harness included.
2. `v2.8.13-prepilot-phase8c`: only `TEST_MODE=false` changes and the harness
   is excluded.

B13 must be A13's direct child. `CURRENT_CONTRACT.json`, manifests, checksums,
and verifiers bind the source/release roles. Work 0002 creates no transfer or
deployment target.

## Historical boundary

Existing audits, legacy `instructions/`, releases, transfers, and evidence are
retained as historical records. Old version/gate/transfer selectors are not
active. The current task exchange is under `docs/handoffs/`.
