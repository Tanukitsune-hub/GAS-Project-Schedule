# Work 0039 / Dispatch 0039-CODEX-02 — ChatGPT Review

WORK_ID: `0039`

DISPATCH_ID: `0039-CODEX-02`

BALL: `CHATGPT`

STATUS: `RETURNED_WITH_BLOCKERS`

## Reviewed GitHub evidence

- Draft PR: `#55`
- PR head: `e9e0fe1515170f030788cdfda34099d5c1839c31`
- PR base: `main` at `cf970e3ab46a2ee4e6bc2d392cd2f67461a01329`
- GitHub synthetic merge commit: `0cc4ade1c8a8be01ce0eeb3c62a3d79c45b712de`
- Push CI run `33699137347`: `SUCCESS`
- PR CI run `33699214286`: `FAILURE`
- Completion report and all three Work 0039 release paths are remotely readable.
- Work 0038 archive refs remain at their frozen SHAs.
- Live Google Workspace, OpenAI, Gemini, credentials, deployment, triggers, and Automation remain `NOT_EXECUTED`.

## Outcome judgment

The publication requirement of Dispatch 0039-CODEX-02 was satisfied: the local result was fast-forward pushed, remotely readable, and exposed through Draft PR #55. However Work 0039 is not accepted because independent review found two product BLOCKERs in addition to one CI-harness defect.

## BLOCKER 1 — OpenAI response envelope parser rejects documented valid Responses API output

File:

`implementation/GoogleSpreadsheet/apps-script-v2/21_OpenAiProvider.gs`

The parser currently requires the response root to contain only `ROOT_RESPONSE_FIELDS`. The allowlist omits documented Response fields including `completed_at`, `instructions`, and `user`. A normal completed Responses API object may therefore be rejected as `INVALID_RESPONSE` even when the classification itself is valid.

The parser also requires every entry in `output` to be a `message`. The Responses API defines `output` as `ResponseOutputItem[]`; its length/order depend on the model response, and reasoning models can return reasoning output items. The parser must tolerate documented non-message reasoning items without inspecting/persisting their content while still requiring exactly one valid assistant classification message and rejecting refusals/tool calls/unsupported output items.

Official reference used for review:

- `https://developers.openai.com/api/reference/cli/resources/responses/methods/create`
- `https://developers.openai.com/api/reference/cli/resources/beta/subresources/responses`

The current synthetic test fixture is too small: it supplies only `status` plus one message output and therefore does not prove compatibility with a realistic API response envelope.

## BLOCKER 2 — Production provider switch can miss persisted RETRY / in-flight Message State

Files:

- `implementation/GoogleSpreadsheet/apps-script-v2/22_AiProviderSelection.gs`
- `implementation/GoogleSpreadsheet/apps-script-v2/Menu.gs`
- `implementation/GoogleSpreadsheet/apps-script-v2/18_Worker.gs`

The design requires provider switching to be blocked while unresolved AI retry/in-flight state exists so one message cannot cross providers.

`switchProvider()` reads Message State only when a `spreadsheet` argument is supplied. Normal production menu wrappers call `switchAiProviderToGemini()` / `switchAiProviderToOpenAi()` without options. In that path `spreadsheet` is `null`; `recordStateCounts()` then falls through to `{ in_flight_count: 0, pending_retry_count: 0 }` instead of failing closed or reading the bound Spreadsheet.

The focused tests inject `in_flight_count` and `pending_retry_count` directly, so they do not exercise this production no-options path.

`18_Worker.gs` adds `assertProviderUnchanged()` after a classification request. That protects against a provider change during the same request, but does not persistently pin a provider across a later RETRY. The existing Message State contract contains `RETRY` and scheduled processing prioritizes due RETRY records. Therefore a persisted retry can survive after the worker lease ends, a provider switch can be accepted, and a later retry can resolve the newly selected provider.

Required outcome: the production switch path must inspect the actual bound Message State under the held Script Lock and fail closed if that state cannot be inspected. At minimum any relevant `RETRY`, `CLAIMED`, or `PREPROCESSED` state that could re-enter classification must block switching. Prefer this minimal guard approach over a schema migration unless direct evidence proves persistent provider pinning is required.

## BLOCKER 3 — PR CI scope checker misclassifies GitHub synthetic merge as donor merge

File:

`implementation/GoogleSpreadsheet/tools/work_0039_validation_gate.js`

On a `pull_request` workflow, `actions/checkout` checks out GitHub's synthetic `refs/pull/55/merge` commit. The gate then executes:

`git rev-list --merges <startingMain>..HEAD`

and fails if any merge commit exists. This necessarily sees the GitHub-created synthetic merge and returns `DONOR_MERGE_COMMIT_PRESENT`.

GitHub PR CI evidence shows all other 12 checks PASS, including 89 regression suites, release verification, lineage, Work 0038 preservation, secret scan, and diff check.

Required outcome: in an authenticated pull-request CI context where `GITHUB_HEAD_REF` is exactly the expected Work 0039 branch, perform donor-merge/history scope checks against the PR head parent rather than the synthetic merge commit, while keeping the other validations on the checked-out merge tree. The exemption must not permit actual merge commits inside the PR head history.

## Accepted evidence retained

The following does not need to be reopened absent contrary evidence:

- Work 0039 source was published to GitHub and Draft PR #55 exists.
- Push CI for `e9e0fe1515170f030788cdfda34099d5c1839c31` succeeded.
- 89 suites pass on the PR synthetic merge; only scope fails.
- Work 0039 release verifier passes and txt transport copies are byte-identical.
- Work 0038 frozen archive/release/bundle evidence remains unchanged.
- Secret scan and diff check pass.
- No live provider/Workspace/credential action occurred.
- OpenAI company data-governance state remains `NOT_APPROVED_OR_UNKNOWN` and continues to block company live use.

## FIX SOON

None separate from the BLOCKER remediation above.

## BACKLOG / later qualification

- Confirm whether the company service is direct OpenAI API rather than Azure OpenAI or a proxy.
- Confirm acceptable company OpenAI retention/data-governance state.
- Configure credential only in the authorized company environment.
- Run one exact synthetic live qualification while Automation remains OFF.
- Company Workspace deployment and Automation acceptance remain separate later evidence.

## Disposition

Route to `0039-CODEX-03` for the narrow remediation of the two product blockers plus the PR-CI harness defect, followed by release/bundle regeneration and full non-live verification. Keep PR #55 Draft and do not merge.

WORK_ID: `0039`

DISPATCH_ID: `0039-CODEX-02`

BALL: `CHATGPT`

STATUS: `RETURNED_WITH_BLOCKERS`
