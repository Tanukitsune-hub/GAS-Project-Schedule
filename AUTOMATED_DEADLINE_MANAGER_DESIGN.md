# Gmail・Sheets・Calendar横断 自動期日管理ツール v2設計構想

最終更新日: 2026-07-23  
Status: v2 Design Baseline  
Related Project: `google-workspace-personal-work-os`

## 1. 文書の目的

本書は、Gmail、Google Sheets、Google Calendar、Apps Scriptおよび会社環境で承認されたAIを連携し、メール起点のタスク・期日管理を自動化するv2設計を記録する。

v1.xプロトタイプの実装仕様は本書の正本ではない。v2では、`PROTOTYPE_V1_LESSONS_LEARNED.md`の再発防止ルールを必須条件とする。

プロジェクト管理上の正本。

- `PROJECT_CONTEXT.md`
- `MASTER_PLAN.md`
- `DECISIONS.md`
- `CURRENT_STATUS.md`

名称およびGmailラベルは`NAMING_AND_GMAIL_LABELS.md`を正とする。

## 2. v2の設計基準

- AI自動分類を前提とする
- 独立したManualモードを設けない
- `手動/取込`と`手動/除外`は例外的な人間補正とする
- Google Sheetsの`タスク一覧`を唯一の日常操作画面とする
- 要確認専用タブは作成しない
- v1.xコードを継ぎ足さない
- 新しい空のGoogle Sheetsへ新規構築する
- v1との後方互換Migrationを初期版に含めない
- Phaseごとの受入テストを通して段階実装する

## 3. 目標利用体験

```text
Gmailへメールを受信
↓
Apps Scriptが候補メールを小さなバッチで取得
↓
Message IDが未処理か確認
↓
AIがメールをactions[]として構造化分類
↓
タスク一覧へupsert
  ├─ 高信頼: 通常タスク
  ├─ 曖昧: 同じ行で要確認
  └─ 情報のみ: 原則登録なし
↓
重要期限だけを「自動期日管理」へ同期
↓
利用者はタスク一覧で受入、却下、完了、対象外、期限修正等を行う
```

利用者が日常的に開く画面は、原則としてダッシュボードとタスク一覧だけとする。

## 4. 基本アーキテクチャ

```text
Gmail
  ├─ 受信メール
  ├─ AI/* ラベル
  └─ 手動/* ラベル
        ↓
Apps Script v2
  ├─ Gmail Gateway
  ├─ Message State Repository
  ├─ AI Adapter
  ├─ Task Repository
  ├─ Calendar Sync
  ├─ Edit Handler
  ├─ Worker
  ├─ Log / Dead Letter
  ├─ Setup
  └─ Quick Diagnostic
        ↓
Google Sheets
  ├─ タスク一覧
  ├─ 設定
  ├─ 履歴・エラー
  └─ 非表示管理タブ
        ↓
Google Calendar
  └─ 自動期日管理
```

## 5. v2 Apps Script構成案

```text
00_Config.gs
01_TypesAndSchemas.gs
02_Setup.gs
03_SheetBuilder.gs
04_MessageStateRepository.gs
05_GmailGateway.gs
06_EmailPreprocessor.gs
07_AiAdapter.gs
08_TaskRepository.gs
09_TaskReviewPolicy.gs
10_CalendarSync.gs
11_EditHandler.gs
12_Triggers.gs
13_LogAndDeadLetter.gs
14_Migrations.gs
15_Dashboard.gs
16_Diagnostics.gs
17_Utilities.gs
18_Worker.gs
99_TestHarness.gs
Menu.gs
appsscript.json
```

### 責務分離

| モジュール | 責務 | 禁止事項 |
|---|---|---|
| Setup | 新規環境の構築 | Runtime処理を実行しない |
| SheetBuilder | Schema、入力規則、書式 | メール処理から呼ばない |
| GmailGateway | 検索、取得、ラベル | TaskやCalendarへ直接書かない |
| AiAdapter | Provider固有通信、Schema検証 | Sheetsを直接操作しない |
| TaskRepository | Taskの読取・upsert | Gmail検索を行わない |
| TaskReviewPolicy | 自動確定・要確認・受入・却下 | 外部サービスへ直接接続しない |
| CalendarSync | Event作成・更新・削除 | Taskの正本状態を独自変更しない |
| Diagnostics | 軽量な構成確認 | Dashboard更新、全行書換えを行わない |
| Worker | 処理順制御 | レイアウト修復を行わない |

