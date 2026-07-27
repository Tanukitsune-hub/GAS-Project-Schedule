# Master Plan

最終更新日: 2026-07-23  
Current Architecture: Apps Script v2 + AI classification + human confirmation in Tasks  
Current Phase: v2 Design Baseline - Rebuild Preparation

## 1. 結論

v1.xプロトタイプへの追加パッチは停止し、現在までに確定した要件と実地検証の学びを引き継いでv2をゼロから再構築する。

v2は、新しい空のGoogleスプレッドシートを対象とする。初期版ではv1との後方互換Migrationを実装しない。

## 2. 採用アーキテクチャ

```text
Gmail
  ├─ 新着メール
  ├─ AI自動ラベル
  └─ 人間の補正ラベル
        ↓
Apps Script v2
  ├─ Message IDによる未処理判定
  ├─ Gmail候補検索
  ├─ AI Adapter
  ├─ Task upsert
  ├─ pending review適用
  ├─ Calendar同期
  ├─ Logs / Dead Letter
  └─ 最小セットアップ・軽量診断
        ↓
Google Sheets
  ├─ ダッシュボード
  ├─ タスク一覧（唯一の日常操作画面）
  ├─ 設定
  ├─ 処理履歴
  ├─ エラー・再実行
  └─ 使い方
        ↓
Google Calendar
  └─ 専用サブカレンダー「自動期日管理」
        ↓
Google Docs / NotebookLM
  ├─ 利用手引書・仕様書・FAQ
  └─ 利用者向け検索・質問窓口
```

独立したManualモードおよび要確認専用タブは設けない。

## 3. サービス別の役割

| サービス | 役割 |
|---|---|
| Gmail | 依頼、期限変更、取消、回答等の入口。AI・補正ラベルの表示先 |
| Google Sheets | タスク、期限、状態、確認結果、完了、対象外の正本兼操作画面 |
| Apps Script | 巡回、分類連携、upsert、同期、ログ、再実行、初期構築の中核 |
| Google Calendar | 失念時の影響が大きい重要期限だけを可視化 |
| Google Docs | 利用手引書、FAQ、仕様書、保守資料、変更履歴の正本 |
| NotebookLM | 手引書に基づく利用者向け検索・質問窓口 |
| Gemini API等 | メール内容の意味分類と構造化抽出 |

## 4. Google Sheets構成

### 4.1 利用者向けタブ

```text
ダッシュボード
タスク一覧
設定
処理履歴
エラー・再実行
使い方
```

### 4.2 非表示管理タブ

```text
メール状態
システム設定
プロンプト版管理
同期状態
```

要確認タブは作成しない。

### 4.3 タスク一覧の利用者向け列

推奨順。

```text
要確認
判断
対応状況
完了
対象外
タスク内容
期限
推奨期限
期限根拠
優先度
返信待ち
Calendar登録
コメント
送信者
件名
受信日時
元メール
確認状態
確認種別
```

### 4.4 管理列

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

管理列は右側へ配置し、原則非表示・保護する。

## 5. 確認フロー

### 5.1 新規タスク候補

```text
AI高信頼・安全に確定可能
  → status=OPEN

曖昧・低信頼・重要判断あり
  → status=REVIEW
  → needs_review=TRUE
  → decision=未選択
     ├─ 受入 → status=OPEN
     └─ 却下 → status=EXCLUDED
```

### 5.2 既存タスク更新候補

既存ステータスを維持し、次へ候補を保存する。

```text
pending_action_type
pending_changes_json
needs_review=TRUE
decision=未選択
```

- 受入: pending変更を適用し、pending項目をクリア
- 却下: 既存タスクを変更せず、pending項目をクリア
- 完了・取消・手動編集との競合は必ず人間確認

## 6. Gmail設計

### 6.1 処理単位

- 処理単位はGmail Message ID
- 同一スレッドの新着返信もMessage IDが異なれば別処理
- 既読・未読を処理済み判定に使用しない
- `1スレッド = 1タスク`としない

### 6.2 正式ラベル

```text
AI/要対応
AI/期限
AI/返信待
AI/要確認
手動/取込
手動/除外
SYS/失敗
```

### 6.3 初期テスト

- 自動処理開始前は通常Inboxを検索しない
- `手動/取込`付き最新1メッセージだけを対象にする
- 最大10スレッド、最大1～3メッセージで確認する
- Mock Adapterで縦フローを通してから実AIへ接続する

## 7. AI分類設計

