# Google Workspace Personal Work OS v2
# Code 2.8.3-prepilot 独立再監査・次回修正方針

- 監査日: 2026-07-27
- 正本Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- 監査対象commit: `beeb1e55ef2b5afa04bb89ff0b75a75c85dff87e`
- 対象Code Version: `2.8.3-prepilot`
- Schema Version: `2.4`
- AI Schema Version: `2.0`
- Migration Version: `1`
- 独立再監査判定: `NO-GO`（Phase 8B Part D以降の受入完了）

## 1. 結論

Code `2.8.3-prepilot`について、前回の残存Finding R-01～R-05を対象とした修正は、既存回帰test上ではすべて通過している。現行GAS Repositoryから取得した一式を用いて、36 suites、`509 PASS / 0 FAIL / 11 SKIPPED`および静的検証`10 PASS / 0 FAIL`を独立再実行した。Phase 8B・Phase 8C候補release packageのchecksumとsource parityも独立照合し、申告値と一致した。

ただし、既存testが対象としていなかった次の経路に、業務データの正本性または受入運用を損なうFindingを確認した。

1. 管理列の手動編集を警告するだけで、元値へ復元しない。
2. Setup再実行が、Triggerを経由せずに破損したlive値を新しいauthoritative snapshotとして再確定する。
3. Calendarが所有する管理metadataの更新でも`row_version`が増加し、業務値に変更がないのにpending Reviewが競合扱いになる。
4. Task編集commit後、Calendar Outbox保存前に失敗すると、Taskだけが更新され、再実行時にも同期意図を復元できない。
5. same-row Reviewの明示的restage機能は内部実装されているが、通常利用者の操作経路がない。
6. GAS Repositoryを正本とする現在の運用に対し、正本4文書と実装報告の参照先が旧`context-hub`のままである。
7. `v2.8.3-prepilot` release manifestが、実際にはGAS Repositoryにcommitが存在するにもかかわらず、`Source commit = NOT AVAILABLE`としている。

よって、Code `2.8.3-prepilot`をPhase 8B Part D以降の受入PASSへ進めることはできない。Phase 8B Part A～Cについても、技術的にはfresh setup確認が可能だが、修正後packageで試験を一本化するため現時点ではHOLDとする。

## 2. 監査範囲

### 2.1 正本と対象

今回の監査では、旧`context-hub`を参照せず、次だけを対象とした。

```text
Tanukitsune-hub/GAS-Project-Schedule
  PROJECT_CONTEXT.md
  MASTER_PLAN.md
  DECISIONS.md
  CURRENT_STATUS.md
  instructions/
  audits/
  implementation/GoogleSpreadsheet/
```

監査対象の最新commitは、GAS Repositoryの`beeb1e55ef2b5afa04bb89ff0b75a75c85dff87e`である。

### 2.2 取得・完全性確認

GitHub Actionsを用いて監査対象一式をprivate artifactとして取得した。

```text
Artifact: gas-project-schedule-v283-reaudit.zip
Artifact SHA-256:
37d9bca55a5f10f5e7a497c9f6dfee6831173a3154c85202b871df58079a87a0
Artifact files: 270
Canonical files excluding export manifest: 269
implementation/GoogleSpreadsheet files: 259
Apps Script .gs files: 22
Test suites: 36
```

export時にRepository-relative pathごとのSHA-256一覧を生成し、取得物の監査対象を固定した。

### 2.3 実施していない試験

次は実施していない。ローカルfakeや静的testのPASSから実環境PASSを推定しない。

- 実Google Workspace UI
- 実Data Validation
- 実Protection ownership
- 実Gmail label・Message取得・mutation
- 実Calendar create/update/delete
- 実installable edit Trigger
- 実time-driven Trigger
- 実LockService競合
- 実OAuth
- 実AI Provider
- Apps Script quota・実行時間

## 3. 独立再実行結果

### 3.1 全回帰test

```text
Suites: 36
PASS: 509
FAIL: 0
SKIPPED: 11
Failing suites: 0
```

修正報告に記載された全回帰結果を独立再現した。

### 3.2 静的・global検証

