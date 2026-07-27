# Google Workspace Personal Work OS v2
# 再監査・全体整合性検証報告書

- 監査日: 2026-07-27
- 対象コード: 添付 `apps-script-v2.zip`
- 対象実装報告: 添付 `AUDIT_REMEDIATION_IMPLEMENTATION_REPORT.md`
- 対象Version: Code `2.8.2-prepilot` / Schema `2.3` / AI Schema `2.0`
- 添付ZIP SHA-256: `999ebf2d7e6fed823a5ea825fc6c46e256b935afcedb6040d9bd987560548f69`
- 再監査判定: `NO-GO`（Phase 8B Part D以降の受入完了に進む前に追加修正が必要）

## 1. 結論

前回監査で指摘した主要Findingの多くは、コード上で修正を確認した。

特に、Calendar job limit、期限3項目の一体更新、`MANUAL_CONFIRMED`、cross-row Review CAS、通常TaskでのDecision拒否、TEST_MODE hard guard、RELATIVE期限Review gate、AI readiness分離等は、添付ソース上で改善されている。

一方、利用者がGoogle Sheets上でセルを編集した後にinstallable edit Triggerが状態を検証する設計について、次のHigh Findingを再現した。

1. 不正な利用者編集を検出しても、すでに変更されたセルを元に戻さず、矛盾状態がSheetへ残る。
2. 同じ項目を2回目以降に手動編集すると、変更が`NOOP`扱いとなり、`row_version`と`updated_at`が更新されない。
3. pending Review作成後に利用者が同じ項目を手動修正しても、その後のACCEPTでAI候補が手動修正を上書きする。

加えて、同一Thread内の複数Messageへ`手動/取込`を付けた場合、常に最新の該当Messageが選択され、処理済みとなった後も古い該当Messageが選択されない経路を確認した。

したがって、実装報告の`CONDITIONAL GO`は「非機密環境で不具合再現を含む管理下の試験を開始できる」という限定的意味では成立し得るが、「Phase 8B Part D以降の機能受入をPASSへ進められる状態」という意味では支持できない。

## 2. Gate判定

| 対象 | 再監査判定 | 理由 |
|---|---|---|
| Sourceの構文・global整合性 | PASS | 22/22個別構文、連結構文、global評価、namespace、Config参照がPASS |
| Phase 8B Part A～C | 条件付きGO | 新規・非機密SpreadsheetでSetup構成を確認する範囲。実Workspace確認は未実施 |
| Phase 8B Part D以降の管理下試験 | 実施可能 | 不具合再現・修正確認を含む試験としてのみ実施可能 |
| Phase 8B Part D以降の受入完了 | NO-GO | Edit TriggerとReview競合にHigh Findingが残る |
| Phase 8C TEST_MODE=false Sandbox | NO-GO | 実Provider・承認・OAuth未確認に加え、High Finding未解消 |
| Phase 8D実業務パイロット | NO-GO | Phase 8B/8C未完了 |
| 少人数・部内展開 | NO-GO | 同上 |

## 3. 監査範囲と制約

### 3.1 独立確認した対象

添付ZIP内の全26ファイルを対象とした。

- 22本の`.gs`
- `appsscript.json`
- `README.md`
- `CHANGELOG.md`
- `.clasp.json.example`

`.gs`の合計行数は27,360行である。

前回添付の`2.8.1-prepilot`ソースと比較し、19ファイル、約1,467行規模の変更を確認した。

### 3.2 添付ZIPに含まれなかったもの

次は今回のZIPに含まれていない。

- `tests/`
- `tools/validate_apps_script_v2.js`
- `release/v2.8.2-prepilot/`
- `release/v2.8.2-prepilot-phase8c/`
- `DEPLOYMENT_MANIFEST.md`
- `CHECKSUMS.sha256`

したがって、実装報告に記載された次の結果は、本再監査では独立再実行・独立照合していない。

- 36 suites、`501 PASS / 0 FAIL / 11 SKIPPED`
- Phase 8B source/package parity 23/23
- Phase 8B canonical payload SHA-256
- Phase 8C package parity
- Phase 8C canonical payload SHA-256
- release package checksum

これらについては、実装報告の記載を確認したにとどまる。

### 3.3 実施していない試験

- 実Google Workspace
- 実Gmail API
- 実Calendar API
- 実installable Trigger
- 実time-driven Trigger
- 実LockService競合
- 実OAuth
- 実AI Provider
- Apps Script quota・実行時間

## 4. 静的・構造検証結果

