## Step 6: Authority実装を再監査する

ローカルtestのPASS数だけで完了扱いにせず、実装そのものを確認してください。

### 6.1 shared validator

次の全経路が同じauthority validatorまたは同等の一元化されたcontractを使用していることを確認します。

```text
fresh setup
current setup rerun
migration 2.5 -> 2.6
new Task insert
existing Task update/upsert
manual edit
Review ACCEPT
Review REJECT
Review restage
Calendar Task patch
Calendar intent acknowledge
multi-row restore
Worker Task selection
Review Task selection
Calendar reconciliation selection
Quick Diagnostic
Deep Diagnostic
explicit repair
```

禁止:

- callerごとに別の簡易判定を持つ
- snapshot cellへfallbackする
- raw rowをindexへ登録してから後でauthority判定する
- quarantine rowを一時的に通常indexへ含める

### 6.2 index構築順序

`byTaskId`、`byOriginKey`、`byStableThreadKey`等のRepository indexは、authority validation後の正常rowだけから構築してください。

次を確認します。

- raw rowのduplicate Task IDが正常rowの解決を奪わない
- quarantine rowがtarget resolutionへ使われない
- untrusted `task_id`／`origin_key`から新しいledger authorityを作らない
- row move時はledger active snapshotとhashで候補rowを再同定する
- row delete時はORPHANEDとし、silent recreateしない

### 6.3 canonical hash

authority hashについて、次を明示してください。

```text
algorithm
canonical field order
Date / DateTime normalization
empty string / null / undefined normalization
Boolean / Number normalization
JsonObject key sort
JsonArray order
formula-neutralized textの扱い
self-referential fieldの除外
schema versionの扱い
```

最低条件:

- 同じbusiness stateは実行ごとに同じhash
- object key挿入順でhashが変わらない
- Date objectとcanonical ISO表現の差で誤driftしない
- `authority_hash`自身をhash inputへ含めない
- `authoritative_snapshot_json` display projectionをtrust sourceにしない
- hashはaccidental drift detectionであり、秘密鍵付きtamper proofではないことを文書化する

### 6.4 two-slot state machine

次の各境界について、row、active slot、inactive slot、transaction state、recovery actionを確認してください。

```text
before PREPARE
PREPARE write failure
PREPARE success / before Task row write
Task row write failure or uncertain return
Task row write success / before COMMIT
COMMIT success / review note failure
COMMIT success / safe audit failure
COMMIT success / Outbox enqueue failure
Outbox enqueue success / intent ack failure
stale worker ack
recovery repeated twice or more
```

### 6.5 first insert

新規Task insertは特に確認してください。

- active generationが存在しない状態から開始
- PREPAREDだけ作成後にTask row writeが失敗した場合
- Task rowが空のままならempty PREPAREDを安全に破棄できる
- Task rowが書かれたか不明な場合はread-backで判定する
- uncommitted raw Taskを通常Taskとして露出しない
- retryでTask／ledger rowが重複しない
- origin keyの冪等性を維持する
- logical empty rowが汚染された場合の扱いを定義する

### 6.6 quarantine

各physical rowを独立分類してください。

```text
VALID
RESTORABLE
PREPARED_RECOVERABLE
QUARANTINED
UNRECOVERABLE
ORPHANED
```

確認項目:

- 2行中1行不正でも正常行を復元する
- 20行中複数不正でも正常行を復元する
- 20行超pasteをboundedに処理または明示checkpointへ送る
- blank rowへのTask ID直入力をauthorityへ昇格しない
- raw ID自体がuntrustedの場合、安全なphysical row referenceで隔離する
- quarantine rowをWorker／Review／Calendarへ含めない
- explicit repair後だけACTIVEへ戻す
- event単位のsafe auditにraw Task payloadを含めない

### 6.7 row movement／deletion

installable edit triggerはrow deletionや一部構造変更を必ずしも捕捉しません。

次を確認してください。

- row move
- row insertionによるphysical row shift
- row deletion
- duplicate row copy
- sortによるrow移動
- column insertion／deletion／reorder

どのentry pointが検出するかを明示します。

```text
edit trigger
change trigger
worker preflight
setup
quick diagnostic
deep diagnostic
explicit recovery
```

新しいchange triggerを追加する場合は、Setup、scope、初期停止方針、重複trigger、実Workspace未検証を明記してください。  
追加しない場合は、worker／diagnosticでの検出保証と検出までのrisk windowを文書化してください。

### 6.8 orphaned TaskとCalendar

Task rowが削除されORPHANEDになった場合のCalendar policyを明示してください。

禁止:

- identityが曖昧なままEventを推測削除する
- raw row欠損だけで新規Taskを再作成する
- unrelated Eventを操作する

安全な選択肢を1つに固定し、testしてください。

### 6.9 migration 2.5 -> 2.6

migrationは次の段階を明示してください。

```text
preflight
ledger Sheet/schema作成
Task 3列append
legacy note + snapshot + live row strict validation
row-by-row PREPARED/COMMITTED migration
quarantine
checkpoint
all-row verification
schema version update
migration version update
protection/hidden state verification
completion
```

確認項目:

- interruption後にresumeできる
- repeated runがidempotent
- versionは全必須step完了前に上げない
- intermediate schemaを未知環境として破壊しない
- missing/malformed legacy noteをsnapshot cellから自動救済しない
- migration logにraw payloadを保存しない
- rollbackはlive workbookの安易なcode downgradeではなく、valid prior generation、監査済みbackup、fresh copy等の現実的手順として記載する

### 6.10 header restore

次を確認してください。

- row 1 single-cell edit
- row 1 multi-cell paste
- row 2 single-cell edit
- row 2 multi-cell paste
- row 1～3を跨ぐpaste
- header + multiple Task rowsを跨ぐpaste
- column count/order drift
- owner edit
- non-owner protection behaviorは実WorkspaceでNOT EXECUTED

header restore経路がTask data rowを誤って初期化しないことを確認してください。

### 6.11 Diagnostic purity

Quick／Deep Diagnosticはread-onlyであることを維持します。

禁止:

- ledger repair
- quarantine解除
- Task row restore
- header restore
- Dashboard update
- protection rewrite
- schema mutation
- trigger作成
- Gmail／Calendar／AI access

Diagnosticは分類とsafe reason codeだけを返してください。

### 6.12 Apps Script limits

次を確認してください。

- ledger snapshot JSONの最大想定文字数
- Google Sheets 1セル上限への余裕
- 1 Task mutationあたりのservice call数
- batch size
- soft budget
- pause/resume checkpoint
- 100行、500行、最大想定Task数での見積り
- hidden ledger protectionの範囲拡張
- Task row expansionとledger row expansionの整合

---
