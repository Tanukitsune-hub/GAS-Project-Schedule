# Work 0021 — Controlled Synthetic Review Creation and Human Accept Validation

## Outcome

Prove one complete synthetic human-review path in the exact existing personal-synthetic Work OS target running candidate `2.8.14-prepilot`:

`fresh synthetic Gmail -> manual import -> PREPROCESSED -> deterministic Mock NEW_REVIEW -> Review Task -> human ACCEPT -> canonical installable edit Trigger -> accepted OPEN Task`

This Work uses a fresh synthetic input because Work 0020 correctly produced no Review for the high-confidence safe `NEW_HIGH` fixture.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Parent Work: `0020`
- Starting commit: `929ec8aa85b74d7146f96b4e2b1d0648c3422218`
- Parent report: `docs/handoffs/0020-report.md`
- Exact target: the same existing personal-synthetic Spreadsheet / bound Apps Script target used since Work 0010.
- Candidate: Code `2.8.14-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`.
- `TEST_MODE=true`; Automation OFF; external/production AI disabled.
- Work 0020 final report-head CI: SUCCESS.
- Existing Work 0020 Task must not be edited during this Work.

## Expected Mock / Review behavior

Subject marker `[MOCK:NEW_REVIEW]` deterministically creates one `NEW_TASK` with:

- title `架空内容の確認`;
- `deadline_basis=AMBIGUOUS`;
- `needs_review=true`;
- confidence `0.72`;
- default priority `MEDIUM`;
- Calendar attributes `NONE` / `LOW`.

Expected visible state before human decision:

- 要確認 checked;
- 判断 `未選択`;
- 対応状況 `要確認`;
- タスク内容 `架空内容の確認`;
- 期限 blank;
- 優先度 `中`;
- 確認状態 `未確認`.

For this OPEN `NEW_TASK` Review, one user edit changing `判断` to `受入` should be processed by the canonical owner installable edit Trigger. Expected visible same-row state after Trigger completion:

- 要確認 unchecked;
- 判断 `受入`;
- 対応状況 `未対応`;
- 完了 unchecked;
- 対象外 unchecked;
- 確認状態 `適用済`;
- title remains `架空内容の確認`;
- no duplicate Task.

The edit handler may update Task authority state, run-history audit, and Calendar Outbox intent, but it does not call Gmail, AI, or Calendar APIs. No Calendar event is expected for this fixture.

## Authorized user sequence

### A. Create one fresh synthetic Review message

1. Using the same personal Google principal, send exactly one new email to yourself using new compose, not reply/forward.
2. Exact subject: `[MOCK:NEW_REVIEW] Work OS Synthetic Review 0021`
3. Use only non-sensitive synthetic body text, e.g. `これは Work OS Synthetic Review 0021 の架空テストメールです。実データ・個人情報・機密情報は含みません。`
4. No attachment, link, real name, real deadline, private data, or company/production content.
5. Apply `手動/取込` only to this new message/thread; do not apply `手動/除外`.
6. Do not alter prior failed messages or prior Tasks.

### B. Manual import — once

1. `業務OS v2` -> `手動/取込を1件前処理` exactly once.
2. PASS requires materially equivalent safe facts: COMPLETE; candidate 1; processed 1; skipped 0; errors 0; PREPROCESSED; next CLASSIFY; Gmail within budget; AI NOT_CALLED; Calendar NOT_CALLED.
3. If not PASS, STOP; do not retry or continue.

### C. Mock Review creation — once

1. `業務OS v2` -> `Phase 3/4 Mock縦フローを1件処理` exactly once.
2. Bounded Gmail re-fetch for hash verification is authorized.
3. Only deterministic local Mock AI is authorized; no external provider/network.
4. PASS requires materially equivalent safe facts: COMPLETE; candidate 1; processed 1; created Task 1; updated Task 0; Review count 1 or equivalent review-required confirmation; errors 0; Message checkpoint DONE; no external AI; no Calendar API.
5. Open `タスク一覧` read-only and confirm the expected pre-decision Review state listed above.
6. If materially different, STOP before decision.

### D. Human ACCEPT through installable edit Trigger — once

1. In only the new `架空内容の確認` row, change `判断` from `未選択` to `受入` exactly once using the existing dropdown.
2. Do not edit any other cell in that operation.
3. Do not invoke `Task編集を手動反映（fallback）` in Work 0021; this Work proves the installable Trigger path.
4. Allow the Trigger to complete and refresh the UI if necessary; do not repeat the edit.
5. PASS requires the expected post-decision visible state listed above and no duplicate Task.
6. Optional read-only supporting evidence: latest `処理履歴` shows a bounded `MANUAL_EDIT` / COMPLETE result for one processed/updated Task. Do not copy run IDs or private identifiers.
7. Do not invoke Calendar sync.

## Acceptance

PASS requires:

- exactly one fresh Work 0021 synthetic Gmail input;
- one successful manual import to PREPROCESSED;
- one Mock vertical creating exactly one review-required Task;
- expected visible Review state before decision;
- exactly one `受入` edit;
- installable edit Trigger visibly closes Review into accepted `未対応` state;
- no manual fallback;
- no duplicate Task;
- no external AI/network;
- no Calendar API/event mutation;
- Automation remains OFF;
- no real/company data or prohibited operation.

Highest permitted success status: `READY_FOR_CONTROLLED_SYNTHETIC_MANUAL_TASK_EDIT_VALIDATION`.

## Stop conditions

Stop without retry/workaround if candidate count is not 1; PREPROCESSED is not reached; Mock does not create exactly one review-required Task; expected Review state is absent; external AI is called; existing Task changes; `受入` cannot be selected; installable Trigger does not close the Review after a reasonable refresh; duplicate Task appears; Calendar API/event mutation occurs; any raw exception/auth/identity/private-data issue occurs; or a second import/Mock/decision edit would be needed.

Do not broaden scope or clean up effects under this Work ID.

## Non-goals / not authorized

No rejection-path test; no existing-Task AI-change Review/restage/CAS test; no arbitrary Task manual edit; no manual fallback; no deliberate Calendar sync; no Dashboard/diagnostics/Setup; no external AI configuration/call; no Automation enablement; no clasp/source mutation; no new target; no synthetic cleanup; no company/production resource; no merge/release/pilot activation.

## Evidence / Git requirements

After user reports safe outputs and visible before/after states, ChatGPT owns GitHub recording: create `docs/handoffs/0021-report.md`, update Draft PR, keep Draft/Open/Unmerged, and check final report-head CI. Store no Gmail IDs, run IDs, addresses/account identity, URLs, source body, Task IDs, Calendar IDs, OAuth values, or raw Google payloads. If a defect appears, create a separate Work ID.
