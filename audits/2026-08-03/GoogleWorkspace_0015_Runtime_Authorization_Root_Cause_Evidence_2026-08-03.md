# Google Workspace 0015 Runtime Authorization Root-Cause Evidence

Date: 2026-08-03  
Instruction: 0015  
Boundary: personal synthetic development target only; no company, production,
or real-data operation.

## Scope and preservation

- Canonical Apps Script source and canonical `appsscript.json`: unchanged.
- Automation: `OFF`.
- Prior one-use evidence: Instruction 0011, 0013, and 0014 records are
  preserved by the separate Instruction 0015 marker.
- The authorization remediation force-refreshed the existing ignored local-only
  named OAuth profile. It did not create a second profile, invoke browser
  consent, or run a diagnostic.
- No Script ID, deployment ID, account value, credential, token, local path,
  raw clasp/API output, company data, personal data, or real data is retained
  in this evidence.

## Closed authorization matrix

| Check | Closed result |
|---|---|
| Named local-only profile present and force-refreshable | `PASS` |
| Existing profile refreshed locally; prior profiles preserved | `true` / `true` |
| Local Desktop client and token audience continuity | `true` / `true` |
| Token lifetime at least six minutes | `true` |
| Runtime-manifest scope coverage | `7` required / `19` granted / `0` missing |
| Required runtime API scope coverage | `true` |
| OAuth principal readable and stable across refresh | `true` / `true` (fingerprint comparison only) |
| Testing-mode eligibility for the refreshed named profile | `PASS_REFRESHED_NAMED_PROFILE` |
| Standard Cloud/API prerequisite evidence | `PASS_ATTESTED_LOCAL_CLIENT_AND_AUDIENCE` / `PASS_DEPLOYMENT_METADATA_READABLE` |
| Deployment metadata | API-executable `true`; MYSELF-only `true`; versioned `true`; target-bound `true` |
| Deployment visibility versus execution permission | `FRESH_REFRESHED_PROFILE_DEPLOYMENT_REQUIRED` |
| Script/container ownership exposure | `INCONCLUSIVE_NOT_EXPOSED_BY_APPS_SCRIPT_METADATA` |

The ownership result is an API-observability limitation, not evidence of an
identity mismatch. No ownership, account, target title, identifier, or URL is
inferred or published. The authorization requirements follow the Apps Script
[execution guide](https://developers.google.com/apps-script/api/how-tos/execute)
and the MYSELF deployment semantics in the
[deployment API reference](https://developers.google.com/apps-script/api/reference/rest/v1/projects.deployments).

## Runtime payload and deployment preflight

- Top-level `runQuickDiagnostic` wrapper: staged payload `true`, independent
  HEAD pull-back `true`, immutable-version pull-back `true`.
- Function-name consistency and local clasp deployed-version semantics: `PASS`.
- Fresh immutable MYSELF-only versioned deployment: `PASS`.
- HEAD pull-back parity, immutable-version pull-back parity, deployment lineage,
  profile/deployment authorization, and API-executable execution binding:
  `PASS`.
- The 0015 marker was prepared before preflight and recorded
  `ATTEMPT_STARTED` before the remote call.

## Sole guarded diagnostic result

Exactly one deployment-bound, non-dev-mode invocation of only
`runQuickDiagnostic` occurred. It returned no bounded diagnostic body.

| Field | Closed result |
|---|---|
| Functional closure | `RUNTIME_QUICK_DIAGNOSTIC_FAILED_CLOSED` |
| Category | `BLOCKED_BY_AUTH` |
| Safe subtype | `RUNTIME_AUTHORIZATION_REJECTED` |
| API-executable deployment binding | `true` |
| Refreshed named-profile binding | `true` |
| Runtime function | `runQuickDiagnostic` |
| Raw-output SHA-256 | `33cd87c5c67945ac30b8e9f73346aa992574f03d7763faa24619a2de12ecb24d` |

No Instruction 0015 retry is permitted. Functional acceptance remains
`ATTEMPTED_FAILED_CLOSED` and `REVIEW_REQUIRED`. This evidence does not declare
Phase 8B overall PASS, Phase 8C GO, production or pilot readiness, company
handoff, company transfer, or company Workspace authorization.

## Non-Google validation before the Google boundary

- Locked dependency installation: `PASS`.
- Local verification gate: `11/11 PASS`, including `52` local test suites and
  tracked secret/credential/local-path scan with `0` hits.
- Canonical-document consistency: `21/21 PASS` before the 0015 closure update.
- Remote GAS bootstrap regression suite: `38/38 PASS`.
- Local clasp self-test: `34/34 PASS`.

The closure update adds an Instruction 0015 canonical-document consistency
test; its post-update validation and GitHub Actions evidence are published with
the resulting commit rather than inferred here.
