# Google Workspace Personal Work OS v2
# Phase 8A Git Closeout and Sandbox Preparation Report

- Assessment date: 2026-07-26 JST
- Repository: `GoogleSpreadsheet`
- Code Version: `2.8.1-prepilot`
- Schema Version: `2.2`
- AI Schema Version: `2.0`
- Migration Version: `0`

## 1. Conclusion

```text
Overall: CONDITIONAL GO for starting a non-confidential TEST_MODE=true Sandbox
Git closeout: NOT EXECUTED - one denied Codex index write and Git identity unset
Deployment package: GO_LOCAL
Sandbox readiness: CONDITIONAL GO
```

Phase 8A completed the local package, deterministic build and read-only
verification tooling, ordered acceptance procedure, evidence template,
security checks and independent UX/release/Git reviews. It did not deploy or
operate Google Workspace, connect a real Provider, change TEST_MODE, create a
production Trigger, use real work data, or start Phase 8B/8C/8D.

## 2. Git

```text
Branch: unborn master
Commits: 0
Status: non-clean; audited Phase 1-7 baseline is staged and later remediation /
        Phase 8A work remains in the working tree
Entries: 79 default status entries; 56 staged, 34 tracked-unstaged,
         23 collapsed untracked entries / 51 untracked files
Permission: one Codex index-write attempt failed at .git/index.lock
Git identity: user.name and user.email are not configured
Push / PR: NOT EXECUTED
```

The Codex session attempted one narrow `git add -- AGENTS.md` after read-only
inspection. Git returned `fatal: Unable to create '.git/index.lock':
Permission denied`. In accordance with the task stop rule, no further Git write
was attempted and no alternate method was used to modify `.git`.

The index later changed outside that failed command. Phase 8A does not claim
authorship of that external index update. Read-only inspection established a
truthful history boundary between the audited staged `2.7.0-phase7` baseline
and the combined working-tree `2.8.1-prepilot` remediation plus Phase 8A
preparation. There is insufficient provenance to fabricate separate
retrospective `2.8.0`, `2.8.1` and Phase 8A source histories.

Both cached and working `git diff --check` pass and no task instruction prompt
is staged. Git reports that LF files may be converted to CRLF when touched by
the current Git configuration; Phase 8A did not perform that conversion.
Review the displayed diff before each normal-terminal commit.

### Safe normal-terminal closeout

Run these commands from a normal PowerShell terminal. Review every diff before
each commit. Replace the two identity placeholders with the human operator's
approved values; do not copy the placeholder text literally.

```powershell
Set-Location 'C:\path\to\GoogleSpreadsheet'

git rev-parse --show-toplevel
git status --short --branch
git diff --cached --check
git diff --check
git diff --cached --name-status
git diff --name-status
git config --get user.name
git config --get user.email

git config --local user.name '<YOUR_APPROVED_GIT_NAME>'
git config --local user.email '<YOUR_APPROVED_GIT_EMAIL>'
git var GIT_AUTHOR_IDENT
git var GIT_COMMITTER_IDENT

# Commit only the already-staged, independently audited 2.7 baseline.
git diff --cached --check
git diff --cached
git commit -m 'chore: establish audited v2 phase 1-7 baseline'

git switch -c prepilot/sandbox-acceptance

# The later files mix v2.8.1 remediation and Phase 8A preparation. Keep them
# in one truthful non-release commit rather than inventing an intermediate
# version/documentation boundary.
git add -- .gitignore
git add -- apps-script-v2
git add -- docs
git add -- tests
git add -- tools
git diff --cached --check
git diff --cached
git commit -m 'chore: complete v2.8.1 prepilot and phase 8a preparation'
$sourceCommit = git rev-parse HEAD

# Regenerate from the committed source and build inputs, then verify read-only.
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File tools/build_phase8a_release.ps1 `
  -SourceCommit $sourceCommit `
  -SourceTreeStatus (
    "Apps Script source and Phase 8A build inputs committed at $sourceCommit"
  )
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File tools/verify_phase8a_release.ps1

git add -- release/v2.8.1-prepilot
git diff --cached --check
git diff --cached
git commit -m 'build: add deterministic prepilot deployment package'

git status --short --branch
git log --oneline --decorate -3
```

Do not use `git add -A`, `reset`, `clean`, `revert`, force operations, push or
PR creation for this closeout.

## 3. Package

```text
Path: release/v2.8.1-prepilot/
Files: 26 total
Payload: 22 .gs + appsscript.json = 23
Checksum records: 25 (all package files except CHECKSUMS.sha256)
CHECKSUMS.sha256 file SHA-256:
  b6c8b057e30f7e4ad9b11091fce86389011277fc19d1c7100590c29a57a25e49
Canonical payload-list SHA-256:
  8fc8084126ea09ecea79cf0fb7c5d297e0cb6859894576cb9656d72f787fe9fa
Source parity: 23 / 23 PASS
Secret scan: actual secret / actual resource URL / Windows absolute path = 0
Reviewed synthetic fixtures: 3, confined to 99_TestHarness.gs
```

The package is created by `tools/build_phase8a_release.ps1`; payload files are
byte-copied from `apps-script-v2/` and are not edited in the release
directory. `tools/verify_phase8a_release.ps1` performs a separate read-only
file-set, source-parity, checksum, manifest, scope, service, path, link and
secret check.

Build invariants:

- Code `2.8.1-prepilot`; Schema `2.2`; AI Schema `2.0`; Migration `0`
- `TEST_MODE=true`
- Automation default `OFF`
- exact seven OAuth scopes
- Gmail Advanced Service v1 and Calendar Advanced Service v3
- no `script.external_request`, Drive, mail-send, full-mail or broad Calendar
  scope
