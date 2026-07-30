# Phase 8B Quick Diagnostic real-runtime incident record

- Date: 2026-07-30
- Incident: `PHASE8B-QUICK-DIAGNOSTIC-01`
- Severity: High for Phase 8B execution readiness
- Affected candidate before remediation: Code `2.8.6-prepilot`
- Corrective candidate: Code `2.8.7-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- Real Workspace retest of the corrective candidate: `NOT_EXECUTED`

## Safe evidence retained

An empty isolated Sandbox completed Setup S00 through S80 and then stopped at
the read-only S90 Quick Diagnostic. The safe aggregate outcome recorded four
FAIL checks and five WARN checks. This incident record intentionally omits
Spreadsheet identifiers, URLs, account information, OAuth material, Calendar
or Gmail identifiers/content, screenshots, personal data, and business data.

| Safe finding | Confirmed contract mismatch | Corrective boundary |
|---|---|---|
| `DASHBOARD_LAYOUT_OWNERSHIP` | The diagnostic did not recognize the exact Setup-owned Dashboard protection/format/three-row seed control plane. | Recognize only the exact canonical control plane and seed; retain fail-closed checks for foreign controls or content. |
| `TASK_PROTECTIONS` | Setup protects Task rows 1–2 across 50 columns; the diagnostic expected a divergent one-row range. | Reuse the canonical header geometry for Setup and diagnostics; reject missing, wrong, permissive, or duplicate protections. |
| `BLANK_ROW_BOOLEAN_VALUES` | Native Sheets can materialize checkbox `false` on identity-empty preallocated Task rows. | Permit only schema-checkbox Boolean `false` on an identity-empty row; reject all other data/types/partial identity. |
| `TASK_VALIDATION_TYPES` | The diagnostic used a four-field fixed checkbox list and omitted `calendar_reconcile_required`. | Derive all checkbox expectations from `validationPlanForSheet(Task)`. |

## Safety and recovery position

The current Sandbox state is treated as S00–S80 complete and S90/S99 incomplete.
The correction is designed for idempotent revalidation/resume and must not
duplicate or delete Gmail labels, the dedicated Calendar, the owner edit
trigger, or non-secret properties. It must not enable Automation or a
time-driven trigger. No manual Sheet, Dashboard, Ledger, validation, protection,
Gmail, Calendar, trigger, or Task-data repair is a mitigation.

The source candidate remains
`PHASE8B_SANDBOX_NO_GO_QUICK_DIAGNOSTIC` until its release, transfer, normal
publication, and fresh detached clone evidence are completed. This incident
does not declare Phase 8B PASS, Phase 8C GO, production ready, or pilot ready.
