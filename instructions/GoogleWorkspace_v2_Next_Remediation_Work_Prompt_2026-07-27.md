# Google Workspace Personal Work OS v2
# 次回修正・完全再検証 作業プロンプト

- 作成日: 2026-07-27
- 対象実装Repository: `GoogleSpreadsheet`
- 現在の確認Baseline: Code `2.8.2-prepilot` / Schema `2.3` / AI Schema `2.0`
- 現在のGate: Phase 8B Part D以降の受入完了は`NO-GO`
- 目的: 独立再監査で確認された残存Findingを解消し、完全な再監査packageを提出できる状態にする

## Codexへ貼り付ける指示

以下の作業を、現在開いている`GoogleSpreadsheet` Repositoryで実施してください。

今回の目的は、新機能追加ではありません。2026-07-27の独立再監査で確認されたHigh Finding 3件とMedium Finding 2件を解消し、Phase 8B Part D以降の受入可否を再判定できる完全な検証packageを作ることです。

### 1. 正本・監査資料と優先順位

作業開始前に、次を読んでください。

```text
Tanukitsune-hub/context-hub/
  projects/google-workspace-personal-work-os/
    PROJECT_CONTEXT.md
    MASTER_PLAN.md
    DECISIONS.md
    CURRENT_STATUS.md
    audits/2026-07-27/
      AUDIT_REMEDIATION_IMPLEMENTATION_REPORT.md
      GoogleWorkspace_v2_Reaudit_Report_2026-07-27.md
      GoogleWorkspace_v2_reaudit_static_results.json
      GoogleWorkspace_v2_reaudit_dynamic_results.json
```

解釈の優先順位は次のとおりです。

1. `PROJECT_CONTEXT.md`、`MASTER_PLAN.md`、`DECISIONS.md`、`CURRENT_STATUS.md`
2. 独立再監査報告と静的・動的再現結果
3. 前回の実装報告
4. 現在のソースとテスト

実装報告と独立再監査が矛盾する場合、現在のGate判定は`CURRENT_STATUS.md`と独立再監査報告を優先してください。

### 2. 現在のGate

現在の正式なGateは次のとおりです。

```text
Phase 8B Part A～C: 条件付きGO
Phase 8B Part D以降の不具合再現・管理下試験: 実施可能
Phase 8B Part D以降の受入完了: NO-GO
Phase 8C TEST_MODE=false Sandbox: NO-GO
Phase 8D実業務パイロット: NO-GO
少人数・部内展開: NO-GO
```

今回のローカル修正が完了しても、独立再監査前にPhase 8B Part D以降を`GO`または`PASS`と判定してはいけません。作業完了時の最上位表現は、条件を満たした場合でも`独立再監査提出可能`または`READY FOR INDEPENDENT REAUDIT`としてください。

### 3. 作業開始時の安全確認

最初に次を実施し、結果を作業報告へ記録してください。

1. `git status`、現在branch、commit有無、staged、unstaged、untrackedを確認する。
2. 既存のユーザー変更、stage済みfile、release packageを上書き・破棄しない。
3. 現在の全test、Apps Script構文検査、global評価、namespace・Config参照検査をBaselineとして実行する。
4. 監査報告のR-01～R-05を、既存コード上で修正前に再現する。
5. 修正前にFindingを検出する回帰testを追加し、修正後にPASSさせる。

次の操作は禁止します。

```text
git reset
git clean
force操作
既存差分の無断revert
明示指示のないcommit、push、PR、deployment
failing testの削除・緩和・不適切なSKIPPED化
実環境未実施項目のPASS化
```

### 4. 必須修正範囲

## R-01 High: invalidな利用者編集をSheetへ残さない

現状は、installable edit Triggerがinvariant違反を検出しても、Decision以外のraw editがSheetへ残る場合があります。

必須挙動は次のとおりです。

1. invalid editは、処理終了時点でTask一覧へ残さない。
2. validation失敗時は、編集前の正規値へ確実に戻す。
3. 単一cellだけでなく、checkbox、date、enum、複数cell paste、複数行pasteを対象とする。
4. 複数cellの一部だけがinvalidな場合、partial writeを残さない。
5. revert処理による再帰的Trigger、二重version更新、二重Calendar enqueueを防ぐ。
6. rejected editではbusiness state、`row_version`、`updated_at`を変更しない。必要な監査logだけを残す。
7. Decision欄に実装済みのrestore動作を弱めない。

