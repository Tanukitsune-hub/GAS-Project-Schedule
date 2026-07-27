# Google Workspace Personal Work OS v2

## Phase 1独立監査・Phase 2〜4実装報告

- 対象Repository: `GoogleSpreadsheet`
- 対象Version: Code `2.4.0-phase4` / Schema `2.0` / Migration `0`
- 判定日: 2026-07-24
- 対象範囲: Phase 1独立監査、Phase 2、Phase 3、Phase 4
- 対象外: Phase 5以降、実AI、通常Inbox巡回、本番Trigger、v1 Migration
- 判定原則: Local testとGoogle Workspace実環境testを分離し、実環境未実施をPASSとしない

主要な入力資料は`V2_IMPLEMENTATION_SPEC.md`、
`V2_CODEX_IMPLEMENTATION_PLAN.md`、
`CODEX_PHASE1_AUDIT_PHASE2_TO_4_INSTRUCTIONS.md`である。
Requirement単位の対応関係と採用した解釈は
`docs/V2_REQUIREMENTS_TRACEABILITY.md`を参照すること。

---

## 1. 結論

```text
Overall status: PASS WITH EXTERNAL VALIDATION PENDING
Phase 1 Audit: PASS WITH EXTERNAL VALIDATION PENDING
Phase 2: PASS WITH EXTERNAL VALIDATION PENDING
Phase 3: PASS WITH EXTERNAL VALIDATION PENDING
Phase 4: PASS WITH EXTERNAL VALIDATION PENDING
```

Phase 1で発見した破壊防止、排他制御、型安全性、Protection、
Diagnostic、redaction上の問題を修正した後にPhase 2、3、4を順に実装した。
各PhaseのローカルUnit、Integration、Negative、Idempotency、
Failure Recovery、Regressionおよび独立QAはPASSした。
最終ローカルRegressionは9 suites合計191 PASS / 0 FAILである。
Google Workspace実環境用の5件は`SKIPPED / NOT EXECUTED`として分離した。

Google Workspace実環境ではSheet UI、Advanced Gmail/Calendar Service、
OAuth、Protection、LockService競合、実行時間を検証していない。
このためOverallおよび各Phaseの判定は
`PASS WITH EXTERNAL VALIDATION PENDING`であり、実環境PASSではない。

Phase 5、実AI Adapter、Gemini接続、`UrlFetchApp`、通常Inbox巡回、
5分Trigger、installable/time-driven Trigger、v1 Migrationは実装していない。
本報告をもってPhase 4で停止する。

---

## 2. Phase 1監査結果

### 2.1 前回実装の妥当性

Phase 1の基本方針は妥当だった。
具体的には、10 Sheet構成、43列のTask Schema、内部列ID、
論理空行、100行単位拡張、段階Setup、冪等Mock Task、
読取中心のQuick Diagnostic、外部サービス非接続という基礎は維持できた。

一方、独立監査では「通常ケースが動くこと」と
「未知・競合・中断時にも破壊しないこと」の間に複数の不足が見つかった。
重大指摘を修正し、既存15 testに加えて独立23 testで再検証した。

### 2.2 発見した問題と修正

| 発見事項 | リスク | 採用した修正 | 結果 |
|---|---|---|---|
| 数式、Note、Data Validation、Protectionを持つSheetを空と誤認し得た | 未知データをv2 Setup対象にして変更する | 可視値以外もprobeし、未知の非空環境はSetup前に停止 | LOCAL PASS |
| 記録済みSetup stageを順序・実体確認なしに信頼し得た | 中断・Property改変後に不整合なstageから再開する | 完了stageを順序付きprefixとして検証し、各stageのpostconditionを確認 | LOCAL PASS |
| Task書込に一貫したScript Lockとstale-context検出が不足 | 二重行、lost update、row version不整合 | held-lock Context、書込直前の行比較、競合時safe stopを追加 | LOCAL PASS |
| Task ID、型、Enum、JSON、日時の読書き境界が十分に厳格でなかった | caller由来IDや不正型が永続化する | Repository所有ID、strict typed read/write validationを追加 | LOCAL PASS |
| 同一`origin_key`更新時にsource identityや利用者入力を変更し得た | Taskの出所や手動補正を破壊する | source identityをimmutable化し、changed-cell-only updateへ限定 | LOCAL PASS |
| 管理列・管理Sheetがwarning-only Protectionだった | 利用者が内部状態を直接変更できる | Header、管理列、管理Sheetを実行者限定Protectionへ変更 | LOCAL PASS / REAL NOT EXECUTED |
| Quick Diagnosticのschema幅、format、validation、hidden/protection検査が不足 | 壊れたSheetを正常と判定する | exact width、format、criteria、geometry、property、version検査を追加 | LOCAL PASS / REAL NOT EXECUTED |
| Diagnosticの大きな範囲検査にbudget境界が不足 | 60秒目標を超えて中断する | chunk処理とreserve付きsoft budgetを追加 | LOCAL PASS / REAL TIMING NOT EXECUTED |
| secret redactionが構造化token、Authorization、Cookie、URI credential等に不十分 | Logや例外へ機密断片が残る | allowlist logとadversarial redactionを拡張 | LOCAL PASS |
| Test expectationの一部がproduction定義へ近すぎた | 同じ誤りをtestが追認する | literal contract、negative、before/after fingerprintを持つ独立audit suiteを追加 | LOCAL PASS |

