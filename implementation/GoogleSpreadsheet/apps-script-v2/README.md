# Google Workspace Personal Work OS v2 - 2.8.9-prepilot / Phase 8B Dashboard Number-Format Real-Runtime Remediation

## Current authority and Setup boundary

`2.8.9-prepilot` retains the R4/R5 authority contract, historical
`PHASE8B-SETUP-01`, and v2.8.7 Quick Diagnostic remediation. It corrects
`PHASE8B-DASHBOARD-01`: v2.8.7 assumed a safe Protection always had exactly
one ordinary explicit editor. Apps Script may instead represent the proven
Spreadsheet owner only through inherent `canEdit()` capability. The corrected
contract internally requires owner/effective-user equality and `canEdit()`,
then accepts only either zero explicit editors for that owner or exactly the
explicit owner. It rejects unavailable owner / Shared Drive, different
effective user, foreign/blank editor, warning-only, domain edit, target
audience, duplicate/wrong Protection, non-empty unprotected ranges, and
foreign range Protection.

Dashboard inspection now emits only closed reason/subreason enums and numeric
counts for Protection, named range, value, formula, validation, note, merge,
hidden state, background, font, number format, and seed/marker contracts.
It never emits user identity, cell content, formulas, notes, range addresses,
IDs, or URLs. Quick Diagnostic is byte-for-byte read-only.

The historical `2.8.7-prepilot` release corrected the separate
high-severity `PHASE8B-QUICK-DIAGNOSTIC-01` runtime contract mismatch observed
after S00 through S80 in an otherwise empty Phase 8B Sandbox: Setup-owned
Dashboard seed/control-plane recognition, two-row/50-column Task header
protection geometry, Sheets-materialized blank checkbox `false` semantics,
and schema-derived validation of all five checkbox fields.  Quick Diagnostic
remains read-only and fail-closed for foreign controls, user values/formulas,
notes, named ranges, merges, hidden state, unsafe formatting, malformed
markers, duplicate keys, invalid checkbox types, partial identity, and
business data on a logical blank row.

The prior Ledger control-plane fix remains mandatory: after canonical schemas,
S20 establishes protection and hidden visibility before validation; S30 and
completed Setup reruns reassert the same control plane.  Visibility/protection
write failure leaves S20 incomplete and fail-closed.  This does not create a
general runtime, diagnostic, Worker, Review, Calendar, Migration, or
edit-restore repair path.

Task authority remains a
protected hidden `Task Authority Ledger` with two versioned slots.  The
visible Task row is written once between durable `PREPARED` and `COMMITTED`
ledger states; `authoritative_snapshot_json` and cell notes are projections
only, never fallback authority.  A failed write is recovered by comparing the
visible row to the durable prepared and committed slots, then promoting,
rolling back, or quarantining without silently rebaselining from user-visible
data.

If a new Task's only visible-row write fails before persistence, its otherwise
blank `PREPARED` ledger record is discarded and the original failure remains
retryable; it is not turned into a quarantined Task.  Calendar reconcile intent
is committed to the Task first.  Once its Outbox entry is durable, a failed
exact-intent acknowledgement is reported as pending recovery and the marker is
left intact for later bounded recovery rather than being claimed as successful.

The same fail-closed validator is used by Setup, Quick/Deep Diagnostic, Task
writes, Migration 3, edit restoration, Worker reads, Review, and Calendar
reconciliation.  In a multi-row edit, each row is handled independently:
valid peers are restored from their own committed slot; missing, copied,
corrupt, or ambiguous authority is isolated as `QUARANTINED` or
`UNRECOVERABLE` and excluded from Worker, Review, and Calendar processing.
Task rows 1 and 2 are canonical schema controls and are restored after direct
or pasted header edits.  The Task schema has 50 columns, including
`authority_generation`, `authority_hash`, and `authority_state`; the hidden
ledger has 21 columns.

Canonical state-transition documentation is in
`docs/TASK_AUTHORITY_PROTOCOL.md`; the current offline workflow visualization
is `visualizations/task_authority_protocol_v2_8_8.html`.  The prior Round 3
backup directory was local-only and was not present in GitHub; this historical
fact is corrected in the Round 4 implementation report rather than rewriting
the historic Round 3 report.

