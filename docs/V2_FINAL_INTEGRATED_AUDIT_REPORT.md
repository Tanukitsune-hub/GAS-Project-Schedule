# Google Workspace Personal Work OS v2
# Phase 1〜7 最終統合監査報告

- 監査日: 2026-07-25（JST）
- 対象Repository: `GoogleSpreadsheet`
- 対象Code Version: `2.7.0-phase7`
- 対象Schema Version: `2.2`
- 対象AI Schema Version: `2.0`
- 対象Migration Version: `0`
- 監査方式: read-only code / specification / test / Git audit
- Phase 8: 未着手

## 1. Executive Summary

### 1.1 結論

```text
Overall audit: PARTIAL
Local regression: 384 PASS / 0 FAIL / 10 SKIPPED
Google Workspace real validation: NOT EXECUTED
Real provider connection: NOT IMPLEMENTED / NOT EXECUTED
Personal production pilot: NO-GO
```

申告された24 suite、`384 PASS / 0 FAIL / 10 SKIPPED`は、Repository内の全
`tests/*.js`を別途実行して独立再現した。20個の`.gs`もすべてNode構文検査を
通過し、manifest JSON、V8 runtime、`Asia/Tokyo`、7個のOAuth scopeは静的に
整合した。

ただし、ローカルテストのPASS数はPhase Gateの完全性を証明しない。正本である
`V2_IMPLEMENTATION_SPEC.md`と`V2_CODEX_IMPLEMENTATION_PLAN.md`を優先して
照合した結果、次を確認した。

- `15_Dashboard.gs`は存在せず、Phase 7必須の軽量Dashboardが未実装。
- Phase 5はprovider-neutral contractとMock transportまでで、実Provider
  request builder、network transport、credential loader、production factoryが
  未実装。
- Phase 6のproduction Workerは上記factory不在を理由に、Gmail検索前に
  fail closedする。
- Phase 6の自動候補はpromotions、social、明らかなnewsletter、Calendar自動通知
  を除外せず、`手動/取込`優先も実装していない。
- Phase 3必須のinstallable edit triggerがなく、Task編集の確定は選択範囲メニュー
  の追加操作に依存する。
- `設定`Sheetの編集可能値をRuntimeが読まず、Automation enableも現在の
  Quick Diagnostic全体の合格を要求していない。
- Google Workspace、実OAuth、実Gmail、実Calendar、実Trigger、実Provider、
  quota、並行Lock、画面UXは未検証。

したがって、Phase 7完了申告は維持できない。Phase 1、2、4は
`COMPLETE WITH EXTERNAL VALIDATION PENDING`、Phase 3、5、6、7は`PARTIAL`で
ある。厳密な順次GateではPhase 3から先を完全通過扱いにできない。

### 1.2 Finding集計

| Severity | 件数 |
|---|---:|
| Critical | 0 |
| High | 2 |
| Medium | 7 |
| Low | 2 |
| Informational | 1 |

重大なデータ破壊、実credential、実Message ID、会社メール本文、実Spreadsheet
ID、実Calendar IDのRepository混入は検出しなかった。現時点の安全停止は有効で
あり、外部AI通信を偽装していない。一方、本番運用に必要な経路と運用可視性は
未完成である。

## 2. Scope

### 2.1 監査対象

- Phase 1〜7の正本仕様、実装計画、Traceability、実装報告、README、
  CHANGELOG、Manual Acceptance Guide
- `apps-script-v2/`の全20 `.gs`
- `apps-script-v2/appsscript.json`
- `tests/`の全24 suite
- Test fixture、Archive ZIP、Git working treeとindex
- Setup、Task Repository、Gmail、AI、Calendar、Trigger、Worker、
  Retry、Dead Letter、Diagnostic、Dashboard、運用UX

### 2.2 監査対象外

- Apps Scriptコード、テスト、manifest、既存仕様書の修正
- 実Google Workspaceへのdeployまたは操作
- 実Provider通信、実credential、会社承認の代替判断
- Phase 8の実装
- commit、push、branch作成、reset、clean、staging変更
- live Google Sheets画面の視覚監査

### 2.3 独立レビュー

次の7領域を別担当として独立レビューした。

1. 仕様・Traceability・Dashboard
2. Code architecture・Phase 5〜7 production path
3. Test quality・coverage
4. Security・privacy
5. Apps Script performance・reliability
6. 導入・日常運用UX
7. Git・release hygiene

## 3. Repository / Git State

### 3.1 監査開始時

```text
Repository root: GoogleSpreadsheet
Branch: master
HEAD: none
Commit count: 0
Remote: none
Staged: 57 files, all Added
Unstaged modified: 0
Untracked: 1
Tracked line total in index: 41,061 additions
```

`git status --porcelain=v2 --branch`は`branch.oid (initial)`を返し、
`git log --oneline --decorate -5`と`git rev-parse --verify HEAD`は、commitが
存在しないため失敗した。「Phase 7完了後にGit化」は`.git`作成と一括staging
までで、監査可能なbaseline commitや履歴は存在しない。

監査開始時のuntracked fileは、今回の統制文書
`CODEX_FINAL_INTEGRATED_AUDIT_PHASE1_TO_7_WITH_DASHBOARD.md`である。

### 3.2 tracked / staged inventory

- Product code、manifest、README、CHANGELOG
- 正本仕様、実装計画、旧audit instruction
- 24 local test suite
- 4既存docs
- `AGENTS.md`
- Phase 1 baseline Archive ZIP

`Archives/google-workspace-personal-work-os-v2_phase1-baseline_20260724.zip`は
36,354 bytes、15 entries、SHA-256
`CE8B2F2EA52904ECB372C5EF1B0D2456B1CC0C104FC66BF4A8B73BB2518E4995`
である。ZIP内に実secretは検出しなかったが、古いcodeをbinaryで重複保持する
ため、初回commitへ含める理由とscan方針を明示する必要がある。

### 3.3 Git hygiene

