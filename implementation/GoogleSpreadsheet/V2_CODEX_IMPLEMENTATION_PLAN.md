# V2 Codex Implementation Plan

Last updated: 2026-07-28  
Current source candidate: Code `2.8.5-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`  
Gate: `NO-GO_REMOTE_PUBLICATION`

## Scope

This plan applies only to `Tanukitsune-hub/GAS-Project-Schedule`. The
canonical implementation root is `implementation/GoogleSpreadsheet/`. It
does not use or synchronize a legacy context hub.

## Work sequence

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

