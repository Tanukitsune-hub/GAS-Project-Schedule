# Google Workspace Personal Work OS v2
# Work 0039 Phase 8B Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Work | `0039` |
| Dispatch | `0039-CODEX-03` |
| Package | `v2.8.26-prepilot` |
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Source commit | `7c8b4c7709ab00b4d315f910b9271f3c4945b702` |
| Release content commit | `SELF (the Git commit containing this manifest)` |
| Code Version | `2.8.26-prepilot` |
| Schema Version | `2.6` |
| AI Schema Version | `2.0` |
| Migration Version | `3` |
| Task canonical columns | `50` |
| Authority store | `protected hidden Task Authority Ledger` |
| Authority ledger columns | `21` |
| Authority protocol | `versioned two-slot PREPARED/COMMITTED` |
| Snapshot-cell fallback | `FORBIDDEN` |
| TEST_MODE | `true` |
| Test harness | `included` |
| Automation default | `OFF` |
| Package prepared at | `2026-09-03T14:16:38+09:00` |
| Highest local status | `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT` |
| Live runtime | `NOT_EXECUTED` |

This is a derived, non-live Work 0039 candidate artifact. The canonical
developer source remains the modular `apps-script-v2/` directory. Provider
selection is code-owned by `WORK_OS_V2_ACTIVE_AI_PROVIDER`; only `GEMINI` and
`OPENAI` are allowed and absent selection remains Gemini for compatibility.

The direct OpenAI candidate is `gpt-5.6-luna` at
`https://api.openai.com/v1/responses` with structured JSON output,
`store=false`, no tools, no background execution, and no streaming. The
OpenAI governance state is `NOT_APPROVED_OR_UNKNOWN`; `store=false` is not
treated as proof of a retention tier. No company data or credential is
included, and no real Provider or Google Workspace request was executed.

Phase 8B retains `TEST_MODE=true` and `99_TestHarness.gs` for local
non-live validation. It is not a deployment or runtime authorization.

## Payload

| Field | Value |
|---|---|
| Payload files | `26` |
| `.gs` files | `25` |
| Canonical payload-list SHA-256 | `92924a4546dbddbee0274c5e07f6b63977563fd45f54496abcb70cb3ec4fc636` |

| Relative path | SHA-256 |
|---|---|
| `apps-script/00_Config.gs` | `9c84d2941e28a7e126bd864d403bb842cca5a04eee85d12c1fa8d6e1810dd83d` |
| `apps-script/01_TypesAndSchemas.gs` | `1096aa80cd95fc4f4215072cdcdf88a059e1e36ce4c48c6521dfad9b6cf0f250` |
| `apps-script/02_Setup.gs` | `7404dea0841887a4a06b2a1f28367e13c886c79352a1220d708ac90c02b1fad7` |
| `apps-script/03_SheetBuilder.gs` | `32c371b549db1e8ee68c1d09f68cbcafd25e8bff3b9cad06f41f60c2703d476d` |
| `apps-script/04_MessageStateRepository.gs` | `c99a0d761613471f9a5b31d68824414b734a75ff33259beac0bdc812cd10ed77` |
| `apps-script/05_GmailGateway.gs` | `cfd5abd0247fb12585351b8755ff2fd9f8e15ad3d41c8f6f5e343d7df9ce84f3` |
| `apps-script/06_EmailPreprocessor.gs` | `febba4f009201fdf880d39dc43f54c8ff3b9bc17790ce588aa9f9c9d60394657` |
| `apps-script/07_AiAdapter.gs` | `81d830fc2e4e1872efd43f5b28da7ab850dff7394feeeda00ad482ec7edd967a` |
| `apps-script/08_TaskRepository.gs` | `4eb1e9c98e123e714207ddd8e7d3d9b8a9e2f690729eb0ec318c0e3973fbd17a` |
| `apps-script/09_TaskReviewPolicy.gs` | `47d036409127dc96cdace40cf61428fdc002c5c48d963eeb004e721d8720c23c` |
| `apps-script/10_CalendarSync.gs` | `7ec0be9c1a18f99913dcab3f657fe737f6f2e6321a5661bd3c46e43f15232975` |
| `apps-script/11_EditHandler.gs` | `244b8424f8ffce15f436721484aeffa7b890d086926bd6530ce934b0e94f2297` |
| `apps-script/12_Triggers.gs` | `1032a952dca44acb36c9f1b5c3c52010d28f36274b55964d4a0de6794e395466` |
| `apps-script/13_LogAndDeadLetter.gs` | `fdb0d2dd81290f117cc7e286cea4e23b64e8da4001abe9114d59546adfac8b06` |
| `apps-script/14_Migrations.gs` | `4d93d8b336893a8d71392fbe7b5cf8222925d44cdd854b5b6df86e2ceea3e568` |
| `apps-script/15_Dashboard.gs` | `c18be435239c3468493971baab82fe746de4210f7513b1677eadff3b00405353` |
| `apps-script/16_Diagnostics.gs` | `b69eff8cc567969bf2fa00b6347009b7fdb0b38e06aa867684e8a7666c000c8c` |
| `apps-script/17_Utilities.gs` | `4cdc8b03d0d7023422c924ca3407c77e948f0db1a841a3414a1b635bde0d57bd` |
| `apps-script/18_Worker.gs` | `12d91c43e0b7a0021e8a6899c9089c3c49a8d0a979918ca2418ee394fb6fd762` |
| `apps-script/19_RuntimeSettings.gs` | `106370ebf78c81266d061f690b3448902d40bf177f283d880fe3965ac6fc618f` |
| `apps-script/20_GeminiProvider.gs` | `c7eb7d3220dbfe7fb072c6af3613877fe47f6d8199fd4f2cb6d79fc3cae42579` |
| `apps-script/21_OpenAiProvider.gs` | `893beea700c5e428ff419684033409d40abcfc398c6813efd9edf6bacaec51ba` |
| `apps-script/22_AiProviderSelection.gs` | `0bf6e899a48388d4f9f3e45247eb6074fc8d8bee1c7939f9d8c55cd5907d3292` |
| `apps-script/99_TestHarness.gs` | `b9f0f47d23943ac6f0cdb1b3a28d9c983980ae57716d7d6f74d9fb34d4a30a02` |
| `apps-script/Menu.gs` | `71a22cfed86a1ed7132bc9a7bab9c2b36b6cb8493a0bd9ea0d5e27a0711012c2` |
| `apps-script/appsscript.json` | `e546725fcfe47adfd40e094e66a6c866418cb6265441f541ee000c940d4a8afe` |

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

No credential, account identifier, private URL, raw Provider response, email
body, task content, or live Workspace identifier is included. Company OpenAI
data-governance approval, credentials, deployment, OAuth, trigger state, and
Automation remain `NOT EXECUTED` in this dispatch.
