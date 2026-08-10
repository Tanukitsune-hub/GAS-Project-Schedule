# Changelog

## 2.8.13-prepilot - 2026-08-10 Gmail body decode compatibility repair

- Normalize valid padded or unpadded Gmail API base64url body data to the
  explicit padding required by Apps Script `Utilities.base64DecodeWebSafe()`.
- Reject malformed alphabets, lengths, and padding with the existing fixed
  `E_GMAIL_BODY_DECODE` fail-closed boundary and no body or identifier leakage.
- Add strict local coverage for UTF-8 Japanese text, both padding widths,
  URL-safe alphabet bytes, malformed data, truncation, and attachment exclusion.
- Preserve Schema `2.6`, AI Schema `2.0`, Migration `3`, `TEST_MODE=true`, and
  Automation `OFF`.

## 2.8.12-prepilot - 2026-08-08 clean integration candidate

- Selectively integrated the final Code 2.8.11 product source on the exact
  Work 0002 starting main without donor merge commits or transfer artifacts.
- Added the locked non-Google validation workflow, deterministic Phase 8B/8C
  package tooling, canonical current-contract checks, and A12/B12 lineage gate.
- Set the active contract to Code `2.8.12-prepilot`, Schema `2.6`, AI Schema
  `2.0`, Migration `3`, Automation `OFF`, with no active transfer or deployment.
- Capped the candidate at `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`; real
  Workspace/runtime/provider behavior remains `NOT_EXECUTED`.

## 2.8.11-prepilot - 2026-07-31 T1-01 bounded Diagnostic summary visibility remediation

### 0004 documentation, validation, and transfer-boundary evidence

- Corrected active Company-PC operator wording to the fixed T11/v2.8.11
  boundary. Fixed T10 remains immutable historical old-byte/hash evidence
  only; it is not a current carriage source.
- Added a narrow canonical-document regression check for a contradictory
  active T10 reference, old gate, or v2.8.10 path, while preserving clearly
  labelled historical T10 evidence and the T11 manifest's old-hash baseline.
- No Apps Script executable source, `appsscript.json`, release package,
  transfer envelope, checksum, or fixed artifact changed. No Workspace or
  company-PC operation occurred.

### Fixed

- `PHASE8B-T1-01-DIAGNOSTIC-SUMMARY-01`: Quick/Deep Diagnostic detail JSON
  can be redacted and capped at the UI boundary, so aggregate status counts
  alone could not prove which WARN/FAIL checks were present. The candidate now
  emits a bounded summary before details with deterministic sorted unique IDs,
  completeness flags, counts, closed side-effect Booleans, Task 50-column and
  header states, and Ledger 21-column/hidden/protected/validator states.
- A list overflow, duplicate, malformed identifier, or absent canonical
  aggregate remains fail-closed (`REVIEW_REQUIRED` or `UNKNOWN`). Existing
  checks, warnings, details, redaction, cap behavior, and strict failures are
  retained unchanged.

### Added

- Local fake-runtime coverage for six synthetic WARN IDs, state-dependent
  warning reporting without raw details, legacy Dashboard/AI/Calendar warning
  retention, Task/Ledger aggregates, bounds overflow, UI ordering before
  capped detail, and the all-false Quick/Deep side-effect contract.
- This version does not run or authorize Setup, Dashboard refresh, Gmail,
  Calendar, trigger, properties, Automation, or another Tranche action.

## 2.8.10-prepilot - 2026-07-31 Dashboard write-visibility / module-skew remediation

### Fixed

- `PHASE8B-DASHBOARD-WRITE-VISIBILITY-01`: the v2.8.9 Setup-only
  normalizer wrote the exact 17×3 Dashboard system block and then performed a
  strict read in the same execution without first making queued Spreadsheet
  writes visible. The v2.8.10 contract requires one
  `SpreadsheetApp.flush()` after a write, reacquires a fresh exact Range, and
  verifies all 51 cells before S90 may continue.
- An unavailable flush API, fresh-Range/read failure, or a still-noncanonical
  post-flush read fails closed as
  `E_DASHBOARD_NUMBER_FORMAT_POSTCONDITION`. Safe Setup evidence is retained
  even if the subsequent read-only Quick Diagnostic throws, and is limited to
  a closed normalization state, write/flush/postcondition Booleans, checked
  cell count, and noncanonical count; it contains no locale, format strings,
  values, addresses, identifiers, or identities.
- `WorkOsConfig`, `WorkOsSetup`, and `WorkOsDashboard` now participate in one
  deterministic S90 module-contract check. A partial manual module replacement
  fails before the format write as `E_MODULE_VERSION_SKEW`.

### Added

- Buffered fake-runtime coverage queues format writes until flush, proves the
  historical no-flush sequence fails, verifies fresh-Range postconditions,
  and covers unavailable/failed/stale flush, fresh-Range acquisition,
  postcondition-read, and post-normalization Diagnostic failure paths.
- Module-skew and canonical-document consistency coverage, a v2.8.10 workflow
  visualization, and a non-sensitive repeated-finding incident/recovery note.

### Version and status

- Contract: Code `2.8.10-prepilot` / Schema `2.6` / AI Schema `2.0` /
  Migration `3`; `TEST_MODE=true` for Phase 8B and Automation default `OFF`.
- Source A10 contains source/tests/tools/canonical docs/specification/
  visualization/incident/recovery/changelog material only. Source A10,
  direct-child Release B10, fixed transfer T10, and evidence E10 remain
  `PENDING_A10`, `PENDING_B10`, `PENDING_T10`, and `PENDING_E10` at this
  source-edit stage.
- Source-boundary gate:
  `PHASE8B_SANDBOX_NO_GO_DASHBOARD_WRITE_VISIBILITY`. Real Workspace
  retransfer/retest remains `NOT_EXECUTED`.

## 2.8.9-prepilot - 2026-07-30 Phase 8B Dashboard number-format real-runtime remediation

### Fixed

- `PHASE8B-DASHBOARD-NUMBER-FORMAT-01`: the Dashboard inspection previously
  detected a noncanonical number format but Setup had no ownership-proven,
  deterministic way to establish it before S90. The exact 17×3 Dashboard
  system block now uses one configured plain-text contract.
- Normalization is restricted to Setup immediately before S90, only after the
  exact canonical schema, owner-proven sheet/header Protection, exact seed or
  owned/versioned block, and every non-format surface check are safe. Empty,
  ambiguous, foreign, or user-owned surfaces fail closed without a write.
- Quick and Deep Diagnostic remain read-only and require the canonical text
  format exactly. Blank, default, or arbitrary formats remain conflicts; the
  change does not broaden diagnostic acceptance.

### Added

- `phase8b_dashboard_number_format_real_runtime_test.js` has 12 native fake
  runtime cases: exact 51-cell pre-normalization detection, seed/owned/full
  state normalization, idempotence, Quick/Deep zero writes, foreign-surface
  rejection, outside-block preservation, explicit refresh preservation,
  S00–S80 resume invariants, and format API failure behavior.
- v2.8.9 source/release/transfer builders, verifier templates, safe incident
  and recovery guidance, and a v2.8.9 authority workflow visualization.

### Version and status

- Contract: Code `2.8.9-prepilot` / Schema `2.6` / AI Schema `2.0` /
  Migration `3`; `TEST_MODE=true` for Phase 8B and Automation default `OFF`.
- Source A9 contains source/tests/tools/canonical docs/visualization/incident/
  recovery only; it excludes v2.8.9 packages, release report, and transfer.
