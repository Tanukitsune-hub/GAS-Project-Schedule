# Google Workspace 自動期日管理ツール
# Apps Script実装仕様書 v1.0

- 文書種別: 実装仕様書
- ステータス: Implementation Ready Draft
- 作成日: 2026-07-22
- 対象タイムゾーン: `Asia/Tokyo`
- 対象リポジトリ: `Tanukitsune-hub/context-hub`
- 対象プロジェクト: `projects/google-workspace-personal-work-os/`
- 本仕様書の目的: 実装担当者が追加の要件確認なしに、段階的な実装・検証へ着手できる基準を定める
- 本仕様書の範囲: 仕様、データモデル、関数契約、疑似コード、テスト・受入基準
- 本仕様書の範囲外: Apps Script本体の完全実装、本番接続、実データ処理、GitHubへのcommit

---

## 0. 文書の読み方

本仕様書では、設計項目を次の4区分で示す。

| 区分 | 意味 |
|---|---|
| `[確定]` | Context Hubの正本・Decision・正式命名規則から確認できる事項 |
| `[補完]` | 実装可能性、整合性、安全性、保守性を高めるため本仕様書で追加した事項 |
| `[調整]` | 初期値として採用するが、ダミーテストまたは会社環境の検証で変更可能な事項 |
| `[要確認]` | 会社環境、管理者ポリシー、AI接続方式等に依存し、実装前または本番稼働前に確認が必要な事項 |

### 0.1 参照した正本・詳細設計

次の順に確認し、記述が矛盾する場合は、より新しいDecision、`CURRENT_STATUS.md`の訂正、個別詳細設計、`MASTER_PLAN.md`、`PROJECT_CONTEXT.md`の順で解決する。

1. `PROJECT_CONTEXT.md`
2. `MASTER_PLAN.md`
3. `DECISIONS.md`
4. `CURRENT_STATUS.md`
5. `AUTOMATED_DEADLINE_MANAGER_DESIGN.md`
6. `NAMING_AND_GMAIL_LABELS.md`
7. `INITIAL_IMPLEMENTATION_DEFAULTS.md`

### 0.2 採用しない前提

以下は採用しない。

- 独立したManualモード
- 旧`OS/`ラベル体系
- 基礎版v1またはv1.1が実装済みであるという前提
- 「1スレッド = 1タスク」の固定
- Gmailの既読・未読を処理済み判定に使う設計
- AI推測期限を正式期限として自動確定する設計
- Gmailラベルを処理済み台帳として使う設計

---

## 1. エグゼクティブサマリー

### 1.1 目的

`[確定]` 本ツールは、Gmailへ届いた業務メールをApps Scriptが定期巡回し、会社環境で承認されたAIへ構造化分類を依頼し、その結果をGmailラベル、Google Sheetsのタスク台帳、専用Google Calendarへ連携する。

中心となる利用体験は次のとおり。

```text
Gmailへメールを受信
  ↓
Apps Scriptが原則5分ごとに候補メールを取得
  ↓
Gmail Message IDで未処理を判定
  ↓
AIがメールを構造化分類
  ↓
Gmailへ状態を示すAIラベルを反映
  ↓
安全に自動確定できるタスクをSheetsへ登録
  ↓
曖昧なものを「要確認」へ登録
  ↓
重要期限だけをサブカレンダー「自動期日管理」へ同期
  ↓
利用者は原則としてSheetsで完了・対象外・修正を行う
```

### 1.2 主要コンポーネント

| コンポーネント | 役割 |
|---|---|
| Gmail | メール原文、スレッド、補正ラベル、投影されたAIラベルの表示先 |
| Apps Script | 初期構築、Gmail巡回、AI連携、Sheets更新、Calendar同期、ログ、再試行 |
| 会社承認済みAI | メールの意味分類、期限・タスク・更新候補の構造化抽出 |
| Google Sheets | タスク、期限、状態、完了、対象外、要確認、処理履歴の正本 |
| Google Calendar | 重要期限の表示先。タスク台帳ではない |
| Google Docs | 利用手引書、仕様書、FAQ、保守資料、変更履歴の正本 |
| NotebookLM | 上記資料に基づく利用者向け検索・質問窓口 |
| PropertiesService | 小容量のインスタンス設定、バージョン、各種IDの保存 |
| LockService | Gmail処理、採番、Calendar同期、セットアップ等の排他制御 |
| Logs / Dead Letter | 監査、障害把握、再実行、恒久エラーの管理 |

### 1.3 実現可能性

`[確定]` Google SheetsにコンテナバインドされたApps Scriptを使用し、次を実現できる。

- 空のスプレッドシートから必要タブ・書式・入力規則を生成
- Gmailの検索、メッセージ読取、ユーザーラベル作成・付与
- Google Calendarのサブカレンダー検索・作成、終日予定作成・更新・削除
- インストール型トリガーの作成
- UrlFetchによるAI API呼出し
- Script Properties、User Properties、LockServiceによる状態・排他管理

ただし、会社環境でAI APIまたはVertex AI等を利用できること、必要なOAuthスコープが承認されること、外部AIへメール本文を送信できることは本番稼働の前提条件である。

### 1.4 主なリスクと対策

| リスク | 対策 |
|---|---|
| AI誤判定 | 信頼度閾値、要確認キュー、人間補正、重要更新の自動確定制限 |
| 同一メールの重複処理 | Message ID台帳、`origin_key`、冪等upsert |
| 1スレッド複数タスク | AI出力を`actions[]`とし、1メッセージ複数アクションに対応 |
| GmailラベルとMessage IDの粒度差 | Message IDを正本、Gmailラベルをスレッド単位の投影表示として扱う |
| 部分失敗 | 処理状態を段階保存するSaga方式、再試行、Dead Letter |
| 同時実行 | Script Lock、Task ID採番ロック、ソフト実行時間上限 |
| Apps Scriptクォータ | 1回の処理数制限、ページング、バッチ書込み、繰越し |
| Calendar重複 | Event ID、Task IDタグ、インスタンスIDタグ |
| 人間の修正をAIが上書き | `manual_fields`で手動編集列を保護 |
| 認証情報漏えい | セル・コード・GitHubへ保存禁止。承認済み認証方式を使用 |
| 利用者ごとの差 | 各自が自分のOAuth権限でセットアップし、インスタンス単位で分離 |

---

## 2. 前提・設計原則

### 2.1 確定事項

- `[確定]` Google Sheetsをタスク管理の正本兼操作画面とする。
- `[確定]` Apps Scriptを自動処理の中核とする。
- `[確定]` Gmailをタスク・期限情報の入口とする。
- `[確定]` Calendarは失念時の影響が大きい重要期限だけを可視化する。
- `[確定]` 専用サブカレンダー名は`自動期日管理`とする。
- `[確定]` 独立したManualモードは設けない。
- `[確定]` AI自動分類と人間補正の単一構成とする。
- `[確定]` `手動/取込`と`手動/除外`はAI判定を補正する例外操作である。
- `[確定]` Gmailの処理単位はGmail Message IDとする。
- `[確定]` 原則5分ごとの時間主導トリガーで巡回する。
- `[確定]` 既読・未読や厳密な受信時間窓で処理済みを判定しない。
- `[確定]` 初期版では送信済みメールと添付ファイル内容をAI判定対象に含めない。
- `[確定]` AI推測期限は正式期限およびCalendarへ自動登録しない。
- `[確定]` OAuth権限は各利用者が自分で承認する。
- `[確定]` 個人PCではダミーデータだけを使用する。
- `[確定]` Google Docsを手引書等の正本、NotebookLMを質問窓口とする。

### 2.2 本仕様書で補完した事項

- `[補完]` GmailAppのユーザーラベル操作は実質的にスレッド単位となるため、AIラベルを「メッセージの処理済み印」ではなく「スレッドの現在状態を示す投影」と定義する。
- `[補完]` AI出力を単一タスクではなく`actions[]`形式とし、1メッセージから複数タスク・複数更新を返せるようにする。
- `[補完]` `OVERDUE`をタスクの主ステータスから分離し、`schedule_state`として計算する。
- `[補完]` AI検出による`MARK_COMPLETE`および`CANCEL_TASK`は自動適用せず、必ず要確認へ送る。
- `[補完]` 期限変更は対象タスクが一意で、手動上書きがなく、期限根拠が`explicit`または許容された`relative`で、信頼度が高い場合のみ自動適用する。
- `[補完]` インストール型編集トリガーを使用し、単純`onEdit`ではCalendar等の認可サービスを呼ばない。
- `[補完]` Apps Scriptの実行上限へ近づく前に処理を停止するソフト上限を設ける。
- `[補完]` メッセージ処理を段階保存するSaga方式を採用し、AI分類結果を副作用より先に保存する。
- `[補完]` Calendar側の手動変更は正本とせず、Sheetsの値へ再同期する。
- `[補完]` シートの表示名変更に耐えるため、内部ID行とDeveloper Metadataを使用する。
- `[補完]` `manual_fields`により、人間が編集した項目をAI更新から保護する。
- `[補完]` 返信待ちの完全自動判定は送信済みメールを扱わない初期版では限定的であることを明示する。

### 2.3 調整可能な初期値

| 項目 | 初期値 |
|---|---:|
| Gmail巡回間隔 | 5分 |
| 1回の最大処理メッセージ数 | 20 |
| 1回の最大検索スレッド数 | 500 |
| Gmail検索ページサイズ | 100 |
| AIへ渡す直前メッセージ数 | 2 |
| メール本文最大文字数 | 20,000文字 |
| 自動登録信頼度 | 0.85 |
| 要確認下限信頼度 | 0.60 |
| 自動期限変更信頼度 | 0.90 |
| 最大自動再試行回数 | 3 |
| 再試行間隔 | 5分、15分、60分 |
| Message State保持期間 | 365日 |
| 処理履歴保持期間 | 365日 |
| エラーログ保持期間 | 90日 |
| ソフト実行時間上限 | 270,000ms |
| タイムゾーン | `Asia/Tokyo` |

### 2.4 会社環境で確認が必要な事項

- `[要確認]` Gemini API、Vertex AIまたは別の会社承認済みAIを利用できるか。
- `[要確認]` Apps Scriptから使用可能な認証方式。
- `[要確認]` API課金主体、予算、利用上限。
- `[要確認]` メール本文をAI提供者へ送信できるか。
- `[要確認]` データ保持、監査、ログ、リージョン要件。
- `[要確認]` `https://mail.google.com/`を含むOAuthスコープの承認可否。
- `[要確認]` サブカレンダー作成権限。
- `[要確認]` 外部APIへのUrlFetch許可。
- `[要確認]` 他メンバー配布時のApps Script、Drive外部持込、OAuthアプリ制限。
- `[要確認]` Script PropertiesへAPIキーを保存する運用が会社規程上認められるか。原則は会社管理認証を優先する。

### 2.5 情報管理上の原則

- メール本文をタスク台帳・ログへ全文保存しない。
- AIへ送信する情報は必要最小限に整形する。
- 添付ファイルは初期版では送信しない。
- APIキー、token、passwordをシート、コード、GitHub、Google Docsへ記載しない。
- 個人PCへ会社の実データを持ち出さない。
- Sheets、Calendar、Gmailのデータは利用者アカウント単位で分離する。
- 共有シートへ集約する場合、メール本文、元メールリンク、個人情報を原則集約しない。
- ログには本文、完全なメールアドレス、認証情報を記録しない。
- AI出力は「候補」であり、正式情報との区別を保持する。

---

## 3. 設計再精査による主な修正

| ID | 修正内容 | 理由 | 影響 |
|---|---|---|---|
| R-001 | AIラベルをスレッド状態の投影と定義 | GmailAppのラベル操作とMessage ID処理の粒度が異なるため | AIラベル再計算関数を追加 |
| R-002 | AI出力を`actions[]`へ変更 | 1メールに複数依頼・複数更新が含まれ得るため | タスクupsert、Review設計を拡張 |
| R-003 | `OVERDUE`を`status`から分離 | 期限超過は業務状態ではなく日付由来の表示状態のため | `schedule_state`列を追加 |
| R-004 | AIによる完了・取消を自動適用しない | 誤判定時の影響が大きいため | 必ずReviewへ登録 |
| R-005 | 編集処理をインストール型トリガーに限定 | Calendar等の認可サービスを確実に利用するため | `onTaskSheetEdit(e)`をinstallable triggerへ |
| R-006 | Saga型処理状態を導入 | Gmail、AI、Sheets、Calendarに横断トランザクションがないため | Message Stateを段階保存 |
| R-007 | Calendar同期モードを追加 | 「重要期限」の判断を人間が上書きできるようにするため | `AUTO/FORCE/NONE`を追加 |
| R-008 | `manual_fields`を追加 | AIが人間の修正を上書きしないため | 編集トリガーで管理 |
| R-009 | 手動ラベルをスレッド永続オーバーライドと定義 | GmailAppでラベルがスレッド単位となるため | 将来返信にも補正が継続 |
| R-010 | 返信待ちの制約を明示 | 初期版では送信済みメールを巡回しないため | 自動判定は限定的、Sheets手動設定可 |
| R-011 | 期限変更の自動適用条件を厳格化 | Calendarや人間修正を誤って上書きしないため | 0.90、対象一意、manual fieldなし |
| R-012 | 5分巡回を厳密な5分SLAとしない | 時間主導トリガーは遅延し得るため | 正常時目標15分以内、保証値ではない |
| R-013 | Message StateをPropertiesではなく非表示シートへ保存 | PropertiesServiceは小容量設定向けであるため | 大量IDをPropertiesへ保存しない |
| R-014 | CalendarイベントへTask ID・Instance IDタグを付与 | Event ID消失時の復旧・重複検知を強化するため | Calendar再照合が可能 |
| R-015 | AIラベルをタスク・Reviewから再構成 | 新着メール単独の分類では古い状態が残るため | `reconcileThreadLabels()`を追加 |

