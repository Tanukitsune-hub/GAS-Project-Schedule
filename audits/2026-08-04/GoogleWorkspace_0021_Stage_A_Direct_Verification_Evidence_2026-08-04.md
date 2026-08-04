# Google Workspace Instruction 0021 Stage A direct-verification evidence

Date: 2026-08-04 JST
Work ID: 0009 / Instruction 0021
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Branch: `codex/0008-remote-gas-development-bootstrap`
PR: #11 (Draft)

## Revision basis

| Field | Value |
|---|---|
| Starting HEAD | `b256c6cb99b831a662f05919fca3096ed320b4e8` |
| Final HEAD | Recorded after normal publication and CI verification in the Work ID 0009 completion report and PR comment. |
| Base | `codex/0006-local-clasp-validation-gate` |
| Starting worktree | Clean |

## Stage A0 closed result

`STAGE_A_BLOCKED_NEEDS_OPERATOR_OR_PLATFORM_EVIDENCE`

The block was established before reading ignored OAuth credentials, ignored
target bindings, ignored operation records, or Google target metadata. No
target mutation could add useful evidence while two mandatory direct proofs
are unavailable through the permitted metadata surfaces.

| Evidence state | Count |
|---|---:|
| `DIRECTLY_VERIFIED` | 1 |
| `LOCALLY_ATTESTED` | 12 |
| `INFERRED` | 0 |
| `UNKNOWN_NOT_EXPOSED` | 5 |
| `CONTRADICTED` | 0 |

The one direct field is the API target semantic: `scripts.run` requires an
API-executable deployment ID, not a Script ID. The twelve local attestations
are historical target, Automation/TEST_MODE, OAuth/API, deployment/lineage,
and prior-marker evidence; none is treated as a fresh direct proof.

The five unavailable mandatory fields are the actual Apps Script/standard
Cloud project linkage, OAuth-principal/MYSELF deployer equality, script owner,
bound-container owner, and the absence of unsupported cross-domain/transfer/
Shared Drive conditions. The first two are platform-surface limitations even
before any target-specific read is attempted. Current owner or pending-owner
metadata would not supply complete ownership-transfer history.

## Verified facts and non-inferences

- The Apps Script `scripts.run` reference names an API-executable deployment
  ID as the request target.
- The Deployment resource states that `MYSELF` means the deploying user only,
  but does not return that deployer's identity.
- The Project resource can return an original creator and a bound parent but
  does not return the associated standard Cloud project.
- Drive file and permission metadata can describe some present ownership and
  pending-owner state when separately authorized, but not a complete transfer
  history.

No script creator, current owner, principal, account, target, project,
deployment, or container value is inferred or retained. These limitations do
not identify a Google-side root cause for the historical failed diagnostics.

## Primary-source and package-source basis

- [Apps Script `scripts.run` reference](https://developers.google.com/apps-script/api/reference/rest/v1/scripts/run)
  defines the API-executable deployment target.
- [Apps Script deployment resource](https://developers.google.com/apps-script/api/reference/rest/v1/projects.deployments)
  defines `MYSELF` without returning a deployer identity.
- [Apps Script project resource](https://developers.google.com/apps-script/api/reference/rest/v1/projects)
  defines the original creator and optional bound parent, not standard-project
  linkage.
- [Apps Script Cloud-project guidance](https://developers.google.com/apps-script/guides/cloud-platform-projects)
  identifies the shared standard-project requirement for `scripts.run`.
- [Drive file](https://developers.google.com/workspace/drive/api/reference/rest/v3/files)
  and [permission](https://developers.google.com/workspace/drive/api/reference/rest/v3/permissions)
  resources describe current owner/shared-drive/pending-owner observations.
- The installed project-local `@google/clasp` 3.3.0 source was read only to
  reconfirm that its rejected run-function route passes the configured project
  value to `scripts.run`; it was not invoked.

## No-call and mutation boundary

| Operation | Result |
|---|---|
| Ignored OAuth/profile read or refresh | `NOT_EXECUTED` |
| Ignored target/operation-record read | `NOT_EXECUTED` |
| Google metadata operation | `NOT_EXECUTED` |
| Probe source creation or staging | `NOT_EXECUTED` |
| Push/pull/version/deployment mutation | `NOT_EXECUTED` |
| Stage B marker | `NOT_STARTED` |
| `scripts.run` / clasp run-function / any function | `NOT_EXECUTED` |

Stage A snapshot SHA-256 is `NOT_AVAILABLE_NOT_ALL_DIRECT`; an all-direct
snapshot was never eligible for creation. Instructions 0011, 0013, 0014, and
0015 markers were not read, changed, reset, or reused.

## Safe remediation

The tracked Stage A0 synthetic schema, pure normalizer/classifier, fixtures,
and regression suite make these unavailable platform fields an explicit
no-mutation decision. The existing disabled placeholder remains unchanged and
continues to return `AUTH_DIAGNOSTIC_EXECUTION_NOT_AUTHORIZED` before any
environment, file, credential, OAuth, clasp, Google-client, or network access.

## Local validation and publication boundary

On the clean committed Stage A0 contract tree, all required local checks passed:

| Check | Result |
|---|---|
| `pnpm install --frozen-lockfile` | `PASS`; lockfile unchanged |
| `pnpm run verify:local` | `11/11 PASS`; `55` Node suites |
| Stage A0 synthetic contract | `8/8 PASS` |
| Instruction 0019 disabled placeholder | `12/12 PASS` |
| Instruction 0020 architecture | `15/15 PASS` |
| Secret/credential/identifier/local-path scan | `13/13 PASS`; `0` changed-text hits |
| Canonical-document consistency | `23/23 PASS` |
| Remote GAS bootstrap synthetic regression | `38/38 PASS` |
| Local clasp self-test | `34/34 PASS` |
| `git diff --check` | `PASS` |

All listed tests are local and non-Google. The Stage A0 module has no
environment, filesystem, OAuth, clasp, Google-client, HTTP, or network path.
Normal publication and the final push/pull-request CI are recorded only after
they complete. No CI job may use Google credentials, OAuth state, clasp remote,
or a Google API.

## Retained boundaries

Functional runtime acceptance remains `ATTEMPTED_FAILED_CLOSED` /
`REVIEW_REQUIRED`; Automation remains OFF; T11 remains `T11_SUSPENDED`; and
company handoff remains
`NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW`. No production,
pilot, Phase 8B overall PASS, Phase 8C GO, company transfer, company Workspace
authorization, company data, personal data, or real data operation occurred.
No user browser, console, credential, or other PC interaction was requested or
performed.
