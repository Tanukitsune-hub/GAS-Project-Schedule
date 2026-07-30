# Google Workspace Personal Work OS v2
# Phase 1〜7 Remediation Plan

> Current addendum (2026-07-31): this Phase 1〜7 plan remains historical
> context. The active additive remediation is Code `2.8.10-prepilot` /
> Schema `2.6` / AI Schema `2.0` / Migration `3`, with source-stage gate
> `PHASE8B_SANDBOX_NO_GO_DASHBOARD_WRITE_VISIBILITY`. A10/B10/T10/E10 are
> pending and real Workspace retransfer/retest is `NOT_EXECUTED`. The
> v2.8.10 change is restricted to S90 Dashboard queued-write visibility,
> fresh-Range postcondition verification, module-skew rejection, bounded safe
> evidence, tests, and publication artifacts; it does not reopen the legacy
> work packages or authorize Phase 8B execution.

- 作成日: 2026-07-25（JST）
- 根拠: `docs/V2_FINAL_INTEGRATED_AUDIT_REPORT.md`
- 対象: Phase 1〜7の未完了事項
- Phase 8: 対象外
- 実装Reasoning推奨: 非常に高い

## 1. 実施原則

- 現在のworking treeと既存code/testを保持する。
- Provider、endpoint、model、auth、credential、会社承認を推測しない。
- 実Provider接続前はAutomationをOFFに保つ。
- Setupから5分production Triggerを作らない。
- 実AI通信中にScript Lockを保持しない。
- Gmail、Calendar、AI、Triggerの実環境試験は完全な非機密sandboxで行う。
- local/Mock PASSと実Workspace PASSを分離する。
- 各Work Package終了時に全24 regressionと独立reviewを再実行する。
- Dashboardへ高度なWork Block、日次・週次レビュー、スケジュール最適化を
  追加しない。
- Phase 8へ進まない。

## 2. 推奨順序

1. WP-01 Provider / Approval Decision
2. WP-02 Production AI Adapter and Lock-safe Orchestration
3. WP-03 Automatic Gmail Scope and Readiness
4. WP-04 Standalone Secret Containment
5. WP-05 Reliable Task Edit Capture
6. WP-06 Lightweight Operations Dashboard
7. WP-07 Runtime Settings and Shared Preflight
8. WP-08 Budget, Quota and Long-run Hardening
9. WP-09 Setup Consent and Operational UX
10. WP-10 Deep Diagnostic and Retention Visibility
11. WP-11 Metadata / Traceability Correction
12. WP-12 Git Initial Release Hygiene
13. WP-13 Real Workspace Sandbox Acceptance

WP-01が未完了でも、WP-03〜WP-12はMock-onlyかつ外部通信なしで先行できる。
WP-02とWP-13の実Provider項目はWP-01完了後だけ実行する。

## 2.1 Implementation status — 2026-07-25

| Work Package | Code / local status | External boundary |
|---|---|---|
| WP-01 Provider / Approval Decision | BLOCKED — no decision was guessed | Provider/model/endpoint/auth/company/data/credential decisions `NOT CONFIRMED` |
| WP-02 Production AI boundary | Code-remediable registry/factory, lock-free transport boundary and CAS commit implemented; production registry remains empty and fails closed | Real adapter/transport/credential loader `NOT IMPLEMENTED`; real connection `NOT EXECUTED` |
| WP-03 Gmail scope | Manual exclusion/import priority, system scope, promotions/social filters, Message-scoped import, call/filter metrics implemented | Newsletter and Calendar-notification rules remain decision-gated; real Gmail `NOT EXECUTED` |
| WP-04 Secret containment | High-confidence redaction and sink sanitization implemented with synthetic tests | Real credential corpus `NOT USED` |
| WP-05 Task edit capture | Owner installable edit Trigger plus menu fallback implemented and locally faked | Real owner authorization/edit event `NOT EXECUTED` |
| WP-06 Dashboard | 17-metric explicit-refresh Dashboard and local 100/1,000/10,000-row tests implemented | Real Apps Script performance/UI `NOT EXECUTED` |
| WP-07 Runtime Settings | Typed once-per-run snapshot, protection and shared preflight implemented | Real Protection/Validation/enable flow `NOT EXECUTED` |
| WP-08 Budget/quota | Setup/completed-stage budget propagation, Calendar page/API-boundary guards, Gmail refetch/call/time bounds and safe metrics implemented | Real quota/latency/120–210 second boundaries `NOT EXECUTED` |
| WP-09 Setup UX | Side-effect consent, next-stage preview and concise safe result implemented | Real dialog usability `NOT EXECUTED` |
| WP-10 Deep/retention | Existing read-only Deep Diagnostic retained; P2 retention policy remains out of this High/Medium remediation | Company retention policy `NOT CONFIRMED` |
| WP-11 Metadata/traceability | Code `2.8.1-prepilot`, Schema `2.2`, AI `2.0`, Migration `0`; stale Phase boundary/Guide corrected | Real existing-v2 rerun `NOT EXECUTED` |
| WP-12 Git hygiene | `.gitignore`, local-path cleanup, secret/archive checks prepared | Initial commit/branch/logical commits blocked by managed read-only `.git` |
| WP-13 Real Workspace acceptance | NOT EXECUTED | Requires user-owned non-confidential sandbox and applicable external decisions |