---

## 4. システムアーキテクチャ

### 4.1 論理構成

```text
┌─────────────────────────────────────────────────────────────┐
│ Gmail                                                       │
│  - 受信メール                                               │
│  - AI/* ラベル（スレッド状態の投影）                         │
│  - 手動/* ラベル（人間の永続オーバーライド）                 │
│  - SYS/失敗                                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │ GmailApp
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Apps Script                                                 │
│  Discovery → Preprocess → AI Adapter → Validate             │
│      → Persist Classification → Apply Actions               │
│      → Task/Review upsert → Calendar Sync                    │
│      → Reconcile Labels → Finalize Message State            │
│                                                             │
│  LockService / PropertiesService / Triggers / Logs          │
└───────────────┬───────────────────┬─────────────────────────┘
                │                   │
                ▼                   ▼
┌─────────────────────────┐   ┌───────────────────────────────┐
│ Google Sheets           │   │ 会社承認済みAI               │
│ - Tasks                 │   │ - Gemini API / Vertex AI等   │
│ - Review                │   │ - Structured Output          │
│ - Message State         │   └───────────────────────────────┘
│ - History / Dead Letter │
└───────────────┬─────────┘
                │ CalendarApp
                ▼
┌─────────────────────────────────────────────────────────────┐
│ Google Calendar: 自動期日管理                               │
│ - 重要期限の終日予定                                        │
│ - ADM_TASK_ID / ADM_INSTANCE_ID タグ                        │
└─────────────────────────────────────────────────────────────┘

Google Docs → 利用手引書・FAQ・仕様書
NotebookLM → 上記資料に基づく利用者支援
```

### 4.2 処理フロー

```text
[1] 5分トリガー起動
[2] Script Lock取得
[3] 再試行期限到来分を先に処理
[4] Gmail候補スレッドをページ取得
[5] 受信メッセージを列挙
[6] Message IDが台帳に存在するか確認
[7] 手動/除外・手動/取込の優先順位を評価
[8] メールを整形
[9] AI分類またはMock Adapterを実行
[10] JSON Schema・業務ルール検証
[11] 分類JSONをMessage Stateへ先に保存
[12] actions[]を順にタスクまたはReviewへ適用
[13] 重要期限をCalendarへ同期
[14] スレッドのAIラベル・SYS/失敗を再構成
[15] Message StateをDONEへ更新
[16] ソフト上限到達時は残件を次回へ繰越し
```

### 4.3 トランザクション境界

Gmail、Sheets、Calendar、外部AI間には単一トランザクションがない。したがって、処理は次のSagaとして設計する。

```text
DISCOVERED
  → CLAIMED
  → CLASSIFIED
  → APPLYING
  → DONE
       └─失敗→ RETRY_WAIT → CLAIMED
                          └─最大回数超過→ DEAD
```

分類結果を`CLASSIFIED`時点で保存し、その後の再試行では原則としてAIを再呼出ししない。これにより、同じメッセージでaction indexが変わることを防ぐ。

---

## 5. Apps Scriptプロジェクト構成

Apps Scriptでは`.gs`ファイル名による実行順保証を前提としない。数字接頭辞は人間の保守性のために付け、グローバル初期化順へ依存しないコードとする。

| ファイル | 責務 | 主要関数・型 | 依存 | 主な副作用 |
|---|---|---|---|---|
| `00_Config.gs` | 定数、設定キー、列ID、ラベル名 | `CONFIG_DEFAULTS`, `SHEET_KEYS`, `LABELS` | なし | なし |
| `01_TypesAndSchemas.gs` | Enum、DTO、AI JSON Schema、検証規則 | `TaskStatus`, `MessageState`, `AI_SCHEMA` | Config | なし |
| `02_Setup.gs` | 初期設定、診断、権限確認 | `setupSystem`, `diagnoseSystem` | Schema, Triggers, Calendar | 全サービス |
| `03_SheetSchema.gs` | タブ、列、書式、入力規則、metadata | `createOrRepairSheets`, `repairLayout` | Config, Utilities | Sheets |
| `04_MessageStateRepository.gs` | Message ID台帳、claim、分類保存 | `claimMessage`, `saveClassification`, `finalizeMessage` | Sheets, Logs | Sheets |
| `05_GmailGateway.gs` | Gmail検索、メッセージ取得、ラベル投影 | `discoverMessages`, `reconcileThreadLabels` | GmailApp | Gmail |
| `06_EmailPreprocessor.gs` | 署名・引用除去、長文切詰め | `buildAiInput`, `stripQuotedText` | Utilities | なし |
| `07_AiAdapter.gs` | Provider-neutral AI接続、Mock、検証 | `classifyEmailWithAi`, `getAiAdapter` | UrlFetch, Schema | 外部API |
| `08_TaskRepository.gs` | Taskの作成・更新・手動保護 | `upsertTask`, `applyTaskAction` | Sheets, History | Sheets |
| `09_ReviewRepository.gs` | Review候補、承認・却下・適用 | `createReviewItem`, `applyReviewDecision` | Sheets, TaskRepo | Sheets/Calendar |
| `10_CalendarSync.gs` | Calendar作成、イベント同期、照合 | `createOrGetDeadlineCalendar`, `syncDeadlineCalendar` | CalendarApp | Calendar |
| `11_EditHandler.gs` | Sheets編集イベント、人間編集の反映 | `onTaskSheetEdit`, `onReviewSheetEdit` | TaskRepo, Calendar | Sheets/Calendar |
| `12_Triggers.gs` | installable triggerの作成・削除 | `installTriggers`, `removeTriggers` | ScriptApp | Triggers |
| `13_LogAndDeadLetter.gs` | History、Dead Letter、再試行、清掃 | `logEvent`, `enqueueDeadLetter`, `retryDeadLetters` | Sheets, Gmail | Sheets/Gmail |
| `14_Migrations.gs` | バージョン管理、順序付きmigration | `upgradeSystem`, `runMigration` | Setup, Schema | Sheets/Properties |
| `15_DashboardAndDocs.gs` | Dashboard、Docsリンク、Help | `refreshDashboard`, `openDocumentation` | Sheets/UI | Sheets/UI |
| `16_Diagnostics.gs` | 構成・権限・トリガー・Calendar診断 | `diagnoseSystem`, `repairSystemReferences` | 全サービス | 原則読取 |
| `17_Utilities.gs` | 日付、hash、mask、列解決、時間管理 | `nowIso`, `sha256`, `resolveColumns` | Apps Script標準 | なし |
| `Menu.gs` | カスタムメニュー、UI入口 | `onOpen` | Setup等 | UI |
| `appsscript.json` | タイムゾーン、runtime、OAuth scope | manifest | なし | 権限要求 |

---

## 6. 共通データ型・識別子

### 6.1 Enum

```javascript
TaskStatus = OPEN | IN_PROGRESS | WAITING | DONE | EXCLUDED | CANCELLED
ScheduleState = NONE | FUTURE | UPCOMING | TODAY | OVERDUE
ReviewStatus = OPEN | ACCEPTED | REJECTED | APPLIED | ERROR
MessageProcessingState =
  DISCOVERED | CLAIMED | CLASSIFIED | APPLYING |
  DONE | RETRY_WAIT | DEAD | IGNORED_RULE | IGNORED_MANUAL
CalendarSyncMode = AUTO | FORCE | NONE
CalendarSyncStatus = NONE | PENDING | SYNCED | ERROR | DELETED
DeadlineBasis = explicit | relative | inferred | none | ambiguous
Priority = high | medium | low
AiActionType =
  NEW_TASK | ADD_TASK | UPDATE_DUE | CANCEL_TASK | MARK_COMPLETE |
  SET_WAITING | CLEAR_WAITING | INFORMATION_ONLY | UNCLEAR
```

### 6.2 識別子

| 識別子 | 生成・取得方法 | 用途 |
|---|---|---|
| `instance_id` | 初回setup時に`Utilities.getUuid()` | スプレッドシート・Calendar・eventの所属識別 |
| `message_id` | `GmailMessage.getId()` | メッセージ処理の主キー |
| `thread_id` | `GmailThread.getId()` | Gmailスレッド参照 |
| `stable_thread_key` | 最古メッセージのMessage ID | Thread ID変動に備える永続キー |
| `origin_key` | `${message_id}#${action_index}` | AI action単位の冪等キー |
| `task_id` | 初回作成時にUUID | Taskの主キー |
| `review_id` | UUID | Reviewの主キー |
| `calendar_event_id` | CalendarEvent ID | 予定更新・削除 |
| `trace_id` | 処理単位UUID | ログ横断追跡 |
| `migration_id` | 例:`M001_INITIAL_SCHEMA` | migrationの一意識別 |

### 6.3 Stable Thread Key

```text
1. thread.getMessages()で全メッセージを取得
2. getDate()昇順、同日時はgetId()昇順で並べる
3. 最古メッセージのMessage IDをstable_thread_keyとする
```

GmailThreadの配列順を暗黙に前提とせず、明示的に並べる。

### 6.4 `origin_key`

1メッセージから複数actionが返るため、`message_id`だけではTaskの一意性を表せない。AI分類JSONを保存した後、配列順を固定し、`message_id#action_index`を作る。

同じ分類結果の再適用では同じ`origin_key`となるため、TaskまたはHistoryを重複作成しない。

---

## 7. 主要関数仕様

### 7.1 共通関数契約

すべての主要関数は、次を原則とする。

- 例外を握り潰さない。
- 技術例外を`AppError`へ正規化する。
- ログへメール本文・認証情報を記録しない。
- 書込み関数は可能な限り冪等にする。
- 長時間処理では`ExecutionBudget`を確認する。
- ユーザー向けエラーと技術詳細を分離する。
- `trace_id`を下位関数へ引き回す。

### 7.2 `onOpen()`

| 項目 | 仕様 |
|---|---|
| 目的 | スプレッドシートへカスタムメニューを追加 |
| シグネチャ | `function onOpen(e): void` |
| 引数 | Openイベント。未使用可 |
| 戻り値 | なし |
| 前提 | コンテナバインドされたスプレッドシート |
| 処理 | UIメニューのみ作成。Gmail、Calendar、UrlFetchを呼ばない |
| 冪等性 | 同じメニューを再表示するだけ |
| Lock | 不要 |
| 例外 | UIエラーは可能な範囲で無視し、本文処理を行わない |
| ログ | 原則なし |
| テスト | 再読込でメニューが1つ表示される |

メニュー案。

```text
自動期日管理
├─ 初期設定を実行
├─ システム診断
├─ 今すぐメールを処理
├─ Calendarを再同期
├─ エラーを再実行
├─ レイアウトを修復
├─ システムを更新
├─ 自動処理を停止
├─ 自動処理を再開
└─ 使い方を開く
```

### 7.3 `setupSystem()`

| 項目 | 仕様 |
|---|---|
| 目的 | 空のGoogle Sheetsから全構成を生成 |
| シグネチャ | `function setupSystem(): SetupResult` |
| 戻り値 | `{success, steps, warnings, instanceId, systemVersion}` |
| 前提 | 利用者が必要権限を承認できる |
| 主処理 | lock → instance作成 → sheets → labels → calendar → properties → triggers → initial log |
| 冪等性 | 既存データを維持し、不足だけを作成・修復 |
| Lock | Script Lock必須。30秒以内に取得できなければ中断 |
| 例外 | 各stepをSetup Journalへ記録。再実行で継続 |
| ログ | setup開始・各step・完了・失敗 |
| テスト | 空シート、再実行、途中失敗後再実行、既存データあり |

疑似コード。

```javascript
function setupSystem() {
  const lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_WAIT_MS);
  const traceId = newTraceId();

  try {
    ensureBoundSpreadsheet();
    const instanceId = ensureInstanceId();
    runSetupStep("SHEETS", createOrRepairSheets);
    runSetupStep("LABELS", createOrRepairGmailLabels);
    runSetupStep("CALENDAR", createOrGetDeadlineCalendar);
    runSetupStep("PROPERTIES", initializeProperties);
    runSetupStep("TRIGGERS", installTriggers);
    runSetupStep("VERSION", () => setSystemVersion(CURRENT_VERSION));
    runSetupStep("INITIAL_LOG", writeInitialLog);
    return buildSetupResult();
  } finally {
    lock.releaseLock();
  }
}
```

ロールバックはサービス横断では行わない。代わりに、各stepを冪等化し、Setup Journalを見て再実行する。

### 7.4 `repairLayout()`

| 項目 | 仕様 |
|---|---|
| 目的 | データを保持し、タブ・列・書式・入力規則・metadataを修復 |
| シグネチャ | `function repairLayout(): RepairResult` |
| 入力 | なし |
| 戻り値 | 修復項目、警告 |
| 対象 | Sheet構成のみ。Gmail、Calendar、trigger、credentialは変更しない |
| 冪等性 | 必須 |
| Lock | Script Lock |
| 例外 | シートschema不整合をDead Letterではなく診断結果へ |
| ログ | 修復前後の差分 |
| テスト | 列削除、列順変更、入力規則破損、表示名変更 |

既存列を位置ではなく内部IDで解決し、不足列だけ追加する。未知列は削除しない。

### 7.5 `upgradeSystem()`

| 項目 | 仕様 |
|---|---|
| 目的 | コード更新後に順序付きmigrationを適用 |
| シグネチャ | `function upgradeSystem(): UpgradeResult` |
| 戻り値 | 適用migration、スキップ、警告 |
| 前提 | `SYSTEM_VERSION`と`APPLIED_MIGRATIONS`が読める |
| 冪等性 | migration IDを二重適用しない |
| Lock | Script Lock |
| 例外 | 失敗migrationで停止し、後続を適用しない |
| ログ | migration ID、開始、成功、失敗 |
| テスト | 初回、再実行、中間version、migration失敗 |

