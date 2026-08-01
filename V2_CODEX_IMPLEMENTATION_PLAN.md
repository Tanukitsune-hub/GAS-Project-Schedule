# Google Workspace Personal Work OS v2 Codex実装計画

- 文書版: 0.9.0-draft
- 作成日: 2026-07-23
- Project ID: `google-workspace-personal-work-os`
- 対象Repository: `Tanukitsune-hub/context-hub`
- 対象Directory: `projects/google-workspace-personal-work-os/`
- 実装先: `projects/google-workspace-personal-work-os/apps-script-v2/`
- 基準タイムゾーン: `Asia/Tokyo`
- 想定実装者: Codex
- 状態: Codex投入用Draft。正本4ファイルを変更する文書ではない
- 同時に読む文書: `V2_IMPLEMENTATION_SPEC.md`

## 1. 文書の目的

本書は、`V2_IMPLEMENTATION_SPEC.md`をCodexが安全かつ段階的に実装するための作業順、成果物、受入基準、停止条件、報告形式を定める。

Codexは本書を一括実装の依頼として扱わない。Phaseごとに最小の縦方向機能を実装し、テストと受入証跡を残し、GateがPASSした場合だけ次のPhaseへ進む。

本計画の初期Phase 1～8は、GmailからTaskを抽出し、Google Sheetsの`タスク一覧`へ冪等に反映し、重要な正式期限だけを専用Calendarへ同期する機能を対象とする。

旧「Googleスケジュール管理システム」の会議、出張、作業ブロック、日次ブリーフ、週次レビュー、面談前後処理、Docs・Drive・NotebookLM連携は、初期基盤の安定後にPhase 9以降として再評価する。初期実装へ混在させない。

## 2. Codexの実行契約

Codexは、各作業開始時に次を実施する。

1. Repositoryと現在Branchを確認する
2. 未コミット変更の有無を確認する
3. 正本4ファイルと本書、詳細仕様書を読む
4. 現在対象のPhaseを1つに限定する
5. 変更対象ファイルとテスト項目を先に列挙する
6. 実装する
7. 自動テストと静的確認を実施する
8. Google Workspace上でのみ可能な手動テストを明示する
9. 変更内容、テスト結果、未解決事項、情報管理確認を報告する
10. Gateが未達の場合は次Phaseへ進まない

Codexが行ってはならないこと。

- v1.xコードをコピーして修正する
- Review Queueを再作成する
- 独立したManualモードを実装する
- 旧`OS/`ラベルを使用する
- v1→v2直接Migrationを実装する
- 正本4ファイルを利用者の明示確認なしに変更する
- 実際のSpreadsheet ID、Calendar ID、Gmail Message ID、内部URLをコミットする
- API key、password、token、credentialをコード、Sheet、Docs、GitHubへ保存する
- 実メール本文、添付資料、個人情報、未公表情報をfixture、log、commitへ含める
- メールを自動送信する
- メインCalendarのEventを自動作成、変更、削除する
- RuntimeからSchema、列順、入力規則、書式、Protectionを修復する
- DiagnosticからDashboard更新、全行書換え、全Event同期、Gmail全検索を実行する
- 一括でPhase 1～8を実装する
- 未確認のGoogle API、AI Provider、認証方式、model IDを捏造する
- テスト未実施の機能を完成扱いする

## 3. 読む順番と優先順位

Codexは次の順番で読む。

1. `CURRENT_STATUS.md`
2. `DECISIONS.md`
3. `PROJECT_CONTEXT.md`
4. `MASTER_PLAN.md`
5. `AUTOMATED_DEADLINE_MANAGER_DESIGN.md`
6. `INITIAL_IMPLEMENTATION_DEFAULTS.md`
7. `PROTOTYPE_V1_LESSONS_LEARNED.md`
8. `NAMING_AND_GMAIL_LABELS.md`
9. `V2_IMPLEMENTATION_SPEC.md`
10. 本書

矛盾時の優先順位。

1. より新しいDecision
2. `CURRENT_STATUS.md`の明示的訂正
3. `PROJECT_CONTEXT.md`
4. `MASTER_PLAN.md`
5. v2詳細設計と既定値
6. 本書と詳細実装仕様書
7. v1以前の資料

矛盾を発見した場合、Codexは都合のよい解釈で進めない。`implementation_report.md`相当の報告に、矛盾する記述、採用した上位文書、保留した論点を記録する。

## 4. 実装対象のDirectoryと完成形

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

完成時の`apps-script-v2/README.md`は、少なくとも次を含む。

- 本システムの目的
- v1非互換であること
- 必要なGoogle Workspace権限
- 新しい空のSpreadsheetへ導入する手順
- `clasp`を使う場合の安全な手順
- Setupの段階と再開方法
- Mock試験方法
- 自動処理の開始・停止方法
- Quick Diagnosticの実行方法
- Dead Letterの確認・再実行方法
- 本番AI開始前の承認事項
- 既知の制約
- 会社情報をGitHubへ保存しない注意

## 5. 実装の全体依存関係

```text
Phase 0 仕様・作業環境確認
  ↓
Phase 1 Sheets基盤・Setup・TaskRepository最小版
  ↓
Phase 2 Gmail手動取込・Message State
  ↓
Phase 3 Mock AI縦フロー・同一行Review
  ↓
Phase 4 重要期限Calendar同期
  ↓
Phase 5 会社承認済み実AI Adapter
  ↓
Phase 6 5分自動ポーリング
  ↓
Phase 7 Retry・Dead Letter・診断・Dashboard
  ↓
Phase 8 配布・別環境受入
  ↓
Phase 9以降 スケジュール管理拡張
```

Phase 1～4はMockで実装・検証できる。Phase 5以降の外部AIと本番自動処理は、会社承認済みの接続方式、認証、データ保持、課金、OAuth・UrlFetch制限が確認されるまでFeature FlagをOFFとする。

## 6. Branch、commit、PRの単位

推奨Branch名。

| Phase | Branch |
| --- | --- |
| 0 | `docs/work-os-v2-spec-baseline` |
| 1 | `feat/work-os-v2-phase-1-foundation` |
| 2 | `feat/work-os-v2-phase-2-gmail-ingest` |
| 3 | `feat/work-os-v2-phase-3-mock-task-flow` |
| 4 | `feat/work-os-v2-phase-4-calendar-sync` |
| 5 | `feat/work-os-v2-phase-5-ai-adapter` |
| 6 | `feat/work-os-v2-phase-6-polling` |
| 7 | `feat/work-os-v2-phase-7-operations` |
| 8 | `docs/work-os-v2-phase-8-distribution` |

commit例。

```text
feat(work-os-v2): implement phase 1 sheet foundation
feat(work-os-v2): add phase 2 Gmail message state flow
feat(work-os-v2): add phase 3 mock classification and task review
feat(work-os-v2): add phase 4 deadline calendar outbox
test(work-os-v2): add phase 4 calendar idempotency fixtures
docs(work-os-v2): add phase 8 deployment and acceptance guide
```

1つのPRへ複数Phaseを混在させない。Phase内で複数commitを作る場合も、Schema変更、Runtime変更、テスト追加を識別できる単位にする。

