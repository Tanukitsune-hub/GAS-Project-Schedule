# Google Workspace Instruction 0014 Runtime Function Availability Root-Cause Evidence

Date: 2026-08-03
Work ID: 0003
Instruction: 0014
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Branch: `codex/0008-remote-gas-development-bootstrap`
Primary PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/11`

## Closed outcome

`RUNTIME_QUICK_DIAGNOSTIC_FAILED_CLOSED`

- Functional runtime acceptance: `ATTEMPTED_FAILED_CLOSED`
- Review state: `REVIEW_REQUIRED`
- Closed category: `BLOCKED_BY_AUTH`
- Safe subtype: `RUNTIME_AUTHORIZATION_REJECTED`
- Bounded diagnostic body: `NOT_RETURNED`
- Instruction 0014 diagnostic calls: exactly `1`
- Further Instruction 0014 retry: `PROHIBITED`
- Automation: `OFF`
- Company handoff: `NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW`
- T11: `T11_SUSPENDED`
- Transfer path: `NO_ACTIVE_COMPANY_TRANSFER`

This result is not Phase 8B overall PASS, Phase 8C GO, production-ready,
pilot-ready, company-handoff-ready, or company-transfer authorization.

## Repository and relocation safety

The relocated checkout was fetched and fast-forwarded normally to handoff
commit `a784977d8f66adee343219f9c519a30129b47e79`. Repository identity, origin,
branch, upstream HEAD, clean worktree, and PR #11 Open/Draft/unmerged state
matched the instruction. The active checkout is local and has no OneDrive
dependency. No local path is retained in this evidence.

PR #12 remained separate and merged to `main`; it was not merged or
cherry-picked into PR #11. PRs #8 through #11 remained Open/Draft/unmerged.
The active branch had no authoritative `.codex` definitions, so no delegated
agent changed files or made runtime, Git, PR, or acceptance decisions.

## Required reading and context

Repository rules, canonical status documents, instructions 0006 through 0014
available on this branch, associated audits, local clasp/runtime tooling and
tests, and PR #8 through #12 metadata/comments/refs/runs/jobs/steps were
reviewed before runtime work. Instruction 0012 was absent from this branch and
was treated as the separate PR #12 scope. `CONTRIBUTING.md` was absent;
`CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md` was present and followed.

## Verified root cause and separated inference

Verified facts:

1. Canonical, staged runtime, independent runtime HEAD pull-back, and the
   subsequently created immutable-version pull-back all contain one top-level
   callable `runQuickDiagnostic` wrapper.
2. `allowedRuntimeFunction`, target configuration, command construction, and
   parser expectation all equal `runQuickDiagnostic` exactly.
3. Project-local clasp 3.3.0 sets `devMode` to false for `--nondev`, passes the
   requested function name unchanged, obtains the `scripts.run` path value
   from the active `.clasp.json` project configuration, and does not consume
   the separately stored runtime deployment binding.
4. The Apps Script API `scripts.run` path requires an API-executable deployment
   ID. `devMode=false` selects the deployed immutable version; it does not
   replace an incorrect path binding.
5. Instruction 0013 proved that a deployment was visible, but its command used
   the project-bound runtime workspace. Visibility therefore did not prove
   that the call selected the visible versioned deployment.

The supported root-cause conclusion is an incorrect execution-context binding
in the Instruction 0013 guard, not missing tracked source. This conclusion is
based on the exact local package implementation and primary API semantics. The
historical remote request cannot be replayed, and no inference is made from
unpublished raw output beyond its preserved closed category/hash.

Primary references:

- `https://developers.google.com/apps-script/api/reference/rest/v1/scripts/run`
- `https://developers.google.com/apps-script/api/how-tos/execute`
- `https://developers.google.com/apps-script/concepts/deployments`
- project-local `@google/clasp` 3.3.0 package source

## Guard remediation

Commit `8045a6db5af3a98f47d137c742a25f9691255ab6` added the Instruction 0014
guard without modifying canonical Apps Script source or canonical
`appsscript.json`. The guard now requires:

- preserved Instruction 0011 and 0013 attempt evidence;
- a separate ignored Instruction 0014 marker;
- top-level callable-wrapper proof in staged and independent pulled payloads;
- exact function-name consistency;
- clasp package-source execution-semantics proof;
- fresh HEAD pull-back parity before deployment;
- one fresh MYSELF-only immutable version/deployment;
- exact version-number pull-back parity and wrapper proof;
- deployment visibility matching the newly created version;
- a separate ignored execution configuration bound to that API-executable
  deployment; and