破壊的migrationを避ける。列削除が必要な場合は、まず非表示化し、少なくとも1version後に削除を検討する。

### 7.6 `createOrRepairSheets()`

| 項目 | 仕様 |
|---|---|
| 目的 | 全タブ・列・metadata・書式の作成 |
| シグネチャ | `function createOrRepairSheets(): SheetBuildResult` |
| 入力 | schema定義 |
| 戻り値 | 作成・修復一覧 |
| 冪等性 | 必須 |
| Lock | setup/repair側で取得済み |
| 例外 | 一部失敗時は対象sheet keyを返す |
| ログ | sheet key単位 |
| テスト | 空、既存、名前変更、列追加、行あり |

各タブへDeveloper Metadata `ADM_SHEET_KEY=<key>`を付ける。行1を内部列ID、行2を日本語表示名、行3以降をデータとする。行1は非表示とする。

### 7.7 `createOrRepairGmailLabels()`

| 項目 | 仕様 |
|---|---|
| 目的 | 正式7ラベルの不足分作成 |
| シグネチャ | `function createOrRepairGmailLabels(): LabelMap` |
| 戻り値 | ラベル名→GmailLabel |
| 冪等性 | 存在すれば再利用 |
| Lock | setup lock内 |
| 例外 | Gmail権限なし、同名取得失敗 |
| ログ | 作成ラベル名のみ |
| テスト | 0個、一部あり、全部あり |

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

### 7.8 `createOrGetDeadlineCalendar()`

| 項目 | 仕様 |
|---|---|
| 目的 | 専用Calendarの一意な取得または作成 |
| シグネチャ | `function createOrGetDeadlineCalendar(): GoogleAppsScript.Calendar.Calendar` |
| 優先順 | 保存ID → instance marker付き完全一致 → 新規作成 |
| 冪等性 | 同一instanceにつき1件 |
| Lock | setup lockまたはcalendar lock |
| 例外 | 複数候補、作成権限なし |
| ログ | IDはマスクまたは末尾のみ |
| テスト | 新規、保存ID有効、名称変更、削除、同名複数 |

Calendar説明へ次を含める。

```text
自動期日管理ツールが登録・更新する重要期限専用カレンダー。
タスクの完了・対象外・期限変更はGoogle Sheetsを正本として同期する。
[ADM_INSTANCE:<instance_id>]
```

### 7.9 `installTriggers()`

| 項目 | 仕様 |
|---|---|
| 目的 | 必要なinstallable triggerを重複なく作成 |
| シグネチャ | `function installTriggers(): TriggerInstallResult` |
| 対象 | 5分worker、Spreadsheet edit、日次maintenance |
| 冪等性 | handler名・source・event typeで既存判定 |
| Lock | Script Lock |
| 例外 | trigger作成権限、上限超過 |
| ログ | trigger UIDは必要最小限 |
| テスト | 0件、重複、余剰、再作成 |

### 7.10 `removeTriggers()`

| 項目 | 仕様 |
|---|---|
| 目的 | 本ツールが所有するtriggerだけを削除 |
| シグネチャ | `function removeTriggers(): number` |
| 判定 | allowlist handler名のみ |
| 冪等性 | 0件でも成功 |
| Lock | Script Lock |
| 例外 | 個別削除失敗を集約 |
| ログ | 削除件数 |
| テスト | 対象あり、なし、他スクリプトtrigger混在 |

### 7.11 `processUnprocessedEmails()`

| 項目 | 仕様 |
|---|---|
| 目的 | 再試行と新着未処理メールを安全に処理 |
| シグネチャ | `function processUnprocessedEmails(): ProcessingSummary` |
| 戻り値 | discovered、processed、review、ignored、failed、deferred |
| 冪等性 | Message ID、origin key、Task IDで保証 |
| Lock | Script Lock。取得不能時は警告終了 |
| 実行予算 | 270,000msで新規claim停止 |
| 例外 | message単位で捕捉し、全体を継続 |
| ログ | run summaryとmessage単位の最小情報 |
| テスト | 正常、重複、soft limit、同時実行、部分失敗 |

疑似コード。

```javascript
function processUnprocessedEmails() {
  const budget = ExecutionBudget.start(CONFIG.EXECUTION_SOFT_LIMIT_MS);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(CONFIG.LOCK_WAIT_MS)) return {skipped: "LOCKED"};

  const traceId = newTraceId();
  try {
    const candidates = [
      ...findDueRetries(),
      ...discoverManualOverrideMessages(),
      ...discoverInboxMessages()
    ];

    for (const candidate of dedupeByMessageId(candidates)) {
      if (budget.shouldStop()) break;
      if (hasFinalMessageState(candidate.messageId)) continue;

      try {
        processOneMessage(candidate, traceId, budget);
      } catch (err) {
        handleMessageFailure(candidate, err, traceId);
      }
    }
    return summarizeRun();
  } finally {
    lock.releaseLock();
  }
}
```

### 7.12 `processManualOverrideEmails()`

| 項目 | 仕様 |
|---|---|
| 目的 | `手動/取込`、`手動/除外`付きスレッドを優先評価 |
| シグネチャ | `function processManualOverrideEmails(): GmailCandidate[]` |
| 優先順位 | 除外 > 取込 |
| 取込 | ラベルがある限り、現在・将来の未処理受信Messageを候補化 |
| 除外 | 新規actionを登録せず、Message Stateを`IGNORED_MANUAL` |
| 既存Task | 自動でEXCLUDEDにはしない。Sheetsが正本 |
| 冪等性 | Message ID |
| Lock | 上位関数 |
| テスト | 両方付与、取込継続、除外中の新着 |

### 7.13 `classifyEmailWithAi()`

| 項目 | 仕様 |
|---|---|
| 目的 | AI入力をProvider-neutral adapterへ渡し、検証済み分類を返す |
| シグネチャ | `function classifyEmailWithAi(input: AiInput): AiClassification` |
| 入力 | 整形本文、件名、送信者、日時、thread context、既存Task要約 |
| 戻り値 | 検証済み`AiClassification` |
| 冪等性 | 同じ入力hash・prompt versionでは分類cacheを再利用可能 |
| Lock | 不要 |
| 例外 | HTTP、timeout、JSON、schema、semantic validation |
| ログ | provider、model、duration、token量が取得できれば件数のみ |
| テスト | valid、invalid JSON、未知enum、複数action、空action |

### 7.14 `upsertTask()`

| 項目 | 仕様 |
|---|---|
| 目的 | actionに基づきTaskを冪等に作成・更新 |
| シグネチャ | `function upsertTask(action, context): TaskUpsertResult` |
| 新規一意キー | `origin_key` |
| 更新対象 | `target_task_id`が同一stable threadに属すること |
| 人間保護 | `manual_fields`に含まれる列をAI更新しない |
| 冪等性 | origin key、action application history |
| Lock | Task ID採番と書込み時にDocument/Script Lock |
| 例外 | target不明、複数候補、schema mismatchはReviewへ |
| ログ | task ID、action type、changed fields |
| テスト | 新規、再実行、更新、人間編集済み、対象不明 |

### 7.15 `syncDeadlineCalendar()`

| 項目 | 仕様 |
|---|---|
| 目的 | Taskの期限をCalendarへ作成・更新・削除 |
| シグネチャ | `function syncDeadlineCalendar(taskId: string): CalendarSyncResult` |
| 登録条件 | 後述の決定表 |
| 冪等性 | event ID + Task ID tag |
| Lock | Calendar同期Lock |
| 例外 | calendar不存在、event不存在、書込み失敗 |
| ログ | create/update/delete/noop |
| テスト | 新規、更新、削除、event手動削除、同名calendar |

### 7.16 `onTaskSheetEdit()`

| 項目 | 仕様 |
|---|---|
| 目的 | 利用者編集を検知し、status、manual fields、Calendarを更新 |
| シグネチャ | `function onTaskSheetEdit(e): void` |
| 種別 | インストール型Spreadsheet edit trigger |
| 対象 | タスク一覧・要確認のdata row |
| 冪等性 | 新旧値比較、row version |
| Lock | 短時間のDocument Lock |
| 例外 | エラー・再実行へ記録。無限再帰防止 |
| ログ | 編集列、task ID、結果。値そのものは必要最小限 |
| テスト | 完了、対象外、期限、優先度、タイトル、複数セル貼付 |

スクリプトによる書込みではinstallable edit triggerは通常発火しないことを前提とするが、`SUPPRESS_EDIT_HANDLER`の一時フラグも用意し、明示的な再帰防止を行う。

### 7.17 `retryDeadLetters()`

| 項目 | 仕様 |
|---|---|
| 目的 | 再試行期限到来のretryable errorを再処理 |
| シグネチャ | `function retryDeadLetters(limit?: number): RetrySummary` |
| 初期limit | 10 |
| 冪等性 | entity IDとstageで再開 |
| Lock | Script Lock |
| 最大回数 | 3 |
| 間隔 | 5、15、60分 |
| 最大超過 | DEADのまま手動対応 |
| テスト | 成功、再失敗、最大超過、非retryable |

### 7.18 `cleanupOldLogs()`

| 項目 | 仕様 |
|---|---|
| 目的 | 保持期間を超えたHistory、Message State、解決済みErrorsを清掃 |
| シグネチャ | `function cleanupOldLogs(): CleanupSummary` |
| 実行 | 日次maintenance |
| Task | 自動削除しない |
| Message State | 365日。ただし未解決retry/deadは削除しない |
| History | 365日 |
| Error | 解決済みかつ90日超過のみ |
| Lock | Script Lock |
| テスト | 境界日、未解決、保持日変更 |

### 7.19 補助主要関数

| 関数 | 目的 |
|---|---|
| `reconcileThreadLabels(stableThreadKey)` | Task・Review・ErrorからAI/SYSラベルを再構成 |
| `diagnoseSystem()` | Sheet、metadata、labels、Calendar、trigger、propertiesを検査 |
| `refreshDashboard()` | Dashboard集計を更新 |
| `applyReviewDecision(reviewId)` | 承認・却下をTask/Calendarへ適用 |
| `reconcileCalendarEvents()` | TaskとCalendarの不整合を日次修復 |
| `computeScheduleState(task)` | 今日基準の期限状態を計算 |
| `validateAiClassification(json)` | JSON Schema・意味ルール検証 |
| `buildAiInput(message, thread, tasks)` | 必要最小限のAI入力作成 |

---

## 8. Google Sheets設計

### 8.1 基本構造

各シートは次を持つ。

- 行1: 内部列ID。利用者には非表示。
- 行2: 日本語表示名。固定。
- 行3以降: データ。
- Developer Metadata: `ADM_SHEET_KEY=<internal_sheet_key>`
- 1行目・2行目を固定。
- フィルタは行2をheaderとしてデータ範囲へ設定。
- スクリプトは表示名や列番号ではなく内部列IDで列を解決。
- 利用者入力可能列と管理列を保護設定で分ける。

### 8.2 利用者向けタブ

| 表示名 | 内部key | 目的 |
|---|---|---|
| ダッシュボード | `dashboard` | 今日、期限超過、今週、要確認、エラーの要約 |
| タスク一覧 | `tasks` | タスクの正本・主要操作 |
| 要確認 | `reviews` | AI候補、重要更新、曖昧判断の承認・却下 |
| 設定 | `settings` | 利用者が変更可能な設定 |
| 処理履歴 | `history` | 読みやすい監査・操作履歴 |
| エラー・再実行 | `dead_letters` | 再試行、恒久エラー、解決 |
| 使い方 | `help` | Docs、FAQ、NotebookLM、versionへの導線 |

### 8.3 非表示管理タブ

| 表示名 | 内部key | 目的 |
|---|---|---|
| メール状態 | `message_state` | Message ID単位の処理状態・分類JSON |
| システム設定 | `system_config` | schema version、setup journal、migration |
| プロンプト版管理 | `prompt_versions` | prompt、schema version、hash |
| 同期状態 | `sync_state` | Calendarやメンテナンスのcursor・集約状態 |

### 8.4 タスク一覧の列

#### 8.4.1 利用者向け列

| 順 | 内部ID | 日本語表示 | 型 | 必須 | 初期値 | 編集 | 規則 |
|---:|---|---|---|---|---|---|---|
| 1 | `completed` | 完了 | Boolean | Yes | FALSE | 可 | checkbox |
| 2 | `excluded` | 対象外 | Boolean | Yes | FALSE | 可 | checkbox |
| 3 | `status` | 対応状況 | Enum | Yes | OPEN | 可 | 未対応/対応中/返信待ち/完了/対象外/取消 |
| 4 | `task_title` | タスク内容 | String | Yes | AI候補 | 可 | 1～500文字 |
| 5 | `due_date` | 期限 | Date | No | null | 可 | date |
| 6 | `suggested_due_date` | 推奨期限 | Date | No | null | 原則不可 | AI推測 |
| 7 | `deadline_basis` | 期限根拠 | Enum | Yes | none | 原則不可 | 明示/相対/推測/曖昧/なし |
| 8 | `priority` | 優先度 | Enum | Yes | medium | 可 | 高/中/低 |
| 9 | `waiting_for_reply` | 返信待ち | Boolean | Yes | FALSE | 可 | checkbox |
| 10 | `calendar_sync_mode` | Calendar登録 | Enum | Yes | AUTO | 可 | 自動/登録/対象外 |
| 11 | `needs_review` | 要確認 | Boolean | Yes | FALSE | 原則不可 | checkbox表示 |
| 12 | `sender` | 送信者 | String | No | - | 不可 | 表示のみ |
| 13 | `subject` | 件名 | String | No | - | 不可 | 表示のみ |
| 14 | `received_at` | 受信日時 | DateTime | No | - | 不可 | `yyyy/MM/dd HH:mm` |
| 15 | `source_email` | 元メール | URL | No | - | 不可 | hyperlink |

