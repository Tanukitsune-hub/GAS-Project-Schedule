# Phase 8B T1-01 Quick Diagnostic WARN=6 — Bounded Summary Visibility Blocker

Date: 2026-07-31
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Instruction: `instructions/0003_GoogleWorkspace_Phase8B_T1_01_Warn6_Diagnostic_Summary_Visibility_Remediation_2026-07-31.md`
Candidate: Code `2.8.11-prepilot` / Schema `2.6` / AI Schema `2.0` /
Migration `3`
Source lineage: A11 pending / B11 pending / T11 pending / E11 pending
Historical fixed transfer: T10 `927d8567bce64461840cc6f72fbae0c1e636a8e6`
(immutable; not modified by this work)

## 1. Closed observation preserved without inference

The following is the complete permitted T1-01 evidence. It is a closed,
non-sensitive record; no screenshot, account, Workspace identifier, URL, raw
detail JSON, cell/range, value, formula, note, format, locale, or timestamp is
recorded.

```text
action_id: T1-01
authorization: APPROVED
execution_status: REVIEW_REQUIRED
diagnostic_kind: QUICK
reported_status: WARN
pass_count: 77
warn_count: 6
fail_count: 0
code_version: 2.8.10-prepilot
schema_version: 2.6
migration_version: 3
setup_completed_through: S99_COMPLETE
duration_ms: 26742
remaining_warning_ids_safely_observable: false
detail_visibility: INSUFFICIENT_TRUNCATED_OR_OUT_OF_VIEW
next_action_authorized: false
rollback: STOP_NO_REPAIR_NO_RETRY
```

The exact sixth WARN ID was not safely visible. This report does not infer,
guess, list, suppress, or reclassify it. T1-01 remains `REVIEW_REQUIRED`; this
does not authorize T1-02 or any later Tranche action.

The closed Dashboard seed observation is likewise retained only as permitted
enums/Booleans: `DASHBOARD_LAYOUT_OWNERSHIP=WARN`,
`layout_status=LEGACY_SEED`, writable `true`, owner `explicit_editor`,
`conflict_reason=NONE`, `conflict_subreason=NONE`, conflict count `0`,
external surface `false`, and repair `false`. Task physical/expected columns
were `50/50` with ID/header `PASS`; Ledger physical/expected columns were
`21/21` and hidden/protected state was `PASS` in the reported observation.

## 2. Confirmed root cause

Fixed T10's `Menu.gs` placed aggregate status counts above the dialog detail,
but put the individual check IDs and Task/Ledger aggregates only in the full
serialized diagnostic object. `showSafeResult_` redacts that JSON and caps it
at 10,500 characters. The UI could therefore show `WARN=6` without safely
showing all six IDs. This is a visibility/acceptance-evidence defect, not proof
that a finding is harmless or repaired.

## 3. Candidate remediation contract

Source A11 adds `WORK_OS_V2_DIAGNOSTIC_ACCEPTANCE_SUMMARY_V1` to Quick and
Deep results. Before the existing detail cap, the Menu displays only the
following bounded fields:

- diagnostic kind/status, PASS/WARN/FAIL/NOT_EXECUTED counts;
- deterministic sorted unique WARN/FAIL IDs with explicit completeness flags;
- all-false read-only execution-policy Booleans;
- Task physical column count, ID/header state; and
- Ledger physical column count, hidden/protection/authority-validator state.

The bound is 96 IDs of at most 48 safe identifier characters. A duplicate,
malformed, absent, or overflowed list produces `REVIEW_REQUIRED` or `UNKNOWN`;
it never falls back to raw detail. The builder copies no raw message, detail,
value, formula, note, range, sheet, identifier, URL, identity, locale, or
format into the summary. Quick/Deep do not write Spreadsheet/Properties/
triggers, flush, repair the Dashboard, call Calendar/Gmail, or issue an
external AI request.

## 4. Completed-Sandbox safety boundary

This is not a reason to rerun Setup. The completed Sandbox's persisted
2.8.10 version properties can remain explicitly mismatched after a 2.8.11
source replacement; Quick Diagnostic must surface that condition as a WARN if
present, not silently reconcile it. Any later T11 operator procedure may
replace only the byte-different payload files, reload, run only T1-01 Quick
Diagnostic once, transcribe only the bounded fields, and then STOP. Setup,
Dashboard refresh, Gmail, Calendar, property/trigger work, Automation, T1-02,
and repair remain prohibited.

## 5. Local verification scope

`phase8b_t1_01_bounded_acceptance_summary_test.js` uses synthetic fixtures
only. It proves ordering before a capped detail payload, complete sorted six
synthetic WARN IDs, a state-dependent synthetic warning without raw details,
legacy Dashboard/AI/Calendar WARN retention, false side-effect Booleans,
Task/Ledger aggregates, and fail-closed overflow/malformed cases. It does not
assert real Google Workspace execution or identify the unobserved sixth WARN.

## 6. Status

Before a generated, verified, and published B11/T11/E11 chain, the only
permitted source status is `PHASE8B_SANDBOX_NO_GO_T1_01_SUMMARY`. No Phase 8B
overall PASS, Phase 8C GO, production ready, or pilot ready is declared.