- Source-boundary gate:
  `PHASE8B_SANDBOX_NO_GO_DASHBOARD_NUMBER_FORMAT`. Real Workspace
  retransfer/retest remains `NOT_EXECUTED`.

## 2.8.8-prepilot - 2026-07-30 Phase 8B Dashboard surface real-runtime remediation

### Fixed

- `PHASE8B-DASHBOARD-01`: replaced the invalid
  `getEditors().length === 1` ownership assumption with internally proven
  Spreadsheet-owner/effective-user equality plus `Protection.canEdit()`.
  Both implicit-owner/no-explicit-editor and explicit-owner representations
  are accepted; Shared Drive / unavailable owner, different user, foreign or
  blank editors, domain edit, target audiences, warning-only, wrong/duplicate
  protections, unprotected ranges, and foreign range protections fail closed.
- Split the former Boolean `UNSAFE_DASHBOARD_SURFACE` path into closed safe
  reason/subreason enums and counts for Protection, named range, value,
  formula, validation, note, merge, hidden state, background, font, number
  format, and seed/marker contracts. No identity, content, address, ID, or URL
  is returned.
- Quick Diagnostic remains byte-for-byte read-only; Setup resume preserves
  S00–S80 resources, keeps S90/S99 incomplete on a real conflict, keeps
  Automation OFF, and creates no five-minute trigger.

### Added

- `phase8b_dashboard_surface_real_runtime_test.js` covers explicit and
  implicit owner representations, owner/effective-user mismatch, null owner,
  `canEdit=false`, foreign access, domain/audience/warning controls,
  wrong/duplicate/unprotected/overlapping protections, all surface conflict
  classes, exact seed/marker states, and byte-stable diagnostics.
- v2.8.8 release, Phase 8C, raw-Git-blob patch-manifest builders/verifiers,
  current visualization, safe incident record, and recovery guidance.

### Version and status

- Contract: Code `2.8.8-prepilot` / Schema `2.6` / AI Schema `2.0` /
  Migration `3`; `TEST_MODE=true` for Phase 8B and Automation default `OFF`.
- Source A8 contains source/tests/tools/canonical docs/visualization/incident/
  recovery only; it excludes v2.8.8 packages, release report, and transfer.
- Source-boundary gate:
  `PHASE8B_SANDBOX_NO_GO_DASHBOARD_SURFACE`. Real Workspace retransfer/retest
  remains `NOT_EXECUTED`.

## 2.8.7-prepilot - 2026-07-30 Phase 8B Quick Diagnostic real-runtime remediation

### Fixed

- `DASHBOARD_LAYOUT_OWNERSHIP`: Dashboard now recognizes only the exact
  Setup-owned sheet/header protection control plane and exact three-row
  pre-refresh seed. Equivalent native white background forms are accepted;
  foreign controls/data/formulas/notes/names/merges/hidden state/non-default
  formatting remain fail-closed.
- `TASK_PROTECTIONS`: the shared canonical header geometry is rows 1–2 across
  all 50 Task columns. Quick Diagnostic detects wrong range, access policy,
  or duplicate protection.
- `BLANK_ROW_BOOLEAN_VALUES`: identity-empty rows may retain only canonical
  checkbox Boolean `false` materialized by Sheets; `true`, string Boolean,
  non-checkbox data, and partial identity still fail closed.
- `TASK_VALIDATION_TYPES`: all checkbox expectations derive from the schema
  validation plan, including hidden `calendar_reconcile_required`.

### Added

- `phase8b_quick_diagnostic_real_runtime_test.js` reproduces S20/S30/S40
  local runtime state and verifies the four findings plus negative
  control-plane/data cases with no Quick Diagnostic writes.
- Setup visibility regression now proves S00–S80/S90–S99 resume preserves
  synthetic Gmail-label, Calendar, and edit-trigger resources and keeps
  Automation/time-trigger creation OFF.
- v2.8.7 release/verifier and raw-Git-blob company-PC patch-manifest tools;
  canonical configuration-owned Dashboard legacy seed rows; a current
  workflow visualization and safe incident/recovery guidance.

### Version and status

- Contract: Code `2.8.7-prepilot` / Schema `2.6` / AI Schema `2.0` /
  Migration `3`; Automation default remains `OFF`.
- Source A7 `be2e551da310a9b7c0611f3aef8899309a3d7b69` is source/tests/tools/
  canonical-docs/visualization/incident/recovery guidance only. Direct-child
  Release B7 `95bc7240d99124b245e188b8e646eccf6c3ead48` contains the generated
  packages/report; C7 `ba175d3994c86dacc76bad3537df97e3e644dc09` changes only
  the manifest verifier; fixed T7 `008c643b85c6b234ad489d946033cb9c06d32920`
  contains the transfer envelope and raw-byte patch manifest.
- Current gate is `READY_FOR_PHASE8B_SANDBOX_RETRANSFER` for controlled
  carriage only. Real Google Workspace retransfer/retest is `NOT_EXECUTED`;
  Automation remains `OFF`.

## 2.8.6-prepilot - 2026-07-29 Phase 8B Setup Ledger visibility remediation

### Fixed

- `PHASE8B-SETUP-01`: a historical P10 first-time Setup applied Ledger schema
  and then invoked strict authority validation before S30 made the Ledger
  hidden. It stopped safely with `E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN` at
  `TASK_AUTHORITY`, with only S00/S10 complete.
- S20 now uses an explicit Setup-owned, idempotent control-plane operation to
  establish canonical Ledger protection and hidden visibility before authority
  validation. Protection/visibility write failures remain deterministic and do
  not persist S20 completion.
- S30 and completed-Setup reruns reassert the same control plane before their
  relevant authority validation. The validator was not weakened and no generic
  repair path was added to diagnostics, Worker, Review, Calendar, Migration, or
  edit restoration.

### Added

- `phase8b_setup_ledger_visibility_test.js` covers a fresh empty workbook, the
  observed S00/S10 partial resume, visibility/protection failure injection,
  S30 reassertion, completed rerun idempotence, fake hidden/protection behavior,
  and no snapshot/note/raw-row fallback.

### Version and status

- Contract: Code `2.8.6-prepilot` / Schema `2.6` / AI Schema `2.0` /
  Migration `3`; Automation default remains `OFF`.
- The package-generation gate was `PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER`. The
  failed P10 v2.8.5 package and transfer evidence are immutable historical
  evidence and are not executable. Corrected-package real Workspace retest is
  `NOT_EXECUTED`.
- Source A6, direct-child Release B6, and the T6.1 fresh-clone proof now
  establish `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`. It permits carriage only;
  it is not Phase 8B PASS, Phase 8C GO, production ready, or pilot ready.

## 2.8.5-prepilot - 2026-07-29 R5 follow-up source correction

### Fixed

- An outstanding `DEADLINE_CALENDAR_AUTHORITY_COMPENSATION` record can no
  longer be erased by a later Task edit or `force_enqueue`. The compensation
  target, deterministic Event ID, and due state remain durable until the
  owned-event-only cleanup reaches a safe terminal result.
- Compensation is claimed and revalidated as compensation even if a Task later
  becomes authority-valid. Its commit CAS intentionally covers the Outbox but
  not a changing Task, because the cleanup never writes a Task patch.

### Added

- F016 regression for an authority-valid, ineligible forced re-enqueue while
  an owned Event compensation is pending. It proves that the record is not
  rewritten to normal `NOOP` / `DONE`, the Event is deleted exactly once, and
  the reappeared Task is not patched by compensation.

