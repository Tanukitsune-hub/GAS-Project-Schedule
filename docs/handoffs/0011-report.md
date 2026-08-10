# Work 0011 — Native Bound-Script Runtime Menu Smoke Report

## Outcome

Work 0011 completed the authorized user-assisted runtime smoke against the exact Work 0010 personal-synthetic Spreadsheet.

```text
WORK_ID: 0011
STATUS: READY_FOR_CONTROLLED_SANDBOX_OAUTH_AND_QUICK_DIAGNOSTIC_VALIDATION
BLOCKER: NONE
TARGET: EXACT_WORK_0010_PERSONAL_SYNTHETIC
SPREADSHEET_OPEN: PASS
TOP_LEVEL_CUSTOM_MENU: PASS
CUSTOM_MENU_NAME: 業務OS v2
NORMAL_RELOAD_USED: NOT_REPORTED
CUSTOM_MENU_ITEM_INVOCATIONS: 0
OAUTH_CONSENT_APPROVALS: 0
PROHIBITED_OPERATION_ATTEMPTS: 0
```

The user opened the exact Work 0010 personal-synthetic Spreadsheet and observed the top-level `業務OS v2` custom menu. This proves the bound Apps Script simple `onOpen()` runtime path executed natively in Google Sheets and successfully inserted the custom menu.

No custom-menu item was invoked in this Work. No OAuth consent was approved.

## Exact starting point and candidate preservation

- Work 0011 instruction commit: `d8ae14bb25af1295022e2d564b0cb3650c956a9a`.
- Exact Work 0010 starting parent: `8716379c06a0cabb109077bb627c28646a1408dc`.
- Exact target: the personal-synthetic Spreadsheet created and round-trip validated in Work 0010.
- Product candidate remained Code `2.8.12-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3` / Automation OFF.
- No product, release, source, manifest, dependency, governance, or configuration file was changed by the smoke.

## Runtime evidence

Privacy-safe user-observed result:

```text
SPREADSHEET_OPENED_NORMALLY: PASS
ONOPEN_NATIVE_RUNTIME: PASS
TOP_LEVEL_CUSTOM_MENU_VISIBLE: PASS
CUSTOM_MENU_NAME: 業務OS v2
```

The smoke establishes that the exact bound project placed in Work 0010 is executable in the native Google Sheets host sufficiently for the simple `onOpen()` trigger to run and create the expected UI menu.

No Spreadsheet ID, Script ID, URL, account identity, OAuth metadata, screenshot, source body, credential, or credential path is recorded.

## Guardrail confirmation

The following were not performed:

- Quick Diagnostic or Deep Diagnostic;
- Setup or Continue Setup;
- test-harness menu functions;
- Gmail operations;
- Calendar operations;
- trigger creation/deletion;
- Dashboard refresh/repair;
- Apps Script API executable deployment;
- custom GCP project or OAuth-client provisioning;
- `clasp run`, `scripts.run`, push, pull, or content update;
- AI Provider operation;
- Automation enablement;
- company/production resource or real-data workflow;
- source/product/release mutation;
- cleanup deletion;
- merge or release.

No OAuth consent was approved.

## Result and next boundary

Work 0011 proves the native bound-script `onOpen()` runtime/UI path only. It does not yet prove authorized function execution requiring OAuth, Quick Diagnostic behavior, Setup, Gmail, Calendar, triggers, Dashboard, Provider, Automation, pilot, production, or company acceptance.

The highest permitted status is:

`READY_FOR_CONTROLLED_SANDBOX_OAUTH_AND_QUICK_DIAGNOSTIC_VALIDATION`

A separate committed Work ID and handoff are required before approving any OAuth consent or invoking Quick Diagnostic or any other custom-menu action.

## Git and PR

- Branch: `codex/0011-native-runtime-menu-smoke`.
- Instruction commit: `d8ae14bb25af1295022e2d564b0cb3650c956a9a`.
- Draft PR: #23.
- PR base: `codex/0010-fresh-controlled-remote-placement`.
- Merge: NOT_PERFORMED.
- BLOCKER: NONE.