This table records implementation evidence, not a personal-pilot PASS. Local
and Mock checks cannot close the real Google Workspace or real Provider rows.

## 3. Work Packages

### WP-01 — Provider / Approval Decision

```text
Work Package ID: WP-01
Priority: P0
Related findings: F-001, F-003
Objective: 実Provider実装の前提を正式決定する
Complexity: M（外部調整を含む）
Recommended reasoning level: 非常に高い
```

Files:

- 新規または既存の承認済みDecision記録
- 必要に応じてsecurity/data-processing checklist
- codeはこのWPでは原則変更しない

Implementation outline:

1. 正式に使用可能なProviderと接続経路を確認する。
2. endpoint、model ID、Structured Output契約、timeout、rate limitを確認する。
3. 認証方式とApps Scriptからの接続可否を確認する。
4. 会社承認、data policy、入力保持、学習利用、監査、課金主体を確認する。
5. credential保管方式、read権限、rotation、revocationを承認する。
6. `script.external_request`または代替service scopeの管理者許可を確認する。
7. 非機密test corpusと実接続試験の許可を確認する。

Tests:

- document review
- approval owner / date / scope completeness check
- 未確定項目が1つでもある場合のfail-closed確認

Acceptance criteria:

- Provider、endpoint、model、auth、credential reference形式、会社承認、
  data policy、storage approvalがすべて明記される。
- credential値をRepository、Sheet、reportへ保存しない。
- 未確定なら`NOT CONFIRMED`のままWP-02を開始しない。

Dependencies:

- 会社IT / Security / Legal / data owner

### WP-02 — Production AI Adapter and Lock-safe Orchestration

```text
Work Package ID: WP-02
Priority: P0
Related findings: F-001
Objective: 承認済みProviderを安全なproduction Workerへ接続する
Complexity: XL
Recommended reasoning level: 非常に高い
```

Files:

- `apps-script-v2/00_Config.gs`
- `apps-script-v2/07_AiAdapter.gs`
- `apps-script-v2/12_Triggers.gs`
- `apps-script-v2/13_LogAndDeadLetter.gs`
- `apps-script-v2/16_Diagnostics.gs`
- `apps-script-v2/18_Worker.gs`
- `apps-script-v2/99_TestHarness.gs`
- `apps-script-v2/appsscript.json`
- Phase 5/6 local and integration tests
- README、Manual Guide、Traceability、CHANGELOG

Implementation outline:

1. Provider-specific request builderを実装する。
2. credential loaderはopaque referenceを使用し、値をLog/Sheetへ返さない。
3. production transportと`createProductionExternalAdapter()`を実装する。
4. timeout、429、5xx、auth、invalid JSON、Schema violationを正規化する。
5. provenanceにProvider/model/prompt/schema/config versionを保存する。
6. Lock内でclaim、stage、input hash、row versionを永続化する。
7. Lockを解放してGmail/AI/Calendar外部I/Oを行う。
8. Lock再取得後にrun ID、stage、hash、row versionを再検証し、CAS型でcommitする。
9. AI timeoutを`remaining budget - reserve`以下へ縮める。
10. productionにMockを渡す経路を引き続き拒否する。

Tests:

- adapter valid/invalid/extra-field
- 429、5xx、auth、timeout、oversized response
- credential retrieval failure and non-disclosure
- HTTP中のTask edit、manual retry、二重Worker
- stale result、row version conflict、budget直前
- Mock fallback
- production factory existence/static test
- non-secret real Provider sandbox test

Acceptance criteria:

- `Code implementation`: COMPLETE
- `Mock HTTP Transport`: PASS
- `Real provider connection`: 実行した場合だけPASS
- `Company approval`: CONFIRMED
- `Credential storage approval`: CONFIRMED
- HTTP待機中にScript Lockを保持しない。
- secret、body、raw response、credentialをLog/DLQへ保存しない。
- full regression 0 FAIL。

Dependencies:

- WP-01
- Security review
- Google Workspace OAuth/admin approval

### WP-03 — Automatic Gmail Scope and Readiness

