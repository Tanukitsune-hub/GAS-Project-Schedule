# Decisions

Last updated: 2026-08-19

This file records active decisions for Code `2.8.22-prepilot`, with frozen
2.8.20 and 2.8.21 recovery baselines. Historical handoffs, reports, releases,
and audit records remain immutable evidence.

Current candidate machine gate: `READY_FOR_USER_PERSONAL_SHADOW_PILOT`

Current ChatGPT review disposition:
`READY — LABEL_GATED_PERSONAL_SHADOW_PILOT_IMPLEMENTED`

## D-068: Work 0037 is label-gated personal shadow pilot

Code `2.8.22-prepilot` admits scheduled Gmail processing only when an Inbox
message has the human-owned `手動/取込` label and does not have `手動/除外`.
Spam, trash, and ordinary unlabeled Inbox mail are excluded. The scheduled
source mode is `AUTOMATIC_PILOT`, the run bound is one message per five-minute
interval, and Automation remains OFF until the later user-controlled pilot.
The manual worker fails closed while pilot Automation is active so the two
entrypoints cannot ambiguously own the same candidate pool.

## D-048: one active candidate

Work 0036 is the active Code `2.8.21-prepilot` with A21/B21. Work 0035
materialized the qualified 2.8.20 tree cleanly onto current `main`; older
stacked branches and releases are historical, not current selectors.

## D-049: the Task ledger is the trust anchor

Task authority requires a valid durable 21-column ledger record with committed
generation, canonical hash, and physical-row binding. A visible row, snapshot,
or note cannot create or restore authority.

## D-050: Calendar follows durable Task intent

Calendar is a derived projection of versioned Task intent. Enqueue,
acknowledgement, authority loss, and compensation remain fail-closed and
recoverable.

## D-051: diagnostics are read-only

Quick and Deep Diagnostics emit bounded evidence and do not repair data.

## D-052: one non-Google CI gate

The repository CI installs locked dependencies and runs the complete local gate
with read-only repository permission. It cannot access credentials or Google
Workspace state.

## D-053: deterministic release lineage

Phase 8B retains `TEST_MODE=true`, the test harness, provider-readiness flags
disabled, and Automation OFF. Phase 8C applies the audited production transform:
`TEST_MODE=false`, test-harness exclusion, and only the bounded external-provider
readiness flags explicitly listed by the 2.8.21 builder. Automation remains OFF
and the legacy company-approval compatibility alias remains false.

Historical B20 is a direct child of A20. The 2.8.21 A21/B21 lineage and current
release regeneration preserve historical 2.8.20 package bytes.

## D-054: strict Gmail body decoding

String and bounded byte-sequence body representations remain strictly decoded.
Malformed input fails closed as privacy-safe `E_GMAIL_BODY_DECODE`.

## D-056: historical release identities

Work 0018 is Code `2.8.14-prepilot` with A14/B14. Work 0028 is Code
`2.8.15-prepilot` with A15/B15. Work 0029 remains Code `2.8.16-prepilot`
with A16/B16. Work 0030 remains Code `2.8.17-prepilot` with A17/B17. Work
0031 remains Code `2.8.18-prepilot` with A18/B18. Work 0032 remains Code
`2.8.19-prepilot` with A19/B19. Work 0033 remains the frozen historical Code
`2.8.20-prepilot` with A20/B20. These identities are not overwritten.

## D-057: Gemini remains explicitly bounded

The Gemini provider uses the compatibility projection of AI Schema 2.0,
`thinking_level=low`, `thinking_summaries=none`, and one strict final output.
No tools, streaming, background execution, fallback provider, or raw thought
retention is permitted.

## D-058: Automation is fail-closed

Automation requires explicit enablement, complete prerequisites, one canonical
time trigger, matching enabled and desired state, and a canonical trigger UID at
run time. Otherwise it refuses work without calling external services.

## D-064: personal Gemini E2E passed; 2.8.20 is the recovery baseline

The user-controlled fresh synthetic E2E completed with one Task, one Review,
zero errors, zero Calendar jobs, checkpoint `DONE`, and Automation OFF. This
freezes 2.8.20 as the known-good manual-plus-Gemini recovery point.

## D-065: clean main integration precedes Automation work

Work 0035 preserves current-main governance, exact 2.8.20 product and release
bytes, and a canonical validation gate that works after the branch becomes
`main`. Superseded Draft PR branches and historical evidence remain retained.

## D-066: the next deployment boundary is personal Automation only

No company-PC or company-environment rollout is planned. Controlled Automation
qualification occurs in the same personal Google Workspace environment,
beginning OFF and using synthetic mail. Newsletter and Calendar-generated
notification mail remain excluded from automatic task creation unless a later
evidence-backed decision explicitly changes that policy.

Automation is not considered ready merely because `enableAutomation()` exists.
Completion requires truthful readiness, exactly one canonical trigger,
unattended synthetic Inbox → Gemini → Task/Review processing, separately
authorized Calendar behavior where applicable, and verified disable cleanup.
Real personal mail remains out of scope until those checks pass.

## D-067: Work 0036 is synthetic-only personal Automation qualification

Code `2.8.21-prepilot` is the direct A21/B21 successor of frozen Code
`2.8.20-prepilot`. Automatic discovery is restricted to the exact
`[WORK_OS_AUTOMATION_SYNTHETIC_0036]` subject and normalized fixture body,
with a maximum of one fresh Message per run. Personal owner/operator approval
replaces active company wording; independent data, credential-storage,
credential/auth, OAuth/service, target, and trigger gates remain fail-closed.
Automation stays OFF until a later explicit user action, and no ordinary
personal mail is admitted by this candidate.

## D-068: readiness repair completed before the user E2E

Final ChatGPT review of the original Work 0036 completion found that
`getPersonalAutomationQualificationStatus()` could report
`READY_FOR_CONTROLLED_QUALIFICATION` from Automation-OFF state alone while
production AI, Setup/version, formal-label, Calendar, credential, or OAuth
prerequisites remained unready. The function also reported formal labels and
Calendar as `NOT_CHECKED`.

The review-fix now evaluates the complete read-only prerequisite boundary used
by `enableAutomation()`, returns bounded reason/details fields, and exposes a
confirmed menu path to the existing idempotent preparation action. The actual
enable path remains fail-closed, Automation remains OFF, and no ordinary-Inbox
or runtime permission was broadened.

Work 0036 remains the same outcome and Work ID. Its repaired candidate is now
at `READY_FOR_USER_PERSONAL_AUTOMATION_E2E` after local gates, deterministic
2.8.21 release verification, one fresh replacement placement, one pull-back
parity check, final CI, and independent review. The user E2E itself remains a
separate explicit action and real personal mail remains out of scope.

## D-069: production preparation caller repair is complete

The live Work 0036 preparation stop was caused by the production caller passing
an injected options object into the Automation status boundary. The caller now
uses the real no-argument status path when `TEST_MODE=false`; Test-mode
dependency injection remains available and `E_TEST_MODE_DISABLED` remains
fail-closed. Code `2.8.21-prepilot` Phase 8B/8C was regenerated and verified,
and one fresh guarded Phase 8C replacement plus one independent pull-back
reached exact 23-file parity on the same existing personal-synthetic target.
Automation remains OFF. The user-controlled synthetic E2E is still a separate
explicit action; ordinary personal Inbox mail and production rollout remain
out of scope.
