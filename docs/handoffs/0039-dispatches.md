# Work 0039 — Dispatch Ledger

WORK_ID: `0039`

CURRENT_DISPATCH_ID: `0039-CODEX-01`

BALL: `CODEX`

STATUS: `READY`

MODE: `BUILD`

## Primary Outcome

Add a direct OpenAI API provider beside the completed Gemini provider and provide an explicit, fail-closed operator selection mechanism, while preserving canonical AI validation, privacy, retry/idempotency controls, and the two-paste company installation format.

## Active Dispatch

- Dispatch ID: `0039-CODEX-01`
- Instruction: `docs/handoffs/0039-CODEX-01-openai-provider-selection-instruction.md`
- Data-governance addendum: `docs/handoffs/0039-CODEX-01-openai-data-governance-addendum.md`
- Implementation branch: `codex/0039-openai-provider-selection`
- Recommended model: `Sol High`
- Reason: the outcome and safety decisions are closed, but implementation crosses provider, configuration, state, retry, menu, test, migration, release, and bundle boundaries.

## Frozen Rollback Baseline

- Source/repository: `archive/0038-gemini-source-baseline` at `272612831c4a46e45fdf166c65e3075ffee7dfef`
- Company delivery: `archive/0038-gemini-company-delivery` at `eccf27ec9f6b6fd023eca7b69279cc88741ecd9b`
- Record: `docs/baselines/0038-gemini-completed-baseline.md`

These refs are immutable recovery baselines and are outside the Work 0039 write boundary.

## Closed Conclusions

- Gemini remains supported and unchanged in behavior unless a narrowly required integration adjustment is covered by tests.
- OpenAI is a parallel registered provider, not a replacement.
- Selection is explicit and allowed only while Automation is consistently OFF with no cross-provider in-flight risk.
- Credentials are provider-specific Script Properties.
- No automatic cross-provider fallback, dual-send, arbitrary endpoint, or free-form model selection is permitted.
- Direct OpenAI Responses API is the target; Azure OpenAI or a company proxy triggers a Strategy Reset.
- Initial OpenAI model candidate is `gpt-5.6-luna`; unavailable entitlement is a bounded stop condition, not a reason for silent substitution.
- Canonical AI Schema and final application validation remain authoritative.
- Every OpenAI request must use `store=false`, but this is not treated as proof of Zero Data Retention. Company live use requires an explicitly approved OpenAI organization/project data-governance state.
- Canonical source remains modular; successor company installation remains a generated two-paste bundle with txt transport copies.
- No live Workspace/provider action or credential handling is authorized in this dispatch.

## Completion Latch

Return BALL to ChatGPT only after the OpenAI provider, guarded provider selection, retry/provenance safety, local tests, complete regression, successor release, two-paste bundle, documentation/status convergence, final CI evidence, and report are all available on GitHub, or after a genuine Strategy Reset condition is demonstrated.

WORK_ID: `0039`

CURRENT_DISPATCH_ID: `0039-CODEX-01`

BALL: `CODEX`

STATUS: `READY`