Codexは、利用者が明示していない限りcommit、push、PR作成を自動実行しない。変更内容とテスト結果を示し、Git操作は依頼された範囲に限定する。

## 7. 全Phase共通のGate

各Phaseは次をすべて満たすまでPASSにしない。

```text
[ ] Phase対象外の機能を追加していない
[ ] 仕様書と正本に矛盾しない
[ ] 変更ファイル一覧を記録した
[ ] Unit testがPASSした
[ ] Integration fixtureがPASSした
[ ] 同じ入力の再実行で重複がない
[ ] 実行時間またはsoft budget条件を満たした
[ ] Setup再実行で既存データを壊さない
[ ] v1環境、未知の非空Sheetを破壊せず停止する
[ ] Runtimeからレイアウト修復を呼ばない
[ ] Logs、fixture、commitに機密情報がない
[ ] 実ID、内部URL、credentialがない
[ ] 手動確認が必要な項目を未実施のままPASSにしていない
[ ] 受入証跡を保存した
[ ] 既知の未解決事項を記録した
```

Gate判定は`PASS`、`CONDITIONAL PASS`、`FAIL`のいずれかとする。

- `PASS`: 自動・手動の必須項目がすべて合格
- `CONDITIONAL PASS`: Google Workspace実環境等の外部確認だけが未実施。次Phaseのコード作成は可能だが、本番開始は不可
- `FAIL`: 仕様違反、データ破壊、重複、実行時間超過、情報管理違反、主要テスト未実施

## 8. Phase 0: 仕様Baselineと実装環境確認

### 8.1 目的

実装前提を固定し、Codexがv1資料や古い議論へ引き戻されない状態を作る。

### 8.2 作業

- 正本4ファイルとv2補助資料を読む
- `V2_IMPLEMENTATION_SPEC.md`と本書の存在を確認する
- Repository内にv2コードが既にあるか確認する
- v1コードを参照専用と識別する
- 現行Branch、未コミット変更、競合する作業を確認する
- 実装先Directoryが未存在ならPhase 1で新規作成する
- Google Workspaceでの手動受入を行う担当と記録方法を文書化する
- 外部AIの承認状況を`未確認 / 利用不可 / 利用可能 / 管理者確認必要`で記録する
- 正本の未解決事項を作業Backlogへ転記するが、勝手に決定しない

### 8.3 成果物

- 実装前確認レポート
- 競合・矛盾一覧
- Phase 1変更予定ファイル一覧
- Phase 1テスト一覧

### 8.4 受入基準

- v1コードをコピーしない方針が明示されている
- Review Queue、Manualモード、旧ラベルを作らないことが確認されている
- Phase 1を阻害する重大な仕様矛盾がない
- 実AI未確認でもPhase 1～4をMockで進める方針が維持されている
- 正本4ファイルを変更していない

## 9. Phase 1: 最小Sheets基盤、Setup、TaskRepository

### 9.1 目的

新しい空のGoogle Sheetsから、最小のv2 Schemaと日本語UIを安全に構築し、synthetic Mock Taskを3行目付近へ冪等にupsertできる状態を作る。

### 9.2 対象ファイル

```text
00_Config.gs
01_TypesAndSchemas.gs
02_Setup.gs
03_SheetBuilder.gs
08_TaskRepository.gs
14_Migrations.gs
16_Diagnostics.gs
17_Utilities.gs
99_TestHarness.gs
Menu.gs
appsscript.json
README.md
.clasp.json.example
```

`15_Dashboard.gs`、`04`～`13`、`18_Worker.gs`は空ファイルを先に作らない。必要なPhaseで作成する。ファイル一覧を一括生成する場合でも、未実装functionが利用可能に見えないよう明確なstubとFeature Flagを使用する。

### 9.3 実装項目

#### 9.3.1 ConfigとEnum

- System name、code version、schema version
- Timezone `Asia/Tokyo`
- Sheet名、内部列ID、表示見出し
- Task status、review、deadline basis、priority、calendar mode等のEnum
- 初期行数と追加行単位
- soft budget
- Feature Flag。初期値は自動処理OFF、AI Provider MOCK
- 正式GmailラベルとCalendar名は定数として定義するが、Phase 1では外部作成しない

#### 9.3.2 Types and Schemas

- Task、Message State、Sync State、AI input/output、AppErrorのJSDoc
- 行1内部列IDと行2日本語見出しのSchema定義
- 表示値と内部Enumの双方向mapping
- Validation定義
- Schema version
- 列ID重複、見出し不足、型不一致の検証関数

#### 9.3.3 Setup foundation

Phase 1ではSetup stageのうち次を実装・テストする。

```text
S00_VALIDATE_ENV
S10_CREATE_SHEETS
S20_CREATE_SCHEMAS
S30_APPLY_SMALL_VALIDATIONS
S40_SEED_SAFE_SETTINGS
S70_STORE_PROPERTIES
S80_CREATE_EDIT_TRIGGER
S90_QUICK_DIAGNOSTICのSheets/Properties部分
```

`S50_CREATE_GMAIL_LABELS`はPhase 2、`S60_CREATE_DEADLINE_CALENDAR`はPhase 4で実装する。最終的なstage順は仕様書どおりとし、Phase途中では未実装stageを完了扱いしない。

CodexはPhase 1だけのためにstage順を恒久変更しない。TestHarnessは個々のstage functionを直接検証できるようにする。公開`setupSystem()`は未実装stageに到達した場合、破壊的操作をせず`SETUP_STAGE_NOT_IMPLEMENTED`を安全に報告する。

#### 9.3.4 Sheet構築

- 利用者向け6タブ
- 非表示管理4タブ
- 行1内部ID、行2日本語見出し
- 行3以降データ
- 初期行数100、設定50
- 入力規則は必要な初期範囲だけ
- 空行へBoolean値を投入しない
- 大量Protectionを作らない
- 管理列は右側、原則非表示
- コメント列等のString列にCheckbox Validationを付けない
- Sheet作成、Schema、Validation、Seedを分離する
- 同一実行内の列Mapはメモリ上で保持する

#### 9.3.5 TaskRepository最小版

- 行1から内部列Mapを作る
- `task_id`または`origin_key`のある行だけをTaskとする
- 主キー列の最初の論理空行を探す
- 行不足時だけ100行追加する
- `getLastRow()`をTask追記位置に使わない
- `origin_key`と`task_id`のindexを1回の読取で作る
- synthetic Taskのinsert/upsert
- 同じ`origin_key`の再実行で行を増やさない
- `row_version`初期値と更新
- phase 1ではGmail、AI、Calendarへ接続しない

#### 9.3.6 Migrations

- `14_Migrations.gs`はv2将来Migrationのinterfaceとversion管理だけ
- v1→v2 migrationを実装しない
- v1検出時は明示エラーと新規Sheet案内
- migration履歴、code version、schema versionを別管理する設計にする

#### 9.3.7 Quick Diagnostic最小版

- 必須Sheet
- 内部列ID
- Properties
- edit trigger
- Schema version
- Validation型
- 空行Boolean値の有無
- 論理Task件数

