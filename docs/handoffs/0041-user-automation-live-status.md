# Work 0041 — Company Workspace Live Qualification Status

WORK_ID: `0041`

DISPATCH_ID: `0041-CODEX-01`

BALL: `CODEX`

STATUS: `READY`

MODE: `BUILD`

## Frozen company-runtime evidence

No new live company action is authorized during this Codex dispatch. The following user-observed evidence is frozen for the implementation review:

- setup completed;
- required Gemini credential configured in company Script Properties without exposing the value;
- Gemini five-minute Automation can be enabled;
- an eligible target email completed scheduled Gmail/Gemini processing;
- at least one scheduled invocation with no new eligible target email was recorded `FAILED`;
- the expected Calendar projection was not correctly observed;
- company OpenAI is Azure OpenAI;
- separate bounded GAS -> Azure OpenAI smoke testing returned `HTTP 403 / PERMISSION_OR_NETWORK_DENIED`.

## Current interpretation

Gemini inference/target-email processing is accepted company-runtime evidence. Calendar E2E and truthful no-new-mail scheduled semantics remain open.

Source review identified a material Calendar scheduling concern: a Review acceptance or Calendar-relevant Task edit can persist durable Calendar Outbox work after the originating Message is already `DONE`; the normal five-minute Trigger drives the automatic worker, while a standalone Calendar Outbox drain also exists as the explicit `Calendar同期を1件処理` path. Dispatch `0041-CODEX-01` must prove or disprove this gap locally and repair it if confirmed.

The no-new-mail `FAILED` observation is not automatically an idle bug. A zero-new-mail scheduled invocation may still contain Calendar/backlog/system work. Codex must not mask a real failure to satisfy an idle test.

## Next runtime qualification after Codex return

Only after ChatGPT reviews the Codex implementation/PR and approves a company update will Work 0041 return to user-controlled runtime qualification. The later bounded evidence must establish, at minimum:

- eligible reviewed/accepted Task -> automatic Calendar event projection through ordinary scheduled operation;
- no routine manual `Calendar同期を1件処理` requirement;
- true zero-work scheduled invocation has healthy semantics;
- genuine Calendar errors remain visible;
- no duplicate managed Calendar event.

Until then, company Calendar E2E remains `NOT_ACCEPTED`.

## Safety boundary

Do not expose company email/task/Calendar content, IDs, account data, private URLs, credentials, or raw provider payloads/errors. Do not use the separate Azure 403 path as a reason to change the Gemini/Calendar implementation.

WORK_ID: `0041`

DISPATCH_ID: `0041-CODEX-01`

BALL: `CODEX`

STATUS: `READY`