### Version and status

- The contract remains Code `2.8.5-prepilot` / Schema `2.6` / AI Schema `2.0`
  / Migration `3`. This is a durability correction requiring a new source and
  release provenance pair; it does not change the schema or Migration.

## 2.8.5-prepilot - 2026-07-29 corrective source candidate

### Fixed

- Calendar reconciliation now takes a short lock-held final read through the
  shared Task Authority Ledger validator immediately before external Calendar
  I/O. An authority-excluded job is durably `CANCELLED` with no Calendar call.
- Before Calendar I/O, the Outbox records
  `DEADLINE_CALENDAR_ARMED`, a deterministic Event ID, and the claim
  fingerprint. The arm survives crash recovery and concurrent re-enqueue so
  external-I/O intent cannot be inferred from an error string or erased by a
  competing Task edit.
- If authority is lost after the arm or I/O, the worker schedules
  `DEADLINE_CALENDAR_AUTHORITY_COMPENSATION`. It never patches the excluded
  Task and deletes only a deterministic Event that passes the existing
  ownership check. Foreign Events are retained and fail closed.

### Added

- F016 local fault injection for authority loss before I/O, loss after the
  final revalidation, crash after create before commit, concurrent
  ineligibility, foreign-event refusal, and manual-retry target preservation.
- The Calendar authority-loss protocol design memo and visualization coverage.

### Version and status

- The contract remains Code `2.8.5-prepilot` / Schema `2.6` / AI Schema `2.0`
  / Migration `3`; this is a corrective source revision, not a schema or
  migration change.
- Source-candidate gate remains `NO-GO_REMOTE_PUBLICATION` until a separately
  generated Release commit, normal publication, fresh-clone verification, and
  the independent re-audit evidence are complete. Real Google Workspace
  execution remains `NOT_EXECUTED`.

## 2.8.5-prepilot - 2026-07-28

### Fixed

- R4-01: replaced the unmarked Task `setValues` then `setNote` authority
  double-write with a protected hidden `Task Authority Ledger` and a
  versioned two-slot protocol.  A write records `PREPARED`, performs one full
  visible Task-row write, and only then promotes `COMMITTED`; interruption
  recovery deterministically promotes, rolls back, or isolates the row.  A
  failed first insert that leaves both the Task row and the prior committed slot
  blank discards only its empty PREPARED record, returns the original failure,
  and remains retryable rather than being quarantined.
- R4-02: removed snapshot-cell and note fallback authority.  Setup, Quick
  Diagnostic, Deep Diagnostic, Task writes, Migration 3, edit restoration,
  Worker reads, Review and Calendar use the shared fail-closed authority
  validator.  Live raw rows and user-edited snapshot projections cannot seed
  current authority.
- R4-03: multi-row restoration now preserves every valid peer from its own
  committed ledger slot even if another row is invalid.  Missing, copied,
  duplicate, corrupt, or ambiguous authority is quarantined with a safe reason
  code and excluded from operational Task consumers.
- R4-04: Task rows 1 and 2 restore canonical internal IDs and headers after
  direct or crossed-paste edits.  Schema 2.6 adds authority generation, hash,
  and state columns; Migration 3 normalizes the hidden ledger before row work.
- R4-05: added the current authority protocol design memo and offline workflow
  visualization with canonical version/status metadata.
- R4-06: records the Round 3 backup correction: the historic backup was
  local-only and did not exist in GitHub.  Round 4 source/release provenance
  remains split into A5 source and B5 release boundaries.
- Calendar-intent acknowledgement now remains failure-recoverable after a
  durable Outbox enqueue: a failed Task acknowledgement is counted as pending
  recovery, retains the exact intent marker, and never reports a false
  acknowledgement.

### Added

- `docs/TASK_AUTHORITY_PROTOCOL.md` with alternative analysis and
  PREPARED/COMMITTED/recovery/rollback/quarantine fault matrix.
- `visualizations/task_authority_protocol_v2_8_5.html`, a dependency-free
  authority workflow visualization.
- R4 local fault-injection and static provenance coverage for ledger failures,
  first-insert rollback/retry, no-fallback behavior, quarantine, header
  restoration, Calendar acknowledgement recovery, and canonical metadata.

### Version and validation

- Code/Schema/AI Schema/Migration: `2.8.5-prepilot` / `2.6` / `2.0` / `3`.
- Automation default remains OFF; no deployment or `clasp push` is performed.
- Final source-candidate regression/static run: 41/41 test files PASS; 604
  PASS / 0 FAIL / 11 explicit fake-runtime skips; static validation passed
  11/11 checks over 22 `.gs` files. Package validation is recorded only after
  corrected Source A5.1 exists and packages are generated from that exact SHA.
  Real Google Workspace behavior remains `NOT EXECUTED`.
- R5 publication-consistency corrections add canonical JSON ordering,
  validator-before-indexing, bounded ledger reads, durable orphan handling,
  Calendar exclusion, and bounded Migration observation/reconciliation.
- Existing Schema 2.6 ledger slots with the historical insertion-order hash
  remain valid only after verification against that protected ledger payload;
  the next committed generation uses canonical hashing. This is a migration
  compatibility path, never a visible-row or snapshot-cell fallback.
- Repeated copied-row isolation reuses its detached `qrow_` authority record,
  and an exposed ledger protection editor list now fails closed unless it
  contains only the effective user.
- Authority-excluded Calendar jobs now use the durable `CANCELLED` outbox
  state, which is accepted by the outbox reader and remains outside Calendar
  external I/O.
- The Phase 8B and 8C builders guard the actual immutable package inputs
  (`apps-script-v2` and release tools/templates), while deliberately excluding
  their generated `release/` output. This permits both packages to be built
  sequentially from one clean Source commit without allowing source drift.
- Current source-candidate status is `NO-GO_REMOTE_PUBLICATION` until normal
  publication, remote SHA resolution, and fresh-clone verification. No Phase
  8B GO/PASS, Phase 8C GO, production-ready, or pilot-ready declaration is
  made.

## 2.8.4-prepilot - 2026-07-27

### Fixed

- R3-01: management列を1列でも含むeditはevent全体を拒否し、対象全行の
  全47列をtrusted authoritative stateへ復元する。snapshot cellのprotected
  full-row stateとnote mirrorを相互検証し、snapshot改変、mixed/multi-row/
  20行超paste、blank row、corrupt batchをfail closedかつpartial writeなしで
  処理する。
- R3-02: Schema 2.3の初回snapshot構築、Schema 2.4の旧snapshot trust
  anchor、Schema 2.5のstrict current validationを分離した。Setupはsnapshot
  欠落、不正JSON、Task ID／Schema不一致、live business driftをsilent
  rebaselineせず、最初のmutation前に停止する。2.4→2.5 migrationはbounded、
  resumable、idempotent、data-preservingである。
- R3-03: physical CAS用`row_version`とReview conflict用`business_version`を
  分離した。Calendar metadataとsync timestampだけのsystem updateはbusiness
  guardを変えず、human business/manual-field driftはACCEPTをfail closedにする。
- R3-04: Calendar関連Task editと同時に
  `calendar_reconcile_required`／`calendar_intent_version`をdurable commitし、
  Outbox enqueue後だけexact intent versionでacknowledgeする。Outbox欠落、
  append失敗、Lock timeout、enqueue直後crash、NOOP retryからbounded recovery
  でき、create/update/delete/no-opを重複なく再構築する。
