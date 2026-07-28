# Google Workspace v2.8.5 Remote Publication Verification

Publication evidence date: 2026-07-29
Repository: Tanukitsune-hub/GAS-Project-Schedule
Target branch: codex/r4-authority-protocol
Automation default: OFF
Real Google Workspace execution: NOT_EXECUTED

## Commit lineage and release boundary

| Item | SHA / result |
|---|---|
| Remote branch before publication | 6082865d9b618eacb0470807787a37ff3aa5f11b |
| Corrected Source A5.2 | ff658bacf1e85864e4008efa32863635e446d47d |
| Corrected Release B5.2 | d6dda2b3eb9307e7033dcdd5f4718260c4944451 |
| B5.2 parent | ff658bacf1e85864e4008efa32863635e446d47d |
| B5.2 remote resolution after release publication | d6dda2b3eb9307e7033dcdd5f4718260c4944451 |
| Source A5.2 to B5.2 diff | 53 allowed paths only: 8B package 27, 8C package 25, Round 4 implementation report 1 |

The release boundary contains only
implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/,
implementation/GoogleSpreadsheet/release/v2.8.5-prepilot-phase8c/, and
implementation/GoogleSpreadsheet/AUDIT_REMEDIATION_ROUND4_IMPLEMENTATION_REPORT.md.
No force push, reset, rebase, amend, or unrelated revert was used.

## Authentication and publication

GitHub credential-manager authentication was confirmed by a successful
non-interactive dry-run and then by this normal fast-forward push:

    git push origin d6dda2b3eb9307e7033dcdd5f4718260c4944451:refs/heads/codex/r4-authority-protocol

The push advanced the remote from 6082865d9b618eacb0470807787a37ff3aa5f11b
to d6dda2b3eb9307e7033dcdd5f4718260c4944451. Credentials, tokens, Workspace
identifiers, and personal data are not recorded in this document.

## Fresh HTTPS clone verification

A new HTTPS clone of codex/r4-authority-protocol resolved to B5.2 and was
clean before validation. The following commands/checks passed:

| Check | Result |
|---|---|
| Full test suite | 41 files; 604 PASS / 0 FAIL / 11 explicit fake-runtime skips |
| Apps Script validator | 11/11 PASS over 22 .gs files |
| Remote publication consistency | 8 PASS / 0 FAIL |
| Phase 8B verifier | 27 package files / 23 payload; source parity, checksums, secret scan, provenance PASS |
| Phase 8C verifier | 25 package files / 22 payload; transform parity, checksums, allow-lists, secret scan, provenance PASS |
| 8B canonical payload SHA-256 | 2b0356b1e9c22a2e62642db036dae931d8dc8f0e6f875f6510b9520e4bbe3c71 |
| 8C canonical payload SHA-256 | 22686419fe675d6582e476cd3a6d14162640312a7eddb492d87fda2bd7206db3 |
| Fresh source rebuild byte parity | 8B 27/27 and 8C 25/25 identical to the published packages |
| Canonical path / duplicate check | PASS; no root-level source, tests, tools, release, or report duplicates |
| Automation default | OFF |

The tests and validators were local/static or fake Apps Script checks. They do
not constitute real Google Workspace execution, deployment, or clasp push.

## Status and remaining gate

Highest status: READY_FOR_INDEPENDENT_REAUDIT
Independent re-audit: PENDING

Phase 8B GO/PASS, Phase 8C GO, production ready, and pilot ready are not
declared. No deployment, clasp push, Automation enablement, or real Google
Workspace operation was performed.
