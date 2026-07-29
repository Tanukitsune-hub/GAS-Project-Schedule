# Phase 8B Sandbox 再搬入 — 合成テストデータ仕様

## 目的

Sandbox で使用するデータは、挙動の確認に必要な最小限の合成データだけです。
実メール、実案件、個人情報、未公表情報、実 Workspace ID は使用しません。

## 許可される最小データ

| 種別 | 許可例 | 禁止例 |
| --- | --- | --- |
| Task title | `Synthetic task A` | 実案件名、人名、顧客名 |
| 本文 | `Synthetic body for local sandbox validation.` | 実メール本文、実添付内容 |
| 日時 | `2030-01-02 09:00` のような将来の固定値 | 実会議、実予定 |
| Email-like address | `synthetic.user@example.invalid` | 実アドレス |
| Calendar-like label | `Synthetic Calendar` | 実 Calendar 名 |
| Identifier | `synthetic-task-001` | 実 Spreadsheet / Script / Calendar ID |

## Setup blocker 再確認用の境界

1. 新規の空 Sandbox を前提にするか、S00/S10 までの観測済み partial state を
   明示的に再現します。
2. Ledger を事前に手動 hide/protect しません。
3. v2.8.6 Setup が S20 で protection と hidden state を確立し、validator より
   前に control plane を完成させることだけを観察対象にします。
4. visibility/protection failure を観察する場合も、手修復、snapshot fallback、
   raw-row repair を行いません。
5. 失敗時は Stop/rollback checklist に従い、追加作業を開始しません。

このデータ仕様は実 Workspace 操作、OAuth、Provider、Automation、trigger、
Gmail、Calendar、deployment を許可するものではありません。