- R3-05: `選択したReviewを再stage`を追加し、1行selection、open
  `EXISTING_CHANGE` Review、confirmation、target identity、business guard、
  pending payloadのLock下再検証を必須とした。automatic restageは行わない。
- R3-06: GitHub正本を`Tanukitsune-hub/GAS-Project-Schedule`だけへ統一し、
  canonical文書の旧Repository役割分担Decisionを置換した。
- R3-07: Source／tests／tools／canonical docs／CHANGELOGのCommit Aと、
  Commit Aから生成するrelease package／実装報告のCommit Bを分離する。
  manifestはRepository、実在Source commit、manifest自身を含むrelease content
  commit、生成日時、TEST_MODE、Automation状態を記録する。
- P2 policy: 手動Gmail候補をThread間と同一Thread内の両方で、受信時刻の古い
  未処理exact Messageから進める。

### Added

- Task管理列`business_version`、`calendar_reconcile_required`、
  `calendar_intent_version`。Task Schemaは47列。
- Round 3専用のmanagement restore、Setup/Migration、Review guard、
  Calendar durability、explicit restage、oldest-first Gmail回帰test。
- `tools/v2_8_4/`と2.8.4用の決定的build／verify scripts。
- `release/v2.8.4-prepilot/`と
  `release/v2.8.4-prepilot-phase8c/`の生成契約。

### Version and validation

- Code/Schema/AI Schema/Migration:
  `2.8.4-prepilot` / `2.5` / `2.0` / `2`.
- Pre-fix reproduction:
  Round 3 `2 PASS / 15 FAIL`、Schema `8 PASS / 5 FAIL`、
  Gmail policy `11 PASS / 1 FAIL`。
- Post-fix targeted:
  Round 3 `25 PASS / 0 FAIL`、Schema `17 PASS / 0 FAIL`、
  Gmail policy `13 PASS / 0 FAIL`。
- Full local regression: 38 suites,
  `556 PASS / 0 FAIL / 11 SKIPPED`; SKIPPEDは実Providerおよび実Google
  Workspace項目で、local PASSへ昇格していない。
- Static Apps Script validation: `10 PASS / 0 FAIL`。22個別`.gs`構文、
  連結構文、global evaluation、top-level duplicate、Config参照、
  namespace、append path、simple onEdit、secret scanを含む。
- Release statusの最上位は`READY_FOR_INDEPENDENT_REAUDIT`。Phase 8B
  GO/PASS、Phase 8C GO、Pilot readyは宣言しない。

## 2.8.3-prepilot - 2026-07-27

### Fixed

- R-01: added a persistent Task-row authoritative snapshot and two-phase
  manual-edit planning. Invalid checkbox/date/enum edits, multi-cell and
  multi-row pastes, and edits over the 20-row handler limit are restored
  before returning; rejected edits do not change version or timestamp.
- R-02: a real manual value change now increments `row_version` and
  `updated_at` on every edit, even when `manual_fields` already contains the
  field. Review notes, Calendar reconciliation, and a payload-free Run History
  audit are updated only for committed edits.
- R-03: same-row `EXISTING_CHANGE` acceptance now validates the live target,
  staged row version, current staged values, manual-field set, and open Review
  state. Conflicts restore Decision to `NONE`, preserve human values, refresh
  the note, and require explicit `restagePendingChange`.
- R-04: manual Gmail selection now suppresses completion by exact Message ID,
  advances to the next older exact `手動/取込` Message in the same Thread, keeps
  `手動/除外` thread-wide, and excludes messages after the selected Message
  from context.
- R-05: Schema 2.2/2.3 Setup reruns migrate to Schema 2.4 before strict
  integrity checks, refresh the exact Validation lists and owner-only
  Protection geometry idempotently, and extend Task/Errors controls past 100
  rows without changing existing data.

### Added

- `authoritative_snapshot_json` as the 44th protected Task column.
- Schema 2.4 / Migration 1 append-only, resumable snapshot migration.
- Round 2 pre-fix reproductions and post-fix regression coverage.
- Deterministic packages `release/v2.8.3-prepilot/` and
  `release/v2.8.3-prepilot-phase8c/`.
- `AUDIT_REMEDIATION_ROUND2_IMPLEMENTATION_REPORT.md` and repeatable 2.8.3
  build/verification scripts.

### Version and validation

- Code/Schema/AI Schema/Migration:
  `2.8.3-prepilot` / `2.4` / `2.0` / `1`.
- Pre-fix reproductions:
  Phase 3 `45 PASS / 3 FAIL`, Phase 2 `29 PASS / 1 FAIL`, Phase 1 audit
  `25 PASS / 1 FAIL`.
- Post-fix local regression: 36 suites,
  `509 PASS / 0 FAIL / 11 SKIPPED`; SKIPPED items remain real Provider and
  real Google Workspace checks.
- Static Apps Script validation: `10 PASS / 0 FAIL`, including 22 individual
  `.gs` syntax checks, concatenated syntax, global evaluation, symbol/config/
  namespace checks, and source secret scan.
- Phase 8B: 23 payload / 27 package files, exact source parity, checksums and
  secret scan PASS; canonical payload SHA-256
  `423d4f6937c21909c1f88c6e81e264887611782aae98c3b6d3b2668443937f7a`.
- Phase 8C candidate: 22 payload / 25 package files, parity except the audited
  `TEST_MODE` transform, exact 7-scope and Advanced Service allow-lists,
  Test Harness/`.clasp.json` exclusion, checksums and secret scan PASS;
  canonical payload SHA-256
  `5bbd3bc12c11b2463279352105cd97a0fe788b69055fd75a0b15f1b689c87e56`.
- Real Provider, OAuth, Gmail/Calendar mutation, installable Trigger,
  LockService contention, and real Workspace runtime: `NOT EXECUTED`.
- Release status: `READY_FOR_INDEPENDENT_REAUDIT`; this is not a Phase 8B
  Part D GO/PASS or a Phase 8C approval.

## 2.8.2-prepilot - 2026-07-26

### Fixed

- F-01: corrected the automatic Calendar job-limit constant and made invalid
  limits fail closed without leaving the worker at the Calendar checkpoint.
- F-02/F-03: made `UPDATE_DUE` and manual due edits update `due_date`,
  `deadline_basis` and `suggested_due_date` as one unit; added the
  `MANUAL_CONFIRMED` deadline provenance and Calendar eligibility.
- F-04/F-05: added exact target ID/version/resolution checkpoints, Review-row
  and target-row CAS, pending conflict checks, and fail-closed unresolved
  target handling. Invalid decisions on normal, terminal or already-applied
  rows are reverted without changing business state.
- F-06: added Task status/completed/excluded/waiting/Review/pending
  cross-field invariant validation at repository write boundaries.
- F-07: manual Gmail import now selects the exact Message carrying
  `手動/取込`; thread exclusion remains higher priority.
- F-08: non-editable Review notes summarize action, current/new values,
  deadline basis, manual conflict and past-due warnings without raw payload,
  ID, URL or message content, and clear after decision.
- F-09: centralized `TEST_MODE` guards for Mock adapters, transports, public
  test entrypoints, test mutation and menu items; production mode has no
  implicit Mock fallback.
- F-10: owner-only Sheet protection now covers Dashboard, Run History and
  Guide, while Errors exposes only `retry_requested`; 100+ row expansion
  extends only the operator surface. Dashboard recognizes only its exact
  owned protection and rejects foreign protection.
