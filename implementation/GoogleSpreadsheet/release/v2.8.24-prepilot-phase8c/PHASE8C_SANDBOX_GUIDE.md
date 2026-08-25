# Phase 8C controlled Personal Shadow Pilot payload

- Package: `v2.8.24-prepilot-phase8c`
- Code: `2.8.24-prepilot`
- Schema: `2.6`
- AI Schema: `2.0`
- Migration: `3`
- Task canonical columns: `50`
- Authority store: protected hidden `Task Authority Ledger` (`21` columns)
- Snapshot-cell fallback: `FORBIDDEN`
- TEST_MODE: `false`
- Automation default: `OFF`
- Highest local status: `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`
- Phase 8C GO: `NOT DECLARED`

The audited production transform changes only `00_Config.gs` runtime flags:
`TEST_MODE` becomes `false` and the bounded external-provider readiness
flags become `true`. Automation remains `false` and the legacy company
approval compatibility alias remains `false`. No credential value is read
or placed in this package.

Do not deploy this package until the responsible human has confirmed the real
Provider, model, endpoint, opaque credential reference, and credential
readiness. Do not place credential
values in this package or evidence.

Before any functional acceptance, verify:

1. `99_TestHarness.gs` is absent.
2. Mock/Test menu items are absent after Spreadsheet reload.
3. Direct Mock/test entrypoints return `E_TEST_MODE_DISABLED`.
4. Missing Production AI configuration is reported separately by
   `PRODUCTION_AI_CONFIGURATION`, `PRODUCTION_AI_POLICY_APPROVAL`, and
   `PRODUCTION_AI_AUTH_READINESS`.
5. Automation remains OFF and no time-driven Trigger exists.

Real OAuth, exact Gmail Message processing, Calendar create/update/delete,
installable edit Trigger events, LockService contention, and runtime behavior
must be recorded as PASS / FAIL / NOT EXECUTED. Local tests do not make these
items PASS.