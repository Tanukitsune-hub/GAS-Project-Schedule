# Google Workspace Instruction 0018 independent PR #11 re-audit evidence

Date: 2026-08-04 JST
Work ID: 0006 / Instruction 0018
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Branch: `codex/0008-remote-gas-development-bootstrap`
PR: #11 (Draft)
Base: `codex/0006-local-clasp-validation-gate`

## Selected outcome

`READY_FOR_GUARDED_AUTH_DIAGNOSTIC_DESIGN`

This is a static-review decision only. It does not authorize a Google call,
OAuth action, clasp operation, deployment, Workspace action, or another
`runQuickDiagnostic` invocation.

## Revision and PR basis

| Field | Verified value |
|---|---|
| Starting HEAD | `e2af19558756891bf4b2e59d82c2269711ce1b1e` |
| Remediation-reviewed HEAD | `c02b11f21923b86d0ddc87fb38606542c1a5224c` |
| Initial evidence-publication HEAD | `0eff57261d0cf5a6ac5b2b62ad34a5e4fbe854d0` |
| Guard-remediation HEAD | `07b34a0f6ef4c72af803f90f7e1018a34ebbbae5` |
| PR #11 base tip / merge base | `6ebe881075311722d5a1563511ca80936070bc67` |
| PR #11 state at review | Open / Draft / mergeable / unmerged |
| Parent PR #10 | Open / Draft; its head is the PR #11 base |
| PRs #8 and #9 | Open / Draft; outside this PR's direct base |
| PRs #12 and #13 | Merged to `main`; not ancestors of PR #11 |

The remote identity, target branch, upstream, expected starting HEAD, and clean
worktree were verified before editing. No merge, rebase, squash, force-push,
or history rewrite occurred in this work.

## Governance and scope re-audit

- Instruction 0017's removal remains effective: there are no tracked
  `.codex` files on PR #11 and no Luna/subagent delegation section in root
  `AGENTS.md`.
- The removed scope entered the branch through merge
  `bc38675ac99109b7a03375c4e76b0666876a2806`; the prior conclusion that it
  was not an ancestor merge of PR #12 or PR #13 remains supported.
- The PR delta also contains historical merge
  `e07d5c943b164356ba5a542dc4d216a381d75dbf`, from the recorded
  Instruction 0009 continuation branch. Neither merged PR #12 nor merged PR
  #13 is an ancestor of the current PR #11 head.
- Apps Script source, canonical `appsscript.json`, runtime tooling, ignored
  local state, and Instruction 0011 through 0015 evidence were preserved at
  the initial re-audit head. The later bounded local-tool remediation is
  recorded below; it does not alter Apps Script source, canonical
  `appsscript.json`, ignored local state, or historical attempt evidence.

Instruction 0015's statement that repository-local `.codex` definitions were
absent was contradicted at its final branch state, as Instruction 0017 already
recorded. Its narrower PR #12 non-incorporation claim remains ancestry-true but
incomplete; Instruction 0017 removed the matching governance content without
changing runtime evidence.

## Runtime and authorization reconstruction

| Instruction | Verified authority and result | Calls |
|---|---|---:|
| 0010 | Exact 23-file canonical pull-back parity; not a runtime diagnostic. | 0 |
| 0011 | Cloud/API/OAuth and overlay parity; one unbounded result closed `BLOCKED_BY_AUTH`. | 1 |
| 0013 | Versioned binding preflight; one `--nondev` result closed `REMOTE_QUICK_DIAGNOSTIC_FAILED_CLOSED` / `VERSIONED_RUNTIME_FUNCTION_NOT_FOUND`. | 1 |
| 0014 | Wrapper, lineage, and deployment-path correction; one result closed `BLOCKED_BY_AUTH` / `RUNTIME_AUTHORIZATION_REJECTED`. | 1 |
| 0015 | Named-profile refresh, scope/matrix/lineage guard; one result closed `BLOCKED_BY_AUTH` / `RUNTIME_AUTHORIZATION_REJECTED`. | 1 |
| 0017 | Governance-only audit; no runtime authority. | 0 |

Tracked evidence supports exactly `4` actual `runQuickDiagnostic` invocations:
one each under Instructions 0011, 0013, 0014, and 0015. Each instruction used
its own marker and closed its own retry allowance. No evidence supports an
extra invocation or an exceeded retry authority.

Verified facts: the canonical wrapper was present; 0014 corrected the
deployment-path binding; 0015 proved local named-profile refreshability,
required scope coverage, API-executable MYSELF deployment metadata, and the
separate one-use guard. Functional status remains
`ATTEMPTED_FAILED_CLOSED` / `REVIEW_REQUIRED`.

Inference: the remaining rejection is more consistent with a remote
execution-authorization layer than missing tracked source or the known 0013
path-binding defect. This is not a proven Google-side root cause.

