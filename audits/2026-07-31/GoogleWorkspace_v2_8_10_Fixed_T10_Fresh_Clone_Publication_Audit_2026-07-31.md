# v2.8.10 Fixed T10 Fresh-Clone Publication Audit

Date: 2026-07-31  
Repository: `Tanukitsune-hub/GAS-Project-Schedule`  
Branch: `codex/r5-independent-reaudit-transfer-prep`  
Audit mode: local static/VM, package verification, normal Git publication, and
detached HTTPS fresh-clone verification  
Real Google Workspace: `NOT_EXECUTED`

## Result

Highest status: `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`

This status authorizes controlled carriage of the exact non-sensitive fixed
T10 Phase 8B envelope only. It is not Phase 8B PASS, Phase 8C GO, production
ready, or pilot ready. Automation remains `OFF`.

No unresolved Critical, High, or transfer-safety Medium finding was found by
the required local, package, remote, and fixed-ref checks. The corrected
package has not been imported or run in a real Google Workspace.

## Version and lineage

| Record | SHA | Parent / boundary |
|---|---|---|
| Instruction | `56fff00bab0b272640ce89c90ffda8a60968e56b` | sole task specification |
| Source A10 | `33b9ecee5b0957615fcc27fc822bf7d10a74c86f` | direct child of instruction; 43 source/test/tool/current-document paths; no v2.8.10 package, release report, or transfer envelope |
| Release B10 | `3f4fe6c52be7bf9c66ad221594e6271feebb57ed` | direct child of A10; exactly both release trees and the implementation report, 53 paths |
| Fixed transfer T10 | `927d8567bce64461840cc6f72fbae0c1e636a8e6` | direct child of B10; exactly the flat 11-file transfer envelope |
| Evidence E10 | `SELF (this evidence-only commit)` | direct child of T10; current documentation and this evidence only; not a transfer target |

Before E10, the remote target branch and `git ls-remote` both resolved exactly
to T10. A new HTTPS clone checked out T10 as a detached, clean HEAD. Source,
release, and transfer boundary tests passed before this evidence commit.

Contract: Code `2.8.10-prepilot`; Schema `2.6`; AI Schema `2.0`; Migration
`3`; Phase 8B `TEST_MODE=true`; Automation `OFF`.

## Confirmed cause and correction

The real Sandbox repeated the bounded 17-by-3, 51-cell Dashboard
number-format finding after v2.8.9. The immutable v2.8.9 implementation queued
the Setup-owned format write and immediately performed its strict readback
without `SpreadsheetApp.flush()` or a newly acquired Range. Its fake runtime
applied writes synchronously and therefore did not model Apps Script pending
write visibility.

v2.8.10 preserves every ownership, Protection, seed/marker, schema, and
non-format fail-closed precondition. Only Setup may normalize the exact system
block. An actual write is followed by exactly one flush, a fresh exact Range,
and a strict 51-cell postcondition. A canonical block performs no write and no
flush. Flush absence/failure or a noncanonical reread fails closed as
`E_DASHBOARD_NUMBER_FORMAT_POSTCONDITION` with bounded evidence.

Config, Setup, and Dashboard independently expose
`WORK_OS_V2_S90_CONTRACT_2_8_10`. Any mismatch fails before a format write as
`E_MODULE_VERSION_SKEW`. Quick and Deep Diagnostic remain read-only.

## Exact verification

| Verification | Result |
|---|---|
| All Node suites in fixed-T10 detached clone | `47/47` suites; `679 PASS / 0 FAIL / 11 explicit SKIP` |
| Buffered-write / flush suite | `22 PASS / 0 FAIL` |
| Dashboard native/surface suite | `17 PASS / 0 FAIL` |
| Module-skew suite | `5 PASS / 0 FAIL` |
| Quick Diagnostic real-runtime-equivalent suite | `6 PASS / 0 FAIL` |
| Setup Ledger/resume suite | `10 PASS / 0 FAIL` |
| Calendar F015 / F016 fault injection | `F015 5 PASS + F016 7 PASS = 12 PASS / 0 FAIL` |
| General CAS fault injection | `5 PASS / 0 FAIL` |
| Canonical-document consistency | `4 PASS / 0 FAIL`, including synthetic stale T8/T9/path negatives |
| Apps Script validator | `11 PASS / 0 FAIL`; 22 `.gs` files |
| Remote publication consistency through T10 | `10 PASS / 0 FAIL` |
| Phase 8B verifier | PASS: source parity, checksum, provenance, secret scan, `TEST_MODE=true`, Automation OFF |
| Phase 8C verifier | PASS: audited TEST_MODE transform only, checksum, OAuth/advanced-service allow-lists, provenance, secret scan, harness/clasp excluded, Automation OFF |
| Independent rebuild | Phase 8B `27/27` and Phase 8C `25/25` files raw-byte identical; zero mismatch |
| Phase 8B copy allow-list | `27/27` exact package files |
| Patch-manifest verifier | PASS: raw Git blob comparison, checksums, resume contract |
| Transfer verifier | PASS: 11 total files, 10 canonical checksum records, checksum file excludes itself |
| Explicit secret/local-path/real-Workspace URL scan | 0 hits |
| Fixed-ref publication | remote branch and HTTPS detached clone resolve exact T10; clone clean |

