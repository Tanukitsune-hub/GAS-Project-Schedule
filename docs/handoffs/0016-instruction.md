# Work 0016 — Gmail Body Decode Runtime Repair

## Outcome

Repair the real Apps Script Gmail body decoding defect exposed by Work 0015, preserve the existing fail-closed/privacy boundaries, produce a new internally consistent pre-pilot candidate if product bytes change, and place the repaired exact payload onto the same existing personal-synthetic Apps Script target for a later user-assisted Gmail re-test.

Highest permitted success status:

`READY_FOR_CONTROLLED_GMAIL_BODY_DECODE_RETEST`

Do **not** perform the Gmail re-test in Work 0016.

## Why Codex is needed

Work 0015 exposed a runtime-only implementation defect at the Advanced Gmail Service -> Apps Script `Utilities` decode boundary. Residual work now requires source implementation, regression tests, release/candidate consistency, local executable validation, and one bounded source placement to the already-approved personal-synthetic Apps Script target.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Branch: `codex/0016-gmail-body-decode-runtime-repair`
- Starting commit: `1d10798c9167996b49f6e686442e45577e5c1cfd`
- Parent Work: `0015`
- Work 0015 report: `docs/handoffs/0015-report.md`
- Work 0015 result: `BLOCKED_BY_GMAIL_BODY_DECODE_PRODUCT_DEFECT`
- Safe runtime evidence: candidate `1`, processed `0`, error `1`, `E_GMAIL_BODY_DECODE`, Gmail API calls `4/20`, no PREPROCESSED checkpoint, AI not called, Calendar not called.
- Work 0015 instruction-head CI: SUCCESS.
- Existing product before repair: Code `2.8.12-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3` / `TEST_MODE=true` / Automation OFF.
- Exact runtime target: reuse only the same personal-synthetic Spreadsheet/bound Apps Script project already validated through Works 0010-0015. Do not create another target.

## ChatGPT-completed investigation

The exact synthetic message was inspected read-only outside GitHub. Only these privacy-safe structural facts may be used or recorded:

- short synthetic body;
- no attachment;
- standard `multipart/alternative`;
- `text/plain` part with UTF-8 charset.

Do not seek, print, log, commit, or report the message/thread IDs, email addresses, raw MIME, body text, Gmail URL, account identity, Calendar/Spreadsheet/script IDs, OAuth values, or tokens.

Relevant current code:

- `implementation/GoogleSpreadsheet/apps-script-v2/05_GmailGateway.gs`
- `decodeBodyData()` currently converts `body.data` to String and directly calls `Utilities.base64DecodeWebSafe(selected)`.
- `collectPlainParts()` handles attachment-free `text/plain` parts recursively.
- `loadMessageContent()` obtains `Gmail.Users.Messages.get(..., {format:'full'})`.

Relevant current local test gap:

- `implementation/GoogleSpreadsheet/tests/phase2_local_test.js`
- local `Utilities.base64DecodeWebSafe` is emulated by Node `Buffer.from(value, 'base64url')`.
- Node's decoder is more permissive than the real Apps Script runtime for some base64url forms, so current local PASS does not prove the real decoder boundary.

Official contract reviewed by ChatGPT before this handoff:

- Gmail API `MessagePartBody.data` is a base64url-encoded string.
- Advanced Gmail Service uses the public Gmail API resource model.
- Apps Script exposes `Utilities.base64DecodeWebSafe()` for web-safe base64 and documents padded examples.

Primary hypothesis to verify from code/API semantics: Gmail may supply valid base64url without `=` padding while Node Buffer accepts it and the real Apps Script decoder rejects it. Treat this as a hypothesis until Codex inspection confirms the minimal safe normalization required.

## Required-now scope

### 1. Prove the smallest root cause possible

Inspect the decoder and its tests first. Do not broaden into Gmail worker redesign.

Determine whether the Work 0015 failure is sufficiently explained by base64url normalization/padding behavior. If another concrete source-level defect is found, document it and fix only that defect.

Do not invent unsupported runtime representations merely to make the decoder permissive.

### 2. Implement a strict, bounded decoder repair

The repair must:

- continue to accept Gmail API base64url body data only through a narrow validated path;
- normalize valid base64url safely before `Utilities.base64DecodeWebSafe()` where required;
- if padding is restored, add only the exact `=` count required to reach a valid 4-character quantum;
- reject structurally impossible input such as a normalized length remainder of `1`;
- never log or include body content in errors;
- preserve `E_GMAIL_BODY_DECODE` fail-closed behavior for malformed/unsupported data;
- preserve the byte/transport truncation boundary;
- preserve attachment skipping;
- preserve Gmail call limits and all existing worker checkpoint semantics;
- not introduce `GmailApp`, `UrlFetchApp`, alternate accounts, alternate API paths, or external decoding libraries merely as a workaround.

If standard-base64 alphabet conversion, whitespace stripping, Byte[] handling, or any broader compatibility behavior is added, Codex must justify it from the actual Gmail/Apps Script contract or a concrete source/runtime representation; otherwise omit it under YAGNI.

### 3. Add regression coverage

At minimum add/extend tests for:

- short Japanese UTF-8 text equivalent in complexity to the Work 0015 synthetic body;
- padded base64url;
- valid unpadded base64url for remainders requiring one and two restored `=` characters;
- URL-safe alphabet characters (`-` / `_`) in encoded data;
- malformed impossible-length input fails closed with `E_GMAIL_BODY_DECODE`;
- existing bounded/truncated body behavior remains correct;
- attachment data remains excluded;
- no body/identifier leakage to logs/results.

