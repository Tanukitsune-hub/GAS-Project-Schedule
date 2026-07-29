# Phase 8B Setup Ledger Visibility Blocker — Implementation and Release Report

Date: 2026-07-29

## Scope and release boundary

- Repository of record: `Tanukitsune-hub/GAS-Project-Schedule`
- Corrected source: Source A6 `8e8e3e4a5f2288985554b3467a5b68814e7bab21`
- This release: Release B6 `SELF (the Git commit containing this report)`
- Code / Schema / AI Schema / Migration: `2.8.6-prepilot` / `2.6` / `2.0` / `3`
- Automation default: `OFF`
- Package-generation gate: `PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER`
- Real Google Workspace retest: `NOT EXECUTED`

This is an additive remediation chain.  The failed fixed transfer ref
`1a1f9df65dacf3a031409d724cb2906b58900f77`, Source A5.4
`6c4f737c676b3121c42aafabe9d0c677cacd69bb`, and Release B5.4
`3e5790672740626f3bec4592c3c7c0b86b47f3b1` remain historical evidence and
their v2.8.5 package bytes are not changed by this release.

Release B6 is a direct child of Source A6.  Its changed-file boundary is
limited to the two generated v2.8.6 release packages and this report.  Source,
tests, tools, canonical documents, visualizations, the incident record, and
the Japanese recovery guide remain in Source A6; a transfer envelope is not
part of this Release B6 boundary.

## Observed blocker and root cause

The recorded Phase 8B Setup stopped safely with:

| Field | Recorded value |
| --- | --- |
| Status | `FAILED` |
| Code | `E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN` |
| Stage | `TASK_AUTHORITY` |
| Completed stages | `S00_VALIDATE_ENV`, `S10_CREATE_SHEETS` |
| Duration | `38645 ms` |

The safe incident evidence is limited to the code, stage, completed-stage
names, and duration in
`audits/2026-07-29/GoogleWorkspace_v2_8_6_Phase8B_Setup_Ledger_Visibility_Blocker_Incident_2026-07-29.md`.
It intentionally contains no real Workspace identifier, URL, credential,
email content, or personal information.

In the pre-remediation order, `S20_CREATE_SCHEMAS` applied schemas and called
the strict authority validator before the Ledger visibility control was set;
the hide action occurred later in `S30`.  The validator was correct to fail
closed.  The product defect was Setup ordering, not a condition to weaken in
the validator or to ask an operator to repair manually.

## Delivered correction

`WorkOsSheetBuilder.ensureTaskAuthorityLedgerControlPlane(spreadsheet)` now
establishes the Task Authority Ledger control plane during S20 before any
authority validation.  The helper:

1. resolves the Ledger sheet or fails closed;
2. establishes or reuses its exact protection safely and idempotently;
3. hides the sheet when needed and verifies that postcondition; and
4. normalizes protection/visibility write failures as an incomplete,
   resumable S20 failure.

S30 retains an idempotent reassertion before its normal visibility work, and a
completed Setup rerun also establishes the controls before any authority
validation.  No generic runtime "repair while operating" path was added.
No raw row, note, `authoritative_snapshot_json`, or user-edited snapshot can
become fallback authority.  The existing strict common validator remains the
validator used by Setup, diagnostics, task writes, migration, and edit
restore.

The new `phase8b_setup_ledger_visibility_test.js` covers a fresh empty Setup,
an observed S00/S10 partial-state resume, visibility and protection write
failures, both mixed control-plane states, S30 reassertion, completed Setup
rerun, Automation OFF, and the no-fallback boundary.

## Local verification before publication

| Check | Exact result |
| --- | --- |
| All local Node suites | `42` suites; `619 PASS` / `0 FAIL` / `11` explicit fake-runtime skips |
| New Phase 8B Setup Ledger suite | `8 PASS` / `0 FAIL` |
| Apps Script static validator | `11/11 PASS`; `22` `.gs` files |
| v2.8.6 package builders/verifiers PowerShell parse | `4/4 PASS` |
| Existing v2.8.5 transfer-envelope verifier | `7/7` direct checksums PASS; canonical checksum and secret/local-path scans PASS |
| Remote publication consistency (Source A6 boundary) | `8/8 PASS` |
| Automation default | `OFF` |

The 11 skipped checks are explicit fake-runtime or real-Workspace cases. They
are not promoted to a real Google Workspace PASS.  This report records no
real Workspace operation, OAuth consent, Apps Script import, Setup execution,
Gmail or Calendar operation, deployment, `clasp push`, trigger activation,
Provider configuration, or real-data use.

## Release package provenance

Both packages were generated from the immutable Source A6 with the same UTC
prepared time: `2026-07-29T06:27:34.455Z`.

| Candidate | Path | Files / payload | Canonical payload SHA-256 | Package tree SHA-256 | Result |
| --- | --- | ---: | --- | --- | --- |
| Phase 8B | `implementation/GoogleSpreadsheet/release/v2.8.6-prepilot/` | `27 / 23` | `e734d1d11be637e4b146b448728dd54841df0cb37f0cba53528213f2a564fbfc` | `02442a7afbfb910298aacda739ba4259123baf5edb078526ba7266d531073d34` | source parity, checksums, secret scan, provenance PASS; `TEST_MODE=true`; harness included |
| Phase 8C candidate | `implementation/GoogleSpreadsheet/release/v2.8.6-prepilot-phase8c/` | `25 / 22` | `85e201759f2b7f1a962e9c1a14eeca2312b6acb7797808d7d651e03ab1a3404d` | `b48ec8da7c2802918042434be3a7bdfa127aebf1367f96f1b2cf337b58edffa9` | audited transform parity, checksums, scope/service allow-lists, secret scan, provenance PASS; `TEST_MODE=false`; harness excluded |

| Artifact | Phase 8B SHA-256 | Phase 8C SHA-256 |
| --- | --- | --- |
| `CHECKSUMS.sha256` | `52f7808c31a8bde9441b4e258a819787607aa7c2eb73d69db196875f64450ddb` | `c05f388ffaef71da4b10a233c14c94ddb5ef37e7a830a82bc87478e11457c11b` |
| `DEPLOYMENT_MANIFEST.md` | `7607de2105d7ec9cd57f7b0eff8156ac64303ca0d6b94fa5d6479fa9f412fe52` | `7789630561cd53b7953a0551c143c34d25b23e5656660d863417a62e85e1eb07` |

Each manifest records Source A6, Automation OFF, version contract, package
inventory, canonical payload hash, and `SELF` for this Release B6 commit.  No
manifest precomputes or invents this release commit SHA.

## Status and remaining work

This release is a local/static remediation candidate only.  It does not
declare Phase 8B GO/PASS, Phase 8C GO, production readiness, or pilot
readiness.  A new non-sensitive Phase 8B transfer envelope, normal remote
publication, fresh-clone verification, and a separately authorized real
Workspace retransfer are still required before any future status decision.
