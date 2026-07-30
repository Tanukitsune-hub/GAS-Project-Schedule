# Phase 8B Dashboard write-visibility / module-skew 安全回復ガイド（v2.8.10）

## 対象と安全境界

対象は、S00〜S80 が完了し S90/S99 が未完了の非機密 Sandbox で、安全に
停止した Dashboard number-format finding だけです。本書は実Google Workspace
の操作手順ではなく、v2.8.10 candidate の検証時に参照する安全境界です。
現在のgateは `PHASE8B_SANDBOX_NO_GO_DASHBOARD_WRITE_VISIBILITY`、fixed T10は
`PENDING_T10` です。

`DASHBOARD_LAYOUT_OWNERSHIP` / `E_DASHBOARD_LAYOUT_CONFLICT` /
`DASHBOARD_NUMBER_FORMAT_CONFLICT` /
`NUMBER_FORMAT_NONCANONICAL` が出ても、Quick Diagnostic、Deep Diagnostic、
Dashboard refresh、手動書式変更は回復経路ではありません。v2.8.9導入後も
同じ51セルfindingが再現したため、T9は実行対象としてsupersededです。

## v2.8.10 の製品内回復契約

1. Setup が書込み前に、Config、Setup、DashboardのS90 module contractが完全に
   一致することを確認します。不一致は `E_MODULE_VERSION_SKEW` でfail-closedです。
2. Setup が S90 の直前で、canonical Dashboard schema、owner-proven sheet/header
   Protection、exact 17×3 system block、exact three-row seed または owned/
   versioned block を確認します。
3. named range、Protection、値、数式、入力規則、note、merge、hidden、背景、font、
   seed/marker、利用者内容のいずれにも不整合がないことを確認します。
4. 上記がすべて安全で書込みが必要な場合だけ、Setup はexact 17×3 system blockに
   deterministic plain-text contractを設定し、`SpreadsheetApp.flush()`を1回実行します。
5. flush後に同じ51セルのRangeを新しく取得し直し、全セルがcanonicalであることを
   strictに検証してからread-only Quick Diagnosticへ進みます。すでにcanonicalなら
   書込みもflushも行いません。

空の block、不完全 marker、foreign control/data、API欠損、書式以外の不整合では
fail-closed です。自動 fallback、silent rebaseline、任意書式の許容はありません。
flush API欠損、flush失敗、または再取得後も非canonicalなら
`E_DASHBOARD_NUMBER_FORMAT_POSTCONDITION`で停止します。

Setup結果に残せる証跡は、closed normalization state、
write/flush/postconditionのBoolean、checked-cell count、noncanonical countだけです。
locale、実際の書式文字列、値、数式、note、address、ID、URL、identityは記録しません。

## 継続禁止と記録

- 手動で Ledger、Dashboard、Protection、書式を修復しない。
- module skewを手動確認だけで無視しない。A10/B10/T10/E10が完了する前に
  v2.8.10を会社PCへ搬入しない。
- OAuth、Apps Script import、Setup、Diagnostic、Dashboard refresh、Gmail、Calendar、
  deployment、`clasp push`、Automation/trigger、Provider 設定を本リポジトリの
  evidence から実行しない。
- 実Workspace ID、URL、identity、locale、実際に返った書式文字列、スクリーンショット、
  実データ、credential を保存しない。
- Automation は OFF、5分 trigger は不在のままとする。

実Workspaceの結果は `NOT_EXECUTED` のままです。local/fake runtime PASS は
Phase 8B PASS、Phase 8C GO、production ready、pilot ready を意味しません。
