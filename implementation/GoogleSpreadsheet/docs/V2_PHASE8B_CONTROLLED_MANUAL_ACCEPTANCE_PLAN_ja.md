# Phase 8B 管理下手動受入計画（指示番号: 0001）

> **Historical/nonoperative operator-plan notice (0004, 2026-07-31).** This
> 0001 plan records the former v2.8.10/T10 controlled-manual-acceptance
> boundary only. It is not an active carriage or Workspace-operation guide.
> The sole current boundary is fixed T11
> `a3b5a5d8d851bf2d15a2738c54dc6bb31e231d33` at
> `implementation/GoogleSpreadsheet/transfer/v2.8.11-prepilot/`, under
> `READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER`. After hash confirmation, only
> the five manifest-listed files may be replaced; `appsscript.json` and all
> unlisted files remain unchanged. No Setup, S90, S99, Dashboard refresh,
> Gmail, Calendar, Properties, triggers, Automation, tests, Migration, or
> repair is authorized. Only one separately approved read-only T1-01 Quick
> Diagnostic re-observation may follow; it remains `REVIEW_REQUIRED`.

歴史的対象: Code `2.8.10-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
歴史的 payload / transfer anchor: T10 `927d8567bce64461840cc6f72fbae0c1e636a8e6`
歴史的 evidence: E10 `c45479878878957940fad4afe5326c6d26d75d3c`
歴史的 gate: `READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE`

## 0. 目的と厳格な境界

この文書は次の Phase 8B 操作を**事前に設計するだけ**の operator plan です。作成は、下記 action を実行したことを意味しません。各 tranche と各 action には、実行直前の個別の明示承認が必要です。

0001 の閉じた証跡は、1 回の controlled non-production Sandbox における Setup S00–S99 と、その Setup 内 S90 の整合／正規化 postcondition だけを PASS とします。standalone 診断、Dashboard refresh、edit trigger の機能、Gmail、Calendar reconcile、LockService、authority fault、Provider は `NOT_EXECUTED` のままです。

この gate は synthetic かつ非機密の手動受入を段階的に承認できる状態を表すだけです。Automation、5 分 trigger、external AI、実データ、deployment、`clasp push`、Phase 8C、production、pilot は認可しません。Phase 8B overall PASS も宣言しません。

## 1. 全 tranche の共通ルール

| 項目 | 必須ルール |
|---|---|
| 個別承認 | tranche と action ごとに、目的・範囲・停止条件・rollback を書面で承認する。承認なしで次 action に進まない。 |
| 入力 | synthetic、非機密、最小限のデータだけを用いる。実メール、実期限、業務データ、個人情報、未公表情報は使用しない。 |
| 実行条件 | `TEST_MODE=true`、Automation `OFF`、5 分 trigger 不在を最初と最後に確認する。固定 T10 以外の payload を混在させない。 |
| 証跡 | closed enum、Boolean、件数、stage 名、PASS/STOP だけを保存する。ID、URL、identity、実データ、locale、実書式、数式、note、画面画像を保存しない。 |
| 失敗時 | 最初の STOP 条件で止め、追加 repair、再実行、resource 削除、手動 Ledger 修復を行わない。安全な closed evidence と rollback 可否だけを記録する。 |
| 変更禁止 | Apps Script import、OAuth、Provider 設定、deployment、`clasp push`、Automation／trigger 有効化、実 Gmail／Calendar 操作を個別承認なく行わない。 |

共通の証跡項目は `action_id`、承認状態、開始／終了の closed outcome、PASS/STOP reason、対象が synthetic である Boolean、Automation 状態、5 分 trigger 状態、次 action の許可状態に限ります。実際の日時、ID、URL、account、cell 内容、メール内容、Calendar 内容は記録しません。

## 2. Tranche 1 — Read-only / structural checks（次に推奨）

Tranche 1 は既存の controlled Sandbox を壊さず、読取または安全な構造確認を優先します。実行前に一括承認ではなく action ごとの許可を得ます。任意の Setup 再実行は、明確な idempotence 検証理由がある場合だけです。

指示番号 `0002` の action-by-action 実行資料は、
[operator runbook](V2_PHASE8B_TRANCHE1_READONLY_STRUCTURAL_OPERATOR_RUNBOOK_ja.md)
および
[results template](V2_PHASE8B_TRANCHE1_READONLY_STRUCTURAL_RESULTS_TEMPLATE_ja.md)
です。このリンクは実行承認や結果の宣言ではありません。各 action は引き続き
`NOT_EXECUTED` であり、T1-01 を含めて個別の明示承認が必要です。

| Action | 事前条件・operator 操作 | PASS 条件 | STOP / REVIEW 条件 | 保存できる閉じた証跡 | 禁止情報・次の扱い |
|---|---|---|---|---|---|
| T1-01 standalone Quick Diagnostic | T10、synthetic 条件、Automation OFF を確認してから 1 回だけ実行。 | FAIL=0、WARN はすべて事前承認済みの closed reason。 | FAIL、未承認 WARN、読取以外の書込み兆候、安全に閉じられない結果。 | outcome、FAIL/WARN 件数、closed reason category、read-only 確認。 | 値、range、ID、URL、実書式、個人情報を保存しない。Deep へ自動進行しない。 |
| T1-02 Deep Diagnostic | T1-01 PASS と追加承認後に 1 回だけ実行。 | FAIL=0、WARN は T1-01 と同じ closed-review 条件。 | FAIL、未承認 WARN、書込み兆候、不安全な authority / Calendar 表示。 | outcome、FAIL/WARN 件数、closed reason category、read-only 確認。 | 実 row、snapshot、Calendar／Gmail 情報を保存しない。次 action は別承認。 |
| T1-03 Automation 状態 | read-only の状態確認。 | `OFF`。 | `ON`、不明、または安全に確認不能。 | Automation closed state。 | 設定値、ID、画面画像を保存しない。STOP 時に変更しない。 |
| T1-04 five-minute trigger 不在 | trigger 種別の有無だけを read-only 確認。 | `ABSENT`。 | `PRESENT`、不明、または安全に区別不能。 | `ABSENT` / `PRESENT` / `UNKNOWN` だけ。 | trigger ID、owner、時刻、画像を保存しない。PRESENT 時は削除しない。 |
| T1-05 workbook topology | 構造を read-only 確認。 | Sheet count=`11`、hidden Sheet count=`5`。 | 件数不一致、読取不能、予期しない変更兆候。 | 2 件数と outcome。 | Sheet 名、URL、内容、画像を保存しない。 |
| T1-06 Task schema | 可視 Task Sheet の列数だけを確認。 | Task column count=`50`。 | 不一致、header 改変、read-only に確認不能。 | `50` / other count と outcome。 | header text、cell 値、range、実データを保存しない。 |
| T1-07 Ledger control plane | `Task Authority Ledger` の hidden/protected 状態と列数を read-only 確認。 | hidden=`true`、protection=`true`、column count=`21`。 | false／不明、または手動修復を要求する状態。 | 3 Boolean／count と closed outcome。 | protection editor、ID、range、実 row を保存しない。STOP 時に隠す／保護しない。 |
| T1-08 Calendar / owner edit-trigger configuration | 設定が存在するかだけを read-only 確認。 | Calendar config=`CONFIGURED`、owner edit-trigger config=`CONFIGURED`。 | `MISSING`、`AMBIGUOUS`、`UNSAFE`、または確認不能。 | 2 つの closed enum。 | Calendar／trigger ID、URL、account、event 内容を保存しない。reconcile は実行しない。 |
| T1-09 optional Setup idempotence | T1-01〜08 PASS と別途「再実行が必要」の明示承認後だけ 1 回実行。 | 外部 resource の重複・削除・上書きなし、Automation OFF／5 分 trigger 不在を維持し、安全に完了。 | 重複／削除／上書き兆候、Automation 変化、trigger 出現、不明な外部 resource 状態、STOP code。 | Setup outcome、重複なし Boolean、Automation/trigger closed state、stage outcome。 | resource ID、URL、実データを保存しない。STOP 時に再実行／手動修復しない。 |

Tranche 1 の全 action が PASS でも、Tranche 2 は自動で許可されません。

## 3. Tranche 2 — Bounded synthetic write-path checks（別承認・NOT_EXECUTED）

状態: `NOT_EXECUTED`。Tranche 1 と切り離した 1 action ずつの synthetic write-path 受入です。実メール、実期限、業務データ、external AI、Automation を使用しません。

| Action | 最小操作 | PASS | STOP / 証跡境界 |
|---|---|---|---|
| T2-01 Dashboard refresh | aggregate/synthetic state だけで明示 refresh を 1 回。 | closed outcome PASS、Automation OFF を維持。 | foreign/unsafe surface、実データ露出、書込み範囲不明で STOP。件数と closed reason だけ保存。 |
| T2-02 synthetic Task create/edit + installable edit trigger | 1 件の synthetic Task を作成し、承認済みの 1 edit。 | authority/Task consistency と idempotence が closed checks で PASS。 | raw fallback、quarantine、二重処理、trigger 異常で STOP。実 row や ID は保存しない。 |
| T2-03 synthetic manual Gmail import | 1 件の完全 synthetic 入力のみを手動 import。 | closed import outcome と安全な Task/ledger consistency が PASS。 | 実メール混入、外部送受信、内容露出、不明 mutation で STOP。 |
| T2-04 deterministic Mock AI vertical | Mock AI のみで 1 vertical flow。 | deterministic closed result と no-external-call check が PASS。 | external Provider 接続、credential 要求、実データ使用で STOP。 |
| T2-05 synthetic Calendar reconciliation | synthetic Task 1 件に限定した reconcile。 | durable intent / authority consistency / idempotence が closed checks で PASS。 | 実 Calendar、owner ambiguity、外部 I/O 不明、補償条件で STOP。ID／event 内容は保存しない。 |
| T2-06 Task / Ledger consistency replay | 上記 synthetic action の安全な再実行を 1 回。 | idempotence と closed consistency counts が PASS。 | duplicate、orphan、quarantine、再実行不確実性で STOP。 |

## 4. Tranche 3 — Controlled fault and recovery checks（別承認・NOT_EXECUTED）

状態: `NOT_EXECUTED`。各 fault は事前設計した synthetic ケースだけとし、通常の acceptance と混在させません。

| 対象 | 会社 Workspace で検討できる最小 synthetic case | 原則 local fault-injection に留めるケース |
|---|---|---|
| Authority | safe validator が 1 synthetic invalid authority を隔離することを closed outcome で確認。 | Ledger の意図的な破損／削除、slot の crash window 強制、広範な multi-row / header 破壊、手動復元。 |
| Calendar outbox / retry | 事前設計した synthetic retry state を read/observe し、意図しない実 Calendar I/O がないことを確認。 | foreign／duplicate ownership、external-I/O 後の補償強制、event 削除、実 Calendar mutation。 |
| Edit restore | 1 row の安全な synthetic header/row protection rejection を closed enum で観測。 | multi-row 大量改変、header の実破壊、復旧を伴う故障注入。 |
| LockService | local fault-injection の既存証跡を primary evidence とする。 | contention の意図的な再現、並列実行の強制、会社 Workspace の lock 状態を不安定化する試験。 |

Tranche 3 の destructive または impractical なケースは company Workspace では実行せず、既存 local fault-injection evidence のまま保持します。fault case も manual Ledger repair、resource deletion、broad retry を許可しません。

## 5. Tranche 4 — Later-stage readiness（現時点では範囲外）

Phase 8C、external provider／credential、deployment、`clasp push`、production、pilot、Automation、5 分 trigger はすべて現在の authorization の外です。Tranche 1〜3 の結果だけからこれらを許可または宣言しません。

## 6. 外部環境 status matrix

| External item | 0001 後の status |
|---|---|
| Real Google Workspace Setup S00-S99 | PASS（観測された controlled Sandbox Setup に限定） |
| Real S90 Quick Diagnostic within Setup | PASS（同一 Setup 内に限定） |
| S90 module contract alignment | PASS（同一 Setup 内に限定） |
| Dashboard 51-cell normalization / flush / postcondition | PASS（同一 Setup 内に限定） |
| Real dedicated Calendar provisioning stage S60 | PASS for Setup stage only |
| Real owner edit trigger creation stage S80 | PASS for Setup stage only |
| Standalone Quick Diagnostic | NOT_EXECUTED |
| Deep Diagnostic | NOT_EXECUTED |
| Dashboard refresh | NOT_EXECUTED |
| Functional edit-trigger behavior | NOT_EXECUTED |
| Real Gmail processing | NOT_EXECUTED |
| Real Calendar reconciliation | NOT_EXECUTED |
| LockService contention | NOT_EXECUTED |
| Authority fault injection | NOT_EXECUTED |
| External provider/model/credential | NOT_EXECUTED |
| Automation / five-minute trigger | OFF / NOT_AUTHORIZED |
| Phase 8B overall PASS | NOT_DECLARED |
| Phase 8C GO | NOT_DECLARED |
| Production / pilot readiness | NOT_DECLARED |

## 6A. Current 0003 supersession / T1-01-only boundary

The 0002 Tranche plan remains historical planning context. Current 0003 does
not authorize any Tranche action: T1-01's closed `77 PASS / 6 WARN / 0 FAIL`
observation is `REVIEW_REQUIRED` because the complete warning-ID set was not
safely visible. Code `2.8.11-prepilot` is
`READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER`: fixed T11 is remote-resolved and
detached-HTTPS-clone verified. For the completed T10 Sandbox, Setup must not
be rerun; the separately controlled T11 procedure may run only T1-01 Quick
Diagnostic once, record its bounded summary, and STOP. T1-02 through T1-08
remain `NOT_EXECUTED` / not authorized.

## 7. Operator handoff / rollback rule

Each action must end with one of `PASS`, `STOP`, or `REVIEW_REQUIRED` using only the closed fields permitted above. `STOP` and `REVIEW_REQUIRED` mean no same-session retry, no repair, no external-resource cleanup, and no next tranche. The operator records whether the documented stop/rollback checklist was consulted, but does not record sensitive operational detail. A future instruction and explicit authorization are required to alter this plan or to advance the gate.