```text
Work Package ID: WP-03
Priority: P0
Related findings: F-002, F-006
Objective: 自動処理対象と開始条件を正本どおりに制限する
Complexity: L
Recommended reasoning level: 非常に高い
```

Files:

- `apps-script-v2/00_Config.gs`
- `apps-script-v2/05_GmailGateway.gs`
- `apps-script-v2/12_Triggers.gs`
- `apps-script-v2/16_Diagnostics.gs`
- `apps-script-v2/18_Worker.gs`
- Phase 6 tests
- README、Manual Guide、Traceability

Implementation outline:

1. `CATEGORY_PROMOTIONS`と`CATEGORY_SOCIAL`を明示除外する。
2. newsletterとCalendar自動通知の判定規則を推測せずDecision化する。
3. `手動/除外`を最優先、次に`手動/取込`を候補順へ反映する。
4. 業務mailを広く除外しないnegative fixtureを追加する。
5. enable前にcurrent shared preflightを実行する。
6. preflight FAIL/WARN policyを明文化する。
7. selection countと除外理由をbody/subjectなしで安全に集計する。

Tests:

- promotions/social exclusion
- manual exclude over manual import
- manual import priority
- newsletter/Calendar approved rules
- no broad sender/domain exclusion
- Validation/Protection/Schema drift blocks enable
- automation OFF performs zero external call

Acceptance criteria:

- Spec `15.3`とPlan Phase 6 testを満たす。
- 対象mailのscopeがfixtureで説明可能。
- preflight未合格時にTriggerを作成しない。
- 実Provider送信前に独立security reviewを通過する。

Dependencies:

- newsletter/Calendar notification rule Decision
- WP-07のshared preflightと調整

### WP-04 — Standalone Secret Containment

```text
Work Package ID: WP-04
Priority: P1
Related findings: F-003
Objective: メールまたはAI出力由来のcredential二次保存を防ぐ
Complexity: M
Recommended reasoning level: 非常に高い
```

Files:

- `apps-script-v2/17_Utilities.gs`
- `apps-script-v2/07_AiAdapter.gs`
- `apps-script-v2/08_TaskRepository.gs`
- `apps-script-v2/10_CalendarSync.gs`
- `apps-script-v2/13_LogAndDeadLetter.gs`
- security/negative tests

Implementation outline:

1. 高確度standalone secret patternを共通scannerへ追加する。
2. 誤検出を抑えるpositive/negative corpusを用意する。
3. 検出時のpolicyを`REVIEW`または隔離として定義する。
4. Task title、pending change、Calendar summary/description、Log/DLQ、
   Diagnosticを同一fixtureで検証する。
5. raw secretをtest reportへ出さず、synthetic tokenを使用する。

Tests:

- OpenAI-like、Google API-like、JWT、OAuth/GitHub-like、private-key marker
- benign UUID、date、task codeのfalse positive
- subject/body/AI outputから各sinkへのend-to-end
- redacted valueがformulaまたはURLとして復元されない

Acceptance criteria:

- high-confidence synthetic secretsがTask、Calendar、Log、DLQへ残らない。
- benign fixtureを不必要に破壊しない。
- actual secretをfixtureへ使用しない。

Dependencies:

- Security policy

### WP-05 — Reliable Task Edit Capture

```text
Work Package ID: WP-05
Priority: P1
Related findings: F-004
Objective: Task編集とReview判断を1操作で確実に反映する
Complexity: M
Recommended reasoning level: 非常に高い
```

Files:

- `apps-script-v2/02_Setup.gs`
- `apps-script-v2/11_EditHandler.gs`
- `apps-script-v2/12_Triggers.gs`
- `apps-script-v2/Menu.gs`
- `apps-script-v2/16_Diagnostics.gs`
- `apps-script-v2/99_TestHarness.gs`
- Phase 3/4 tests
- README、Manual Guide、Traceability

Implementation outline:

1. `タスク一覧`行3以降、利用者編集可能列だけを対象にする。
2. owner確認付きinstallable edit triggerを冪等作成する。
3. 5分time-driven Triggerとは別種類・別lifecycleで管理する。
4. edit eventのrangeから行/列を正確に取得し、重複行を除外する。
5. `manual_fields`、normalization、decision、row version、Outboxを更新する。
6. Gmail、AI、Calendar APIをedit handlerから呼ばない。
7. 手動menuはfallbackとして残す。
8. trigger作成を望まない明示Decisionがある場合は、正本を先に変更する。

Tests:

- single cell、multi-cell、paste、20行上限
- user column / management column
- repeated event idempotency
- Review accept/reject
- Calendar Outbox enqueue
- Setup rerunでtrigger重複なし
- unrelated trigger削除なし
- real Workspace edit event

Acceptance criteria:

