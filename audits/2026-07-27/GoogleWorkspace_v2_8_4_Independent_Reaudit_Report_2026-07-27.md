# Google Workspace Personal Work OS v2
# Code 2.8.4-prepilot 独立再監査報告

- 監査日: 2026-07-27
- 正本Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Source commit A: `a7f66eb4ca5ef71dab6faaaa595964c7af73326e`
- Release commit B: `2c31ba8303b9988ac96c0ef29b81e64eaee0c84b`
- 対象Version: Code `2.8.4-prepilot` / Schema `2.5` / AI Schema `2.0` / Migration `2`
- 独立再監査判定: `NO-GO`（Phase 8B受入開始前に追加修正が必要）

## 1. 結論

申告されたlocal regression、static validation、release parity、checksumおよびSource A / Release Bの分離は独立再現した。

```text
Regression suites: 38
PASS: 556
FAIL: 0
SKIPPED: 11
Static validation: 10 PASS / 0 FAIL
Phase 8B package: 27 files / payload 23 / checksum PASS / source parity PASS
Phase 8C candidate: 25 files / payload 22 / checksum PASS / audited transform以外のparity PASS
Source A -> Release B: exactly 1 commit
Release B差分: release 52 files + Round 3 implementation report 1 file
```

一方、既存testが対象としていないauthoritative stateの障害境界とSpreadsheet header editに、業務データの正本性または可用性へ影響する残存Findingを確認した。加えて、現行READMEから参照される可視化とRound 3報告のbackup記載に文書不整合がある。

したがって、Code `2.8.4-prepilot`は`READY_FOR_INDEPENDENT_REAUDIT`から受入段階へ進めない。次の修正候補を作成し、再度`READY_FOR_INDEPENDENT_REAUDIT`へ戻す必要がある。

## 2. 監査範囲

### 2.1 独立取得

GitHub Actionsを用いてSource AとRelease Bをcommit SHA固定で取得した。artifact digestは次のとおり。

```text
sha256:943ccca8f8c20b3ba3d1e1ef8f81d9bc029d51dd8c324ca84bc57ca4025f2150
```

一時PR #7はartifact取得後にmergeせずCloseした。

### 2.2 実施した検証

- Source Aの全38 test suite再実行
- `tools/validate_apps_script_v2.js`再実行
- Source A / Release Bのcommit差分確認
- Phase 8B / 8C packageの全checksum再計算
- Phase 8B source parity確認
- Phase 8Cの`TEST_MODE=true -> false`変換および`99_TestHarness.gs`除外以外のparity確認
- canonical文書・Version・Repository記述確認
- authoritative snapshot / note mirror / management edit / Setup / header editの追加fault injection

### 2.3 未実施

実Google Workspace、OAuth、native Protection、native Data Validation、実Gmail、実Calendar、installable/time-driven Trigger、実LockService競合、Apps Script quota、実Providerは`NOT EXECUTED`である。

## 3. 修正を確認した項目

R3-01～R3-07について、既存回帰testが対象とする主経路はPASSした。

- management列を含む通常editのevent全体拒否
- Schema 2.3 / 2.4 / 2.5 Migration分離
- `row_version`と`business_version`の分離
- Task-side durable Calendar intent
- 明示的Review restage menu
- GAS Repositoryへのcanonical統一
- Source A / Release Bの分離
- Gmail exact Message oldest-first policy

これらは、下記の追加Findingが存在しないことを意味しない。

## 4. 残存Finding

## R4-01 High: Task rowとtrusted note mirrorの更新がfailure-atomicではない

### 事象

Task更新は概ね次の順で行われる。

```text
1. Task row全体をsetValues
2. authoritative_snapshot_json cellのnoteへsetNote
3. Review note等の後続副作用
```

`setValues`成功後に`setNote`が失敗すると、live rowとsnapshot cellは新しい世代、trusted note mirrorは古い世代となる。rollback、commit marker、recovery scannerはない。

### 動的再現

有効な手動編集でsnapshot mirrorの`setNote`を1回だけ失敗させた。

```json
{
  "first_error": "INJECTED_SET_NOTE_FAILURE",
  "row_after": {
    "task_title": "After mirror failure",
    "row_version": 2,
    "business_version": 2
  },
  "mirror_unchanged": true,
  "second_error": "E_TASK_AUTHORITY_DRIFT"
}
```

Task編集はcommit済みだが、次の正規Task更新がtrusted mirrorとの不一致で停止した。Calendar durable intent、Review更新、Migration、Task insert等も同じrow-write / note-write境界を利用するため、影響は手動編集に限定されない。

### 影響

