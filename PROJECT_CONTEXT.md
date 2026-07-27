# Project Context

最終更新日: 2026-07-28  
Project ID: google-workspace-personal-work-os  
Owner: Repository owner  
Status: Active - Code 2.8.4-prepilot / REAUDIT_NO_GO  
Timezone: Asia/Tokyo

## 1. 目的

Gmail、Google Sheets、Google Calendar、Google Docs、Google Drive、NotebookLMおよびApps Scriptを連携し、メール起点のタスク・期日管理を自動化する。

中心となる利用体験。

```text
Gmailへメールを受信
↓
Apps Scriptが候補メールを小さなバッチで取得
↓
Gmail Message IDで未処理を確認
↓
会社承認済みAIが内容を構造化分類
↓
必要な候補をGoogle Sheetsの「タスク一覧」へupsert
↓
高信頼候補は通常タスク、曖昧候補は同じ行で要確認
↓
重要期限だけを専用Calendarへ同期
↓
利用者は原則「タスク一覧」と軽量Dashboardだけを確認
```

空のGoogleスプレッドシートへApps Scriptを導入し、各利用者が自分のGoogle Workspace権限で再現できる社内配布可能なツールへ発展させる。

部内展開を直ちに行わず、Repository owner本人によるSandbox・実業務パイロットと反復改善を経てから展開範囲を広げる。

## 2. 現在の公式方針

- Google Sheetsをタスク、期限、状態、確認結果の正本とする
- 日常操作画面を`タスク一覧`へ一本化する
- 軽量Dashboardは運用状況の集計専用とし、Workerの処理経路から直接更新しない
- 要確認専用タブは作成しない
- Apps Scriptを自動処理の中核とする
- Gmailをタスク・期日情報の入口とする
- Google Calendarは重要期限の可視化に限定する
- AI自動分類と人間補正の単一構成とする
- `手動/取込`と`手動/除外`はAI判定を補正する例外操作とする
- AIによる完了・取消・重要な既存タスク変更は人間の判断なしに確定しない
- v1.xプロトタイプを継ぎ足さず、v2を新しい空のスプレッドシートへ新規構築する
- v2初期版はv1との後方互換Migrationを持たない
- 通常利用者の操作は曖昧候補、完了、対象外、誤った期限等の例外処理へ限定する
- 自動処理は初期停止とし、Sandbox受入後に明示的に有効化する
- 実Provider、認証、credential保管方式は会社承認なしに確定しない
- Phase 8はSandbox準備、TEST_MODE Sandbox、実接続Sandbox、個人パイロットの順に進める
- ChatGPTとCodexの情報連携はGitHubを介して行い、ChatGPTが生成するCodex指示書は毎回`instructions/`へ保存し、GitHub URL付きの短い貼付文を同時に出力する

## 3. 対象範囲

### In Scope

- Gmail受信メールのAI分類
- Gmail Message IDを用いた未処理管理
- GmailへのAIラベル自動付与
- `手動/取込`および`手動/除外`による人間補正
- 1メール・1スレッドから複数タスクを抽出できる構造
- Google Sheets上のタスク、期限、状態、確認結果、完了、対象外、処理履歴管理
- タスク一覧上での要確認、受入、却下
- installable edit TriggerによるTask編集の安全な反映
- 専用サブカレンダー`自動期日管理`への重要期限同期
- Apps Scriptによる定期処理、初期構築、診断、ログ、再実行、Retry、Dead Letter
- 軽量な運用Dashboard
- Mock Adapterと会社承認済みAI Adapterの差替え境界
- Google Docs上の手引書、FAQ、仕様書、保守資料
- NotebookLMによる利用者支援
- 空のGoogle Sheetsからの新規セットアップ
- TEST_MODE=true、Automation OFF、非機密データでのSandbox受入

### Out of Scope

- 独立したManualモード
- 要確認専用タブ
- v1.xプロトタイプの本番利用
- v1.x既存シートを直接v2へ変換する初期Migration
- メールの自動送信
- AIによる無承認のタスク完了・取消
- 初期版での添付ファイル内容解析
- 初期版での送信済みメール常時巡回
- NotebookLMチャットのApps Scriptからの自動実行
- 管理者権限による全利用者Gmailの集中読取
- 個人PCへの会社メール、認証情報、未公表情報の持出し
- Phase 8B完了前の実業務メール利用
- 個人パイロット完了前の少人数・部内展開
- 高度なWork Block、日次・週次レビュー、スケジュール最適化

