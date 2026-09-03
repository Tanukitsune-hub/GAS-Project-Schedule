# Work 0039 / Dispatch 0039-CODEX-01 — Completion Report

WORK_ID: `0039`

DISPATCH_ID: `0039-CODEX-01`

BALL: `CHATGPT`

STATUS: `COMPLETE — LOCAL NON-LIVE`

## Outcome

The explicit Gemini/OpenAI provider-selection implementation, synthetic-only
validation, versioned Work 0039 releases, two-paste company-install bundle,
byte-identical `.txt` transport copies, and this completion report are now
present on `codex/0039-openai-provider-selection`.

The implementation is ready for the requested local/non-live dispatch. Company
OpenAI runtime acceptance remains blocked by the separate data-governance gate:
`NOT_APPROVED_OR_UNKNOWN`. No real company data, credential, provider request,
Workspace target, deployment, or Automation operation was used.

## Authoritative inputs

- `docs/handoffs/0039-CODEX-01-openai-provider-selection-instruction.md`
- `docs/handoffs/0039-CODEX-01-openai-data-governance-addendum.md`

## Git and source refs

- Implementation branch: `codex/0039-openai-provider-selection`
- Starting `origin/main`: `3e302c2bc1e13c9482b208b754bc893e9a73fc70`
- Release source commit recorded by the generated artifacts:
  `474d66fc3a0df224768f91d9f4cd34dee6617dc2`
- Release and contract generation commit:
  `06022d3c2ce6690f746f695cf79fa7f9d8838a4d`
- Final pre-report validation HEAD:
  `8db2e7a86f7d5aba747175cce4c535f5566d8397`
- Code version: `2.8.26-prepilot`
- Schema version: `2.6`; AI Schema: `2.0`; migration version: `3`

No push, pull request, deployment, or live external mutation was performed by
this dispatch.

## Implementation summary

- Added `21_OpenAiProvider.gs` for the direct Responses API provider with
  code-owned model/prompt/endpoint metadata, strict structured-output schema
  projection, deterministic normalization, bounded diagnostics, `store=false`,
  no tools/background/streaming, and separate
  `WORK_OS_V2_OPENAI_API_KEY` credential lookup.
- Added `22_AiProviderSelection.gs` with the authoritative
  `WORK_OS_V2_ACTIVE_AI_PROVIDER` property. Allowed values are exactly
  `GEMINI` and `OPENAI`; an absent property remains Gemini-compatible without
  an implicit write.
- Added guarded provider switching with Automation-OFF, zero owned clock
  triggers, no active worker lease, no unresolved in-flight/retry boundary,
  Script Lock, postcondition, and rollback checks.
- Preserved the provider-neutral canonical validator and Gemini path. Provider,
  model, prompt, schema, code, and instance identity remain bound in
  qualification/provenance fingerprints; there is no automatic cross-provider
  fallback or dual-send.
- Added bounded status/menu flows, OpenAI synthetic qualification, governance
  flags, provider pinning at the worker boundary, documentation, test inventory,
  and release provenance updates.

## Versioned release artifacts

### Phase 8B test package

Path: `implementation/GoogleSpreadsheet/release/v2.8.26-prepilot/`

- Payload: 26 files; package: 30 files
- Payload SHA-256:
  `92fb95e45e60ccbcff48ff2bf32ff79fc73743120e2fdcf8f7c0e6f47170aea7`
- Package SHA-256:
  `0e4bc6a739b9ed8046b6f477eccfd6ea0626a5ac5f4f9917a4718dd44daac623`
- Test mode and test harness are enabled only in this package.

### Phase 8C company-install candidate

Path: `implementation/GoogleSpreadsheet/release/v2.8.26-prepilot-phase8c/`

- Payload: 25 files; package: 29 files
- Payload SHA-256:
  `a0befc5a165e014ef058f477ccc05cfdba24e3187fcdbb40792199e2645b6bdc`
- Package SHA-256:
  `23b5c38dfdb6e115d710b16e9e2bc168a2d69f571f94e17bef047ffef1acae4b`
- Test mode and test harness are disabled; OpenAI approval/readiness remains
  fail-closed.

## Two-paste bundle and transport copies

