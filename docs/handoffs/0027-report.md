# Work 0027 Report — Integrated Runtime Re-audit and Pilot Hardening

## Result

- Status: `READY_FOR_CONTROLLED_PRODUCTION_AI_PROVIDER_INTEGRATION`
- BLOCKER: `NONE`
- Route: `A — ChatGPT-only`
- Candidate: Code `2.8.14-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- Machine source-contract gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`
- Apps Script/source/release package changes: `NONE`
- `CURRENT_CONTRACT.json` changes: `NONE`
- Automation: `OFF`
- Production/external AI: not configured/accepted

## Outcome

Work 0027 consolidates the accepted synthetic Google-runtime evidence from
Works 0019-0026 and performs the requested pilot-hardening review without
creating unnecessary source/version/release churn.

The audit found no source-code change required before the next product boundary.
The existing Gmail/Task/Review/manual-edit/Calendar behavior is sufficiently
proven on synthetic data to proceed to one grouped production-AI Provider
integration Work while Automation remains OFF.

## Runtime evidence accepted

- Advanced Gmail Service preprocessing through the repaired dual-representation
  body decoder.
- Authoritative Task creation and persistence.
- Deterministic Mock Task creation without external AI/network access.
- Review-required Task creation and human `受入` through the canonical
  installable edit Trigger.
- Ordinary manual Task-field persistence through the same authority path.
- Post-Setup Quick Diagnostic with zero FAIL and Task Authority Ledger validator
  PASS.
- Managed dedicated Calendar CREATE.
- Managed Calendar UPDATE in place after one due-date edit with no duplicate.
- Managed Calendar DELETE after Task completion with no matching event left in
  the bounded target window.

The Calendar lifecycle `CREATE -> UPDATE -> DELETE` is therefore accepted for
one synthetic managed Task/event pair.

## Hardening decisions

### Mock `review_count`

One lock-free Mock vertical summary path can under-count a newly inserted
Review Task. The Review workflow itself is runtime-proven.

Classification: `FIX SOON`, non-blocking.

Decision: bundle the counter fix and focused regression test with the next
coherent source-change Work instead of creating a standalone release/version
cycle.

### `VERSION_PROPERTIES` warning

The warning is truthful because Setup-stored target metadata predates the
current placed `2.8.14-prepilot` candidate.

Classification: non-blocking before production-AI integration.

Decision: keep the diagnostic strict and refresh version metadata during the
next controlled target update.

### `RETRY_DEAD_LETTER_STATE` warning

The warning is truthful because controlled historical synthetic Gmail-decode
failures remain retained.

Classification: non-blocking historical synthetic state.

Decision: do not suppress the warning or delete failure evidence solely to make
diagnostics green. Cleanup/retention requires a separate explicit decision.

## Canonical-document hardening

The Work 0018-era machine source-contract wording is intentionally retained in
canonical documents because repository tests and `CURRENT_CONTRACT.json` bind
that contract to `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`.

Work 0027 appends a separate runtime-evidence layer instead of overwriting that
machine contract. This avoids falsely converting runtime evidence into a new
release/deployment gate.

Updated in one documentation commit:

- `CURRENT_STATUS.md`
- `PROJECT_CONTEXT.md`
- `MASTER_PLAN.md`
- `DECISIONS.md`
- `docs/handoffs/0027-report.md`

No Apps Script source, tests, manifest, generated release package, schema,
migration, or machine-bound current contract is changed.

## Why Codex was not used

The material Work was repository inspection, runtime-evidence reconciliation,
known-observation classification, and safe canonical-document updates. No
local/runtime-only implementation or executable debugging remained after the
decision to avoid unnecessary source churn. Route A was sufficient and faster.

## Validation

- Root and nested repository rules inspected.
- Work 0026 authoritative report head and successful CI inspected.
- Current machine contract and canonical documents inspected.
- Mock review summary behavior inspected in `18_Worker.gs`.
- Diagnostic warning behavior inspected in `16_Diagnostics.gs`.
- Calendar terminal/managed-event policy rechecked in `10_CalendarSync.gs`.
- Repository branch-policy and canonical-document regression expectations
  inspected after an initial non-authoritative governance-only CI failure.
- Corrected Work 0027 final-head CI is required as the completion check and is
  recorded on the Draft PR, not by adding another commit.

## Remaining blockers before an automated pilot

- approved production-AI Provider transport;
- opaque credential reference/storage boundary;
- production-AI policy/authorization readiness;
- grouped synthetic real-AI end-to-end proof;
- separate explicit automatic-processing pilot acceptance.

## Next Work

Use one grouped source-change Work for production-AI Provider integration.
Include the deferred Mock `review_count` observability fix, run local/CI checks
once, update the synthetic target once, refresh target version metadata, and
exercise a small grouped synthetic real-AI end-to-end trial while Automation
remains OFF.

Do not repeat the full Calendar lifecycle unless that source change materially
affects Calendar logic.
