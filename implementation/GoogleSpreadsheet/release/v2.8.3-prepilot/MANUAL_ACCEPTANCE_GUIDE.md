# Google Workspace Personal Work OS v2
# TEST_MODE=true Sandbox 手動受入ガイド

- 対象version: `2.8.3-prepilot`
- Schema Version: `2.4`
- AI Schema Version: `2.0`
- Migration Version: `1`
- Mode: `TEST_MODE=true`
- Automation default: `OFF`
- 対象Phase: Phase 8Bの非本番Sandbox受入

このガイドは、監査Finding修正後のdeployment packageを、新しい非本番Google
Spreadsheetへ安全に配置し、ローカルFakeでは確認できないSheets、Advanced
Gmail、Advanced Calendar、OAuth、installable edit Trigger、LockService、
Apps Script実行時間を確認するための受入手順です。package生成時点では
実Google Workspaceを操作していないため、以下の結果はすべて未記入です。

結果は実ID、本文、credential、内部URLを含まない受入記録へ転記してください。

## 0. 判定・情報管理ルール

- 実行し期待結果を確認した項目だけを`PASS`とする。
- 未実行は`NOT EXECUTED`とし、ローカルPASSから推定しない。
- 1件でも停止条件に該当したPartは`FAIL`とし、後続Partへ進まない。
- 実Spreadsheet / Script / Gmail / Calendar / Event ID、内部URL、OAuth情報、
  メール本文、件名、送信者、credentialを証跡へ貼らない。
- synthetic email、架空Task、自分から自分への非機密メールだけを使う。
- 会社メール、実案件、個人情報、未公表情報、添付を使わない。
- `TEST_MODE=true`、Automation `OFF`を変更しない。
- 実Provider、endpoint、model、credentialを設定・接続しない。
- time-driven Triggerを作成せず、通常Inbox自動巡回を行わない。
- cleanupで削除する場合は、利用者本人がSandbox専用resourceであることを確認する。

各Partの記録形式:

```text
Result: PASS / FAIL / NOT EXECUTED
Started at:
Finished at:
Duration:
Evidence reference:
Safe notes:
Stopped because:
Cleanup performed:
Reviewer:
```

試験区分:

| 区分 | 対象 |
|---|---|
| 必須 | 新規導入、scope、Setup、Sheets、手動Gmail、Mock AI、専用Calendar、edit Trigger、Dashboard、Diagnostic、Harness、通常の再実行 |
| 条件付き | 自然発生したretryable errorの回復、実行時間、Lock競合の実測 |
| 高度・別Sandbox | unknown/v1環境、同名Calendar衝突、Dashboard layout conflict、二重Worker、Calendar CAS競合 |
| 今回禁止 | 実Provider、TEST_MODE=false、通常Inbox自動巡回、time-driven Trigger、実案件、故意の外部障害 |

必須項目だけを通常の一本道として実施します。条件付き・高度項目は、安全に前提を
作れる専用Sandboxがない場合、`NOT EXECUTED`が正しい結果です。

## Part A: 導入前チェック

### 前提

- Phase 8B package
  `release/v2.8.3-prepilot/`を使用する。
- 非本番Googleアカウントと新しい空のSpreadsheetを使用できる。
- Gmail labelと専用secondary Calendarを作ることを利用者本人が理解している。

### 操作

1. `DEPLOYMENT_MANIFEST.md`で次を確認する。

   - Code `2.8.3-prepilot`
   - Schema `2.4`
   - AI Schema `2.0`
   - Migration `1`
   - `TEST_MODE=true`
   - Automation `OFF`
   - `.gs` 22件、`appsscript.json` 1件

2. `CHECKSUMS.sha256`を照合する。
3. packageに`.clasp.json`、credential、test、Archive、prompt、実ID、実URLが
   ないことを確認する。
4. 新しい空のSpreadsheetを作成し、timezoneを`Asia/Tokyo`にする。
5. TEST_MODE=false、実Provider、実案件、通常Inbox、自動Triggerは今回対象外と
   記録する。

