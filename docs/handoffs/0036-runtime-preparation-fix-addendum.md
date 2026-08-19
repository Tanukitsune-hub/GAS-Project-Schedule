# Work 0036 Runtime Preparation Fix Addendum

This addendum supplements `docs/handoffs/0036-runtime-preparation-fix-instruction.md` and controls where they differ.

## Route correction

Route: `C`.

ChatGPT independently confirmed the production/Test-mode root cause in GitHub source and completed the durable handoff/status work, but did not modify the Apps Script implementation. Codex must implement the bounded caller fix, add/extend regression coverage, regenerate the deterministic 2.8.21 release packages, validate them, and perform the one authorized repaired-target replacement/pull-back sequence defined in the instruction.

All design, scope, non-goals, validation, external-action limits, report requirements, and stop conditions in the original runtime-preparation-fix instruction remain unchanged.

Recommended model remains `Luna Max` because the defect and repair design are fully resolved and the residual task is bounded implementation plus executable validation.