- 正当なTask更新後にTaskが以後更新不能となる。
- Calendar intentをTask rowへdurable commitしても、authority mirror failureによりrecovery経路が停止し得る。
- Migration中のnote書込み失敗でcurrent rowとtrusted stateが分離し得る。
- Apps Scriptの一時的なRange note書込失敗が恒久的な運用障害へ変わる。

### 必須修正

現在の`setValues -> setNote`という無印の二重書込みを廃止し、明示的なgeneration / hash / PREPARED / COMMITTED状態を持つfailure-recoverable protocolへ変更する。専用のprotected authority ledgerまたは同等のversioned two-slot方式を採用し、どの書込み境界で停止しても次回処理がcommit完了またはrollbackできることを必須とする。

## R4-02 High: trusted mirrorが任意扱いで、欠損時に編集対象cellを正本へ昇格できる

### 事象

runtimeはnote mirrorが空の場合、`authoritative_snapshot_json` cellへfallbackする。Schema 2.5のSetup/Migration検査はcell snapshotとlive rowの一致だけを確認し、runtimeが優先するnote mirrorを検査しない。

### 動的再現1: mirror欠損後のself-authorization

1. 正常Taskのtrusted note mirrorを空にする。
2. `task_title`と`authoritative_snapshot_json` cellを同じ改変値へ変更する。
3. management列を含むedit eventを処理する。

結果:

```json
{
  "mirror_missing_before_handler": true,
  "handler_status": "REJECTED",
  "handler_reason": "MANAGEMENT_COLUMN_EDIT",
  "title_after": "Tampered but self-authorized",
  "snapshot_title_after": "Tampered but self-authorized"
}
```

形式上は拒否されたが、fallback先の改変snapshotをtrusted stateとして採用したため、改変値が残り、さらにその値でnote mirrorが再作成された。

### 動的再現2: Setupのmirror blind spot

有効なSchema 2.5 rowのnote mirrorだけを別Task IDのsnapshotへ改変し、Setup前処理を再実行した。

```json
{
  "initial_status": "UPDATED",
  "corrupted_note_present": true,
  "rerun_status": "CURRENT",
  "snapshot_cell_unchanged": true
}
```

Setupはruntime trust sourceの破損を検出しなかった。

### 影響

- mirror欠損時にsnapshot cellとlive rowを同時改変すれば、管理列editの復元統制を迂回できる。
- Setupが正常終了しても、次のruntime writeで初めて`E_TASK_AUTHORITY_DRIFT`となり得る。
- `trusted mirror`がmandatory trust anchorではなく、任意cacheとして動作している。

### 必須修正

Schema 2.6以降ではauthority構成要素をmandatoryとし、欠損・不正・世代不一致を通常cell fallbackで補完してはならない。Setup、Quick/Deep Diagnostic、Task write、Migration、edit restoreのすべてが同じauthority validatorを使用すること。明示的repair以外でlive rowまたは編集対象snapshot cellからtrustを再生成しないこと。

## R4-03 High: 1行のauthority破損により、同一edit eventの全raw改変が残る

### 事象

multi-row restorationは全行のsnapshot parseを先に行い、1行でもtrusted mirrorが不正なら1行も復元せずthrowする。Spreadsheet edit自体はtrigger前に反映済みであるため、これはtransaction rollbackではなく、全raw改変の放置となる。

### 動的再現

2行の`row_version`を700 / 800へ改変し、2行目のmirrorを壊した後、同一eventとして処理した。

```json
{
  "error": "E_TASK_SNAPSHOT_INVALID",
  "row_a_version_after": 700,
  "row_b_version_after": 800
}
```

既存test `R3-01J_CORRUPT_TRUSTED_ROW_CAUSES_NO_PARTIAL_BATCH_WRITE`も、このraw改変残存をPASS条件としている。

### 影響

- 1行のauthority障害が、同じpasteに含まれる正常authority行の復元まで妨げる。
- handlerがerrorを返しても、正本Sheetには改変値が残る。
- 「event全体を拒否し完全復元」というRound 3報告と実挙動が一致しない。

### 必須修正

authority protocol自体をrecoverableにした上で、batch処理は各行を`RESTORED`、`QUARANTINED`、`UNRECOVERABLE`へ明示分類する。正常authority行は必ず復元し、異常行は専用control recordへ隔離して通常Worker・Review・Calendar対象から外すこと。errorだけ返してraw値を通常Taskとして残さないこと。

## R4-04 Medium: Task header editが検出後も元へ戻らない

### 動的再現

