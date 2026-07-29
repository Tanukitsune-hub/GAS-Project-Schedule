# Phase 8B Sandbox 再搬入 — 受入チェックリスト

このチェックリストは将来の承認済み Sandbox 作業用です。この transfer
envelope の生成時点では、すべての実 Workspace 項目は `NOT EXECUTED` と
記録します。未実施項目を PASS に変更してはいけません。

## A. 搬入前の証跡確認

- [ ] `TRANSFER_MANIFEST.md` の Source A6、Release B6、fixed transfer ref を
      Git の解決結果と照合した。
- [ ] `TRANSFER_CHECKSUMS.sha256` の operator documentation checksum が全件
      一致した。
- [ ] `COPY_ALLOWLIST.txt` の 27 files と package tree が完全一致した。
- [ ] package `CHECKSUMS.sha256` の 26 non-self records を照合した。
- [ ] `TEST_MODE=true`、Automation `OFF`、harness included を確認した。
- [ ] Phase 8C package、source/tests/tools、credentials、`.clasp.json` を
      搬入対象から除外した。

## B. Sandbox の開始前条件

- [ ] 明示された会社承認および担当者指示がある。
- [ ] 新規の非機密 Sandbox と synthetic test data だけを使う。
- [ ] 実 Gmail、実 Calendar、実案件、個人情報、未公表情報を用いない。
- [ ] OAuth、Provider、Automation、trigger、deployment、`clasp push` は
      承認済みの別手順がない限り実行しない。
- [ ] 失敗時に入力する結果記録 template と stop/rollback checklist がある。

## C. v2.8.6 Setup 固有の確認（将来の実施対象）

- [ ] `S20_CREATE_SCHEMAS` で Setup が Ledger protection と hidden state を
      設定してから authority validation を行う設計を理解した。
- [ ] Ledger を事前に手動 hide/protect していない。
- [ ] S20 の visibility/protection failure は fail-closed であり、S20 が
      完了扱いにならないことを理解した。
- [ ] S30 と completed Setup rerun は control plane を冪等に再確認するだけで、
      raw row、note、snapshot から authority を再生成しないことを理解した。

## D. 結果の記録

- [ ] 実行前、実行後、失敗時の status/code/stage だけを記録する。
- [ ] 実 Workspace ID、URL、メール本文、個人情報、credential は記録しない。
- [ ] 追加操作を始める前に、失敗時は stop/rollback checklist に従う。

`READY_FOR_PHASE8B_SANDBOX_RETRANSFER` は非機密 package の再搬入準備だけを
意味します。Phase 8B PASS、Phase 8C GO、production ready、pilot ready では
ありません。
