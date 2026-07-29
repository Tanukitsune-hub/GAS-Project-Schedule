# Phase 8B Sandbox 再搬入 — 停止・ロールバック チェックリスト

## 直ちに停止する条件

- transfer または package checksum が一致しない。
- allow-list 外のファイル、credential、`.clasp.json`、Phase 8C material が
  見つかる。
- Setup が visibility / protection / authority 関連のエラーで停止する。
- Automation が `OFF` 以外、または実 Gmail / Calendar / Provider / trigger が
  有効になっている。
- 実データ、個人情報、既存 Workspace 資産が対象に混入した可能性がある。
- 想定外の OAuth、deployment、`clasp push`、Provider 設定の要求が表示される。

## 停止後に行うこと

1. 追加の Setup、diagnostic、edit、Worker、Calendar 処理を行わない。
2. Task Authority Ledger、Task raw row、snapshot、note を手作業で変更しない。
3. エラーの安全な status、code、stage、完了 stage 名、時刻だけを
   `RESULTS_TEMPLATE_ja.md` に記録する。実 ID、URL、本文、個人情報は書かない。
4. 対象 workbook や package を削除・上書きせず、証跡として隔離する。
5. package checksum と transfer checksum を再確認し、問題があれば搬入元へ
   差し戻す。

## ロールバックの原則

- v2.8.5 / P10 の失敗環境を手動修復して継続しない。
- Ledger の hidden/protection control plane は、v2.8.6 Setup の S20 が所有する。
  手動 hide/protect は product remediation ではありません。
- authority は protected hidden Ledger の有効な `COMMITTED` generation のみから
  回復します。raw Task row、snapshot cell、note、ユーザー編集値を trust source
  にしません。
- 新しい実行を許可するには、別の明示承認と安全な再検証が必要です。

停止または証跡保全は、Phase 8B PASS、Phase 8C GO、production/pilot 承認を
意味しません。