- an `ATTEMPT_STARTED` marker before the sole runtime call.

## Closed preflight evidence

| Evidence | Result |
|---|---|
| Local marker prepared | `PASS` |
| 0011 attempt preserved | `true` |
| 0013 attempt preserved | `true` |
| Staged top-level wrapper | `true` |
| Independent HEAD pull-back wrapper | `true` |
| HEAD pull-back payload parity | `PASS` |
| Runtime file count | `23` |
| Runtime payload SHA-256 | `5524d8412d79bbe8a9b77c916ec1132507b931a1c0b7dbb852eaafe991b74e7a` |
| Runtime overlay access | `MYSELF` |
| Fresh immutable version created | `true` |
| Fresh versioned deployment created | `true` |
| Exact immutable-version pull-back parity | `PASS` |
| Immutable-version wrapper | `true` |
| Fresh deployment/version match visible | `true` |
| Deployment-bound `scripts.run` context | `PASS` |
| Diagnostic during preflight | `NOT_EXECUTED` |

Raw clasp output and identifiers remain only in ignored local operation
records. Their closed output SHA-256 values are:

- HEAD pull-back: `4662d27e4ab2c6380b7551eeb610c91db4add62778ec2eb2c4c4341198bd8128`
- fresh deployment: `b0efe0cd9678cc83b1e0547f5a61b1f4277cbd15679f7d078542b90b93869a7a`
- immutable-version pull-back: `a24b8cd1b72fae304f309926c14b85cc28db88cedb4169f1294029b36b1e8c01`
- deployment lineage: `bfa3c7773f2bd08a2f9d9a3aab24687dda1fb773e151f9a7fbc80f2d29e64a70`

## Sole runtime call

After every precondition passed, the guard wrote the Instruction 0014
`ATTEMPT_STARTED` marker and invoked only `runQuickDiagnostic` once with
`--nondev` against the deployment-bound execution context. It returned no
bounded diagnostic body.

| Field | Closed value |
|---|---|
| Operation | `test-runtime-0014` |
| Operation status | `BLOCKED_BY_AUTH` |
| Overall Instruction 0014 result | `RUNTIME_QUICK_DIAGNOSTIC_FAILED_CLOSED` |
| Safe subtype | `RUNTIME_AUTHORIZATION_REJECTED` |
| Deployed-version mode | `true` |
| Execution binding | `API_EXECUTABLE_DEPLOYMENT` |
| Function | `runQuickDiagnostic` |
| Output SHA-256 | `33cd87c5c67945ac30b8e9f73346aa992574f03d7763faa24619a2de12ecb24d` |
| Raw-output hash match | `true` |
| Retry | `PROHIBITED` |

No Deep Diagnostic, Dashboard refresh, Task edit, Gmail import, Calendar
reconciliation, Automation, Migration, Test Harness, external provider,
company-PC, company-Workspace, production, or real-data operation occurred.

## Local and CI validation

- `pnpm install --frozen-lockfile`: PASS, lockfile unchanged.
- `pnpm run verify:local`: PASS `11/11`; 52 Node suites; secret/local-path scan
  `0` hits.
- `node tests/canonical_document_consistency_test.js`: PASS.
- `node tests/remote_gas_development_bootstrap_test.js`: PASS `37/37`.
- `node tools/local_clasp_dev.js self-test`: PASS `31/31`.
- Guard push CI run `30769252751`, job `91553385030`: SUCCESS; every setup,
  checkout, Node, Corepack, locked-install, non-Google verification, post, and
  completion step succeeded.
- Guard pull-request CI run `30769254418`, job `91553389113`: SUCCESS; every
  required step succeeded.

The final evidence push and pull-request runs are inspected after publication
and reported in the PR/final report; no required step may fail, be cancelled,
skipped, or remain unexecuted.

## Information boundary

No local absolute path, Script ID, deployment ID, Workspace URL, account
detail, OAuth material, credential, raw clasp output, company data, personal
data, or real data is included in this evidence or any tracked change. The
canonical Apps Script source, canonical manifest, Automation default, fixed
historical transfer evidence, and company boundary were not changed.
