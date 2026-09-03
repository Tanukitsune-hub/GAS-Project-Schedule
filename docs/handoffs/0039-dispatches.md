# Work 0039 — Dispatch Ledger

WORK_ID: `0039`

CURRENT_DISPATCH_ID: `0039-CODEX-03`

BALL: `CODEX`

STATUS: `READY`

MODE: `BUILD`

## Primary Outcome

Add a direct OpenAI API provider beside the completed Gemini provider and provide an explicit, fail-closed operator selection mechanism, while preserving canonical AI validation, privacy, retry/idempotency controls, and the two-paste company installation format.

## Dispatch history

### 0039-CODEX-01 — implementation

- Instruction: `docs/handoffs/0039-CODEX-01-openai-provider-selection-instruction.md`
- Data-governance addendum: `docs/handoffs/0039-CODEX-01-openai-data-governance-addendum.md`
- Reported/published final head: `e9e0fe1515170f030788cdfda34099d5c1839c31`
- Local reported validation: `13/13 PASS`, 89 suites
- Live external actions: `NOT_EXECUTED`

### 0039-CODEX-02 — GitHub publication

- Instruction: `docs/handoffs/0039-CODEX-02-publish-github-evidence-instruction.md`
- Publication completed by normal fast-forward push.
- Draft PR: `#55`, open/draft/unmerged.
- Push CI `33699137347`: `SUCCESS`.
- PR CI `33699214286`: `FAILURE`; only scope failed with `DONOR_MERGE_COMMIT_PRESENT` on GitHub synthetic merge `0cc4ade1c8a8be01ce0eeb3c62a3d79c45b712de`; the other 12 checks including 89 suites, release, lineage, frozen Work 0038 preservation, secret scan, and diff check passed.
- ChatGPT review: `docs/handoffs/0039-CODEX-02-review.md`.
- Disposition: `RETURNED_WITH_BLOCKERS`.

Independent review found two product BLOCKERs in addition to the PR-CI harness defect:

1. `21_OpenAiProvider.gs` rejects documented valid Responses API envelopes because its root allowlist omits documented fields and it requires every output item to be a message; documented reasoning output items are not tolerated.
2. `22_AiProviderSelection.gs` can treat persisted retry/in-flight counts as zero in the normal production menu switch path because no bound Spreadsheet is supplied/read; attempt-level `assertProviderUnchanged()` does not pin a later RETRY across providers.
3. `work_0039_validation_gate.js` misclassifies GitHub's own synthetic PR merge as a donor merge.

## Active Dispatch 0039-CODEX-03

- Dispatch ID: `0039-CODEX-03`
- Instruction: `docs/handoffs/0039-CODEX-03-openai-contract-retry-and-pr-ci-remediation-instruction.md`
- Implementation branch: `codex/0039-openai-provider-selection`
- Existing Draft PR: `#55`
- Recommended model: `Sol High`
- Required outcome: remediate the real OpenAI response contract, production Message State switch/retry boundary, and PR synthetic-merge CI scope handling; regenerate the Work 0039 candidate releases/bundle; obtain green push and PR CI; keep PR Draft and unmerged.

## Frozen Rollback Baseline

- Source/repository: `archive/0038-gemini-source-baseline` at `272612831c4a46e45fdf166c65e3075ffee7dfef`
- Company delivery: `archive/0038-gemini-company-delivery` at `eccf27ec9f6b6fd023eca7b69279cc88741ecd9b`
- Record: `docs/baselines/0038-gemini-completed-baseline.md`

These refs are immutable recovery baselines and remain outside the Work 0039 write boundary.

## Closed Conclusions

- Gemini remains supported; OpenAI is a parallel provider, not a replacement.
- Selection is explicit and must be fail-closed when unresolved AI/retry state exists.
- Credentials remain provider-specific Script Properties.
- No automatic fallback, dual-send, arbitrary endpoint, or free-form model selection.
- Direct OpenAI Responses API remains the target; Azure OpenAI/company proxy triggers Strategy Reset.
- Canonical AI Schema/final application validation remain authoritative.
- `store=false` remains mandatory, but company live use remains blocked until data-governance approval is explicit.
- Canonical source remains modular; company installation remains a generated two-paste bundle with byte-identical txt transport copies.
- No live Workspace/provider/credential action is authorized in 0039-CODEX-03.

## Completion Latch

Work 0039 is not accepted until all three blockers above are resolved, the corrected release/bundle evidence is available, both push and PR CI are green, Draft PR #55 remains unmerged, Work 0038 frozen evidence is unchanged, and ChatGPT completes final review. Company live OpenAI acceptance remains a separate later qualification even after non-live Work 0039 acceptance.

WORK_ID: `0039`

CURRENT_DISPATCH_ID: `0039-CODEX-03`

BALL: `CODEX`

STATUS: `READY`