### 期待結果

- package checksumがすべて一致する。
- Spreadsheetは空で、未知dataやv1構造がない。
- 外部境界がすべて`NOT EXECUTED`または`NOT CONFIRMED`である。

### 停止条件

- checksum不一致、想定外file、秘密情報、実ID、version不一致。
- 非本番環境であることを確認できない。

### Rollback / cleanup

- Apps Scriptへ配置する前なので、packageを使用停止し、Spreadsheetを削除する
  場合は利用者本人が対象を確認する。

## Part B: Apps Script配置

### 前提

- Part Aが`PASS`。
- Sandbox利用者本人がOAuth consentを行う。

### 操作

1. Spreadsheetの`拡張機能` → `Apps Script`を開く。
2. packageの`apps-script/`から22個の`.gs`を同名で配置する。
3. Project Settingsでmanifest表示を有効にし、`appsscript.json`を置き換える。
4. ServicesでGmail API v1、Calendar API v3を確認する。
5. manifestのOAuth scopeが次の7件だけであることを確認する。

   - `spreadsheets.currentonly`
   - `script.container.ui`
   - `script.scriptapp`
   - `userinfo.email`
   - `gmail.modify`
   - `calendar.app.created`
   - `calendar.calendarlist.readonly`

6. 外部HTTP、Drive、mail-send、`mail.google.com`全体、Calendar全権限scopeが
   ないことを確認する。
7. Spreadsheetを再読込し、`業務OS v2`メニューを確認する。

### 期待結果

- Apps Script source 23件がpackageと一致する。
- Gmail API v1とCalendar API v3だけがAdvanced Serviceとして有効。
- 表示された各OAuth promptを利用者本人が都度確認し、想定外scopeがなく、
  prompt回数を記録する。

### 停止条件

- 想定外OAuth scope、別version、file欠落、構文error。
- 実Script IDをRepository、package、証跡へ保存しそうになった場合。

### Rollback / cleanup

- Setup前に停止した場合はApps Script projectとSpreadsheetを閉じ、証跡から
  実IDを除去する。

## Part C: Setup

### 前提

- Part Bが`PASS`。
- Gmail label 7件、専用secondary Calendar、Task編集用installable edit
  Triggerが作成されることを理解している。

### 操作

1. `業務OS v2` → `初期セットアップ`を実行する。
2. `PAUSED`の場合だけ、画面のnext actionに従い
   `セットアップを続行`を実行する。
3. `COMPLETE`まで進んだら、Setup所要時間と実行回数を記録する。
4. Apps ScriptのTrigger一覧を確認する。
5. `自動処理の状態を確認`を実行する。

### 期待結果

- 利用者Sheet 6件と非表示管理Sheet 4件の合計10件。
- 正式Gmail label 7件。
- 専用secondary Calendar `自動期日管理`が1件で、primary Calendarではない。
- 所有者installable edit Triggerが1件。
- time-driven Triggerは0件。
- Automationはdisabled / OFF。
- Setup説明は次の操作を表示し、通常Inbox、実AI、5分Triggerを開始しない。

### 停止条件

- 未知data、v1らしい構造、同名Calendar所有権不明、main Calendar参照。
- time-driven Trigger作成、Automation ON、実Provider要求。
- Setupが既存内容を削除・clearしようとする。

### Rollback / cleanup

- 自動修復、既存data削除、同名Calendar削除を行わない。
- safe error code、時刻、非機密画面だけを記録して停止する。

## Part D: Phase 1 Sheets確認

### 前提

- Part Cが`PASS`。

### 操作

1. `タスク一覧`の1行目が内部ID、2行目が日本語見出し、3行目以降がdata領域で
   あることを確認する。
2. `タスク一覧`が43列で、管理列が右側にあり、非表示・保護されることを確認する。
3. 空行のCheckbox対象cellにBoolean `FALSE`が入っていないことを確認する。
4. `コメント`列にCheckboxがなく、Boolean列だけにCheckbox validationがある
   ことを確認する。
