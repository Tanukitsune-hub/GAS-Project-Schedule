# Phase 8B Sandbox Retransfer Manifest

## Identity and immutable boundaries

| Field | Value |
| --- | --- |
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Code / Schema / AI / Migration | `2.8.6-prepilot` / `2.6` / `2.0` / `3` |
| Permitted package | `implementation/GoogleSpreadsheet/release/v2.8.6-prepilot/` only |
| Source A6 | `8e8e3e4a5f2288985554b3467a5b68814e7bab21` |
| Release B6 | `49f6774242e11f3c4ae1f0881dc4a7e13c5aad23` |
| Fixed transfer candidate ref | `SELF (the Git commit containing this transfer envelope)` |
| Historical failed transfer ref | `1a1f9df65dacf3a031409d724cb2906b58900f77` — retained, never reused |
| Automation | `OFF` |
| Package test mode | `true` |
| Harness | included |

This envelope is separate operator documentation.  It must never be copied
inside the immutable package directory, and no file in this envelope changes
the v2.8.6 package bytes.  The v2.8.5 package and the failed historical
transfer reference remain preserved evidence; they are not a retransfer path.

## Package integrity

| Item | Value |
| --- | --- |
| Package files / payload files | `27 / 23` |
| Canonical payload SHA-256 | `e734d1d11be637e4b146b448728dd54841df0cb37f0cba53528213f2a564fbfc` |
| External package-tree SHA-256 | `02442a7afbfb910298aacda739ba4259123baf5edb078526ba7266d531073d34` |
| `CHECKSUMS.sha256` file SHA-256 | `52f7808c31a8bde9441b4e258a819787607aa7c2eb73d69db196875f64450ddb` |
| `DEPLOYMENT_MANIFEST.md` SHA-256 | `7607de2105d7ec9cd57f7b0eff8156ac64303ca0d6b94fa5d6479fa9f412fe52` |
| Package build prepared at | `2026-07-29T06:27:34.455Z` |
| Package generation result | source parity, checksums, provenance, and secret scan PASS |

The external package-tree digest is SHA-256 over UTF-8, path-sorted records:
`<file SHA-256><two spaces><package-relative path><LF>`.  It is a transfer
check only and does not alter the package checksum inventory.

## Phase 8B Setup blocker correction

The historical first Setup stopped safely with
`E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN` at `TASK_AUTHORITY`, after S00 and S10.
The v2.8.6 correction makes Setup itself establish the protected, hidden Task
Authority Ledger control plane during `S20_CREATE_SCHEMAS` before the strict
authority validator runs.  `S30` and a completed Setup rerun reassert the
same controls idempotently.  Protection or visibility failure leaves S20
incomplete and fails closed; it does not permit a manual hide, a raw-row
repair, or an authority fallback.

The authoritative state remains the protected hidden versioned two-slot
`PREPARED` / `COMMITTED` Ledger.  `authoritative_snapshot_json`, notes, live
raw values, and post-edit values are not authority sources.

## Copy rule

Copy exactly the 27 package-relative paths in `COPY_ALLOWLIST.txt`, preserving
their relative paths.  Verify every copied package file against the package
`CHECKSUMS.sha256`.  Verify every non-self document in this envelope against
`TRANSFER_CHECKSUMS.sha256` before use.  This envelope contains eight
operator-documentation files plus the checksum inventory; it is not an Apps
Script payload.

## Explicit exclusions

- `release/v2.8.6-prepilot-phase8c/` and all Phase 8C material;
- source, tests, tools, prompts, historical package trees, and whole-repository
  clones;
- `.clasp.json`, credentials, tokens, OAuth secrets, or Provider settings;
- actual Workspace IDs or URLs, real message text, personal data, client data,
  unpublished information, and screenshots containing them;
- existing business Sheets, business Calendars, a real Provider, or Automation
  and trigger enablement.

## Effective-use condition

At transfer-envelope creation, the immutable package-generation gate remains
`PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER`.  It is not a declaration of Phase 8B
PASS, Phase 8C GO, production readiness, pilot readiness, OAuth approval,
deployment, `clasp push`, Automation, triggers, or real Workspace operation.

This envelope becomes eligible only if a subsequent independent fresh-clone
evidence record resolves this exact `SELF` transfer ref, re-runs the required
local/static validation, and records
`READY_FOR_PHASE8B_SANDBOX_RETRANSFER`.  That later evidence record does not
modify this package or transfer envelope.  Until then, do not copy or execute
the package.
