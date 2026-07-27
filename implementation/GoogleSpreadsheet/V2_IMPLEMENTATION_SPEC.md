# Google Workspace Personal Work OS v2 詳細実装仕様書

- 文書版: 0.9.0-draft
- 作成日: 2026-07-23
- Project ID: `google-workspace-personal-work-os`
- 対象: 新しい空のGoogle Sheetsに紐づけるApps Script v2
- 基準タイムゾーン: `Asia/Tokyo`
- 想定読者: Codex、Apps Script実装担当、レビュー担当
- 状態: Codex投入用Draft。正本4ファイルを変更する文書ではない
- 実装開始条件: 本書と`V2_CODEX_IMPLEMENTATION_PLAN.md`を同時に読むこと

## 1. 目的

本書は、Gmailで受けた依頼、期限変更、取消、完了、返信待ち等をMessage ID単位で処理し、Google Sheetsの`タスク一覧`へ冪等に反映し、重要な正式期限だけを専用Google Calendar`自動期日管理`へ同期するApps Script v2の実装契約を定める。

Codexは本書を「完成イメージの参考」ではなく、Phaseごとに検証可能な実装仕様として扱う。曖昧な点を勝手に拡張せず、安全側の停止、要確認、Feature Flag、未実装stubのいずれかを選ぶ。

## 2. Source of Truthと優先順位

実装前に次を読む。

1. `CURRENT_STATUS.md`
2. `DECISIONS.md`
3. `PROJECT_CONTEXT.md`
4. `MASTER_PLAN.md`
5. `AUTOMATED_DEADLINE_MANAGER_DESIGN.md`
6. `INITIAL_IMPLEMENTATION_DEFAULTS.md`
7. `PROTOTYPE_V1_LESSONS_LEARNED.md`
8. `NAMING_AND_GMAIL_LABELS.md`
9. 本書
10. `V2_CODEX_IMPLEMENTATION_PLAN.md`

矛盾時の優先順位は、より新しいDecision、`CURRENT_STATUS.md`の明示訂正、`PROJECT_CONTEXT.md`、`MASTER_PLAN.md`、v2補助仕様、v1以前の資料の順とする。

本書は正本4ファイルの内容を具体化する。正本と矛盾する場合は本書を修正し、正本を自動的に上書きしない。

## 3. 「Googleスケジュール管理システム」旧議論の取り込み

旧Google Workspace個人業務OS／スケジュール管理議論は、要件の由来と将来拡張の入力として参照する。ただし、v1のコード、Review Queue、Manualモード、旧ラベル、物理列、Migrationは実装入力にしない。

| 旧議論の要素 | 扱い | v2での反映 |
| --- | --- | --- |
| SheetsをTask/TODOの正本とする | 採用 | 現行の`タスク一覧`へ統合 |
| Calendarを会議・出張・実作業時間・重要期限に限定する | 採用 | 初期v2が書くのは専用`自動期日管理`だけ。メインCalendarは変更しない |
| 重要期限と通常Taskを分離する | 採用 | 正式期限かつ影響大のTaskだけ終日Event |
| Stable Thread Keyでスレッド更新を追跡する | 採用 | 先頭Message IDを使用 |
| 期限変更・取消・完了・返信待ち・追加依頼を追跡する | 採用 | AI Actionとpending reviewで実装 |
| Review Queueを別タブにする | 置換済み | `タスク一覧`の同一行で受入・却下 |
| Manualモードを独立運用する | 置換済み | AI自動分類と人間補正の単一構成。Mockは受入試験用Adapter |
| OS/系Gmailラベル | 置換済み | 正式7ラベルへ統一 |
| Workspace Studioを使う | 不採用 | Apps Script中心 |
| 作業ブロック自動同期 | 後続拡張 | 初期Phase 1～8では実装しない。明示操作型で再設計 |
| 日次ブリーフ・週次レビュー | 後続拡張 | TaskとCalendarのread-only集計としてPhase 9候補 |
| 面談前ブリーフ・面談後議事録/TODO/返信ドラフト | 後続拡張 | 自動送信・正本上書きを禁止した独立モジュールとして検討 |
| Projects / Meetings / Docs / Drive / NotebookLM連携 | 後続拡張 | 初期スキーマへ混在させず、安定後に別Decisionで採否を確定 |

初期v2の核心はメール起点Taskと重要期限である。会議、出張、作業ブロック、日次・週次レビュー、面談前後処理は捨てずに後続拡張契約へ切り出す。これにより、初期縦フローを小さく保ちながら、スケジュール管理システム全体へ拡張できる。

## 4. 初期v2の範囲

### 4.1 In Scope

- 新しい空のGoogle Sheetsからの段階的セットアップ
- 利用者向け6タブ、非表示管理4タブ
- 正式Gmailラベル7個
- Gmail Message IDによる未処理管理
- `手動/取込`付き最新メールの限定取込
- Mock AI Adapter
- Provider-neutral AI Adapter interface
- 1メールから複数Actionを抽出できる`actions[]`
- `タスク一覧`への冪等upsert
- 新規候補と既存変更候補の同一行レビュー
- 明示期限／採用済み相対期限とAI推測期限の分離
- 専用Calendar`自動期日管理`への重要期限同期
- 5分ポーリングの開始・停止
- Lock、soft execution budget、checkpoint、retry、Dead Letter
- Quick Diagnostic、明示実行のDashboard更新
- 日本語UI、英語の内部ID・Enum・設定キー
- 非機密のテストHarnessと導入手順

### 4.2 Out of Scope

- v1.xコードのコピー、パッチ、直接Migration
- v1シートの本番利用
- 要確認専用タブ
- 独立したManualモード
- メール送信、返信、転送
- メール削除、アーカイブ、既読・未読変更
- 添付ファイル解析
- 送信済みメールの常時巡回
- AIによる無承認の完了、取消、期限削除、重要変更
- メインCalendar上の会議、出張、作業ブロックの自動変更
- Driveファイル削除、移動、共有権限変更
- Docs正本の無承認上書き
- NotebookLMチャットの自動実行
- 管理者権限による全利用者Gmail集中読取
- APIキー、password、token、会社未公表情報、個人情報のGitHub保存

## 5. セキュリティと運用境界

1. 各利用者が自分のGoogle WorkspaceアカウントでOAuthを承認する。
2. installable triggerは作成者の権限で動くため、各利用者のコピーごとに作成する。
3. APIキーはSheet、コード、GitHub、Docsへ保存しない。
4. Script Propertiesへの秘密保存は会社規程で許可された場合だけとする。会社管理のGoogle Cloud認証またはProxyを優先する。
5. ログへメール本文、添付、認証情報、完全なAI prompt、HTTP Authorization headerを保存しない。
6. GitHubには実際のSpreadsheet ID、Calendar ID、Gmail Message ID、内部URLを保存しない。
7. 自動処理は初期値停止。Mock受入後、明示的な`startAutomation()`だけで開始する。
8. 既存非空Sheetやv1環境を検出した場合、削除・変換せず停止する。
9. 実AI開始前に、Provider、認証、課金、保持、学習利用、監査、OAuth/UrlFetch制限を確認する。
10. 会社規程が本書より厳しい場合、会社規程を優先する。