#### 8.4.2 管理列

| 内部ID | 日本語表示 | 型 | 用途 |
|---|---|---|---|
| `task_id` | Task ID | String | 主キー |
| `origin_key` | Origin Key | String | 新規Taskの冪等キー |
| `source_message_id` | Gmail Message ID | String | 起点Message |
| `source_thread_id` | Gmail Thread ID | String | Gmailリンク・照合 |
| `stable_thread_key` | Stable Thread Key | String | 永続スレッドkey |
| `source_action_index` | Action Index | Integer | AI actions配列index |
| `ai_action_type` | AI Action Type | Enum | 起点action |
| `ai_reason` | AI判定理由 | String | 500文字以内 |
| `ai_confidence` | AI信頼度 | Number | 0～1 |
| `ai_provider` | AI Provider | String | provider名 |
| `ai_model` | AI Model | String | model識別 |
| `ai_prompt_version` | Prompt Version | String | prompt version |
| `calendar_category` | Calendar分類 | Enum | 重要期限種別 |
| `calendar_importance` | Calendar重要度 | Enum | high/medium/low |
| `calendar_event_id` | Calendar Event ID | String | event更新 |
| `calendar_sync_status` | Calendar同期状態 | Enum | NONE/PENDING/SYNCED/ERROR/DELETED |
| `schedule_state` | 期限状態 | Enum | TODAY/OVERDUE等 |
| `manual_fields` | 手動保護列 | JSON/String | 人間編集済み内部ID配列 |
| `row_version` | Row Version | Integer | 楽観的競合検知 |
| `created_at` | 登録日時 | DateTime | 作成 |
| `updated_at` | 最終更新日時 | DateTime | 更新 |
| `last_calendar_sync_at` | 最終Calendar同期 | DateTime | 同期確認 |

管理列は右側へ配置し、原則非表示・保護する。

### 8.5 主ステータスと派生期限状態

`status`は業務状態だけを表す。

| 内部値 | 表示 |
|---|---|
| `OPEN` | 未対応 |
| `IN_PROGRESS` | 対応中 |
| `WAITING` | 返信待ち |
| `DONE` | 完了 |
| `EXCLUDED` | 対象外 |
| `CANCELLED` | 取消 |

`schedule_state`は期限と現在日付から計算する。

| 内部値 | 条件 |
|---|---|
| `NONE` | 期限なし、または完了・対象外・取消 |
| `OVERDUE` | 期限 < 今日 |
| `TODAY` | 期限 = 今日 |
| `UPCOMING` | 今日 < 期限 <= 7日後 |
| `FUTURE` | 期限 > 7日後 |

### 8.6 要確認タブ

| 内部ID | 表示 | 型 | 備考 |
|---|---|---|---|
| `review_id` | Review ID | String | 主キー、非表示 |
| `review_status` | 確認状態 | Enum | OPEN/ACCEPTED/REJECTED/APPLIED/ERROR |
| `review_type` | 確認種別 | Enum | NEW_TASK/UPDATE_DUE/COMPLETE/CANCEL/UNCLEAR等 |
| `decision` | 判断 | Enum | 未選択/受入/却下 |
| `decision_note` | コメント | String | 任意 |
| `task_id` | Task ID | String | 対象既存Task |
| `target_task_id` | AI対象Task | String | AI候補 |
| `candidate_title` | タスク候補 | String | 編集可 |
| `due_date` | 期限候補 | Date | 編集可 |
| `suggested_due_date` | 推奨期限 | Date | 表示 |
| `deadline_basis` | 期限根拠 | Enum | 表示 |
| `priority` | 優先度 | Enum | 編集可 |
| `waiting_for_reply` | 返信待ち | Boolean | 編集可 |
| `calendar_sync_mode` | Calendar登録 | Enum | 編集可 |
| `calendar_category` | 期限分類 | Enum | 編集可 |
| `calendar_importance` | 重要度 | Enum | 編集可 |
| `reason` | AI判定理由 | String | 表示 |
| `confidence` | AI信頼度 | Number | 表示 |
| `sender` | 送信者 | String | 表示 |
| `subject` | 件名 | String | 表示 |
| `received_at` | 受信日時 | DateTime | 表示 |
| `source_email` | 元メール | URL | 表示 |
| `message_id` | Message ID | String | 非表示 |
| `stable_thread_key` | Stable Thread Key | String | 非表示 |
| `action_index` | Action Index | Integer | 非表示 |
| `created_at` | 作成日時 | DateTime | 表示 |
| `decided_at` | 判断日時 | DateTime | 非表示 |
| `applied_at` | 適用日時 | DateTime | 非表示 |

Reviewの受入れはインストール型編集トリガーで適用し、`APPLIED`まで完了した時点でTask/Calendar/ラベルを再構成する。

### 8.7 メール状態タブ

| 内部ID | 型 | 説明 |
|---|---|---|
| `message_id` | String | 主キー |
| `thread_id` | String | Gmail Thread ID |
| `stable_thread_key` | String | 永続thread key |
| `received_at` | DateTime | 受信日時 |
| `state` | Enum | 処理状態 |
| `attempt_count` | Integer | 再試行回数 |
| `next_retry_at` | DateTime | 次回再試行 |
| `last_error_code` | String | 最終エラー |
| `last_error_at` | DateTime | 最終失敗 |
| `classification_schema_version` | String | Schema version |
| `classification_json` | String | 整形済み分類JSON |
| `classification_hash` | String | hash |
| `input_hash` | String | AI入力hash |
| `prompt_version` | String | prompt version |
| `trace_id` | String | 処理trace |
| `discovered_at` | DateTime | 発見 |
| `claimed_at` | DateTime | claim |
| `processed_at` | DateTime | 最終完了 |
| `retention_expires_at` | DateTime | 保持期限 |

メール本文は保存しない。

### 8.8 処理履歴タブ

| 内部ID | 型 | 説明 |
|---|---|---|
| `event_id` | String | UUID |
| `timestamp` | DateTime | 発生時刻 |
| `severity` | Enum | INFO/WARN/ERROR |
| `component` | String | Gmail/AI/Task/Calendar等 |
| `operation` | String | 処理名 |
| `entity_type` | String | MESSAGE/TASK/REVIEW等 |
| `entity_id_masked` | String | マスクID |
| `result` | String | SUCCESS/NOOP/FAIL |
| `duration_ms` | Integer | 処理時間 |
| `message` | String | 人が読める短文 |
| `details_json` | String | 機密を除いた詳細 |
| `trace_id` | String | trace |

### 8.9 エラー・再実行タブ

| 内部ID | 型 | 説明 |
|---|---|---|
| `dead_letter_id` | String | 主キー |
| `status` | Enum | RETRY_WAIT/DEAD/RESOLVED |
| `entity_type` | String | MESSAGE/TASK/CALENDAR/SETUP |
| `entity_id` | String | 対象ID |
| `message_id` | String | Message ID |
| `thread_id` | String | Thread ID |
| `task_id` | String | Task ID |
| `failed_stage` | String | 失敗段階 |
| `error_code` | String | 正規化コード |
| `error_summary` | String | 利用者向け概要 |
| `retryable` | Boolean | 再試行可否 |
| `attempt_count` | Integer | 回数 |
| `next_retry_at` | DateTime | 次回 |
| `first_failed_at` | DateTime | 初回 |
| `last_failed_at` | DateTime | 最終 |
| `manual_action` | Enum | 再実行/解決/無視 |
| `resolution_note` | String | 解決記録 |
| `resolved_at` | DateTime | 解決 |
| `trace_id` | String | trace |

### 8.10 設定タブ

利用者変更可能列は`値`だけとし、`キー`、`型`、`初期値`、`説明`、`要再起動`は保護する。

### 8.11 条件付き書式

- `completed=TRUE`: 行全体を薄く表示し、取消線はタスク内容のみ。
- `excluded=TRUE`: 行全体を薄い灰色。
- `schedule_state=OVERDUE`: 期限セルを強調。
- `schedule_state=TODAY`: 期限セルを強調。
- `needs_review=TRUE`: 要確認セルを強調。
- `calendar_sync_status=ERROR`: Calendar列を警告。
- Reviewの`OPEN`: 強調。
- Dead Letterの`DEAD`: 強い警告。

色は実装時のUIガイドで決める。条件の意味を色だけに依存させず、文字・アイコンを併用する。

### 8.12 保護設定

- 利用者編集可: 完了、対象外、対応状況、タスク内容、期限、優先度、返信待ち、Calendar登録。
- Review: 判断、コメント、候補タイトル、期限、優先度、Calendar設定。
- 管理列、内部ID行、数式列は保護。
- 保護は誤操作防止であり、セキュリティ境界とはみなさない。

---

## 9. 状態管理と状態遷移

### 9.1 メール処理状態

| 現在 | イベント | 次 | 備考 |
|---|---|---|---|
| 未登録 | 候補発見 | DISCOVERED | Message State作成 |
| DISCOVERED | claim成功 | CLAIMED | attemptを管理 |
| CLAIMED | 手動除外 | IGNORED_MANUAL | Task作成なし |
| CLAIMED | 固定ルール除外 | IGNORED_RULE | Task作成なし |
| CLAIMED | AI成功・検証成功 | CLASSIFIED | JSON保存 |
| CLAIMED | 一時失敗 | RETRY_WAIT | next_retry_at |
| CLAIMED | 非retryable | DEAD | 手動対応 |
| CLASSIFIED | action適用開始 | APPLYING | Saga |
| APPLYING | 全action成功 | DONE | label再構成 |
| APPLYING | 部分失敗 | RETRY_WAIT | 分類JSON再利用 |
| RETRY_WAIT | 再試行時刻 | CLAIMED | attempt+1 |
| RETRY_WAIT | 最大超過 | DEAD | SYS/失敗維持 |
| DEAD | 手動再実行 | CLAIMED | 管理者操作 |
| DEAD | 解決 | DONE/IGNORED | 解決記録 |

### 9.2 タスク状態

```text
OPEN ──開始──> IN_PROGRESS
OPEN/IN_PROGRESS ──返信待ち──> WAITING
WAITING ──回答受領──> OPEN または IN_PROGRESS
OPEN/IN_PROGRESS/WAITING ──人が完了──> DONE
OPEN/IN_PROGRESS/WAITING ──人が対象外──> EXCLUDED
OPEN/IN_PROGRESS/WAITING ──取消承認──> CANCELLED
DONE/EXCLUDED ──人が解除──> OPEN
```

AIは`DONE`、`CANCELLED`を直接確定しない。Review受入れまたは人間のチェックを必要とする。

### 9.3 要確認状態

```text
OPEN
  ├─受入→ ACCEPTED → 適用成功→ APPLIED
  │                    └─失敗→ ERROR
  └─却下→ REJECTED
```

### 9.4 Calendar同期状態

```text
NONE
  ├─登録条件成立→ PENDING → SYNCED
  └─登録不要→ NONE

SYNCED
  ├─期限変更→ PENDING → SYNCED
  ├─完了/対象外/取消→ PENDING → DELETED
  └─同期失敗→ ERROR → PENDING
```

### 9.5 返信待ち

初期版では送信済みメールを通常巡回しないため、返信待ちの完全自動化は行わない。

- AIが受信メールの文脈から明確に`SET_WAITING`と判定した場合は候補化できる。
- 利用者がSheetsで返信待ちを手動設定できる。
- 送信済みメールと相手からの回答を自動追跡する機能は将来拡張とする。
- 自動判定に不確実性がある場合はReviewへ送る。

---

## 10. Gmail巡回仕様

### 10.1 通常候補クエリ

初期クエリ例。

```text
in:inbox after:YYYY/MM/DD -category:promotions -category:social
```

`YYYY/MM/DD`は`LAST_FULL_DISCOVERY_AT`から1日戻した日付とする。検索時刻の粒度や遅延による漏れを避け、Message IDで重複排除する。

追加除外は設定値とする。

```text
-from:(設定された自動通知送信者)
-subject:(設定された明確な除外件名)
```

固定除外を増やしすぎず、業務メールの誤除外を防ぐ。

### 10.2 ページング

- `GmailApp.search(query, start, max)`を使用。
- `max=100`を初期値。
- 1回のrunで最大500 threadsを走査。
- soft time limitへ近づいたら停止。
- 全ページを完了した場合だけ`LAST_FULL_DISCOVERY_AT`を更新。
- 中断時はwatermarkを進めず、次回に重複走査する。Message IDで重複は発生しない。

### 10.3 メッセージ抽出

各threadで次を行う。

1. `getMessages()`を取得。
2. `message.isInInbox()`相当の受信トレイ条件を確認。
3. `received_at >= SETUP_COMPLETED_AT`を確認。ただし`手動/取込`は例外。
4. Message IDを抽出。
5. Message Stateの最終状態を確認。
6. 未処理だけ候補化。
7. 1runの最大処理数20に達したら停止。

### 10.4 Message ID重複防止

Message StateのID列をrun開始時に一括取得して`Set`へ格納する。行数が設定上限を超えた場合は警告し、古い確定済み状態をarchiveする。

`CLAIMED`のまま一定時間を超えた行はstale claimとして再試行候補にする。

初期stale thresholdは30分とする。

### 10.5 手動ラベル

GmailAppのラベルはスレッド単位と扱う。

- `手動/除外`: ラベルがある間、そのスレッドの新規未処理Messageを自動登録しない。
- `手動/取込`: ラベルがある間、そのスレッドの新規未処理受信Messageを固定除外条件より優先して処理する。
- 両方ある場合は`手動/除外`を優先。
- 人間のラベルをAI処理で削除しない。
- 既存Taskを`手動/除外`だけで自動EXCLUDEDにはしない。Task正本はSheetsである。

