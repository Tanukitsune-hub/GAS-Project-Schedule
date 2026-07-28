# Google Workspace v2.8.5 Independent Re-audit Report

Audit date: 2026-07-29

## Scope and immutable audit target

| Item | Value |
|---|---|
| Repository | Tanukitsune-hub/GAS-Project-Schedule |
| Fixed audit target (P5) | 3442ac01f5c544c2b49a40a9af170d1f432312f1 |
| Corrected Source A5.2 | ff658bacf1e85864e4008efa32863635e446d47d |
| Corrected Release B5.2 | d6dda2b3eb9307e7033dcdd5f4718260c4944451 |
| Audit method | Independent fresh detached worktree and separate rebuild worktree |
| Real Google Workspace | NOT EXECUTED |
| Initial result for the fixed target | REAUDIT_NO_GO |

This report records the audit result of the immutable fixed target before any
remediation. It does not replace, rewrite, or reinterpret A5.2, B5.2, or P5.

## Lineage and release-boundary result

- B5.2 is the direct child of A5.2; P5 is the direct child of B5.2.
- A5.2 to B5.2 contains exactly 53 allowed files: Phase 8B package 27 files,
  Phase 8C candidate package 25 files, and the Round 4 report 1 file.
- B5.2 to P5 contains exactly three publication-evidence files:
  CURRENT_STATUS.md, README.md, and the 2026-07-28 remote-publication
  verification report.

No lineage finding was identified.

## Independent verification result

| Check | Result |
|---|---|
| All JavaScript suites | 41 suites; 604 PASS / 0 FAIL / 11 explicit fake-runtime or real-Workspace skips |
| Apps Script validator | 11/11 PASS; 22 .gs files |
| Remote publication consistency | 8/8 PASS |
| PowerShell parser | 4/4 release tools parse without error |
| Phase 8B verifier | 27 package files / 23 payload; source parity, checksums, secret scan, provenance PASS |
| Phase 8C verifier | 25 package files / 22 payload; audited transform parity, checksums, allow-lists, secret scan, provenance PASS |
| Source rebuild byte parity | 8B 27/27 and 8C 25/25 files byte-identical to B5.2 |
| Root duplicate and clasp check | PASS; no root-level duplicate source tree and no .clasp.json |
| Automation default | OFF |

Phase 8B canonical payload SHA-256:

    2b0356b1e9c22a2e62642db036dae931d8dc8f0e6f875f6510b9520e4bbe3c71

Phase 8C canonical payload SHA-256:

    22686419fe675d6582e476cd3a6d14162640312a7eddb492d87fda2bd7206db3

## Findings at the fixed target

### High — REAUDIT-CAL-01: Calendar authority time-of-check/time-of-use gap

Calendar processing validates authority while preparing a job, releases the
outbox lock, and can then execute an external CREATE without a final
authority-aware revalidation. If the Task is deleted, orphaned, or otherwise
authority-excluded in that interval, commit detects a conflict but the
Task-absent post-conflict branch does not schedule compensating DELETE. A later
prepare cancels the outbox record without removing the already-created external
event.

Independent local fake-runtime reproduction observed this sequence:

1. enqueue and prepare a valid Task CREATE;
2. remove the Task and classify its ledger record as ORPHANED;
3. execute the prepared job and commit;
4. run the next prepare pass.

The observed result was one external CREATE, a conflict, durable
CANCELLED/E_CALENDAR_TASK_AUTHORITY_EXCLUDED outbox state, and no compensating
external DELETE. Existing tests cover exclusion before prepare and compensation
when the Task still exists, but did not cover this removal/invalidation window.

This is a High finding because an authority-excluded Task can leave an external
Calendar event. It blocks company-PC transfer preparation until a source fix,
fault-injection regression test, regenerated release package, and full
re-verification are complete.

### Medium — REAUDIT-DOC-01: current canonical state is stale in several documents

At P5, MASTER_PLAN.md, PROJECT_CONTEXT.md, docs/TASK_AUTHORITY_PROTOCOL.md,
the R4 verification matrix, and the requirements traceability document retain
pre-publication gate or A5.1/B5.1 assumptions. The historical Round 4 package
report and immutable package manifests correctly retain their package-generation
status and must not be rewritten as current status.

### Medium — REAUDIT-TRANSFER-01: no version-correct, Phase-8B-only transfer envelope

The fixed target has an audited Phase 8B package, but no Japanese transfer
guide, 8B-only allow-list manifest, current acceptance record template,
synthetic-data specification, or stop/rollback checklist. Whole-repository or
whole-release transfer would expose the adjacent Phase 8C candidate and is not
an accepted company-PC transfer method.

## Gate decision

Critical findings: 0

High findings: 1 (REAUDIT-CAL-01)

Medium findings: 2 (REAUDIT-DOC-01 and REAUDIT-TRANSFER-01)

Low findings: 0

The fixed audit target is therefore REAUDIT_NO_GO. No company-PC transfer
package is approved from this fixed target. The next step is to remediate the
High Calendar finding first, then repeat every required verification from the
new source and release lineage before evaluating transfer preparation.

## Not executed

- Real Google Workspace, OAuth consent, deployment, clasp push, triggers, and
  Automation enablement.
- Real Gmail, Calendar, provider, company-PC, company approval, or production
  data handling.
- Phase 8B Sandbox acceptance, Phase 8C GO, production-ready, and pilot-ready
  declarations.

## Review focus for remediation

1. Revalidate authority immediately before Calendar external I/O.
2. Preserve enough durable evidence to schedule a compensating DELETE when a
   post-I/O authority conflict observes a missing or excluded Task.
3. Add a regression case for deletion or authority invalidation between prepare
   and execute, including the exact external-operation counts.
4. Keep generated release payload immutable until a new source commit has
   passed the full suite and a separate release commit has been generated.
