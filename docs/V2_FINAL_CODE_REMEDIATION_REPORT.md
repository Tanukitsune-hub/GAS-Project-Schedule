# V2 Final Code Remediation Report

Date: 2026-07-25  
Repository: `GoogleSpreadsheet`  
Scope: Remaining prepilot Findings F-001 / F-005 / F-007 / F-013 / F-014 / F-015  
Code Version: `2.8.1-prepilot`

## 1. Baseline

作業開始前に、Post-remediation監査で申告されたローカルBaselineを独立再実行した。

```text
Suites: 29
PASS: 444
FAIL: 0
SKIPPED: 11
.gs syntax: 22/22 PASS
```

11 SKIPPEDは実Google Workspace、実Provider、実Trigger、実LockService等の
外部検証であり、PASSへ読み替えていない。

Gitは`No commits yet on master`で、staged baselineとunstaged remediationが
分離された状態だった。最小のGit書込み確認は
`.git/index.lock: Permission denied`で失敗したため、指示どおり以後のGit
書込み、代替手段による`.git`変更、commit、branch、push、PRを実行していない。

## 2. Scope

実装対象:

- F-001 / F-007: Gmail、AI、Calendar外部I/OのScript Lock外分離
- F-014: Provider suppression accountingとRun History
- F-005: Dashboard blank-key利用者行／formula／metadata保護
- F-013: `E_DASHBOARD_LAYOUT_CONFLICT`直接negative test
- F-015: ownership、stage、hash、row version、二重Worker、Calendar外部効果後CAS failure injection

非対象:

- Provider、model、endpoint、auth、credential保管方式の確定
- 会社承認、newsletter／Calendar通知policy、retention、governanceの確定
- 実Provider通信、実Google Workspace操作
- TEST_MODE=false化、Automation有効化、本番Trigger作成
- Phase 8

## 3. F-001 / F-007

### 実装

Workerを次の境界へ分割した。

```text
短時間Lock:
  readiness snapshot
  logical worker lease
  Message/Calendar claim
  ownership/hash/row_version snapshot
  checkpoint/CAS commit
  cursor/property/Run History atomic update

Lock外:
  Gmail candidate search
  Gmail selected body/thread read
  email preprocessing
  AI classify/transport
  Gmail label mutation
  Calendar list/get/find/create/update/delete
```

Message Stateはpreprocess/classification lease、input hash、Task version snapshotを
持ち、再Lock後にownershipと現在状態を照合する。Calendarは
prepare → external execute → commitへ分割し、Outbox fingerprint、
Task fingerprint、Task `row_version`、claim tokenを照合する。

外部Calendar mutation成功後にTask/Outboxが変化した場合、staleなTask
business fieldを適用しない。観測済みEvent IDと現在Taskからfresh
CREATE / UPDATE / DELETE / NOOP checkpointを再生成する。CREATE直後の
Task非対象化はDELETEへ、DELETE直後のTask再対象化はCREATEへ収束する。

### 検証

- instrumented Gmail/AI/Calendar gatewayがcall時のScript Lock非保持を直接検査
- Lock再取得失敗時にstale preprocess/classificationをcommitしない
- Calendar CREATE/DELETE成功後のcurrent Task変更を直接注入
- Eventは最終的に0件または1件へ収束し、重複・孤立なし
- Gmail call cap、Calendar pagination/budget、run-scoped label cacheを保持

実Apps Script LockService競合、quota、実行時間は`NOT EXECUTED`。

## 4. F-014

### Suppression accounting

transientなproduction分類失敗だけをbounded Provider failure stateへ計上する。
同一`run_id`は冪等で、failure countは上限付き。auth/config/schema等の
non-transient failureはProvider-wide suppressionを開始しない。

成功時は、より新しいfailureを古いsuccessが消さない条件でsuppressionを解除する。

### Run History

classification failure、Adapter configuration failure、normal completion、
pause、busyを含むautomatic run outcomeを`run_id`で1回だけ記録する。
Error contextは同一runで再利用し、本文、件名、送信者、raw provider ID、
credential、request/response payloadを保存しない。

```text
Code implementation: LOCAL PASS
Mock HTTP Transport: LOCAL PASS
Real provider connection: NOT EXECUTED
Company approval: NOT CONFIRMED
Credential storage approval: NOT CONFIRMED
```

## 5. F-005 / F-013

Dashboardは3列の連続system-owned blockへmarker noteを付け、owner、
version、instance、開始/終了row、列数、metric順序hashを照合する。

次をforeign layoutとしてwrite前に拒否する。

- blank-key行のB/C value
- formula
- note
- Data Validation
- merge
- protection
- named range
- hidden row
- foreign formatting
- duplicate/dispersed key
- foreign/corrupt marker

Quick Diagnosticにread-onlyの`DASHBOARD_LAYOUT_OWNERSHIP`検査を追加した。
refreshはQuick Diagnosticまたはownership検査が不合格なら
`E_DASHBOARD_LAYOUT_CONFLICT`で停止し、行拡張や部分`setValues`を行わない。