Where the Node test shim would otherwise hide the Apps Script compatibility defect, test the normalization function/contract explicitly rather than relying only on Node Buffer permissiveness.

### 4. Keep candidate/release identity coherent

If any product runtime byte changes, do not leave `2.8.12-prepilot` claiming byte identity with the old release.

Use the repository's existing version/release conventions to create the minimal next candidate (normally `2.8.13-prepilot` unless repository rules require another exact designation), rebuild the required release/checksum/manifest artifacts, and update canonical contract/status/version references only to the extent required for internal consistency.

Do not perform unrelated documentation cleanup or historical release edits.

Schema `2.6`, AI Schema `2.0`, Migration `3`, `TEST_MODE=true`, and Automation OFF must remain unchanged unless the decoder repair genuinely requires otherwise; no such change is expected.

### 5. Validate locally and in CI before Google mutation

Run the full applicable local verification gate plus targeted decoder tests and release verification.

Require:

- all targeted tests PASS;
- full local gate PASS;
- release/candidate parity PASS;
- privacy/secret scan PASS;
- clean scope/diff review;
- no unexpected product behavior change.

Commit and push the implementation/release repair to the Work 0016 branch, then require GitHub Actions SUCCESS on that exact repair head before touching the Google target.

## Exactly authorized Google-side operation

After the exact repair-head CI is SUCCESS:

1. Reuse only the existing personal-synthetic Apps Script target already used through Work 0015.
2. Verify the local binding refers to that existing target without printing identifiers.
3. Stage the exact repaired canonical payload and run the existing native file-inventory gate.
4. Require the exact canonical file set expected by the repaired candidate; zero missing/unexpected files.
5. Record a Work-0016 one-use push-attempt marker before remote mutation.
6. Perform **exactly one** source push to that same Apps Script project.
7. No retry if the push is ambiguous or fails.
8. Perform at most one independent pull-back if needed to prove exact source parity; if used, record its attempt before execution and do not retry.
9. Require repaired source parity before declaring success.

This source placement does not authorize any Spreadsheet cell mutation, Gmail read/search, Calendar operation, Setup, trigger mutation, menu/runtime invocation, AI call, or user-data workflow.

## Explicit non-goals / prohibited actions

- no manual Gmail import or Gmail body runtime probe in Work 0016;
- no processing/retry of the Work 0015 synthetic email;
- no Gmail label mutation;
- no Mock vertical invocation;
- no external/production AI;
- no Calendar create/update/delete/read beyond anything unavoidable in already-existing non-mutating source tooling; preferably no Calendar API call at all;
- no Setup/Continue Setup;
- no Quick/Deep Diagnostic or Dashboard refresh;
- no trigger creation/deletion;
- no Automation enablement;
- no new Spreadsheet, Apps Script project, Calendar, account, Cloud project, OAuth consent, deployment, or target;
- no company/production resource or real data;
- no cleanup of the failed Work 0015 Message State or Gmail label;
- no merge, rebase, force-push, history rewrite, or release-to-production action.

Do not invoke repository-defined custom agents. Standard Codex subagents may be used only if materially useful.

## Acceptance checks

PASS requires all of:

- narrow root cause documented with evidence;
- decoder repair is strict and fail-closed;
- targeted Japanese/padding/url-safe/malformed regression tests PASS;
- full local verification PASS;
- release/candidate identity internally coherent;
- privacy/secret scan PASS;
- exact repair-head GitHub Actions SUCCESS before Google mutation;
- exactly one authorized source push at most, to the existing synthetic target only;
- source parity after push proven or safely bounded;
- no Gmail processing/runtime invocation;
- no AI/Calendar/Setup/trigger/Automation activity;
- final worktree clean;
- Draft PR remains open/unmerged.

Highest permitted success status:

`READY_FOR_CONTROLLED_GMAIL_BODY_DECODE_RETEST`

## Stop / escalation conditions

Stop and report a BLOCKER without retry if:

- the root cause cannot be narrowed enough to implement a safe minimal repair;
- repair would require broad MIME parser redesign or a second Gmail API path;
- product/release identity cannot be made coherent;
- local or CI validation fails materially;
- target identity cannot be proven without exposing identifiers;
- native source inventory differs from the exact candidate;
- push is ambiguous/fails;
- a second push/target/account would be required;
- any Gmail, Calendar, external AI, Setup, trigger, Automation, production/company, or real-data operation would be required to finish Work 0016.

## Git / PR requirements

- Branch: `codex/0016-gmail-body-decode-runtime-repair`
- Base PR on: `codex/0015-synthetic-gmail-mock-task-e2e`
- Instruction path: `docs/handoffs/0016-instruction.md`
- Codex report path: `docs/handoffs/0016-report.md`
- Keep PR Draft/Open/Unmerged.
- Commit/push all in-scope implementation, tests, release artifacts, and the report.
- Link both instruction and report in the PR body.
- Final report must include: root cause; files changed at a high level; candidate identity; targeted/full test results; CI evidence; push/pull attempt counts; privacy statement; prohibited-operation counts; final BLOCKER status.
- Never include private identifiers, message content, addresses, URLs for private Google resources, tokens, raw Gmail payloads, or OAuth/account values.