## 4. 利用環境

利用可能と確認済みのもの。

- Google Chrome
- Gmail
- Google Sheets
- Google Docs
- Google Drive
- Google Calendar
- Apps Script
- NotebookLM
- Gemini

会社環境で確認または承認が必要なもの。

- Gemini API、Vertex AIまたは代替AI Provider
- Apps Scriptから利用できる認証方式
- Google Cloudプロジェクト
- API課金主体および利用上限
- AI提供者のデータ保持・学習利用条件
- credential保管方式
- UrlFetchおよびOAuthスコープの管理者制限
- 他メンバー配布時のWorkspace管理者制限

Workspace Studioは使用しない。

## 5. RepositoryとSource of Truth

### Google Workspace内

- タスク、期限、進捗、確認状態、回答待ち、完了、対象外: Google Sheetsの`タスク一覧`
- 自動登録された重要期限: Google Calendarの`自動期日管理`
- メール原文およびラベル: Gmail
- 案件資料、成果物、原資料: Google Drive
- 利用手引書、FAQ、仕様書、保守資料: Google Docs
- 手引書に基づく検索・利用者向け質問: NotebookLM
- 自動処理、同期、初期構築、ログ、再実行: Apps Script

### GitHub / Git

`Tanukitsune-hub/GAS-Project-Schedule`を唯一のGitHub正本とする。

このRepositoryで一体管理するもの。

- context: `PROJECT_CONTEXT.md`、`MASTER_PLAN.md`、`DECISIONS.md`、`CURRENT_STATUS.md`
- implementation: `implementation/GoogleSpreadsheet/apps-script-v2/`
- tests and tools: `implementation/GoogleSpreadsheet/tests/`、`implementation/GoogleSpreadsheet/tools/`
- release and reports: `implementation/GoogleSpreadsheet/release/`、実装報告
- audit and instructions: `audits/`、`instructions/`
- ChatGPT–Codex handoff policy: `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`

別Repositoryを参照・更新・同期先として使用しない。

### ChatGPT / Codex handoff

ChatGPTとCodexの間の正式な作業引継ぎは、このRepositoryを介して行う。

ChatGPTがCodex向け作業指示書を生成する場合は、毎回、次を実施する。

1. 完成した指示書を回答前に`instructions/`へ保存する。
2. 長文はindexと番号付き分割ファイルへ分けてよい。
3. GitHubから保存内容を再取得し、branch、path、内容、参照URLを確認する。
4. Codexのチャット欄へ貼り付ける短い指示文を同時に出力する。
5. 短い指示文へ完全なGitHub URL、Repository、branch、path、status gate、主要禁止事項を含める。
6. GitHub保存に失敗した場合は保存済みと報告せず、正式な引継ぎ完了と扱わない。
7. Codexは実装、test、report、releaseおよび証跡を同じRepositoryへ戻し、ChatGPTはGitHub上の確定成果物を再監査する。

詳細は`CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`および`DECISIONS.md`のD-036を正とする。

詳細資料。

- `AUTOMATED_DEADLINE_MANAGER_DESIGN.md`
- `INITIAL_IMPLEMENTATION_DEFAULTS.md`
- `NAMING_AND_GMAIL_LABELS.md`
- `PROTOTYPE_V1_LESSONS_LEARNED.md`

実装Repository側の主要資料。

- `V2_IMPLEMENTATION_SPEC.md`
- `V2_CODEX_IMPLEMENTATION_PLAN.md`
- Requirements Traceability
- Manual Acceptance Guide
- Phase別実装・監査報告
- `release/v2.8.4-prepilot/`
- `release/v2.8.4-prepilot-phase8c/`

## 6. v2の基本原則

