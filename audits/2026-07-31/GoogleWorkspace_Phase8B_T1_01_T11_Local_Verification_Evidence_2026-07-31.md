# T11 local publication evidence — Phase 8B T1-01 bounded-summary remediation

Date: 2026-07-31
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Instruction: `instructions/0003_GoogleWorkspace_Phase8B_T1_01_Warn6_Diagnostic_Summary_Visibility_Remediation_2026-07-31.md`

## Immutable lineage

| Role | Commit |
|---|---|
| Source A11 | `0e572ed77ec9af24b3962ca6df5b64a6d37db26a` |
| Corrected Source A11.1 | `aeca148415d70df625400e53d2281378adff60b4` |
| Release B11 | `952438907e1a09092a46127dc130b3403a911db4` |
| Fixed transfer T11 | `a3b5a5d8d851bf2d15a2738c54dc6bb31e231d33` |
| Local evidence E11 | `SELF (the Git commit containing this evidence)` |
| Historical fixed transfer | T10 `927d8567bce64461840cc6f72fbae0c1e636a8e6` (immutable) |

Each commit is a direct child of the preceding applicable commit. B11 contains
only the two v2.8.11 package directories and the implementation report. T11
contains only the flat 11-file transfer envelope. E11 contains only this
non-sensitive local-verification evidence.

## Completed local verification

| Check | Result |
|---|---|
| Node test suites | 48/48 PASS; real Google Workspace `NOT_EXECUTED` |
| Apps Script validator | 11/11 PASS over 22 `.gs` files |
| Phase 8B package verifier | payload parity, checksums, provenance, secret scan, TEST_MODE=true, Automation OFF: PASS |
| Phase 8C package verifier | audited transform parity, checksums, allow-lists, provenance, secret scan, TEST_MODE=false, Automation OFF: PASS |
| T11 patch-manifest verifier | raw-blob parity, transfer checksums, completed-Sandbox resume contract, Automation OFF: PASS |
| T10 -> B11 byte comparison | 5 modified payload files; 18 unchanged; `appsscript.json=false` |
| T11 transfer envelope | exact flat 11 files; all generated transfer checksums PASS |

## Deterministic company-PC replacement set

| Order | File | T10 SHA-256 | B11 SHA-256 |
|---:|---|---|---|
| 1 | `00_Config.gs` | `06d5c64d55bdfa8c49e6ebe60f92867bb8864a713611f251fa4cb5ac1448cb0e` | `d61390db1f52744b36b06865fa70d3aaa6c4fafe0316a138ff0bfb939345e868` |
| 2 | `02_Setup.gs` | `46baf94979ebef33f6350bc4016fea2282a7cf4a3f45a94b2962500065df010f` | `e2b5bcc42e54e3413fe8b11ce19ac805c0736c170d050c320ba5e9c37cb9dbba` |
| 3 | `15_Dashboard.gs` | `5a6311f8a5fb61ed498af5961f946639e656b32437eddea8c7b0901a630845cc` | `c18be435239c3468493971baab82fe746de4210f7513b1677eadff3b00405353` |
| 4 | `16_Diagnostics.gs` | `c299030a10893f9d8360ccbe9b0be9149ab9bf91a12b215ea2880acc9e1a5382` | `b69eff8cc567969bf2fa00b6347009b7fdb0b38e06aa867684e8a7666c000c8c` |
| 5 | `Menu.gs` | `77e4141eb834276c475f1a4f76ab0d6cef4d49410464f2b6ad86be3303ccdaed` | `d96d7b9ba6a35cd1a9d0309fb0375699e1b1f89fbd851da86b26e680cbb59c15` |

No payload file was added or removed. `appsscript.json` is byte-identical.
The generated T11 patch manifest is the operator source of truth; this table
is a non-sensitive duplicate of its closed hash evidence.

## Scope and status boundary

Remote normal push, remote SHA resolution, and detached HTTPS fresh-clone
verification remain `NOT_EXECUTED` at this local-evidence point. Therefore the
canonical source-stage gate remains `PHASE8B_SANDBOX_NO_GO_T1_01_SUMMARY`.
This evidence does not authorize a real Workspace action, T1-01 PASS, T1-02,
Phase 8B overall PASS, Phase 8C GO, production ready, or pilot ready.