### 2.3 修正しなかった指摘

コード上のBlocker、High、Medium指摘は残していない。
Phase 1 Gateで追跡されたLow相当事項は、Data Validation、
Protection editor、LockService競合、実行時間等のGoogle Workspace実環境依存事項である。
具体的なコード欠陥として断定せず、Manual Acceptance待ちとして扱う。

installable edit triggerや自動Triggerは、便利さよりも今回の明示的な
no-trigger制約を優先して実装しなかった。

### 2.4 Google Workspace実環境未確認事項

- 実SheetでのData Validation、Checkbox、日付表示形式
- hidden Sheet、hidden column、Protectionとeditor制御
- Setup中断・再実行と既存入力保持
- Script Lockの実競合
- Quick Diagnosticの実行時間と読取専用性
- 式neutralization後の`Range.getFormula() === ''`

すべて`NOT EXECUTED`であり、PASSとは判定していない。

---

## 3. Phase別結果

| Phase | 判定 | 実装概要 | Local test | Real Workspace test | 残課題 |
|---|---|---|---|---|---|
| Phase 1 Audit | PASS WITH EXTERNAL VALIDATION PENDING | 安全なblank判定、staged Setup、Task Repository、Protection、Diagnostic、redactionを独立監査・修正 | 既存15/15、独立audit 23/23 PASS | NOT EXECUTED | Sheet UI、Protection、Lock、実時間 |
| Phase 2 | PASS WITH EXTERNAL VALIDATION PENDING | formal Gmail label、限定manual query、Message State、Stable Thread Key、Email Preprocessor、PREPROCESSED worker | 27/27 PASS | NOT EXECUTED | Gmail検索・label・OAuth・Message ID |
| Phase 3 | PASS WITH EXTERNAL VALIDATION PENDING | strict Mock AI、same-Sheet Review、pending変更、manual field保護、AI label、選択範囲edit適用 | production 37/37、independent 34/34 PASS | NOT EXECUTED | 実Gmail label、選択範囲UI、式判定 |
| Phase 4 | PASS WITH EXTERNAL VALIDATION PENDING | 専用Calendar、Outbox、Event CRUD、CALENDAR checkpoint、Calendar-only retry、S60/S80/S99 | core 22/22、Apps harness 15 PASS + 5 real SKIPPED、independent 11/11、performance 7/7。全9 suites 191/191 PASS | NOT EXECUTED | Calendar CRUD、OAuth、primary/ACL保護、失敗再開、tracked LOW 4件 |

### 3.1 Phase Gate

| Gate項目 | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---|---|---|---|---|
| Requirements Traceability | 更新済み | 更新済み | 更新済み | 更新済み |
| Unit / Integration / Negative | PASS_LOCAL | PASS_LOCAL | PASS_LOCAL | PASS_LOCAL |
| Idempotency / Failure Recovery | PASS_LOCAL | PASS_LOCAL | PASS_LOCAL | PASS_LOCAL |
| 前Phase Regression | PASS_LOCAL | PASS_LOCAL | PASS_LOCAL | 9 suites 191 PASS / 0 FAIL |
| Security review | 完了、重大指摘なし | 完了、open findingなし | formula injection修正後PASS | PASS。Blocker 0 / High 0 / Medium 0 / operational Low 1 |
| Performance review | soft budget確認 | 120秒budget確認 | shared budget確認。初回Context読込の実時間はtracked LOW | 7/7 PASS。Blocker 0 / High 0 / Medium 0 / Low 3 |
| Independent QA | 23/23 | independent production-code review完了 | 34/34 | 11/11 |
| 重大指摘 | 解消 | 解消 | 解消 | 解消 |
| Real Workspace | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED | NOT EXECUTED |
| Gate | PASS WITH EXTERNAL VALIDATION PENDING | PASS WITH EXTERNAL VALIDATION PENDING | PASS WITH EXTERNAL VALIDATION PENDING | PASS WITH EXTERNAL VALIDATION PENDING |

