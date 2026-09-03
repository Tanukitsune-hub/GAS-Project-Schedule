# Work 0039 / Dispatch 0039-CODEX-03 — ChatGPT Review

WORK_ID: `0039`

DISPATCH_ID: `0039-CODEX-03`

BALL: `CHATGPT`

STATUS: `PRODUCT_ACCEPTED_INTEGRATION_BLOCKED`

## GitHub evidence reviewed

- Draft PR `#55` is open, draft, mergeable, and unmerged.
- PR head: `959690d0863b268dda4f707ef213c5c353653f54`.
- Corrected release source: `7c8b4c7709ab00b4d315f910b9271f3c4945b702`.
- Push CI `33718666447`: `SUCCESS` for final head.
- PR CI `33718669532`: `SUCCESS` for final head.
- PR CI gate: 13/13 PASS; 90 suites; missing 0; extra 0.
- Release verifier: PASS; txt transport byte identity and deterministic rebuild PASS.
- Work 0038 frozen archive refs and bundle identities remain unchanged.
- Real OpenAI/Gemini, credentials, Workspace deployment, OAuth, triggers, and Automation remain `NOT_EXECUTED`.
- OpenAI data governance remains `NOT_APPROVED_OR_UNKNOWN`.

## Product acceptance

The three blockers identified after CODEX-02 are closed for the non-live product candidate:

1. OpenAI Responses compatibility: documented response metadata is no longer rejected merely for being present; documented reasoning output items can coexist with exactly one completed assistant classification message while tool/function/refusal/multiple-message/incomplete paths remain fail-closed. This is consistent with the current official Responses API contract, in which `output` is `ResponseOutputItem[]`, order/length are model dependent, completed responses can contain metadata such as `completed_at` and `instructions`, and reasoning items are documented output items.
2. Provider-switch retry boundary: the production switch path resolves the active bound Spreadsheet only after the Script Lock is held, reads persisted Message State through the held-lock repository API, rejects `CLAIMED`, `PREPROCESSED`, and `RETRY`, and fails closed when persisted state cannot be inspected or contains an invalid status.
3. Pull-request CI scope: GitHub's exact synthetic merge context is distinguished from the PR head history; donor merges in the actual Work branch remain rejected. The resulting GitHub PR CI is green.

The candidate bundle provenance records source `7c8b4c7709ab00b4d315f910b9271f3c4945b702`, code version `2.8.26-prepilot`, two-paste install order `Code.gs` then `appsscript.json`, byte-identical txt transport copies, `store=false`, tools/background/stream disabled, and live runtime `NOT_EXECUTED`.

## Remaining BLOCKER — main integration gate

Do not merge PR #55 yet.

The current `implementation/GoogleSpreadsheet/tools/post_merge_validation_gate.js` routes to the Work 0039 gate whenever `CURRENT_CONTRACT.json` identifies the Work 0039 candidate. The Work 0039 scope gate currently accepts the implementation branch and the exact GitHub PR synthetic merge context, but not a real `main` branch integration commit or later descendants on `main`.

Therefore merging the currently green PR would make the subsequent main push CI fail with a branch/scope error even though the product tree is accepted. A known CI failure on the source-of-truth branch is not acceptable completion evidence.

This is an integration-harness blocker, not a reopened product blocker.

## Integration decision

- Preserve all CODEX-03 product evidence as accepted.
- Keep PR #55 Draft and unmerged.
- Use a normal GitHub merge commit for eventual integration. Do not squash or rebase: the Work 0039 source/release lineage records exact commits and must remain ancestors of main.
- Add a narrow post-merge/main-mode validation path that recognizes the Work 0039 integration merge while still detecting donor merges in the Work branch and continuing to validate the combined main tree.
- The main-mode gate should remain valid for later documentation/status descendants of the recognized integration merge, while product/release changes outside a new Work must still fail through source/release parity and scope controls.

## Issue classification

- BLOCKER: post-merge/main integration validation path is not yet prepared.
- FIX SOON: none.
- BACKLOG / later qualification: company OpenAI service type, data-governance approval, credential setup, one synthetic live provider qualification with Automation OFF, company Workspace deployment, and Automation/runtime acceptance.

## Disposition

Route to `0039-CODEX-04` for main-integration gate preparation only. Do not reopen the accepted OpenAI parser, retry-boundary, release, bundle, or Work 0038 preservation conclusions without contrary evidence.

WORK_ID: `0039`

DISPATCH_ID: `0039-CODEX-03`

BALL: `CHATGPT`

STATUS: `PRODUCT_ACCEPTED_INTEGRATION_BLOCKED`