- `.gitignore`: 存在しない
- global excludes file: 存在しない
- 実`apps-script-v2/.clasp.json`: 存在しない
- `.clasp.json.example`: placeholderのみ
- `.env`、PEM、P12、PFX、credential file、log、tmp、OS junk: 検出なし
- `git diff --cached --check`: 2件
  - `AGENTS.md:358`: EOF blank line
  - `apps-script-v2/.clasp.json.example:5`: EOF blank line

staged文書の次の2箇所には利用者名を含むローカル絶対pathがある。

- `docs/V2_PHASE_1_AUDIT_AND_PHASE_2_TO_4_REPORT.md:244`
- `docs/V2_PHASE_1_AUDIT_AND_PHASE_2_TO_4_REPORT.md:370`

credentialではないが、Repository共有前に一般化すべき環境情報である。

### 3.4 Secret scan

working tree、Git index、ZIP内部を分けてpattern scanした。

| Pattern | Actual hit |
|---|---:|
| Google API key | 0 |
| OpenAI key | 0 |
| OAuth token | 0 |
| GitHub / Slack / AWS token | 0 |
| JWT | 0 |
| Private key | 0 |
| Real Authorization header | 0 |
| Real `.clasp.json` Script ID | 0 |
| Real Spreadsheet URL / ID | 0 |
| Real Calendar ID | 0 |
| Real Gmail Message ID in Repository fixture | 0 |

secret redaction test文字列、`example.invalid`、禁止patternを記述した仕様書は
false positiveとして除外した。gitleaks、trufflehog、detect-secretsは環境に
存在せず、専用scannerとGit history scanは未実施である。Git history自体は
存在しない。

## 4. Sources Reviewed

全文または対象範囲を確認した主要資料は次のとおり。

- `CODEX_FINAL_INTEGRATED_AUDIT_PHASE1_TO_7_WITH_DASHBOARD.md`
- `V2_IMPLEMENTATION_SPEC.md`
- `V2_CODEX_IMPLEMENTATION_PLAN.md`
- `CODEX_PHASE1_AUDIT_PHASE2_TO_4_INSTRUCTIONS.md`
- `CODEX_PHASE5_TO_7_INSTRUCTIONS.md`
  - local Downloadsに存在し、Repositoryには含まれない
- `docs/V2_REQUIREMENTS_TRACEABILITY.md`
- `docs/V2_PHASE_1_AUDIT_AND_PHASE_2_TO_4_REPORT.md`
- `docs/V2_PHASE_5_TO_7_IMPLEMENTATION_REPORT.md`
- `docs/V2_MANUAL_ACCEPTANCE_GUIDE.md`
- `apps-script-v2/README.md`
- `apps-script-v2/CHANGELOG.md`
- `apps-script-v2/`の全code、manifest
- `tests/`の全24 suite
- Phase 1 baseline Archive

今回の仕様優先順位は次のとおりとした。

1. `V2_IMPLEMENTATION_SPEC.md`
2. `V2_CODEX_IMPLEMENTATION_PLAN.md`
3. Requirements Traceability
4. Phase別実装報告
5. README・CHANGELOG
6. 現行code
7. v1資料

`CURRENT_STATUS.md`、`DECISIONS.md`、`PROJECT_CONTEXT.md`、`MASTER_PLAN.md`、
旧設計資料一式、`CODEX_PHASE5_TO_7_INSTRUCTIONS.md`はRepository内に存在
しない。Dashboard判定はRepository内の上位2正本だけで十分に確定できるが、
第三者による過去Decisionの再現性は不足している。

## 5. Test Reproduction

### 5.1 実行環境と方法

- Node: Codex bundled Node `v24.14.0`
- 実行対象: `tests/*.js` 24ファイル
- 実行方式: ファイル名順に全suiteを個別実行し、各JSON summaryを集計
- Nodeが通常PATHにないため、bundled runtimeを明示指定

実行の要旨:

```powershell
$node = Join-Path $env:USERPROFILE `
  '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
Get-ChildItem tests -Filter '*.js' |
  Sort-Object Name |
  ForEach-Object { & $node $_.FullName }
