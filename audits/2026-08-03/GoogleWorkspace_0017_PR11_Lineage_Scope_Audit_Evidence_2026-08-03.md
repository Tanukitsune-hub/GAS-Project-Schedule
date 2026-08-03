# Google Workspace 0017 PR #11 Lineage and Scope Audit Evidence

Instruction date: 2026-08-03 JST  
Remediation date: 2026-08-04 JST  
Work ID: 0005 / Instruction 0017  
Scope: repository governance correction only; no Google, Workspace, runtime, or
real-data operation.

## Outcome

`PR11_SCOPE_REMEDIATED_READY_FOR_AUTH_CONTINUATION`

The former `.codex`/Luna-agent configuration and root `AGENTS.md` delegation
section were outside the explicit PR #11 instruction chain. They are removed by
an additive commit. This outcome corrects PR #11 review scope only; it does not
promote any application, runtime, company-handoff, or production status.

## Repository and PR state before remediation

| Field | Closed-safe value |
|---|---|
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Branch | `codex/0008-remote-gas-development-bootstrap` |
| Pre-remediation HEAD | `8a3494210746f222e0cfeb046fdeb1b7c3f5dd41` |
| PR #11 base | `codex/0006-local-clasp-validation-gate` / `6ebe881075311722d5a1563511ca80936070bc67` |
| PR #11 merge base | `6ebe881075311722d5a1563511ca80936070bc67` |
| PR #11 state | Open / Draft / unmerged / mergeable |
| Local relocation safety | non-OneDrive local checkout; clean before work |
| Application/runtime boundary before this handoff | `4c3e42493649d3b0c8898e5a8a25182846fec014` |

The `8a349421` handoff commit adds only Instruction 0017. It does not alter the
application/runtime-evidence boundary.

## Verified lineage

| PR #11 path or section | Introduction commit | Verified classification |
|---|---|---|
| `.codex/config.toml` | `cd0ccf212b3c4cc86af12655516e38bdcf748e8a` | ordinary one-parent commit |
| `.codex/agents/luna-explorer.toml` | `f56d729b03399e8fe0dd236365c6ee9a25d904e2` | ordinary one-parent commit |
| `.codex/agents/luna-executor.toml` | `9b26464e1dbd79876c81a998cadc2a9cc4292af0` | ordinary one-parent commit |
| `.codex/agents/luna-auditor.toml` | `d1ecfebc0ab4b64d9adc0ae83be8a7a483d48034` | ordinary one-parent commit |
| Root `AGENTS.md` delegation section | `86989aae7cb72289cd55f6380ec56482b66357d4` | 28 additive lines only |

Those five changes entered the current PR #11 line through merge commit
`bc38675ac99109b7a03375c4e76b0666876a2806`, which joins the local runtime
line with the same-branch governance line. It is not a merge of `main`, PR #12,
or PR #13.

PR #12 merge `1956c6943b5d475a33778e7d992a47ac7f31b0c2` and PR #13 merge
`63e5c124d8c00ae76dd8b9e95e5606ccb9e2cb06` are not ancestors of PR #11. Their
merge base with PR #11 is `6723f9885e365c75a95254e35eb636573853750f`.

The `.codex` blobs on PR #11 match the final PR #13 blobs. This establishes
content correspondence, not a literal PR #12/PR #13 merge or a provable
porcelain command. The supported inference is an unapproved restore/copy into
normal PR #11 commits.

## Authorization and report reconciliation

- Instruction 0011 identifies PR #12 as separate configuration work based on
  `main` and prohibits merging it into PR #11 for that instruction.
- Instructions 0013 and 0014 prohibit merging or cherry-picking that scope
  without a later explicit instruction.
- Instruction 0015 permits conditional use of definitions if present; it does
  not authorize adding them to PR #11.
- No tracked Instruction 0011 through 0015 explicitly authorizes the five
  governance changes above. An after-the-fact PR comment is not a tracked
  instruction-chain authorization.

Therefore, the Instruction 0015 statement that authoritative `.codex`
definitions were absent is contradicted at its final branch HEAD. The narrower
statement that the PR #12 merge commit was not incorporated is ancestry-true,
but incomplete because matching content was independently added to PR #11.

## Remediation isolation

| Change | Result |
|---|---|
| Remove `.codex/config.toml` | removed |
| Remove three `.codex/agents/*.toml` files | removed |
| Root `AGENTS.md` | only the 28-line `Codex subagent delegation` section removed |
| `CURRENT_STATUS.md` | minimal governance-scope correction note added |
| Apps Script source and canonical `appsscript.json` | unchanged |
| Runtime tooling and Instruction 0011 through 0015 evidence | unchanged |
| `main`, PR #12, and PR #13 | untouched |

Keeping these files would broaden the stacked runtime/bootstrap PR with
unrelated Codex-governance review. Removing them leaves the runtime/application
acceptance scope unchanged and preserves all historical evidence.

## Delegated and main verification

- `luna_explorer` role: read-only lineage confirmation. It independently
  verified the introduction commits, non-ancestry of PR #12/#13, blob
  correspondence, lack of tracked authorization, and five-path removal scope.
- `luna_auditor` role: read-only proposed-diff audit. It passed the four file
  deletions, 28-line section removal, minimal status note, runtime/company
  boundary preservation, and secret-safety checks. It identified this evidence
  file as the remaining required artifact before final acceptance.
- Main Codex: verified branch/remote/PR state, merge bases, object ancestry,
  tracked instruction authority, scope judgment, and the final diff.

## Local validation

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `node tests/canonical_document_consistency_test.js` | PASS (`22`) |
| `node tests/remote_gas_development_bootstrap_test.js` | PASS (`38`) |
| `node tools/local_clasp_dev.js self-test` | PASS (`34`) |
| `pnpm run verify:local` before commit | `WORKTREE_NOT_CLEAN` by design; the gate requires the additive commit's clean worktree |

The final `pnpm run verify:local` is run after the normal additive commit, when
the worktree is clean. Its result and the post-push GitHub Actions run/job/step
conclusions are published in the PR #11 safe summary and final work report.

## Boundaries retained

No Google or Workspace target was contacted. No clasp remote command, OAuth
refresh, deployment action, Apps Script API call, or runtime diagnostic was
performed. The development gate remains
`READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` only as a readiness boundary.
Functional acceptance remains `ATTEMPTED_FAILED_CLOSED` and `REVIEW_REQUIRED`.
Automation remains OFF; company handoff remains
`NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW`; T11 remains
`T11_SUSPENDED`; and `NO_ACTIVE_COMPANY_TRANSFER` remains.

No local absolute path, identifier, URL, account detail, credential, OAuth
material, raw remote output, company data, personal data, or real data is
retained in this evidence.