---

## 4. 変更ファイル

`.git`が存在しないため、以下の「新規/変更」はPhase導入時の責務に基づく。
commit差分からの判定ではない。

### 4.1 Apps Script

| パス | 区分 | 責務・主なfunction | 対応Requirement ID |
|---|---|---|---|
| `apps-script-v2/00_Config.gs` | 変更 | version、Sheet名、stage、budget、label、Calendar定数 | P1-SCH-001、P1-SET-003、P2-GML-001、P4-SET-001 |
| `apps-script-v2/01_TypesAndSchemas.gs` | 変更 | exact Schema、Enum変換、Column Map、Task型検証、validation plan | P1-SCH-002〜006、P1-REP-001/006 |
| `apps-script-v2/02_Setup.gs` | 変更 | `setupSystem`、environment検査、stage再開、S50/S60、S80 NO_TRIGGER、S99 | P1-SET-001〜006、P2-LBL-001、P4-SET-001 |
| `apps-script-v2/03_SheetBuilder.gs` | 変更 | Sheet作成、schema適用、validation、format、Protection、100行拡張 | P1-SCH-001〜007 |
| `apps-script-v2/04_MessageStateRepository.gs` | 新規後変更 | Message claim、stale回収、checkpoint、retry、CALENDAR resume | P2-MSG-001〜003、P4-OUT-001 |
| `apps-script-v2/05_GmailGateway.gs` | 新規後変更 | formal label、限定query、Message取得、Stable Thread Key、AI/SYS label diff | P2-LBL-001、P2-GML-001/002、P2-THR-001、P3-LBL-001 |
| `apps-script-v2/06_EmailPreprocessor.gs` | 新規 | provider-neutral email入力、Unicode-safe truncate、hash、Active Task interface | P2-PRE-001/002 |
| `apps-script-v2/07_AiAdapter.gs` | 新規 | `MockAiAdapter`、strict input/output/action semantic validation | P3-AI-001〜003 |
| `apps-script-v2/08_TaskRepository.gs` | 変更 | logical empty row、typed upsert、index、pending/manual update、Calendar管理patch | P1-REP-001〜007、P3-REV-003、P4-CAL-004 |
| `apps-script-v2/09_TaskReviewPolicy.gs` | 新規 | confidence policy、target解決、same-row Review、pending、AI label集約 | P3-REV-001〜003、P3-MAN-001 |
| `apps-script-v2/10_CalendarSync.gs` | 新規 | 専用Calendar検証、eligibility、Event CRUD、Outbox、retry、ownership marker | P4-CAL-001〜004、P4-OUT-001、P4-SET-001 |
| `apps-script-v2/11_EditHandler.gs` | 新規後変更 | edited-row限定処理、manual field、decision適用、Outbox enqueue-only | P3-MAN-001、P3-EDT-001、P4-OUT-001 |
| `apps-script-v2/12_Triggers.gs` | 新規 | manual entry point、scheduled workerの明示的無効化 | P2-WRK-001、D-006 |
| `apps-script-v2/13_LogAndDeadLetter.gs` | 新規後変更 | allowlist run/error log、Message/Calendar error、management warning | P2-LOG-001、P3-EDT-001、P4-OUT-001 |
| `apps-script-v2/14_Migrations.gs` | 変更 | v1検出、Migration禁止、`upgradeSystem` safe stop | P1-SET-002 |
| `apps-script-v2/16_Diagnostics.gs` | 変更 | `runQuickDiagnostic`、chunk/budget、schema/validation/protection/version検査 | P1-DIA-001〜003 |
| `apps-script-v2/17_Utilities.gs` | 変更 | ID/hash/origin key、redaction、safe error、soft budget、Script Lock | P1-REP-005、P1-SEC-001、COM-BUD-001 |
| `apps-script-v2/18_Worker.gs` | 新規後変更 | Phase 2 manual worker、Mock vertical、CALENDAR checkpoint、`syncPendingCalendarJobs` | P2-WRK-001、P3-FLOW-001、P4-OUT-001 |
| `apps-script-v2/99_TestHarness.gs` | 変更 | Phase 1〜4 Apps Script acceptance、real testの明示的SKIPPED | P1-TST-001、COM-GATE-001 |
| `apps-script-v2/Menu.gs` | 変更 | Setup、Diagnostic、各Phase test、selected edit、Calendar同期menu | P1-TST-001、P3-EDT-001、P4-OUT-001 |
| `apps-script-v2/appsscript.json` | 変更 | Advanced Gmail/Calendar v1/v3、最小OAuth scope、timezone | P2-LBL-001、P4-SEC-001 |
| `apps-script-v2/.clasp.json.example` | 新規 | 実Script IDを含まないlocal deployment設定template | P1-SEC-001 |