- F-11/F-12: RELATIVE deadlines require accepted human Review before Calendar
  eligibility, including FORCE mode; Quick Diagnostic reports Mock local
  readiness separately from production configuration, policy and auth.
- F-13: Calendar Event deadline-basis labels use the existing Japanese Sheet
  enum mapping.

### Added

- P0/P1 regression coverage, including pre-fix reproductions, TEST_MODE=false
  direct invocation, exact Message selection, Review CAS/invariants,
  Protection geometry, RELATIVE deadline gating, and diagnostic separation.
- Deterministic Phase 8B package `release/v2.8.2-prepilot/`.
- Separate Phase 8C candidate package
  `release/v2.8.2-prepilot-phase8c/`, with `TEST_MODE=false` and
  `99_TestHarness.gs` excluded.
- `AUDIT_REMEDIATION_IMPLEMENTATION_REPORT.md` and repeatable release/static
  validation scripts.

### Version and validation

- Code/Schema/AI Schema/Migration:
  `2.8.2-prepilot` / `2.3` / `2.0` / `0`.
- Existing Schema `2.2` Message State rows are explicitly accepted and
  upgraded to `2.3` without changing classification data.
- Full local regression: 36 suites,
  `501 PASS / 0 FAIL / 11 SKIPPED`; SKIPPED items remain real Provider and
  real Google Workspace checks.
- 22 individual `.gs` syntax checks, concatenated syntax, global evaluation,
  top-level symbol, Config reference and WorkOs namespace checks: PASS.
- Phase 8B package: 23 payload files / 27 total files, exact source parity,
  checksums and secret scan PASS; canonical payload SHA-256
  `ef857fec7dad9401c07b482e41b40897609f8fc64cb0a87fcb9cb9d6c69e3f4b`.
- Phase 8C package: 22 payload files / 25 total files, exact parity except the
  audited `TEST_MODE` transform, Test Harness exclusion, checksums and secret
  scan PASS; canonical payload SHA-256
  `9b87abaa00c367f0cf56cdac6f1c16f5b678877612714fc81d1dea4da5255e5c`.
- Real Provider, OAuth, Gmail/Calendar mutation, Trigger lifecycle,
  LockService contention and real Workspace runtime remain `NOT EXECUTED`.

## Phase 8A Sandbox preparation - 2026-07-26

### Added

- Deterministic `release/v2.8.1-prepilot/` package generated from the exact
  22 Apps Script source files and `appsscript.json`.
- Deployment manifest with version, mode, source status, exact payload
  hashes, OAuth scopes, Advanced Services and unresolved external boundaries.
- Package-wide `CHECKSUMS.sha256`, a read-only package validator and
  TEST_MODE=true Sandbox Quickstart.
- Ordered Part A-L Manual Acceptance Guide and a redaction-safe Sandbox
  acceptance-results template.

### Validation

- Source/package SHA-256 parity: 23/23 PASS.
- Package inventory and checksums: 26 files, 25 checksum records, PASS.
- Actual-secret, real-resource URL, Windows absolute-path and prohibited-file
  scan: 0 findings. Three exact synthetic credential fixtures remain confined
  to `99_TestHarness.gs` and are reported separately.
- Full local regression: 34 suites, `471 PASS / 0 FAIL / 11 SKIPPED`;
  Apps Script syntax: `22 PASS / 0 FAIL`.
- Real Google Workspace, OAuth consent, Gmail/Calendar operations, real
  Provider connection, TEST_MODE=false and real-work pilot remain
  `NOT EXECUTED`.

### Release boundary

- Apps Script Code/Schema/AI Schema/Migration versions remain
  `2.8.1-prepilot` / `2.2` / `2.0` / `0`; no product source was changed for
  Phase 8A.
- Git closeout was not executed in the Codex environment after an
  `.git/index.lock` permission denial; repository Git identity is also not
  configured. No push or PR was attempted.
- Phase 8B and later work was not started.

## 2.8.1-prepilot - 2026-07-25

### Fixed

- Moved Gmail reads/searches, AI classification, Gmail label writes and
  Calendar API work outside long-held Script Lock sections. Durable Message
  and Calendar claims, ownership tokens, Task `row_version`, fingerprints,
  checkpoints and re-lock CAS checks reject stale results.
- Connected transient production-classification failures to bounded,
  run-idempotent Provider suppression accounting and ensured automatic run
  outcomes are written once to Run History.
- Made Dashboard refresh fail closed when blank-key rows contain values,
  formulas, notes, validation, merges, protections or other foreign layout
  state. System rows now require an exact owned block marker.
- Restored System Retry gating and one-per-run Error context reuse after the
  Worker lock split.
- Compared Message State Date cells by milliseconds so same-second checkpoint
  changes cannot be lost by string comparison.
- On a post-Calendar-I/O CAS conflict, preserve user edits and convert the
  observed Event state into a fresh current-Task reconciliation checkpoint.
  A concurrent exclusion/completion can therefore schedule compensation
  DELETE instead of leaving an orphan Event. Standalone runs report the
  conflict as `PAUSED`, not as a false success.

### Validation additions

- Direct `E_DASHBOARD_LAYOUT_CONFLICT` negative tests.
- Physical-lock boundary tests for Gmail/AI/label operations.
- Provider suppression, Run History, idempotency and secret-containment tests.
- Failure-injection tests for claim loss, stage advance, Task `row_version`,
  input-hash change, competing Workers, and Calendar CREATE success followed
  by Task/Outbox mutation. The ineligible-Task case verifies compensation
  DELETE and no duplicate/orphan Event.
- Full local regression: 34 suites, `471 PASS / 0 FAIL / 11 SKIPPED`.
- Real Provider and Google Workspace validation remain `NOT EXECUTED`;
  `TEST_MODE=true`, automation default OFF, Schema `2.2`, AI Schema `2.0` and
  Migration `0` are unchanged.

## 2.8.0-prepilot - 2026-07-25

### Added

- Empty fail-closed production AI provider registry/factory boundary, opaque
  credential reference validation, lock-free classification transport stage,
  and re-lock CAS commit.
- Automatic Gmail policy with `手動/除外` precedence, Message-scoped
  `手動/取込` priority, system/promotions/social filtering, bounded call meter,
  and safe filter/call metrics.
- Owner installable Task edit Trigger with canonical source/UID checks and
  selected-range menu fallback.
- `19_RuntimeSettings.gs` typed once-per-run Settings snapshot and shared
  read-only current-state preflight.
- `15_Dashboard.gs` explicit-refresh lightweight operations Dashboard with 17
  count/status/time metrics and no content or raw external identifiers.
- High-confidence credential redaction at AI, Task, Calendar, error and result
  sinks.
- Setup-wide budget propagation, Calendar pagination ceiling/token guard, and
  stage-aware Setup/Continue consent.
- Five remediation local suites for AI, Gmail, credential containment, edit
  Trigger, Runtime/Dashboard/reliability boundaries.

### Changed

- Code Version advanced from `2.7.0-phase7` to `2.8.0-prepilot`; physical
  Schema remains `2.2`, AI Schema `2.0`, and Migration `0`.
- Settings seed is versioned. Only `auto_max_messages`,
  `manual_soft_limit_sec`, and `auto_soft_limit_sec` remain editable; Setup
  rerun preserves those values and unrelated user rows.
- S80 now creates only the Task edit Trigger. Setup never creates the
  five-minute production Trigger and automation remains initially stopped.
- S99 now reports local Phase 7 completion with external validation pending.
- Guide, README, traceability, final audit and remediation plan now reflect the
  final audit remediation boundary.

