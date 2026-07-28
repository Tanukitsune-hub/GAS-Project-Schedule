# Google Workspace Personal Work OS v2.8.5
# 独立再監査・会社PC搬入準備指示

- Date: 2026-07-29
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Instruction branch: `codex/r5-independent-reaudit-transfer-prep`
- Fixed audit target ref: `3442ac01f5c544c2b49a40a9af170d1f432312f1`
- Fixed Source A5.2: `ff658bacf1e85864e4008efa32863635e446d47d`
- Fixed Release B5.2: `d6dda2b3eb9307e7033dcdd5f4718260c4944451`
- Target implementation branch for any accepted correction: `codex/r5-independent-reaudit-transfer-prep`
- Starting gate: `READY_FOR_INDEPENDENT_REAUDIT`
- Maximum gate after successful completion: `READY_FOR_PHASE8B_SANDBOX_TRANSFER`

## 1. Goal

固定済みGitHub ref `3442ac01...`を、前回実装報告に依存せずfresh clone／fresh worktreeから独立再監査してください。

再監査でHighまたは未解消Medium findingがない場合に限り、会社PCへ持ち込むPhase 8B非機密Sandbox package、搬入手順、受入チェックリストおよびrollback／stop条件を確定してください。

この作業は会社PCへの実搬入、Google Workspaceへのdeployment、`clasp push`、OAuth consent、実Gmail／Calendar操作、Automation有効化を行うものではありません。

## 2. 最初に読むもの

作業開始前に、対象Repository内で存在するものを次の順に全文確認してください。

1. `README.md`
2. rootおよび対象directoryに適用される`AGENTS.md`（存在する場合。現時点のGitHub確認ではrootには存在しない）
3. `CONTRIBUTING.md`（存在する場合。現時点のGitHub確認ではrootには存在しない）
4. `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`
5. `CURRENT_STATUS.md`
6. `DECISIONS.md`
7. `PROJECT_CONTEXT.md`
8. `MASTER_PLAN.md`
9. `docs/TASK_AUTHORITY_PROTOCOL.md`
10. `implementation/GoogleSpreadsheet/AUDIT_REMEDIATION_ROUND4_IMPLEMENTATION_REPORT.md`
11. `audits/2026-07-28/GoogleWorkspace_v2_8_5_Remote_Publication_Verification_2026-07-28.md`
12. Phase 8B／8C packageのmanifest、guide、checksums、verification tools
13. 関連tests、release builders、migration、Task authority、Calendar/outbox実装

指示書や報告書の結論を検証結果の代替にしないでください。

## 3. Git・remote baseline

最初に次を確認し、結果を監査報告へ記録してください。

```powershell
git rev-parse --show-toplevel
git status --short --branch
git remote -v
git fetch --prune origin
git cat-file -e 3442ac01f5c544c2b49a40a9af170d1f432312f1^{commit}
git cat-file -e ff658bacf1e85864e4008efa32863635e446d47d^{commit}
git cat-file -e d6dda2b3eb9307e7033dcdd5f4718260c4944451^{commit}
git rev-parse d6dda2b3eb9307e7033dcdd5f4718260c4944451^
git rev-parse 3442ac01f5c544c2b49a40a9af170d1f432312f1^
git merge-base --is-ancestor ff658bacf1e85864e4008efa32863635e446d47d d6dda2b3eb9307e7033dcdd5f4718260c4944451
git merge-base --is-ancestor d6dda2b3eb9307e7033dcdd5f4718260c4944451 3442ac01f5c544c2b49a40a9af170d1f432312f1
git diff --name-status ff658bacf1e85864e4008efa32863635e446d47d..d6dda2b3eb9307e7033dcdd5f4718260c4944451
git diff --name-status d6dda2b3eb9307e7033dcdd5f4718260c4944451..3442ac01f5c544c2b49a40a9af170d1f432312f1
```

期待関係:

- B5.2の直接親はA5.2
- P5の直接親はB5.2
- A5.2→B5.2はPhase 8B package 27 files、Phase 8C package 25 files、Round 4 report 1 fileの合計53 filesだけ
- B5.2→P5は`CURRENT_STATUS.md`、`README.md`、remote publication verification reportの3 filesだけ

異なる場合は`NO-GO_LINEAGE`で停止してください。

既存worktree、historic A5/B5、stage済み／untracked artifactを破棄してはいけません。必要ならfixed P5から新しいtemporary cloneまたはseparate worktreeを作成してください。

## 4. 独立再監査範囲

### 4.1 Authority architecture

コード、tests、design、migrationを横断し、少なくとも次を再検証してください。