## 6. 全体アーキテクチャ

```text
Gmail
  ├─ 受信Message
  ├─ AI/* labels
  └─ 手動/* labels
        ↓
GmailGateway
        ↓
MessageStateRepository
        ↓
EmailPreprocessor
        ↓
AiAdapter
        ↓
TaskReviewPolicy
        ↓
TaskRepository ──→ タスク一覧
        ↓
Calendar Outbox
        ↓
CalendarSync ──→ 自動期日管理

横断機能:
Setup / Triggers / EditHandler / Logs / Dead Letter
Diagnostics / Dashboard / TestHarness
```

### 6.1 正本

- Task、正式期限、状態、確認結果: `タスク一覧`
- メール原文: Gmail
- Message処理進捗: `メール状態`
- Calendar副作用進捗: `同期状態`
- 重要期限の表示: `自動期日管理`
- コード、Prompt、Schema: GitHub上のApps Script v2コード
- API認証: 会社承認済み方式
- CalendarはTask正本ではない。Calendar側の手動変更をTaskへ逆同期しない。

## 7. Codexが作成するリポジトリ構成

```text
projects/google-workspace-personal-work-os/
├─ V2_IMPLEMENTATION_SPEC.md
├─ V2_CODEX_IMPLEMENTATION_PLAN.md
└─ apps-script-v2/
   ├─ 00_Config.gs
   ├─ 01_TypesAndSchemas.gs
   ├─ 02_Setup.gs
   ├─ 03_SheetBuilder.gs
   ├─ 04_MessageStateRepository.gs
   ├─ 05_GmailGateway.gs
   ├─ 06_EmailPreprocessor.gs
   ├─ 07_AiAdapter.gs
   ├─ 08_TaskRepository.gs
   ├─ 09_TaskReviewPolicy.gs
   ├─ 10_CalendarSync.gs
   ├─ 11_EditHandler.gs
   ├─ 12_Triggers.gs
   ├─ 13_LogAndDeadLetter.gs
   ├─ 14_Migrations.gs
   ├─ 15_Dashboard.gs
   ├─ 16_Diagnostics.gs
   ├─ 17_Utilities.gs
   ├─ 18_Worker.gs
   ├─ 99_TestHarness.gs
   ├─ Menu.gs
   ├─ appsscript.json
   ├─ README.md
   └─ .clasp.json.example
```

`.clasp.json.example`にはplaceholderだけを置き、実際のScript IDをコミットしない。初期版はApps Script V8 JavaScriptとJSDocを使用し、TypeScriptのbuild stepは導入しない。

## 8. モジュール責務

| ファイル | 責務 | 禁止事項 |
| --- | --- | --- |
| 00_Config.gs | 定数、設定キー、Enum、初期値 | 外部サービス呼出し、Sheet書込み |
| 01_TypesAndSchemas.gs | JSDoc型、AI Schema、検証、表示値マッピング | 業務処理 |
| 02_Setup.gs | setupSystem、continueSetup、v1検出、段階制御 | Runtime実行、既存データ削除 |
| 03_SheetBuilder.gs | Sheet/列/入力規則/書式/非表示設定 | メール処理からの呼出し |
| 04_MessageStateRepository.gs | Message State、claim、checkpoint、retry | Gmail検索、Task更新 |
| 05_GmailGateway.gs | 検索、Message/Thread取得、AIラベル同期 | Task/Calendar直接書込み |
| 06_EmailPreprocessor.gs | 本文正規化、長さ制限、スレッド文脈生成 | AI通信、Sheet直接書込み |
| 07_AiAdapter.gs | MockとProvider-neutral interface、応答検証 | Sheets直接操作、秘密情報ログ |
| 08_TaskRepository.gs | Task index、論理空行、冪等upsert、row version | Gmail検索、Calendar直接操作 |
| 09_TaskReviewPolicy.gs | 自動確定、要確認、受入、却下、競合判定 | 外部サービス接続 |
| 10_CalendarSync.gs | 専用Calendarのcreate/update/delete、Outbox処理 | Task正本の独自変更、メインCalendar変更 |
| 11_EditHandler.gs | 利用者編集、manual_fields、判断適用、Outbox投入 | Gmail/AI呼出し、重い全行処理 |
| 12_Triggers.gs | installable edit、5分worker、開始・停止 | 他利用者triggerの削除 |
| 13_LogAndDeadLetter.gs | 構造化ログ、redaction、retry、Dead Letter | 本文・token・API keyの保存 |
| 14_Migrations.gs | 将来のv2 schema migrationの枠のみ | v1→v2変換、初期Phaseでの実装 |
| 15_Dashboard.gs | 明示実行の集計、軽量表示 | Worker末尾からの自動更新 |
| 16_Diagnostics.gs | Quick/Deep Diagnostic | 修復、全同期、Gmail全検索 |
| 17_Utilities.gs | 日付、hash、ID、redaction、時間予算 | 業務固有の副作用 |
| 18_Worker.gs | 処理順、Lock、budget、checkpoint | レイアウト修復 |
| 99_TestHarness.gs | Unit/Integration test、synthetic fixture | 実メール、実ID、秘密情報 |
| Menu.gs | 日本語カスタムメニュー、公開entry point | 業務ロジックの重複 |
| appsscript.json | V8、timezone、必要最小OAuth scope | 不要な高度権限 |

## 9. コーディング規約

- 物理列番号を業務ロジックへ直書きしない。行1の内部列IDからMapを作る。
- 1実行内で設定、Task index、Message Stateを原則1回だけ読み込む。
- Sheet入出力は配列化し、`getValues()`と`setValues()`をまとめる。
- `SpreadsheetApp.flush()`はSchema作成後等の必要な境界だけで使う。
- 外部サービスはGateway/Adapter経由とし、Repositoryから直接呼ばない。
- 日付計算は`Asia/Tokyo`を明示し、JSONでは`YYYY-MM-DD`またはISO 8601を使う。
- `Date`の暗黙timezone変換を避ける。終日期限は年月日を明示的に生成する。
- 例外は`AppError(code, stage, retryable, safeMessage, cause)`へ正規化する。
- `safeMessage`に本文、token、完全URL query、HTTP bodyを含めない。
- 公開entry point以外は機能別Objectまたは一意な関数名を使い、global名衝突を避ける。
- Runtime中にSchema、入力規則、書式、列順、Protectionを修復しない。
- ScriptによるSheet更新はedit triggerを再発火させない前提でも、処理の冪等性を維持する。
- テストfixtureは架空の氏名、会社、メール、IDだけを使う。

## 10. Google Sheets物理構造

### 10.1 共通ルール

- 行1: 英語内部列ID。非表示・保護
- 行2: 日本語見出し。固定
- 行3以降: データ
- `タスク一覧`初期100行
- `設定`初期50行
- 履歴・管理タブ初期100行
- 行不足時は100行単位で追加
- 空行へBoolean値を事前投入しない
- CheckboxはData Validationだけを設定し、値は実データ行作成時に入れる
- Taskの論理行は`task_id`または`origin_key`がある行だけ
- Task追記位置に`getLastRow()`を使わない
- 主キー列の最初の論理空行を使う
- 管理列と管理タブは原則非表示・保護
- 大量の列単位Protectionを作成しない

