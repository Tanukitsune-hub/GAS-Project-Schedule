# Work 0033 Release Implementation Record

- Source A20: `0c0304f6a63a08796c7ea788b4e3bc8de077aec8` (the source-stage
  commit before generated release regeneration)
- Release B20: the direct child commit containing this record, the generated
  Phase 8B/8C packages, and `CURRENT_CONTRACT.json`
- Code / Schema / AI Schema / Migration: `2.8.20-prepilot` / `2.6` / `2.0` /
  `3`
- TEST_MODE: `true` in Phase 8B; Phase 8C is the audited TEST_MODE-only
  transform with the test harness excluded
- Automation: `OFF`

## Scope

Work 0033 projects only the provider-facing structured-output schema sent to
the Gemini Interactions endpoint. The canonical AI Schema 2.0 remains the
authoritative application validator and retains its strict constraints. The
provider projection preserves schema shape, required fields, types, nullability,
and enums while omitting provider-incompatible complexity constraints. The
`/v1beta/interactions` endpoint, `gemini-3.6-flash`, one-call/no-retry rule,
no-fallback rule, diagnostics, Message-only finalization, candidate pinning,
and Automation-OFF boundary remain unchanged.

## Generated packages

- Phase 8B: `release/v2.8.20-prepilot`, 24 payload files (23 `.gs` plus
  `appsscript.json`), 28 package files, payload bundle SHA-256
  `ecc2b493a64cf9c82f98a7d967e27dc453ae8f71186f9f4e2df6b00bd6e3e2bb`.
- Phase 8C: `release/v2.8.20-prepilot-phase8c`, 23 payload files (22 `.gs`
  plus `appsscript.json`), 26 package files, payload bundle SHA-256
  `551960e314703b86c383db40c4d484ff3d6f8df0a039552f30ec139f5d3916ec`.

The canonical source inventory remains 23 `.gs` files plus
`appsscript.json`. `CURRENT_CONTRACT.json` binds both package paths, hashes,
and the A20 source commit. No transfer, deployment, credential, private URL,
account identifier, real Workspace identifier, provider body, or raw runtime
response is included.

## Validation boundary

Release generation completed with source parity, secret scan, test-mode, and
provenance checks. The complete local gate and exact-head CI remain required
before the separately authorized existing-target source placement. Work 0033
does not configure or inspect a Gemini key, make a Gemini request, invoke an
Apps Script function, access Gmail/Task/Review/Calendar/Automation runtime, or
mutate any live or historical failure record.