```json
{
  "header_edit": {
    "result": "HEADER_EDIT / IGNORED",
    "header_after": "改変ヘッダー"
  },
  "internal_id_edit": {
    "error": "E_SCHEMA_MISSING_COLUMN",
    "id_after": "tampered_internal_id"
  }
}
```

行2の日本語headerは無視され、行1のinternal IDはerrorになるが、いずれも改変値が残る。

### 影響

- internal ID改変後はedit handler自体がSchema不一致で停止する。
- header表示がcanonical schemaと乖離する。
- Protectionを上書きできるownerの誤操作に対するruntime復元がない。

### 必須修正

Task Sheetのheader row 1 / 2 editはcanonical schemaから即時復元する。internal ID、header、列数、列順の不整合を安全に検出し、通常Task rowを変更せず復旧する専用経路と回帰testを追加する。

## R4-05 Medium: 現行READMEから参照されるworkflow HTMLが旧Versionのまま

`docs/visualizations/GoogleWorkspace_v2_Workflow_Overview.html`は現在もCode `2.8.3-prepilot`、Schema `2.4`、旧Gateを表示し、47列full-row authority、`business_version`、durable Calendar intentを反映していない。root READMEから現行可視化として直接リンクされているため、historical fileではない。

### 必須修正

次Version確定時にHTMLとindexを更新し、volatileなCode/Schema/Gate値をbuild-time checkまたは自動testでcanonical metadataと照合する。少なくともstale Version文字列を検出する回帰testを追加する。

## R4-06 Medium: Round 3報告が記載するbackup directoryがGitHub正本に存在しない

Round 3実装報告は次を記載する。

```text
Archives/v2.8.3-prepilot_backup_before_v2.8.4-prepilot_2026-07-27/ (27 files)
```

Source AおよびRelease Bの完全treeを確認したが、当該directoryは0 filesで存在しない。

### 必須修正

backupがlocal-onlyであった場合は、新しい実装報告でその旨を明記し、GitHub上のrollback sourceをcommit / prior releaseとして示す。canonical Repositoryへ保存すべき成果物である場合は、secret scan後に格納する。存在しないGitHub成果物を保存済みと記載しない。

## 5. Gate判定

```text
Source syntax / static validation: PASS
既存38 regression suites: PASS
Release checksum / parity: PASS
Phase 8B Part A～C: HOLD
Phase 8B Part D以降の管理下再現試験: 実施可能
Phase 8B受入完了: NO-GO
Phase 8C TEST_MODE=false Sandbox: NO-GO
Phase 8D実業務パイロット: NO-GO
少人数・部内展開: NO-GO
```

Phase 8Bは、authority protocol修正後のpackageへ一本化する。

## 6. 次回Version方針

推奨:

```text
Code Version: 2.8.5-prepilot
Schema Version: 2.6
AI Schema Version: 2.0
Migration Version: 3
```

authority generation、commit state、ledgerまたは新しいpersistent controlを追加しない実装を選ぶ場合は、Schema / Migrationを維持できる根拠と、全fault-injection testを報告すること。ただし現在のoptional note fallbackを維持してはならない。

## 7. 必須回帰test

1. Task updateでrow write成功後、authority write失敗を注入しても、次回処理が自動回復する。
2. authority write成功後、row write失敗を注入しても、次回処理が自動回復する。
3. insert、update、manual edit、Review accept/reject/restage、Calendar patch/ack、Migrationの各境界で同じfailure matrixを確認する。
4. mirror/ledger欠損時にsnapshot cellへfallbackしない。
5. row、cell snapshot、authority storeの同時改変をself-authorizeしない。
6. Setup、Quick Diagnostic、Deep Diagnosticがauthority欠損・不正・世代不一致を検出する。
7. explicit repairは旧trusted generationまたは独立evidenceだけを起点とし、live raw rowを自動正本化しない。
8. multi-row editで1行authority不正でも、正常行のraw改変を残さない。
9. unrecoverable rowをquarantineし、Worker、Review、Calendar処理から除外する。
10. header row 1 / 2 editをcanonical schemaへ復元する。
11. 20行超および大規模management pasteをbounded処理し、soft budget途中でも回復可能にする。
12. Schema 2.5 -> 2.6 Migrationのpause/resume、idempotency、fault injection。
13. workflow HTMLのVersion / Schema / Gateとcanonical metadataの一致。
14. backup記載とGitHub treeの一致。
15. 既存38 suites、static validator、release checksum/parity/scope/secret scanをすべて再実行する。
16. 実Google Workspace項目をPASSへ昇格しない。

## 8. 監査証跡

- `GoogleWorkspace_v2_8_4_reaudit_dynamic_results.json`
- `GoogleWorkspace_v2_8_4_reaudit_verification_results.json`
- 本報告