### 10.6 メール整形

AIへ渡す前に次を行う。

- HTML本文をplain textへ変換。
- 連続空白・改行を正規化。
- 代表的な引用区切りを除去。
- `On ... wrote:`、`-----Original Message-----`等の引用開始以降を必要に応じて除去。
- 定型署名は保守的に除去。
- 免責文は設定済みpatternで除去。
- URLは原則保持するが、追跡parameterは削除可能。
- 本文は最大20,000文字。
- 直前1～2メッセージを追加する場合、合計上限内で新しい文脈を優先。
- 切詰め時は`content_truncated=true`をAIへ渡す。

本文除去に失敗しても処理を止めず、長さ制限だけは必ず適用する。

### 10.7 AIへ渡す情報

```json
{
  "message_id": "masked-or-internal",
  "received_at": "ISO-8601",
  "subject": "...",
  "sender_display_name": "...",
  "sender_domain": "example.com",
  "body": "...",
  "content_truncated": false,
  "thread_context": [
    {
      "direction": "inbound_or_unknown",
      "received_at": "ISO-8601",
      "text": "..."
    }
  ],
  "active_tasks": [
    {
      "task_id": "...",
      "title": "...",
      "status": "OPEN",
      "due_date": "YYYY-MM-DD"
    }
  ],
  "timezone": "Asia/Tokyo",
  "today": "YYYY-MM-DD"
}
```

AIへ渡す`task_id`は内部参照のために必要だが、社内規程により送信不可の場合は短期tokenへ置換する。

### 10.8 Gmailラベルの投影

AI出力の`labels`をそのまま永続付与するのではなく、スレッドの現在状態から再計算する。

| ラベル | 付与条件 |
|---|---|
| `AI/要対応` | 同一stable threadにOPEN/IN_PROGRESSのTaskが1件以上 |
| `AI/期限` | 同一stable threadの未完了Taskに正式期限が1件以上 |
| `AI/返信待` | 同一stable threadにWAITING Taskが1件以上 |
| `AI/要確認` | 同一stable threadにOPEN Reviewが1件以上 |
| `SYS/失敗` | 同一stable threadに未解決RETRY_WAIT/DEADが1件以上 |

条件を満たさなくなったAI/SYSラベルはシステムが削除する。`手動/*`には触れない。

### 10.9 Gmail障害時

- Search失敗: run-level errorとして記録し、watermarkを進めない。
- Thread取得失敗: thread単位Dead Letter。
- Message取得失敗: message/thread単位Dead Letter。
- Label付与失敗: Task/Message Stateは保持し、label reconciliationを再試行。
- Gmail権限失効: `AUTH_REQUIRED`として自動再試行を停止し、利用者へ再承認を案内。

---

## 11. AI Adapter仕様

### 11.1 Adapter interface

```javascript
/**
 * @interface
 */
class AiAdapter {
  classify(input, options) {
    // returns AiClassification
  }

  healthCheck() {
    // returns provider/model/auth availability
  }
}
```

実装候補。

- `MockAiAdapter`: 個人PC・初期開発用。固定JSONを返す。
- `GeminiApiAdapter`: Gemini APIをUrlFetchで呼ぶ。
- `VertexAiAdapter`: 会社承認済みGoogle Cloud認証を利用。
- `ProxyAiAdapter`: 会社管理バックエンドを呼ぶ。

`AI_PROVIDER`設定で差し替える。

### 11.2 AI構造化出力Schema

単一actionではなく配列を採用する。

```json
{
  "schema_version": "1.0",
  "language": "ja",
  "thread_summary": "1000文字以内の要約",
  "is_business_relevant": true,
  "overall_confidence": 0.94,
  "actions": [
    {
      "action_type": "NEW_TASK",
      "target_task_id": null,
      "task_title": "資料を確認して返信する",
      "deadline": "2026-07-31",
      "suggested_deadline": null,
      "deadline_basis": "explicit",
      "deadline_source_text": "7月31日までに",
      "priority": "medium",
      "waiting_for_reply": false,
      "needs_review": false,
      "calendar_category": "EXTERNAL_SUBMISSION",
      "calendar_importance": "high",
      "recommended_labels": [
        "AI/要対応",
        "AI/期限"
      ],
      "confidence": 0.94,
      "reason": "本文に確認・返信依頼と明示期限がある"
    }
  ],
  "warnings": []
}
```

### 11.3 action type

| action | 意味 | 初期自動適用 |
|---|---|---|
| `NEW_TASK` | 新規依頼 | 条件付き可 |
| `ADD_TASK` | 既存threadへの追加依頼 | 条件付き可 |
| `UPDATE_DUE` | 既存Taskの期限変更 | 厳格条件付き可 |
| `CANCEL_TASK` | 依頼取消 | 不可。Review |
| `MARK_COMPLETE` | 完了通知 | 不可。Review |
| `SET_WAITING` | 返信待ち化 | 条件付き可 |
| `CLEAR_WAITING` | 返信待ち解除 | 条件付き可 |
| `INFORMATION_ONLY` | 参考情報 | Task作成なし |
| `UNCLEAR` | 判定不能 | Review |

### 11.4 JSON Schema検証

構文検証に加えて、次を検証する。

- `schema_version`が許容version。
- `overall_confidence`、各`confidence`が0～1。
- `actions.length <= AI_ACTION_MAX`。初期10。
- enum値がallowlist。
- `deadline`が`YYYY-MM-DD`またはnull。
- `deadline_basis=explicit|relative`でdeadlineがnullならinvalid。
- `deadline_basis=inferred`では正式`deadline`をnullとし、`suggested_deadline`へ入れる。
- `UPDATE_DUE/CANCEL_TASK/MARK_COMPLETE/SET_WAITING/CLEAR_WAITING`には`target_task_id`を原則要求。
- `target_task_id`は同一stable threadのTaskだけを許可。
- `task_title`は500文字以内。
- `reason`は1000文字以内。
- `recommended_labels`は正式AIラベルallowlistのみ。
- Calendar category、importanceはallowlist。
- 原文に存在しない固有名詞を新規生成しないようpromptで制約する。

### 11.5 自動登録判定

#### 新規Task

次を全て満たす場合だけ自動登録。

- `action_type`が`NEW_TASK`または`ADD_TASK`
- `confidence >= 0.85`
- `needs_review=false`
- `task_title`が有効
- `手動/除外`なし
- 検証warningなし
- 重要な曖昧性なし

#### 要確認

次のいずれか。

- `0.60 <= confidence < 0.85`
- `needs_review=true`
- `deadline_basis=ambiguous`
- 明示期限を検出したがTask判定が低信頼
- target taskが不明または複数
- 人間編集済み列をAIが変更しようとした
- `MARK_COMPLETE`、`CANCEL_TASK`
- Schemaは有効だが業務ルール上自動適用不可

#### 登録しない

- `confidence < 0.60`
- `INFORMATION_ONLY`
- 固定除外
- `手動/除外`

ただし、明示期限を検出した低信頼actionはReviewへ残す。

### 11.6 期限変更の自動適用

次を全て満たす場合のみ可。

- `action_type=UPDATE_DUE`
- `confidence >= 0.90`
- target taskが一意
- target taskが同一stable thread
- `deadline_basis`が`explicit`または許可済み`relative`
- target taskの`due_date`が`manual_fields`に含まれない
- 新期限が有効
- AI warningなし

1つでも満たさなければReviewへ送る。

### 11.7 Prompt構造

System instructionの主な制約。

```text
- メール本文に基づいてのみ判断する。
- 原文にない期限、固有名詞、依頼、完了を作らない。
- 不明な場合はUNCLEARまたはneeds_review=trueとする。
- 推測期限はsuggested_deadlineへ入れ、正式deadlineへ入れない。
- 1メールに複数依頼があればactionsへ分ける。
- 既存Task更新は与えられたtask_idから選び、存在しないIDを作らない。
- JSON Schema以外の文章を返さない。
- 日本語と英語を原文どおり扱う。
```

### 11.8 Prompt version管理

`プロンプト版管理`に次を保存する。

| 列 | 説明 |
|---|---|
| `prompt_version` | 例:`task-classifier-v1.0.0` |
| `schema_version` | 例:`1.0` |
| `provider` | mock/gemini/vertex/proxy |
| `model` | model識別 |
| `prompt_hash` | SHA-256 |
| `active` | TRUE/FALSE |
| `created_at` | 日時 |
| `notes` | 変更理由 |

Message StateとTaskへ使用versionを記録する。

### 11.9 APIエラー・再試行

- HTTP 429、5xx、timeout: retryable。
- HTTP 400、schema設定誤り: 原則non-retryable。設定修正後手動再実行。
- HTTP 401/403: `AUTH_REQUIRED`。自動再試行停止。
- JSON parse失敗: 1回だけ同じrunで厳格再要求してよい。以後retry。
- Structured Outputを提供するAIでも、アプリ側のJSON・業務検証を省略しない。
- AI API利用不能時はTaskを勝手に作らず、`SYS/失敗`とDead Letterへ送る。

### 11.10 認証情報

優先順位。

1. 会社管理のGoogle Cloud認証、サービスまたはproxy。
2. 利用者単位の承認済みtoken。
3. 会社規程で明示的に許可された場合のみScript PropertiesのAPI key。

Script Propertiesはプロジェクト編集者から参照可能なため、強固なsecret vaultとはみなさない。

---

## 12. タスク登録・更新仕様

### 12.1 新規Task

1. `origin_key`で既存Taskを検索。
2. 存在すればNOOPまたは分類差分をHistoryへ。
3. 存在しなければTask IDをUUID生成。
4. actionとメールmetadataからrowを作成。
5. `manual_fields=[]`、`row_version=1`。
6. Calendar条件を評価。
7. Task rowを一括書込み。
8. Calendar同期。
9. History記録。
10. thread labels再構成。

### 12.2 既存Task更新

- `target_task_id`でTask取得。
- stable thread一致を検証。
- `manual_fields`と変更候補を比較。
- 保護列に衝突した場合はReview。
- 変更前後の差分をHistoryへ。
- `row_version + 1`。
- Calendar再同期。
- 同じ`message_id#action_index`の適用履歴があればNOOP。

### 12.3 1スレッド複数Task

- Taskの主キーは`stable_thread_key`ではなく`task_id`。
- `stable_thread_key`はgrouping用途。
- 1messageの各actionへ`origin_key`を割り当てる。
- AIへ同一threadのactive tasksを渡し、更新対象を選ばせる。
- targetが曖昧なら新規Taskへ勝手に変換せずReview。

### 12.4 期限変更

- 自動条件を満たす場合はTask更新。
- 手動修正済み期限は上書きしない。
- Calendar eventを更新。
- 過去日へ変更された場合も原文が明示なら反映できるが、Reviewへ送る初期設定としてもよい。初期版では過去日変更はReviewとする。

### 12.5 依頼取消

AIの`CANCEL_TASK`は必ずReviewへ。受入れ後、statusを`CANCELLED`とし、Calendarを削除する。Task行は削除しない。

### 12.6 対応完了通知

AIの`MARK_COMPLETE`は必ずReviewへ。受入れ後、`completed=TRUE`、status=`DONE`、Calendar削除。人間が完了チェックする運用を優先する。

### 12.7 追加依頼

`ADD_TASK`として新しいTaskを作る。既存Taskを上書きしない。新旧依頼が同一内容に見える場合でも、origin keyが別であるため、AI理由と類似度をReviewへ送ることができる。初期版では明確な追加依頼は新規Taskとする。

### 12.8 返信待ち

- `SET_WAITING`: status=`WAITING`、waiting_for_reply=TRUE。
- `CLEAR_WAITING`: statusを直前状態またはOPENへ戻す。
- 直前状態は`status_before_waiting`管理列で保持することを推奨。
- Calendarは回答待ちだけでは登録しない。

### 12.9 参考情報

`INFORMATION_ONLY`はTaskを作らず、Message StateをDONEとする。必要に応じてHistoryへ分類結果だけ記録する。

### 12.10 人間編集の保護

編集対象列が人間により変更された場合、`manual_fields`へ内部IDを追加する。

例。

```json
["task_title", "due_date", "priority", "calendar_sync_mode"]
```

AI更新は同列を変更しない。解除機能としてメニューから「AI更新保護を解除」を提供してもよいが、初期版では管理者操作とする。

### 12.11 完了・対象外解除

- 完了解除: statusをOPENへ戻す。ただし期限があり登録条件を満たせばCalendar再作成。
- 対象外解除: statusをOPENまたはREVIEWへ戻す。元のReviewが残っていればReviewを優先。
- 解除はHistoryへ記録する。

---

## 13. Calendar同期仕様

### 13.1 Calendar登録決定表

| 条件 | AUTO | FORCE | NONE |
|---|---|---|---|
| TaskがDONE/EXCLUDED/CANCELLED | 削除 | 削除 | 削除 |
| due_dateなし | 登録しない | Reviewまたは登録不可 | 登録しない |
| deadline_basis=inferred/ambiguous | 登録しない | 利用者が期限確定済みなら可 | 登録しない |
| deadline_basis=explicit/relative | 重要期限なら登録 | 登録 | 登録しない |
| waitingのみ | 登録しない | 利用者が明示指定なら可 | 登録しない |

### 13.2 AUTO登録の重要期限分類

`calendar_category`が次のallowlistで、`calendar_importance=high`を原則とする。

```text
EXTERNAL_SUBMISSION
FINAL_MATERIAL
CONTRACT
BID
LEGAL_TAX
REGULATORY
OTHER_HIGH_IMPACT
```

