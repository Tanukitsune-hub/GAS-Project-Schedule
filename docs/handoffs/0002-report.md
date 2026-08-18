# Work 0002 — Clean v2.8.12 Integration Candidate Report

## Outcome

Work 0002 produced one linear, reviewable Code `2.8.12-prepilot`
integration candidate from exact starting main
`e2a7c683a7c0f7f1a865aec89a9e24ec56f830da`.

```text
WORK_ID: 0002
STATUS: READY_FOR_CONTROLLED_SANDBOX_VALIDATION
BLOCKER: NONE
CODE_VERSION: 2.8.12-prepilot
SCHEMA_VERSION: 2.6
AI_SCHEMA_VERSION: 2.0
MIGRATION_VERSION: 3
AUTOMATION: OFF
ACTIVE_TRANSFER: NONE
ACTIVE_DEPLOYMENT: NONE
LIVE_GOOGLE_ACCEPTANCE: NOT_EXECUTED
REAL_AI_PROVIDER: NOT_IMPLEMENTED / DEFERRED
```

This status is limited to the local, release, fresh-clone, and CI integration
outcome. It is not Phase 8B overall acceptance, Phase 8C GO, pilot,
production, company handoff, runtime acceptance, or end-to-end acceptance.

## Starting point and selective-port strategy

- Starting main: `e2a7c683a7c0f7f1a865aec89a9e24ec56f830da`
- Instruction commit: `cc7112612d03f810d9743e2279d38711a866d581`
- Product donor inspected: `8596b1dd1b84eacd7abdd141c819ab9de3a8dc5a`
- Locked validation/CI donor inspected:
  `5daf04ddbb443f482b490905b48c3b1799da7641`
- Latest cumulative/fail-closed tooling donor inspected:
  `5a80ae1eb4d887356c1ddee0899a08a372de7ac8`
- Historical fixed lineage inspected: Source A11.1
  `aeca148415d70df625400e53d2281378adff60b4`, Release B11
  `952438907e1a09092a46127dc130b3403a911db4`, Fixed T11
  `a3b5a5d8d851bf2d15a2738c54dc6bb31e231d33`
- Risk register inspected: audit
  `1346faa09c06694e2f567ebae88f996f03a7b990`

The stacked donor branches were not merged, rebased, or cherry-picked
wholesale. Final source behavior, executable tests, locked local tooling, CI,
and active documents were selected directly. Historical release, transfer,
archive, audit, and runtime-evidence trees were not imported or rewritten.
Root `AGENTS.md` and `.codex/**` remain byte-identical to starting main.

## Changed files, grouped by scope

The following is the exact active-path change inventory from starting main to
Release B12. The generated package inventories are expressed as exact root
files plus their exact payload sets.

### Source and source-adjacent documentation

- `implementation/GoogleSpreadsheet/apps-script-v2/00_Config.gs`
- `implementation/GoogleSpreadsheet/apps-script-v2/01_TypesAndSchemas.gs`
- `implementation/GoogleSpreadsheet/apps-script-v2/02_Setup.gs`
- `implementation/GoogleSpreadsheet/apps-script-v2/03_SheetBuilder.gs`
- `implementation/GoogleSpreadsheet/apps-script-v2/08_TaskRepository.gs`
- `implementation/GoogleSpreadsheet/apps-script-v2/10_CalendarSync.gs`
- `implementation/GoogleSpreadsheet/apps-script-v2/11_EditHandler.gs`
- `implementation/GoogleSpreadsheet/apps-script-v2/14_Migrations.gs`
- `implementation/GoogleSpreadsheet/apps-script-v2/15_Dashboard.gs`
- `implementation/GoogleSpreadsheet/apps-script-v2/16_Diagnostics.gs`
- `implementation/GoogleSpreadsheet/apps-script-v2/17_Utilities.gs`
- `implementation/GoogleSpreadsheet/apps-script-v2/18_Worker.gs`
- `implementation/GoogleSpreadsheet/apps-script-v2/99_TestHarness.gs`
- `implementation/GoogleSpreadsheet/apps-script-v2/Menu.gs`
- `implementation/GoogleSpreadsheet/apps-script-v2/CHANGELOG.md`
- `implementation/GoogleSpreadsheet/apps-script-v2/README.md`

