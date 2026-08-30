# Work 0038 — Dispatch Ledger

WORK_ID: `0038`

CURRENT_DISPATCH_ID: `0038-CODEX-01`

BALL: `CHATGPT`

STATUS: `RETURNED`

## Current outcome

Simplify the already-authorized Work 0038 company-PC installation so the manual Apps Script editor path requires only one application-code paste plus one manifest paste, while preserving the validated Code `2.8.25-prepilot` Phase 8C runtime behavior and all existing safety boundaries.

## Returned dispatch

- Dispatch: `0038-CODEX-01`
- Instruction: `docs/handoffs/0038-CODEX-01-single-file-company-install-instruction.md`
- Recommended model: `Luna Max`
- Reason: architecture and acceptance criteria are closed; remaining work is deterministic packaging, focused validation, and delivery-guide convergence.

## Closed conclusions

- This remains Work `0038`; it is not a new product Work.
- Canonical modular source remains `implementation/GoogleSpreadsheet/apps-script-v2/`.
- Frozen Work 0037 Phase 8C release/source evidence must not be rewritten.
- The company manual-install target is two paste actions total: one generated `Code.gs`, then `appsscript.json`.
- The one-file form is a derived distribution artifact only, not a source refactor.
- No live company, Gmail, Calendar, Gemini, OAuth, trigger, or deployment action belongs in this dispatch.

## Return evidence

- Implementation branch: `codex/0038-single-file-company-install`
- Implementation commit: `fc6db16ed4e20156799c11806c77f147b5f5f77a`
- Delivery branch: `delivery/0038-company-live-bundle`
- Delivery commit: `fd5bc3e61363dbae1ff98eda8ebbd12cdb371c76`
- Quick-copy artifact: `QUICK_INSTALL/Code.gs` plus
  `QUICK_INSTALL/appsscript.json`
- Manual install count: exactly two paste actions
- Bundle parity, manifest identity, combined syntax/VM load, representative
  non-live smoke, reproducibility, static validation, and local gate: PASS
- Company Google Workspace, Apps Script, Gmail, Calendar, trigger, Gemini, and
  credential operations: NOT EXECUTED
- Report: `docs/handoffs/0038-CODEX-01-single-file-company-install-report.md`

## Completion latch for this dispatch

`RETURNED — generated one-file artifact, byte/source-parity evidence,
bundle-specific validation, updated company deployment guide, final diff, and
report are available in GitHub.`

WORK_ID: `0038`

CURRENT_DISPATCH_ID: `0038-CODEX-01`

BALL: `CHATGPT`

STATUS: `RETURNED`