5. 日付format、Enum validation、利用者編集列、Protectionを確認する。
6. `Phase 1テストを実行`する。
7. `Phase 1 Mock Taskをupsert`を2回実行する。
8. `Quick Diagnostic`を実行し、時間を測定する。

### 期待結果

- Harnessの実行済みlocal項目にFAILがない。
- 同じMock Taskは1行だけで、3行目付近に作成される。
- Quick DiagnosticにFAILがなく、60秒以内を目標に完了する。
- Quick Diagnostic前後でSheet、Task、Dashboard、Property、Triggerが変わらない。

### 停止条件

- Sheet/列重複、空行FALSE、コメントCheckbox、管理列欠落、Protection不一致。
- Diagnosticがlayoutを修復または外部通信する。

### Rollback / cleanup

- Mock Taskを手動削除してSchemaを変えない。Sandbox結果に残したまま後続testで
  識別する。

## Part E: Gmail手動取込

### 前提

- Part Dが`PASS`。
- 完全syntheticまたは自分から自分への非機密メールだけを使用する。

### 操作

1. 正式label 7件が重複なく存在することを確認する。
2. 件名先頭を`[MOCK:NEW_HIGH]`にした架空メールへ`手動/取込`を付ける。
3. `手動/取込を1件前処理`を実行する。
4. 同じ操作を再実行する。
5. 別の架空Threadへ`手動/取込`と`手動/除外`を両方付けて実行する。
6. 既読・未読のsynthetic Messageを各1件確認する。

### 期待結果

- 1実行の新規Messageは最大1件で、read/unreadに依存しない。
- Message ID単位でdedupし、同じMessage Stateは1行だけ。
- `手動/除外`、Spam、Trashが優先される。
- 通常Inbox自動走査、添付、外部URL取得を行わない。
- 本文、件名、送信者、raw IDが永続Sheetや実行結果へ保存されない。

### 停止条件

- 会社メール、個人情報、添付、通常Inboxを処理しそうになった場合。
- 同じMessageが重複、または本文がlog / Sheetへ保存された場合。

### Rollback / cleanup

- synthetic Threadのlabelだけを利用者本人が整理する。会社labelや既存Threadを
  変更しない。

## Part F: Mock AI / Review

### 前提

- Part EのMessageがPREPROCESSED。
- 実Provider registryは空である。

### 操作

1. `Phase 3/4 Mock縦フローを1件処理`を実行する。
2. 同じMessageを再実行する。
3. synthetic fixture
   `[MOCK:NEW_REVIEW]`、`[MOCK:INFERRED]`、
   `[MOCK:INVALID_JSON]`、prompt-injection-as-dataを確認する。
4. Review Taskの同じ行にある`判断`を受入または却下へ変更する。
5. 利用者編集列、`manual_fields`、`コメント`が後続Mockで保持されることを
   確認する。
6. `Phase 2テストを実行`、`Phase 3テストを実行`を順に実行する。

### 期待結果

- 外部AI、`UrlFetchApp`、credentialを使用しない。
- 同じ`origin_key`のTaskは重複しない。
- Review専用Sheetを作らず、同じ`タスク一覧`行で受入・却下できる。
- 推測期限は`推奨期限`だけに入り、正式期限やEventにならない。
- 不正JSONとprompt injection fixtureはTask副作用前に安全に処理される。
- script由来の式prefixはformulaにならない。

### 停止条件

- 外部Provider接続要求、実AI通信、利用者field上書き、Task重複。

### Rollback / cleanup

- 実Provider設定を追加しない。synthetic TaskはSandbox証跡として保持する。

## Part G: Calendar

### 前提

- Part Fが`PASS`。
- 専用Calendarが非共有secondary Calendarであることを確認済み。

### 操作

1. Review解消済み・正式期限ありのsynthetic Taskで`Calendar登録`を`登録`へ
   変更する。