Path: `implementation/GoogleSpreadsheet/release/work-0039-single-file-company-install/`

The installation order is exactly:

1. paste `Code.gs`;
2. paste `appsscript.json`.

The directory contains `Code.gs`, `appsscript.json`,
`BUNDLE_PROVENANCE.json`, `CHECKSUMS.sha256`, `Code.gs.txt`, and
`appsscript.json.txt`.

- Bundle source count: 24 `.gs` files
- `Code.gs` SHA-256:
  `f205b7331bd56a7a7a5c11500f6c737aead26ed795c449fefa82b0ea8b536d27`
- `appsscript.json` SHA-256:
  `e546725fcfe47adfd40e094e66a6c866418cb6265441f541ee000c940d4a8afe`
- `BUNDLE_PROVENANCE.json` SHA-256:
  `cf0df42604f54bf049c89a16215870756daa467932aa14d1cb2a448eb74b78f5`
- `CHECKSUMS.sha256` SHA-256:
  `14dacb1ac1b80da03ec24deb6f2a53ea5bb4e5759c1a708febaa31a5a522764e`
- Both `.txt` copies are byte-identical to their corresponding paste files.
- Consecutive bundle builds are deterministic and byte-identical.

## Validation record

All checks below are local and non-Google. The focused provider test uses only
synthetic fixtures and fake transport; observed network calls: `0`.

| Command / check | Observed result |
|---|---|
| `node implementation/GoogleSpreadsheet/tools/validate_apps_script_v2.js` | PASS; 11/11 static checks |
| `node implementation/GoogleSpreadsheet/tests/work_0039_openai_provider_selection_test.js` | PASS; 7 tests, 0 network calls |
| `node implementation/GoogleSpreadsheet/tests/work_0038_single_file_company_install_test.js` | PASS; frozen Work 0038 bundle parity/reproducibility checks |
| `node implementation/GoogleSpreadsheet/tools/verify_work_0039_release.js` | PASS; Phase 8B/8C, bundle, checksums, and deterministic rebuild |
| `pnpm install --frozen-lockfile` | PASS in both local and CI-equivalent gates |
| `pnpm run verify:local` | PASS; 13/13 gate checks, 89 suites, missing 0, extra 0 |
| `pnpm run verify:ci` | PASS; 13/13 gate checks, 89 suites, missing 0, extra 0 |
| Work 0039 release/lineage/secret/diff gate | PASS; secret/local-state hit count 0, whitespace errors 0 |

The gate also observed `work0038_archive_refs_unchanged: true`,
`work0038_bundle_blob_hashes_unchanged: true`, and
`changed_frozen_path_count: 0`.

## Work 0038 preservation

The Work 0038 archive, release, and delivery artifacts were not changed.
Frozen archive refs remain:

- `refs/remotes/origin/archive/0038-gemini-source-baseline`:
  `272612831c4a46e45fdf166c65e3075ffee7dfef`
- `refs/remotes/origin/archive/0038-gemini-company-delivery`:
  `eccf27ec9f6b6fd023eca7b69279cc88741ecd9b`

The frozen Work 0038 bundle blob identities remained unchanged, including
`Code.gs`, `appsscript.json`, `BUNDLE_PROVENANCE.json`, and
`CHECKSUMS.sha256`.

## Governance and live-operation boundary

- Every OpenAI Responses request construction sets `store=false`.
- `store=false` is not treated as proof that abuse-monitoring retention is
  disabled.
- No company email/task data may be sent until the approved organization/project
  data controls and retention terms are separately confirmed.
- OpenAI data governance and live OpenAI qualification are
  `NOT_APPROVED_OR_UNKNOWN`; real OpenAI, Gemini, Gmail, Calendar, OAuth,
  Apps Script target, trigger, credential, deployment, and Automation checks are
  `NOT_EXECUTED`.
- Azure OpenAI, a gateway, or a proxy with a different endpoint,
  authentication, or data-processing contract remains a Strategy Reset
  condition.

## Issue classification

- Blocker for the requested local/non-live Work 0039 dispatch: none.
- Non-blocking limitation: company-environment governance, credential,
  provider, Workspace, and runtime acceptance remain unexecuted and must be
  handled under a separately authorized follow-up.
