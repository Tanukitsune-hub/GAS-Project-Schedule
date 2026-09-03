# Work 0039 / Dispatch 0039-CODEX-03 — OpenAI Contract, Retry Boundary, and PR-CI Remediation

WORK_ID: `0039`

DISPATCH_ID: `0039-CODEX-03`

BALL: `CODEX`

STATUS: `READY`

MODE: `BUILD`

Recommended model: `Sol High` — the remaining work is narrow but crosses the real OpenAI response contract, production provider-switch safety, tests, generated releases/bundle, and CI scope handling.

## Primary Outcome

Make the already-published Work 0039 implementation genuinely ready for non-live acceptance by fixing:

1. compatibility with documented OpenAI Responses API response envelopes;
2. fail-closed provider switching when persisted Message State contains unresolved classification/retry work;
3. the PR-CI false failure caused by GitHub's synthetic merge checkout.

Then regenerate the existing Work 0039 candidate releases/bundle from the corrected canonical source, run the full non-live verification, and return Draft PR #55 to green. Do not perform any live provider or Workspace action.

## Authoritative review

Read first:

- `docs/handoffs/0039-CODEX-02-review.md`
- `docs/handoffs/0039-CODEX-01-openai-provider-selection-instruction.md`
- `docs/handoffs/0039-CODEX-01-openai-data-governance-addendum.md`

Implementation branch remains:

`codex/0039-openai-provider-selection`

Draft PR remains:

`#55`

Do not create a replacement PR unless GitHub proves #55 cannot be updated normally.

## Accepted evidence — do not reopen without contrary evidence

- Published pre-remediation head: `e9e0fe1515170f030788cdfda34099d5c1839c31`.
- Push CI `33699137347` succeeded.
- PR CI `33699214286` executed on synthetic merge `0cc4ade1c8a8be01ce0eeb3c62a3d79c45b712de` and passed 12/13 checks; only `scope` failed with `DONOR_MERGE_COMMIT_PRESENT`.
- 89 regression suites passed on that synthetic merge.
- Work 0039 release verification, deterministic rebuild, txt identity, lineage, Work 0038 frozen preservation, secret scan, and diff check passed.
- Work 0038 archives remain immutable:
  - `archive/0038-gemini-source-baseline` -> `272612831c4a46e45fdf166c65e3075ffee7dfef`
  - `archive/0038-gemini-company-delivery` -> `eccf27ec9f6b6fd023eca7b69279cc88741ecd9b`
- Live Google Workspace/OpenAI/Gemini/credential/deployment/trigger/Automation remain `NOT_EXECUTED`.
- OpenAI governance remains `NOT_APPROVED_OR_UNKNOWN`.

## BLOCKER 1 — Real Responses API envelope compatibility

Current file:

`implementation/GoogleSpreadsheet/apps-script-v2/21_OpenAiProvider.gs`

Current `responseObject()` is too brittle. It rejects valid documented response-root fields such as `completed_at`, `instructions`, and `user`, and requires every `output` item to be a `message`.

Official OpenAI reference:

- `https://developers.openai.com/api/reference/cli/resources/responses/methods/create`
- `https://developers.openai.com/api/reference/cli/resources/beta/subresources/responses`

The official contract states that `output` is `ResponseOutputItem[]`, its length/order depend on the model response, and reasoning models can emit reasoning output items.

### Required remediation

- Continue requiring a completed response and exactly one accepted assistant classification message containing exactly one non-empty `output_text` classification payload.
- Tolerate documented response-root metadata that is irrelevant to classification. Prefer reading only required fields rather than maintaining a brittle whole-root exact allowlist.
- Tolerate documented reasoning output items without inspecting, logging, persisting, or surfacing their reasoning content.
- Continue rejecting refusals, tool/function calls, unexpected executable/tool output, multiple classification messages, malformed content, annotations/logprobs when disallowed, incomplete/failed response, and oversized output.
- Do not weaken the final canonical `WorkOsAiAdapter` validator.
- Keep `store=false`, `stream=false`, `background=false`, and `tools=[]`.

### Required tests

Add realistic raw Responses API fixtures that include at least:

- `id`, `object`, `created_at`, `completed_at`, `status`, `error`, `incomplete_details`, `instructions`, `model`, `output`, `parallel_tool_calls`, `previous_response_id`, `reasoning`, `store`, `text`, `tool_choice`, `tools`, `top_p`, `truncation`, `usage`, `user`, and `metadata`;
- one successful message-only output;
- one successful output containing a documented reasoning item plus exactly one assistant message;
- refusal;
- tool/function output;
- multiple assistant messages;
- malformed/extra classification fields that canonical validation rejects.

The test must demonstrate that documented provider metadata is ignored rather than persisted.

## BLOCKER 2 — Production switch must inspect real persisted Message State

Current file:

`implementation/GoogleSpreadsheet/apps-script-v2/22_AiProviderSelection.gs`

Production menu wrappers invoke switch functions without injected `spreadsheet`, `message_records`, or counts. In that path `recordStateCounts()` can return zero counts without inspecting the actual bound Message State.

This violates the closed Work 0039 conclusion that a provider switch must not allow a later retry of the same message to cross providers.

### Required remediation

Use the smallest safe design unless direct evidence requires a schema change:

- In the real production switch path, resolve the bound active Spreadsheet explicitly.
- While holding the existing Script Lock, open the actual Message State sheet/context through the repository's held-lock API and inspect persisted logical rows.
- Fail closed with a bounded safe reason if the Spreadsheet, Message State sheet, schema/context, or inspection is unavailable.
- Block provider switching whenever unresolved classification work could later invoke AI under a different provider. At minimum the existing relevant `CLAIMED`, `PREPROCESSED`, and `RETRY` states must be considered; conservatively blocking all persisted `RETRY` states is acceptable if simpler and safe.
- Preserve the active-worker-lease and Automation/clock-trigger guards.
- Continue to prevent provider changes during an active request via `assertProviderUnchanged()`.
- Do not introduce automatic fallback.
- Avoid a schema/migration change if the real-state switch guard is sufficient. If it is not sufficient, stop and report a Strategy Reset before implementing a larger provider-pinning schema redesign.

