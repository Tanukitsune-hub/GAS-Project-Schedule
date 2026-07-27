# Codex実行指示：Phase 1〜7 最終統合監査（Dashboard確認を含む送信版）

## Goal

現在開いている`GoogleSpreadsheet`リポジトリについて、Phase 1〜7の実装全体を最終統合監査してください。

今回の目的は、新機能追加やコード修正ではなく、仕様、コード、テスト、セキュリティ、性能、運用性を独立した立場で精査し、個人環境での実受入へ進める状態かを判定することです。

特に、現在未実装である`15_Dashboard.gs`について、Phase 7の必須成果物か、Phase 8以降の将来拡張かをRepository内の正本に基づいて判定してください。

```text
今回:
Phase 1〜7の最終統合監査
→ Findingの重要度判定
→ Remediation Plan
→ Sandbox・個人パイロット・少人数展開・部内展開のGo / No-Go判定

今回実施しない:
Apps Scriptコードの修正
テストコードの修正
Phase 8の実装
実Provider接続
実Google Workspace操作
新機能追加
commit・push・PR
```

監査で発見した問題の修正は、次のCodexセッションで「非常に高い」推論レベルを用いて実施する予定です。

---

## 1. 対象RepositoryとGit状態

対象Repository:

```text
GoogleSpreadsheet
```

最初に必ず確認してください。

```bash
pwd
git rev-parse --show-toplevel
git status --short
git branch --show-current
git log --oneline --decorate -10
```

本RepositoryはPhase 7完了後にGit化されています。

確認事項:

- `.git`の存在
- 現在branch
- commitの有無
- tracked / untracked / modified file
- `.gitignore`
- 秘密情報や実データがGit管理対象に含まれていないか
- OneDriveやOS由来の不要ファイル
- ArchiveやZIP内の秘密情報
- 初回commit前の場合のRepository状態

初回commitがない場合も、勝手にcommitしないでください。

禁止事項:

- commit
- push
- PR作成
- branch作成・切替
- reset
- clean
- revert
- force操作
- `.gitignore`変更
- tracked状態変更
- 利用者の既存変更の破棄

---

## 2. 最初に読む文書・コード

Repository内を検索し、実際のpathを確認して全文を読んでください。

1. `V2_IMPLEMENTATION_SPEC.md`
2. `V2_CODEX_IMPLEMENTATION_PLAN.md`
3. `docs/V2_REQUIREMENTS_TRACEABILITY.md`
4. `docs/V2_PHASE_1_AUDIT_AND_PHASE_2_TO_4_REPORT.md`
5. `docs/V2_PHASE_5_TO_7_IMPLEMENTATION_REPORT.md`
6. `docs/V2_MANUAL_ACCEPTANCE_GUIDE.md`
7. `apps-script-v2/README.md`
8. Repository内の全`CHANGELOG.md`
9. Phase 1〜7の全`.gs`
10. `apps-script-v2/appsscript.json`
11. 全ローカルテスト
12. Test fixture
13. Archive・baseline
14. その他のv2関連設計文書

仕様の優先順位:

1. `V2_IMPLEMENTATION_SPEC.md`
2. `V2_CODEX_IMPLEMENTATION_PLAN.md`
3. Requirements Traceability
4. Phase別実装報告
5. README・CHANGELOG
6. 現行v2コード
7. v1資料

文書間またはコードとの矛盾を勝手に補完しないでください。

矛盾ごとに次を記録してください。

- 矛盾内容
- 関係する文書・コード
- 優先すべき記述
- 根拠
- 現行挙動への影響
- 修正対象

---

## 3. 現在の申告Baseline

前回のCodex報告:

```text
Overall:
PASS WITH EXTERNAL VALIDATION PENDING

Phase 5:
PASS WITH EXTERNAL VALIDATION PENDING

Phase 6:
PASS WITH EXTERNAL VALIDATION PENDING

Phase 7:
PASS WITH EXTERNAL VALIDATION PENDING

Code Version: 2.7.0-phase7
Schema Version: 2.2
AI Schema Version: 2.0
Migration Version: 0

Local regression:
384 PASS / 0 FAIL / 10 SKIPPED

Real Provider:
NOT EXECUTED

Google Workspace:
NOT EXECUTED
```