- セル編集だけでmanual field保護が成立する。
- 未反映状態を残さない。
- time-driven Automationは初期OFFのまま。
- local regressionとreal edit acceptanceがPASS。

Dependencies:

- current user authorization

### WP-06 — Lightweight Operations Dashboard

```text
Work Package ID: WP-06
Priority: P1
Related findings: F-005
Objective: Phase 7必須の軽量運用可視性を実装する
Complexity: M
Recommended reasoning level: 非常に高い
```

Files:

- new `apps-script-v2/15_Dashboard.gs`
- `apps-script-v2/Menu.gs`
- `apps-script-v2/99_TestHarness.gs`
- new local Dashboard test
- 必要に応じて`apps-script-v2/00_Config.gs`
- README、Manual Guide、Traceability、Phase report、CHANGELOG

Implementation outline:

- 既存3列Schemaを維持し、明示refreshで安全な集約値だけをkeyed upsertする。
- 次のData source、集約、更新、性能、security contractを一体で実装する。

Data source:

- `タスク一覧`
- `処理履歴`
- `エラー・再実行`
- `同期状態`
- Script Properties
- shared read-only health collector

Aggregation method:

- `task_id`または`origin_key`があるTaskだけを集計
- Error/Outboxはlogical recordだけを集計
- Sheetごとに1回またはbudgeted chunkでread
- count/status/timeだけを生成
- 既存3列`metric_key / metric_value / metric_note`をkeyed upsert

Refresh method:

- 初期方式は利用者の明示`Dashboard更新`
- Workerから呼ばない
- Quick/Deep Diagnosticからwriteしない
- shared pure collectorは許可するが、責務とread回数を明示する
- 未更新時は「未更新 / Automation OFF / Diagnostic未実行」を表示

Minimum metrics:

1. automation status
2. last success
3. last failure
4. processed today
5. review count
6. overdue count
7. due today count
8. due within 7 days
9. waiting count
10. retry waiting count
11. Dead Letter count
12. Calendar pending count
13. unresolved error count
14. system health
15. AI provider
16. Quick Diagnostic status

Performance budget:

- 専用soft budget
- Task/Error/Outbox/History/Propertiesを各1回
- 1回の`setValues`
- 100 / 1,000 / 10,000 rowのlocal/Fake計測
- Apps Script実測
- Worker中は短いtryLockまたはBUSY終了

Security constraints:

- body、subject、sender、raw Gmail/Calendar ID、credential、payloadを表示しない
- Task titleを表示しない
- count、status、timestamp、safe noteのみ
- Error detailへ直接linkしない

Tests:

- file/menu existence
- empty、100、1,000、10,000 row
- count accuracy
- idempotent refresh
- no Task/Error/Outbox mutation
- no external service
- no raw ID/secret
- budget exhaustion
- Worker/Diagnostic非依存
- real Apps Script manual acceptance

Acceptance criteria:

- 正本の最低表示を満たす。
- Dashboardは正本にならない。
- Dashboard failureでWorkerを失敗させない。
- 高度なWork Block、日次・週次review、schedule最適化を含めない。
- Phase 7 Gateを独立再判定する。

Dependencies:

- WP-07 shared health design

### WP-07 — Runtime Settings and Shared Preflight

```text
Work Package ID: WP-07
Priority: P1
Related findings: F-006
Objective: 表示設定、Runtime、Diagnostic、enable判定を一致させる
Complexity: L
Recommended reasoning level: 非常に高い
```

Files:

- `apps-script-v2/00_Config.gs`
- `apps-script-v2/01_TypesAndSchemas.gs`
- `apps-script-v2/03_SheetBuilder.gs`
- `apps-script-v2/12_Triggers.gs`
- `apps-script-v2/16_Diagnostics.gs`
- `apps-script-v2/18_Worker.gs`
- tests、README、Guide

Implementation outline:

1. Runtime settings snapshotの責務配置を設計する。
2. 1 runで1回だけSettingsを読む。
3. type、range、allowed value、editable policyを検証する。
4. 固定項目を実際に保護する。
5. 未対応設定は編集不可・情報表示に変更する。
6. common pure preflight collectorを作る。
7. Quick Diagnosticとenableが同じcurrent-state checkを使用する。
8. Diagnosticはread-only、enableだけがTrigger副作用を持つ。

Tests:

- each editable setting changes actual runtime bound
- invalid type/range fails closed
- settings read once
- schema/validation/protection/duplicate drift
- no Trigger on FAIL
- current PASS permits next gate only
- rerun preserves user values

Acceptance criteria:

- Sheet表示値とRuntime実値が一致する。
- settingsを変更しても無効な見かけ上の成功がない。
- enable時のcurrent stateを検証する。
- credentialはSettingsへ保存しない。

