# GAS Project Schedule

Google Apps Script implementation and audited remediation evidence for the
Google Workspace Personal Work OS.

| Contract | Value |
|---|---|
| Code | `2.8.11-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Current gate | `READY_FOR_LOCAL_CLASP_VALIDATION` |
| Automation default | `OFF` |
| Task schema | 50 columns |
| Workbook schema | 11 Sheets, 5 hidden |

<!-- CURRENT_TRANSFER_CONTRACT_START -->
| Field | Value |
|---|---|
| Code | `2.8.11-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Gate | `READY_FOR_LOCAL_CLASP_VALIDATION` |
| Fixed transfer | `T11_SUSPENDED` |
| Transfer path | `NO_ACTIVE_COMPANY_TRANSFER` |
| Company handoff | `NO_GO_COMPANY_HANDOFF_PENDING_LOCAL_CLASP_VALIDATION` |
<!-- CURRENT_TRANSFER_CONTRACT_END -->

## Instruction 0006 — local clasp validation gate

Instruction 0005 is `SUPERSEDED_NOT_EXECUTED`. Its T11 five-file company-PC
carriage and the company-Sandbox T1-01 re-observation did not occur and are
not currently authorized. Fixed T11 remains immutable historical provenance,
not an active company carriage source. The non-Google local gate and the
current-branch GitHub Actions run have passed. The dedicated personal synthetic
dev target is not configured, so clasp push, pull-back parity, and runtime
dry-run remain unexecuted. The development gate is therefore
`READY_FOR_LOCAL_CLASP_VALIDATION`; company handoff remains
`NO_GO_COMPANY_HANDOFF_PENDING_LOCAL_CLASP_VALIDATION` until the remaining
gates are independently reviewed.

The 2.8.11 candidate preserves every Quick/Deep Diagnostic check and adds a
bounded, privacy-safe acceptance summary before the redacted detail payload.
T1-01 remains `REVIEW_REQUIRED`; no company-PC reflection, Setup rerun,
Dashboard refresh, or later Tranche action is authorized.

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
- Corrected 2.8.6 through 2.8.9 source/release/transfer chains remain
  immutable historical evidence. The published v2.8.9 corrected
  A9.1/B9.1/T9 chain is additive and does not replace any v2.8.5 through
  v2.8.8 package, transfer, or audit byte. T9 is superseded as an execution
  transfer target by `PHASE8B-DASHBOARD-WRITE-VISIBILITY-01`. Fixed v2.8.10
  T10 `927d8567bce64461840cc6f72fbae0c1e636a8e6` remains immutable historical
  evidence and the old-byte/hash baseline used by the T11 patch manifest.
  It is not the current payload or transfer anchor. A separately observed
  controlled Sandbox Setup completed through S99; functional acceptance
  remains separately gated.

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

## Historical v2.8.10 Dashboard write-visibility and module-skew remediation

`PHASE8B-DASHBOARD-WRITE-VISIBILITY-01` records the repeated safe 51-cell
finding after the historical v2.8.9 transfer. The confirmed product defect is
that Setup wrote the exact Dashboard number-format block and immediately read
it back without first making pending Apps Script writes visible. The v2.8.10
source correction keeps the strict ownership and surface preconditions, calls
`SpreadsheetApp.flush()` after an actual write, reacquires a fresh exact
Range, and requires the canonical postcondition before S90 may continue.
It also fails closed on mismatched S90-critical Config, Setup, and Dashboard
module contracts before any format write. Quick/Deep Diagnostic remain
read-only and Automation remains `OFF`. The source correction and the
observed Setup evidence have deliberately separate scopes.

Source A10 `33b9ecee5b0957615fcc27fc822bf7d10a74c86f`, direct-child
Release B10 `3f4fe6c52be7bf9c66ad221594e6271feebb57ed`, fixed transfer T10
`927d8567bce64461840cc6f72fbae0c1e636a8e6`, and E10 record historical
publication closure. Their then-current
`READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE` gate is historical and does
not authorize present operations. The current boundary is the marked local
clasp validation / no-company-handoff contract below.

## Observed controlled Sandbox Setup evidence

