# Phase 8B v2.8.9 Sandbox retransfer manifest

## Identity and immutable boundaries

| Field | Value |
|---|---|
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Code / Schema / AI / Migration | `2.8.9-prepilot` / `2.6` / `2.0` / `3` |
| Permitted package | `implementation/GoogleSpreadsheet/release/v2.8.9-prepilot/` only |
| Corrected Source A9.1 | `4a145588b01a5f7ae7e9bce86efb9bd5b3d8345d` |
| Corrected Release B9.1 | `b451d2361db99b4efbde036dafa3e2baf6b5cb97` |
| Fixed transfer ref | `SELF (the Git commit containing this transfer envelope)` |
| Historical baseline for patch comparison | T8 `69f843f6ea426ccb45d721a40508a35b0a59795d` |
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
| Canonical payload SHA-256 | `8fae6fba81d29e1783b5579ddbcb9d995408402f3b6925865ee8024658128cf8` |
| Phase 8C package | excluded |
| Package validation | source parity, checksum, allow-list, provenance, and secret scan PASS locally |

Use `COPY_ALLOWLIST.txt` for the only permitted package-relative files. Use
package `CHECKSUMS.sha256` for package files and
`TRANSFER_CHECKSUMS.sha256` for this operator folder.
`COMPANY_PC_PATCH_MANIFEST_ja.md` and its JSON companion are raw-Git-blob
comparisons between fixed T8 and Corrected Release B9.1 and are the only authority for the
manual company-PC replacement list.

## v2.8.9 correction and safe resume contract

The correction keeps the established native Protection contract and adds a
deterministic Setup-only number-format control plane. Only after the exact
Dashboard ownership, seed/owned marker, and every non-format surface are
proven safe may Setup normalize the exact 17×3 system block to the canonical
plain-text contract. Foreign editor, domain edit, target audience,
duplicate/wrong Protection, unprotected ranges, foreign content, and every
genuine Dashboard value/formula/validation/note/merge/hidden/background/font/
number-format/name/seed-marker conflict remain fail-closed. Diagnostic output
is limited to closed enums and counts and never performs the repair.

The Sandbox is treated as S00–S80 complete and S90/S99 incomplete. A future
separately authorized Setup resume revalidates controls and resumes only S90,
then S99. It must not duplicate, delete, or overwrite Gmail labels, dedicated
Calendar, Properties, owner edit trigger, Task, Ledger, or Dashboard.
Automation and the five-minute trigger remain OFF.

At transfer generation this remains a local candidate. It is not Phase 8B
PASS, Phase 8C GO, production ready, or pilot ready.