- `タスク一覧`はbusiness/user-facing workflow surfaceであり、technical recovery authorityではない
- protected hidden `Task Authority Ledger`がcurrent Task recoveryの唯一のauthority
- Slot A／B、generation、`PREPARED`／`COMMITTED`、transaction metadataの状態遷移
- visible row writeがdurable transitions間で1回だけ実行されること
- pre-write failure、row-write before/after error、commit ack failure、retry exhaustionの回復
- `authoritative_snapshot_json`、cell note、raw visible rowがSchema 2.6 runtime fallbackにならないこと
- historical insertion-order hash compatibilityが既存protected slotの検証に限定されること
- canonical serialization、size limit、bounded scan、hash verification
- copied row／duplicate Task ID／missing authority／invalid slotのquarantine
- repeated copied-row isolationでdetached `qrow_`が増殖しないこと
- row moveがbusiness generationを作らずphysical hintだけをrebindすること
- physical deletionが`ORPHANED`になり、Taskを再生成しないこと
- multi-row editでinvalid rowがあってもvalid peersを復元できること
- row 1/2、internal ID、ledger header、visibility、protectionの復元
- Setup、Quick Diagnostic、Deep Diagnostic、Migration、edit、Worker、Review、Calendarがshared fail-closed validatorを使用すること
- authority validation前のraw Task rowがrepository indexへ登録されないこと

### 4.2 Calendar／Outbox

- Task editのCalendar reconcile intentがdurableであること
- enqueue後ack failure、before/after error、retryでintentを失わないこと
- authority-excluded jobはdurable `CANCELLED`となり外部Calendar I/Oを行わないこと
- orphan／quarantine／unrecoverable TaskがCalendar、Worker、Reviewへ流入しないこと
- duplicate external operationを防ぐidempotency／ownership／CAS境界

### 4.3 Migration 3

- Schema 2.5 legacy note anchorからのone-time migrationだけが許可されること
- current Schema 2.6 row、snapshot cell、live editable rowからsilent rebaselineしないこと
- bounded observation、checkpoint、resume、partial failure、ledger-only orphan reconciliation
- migration再実行の冪等性

### 4.4 Release／provenance

- A5.2 source boundaryとB5.2 release boundary
- release buildersがimmutable inputとして`apps-script-v2`と`tools`をguardし、generated `release/`をcompanion build阻害対象にしないこと
- build時のHEADがexact Source A5.2であること
- Phase 8B package: `TEST_MODE=true`、Automation OFF、test harness included
- Phase 8C candidate: `TEST_MODE=false`だけがaudited transform、harness excluded
- manifest、inventory、checksum、payload hash、source parity／transform parity、allow-list、secret scan、provenance
- rebuilt package byte parity
- `.clasp.json`、credential、実Workspace ID、個人情報、実メール本文が含まれないこと

### 4.5 Tests

fresh cloneまたはfresh worktreeで以下を実行し、commands、environment、exact countsを報告してください。

- 全`implementation/GoogleSpreadsheet/tests/*.js`
- `tools/validate_apps_script_v2.js`
- release package verification tools
- PowerShell parser／syntax checks
- remote publication consistency checks
- source and package secret scans
- rebuild and byte parity

現在の期待値は41 suites、604 PASS／0 FAIL／11 explicit real-Workspace/fake-runtime skips、validator 11/11、22 `.gs` filesです。期待値と一致しても、test assertionの妥当性と未検証境界をレビューしてください。

## 5. 正本文書の整合性修正

GitHub精査時点で次の不整合を確認済みです。

- `CURRENT_STATUS.md`と`README.md`: `READY_FOR_INDEPENDENT_REAUDIT`、A5.2/B5.2/P5公開済み
- `MASTER_PLAN.md`: `NO-GO_REMOTE_PUBLICATION`、A5.1/B5.1およびP1～P5 pending前提
- `PROJECT_CONTEXT.md`: publication gateが`NO-GO_REMOTE_PUBLICATION`で、remote publication完了前のboundary記載
- Round 4 implementation report末尾: package generation時点のpublication prerequisitesが残る

これらを勝手に同じ意味へ塗りつぶさず、次の扱いにしてください。

1. `MASTER_PLAN.md`と`PROJECT_CONTEXT.md`は現在の正本としてP5公開済み状態へ更新する。
2. Round 4 implementation reportはB5.2のhistorical package-generation reportであるため、過去時点の記録を改変しない。必要なら冒頭または末尾に「publication後のcurrent statusはP5 verificationを参照」と明確な追補だけを追加する。
3. `CURRENT_STATUS.md`、README、MASTER_PLAN、PROJECT_CONTEXT、DECISIONS、release manifest、audit reports間でversion、Schema、Migration、sheet count、hidden count、Task columns、ledger columns、Automation、gate、SHAsを照合する。
4. 独立再監査結果を反映する新しいaudit reportを作成する。

## 6. Findingとgate

FindingをSeverity別に記録してください。

- Critical: authority破壊、秘密情報混入、release provenance不成立、任意コード／認証重大問題
- High: Task state loss／誤復旧、Calendar誤操作、migration非冪等、releaseがSourceと一致しない
- Medium:重要文書不整合、guardrail不足、未カバーfailure path
- Low:可読性、軽微な文書・test改善

判定:

- CriticalまたはHighが1件以上: `REAUDIT_NO_GO`
- 未解消Mediumが会社PC搬入安全性へ影響: `REAUDIT_NO_GO`
- Lowのみ、または会社PC搬入へ影響しない明示的Mediumだけ: sourceを変更せず監査報告へ記録可能
- 全必須検証PASSかつ会社PC搬入手順が安全に確定: `READY_FOR_PHASE8B_SANDBOX_TRANSFER`

`READY_FOR_PHASE8B_SANDBOX_TRANSFER`は、会社PCへ非機密Phase 8B packageを持ち込めるという意味だけです。Phase 8B Sandbox受入PASS、Phase 8C GO、production ready、pilot readyではありません。

## 7. Findingがある場合の修正

独立再監査の証跡性を保つため、最初にfixed P5の監査結果を変更なしで記録してください。

修正が必要な場合:

- source／tests／tools／canonical docsの修正commitを先に作る
- release payloadへ影響する場合は、新Source commitからpackageを再生成し、別Release commitを作る
- release payloadへ影響しないcanonical-doc／audit-only修正は、理由とboundaryを明示した別commitとする
- amend、rebase、force push、reset、clean、unrelated revertは禁止
- fixed A5.2／B5.2／P5を改変・置換したように表現しない

修正後は全検証を最初から再実行してください。

## 8. PASS時の会社PC搬入準備

独立再監査がPASSした場合のみ、Phase 8B packageを会社PCへ持ち込むための成果物を確定してください。

### 必須成果物

1. `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/`の監査済みpackage
2. package SHA-256／file inventory／Source SHA／Release SHA／audit refを記載したtransfer manifest
3. 会社PC向け日本語導入手順
4. Phase 8B Sandbox acceptance checklist
5. Stop／rollback checklist
6. synthetic test data specification
7. 実行結果記録template
8. 「持込可だが実業務利用不可」を明記したREADME

### 搬入・Sandbox条件

- 新しい空のGoogle Spreadsheetだけを使用
- `TEST_MODE=true`
- Automation OFFを維持
- Mock AIのみ
- 自分宛ての完全なsynthetic／非機密メールだけ
- 実案件、個人情報、未公表情報、顧客情報を使用しない
- 実Provider credentialを設定しない
- time-driven triggerを有効化しない
- Calendarは専用のテスト用sub-calendar以外を使用しない。既存業務Calendarへ接続しない
- 各操作を手動で1件ずつ確認し、異常時は即停止
- Phase 8B acceptance完了前にPhase 8C packageを会社PCへ持ち込まない

搬入方式は会社規程に従ってください。GitHubへの会社PCからのアクセス可否、USB／Drive／メール等の許可を推測せず、手順では「会社承認済みの搬入経路」と表現してください。

## 9. GitHub成果物

最低限、次をRepositoryへ保存してください。

- `audits/2026-07-29/GoogleWorkspace_v2_8_5_Independent_Reaudit_Report_2026-07-29.md`
- machine-readable verification results（JSON等）
- 更新済み`CURRENT_STATUS.md`
- 更新済み`README.md`
- 更新済み`MASTER_PLAN.md`
- 更新済み`PROJECT_CONTEXT.md`
- 必要に応じたRound 4 report追補
- PASS時のみ、会社PC transfer guide／checklist／manifest／result template

既存Repositoryルールに適切な配置があればそれを優先してください。

## 10. Commit、push、PR

- 作業branch: `codex/r5-independent-reaudit-transfer-prep`
- remoteとworking treeを最初と最後に確認
- latest remoteを取得
- intentionalな単位でcommit
- normal non-force push
- `main`をbaseとするdraft PRを作成または、既存PRがあれば更新
- PR本文にfixed audit ref、findings、test counts、package hashes、status、未実施項目、Review Focusを記載

GitHub書込みに失敗した場合は、保存済み／push済み／PR作成済みと表現しないでください。

## 11. 禁止事項

- `clasp push`
- deployment
- OAuth consent
- 実Gmail／Calendar／Sheets操作
- Automation／trigger有効化
- Phase 8C packageの実利用
- 実Provider credential設定
- 実案件・個人情報・未公表情報の使用
- reset、clean、rebase、amend、force push、unrelated revert
- testsの削除、skip化、assertion弱体化
- findingを文書更新だけで解消扱いにすること

## 12. 最終報告形式

次を必ず報告してください。

1. Conclusionとfinal status
2. Fixed audit refと最終branch HEAD
3. Git lineage
4. Critical／High／Medium／Low findings
5. Source code review結果
6. Authority／Calendar／Migrationのfailure-path結果
7. Tests／validator／release verificationのexact results
8. Canonical-document consistency結果
9. 会社PC transfer packageの有無とSHA-256
10. 作成・更新ファイル一覧
11. Commit SHA、push結果、PR URL
12. NOT EXECUTED項目
13. 未解決事項
14. Review Focus

## 13. 推奨実行モデル

- Model: Terra Ultra
- Reasoning level: Ultra

この作業は広範な独立監査、failure-path検証、release provenance、文書正本整合、会社PC搬入安全性判定を含むため、Ultraを推奨します。