The operator reviewed one controlled non-production Sandbox observation and
translated it into the closed evidence retained in
`audits/2026-07-31/GoogleWorkspace_v2_8_10_Phase8B_Real_Workspace_Setup_S90_Acceptance_Evidence_2026-07-31.md`.
No image or sensitive Workspace detail is retained. In that one run, Setup
completed S00 through S99; the in-Setup S90 module contract was aligned; the
bounded 51-cell normalization recorded a write, flush, and verified strict
postcondition; no schema extension or Task-row change was reported; and layout
refresh reported 11 Sheets. This remediates the former 51-cell blocker for the
observed Setup run only.

Standalone Quick/Deep Diagnostic, Dashboard refresh, functional edit-trigger
behavior, Gmail processing, Calendar reconciliation, LockService contention,
authority fault injection, and external Provider work remain `NOT_EXECUTED`.
Automation and any five-minute trigger remain `OFF` / `NOT_AUTHORIZED`.
The result is not Phase 8B overall PASS, Phase 8C GO, production ready, or
pilot ready.

## Historical Phase 8B Dashboard number-format real-runtime remediation

`PHASE8B-DASHBOARD-NUMBER-FORMAT-01` records a safe S90 precondition failure:
the exact 17×3 Dashboard system surface has number-format drift while every
other Dashboard conflict count is zero. v2.8.9 does not weaken diagnostics or
accept arbitrary formats. Setup alone, immediately before S90, may establish a
deterministic plain-text contract after exact schema, owner-proven Protection,
seed/marker, and all other surface checks pass. Quick/Deep Diagnostic remain
read-only; foreign or ambiguous content fails closed. Real Workspace retest is
`NOT_EXECUTED` and Automation remains `OFF`.

## Historical Phase 8B Dashboard surface real-runtime remediation

`PHASE8B-DASHBOARD-01` records a safe real-Sandbox S90 failure:
`DASHBOARD_LAYOUT_OWNERSHIP` / `E_DASHBOARD_LAYOUT_CONFLICT` /
`UNSAFE_DASHBOARD_SURFACE`. The Sandbox remains S00–S80 complete and S90/S99
incomplete. No Workspace identifier, URL, account, screenshot, user identity,
or business data is retained.

The confirmed v2.8.7 defect was an invalid ownership predicate:
`getEditors().length === 1` treated a canonical owner-created Protection as
unsafe when the Spreadsheet owner could edit implicitly but was absent from
the ordinary explicit-editor list. Code `2.8.8-prepilot` compares Spreadsheet
owner and effective user internally, requires `Protection.canEdit()`, and
accepts only either zero explicit editors for that proven owner or the one
explicit owner. It still rejects Shared Drive / unavailable owner, foreign or
blank editors, domain edit, target audiences, warning-only mode, duplicate or
wrong protections, non-empty unprotected ranges, and foreign range
protections.

Dashboard values, formulas, input rules, notes, merges, hidden state,
background, font, number format, named ranges, seed, and marker are inspected
as separate closed non-sensitive reason codes and counts. Diagnostics expose
neither identities nor cell/range content. Source A8
`4140054b03c850f4a1e669b3aa562b305ef78bf5` is source/tests/tools/
canonical-docs/visualization/incident/recovery only. Direct-child Release B8
is `a17d34422ed521cee81340902d9a19e2da372201`; fixed transfer T8 is
`69f843f6ea426ccb45d721a40508a35b0a59795d`. GitHub resolved the full
normally pushed chain, and a detached HTTPS clone passed all required
source/package/transfer/rebuild/scanning checks. The resulting carriage-only
gate is `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`.

## Historical Phase 8B Quick Diagnostic remediation and T7 package

The historical v2.8.7 candidate corrected the four safe real-Sandbox findings
`DASHBOARD_LAYOUT_OWNERSHIP`, `TASK_PROTECTIONS`,
`BLANK_ROW_BOOLEAN_VALUES`, and `TASK_VALIDATION_TYPES`. Dashboard accepts
only the exact Setup-owned sheet/header protection control plane and exact
three-row pre-refresh seed. Task validation is schema-driven across five
checkbox columns; the Task header control plane is rows 1–2 by 50 columns;
identity-empty rows allow only canonical checkbox `false`. All foreign
protection, user data, formula, note, named range, merge, hidden state,
non-default formatting, `true`, text boolean, non-checkbox data, and partial
identity cases remain fail-closed.

