# Phase 8B Company-PC Transfer Manifest

状態: `PENDING_R5_FINAL_HEAD_VERIFICATION`（P9 の remote/fresh-clone 検証待ち）

## Identity

| Field | Value |
|---|---|
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Code / Schema / AI / Migration | `2.8.5-prepilot` / `2.6` / `2.0` / `3` |
| Permitted package | `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/` only |
| Fixed independent-audit ref | `3442ac01f5c544c2b49a40a9af170d1f432312f1` |
| Final R5 Source A5.4 | `6c4f737c676b3121c42aafabe9d0c677cacd69bb` |
| Final R5 Release B5.4 | `3e5790672740626f3bec4592c3c7c0b86b47f3b1` |
| P6 remote publication evidence | `12538796fed90eb7f95492d477cca44a5d859291` |
| Historical P7 transfer-readiness evidence | `45bb4b938b02f2fd56d5d57267f4083a46f5176b` — raw-byte document checksum not portable across checkout line endings |
| P8 portability correction | `784b293c50713597a656bc7d9d1ae51fdaa26f1a` — canonical UTF-8 text checksum verifier passed in a fresh clone |
| P9 final transfer-readiness record | `SELF` — normal push, GitHub resolution, and final-head fresh-clone verification are required before user-facing confirmation |
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
| Source parity / checksum / secret scan | P6 remote/fresh-clone PASS; P8 canonical-text transfer-checksum fresh-clone PASS; P9 final-head check required before user-facing confirmation |

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

The historical P7 checksum is not valid for transfer use. P8 replaces the
protocol with canonical UTF-8 text hashing after `CRLF`/`CR` to `LF`
normalization, verified by `tools/verify_phase8b_transfer_envelope.ps1`. The
seven operator files remain separate from, and never alter, the immutable
package payload.

## Explicit exclusions

- `release/v2.8.5-prepilot-phase8c/` and all Phase 8C material;
- whole-repository clones, source, tests, tools, prompts, and historical
  package trees;
- `.clasp.json`, credentials, tokens, OAuth secrets, or Provider settings;
- actual Workspace IDs/URLs, real message text, personal data, client data,
  unpublished information, and screenshots containing them;
- existing business Sheets, business Calendars, or a real Provider.

## Effective-use condition

The P7 raw-byte protocol is historical evidence only. P8 canonical-text
fresh-clone proof is complete, but P9 must be normal-pushed, GitHub-resolved,
and verified from a fresh clone before this manifest can record
`READY_FOR_PHASE8B_SANDBOX_TRANSFER`. Until then it is not usable for
carriage. A later READY status means carriage of the non-confidential 8B
package through a company-approved route only. It does not approve a Sandbox
PASS, Phase 8C, production, pilot, OAuth, deployment, `clasp push`,
Automation, triggers, or real Workspace work.
