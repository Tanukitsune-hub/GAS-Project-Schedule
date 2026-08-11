# Work 0028 Release Implementation Record

## Release identity

- Source A15: `859dc2e0b91bbdf925705c15b9e3f046c8bca7a6`
- Release B15: the direct child commit containing this record, generated release packages, and `CURRENT_CONTRACT.json`
- Code / Schema / AI Schema / Migration: `2.8.15-prepilot` / `2.6` / `2.0` / `3`
- Highest local gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`
- TEST_MODE: `true` in Phase 8B; `false` in Phase 8C
- Automation default: `OFF`

## Deterministic package results

Both packages were generated and verified from a fresh LF checkout of Source
A15. The canonical current source inventory is 23 `.gs` files plus
`appsscript.json` (24 payload files total); Phase 8C excludes only
`99_TestHarness.gs` and applies only the audited TEST_MODE transform.

| Package | Payload files | Package files | Payload SHA-256 | Result |
|---|---:|---:|---|---|
| Phase 8B `v2.8.15-prepilot` | 24 | 28 | `183086dcdf69cfa93ee81b0661f6544ac923bfd38fc5190da5d6fffd64b53519` | source parity/checksums/provenance/secret scan PASS |
| Phase 8C `v2.8.15-prepilot-phase8c` | 23 | 26 | `a66eab76128b710f07a1586d48517adb0fe466e203fc7ce662d4495f2c2e361d` | TEST_MODE-only transform/checksums/provenance/secret scan PASS |

## Boundary

Release generation and verification were local and non-Google. No Gmail,
Calendar, Apps Script function, Gemini request, OAuth change, deployment,
clasp push/pull, target mutation, company resource, production resource, or
real-data operation was performed while producing B15.
