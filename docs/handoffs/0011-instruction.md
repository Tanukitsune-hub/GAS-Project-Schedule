# Work 0011 — Native Bound-Script Runtime Menu Smoke

## Outcome

Prove the exact Work 0010 personal-synthetic bound Apps Script executes natively in Google Sheets without adding any new OAuth, GCP, deployment, push, pull, Setup, or external-service authority.

This Work is intentionally user-assisted and GitHub-recorded. No Codex implementation is required unless the smoke exposes a defect that cannot be resolved by GitHub inspection alone.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Parent Work: `0010`
- Starting commit: `8716379c06a0cabb109077bb627c28646a1408dc`
- Exact target: the one fresh personal-synthetic Spreadsheet created and successfully round-trip validated by Work 0010.
- Expected target title: `Work OS Synthetic Sandbox Work 0010`.
- Product candidate remains Code `2.8.12-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3` / Automation OFF.

## Why this Work exists

Work 0010 proved the exact 23-file source can be pushed to Google, read back as 22 server scripts plus one manifest, pulled independently, and matched byte-for-byte.

The next unresolved project-level blocker is real Apps Script runtime/native Sheets behavior. The smallest safe runtime proof is the bound simple `onOpen()` path in `Menu.gs`, which should add the `業務OS v2` custom menu when the Spreadsheet is opened.

This smoke deliberately does not invoke `Quick Diagnostic` yet because the exact candidate manifest declares Gmail/Calendar scopes. First manual execution of an authorized function may therefore introduce a separate OAuth-consent boundary even if the diagnostic itself is read-only.

## Authorized user action

Exactly one runtime smoke sequence is authorized against the exact Work 0010 synthetic target:

1. Open Google Drive with the same personal Google principal used for Work 0010.
2. Open the Spreadsheet titled `Work OS Synthetic Sandbox Work 0010`.
3. Allow the sheet to finish loading. One normal browser reload is permitted only if the custom menu is not yet visible after initial load.
4. Observe whether a top-level custom menu named `業務OS v2` appears.
5. Do not click any custom-menu item in this Work.

Opening the Spreadsheet and the simple bound `onOpen()` menu insertion are the only runtime actions authorized.

## Acceptance

PASS requires all of the following:

- the exact Work 0010 synthetic Spreadsheet opens normally;
- the top-level `業務OS v2` menu becomes visible after the initial open or the one permitted normal reload;
- no Setup, diagnostic, worker, Gmail, Calendar, trigger-management, Dashboard, Provider, or Automation command is invoked;
- no OAuth consent is approved;
- no new target, push, pull, source-content mutation, deployment, Cloud-project change, or cleanup deletion occurs.

If the menu appears, the highest permitted status is:

`READY_FOR_CONTROLLED_SANDBOX_OAUTH_AND_QUICK_DIAGNOSTIC_VALIDATION`

## Stop conditions

Stop without workaround if any of the following occurs:

- the expected synthetic Spreadsheet cannot be identified unambiguously;
- the sheet fails to open normally;
- `業務OS v2` does not appear after the initial open and one permitted reload;
- Google unexpectedly requires an OAuth consent flow merely to open the sheet;
- any unexpected data, account, or target ambiguity appears.

Do not approve an OAuth consent prompt in Work 0011.

## Explicit non-goals / not authorized

- no `Quick Diagnostic` or `Deep Diagnostic` invocation;
- no Setup or Continue Setup;
- no test-harness menu function;
- no Gmail read/write/search/label operation;
- no Calendar read/write operation;
- no trigger creation/deletion;
- no Dashboard refresh/repair;
- no Apps Script API executable deployment;
- no custom GCP project or OAuth-client provisioning;
- no `clasp run`, `scripts.run`, push, pull, or content update;
- no AI Provider request;
- no Automation enablement;
- no company/production resource or real-data workflow;
- no product/release/source changes;
- no merge/release.

## Evidence and Git requirements

After the user reports the observed result, ChatGPT owns the GitHub record:

- create `docs/handoffs/0011-report.md` with only privacy-safe closed evidence;
- do not store Spreadsheet IDs, Script IDs, URLs, account addresses, OAuth details, screenshots containing private data, or source bodies;
- update the Draft PR with result and final commit;
- keep the PR Draft/Open/Unmerged.

If the smoke fails in a way requiring local/runtime debugging, create a separate residual Codex handoff rather than expanding this Work silently.