AI出力は`actions[]`形式とし、1メールの複数依頼へ対応する。

主なAction。

```text
NEW_TASK
ADD_TASK
UPDATE_DUE
CANCEL_TASK
MARK_COMPLETE
SET_WAITING
CLEAR_WAITING
INFORMATION_ONLY
UNCLEAR
```

初期閾値。

| 条件 | 処理 |
|---|---|
| confidence >= 0.85かつ曖昧性なし | 通常タスクとして自動登録可能 |
| 0.60 <= confidence < 0.85 | タスク一覧へ要確認状態で登録 |
| confidence < 0.60 | 原則登録しない。ただし明示期限等は要確認に残す |

AI推測期限は`recommended_due_date`として保持し、正式期限またはCalendarへ自動登録しない。

## 8. Calendar設計

正式名称は`自動期日管理`。

登録対象。

- 外部提出期限
- 最終資料期限
- 契約・申込期限
- 入札期限
- 法務・税務・規制期限
- その他、失念時の影響が大きい明示期限

登録しないもの。

- 要確認中の新規タスク
- 期限未定
- AI推測期限だけのタスク
- 回答待ちだけのタスク
- 完了・対象外・取消済みタスク

Calendar Event IDとTask IDタグで重複を防ぐ。Calendarは正本ではなく、変更はSheetsから行う。

## 9. v2実装フェーズ

### Phase 0: 仕様固定

- タスク列、状態遷移、AI Schema、Calendar条件を確定
- v1 Lessons Learnedを受入基準へ反映

完了条件: コード生成前に仕様書レビューを完了する。

### Phase 1: 最小Sheets基盤

- 空Sheetからタスク一覧、設定、管理タブを作成
- 初期行数50～100行
- 主キー列基準の論理空行検索
- Mockデータを3行目へ登録

完了条件: 空行の`FALSE`や2,000行目以降への追記が発生しない。

### Phase 2: Gmail手動取込

- 正式ラベル作成
- `手動/取込`付き最新1メッセージ取得
- Message ID重複防止
- 既読・未読非依存

完了条件: 同じメールを2回処理してもTaskが重複しない。

### Phase 3: Mock AI縦フロー

- Gmail → Mock classification → Task upsert
- 高信頼と要確認の両方をテスト
- 同じ行で受入・却下

完了条件: 要確認専用タブなしで一連の操作が完了する。

### Phase 4: Calendar同期

- 明示重要期限の作成、更新、削除
- 要確認中は登録しない

完了条件: 同一TaskのEventが重複しない。

### Phase 5: 実AI Adapter

- 会社承認済みGemini API等
- Structured Output
- Schema validation
- timeout、429、5xx処理

完了条件: 非機密メールで手動実行が安定する。

### Phase 6: 自動ポーリング

- 5分トリガー
- 少数バッチ
- soft execution budget
- watermarkとMessage State

完了条件: タイムアウトせず繰越し可能。

### Phase 7: Logs・Dead Letter・診断

- 軽量Quick Diagnostic
- 再試行3回
- Dead Letter
- Dashboardは別処理

完了条件: 診断60秒以内、失敗後に重複なく再開可能。

### Phase 8: 配布・受入

- 新規別アカウントで再現
- 手引書のみで導入
- 情報管理確認

## 10. 実装上の禁止事項

- v1コードをベースにパッチを重ねない
- 初期版でv1互換Migrationを作らない
- `getLastRow()`をTask追記位置へ使用しない
- 空行へ`FALSE`を事前投入しない
- 2,000行分の入力規則・Protectionを初期生成しない
- Runtimeからレイアウト修復を呼ばない
- DiagnosticからDashboard更新や全行書換えを呼ばない
- 同じSheetを1実行内で何度も全件読込しない
- AI結果保存前にTask・Calendar等の副作用を開始しない
- 自動処理を初期値ONにしない

## 11. 配布・初期セットアップ

v2初期版の配布方式。

```text
新しい空のGoogleスプレッドシートを作成
↓
Apps Script v2一式を貼付
↓
setupSystem()を実行
↓
本人がOAuth承認
↓
最小タブ、正式ラベル、Calendar、設定を生成
↓
セルフテスト
↓
手動取込＋Mockテスト
↓
会社承認済みAIを設定
↓
手動実AIテスト
↓
自動処理を明示的に開始
```

## 12. 参考資料

v1で発生した具体的な問題と強制ガードレールは`PROTOTYPE_V1_LESSONS_LEARNED.md`を正とする。
