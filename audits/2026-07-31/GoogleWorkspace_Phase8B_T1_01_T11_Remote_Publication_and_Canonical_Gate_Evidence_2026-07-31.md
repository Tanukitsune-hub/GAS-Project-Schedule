# Phase 8B T1-01 / T11 Remote Publication and Canonical Gate Evidence

Date: 2026-07-31
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Remote branch: `codex/r5-independent-reaudit-transfer-prep`
Instruction: `0003_GoogleWorkspace_Phase8B_T1_01_Warn6_Diagnostic_Summary_Visibility_Remediation_2026-07-31.md`

## Scope

This is evidence and canonical-documentation only. It records that the
already-created v2.8.11 Source/Release/Transfer/Evidence chain was normally
published and independently checked from a detached HTTPS clone. It changes
no Apps Script source, tests, tools, release package, transfer envelope,
checksum, or historical artifact. It is not a transfer target.

## Immutable and published lineage

| Role | Commit | Boundary |
|---|---|---|
| Historical fixed transfer | `927d8567bce64461840cc6f72fbae0c1e636a8e6` | Immutable T10; not modified. |
| Corrected Source A11.1 | `aeca148415d70df625400e53d2281378adff60b4` | Source, tests, tools, canonical docs, audit, and visualization; no v2.8.11 package/transfer. |
| Release B11 | `952438907e1a09092a46127dc130b3403a911db4` | Direct child of A11.1; only `release/v2.8.11-prepilot/`, `release/v2.8.11-prepilot-phase8c/`, and the implementation report. |
| Fixed Transfer T11 | `a3b5a5d8d851bf2d15a2738c54dc6bb31e231d33` | Direct child of B11; flat 11-file transfer envelope only. |
| Local Evidence E11 | `908476ac716d3a3b6bdf35cd814dede1f2b0e411` | Direct child of T11; local verification evidence only. |

The remote branch resolved E11 as
`908476ac716d3a3b6bdf35cd814dede1f2b0e411` after a normal non-force push.
The documentation-only commit containing this record is a later evidence
record; it is not part of T11 and does not change its payload or hashes.

## Detached HTTPS-clone verification of E11

The detached HTTPS clone resolved E11 exactly and verified the following:

| Check | Result |
|---|---|
| Git lineage A11.1 -> B11 -> T11 -> E11 | PASS |
| Full Node suites | `48/48 PASS` |
| Apps Script static validator | `11/11 PASS` across 22 `.gs` files |
| F016 Calendar CAS failure-injection suite | `12/12 PASS` |
| Remote-publication consistency | `10/10 PASS` |
| v2.8.11 main release verifier | PASS |
| v2.8.11 Phase 8C package verifier | PASS |
| Source/package and independent rebuild parity | PASS |
| T11 raw-blob patch-manifest verifier | PASS |
| Package checksum, allow-list, and package-tree checks | PASS |
| Transfer checksum records | `10/10 PASS` |
| Secret, local-path, and real-ID scan | PASS; only reviewed synthetic fixture markers were excluded |
| Fresh clone working tree | clean |

No real Google Workspace operation, OAuth, Apps Script import, Setup,
Diagnostic, Dashboard refresh, Gmail, Calendar, deployment, `clasp push`,
Automation/trigger enablement, Provider configuration, or use of real data was
performed for this evidence.

## Closed observed T1-01 evidence retained

The only reported real-Workspace T1-01 observation remains closed evidence:

| Field | Value |
|---|---|
| Reported result | `77 PASS / 6 WARN / 0 FAIL` |
| Execution status | `REVIEW_REQUIRED` |
| Complete WARN-ID visibility | `false` |
| Sixth WARN ID | Not inferred, not recorded, and not promoted. |
| Read-only side-effect status | Closed Boolean summary required before capped details. |
| Task aggregate | 50 physical columns with closed schema-ID/header states. |
| Ledger aggregate | 21 physical columns; hidden/protected/validator states required. |

## Current narrow gate and retransfer boundary

The current gate is `READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER`.
It authorizes only a separately controlled, hash-verified T11 carriage and a
single read-only T1-01 Quick Diagnostic summary re-observation on the already
completed Sandbox. It does **not** authorize Setup, S90/S99 rerun, Dashboard
refresh, Gmail, Calendar reconciliation, Properties changes, trigger work,
Automation, repair, T1-02 through T1-08, Phase 8B overall PASS, Phase 8C GO,
production ready, or pilot ready.

The required T10-to-B11 raw-byte replacement set remains exactly five files:

| Order | File | T10 SHA-256 | B11 SHA-256 |
|---:|---|---|---|
| 1 | `00_Config.gs` | `06d5c64d55bdfa8c49e6ebe60f92867bb8864a713611f251fa4cb5ac1448cb0e` | `d61390db1f52744b36b06865fa70d3aaa6c4fafe0316a138ff0bfb939345e868` |
| 2 | `02_Setup.gs` | `46baf94979ebef33f6350bc4016fea2282a7cf4a3f45a94b2962500065df010f` | `e2b5bcc42e54e3413fe8b11ce19ac805c0736c170d050c320ba5e9c37cb9dbba` |
| 3 | `15_Dashboard.gs` | `5a6311f8a5fb61ed498af5961f946639e656b32437eddea8c7b0901a630845cc` | `c18be435239c3468493971baab82fe746de4210f7513b1677eadff3b00405353` |
| 4 | `16_Diagnostics.gs` | `c299030a10893f9d8360ccbe9b0be9149ab9bf91a12b215ea2880acc9e1a5382` | `b69eff8cc567969bf2fa00b6347009b7fdb0b38e06aa867684e8a7666c000c8c` |
| 5 | `Menu.gs` | `77e4141eb834276c475f1a4f76ab0d6cef4d49410464f2b6ad86be3303ccdaed` | `d96d7b9ba6a35cd1a9d0309fb0375699e1b1f89fbd851da86b26e680cbb59c15` |

`appsscript.json` is unchanged. All other payload files are unchanged. The
authoritative operator procedure and transfer checksums are in
`implementation/GoogleSpreadsheet/transfer/v2.8.11-prepilot/`.

## Review focus

1. Confirm every summary ID is safely observable before detail truncation and
   that `warn_ids_complete` / `fail_ids_complete` fail closed.
2. Confirm the original sixth WARN ID is never inferred from the historical
   `77/6/0` evidence.
3. Confirm T11 replaces only the five listed SHA-256-matched files and never
   reruns Setup on the completed Sandbox.
4. Treat any missing, malformed, duplicate, or overflowed summary data as
   `REVIEW_REQUIRED` with STOP/no repair/no retry.