### Tests

- `implementation/GoogleSpreadsheet/tests/canonical_document_consistency_test.js`
- `implementation/GoogleSpreadsheet/tests/ci_workflow_contract_test.js`
- `implementation/GoogleSpreadsheet/tests/local_clasp_validation_gate_test.js`
- `implementation/GoogleSpreadsheet/tests/local_validation_gate_pr_merge_scope_test.js`
- `implementation/GoogleSpreadsheet/tests/local_validation_secret_scan_test.js`
- `implementation/GoogleSpreadsheet/tests/phase1_audit_test.js`
- `implementation/GoogleSpreadsheet/tests/phase1_local_test.js`
- `implementation/GoogleSpreadsheet/tests/phase2_local_test.js`
- `implementation/GoogleSpreadsheet/tests/phase3_independent_test.js`
- `implementation/GoogleSpreadsheet/tests/phase3_local_test.js`
- `implementation/GoogleSpreadsheet/tests/phase4_harness_local_test.js`
- `implementation/GoogleSpreadsheet/tests/phase4_independent_test.js`
- `implementation/GoogleSpreadsheet/tests/phase4_local_test.js`
- `implementation/GoogleSpreadsheet/tests/phase4_performance_test.js`
- `implementation/GoogleSpreadsheet/tests/phase5_harness_local_test.js`
- `implementation/GoogleSpreadsheet/tests/phase5_schema_extension_test.js`
- `implementation/GoogleSpreadsheet/tests/phase5_worker_integration_test.js`
- `implementation/GoogleSpreadsheet/tests/phase6_harness_local_test.js`
- `implementation/GoogleSpreadsheet/tests/phase6_local_test.js`
- `implementation/GoogleSpreadsheet/tests/phase6_worker_integration_test.js`
- `implementation/GoogleSpreadsheet/tests/phase7_harness_local_test.js`
- `implementation/GoogleSpreadsheet/tests/phase7_local_test.js`
- `implementation/GoogleSpreadsheet/tests/phase7_recovery_integration_test.js`
- `implementation/GoogleSpreadsheet/tests/phase7_schema_extension_test.js`
- `implementation/GoogleSpreadsheet/tests/phase8b_dashboard_number_format_real_runtime_test.js`
- `implementation/GoogleSpreadsheet/tests/phase8b_dashboard_surface_real_runtime_test.js`
- `implementation/GoogleSpreadsheet/tests/phase8b_module_version_skew_test.js`
- `implementation/GoogleSpreadsheet/tests/phase8b_quick_diagnostic_real_runtime_test.js`
- `implementation/GoogleSpreadsheet/tests/phase8b_setup_ledger_visibility_test.js`
- `implementation/GoogleSpreadsheet/tests/phase8b_t1_01_bounded_acceptance_summary_test.js`
- `implementation/GoogleSpreadsheet/tests/prepilot_calendar_cas_failure_injection_test.js`
- `implementation/GoogleSpreadsheet/tests/prepilot_cas_failure_injection_test.js`
- `implementation/GoogleSpreadsheet/tests/prepilot_dashboard_safety_test.js`
- `implementation/GoogleSpreadsheet/tests/prepilot_provider_failure_accounting_test.js`
- `implementation/GoogleSpreadsheet/tests/prepilot_worker_concurrency_test.js`
- `implementation/GoogleSpreadsheet/tests/remediation_round3_provenance_test.js`
- `implementation/GoogleSpreadsheet/tests/remediation_round3_test.js`
- `implementation/GoogleSpreadsheet/tests/remediation_round4_test.js`
- `implementation/GoogleSpreadsheet/tests/remediation_round5_test.js`
- `implementation/GoogleSpreadsheet/tests/remediation_runtime_dashboard_reliability_test.js`

### Tools and locked local dependency contract