申告された主要実装:

- Provider-neutral AI contract
- Mock HTTP Transport
- strict AI Schema validation
- Trigger lifecycleとkill switch
- 自動処理初期停止
- bounded Gmail search
- Message checkpoint
- Retry・Dead Letter・手動再試行
- Quick / Deep Diagnostic
- Calendar Outbox
- Message・Task・Calendarの冪等性
- raw Gmail ID・本文・credentialのLog保存禁止
- Phase 8未着手

この申告を信用せず、実コード、manifest、Schema、テスト、文書から独立して確認してください。

---

## 4. サブエージェント構成

最低限、次の独立サブエージェントを使用してください。

### A. 仕様・Traceability監査

- 全Requirementと実装の対応
- 未実装・過剰実装・仕様逸脱
- Phase 1〜7の完了条件
- 文書間矛盾
- Version・Schema・Migration整合性

### B. コード・アーキテクチャ監査

- module責務
- Setup / Runtime / Diagnostic / Migrationの分離
- 状態遷移
- 副作用境界
- 冪等性
- append-only upgrade
- dead code・重複・循環依存
- production pathがMock専用になっていないか

### C. テスト品質監査

- 384 PASSの独立再現
- testがproduction codeを検査しているか
- testとproductionが同じ誤りを共有していないか
- Mockの現実性
- Negative / failure injection
- SKIPPEDの妥当性
- Apps Script固有挙動の未検証範囲

### D. セキュリティ・情報管理監査

- credential
- OAuth scope
- raw Gmail ID
- 本文・件名
- AI request / response
- Prompt injection
- Log・Dead Letter
- Git管理対象
- synthetic fixture
- 外部送信境界

### E. Apps Script性能・信頼性監査

- 実行時間
- soft budget
- LockService
- Gmail / Sheets / Calendar call数
- Trigger
- retry storm
- watermark
- batch
- stale claim
- checkpoint
- quota
- 全件読込・全件書込
- Diagnostic・Dashboardの負荷

### F. 運用・UX監査

利用者作業を最小化する設計哲学に照らして確認してください。

- 導入手順
- 日常操作回数
- 要確認率
- Task一覧だけで運用可能か
- エラー復旧の複雑さ
- 設定項目の多さ
- 初期値
- Dashboard
- 管理情報のUI露出
- 個人パイロット前の改善
- 部内展開前の改善

### G. Git・Release監査

- Git初期状態
- `.gitignore`
- 秘密情報
- baseline commit不在の影響
- release artifact
- Archive
- 今後の安全なcommit単位
- Version tag方針

各担当は原則コードを変更せず、独立した所見を返してください。

メインエージェントは、重複排除、根拠確認、重要度調整を行って最終判断してください。

---

## 5. 監査時の変更制限

今回は監査専用です。

作成を許可する文書:

```text
docs/V2_FINAL_INTEGRATED_AUDIT_REPORT.md
docs/V2_REMEDIATION_PLAN.md
```

既に同等文書がある場合は重複作成しないでください。

変更禁止:

- Apps Scriptコード
- テストコード
- manifest
- Schema
- Config
- README
- CHANGELOG
- Requirements Traceability
- Manual Acceptance Guide
- Archive
- `.gitignore`
- Git設定

監査でコード修正が必要と判断しても、今回は修正せずFindingとRemediation Planへ記載してください。

---

## 6. 必須監査項目

### 6.1 Phase 1〜7の完了性

各Phaseを次から判定してください。

```text
COMPLETE
COMPLETE WITH EXTERNAL VALIDATION PENDING
PARTIAL
NOT IMPLEMENTED
```

確認対象:

#### Phase 1