Google Sheetsのedit eventは変更後に発火するため、単一cellの`oldValue`だけに依存して複数cell pasteを安全に扱えると仮定してはいけません。

実装は、既存アーキテクチャを精査したうえで、次のいずれかの安全な方式としてください。

- 編集前のauthoritative snapshotからaffected rangeを復元する。
- validation後に正規化済みrowを原子的に再commitする。
- 別の最小限のshadow stateを導入し、複数cellを含めて完全復元する。

新しい永続構造を追加する場合は、Schema VersionとMigrationを適切に更新してください。復元不能な編集を単にlogして残す実装は不可です。

## R-02 High: validなmanual editを毎回version管理する

同じfieldがすでに`manual_fields`へ入っている場合でも、利用者が値を再変更した事実を`NOOP`として扱ってはいけません。

validな実変更ごとに、必ず次を満たしてください。

```text
row_version += 1
updated_atを更新
manual_fieldsを維持または追加
監査記録を更新
Calendar resourceまたはeligibilityへ影響するfieldならreconcileをenqueue
open Reviewがある場合は競合判定とReview noteを再評価
```

要件。

1. raw editで変更されたfieldを、正規化patchとは独立して実変更として認識する。
2. 2回目、3回目以降の同じmanual field編集でも毎回versionを1だけ増やす。
3. 1回の利用者操作でversionを二重増加させない。
4. 正規化後の値が編集前と実質同一の場合だけ、明確な`NOOP`としてよい。
5. `task_title`、`due_date`、`priority`、Calendar同期mode等の代表fieldを個別にtestする。
6. rejected editではversionを増やさない。

## R-03 High: same-row pending ACCEPTで人間修正を上書きしない

same-row `EXISTING_CHANGE`でも、ACCEPT時にpending作成後の競合を再検証してください。

少なくとも次を確認します。

```text
expected_target_row_version
pending作成時のcurrent_values
現在の対象field values
現在のmanual_fields
pending対象fieldが作成後に変更されていないこと
Review row自身のversionとopen state
```

必須挙動。

1. pending対象fieldが作成後に手動変更されていた場合、ACCEPTをfail-closedで拒否する。
2. Decision cellを元へ戻す。
3. 人間の現在値を保持し、AI候補で上書きしない。
4. Reviewを勝手に`APPLIED`へ進めない。
5. Review noteを最新のcurrent value、candidate value、manual conflictへ更新する。
6. raw ID、message本文、秘密情報、内部URLをnoteへ表示しない。
7. conflict解消後の再stageまたは明示的なReview再生成経路を用意する。

pending作成後に無関係fieldだけが変わった場合のpolicyは、既存の確定Decisionに従ってください。確定Decisionがない場合は、推測でpermissiveにせず、fail-closedで拒否して再stageする方針を採用し、その理由を実装報告に記載してください。

## R-04 Medium: 同一Threadの複数exact Messageを独立処理する

`手動/取込`はMessage単位です。次を維持してください。

```text
手動/除外: Thread全体で最優先
手動/取込: exact Message単位
処理済み判定: Gmail Message ID単位
```

必須挙動。

1. 同一Thread内で複数Messageへ`手動/取込`がある場合、各Messageを独立candidateとして扱う。
2. 各Message IDを最大1回だけ処理する。
3. 最新exact Messageが処理済みなら、古い未処理exact Messageを次回candidateにする。
4. unlabeled latest Messageへ置き換えない。
5. `手動/除外`がThread内にあればThread全体を除外する既存優先順位を維持する。
6. candidate limitがThread数なのかMessage数なのかをコードと文書で明確にする。
7. AIへ渡すcontextは、対象Messageより後のMessageを混入させない。
8. Message State、claim、idempotency、watermarkを弱めない。

実装は、Message単位で複数candidateを返す方法、またはMessage Stateを見て未処理exact Messageを順次返す方法のいずれでも構いません。ただし、同一Thread内の複数Messageが飢餓状態にならないことをtestで示してください。

