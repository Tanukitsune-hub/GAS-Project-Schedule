# Phase 8B Setup Ledger Visibility Blocker Incident

- Finding: `PHASE8B-SETUP-01`
- Severity: High — Phase 8B execution-readiness blocker
- Affected historical package: Code `2.8.5-prepilot` P10 transfer ref
  `1a1f9df65dacf3a031409d724cb2906b58900f77`
- Corrected candidate: Code `2.8.6-prepilot` / Schema `2.6` / AI Schema `2.0`
  / Migration `3`
- Current gate: `PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER`
- Automation: `OFF`

## Safe observed evidence

The exact historical P10 Phase 8B package was used for a first-time Setup on a
new empty Spreadsheet. It stopped safely before schema-stage completion:

```text
status: FAILED
code: E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN
stage: TASK_AUTHORITY
completed_stages:
  - S00_VALIDATE_ENV
  - S10_CREATE_SHEETS
duration_ms: 38645
```

This record intentionally contains no Spreadsheet ID, Workspace URL, account,
email, screenshot, OAuth detail, real data, or customer information. After the
failure there was no manual Ledger hide, raw-row edit, Setup continuation,
Quick/Deep Diagnostic workaround, Calendar action, task import, or Automation
enablement.

## Verified root cause

In the historical code path, S20 called `applyAllSchemas()` and immediately
called `validateTaskAuthorityForSetup()`. Schema application established Ledger
protection, but the only visibility operation was later in S30
`applyVisibility()`. The strict Task Authority validator correctly requires the
Ledger to be protected and hidden before authority access. Thus the real path
was:

```text
S00 validate empty workbook
-> S10 create canonical Sheets (Ledger visible)
-> S20 apply schema/protection
-> strict hidden-Ledger validation
-> E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN
-> S30 not reached; S20 not recorded
```

Completed-Setup reruns had the same ordering gap: layout refresh reasserted
protections but did not restore Ledger visibility before the pre-loop validator.

## Correction

`2.8.6-prepilot` introduces a narrowly scoped, Setup-owned, idempotent Ledger
control-plane operation. It establishes canonical Ledger protection and hidden
visibility after S20 schema application and before authority validation. S30
and a completed Setup rerun reassert the same controls. Protection and
visibility failures are deterministic safe Setup failures; because the stage
runner records S20 only on success, the failed state remains resumable.

The Task Authority validator remains fail-closed. No authority is recreated or
trusted from `authoritative_snapshot_json`, a note, or a raw Task row. The
correction does not grant a general Ledger repair path to diagnostics, Worker,
Review, Calendar, Migration, or edit restoration.

## Regression evidence

`phase8b_setup_ledger_visibility_test.js` covers:

1. a fresh empty full Setup and the pre-validator S20 control-plane order;
2. safe resume from the observed completed S00/S10 partial state;
3. injected visibility failure, with S20 incomplete and fail-closed;
4. injected protection failure, with S20 incomplete and fail-closed;
5. protected-visible and hidden-unprotected variants corrected only by Setup;
6. idempotent S30 reassertion;
7. completed Setup rerun with preserved Task/Ledger state and Automation OFF;
8. no raw-row, note, or snapshot authority fallback.

These are local fake-runtime regression checks. Corrected-package real Google
Workspace retest is `NOT_EXECUTED`.

## Historical-evidence boundary

P10, Source A5.4, Release B5.4, all v2.8.5 release bytes, and all v2.8.5
transfer materials remain unchanged as failed historical evidence. They are not
an executable transfer target. The corrected Source A6, direct-child Release
B6, transfer candidate, and later fresh-clone evidence are additive and use a
new version and transfer identity.
