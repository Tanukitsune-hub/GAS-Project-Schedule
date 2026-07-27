# Google Workspace Personal Work OS v2
# Code 2.8.3独立再監査後 次回修正・完全再検証 作業指示

- 作成日: 2026-07-27
- 正本Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- 現在の監査対象: commit `beeb1e55ef2b5afa04bb89ff0b75a75c85dff87e`
- 現在のVersion: Code `2.8.3-prepilot` / Schema `2.4` / AI Schema `2.0` / Migration `1`
- 現在のGate: Phase 8B Part D以降の受入完了は`NO-GO`
- 目標: Code `2.8.4-prepilot`を`READY_FOR_INDEPENDENT_REAUDIT`へ到達させる

## 1. Codexへ貼り付ける指示

以下の作業を、`Tanukitsune-hub/GAS-Project-Schedule` Repositoryだけを正本として実施してください。

今回の目的は新機能追加ではありません。Code `2.8.3-prepilot`の独立再監査で確認されたHigh Finding 4件とMedium Finding 3件を解消し、Source、test、tool、release、canonical文書、実装報告を一体として再現可能な状態にすることです。

旧`Tanukitsune-hub/context-hub`は参照・更新・同期先に使用してはいけません。完了報告、実装報告、release manifest、正本文書、GitHub linkはすべて`Tanukitsune-hub/GAS-Project-Schedule`へ統一してください。

## 2. 作業開始前に読むもの

次をこの順で確認してください。

```text
GAS-Project-Schedule/
  PROJECT_CONTEXT.md
  MASTER_PLAN.md
  DECISIONS.md
  CURRENT_STATUS.md
  README.md
  audits/2026-07-27/
    GoogleWorkspace_v2_8_3_Independent_Reaudit_Report_2026-07-27.md
    GoogleWorkspace_v2_8_3_reaudit_dynamic_results.json
    GoogleWorkspace_v2_8_3_reaudit_verification_results.json
  instructions/
    GoogleWorkspace_v2_8_3_Next_Remediation_Work_Prompt_2026-07-27.md
  implementation/GoogleSpreadsheet/
    AUDIT_REMEDIATION_ROUND2_IMPLEMENTATION_REPORT.md
    apps-script-v2/
    tests/
    tools/
    release/
```

解釈優先順位。

1. `PROJECT_CONTEXT.md`、`MASTER_PLAN.md`、`DECISIONS.md`、`CURRENT_STATUS.md`
2. Code 2.8.3独立再監査報告と動的・検証結果
3. 本作業指示
4. Round 2実装報告
5. 現在のsource・test・tool

正本文書の旧Repository記述は今回修正対象であり、`context-hub`を正本とする記述を維持してはいけません。

## 3. Baseline固定

作業開始時に次を記録してください。

- `git status`
- current branch
- current GAS Repository commit
- staged / unstaged / untracked files
- Code、Schema、AI Schema、Migration version
- test suite数
- Phase 8B / Phase 8C release package inventory
- 秘密情報scan

現在の独立確認Baseline。

```text
Repository commit:
beeb1e55ef2b5afa04bb89ff0b75a75c85dff87e

Code Version: 2.8.3-prepilot
Schema Version: 2.4
AI Schema Version: 2.0
Migration Version: 1
TEST_MODE: true
Automation: OFF

Suites: 36
PASS: 509
FAIL: 0
SKIPPED: 11
Static validation: 10 PASS / 0 FAIL
```

修正前に、独立再監査報告のR3-01～R3-07を現在のsourceで再現し、修正前FAILを保存してください。

## 4. Version方針

原則として次へ更新してください。

```text
Code Version: 2.8.4-prepilot
Schema Version: 2.5
AI Schema Version: 2.0
Migration Version: 2
```

永続構造を変更しないと証明できる場合だけSchema Version維持を検討できます。ただし、今回のtrusted full-row state、business conflict guard、durable Calendar intentの修正は永続構造変更を伴う可能性が高いため、Schema `2.5`、Migration `2`を基本としてください。

## 5. P0 Finding修正

## P0-1 R3-01: management column editを完全にfail-closed化

### 現在の不具合

