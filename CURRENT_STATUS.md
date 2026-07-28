# Current Status

Last updated: 2026-07-28  
Candidate version: Code `2.8.5-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`  
Overall status: `NO-GO_REMOTE_PUBLICATION`  
Automation default: `OFF`  
Real Google Workspace execution: `NOT_EXECUTED`

## Provenance state

- Historic local Source A5: `9705def085b66b5e521c7ec93804c228eb60e7ba`
- Historic local Release B5: `753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf`
- Historic relation: B5 is the direct child of A5.
- Publication limitation: A5 is not an ancestor of the current GitHub branch
  tip, so it must not be force-pushed or rebased into the remote history.
- Required remedy: create a new linear corrected Source A5.1 / Release B5.1
  pair from the current remote tip, preserving A5/B5 and all user worktrees.

## Candidate implementation state

| Area | State |
|---|---|
| R4 authority protocol | Corrected source candidate in separate review worktree; historic ledger-hash compatibility and repeat isolation are covered. |
| Shared authority validation | Setup, diagnostics, Migration, writes, edit restore, Worker/Review/Calendar paths use fail-closed authority semantics. |
| Failure recovery | Two-slot `PREPARED` / `COMMITTED`, canonical JSON, bounded ledger reads, durable orphan/quarantine policy implemented locally. |
| Canonical schema | 11 Sheets / hidden 5 / `タスク一覧` 50 columns / ledger 21 columns. |
| Local tests | Final pre-Source run: 41/41 files PASS; 603 PASS / 0 FAIL / 11 explicitly skipped fake-runtime cases. |
| Static validation | `tools/validate_apps_script_v2.js`: 11/11 PASS; 22 `.gs` files validated. |
| Release candidate packages | Not generated from final Source A5.1 yet. |
| GitHub publication and fresh clone | Not executed. |

## Gate

`READY_FOR_INDEPENDENT_REAUDIT` is prohibited until all of the following are
evidenced: full local regression and static validation, release checksum/parity
and secret scan, normal non-force publication, remote resolution of final
Source/Release SHAs, and fresh-clone verification. This status document does
not declare Phase 8B GO/PASS, Phase 8C GO, production ready, or pilot ready.
