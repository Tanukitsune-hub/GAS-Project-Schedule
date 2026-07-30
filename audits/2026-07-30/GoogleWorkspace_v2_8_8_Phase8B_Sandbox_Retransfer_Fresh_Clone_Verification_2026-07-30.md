# v2.8.8 Phase 8B Sandbox Retransfer — Fresh Clone Verification

Date: 2026-07-30

## Status

`READY_FOR_PHASE8B_SANDBOX_RETRANSFER`

This status permits controlled carriage of the exact non-confidential Phase 8B
package only. It is not Phase 8B PASS, Phase 8C GO, production ready, or pilot
ready.

## Fixed lineage

| Record | SHA / relation |
|---|---|
| Instruction | `c808e1c666e7836639a20f026ddf985e20498e8d` |
| Source A8 | `4140054b03c850f4a1e669b3aa562b305ef78bf5` |
| Release B8 | `a17d34422ed521cee81340902d9a19e2da372201`; direct child of A8 |
| Fixed transfer T8 | `69f843f6ea426ccb45d721a40508a35b0a59795d`; direct child of B8 |
| Evidence commit | `SELF (this evidence-only commit)`; not a transfer target |

The target branch was updated by a normal non-force fast-forward from the
instruction commit to T8. GitHub resolved A8, B8, and T8 to the exact SHAs.
A new HTTPS clone checked out T8 detached with a clean working tree.

## Confirmed root cause

v2.8.7 required `getEditors().length === 1` for Dashboard Protection
ownership. Apps Script may represent the Spreadsheet owner's inherent edit
capability with `Protection.canEdit()` while omitting the owner from the
ordinary explicit-editor list.

v2.8.8 requires internally equal non-null owner/effective-user identities and
`canEdit() === true`; it accepts either zero explicit editors for the proven
implicit owner or exactly the explicit owner. Null owner / Shared Drive,
different effective user, `canEdit=false`, blank/foreign/multiple editors,
warning-only, domain edit, target audiences, duplicate/wrong Protection,
unprotected ranges, and foreign/overlapping Protection remain fail-closed.

## Exact fresh-clone results

| Check | Result |
|---|---|
| All Node suites | 44 suites; 646 PASS / 0 FAIL / 11 explicit SKIPPED |
| Dashboard native-runtime suite | 17 PASS / 0 FAIL |
| Prior Quick Diagnostic suite | 6 PASS / 0 FAIL |
| Setup Ledger/resume suite | 10 PASS / 0 FAIL |
| Calendar F015/F016 suite | 12 PASS / 0 FAIL |
| Remote publication consistency | 8/8 PASS with fixed A8/B8 parameters |
| Apps Script validator | 11/11 PASS over 22 `.gs` files |
| Phase 8B package | 27 files / 23 payload; parity, checksum, secret scan, provenance PASS |
| Phase 8C candidate | 25 files / 22 payload; audited TEST_MODE transform, Harness/clasp exclusion, checksum, scope/service allow-list, secret scan, provenance PASS |
| Independent HTTPS rebuild | raw-byte parity PASS for all 27 Phase 8B and 25 Phase 8C files |
| Company-PC patch manifest | fixed T7 vs B8 raw Git blob parity PASS; 3 changed / 20 unchanged |
| Phase 8B copy allow-list | 27/27 exact |
| Transfer envelope | 11 files; 10 non-self canonical checksum records PASS |
| Current canonical artifact scan | 53 files; secret, credential, local-path, real Workspace URL/client-ID patterns PASS |

The 11 explicit SKIPPED cases preserve the real Workspace / Provider boundary.
No failing test was removed, weakened, or promoted to PASS.

## Package hashes

| Artifact | SHA-256 |
|---|---|
| Phase 8B canonical payload | `fa8c0d2c070c32f818203f936e2df4b2b2d5c2f51e52e93b79ed48cc8ad7da57` |
| Phase 8C canonical payload | `cddefd8153de1e53a04261bfbe9758845843f07079c696a61b7b8455bbc333ac` |
| Phase 8B package tree | `55015714239242dcd4154acb8ccdb6f0736c624763e58ada61e0dbecab5b76e5` |
| Phase 8C package tree | `7971c09ddc1f848ecddf6630cce33f76fab43a7d2bd10592dd037bfe1aa370cb` |
| Transfer tree | `ba906ab3a7a38e9085ed3b52f019402e5400ffeb71c9a1772ae5f78b2509cf8c` |
| Phase 8B `CHECKSUMS.sha256` file | `93006361d8c1117689676832bb6007b3101ca2c4de38412d25f2b87be43ddf06` |
| Phase 8C `CHECKSUMS.sha256` file | `44670c5d53392057abbc6dcf1451adb8230b93f9b65bc94be53a984f07802a6e` |
| `TRANSFER_CHECKSUMS.sha256` file | `dcc050c2c89be700f12bef172214ceb60b709f956aeea7349bb38df056733b96` |
| Company-PC JSON manifest | `4a15e7c10be30036ac118b046c3468f445992c9aa340374e3f8dc25840205dfb` |

## Company-PC raw-byte patch

| File | Old T7 SHA-256 | New v2.8.8 SHA-256 |
|---|---|---|
| `00_Config.gs` | `a0c5f8a26d2211bb6c57da0712da0ae61f372404856136c12a949b35c9e0c8a2` | `4718462506c1b417269552e2859e7c4f90f98583b0075fbdf14a940c39dff152` |
| `15_Dashboard.gs` | `fa2cb636997aa756b7f804b14672f9ac9a80944c5b36e09bb17380eb7b67bc42` | `3e15db636b1cb501b07840ce5c0a37c553b78669eb9869cd3c8cdfd0caa16d7b` |
| `16_Diagnostics.gs` | `22b4d57fa491c9b3ddc08dc5bccfaa5dd91ca36700137b081cb67c492ce6c8f0` | `c299030a10893f9d8360ccbe9b0be9149ab9bf91a12b215ea2880acc9e1a5382` |

`appsscript.json` is byte-identical and must not be replaced. The remaining
20 payload files are also byte-identical.

## Evidence-only changed-file boundary

This evidence commit updates only current canonical Markdown, current
visualization metadata, and this audit. It changes no Apps Script source,
test, tool, release package, transfer envelope, checksum, implementation
report, or historical artifact. The evidence commit itself is not a transfer
target; fixed T8 remains the exact carriage ref.

## NOT_EXECUTED

Real Google Workspace retransfer/retest, company-PC carriage, OAuth consent,
Apps Script import, Setup, Quick/Deep Diagnostic, Dashboard refresh, Gmail,
Calendar, deployment, `clasp push`, Provider configuration, Automation /
trigger enablement, and real-data use remain `NOT_EXECUTED`.

## Review Focus

1. Confirm the owner/effective-user/`canEdit()` proof and the two accepted
   closed access modes do not admit foreign or broader access.
2. Confirm every Dashboard control/data/format conflict remains fail-closed
   with only safe enum/count diagnostics.
3. Confirm the Source A8 / direct-child Release B8 / fixed T8 boundaries and
   raw-byte three-file company-PC patch manifest.
4. Confirm S00–S80 resource invariants, Automation OFF, and the absent
   five-minute trigger remain protected by regression tests.