### 4.2 Tests・導入文書

| パス | 区分 | 責務 | 対応Requirement ID |
|---|---|---|---|
| `tests/phase1_local_test.js` | 新規後更新 | Phase 1既存15 acceptance | P1-TST-001 |
| `tests/phase1_audit_test.js` | 新規 | Phase 1独立audit 23 test | P1-TST-001、P1-SEC-001 |
| `tests/phase2_local_test.js` | 新規 | Phase 2 production-code unit/integration 27 test | P2-*、COM-IDM-001 |
| `tests/phase3_local_test.js` | 新規後更新 | Phase 3 production-code 37 testと回帰 | P3-*、COM-IDM-001 |
| `tests/phase3_independent_test.js` | 新規後更新 | strict schema、policy、checkpoint、security独立34 test | P3-*、COM-GATE-001 |
| `tests/phase4_local_test.js` | 新規 | Calendar core、negative、retry、security 22 test | P4-CAL-*、P4-OUT-001、P4-SET-001 |
| `tests/phase4_harness_local_test.js` | 新規 | Apps Script Harness隔離実行、15 PASS / real 5 SKIPPED | P4-CAL-*、COM-GATE-001 |
| `tests/phase4_independent_test.js` | 新規 | Worker縦統合、max 1、no re-AI、lock、機密境界11 test | P4-OUT-001、P4-SEC-001 |
| `tests/phase4_performance_test.js` | 新規 | retry chain、read境界、max 1 Job、budget、held-lock、NOOP write amplification 7 test | COM-BUD-001、P4-OUT-001、COM-GATE-001 |
| `apps-script-v2/README.md` | 変更 | 導入、menu、ローカル/実環境acceptance、既知制約 | COM-GATE-001 |
| `apps-script-v2/CHANGELOG.md` | 変更 | Phase別の実装・検証履歴 | COM-GATE-001 |
| `Archives/google-workspace-personal-work-os-v2_phase1-baseline_20260724.zip` | 新規 | Phase 2着手前のPhase 1監査済みbaseline backup | Audit instruction §3/§4 |
| `docs/V2_REQUIREMENTS_TRACEABILITY.md` | 新規後更新 | Requirement、差異、test、Gate対応表 | COM-GATE-001 |
| `docs/V2_MANUAL_ACCEPTANCE_GUIDE.md` | 新規後更新 | 空SheetからのPhase 1〜4実環境手順、専用Calendar非共有確認 | D-008、P4-SEC-001、COM-GATE-001 |
| `docs/V2_PHASE_1_AUDIT_AND_PHASE_2_TO_4_REPORT.md` | 新規 | 本監査・実装・Gate報告 | Audit instruction §15.1/§17 |

---

## 5. サブエージェント

