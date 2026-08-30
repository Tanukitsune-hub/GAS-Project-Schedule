# Work 0038 / Dispatch 0038-CODEX-01 — ChatGPT Acceptance

WORK_ID: `0038`

DISPATCH_ID: `0038-CODEX-01`

BALL: `USER`

STATUS: `ACCEPTED`

## Acceptance decision

`ACCEPTED — BLOCKER NONE`

The single-file company installation packaging is accepted for Work 0038.
The canonical developer source remains modular under
`implementation/GoogleSpreadsheet/apps-script-v2/`; the company manual-install
path uses the derived bundle only.

## GitHub-verified refs

- Validated implementation branch: `codex/0038-single-file-company-install`
- Final validated implementation head before acceptance sync:
  `0178eade638c2d2ef4e6e14b29749facf85b30e6`
- Delivery branch: `delivery/0038-company-live-bundle`
- Delivery head: `fd5bc3e61363dbae1ff98eda8ebbd12cdb371c76`
- GitHub Actions run for `0178eade...`: `33319331072` / CI `#541`, SUCCESS
- Main was fast-forwarded through validated implementation head `0178eade...`
  before this acceptance record was added.

## Accepted evidence

- Preferred company manual installation is exactly two paste actions:
  `QUICK_INSTALL/Code.gs`, then `QUICK_INSTALL/appsscript.json`.
- `QUICK_INSTALL/Code.gs` exists on the delivery branch and is 1,190,034 bytes.
- The quick-install manifest has the same Git blob SHA as the validated Phase 8C
  manifest: `86c8cb4e82aa8bcdfb09466fb3f23594c2342116`.
- The bundle builder uses an explicit 22-file source order, validates the frozen
  Phase 8C source commit and package checksums, preserves source bytes between
  deterministic markers, and generates reproducible provenance/checksums.
- The focused test loads the combined `Code.gs` itself, verifies source parity,
  manifest identity, order/uniqueness, syntax/VM load, representative non-live
  smoke behavior, and deterministic rebuilds.
- Final GitHub CI observed `11/11 PASS`, 87 suites, missing 0, extra 0, release
  verification PASS, lineage PASS, and secret scan 0 hits.
- Main-to-implementation diff does not modify
  `implementation/GoogleSpreadsheet/apps-script-v2/` or the frozen
  `v2.8.25-prepilot-phase8c` release payload. The bundle is a derived
  distribution artifact only.
- Delivery diff retains the original modular `apps-script/` payload and adds the
  quick-install directory plus guide updates; the original files are not removed.

## Provenance note

The Codex completion report and returned dispatch ledger name
`fc6db16ed4e20156799c11806c77f147b5f5f77a` as the implementation commit because
those records were authored before the final validation-hardening commit
`0178eade...`. The later commit only strengthens binding to the validated Phase
8C source commit/checksums and its CI passed. This is a documentation chronology
note, not a product blocker.

## Remaining Work 0038 boundary

Company Google Workspace installation and live runtime acceptance remain
`NOT EXECUTED`. The next ball is the user-controlled company-PC flow: paste the
two quick-install files, configure the approved Gemini credential only in company
Script Properties, run Setup/readiness with Automation OFF, and proceed to live
operation only if the Work 0038 readiness gates are green.

No additional Codex implementation is required for this dispatch.

WORK_ID: `0038`

DISPATCH_ID: `0038-CODEX-01`

BALL: `USER`

STATUS: `ACCEPTED`
