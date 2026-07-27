# Google Workspace Personal Work OS v2
# Code 2.8.4独立再監査後 次回修正・完全再検証 作業指示

- 作成日: 2026-07-27
- 唯一の正本Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- 監査対象Source A: `a7f66eb4ca5ef71dab6faaaa595964c7af73326e`
- 監査対象Release B: `2c31ba8303b9988ac96c0ef29b81e64eaee0c84b`
- 現在のVersion: Code `2.8.4-prepilot` / Schema `2.5` / AI Schema `2.0` / Migration `2`
- 現在のGate: Phase 8B `HOLD`、Phase 8B受入完了`NO-GO`
- 目標: 修正候補を`READY_FOR_INDEPENDENT_REAUDIT`へ到達させる

## 1. Codexへ貼り付ける指示

以下の作業を、`Tanukitsune-hub/GAS-Project-Schedule`だけを正本として実施してください。

今回の目的は新機能追加ではありません。Code `2.8.4-prepilot`の独立再監査で確認されたHigh Finding 3件とMedium Finding 3件を解消し、Task authoritative stateがGoogle Sheetsの部分失敗、note欠損、multi-row edit、Setup再実行に対してfailure-recoverableとなるよう修正することです。

旧`context-hub`を参照、更新、同期、完了報告先に使用してはいけません。

## 2. 作業開始前に読むもの

```text
GAS-Project-Schedule/
  PROJECT_CONTEXT.md
  MASTER_PLAN.md
  DECISIONS.md
  CURRENT_STATUS.md
  README.md
  audits/2026-07-27/
    GoogleWorkspace_v2_8_4_Independent_Reaudit_Report_2026-07-27.md
    GoogleWorkspace_v2_8_4_reaudit_dynamic_results.json
    GoogleWorkspace_v2_8_4_reaudit_verification_results.json
  instructions/
    GoogleWorkspace_v2_8_4_Next_Remediation_Work_Prompt_2026-07-27.md
  implementation/GoogleSpreadsheet/
    AUDIT_REMEDIATION_ROUND3_IMPLEMENTATION_REPORT.md
    apps-script-v2/
    tests/
    tools/
    release/
```

優先順位:

1. canonical 4文書と本指示書
2. Code 2.8.4独立再監査報告・dynamic evidence
3. 現行Source / tests / tools
4. Round 3実装報告
5. historical report / old release

矛盾時は推測で安全性を緩めず、fail-closedを採用し、実装報告に記載してください。

## 3. 必須Finding

### R4-01 High: row / snapshot cell / trusted authorityの更新がfailure-atomicでない

現状はTask row `setValues`後にsnapshot note `setNote`を行うため、後者の失敗でlive rowとtrusted mirrorが分離し、次の操作が`E_TASK_AUTHORITY_DRIFT`で停止します。

必須:

- 無印の`setValues -> setNote`二重書込みを廃止する。
- authority generation、hash、commit state等により、どの境界で停止しても次回実行でcommit完了またはrollbackできるprotocolへ変更する。
- 専用hidden/protected authority ledger、versioned two-slot方式、または同等以上の設計を採用する。
- current row、snapshot cell、authority storeのどれをtrust sourceとするかを一意にする。
- insert、update、manual edit、Review、Calendar patch/ack、Migrationの全Task write経路を同じcoordinatorへ統合する。
- authority storeへの書込みを1行ずつ無制限に行わず、batch/budget/pause-resumeを設計する。

### R4-02 High: authority欠損時のsnapshot cell fallbackとSetup blind spot

現状はtrusted noteが空なら編集可能なsnapshot cellへfallbackし、Setupはnote側を検証しません。

必須:

- Schema 2.6以降のauthority構成要素をmandatoryにする。
- mirror/ledger欠損・形式不正・task identity不一致・generation/hash不一致時にsnapshot cellへ通常fallbackしない。
- Setup、Quick Diagnostic、Deep Diagnostic、Task write、Migration、edit restoreで共通authority validatorを使用する。
- live rowまたはユーザー編集後snapshot cellを自動的に新しいtrust anchorへしない。
- explicit repairは、既存の独立trusted generation、監査済みbackup、または人が確認したrepair packageだけを起点にする。
- repair結果、対象Task、安全なreason codeをRun History / Errorsへ記録する。raw Task内容はlogへ保存しない。

