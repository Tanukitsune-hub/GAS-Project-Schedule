# Phase 8B Dashboard Surface Blocker 復旧ガイド

対象: Code `2.8.8-prepilot` / Schema `2.6` / AI Schema `2.0` /
Migration `3`

歴史的な状態は `READY_FOR_PHASE8B_SANDBOX_RETRANSFER` です。これは固定T8の
非機密Phase 8B packageを搬入できた当時のcarriage-only statusです。この文書は
ローカル実装・搬入資料の作成手順を定義するもので、実Google Workspace
操作、Apps Script import、Setup、診断実行、Dashboard更新、OAuth、
deployment、`clasp push`、Automation有効化を承認しません。

> **Historical/nonoperative guide notice (0004).** The preceding v2.8.8/T8
> carriage status is historical provenance only. The sole current Company-PC
> boundary is fixed T11 `a3b5a5d8d851bf2d15a2738c54dc6bb31e231d33` at
> `implementation/GoogleSpreadsheet/transfer/v2.8.11-prepilot/`, under
> `READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER`. After hash confirmation,
> replace only the five T11 manifest-listed files and leave `appsscript.json`
> plus all unlisted files unchanged. No Setup, S90, S99, Dashboard refresh,
> Gmail, Calendar, Properties, triggers, Automation, tests, Migration, or
> repair is authorized; only one separately approved read-only T1-01 Quick
> Diagnostic re-observation may follow.

## 保持するSandbox状態

- 完了済み: S00～S80
- 未完了: S90、S99
- Automation: OFF
- 5分trigger: 未作成のまま

Gmail labels、専用Calendar、Properties、owner edit trigger、Task、
Task Authority Ledger、Dashboardの値・数式・note・書式・Protectionを
手動で修復、削除、再作成、上書きしないでください。旧T7を再実行しないで
ください。

## 修正版の技術契約

Dashboard Protectionは、Spreadsheet ownerとeffective userが内部で一致し、
`Protection.canEdit()` がtrueである場合に限り検証を続けます。そのうえで、
通常editor一覧が空のimplicit owner表現、またはownerだけを含むexplicit
owner表現のどちらかだけを許可します。

次は引き続きFAILです。

- owner取得不能（Shared Driveを含む）またはeffective user不一致
- `canEdit=false`、warning-only、domain edit、target audience
- 空またはforeign editor、複数editor
- Protectionの欠損、重複、説明・geometry不一致、unprotected range
- foreign/overlapping range Protection
- foreign named range
- 値、数式、入力規則、note、merge、hidden state、background、font、
  number formatの真正な競合
- canonical 3-row seedまたはowned markerの不一致

診断結果は閉じたreason/subreason enumと件数だけを返します。ユーザー識別
情報、セル値、数式、note、range address、ID、URLは返しません。

## 会社PCへの将来の差し替え

固定T7 payloadと最終v2.8.8 payloadのraw Git blob byte比較から生成された
固定T8 `69f843f6ea426ccb45d721a40508a35b0a59795d` 内の
`COMPANY_PC_PATCH_MANIFEST_ja.md` とJSON companionだけを正としてください。
推測でファイルを追加・除外しないでください。

別途の実行承認後に限り、各対象ファイルの旧SHA-256が一致することを確認して
manifest順に差し替え、各新SHA-256を確認します。1件でも不一致なら停止します。
`appsscript.json` はmanifestが変更ありと明示した場合だけ差し替えます。

## 将来の安全な再開

別途の実行承認と固定v2.8.8 transfer refの検証が完了した場合だけ、通常の
Setup resumeでS00～S80を再確認し、read-only S90を実行します。S90にFAILが
あればS90/S99を未完了のまま停止します。FAILがなければSetup自身だけがS90、
続いてS99を記録できます。

Quick Diagnostic中にDashboard refreshやmarker writeを行ってはいけません。
Gmail、Calendar、Providerへ接続せず、既存resourceを重複・削除・上書きせず、
Automationと5分triggerをOFFのまま維持します。

## Stop / rollback

次の場合は直ちに停止してください。

- 旧または新SHA-256がmanifestと一致しない
- transfer checksum、allow-list、provenance検証が一致しない
- v2.8.8以外のversion表示がある
- AutomationがON、または5分triggerが存在する
- 真正なDashboard conflictまたは他のQuick Diagnostic FAILがある

手動修復はrollbackではありません。rollbackが必要な場合は、別途承認された
検証済み旧payload手順を使用します。この文書はPhase 8B PASS、Phase 8C GO、
production ready、pilot readyを宣言しません。
