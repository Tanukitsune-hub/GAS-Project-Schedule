# GoogleSpreadsheet Implementation Rules

Scope: files under `implementation/GoogleSpreadsheet/`.

These rules supplement the repository root `AGENTS.md`. They intentionally contain only Google Apps Script implementation, validation, and release constraints. Do not duplicate the Core Rules here.

## Sources and Ownership

- Current authored source: `apps-script-v2/`.
- Current source behavior, setup, and declared validation boundary: `apps-script-v2/README.md`.
- Local regression and audit tests: `tests/`.
- Static validation and controlled release tooling: `tools/`.
- Generated or controlled release packages: `release/`.
- Historical plans, instructions, audit reports, and archived artifacts are evidence and provenance, not standing implementation instructions unless the exact handoff names them.
- Fix source defects in `apps-script-v2/` and regenerate affected packages. Do not treat a manual edit to a release package as the formal fix.

## Apps Script Compatibility and Architecture

- Deployed `.gs` source and `appsscript.json` must remain compatible with Google Apps Script V8 and the enabled Apps Script services.
- Node.js, filesystem, process, module-loader, and other local-runtime APIs may be used only in clearly separated tests and tools; do not leak them into deployed source.
- Preserve the existing responsibility boundaries among configuration/schema, setup and migrations, repositories, Gmail gateway, AI adapter, task review policy, Calendar synchronization, edit handling, triggers, retry/dead-letter handling, diagnostics, dashboard, and worker orchestration.
- Preserve bounded execution, idempotency, durable checkpoints, state-machine validity, retry accounting, stale-write prevention, and fail-closed recovery.
- Keep Task authority, snapshots, row/business versions, compare-and-set guards, Calendar intent/outbox behavior, and lock/lease scopes internally consistent.
- Do not add external providers, broader scopes, automatic trigger enablement, or production transport merely because interfaces exist.

## Privacy and External-Action Guardrails

- Use synthetic, redacted, or local-fake evidence by default.
- Do not persist or report message bodies, subjects, senders, raw Gmail/Calendar identifiers, credentials, provider requests/responses, account details, private URLs, or personal data.
- No live Gmail, Calendar, Sheets, Drive, Apps Script, OAuth, Cloud, trigger, or provider action is authorized without an exact handoff naming the bounded target and action.
- Do not retry, fall back, switch targets, deploy, or perform follow-up diagnostics after an authorized external action unless those actions are also explicitly authorized.
- Keep `TEST_MODE`, automation state, kill switches, permission checks, and provider prerequisites fail-closed.

## Versions, Schemas, and Release Packages

- Update code, schema, AI-schema, migration, manifest, README, CHANGELOG, and release metadata together when a material deliverable change requires it.
- Do not bump versions, create backups, or regenerate releases for a documentation-only or repository-policy change unless the affected contract requires it.
- Never skip required migrations or silently re-baseline incompatible live state.
- Build a release package only through the exact version-specific script and parameters identified by the current authorized handoff.
- Preserve source commit, release content commit, checksums, source parity, `TEST_MODE`, automation state, and Test Harness inclusion/exclusion claims.
- Do not declare Phase 8B/8C/8D, pilot, company rollout, or production readiness from source or local-test success alone.

## Exact Local Commands

Run from the repository root unless an exact handoff says otherwise.

- Targeted test: `node implementation/GoogleSpreadsheet/tests/<test-file>.js`.
- Static validator: `node implementation/GoogleSpreadsheet/tools/validate_apps_script_v2.js`.
- Full regression: no single canonical wrapper is established. Run every test file and special gate required by the current handoff, current status, or audit plan, and report the observed aggregate PASS/FAIL/SKIPPED result.
- Release builder: use the named script under `implementation/GoogleSpreadsheet/tools/`; never infer a release command from an older version.

Do not claim a test, release parity check, provider check, or native Workspace behavior passed unless it was actually executed and observed.

## Change-Based Validation

| Change | Minimum validation |
|---|---|
| Repository policy or documentation only | Diff, path, reference, status, and instruction-scope review |
| Isolated source logic | Focused local test plus static validator |
| Schema, Task authority, migration, trigger, retry, lock, or recovery | Focused negative/failure-injection tests plus affected integration suites and static validation |
| Cross-subsystem worker change | Affected regression suites, idempotency/retry checks, and bounded-execution review |
| Release package | Version-specific build, checksum, source parity, manifest, and gate review |
| Live Workspace/provider behavior | Separately authorized managed validation; otherwise report `NOT EXECUTED` |

## Review and Completion

- Treat privacy leaks, permission broadening, automation-on defaults, silent authority repair, partial-write exposure, stale-write acceptance, duplicate external side effects, and false readiness claims as blockers.
- Keep existing behavior outside the approved scope; do not use broad cleanup or file reorganization to satisfy a focused task.
- Completion requires source, applicable tests, schemas/versions, release metadata, and canonical status to agree for the changed boundary.
- Report exact checks and results. Elapsed time and token usage are not required unless the user explicitly requests them.
