# Work 0002 — Clean v2.8.12 Integration Candidate

## Outcome

Starting from the exact current `main` commit, create one clean, reviewable, locally reproducible integration candidate that carries forward the final Code `2.8.11-prepilot` product remediations and the locked local validation/CI tooling from the stacked Draft PR chain.

The integrated candidate must use:

- Code Version: `2.8.12-prepilot`
- Schema Version: `2.6`
- AI Schema Version: `2.0`
- Migration Version: `3`
- Highest permitted completion gate for this Work ID: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

This Work ID is complete only when the clean candidate is coherent on one branch, all required non-Google checks pass from a fresh clone, GitHub Actions passes, and the repository has one unambiguous current source/release contract. It must not claim runtime, Phase 8B overall, Phase 8C, pilot, production, company-handoff, or end-to-end acceptance.

## Why Codex is needed

This is Route C. The residual work requires local Git history inspection, selective porting across large diverged branches, implementation-aware conflict resolution, generation of deterministic release artifacts, execution of the Node/PowerShell validation toolchain, fresh-clone verification, and GitHub Actions evidence. These tasks require local/runtime access and executable validation.

## ChatGPT-completed work

ChatGPT has:

1. Adversarially reviewed current `main`, PR #8, PR #10, PR #11, current status documents, source/config, tests, release evidence, and Actions logs.
2. Recorded the audit result at commit `1346faa09c06694e2f567ebae88f996f03a7b990` in:
   - `audits/2026-08-08/0001_adversarial_end_to_end_readiness_review.md`
3. Determined that current `main` remains Code `2.8.4-prepilot` with known authority-integrity blockers, while the Code `2.8.11-prepilot` remediations and local CI exist only on stacked Draft PR branches.
4. Created this task branch from exact current `main` without modifying existing files.

Read the audit with:

```bash
git fetch origin audit/0001-adversarial-end-to-end-review
git show 1346faa09c06694e2f567ebae88f996f03a7b990:audits/2026-08-08/0001_adversarial_end_to_end_readiness_review.md
```

Do not edit or restate that audit file. Use it as the risk register for this integration.

## Exact starting point and task branch

Repository:

```text
Tanukitsune-hub/GAS-Project-Schedule
```

Required starting `main` commit:

```text
e2a7c683a7c0f7f1a865aec89a9e24ec56f830da
```

Task branch:

```text
codex/0002-clean-integration-candidate
```

The branch was created from the exact required starting commit. Confirm ancestry and synchronize safely before editing. Do not rebase the branch onto a later main without an updated handoff.

## Donor refs and evidence refs

Treat the following as read-only donor/evidence refs, not merge targets:

```text
PR #8 head / product-remediation history:
8596b1dd1b84eacd7abdd141c819ab9de3a8dc5a
branch: codex/r5-independent-reaudit-transfer-prep

PR #10 head / locked local validation and CI:
5daf04ddbb443f482b490905b48c3b1799da7641
branch: codex/0006-local-clasp-validation-gate

PR #11 head / latest cumulative development and fail-closed runtime tooling:
5a80ae1eb4d887356c1ddee0899a08a372de7ac8
branch: codex/0008-remote-gas-development-bootstrap

Historical fixed product lineage used by the existing local gate:
Source A11.1: aeca148415d70df625400e53d2281378adff60b4
Release B11: 952438907e1a09092a46127dc130b3403a911db4
Fixed T11: a3b5a5d8d851bf2d15a2738c54dc6bb31e231d33
```

Inspect history and file-level differences as needed, but do not merge, rebase, or cherry-pick the stacked PR branches wholesale. Port only the final current behavior and the tooling needed for this outcome.

## Required-now scope

### 1. Build a clean current source tree

Port the final Code 2.8.11 product behavior into the task branch and establish it as Code `2.8.12-prepilot`.

The current source must include, at minimum, the final reviewed behavior for:

