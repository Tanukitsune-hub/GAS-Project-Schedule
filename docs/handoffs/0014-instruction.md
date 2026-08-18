# Work 0014 — Post-Setup Quick Diagnostic Validation

## Outcome

Execute exactly one user-assisted `Quick Diagnostic` invocation against the same personal-synthetic Spreadsheet after the successful Work 0013 initial Setup, and verify the post-Setup runtime/readiness state using only the bounded acceptance summary.

This Work is intentionally user-assisted and GitHub-recorded. No Codex implementation is required unless this diagnostic reveals a product/runtime defect that cannot be resolved by inspection alone.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Parent Work: `0013`
- Starting commit: `ef90d3118c2606eb5129bcfd8ba8a64eaa4758a7`
- Exact target: the same personal-synthetic Spreadsheet created in Work 0010 and successfully Setup-completed in Work 0013.
- Product candidate remains Code `2.8.12-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`.
- TEST_MODE remains true.
- Automation remains OFF.
- External/production AI remains disabled and unconfigured.

## Why this Work exists

Work 0013 completed all Setup stages `S00` through `S99` in one invocation. The next smallest validation boundary is to prove the read-only Quick Diagnostic now sees the Setup-created Sheets, schemas, properties, dedicated Calendar configuration, and edit-trigger policy as established.

The diagnostic may still WARN for intentionally unconfigured production AI and other deferred production/pilot items. Work 0014 does not require every diagnostic check to PASS. It does require that Setup-dependent FAILs from Work 0012 are resolved unless a specific product defect is exposed.

## Exactly one authorized user action

1. Open the same personal-synthetic Spreadsheet using the same personal Google principal.
2. Open `業務OS v2`.
3. Click `Quick Diagnostic` exactly once.
4. Allow the single invocation to complete.
5. Record only the `Bounded Acceptance Summary` fields. Do not copy the detailed JSON section.
6. Do not invoke any other menu action in this Work.

No new OAuth consent is expected because Work 0012 already completed consent for this exact project/account context. If an unexpected new authorization loop or unrelated app/account appears, stop.

## Acceptance

PASS requires:

- exactly one Quick Diagnostic invocation;
- visible bounded result dialog and no raw runtime exception;
- `summary_contract_id = WORK_OS_V2_DIAGNOSTIC_ACCEPTANCE_SUMMARY_V1`;
- `diagnostic_kind = QUICK`;
- `acceptance_summary_status = COMPLETE`;
- all side-effect flags remain exactly false:
  - external_services_called;
  - writes_performed;
  - spreadsheet_write_performed;
  - properties_write_performed;
  - trigger_write_performed;
  - flush_performed;
  - calendar_api_called;
  - gmail_api_called;
  - external_ai_request_performed;
  - dashboard_repair_performed;
- Setup-dependent checks for required Sheets/schema/state no longer fail;
- any remaining WARN/FAIL items are reviewed and are consistent with intentionally deferred production/pilot capabilities rather than Setup corruption or prohibited side effects.

If those conditions pass, highest permitted status:

`READY_FOR_CONTROLLED_SYNTHETIC_END_TO_END_VALIDATION`

## Stop conditions

Stop without workaround if:

- a raw runtime exception occurs;
- authorization loops or an unrelated account/app appears;
- `acceptance_summary_status` is not COMPLETE;
- any side-effect flag is not exactly false;
- required Sheet/schema/state checks still fail unexpectedly;
- Gmail/Calendar/AI/writes occur;
- a second Quick Diagnostic invocation would be needed to obtain evidence.

## Not authorized

- no Setup or Continue Setup;
- no Deep Diagnostic;
- no Phase test harness;
- no Dashboard refresh;
- no Gmail message workflow;
- no Calendar event sync;
- no manual import/worker/dead-letter action;
- no Provider configuration/request;
- no Automation enablement;
- no clasp/source mutation;
- no company/production or real-data workflow;
- no deletion, merge, release, or pilot activation.

## Evidence and Git requirements

After the user reports the bounded acceptance summary, ChatGPT owns the GitHub record:

- create `docs/handoffs/0014-report.md` using only privacy-safe closed evidence;
- update the Draft PR with the result and final commit;
- keep the PR Draft/Open/Unmerged;
- if a material runtime/product defect is exposed, create a separate Codex handoff rather than silently expanding this Work.
