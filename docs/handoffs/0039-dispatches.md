# Work 0039 — Dispatch Ledger

WORK_ID: `0039`

CURRENT_DISPATCH_ID: `N/A`

LAST_CODEX_DISPATCH_ID: `0039-CODEX-04`

BALL: `NONE`

STATUS: `ACCEPTED`

MODE: `BUILD`

## Primary Outcome

Add a direct OpenAI API provider beside the completed Gemini provider and provide explicit, fail-closed provider selection while preserving canonical AI validation, privacy, retry/idempotency controls, deterministic release provenance, and the two-paste company installation format; integrate the accepted candidate safely into `main`.

## Dispatch history

### 0039-CODEX-01 — implementation

Initial Gemini/OpenAI provider-selection implementation, synthetic validation, successor release, and company bundle were produced.

### 0039-CODEX-02 — publication and independent review

The implementation was published to GitHub through Draft PR #55. Independent ChatGPT review identified two product blockers and one PR-CI harness defect. Review: `docs/handoffs/0039-CODEX-02-review.md`.

### 0039-CODEX-03 — blocker remediation

- Completion report: `docs/handoffs/0039-CODEX-03-openai-contract-retry-and-pr-ci-remediation-report.md`.
- Accepted product head: `959690d0863b268dda4f707ef213c5c353653f54`.
- Accepted source/release source: `7c8b4c7709ab00b4d315f910b9271f3c4945b702`.
- OpenAI Responses envelope/reasoning compatibility: remediated.
- Persisted Message State provider-switch boundary: remediated.
- PR synthetic-merge/donor-merge discrimination: remediated.
- Push and PR CI: SUCCESS; 13/13 gate checks and 90 suites PASS.
- Product disposition: `ACCEPTED FOR NON-LIVE INTEGRATION`.

### 0039-CODEX-04 — main integration gate

- Instruction: `docs/handoffs/0039-CODEX-04-main-integration-gate-instruction.md`.
- Report: `docs/handoffs/0039-CODEX-04-main-integration-gate-report.md`.
- Final Work branch head: `69b648d85718311ad6129b9a757eaf45f0e841bb`.
- Required main-integration regression: 12 cases PASS.
- Final push CI `33746859878`: SUCCESS.
- Final PR CI `33746864957`: SUCCESS.
- Accepted Apps Script source/release/bundle bytes remained unchanged by CODEX-04.

## Main integration and actual Acceptance Evidence

ChatGPT promoted PR #55 from Draft only after CODEX-04 review, then merged it using the fixed normal GitHub `merge` method with expected head pinned to `69b648d85718311ad6129b9a757eaf45f0e841bb`.

- PR #55: merged.
- Main integration commit: `5da8d7fa43358b3010159d102f208414596a9b4f`.
- Main first parent: `a3026f02d51e13de4894294e08816fd2c7b784b6`.
- Work second parent: `69b648d85718311ad6129b9a757eaf45f0e841bb`.
- Real main CI run `33749686594`: SUCCESS.
- Real main scope check: PASS.
- Donor merge count: `0`.
- Protected product drift count: `0`.
- Real main gate: `13/13 PASS`.
- Regression inventory: `90` suites; missing `0`; extra `0`.
- Work 0039 release verifier: PASS.
- txt transport identity: `BYTE_IDENTICAL`.
- deterministic rebuild: PASS.
- Work 0038 frozen preservation: PASS.
- secret scan: `0` hits.
- `git diff --check`: PASS.

Final acceptance record: `docs/handoffs/0039-acceptance.md`.

## Closed conclusions

- Gemini remains supported; OpenAI is a parallel provider, not a replacement.
- Provider selection is explicit; no automatic cross-provider fallback or dual-send exists.
- Provider switching fails closed when Automation/trigger/worker-lease conditions are unsafe, when persisted `CLAIMED`, `PREPROCESSED`, or `RETRY` records exist, or when persisted state cannot be safely inspected.
- OpenAI uses direct Responses API semantics with `store=false`, no tools, no background mode, and no streaming; canonical application validation remains authoritative.
- Credentials remain provider-specific Script Properties and are excluded from GitHub/release artifacts.
- Work 0039 release/bundle provenance is deterministic and source-bound; the company install path remains two pastes plus byte-identical txt transport copies.
- Work 0038 remains the immutable rollback baseline.
- Main integration validation recognizes the accepted Work 0039 merge and permitted documentation/status descendants while retaining fail-closed product-drift and donor-merge protection.

## Frozen rollback baseline

- `archive/0038-gemini-source-baseline` -> `272612831c4a46e45fdf166c65e3075ffee7dfef`
- `archive/0038-gemini-company-delivery` -> `eccf27ec9f6b6fd023eca7b69279cc88741ecd9b`

## Separate successor qualification

The following do not block Work 0039 non-live completion and remain unexecuted/unknown:

- OpenAI company data governance: `NOT_APPROVED_OR_UNKNOWN`;
- real OpenAI request: `NOT_EXECUTED`;
- real Gemini request in Work 0039: `NOT_EXECUTED`;
- credential configuration/read/write: `NOT_EXECUTED`;
- company Google Workspace installation/runtime: `NOT_EXECUTED`;
- OAuth/deployment/Trigger mutation/Automation enablement: `NOT_EXECUTED`.

A company service that turns out to be Azure OpenAI or a different proxy/gateway requires a new Strategy Reset rather than reinterpretation of Work 0039.

## Completion Latch

Acceptance Evidence is closed. This final ledger/acceptance synchronization is documentation-only. One CI run for that final documentation-only commit is the sole final consistency check. On its success, the Work 0039 Completion Latch applies automatically without another repository write.

WORK_ID: `0039`

CURRENT_DISPATCH_ID: `N/A`

BALL: `NONE`

STATUS: `ACCEPTED`