### 10.2 利用者向けタブ

```text
ダッシュボード
タスク一覧
設定
処理履歴
エラー・再実行
使い方
```

### 10.3 非表示管理タブ

```text
メール状態
システム設定
プロンプト版管理
同期状態
```

### 10.4 タスク一覧の全列

| 内部ID | 日本語表示 | 型 | 編集主体 | 初期値 | 検証・意味 | 表示 |
| --- | --- | --- | --- | --- | --- | --- |
| needs_review | 要確認 | Boolean | 自動 | 実データ行のみFALSE/TRUE | FALSEなら通常。TRUEなら判断待ち | 可視 |
| decision | 判断 | Enum | 利用者 | 未選択 | 未選択 / 受入 / 却下 | 可視 |
| status | 対応状況 | Enum | 利用者 | 未対応または要確認 | 要確認 / 未対応 / 対応中 / 返信待ち / 完了 / 対象外 / 取消 | 可視 |
| completed | 完了 | Boolean | 利用者 | FALSE | TRUEでstatus=完了へ正規化 | 可視 |
| excluded | 対象外 | Boolean | 利用者 | FALSE | TRUEでstatus=対象外へ正規化 | 可視 |
| task_title | タスク内容 | String(1..300) | 利用者 | 必須 | 空欄禁止 | 可視 |
| due_date | 期限 | Date | 利用者 | 空欄可 | 正式期限のみ。AI推測を入れない | 可視 |
| suggested_due_date | 推奨期限 | Date | 自動 | 空欄可 | AI推測期限。Calendar対象外 | 可視 |
| deadline_basis | 期限根拠 | Enum | 原則自動 | なし | 明示 / 相対 / 推測 / 曖昧 / なし | 可視 |
| priority | 優先度 | Enum | 利用者 | 中 | 高 / 中 / 低 | 可視 |
| waiting_for_reply | 返信待ち | Boolean | 利用者 | FALSE | TRUEでstatus=返信待ちへ正規化 | 可視 |
| calendar_sync_mode | Calendar登録 | Enum | 利用者 | 自動 | 自動 / 登録 / 対象外 | 可視 |
| comment | コメント | String(0..2000) | 利用者 | 空欄 | 自由記述。Checkbox禁止 | 可視 |
| sender | 送信者 | String | 自動 | 空欄可 | メール由来。利用者編集不可 | 可視 |
| subject | 件名 | String | 自動 | 空欄可 | メール由来。利用者編集不可 | 可視 |
| received_at | 受信日時 | DateTime | 自動 | 空欄可 | Asia/Tokyo表示 | 可視 |
| source_email | 元メール | URL | 自動 | 空欄可 | Gmailへのリンク。利用者編集不可 | 可視 |
| review_state | 確認状態 | Enum | 自動 | なし | なし / 未確認 / 適用済 / 却下済 | 可視 |
| review_type | 確認種別 | Enum/String | 自動 | 空欄 | 新規 / 期限変更 / 完了 / 取消 / 返信待ち / 競合 / 判定不能等 | 可視 |
| task_id | task_id | String | 自動 | 必須 | `tsk_` + UUID。作成後不変 | 非表示・保護 |
| origin_key | origin_key | String | 自動 | 必須 | Message IDとAction indexから決定。重複禁止 | 非表示・保護 |
| source_message_id | source_message_id | String | 自動 | 空欄可 | 元Gmail Message ID | 非表示・保護 |
| source_thread_id | source_thread_id | String | 自動 | 空欄可 | 元Gmail Thread ID | 非表示・保護 |
| stable_thread_key | stable_thread_key | String | 自動 | 空欄可 | スレッド先頭Message IDを基礎とする | 非表示・保護 |
| source_action_index | source_action_index | Integer | 自動 | 0以上 | AI actions[]内の0始まりindex | 非表示・保護 |
| ai_action_type | ai_action_type | Enum | 自動 | 空欄可 | AI Actionコード | 非表示・保護 |
| ai_reason | ai_reason | String(0..1000) | 自動 | 空欄可 | 本文引用の長期保存は禁止 | 非表示・保護 |
| ai_confidence | ai_confidence | Number | 自動 | 空欄可 | 0.0..1.0 | 非表示・保護 |
| ai_provider | ai_provider | String | 自動 | MOCK | Provider識別子 | 非表示・保護 |
| ai_model | ai_model | String | 自動 | 空欄可 | モデルID。秘密情報は禁止 | 非表示・保護 |
| ai_prompt_version | ai_prompt_version | String | 自動 | 必須 | Prompt版 | 非表示・保護 |
| calendar_category | calendar_category | Enum | 自動 | NONE | 重要期限カテゴリ | 非表示・保護 |
| calendar_importance | calendar_importance | Enum | 自動 | LOW | LOW / MEDIUM / HIGH | 非表示・保護 |
| calendar_event_id | calendar_event_id | String | 自動 | 空欄可 | 専用Calendar Event ID | 非表示・保護 |
| calendar_sync_status | calendar_sync_status | Enum | 自動 | NOT_REQUIRED | NOT_REQUIRED / PENDING / SYNCED / DELETE_PENDING / ERROR | 非表示・保護 |
| schedule_state | schedule_state | Enum | 自動 | NONE | NONE / FUTURE / UPCOMING / TODAY / OVERDUE | 非表示・保護 |
| manual_fields | manual_fields | JSON Array | 自動 | [] | 利用者が編集した内部列IDの集合 | 非表示・保護 |
| row_version | row_version | Integer | 自動 | 1 | 書込みごとに加算 | 非表示・保護 |
| pending_action_type | pending_action_type | Enum | 自動 | 空欄 | 既存Taskへの未適用Action | 非表示・保護 |
| pending_changes_json | pending_changes_json | JSON Object | 自動 | {} | 受入前の変更候補。メール本文は保存しない | 非表示・保護 |
| created_at | created_at | DateTime | 自動 | 必須 | 作成時刻 | 非表示・保護 |
| updated_at | updated_at | DateTime | 自動 | 必須 | 最終更新時刻 | 非表示・保護 |
| last_calendar_sync_at | last_calendar_sync_at | DateTime | 自動 | 空欄可 | 最終Calendar同期時刻 | 非表示・保護 |

### 10.5 補助タブSchema

