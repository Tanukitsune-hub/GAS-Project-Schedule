# Work 0012 — Controlled OAuth and Quick Diagnostic Runtime

## Outcome

Prove that the exact Work 0010 personal-synthetic bound Apps Script can execute one explicitly authorized `Quick Diagnostic` invocation in native Google Sheets after the minimum necessary user OAuth consent, while preserving the diagnostic's read-only side-effect contract.

This Work is intentionally user-assisted and GitHub-recorded. No Codex implementation is required unless the runtime exposes a product defect that cannot be resolved by inspection alone.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Parent Work: `0011`
- Starting commit: `4229c91697d081976da763d123dbb1fc9668c5cb`
- Exact target: the one personal-synthetic Spreadsheet created and round-trip validated by Work 0010 and used successfully for the Work 0011 `onOpen()` smoke.
- Product candidate remains Code `2.8.12-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3` / Automation OFF.

## Why this Work exists

Work 0011 proved the exact bound script loads and executes `onOpen()` natively in Google Sheets without OAuth consent. The next smallest unresolved runtime boundary is an explicitly invoked function that requires authorization.

`runQuickDiagnostic()` is designed as a bounded read-only diagnostic. Its acceptance summary explicitly reports whether any external service or write path was used. The current synthetic Spreadsheet is intentionally not Setup-complete, so this Work does not require the diagnostic's overall status to be PASS. Expected missing-Sheet / Setup-related FAIL or WARN results are acceptable if the diagnostic executes normally, returns a complete bounded summary, and every prohibited side-effect flag remains false.

The exact manifest currently declares scopes including Spreadsheet current-only access, container UI, ScriptApp, user identity, Gmail modify, and Calendar scopes. OAuth consent therefore may mention Gmail and Calendar even though this diagnostic must not call those APIs. Work 0012 authorizes consent only for this exact personal-synthetic Apps Script project and the same personal Google principal used in Work 0010/0011.

## Authorized user action

Exactly one controlled sequence is authorized against the exact Work 0010 synthetic target:

1. Open the exact synthetic Spreadsheet using the same personal Google principal.
2. Open the top-level `業務OS v2` menu.
3. Click `Quick Diagnostic` exactly once.
4. If Google presents an OAuth authorization flow, review it before approval.
5. OAuth approval is authorized only if all of the following are true:
   - it clearly belongs to the exact personal Apps Script project opened from this Spreadsheet;
   - the active account is the same personal principal used for Work 0010/0011;
   - no company/Workspace account or unrelated application is involved;
   - no scope/service appears outside the exact candidate manifest's Spreadsheet/UI/ScriptApp/userinfo/Gmail/Calendar scope families.
6. If an unverified-app warning appears for this self-owned Apps Script project, proceeding is permitted only after confirming the same exact personal project/account context. Any ambiguity is a stop condition.
7. After authorization, allow the original `Quick Diagnostic` invocation to complete. Do not click the menu item a second time in this Work.
8. Record only the privacy-safe `Bounded Acceptance Summary` fields shown by the dialog. Do not copy the detailed JSON section.

## Acceptance

PASS does not require the diagnostic's own `status` to be `PASS`, because Setup has not been executed.

Work 0012 PASS requires all of the following:

- OAuth consent, if requested, is approved only for the exact personal-synthetic project/account described above;
- exactly one `Quick Diagnostic` invocation is attempted;
- the diagnostic returns a visible result dialog rather than a runtime exception or authorization loop;
- `summary_contract_id = WORK_OS_V2_DIAGNOSTIC_ACCEPTANCE_SUMMARY_V1`;
- `diagnostic_kind = QUICK`;
- `acceptance_summary_status = COMPLETE`;
- all of these bounded summary flags are exactly `false`:
  - `external_services_called`;
  - `writes_performed`;
  - `spreadsheet_write_performed`;
  - `properties_write_performed`;
  - `trigger_write_performed`;
  - `flush_performed`;
  - `calendar_api_called`;
  - `gmail_api_called`;
  - `external_ai_request_performed`;
  - `dashboard_repair_performed`;
- any FAIL/WARN items are consistent with an uninitialized pre-Setup synthetic workbook and do not evidence a prohibited side effect or runtime crash;
- no Setup or other menu function is invoked.

If these conditions pass, the highest permitted status is:

`READY_FOR_CONTROLLED_SANDBOX_SETUP_VALIDATION`

## Stop conditions

Stop without workaround if any of the following occurs:

- target or account identity is ambiguous;
- OAuth is requested for a company/Workspace account, unrelated app, or clearly unrelated service family;
- authorization repeatedly loops or cannot complete normally;
- the function throws a raw runtime exception instead of returning the bounded result dialog;
- `summary_contract_id` or `diagnostic_kind` is unexpected;
- `acceptance_summary_status` is not `COMPLETE`;
- any prohibited side-effect flag listed above is not exactly `false`;
- Gmail, Calendar, external AI, Dashboard repair, trigger mutation, Properties write, Spreadsheet write, or any other mutation is observed;
- the user would need to invoke Quick Diagnostic a second time to obtain evidence.

Do not broaden scope in response to a failure.

## Explicit non-goals / not authorized

- no Setup or Continue Setup;
- no Deep Diagnostic;
- no Phase test-harness menu function;
- no Gmail search/read/write/label operation beyond the OAuth consent itself;
- no Calendar API operation beyond the OAuth consent itself;
- no trigger creation/deletion;
- no Dashboard refresh/repair;
- no worker/manual import/Calendar sync/dead-letter operation;
- no Provider request;
- no Automation enablement;
- no API executable deployment or custom GCP/OAuth provisioning;
- no `clasp run`, `scripts.run`, push, pull, or content mutation;
- no source/product/release change;
- no company/production resource or real-data workflow;
- no cleanup deletion;
- no merge/release.

## Evidence and Git requirements

After the user reports the result, ChatGPT owns the GitHub record:

- create `docs/handoffs/0012-report.md` with only privacy-safe closed evidence;
- record the bounded acceptance summary only, not detailed JSON;
- do not store account addresses, Spreadsheet IDs, Script IDs, URLs, OAuth client IDs, screenshots containing private data, raw authorization pages, source bodies, or credentials;
- update the Draft PR with result and final commit;
- keep the PR Draft/Open/Unmerged.

If Work 0012 exposes a runtime/product defect requiring code or executable debugging, create a separate residual Codex handoff rather than expanding this Work silently.
