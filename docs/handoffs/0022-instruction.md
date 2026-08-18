# Work 0022 — Controlled Synthetic Manual Task Edit Validation

## Outcome

Prove the ordinary human Task-edit path independently of Review decisions and Calendar event processing in the exact existing personal-synthetic Work OS target running candidate `2.8.14-prepilot`.

Target path:

`accepted synthetic Task -> one ordinary editable business-field change -> canonical installable edit Trigger -> durable Task authority update -> read-only Quick Diagnostic authority confirmation`

Use only the already accepted Work 0021 synthetic Task `架空内容の確認`. Do not create or import another Gmail message in this Work.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Parent Work: `0021`
- Starting commit: `7d15b21909c2d73a4d5a570f418e9bb927f4f39a`
- Parent report: `docs/handoffs/0021-report.md`
- Exact target: same existing personal-synthetic Spreadsheet / bound Apps Script target used since Work 0010.
- Candidate: Code `2.8.14-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`.
- `TEST_MODE=true`; Automation OFF; external/production AI disabled.
- Work 0021 final report-head CI: SUCCESS.

## Why the Comment field is selected

The visible Task `コメント` field is an ordinary editable business field. It is intentionally selected because it provides the lowest-side-effect proof of normal user editing:

- it is editable under the Task schema;
- it exercises the canonical installable edit Trigger and Task-authority write path;
- it does not belong to the Calendar-reconcile field set;
- therefore this Work should not create a Calendar intent or call Calendar;
- it does not alter Task status, completion, deadline, priority, Review state, or Gmail state.

## Authorized user sequence

### A. One normal manual Task edit

1. Open the exact existing personal-synthetic Spreadsheet and `タスク一覧`.
2. Locate only the accepted Work 0021 row with Task title `架空内容の確認` and visible state `判断=受入`, `対応状況=未対応`, `確認状態=適用済`.
3. Change only its `コメント` cell from blank to exactly:
   `0022 synthetic manual edit`
4. Perform this edit exactly once.
5. Do not touch another cell in the same edit operation.
6. Do not use `Task編集を手動反映（fallback）`; this Work proves the canonical installable edit Trigger path.
7. Allow the Trigger to complete and refresh the Spreadsheet once if needed. Do not repeat the edit.

PASS for A requires:

- the comment remains exactly `0022 synthetic manual edit` after Trigger completion / refresh;
- title remains `架空内容の確認`;
- `判断` remains `受入`;
- `対応状況` remains `未対応`;
- `確認状態` remains `適用済`;
- no duplicate Task appears;
- no visible unrelated Task changes;
- no error toast or restoration message appears.

Optional read-only evidence: the latest `処理履歴` may show `MANUAL_EDIT` / COMPLETE for one processed and one updated Task. Do not copy any run ID or private identifier.

### B. Read-only Quick Diagnostic — once

Only after A visibly passes:

1. Invoke `業務OS v2` -> `Quick Diagnostic` exactly once.
2. This is read-only validation after the manual edit. Do not invoke Deep Diagnostic.

PASS requires materially equivalent safe evidence:

- `acceptance_summary_status=COMPLETE`;
- `fail_count=0`;
- `task_schema_ids_state=PASS`;
- `task_schema_headers_state=PASS`;
- `ledger_authority_validator_state=PASS`;
- Task Authority Ledger remains hidden/protected;
- all diagnostic write-side-effect flags remain false;
- Gmail API, Calendar API, external AI and other external services are not called by the diagnostic.

Existing expected WARN items such as production-AI readiness, Calendar remote verification, or Dashboard layout ownership do not fail this Work if no new FAIL appears.

## Acceptance

PASS requires all of the following:

- exactly one ordinary manual Task edit;
- only `コメント` changed to the exact synthetic value;
- canonical installable edit Trigger persisted the change without fallback;
- accepted Review state and other visible Task business fields remained stable;
- no duplicate/unintended Task mutation;
- no Calendar intent/event/API activity caused by the Comment edit;
- one read-only Quick Diagnostic completed with zero FAIL and Task authority validator PASS;
- Automation remains OFF;
- no external AI/network;
- no real/company data or prohibited operation.

Highest permitted success status:

`READY_FOR_CONTROLLED_SYNTHETIC_CALENDAR_RUNTIME_VALIDATION`

## Known non-blocking gap carried from Work 0021

`review_count` in the Mock run summary under-counted a newly inserted Review Task. This is a `FIX SOON` observability defect and is outside Work 0022. Do not change product source for it here.

## Stop conditions

Stop without retry/workaround if the Work 0021 Task cannot be uniquely identified; comment edit is rejected/restored; another field changes unexpectedly; a duplicate Task appears; manual fallback would be required; Calendar event/API activity occurs; Quick Diagnostic reports any FAIL or Task authority validator is not PASS; a raw exception/auth/identity/private-data issue occurs; or a second edit/diagnostic invocation would be needed.

Do not broaden scope or clean up runtime effects under this Work ID.

## Non-goals / not authorized

No Gmail import/worker; no Mock classification; no Review decision; no arbitrary status/deadline/priority/completion edit; no Calendar sync/event create-update-delete; no Dashboard refresh; no Deep Diagnostic; no Setup/Continue Setup; no external AI; no Automation enablement; no trigger mutation; no source/clasp mutation; no new target; no synthetic cleanup; no company/production resource; no merge/release/pilot activation.

## Evidence / Git requirements

After the user reports the visible edit result and bounded Quick Diagnostic summary, ChatGPT owns GitHub recording: create `docs/handoffs/0022-report.md`, update the Draft PR, keep Draft/Open/Unmerged, and check final report-head CI. Store no run IDs, account/address identity, Gmail/Task/Calendar IDs, private URLs, OAuth values, raw message data, or detailed raw Google payloads.
