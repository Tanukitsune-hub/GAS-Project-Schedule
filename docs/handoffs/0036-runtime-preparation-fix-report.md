# Work 0036 Runtime-Preparation-Fix Completion Report

## Outcome

`BLOCKER: NONE`

The production preparation caller defect was repaired, validated, regenerated,
and placed as one fresh Phase 8C replacement on the same existing
personal-synthetic Apps Script target. The highest permitted status is:

`READY_FOR_USER_PERSONAL_AUTOMATION_E2E`

Automation remains OFF. Codex did not execute preparation, readiness,
enablement, disablement, any Apps Script function, Gmail processing, Gemini,
Task/Review, Calendar, trigger mutation, Setup, diagnostics, or the
user-controlled Automation E2E.

## References and preserved evidence

- Runtime-fix instruction ref:
  `90ad3a65155cc2f765de439f9b31e73707c0613d`
- Runtime-fix instruction:
  `docs/handoffs/0036-runtime-preparation-fix-instruction.md`
- Mandatory addendum:
  `docs/handoffs/0036-runtime-preparation-fix-addendum.md`
- Historical reports `docs/handoffs/0036-report.md` and
  `docs/handoffs/0036-review-fix-report.md`: preserved unchanged
- Starting main: `4c28231dc08dc89ee7a529cb0a6192325263c810`
- Source repair commit: `0f0b7eab0ed27b883ae25fb15af4371b42157662`
- Release regeneration commit: `3a4c053ba9775659d5bb902ff0f7cd0bcffba531`
- Pre-placement tooling head: `dab94362c34e837bb236186ace7c0cf9c0f63e40`
- Branch: `codex/0036-personal-automation-qualification`
- Draft PR: `#51`, kept Draft/Open/Unmerged

The frozen Code `2.8.20-prepilot` recovery packages and historical evidence
were preserved. The current candidate remains Code `2.8.21-prepilot`, Schema
`2.6`, AI Schema `2.0`, Migration `3`, with Automation OFF.

## Root cause and minimal repair

The live preparation attempt stopped fail-closed with the bounded error:

`WorkOsAppError: Automation依存注入はTest modeだけで利用できます。`

The production no-argument caller in `02_Setup.gs` was passing
`{properties, script_app}` into `WorkOsAutomation.getDiagnosticAutomationStatus()`.
Phase 8C correctly rejects non-empty dependency injection through
`E_TEST_MODE_DISABLED`. The repair changes only the caller boundary:

- `TEST_MODE=true`: the existing injected call remains available for local
  tests and fakes;
- `TEST_MODE=false`: the caller invokes
  `WorkOsAutomation.getDiagnosticAutomationStatus()` with no arguments.

`WorkOsAutomation.injected()` and its production guard were not weakened.

The focused regression proves production-shaped no-argument preparation,
Test-mode dependency injection, guard preservation, Setup/schema/migration
requirements, Automation-OFF and zero-clock-trigger checks, idempotency,
bounded metadata writes, and absence of Gmail body, Gemini, Calendar, trigger,
credential-value, or business-data side effects.

## Candidate and release evidence

- Phase 8B: `TEST_MODE=true`, test harness included, Automation OFF
- Phase 8C: `TEST_MODE=false`, test harness excluded, Automation OFF
- Canonical source payload: 23 `.gs` files plus `appsscript.json`
- Phase 8B package payload: 24 files
- Phase 8C package payload: 23 files
- Source inventory SHA-256:
  `9df7bd1e229f2afecfc2cdfd56332d936577de32e5a1acfc9323f448fca4a5f1`
- Phase 8B bundle SHA-256:
  `10e9567b6e88b98673c90098fa2e20217412a62fdea1c2d75b6d2eb368648dcc`
- Phase 8C bundle SHA-256:
  `7572956b97e4548683c3be79670d1eb8e27023c1a04f5f9af5513ff983b50d51`