## 6. Google Sheets設計

### 6.1 利用者向けタブ

```text
ダッシュボード
タスク一覧
設定
処理履歴
エラー・再実行
使い方
```

### 6.2 非表示管理タブ

```text
メール状態
システム設定
プロンプト版管理
同期状態
```

### 6.3 タスク一覧の利用者列

| 内部ID | 表示 | 型 | 編集 |
|---|---|---|---|
| `needs_review` | 要確認 | Boolean | 原則自動 |
| `decision` | 判断 | Enum | 可 |
| `status` | 対応状況 | Enum | 可 |
| `completed` | 完了 | Boolean | 可 |
| `excluded` | 対象外 | Boolean | 可 |
| `task_title` | タスク内容 | String | 可 |
| `due_date` | 期限 | Date | 可 |
| `suggested_due_date` | 推奨期限 | Date | 原則自動 |
| `deadline_basis` | 期限根拠 | Enum | 原則自動 |
| `priority` | 優先度 | Enum | 可 |
| `waiting_for_reply` | 返信待ち | Boolean | 可 |
| `calendar_sync_mode` | Calendar登録 | Enum | 可 |
| `comment` | コメント | String | 可 |
| `sender` | 送信者 | String | 不可 |
| `subject` | 件名 | String | 不可 |
| `received_at` | 受信日時 | DateTime | 不可 |
| `source_email` | 元メール | URL | 不可 |
| `review_state` | 確認状態 | Enum | 原則自動 |
| `review_type` | 確認種別 | Enum/String | 原則自動 |

### 6.4 管理列

```text
task_id
origin_key
source_message_id
source_thread_id
stable_thread_key
source_action_index
ai_action_type
ai_reason
ai_confidence
ai_provider
ai_model
ai_prompt_version
calendar_category
calendar_importance
calendar_event_id
calendar_sync_status
schedule_state
manual_fields
row_version
pending_action_type
pending_changes_json
created_at
updated_at
last_calendar_sync_at
```

### 6.5 物理行と論理行

- 行1: 内部列ID
- 行2: 日本語見出し
- 行3以降: Taskデータ
- Task行は`task_id`または`origin_key`がある行だけと定義する
- 追記位置は主キー列の最初の論理空行とする
- `getLastRow()`を追記位置の判断に使用しない
- 空行へ`FALSE`を事前設定しない
- 初期行数は50～100行程度とする

## 7. タスク状態

```text
REVIEW       要確認
OPEN         未対応
IN_PROGRESS  対応中
WAITING      返信待ち
DONE         完了
EXCLUDED     対象外
CANCELLED    取消
```

期限状態は別項目とする。

```text
NONE
FUTURE
UPCOMING
TODAY
OVERDUE
```

## 8. 確認・承認フロー

### 8.1 新規候補

自動確定できない新規候補は、Taskとして同じ一覧へ作成する。

```text
status=REVIEW
needs_review=TRUE
decision=未選択
review_state=OPEN
review_type=NEW_TASK
```

受入時。

```text
status=OPEN
needs_review=FALSE
review_state=APPLIED
decision=受入
```

却下時。

```text
status=EXCLUDED
excluded=TRUE
needs_review=FALSE
review_state=REJECTED
decision=却下
```

### 8.2 既存タスクの変更候補

既存タスクの現在状態を変更せず、候補を保存する。

```text
needs_review=TRUE
pending_action_type=UPDATE_DUE等
pending_changes_json={...}
review_state=OPEN
decision=未選択
```

受入時だけpending変更を適用する。

AIが提案する完了、取消、手動編集との競合は必ずこの経路へ送る。

## 9. Gmail取得設計

### 9.1 未処理

- Message IDを主キーとする
- 既読・未読は使用しない
- 同一スレッドの新着返信も新しいMessage IDなら処理する
- Stable Thread Keyで関連Taskを検索する

### 9.2 手動テスト

初期検証では次に限定する。

- `手動/取込`付き最新1メッセージ
- 最大10スレッド
- 最大1～3メッセージ
- 通常Inbox検索なし
- Mock Adapter

### 9.3 自動巡回

