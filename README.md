# GAS Project Schedule

Google Apps Script implementation and audited remediation evidence for the
Google Workspace Personal Work OS.

| Contract | Value |
|---|---|
| Code | `2.8.7-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Current gate | `PHASE8B_SANDBOX_NO_GO_QUICK_DIAGNOSTIC` |
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
- Historical failed P10 release artifacts (immutable, not executable):
  `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/`
  and `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot-phase8c/`
- Corrected 2.8.6 source/release/transfer chain remains immutable historical
  evidence. The current 2.8.7 Source A7 candidate is additive and does not
  replace any v2.8.5 or v2.8.6 byte or transfer identity.

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

## Phase 8B Quick Diagnostic remediation candidate

The current candidate corrects the four safe real-Sandbox findings
`DASHBOARD_LAYOUT_OWNERSHIP`, `TASK_PROTECTIONS`,
`BLANK_ROW_BOOLEAN_VALUES`, and `TASK_VALIDATION_TYPES`. Dashboard accepts
only the exact Setup-owned sheet/header protection control plane and exact
three-row pre-refresh seed. Task validation is schema-driven across five
checkbox columns; the Task header control plane is rows 1–2 by 50 columns;
identity-empty rows allow only canonical checkbox `false`. All foreign
protection, user data, formula, note, named range, merge, hidden state,
non-default formatting, `true`, text boolean, non-checkbox data, and partial
identity cases remain fail-closed.

The current gate is `PHASE8B_SANDBOX_NO_GO_QUICK_DIAGNOSTIC`. Source A7 has no
v2.8.7 package, release report, or transfer envelope. Real Workspace retest is
`NOT_EXECUTED`; no Phase 8B PASS, Phase 8C GO, production/pilot readiness,
OAuth, deployment, `clasp push`, Automation/trigger enablement, or real data
authorization is implied.

## Historical Phase 8B Setup Ledger visibility blocker

The previously transferred P10 `2.8.5-prepilot` Phase 8B package failed during
first-time Setup before `S20_CREATE_SCHEMAS` completed.  The safe observed
error was `E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN` at `TASK_AUTHORITY`, after only
`S00_VALIDATE_ENV` and `S10_CREATE_SHEETS`.  It is recorded as High finding
`PHASE8B-SETUP-01` without any Workspace identifier, URL, account, screenshot,
or business data in
`audits/2026-07-29/GoogleWorkspace_v2_8_6_Phase8B_Setup_Ledger_Visibility_Blocker_Incident_2026-07-29.md`.

`2.8.6-prepilot` makes the protected-hidden Ledger control plane an explicit,
idempotent Setup-owned step before any hidden/protection authority validation.
`S30` and a completed-Setup rerun reassert the same control plane.  The
validator remains fail-closed; no Task raw row, note, or snapshot cell is used
as authority and no manual Ledger-hide workaround is a product fix.  Corrected
package real-Workspace retest is `NOT_EXECUTED`.

The historical fixed transfer ref is T6.1
`863217b99dfa1ad682a8f4dd1989212b0a8d548b`.  GitHub resolved that ref and a
target-branch fresh clone independently passed all 42 Node suites (619 PASS /
0 FAIL / 11 explicit skips), F016, the 11/11 Apps Script validator, both
package verifiers, parity rebuilds, checksums, allow-list, transfer checksums,
and secret/local-path scans. This historical evidence does not override the
current v2.8.7 `PHASE8B_SANDBOX_NO_GO_QUICK_DIAGNOSTIC` gate while A7/B7/T7
and fresh-clone proof are incomplete. It does not authorize Setup,
Phase 8B PASS, Phase 8C GO, production, pilot, OAuth, deployment, `clasp
push`, Automation, triggers, real data, or any real Google Workspace action.

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

Do not copy this repository, the entire `release/` tree, the failed P10
package, or the Phase 8C candidate to a company PC.  The P10 envelope remains
historical failed evidence and is not executable. The corrected 2.8.6 Phase
8B package is represented only by the historical T6.1 transfer envelope,
after separate source/release generation, normal publication, and fresh-clone
verification. The current v2.8.7 route remains no-go until its own verified
transfer envelope exists. The historical recovery instructions are
`implementation/GoogleSpreadsheet/docs/PHASE8B_SETUP_BLOCKER_RECOVERY_GUIDE_ja.md`.

Corrected transfer material remains outside its immutable package and does not
alter its checksums. A future `READY_FOR_PHASE8B_SANDBOX_RETRANSFER` is
carriage-only: it does not authorize Setup, diagnostics, Phase 8B PASS, Phase 8C GO,
production ready, pilot ready, OAuth approval, deployment, `clasp push`,
Automation enablement, real data, or real Workspace operation.