| タブ | 内部列ID | 要件 |
| --- | --- | --- |
| 設定 | setting_key, display_name, value, value_type, allowed_values, description, editable, updated_at | 安全な運用設定のみ。APIキー、token、実メール本文を置かない |
| 処理履歴 | run_id, trigger_type, mode, started_at, finished_at, duration_ms, candidate_count, processed_count, created_task_count, updated_task_count, review_count, skipped_count, error_count, run_status, note | 1実行1行。noteは機密情報を除去 |
| エラー・再実行 | error_id, status, retry_requested, stage, error_code, error_summary, source_message_id, source_thread_id, task_id, retry_count, next_retry_at, first_failed_at, last_failed_at, resolved_at, last_run_id | 利用者が再試行を指示できる。本文・認証情報を保存しない |
| メール状態 | message_id, thread_id, stable_thread_key, received_at, discovered_at, source_mode, processing_status, resume_stage, claimed_at, claim_run_id, preprocess_hash, classification_json, classification_hash, action_count, retry_count, next_retry_at, completed_at, last_error_code, last_error_at, schema_version, updated_at | Message IDが主キー。分類JSONは副作用前に保存 |
| システム設定 | config_key, config_value, value_type, updated_at, note | instance、version、setup stage等。秘密情報は原則Propertiesへも保存しない |
| プロンプト版管理 | prompt_version, provider, schema_version, prompt_hash, active, effective_from, retired_at, note | Prompt本文はコード管理。Sheetには版・hash・状態だけ |
| 同期状態 | sync_id, task_id, target_type, desired_action, event_id, status, retry_count, next_retry_at, last_attempt_at, last_success_at, error_code, updated_at | Calendar Outbox。Taskと外部副作用を分離 |

### 10.6 表示値と内部Enum

Google SheetsのDropdownは表示値と保存値を分離できないため、利用者向けセルは日本語を保存する。コード、AI JSON、管理状態では英語Enumを使用し、`01_TypesAndSchemas.gs`の双方向Mapだけを経由する。

| Enum | 内部コード | Sheet表示 |
| --- | --- | --- |
| TaskStatus | REVIEW | 要確認 |
| TaskStatus | OPEN | 未対応 |
| TaskStatus | IN_PROGRESS | 対応中 |
| TaskStatus | WAITING | 返信待ち |
| TaskStatus | DONE | 完了 |
| TaskStatus | EXCLUDED | 対象外 |
| TaskStatus | CANCELLED | 取消 |
| Decision | NONE | 未選択 |
| Decision | ACCEPT | 受入 |
| Decision | REJECT | 却下 |
| Priority | HIGH | 高 |
| Priority | MEDIUM | 中 |
| Priority | LOW | 低 |
| DeadlineBasis | EXPLICIT | 明示 |
| DeadlineBasis | RELATIVE | 相対 |
| DeadlineBasis | INFERRED | 推測 |
| DeadlineBasis | AMBIGUOUS | 曖昧 |
| DeadlineBasis | NONE | なし |
| CalendarSyncMode | AUTO | 自動 |
| CalendarSyncMode | FORCE | 登録 |
| CalendarSyncMode | NONE | 対象外 |
| ReviewState | NONE | なし |
| ReviewState | OPEN | 未確認 |
| ReviewState | APPLIED | 適用済 |
| ReviewState | REJECTED | 却下済 |

未知の表示値、空白を含む不正値、Map不能値は自動補完せず`E_INVALID_ENUM`として要確認またはエラーへ送る。

## 11. Task不変条件

1. `task_id`は一意で作成後不変。
2. `origin_key`は一意で作成後不変。
3. `source_message_id + source_action_index`から同じ`origin_key`を再生成できる。
4. 同一`origin_key`の再処理は新規行を作らず既存行を返す。
5. `due_date`は正式期限だけ。AI推測は`suggested_due_date`。
6. `needs_review=TRUE`のTaskはCalendarへ登録しない。
7. `DONE / EXCLUDED / CANCELLED`はCalendar Eventを持たない。
8. 既存Task変更候補は現在値を変更せずpendingへ置く。
9. `manual_fields`対象へのAI変更は自動適用しない。
10. 空の物理行はTaskではない。
11. `row_version`は書込みごとに1増やす。
12. 管理列の利用者直接編集は受け付けず、Diagnosticで検出する。
13. `completed / excluded / waiting_for_reply`と`status`の矛盾はEditHandlerで正規化する。
14. AIやCalendarの失敗で既存Taskを削除しない。
15. `comment`をAIが上書きしない。

## 12. IDと冪等性

### 12.1 ID形式

```text
task_id   = "tsk_"  + UUID without hyphens
run_id    = "run_"  + UUID without hyphens
error_id  = "err_"  + UUID without hyphens
sync_id   = "syn_"  + UUID without hyphens
origin_key = "org_" + first 32 hex chars of SHA-256(
  "v2|" + source_message_id + "|" + source_action_index
)
stable_thread_key =
  "root:" + first_message_id_in_thread
  fallback "thread:" + source_thread_id
```

`source_action_index`は保存済みclassification JSONの配列順を使用する。AI再実行でAction順が変わることを避けるため、分類結果を副作用前に保存し、再試行では保存済みJSONを再利用する。

### 12.2 Task解決順

既存Task変更Actionの対象解決は次の順。

1. `target_task_id`が入力Active Task内にあり、実在する
2. `target_origin_key`が実在する
3. 同一`stable_thread_key`のActive Taskが1件だけ
4. それ以外は自動変更せず要確認

AIが入力に存在しないTask IDを返した場合はfabricated IDとして扱い、自動適用しない。

## 13. Setup仕様

### 13.1 対象判定

許可する初期状態は、1枚の完全に空の既定Sheetを持つ新規Spreadsheet、または途中まで正常に作成されたv2環境だけ。

次の場合は停止する。

- v1既知Sheet名、v1 version marker、Review Queue等を検出
- 不明な非空Sheetを検出
- 既存v2の内部列IDが仕様と衝突
- Bound Spreadsheetでない
- 実行者が編集権限を持たない

停止時は削除、列移動、Migrationを行わない。

### 13.2 段階

```text
S00_VALIDATE_ENV
S10_CREATE_SHEETS
S20_CREATE_SCHEMAS
S30_APPLY_SMALL_VALIDATIONS
S40_SEED_SAFE_SETTINGS
S50_CREATE_GMAIL_LABELS
S60_CREATE_DEADLINE_CALENDAR
S70_STORE_PROPERTIES
S80_CREATE_EDIT_TRIGGER
S90_QUICK_DIAGNOSTIC
S99_COMPLETE
```

各stageは冪等で、完了stageをPropertiesへ保存する。唯一の空の既定Sheetは削除せず`ダッシュボード`へrenameしてよい。非空Sheetはrenameしない。

### 13.3 Trigger

- Setup時にinstallable edit triggerを作成してよい。
- 5分worker triggerはSetupで作成しない。
- `startAutomation()`がQuick Diagnostic合格後に作成する。
- `stopAutomation()`は本instanceが保存したtrigger IDだけを削除する。
- Trigger重複を作らない。

### 13.4 Setup性能

- 1回のsetup soft limitは120秒
- stage境界で安全に終了し、`continueSetup()`で継続
- Sheetごとの所要時間を処理履歴へ記録
- 2,000行の事前生成、大量Protection、全列再formatを禁止
- SetupからGmail処理、AI分類、Calendar全同期を呼ばない

## 14. 設定既定値