- 原則5分トリガー
- 少数バッチ
- 候補検索期間はwatermarkより1日戻す
- Message IDで重複排除
- ソフト実行時間上限で安全に中断
- 残件を次回へ繰り越す

## 10. AI Adapter

Provider-neutralなinterfaceとする。

```javascript
class AiAdapter {
  healthCheck() {}
  classify(input) {}
}
```

初期実装。

- `MockAiAdapter`
- 会社承認済み`GeminiApiAdapter`または代替Adapter

AI出力は`actions[]`形式。

```json
{
  "schema_version": "2.0",
  "overall_confidence": 0.9,
  "actions": [
    {
      "action_type": "NEW_TASK",
      "target_task_id": null,
      "task_title": "資料を提出する",
      "deadline": "2026-08-31",
      "suggested_deadline": null,
      "deadline_basis": "explicit",
      "priority": "medium",
      "waiting_for_reply": false,
      "needs_review": false,
      "calendar_category": "EXTERNAL_SUBMISSION",
      "calendar_importance": "high",
      "confidence": 0.92,
      "reason": "本文に提出依頼と明示期限がある"
    }
  ],
  "warnings": []
}
```

### 自動確定条件

- `NEW_TASK`または`ADD_TASK`
- confidence 0.85以上
- `needs_review=false`
- Schema warningなし
- 明確なタスク名
- 人間補正との競合なし

### 必ず確認するAction

- `MARK_COMPLETE`
- `CANCEL_TASK`
- 手動編集済み項目の変更
- 対象Taskが曖昧な更新
- 過去日への期限変更
- 期限削除

## 11. Calendar同期

専用Calendar名は`自動期日管理`。

登録条件。

- Taskが要確認中ではない
- 明示期限または採用済み相対期限がある
- Taskが未完了・対象内
- 失念時の影響が大きい

イベントは終日予定とする。

```text
タイトル: 【期限】タスク内容
説明: 送信者、期限根拠、元メール、Task ID
```

完了、対象外、取消で削除する。期限変更は既存Eventを更新する。

## 12. Setup設計

### 12.1 新規構築専用

v2初期版の`setupSystem()`は新しい空のGoogle Sheetsだけを対象とする。

- v1 Schemaを検出した場合は自動変換しない
- 明確なエラーと新規シート作成案内を表示する
- 既存Taskを削除しない

### 12.2 処理順

```text
1. Bound Spreadsheet確認
2. Instance ID作成
3. 最小シート作成
4. 内部列IDと見出し作成
5. 小範囲の入力規則・書式
6. 設定Seed
7. Gmailラベル作成
8. Calendar作成
9. Properties保存
10. Trigger作成
11. Quick Diagnostic
```

### 12.3 実行時間

- 1回のソフト上限を設定する
- 必要なら1シート単位で継続する
- 初期行数を50～100行に限定する
- 大量Protectionを作らない
- Sheetごとの処理時間をログに残す

## 13. Diagnostic設計

Quick Diagnostic。

- 必須シート
- 内部列ID
- 正式ラベル
- Calendar ID
- Trigger
- Properties
- AI Adapter health

禁止事項。

- Dashboard更新
- Taskの全行状態更新
- レイアウト修復
- Calendar全Event同期
- Gmail全検索

Quick Diagnosticは60秒以内を目標とする。

## 14. ログ・Dead Letter

- Message処理状態を段階保存する
- AI分類JSONを副作用前に保存する
- Task作成後にCalendarだけ失敗した場合はCalendarから再開する
- 最大3回の自動再試行
- 最大回数後はDead Letter
- メール本文、APIキー、tokenをログへ保存しない

## 15. Phase gate

各Phaseで次を満たすまで次へ進まない。

```text
[ ] 単体テストPASS
[ ] 結合テストPASS
[ ] 同じ入力の再実行で重複なし
[ ] 最大実行時間内
[ ] ログに機密情報なし
[ ] Setup再実行でデータ破損なし
[ ] 受入基準を記録
```

## 16. v1から引き継がないもの

- v1 Apps Scriptコード
- v1の要確認タブ
- v1の大量事前行生成
- v1の入力規則・Protection構造
- v1→v2直接Migration
- v1のSetup完了フラグ
- v1の物理列位置

引き継ぐのは要件、命名、実証済みのサービス連携方針およびLessons Learnedだけとする。