### R4-03 High: authority不正1行でbatch全体のraw editが残る

必須:

- multi-row eventを各行`RESTORED`、`QUARANTINED`、`UNRECOVERABLE`へ分類する。
- authorityが正常な行のraw改変を必ず元へ戻す。
- authorityが壊れた行は通常Taskとして放置せず、専用control stateへ隔離し、Worker、Review、Calendar処理から除外する。
- handler errorだけを返し、改変済みrowを通常運用へ残してはいけない。
- event全体の結果をsafe auditへ記録する。

### R4-04 Medium: Task header editが復元されない

必須:

- Task Sheetのrow 1 internal IDs、row 2日本語headersをcanonical schemaから復元する専用経路を追加する。
- header edit eventでTask data rowを変更しない。
- internal ID、header、列数、列順の異常をQuick/Deep Diagnosticでも検出する。
- owner edit、single cell、multi-cell pasteをtestする。

### R4-05 Medium: workflow HTMLがCode 2.8.3 / Schema 2.4のまま

必須:

- `docs/visualizations/GoogleWorkspace_v2_Workflow_Overview.html`を修正後Versionとarchitectureへ更新する。
- full trusted authority、business version、durable Calendar intent、quarantine/recoveryを反映する。
- volatileなVersion / Schema / Gateがcanonical metadataと一致することをtestまたはbuild checkで保証する。
- `docs/visualizations/index.html`とroot README linkを確認する。

### R4-06 Medium: Round 3報告のbackup記載とGitHub treeが不一致

必須:

- `Archives/v2.8.3-prepilot_backup_before_v2.8.4-prepilot_2026-07-27/`がlocal-onlyなら、新しい実装報告で明記し、rollback sourceをGit commit / prior releaseとして示す。
- canonical GitHubへ保存すべきbackupなら、secret scan後に格納し、file count/hashを確認する。
- historical Round 3 reportは改変せず、新reportで訂正・位置づけを記載する。

## 4. Architecture gate

実装前に短い設計メモを作成し、少なくとも次を比較してください。

1. protected hidden authority ledger
2. versioned two-slot snapshot protocol
3. その他のfailure-recoverable方式

評価軸:

- partial failure recovery
- Task row deletion / row movementへの耐性
- current schema migration
- per-row service call数
- Apps Script execution budget
- owner誤操作
- auditability
- secret / personal information persistence
- rollback

選定案は、failure pointごとの状態遷移表とrecovery ruleを示してください。設計メモは実装報告へ含めるか`docs/`へ保存してください。

## 5. Version方針

原則:

```text
Code Version: 2.8.5-prepilot
Schema Version: 2.6
AI Schema Version: 2.0
Migration Version: 3
```

persistent field、authority sheet、generation、commit state等を追加しない場合は、Schema / Migrationを維持する根拠を実装報告へ記載してください。optional note fallbackの維持は認めません。

## 6. 必須fault-injection test

### Authority commit matrix

1. authority PREPARE前失敗
2. authority PREPARE後・Task row write前失敗
3. Task row write後・authority COMMIT前失敗
4. authority COMMIT後・review note / audit / outbox前失敗
5. retry / recoveryを複数回実行した場合の冪等性
6. stale workerが新generationをclearしないこと

各ケースを次へ適用する。

- new Task insert
- existing Task update
- manual edit
- Review ACCEPT / REJECT / restage
- Calendar patch / intent acknowledge
- Migration 2.5 -> 2.6
- multi-row restore

### Authority validation

7. authority欠損
8. invalid JSON / invalid format
9. task_id不一致
10. generation/hash不一致
11. rowとauthorityのbusiness drift
12. management drift
13. snapshot cellとauthorityを同時改変
14. note/ledgerだけを改変
15. Setup、Quick Diagnostic、Deep Diagnosticで同一判定
16. explicit repair以外でrebaselineされないこと

