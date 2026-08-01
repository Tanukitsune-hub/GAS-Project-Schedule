# 指示番号: 0009 — Publication and read-only target-shape evidence

## Scope

This additive record covers only the Instruction 0009 publication/CI gate and
the one isolated read-only access attempt against the already-attested personal
synthetic development target. It contains no identifier, account detail, URL,
credential, token, raw clasp output, local path, remote file name, remote file
content, or business data.

## Preserved lineage and publication

- Local reported 0007/0008 ancestry was verified as an unrewritten chain from
  the Instruction 0007 commit through `80599d4296441441ef9672f99bc5541f8d92eeb8`.
- The formal Instruction 0008/0009 branch was merged by normal no-ff merge at
  `e07d5c943b164356ba5a542dc4d216a381d75dbf`.
- The same branch was normally published and a stacked Draft PR was created
  against `codex/0006-local-clasp-validation-gate`.
- The current-head push and pull-request CI runs both completed successfully.
  The workflow contains one non-Google static/regression job; all of its steps
  completed successfully. No CI step used clasp, Google credentials, OAuth, or
  a target identifier.

## Locked local validation

| Check | Closed result |
|---|---|
| Non-Google local gate | `11/11 PASS` |
| Node regression suites | `52 PASS` |
| Canonical staged payload | `23` files at approved SHA-256 |
| Project-local clasp | `3.3.0` |
| Tracked secret/credential/local-path scan | `0` hits |
| Apps Script source / canonical manifest / release / transfer / checksum | unchanged |

## Read-only target-access result

| Field | Closed result |
|---|---|
| User-level Apps Script API | `OPERATOR_CONFIRMED_ENABLED` |
| OAuth/transport state | `AUTHENTICATED_CURRENT_OPERATOR_ACCOUNT` |
| Ignored target guard | `PASS` |
| Read-only pull transport | completed before local post-pull validation |
| Post-pull validation | `FAILED` |
| Closed category | `REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH` |
| Observed file count | `2` |
| Expected file count | `23` |
| Observed non-file count | `0` |
| Target inference | `NOT_MADE` |
| Canonical retry marker | `UNUSED` |
| Canonical push / canonical parity | `NOT_EXECUTED` |

The pre-remediation post-pull failure path did not preserve an operation record
after a successful pull with a shape mismatch. No raw output is reconstructed
or copied into this record. The tracked tooling correction now persists an
ignored safe summary containing only a closed category, output hash, exit
state, bounded counts, and a one-way binding fingerprint for future post-pull
failures. Raw clasp output, if any, remains separately ignored local state and
is never copied into tracked evidence. The tool invalidates any earlier access
PASS when prerequisites are rerecorded or an access check fails, and requires
a matching persisted 23-file access PASS before canonical push. Its
non-Google regression fixture passes. An explicitly attested local-only
access-check-workspace recovery exists for a corrected binding, but it is
`NOT_EXECUTED` for this evidence record.

## Consequence and exclusions

The current development status is `NO_GO_LOCAL_CLASP_VALIDATION`; company
handoff remains `NO_GO_COMPANY_HANDOFF_LOCAL_VALIDATION_FAILURE`. The result
does not prove a wrong project or authorize target replacement, remote cleanup,
canonical push, pull-back parity, Cloud/OAuth setup, runtime overlay,
deployment, runtime execution, company-PC carriage, or any Workspace action.

`T11_SUSPENDED`, `NO_ACTIVE_COMPANY_TRANSFER`, Instruction 0005
`SUPERSEDED_NOT_EXECUTED`, and Automation `OFF` remain unchanged. Setup, Deep
Diagnostic, Dashboard refresh, Task edits, Gmail, Calendar, Properties,
triggers, Automation, Migration, external AI, company actions, and all runtime
operations are `NOT_EXECUTED`.

## Review focus

1. Confirm that the strict 23-file remote-shape guard remains fail-closed.
2. Confirm that the new post-pull evidence is bounded and excludes payload
   names/content/identifiers/raw output.
3. Resolve the personal synthetic target's exact intended binding through a
   separate operator confirmation before any new read-only access attempt.
