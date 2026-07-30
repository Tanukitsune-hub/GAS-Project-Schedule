# Company-PC Patch Manifest - v2.8.8-prepilot

Generated from a raw Git blob byte comparison between fixed T7 v2.8.7-prepilot payload and Release B8 v2.8.8-prepilot payload.

| Field | Value |
|---|---|
| Old fixed ref | 008c643b85c6b234ad489d946033cb9c06d32920 |
| New fixed ref | SELF (the Git commit containing this transfer envelope) |
| New payload commit | a17d34422ed521cee81340902d9a19e2da372201 |
| Comparison | git_blob_raw_bytes_sha256 |
| appsscript.json changed | False |
| Unchanged payload file count | 20 |
| Automation default | OFF |
| Real Workspace retest | NOT_EXECUTED |

## 会社PCで差し替えるファイル

| Path | Change type | Old SHA-256 | New SHA-256 |
|---|---|---|---|
| 00_Config.gs | modified | a0c5f8a26d2211bb6c57da0712da0ae61f372404856136c12a949b35c9e0c8a2 | 4718462506c1b417269552e2859e7c4f90f98583b0075fbdf14a940c39dff152 |
| 15_Dashboard.gs | modified | fa2cb636997aa756b7f804b14672f9ac9a80944c5b36e09bb17380eb7b67bc42 | 3e15db636b1cb501b07840ce5c0a37c553b78669eb9869cd3c8cdfd0caa16d7b |
| 16_Diagnostics.gs | modified | 22b4d57fa491c9b3ddc08dc5bccfaa5dd91ca36700137b081cb67c492ce6c8f0 | c299030a10893f9d8360ccbe9b0be9149ab9bf91a12b215ea2880acc9e1a5382 |

## 変更不要ファイル

- 01_TypesAndSchemas.gs
- 02_Setup.gs
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
2. 15_Dashboard.gs
3. 16_Diagnostics.gs

Before replacement, confirm each company-PC file matches its old SHA-256. If it does not, stop. After replacement, confirm the new SHA-256. If it cannot be confirmed, stop.

## Post-update configuration checks

- CODE_VERSION=2.8.8-prepilot
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