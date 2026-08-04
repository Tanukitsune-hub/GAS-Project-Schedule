# Work ID: 0010
# Instruction 0022 - Stage A evidence bridge

Date: 2026-08-04 JST
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Branch: `codex/0008-remote-gas-development-bootstrap`
Primary PR: #11 (Draft)

## Purpose and boundary

Instruction 0022 is repository-only and synthetic-only. It preserves the
Instruction 0021 Stage A0 result
`STAGE_A_BLOCKED_NEEDS_OPERATOR_OR_PLATFORM_EVIDENCE`, while designing a
minimal bridge for the five evidence fields unavailable from the initial API
surface.

No Google, Workspace, Apps Script API, Drive API, Cloud API, OAuth/profile,
ignored local target state, browser, UI, user input, project-number observation,
probe staging, push/pull, version/deployment creation, `scripts.run`, clasp
run-function, function invocation, or Stage B marker is authorized. No user
PC action is requested under this instruction.

## Direct-evidence rule

Every call-authorizing Stage A requirement remains required to be freshly
`DIRECTLY_VERIFIED`. A direct result is valid only when it records one approved
method, all method-specific closed checks, ordering, and a non-identifying
fingerprint. The permitted methods are:

- `OFFICIAL_API_CURRENT_STATE`;
- `OPERATOR_UI_PROJECT_LINK`;
- `FRESH_SAME_PRINCIPAL_MUTATION_PROVENANCE`; and
- `LOCAL_CRYPTOGRAPHIC_BINDING`.

`LOCALLY_ATTESTED`, `INFERRED`, `UNKNOWN_NOT_EXPOSED`, `CONTRADICTED`, an
unknown method, a methodless direct value, an unverified equality, or retained
raw evidence all block the future all-direct snapshot.

The synthetic contract fixes one required method and one required SHA-256
binding channel for every requirement. It recomputes the operator Cloud-project
link binding, current ownership binding, and fresh same-principal provenance
binding from their closed component fingerprints. It also rejects a missing
pre-mutation marker, more than one version/deployment, incomplete read-only
reconciliation, incomplete ownership detail, or an immutable-version mismatch.

## Future evidence bridge

### Standard Cloud-project linkage

A later separately authorized session must resolve the OAuth-client
Cloud-project number through an authoritative local/configured source, never by
parsing a client-ID format. It may retain only an ignored local SHA-256
fingerprint. The sole operator action is to open the already-bound Apps Script
project's Project Settings, observe Google Cloud Project, and enter the
displayed project number once into a non-echoing local prompt. The number is
normalized and compared in memory, then discarded. Only equality, method,
sequence, combined fingerprint, and `raw_value_retained: false` may survive.

This instruction implements no prompt or capture path. Its disabled command
returns `STAGE_A_OPERATOR_EVIDENCE_CAPTURE_NOT_AUTHORIZED` before input,
environment, file, credential, OAuth, browser, Google-client, or network
access.

### Current ownership and transfer state

A later direct preflight must inspect current Drive state for both script and
bound-container files, bind the Apps Script parent to the container in memory,
and require current owner/principal and owner-domain equality, `ownedByMe`, one
current owner, absent Shared Drive identity, and complete absence of
`pendingOwner`. Missing fields, a Shared Drive, pending ownership, parent
mismatch, ownership mismatch, or incomplete permission enumeration is a closed
stop. Raw Drive, user, domain, project, and parent values may not be retained.

The closed future record must preserve separate Booleans for the script and
container `driveId` state, `ownedByMe`, single-owner result, principal equality,
owner-domain equality, permission-page completeness, Shared Drive absence, and
pending-owner absence, plus the parent-binding equality. These are individual
checks under the one `OFFICIAL_API_CURRENT_STATE` method, not a second method.

### Fresh deployment provenance

The Deployment resource does not expose a deployer identity. A later direct
proof for one new deployment must instead bind a already-direct OAuth principal
fingerprint to an ignored pre-mutation marker, one immutable version, one
MYSELF API-executable deployment, and one exact read-only reconciliation. It
must occur only after the current ownership checks. Any ambiguity, stale
deployment, principal mismatch, reconciliation mismatch, or retry need is a
closed stop; a second deployment is not automatic.

This replaces a demand for complete ownership-transfer history with direct
current owner/domain/Shared Drive/pending-owner evidence plus fresh post-check
same-principal deployment provenance. It does not claim to reconstruct all
historical transfers.

## Synthetic implementation and completion

Tracked work may contain only closed schema, normalizer, fixture, deterministic
SHA-256 snapshot model, disabled placeholder, tests, documentation, and audit
evidence. It must reject raw identifiers, emails, URLs, screenshots, paths,
and free-form evidence. A structural all-direct snapshot is readiness only;
Stage B remains `NOT_STARTED`, retry is false, and no function may run.

The permitted outcomes are exactly:

- `STAGE_A_EVIDENCE_BRIDGE_READY_FOR_SINGLE_OPERATOR_SESSION`;
- `STAGE_A_EVIDENCE_BRIDGE_REMEDIATION_REQUIRED`; or
- `BLOCKED_BY_PRIMARY_SOURCE_EVIDENCE_CONFLICT`.

No outcome establishes functional runtime acceptance, Phase 8B overall PASS,
Phase 8C GO, production, pilot, company handoff, company transfer, or company
Workspace authorization.
