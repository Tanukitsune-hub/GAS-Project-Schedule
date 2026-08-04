# Work ID: 0009
# Instruction 0021 - Stage A direct verification

Date: 2026-08-04 JST
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Branch: `codex/0008-remote-gas-development-bootstrap`
Primary PR: #11 (Draft)

## Purpose and boundary

Perform a fresh, fail-closed Stage A0 assessment for the existing personal,
synthetic development target. This instruction may use only the existing
ignored local OAuth/profile and target binding, and only read-only Google
metadata necessary to directly verify a mandatory field. It authorizes no
function invocation and no Stage B work.

No company, production, real-data, browser, console, account switch,
permission broadening, new OAuth profile, or operator-PC action is authorized.
Do not publish credentials, tokens, identities, identifiers, URLs, raw output,
or local paths.

## Stage A0 decision rule

Every call-authorizing field in the Stage A0 closed schema must be freshly
`DIRECTLY_VERIFIED` before any target mutation. `LOCALLY_ATTESTED`,
`INFERRED`, `UNKNOWN_NOT_EXPOSED`, and `CONTRADICTED` all block staging.

The mandatory fields cover the personal/synthetic/non-company target and
intended sandbox attestations, Automation OFF, TEST_MODE where applicable,
client/standard-project and audience equality, API enablement, scopes and
token validity, OAuth-principal/MYSELF deployer equality, immutable deployment
and typed target binding, source/version lineage, script/container ownership,
cross-domain/transfer/Shared Drive absence, and preservation of the four prior
attempt markers.

If a required platform surface cannot expose a field, classify it
`UNKNOWN_NOT_EXPOSED`, stop before target mutation, and select
`STAGE_A_BLOCKED_NEEDS_OPERATOR_OR_PLATFORM_EVIDENCE`. Do not substitute a
prior attestation, deployment visibility, a project creator value, current
owner metadata, a successful refresh, or an inferred identity.

## A1/A2/A3 and no-call boundary

Only an all-direct A0 snapshot could permit the ignored constant-returning
probe overlay, guarded staging, independent pull-back parity, and one new
immutable MYSELF API-executable deployment. A new Stage B marker must not be
created by this instruction.

Under every outcome, `scripts.run`, clasp run-function, the constant probe,
`runQuickDiagnostic`, and every other Apps Script function remain
`NOT_EXECUTED`. A target mutation must be marked before a remote operation,
but no mutation is allowed before the all-direct A0 condition.

## Evidence and completion

Record only closed statuses, Boolean results, counts, safe classifications,
and non-identifying hashes. Preserve Instructions 0011, 0013, 0014, and 0015
attempt evidence. Keep PR #11 Draft and use normal additive commits only.

The permitted outcomes are exactly:

- `STAGE_A_DIRECT_VERIFICATION_COMPLETE_READY_FOR_ONE_CALL_DECISION`;
- `STAGE_A_BLOCKED_NEEDS_OPERATOR_OR_PLATFORM_EVIDENCE`;
- `STAGE_A_FAILED_CLOSED`; or
- `STAGE_A_REMEDIATION_REQUIRED`.

No outcome establishes functional runtime acceptance, Phase 8B overall PASS,
Phase 8C GO, production, pilot, company handoff, company transfer, or company
Workspace authorization.
