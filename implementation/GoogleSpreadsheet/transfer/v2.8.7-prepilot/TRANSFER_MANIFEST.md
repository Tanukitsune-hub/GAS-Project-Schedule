# Phase 8B v2.8.7 Sandbox retransfer manifest

## Identity and immutable boundaries

| Field | Value |
|---|---|
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Code / Schema / AI / Migration | `2.8.7-prepilot` / `2.6` / `2.0` / `3` |
| Permitted package | `implementation/GoogleSpreadsheet/release/v2.8.7-prepilot/` only |
| Source A7 | `be2e551da310a9b7c0611f3aef8899309a3d7b69` |
| Release B7 | `95bc7240d99124b245e188b8e646eccf6c3ead48` |
| Fixed transfer ref | `SELF (the Git commit containing this transfer envelope)` |
| Historical baseline for patch comparison | T6.1 `863217b99dfa1ad682a8f4dd1989212b0a8d548b` |
| Automation | `OFF` |
| Package test mode | `true` |

This envelope is separate from the immutable release package. It must not alter
package bytes. v2.8.5/P10 and v2.8.6/T6.1 artifacts remain historical evidence
and must not be overwritten, re-used as an executable target, or copied as a
whole-repository replacement.

## Package integrity

| Item | Value |
|---|---|
| Phase 8B package files / payload files | `27 / 23` |
| Canonical payload SHA-256 | `a0d28ba0d4ba15581f011e62d84aab4c05b1f55c6018b78add9d9c872ba572a8` |
| Phase 8C package | excluded |
| Package validation | source parity, checksum, allow-list, provenance, and secret scan PASS locally |

Use `COPY_ALLOWLIST.txt` for the only permitted package-relative files.
Use package `CHECKSUMS.sha256` for the package and `TRANSFER_CHECKSUMS.sha256`
for this operator folder. `COMPANY_PC_PATCH_MANIFEST_ja.md` and its JSON
companion are raw-Git-blob comparisons against T6.1 and are the only authority
for a manual company-PC payload replacement list.

## v2.8.7 correction and safe resume contract

The correction covers exact Setup-owned Dashboard control-plane/three-row seed
recognition, Task header rows 1–2 across 50 columns, schema-driven validation
of all five checkbox fields, and native Sheets blank checkbox Boolean `false`
semantics. Genuine foreign controls/content remain fail-closed. Quick
Diagnostic is read-only.

The current Sandbox is treated as S00–S80 complete and S90/S99 incomplete.
The correction revalidates controls and resumes only S90 then S99. It must not
duplicate or delete Gmail labels, the dedicated Calendar, Properties, or the
owner edit trigger. Automation and a five-minute trigger remain OFF.

At T7 generation this remains a local transfer candidate; corrective-package
real Workspace retest is `NOT_EXECUTED`. It is not Phase 8B PASS, Phase 8C GO,
production ready, or pilot ready.