| 担当 | 範囲 | 主な指摘 | 採用した修正 |
|---|---|---|---|
| `phase1_spec_review`（Dalton） | Phase 1仕様、正本、traceability独立監査 | exact Schema、安全停止、Gate証跡の独立性 | literal contractとRequirement matrixを追加 |
| `phase1_code_qa`（Fermat） | Phase 1 production code / Test Harness独立QA | blank環境、setup integrity、型、競合、Protection、Diagnostic | Phase 1 audit fixesと独立23 testへ反映 |
| independent production-code review/test suite担当 | Phase 2 Message/Gmail/preprocess/worker | label優先、claim競合、failure非DONE、budget、safe log | `手動/除外`優先、DEAD/RETRY、lock、bounded expansionを修正 |
| independent production-code review/test suite担当 | Phase 3 AI/Review/Edit/worker | target解決、action semantic、budget非retry、SYS aggregate、formula injection | strict active-input target、action matrix、shared budget、U+200B neutralizationを採用 |
| Calendar仕様matrix / API scope担当 | Phase 4 policyと公式Calendar API境界 | 専用Calendar、primary拒否、least privilege、same-name ownership | `calendar.app.created` + `calendar.calendarlist.readonly`、marker所有確認 |
| Calendar core担当 | `10_CalendarSync.gs`とcore tests | Outbox steady state、runtime provision禁止、retry semantics | S60-only provision、canonical desired action、5/15/60 retryを実装 |
| Apps Script Harness担当 | Phase 4 Harness | Local mockとreal testの混同防止 | real 5件を`SKIPPED / NOT EXECUTED`として分離 |
| Worker integration担当 | `18_Worker.gs` | CALENDAR checkpoint、no re-AI、max 1 Job、無関係Outbox分離 | held-lock Message/Task/Outbox flowとstandalone workerを実装 |
| Worker read-only review担当 | Phase 4 Worker独立再監査 | module欠落fail-open、per-item budget、lock assertion、worker test不足 | fail-closed、budget check、strict held-lock、永続11 testを採用 |
| Phase 4 independent QA担当 | Setup/Edit/Worker/Calendar縦統合 | zero-task isolation、non-nested lock、secret-bearing identifier、source reference | 11/11 independent suiteで修正後PASS |
| Phase 4 security review担当 | OAuth、ownership、redaction、API boundary | Event ID文字集合、credentialを運べるerror code/stage、raw Gmail ID log、instance marker、`source_email`欠落、Diagnosticのreal PASS誤表示、Task不存在、Event説明過多 | valid base32hex ID、safe identifier、`msgref_`/`thrref_` hash、strict instance、source reference伝播、`WARN / NOT_EXECUTED`、fail-closed、説明最小化へ修正 |
| Phase 4 performance review担当 | Sheet read、budget、Calendar検索、Job上限 | NOOP Outbox/write amplificationとretry回数を修正。dense sparse-row Context、escaped held-lock Context、CalendarList paginationをLow追跡 | nonactionable TaskのOutbox/write省略、max 1 Job、per-item budget、scheduled-retry semanticsを採用。7/7 PASS |

Security review最終判定はBlocker 0 / High 0 / Medium 0 / Low 1である。
Low 1はnarrow scopeでは専用CalendarのACL・共有設定をAPI検査できない
運用上の外部検証事項であり、Manual Acceptanceへ非共有確認を追加した。

Performance review最終判定はBlocker 0 / High 0 / Medium 0 / Low 3である。
3件はSection 8に記載する将来hardeningであり、現行のローカルGateを阻害しない。

Event説明はsubject、body、attachment、credentialを除外する一方、
仕様上必須のruntime source reference URLは保持する。
standaloneなMessage/Calendar/Event ID fieldを公開結果へ追加していない。
Error Logのraw provider IDはdomain-separated hashへ変換する。

### 5.1 採用しなかった指摘・代替案

- installable edit trigger: 今回のno-trigger制約と競合するため不採用。
  selected-range menuから同じ処理へ明示的に到達できるようにした。
- broad Calendar/Gmail scope: arbitrary Calendarやmailbox全体への権限は不要なため不採用。
- 同名Calendarの無条件再利用: 所有権とinstance markerを証明できないため不採用。
- Calendar Runtimeからの自動作成: Setup/Runtime責務分離に反するため不採用。
- Calendar側変更のTaskへのreverse sync: Sheets正本に反するため不採用。

---

## 6. テスト結果

### 6.1 実行結果