Dependencies:

- WP-03 preflight policy

### WP-08 — Budget, Quota and Long-run Hardening

```text
Work Package ID: WP-08
Priority: P1
Related findings: F-001, F-007, F-010
Objective: end-to-end soft budget、API call、長期Sheet増加をboundedにする
Complexity: L
Recommended reasoning level: 非常に高い
```

Files:

- `apps-script-v2/02_Setup.gs`
- `apps-script-v2/04_MessageStateRepository.gs`
- `apps-script-v2/05_GmailGateway.gs`
- `apps-script-v2/10_CalendarSync.gs`
- `apps-script-v2/13_LogAndDeadLetter.gs`
- `apps-script-v2/16_Diagnostics.gs`
- `apps-script-v2/18_Worker.gs`
- performance/reliability tests

Implementation outline:

1. Setup outer budgetを全stageへ伝播する。
2. S60 CalendarListへpage ceiling、token cycle、budget checkを追加する。
3. S90はremaining Setup budgetを使用する。
4. Gmail API call budgetとmetricsを追加する。
5. known Messageの再Thread展開を削減する。
6. candidateなしの場合にTask/Outbox contextをlazy loadする。
7. Run Historyへ検証付きappend cursorを導入する。
8. manual retry 5件でMessage/Outbox contextを共有する。
9. lock contention skipを次runで安全に可視化する。

Tests:

- delayed stage / delayed Calendar page
- repeated token / page ceiling
- 0、1、10 new Message / 100 recent Thread
- API call count assertions
- 120 / 210 / 60 / 180 second boundary
- 1,000 / 10,000 row
- long Run History cursor fallback
- concurrent Worker/edit/retry

Acceptance criteria:

- Setupが120秒boundaryで安全にPAUSED。
- Workerが210秒reserve前に新規外部callを開始しない。
- unbounded provider paginationがない。
- call countsを安全なsummaryで記録する。
- real Workspace実測をReportへ残す。

Dependencies:

- WP-02 Lock design
- real sandbox for final measurement

### WP-09 — Setup Consent and Operational UX

```text
Work Package ID: WP-09
Priority: P1
Related findings: F-009
Objective: 初期導入、再開、日常menu、結果表示を誤操作しにくくする
Complexity: M
Recommended reasoning level: 非常に高い
```

Files:

- `apps-script-v2/Menu.gs`
- `apps-script-v2/02_Setup.gs`
- `apps-script-v2/03_SheetBuilder.gs`
- README、Manual Guide
- UX acceptance checklist

Implementation outline:

1. Setup前にGmail label 7件、専用secondary Calendar、Automation OFF、
   external AIなしを表示する。
2. Continue前に次stageと副作用を表示する。
3. COMPLETE/PAUSED/FAILEDを短い日本語summaryと次操作で表示する。
4. menuをSetup、日常、Automation、Recovery/Diagnostic、Testへ整理する。
5. 7個のPhase testを管理submenuまたは全test commandへ集約する。
6. Diagnosticはstatus countと推奨actionを先に表示する。
7. 12,000文字cut時に切り詰めを明示する。
8. Error Sheetは運用列と技術列を整理する。

Tests:

- consent text and stage display
- cancelled setup has no side effect
- resume next-stage accuracy
- current automation/trigger count in dialog
- safe result truncation
- menu entry existence
- real UI usability

Acceptance criteria:

- 利用者が外部副作用を実行前に理解できる。
- 日常操作とtest/admin操作を区別できる。
- JSONを読まなくても次操作を判断できる。

Dependencies:

- WP-05、WP-06、WP-07の公開entry point確定

### WP-10 — Deep Diagnostic and Retention Visibility

```text
Work Package ID: WP-10
Priority: P2
Related findings: F-010
Objective: read-onlyで長期整合・retention対象を把握する
Complexity: M
Recommended reasoning level: 非常に高い
```

Files:

- `apps-script-v2/00_Config.gs`
- `apps-script-v2/03_SheetBuilder.gs`
- `apps-script-v2/16_Diagnostics.gs`
- `apps-script-v2/99_TestHarness.gs`
- diagnostic tests、README、Guide

Implementation outline:

1. 365/365/90日の既定値を会社policy未確認として明示する。
2. 自動削除は実装しない。
3. Task/Message/Outbox limited integrityを追加する。
4. Event ID/Task markerは外部Calendarを呼ばずlocal metadataだけ照合する。
5. retention対象件数とoldest timestampを返す。
6. Schema/Validation driftをDeep sampleへ追加する。
7. sparse dataを考慮したsample strategyを定義する。

Tests:

- no write / no external call
- retention count boundary
- sparse rows after first 50
- mismatch samples
- 180 second budget
- safe output

Acceptance criteria:

