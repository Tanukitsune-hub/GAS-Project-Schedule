# Google Workspace Personal Work OS v2
# Phase 8B Work 0036 Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Source commit | `0f0b7eab0ed27b883ae25fb15af4371b42157662` |
| Release content commit | `SELF (the Git commit containing this manifest)` |
| Code Version | `2.8.21-prepilot` |
| Schema Version | `2.6` |
| AI Schema Version | `2.0` |
| Migration Version | `3` |
| Task canonical columns | `50` |
| Authority store | `protected hidden Task Authority Ledger` |
| Authority ledger columns | `21` |
| Authority protocol | `versioned two-slot PREPARED/COMMITTED` |
| Snapshot-cell fallback | `FORBIDDEN` |
| TEST_MODE | `true` |
| Automation default | `OFF` |
| Package prepared at | `2026-08-19T00:00:00Z` |
| Highest local status | `READY_FOR_USER_PERSONAL_AUTOMATION_E2E` |

This package contains the exact 23-file Apps Script source payload and the
Work 0036 personal-automation qualification boundary. Automatic discovery is
restricted to the exact synthetic subject/body fixture and Automation remains
OFF. It is a candidate artifact, not a deployment or runtime authorization.
Real Gemini, Gmail, Calendar, OAuth, Task, Review, Setup, diagnostics, triggers,
and production operations remain unexecuted.

## Payload

| Field | Value |
|---|---|
| Payload files | `24` |
| `.gs` files | `23` |
| Canonical payload-list SHA-256 | `10e9567b6e88b98673c90098fa2e20217412a62fdea1c2d75b6d2eb368648dcc` |

| Relative path | SHA-256 |
|---|---|
| `apps-script/00_Config.gs` | `28bfc30ba7c3258b2e2a6638592ff717c8e428b0bcba1e18f5175461182cf60a` |
| `apps-script/01_TypesAndSchemas.gs` | `1096aa80cd95fc4f4215072cdcdf88a059e1e36ce4c48c6521dfad9b6cf0f250` |
| `apps-script/02_Setup.gs` | `40f02263ecaa365628074ec666054aa60e0727986c942aaba34e97b059e07d93` |
| `apps-script/03_SheetBuilder.gs` | `de99de32edb15b90a437788446bdb05a86a13e76853fa1a73347e0ae55fccbf6` |
| `apps-script/04_MessageStateRepository.gs` | `c99a0d761613471f9a5b31d68824414b734a75ff33259beac0bdc812cd10ed77` |
| `apps-script/05_GmailGateway.gs` | `48f2f7987722755ac610480365b90c8718c09c7e8e4acbb8d5c98001b95e569a` |
| `apps-script/06_EmailPreprocessor.gs` | `febba4f009201fdf880d39dc43f54c8ff3b9bc17790ce588aa9f9c9d60394657` |
| `apps-script/07_AiAdapter.gs` | `739098c205845e6360622cfa3be7013883affb33fe560319514e19560ef8f19a` |
| `apps-script/08_TaskRepository.gs` | `4eb1e9c98e123e714207ddd8e7d3d9b8a9e2f690729eb0ec318c0e3973fbd17a` |
| `apps-script/09_TaskReviewPolicy.gs` | `47d036409127dc96cdace40cf61428fdc002c5c48d963eeb004e721d8720c23c` |
| `apps-script/10_CalendarSync.gs` | `7ec0be9c1a18f99913dcab3f657fe737f6f2e6321a5661bd3c46e43f15232975` |
| `apps-script/11_EditHandler.gs` | `244b8424f8ffce15f436721484aeffa7b890d086926bd6530ce934b0e94f2297` |
| `apps-script/12_Triggers.gs` | `62c66877502f0efa9a8a6f7facf5ebb30a199cabd35d6f1872c9c5a9ed99ecc0` |
| `apps-script/13_LogAndDeadLetter.gs` | `84df90d249e8f215ffceda6301b1bd362637f72a2812154618990c4f5c058f67` |
| `apps-script/14_Migrations.gs` | `4d93d8b336893a8d71392fbe7b5cf8222925d44cdd854b5b6df86e2ceea3e568` |
| `apps-script/15_Dashboard.gs` | `c18be435239c3468493971baab82fe746de4210f7513b1677eadff3b00405353` |
| `apps-script/16_Diagnostics.gs` | `b69eff8cc567969bf2fa00b6347009b7fdb0b38e06aa867684e8a7666c000c8c` |
| `apps-script/17_Utilities.gs` | `592ecc851935ef4774df6f200beb2c78e0174c2421582b9f7db58042c8691e96` |
| `apps-script/18_Worker.gs` | `66c311d0eff8e237f0604e8e6953d46e4afafc4fc1da658eb22178290d2bd92a` |
| `apps-script/19_RuntimeSettings.gs` | `106370ebf78c81266d061f690b3448902d40bf177f283d880fe3965ac6fc618f` |
| `apps-script/20_GeminiProvider.gs` | `cebbe4842d4dae61457cca3440f23f4f3a6dd5195184fcba2232e66aa130dc1b` |
| `apps-script/99_TestHarness.gs` | `b9f0f47d23943ac6f0cdb1b3a28d9c983980ae57716d7d6f74d9fb34d4a30a02` |
| `apps-script/appsscript.json` | `e546725fcfe47adfd40e094e66a6c866418cb6265441f541ee000c940d4a8afe` |
| `apps-script/Menu.gs` | `d8cb8a2337acdd27e87753f4ce1fcf97b5098d98ce7532c1bc0bd517d0155912` |

## Services and safety

### OAuth scopes

- `https://www.googleapis.com/auth/spreadsheets.currentonly`
- `https://www.googleapis.com/auth/script.container.ui`
- `https://www.googleapis.com/auth/script.scriptapp`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/calendar.app.created`
- `https://www.googleapis.com/auth/calendar.calendarlist.readonly`
- `https://www.googleapis.com/auth/script.external_request`

### Advanced Services

- `Gmail`: service `gmail`, version `v1`
- `Calendar`: service `calendar`, version `v3`

No credentials, identifiers, private URLs, raw Provider responses, or real
data are included.