- failure-recoverable Task authority ledger with explicit generation/state/hash semantics;
- no fallback that can regenerate trust from an editable live row or editable snapshot cell;
- row-level restore/quarantine behavior for multi-row edits so one corrupt authority record does not leave normal rows raw-modified;
- canonical restoration of Task internal-ID and Japanese-header rows;
- durable Calendar intent and authority-loss/outbox recovery, including enqueue/ack failure boundaries;
- Dashboard surface ownership checks and Google write-visibility handling, including required flush/reacquire/readback behavior;
- diagnostic bounded-summary behavior and fail-closed completeness checks;
- existing Gmail exact-message ordering/idempotency, Review/CAS, retry/dead-letter, privacy/redaction, and Automation-OFF guardrails.

Use the actual final donor source as the semantic reference. Do not redesign these mechanisms unless a material defect prevents clean integration.

### 2. Preserve current main governance

The following paths from starting `main` are authoritative and must remain byte-identical unless this handoff is updated:

```text
AGENTS.md
.codex/config.toml
.codex/agents/**
```

Do not port donor-branch governance, subagent, execution-metrics, or unrelated policy changes. If a donor test assumes old governance text, update or retire that test narrowly rather than changing current main governance.

### 3. Integrate the locked local validation path

Bring forward the smallest coherent locked validation and CI path from PR #10/#11, including as applicable:

```text
.github/workflows/ci.yml
implementation/GoogleSpreadsheet/package.json
implementation/GoogleSpreadsheet/pnpm-lock.yaml
implementation/GoogleSpreadsheet/tools/local_validation_gate.js
implementation/GoogleSpreadsheet/tools/local_clasp_dev.js
implementation/GoogleSpreadsheet/tests/ci_workflow_contract_test.js
implementation/GoogleSpreadsheet/tests/local_clasp_validation_gate_test.js
implementation/GoogleSpreadsheet/tests/local_validation_secret_scan_test.js
implementation/GoogleSpreadsheet/tests/canonical_document_consistency_test.js
```

Keep CI non-Google, read-only, locked, and free of credentials, secrets context, target IDs, clasp push, OAuth, deployment, or Workspace operations.

### 4. Create one unambiguous current contract

Update only active/current documents needed to make the candidate understandable and machine-checkable, including as applicable:

```text
README.md
CURRENT_STATUS.md
DECISIONS.md
PROJECT_CONTEXT.md
MASTER_PLAN.md
implementation/GoogleSpreadsheet/apps-script-v2/README.md
current protocol/runbook documents
current visualization metadata
```

Requirements:

- all active current-version references must resolve to `2.8.12-prepilot / 2.6 / 2.0 / 3`;
- the active gate must be no higher than `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`;
- `Automation` remains `OFF`;
- current docs must clearly state that live runtime, real Gmail/Calendar, real Provider, pilot, production, and company handoff remain unaccepted;
- historical documents remain historical and must not be rewritten to fit this task;
- there must be one machine-checkable active contract for version, schema, migration, source/release identity, and gate;
- stale active instructions that select an old transfer or old version must be removed from the active path or clearly marked historical.

### 5. Regenerate deterministic current release artifacts

Create a new clean release from the integrated source rather than copying old generated trees.

Preserve the established two-package model unless a focused check proves it cannot be retained safely:

- Phase 8B/prepilot package: `TEST_MODE=true`, Automation OFF, test harness included;
- Phase 8C candidate package: only the already accepted audited config transformation, `TEST_MODE=false`, test harness excluded, no provider or runtime GO claim.

Generate new deterministic checksums, manifests, parity/provenance verification, and release tooling for `2.8.12-prepilot`. Do not create or activate a company-PC transfer target in this Work ID.

Preferred commit sequence:

1. `A12` source/integration commit: source, tests, tools, CI, current docs; no new generated release package.
2. `B12` direct child release commit: generated release packages and the implementation/release report only.
3. Final evidence/report commit only if needed for `docs/handoffs/0002-report.md` and PR linkage.

