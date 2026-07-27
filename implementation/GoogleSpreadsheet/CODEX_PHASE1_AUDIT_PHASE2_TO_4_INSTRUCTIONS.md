# Codex実行指示：Phase 1監査およびPhase 2〜4実装

## Goal

現在開いている`GoogleSpreadsheet`リポジトリで、既存のPhase 1実装を独立かつ厳格に検査し、必要な修正を行ったうえで、Phase 2からPhase 4までを段階的に実装・検証する。

今回の作業範囲は次のとおり。

```text
Phase 1 Audit
既存実装の独立検査・修正・Regression

Phase 2
Gmail手動取込・Message State

Phase 3
Mock AI縦フロー・Task Review Policy

Phase 4
Calendar同期

Phase 5以降
今回の対象外
```

各Phaseを一括実装しないこと。

各Phaseについて、仕様確認、実装、テスト、独立レビュー、修正、Regression、Phase Gate判定を完了し、Gateを通過した場合だけ次のPhaseへ進むこと。

Phase 4完了後はPhase 5へ進まず停止すること。

---

## 1. 対象Repository

今回の作業対象は、現在開いている次のRepository。

```text
GoogleSpreadsheet
```

最初に必ず次を確認する。

```bash
pwd
git rev-parse --show-toplevel
git status --short
git branch --show-current
```

`.git`が存在しない場合は、その事実を記録する。

`.git`が存在しないこと自体は作業停止条件ではない。ただし、次を行わない。

- 新たなGit Repositoryの初期化
- commit
- push
- PR作成
- reset
- clean
- force操作

`context-hub`は今回の変更対象ではない。読取が必要な場合を除き、変更しないこと。

---

## 2. 最初に読む文書

Repository内を検索し、次の2文書の実際のパスを特定して全文を読む。

1. `V2_IMPLEMENTATION_SPEC.md`
2. `V2_CODEX_IMPLEMENTATION_PLAN.md`

加えて、次を確認する。

- `apps-script-v2/README.md`
- `apps-script-v2/CHANGELOG.md`
- Phase 1の全`.gs`ファイル
- `apps-script-v2/appsscript.json`
- `tests/phase1_local_test.js`
- その他のv2向けテスト
- Repository内の関連設計文書

仕様の優先順位は次のとおり。

1. 本指示書
2. `V2_IMPLEMENTATION_SPEC.md`
3. `V2_CODEX_IMPLEMENTATION_PLAN.md`
4. v2向けREADME・設計文書
5. 既存v2コード
6. v1向け文書・コード

矛盾を勝手に補完しない。

実装に影響する矛盾がある場合は、次を記録する。

- 矛盾点
- 採用する解釈
- 判断根拠
- 影響するPhase
- 将来確認が必要な事項

---

## 3. 現在のPhase 1実装状況

前回の実装報告は次のとおり。

```text
Phase 1判定: PARTIAL
ローカルテスト: 15/15 PASS
.gs構文検査: 10/10 PASS
Google Workspace実環境テスト: 未実施
Phase 2以降: 未実装
```

既存ファイルは少なくとも次のとおり。

```text
apps-script-v2/
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
  CHANGELOG.md

tests/
  phase1_local_test.js
```

前回報告されたVersion。

```text
Code Version: 2.0.0-phase1
Schema Version: 2.0
Migration Version: 0
```

前回報告された主要判断。

- 論理空行は`task_id`と`origin_key`が両方空の最初の行
- `origin_key`は`SHA-256("v2|message_id|index")`
- SetupはS00〜S40完了後、S50直前で`PHASE_BOUNDARY`
- Triggerは未作成
- Gmail、AI、Calendar、UrlFetch runtime APIは未使用
- `getLastRow()`の呼出しは0件
- 空行への`setValue(false)`は0件
- `SpreadsheetApp.flush()`は1回
- 管理列Protectionはwarning-only
- v1 Migrationは拒否
- Quick Diagnosticは読取専用方針

これらの報告をそのまま信用せず、実際のコードとテストを独立して検査すること。

---

## 4. サブエージェント構成

サブエージェントを積極的に使用する。