```text
Result: 10 PASS / 0 FAIL
.gs individual syntax: 22 / 22 PASS
Concatenated syntax: PASS
Global evaluation: PASS
Top-level duplicate symbols: 0
Unresolved WorkOsConfig references: 0
Unresolved WorkOs namespaces: 0
getLastRow append-path occurrences: 0
Simple onEdit: 0
Real-secret hits: 0
```

### 3.3 Release package

| Package | Files | Payload | Checksum | Source parity |
|---|---:|---:|---|---|
| `release/v2.8.3-prepilot/` | 27 | 23 | PASS | PASS |
| `release/v2.8.3-prepilot-phase8c/` | 25 | 22 | PASS | PASS。ただし監査済みTEST_MODE変換とTest Harness除外を除く |

## 4. 前回Findingの再評価

| Finding | 再監査結果 | コメント |
|---|---|---|
| R-01 invalid edit restoration | PARTIAL | user-editable fieldの主要caseは改善したが、management fieldを含むeditは復元されない |
| R-02 repeated manual edit versioning | FIXED for ordinary business fields | 2回目以降の通常編集はversioningされる |
| R-03 stale same-row ACCEPT | PARTIAL | 人間の業務編集は検出するが、Calendar metadataだけでもfalse conflictとなる |
| R-04 exact Message progression | FIXED in current tests | 最新処理済みMessageを抑止し、古い未処理exact Messageへ進む |
| R-05 Schema 2.4 control refresh | PARTIAL | Validation・Protection refreshは改善。ただしSetupがlive driftをsnapshotへ再baselineする |

## 5. 残存Finding

## R3-01 High: management column editが正本へ残る

### 事象

`11_EditHandler.gs`は、編集列をbusiness/editableとmanagementへ分類する。management列だけのeditは`MANAGEMENT_COLUMN_EDIT`として`IGNORED`を返すが、すでに変更されたセルを元へ戻さない。business列とmanagement列を同時pasteした場合も、management値は警告対象となるだけで、raw rowへ残る。

authoritative snapshotは、利用者向けbusiness・Review項目だけを保持する。`task_id`、`origin_key`、`row_version`、source identifiers、Calendar metadata等は復元対象外である。さらにProtectionは実行所有者をeditorとして残すため、ownerによる誤編集やpasteを技術的に完全には防止できない。

### 動的再現

#### management-only `row_version`

```json
{
  "handler_status": "IGNORED",
  "handler_reason": "MANAGEMENT_COLUMN_EDIT",
  "row_version_after": 99
}
```

#### management-only `task_id`

```json
{
  "handler_status": "IGNORED",
  "handler_reason": "MANAGEMENT_COLUMN_EDIT",
  "original_task_resolved_after": false,
  "physical_cell_after": "tsk_tampered_management_id"
}
```

#### business + management mixed paste

```json
{
  "handler_status": "COMPLETE",
  "management_column_count": 27,
  "task_title_after": "After mixed edit",
  "row_version_after": 100
}
```

#### `task_id`を含むmixed edit

```json
{
  "error": {
    "code": "E_TASK_SNAPSHOT_INVALID",
    "message": "Task snapshotのTask IDが一致しません。"
  },
  "raw_task_id_after": "tsk_tampered_mixed",
  "raw_title_after": "After task-id mixed edit",
  "original_task_resolved_after": false
}
```

### 影響

- Task identityとCAS versionが手動編集で破損し得る。
- 編集検出後もraw corruptionが残る。
- mixed pasteの一部だけが正式反映され、管理列改変も残る。
- Diagnostic、Review、Calendar、Task lookupが誤動作し得る。
- Google Sheetsを正本とする前提を満たさない。

### 必須修正方針

- edit eventにmanagement列が1列でも含まれる場合、そのevent全体をfail-closedで拒否し、影響行をtrusted stateへ復元する。
- 復元元はbusiness fieldだけでなく、Task identity、CAS version、source keys、Review metadata、Calendar metadataを含む、行全体の信頼できる状態でなければならない。
- `authoritative_snapshot_json`自体の改変も検出・復元する。
- blank Task行へのpaste、新規Task IDの手入力、20行超paste、複数行mixed pasteでもpartial writeを残さない。
- Protectionは補助統制とし、正本性をProtectionだけに依存しない。

