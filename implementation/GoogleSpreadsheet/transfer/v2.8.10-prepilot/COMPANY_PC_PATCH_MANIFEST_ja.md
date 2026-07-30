# Company-PC Patch Manifest - v2.8.10-prepilot

Generated from a raw Git blob byte comparison between fixed T9 v2.8.9-prepilot payload and Release B10 v2.8.10-prepilot payload.

| Field | Value |
|---|---|
| Old fixed ref | 781f408fcf0853a5fffee9c00d3022ee5e17b1d7 |
| New fixed ref | SELF (the Git commit containing this transfer envelope) |
| New payload commit | 3f4fe6c52be7bf9c66ad221594e6271feebb57ed |
| Comparison | git_blob_raw_bytes_sha256 |
| appsscript.json changed | False |
| Unchanged payload file count | 20 |
| Automation default | OFF |
| Real Workspace retest | NOT_EXECUTED |

## 会社PCで差し替えるファイル

| Path | Change type | Old SHA-256 | New SHA-256 |
|---|---|---|---|
| 00_Config.gs | modified | eb1aa7bf6be9ee78499dc635c36c930f021eeb3879541c90904d4d166d06e576 | 06d5c64d55bdfa8c49e6ebe60f92867bb8864a713611f251fa4cb5ac1448cb0e |
| 02_Setup.gs | modified | b1e8279e9266806988f9a4fc632d25e472da540808c0a98de6685abfc146a711 | 46baf94979ebef33f6350bc4016fea2282a7cf4a3f45a94b2962500065df010f |
| 15_Dashboard.gs | modified | 4d4f7f71ebb3ba8529f940af4ef370b2a1b482b005445514aeb01aa9a874020f | 5a6311f8a5fb61ed498af5961f946639e656b32437eddea8c7b0901a630845cc |

## 変更不要ファイル

- 01_TypesAndSchemas.gs
- 03_SheetBuilder.gs
- 04_MessageStateRepository.gs
- 05_GmailGateway.gs
- 06_EmailPreprocessor.gs
- 07_AiAdapter.gs
- 08_TaskRepository.gs
- 09_TaskReviewPolicy.gs
- 10_CalendarSync.gs
- 11_EditHandler.gs
- 12_Triggers.gs
- 13_LogAndDeadLetter.gs
- 14_Migrations.gs
- 16_Diagnostics.gs
- 17_Utilities.gs
- 18_Worker.gs
- 19_RuntimeSettings.gs
- 99_TestHarness.gs
- appsscript.json
- Menu.gs

Files not listed for replacement are byte-identical between old and new payloads. Preserve them without replacement.

## Removed payload files

- None

Do not delete a removed file automatically. Stop for separate approval and safety review.

## Replacement order

1. 00_Config.gs
2. 02_Setup.gs
3. 15_Dashboard.gs

Before replacement, confirm each company-PC file matches its old SHA-256. If it does not, stop. After replacement, confirm the new SHA-256. If it cannot be confirmed, stop.

## Post-update configuration checks

- CODE_VERSION=2.8.10-prepilot
- SCHEMA_VERSION=2.6
- AI_SCHEMA_VERSION=2.0
- MIGRATION_VERSION=3
- TEST_MODE=true
- AUTOMATION_ENABLED=false

## Safe resume from S00-S80

Treat the Sandbox as S00-S80 complete and S90/S99 incomplete. With separately granted execution authority only, revalidate S00-S80 and resume S90 Quick Diagnostic then S99.
Do not duplicate, delete, overwrite, or manually repair Gmail labels, the dedicated Calendar, Properties, the owner edit trigger, Task Authority Ledger, Task data, or Dashboard seed. Automation stays OFF and no five-minute trigger is created. If S90 is FAIL, leave S90/S99 incomplete and stop.

## Stop / rollback

Stop on old hash mismatch, unconfirmed new hash, manifest mismatch, or a genuine Quick Diagnostic FAIL including a Dashboard surface conflict. 手動修復 of Sheet, checkbox, Protection, Dashboard, Ledger, Gmail label, Calendar, trigger, or Task data is forbidden. A rollback requires a separately approved verified-old-payload procedure. This manifest does not declare real Workspace retest PASS.