Current versions are Code `2.8.9-prepilot`, Schema `2.6`, AI Schema `2.0`,
and Migration `3`. Automation remains OFF by default. The verified v2.8.7
chain is A7 `be2e551da310a9b7c0611f3aef8899309a3d7b69`, direct-child B7
`95bc7240d99124b245e188b8e646eccf6c3ead48`, C7
`ba175d3994c86dacc76bad3537df97e3e644dc09` (verifier only), and fixed T7
`008c643b85c6b234ad489d946033cb9c06d32920`. Its carriage-only gate is
`READY_FOR_PHASE8B_SANDBOX_RETRANSFER` is historical and T7 is now superseded
as an executable target by `PHASE8B-DASHBOARD-NUMBER-FORMAT-01`. The Source A9
gate is `PHASE8B_SANDBOX_NO_GO_DASHBOARD_NUMBER_FORMAT`; v2.8.9 package and
transfer artifacts are generated only after Source A9. Real Workspace retransfer/retest
remains `NOT_EXECUTED`.

このDirectoryは、Phase 1「最小Sheets基盤」からPhase 7「Retry・Dead Letter・診断」までを実装したApps Scriptです。新しい空のGoogle Sheetsへ紐づけて使用します。

## 実装済みの範囲

- Phase 1: 10個のSheet、`タスク一覧`Schema、段階Setup、Task Repository、synthetic Mock Task、Quick Diagnostic、Test Harness
- Phase 2: 正式Gmailラベル7個の冪等作成、`手動/取込`限定検索、Message State、Stable Thread Key、本文前処理、手動Worker、retry checkpoint
- Phase 3: provider-neutral AI契約、決定的Mock Adapter、strict input/output/Action検証、Task/Review/pending、所有者installable edit Triggerと手動fallback、AIラベル同期、分類checkpoint再利用
- Phase 4: 専用`自動期日管理`Calendar、重要期限の終日Event、Calendar Outbox、create/update/delete/no-op、所有marker、Calendar-only retry、S99完了
- Phase 5: strict External AI契約、network-free Mock HTTP Transport、error taxonomy、classification provenance、既存v2環境のappend-only Schema extension
- Phase 6: 明示的な5分CLOCK Trigger lifecycle、通常Inboxの小規模自動候補検索、24時間overlap、Message ID冪等性、durable scan cursor、due retry優先、210秒soft budget
- Phase 7: 14 subsystemと6 checkpointの回復契約、初回＋5/15/60分の最大4 attempt、Dead Letter、内部ID限定の手動再試行、provider-wide抑制、Quick/Deep Diagnostic、軽量運用Dashboard、既存v2 Error Schemaのappend-only拡張

Phase 2の手動Workerは1実行につき最大10 Threadsを検索し、未処理Messageを最大1件だけ`PREPROCESSED`まで進めます。Phase 6の自動Workerは通常Inboxを25 Threads/page、最大100 Threads、最大10 Messages/runで検索し、読取状態には依存しません。検索cycleは固定upper boundと24時間overlapを使用し、due retryを新規Inboxより先に処理します。Mock縦フローは、分類JSONをTask副作用より先に保存してTaskを冪等に書き、AIラベル同期後に`CALENDAR` checkpointへ進みます。Calendar Outboxは1実行につき最大1 jobです。本文と直前文脈は処理中のメモリだけに保持し、SheetやLogへ保存しません。

Phase 5の検証境界は次のとおりです。

- Code implementation: `LOCAL PASS`
- Mock HTTP Transport: `LOCAL PASS`
- Real provider connection: `NOT EXECUTED`
- Company approval: `NOT CONFIRMED`
- Credential storage approval: `NOT CONFIRMED`