The release builders and verifiers passed source parity, checksums, secret
scan, Phase 8C production transform, Automation-OFF checks, provenance, and
historical 2.8.20 preservation. The current contract, manifests, checksums,
source, and releases agree on the same candidate.

## Local validation

- Focused Work 0036 qualification suite: 23/23 PASS
- Work 0004 existing target-bootstrap suite: 20/20 PASS
- Work 0006 existing target-bootstrap suite: 22/22 PASS
- Work 0036 review-fix placement suite: 24/24 PASS
- Complete deterministic regression inventory: 78 suites, missing 0, extra 0
- `node tools/validate_apps_script_v2.js`: PASS
- `pnpm run verify:local`: 11/11 PASS
- Release verifiers: Phase 8B and Phase 8C PASS
- A21/B21/current runtime-fix lineage: PASS
- Historical 2.8.20 preservation: PASS
- Secret/local-state scan: PASS, zero hits
- `git diff --check`: PASS
- Project-local clasp: 3.3.0
- Existing clasp authorization: READY, identity suppressed
- Git identity, Node, pnpm, and GitHub auth: CONFIGURED/READY

All local validation was non-Google. Live runtime checks remained
`NOT_EXECUTED`.

The pre-placement push and PR CI runs for head
`dab94362c34e837bb236186ace7c0cf9c0f63e40` were both SUCCESS before the
replacement began.

## Existing-target replacement and parity

The fresh runtime-preparation lane is distinct from both consumed historical
lanes:

- `.clasp-work-0036-runtime-preparation-fix/`
- `.clasp-pull-verify-work-0036-runtime-preparation-fix/`
- schema: `WORK_OS_PERSONAL_AUTOMATION_RUNTIME_PREPARATION_FIX_REPLACEMENT_V1`

The consumed `.clasp-work-0036/` and `.clasp-work-0036-review-fix/` states were
read only as historical evidence. No new target, account, auth profile,
Spreadsheet, Apps Script project, deployment, Cloud project, OAuth client, or
credential was created or changed; the existing target received only the one
authorized source update described below.

Immediately before the external sequence, the actual project-local clasp
eligibility gate passed:

- eligible files: 23;
- `.gs` files: 22;
- `appsscript.json`: 1;
- missing: 0;
- extra: 0;
- `scriptExtensions`: `[".gs", ".js"]`;
- preferred pull script extension: `.gs`;
- exact canonical `.claspignore` allowlist: PASS;
- staged payload inventory SHA-256:
  `a1aefaa64aa575844c6e7e33241e914cb77f10eaf297c654e1827a267070222c`.

The authorized external sequence completed exactly once per operation:

| Operation | Attempts | Result |
|---|---:|---|
| Guarded Phase 8C source update/push | 1 | PASS; semantic update-content evidence, 23 files, 22 `.gs`, 1 manifest, missing 0, extra 0 |
| Independent isolated pull-back | 1 | PASS; 23 files, 22 `.gs`, 1 manifest, missing 0, extra 0 |
| Pull-back byte/hash parity | 1 | PASS; inventory SHA-256 matched exactly |

The final fresh state is `PULL_PARITY_PASS` with push counter 1 and pull
counter 1. No retry, fallback, target inspection, runtime function, Gmail,
Gemini, Calendar, trigger, Setup, diagnostic, or Automation action followed
the placement.

## Independent review and delivery

An independent standard Codex subagent performed a read-only final audit of
the production/Test-mode boundary, source and release consistency, frozen
2.8.20 preservation, fresh placement state, pull-back parity, historical-state
non-reuse, privacy boundaries, and absence of runtime operations. No blocker
was reported.

Active status, plan, decision, README, and user-runbook records were updated
after the observed validation. The final report-head GitHub Actions CI is the
publication gate for this report; its SUCCESS, exact final head, and the
Draft/Open/Unmerged PR state are recorded in PR `#51` after push. No merge was
performed.

The next action is a separately authorized user-controlled personal Automation
E2E under the dedicated runbook. It must remain limited to one fresh exact
synthetic fixture; ordinary personal Inbox mail remains out of scope.