- no `.clasp.json`, credential file, test file, Archive or prompt
- no ZIP was created

Two consecutive builds from the same source and fixed metadata produced the
same package hashes. The source Apps Script files and manifest were not changed
by Phase 8A.

## 4. Sandbox

```text
TEST_MODE: true
Automation: OFF
Provider: no real Provider configured or connected
Scope: non-confidential new empty Spreadsheet with synthetic/self data only
Acceptance items: ordered Part A-L Manual Acceptance Guide
Manual execution: NOT EXECUTED
```

The Quickstart explicitly discloses that Setup creates seven Gmail labels, one
dedicated secondary Calendar and one owner installable edit Trigger in the
Sandbox account. It does not create or enable a time-driven production
Trigger. An organization-approved `clasp` path is the deterministic recommended
deployment route; manual placement of 22 `.gs` files and the manifest is a
fallback.

The acceptance guide separates Required, Conditional and Advanced cases, gives
prerequisites, actions, expected results, PASS/FAIL/NOT EXECUTED, evidence,
stop conditions and cleanup for Parts A-L, and does not require the operator to
remember internal function or stage names.

## 5. UX and operations review

Documentation-level findings were closed in Phase 8A:

- normal and advanced/failure-injection paths are separated;
- each OAuth prompt is checked against the exact manifest scopes and counted;
- Setup side effects and stop conditions are visible before execution;
- package verification precedes deployment;
- Quick Diagnostic and Dashboard are in the minimal smoke path;
- failure evidence excludes IDs, body, credentials and internal URLs.

Independent review found no Critical/High blocker for a TEST_MODE=true
Sandbox. The following product-code UX findings are deferred for
reconsideration before a personal real-work pilot:

1. The custom menu is a flat list of 21 mixed setup, daily, automation,
   diagnostic and harness actions.
2. A `REFUSED` operation can receive a generic success-like next action.
3. Result dialogs can expose internal stage codes in up to 10,500 characters
   of JSON instead of separating user summary from technical details.

Phase 8A did not modify product code or add features to address these findings.

## 6. Regression and static validation

| Check | Start | Final | Status |
|---|---:|---:|---|
| Local suites | 34 | 34 | PASS_LOCAL |
| PASS | 471 | 471 | PASS_LOCAL |
| FAIL | 0 | 0 | PASS_LOCAL |
| SKIPPED | 11 | 11 | NOT_EXECUTED external cases |
| `.gs` syntax | 22/22 | 22/22 | PASS_LOCAL |
| Source/package parity | - | 23/23 | PASS_LOCAL |
| Package checksums | - | 25/25 | PASS_LOCAL |
| Package inventory | - | 26/26 | PASS_LOCAL |
| Quickstart local links | - | 2/2 | PASS_LOCAL |
| Actual secret / ID / absolute path | 0 | 0 | PASS_LOCAL |
| Cached and working diff check | PASS | PASS | PASS_LOCAL |

The 11 skipped cases remain real Provider / Google Workspace / OAuth / Trigger
/ LockService runtime checks. They were not promoted to PASS.

## 7. Go / No-Go

| Stage | Decision | Reason |
|---|---|---|
| Git closeout | NO-GO in this Codex session | One Codex index write was denied; Git identity is unset. Safe normal-terminal commands are ready |
| Deployment package | GO | deterministic build, independent read-only validation, parity/checksum/security PASS |
| TEST_MODE=true Sandbox start | CONDITIONAL GO | verify checksums, use a new non-confidential Sheet, synthetic/self data, Automation OFF and no real Provider |
| TEST_MODE=false Sandbox | NO-GO | Provider/model/endpoint/auth and approvals unresolved; real Gate not executed |
| Personal real-work pilot | NO-GO | Git closeout, Phase 8B/8C evidence and external decisions remain incomplete |

## 8. Created and modified files

Created:

- `tools/build_phase8a_release.ps1`
- `tools/verify_phase8a_release.ps1`
- `tools/phase8a/DEPLOYMENT_MANIFEST.template.md`
- `tools/phase8a/SANDBOX_QUICKSTART.md`
- `release/v2.8.1-prepilot/apps-script/` (23 generated payload files)
- `release/v2.8.1-prepilot/DEPLOYMENT_MANIFEST.md`
- `release/v2.8.1-prepilot/SANDBOX_QUICKSTART.md`
- `release/v2.8.1-prepilot/CHECKSUMS.sha256`
- `docs/V2_SANDBOX_ACCEPTANCE_RESULTS_TEMPLATE.md`
- `docs/V2_PHASE8A_SANDBOX_PREPARATION_REPORT.md`

Modified:

- `.gitignore`
- `apps-script-v2/README.md`
- `apps-script-v2/CHANGELOG.md`
- `docs/V2_MANUAL_ACCEPTANCE_GUIDE.md`
- `docs/V2_PREPILOT_READINESS_CHECKLIST.md`
- `docs/V2_FINAL_CODE_REMEDIATION_REPORT.md` (local-path hygiene only)

No Apps Script `.gs` source or `appsscript.json` was modified by Phase 8A.

## 9. External boundary

The following remain `NOT EXECUTED`:

- actual Google Workspace deployment and OAuth consent;
- real Gmail label/search/mutation and Calendar creation/CRUD;
- real installable Trigger event and LockService contention;
- actual Quick/Deep Diagnostic and Worker duration;
- real Provider selection, transport, endpoint, model and credential handling;
- TEST_MODE=false, time-driven production Trigger and normal Inbox automation;
- real-case email, personal work pilot, limited-user or department rollout.

This report stops at Phase 8A. Phase 8B was not started.