最低限、次の役割を設ける。

### 4.1 Phase 1独立監査担当

責務:

- Phase 1の全コードを読取
- 仕様とのTraceability確認
- 15件のローカルテストの妥当性確認
- テストが実装を追認するだけになっていないか確認
- Setupの安全性確認
- Schema、Validation、Repository、Diagnosticのレビュー
- v1前提の混入確認
- Phase 2〜4を追加できる拡張性の確認

最初の監査段階では原則コードを変更せず、指摘を返す。

### 4.2 Gmail・Message State担当

責務:

- Phase 2の設計・実装
- Gmail Gateway
- Message State Repository
- Stable Thread Key
- Message claimとcheckpoint
- 手動取込・手動除外
- 重複排除
- Gmail用Test Harness

### 4.3 Mock AI・Review Policy担当

責務:

- Phase 3の設計・実装
- Provider-neutralなAI interface
- Mock AI Adapter
- AI JSON Schema
- Action validation
- Task Review Policy
- pending変更
- `manual_fields`保護
- Phase 3 Test Harness

### 4.4 Calendar担当

責務:

- Phase 4の設計・実装
- Calendar Sync
- Event create/update/delete
- Event重複防止
- Calendar Outboxまたは同等の再開構造
- Calendar失敗からの再開
- Phase 4 Test Harness

### 4.5 独立QA担当

責務:

- 実装担当とは独立してテストを設計
- Unit、Integration、Idempotency、Recovery、Regressionを確認
- Phase GateごとのPASS、FAIL、未実施判定
- 仕様漏れとテスト漏れの指摘
- false positiveの確認

### 4.6 セキュリティ・情報管理担当

責務:

- 秘密情報の保存有無
- メール本文やAPI payloadのLog混入
- OAuth scopeの最小性
- Prompt injection耐性
- AI出力検証前の副作用防止
- Gmail・Sheets・Calendarの権限境界
- Test fixtureの非機密性

### 4.7 Apps Script性能・信頼性担当

責務:

- Apps Script実行時間
- Sheet read/write回数
- LockService
- soft execution budget
- batch size
- `getLastRow()`の誤用
- Trigger重複
- Message、Task、Calendar Eventの冪等性
- Setup、Runtime、Diagnostic、Migrationの責務分離

複数サブエージェントへ同じファイルを同時編集させない。

各担当の変更範囲を明確に分離する。最終統合と全diffの確認はメインエージェントが行う。

サブエージェント機能を使用できない場合は、その事実を明記し、同じ観点の独立レビューを複数回行う。

---

## 5. 最初に作成するTraceability

コード変更前に、Phase 1 AuditおよびPhase 2〜4のRequirements Traceability Matrixを作成する。

既存の適切な配置先がなければ、次を使用する。

```text
docs/V2_REQUIREMENTS_TRACEABILITY.md
```

最低限、次の列を含める。

```text
Requirement ID
Source document
Requirement
Phase
Target module
Test method
Implementation status
Verification status
Notes
```

Phase 1についても、既存実装がどのRequirementを満たしているかを対応付ける。

---

## 6. Phase 1 Audit

Phase 2へ進む前に、既存Phase 1実装を検査する。

### 6.1 Schema検査

確認事項:

- 利用者向け6 Sheet
- 非表示管理4 Sheet
- `タスク一覧`の43列
- 行1が内部列ID
- 行2が日本語見出し
- 行3以降がデータ
- 内部列IDの重複なし
- Enumの内部値と日本語表示の対応
- 日付・DateTime・Boolean・String・JSONの型
- Checkbox対象列が仕様と一致
- コメント列等へBoolean Validationが付かない
- 管理列が右側にある
- 管理列の非表示方針
- 初期行数と拡張単位
- 空行にBoolean値を事前投入しない

### 6.2 Setup検査

確認事項:

- 新しい空のSpreadsheetだけを対象とする
- v1 markerを検出して停止する
- 未知の既存データを検出して停止する
- 既存Taskを削除しない
- Sheetを無条件にclearしない
- Step単位で再開可能
- 管理Sheet作成前に管理Sheetを要求しない
- Setup中にGmail、AI、Calendarを呼ばない
- Setup中に本番Triggerを作らない
- soft execution budgetがある
- 再setupでSheet・列が重複しない設計
- S50以降へ安全に拡張可能