外部Gmail、Calendar、AIはPhase 1では`NOT_YET_IMPLEMENTED`として扱い、診断FAILにしない。ただし未実装を`PASS`と表示しない。

### 9.4 自動テスト

| ID | Test | 期待結果 |
| --- | --- | --- |
| P1-U01 | 内部列ID重複検出 | 明示エラー |
| P1-U02 | 表示値→内部Enum | 正しい変換 |
| P1-U03 | 内部Enum→表示値 | 正しい変換 |
| P1-U04 | 論理空行検索 | 3行目または最初の空主キー行 |
| P1-U05 | `FALSE`だけの空行 | Taskとして読まない |
| P1-U06 | 同一origin key upsert | 行数増加なし |
| P1-U07 | 行不足 | 100行単位で追加 |
| P1-U08 | v1 Sheet検出 | 停止し変更なし |
| P1-U09 | 未知の非空Sheet | 停止し変更なし |
| P1-U10 | Setup再実行 | Sheet/列重複なし |
| P1-U11 | Comment列Validation | Checkboxでない |
| P1-U12 | 空行Boolean | 値は空 |
| P1-U13 | Code/Schema/Migration version | 別項目で保持 |
| P1-U14 | redaction utility | credential様文字列を除去 |

### 9.5 Google Workspace手動受入

- 新しい空のSpreadsheetで各stageを実行する
- 既定Sheetが`ダッシュボード`へ安全にrenameされる
- 10タブが正しい順・表示/非表示で作成される
- `タスク一覧`のTaskが3行目付近へ追加される
- コメント列へ文字入力できる
- 空行Checkboxが空表示である
- setup再実行後も既存synthetic Taskが残る
- v1検証用Sheetまたは未知の非空Sheetでは停止し、データを変更しない
- Quick Diagnosticが60秒以内で、TaskやDashboardを書き換えない

### 9.6 Phase 1 Gate

```text
[ ] setup foundationがsoft limit 120秒以内
[ ] 3行目付近へTask追加
[ ] 空行FALSEなし
[ ] コメント列Checkboxなし
[ ] getLastRowによるTask追記なし
[ ] 同一origin keyで重複なし
[ ] setup再実行でデータ破損なし
[ ] v1/未知Sheetを破壊せず停止
[ ] Quick Diagnosticが読取中心
[ ] Gmail、AI、Calendar副作用なし
```

## 10. Phase 2: Gmail手動取込とMessage State

### 10.1 目的

`手動/取込`付き最新Messageを限定的に取得し、Message ID単位で重複を防ぎ、本文を永続保存せずに処理stageを管理できる状態を作る。

### 10.2 対象ファイル

```text
04_MessageStateRepository.gs
05_GmailGateway.gs
06_EmailPreprocessor.gs
12_Triggers.gs
13_LogAndDeadLetter.gs
18_Worker.gs
02_Setup.gs
16_Diagnostics.gs
99_TestHarness.gs
Menu.gs
README.md
```

Phase 2の`18_Worker.gs`は手動取得とMessage State checkpointまでを担当し、AI分類とTask upsertはPhase 3で接続する。

### 10.3 実装項目

#### 10.3.1 Setup stage S50

- 正式Gmailラベル7個を不足分だけ作成
- 旧ラベルを削除・renameしない
- `手動/取込`と`手動/除外`を人間補正として扱う
- Setup再実行でラベル重複なし
- setup stageをPropertiesへ冪等に保存

#### 10.3.2 GmailGateway

- Message IDを処理単位にする
- Thread IDと先頭Message IDを取得する
- Stable Thread Keyはスレッド先頭Message ID
- 手動試験queryは`手動/取込`を必須とする
- 通常Inboxを検索しない
- 最大10 thread、処理Message最大1
- `手動/除外`を最優先する
- spam、trashを除外
- 既読・未読を判定に使用しない
- 取得順を決定的にする
- Task/Calendarへ直接書かない
- 人間ラベルを削除しない

#### 10.3.3 Preprocessor

- 件名、送信者、受信時刻、本文、直前1～2 Messageを正規化
- HTMLではなくplain textを優先
- 引用・署名の除去は保守的に行う
- 本文上限20,000文字
- `content_hash`を生成する
- 本文、完全な宛先、添付内容をSheet/Logへ保存しない
- 元メールURLはTask作成時までin-memoryで扱う。永続化は仕様上許可された列だけ
- 添付ファイル解析を行わない

#### 10.3.4 Message State

状態。

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

Phase 2で実装する遷移。

```text
DISCOVERED → CLAIMED → PREPROCESSED
```

- Message ID一意
- Script Lock待機5秒
- claimにrun_id、claimed_at
- stale claim 30分
- retry_count、resume_stage
- safe metadataとcontent hash
- bodyは保存しない
- 同一Message再取得時に新規rowを作らない
- Message State indexを1回の読取で作る

#### 10.3.5 Manual worker

公開entry point例。

```javascript
function processManualImportOnce() {}
```

Phase 2では次まで。

```text
Lock
→ 設定読込
→ Message State index
→ 手動ラベルMessage探索
→ 未処理Message claim
→ preprocess
→ PREPROCESSED checkpoint
→ 安全終了
```

Phase 3でAI、Task、Calendarを接続する。Phase 2の完了報告でTaskが作成されないことを欠陥扱いしない。

### 10.4 自動テスト

| ID | Test | 期待結果 |
| --- | --- | --- |
| P2-U01 | 同一Message IDのclaim | 1件だけ |
| P2-U02 | stale claim未満 | 再claim不可 |
| P2-U03 | stale claim超過 | 再claim可能 |
| P2-U04 | manual message上限 | 1件 |
| P2-U05 | unread/read差異 | 処理結果同じ |
| P2-U06 | 手動/除外 | SKIPPED |
| P2-U07 | content hash | 同じ本文で同じ値 |
| P2-U08 | 20,000文字超過 | 安全にtruncate |
| P2-U09 | log payload | 本文なし |
| P2-U10 | label ensure再実行 | 重複なし |
| P2-U11 | Stable Thread Key | 先頭Message ID |
| P2-U12 | soft limit到達 | 新規claim停止 |

### 10.5 Google Workspace手動受入

- 架空内容の自分宛てテストメールへ`手動/取込`を付ける
- 既読状態と未読状態の両方で取得できる
- 最新1MessageだけがPREPROCESSEDになる
- 同じ実行を繰り返してもMessage Stateが増えない
- `手動/除外`を同時付与するとTask候補処理へ進まない
- Gmail本文が`メール状態`、`処理履歴`、Execution Logへ残らない
- 手動workerが120秒soft limit内に安全終了する

### 10.6 Phase 2 Gate

```text
[ ] 正式7ラベルのみ作成
[ ] 旧ラベルを変更しない
[ ] 通常Inbox検索なし
[ ] 最新1Messageに限定
[ ] Message ID重複なし
[ ] 既読/未読非依存
[ ] Stable Thread Key取得
[ ] 本文を永続保存しない
[ ] 手動/除外最優先
[ ] PREPROCESSED checkpointから再開可能
```

## 11. Phase 3: Mock AI縦フロー、Task upsert、同一行Review

### 11.1 目的

