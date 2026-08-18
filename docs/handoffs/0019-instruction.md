# Work 0019 — Controlled Advanced Gmail Byte-Body Runtime Retest

## Outcome

Prove only the repaired `2.8.14-prepilot` Gmail body representation/decode boundary in the exact existing personal-synthetic Work OS target by processing one fresh synthetic Gmail message through the manual-import Phase 2 path until the durable `PREPROCESSED` checkpoint.

Target path:

`fresh synthetic Gmail message -> exact manual selection -> Gmail body fetch/decode -> preprocessing -> PREPROCESSED`

This Work deliberately stops before deterministic Mock AI, Task creation, Review, Calendar, Dashboard, or Automation. It is user-assisted and GitHub-recorded. No Codex implementation is required unless this runtime retest exposes another product defect.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Parent Work: `0018`
- Starting commit: `44903c75c3361e4fd1f5eb587d84cf85125dbcde`
- Parent report: `docs/handoffs/0018-report.md`
- Exact target: the same existing personal-synthetic bound Spreadsheet / Apps Script target used since Work 0010.
- Candidate: Code `2.8.14-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`.
- `TEST_MODE=true`.
- Automation remains OFF.
- External/production AI remains disabled.
- Work 0018 final report-head CI: SUCCESS.
- Work 0018 guarded push: PASS, one attempt.
- Work 0018 independent pull-back exact parity: PASS.

## Relevant prior state

Work 0015 and Work 0017 each used one synthetic Gmail message and stopped fail-closed at non-retryable `E_GMAIL_BODY_DECODE` before `PREPROCESSED`. Their Message State rows are therefore expected to be `DEAD` and are suppressed from ordinary manual-import processing.

Do not revive, edit, delete, relabel for retry, or otherwise alter those prior Message State / Dead Letter records. Old synthetic Gmail messages may remain labelled; durable state is expected to suppress them.

Work 0018 repaired the representation boundary before coercion:

- explicit String body data keeps strict base64url validation/padding/decode;
- plain Array or genuine Int8Array / Uint8Array / Uint8ClampedArray body data is validated as a bounded byte sequence and decoded directly with `Utilities.newBlob(bytes).getDataAsString('UTF-8')`;
- byte-sequence input never calls base64 decode;
- malformed/unsupported input remains fixed privacy-safe non-retryable `E_GMAIL_BODY_DECODE`.

The actual Apps Script Advanced Gmail runtime representation is not yet proven. This Work exists solely to prove that boundary.

## Authorized user sequence

### A. Create exactly one fresh synthetic Gmail message

1. Using the same personal Google principal, send exactly one new email to yourself.
2. Use exactly this subject:
   `[MOCK:NEW_HIGH] Work OS Synthetic E2E 0019`
3. Use only non-sensitive synthetic body text, for example:
   `これは Work OS Synthetic E2E 0019 の架空テストメールです。実データ・個人情報・機密情報は含みません。`
4. Do not add attachments, links, real names, real deadlines, private data, or company/production content.
5. Apply the current Gmail label `手動/取込` only to this new Work 0019 message/thread.
6. Do not apply `手動/除外`.
7. Do not modify the Work 0015 or Work 0017 failed test messages or their labels.

### B. Manual import / repaired body decode — exactly once

1. Open the exact existing personal-synthetic Work OS Spreadsheet.
2. Choose `業務OS v2` -> `手動/取込を1件前処理` exactly once.
3. Read the confirmation and continue once.
4. This action may make bounded Gmail Advanced Service reads and may write only the designed sandbox Message State / run-history/error checkpoint state.
5. It must not call AI or Calendar or create/update a Task.

## PASS requirements

PASS requires materially equivalent visible safe facts:

- `status=COMPLETE`;
- `candidate_count=1`;
- `processed_count=1`;
- `skipped_count=0`;
- `error_count=0`;
- `checkpoint=PREPROCESSED`;
- `next_operation=CLASSIFY`;
- Gmail API calls remain within the displayed bounded limit;
- `external_services.gmail=ADVANCED_GMAIL_SERVICE` or equivalent bounded Gmail read evidence;
- AI is `NOT_CALLED`;
- Calendar is `NOT_CALLED`;
- no unexpected real/non-synthetic message was selected;
- no raw exception, auth loop, or private-data disclosure occurred.

The exact `run_id`, Gmail message/thread IDs, email addresses, account identity, source URL, raw MIME/body, byte representation, OAuth values, or raw Google response must not be copied into GitHub evidence.

If PASS, highest permitted status is:

`READY_FOR_CONTROLLED_SYNTHETIC_MOCK_VERTICAL_VALIDATION`

## Stop conditions

Stop without workaround or retry if:

- manual import reports zero or more than one candidate;
- selected content is not the new Work 0019 synthetic message;
- `E_GMAIL_BODY_DECODE` recurs;
- any other error occurs before `PREPROCESSED`;
- `processed_count` is not exactly 1;
- AI or Calendar is called;
- a Task is created/updated;
- Gmail API call limit is exceeded;
- any raw exception, auth loop, identity ambiguity, unexpected real-data access, or private-data exposure occurs;
- a second manual-import invocation would be needed.

Do not broaden scope or clean up runtime effects under this Work ID.

## Explicit non-goals / not authorized

- no retry/mutation/deletion of Work 0015 or Work 0017 DEAD Message State / Dead Letter rows;
- no cleanup/deletion/relabeling of prior synthetic Gmail messages;
- no real/non-synthetic Gmail processing;
- no bulk Gmail processing or normal Inbox worker;
- no `手動/除外` behavior test;
- no `Phase 3/4 Mock縦フローを1件処理`;
- no Mock/production AI classification;
- no Task creation/update/edit;
- no Review accept/reject/restage;
- no Calendar create/update/delete/no-op or sync processing;
- no Dashboard refresh;
- no Quick or Deep Diagnostic;
- no Setup/Continue Setup;
- no Automation enablement or 5-minute worker trigger;
- no clasp push/pull/source mutation;
- no new Spreadsheet/Apps Script target;
- no company/production resource or real-data workflow;
- no cleanup, merge, release-to-production, or pilot activation.

## Evidence and Git requirements

After the user reports the safe menu result, ChatGPT owns the GitHub record:

- create `docs/handoffs/0019-report.md` with privacy-safe closed evidence only;
- do not store Gmail Message/Thread IDs, run IDs, addresses, account identity, URLs, raw body/MIME, byte values, Task IDs, Calendar IDs, OAuth values, or detailed raw Google payloads;
- update the Draft PR with result/final commit;
- keep the PR Draft/Open/Unmerged;
- check final report-head CI;
- if another product/runtime defect appears, stop and create a separate residual Work ID rather than expanding Work 0019.
