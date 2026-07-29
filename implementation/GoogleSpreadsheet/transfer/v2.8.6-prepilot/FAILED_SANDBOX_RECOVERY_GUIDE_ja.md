# Phase 8B Setup blocker — 安全な復旧ガイド

## 現在の安全境界

この v2.8.6 package は、historical v2.8.5/P10 の初回 Setup failure を置換する
ための修正候補です。Automation は `OFF` のままです。Package generation 時点の
gate は `PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER` であり、別の fixed-ref
fresh-clone evidence が `READY_FOR_PHASE8B_SANDBOX_RETRANSFER` を記録するまで
は搬入・実行しません。

## 絶対にしないこと

- 失敗した v2.8.5/P10 workbook の Ledger を手動で hide/protect しない。
- failed workbook 上で Setup continuation、Quick/Deep Diagnostic、Task/Ledger
  raw repair、snapshot/note repair を行わない。
- `authoritative_snapshot_json`、cell note、live Task row、ユーザー編集後値を
  authority fallback にしない。
- failed evidence を削除、上書き、改変しない。
- 実データ、実 Gmail、既存 Calendar、Provider、production trigger を使用しない。

## v2.8.6 での限定された再開条件

明示承認済みの v2.8.6 retransfer だけが、次の安全な選択肢を検討できます。

1. S00/S10 までの safe partial state を Setup で再開する。
2. または、第二の新規空 Sandbox を使用する。

どちらの場合も、Ledger control plane は Setup の `S20_CREATE_SCHEMAS` が
protection と hidden state を冪等に確立します。visibility/protection failure は
S20 を未完了のまま fail-closed にし、S30 と completed rerun は再確認だけを
行います。Worker、Review、Calendar、Diagnostics、Migration に一般的な repair
権限はありません。

## 失敗した場合

1. 追加操作を止める。
2. 安全な status、code、stage、completed stage names、時刻だけを記録する。
3. `STOP_AND_ROLLBACK_CHECKLIST_ja.md` と
   `RESULTS_TEMPLATE_ja.md` に従う。
4. mismatch、authority error、権限要求、実データ混入のいずれでも、追加の
   Workspace 操作を始めない。

この復旧ガイドは Phase 8B PASS、Phase 8C GO、production ready、pilot ready を
意味しません。