Record exact SHAs and ancestry in the report. Do not force the sequence if a narrowly justified repository constraint requires one extra evidence commit, but preserve clear source-versus-generated-release separation.

### 6. Add focused adversarial regression coverage

Tests must execute the real integrated `.gs` source, not a reimplemented model. Add or preserve focused regressions for at least:

- row write succeeds and authority-ledger write fails;
- authority component is missing, stale, malformed, or generation-mismatched;
- live row plus editable snapshot are jointly tampered and cannot self-authorize;
- one corrupt row in a multi-row edit while normal rows are restored and the corrupt row is quarantined/fail-closed;
- Task internal-ID/header corruption and canonical restoration;
- Calendar intent enqueue/ack interruption and bounded recovery;
- Dashboard write/flush/reacquire/readback semantics in the strongest available local model;
- stale active version/gate/transfer documentation;
- release/source parity and current-contract consistency;
- secret, credential, real-ID, URL, local-path, and ignored clasp-state exclusion.

Do not weaken a fail-closed assertion merely to make the suite pass.

## Non-goals and deferred work

Do not perform or implement the following in Work 0002:

- any live Google Workspace, Apps Script API, OAuth, Cloud project, browser, Gmail, Calendar, Drive, Sheets, trigger, deployment, or clasp push/pull operation;
- runtime authorization probe, Quick Diagnostic, Deep Diagnostic, Dashboard refresh, or functional Sandbox acceptance;
- real AI Provider selection, transport implementation, credentials, approval workflow, or data-policy approval;
- Automation enablement or five-minute trigger creation;
- company-PC transfer, company handoff, production, pilot, or real-data use;
- merge or closure of PR #8, #9, #10, #11, or #15;
- wholesale import of historical release, transfer, archive, audit, instruction, or generated evidence trees;
- rewriting historical evidence or old reports;
- broad refactoring, dependency upgrades, architectural replacement, or unrelated cleanup;
- changes to root `AGENTS.md` or `.codex/**`.

The absence of a production AI Provider remains a later Work ID and must be stated as a remaining end-to-end BLOCKER. It does not block completion of this clean local integration outcome.

## Constraints and safety rules

- Follow root and nested `AGENTS.md`.
- Start by checking status, branch, remote, upstream, and exact ancestry. Fetch normally and fast-forward only when safe.
- Preserve unrelated work and Git history.
- No force push, reset, clean, history rewrite, merge to main, release publication, deployment, or external mutation.
- Do not store credentials, tokens, IDs, account data, private URLs, email bodies, personal data, raw provider errors, or machine-specific paths.
- Use synthetic fixtures and closed/redacted evidence only.
- Keep Apps Script V8/browser compatibility. Node-only APIs belong only in local tools/tests.
- Prefer direct selective porting and existing mechanisms. Avoid parallel systems and speculative abstractions.
- Do not silently lower any authority, privacy, ownership, version, release, or acceptance gate.

## Acceptance checks

All applicable checks below must pass at the final branch head.

### Repository and scope

- Task branch is descended from exact starting main `e2a7c683a7c0f7f1a865aec89a9e24ec56f830da`.
- No donor merge commit or wholesale stacked-branch merge is introduced.
- `AGENTS.md` and `.codex/**` are byte-identical to the starting main.
- Historical audit/release/transfer evidence is not rewritten.
- `git diff --check` passes.
- Worktree/index are clean after commit and push.

### Product and contract

- Integrated source reports `2.8.12-prepilot / 2.6 / 2.0 / 3` consistently.
- Known R4 authority/header blockers are absent from the integrated implementation and covered by focused regressions.
- Current active docs and machine checks select only the new candidate and no active old transfer.
- Automation remains OFF and no production/pilot/runtime claim is made.
- Real external AI remains unavailable/fail-closed and is explicitly deferred.

### Local executable validation

Run and record exact commands/results, including at minimum:

```bash
cd implementation/GoogleSpreadsheet
pnpm install --frozen-lockfile
pnpm run verify:local
```

The verification gate must cover:

- tracked JSON/YAML parsing;
- Apps Script payload inventory;
- static validator;
- every current `*_test.js` suite;
- current release package verifiers;
- source/release ancestry and parity;
- secret/credential/real-ID/local-path/ignored-clasp-state scan;
- generated/untracked-file cleanliness.

Also run focused suites directly where this makes failure evidence clearer.

### Release reproducibility

- Rebuild the `2.8.12-prepilot` packages from A12 and verify byte/parity/checksum/provenance contracts.
- B12 is a direct child of A12 and contains only generated release/report scope.
- Phase 8B and Phase 8C package inventories and transformations are explicitly recorded.
- No company transfer or active deployment target is created.

### Fresh-clone verification

From a new detached HTTPS clone at the final pushed head:

- install from the lockfile;
- rerun the complete local verification gate;
- rerun current release verifiers;
- confirm current contract and secret scan;
- confirm no untracked/generated residue.

### GitHub Actions

- Push the branch normally.
- Create or update one Draft PR to `main`.
- Required CI at the final PR head must complete successfully.
- Record workflow run and job IDs/conclusions in the report.
- Do not call a missing or untriggered check PASS.

## Git and PR requirements

Use the existing task branch:

```text
codex/0002-clean-integration-candidate
```

Create or update one Draft PR to `main` with a title similar to:

```text
0002: build clean v2.8.12 integration candidate
```

The PR body must link:

```text
docs/handoffs/0002-instruction.md
docs/handoffs/0002-report.md
```

The PR must summarize:

- exact starting main;
- donor refs inspected;
- selective-port strategy;
- A12/B12/final head SHAs;
- current gate;
- local and CI evidence;
- remaining runtime and Provider blockers;
- confirmation that no live Google or external operation occurred.

Keep the PR Draft and unmerged. Do not modify the old stacked PRs.

## Report requirement

Write and commit:

```text
docs/handoffs/0002-report.md
```

The report must contain:

- outcome and highest justified status;
- exact changed files grouped as source/tests/tools/CI/current docs/generated release/report;
- what was ported, rewritten, regenerated, deliberately omitted, or simplified;
- material decisions and assumptions;
- A12/B12/final commit ancestry;
- commands and exact validation/CI results;
- fresh-clone evidence;
- trial steps for the next controlled Sandbox Work ID;
- remaining limitations and deferred real-AI/runtime work;
- branch, commits, Draft PR;
- explicit `BLOCKER` status for this Work ID.

If all local integration acceptance checks pass, the Work 0002 BLOCKER status may be `NONE`, while the report must still state that project-level runtime/end-to-end blockers remain and the highest gate is only `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`.

## Stop and escalation conditions

Stop safely and report `BLOCKER` rather than broadening scope if any of the following occurs:

- the task branch is not safely descended from the exact starting ref;
- a required donor behavior cannot be identified or separated from unrelated scope;
- preserving current main governance would require unauthorized `AGENTS.md` or `.codex/**` changes;
- a material product invariant remains ambiguous after inspecting donor source/tests/history;
- local tests or release parity reveal a substantive unresolved implementation defect;
- completion would require a live Google/OAuth/deployment/credential operation;
- real identifiers, secrets, private data, or machine paths are found in tracked or proposed content;
- deterministic release generation or fresh-clone verification cannot be established;
- GitHub Actions cannot run or fails for a material reason that cannot be repaired within this scope.

Routine conflicts, stale generated files, test fixture updates, and bounded integration defects are not escalation conditions; resolve them in scope, rerun affected checks, and continue.

## Final Codex chat response

Return only:

```text
Work ID: 0002
Report: docs/handoffs/0002-report.md
Commit: <final commit SHA>
Branch: codex/0002-clean-integration-candidate
PR: <Draft PR URL/number>
BLOCKER: <NONE or concise blocker>
```