- Spec `27.2`のread-only項目を満たす。
- cleanupは行わない。
- real Workspace runtimeを実測する。

Dependencies:

- 会社retention policy

### WP-11 — Metadata / Traceability Correction

```text
Work Package ID: WP-11
Priority: P2
Related findings: F-005, F-011, F-012
Objective: 正本、実装、version、Gate、guideを一致させる
Complexity: S
Recommended reasoning level: 非常に高い
```

Files:

- `apps-script-v2/02_Setup.gs`
- `apps-script-v2/03_SheetBuilder.gs`
- related tests
- README、CHANGELOG、Manual Guide、Traceability、Phase report
- 必要に応じて機密除去済みcontrol brief

Implementation outline:

1. DashboardをPhase 8とする誤記を修正する。
2. Phase 7をremediation完了までPARTIALとして記録する。
3. `STOP_BEFORE_PHASE7`を実Gate状態に置換する。
4. Settings/GuideのPhase 1 wordingをversioned upsertする。
5. control source chainをRepository内で再現可能にする。
6. Code/Schema/AI/Migration version更新要否を判定する。

Tests:

- stale phrase scan
- version/property/system-config alignment
- rerun preserves user data
- Dashboard requirement trace

Acceptance criteria:

- Spec、Plan、Trace、README、Report、codeのPhase境界が一致する。
- 既存利用者Task/設定を破壊しない。

Dependencies:

- WP-05〜WP-10の完了範囲

### WP-12 — Git Initial Release Hygiene

```text
Work Package ID: WP-12
Priority: P1 before first commit
Related findings: F-008
Objective: secret-safeで監査可能な初回Git baselineを準備する
Complexity: S
Recommended reasoning level: 非常に高い
```

Files:

- new `.gitignore`
- local pathを含む既存reports
- Archive追跡方針
- current staged allow-list

Implementation outline:

1. 57 staged fileを製品、仕様、test、report、Archive、instructionに分類する。
2. 実`.clasp.json`、`.env*`、credential/key、logs、tmp、OS junkをignoreする。
3. example fileは追跡可能に保つ。
4. local absolute path 2件をplaceholderへ一般化する。
5. Archiveの保持理由、checksum、scan方針を決定する。
6. whitespace checkを0にする。
7. working tree、index、Archiveを専用secret scannerで検査する。
8. 全remediationとaudit完了後、ユーザー承認を得た別sessionだけでcommitする。

Tests:

- `git status --short`
- `git diff --cached --check`
- `git check-ignore --no-index apps-script-v2/.clasp.json`
- secret scanner
- Archive inventory/hash
- full regression

Acceptance criteria:

- 初回commit candidateがallow-list化される。
- real local config/secretがignoreされる。
- local user pathがない。
- user approvalなしにcommit/push/remote変更しない。

Dependencies:

- core remediation完了

### WP-13 — Real Workspace Sandbox Acceptance

```text
Work Package ID: WP-13
Priority: P0 before personal pilot
Related findings: all external-validation gaps
Objective: local/Mock PASSを実Google Workspace PASSと分離して検証する
Complexity: L
Recommended reasoning level: 非常に高い
```

Files:

- `apps-script-v2/`の最終remediation code一式
- `apps-script-v2/appsscript.json`
- `apps-script-v2/99_TestHarness.gs`
- `tests/`の全local suite
- README、Manual Guide、Traceability、acceptance report

Environment:

- 新しい非機密Google Spreadsheet
- 専用test Gmail label / synthetic self-mail
- 専用secondary Calendar
- 承認済みProviderはWP-01/02完了後だけ
- production data、実会社mail、実attachmentは使用しない

Implementation outline:

1. WP-01〜WP-12の完了状態とversionをpreflightで確認する。
2. 新しい非機密sandboxへ正確なfile inventoryをdeployする。
3. Automation OFFのままPhase 1〜5の手動受入から開始する。
4. 実ProviderとAutomationは承認済み前提を再確認してから明示enableする。
5. 各caseの実行日時、環境種別、PASS/FAIL/SKIPPEDを秘密情報なしで記録する。
6. FAIL時は後続stageへ進まず、修正後に全Regressionから再開する。

Tests:

1. Phase 1 Data Validation、Protection、100行、rerun
2. Phase 2 Gmail label、manual import、Message State
3. Phase 3 real edit trigger、Review、manual field
4. Phase 4 5 skipped Calendar/OAuth cases
5. Phase 5 real Provider 1 skipped case
6. Phase 6 real Trigger/Gmail 2 skipped cases
7. Phase 7 real Retry/Diagnostic 2 skipped cases
8. Dashboard explicit refresh、counts、no external call
9. Setup 120秒、Quick 60秒、Deep 180秒、Worker 210秒
10. concurrent Worker/edit/retry/disable
11. 100 recent Threadsとrepresentative row counts
12. 1920×1080 visual/operational UX