Gmail MessageをMock Adapterで決定的に`actions[]`へ分類し、Taskを冪等に作成・更新し、曖昧候補と既存変更候補を`タスク一覧`の同一行で受入・却下できる縦フローを完成させる。

### 11.2 対象ファイル

```text
07_AiAdapter.gs
08_TaskRepository.gs
09_TaskReviewPolicy.gs
11_EditHandler.gs
13_LogAndDeadLetter.gs
18_Worker.gs
01_TypesAndSchemas.gs
04_MessageStateRepository.gs
05_GmailGateway.gs
06_EmailPreprocessor.gs
16_Diagnostics.gs
99_TestHarness.gs
Menu.gs
README.md
```

### 11.3 実装項目

#### 11.3.1 Provider-neutral interface

```javascript
class AiAdapter {
  healthCheck() {}
  classify(input) {}
}
```

- `MockAiAdapter`を初期default
- Provider固有処理をTaskRepositoryへ混在させない
- AI input/outputをSchema validationする
- 余分なfield、型不正、Action上限超過、fabricated Task IDを拒否する
- raw responseをLogへ保存しない
- AI classification JSONを副作用前に安全な構造でMessage Stateへ保存する

#### 11.3.2 Mock fixture

少なくとも次の明示markerを決定的に処理する。

```text
[MOCK:NEW_HIGH]
[MOCK:NEW_REVIEW]
[MOCK:MULTI]
[MOCK:UPDATE_DUE]
[MOCK:MARK_COMPLETE]
[MOCK:CANCEL]
[MOCK:WAITING]
[MOCK:CLEAR_WAITING]
[MOCK:INFO]
[MOCK:UNCLEAR]
[MOCK:TRANSIENT_ERROR]
```

同じinputは同じJSONを返す。Mockは自由な自然言語解析を行わない。

#### 11.3.3 AI action

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

- 1Message最大10 Action
- `origin_key = sha256(source_message_id + ":" + source_action_index)`
- 新規Task IDは実装側が発行する
- AIが未知のTask IDを返した場合は自動適用しない
- 同一Stable Thread KeyのActive Taskが複数なら更新候補を要確認にする

#### 11.3.4 Confidence policy

- 0.85以上、warningなし、競合なし、安全な新規Action: 自動OPEN
- 0.60以上0.85未満: REVIEW
- 0.60未満: 原則登録なし。ただし明示期限等はREVIEW
- MARK_COMPLETE、CANCEL_TASK、過去日、期限削除、手動編集競合、対象Task曖昧は必ずReview
- AI推測期限は`suggested_due_date`だけ
- AI推測期限を正式`due_date`またはCalendar対象にしない

#### 11.3.5 TaskRepository拡張

- 1実行でTask indexを1回読込
- `task_id`、`origin_key`、Stable Thread Key index
- new/upsert/update pending
- `row_version`による楽観競合確認
- `manual_fields`を尊重
- Taskの現在状態をAIが無断で上書きしない
- management columnsを列IDで操作
- Task行だけにBoolean値を投入
- Message Stateを`CLASSIFIED`、`TASKS_WRITTEN`へcheckpoint

#### 11.3.6 同一行Review

新規候補。

```text
status=REVIEW
needs_review=true
decision=UNSELECTED
review_state=OPEN
review_type=NEW_TASK
```

受入。

```text
status=OPEN
needs_review=false
decision=ACCEPT
review_state=APPLIED
```

却下。

```text
status=EXCLUDED
excluded=true
needs_review=false
decision=REJECT
review_state=REJECTED
```

既存Task変更候補。

```text
statusは維持
needs_review=true
pending_action_type
pending_changes_json
review_state=OPEN
decision=UNSELECTED
```

受入時だけpending変更を適用し、却下時は現在Taskを変えずpendingを消す。

#### 11.3.7 EditHandler

- installable onEditの対象を`タスク一覧`の利用者編集可能列へ限定
- 単一セル/小範囲を処理し、全行scanしない
- 利用者が編集したfieldを`manual_fields`へ追加
- `完了`、`対象外`、`返信待ち`、`対応状況`の矛盾を決定的に正規化
- `判断`の受入・却下を適用
- `row_version`を増加
- editからGmail/AIを呼ばない
- Phase 4まではCalendar Outboxをstubにする

### 11.4 自動テスト

| ID | Test | 期待結果 |
| --- | --- | --- |
| P3-U01 | NEW_HIGH | OPEN |
| P3-U02 | NEW_REVIEW | REVIEW |
| P3-U03 | MULTI | action数分、origin key別 |
| P3-U04 | 同じMessage再実行 | Task行増加なし |
| P3-U05 | UPDATE_DUE | 現状維持＋pending |
| P3-U06 | MARK_COMPLETE | 自動DONEにしない |
| P3-U07 | CANCEL | 自動CANCELLEDにしない |
| P3-U08 | 受入 | pending適用 |
| P3-U09 | 却下 | pending破棄、現状維持 |
| P3-U10 | 手動due編集後のAI変更 | conflict Review |
| P3-U11 | UNKNOWN target Task ID | 自動適用しない |
| P3-U12 | Active Task複数 | Review |
| P3-U13 | AI推測期限 | suggestedのみ |
| P3-U14 | schema extra field | validation error |
| P3-U15 | Action 11件 | validation error |
| P3-U16 | INFORMATION_ONLY | Taskなし、DONE |
| P3-U17 | TRANSIENT_ERROR | RETRY |
| P3-U18 | EditHandler小範囲 | 全行scanなし |

### 11.5 Google Workspace手動受入

- `[MOCK:NEW_HIGH]`で通常Taskが作成される
- `[MOCK:NEW_REVIEW]`で同じ`タスク一覧`に要確認Taskが作成される
- 別のReview Queueタブが作られない
- 判断=`受入`でOPEN、`却下`でEXCLUDEDになる
- `[MOCK:MULTI]`で複数Taskが作成される
- 同じMessageを再実行してもTaskが重複しない
- 期限変更、完了、取消がpending経路になる
- 利用者が手動編集した期限をAIが上書きしない
- Message StateがDONEまたはCalendar未接続の安全な完了状態になる
- GmailのAIラベルが仕様どおり付くが、人間ラベルは削除されない

### 11.6 Phase 3 Gate

```text
[ ] Gmail→Mock→Taskの最小縦フロー完成
[ ] Review Queueなし
[ ] 新規Reviewを同一行で受入・却下
[ ] 既存変更をpending管理
[ ] 完了・取消を無承認確定しない
[ ] manual_fields競合を保護
[ ] origin keyでTask重複なし
[ ] AI推測期限を正式期限にしない
[ ] Schema validationを副作用前に実施
[ ] Mockが決定的
```

## 12. Phase 4: 重要期限Calendar同期

### 12.1 目的

要確認を通過した重要な正式期限だけを、専用Calendar`自動期日管理`へ終日Eventとして冪等にcreate/update/deleteする。

### 12.2 対象ファイル

```text
10_CalendarSync.gs
11_EditHandler.gs
18_Worker.gs
02_Setup.gs
04_MessageStateRepository.gs
08_TaskRepository.gs
13_LogAndDeadLetter.gs
16_Diagnostics.gs
99_TestHarness.gs
Menu.gs
README.md
```

