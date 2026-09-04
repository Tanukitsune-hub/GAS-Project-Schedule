# Work 0041 — Dispatch Ledger

WORK_ID: `0041`

CURRENT_DISPATCH_ID: `N/A`

BALL: `USER`

STATUS: `ACTION_REQUIRED`

MODE: `QUALIFICATION`

## Primary Outcome

Qualify the accepted Work 0039 installation in the user's company Google Workspace environment and advance it to safely usable operation using direct runtime evidence. Prioritize the already-working Gemini major flow, isolate the remaining Gemini runtime anomaly, and treat company Azure OpenAI as a separate provider/infrastructure path rather than the existing direct OpenAI implementation.

## Current Accepted Evidence

User-observed / reported company-runtime evidence:

- initial setup completed;
- required API key(s) configured in Apps Script Script Properties; credential values not requested, observed, or recorded;
- Gemini 5-minute Automation can be enabled;
- an eligible target email is processed successfully in Gemini mode;
- a scheduled Gemini run with no eligible target email is being recorded `FAILED`;
- the company-provided OpenAI service has been clarified to be Azure OpenAI, not direct OpenAI;
- an independent bounded GAS -> Azure OpenAI smoke test returned `HTTP 403 / PERMISSION_OR_NETWORK_DENIED`.

Repository evidence:

- accepted production-shaped company configuration keeps Gemini approval/runtime flags enabled;
- Work 0039's OpenAI implementation is a direct OpenAI provider and is not the correct company Azure OpenAI transport;
- direct OpenAI remains explicitly fail-closed with `OPENAI_EXTERNAL_AI_ENABLED=false`, approval/auth flags false, and governance status `NOT_APPROVED_OR_UNKNOWN`;
- the current automatic-worker contract treats an empty candidate search as a permissible healthy no-work path and does not intentionally map zero candidates to `FAILED`.

## Current Classification

### ACCEPTED / primary path

- Gemini target-email major automatic flow completes in the company environment. This is the current preferred provider path for Work 0041.

### INVESTIGATION REQUIRED

- Gemini no-target scheduled run recorded `FAILED`: inconsistent with intended worker semantics. One bounded safe error token is required to identify the actual failing subsystem before dispatching a code change.

### SUPERSEDED FOR COMPANY USE

- Existing direct OpenAI provider qualification. The company service is Azure OpenAI, so failure of the direct OpenAI enablement path is not meaningful evidence about the intended company provider.

### DEFERRED / separate provider-infrastructure path

- Azure OpenAI from GAS currently has bounded smoke-test evidence of `HTTP 403 / PERMISSION_OR_NETWORK_DENIED`. Do not implement or enable an Azure provider in the company Work OS until the GAS-to-Azure network/auth boundary is proven reachable and the approved endpoint/deployment contract is known. Do not bypass Azure network or governance controls.

## Current Decisive Action

Inspect exactly one existing failed no-target Gemini run and report only bounded non-sensitive fields if present:

- `mode`
- `run_status` / status
- `note` / safe error code
- `candidate_count`
- `error_count`
- safe error stage/code if shown separately

No new failure run needs to be generated solely for diagnosis.

After that observation ChatGPT will either close the anomaly as environmental/state-specific or perform a Strategy Reset from QUALIFICATION to BUILD and create the first required Codex dispatch for a narrow Gemini remediation.

Knowledge Share's Gemini File Search requalification is a related but separate signal: success there would strengthen confidence in the company's Gemini API path, but Work 0041 does not depend on File Search because its accepted target-email flow already demonstrates usable Gemini inference in the company environment.

## Closed Conclusions

- Work 0039 product/release/bundle Acceptance remains closed.
- Work 0040 transport Acceptance remains closed.
- Bundle regeneration or resend is not required for the current Gemini runtime investigation.
- The correct Work 0039 Code bundle SHA-256 is `a3fcd9c11d232254dc9ed25d5052da0dbddd0b5ba7c2212ca055ea35446aa510`.
- Company-runtime evidence, not GitHub CI alone, controls Work 0041 qualification.
- Direct OpenAI is not the intended company provider; company OpenAI use means Azure OpenAI.
- Azure OpenAI requires a separate bounded provider/infrastructure qualification before integration.
- Credentials must stay only in the authorized company environment and must never be pasted into chat or GitHub.

## Completion Latch

Not applied. Company runtime qualification is in progress.

WORK_ID: `0041`

CURRENT_DISPATCH_ID: `N/A`

BALL: `USER`

STATUS: `ACTION_REQUIRED`