| 設定キー | 初期値 | 編集 | 説明 |
| --- | --- | --- | --- |
| timezone | Asia/Tokyo | 不可 | 日付計算基準 |
| automation_enabled | false | 明示操作 | 初期停止 |
| ai_provider | MOCK | Phase 5で変更 | 会社承認前はMock |
| manual_max_messages | 1 | 可 | 手動試験 |
| auto_max_messages | 10 | 可 | 自動1回処理上限 |
| manual_max_threads | 10 | 可 | 手動検索上限 |
| auto_max_search_threads | 100 | 可 | 自動候補検索上限 |
| gmail_search_page_size | 25 | 可 | 検索ページ |
| manual_soft_limit_sec | 120 | 可 | 手動Worker budget |
| auto_soft_limit_sec | 210 | 可 | 自動Worker budget |
| lock_wait_ms | 5000 | 可 | Script Lock待機 |
| stale_claim_min | 30 | 可 | claim再取得 |
| body_char_limit | 20000 | 可 | AI入力本文上限 |
| max_actions_per_message | 10 | 可 | AI Action上限 |
| auto_confidence_threshold | 0.85 | 可 | 自動確定 |
| review_confidence_threshold | 0.60 | 可 | 要確認下限 |
| search_overlap_days | 1 | 可 | watermark遡及 |
| max_retry_count | 3 | 不可 | 5分、15分、60分 |
| message_state_retention_days | 365 | 会社規程優先 | 保持 |
| history_retention_days | 365 | 会社規程優先 | 保持 |
| resolved_error_retention_days | 90 | 会社規程優先 | 保持 |
| deadline_calendar_name | 自動期日管理 | 不可 | 正式名称 |

## 15. Gmail取得仕様

### 15.1 処理単位

- Message IDを主キーとする。
- 既読・未読を判定に使わない。
- 同一Threadの新着返信も別Messageとして処理する。
- Threadの先頭Message IDからStable Thread Keyを作る。
- Gmail Thread IDだけに依存しない。

### 15.2 手動試験

```text
label:手動/取込 -label:手動/除外
```

- 最新候補から未処理Messageを最大1件
- 最大10 Threads
- 通常Inbox検索なし
- Mock Adapter
- 自分から自分へ送った非機密fixtureを許可
- `手動/取込`ラベルは削除しない

### 15.3 自動候補

- `in:inbox`
- setup watermark以後を対象とし、検索はwatermarkから1日戻す
- 最終判定はMessage ID
- spam、trash、promotions、social、明らかなnewsletter、Calendar自動通知を原則除外
- 固定条件だけで業務メールを広く除外しない
- `手動/除外`最優先、次に`手動/取込`
- 候補数を制限し、soft limit到達前に新規claimを停止
- 残件は次回へ繰り越す

### 15.4 Gmailラベル

正式ラベル。

```text
AI/要対応
AI/期限
AI/返信待
AI/要確認
手動/取込
手動/除外
SYS/失敗
```

Thread単位のaggregate状態として同期する。

- Active Taskあり: `AI/要対応`
- Formal dueあり: `AI/期限`
- WAITINGあり: `AI/返信待`
- needs_reviewあり: `AI/要確認`
- 未解決errorあり: `SYS/失敗`
- AIは`AI/*`と`SYS/失敗`だけを追加・除去できる
- `手動/*`を削除しない
- 処理済み、完了、対象外ラベルを作らない

## 16. Email Preprocessor

AIへ渡す。

- Message ID、Thread ID、Stable Thread Key
- 件名
- 送信者または送信者domain
- 受信日時
- 新着Messageのplain body
- 直前1～2Messageの短い文脈
- 同一ThreadのActive Task要約
- `today`
- `timezone`

AIへ渡さない。

- 添付ファイル
- 他ThreadのTask
- Calendar全体
- Logs / Dead Letter
- API key、token、Cookie、Authorization header
- 不要なHTML、tracking pixel、署名の過剰部分

本文は正規化後20,000文字で打ち切る。打切りをwarningsへ記録し、元本文をSheetへ保存しない。

## 17. AI Adapter

### 17.1 interface

```javascript
class AiAdapter {
  healthCheck() {}
  classify(input) {}
}
```

実装。

- `MockAiAdapter`
- 会社承認後の`GeminiApiAdapter`または代替Adapter

Provider固有通信、認証、timeout、HTTP分類はAdapter内へ閉じ込める。TaskやSheetを直接操作しない。

### 17.2 AI input

```json
{
  "schema_version": "2.0",
  "message": {
    "message_id": "runtime value",
    "thread_id": "runtime value",
    "stable_thread_key": "runtime value",
    "subject": "string",
    "sender": "string",
    "received_at": "ISO-8601",
    "plain_body": "truncated string",
    "prior_messages": []
  },
  "active_tasks": [
    {
      "task_id": "tsk_...",
      "task_title": "string",
      "status": "OPEN",
      "due_date": "YYYY-MM-DD or null",
      "manual_fields": []
    }
  ],
  "context": {
    "today": "YYYY-MM-DD",
    "timezone": "Asia/Tokyo"
  },
  "constraints": {
    "max_actions": 10,
    "no_attachment_analysis": true,
    "no_email_send": true
  }
}
```

