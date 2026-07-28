# GAS Project Schedule

Google Apps Script implementation and audited remediation evidence for the
Google Workspace Personal Work OS.

| Contract | Value |
|---|---|
| Code | `2.8.5-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Current gate | `READY_FOR_INDEPENDENT_REAUDIT` |
| Automation default | `OFF` |
| Task schema | 50 columns |
| Workbook schema | 11 Sheets, 5 hidden |

## Canonical paths

- Context: `PROJECT_CONTEXT.md`, `MASTER_PLAN.md`, `DECISIONS.md`,
  `CURRENT_STATUS.md`
- Authority design: `docs/TASK_AUTHORITY_PROTOCOL.md`
- Apps Script source: `implementation/GoogleSpreadsheet/apps-script-v2/`
- Tests: `implementation/GoogleSpreadsheet/tests/`
- Validation and release tooling: `implementation/GoogleSpreadsheet/tools/`
- Source docs and visualization: `implementation/GoogleSpreadsheet/docs/` and
  `implementation/GoogleSpreadsheet/visualizations/`
- Published release artifacts: `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/`
  and `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot-phase8c/`

There must be no root-level duplicate `apps-script-v2/`, `tests/`, `tools/`,
or `release/` subtree in the published canonical tree.

## Task authority model

The visible `タスク一覧` Sheet is the business workflow surface. Technical
recovery authority is the protected hidden `Task Authority Ledger`, using a
versioned two-slot `PREPARED` / `COMMITTED` protocol. A current authority may
never be recreated from `authoritative_snapshot_json`, a cell note, or a raw
user-edited row. Invalid or missing authority is isolated and excluded from
Worker, Review, and Calendar work.

See [the authority protocol](docs/TASK_AUTHORITY_PROTOCOL.md) and the local
[workflow visualization](docs/visualizations/GoogleWorkspace_v2_Workflow_Overview.html).

## ChatGPT–Codex handoff

GitHub is the only formal handoff medium. Read
`CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md` and D-036 before beginning a task.
The active remote-publication instruction is the indexed file under
`instructions/`; the index lists six numbered documents that must be read in
order. GitHub-unsaved long conversation text is not an authoritative task
specification.

## Local validation

Use the bundled Node runtime (or any supported local Node executable) if
`node` is not on `PATH`:

```powershell
$node = '<path-to-local-node-executable>'
& $node implementation/GoogleSpreadsheet/tools/validate_apps_script_v2.js
```

The project contains no deployment command in this workflow. Do not run
`clasp push` without explicit approval. Local PASS results do not authorize
Phase 8B GO/PASS, Phase 8C GO, production ready, or pilot ready.

## Remote publication verification

Corrected Source A5.2 `ff658bacf1e85864e4008efa32863635e446d47d` and
corrected Release B5.2 `d6dda2b3eb9307e7033dcdd5f4718260c4944451` were
published by normal non-force fast-forward to
`codex/r4-authority-protocol`. A fresh HTTPS clone verified the full local
test suite, Apps Script validator, package parity/checksums, allow-lists,
provenance, and secret scans. The highest status is
`READY_FOR_INDEPENDENT_REAUDIT`; independent re-audit is still pending.

See
`audits/2026-07-28/GoogleWorkspace_v2_8_5_Remote_Publication_Verification_2026-07-28.md`
for the exact evidence and limits.
