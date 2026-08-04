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

## Instruction 0020 architecture completion

Instruction 0020 extends the repository-only design without adding a request
client, an OAuth reader, a clasp command, a probe source file, or any other
Google-facing execution path. The choices in this section are an architecture
contract for a later separately authorized Work ID; they are not permission to
make a call now.

### Selected future transport: Direct REST `scripts.run`

The sole selected future transport is `DIRECT_REST_SCRIPTS_RUN`. The rejected
alternative is `CLASP_3_3_0_RUN_FUNCTION`.

| Concern | Direct REST contract | Rejected clasp 3.3.0 path |
|---|---|---|
| Target meaning | A future request must carry a typed API-executable deployment target and reject a Script ID substitute. | `run-function` reads the configured `scriptId` key; the key name obscures the separately verified deployment-target semantic. |
| Status observation | A future client can normalize one HTTP status and one Google API status before discarding the body. | The CLI maps errors and, with JSON output, exposes result/error fields including details. |
| Version selection | The future contract binds one immutable deployment and uses deployed-version (`devMode = false`) semantics with no HEAD fallback. | `--nondev` only selects `devMode = false`; it does not correct an execution-path binding. |
| One-call boundary | The future marker is persisted before exactly one client dispatch attempt. A timeout can never prove server receipt; no retry is permitted. | One-call enforcement remains external to the CLI and depends on workspace/config interpretation. |
| Configuration dependency | The future typed request contract does not read clasp configuration. | It relies on active clasp project configuration and its field naming. |
| Leakage surface | The future design retains only a response hash and closed fields. | CLI stdout/stderr requires an additional capture/redaction boundary. |

The preserved primary-source finding and local package-source inspection settle
the **semantic** distinction: the request path must be the API-executable
deployment target, even though the clasp configuration key is named
`scriptId`. `execution_api_target_semantics` is therefore a mandatory Stage A
field that is `DIRECTLY_VERIFIED` by the tracked source record. This does not
prove a real target binding. A later source- and target-specific preflight
must independently make the actual immutable deployment binding
`DIRECTLY_VERIFIED`; a Script-ID-shaped substitute is a closed no-call result.

### Selected first probe: ignored overlay constant authorization probe

The first future probe is
`IGNORED_RUNTIME_OVERLAY_CONSTANT_AUTHORIZATION_PROBE`; the rejected first
probe is `RUN_QUICK_DIAGNOSTIC`.

The selected probe exists only in a future ignored development runtime overlay.
It must return a fixed, closed contract with all side-effects false. Before a
call, a later Work ID must prove the overlay staging inventory, immutable
version/deployment lineage, and independent immutable-version pull-back. It
must also define removal/cleanup as a separately reviewed overlay operation.
No canonical Apps Script source or canonical `appsscript.json` change is part
of this design.

| Concern | Selected ignored overlay constant probe | Rejected `runQuickDiagnostic` first probe |
|---|---|---|
| Source isolation | Exists only in a future ignored runtime overlay; canonical source stays unchanged. | Uses application code and its dependencies. |
| Side effects | Fixed closed return requires all side-effects false. | Application-level behavior can make a narrow authorization result ambiguous. |
| Parity and lineage | Requires staged, HEAD, and immutable-version pull-back proof before use. | Existing wrapper proof is preserved but does not isolate authorization. |
| Script-start evidence | Its closed return can distinguish script start from a pre-start rejection. | A missing bounded result cannot distinguish application failure from authorization. |
| Cleanup boundary | Overlay removal is separately reviewed and never implicit. | No temporary source to remove, but it is not the isolated first probe. |

`runQuickDiagnostic` is rejected for the first authorization probe because its
application dependencies could obscure whether a failure happened before
script start, during authorization, or inside application logic. A successful
constant probe proves only its narrow probe contract; it must not automatically
invoke `runQuickDiagnostic` or promote functional runtime acceptance.

### Stage A: closed no-call preflight

