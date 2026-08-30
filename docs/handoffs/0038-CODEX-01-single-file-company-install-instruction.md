# Work 0038 — Single-File Company Install

WORK_ID: `0038`

Dispatch ID: `0038-CODEX-01`

BALL: `CODEX`

STATUS: `READY`

Recommended model: `Luna Max` — the design is closed; this is deterministic packaging, validation, and delivery convergence rather than open-ended architecture work.

## Primary Outcome

Reduce the manual company-PC Apps Script installation path from the current 22 `.gs` files plus `appsscript.json` to exactly two copy/paste actions:

1. paste one generated application bundle into the default Apps Script `Code.gs` file;
2. reveal and replace `appsscript.json` with the existing validated Phase 8C manifest.

The user must not have to create or paste 22 separate Apps Script source files.

## Source of Truth

- Current Work: `docs/handoffs/0038-instruction.md`
- Current company delivery record: `docs/handoffs/0038-delivery.md`
- Work 0037 completion: `docs/handoffs/0037-completion.md`
- Canonical authored source: `implementation/GoogleSpreadsheet/apps-script-v2/`
- Exact validated Phase 8C runtime payload: `implementation/GoogleSpreadsheet/release/v2.8.25-prepilot-phase8c/apps-script/`
- Current delivery branch: `delivery/0038-company-live-bundle`
- Current delivery commit recorded by Work 0038: `ede198f216476a1864f275ea8192fa9134df7f94`

At dispatch creation, the Phase 8C payload contains 22 `.gs` files plus `appsscript.json`; the `.gs` source totals approximately 1.13 MiB. The manifest includes the required Gmail and Calendar Advanced Services plus explicit OAuth scopes, so retaining it as the second paste is intentional.

## Already-Decided Design Choices

- This is a packaging/installability change only. Do not refactor business logic.
- Keep the 22-file modular Apps Script source as the canonical developer source.
- Do not modify or rewrite the frozen Work 0037 Phase 8C release package or its historical provenance.
- Generate a derived one-file company-install artifact from the exact Phase 8C `.gs` payload.
- Preserve each source file's bytes inside the generated bundle apart from deterministic separator comments/newlines required to prevent token merging and record provenance.
- Use an explicit deterministic source order. Prefer an existing release/tooling order if one is already authoritative; otherwise use `00_...` through `20_...`, followed by `Menu.gs`. Do not rely on filesystem/glob ordering implicitly.
- Keep `appsscript.json` byte-identical to the validated Phase 8C manifest.
- The preferred manual company install path must be `Code.gs` + `appsscript.json`, not `clasp` and not 22 manual source files.
- `clasp` may remain documented only as an optional engineering path; it must not be the quick-start path for the user.
- Do not add Apps Script API/self-modifying bootstrap logic, extra OAuth scopes, external loaders, remote code fetches, `eval` loaders, or company-specific code forks.
- Do not change Code/Schema/AI Schema/Migration versions, Gemini provider/model/endpoint, automation defaults, trigger behavior, filters, Task authority, Calendar ownership, privacy controls, or readiness gates.
- Automation remains OFF. No live Workspace/provider action is authorized in this dispatch.

## Required Scope

Produce the smallest coherent implementation that makes the two-paste manual path real and reproducible.

Required deliverables:

- a deterministic repository tool that builds the one-file `Code.gs` from the exact Phase 8C source files;
- a generated company-install directory/artifact containing `Code.gs`, the validated `appsscript.json`, and compact provenance/checksum metadata;
- focused validation proving the generated bundle contains the complete intended source set exactly once and is reproducible;
- bundle-specific syntax/load/smoke validation strong enough to catch concatenation-only failures rather than validating only the original modular source;
- updated Work 0038 company delivery instructions whose first/manual path is exactly two paste actions;
- an updated delivery branch/package so the user can open/copy the one-file artifact directly without locally running a build command;
- a completion report at `docs/handoffs/0038-CODEX-01-single-file-company-install-report.md`;
- update `docs/handoffs/0038-dispatches.md` at return so BALL=`CHATGPT`, STATUS=`RETURNED`, with final refs.

Choose repository-conventional file locations after inspecting the current tool/release layout. Do not place the generated bundle inside the frozen Work 0037 release directory if doing so would alter its historical identity.

## Acceptance Evidence — Priority Order

