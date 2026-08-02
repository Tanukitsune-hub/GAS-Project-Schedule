# Instruction 0013 corrected versioned runtime diagnostic retry evidence

Date: 2026-08-03

Repository: `Tanukitsune-hub/GAS-Project-Schedule`

Branch: `codex/0008-remote-gas-development-bootstrap`

Primary PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/11`

## Scope and preserved baseline

- The relocated checkout is on a local fixed drive and is not OneDrive-backed
  or a reparse point.
- The fetched handoff baseline was
  `d573a9e2661dce095ce1c45a0d5b99231595baa3`.
- Guard tooling was committed as
  `4abafde80ca68e6f76173323ca930d6f7a449fb4` before any Instruction 0013
  Google operation.
- PR #11 was Open, Draft, unmerged, and mergeable with a clean repository
  state before the operation.
- The ignored Instruction 0011 attempt record remained present and unchanged.
  Its preserved record SHA-256 is
  `d69d6e2536343737de97031a36cf9d285e687d98fc6169c3aefbbfe4c9277692`.
- A distinct ignored Instruction 0013 one-use marker was written before its
  first Google operation. Neither marker was deleted or reused.
- No canonical Apps Script source or canonical `appsscript.json` was changed.

## Non-Google verification before runtime operations

From `implementation/GoogleSpreadsheet`:

| Command | Closed result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm run verify:local` | `11/11 PASS`; 52 Node suites; JSON 46; YAML 2; Apps Script payload 23 files; secret/local-path findings 0 |
| `node tests/canonical_document_consistency_test.js` | `19/19 PASS` before result publication; `20/20 PASS` after it |
| `node tests/remote_gas_development_bootstrap_test.js` | `28/28 PASS` before the guard change; `31/31 PASS` after it; `32/32 PASS` after result classification |
| `node tools/local_clasp_dev.js self-test` | `25/25 PASS` before the guard change; `27/27 PASS` after it; `28/28 PASS` after result classification |

The canonical 23-file payload SHA-256 remained
`ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1`.
The ignored MYSELF-only runtime payload retained exact pull-back parity at
SHA-256
`5524d8412d79bbe8a9b77c916ec1132507b931a1c0b7dbb852eaafe991b74e7a`.

Guard-commit GitHub Actions completed successfully for both publication
events: push run `30756997391`, job `91520762240`; pull-request run
`30757045797`, job `91520893425`. Setup, checkout, Node setup, package-manager
activation, frozen install, local verification, post steps, and completion all
succeeded. No required step failed, was cancelled, skipped, or unexecuted.

## Corrected versioned deployment preflight

`pnpm run gas:prepare-runtime-retry:0013` completed locally before Google
access and created the separate marker. Then the explicitly opted-in read-only
`pnpm run gas:preflight-runtime-retry:0013` call completed once.

Closed-safe results:

| Field | Result |
|---|---|
| Named OAuth profile | PASS |
| Runtime authorization | PASS |
| Standard Cloud linkage | PASS |
| Cloud-project Apps Script API | PASS |
| OAuth Testing/Desktop-client prerequisites | PASS |
| Runtime overlay pull-back parity | PASS |
| Visible deployments | 2 |
| Visible versioned deployments | 1 |
| Visible HEAD test deployments | 1 |
| Ignored local binding matches visible versioned deployment | true |
| Binding is HEAD-only | false |
| Corrected versioned MYSELF-only binding | PASS |

The closed preflight-output SHA-256 is
`c785ef1dd988c7e12a64ac47aaf56c54ed918982b89ce97327449c5244ebeabe`.
No identifier, description, account detail, URL, or raw output is retained in
this evidence. No deployment was created or updated in Instruction 0013.

## Exactly-one deployed-version runtime call

After the preflight PASS, the one-use marker was durably changed to attempt
started before the remote call. The explicitly opted-in command
`pnpm run gas:test:runtime-dev:0013` invoked only `runQuickDiagnostic`, exactly
once, in deployed-version mode (`--nondev`).

| Field | Closed result |
|---|---|
| Google operation | `ATTEMPTED_FAILED_CLOSED` |
| Exact closed category | `REMOTE_QUICK_DIAGNOSTIC_FAILED_CLOSED` |
| Safe subtype | `VERSIONED_RUNTIME_FUNCTION_NOT_FOUND` |
| Immediate local parser record | `DEV_RUNTIME_RESULT_UNPARSEABLE` |
| Process exit code | 0 |
| Bounded diagnostic body | absent |
| Bounded diagnostic summary | not published |
| Raw-output byte count | 83 |
| Raw-output line count | 3 |
| Closed output SHA-256 | `b717ebf4dde28c2bbbfecd4f6fa8271001b46f8ba500c27860e1fb638a1cd9e2` |
| Instruction 0013 retry | prohibited / not performed |

Raw output remains only in ignored local operation state and was neither
printed nor copied into GitHub evidence. The closed subtype states only that
the requested function was unavailable from the corrected deployed version;
it does not infer an identifier, account, Workspace, or data condition.

## Acceptance boundary

- The development gate remains
  `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` only as a readiness boundary.
- Functional runtime acceptance remains `ATTEMPTED_FAILED_CLOSED`.
- `REVIEW_REQUIRED` remains.
- Phase 8B overall PASS and Phase 8C GO are not established.
- Production readiness, pilot readiness, and company-handoff readiness are not
  established.
- Company handoff remains
  `NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW`.
- Automation remains OFF, T11 remains `T11_SUSPENDED`, and
  `NO_ACTIVE_COMPANY_TRANSFER` remains.
- Deep Diagnostic, Dashboard refresh, Task edits, Gmail import, Calendar
  reconciliation, Automation enablement, Migration, test-harness execution,
  external AI/provider calls, company-PC/company-Workspace work, production,
  and real-data operations were not executed.

This tracked evidence contains no local absolute path, Script ID, deployment
ID, Workspace URL, account detail, OAuth material, credential, raw clasp
output, company data, personal data, or real data.
