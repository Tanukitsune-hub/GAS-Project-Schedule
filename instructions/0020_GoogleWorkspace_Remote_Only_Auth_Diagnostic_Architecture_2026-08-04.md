# Work ID: 0008
# Instruction 0020 - remote-only authorization diagnostic architecture

Date: 2026-08-04 JST
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Branch: `codex/0008-remote-gas-development-bootstrap`
Primary PR: #11 (Draft)

## Authority and preserved state

This instruction follows Instruction 0019 and records only repository-local,
synthetic design work. It must not invoke Google, Workspace, Apps Script API,
Cloud API, OAuth, clasp remote commands, a deployment operation, a runtime
diagnostic, or operator-PC work. It must not read credentials, ignored clasp
state, account values, project values, Script IDs, deployment IDs, or real
data.

Functional acceptance remains `ATTEMPTED_FAILED_CLOSED` /
`REVIEW_REQUIRED`. Automation remains OFF, T11 remains `T11_SUSPENDED`, and
company handoff remains
`NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW`.

## Required architecture decisions

1. Select one future transport and one future authorization probe without
   implementing either.
2. Define Stage A as a no-call, closed-safe preflight. Every execution
   authorizer must be `DIRECTLY_VERIFIED`; historical attestation, inference,
   unknown evidence, or contradiction blocks a call.
3. Define Stage B as an ignored, Work-ID-specific one-use marker. It must
   persist `ATTEMPT_STARTED` before one future dispatch and make retry false.
4. Define a closed response contract that retains no raw response, identifier,
   credential, account, project, deployment, URL, local path, or free-form
   value.
5. Correct PR metadata/evidence state: #8 through #11 are open Draft PRs;
   #12 and #13 are merged to `main` but their merge commits are not ancestors
   of PR #11. The former matching governance content was removed from PR #11
   under Instruction 0017.

## Required implementation boundary

Only pure synthetic schema, fixture, normalizer, classifier, decision, marker
model, test, documentation, and audit artifacts may be added or updated.
The existing disabled placeholder must remain hard-disabled and continue to
return `AUTH_DIAGNOSTIC_EXECUTION_NOT_AUTHORIZED` before imports, environment,
file, OAuth, clasp, Google-client, or network access.

No probe source, manifest overlay, OAuth flow, HTTP client, network client, or
active command may be added. A future direct transport or probe is a later
separately authorized decision.

## Acceptance boundary

`REMOTE_ONLY_AUTH_DIAGNOSTIC_ARCHITECTURE_COMPLETE` is permitted only when the
selected transport/probe, Stage A, Stage B, safe response schema, deterministic
closed classifications, synthetic tests, PR metadata, audit evidence, and CI
are complete. It does not make a real-environment call authorized. If package
or tracked evidence cannot support a safe fail-closed design, the result is
`BLOCKED_BY_PRIMARY_SOURCE_OR_ARCHITECTURE_CONFLICT`.
