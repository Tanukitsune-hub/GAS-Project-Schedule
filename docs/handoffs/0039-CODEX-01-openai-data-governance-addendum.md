# Work 0039 / Dispatch 0039-CODEX-01 — OpenAI Data Governance Addendum

WORK_ID: `0039`

DISPATCH_ID: `0039-CODEX-01`

BALL: `CODEX`

STATUS: `READY`

This addendum supplements `0039-CODEX-01-openai-provider-selection-instruction.md` and is authoritative for the OpenAI data-handling boundary.

## Closed Data-Governance Conclusions

1. Every OpenAI Responses API request must set `store=false`.
2. `store=false` is not treated as proof that all OpenAI abuse-monitoring retention is disabled.
3. No company email or task data may be sent to OpenAI until the operator has confirmed that the company-approved OpenAI organization/project data controls and retention terms are acceptable for this workload.
4. The company live gate must explicitly record one of the following bounded states without exposing account identifiers:
   - approved standard OpenAI API retention;
   - approved Modified Abuse Monitoring;
   - approved Zero Data Retention;
   - not approved / unknown, which blocks live use.
5. Work 0039-CODEX-01 remains local and synthetic only. It must not inspect company OpenAI settings, credentials, account identifiers, or send a real request.
6. The implementation may expose a bounded configuration/readiness flag for data-policy approval, but it must not claim or infer a retention tier from the API key or provider response.
7. Background mode, remote tools, persistent conversations, files, vector stores, and any feature requiring additional application-state retention remain out of scope.
8. If the available company service is Azure OpenAI, a gateway, or a proxy with different data-processing terms, endpoint, or authentication, stop and trigger a Strategy Reset.

## Acceptance Impact

The code/local-validation dispatch may complete without a live retention setting because no real company data is used. Company OpenAI runtime acceptance and Automation enablement remain blocked until the separate company-environment qualification records the approved data-governance state.

WORK_ID: `0039`

DISPATCH_ID: `0039-CODEX-01`

BALL: `CODEX`

STATUS: `READY`