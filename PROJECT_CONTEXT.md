# Project Context

Last updated: 2026-07-28  
Project ID: `google-workspace-personal-work-os`  
Repository of record: `Tanukitsune-hub/GAS-Project-Schedule`  
Current candidate: Code `2.8.5-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`  
Publication gate: `NO-GO_REMOTE_PUBLICATION`

## Purpose

This repository contains the Google Apps Script implementation of a personal
work OS that derives Tasks from Gmail, keeps the task workflow in Google
Sheets, and uses Google Calendar only as a derived reconciliation target.
No production deployment, `clasp push`, credential, real Workspace identifier,
or real message content is part of this repository or this remediation.

## Canonical operating model

| Concern | Canonical source | Rule |
|---|---|---|
| Business workflow and user-visible state | Google Sheet `タスク一覧` | Users interact with the Task Sheet; it is not a recovery authority. |
| Technical integrity and recovery | Protected hidden `Task Authority Ledger` | A versioned two-slot ledger is the only authority for a current Task. |
| Calendar / outbox | Derived state | It is durable intent, never an authority source. |
| Repository source | This repository | Current implementation is under `implementation/GoogleSpreadsheet/`. |

The Task Sheet has exactly 50 canonical columns. The workbook contract is 11
Sheets in total, of which 5 are hidden. A missing, invalid, visible, or
unprotected ledger never causes a fallback to `authoritative_snapshot_json`, a
cell note, or a live raw row. It fails closed to isolation.

## Repository layout

- Canonical context: this file, `MASTER_PLAN.md`, `DECISIONS.md`, and
  `CURRENT_STATUS.md`.
- Authority design: `docs/TASK_AUTHORITY_PROTOCOL.md`.
- Implementation, tests, tools, source docs, and source visualization:
  `implementation/GoogleSpreadsheet/`.
- Candidate release artifacts only:
  `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/` and
  `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot-phase8c/`.
- Instructions and independent-audit inputs: `instructions/`.

No legacy `context-hub` path is a source, publication target, or sync target.

## GitHub handoff discipline

GitHub is the formal ChatGPT–Codex handoff medium. The detailed policy is
`CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md` and decision D-036. A task begins
from a saved instruction, is re-read from GitHub, and returns its evidence to
this same repository. Historical instructions are retained rather than
silently rewritten.

## Current boundary

The remediation candidate is being prepared for independent re-audit. Local
evidence alone does not permit `READY_FOR_INDEPENDENT_REAUDIT` until the
candidate has been fast-forward published, final Source/Release SHAs resolve
from GitHub, a fresh clone verifies them, and the P5 publication evidence is
recorded. Phase 8B GO/PASS, Phase 8C GO, production ready, and pilot ready are
not declared.
