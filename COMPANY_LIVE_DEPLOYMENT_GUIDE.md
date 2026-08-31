# Work 0038 — Company Live Deployment Guide

## Goal

Install the exact validated Code `2.8.25-prepilot` Phase 8C runtime into a fresh company Google Workspace Spreadsheet-bound Apps Script project and begin actual company Inbox operation using the company-approved Gemini API.

This is a new company environment. Do not migrate personal runtime state.

## 0. Before installation

Confirm:

- You are signed in to the intended company Google Workspace account.
- A company-approved Gemini API credential is available.
- Do not place the API key in this folder, email body, GitHub, ChatGPT, or documentation.
- Current validated provider contract expects:
  - endpoint: `https://generativelanguage.googleapis.com/v1beta/interactions`
  - model: `gemini-3.6-flash`
  - Script Property key: `WORK_OS_V2_GEMINI_API_KEY`
- If the company-approved API does not allow that exact endpoint/model, stop before live operation and return to Work 0038 review.

The manifest requests these Google scopes:

- current Spreadsheet access;
- Apps Script container UI and ScriptApp;
- user email identity;
- Gmail modify;
- app-created Calendar and Calendar-list read;
- external request.

If company policy blocks one of these, do not bypass the control.

## 1. Create a fresh company target

1. In company Google Drive, create a new blank Google Spreadsheet for Work OS.
2. Open `Extensions > Apps Script`.
3. This new bound project is the company target.
4. Do not copy a personal Spreadsheet or personal Apps Script project.

## 2. Install the runtime — preferred manual path (exactly two pastes)

The company-PC manual path has exactly two paste actions:

1. Open `QUICK_INSTALL/Code.gs`, copy the complete file, and replace the
   default Apps Script editor `Code.gs` contents with that one paste.
2. In Apps Script project settings, reveal `appsscript.json`, then open
   `QUICK_INSTALL/appsscript.json`, copy the complete manifest, and replace the
   manifest contents with that one paste.

Save both files. Do not create or paste the 22 modular `.gs` files. The
`QUICK_INSTALL/` directory is the copy-ready artifact; use its
`BUNDLE_PROVENANCE.json` and `CHECKSUMS.sha256` for local identity checks where
practical. The generated `Code.gs` contains deterministic provenance comments
only; it has no runtime loader or external fetch.

If company email blocks `.gs` or `.json` attachments, use
`QUICK_INSTALL/Code.txt` and `QUICK_INSTALL/appsscript.txt` instead. They are
distribution-only, byte-identical transport copies of `Code.gs` and
`appsscript.json`; paste their contents into the same two Apps Script files
without editing or reformatting.

### Optional engineering path: `clasp`

If the company engineering workflow explicitly permits local `clasp`/Node,
the unchanged modular payload in `apps-script/` may be uploaded as exactly 23
payload files:

1. Extract this bundle to a temporary company-PC folder.
2. Authenticate `clasp` to the company account.
3. Bind the local folder to the new company Apps Script project using a local
   `.clasp.json` containing the new company Script ID.
4. Use `apps-script/` as the push root.
5. Do not share or commit `.clasp.json` or clasp credentials.

This optional path does not change the preferred two-paste manual path.

## 3. Configure the company Gemini credential

In Apps Script Project Settings > Script Properties, add:

- property: `WORK_OS_V2_GEMINI_API_KEY`
- value: the company-approved Gemini API credential

Do not paste the value into chat or GitHub.

## 4. Reload and run Setup

1. Return to the Spreadsheet and reload it.
2. Use the `業務OS v2` menu to run Setup.
3. Allow the Google OAuth prompts only if they match the expected manifest and company policy.
4. Setup is expected to create/prepare the Work OS Sheets, the seven formal Gmail labels, a dedicated deadline Calendar, Script Properties, and the edit Trigger.
5. Automation must remain OFF during Setup.

Expected final Setup stage: `S99_COMPLETE`.

## 5. Readiness before company live operation

Before Automation is enabled, verify bounded status only. Do not send company message content to ChatGPT.

Required state:

- Code `2.8.25-prepilot`;
- Schema `2.6`;
- AI Schema `2.0`;
- Migration `3`;
- production-shaped `TEST_MODE=false`;
- Gemini provider/credential readiness green;
- OAuth ready;
- all seven formal Gmail labels ready;
- dedicated Calendar ready;
- Automation `CONSISTENT` and OFF;
- `enabled=false`;
- `desired_enabled=false`;
- `clock_trigger_count=0`;
- no stored/canonical Automation Trigger residue.

If any readiness item is not green, stop and report only the bounded status/reason tokens.

## 6. Start actual company operation

Once readiness is green:

1. Explicitly enable Automation once.
2. Immediately check Automation state.
3. Require exactly one canonical five-minute clock Trigger and no duplicates/invalid Trigger.
4. Confirm the automatic-Inbox pilot start boundary is established.

That enable timestamp is the admission boundary. Messages received before it must not be processed by the automatic pilot.

After enablement, ordinary eligible company Inbox mail can be processed automatically without `手動/取込`.

Hard exclusions remain:

- Thread-wide `手動/除外`;
- spam/trash/non-Inbox;
- Promotions/Social;
- clear newsletters/list mail;
- Google Calendar invite/update/system notifications;
- already-known Message IDs;
- Messages older than the start boundary.

At most one Message is admitted per five-minute scheduled run.

## 7. What to observe

Observe only non-sensitive operational facts:

- Automation/Trigger consistency;
- COMPLETE/FAILED run status;
- candidate/processed/Task/Review/Calendar/error counts;
- whether intended Task title/deadline/waiting/review behavior is materially correct;
- whether duplicate Task/Review/Calendar effects occur;
- whether excluded mail stays excluded.

Do not copy company subjects, bodies, senders, Message IDs, internal URLs, Calendar IDs, provider payloads, or credentials into ChatGPT/GitHub.

Healthy five-minute idle cycles do not create detailed Run History rows. `AUTOMATION_LAST_RUN_AT` remains the heartbeat. Meaningful automatic runs are recorded as `TIME_DRIVEN / AUTO_PILOT`. Detailed Run History is retained for 90 days.

## 8. Immediate stop conditions

Stop Automation immediately if any occurs:

- a company-policy/permission denial appears after setup;
- provider/model/endpoint authentication is not accepted;
- an excluded message is admitted;
- an unexpected sensitive category of mail is processed;
- duplicate Task/Review/Calendar effects occur;
- information-only mail creates a Task or Calendar job unexpectedly;
- unclear mail bypasses Review materially;
- Calendar writes outside the dedicated managed Calendar;
- more than one owned clock Trigger appears;
- Automation state becomes inconsistent;
- repeated provider/schema/runtime failures occur.

Do not weaken code or policy to work around the failure.

## 9. Safe stop / rollback

Use `自動処理を停止`, then verify:

- `status=CONSISTENT`;
- `enabled=false`;
- `desired_enabled=false`;
- `trigger_count=0`;
- `clock_trigger_count=0`;
- no stored/canonical Automation Trigger ID;
- no duplicate/invalid owned Trigger.

Do not delete Message State, Task/Review, error evidence, heartbeat, or historical run evidence merely to make status look clean.

## 10. Work 0038 acceptance

The strongest success evidence is an actual company Inbox Message received after enablement being automatically admitted, classified by the company-approved Gemini API, and producing the intended governed Task/Review result with no duplicate or unauthorized Calendar effects.

After that evidence, the user may either:

- stop and perform a formal acceptance/rollback check; or
- explicitly elect to keep the company Automation enabled as the accepted operating state.

Company credentials and company identifiers remain outside GitHub and chat in either case.