- 10 Sheet
- 43列Task Schema
- logical empty row
- Setup
- Protection
- Diagnostic
- Version metadata

#### Phase 2

- Gmail label
- bounded search
- Message State
- Stable Thread Key
- Preprocessor
- manual import / exclude

#### Phase 3

- Mock AI
- strict actions
- Review
- pending change
- manual field protection
- Prompt injection

#### Phase 4

- Calendar Outbox
- create / update / delete
- primary / foreign protection
- Calendar-only retry
- duplicate prevention

#### Phase 5

次を実体で判定してください。

- Provider-neutral contract
- Mock HTTP Transport
- Provider-specific request builder
- actual network transport
- credential loading
- actual provider connection
- provenance
- Schema validation
- error classification

`UrlFetchApp`と`script.external_request`がない状態で、Phase 5を`COMPLETE`と呼べるかを明確に判定してください。

外部前提待ちと、コード未実装を区別してください。

#### Phase 6

- Trigger lifecycle
- 実Trigger作成境界
- default disabled
- enable readiness
- watermark
- Inbox search
- batch
- checkpoint
- production path
- provider未設定時のfail-closed
- Calendar未設定時のfail-closed

#### Phase 7

- Retry
- Dead Letter
- manual retry
- `SYS/失敗`
- Quick / Deep Diagnostic
- 運用可視化
- Dashboard
- Phase 7完了条件

---

## 6.2 `15_Dashboard.gs`の必須監査

現在、`15_Dashboard.gs`は未実装と申告されています。

この点を最重要論点の1つとして扱ってください。

必ず確認する事項:

- `15_Dashboard.gs`が本当に存在しないか
- `V2_IMPLEMENTATION_SPEC.md`での位置づけ
- `V2_CODEX_IMPLEMENTATION_PLAN.md`での位置づけ
- `MASTER_PLAN`由来のPhase 7要件との整合
- Requirements Traceability上のDashboard Requirement
- Phase 5〜7報告書で「Phase 8 Dashboard」とされた根拠
- Dashboard未実装でもPhase 7 GateをPASSできるか
- `ダッシュボード`Sheetが現在どの状態か
- Phase 7の軽量運用Dashboardと、将来の高度なスケジュール管理拡張の区別

Repository内の正本・仕様・コードを根拠に結論を出してください。過去の会話上の説明を根拠にしないでください。

### DashboardがPhase 7必須と判定された場合

- Phase 7を`COMPLETE`と判定しない
- 少なくとも`PARTIAL`または相当する評価とする
- Findingを作成する
- Severityを根拠付きで判定する
- 個人パイロット前の必須修正かを判断する
- 独立したRemediation Work Packageを作成する

### Remediation Planへ含める最小Dashboard要件

高度なWork Block、日次・週次レビュー、スケジュール最適化は対象外です。

Phase 7の軽量運用Dashboard候補:

- 自動処理の有効・停止状態
- 最終成功実行日時
- 最終失敗日時
- 本日の処理件数
- 要確認Task件数
- 期限超過件数
- 本日期限件数
- 近日期限件数
- Retry待ち件数
- Dead Letter件数
- Calendar同期待ち件数
- 未解決エラー件数
- システム状態の正常・要対応表示

更新方式:

- Workerのメール処理経路から直接呼ばない
- 利用者の明示更新、Sheet open時の軽量更新、または独立した軽量処理
- 全行・全Sheetを繰り返し読まない
- Quick Diagnosticと責務を混ぜない
- 修復処理を行わない
- 実行時間上限を持つ

Dashboard用Work Packageには次を含めてください。

```text
Target files
Data source
Aggregation method
Refresh method
Performance budget
Security constraints
Unit tests
Integration tests
Apps Script manual acceptance
Definition of Done
```

---

## 6.3 自動運転の完成度

次の縦フローがコード上で接続されているか確認してください。

```text
time-driven trigger
→ bounded Gmail search
→ Message ID dedup
→ claim
→ preprocess
→ AI classify
→ strict validation
→ Task / Review
→ Calendar Outbox
→ Calendar
→ checkpoint
→ retry / Dead Letter
```