| Test分類 | Status | 実行方法・件数 | 結果 |
|---|---|---|---|
| Phase 1既存15 test | PASS_LOCAL | `node tests/phase1_local_test.js` | 15/15 |
| Phase 1追加audit | PASS_LOCAL | `node tests/phase1_audit_test.js` | 23/23 |
| Phase 2 Unit / Integration | PASS_LOCAL | `node tests/phase2_local_test.js` | 27/27 |
| Phase 3 Unit / Integration | PASS_LOCAL | `node tests/phase3_local_test.js` | 37/37 |
| Phase 3 independent | PASS_LOCAL | `node tests/phase3_independent_test.js` | 34/34 |
| Phase 4 Unit / core | PASS_LOCAL | `node tests/phase4_local_test.js` | 22/22。P4-G08はTask不存在・writer欠落をfail-closed確認 |
| Phase 4 Apps Script Harness | PASS_LOCAL / REAL_SKIPPED | `node tests/phase4_harness_local_test.js` | 15 PASS、0 FAIL、5 SKIPPED |
| Phase 4 Integration / independent | PASS_LOCAL | `node tests/phase4_independent_test.js` | 11/11 |
| Phase 4 Performance / Reliability | PASS_LOCAL | `node tests/phase4_performance_test.js` | 7/7 |
| 全Local suite | PASS_LOCAL | 上記9 suites | 191 PASS / 0 FAIL。real 5件はSKIPPED / NOT EXECUTED |
| JavaScript syntax | PASS_LOCAL | 全`.gs`をbundled Nodeの`node --check`へstdin入力 | 20/20 |
| Manifest | PASS_LOCAL | JSON parse、service/scope exact check | PASS |
| Idempotency | PASS_LOCAL | Message、Task、Review、Outbox、Event replay | 重複なし |
| Failure Recovery | PASS_LOCAL | stale claim、checkpoint、Calendar RETRY/DEAD、budget pause | PASS |
| Security | PASS_LOCAL | identifier、hash reference、redaction、formula、scope、foreign/primary、禁止API scan | B0/H0/M0/L1 operational |
| Performance | PASS_LOCAL | 100行拡張、chunk、120秒budget、60秒Diagnostic reserve、max 1 Calendar Job、NOOP write抑制 | 7/7。B0/H0/M0/L3 hardening |
| Google Workspace Manual Acceptance | NOT EXECUTED | `docs/V2_MANUAL_ACCEPTANCE_GUIDE.md` | 未実施 |

`node`はbundled runtime
`<codex-runtime>\dependencies\node\bin\node.exe`
を使用した。Local harnessはGoogle APIやnetworkへ接続していない。

### 6.2 Final Regression

| 確認事項 | Local結果 | Real結果 |
|---|---|---|
| 再setupでTask・利用者入力を破壊しない | PASS | NOT EXECUTED |
| 同一MessageでMessage State・Task重複なし | PASS | NOT EXECUTED |
| 同一Task再同期でEvent重複なし | PASS | NOT EXECUTED |
| AI不正出力でTask副作用なし | PASS | NOT EXECUTED |
| Calendar失敗時にGmail再取得・AI・Task業務upsertを再実行しない | PASS | NOT EXECUTED |
| zero-task Messageが無関係Outboxを消費しない | PASS | NOT EXECUTED |
| Review中・推測期限のみではEventを作らない | PASS | NOT EXECUTED |
| 完了・対象外・取消・対象外modeでowned Eventを削除 | PASS | NOT EXECUTED |
| manual fieldと`comment`をAIが上書きしない | PASS | NOT EXECUTED |
| Log・公開結果へ本文、credential、standalone Calendar/Event ID fieldを出さない。必須source referenceは保持 | PASS | NOT EXECUTED |
| Task追記へ`getLastRow()`を使用しない | PASS_STATIC | N/A |
| 外部AI、Phase 5、5分Triggerがない | PASS_STATIC | Trigger UIはNOT EXECUTED |

---

## 7. 実環境で必要な確認

すべてGoogle Workspace real testは`NOT EXECUTED`である。
具体的手順と期待結果は`docs/V2_MANUAL_ACCEPTANCE_GUIDE.md`に従う。

| 分類 | 必要な確認 | Status |
|---|---|---|
| Sheet | 10 Sheetの作成順、hidden Sheet、43列、row 1/2、row 3開始、100行拡張 | NOT EXECUTED |
| Validation | Checkbox限定、Enum、日付format、空行に`FALSE`なし、式neutralization | NOT EXECUTED |
| Protection | Header、管理列、管理Sheet、拡張後のProtectionとeditor | NOT EXECUTED |
| Setup | 空Sheet、再setup、中断再開、未知/v1環境safe stop、S99 | NOT EXECUTED |
| Gmail | formal 7 label、限定query、既読/未読、除外優先、Message ID、source reference | NOT EXECUTED |
| Calendar | S60専用Calendar、create/update/delete/no-op、重複防止、primary/foreign不変、専用Calendarが他者・組織へ共有されていないこと | NOT EXECUTED |
| OAuth | Gmail/Calendar Advanced Service、consent画面、組織管理者承認、最小scope | NOT EXECUTED |
| Trigger | installable/time-driven Triggerが作成されていない | NOT EXECUTED |
| 実行時間 | Setup 120秒、Worker 120秒、Quick Diagnostic 60秒目標 | NOT EXECUTED |
| Lock | 同時実行、stale claim、Task/Outbox競合時の実挙動 | NOT EXECUTED |
| Manual acceptance | Phase 1〜4のダミー縦フローと再実行 | NOT EXECUTED |

