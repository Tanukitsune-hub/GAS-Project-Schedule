# Google Workspace Personal Work OS v2
# Work 0039 Phase {{PHASE}} Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Work | `0039` |
| Dispatch | `0039-CODEX-01` |
| Package | `{{PACKAGE}}` |
| Repository | `{{REPOSITORY}}` |
| Source commit | `{{SOURCE_COMMIT}}` |
| Release content commit | `{{RELEASE_COMMIT}}` |
| Code Version | `2.8.26-prepilot` |
| Schema Version | `2.6` |
| AI Schema Version | `2.0` |
| Migration Version | `3` |
| Task canonical columns | `50` |
| Authority store | `protected hidden Task Authority Ledger` |
| Authority ledger columns | `21` |
| Authority protocol | `versioned two-slot PREPARED/COMMITTED` |
| Snapshot-cell fallback | `FORBIDDEN` |
| TEST_MODE | `{{TEST_MODE}}` |
| Test harness | `{{TEST_HARNESS}}` |
| Automation default | `OFF` |
| Package prepared at | `{{PREPARED_AT}}` |
| Highest local status | `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT` |

This is a derived, non-live Work 0039 candidate artifact. The canonical
developer source remains the modular `apps-script-v2/` directory. Provider
selection is code-owned by `WORK_OS_V2_ACTIVE_AI_PROVIDER`; only `GEMINI` and
`OPENAI` are allowed and absent selection remains Gemini for compatibility.

The direct OpenAI candidate is `gpt-5.6-luna` at
`https://api.openai.com/v1/responses` with structured JSON output,
`store=false`, no tools, no background execution, and no streaming. The
OpenAI governance state is `NOT_APPROVED_OR_UNKNOWN`; `store=false` is not
treated as proof of a retention tier. No company data or credential is
included, and no real Provider or Google Workspace request was executed.

{{PHASE_DESCRIPTION}}

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

No credential, account identifier, private URL, raw Provider response, email
body, task content, or live Workspace identifier is included. Company OpenAI
data-governance approval, credentials, deployment, OAuth, trigger state, and
Automation remain `NOT EXECUTED` in this dispatch.
