# GAS Project Schedule

Google Apps Script source and non-Google validation tooling for the Google
Workspace Personal Work OS.

## Current contract

| Field | Value |
|---|---|
| Code | `2.8.16-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Machine gate | `READY_FOR_CONTROLLED_SANDBOX_VALIDATION` |
| Work 0029 highest permitted status | `READY_FOR_USER_GEMINI_KEY_CONFIGURATION_AND_ONE_MESSAGE_VALIDATION` |
| Automation | `OFF` |
| Environment | `LOCAL_NON_GOOGLE` |

The current payload is exactly 23 `.gs` files plus `appsscript.json`.
`CURRENT_CONTRACT.json`, release manifests, checksums, and the release
verifiers bind the source A16 and direct-child release B16.

Current packages:

- `implementation/GoogleSpreadsheet/release/v2.8.16-prepilot/`: `TEST_MODE=true`,
  Automation OFF, harness included.
- `implementation/GoogleSpreadsheet/release/v2.8.16-prepilot-phase8c/`:
  only the audited `TEST_MODE=false` transform, with the harness excluded.

## Work 0029 runtime boundary

The source exposes no-argument `checkGeminiSyntheticReadiness()` and
`runGeminiSyntheticValidationOnce()` functions in the test-mode menu. The
readiness path is network-free. The validation path requires the actual
Automation state to be consistently OFF and accepts only one exact fictional
UTF-8 synthetic message. It never falls back to Mock and permits at most one
Gemini request in a later, separately authorized Work.

Work 0018 remains Code `2.8.14-prepilot` A14/B14. Work 0028 remains Code
`2.8.15-prepilot` A15/B15. Their historical reports are not rewritten.

## Validation

From `implementation/GoogleSpreadsheet`:

```text
pnpm install --frozen-lockfile
pnpm run verify:local
```

The gate validates JSON/YAML, Apps Script inventory and syntax, every current
test suite, deterministic release packages, A16/B16 lineage, active document
integrity, and secret/local-state exclusions. It performs no real Google,
OAuth, Gmail, Calendar, Apps Script function, or Gemini operation.

No credential, token, private URL, account identifier, message body, raw
Provider response, real Workspace identifier, or machine path belongs in
tracked evidence. The next user-assisted boundary requires manual Script
Property entry of a real key; that key must never be pasted into GitHub,
Codex, or ChatGPT.
