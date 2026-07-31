# Instruction 0004 — T11 canonical transfer-boundary conflict remediation

## Scope and lineage

- Instruction: `0004`
- Baseline canonical-gate evidence: `2d4d3d36034d169335fe610cd55c656fd8eb1de1`
- Instruction parent: `7136ffaef34bf78d7d3e5e82e94c4acec542414d`
- Source A11.1: `aeca148415d70df625400e53d2281378adff60b4`
- Release B11: `952438907e1a09092a46127dc130b3403a911db4`
- Fixed Transfer T11: `a3b5a5d8d851bf2d15a2738c54dc6bb31e231d33`
- Local Evidence E11: `908476ac716d3a3b6bdf35cd814dede1f2b0e411`
- Resulting remediation commit: `SELF` (the additive documentation, test, and
  evidence commit containing this record; direct child of the instruction
  parent).

## Closed contradiction statement

At the baseline, the marked top-level current-transfer contract named Code
`2.8.11-prepilot`, gate `READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER`, fixed
T11, and the v2.8.11 transfer path. The active lower `Company-PC transfer
boundary` in `README.md` instead named fixed T10, the v2.8.10 transfer path,
and `READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE` as the approved carriage
boundary. An operator could therefore select the wrong payload or scope. This
was a transfer-safety blocker, not a historical-reference defect.

## Classification and disposition

| Classification | Disposition |
|---|---|
| `ACTIVE_CURRENT_ASSERTION` | The root README Company-PC section is now a marked active boundary whose gate, fixed transfer, and path are mechanically checked against the top current-transfer contract. It names T11 only as the carriage source. |
| `AMBIGUOUS_OPERATOR_INSTRUCTION` | Current-status, plan, context, decision, calendar/authority protocol, visualization, implementation guide, Tranche 1 runbook/template, and recovery/remediation documents were corrected or given an explicit historical/nonoperative notice. Their active direction is now T11-only and permits only hash-verified five-file replacement followed by one separately approved, read-only T1-01 Quick Diagnostic re-observation. |
| `CLEARLY_LABELLED_HISTORICAL_EVIDENCE` | T10, old gates, prior packages, and copied historical material remain intact when labelled historical. In particular, T10 remains the required old-byte/hash baseline inside the immutable T11 patch manifest. |

The following active or ambiguous document areas were remediated: root README,
`CURRENT_STATUS.md`, `MASTER_PLAN.md`, `PROJECT_CONTEXT.md`, `DECISIONS.md`,
the Authority and Calendar protocols, the current visualization, source-copy
documentation and changelog, the manual-acceptance plan/guide, the Tranche 1
runbook/results template, recovery guides, remediation plan, and requirements
traceability. Historical T10 references were not globally removed.

## Resulting current operator boundary

- Gate: `READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER`
- Fixed carriage source: T11
  `a3b5a5d8d851bf2d15a2738c54dc6bb31e231d33`
- Governing path:
  `implementation/GoogleSpreadsheet/transfer/v2.8.11-prepilot/`
- Carriage: after exact old/new SHA-256 confirmation, replace only the five
  files listed by the fixed T11 patch manifest. `appsscript.json` and every
  unlisted file remain unchanged.
- Authorized follow-up: one separately approved, read-only T1-01 Quick
  Diagnostic bounded-summary re-observation only.
- T1-01 remains `REVIEW_REQUIRED`; T1-02 and later actions remain
  unauthorized.

No Setup, S90, S99, Dashboard refresh, Gmail, Calendar reconciliation,
Properties, trigger work, Automation, tests, Migration, or repair action is
authorized by this boundary. It does not declare T1-01 PASS, Phase 8B overall
PASS, Phase 8C GO, production ready, or pilot ready.

## Changed-file boundary

This remediation changes documentation, one static Node validation suite, and
this audit record only. It does not modify Apps Script executable source,
`appsscript.json`, release packages, transfer envelopes, checksums, fixed
T11, A11.1, B11, T11, or E11.

### Exact changed paths

- `README.md`, `CURRENT_STATUS.md`, `MASTER_PLAN.md`, `PROJECT_CONTEXT.md`,
  and `DECISIONS.md`
