# GAS Project Schedule

Google Apps Script implementation and audited remediation evidence for the
Google Workspace Personal Work OS.

| Contract | Value |
|---|---|
| Code | `2.8.5-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Current gate | `READY_FOR_PHASE8B_SANDBOX_TRANSFER` (non-confidential 8B carriage only) |
| Automation default | `OFF` |
| Task schema | 50 columns |
| Workbook schema | 11 Sheets, 5 hidden |

## Canonical paths

- Context: `PROJECT_CONTEXT.md`, `MASTER_PLAN.md`, `DECISIONS.md`,
  `CURRENT_STATUS.md`
- Authority design: `docs/TASK_AUTHORITY_PROTOCOL.md` and
  `docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`
- Apps Script source: `implementation/GoogleSpreadsheet/apps-script-v2/`
- Tests: `implementation/GoogleSpreadsheet/tests/`
- Validation and release tooling: `implementation/GoogleSpreadsheet/tools/`
- Source docs and visualization: `implementation/GoogleSpreadsheet/docs/` and
  `implementation/GoogleSpreadsheet/visualizations/`
- R5 immutable release artifacts:
  `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/`
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
The exact GitHub instruction named by the current handoff is the only
task-specific specification. Older indexed instruction sets remain historical
evidence unless the current handoff explicitly selects them. GitHub-unsaved
long conversation text is not an authoritative task specification.

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

## P5 baseline and R5 corrective publication

Corrected Source A5.2 `ff658bacf1e85864e4008efa32863635e446d47d`, corrected
Release B5.2 `d6dda2b3eb9307e7033dcdd5f4718260c4944451`, and fixed P5 target
`3442ac01f5c544c2b49a40a9af170d1f432312f1` remain published historical
evidence. Their normal non-force publication and fresh-clone verification are
recorded at
`audits/2026-07-28/GoogleWorkspace_v2_8_5_Remote_Publication_Verification_2026-07-28.md`.

The independent fixed-ref review found two High Calendar authority-loss
findings. The initial unpublished A5.3/B5.3 candidate pair is retained as
history; the final additive correction is Source A5.4
`6c4f737c676b3121c42aafabe9d0c677cacd69bb` and direct-child Release B5.4
`3e5790672740626f3bec4592c3c7c0b86b47f3b1`. P6
`12538796fed90eb7f95492d477cca44a5d859291` was normal-pushed to the target
branch, resolved from GitHub, and verified in a fresh clone. Historical P7
transfer evidence exposed a newline portability flaw in its operator checksum;
P8 `784b293c50713597a656bc7d9d1ae51fdaa26f1a` corrected it with canonical
UTF-8 text hashing and passed a new fresh-clone verifier. P9
`ab6b1db8c0d7cc3f0df6bc104cfee39392787d4b` then normally published the
final transfer-envelope correction and passed its own GitHub-resolution and
fresh-clone re-audit. P10 `1a1f9df65dacf3a031409d724cb2906b58900f77` is the
fixed transfer reference independently revalidated from a new HTTPS clone.
The later evidence-only closure record is intentionally outside the transfer
target. The resulting status is transfer-only.

## Company-PC transfer boundary

Do not copy this repository, the entire `release/` tree, or the Phase 8C
candidate to a company PC. The P8 checksum-portability correction, P9
final-head proof, and fixed P10 fresh-clone verification have independent
remote/fresh-clone evidence. Copy the exact Phase 8B package only through a
company-approved route using
`implementation/GoogleSpreadsheet/transfer/v2.8.5-prepilot/` as the
allow-list, Japanese procedure, stop/rollback checklist, synthetic-data
specification, and result-record source.

The transfer material is outside the immutable package and does not alter its
checksums. It allows carriage of a non-confidential Sandbox candidate only;
it never declares Phase 8B PASS, Phase 8C GO, production ready, pilot ready,
OAuth approval, deployment, `clasp push`, Automation enablement, real data,
or real Workspace operation.
