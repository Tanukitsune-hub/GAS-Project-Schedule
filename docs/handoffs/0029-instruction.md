# Work 0029 — Gemini Runtime Activation Remediation

## Outcome

Make the Work 0028 Gemini integration genuinely executable for the next user-assisted personal-synthetic validation without enabling Automation, using a real credential, or making a real Gemini request in this Work.

Repair the independent-review blockers in one focused source-change cycle:

1. add no-argument top-level/menu-callable readiness and one-message Gemini synthetic entrypoints;
2. enforce the actual runtime Automation state, not only the compile-time default;
3. make the exact synthetic fixture meaningful enough to validate Task extraction and relative-date handling;
4. make the Gemini structured-output request use only the currently documented JSON Schema subset and add bounded generation settings;
5. repair active/canonical document encoding and historical inconsistencies;
6. produce and place one coherent successor candidate.

Highest permitted success status:

`READY_FOR_USER_GEMINI_KEY_CONFIGURATION_AND_ONE_MESSAGE_VALIDATION`

Work 0029 must not configure or inspect a real key and must not invoke Gemini, Gmail runtime, Task/Review/Calendar runtime, Setup, diagnostics, or any Apps Script function.

## Why Codex is needed

The residual work requires non-trivial Apps Script source changes, menu/runtime entrypoint design, strict guard ordering, provider request-schema hardening, release regeneration, executable tests, full local/CI validation, and one existing-target source placement.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Branch: `codex/0029-gemini-runtime-activation-remediation`
- Exact starting commit: `c3603c63b1e01afc2653b6b3a1063691c71d4cb3`
- Parent Work: `0028`
- Parent report: `docs/handoffs/0028-report.md`
- Parent Draft PR: `#42`
- Parent candidate: Code `2.8.15-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- Parent placement: existing personal-synthetic target, 24-file push/pull parity PASS
- Automation: intended OFF
- Real Gemini requests in Work 0028: `0`
- Company/production resources: prohibited

PR #42 remains Draft/Open/Unmerged. The independent ChatGPT review is recorded in PR #42 issue comment `5253375791` and is part of the required input.

## Mandatory repository and subagent setup

Before implementation:

1. read the complete `docs/handoffs/0029-instruction.md`;
2. read root `AGENTS.md` and every applicable nested `AGENTS.md`;
3. identify the repository-specific subagent-use policy before edits;
4. inspect the parent report and PR #42 independent-review comment;
5. confirm exact branch/ref, clean worktree, remote/upstream, fetch, and safe fast-forward state.

### Work-specific subagent rule

This handoff overrides old repository custom-agent defaults for Work 0029:

- standard Codex subagents are mandatory;
- do not invoke repository-defined Luna or Terra custom agents;
- use independent, non-overlapping subagents proportionately for runtime-entrypoint/guard review, provider-contract review, and release/document verification;
- do not use competing writers on overlapping files;
- the main agent owns synthesis, implementation consistency, final validation, commit/push/PR/report.

Do not modify `AGENTS.md` or `.codex`.

## ChatGPT-completed review

The following portions of Work 0028 were independently reviewed and are materially sound:

- the Gemini endpoint and `UrlFetchApp` are isolated in `20_GeminiProvider.gs`;
- authentication is limited to the fixed Script Property reference;
- non-2xx provider response bodies are not read;
- the provider registry remains fail-closed and does not fall back to Mock;
- `review_count` is now derived from write-time `review_required` metadata;
- Code `2.8.15-prepilot` A15/B15 lineage, 24-file inventory, local gate, CI, secret scan, guarded push, and pull-back parity passed;
- no real Gemini request or credential handling occurred.

The following are blocking the promised next runtime boundary:

### Blocker A — entrypoints are not callable

The implementation exposes only object methods:

- `WorkOsGeminiProvider.readiness()`
- `WorkOsWorker.runGeminiSyntheticValidation(options)`

There is no no-argument top-level Apps Script function and no menu action. The project has no authorized API-executable deployment, so `scripts.run` is not a fallback. The next user cannot perform the promised validation without another source change.

### Blocker B — Automation guard checks the wrong state

The synthetic entrypoint checks `WorkOsConfig.AUTOMATION_ENABLED`, which is only the compile-time default, and returns `automation_enabled:false` unconditionally.

Actual runtime Automation state is governed by Script Properties and time-driven Trigger state. The source already exposes runtime status through `WorkOsAutomation.getAutomationStatus()` / diagnostic status. The Gemini path must fail before credential, Gmail, or AI access unless actual runtime state is safely and consistently disabled.

### Blocker C — canonical document integrity

Active documents contain mojibake such as `窶・`, `蜿怜・`, `遯ｶ繝ｻ`, and `竊探ask...`. Historical facts were also overwritten, including Work 0018 being incorrectly changed from Code `2.8.14-prepilot` A14/B14 to A15/B15. Several sections still describe the Gemini provider or `review_count` fix as future work.

GitHub is the source of truth; active/canonical text must be repaired before the next handoff.

### Provider-contract hardening required before the first real request

The Work 0028 schema sent to Gemini includes `pattern` and `maxLength`. Current official Gemini Interactions structured-output documentation describes a supported JSON Schema subset and does not document these keywords. Do not depend on undocumented schema keywords for the first real request. Keep strict post-response validation authoritative.

The Work 0028 request also omits generation limits. `gemini-3.6-flash` supports `thinking_level`, `thinking_summaries`, and `max_output_tokens`; use bounded settings suitable for a classification workflow.

## Required-now scope

### 1. Add no-argument callable entrypoints

Provide exact top-level Apps Script functions callable from the Apps Script function selector and bound Spreadsheet menu.

Use stable, descriptive names such as:

- `checkGeminiSyntheticReadiness()`
- `runGeminiSyntheticValidationOnce()`

Equivalent names are acceptable only if the menu, guide, tests, and report are consistent.

Requirements:

- both functions take no arguments;
- readiness performs no Gmail or Gemini request and no mutation;
- validation performs at most one selected synthetic Gmail message and at most one Gemini request;
- the menu exposes both actions only in the intended pre-pilot/test surface;
- the validation menu action displays a clear confirmation that one real Gemini API request may occur in the later authorized Work;
- safe results contain only bounded enums/counts/booleans/provider-model-prompt metadata;
- no identifiers, email addresses, body text, API key, raw provider body, or endpoint error are displayed or logged;
- no API-executable deployment is created or required.

Do not add a source function that accepts, sets, prints, or deletes the API key. The user will configure the Script Property manually under a later explicit Work.

### 2. Enforce actual runtime Automation OFF before any external access

Before credential presence is read, before Gmail is searched/read, and before Gemini is called, obtain the actual runtime Automation status from the existing canonical Automation module or an equally strict shared helper.

The validation entrypoint must require all of the following:

- status is `CONSISTENT`;
- `enabled === false`;
- `desired_enabled === false`;
- scheduled worker handler trigger count is `0`;
- clock trigger count is `0`;
- no stored canonical automation trigger ID is present;
- no canonical scheduled trigger is present.

The normal installable edit Trigger is allowed and must not be confused with the scheduled Automation trigger.

Any mismatch must fail closed before credential/Gmail/Gemini access with one fixed safe error. Do not auto-disable, delete, repair, or mutate Automation state in this Work.

Readiness must report the actual bounded Automation status rather than a hard-coded false value.

### 3. Make the synthetic fixture exact and meaningful

Replace the opaque Work 0028 body-only sentinel with one exact canonical synthetic fixture that contains:

- a unique fixed sentinel;
- an explicit statement that it is fictional and contains no personal/confidential/production data;
- a concrete fictional Task request;
- a relative deadline such as seven days after the processing date;
- wording that makes the item an internal fictional task rather than an external submission, legal, tax, regulatory, contract, bid, or other high-impact Calendar item.

A suitable intent is:

`この完全な架空テストメールを処理した日から7日後までに、架空Gemini社内メモを確認してください。外部提出・契約・法務・税務・規制・入札ではありません。`

Use one exact subject and a normalized exact body contract. Normalize only benign transport differences such as CRLF/LF and terminal whitespace. Do not use permissive substring matching for the substantive body.

The one-message entrypoint must:

- select at most one exact synthetic candidate under the approved manual label/query boundary;
- fail before credential/AI if no exact candidate or more than one eligible candidate exists;
- verify the exact subject before body fetch;
- verify the normalized exact body before Gemini request;
- never process or mark a non-synthetic message;
- perform no retry or fallback;
- never fall back to Mock.

The future runtime expectation should be one new Review-required fictional Task with a due date seven days after the supplied `today`, no Calendar API call, and `review_count=1`. Keep acceptance tolerant to harmless model wording differences in the Task title while requiring valid schema and fictional semantics.

### 4. Harden the Gemini structured-output schema

Keep `WorkOsAiAdapter.validateOutput()` as the strict authoritative validator after the response.

The JSON Schema sent to Gemini must use only the currently documented structured-output subset needed here:

- supported primitive/object/array/null types;
- `properties`;
- `required`;
- `additionalProperties`;
- `enum`;
- `format` where documented, including `date` where useful;
- `minimum` / `maximum`;
- `items` and `maxItems`.

Remove provider schema reliance on undocumented `pattern` and `maxLength` keywords. The existing application validator must still enforce identifier formats and all string-length limits after parsing.

Add a focused test that recursively rejects unsupported provider-schema keywords and proves the application validator still rejects malformed IDs, invalid dates, and excessive strings.

### 5. Add bounded generation settings

For `gemini-3.6-flash` classification, add a bounded `generation_config`:

- `thinking_level: 'low'`;
- `thinking_summaries: 'none'`;
- a defensible bounded `max_output_tokens`, normally `4096` or lower if tests prove sufficient.

Do not add sampling parameters, tools, streaming, background execution, storage, URL context, search, code execution, function calling, or conversation persistence.

Tests must assert the exact bounded configuration and continue to prove one POST and one credential header only.

Apps Script `UrlFetchApp` does not provide a documented per-request timeout field. Preserve the existing pre-call execution-budget check and document that limitation honestly; do not claim that `request.timeout_ms` is enforced by `UrlFetchApp`.

### 6. Preserve and strengthen credential safety

Retain the fixed Script Property reference and existing fail-closed behavior.

Requirements:

- no API key in source, tests, GitHub, docs, report, logs, or chat;
- readiness returns only configured/not-configured;
- validation reads the key only after runtime Automation and exact synthetic-candidate guards pass;
- one request maximum;
- local tests use obviously synthetic fake values only;
- personal and company environments use separate Script Property values; no key sharing is implied.

### 7. Repair active/canonical document integrity

Repair every active/current file affected by Work 0028 encoding or stale-history damage, including at least:

- `CURRENT_STATUS.md`
- `PROJECT_CONTEXT.md`
- `MASTER_PLAN.md`
- `DECISIONS.md`
- root `README.md`
- current Apps Script README/changelog/manual guides/traceability docs
- current visualizations and current 2.8.15/2.8.16 release guides where applicable.

Requirements:

- restore valid UTF-8 Japanese and punctuation;
- remove all known mojibake sequences and Unicode replacement characters from active/current text;
- preserve historical Work facts: Work 0018 remains Code `2.8.14-prepilot`, A14/B14;
- describe Work 0028 as the Gemini provider implementation and `review_count` repair, not future work;
- describe Work 0029 as runtime-activation remediation;
- distinguish the machine source/release gate from accepted synthetic runtime evidence without contradictory blocker statements;
- do not rewrite historical handoff reports/instructions merely for style;
- do not alter established evidence claims without source support.

Add an automated active-text integrity test that scans the intended canonical/current files for known mojibake/replacement patterns and checks key historical version/lineage statements.

### 8. Version and release identity

Because deployed source bytes change, create the next coherent candidate:

- Code `2.8.16-prepilot`;
- Schema `2.6` unchanged;
- AI Schema `2.0` unchanged;
- Migration `3` unchanged;
- TEST_MODE `true` in the normal pre-pilot package;
- Automation OFF.

Keep the current 24-file payload inventory:

- 23 `.gs` files;
- one `appsscript.json`;
- no new deployed file unless a concrete need is proven.

Regenerate Phase 8B/8C packages under the existing A16/B16 direct-child convention. Keep Phase 8C limited to the established TEST_MODE-only transform and harness exclusion.

Update source, release manifests/checksums, `CURRENT_CONTRACT.json`, current docs/visualizations, verifiers, placement tooling, and consistency tests coherently. Do not refactor the historical release system.

### 9. Focused and full validation

Run at minimum:

- callable top-level/menu entrypoint tests;
- readiness proves zero Gmail/Gemini/mutation;
- actual Automation-state guard tests for enabled, desired-enabled, stale property, scheduled trigger, duplicate trigger, and consistent disabled states;
- guard-order tests proving credential/Gmail/AI are untouched on Automation or synthetic-candidate failure;
- exact subject/body normalization and zero-real-message tests;
- one-call/no-retry/no-Mock-fallback tests;
- meaningful synthetic fixture and relative-date classification path with fake Gemini response;
- structured-output supported-keyword test;
- post-response strict ID/date/length validator regressions;
- generation-config tests;
- existing Gemini provider, AI boundary, privacy/redaction, provider-failure, Worker, Task authority, Review, Calendar, Gmail, and Automation tests;
- active-text UTF-8/mojibake/history-integrity test;
- every current `*_test.js` suite;
- Apps Script static/syntax/inventory validation;
- complete local verification gate;
- release checksums/parity/direct-child lineage;
- secret/local-state scan;
- `git diff --check`;
- any current fresh committed-LF/fresh-checkout checks.

All tests must remain network-free and use fake Apps Script services.

### 10. Pre-Google commit, CI, and one existing-target placement

Before any Google mutation:

1. complete source/tests/docs/release regeneration;
2. commit and push the exact pre-Google head;
3. require applicable exact-head push and PR CI SUCCESS;
4. confirm clean worktree, 24-file inventory, release parity, and no secrets.

Only after those gates pass:

- reuse only the same existing personal-synthetic Apps Script target;
- no new Spreadsheet, Apps Script project, deployment, account, auth profile, or Cloud project;
- require project-local clasp eligibility immediately before push;
- perform at most one guarded source push;
- require semantic evidence for exactly 24 files;
- optionally perform at most one independent pull-back and require exact 24-file parity;
- do not retry after an attempt begins;
- do not invoke any Apps Script function after placement in Work 0029.

The external-request OAuth scope already exists. If later user execution requires reauthorization, that belongs to the next Work and is not a Work 0029 failure.

## Explicitly prohibited

- no real Gemini API request;
- no real API key creation, configuration, readback, rotation, deletion, printing, or inspection;
- no Gmail runtime search/read/import;
- no Task/Review/Calendar runtime mutation;
- no Setup/Continue Setup;
- no Quick/Deep Diagnostic or Dashboard refresh;
- no Apps Script function invocation;
- no trigger mutation or Automation enable/disable;
- no new deployment, Cloud project, target, account, or auth profile;
- no company/production Workspace resource or real data;
- no merge, rebase, history rewrite, or force push;
- no `AGENTS.md` or `.codex` change.

## Acceptance

PASS requires all of the following:

- no-argument top-level readiness and one-message Gemini validation functions exist and are callable from the menu/function selector;
- no API-executable deployment is required;
- readiness is network-free and reports actual bounded Automation state;
- validation fails before credential/Gmail/AI unless runtime Automation is consistently disabled with zero scheduled triggers;
- exact meaningful synthetic subject/body guards prevent real-message processing;
- at most one Gemini request is possible with no retry or Mock fallback;
- provider schema uses only the documented supported subset while strict post-response validation remains intact;
- bounded low-thinking/no-summary/max-output configuration is present;
- canonical/current docs are valid UTF-8, historically accurate, and non-contradictory;
- Code `2.8.16-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3` is coherent;
- exact payload inventory remains 23 `.gs` plus manifest;
- focused/full local checks and exact-head CI pass;
- one existing-target push succeeds and optional pull-back, if used, has exact parity;
- real Gemini/Gmail/Calendar/Apps Script runtime calls remain `0`;
- real credential operations remain `0`;
- Automation remains OFF;
- final worktree is clean;
- no prohibited operation occurs.

Highest permitted status:

`READY_FOR_USER_GEMINI_KEY_CONFIGURATION_AND_ONE_MESSAGE_VALIDATION`

## Stop and escalation conditions

Stop with a precise BLOCKER and no workaround if:

- a safe no-argument callable entrypoint cannot be created without an API deployment;
- actual Automation state cannot be verified before all external access;
- exact synthetic selection would risk processing a non-synthetic message;
- the Gemini structured-output contract cannot be represented using the documented subset;
- the code repair requires a real key/request or networked local test;
- canonical text cannot be repaired without rewriting historical evidence;
- A16/B16 release lineage or 24-file inventory cannot be made coherent;
- exact-head CI fails materially;
- existing target/auth identity is ambiguous;
- a second push/target/account would be required;
- any secret, identifier, real data, or raw provider response appears in tracked evidence.

## Git, PR, and report requirements

Create and commit:

`docs/handoffs/0029-report.md`

The report must include:

- final status and BLOCKER;
- callable entrypoint names and safe user flow;
- actual Automation guard and guard ordering;
- exact synthetic fixture contract without any real/private data;
- structured-output schema compatibility and bounded generation settings;
- credential boundary and zero credential operations;
- document encoding/history repair scope and automated integrity result;
- changed files at a high level;
- Code `2.8.16-prepilot` A16/B16 identity and 24-file inventory;
- focused/full test counts, exact CI evidence, and release parity;
- target push/pull attempt counts and parity;
- explicit real Gemini/Gmail/Calendar/Apps Script function-call counts;
- Automation OFF;
- exact next user-assisted boundary, including that the API key must be entered manually in Script Properties and never pasted into GitHub, Codex, or ChatGPT.

Then:

- push completed Work 0029 to `codex/0029-gemini-runtime-activation-remediation`;
- update/create a Draft PR against `codex/0028-gemini-provider-integration`;
- link instruction/report and the PR #42 independent-review comment;
- record final head, test/CI results, candidate identity, inventory, external-call counts, and placement evidence;
- keep both PR #42 and the Work 0029 PR Draft/Open/Unmerged;
- verify final report-head GitHub Actions;
- confirm clean worktree;
- do not merge.

Return in Codex chat only:

Work ID
Report path
Final commit
Branch
PR
BLOCKER status