### 6.3 Task Repository検査

確認事項:

- `task_id`と`origin_key`の索引
- 論理空行の判定
- `getLastRow()`非依存
- 空行のValidationや書式に影響されない
- 100行単位拡張
- 型変換
- 型検証
- `created_at`
- `updated_at`
- `row_version`
- 同一`origin_key`の冪等upsert
- Task indexの不要な再読込がない
- 書込対象列を限定できる
- 将来の`manual_fields`保護を追加できる

### 6.4 Diagnostic検査

確認事項:

- 原則読取専用
- Dashboard更新なし
- 全Task更新なし
- レイアウト修復なし
- Gmail検索なし
- Calendar同期なし
- 外部AI通信なし
- 必須Sheet確認
- 必須列確認
- Validation型確認
- Boolean空行確認
- Setup状態確認
- Version確認
- 機密情報を出力しない
- 60秒以内を目標とした設計

### 6.5 Test品質検査

既存15テストについて確認する。

- 本当にproduction codeを検査しているか
- 同じ定数をテスト側へ複製していないか
- 実装とテストが同じ誤りを共有していないか
- Fake Sheetが実Spreadsheetの重要挙動を過度に単純化していないか
- Negative testが十分か
- 再setupの検査が不足していないか
- Schema driftを検出できるか
- `getLastRow()`の文字列検索だけに依存していないか
- redactionの回避ケースを検査しているか
- JSON列やDateTime列の型変換を検査しているか

### 6.6 Phase 1修正

重大または中程度の問題が見つかった場合は、Phase 2へ進む前に修正する。

修正後は次を実施する。

- 既存15テスト
- 追加したPhase 1テスト
- `.gs`構文検査
- JSON検査
- 静的ガードレール検査
- Phase 1全Regression

Google Workspace実環境を使用できない場合、次を区別する。

```text
Local implementation: PASS / FAIL
Local tests: PASS / FAIL
Static guardrails: PASS / FAIL
Google Workspace manual acceptance: PASS / FAIL / NOT EXECUTED
```

Google Workspace実環境未検証だけを理由にPhase 2へ進めない扱いにはしなくてよい。

ただし、次をすべて満たす必要がある。

- Phase 1ローカル実装がPASS
- Phase 1ローカルテストがPASS
- 重大な仕様不整合がない
- Phase 2追加に必要なinterfaceが安全
- 実環境未確認事項が明確に記録されている

この条件を満たさない場合は、Phase 2へ進まず停止する。

---

## 7. Phase 2: Gmail手動取込

Phase 2では通常Inboxの自動巡回を実装しない。

対象は、明示的に`手動/取込`ラベルが付いた限定テストメール。

### 7.1 実装対象

最低限、次を実装する。

```text
04_MessageStateRepository.gs
05_GmailGateway.gs
06_EmailPreprocessor.gs
13_LogAndDeadLetter.gsのPhase 2必要部分
18_Worker.gsのPhase 2必要部分
12_Triggers.gsの手動実行部分
Phase 2 Test Harness
```

実際のファイル名は仕様書を優先する。

既存ファイルへ責務を混在させない。

### 7.2 Gmailラベル

正式ラベルは仕様書に従う。

少なくともPhase 2で必要となる次を安全に作成する。

```text
手動/取込
手動/除外
SYS/失敗
```

AIラベルをPhase 3で作成する設計の場合は、その責務を分離する。

人間が付与した`手動/*`ラベルを自動削除しない。

優先順位:

```text
手動/除外
↓
手動/取込
↓
後続のAI判定
```

### 7.3 手動検索条件

初期値:

- `手動/取込`付き最新メッセージ
- 最大10スレッド
- 最大1メッセージ
- 通常Inbox検索なし
- 既読・未読非依存
- 迷惑メールとゴミ箱を除外
- 添付ファイル内容は解析しない
- 自分から自分へ送った非機密メールを利用可能