- management-only editは`IGNORED`になるが、raw cellが元へ戻らない。
- `task_id`、`row_version`等が破損したまま残る。
- business + management mixed pasteではbusiness処理が進み、management改変も残り得る。
- `task_id`改変を含むmixed editはsnapshot検証で例外となるが、raw corruptionが残る。

### 必須挙動

1. event範囲にmanagement columnが1列でも含まれる場合、event全体を拒否する。
2. 影響する全行・全列を、trusted authoritative stateへ復元する。
3. business列だけを部分反映してはいけない。
4. `task_id`、`origin_key`、`row_version`、source keys、AI metadata、Calendar metadata、Review metadata、`authoritative_snapshot_json`を復元可能にする。
5. blank row、新規Task ID手入力、複数行paste、20行超pasteでもpartial writeを残さない。
6. snapshot field自体の改変を検出し、raw rowからsnapshotを再生成してはいけない。
7. Protectionは補助統制とし、ownerが編集可能でも正本が破損しない設計にする。

### 実装方針

次のいずれか、または同等以上の方式を採用してください。

- protected cellへversioned full-row authoritative snapshotを保持する。
- hidden trusted mirror tableをTask ID・row identityで管理する。

どちらの場合も、raw email本文、credential、token等を新規複製してはいけません。Task rowに既存するidentifierを扱う場合もpayload limit、schema validation、sanitizationを維持してください。

## P0-2 R3-02: Setup / Migrationのsnapshot trust boundaryを修正

### 現在の不具合

Schema 2.4環境でSetupを再実行すると、live rowからsnapshotを再生成し、Triggerを経由しないdriftを正当化する。

### 必須挙動

1. genuine Schema 2.3 legacy rowの初回snapshot作成と、Schema 2.4以降のsnapshot検証を分離する。
2. Schema 2.4以降で有効snapshotがある場合、live値から無条件に再baselineしない。
3. snapshot欠損、invalid JSON、task_id不一致、schema mismatch、business値不一致はfail-closedとする。
4. Schema 2.4→2.5 migrationでは、旧snapshotをtrust anchorとして使う。
5. live management値は独立validationを通してから新trusted stateへ組み込む。
6. migrationはbounded、resumable、idempotent、data-preservingとする。
7. corrupt rowを検出した場合は、対象row、error code、safe reasonをDead Letterまたは専用診断へ記録し、他rowへpartial migrationを起こさないpolicyを明示する。
8. Setup再実行はsilent repairやsilent rebaselineを行わない。

## P0-3 R3-03: physical versionとbusiness Review guardを分離

### 現在の不具合

Calendar-owned metadata更新でも`row_version`が増加し、業務値に変化がないsame-row Reviewが`REVIEW_SAME_ROW_CONFLICT`となる。

### 必須挙動

1. physical write CAS用versionと、business / Review conflict用guardを分離する。
2. 推奨は`business_version`またはcanonical `review_guard_hash`である。
3. human business edit、pending対象field変更、manual_fields変更はbusiness guardを更新する。
4. Calendar metadata、sync status、last sync timestamp等のsystem-only更新はbusiness guardを変えない。
5. ACCEPT時はlatest physical rowをLock下で取得する。
6. business guard、staged current values、manual fields、target identityを検証する。
7. 検証後、latest physical row versionへCAS適用する。
8. system-only driftだけの場合はACCEPT可能とする。
9. business driftの場合はDecisionを`NONE`へ戻し、人の値を維持してfail-closedにする。

## P0-4 R3-04: Task editとCalendar reconcile intentをdurable化

### 現在の不具合

Task edit commit後、Outbox保存前に失敗すると、Taskだけ更新される。単純再実行はNOOPとなり、Calendar同期意図を再生成しない。

### 必須挙動

1. Calendar関連Task editと同期意図の間にdurability gapを残さない。
2. 推奨はTask rowと同時に`calendar_reconcile_required`、`calendar_intent_version`、または同等のdurable markerをcommitする方式である。
3. Outboxはdurable Task intentから冪等に再生成可能とする。
4. Outbox Sheet欠損、append failure、Lock timeout後も同期意図を失わない。
5. recovery workerまたはDiagnostic repairは、未解消intentを検出してOutboxを再構築する。
6. create、update、delete、no-op全caseを扱う。
7. duplicate recoveryでもEvent重複を生じさせない。
8. NOOP manual editでも未解消durable intentがあればrecovery対象にする。