通常の返信、軽微な資料確認、短時間作業は期限があってもSheetsだけで管理する。

### 13.3 イベント形式

- 種別: 終日予定。
- 日付: `due_date`。
- タイトル: `【期限】<task_title>`。Calendar上限を考慮し、初期100文字以内。
- 説明:

```text
タスク: <task_title>
送信者: <sender>
期限根拠: <deadline_basis>
元メール: <source_email>
Task ID: <task_id>
管理元: Google Sheets
```

メール本文は含めない。

### 13.4 Event tag

可能なCalendarEvent tag機能を使用し、次を保存する。

```text
ADM_TASK_ID=<task_id>
ADM_INSTANCE_ID=<instance_id>
ADM_SCHEMA_VERSION=<version>
```

### 13.5 作成

1. `calendar_event_id`が空。
2. Task ID tagで既存eventを期間限定検索。
3. なければcreateAllDayEvent。
4. tag設定。
5. event IDをTaskへ保存。
6. sync status=`SYNCED`。

### 13.6 更新

- event IDで取得。
- 取得できなければTask ID tagで再照合。
- タイトル、日付、説明をSheets正本へ合わせる。
- 手動Calendar変更は上書きする。
- 更新成功後、Taskへ新event IDと日時を保存。

### 13.7 削除

完了、対象外、取消、sync mode NONEではeventを削除し、Taskのevent IDを空にする。Historyへ削除を記録する。

### 13.8 Calendar消失・名称変更

- 保存IDが有効なら名称変更後も使用。
- IDが無効ならexact nameとinstance markerで検索。
- 0件なら新規作成。
- 1件なら再関連付け。
- 2件以上なら`CALENDAR_AMBIGUOUS`として自動選択しない。
- Calendar削除後は再作成し、既存未完了Taskを日次reconciliationで再同期。

### 13.9 Calendar側の手動編集

Calendarは正本ではない。日次reconciliationでSheetsへ戻す。利用手引書で「期限変更はSheetsで行う」と明示する。

### 13.10 Calendarエラー

- 一時障害・quota: retryable。
- 権限失効: non-auto retry、利用者へ再承認。
- event不存在: 新規作成による自己修復。
- Calendar ambiguous: 手動解決。
- Taskは失わず、sync status=`ERROR`。

---

## 14. 初期セットアップ・修復・更新

### 14.1 `setupSystem()`処理順

1. コンテナバインド確認。
2. Script Lock。
3. OAuth認可確認。
4. `instance_id`生成または再利用。
5. `SYSTEM_VERSION`、`SETUP_STATUS`初期化。
6. Sheets/metadata/列/書式/入力規則作成。
7. Gmailラベル作成。
8. Calendar取得・作成。
9. Calendar ID保存。
10. 設定値初期化。
11. Prompt version初期登録。
12. Triggers作成。
13. `SETUP_COMPLETED_AT`保存。
14. 初期診断。
15. 初期ログ。
16. `SETUP_STATUS=COMPLETE`。

`SETUP_COMPLETED_AT`は最初の成功時刻を保持し、再setupで上書きしない。

### 14.2 Properties

#### Script Properties

| key | 用途 |
|---|---|
| `ADM_INSTANCE_ID` | インスタンスID |
| `SYSTEM_VERSION` | 現在version |
| `SETUP_STATUS` | setup状態 |
| `SETUP_COMPLETED_AT` | 初回完了日時 |
| `DEADLINE_CALENDAR_ID` | Calendar ID |
| `APPLIED_MIGRATIONS` | 適用migration ID一覧 |
| `LAST_FULL_DISCOVERY_AT` | 完了した通常検索watermark |
| `LAST_MAINTENANCE_AT` | maintenance |
| `AI_PROVIDER` | adapter |
| `ACTIVE_PROMPT_VERSION` | prompt version |
| `PROCESSING_ENABLED` | 自動処理ON/OFF |

#### User Properties

- 表示上の個人設定。
- 利用者別のDocs/NotebookLMリンク。
- 認証方式に必要な非共有参照情報。
- 大量Message IDやTaskデータは保存しない。

### 14.3 Setup Journal

`システム設定`タブへ次を記録。

```text
setup_step
status
started_at
completed_at
error_code
details
```

途中失敗後は成功済みstepを再検証し、不足だけを実行する。

### 14.4 `repairLayout()`

変更してよいもの。

- 表示名
- 列幅・行高
- freeze
- filter
- validation
- checkbox
- conditional format
- metadata
- 保護
- 不足列

変更しないもの。

- Taskデータ
- Gmailラベル
- Calendar
- Trigger
- Propertiesの業務状態
- API認証

### 14.5 `upgradeSystem()`

Migration registry例。

```javascript
const MIGRATIONS = [
  { id: "M001_INITIAL_SCHEMA", from: null, to: "1.0.0", run: migrate001 },
  { id: "M002_ADD_MANUAL_FIELDS", from: "1.0.0", to: "1.1.0", run: migrate002 }
];
```

- migrationは順番に適用。
- `APPLIED_MIGRATIONS`で二重適用防止。
- 各migrationは再入可能にする。
- 大規模変更前は対象sheetを同一spreadsheet内へtimestamp付きコピーする選択肢を持つ。
- migration失敗時はversionを進めない。
- migration後に`diagnoseSystem()`を実行。

### 14.6 診断機能

最低限、次を確認する。

- 必須sheet key。
- 内部列ID。
- schema version。
- 正式7ラベル。
- Calendar IDとinstance marker。
- 必須trigger。
- timezone。
- setup completed。
- AI adapter health。
- processing enabled。
- 重複Task ID、origin key。
- 重複Calendar event。
- stale Message State。
- Dead Letter件数。

---

## 15. トリガー仕様

### 15.1 必須トリガー

| handler | 種別 | 初期頻度 | 目的 |
|---|---|---|---|
| `processUnprocessedEmails` | time-driven | 5分 | 再試行、新着、手動補正 |
| `onTaskSheetEdit` | spreadsheet edit | 編集時 | Task/Review編集反映 |
| `runDailyMaintenance` | time-driven | 毎日03:00付近 | cleanup、reconciliation、diagnostic |

時間主導トリガーは厳密な時刻・間隔を保証するものとして扱わない。正常時の処理目標は受信後15分以内とするが、SLAではない。

### 15.2 Simple triggerとの分離

- `onOpen()`だけをsimple triggerとして使用。
- Calendar・Gmail・UrlFetchを必要とする編集処理はinstallable edit trigger。
- simple `onEdit(e)`は実装しないか、UIのみの薄いwrapperに限定する。

### 15.3 重複防止

`ScriptApp.getProjectTriggers()`を取得し、handler function、event type、source IDを比較する。

本ツールが作成するhandler allowlist。

```text
processUnprocessedEmails
onTaskSheetEdit
runDailyMaintenance
```

同一handlerの重複を見つけた場合、最古1件を残し、余剰を削除するか診断で警告する。初期版はsetup時に余剰を削除する。

### 15.4 所有者

Installable triggerは作成した利用者の権限で動作する。各利用者が自分のコピーで`setupSystem()`を実行する。

### 15.5 同時実行

- workerはScript Lock。
- edit handlerは短時間のDocument Lock。
- maintenanceはScript Lock。
- lock取得失敗はエラーにせず`SKIPPED_LOCKED`として警告。
- workerがeditを長時間阻害しないよう、lock保持中の外部AI呼出しをどうするかは注意する。

`[補完]` 初期版では処理全体をScript Lockで保護し、安定性を優先する。性能問題が確認された場合、claimだけをlock内で行い、AI呼出しをlock外へ分離する二段階方式へ移行する。

### 15.6 実行時間上限対策

- run開始時刻を記録。
- 270秒で新規message claimを停止。
- 現在messageの安全なcheckpointまで完了。
- 未処理は次回へ。
- batch sizeを設定値化。
- 1runで最大20message。
- AI APIが遅い場合はさらに件数を減らす。

---

## 16. エラー、ログ、Dead Letter、再試行

### 16.1 エラーコード

| code | retryable | 処理 |
|---|---:|---|
| `AUTH_REQUIRED` | No | 利用者へ再承認案内 |
| `QUOTA_EXCEEDED` | Yes | 次回以降 |
| `LOCK_TIMEOUT` | Yes | runをskip |
| `CONFIG_INVALID` | No | 設定修正 |
| `SHEET_SCHEMA_MISMATCH` | No | repair/upgrade |
| `SHEET_WRITE_FAILED` | Yes | retry |
| `GMAIL_SEARCH_FAILED` | Yes | watermark維持 |
| `GMAIL_READ_FAILED` | Yes | message/thread retry |
| `GMAIL_LABEL_FAILED` | Yes | label reconciliation |
| `AI_UNAVAILABLE` | Yes | retry |
| `AI_HTTP_4XX` | 条件付 | 401/403 No、429 Yes |
| `AI_HTTP_5XX` | Yes | retry |
| `AI_TIMEOUT` | Yes | retry |
| `AI_INVALID_JSON` | Yes | retry |
| `AI_SCHEMA_INVALID` | 条件付 | prompt/configならNo |
| `CALENDAR_NOT_FOUND` | Yes | recreate |
| `CALENDAR_AMBIGUOUS` | No | 手動解決 |
| `CALENDAR_WRITE_FAILED` | Yes | retry |
| `TRIGGER_INSTALL_FAILED` | No | setup再実行/権限確認 |
| `UNKNOWN` | 条件付 | 管理者確認 |

### 16.2 Retry schedule

| attempt | next retry |
|---:|---|
| 1 | 5分後 |
| 2 | 15分後 |
| 3 | 60分後 |
| 3回失敗後 | DEAD、手動再実行のみ |

AI rate limit等で`Retry-After`が取得できる場合は、その値を優先する。

### 16.3 `SYS/失敗`

- スレッドに未解決`RETRY_WAIT`または`DEAD`がある場合に付与。
- 全て解決したら削除。
- 一時的なlock skipでは付与しない。
- run-level Gmail search失敗で個別threadを特定できない場合は付与しない。

### 16.4 ログの粒度

#### 利用者向けHistory

- 成功、警告、失敗の概要。
- どのTaskまたはReviewへ影響したか。
- 本文や認証情報は含めない。

#### 技術ログ

- trace ID
- component
- stage
- error code
- HTTP status
- elapsed
- stackの短縮版
- entity IDのマスク

メールアドレスは可能ならdomainだけ、またはhashを記録する。

### 16.5 Dead Letter再実行

手動操作。

- `再実行`: retryable/non-retryableを問わず管理者が再開。
- `解決`: 外部対応済みとしてRESOLVED。
- `無視`: 理由必須でRESOLVED。
- 同じDead Letterを二重実行しないよう、statusを一時`PROCESSING`へclaimする。

### 16.6 部分失敗

例: Task作成成功、Calendar失敗。

- Message Stateは`RETRY_WAIT`。
- classification JSONとTask IDを保持。
- 再試行ではTaskを再作成せず、Calendar stageから再開。
- labelはTask/Review/Error状態から再構成。
- 全stage完了後だけMessage StateをDONE。

---

## 17. セキュリティ・情報管理

### 17.1 暫定OAuth scopes

`appsscript.json`の候補。最終的には実装後に必要最小権限を確認する。

```json
{
  "timeZone": "Asia/Tokyo",
  "runtimeVersion": "V8",
  "exceptionLogging": "STACKDRIVER",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets.currentonly",
    "https://mail.google.com/",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/script.scriptapp",
    "https://www.googleapis.com/auth/script.container.ui"
  ]
}
```

`[要確認]` GmailAppの利用により広いGmail scopeが必要となる。会社が許可しない場合、Gmail APIを利用した別構成または会社管理バックエンドを検討する。

### 17.2 最小権限

- Sheetは原則current spreadsheetだけ。
- Calendarは専用Calendarだけをアプリ上で操作するが、CalendarApp scope自体の粒度は別途確認。
- Gmailは検索・読取・ラベル操作に必要な範囲。
- Drive/Docs自動生成を初期版へ入れないことでDrive scopeを要求しない。
- NotebookLMはApps Scriptから呼ばない。

### 17.3 保存禁止

次へ認証情報を保存しない。

- Sheetセル
- `.gs`コード
- GitHub
- Google Docs
- History / Dead Letter
- AI prompt

### 17.4 メール本文の保存

- Message Stateへ本文を保存しない。
- Taskへ要約されたタスク名だけ。
- Reviewへ必要最小限の候補・理由だけ。
- AI入力はAPI送信時にメモリ上で生成。
- Debug目的で本文を永続保存するモードを実装しない。

### 17.5 AI送信データ

初期版。

- 件名
- 送信者表示名またはdomain
- 受信日時
- 整形本文
- 直前1～2message
- 同一threadのactive task要約
- today/timezone

除外。

- 添付ファイル
- Gmailの内部認証情報
- 不要なheader
- 全スレッドの無制限本文
- Sheetの他タスク
- Calendar全体

### 17.6 利用者分離

- 各利用者のspreadsheet copyとbound scriptが独立。
- Triggerも本人が作成。
- Script Propertiesもcopy単位。
- 共有Task概要を将来集約する場合、本文、元メールURL、message IDを除く。
- 他利用者のGmailへアクセスしない。

### 17.7 GitHubへ保存しない情報

- 実メール本文
- 実メールアドレス
- 実在案件名・未公表情報
- API key/token
- Google Workspace内のID・URL
- 会社固有の除外sender
- 実ログ

---

## 18. クォータ・性能設計

### 18.1 Apps Script制約への対応

Apps Scriptのクォータ・上限はアカウント種別やGoogleの変更により変わり得る。実装前・本番前に公式クォータページで再確認する。

本仕様の初期安全値。

