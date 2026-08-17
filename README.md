# GAS Project Schedule

Google Apps Script source and non-Google validation tooling for the Google
Workspace Personal Work OS.

## Current contract

| Field | Value |
|---|---|
| Code | `2.8.19-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Machine gate | `READY_FOR_CONTROLLED_SANDBOX_VALIDATION` |
| Work 0032 highest permitted status | `READY_FOR_USER_GEMINI_DIAGNOSTIC_ONE_MESSAGE_RETRY` |
| Automation | `OFF` |
| Environment | `LOCAL_NON_GOOGLE` |

The current payload is exactly 23 `.gs` files plus `appsscript.json`.
`CURRENT_CONTRACT.json`, release manifests, checksums, and the release
verifiers bind the source A19 and direct-child release B19.

Current packages:

- `implementation/GoogleSpreadsheet/release/v2.8.19-prepilot/`: `TEST_MODE=true`,
  Automation OFF, harness included.
- `implementation/GoogleSpreadsheet/release/v2.8.19-prepilot-phase8c/`:
  only the audited `TEST_MODE=false` transform, with the harness excluded.

## Work 0032 Gemini runtime boundary

The source uses exactly the confirmed Gemini Interactions creation endpoint
`/v1beta/interactions` and preserves the strict `thought* model_output` grammar.
Non-2xx responses yield only bounded numeric status, strict provider code, and
allowlisted interaction status; provider bodies, messages, headers, payloads,
identifiers, and credentials are never retained or surfaced. Failed Message
State finalization is Message-only and records explicit `PENDING` evidence when
the checkpoint itself fails. Synthetic validation pins one exact candidate and
does not fall back to generic eligible rows. No real request is made here.

Work 0018 remains Code `2.8.14-prepilot` A14/B14. Work 0028 remains Code
`2.8.15-prepilot` A15/B15, and Work 0029 remains Code `2.8.16-prepilot`
A16/B16. Work 0030 remains Code `2.8.17-prepilot` A17/B17. Their historical
reports are not rewritten.

## Validation

From `implementation/GoogleSpreadsheet`:

```text
pnpm install --frozen-lockfile
pnpm run verify:local
```

The gate validates JSON/YAML, Apps Script inventory and syntax, every current
test suite, deterministic release packages, A19/B19 lineage, active document
integrity, and secret/local-state exclusions. It performs no real Google,
OAuth, Gmail, Calendar, Apps Script function, or Gemini operation.

No credential, token, private URL, account identifier, message body, raw
Provider response, real Workspace identifier, or machine path belongs in
tracked evidence. The next user-assisted boundary requires manual Script
Property entry of a real key; that key must never be pasted into GitHub,
Codex, or ChatGPT.
