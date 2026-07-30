# Phase 8B v2.8.7 Sandbox 再搬入資料

このフォルダは Code `2.8.7-prepilot` の非機密 Phase 8B package を、承認済み
経路で会社PCへ持ち込む場合のoperator資料です。実行許可そのものではありません。
Automation は `OFF` のままです。

## 搬入前の確認

1. `TRANSFER_MANIFEST.md` の Source A7、Release B7、transfer self reference を
   Git の解決結果と照合する。
2. `TRANSFER_CHECKSUMS.sha256` でtransfer folder内の全non-self資料を確認する。
3. `COPY_ALLOWLIST.txt` の27 package-relative files以外をコピーしない。
4. package `CHECKSUMS.sha256` と `COMPANY_PC_PATCH_MANIFEST_ja.md` のold/new
   SHA-256 を確認する。不一致なら停止する。
5. Phase 8C package、source/tests/tools、`.clasp.json`、credentials、実データ、
   実ID/URL、スクリーンショットは搬入対象から除外する。

## 安全境界

- S00–S80 complete / S90-S99 incomplete のSandboxは、別途承認されたSetupだけで
  S90とS99をresumeする。
- Gmail label、専用Calendar、Properties、owner edit trigger、Task/Ledger/Dashboard
  を手動で複製、削除、上書き、修復しない。
- OAuth、Provider設定、deployment、`clasp push`、Automation、trigger有効化を
  この資料から実施しない。
- 真のQuick Diagnostic FAIL、hash不一致、予期しない権限要求では停止し、
  `STOP_AND_ROLLBACK_CHECKLIST_ja.md`に従う。

これは Phase 8B PASS、Phase 8C GO、production ready、pilot ready を意味しない。
