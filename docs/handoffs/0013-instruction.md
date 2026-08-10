# Work 0013 — Controlled Initial Setup Invocation

## Outcome

Execute exactly one user-assisted `初期セットアップ` invocation against the exact personal-synthetic Spreadsheet used in Work 0010-0012, allowing only the repository's existing staged Setup workflow and its documented bounded side effects.

This Work is intentionally user-assisted and GitHub-recorded. No Codex implementation is required unless the runtime exposes a product defect that cannot be resolved by inspection alone.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Parent Work: `0012`
- Starting commit: `20fd2cc68a0c49a551cecfce354ecf4fcb19b723`
- Exact target: the same personal-synthetic Spreadsheet created in Work 0010 and successfully used in Work 0011/0012.
- Product candidate remains Code `2.8.12-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`.
- `TEST_MODE=true`.
- Automation remains OFF.
- External/production AI remains disabled and unconfigured.

## Why this Work exists

Work 0012 proved the native `Quick Diagnostic` executes normally and has zero external-service/write side effects, while its FAIL/WARN inventory is consistent with the intentionally uninitialized workbook. The next required boundary is the repository's staged Setup path.

`executeSetup()` processes the ordered Setup stages until it completes or reaches its soft runtime budget. A `PAUSED` result is an intended safe checkpoint; this Work does not authorize a second invocation after `PAUSED`.

## Exactly one authorized user action

1. Open the exact same personal-synthetic Spreadsheet using the same personal Google principal.
2. Open `業務OS v2`.
3. Click `初期セットアップ` exactly once.
4. Read the confirmation dialog. Proceed only if it states that the target must be a new empty Spreadsheet or resumable v2 environment, and that normal Inbox processing, real AI, and the 5-minute worker trigger remain disabled.
5. Click `OK` exactly once.
6. Allow that single Setup invocation to finish or safely pause.
7. Do not click `セットアップを続行` in Work 0013, even if the result is `PAUSED`.
8. Record only privacy-safe closed result fields: `status`, `code`, `completed_stages`, `next_stage` if present, and any bounded/safe summary shown by the UI. Do not copy IDs, URLs, account details, raw API responses, detailed JSON containing identifiers, or source bodies.

## Side effects explicitly authorized inside this one Setup invocation

Only the existing Setup stages are authorized:

- `S00_VALIDATE_ENV`: read-only validation of the bound Spreadsheet.
- `S10_CREATE_SHEETS`: create the required Work OS v2 Sheets.
- `S20_CREATE_SCHEMAS`: create column/schema headers and required protections.
- `S30_APPLY_SMALL_VALIDATIONS`: apply bounded validations, formats, and visibility state.
- `S40_SEED_SAFE_SETTINGS`: seed safe initial settings/guide state with Automation OFF and real AI disabled.
- `S50_CREATE_GMAIL_LABELS`: create only missing formal Work OS Gmail labels, up to the canonical seven names.
- `S60_CREATE_DEADLINE_CALENDAR`: confirm or create only the dedicated secondary Calendar named `自動期日管理`.
- `S70_STORE_PROPERTIES`: store only the designed non-secret version/instance/setup state.
- `S80_CREATE_EDIT_TRIGGER`: confirm or create only one owner installable edit Trigger for the Work OS edit handler.
- `S90_QUICK_DIAGNOSTIC`: execute the built-in read-only Quick Diagnostic.
- `S99_COMPLETE`: record Setup completion state.

The invocation may process multiple stages automatically before returning because that is the committed `executeSetup()` behavior.

## Explicitly not authorized

- no `セットアップを続行` second invocation in this Work;
- no manual/deep diagnostic invocation by the user;
- no 5-minute `runScheduledWorker` trigger;
- no Automation enablement;
- no normal Inbox processing;
- no Gmail message/thread search/read/write/label processing other than creation/inspection of the seven formal Setup labels;
- no Calendar event creation/update/deletion; only the dedicated secondary Calendar container may be confirmed/created;
- no external AI request or Provider configuration;
- no Dashboard refresh/repair menu action;
- no manual import, worker, Calendar outbox sync, dead-letter retry, or Review restage;
- no clasp push/pull/run or source mutation;
- no custom GCP/OAuth provisioning;
- no company/production resource or real-data workflow;
- no target deletion, merge, release, or pilot activation.

## Stop conditions

Stop without workaround if any of the following occurs:

- the target or account is ambiguous;
- Setup classifies the Spreadsheet as non-empty unsafe, v1, unknown, or schema-conflicted;
- a new OAuth flow requests a company/Workspace account or unrelated application/service family;
- the result is `FAILED`, `FAIL`, `PHASE_BOUNDARY`, or a raw runtime exception;
- the UI or result indicates Automation started, real AI was called, a 5-minute production worker trigger was created, Gmail messages were processed, or Calendar events were mutated;
- the user would need to press `初期セットアップ` or `セットアップを続行` a second time to obtain evidence.

Do not broaden scope in response to a failure.

## Acceptance

### Complete path

PASS if the single invocation returns `COMPLETE` and:

- all Setup stages through `S99_COMPLETE` are reported completed;
- Automation remains OFF;
- real/external AI remains disabled and was not called;
- no production worker trigger was created;
- no prohibited operation occurred.

Highest permitted success status:

`READY_FOR_POST_SETUP_QUICK_DIAGNOSTIC_VALIDATION`

### Budget-pause path

A result of `PAUSED` with a valid `next_stage` is an acceptable safe checkpoint, not a product failure. Stop there. A new committed Work ID must authorize any `セットアップを続行` invocation.

Checkpoint status:

`CONTROLLED_SETUP_PAUSED_REQUIRES_NEW_WORK`

## Evidence and Git requirements

After the user reports the result, ChatGPT owns the GitHub record:

- create `docs/handoffs/0013-report.md` using only privacy-safe closed evidence;
- update the Draft PR with the result and final commit;
- keep the PR Draft/Open/Unmerged;
- if Setup reveals a product/runtime defect, create a separate residual Codex handoff instead of silently expanding this Work.
