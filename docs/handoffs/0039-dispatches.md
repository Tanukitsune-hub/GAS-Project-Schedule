# Work 0039 — Dispatch Ledger

WORK_ID: `0039`

CURRENT_DISPATCH_ID: `0039-CODEX-04`

BALL: `CODEX`

STATUS: `READY`

MODE: `BUILD`

## Primary Outcome

Add a direct OpenAI API provider beside the completed Gemini provider and provide an explicit, fail-closed operator selection mechanism, while preserving canonical AI validation, privacy, retry/idempotency controls, and the two-paste company installation format, then integrate the accepted candidate safely into `main`.

## Dispatch history

### 0039-CODEX-01 — implementation

- Initial OpenAI/provider-selection implementation completed locally and later published.
- Initial published head: `e9e0fe1515170f030788cdfda34099d5c1839c31`.

### 0039-CODEX-02 — GitHub publication and independent review

- Draft PR #55 created and Work 0039 evidence became remotely reviewable.
- Independent review found two product blockers and one PR-CI harness defect.
- Review: `docs/handoffs/0039-CODEX-02-review.md`.

### 0039-CODEX-03 — product remediation

- Instruction: `docs/handoffs/0039-CODEX-03-openai-contract-retry-and-pr-ci-remediation-instruction.md`.
- Completion report: `docs/handoffs/0039-CODEX-03-openai-contract-retry-and-pr-ci-remediation-report.md`.
- Final candidate head: `959690d0863b268dda4f707ef213c5c353653f54`.
- Corrected source/release source: `7c8b4c7709ab00b4d315f910b9271f3c4945b702`.
- Push CI `33718666447`: SUCCESS.
- PR CI `33718669532`: SUCCESS.
- PR gate: 13/13 PASS; 90 suites; missing 0; extra 0.
- Work 0039 release/bundle verification, txt identity, deterministic rebuild, lineage, Work 0038 frozen preservation, secret scan, and diff check: PASS.
- ChatGPT review: `docs/handoffs/0039-CODEX-03-review.md`.
- Product disposition: `ACCEPTED FOR NON-LIVE INTEGRATION`.

Closed product blockers:

1. documented OpenAI Responses metadata/reasoning output compatibility;
2. persisted `CLAIMED` / `PREPROCESSED` / `RETRY` provider-switch guard and fail-closed state inspection;
3. GitHub PR synthetic-merge scope handling while retaining donor-merge detection.

## Active Dispatch 0039-CODEX-04 — main integration gate preparation

- Instruction: `docs/handoffs/0039-CODEX-04-main-integration-gate-instruction.md`.
- Implementation branch remains `codex/0039-openai-provider-selection`.
- Existing Draft PR: #55; keep Draft/open/unmerged during this dispatch.
- Recommended model: `Luna Max`.
- Scope: integration validation tooling/tests only. Do not change accepted Apps Script product source or Work 0039 release/bundle bytes.
- Required outcome: prepare a fail-closed Work 0039 main-mode validation path for a normal merge-commit integration and later documentation/status descendants, then return with green push/PR CI and local synthetic real-main merge simulations.

## Why Work 0039 is not yet complete

The accepted candidate is green on its branch and GitHub PR synthetic merge. However the current post-merge routing sends the Work 0039 contract to a gate that does not yet accept the real persistent `main` integration commit or descendants. Merging now would knowingly make source-of-truth main CI red.

This remaining blocker is integration harness only; accepted product conclusions are closed.

## Frozen rollback baseline

- Source/repository: `archive/0038-gemini-source-baseline` at `272612831c4a46e45fdf166c65e3075ffee7dfef`.
- Company delivery: `archive/0038-gemini-company-delivery` at `eccf27ec9f6b6fd023eca7b69279cc88741ecd9b`.
- Record: `docs/baselines/0038-gemini-completed-baseline.md`.

These refs remain immutable and outside Work 0039 write boundaries.

## Closed conclusions

- Gemini remains supported; OpenAI is parallel, not a replacement.
- Provider selection is explicit and fail-closed around unresolved AI/retry state.
- Provider credentials remain separate Script Properties.
- No automatic fallback/dual-send/arbitrary endpoint/free-form model selection.
- Direct OpenAI Responses API remains the target; Azure OpenAI/company proxy triggers Strategy Reset.
- Canonical AI Schema/final application validation remain authoritative.
- OpenAI requests require `store=false`; company live use remains blocked until data-governance approval is explicit.
- Accepted candidate source is modular; company installation remains generated two-paste bundle + byte-identical txt copies.
- Eventual PR integration method is fixed to normal GitHub merge commit, not squash/rebase, to preserve exact source/release ancestry.
- No live Workspace/provider/credential action is authorized in CODEX-04.

## Completion latch

Work 0039 becomes complete only after CODEX-04 prepares the integration gate, ChatGPT merges PR #55 with merge method `merge`, real main CI passes, final status/acceptance records are written without making main CI red, Work 0038 frozen evidence remains unchanged, and no non-live BLOCKER remains.

Company OpenAI governance/runtime qualification remains a separate later qualification and does not block non-live Work 0039 completion.

WORK_ID: `0039`

CURRENT_DISPATCH_ID: `0039-CODEX-04`

BALL: `CODEX`

STATUS: `READY`
