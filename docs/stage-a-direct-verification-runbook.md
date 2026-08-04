# Stage A direct-verification runbook

## Scope

This is the no-call Stage A0 contract introduced by Instruction 0021. It is a
closed evidence and decision contract, not a runtime client or an instruction
to operate a browser, Cloud Console, Apps Script UI, or local credentials.

The tracked synthetic schema is
`implementation/GoogleSpreadsheet/schemas/stage-a-direct-verification-v1.schema.json`.
It accepts no identifiers, account values, credentials, tokens, URLs, local
paths, raw API output, or free-form evidence.

## Mandatory evidence

Every field must be `DIRECTLY_VERIFIED` before an ignored probe can be staged:

- target is personal, synthetic, and non-company;
- target is the intended bound sandbox;
- Automation is OFF;
- TEST_MODE is true where applicable;
- OAuth client and Apps Script standard Cloud project are equal;
- Apps Script API is enabled for that exact project;
- OAuth audience/client, scopes, token lifetime, and principal are valid;
- the OAuth principal equals the user permitted by the MYSELF deployment;
- one immutable API-executable deployment is the typed execution target, never
  a Script ID;
- function/version lineage and the target semantics are proved;
- script and bound-container ownership are proved;
- no unsupported cross-domain, ownership-transfer, or Shared Drive condition
  exists; and
- Instructions 0011, 0013, 0014, and 0015 attempt evidence is preserved.

## Direct-verification feasibility boundary

Current official resource definitions establish these limits:

- The Apps Script Project resource can expose an original creator and a bound
  parent, but it does not expose the standard Cloud project association.
- The Apps Script Deployment resource exposes API-executable access, version,
  and script binding. `MYSELF` means the deploying user only, but the resource
  does not expose that deployer's identity.
- Drive metadata can conditionally expose a current file owner and shared-drive
  state; permission metadata can conditionally expose a pending owner. Neither
  is a complete historical ownership-transfer record.

Consequently, a creator, current owner, deployment visibility, or matching
OAuth principal must never be substituted for the missing actual standard-
project linkage or deployment-deployer identity. A non-direct result is a
closed stop, not a reason to broaden permissions or create a deployment.

The transport semantic is separately `DIRECTLY_VERIFIED`: `scripts.run` uses
an API-executable deployment ID as its path target. This proves the API
contract, not an actual local binding.

## Decision and mutation rule

Use only the closed vocabulary `DIRECTLY_VERIFIED`, `LOCALLY_ATTESTED`,
`INFERRED`, `UNKNOWN_NOT_EXPOSED`, and `CONTRADICTED`.

Any non-direct value selects
`STAGE_A_BLOCKED_NEEDS_OPERATOR_OR_PLATFORM_EVIDENCE`; any contradiction
selects `STAGE_A_FAILED_CLOSED`. In both cases all of the following remain
false or unstarted: target mutation, probe staging, immutable deployment
creation, Stage B marker, `scripts.run`, clasp run-function, and function
invocation.

An all-direct synthetic decision only models readiness for a later separately
authorized A1/A2/A3 workflow. It does not itself stage a probe or authorize a
function call.

## Instruction 0022 evidence bridge

Instruction 0022 does not revise the Instruction 0021 result. It documents a
future evidence bridge that can make the five platform-unexposed requirements
direct only through a method-backed, closed evidence chain. It adds no active
prompt, Google client, browser flow, API request, OAuth reader, or deployment
command.

### Approved direct-verification methods

Every future `DIRECTLY_VERIFIED` result must include exactly one approved
method, its required closed checks, a sequence number, and a SHA-256 evidence
fingerprint. A missing method, an unknown method, a failed method check, or a
raw value retained in a record is a no-call failure.

| Method | Allowed use | Required closed proof |
|---|---|---|
| `OFFICIAL_API_CURRENT_STATE` | Current project, Drive, permission, ownership, API, and deployment observations | A complete field-masked response is normalized in memory; only Booleans, counts, permitted enums, and fingerprints are retained. |
| `OPERATOR_UI_PROJECT_LINK` | The Apps Script standard Cloud-project linkage unavailable from the Project resource | The same session has a typed target binding; the displayed project number and the authoritative OAuth-client project number normalize to the same in-memory SHA-256 fingerprint. |
| `FRESH_SAME_PRINCIPAL_MUTATION_PROVENANCE` | A new immutable MYSELF API-executable deployment | A pre-mutation marker binds the verified-principal fingerprint, exactly one fresh version/deployment response, and exact read-only reconciliation after every ownership check. |
| `LOCAL_CRYPTOGRAPHIC_BINDING` | Equality comparisons, prior-marker preservation, and typed local bindings | Only normalized equality Booleans and SHA-256 fingerprints are retained; raw IDs, numbers, addresses, and paths stay in memory or ignored local state. |

The tracked synthetic contract is
`implementation/GoogleSpreadsheet/schemas/stage-a-evidence-bridge-v1.schema.json`.
It permits none of the raw values used to create a fingerprint.

The normalizer fixes one method and one binding channel for **each** of the 18
requirements. In particular, OAuth/API/scope/token observations use
`OFFICIAL_API_CURRENT_STATE`; the Project Settings equality uses
`OPERATOR_UI_PROJECT_LINK`; the four principal/deployment/version requirements
use `FRESH_SAME_PRINCIPAL_MUTATION_PROVENANCE`; ownership requirements use
`OFFICIAL_API_CURRENT_STATE`; and only target attestation, transport semantics,
and prior-marker preservation use `LOCAL_CRYPTOGRAPHIC_BINDING`. Any different
method or binding fingerprint is rejected before an all-direct snapshot.