### Required tests

The focused Work 0039 tests must exercise the production-shaped path, not only injected integer counts:

- bound Spreadsheet + real-style Message State context containing `RETRY` -> switch blocked;
- `CLAIMED` -> blocked;
- `PREPROCESSED` -> blocked;
- clean terminal/no-pending state -> switch permitted when all other guards are satisfied;
- Message State unavailable/corrupt -> fail closed;
- active lease -> blocked;
- Automation enabled/inconsistent or owned trigger present -> blocked;
- no provider request is made by switching;
- after a failed switch attempt the authoritative provider property is unchanged.

## BLOCKER 3 — PR synthetic merge scope false positive

Current file:

`implementation/GoogleSpreadsheet/tools/work_0039_validation_gate.js`

The current donor-merge check runs against `HEAD`. On `pull_request`, GitHub checks out `refs/pull/<n>/merge`, so the GitHub-created synthetic merge itself triggers `DONOR_MERGE_COMMIT_PRESENT`.

### Required remediation

- Preserve donor-merge detection for the actual Work 0039 branch history.
- In the exact GitHub pull-request context for the expected Work 0039 head branch, identify the PR head parent from the synthetic merge and perform ancestry / donor-merge / governance-scope history checks against that actual PR head.
- Validate that the checked-out synthetic commit has the expected merge shape before using its head parent. Do not blindly exempt arbitrary merge commits because an environment variable is present.
- Keep all content/static/test/release/lineage/secret/diff validations on the checked-out PR merge tree where appropriate, so PR CI still tests the combined result with current `main`.
- Local branch and push CI behavior must remain unchanged.

Add focused coverage for:

- normal branch head with no merges -> PASS;
- actual donor merge inside the Work branch -> FAIL;
- valid GitHub synthetic PR merge whose PR head has no donor merge -> PASS;
- malformed/unexpected detached merge context -> FAIL closed.

## Release and candidate version

This is remediation before Work 0039 acceptance, not a new product outcome.

- Keep code version `2.8.26-prepilot` unless repository tooling proves another increment is mandatory.
- Update canonical source, tests, verification tooling, provenance, CURRENT_CONTRACT/status/docs as necessary.
- Regenerate the existing Work 0039 candidate paths from the new corrected source commit:
  - `implementation/GoogleSpreadsheet/release/v2.8.26-prepilot/`
  - `implementation/GoogleSpreadsheet/release/v2.8.26-prepilot-phase8c/`
  - `implementation/GoogleSpreadsheet/release/work-0039-single-file-company-install/`
- Update checksums/provenance/source commit consistently.
- Preserve the two-paste install format and byte-identical `.txt` transport copies.
- Do not touch Work 0038 frozen release/archive/delivery bytes.

## Required validation

At minimum run and report observed results for:

- focused OpenAI raw-response compatibility suite;
- focused production-shaped provider-switch/retry guard suite;
- focused Work 0039 CI-scope synthetic-merge suite;
- `node implementation/GoogleSpreadsheet/tools/validate_apps_script_v2.js`;
- all current `*_test.js` suites / inventory;
- Work 0039 release verifier and deterministic rebuild;
- Work 0038 frozen preservation/lineage;
- `pnpm install --frozen-lockfile`;
- `pnpm run verify:local`;
- `pnpm run verify:ci` on the local branch head;
- secret/local-state scan;
- `git diff --check`.

Then push normally to the existing `codex/0039-openai-provider-selection` branch and verify:

- push CI: `SUCCESS`;
- Draft PR #55 CI: `SUCCESS` on the new GitHub synthetic merge;
- PR remains Draft and unmerged;
- Work 0038 archive SHAs unchanged.

Do not force-push, rebase/squash published history, or merge PR #55.

## Live / external boundary

Do not perform:

- real OpenAI request;
- real Gemini request;
- Gmail/Calendar live operation;
- OAuth qualification;
- company Apps Script deployment;
- credential read/write;
- trigger mutation;
- Automation enablement;
- company environment inspection.

All remain `NOT_EXECUTED`. OpenAI governance remains `NOT_APPROVED_OR_UNKNOWN`.

## Completion report

Update the Work 0039 completion/report evidence so it no longer claims the prior retry boundary or provider response compatibility as accepted evidence without the new remediation tests.

Create or update a `0039-CODEX-03` report with:

- starting published head `e9e0fe1515170f030788cdfda34099d5c1839c31`;
- final head;
- exact changed files;
- response-parser fix summary;
- production Message State switch-guard fix summary;
- PR synthetic-merge CI fix summary;
- new release source commit and bundle/checksum evidence;
- exact local validation results;
- push and PR CI run IDs/conclusions;
- Work 0038 archive/ref preservation;
- BLOCKER / non-blocking issue classification;
- confirmation that all live external actions remain `NOT_EXECUTED`.

## Strategy Reset

Stop and return without speculative redesign if:

- direct OpenAI response behavior cannot be represented without weakening canonical validation;
- preventing cross-provider retry actually requires a durable schema/migration redesign rather than the planned switch guard;
- fixing PR CI requires bypassing donor-merge protections rather than distinguishing GitHub's synthetic merge from branch history;
- candidate bundle hits a demonstrated Apps Script size/editor limit.

WORK_ID: `0039`

DISPATCH_ID: `0039-CODEX-03`

BALL: `CODEX`

STATUS: `READY`