Phase 6のtime-driven自動化は初期停止です。SetupはTask編集用の所有者installable edit Triggerだけを作成し、5分CLOCK Triggerは作成しません。実Provider、会社承認、credential保管承認、認証、正式ラベル・Schema・version・current shared preflightの全前提を満たし、利用者が`自動処理を有効化`を明示実行した場合だけ5分CLOCK Triggerを1件に正規化します。Trigger lifecycleはWorkerの処理Lockと分離し、`enabled`と`desired state`の二重kill-switchで並行disableを優先します。現在の設定では実Provider transportが存在しないため実有効化はfail closedで拒否され、ローカルFakeだけがTrigger lifecycleを検証しています。

Phase 7は失敗を`エラー・再実行`へ1 subsystem・1 safe reference単位でupsertし、本文、件名、送信者、raw Gmail ID、AI payload/response、credentialを保存しません。自動再試行は最大10件/run、手動選択は最大5行で、`DEAD`かつretryableで前提条件が解決済みの項目だけを内部`err_`/`dl_` IDから再開します。Messageに紐づかないGmail検索/状態エラーもError行の`next_retry_at`で5/15/60分を制御し、成功時に解決します。Provider-wide抑制中はAIへ到達し得る`PREPROCESS`と`CLASSIFY`を延期し、保存済みTask/Calendar checkpointだけを継続できます。Quick Diagnosticは60秒目標のread-only、Deep Diagnosticは手動・read-only・別entry pointで、いずれもchunk単位でbudgetを確認します。実Provider、実Gmail、実Calendar、実Triggerを診断から呼びません。

`2.8.1-prepilot`では、Worker全体を長時間保持するScript Lockを廃止し、bounded logical leaseと短時間のclaim／checkpoint／CAS Lockへ分割しました。Gmail search/body/label、AI transport、Calendar list/CRUDはLock外で実行します。外部Calendar更新後にTask/Outboxが変化した場合はstaleな業務fieldを適用せず、現在のTaskと観測済みEvent IDからfresh reconciliation checkpointを作り、Event重複・孤立を防ぎます。Dashboardはmarker付きsystem-owned blockだけを更新し、blank-key値・formula・metadataまたはQuick Diagnostic conflictをwrite前に拒否します。ローカル結果は34 suites、471 PASS / 0 FAIL / 11 SKIPPEDで、SKIPPEDは実Provider／実Google Workspace検証です。

`2.8.2-prepilot`では、コード監査のF-01～F-12と安全に適用できるF-13を修正しました。AutomationのCalendar checkpoint継続、期限3項目と`MANUAL_CONFIRMED` provenance、Review Decisionのexact target/CAS、Task cross-field invariant、Message単位の手動取込、`TEST_MODE=false` guard、system-owned Sheet Protection、RELATIVE期限の人間Decision gate、Mock/Production AI診断分離を追加しています。Calendar説明の期限根拠は日本語表示です。Schema Versionは`MANUAL_CONFIRMED`追加を管理するため`2.3`へ上げ、既存`2.2` Message State行をデータ保持したまま`2.3`へ更新できます。

`2.8.3-prepilot`では、Round 2のR-01～R-05を修正しました。Task行にSchema 2.4の`authoritative_snapshot_json`を追加し、無効な単一／複数セル、複数行、20行超の編集を正本へ戻します。拒否時は値・`row_version`・`updated_at`を変更せず、正当な手動編集は同じfieldの繰返しでも毎回versionを1増やし、`manual_fields`、Review note、Calendar reconcile、非機密の手動編集auditを更新します。同一行Reviewの受入はstage後のtarget値、row version、manual field集合、open状態を再検証し、競合時はfail closedです。明示的な`restagePendingChange`だけが新しい基準を作ります。

手動Gmail取込はThread単位ではなく正確なMessage ID単位で完了状態を抑止し、同じThreadの次の未処理`手動/取込`へ進みます。Thread内の`手動/除外`は引き続き最優先です。Setup再実行は既存Schema 2.2／2.3環境を2.4へデータ保持で拡張した後、全行のValidation、owner-only Protection、Task／Errorsの行拡張範囲を冪等に再整備します。

`2.8.4-prepilot`の段落はRound 3時点の履歴です。そこに記した47列snapshot／cell-note mirrorは、Round 4以降では正本として使用しません。現行の`2.8.6-prepilot`契約は、このREADME先頭のSetup-owned protected hidden `Task Authority Ledger`、two-slot protocol、no-fallback、row単位quarantineを正とします。