直接negative testはblank-key value、formula、metadata、foreign marker、
failed Diagnosticを注入し、Dashboard値、formula、行数、source Sheetの
不変を確認した。

## 6. F-015

次のfailure injectionを追加した。

1. Message claim ownership loss
2. stage advance
3. Task `row_version` change
4. preprocess/input hash change
5. competing second Worker
6. Calendar CREATE成功後のTask `row_version` change
7. Calendar CREATE成功後のOutbox fingerprint change
8. Calendar CREATE成功後のTask非対象化とcompensation DELETE
9. standalone Calendar WorkerのCONFLICT報告
10. Calendar DELETE成功後のTask再対象化とrecreate

stale resultはTask、Message State、Calendar Outboxへ適用されない。
Calendar外部効果が既に存在する場合だけ、現在状態から新しいreconciliation
checkpointを作成する。standalone WorkerはCONFLICTを成功扱いせず、
requeue時は`PAUSED / E_CALENDAR_CAS_CONFLICT_REQUEUED`をRun Historyへ記録する。

## 7. Tests

最終ローカルRegression:

```text
Suites: 34
PASS: 471
FAIL: 0
SKIPPED: 11
New Finding tests: 27/27 PASS
.gs syntax: 22/22 PASS
```

追加suite:

| Suite | Result |
|---|---:|
| `prepilot_worker_concurrency_test.js` | 3 PASS |
| `prepilot_provider_failure_accounting_test.js` | 6 PASS |
| `prepilot_dashboard_safety_test.js` | 8 PASS |
| `prepilot_cas_failure_injection_test.js` | 5 PASS |
| `prepilot_calendar_cas_failure_injection_test.js` | 5 PASS |

Static:

- Manifest JSON parse: PASS
- Runtime: V8 / Timezone: Asia/Tokyo
- OAuth scopes: 7、`script.external_request`なし、mail-sendなし
- `UrlFetchApp` / `GmailApp` / `CalendarApp` in production `.gs`: 0
- production source secret pattern: 0
- sensitive file (`.env`、real `.clasp.json`、credential/token/key): 0
- secret-like fixture hit: redaction用synthetic test dataだけ
- working-tree `git diff --check`: PASS
- staged baseline `git diff --cached --check`: FAIL
  - `AGENTS.md`: blank line at EOF
  - `apps-script-v2/.clasp.json.example`: blank line at EOF
  - Git permission blockのためstaged snapshotを変更せず隔離

## 8. Security

独立Security reviewでは、Provider accounting、Run History、Dashboard、
Message/Calendar claim、redaction、manifest scopeを確認した。実装中に
外部Calendar効果後の競合が孤立Eventを作り得るHighと、standalone runが
CONFLICTを成功記録するMediumが独立QAで発見され、current-state
reconciliationと明示的CONFLICT outcomeで修正した。
追加の独立Security／Performance再レビューでは、非Provider障害が既存
suppressionを解除し得るMedium、Dashboard metadata境界の形式不一致、
非表示行の全行API走査を発見した。非Provider結果をaccounting対象外として
状態を保持し、Dashboard境界形式を統一、bulk snapshot後の候補行だけを
遅延・cache検査する実装へ修正した。直接negative／性能testを追加して
再レビューを通過した。

最終コード上Finding:

```text
Critical: 0
High: 0
Medium: 0
Low: legacyLocked* dead-code removal, Run History idempotency lookup growth,
     and real-runtime observability hardening
```

Lowは現在exportされない旧実装の将来誤利用防止、Run History増加時のlookup
最適化、実Lock競合時の利用者向け待機目安の改善であり、現行export pathの
ローカルGate blockerではない。retentionは外部governance判断として確定して
いない。

## 9. Performance

- Worker全体を保持する物理Script Lockを廃止
- bounded logical leaseで同一Worker重複を抑止
- claim／prepare／commitを短時間Lockへ限定
- Gmail label indexはrun-scoped lazy cache
- Gmail call上限、Calendar pagination上限、soft budgetを維持
- Calendar claim/prepare/commitの再読取は最大4 Task index scan、
  最大3 Outbox index scanとしてlocal fakeで検査
- Dashboardはbounded source readsと1回のsystem block write

Apps Script実行時間、quota、LockService contentionは`NOT EXECUTED`。

## 10. Version

```text
Code Version: 2.8.1-prepilot
Schema Version: 2.2
AI Schema Version: 2.0
Migration Version: 0
TEST_MODE: true
Automation default: OFF
```

物理Schema変更はないためSchema/Migration Versionを変更していない。

## 11. External blockers

| 項目 | 状態 |
|---|---|
| Real provider connection | NOT EXECUTED |
| Provider / model / endpoint / auth | NOT CONFIRMED |
| Company approval | NOT CONFIRMED |
| Credential storage approval | NOT CONFIRMED |
| Real Google Workspace Sheets/Gmail/Calendar | NOT EXECUTED |
| Real installable edit/time-driven Trigger | NOT EXECUTED |
| Real LockService concurrency/quota/duration | NOT EXECUTED |
| newsletter / Calendar notification policy | NOT CONFIRMED |
| retention / governance | NOT CONFIRMED |