| 項目 | 結果 |
|---|---:|
| `.gs`個別構文 | 22/22 PASS |
| 全`.gs`連結構文 | PASS |
| 連結global評価 | PASS |
| top-level function重複 | 0 |
| top-level variable重複 | 0 |
| 未解決`WorkOsConfig`参照 | 0 |
| 未解決runtime namespace | 0 |
| `.getLastRow()`使用 | 0 |
| simple `onEdit` | 0 |
| `UrlFetchApp`直接使用 | 0 |
| `GmailApp`直接使用 | 0 |
| `CalendarApp`直接使用 | 0 |
| `eval`使用 | 0 |
| `appsscript.json` | JSONとして有効 |
| Sheet数 | 10 |
| Task列数 | 43 |
| Code Version | `2.8.2-prepilot` |
| Schema Version | `2.3` |
| TEST_MODE | `true` |
| Automation default | OFF |
| 実秘密情報パターン | 0件。Test Harnessのsynthetic文字列のみ |

## 5. 前回Findingの再確認

| Finding | 再監査結果 | コメント |
|---|---|---|
| F-01 Calendar limit | FIXED | `CALENDAR_MAX_JOBS_PER_RUN`へ統一し、整数検証を確認 |
| F-02期限3項目 | FIXED | `buildDeadlinePatch()`で一体更新 |
| F-03手動期限 | FIXED | `MANUAL_CONFIRMED`とCalendar適格性を確認 |
| F-04 target/CAS | PARTIAL | cross-row conflictは改善。同一行pending後の手動変更競合は未防止 |
| F-05 Decision guard | FIXED | 通常・terminal・closed Reviewを拒否しDecisionを復元 |
| F-06 invariant | PARTIAL | validatorは追加。ただしTrigger検出時点でraw editが既にSheetへ残る |
| F-07 exact Message | PARTIAL | unlabeled latestへの置換は修正。同一Threadの複数exact Messageの独立処理は未達 |
| F-08 Review note | PARTIAL | note生成・消去を確認。pending後の手動変更時にnoteを再同期しない |
| F-09 TEST_MODE guard | FIXED | production-mode書換えによる動的確認でもMock fallbackなし |
| F-10 Protection | FRESH SETUP FIXED | 新規Setupコードは改善。既存2.2環境への再適用経路は不足 |
| F-11 RELATIVE期限 | FIXED | ACCEPT前はCalendar不適格 |
| F-12 AI Diagnostic | FIXED | Mock/Production readinessを分離 |
| F-13日本語表示 | FIXED | Calendar Eventの期限根拠を日本語化 |
| F-14 legacy body | DEFERRED | 報告どおり残存 |
| Gmail `/u/0/` | DEFERRED | 報告どおり実環境確認待ち |

## 6. 残存Finding

## R-01 High: 不正な利用者編集がSheetへ残る

### 事象

Google Sheetsのedit eventは、セル変更後に発火する。`WorkOsEditHandler.handle()`は変更後の行を読み、`applyUserEdits()`で整合性を検証するが、Decision以外の不正編集について元の値へ戻す処理を持たない。

`applyUserEdits()`は候補行を`validateCandidateRow()`で拒否するものの、拒否対象のraw editはすでにSheetに書かれている。

### 動的再現1

`status=DONE`のTaskで利用者が`completed`をFALSEへ変更した。

検出結果:

```json
{
  "error": "TASK_STATE_DONE_FLAGS",
  "sheet_after": {
    "status": "完了",
    "completed": false,
    "row_version": 1
  }
}
```

### 動的再現2

open Review行で利用者が`completed`をTRUEへ変更した。

検出結果:

```json
{
  "error": "TASK_STATE_APPLIED_DECISION",
  "sheet_after": {
    "status": "要確認",
    "completed": true,
    "needs_review": true,
    "decision": "未選択",
    "review_state": "未確認",
    "row_version": 1
  }
}
```

### 影響

- invariant違反を検出しても破損行が残る。
- Diagnosticや次回Workerが不整合行で停止し得る。
- 「invalid Taskがwriteされないこと」という修正仕様を満たさない。

### 必須修正

edit eventの`oldValue`、編集前snapshot、または編集直前に保存した正規値を用い、次のいずれかを原子的に実現する。

1. 変更を検証してから正規化済み行を全体commitする。
2. validation失敗時に編集対象セルを確実にrevertする。

複数セル・複数行paste、checkbox、date、enumでもrevertできることが必要である。

## R-02 High: 2回目以降の手動編集がversion管理されない

### 事象

`applyUserEdits()`は、raw cell変更とは別に生成したpatchの差分だけを`cellChanges`へ入れる。対象項目がすでに`manual_fields`へ登録済みで、追加正規化が不要な場合、raw cellは変わっているにもかかわらず`cellChanges.length === 0`となり、`NOOP`で終了する。

