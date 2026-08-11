# Current Status

Last updated: 2026-08-10

Candidate version: Code `2.8.14-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Overall status: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

Automation: `OFF`

## Outcome boundary

Work 0018 creates the smallest successor candidate needed to repair the Gmail
Advanced Service dual-representation body-decode boundary. Explicit String
input remains strict base64url; narrowly recognized signed or unsigned byte
sequences are validated and decoded directly through an Apps Script Blob. It
preserves the Work 0002
clean integration behavior, Schema `2.6`, AI Schema `2.0`, Migration `3`,
`TEST_MODE=true`, and Automation OFF.

The candidate contains one current source tree and, after B14 generation, one
current Phase 8B package plus one Phase 8C candidate package. There is no
active company transfer, deployment target, runtime marker, or operator action
selected by this status.

## Integrated safety behavior

- Task authority is held in a failure-recoverable generation/state/hash ledger.
- Editable Task rows and editable snapshot cells cannot recreate trust.
- Multi-row edits restore valid peers and quarantine invalid authority rows.
- Task internal-ID and Japanese-label header rows are restored canonically.
- Calendar intent survives enqueue, acknowledgement, and authority-loss gaps.
- Dashboard surface ownership and write visibility fail closed, with required
  flush, reacquire, and readback checks in the strongest local model.
- Diagnostics expose bounded complete summaries and remain read-only.
- Gmail exact-message ordering/idempotency, Review/CAS, retry/dead-letter,
  privacy/redaction, and Automation-OFF guards remain intact.

## Evidence boundary

```text
Base candidate and historical Work 0002 evidence: docs/handoffs/0002-report.md
Work 0018 exact validation/CI/placement evidence: docs/handoffs/0018-report.md
Gmail body decode runtime retest: NOT_AUTHORIZED_IN_WORK_0018
Real AI Provider validation: NOT_EXECUTED
Company handoff: NOT_AUTHORIZED
```

Source/release identity is machine-checked by `CURRENT_CONTRACT.json`, the
release verifiers, and the A14/B14 direct-child gate. Local or CI success does
not prove the repaired Gmail runtime boundary; Work 0018 explicitly prohibits
all Gmail runtime access and retesting.

## Remaining project-level blockers

These do not block the Work 0002 local integration outcome, but they block
runtime/end-to-end acceptance:

- No approved production AI Provider transport or credential boundary exists.
- Real Apps Script runtime and native Sheets behavior are not accepted.
- The repaired Gmail body decode path awaits a separately authorized controlled
  runtime retest; Calendar, trigger, LockService, quota, and end-to-end flows
  remain unaccepted.
- No deployment, pilot, production, or company handoff is authorized.

No local, release, fresh-clone, or CI result may raise this candidate above
`READY_FOR_CONTROLLED_SANDBOX_VALIDATION`.

## Runtime evidence addendum — Work 0027 (2026-08-11)

The sections above remain the canonical machine-bound source/release contract
and are intentionally retained unchanged. Later controlled Works 0019-0026
added separate real-Google evidence on the existing personal-synthetic target;
that evidence does not alter `CURRENT_CONTRACT.json`, release identity, or the
`READY_FOR_CONTROLLED_SANDBOX_VALIDATION` source-contract gate.

Runtime evidence now accepted for synthetic-only data includes:

- Advanced Gmail Service preprocessing through the repaired body decoder;
- authoritative Task creation and persistence;
- Review creation and human `受入` through the canonical installable edit Trigger;
- ordinary manual Task editing through the same authority path;
- post-Setup Quick Diagnostic with zero FAIL and Task Authority Ledger validator PASS;
- dedicated managed Calendar CREATE, UPDATE-in-place, and DELETE on completion.

The managed Calendar lifecycle `CREATE -> UPDATE -> DELETE` has therefore been
proven end to end for one synthetic Task/event pair. Automation remains OFF.

For runtime planning only, the next product boundary is
`READY_FOR_CONTROLLED_PRODUCTION_AI_PROVIDER_INTEGRATION`: implement/configure
one approved production-AI Provider boundary and prove it on grouped synthetic
end-to-end cases while Automation remains OFF. This runtime planning status is
not a replacement for the machine-bound overall status above and does not
authorize company/production data or autonomous processing.

Known non-blocking observations retained deliberately:

- Mock vertical `review_count` can under-count a newly inserted Review Task in
  one lock-free summary path; the Review workflow itself is runtime-proven.
- `VERSION_PROPERTIES` WARN truthfully reflects target version metadata that
  predates the placed `2.8.14-prepilot` candidate and should be refreshed only
  during a controlled future target update.
- `RETRY_DEAD_LETTER_STATE` WARN truthfully reflects retained historical
  synthetic negative-test failures and should not be suppressed merely to make
  diagnostics green.

Remaining blockers before an automated pilot are production-AI Provider
transport, opaque credential reference/storage, policy/authorization readiness,
synthetic real-AI end-to-end proof, and a separate explicit Automation pilot
decision.