確認事項:

- interfaceはあるが呼ばれていない箇所
- Mock専用でproduction pathがない箇所
- Trigger作成可否
- readiness
- kill switch
- fail-closed
- provider未設定
- Calendar未設定
- partial failure
- restart後復旧
- duplicate防止

---

## 6.4 Schema・Upgrade

確認事項:

```text
Code Version: 2.7.0-phase7
Schema Version: 2.2
AI Schema Version: 2.0
Migration Version: 0
```

- Schema 2.0 → 2.2の変更
- append-only upgrade
- 既存v2環境への適用
- Setup / upgrade責務
- Version metadata
- column追加
- Validation・Protection
- 再実行
- v1 Migration混入
- rollback不能時の安全性

---

## 6.5 テスト再現と品質

全ローカルテストを実行してください。

申告値:

```text
24 suites
384 PASS
0 FAIL
10 SKIPPED
```

確認:

- suite数
- test数
- PASS / FAIL / SKIPPED
- `.gs`構文
- manifest
- OAuth scope
- static checks
- production file読込
- implementation複製への依存
- failure injection
- state-machine coverage
- retry timing
- idempotency
- race condition
- soft budget
- redaction
- Prompt injection
- Dashboard未実装を検出するテストの有無
- Provider未実装を検出するテストの有無
- Apps Script API Mockとの差

SKIPPED 10件を一覧化し、次へ分類してください。

```text
実Workspaceでのみ可能
Provider確定後に可能
現在のコード不足により実施不能
Phase 8で予定
```

---

## 6.6 セキュリティ

Repository全体を確認してください。

- API key
- OAuth token
- password
- private key
- Authorization
- Cookie
- `.clasp.json`
- Script ID
- Spreadsheet ID
- Calendar ID
- Gmail ID
- Gmail URL
- OneDrive path
- 個人名・個人情報
- 実メール本文
- 添付内容
- internal URL
- AI payload
- Archive内秘密情報
- Git history内秘密情報。commitがある場合
- synthetic fixtureの明確性

raw IDがLog、Dead Letter、Error、Diagnostic、Dashboardへ出ないことを確認してください。

Prompt injectionが設定、Schema、Repository、外部URL取得、credentialへ影響しないことを確認してください。

---

## 6.7 性能・Apps Script制約

確認事項:

- 6分上限への余裕
- manual / automatic soft budget
- Gmail search上限
- Message batch
- Calendar outbox batch
- retry batch
- Lock wait
- stale claim
- Sheet read / write
- index cache
- Properties
- flush
- trigger
- 429・quota
- retry storm
- Dashboard集計
- Deep Diagnostic
- 高い行番号でのメモリ
- CalendarList pagination
- 1実行内の外部call数

計算可能な範囲で、Worker 1回の最大処理量と主要API call数の上限を推定してください。推定は推定と明記してください。

---

## 6.8 運用・UX

利用者作業最小化の観点から評価してください。

### 導入

- 空Sheetからの手順数
- Apps Script配置
- manifest
- OAuth
- Provider
- Calendar
- Trigger enable
- Diagnostic
- 誤操作しやすい箇所

### 日常運用

- 普段見るタブ
- 要確認
- 完了・対象外
- エラー
- 手動retry
- 設定
- Dashboard
- Gmail label
- Calendar

次を明示してください。

- 毎日行う利用者操作
- 管理者だけが行う操作
- 原則自動化される操作
- 過度に複雑な操作
- 個人パイロット前に簡素化すべき点
- 部内展開前に簡素化すべき点

---

## 7. Finding形式

Findingごとに記載:

```text
Finding ID
Severity
Category
Affected files
Evidence
Expected behavior
Actual behavior
Impact
Verification
Recommended remediation
Phase / timing
```

Severity:

```text
Critical
High
Medium
Low
Informational
```

定義:

