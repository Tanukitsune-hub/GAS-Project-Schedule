# Phase 8B v2.8.10 Sandbox retransfer manifest

## Identity and immutable boundaries

| Field | Value |
|---|---|
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Code / Schema / AI / Migration | `2.8.10-prepilot` / `2.6` / `2.0` / `3` |
| Permitted package | `implementation/GoogleSpreadsheet/release/v2.8.10-prepilot/` only |
| Source A10 | `33b9ecee5b0957615fcc27fc822bf7d10a74c86f` |
| Release B10 | `3f4fe6c52be7bf9c66ad221594e6271feebb57ed` |
| Fixed transfer ref | `SELF (the Git commit containing this transfer envelope)` |
| Historical baseline for patch comparison | T9 `781f408fcf0853a5fffee9c00d3022ee5e17b1d7` |
| Automation | `OFF` |
| Package test mode | `true` |
| Real Workspace retransfer/retest | `NOT_EXECUTED` |

This envelope is separate from the immutable release package and does not
alter package bytes. v2.8.5/P10, v2.8.6/T6.1, v2.8.7/T7, v2.8.8/T8, and
v2.8.9/T9 artifacts remain immutable historical evidence and must not be
overwritten or reused as an executable target.

## Package integrity

| Item | Value |
|---|---|
| Phase 8B package files / payload files | `27 / 23` |
| Canonical payload SHA-256 | `7ba8aef0b54b29cf604f0d43e1f742448e1d4a29a82c10a674cee4d8ad6237f9` |
| Phase 8C package | excluded |
| Package validation | source parity, checksum, allow-list, provenance, and secret scan PASS locally |

Use `COPY_ALLOWLIST.txt` for the only permitted package-relative files. Use
package `CHECKSUMS.sha256` for package files and
`TRANSFER_CHECKSUMS.sha256` for this operator folder.
`COMPANY_PC_PATCH_MANIFEST_ja.md` and its JSON companion are raw-Git-blob
comparisons between fixed T9 and Release B10 and are the only authority for the
manual company-PC replacement list.

## v2.8.10 correction and safe resume contract

The correction keeps the established native Protection and deterministic
number-format contracts. Only after exact Dashboard ownership, seed/owned
marker, every non-format surface, and one matching Config/Setup/Dashboard
module contract are proven safe may Setup write the exact 17×3 system block.
After an actual write it calls `SpreadsheetApp.flush()`, reacquires a fresh
exact Range, and requires the canonical 51-cell postcondition before invoking
the read-only Quick Diagnostic. Module skew fails before a write as
`E_MODULE_VERSION_SKEW`; an unavailable/failed flush, fresh-Range/read failure,
or noncanonical postcondition fails as
`E_DASHBOARD_NUMBER_FORMAT_POSTCONDITION`.

Foreign editor, domain edit, target audience, duplicate/wrong Protection,
unprotected ranges, foreign content, and every genuine Dashboard
value/formula/validation/note/merge/hidden/background/font/number-format/name/
seed-marker conflict remain fail-closed. Diagnostic output and persisted Setup
evidence are limited to closed enums, Booleans, and counts; Diagnostics never
perform the repair.

The Sandbox is treated as S00–S80 complete and S90/S99 incomplete. A future
separately authorized Setup resume revalidates controls and resumes only S90,
then S99. It must not duplicate, delete, or overwrite Gmail labels, dedicated
Calendar, Properties, owner edit trigger, Task, Ledger, or Dashboard.
Automation and the five-minute trigger remain OFF.

At transfer generation the gate remains
`PHASE8B_SANDBOX_NO_GO_DASHBOARD_WRITE_VISIBILITY` until normal publication,
remote resolution, detached fixed-T10 verification, and evidence E10 are
complete. It is not Phase 8B PASS, Phase 8C GO, production ready, or pilot
ready.