### 12.3 実装項目

#### 12.3.1 Setup stage S60

- 名前`自動期日管理`のCalendarを検索
- 本instanceが保存したCalendar IDを優先
- 同名複数のときは自動選択せず停止
- 存在しない場合だけ新規作成
- Calendar IDをPropertiesへ保存
- メインCalendarを対象にしない
- Setup再実行で重複Calendarを作らない

Phase 4完了時にSetup stage S00～S99を通せる状態にする。

#### 12.3.2 登録条件

すべてを満たすTaskだけ。

- `needs_review=false`
- `review_state`がOPENではない
- `due_date`あり
- `deadline_basis=EXPLICIT`または採用済み`RELATIVE`
- DONE、EXCLUDED、CANCELLEDではない
- `calendar_sync_mode`が対象
- `calendar_importance`が閾値以上
- AI推測期限だけではない

#### 12.3.3 Event contract

- 終日Event
- タイトル: `【期限】{task_title}`
- 説明: Task ID、期限根拠、送信者、元メールURL、system marker
- Task IDとinstance IDをEvent tagまたは説明markerへ含める
- descriptionへメール本文、機密情報を入れない
- `calendar_event_id`をTaskへ保存
- `同期状態`へdesired actionを保存

#### 12.3.4 Outbox

```text
CREATE
UPDATE
DELETE
NONE
```

- Task正本更新と外部Calendar更新を分離
- EditHandler/Workerはdesired actionをOutboxへ投入
- CalendarSyncがOutboxを処理
- create成功後にEvent ID保存
- update/deleteは保存済みEvent IDを優先
- Eventが見つからない場合は安全に再createまたは解決不能としてReview
- Calendar失敗時にAIを再実行しない
- `TASKS_WRITTEN → CALENDAR_PENDING → DONE`
- Calendar不要なら`TASKS_WRITTEN → DONE`

#### 12.3.5 Delete条件

- 完了
- 対象外
- 取消
- Calendar対象外へ変更
- 正式期限削除
- 要確認へ戻った

### 12.4 自動テスト

| ID | Test | 期待結果 |
| --- | --- | --- |
| P4-U01 | eligible Task | CREATE |
| P4-U02 | AI suggestedのみ | NONE |
| P4-U03 | Review中 | NONE |
| P4-U04 | Event既存・期限変更 | UPDATE |
| P4-U05 | DONE | DELETE |
| P4-U06 | EXCLUDED | DELETE |
| P4-U07 | CANCELLED | DELETE |
| P4-U08 | create再実行 | Event重複なし |
| P4-U09 | Calendar失敗 | CALENDAR_PENDING/RETRY |
| P4-U10 | retry | AI再実行なし |
| P4-U11 | 同名Calendar複数 | 停止 |
| P4-U12 | メインCalendar | 変更なし |
| P4-U13 | description redaction | 本文/credentialなし |
| P4-U14 | timezone境界 | 正しい終日日付 |

### 12.5 Google Workspace手動受入

- 専用Calendarが1つだけ作成される
- 明示重要期限Taskから終日Eventが作成される
- 同じTaskを再同期してもEventが増えない
- 期限変更で同じEventが更新される
- Task完了・対象外・取消でEventが削除される
- 要確認中、推測期限、返信待ちだけのTaskは登録されない
- メインCalendarのEventが変更されない
- Calendar API失敗後、保存済みclassificationから再開する
- SetupがS99まで完了する

### 12.6 Phase 4 Gate

```text
[ ] 専用Calendarだけを操作
[ ] create/update/delete冪等
[ ] 同一TaskのEvent重複なし
[ ] AI推測期限は登録しない
[ ] Review中は登録しない
[ ] terminal statusで削除
[ ] Calendar失敗でAI再実行なし
[ ] Setup S99完了
[ ] メインCalendar変更なし
```

## 13. Phase 5: 会社承認済み実AI Adapter

### 13.1 開始条件

次を確認できるまで実装を本番接続しない。

- 正式に利用可能なAI Provider
- 認証方式
- Google Cloud projectまたはProxy
- 課金主体、model ID、利用上限
- 入力データ保持、学習利用、監査条件
- Apps ScriptからのUrlFetchまたはService利用可否
- OAuth scopeと管理者制限
- secret保存方法
- 非機密テストデータの許可

未確認の場合、CodexはAdapter interface、configuration validation、`NOT_CONFIGURED` health resultまで実装し、架空endpointやcredentialを作らない。

### 13.2 目的

Mockと同じinput/output契約を守るProvider Adapterを追加し、非機密fixtureでStructured Output、timeout、429、5xx、invalid JSON、schema violationを検証する。

### 13.3 対象ファイル

```text
07_AiAdapter.gs
01_TypesAndSchemas.gs
13_LogAndDeadLetter.gs
18_Worker.gs
16_Diagnostics.gs
99_TestHarness.gs
00_Config.gs
README.md
appsscript.json
```

### 13.4 実装項目

- Adapter factory
- Provider-specific request builder
- timeout
- retryable/non-retryable分類
- 429、5xx、network error
- JSON抽出とstrict Schema validation
- Semantic validation
- Provider/model/prompt version記録
- token/credential redaction
- Prompt version管理
- healthCheck
- Feature Flag
- Mock default維持
- 実AIへの切替は明示設定
- Providerが未設定なら安全に停止
- 本文以外の不要データを送らない
- 添付、Calendar全体、他スレッド、Logs、Dead Letterを送らない

### 13.5 テスト

| ID | Test | 期待結果 |
| --- | --- | --- |
| P5-U01 | adapter未設定 | NOT_CONFIGURED |
| P5-U02 | valid structured response | schema PASS |
| P5-U03 | invalid JSON | retryable判定規則どおり |
| P5-U04 | extra field | reject |
| P5-U05 | 429 | RETRY |
| P5-U06 | 5xx | RETRY |
| P5-U07 | 4xx auth | non-retryableまたは設定エラー |
| P5-U08 | timeout | RETRY |
| P5-U09 | fabricated Task ID | Review/Reject |
| P5-U10 | credential in error | redacted |
| P5-U11 | 20,000 chars | limit維持 |
| P5-U12 | Mock切戻し | 即時利用可能 |

### 13.6 Gate

- 会社承認確認前は`automation_enabled=false`、`ai_provider=MOCK`
- 実AI結果がMockと同じSchemaを満たす
- Error時に本文やsecretをLogへ出さない
- 非機密メールで手動実行が安定する
- Providerを切り替えてもTaskRepositoryを変更しない
- 不明な仕様を捏造していない

## 14. Phase 6: 5分自動ポーリング

### 14.1 目的

Quick Diagnostic合格後に利用者が明示操作した場合だけ、5分time-driven triggerを作成し、小さなbatchでInbox候補を処理する。

### 14.2 対象ファイル

```text
12_Triggers.gs
18_Worker.gs
05_GmailGateway.gs
04_MessageStateRepository.gs
13_LogAndDeadLetter.gs
16_Diagnostics.gs
15_Dashboard.gs
99_TestHarness.gs
Menu.gs
README.md
```