物理更新の`row_version`と人間の業務変更を表す`business_version`を分離しました。Reviewはbusiness version、target identity、staged values、manual fieldsをguardとし、Calendar metadataやsync timestampだけの変化では拒否しません。Task editはCalendar reconcile intentをTask行へ先にdurable commitし、Outbox enqueue成功後だけexact intent versionでacknowledgeします。Outbox欠落、append失敗、Lock timeout、enqueue直後の再実行でもbounded recoveryがcreate/update/delete/no-op intentを冪等に回収します。open Reviewの明示的な`選択したReviewを再stage`は確認dialogと1行selection、row-bound再検証を必須とします。手動Gmail候補はThread間とThread内のどちらも古い未処理Messageを先に選びます。

`release/v2.8.4-prepilot/`および`release/v2.8.5-prepilot/`の記述は歴史的証跡です。P10のv2.8.5 packageは初回Setup失敗後も変更せず、実行・再搬入には使用しません。Round 6ではSource A6を確定してから`release/v2.8.6-prepilot/`（`TEST_MODE=true`、Automation OFF、Test Harness同梱）と`release/v2.8.6-prepilot-phase8c/`（監査済みの`TEST_MODE=false`変換、`99_TestHarness.gs`除外）を生成します。両packageは`Tanukitsune-hub/GAS-Project-Schedule`の実在するSource commitを明記し、release content commitはmanifest自身を含むGit commitとして追跡します。実Google Workspace再検証は未実施であり、Source時点のgateは`PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER`です。Phase 8B GO/PASS、Phase 8C GO、Pilot readyは宣言しません。

Phase 8AではApps Script sourceを変更せず、`release/v2.8.1-prepilot/`へ
TEST_MODE=true・Automation OFFの決定的な非本番Sandbox導入packageを作成しました。
配置前に`DEPLOYMENT_MANIFEST.md`と`CHECKSUMS.sha256`を照合し、
`SANDBOX_QUICKSTART.md`から手動受入へ進んでください。Phase 8Bの実Google
Workspace受入、TEST_MODE=false、実Provider接続、実案件パイロットは未実施です。

次は未実装です。

- 実AI API、provider固有Adapter、`UrlFetchApp`による外部通信
- 実Providerを使う本番自動処理の有効化
- v1からv2へのMigration
- 要確認専用タブ、独立Manualモード
- 高度なWork Block、日次・週次review、schedule最適化等の将来拡張

v1.xとは非互換です。v1.xコードや既存Sheetをコピー、変換、上書きしないでください。

## 作成されるSheet

利用者向け:

1. `ダッシュボード`
2. `タスク一覧`
3. `設定`
4. `処理履歴`
5. `エラー・再実行`
6. `使い方`

非表示管理:

1. `メール状態`
2. `システム設定`
3. `プロンプト版管理`
4. `同期状態`

`タスク一覧`は行1が内部列ID、行2が日本語見出し、行3以降がTaskです。管理列は右側にあり、非表示です。Taskは`task_id`または`origin_key`がある行だけです。

## 導入手順

