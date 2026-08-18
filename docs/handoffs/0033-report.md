# Work 0033 Report

## Outcome

- Work ID: `0033`
- Route: `C — Codex implement/validate`
- Status: `READY_FOR_USER_GEMINI_E2E_RETRY_AFTER_SCHEMA_COMPATIBILITY_REPAIR`
- BLOCKER: `NONE`
- Scope completed: provider-facing structured-output schema compatibility
  repair, regression coverage, 2.8.20-prepilot release regeneration, and one
  authorized existing-target placement with pull-back parity.

The canonical AI Schema 2.0 and its strict application validator remain
unchanged and authoritative. The `/v1beta/interactions` endpoint,
`gemini-3.6-flash`, one-call/no-retry/no-fallback behavior, Work 0032
diagnostics and Message-only finalization, exact synthetic candidate pinning,
and Automation-OFF boundary remain unchanged. No real Gemini request or Apps
Script runtime function was invoked.

## Candidate and lineage

- Code / Schema / AI Schema / Migration: `2.8.20-prepilot` / `2.6` / `2.0` /
  `3`
- TEST_MODE: `true` in Phase 8B; `false` in Phase 8C through the established
  audited TEST_MODE-only transform
- Automation: `OFF`
- A20 source commit: `0c0304f6a63a08796c7ea788b4e3bc8de077aec8`
- B20 release commit: `b321d83e29ba04557cbed87b75accc746144da6c`
- Final pre-placement head: `ad80b8f154f5a128617ecf3cb1696020ea07a579`

B20 is the direct child of A20 and contains only the generated 2.8.20
Phase 8B/8C packages, `CURRENT_CONTRACT.json`, and the release implementation
record. Later commits only synchronize current inventory regression fixtures,
pin the Work 0033 branch guard, and add the required local-state ignore rule;
they do not change generated payload bytes. The canonical source payload
inventory is 24 files: 23 `.gs` files plus `appsscript.json`. The source
payload SHA-256 is
`ced2ce52cd4a3faa46c66f0e1971a7cebb14334ca7d3f2bcb3ec79799c82effe`.

## Implementation

`20_GeminiProvider.gs` now derives a provider-only schema from the canonical
schema through a deterministic recursive projection. It omits only provider-
incompatible complexity constraints: `additionalProperties`, `format`,
`minimum`, `maximum`, `minItems`, and `maxItems`. Object shape, required fields,
types, nullability, enums, and nested field names remain bound to the canonical
schema. `07_AiAdapter.gs` and the canonical `validateOutput()` path were not
weakened or redesigned.

Safe structural evidence from the local synthetic provider test:

- canonical serialized schema length: `2102`; provider: `1891`
- maximum depth: `8` / `8`
- properties: `24` / `24`
- enum values: `41` / `41`
- nullable unions: `10` / `10`
- `additionalProperties`: `3` / `0`
- `format`: `3` / `0`
- minimum/maximum constraints: `4` / `0`
- array bounds: `2` / `0`

The non-schema request contract remains covered by the existing provider
tests: exact endpoint and model, string input, system instruction,
`response_format` text/JSON fields, bounded low thinking configuration, no
summaries, bounded output tokens, no tools, and no stream/background/store
behavior changes.

The active Work 0033 test also proves canonical strict validation still rejects
unknown fields, invalid enums, malformed dates, out-of-range confidence,
excess actions/warnings, invalid changes, and semantic action violations. A
bounded synthetic 400 `invalid_request` path remains privacy-safe and makes
exactly one fake request; it does not call Gemini.

## Validation

- Node: `v24.19.0`
- pnpm: `11.19.0`
- project-local clasp: `3.3.0`
- existing clasp authorization preflight: `READY` with identity suppressed
- Work 0033 schema compatibility suite: `4/4 PASS`
- Work 0033 placement safety suite: `13/13 PASS`
- Work 0028/0030/0031/0032 focused regressions: `6/6`, `10/10`, `3/3`, and
  `12/12 PASS`
- Complete final local gate: `11/11` checks PASS, including all `73` current
  test suites, Apps Script static validation, 23 `.gs`/manifest inventory,
  2.8.20 release/checksum parity, A20/B20 lineage, secret/local-state scan,
  and clean worktree
- `git diff --check`: PASS
- Phase 8B: 24 payload files, 28 package files, `TEST_MODE=true`; payload
  SHA-256 `ecc2b493a64cf9c82f98a7d967e27dc453ae8f71186f9f4e2df6b00bd6e3e2bb`
- Phase 8C: 23 payload files, 26 package files, `TEST_MODE=false`; payload
  SHA-256 `551960e314703b86c383db40c4d484ff3d6f8df0a039552f30ec139f5d3916ec`
- Exact pre-placement CI: `SUCCESS` for `ad80b8f154f5a128617ecf3cb1696020ea07a579`
  (GitHub Actions run `349`)
- Luna delegation: `luna_explorer` performed provider-contract/schema
  inspection, `luna_executor` made the bounded provider/test changes, and
  `luna_auditor` performed independent final validation. No repository-defined
  custom agent or Terra agent was invoked.

A local-only stage guard initially refused because the copied Work 0033
placement tool had the Work 0032 branch constant. No remote operation had
started (`push=0`, `pull=0`) and no Work 0033 state was created in that first
attempt. After the branch guard and tracked `.gitignore` rule were corrected,
the fresh CI-confirmed stage and inventory passed. The first local stage state
created before the ignore-rule commit was preserved in a local quarantine and
was not reused; the historical Work 0004/0006/0032 states were not changed.

## Authorized existing-target placement

Only the existing personal-synthetic Apps Script binding was reused. No new
Spreadsheet, Apps Script project, account, auth profile, deployment, or Cloud
project was created. Sensitive clasp output and binding identifiers were
suppressed.

Immediately before push, the actual project-local clasp-native inventory gate
reported:

- eligible files: `24`
- `.gs` files: `23`
- manifest files: `1`
- missing: `0`
- extra: `0`
- preferred pull script extension: `.gs`

Operation counts and results:

- target creation attempts: `0`
- remote ownership/binding inspections: `0`
- guarded source push attempts: `1` — `PASS`
- update-content semantic evidence: `PASS`
- independent isolated pull attempts: `1` — `PASS`
- pull-back parity: `PASS`, 24 files / 23 `.gs` / one manifest / zero
  missing / zero extra / exact canonical payload hash
- Apps Script function invocations: `0`
- real Gemini requests: `0`
- Gmail, Task, Review, Calendar, Setup, Diagnostics, Dashboard, Trigger,
  Automation, deployment, and production operations: `0`

## GitHub handoff

- Branch: `codex/0033-gemini-invalid-request-schema-compatibility`
- Draft PR: `#48`
- PR state: Draft / Open / Unmerged
- Pre-placement head: `ad80b8f154f5a128617ecf3cb1696020ea07a579`
- Final report commit and final-head CI are recorded by the completion
  workflow after this report is committed.

No credential, account identity, API key, Script Property, target identifier,
private URL, provider response, email body, or real data is included in this
report or the repository.