Stage A is a local decision model. It uses only these closed evidence states:
`DIRECTLY_VERIFIED`, `LOCALLY_ATTESTED`, `INFERRED`,
`UNKNOWN_NOT_EXPOSED`, and `CONTRADICTED`.

| Mandatory field | Current evidence boundary | Required before a later call |
|---|---|---|
| OAuth client / standard Cloud-project equality | Historical local attestation only | `DIRECTLY_VERIFIED` |
| Apps Script API enabled for that selected project | Historical local attestation only | `DIRECTLY_VERIFIED` |
| OAuth audience / client equality | Historical local attestation only | `DIRECTLY_VERIFIED` |
| Required scope coverage | Historical local attestation only | `DIRECTLY_VERIFIED` |
| Token-validity threshold | Historical local attestation only | `DIRECTLY_VERIFIED` |
| OAuth principal / MYSELF identity equality | Inferred, not execution proof | `DIRECTLY_VERIFIED` |
| Immutable API-executable deployment binding | Historical local attestation only | `DIRECTLY_VERIFIED` |
| Target is API-executable deployment, never Script ID | Historical local binding attestation only | `DIRECTLY_VERIFIED` |
| Execution API target-identifier semantics | `DIRECTLY_VERIFIED` by tracked primary/package source | `DIRECTLY_VERIFIED` |
| Function and immutable-version lineage | Historical local attestation only | `DIRECTLY_VERIFIED` |
| Script-project ownership evidence | `UNKNOWN_NOT_EXPOSED` | `DIRECTLY_VERIFIED` |
| Bound-container ownership evidence | `UNKNOWN_NOT_EXPOSED` | `DIRECTLY_VERIFIED` |
| No unsupported cross-domain, transfer, or Shared Drive condition | `UNKNOWN_NOT_EXPOSED` | `DIRECTLY_VERIFIED` |
| Instruction 0011/0013/0014/0015 markers preserved | Historical local attestation only | `DIRECTLY_VERIFIED` |

For architecture completion, actual-environment fields may remain historical,
inferred, unknown, or contradicted. For execution, **all** mandatory fields
must be freshly `DIRECTLY_VERIFIED`; no `LOCALLY_ATTESTED` historical result is
sufficient. Any other state produces a closed no-call decision. In particular,
ownership or transfer uncertainty yields
`AUTH_DIAGNOSTIC_PREFLIGHT_OWNERSHIP_INCONCLUSIVE`, and a Script-ID substitute
or a future contradiction of the target semantics yields
`AUTH_DIAGNOSTIC_PREFLIGHT_DEPLOYMENT_TARGET_INVALID`.

### Stage B: exactly-one modeled attempt

A later separately authorized Work ID must create an ignored marker containing
only closed contract values. The marker must prove all of the following before
its single dispatch point can be designed:

- its own separate-work authorization, the complete Stage A all-direct
  closed-status snapshot, and a SHA-256 fingerprint of that snapshot;
- preservation of the four prior attempt markers;
- one exact immutable API-executable deployment target, never a Script ID,
  represented in the ignored marker only by a SHA-256 binding fingerprint;
- `DIRECT_REST_SCRIPTS_RUN`, the selected ignored-overlay probe, and
  `executionApi.access = MYSELF`;
- `ATTEMPT_STARTED` persisted before dispatch and invocation count exactly one;
- no fallback to HEAD, another function, another target, or
  `runQuickDiagnostic` after a probe result; and
- marker closure after every result with retry permanently false.

The ignored marker also carries a non-identifying SHA-256 fingerprint for its
separate Work-ID authorization record. The tracked model deterministically
recomputes the Stage A snapshot fingerprint before accepting a start. It only
uses the local standard SHA-256 primitive and never reads credentials, files,
environment state, or a network. The tracked planner only models these
transitions. It always reports that no remote call was performed. A start after either `ATTEMPT_STARTED` or
`ATTEMPT_CLOSED` is rejected, including after a synthetic probe-pass result.

### Closed response contract

The future response contract permits only these output fields:

- `contract_version`, `attempt_state`, `http_status`, `google_api_status`,
  `normalized_reason`, and `response_sha256`;
- `operation_object_returned`, `script_started`,
  `probe_contract_returned`, `all_side_effects_false`, and
  `retry_permitted`; and
- `elapsed_time_bucket`.

It rejects raw bodies, raw error text, stacks, identifiers, URLs, email or
account values, project/deployment values, tokens, local paths, and all
free-form fields. `retry_permitted` is always `false`.

| Closed classification | Meaning |
|---|---|
| `AUTH_DIAGNOSTIC_PREFLIGHT_PROJECT_MISMATCH` | Required project/client evidence is contradicted. |
| `AUTH_DIAGNOSTIC_PREFLIGHT_PRINCIPAL_MISMATCH` | Required principal/MYSELF evidence is contradicted. |
| `AUTH_DIAGNOSTIC_PREFLIGHT_OWNERSHIP_INCONCLUSIVE` | Ownership, transfer, cross-domain, or Shared Drive proof is not direct. |
| `AUTH_DIAGNOSTIC_PREFLIGHT_DEPLOYMENT_TARGET_INVALID` | The typed execution target is not the verified API-executable deployment target. |
| `AUTH_DIAGNOSTIC_TOKEN_INVALID_OR_EXPIRED` | Token validity is contradicted. |
| `AUTH_DIAGNOSTIC_COMMON_CLOUD_PROJECT_REJECTED` | The selected project boundary is contradicted. |
| `AUTH_DIAGNOSTIC_CALLER_NOT_PERMITTED` | A normalized authorization response denies the caller. |
| `AUTH_DIAGNOSTIC_DEPLOYMENT_NOT_FOUND` | A normalized response cannot find the immutable deployment. |
| `AUTH_DIAGNOSTIC_SCRIPT_NOT_STARTED` | The response does not prove script start. |
| `AUTH_DIAGNOSTIC_SCRIPT_RUNTIME_ERROR` | Script start is proven but the probe contract is absent. |
| `AUTH_DIAGNOSTIC_PROBE_PASS_NOT_FUNCTIONAL_ACCEPTANCE` | The constant probe returned its contract with all side-effects false. |
| `AUTH_DIAGNOSTIC_UNKNOWN_FAILED_CLOSED` | Any unmodeled or incomplete result. |

The architecture adds synthetic schema, fixture, normalizer, classifier, and
marker-state tests for these rules. It does not add a transport implementation
or a runnable probe.

## Instruction 0021 Stage A0 direct-verification closure

Instruction 0021 adds a separate synthetic Stage A0 evidence schema and
decision model for the target-attestation fields that are more specific than
the original architecture model: personal/synthetic/non-company target,
intended bound sandbox, Automation OFF, and TEST_MODE true where applicable.
It keeps the existing mandatory project, identity, deployment, ownership, and
prior-marker requirements.

The current official API surface proves the transport semantic but does not
expose the actual Apps Script/standard Cloud-project linkage or the identity
of the user who created an existing MYSELF API-executable deployment. Project
creator metadata is not a substitute for either field. Drive metadata can at
most provide current ownership, shared-drive state, and a pending-owner
observation when authorized; it is not a complete ownership-transfer history.

Therefore the actual Stage A0 result is
`STAGE_A_BLOCKED_NEEDS_OPERATOR_OR_PLATFORM_EVIDENCE`, with no ignored
credential/profile/binding read and no Google metadata operation. The synthetic
model has `1` directly verified transport-semantic field, `12` locally
attested historical fields, and `5` unavailable fields. It blocks target
mutation, overlay staging, version/deployment creation, Stage B marker
creation, `scripts.run`, clasp run-function, and every function invocation.

The all-direct fixture remains only a structural test: it does not establish a
real target, authorize a mutation, or create a Stage A snapshot. Any later
instruction must resolve the platform-evidence conflict through an explicitly
reviewed architecture decision before it can treat a Stage A snapshot as
all-direct.