1. 機密情報を含まない、新しい空のGoogle Spreadsheetを作成します。
2. `拡張機能 > Apps Script`を開きます。
3. このDirectoryの`.gs`ファイルを同名で作成し、内容を貼り付けます。
4. Apps ScriptのProject Settingsでmanifest表示を有効にし、`appsscript.json`を置き換えます。
5. Spreadsheetを再読込し、メニュー`業務OS v2`を表示します。
6. Apps ScriptのServicesでAdvanced Gmail API v1とAdvanced Calendar API v3が有効であることを確認します。
7. `初期セットアップ`を実行し、Spreadsheet、Protection実行者確認、GmailとCalendarに必要なmanifest記載scopeを承認します。
8. 正式Gmailラベル7個が不足分だけ作成され、専用Calendar `自動期日管理`が1個だけ作成され、SetupがS99まで`COMPLETE`になることを確認します。既存の同名Calendarが複数ある場合、primary Calendarである場合、所有・instance markerを検証できない場合は安全停止が正しい結果です。
9. `Phase 1 Mock Taskをupsert`を2回実行し、1件だけになることを確認します。
10. 自分から自分へ件名`[MOCK:NEW_HIGH] 架空資料の提出`の完全な架空メールを送り、`手動/取込`を付け、`手動/取込を1件前処理`を実行します。
11. `メール状態`に本文なしの`PREPROCESSED` checkpointが1件だけ作成されることを確認します。
12. `Phase 3/4 Mock縦フローを1件処理`を実行し、Messageが`DONE`、通常Taskが`OPEN`になり、同じ`origin_key`のTaskとEventが重複しないことを確認します。fixtureがCalendar対象外なら、正式期限、`FORCE`、Review解消等を手動受入Guideどおりに設定します。
13. Review Taskの`判断`を変更し、installable edit Triggerで同じ行へ受入・却下が自動反映されることを確認します。問題時だけ対象セルを選択し、`Task編集を手動反映（fallback）`を使用します。
14. `Calendar同期を1件処理`で最大1 jobだけ処理されることを確認します。
15. `Quick Diagnostic`、`運用Dashboardを更新`、必要に応じて`Deep Diagnostic（読取専用）`、Phase 1～7の各テストを実行します。実Provider、実time-driven Trigger、実Gmail自動検索は`NOT EXECUTED`のままです。
16. `エラー・再実行`のPhase 7管理列に、Dead Letterの内部ID、subsystem、error category、safe reference、resume stage、attempt、next action、作成・更新日時があることを確認します。
17. 実外部障害を作らずに、Phase 7 Harnessのlocal項目が10 PASS、実回復・実診断・実Dashboard項目が3 SKIPPEDであることを確認します。

`setupSystem()`はS00～S99を順に実行します。S60は専用Calendarを作成または厳密に再利用し、S80は所有者を確認してTask編集用installable edit Triggerを1件に正規化します。SetupはGmail検索、Message処理、AI分類、Calendar Event同期、5分Trigger作成を呼びません。`continueSetup()`は次stageと副作用を表示してから再開します。

## 個別stage検証

Test HarnessまたはApps Script editorから、次のPhase 1 support stageを個別に検証できます。

```javascript
WorkOsSetup.runStageForTest('S70_STORE_PROPERTIES');
WorkOsSetup.runStageForTest('S90_QUICK_DIAGNOSTIC');
WorkOsSetup.runStageForTest('S80_CREATE_EDIT_TRIGGER');
```

S50とS60は公開Setupから実行されます。S80はTask編集用Triggerだけを作成します。time-driven自動処理TriggerはSetupから作成しません。

## 手動受入チェック

新しいテストSpreadsheetで確認します。