## 12. Go / No-Go

| Stage | 判定 | 根拠 |
|---|---|---|
| ローカルコード完成 | GO | 471 PASS / 0 FAIL、コード上C/H/M 0 |
| TEST_MODE=true非機密Sandbox | CONDITIONAL GO | 新規clean Sheet、synthetic/self data、Automation OFF限定。実Workspace/Lock検証は未実施 |
| TEST_MODE=false Sandbox | NO-GO | Provider、auth、credential、会社承認、scopeと実Gate未確定 |
| 個人実業務パイロット | NO-GO | TEST_MODE=false Sandboxと実Workspace受入が先 |
| 少人数展開 | NO-GO | 個人pilot evidence、retention、governance未確定 |
| 部内展開 | NO-GO | 少人数運用、会社統制、監査証跡未確定 |

## 13. Git manual procedure

この環境ではGit書込みだけを
`NOT EXECUTED — ENVIRONMENT PERMISSION`として隔離した。通常terminalでは、
staged baselineとworking remediationを混ぜないため、次の順序で実行する。

```powershell
Set-Location 'C:\path\to\GoogleSpreadsheet'

git status --short --branch
git diff --cached --name-status
git diff --name-status
git diff --cached --check
git diff --check
```

まずstaged baselineの2件のEOF blankを通常のeditorで修正し、対象2ファイル
だけを明示stageして再確認する。秘密情報、一時file、実IDがないことを確認後、
既存staged snapshotだけをbaseline commitにする。

```powershell
git add -- AGENTS.md apps-script-v2/.clasp.json.example
git diff --cached --check
git commit -m "chore: establish audited phase 1-7 baseline"
git switch -c codex/fix-remaining-prepilot-findings
```

次に、`git add -A`を使わず、remediation対象だけを明示stageする。

```powershell
git add -- `
  .gitignore `
  apps-script-v2/00_Config.gs `
  apps-script-v2/02_Setup.gs `
  apps-script-v2/03_SheetBuilder.gs `
  apps-script-v2/04_MessageStateRepository.gs `
  apps-script-v2/05_GmailGateway.gs `
  apps-script-v2/07_AiAdapter.gs `
  apps-script-v2/08_TaskRepository.gs `
  apps-script-v2/10_CalendarSync.gs `
  apps-script-v2/11_EditHandler.gs `
  apps-script-v2/12_Triggers.gs `
  apps-script-v2/13_LogAndDeadLetter.gs `
  apps-script-v2/15_Dashboard.gs `
  apps-script-v2/16_Diagnostics.gs `
  apps-script-v2/17_Utilities.gs `
  apps-script-v2/18_Worker.gs `
  apps-script-v2/19_RuntimeSettings.gs `
  apps-script-v2/99_TestHarness.gs `
  apps-script-v2/Menu.gs `
  apps-script-v2/README.md `
  apps-script-v2/CHANGELOG.md `
  docs/V2_FINAL_INTEGRATED_AUDIT_REPORT.md `
  docs/V2_POST_REMEDIATION_FINAL_AUDIT_REPORT.md `
  docs/V2_REMEDIATION_IMPLEMENTATION_REPORT.md `
  docs/V2_REMEDIATION_PLAN.md `
  docs/V2_REQUIREMENTS_TRACEABILITY.md `
  docs/V2_PREPILOT_READINESS_CHECKLIST.md `
  docs/V2_MANUAL_ACCEPTANCE_GUIDE.md `
  docs/V2_PHASE_1_AUDIT_AND_PHASE_2_TO_4_REPORT.md `
  docs/V2_PHASE_5_TO_7_IMPLEMENTATION_REPORT.md `
  docs/V2_FINAL_CODE_REMEDIATION_REPORT.md `
  tests/baseline_upgrade_test.js `
  tests/phase1_local_test.js `
  tests/phase2_local_test.js `
  tests/phase3_local_test.js `
  tests/phase4_harness_local_test.js `
  tests/phase4_independent_test.js `
  tests/phase4_performance_test.js `
  tests/phase6_local_test.js `
  tests/phase6_performance_reliability_test.js `
  tests/phase6_worker_integration_test.js `
  tests/phase7_harness_local_test.js `
  tests/phase7_performance_reliability_test.js `
  tests/phase7_schema_extension_test.js `
  tests/remediation_ai_boundary_test.js `
  tests/remediation_credential_redaction_test.js `
  tests/remediation_edit_trigger_test.js `
  tests/remediation_gmail_policy_test.js `
  tests/remediation_runtime_dashboard_reliability_test.js `
  tests/prepilot_worker_concurrency_test.js `
  tests/prepilot_provider_failure_accounting_test.js `
  tests/prepilot_dashboard_safety_test.js `
  tests/prepilot_cas_failure_injection_test.js `
  tests/prepilot_calendar_cas_failure_injection_test.js

git diff --cached --check
git diff --cached --stat
git diff --cached
git commit -m "fix: close remaining prepilot findings"
git status --short --branch
git log --oneline --decorate -2
```

push、PR作成、Phase 8は実行しない。
