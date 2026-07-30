# v2.8.9 Fixed T9 Fresh-Clone Publication Audit

Date: 2026-07-30  
Repository: `Tanukitsune-hub/GAS-Project-Schedule`  
Audit mode: detached HTTPS fresh clone; local synthetic/static evidence only

## Immutable lineage

| Role | Commit |
|---|---|
| Source A9 | `a448b8d856abd5eb32baa60117f5fdb9f8e56de9` |
| Corrected Source A9.1 | `4a145588b01a5f7ae7e9bce86efb9bd5b3d8345d` |
| Corrected Release B9.1 (direct child of A9.1) | `b451d2361db99b4efbde036dafa3e2baf6b5cb97` |
| Fixed transfer T9 (direct child of B9.1) | `781f408fcf0853a5fffee9c00d3022ee5e17b1d7` |

The initial A9/B9 local artifacts are retained. A9.1 corrects only the
v2.8.9 patch-manifest default baseline from historical T7 to fixed T8; it does
not alter the Apps Script payload or any historical package/transfer artifact.

## Boundary verification

- A9 excludes the v2.8.9 release packages, release report, and transfer
  envelope.
- B9.1 is a direct child of A9.1 and changes only both v2.8.9 release package
  directories plus the number-format implementation report.
- T9 is a direct child of B9.1 and changes only
  `implementation/GoogleSpreadsheet/transfer/v2.8.9-prepilot/` (11 files).
- The normal non-force remote branch update resolved fixed T9 from GitHub.

## Fresh-clone results

- All Node tests: `45` suites / `658` passing assertions / `0` failures.
- `phase8b_dashboard_number_format_real_runtime_test.js`: `12` PASS.
- F015/F016 Calendar/authority failure injection: `12` PASS.
- `tools/validate_apps_script_v2.js`: `11` PASS over `22` `.gs` files.
- 8B verifier: source parity, checksum, provenance, secret scan, and
  Automation OFF: PASS.
- 8C verifier: parity, checksum, allow-list, provenance, secret scan,
  TEST_MODE transform, and Automation OFF: PASS.
- Patch-manifest verifier: raw Git-blob parity, checksums, safe-resume
  contract, and Automation OFF: PASS.
- Package/transfer secret, local-path, and real-ID scan: PASS; the package
  verifier separately allow-lists official OAuth scopes and reviewed synthetic
  test fixtures.

## Release and transfer hashes

| Item | SHA-256 |
|---|---|
| 8B canonical payload list | `8fae6fba81d29e1783b5579ddbcb9d995408402f3b6925865ee8024658128cf8` |
| 8C canonical payload list | `27e02eca5c97ace2e093a02995a35be9c30f63a8f8297a2275c27bf3c5282b6a` |
| T9 patch manifest JSON | `02452f6357a2769a0be1aff85f0590ce2c520f9f47f630f115d92cc6e03df1a4` |
| T9 patch manifest Japanese guide | `1d668afbab724a07475dffce5c7047a435d90d5c150cc454f534361e94599628` |
| T9 transfer manifest | `4f699389fd0cb2ee8410593e0b5059b58aad7460257ccc8a25234a15aaf2daaf` |

## Company-PC patch boundary

The raw Git-blob comparison uses fixed T8
`69f843f6ea426ccb45d721a40508a35b0a59795d` and corrected Release B9.1. Only
these payload files change; no file is added or removed, and
`appsscript.json` is unchanged.

The generated patch manifest intentionally records `new_fixed_ref` as `SELF`:
the T9 SHA cannot exist before the transfer commit is created. Detached clone
HEAD resolves that self-reference to fixed T9 above; the manifest verifier
requires this protocol value.

| File | Old SHA-256 | New SHA-256 |
|---|---|---|
| `00_Config.gs` | `4718462506c1b417269552e2859e7c4f90f98583b0075fbdf14a940c39dff152` | `eb1aa7bf6be9ee78499dc635c36c930f021eeb3879541c90904d4d166d06e576` |
| `02_Setup.gs` | `4d7adcb1fc1d963d39fda6fa323f16d2be006f3de0e081d67512be13a5da1eea` | `b1e8279e9266806988f9a4fc632d25e472da540808c0a98de6685abfc146a711` |
| `15_Dashboard.gs` | `3e15db636b1cb501b07840ce5c0a37c553b78669eb9869cd3c8cdfd0caa16d7b` | `4d4f7f71ebb3ba8529f940af4ef370b2a1b482b005445514aeb01aa9a874020f` |

## Status and remaining external evidence

The highest status is `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`. This means only
that the non-sensitive Phase 8B Sandbox package may be carried for a future,
separately authorized retransfer. It does not declare Phase 8B PASS, Phase 8C
GO, production readiness, or pilot readiness.

Real Google Workspace, OAuth, Apps Script import, Setup, Diagnostics,
Dashboard refresh, Gmail, Calendar, deployment, `clasp push`, Automation or
trigger enablement, Provider configuration, and real data remain
`NOT_EXECUTED`.