- `implementation/GoogleSpreadsheet/package.json`
- `implementation/GoogleSpreadsheet/pnpm-lock.yaml`
- `implementation/GoogleSpreadsheet/tools/build_v2_8_12_phase8c_release.ps1`
- `implementation/GoogleSpreadsheet/tools/build_v2_8_12_release.ps1`
- `implementation/GoogleSpreadsheet/tools/local_clasp_dev.js`
- `implementation/GoogleSpreadsheet/tools/local_validation_gate.js`
- `implementation/GoogleSpreadsheet/tools/validate_apps_script_v2.js`
- `implementation/GoogleSpreadsheet/tools/verify_v2_8_12_phase8c_release.ps1`
- `implementation/GoogleSpreadsheet/tools/verify_v2_8_12_release.ps1`
- `implementation/GoogleSpreadsheet/tools/v2_8_12/DEPLOYMENT_MANIFEST.template.md`
- `implementation/GoogleSpreadsheet/tools/v2_8_12/MANUAL_ACCEPTANCE_GUIDE.md`
- `implementation/GoogleSpreadsheet/tools/v2_8_12/SANDBOX_QUICKSTART.md`

### CI, current contract, and active documents

- `.gitattributes`
- `.github/workflows/ci.yml`
- `.gitignore`
- `CURRENT_CONTRACT.json`
- `CURRENT_STATUS.md`
- `DECISIONS.md`
- `MASTER_PLAN.md`
- `PROJECT_CONTEXT.md`
- `README.md`
- `docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`
- `docs/R4_VERIFICATION_MATRIX.md`
- `docs/TASK_AUTHORITY_PROTOCOL.md`
- `docs/handoffs/0002-instruction.md`
- `docs/visualizations/GoogleWorkspace_v2_Workflow_Overview.html`
- `docs/visualizations/index.html`
- `implementation/GoogleSpreadsheet/docs/TASK_AUTHORITY_PROTOCOL.md`
- `implementation/GoogleSpreadsheet/docs/V2_MANUAL_ACCEPTANCE_GUIDE.md`
- `implementation/GoogleSpreadsheet/docs/V2_REQUIREMENTS_TRACEABILITY.md`
- `implementation/GoogleSpreadsheet/visualizations/task_authority_protocol_v2_8_12.html`

### Generated release and reports

- `implementation/GoogleSpreadsheet/WORK_0002_RELEASE_IMPLEMENTATION_REPORT.md`
- `docs/handoffs/0002-report.md` (this final evidence report)
- Phase 8B root:
  `implementation/GoogleSpreadsheet/release/v2.8.12-prepilot/`
  with `CHECKSUMS.sha256`, `DEPLOYMENT_MANIFEST.md`,
  `MANUAL_ACCEPTANCE_GUIDE.md`, and `SANDBOX_QUICKSTART.md`
- Phase 8C root:
  `implementation/GoogleSpreadsheet/release/v2.8.12-prepilot-phase8c/`
  with `CHECKSUMS.sha256`, `DEPLOYMENT_MANIFEST.md`, and
  `PHASE8C_SANDBOX_GUIDE.md`
- Shared exact payload under each package's `apps-script/` directory:
  `00_Config.gs`, `01_TypesAndSchemas.gs`, `02_Setup.gs`,
  `03_SheetBuilder.gs`, `04_MessageStateRepository.gs`,
  `05_GmailGateway.gs`, `06_EmailPreprocessor.gs`, `07_AiAdapter.gs`,
  `08_TaskRepository.gs`, `09_TaskReviewPolicy.gs`, `10_CalendarSync.gs`,
  `11_EditHandler.gs`, `12_Triggers.gs`, `13_LogAndDeadLetter.gs`,
  `14_Migrations.gs`, `15_Dashboard.gs`, `16_Diagnostics.gs`,
  `17_Utilities.gs`, `18_Worker.gs`, `19_RuntimeSettings.gs`, `Menu.gs`,
  and `appsscript.json`
- Phase 8B-only payload: `apps-script/99_TestHarness.gs`

## What was integrated and deliberately omitted