1. 既定Sheetが`ダッシュボード`へrenameされ、10 Sheetが仕様順になる。
2. 管理4 Sheetが非表示になる。
3. `タスク一覧`の行1が内部ID、行2が日本語見出しになる。
4. 最初のMock Taskが行3に入り、同じMockを2回実行しても1件だけになる。
5. 空行のCheckboxセルが空であり、Boolean値`FALSE`が入っていない。
6. `コメント`へ自由記述でき、Checkboxが表示されない。
7. `判断`、`対応状況`、`期限根拠`、`優先度`、`Calendar登録`に仕様どおりのDropdownがある。
8. `期限`と`推奨期限`、日時列の表示形式が仕様どおりである。
9. setupを再実行してもMock Task、利用者入力、列、Sheetが消失・重複しない。
10. 別の検証Spreadsheetに`Review Queue`またはv1 markerを置くと、setupが変更前に停止する。
11. 別の検証Spreadsheetに未知の非空Sheetを置くと、setupが変更前に停止する。
12. Quick Diagnostic前後でセル値、行列数、表示/非表示、Schemaが変化しない。
13. Quick Diagnosticの実測が60秒以内である。
14. Setup直後はApps ScriptのTriggers画面に本実装が作成したtime-driven Triggerがない。
15. OAuth scopeが`spreadsheets.currentonly`、`script.container.ui`、`script.scriptapp`、`userinfo.email`、`gmail.modify`、`calendar.app.created`、`calendar.calendarlist.readonly`だけで、広い`calendar`、`gmail.labels`、`gmail.readonly`、`mail.google.com`、External request、Drive、Mail sendが含まれない。
16. `タスク一覧`の利用者編集可列（判断、対応状況、完了、対象外、タスク内容、期限、優先度、返信待ち、Calendar登録、コメント）は行3以降で編集できる。
17. `タスク一覧`の自動列・管理列と、非表示管理Sheetは実行者以外が編集できず、警告だけのProtectionではない。
18. Taskが100行を超えて行拡張された後も、利用者編集可列だけが新しい行で編集でき、管理列のProtectionとData Validationが維持される。
19. 正式7ラベルだけが不足分作成され、Setup再実行で重複せず、既存ラベルや`手動/*`が削除・renameされない。
20. 既読・未読の架空テストメールを各1件試し、どちらもMessage ID単位で処理できる。
21. `手動/取込`と`手動/除外`を同時に付けると本文取得・前処理へ進まない。
22. 同じMessageを再実行しても`メール状態`が1行のままで、`PREPROCESSED`から先へ進まない。
23. `メール状態`、`処理履歴`、`エラー・再実行`、Execution Logに本文、件名、送信者、添付内容がない。
24. 手動Workerが最大1 Message、120秒soft budget内で安全終了し、失敗時は`DONE`ではなく`RETRY`または`DEAD`になる。
25. `[MOCK:NEW_HIGH]`は通常Taskを自動`OPEN`にし、同じMessage/Actionを再処理してもTaskが重複しない。
26. `[MOCK:NEW_REVIEW]`は別タブではなく同じ`タスク一覧`へ`REVIEW`として入り、`受入`で`OPEN`、`却下`で`EXCLUDED`になる。
27. `[MOCK:MULTI]`はActionごとに決定的な`origin_key`を持つ2 Taskを作る。
28. `[MOCK:UPDATE_DUE]`、`[MOCK:MARK_COMPLETE]`、`[MOCK:CANCEL]`は現在値を自動変更せずpending Reviewになる。
29. 利用者が編集した`due_date`等は`manual_fields`へ入り、後続Mock変更は競合としてpendingへ送られる。`comment`はAIに変更されない。
30. `[MOCK:INFERRED]`の推測期限は`due_date`ではなく`suggested_due_date`だけに入る。
31. `[MOCK:INFORMATION_ONLY]`はTaskを作らずMessageを`DONE`まで進める。
32. `[MOCK:INVALID_JSON]`、`[MOCK:SCHEMA_ERROR]`、未知Action、11 ActionはTask副作用前に拒否される。
33. 本文中の`[MOCK:*]`、命令文、URLは制御として扱われず、件名先頭markerだけがfixtureを選ぶ。
34. AI label同期は`AI/要対応`、`AI/期限`、`AI/返信待`、`AI/要確認`だけを管理し、`手動/*`を変更しない。`SYS/失敗`はエラー処理だけが管理する。
35. 管理列を含むeditを`handleTaskEdit(event)`へ渡すとevent全体を拒否する。VALID authorityの行は全50列をledger committed slotから復元し、欠落・複製・破損・曖昧なauthorityの行は隔離する。無効行が混在してもVALID peerのraw editを残さず、snapshot/note fallbackは行わない。
36. Phase 3のEditHandlerは所有者installable edit Triggerから狭いTask編集だけを自動反映し、選択範囲メニューはfallbackとして到達できる。
37. 件名、送信者、Task名、AI理由が`= + - @`等の式prefixで始まる完全な架空入力を使い、`タスク一覧`の対象セルについて`getFormula()`が空であることを確認する。
38. 同じThreadに未解決`RETRY`または`DEAD`が残る場合、別Message成功後も`SYS/失敗`が残ることを確認する。
39. `自動期日管理`以外、特にprimary Calendarが作成・更新・削除されない。
40. 正式期限があり、Review解消済みで、完了・対象外・取消ではなく、Calendar方針と影響条件を満たすTaskだけが終日Eventになる。
41. Eventタイトルは`【期限】タスク内容`、説明はredaction済み送信者・期限根拠・元メール参照・Task marker・instance markerだけを含み、件名、本文、添付や認証情報を含まない。
42. 同一Taskの同期再実行と期限・Task名更新でEventが増えず、同じowned Eventが更新される。
43. 完了、対象外、取消、Calendar対象外、正式期限削除、Review復帰でowned Eventが削除される。
44. Calendar一時失敗後はOutboxが`RETRY`となり、初回失敗後の5/15/60分の最大3回retry scheduleに従い、AI分類やTask作成を再実行しない。3回目のretryも失敗した場合、または非retryable失敗は`DEAD`となる。
45. 保存Event ID不整合、複数marker Event、foreign instance marker、同名Calendar重複では対象を推測・上書きせず安全停止する。
46. Setup直後はtime-driven Triggerが0件である。現在の未承認構成では明示的な自動化有効化も拒否され、Triggerが増えない。
47. Migration 3は独立に証明されたSchema 2.5 legacy anchorだけをtwo-slot ledgerへ変換候補とする。Schema 2.6のauthority欠落、不正、identity不一致、hash driftはsnapshot又はlive rowからsilent rebaselineせず隔離する。正常な再実行はno-opになる。
48. Phase 5 HarnessではCode implementationとMock HTTP TransportだけがPASSし、Real provider connectionは`NOT EXECUTED`、Company approvalとCredential storage approvalは`NOT CONFIRMED`である。
49. manifestにExternal request scopeがなく、repositoryに`UrlFetchApp`、実endpoint、model、credential値がない。
50. Phase 6 local testsでCLOCK Triggerの単一化、wrong-event置換、disable fail-safe、missing trigger UID拒否、24時間overlap、Message単位upper bound、4 page上限、Message ID dedup、partial cursor再開、最大10 Message、due retry優先を確認する。
51. Phase 6の実5分Triggerと実通常Inbox検索は、専用非機密sandboxで実行するまで`NOT EXECUTED`とする。
52. 同一のretryable障害は初回失敗後5/15/60分で再試行され、4回目の失敗で1件のDead Letterになる。Message、Task、Calendar Eventは重複しない。
53. retryableなDead Letterだけが、`エラー・再実行`で選択した内部IDから最大5件まで手動再開できる。未解決設定、非retryable、checkpoint不一致は安全に拒否される。
54. Calendar Dead Letterの手動再開はAI分類とTask作成を再実行せず、OutboxとMessage checkpointから再開してEventを重複作成しない。
55. `Quick Diagnostic`と`Deep Diagnostic（読取専用）`の前後でSheet、Task、Message、Outbox、Property、Trigger、Dashboardが変化せず、Gmail、Calendar、AIへ通信しない。
56. 実Dead Letter回復、実Quick/Deep実行時間、実Label/Calendar再試行は専用非機密Google Workspace環境で実行するまで`NOT EXECUTED`とする。
57. `運用Dashboardを更新`で17指標がkeyed upsertされ、Task名、件名、送信者、raw Gmail/Calendar ID、credential、payloadが表示されない。
58. `設定`で編集可能なのは自動最大Message数、手動soft limit、自動soft limitだけで、変更値が次runの実上限へ反映される。固定設定改変、型・範囲・Protection・重複driftはenable前に拒否される。
59. instrumented Gmail/AI/Calendar gatewayが外部I/O呼出時のScript Lock非保持を直接確認する。
60. ownership、stage、input hash、Task row version、二重WorkerのCAS競合でstale結果をcommitしない。
61. Calendar外部CREATE後のTask/Outbox競合を再実行し、Eventを重複・孤立させず現在Taskへ収束する。
62. Dashboard blank-key値、formula、metadata、foreign marker、failed Quick Diagnosticで`E_DASHBOARD_LAYOUT_CONFLICT`となり、部分writeを行わない。
63. Calendar metadataとsync timestampだけがReview stage後に変化しても受入でき、人間のbusiness fieldが変化した場合はbusiness version guardで拒否される。
64. Task edit後にOutbox欠落、append失敗、Lock timeoutが起きても`calendar_reconcile_required`とintent versionが残り、次のbounded recoveryで重複なく回収される。
65. Calendar Outbox enqueue後の再実行はexact intent versionのacknowledgeとjob冪等性により重複しない。
66. `選択したReviewを再stage`はopen Reviewの1行selectionと確認dialogだけを受け付け、最新business versionとtarget identityへ更新する。
67. 手動Gmail候補はThread間と同一Thread内の両方で古い未処理Messageから進む。
68. Code／Schema／AI Schema／Migrationは`2.8.7-prepilot`／`2.6`／`2.0`／`3`であり、release provenanceはRepository、Source A7、direct-child Release B7、transfer ref、evidence-only closureを区別する。