| 項目 | 設計値 |
|---|---:|
| ソフト実行上限 | 270秒 |
| 最大message/run | 20 |
| 最大thread scan/run | 500 |
| search page size | 100 |
| label batch | 最大100thread単位 |
| trigger数 | 3 |
| AI呼出し | 原則1messageにつき1回 |
| retry処理 | 新着より先に最大10件 |

### 18.2 Sheets書込み

- `setValues()`で複数行を一括書込み。
- 1セルずつ書かない。
- 列mapをrun開始時に1回作成。
- Task ID、origin key、Message IDのindexをrun開始時にメモリへ構築。
- 条件付き書式はsetup/repair時だけ更新。
- Dashboardは数式中心、重い集計はmaintenanceでcacheする。

### 18.3 PropertiesService

Propertiesは小容量設定だけに使用する。

保存しない。

- Message ID一覧
- Task一覧
- classification JSON
- 大量ログ

これらは非表示Sheetへ保存する。

### 18.4 CacheService

任意の性能向上に使用できるが、正本にしない。

候補。

- 列map
- label ID map
- Calendar IDの短期cache
- recent Message ID set

Cache消失時も正しく動作すること。

### 18.5 Message State増加

- 365日保持。
- 日次cleanup。
- 行数警告閾値を設定。
- 50,000行を超えたらperformance warning。
- 100,000行へ近づく場合、月別archive sheetまたは外部storeを検討。
- 未解決errorは保持期間に関係なく残す。

### 18.6 大量メール

- batch sizeを減らさず次runへ繰越す。
- 未処理backlog件数をDashboardへ表示。
- backlogが設定閾値を超えたらWARN。
- AIコストとquotaを超える場合、処理を停止し、利用者へ通知。
- 固定除外を安全に調整する。

### 18.7 APIコスト抑制

- AI呼出し前にMessage ID重複確認。
- 分類JSONを保存し、副作用retryでAI再呼出ししない。
- thread contextを2件に制限。
- 本文20,000文字。
- attachment除外。
- Mock Adapterによる開発。
- low-value自動通知をAI前に固定除外。
- prompt version変更による一括再分類を自動実行しない。

---

## 19. 設定項目一覧

### 19.1 システム設定

| key | 型 | 初期値 | 保存先 | 利用者変更 |
|---|---|---|---|---|
| `TIMEZONE` | String | `Asia/Tokyo` | Script Properties | No |
| `POLL_INTERVAL_MINUTES` | Integer | 5 | Script Properties | 管理者 |
| `MAX_MESSAGES_PER_RUN` | Integer | 20 | Settings | 管理者 |
| `MAX_THREADS_SCANNED_PER_RUN` | Integer | 500 | Settings | 管理者 |
| `GMAIL_SEARCH_PAGE_SIZE` | Integer | 100 | Settings | 管理者 |
| `THREAD_CONTEXT_MESSAGE_COUNT` | Integer | 2 | Settings | 管理者 |
| `EMAIL_BODY_MAX_CHARS` | Integer | 20000 | Settings | 管理者 |
| `AI_ACTION_MAX` | Integer | 10 | Config | No |
| `AUTO_REGISTER_CONFIDENCE` | Number | 0.85 | Settings | 管理者 |
| `REVIEW_CONFIDENCE` | Number | 0.60 | Settings | 管理者 |
| `AUTO_UPDATE_DUE_CONFIDENCE` | Number | 0.90 | Settings | 管理者 |
| `MAX_RETRY_COUNT` | Integer | 3 | Settings | 管理者 |
| `RETRY_DELAYS_MINUTES` | JSON | `[5,15,60]` | Config | No |
| `MESSAGE_STATE_RETENTION_DAYS` | Integer | 365 | Settings | 管理者 |
| `HISTORY_RETENTION_DAYS` | Integer | 365 | Settings | 管理者 |
| `ERROR_LOG_RETENTION_DAYS` | Integer | 90 | Settings | 管理者 |
| `EXECUTION_SOFT_LIMIT_MS` | Integer | 270000 | Config | No |
| `STALE_CLAIM_MINUTES` | Integer | 30 | Settings | 管理者 |
| `DEADLINE_CALENDAR_NAME` | String | `自動期日管理` | Config | No |
| `CALENDAR_DEFAULT_MODE` | Enum | AUTO | Settings | 利用者 |
| `AI_PROVIDER` | Enum | MOCK | Script Properties | 管理者 |
| `AI_MODEL` | String | 未設定 | Script Properties | 管理者 |
| `ACTIVE_PROMPT_VERSION` | String | `task-classifier-v1.0.0` | Script Properties | 管理者 |
| `PROCESSING_ENABLED` | Boolean | FALSE until setup/AI check | Script Properties | 利用者 |
| `TEST_MODE` | Boolean | TRUE during development | Script Properties | 管理者 |
| `GMAIL_BASE_QUERY` | String | `in:inbox ...` | Settings | 管理者 |
| `EXCLUDED_SENDERS` | String list | 空 | Settings | 管理者 |
| `EXCLUDED_SUBJECT_PATTERNS` | String list | 空 | Settings | 管理者 |
| `DOCS_HELP_URL` | URL | 空 | User Properties | 利用者 |
| `NOTEBOOKLM_URL` | URL | 空 | User Properties | 利用者 |

### 19.2 ラベル定数

```javascript
AI_ACTION_REQUIRED = "AI/要対応"
AI_DEADLINE = "AI/期限"
AI_WAITING = "AI/返信待"
AI_REVIEW = "AI/要確認"
MANUAL_IMPORT = "手動/取込"
MANUAL_EXCLUDE = "手動/除外"
SYSTEM_FAILURE = "SYS/失敗"
```

### 19.3 期限相対表現

| 表現 | 初期解釈 |
|---|---|
| 今週中 | 当該週の金曜日 |
| 来週中 | 翌週の金曜日 |
| 来週金曜日 | 翌週の金曜日 |
| 月末 | 暦月末 |
| なるべく早く | ambiguous、Review |
| 早急に | ambiguous、Review |
| 近日中 | ambiguous、Review |
| N営業日以内 | 初期版ではReview |

---

## 20. 実装フェーズ

### Phase 1: 設定・共通型・Mock

- 目的: 実AIなしで全体の型とテスト基盤を作る。
- 対象: `00_Config`, `01_TypesAndSchemas`, `17_Utilities`, `07_AiAdapter(Mock)`。
- 完了条件: Config validation、enum、schema validation、Mock分類。
- 単体テスト: 期限parse、hash、schema valid/invalid。
- 結合テスト: Mock input→classification。
- 次Phase前提: AI以外の依存なし。
- rollback: ファイル差戻し。

### Phase 2: 空シートからUI生成

- 目的: Sheets構成を自動生成。
- 対象: `02_Setup`, `03_SheetSchema`, `Menu`。
- 完了条件: 全タブ、内部ID、metadata、validation、format、protection。
- 単体テスト: 各schema builder。
- 結合テスト: 空Sheetでsetup、再setup。
- 次Phase前提: Sheet schema確定。
- rollback: ダミーspreadsheetを破棄。

### Phase 3: Gmailラベル・Calendar・Properties

- 目的: 外部Googleサービスの初期構築。
- 対象: `02_Setup`, `05_GmailGateway`, `10_CalendarSync`。
- 完了条件: 正式7ラベル、Calendar、instance marker、properties。
- 単体テスト: label map、calendar selection。
- 結合テスト: setup再実行で重複なし。
- rollback: テストアカウントで作成物削除。

### Phase 4: Trigger・診断

- 目的: 自動実行基盤。
- 対象: `12_Triggers`, `16_Diagnostics`。
- 完了条件: 3trigger、重複防止、停止・再開。
- 単体テスト: trigger matcher。
- 結合テスト: setup→trigger一覧。
- rollback: `removeTriggers()`。

### Phase 5: Gmail巡回・Message State

- 目的: AIなしで候補発見・Message ID台帳を完成。
- 対象: `04_MessageStateRepository`, `05_GmailGateway`, `06_EmailPreprocessor`。
- 完了条件: paging、watermark、manual override、dedupe、soft limit。
- 単体テスト: query、strip、stable key。
- 結合テスト: ダミー受信メールをDISCOVERED/IGNOREDへ。
- rollback: processing disabled、Message Stateテスト行削除。

### Phase 6: Mock AI→Task/Review

- 目的: end-to-endを実AIなしで検証。
- 対象: `07_AiAdapter`, `08_TaskRepository`, `09_ReviewRepository`。
- 完了条件: actions[]、auto register、Review、manual fields。
- 単体テスト: action policy。
- 結合テスト: Gmail→Mock→Task/Review。
- rollback: TEST_MODEで対象Taskを削除。

### Phase 7: Calendar同期

- 目的: Taskから重要期限を同期。
- 対象: `10_CalendarSync`。
- 完了条件: create/update/delete/reconcile。
- 単体テスト: decision table。
- 結合テスト: Task編集→event更新。
- rollback: instance tag付きtest event削除。

### Phase 8: 編集トリガー

- 目的: 完了・対象外・期限・Review判断の反映。
- 対象: `11_EditHandler`。
- 完了条件: manual_fields、row version、Calendar連動。
- 単体テスト: event parsing。
- 結合テスト: checkbox、複数cell貼付。
- rollback: edit trigger削除。

### Phase 9: Logs・Dead Letter・Retry

- 目的: 障害耐性。
- 対象: `13_LogAndDeadLetter`。
- 完了条件: error normalize、3回retry、DEAD、手動再実行、SYS/失敗。
- 単体テスト: retry schedule。
- 結合テスト: AI/Calendar故障注入。
- rollback: processing disabled。

### Phase 10: Migration・Maintenance

- 目的: 配布後の更新と保守。
- 対象: `14_Migrations`, `16_Diagnostics`。
- 完了条件: version、migration、cleanup、reconciliation。
- 単体テスト: duplicate migration。
- 結合テスト: v1.0→テストv1.1。
- rollback: backup sheet、version復元。

### Phase 11: 実AI接続

- 目的: 会社承認済みAIへ接続。
- 対象: `07_AiAdapter`の実provider。
- 完了条件: auth、structured output、health check、cost/log。
- 単体テスト: mocked HTTP。
- 結合テスト: 非機密テストメール。
- 次Phase前提: セキュリティ承認。
- rollback: `AI_PROVIDER=MOCK`、`PROCESSING_ENABLED=FALSE`。

### Phase 12: 配布・利用者支援

- 目的: 他利用者が自力導入。
- 対象: Docs、Help、NotebookLMリンク、配布テキスト。
- 完了条件: 新規利用者が手引書だけでsetup完了。
- 結合テスト: 別アカウントで再現。
- rollback: trigger停止、copy削除。

---

## 21. テスト計画

### 21.1 機能テスト

| ID | ケース | 入力 | 期待結果 |
|---|---|---|---|
| T-001 | 明示期限あり依頼 | 「7月31日までに返信」 | Task、期限、AI/要対応・AI/期限、条件次第Calendar |
| T-002 | 期限なし依頼 | 「確認してください」 | Task、期限なし、Calendarなし |
| T-003 | 相対期限 | 「来週中」 | 翌週金曜、basis=relative |
| T-004 | 曖昧期限 | 「なるべく早く」 | Review、正式期限なし |
| T-005 | AI推測期限 | 業務内容だけ | suggestedのみ、Calendarなし |
| T-006 | 期限変更 | 明確な新期限 | 条件満足なら更新、それ以外Review |
| T-007 | 過去日への期限変更 | 過去日 | Review |
| T-008 | 依頼取消 | 「対応不要」 | CANCEL候補Review |
| T-009 | 完了通知 | 「対応済みです」 | COMPLETE候補Review |
| T-010 | 返信待ち | 明確な待ち状態 | WAITING候補 |
| T-011 | 返信待ち解除 | 相手回答 | target明確なら解除 |
| T-012 | 追加依頼 | 同一threadで別依頼 | 新Task |
| T-013 | 1message複数依頼 | 2つの作業 | actions 2件、Task 2件 |
| T-014 | 単なる共有 | FYI | INFORMATION_ONLY |
| T-015 | ニュースレター | 定型配信 | 固定除外またはTaskなし |
| T-016 | Calendar招待通知 | 自動通知 | 原則除外 |
| T-017 | 日本語 | 日本語本文 | 正常分類 |
| T-018 | 英語 | 英語本文 | 正常分類 |
| T-019 | 日英混在 | bilingual | 原文保持、正常分類 |
| T-020 | 長文 | 30,000文字 | 20,000文字へ切詰め、flag |
| T-021 | 引用大量 | 長い過去引用 | 新着本文中心 |
| T-022 | 手動/取込 | 過去thread | setup前でも処理 |
| T-023 | 手動/除外 | 新着thread | Task作成なし |
| T-024 | 補正両方 | 取込＋除外 | 除外優先 |
| T-025 | 完了check | TRUE | DONE、event削除 |
| T-026 | 対象外check | TRUE | EXCLUDED、event削除 |
| T-027 | 期限手動変更 | 日付編集 | manual_fields追加、event更新 |
| T-028 | Calendar FORCE | 普通の返信期限 | 利用者確定期限なら登録 |
| T-029 | Calendar NONE | 重要期限 | eventなし・既存削除 |
| T-030 | Calendar event手動変更 | event日付変更 | maintenanceでSheets値へ復元 |

### 21.2 冪等性・競合テスト

| ID | ケース | 期待結果 |
|---|---|---|
| I-001 | 同じMessageを2回処理 | Task・Review・Event重複なし |
| I-002 | 同じclassificationを再適用 | origin keyでNOOP |
| I-003 | worker同時起動 | 片方がlock skip |
| I-004 | editとworker競合 | row version/manual fieldsで保護 |
| I-005 | setup再実行 | data消失・構成重複なし |
| I-006 | repair再実行 | data不変 |
| I-007 | trigger再install | 3件を超えない |
| I-008 | Calendar event ID消失 | tagで再照合または再作成 |
| I-009 | classification後にTask書込み失敗 | AI再呼出しなしでretry |
| I-010 | Task成功・Calendar失敗 | Task重複なし、Calendar stage再開 |