### 14.3 実装項目

- `startAutomation()`
- `stopAutomation()`
- `processAutomaticBatch()`
- 本instanceのtrigger ID保存
- trigger重複防止
- 他instance/他利用者triggerを削除しない
- automation初期値OFF
- Quick Diagnostic合格必須
- watermarkから1日戻したoverlap検索
- 最終重複判定はMessage ID
- Inbox受信メール
- spam、trash、promotions、social、明らかなnewsletter、Calendar自動通知の除外
- 固定条件だけで業務メールを広く除外しない
- 検索最大100 thread、処理最大10 Message
- page size 25
- automatic soft budget 210秒
- soft limit到達前に新規claimを停止
- 安全なcheckpointで終了
- 残件を次回へ繰越し
- triggerは作成者アカウント権限で動作することをREADMEへ記載
- 手動/除外、手動/取込、人間ラベルの優先順位を維持

### 14.4 テスト

- watermark overlapでMessageを取りこぼさない
- overlapで同じMessageを取得しても重複しない
- 10件上限
- 210秒soft budget
- trigger重複なし
- stopで本instance triggerだけ削除
- automation OFF時は処理なし
- Quick Diagnostic FAIL時は開始不可
- promotions/social除外
- 手動/取込優先
- 途中error後に次回resume
- 2回の同時実行をLockで排他
- stale claim回収

### 14.5 Gate

- 5分triggerを明示開始でのみ作成
- 自動処理初期OFF
- time budget超過前に安全終了
- Messageの取りこぼし・重複がない
- 本instance以外のtriggerを変更しない
- 作成者権限とQuota制約が説明されている
- 少数batchで継続可能

## 15. Phase 7: Retry、Dead Letter、Diagnostic、Dashboard

### 15.1 目的

障害時の再開性、運用可視性、軽量診断、明示更新Dashboardを完成させる。

### 15.2 対象ファイル

```text
13_LogAndDeadLetter.gs
16_Diagnostics.gs
15_Dashboard.gs
18_Worker.gs
04_MessageStateRepository.gs
10_CalendarSync.gs
11_EditHandler.gs
99_TestHarness.gs
Menu.gs
README.md
```

### 15.3 Retry

- 最大3回
- 間隔5分、15分、60分
- `retry_count`
- `next_retry_at`
- `resume_stage`
- `error_code`
- `last_error_at`
- 3回後DEAD
- retryable/non-retryable分類
- AI分類済みなら再分類しない
- Task書込済みなら同じorigin keyでupsert
- Calendarだけ失敗ならOutboxから再開
- 手動再実行は対象Message/Outboxを明示選択
- Dead Letter行から本文やcredentialを復元しようとしない

### 15.4 Logs

- timestamp
- level
- run_id
- stage
- event_code
- message_id hashまたは許容ID
- task_id
- duration_ms
- result
- retryable
- safe_message
- details_jsonのallow-list

禁止。

- Gmail本文
- AI raw prompt/response
- Authorization header
- API key/token
- 完全なHTTP request/response body
- 添付内容
- 未公表情報

### 15.5 Quick Diagnostic

60秒以内を目標とし、次だけを確認する。

- 必須Sheet
- 内部列ID
- Validation型
- Properties
- Gmail label
- Calendar ID
- edit/worker trigger
- AI Adapter health
- automation state
- Schema/code version
- unresolved Dead Letter件数

行わない。

- repair
- Dashboard refresh
- Task全行再計算
- Calendar全同期
- Gmail全検索
- AI classification
- Migration

### 15.6 Deep Diagnostic

明示実行のみ。読取中心。項目別にsoft budgetと中断点を持つ。Quick Diagnosticから自動実行しない。

### 15.7 Dashboard

- 明示メニューまたは日次低頻度triggerで更新
- Workerごとの更新なし
- OPEN、REVIEW、OVERDUE、TODAY、WAITING、DEAD件数
- 個別Task全行を書き換えず集計
- Dashboardは正本にしない
- Dashboard failureでTask workerを失敗にしない

### 15.8 retention

初期既定値。

- Task: 自動削除なし
- Message State: 365日
- 処理履歴: 365日
- 解決済みエラー: 90日

会社規程が異なる場合は規程を優先し、未確認の自動削除を開始しない。

### 15.9 Error injection test

- AI transient error
- Gmail temporary error
- Sheet write failure
- row version conflict
- Calendar create failure
- Calendar update failure
- invalid configuration
- stale claim
- lock timeout
- soft budget exhaustion
- schema mismatch
- auth failure

### 15.10 Gate

- 失敗stageから重複なく再開
- 3回後Dead Letter
- Calendar failureでAI再実行なし
- Quick Diagnostic 60秒以内
- Diagnosticが書換えない
- DashboardがWorkerを重くしない
- Logに機密情報なし
- 主要errorをTestHarnessで注入可能

## 16. Phase 8: 配布、別環境受入、運用文書

### 16.1 目的

新しい別Google Workspaceアカウントまたは検証環境で、手引書だけから安全に再現し、初期v2の完成条件を確認する。

### 16.2 成果物

- `apps-script-v2/README.md`完成版
- `使い方`Sheetの内容
- Setup手順
- Mock受入手順
- 実AI承認checklist
- automation開始・停止手順
- Quick Diagnostic手順
- Dead Letter再実行手順
- rollback手順
- 権限・Quota・Triggerの説明
- 情報管理checklist
- 既知の制約
- versioning/migration方針
- Phase 8受入記録

### 16.3 別環境受入

- 新しい空のSpreadsheet
- コード導入
- OAuthは利用者本人が承認
- setup
- Mock test email
- Task create/review/update
- Calendar create/update/delete
- retry injection
- automation開始/停止
- Quick Diagnostic
- setup再実行
- credential/IDのRepository非保存確認

### 16.4 Security acceptance

- GitHubへ実ID、内部URL、実メール本文がない
- `.clasp.json`がcommitされない
- `.clasp.json.example`はplaceholderだけ
- Script Properties利用が会社規程に適合
- Providerの保持・学習条件を確認
- OAuth scopeが必要最小
- 共有範囲を変更しない
- メール自動送信なし
- メインCalendar変更なし
- Docs正本自動上書きなし

### 16.5 初期v2 Definition of Done

```text
[ ] 新しい空のSheetからsetup完了
[ ] Taskが3行目付近へ入る
[ ] 空行FALSEなし
[ ] コメント列Checkboxなし
[ ] Message/Task/Event重複なし
[ ] Review Queueなし
[ ] 同一行で受入・却下
[ ] 完了・取消・重要変更は人間確認
[ ] 重要な正式期限だけCalendar同期
[ ] Mock縦フロー合格
[ ] Quick Diagnostic 60秒以内
[ ] manual 120秒、auto 210秒soft budget
[ ] retryが保存stageから再開
[ ] setup再実行でデータ破損なし
[ ] Logsに機密情報なし
[ ] 別環境で手引書だけから再現
[ ] 実AI・automationは会社承認後に明示開始
```

## 17. Phase 9以降: Googleスケジュール管理システム拡張

Phase 9以降は初期v2完成後の候補であり、本書の作成だけでは採用Decisionにならない。各拡張は別Decision、別仕様、別Gateを必要とする。

