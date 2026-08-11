# Google Workspace Personal Work OS v2
# Phase 8B Work 0029 Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Repository | {{REPOSITORY}} |
| Source commit | {{SOURCE_COMMIT}} |
| Release content commit | {{RELEASE_COMMIT}} |
| Code Version | `2.8.16-prepilot` |
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
| Highest local status | `READY_FOR_CONTROLLED_SANDBOX_VALIDATION` |

This package contains the exact 23-file Apps Script source payload and the
Work 0029 runtime-activation repair. It is a candidate artifact, not a
deployment or runtime authorization. Real Gemini, Gmail, Calendar, OAuth,
Task, Review, Setup, diagnostics, triggers, and production operations remain
unexecuted.

## Payload

| Field | Value |
|---|---|
| Payload files | `{{PAYLOAD_COUNT}}` |
| `.gs` files | `{{GS_COUNT}}` |
| Canonical payload-list SHA-256 | `{{PAYLOAD_BUNDLE_SHA256}}` |

| Relative path | SHA-256 |
|---|---|
{{PAYLOAD_TABLE}}

## Services and safety

### OAuth scopes

{{OAUTH_SCOPES}}

### Advanced Services

{{ADVANCED_SERVICES}}

No credentials, identifiers, private URLs, raw Provider responses, or real
data are included.