Gmail検索結果の全スレッド・全メッセージを無制限に展開しない。

### 7.4 Message State

Message IDを処理単位とする。

最低限、次を管理する。

```text
message_id
thread_id
stable_thread_key
status
claimed_at
claim_owner
attempt_count
next_retry_at
last_completed_stage
classification_json
error_category
created_at
updated_at
```

正確なSchemaは仕様書を優先する。

必要な状態遷移を明示する。

例:

```text
NEW
↓
CLAIMED
↓
PREPROCESSED
↓
CLASSIFIED
↓
TASK_APPLIED
↓
CALENDAR_PENDING
↓
DONE
```

Phase 2では`PREPROCESSED`までを主な到達点とし、後続状態はPhase 3・4で使用する。

失敗したMessageをDONEへしない。

stale claimの回収ルールを実装する。

### 7.5 Stable Thread Key

同一Threadの関連Taskを将来検索できるよう、Stable Thread Keyを実装する。

Gmail Thread IDだけを唯一の永続キーとしない。

生成ルールは仕様書に従い、同じThreadに対して決定的であることをテストする。

### 7.6 Email Preprocessor

AIへ将来渡す入力をProvider-neutralな形に正規化する。

最低限、次を扱う。

- 件名
- 送信者
- 受信日時
- 新着本文
- 直前1〜2メッセージ
- Message ID
- Thread ID
- Stable Thread Key
- today
- timezone
- Active Task要約を差し込めるinterface

初期本文上限は仕様書に従う。

本文を切り詰める場合は、切詰めの事実と文字数をmetadataとして持つ。

保存禁止:

- 添付ファイル内容
- 実メール本文の長期保存
- 全Thread本文
- 認証情報
- 外部URLの自動取得結果

### 7.7 Phase 2テスト

最低限、次をテストする。

- 同じMessage IDを2回処理しても重複しない
- 同一Threadの別Message IDは別入力として扱う
- 既読メールも処理できる
- `手動/除外`が最優先
- `手動/取込`がAI判定に優先
- Message claimの競合防止
- stale claimの回収
- 失敗時にDONEにならない
- 再実行可能
- Message Stateのcheckpoint
- 通常Inboxを検索しない
- メール本文がLogに残らない
- 添付ファイルを解析しない
- soft execution budgetで安全に停止する
- Phase 1 RegressionがすべてPASS

Phase 2 Gateを通過した場合だけPhase 3へ進む。

---

## 8. Phase 3: Mock AI縦フロー

Phase 3では実AIやUrlFetchへ接続しない。

決定的に再現できるMock AI Adapterだけを使用する。

### 8.1 実装対象

最低限、次を実装する。

```text
07_AiAdapter.gs
09_TaskReviewPolicy.gs
11_EditHandler.gs
13_LogAndDeadLetter.gsのPhase 3必要部分
18_Worker.gsのPhase 3必要部分
Phase 3 Test Harness
```

正確な構成は仕様書を優先する。

### 8.2 Provider-neutral interface

最低限、次のinterfaceを持たせる。

```javascript
class AiAdapter {
  healthCheck() {}
  classify(input) {}
}
```

実際のApps Script構文に適した形へ実装する。

Phase 3では次だけを実装する。

- `MockAiAdapter`
- AI input validation
- AI output validation
- JSON Schema validation
- Action数上限
- warning処理
- invalid output処理

外部HTTP通信は行わない。

### 8.3 Actions

最低限、次をサポートする。

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

各Actionについて、許可されるfield、必須field、禁止fieldをSchemaとして定義する。

未知のActionは拒否する。

未知のfieldは、仕様書に応じて拒否またはwarningとする。勝手にTaskへ適用しない。

### 8.4 自動確定

仕様書のconfidence閾値を使用する。

原則:

```text
confidence >= 0.85
needs_review = false
Schema warningなし
人間補正との競合なし
安全な新規Task
```

だけを通常Taskとして自動登録できる。

次は必ずReviewへ送る。