2. `同期状態`にPENDINGが1件作成されたことを確認する。
3. `Calendar同期を1件処理`を実行する。
4. 同じ操作を再実行する。
5. Task名または期限を変更し、再度同期する。
6. Taskを完了または対象外にし、再度同期する。
7. 正式期限なし、Review中、Calendar対象外のTaskも確認する。
8. `Phase 4テストを実行`する。

### 期待結果

- 専用Calendarだけに終日Eventが最大1件作成される。
- EventはTask期限日の1日Eventで、titleは`【期限】<Task名>`。
- attendee、guest、conference、inviteがない。
- descriptionに本文、件名、添付、credential、raw IDがない。
- 再実行はNOOP、変更は同じowned EventのUPDATE、非対象化はDELETE。
- primary Calendarとforeign Eventは不変。
- 1回の明示同期は最大1 Job。

### 停止条件

- primary Calendar、foreign Event、共有設定を変更しそうになった場合。
- Event重複、所有marker不一致、同名Calendar衝突。

### Rollback / cleanup

- app所有Eventだけを通常flowでDELETEする。foreign Eventを手動削除しない。

## Part H: Edit Trigger

### 前提

- Part Cで所有者installable edit Triggerが1件。

### 操作

1. `タスク一覧`の利用者編集列で、期限、優先度、対応状況、完了、対象外、
   返信待ち、Calendar登録、コメントを編集する。
2. 最大20行以内のbulk pasteをsynthetic Taskで実行する。
3. 編集が自動反映されることを確認する。
4. 問題時だけ対象cellを選び、
   `Task編集を手動反映（fallback）`を実行する。
5. 管理列の直接編集が安全に拒否されることを確認する。

### 期待結果

- installable edit Triggerは1件だけで、再帰的な重複処理がない。
- 選択行だけが更新され、row version、manual fields、Calendar Outboxが整合する。
- fallbackはGmail、AI、Calendar APIを呼ばない。

### 停止条件

- time-driven Trigger追加、無関係row更新、管理列上書き、20行超の無制限処理。

### Rollback / cleanup

- AutomationはOFFのまま。誤編集は利用者編集列だけを手動で戻し、管理列を
  直接修正しない。

## Part I: Retry / Dead Letter（構造確認は必須、実回復は条件付き）

### 前提

- 実障害を意図的に作らない。
- 自然に発生したsynthetic retryable errorがなければ実回復は
  `NOT EXECUTED`とする。

### 操作

1. `Phase 5テストを実行`、`Phase 6テストを実行`、
   `Phase 7テストを実行`を順に実行する。
2. local / Mock項目にFAILがないことを確認する。
3. 実Provider、実Trigger、実Gmail自動検索、実回復項目が
   SKIPPED / NOT EXECUTEDであることを確認する。
4. 自然に発生したretryable `DEAD`行があり、原因が解消済みの場合だけ、
   最大5行を選択して`選択したDead Letterを再実行予約`を実行する。

### 期待結果

- retryは初回後5 / 15 / 60分、4回目失敗でDEAD。
- 同じDead Letter、Message、Task、Eventは重複しない。
- 非retryable、未解決設定、checkpoint不一致、5行超は拒否される。
- Provider registry empty、TEST_MODE enable拒否、Automation OFFを維持する。

### 停止条件

- 実Provider、通常Inbox、Calendar、認証を故意に壊す必要がある場合。
- raw Gmail / Calendar IDの入力を求められた場合。

### Rollback / cleanup

- 実障害を作らない。未実施項目は`NOT EXECUTED`と記録する。

## Part J: Dashboard / Diagnostic（通常確認は必須、layout conflictは高度）

### 前提

- Part Dまでが`PASS`。

### 操作