```

### 5.2 Suite別結果

| Suite | PASS | FAIL | SKIPPED |
|---|---:|---:|---:|
| baseline_upgrade_test | 2 | 0 | 0 |
| phase1_audit_test | 23 | 0 | 0 |
| phase1_local_test | 15 | 0 | 0 |
| phase2_local_test | 27 | 0 | 0 |
| phase3_independent_test | 34 | 0 | 0 |
| phase3_local_test | 37 | 0 | 0 |
| phase4_harness_local_test | 15 | 0 | 5 |
| phase4_independent_test | 11 | 0 | 0 |
| phase4_local_test | 22 | 0 | 0 |
| phase4_performance_test | 7 | 0 | 0 |
| phase5_harness_local_test | 8 | 0 | 1 |
| phase5_local_test | 32 | 0 | 0 |
| phase5_schema_extension_test | 7 | 0 | 0 |
| phase5_worker_integration_test | 4 | 0 | 0 |
| phase6_harness_local_test | 8 | 0 | 2 |
| phase6_local_test | 41 | 0 | 0 |
| phase6_performance_reliability_test | 10 | 0 | 0 |
| phase6_worker_integration_test | 16 | 0 | 0 |
| phase7_harness_local_test | 8 | 0 | 2 |
| phase7_local_test | 18 | 0 | 0 |
| phase7_performance_reliability_test | 10 | 0 | 0 |
| phase7_recovery_integration_test | 11 | 0 | 0 |
| phase7_schema_extension_test | 8 | 0 | 0 |
| phase7_security_test | 10 | 0 | 0 |
| **Total** | **384** | **0** | **10** |

### 5.3 Static checks

| Check | Result |
|---|---|
| `.gs` syntax | 20 PASS / 0 FAIL |
| manifest JSON parse | PASS |
| runtime | V8 |
| timezone | Asia/Tokyo |
| OAuth scope count | 7 |
| `UrlFetchApp` in production `.gs` | 0 |
| `script.external_request` | 0 |
| `15_Dashboard.gs` | NOT FOUND |
| production `createProductionExternalAdapter` definition | NOT FOUND |
| real `.clasp.json` | NOT FOUND |
| `getLastRow()` in production `.gs` | 0 |
| `SpreadsheetApp.flush()` | 1、Schema構築境界のみ |

manifest scope:

1. `calendar.app.created`
2. `calendar.calendarlist.readonly`
3. `gmail.modify`
4. `script.container.ui`
5. `script.scriptapp`
6. `spreadsheets.currentonly`
7. `userinfo.email`

Advanced ServicesはGmail v1とCalendar v3である。

### 5.4 Coverage評価

強いローカルcoverage:

- production `.gs`をVMへ読み込んだRepository、Worker、Adapter、Retryの動的試験
- claim、checkpoint、resume、5/15/60分、4 attempt、DEAD、manual retry
- Message、Task、classification、Outbox、Eventのidempotency
- Trigger property/delete failure、stale ID、duplicate、state write failure
- soft budget、pagination、cursor replay、provider suppression
- secret、raw ID、formula、strict Schema、Prompt injectionのnegative fixture

重要な限界:

- Phase 5/6/7 integrationは過去Phase test fixtureを連鎖再利用する。
- `tests/phase6_worker_integration_test.js:225-251`は、Repositoryにない
  `createProductionExternalAdapter()`をtest側で注入して
  “production-shaped”経路を成功させる。実production factoryの存在証明ではない。
- Dashboardの存在・集計・更新menu・性能を検査するtestはない。
- Phase 7 testはWorkerがDashboardを呼ばないことをPASS条件にするだけである。
- promotions/social等の自動候補除外、`手動/取込`優先、Runtime settings、
  current Quick Diagnostic enable Gateを検査するtestがない。
- performance suiteはstatic regexとFake clock中心で、実latency、quota、memory、
  scheduler、Lock競合を測らない。
- Apps Script Data Validation、Protection、timezone、Trigger UID、Advanced Service、
  eventual consistency、6分上限はFakeで代替できない。

Test担当の独立source/coverage reviewではNodeが通常PATHにないため再実行を
完了できなかったが、主監査ではbundled Nodeを特定し、上記384件を実行している。

## 6. Phase 1〜7 Completion

| Phase | 判定 | 主な根拠 | 実環境境界 |
|---:|---|---|---|
| 1 | COMPLETE WITH EXTERNAL VALIDATION PENDING | 10 Sheet、43列Task Schema、logical empty row、Setup、Repository、version metadataをlocal検証 | Data Validation、Protection、実Spreadsheet runtimeは未検証 |
| 2 | COMPLETE WITH EXTERNAL VALIDATION PENDING | bounded manual Gmail、Message State、Stable Thread Key、Preprocessor、label境界を実装 | 実Gmail、Advanced Service、label hierarchyは未検証 |
| 3 | PARTIAL | Mock AI、strict Action、Review、pending、manual field policyは実装。必須installable edit triggerなし | 実onEdit、実Sheet edit eventは未検証 |
| 4 | COMPLETE WITH EXTERNAL VALIDATION PENDING | dedicated Calendar、Outbox、owned marker、CRUD、Calendar-only resumeを実装 | 5件のreal Calendar/OAuth testがSKIPPED。Phase 3依存あり |
| 5 | PARTIAL | provider-neutral contract、Mock HTTP、strict response/provenance/error分類のみ。実Provider codeなし | Provider、approval、credential、HTTPすべて未実装・未実行 |
| 6 | PARTIAL | Trigger lifecycle、watermark、batch、checkpoint、fail closedは実装。production AI factory不在、候補filter/gate不足 | 実Trigger/Gmail未実行。本番vertical path到達不能 |
| 7 | PARTIAL | Retry、DLQ、manual retry、`SYS/失敗`、Quick/Deepは実装。必須Dashboardと一部Deep/retention不足 | real retry/diagnostic未実行 |

Phase 4の機能単体は`COMPLETE WITH EXTERNAL VALIDATION PENDING`だが、順次Gate
としてはPhase 3の未完了を越えて完全通過扱いにできない。

## 7. Architecture

### 7.1 良好な点

- Setup、Runtime、Diagnostic、Migrationの責務を概ね分離。
- RuntimeからSheet layout、Data Validation、Protectionを変更しない。
- Diagnosticはrepair、Dashboard write、Gmail検索、AI通信、Calendar同期を
  実行しない。
- Task追記判定に`getLastRow()`を使用せず、内部IDと論理空行を使用。
- 1 run内でTask、Message、Outbox、Error contextを原則再利用。
- v2 extensionは認識済みSchemaだけをappend-onlyで拡張し、未知Schemaを
  fail closed。
- Calendarは専用Calendarとinstance/task markerで所有境界を検証。
- Trigger enable/disableはenabled、desired、canonical trigger IDを分離。
- Code / Schema / AI Schema / Migration Versionは値として整合。

### 7.2 主な不整合

- `設定`SheetはseedされるがRuntime設定源ではない。
- installable edit triggerがなく、manual field保護が利用者の追加menu操作に依存。
- 自動候補policyが正本より狭く実装されている。
- enable readinessは現在のQuick Diagnostic全checkと同一ではない。
- Setup S99が`STOP_BEFORE_PHASE7`を返し、versionと意味的に不整合。
- Dashboard、retention、Deep Diagnosticの一部が欠落。

## 8. AI Boundary

要求された境界を次のように分離する。

```text
Code implementation:
  Provider-neutral contract, strict schema, provenance, error taxonomy only
  Status: PARTIAL

Mock HTTP Transport:
  Implemented and locally tested

Real provider connection:
  NOT IMPLEMENTED / NOT EXECUTED

Company approval:
  NOT CONFIRMED

Credential storage approval:
  NOT CONFIRMED
