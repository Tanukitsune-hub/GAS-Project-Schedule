# Work 0029 Report — Gemini Runtime Activation Remediation

## Outcome

- Work ID: `0029`
- Branch: `codex/0029-gemini-runtime-activation-remediation`
- Draft PR: `#43` (Draft/Open/Unmerged)
- BLOCKER: `NONE`
- Final permitted status: `READY_FOR_USER_GEMINI_KEY_CONFIGURATION_AND_ONE_MESSAGE_VALIDATION`
- Final implementation/release head before this report: `c380ec1150f99ca48e59cfd9dbfbc9e7235317ee`

Work 0029 completed the committed Gemini readiness/runtime remediation. The
repair is local/tested, the coherent 2.8.16-prepilot candidate was placed to
the already-authorized existing personal-synthetic Apps Script target, and
the independent pull-back matched the canonical payload. No new Google
resource was created.

## Callable entrypoints and safe flow

The deployed source now exposes these no-argument, menu/function-selector
callable entrypoints:

- `checkGeminiSyntheticReadiness()` — network-free readiness evidence only.
- `runGeminiSyntheticValidationOnce()` — one guarded synthetic-message
  validation path.

The validation flow is fail-closed and ordered as follows:

1. TEST_MODE and the actual bounded runtime Automation status;
2. candidate listing and the exact synthetic subject/source/decision guard;
3. exact subject and UTF-8 body validation, including transport normalization;
4. preprocessing and its safety/truncation guard;
5. credential presence/configuration check;
6. at most one Gemini request through the production external adapter.

Any inconsistent Automation state, unexpected candidate, body mismatch,
truncation, unsafe preprocessing result, missing credential, malformed
provider envelope, or second provider-call attempt fails closed with a fixed
safe result. The path does not auto-disable or mutate Automation.

The Automation guard requires `CONSISTENT`, `enabled=false`,
`desired_enabled=false`, zero scheduled worker and clock triggers, no stored
canonical Automation trigger ID, and no canonical trigger. The normal
installable edit trigger is not treated as scheduled Automation.

## Exact synthetic fixture

The fixture is fictional and contains no personal, company, production, or
secret data. Its exact subject is:

`[WORK_OS_SYNTHETIC_GEMINI_0029]`

Its canonical body is:

```text
WORK_OS_SYNTHETIC_GEMINI_BODY_0029
これは架空の検証用メールです。個人情報、機密情報、実在の本番データを含みません。
架空の社内タスクとして、Gemini連携の動作確認メモを確認してください。
処理日から7日後までに確認してください。
外部提出、法律、税務、規制、契約、入札、その他の高影響なカレンダー予定ではありません。
```

Only CRLF/CR transport line endings, trailing spaces/tabs per line, and
terminal newlines are normalized. The synthetic source mode and explicit
`PROCESS` decision are also required. Prior thread content is excluded from
the selected-body fetch.

## Gemini request contract

The provider schema uses the documented structured-output subset required by
the handoff: object type, properties, required fields, `additionalProperties`
where applicable, and date format where applicable. Unsupported schema
keywords such as provider-side `pattern` and `maxLength` were removed from the
transport schema; strict application-side validation remains in place.

The bounded generation configuration is:

```json
{
  "thinking_level": "low",
  "thinking_summaries": "none",
  "max_output_tokens": 4096
}
```

Streaming, background processing, tools, and sampling controls remain
disabled. The external adapter allows one request and has no retry or Mock
fallback.

## Credential and operation boundary

- No real API key was configured, inspected, logged, or committed.
- Local tests used only an obviously synthetic fake credential and recorded
  `credential_created_or_inspected: false`.
- Existing clasp authorization was checked without emitting account identity;
  it was READY.
- Real Gemini requests: `0`.
- Gmail runtime access: `0`.
- Apps Script function invocations: `0`.
- Task/Review runtime: `0`.
- Calendar runtime: `0`.
- Setup, diagnostics, dashboard refresh, triggers, deployment, OAuth changes,
  and Automation mutations: `0`.
- Automation remained OFF.

## Documents, history, and release identity