Google Workspace実環境で実行していない項目はPASSにせず、未実施として記録してください。

実環境の詳細手順と期待結果は[`../docs/V2_MANUAL_ACCEPTANCE_GUIDE.md`](../docs/V2_MANUAL_ACCEPTANCE_GUIDE.md)を正本として使用してください。

## `clasp`を使う場合

`.clasp.json.example`をローカルで`.clasp.json`へコピーし、実際のScript IDはそのローカルファイルだけへ設定します。実際のScript ID、Spreadsheet ID、Calendar ID、Gmail Message ID、内部URLをRepositoryへ保存しないでください。

例:

```text
clasp login
clasp push
```

Apps Scriptへの`clasp push`や実環境deployは自動実行しません。GitHub releaseは
Source commitとrelease content commitを分離し、manifestのprovenanceと照合します。

## 情報管理

保存禁止:

- API key、password、token、credential
- 実際のGmail Message ID、Spreadsheet ID、Calendar ID
- メール本文、添付内容、個人情報、未公表情報
- Google Workspace内部URL

Test HarnessのTaskは完全な架空データです。認証情報をSheetセル、ソースコード、README、fixture、logへ保存しないでください。

## 既知の制約

- Google Workspace固有のData Validation、Protection、Advanced Gmail/Calendar Service、OAuth、実際のlabel hierarchy、専用Calendar所有判定、Event CRUD、選択範囲メニュー、式neutralizationの`getFormula()`確認、Script Lock競合、実行時間は実環境での手動受入が必要です。ローカルPASSはこれらの実環境PASSを意味しません。
- Code Versionは`2.8.6-prepilot`、Schema Versionは`2.6`、AI Schema Versionは`2.0`、Migration Versionは`3`として分離しています。
- Phase 2 entry pointは`PREPROCESSED`で停止します。Mock縦フローはMock分類、Task/Review、AIラベル、Calendar Outboxを扱いますが、実AIを呼びません。
- installable edit TriggerはSetupでTask編集用に1件だけ作成します。time-driven TriggerはSetupから作成せず、明示的有効化と全前提条件を満たす場合だけ管理します。現在の未承認・実Transport未実装構成では作成を拒否します。
- Calendar Eventは専用Calendar内の本system所有markerを持つEventだけを更新・削除します。Calendar側の変更をTask正本へ逆流させません。
- Phase 5はprovider-neutralなExternal Adapter境界までです。実provider、endpoint、model、認証方式、credential保管方式は未確定であり、実接続は`NOT EXECUTED`です。
- External Adapterのproduction registryは空で、実Provider adapter/transport/credential loaderは未実装です。会社承認・credential保管承認が揃うまでfail closedです。Mock HTTP Transportはlocal testだけで使用します。
- 現在は`TEST_MODE=true`のpre-pilot構成です。shared enable Gateは`TEST_MODE_ENABLED`でproduction automationを拒否します。実環境へ進む場合は`TEST_MODE=false`で全Regressionと実Workspace Gateを再実施してください。
- 最終統合監査に基づき、Phase 7必須の軽量Dashboardを明示更新方式で実装しています。RuntimeとDiagnosticからDashboard writeは行いません。高度な運用最適化は将来拡張です。