```

根拠:

- `apps-script-v2/00_Config.gs:45-53`はMock、外部接続OFF、外部Provider/model空、
  approval/auth false。
- `apps-script-v2/07_AiAdapter.gs:829-1210`は注入型transportとcredential
  providerを受けるcontract。
- 実transportは`MockHttpTransport`だけ。
- `createProductionExternalAdapter`はexportされない。
- `apps-script-v2/12_Triggers.gs:179-183`と
  `apps-script-v2/18_Worker.gs:1623-1639`は
  `REAL_AI_TRANSPORT_NOT_IMPLEMENTED`で停止する。
- manifestにexternal-request scopeがない。

このfail-closedは安全であり、架空endpoint、model、credentialを作らなかった判断は
正しい。ただしPhase 5 Gateの完了ではない。

さらに、現在の自動WorkerはScript Lock内でGmail、AI、Calendarの外部I/Oを
行う。実transportを単純追加すると、HTTP待機中もLockを保持する。実Provider
実装時はclaim/checkpointをLock内、外部I/OをLock外、結果commitを再Lock後の
version/hash検証付きに分離しなければならない。

Prompt injectionについては、canonical request allowlist、strict output Schema、
semantic validation、URL/credentialによる設定変更不可をlocal fixtureで確認した。
実modelのinstruction hierarchy、semantic injection耐性、provider error payloadは
未検証である。

## 9. Automation

### 9.1 production call chain

```text
runScheduledWorker()
→ enabled && desired
→ canonical trigger UID
→ prerequisite readiness
→ WorkOsWorker.processAutomaticBatch()
→ createProductionExternalAdapter()
→ Gmail / AI / Task / labels / Calendar
```

factoryがないため、現在はGmail検索前に停止する。Mockをproduction Workerへ
渡す経路も拒否される。

良好な点:

- 初期値OFF。
- Setupは5分Triggerを作らない。
- 利用者の明示enableだけがTrigger作成へ進む。
- 本instanceのhandler Triggerだけを管理する。
- flag commit失敗時のrollback、duplicate cleanup、noncanonical event拒否あり。
- fixed upper bound、24時間overlap、page cursor、Message ID dedupあり。
- due retryを新規Inboxより先に処理する。

未完了:

- promotions、social、明らかなnewsletter、Calendar自動通知の除外。
- `手動/除外`の次に`手動/取込`を優先する順序。
- current Quick Diagnostic全checkをenable Gateにすること。
- editable SettingsのRuntime反映。
- 実ProviderとLock外I/O。

## 10. Retry / Dead Letter / Diagnostic

### 10.1 Retry / DLQ

状態は次のdurable checkpointを使用する。

```text
DISCOVERED
→ CLAIMED
→ PREPROCESSED
→ CLASSIFIED
→ TASKS_WRITTEN
→ CALENDAR_PENDING
→ DONE
```

retryable failure:

```text
initial failure → 5 minutes
retry 1 failure → 15 minutes
retry 2 failure → 60 minutes
retry 3 failure → DEAD
```

確認した良好な性質:

- soft budget停止はattemptを消費せず、直前checkpointから再開。
- 保存済みclassification hash/provenanceを検証し、不必要なAI再実行を抑止。
- Taskは`origin_key` upsertで重複を防止。
- Calendar-only resumeはGmail、AI、Taskを再実行しない。
- DLQはdomain-separated hash参照を使用。
- manual retryは内部`err_`/`dl_` ID、DEAD、retryable、readiness、
  checkpointを再確認。
- retry itemは10/run、manual selectedは5件に制限。
- provider-wide suppressionとstale claim回収あり。

重大なstate-machineまたは重複作成bugは静的・local監査で検出しなかった。
実Trigger scheduler、Sheets/Properties非原子性、Calendar eventual consistencyは
未検証である。

### 10.2 Diagnostic

Quick/Deepはread-only、chunk、soft budgetを持ち、外部通信や修復を行わない。
一方、Deep Diagnosticは現在、Message、Outbox、Error、provider suppressionの
限定countが中心で、正本が求める次を満たさない。

- Task / Message / Outbox相互整合
- Event ID / Task marker限定照合
- retention対象件数
- Deep実行時のSchema / Validation drift

Quick 60秒、Deep 180秒のApps Script実測は未実施である。

## 11. Dashboard

### 11.1 判定

```text
15_Dashboard.gs: NOT IMPLEMENTED
Phase 7 requirement: YES
Phase 8 feature: NO
Finding severity: Medium
Pilot blocker: YES
```

根拠:

- Spec in-scope: `V2_IMPLEMENTATION_SPEC.md:77`
- file構成: `V2_IMPLEMENTATION_SPEC.md:174`
- 責務: `V2_IMPLEMENTATION_SPEC.md:206`
- 最低表示と`refreshDashboard()`:
  `V2_IMPLEMENTATION_SPEC.md:1222-1239`
- menu:
  `V2_IMPLEMENTATION_SPEC.md:1241-1258`
- Phase順:
  `V2_CODEX_IMPLEMENTATION_PLAN.md:151-153`
- Phase 7目的・対象・Gate:
  `V2_CODEX_IMPLEMENTATION_PLAN.md:1066-1203`
- Phase 8は配布・別環境受入:
  `V2_CODEX_IMPLEMENTATION_PLAN.md:1205`以降

現行実装:

- `apps-script-v2/15_Dashboard.gs`: 存在しない
- `apps-script-v2/01_TypesAndSchemas.gs:142-146`:
  `metric_key`、`metric_value`、`metric_note`の空Schemaのみ
- `apps-script-v2/03_SheetBuilder.gs:607-612`:
  Setup後、その空Dashboardをactiveにする
- `apps-script-v2/Menu.gs`: refresh項目なし
- Dashboard機能test: なし

Traceability D-030、P7-SCP-001、Phase 5〜7 Report、README末尾は、
過去のPhase 5〜7 task-specific instructionを根拠にDashboardをPhase 8へ
延期した。今回の明示的優先順位では、上位のSpec/Planが優先される。この
矛盾は推測で補完せず、Phase 7を`PARTIAL`へ戻す。

### 11.2 最小Remediation境界

必要なのは軽量運用Dashboardであり、次は含めない。

- Work Block
- 日次・週次レビュー
- スケジュール最適化
- 高度な面談・ブリーフ機能

最低表示:

- automation ON/OFF
- 最終成功・最終失敗
- 当日処理数
- 要確認、期限超過、本日、7日以内、返信待ち
- retry待ち、Dead Letter
- Calendar同期待ち
- 未解決error
- AI provider
- system health / Quick Diagnostic結果

更新は明示menuを初期方式とし、WorkerまたはDiagnosticからDashboard writeを
呼ばない。外部通信なし、count/status/timeのみ、soft budget、bounded read、
1回のbatch write、idempotent key upsertが必要である。

## 12. Security

### 12.1 良好な境界

- current RepositoryとZIPに実secretなし。
- external-request、Drive、mail send、広域Calendar scopeなし。
- Gmail Message/Thread IDをError/DLQではdomain-separated hash化。
- Error/DLQは本文、件名、送信者、attachment、AI payload、credential、
  stack traceを保存しない。
- manual retryは内部IDとreadinessを再検証。
- Diagnosticはcount、boolean、status中心でraw IDを返さない。
- raw Gmail/Calendar IDは機能上必要な非表示Task/Message/Outbox/Property内だけ。
- actual provider factory不在時は送信前に停止。

### 12.2 未解決

`apps-script-v2/17_Utilities.gs:69-85`のredactorはBearer、Authorization、
key名付き値を除去するが、単独で現れる高確度credential形式を検出しない。
実AIがメール内secretをTask titleへ反復した場合、Task Sheetや専用Calendarへ
保存される可能性がある。実Provider開始前にhigh-confidence standalone pattern、
隔離/Review policy、全sink negative testを追加すべきである。

実Providerのsystem prompt、untrusted-data delimiter、semantic prompt injection、
Google serviceの実error payload、Stackdriver表示、OAuth consentは未検証である。

## 13. Performance

### 13.1 良好な点

- production `.gs`で`getLastRow()` 0件。
- `getDataRange()`はSetup/Sheet構築の2件。
- `flush()`はSchema作成境界の1件。
- row拡張は100行単位。
- auto runの主要contextは各1回。
- Gmail list paginationは最大4 page、cursor guardあり。
- Calendarは1 job/run、Event限定検索。
- Retry、Message、Thread、Action、soft budgetに上限あり。

### 13.2 重要な境界

1. 自動Workerは最大210秒のScript Lock内で外部I/Oを行う。
2. AI timeout 60秒をremaining budgetへ縮めない。
3. Setup 120秒budgetはstage前だけ確認し、S60/S90へ同じbudgetを渡さない。
4. CalendarList全page走査にpage ceiling、repeated token guard、budgetがない。
5. 24時間overlap内の最大100 Threadを、既知Messageだけでも毎回metadata展開
   し得る。
6. 新規候補判定前にTask/Message/Outbox/Error全contextを読む。
7. Run History appendは履歴全長の主キー列scanに比例する。

最大call数は実測ではないが、現行上限から1 auto runでGmail系約155 call、
新規Messageゼロでも約105 callになり得る。5分間隔の実quota、latency、210秒
境界は非機密sandboxで計測しなければならない。

## 14. Operational UX

### 14.1 良好な点

- Review専用tabを作らず、`タスク一覧`同一行に統合。
- EditHandlerはGmail/AI/Calendarを直接呼ばない。
- Automation初期OFF、enable/disable、Calendar sync、retryに確認dialogあり。
- Retry対象数とCalendar job数を制限。
- 日本語見出しと内部IDを分離。

### 14.2 個人パイロット前の問題

- Setup後の初期画面が空Dashboard。
- Task編集は「セル編集 → 対象セルを選び直す → menu反映」の二段階。
- 未反映状態を画面上で識別できない。
- Setup確認dialogはGmail labelと専用Calendar作成を説明せず、
  `continueSetup()`には確認がない。
- `設定`Sheetは効くように見えるがRuntimeが読まない。
- 20 `.gs`、manifest、Advanced Servicesを手動配置する。
- menuは20 command＋separatorの単一階層で、7件がPhase別test。
- Diagnostic JSONはalertへ直接表示し、12,000文字で切り詰める。

live Google Workspace UIを利用できないため、列幅、固定行、hidden列、dialog、
1920×1080、実操作時間は`UNVERIFIED`である。

## 15. Findings

### F-001 — High — 実Provider/credential/transportとLock-safe production pathがない

- Category: AI / Automation / Reliability
- Affected files:
  - `apps-script-v2/00_Config.gs`
  - `apps-script-v2/07_AiAdapter.gs`
  - `apps-script-v2/12_Triggers.gs`
  - `apps-script-v2/18_Worker.gs`
  - `apps-script-v2/appsscript.json`
- Evidence:
  - production factory定義0件
  - `REAL_AI_TRANSPORT_NOT_IMPLEMENTED`
  - external-request scopeなし
  - Script Lock内のGmail/AI/Calendar I/O
- Expected behavior:
  - 承認済みProvider Adapter、credential loader、network transport
  - Lock外I/O、再Lock後CAS/checkpoint
- Actual behavior:
  - Mock/contractのみ。productionは安全停止。
- Impact:
  - 本番自動運転を開始できない。factoryだけ追加すると長時間Lockを保持する。
- Verification:
  - static call-chain review、production-shaped testのinjection確認
- Recommended remediation:
  - Provider/approval Decision後、AdapterとLock-safe orchestrationを分離実装。
- Phase / timing:
  - Phase 5/6。production automation前必須。

### F-002 — High — 自動Gmail候補のscope/優先policyが未実装

- Category: Privacy / Gmail / Automation
- Affected files:
  - `apps-script-v2/00_Config.gs`
  - `apps-script-v2/05_GmailGateway.gs`
  - `apps-script-v2/18_Worker.gs`
  - Phase 6 tests
- Evidence:
  - Spec `V2_IMPLEMENTATION_SPEC.md:511-520`
  - Plan `V2_CODEX_IMPLEMENTATION_PLAN.md:1028-1051`
  - codeはINBOX/SPAM/TRASH/`手動/除外`だけを判定
- Expected behavior:
  - promotions/social/newsletter/Calendar通知の原則除外
  - `手動/除外`最優先、次に`手動/取込`
- Actual behavior:
  - 上記filterとpriorityがない。
- Impact:
  - 実AI有効化時に不要なメールを外部処理対象へ広げる。production blocker。
- Verification:
  - code path review、該当test不在確認
- Recommended remediation:
  - system category filterを実装し、newsletter/Calendar規則は承認後に定義。
- Phase / timing:
  - Phase 6。実Provider接続前必須。

### F-003 — Medium — standalone credentialのruntime redaction gap

- Category: Security / Data loss prevention
- Affected files:
  - `apps-script-v2/17_Utilities.gs`
  - `apps-script-v2/07_AiAdapter.gs`
  - `apps-script-v2/08_TaskRepository.gs`
  - `apps-script-v2/10_CalendarSync.gs`
- Evidence:
  - redactorはlabel付きkey/valueを中心に検出。
- Expected behavior:
  - 高確度credentialをTask、Calendar、Log、DLQへ保存しない。
- Actual behavior:
  - 実AIが単独credential形式をtitleへ反復した場合の共通遮断がない。
- Impact:
  - 実Provider運用時のSheet/Calendar二次保存リスク。
- Verification:
  - redactor source review、sink tracing
- Recommended remediation:
  - high-confidence standalone pattern、Review/隔離、全sink test。
- Phase / timing:
  - 個人パイロット前。

### F-004 — Medium — installable edit triggerがなくTask編集が確実に捕捉されない

- Category: Specification / Data integrity / UX
- Affected files:
  - `apps-script-v2/02_Setup.gs`
  - `apps-script-v2/11_EditHandler.gs`
  - `apps-script-v2/12_Triggers.gs`
  - `apps-script-v2/Menu.gs`
  - `apps-script-v2/16_Diagnostics.gs`
- Evidence:
  - Spec `V2_IMPLEMENTATION_SPEC.md:928-939`
  - S80は`NO_TRIGGER`
  - Diagnosticは`EXPLICIT_MENU_ONLY`をPASS扱い
- Expected behavior:
  - `タスク一覧`の利用者編集を狭いinstallable edit triggerで冪等捕捉。
- Actual behavior:
  - 選択範囲menuを毎回実行する。
- Impact:
  - `manual_fields`、normalization、row version、Outboxが見かけ上未反映になる。
- Verification:
  - Setup/EditHandler/Menu/Diagnostic/test review
- Recommended remediation:
  - owner確認付きedit trigger。time-driven Triggerとは分離し、menuはfallback。
- Phase / timing:
  - Phase 3。個人パイロット前。

### F-005 — Medium — Phase 7必須Dashboardが未実装

- Category: Scope / Operational visibility
- Affected files:
  - missing `apps-script-v2/15_Dashboard.gs`
  - `apps-script-v2/Menu.gs`
  - `apps-script-v2/99_TestHarness.gs`
  - Phase 7 tests、README、Traceability、reports
- Evidence:
  - Spec/PlanのPhase 7要件、file不存在、refresh/menu/test 0件
- Expected behavior:
  - 明示更新の軽量運用Dashboard。
- Actual behavior:
  - 空の3列Schemaだけを初期表示。
- Impact:
  - failure、retry、停止、期限、Reviewを日常画面で把握できない。
- Verification:
  - file inventory、source priority review、test coverage review
- Recommended remediation:
  - `V2_REMEDIATION_PLAN.md`の独立Dashboard WP。
- Phase / timing:
  - Phase 7。個人パイロット前。

### F-006 — Medium — SettingsとAutomation readinessのcontrol planeが実状態と一致しない

- Category: Configuration / Readiness
- Affected files:
  - `apps-script-v2/03_SheetBuilder.gs`
  - `apps-script-v2/12_Triggers.gs`
  - `apps-script-v2/16_Diagnostics.gs`
  - `apps-script-v2/18_Worker.gs`
- Evidence:
  - editable Settingsはseedのみ。
  - Workerは`WorkOsConfig`定数を直接使用。
  - enableはfull current Quick Diagnosticを呼ばない。
- Expected behavior:
  - typed settings snapshotを1 runで1回読み、現在のread-only preflight合格後にenable。
- Actual behavior:
  - Sheet変更が無効で、Validation/Protection/duplicate等の一部driftをenable時に
    検出しない。
- Impact:
  - 利用者が安全上限を変更したと誤認し、drift環境でTriggerを作成し得る。
- Verification:
  - Repository-wide setting read search、readiness/diagnostic diff
- Recommended remediation:
  - Runtime settings contractか編集不可化、共通pure preflight。
- Phase / timing:
  - 個人パイロット前。

### F-007 — Medium — soft budgetとAPI call上限が一部経路で保証されない

- Category: Performance / Reliability
- Affected files:
  - `apps-script-v2/02_Setup.gs`
  - `apps-script-v2/05_GmailGateway.gs`
  - `apps-script-v2/10_CalendarSync.gs`
  - `apps-script-v2/13_LogAndDeadLetter.gs`
  - `apps-script-v2/16_Diagnostics.gs`
  - `apps-script-v2/18_Worker.gs`
- Evidence:
  - Setup budgetをS60/S90へ伝播しない。
  - CalendarListにpage ceiling/token loop/budgetなし。
  - 24時間overlapの最大100 Threadを毎run展開し得る。
  - candidate確定前に全contextを読む。
- Expected behavior:
  - end-to-end budget、bounded page、call budget、lazy context。
- Actual behavior:
  - 120/210秒とquotaを実環境で保証できない。
- Impact:
  - Setup超過、Gmail quota、Lock競合、5分run飽和。
- Verification:
  - static path/call-bound review。実測はNOT EXECUTED。
- Recommended remediation:
  - budget伝播、token guard、call metrics、lazy load、history cursor、sandbox実測。
- Phase / timing:
  - 個人パイロット前、少なくとも安全上限の実証必須。

### F-008 — Medium — 初回Git release boundaryとsecret予防統制が未確定

- Category: Git / Release governance
- Affected files:
  - Git index
  - missing `.gitignore`
  - `apps-script-v2/.clasp.json.example`
  - baseline ZIP
  - staged reports
- Evidence:
  - HEADなし、57 files全Added、remoteなし、`.gitignore`なし。
  - local path 2件、binary Archive、whitespace 2件。
- Expected behavior:
  - allow-listされたclean initial commitとsecret-prone fileのignore。
- Actual behavior:
  - history/rollbackなし。将来の実`.clasp.json`等もignoreされない。
- Impact:
  - 共有・初回commit時の誤混入と監査baseline欠落。
- Verification:
  - Git status/index/archive/secret scan
- Recommended remediation:
  - 初回commit前の独立Git hygiene WP。現在はcommitしない。
- Phase / timing:
  - 次回修正後、初回commit前。

### F-009 — Medium — Setup consent/resumeが外部副作用を実行時に説明しない

- Category: Operational UX / Consent
- Affected files:
  - `apps-script-v2/Menu.gs`
  - `apps-script-v2/02_Setup.gs`
  - `apps-script-v2/README.md`
- Evidence:
  - setup dialogは空Sheet/Migrationのみ説明。
  - continueに確認なし。
  - S50はGmail label、S60は専用Calendarを作成。
- Expected behavior:
  - 実行前に作成対象、作成しない対象、Automation OFF、次stageを表示。
- Actual behavior:
  - 外部副作用はREADMEを読まないと分からない。
- Impact:
  - Setup再開時の同意と期待状態が不明確。
- Verification:
  - menu/setup/readme path review
- Recommended remediation:
  - stage-aware consentと短い日本語結果/次操作。
- Phase / timing:
  - 個人パイロット前。

### F-010 — Low — Deep Diagnostic、retention、長期append設計が未完成

- Category: Diagnostics / Retention / Long-run performance
- Affected files:
  - `apps-script-v2/00_Config.gs`
  - `apps-script-v2/03_SheetBuilder.gs`
  - `apps-script-v2/13_LogAndDeadLetter.gs`
  - `apps-script-v2/16_Diagnostics.gs`
- Evidence:
  - Specの365/365/90日設定とretention対象件数なし。
  - DeepのTask/Outbox/Event整合不足。
  - Run History appendは主キー列全長scan。
- Expected behavior:
  - 非破壊のretention設定/候補countとbounded append。
- Actual behavior:
  - 自動削除はないが、長期増加を把握・制御できない。
- Impact:
  - 長期pilot/少人数展開で容量・性能・policy適合性が劣化。
- Verification:
  - source/spec comparison
- Recommended remediation:
  - 会社policy確認後、read-only候補count。自動削除は別承認。
- Phase / timing:
  - 長期pilotまたは少人数展開前。

### F-011 — Low — Phase metadataとin-sheet guideが古い

- Category: Metadata / Documentation
- Affected files:
  - `apps-script-v2/02_Setup.gs`
  - `apps-script-v2/03_SheetBuilder.gs`
  - related tests
- Evidence:
  - S99が`STOP_BEFORE_PHASE7`。
  - Settings/GuideにPhase 1/将来Phase表現が残る。
- Expected behavior:
  - 実際のGate状態と一致するmetadata/guide。
- Actual behavior:
  - Code VersionはPhase 7だが、結果文字列はPhase 7直前。
- Impact:
  - Runtime障害はないが、利用者と監査証跡を誤誘導。
- Verification:
  - version/seed/test static review
- Recommended remediation:
  - Phase 7 remediation完了時にversioned system-owned rowを更新。
- Phase / timing:
  - Dashboard remediationと同時。

### F-012 — Informational — Repository内の統制資料chainが自己完結していない

- Category: Auditability
- Affected files:
  - TraceabilityとPhase reports
- Evidence:
  - 参照されるPhase 5〜7 instruction、MASTER_PLAN系資料がRepositoryにない。
- Expected behavior:
  - 第三者がDecision優先順位と過去GateをRepositoryだけで再現できる。
- Actual behavior:
  - local external fileと過去sessionの説明へ依存。
- Impact:
  - Runtime影響なし。引継ぎ・再監査の再現性低下。
- Verification:
  - Repository file inventory
- Recommended remediation:
  - 機密除去済み統制資料を含めるか、Reportを自己完結化。
- Phase / timing:
  - 初回共有前。

## 16. Skipped / External Validation

### 16.1 SKIPPED 10件

| ID | 内容 | Primary classification | 現在の追加条件 |
|---|---|---|---|
| P4-R01 | Dedicated Calendar setup | 実Workspaceでのみ可能 | 非機密sandbox |
| P4-R02 | Calendar Event CRUD | 実Workspaceでのみ可能 | 専用Calendar |
| P4-R03 | OAuth scope consent | 実Workspaceでのみ可能 | 組織policy |
| P4-R04 | Primary Calendar unchanged | 実Workspaceでのみ可能 | 実Calendar |
| P4-R05 | Calendar failure resume | 実Workspaceでのみ可能 | failure injection |
| P5-R01 | Real provider connection | Provider確定後に可能 | 現在はcode不足もあり |
| P6-R01 | Real time-driven Trigger | 現在のcode不足により実施不能 | F-001解消後にWorkspace |
| P6-R02 | Real Gmail automatic scan | 現在のcode不足により実施不能 | F-001/F-002解消後にWorkspace |
| P7-R01 | Real Dead Letter retry | 実Workspaceでのみ可能 | Gmail/Calendar failure |
| P7-R02 | Real Diagnostic runtime | 実Workspaceでのみ可能 | representative row count |

排他的なprimary分類:

```text
実Workspaceでのみ可能: 7
Provider確定後に可能: 1
現在のコード不足により実施不能: 2
Phase 8で予定: 0
```

P5-R01はProvider確定だけで即実行できず、Adapter/transport/credential codeが
必要である。P6の2件もcode修正後には実Workspace検証が必要である。

### 16.2 その他のUnverified

- Apps Script Data Validation、Protection、filter、hidden columns
- Script/Document Lockの実競合
- Trigger重複event、scheduler遅延、UID
- Gmail/Calendar quota、429、pagination、eventual consistency
- Quick 60秒、Deep 180秒、Worker 210秒、Setup 120秒
- 実Provider prompt injection、error payload、credential storage
- Google Workspace live UIと操作時間

## 17. Go / No-Go

| Stage | 判定 | 根拠 / Blocker |
|---|---|---|
| ローカルコード完成 | NO-GO | Phase 3/5/6/7がPARTIAL。High 2、Medium 7が未解消 |
| 非本番Google Workspace Sandbox受入 | CONDITIONAL GO | 完全架空データ、Automation OFF、実Providerなし、remediation検証目的に限定 |
| たぬきさま個人の実業務パイロット | NO-GO | Provider path、候補scope、Dashboard、edit capture、settings/gate、実環境受入が未完了 |
| 少人数限定展開 | NO-GO | 個人pilot未通過、Git/deploy/retention/UX未整備 |
| 部内展開 | NO-GO | 会社承認、credential、実運用実績、配布統制、Phase 8受入が未完了 |

Dashboard未実装はlocal completionと個人pilotのblockerである。技術担当者の
限定sandboxではDashboardなしでも下位層を検証できるが、Phase 7受入PASSには
できない。少人数・部内展開では運用障害の見逃しにつながるため不可である。

## 18. Next Actions

1. `docs/V2_REMEDIATION_PLAN.md`のHigh Work Packageから着手する。
2. Provider、auth、data policy、credential storage、課金、scopeを会社Decision
   として確定する。未確定ならMock-onlyを維持する。
3. 自動Gmail候補scopeを修正し、実AI送信前の対象mailを明示的に制限する。
4. standalone secret redaction、edit trigger、Dashboard、settings/preflight、
   budget/call bound、Setup consentを実装する。
5. 全24 regressionと新規negative/integration testを再実行する。
6. 初回Git commit前にallow-list、`.gitignore`、local path、Archive、whitespace、
   secret scanを処理する。
7. 非機密Google Workspace sandboxで10 SKIPPEDと追加性能/UX受入を実行する。
8. 個人pilot Gateを再監査する。

Phase 8へは進まない。

## 19. Limitations

- 実Google Workspaceへの接続・操作は行っていない。
- 実Provider、実endpoint、実model、実credentialを使用していない。
- 会社承認、credential storage approval、data retention policyは未確認。
- live UI、visual layout、1920×1080、実操作時間は未検証。
- 専用secret scannerは未導入。
- Git commit/historyがなく、history scanとcommit間比較は不可能。
- Repository外の過去統制文書chainは完全には再現できない。
- audit-only制約に従い、code、test、manifest、既存仕様書、Git indexを変更して
  いない。

## 20. Remediation implementation addendum — 2026-07-25

This addendum records the implementation session authorized after the
read-only audit. The original findings and evidence above remain the audit
baseline. Current code version is `2.8.0-prepilot`; Schema `2.2`, AI Schema
`2.0`, and Migration `0` are unchanged.

### 20.1 Finding disposition

| Finding | Local/code disposition | External or governance boundary |
|---|---|---|
| F-001 High | Code-remediable provider registry/factory boundary, lock-free external classification and CAS commit implemented; no Mock fallback | Provider/model/endpoint/auth/credential loader not decided or implemented; real connection `NOT EXECUTED`; production automation remains blocked |
| F-002 High | Gmail candidate policy, Message-scoped `手動/取込`, `手動/除外` precedence, promotions/social/system filtering, safe reason metrics and call cap implemented | Newsletter/Calendar-notification rule decisions pending and included in enable Gate; real Gmail `NOT EXECUTED` |
| F-003 Medium | High-confidence standalone credential redaction and Task/AI/Calendar/error sink tests implemented | Synthetic fixtures only; real credentials not used |
| F-004 Medium | Owner installable edit Trigger, canonical UID/source checks, idempotent setup and menu fallback implemented | Real installable event/owner authorization `NOT EXECUTED` |
| F-005 Medium | `15_Dashboard.gs`, explicit menu refresh, 17 aggregate metrics, budget and local 100/1,000/10,000-row tests implemented | Real Apps Script runtime and visual UX `NOT EXECUTED` |
| F-006 Medium | Protected typed Runtime Settings snapshot and shared current-state preflight used by Worker, Diagnostic and enable Gate | Real Validation/Protection/Trigger acceptance `NOT EXECUTED` |
| F-007 Medium | Setup and completed-stage budget propagation, remaining-budget S90, Calendar page/API boundary and token-cycle checks, Gmail refetch/call/time limit and safe metrics implemented | Real quota, latency and execution-time boundaries `NOT EXECUTED` |
| F-008 Medium | `.gitignore`, local-path cleanup and initial-commit hygiene checks prepared | Initial commit and branch could not be created because the managed environment denies writes under `.git`; no commit was fabricated |
| F-009 Medium | Setup/Continue consent names external side effects, next stage, automation-off and no-real-AI boundaries; result dialog shows status and next action first | Real Apps Script UI usability `NOT EXECUTED` |

### 20.2 Explicit AI boundary

```text
Code implementation: LOCAL PASS
Mock HTTP Transport: LOCAL PASS
Real provider connection: NOT EXECUTED
Company approval: NOT CONFIRMED
Credential storage approval: NOT CONFIRMED
```

No Provider, model, endpoint, authentication scheme, credential, or company
decision was inferred. `UrlFetchApp` and
`https://www.googleapis.com/auth/script.external_request` remain absent.

### 20.3 Gate impact

- Final local Regression is 29 suites, `444 PASS / 0 FAIL / 11 SKIPPED`;
  Apps Script syntax is `22 PASS / 0 FAIL`, and manifest JSON is valid.
- Independent Security re-review is `PASS — LOCAL/STATIC` with no remaining
  Critical/High/Medium finding. Real Workspace and Provider checks remain
  `NOT EXECUTED`.
- `TEST_MODE=true` is an explicit pre-pilot blocker:
  `TEST_MODE_ENABLED` prevents production automation enablement.
- Personal pilot remains `NO-GO` until real Workspace acceptance is executed,
  Git baseline is established, and any intended real Provider path receives
  the missing decisions and approvals.
- Phase 8 was not started.
