# Project Context

Last updated: 2026-07-29
Project ID: `google-workspace-personal-work-os`
Repository of record: `Tanukitsune-hub/GAS-Project-Schedule`
Current candidate: Code `2.8.5-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
Publication gate: `READY_FOR_PHASE8B_SANDBOX_TRANSFER` for non-confidential Phase 8B carriage only

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

## Repository layout

- Canonical context: this file, `MASTER_PLAN.md`, `DECISIONS.md`, and
  `CURRENT_STATUS.md`.
- Authority design: `docs/TASK_AUTHORITY_PROTOCOL.md` and
  `docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`.
- Implementation, tests, tools, source docs, and visualizations:
  `implementation/GoogleSpreadsheet/`.
- Immutable R5 release packages only:
  `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/` and
  `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot-phase8c/`.
- Company-PC 8B-only transfer envelope (not part of the immutable package):
  `implementation/GoogleSpreadsheet/transfer/v2.8.5-prepilot/`.
- Instructions and audit inputs: `instructions/` and `audits/`.

No legacy `context-hub` path is a source, publication target, or sync target.

## GitHub handoff discipline

GitHub is the formal ChatGPT–Codex handoff medium. The detailed policy is
`CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md` and decision D-036. A task begins
from a saved instruction, is re-read from GitHub, and returns its evidence to
this repository. Historical instructions and reports are retained rather than
silently rewritten.

## Company-PC boundary

The transfer envelope is intentionally limited to the non-confidential Phase
8B package and is fixed at the independently verified P10 transfer reference.
Even then, it permits carriage only through a company-approved route; it does
not approve real data, OAuth, Apps Script import, Setup, real Provider
configuration, deployment, Automation, triggers, Phase 8B PASS, Phase 8C GO,
production use, or pilot use.
