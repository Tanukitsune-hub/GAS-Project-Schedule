# Phase 8B Setup blocker — 失敗済みSandboxの安全な扱い

対象: P10 の `2.8.5-prepilot` Phase 8B packageで初回Setupが停止した
Sandbox。現在の状態は `PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER` です。

## 今すぐ維持すること

- Automation は **OFFのまま**にしてください。
- `Task Authority Ledger` を手動で非表示にしないでください。これは製品の
  修正でも、再開条件でもありません。
- P10 packageでSetupの続行、Quick Diagnostic、Deep Diagnosticを実行しないで
  ください。
- Task行、Ledger、snapshot cell、noteを手作業で修復・再生成しないでください。
- 失敗したSpreadsheetは削除しないでください。必要なら安全な証跡名に変更して
  保全してください。ID、URL、アカウント、画面画像、実データをこのRepositoryへ
  記録しないでください。

## 失敗を再現・拡大させないために

P10で確認された安全な停止は
`E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN` / `TASK_AUTHORITY` です。失敗後に追加操作を
行わず、記録が必要な場合は code、stage、completed stages のような安全な情報だけを
残してください。実Gmail、既存Calendar、Provider、production trigger、実案件または
個人情報は使わないでください。

## 修正版を受け取った後だけ行うこと

`2.8.6-prepilot` の新しいtransfer packageが、明示承認・normal publication・
fresh-clone verificationを終え、`READY_FOR_PHASE8B_SANDBOX_RETRANSFER` と記録される
まで、実行を再開しないでください。

承認後も、次のいずれかを**明示的な次の指示の下で**選びます。

1. 保全した失敗Spreadsheetに対して、安全なresumeを試す。
2. 第二の新規・空のSpreadsheetを使う。

どちらの場合も、AutomationはOFF、`TEST_MODE=true`、Mock AI、非機密のsynthetic
test dataに限定します。Setup実行、OAuth、Apps Script import、Gmail/Calendar操作、
deployment、`clasp push`、Provider設定、trigger有効化は、このガイド自体では承認
しません。

## 停止とエスカレーション

修正版で不一致や失敗が起きた場合は、追加の手動修復をせず停止してください。安全な
code/stageだけを記録し、既存証跡を保全したまま、次の明示指示を待ちます。この手順は
Phase 8B PASS、Phase 8C GO、production ready、pilot readyを意味しません。