### 17.3 AI output JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "WorkOsClassificationV2",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema_version",
    "overall_confidence",
    "actions",
    "warnings"
  ],
  "properties": {
    "schema_version": {
      "const": "2.0"
    },
    "overall_confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "actions": {
      "type": "array",
      "maxItems": 10,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "action_type",
          "target_task_id",
          "task_title",
          "deadline",
          "suggested_deadline",
          "deadline_basis",
          "priority",
          "waiting_for_reply",
          "needs_review",
          "calendar_category",
          "calendar_importance",
          "confidence",
          "reason",
          "changes"
        ],
        "properties": {
          "action_type": {
            "enum": [
              "NEW_TASK",
              "ADD_TASK",
              "UPDATE_DUE",
              "CANCEL_TASK",
              "MARK_COMPLETE",
              "SET_WAITING",
              "CLEAR_WAITING",
              "INFORMATION_ONLY",
              "UNCLEAR"
            ]
          },
          "target_task_id": {
            "type": ["string", "null"],
            "maxLength": 80
          },
          "task_title": {
            "type": ["string", "null"],
            "maxLength": 300
          },
          "deadline": {
            "type": ["string", "null"],
            "format": "date"
          },
          "suggested_deadline": {
            "type": ["string", "null"],
            "format": "date"
          },
          "deadline_basis": {
            "enum": [
              "EXPLICIT",
              "RELATIVE",
              "INFERRED",
              "AMBIGUOUS",
              "NONE"
            ]
          },
          "priority": {
            "enum": ["HIGH", "MEDIUM", "LOW"]
          },
          "waiting_for_reply": {
            "type": "boolean"
          },
          "needs_review": {
            "type": "boolean"
          },
          "calendar_category": {
            "enum": [
              "EXTERNAL_SUBMISSION",
              "FINAL_MATERIAL",
              "CONTRACT_APPLICATION",
              "BID",
              "LEGAL_TAX_REGULATORY",
              "OTHER_HIGH_IMPACT",
              "NONE"
            ]
          },
          "calendar_importance": {
            "enum": ["HIGH", "MEDIUM", "LOW"]
          },
          "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
          },
          "reason": {
            "type": "string",
            "maxLength": 1000
          },
          "changes": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "task_title": {"type": ["string", "null"], "maxLength": 300},
              "due_date": {"type": ["string", "null"], "format": "date"},
              "priority": {"type": ["string", "null"]},
              "waiting_for_reply": {"type": ["boolean", "null"]},
              "calendar_category": {"type": ["string", "null"]},
              "calendar_importance": {"type": ["string", "null"]}
            }
          }
        }
      }
    },
    "warnings": {
      "type": "array",
      "maxItems": 10,
      "items": {
        "type": "string",
        "maxLength": 500
      }
    }
  }
}
```

### 17.4 Semantic validation

| Action | 必須条件 | 処理 |
| --- | --- | --- |
| NEW_TASK / ADD_TASK | task_title必須 | 新規Task候補 |
| UPDATE_DUE | 対象Taskを一意に解決。deadline変更内容あり | 既存Taskのpendingへ |
| CANCEL_TASK | 対象Taskを一意に解決 | 常に要確認 |
| MARK_COMPLETE | 対象Taskを一意に解決 | 常に要確認 |
| SET_WAITING / CLEAR_WAITING | 対象Taskを一意に解決 | manual field競合なら要確認 |
| INFORMATION_ONLY | Task変更なし | 原則登録なし |
| UNCLEAR | 理由必須 | 明示期限等があれば要確認Task、なければ履歴のみ |

Schema warning、未知field、日付不正、Action過多、fabricated Task ID、空Task名は自動確定しない。

### 17.5 Confidence policy

- confidence >= 0.85、ActionがNEW_TASK/ADD_TASK、安全条件充足: 自動OPEN可
- 0.60 <= confidence < 0.85: REVIEW
- confidence < 0.60: 原則Task作成なし
- confidence < 0.60でも明示期限、法務・税務等の高影響、手動/取込はREVIEWとして残す
- `MARK_COMPLETE`、`CANCEL_TASK`、期限削除、過去日への変更、manual field競合はconfidenceに関係なくREVIEW

## 18. MockAiAdapter

件名prefixで決定的fixtureを返す。

```text
[MOCK:NEW_EXPLICIT]
[MOCK:NEW_REVIEW]
[MOCK:MULTI_ACTION]
[MOCK:UPDATE_DUE]
[MOCK:MARK_COMPLETE]
[MOCK:INFORMATION_ONLY]
[MOCK:SCHEMA_ERROR]
[MOCK:TRANSIENT_ERROR]
```

Mockは外部通信しない。同じinputに同じJSONを返す。`TRANSIENT_ERROR`は最初の所定回数だけretryable errorを返せるよう、TestHarnessから注入したcounterを使う。実メール本文に依存する曖昧な自然言語解析はMockの責務にしない。

## 19. Message State

### 19.1 状態

```text
DISCOVERED
CLAIMED
PREPROCESSED
CLASSIFIED
TASKS_WRITTEN
CALENDAR_PENDING
DONE
RETRY
DEAD
SKIPPED
```

### 19.2 遷移

```text
DISCOVERED
  → CLAIMED
  → PREPROCESSED
  → CLASSIFIED
  → TASKS_WRITTEN
  → CALENDAR_PENDING
  → DONE

任意stageのretryable error
  → RETRY
  → resume_stageから再開

3回失敗
  → DEAD
```

Calendar不要なら`TASKS_WRITTEN → DONE`。Calendarだけ失敗した場合は保存済みTaskとclassificationを再利用し、AIを再実行しない。

### 19.3 Claim

- Script Lock取得後にclaim
- Lock待機5秒
- `claimed_at`から30分を超えたclaimはstaleとして再取得可能
- claimには`run_id`を保存
- soft limit到達後は新規claimしない
- 現在Messageの安全なcheckpointまで処理して終了

## 20. Task Review Policy

### 20.1 新規候補

```text
自動確定:
status=OPEN
needs_review=FALSE
decision=未選択
review_state=なし