Google Sheetsの複数Sheet writeをtransactionとみなしてはいけません。rollbackだけに依存せず、crash後に再構築可能なpersistent intentを設計してください。

## 6. P1 Finding修正

## P1-1 R3-05: user-facing restage操作を追加

1. `Menu.gs`へ`選択したReviewを再stage`等の明示menuを追加する。
2. 対象は1行だけとする。
3. `needs_review=true`、`review_state=OPEN`、`review_type=EXISTING_CHANGE`を必須とする。
4. confirmation dialogを表示する。
5. target identity、business guard、pending payloadをLock下で検証する。
6. current values、manual conflicts、expected manual fields、noteを更新する。
7. automatic restageは禁止する。
8. safe auditを残し、raw IDs・JSON・message本文を表示しない。

## P1-2 R3-06: GAS Repositoryへ正本記述を統一

ユーザー確定事項として、`Tanukitsune-hub/GAS-Project-Schedule`を本プロジェクトの唯一のGitHub正本とします。

次を更新してください。

- `PROJECT_CONTEXT.md`
- `CURRENT_STATUS.md`
- `DECISIONS.md`
- `README.md`
- 必要な範囲の`MASTER_PLAN.md`

必須事項。

1. 新Decisionを追記し、D-033を`置換済み`にする。
2. GAS Repositoryをcontext、implementation、test、tool、release、audit、instructionの正本とする。
3. `CURRENT_STATUS.md`をCode 2.8.4 / Schema 2.5 / Migration 2および最新Gateへ更新する。
4. historical audit/reportは書き換えない。
5. 新しい実装報告で、旧reportのcontext-hub参照はhistoricalであると明記する。
6. 今後のGitHub linkと完了報告をGAS Repositoryへ統一する。

## P1-3 R3-07: release provenanceを実commitへ結び付ける

次の2段階commitを基本としてください。

```text
Commit A:
Source + tests + tools + canonical docs + CHANGELOG

Commit B:
Commit Aから生成・検証したPhase 8B / Phase 8C release package
+ implementation report
```

必須事項。

1. manifestへGAS Repositoryの実在するSource commit SHAを記載する。
2. `NOT AVAILABLE - repository has no commits`を残さない。
3. source/package parityをCommit A基準で検証する。
4. Phase 8B / Phase 8Cのpayload hash、file hash、checksumを再生成する。
5. release packageを変更後、checksumを再検証する。
6. manifestへRepository名、source commit、release commit、生成日時、TEST_MODE、Automation状態を記載する。
7. commitを確定できない場合、release readinessを宣言しない。

## 7. P2 Policy確認

R-04のexact Message進行について、同一Threadに複数`手動/取込`Messageがある場合の順序を明文化してください。

推奨policy。

```text
未処理exact Messageを受信時刻の古い順に処理する。
```

新しいMessageから古いMessageへ戻る現行policyを維持する場合は、古い依頼・取消・期限変更を後から適用して状態を巻き戻さないためのsupersession ruleを設計し、testを追加してください。

この項目はP0 blockerではありませんが、Phase 8B実Workspace受入前にpolicyとtestを固定してください。

## 8. 必須回帰test

### management edit

- management-only `task_id`
- management-only `origin_key`
- management-only `row_version`
- management-only snapshot field
- management-only Calendar metadata
- business + management mixed paste
- multiple-row mixed paste
- 20行超paste
- blank Task row paste
- snapshot tamper

期待結果は、event全体の拒否、全影響行の完全復元、version・timestamp・Outboxの非変更です。

### Setup / Migration

- Schema 2.3 genuine legacy → 2.5
- valid Schema 2.4 → 2.5
- live business drift + valid old snapshot
- missing snapshot
- malformed snapshot JSON
- task_id mismatch
- snapshot schema mismatch
- migration pause/resume
- repeated Setup idempotency
- no silent rebaseline

### Review guard

- pending後のhuman business editでACCEPT拒否
- pending後のCalendar metadata updateでACCEPT成功
- pending後のsync timestamp updateでACCEPT成功
- unrelated business editのpolicy通りの拒否
- physical version drift + business guard一致
- explicit restage後のACCEPT
- restage対象外・closed Review・複数行選択拒否