### Batch / quarantine

17. 2行中1行authority不正
18. 20行中複数行authority不正
19. 20行超management paste
20. blank row、Task ID直入力
21. 正常行は復元され、異常行だけquarantineされること
22. quarantine rowがWorker、Review、Calendar対象にならないこと
23. repair後だけ通常運用へ戻ること

### Header / docs

24. row 1 internal ID editの復元
25. row 2 header editの復元
26. header multi-cell pasteの復元
27. workflow HTMLのCode / Schema / Gate一致
28. backup記載とGitHub treeの一致

### Regression / release

29. 既存38 suitesをすべて実行する。
30. 新規suiteを追加しFAIL 0とする。
31. `tools/validate_apps_script_v2.js`を実行し10 PASS / 0 FAILとする。
32. Phase 8B / 8C packageのchecksum、parity、scope allow-list、secret scanを実行する。
33. 実Google Workspace項目をSKIPPED / NOT EXECUTEDのまま維持する。

## 7. Source / Release commit手順

Round 3と同じ2段階provenanceを維持する。

### Source commit A5

含めるもの:

- source
- tests
- tools
- canonical docs
- CHANGELOG
- workflow visualization
- new audit response / design note

含めないもの:

- 新しいrelease package
- release implementation report

### Release commit B5

Source A5からpackageを生成・検証した後、次だけを含める。

- `release/v2.8.5-prepilot/`
- `release/v2.8.5-prepilot-phase8c/`
- Round 4 implementation report

manifestは実在Source A5 SHAを記載する。Release content commitは`SELF`でよいが、確定B5 SHAを後続のaudit/current status等のGitHub証跡へ残す。

commit / PR / mergeはGAS Repository内だけで行う。force push、reset、clean、unrelated revertは禁止する。

## 8. 必須成果物

```text
implementation/GoogleSpreadsheet/
  AUDIT_REMEDIATION_ROUND4_IMPLEMENTATION_REPORT.md
  apps-script-v2/
  tests/
  tools/
  release/v2.8.5-prepilot/
  release/v2.8.5-prepilot-phase8c/

docs/
  visualizations/GoogleWorkspace_v2_Workflow_Overview.html

必要に応じてdocs/
  TASK_AUTHORITY_PROTOCOL.md
```

canonical文書を更新する。

- `PROJECT_CONTEXT.md`: Repositoryと情報管理の整合確認のみ
- `MASTER_PLAN.md`: authority / recovery architectureの反映
- `DECISIONS.md`: authority protocolの確定Decision追加
- `CURRENT_STATUS.md`: Version、test、Gate、Source A5 / Release B5
- `README.md`: current instruction / audit / visualization link

historical audit/reportは書き換えない。

## 9. 禁止事項

- 旧context-hubの参照、更新、同期
- live rowからのsilent trust再生成
- authority欠損時のsnapshot cell自動fallback
- raw editを通常Taskとして残したままerror終了
- Protectionだけを正本性の唯一の防御とすること
- failing testの削除、弱体化、不適切なSKIPPED化
- 実Google Workspace未実施項目のPASS化
- secret、credential、実メール本文、実Workspace ID/URLの保存
- Automation default ON
- 明示承認のないdeployment / clasp push

## 10. 最終報告形式

1. 結論: `READY_FOR_INDEPENDENT_REAUDIT`または`NO-GO`
2. R4-01～R4-06別の修正結果
3. authority protocolとfailure recovery state machine
4. 変更file / function
5. Migrationとrollback
6. 新規・更新test
7. 全regression / static結果
8. release checksum / parity / scopes / secret scan
9. Source A5 / Release B5 / PR
10. GitHub上のbackup記載整合性
11. 残存リスク
12. 実Google Workspaceで必要な受入
13. guardrail確認

全local testがPASSしても、最高statusは`READY_FOR_INDEPENDENT_REAUDIT`としてください。Phase 8B GO/PASS、Phase 8C GO、Production ready、Pilot readyを宣言してはいけません。
