# Google Workspace Personal Work OS v2
# TEST_MODE=true Sandbox Quickstart

対象version: `2.8.1-prepilot`

この手順は、Phase 8Bで新しい非本番Google Spreadsheetへ導入する利用者向けです。
Phase 8Aではpackageと手順を準備しただけで、実Google Workspace操作は実施して
いません。

## 1. 守る条件

- 新しい空の非本番Spreadsheetだけを使う。
- synthetic email、架空Task、自分から自分へ送った非機密メールだけを使う。
- 会社メール、実案件、個人情報、添付、未公表情報を使わない。
- `TEST_MODE=true`、Automation `OFF`を変更しない。
- 実Provider、endpoint、model、credentialを設定しない。
- `自動処理を明示的に有効化`は実行しない。
- 実ID、URL、メール本文、OAuth情報を証跡へ貼らない。
- SetupはSandbox accountに正式Gmail label 7件、専用secondary Calendar、
  所有者installable edit Triggerを作成する。実行前にこの副作用を確認する。

条件を満たせない場合は導入を開始しないでください。

## 2. Package確認

1. `DEPLOYMENT_MANIFEST.md`を開き、version、file数、scopeを確認する。
2. `CHECKSUMS.sha256`と各fileのSHA-256を照合する。
3. `apps-script/`に22個の`.gs`と`appsscript.json`だけがあることを確認する。
4. `.clasp.json`、credential、test、Archive、prompt、実IDがないことを確認する。

不一致が1件でもあれば、Apps Scriptへ配置せず停止してください。

## 3. 新しいSandboxへ配置

1. 非本番Googleアカウントで、新しい空のGoogle Spreadsheetを1つ作成する。
2. Spreadsheetのtimezoneを`Asia/Tokyo`にする。
3. `拡張機能` → `Apps Script`を開き、SandboxのScript projectを確認する。
4. 組織で承認済みの`clasp` CLIが利用できる場合は、`apps-script/`をRepository
   外の一時directoryへbyte-copyし、実Script IDをその一時directoryの
   `.clasp.json`だけへ設定して`clasp push`する。これを推奨経路とする。
5. `clasp`を利用できない場合だけ、fallbackとして`apps-script/`の22個の
   `.gs`を同名で配置し、Project Settingsでmanifest表示を有効にして
   `appsscript.json`を置き換える。
6. ServicesでGmail API v1とCalendar API v3が表示されることを確認する。
7. 表示された各OAuth画面でDeployment Manifest記載の7 scope以外が要求されて
   いないことを都度確認し、Sandbox利用者本人が承認する。prompt回数を記録する。
8. Spreadsheetを再読込し、`業務OS v2`メニューを確認する。

実Script IDをRepository、package、証跡へ保存しないでください。一時
`.clasp.json`はdeployment後もGit対象directoryへ移動しません。

## 4. Setup

1. `業務OS v2` → `初期セットアップ`を1回実行する。
2. `PAUSED`の場合だけ、表示されたnext actionに従い
   `セットアップを続行`を実行する。
3. `COMPLETE`まで進んだら、次を確認する。内部stage codeを覚える必要はない。

期待結果:

- 利用者Sheet 6件、非表示管理Sheet 4件の合計10件。
- `タスク一覧`は43列、管理列は右側で非表示・保護。
- 正式Gmail labelは7件で重複なし。
- 専用secondary Calendar `自動期日管理`は1件。
- 所有者installable edit Triggerは1件。
- time-driven Triggerは0件。
- Automationは`OFF`。
- Code `2.8.1-prepilot`、Schema `2.2`、AI Schema `2.0`、Migration `0`。

未知の既存data、v1らしい構造、同名Calendarの所有権不明、想定外scopeが
表示された場合は、その場で停止してください。既存内容を削除して再試行しないで
ください。

## 5. 最小Smoke

次の順で実行します。

1. `Quick Diagnostic`
2. `自動処理の状態を確認`
3. `Phase 1テストを実行`
4. `Phase 1 Mock Taskをupsert`を2回
5. `運用Dashboardを更新`

期待結果:

- Quick Diagnosticに`FAIL`がない。
- 自動処理はdisabledで、time-driven Triggerは0件。
- Phase 1 local項目にFAILがない。
- 同じMock Taskは1行だけ。
- Dashboardは17個のaggregate指標だけを表示し、Task名や外部IDを表示しない。

## 6. Full Sandbox Acceptance

以降は[Manual Acceptance Guide](../../docs/V2_MANUAL_ACCEPTANCE_GUIDE.md)を
Part AからPart Lまで順番に実行し、
[Sandbox Results Template](../../docs/V2_SANDBOX_ACCEPTANCE_RESULTS_TEMPLATE.md)
へ結果を記録します。

実行しない項目:

- 実Provider接続
- TEST_MODE=false
- 通常Inbox自動巡回
- time-driven Trigger
- 実案件メール
- 実障害の意図的発生
- 個人実業務パイロット

これらは`PASS`ではなく`NOT EXECUTED`と記録します。

## 7. 失敗時

1. 操作を止め、Automationが`OFF`であることを確認する。
2. `Quick Diagnostic`を1回だけ実行する。
3. 表示されたsafe error code、実行時刻、非機密スクリーンショットだけを記録する。
4. 実ID、本文、credential、内部URLは記録しない。
5. Setupが未知環境または所有権衝突を報告した場合、修復や再作成を試みない。

## 8. 終了

1. Automation `OFF`、time-driven Trigger 0件を再確認する。
2. Sandbox結果をPASS / FAIL / NOT EXECUTEDで確定する。
3. 証跡から実ID、メール本文、OAuth情報を除去する。
4. cleanupは結果記録後に行い、専用CalendarやSpreadsheetを削除する場合は
   対象がこのSandboxだけであることを利用者本人が確認する。

Phase 8Bの結果が承認されるまで、TEST_MODE=falseや個人実業務パイロットへ
進まないでください。
