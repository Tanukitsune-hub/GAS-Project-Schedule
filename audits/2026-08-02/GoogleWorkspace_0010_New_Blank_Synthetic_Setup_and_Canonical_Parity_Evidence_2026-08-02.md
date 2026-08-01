# Instruction 0010 - new blank synthetic target, canonical parity, and Setup evidence

## Scope and target boundary

This additive record covers only the operator-authorized change from the
previous existing-target assumption to a newly created blank, spreadsheet-bound,
personal, non-company, synthetic Apps Script Sandbox. The operator explicitly
selected this target and explicitly authorized first-time Setup. No target was
silently substituted.

This record contains no Script ID, account detail, URL, Cloud project detail,
credential, token, raw clasp output, local path, screenshot, Workspace data, or
remote source content.

## Preserved source and publication boundary

- Working branch: `codex/0008-remote-gas-development-bootstrap`.
- Tracked baseline before this evidence: `4fb2b22c18901a941bcb69e6931c16773346c38f`.
- Canonical candidate remains Code `2.8.11-prepilot`, Schema `2.6`, AI Schema
  `2.0`, Migration `3`.
- Apps Script source, canonical `appsscript.json`, historical release and
  transfer artifacts, checksums, and fixed historical refs were not changed.
- The existing pull contract remains `scriptExtensions: [".gs", ".js"]` and
  `htmlExtensions: [".html"]`, with `.gs` first.

## Closed local binding and preflight result

| Field | Closed result |
|---|---|
| Target attestation | `PERSONAL_SYNTHETIC_NON_COMPANY_NEW_BLANK_BOUND_SHEET_SANDBOX` |
| Target kind | `PERSONAL_SYNTHETIC_DEV` |
| Script ID tracking | `false` |
| Runtime dry-run allowed | `false` |
| Blank-target preflight contract | `NEW_BLANK_BOUND_SCRIPT_V1` |
| Initial read-only remote shape | `2` files |
| Initial blank-target preflight | `PASS` |
| Canonical staged payload | `23` files |
| Canonical payload SHA-256 | `ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1` |
| Project-local clasp | `3.3.0` |

The two-file blank preflight was accepted only under the separate blank-target
contract. It did not weaken or replace the strict canonical 23-file pull-back
contract.

## Canonical remote proof

The normal interactive `clasp push` surface later reported that the script was
already current, but did not report 23 pushed files. The operator correctly did
not enter the confirmation phrase. No success was inferred from that output.

After current-head non-Google CI passed, the tracked read-only recovery command
performed one independent pull into a clean ignored directory. The resulting
closed proof was:

| Field | Closed result |
|---|---|
| Independent pull-back proof | `PASS` |
| File count | `23` |
| Byte-level parity | `PASS` |
| Pulled payload SHA-256 | `ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1` |
| Script extension contract | `GS_FIRST_CANONICAL` |
| Force flag used | `false` |
| Operator push confirmation | `NOT_RECORDED` |

The independent proof establishes canonical remote payload parity without
converting the missing operator confirmation into a claim.

## First-time Setup evidence

The operator manually ran `setupSystem` once in the newly bound synthetic
Sandbox and reported the bounded result `COMPLETE` after completing the Google
authorization flow with the approved personal, non-company account.

This is operator-reported real-Workspace evidence. No screenshot, detailed JSON,
identifier, URL, account detail, or Workspace content was retained. A `COMPLETE`
Setup result means the Setup-owned staged flow reached its completion boundary,
including its internal S90 Quick Diagnostic gate. It is not a standalone remote
runtime API invocation and does not establish Phase 8B overall PASS.

The canonical Setup contract keeps Automation disabled and does not create a
five-minute time-driven trigger. It does create the owner-authorized Task edit
trigger and the internal Setup properties required by the product. Those
Automation and trigger conditions were not independently inspected after this
manual Setup and therefore are not promoted to separate observed-runtime PASS.

## Validation and CI evidence at the parity boundary

| Check | Result |
|---|---|
| Non-Google local gate | `11/11 PASS` |
| Node regression suites | `52 PASS` |
| Canonical source inventory | `22 .gs + appsscript.json = 23 PASS` |
| Tracked secret/local-path scan | `0 hits` |
| Push-event CI at baseline head | `SUCCESS`; every job and step succeeded |
| Pull-request CI at baseline head | `SUCCESS`; every job and step succeeded |

Final evidence-commit CI and detached HTTPS fresh-clone verification are
recorded in the chat/PR completion report after this evidence is published.

## Status and NOT EXECUTED

Highest supported development status:
`READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION`.

Company status:
`NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW`.

The following remain `NOT_EXECUTED`:

- personal standard Google Cloud project linkage for this new target;
- Google Apps Script API enablement in that standard Cloud project;
- OAuth Testing/Desktop-client runtime profile configuration;
- dev-only `executionApi.access = MYSELF` overlay push and pull-back parity;
- MYSELF-only API executable deployment;
- standalone guarded remote `runQuickDiagnostic` invocation through clasp;
- Deep Diagnostic, Dashboard refresh, Task edits, Gmail import, Calendar
  reconciliation, Automation enablement, Migration, test harness, external AI,
  company environment actions, deployment to a company target, and company
  handoff.

The real Setup operation is the sole authorized exception to Instruction 0010's
earlier no-Setup boundary, based on the operator's later explicit target and
first-time-Setup direction. No other runtime scope was expanded.

## Review focus

1. Confirm that blank-target preflight and strict canonical parity remain
   separate fail-closed contracts.
2. Confirm that the independent pull-back proof establishes exactly 23 files and
   the approved payload SHA without relying on an unrecorded confirmation.
3. Confirm that Setup evidence is accurately labeled operator-reported and is
   not used to claim standalone runtime API validation or Phase 8B PASS.
4. Confirm that no secret, identifier, URL, raw output, local path, or Workspace
   content is present in tracked evidence.
