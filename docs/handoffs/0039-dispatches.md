# Work 0039 — Dispatch Ledger

WORK_ID: `0039`

CURRENT_DISPATCH_ID: `0039-CODEX-02`

BALL: `CODEX`

STATUS: `READY`

MODE: `BUILD`

## Primary Outcome

Add a direct OpenAI API provider beside the completed Gemini provider and provide an explicit, fail-closed operator selection mechanism, while preserving canonical AI validation, privacy, retry/idempotency controls, and the two-paste company installation format.

## Returned Dispatch 0039-CODEX-01

- Instruction: `docs/handoffs/0039-CODEX-01-openai-provider-selection-instruction.md`
- Data-governance addendum: `docs/handoffs/0039-CODEX-01-openai-data-governance-addendum.md`
- Reported local branch: `codex/0039-openai-provider-selection`
- Reported local final HEAD: `e9e0fe1515170f030788cdfda34099d5c1839c31`
- Reported local validation: `13/13 PASS`, 89 suites
- Reported live external actions: `NOT_EXECUTED`
- Review disposition: `RETURNED — GITHUB EVIDENCE MISSING`

GitHub review found that the remote implementation branch remained at `3e302c2bc1e13c9482b208b754bc893e9a73fc70`; the reported final commit, completion report, successor release paths, and PR were not present on GitHub. The local report is therefore not yet accepted as repository evidence.

## Active Dispatch 0039-CODEX-02

- Dispatch ID: `0039-CODEX-02`
- Instruction: `docs/handoffs/0039-CODEX-02-publish-github-evidence-instruction.md`
- Implementation branch: `codex/0039-openai-provider-selection`
- Recommended model: `Luna Max`
- Reason: implementation is reported complete locally; the remaining work is deterministic fast-forward publication, Draft PR creation, remote readback, and GitHub CI evidence.

## Frozen Rollback Baseline

- Source/repository: `archive/0038-gemini-source-baseline` at `272612831c4a46e45fdf166c65e3075ffee7dfef`
- Company delivery: `archive/0038-gemini-company-delivery` at `eccf27ec9f6b6fd023eca7b69279cc88741ecd9b`
- Record: `docs/baselines/0038-gemini-completed-baseline.md`

These refs are immutable recovery baselines and are outside the Work 0039 write boundary.

## Closed Conclusions

- Gemini remains supported; OpenAI is a parallel registered provider, not a replacement.
- Selection is explicit and allowed only while Automation is consistently OFF with no cross-provider in-flight risk.
- Credentials are provider-specific Script Properties.
- No automatic cross-provider fallback, dual-send, arbitrary endpoint, or free-form model selection is permitted.
- Direct OpenAI Responses API is the target; Azure OpenAI or a company proxy triggers a Strategy Reset.
- Canonical AI Schema and final application validation remain authoritative.
- Every OpenAI request must use `store=false`, but company live use remains blocked until an acceptable OpenAI data-governance state is explicitly confirmed.
- Canonical source remains modular; successor company installation remains a generated two-paste bundle with txt transport copies.
- No live Workspace/provider action or credential handling is authorized during publication/review.

## Completion Latch

Work 0039 cannot be accepted until the reported implementation is visible on GitHub, the final diff/report/releases can be reviewed, GitHub CI is observed, and no BLOCKER remains. Dispatch 0039-CODEX-02 is complete only when the existing local result is safely published without force-push/history rewrite and the required remote evidence is available.

WORK_ID: `0039`

CURRENT_DISPATCH_ID: `0039-CODEX-02`

BALL: `CODEX`

STATUS: `READY`