### 17.1 Phase 9A: 日次ブリーフ

- `タスク一覧`とCalendarをread-only集計
- 今日、期限超過、要確認、返信待ち、当日会議を表示
- メール自動送信なし
- Dashboardまたは専用Docへの出力は別Decision
- Workerとは別trigger
- failureがTask処理へ影響しない

### 17.2 Phase 9B: 週次レビュー

- 完了、期限超過、翌週期限、長期返信待ち、Dead Letterのread-only集計
- statusを自動変更しない
- 人の週次確認を補助
- 正本Docsを無承認で上書きしない

### 17.3 Phase 9C: 作業ブロック

- 通常Taskから自動でメインCalendarを埋めない
- 利用者の明示操作または確認済みrequestだけ
- deadline Eventとは別のevent typeとID
- 作業時間、開始時刻、duration、timezoneを明示
- 既存会議と競合する場合は自動移動せず候補提示
- Eventの自動削除・再配置は人間確認
- 初期実装ではメインCalendarはread-onlyまたは明示操作限定

### 17.4 Phase 9D: 面談前後

- Calendar eventとProjectの関連づけ
- 面談前は関連Task、Docs、Driveリンク、過去Meeting Notesのread-only取得
- 面談後は議事録、Task、返信文の候補作成
- メール自動送信なし
- Project Context、Decision Log、Meeting Noteの正本を自動上書きしない
- AI提案は候補として保存し、人が採用する

### 17.5 Phase 9E: Docs、Drive、NotebookLM

- GitHubとGoogle Docsの正本関係を案件ごとに明確化
- 実データ、内部URL、秘密情報をGitHubへ保存しない
- NotebookLMをApps Script自動実行エンジンにしない
- NotebookLMは人による根拠付き検索・分析
- 共有権限を自動変更しない
- File削除、大量移動を自動実行しない

### 17.6 拡張前の必須条件

- 初期v2のPhase 8 GateがPASS
- 重複率、誤検知率、review滞留、Calendar同期errorを一定期間観測
- メインCalendar書込方針をDecisionで確定
- 会議・作業ブロックのsource of truthを確定
- Docs更新の承認フローを確定
- 情報管理部門の条件を確認
- 拡張がTask workerの実行時間へ影響しない設計

## 18. TestHarnessの実装方針

### 18.1 Test分類

```text
runUnitTests()
runSchemaTests()
runRepositoryTests()
runReviewPolicyTests()
runMessageStateTests()
runMockAdapterTests()
runCalendarPolicyTests()
runErrorInjectionTests()
runSecurityRedactionTests()
runPhaseAcceptanceTests(phase)
```

Apps Script上で外部副作用を伴うtestは、明示的な`TEST_MODE`と専用fixture resourceだけを使う。通常のmain Calendar、実メール、実Taskを使わない。

### 18.2 Test結果

`99_TestHarness.gs`は次を返す。

```json
{
  "run_id": "TEST-...",
  "phase": 3,
  "started_at": "ISO-8601",
  "finished_at": "ISO-8601",
  "passed": 24,
  "failed": 0,
  "skipped": 2,
  "tests": [
    {
      "id": "P3-U01",
      "status": "PASS",
      "duration_ms": 12,
      "safe_message": ""
    }
  ]
}
```

Test結果に実メール本文、実ID、credentialを含めない。

### 18.3 Static check

Codexがローカルで実行可能な範囲。

- brace/parenthesis syntax
- duplicate global function名
- forbidden term scan
- `getLastRow()`のTask append利用
- `setValue(false)`の空行事前投入
- raw credential pattern
- `.clasp.json`の追跡
- v1 file copy
- Review Queue/Manual mode/旧OS label
- physical column numberの業務ロジック直書き
- RuntimeからSheetBuilder呼出し
- DiagnosticからDashboard/repair呼出し
- Calendarのdefault Calendar呼出し
- Gmail本文のLog出力

例。

```bash
find projects/google-workspace-personal-work-os/apps-script-v2 -name '*.gs' -print0 \
  | xargs -0 -I{} sh -c 'node --check < "{}"'

grep -RInE 'Review Queue|OS/TODO取込|Manual mode|期日管理/' \
  projects/google-workspace-personal-work-os/apps-script-v2

grep -RInE 'API[_-]?KEY\s*=|Authorization: Bearer|BEGIN PRIVATE KEY' \
  projects/google-workspace-personal-work-os/apps-script-v2
```

検索結果は0件であるべきものと、文書上の説明として許容するものを区別する。

## 19. 手動受入用synthetic test email

実会社名、実案件名、実人物名を使わない。

| ID | Subject例 | Body marker | 期待 |
| --- | --- | --- | --- |
| M-01 | テスト資料提出 | `[MOCK:NEW_HIGH] 2026/8/31までにテスト資料を提出` | OPEN＋正式期限 |
| M-02 | 確認が必要 | `[MOCK:NEW_REVIEW] 来月頃に確認` | REVIEW |
| M-03 | 複数依頼 | `[MOCK:MULTI]` | 2件以上、origin key別 |
| M-04 | 期限変更 | `[MOCK:UPDATE_DUE]` | pending |
| M-05 | 完了連絡 | `[MOCK:MARK_COMPLETE]` | pending、無断DONEなし |
| M-06 | 取消連絡 | `[MOCK:CANCEL]` | pending、無断CANCELなし |
| M-07 | 返信待ち | `[MOCK:WAITING]` | waiting候補 |
| M-08 | 情報のみ | `[MOCK:INFO]` | Taskなし |
| M-09 | 一時障害 | `[MOCK:TRANSIENT_ERROR]` | RETRY |
| M-10 | 除外 | M-01相当＋`手動/除外` | SKIPPED |

## 20. 実行時間と性能証跡

各Phase報告に次を含める。

| Metric | 条件 |
| --- | --- |
| Setup stage duration | stage別 |
| Quick Diagnostic | 60秒以内目標 |
| Manual worker | 120秒soft budget |
| Automatic worker | 210秒soft budget |
| Gmail messages/run | manual 1、auto 10 |
| Search threads | manual 10、auto 100 |
| Lock wait | 5秒 |
| Stale claim | 30分 |
| AI actions/message | 最大10 |
| Sheet reads | 設定、Task index、Message Stateは原則各1回 |
| Sheet writes | まとめて実行 |
| Row expansion | 100行単位 |

Google Workspace実環境で測定できない場合、Codexは未測定と明記する。推測値を実測扱いしない。

## 21. リスクと停止条件

| リスク | 検知 | 対応 |
| --- | --- | --- |
| v1 Sheetへ誤setup | v1名/version marker | 変更せず停止 |
| 未知の非空Sheet | S00 validation | 変更せず停止 |
| 物理最終行誤認 | logical row test | 主キー列で判定 |
| 空行FALSE | validation/value test | Data Validationだけ |
| duplicate Task | origin key | upsert |
| duplicate Event | Event ID/Task marker | update |
| concurrent worker | Lock/claim | 排他 |
| AI hallucinated Task ID | Task index照合 | Review/Reject |
| AI無断完了・取消 | Action policy | pending Review |
| Calendarだけ失敗 | Outbox stage | Calendarから再開 |
| execution timeout | soft budget | checkpoint |
| credential leak | static/redaction test | commit禁止 |
| real data fixture | review scan | syntheticへ置換 |
| external AI未承認 | health/config gate | Mock維持 |
| trigger重複 | saved trigger ID | ensure one |
| main Calendar変更 | Calendar ID check | 専用のみ |
| scope creep | Phase file list | 次Phaseへ延期 |