### External validation boundary

- Real Provider connection, real Gmail/Calendar, real installable/time-driven
  Trigger events, real Apps Script duration/quota/UI and real credential
  handling remain `NOT EXECUTED`.
- Provider, model, endpoint, authentication, company approval and credential
  storage approval remain undecided/not confirmed; no guessed implementation,
  `UrlFetchApp`, or external-request scope was added.
- Git baseline/branch/logical commits were not created because the managed
  environment denied `.git` writes. Push and PR were not attempted.

### Validation

- Full local Regression: 29 suites, `444 PASS / 0 FAIL / 11 SKIPPED`.
- Apps Script `.gs` syntax: `22 PASS / 0 FAIL`.
- Remediation suites: `55 PASS / 0 FAIL` across AI, Gmail, credential,
  edit-trigger and Runtime/Dashboard/reliability boundaries.
- The 11 skipped Harness cases and all real Provider/Workspace checks remain
  external `NOT EXECUTED`, not PASS.

## 2.7.0-phase7 - 2026-07-24

### Added

- Exact Phase 7 recovery contracts for 14 subsystems and six durable checkpoint stages.
- Initial attempt plus 5/15/60-minute retries, maximum four attempts, due-first scheduling, stale-claim handling, and bounded provider-wide retry suppression.
- Allowlist-only Error/Dead Letter records with one-way message/thread references, exact recovery metadata, stable per-subsystem upsert, resolution, and aggregate counts.
- Manual Dead Letter retry by internal `err_`/`dl_` identifier, with Script Lock, maximum five selected rows, prerequisite checks, non-retryable refusal, checkpoint validation, and idempotent `RETRY_QUEUED`.
- Read-only recovery state in Quick Diagnostic and a separate manual read-only Deep Diagnostic.
- Append-only recognized-v2 Error Sheet extension from Schema `2.1` to `2.2`.
- Phase 7 local, schema, Worker recovery integration, Apps Script harness, security, and performance/reliability suites.

### Safety and reliability

- Error rows never retain raw Gmail identifiers, body, subject, sender, AI request/response payload, credential, token, stack trace, or internal URL.
- The Worker performs no Dashboard refresh or layout repair. Diagnostics perform no retry, external request, Trigger mutation, Calendar sync, or Task rewrite.
- Provider, endpoint, model, auth, company approval, and credential storage remain unresolved; no `UrlFetchApp` or external-request scope was added.
- Calendar retryability is preserved when an exhausted transient Outbox item becomes DEAD, so controlled manual recovery is possible without rerunning AI or duplicating Task/Event effects.
- Existing non-retryable Dead Letters remain non-retryable across later checkpoint observations.
- Provider-wide suppression defers both `PREPROCESS` and `CLASSIFY` backlog while allowing provider-independent checkpoints to resume.
- One Error Sheet context is reused per Worker run and selected manual-retry batch; Quick/Deep recovery scans read in budget-checked chunks, and Deep enforces its configured sample limit.
- A shared full Error context records newly inserted 100-row capacity immediately, preventing a second write in the same run from adding another unnecessary block.
- Quick Diagnostic uses a local diagnostic-only automation status and cannot invoke Gmail label readiness or construct a production AI Adapter.
- Legacy v2 Error extension rehashes noncanonical message/thread references and permits manual retry only for exhausted transient rows.
- Message-less `GMAIL_SEARCH`/`STATE_WRITE` system failures use the same due schedule, stop at DEAD, support controlled internal-ID manual retry, and resolve only after a successful system operation.
- Gmail-search success resolves only `GMAIL_SEARCH`; post-search checkpoint/property failures remain `STATE_WRITE` until every durable state write completes, so attempts cannot reset before DEAD.

### Validation

- Phase 7 retry/Dead Letter local and Calendar recovery: 18 PASS / 0 FAIL.
- Phase 7 Worker recovery integration: 11 PASS / 0 FAIL.
- Phase 7 v2.2 Schema extension: 8 PASS / 0 FAIL.
- Phase 7 Apps Script harness: 8 PASS / 0 FAIL / 2 real-Workspace cases SKIPPED.
- Phase 7 security static: 10 PASS / 0 FAIL.
- Phase 7 performance/reliability static: 10 PASS / 0 FAIL.
- Full local Regression: 24 suites, 384 PASS / 0 FAIL / 10 external cases SKIPPED.
- Apps Script syntax: 20/20 PASS.
- Final independent QA, security, and Apps Script performance/reliability re-reviews report 0 open Critical/High/Medium/Low findings.
- Real Provider, Trigger, Gmail, Calendar recovery, Diagnostic runtime, Lock contention, and quota behavior: `NOT EXECUTED`.

## 2.6.0-phase6 - 2026-07-24

### Added

- Explicit Phase 6 automation API: status, enable, disable, single-Trigger enforcement, duplicate cleanup, and scheduled entry point.
- Bounded normal-Inbox discovery with a 24-hour overlap, fixed cycle upper bound, 25 Threads/page, 100 Threads/search, and 10 Messages/run.
- Durable scan upper/page cursor, Message ID deduplication, due-retry-first scheduling, one shared processing Lock, one in-memory Message/Task/Outbox context per run, and a 210-second soft budget.
- Phase 6 local, Worker integration, Apps Script harness, and performance/reliability suites.

### Safety and reliability

- Setup keeps automation disabled and creates no Trigger. Production enable remains fail-closed because Provider, approval, credential storage, authentication, and real transport are not configured.
- Only a stored canonical CLOCK Trigger can invoke the Worker. Missing/mismatched trigger UID, wrong event type, duplicates, stale ID, incomplete OAuth, or readiness mismatch are refused or normalized safely.
- Trigger lifecycle uses a Document Lock separate from the Worker processing Lock. Disable precommits `desired=false` and `enabled=false`; enable rechecks desired state before and after commit so a concurrent disable wins.
- Refused and exceptional enable paths roll back to a consistent disabled state. Disable attempts both authoritative flag writes and owned Trigger deletion independently.
- Automatic Worker and readiness bind to the same future `createProductionExternalAdapter()` factory and reject Mock in the production path.
- Message timestamps are rechecked against the fixed upper bound after `threads.get`; Gmail pages are capped at four with repeated-token detection.
- Metadata budget exhaustion returns replayable partial progress. Expired page cursors restart the same fixed cycle from page one with durable Message ID deduplication.
- The newly fetched/preprocessed Message is reused in the same run, and formal label indices are cached per run.
- No `UrlFetchApp`, endpoint, credential, real Provider connection, external-request scope, broad Gmail/Calendar scope, or Setup Trigger was added.

### Validation

- Phase 6 local/negative/security boundary: 41 PASS / 0 FAIL.
- Phase 6 Worker integration: 16 PASS / 0 FAIL.
- Phase 6 Apps Script harness: 8 PASS / 0 FAIL / 2 real-Workspace cases SKIPPED.
- Phase 6 performance/reliability static: 10 PASS / 0 FAIL.
- Full local suite at the Phase 6 Gate: 18 suites, 319 PASS / 0 FAIL / 8 external cases SKIPPED.
- Apps Script syntax: 20/20 PASS.
- Independent QA, security, and performance/reliability reviews found 0 open Critical/High/Medium after fixes.
- Real 5-minute Trigger, real normal-Inbox scan, real Provider connection, and Apps Script runtime performance: `NOT EXECUTED`.

## 2.5.0-phase5 - 2026-07-24

### Added