The closed binding map cryptographically binds (without retaining raw values):
the two equal Cloud-project-number hashes and their combined hash; current
script/container ownership snapshots, parent binding, and verified-principal
hash; and the verified principal, ownership snapshot, pre-mutation marker,
deployment identifier/response/reconciliation hashes, and immutable version
number. The final two composite bindings are recomputed locally; a self-reported
Boolean cannot substitute for one.

### Future one-observation operator session

This is a future, separately authorized procedure. Instruction 0022 does not
ask an operator to perform it.

1. A future local resolver obtains the OAuth client's Cloud-project number from
   an authoritative configured source; it must not infer a number from a
   client-ID format. It normalizes digits and computes an ignored local
   SHA-256 fingerprint.
2. The operator opens the already-target-bound Apps Script project, chooses
   **Project Settings**, and observes the value under **Google Cloud Project**.
3. The operator enters that displayed number once into a future non-echoing
   local prompt. No screenshot, clipboard capture, chat message, GitHub text,
   shell history, or tracked file may receive the value.
4. The future tool normalizes the in-memory digits, compares its SHA-256 value
   with the OAuth-client fingerprint, then discards both raw values. It records
   only equality, `OPERATOR_UI_PROJECT_LINK`, a sequence bucket, a combined
   fingerprint, and `raw_value_retained: false` in ignored local state.

Invalid digits, cancellation, a mismatch, an ambiguous target binding, or a
missing authoritative OAuth-client project-number resolver is a closed stop.
There is no OAuth consent, Cloud Console edit, source edit, deployment click,
or function execution in this manual scope.

### Future automated current-state checks

Only after the UI link equality passes in a later Work ID may the
automated preflight must directly inspect current state for both the Apps
Script project Drive file and the bound-container Drive file. It must retain
only closed results and fingerprints while requiring all of the following:

- the Apps Script Project parent binding equals the bound-container identity in
  memory;
- each Drive file is a My Drive item (`driveId` absent), reports a single
  current owner, and reports `ownedByMe: true` for the verified principal;
- each current owner equals the verified principal in memory and the two
  current owner-domain comparisons pass without retaining an email or domain;
- permission enumeration is complete for both files and reports no
  `pendingOwner: true`; and
- a Shared Drive, missing required owner field, non-single owner, unreadable
  permission page, owner mismatch, parent mismatch, or pending owner blocks
  this non-Shared-Drive contract.

The closed record must independently assert, for **each** of the script and
container files, `driveId` absence, `ownedByMe`, one current owner,
current-owner/principal equality, current owner-domain equality, complete
permission enumeration, Shared Drive absence, and `pendingOwner` absence. It
must additionally assert parent-binding equality. These are distinct
fail-closed checks, not a single attestation flag.

This is current-state evidence, not a claim that an API can reconstruct the
complete ownership-transfer history.

### Fresh deployment provenance and transfer correction

The Deployment resource does not expose a deployer identity. The future direct
proof for a newly created deployment is therefore an operation provenance
chain, not a substituted resource field:

1. Complete all current ownership, parent, Shared Drive, pending-owner,
   principal, and Cloud-project checks and bind their closed snapshot
   fingerprint.
2. Persist an ignored mutation marker before the first remote mutation. It
   binds the already directly verified principal fingerprint, the current-state
   snapshot fingerprint, operation sequence, and retry prohibition.
3. Using that same verified principal, create exactly one immutable version and
   exactly one API-executable deployment with `MYSELF` access. Reduce response
   values immediately to an identifier fingerprint and permitted version value.
4. Reconcile the exact deployment read-only: immutable version, API-executable
   entry point, `MYSELF` access, response fingerprint, and current-state
   snapshot binding must all match.

Any ambiguity, timeout, duplicate candidate, principal mismatch, ownership
drift, stale deployment, or failed reconciliation is a closed stop. A second
version or deployment is never automatic. This fresh deployment occurs after
the current-state ownership checks and satisfies the documented remediation
direction for a deployment affected by a current ownership/domain/Shared Drive
change. It does **not** prove a complete historical transfer record.

The synthetic contract additionally requires a marker-before-request Boolean,
exactly one immutable version, exactly one MYSELF deployment, response
reconciliation, and exact read-only reconciliation. It binds the same immutable
version number into the fresh-provenance fingerprint. A missing field or a
binding mismatch fails closed.

### Snapshot and Stage B boundary

The Stage A bridge may construct an all-direct snapshot only when every one of
the 18 mandatory requirements carries an approved method and passes its
method-specific checks. The deterministic snapshot SHA-256 uses synthetic or
ignored local closed values and the complete closed binding map only. A
successful **synthetic** snapshot is
`STAGE_A_EVIDENCE_BRIDGE_SYNTHETIC_SNAPSHOT_READY_ONLY`; it leaves Stage B
`NOT_STARTED`, invocation count `0`, `scripts.run` `NOT_EXECUTED`, and every
function invocation `NOT_EXECUTED`. The separate Work-ID outcome
`STAGE_A_EVIDENCE_BRIDGE_READY_FOR_SINGLE_OPERATOR_SESSION` may be selected
only after the repository design, validation, publication, and CI conditions
are met; neither value authorizes a Google operation.
