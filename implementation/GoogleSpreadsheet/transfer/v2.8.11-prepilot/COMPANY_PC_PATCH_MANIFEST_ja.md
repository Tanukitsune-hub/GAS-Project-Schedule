# Company-PC Patch Manifest - v2.8.11-prepilot

Generated from a raw Git blob byte comparison between fixed T10 v2.8.10-prepilot payload and Release B11 v2.8.11-prepilot payload.

| Field | Value |
|---|---|
| Old fixed ref | 927d8567bce64461840cc6f72fbae0c1e636a8e6 |
| New fixed ref | SELF (the Git commit containing this transfer envelope) |
| New payload commit | 952438907e1a09092a46127dc130b3403a911db4 |
| Comparison | git_blob_raw_bytes_sha256 |
| appsscript.json changed | False |
| Unchanged payload file count | 18 |
| Automation default | OFF |
| Real Workspace retest | NOT_EXECUTED |

## 会社PCで差し替えるファイル

| Path | Change type | Old SHA-256 | New SHA-256 |
|---|---|---|---|
| 00_Config.gs | modified | 06d5c64d55bdfa8c49e6ebe60f92867bb8864a713611f251fa4cb5ac1448cb0e | d61390db1f52744b36b06865fa70d3aaa6c4fafe0316a138ff0bfb939345e868 |
| 02_Setup.gs | modified | 46baf94979ebef33f6350bc4016fea2282a7cf4a3f45a94b2962500065df010f | e2b5bcc42e54e3413fe8b11ce19ac805c0736c170d050c320ba5e9c37cb9dbba |
| 15_Dashboard.gs | modified | 5a6311f8a5fb61ed498af5961f946639e656b32437eddea8c7b0901a630845cc | c18be435239c3468493971baab82fe746de4210f7513b1677eadff3b00405353 |
| 16_Diagnostics.gs | modified | c299030a10893f9d8360ccbe9b0be9149ab9bf91a12b215ea2880acc9e1a5382 | b69eff8cc567969bf2fa00b6347009b7fdb0b38e06aa867684e8a7666c000c8c |
| Menu.gs | modified | 77e4141eb834276c475f1a4f76ab0d6cef4d49410464f2b6ad86be3303ccdaed | d96d7b9ba6a35cd1a9d0309fb0375699e1b1f89fbd851da86b26e680cbb59c15 |

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
- 17_Utilities.gs
- 18_Worker.gs
- 19_RuntimeSettings.gs
- 99_TestHarness.gs
- appsscript.json

Files not listed for replacement are byte-identical between old and new payloads. Preserve them without replacement.

## Removed payload files

- None

Do not delete a removed file automatically. Stop for separate approval and safety review.

## Replacement order

1. 00_Config.gs
2. 02_Setup.gs
3. 15_Dashboard.gs
4. 16_Diagnostics.gs
5. Menu.gs

Before replacement, confirm each company-PC file matches its old SHA-256. If it does not, stop. After replacement, confirm the new SHA-256. If it cannot be confirmed, stop.

## Post-update configuration checks

- CODE_VERSION=2.8.11-prepilot
- SCHEMA_VERSION=2.6
- AI_SCHEMA_VERSION=2.0
- MIGRATION_VERSION=3
- TEST_MODE=true
- AUTOMATION_ENABLED=false

## Safe completed-Sandbox retransfer

Treat the Sandbox as already complete through S99. Do not run Setup or resume any Setup stage. With separately granted execution authority only, reload the replacement files and run T1-01 Quick Diagnostic once. Record only the bounded summary fields and then stop.
Do not duplicate, delete, overwrite, or manually repair Gmail labels, the dedicated Calendar, Properties, the owner edit trigger, Task Authority Ledger, Task data, or Dashboard seed. Automation stays OFF and no five-minute trigger is created. A version-property mismatch must remain an explicit WARN; do not reconcile it.

## Stop / rollback

Stop on old hash mismatch, unconfirmed new hash, manifest mismatch, or a genuine Quick Diagnostic FAIL including a Dashboard surface conflict. 手動修復 of Sheet, checkbox, Protection, Dashboard, Ledger, Gmail label, Calendar, trigger, or Task data is forbidden. A rollback requires a separately approved verified-old-payload procedure. This manifest does not declare real Workspace retest PASS.