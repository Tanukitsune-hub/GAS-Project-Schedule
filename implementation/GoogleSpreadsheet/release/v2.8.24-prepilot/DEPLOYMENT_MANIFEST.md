# Google Workspace Personal Work OS v2
# Phase 8B Work 0037 Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |
| Source commit | `1dbd28fd8e98e13849a29f3c4eeb6fa6c5663eb1` |
| Release content commit | `SELF (the Git commit containing this manifest)` |
| Code Version | `2.8.24-prepilot` |
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
| Package prepared at | `2026-08-25T13:00:00+09:00` |
| Highest local status | `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT` |

This package contains the exact 23-file Apps Script source payload and the
Work 0037 Automatic Personal Inbox Shadow Pilot boundary. Automatic discovery
admits eligible personal Inbox mail, applies a Thread-wide 手動/除外 veto, and
excludes spam/trash, non-Inbox, Promotions, Social, clear newsletter/list mail,
and Google Calendar notifications. 手動/取込 is optional priority only and
Automation remains OFF. It is a candidate artifact, not a deployment or
runtime authorization.
Real Gemini, Gmail, Calendar, OAuth, Task, Review, Setup, diagnostics, triggers,
and production operations remain unexecuted.

## Payload

| Field | Value |
|---|---|
| Payload files | `24` |
| `.gs` files | `23` |
| Canonical payload-list SHA-256 | `e6268531010f813f8c2e6b1c50eb87fef082bcb5c76f0a68c86784375c88fe1a` |

| Relative path | SHA-256 |
|---|---|
| `apps-script/00_Config.gs` | `0747e123190688824ce191cafecba312fc46f7d92ab0a1f0caa028986303615f` |
| `apps-script/01_TypesAndSchemas.gs` | `1096aa80cd95fc4f4215072cdcdf88a059e1e36ce4c48c6521dfad9b6cf0f250` |
| `apps-script/02_Setup.gs` | `0e8ed392e85de6863dc1a6cd4f2e1ab9193635f6a04bb2343c1ee9548a80c58b` |
| `apps-script/03_SheetBuilder.gs` | `de99de32edb15b90a437788446bdb05a86a13e76853fa1a73347e0ae55fccbf6` |
| `apps-script/04_MessageStateRepository.gs` | `c99a0d761613471f9a5b31d68824414b734a75ff33259beac0bdc812cd10ed77` |
| `apps-script/05_GmailGateway.gs` | `cfd5abd0247fb12585351b8755ff2fd9f8e15ad3d41c8f6f5e343d7df9ce84f3` |
| `apps-script/06_EmailPreprocessor.gs` | `febba4f009201fdf880d39dc43f54c8ff3b9bc17790ce588aa9f9c9d60394657` |
| `apps-script/07_AiAdapter.gs` | `5ff32a910ddd9626d331539a58a1d8242b51998e2e929e5714380d67f706437f` |
| `apps-script/08_TaskRepository.gs` | `4eb1e9c98e123e714207ddd8e7d3d9b8a9e2f690729eb0ec318c0e3973fbd17a` |
| `apps-script/09_TaskReviewPolicy.gs` | `47d036409127dc96cdace40cf61428fdc002c5c48d963eeb004e721d8720c23c` |
| `apps-script/10_CalendarSync.gs` | `7ec0be9c1a18f99913dcab3f657fe737f6f2e6321a5661bd3c46e43f15232975` |
| `apps-script/11_EditHandler.gs` | `244b8424f8ffce15f436721484aeffa7b890d086926bd6530ce934b0e94f2297` |
| `apps-script/12_Triggers.gs` | `69f125b80862af3fd80413a67e3b2b2859afbdcf5ed6b742d6ac35283b20d751` |
| `apps-script/13_LogAndDeadLetter.gs` | `8a683761c58720152947b2ee8be11f946d2084a59a482a87b57a712fd3df7b2c` |
| `apps-script/14_Migrations.gs` | `4d93d8b336893a8d71392fbe7b5cf8222925d44cdd854b5b6df86e2ceea3e568` |
| `apps-script/15_Dashboard.gs` | `c18be435239c3468493971baab82fe746de4210f7513b1677eadff3b00405353` |
| `apps-script/16_Diagnostics.gs` | `b69eff8cc567969bf2fa00b6347009b7fdb0b38e06aa867684e8a7666c000c8c` |
| `apps-script/17_Utilities.gs` | `4cdc8b03d0d7023422c924ca3407c77e948f0db1a841a3414a1b635bde0d57bd` |
| `apps-script/18_Worker.gs` | `ac38f5e733230f549060824b0cc51e15cd7ffc3952dda3d5670fd0b91724c2e6` |
| `apps-script/19_RuntimeSettings.gs` | `106370ebf78c81266d061f690b3448902d40bf177f283d880fe3965ac6fc618f` |
| `apps-script/20_GeminiProvider.gs` | `c7eb7d3220dbfe7fb072c6af3613877fe47f6d8199fd4f2cb6d79fc3cae42579` |
| `apps-script/99_TestHarness.gs` | `b9f0f47d23943ac6f0cdb1b3a28d9c983980ae57716d7d6f74d9fb34d4a30a02` |
| `apps-script/appsscript.json` | `e546725fcfe47adfd40e094e66a6c866418cb6265441f541ee000c940d4a8afe` |
| `apps-script/Menu.gs` | `9a1329eb2088a0f63ec90a544d35489d927e786c57ea4a4de5d5cc3d1ae71f70` |

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
