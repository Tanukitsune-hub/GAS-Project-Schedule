# Work 0018 Release Implementation Record

## Release identity

- Source A14: `2fd3fff0c1aebb1fecdecba02304ceace7ff1d0d`
- Starting main: `e2a7c683a7c0f7f1a865aec89a9e24ec56f830da`
- Prepared at: `2026-08-10T14:25:22Z`
- Code / Schema / AI Schema / Migration: `2.8.14-prepilot` / `2.6` /
  `2.0` / `3`
- Highest product gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`
- Automation: `OFF`
- Active transfer: `NONE`
- Active deployment: `NONE`

Source A14 changes only the Gmail Advanced Service body-decode boundary in
product runtime behavior. Explicit String input retains strict base64url
validation and padding normalization. Dense, bounded signed or unsigned byte
sequences are validated element by element, normalized to Apps Script signed
bytes, and decoded directly through an Apps Script Blob. Unsupported or
malformed representations remain fail-closed as `E_GMAIL_BODY_DECODE`.

## Deterministic package results

| Package | Payload | Package files | Payload SHA-256 | Result |
|---|---:|---:|---|---|
| Phase 8B `v2.8.14-prepilot` | 23 | 27 | `11e1ae58f9979f68dfbb678beea3e61d2c6fddaeb69db9fdd34ec3a3dbf972a7` | parity/checksums/provenance/secret scan PASS |
| Phase 8C `v2.8.14-prepilot-phase8c` | 22 | 25 | `f35533ba2765ecc9cd10b339e4c70252c78b0b347be5239badb3a626e6043965` | audited TEST_MODE-only transform/checksums/provenance/secret scan PASS |

Phase 8B includes the 22 `.gs` files, `appsscript.json`, and the local test
harness. Phase 8C excludes `99_TestHarness.gs` and changes only
`TEST_MODE: true` to `TEST_MODE: false`; all other payload bytes match Source
A14. Both packages were generated from a committed LF checkout and pass their
verifiers against the exact Source A14 commit.

## Boundary

Generation and verification were local and non-Google. No Gmail processing,
Google Workspace runtime, OAuth change, deployment, clasp push/pull, Calendar,
Sheets mutation, trigger, external AI, company, or production operation was
performed while creating B14. The packages do not authorize runtime use or a
Gmail decode retest.
