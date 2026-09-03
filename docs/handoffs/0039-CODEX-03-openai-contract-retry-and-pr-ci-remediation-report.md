# Work 0039 / Dispatch 0039-CODEX-03 — Completion Report

WORK_ID: `0039`

DISPATCH_ID: `0039-CODEX-03`

BALL: `CHATGPT`

STATUS: `COMPLETE — GITHUB CI VALIDATED / LIVE EXTERNAL ACTIONS NOT EXECUTED`

## Outcome

The three CODEX-02 blockers are remediated on
`codex/0039-openai-provider-selection`, the existing `2.8.26-prepilot`
candidate artifacts were regenerated from the corrected source commit, and
Draft PR #55 remains open and unmerged.

## Authoritative inputs

- `docs/handoffs/0039-CODEX-02-review.md`
- `docs/handoffs/0039-CODEX-03-openai-contract-retry-and-pr-ci-remediation-instruction.md`
- `docs/handoffs/0039-CODEX-01-openai-data-governance-addendum.md`

## Git and implementation

- Branch: `codex/0039-openai-provider-selection`
- Draft PR: https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/55
- Corrected source commit:
  `7c8b4c7709ab00b4d315f910b9271f3c4945b702`
- Release/contract commit and validated publication head:
  `9d287b411ae70fdcaa667fbde9618e1c205e8173`
- Report commit: `SELF`; its exact final branch SHA and final report-only CI runs
  are recorded in the PR #55 CODEX-03 completion comment after publication.
- Code version: `2.8.26-prepilot`; Schema `2.6`; AI Schema `2.0`;
  migration `3` (unchanged).

Implemented remediation:

- The OpenAI Responses parser now consumes required envelope fields instead of
  rejecting documented root metadata. It accepts exactly one completed
  assistant message containing one non-empty `output_text`, ignores documented
  reasoning items without inspecting or persisting them, and rejects refusal,
  tool/function output, multiple messages, incomplete/failed, or malformed
  output. The canonical application validator remains authoritative.
- Provider switching resolves the active bound Spreadsheet only after the
  Script Lock is held, reads Message State through
  `messageSheet()` and `createContextForHeldLock()`, and fails closed for
  `RETRY`, `CLAIMED`, `PREPROCESSED`, unavailable state, malformed context, or
  corrupt status. Failure leaves the provider property unchanged and performs
  no provider request.
- The Work 0039 scope validator recognizes only the exact GitHub
  `pull_request` synthetic two-parent merge shape. It checks the second parent
  as branch history, while real donor merges in that history still fail with
  `DONOR_MERGE_COMMIT_PRESENT`; malformed detached contexts fail closed.

## Regenerated candidate release

All artifacts record source commit
`7c8b4c7709ab00b4d315f910b9271f3c4945b702`.

| Artifact | Result |
|---|---|
| `implementation/GoogleSpreadsheet/release/v2.8.26-prepilot/` | 26 payload / 30 package files; payload SHA-256 `92924a4546dbddbee0274c5e07f6b63977563fd45f54496abcb70cb3ec4fc636` |
| `implementation/GoogleSpreadsheet/release/v2.8.26-prepilot-phase8c/` | 25 payload / 29 package files; payload SHA-256 `73dd9aed38260a177f9a2b6ba7d9264549f0787e4efdcaa7e4adfab68089be22` |
| `implementation/GoogleSpreadsheet/release/work-0039-single-file-company-install/` | 24 source files; `Code.gs` SHA-256 `a3fcd9c11d232254dc9ed25d5052da0dbddd0b5ba7c2212ca055ea35446aa510` |

The install order remains exactly `Code.gs`, then `appsscript.json`.
`Code.gs.txt` and `appsscript.json.txt` are byte-identical transport copies.
Checksums, manifests, provenance, source parity, and deterministic rebuild all
PASS.

## Validation

All local validation was synthetic/non-Google and executed at
`9d287b411ae70fdcaa667fbde9618e1c205e8173`.

| Validation | Observed result |
|---|---|
| OpenAI/provider focused suite | PASS; 8 tests; 0 network calls |
| Work 0039 CI-scope focused suite | PASS; 4 cases including clean branch, donor merge rejection, valid PR synthetic merge, and malformed detached rejection |
| Apps Script static validator | PASS; 11/11 |
| Work 0039 local gate | PASS; 13/13; 90 suites; missing 0; extra 0 |
| Work 0039 CI-equivalent gate | PASS; 13/13; 90 suites; missing 0; extra 0 |
| Release verifier | PASS; source parity, checksums, txt byte identity, deterministic rebuild |
| Secret/diff checks | PASS; secret hits 0; whitespace errors 0 |

GitHub Actions for the validated publication head:

- push CI run `33718427322`: `SUCCESS`
  (https://github.com/Tanukitsune-hub/GAS-Project-Schedule/actions/runs/33718427322)
- pull_request CI run `33718430666`: `SUCCESS`
  (https://github.com/Tanukitsune-hub/GAS-Project-Schedule/actions/runs/33718430666)

## Work 0038 preservation

- `archive/0038-gemini-source-baseline` remains
  `272612831c4a46e45fdf166c65e3075ffee7dfef`.
- `archive/0038-gemini-company-delivery` remains
  `eccf27ec9f6b6fd023eca7b69279cc88741ecd9b`.
- Frozen Work 0038 release/delivery path changes: `0`.
- Frozen Work 0038 bundle blob identities: unchanged.

## External-action and issue status

- Real OpenAI request: `NOT_EXECUTED`
- Real Gemini request: `NOT_EXECUTED`
- Credential read/write/configuration: `NOT_EXECUTED`
- Google Workspace, deployment, OAuth, Trigger, Automation, and company
  environment operations: `NOT_EXECUTED`
- OpenAI data governance: `NOT_APPROVED_OR_UNKNOWN`
- BLOCKER: none
- Non-blocking issue: live company-environment governance and runtime
  acceptance remain outside this dispatch and unexecuted.
