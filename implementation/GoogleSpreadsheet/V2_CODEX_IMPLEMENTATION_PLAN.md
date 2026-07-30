# V2 Codex Implementation Plan

Last updated: 2026-07-30
Current source candidate: Code `2.8.7-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
Gate: `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`

## Scope

This plan applies only to `Tanukitsune-hub/GAS-Project-Schedule`. The
canonical implementation root is `implementation/GoogleSpreadsheet/`. It
does not use or synchronize a legacy context hub.

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

## Current Phase 8B Setup blocker sequence

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

## Current Phase 8B Quick Diagnostic sequence

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

## Safety rules

- Automation remains `OFF`.
- No deployment, `clasp push`, credential, real Workspace ID, real URL, or
  real mail content.
- No reset, clean, amend, rebase, force push, or unrelated revert.
- Missing authority must not fall back to a snapshot cell, note, or live row.
- Diagnostics are read-only; real Workspace items remain `NOT_EXECUTED`.

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