Unknown: local and tracked evidence cannot expose container ownership or prove
the exact remote execution-permission layer. The 0015 matrix records the
boundary as `INCONCLUSIVE_NOT_EXPOSED_BY_APPS_SCRIPT_METADATA`.

## Code, test, and documentation findings

The runtime tool and non-Google regression suite were reviewed for marker
ordering, deployment-bound execution context, exact function name, overlay
parity, closed output records, classifier behavior, and retry refusal. The
following bounded local-tool defects were found after the first evidence
publication and remediated at `07b34a0f6ef4c72af803f90f7e1018a34ebbbae5`:

1. The legacy unversioned `test` / `test-runtime` entrypoint used the old
   Instruction 0011 marker and an unbound runtime workspace. If ignored local
   state were missing or recreated, it could bypass the separately closed
   0013–0015 marker, immutable-version, and deployment-bound execution guards.
   It now fails `RUNTIME_GENERIC_COMMAND_RETIRED` before a clasp or Google
   operation; both unversioned package aliases and their current execution
   instructions were removed.
2. The tracked identifier scan matched `scriptId` but not the
   `expected_script_id` field used by the safe example declaration. It now
   detects both fields while preserving documented placeholders as non-hits.

Both findings require a privileged local developer context and were remediated
as defense-in-depth runtime-safety and secret-hygiene gaps. They do not prove a
remote attacker path or alter functional runtime acceptance.

The earlier documentation/test remediation remains in place. Current status,
company-boundary, implementation README, validation-gate, local-clasp, and
visualization text now distinguish the 0014 execution-binding correction and
the 0015 authorization closure from runtime PASS. Regressions cover the
retired generic entrypoint, absent aliases, safe no-Google failure result,
`expected_script_id` placeholder handling, and the current visualization
closure fields.

No Apps Script source, canonical manifest, credential, ignored local state,
deployment binding, or historical attempt audit was changed. The runtime tool,
package command surface, non-Google validation gate, current-status documents,
and local regression tests were changed only as described above.

## Local evidence

At `07b34a0f6ef4c72af803f90f7e1018a34ebbbae5` on a clean committed tree:

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS; lockfile unchanged |
| `pnpm run verify:local` | PASS `11/11`; 52 suites; secret/local-path scan `0` hits |
| `node tests/local_validation_secret_scan_test.js` | PASS `13/13` |
| `node tests/canonical_document_consistency_test.js` | PASS `23/23` |
| `node tests/remote_gas_development_bootstrap_test.js` | PASS `38/38` |
| `node tools/local_clasp_dev.js self-test` | PASS `34/34` |
| `git diff --check` | PASS |

## CI evidence for guard-remediation head

The normal push of `07b34a0f6ef4c72af803f90f7e1018a34ebbbae5` completed both
required GitHub Actions executions successfully:

| Event | Run | Job | Result |
|---|---:|---:|---|
| push | `30833072509` | `91751498635` | `SUCCESS`; all 9 steps succeeded |
| pull request | `30833077383` | `91751514713` | `SUCCESS`; all 9 steps succeeded |

The locked-install and non-Google verification-gate log segments were inspected
without retaining raw log output. No required job or step was failed,
cancelled, skipped, or left unexecuted.

No Google, clasp remote, OAuth, deployment, Apps Script API, Workspace,
company, production, or real-data operation was performed.

## Agent evidence and limitation

Repository-local Luna definitions were not restored. Two native read-only
validation workers independently confirmed the generic-runtime and
`expected_script_id` findings before remediation. A native read-only auditor
then confirmed the corrected guard ordering, absent aliases, placeholder-safe
identifier scan, unchanged Apps Script source/manifest, and retained status
boundaries. It also correctly identified the stale statement in this audit
that said runtime tooling was unchanged; this addendum replaces that statement.

One exploratory worker returned a contradictory result outside its assigned
lineage scope. Main Codex did not rely on that result and independently
reconstructed the branch ancestry, scope, runtime-attempt sequence, diff, and
validation evidence. No agent performed Git writes, Google, clasp, OAuth,
deployment, Workspace, or real-data operations.

## Retained boundaries and minimum next decision

The gate remains `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` only as a readiness
boundary. It is not runtime acceptance. Automation remains OFF; T11 remains
`T11_SUSPENDED`; `NO_ACTIVE_COMPANY_TRANSFER` remains; company handoff remains
`NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW`.

The minimum next decision is a later, separately authorized guarded
authorization-diagnostic design to distinguish the remaining remote
execution-permission layer without reusing any closed attempt marker.

No local absolute path, credential, OAuth material, identifier, Workspace URL,
account detail, raw remote output, company data, personal data, or real data is
included in this evidence.
