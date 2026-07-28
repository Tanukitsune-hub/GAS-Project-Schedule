# Audit Remediation Round 4 — Implementation and Release Report

Date: 2026-07-28

## Scope and status at package generation

- Repository of record: `Tanukitsune-hub/GAS-Project-Schedule`
- Publication target: `codex/r4-authority-protocol`
- Code / Schema / AI Schema / Migration: `2.8.5-prepilot` / `2.6` / `2.0` / `3`
- Automation default: `OFF`
- Package-generation gate: `NO-GO_REMOTE_PUBLICATION`
- Real Google Workspace execution: `NOT_EXECUTED`

This report records a local release candidate only. It does not record a
deployment, `clasp push`, OAuth consent, Gmail mutation, Calendar CRUD,
installable-trigger event, LockService contention, or real provider call.

## Git lineage and correction boundary

Historic local commits were retained without rewrite:

| Role | SHA | Validation |
| --- | --- | --- |
| Historic Source A5 | `9705def085b66b5e521c7ec93804c228eb60e7ba` | exists locally |
| Historic Release B5 | `753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf` | exists locally; first parent is historic A5 |
| Remote correction base | `6082865d9b618eacb0470807787a37ff3aa5f11b` | observed target-branch tip before the corrective pair |
| Corrected Source A5.1 | `8ed0e198b2b7badeee03494bcf2f80e70e8cec59` | canonical source/docs/tests/tools only |
| Final corrected Source A5.2 | `ff658bacf1e85864e4008efa32863635e446d47d` | A5.1 plus a source-input-only package guard correction |
| This Release B5.2 | `SELF` | generated from final A5.2; resolved after commit/publication evidence |

The final release parent is `ff658bacf1e85864e4008efa32863635e446d47d`.
This Release commit contains only the two package directories below and this
report. Source, tests, tools, canonical documents, migration, design, matrix,
and visualization remain in the corrected Source commits.

## Canonical topology and metadata

- Canonical implementation root: `implementation/GoogleSpreadsheet/`
- Canonical package root: `implementation/GoogleSpreadsheet/release/`
- Root-level `apps-script-v2/`, `tests/`, `tools/`, `release/`, and Round 4
  report duplicates: absent from the corrected Source tree.
- Sheet contract: 11 total sheets, 6 user-facing sheets, 5 hidden management
  sheets, and 50 Task columns.
- Technical recovery authority: protected hidden `Task Authority Ledger` with
  a versioned two-slot `PREPARED` / `COMMITTED` protocol.
- Business/user-facing system of record: Google Sheets `タスク一覧`; an edit is
  business state only after the shared coordinator commits it to the ledger.
- Snapshot cells, legacy notes, and raw rows are not current runtime
  authority. A legacy note is limited to the strict Migration 3 anchor.

## Remediation delivered

R4-01 through R4-06 are implemented in the corrected source. The relevant
write paths use a single validator before repository indexing; they recover
from a durable ledger slot, classify non-authoritative rows, and exclude
quarantined/orphaned rows from Worker, Review, and Calendar selection.

- Ledger commits cover PREPARED write, visible row write, COMMITTED promotion,
  rollback/recovery, and quarantine for uncertain or invalid states.
- Canonical hashing normalizes objects and values; verified historical
  insertion-order ledger hashes are accepted only for existing protected
  payloads, then rewritten canonically on the next valid commit.
- Multi-row edit recovery restores valid peers even when another row is
  invalid. Repeated copied-row isolation reuses its detached `qrow_` record.
- Setup, diagnostics, migration, edit handling, and task routes share the
  fail-closed authority contract. Diagnostics stay read-only.
- Header/internal-ID restoration covers direct and crossed-paste edits without
  resetting Task data rows.
- Calendar intent remains durable through enqueue/ack failure boundaries;
  authority-excluded jobs use durable `CANCELLED` state and do not perform
  Calendar external I/O.
- Migration 3 uses bounded, checkpointed observation and does not silently
  seed current authority from a snapshot cell or live row.

The release-tool correction in A5.2 limits the clean-input guard to
`apps-script-v2` and `tools` (including templates). Generated package output
is deliberately excluded, so Phase 8B and Phase 8C packages can be built
sequentially from the same immutable Source commit without accepting source
drift.

## Round 3 backup correction and rollback position

The historic Round 3 report described a backup directory that was local-only;
it was not present on GitHub and is not represented as a GitHub rollback
source. This correction does not manufacture that missing historical artifact.

Runtime recovery uses a verified prior committed ledger generation. Operational
rollback is a deliberate, separately audited choice among a valid prior
ledger generation, an audited backup, or a fresh workbook copy; it is not an
automatic code downgrade or a re-trust of a visible row. The source tree also
contains the explicitly named v2.8.4-before-v2.8.5 archive for audit context;
it is not evidence that the absent Round 3 GitHub backup existed.

## Local verification before publication

| Check | Result |
| --- | --- |
| All `tests/*.js` | 41 test files PASS; 604 PASS / 0 FAIL / 11 explicit fake-runtime skips |
| Round 4 / Round 5 authority and fault injection | PASS |
| Remote publication static consistency | 8/8 PASS, including source boundary, module release path, and release diff allow-list |
| `tools/validate_apps_script_v2.js` | 11/11 PASS; 22 `.gs` files |
| PowerShell parser for four 2.8.5 release tools | 4/4 PASS |
| Source secret scan | PASS; reviewed synthetic fixtures only |
| Automation default | OFF |

The 11 skipped checks are explicit fake-runtime / real Workspace cases. They
are not elevated to a real Workspace pass.

## Release package provenance

Both packages were generated in a clean worktree at final Source A5.2 with
the same UTC build timestamp, `2026-07-28T01:59:07Z`.

| Candidate | Path | Payload / package files | Payload SHA-256 | Result |
| --- | --- | ---: | --- | --- |
| Phase 8B | `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/` | 23 / 27 | `2b0356b1e9c22a2e62642db036dae931d8dc8f0e6f875f6510b9520e4bbe3c71` | source parity, checksums, secret scan, provenance PASS; `TEST_MODE=true`; harness included |
| Phase 8C candidate | `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot-phase8c/` | 22 / 25 | `22686419fe675d6582e476cd3a6d14162640312a7eddb492d87fda2bd7206db3` | audited transform parity, checksums, scope/service allow-lists, secret scan, provenance PASS; `TEST_MODE=false`; harness excluded |

Each generated manifest records the canonical repository, exact Source A5.2
SHA, build timestamp, version contract, Automation OFF, package inventory,
payload hash, and `SELF` for its containing release commit. No manifest tries
to precompute this commit's final SHA.

## Publication prerequisites still required

Before the status may advance, the corrective pair must be published through a
normal non-force fast-forward update. The remote branch must resolve both final
Source and Release commits, and a fresh clone must rerun the local/static
tests, package checksum/parity/allow-list/secret scans, topology checks, and
provenance checks. Independent re-audit remains pending.