## R-05 Medium: Schema 2.2→2.3 upgradeでValidation・Protectionをrefreshする

fresh setupだけでなく、S20/S30完了済みの既存Schema 2.2環境を対象としてください。

必須対象。

1. Taskの`deadline_basis` Validationへ`手動確認`を追加する。
2. Dashboard、Run History、Guideを最新のowner-only Protectionへ更新する。
3. Errors Sheetは`retry_requested`だけを操作可能にする。
4. 100行超へ拡張した場合もValidationとProtection geometryを維持する。
5. completed stageを単にskipして古いValidation・Protectionを残さない。
6. integrity checkは`VALUE_IN_LIST`という型だけでなく、allowed valuesの内容まで確認する。
7. upgradeは冪等、data-preserving、既存Task・Message State・Error rowを破壊しないものとする。
8. v1.xからの後方互換Migrationを新設しない。

Code Versionは原則`2.8.3-prepilot`を推奨します。永続Schemaを変更しない場合はSchema `2.3`を維持して構いません。R-01対応で新しい永続field、Sheet、snapshot構造を追加する場合はSchemaを適切にbumpし、明示的なMigrationと回帰testを追加してください。

### 5. Low項目の扱い

次は今回のGate解除の必須条件ではありません。

```text
legacy runtime bodyの大規模削除
Gmail /u/0/のmulti-account対応
Review noteの全enum日本語化
```

既存機能を不安定化させない小規模修正であれば対応して構いませんが、R-01～R-05より優先してはいけません。保留する場合は実装報告に残存Lowとして明記してください。

### 6. 必須回帰test

最低限、次のtestを追加または強化してください。

1. DONE Taskの`completed`解除を拒否し、cellが元値へ戻る。
2. open Reviewで`completed`、`excluded`、`status`等を不正変更し、affected cellsが元へ戻る。
3. checkbox、date、enumのinvalid editがrevertされる。
4. 複数cell pasteの一部がinvalidでもpartial writeが残らない。
5. 複数行pasteでも破損rowが残らない。
6. 同一manual fieldの2回目・3回目編集で、毎回`row_version`と`updated_at`が更新される。
7. valid edit1回につきversionが正確に1増える。
8. rejected editでversionが増えない。
9. `task_title`、`due_date`、`priority`、Calendar同期modeのvalid editが監査・Calendar reconcileへ正しく反映される。
10. pending作成後に対象fieldを手動編集すると、ACCEPTが拒否され人間の値が保持される。
11. pending conflict時にDecisionが復元され、Reviewがopenのまま残る。
12. manual conflict後にReview noteが最新値へ更新される。
13. pending作成後に無関係fieldを変更した場合のpolicyをtestで固定する。
14. 同一Threadの複数exact-labeled Messageを各Message IDごとに1回処理する。
15. 最新exact Message処理済み後に、古い未処理exact Messageがcandidateになる。
16. 同一Threadに`手動/除外`があれば、exact importより除外を優先する。
17. Schema 2.2完了済み環境で`手動確認`Validationとsystem-owned Protectionが2.3へ更新される。
18. upgradeを2回実行してもdata、Validation、Protectionが重複・破損しない。
19. 既存の全suiteを実行する。
20. 全`.gs`個別構文、連結構文、global評価、top-level重複、Config・namespace参照、secret scanを実行する。

可能な範囲で、実installable edit Triggerを必要としないpure/fake testと、実Workspaceでしか確認できないacceptance項目を分離してください。実環境未実施項目は`NOT EXECUTED`または`SKIPPED`とし、PASSへ昇格させてはいけません。

### 7. 既存アーキテクチャの維持事項

次を弱めないでください。

```text
Google SheetsをTask・期限・状態の正本とする
Message ID、origin key、Task IDによる冪等性
row_version、CAS、claim、checkpoint
manual_fieldsによる人間修正保護
人間補正をAIより優先
AI推測期限と正式期限の分離
RELATIVE期限のReview gate
TEST_MODE=falseでのMock/Test hard guard
Automation初期値OFF
Gmail、AI、Calendar等の長時間外部I/Oをmain Script Lock外へ置く
Setup、Runtime、Diagnostic、Migrationの責務分離
Runtimeからレイアウト修復を呼ばない
Diagnosticから全行書換えやDashboard更新を呼ばない
```

