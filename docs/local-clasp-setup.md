# Local clasp validation setup

## Purpose and boundary

This is a self-PC validation lane for Code `2.8.11-prepilot`. It may use
`clasp` only with a personal, synthetic, non-company development Apps Script
project. It is not a Company-PC transfer procedure, a deployment procedure,
or an authorization to operate a real Workspace.

Instruction 0005 is `SUPERSEDED_NOT_EXECUTED`. T11 is immutable historical
evidence but `T11_SUSPENDED`; there is `NO_ACTIVE_COMPANY_TRANSFER`.

The current development gate is `NO_GO_LOCAL_CLASP_VALIDATION`. Instruction
0007 completed local OAuth, target attestation/binding, the target guard, exact
23-file staging, and the pre-push status check, but the guarded push returned
`CLASP_PUSH_FAILED`. The API-disabled retry exception was not established, so
no retry, pull-back, or runtime call is permitted under that instruction.
Company handoff is `NO_GO_COMPANY_HANDOFF_LOCAL_VALIDATION_FAILURE`.

## Prerequisites

- Node.js 20 or later.
- The repository-local locked dependencies installed from
  `implementation/GoogleSpreadsheet/`.
- A personal synthetic development project created outside this repository.
- A local clasp login completed only on the self PC, if the operator elects to
  run the Google-authenticated lane.

Do not store an OAuth token, credential, API key, actual script ID, Company
identifier, URL, or data in the repository. `.clasp.json`, `.clasprc.json`,
`.clasp-dev/`, `.clasp-pull-verify/`, credential files, and local reports are
ignored and the local gate rejects them if tracked.

## Install and non-Google verification

Run these commands from `implementation/GoogleSpreadsheet/`:

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm run verify:local
pnpm run gas:stage:dev
```

`verify:local` runs JSON/YAML parsing, the Apps Script static validator, all
Node suites, the existing package/transfer verifiers, fixed-ref lineage, and
the strict tracked secret/local-path scan. It never calls clasp. `gas:stage:dev`
copies exactly the fixed 23-file Apps Script payload to ignored staging and
records only file hashes and counts.

## Local-only target declaration

Copy the two example files only into the ignored local development directory:

```text
.clasp.example.json                 -> .clasp-dev/.clasp.json
.clasp-dev.target.example.json      -> .clasp-dev/target.json
```

Set the same non-placeholder identifier in both local files. Set
`target_kind` exactly to `PERSONAL_SYNTHETIC_DEV`, keep `rootDir` as
`payload`, and leave `runtime_dry_run_allowed` false unless the runtime
prerequisites below are independently approved. The target guard rejects
placeholders, mismatches, non-synthetic target declarations, invalid IDs, and
an ID found in tracked content.

This declaration is an operator attestation, not independent proof that a
target is non-company. That limitation is `REVIEW_REQUIRED` and must be
recorded in any handoff evidence.

## Guarded clasp sequence

After `verify:local` passes and only on the self PC, use the explicit opt-in:

```powershell
$env:GAS_DEV_CLASP_ALLOWED = 'true'
pnpm run gas:status:dev
pnpm run gas:push:dev
pnpm run gas:pull-verify:dev
```

The target guard runs before the remote calls. `gas:push:dev` requires a clean
Git worktree and reruns the non-Google gate. `gas:pull-verify:dev` pulls to a
separate ignored directory and requires the exact 23-file set and byte-level
payload hash to match the staged source. A repeat run may remove only a
previously validated, ignored pull-back layout; unexpected files fail closed.

If local config is absent, record `DEV_TARGET_NOT_CONFIGURED`. If clasp login
or remote access is unavailable, record `BLOCKED_BY_AUTH` or the safe
operation-specific failure code. None of those outcomes is PASS.

The Instruction 0007 attempt is closed. Do not reuse the sequence below to
retry its failed push. A later governing instruction must first define the
failure investigation and a new safe attempt boundary.

## Optional safe runtime dry-run

The only candidate function is the existing `runQuickDiagnostic` read-only
contract. It remains `NOT_EXECUTED` unless all of the following are true:

- the target declaration explicitly enables runtime dry-run;
- the self-PC operator sets `GAS_DEV_RUNTIME_ALLOWED=true` in that terminal;
- the Apps Script API executable/runtime prerequisites have been independently
  configured for the personal synthetic project; and
- the returned bounded summary proves every listed side-effect Boolean false.

Run only after push/pull parity:

```powershell
$env:GAS_DEV_RUNTIME_ALLOWED = 'true'
pnpm run gas:test:dev
```

Do not create a deployment, alter the production manifest, configure a
provider, enable Automation or triggers, or use real Gmail, Calendar, Sheet,
or business data.

## Result classification

| Evidence | Maximum status |
|---|---|
| Local/CI non-Google check fails | `NO_GO_LOCAL_CLASP_VALIDATION` |
| Local and CI pass; clasp lane not run | `READY_FOR_LOCAL_CLASP_VALIDATION` |
| Push and pull-back parity pass; runtime not run | `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` |
| CI, local, push, pull-back, and safe runtime all pass | `READY_FOR_COMPANY_HANDOFF_REASSESSMENT` |

Every row still requires a separate company-handoff decision. It does not
declare Phase 8B PASS, Phase 8C GO, production readiness, or pilot readiness.