## R3-02 High: Setup再実行がlive driftをauthoritative snapshotへ再baselineする

### 事象

Schema extensionの`prepareTaskRowsForSnapshot()`は、Schema 2.4環境で既存snapshot列を除いたlive rowからsnapshotを再生成し、差分があれば書き戻す。

そのため、Trigger未発火、management corruption、手動paste後の例外等でlive business値がsnapshotと不一致になった状態でSetupを再実行すると、破損したlive値が新たなauthoritative snapshotとして確定される。

### 動的再現

```json
{
  "extension_status": "UPDATED",
  "updated_task_rows": 1,
  "snapshot_title_before": "Authoritative before drift",
  "live_title_before_setup": "Untriggered raw drift",
  "snapshot_title_after": "Untriggered raw drift",
  "live_title_after_setup": "Untriggered raw drift"
}
```

### 影響

- authoritative snapshotが改ざん・破損検出機構ではなく、破損値の承認機構になり得る。
- Setup再実行がdata-preservingではなく、trust boundaryを書き換える。
- 監査・revertの基準点が失われる。

### 必須修正方針

- Schema 2.4以降の既存rowについて、Setupやupgradeはlive値からsnapshotを無条件再生成してはならない。
- 旧Schema 2.3から初回snapshotを作る場合と、Schema 2.4以降のsnapshot検証・拡張を明確に分離する。
- 既存snapshotが欠損、壊れている、task_id不一致、business値と不一致の場合はfail-closedとし、明示的な修復経路へ送る。
- 次Schemaのfull trusted stateへ移行する場合は、旧snapshotを信頼起点とし、live management値を別途検証してから新snapshotを生成する。
- Setupはsilent rebaselineを行わない。

## R3-03 High: system metadata更新がsame-row Reviewをfalse conflictにする

### 事象

same-row Reviewの競合判定は、pending作成時の`expected_target_row_version`に対して、ACCEPT時の`row_version`が`expected + 1`であることを要求する。

一方、Calendar同期の`applyCalendarPatch()`は、`calendar_event_id`、`calendar_sync_status`、`last_calendar_sync_at`のようなCalendar-owned management metadataだけの更新でも共通`updateRowWithPatch()`を通じて`row_version`を増加させる。

その結果、pending作成後に業務値が一切変わっていなくても、Calendar metadata更新だけでACCEPTが`REVIEW_SAME_ROW_CONFLICT`となる。

### 動的再現

```json
{
  "staged_row_version": 2,
  "calendar_patch_operation": "UPDATE",
  "row_version_after_calendar_patch": 3,
  "accept_operation": "REJECTED",
  "accept_error_code": "REVIEW_SAME_ROW_CONFLICT",
  "review_state_after": "OPEN",
  "decision_after": "NONE"
}
```

### 影響

- business conflictとsystem metadata更新を区別できない。
- Calendar処理が正常に進むほど、Review受入が不要に拒否される。
- 内部に`restagePendingChange()`があっても通常UIに操作経路がなく、Reviewが実質的に停滞し得る。

### 必須修正方針

- physical write CAS用versionと、business/Review conflict用guardを分離する。
- 推奨案は`business_version`または`review_guard_hash`の導入である。
- Calendar metadata、diagnostic metadata、sync timestamp等はbusiness guardを変えない。
- 人間がbusiness fieldを編集した場合はbusiness guardを変え、ACCEPTをfail-closedにする。
- ACCEPT時は最新physical rowをLock下で読み、business guard、staged current values、manual fieldsを検証した後、最新physical versionに対してCAS適用する。

## R3-04 High: Task editとCalendar Outbox保存の間にdurability gapがある

### 事象

edit handlerは、まず`applyUserEdits()`でTask rowを書き換え、その後に`enqueueEditedTasks()`でCalendar Outboxを保存する。

Outbox Sheet欠損、Lock失敗、書込例外等が後段で発生した場合、Task editはすでにcommit済みである。ユーザーが同じ選択範囲を再実行しても、business値はすでに一致するため`NOOP`となり、失われたCalendar同期意図を再生成しない。