Ported behavior includes the two-slot Task authority ledger and generation/hash
contract, fail-closed recovery without editable-row/snapshot self-authorization,
row-level restore/quarantine for multi-row edits, canonical Task ID/header
restoration, durable Calendar intent/outbox recovery, Dashboard ownership and
flush/reacquire/readback checks, bounded diagnostic summaries, and the existing
Gmail, Review/CAS, retry/dead-letter, privacy, and Automation-OFF controls.

The local validation path was rewritten into one locked gate covering tracked
JSON/YAML, payload inventory, the real `.gs` source, all current Node suites,
release verification, A12/B12 lineage, secret/identifier/local-path scan, and
worktree cleanliness. CI is non-Google, credential-free, read-only, and runs on
push and pull request.

An in-scope CI defect was found after the first package head: GitHub's
pull-request synthetic merge checkout was incorrectly classified as a donor
merge. The gate now validates the exact GitHub pull-request context, checks the
expected head ref, selects the synthetic merge's second parent, and still
rejects a merge in the actual PR-head history. A real temporary-Git regression
covers the allowed merge ref, wrong head ref, and merge-in-head rejection.

No production Provider, credential, real identifier, target URL, transfer,
deployment, Automation enablement, Google operation, broad refactor, dependency
upgrade, historical rewrite, or company-PC artifact was added. The Phase 8C
package retains only the accepted `TEST_MODE: true` to `TEST_MODE: false`
transformation and excludes the test harness; it makes no runtime GO claim.

## Commit and ancestry record

```text
e2a7c683a7c0f7f1a865aec89a9e24ec56f830da  starting main
  ... linear selective integration commits ...
d3f93e05e77a3cdccf24c5a5b7d8def452155841  Source A12
0b655e6df51d7ac56c1936fb57331e03516ebe0c  Release B12 (direct child of A12)
SELF                                      final report/evidence commit
```

Source A12 contains no `CURRENT_CONTRACT.json`, current v2.8.12 release tree,
or release implementation report. Release B12 changes exactly 54 allowed
contract/generated-release/report files. No merge commit occurs after starting
main, and B12 is an ancestor of the final report commit.

## Validation evidence

### Deterministic build and local gate

- `pnpm install --frozen-lockfile`: PASS using the committed lockfile.
- `pnpm run verify:local` at exact B12 in a clean LF checkout: PASS, 11/11
  sections, 51/51 current `*_test.js` suites, 22 `.gs` source files, 23 payload
  files, two release verifiers, valid A12/B12 lineage, and 0 secret-scan hits
  across 443 tracked files.
- `node tests/remediation_round4_test.js`: PASS 20/20, including authority
  partial-write recovery, no editable fallback, multi-row peer restore and
  quarantine, canonical header restore, Calendar recovery, and redacted audit.
- `node tests/remediation_round5_test.js`: PASS 11/11, including canonical
  ledger hashing, authority exclusion, row rebind, bounded ledger reads,
  protection/hidden contract, and Calendar outbox cancellation.
- `node tests/local_validation_gate_pr_merge_scope_test.js`: PASS 3/3.
- `git diff --check`: PASS.
- Governance identity and no-merge scope: PASS.

The packages were rebuilt from Source A12 in a separate LF-normalized clone
using:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File `
  implementation/GoogleSpreadsheet/tools/build_v2_8_12_release.ps1 `
  -SourceCommit d3f93e05e77a3cdccf24c5a5b7d8def452155841 `
  -PreparedAt 2026-08-08T00:00:00Z
powershell.exe -NoProfile -ExecutionPolicy Bypass -File `
  implementation/GoogleSpreadsheet/tools/build_v2_8_12_phase8c_release.ps1 `
  -SourceCommit d3f93e05e77a3cdccf24c5a5b7d8def452155841 `
  -PreparedAt 2026-08-08T00:00:00Z