- `MARK_COMPLETE`
- `CANCEL_TASK`
- 期限削除
- 過去日への期限変更
- 対象Taskが曖昧な更新
- 人間編集済みfieldとの競合
- Schema warningあり
- confidence不足
- 曖昧期限
- `UNCLEAR`

### 8.5 新規Review Task

要確認専用タブを作らない。

新規の曖昧候補は`タスク一覧`へ登録する。

初期状態は仕様書に従い、最低限次を満たす。

```text
status=REVIEW
needs_review=true
decision=未選択
review_state=OPEN
```

受入時:

```text
status=OPEN
needs_review=false
review_state=APPLIED
decision=受入
```

却下時:

```text
status=EXCLUDED
excluded=true
needs_review=false
review_state=REJECTED
decision=却下
```

### 8.6 既存Task変更候補

既存Taskの現在状態を変更せず、変更候補をpending項目へ保存する。

最低限:

```text
pending_action_type
pending_changes_json
needs_review
review_state
decision
```

受入時だけpending変更を適用する。

却下時は既存Taskを変更せず、pending項目を消去する。

### 8.7 人間編集の保護

`manual_fields`等を用い、人間が編集したfieldをAIが無断で上書きしないようにする。

最低限、次を保護対象として検討する。

- task title
- due date
- priority
- status
- Calendar登録方針
- comment

仕様書に異なる定義があれば仕様書を優先する。

AI変更と人間編集が競合する場合はReviewへ送る。

### 8.8 Gmail AIラベル

正式AIラベルを仕様書に従って作成・付与する。

```text
AI/要対応
AI/期限
AI/返信待
AI/要確認
```

AIは`AI/*`だけを管理し、`手動/*`を削除しない。

Message処理済み判定をGmailラベルへ依存させない。

### 8.9 Prompt injection対策

メール本文、引用文、署名、URL、HTML、添付ファイル名等に命令文が含まれる可能性がある。

それらはすべて分類対象データとして扱い、次を行わない。

- コードとして実行
- システム命令として採用
- Repository操作へ反映
- 外部URLを自動取得
- 認証情報を出力
- 設定変更
- Schema外Actionの生成

Mock fixtureへPrompt injection例を含める。

### 8.10 Mock fixture

最低限、次を用意する。

- 明示期限付き高信頼Task
- 相対期限Task
- 曖昧期限
- AI推測期限
- 情報のみ
- 1メールから複数Task
- 既存Taskの期限変更
- 完了候補
- 取消候補
- 返信待ち設定
- 返信待ち解除
- 低信頼
- 不正JSON
- Schema不一致
- 未知Action
- Action数上限超過
- Prompt injectionを含む本文
- 手動編集との競合

### 8.11 Phase 3テスト

最低限、次をテストする。

- 同じMessageとActionを再処理してもTask重複なし
- 1メールから複数Task
- `origin_key`の決定性
- 通常Taskの自動登録
- Review Taskが同じ一覧へ登録
- 受入
- 却下
- pending変更
- pending受入
- pending却下
- 人間編集保護
- 完了候補の自動確定禁止
- 取消候補の自動確定禁止
- 過去日への変更禁止
- 不正AI出力で副作用なし
- `INFORMATION_ONLY`でTask作成なし
- Gmail AIラベルの優先関係
- Prompt injectionで制御が変わらない
- Phase 1・2 RegressionがPASS

Phase 3 Gateを通過した場合だけPhase 4へ進む。

---

## 9. Phase 4: Calendar同期

Phase 4では重要期限だけを専用Calendarへ同期する。

専用Calendar名:

```text
自動期日管理
```

Taskと期限の正本はGoogle Sheets。

Calendarを正本にしない。

### 9.1 実装対象

最低限、次を実装する。

```text
10_CalendarSync.gs
13_LogAndDeadLetter.gsのPhase 4必要部分
18_Worker.gsのPhase 4必要部分
Phase 4 Test Harness
```

必要に応じて`同期状態`SheetのSchemaを拡張する。

### 9.2 登録条件

次をすべて満たす場合だけ登録する。

- Taskが要確認中ではない
- 正式期限または採用済み相対期限がある
- 完了ではない
- 対象外ではない
- 取消ではない
- 失念時の影響が一定以上ある
- Calendar登録方針が対象
- AI推測期限だけではない

