# Work 0016 Report — Gmail Body Decode Runtime Repair

## Result

- `WORK_ID`: `0016`
- `STATUS`: `READY_FOR_CONTROLLED_GMAIL_BODY_DECODE_RETEST`
- `BLOCKER`: `NONE`
- `BRANCH`: `codex/0016-gmail-body-decode-runtime-repair`
- `PR`: `#28` (Draft / Open / Unmerged)
- `FINAL_REPORT_HEAD`: `SELF` (the commit containing this report)
- `AUTOMATION`: `OFF`
- `GMAIL_RUNTIME`: `NOT_EXECUTED`
- `EXTERNAL_AI`: `NOT_CALLED`
- `CALENDAR`: `NOT_CALLED`

## Root cause and repair

`WorkOsGmailGateway.decodeBodyData()` passed Gmail Advanced Service
`payload.body.data` directly to `Utilities.base64DecodeWebSafe()`. Gmail body
data is base64url and may omit terminal padding. The Phase 2 Utilities shim
used Node `Buffer.from(value, 'base64url')`, which accepts missing padding and
therefore hid the Apps Script compatibility boundary that failed in Work 0015.

The repair validates the complete transport value as strict base64url,
requires a valid alphabet/length/optional terminal-padding combination, and
adds exactly the required `=` padding before calling Apps Script Utilities.
Malformed values continue to produce the fixed non-retryable
`E_GMAIL_BODY_DECODE` error. No exception is suppressed, and no alternate MIME
or Gmail API path was added. Attachment parts remain excluded before decode,
and the existing bounded truncation behavior is preserved.

Work 0016 did not execute Gmail runtime, so the repaired boundary still
requires the separately authorized controlled retest named by the final
status.

## Candidate and release identity

- Code: `2.8.13-prepilot`
- Schema: `2.6`
- AI Schema: `2.0`
- Migration: `3`
- `TEST_MODE`: `true`
- Automation: `OFF`
- authoritative Source A13: `57205299ccedb87b521e9cddfc2481d2cb0baf7c`
- authoritative direct-child Release B13:
  `1845821ee0b0667cd553a266f74dbe4166b9333a`
- pre-Google repair head: `0a3b8727caf8d0e60859f512a7ddd6ea9dcc4173`

The first local Windows package generation was rejected by the committed-LF
verification gate before publication or Google mutation. Without rewriting
history, the invalid generated tree was removed in a new source stage and the
authoritative packages were rebuilt from a clean committed-LF checkout. The
machine contract points only to the authoritative A13/B13 pair above.

## Changed files at a high level

- `apps-script-v2/05_GmailGateway.gs`: strict base64url validation and padding
  normalization at the existing decode boundary.
- `apps-script-v2/00_Config.gs` and active version references: coherent
  `2.8.13-prepilot` candidate identity.
- Phase 2 and historical clasp regression suites: strict Utilities behavior,
  Japanese UTF-8, padded/unpadded data, URL-safe alphabet, malformed input,
  truncation, attachment exclusion, and privacy coverage.
- Work 0016 placement tooling/tests: fresh ignored one-use state, completed
  Work 0010 binding proof, exact native inventory, guarded push, and isolated
  pull parity.
- deterministic `v2.8.13-prepilot` Phase 8B/8C release packages, checksums,
  manifests, verifier tooling, and A13/B13 lineage contract.

## Local validation

- targeted Phase 2 suite: `31 / 31` PASS.
- Work 0016 one-use placement suite: `11 / 11` PASS.
- affected historical Work 0004/0006/0010 clasp suites: PASS.
- complete Node regression collection: `59` suites PASS.
- complete local gate on the pre-Google head: `11 / 11` PASS.
- Apps Script inventory: `22` `.gs` + `appsscript.json` = `23`; missing `0`,
  extra `0`.
- Phase 8B/8C committed-LF release verifiers: PASS.
- A13/B13 direct-child lineage and B13 release-only scope: PASS.
- tracked secret/local-state scan: `0` hits.
- `git diff --check`: PASS.

## GitHub Actions before Google mutation

The exact pre-Google head `0a3b8727caf8d0e60859f512a7ddd6ea9dcc4173`
was pushed before any target operation.

- push CI run `31376163615`: `SUCCESS`.
- pull-request CI run `31376166009`: `SUCCESS`.

## Existing-target placement evidence

- new Spreadsheet / Apps Script target creation attempts: `0`.
- existing non-interactive clasp auth: `READY`; identity suppressed.
- accepted binding: only the completed Work 0010 personal-synthetic target;
  identifiers suppressed.
- Work 0016 local state before staging: absent.
- native eligible inventory immediately before push: `23` files (`22` `.gs`
  plus one manifest), missing `0`, extra `0`, preferred pull extension `.gs`.
- guarded push attempt count: `1`; result `PASS`.
- semantic update-content evidence: `23` canonical files, missing `0`, extra
  `0`.
- independent pull attempt count: `1`; result `PASS`.
- pull-back inventory: `22` `.gs` plus `appsscript.json`, `23` total, missing
  `0`, extra `0`.
- exact byte/hash parity: `PASS`.

No retry, second target, alternate account, content inspection, or cleanup
mutation was used.

## Privacy and prohibited-operation evidence

No target identifiers, Spreadsheet or Script IDs, account/address data, OAuth
values, credential paths, URLs for private resources, Gmail IDs, raw Gmail
payloads, message content, or raw Google responses are recorded here or in Git.

| Operation | Count |
|---|---:|
| Gmail processing / failed-message access | 0 |
| Mock vertical / Apps Script function / clasp run | 0 |
| Spreadsheet or Apps Script target creation | 0 |
| Spreadsheet cell mutation | 0 |
| External AI / Provider operation | 0 |
| Calendar operation | 0 |
| Setup / Continue Setup | 0 |
| Quick/Deep Diagnostic / Dashboard refresh | 0 |
| Trigger / Automation / deployment / Cloud-project mutation | 0 |
| OAuth login, logout, re-consent, or account switch | 0 |
| Company / production / real-data operation | 0 |

## Remaining boundary

Work 0016 proves local strictness, release identity, CI, exact source placement,
and pull-back parity only. It does not prove the Gmail runtime repair. The next
permitted action requires a separate Work ID explicitly authorizing one
controlled Gmail body decode retest. No BLOCKER remains for that handoff.
