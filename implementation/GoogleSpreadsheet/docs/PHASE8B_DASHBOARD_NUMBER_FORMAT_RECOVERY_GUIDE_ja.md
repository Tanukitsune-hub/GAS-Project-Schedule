# Phase 8B Dashboard number-format 安全回復ガイド（v2.8.9）

## 対象と安全境界

対象は、S00〜S80 が完了し S90/S99 が未完了の非機密 Sandbox で、安全に
停止した Dashboard number-format finding だけです。本書は実Google Workspace
の操作手順ではなく、v2.8.9 package の受入時に参照する安全境界です。

`DASHBOARD_LAYOUT_OWNERSHIP` / `E_DASHBOARD_LAYOUT_CONFLICT` /
`DASHBOARD_NUMBER_FORMAT_CONFLICT` /
`NUMBER_FORMAT_NONCANONICAL` が出ても、Quick Diagnostic、Deep Diagnostic、
Dashboard refresh、手動書式変更は回復経路ではありません。

## v2.8.9 の許可された回復経路

1. Setup が S90 の直前で、canonical Dashboard schema、owner-proven sheet/header
   Protection、exact 17×3 system block、exact three-row seed または owned/
   versioned block を確認します。
2. named range、Protection、値、数式、入力規則、note、merge、hidden、背景、font、
   seed/marker、利用者内容のいずれにも不整合がないことを確認します。
3. 上記がすべて安全な場合だけ、Setup は exact 17×3 system block に deterministic
   plain-text contract を冪等に設定します。範囲外のセルは変更しません。
4. Setup は strict な再検査後に read-only Quick Diagnostic を実行します。

空の block、不完全 marker、foreign control/data、API欠損、書式以外の不整合では
fail-closed です。自動 fallback、silent rebaseline、任意書式の許容はありません。

## 継続禁止と記録

- 手動で Ledger、Dashboard、Protection、書式を修復しない。
- OAuth、Apps Script import、Setup、Diagnostic、Dashboard refresh、Gmail、Calendar、
  deployment、`clasp push`、Automation/trigger、Provider 設定を本リポジトリの
  evidence から実行しない。
- 実Workspace ID、URL、identity、locale、実際に返った書式文字列、スクリーンショット、
  実データ、credential を保存しない。
- Automation は OFF、5分 trigger は不在のままとする。

実Workspaceの結果は `NOT_EXECUTED` のままです。local/fake runtime PASS は
Phase 8B PASS、Phase 8C GO、production ready、pilot ready を意味しません。