実メール本文、実ID、会社情報、個人情報を試験データへ使用してはならない。
専用Calendar ACL・共有状態はnarrow OAuth scopeではコードから検査できないため、
Manual Acceptanceで非共有を目視確認し、試験中も共有しない。

---

## 8. Phase 5開始前の未解決事項

### 8.1 コード上の問題

Phase 1〜4のローカルGateを止めるBlocker、High、Mediumはない。
Phase 5コードは未着手である。

| 種別 | Low | 現在の影響 | Phase 5前の扱い |
|---|---|---|---|
| Performance | `08_TaskRepository.createScopedContextForHeldLock`は非常に高い選択行までdense blank matrixを確保する | memoryが`O(highest selected row × columns)`。通常の100行初期gridと最大20選択行では非阻害 | 大規模Sheet運用前にsparse Contextまたは選択行上限を検討 |
| Performance | held-lock Contextは作成時に実lockを確認するが、mutation時は内部markerを信頼する | 現行の同期callback内ではContextをescapeさせないため非阻害 | escaped-context防御としてcallback終了時無効化またはmutation時lock再確認を検討 |
| Performance | Setup S60のCalendarList summary検索は最大250件/pageを全page走査するがpage間budget checkがない | Setup限定。Calendar数が極端に多い環境でsoft limit超過余地 | page間でsoft-budgetを確認しsafe resumeするhardeningを検討 |
| Security operational | narrow scopeでは専用Calendar ACL・共有設定をAPI検査できない | Eventはprivate、inviteなしだがCalendar自体の共有はコードで証明不能 | Manual Acceptanceで非共有を確認し、組織policyも確認 |

Performance最終severityはB0/H0/M0/L3、
Security最終severityはB0/H0/M0/L1である。
いずれもLocal Gateを阻害しないが、実環境・大規模化前に追跡する。

### 8.2 実環境確認待ち

1. `docs/V2_MANUAL_ACCEPTANCE_GUIDE.md`のPhase 1〜4手順を、
   新しい空の非機密Spreadsheetで完了する。
2. Gmail label/query、Message ID、source referenceの実挙動を確認する。
3. 専用Calendarとowned EventのCRUD、primary不変、same-name衝突、
   Calendar-only retry、専用Calendar非共有を確認する。
4. Protection、Data Validation、式neutralization、Lock競合、
   soft budget実時間を確認する。
5. 実環境結果をPASS / FAIL / NOT EXECUTEDでtraceabilityへ反映する。

### 8.3 会社承認・認証方式待ち

- Advanced Gmail/Calendar ServiceとOAuth scopeの組織承認
- 非機密テストメール・Calendarを使用する受入試験の承認
- Phase 5で外部AIを使用する場合のprovider、契約、data residency、
  retention、監査、credential保管方法
- 実AIへ渡してよいemail fieldとmasking方針

### 8.4 実AI Adapter設計に影響する事項

- strict AI schemaを変更するか、現行schemaを維持するか
- proseだけに存在する`target_origin_key`を将来schemaへ追加するか
- `UNCLEAR`を必ずReview Taskにする現行方針の確認
- AUTO Calendar重要度閾値を`HIGH`のままにするか
- production triggerを将来導入するか。導入には別途明示承認が必要

これらを確認するまでPhase 5を開始しない。

---

## 9. 仕様との差異

