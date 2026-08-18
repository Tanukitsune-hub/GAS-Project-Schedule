# Work 0033 Manual Acceptance Guide - 2.8.20-prepilot

This guide is descriptive only. It does not authorize deployment, OAuth,
clasp, Gmail, Calendar, Task, Review, Setup, diagnostics, triggers,
Automation, Provider, or Apps Script function execution.

Required candidate: Code `2.8.20-prepilot`, Schema `2.6`, AI Schema `2.0`,
Migration `3`, `TEST_MODE=true`, Automation `OFF`.

Machine gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`.

The current source exposes no-argument `checkGeminiSyntheticReadiness()` and
`runGeminiSyntheticValidationOnce()`. Readiness is network-free. Validation
requires the actual Automation-OFF guard and one exact fictional UTF-8
synthetic message. A later authorized Work may permit one Gemini request after
the user manually enters the key in Script Properties. The key must not enter
source, evidence, GitHub, Codex, or ChatGPT.

Completed Gemini responses are accepted only as `thought* model_output`.
Thought signatures and summaries are opaque and never retained or exposed;
exactly one final text output reaches the existing strict application validator.

Before any future placement, verify source/release commits, checksums, exactly
23 `.gs` files plus `appsscript.json`, no credentials or identifiers, and no
scheduled trigger. Record every native observation as PASS, FAIL, or NOT
EXECUTED. Local checks do not prove native Google behavior.