要確認:
status=REVIEW
needs_review=TRUE
decision=未選択
review_state=未確認
review_type=新規
```

受入。

```text
status=OPEN
needs_review=FALSE
decision=受入
review_state=適用済
```

却下。

```text
status=EXCLUDED
excluded=TRUE
needs_review=FALSE
decision=却下
review_state=却下済
Calendar削除をOutboxへ
```

### 20.2 既存Task変更候補

現在のTask値とstatusを維持する。

```text
needs_review=TRUE
decision=未選択
review_state=未確認
pending_action_type=<Action>
pending_changes_json=<candidate changes>
```

受入時だけpendingを適用し、pendingを空にする。却下時は現在値を維持してpendingを空にする。

Decision適用は冪等。`review_state`が既にAPPLIED/REJECTEDなら同じDecision再実行で副作用を重複させない。Decisionを後から変更しても自動的な逆操作を行わない。

### 20.3 Manual field競合

利用者が編集した次の列を`manual_fields`へ追加する。

```text
status
completed
excluded
task_title
due_date
priority
waiting_for_reply
calendar_sync_mode
comment
```

AIが`manual_fields`を変更しようとした場合、既存値を維持してpendingへ送る。`comment`はAI変更対象外。

## 21. EditHandler

- installable edit triggerを使用
- 対象は`タスク一覧`行3以降
- 行1内部ID Mapで編集列を解決
- 管理列直接編集は元に戻さず、エラー記録とDiagnostic警告。自動上書きは次の正規更新時
- 1回の複数セルeditは該当行を重複排除して処理
- Sheet-onlyの正規化とDecision適用はedit処理内で可能
- Gmail、AI、Calendarをedit処理から直接呼ばない
- Calendar変更は`同期状態`へOutbox投入
- `row_version`と`updated_at`を更新
- Script書込みによるtrigger非発火に依存しすぎず、処理は冪等にする

### 21.1 状態正規化優先順位

1. `excluded=TRUE` → status=EXCLUDED、completed=FALSE、waiting=FALSE
2. `completed=TRUE` → status=DONE、excluded=FALSE、waiting=FALSE
3. status=CANCELLED → completed=FALSE、excluded=FALSE、waiting=FALSE
4. `waiting_for_reply=TRUE` → status=WAITING
5. WAITING状態でwaitingをFALSE → status=OPEN
6. その他は利用者の有効なstatusを維持

REVIEW中にcompleted/excludedが編集された場合は、人の明示操作として許可し、未適用pendingをクリアして履歴へ記録する。

## 22. TaskRepository

### 22.1 読取

- 行1からColumn Mapを1回作成
- `task_id`または`origin_key`が空の行を無視
- `task_id`, `origin_key`, `stable_thread_key`別indexをメモリで作成
- JSON fieldはparse errorを検出し、空で補完せずerrorへ
- 物理列位置に依存しない

### 22.2 追記

1. `task_id`列の行3以降を一括読取
2. 最初の空セル行を論理空行とする
3. なければ100行追加
4. 1行分を配列で一括書込み
5. 実データBooleanだけを設定
6. indexをメモリ上で更新
7. `getLastRow()`は使わない

### 22.3 upsert

- `origin_key`既存: 新規行を作らず、同じclassificationの再適用はno-op
- `target_task_id`既存: Policyに従ってpendingまたは安全更新
- 新規: UUID採番し、1行作成
- 同一Messageに複数Action: action indexごとに独立origin key
- 一部Action失敗: classificationとAction結果を保存し、未完了Actionだけ再開
- Task書込み後にMessage State checkpointを保存

## 23. 期限解釈

基準timezoneは`Asia/Tokyo`。

| 表現 | 初期処理 |
| --- | --- |
| YYYY/MM/DD, YYYY-MM-DD, YYYY年M月D日 | 明示期限 |
| 今週中 | 当該週金曜日。RELATIVE |
| 来週中 | 翌週金曜日。RELATIVE |
| 月末 | 当該暦月末。RELATIVE |
| 来週金曜日 | 翌週金曜日。RELATIVE |
| なるべく早く、早急に、近日中 | AMBIGUOUS。要確認 |
| 営業日指定 | 初期版で自動確定しない。要確認 |
| AI推測 | suggested_due_dateだけ |

過去日、期限削除、複数候補、timezone不明、営業日計算は要確認。

## 24. Calendar同期

### 24.1 専用Calendar

正式名称は`自動期日管理`。初期v2が書込み可能なCalendarはこれだけ。メインCalendarへ書かない。

### 24.2 登録可能条件

- `needs_review=FALSE`
- `due_date`あり
- `deadline_basis`がEXPLICITまたは採用済みRELATIVE
- statusがDONE/EXCLUDED/CANCELLEDでない
- `calendar_sync_mode`がNONEでない
- AUTOの場合、重要カテゴリかつimportance一定以上
- FORCEの場合も正式期限必須
- AI推測期限だけでは登録しない

AUTO対象。

```text
EXTERNAL_SUBMISSION
FINAL_MATERIAL
CONTRACT_APPLICATION
BID
LEGAL_TAX_REGULATORY
OTHER_HIGH_IMPACT
```

### 24.3 Event

- 終日Event
- タイトル: `【期限】<task_title>`
- 説明: sender、subject、deadline basis、source email、Task ID marker
- marker: `[WORKOS_TASK_ID:<task_id>]`
- guestなし
- invite送信なし
- Event IDをTaskとOutboxに保存

### 24.4 desired action

```text
CREATE
UPDATE
DELETE
NOOP
```

- Eventなし・eligible → CREATE
- Eventあり・eligible・内容差分 → UPDATE
- Eventあり・ineligible/terminal → DELETE
- 差分なし → NOOP

Event IDが見つからない場合、期限日付近の専用Calendarだけを限定検索し、Task marker一致を確認する。全Calendar・全期間を走査しない。見つからなければ新規作成し、重複候補をerrorへ記録する。

### 24.5 CalendarとMessage再試行

Calendar失敗は`同期状態`へ残し、Task書込みとAI分類をやり直さない。最大3回後はDead Letter。Task正本は保持する。

## 25. Worker

### 25.1 公開関数

```text
runManualImport()
runMockAcceptance()
runScheduledWorker()
processPendingReviews()
syncPendingCalendarJobs()
retrySelectedErrors()
```

### 25.2 処理順

```text
1. Config読込
2. Script Lock
3. run_id作成
4. Message State / Task index読込
5. 候補検索
6. Message claim
7. preprocess
8. 保存済みclassification確認
9. 必要ならAI classify
10. classification保存
11. Policy判定
12. Task upsert
13. Gmail AI label同期
14. Calendar Outbox投入
15. Calendar処理
16. Message checkpoint / DONE
17. Run summary保存
18. Lock release
```

Dashboard更新、layout修復、Deep DiagnosticをWorker末尾で実行しない。

### 25.3 Soft budget

- 手動120秒
- 自動210秒
- 経過時間を各大stage前に確認
- budget残が安全余裕未満なら新規claim停止
- 現在Messageのcheckpointを保存して終了
- Googleの最大実行時間を使い切らない

## 26. Retry、Dead Letter、ログ

### 26.1 Retry

```text
retry 1: 5分後
retry 2: 15分後
retry 3: 60分後
retry 3失敗後: DEAD
```

Retryable例。

- AI timeout
- HTTP 429
- HTTP 5xx
- 一時的Gmail/Sheets/Calendar service error
- Lock競合

Non-retryable例。

- Schema不正
- v1環境
- 必須列欠落
- 不正Enum
- 認証未設定
- 会社規程上禁止
- 対象Task解決不能による自動変更

Non-retryableな業務曖昧性は要確認、構成不備はerrorとする。

### 26.2 Error code例

```text
E_SETUP_NOT_EMPTY
E_V1_DETECTED
E_SCHEMA_MISSING_COLUMN
E_INVALID_ENUM
E_INVALID_JSON
E_LOCK_TIMEOUT
E_GMAIL_FETCH
E_AI_TIMEOUT
E_AI_RATE_LIMIT
E_AI_SCHEMA
E_TASK_CONFLICT
E_TARGET_NOT_RESOLVED
E_CALENDAR_NOT_FOUND
E_CALENDAR_SYNC
E_AUTH_REQUIRED
E_BUDGET_EXHAUSTED
```

### 26.3 Redaction

ログへ残せる。

- error code
- stage
- run_id
- Message/Thread/Task ID
- HTTP status
- Provider名
- model名
- prompt version
- 処理件数
- sanitized summary

残さない。

- メール本文
- 添付
- API key/token/password
- Authorization header
- Cookie
- AI request全文
- 会社未公表情報の自由記述
- stack trace内のrequest payload

## 27. Diagnostic

### 27.1 Quick Diagnostic

60秒以内を目標。

- 必須Sheet
- 行1内部列ID
- 見出しと型
- 文字列列にCheckboxがないこと
- 空行にFALSEがないこと
- 正式Gmailラベル
- 専用Calendar ID
- installable edit trigger
- automation trigger状態
- Properties
- AI Adapter health
- version整合
- 重複task_id / origin_key

行わない。

- Dashboard更新
- Task全行再計算・書換え
- layout修復
- Calendar全Event同期
- Gmail全検索

### 27.2 Deep Diagnostic

Phase 7以降、明示実行のみ。

- limited sampleでTask/Message/Outbox整合
- stale claim
- unresolved error
- Event IDとTask markerの限定照合
- retention対象件数
- Schema/validation drift

Deep Diagnosticも自動修復しない。修復は個別commandとする。

## 28. Dashboardとメニュー

### 28.1 Dashboard

Workerから更新しない。`refreshDashboard()`または独立triggerで更新する。

最低表示。

- 要確認件数
- 今日期限
- 7日以内期限
- 期限超過
- 返信待ち
- 未解決error
- 最終自動処理成功時刻
- automation ON/OFF
- AI Provider
- Quick Diagnostic結果

### 28.2 カスタムメニュー

```text
業務OS v2
├─ 初期セットアップ
├─ セットアップを続行
├─ Quick Diagnostic
├─ Mock受入テスト
├─ 手動/取込を1件処理
├─ Calendar同期
├─ 選択エラーを再試行
├─ Dashboard更新
├─ 自動処理を開始
├─ 自動処理を停止
└─ 全テスト実行
```

危険な操作は確認dialogを表示する。開始・停止は現在状態と対象triggerを表示する。

## 29. ManifestとOAuth

`appsscript.json`はV8と`Asia/Tokyo`を明示する。OAuth scopeはPhaseごとの必要最小限とし、初期からDrive、Docs、Mail send等を追加しない。

想定scope群。

- Spreadsheet current file
- Gmail read/modify labels
- Calendar write for専用Calendar
- Script trigger
- External requestは実AIPhaseだけ

Scopeの最終値は実装時にGoogle公式資料と会社管理者制約を再確認する。

## 30. Apps Script quota設計

Google公式のApps Script実行上限は変更され得るため、最大値を業務ロジックに埋め込まない。2026-07-23時点の公式資料ではscript runtimeは1実行6分だが、本システムは手動120秒、自動210秒のsoft limitを採用し、安全なcheckpointで終了する。

- quota exceptionをretryable/non-retryableへ分類
- Gmail、Properties、trigger等の日次quotaを監視
- 1実行で全残件を処理しようとしない
- triggerの重複作成を防ぐ
- provider timeoutをApps Scriptの残時間より短く設定
- quota値をREADMEへ固定コピーせず公式URLを参照する

## 31. スケジュール管理拡張契約

旧「Googleスケジュール管理システム」議論を将来接続するため、初期v2は次を守る。

### 31.1 メインCalendar

- 会議、面談、出張、投資委員会、実際の作業時間はメインCalendarで人が管理
- 初期v2はread/writeしない
- `自動期日管理`と混在させない

### 31.2 Phase 9候補interface

```javascript
class ScheduleContextGateway {
  listEvents(windowStart, windowEnd) {}
}