### 8. Version、release package、独立再監査package

修正後は、新しいrelease directoryを作り、旧`v2.8.1`および`v2.8.2`を上書きしないでください。

推奨例。

```text
release/v2.8.3-prepilot/
release/v2.8.3-prepilot-phase8c/
```

Phase 8B package。

```text
TEST_MODE=true
Automation OFF
99_TestHarness.gsを含める
22 .gs + appsscript.jsonを基本とする
```

Phase 8C候補package。

```text
TEST_MODE=false
Automation OFF
99_TestHarness.gsを除外
Mock/Test menuとpublic entrypointを使用不能にする
実Provider未設定時はfail-closed
```

次をすべて再生成・検証してください。

```text
DEPLOYMENT_MANIFEST.md
SANDBOX_QUICKSTART.md
CHECKSUMS.sha256
source/package parity
package inventory
canonical payload SHA-256
secret scan
.clasp.json非同梱確認
manifest scope確認
```

次回の独立再監査では、Sourceだけでなく、次を一式で提出できる状態にしてください。

```text
apps-script-v2/
tests/
tools/
release/v2.8.x-prepilot/
release/v2.8.x-prepilot-phase8c/
DEPLOYMENT_MANIFEST.md
CHECKSUMS.sha256
修正実装報告
```

### 9. 必須成果物

Repository内へ次を作成してください。

```text
AUDIT_REMEDIATION_ROUND2_IMPLEMENTATION_REPORT.md
```

READMEとCHANGELOGも更新してください。

実装報告には、少なくとも次を含めます。

1. 結論。`READY FOR INDEPENDENT REAUDIT`、`NOT READY`、または`NO-GO`のいずれか。
2. R-01～R-05別の修正結果。
3. R-01で採用したrevert・snapshot方式と、複数cell pasteの安全性。
4. R-03で採用したsame-row pending conflict policy。
5. 変更したfileとfunction。
6. 追加・更新したtest。
7. 修正前再現と修正後結果。
8. 全test、構文、global、namespace、secret scan結果。
9. Schema・Migration・Version変更。
10. Phase 8B/8C release package、parity、checksum、canonical hash。
11. 未解決事項と残存Low。
12. 実Google Workspaceで必要なacceptance項目。
13. Git状況。
14. commit、push、PR、deploymentを行っていないことの確認。

### 10. 禁止事項

次を行ってはいけません。

- `context-hub`の正本4文書をユーザー確認なしに更新する。
- API key、password、token、Authorization header、Cookie、private keyを保存する。
- 実メール本文、添付資料、個人情報、未公表情報を保存する。
- 実Spreadsheet ID、Calendar ID、Gmail Message ID、Thread ID、内部URLを保存する。
- local `.clasp.json`や環境固有credentialをreleaseへ含める。
- failing testを削除・緩和してPASS数だけを増やす。
- 実Workspace未実施項目をPASSとして報告する。
- 実Provider未設定なのにProduction AI readinessをPASSとする。
- Phase 8B Part D以降を独立再監査前にGOまたはPASSと判定する。
- ユーザーの既存差分を無断でrevertする。
- 明示指示なくcommit、push、PR作成、deploymentを行う。

### 11. 作業終了時のチャット報告順序

次の順で報告してください。

1. 最終判定。
2. R-01～R-05の修正結果。
3. 重要な設計判断とfail-closed箇所。
4. 変更file・function。
5. 追加・更新test。
6. 全test・静的検査結果。
7. release package、parity、checksum、canonical hash。
8. 未解決事項・残存リスク。
9. 実Workspace acceptance項目。
10. Git状況と、commit・push・PR・deployment未実施の確認。
11. 独立再監査へ提出する全file一覧。

不確実な点や、監査報告と現在のコードが矛盾する点がある場合、推測で安全性を下げる実装を採用せず、fail-closedを選び、実装報告へ矛盾点、採用理由、残存影響を記載してください。
