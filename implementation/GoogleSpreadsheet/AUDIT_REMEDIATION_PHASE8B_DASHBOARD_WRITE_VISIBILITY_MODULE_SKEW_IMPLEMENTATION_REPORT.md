# Phase 8B Dashboard Write-Visibility / Module-Skew Remediation Report

Date: 2026-07-31  
Repository: `Tanukitsune-hub/GAS-Project-Schedule`  
Code / Schema / AI Schema / Migration:
`2.8.10-prepilot` / `2.6` / `2.0` / `3`  
Source A10: `33b9ecee5b0957615fcc27fc822bf7d10a74c86f`  
Release B10: `SELF (the commit containing this report and both packages)`  
PreparedAt: `2026-07-30T16:15:11Z`  
Release-stage gate:
`PHASE8B_SANDBOX_NO_GO_DASHBOARD_WRITE_VISIBILITY`

This report records local source and package evidence only. Real Google
Workspace, OAuth, Apps Script import, Setup, Quick/Deep Diagnostic, Dashboard
refresh, Gmail, Calendar, deployment, `clasp push`, Automation/triggers,
Provider configuration, and real data were `NOT_EXECUTED`.

## Confirmed root cause

The immutable v2.8.9 Setup-only normalizer called `setNumberFormat()` and
performed its strict reread in the same Apps Script execution without an
explicit pending-write visibility boundary. The former fake runtime applied
format writes synchronously, so it could not reproduce the real Apps Script
queued-write behavior. A manual partial-file update also had no product-level
contract proving that Config, Setup, and Dashboard were compatible modules.

## Source correction

The executable source change is limited to:

- `00_Config.gs`: Code version `2.8.10-prepilot` and the independent S90
  module-contract identifier.
- `02_Setup.gs`: Config/Setup/Dashboard contract validation before a format
  write; bounded success/failure evidence in stage output and the persisted
  Setup result; evidence preservation when the read-only Diagnostic throws.
- `15_Dashboard.gs`: strict preconditions, write, exactly one flush, fresh
  exact Range acquisition, strict 51-cell postcondition, and the distinct
  fail-closed postcondition/skew codes.

Quick and Deep Diagnostic were not given a repair path. Their runtime
regression snapshots Sheets plus Properties and installs Gmail, Calendar, and
trigger mutation sentinels; both paths perform zero mutations and zero
flushes.

## Local verification

| Check | Result |
|---|---|
| All Node suites | `47 suites / 679 PASS / 0 FAIL / 11 explicit SKIP` |
| Buffered write / flush suite | `22 PASS / 0 FAIL` |
| Module-skew suite | `5 PASS / 0 FAIL` |
| Quick Diagnostic suite | `6 PASS / 0 FAIL` |
| Setup Ledger / resume suite | `10 PASS / 0 FAIL` |
| Calendar F015 | `5 PASS / 0 FAIL` |
| Calendar F016 | `12 PASS / 0 FAIL` |
| Canonical-document consistency | `4 PASS / 0 FAIL` |
| Remote-publication consistency at Source A10 | `10 PASS / 0 FAIL` |
| Apps Script validator | `11 PASS / 0 FAIL` |
| PowerShell syntax | `6 PASS / 0 FAIL` |
| Changed-source secret/local-path/real-Workspace-ID scan | `PASS` |
| Independent package rebuild | `27/27 + 25/25 files byte-identical` |

The explicit SKIP results are historical real-service harness boundaries.
They were not weakened or promoted. All corresponding real Workspace actions
remain `NOT_EXECUTED`.

## Generated release packages

| Package | Files | Payload files | Canonical payload SHA-256 | `CHECKSUMS.sha256` SHA-256 |
|---|---:|---:|---|---|
| `release/v2.8.10-prepilot/` | 27 | 23 | `7ba8aef0b54b29cf604f0d43e1f742448e1d4a29a82c10a674cee4d8ad6237f9` | `9a4d0c121aba69277e984e8e933b0489dd0f5295b1863ab4c533af03deda13ff` |
| `release/v2.8.10-prepilot-phase8c/` | 25 | 22 | `03a7c87b0920a7c48a0dca6ca2029fa4b49314f57c4a22c904d6176a7e583701` | `5e4fcd4bd1a3dc39a45645b99bf8d542a256b17dce9eadd694a2bf18fb822688` |

The Phase 8B verifier passed source parity, checksum inventory, allow-list,
provenance, and secret scan. The Phase 8C verifier passed the single audited
`TEST_MODE` transform, harness exclusion, scope/service allow-lists,
checksums, provenance, and secret scan. Phase 8C remains a non-executable
candidate; this report does not declare Phase 8C GO.

## Commit boundary and next gate

Source A10 is the direct child of instruction commit
`56fff00bab0b272640ce89c90ffda8a60968e56b` and contains no v2.8.10 package,
release report, or transfer envelope. Release B10 must be its direct child and
contain only both package directories plus this report.

The company-PC changed-file list is intentionally not asserted here. It must
be generated after Release B10 from a raw Git blob comparison between fixed T9
`781f408fcf0853a5fffee9c00d3022ee5e17b1d7` and the final B10 payload. Fixed
T10, normal publication, detached HTTPS verification, and Evidence E10 are
still pending. Therefore the maximum status at this commit is
`PHASE8B_SANDBOX_NO_GO_DASHBOARD_WRITE_VISIBILITY`.
