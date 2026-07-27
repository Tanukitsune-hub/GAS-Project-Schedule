# Round 4 Remediation Implementation Report

## Status and scope

| Item | Value |
|---|---|
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Code Version | `2.8.5-prepilot` |
| Schema Version | `2.6` |
| AI Schema Version | `2.0` |
| Migration Version | `3` |
| Automation default | `OFF` |
| Highest status | `READY_FOR_INDEPENDENT_REAUDIT` |
| Real Google Workspace execution | `NOT EXECUTED` |

This report records local implementation and package evidence for R4-01 through
R4-06.  It is not a declaration of Phase 8B GO/PASS, Phase 8C GO, production
readiness, or pilot readiness.

## R4 findings addressed

| Finding | Implementation and evidence |
|---|---|
| R4-01 | Replaced the unmarked `setValues` then `setNote` write with one visible Task-row `setValues` write inside a protected hidden `Task Authority Ledger` two-slot `PREPARED`/`COMMITTED` protocol.  Recovery re-reads durable state, promotes a persisted Task row, rolls back an unchanged row, and isolates ambiguity.  A blank first insert with no committed slot now discards only its empty `PREPARED` record and returns the original write failure so a retry remains possible. |
| R4-02 | `validateAuthority` is the common fail-closed trust boundary for Setup, Quick/Deep Diagnostic, Task write, Migration 3, edit restoration, Worker, Review, and Calendar paths.  `authoritative_snapshot_json` and notes are never fallback authority, and no live raw row silently seeds current authority. |
| R4-03 | Multi-row edit handling restores every valid peer from its own committed ledger slot while invalid rows are `QUARANTINED` or `UNRECOVERABLE`.  Operational Task reads exclude isolated rows, including Calendar intent recovery. |
| R4-04 | Task row 1 internal IDs and row 2 labels are restored from the canonical Schema 2.6 definition, including crossed header/data pastes.  Migration 3 recognizes only the independent Schema 2.5 legacy anchor and otherwise fails closed. |
| R4-05 | Added `docs/TASK_AUTHORITY_PROTOCOL.md` and the offline `visualizations/task_authority_protocol_v2_8_5.html`; the R4 test verifies version, schema, gate status, and authority-ledger metadata against canonical configuration. |
| R4-06 | The current rollback source is committed at `Archives/v2.8.4-prepilot_backup_before_v2.8.5-prepilot_2026-07-28/`.  The historic Round 3 report's claimed `Archives/v2.8.3-prepilot_backup_before_v2.8.4-prepilot_2026-07-27/` backup existed locally but was absent from GitHub.  This correction is recorded here without rewriting the historic Round 3 report. |

## Authority state model

The selected model is a protected hidden authority ledger with versioned Slot A
and Slot B snapshots.  The model was selected over a one-slot hidden ledger,
visible snapshot/note mirrors, and an append-only journal because it preserves a
known committed slot while one bounded new slot is `PREPARED`.

1. Validate the visible Task row against the active committed slot.
2. Write the inactive slot and transaction metadata as `PREPARED`.
3. Perform exactly one full visible Task-row write.
4. Promote to `COMMITTED` only after durable state proves the prepared row.
5. On failure, re-read the ledger and Task row. Promote, roll back, or isolate;
   retry a deterministic ledger transition at most once after a write exception.
6. A blank initial insert with no committed slot is the narrow exception: discard
   its empty prepared ledger record, leave the Task row empty, and propagate the
   original write error for retry.  It is not rebaselined or quarantined.
7. A missing, duplicate, malformed, mismatched, or ambiguous authority record is
   isolated and excluded from Worker, Review, and Calendar processing.

The complete failure-point matrix, including `PREPARED`, row write, `COMMITTED`,
recovery, rollback, and quarantine transitions, is in
`docs/TASK_AUTHORITY_PROTOCOL.md`.

Calendar reconcile intent remains a separate cross-Sheet durability boundary:
the Task intent is committed before Outbox enqueue.  If the Outbox write is
durable but exact-intent acknowledgement fails, the edit remains complete while
the marker is retained and reported for bounded recovery.  It is never reported
as a completed acknowledgement.

## Source and release provenance

### Source commit A5

| Field | Value |
|---|---|
| Local Source commit | `9705def085b66b5e521c7ec93804c228eb60e7ba` |
| Subject | `R4: source A5 authority recovery remediation` |
| Created | `2026-07-28T07:31:19+09:00` |
| Branch | `codex/r4-authority-protocol` |

Source A5 contains source, tests, tools, canonical documents, CHANGELOG,
visualization, authority design, Migration 3 support, and the current rollback
archive.  It deliberately excludes the new `release/v2.8.5-prepilot/`,
`release/v2.8.5-prepilot-phase8c/`, and this Round 4 report.

### Candidate packages generated from A5

| Package | Source commit | Payload | Package files | Canonical payload SHA-256 | TEST_MODE | Automation |
|---|---|---:|---:|---|---|---|
| `release/v2.8.5-prepilot/` | `9705def085b66b5e521c7ec93804c228eb60e7ba` | 23 | 27 | `c8dd595e48f27e1f7623c960201c1506fc7c7cd176f95965c68a633d611d1946` | `true` | `OFF` |
| `release/v2.8.5-prepilot-phase8c/` | `9705def085b66b5e521c7ec93804c228eb60e7ba` | 22 | 25 | `6d5d12091655704366a7bd3586dea1f1274a24f5837de179a306969072f78fcc` | `false` (audited config-only transform) | `OFF` |

The release content commit is represented inside each manifest as
`SELF (the Git commit containing this manifest)`, avoiding an impossible
self-referential commit-hash claim.  Release commit B5 contains only the two
candidate package directories and this report.

## Local validation evidence

| Check | Result |
|---|---|
| Full local test enumeration (`tests/*.js`) | 39 suites; 582 reported PASS cases; 0 failed suites |
| `tests/remediation_round4_test.js` | 20 PASS; 0 FAIL; real Workspace `NOT EXECUTED` |
| `tests/remediation_round3_test.js` | 25 PASS; 0 FAIL, including post-enqueue acknowledgement failure recovery |
| `tests/phase3_independent_test.js` | 34 PASS; 0 FAIL, including retry after failed initial Task insert |
| `node tools/validate_apps_script_v2.js` | 10/10 PASS; 22 `.gs` files; source secret scan PASS |
| PowerShell parser for four 2.8.5 build/verify scripts | 4/4 PASS |
| Phase 8B candidate build and verification | source parity, checksums, provenance, secret scan, Test Harness, Automation OFF: PASS |
| Phase 8C candidate build and verification | audited TEST_MODE transform, source parity, checksums, allow-lists, secret scan, Test Harness exclusion, Automation OFF: PASS |

The package scripts were invoked locally with
`powershell.exe -NoProfile -ExecutionPolicy Bypass -File ...` only because the
host blocked direct script execution.  This bypass was process-scoped; no system
execution-policy setting was changed.

## External boundaries and remaining work

- No deployment, `clasp push`, real Gmail/Calendar mutation, edit Trigger run,
  Sheet Protection verification, LockService verification, OAuth, Provider call,
  credential storage, Workspace ID/URL capture, or real user data processing was
  performed.
- The checkout used for this work had no configured Git remote.  Therefore no
  GitHub push or remote commit/PR evidence was performed from this environment.
- The remote publication and independent audit remain outstanding.  The highest
  status remains `READY_FOR_INDEPENDENT_REAUDIT`.
