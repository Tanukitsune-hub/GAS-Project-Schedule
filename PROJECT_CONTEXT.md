# Project Context

Last updated: 2026-07-31
Project ID: `google-workspace-personal-work-os`
Repository of record: `Tanukitsune-hub/GAS-Project-Schedule`
Current candidate: Code `2.8.10-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
Publication gate: `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`

<!-- CURRENT_TRANSFER_CONTRACT_START -->
| Field | Value |
|---|---|
| Code | `2.8.10-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Gate | `READY_FOR_PHASE8B_SANDBOX_RETRANSFER` |
| Fixed transfer | `927d8567bce64461840cc6f72fbae0c1e636a8e6` |
| Transfer path | `implementation/GoogleSpreadsheet/transfer/v2.8.10-prepilot/` |
<!-- CURRENT_TRANSFER_CONTRACT_END -->

v2.8.10 preserves the exact owner-proven Dashboard control plane and its
deterministic Setup-only plain-text contract for the exact 17-by-3 system
block. After an actual write, Setup flushes pending writes, reacquires a fresh
exact Range, and requires all 51 formats to be canonical before S90 continues.
Config, Setup, and Dashboard module-contract skew fails closed before any
write. Quick/Deep Diagnostic remain read-only; arbitrary formats and foreign
or ambiguous surface state remain fail-closed.

Historical corrected Source A9.1, direct-child corrected Release B9.1, fixed
T9, and evidence E9 were normal-published and independently verified in a
detached HTTPS clone. They remain immutable evidence, but
`PHASE8B-DASHBOARD-WRITE-VISIBILITY-01` supersedes T9 as an execution transfer
target. Source A10 `33b9ecee5b0957615fcc27fc822bf7d10a74c86f`,
direct-child Release B10 `3f4fe6c52be7bf9c66ad221594e6271feebb57ed`,
and fixed T10 `927d8567bce64461840cc6f72fbae0c1e636a8e6` are
normally published and independently verified. This evidence-only commit is
not a transfer target. Real Workspace work remains `NOT_EXECUTED` and
Automation remains `OFF`.

## Historical v2.8.9/T9 context

v2.8.9 retains the exact owner-proven Dashboard control plane and adds one
deterministic, Setup-only plain-text number-format contract for the exact 17×3
system block. It is allowed only immediately before S90 after all schema,
Protection, seed/marker, and non-format surface checks are safe. Quick and
Deep Diagnostic remain read-only; arbitrary formats and foreign/ambiguous
surface state remain fail-closed. Real Workspace work is `NOT_EXECUTED`.

Corrected Source A9.1, direct-child corrected Release B9.1, and fixed T9 were
normal-published and independently verified in a detached HTTPS clone. At that
historical gate this permitted only carriage of the non-sensitive Phase 8B
Sandbox retransfer envelope; it was not a Phase 8B PASS, Phase 8C GO,
production-ready, or pilot-ready declaration.

The historical v2.8.8 additive correction addresses `PHASE8B-DASHBOARD-01` without
replacing the historical v2.8.5/P10, v2.8.6/T6.1, or v2.8.7/T7 chains. It
models native Protection ownership with internally equal owner/effective-user
identity and `canEdit()`, not an assumed one-entry explicit-editor list. It
also separates every Dashboard control/data/format surface into a closed
non-sensitive reason code and count. S00–S80 may be preserved; S90/S99 are
the only intended resume stages. Real Workspace retransfer/retest remains
`NOT_EXECUTED` and Automation remains `OFF`.

## Purpose

This repository contains the Google Apps Script implementation of a personal
work OS that derives Tasks from Gmail, keeps workflow state in Google Sheets,
and uses Google Calendar only as a derived reconciliation target. No
deployment, `clasp push`, credential, real Workspace identifier, real message
content, or real business data belongs in this repository or this remediation.

## Canonical operating model

| Concern | Canonical source | Rule |
|---|---|---|
| Business workflow / visible state | Google Sheet `タスク一覧` | User-facing projection only; never a recovery authority. |
| Technical integrity / recovery | Protected hidden `Task Authority Ledger` | Versioned two-slot ledger is the only current Task authority. |
| Calendar / Outbox | Durable derived intent | Never an authority source; final revalidation, durable arm, and owned-event-only compensation protect external I/O. |
| Repository source | This repository | Current implementation, tests, tools, docs, and releases live under `implementation/GoogleSpreadsheet/`. |

The Task Sheet has exactly 50 canonical columns. The workbook contract is 11
Sheets, 5 hidden. A missing, invalid, visible, or unprotected ledger never
falls back to `authoritative_snapshot_json`, a cell note, or a live raw row; it
fails closed to isolation.

## Provenance and current remediation

The published P5 target
`3442ac01f5c544c2b49a40a9af170d1f432312f1` remains the fixed audit baseline:
corrected Source A5.2 `ff658...` is its Release B5.2 `d6dda...` parent chain.
The fixed-ref independent re-audit preserved that evidence and recorded a
High Calendar authority-loss race as `REAUDIT_NO_GO`.

R5 does not rewrite the fixed target. The initial A5.3/B5.3 unpublished
candidate pair is retained as historical evidence. The final additive pair is
Source A5.4 `6c4f737c676b3121c42aafabe9d0c677cacd69bb`, followed by its
direct-child Release B5.4 `3e5790672740626f3bec4592c3c7c0b86b47f3b1`. A P6
integration retains both the historical P5 evidence and this final
source/release pair. P6 `12538796fed90eb7f95492d477cca44a5d859291` normally
published the final pair to the target branch; GitHub resolution and a new
fresh-clone rerun passed. A P7 fresh clone found that raw checkout-byte
operator checksums were not portable across line-ending forms; P8 corrected
that transfer-safety Medium with canonical text hashing and a fresh-clone
verifier. P9 `ab6b1db8c0d7cc3f0df6bc104cfee39392787d4b` then completed normal
publication, GitHub resolution, and fresh-clone verification, restoring only
the transfer-only gate without authorizing execution. P10
`1a1f9df65dacf3a031409d724cb2906b58900f77` is the fixed transfer reference
independently verified from a separate HTTPS clone. The evidence-only closure
commit that records this result is intentionally not part of the transfer
target.

