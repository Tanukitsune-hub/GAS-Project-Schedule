# Work 0030 Report — Gemini Thinking-Step Parser Remediation

## Outcome

Work 0030 completed the committed Gemini response-step remediation and placed
the coherent Code `2.8.17-prepilot` candidate to the one existing
personal-synthetic Apps Script target under the authorized one-use lane.

Highest permitted status:

`READY_FOR_USER_GEMINI_KEY_CONFIGURATION_AND_ONE_MESSAGE_VALIDATION`

## Root cause and repair

`responseObject()` had required a completed Interactions response to contain
exactly one `model_output` step. Gemini thinking responses may instead contain
zero or more opaque `thought` steps before the final output. The repaired,
fail-closed grammar is:

```text
thought* model_output
```

The parser now requires a primitive completed status, non-array object steps,
and exactly one final `model_output` with exactly one nonempty `text` content
block. It rejects unknown, missing, duplicate, out-of-order, incomplete,
failed, or malformed shapes. Thought signatures and summaries are not read,
parsed, logged, hashed, persisted, or surfaced. The extracted final text alone
continues to the existing strict `WorkOsAiAdapter` classification validator.

The Gemini request contract is unchanged: `/v1/interactions`,
`gemini-3.6-flash`, structured JSON response format, low thinking, no
summaries, 4096 output-token cap, `store:false`, `stream:false`,
`background:false`, no tools, one transport call, no retry, and no Mock
fallback.

## Candidate and lineage

- Candidate: Code `2.8.17-prepilot`, Schema `2.6`, AI Schema `2.0`,
  Migration `3`, `TEST_MODE=true`, Automation `OFF`.
- A17 source commit: `8b4267c7ff9f156866df171107ddd5aed02d8268`.
- B17 release commit: `39bc50e28b2aa93d4d5be2cdf9bc797f3c08083f`, the direct
  child of A17.
- B17 scope: `CURRENT_CONTRACT.json`, this Work's release record, and the
  generated 2.8.17 Phase 8B/8C packages only.
- Phase 8B: 24 payload files (23 `.gs` plus `appsscript.json`), harness
  included, `TEST_MODE=true`.
- Phase 8C: 23 payload files (22 `.gs` plus `appsscript.json`), harness
  excluded, with only the audited `TEST_MODE=false` transform.
- The later pre-Google test-only commits align current-version and current
  payload-hash regressions. They do not alter Apps Script source,
  `appsscript.json`, release packages, `CURRENT_CONTRACT.json`, or the
  A17/B17 direct-child identity.

Historical 2.8.14, 2.8.15, and 2.8.16 records, release packages, and handoffs
remain preserved.

## Changed scope

- `implementation/GoogleSpreadsheet/apps-script-v2/20_GeminiProvider.gs`
  implements the strict thought-step parser.
- Focused local fake-transport coverage verifies model-only, signature-only,
  multiple-thought, summary, unexpected-step, malformed-content,
  missing/multiple-output, status, and privacy-safe failure cases.
- Work 0030 one-use placement tooling preserves the consumed Work 0029 state,
  requires its completed parity state, uses a fresh ignored Work 0030 state,
  records remote-attempt markers before execution, and refuses retry.
- 2.8.17 builders, verifiers, templates, current documents, visualizations,
  checksums, contract, and current-selector regressions were regenerated or
  aligned without modifying historical evidence.

## Validation

All validation below was local/non-Google unless expressly listed as placement
evidence.

- Work 0030 thought-step parser suite: `10/10 PASS`.
- Existing Gemini provider suite: `6/6 PASS`.
- Existing Work 0029 runtime/Automation/fixture suite: `7/7 PASS`.
- Work 0030 placement state-machine suite: `13/13 PASS`.
- Complete current local gate: `67` suites PASS, Apps Script static validation
  PASS, release/checksum parity PASS, A17/B17 lineage PASS, secret/local-state
  scan PASS, and `git diff --check` PASS.
- Canonical payload inventory: 24 files, 23 `.gs`, one manifest, zero missing,
  zero extra, payload SHA-256
  `37bdc9e9818ab4d2a6760db07d7e865dec97f15715ee3ed07606789ca334881b`.
- Exact pre-Google GitHub push and PR validation: SUCCESS for the published
  pre-Google head.

## Authorized existing-target placement

After all pre-Google gates passed, the existing personal-synthetic binding was
reused. No target, Spreadsheet, Apps Script project, account, auth profile,
deployment, or Cloud project was created or changed.

- Existing clasp authorization check: `READY`; account identity suppressed.
- Source push attempts: `1/1`, guarded semantic evidence PASS for 24 files
  (23 `.gs`, one manifest), zero missing, zero extra.
- Independent isolated pull attempts: `1/1`, exact byte/hash parity PASS for
  the same 24 files.
- Work 0030 state ended at `PULL_PARITY_PASS`; no retry, fallback target, or
  alternate account was used.

## Explicit non-execution

- Real Gemini API-key configuration/inspection: `NOT_EXECUTED`.
- Real Gemini request: `NOT_EXECUTED`.
- Apps Script function invocation: `0`.
- Gmail, Task, Review, Calendar, Setup, Diagnostics, Dashboard, trigger, and
  Automation operations: `NOT_EXECUTED`.
- New target/account/deployment/Cloud-project creation and company/production
  access: `NOT_EXECUTED`.

No credential, account identity, target identifier, private URL, provider
body, thought signature, thought summary, message content, raw clasp output,
or real data is recorded in this report.

## Git and PR

- Branch: `codex/0030-gemini-thinking-step-parser-remediation`.
- Base branch: `codex/0029-gemini-runtime-activation-remediation`.
- Draft PR: `#44`, open and unmerged.
- Final report-head CI and clean-worktree confirmation are required after this
  report is committed and pushed.

## BLOCKER

`NONE`
