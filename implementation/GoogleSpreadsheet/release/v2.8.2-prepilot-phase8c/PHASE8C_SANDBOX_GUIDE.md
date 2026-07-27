# Phase 8C TEST_MODE=false Sandbox Guide

- Package: `v2.8.2-prepilot-phase8c`
- Code: `2.8.2-prepilot`
- Schema: `2.3`
- TEST_MODE: `false`
- Automation default: `OFF`
- Current gate: `NO-GO`

Do not deploy this package until the responsible human has confirmed the real
Provider, model, endpoint, opaque credential reference, company approval, data
policy approval, and credential-storage approval. Do not place credential
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
