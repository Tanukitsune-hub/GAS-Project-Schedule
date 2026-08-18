# Work 0016 Release Implementation Record

## Release identity

- Source A13: `57205299ccedb87b521e9cddfc2481d2cb0baf7c`
- Starting main: `e2a7c683a7c0f7f1a865aec89a9e24ec56f830da`
- Prepared at: `2026-08-10T09:43:01Z`
- Code / Schema / AI Schema / Migration: `2.8.13-prepilot` / `2.6` /
  `2.0` / `3`
- Highest product gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`
- Automation: `OFF`
- Active transfer: `NONE`
- Active deployment: `NONE`

Source A13 changes the Gmail Advanced Service body-decode boundary only in
product runtime behavior. Valid padded or unpadded base64url is normalized to
explicit four-character padding before Apps Script Utilities decode. Invalid
alphabet, length, or padding remains fail-closed as `E_GMAIL_BODY_DECODE`.

## Deterministic package results

| Package | Payload | Package files | Payload SHA-256 | Result |
|---|---:|---:|---|---|
| Phase 8B `v2.8.13-prepilot` | 23 | 27 | `c77bd7445cbc20a16670c1ff1929f5e54dd7c2206f2556c65c68672865b65d45` | parity/checksums/provenance/secret scan PASS |
| Phase 8C `v2.8.13-prepilot-phase8c` | 22 | 25 | `992161875057dba3523354a0583c675afdf3416e8b1c93d96d5a78ff34485a8a` | audited TEST_MODE-only transform/checksums/provenance/secret scan PASS |

Phase 8B includes the 22 `.gs` files, `appsscript.json`, and the local test
harness. Phase 8C excludes `99_TestHarness.gs` and changes only
`TEST_MODE: true` to `TEST_MODE: false`; all other payload bytes match Source
A13. Both packages were generated from a committed LF checkout and pass their
verifiers against the exact Source A13 commit.

## Boundary

Generation and verification were local and non-Google. No Gmail processing,
Google Workspace runtime, OAuth change, deployment, clasp push/pull, Calendar,
Sheets mutation, trigger, external AI, company, or production operation was
performed while creating the corrected B13. The packages do not authorize
runtime use or a Gmail decode retest.