The published v2.8.7 chain is Source A7
`be2e551da310a9b7c0611f3aef8899309a3d7b69`, direct-child Release B7
`95bc7240d99124b245e188b8e646eccf6c3ead48`, transfer-verifier correction C7
`ba175d3994c86dacc76bad3537df97e3e644dc09` (package bytes unchanged), and
fixed transfer T7 `008c643b85c6b234ad489d946033cb9c06d32920`. T7 was normally
pushed, GitHub-resolved, and independently verified from a detached HTTPS
clone. Its then-current carriage gate was
`READY_FOR_PHASE8B_SANDBOX_RETRANSFER`; `PHASE8B-DASHBOARD-01` now
supersedes T7 as an executable transfer target.

The transfer envelope contains a raw-Git-blob-derived company-PC patch manifest
against historical T6.1. The real Workspace retransfer/retest remains
`NOT_EXECUTED`; this gate permits only controlled carriage of the exact
non-confidential Phase 8B package. It does not authorize Workspace execution,
OAuth, deployment, `clasp push`, Automation/trigger enablement, or real data.

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
and secret/local-path scans. This historical evidence was next superseded by
the separately verified v2.8.7 A7/B7/C7/T7 chain, which is itself historical.
None of these historical verification records authorizes Setup, OAuth,
deployment, `clasp push`, Automation, triggers, real data, or any real Google
Workspace action.

## ChatGPT–Codex handoff

GitHub is the only formal handoff medium. Read
`CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md` and D-036 before beginning a task.
The exact GitHub instruction named by the current handoff is the only
task-specific specification. Older indexed instruction sets remain historical
evidence unless the current handoff explicitly selects them. GitHub-unsaved
long conversation text is not an authoritative task specification.

## Local validation and personal-dev clasp

Install the locked module-local tooling with Node 20 or later, then run the
non-Google verification gate from Windows PowerShell:

```powershell
Set-Location implementation/GoogleSpreadsheet
pnpm install --frozen-lockfile
pnpm run verify:local
```

GitHub Actions runs the same non-Google verification lane with read-only
permissions. It never receives Google credentials or invokes clasp. The local
`gas:*` commands stage only the 23 canonical Apps Script payload files into an
ignored personal-dev workspace. They require an ignored target declaration,
an ignored `.clasp.json`, and explicit local opt-in before a guarded dev push.
See [local clasp setup](docs/local-clasp-setup.md),
[development validation gates](docs/development-validation-gates.md), and
[company handoff](docs/company-handoff.md). Local PASS does not authorize
company handoff, Phase 8B PASS, Phase 8C GO, production ready, or pilot ready.

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

<!-- ACTIVE_COMPANY_PC_TRANSFER_BOUNDARY_START -->
| Field | Value |
|---|---|
| Company handoff | `NO_GO_COMPANY_HANDOFF_PENDING_LOCAL_CLASP_VALIDATION` |
| Transfer state | `T11_SUSPENDED` |
| Current carriage source | `NO_ACTIVE_COMPANY_TRANSFER` |
| Workspace action | `NONE_AUTHORIZED` |
| T1-01 status | `REVIEW_REQUIRED` |

Instruction 0005 is `SUPERSEDED_NOT_EXECUTED`: no company-PC carriage, file
replacement, or company-Sandbox observation occurred. Fixed T11, its release
packages, transfer envelope, checksums, and prior manifests remain immutable
historical evidence. They must not be copied or reflected on a company PC
while this boundary is suspended.

No company Workspace action is authorized. Do not carry a package, change an
Apps Script file, run Setup or a diagnostic, touch Gmail, Calendar,
Properties, triggers, Automation, tests, Migration, or perform repair. A
future company boundary requires a separate governing instruction after the
local clasp validation lane and independent evidence review. This status does
not declare T1-01 PASS, Phase 8B overall PASS, Phase 8C GO, production ready,
or pilot ready.
<!-- ACTIVE_COMPANY_PC_TRANSFER_BOUNDARY_END -->