### 動的再現

`task_title`がすでに`manual_fields`へ入っているTaskで、タイトルを再度手動変更した。

```json
{
  "operation": "NOOP",
  "sheet_after": {
    "task_title": "second manual title",
    "row_version": 1,
    "updated_at": "2026-07-26T00:00:00.000Z"
  }
}
```

### 影響

- 実データは変更されたが`row_version`が進まない。
- `updated_at`が更新されない。
- CAS、監査履歴、Review競合判定が信頼できない。
- Calendar対象項目でもoutbox enqueueを逃す可能性がある。

### 必須修正

edit eventで変更されたraw fieldを、正規化patchとは独立して「実変更」として扱う必要がある。validな利用者編集は、毎回必ず次を満たすこと。

- `row_version += 1`
- `updated_at`更新
- Calendar関連fieldならreconcile enqueue
- Review note・pending snapshotとの競合再評価

## R-03 High: pending後の手動修正をACCEPTが上書きする

### 事象

`stagePendingChange()`は`expected_target_row_version`と`current_values`を保存する。しかし、同一Task行の`EXISTING_CHANGE`を受け入れる経路は、受入時に保存済みtarget versionやcurrent valuesを再照合しない。

cross-rowの`PENDING_CONFLICT`はCAS検証されるが、same-row Reviewには同等のguardがない。

### 動的再現

1. AIが期限`2026-08-05`をpendingとして作成。
2. 利用者が期限を`2026-08-20`へ手動修正し、`MANUAL_CONFIRMED`となる。
3. pending ReviewをACCEPT。

結果:

```json
{
  "due_date": "2026-08-05T00:00:00.000Z",
  "deadline_basis": "明示",
  "manual_fields": "[\"due_date\"]",
  "decision": "受入",
  "review_state": "適用済"
}
```

AI候補が、後から行われた人間の正式修正を上書きした。

### 追加不整合

`syncReviewNote()`はpending作成時と新規Task作成時には呼ばれるが、通常の`applyUserEdits()`後には呼ばれない。このため、Review noteの「現在値」「手動競合」も古いままになり得る。

### 影響

- 人間補正をAIより優先する方針に反する。
- 表示noteと実際の現在値が不一致となる。
- ACCEPTの意味が利用者に表示された変更内容と一致しなくなる。

### 必須修正

same-row `EXISTING_CHANGE`でも、受入時に少なくとも次を検証する。

- pending作成時のexpected target version
- pending作成時のcurrent values
- 現在のmanual_fields
- pending対象fieldがpending作成後に変更されていないこと

競合時はACCEPTをfail-closedで拒否し、Decisionを元へ戻す。利用者編集後はReview noteを再生成し、manual conflictを表示する。

## R-04 Medium: 同一Threadの複数`手動/取込`Messageが独立処理されない

### 事象

`listManualCandidates()`は、同一Thread内で`手動/取込`が付いたMessageのうち最新を1件だけ返す。この選択時にMessage Stateの既処理情報を参照しない。

最新Messageが処理済みでも、次回も同じMessageを返す。Worker側のclaimでskipされるだけで、古いexact-labeled Messageは候補にならない。

### 動的再現

旧Messageと新Messageの両方へ`手動/取込`を付けた場合、2回呼び出しても両方とも`msg_new`が返った。

```json
{
  "first": "msg_new",
  "second": "msg_new"
}
```

### 影響

- 同一Threadの別MessageはMessage IDが異なれば独立処理可能、という仕様を満たさない。
- 人が残した古い`手動/取込`が永久に処理されない可能性がある。

### 必須修正

次のいずれかとする。

1. exact-labeled MessageをMessage単位で複数candidateとして返す。
2. Message Stateを参照し、未処理exact-labeled Messageの中から最新を返す。

候補上限はThread数ではなくMessage数との関係を明示し、同一Threadで複数Messageを安全に処理できるtestを追加する。

## R-05 Medium: 既存Schema 2.2環境へValidation・Protection変更が再適用されない

### 事象

新規SpreadsheetではS20/S30により最新Schema、Validation、Protectionが適用される。

一方、S20/S30が完了済みの既存環境では、Setupはcompleted stageをskipする。`refreshCompletedVersionMetadata()`が更新するのはversion metadataとsafe settings等であり、S20/S30を再適用しない。

また、`assertCompletedStageIntegrity()`はEnum Validationについて`VALUE_IN_LIST`であることだけを確認し、allowed valuesの内容まで確認しない。

