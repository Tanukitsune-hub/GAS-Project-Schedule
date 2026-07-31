# V2 Codex Implementation Plan

Last updated: 2026-07-31
Current remediation candidate: Code `2.8.11-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
Gate: `NO_GO_COMPANY_HANDOFF_PENDING_LOCAL_CLASP_VALIDATION`

Instruction 0003 added only a bounded Diagnostic acceptance summary. The
closed T1-01 `77 PASS / 6 WARN / 0 FAIL` observation remains
`REVIEW_REQUIRED`; no sixth warning ID is inferred. Instruction 0005 is
`SUPERSEDED_NOT_EXECUTED`: fixed T11 is immutable historical evidence but
`T11_SUSPENDED`, so it authorizes no Company-PC carriage or re-observation.
The current prerequisite is local clasp validation on a personal synthetic
development target; no company Workspace action is authorized.

## Scope

This plan applies only to `Tanukitsune-hub/GAS-Project-Schedule`. The
canonical implementation root is `implementation/GoogleSpreadsheet/`. It
does not use or synchronize a legacy context hub.

Corrected Source A9.1, direct-child corrected Release B9.1, and fixed T9 are
immutable historical evidence. The repeated 51-cell finding supersedes T9 as
an execution target. Source A10
`33b9ecee5b0957615fcc27fc822bf7d10a74c86f`, direct-child Release B10
`3f4fe6c52be7bf9c66ad221594e6271feebb57ed`, and fixed transfer T10
`927d8567bce64461840cc6f72fbae0c1e636a8e6` are normally published
and independently verified. This evidence-only commit records closure and is
not a transfer target. The later 0001 evidence records one controlled Sandbox
Setup S00-S99 PASS; only separately approved staged synthetic manual
acceptance is now authorized, not general real Workspace operation.

## Historical work sequence

1. Preserve historic A5/B5 and all pre-existing worktree artifacts.
2. Build a correction Source A5.1 from the current remote branch tip.
3. Keep source, tests, tools, canonical docs, visualization, and design note in
   Source A5.1; do not include release packages or the Round 4 implementation
   report there.
4. Validate authority recovery, migration, documentation, and source topology.
5. Generate 8B and 8C candidate packages from the exact Source A5.1 SHA.
6. Put only both package directories and
   `implementation/GoogleSpreadsheet/AUDIT_REMEDIATION_ROUND4_IMPLEMENTATION_REPORT.md`
   in Release B5.1.
7. Publish the linear pair through a non-force fast-forward update, resolve
   final GitHub SHAs, and fresh-clone verify.
8. Add P5 publication evidence without changing source or release payload.

The A5.1/B5.1 sequence above is retained as historical provenance only. The
failed P10 v2.8.5 transfer package must not be replaced, manually repaired, or
used as a current transfer target.

## Current Phase 8B Dashboard write-visibility / module-skew sequence

1. Preserve all v2.8.5–v2.8.9 package, transfer, incident, audit, and fixed-ref
   bytes.
2. Keep the existing exact schema/Protection/surface preconditions. When the
   exact 17×3 block requires normalization, write once, call
   `SpreadsheetApp.flush()`, reacquire a fresh Range, and require the exact
   51-cell postcondition before read-only Quick Diagnostic.
3. Fail closed as `E_DASHBOARD_NUMBER_FORMAT_POSTCONDITION` when flush is
   unavailable/fails or the reread remains noncanonical. Persist only bounded,
   non-sensitive normalization evidence.
4. Require aligned Config/Setup/Dashboard S90 module-contract identifiers and
   fail as `E_MODULE_VERSION_SKEW` before a write on partial replacement.
5. Model queued writes in the fake runtime and cover historical no-flush,
   fresh-Range, module-skew, S00–S80 resume, resource invariants, and
   document-consistency negatives.
6. Completed: Source A10, its direct-child Release B10, and separate fixed
   transfer T10 were created; T10 was derived from raw Git blob comparison to
   T9, normally published, and verified from a detached HTTPS clone. This
   evidence-only commit records the proof. Real Workspace remains
   `NOT_EXECUTED`.

## Historical Phase 8B Setup blocker sequence

1. Preserve P10, all v2.8.5 packages, transfer material, and previous evidence
   unchanged; record only safe `PHASE8B-SETUP-01` incident facts.
2. In Source A6, add the Setup-owned protection/hidden Ledger control-plane
   order, regression tests, v2.8.6 tools/docs/visualization, and Japanese
   recovery guide. Do not include a v2.8.6 package, release report, or transfer
   envelope.
3. Run the full local suite, Apps Script validator, PowerShell parser, and
   static source boundary checks.
4. From exact clean Source A6, generate independently the Phase 8B
   `TEST_MODE=true` package and unauthorized Phase 8C candidate using a fixed
   `PreparedAt`; verify parity, checksums, allow-lists, provenance, secret and
   local-path scans.
5. Create direct-child Release B6 containing only both new package directories
   and the Phase 8B Setup Ledger visibility implementation report.
6. Create a separate corrected transfer candidate and verify it from GitHub in
   a detached fresh HTTPS clone. T6.1 `863217b...` completed that proof; the
   evidence-only closure states `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`, which
remains carriage-only.

## Historical Phase 8B Quick Diagnostic sequence

1. Preserve all historical packages, T6.1, and their evidence without
   replacement.
2. Source A7 `be2e551da310a9b7c0611f3aef8899309a3d7b69` corrected only the four
   diagnostic contracts and added S20/S30/S40 runtime reproduction, S00–S80
   resume coverage, and v2.8.7 tools/docs/visualization/incident/recovery
   guidance; it excludes release/report/transfer outputs.
3. Direct-child Release B7 `95bc7240d99124b245e188b8e646eccf6c3ead48` contains
   only both v2.8.7 package directories and the implementation report.
4. C7 `ba175d3994c86dacc76bad3537df97e3e644dc09` corrected only the verified
   transfer-manifest tool defect. Fixed T7
   `008c643b85c6b234ad489d946033cb9c06d32920` carries raw Git-blob manifests
   comparing T6.1 to B7; package bytes remain immutable.
5. E7 records the completed remote and detached fresh-clone proof. The maximum
   status is `READY_FOR_PHASE8B_SANDBOX_RETRANSFER` for carriage only.

## Completed Phase 8B Dashboard surface sequence

1. Preserve all historical v2.8.5, v2.8.6, and v2.8.7 package, transfer,
   audit, incident, and ref evidence byte-for-byte.
2. Source A8 contains the v2.8.8 Apps Script correction, runtime/fault tests,
   v2.8.8 tools, canonical documents, visualization, safe incident, and
   recovery guide only. It excludes new packages, implementation report, and
   transfer envelope.
3. Prove native owner/effective-user/`canEdit` semantics and both explicit and
   implicit owner modes. Keep foreign editor, domain/audience, wrong/duplicate
   Protection, unprotected range, and every data/format surface conflict
   fail-closed through closed safe enums/counts.
4. All local suites and the static validator passed before Source A8
   `4140054b03c850f4a1e669b3aa562b305ef78bf5` was fixed.
5. Phase 8B and Phase 8C packages were generated from exact clean A8.
   Direct-child Release B8
   `a17d34422ed521cee81340902d9a19e2da372201` contains only those packages
   and the v2.8.8 implementation report.
6. Separate T8 `69f843f6ea426ccb45d721a40508a35b0a59795d` contains the Japanese/JSON
   company-PC manifest derived from raw Git blob comparison of fixed T7 and
   final B8, including all changed and unchanged payload files and exact
   hashes.
7. The linear chain was normal-pushed and remote-resolved. All tests,
   package/parity/checksum/allow-list/provenance/scans, and transfer checks
   passed from a detached HTTPS clone of fixed T8.
8. The resulting maximum status is
   `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`; this remains carriage-only.

## Safety rules

- Automation remains `OFF`.
- No deployment, `clasp push`, credential, real Workspace ID, real URL, or
  real mail content.
- No reset, clean, amend, rebase, force push, or unrelated revert.
- Missing authority must not fall back to a snapshot cell, note, or live row.
- Diagnostics are read-only; standalone and unobserved functional Workspace
  items remain `NOT_EXECUTED`.

## Required evidence

- All local test suites, including Round 4, Round 5, migration, and static
  publication checks.
- `tools/validate_apps_script_v2.js`.
- Canonical 11 Sheets / hidden 5 / 50 Task columns checks.
- R4/R5 requirement and write-route traceability.
- Release checksum, source parity, inventory, self-reference, and secret scan.
- Remote Source and Release SHA resolution plus a fresh-clone verification.

The highest status is not upgraded before the final remote proof. Never
declare Phase 8B GO/PASS, Phase 8C GO, production ready, or pilot ready.