Active/current text was repaired to canonical UTF-8 and checked for known
mojibake and replacement characters. Historical evidence was preserved:

- Work 0018 remains Code `2.8.14-prepilot`, A14/B14.
- Work 0028 remains Code `2.8.15-prepilot`, A15/B15.
- Work 0029 is Code `2.8.16-prepilot`, A16/B16.

The automated integrity suite scanned 19 active files, found zero mojibake
hits, and reported `A14_B14_A15_B15_PRESERVED`.

The coherent candidate is:

- Code: `2.8.16-prepilot`
- Schema: `2.6`
- AI Schema: `2.0`
- Migration: `3`
- TEST_MODE: `true` in Phase 8B; `false` only in the established Phase 8C
  transform
- Automation: `OFF`
- A16 source commit: `7c9d632b8df59785719bd230f083fbb04db196dd`
- B16 release commit: `c380ec1150f99ca48e59cfd9dbfbc9e7235317ee`

The canonical Apps Script payload is exactly 23 `.gs` files plus
`appsscript.json` (24 files total). The canonical source payload hash is
`31849408d30085f117944c7161e8ca30d54fa7d8afec94ee1e91f45524358fed`.
Phase 8B and Phase 8C source parity, checksums, scope, lineage, and secret
checks passed. No generated package was present in the A16 source stage, and
B16 is a direct child of A16 with release-only scope.

## Validation evidence

Focused local suites:

- Work 0028 Gemini provider: `6/6 PASS`.
- Work 0029 Gemini runtime activation: `7/7 PASS`.
- Work 0029 active document integrity: `19` files, mojibake `0`, `PASS`.
- Work 0029 existing-target placement contract: `11/11 PASS`.
- clasp-native inventory contract: `PASS`; clasp `3.3.0`, 24 eligible files,
  zero missing/extra, preferred pull extension `.gs`.
- clasp update-content contract: `PASS`; one simulated update-content call,
  24 serialized files, 23 scripts, one manifest, no HTML.

The complete local gate passed `11/11` checks and all `65` current test
suites. It included worktree/generated-file, scope, JSON/YAML, Apps Script
inventory/static validation, tests, Phase 8B/8C release verification, A16/B16
lineage, secret scan, and `git diff --check`.

The pre-Google exact-head GitHub Actions CI passed on the pushed
`c380ec1150f99ca48e59cfd9dbfbc9e7235317ee` head. The final report-head CI is
also required and is recorded on Draft PR `#43` after this report commit.

## Authorized existing-target placement

Only the same already-authorized existing personal-synthetic Apps Script
target was used. No target or account identifier is recorded here.

- Fresh target creation: `0`.
- Target/binding mutation: `0`.
- Guarded source push attempts: `1`; result `PASS`.
- Push semantic evidence: 24 files, 23 `.gs`, one manifest, missing `0`,
  extra `0`, native eligible `24`, update-content evidence present.
- Independent isolated pull attempts: `1`; result `PASS`.
- Pull result: 24 files, 23 `.gs`, one manifest, missing `0`, extra `0`, exact
  byte/hash parity `PASS`.
- Retry after an attempt began: `0`.

All placement output suppressed target, account, credential, and raw Google
response details.

## Changed files at a high level

- Gemini provider, worker, Gmail selection boundary, AI schema, and menu
  entrypoint source.
- Work 0029 runtime/provider/document/placement tests and bounded placement
  tooling.
- Current UTF-8 canonical documents, active guides, changelog, and
  visualizations; historical handoff evidence was not rewritten.
- 2.8.16 Phase 8B/8C templates, builders, verifiers, manifests, checksums,
  contract, and release implementation record.
- Current placement payload expectations were aligned with the 2.8.16
  canonical inventory in the existing historical placement contract tests.

## Next user-assisted boundary

The next action, in a separate explicitly authorized Work, is manual entry of
the Gemini API key into the intended Apps Script Script Property followed by
one-message validation. The key must be entered manually by the user and must
never be pasted into GitHub, Codex, ChatGPT, source files, tests, reports, or
logs. Work 0029 does not perform that action or any subsequent Gmail/Gemini
runtime validation.

