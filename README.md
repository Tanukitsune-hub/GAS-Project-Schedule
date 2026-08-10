# GAS Project Schedule

Google Apps Script source and non-Google validation tooling for the Google
Workspace Personal Work OS.

## Current contract

| Field | Value |
|---|---|
| Code | `2.8.14-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Highest gate | `READY_FOR_CONTROLLED_SANDBOX_VALIDATION` |
| Automation | `OFF` |
| Environment assurance | `LOCAL_NON_GOOGLE` |
| Active company transfer | `NONE` |
| Active deployment target | `NONE` |

`CURRENT_CONTRACT.json` is the machine-checkable source/release contract once
the A14 source commit and direct-child B14 release commit have been created.
The two current packages are:

- `implementation/GoogleSpreadsheet/release/v2.8.14-prepilot/` —
  `TEST_MODE=true`, Automation OFF, test harness included.
- `implementation/GoogleSpreadsheet/release/v2.8.14-prepilot-phase8c/` — the
  audited `TEST_MODE=false` transformation only, with the test harness omitted.

Neither package is a deployment authorization. There is no active transfer
path in Work 0002.

## Canonical paths

- Current status: `CURRENT_STATUS.md`
- Governing decisions: `DECISIONS.md`
- Project context: `PROJECT_CONTEXT.md`
- Delivery plan: `MASTER_PLAN.md`
- Apps Script source: `implementation/GoogleSpreadsheet/apps-script-v2/`
- Tests and tools: `implementation/GoogleSpreadsheet/tests/` and
  `implementation/GoogleSpreadsheet/tools/`
- Authority protocols: `docs/TASK_AUTHORITY_PROTOCOL.md` and
  `docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`
- Current verification matrix: `docs/R4_VERIFICATION_MATRIX.md`
- Work instruction/report: `docs/handoffs/0002-instruction.md` and
  `docs/handoffs/0002-report.md`

Historical audits, instructions, releases, transfers, and evidence remain
historical records. They are not active operator instructions or current
payload sources.

## Local validation

From `implementation/GoogleSpreadsheet`:

```text
pnpm install --frozen-lockfile
pnpm run verify:local
```

The gate parses tracked JSON/YAML, validates the Apps Script payload and V8
syntax, executes every current `*_test.js` suite against the real `.gs`
source, verifies the two current release packages and A14/B14 ancestry, scans
for secrets and local state, and rejects untracked generated residue.

CI performs the same non-Google gate from a fresh checkout with read-only
repository permission. CI never reads Google credentials, clasp state,
deployment identifiers, OAuth state, or GitHub secret context, and never runs
`clasp push` or any Workspace operation.

## Acceptance boundary

Local and CI PASS justify only `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`.
Live Apps Script runtime, Gmail, Calendar, Sheets-native semantics, triggers,
OAuth, deployment, real AI Provider behavior, pilot, production, and company
handoff remain unaccepted. The production AI registry remains intentionally
empty and fails closed. Automation remains OFF.
