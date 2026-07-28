# Audit Remediation Round 5 — Calendar Outbox Authority-Loss Implementation

Release package-generation report — 2026-07-29
Repository: `Tanukitsune-hub/GAS-Project-Schedule`

## Purpose and provenance boundary

This is the final R5 release-boundary report. It records packages generated
from R5 Source A5.4 after an independent review found and corrected a second
authority-compensation durability path. It is not the independent re-audit
result and does not authorize a real Google Workspace action.

| Field | Value |
|---|---|
| Code | `2.8.5-prepilot` |
| Schema / AI Schema / Migration | `2.6` / `2.0` / `3` |
| Source A5.4 | `6c4f737c676b3121c42aafabe9d0c677cacd69bb` |
| Release B5.4 | `SELF (the Git commit containing this report and the generated packages)` |
| Fixed historical audit target | `3442ac01f5c544c2b49a40a9af170d1f432312f1` |
| Automation default | `OFF` |
| Package-generation gate | `NO-GO_REMOTE_PUBLICATION` |

R5 Source A5.3 / Release B5.3 were retained as local, un-published candidate
history. Review found that a later forced re-enqueue could overwrite a pending
authority-compensation record and strand an owned Event. The issue was not
amended, rebased, reset, or force-published. A5.4 is an additive child of
A5.3; B5.4 is an additive direct child of A5.4.

## Corrective implementation

The Calendar worker uses the shared fail-closed Task Authority Ledger validator
in a short lock-held preflight immediately before Calendar I/O.

1. A known authority exclusion is durably `CANCELLED` before any Calendar API
   call.
2. A valid job persists `DEADLINE_CALENDAR_ARMED`, the deterministic Event ID,
   and its claim fingerprint before external I/O.
3. Authority loss after the arm schedules
   `DEADLINE_CALENDAR_AUTHORITY_COMPENSATION`, which deletes only a verified
   Work OS-owned Event and never writes an acknowledgement to an excluded Task.
4. Compensation has higher priority than later Task enqueue. A valid or
   ineligible Task edit cannot replace it with normal `NOOP` / `DONE`, clear
   its Event ID, or invalidate its Outbox-only CAS. The owned cleanup finishes
   or fails closed before ordinary reconciliation resumes.
5. Crash recovery, concurrent ineligibility, a foreign Event, and manual retry
   retain a durable target type; `error_code` is never used as intent storage.

## Package generation results

Both builders were invoked from a clean checkout whose `HEAD` exactly matched
Source A5.4, with `PreparedAt=2026-07-29T00:00:00Z`.

| Package | Files | Payload files | Canonical payload SHA-256 | Contract result |
|---|---:|---:|---|---|
| `release/v2.8.5-prepilot/` | 27 | 23 | `8c423f402ce8bb1de7aaa35ab70129b9af45c8abf1d0ccfe20dade8d44dea738` | source parity PASS; `TEST_MODE=true`; Automation OFF; harness included; secret scan PASS |
| `release/v2.8.5-prepilot-phase8c/` | 25 | 22 | `64e7ec4cf9d452db7c713275e0b2451ff194da9a737c539b8af96b324708ba10` | audited `TEST_MODE=false` transform only; harness excluded; provenance PASS; Automation OFF |

The builders refuse a non-exact Source `HEAD`, source-input drift, and a
non-empty current release target. They do not permit overwriting or merging an
existing generated package.

## Local source evidence before package generation

| Check | Result |
|---|---|
| All `tests/*.js` | 41 suite files; 611 PASS / 0 FAIL / 11 explicit real-Workspace/fake-runtime skips |
| `prepilot_calendar_cas_failure_injection_test.js` | 12 PASS / 0 FAIL; includes seven F016 paths, including compensation survival across forced re-enqueue |
| `phase4_performance_test.js` | 8 PASS / 0 FAIL |
| `tools/validate_apps_script_v2.js` | 11/11 PASS; 22 `.gs` files |
| Static source secret scan | PASS; only three reviewed synthetic harness fixtures excluded |

## Historical and non-results

- The historical Round 4 implementation report remains a B5.2
  package-generation record and is not rewritten. Its clarification that the
  Round 3 backup directory was local-only and absent from GitHub remains
  historical provenance, not a rollback artifact for this release.
- Real Google Workspace, Sheets protection behavior, Gmail, Calendar,
  LockService, OAuth consent, Provider credentials, deployment, `clasp push`,
  automation/trigger enablement, and company-PC transfer are `NOT_EXECUTED`.
- This report does not declare `READY_FOR_INDEPENDENT_REAUDIT`, Phase 8B
  GO/PASS, Phase 8C GO, production ready, or pilot ready. Final remote
  publication, fresh-clone verification, and transfer-envelope audit remain
  required.
