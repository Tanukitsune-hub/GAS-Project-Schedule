# GAS Project Schedule

Google Apps Script source and non-Google validation tooling for the Google
Workspace Personal Work OS.

## Current contract

| Field | Value |
|---|---|
| Code | `2.8.20-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Machine gate | `READY_FOR_CONTROLLED_SANDBOX_VALIDATION` |
| Work 0033 highest permitted status | `READY_FOR_USER_GEMINI_E2E_RETRY_AFTER_SCHEMA_COMPATIBILITY_REPAIR` |
| Automation | `OFF` |
| Environment | `LOCAL_NON_GOOGLE` plus separately controlled personal sandbox |

The current payload is exactly 23 `.gs` files plus `appsscript.json`.
`CURRENT_CONTRACT.json`, release manifests, checksums, and the release
verifiers bind the source A20 and direct-child release B20.

Current packages:

- `implementation/GoogleSpreadsheet/release/v2.8.20-prepilot/`: `TEST_MODE=true`,
  Automation OFF, harness included.
- `implementation/GoogleSpreadsheet/release/v2.8.20-prepilot-phase8c/`:
  only the audited `TEST_MODE=false` transform, with the harness excluded.

## Work 0033 Gemini provider-schema boundary

The source uses the Gemini Interactions creation endpoint
`/v1beta/interactions` and preserves the strict `thought* model_output` grammar.
Non-2xx responses yield only bounded numeric status and a strict machine-safe
provider code. Invalid 2xx responses may expose only an allowlisted interaction
status. Provider bodies, human messages, details, headers, payloads,
identifiers, credentials, and opaque thought content are not surfaced or
persisted.

External-AI failure finalization is Message-only and reports `RECORDED` when
the durable failure checkpoint is saved or an explicit safe `PENDING` state
when that checkpoint cannot be confirmed. Synthetic validation pins one exact
candidate and does not fall back to generic eligible rows. Work 0033 projects
the canonical AI Schema 2.0 into a smaller provider-facing schema while the
strict application validator remains authoritative. Work 0033 itself made no
real Gemini request.

Work 0018 remains Code `2.8.14-prepilot` A14/B14. Work 0028 remains Code
`2.8.15-prepilot` A15/B15. Work 0029 remains Code `2.8.16-prepilot` A16/B16.
Work 0030 remains Code `2.8.17-prepilot` A17/B17. Work 0031 remains Code
`2.8.18-prepilot` A18/B18. Their historical reports are not rewritten.

## Validation

From `implementation/GoogleSpreadsheet`:

```text
pnpm install --frozen-lockfile
pnpm run verify:local
```

The gate validates JSON/YAML, Apps Script inventory and syntax, every current
test suite, deterministic release packages, A20/B20 lineage, active document
integrity, and secret/local-state exclusions. It performs no real Google,
OAuth, Gmail, Calendar, Apps Script function, or Gemini operation.

## Personal-sandbox completion step

The user has already placed the Gemini API key in the intended personal-sandbox
Script Property outside the repository, and readiness passed. Do not paste,
copy, rotate, or re-enter the key through GitHub, Codex, or ChatGPT.

The remaining personal Gemini E2E check is:

1. create one fresh Gmail Message using the exact approved synthetic subject
   and body;
2. ensure only that fresh Message carries `手動/取込`;
3. do not reuse any previous failed, stuck, or terminal Message;
4. run `業務OS v2` → `Gemini synthetic validation (one request)` once; and
5. retain the full safe result without running a second request.

Success means the strict classification is accepted and the governed Task or
valid Review outcome is created without an error, Calendar job, or Automation
activation. At that point the personal candidate moves to code freeze and
company-PC work is treated as environment qualification unless a distinct
environment-specific BLOCKER appears.

No credential, token, private URL, account identifier, message body, raw
Provider response, real Workspace identifier, or machine path belongs in
tracked evidence.