Acceptance criteria:

- 10 SKIPPEDを実行済みのものだけPASSへ変更する。
- 未実行をPASSとしない。
- raw ID、body、credentialをreportへ記録しない。
- High/Medium findingが0。
- personal pilot Gateを独立再監査する。

Dependencies:

- WP-02〜WP-12
- company approval
- user authorization

## 4. Gate after Remediation

次の全条件を満たすまで個人pilotを開始しない。

- [ ] F-001、F-002のHighが解消
- [ ] F-003〜F-009のMediumが解消
- [ ] Phase 3、5、6、7を再監査
- [ ] `15_Dashboard.gs`とDashboard testsが存在
- [ ] production provider境界を実装、またはpilot scopeを明示Mock-onlyに限定
- [ ] installable edit triggerが実WorkspaceでPASS
- [ ] SettingsとRuntimeが一致
- [ ] current preflight不合格時にTriggerを作成しない
- [ ] full regression 0 FAIL
- [ ] `.gs`、manifest、scope、secret scan PASS
- [ ] Google Workspace acceptanceを実行済みだけPASS
- [ ] 初回Git baselineをユーザー承認後に作成可能な状態

## 5. Explicit Non-goals

このRemediationはPhase 8ではない。次を含めない。

- Work Block
- 日次brief
- 週次review
- schedule optimization
- 面談管理
- v1 migration
- 新しいReview専用tab
- 通常Inboxの無制限scan
- 未承認Provider、架空endpoint、架空credential
- Setupからのproduction 5分Trigger作成
- Dashboardからの外部AI/Gmail/Calendar通信

## 6. Post-remediation audit addendum — 2026-07-25

既存FindingとWork Packageは削除せず、修正後の独立監査結果を次のとおり
追記する。

| Finding | Post-remediation status | Remaining |
|---|---|---|
| F-001 | PARTIALLY CLOSED / CODE AND EXTERNAL WORK REMAIN | Provider/model/endpoint/auth、Provider Adapter、network transport、credential loader、会社・data・credential保管承認、実接続。加えてGmail search/body/labelとCalendar I/Oの長時間Worker Lock外への分離 |
| F-002 | PARTIALLY CLOSED / BLOCKED BY EXTERNAL DECISION | newsletter / Calendar通知policy、実Gmail |
| F-003 | CLOSED — LOCAL / EXTERNAL VALIDATION PENDING | 実credential handling |
| F-004 | CLOSED — LOCAL / EXTERNAL VALIDATION PENDING | 実owner installable edit event |
| F-005 | PARTIALLY CLOSED / REOPENED — MEDIUM | 非空custom keyは保持するが、key空欄かつB/Cに値・formulaがある行をsystem blockが上書きし得る。Dashboard SchemaまたはQuick Diagnostic FAIL時のwriteもfail closed化が必要 |
| F-006 | CLOSED — LOCAL / EXTERNAL VALIDATION PENDING | 実Protection/Validation/enable |
| F-007 | PARTIALLY CLOSED — MEDIUM | Setup budget、Calendar pagination、Gmail call capは実装済み。Gmail/Calendar外部I/Oが長時間Worker Lock内に残るため、実quota/duration確認前にもcode remediationが必要 |
| F-008 | PARTIALLY CLOSED / ENVIRONMENT PERMISSION | baseline/branch/commits。`.git/index.lock` write permission |
| F-009 | CLOSED — LOCAL / EXTERNAL VALIDATION PENDING | 実dialog usability |
| F-010 | OPEN — LOW / POLICY | retention、長期運用、broader Deep visibility |
| F-011 | CLOSED — LOCAL / EXTERNAL VALIDATION PENDING | 実既存v2 rerun |
| F-012 | OPEN — INFORMATIONAL | external governance/control chain |

### F-013 — Low — Dashboard layout conflictのdirect negative test不足

`apps-script-v2/15_Dashboard.gs`は、重複system key、分散system blockまたは
custom rowと安全に共存できない配置を
`E_DASHBOARD_LAYOUT_CONFLICT`でfail closedする。通常のkeyed upsert、
非空keyを持つcustom row/formula保持、冪等性はlocal test済みだが、この
exact error pathを直接発生させるtestは存在しない。key空欄かつB/Cに値または
formulaがある行の保護不足はF-005として別途再オープンした。

```text
Status: OPEN
Related Work Package: WP-06
Severity: Low
TEST_MODE=true synthetic Sandbox blocker: No
TEST_MODE=false Sandbox / personal pilot prerequisite: Yes
```

追加testは最低限、次を確認する。

