# Google Workspace Instruction 0020 remote-only authorization diagnostic architecture evidence

Date: 2026-08-04 JST
Work ID: 0008 / Instruction 0020
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Branch: `codex/0008-remote-gas-development-bootstrap`
PR: #11 (Draft)

## Revision basis

| Field | Value |
|---|---|
| Starting HEAD | `004f6bbd71caf3376afc18c0228d46c90e344572` |
| Final HEAD | Recorded after normal publication and CI verification in the Work ID 0008 completion report and PR comment. |
| Base | `codex/0006-local-clasp-validation-gate` |
| Starting worktree | Clean |

## Corrected PR-state matrix

| PR | Verified state | Ancestry interpretation |
|---|---|---|
| #8 | Open / Draft / unmerged | Stacked development scope remains separate. |
| #9 | Open / Draft / unmerged | Stacked development scope remains separate. |
| #10 | Open / Draft / unmerged | Direct base of PR #11. |
| #11 | Open / Draft / unmerged / mergeable | This instruction's target; not ready for review or merge. |
| #12 | Merged to `main` | Its merge commit is not an ancestor of PR #11. |
| #13 | Merged to `main` | Its merge commit is not an ancestor of PR #11. |

Instruction 0017 removed matching former governance content from PR #11. The
merged state of #12/#13 is not evidence that their commits or governance scope
were incorporated into this branch.

## Source and architecture findings

The design relies only on tracked Instruction 0014/0015 evidence and installed
project-local `@google/clasp` 3.3.0 source. No live Google documentation or
endpoint was opened.

- Selected future transport: `DIRECT_REST_SCRIPTS_RUN`.
- Rejected transport: `CLASP_3_3_0_RUN_FUNCTION`.
- Selected first probe: `IGNORED_RUNTIME_OVERLAY_CONSTANT_AUTHORIZATION_PROBE`.
- Rejected first probe: `RUN_QUICK_DIAGNOSTIC`.

The transport selection is a safety preference, not execution authority.
Installed clasp source passes its configured `scriptId` key to `scripts.run`
and `--nondev` only changes `devMode`. The tracked primary-source finding and
the preserved 0014 guard establish that the path value must instead be the
API-executable deployment target; the configuration key name is not the target
semantic. Its JSON mode can expose response/error detail. A future Direct REST
client can use a typed deployment-target contract and retain only a closed
response summary. Its Stage B boundary is exactly one client dispatch attempt;
a timeout never proves server receipt and may not trigger a retry. No client is
added here.

## Stage A and Stage B contract

All future call-authorizing Stage A fields must be freshly
`DIRECTLY_VERIFIED`. The target-identifier semantic itself is directly
supported by the tracked primary/package-source record, but the actual
immutable deployment binding remains historical local attestation and requires
a later direct check. Ownership and cross-domain/transfer/Shared Drive evidence
remain unexposed. This produces a no-call closure rather than a Google-side
root-cause claim.

Stage B models a separate ignored Work-ID-specific marker. It requires one
immutable API-executable deployment target, the selected transport/probe,
`MYSELF`, preserved prior markers, an `ATTEMPT_STARTED` transition before the
single future dispatch, and a permanently false retry flag. It prohibits HEAD,
function, target, and follow-up diagnostic fallback. Its target and separate
Work-ID records are represented only by SHA-256 fingerprints in ignored local
state. It also retains the complete closed Stage A status snapshot and its
SHA-256 fingerprint, and refuses a start unless every Stage A value is
`DIRECTLY_VERIFIED` and the supplied fingerprint matches a deterministic
local SHA-256 recomputation. The model itself performs no remote call.

## Response contract and classifications

The synthetic response contract permits only contract version, closed attempt
state, HTTP/API status, closed reason enum, four Boolean observations, a
response SHA-256, elapsed bucket, and `retry_permitted: false`. It rejects raw
bodies, error text, stacks, identifiers, URLs, account/project/deployment
values, tokens, local paths, and free-form fields.

Deterministic classifications cover project/principal/ownership/token/common-
project preflight failures, caller-not-permitted, deployment-not-found,
script-not-started, script-runtime-error, probe-pass-not-functional-
acceptance, and unknown fail-closed results. A Script-ID substitute or other
invalid deployment target has its own no-call classification.

## Instruction 0019 publication evidence

Instruction 0019 implementation commit
`06a7cc4ad8066e87acae141ba10b48cdab887969` and evidence/publication commit
`004f6bbd71caf3376afc18c0228d46c90e344572` are present on the branch. Its
push run `30863009648` / job `91848840154` and pull-request run `30863012395`
/ job `91848848991` each completed 9/9 successful steps. Its PR body update
and tracked-audit addendum are preserved; the GitHub comment supplements but
does not replace tracked evidence.

## Changed paths, validation, and publication

Changed paths are limited to:

- `CURRENT_STATUS.md`;
- `docs/remote-only-auth-diagnostic-design.md`;
- the additive Instruction 0019 publication addendum;
- this Instruction 0020 audit and its tracked instruction;
- one synthetic-only JSON schema and fixture; and
- one pure normalizer/classifier/marker module with its regression suite.

Before publication, locked installation completed without changing the lockfile.
The existing Instruction 0019 placeholder suite passed 12/12 and the new
Instruction 0020 local-only suite passed 15/15. The new suite permits only the
local standard `node:crypto` SHA-256 primitive and proves that no environment
reads, file reads, OAuth, clasp, Google client, or network path exists in the
architecture module; it separately proves that the existing disabled
placeholder remains pre-import and environment-safe. The full local gate is
intentionally re-run from the clean committed tree; its result and both
post-push CI run/job/step conclusions are recorded in the final completion
report and privacy-safe PR comment without retaining raw logs.

## Agent evidence and disposition

Two read-only transport/preflight explorations and one bounded synthetic-only
implementation delegation were used. The implementation delegate added no
remote path and its unrun test state was independently completed by Main Codex.
The independent read-only auditor confirmed the no-active-path, redaction,
probe-isolation, and PR-scope conclusions. Its Stage B linkage finding was
accepted: the marker now embeds only closed Stage A statuses plus a SHA-256
fingerprint and rejects anything other than an all-direct snapshot. The
auditor's proposed current target-semantics contradiction was not adopted:
the tracked primary-source finding and preserved 0014 guard distinguish a
configuration key name from the required API-executable deployment target.
Nevertheless, any later `CONTRADICTED` target-semantics value is now assigned
the deterministic no-call classification
`AUTH_DIAGNOSTIC_PREFLIGHT_DEPLOYMENT_TARGET_INVALID`. The auditor's final
read-only recheck passed after confirming the all-direct snapshot and
deterministic fingerprint linkage; it also confirmed that `node:crypto` is the
sole added dependency and no remote, credential, OAuth, clasp, or Google path
was added.

## Boundaries and selected outcome

No Google, Workspace, Apps Script API, OAuth endpoint, Cloud API, clasp remote,
deployment, runtime diagnostic, operator-PC, company, production, or real-data
operation is authorized or performed. No credential, OAuth state, account,
identifier, URL, raw response, local path, company data, personal data, or real
data is retained.

Selected outcome after publication and validation:
`REMOTE_ONLY_AUTH_DIAGNOSTIC_ARCHITECTURE_COMPLETE`.

The minimum next decision is a later separately authorized fresh Stage A
direct-verification plan, including actual immutable deployment binding and
ownership evidence. It must not reuse an earlier marker or automatically
invoke `runQuickDiagnostic`.