Migration `2.2→2.3`はMessage State/Error列とrow schema metadataを主に更新し、Taskの`deadline_basis` Validationへ`手動確認`を追加する処理や、visible system-owned Sheetの新Protectionを再設定する処理を確認できない。

### 影響

既存2.8.1/Schema 2.2 Spreadsheetを更新した場合、次が古いまま残る可能性がある。

- `deadline_basis`のallowed valuesに`手動確認`がない。
- Dashboard、Run History、Guide、Errorsの新Protectionがない。

### 判定

新しい空のSpreadsheetを使うPhase 8Bでは直ちにBlockerとは限らないが、実装報告の「Schema 2.2→2.3 data-preserving upgrade」を広く支持するには不足がある。

## R-06 Low: Review noteのenum表示と管理列edit

- Review noteの期限根拠等は内部enum codeのまま表示される場合があり、日本語UI方針と完全には一致しない。
- management column editはwarning記録のみで、Protectionを突破した編集を元へ戻さない。実WorkspaceのProtectionを主要防御としているため、実環境試験が必要である。

## 7. TEST_MODE=false guardの独立確認

添付Sourceの`TEST_MODE`をin-memoryでFALSEへ変更し、主要Mock経路を直接呼び出した。

| 経路 | 結果 |
|---|---|
| `new MockAiAdapter()` | `E_TEST_MODE_DISABLED` |
| `new MockHttpTransport()` | `E_TEST_MODE_DISABLED` |
| `createAdapter({mode:'MOCK'})` | `E_TEST_MODE_DISABLED` |
| mode未指定`createAdapter()` | `E_REAL_AI_TRANSPORT_NOT_IMPLEMENTED` |

したがって、F-09のproduction-mode Mock fallback遮断は、添付Source上で支持される。

## 8. 実装報告との照合

| 実装報告の主張 | 再監査結果 |
|---|---|
| Version `2.8.2-prepilot` / Schema `2.3` | 一致 |
| 主要変更file | 概ね一致 |
| F-01、F-02、F-03、F-05、F-09、F-11、F-12、F-13修正 | Source上で支持 |
| F-04、F-06、F-07、F-08完全修正 | 支持できない。残存Findingあり |
| F-10修正 | fresh setupでは支持。既存upgradeは不足 |
| `501 PASS / 0 FAIL / 11 SKIPPED` | tests未添付のため独立確認不能 |
| release parity・checksum・canonical hash | release package未添付のため独立確認不能 |
| 実秘密情報なし | 添付Source scanでは支持 |
| Phase 8B Part D以降への`CONDITIONAL GO` | 制御下の試験開始に限定すれば可。受入完了のGateとしてはNO-GO |

## 9. 修正後に必須となる回帰test

1. DONE Taskのcompleted解除を拒否した際、セルが元値へ戻る。
2. open Reviewでcompleted/excluded等を不正変更した際、全セルが元へ戻る。
3. 複数セルpasteの一部がinvalidな場合、partial writeを残さない。
4. 同一manual fieldの2回目・3回目編集でも毎回row_versionとupdated_atが更新される。
5. title、due date、priority、Calendar modeのvalid編集が毎回outboxとversionへ反映される。
6. pending作成後に対象fieldを手動編集した場合、ACCEPTを拒否する。
7. pending作成後に無関係fieldだけを変更した場合の許可・拒否policyを明示する。
8. manual conflict後にReview noteが最新値へ更新される。
9. 同一Threadの複数exact-labeled Messageを、各Message IDごとに1回ずつ処理する。
10. 最新exact Message処理済み後に、古い未処理exact Messageが候補になる。
11. Schema 2.2完了済み環境で`手動確認`Validationとsystem-owned Protectionが2.3へ更新される。
12. 実installable edit Triggerで`oldValue`、複数cell、checkbox、dateのrevertを確認する。

## 10. 最終判定

コード品質は前回より明確に改善しており、基盤全体が動作しない状態ではない。また、前回High Findingの多くは修正されている。

しかし、Task一覧が正本である本ツールにおいて、利用者編集後のvalidation、versioning、pending Review競合は中核的なデータ整合性機能である。今回再現したHigh Findingは、単なる表示上の問題ではなく、破損状態の残存、人間修正の上書き、CASの信頼性低下につながる。

よって、追加修正前の判定は次のとおりとする。

```text
Phase 8B Part A～C: 条件付きGO
Phase 8B Part D以降の不具合再現・管理下試験: 実施可能
Phase 8B Part D以降の受入完了: NO-GO
Phase 8C: NO-GO
Phase 8D: NO-GO
少人数・部内展開: NO-GO
```
