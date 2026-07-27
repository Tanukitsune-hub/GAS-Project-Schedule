# v2初期実装の既定値

最終更新日: 2026-07-23  
Status: Adopted as v2 Initial Defaults  
Related Project: `google-workspace-personal-work-os`

## 1. 文書の位置付け

本書は、自動期日管理ツールv2を新しい空のGoogle Sheetsへ実装する際の既定値を定める。

v1.xの既定値および実装挙動は引き継がない。特に、2,000行の事前生成、要確認専用タブ、物理最終行依存、v1互換Migrationは採用しない。

## 2. 新規構築の前提

- 対象は新しい空のGoogleスプレッドシート
- v1 Schemaを検出した場合は自動変換せず停止する
- v1既存データの移行はv2安定後の別機能とする
- 自動処理の初期値は停止
- Mock Adapterの受入テスト後に実AIを設定する

## 3. Sheets初期構成

### 利用者向けタブ

```text
ダッシュボード
タスク一覧
設定
処理履歴
エラー・再実行
使い方
```

### 非表示管理タブ

```text
メール状態
システム設定
プロンプト版管理
同期状態
```

要確認専用タブは作成しない。

### 初期行数

| 項目 | 初期値 |
|---|---:|
| タスク一覧 | 100行 |
| 設定 | 50行 |
| 履歴・管理タブ | 100行 |
| 行不足時の追加単位 | 100行 |

- 空行へBoolean値を事前投入しない
- チェックボックスはData Validationだけを設定する
- 実データ作成時に必要なBoolean値を入れる
- Task追記位置は`task_id`または`origin_key`列の最初の論理空行とする
- `getLastRow()`をTask追記位置に使用しない

## 4. タスク一覧の初期列

### 利用者向け列

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

### 管理列

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

### 入力形式

| 列 | 形式 |
|---|---|
| 要確認、完了、対象外、返信待ち | Checkbox |
| 判断 | `未選択 / 受入 / 却下` |
| 対応状況 | `要確認 / 未対応 / 対応中 / 返信待ち / 完了 / 対象外 / 取消` |
| 期限根拠 | `明示 / 相対 / 推測 / 曖昧 / なし` |
| 優先度 | `高 / 中 / 低` |
| Calendar登録 | `自動 / 登録 / 対象外` |
| コメント | 自由記述文字列。Checkbox禁止 |
| 確認状態 | 自動管理 |
| 確認種別 | 自動管理 |

## 5. Gmail読取対象

### 通常自動処理

- 受信トレイ内の受信メール
- `setupSystem()`完了後に受信したメール
- setup watermarkから1日戻した候補検索
- 最終判定はMessage ID

### 手動テスト

- `手動/取込`付き最新メッセージだけ
- 最大10スレッド
- 最大1メッセージを初期値とする
- 通常Inboxを検索しない
- 自分から自分へ送った非機密テストメールも対象にできる

### 原則除外

- 迷惑メール
- ゴミ箱
- プロモーション
- ソーシャル
- 明らかなニュースレター
- Calendar招待等の自動通知

固定条件だけで業務メールを除外しない。

## 6. AIへ渡す情報

- 新着メール本文
- 件名
- 送信者または送信者ドメイン
- 受信日時
- 直前1～2メッセージ
- 同一スレッドのActive Task要約
- today、timezone

初期版では送らないもの。

- 添付ファイル
- 他スレッドのTask
- Calendar全体
- ログ、Dead Letter
- 認証情報

本文上限は20,000文字とする。

## 7. AI判定

| AI信頼度 | 処理 |
|---|---|
| 0.85以上 | 条件を満たせば通常Taskへ自動登録 |
| 0.60以上0.85未満 | タスク一覧へ要確認状態で登録 |
| 0.60未満 | 原則登録しない。ただし明示期限等は要確認に残す |

### 新規要確認Task

```text
status=REVIEW
needs_review=TRUE
decision=未選択
review_state=OPEN
```

### 既存Task変更候補

- 現在statusを維持
- `pending_action_type`へActionを保存
- `pending_changes_json`へ変更候補を保存
- `needs_review=TRUE`
- 受入時だけ適用する

### 必ず要確認