### Calendar durability

- missing Outbox Sheet
- Outbox append exception
- Lock timeout
- crash after Task commit before Outbox append
- recovery scan
- duplicate recovery
- create / update / delete / no-op intent
- NOOP manual retry with unresolved intent

### Canonical docs / release

- D-033が置換済み
- GAS Repositoryだけが正本として記載される
- CURRENT_STATUSのversion・Gate一致
- report内に旧context-hubを現行同期先として記載しない
- manifest Source commitが実在する
- source/package parity
- checksum
- secret scan
- OAuth scope allow-list
- Advanced Service allow-list
- Phase 8C Test Harness除外

### 全体

- 既存36 suitesをすべて実行する。
- 新規suiteを含めFAIL 0とする。
- SKIPPED 11件または実環境相当項目をPASSへ偽装しない。
- `tools/validate_apps_script_v2.js`を実行し、`10 PASS / 0 FAIL`とする。
- 全`.gs`個別構文、連結構文、global evaluation、namespace、Config参照、duplicate、secret scanをPASSさせる。

## 9. 実Google Workspace受入は今回実施しない

今回のlocal remediationで次をPASSとしてはいけません。

- OAuth consent
- native Data Validation
- Protection owner behavior
- Gmail exact Message mutation
- Calendar CRUD
- installable edit Trigger event shape
- time-driven Trigger
- LockService real contention
- Apps Script quota / runtime
- real Provider

すべて`NOT EXECUTED`または`SKIPPED`として残してください。

## 10. Guardrail

禁止事項。

- `context-hub`への書込み、commit、push、同期
- API key、password、token、private key、Authorization header、Cookieの保存
- 実メール本文、個人情報、未公表会社情報、実Workspace ID・URLの保存
- `git reset`、`git clean`、force push
- unrelated user changesのrevert
- failing testの削除、緩和、不適切なSKIPPED化
- external testをlocal fakeだけでPASSへ昇格
- Gmail、AI、Calendar外部I/Oをmain Script Lock内へ戻す
- Message ID、origin key、CAS、checkpoint、manual_fields、人間補正優先の弱体化
- v1.xコードの再利用・patch base化
- Automation defaultをONにすること
- Phase 8C packageをdeployment authorizationとして扱うこと

## 11. GitHub反映方針

今回の作業成果物は`Tanukitsune-hub/GAS-Project-Schedule`へだけ反映してください。

- Force操作は禁止。
- 既存履歴を保持する。
- Source commitとrelease commitを分ける。
- commit messageと報告にexact SHAを記載する。
- `main`へ直接pushする場合も、事前に全testとsecret scanを完了する。
- PRを使う場合は、source commitとrelease generationの境界が分かる構成にする。

## 12. 成果物

最低限、次を作成・更新してください。

```text
PROJECT_CONTEXT.md
MASTER_PLAN.md（必要箇所のみ）
DECISIONS.md
CURRENT_STATUS.md
README.md

implementation/GoogleSpreadsheet/
  AUDIT_REMEDIATION_ROUND3_IMPLEMENTATION_REPORT.md
  apps-script-v2/
  tests/
  tools/
  release/v2.8.4-prepilot/
  release/v2.8.4-prepilot-phase8c/

instructions/
  本指示書

audits/2026-07-27/
  次回独立再監査に必要な実装・検証証跡
```

Round 3実装報告には次を含めてください。

1. 結論
2. Finding別修正結果
3. pre-fix reproduction
4. changed files / functions
5. Schema・Migration設計
6. added / updated tests
7. all regression results
8. static validation
9. release parity / checksum / secret scan
10. Source commit / Release commit
11. NOT EXECUTED項目
12. residual risk
13. Git操作
14. guardrail確認

## 13. 最終ステータス

作業完了時の最上位statusは、全local testがPASSしても次だけとしてください。

```text
READY_FOR_INDEPENDENT_REAUDIT
```

次を宣言してはいけません。

- Phase 8B Part D PASS
- Phase 8B GO
- Phase 8C GO
- Production ready
- Pilot ready
- Department rollout ready

独立再監査でSource、test、release、canonical文書、動的再現が再確認されるまでGateは変更しません。