1. Manual install count: the company guide requires exactly one application-code paste into `Code.gs` plus one manifest paste into `appsscript.json`; no creation of 22 code files.
2. Source parity: every Phase 8C `.gs` source file is represented exactly once in the bundle and can be proven byte-for-byte against the validated payload; no source file is omitted, duplicated, reordered accidentally, or edited by hand.
3. Manifest identity: bundled `appsscript.json` is byte-identical to the validated Phase 8C manifest.
4. Bundle-specific validation: the combined file is parsed/loaded using an appropriate local V8-compatible harness or equivalent focused test, and at least representative non-live entrypoints are exercised from the combined artifact when the repository harness permits it. Do not treat tests that load only the original 22 files as bundle validation.
5. Existing regression: the applicable repository static/local gate remains PASS after adding packaging tooling/tests. No live provider or Google action is required.
6. Reproducibility: two consecutive builds from the same Phase 8C inputs produce byte-identical `Code.gs` and metadata/checksums.
7. Delivery usability: the updated `delivery/0038-company-live-bundle` exposes the quick-copy artifact plainly and its `README_FIRST.md` / `COMPANY_LIVE_DEPLOYMENT_GUIDE.md` point to it before the legacy multi-file path.
8. Security/privacy: no credential, `.clasp.json`, company/personal identifier, private URL, message content, or runtime state enters the generated artifact, report, or GitHub history.

## Validation Requirements

Run the strongest practical non-live validation supported by the repository, including:

- the new focused single-file build/parity test;
- syntax/static validation appropriate to the generated bundle;
- the repository's applicable local verification gate (`pnpm install --frozen-lockfile` / `pnpm run verify:local` where required by current repository rules and compatible with the change);
- deterministic rebuild comparison;
- secret/local-state scan over the new delivery artifact;
- final diff review against Work 0038 scope.

Record exact commands and observed PASS/FAIL/SKIPPED results. Do not report a company Apps Script paste/runtime check as PASS unless it was actually executed by the user later under Work 0038.

## Non-Goals

- No product feature change.
- No source-code consolidation/refactor of `apps-script-v2/`.
- No version bump or new release baseline merely for packaging.
- No change to the frozen Phase 8C runtime source package.
- No company Google Workspace deployment in this dispatch.
- No Gemini/API credential handling.
- No OAuth, Gmail, Calendar, trigger, Apps Script, or external-provider mutation.
- No broad documentation cleanup unrelated to the company quick-install path.

## Decision-Impact / Strategy Reset

Do not expand the task for cosmetic findings or unrelated legacy issues.

Trigger a Strategy Reset only if direct evidence shows that a single approximately 1.13 MiB `.gs` file is technically rejected by the Apps Script project/editor/API or that concatenation changes runtime behavior in a way that cannot be safely resolved as packaging.

If that happens, preserve the same objective and fall back to the minimum demonstrated safe count, preferably two generated `.gs` bundles plus the manifest (three pastes total), rather than returning to 22 files. Document the evidence that forced the fallback.

## Write / Git Boundaries

- Work ID remains `0038`.
- This is the only active Codex dispatch for Work 0038.
- Use a scoped Codex branch such as `codex/0038-single-file-company-install` for implementation/testing unless repository state makes an equivalent scoped branch clearly safer.
- Update the existing `delivery/0038-company-live-bundle` only after the generated artifact and validation are accepted locally; preserve existing provenance files and the original modular payload unless removal is demonstrably needed.
- Do not force-push, rewrite history, delete historical release evidence, or modify unrelated files.
- Keep changes reviewable and reversible.

## Return Report

Return with:

- final branch and commit(s);
- PR URL/state if a PR is used;
- exact generated quick-install artifact paths;
- exact manual paste count achieved;
- source-parity and manifest-identity evidence;
- bundle-specific validation evidence;
- existing local/CI gate results actually observed;
- delivery-branch final commit/tree identity;
- final diff summary;
- BLOCKER / non-blocking issue / optional improvement classification;
- confirmation that no live company action or credential handling occurred.

Do not stop at a design proposal. Return only after the user-copyable artifact is actually present in GitHub and validated, or after a genuine blocker has been evidenced.

WORK_ID: `0038`

Dispatch ID: `0038-CODEX-01`

BALL: `CODEX`

STATUS: `READY`
