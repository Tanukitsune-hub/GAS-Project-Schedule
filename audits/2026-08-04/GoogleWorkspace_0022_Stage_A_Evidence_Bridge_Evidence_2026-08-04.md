# Google Workspace Instruction 0022 Stage A evidence bridge evidence

Date: 2026-08-04 JST
Work ID: 0010 / Instruction 0022
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Branch: `codex/0008-remote-gas-development-bootstrap`
PR: #11 (Draft)

## Revision basis

| Field | Closed-safe value |
|---|---|
| Starting HEAD | `22a16cc58d5e145a78ded09e23f75cb34377e612` |
| Base | `codex/0006-local-clasp-validation-gate` |
| Starting worktree | `CLEAN` |
| Instruction 0021 result preserved | `STAGE_A_BLOCKED_NEEDS_OPERATOR_OR_PLATFORM_EVIDENCE` |

## Verified primary-source facts

- The Apps Script Project resource returns the script's parent and creator
  metadata, but not its standard Cloud-project association.
- Apps Script guidance identifies Project Settings > Google Cloud Project as
  the location for the associated standard project's number, and `scripts.run`
  requires the script and calling OAuth client to share a standard project.
- The Deployment resource exposes version, entry point, and access; `MYSELF`
  limits access to the deploying user but does not expose that user's identity.
- Drive File metadata documents current `owners`, `ownedByMe`, and `driveId`;
  owner fields are not populated for Shared Drive items. Drive permissions
  document `pendingOwner`.
- An API executable may cease responding after a move to a Shared Drive or
  outside domain; the documented remediation includes redeploying in the
  current domain or Shared Drive.

Primary sources: [Apps Script Project resource](https://developers.google.com/apps-script/api/reference/rest/v1/projects),
[Cloud-project guidance](https://developers.google.com/apps-script/guides/cloud-platform-projects),
[execution guide](https://developers.google.com/apps-script/api/how-tos/execute),
[Deployment resource](https://developers.google.com/apps-script/api/reference/rest/v1/projects.deployments),
[Drive File resource](https://developers.google.com/workspace/drive/api/reference/rest/v3/files),
[Drive Permission resource](https://developers.google.com/workspace/drive/api/reference/rest/v3/permissions),
and [Drive ownership-transfer guidance](https://developers.google.com/workspace/drive/api/guides/transfer-file).

## Architecture inference and closed contract

The bridge does not treat an unavailable deployment-deployer field as verified.
Instead, directness is method-backed:

| Requirement group | Direct method | Required closed condition |
|---|---|---|
| OAuth client and Apps Script standard project | `OPERATOR_UI_PROJECT_LINK` | One non-echoing Project Settings observation matches an authoritative OAuth-client project-number SHA-256 value in memory. |
| Script/container current owner, parent, domain, Shared Drive, pending owner | `OFFICIAL_API_CURRENT_STATE` | Both files pass complete current-state checks; the method's evidence is then cryptographically bound locally without introducing a second verification method. |
| New MYSELF deployment actor equality | `FRESH_SAME_PRINCIPAL_MUTATION_PROVENANCE` | The previously direct principal fingerprint is bound before one mutation and reconciled with exactly one fresh immutable deployment. |
| Prior-marker and local typed binding equality | `LOCAL_CRYPTOGRAPHIC_BINDING` | In-memory normalized equality and deterministic SHA-256 binding only. |

The fresh deployment chain occurs after all current ownership checks and is
bound to their snapshot fingerprint. It establishes provenance for that new
deployment; it is not presented as proof of complete historical transfer
history. A Shared Drive or `pendingOwner` blocks this non-Shared-Drive contract.

## Future single operator observation

Under a later separately authorized Work ID, the manual scope is one Apps
Script Project Settings observation and one non-echoing project-number entry.
No screenshot, clipboard retention, chat/GitHub entry, OAuth consent, Cloud
Console change, source edit, deployment click, or function execution is part
of that observation. A missing authoritative OAuth-client project-number
resolver, invalid input, cancellation, or equality failure is a no-call stop.

## Synthetic proof and pre-publication validation

All listed tests are local, synthetic, and non-Google. No test loads a
credential, ignored target binding, browser, Google client, or network client.
The locked install resolved without a dependency change.

| Check | Closed-safe result |
|---|---|
| Instruction 0019 design regression | `12/12 PASS` |
| Instruction 0020 architecture regression | `15/15 PASS` |
| Instruction 0021 Stage A regression | `8/8 PASS` |
| Instruction 0022 evidence-bridge regression | `18/18 PASS` |
| Secret/credential/identifier/local-path scan | `13/13 PASS`, findings `0` |
| Canonical-document consistency | `23/23 PASS` |
| Remote-GAS bootstrap regression | `38/38 PASS` |
| Local clasp self-test | `34/34 PASS`, local non-Google only |
| Schema parse and whitespace check | `PASS` |

The final clean-tree gate and GitHub Actions evidence remain a normal
publication requirement. Their closed-safe results are recorded in the PR
completion comment rather than backdating this tracked pre-publication audit.

## Read-only audit and remediation

An independent read-only review found that the first synthetic draft allowed
some requirements to select an arbitrary approved method and did not
cryptographically bind the operator-link, ownership, and fresh-deployment
provenance components tightly enough. No active execution or privacy boundary
failure was found.

The final synthetic model fixes one method and one binding channel for every
requirement; recomputes the operator-link, ownership, and fresh-provenance
SHA-256 composites; requires the pre-mutation marker, one immutable version,
one MYSELF deployment, deployment-response/read-only reconciliation, and the
non-sensitive immutable version number; and expands current ownership into
script/container-specific `driveId` absence, `ownedByMe`, single-owner,
principal/domain equality, permission-enumeration, Shared-Drive, and
pending-owner checks. New local regression cases reject method/binding substitution,
operator-link mismatch, stale marker binding, incomplete reconciliation, and
incomplete permission enumeration.

A final independent read-only review passed the repaired contract: the internal
synthetic snapshot enum is distinct from the Work outcome, the three
operator-facing documents contain no non-ASCII rendering risk, and the fixed
methods/bindings, per-file ownership checks, marker ordering, single-operation,
immutable-version, and reconciliation guards remain present. That review was
static only; it does not verify a real Google target or authorize an operation.

## Operations not performed

No Google, Workspace, Apps Script API, Drive API, Cloud API, OAuth/profile,
ignored local target state, browser, UI, user input, project-number observation,
probe staging, push/pull, version/deployment mutation, `scripts.run`, clasp
run-function, function invocation, or Stage B marker was performed.

## Retained boundaries and proposed outcome

Functional runtime acceptance remains `ATTEMPTED_FAILED_CLOSED` /
`REVIEW_REQUIRED`; Automation remains OFF; T11 remains `T11_SUSPENDED`; and
company handoff remains
`NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW`. No company,
production, personal, or real data operation occurred.

The selected design outcome, subject to normal clean-tree publication and CI,
is `STAGE_A_EVIDENCE_BRIDGE_READY_FOR_SINGLE_OPERATOR_SESSION`. It means only
that the future evidence bridge is ready for a separately authorized one-UI-
observation session; it does not authorize Stage B or any Google operation.
