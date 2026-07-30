# Phase 8B v2.8.8 Sandbox retransfer manifest

## Identity and immutable boundaries

| Field | Value |
|---|---|
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Code / Schema / AI / Migration | `2.8.8-prepilot` / `2.6` / `2.0` / `3` |
| Permitted package | `implementation/GoogleSpreadsheet/release/v2.8.8-prepilot/` only |
| Source A8 | `4140054b03c850f4a1e669b3aa562b305ef78bf5` |
| Release B8 | `a17d34422ed521cee81340902d9a19e2da372201` |
| Fixed transfer ref | `SELF (the Git commit containing this transfer envelope)` |
| Historical baseline for patch comparison | T7 `008c643b85c6b234ad489d946033cb9c06d32920` |
| Automation | `OFF` |
| Package test mode | `true` |
| Real Workspace retransfer/retest | `NOT_EXECUTED` |

This envelope is separate from the immutable release package and does not
alter package bytes. v2.8.5/P10, v2.8.6/T6.1, and v2.8.7/T7 artifacts remain
immutable historical evidence and must not be overwritten or reused as an
executable target.

## Package integrity

| Item | Value |
|---|---|
| Phase 8B package files / payload files | `27 / 23` |
| Canonical payload SHA-256 | `fa8c0d2c070c32f818203f936e2df4b2b2d5c2f51e52e93b79ed48cc8ad7da57` |
| Phase 8C package | excluded |
| Package validation | source parity, checksum, allow-list, provenance, and secret scan PASS locally |

Use `COPY_ALLOWLIST.txt` for the only permitted package-relative files. Use
package `CHECKSUMS.sha256` for package files and
`TRANSFER_CHECKSUMS.sha256` for this operator folder.
`COMPANY_PC_PATCH_MANIFEST_ja.md` and its JSON companion are raw-Git-blob
comparisons between fixed T7 and Release B8 and are the only authority for the
manual company-PC replacement list.

## v2.8.8 correction and safe resume contract

The correction replaces an invalid `getEditors().length === 1` assumption with
internally proven Spreadsheet owner/effective-user equality plus
`Protection.canEdit()`. A proven implicit owner or exactly the explicit owner
is accepted. Foreign editor, null owner / Shared Drive, different user,
warning-only, domain edit, target audience, duplicate/wrong Protection,
unprotected ranges, and every genuine Dashboard value/formula/validation/note/
merge/hidden/background/font/number-format/name/seed-marker conflict remain
fail-closed. Diagnostic output is limited to closed enums and counts.

The Sandbox is treated as S00–S80 complete and S90/S99 incomplete. A future
separately authorized Setup resume revalidates controls and resumes only S90,
then S99. It must not duplicate, delete, or overwrite Gmail labels, dedicated
Calendar, Properties, owner edit trigger, Task, Ledger, or Dashboard.
Automation and the five-minute trigger remain OFF.

At transfer generation this remains a local candidate. It is not Phase 8B
PASS, Phase 8C GO, production ready, or pilot ready.
