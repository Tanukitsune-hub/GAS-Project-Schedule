# Google Workspace Personal Work OS

最終更新日: 2026-07-23  
Current Phase: v2 Redesign Baseline - Implementation Specification Pending

## 重要

このプロジェクトは、v1.xプロトタイプへの追加パッチを停止し、v2をゼロから再構築する段階にある。

次の旧文書・成果物は**現在の実装正本ではない**。

- `google_workspace_auto_deadline_manager_apps_script_spec_v1.0.md`
- v1.x Apps Scriptコード
- v1.xの要確認タブを含むシート構造
- v1.x向けMigrationおよび修正パッチ

旧仕様書は検証経緯の参照用であり、新しいコード生成の入力として単独使用してはならない。

## 読む順番

1. `CURRENT_STATUS.md`
2. `DECISIONS.md`
3. `PROJECT_CONTEXT.md`
4. `MASTER_PLAN.md`
5. `AUTOMATED_DEADLINE_MANAGER_DESIGN.md`
6. `INITIAL_IMPLEMENTATION_DEFAULTS.md`
7. `PROTOTYPE_V1_LESSONS_LEARNED.md`
8. `NAMING_AND_GMAIL_LABELS.md`

記述が矛盾する場合の優先順位。

1. より新しいDecision
2. `CURRENT_STATUS.md`の明示的な訂正
3. `PROJECT_CONTEXT.md`
4. `MASTER_PLAN.md`
5. v2詳細設計
6. v1以前の仕様・プロトタイプ資料

## v2の核心

- 新しい空のGoogle Sheetsへ新規構築する
- v1との後方互換Migrationを初期版に持たない
- 要確認専用タブを作らない
- 日常操作をタスク一覧へ一本化する
- 新規曖昧候補は`status=REVIEW`で同じ一覧へ登録する
- 既存タスク変更候補はpending項目へ保存する
- Setup、Runtime、Diagnostic、Migrationを分離する
- Phaseごとの最小縦フローと受入テストで実装する
- v1コードのコピー＆パッチを行わない

## 次の成果物

次に作成するのは、v2新規構築専用の詳細実装仕様書である。

仕様書確定前にApps Script本体を一括生成しない。
