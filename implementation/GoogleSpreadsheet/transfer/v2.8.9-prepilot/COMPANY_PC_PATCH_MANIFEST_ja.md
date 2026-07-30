# Company-PC Patch Manifest - v2.8.9-prepilot

Generated from a raw Git blob byte comparison between fixed T8 v2.8.8-prepilot payload and Release B9 v2.8.9-prepilot payload.

| Field | Value |
|---|---|
| Old fixed ref | 69f843f6ea426ccb45d721a40508a35b0a59795d |
| New fixed ref | SELF (the Git commit containing this transfer envelope) |
| New payload commit | b451d2361db99b4efbde036dafa3e2baf6b5cb97 |
| Comparison | git_blob_raw_bytes_sha256 |
| appsscript.json changed | False |
| Unchanged payload file count | 20 |
| Automation default | OFF |
| Real Workspace retest | NOT_EXECUTED |

## 会社PCで差し替えるファイル

| Path | Change type | Old SHA-256 | New SHA-256 |
|---|---|---|---|
| 00_Config.gs | modified | 4718462506c1b417269552e2859e7c4f90f98583b0075fbdf14a940c39dff152 | eb1aa7bf6be9ee78499dc635c36c930f021eeb3879541c90904d4d166d06e576 |
| 02_Setup.gs | modified | 4d7adcb1fc1d963d39fda6fa323f16d2be006f3de0e081d67512be13a5da1eea | b1e8279e9266806988f9a4fc632d25e472da540808c0a98de6685abfc146a711 |
| 15_Dashboard.gs | modified | 3e15db636b1cb501b07840ce5c0a37c553b78669eb9869cd3c8cdfd0caa16d7b | 4d4f7f71ebb3ba8529f940af4ef370b2a1b482b005445514aeb01aa9a874020f |

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

- CODE_VERSION=2.8.9-prepilot
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