即時停止条件。

- 実データやcredentialがGit差分へ入った
- v1または未知Sheetを変更した
- メインCalendarを変更した
- Task/Event重複が発生した
- Review Queueが作られた
- AI完了・取消が無承認で確定した
- setupまたはworkerがhard timeoutへ達した
- 正本4ファイルとの重大な矛盾が判明した
- 会社承認前に実AIへ情報を送信した

停止後は原因、影響範囲、変更されたresource、復旧手順を報告し、勝手に続行しない。

## 22. Rollback方針

### 22.1 Code

- Phaseごとにcommitを分離
- 前PhaseのPASS commitをtagまたはSHAで記録
- rollbackはコード差分だけを戻す
- Schema/dataのrollbackをコードrollbackへ混在させない

### 22.2 Sheets

- setupは新しい空のSpreadsheetだけ
- 既存Taskを削除しない
- Phase 1～4で破壊的migrationなし
- 不完全stageはPropertiesで再開
- Schema変更が必要になった場合はPhase 8後に正式Migrationを設計
- 手動で列を削除・移動して復旧しない

### 22.3 Gmail

- 既存メールを削除・変更しない
- 人間ラベルを削除しない
- AIラベルのrollbackは対象を明示した補助functionに限定
- 処理済み判定をラベルへ依存しない

### 22.4 Calendar

- 本instanceが作った専用Calendar Eventだけ
- Task ID/system markerで所有Eventを確認
- main Calendarを変更しない
- Event削除前にTask正本状態を確認
- Calendar全削除や一括再作成を通常rollbackにしない

## 23. CodexのPhase完了報告テンプレート

```markdown
# Phase N 実装報告

## 1. 結論
- Gate: PASS / CONDITIONAL PASS / FAIL
- 実装範囲:
- 未実装範囲:

## 2. 参照した正本
- CURRENT_STATUS:
- DECISIONS:
- PROJECT_CONTEXT:
- MASTER_PLAN:
- 補助仕様:

## 3. 変更ファイル
| Path | Change | Reason |
| --- | --- | --- |

## 4. 実装内容
-

## 5. 自動テスト
| Test ID | Result | Evidence |
| --- | --- | --- |

## 6. Google Workspace手動テスト
| Test | Result | Evidence / 未実施理由 |
| --- | --- | --- |

## 7. 性能
| Metric | Result | Limit |
| --- | ---: | ---: |

## 8. 情報管理確認
- 実データなし:
- credentialなし:
- 実IDなし:
- Log redaction:
- OAuth scope:

## 9. 既知の制約・未解決
-

## 10. 次Phaseへ進む条件
-
```

テストを実施できなかった場合、`PASS`と書かない。未実施理由と必要な手動操作を記載する。

## 24. Codexへの初回投入Prompt

次のPromptを、本書と`V2_IMPLEMENTATION_SPEC.md`をRepositoryへ置いた状態で使用する。

```text
Tanukitsune-hub/context-hub の
projects/google-workspace-personal-work-os/
を対象に、Google Workspace Personal Work OS v2のPhase 1だけを実装してください。

最初に次をこの順番で読んでください。

1. CURRENT_STATUS.md
2. DECISIONS.md
3. PROJECT_CONTEXT.md
4. MASTER_PLAN.md
5. AUTOMATED_DEADLINE_MANAGER_DESIGN.md
6. INITIAL_IMPLEMENTATION_DEFAULTS.md
7. PROTOTYPE_V1_LESSONS_LEARNED.md
8. NAMING_AND_GMAIL_LABELS.md
9. V2_IMPLEMENTATION_SPEC.md
10. V2_CODEX_IMPLEMENTATION_PLAN.md

実装範囲はV2_CODEX_IMPLEMENTATION_PLAN.mdのPhase 1だけです。
Phase 2以降、実AI接続、通常Inbox検索、Calendar同期は実装しないでください。

必須条件:

- v1コードをコピーしない
- 新しい空のGoogle Sheetsだけを対象にする
- Review Queueを作らない
- 独立したManualモードを作らない
- Task追記位置にgetLastRow()を使わない
- 空行へFALSEを事前投入しない
- 物理列番号ではなく内部列IDを使う
- Setup、Runtime、Diagnostic、Migrationを分離する
- setup再実行で既存Taskを壊さない
- v1または未知の非空Sheetは変更せず停止する
- API key、token、実ID、実メール、内部URLを保存しない
- 正本4ファイルを変更しない
- 自動処理は初期OFF
- TEST_MODEのsynthetic fixtureだけを使う

作業前に、変更予定ファイルとテスト計画を示してください。
その後、Phase 1を実装し、自動テストを実行してください。
Google Workspace上でしか実行できないテストは、未実施と明記し、具体的な手順を示してください。

最後に、本計画の「CodexのPhase完了報告テンプレート」に従って報告してください。
Gateが未達なら次Phaseへ進まないでください。
commit、push、PR作成は明示依頼がない限り行わないでください。
```

## 25. Phase 2以降のCodex再投入ルール

次Phaseを依頼するときは、前Phaseのcommitまたは変更一式と、Phase完了報告をCodexへ読ませる。

Promptの冒頭。

```text
前Phase NのGateがPASSしていることを確認してください。
PASSでない場合はPhase N+1を実装せず、未達項目だけを修正してください。

今回の実装範囲はV2_CODEX_IMPLEMENTATION_PLAN.mdのPhase N+1だけです。
正本4ファイル、V2_IMPLEMENTATION_SPEC.md、前Phase報告を読んでください。
```

各Phaseで同じ原則を繰り返す。

- 現在Phaseだけ
- 変更予定とtest planを先に提示
- 実装
- 自動test
- 手動testの明示
- 情報管理確認
- Gate判定
- 次Phaseへ自動進行しない

## 26. 正本への反映ルール

本仕様書と実装計画はCodex用の補助文書であり、それ自体でDecisionを追加・変更しない。

実装または受入により、次が利用者によって確定した場合だけ正本更新候補とする。

- Schemaの正式確定
- 状態遷移の変更
- Provider、認証、modelの正式採用
- 自動処理batchの正式値
- retentionの正式値
- 営業日・相対期限ルール
- Phase 9拡張の採用
- v1 Task migrationの要否

正本更新時は、内容に応じて次へ反映する。

| 内容 | 正本 |
| --- | --- |
| 目的・前提・制約 | `PROJECT_CONTEXT.md` |
| 現行設計・Phase | `MASTER_PLAN.md` |
| 判断と理由 | `DECISIONS.md` |
| 実装状況・次作業・未解決 | `CURRENT_STATUS.md` |

Codexは、会話中の案や自動生成した提案を確定事項として正本へ書かない。