```

Results:

| Package | Package files | Payload files | Payload SHA-256 | Result |
|---|---:|---:|---|---|
| Phase 8B | 27 | 23 | `20314bfd4e07ef31f1fc8e5ff7aa160fc5b1add378b17fa9ba1a7f1af2665d1f` | byte parity/checksums/provenance/secret scan PASS |
| Phase 8C | 25 | 22 | `66b5039f3016da60a1f15d8339560cf0ffacffc0f4b30aa9324018b7421e8081` | TEST_MODE-only parity/checksums/provenance/secret scan PASS |

### Detached HTTPS fresh clone

At pushed B12 `0b655e6df51d7ac56c1936fb57331e03516ebe0c`:

```text
git -c core.autocrlf=false clone https://github.com/Tanukitsune-hub/GAS-Project-Schedule.git <fresh-clone>
git checkout --detach 0b655e6df51d7ac56c1936fb57331e03516ebe0c
cd implementation/GoogleSpreadsheet
pnpm install --frozen-lockfile
pnpm run verify:local
pnpm run verify:release
pnpm run verify:secret-scan
git status --porcelain=v1 --untracked-files=all
```

Result: complete gate PASS 11/11 with 51 suites; direct release PASS 1/1;
direct secret scan PASS 1/1 with 0 hits; no non-ignored generated or untracked
residue; detached HEAD exact.

### GitHub Actions at Release B12

| Event | Run | Job | Head | Conclusion |
|---|---:|---:|---|---|
| push | `31263106240` | `93116846809` | `0b655e6df51d7ac56c1936fb57331e03516ebe0c` | SUCCESS |
| pull request | `31263108264` | `93116851858` | `0b655e6df51d7ac56c1936fb57331e03516ebe0c` | SUCCESS |

The final report commit is intentionally report-only. Its final-head HTTPS
fresh-clone and Actions results are checked after push and recorded in Draft PR
#16, because those run IDs cannot exist before the commit containing this
report.

## Next controlled Sandbox Work ID trial steps

1. Keep Automation OFF and use only synthetic data in a dedicated personal
   Sandbox target.
2. Directly verify script/container ownership, parent binding, Cloud project,
   OAuth principal, deployment provenance, and absence of Shared Drive or
   pending-owner ambiguity without persisting identifiers.
3. Bind one-use authorization to the immutable source payload hash and exact
   version; stop if any ownership or provenance field is stale or incomplete.
4. Perform the separately authorized guarded staging/push and isolated
   pull-back byte-parity check; do not auto-correct any mismatch.
5. Run standalone Quick Diagnostic, Deep Diagnostic, and Dashboard refresh as
   separate acceptance steps; verify complete bounded summaries and native
   flush/reacquire/readback behavior.
6. Exercise synthetic Gmail-to-Task, Review/CAS, Calendar intent/outbox,
   multi-row edit/quarantine, retry/dead-letter, trigger, lock, quota, and
   rollback cases under a new explicit authorization.
7. Keep real AI disabled until one Provider transport, credential boundary,
   data policy, and failure taxonomy have their own approved Work ID.

## Remaining limitations and blockers

Work 0002 has no remaining blocker once the report-only final head passes the
same fresh-clone and GitHub Actions gates. Project-level blockers remain:

- live Apps Script/Sheets/Gmail/Calendar/trigger/Lock/quota semantics are not
  accepted;
- ownership, Cloud project, OAuth principal, immutable deployment, and remote
  pull-back parity are not yet established for this candidate;
- no approved real AI Provider transport or credential/data-policy boundary
  exists;
- pilot, production, company handoff, real data, and Automation enablement
  remain prohibited.

No live Google Workspace, Apps Script API, OAuth, deployment, clasp push/pull,
Gmail, Calendar, Drive, Sheets, trigger, real Provider, company-PC, or real-data
operation occurred in Work 0002.

## Git and PR handoff

- Branch: `codex/0002-clean-integration-candidate`
- Source A12: `d3f93e05e77a3cdccf24c5a5b7d8def452155841`
- Release B12: `0b655e6df51d7ac56c1936fb57331e03516ebe0c`
- Final report/evidence commit: `SELF`
- Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/16`
- Merge state: Draft, open, unmerged
- Work 0002 `BLOCKER`: `NONE`, subject to the report-only final-head checks
  described above