- 新しい空のGoogle Sheetsだけを初期対象とする
- v1プロトタイプのコードをコピーしてパッチしない
- Phaseごとの受入テスト完了前に次の機能へ進まない
- 追記位置に`getLastRow()`を使用せず、主キー列の最初の論理空行を使用する
- 空行へBoolean値を事前投入しない
- 初期行数は50～100行程度とし、必要時だけ拡張する
- Setup、Runtime、Diagnostic、Migrationの責務を分離する
- メール処理中に書式、入力規則、列順、Protectionを変更しない
- 設定、Task index、Message Stateは1実行内で原則1回だけ読み込む
- すべての長時間処理にsoft execution budgetを設ける
- 長時間のGmail、AI、Calendar外部I/Oをmain Script Lock内へ置かない
- claim、ownership、physical row version、business version、CAS、checkpointにより冪等性と競合安全性を確保する
- management列を含むeditはevent全体を拒否し、trusted full-row stateから完全復元する
- Setupはcurrent Schemaのdriftをsilent repairまたはsilent rebaselineしない
- Task editのCalendar reconcile intentをdurableに保存し、Outboxを再構築可能にする
- 診断は読取中心とし、Dashboard更新や全行書換えを行わない
- Dashboardは利用者領域を上書きせず、layout conflict時はfail-closedとする
- AI推測期限と正式期限を分離する
- AI推測だけの期限はCalendarへ自動登録しない
- OAuth権限は各利用者本人が承認する
- 自動処理は初期値停止とし、受入テスト後に明示的に開始する
- TEST_MODEと実Provider接続を明確に分離する
- 職場の情報管理規程を最優先する

## 7. タスク一覧と確認フロー

### 新規候補

- 高信頼かつ安全に確定できる場合: `status=OPEN`
- 人の確認が必要な場合: `status=REVIEW`、`needs_review=true`、`decision=未選択`
- 受入: `status=OPEN`へ移行
- 却下: `status=EXCLUDED`へ移行

### 既存タスクの変更候補

既存タスクの現在状態を維持し、次をpending項目へ保存する。

- `pending_action_type`
- `pending_changes_json`
- `needs_review`
- `decision`

受入時だけpending変更を適用し、却下時は既存Taskを変更せずpending項目を消去する。

## 8. 正式Gmailラベル

```text
AI/要対応
AI/期限
AI/返信待
AI/要確認
手動/取込
手動/除外
SYS/失敗
```

- 処理済みはMessage IDで管理する
- 完了・対象外・確認結果はGoogle Sheetsで管理する
- AIは人間が付与した`手動/*`を削除しない
- `手動/除外`を最優先し、次にMessage単位の`手動/取込`を優先する
- 未処理のexact `手動/取込` MessageはThread間・Thread内とも受信時刻の古い順に処理する

## 9. 現在の展開段階

```text
Phase 8A: Sandbox準備 - 履歴上完了
Code 2.8.4 Round 3 remediation - local完了、独立再監査待ち
Phase 8B: GO/PASS未宣言、実Workspace受入未実施
Phase 8C: GO未宣言
Phase 8D: Pilot ready未宣言
少人数限定展開 - 未着手
部内展開 - 未着手
```

Phase 8Bでは、実案件・未公表情報・個人情報を使用せず、新しい空のSpreadsheet、自分宛ての非機密メール、Mock AI、Automation OFFで受入を行う。

## 10. v1プロトタイプの扱い

v1.xは技術検証用プロトタイプとして完了した。

- 本番利用しない
- 自動処理を開始しない
- 旧スプレッドシートは検証記録として保存してよい
- v2コードベースへ継ぎ足さない
- 必要な旧タスクの移行はv2安定後に別タスクとして検討する

具体的な失敗事例と再発防止ルールは`PROTOTYPE_V1_LESSONS_LEARNED.md`を参照する。

## 11. GitHubへ保存しない情報

- APIキー、password、tokenその他の認証情報
- Authorization header、Cookie、private key
- 個人情報
- 会社の未公表情報
- メール本文、添付資料その他の秘密情報
- Google Workspace内の実データ
- 実際のSpreadsheet ID、Calendar ID、Gmail Message ID、Thread ID、内部URL
- 実AI request・response全文
- local `.clasp.json`その他の環境固有設定

GitHubには非機密の設計、判断、進捗、コード、synthetic test、テスト方針、release packageおよび未解決事項だけを保存する。