After that historical transfer chain, the exact P10 2.8.5 Phase 8B package
failed a first-time empty-Spreadsheet Setup safely before `S20_CREATE_SCHEMAS`
completed: `E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN` at `TASK_AUTHORITY`, with only
S00 and S10 recorded.  This High `PHASE8B-SETUP-01` evidence has no Spreadsheet
ID, URL, account, screenshot, OAuth detail, or business data.  It supersedes
P10 as an executable transfer target.  The 2.8.6 correction is additive: Setup
itself establishes and verifies the protected-hidden Ledger control plane
before authority validation; it never weakens the validator or silently
recreates authority from a visible row, note, or snapshot.

Historical Source A6 `8e8e3e4a5f2288985554b3467a5b68814e7bab21`, direct-child Release B6
`49f6774242e11f3c4ae1f0881dc4a7e13c5aad23`, and fixed transfer ref T6.1
`863217b99dfa1ad682a8f4dd1989212b0a8d548b` are historical corrected evidence.
The historical additive v2.8.7 chain is Source A7
`be2e551da310a9b7c0611f3aef8899309a3d7b69`, direct-child Release B7
`95bc7240d99124b245e188b8e646eccf6c3ead48`, tool-only verifier correction C7
`ba175d3994c86dacc76bad3537df97e3e644dc09`, and fixed transfer T7
`008c643b85c6b234ad489d946033cb9c06d32920`. The target branch resolves T7 and
a detached HTTPS clone passed its full local/static and transfer verification.
Real Workspace retransfer/retest remains `NOT_EXECUTED`. The later safe S90
Dashboard ownership finding supersedes T7 as an executable transfer target.
Source A8 `4140054b03c850f4a1e669b3aa562b305ef78bf5` contains only
source/tests/tools/canonical-docs/visualization/incident/recovery material.
Direct-child Release B8
`a17d34422ed521cee81340902d9a19e2da372201` contains only both v2.8.8
packages and its implementation report. Fixed transfer T8
`69f843f6ea426ccb45d721a40508a35b0a59795d` contains only its transfer
envelope. The normal-pushed chain resolves on GitHub, and a detached HTTPS
clone passed all required source/package/transfer/rebuild/scanning checks.

The subsequent historical number-format chain is Source A9
`a448b8d856abd5eb32baa60117f5fdb9f8e56de9`, corrected Source A9.1
`4a145588b01a5f7ae7e9bce86efb9bd5b3d8345d`, direct-child corrected Release
B9.1 `b451d2361db99b4efbde036dafa3e2baf6b5cb97`, fixed transfer T9
`781f408fcf0853a5fffee9c00d3022ee5e17b1d7`, and evidence E9
`63841d85da478e401986e80db77e9308c8af9655`. It was normally published and
verified from a detached HTTPS clone. The repeated write-visibility finding
now makes that complete chain historical rather than the current execution
transfer target.

## Repository layout

- Canonical context: this file, `MASTER_PLAN.md`, `DECISIONS.md`, and
  `CURRENT_STATUS.md`.
- Authority design: `docs/TASK_AUTHORITY_PROTOCOL.md` and
  `docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`.
- Implementation, tests, tools, source docs, and visualizations:
  `implementation/GoogleSpreadsheet/`.
- Immutable historical failed P10 release packages:
  `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/` and
  `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot-phase8c/`.
- Historical failed P10 transfer envelope (not executable):
  `implementation/GoogleSpreadsheet/transfer/v2.8.5-prepilot/`.
- Corrected 2.8.6/T6.1, v2.8.7/T7, v2.8.8/T8, and v2.8.9/T9 package and
  transfer directories are immutable historical evidence. None is the
  current execution transfer target.
- The current v2.8.10 carriage path is
  `implementation/GoogleSpreadsheet/transfer/v2.8.10-prepilot/`, fixed at T10
  `927d8567bce64461840cc6f72fbae0c1e636a8e6`. T10 is the direct
  child of Release B10 and is not part of Source A10.
- Instructions and audit inputs: `instructions/` and `audits/`.

No legacy `context-hub` path is a source, publication target, or sync target.

## GitHub handoff discipline

GitHub is the formal ChatGPT–Codex handoff medium. The detailed policy is
`CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md` and decision D-036. A task begins
from a saved instruction, is re-read from GitHub, and returns its evidence to
this repository. Historical instructions and reports are retained rather than
silently rewritten.

## Company-PC boundary

The historical P10 envelope must not be carried or executed after
`PHASE8B-SETUP-01`. Automation remains OFF; do not manually hide the Ledger,
continue P10 Setup, or run P10 diagnostics. Preserve the failed workbook as
evidence. T6.1, T7, T8, and T9 are also historical and are not current
execution transfer targets. `READY_FOR_PHASE8B_SANDBOX_RETRANSFER` approves
controlled carriage only from fixed T10
`927d8567bce64461840cc6f72fbae0c1e636a8e6`. It does not approve real
data, OAuth, Apps Script import, Setup, diagnostics, Dashboard refresh,
Provider configuration, deployment, Automation, triggers, or any real
Workspace operation.