| 差異 | 採用した実装 | 理由 | 影響 | 将来対応 |
|---|---|---|---|---|
| 実装先に`context-hub`と`GoogleSpreadsheet`の記述差 | `GoogleSpreadsheet`だけを対象 | 最新user指示が最優先 | `context-hub`は無変更 | なし |
| `origin_key`式のplan/spec差 | Specの`SHA-256("v2|" + message_id + "|" + index)` | 詳細Spec優先 | 決定的な`org_` key | なし |
| generic Message State項目とexact Schema差 | exact v2 Sheet Schemaを維持 | instructionがexact SchemaをSpecへ委譲 | generic名を既存fieldへ対応 | なし |
| Phase 2最低3 labelとS50正式7 label | 不足している正式7 labelを冪等作成 | Specの方が厳格 | Phase 3 labelもSetup時に存在 | 実環境確認 |
| installable edit trigger許容とno-trigger制約 | triggerなし、selected-range menu | 今回の制約優先 | 自動onEditではない | 導入時は別承認 |
| S80名がCREATE_EDIT_TRIGGER | `NO_TRIGGER` policy stageとして完了 | stage順を保ちつつ禁止事項を遵守 | Trigger IDは作らない | Spec名称の将来明確化 |
| AIが`SYS/失敗`も管理する記述 | AIは`AI/*`だけ、error subsystemが`SYS/失敗`を管理 | 最新instructionが狭い | subsystem ownershipが明確 | なし |
| confidence 0.85の適用範囲 | actionとoverallの両方に適用 | conservativeな自動確定 | auto-openが狭い | 実AI前に確認 |
| exact AI schemaに`target_origin_key`がない | validated input内の`target_task_id`だけで解決 | schema外fieldを追加しない | 解決不能更新はReview隔離 | schema改訂時に確認 |
| budget exhaustionとgeneric retry規則 | errorではなくdurable checkpointへpause | budget停止は処理失敗ではない | retry allowanceを消費しない | 実時間確認 |
| Sheet formula解釈 | String/URLの危険prefixへU+200B | formula injection防止 | 表示上ほぼ同じ、内部値に1文字追加 | 実`getFormula()`確認 |
| Calendar `NONE` / `NOOP`差 | exact Specの`NOOP` | 詳細Spec優先 | Outbox actionは`NOOP` | なし |
| AUTO重要度閾値が未指定 | `HIGH`のみ | conservativeなEvent作成 | MEDIUMは自動登録しない | production前に確認 |
| RuntimeでCalendar property欠落時の責務 | S60だけがcreate/adoptし、Runtimeはfail-closed | Setup/Runtime分離とprimary安全性 | S60未完了では同期停止 | 実S60確認 |
| Message retry counterのstage累積問題 | 初回CALENDAR checkpointで旧retry/errorを一度だけreset | Calendar retry allowanceを独立させる | 後続CALENDAR resumeではcount維持 | 実失敗注入確認 |
| 同名Calendar再利用とleast scopeの制約 | app-created access、owner、instance markerを証明できる場合だけadopt | arbitrary Calendarを変更しない | 証明不能ならsafe stop | OAuth/same-name実確認 |
| Error Sheetにsource-reference列がある一方、実Gmail IDのLog保存は禁止 | Error Logではraw IDを保存せず、domain-separated SHA-256の`msgref_` / `thrref_`参照を保存 | 相関確認を維持しつつprovider IDを不可逆化 | Message State等の正規idempotency recordとError Logを分離 | 実運用log確認 |
| Task/Eventに元メール参照が必要だが、安全な形式が未指定 | runtime Thread IDからgeneric Gmail UI source referenceをmemory上で作り、Task/Eventへ必要最小限で伝播。AI inputとError Logへは渡さない | URL取得や外部通信を追加せず利用者参照を満たす | Event説明には必須source referenceが残り、subject/body/attachment/credentialは残らない | 実account contextでnavigation確認 |
| 「3回失敗後DEAD」と5/15/60分の3 delayの解釈 | 初回失敗後に5分、15分、60分の3 retriesを許可し、3回目retry失敗後DEAD | 3つの指定delayをすべて到達可能にする | 最大4 attempts（initial + 3 retries）。`retry_count`はscheduled retry数 | production前にowner確認。3 total attemptsが意図ならpolicy/test/READMEを同時変更 |

---

## 10. 作業状態

```text
Repository root:
<workspace>\GoogleSpreadsheet

Git repository not initialized
```

- `.git`が存在しないため、branch、commit hash、`git status`、
  `git diff --stat`は取得できない。
- commit、push、PR、reset、clean、force操作は行っていない。
- `context-hub`は変更していない。
- 実際のSpreadsheet ID、Calendar ID、Gmail Message ID、
  API key、password、token、メール本文、内部URLを保存していない。
- Test fixtureは完全なダミーである。
- Code Versionは`2.4.0-phase4`、Schema Versionは`2.0`である。
- Phase 4完了後、Phase 5へ進まず停止した。