次は登録しない。

- `status=REVIEW`
- 期限未定
- AI推測期限のみ
- 回答待ちだけ
- 完了
- 対象外
- 取消
- Calendar対象外

### 9.3 Event形式

初期版は終日Event。

```text
タイトル: 【期限】タスク内容
```

説明には最低限、次を含める。

- 送信者
- 期限根拠
- 元メール参照
- Task ID

メール本文全体をEventへ転記しない。

Task IDをEventの識別情報として保持し、同一Taskの重複Eventを防ぐ。

### 9.4 create/update/delete

最低限、次をサポートする。

#### create

- 条件を新たに満たしたTask
- Event IDがない
- 同一Task Eventが存在しない

#### update

- 期限変更
- Task名変更
- Event説明の必要項目変更
- Calendar対象区分変更

#### delete

- 完了
- 対象外
- 取消
- Calendar対象外
- 正式期限削除
- Review状態へ戻った場合

同じ同期処理を再実行してもEventを重複させない。

### 9.5 Calendar Outbox・再開

Calendar同期をTask upsertと直接一体化しすぎない。

Calendar作業を再実行可能なOutboxまたは同等の状態として管理する。

最低限、次を保持する。

```text
task_id
operation
calendar_event_id
status
attempt_count
next_retry_at
last_error_category
created_at
updated_at
```

正確なSchemaは仕様書を優先する。

Calendarだけ失敗した場合:

- AI分類を再実行しない
- Taskを重複作成しない
- Calendar段階から再開する
- Message Stateのcheckpointを維持する

### 9.6 OAuth scope

Phase 4でCalendar用scopeを追加する場合、必要最小限にする。

Gmail、Spreadsheet、Calendar以外の不要なscopeを追加しない。

実際のOAuth承認画面を確認できない場合は、未実施として記録する。

### 9.7 Phase 4テスト

最低限、次をテストする。

- create
- create再実行で重複なし
- update
- 期限変更で新規Eventを増やさない
- Task名変更
- 完了でdelete
- 対象外でdelete
- 取消でdelete
- Calendar対象外でdelete
- Review中は登録しない
- AI推測期限だけでは登録しない
- Calendar失敗後の再開
- Calendar失敗時にAIを再実行しない
- 同一Task IDでEvent一意
- Event ID不整合時の安全停止または復旧
- Calendar側変更をTask正本へ無断反映しない
- Phase 1〜3 RegressionがPASS

Phase 4 Gate通過後、Phase 5へ進まず停止する。

---

## 10. 今回実装しないもの

次は今回実装しない。

- 実AI Adapter
- Gemini API接続
- UrlFetchによるAI通信
- AI用APIキー保存
- 通常Inboxの自動巡回
- 5分自動ポーリング
- 本番time-driven trigger
- 大量メール処理
- 添付ファイル解析
- 送信済みメール常時巡回
- メール自動返信・自動送信
- Phase 5
- Phase 6
- Phase 7
- Phase 8
- Phase 9以降
- v1からv2へのMigration

Phase 4完了後は必ず停止する。

---

## 11. 共通実装原則

- v1コードをコピーして継ぎ足さない
- Phase 1の安定したinterfaceは尊重する
- 不要な大規模refactorを行わない
- 物理列番号を直接利用しない
- 内部列IDを使用する
- Runtimeからレイアウト修復を呼ばない
- DiagnosticからDashboard更新を呼ばない
- Task追記へ`getLastRow()`を使用しない
- 空行へBoolean値を事前投入しない
- 設定、Task index、Message Stateを同一実行で何度も全読込しない
- 外部副作用前に入力を検証する
- AI出力はSchema validation後だけ利用する
- Message、Task、Calendar Eventの冪等性を最初から実装する
- すべての長時間処理にsoft execution budgetを設ける
- LockService等で競合を防止する
- 失敗時に安全なcheckpointを残す
- 利用者の手動編集を無断で上書きしない
- 実環境未確認をPASSと記載しない

---

## 12. 情報管理

