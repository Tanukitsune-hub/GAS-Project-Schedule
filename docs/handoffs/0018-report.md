# Work 0018 Report — Advanced Gmail Byte-Body Repair

## Result

- `WORK_ID`: `0018`
- `STATUS`: `READY_FOR_CONTROLLED_ADVANCED_GMAIL_BYTE_BODY_RETEST`
- `BLOCKER`: `NONE`
- `BRANCH`: `codex/0018-advanced-gmail-byte-body-repair`
- `PR`: `#31` (Draft / Open / Unmerged)
- `FINAL_REPORT_HEAD`: `SELF` (the commit containing this report)
- `AUTOMATION`: `OFF`
- `GMAIL_RUNTIME`: `NOT_EXECUTED`
- `EXTERNAL_AI`: `NOT_CALLED`
- `CALENDAR`: `NOT_CALLED`

## Narrow diagnosis and repair

The former `decodeBodyData()` coerced every non-empty value through `String()`
before representation inspection. If Advanced Gmail materializes body data as
an already-decoded byte sequence, that coercion produces comma-delimited text
and then incorrectly sends it through the base64url decoder. The Work 0016
padding-only repair therefore could not handle this representation boundary.

The repair classifies the value before coercion. Explicit String input retains
strict base64url alphabet, length, and terminal-padding validation and receives
only the exact required padding before `Utilities.base64DecodeWebSafe()`.
Plain Arrays and genuine Int8Array, Uint8Array, or Uint8ClampedArray values are
accepted only with finite integer bounded length, dense indices, and integer
elements in `-128..255`. Unsigned values above `127` are normalized to signed
Apps Script bytes, every element is validated, and bytes are decoded directly
with `Utilities.newBlob(bytes).getDataAsString('UTF-8')`. Byte input never calls
the base64 decoder.

Sparse, spoofed, unsupported, fractional, non-finite, or out-of-range input
remains a fixed privacy-safe, non-retryable `E_GMAIL_BODY_DECODE`. No exception
is suppressed. Existing body limits, truncation evidence, attachment exclusion,
PREPROCESSED behavior, idempotency, and Automation OFF are preserved.

Work 0018 deliberately performed no Gmail runtime access, so the actual
Advanced Service representation and repaired runtime outcome still require the
separately authorized retest named by the final status.

## Candidate and release identity

- Code: `2.8.14-prepilot`
- Schema: `2.6`
- AI Schema: `2.0`
- Migration: `3`
- `TEST_MODE`: `true`
- Automation: `OFF`
- authoritative Source A14: `2fd3fff0c1aebb1fecdecba02304ceace7ff1d0d`
- authoritative direct-child Release B14:
  `c298277b667c26e3141ebc44913af2f1f3a05cca`
- pre-Google repair head: `2a2903a976677ada05b3d07e846b1c2030077e2e`

The Phase 8B and Phase 8C packages were generated and verified from a committed
LF checkout. The normal Windows checkout's direct byte verifier was not used as
evidence because CRLF materialization changes working-tree bytes; the complete
gate independently cloned the committed head with `core.autocrlf=false` and
passed both release verifiers.

## Changed files at a high level

- `apps-script-v2/05_GmailGateway.gs`: strict pre-coercion dual representation
  classifier, byte validation/normalization, direct Blob UTF-8 decode, and
  preserved strict String/base64url path.
- Phase 2 regressions: signed/unsigned Japanese UTF-8, genuine typed arrays,
  no-base64 byte proof, strict String proof, empty data, malformed/sparse/
  fractional/non-finite/out-of-range data, spoof rejection, truncation,
  attachment exclusion, privacy, PREPROCESSED, and idempotency.
- candidate docs, tests, package/version metadata, deterministic Phase 8B/8C
  releases, checksums, and A14/B14 lineage.
- Work 0018 placement tooling/tests: fresh ignored one-use state, completed
  Work 0016 placement proof on the existing binding, exact native inventory,
  guarded push, and isolated pull parity.

## Local validation

- targeted Phase 2 suite: `34 / 34` PASS.
- Work 0018 one-use placement suite: `11 / 11` PASS.
- affected Work 0004/0006 historical clasp suites: `20 / 20` and `22 / 22`
  PASS against the current committed payload.
- complete Node regression collection: `60` suites PASS.
- complete local gate on the pre-Google head: `11 / 11` PASS.
- Apps Script inventory: `22` `.gs` + `appsscript.json` = `23`; missing `0`,
  extra `0`.
- Phase 8B/8C committed-LF release verifiers: PASS.
- A14/B14 direct-child lineage and B14 release-only scope: PASS.
- tracked secret/local-state scan: `0` hits.
- `git diff --check`: PASS.

## GitHub Actions before Google mutation

The exact pre-Google head `2a2903a976677ada05b3d07e846b1c2030077e2e`
was pushed before any target mutation.

- push CI run `31398346338`: `SUCCESS`.
- pull-request CI run `31398339752`: `SUCCESS`.

## Existing-target placement evidence

- new Spreadsheet / Apps Script target creation attempts: `0`.
- existing non-interactive clasp auth: `READY`; identity suppressed.
- accepted binding: only the completed Work 0010 personal-synthetic target
  with completed Work 0016 pull parity; identifiers suppressed.
- Work 0018 local state before staging: absent.
- native eligible inventory immediately before push: `23` files (`22` `.gs`
  plus one manifest), missing `0`, extra `0`, preferred pull extension `.gs`.
- guarded push attempt count: `1`; result `PASS`.
- semantic update-content evidence: `23` canonical files, missing `0`, extra
  `0`.
- independent pull attempt count: `1`; result `PASS`.
- pull-back inventory: `22` `.gs` plus `appsscript.json`, `23` total, missing
  `0`, extra `0`.
- exact byte/hash parity: `PASS`.

No retry, new target, second target, alternate account, binding inspection,
Gmail access, runtime execution, or cleanup mutation was used.

## Privacy and prohibited-operation evidence

No target identifiers, Spreadsheet or Script IDs, account/address data, OAuth
values, credential paths, private URLs, Gmail identifiers, raw Gmail payloads,
message content, byte arrays, raw exceptions, or raw Google responses are
recorded here or in Git.

| Operation | Count |
|---|---:|
| Gmail runtime / Work 0015 or Work 0017 message access | 0 |
| Manual import / Mock vertical / Apps Script function / clasp run | 0 |
| Spreadsheet or Apps Script target creation | 0 |
| Target/binding inspection | 0 |
| Spreadsheet cell mutation | 0 |
| External AI / Provider operation | 0 |
| Task / Review / Calendar operation | 0 |
| Setup / Continue Setup | 0 |
| Quick/Deep Diagnostic / Dashboard refresh | 0 |
| Trigger / Automation / deployment / Cloud-project mutation | 0 |
| OAuth login, logout, re-consent, account switch, or new profile | 0 |
| Company / production / real-data operation | 0 |

## Remaining boundary

Work 0018 proves strict local representation handling, coherent candidate and
release identity, exact-head CI, one guarded source placement, and independent
pull-back parity. It does not prove the Gmail runtime repair. A separate Work
ID must explicitly authorize one controlled Advanced Gmail byte-body retest.
No BLOCKER remains for that handoff.