1. duplicate system keyを同じerror codeで拒否する。
2. custom rowで分断された既存system blockを推測移動せず拒否する。
3. failure前後でDashboard値、formula、行数、source Sheetが不変である。
4. conflict時にrow expansionまたは部分`setValues`を行わない。

実装自体のfail-closed境界と非空keyのnormal/custom-row経路がlocal test済みの
ため、このtest gap自体はCritical/High/Mediumへ引き上げない。blank-key行の
実装上の欠陥はF-005 Mediumとして扱う。

### F-014 — Medium — production Provider失敗の抑止・Run History連携不足

production classificationはmain Worker Lockより前に実行される。そのfailure
pathはMessage Stateへfailureを記録する一方、Provider全体の
`noteProviderFailure()`を呼ばない。また、main Lock未取得のためfinal Run
Summaryが保存されない経路がある。

```text
Status: OPEN
Related Work Package: WP-02, WP-08
Severity: Medium
TEST_MODE=true synthetic Sandbox blocker: No, provided no real Provider is used
Real Provider / TEST_MODE=false prerequisite: Yes
```

修正とtestは最低限、次を確認する。

1. production classification失敗をProvider suppressionへ安全に計上する。
2. main Lock取得前の失敗も機密を含まないRun HistoryまたはError evidenceへ残す。
3. suppression中はtransportを呼ばず、retry可能時刻を一貫して返す。
4. 失敗記録自体が失敗しても元例外を漏えいさせず、冪等性を壊さない。

### F-015 — Low — production CAS conflict failure-injection不足

AI transportのlock-free実行とCAS成功系はlocal test済みだが、transport待機中の
Task edit、claim変更、input hash不一致、row version不一致、二重Workerを
直接注入したnegative testがない。

```text
Status: OPEN
Related Work Package: WP-02
Severity: Low
TEST_MODE=true synthetic Sandbox blocker: No, provided no concurrency is exercised
TEST_MODE=false Sandbox / personal pilot prerequisite: Yes
```

追加testでは、staleなAI結果がTask、Message State、Calendar Outboxへcommit
されないこと、重複Task/Eventを作らないこと、safeな競合結果を返すことを確認
する。

## 7. Final code-remediation closure addendum — 2026-07-25

この節は上記Post-remediation audit時点のFinding記録を削除せず、今回の
code-remediable範囲の最終状態を追記する。Provider、会社承認、credential
保管承認、newsletter／Calendar通知policy、retention、governance、実Google
Workspace検証は決定または実行したものとして扱わない。

| Finding | Final code status | Local evidence | External remaining |
|---|---|---|---|
| F-001 | CLOSED — CODE-REMEDIABLE SCOPE | Gmail search/body/label、AI transport、Calendar list/CRUDをScript Lock外へ分離。短時間claim、ownership、hash、row version、CAS、checkpointを維持 | 実Provider、実Gmail/Calendar、実LockService競合は`NOT EXECUTED` |
| F-005 | CLOSED — LOCAL | marker付きsystem-owned 3-column block以外はblank-key value/formulaを含めfail closed。Quick Diagnostic失敗時もwrite前停止 | 実Sheetのnote/validation/merge/protection/named-range挙動は`NOT EXECUTED` |
| F-007 | CLOSED — CODE-REMEDIABLE SCOPE | bounded Gmail calls、Calendar pagination、Setup budgetに加え、instrumented gatewayで外部I/O時Lock非保持を直接検証 | 実quota、実行時間、Calendar API latencyは`NOT EXECUTED` |
| F-013 | CLOSED — LOCAL | `E_DASHBOARD_LAYOUT_CONFLICT`をblank-key、formula、metadata、foreign marker、diagnostic failureで直接発生させ、副作用なしを検証 | 実Dashboard UIは`NOT EXECUTED` |
| F-014 | CLOSED — CODE-REMEDIABLE SCOPE | transient Provider失敗をrun_id冪等のbounded suppressionへ接続。設定失敗を含む全run outcomeをRun Historyへ安全に記録 | 実Provider障害は`NOT EXECUTED` |
| F-015 | CLOSED — LOCAL | claim ownership、stage、input hash、Task row_version、二重Worker、Calendar作成成功後のTask/Outbox CAS競合を直接注入。再実行時Event重複なし | 実同時実行と実Calendar 409は`NOT EXECUTED` |

Final local regression:

```text
34 suites
471 PASS
0 FAIL
11 SKIPPED
22/22 .gs syntax PASS
```

Local GateはCritical / High / Mediumのコード上Finding 0としてPASSする。
TEST_MODE=true、Automation OFFを維持し、TEST_MODE=false Sandbox以降は外部
判断と実環境Gateが完了するまでNO-GOとする。