### 動的再現

```json
{
  "first_error": {
    "code": "E_CALENDAR_OUTBOX_MISSING",
    "message": "同期状態SheetがないためCalendar意図を保存できません。"
  },
  "title_after_failed_handler": "After outbox failure",
  "row_version_after_failed_handler": 2,
  "second_status": "COMPLETE",
  "second_result_operation": "NOOP",
  "second_outbox_summary": {
    "inspected_count": 0,
    "pending_count": 0,
    "delete_pending_count": 0,
    "noop_count": 0
  }
}
```

### 影響

- TaskとCalendarの整合性が恒久的に失われ得る。
- エラー後の単純再実行で回復できない。
- 利用者はSheet上の変更を見て同期済みと誤認し得る。

### 必須修正方針

次のいずれか、または同等のdurable designを採用する。

1. Task rowの同一commitで`calendar_reconcile_required`または同等のdurable intentを保存し、Outboxはその派生物として再構築可能にする。
2. Task editとOutbox意図を同一coordinator Lock内で処理し、後段失敗時に正本を確実にrollbackする。

Google Sheetsに真正なmulti-sheet transactionがないため、durable task-level intentとidempotent recovery scannerを推奨する。

## R3-05 Medium: same-row Reviewのrestage操作が通常UIにない

内部には`restagePendingChange()`があるが、`Menu.gs`には選択Reviewをrestageするmenu itemがない。

R3-03のような正当なsystem driftや、ユーザーがReview内容を再確認して基準を更新する場合、通常利用者が安全に復旧できない。

### 必須修正方針

- `選択したReviewを再stage`等の明示menuを追加する。
- 対象は1行、`needs_review=true`、`review_state=OPEN`、`review_type=EXISTING_CHANGE`だけとする。
- 確認dialog、Lock、target検証、note再生成、safe auditを必須とする。
- automatic restageは禁止する。

## R3-06 Medium: canonical Repository文書が旧context-hubを指している

GAS Repositoryを管理Repository・正本とするユーザー確定事項に対し、次が旧状態である。

- `PROJECT_CONTEXT.md`は`context-hub`を正本としている。
- `CURRENT_STATUS.md`はCode 2.8.2 / Schema 2.3を最新としている。
- `DECISIONS.md`のD-033はcontext-hubとlocal GoogleSpreadsheetの役割分担を採用状態としている。
- Round 2実装報告もInstruction sourceと同期先をcontext-hubとしている。

historical report自体は改変すべきではないが、canonical文書と新しい実装報告はGAS Repositoryへ統一する必要がある。

### 必須修正方針

- `DECISIONS.md`へ新Decisionを追記し、D-033を明示的に置換済みとする。
- `GAS-Project-Schedule`を案件context、実装、test、release、audit、instructionの唯一のGitHub正本とする。
- `PROJECT_CONTEXT.md`、`CURRENT_STATUS.md`、`README.md`を更新する。
- `MASTER_PLAN.md`はRepository記述に矛盾がある範囲だけ更新する。
- historical audit/reportは書き換えず、新しい報告で旧参照を説明する。

## R3-07 Medium: release manifestのsource provenanceが実態と一致しない

`v2.8.3-prepilot` manifestは、GAS Repositoryにcommit済みSourceが存在するにもかかわらず、次を記載している。

```text
Source commit: NOT AVAILABLE - repository has no commits
Source tree status: Repository has no source commit
```

この状態では、release payloadとcanonical Git commitの追跡性が不十分である。

### 必須修正方針

- source・test・tool修正を先にGAS Repositoryへcommitし、そのcommit SHAからrelease packageを生成する。
- release manifestへ、実際の`Tanukitsune-hub/GAS-Project-Schedule` source commitを記載する。
- source commitとrelease commitを分け、再現可能な2段階provenanceを持たせる。
- commitを確定できない場合はrelease readinessを宣言しない。

## 6. 次回Version方針

推奨Versionは次のとおり。

```text
Code Version: 2.8.4-prepilot
Schema Version: 2.5
AI Schema Version: 2.0
Migration Version: 2
```