- `docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`,
  `docs/R4_VERIFICATION_MATRIX.md`, `docs/TASK_AUTHORITY_PROTOCOL.md`, and
  `docs/visualizations/index.html`
- `implementation/GoogleSpreadsheet/V2_IMPLEMENTATION_SPEC.md`
- `implementation/GoogleSpreadsheet/apps-script-v2/CHANGELOG.md` and
  `implementation/GoogleSpreadsheet/apps-script-v2/README.md`
- `implementation/GoogleSpreadsheet/docs/PHASE8B_DASHBOARD_NUMBER_FORMAT_RECOVERY_GUIDE_ja.md`,
  `implementation/GoogleSpreadsheet/docs/PHASE8B_DASHBOARD_SURFACE_RECOVERY_GUIDE_ja.md`,
  `implementation/GoogleSpreadsheet/docs/PHASE8B_SETUP_BLOCKER_RECOVERY_GUIDE_ja.md`,
  `implementation/GoogleSpreadsheet/docs/TASK_AUTHORITY_PROTOCOL.md`,
  `implementation/GoogleSpreadsheet/docs/V2_MANUAL_ACCEPTANCE_GUIDE.md`,
  `implementation/GoogleSpreadsheet/docs/V2_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE_PLAN_ja.md`,
  `implementation/GoogleSpreadsheet/docs/V2_PHASE8B_TRANCHE1_READONLY_STRUCTURAL_OPERATOR_RUNBOOK_ja.md`,
  `implementation/GoogleSpreadsheet/docs/V2_PHASE8B_TRANCHE1_READONLY_STRUCTURAL_RESULTS_TEMPLATE_ja.md`,
  `implementation/GoogleSpreadsheet/docs/V2_REMEDIATION_PLAN.md`, and
  `implementation/GoogleSpreadsheet/docs/V2_REQUIREMENTS_TRACEABILITY.md`
- `implementation/GoogleSpreadsheet/visualizations/task_authority_protocol_v2_8_10.html`
- `implementation/GoogleSpreadsheet/tests/canonical_document_consistency_test.js`
- This audit record

## Validation record

| Check | Result |
|---|---|
| Canonical current-transfer and active-boundary negative fixtures | PASS — 14/14 assertions; T8/T9/T10 current-ref and both marker-table and active-prose T10, old-gate, and old-path fixtures fail; clearly labelled historical T10 evidence and the historical T10 manifest baseline remain allowed. |
| Full Node suite / bounded-summary regression | PASS — 48/48 suites, including `phase8b_t1_01_bounded_acceptance_summary_test.js`. |
| Apps Script validator | PASS — 11/11 checks; 22 `.gs` files; Automation default remains `OFF`. |
| Remote-publication consistency | PASS — 10/10 A11.1/B11/T11/E11 assertions. |
| Phase 8B and Phase 8C package verifiers | PASS — parity, checksum, allow-list, provenance, and secret-scan checks. |
| T11 patch-manifest and transfer-envelope verifiers | PASS — 5 changed / 18 unchanged payload files; `appsscript.json` unchanged; 10 transfer files; checksum and allow-list checks pass. |
| Changed documentation/test/evidence secret, local-path, and real-ID scan | PASS — 25 files, 0 matches. |
| Changed-file boundary, fixed-T11 resolution, and byte immutability | PASS — release, transfer, checksum, executable source, and `appsscript.json` are unchanged; fixed T11 transfer tree resolves to `e26ce1fce81c8cf8afd27be0674c6e281b198650`. |
| GitHub resolution and detached HTTPS fresh-clone verification | Recorded after normal push. |

## Execution and privacy boundary

No real Google Workspace operation, company-PC carriage, OAuth, Apps Script
import, Setup, Diagnostic, Dashboard refresh, Gmail, Calendar, deployment,
`clasp push`, Automation/trigger action, Provider configuration, or real-data
operation occurred in this remediation. The T11 T1-01 re-observation remains
`NOT_EXECUTED`. No credential, local path, Workspace identifier, screenshot,
business data, or personal information is retained here.
