# Remote-only authorization diagnostic design

## Status and boundary

Instruction 0019 completes only a repository-local design and synthetic-test
contract. Its selected outcome is
`REMOTE_ONLY_AUTH_DIAGNOSTIC_DESIGN_COMPLETE` when the tracked implementation,
local verification, CI, and PR update all pass.

This instruction does not authorize diagnostic execution. The only tracked
command added by this design is a disabled placeholder. It exits with:

```text
AUTH_DIAGNOSTIC_EXECUTION_NOT_AUTHORIZED
```

The placeholder does so without importing another module, reading an
environment variable, opening a file, loading OAuth or clasp state, or making
a network call. No operator PC action is needed before a later, separately
authorized Work ID begins.

## Primary specification requirements already recorded in the repository

Instruction 0019 did not connect to Google or refetch documentation. It uses
the primary-source review already preserved by Instructions 0014 and 0015:

- Apps Script `scripts.run` requires an API-executable deployment path; a
  deployed-version request uses the immutable deployment version rather than
  correcting an invalid path binding.
- The calling OAuth grant must cover the runtime manifest and execution API
  scopes.
- The calling client, standard Cloud project, Apps Script API enablement, and
  consent eligibility are distinct prerequisites.
- API-executable/MYSELF deployment visibility is not, by itself, proof that a
  specific OAuth principal has execution permission.
- Function presence, exact function-name binding, immutable-version lineage,
  principal permission, and script/container ownership are separate evidence
  layers.

The preserved primary references are the Apps Script
[`scripts.run` reference](https://developers.google.com/apps-script/api/reference/rest/v1/scripts/run),
the [execution guide](https://developers.google.com/apps-script/api/how-tos/execute),
the [deployment/version guide](https://developers.google.com/apps-script/concepts/deployments),
the [deployment API reference](https://developers.google.com/apps-script/api/reference/rest/v1/projects.deployments),
and the project-local `@google/clasp` 3.3.0 source reviewed under Instruction
0014. These references are cited from tracked evidence; they were not opened
during Instruction 0019.

## Closed evidence vocabulary

The local schema accepts only these statuses:

- `LOCALLY_ATTESTED`: an earlier tracked instruction records a closed local or
  metadata attestation. It is historical evidence, not a live recheck.
- `INFERRED`: tracked facts support a bounded inference but do not directly
  prove the requirement.
- `UNKNOWN_NOT_EXPOSED`: tracked evidence does not expose enough information
  to decide.

No schema field accepts a credential, token, account, email, project value,
script value, deployment value, URL, local path, raw response, or free-form
remote value.

## Instruction 0019 evidence matrix

| Requirement | Closed status | Repository-evidence basis |
|---|---|---|
| Named OAuth profile usability | `LOCALLY_ATTESTED` | Instruction 0015 recorded local presence and refreshability; no live profile was read here. |
| OAuth scope coverage | `LOCALLY_ATTESTED` | Instruction 0015 recorded zero missing runtime-manifest scopes and required execution API scope coverage. |
| Desktop client / Cloud project alignment | `LOCALLY_ATTESTED` | Instruction 0015 recorded local client/audience continuity and standard-project attestation. |
| OAuth Testing principal eligibility | `LOCALLY_ATTESTED` | Instruction 0015 recorded a closed refreshed-profile eligibility result. |
| Standard Cloud project linkage | `LOCALLY_ATTESTED` | Instruction 0015 recorded a local standard-project prerequisite attestation. |
| Apps Script API enablement in the selected project | `LOCALLY_ATTESTED` | Instruction 0015 recorded readable deployment metadata under the attested project boundary. |
| API-executable, versioned, MYSELF access metadata | `LOCALLY_ATTESTED` | Instructions 0014 and 0015 recorded this metadata and target binding. |
| OAuth principal execution permission | `INFERRED` | Profile/deployment binding passed, but the call was rejected; visibility is not execution permission. |
| Script-project ownership alignment | `UNKNOWN_NOT_EXPOSED` | The preserved metadata did not directly expose ownership. |
| Bound-container ownership alignment | `UNKNOWN_NOT_EXPOSED` | Instruction 0015 explicitly retained the ownership observability boundary. |
| Runtime function and immutable deployment lineage | `LOCALLY_ATTESTED` | Instruction 0014 proved wrapper presence, exact function name, pull-back parity, and deployment-bound lineage. |

This matrix has `8` locally attested, `1` inferred, and `2` unknown entries.
It does not identify a Google-side root cause. The highest safe classifier is
`REMOTE_AUTHORIZATION_LAYER_UNRESOLVED` with root cause
`NOT_PROVEN_BY_REPOSITORY_EVIDENCE`.

## Local implementation contract

The tracked implementation consists of:

- a JSON schema with a closed evidence envelope and one-use marker shape;
- a strict normalizer that rejects unknown fields and fills omitted evidence
  only with `UNKNOWN_NOT_EXPOSED`;
- a classifier that emits only safe enums, counts, and layer names;
- a decision tree that defers every real-environment question to a later Work
  ID while allowing this design to complete;
- a pure one-use marker planner that can only model the transition to
  `ATTEMPT_STARTED` and never performs a remote call; and
- a disabled standalone command that reaches no OAuth, clasp, Google, file,
  environment, or network interface.

The Instruction 0019 marker is permanently `NOT_AUTHORIZED`, `NOT_STARTED`,
and invocation count `0`. A synthetic future marker can model a single
transition only when it says a later tracked instruction authorized it and
all earlier attempt markers were preserved. The planner increments the count
to `1` at `ATTEMPT_STARTED`; a second start is refused. This is a design model,
not runtime authority.

## Future one-shot diagnostic flow

A later Work ID must explicitly authorize any real-environment work. It must
use a new ignored marker, preserve the Instruction 0011/0013/0014/0015
markers, and independently prove every required actual-environment preflight.
Only that later authority may bind a closed-safe preflight result to one exact
read-only function and mark `ATTEMPT_STARTED` before a remote call.

If the future call returns no bounded body, its marker must close after the
single call with a safe fail-closed category and no retry. If any precondition
is unavailable, no call is allowed. Real project, principal, ownership, and
deployment verification are intentionally outside Instruction 0019.

Until such a later Work ID starts, no user browser action, login, OAuth
consent, Cloud Console action, Apps Script UI action, credential entry, local
command, screen confirmation, or other operator PC work is required.

## Retained project boundaries

Functional runtime acceptance remains `ATTEMPTED_FAILED_CLOSED` and
`REVIEW_REQUIRED`. The development gate remains only a readiness boundary.
Automation remains OFF; company handoff, production, pilot, company transfer,
and company Workspace authorization remain not established.
