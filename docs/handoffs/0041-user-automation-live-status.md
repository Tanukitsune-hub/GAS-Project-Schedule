# Work 0041 — Company Workspace Live Qualification Status

WORK_ID: `0041`

DISPATCH_ID: `N/A`

BALL: `USER`

STATUS: `ACTION_REQUIRED`

MODE: `QUALIFICATION`

## Current live evidence

The company Google Workspace installation is now producing direct runtime evidence.

User-observed / user-reported evidence:

- initial setup completed;
- required API key(s) configured in Script Properties; credential values were not requested, copied, logged, or stored;
- Gemini mode can enable the 5-minute Automation;
- when an eligible target email exists in Gemini mode, the scheduled processing completes successfully;
- when no eligible target email exists, the scheduled processing is being recorded as `FAILED` rather than a healthy no-work completion;
- after selecting OpenAI, Automation cannot currently be enabled.

## Repository interpretation

### OpenAI enablement

The accepted Work 0039 company production-shaped release intentionally ships OpenAI with the safety gate closed:

- `OPENAI_EXTERNAL_AI_ENABLED = false`
- `OPENAI_OPERATOR_APPROVED = false`
- `OPENAI_DATA_POLICY_APPROVED = false`
- `OPENAI_CREDENTIAL_STORAGE_APPROVED = false`
- `OPENAI_AUTH_CONFIGURED = false`
- `OPENAI_DATA_GOVERNANCE_STATUS = NOT_APPROVED_OR_UNKNOWN`

`WorkOsOpenAiProvider.readiness()` requires the OpenAI approval/auth flags plus a configured credential and a consistently disabled Automation state. Therefore failure to enable OpenAI Automation is currently consistent with the accepted fail-closed design and does not by itself prove an API-key or transport failure. Do not repeatedly retry enablement.

OpenAI company live use remains blocked pending an explicit governance/approval decision and an intentionally regenerated/qualified company release. No credential value is needed in GitHub or chat.

### No-target-email scheduled failure

The accepted worker contract initializes an automatic run as `COMPLETE`. The current `processAutomaticBatch()` path permits an empty Gmail candidate set, records `candidate_count = 0`, and can advance the bounded scan watermark without classifying a message. There is no intended `NO_WORK => FAILED` rule.

Therefore the user-observed `FAILED` record when no target email is present is a runtime anomaly requiring one bounded diagnostic token before deciding whether a code change is necessary. The empty candidate condition itself is not accepted as the failure cause.

## Next decisive evidence

From exactly one recent Gemini-mode scheduled run that was recorded `FAILED` when no eligible target email was present, report only these non-sensitive fields from the processing/run-history surface if present:

- `mode`
- `run_status` / status
- `note` / safe error code
- `candidate_count`
- `error_count`
- safe error stage/code if separately displayed

Do **not** provide message IDs, thread IDs, subject/body text, recipient/sender addresses, account IDs, private URLs, API keys, or screenshots containing company data.

One failed run is sufficient. Do not manufacture additional failure runs solely for diagnosis.

## Safety / qualification boundary

- Gemini target-email completion is accepted runtime evidence but does not erase the no-work failure anomaly.
- OpenAI live Automation remains intentionally blocked by the accepted release governance gate.
- Work 0039 product acceptance and Work 0040 transport acceptance remain closed unless direct contrary evidence appears.
- No company credential or confidential email content may be stored in GitHub or chat.

WORK_ID: `0041`

DISPATCH_ID: `N/A`

BALL: `USER`

STATUS: `ACTION_REQUIRED`
