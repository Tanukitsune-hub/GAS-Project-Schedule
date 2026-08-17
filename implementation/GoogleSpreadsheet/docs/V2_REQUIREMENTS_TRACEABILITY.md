# Requirements Traceability - 2.8.19-prepilot

Last updated: 2026-08-14

Repository: `Tanukitsune-hub/GAS-Project-Schedule`

Current contract: Code `2.8.19-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`

Current machine gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

Work 0032 adds the following current evidence paths:

| Requirement | Primary evidence | Boundary |
|---|---|---|
| Callable Gemini readiness and validation entrypoints | `Menu.gs`, `20_GeminiProvider.gs`, `18_Worker.gs` | Local only; no Apps Script invocation |
| Actual Automation-OFF guard before external access | `12_Triggers.gs`, `20_GeminiProvider.gs`, Work 0029 runtime suite | Local fake runtime |
| Exact fictional UTF-8 fixture and one-message boundary | `20_GeminiProvider.gs`, `05_GmailGateway.gs`, Work 0029 runtime suite | Synthetic only |
| Strict thinking-step response parser | `20_GeminiProvider.gs`, Work 0030 parser suite | Fake UrlFetch only |
| Bounded Gemini diagnostics and exact synthetic routing | `20_GeminiProvider.gs`, `18_Worker.gs`, Work 0032 diagnostics suite | Synthetic fakes only |
| Documented Provider schema subset and strict app validator | `07_AiAdapter.gs`, Work 0028 Provider suite | Fake UrlFetch only |
| Bounded Gemini generation settings | `20_GeminiProvider.gs`, Work 0028 Provider suite | No real request |
| Code/release lineage and exact payload inventory | A19/B19 tools and `CURRENT_CONTRACT.json` | Local/fresh clone/CI |

The preserved baseline covers Task authority, Review/CAS, Gmail byte decoding,
Calendar intent, Dashboard ownership, diagnostics, privacy, and local secret
scans. Existing historical records are retained as evidence and are not
reinterpreted as current target selectors.

| D-033 | Raw edit values are event input only; authority is reconstructed from the validated ledger. |
| D-038 | Legacy v2 Error rows remain historical audit evidence and are not a current authority source. |

Real Gmail, Calendar, Sheets, OAuth, triggers, deployment, Task/Review
runtime, and Gemini behavior remain `NOT_EXECUTED` in Work 0032. No API key is
configured or inspected. A later Work may ask the user to enter the key
manually in Script Properties and run one synthetic-message validation.
