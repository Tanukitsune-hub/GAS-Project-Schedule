# Work 0002 Release Implementation Record

## Release identity

- Source A12: `d3f93e05e77a3cdccf24c5a5b7d8def452155841`
- Starting main: `e2a7c683a7c0f7f1a865aec89a9e24ec56f830da`
- Prepared at: `2026-08-08T00:00:00Z`
- Code / Schema / AI Schema / Migration: `2.8.12-prepilot` / `2.6` /
  `2.0` / `3`
- Highest gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`
- Automation: `OFF`
- Active transfer: `NONE`
- Active deployment: `NONE`

## Deterministic package results

| Package | Payload | Package files | Payload SHA-256 | Result |
|---|---:|---:|---|---|
| Phase 8B `v2.8.12-prepilot` | 23 | 27 | `20314bfd4e07ef31f1fc8e5ff7aa160fc5b1add378b17fa9ba1a7f1af2665d1f` | parity/checksums/provenance/secret scan PASS |
| Phase 8C `v2.8.12-prepilot-phase8c` | 22 | 25 | `66b5039f3016da60a1f15d8339560cf0ffacffc0f4b30aa9324018b7421e8081` | audited TEST_MODE-only transform/checksums/provenance/secret scan PASS |

Phase 8B includes the 22 `.gs` files, `appsscript.json`, and the local test
harness. Phase 8C excludes `99_TestHarness.gs` and changes only
`TEST_MODE: true` to `TEST_MODE: false`; all other payload bytes match Source
A12. The committed LF policy makes release inputs and outputs byte-stable on
Windows and Linux checkouts.

## Boundary

Generation and verification were local and non-Google. No Google Workspace,
OAuth, deployment, clasp, Gmail, Calendar, Sheets, trigger, company-PC, or AI
Provider operation was performed. These packages are immutable integration
candidates, not authorization for transfer or execution.
