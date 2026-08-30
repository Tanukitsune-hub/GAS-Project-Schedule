# Work 0038 — Dispatch Ledger

WORK_ID: `0038`

CURRENT_DISPATCH_ID: `0038-CODEX-01`

BALL: `USER`

STATUS: `ACCEPTED`

## Current outcome

The Work 0038 company-PC manual installation has an accepted two-paste delivery
path while preserving the validated modular developer source and all existing
runtime safety boundaries.

The next ball is company-environment installation and runtime acceptance by the
user under the existing Work 0038 company deployment instructions.

## Accepted dispatch

- Dispatch: `0038-CODEX-01`
- Instruction: `docs/handoffs/0038-CODEX-01-single-file-company-install-instruction.md`
- Codex report: `docs/handoffs/0038-CODEX-01-single-file-company-install-report.md`
- ChatGPT acceptance: `docs/handoffs/0038-CODEX-01-acceptance.md`
- Validated implementation branch: `codex/0038-single-file-company-install`
- Final validated implementation head before acceptance sync:
  `0178eade638c2d2ef4e6e14b29749facf85b30e6`
- Delivery branch: `delivery/0038-company-live-bundle`
- Delivery head: `fd5bc3e61363dbae1ff98eda8ebbd12cdb371c76`
- GitHub Actions CI `#541` / run `33319331072`: SUCCESS

## Closed conclusions

- This remains Work `0038`; it is not a new product Work.
- Canonical modular source remains `implementation/GoogleSpreadsheet/apps-script-v2/`.
- Frozen Work 0037 Phase 8C release/source evidence remains unchanged.
- The preferred company manual-install path is exactly two paste actions:
  `QUICK_INSTALL/Code.gs`, then `QUICK_INSTALL/appsscript.json`.
- The original 22-file modular payload remains available for development,
  provenance, and optional engineering use; it is not removed or replaced.
- The single-file `Code.gs` is a derived distribution artifact only, generated
  deterministically from the validated Phase 8C payload.
- No live company, Gmail, Calendar, Gemini, OAuth, trigger, credential, or
  deployment action was performed by Dispatch `0038-CODEX-01`.

## Accepted evidence

- `QUICK_INSTALL/Code.gs`: 1,190,034 bytes.
- Quick-install `appsscript.json` is Git-blob-identical to the validated Phase 8C
  manifest (`86c8cb4e82aa8bcdfb09466fb3f23594c2342116`).
- Bundle builder binds inputs to the validated Phase 8C source commit and
  package checksums, preserves all 22 source byte sequences in explicit order,
  and produces deterministic provenance/checksums.
- Focused bundle test validates source parity, uniqueness/order, manifest
  identity, combined syntax/VM load, representative non-live smoke behavior,
  and reproducibility against the combined artifact itself.
- Final GitHub CI observed 11/11 PASS, 87 suites, missing 0, extra 0, release and
  lineage checks PASS, and secret scan 0 hits.
- Main was fast-forwarded through validated implementation head `0178eade...`;
  acceptance records were then added as documentation-only commits.

## Provenance note

The Codex return report names `fc6db16...` because it was authored before the
final validation-hardening commit `0178eade...`. The later commit only strengthens
binding to the frozen source commit/checksums and its GitHub CI passed. This is
non-blocking chronology, not a product defect.

## Remaining Work 0038 boundary

Company-PC paste, Setup/readiness, OAuth/provider acceptance, and live Inbox
runtime acceptance remain `NOT EXECUTED`. They are user-controlled Work 0038
steps and are not prerequisites for accepting this packaging dispatch.

No active Codex implementation dispatch remains.

WORK_ID: `0038`

CURRENT_DISPATCH_ID: `0038-CODEX-01`

BALL: `USER`

STATUS: `ACCEPTED`