Schema 2.5を推奨する理由は、full trusted state、business conflict guard、durable Calendar reconcile intentのいずれかが永続列または永続構造の変更を伴う可能性が高いためである。

## 7. 必須回帰test

### Management edit / restoration

1. `task_id`、`origin_key`、`row_version`、`authoritative_snapshot_json`を単独編集して全て元へ戻る。
2. Calendar metadata、source identifiers、AI metadata等のmanagement fieldを単独編集して元へ戻る。
3. business + management mixed pasteはevent全体を拒否し、全行・全列を元へ戻す。
4. 複数行paste、20行超paste、blank row paste、Task ID手入力でpartial writeを残さない。
5. snapshot欠損・改変時にlive rowを新たな正本にせずfail-closedとなる。

### Snapshot / Migration

6. Schema 2.3 genuine legacy rowだけが2.5へ安全にmigrateされる。
7. Schema 2.4 rowでsnapshotとlive business値が不一致の場合、Setupが停止する。
8. snapshot欠損、invalid JSON、task_id不一致、schema mismatchを検出する。
9. migration pause/resume後も同じtrusted stateを維持する。
10. Setup再実行でsnapshotが不必要に再生成されない。

### Review conflict

11. pending後のbusiness field変更はACCEPTを拒否する。
12. pending後のCalendar metadata更新だけではACCEPTを拒否しない。
13. physical `row_version`が変わってもbusiness guardが一致すれば、安全な最新CASで適用する。
14. restage操作後だけ新基準でACCEPTできる。
15. restage対象外、複数行選択、closed Reviewはfail-closedとなる。

### Calendar durability

16. Outbox Sheet欠損、append失敗、Lock取得失敗後も同期意図がdurableに残る。
17. 再実行またはrecovery workerがOutboxを再構築する。
18. Task editとCalendar intentのduplicate処理が冪等である。
19. NOOP manual editでも、未解消durable intentがあればrecovery対象となる。
20. create/update/delete/no-opの全Calendar intentを確認する。

### Governance / Release

21. canonical文書がGAS Repositoryを唯一の正本として一致する。
22. D-033が新Decisionにより置換済みになる。
23. `CURRENT_STATUS.md`がCode 2.8.4 / Schema 2.5 / Migration 2と監査Gateを正しく示す。
24. release manifestのsource commitが実在し、payloadがそのcommitと一致する。
25. Phase 8B・8C packageのchecksum、parity、secret scan、scope allow-listがPASSする。

### 全体

26. 既存36 suitesをすべて実行する。
27. 新規suiteを含めFAIL 0とする。
28. `tools/validate_apps_script_v2.js`を実行し、10 PASS / 0 FAILとする。
29. 実Google Workspace未実施項目をSKIPPEDまたはNOT EXECUTEDのまま維持する。

## 8. Gate判定

```text
Source syntax/global/static: PASS
Existing regression: PASS
Phase 8B Part A～C: HOLD（修正後packageへ一本化）
Phase 8B Part D以降の管理下再現試験: 実施可能
Phase 8B Part D以降の受入完了: NO-GO
Phase 8C TEST_MODE=false Sandbox: NO-GO
Phase 8D実業務パイロット: NO-GO
少人数・部内展開: NO-GO
```

## 9. 証跡

本監査の生データ。

```text
GoogleWorkspace_v2_8_3_reaudit_dynamic_results.json
GoogleWorkspace_v2_8_3_reaudit_verification_results.json
```

主な独立実行log。

```text
v283_test_run.log
v283_static_validation.log
v283_phase8b_checksum.log
v283_phase8c_checksum.log
```

## 10. 最終判断

Code `2.8.3-prepilot`は、前回より明確に改善しており、申告された回帰test・静的検証・release検証は独立再現できた。しかし、Task identity、snapshot trust boundary、Review競合、Calendar同期意図のdurabilityは、Task一覧を正本とするツールの中核統制である。

今回のFindingは単なる表示・保守性の問題ではなく、正本破損、破損値の再承認、正当Reviewの停滞、Calendar同期の恒久的欠落につながる。

したがって、次回修正と完全再監査がPASSするまで、Phase 8B Part D以降の受入完了は`NO-GO`とする。