### 21.3 エラーテスト

| ID | ケース | 期待結果 |
|---|---|---|
| E-001 | AI 429 | RETRY_WAIT、5/15/60分 |
| E-002 | AI 500 | retry |
| E-003 | AI timeout | retry |
| E-004 | AI invalid JSON | 厳格再要求1回、その後retry |
| E-005 | AI invalid schema | Reviewまたはconfig error |
| E-006 | Gmail権限失効 | AUTH_REQUIRED、再承認 |
| E-007 | Gmail search失敗 | watermark維持 |
| E-008 | Sheets schema破損 | SHEET_SCHEMA_MISMATCH、repair案内 |
| E-009 | Calendar削除 | 再作成・再同期 |
| E-010 | Calendar同名複数 | CALENDAR_AMBIGUOUS、手動選択 |
| E-011 | Trigger上限 | setup失敗、診断表示 |
| E-012 | 3回失敗 | DEAD、SYS/失敗、手動再実行 |
| E-013 | 実行soft limit | 残件次回、state破損なし |
| E-014 | stale CLAIMED | 30分後retry対象 |
| E-015 | quota超過 | 次回繰越し、無限loopなし |

### 21.4 Setup・Migrationテスト

| ID | ケース | 期待結果 |
|---|---|---|
| S-001 | 完全な空Sheet | 全構成生成 |
| S-002 | タブ一部あり | 不足だけ作成 |
| S-003 | 表示名変更 | metadataで発見・修復 |
| S-004 | 内部列削除 | 不足列追加、既存data保持 |
| S-005 | 入力規則破損 | repair |
| S-006 | setup途中Calendar失敗 | 再実行で継続 |
| S-007 | migration再実行 | 二重適用なし |
| S-008 | migration途中失敗 | version進まず |
| S-009 | Calendar名称変更 | IDで継続 |
| S-010 | 他利用者copy | 本人権限で独立setup |

### 21.5 確認対象

各テストで最低限確認する。

- 対象Gmailラベル。
- タスク一覧。
- 要確認。
- メール状態。
- Calendar event。
- 処理履歴。
- エラー・再実行。
- Properties。
- Trigger一覧。

---

## 22. 受入基準

### 22.1 初期構築

- 空のGoogle Sheetsへコードを貼付し、`setupSystem()`だけで全タブ・書式・入力規則・metadata・正式7ラベル・専用Calendar・3triggerを再現できる。
- 再実行しても既存Taskが消えず、ラベル、Calendar、triggerが重複しない。
- setup途中で失敗しても、再実行で安全に継続できる。
- `diagnoseSystem()`が不足・重複・権限問題を特定できる。

### 22.2 Gmail処理

- 新着受信Messageを原則5分triggerで候補化できる。
- 既読・未読に関係なくMessage IDで未処理判定できる。
- 同じMessageを複数回走査してもTask・Reviewが重複しない。
- 同一threadの新着Messageを別処理できる。
- `手動/除外`が`手動/取込`とAI判定より優先される。
- AIラベルがTask・Review・Errorの現在状態へ整合する。

### 22.3 AI・Task

- Structured Outputを検証し、無効JSONを適用しない。
- 1message複数actionを別Taskまたは別更新として扱える。
- AI推測期限を正式期限へ自動登録しない。
- AIによる完了・取消を人の確認なしに確定しない。
- 人間が編集した列をAIが上書きしない。
- 信頼度閾値により自動登録・要確認・非登録が分かれる。

### 22.4 Calendar

- 明示・許容相対期限かつ重要期限だけがAUTO登録される。
- 同一Taskのeventを重複作成しない。
- 期限変更が既存eventへ反映される。
- 完了、対象外、取消でeventが削除される。
- Calendar消失・event消失を自己修復できる。
- Calendar側の手動変更が正本にならない。

### 22.5 障害・保守

- 一時エラーを最大3回再試行できる。
- 部分失敗後、成功済み副作用を重複させず続きから再開できる。
- 最大回数超過がDead Letterへ残り、手動再実行できる。
- `SYS/失敗`が未解決errorに同期する。
- Message State 365日、History 365日、解決済みerror 90日の清掃が動作する。
- 実行時間上限へ近づいたら安全に繰越す。

### 22.6 配布・情報管理

- 別利用者が手引書だけで導入できる。
- 利用者本人の権限でtriggerが動く。
- 実データ、メール本文、認証情報がGitHubまたは個人PCへ保存されない。
- API keyをセルやコードへ埋め込まない。
- Docs・NotebookLMへの導線がSheetsから利用できる。

---

## 23. 未解決事項

実装設計上の合理的な事項は本仕様書で補完済みとし、次だけを会社環境確認事項として残す。

1. 利用可能なAI接続方式。
2. 認証方式。
3. 課金主体・利用上限。
4. 外部AIへ送信できるメール情報の範囲。
5. AI側のデータ保持・学習利用・監査条件。
6. Gmailの広いOAuth scopeの承認可否。
7. サブカレンダー作成権限。
8. UrlFetchによる外部通信制限。
9. Apps Scriptの利用者・トリガー・実行クォータに関する社内制限。
10. 他メンバーへコードテキストを持ち込む方法と管理者ポリシー。
11. Script Propertiesへのcredential保存可否。原則は会社管理認証を推奨。
12. 本番メール量に基づく`MAX_MESSAGES_PER_RUN`とAIコストの再調整。
13. 会社の休日を含む営業日計算を将来実装するか。

---

## 24. 運用手順の要約

### 24.1 初回導入

```text
空のGoogle Sheetsを作成
  ↓
Apps Scriptコードを貼付
  ↓
appsscript.jsonを設定
  ↓
setupSystem()を実行
  ↓
OAuth権限を承認
  ↓
システム診断
  ↓
Mock Adapterでテスト
  ↓
会社承認済みAIへ切替
  ↓
PROCESSING_ENABLED=true
```

### 24.2 日常運用

- タスク一覧で完了・対象外をチェック。
- 必要に応じて期限、優先度、Calendar登録を修正。
- 要確認で受入・却下。
- エラー・再実行で恒久エラーを確認。
- Gmailでは必要時だけ`手動/取込`または`手動/除外`を使用。

### 24.3 障害時

- 自動処理を停止。
- 診断を実行。
- OAuth、AI health、Calendar ID、triggerを確認。
- Dead Letterを確認。
- 原因修正後、手動再実行。
- 正常化後、自動処理を再開。

---

## 25. 疑似コード集

### 25.1 1Message処理

```javascript
function processOneMessage(candidate, traceId, budget) {
  const state = claimMessage(candidate, traceId);
  if (!state.claimed) return;

  const manual = inspectManualLabels(candidate.thread);
  if (manual.exclude) {
    finalizeMessage(candidate.messageId, "IGNORED_MANUAL");
    reconcileThreadLabels(candidate.stableThreadKey);
    return;
  }

  const aiInput = buildAiInput(
    candidate.message,
    candidate.thread,
    findActiveTasks(candidate.stableThreadKey)
  );

  let classification = state.classificationJson
    ? parseStoredClassification(state.classificationJson)
    : classifyEmailWithAi(aiInput);

  classification = validateAiClassification(classification);
  saveClassification(candidate.messageId, classification);

  markMessageState(candidate.messageId, "APPLYING");

  classification.actions.forEach((action, index) => {
    const context = {
      originKey: candidate.messageId + "#" + index,
      actionIndex: index,
      stableThreadKey: candidate.stableThreadKey,
      traceId
    };
    applyActionByPolicy(action, context, manual);
  });

  reconcileThreadLabels(candidate.stableThreadKey);
  finalizeMessage(candidate.messageId, "DONE");
}
```

### 25.2 Action policy

```javascript
function applyActionByPolicy(action, context, manual) {
  if (manual.exclude) return markIgnored(context);

  if (manual.import && action.action_type === "INFORMATION_ONLY") {
    return createReviewItem(forceImportReview(action), context);
  }

  switch (action.action_type) {
    case "NEW_TASK":
    case "ADD_TASK":
      return action.confidence >= AUTO_REGISTER_CONFIDENCE &&
             !action.needs_review
        ? upsertTask(action, context)
        : createReviewItem(action, context);

    case "UPDATE_DUE":
      return canAutoUpdateDue(action, context)
        ? upsertTask(action, context)
        : createReviewItem(action, context);

    case "SET_WAITING":
    case "CLEAR_WAITING":
      return canAutoUpdateStatus(action, context)
        ? upsertTask(action, context)
        : createReviewItem(action, context);

    case "MARK_COMPLETE":
    case "CANCEL_TASK":
    case "UNCLEAR":
      return createReviewItem(action, context);

    case "INFORMATION_ONLY":
      return markInformationOnly(context);

    default:
      throw new AppError("AI_SCHEMA_INVALID");
  }
}
```

### 25.3 Calendar同期

```javascript
function syncDeadlineCalendar(taskId) {
  const task = getTaskById(taskId);
  const decision = evaluateCalendarDecision(task);

  if (decision === "DELETE") {
    deleteEventIfExists(task);
    return updateTaskCalendarStatus(taskId, "DELETED");
  }

  if (decision === "NONE") {
    return updateTaskCalendarStatus(taskId, "NONE");
  }

  const calendar = createOrGetDeadlineCalendar();
  let event = findEventByStoredId(task.calendarEventId);

  if (!event) {
    event = findEventByTaskTag(calendar, task.taskId);
  }

  if (!event) {
    event = calendar.createAllDayEvent(
      buildCalendarTitle(task),
      task.dueDate,
      { description: buildCalendarDescription(task) }
    );
  } else {
    applyTaskToEvent(event, task);
  }

  tagEvent(event, task);
  saveCalendarEventId(taskId, event.getId());
}
```

### 25.4 Thread label reconciliation

```javascript
function reconcileThreadLabels(stableThreadKey) {
  const thread = resolveCurrentGmailThread(stableThreadKey);
  if (!thread) return;

  const summary = aggregateThreadState(stableThreadKey);

  setSystemLabel(thread, LABELS.AI_ACTION_REQUIRED, summary.hasActionRequired);
  setSystemLabel(thread, LABELS.AI_DEADLINE, summary.hasOpenDeadline);
  setSystemLabel(thread, LABELS.AI_WAITING, summary.hasWaiting);
  setSystemLabel(thread, LABELS.AI_REVIEW, summary.hasOpenReview);
  setSystemLabel(thread, LABELS.SYSTEM_FAILURE, summary.hasUnresolvedError);

  // 手動/*は変更しない
}
```

---

## 26. `appsscript.json`暫定例

```json
{
  "timeZone": "Asia/Tokyo",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets.currentonly",
    "https://mail.google.com/",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/script.scriptapp",
    "https://www.googleapis.com/auth/script.container.ui"
  ]
}
```

最終scopeは実装・会社ポリシー確認後に最小化する。

---

## 27. 公式仕様の確認先

実装時点で最新内容を再確認する。

- Apps Script installable triggers  
  https://developers.google.com/apps-script/guides/triggers/installable
- Apps Script simple triggers  
  https://developers.google.com/apps-script/guides/triggers
- Apps Script quotas  
  https://developers.google.com/apps-script/guides/services/quotas
- Gmail service  
  https://developers.google.com/apps-script/reference/gmail
- GmailApp  
  https://developers.google.com/apps-script/reference/gmail/gmail-app
- GmailLabel  
  https://developers.google.com/apps-script/reference/gmail/gmail-label
- GmailMessage  
  https://developers.google.com/apps-script/reference/gmail/gmail-message
- GmailThread  
  https://developers.google.com/apps-script/reference/gmail/gmail-thread
- Spreadsheet service  
  https://developers.google.com/apps-script/reference/spreadsheet
- Developer Metadata  
  https://developers.google.com/apps-script/reference/spreadsheet/developer-metadata
- Data Validation  
  https://developers.google.com/apps-script/reference/spreadsheet/data-validation-builder
- Conditional Formatting  
  https://developers.google.com/apps-script/reference/spreadsheet/conditional-format-rule-builder
- Protection  
  https://developers.google.com/apps-script/reference/spreadsheet/protection
- Calendar service  
  https://developers.google.com/apps-script/reference/calendar
- CalendarApp  
  https://developers.google.com/apps-script/reference/calendar/calendar-app
- CalendarEvent  
  https://developers.google.com/apps-script/reference/calendar/calendar-event
- PropertiesService  
  https://developers.google.com/apps-script/reference/properties/properties-service
- LockService  
  https://developers.google.com/apps-script/reference/lock/lock-service
- ClockTriggerBuilder  
  https://developers.google.com/apps-script/reference/script/clock-trigger-builder
- Gemini structured output  
  https://ai.google.dev/gemini-api/docs/structured-output

---

## 28. 最終結論

本仕様書に基づく初期版は、次を実装基準とする。

- Apps Script本体は新規実装する。
- AI自動分類と人間補正の単一構成とする。
- Message IDを処理の正本とする。
- Gmailラベルはスレッド状態の投影とする。
- Sheetsをタスクの正本とする。
- Calendarは重要期限だけを表示する。
- AI完了・取消は人の確認を必須とする。
- 1メッセージ複数actionへ対応する。
- Saga、冪等性、Lock、Dead Letterを初期版から実装する。
- 空のSheetsからsetup、repair、upgradeを再現可能にする。
- 実AI接続は会社環境の承認後に有効化する。
- 配布時は各利用者が自分のOAuth権限で構築する。

以上を満たした時点で、Apps Script本体の実装へ移行できる。
