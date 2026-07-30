# Company-PC Patch Manifest - v2.8.7-prepilot

Generated from a raw Git blob byte comparison between fixed T6.1 v2.8.6-prepilot payload and Release B7 v2.8.7-prepilot payload.

| Field | Value |
|---|---|
| Old fixed ref | 863217b99dfa1ad682a8f4dd1989212b0a8d548b |
| New fixed ref | SELF (the Git commit containing this transfer envelope) |
| New payload commit | 95bc7240d99124b245e188b8e646eccf6c3ead48 |
| Comparison | git_blob_raw_bytes_sha256 |
| appsscript.json changed | False |
| Unchanged payload file count | 17 |
| Automation default | OFF |
| Real Workspace retest | NOT_EXECUTED |

## 会社PCで差し替えるファイル

| Path | Change type | Old SHA-256 | New SHA-256 |
|---|---|---|---|
| 00_Config.gs | modified | b0492460453814e2b0938e58d9063a368ce6501a01d309c0285dd501051a16de | a0c5f8a26d2211bb6c57da0712da0ae61f372404856136c12a949b35c9e0c8a2 |
| 01_TypesAndSchemas.gs | modified | 4d78f9fb97165d42c55c551a41368f7a4f2d485ab2c90a5fa44ee0d44582d2dc | 1096aa80cd95fc4f4215072cdcdf88a059e1e36ce4c48c6521dfad9b6cf0f250 |
| 03_SheetBuilder.gs | modified | b802b6c8f0f0ec23f530cee6baf1510650ba3f45b7f542f22f820021068f6527 | de99de32edb15b90a437788446bdb05a86a13e76853fa1a73347e0ae55fccbf6 |
| 15_Dashboard.gs | modified | 48729ccf04a9f443e92b5dc96218ae05a23e512e1e5de050b1ab5799f0a78012 | fa2cb636997aa756b7f804b14672f9ac9a80944c5b36e09bb17380eb7b67bc42 |
| 16_Diagnostics.gs | modified | 4c2911a988e7055888d6a58a99bcaea9628cf96312ad2315b828c08889d67b9c | 22b4d57fa491c9b3ddc08dc5bccfaa5dd91ca36700137b081cb67c492ce6c8f0 |
| 99_TestHarness.gs | modified | 8d7c2f7a6057f992560c2a68d46194216f2c02427e41b5215a476e0e9c183873 | ea25116676844c739dda9873756295c3c32859ab9bf882f929c51b87e91673ab |

## 変更不要ファイル

- 02_Setup.gs
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
- appsscript.json
- Menu.gs

Files not listed for replacement are byte-identical between old and new payloads. Preserve them without replacement.

## Removed payload files

- None

Do not delete a removed file automatically. Stop for separate approval and safety review.

## Replacement order

1. 00_Config.gs
2. 01_TypesAndSchemas.gs
3. 03_SheetBuilder.gs
4. 15_Dashboard.gs
5. 16_Diagnostics.gs
6. 99_TestHarness.gs

Before replacement, confirm each company-PC file matches its old SHA-256. If it does not, stop. After replacement, confirm the new SHA-256. If it cannot be confirmed, stop.

## Post-update configuration checks

- CODE_VERSION=2.8.7-prepilot
- SCHEMA_VERSION=2.6
- AI_SCHEMA_VERSION=2.0
- MIGRATION_VERSION=3
- TEST_MODE=true
- AUTOMATION_ENABLED=false

## Safe resume from S00-S80

Treat the Sandbox as S00-S80 complete and S90/S99 incomplete. With separately granted execution authority only, revalidate S00-S80 and resume S90 Quick Diagnostic then S99.
Do not duplicate, delete, overwrite, or manually repair Gmail labels, the dedicated Calendar, Properties, the owner edit trigger, Task Authority Ledger, Task data, or Dashboard seed. Automation stays OFF and no five-minute trigger is created. If S90 is FAIL, leave S90/S99 incomplete and stop.

## Stop / rollback

Stop on old hash mismatch, unconfirmed new hash, manifest mismatch, or a genuine Quick Diagnostic FAIL. 手動修復 of Sheet, checkbox, Protection, Dashboard, Ledger, Gmail label, Calendar, trigger, or Task data is forbidden. A rollback requires a separately approved verified-old-payload procedure. This manifest does not declare real Workspace retest PASS.