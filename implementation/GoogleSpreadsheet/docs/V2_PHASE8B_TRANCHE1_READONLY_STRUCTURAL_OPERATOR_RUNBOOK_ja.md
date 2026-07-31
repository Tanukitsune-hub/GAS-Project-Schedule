# Phase 8B Tranche 1 Read-only / Structural Acceptance — Operator Runbook

> Current 0003 remediation notice (2026-07-31): T1-01 reported `77 PASS / 6
> WARN / 0 FAIL` but its detail display did not safely expose all warning IDs.
> It is `REVIEW_REQUIRED`, not PASS. The current candidate is Code
> `2.8.11-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`, at
> `READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER`. Fixed T11 is remote-resolved
> and detached-HTTPS-clone verified. T1-02 through T1-08 are not authorized.
> For a completed T10 Sandbox, do not run Setup: use only the T11
> hash-verified replacement guide and one separately controlled T1-01 Quick
> Diagnostic observation, then STOP.

指示番号: `0002`
対象: Code `2.8.10-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
固定 payload / transfer anchor: T10 `927d8567bce64461840cc6f72fbae0c1e636a8e6`
現在かつ最高 gate: `READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE`

## 0. この文書の役割と実行境界

この runbook は Tranche 1 の **実行パッケージ**です。ただし、この文書の作成、
閲覧、または GitHub 上での確認は、どの action も実行したこと、あるいは PASS
したことを意味しません。初回に推奨できる操作は T1-01 だけです。T1-02 以降は、
前 action の閉じた証跡をレビューした後にも、action ごとの別個の明示承認が必要です。

実行者は、承認された action を一回だけ実行し、結果を
[`V2_PHASE8B_TRANCHE1_READONLY_STRUCTURAL_RESULTS_TEMPLATE_ja.md`](V2_PHASE8B_TRANCHE1_READONLY_STRUCTURAL_RESULTS_TEMPLATE_ja.md)
の一件分の record に手入力します。ChatGPT へ提示するのも、その閉じた record
だけです。次の action は `next_action_authorized: true` を含む別の承認があるまで
実行しません。

この文書は以下を許可しません。

- Setup の再実行、Dashboard refresh、Task 編集、Worker、Gmail、Calendar
  reconciliation、trigger の作成・削除、Automation の有効化・無効化。
- OAuth、Provider 設定、deployment、`clasp push`、実データの使用、手動 Ledger
  修復、Sheet の表示/非表示変更、Protection の変更。
- 実 Spreadsheet / Calendar / Trigger / account の ID、URL、identity、実データ、
  header、cell、range、formula、note、locale、実書式、画面画像、詳細 JSON の記録。

`T1-09 optional Setup idempotence` は本 runbook の初期実行列に含めません。T1-01〜08
がすべて閉じた結果を得た場合でも、T1-09 は別途「再実行が必要」という明示承認が
必要です。

## 1. 全 action 共通の安全手順

1. action ID、固定 T10、synthetic / non-sensitive 条件、Automation `OFF`、および
   five-minute trigger 不在を、承認 record の範囲内で確認する。未確認は PASS と
   推定せず `REVIEW_REQUIRED` とする。
2. その action だけを一回実行する。既存の安全出力を読む action では、同じ
   diagnostic または状態確認を再実行しない。
3. Menu の `showSafeResult_` は summary と redacted JSON 詳細を表示する。画面画像、
   詳細 JSON、`safe_message`、check detail、Sheet / cell / range 情報をコピー、
   貼付、転記しない。許可された enum、Boolean、件数、closed reason category
   だけを手入力する。
4. `STOP` または `REVIEW_REQUIRED` では、その session で retry、repair、resource
   cleanup、手動保護変更、次 action を行わない。rollback は通常
   `STOP_NO_REPAIR_NO_RETRY` である。

この runbook 内の `external_services_called` は Gmail、Calendar、AI / Provider、
URL fetch の呼出しを指す。Spreadsheet / Properties / ScriptApp の読取は別途
許可された read-only observation であり、ID 等を記録しない。

## 2. Source-to-action support matrix

| Action | Support classification | 実在する操作面または安全な出力 | 結論 |
|---|---|---|---|
| T1-01 | `SUPPORTED_BY_EXISTING_MENU` | `業務OS v2 > Quick Diagnostic` → `menuQuickDiagnostic` → `runQuickDiagnostic` | 一回の read-only diagnostic。 |
| T1-02 | `SUPPORTED_BY_EXISTING_MENU` | `業務OS v2 > Deep Diagnostic（明示・読取専用）` → `menuDeepDiagnostic` → `runDeepDiagnostic` | T1-01 review と別承認後だけ。 |
| T1-03 | `SUPPORTED_BY_EXISTING_MENU` | `業務OS v2 > 自動処理の状態を確認` → `menuAutomationStatus` → `getAutomationStatus` | 固定 T10 / `TEST_MODE=true` 前提の read-only state output。 |
| T1-04 | `SUPPORTED_BY_EXISTING_SAFE_OUTPUT` | T1-03 の閉じた Automation state output | Work OS 所有の five-minute clock trigger だけを対象にする。 |
| T1-05 | `SUPPORTED_BY_BOUNDED_MANUAL_OBSERVATION` | Sheet tab navigation と hidden-sheet list の件数だけを読む | Sheet を選択、編集、unhide しない。 |
| T1-06 | `SUPPORTED_BY_EXISTING_SAFE_OUTPUT` | T1-01 の Task column / schema check の閉じた集計 | T1-01 を再実行しない。 |
| T1-07 | `SUPPORTED_BY_EXISTING_SAFE_OUTPUT` | T1-01 の Ledger column / visibility / protection / validator check の閉じた集計 | Ledger を開く、表示する、保護変更することは禁止。 |
| T1-08 | `REVIEW_REQUIRED` | owner edit-trigger 部分は T1-01 の safe output で部分観測可。Calendar physical configuration は安全な既存メニューで閉じられない。 | action 全体は `REVIEW_REQUIRED`。 |

根拠は、Menu の item 定義、Quick / Deep の read-only 実装、Automation status
の trigger-list read、ならびに fixed T10 の source / local regression tests です。
Quick / Deep は write / flush / repair を行わず、Deep は authority recovery、
quarantine、Dashboard refresh、Gmail、Calendar sync、AI、trigger creation、retry
をすべて false として報告します。

## 3. T1-01 — Standalone Quick Diagnostic

**Purpose:** 固定 T10 の controlled Sandbox を変更せず、既存の structural /
configuration checks を一回だけ観測する。

- **Support classification:** `SUPPORTED_BY_EXISTING_MENU`
- **Exact surface:** `業務OS v2 > Quick Diagnostic`。`Menu.gs` の
  `menuQuickDiagnostic()` が global `runQuickDiagnostic()` を呼ぶ。
- **Source boundary:** Sheets、Properties、Project trigger list を read する。
  Calendar API は呼ばず `calendar_api_called: false` とする check を持つ。Dashboard
  repair、number-format write、flush、Gmail search、Calendar reconciliation、AI request、
  trigger creation は実行しない。
- **Preconditions:** T10 payload であること、synthetic / non-sensitive environment、
  `TEST_MODE=true`、Automation `OFF`、five-minute trigger が absent であることを
  事前承認 record で確認する。いずれかを安全に確認できなければ実行しない。
- **One-action instruction:** 個別承認後に上記 Menu item を一回だけ選び、同じ
  action 中に他の Menu item を選ばない。結果 dialog を保存・共有しない。
- **Expected closed output fields:** `diagnostic_status`、PASS / WARN / FAIL の件数、
  allow-listed closed reason categories、`external_services_called`、
  `writes_observed`、`calendar_api_called`。check 内容や message は転記しない。
- **PASS condition:** `fail_count=0`、`writes_observed=false`、
  `external_services_called=false`、`calendar_api_called=false` が閉じた形で確認でき、
  すべての WARN category が **その action の事前承認に明記**されていること。
- **STOP condition:** FAIL、未承認 WARN、write / external service call の兆候、
  Automation `ON`、five-minute trigger `PRESENT`、OAuth / raw data の要求、または
  safe field を閉じられない出力。
- **REVIEW_REQUIRED condition:** detail が表示上限で必要な closed field を安全に
  集計できない、又は result に privacy boundary 外の情報を含むため転記判断ができない。
- **Permitted evidence:** status enum、PASS / WARN / FAIL count、approved closed
  reason categories、`false` / `UNKNOWN` Boolean だけ。
- **Prohibited information:** raw checks、詳細 JSON、Sheet 名、header、cell / range、
  ID、URL、actual value / format / locale、identity、screenshot。
- **Next action:** `false`。T1-02 を含む次 action は evidence review と別承認後だけ。
- **Rollback:** `STOP_NO_REPAIR_NO_RETRY`。

## 4. T1-02 — Deep Diagnostic

**Purpose:** T1-01 の閉じた evidence review 後、authority / recovery state を
read-only で深く観測する。

- **Support classification:** `SUPPORTED_BY_EXISTING_MENU`
- **Exact surface:** `業務OS v2 > Deep Diagnostic（明示・読取専用）`。
  `menuDeepDiagnostic()` が global `runDeepDiagnostic()` を呼ぶ。
- **Source boundary:** `validateAllTaskAuthorities` を
  `recover_prepared=false`、`recover_relocated=false`、`quarantine_invalid=false`、
  `mark_orphaned=false` で呼ぶ。`DEEP_SIDE_EFFECT_POLICY` は repair、Dashboard refresh、
  Gmail search、Calendar sync、AI request、trigger creation、dead-letter retry を
  false とする。
- **Preconditions:** T1-01 の result が review 済みで、T1-02 専用の承認があること。
  T1-01 が `STOP` / `REVIEW_REQUIRED` の場合は実行しない。
- **One-action instruction:** 個別承認後に上記 Menu item を一回だけ選ぶ。Task、Ledger、
  Dashboard、Calendar、Gmail、trigger を別途操作しない。
- **Expected closed output fields:** `diagnostic_type=DEEP_MANUAL_READ_ONLY`、
  status、PASS / WARN / FAIL count、authority aggregate count、closed reason category、
  `repair=false` と side-effect-policy の Boolean。
- **PASS condition:** `fail_count=0`、`warn_count=0`、repair / Dashboard / Gmail /
  Calendar / AI / trigger / retry の各 Boolean が false と閉じられること。
- **STOP condition:** FAIL、WARN（soft-budget WARN を含む）、authority failure、
  side-effect Boolean が true / unknown、又は安全に閉じられない output。
- **REVIEW_REQUIRED condition:** required closed fields が表示されない、又は
  raw Task / authority information を見なければ判断できない。
- **Permitted evidence:** status / type enum、counts、closed reason category、
  side-effect Boolean。
- **Prohibited information:** Task row、snapshot、ledger field、Calendar / Gmail content、
  ID、URL、identity、screen image。
- **Next action:** `false`。T1-03 以降も別承認が必要。
- **Rollback:** `STOP_NO_REPAIR_NO_RETRY`。

## 5. T1-03 — Automation status (OFF required)

**Purpose:** Work OS Automation の current state が OFF のままであることを
read-only に確認する。

- **Support classification:** `SUPPORTED_BY_EXISTING_MENU`
- **Exact surface:** `業務OS v2 > 自動処理の状態を確認`。`menuAutomationStatus()` が
  global `getAutomationStatus()` を呼ぶ。
- **Source boundary:** Work OS handler の Project trigger list と Script Properties を
  read する。fixed T10 の `TEST_MODE=true` では production service-readiness branch
  は閉じたままであり、Gmail / Calendar / Provider health check には進まない。
- **Preconditions:** T10 payload / `TEST_MODE=true` を確認でき、T1-03 の個別承認が
  あること。確認不能なら Menu を選ばず `REVIEW_REQUIRED` とする。
- **One-action instruction:** 上記 Menu item を一回だけ選ぶ。`自動処理を明示的に有効化`
  と `自動処理を停止` を選ばない。
- **Expected closed output fields:** `automation_configuration_state`、
  `automation_state`、`desired_automation_state`、Work OS clock trigger count、
  duplicate count、interval category、`external_services_called`、`writes_observed`。
- **PASS condition:** `status=CONSISTENT`、`enabled=false`、`desired_enabled=false`、
  Work OS `clock_trigger_count=0`、`interval_minutes=5`、write / external service
  fieldsが false と閉じられること。
- **STOP condition:** `ON`、`INCONSISTENT`、clock trigger count が 1 以上、
  `UNKNOWN`、OAuth / Provider interaction の兆候、又は write の兆候。
- **REVIEW_REQUIRED condition:** T10 / `TEST_MODE=true` 前提を安全に確認できない、
  または result が Work OS owned trigger と無関係な trigger を区別できない。
- **Permitted evidence:** state enum、Boolean、Work OS-owned count、interval category。
- **Prohibited information:** trigger ID、owner、created time、account、Properties value、
  screenshot。
- **Next action:** `false`。T1-04 は同じ output を読むだけでも別承認が必要。
- **Rollback:** `STOP_NO_REPAIR_NO_RETRY`。PRESENT でも削除しない。

## 6. T1-04 — Five-minute trigger absence

**Purpose:** Work OS 所有の five-minute `runScheduledWorker` clock trigger が
存在しないことを、T1-03 の同一 safe output から別 action として確認する。

- **Support classification:** `SUPPORTED_BY_EXISTING_SAFE_OUTPUT`
- **Exact surface:** T1-03 で個別承認済みの `getAutomationStatus()` の closed output。
  新しい Menu operation は行わない。
- **Preconditions:** T1-03 record が存在し、Work OS-owned `clock_trigger_count` と
  `interval_minutes` が閉じた形で確認でき、T1-04 専用の承認があること。
- **One-action instruction:** T1-03 record から count と interval category だけを
  read し、T1-04 record に転記する。trigger list を開く、削除する、他 trigger を
  調査することはしない。
- **Expected closed output fields:** `five_minute_trigger_state`、Work OS clock
  trigger count、interval category、`writes_observed=false`。
- **PASS condition:** `five_minute_trigger_state=ABSENT`、Work OS
  `clock_trigger_count=0`、interval category が `FIVE_MINUTES`。
- **STOP condition:** `PRESENT`、`UNKNOWN`、count 不一致、又は trigger ID / owner を
  見なければ判定できない状態。
- **REVIEW_REQUIRED condition:** T1-03 record がない、closed count がなく、別の
  menu executionなしには判断できない。
- **Permitted evidence:** `ABSENT` / `PRESENT` / `UNKNOWN`、count、Boolean。
- **Prohibited information:** trigger ID、owner、schedule timestamp、unrelated
  project trigger の情報。
- **Boundary:** この action は **Work OS 所有の** five-minute clock trigger の不在
  だけを示す。無関係な project trigger の不存在は証明しない。
- **Next action:** `false`。
- **Rollback:** `STOP_NO_REPAIR_NO_RETRY`。

## 7. T1-05 — Workbook topology (11 Sheets / 5 hidden)

**Purpose:** Workbook の Sheet / hidden Sheet 件数だけを bounded manual observation
として確認する。

- **Support classification:** `SUPPORTED_BY_BOUNDED_MANUAL_OBSERVATION`
- **Exact bounded procedure:** Spreadsheet の built-in sheet-tab navigation で
  visible tab count を数え、built-in hidden-sheet list で hidden entry count を数える。
  Sheet を選択、開く、unhide、rename、move、edit しない。Sheet 名は記録しない。
- **Preconditions:** T1-05 の個別承認があり、UI が names / content を転記せずに
  件数を読めること。
- **One-action instruction:** 上記二つの件数だけを一回観測し、すぐに template に
  件数だけ記録する。他の UI operation を続けない。
- **Expected closed output fields:** `sheet_count`、`hidden_sheet_count`、
  `writes_observed=false`、`external_services_called=false`。
- **PASS condition:** `sheet_count=11` かつ `hidden_sheet_count=5`。
- **STOP condition:** いずれかの count 不一致、unexpected change の兆候、又は
  unhide / edit が必要になる状態。
- **REVIEW_REQUIRED condition:** UI が安全に count だけを表示できない、又は
  names / content を記録しなければ区別できない。
- **Permitted evidence:** 二つの整数、status enum、Boolean。
- **Prohibited information:** Sheet 名、URL、tab order、content、image、cell data。
- **Next action:** `false`。
- **Rollback:** `STOP_NO_REPAIR_NO_RETRY`。count 不一致でも Sheet を追加、削除、
  hide / unhide しない。

## 8. T1-06 — Task schema (50 columns)

**Purpose:** Task physical-column contract と header schema check を、T1-01 の
既存 read-only output から閉じた集計として確認する。

- **Support classification:** `SUPPORTED_BY_EXISTING_SAFE_OUTPUT`
- **Exact surface:** T1-01 record の Task `COLUMNS` check、`TASK_SCHEMA_IDS` check、
  `TASK_SCHEMA_HEADERS` check。新たな diagnostic 実行や header inspection はしない。
- **Preconditions:** T1-01 result を安全に閉じた集計へ変換でき、T1-06 の個別承認が
  あること。
- **One-action instruction:** `task_column_count` と二つの schema status だけを
  T1-01 output から読む。header text、range、internal ID を読んだり記録したりしない。
- **Expected closed output fields:** `task_column_count`、`task_schema_ids_state`、
  `task_schema_headers_state`、`writes_observed=false`。
- **PASS condition:** `task_column_count=50`、`task_schema_ids_state=PASS`、
  `task_schema_headers_state=PASS`。
- **STOP condition:** count / schema status の不一致、FAIL、又は header modification
  の兆候。
- **REVIEW_REQUIRED condition:** T1-01 dialog が truncated され、必要な closed field
  が存在しない。Quick Diagnostic を再実行して補わない。
- **Permitted evidence:** count、PASS / FAIL / UNKNOWN enum、Boolean。
- **Prohibited information:** header text、internal ID、column letter、range、Task data、
  screenshot。
- **Next action:** `false`。
- **Rollback:** `STOP_NO_REPAIR_NO_RETRY`。header を手動復元しない。

## 9. T1-07 — Task Authority Ledger control plane

**Purpose:** protected hidden Ledger の closed structural contractを、T1-01 の
read-only output から確認する。

- **Support classification:** `SUPPORTED_BY_EXISTING_SAFE_OUTPUT`
- **Exact surface:** T1-01 record の Ledger-targeted COLUMNS、VISIBILITY、PROTECTION、
  schema、`TASK_AUTHORITY_VALIDATOR` check の閉じた集計。Quick validator は recovery /
  quarantine / orphaning を false にして read-only で動作する。
- **Preconditions:** T1-01 result を raw detailsなしに集計でき、T1-07 の個別承認が
  あること。
- **One-action instruction:** `ledger_column_count`、`ledger_hidden`、
  `ledger_protected`、`ledger_authority_validator_state` だけを転記する。Ledger Sheet
  の表示、保護変更、editor / range inspection を行わない。
- **Expected closed output fields:** `ledger_column_count`、`ledger_hidden`、
  `ledger_protected`、`ledger_authority_validator_state`、`writes_observed=false`。
- **PASS condition:** `ledger_column_count=21`、`ledger_hidden=true`、
  `ledger_protected=true`、`ledger_authority_validator_state=PASS`。
- **STOP condition:** false、FAIL、missing authority、schema / protection conflict、
  または raw Ledger を開かなければ判断できない状態。
- **REVIEW_REQUIRED condition:** required check が output に存在しない、又は safe
  aggregate に変換できない。Setup / SheetBuilder を実行して補わない。
- **Permitted evidence:** count、Boolean、PASS / FAIL / UNKNOWN enum、closed reason
  category。
- **Prohibited information:** ledger row、slot、snapshot、header、editor、Protection range、
  Task ID、URL、screenshot。
- **Next action:** `false`。
- **Rollback:** `STOP_NO_REPAIR_NO_RETRY`。Ledger を手動 hide / protect しない。

## 10. T1-08 — Dedicated Calendar / owner edit-trigger configuration

**Purpose:** Calendar reconciliation を実行せず、Calendar configuration と owner
edit-trigger configuration を安全に閉じられるか評価する。

- **Support classification:** `REVIEW_REQUIRED`
- **Safe partial surface:** T1-01 の `EDIT_TRIGGER_POLICY` と
  `EDIT_TRIGGER_REAL_LIST` は、owner edit-trigger の count / canonical Boolean を
  closed output として示せる。これは Calendar configuration を証明しない。
- **Unresolved Calendar boundary:** Quick Diagnostic は property-level
  `CALENDAR_PROPERTY_CONFIGURATION` を read し、`calendar_api_called=false` を
  報告する一方、remote Calendar verification を `NOT_EXECUTED` とする。
  `WorkOsCalendarSync.inspectDedicatedCalendarConfiguration` が `CONFIGURED` を返す
  には `verify_remote=true` と Calendar API read が必要であり、既存 Menu / global
  operator surface ではない。この runbook はその function を実行させない。
- **Preconditions:** T1-08 の個別承認があっても、Calendar physical configuration
  を安全な既存 surface だけで閉じられないため action overall は
  `REVIEW_REQUIRED` とする。
- **One-action instruction:** 実行しない。必要なら T1-01 の既存閉じた result から
  owner edit-trigger の部分 observation だけを template に記録する。Calendar API、
  Calendar UI、reconciliation、ID / URL search は行わない。
- **Expected closed output fields:** `calendar_configuration_state=REVIEW_REQUIRED`、
  `calendar_remote_verification=NOT_EXECUTED`、owner edit-trigger configuration enum、
  trigger count / Boolean、`external_services_called=false`（partial observation のみ）。
- **PASS condition:** なし。この action は既存 surface の範囲では PASS にしない。
- **STOP condition:** Calendar API / OAuth / ID / URL / account detail を要求する、
  trigger state が unsafe、又は Calendar reconciliation を促す結果。
- **REVIEW_REQUIRED condition:** 常に action overall で適用する。将来の別 instruction
  なしに code / menu / OAuth scope を追加しない。
- **Permitted evidence:** `REVIEW_REQUIRED`、`NOT_EXECUTED`、owner trigger の closed
  enum / count / Boolean。
- **Prohibited information:** Calendar ID、URL、event / Calendar content、account、
  trigger ID、owner identity、screenshot。
- **Next action:** `false`。T1-08 の partial observation は Calendar configuration の
  PASS に昇格しない。
- **Rollback:** `STOP_NO_REPAIR_NO_RETRY`。

## 11. Gate and handoff result

この runbook によって変わる gate はありません。最高 status は
`READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE` のままです。T1-01〜T1-08、
Phase 8B overall、Phase 8C、production、pilot、Automation、external Provider の
PASS / GO / authorization はこの文書だけから宣言しません。

次に推奨される operator action は、別途明示承認された **T1-01** であり、
現時点では `NOT_EXECUTED` です。
