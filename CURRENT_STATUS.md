# Current Status

Last updated: 2026-08-04
Candidate version: Code `2.8.11-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
Overall status: `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION`
Automation default: `OFF`  
Observed controlled Sandbox Setup S00-S99: `PASS`; separately scoped
functional acceptance: `ATTEMPTED_FAILED_CLOSED`
(`RUNTIME_QUICK_DIAGNOSTIC_FAILED_CLOSED` / `BLOCKED_BY_AUTH` /
`RUNTIME_AUTHORIZATION_REJECTED`)

<!-- CURRENT_TRANSFER_CONTRACT_START -->
| Field | Value |
|---|---|
| Code | `2.8.11-prepilot` |
| Schema | `2.6` |
| AI Schema | `2.0` |
| Migration | `3` |
| Gate | `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` |
| Fixed transfer | `T11_SUSPENDED` |
| Transfer path | `NO_ACTIVE_COMPANY_TRANSFER` |
| Company handoff | `NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW` |
<!-- CURRENT_TRANSFER_CONTRACT_END -->

## Instruction 0017 PR #11 governance-scope remediation

Instruction 0017 found that the PR #11 `.codex` configuration/agent files and
the root `AGENTS.md` delegation-only section had entered the branch without
explicit authorization in the PR #11 instruction chain. The additive scope
remediation removes only that governance scope. Apps Script source, canonical
`appsscript.json`, runtime tooling, and Instruction 0011 through 0015 evidence
remain unchanged.

This is a repository-scope correction only. The development gate remains
`READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` as a readiness boundary;
functional acceptance remains `ATTEMPTED_FAILED_CLOSED` and `REVIEW_REQUIRED`.
Automation remains OFF, company handoff remains
`NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW`, T11 remains
`T11_SUSPENDED`, and there is `NO_ACTIVE_COMPANY_TRANSFER`.

## Current Instruction 0015 authorization-root-cause closure

The existing ignored local-only named OAuth profile was force-refreshed without
creating a second profile or exposing credential material. The closed
authorization matrix passed: local Desktop client/audience continuity,
`7` runtime-manifest scopes, `19` granted scopes, zero missing scopes, and the
required runtime API scopes. Read-only metadata also passed for an
API-executable, MYSELF-only, versioned deployment. The bound-container
ownership check remains `INCONCLUSIVE_NOT_EXPOSED_BY_APPS_SCRIPT_METADATA`, so
no script or container ownership inference is made.

The 0015 marker preserved the 0011/0013/0014 attempts. Staged, independent
HEAD pull-back, and fresh immutable-version pull-back payloads all proved the
top-level `runQuickDiagnostic` wrapper before a fresh MYSELF-only versioned
deployment was bound for execution. Exactly one Instruction 0015
deployment-bound `runQuickDiagnostic` invocation returned no bounded diagnostic
body. It is closed as `RUNTIME_QUICK_DIAGNOSTIC_FAILED_CLOSED`, category
`BLOCKED_BY_AUTH`, safe subtype `RUNTIME_AUTHORIZATION_REJECTED`; no retry is
permitted. Functional acceptance remains `ATTEMPTED_FAILED_CLOSED` and
`REVIEW_REQUIRED`. Phase 8B overall PASS, Phase 8C GO, production/pilot
readiness, company handoff, and company transfer are not established.
Automation remains OFF, T11 remains `T11_SUSPENDED`, and there is
`NO_ACTIVE_COMPANY_TRANSFER`.

## Current Instruction 0014 runtime execution-binding closure

Package-source and primary-API review identified the Instruction 0013 guard
gap: clasp 3.3.0 passed its active project configuration value to
`scripts.run`, while `--nondev` only set `devMode=false`; the separately stored
deployment binding was not selected by that command. Deployment visibility
alone was therefore insufficient, and missing tracked source was not the root
cause.

The remediated preflight preserved the 0011/0013 attempts, proved the
top-level `runQuickDiagnostic` wrapper in staged and independent HEAD-pulled
runtime payloads, created one fresh MYSELF-only immutable version/deployment,
and pulled that exact version back. The 23-file payload hash, MYSELF manifest
overlay, wrapper, exact function name, version lineage, and deployment-bound
execution context all passed.

The sole Instruction 0014 `runQuickDiagnostic` invocation returned no bounded
diagnostic body. It is closed with overall status
`RUNTIME_QUICK_DIAGNOSTIC_FAILED_CLOSED`, category `BLOCKED_BY_AUTH`, and safe
subtype `RUNTIME_AUTHORIZATION_REJECTED`; no retry is permitted. Functional
acceptance remains `ATTEMPTED_FAILED_CLOSED` and `REVIEW_REQUIRED`. Phase 8B
overall PASS, Phase 8C GO, production/pilot readiness, company handoff, and
company transfer are not established. Automation remains OFF, T11 remains
`T11_SUSPENDED`, and there is `NO_ACTIVE_COMPANY_TRANSFER`.

## Current Instruction 0013 corrected versioned runtime retry boundary

The separate ignored one-use marker preserved all Instruction 0011 evidence.
Before execution, the read-only preflight proved that the ignored local
binding matched exactly one visible versioned deployment and was not the HEAD
test deployment. Named OAuth, runtime authentication, standard-Cloud/API/OAuth
prerequisites, and exact MYSELF-only runtime overlay parity also passed in
closed-safe form. No deployment was created or updated.

Exactly one deployed-version `runQuickDiagnostic` invocation was attempted.
It returned no bounded diagnostic body and closed as
`REMOTE_QUICK_DIAGNOSTIC_FAILED_CLOSED`, with safe subtype
`VERSIONED_RUNTIME_FUNCTION_NOT_FOUND`; the immediate local parser record is
preserved as `DEV_RUNTIME_RESULT_UNPARSEABLE`. Instruction 0013 permits no
retry. Functional acceptance remains `ATTEMPTED_FAILED_CLOSED` and
`REVIEW_REQUIRED`; Phase 8B overall PASS and Phase 8C GO are not established.
The development gate remains `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` only
as readiness. Company handoff remains
`NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW`, T11 remains
`T11_SUSPENDED`, and there is `NO_ACTIVE_COMPANY_TRANSFER`.

## Prior Instruction 0011 relocated runtime attempt boundary

Relocation reattachment, status reconciliation, locked local verification,
personal standard-Cloud/API/OAuth prerequisites, named OAuth verification, and
exact `23`-file MYSELF-only runtime push/pull parity passed. The runtime payload
and independent pull-back both have SHA-256
`5524d8412d79bbe8a9b77c916ec1132507b931a1c0b7dbb852eaafe991b74e7a`.

The instruction's sole standalone `runQuickDiagnostic` API attempt returned no
bounded diagnostic body and stopped as `BLOCKED_BY_AUTH`; the local parser's
immediate closed status was `DEV_RUNTIME_RESULT_UNPARSEABLE`. The supplied
local-only deployment binding was absent from the target's deployment list,
which contained only a HEAD test deployment. A MYSELF-only versioned API
executable was created and locally rebound after the stop, but no second
diagnostic call was made. Runtime acceptance is not PASS, and any future retry
requires a later explicit instruction. The development gate remains
`READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION`; company handoff remains
`NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW`, T11 remains
`T11_SUSPENDED`, and there is `NO_ACTIVE_COMPANY_TRANSFER`.

## Current 0010 canonical parity and runtime boundary

The explicitly approved new blank, spreadsheet-bound, personal, non-company
synthetic target passed its separate two-file blank preflight. An independent
pull-back then proved the exact `23` canonical files at byte-level payload
SHA-256 `ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1`.
The interactive push confirmation was not recorded and is not inferred; the
independent pull-back is the parity evidence.

The operator reported one first-time `setupSystem` result as `COMPLETE`. This
is bounded real-Workspace evidence for the Setup completion boundary, including
its internal S90 gate. It is not a standalone API-executable diagnostic and
does not establish Phase 8B overall PASS. The highest supported development
status is `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION`. Company handoff remains
`NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW`, T11 remains
`T11_SUSPENDED`, and there is `NO_ACTIVE_COMPANY_TRANSFER`.

At the close of Instruction 0010, personal standard Cloud linkage,
Cloud-project Apps Script API enablement,
OAuth Testing/Desktop-client runtime configuration, MYSELF-only overlay
push/pull parity, API executable deployment, and the guarded standalone
read-only `runQuickDiagnostic` invocation remain `NOT_EXECUTED`.

## Historical 0007 guarded clasp result

The existing target was locally attested as
`PERSONAL_SYNTHETIC_NON_COMPANY_EXISTING_SANDBOX`. OAuth, ignored target
binding, the target guard, the pre-push status check, and the exact 23-file
staging contract completed. The staged byte-level payload SHA-256 is
`ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1`.
No identity, Script ID, URL, token, raw remote output, or Workspace content is
retained.

The guarded push returned `CLASP_PUSH_FAILED`. Read-only classification did
not establish `APPS_SCRIPT_API_DISABLED`, so no exception applied and no push
retry was permitted under Instruction 0007. Pull-back parity and runtime
validation were `NOT_EXECUTED`. Its historical development status was
`NO_GO_LOCAL_CLASP_VALIDATION`; company handoff is
`NO_GO_COMPANY_HANDOFF_LOCAL_VALIDATION_FAILURE`. No company transfer or
Workspace action is authorized.

## Historical 0008 / 0009 bootstrap result

The reported 0007 commits are preserved locally and their ancestry from the
0007 instruction is verified. The 0008 branch adds closed clasp failure
classification, a durable pre-call one-retry marker, isolated target access,
canonical/runtime parity gates, a MYSELF-only runtime manifest overlay, named
local OAuth/Cloud/deployment guards, and a bounded side-effect-free
`runQuickDiagnostic` result contract. Apps Script source, canonical manifest,
release, transfer, checksums, and fixed refs are unchanged.

Instruction 0009 normally merged the formal instructions, normally published
the preserved local history, created the stacked Draft PR, and obtained
current-head push and pull-request CI success. The local non-Google gate is
`11/11 PASS`: `52` Node suites, Apps Script validator, JSON/YAML,
release/transfer verification, fixed-ref lineage, and secret/local-path
scanning all pass. Canonical staging is 23 files at SHA-256
`ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1`.

The user-level API confirmation, ignored target guard, and isolated read-only
pull were then attempted under the approved personal-synthetic boundary. The
pull returned a bounded noncanonical shape of `2` files where `23` are
required, with `0` non-files. The closed result is
`REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH`; it is not evidence of a wrong target,
and it is not eligible for canonical overwrite. Canonical push, retry-marker
consumption, canonical parity, Cloud/OAuth setup, runtime-overlay parity,
deployment, runtime call, and final fresh clone remain `NOT_EXECUTED`.
The development status at the close of Instruction 0009 was
`NO_GO_LOCAL_CLASP_VALIDATION`.

## Historical 0006 local clasp validation gate

Instruction 0005 is `SUPERSEDED_NOT_EXECUTED`. Its company-PC T11 carriage,
five-file replacement, and company-Sandbox T1-01 re-observation were not
performed. T11 remains immutable historical evidence, but its transfer
envelope is suspended and does not authorize company handoff or any Workspace
operation.

Historically, the non-Google local static/regression gate and current-branch
GitHub Actions CI passed, and the exact 23-file dev payload was staged and
hashed. Instruction 0007 supersedes that earlier pending-target state with the
current fail-closed result above.
Safe closed evidence is recorded in
`audits/2026-07-31/GoogleWorkspace_0006_Local_Clasp_Validation_Gate_Evidence_2026-07-31.md`.

## Historical 2.8.11 T1-01 bounded-summary visibility remediation

The reported controlled-Sandbox T1-01 record is closed evidence only:
`77 PASS / 6 WARN / 0 FAIL`, `REVIEW_REQUIRED`, and no action authorization.
Its detailed JSON was truncated or out of view, so the sixth warning is not
asserted or inferred here. The 2.8.11 candidate retains all checks and emits,
before details, sorted unique WARN/FAIL IDs with completeness flags, counts,
read-only side-effect Booleans, Task 50-column/header states, and Ledger
21-column/hidden/protected/validator states. Any incomplete list remains
fail-closed as `REVIEW_REQUIRED`.

T10 and T11 remain immutable historical evidence. The prior T11 retransfer
guide is suspended by instruction 0006; no company carriage or retest is
currently authorized. The historical retest remains `NOT_EXECUTED` and T1-01
is not declared PASS.

## Historical 2.8.10 Dashboard write-visibility remediation

`PHASE8B-DASHBOARD-WRITE-VISIBILITY-01` supersedes fixed T9 as an execution
transfer target after the same bounded 51-cell conflict recurred in the real
Sandbox. The confirmed defect is a Setup write-visibility gap: v2.8.9 called
`setNumberFormat()` and then performed its strict readback in the same
execution without `SpreadsheetApp.flush()`. The synchronous fake runtime hid
that behavior.

The v2.8.10 source candidate keeps the strict Dashboard ownership and
non-format surface contract. After an actual Setup-only write it flushes,
reacquires a fresh exact Range, and requires all 51 formats to satisfy the
canonical postcondition before S90 continues. It also rejects Config, Setup,
or Dashboard module-contract skew before any write and records only bounded
normalization evidence. Quick/Deep Diagnostic remain read-only. Source A10
`33b9ecee5b0957615fcc27fc822bf7d10a74c86f`, direct-child Release B10
`3f4fe6c52be7bf9c66ad221594e6271feebb57ed`, and fixed T10
`927d8567bce64461840cc6f72fbae0c1e636a8e6` passed normal
publication and detached HTTPS fresh-clone verification. E10 records that
historical publication proof. Its then-current
`READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE` gate is nonoperative.
Instruction 0005 is `SUPERSEDED_NOT_EXECUTED`; T11 is suspended and the
current local-clasp/no-company-handoff contract above is authoritative.
Automation remains `OFF`.

## Observed controlled Sandbox Setup evidence

The operator reviewed the source observation and retained only its closed
non-sensitive results; no image, account detail, Workspace ID, URL, locale,
actual format string, or business content is stored. One controlled Sandbox
Setup completed S00 through S99. Its in-Setup S90 result reported an aligned
module contract and a normalized bounded 51-cell block with write, flush, and
strict postcondition verified. It reported no schema extension, Task-row
update, quarantine, or orphaning; the completed layout refresh reported 11
Sheets. S60 and S80 passed as Setup stages only. The prior safe
`E_CALENDAR_APP_ACCESS_REQUIRED` stop is historical; no unobserved Calendar
root cause or resource sequence is asserted.

This is a PASS only for the observed Setup/S90/S99 run. Standalone Quick
Diagnostic, Deep Diagnostic, Dashboard refresh, functional edit-trigger
behavior, Gmail processing, Calendar reconciliation, LockService contention,
authority fault injection, and external Provider/model/credential work remain
`NOT_EXECUTED`. Automation and a five-minute trigger are `OFF` /
`NOT_AUTHORIZED`. Phase 8B overall PASS, Phase 8C GO, production readiness,
and pilot readiness are `NOT_DECLARED`.

## Historical 2.8.9 Dashboard number-format transfer evidence

`PHASE8B-DASHBOARD-NUMBER-FORMAT-01` is a safe Phase 8B Setup blocker. The
real Sandbox reached S00–S80 and stopped before S90/S99 with closed Dashboard
ownership/number-format conflict evidence. The exact conflict count matches
the 17×3 system surface; other Dashboard conflict counts are zero. No
Workspace identifier, URL, identity, screenshot, locale, observed format
string, business content, or credential is stored.

The root cause is not a Diagnostic false positive: v2.8.8 detects a
noncanonical Dashboard number format, but Setup did not own a narrow path to
establish the deterministic text contract before S90. v2.8.9 keeps the strict
Diagnostic contract and adds an ownership-proven Setup-only normalization:
canonical schema, owner-proven sheet/header protection, exact seed or
owned/versioned state, and every other surface control must first be safe.
Only then may Setup change the exact 17×3 system block. Empty, ambiguous,
foreign, or user-owned surfaces remain fail-closed; Quick/Deep Diagnostic
remain read-only.

Source A9 `a448b8d856abd5eb32baa60117f5fdb9f8e56de9` contains source, tests,
tools, canonical documents, visualization, incident evidence, and recovery
guidance only. Corrected Source A9.1
`4a145588b01a5f7ae7e9bce86efb9bd5b3d8345d` binds the patch-manifest default
to fixed T8. Direct-child corrected Release B9.1
`b451d2361db99b4efbde036dafa3e2baf6b5cb97` contains only both v2.8.9
packages and the implementation report. Fixed transfer T9
`781f408fcf0853a5fffee9c00d3022ee5e17b1d7` contains only the transfer
envelope. Normal non-force publication, GitHub resolution, and a detached
HTTPS clone of T9 passed 45 suites / 658 assertions / 0 failures, validator
11/11, package/transfer verifiers, raw-blob patch parity, checksums,
allow-lists, provenance, and scans. The highest carriage-only status is now
`READY_FOR_PHASE8B_SANDBOX_RETRANSFER` for that historical T9 verification.
T9 has since been superseded as an execution target. Real Workspace
retransfer/retest remains `NOT_EXECUTED`; Automation remains `OFF`.

## Historical 2.8.8 Dashboard surface remediation candidate

`PHASE8B-DASHBOARD-01` is High for Phase 8B execution readiness. The real
Sandbox safely stopped at S90 with `DASHBOARD_LAYOUT_OWNERSHIP`,
`E_DASHBOARD_LAYOUT_CONFLICT`, and `UNSAFE_DASHBOARD_SURFACE`; S00–S80 remain
complete and S90/S99 remain incomplete. No Workspace IDs, URLs, screenshots,
account names, user identities, or business data are recorded.

The exact root cause is the v2.8.7 predicate requiring one ordinary explicit
Protection editor. Apps Script can represent the proven Spreadsheet owner as
able to edit while `getEditors()` does not list that owner as an ordinary
explicit editor. v2.8.8 now requires internally equal owner/effective-user
identities and `canEdit() === true`, then accepts only either the implicit-owner
zero-editor representation or one explicit owner. Owner unavailable, different
effective user, warning-only, domain edit, target audience, foreign/blank
editor, duplicate/wrong Protection, unprotected range, or foreign overlapping
Protection remains fail-closed.

Dashboard surface inspection now returns only closed reason/subreason enums
and counts for Protection, named range, value, formula, validation, note,
merge, hidden state, background, font, number format, and seed/marker
contracts. It never exposes identity, value, formula, note, range address, ID,
or URL. The corrected S90 path remains byte-for-byte read-only and preserves
S00–S80 resources, Automation OFF, and the absent five-minute trigger.

Source A8 `4140054b03c850f4a1e669b3aa562b305ef78bf5` contains source, tests,
tools, canonical documents, visualization, safe incident evidence, and recovery
guidance only. Direct-child Release B8
`a17d34422ed521cee81340902d9a19e2da372201` contains only both v2.8.8
packages and the implementation report. Fixed transfer T8
`69f843f6ea426ccb45d721a40508a35b0a59795d` contains only the transfer
envelope.

A normal non-force push published the linear chain. GitHub resolved all three
SHAs. A detached HTTPS clone of T8 passed 44 suites / 646 PASS / 0 FAIL / 11
explicit SKIPPED, validator 11/11, both package verifiers, independent raw-byte
rebuild parity, 27/27 allow-list, T7-to-B8 raw-blob patch parity, transfer
checksums, provenance, and scans. Evidence E8 is
`SELF (this evidence-only commit)` and is not a transfer target.

## Historical 2.8.7 Quick Diagnostic remediation chain

`PHASE8B-QUICK-DIAGNOSTIC-01` records four safe, real-Sandbox observations
without Workspace IDs, URLs, screenshots, or business data:

- `DASHBOARD_LAYOUT_OWNERSHIP`: a canonical Setup-owned Dashboard control
  plane / seed state must not be confused with a foreign writable surface.
- `TASK_PROTECTIONS`: the canonical Task header protection spans rows 1–2 and
  all 50 Task columns.
- `BLANK_ROW_BOOLEAN_VALUES`: an identity-empty row may retain only canonical
  checkbox Boolean `false` materialized by Google Sheets.
- `TASK_VALIDATION_TYPES`: all five schema-defined checkbox columns, including
  hidden `calendar_reconcile_required`, are validated from the canonical plan.

Source A7 `be2e551da310a9b7c0611f3aef8899309a3d7b69` contains only source,
tests, tools, canonical documents, visualization, incident, and recovery
guidance. Its direct-child Release B7
`95bc7240d99124b245e188b8e646eccf6c3ead48` contains only the two v2.8.7
packages and implementation report. C7
`ba175d3994c86dacc76bad3537df97e3e644dc09` corrected the transfer-manifest
verifier without changing package bytes. Fixed transfer T7
`008c643b85c6b234ad489d946033cb9c06d32920` contains only the transfer
envelope and raw-byte-derived company-PC patch manifest. T7 was normally
pushed, GitHub-resolved, and verified from a detached fresh HTTPS clone.

Evidence E7 records the final remote
and fresh-clone proof and is not a transfer target. It changes no package,
transfer, source, test, or tool file. Real Workspace retransfer/retest remains
`NOT_EXECUTED`. T7 is immutable historical evidence and is superseded as an
execution transfer target by `PHASE8B-DASHBOARD-01`.

## Why the 2.8.5 transfer gate is superseded

The final R5 A5.4/B5.4 correction and its P6–P10 publication evidence remain
immutable historical records.  A first-time Setup using the exact P10 Phase
8B package then safely failed with `E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN` at
`TASK_AUTHORITY`, after only `S00_VALIDATE_ENV` and `S10_CREATE_SHEETS`.
Finding `PHASE8B-SETUP-01` therefore supersedes P10 as a transfer target. The
former 2.8.6 source candidate was deliberately no-go until its additive
source/release/transfer chain was independently published and reverified. That
historical condition was satisfied for fixed T6.1 only. T6.1 is now historical
evidence, not the current transfer target or an execution authorization.

## Provenance state

| Record | SHA / relation | State |
|---|---|---|
| Historic Source A5 | `9705def085b66b5e521c7ec93804c228eb60e7ba` | retained historical local evidence |
| Historic Release B5 | `753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf` | retained historical local evidence; direct child of historic A5 |
| Published P5 baseline | `3442ac01f5c544c2b49a40a9af170d1f432312f1` | fixed independent-audit target; parent is B5.2 |
| Corrected Source A5.2 | `ff658bacf1e85864e4008efa32863635e446d47d` | historic published source; retained |
| Corrected Release B5.2 | `d6dda2b3eb9307e7033dcdd5f4718260c4944451` | historic published release; direct child of A5.2 |
| R5 Source A5.3 | `4b39a0eaeb1eb5f9efe4188bf23b6e60b0f6edb1` | retained unpublished candidate; superseded after the second independent Calendar review finding |
| R5 Release B5.3 | `f4fa0bfe4b2479f6ae61ebb6780369079f073aa4` | retained unpublished candidate release; superseded with no rewrite or force operation |
| Final R5 Source A5.4 | `6c4f737c676b3121c42aafabe9d0c677cacd69bb` | final source-only additive correction; no release payload or release report |
| Final R5 Release B5.4 | `3e5790672740626f3bec4592c3c7c0b86b47f3b1` | direct child of A5.4; exactly 27 Phase 8B files, 25 Phase 8C files, and one Round 5 report |
| P6 remote publication evidence | `12538796fed90eb7f95492d477cca44a5d859291` | normal fast-forward pushed to `codex/r5-independent-reaudit-transfer-prep`; GitHub SHA resolution and fresh-clone validation PASS |
| Historical P7 transfer-readiness evidence | `45bb4b938b02f2fd56d5d57267f4083a46f5176b` | normal-pushed; its fresh clone detected `REAUDIT-TR-01` raw-byte checksum portability mismatch; not a transfer authorization |
| P8 checksum-portability correction | `784b293c50713597a656bc7d9d1ae51fdaa26f1a` | normal-pushed; a fresh clone passed canonical-text transfer checksum verification while intentionally `NO-GO` |
| P9 transfer-envelope evidence | `ab6b1db8c0d7cc3f0df6bc104cfee39392787d4b` | normal-pushed; GitHub resolution, fresh-clone 41-suite validation, package parity, canonical transfer checksum, allow-list, and scans PASS |
| P10 fixed transfer reference | `1a1f9df65dacf3a031409d724cb2906b58900f77` | independently verified from a detached fresh HTTPS clone; the fixed non-confidential Phase 8B transfer reference |
| Phase 8B Setup blocker | `PHASE8B-SETUP-01` | High; observed only on failed historical P10 initial Setup; safe evidence preserved, corrected-package real retest pending |
| Source A6 | `8e8e3e4a5f2288985554b3467a5b68814e7bab21` | additive source/tests/tools/canonical-docs/visualization/recovery guide; excludes v2.8.6 release and transfer payloads |
| Release B6 | `49f6774242e11f3c4ae1f0881dc4a7e13c5aad23` | direct child of A6; exactly both v2.8.6 packages and the implementation report |
| Transfer T6 | `39205ff9d0a7df79f9e0892b02ab73cac1a7dc14` | retained transfer-envelope generation record; superseded only for an external-digest record correction |
| Fixed transfer T6.1 | `863217b99dfa1ad682a8f4dd1989212b0a8d548b` | normally pushed, GitHub-resolved historical transfer ref; fresh-clone static verification PASS, superseded as the current target by `PHASE8B-QUICK-DIAGNOSTIC-01` |
| Historical evidence-only closure E6.1 | `e03367c38ac1a623f6ce0c45ba5d5e37d7271d69` | records the T6.1 proof and corrected documentation digest; it is not a transfer target |
| Source A7 | `be2e551da310a9b7c0611f3aef8899309a3d7b69` | source/tests/tools/canonical-docs/visualization/incident/recovery only; excludes v2.8.7 package, report, and transfer envelope |
| Release B7 | `95bc7240d99124b245e188b8e646eccf6c3ead48` | direct child of A7; exactly the two v2.8.7 packages and the Phase 8B Quick Diagnostic implementation report |
| Transfer verifier C7 | `ba175d3994c86dacc76bad3537df97e3e644dc09` | post-B7 tool-only correction for an independently demonstrated manifest-verifier defect; immutable package bytes unchanged |
| Fixed transfer T7 | `008c643b85c6b234ad489d946033cb9c06d32920` | normally pushed, GitHub-resolved fixed v2.8.7 transfer ref; raw-byte patch manifest, checksums, and detached fresh-clone verification PASS |
| Evidence E7 | `SELF (this evidence-only commit)` | records final remote/fresh-clone proof; not a transfer target and changes no package/transfer/source/test/tool file |
| Phase 8B Dashboard surface blocker | `PHASE8B-DASHBOARD-01` | High; safe S90 evidence; v2.8.8 corrected-package real Workspace retransfer/retest `NOT_EXECUTED` |
| Source A8 | `4140054b03c850f4a1e669b3aa562b305ef78bf5` | source/tests/tools/canonical-docs/visualization/incident/recovery only; excludes v2.8.8 package, report, and transfer envelope |
| Release B8 | `a17d34422ed521cee81340902d9a19e2da372201` | direct child of A8; exactly both v2.8.8 packages and the implementation report |
| Fixed transfer T8 | `69f843f6ea426ccb45d721a40508a35b0a59795d` | normal-pushed, GitHub-resolved fixed v2.8.8 transfer; 3-file raw-byte patch manifest and detached fresh-clone verification PASS |
| Evidence E8 | `SELF (this evidence-only commit)` | records final remote/fresh-clone proof; not a transfer target and changes no source/test/tool/package/transfer file |
| Source A9 | `a448b8d856abd5eb32baa60117f5fdb9f8e56de9` | historical v2.8.9 source/tests/tools/canonical-docs/visualization/incident/recovery commit; no v2.8.9 package, report, or transfer envelope |
| Corrected Source A9.1 | `4a145588b01a5f7ae7e9bce86efb9bd5b3d8345d` | historical additive source correction binding the patch-manifest baseline to fixed T8 |
| Corrected Release B9.1 | `b451d2361db99b4efbde036dafa3e2baf6b5cb97` | direct child of A9.1; contains only both v2.8.9 packages and its implementation report |
| Fixed transfer T9 | `781f408fcf0853a5fffee9c00d3022ee5e17b1d7` | historical v2.8.9 transfer envelope; normal-pushed and detached-clone verified, then superseded by `PHASE8B-DASHBOARD-WRITE-VISIBILITY-01` |
| Evidence E9 | `63841d85da478e401986e80db77e9308c8af9655` | records fixed-T9 fresh-clone proof; not a transfer target and changes no source/test/tool/package/transfer file |
| Source A10 | `33b9ecee5b0957615fcc27fc822bf7d10a74c86f` | direct child of instruction commit `56fff00bab0b272640ce89c90ffda8a60968e56b`; source/tests/tools/current docs only; excludes generated packages, release report, and transfer envelope |
| Release B10 | `3f4fe6c52be7bf9c66ad221594e6271feebb57ed` | direct child of A10; exactly both v2.8.10 packages and the write-visibility/module-skew implementation report |
| Fixed transfer T10 | `927d8567bce64461840cc6f72fbae0c1e636a8e6` | direct child of B10; exactly the flat 11-file transfer envelope; normal-pushed, GitHub-resolved, and detached HTTPS fresh-clone verified |
| Evidence E10 | `SELF (this evidence-only commit)` | records final remote/fresh-clone proof and current-document reconciliation; not a transfer target and changes no source/test/tool/package/transfer file |

The immutable P5 publication evidence remains at
`audits/2026-07-28/GoogleWorkspace_v2_8_5_Remote_Publication_Verification_2026-07-28.md`.
The fixed-ref `REAUDIT_NO_GO` evidence remains at
`audits/2026-07-29/GoogleWorkspace_v2_8_5_Independent_Reaudit_Report_2026-07-29.md`.
The separate final-corrective local re-audit and transfer-readiness record is
`audits/2026-07-29/GoogleWorkspace_v2_8_5_R5_Corrective_Independent_Reaudit_and_Transfer_Readiness_2026-07-29.md`.
The remote-publication and transfer-readiness verification is recorded at
`audits/2026-07-29/GoogleWorkspace_v2_8_5_R5_Remote_Publication_and_Transfer_Readiness_Verification_2026-07-29.md`.
The checksum-portability finding and P8 corrective record is
`audits/2026-07-29/GoogleWorkspace_v2_8_5_R5_Transfer_Checksum_Portability_Correction_2026-07-29.md`.
The final independent re-audit and company-PC transfer-readiness record is
`audits/2026-07-29/GoogleWorkspace_v2_8_5_R5_Final_Independent_Reaudit_and_Company_PC_Transfer_Readiness_2026-07-29.md`.
The fixed P10 verification record is
`audits/2026-07-29/GoogleWorkspace_v2_8_5_P10_Fixed_Transfer_Ref_Verification_2026-07-29.md`;
the later evidence-only commit is not a transfer target.
The safe incident record for the superseding blocker is
`audits/2026-07-29/GoogleWorkspace_v2_8_6_Phase8B_Setup_Ledger_Visibility_Blocker_Incident_2026-07-29.md`.
The final T6.1 fresh-clone verification is
`audits/2026-07-29/GoogleWorkspace_v2_8_6_Phase8B_Sandbox_Retransfer_Fresh_Clone_Verification_2026-07-29.md`.
The v2.8.7 final detached-clone verification is
`audits/2026-07-30/GoogleWorkspace_v2_8_7_Phase8B_Sandbox_Retransfer_Fresh_Clone_Verification_2026-07-30.md`.
The v2.8.8 fixed-T8 detached-clone verification is
`audits/2026-07-30/GoogleWorkspace_v2_8_8_Phase8B_Sandbox_Retransfer_Fresh_Clone_Verification_2026-07-30.md`.
The v2.8.9 fixed-T9 detached-clone verification is
`audits/2026-07-30/GoogleWorkspace_v2_8_9_Fixed_T9_Fresh_Clone_Publication_Audit_2026-07-30.md`.
The v2.8.10 fixed-T10 detached-clone publication verification is
`audits/2026-07-31/GoogleWorkspace_v2_8_10_Fixed_T10_Fresh_Clone_Publication_Audit_2026-07-31.md`;
the evidence-only commit that contains it is not a transfer target.

## Historical R5 and 2.8.6 correction

| Area | State |
|---|---|
| High Calendar authority-loss findings | `REAUDIT-CAL-01` and `REAUDIT-CAL-02` are locally corrected: final ledger validator before I/O; durable arm; owned-event-only compensation; compensation preservation across later forced re-enqueue; foreign-event fail-closed behavior. |
| Task authority protocol | Protected hidden 21-column `Task Authority Ledger`; two-slot `PREPARED` / `COMMITTED`; 50 Task columns; 11 Sheets / hidden 5. |
| Calendar / Outbox | `DEADLINE_CALENDAR_ARMED` survives the external-I/O window; `DEADLINE_CALENDAR_AUTHORITY_COMPENSATION` survives failure, manual retry, and later authority-valid ineligible forced re-enqueue. |
| Historical source tests | R5/P10 evidence: 41 suite files; 611 PASS / 0 FAIL / 11 explicit real-Workspace/fake-runtime skips. |
| F016 fault injection | 12 PASS / 0 FAIL, including pre-I/O exclusion, post-I/O compensation, crash recovery, concurrent ineligibility, foreign Event refusal, manual retry-marker preservation, and forced re-enqueue preservation. |
| Static validation | `tools/validate_apps_script_v2.js`: 11/11 PASS; 22 `.gs` files. |
| R5 release packages | 8B: 27 files / 23 payload; 8C: 25 files / 22 payload; checksum, parity, allow-list, provenance, and secret scans PASS from the P6 fresh clone. |
| Historical company-PC transfer materials | P6 source/release proof, P8 canonical-text checksum portability proof, P9 final-head proof, and P10 fixed-ref verification PASS; P10 itself is now historical failed evidence and may not be used. |
| Corrected 2.8.6 final fresh clone | T6.1: 42 suites, 619 PASS / 0 FAIL / 11 explicit skips; F016 7/7; validator 11/11 over 22 `.gs`; 8B/8C verifier, parity, 27/27 allow-list, 26/26 package checksum, transfer checksum, secret/local-path scan, and remote consistency 8/8 PASS. |

The 2.8.6 correction makes Ledger protection and hidden visibility an explicit
Setup-owned, idempotent control-plane operation before hidden/protection
authority validation in S20.  S30 and completed-Setup reruns reassert it.  The
authority validator remains fail-closed and no raw row, note, or snapshot
fallback is added.  Local regression coverage includes fresh Setup, the
observed S00/S10 partial state, visibility/protection failure injection,
idempotent S30, completed rerun, and no-fallback checks.  Corrected-package
real Workspace retest remains `NOT_EXECUTED`.

## Gate and recovery boundary

The historical `PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER` prohibited reuse of the
old package and all real Workspace action while the corrected Source A6 /
Release B6 / transfer chain was created and independently verified. Automation
remains OFF. Do not manually hide the Ledger, continue Setup, or run
diagnostics with P10; preserve the failed workbook as evidence.

The normal-pushed T6.1, T7, T8, T9, T10, and T11 fixed refs passed their
respective historical verification and remain immutable evidence. T11 is
`T11_SUSPENDED`, not an active company carriage source. Instruction 0005 is
`SUPERSEDED_NOT_EXECUTED`; no five-file replacement or T1-01 re-observation
occurred. The current non-Google local validation, GitHub publication, and
current-head CI pass. Instruction 0010 then independently proved the strict
23-file canonical pull-back parity. Instructions 0011 and 0013 completed the
authorized runtime prerequisites and consumed their separately authorized
single attempts; the current result is `ATTEMPTED_FAILED_CLOSED` without a
bounded diagnostic body. No company Workspace action is authorized by this
status.

PR #9 records the earlier CI implementation against an older `main` baseline.
Its reviewed semantics are integrated as one current-branch workflow and were
rerun successfully on this branch. CI, local verification, clasp push,
pull-back parity, and runtime dry-run are tracked separately; an unexecuted
Google lane is never a PASS.