- 完了候補
- 取消候補
- 手動編集済み項目との競合
- 対象Taskが曖昧な更新
- 過去日への期限変更
- 期限削除

## 8. 期限解釈

| 種類 | 扱い |
|---|---|
| 明示期限 | 正式期限として自動採用可能 |
| 相対期限 | 定義済みルールで換算し自動採用可能 |
| 曖昧表現 | 要確認 |
| AI推測期限 | 推奨期限だけに保持。正式期限・Calendarへ自動登録しない |

基準タイムゾーンは`Asia/Tokyo`。

初期解釈。

- 今週中: 当該週の金曜日
- 来週中: 翌週の金曜日
- 月末: 暦月末
- 来週金曜日: 翌週の金曜日
- なるべく早く、早急に、近日中: 要確認
- 営業日計算: 初期版では行わない

`2026/8/31`、`2026-08-31`、`2026年8月31日`等の一般的な明示日付表現をテスト対象に含める。

## 9. Calendar登録

専用サブカレンダーは`自動期日管理`。

登録条件。

- Taskが要確認中ではない
- 明示期限または採用済み相対期限がある
- 完了、対象外、取消ではない
- 失念時の影響が一定以上ある

初期版は終日予定。

- タイトル: `【期限】タスク内容`
- 説明: 送信者、元メール、期限根拠、Task ID
- 完了・対象外・取消: イベント削除
- 期限変更: 既存イベント更新
- AI推測期限: 登録しない

## 10. 実行時間・バッチ

| 項目 | 初期値 |
|---|---:|
| 手動メール処理soft limit | 120秒 |
| 自動メール処理soft limit | 210秒 |
| 手動最大メッセージ数 | 1 |
| 自動最大メッセージ数 | 10 |
| 手動最大スレッド数 | 10 |
| 自動最大検索スレッド数 | 100 |
| Gmail検索ページサイズ | 25 |
| AI Action最大数 | 10 |
| Lock待機 | 5秒 |
| stale claim | 30分 |

- Googleの最大実行時間ぎりぎりまで処理しない
- soft limit到達前に新規claimを停止する
- 現在処理の安全なcheckpointで終了する
- 残件は次回へ繰り越す

## 11. Setup既定値

- 1シートずつ処理できる構成
- Sheet作成とSeed投入を別ステップにする
- 初期化前は管理シートを前提にしない
- 内部列IDをメモリ上のMapで管理する
- 必要な境界だけ`SpreadsheetApp.flush()`を使用する
- 列単位の大量Protectionを作らない
- Setupからメール処理やCalendar全同期を行わない

## 12. Diagnostic既定値

Quick Diagnosticで確認するもの。

- 必須シート
- 必須内部列ID
- 正式Gmailラベル
- Calendar ID
- Trigger
- Properties
- AI Adapter health

初期目標時間は60秒以内。

Diagnosticで行わないもの。

- Dashboard更新
- Task全行の再計算・更新
- レイアウト修復
- Calendar全Event同期
- Gmail全検索

## 13. エラーと再試行

- 処理失敗時にMessageをDONEへしない
- AI分類JSONを副作用前に保存する
- 最大3回の自動再試行
- 再試行間隔は5分、15分、60分
- 3回後はDead Letter
- Calendarだけ失敗した場合はAIを再実行しない
- `SYS/失敗`は未解決エラーがあるスレッドに付与する

## 14. データ保持

- Task: 自動削除しない
- Message State: 365日
- 処理履歴: 365日
- 解決済みエラー: 90日

会社規程が厳しい場合は会社規程を優先する。

## 15. 認証情報

- APIキーをSheetセルへ保存しない
- APIキーをコード、GitHub、Docsへ保存しない
- Script Propertiesは会社規程で許可された場合だけ使用する
- 会社管理のGoogle Cloud認証またはProxyを優先する
- 実AI開始前にデータ保持・課金・学習利用条件を確認する

## 16. Phase 1受入基準

- 空のSheetsから最小タブを作成できる
- setupが最大実行時間を超過しない
- タスク行が3行目付近から追加される
- コメント列にCheckboxが付かない
- 空行に`FALSE`が入らない
- 同じMock Taskを2回追加しても重複しない
- 再setupで既存Taskが消えない
- Quick Diagnosticが60秒以内に完了する
