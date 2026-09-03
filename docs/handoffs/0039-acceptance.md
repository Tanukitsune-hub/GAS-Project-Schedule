# Work 0039 — Final Acceptance

WORK_ID: `0039`

DISPATCH_ID: `N/A`

LAST_CODEX_DISPATCH_ID: `0039-CODEX-04`

BALL: `NONE`

STATUS: `ACCEPTED`

MODE: `BUILD`

## Primary Outcome

Work 0039 is accepted for its defined non-live outcome: the completed Gemini provider remains supported, a direct OpenAI Responses API provider is available in parallel, provider selection is explicit and fail-closed, canonical AI validation and retry/idempotency boundaries are preserved, and the validated company-install candidate remains a generated two-paste bundle with byte-identical text transport copies.

This acceptance does not claim company OpenAI runtime approval or deployment.

## Final GitHub integration evidence

- PR: `#55`
- Integration method: normal GitHub merge commit (`merge`), not squash/rebase.
- Accepted Work branch head: `69b648d85718311ad6129b9a757eaf45f0e841bb`.
- Accepted product head before integration-tooling descendants: `959690d0863b268dda4f707ef213c5c353653f54`.
- Corrected canonical source/release source: `7c8b4c7709ab00b4d315f910b9271f3c4945b702`.
- Main integration merge: `5da8d7fa43358b3010159d102f208414596a9b4f`.
- Main first parent: `a3026f02d51e13de4894294e08816fd2c7b784b6`.
- Work second parent: `69b648d85718311ad6129b9a757eaf45f0e841bb`.
- Real main CI run: `33749686594` — `SUCCESS`.

The real main CI observed:

- Work 0039 integration scope: PASS;
- donor merge count: `0`;
- protected product drift count: `0`;
- complete gate: `13/13 PASS`;
- regression inventory: `90` suites, missing `0`, extra `0`;
- Apps Script inventory/static validation: PASS;
- Work 0039 Phase 8B/8C and single-file bundle verifier: PASS;
- release source: `7c8b4c7709ab00b4d315f910b9271f3c4945b702`;
- txt transport: `BYTE_IDENTICAL`;
- deterministic rebuild: PASS;
- Work 0038 archive refs and frozen bundle blob identities: unchanged;
- secret scan: `0` hits;
- `git diff --check`: PASS.

## Accepted product conclusions

1. Gemini remains supported; OpenAI is a parallel provider, not a replacement.
2. The active provider is explicitly selected through the code-owned provider-selection boundary. There is no automatic cross-provider fallback or dual-send.
3. Provider switching is fail-closed around Automation state, owned clock triggers, active worker lease, and persisted Message State. `CLAIMED`, `PREPROCESSED`, or `RETRY` state blocks switching; unavailable/corrupt persisted state also blocks switching.
4. Provider credentials remain separate Script Properties and credential values are not stored in GitHub/release artifacts.
5. OpenAI uses the direct Responses API boundary with `store=false`, no tools, no background mode, and no streaming. The provider parser tolerates documented non-consumed reasoning items/metadata while refusing unsupported executable/tool output, refusals, multiple assistant classification messages, incomplete/failed responses, and malformed output.
6. Canonical `WorkOsAiAdapter` validation remains the final application authority.
7. Work 0039 candidate releases and the two-paste company bundle are deterministic and source-bound; text transport copies are byte-identical.
8. Work 0038 remains the immutable Gemini rollback baseline.
9. The Work 0039 validation gate now recognizes the actual main merge topology and permitted documentation/status descendants while retaining fail-closed donor-merge and product-drift detection.

## Frozen rollback baseline

- `archive/0038-gemini-source-baseline` -> `272612831c4a46e45fdf166c65e3075ffee7dfef`
- `archive/0038-gemini-company-delivery` -> `eccf27ec9f6b6fd023eca7b69279cc88741ecd9b`

No Work 0039 acceptance changes the acceptance status or bytes of Work 0038.

## Follow-up qualification — not a Work 0039 completion blocker

The following remain deliberately outside this non-live Work and are not claimed as executed:

- company OpenAI data-governance approval: `NOT_APPROVED_OR_UNKNOWN`;
- real OpenAI request: `NOT_EXECUTED`;
- real Gemini request in Work 0039: `NOT_EXECUTED`;
- credential configuration/read/write: `NOT_EXECUTED`;
- company Google Workspace installation/runtime: `NOT_EXECUTED`;
- OAuth/deployment/Trigger mutation/Automation enablement: `NOT_EXECUTED`.

If the company service is Azure OpenAI or a company proxy rather than direct OpenAI API, a separate Strategy Reset is required before live use.

## Completion Latch rule

The product and main-integration Acceptance Evidence above is closed. This acceptance/status synchronization is documentation-only and does not modify accepted product/release/bundle bytes.

A single CI run for the final documentation-only acceptance commit is the final consistency check. If that run succeeds, the Work 0039 Completion Latch is applied automatically with no further repository mutation required. Reopen this Work only upon significant contrary evidence affecting the accepted non-live outcome; company live qualification is a separate successor Work.

WORK_ID: `0039`

DISPATCH_ID: `N/A`

BALL: `NONE`

STATUS: `ACCEPTED`
