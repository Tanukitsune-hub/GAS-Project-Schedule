# GAS Project Schedule

Google Apps Script source and non-Google validation tooling for the Google
Workspace Personal Work OS.

## Current contract

| Field | Value |
|---|---|
| Code | `2.8.17-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Machine gate | `READY_FOR_CONTROLLED_SANDBOX_VALIDATION` |
| Work 0030 highest permitted status | `READY_FOR_USER_GEMINI_KEY_CONFIGURATION_AND_ONE_MESSAGE_VALIDATION` |
| Automation | `OFF` |
| Environment | `LOCAL_NON_GOOGLE` |

The current payload is exactly 23 `.gs` files plus `appsscript.json`.
`CURRENT_CONTRACT.json`, release manifests, checksums, and the release
verifiers bind the source A17 and direct-child release B17.

Current packages:

- `implementation/GoogleSpreadsheet/release/v2.8.17-prepilot/`: `TEST_MODE=true`,
  Automation OFF, harness included.
- `implementation/GoogleSpreadsheet/release/v2.8.17-prepilot-phase8c/`:
  only the audited `TEST_MODE=false` transform, with the harness excluded.

## Work 0030 Gemini response boundary

The source accepts the strict Gemini Interactions grammar
`thought* model_output`: opaque thought signatures and summaries are never
read, retained, logged, or surfaced, while exactly one final text output is
passed to the existing strict classification validator. The existing
no-argument readiness and synthetic-validation entrypoints remain test-mode
only and network-free in this Work; they are not invoked here.

Work 0018 remains Code `2.8.14-prepilot` A14/B14. Work 0028 remains Code
`2.8.15-prepilot` A15/B15, and Work 0029 remains Code `2.8.16-prepilot`
A16/B16. Their historical reports are not rewritten.

## Validation

From `implementation/GoogleSpreadsheet`:

```text
pnpm install --frozen-lockfile
pnpm run verify:local
```

The gate validates JSON/YAML, Apps Script inventory and syntax, every current
test suite, deterministic release packages, A17/B17 lineage, active document
integrity, and secret/local-state exclusions. It performs no real Google,
OAuth, Gmail, Calendar, Apps Script function, or Gemini operation.

No credential, token, private URL, account identifier, message body, raw
Provider response, real Workspace identifier, or machine path belongs in
tracked evidence. The next user-assisted boundary requires manual Script
Property entry of a real key; that key must never be pasted into GitHub,
Codex, or ChatGPT.
