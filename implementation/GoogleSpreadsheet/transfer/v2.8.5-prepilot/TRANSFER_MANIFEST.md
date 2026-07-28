# Phase 8B Company-PC Transfer Manifest

状態: `PENDING_R5_REMOTE_VERIFICATION`

## Identity

| Field | Value |
|---|---|
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Code / Schema / AI / Migration | `2.8.5-prepilot` / `2.6` / `2.0` / `3` |
| Permitted package | `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/` only |
| Fixed independent-audit ref | `3442ac01f5c544c2b49a40a9af170d1f432312f1` |
| Final R5 Source A5.4 | `6c4f737c676b3121c42aafabe9d0c677cacd69bb` |
| Final R5 Release B5.4 | `3e5790672740626f3bec4592c3c7c0b86b47f3b1` |
| P6/P7 audit evidence | `SELF (final commit containing the transfer/audit record)` |
| Automation | `OFF` |
| Package test mode | `true` |
| Harness | included |

## Package integrity

| Item | Value |
|---|---|
| Package files / payload files | 27 / 23 |
| Canonical payload SHA-256 | `8c423f402ce8bb1de7aaa35ab70129b9af45c8abf1d0ccfe20dade8d44dea738` |
| External package-tree SHA-256 | `1d6c78332c39734e8e5d05b30735d5379ba82b8f5d20556553064624d6292060` |
| `CHECKSUMS.sha256` file SHA-256 | `1ecd877676d84bc6fc02bed60e090619c11b908aebd56805935edaf6c80a5a79` |
| `DEPLOYMENT_MANIFEST.md` SHA-256 | `f305c8c5439cd1bfee425ea5130709380080ade5833d87b7dce29cadb73d3f66` |
| Source parity / checksum / secret scan | PASS locally; final remote proof required before use |

The external package-tree digest is SHA-256 over UTF-8, path-sorted lines
`<file SHA-256><two spaces><package-relative path><LF>` for all 27 package
files. It is an external transfer check and does not modify the immutable
package or its checksum inventory.

## Copy rule

Copy exactly the 27 package-relative files in `COPY_ALLOWLIST.txt`, preserving
their relative paths. Verify every file against package `CHECKSUMS.sha256`.
Verify the seven operator-documentation files against
`TRANSFER_CHECKSUMS.sha256` before using them. Copy this transfer envelope
separately as operator documentation; it is not a package payload and must not
be added inside the package directory.

While this manifest remains `PENDING_R5_REMOTE_VERIFICATION`, the transfer
checksum is intentionally not final and no transfer is authorized. It is
generated only after the final post-push fresh-clone evidence is recorded.

## Explicit exclusions

- `release/v2.8.5-prepilot-phase8c/` and all Phase 8C material;
- whole-repository clones, source, tests, tools, prompts, and historical
  package trees;
- `.clasp.json`, credentials, tokens, OAuth secrets, or Provider settings;
- actual Workspace IDs/URLs, real message text, personal data, client data,
  unpublished information, and screenshots containing them;
- existing business Sheets, business Calendars, or a real Provider.

## Effective-use condition

This manifest becomes usable only when the final R5 audit report records
`READY_FOR_PHASE8B_SANDBOX_TRANSFER`. That status means carriage of the
non-confidential 8B package through a company-approved route only. It does not
approve a Sandbox PASS, Phase 8C, production, pilot, OAuth, deployment,
`clasp push`, Automation, triggers, or real Workspace work.
