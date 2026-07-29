# Phase 8B Sandbox Retransfer — T6.1 Fresh-Clone Verification

Date: 2026-07-29

## Decision

**Status: `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`**

This status means that the non-confidential Phase 8B `2.8.6-prepilot` package
may be carried through an approved company transfer route. It does **not**
mean Phase 8B PASS, Phase 8C GO, production ready, pilot ready, deployment,
`clasp push`, OAuth consent, Automation/trigger enablement, Provider setup, or
any real Google Workspace action.

Corrected-package real Google Workspace retest remains `NOT_EXECUTED`.
Automation remains `OFF`.

## Fixed identity and lineage

| Role | SHA / relation | Result |
| --- | --- | --- |
| Instruction baseline | `3bbf52aecb491866f11d3f0502d96721b15d40d8` | retained |
| Source A6 | `8e8e3e4a5f2288985554b3467a5b68814e7bab21` | source/tests/tools/canonical docs/visualization/recovery guidance only |
| Release B6 | `49f6774242e11f3c4ae1f0881dc4a7e13c5aad23` | direct child of A6; exactly the two v2.8.6 packages and implementation report |
| Transfer T6 | `39205ff9d0a7df79f9e0892b02ab73cac1a7dc14` | retained transfer-envelope generation record |
| Fixed transfer T6.1 | `863217b99dfa1ad682a8f4dd1989212b0a8d548b` | normal-pushed; GitHub commit resolution and detached fresh-clone verification PASS |
| This closure evidence | `SELF (the commit containing this report)` | evidence-only; not a transfer target |

The historical failed P10 ref
`1a1f9df65dacf3a031409d724cb2906b58900f77`, its v2.8.5 package bytes, and
its transfer envelope remain immutable historical failure evidence. They were
not reused, overwritten, or removed.

## Fresh-clone method and scope

A new HTTPS clone was created directly from the target branch and detached at
T6.1. `core.autocrlf=false` was applied for the clone so source and immutable
package bytes are checked against their LF Git blobs. The clone HEAD and GitHub
API resolution both equaled T6.1; the clone was clean before and after checks.

An earlier diagnostic clone checked out the repository default branch first and
then switched refs under Windows `core.autocrlf=true`. Two unchanged source
blobs retained inherited CRLF working-tree bytes even though their Git blob IDs
were identical to the release payload. This created a working-tree-only raw
parity false mismatch. The direct target-branch clone above eliminates that
checkout-order artifact; raw source/package parity and independent rebuild
parity both passed. The transfer process copies immutable package files and
does not require a repository checkout.

## Exact local/static results

| Check | Result |
| --- | --- |
| All `implementation/GoogleSpreadsheet/tests/*.js` | 42 suites; 619 PASS / 0 FAIL / 11 explicit fake-runtime or real-Workspace skips |
| F016 Calendar authority-loss cases | 7/7 PASS (within a 12/12 PASS local suite) |
| `tools/validate_apps_script_v2.js` | 11/11 PASS; 22 `.gs` files; source secret scan PASS (3 reviewed synthetic fixtures only) |
| `remote_publication_consistency_test.js` with A6/B6 | 8/8 PASS |
| v2.8.6 Phase 8B verifier | 27 package files / 23 payload; source parity, checksums, provenance, secret scan, local link, `TEST_MODE=true`, Automation OFF: PASS |
| v2.8.6 Phase 8C verifier | 25 package files / 22 payload; audited transform parity, checksums, OAuth/service allow-lists, provenance, secret scan, harness/clasp exclusions, `TEST_MODE=false`, Automation OFF: PASS |
| PowerShell parser | 5/5 v2.8.6 release/transfer tools PASS |
| Transfer envelope verifier | 8 non-self files; canonical UTF-8/LF checksums, non-self inventory, secret/local-path scan: PASS |
| 8B copy allow-list | 27/27 exact package-tree paths PASS |
| 8B package checksum inventory | 26/26 non-self records and bytes PASS |
| Source A6 rebuild parity | Phase 8B 27/27 files and Phase 8C 25/25 files byte-identical to B6 packages PASS |

All results are local/static or fake-runtime evidence. No test was weakened,
deleted, skipped inappropriately, or promoted to real Google Workspace PASS.

## Package and transfer integrity

| Artifact | SHA-256 / result |
| --- | --- |
| Phase 8B canonical payload list | `e734d1d11be637e4b146b448728dd54841df0cb37f0cba53528213f2a564fbfc` |
| Phase 8C canonical payload list | `85e201759f2b7f1a962e9c1a14eeca2312b6acb7797808d7d651e03ab1a3404d` |
| Phase 8B external package tree | `1534bf2ee7215fd7b64acbc8a8b4417814dde628156b7b0912b81ad1b4effc67` |
| Phase 8C external package tree | `1a16798e0a2d26adec37e8a70d11905ff969e1f726b1e98ab1234088c5d3be1e` |
| Phase 8B `CHECKSUMS.sha256` file | `52f7808c31a8bde9441b4e258a819787607aa7c2eb73d69db196875f64450ddb` |
| Phase 8C `CHECKSUMS.sha256` file | `c05f388ffaef71da4b10a233c14c94ddb5ef37e7a830a82bc87478e11457c11b` |
| T6.1 `TRANSFER_CHECKSUMS.sha256` file | `df49be17784e2c053ffbf98f940dbb2b8c7fd758409be30c6bf02f8fa8c95ad4` |
| T6.1 canonical `TRANSFER_MANIFEST.md` record | `9b6cbb0ba7630fb50bf4511b6bf1d129f3624ac7a95e96ca00260ea1f0c482e1` |

The external tree digest is SHA-256 of path-sorted UTF-8 records in the form
`<file SHA-256><two spaces><package-relative path><LF>`. B6's historical
implementation report and original T6 manifest recorded a digest calculated
with the two fields reversed. That documentation-only discrepancy did not
alter any package byte, internal package checksum, canonical payload list, or
provenance SHA. T6.1 corrects the transfer manifest and its operator checksum;
the immutable B6 report is retained and this evidence records the authoritative
corrected external digest.

## Publication and review boundary

- The normal remote branch head resolved to T6.1 before this evidence commit.
- Draft PR #8 remains open and Draft against `main`; it is not merged.
- GitHub Actions / repository CI is not configured for this scope: `NOT EXECUTED`.
- No real Google Workspace, Apps Script import, Setup, Gmail, Calendar, OAuth,
  Provider, deployment, `clasp push`, trigger, Automation, credential, or real
  data operation was performed.
- This closure changes canonical evidence/documentation only. It must not
  change release packages, transfer contents, Apps Script source, tests, or
  tools; it is deliberately outside the fixed transfer ref.

## Remaining boundary and review focus

The required real Phase 8B Sandbox retransfer and any subsequent Workspace
acceptance are still `NOT EXECUTED`. If separately authorized later, use only
the T6.1 8B package and its Japanese transfer materials, keep Automation OFF,
use non-confidential synthetic data, and stop on any checksum, visibility,
protection, authority, or approval mismatch. Reviewers should focus on the
S20 Setup-owned Ledger control-plane ordering, the no-fallback boundary, the
T6.1 digest correction, and the fact that this status is carriage-only.