次をRepository、コード、Log、fixture、READMEへ保存しない。

- APIキー
- password
- token
- 実際のGmail Message ID
- 実際のSpreadsheet ID
- 実際のCalendar ID
- 実メール本文
- 添付ファイル内容
- 会社の未公表情報
- 個人情報
- Google Workspace内部URL

テストデータは完全なダミーデータとする。

Logへ保存してよい情報は、原則として次に限定する。

- 内部ID
- 処理status
- 時刻
- 件数
- 文字数
- hash
- error category
- retry count
- stage

メール本文、件名、送信者等をLogへ保存する場合は、仕様書上の明確な根拠が必要。原則として保存しない。

---

## 13. テスト方針

可能な限り、Apps Script固有処理と純粋ロジックを分離する。

### ローカルで検証するもの

- Schema
- Enum
- ID生成
- origin key
- Stable Thread Key
- Message State遷移
- claim
- stale claim
- AI output validation
- Review Policy
- pending変更
- manual field競合
- Calendar同期判定
- Outbox
- retry判定
- redaction
- Prompt injection fixture
- 冪等性

### Google Workspace実環境で確認するもの

- Sheet作成
- Data Validation
- Checkbox
- 非表示Sheet・列
- Protection
- Gmailラベル作成
- Gmail検索
- Message ID
- Gmail URL
- Calendar作成
- Calendar Event create/update/delete
- OAuth承認
- 実行時間
- LockServiceの実挙動

実環境で未実施の項目をPASSとしない。

ローカルMockで確認済みの場合は、次のように区別する。

```text
Local mock test: PASS
Google Workspace real test: NOT EXECUTED
```

---

## 14. Phase Gate

各Phaseは次を満たした場合だけ通過できる。

```text
[ ] Requirements Traceability更新
[ ] 対象実装完了
[ ] Unit test PASS
[ ] Integration test PASS
[ ] Negative test PASS
[ ] Idempotency test PASS
[ ] Failure recovery test PASS
[ ] Phase 1以降のRegression PASS
[ ] セキュリティレビュー完了
[ ] Apps Script性能レビュー完了
[ ] 独立QAレビュー完了
[ ] 重大指摘を解消
[ ] 実環境未確認事項を明示
[ ] Phase外機能を追加していない
```

重大なFAILがある場合は後続Phaseへ進まない。

実環境未実施だけが残り、ローカルコード・Mock・静的検査がすべてPASSで、後続実装を妨げない場合は、次の判定を使用できる。

```text
PASS WITH EXTERNAL VALIDATION PENDING
```

---

## 15. 文書更新

既存構成に適した場所へ、次の文書を作成または更新する。

```text
V2_REQUIREMENTS_TRACEABILITY.md
V2_PHASE_1_AUDIT_AND_PHASE_2_TO_4_REPORT.md
V2_MANUAL_ACCEPTANCE_GUIDE.md
```

既に同等文書がある場合は、重複作成せず既存文書を更新する。

### 15.1 Audit and Implementation Report

最低限、次を記載する。

- Phase 1監査結果
- Phase 1で発見した問題
- Phase 1修正内容
- Phase 2実装内容
- Phase 3実装内容
- Phase 4実装内容
- サブエージェントの指摘
- 各Phase Gate
- Test結果
- 実環境未確認事項
- Phase 5開始前の前提条件

### 15.2 Manual Acceptance Guide

新しい空のGoogle Sheetsで、次を確認する具体的手順を書く。

- Phase 1 Setup
- 再setup
- Mock Task
- Gmail手動取込
- 同一Message再実行
- Mock AI分類
- Review受入・却下
- pending変更
- Calendar Event作成
- Calendar Event更新
- Calendar Event削除
- Calendar失敗後の再実行
- Triggerが作成されていないこと
- 外部AI通信が行われていないこと

---

## 16. 最終Regression

Phase 4完了後、Phase 1〜4全体のRegressionを実施する。

最低限、次の縦フローを確認する。