The 11 SKIPs are explicit historical Apps Script/real-environment harness
boundaries. They were not deleted, weakened, or promoted to PASS.

The immutable B10 implementation report describes the combined Calendar
fault-injection result as F016 12 PASS. The precise split is F015 5 PASS and
F016 7 PASS, for 12 total. This evidence record corrects that label without
rewriting B10.

## Release and transfer hashes

Both packages were independently rebuilt with preparation timestamp
`2026-07-30T16:15:11Z`.

| Artifact | SHA-256 |
|---|---|
| Phase 8B canonical payload | `7ba8aef0b54b29cf604f0d43e1f742448e1d4a29a82c10a674cee4d8ad6237f9` |
| Phase 8B `CHECKSUMS.sha256` file | `9a4d0c121aba69277e984e8e933b0489dd0f5295b1863ab4c533af03deda13ff` |
| Phase 8B deployment manifest | `2812bbdc246300f53f56a0aff37eeb7d814088329d9a029fb2e8d29bfab56d18` |
| Phase 8C canonical payload | `03a7c87b0920a7c48a0dca6ca2029fa4b49314f57c4a22c904d6176a7e583701` |
| Phase 8C `CHECKSUMS.sha256` file | `5e4fcd4bd1a3dc39a45645b99bf8d542a256b17dce9eadd694a2bf18fb822688` |
| Phase 8C deployment manifest | `a30e48332ba813814c32a5e40e31db89be7960b1fee157d02282a6f7f0f78eb6` |
| Transfer checksum inventory file, raw SHA-256 | `18b1571e207596d2124a088d4e2d29babf0712b57c5233eec9496f886e4892f1` |
| Patch manifest JSON, canonical-text SHA-256 | `2a8463d724cf9c998d5a323770df5441000c16cf574bc7f1a4ba9796d78c1b51` |
| Patch manifest JSON, checkout raw SHA-256 | `18bcdbb6ad47a60677b0634f1e493b4c58d1434aece04cf3eb5b37ef3509d932` |
| Japanese patch manifest, canonical-text SHA-256 | `391db28e8db644b944f78b7c3b169aa5557fbc5e1ce51859671576ed7d55abb2` |
| Transfer manifest, canonical-text SHA-256 | `1e41f9e1d5d0b1612f6946ada0e607abeb8099e1c4508f0b7e77d4b35d1bb07d` |

## Company-PC patch derived from fixed T9

Baseline fixed T9:
`781f408fcf0853a5fffee9c00d3022ee5e17b1d7`.

Comparison method: raw Git blob bytes from fixed T9 to final B10 payload.
There are 3 modified files, 20 unchanged files, and no added or removed file.
`appsscript.json` is unchanged.

| Order | File | Old SHA-256 | New SHA-256 |
|---:|---|---|---|
| 1 | `00_Config.gs` | `eb1aa7bf6be9ee78499dc635c36c930f021eeb3879541c90904d4d166d06e576` | `06d5c64d55bdfa8c49e6ebe60f92867bb8864a713611f251fa4cb5ac1448cb0e` |
| 2 | `02_Setup.gs` | `b1e8279e9266806988f9a4fc632d25e472da540808c0a98de6685abfc146a711` | `46baf94979ebef33f6350bc4016fea2282a7cf4a3f45a94b2962500065df010f` |
| 3 | `15_Dashboard.gs` | `4d4f7f71ebb3ba8529f940af4ef370b2a1b482b005445514aeb01aa9a874020f` | `5a6311f8a5fb61ed498af5961f946639e656b32437eddea8c7b0901a630845cc` |

The approved safe resume point remains S00 through S80 complete, with S90 and
S99 incomplete. The transfer instructions prohibit manual repair and preserve
Gmail labels, the dedicated Calendar, Properties, owner edit trigger, Task and
Ledger data, Automation OFF, and the absence of a five-minute trigger.

## Current-document and evidence boundary

The four machine-readable current-transfer contracts now agree on Code
2.8.10, Schema 2.6, AI Schema 2.0, Migration 3,
`READY_FOR_PHASE8B_SANDBOX_RETRANSFER`, exact fixed T10, and
`implementation/GoogleSpreadsheet/transfer/v2.8.10-prepilot/`.

E10 changes current publication documents and this new audit only. It changes
no executable source, test, tool, release package, transfer envelope,
checksum, or historical artifact. Protocol, recovery, package, and release
documents that intentionally record their Source A10 or B10 pre-publication
stage remain immutable stage evidence; they are not the current
publication-contract block.

## NOT_EXECUTED and review boundary

The following remain `NOT_EXECUTED`: real Google Workspace retransfer/retest,
OAuth consent, Apps Script import, Setup, Quick/Deep Diagnostic, Dashboard
refresh, Gmail/Calendar operations, deployment, `clasp push`, Provider
configuration, Automation/trigger enablement, real data, and company-PC
carriage. GitHub Actions/CI is not configured for this scope and did not run.

Review focus:

1. exactly-one-flush and fresh-Range postcondition after an actual Setup write;
2. zero-write/zero-flush canonical and Diagnostic paths;
3. fail-closed module skew before any write;
4. bounded Setup evidence and S00-S80 resource invariants;
5. A10 -> B10 -> T10 -> E10 boundaries and exact three-file patch manifest;
6. carriage-only interpretation of `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`.
