# Project Context

Last updated: 2026-07-29
Project ID: `google-workspace-personal-work-os`
Repository of record: `Tanukitsune-hub/GAS-Project-Schedule`
Current candidate: Code `2.8.7-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
Publication gate: `PHASE8B_SANDBOX_NO_GO_QUICK_DIAGNOSTIC`

The current source-only candidate addresses `PHASE8B-QUICK-DIAGNOSTIC-01`.
It is not a replacement for the historical v2.8.5/P10 or v2.8.6/T6.1 chains.
The four finding contracts are: exact Dashboard Setup control plane/seed,
Task rows 1–2/50-column protection, schema-derived five-checkbox validation,
and narrow identity-empty Boolean `false` handling. S00–S80 may be preserved;
S90/S99 are the only intended resume stages. Real Workspace retest remains
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
`863217b99dfa1ad682a8f4dd1989212b0a8d548b` are the corrected additive chain.
T6.1 was normal-pushed, resolved from GitHub, and verified from a fresh clone
with all local/static checks passing. That is historical evidence only:
`PHASE8B-QUICK-DIAGNOSTIC-01` makes the current v2.8.7 source candidate
`PHASE8B_SANDBOX_NO_GO_QUICK_DIAGNOSTIC` until its own release, transfer,
publication, and fresh-clone evidence is complete. Real Workspace retest
remains `NOT_EXECUTED`.

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
- Corrected 2.8.6 package and T6.1 transfer directories are historical,
  verified additive outputs of Source A6, direct-child Release B6, normal
  publication, and fresh-clone verification; they are not the current target.
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
`PHASE8B-SETUP-01`.  Automation remains OFF; do not manually hide the Ledger,
continue P10 Setup, or run P10 diagnostics.  Preserve the failed workbook as
evidence and use the Japanese recovery guide after an explicitly approved
corrected-package retransfer.  Even a future
`READY_FOR_PHASE8B_SANDBOX_RETRANSFER` permits carriage only; it does not
approve real data, OAuth, Apps Script import, Setup, real Provider
configuration, deployment, Automation, triggers, Phase 8B PASS, Phase 8C GO,
production use, or pilot use.