1. `Quick Diagnostic`を実行し、所要時間を測る。
2. `Deep Diagnostic（明示・読取専用）`を実行し、所要時間を測る。
3. `運用Dashboardを更新`を実行する。
4. Dashboardの17指標とsource Sheetの前後差を確認する。
5. 別の専用Sandboxでblank-key value / formulaまたはforeign metadataを
   system block候補へ置き、Dashboard更新がwrite前停止することを確認する。

### 期待結果

- Quickは60秒、Deepは180秒を目標に完了する。
- Diagnosticはrepair、Dashboard更新、Gmail、AI、Calendar、Trigger、
  Dead Letter retryを行わない。
- Dashboardは17 aggregate指標だけで、Task名、件名、送信者、raw ID、
  credential、payloadを表示しない。
- layout conflictは`E_DASHBOARD_LAYOUT_CONFLICT`でfail closedし、利用者の
  value / formula / metadataとsource Sheetを変更しない。

### 停止条件

- Diagnosticの副作用、Dashboardから外部通信、利用者行上書き。

### Rollback / cleanup

- conflictを自動修復しない。専用negative-test Sandboxを閉じる。

## Part K: 再実行・冪等性・安全停止（通常再実行は必須、衝突試験は高度）

### 前提

- Parts C〜Jの主要flowが完了。

### 操作

1. `初期セットアップ`または`セットアップを続行`を再実行する。
2. Sheet、列、label、Calendar、edit Trigger、Task、Message、Eventの件数を
   前後比較する。
3. 別の新規Spreadsheetで未知の非空cellを1つ用意し、Setupを実行する。
4. さらに別のSpreadsheetでv1らしいSheet名またはheaderを用意し、Setupを
   実行する。
5. 安全に実施できる場合だけ、手動取込とTask編集、Calendar同期とTask編集を
   別実行で重ね、stale結果がcommitされないことを確認する。

### 期待結果

- Setup再実行で利用者dataやTaskが消えず、全resourceが重複しない。
- unknown / v1環境は変更・Migrationせず停止する。
- 外部I/O待機中も短時間claim / CASにより利用者編集を戻さない。
- concurrencyを安全に再現できない項目は`NOT EXECUTED`。

### 停止条件

- destructive setup、v1 migration、duplicate resource、stale field overwrite。

### Rollback / cleanup

- unknown / v1 test環境を修復せず、結果記録後に利用者本人が削除する。

## Part L: Sandbox終了・証跡保存

### 前提

- 実施できたPartの結果が記録済み。

### 操作

1. `自動処理の状態を確認`でAutomation OFFを再確認する。
2. Apps Script Trigger一覧でtime-driven 0件を確認する。
3. Provider / endpoint / model / credential未設定を確認する。
4. PASS / FAIL / NOT EXECUTEDを結果templateへ転記する。
5. screenshotとmemoから実ID、内部URL、メール本文、OAuth情報を除去する。
6. Setup、Quick、Deep、Workerの所要時間を記録する。
7. Sandboxの専用CalendarとSpreadsheetを残すか削除するか、利用者本人が判断する。

### 期待結果

- Phase 8Bの証跡が非機密で自己完結している。
- 実Provider、TEST_MODE=false、time-driven Trigger、実案件、個人pilotは
  `NOT EXECUTED`。
- Phase 8C / 8Dへ自動的に進まない。

### 停止条件

- 証跡に実ID、本文、credential、内部URLが残る。

### Rollback / cleanup

- 削除前に対象がこのSandbox専用resourceであることを利用者本人が確認する。
- shared / primary Calendar、既存label、無関係Triggerを削除しない。

## 最終判定

| Stage | 判定 |
|---|---|
| Phase 8B TEST_MODE=true非機密Sandbox | GO / CONDITIONAL GO / NO-GO |
| Phase 8C TEST_MODE=false Sandbox | NO-GO |
| Phase 8D 個人実業務パイロット | NO-GO |

Phase 8Bは、Parts A〜Lで実施対象とした項目にFAILがなく、停止条件がなく、
未実施外部境界が明確な場合だけ`GO`または`CONDITIONAL GO`とします。
