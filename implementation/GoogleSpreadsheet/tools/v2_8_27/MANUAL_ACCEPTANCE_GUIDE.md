# Work 0041 Manual Acceptance Guide - {{PACKAGE}}

This guide is descriptive only. It does not authorize deployment, OAuth,
clasp, Gmail, Calendar, Sheets, trigger mutation, Automation, Provider
requests, or company data processing.

Machine live-runtime state: `NOT_EXECUTED`.

Required candidate: Code `2.8.27-prepilot`, Schema `2.6`, AI Schema `2.0`,
Migration `3`, TEST_MODE=`{{TEST_MODE}}`, Automation `OFF`.

Machine gate: `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`.

## Work 0041 Calendar qualification boundary

Work 0041 repairs the Calendar scheduled-drain boundary. After ChatGPT review
and a separately authorized user-controlled update, qualify Review ACCEPT or
a Calendar-relevant Task edit, followed by the ordinary five-minute invocation:
CREATE, UPDATE, DELETE and converged NOOP must follow existing policy without
routine manual Calendar synchronization. Verify no duplicate managed event.

The current dispatch has not performed that runtime qualification. Gemini
target-email processing on the prior company installation is accepted user
evidence; Calendar E2E remains NOT_ACCEPTED. If a zero-new-mail invocation
fails, request only its safe error code/stage, status and bounded work counts.
Do not transmit business content, private identifiers or raw errors.

The candidate installation remains two pastes from
`work-0041-single-file-company-install`: `Code.gs`, then `appsscript.json`.
The `.txt` copies must be byte-identical. This guide authorizes no live action.

`WORK_OS_V2_ACTIVE_AI_PROVIDER` is the only authoritative provider selection.
The allowed values are exactly `GEMINI` and `OPENAI`; an absent property
remains Gemini. The Settings sheet `ai_provider` row is informational only.

Provider switching requires consistent Automation-OFF state, zero owned clock
triggers, no active worker lease, no in-flight classification, and no pending
retry. It is protected by Script Lock, performs no external request, and rolls
back the selection property if a dependent update fails. A message attempt
cannot silently cross providers; no automatic fallback is supported.

OpenAI is pinned to `gpt-5.6-luna` and the direct Responses endpoint. Its
structured request sets `store=false`, `stream=false`, `background=false`, and
an empty tools list. The separate `WORK_OS_V2_OPENAI_API_KEY` property is
presence-checked only. Credentials, prompts, responses, email/task content,
and provider error bodies are never persisted or included in this package.

The current OpenAI data-governance state is
`NOT_APPROVED_OR_UNKNOWN`. `store=false` is not evidence of a specific
retention tier. Company OpenAI runtime acceptance and Automation enablement
remain blocked until a separately authorized qualification records an approved
bounded governance state.

## Non-live validation boundary

Work 0041 tests use local fakes and perform zero provider requests. The inherited
one-request qualification helper is unchanged and requires separate explicit
authorization; it is not part of this dispatch. It stores only a
provider/model/prompt/schema/code/instance fingerprint and bounded status,
never a credential or provider payload. Real OpenAI, Gemini, Gmail, Calendar, OAuth, Apps Script,
company installation, deployment, triggers, and Automation are
`NOT EXECUTED`.

{{PHASE_NOTE}}

Before any later separately authorized placement, verify package checksums,
manifest source commit, exact payload inventory, the two-paste bundle
provenance, and the unchanged Work 0038 archive/release/delivery evidence.
