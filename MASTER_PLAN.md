# Master Plan

Last updated: 2026-08-11

Repository: `Tanukitsune-hub/GAS-Project-Schedule`

Current contract: Code `2.8.14-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Source-contract gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

Runtime-evidence status: `READY_FOR_CONTROLLED_PRODUCTION_AI_PROVIDER_INTEGRATION`

## Completed foundation

### Work 0002 — clean integration

Built the clean current candidate, deterministic release packages, local/static/regression verification, fresh-clone checks, and CI evidence without authorizing Google runtime or production use.

### Work 0016 / 0018 — Gmail body decode compatibility repairs

Hardened strict String base64url decoding and Advanced Gmail signed/unsigned byte-sequence decoding while preserving privacy-safe failure behavior, attachment exclusion, truncation limits, and Automation OFF.

## Completed controlled Google runtime chain

Works 0019-0026 used only the existing personal-synthetic target and established the following end-to-end evidence:

1. **0019 — Gmail decoder runtime proof**: one synthetic message reached PREPROCESSED through Advanced Gmail Service; no AI or Calendar call.
2. **0020 — Mock safe Task vertical**: one PREPROCESSED message produced one authoritative Task with deterministic Mock AI and no Calendar API call.
3. **0021 — Review acceptance**: a Review Task was created and human `受入` through the canonical installable edit Trigger automatically closed it into an accepted OPEN Task.
4. **0022 — ordinary manual edit**: one non-Calendar business-field edit persisted through the canonical edit Trigger; Quick Diagnostic retained zero FAIL and Task Authority Ledger validator PASS.
5. **0023 — safe Calendar no-op**: an intentionally/accidentally ineligible no-due Task produced no Outbox job and no Calendar API call, demonstrating fail-safe behavior.
6. **0024 — Calendar CREATE**: one eligible synthetic Task produced exactly one managed all-day deadline event in the dedicated secondary Calendar.
7. **0025 — Calendar UPDATE**: one authoritative due-date change moved the same managed event in place with no duplicate or stale old-date event.
8. **0026 — Calendar DELETE**: completing the Task removed the managed event and left no matching event in the bounded target window.

The managed Calendar lifecycle `CREATE -> UPDATE -> DELETE` is accepted for the current candidate on the synthetic target.

## Work 0027 — integrated runtime re-audit and pilot hardening

Goal: stop per-click/per-commit validation and convert the accumulated runtime evidence into one current product view.

Outcome:

- No source code or release package changes are required before the next boundary.
- `review_count` Mock summary under-counting is retained as non-blocking `FIX SOON`; it should be bundled with the next real source change rather than causing standalone version/release churn.
- `VERSION_PROPERTIES` and `RETRY_DEAD_LETTER_STATE` warnings remain intentionally visible because they describe real target state; diagnostics are not weakened merely to become green.
- Canonical human-readable project status/decisions/context are updated to reflect Works 0019-0026.
- Automation stays OFF.

## Next Work — grouped production-AI Provider integration

The next coherent end-to-end outcome should be one larger Work, not many small Work IDs.

Required-now scope:

1. Select/implement one production-AI Provider transport compatible with the existing provider-neutral AI schema.
2. Use only an opaque credential reference/storage boundary; never store credentials in GitHub or chat.
3. Make production readiness fail closed until provider, auth reference, and policy/approval settings are complete.
4. Keep Automation OFF.
5. Run local/static/regression checks once for the integrated source change.
6. Place the exact updated candidate on the existing synthetic target through the controlled placement path.
7. Refresh version metadata as part of that controlled target update so `VERSION_PROPERTIES` reflects the deployed candidate truthfully.
8. Run a grouped synthetic real-AI end-to-end trial covering at least one safe new Task and one review-required case.
9. Exercise Calendar only if the real-AI cases naturally produce an eligible deadline; do not repeat CREATE/UPDATE/DELETE solely to re-prove unchanged Calendar code.
10. Finish with one bounded Quick Diagnostic and one consolidated GitHub report.

Success status after that Work should mean real production-AI transport has been proven on synthetic data while Automation remains OFF. It must not imply production/company use or autonomous pilot acceptance.

## Following Work — bounded automatic-processing pilot

Only after production-AI integration passes:

- enable the scheduled automation under an explicit bounded pilot decision;
- start with synthetic/personal-safe traffic and small caps;
- verify trigger ownership, quotas/budgets, Gmail search/idempotency, provider failure/retry, Task/Review behavior, Calendar projection, and stop/disable recovery;
- keep an immediate disable path;
- do not broaden to company/production data without a separate authorization decision.

## Release/integration closeout

After the automatic pilot reaches a usable outcome with no BLOCKER:

- reconcile candidate/version/release artifacts;
- update current contract only when source/release identity actually changes and all machine checks remain consistent;
- consolidate/close superseded Draft PRs and stale branches without rewriting historical evidence;
- update README/operator guidance;
- decide the next release/pilot/production/company-handoff gate explicitly.

## Gate discipline

- Automation remains OFF until its dedicated pilot Work.
- No real/company data is authorized by this plan.
- No credential or private identifier belongs in GitHub/chat evidence.
- Existing accepted Gmail/Task/Review/Calendar runtime evidence should not be repetitively re-run unless a material source change affects that boundary.
- Diagnostics must remain truthful; do not suppress safety warnings merely to improve status color.