```text
新しい空のGoogle Sheets
↓
Phase 1 Setup
↓
手動/取込付きダミーメール
↓
Message ID未処理判定
↓
Email Preprocessor
↓
Mock AI分類
↓
Task upsert
↓
通常TaskまたはReview Task
↓
Review受入
↓
重要期限のCalendar同期
↓
同一入力を再実行
↓
Message、Task、Calendar Eventの重複なし
```

加えて、次を確認する。

- 再setupでデータ破損なし
- 同一Message再処理でTask重複なし
- 同一Task再同期でEvent重複なし
- AI不正出力でTask副作用なし
- Calendar失敗時にAI再実行なし
- 要確認中にCalendar登録なし
- 完了・対象外・取消でCalendar削除
- 人間編集fieldの保護
- Logへの機密情報混入なし
- `getLastRow()`によるTask追記なし
- Phase 5機能なし
- 外部AI通信なし
- 5分Triggerなし

---

## 17. 最終報告形式

作業終了時に次の形式で報告する。

### 1. 結論

```text
Overall status:
Phase 1 Audit:
Phase 2:
Phase 3:
Phase 4:
```

判定:

```text
PASS
PASS WITH EXTERNAL VALIDATION PENDING
PARTIAL
FAIL
```

### 2. Phase 1監査結果

- 前回実装の妥当性
- 発見した問題
- 修正した問題
- 修正しなかった指摘と理由
- Google Workspace実環境未確認事項

### 3. Phase別結果

| Phase | 判定 | 実装概要 | Local test | Real Workspace test | 残課題 |
|---|---|---|---|---|---|

### 4. 変更ファイル

各ファイルについて次を記載する。

- パス
- 新規または変更
- 責務
- 主なfunction
- 対応Requirement ID

### 5. サブエージェント

- 使用した担当
- 各担当範囲
- 主な指摘
- 採用した修正
- 採用しなかった指摘と理由

### 6. テスト結果

最低限、次を個別に報告する。

- Phase 1既存15テスト
- Phase 1追加テスト
- Phase 2 Unit
- Phase 2 Integration
- Phase 3 Unit
- Phase 3 Integration
- Phase 4 Unit
- Phase 4 Integration
- Idempotency
- Failure recovery
- Security
- Performance
- Final Regression
- Google Workspace Manual Acceptance

### 7. 実環境で必要な確認

- Sheet
- Validation
- Gmail
- Calendar
- OAuth
- 実行時間
- Lock
- Manual acceptance

### 8. Phase 5開始前の未解決事項

- コード上の問題
- 実環境確認待ち
- 会社承認待ち
- 認証方式待ち
- 実AI Adapter設計に影響する事項

### 9. 仕様との差異

仕様書と異なる実装がある場合、次をすべて記載する。

- 差異
- 理由
- 影響
- 将来対応

### 10. 作業状態

`.git`が存在する場合:

```bash
git status --short
git diff --stat
```

`.git`が存在しない場合:

```text
Git repository not initialized
```

と記載する。

---

## 18. 停止条件

次の場合は安全に停止する。

- `GoogleSpreadsheet`以外のRepositoryを開いている
- 主要2仕様書が見つからない
- Phase 1に重大な設計不良があり修正できない
- 既存データを破壊しないと作業できない
- v1とv2を安全に分離できない
- Phase Gateの重大FAILを解消できない
- 秘密情報の保存が必要になる
- 実メールや会社情報をテストに使う必要がある
- 会社承認のない外部AI通信が必要になる
- Phase 5の実装が必要になる

停止時は次を報告する。

- 実施済み作業
- 安全に保持されている変更
- 停止理由
- 再開条件

---

## 19. 最重要事項

- 最初にPhase 1を独立監査する
- 前回報告を無条件に信用しない
- Phase 1の重大問題を解消してからPhase 2へ進む
- Phase 2、3、4を順番に実施する
- 各Phaseでサブエージェントの独立レビューを行う
- 各Phase Gate通過前に次へ進まない
- Google Workspace実環境未検証をPASSと偽らない
- v1コードを継ぎ足さない
- 機密情報を保存しない
- 外部AIへ接続しない
- 5分自動処理を実装しない
- Phase 4完了後はPhase 5へ進まず停止する