- Provider-neutral `ExternalAiAdapter` with canonical minimized requests, strict response validation, stable error taxonomy, health checks, provenance metadata, and an injectable network-free `MockHttpTransport`.
- Exact classification provenance persistence and provenance-aware classification hashing across Message State, Task policy, and Worker resume paths.
- Append-only v2.0-to-v2.1 Message State extension for `classification_provenance_json`, with recognized-v2-only eligibility, 500-row chunks, 10,000-row cap, soft-budget pause/resume, and batched writes.
- Phase 5 adapter, Apps Script harness, Worker integration, schema-extension, cap, multi-chunk, and partial-resume tests.

### Changed

- Code Version is `2.5.0-phase5`, physical Schema Version is `2.1`, AI Schema Version is `2.0`, and Migration Version remains `0`.
- Completed-v2 Setup refreshes version metadata without rebuilding Sheets or modifying Task/user data.
- Numeric transport limits and AI request schema are validated before credential lookup or transport access.
- Transport exception messages are replaced by canonical safe messages and are not retained in returned errors.
- External AI inside the Worker is fail-closed for all real/non-Mock transports. Only `ExternalAiAdapter` plus `MockHttpTransport` in `TEST_MODE` may exercise the integration path.
- Setup propagates schema-extension budget pauses without advancing later stages.

### Validation

- Phase 1 through Phase 4 regression: 191 PASS, 0 FAIL; 5 real-Workspace cases remain `NOT EXECUTED`.
- Existing-v2 metadata upgrade: 2/2 PASS.
- Phase 5 adapter/local: 32/32 PASS.
- Phase 5 Apps Script harness: 8/8 local PASS; 1 real-provider case explicitly skipped as `NOT_EXECUTED`.
- Phase 5 Worker integration: 4/4 PASS.
- Phase 5 schema extension: 7/7 PASS, including size-cap rejection and partial multi-chunk pause/resume.
- Total Phase 5 local evidence: 51 PASS, 0 FAIL.
- Independent QA, security, and performance/reliability re-reviews found 0 open Critical/High/Medium after fixes.

### Known limitations

- Code implementation: local PASS.
- Mock HTTP Transport: local PASS.
- Real provider connection: `NOT EXECUTED`.
- Company approval: `NOT CONFIRMED`.
- Credential storage approval: `NOT CONFIRMED`.
- No provider, endpoint, model, auth method, credential value, `UrlFetchApp`, or external-request scope was guessed or added.
- Real External AI transport requires a reviewed no-lock-during-HTTP execution boundary before it can be enabled.
- Google Workspace schema extension, OAuth, LockService concurrency, execution duration, and prior Phase 1–4 real-service cases remain `NOT_EXECUTED`.

## 2.4.0-phase4 - 2026-07-24

### Added

- Dedicated `自動期日管理` Calendar provisioning in Setup S60 with owner and deployment-instance markers, same-name collision checks, and no Runtime provisioning path.
- Calendar eligibility policy, private all-day Event create/update/delete/no-op behavior, deterministic valid Event IDs, bounded marker recovery, and owned-Event enforcement.
- `同期状態` Calendar Outbox with one-Job-per-run processing, Calendar-only resume, and initial-attempt plus 5/15/60-minute retry scheduling.
- Durable `CALENDAR` Message checkpoint and Worker ordering from Task finalization through Gmail label synchronization to Calendar Outbox processing.
- Phase 4 Apps Script harness, independent Worker integration tests, and a dedicated performance/reliability suite.
- Phase 1 audit through Phase 4 traceability, real-Workspace manual acceptance guide, and consolidated implementation report.

### Changed

- Setup now completes S60, records S80 as the explicit `NO_TRIGGER` policy stage, reaches S99, and never creates a production Trigger.
- Task edit handling reads only selected Task rows, updates only changed cells, and enqueues Calendar work without calling Calendar directly.
- Calendar retries preserve prior Gmail/AI/Task business effects, reset stage-local retry metadata only at the first `CALENDAR` checkpoint, and move to `DEAD` only after the third scheduled retry also fails.
- Non-actionable Tasks no longer create new NOOP Outbox rows or same-value Calendar-status Task writes.
- Calendar Runtime validates `ins_` plus 32-lowercase-hex deployment markers before API access, rejects missing Task writers, and handles missing Task targets as a structured fail-closed Outbox result.
- Event descriptions are limited to sender, deadline basis, the required source reference, and ownership markers; subject, body, attachments, credentials, and standalone Message/Calendar/Event ID fields are excluded.
- Gmail source references flow in memory to the Task and Event contract without entering AI input; error-log Message/Thread references are domain-separated hashes rather than raw provider IDs.
- Quick Diagnostic separates local structural results from real Google Workspace checks and reports the latter as `WARN / NOT_EXECUTED`.
- Manifest enables Advanced Calendar v3 with `calendar.app.created` and `calendar.calendarlist.readonly`; broad Calendar, external-request, mail-send, Drive, and Trigger scopes remain absent.

### Validation

- Nine local suites: 191 PASS, 0 FAIL.
- Phase 1 local regression: 15/15 passed.
- Independent Phase 1 audit regression: 23/23 passed.
- Phase 2 production-code local regression: 27/27 passed.
- Phase 3 production-code local tests: 37/37 passed.
- Independent Phase 3 local tests: 34/34 passed.
- Phase 4 Calendar core: 22/22 passed.
- Phase 4 Apps Script harness: 15 local cases passed; 5 real-Workspace cases were explicitly skipped as `NOT_EXECUTED`.
- Independent Phase 4 Worker integration: 11/11 passed.
- Phase 4 performance/reliability: 7/7 passed.
- JavaScript syntax: 20/20 `.gs` files parsed; manifest JSON and exact service/scope checks passed.
- Static boundaries: zero `UrlFetchApp`, `CalendarApp`, `GmailApp`, `ScriptApp.newTrigger`, simple `onEdit`, Task-append `getLastRow()`, or blank-row `setValue(false)` calls; one Setup-only `SpreadsheetApp.flush()` call.

### Known limitations

- Real Google Workspace Sheet UI, Data Validation, Protection, Gmail search/label mutation, source-reference navigation, Calendar CRUD/retry, OAuth consent, LockService contention, primary-Calendar invariance, and execution duration are `NOT_EXECUTED`.
- Three non-blocking performance hardening items remain: dense sparse-row context allocation for very high selected row numbers, escaped held-lock-context defense, and a per-page Setup soft-budget check while scanning CalendarList.
- Phase 4 intentionally includes no real AI provider, Phase 5 implementation, automatic Inbox polling, five-minute polling, installable/time-driven Trigger, reverse Calendar sync, or v1 migration.

## 2.3.0-phase3 - 2026-07-24

### Added

- Provider-neutral AI contract and deterministic `MockAiAdapter` with exact input/output fields, action-specific semantic validation, maximum 10 actions, strict enum/date/target validation, and no external HTTP path.
- Deterministic Mock fixtures for safe new Tasks, Review, relative/inferred dates, multiple actions, existing changes, waiting, information-only, malformed JSON/schema, unknown action, action overflow, transient failure, and prompt-injection-as-data.
- Same-Sheet Task Review policy with safe-new auto-open threshold, pending existing changes, idempotent accept/reject, Active-input-bound target resolution, ambiguous/fabricated-target isolation, manual-field conflicts, and inferred-date separation.
- Callable-only Task edit handler plus an explicit selected-range menu entry for edited rows, deterministic status normalization, `manual_fields`, decision application, row versioning, a 20-row bound, and management-column warning evidence.
- Phase 3 vertical worker with classification-before-Task checkpoint, one non-nested Script Lock, idempotent Task effects, finalization-only retry, AI label synchronization, and Thread-aggregate `SYS/失敗` error labeling.
- Phase 3 Apps Script acceptance harness and independent production-code local tests.

