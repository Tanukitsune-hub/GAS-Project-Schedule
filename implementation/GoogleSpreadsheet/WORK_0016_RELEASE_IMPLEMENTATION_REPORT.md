# Work 0016 Release Implementation Record

## Release identity

- Source A13: `152f7ae5b30b7763129c61dad4b317546c193b29`
- Starting main: `e2a7c683a7c0f7f1a865aec89a9e24ec56f830da`
- Prepared at: `2026-08-10T09:38:33Z`
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
| Phase 8B `v2.8.13-prepilot` | 23 | 27 | `0ed8e8e959f3f4c377731aaf9e7aa2cfa7a08a6f925350c4fbce870222446389` | parity/checksums/provenance/secret scan PASS |
| Phase 8C `v2.8.13-prepilot-phase8c` | 22 | 25 | `b0a78718a760d4690879e7155607522a0f38359ec5b3fcd12c92d0acd8db9aed` | audited TEST_MODE-only transform/checksums/provenance/secret scan PASS |

Phase 8B includes the 22 `.gs` files, `appsscript.json`, and the local test
harness. Phase 8C excludes `99_TestHarness.gs` and changes only
`TEST_MODE: true` to `TEST_MODE: false`; all other payload bytes match Source
A13. Both package verifiers pass against the exact Source A13 commit.

## Boundary

Generation and verification were local and non-Google. No Gmail processing,
Google Workspace runtime, OAuth change, deployment, clasp push/pull, Calendar,
Sheets mutation, trigger, external AI, company, or production operation was
performed while creating B13. The packages do not authorize runtime use or a
Gmail decode retest.
