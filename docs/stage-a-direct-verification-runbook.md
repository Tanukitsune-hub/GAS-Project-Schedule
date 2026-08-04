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