class BriefService {
  buildDailyBrief(date, tasks, events) {}
  buildWeeklyReview(weekStart, tasks, events) {}
}

class WorkBlockPlanner {
  propose(task, freeBusy) {}
  createApprovedBlock(proposal) {}
}

class MeetingAutomation {
  buildPrepCandidate(event, contextRefs) {}
  buildPostMeetingCandidates(event, artifacts) {}
}
```

### 31.3 後続拡張の安全条件

- read-only daily/weekly briefから開始
- 作業ブロックは利用者の明示承認後だけ作成
- 期限Eventと作業Eventを別category・別同期IDで管理
- Meeting後のTaskは通常のReview Policyを通す
- 返信文はdraft候補まで。自動送信しない
- Project Context、Decision Log、Meeting Noteは候補を作るだけで正本を無承認上書きしない
- NotebookLMはリンクと人手検索。Apps Scriptからチャット自動実行しない
- Projects/Meetings新タブ追加は別DecisionとSchema migrationで行う

## 32. Test specification

### 32.1 Unit

- Column Map
- 日本語表示値と英語Enumの双方向変換
- UUID/Hash/Origin Key
- 論理空行検索
- Task indexと重複検出
- JSON parse/validation
- Action semantic validation
- confidence policy
- manual_fields conflict
- Review accept/reject
- status正規化
- date parseとrelative deadline
- Calendar eligibility
- desired action
- Message state transition
- retry schedule
- stale claim
- redaction
- soft budget

### 32.2 Integration fixture

| ID | 入力 | 期待結果 |
| --- | --- | --- |
| IT-01 | [MOCK:NEW_EXPLICIT]、明示期限 | OPEN Task 1件、必要ならCalendar CREATE |
| IT-02 | [MOCK:NEW_REVIEW] | REVIEW Task 1件、Calendarなし |
| IT-03 | [MOCK:MULTI_ACTION] | 1 Messageから複数Task、origin_key別 |
| IT-04 | IT-01を再実行 | Task/Event重複なし |
| IT-05 | [MOCK:UPDATE_DUE] | 既存Task維持、pending、受入後だけdue更新 |
| IT-06 | [MOCK:MARK_COMPLETE] | 自動完了せずpending |
| IT-07 | 利用者がdue_dateを編集後AI変更 | manual_fields競合でpending |
| IT-08 | 手動/除外あり | Task自動作成なし |
| IT-09 | Calendar CREATE→UPDATE→DELETE | 同一Event IDを更新し、terminalで削除 |
| IT-10 | [MOCK:TRANSIENT_ERROR] | 5/15/60 retry、保存済みstageから再開 |
| IT-11 | 空行Checkbox Validation | 空行値は空。Taskは3行目付近 |
| IT-12 | setup再実行 | Task消失・Schema重複なし |
| IT-13 | v1既知Sheet | 停止し、変更なし |
| IT-14 | Quick Diagnostic | 60秒以内、書換えなし |

### 32.3 情報管理テスト

- repository検索でtoken、実ID、実メール本文がない
- Logsに本文、Authorization、API keyがない
- test fixtureが完全に架空
- Calendar descriptionが許容範囲
- AI providerへ送るfieldが仕様以内
- automation初期値OFF

## 33. 初期v2 Definition of Done

- 新しい空のSheetからsetup完了
- Taskが3行目付近へ入る
- 空行にFALSEなし
- コメント列にCheckboxなし
- 同じMessageを繰り返してもTask重複なし
- 同じTaskのEvent重複なし
- Review Queueなしで受入・却下完了
- AI完了・取消・重要変更が無承認確定されない
- Calendarは重要な正式期限だけ
- Mock縦フロー合格
- Quick Diagnostic 60秒以内
- manual worker 120秒、auto worker 210秒以内に安全終了
- retryがstageから再開
- setup再実行でデータ破損なし
- Logsに機密情報なし
- 別の新規Workspace環境で手引書だけから再現可能
- 実AI・自動処理は会社承認後に明示開始

## 34. 未解決事項

次は本書で確定しない。

- 会社環境で正式利用できるAI Provider
- Gemini API、Vertex AI、Proxy等の認証方式
- API課金主体、model ID、利用上限
- Providerの保持、学習利用、監査条件
- Script Propertiesへのsecret保存可否
- OAuth scope、UrlFetch、外部通信の管理者制限
- 自動処理の安全な最終batch件数
- 営業日計算と会社休日
- 相対期限を自動確定する範囲
- retention日数の会社規程適合
- v2安定後のv1 Task移行要否
- Phase 9の会議、作業ブロック、日次/週次、Docs連携の採否

外部条件が未確認でもPhase 1～4はMockで進められる。Phase 5以降は未確認事項を捏造せず、Feature Flag OFF、stub、検証レポートのいずれかで止める。

## 35. 公式参照

実装時に最新版を確認する。

- Installable triggers
  https://developers.google.com/apps-script/guides/triggers/installable
- Simple triggers
  https://developers.google.com/apps-script/guides/triggers
- Apps Script quotas
  https://developers.google.com/apps-script/guides/services/quotas
- LockService
  https://developers.google.com/apps-script/reference/lock
- PropertiesService
  https://developers.google.com/apps-script/reference/properties/properties-service
- GmailMessage
  https://developers.google.com/apps-script/reference/gmail/gmail-message
- Calendar Service
  https://developers.google.com/apps-script/reference/calendar/calendar
- Spreadsheet Service
  https://developers.google.com/apps-script/reference/spreadsheet
