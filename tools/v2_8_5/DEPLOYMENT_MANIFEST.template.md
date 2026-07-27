# Google Workspace Personal Work OS v2
# Round 4 Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Repository | {{REPOSITORY}} |
| Source commit | {{SOURCE_COMMIT}} |
| Release content commit | {{RELEASE_COMMIT}} |
| Code Version | `2.8.5-prepilot` |
| Schema Version | `2.6` |
| AI Schema Version | `2.0` |
| Migration Version | `3` |
| Task canonical columns | `50` |
| Authority store | `protected hidden Task Authority Ledger` |
| Authority ledger columns | `21` |
| Authority protocol | `versioned two-slot PREPARED/COMMITTED` |
| Snapshot-cell fallback | `FORBIDDEN` |
| TEST_MODE | `true` |
| Automation default | `OFF` |
| Package prepared at | `{{PREPARED_AT}}` |
| Highest local status | `READY_FOR_INDEPENDENT_REAUDIT` |

This package is a Round 4 remediation candidate for independent re-audit. It
does not declare Phase 8B GO/PASS, Phase 8C GO, production readiness, or pilot
readiness. Real Google Workspace validation remains `NOT EXECUTED` when this
package is built locally.

## R4 authority contract

- A Task write uses a durable two-slot authority ledger: `PREPARED`, one Task
  row write, then `COMMITTED`.
- Recovery reads the protected hidden ledger. `authoritative_snapshot_json`, a
  cell note, live raw values, and post-edit values are never authority fallback
  sources.
- A missing, malformed, or conflicting authority record is quarantined or
  marked unrecoverable. It is excluded from Worker, Review, and Calendar paths.
- Task header rows 1 and 2 are canonical control-plane metadata and are
  restored by the common schema path.
- Migration 3 permits legacy note anchoring only at the explicit Schema 2.5
  migration boundary; it does not silently rebaseline a Schema 2.6 Task row.

## Apps Script payload

- Source of truth: `apps-script-v2/`
- Payload files: `{{PAYLOAD_COUNT}}`
- `.gs` files: `{{GS_COUNT}}`
- Manifest files: `1`
- Canonical payload-list SHA-256: `{{PAYLOAD_BUNDLE_SHA256}}`

The canonical payload-list hash is SHA-256 over the path-sorted concatenation
of `<lowercase sha256><two spaces><relative path><LF>` records.

| Relative path | SHA-256 |
|---|---|
{{PAYLOAD_TABLE}}

## OAuth scopes

{{OAUTH_SCOPES}}

Forbidden scope boundary:

- no `script.external_request`
- no Drive scope
- no mail-send scope
- no `mail.google.com` full scope
- no Calendar full-control scope

## Advanced Services

{{ADVANCED_SERVICES}}

## External boundaries

| Boundary | Status |
|---|---|
| Code implementation | `READY_FOR_INDEPENDENT_REAUDIT` |
| Local fault-injection validation | package-build prerequisite |
| Real Provider connection | `NOT EXECUTED` |
| Provider / model / endpoint / auth | `NOT CONFIRMED` |
| Company approval | `NOT CONFIRMED` |
| Credential storage approval | `NOT CONFIRMED` |
| Real Google Workspace | `NOT EXECUTED` |
| Real OAuth consent | `NOT EXECUTED` |
| Real Trigger / LockService contention | `NOT EXECUTED` |

## Package exclusions

The package excludes:

- `.clasp.json`, Script IDs, deployment commands, and deployment credentials
- credential values, API keys, passwords, tokens, and private keys
- Node tests, fixtures, archives, prompts, and local environment files
- real Spreadsheet / Gmail / Calendar IDs and Google Workspace internal URLs
- company email bodies, attachments, personal information, and unpublished data

`CHECKSUMS.sha256` records every package file except itself, including this
manifest, the Quickstart, the Manual Acceptance Guide, and the Apps Script
payload. A mismatch is a fail-closed condition.