- Critical: データ漏洩、破壊、重大な無制御副作用、運用不能
- High: 本番自動運転を阻止
- Medium: 個人パイロット前に修正すべき
- Low: パイロット中または部内展開前に改善
- Informational: 注意・将来改善

同じ根本原因を重複させないでください。

確認不能は`Unverified`としてください。

---

## 8. Go / No-Go

個別判定してください。

| Stage | 判定 |
|---|---|
| ローカルコード完成 | GO / CONDITIONAL GO / NO-GO |
| 非本番Google Workspace Sandbox受入 | GO / CONDITIONAL GO / NO-GO |
| たぬきさま個人の実業務パイロット | GO / CONDITIONAL GO / NO-GO |
| 少人数限定展開 | GO / CONDITIONAL GO / NO-GO |
| 部内展開 | GO / CONDITIONAL GO / NO-GO |

各判定:

- 根拠
- 必須前提
- Blocker
- 修正
- 外部検証
- 残余リスク

Dashboard未実装が各Stageに与える影響を明記してください。

---

## 9. Remediation Plan

`docs/V2_REMEDIATION_PLAN.md`へFindingを修正単位で整理してください。

```text
Work Package ID
Priority
Related findings
Objective
Files
Implementation outline
Tests
Acceptance criteria
Dependencies
Recommended reasoning level
Complexity: S / M / L / XL
```

順序:

1. Critical / High
2. Medium
3. 個人パイロット阻害
4. Dashboard
5. 実Workspace受入阻害
6. Low
7. 部内展開向け改善

Ultraは今回の監査に使用し、修正は「非常に高い」で実行できる単位へ分割してください。

---

## 10. 作成する文書

```text
docs/V2_FINAL_INTEGRATED_AUDIT_REPORT.md
docs/V2_REMEDIATION_PLAN.md
```

Audit Report構成:

1. Executive Summary
2. Scope
3. Repository / Git State
4. Sources Reviewed
5. Test Reproduction
6. Phase 1〜7 Completion
7. Architecture
8. AI Boundary
9. Automation
10. Retry / Dead Letter / Diagnostic
11. Dashboard
12. Security
13. Performance
14. Operational UX
15. Findings
16. Skipped / External Validation
17. Go / No-Go
18. Next Actions
19. Limitations

---

## 11. 最終報告

チャット上は簡潔にしてください。

### 結論

```text
Overall audit:
Critical:
High:
Medium:
Low:
Informational:
```

### Phase評価

| Phase | 判定 | 主な論点 |
|---|---|---|

### Dashboard判定

```text
15_Dashboard.gs:
Phase 7 requirement:
Finding severity:
Pilot blocker:
```

### テスト再現

```text
Suites:
PASS:
FAIL:
SKIPPED:
```

### 重要Finding

Critical / High / Mediumだけ要約。

### Go / No-Go

| Stage | 判定 |
|---|---|

### 作成文書

- Audit Report
- Remediation Plan

### Git状態

```bash
git status --short
git branch --show-current
git log --oneline --decorate -5
```

commit、push、PRは行わないでください。

---

## 12. 停止条件

次の場合は監査可能な範囲まで実施し、停止してください。

- 対象Repositoryが異なる
- 主要仕様が見つからない
- テスト環境が壊れている
- 既存コードを変更しなければ監査できない
- 秘密情報の外部送信が必要
- 実Workspace・実Provider接続が必要

停止時も、確認済み事項、不足情報、再開条件を報告してください。

---

## 13. 最重要事項

- 今回は監査専用
- コードを変更しない
- 384 PASSを独立再現
- Phase名称と実装実体を区別
- `15_Dashboard.gs`を最重要監査論点にする
- Dashboard未実装を将来拡張として安易に処理しない
- 正本に基づきPhase 7完了性を再判定
- 実Provider・実Workspace未検証をPASSとしない
- 利用者作業最小化も監査
- Git化後の秘密情報とRepository状態を確認
- Findingを修正可能なWork Packageへ分解
- 修正は次セッション
- Phase 8へ進まない