### Changed

- Message State now supports `CLASSIFIED`, `TASKS_WRITTEN`, and `DONE` checkpoints with stage-specific retry and saved-classification validation.
- Task Repository now indexes inserted Stable Thread Keys, stages pending changes, applies small edited-row updates, preserves user-owned fields, and formula-neutralizes script-originated String/URL cell values.
- Soft-budget pauses release the current claim to its last durable checkpoint without consuming retry allowance; the combined Mock acceptance flow shares one 120-second budget across Phase 2 and Phase 3.
- Quick Diagnostic reports Mock-only AI policy and a read-only management-column direct-edit warning.
- Run summaries record allow-listed Phase 3 Task/Review counts.
- Manifest uses `gmail.modify` as the single Gmail scope; `gmail.readonly` and `gmail.labels` are removed as redundant.

### Validation

- Phase 1 local regression: 15/15 passed.
- Independent Phase 1 audit regression: 23/23 passed.
- Phase 2 production-code local regression: 27/27 passed.
- Phase 3 production-code local tests: 37/37 passed.
- Independent Phase 3 local tests: 34/34 passed.
- JavaScript syntax check: 19/19 `.gs` files passed through Node stdin parsing; Phase 3 test files passed.
- Static boundaries: no `UrlFetchApp`, Calendar API, `GmailApp`, production trigger creation, `onEdit`, Task-append `getLastRow()`, or blank-row `setValue(false)` call.

### Known limitations

- Google Workspace real Gmail search/body retrieval, label mutation, OAuth consent, selected-range Review application, formula-cell verification, Protection, LockService concurrency, and execution duration are not executed locally.
- Phase 3 intentionally includes no real AI provider, Gemini Adapter, Calendar operation, automatic Inbox polling, installable/time-driven trigger, or v1 migration.
- Public Setup still stops safely at the Phase 4 S60 Calendar boundary.

## 2.2.0-phase2 - 2026-07-24

### Added

- Advanced Gmail Service gateway with the exact bounded `手動/取込` query, deterministic ordering, spam/trash race defense, and no Inbox or unread-state dependency.
- Idempotent S50 setup for the seven formal Gmail labels without deleting or renaming human labels.
- Message State repository keyed by Message ID with exact v2 schema, Script Lock claim, 30-minute stale-claim recovery, retry/dead checkpoints, and 100-row expansion.
- Stable Thread Key generation from the first Message ID with Thread ID fallback.
- Provider-neutral email preprocessor with Unicode-safe 20,000-character truncation, deterministic content hash, two-message context cap, and no attachment or URL retrieval.
- Manual Phase 2 worker that handles at most one new Message within a 120-second soft budget and stops at `PREPROCESSED`.
- Allowlist-only run/error records, Phase 2 Apps Script harness, menu actions, and production-code local tests.

### Changed

- Setup now proceeds through S50 and stops safely at the unimplemented S60 Calendar boundary.
- Manifest enables Advanced Gmail v1 with Phase 2 minimum `gmail.readonly` and `gmail.labels`; no `gmail.modify`, `mail.google.com`, Calendar, external-request, Drive, Mail-send, or trigger scope is added.
- Independent Gate fixes make `手動/除外` stop a prior `PREPROCESSED` checkpoint, send non-retryable failures directly to `DEAD`, serialize run-summary appends with Script Lock, and stop thread expansion when the soft budget is exhausted.
- Quick Diagnostic reports the static manual-import policy without searching Gmail.

### Validation

- Phase 1 local regression: 15/15 passed.
- Independent Phase 1 audit regression: 23/23 passed.
- Phase 2 production-code local tests: 27/27 passed.
- JavaScript syntax check: 16/16 `.gs` files passed.
- Static boundaries: no `GmailApp`, Inbox/unread query, attachment fetch, `UrlFetchApp`, Calendar API, production trigger creation, or `getLastRow()` call.

### Known limitations

- Real Gmail label hierarchy, real manual query behavior, OAuth/admin approval, Script Lock contention, execution-log behavior, and 120-second timing are not executed locally.
- Phase 2 intentionally performs no AI classification, Task write, Calendar operation, automatic Inbox polling, or trigger creation.

## 2.1.0-phase1-audit - 2026-07-24

### Changed

- Hardened blank-environment detection so formulas, notes, validation rules, and protections cannot be mistaken for an empty Sheet.
- Added strict Setup-state ordering and postcondition checks before a recorded stage is trusted.
- Added Script Lock serialization, stale-context conflict detection, repository-owned Task IDs, strict read/write typing, and changed-cell-only Task updates.
- Replaced warning-only management protection with enforced header, management-column, hidden-management-Sheet, and Task edit-policy protections.
- Expanded Quick Diagnostic for undersized grids, exact schema width, validation criteria, date formats, hidden columns, protection policy, and required properties.
- Chunked Quick Diagnostic validation/format inspection with a 60-second soft budget reserve and complete Protection geometry/editor/domain checks.
- Reused Setup range values and short-circuited formula/note/validation probes once non-empty content is established.
- Made source Message, Thread, action index, and source metadata immutable for an existing `origin_key`.
- Expanded secret redaction for structured tokens, credentials, authentication headers, cookies, URI user information, and whitespace-bearing secret values.
- Added independent production-code audit tests for destructive-setup prevention, concurrency, type/enum rejection, redaction, setup-state integrity, diagnostic safety, and protection policy.

### Validation

- Existing local Phase 1 tests: 15/15 passed.
- Independent Phase 1 audit tests: 23/23 passed.
- JavaScript syntax check: 10/10 `.gs` files passed using the bundled Node.js runtime.
- Manifest JSON parse and static Phase 1 guardrails passed.

### Known limitations

- Google Workspace manual acceptance, real Data Validation behavior, protection editor behavior, Script Lock contention, OAuth consent, and execution timing remain not executed.
- No Gmail, Calendar, external AI, production trigger, or v1 migration behavior was introduced by this audit release.

## 2.0.0-phase1 - 2026-07-24

### Added

- New zero-based Apps Script v2 Phase 1 foundation.
- Ten-Sheet setup contract with internal IDs, Japanese headers, validation, formats, visibility, and small initial grids.
- Staged, resumable setup with safe v1 and unknown-environment detection.
- Internal-ID Column Map and logical-empty-row Task Repository.
- Typed, idempotent synthetic Task upsert with `created_at`, `updated_at`, and `row_version`.
- Read-only Phase 1 Quick Diagnostic.
- Apps Script acceptance harness and local Node.js tests.
- Minimal manifest, custom menu, `.clasp.json.example`, and installation guide.

### Validation

- JavaScript syntax check: 10/10 `.gs` files passed.
- Local Phase 1 tests: 15/15 passed.
- Static guardrails: no Task-append `getLastRow()`, blank-row `setValue(false)`, external Gmail/Calendar/AI runtime API, production trigger creation, or credential signature found.

### Known limitations

- Google Workspace manual acceptance is not executed in the local environment.
- Public setup intentionally stops at the unimplemented Phase 2 stage `S50_CREATE_GMAIL_LABELS`.
- No production trigger, Gmail, Calendar, external AI, or v1 migration is implemented.
