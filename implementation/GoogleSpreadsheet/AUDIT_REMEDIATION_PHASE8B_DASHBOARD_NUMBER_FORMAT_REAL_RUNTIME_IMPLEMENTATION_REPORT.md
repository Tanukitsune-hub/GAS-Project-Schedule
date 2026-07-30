# Phase 8B Dashboard Number-Format Real-Runtime Remediation — Implementation Report

Date: 2026-07-30  
Release: Code `2.8.9-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`  
Corrected Source A9.1: `4a145588b01a5f7ae7e9bce86efb9bd5b3d8345d`

## Scope and status boundary

This is the Corrected Release B9.1 package-generation report for the safe Phase 8B finding
`PHASE8B-DASHBOARD-NUMBER-FORMAT-01`. Its highest local status is
`PHASE8B_SANDBOX_NO_GO_DASHBOARD_NUMBER_FORMAT`. It does not declare Phase 8B
GO/PASS, Phase 8C GO, production readiness, or pilot readiness.

All evidence in this report is local and synthetic. Real Google Workspace,
OAuth, Apps Script import, Setup, Dashboard refresh, Quick/Deep Diagnostic,
Gmail, Calendar, deployment, `clasp push`, Automation/trigger enablement,
Provider configuration, and real data are `NOT EXECUTED`.

The corrected source commit changes only the v2.8.9 patch-manifest tool default
from the historical predecessor to fixed T8 and adds a static assertion for
that binding. It does not alter the Apps Script payload or the historical
v2.8.8 release/transfer artifacts.

## Root cause and chosen contract

The strict Dashboard inspection counted a number-format mismatch in the exact
17 metrics × 3 system columns but Setup had no narrow, proven-safe write route
to establish the canonical contract before S90. The contract is now a
configuration-owned deterministic plain-text format. The product contract is
defined in source; this report intentionally does not retain an observed
runtime locale or a real Workspace formatting string.

The remediation changes only these Apps Script source files:

- `00_Config.gs` — Code `2.8.9-prepilot` and the canonical system-block
  plain-text format contract.
- `02_Setup.gs` — a Setup-only pre-S90 normalizer call.
- `15_Dashboard.gs` — strict inspection, a private deferred-format proof mode,
  a fail-closed normalizer, exact 17×3 targeting, post-write strict
  verification, and idempotence.

The normalizer may run only after the Dashboard sheet/header protections,
named ranges, values, formulas, validation, notes, merge state, hidden state,
backgrounds, fonts, seed/owned marker, and foreign-content checks are safe. It
does not change user space. Any unsafe surface, missing API, ambiguous marker,
or nonmatching block fails closed. Quick and Deep Diagnostic remain read-only.

## Regression and validation evidence

- All Node suites: `45` suites / `658` passing assertions / `0` failed suites.
- New native runtime suite:
  `phase8b_dashboard_number_format_real_runtime_test.js` — `12` passing cases.
- Existing Dashboard surface, Quick Diagnostic, Setup Ledger/resume, F015/F016,
  authority, Calendar, schema, and publication suites: passing within the full
  Node run.
- `tools/validate_apps_script_v2.js`: `11` checks PASS; `22` `.gs` files;
  source secret scan PASS with `3` reviewed synthetic fixtures.
- The S00–S80 resume regression proves only S90/S99 proceed, without creating,
  deleting, or overwriting Gmail labels, dedicated Calendar, Properties, or the
  owner edit trigger; Automation stays OFF and no five-minute trigger exists.

## Package provenance and integrity

Corrected Release B9.1 is generated only from exact Corrected Source A9.1. The two candidate packages
were independently built and verified locally:

| Package | Package files | Payload files | Canonical payload SHA-256 |
|---|---:|---:|---|
| `release/v2.8.9-prepilot/` | 27 | 23 | `8fae6fba81d29e1783b5579ddbcb9d995408402f3b6925865ee8024658128cf8` |
| `release/v2.8.9-prepilot-phase8c/` | 25 | 22 | `27e02eca5c97ace2e093a02995a35be9c30f63a8f8297a2275c27bf3c5282b6a` |

Both package verifiers passed source/package parity, checksum, provenance,
secret scan, allow-list, TEST_MODE transform, Automation OFF, and package
boundary checks. Historical v2.8.8 packages and fixed T8 remain unmodified.
The next boundary is a raw Git-blob comparison from T8 to this Corrected Release B9.1
payload, which will generate the separate v2.8.9 transfer envelope and patch
manifest.

## Release boundary

This commit contains only:

- `implementation/GoogleSpreadsheet/release/v2.8.9-prepilot/`
- `implementation/GoogleSpreadsheet/release/v2.8.9-prepilot-phase8c/`
- this implementation report

Canonical source, tests, tools, design notes, incident record, and source
documentation remain exclusively in Corrected Source A9.1. The transfer envelope and any
post-transfer evidence commit are deliberately excluded from Corrected Release B9.1.
